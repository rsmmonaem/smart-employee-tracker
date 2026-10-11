import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { getSessionContext } from '@/utils/supabase/auth-context'
import {
  formatLocalDateString,
  getTodayInTimezone,
  DEFAULT_TIMEZONE,
  getTargetTimeMs,
  parseClockInMinutes,
} from '@/utils/date'

export const dynamic = 'force-dynamic'

function formatDuration(totalSeconds: number): string {
  if (totalSeconds <= 0) return '00h 00m'
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  return `${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m`
}

export async function GET(req: Request) {
  try {
    const session = await getSessionContext()
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createAdminClient()

    // Fetch platform settings for organization timezone
    const { data: settingsRow } = await supabase
      .from('platform_settings')
      .select('value')
      .eq('key', 'organization_track_settings')
      .maybeSingle()

    const orgTimezone: string = settingsRow?.value?.timezone || DEFAULT_TIMEZONE
    const todayStr = getTodayInTimezone(orgTimezone)

    const { searchParams } = new URL(req.url)
    const targetDate = searchParams.get('date') || todayStr
    const isTargetToday = targetDate === todayStr

    const nowMs = Date.now()

    const expectedClockInStr: string = settingsRow?.value?.expectedClockIn || '10:00 AM'
    const expectedClockOutStr: string = settingsRow?.value?.expectedClockOut || '19:00'
    const expectedInMinutes = parseClockInMinutes(expectedClockInStr, 600) // 10:00 AM = 600
    const expectedOutMinutes = parseClockInMinutes(expectedClockOutStr, 1140) // 07:00 PM = 1140

    const shiftStartMs = getTargetTimeMs(targetDate, expectedInMinutes, orgTimezone)
    const shiftEndMs = getTargetTimeMs(targetDate, expectedOutMinutes, orgTimezone)
    const startOfTodayMs = getTargetTimeMs(todayStr, 0, orgTimezone)
    const startOfTodayIso = new Date(startOfTodayMs).toISOString()

    // Auto-close any stale OPEN sessions from previous dates so they don't leak into today
    await supabase
      .from('attendance_sessions')
      .update({
        status: 'CLOSED',
        clocked_out_at: new Date(startOfTodayMs - 1000).toISOString(),
      })
      .eq('status', 'OPEN')
      .lt('clocked_in_at', startOfTodayIso)

    // Heal any sessions that started before today but leaked clocked_out_at past yesterday's midnight
    await supabase
      .from('attendance_sessions')
      .update({
        status: 'CLOSED',
        clocked_out_at: new Date(startOfTodayMs - 1000).toISOString(),
      })
      .lt('clocked_in_at', startOfTodayIso)
      .gt('clocked_out_at', new Date(startOfTodayMs - 1000).toISOString())

    // Clamp any future clocked_out_at timestamps on Today to now
    await supabase
      .from('attendance_sessions')
      .update({
        clocked_out_at: new Date(nowMs).toISOString(),
      })
      .gt('clocked_out_at', new Date(nowMs).toISOString())
      .gte('clocked_in_at', startOfTodayIso)

    let usersQuery = supabase
      .from('users')
      .select('id, full_name, email, role, avatar_url, tenant_id')
      .order('full_name', { ascending: true })

    if (!session.isSuperAdmin) {
      if (!session.tenantId) {
        return NextResponse.json({ success: true, date: targetDate, riskUsers: [], summary: null })
      }
      usersQuery = usersQuery.eq('tenant_id', session.tenantId)
    }

    const { data: dbUsers, error: usersErr } = await usersQuery
    if (usersErr) {
      return NextResponse.json({ success: false, error: usersErr.message }, { status: 500 })
    }

    const allUsers = dbUsers || []
    const userIds = allUsers.map((u) => u.id)

    if (userIds.length === 0) {
      return NextResponse.json({
        success: true,
        date: targetDate,
        riskUsers: [],
        summary: {
          criticalCount: 0,
          warningCount: 0,
          burnoutCount: 0,
          healthyCount: 0,
          totalCount: 0,
        },
      })
    }

    const queryStart = new Date(new Date(targetDate).getTime() - 24 * 3600 * 1000).toISOString()
    const queryEnd = new Date(new Date(targetDate).getTime() + 48 * 3600 * 1000).toISOString()

    // 1. Fetch Sessions
    const { data: rawSessions } = await supabase
      .from('attendance_sessions')
      .select('*')
      .in('user_id', userIds)
      .gte('clocked_in_at', queryStart)
      .lte('clocked_in_at', queryEnd)

    // 2. Fetch Activity Events
    const { data: rawEvents } = await supabase
      .from('activity_events')
      .select('user_id, app_name, classification, started_at, ended_at')
      .in('user_id', userIds)
      .gte('started_at', queryStart)
      .lte('started_at', queryEnd)
      .limit(20000)

    const sessions = (rawSessions || []).filter((s) => formatLocalDateString(s.clocked_in_at, orgTimezone) === targetDate)
    const events = (rawEvents || []).filter((e) => formatLocalDateString(e.started_at, orgTimezone) === targetDate)

    const riskUsersList: any[] = []
    let criticalCount = 0
    let warningCount = 0
    let burnoutCount = 0
    let healthyCount = 0

    allUsers.forEach((u) => {
      const userSessions = sessions.filter((s) => s.user_id === u.id)
      const userEvents = events.filter((e) => e.user_id === u.id)
      const name = u.full_name || u.email.split('@')[0]
      const avatar = name.charAt(0).toUpperCase()

      let totalWorkSec = 0
      let totalBreakSec = 0

      const intervals: { start: number; end: number }[] = []
      userSessions.forEach((s) => {
        let inT = new Date(s.clocked_in_at).getTime()
        let outT = s.clocked_out_at ? new Date(s.clocked_out_at).getTime() : nowMs

        // If today, clamp to current time
        if (isTargetToday) {
          if (inT >= nowMs) return
          if (outT > nowMs) outT = nowMs

          // If session clocked in before shift start (10:00 AM):
          // Check if user had verified activity events before shiftStartMs.
          // If no verified events before 10:00 AM, shift only counts from shiftStartMs (10:00 AM)!
          if (inT < shiftStartMs) {
            const hasEarlyEvents = userEvents.some(
              (e) => new Date(e.started_at).getTime() < shiftStartMs
            )
            if (!hasEarlyEvents) {
              inT = shiftStartMs
            }
          }
        }

        if (outT > inT) {
          intervals.push({ start: inT, end: outT })
        }
        totalBreakSec += s.total_break_sec || 0
      })

      intervals.sort((a, b) => a.start - b.start)
      const merged: { start: number; end: number }[] = []
      for (const int of intervals) {
        if (merged.length === 0) {
          merged.push({ ...int })
        } else {
          const last = merged[merged.length - 1]
          if (int.start <= last.end) {
            last.end = Math.max(last.end, int.end)
          } else {
            merged.push({ ...int })
          }
        }
      }

      merged.forEach((m) => {
        totalWorkSec += Math.floor((m.end - m.start) / 1000)
      })

      let idleSec = 0
      let unprodSec = 0
      let prodSec = 0

      userEvents.forEach((ev) => {
        const dur = Math.max(1, Math.round((new Date(ev.ended_at).getTime() - new Date(ev.started_at).getTime()) / 1000))
        const appL = (ev.app_name || '').toLowerCase()
        if (appL.includes('idle') || (ev.classification === 'NEUTRAL' && appL.includes('away'))) {
          idleSec += dur
        } else if (ev.classification === 'UNPRODUCTIVE') {
          unprodSec += dur
        } else if (ev.classification === 'PRODUCTIVE') {
          prodSec += dur
        }
      })

      // If user has not worked or has less than 1 minute of work, skip from active leaderboard/risk assessment
      const activeEffectiveSec = Math.max(0, totalWorkSec - totalBreakSec)
      if (activeEffectiveSec < 60 && userEvents.length === 0) {
        return
      }

      // If user has sessions but ZERO activity events (unattended ghost session / laptop left on):
      // They did not do active work, so prodPercent = 0, idlePercent = 100%!
      let idlePercent = 0
      let unprodPercent = 0
      let prodPercent = 0

      if (userEvents.length === 0) {
        idlePercent = 100
        prodPercent = 0
        unprodPercent = 0
      } else {
        const totalEventSec = idleSec + unprodSec + prodSec || 1
        idlePercent = Math.min(100, Math.round((idleSec / totalEventSec) * 100))
        unprodPercent = Math.min(100, Math.round((unprodSec / totalEventSec) * 100))
        prodPercent = Math.min(100, Math.round((prodSec / totalEventSec) * 100))
      }

      // Check Late
      const firstSession = userSessions[0]
      let isLate = false
      if (firstSession) {
        const inD = new Date(firstSession.clocked_in_at)
        const bdH = (inD.getUTCHours() + 6) % 24
        const bdM = inD.getUTCMinutes()
        isLate = bdH > 10 || (bdH === 10 && bdM > 15)
      }

      // Check Burnout: working > 5 hours with zero break
      const isBurnout = totalWorkSec > 18000 && totalBreakSec < 300

      // Performance Score (0-100%)
      // If user has no activity events or 0 productive work, score is 0% (unverified)
      let performanceScore = 0
      if (userEvents.length === 0 || prodSec === 0) {
        performanceScore = 0
      } else {
        performanceScore = Math.max(
          10,
          Math.min(
            100,
            Math.round((prodPercent * 0.5) + ((100 - idlePercent) * 0.3) + (isLate ? 10 : 20))
          )
        )
      }

      // Risk Evaluation
      let riskLevel: 'CRITICAL' | 'WARNING' | 'ADVISORY' | 'HEALTHY' = 'HEALTHY'
      const triggers: string[] = []

      if (userEvents.length === 0 && totalWorkSec > 0) {
        riskLevel = 'CRITICAL'
        triggers.push('Unattended Session (No app or user input detected)')
      } else if (idlePercent >= 35) {
        riskLevel = 'CRITICAL'
        triggers.push(`Excessive Inactivity (${idlePercent}% Idle Time)`)
      }
      if (unprodPercent >= 30) {
        riskLevel = 'CRITICAL'
        triggers.push(`High Distraction (${unprodPercent}% Unproductive Apps)`)
      }
      if (riskLevel !== 'CRITICAL' && (idlePercent >= 20 || unprodPercent >= 18 || isLate)) {
        riskLevel = 'WARNING'
        if (idlePercent >= 20) triggers.push(`High Idle (${idlePercent}%)`)
        if (unprodPercent >= 18) triggers.push(`Unproductive Time (${unprodPercent}%)`)
        if (isLate) triggers.push('Late Clock-in')
      }
      if (riskLevel === 'HEALTHY' && isBurnout) {
        riskLevel = 'ADVISORY'
        triggers.push('Burnout Warning (Worked >5h without break)')
      }

      if (riskLevel === 'CRITICAL') criticalCount++
      else if (riskLevel === 'WARNING') warningCount++
      else if (riskLevel === 'ADVISORY') burnoutCount++
      else healthyCount++

      riskUsersList.push({
        id: u.id,
        name,
        email: u.email,
        avatar,
        role: u.role,
        riskLevel,
        triggers,
        performanceScore,
        workedHours: formatDuration(totalWorkSec),
        idleTime: formatDuration(idleSec),
        idlePercent,
        unproductiveHours: formatDuration(unprodSec),
        unproductivePercent: unprodPercent,
        productiveHours: formatDuration(prodSec),
        productivePercent: prodPercent,
        isLate,
        isBurnout,
        lastActive: userEvents[userEvents.length - 1]?.ended_at || firstSession?.clocked_in_at || null,
      })
    })

    // Sort: CRITICAL first, then WARNING, then ADVISORY, then HEALTHY
    const priority = { CRITICAL: 1, WARNING: 2, ADVISORY: 3, HEALTHY: 4 }
    riskUsersList.sort((a, b) => priority[a.riskLevel as keyof typeof priority] - priority[b.riskLevel as keyof typeof priority])

    return NextResponse.json({
      success: true,
      date: targetDate,
      riskUsers: riskUsersList,
      summary: {
        criticalCount,
        warningCount,
        burnoutCount,
        healthyCount,
        totalTracked: riskUsersList.length,
      },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('GET /api/admin/risk-users error:', err)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
