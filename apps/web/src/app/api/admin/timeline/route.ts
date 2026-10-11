import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { getSessionContext } from '@/utils/supabase/auth-context'

export const dynamic = 'force-dynamic'

const START_HOUR = 10
const TOTAL_MINUTES = 540 // 10:00 AM to 19:00 PM (9 hours: 10:00 AM - 7:00 PM)

type ActivityType =
  | 'PRODUCTIVE'
  | 'UNPRODUCTIVE'
  | 'NEUTRAL'
  | 'IDLE'
  | 'NOT_IN_WORK'
  | 'UNTRACKED'

interface Segment {
  id: string
  startMin: number
  durationMin: number
  type: ActivityType
  appName: string
  windowTitle?: string
  startTimeStr: string
  endTimeStr: string
  durationStr: string
}

function formatClockTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
}

function formatDuration(totalSec: number): string {
  const hours = Math.floor(totalSec / 3600)
  const minutes = Math.floor((totalSec % 3600) / 60)
  const seconds = totalSec % 60
  return `${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`
}

function getLocalDateString(isoStr?: string | null, timeZone: string = 'Asia/Dhaka'): string {
  if (!isoStr) return ''
  try {
    const d = new Date(isoStr)
    return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d)
  } catch {
    return (isoStr || '').slice(0, 10)
  }
}

