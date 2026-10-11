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

function formatClockTime(date: Date, timeZone: string = 'Asia/Dhaka'): string {
  try {
    return date.toLocaleTimeString('en-US', {
      timeZone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
  } catch {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
  }
}

function getTimezoneMinutes(date: Date, timeZone: string = 'Asia/Dhaka'): number {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hour12: false,
    })
    const parts = formatter.formatToParts(date)
    let h = 0
    let m = 0
    let s = 0
    for (const part of parts) {
      if (part.type === 'hour') {
        const val = parseInt(part.value, 10)
        h = val === 24 ? 0 : val
      }
      if (part.type === 'minute') {
        m = parseInt(part.value, 10)
      }
      if (part.type === 'second') {
        s = parseInt(part.value, 10)
      }
    }
    return h * 60 + m + s / 60
  } catch {
    return date.getHours() * 60 + date.getMinutes() + date.getSeconds() / 60
  }
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

let cachedAuthMap: Map<string, any> | null = null
let cachedAuthTime = 0
let lastHealTimestamp = 0
const timelineCache = new Map<string, { timestamp: number; payload: any }>()

export async function GET(req: Request) {
  try {
    const session = await getSessionContext()
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const targetDateParam = searchParams.get('date') || ''
    const cacheKey = `${session.tenantId || 'global'}_${targetDateParam || 'today'}_${session.userId || 'all'}`
    const nowMs = Date.now()

    // 1. Fast cache check (5 second window)
    const cachedEntry = timelineCache.get(cacheKey)
    if (cachedEntry && nowMs - cachedEntry.timestamp < 5000) {
      return NextResponse.json(cachedEntry.payload)
    }

    const supabase = createAdminClient()

    // Fetch platform settings for organization timezone with Tenant Isolation
    const tenantKey = session.tenantId ? `organization_track_settings_${session.tenantId}` : null
    const keysToFetch = tenantKey ? [tenantKey, 'organization_track_settings'] : ['organization_track_settings']
    const { data: settingsRows } = await supabase
      .from('platform_settings')
      .select('key, value')
      .in('key', keysToFetch)

    const tenantRow = settingsRows?.find((r) => r.key === tenantKey)
    const defaultRow = settingsRows?.find((r) => r.key === 'organization_track_settings')
    const settingsRow = tenantRow || defaultRow

    const orgTimezone: string = settingsRow?.value?.timezone || 'Asia/Dhaka'
    const todayStr = getLocalDateString(new Date().toISOString(), orgTimezone)
    const targetDate = targetDateParam || todayStr
    const isTargetToday = targetDate === todayStr

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

    // Auth metadata for teams (Cached for 60 seconds)
    if (!cachedAuthMap || nowMs - cachedAuthTime > 60000) {
      try {
        const { data: authData } = await supabase.auth.admin.listUsers()
        cachedAuthMap = new Map((authData?.users || []).map((u) => [u.id, u.user_metadata || {}]))
        cachedAuthTime = nowMs
      } catch {
        // Fallback to empty map if auth admin fails
        if (!cachedAuthMap) cachedAuthMap = new Map()
      }
    }
    const authMap = cachedAuthMap

    // Exact 24-hour boundary for targetDate in organization timezone (plus 2 hour buffer for edge overlap)
    const targetDayStartMs = getTargetTimeMs(targetDate, 0, orgTimezone) - 2 * 3600 * 1000
    const targetDayEndMs = getTargetTimeMs(targetDate, 1440, orgTimezone) + 2 * 3600 * 1000
    const targetDayStartIso = new Date(targetDayStartMs).toISOString()
    const targetDayEndIso = new Date(targetDayEndMs).toISOString()

    // 2. Fetch real activity events per user in parallel with range pagination to bypass PostgREST max-rows cap
    const userEventsMap = new Map<string, any[]>()

    await Promise.all(
      userIds.map(async (uid) => {
        try {
          const allUserEvents: any[] = []
          const pageSize = 1000
          let from = 0
          const maxRowsPerUser = 20000 // allows up to 28+ hours of continuous tracking

          while (from < maxRowsPerUser) {
            let q = supabase
              .from('activity_events')
              .select('id, user_id, app_name, window_title, started_at, ended_at, classification, domain')
              .eq('user_id', uid)
              .gte('started_at', targetDayStartIso)
              .lte('started_at', targetDayEndIso)
              .order('started_at', { ascending: true })
              .range(from, from + pageSize - 1)

            if (session.tenantId) {
              q = q.eq('tenant_id', session.tenantId)
            }

            const { data, error } = await q
            if (error) {
              console.warn(`Activity events query error for user ${uid} (range ${from}):`, error.message)
              break
            }
            if (!data || data.length === 0) break
            allUserEvents.push(...data)
            if (data.length < pageSize) break
            from += pageSize
          }

          userEventsMap.set(uid, allUserEvents)
        } catch (e: any) {
          console.warn(`Activity events query exception for user ${uid}:`, e?.message)
          userEventsMap.set(uid, [])
        }
      })
    )

    const startOfTodayMs = getTargetTimeMs(todayStr, 0, orgTimezone)
    const startOfTodayIso = new Date(startOfTodayMs).toISOString()

    // Run session healing updates at most once every 5 minutes to avoid slamming Postgres with UPDATE queries on every GET request
    if (nowMs - lastHealTimestamp > 300000) {
      lastHealTimestamp = nowMs

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
    }

    // 3. Fetch attendance sessions strictly for those userIds with Tenant Isolation
    let sessionsQuery = supabase
      .from('attendance_sessions')
      .select('*')
      .in('user_id', userIds)
      .gte('clocked_in_at', targetDayStartIso)
      .lte('clocked_in_at', targetDayEndIso)
      .order('clocked_in_at', { ascending: true })
      .limit(5000)

    if (session.tenantId) {
      sessionsQuery = sessionsQuery.eq('tenant_id', session.tenantId)
    }

    const { data: sessions } = await sessionsQuery

    // 4. Fetch screenshots strictly for those userIds with Tenant Isolation
    let screenshotsQuery = supabase
      .from('screenshots')
      .select('id, user_id, taken_at')
      .in('user_id', userIds)
      .gte('taken_at', targetDayStartIso)
      .lte('taken_at', targetDayEndIso)
      .order('taken_at', { ascending: true })
      .limit(10000)

    if (session.tenantId) {
      screenshotsQuery = screenshotsQuery.eq('tenant_id', session.tenantId)
    }

    const { data: screenshots } = await screenshotsQuery

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
      const rawUserEvents = userEventsMap.get(user.id) || []
      const userEvents = rawUserEvents.filter(
        (e) => getLocalDateString(e.started_at, orgTimezone) === targetDate
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
        userEvents.sort((a, b) => new Date(a.started_at).getTime() - new Date(b.started_at).getTime())

        let currentSeg: {
          id: string
          startMs: number
          endMs: number
          type: ActivityType
          appName: string
          windowTitle: string
        } | null = null

        const commitSegment = (seg: {
          id: string
          startMs: number
          endMs: number
          type: ActivityType
          appName: string
          windowTitle: string
        }) => {
          const startD = new Date(seg.startMs)
          const endD = new Date(seg.endMs)
          const startMin = getTimezoneMinutes(startD, orgTimezone)
          const diffSec = Math.max(5, Math.round((seg.endMs - seg.startMs) / 1000))
          const durationMin = Math.max(0.08, diffSec / 60)

          segments.push({
            id: seg.id,
            startMin,
            durationMin,
            type: seg.type,
            appName: seg.appName,
            windowTitle: seg.windowTitle,
            startTimeStr: formatClockTime(startD, orgTimezone),
            endTimeStr: formatClockTime(endD, orgTimezone),
            durationStr: formatDuration(diffSec),
          })
        }

        userEvents.forEach((ev, idx) => {
          const startMs = new Date(ev.started_at).getTime()
          let endMs = new Date(ev.ended_at).getTime()
          if (endMs <= startMs) endMs = startMs + 5000

          if (isTargetToday) {
            if (startMs >= nowMs) return
            if (endMs > nowMs) endMs = nowMs
          }

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

          // Merge consecutive events if same app, same classification, and gap <= 60 seconds
          if (
            currentSeg &&
            currentSeg.type === type &&
            currentSeg.appName === segAppName &&
            startMs <= currentSeg.endMs + 60000
          ) {
            currentSeg.endMs = Math.max(currentSeg.endMs, endMs)
          } else {
            if (currentSeg) {
              commitSegment(currentSeg)
            }

            const adjustedStartMs = currentSeg ? Math.max(startMs, currentSeg.endMs) : startMs
            currentSeg = {
              id: ev.id || `seg-${idx}`,
              startMs: adjustedStartMs,
              endMs: Math.max(adjustedStartMs + 5000, endMs),
              type,
              appName: segAppName,
              windowTitle: segWindowTitle,
            }
          }
        })

        if (currentSeg) {
          commitSegment(currentSeg)
        }
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

          const startMin = getTimezoneMinutes(startD, orgTimezone)

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
            startTimeStr: formatClockTime(startD, orgTimezone),
            endTimeStr: isOngoing ? 'In Progress' : formatClockTime(endD, orgTimezone),
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

        const startMin = getTimezoneMinutes(firstShot, orgTimezone)
        const diffSec = Math.max(60, Math.round((lastShot.getTime() - firstShot.getTime()) / 1000))
        const durationMin = Math.max(1, Math.round(diffSec / 60))

        segments.push({
          id: `shot-seg-${user.id}`,
          startMin,
          durationMin,
          type: 'IDLE',
          appName: 'Idle Time',
          windowTitle: `${userScreenshots.length} screenshots recorded (No active work)`,
          startTimeStr: formatClockTime(firstShot, orgTimezone),
          endTimeStr: formatClockTime(lastShot, orgTimezone),
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

    const payload = {
      success: true,
      date: targetDate,
      totalUsers: timelineRows.length,
      timelines: timelineRows,
    }

    // Cache the successful response for 5 seconds
    timelineCache.set(cacheKey, { timestamp: nowMs, payload })

    return NextResponse.json(payload)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('Timeline API GET error:', err)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
