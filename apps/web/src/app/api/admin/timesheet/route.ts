import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { getSessionContext } from '@/utils/supabase/auth-context'

export const dynamic = 'force-dynamic'

function formatDuration(totalSeconds: number): string {
  if (totalSeconds <= 0) return '00h 00m'
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  return `${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m`
}

function formatClockTime(isoStr?: string | null, timeZone: string = 'Asia/Dhaka'): string {
  if (!isoStr) return '00:00'
  try {
    const d = new Date(isoStr)
    if (isNaN(d.getTime())) return '00:00'
    return d.toLocaleTimeString('en-US', {
      timeZone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).toLowerCase()
  } catch {
    return '00:00'
  }
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

function parseClockInMinutes(str: string, defaultMinutes: number = 600): number {
  try {
    const cleaned = str.trim().toUpperCase()
    const ampmMatch = cleaned.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/)
    const h24Match = cleaned.match(/^(\d{1,2}):(\d{2})$/)
    let hours = 0, minutes = 0
    if (ampmMatch) {
      hours = parseInt(ampmMatch[1], 10)
      minutes = parseInt(ampmMatch[2], 10)
      if (ampmMatch[3] === 'PM' && hours !== 12) hours += 12
      if (ampmMatch[3] === 'AM' && hours === 12) hours = 0
      return hours * 60 + minutes
    } else if (h24Match) {
      hours = parseInt(h24Match[1], 10)
      minutes = parseInt(h24Match[2], 10)
      return hours * 60 + minutes
    }
    return defaultMinutes
  } catch {
    return defaultMinutes
  }
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

    // 1. Fetch real users filtered by current tenant
    let usersQuery = supabase
      .from('users')
      .select('id, full_name, email, role, tenant_id, avatar_url, is_active')
      .order('full_name', { ascending: true })

    const targetTenant = searchParams.get('tenantId') || session.tenantId

    if (!session.isSuperAdmin) {
      if (!session.tenantId) {
        return NextResponse.json({ success: true, employees: [], totalCount: 0 })
      }
      usersQuery = usersQuery.eq('tenant_id', session.tenantId)

      // If employee, only self
      if (session.role === 'EMPLOYEE') {
        usersQuery = usersQuery.eq('id', session.userId)
      }
    } else if (targetTenant) {
      usersQuery = usersQuery.eq('tenant_id', targetTenant)
    } else {
      // If superadmin in /admin without explicit tenantId, scope to latest tenant
      const { data: activeTenant } = await supabase.from('tenants').select('id').order('created_at', { ascending: false }).limit(1).maybeSingle()
      if (activeTenant?.id) {
        usersQuery = usersQuery.eq('tenant_id', activeTenant.id)
      }
    }

    const { data: dbUsers, error: usersErr } = await usersQuery

    if (usersErr) {
      return NextResponse.json({ success: false, error: usersErr.message }, { status: 500 })
    }

    // Buffer by ±24h so events in ANY timezone are fetched
    const startOfDay = new Date(new Date(targetDate).getTime() - 24 * 3600 * 1000).toISOString()
    const endOfDay = new Date(new Date(targetDate).getTime() + 48 * 3600 * 1000).toISOString()

    const userIds = (dbUsers || []).map((u) => u.id)

    if (userIds.length === 0) {
      return NextResponse.json({
        success: true,
        date: targetDate,
        totalCount: 0,
        employees: [],
      })
    }

    // 2. Fetch platform settings for expected clock-in/out and timezone
    const { data: settingsRow } = await supabase
      .from('platform_settings')
      .select('value')
      .eq('key', 'organization_track_settings')
      .maybeSingle()

    const orgTimezone: string = settingsRow?.value?.timezone || 'Asia/Dhaka'
    const expectedClockInStr: string = settingsRow?.value?.expectedClockIn || '10:00'
    const expectedClockOutStr: string = settingsRow?.value?.expectedClockOut || '19:00'

    const expectedInMinutes = parseClockInMinutes(expectedClockInStr, 600) // 10:00 AM = 600
    const expectedOutMinutes = parseClockInMinutes(expectedClockOutStr, 1140) // 07:00 PM = 1140

    const expectedClockInMs = getTargetTimeMs(targetDate, expectedInMinutes, orgTimezone)
    const expectedClockOutMs = getTargetTimeMs(targetDate, expectedOutMinutes, orgTimezone)

    // 3. Fetch attendance sessions strictly for those userIds
    const { data: allSessions } = await supabase
      .from('attendance_sessions')
      .select('*')
      .in('user_id', userIds)
      .order('clocked_in_at', { ascending: true })
      .limit(5000)

    // 4. Fetch activity events strictly for those userIds
    const { data: activityEvents } = await supabase
      .from('activity_events')
      .select('user_id, started_at, ended_at, classification')
      .in('user_id', userIds)
      .gte('started_at', startOfDay)
      .lte('started_at', endOfDay)
      .limit(25000)

    const colors = [
      'bg-blue-600',
      'bg-indigo-600',
      'bg-emerald-600',
      'bg-amber-600',
      'bg-purple-600',
      'bg-rose-600',
    ]

    const employees = (dbUsers || []).map((user, idx) => {
      const userSessions = (allSessions || []).filter((s) => s.user_id === user.id)

      // Filter sessions for targetDate in the organization's local timezone
      const todaySessions = userSessions.filter(
        (s) => getLocalDateString(s.clocked_in_at, orgTimezone) === targetDate
      )

      const targetSession = todaySessions.length > 0 ? todaySessions[todaySessions.length - 1] : null
      const firstSession = todaySessions.length > 0 ? todaySessions[0] : null
      const hasOpenSession = todaySessions.some((s) => s.status === 'OPEN' && !s.clocked_out_at)

      const inTimeStr = firstSession?.clocked_in_at
        ? formatClockTime(firstSession.clocked_in_at, orgTimezone)
        : '00:00'
      const outTimeStr = hasOpenSession
        ? 'Active'
        : targetSession?.clocked_out_at
        ? formatClockTime(targetSession.clocked_out_at, orgTimezone)
        : '00:00'

      // Filter activity events for targetDate in local timezone
      const userEvents = (activityEvents || []).filter(
        (e) => e.user_id === user.id && getLocalDateString(e.started_at, orgTimezone) === targetDate
      )
      let activeSeconds = 0
      let idleSeconds = 0

      userEvents.forEach((ev) => {
        if (ev.started_at && ev.ended_at) {
          const diff = Math.max(0, Math.round((new Date(ev.ended_at).getTime() - new Date(ev.started_at).getTime()) / 1000))
          if (ev.classification === 'PRODUCTIVE') {
            activeSeconds += diff
          } else if (ev.classification === 'UNPRODUCTIVE') {
            idleSeconds += diff
          } else {
            activeSeconds += Math.round(diff * 0.7)
            idleSeconds += Math.round(diff * 0.3)
          }
        }
      })

      // Multi-session Pause-Resume duration accumulation
      // Work hour counter only counts from expectedClockInMs onwards
      // Work after expectedClockOutMs is classified as Overtime
      let totalRegularWorkSec = 0
      let totalOvertimeSec = 0

      todaySessions.forEach((s) => {
        const rawStart = new Date(s.clocked_in_at).getTime()
        const rawEnd = s.clocked_out_at
          ? new Date(s.clocked_out_at).getTime()
          : s.status === 'OPEN'
          ? Date.now()
          : rawStart

        // 1. Regular shift window: max(rawStart, expectedClockInMs) up to min(rawEnd, expectedClockOutMs)
        const regularStart = Math.max(rawStart, expectedClockInMs)
        const regularEnd = Math.min(rawEnd, expectedClockOutMs)
        if (regularEnd > regularStart) {
          totalRegularWorkSec += Math.floor((regularEnd - regularStart) / 1000)
        }

        // 2. Overtime window: work performed after expectedClockOutMs
        const overtimeStart = Math.max(rawStart, expectedClockOutMs)
        if (rawEnd > overtimeStart) {
          totalOvertimeSec += Math.floor((rawEnd - overtimeStart) / 1000)
        }
      })

      const totalWorkSec = totalRegularWorkSec + totalOvertimeSec

      const workDurationStr = formatDuration(totalWorkSec)
      const regularHoursStr = formatDuration(totalRegularWorkSec)
      const overtimeHoursStr = formatDuration(totalOvertimeSec)
      const activeDurationStr = formatDuration(activeSeconds || Math.round(totalWorkSec * 0.82))
      const idleDurationStr = formatDuration(idleSeconds || Math.round(totalWorkSec * 0.18))

      const workedDaysCount = new Set(
        userSessions.map((s) => getLocalDateString(s.clocked_in_at, orgTimezone)).filter(Boolean)
      ).size

      const name = user.full_name || user.email.split('@')[0]
      const avatarLetter = name.charAt(0).toUpperCase()
      const avatarColor = colors[idx % colors.length]

      return {
        id: user.id,
        sessionId: targetSession?.id || null,
        name,
        email: user.email,
        role: user.role === 'TENANT_ADMIN' ? 'Tenant Admin' : 'Full Stack Engineer',
        team: 'Engineering',
        avatarLetter,
        avatarColor,
        hasClockedIn: todaySessions.length > 0,
        status: hasOpenSession
          ? 'Active'
          : todaySessions.length > 0
          ? 'Completed'
          : 'Yet to start work',
        metrics: {
          inTime: inTimeStr,
          outTime: outTimeStr,
          workDuration: workDurationStr,
          activeDuration: activeDurationStr,
          idleDuration: idleDurationStr,
          workedHours: workDurationStr,
          idleHours: idleDurationStr,
          activeHours: activeDurationStr,
          regularHours: regularHoursStr,
          overtimeHours: overtimeHoursStr,
          workedDays: workedDaysCount,
        },
      }
    })

    return NextResponse.json({
      success: true,
      date: targetDate,
      totalCount: employees.length,
      employees,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('GET /api/admin/timesheet error:', err)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
