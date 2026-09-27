import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'

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
    const { searchParams } = new URL(req.url)
    const targetDate = searchParams.get('date') || '2026-09-09' // default yesterday or today
    const supabase = createAdminClient()

    // 1. Fetch real users
    const { data: dbUsers, error: usersErr } = await supabase
      .from('users')
      .select('id, full_name, email, role, tenant_id')
      .order('full_name', { ascending: true })

    if (usersErr) {
      console.error('Error fetching users for timeline:', usersErr)
      return NextResponse.json({ success: false, error: usersErr.message }, { status: 500 })
    }

    const startOfDay = `${targetDate}T00:00:00.000Z`
    const endOfDay = `${targetDate}T23:59:59.999Z`

    // 2. Fetch real activity events for targetDate
    const { data: events, error: evErr } = await supabase
      .from('activity_events')
      .select('*')
      .gte('started_at', startOfDay)
      .lte('started_at', endOfDay)
      .order('started_at', { ascending: true })

    if (evErr) {
      console.warn('Error fetching activity events:', evErr)
    }

    // 3. Fetch attendance sessions for targetDate to know clock in/out
    const { data: sessions } = await supabase
      .from('attendance_sessions')
      .select('*')
      .gte('clocked_in_at', startOfDay)
      .lte('clocked_in_at', endOfDay)

    // Build timeline rows for each user
    const timelineRows = (dbUsers || []).map((user) => {
      const userEvents = (events || []).filter((e) => e.user_id === user.id)
      const userSession = (sessions || []).find((s) => s.user_id === user.id)

      const segments: Segment[] = []

      // If user has consecutive events, merge or map them
      userEvents.forEach((ev, idx) => {
        const startD = new Date(ev.started_at)
        const endD = new Date(ev.ended_at)

        // Calculate minutes from 10:00 AM (UTC or local)
        const startH = startD.getUTCHours()
        const startM = startD.getUTCMinutes()
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

        // Check if we can merge with previous segment if same app and type within 2 mins
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
        team: 'Engineering',
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
