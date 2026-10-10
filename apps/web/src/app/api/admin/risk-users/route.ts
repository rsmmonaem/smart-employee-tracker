import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { getSessionContext } from '@/utils/supabase/auth-context'

export const dynamic = 'force-dynamic'

function isSameLocalDate(isoStr?: string | null, targetDateStr?: string): boolean {
  if (!isoStr || !targetDateStr) return false
  const d = new Date(isoStr)
  if (isNaN(d.getTime())) return false
  const localDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  const utcDate = isoStr.slice(0, 10)
  return localDate === targetDateStr || utcDate === targetDateStr
}

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

    const { searchParams } = new URL(req.url)
    const targetDate = searchParams.get('date') || new Date().toISOString().slice(0, 10)
    const supabase = createAdminClient()

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

    const sessions = (rawSessions || []).filter((s) => isSameLocalDate(s.clocked_in_at, targetDate))
    const events = (rawEvents || []).filter((e) => isSameLocalDate(e.started_at, targetDate))

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
      const nowMs = Date.now()
      userSessions.forEach((s) => {
        const inT = new Date(s.clocked_in_at).getTime()
        const outT = s.clocked_out_at ? new Date(s.clocked_out_at).getTime() : nowMs
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
        if (appL.includes('idle') || ev.classification === 'NEUTRAL' && appL.includes('away')) {
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

      const idlePercent = activeEffectiveSec > 0 ? Math.min(100, Math.round((idleSec / activeEffectiveSec) * 100)) : 0
      const unprodPercent = activeEffectiveSec > 0 ? Math.min(100, Math.round((unprodSec / activeEffectiveSec) * 100)) : 0
      const prodPercent = activeEffectiveSec > 0 ? Math.min(100, Math.round((prodSec / activeEffectiveSec) * 100)) : 0

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

      // Performance Score (0-100%) - Minimum 10%
      // Base score is weighted on productive time (up to 50 pts), low idle (up to 30 pts), punctuality (20 pts)
      const performanceScore = Math.max(
        10,
        Math.min(
          100,
          Math.round((prodPercent * 0.5) + ((100 - idlePercent) * 0.3) + (isLate ? 10 : 20))
        )
      )

      // Risk Evaluation
      let riskLevel: 'CRITICAL' | 'WARNING' | 'ADVISORY' | 'HEALTHY' = 'HEALTHY'
      const triggers: string[] = []

      if (idlePercent >= 35) {
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
