import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { getSessionContext } from '@/utils/supabase/auth-context'

export const dynamic = 'force-dynamic'

const START_HOUR = 10
const TOTAL_MINUTES = 570 // 10:00 AM to 19:30 PM (9.5 hours)

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

export async function GET(req: Request) {
  try {
    const session = await getSessionContext()
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const targetDate = searchParams.get('date') || new Date().toISOString().slice(0, 10)
    const supabase = createAdminClient()

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

    const startOfDay = `${targetDate}T00:00:00.000Z`
    const endOfDay = `${targetDate}T23:59:59.999Z`

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

    // 2. Fetch real activity events strictly for those userIds
    const { data: events } = await supabase
      .from('activity_events')
      .select('*')
      .in('user_id', userIds)
      .gte('started_at', startOfDay)
      .lte('started_at', endOfDay)
      .order('started_at', { ascending: true })

    // 3. Fetch attendance sessions strictly for those userIds
    const { data: sessions } = await supabase
      .from('attendance_sessions')
      .select('*')
      .in('user_id', userIds)
      .gte('clocked_in_at', startOfDay)
      .lte('clocked_in_at', endOfDay)

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
      const userEvents = (events || []).filter((e) => e.user_id === user.id)
      const userSession = (sessions || []).find((s) => s.user_id === user.id)

      const segments: Segment[] = []

      userEvents.forEach((ev, idx) => {
        const startD = new Date(ev.started_at)
        const endD = new Date(ev.ended_at)

        // Use local hours to accurately match the employee's work day (10:00 - 19:30)
        const startH = startD.getHours()
        const startM = startD.getMinutes()
        const startMinFromTen = Math.max(0, Math.min(TOTAL_MINUTES, (startH - START_HOUR) * 60 + startM))

        const diffSec = Math.max(5, Math.round((endD.getTime() - startD.getTime()) / 1000))
        const durationMin = Math.max(1, Math.round(diffSec / 60))

        let type: ActivityType = 'NEUTRAL'
        const appLower = (ev.app_name || '').toLowerCase()
        const winLower = (ev.window_title || '').toLowerCase()

        if (appLower.includes('untracked') || winLower.includes('offline') || winLower.includes('away')) {
          type = 'UNTRACKED'
        } else if (appLower.includes('lunch') || winLower.includes('lunch') || winLower.includes('break period')) {
          type = 'NOT_IN_WORK'
        } else if (appLower.includes('idle') || winLower.includes('idle')) {
          type = 'IDLE'
        } else if (ev.classification === 'PRODUCTIVE') {
          type = 'PRODUCTIVE'
        } else if (ev.classification === 'UNPRODUCTIVE') {
          type = 'UNPRODUCTIVE'
        }

        const prev = segments[segments.length - 1]
        if (prev && prev.type === type && prev.appName === ev.app_name && startMinFromTen <= prev.startMin + prev.durationMin + 1) {
          prev.durationMin += durationMin
          prev.endTimeStr = formatClockTime(endD)
          prev.durationStr = formatDuration(prev.durationMin * 60)
        } else {
          segments.push({
            id: ev.id || `seg-${idx}`,
            startMin: startMinFromTen,
            durationMin,
            type,
            appName: ev.app_name,
            windowTitle: ev.window_title || 'Application Window',
            startTimeStr: formatClockTime(startD),
            endTimeStr: formatClockTime(endD),
            durationStr: formatDuration(diffSec),
          })
        }
      })

      const name = user.full_name || user.email.split('@')[0]

      return {
        id: user.id,
        name,
        email: user.email,
        role: user.role === 'TENANT_ADMIN' ? 'Tenant Admin' : 'Full Stack Engineer',
        team: primaryTeam,
        teams: userTeams.length > 0 ? userTeams : [primaryTeam],
        hasClockedIn: !!userSession,
        clockedInAt: userSession?.clocked_in_at || null,
        clockedOutAt: userSession?.clocked_out_at || null,
        hasEvents: segments.length > 0,
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