function getTargetTimeMs(dateStr: string, minutesFromMidnight: number, timeZone: string = 'Asia/Dhaka'): number {
  try {
    const testDate = new Date(`${dateStr}T12:00:00Z`)
    const dtf = new Intl.DateTimeFormat('en-US', {
      timeZone,
      timeZoneName: 'longOffset',
    })
    const parts = dtf.formatToParts(testDate)
    const tzPart = parts.find((p) => p.type === 'timeZoneName')?.value
    let offsetMinutes = 0
    if (tzPart) {
      const match = tzPart.match(/GMT([+-])(\d{1,2}):(\d{2})/)
      if (match) {
        const sign = match[1] === '+' ? 1 : -1
        offsetMinutes = sign * (parseInt(match[2], 10) * 60 + parseInt(match[3], 10))
      }
    }
    const [y, m, d] = dateStr.split('-').map(Number)
    const totalUtcMinutes = minutesFromMidnight - offsetMinutes
    return new Date(Date.UTC(y, m - 1, d, 0, totalUtcMinutes, 0)).getTime()
  } catch {
    return new Date(`${dateStr}T10:00:00Z`).getTime()
  }
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

    const orgTimezone: string = settingsRow?.value?.timezone || 'Asia/Dhaka'
    const todayStr = getLocalDateString(new Date().toISOString(), orgTimezone)

    const { searchParams } = new URL(req.url)
    const targetDate = searchParams.get('date') || todayStr
    const isTargetToday = targetDate === todayStr

    const nowMs = Date.now()
    const now = new Date(nowMs)

    // 1. Fetch real users filtered strictly by tenant
    let usersQuery = supabase
      .from('users')
      .select('id, full_name, email, role, tenant_id')
      .order('full_name', { ascending: true })

    if (!session.isSuperAdmin) {
      if (!session.tenantId) {
        return NextResponse.json({ success: true, timelines: [], totalUsers: 0 })
      }
      usersQuery = usersQuery.eq('tenant_id', session.tenantId)

      if (session.role === 'EMPLOYEE') {
        usersQuery = usersQuery.eq('id', session.userId)
      }
    }

    const { data: dbUsers, error: usersErr } = await usersQuery

    if (usersErr) {
      return NextResponse.json({ success: false, error: usersErr.message }, { status: 500 })
    }

    // 24-hour timezone offset buffer (+/- 24h) so events in ANY client local timezone are fetched
    const startOfDay = new Date(new Date(targetDate).getTime() - 24 * 3600 * 1000).toISOString()
    const endOfDay = new Date(new Date(targetDate).getTime() + 48 * 3600 * 1000).toISOString()

    const userIds = (dbUsers || []).map((u) => u.id)

    if (userIds.length === 0) {
      return NextResponse.json({
        success: true,
        date: targetDate,
        totalUsers: 0,
        timelines: [],
      })
    }

    // Auth metadata for teams
    const { data: authData } = await supabase.auth.admin.listUsers()
    const authMap = new Map((authData?.users || []).map((u) => [u.id, u.user_metadata || {}]))

    // 2. Fetch real activity events strictly for those userIds (allow up to 25000 events to prevent 1000 row truncation)
    const { data: events } = await supabase
      .from('activity_events')
      .select('*')
      .in('user_id', userIds)
      .gte('started_at', startOfDay)
      .lte('started_at', endOfDay)
      .order('started_at', { ascending: true })
      .limit(25000)

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

    // 3. Fetch attendance sessions strictly for those userIds
    const { data: sessions } = await supabase
      .from('attendance_sessions')
      .select('*')
      .in('user_id', userIds)
      .gte('clocked_in_at', startOfDay)
      .lte('clocked_in_at', endOfDay)
      .order('clocked_in_at', { ascending: true })
      .limit(5000)

    // 4. Fetch screenshots strictly for those userIds to support users with screenshots
    const { data: screenshots } = await supabase
      .from('screenshots')
      .select('id, user_id, taken_at')
      .in('user_id', userIds)
      .gte('taken_at', startOfDay)
      .lte('taken_at', endOfDay)
      .order('taken_at', { ascending: true })
      .limit(10000)

    // Build timeline rows
    const timelineRows = (dbUsers || []).map((user) => {
      const meta = authMap.get(user.id) || {}
      let userTeams: string[] = []
      if (Array.isArray(meta.teams)) {
        userTeams = meta.teams.map((t: any) => String(t).trim()).filter(Boolean)
      } else if (typeof meta.teams === 'string' && meta.teams.trim()) {
        userTeams = meta.teams.split(',').map((t: string) => t.trim()).filter(Boolean)
      }
      if (userTeams.length === 0 && meta.team) {
        userTeams = [String(meta.team).trim()]
      }
      const primaryTeam = userTeams[0] || (meta.team || 'General')

      // Strictly filter to events on targetDate in organization timezone
      const userEvents = (events || []).filter(
        (e) => e.user_id === user.id && getLocalDateString(e.started_at, orgTimezone) === targetDate
      )

      // Strictly filter to sessions on targetDate in organization timezone
      const userSessions = (sessions || [])
        .filter((s) => {
          if (s.user_id !== user.id) return false
          const sDate = getLocalDateString(s.clocked_in_at, orgTimezone)
          return sDate === targetDate
        })
        .sort((a, b) => new Date(a.clocked_in_at).getTime() - new Date(b.clocked_in_at).getTime())

      const userSession = userSessions[0] || null

      const userScreenshots = (screenshots || []).filter(
        (s) => s.user_id === user.id && getLocalDateString(s.taken_at, orgTimezone) === targetDate
      )

      const segments: Segment[] = []

      if (userEvents.length > 0) {
        userEvents.forEach((ev, idx) => {
          const startD = new Date(ev.started_at)
          let endD = new Date(ev.ended_at)

          // On Today, strictly discard future events and clamp ongoing ones to now
          if (isTargetToday) {
            if (startD.getTime() >= nowMs) return
            if (endD.getTime() > nowMs) endD = new Date(nowMs)
          }

          // Minutes from midnight (0 to 1440) matching standard 24h timeline
          const startH = startD.getHours()
          const startM = startD.getMinutes()
          const startMin = startH * 60 + startM

          const diffSec = Math.max(5, Math.round((endD.getTime() - startD.getTime()) / 1000))
          const durationMin = Math.max(1, Math.round(diffSec / 60))

          let type: ActivityType = 'NEUTRAL'
          const appLower = (ev.app_name || '').toLowerCase()
          const winLower = (ev.window_title || '').toLowerCase()

          if (appLower.includes('idle') || winLower.includes('idle')) {
            type = 'IDLE'
          } else if (ev.classification === 'PRODUCTIVE') {
            type = 'PRODUCTIVE'
          } else if (ev.classification === 'UNPRODUCTIVE') {
            type = 'UNPRODUCTIVE'
          } else if (appLower.includes('untracked') || winLower.includes('offline') || winLower.includes('away')) {
            type = 'UNTRACKED'
          } else if (appLower.includes('lunch') || winLower.includes('lunch') || winLower.includes('break period')) {
            type = 'NOT_IN_WORK'
          }

          const segAppName = ev.app_name || 'Active Application'
          const segWindowTitle = ev.window_title || 'Application Window'

          const prev = segments[segments.length - 1]
          if (prev && prev.type === type && prev.appName === segAppName && startMin <= prev.startMin + prev.durationMin + 1) {
            prev.durationMin += durationMin
            prev.endTimeStr = formatClockTime(endD)
            prev.durationStr = formatDuration(prev.durationMin * 60)
          } else {
            segments.push({
              id: ev.id || `seg-${idx}`,
              startMin,
              durationMin,
              type,
              appName: segAppName,
              windowTitle: segWindowTitle,
              startTimeStr: formatClockTime(startD),
              endTimeStr: formatClockTime(endD),
              durationStr: formatDuration(diffSec),
            })
          }
        })
      } else if (userSessions.length > 0) {
        // Fallback: If no activity_events recorded, synthesize segments from attendance session(s)
        userSessions.forEach((sess, sIdx) => {
          const startD = new Date(sess.clocked_in_at)
          let endD = sess.clocked_out_at ? new Date(sess.clocked_out_at) : new Date(nowMs)

          // On Today, strictly discard future sessions and clamp to now
          if (isTargetToday) {
            if (startD.getTime() >= nowMs) return
            if (endD.getTime() > nowMs) endD = new Date(nowMs)
          }

          const startH = startD.getHours()
          const startM = startD.getMinutes()
          const startMin = startH * 60 + startM

          const diffSec = Math.max(60, Math.round((endD.getTime() - startD.getTime()) / 1000))
          const durationMin = Math.max(1, Math.round(diffSec / 60))

          const isOngoing = !sess.clocked_out_at || sess.status === 'OPEN' || (isTargetToday && new Date(sess.clocked_out_at).getTime() >= nowMs)

          segments.push({
            id: sess.id || `sess-seg-${sIdx}`,
            startMin,
            durationMin,
            type: 'IDLE',
            appName: 'Idle Time',
            windowTitle: 'Active Tracker Session (No active app activity recorded)',
            startTimeStr: formatClockTime(startD),
            endTimeStr: isOngoing ? 'In Progress' : formatClockTime(endD),
            durationStr: formatDuration(diffSec),
          })
        })
      } else if (userScreenshots.length > 0) {
        // Fallback: If screenshots recorded without activity events or session, synthesize from screenshots
        const firstShot = new Date(userScreenshots[0].taken_at)
        let lastShot = new Date(userScreenshots[userScreenshots.length - 1].taken_at)

        if (isTargetToday) {
          if (firstShot.getTime() >= nowMs) return
          if (lastShot.getTime() > nowMs) lastShot = new Date(nowMs)
        }

        const startH = firstShot.getHours()
        const startM = firstShot.getMinutes()
        const startMin = startH * 60 + startM
        const diffSec = Math.max(60, Math.round((lastShot.getTime() - firstShot.getTime()) / 1000))
        const durationMin = Math.max(1, Math.round(diffSec / 60))

        segments.push({
          id: `shot-seg-${user.id}`,
          startMin,
          durationMin,
          type: 'IDLE',
          appName: 'Idle Time',
          windowTitle: `${userScreenshots.length} screenshots recorded (No active work)`,
          startTimeStr: formatClockTime(firstShot),
          endTimeStr: formatClockTime(lastShot),
          durationStr: formatDuration(diffSec),
        })
      }

      const name = user.full_name || user.email.split('@')[0]

      const fallbackRawEvents =
        userEvents.length > 0
          ? userEvents.map((ev) => ({
              id: ev.id,
              appName: ev.app_name || 'Active Application',
              windowTitle: ev.window_title || 'Application Window',
              startedAt: ev.started_at,
              endedAt: ev.ended_at,
              classification: ev.classification || 'NEUTRAL',
              domain: ev.domain || null,
            }))
          : userSessions.length > 0
          ? userSessions.map((sess) => ({
              id: sess.id,
              appName: 'Idle Time',
              windowTitle: 'Active Tracker Session (No active work recorded)',
              startedAt: sess.clocked_in_at,
              endedAt: sess.clocked_out_at || new Date(nowMs).toISOString(),
              classification: 'IDLE',
              domain: null,
            }))
          : userScreenshots.length > 0
          ? [
              {
                id: `shot-${user.id}`,
                appName: 'Idle Time',
                windowTitle: `${userScreenshots.length} screenshots recorded (No active work)`,
                startedAt: userScreenshots[0].taken_at,
                endedAt: userScreenshots[userScreenshots.length - 1].taken_at,
                classification: 'IDLE',
                domain: null,
              },
            ]
          : []

      return {
        id: user.id,
        name,
        email: user.email,
        role: user.role === 'TENANT_ADMIN' ? 'Tenant Admin' : 'Full Stack Engineer',
        team: primaryTeam,
        teams: userTeams.length > 0 ? userTeams : [primaryTeam],
        hasClockedIn: userSessions.length > 0,
        clockedInAt: userSessions[0]?.clocked_in_at || null,
        clockedOutAt: userSessions.some((s) => !s.clocked_out_at || s.status === 'OPEN')
          ? null
          : userSessions[userSessions.length - 1]?.clocked_out_at || null,
        attendanceSessions: userSessions,
        hasEvents: userEvents.length > 0 || userSessions.length > 0 || userScreenshots.length > 0,
        rawEvents: fallbackRawEvents,
        segments,
      }
    })

    return NextResponse.json({
      success: true,
      date: targetDate,
      totalUsers: timelineRows.length,
      timelines: timelineRows,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('Timeline API GET error:', err)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
