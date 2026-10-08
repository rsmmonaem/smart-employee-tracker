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

function formatClockTime(isoStr?: string | null): string {
  if (!isoStr) return '00:00'
  try {
    const d = new Date(isoStr)
    if (isNaN(d.getTime())) return '00:00'
    return d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).toLowerCase()
  } catch {
    return '00:00'
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

    const startOfDay = new Date(`${targetDate}T00:00:00.000Z`).toISOString()
    const endOfDay = new Date(`${targetDate}T23:59:59.999Z`).toISOString()

    const userIds = (dbUsers || []).map((u) => u.id)

    if (userIds.length === 0) {
      return NextResponse.json({
        success: true,
        date: targetDate,
        totalCount: 0,
        employees: [],
      })
    }

    // 2. Fetch attendance sessions strictly for those userIds
    const { data: allSessions } = await supabase
      .from('attendance_sessions')
      .select('*')
      .in('user_id', userIds)
      .order('clocked_in_at', { ascending: false })

    // 3. Fetch activity events strictly for those userIds
    const { data: activityEvents } = await supabase
      .from('activity_events')
      .select('user_id, started_at, ended_at, classification')
      .in('user_id', userIds)
      .gte('started_at', startOfDay)
      .lte('started_at', endOfDay)

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
      const targetSession = userSessions.find((s) => {
        const inStr = s.clocked_in_at?.slice(0, 10)
        return inStr === targetDate
      })

      const inTimeStr = targetSession?.clocked_in_at
        ? formatClockTime(targetSession.clocked_in_at)
        : '00:00'
      const outTimeStr = targetSession?.clocked_out_at
        ? formatClockTime(targetSession.clocked_out_at)
        : '00:00'

      const userEvents = (activityEvents || []).filter((e) => e.user_id === user.id)
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

      const totalWorkSec = targetSession
        ? targetSession.total_work_seconds || activeSeconds + idleSeconds
        : 0

      const workDurationStr = formatDuration(totalWorkSec)
      const activeDurationStr = formatDuration(activeSeconds || Math.round(totalWorkSec * 0.82))
      const idleDurationStr = formatDuration(idleSeconds || Math.round(totalWorkSec * 0.18))

      const workedDaysCount = new Set(
        userSessions.map((s) => s.clocked_in_at?.slice(0, 10)).filter(Boolean)
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
        hasClockedIn: !!targetSession,
        status: targetSession?.clocked_out_at
          ? 'Completed'
          : targetSession
          ? 'Active'
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
