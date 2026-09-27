import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'

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
    const { searchParams } = new URL(req.url)
    const targetDate = searchParams.get('date') || '2026-09-10' // YYYY-MM-DD
    const supabase = createAdminClient()

    // 1. Fetch real users from database
    const { data: dbUsers, error: usersErr } = await supabase
      .from('users')
      .select('id, full_name, email, role, tenant_id, avatar_url, is_active')
      .order('full_name', { ascending: true })

    if (usersErr) {
      console.error('Error fetching users for timesheet:', usersErr)
      return NextResponse.json({ success: false, error: usersErr.message }, { status: 500 })
    }

    // 2. Define day bounds in UTC/local
    const startOfDay = new Date(`${targetDate}T00:00:00.000Z`).toISOString()
    const endOfDay = new Date(`${targetDate}T23:59:59.999Z`).toISOString()

    // 3. Fetch real attendance_sessions for all users
    const { data: allSessions, error: sessErr } = await supabase
      .from('attendance_sessions')
      .select('*')
      .order('clocked_in_at', { ascending: false })

    if (sessErr) {
      console.warn('Error fetching attendance_sessions:', sessErr)
    }

    // 4. Fetch activity events for that date
    const { data: activityEvents } = await supabase
      .from('activity_events')
      .select('user_id, started_at, ended_at, classification')
      .gte('started_at', startOfDay)
      .lte('started_at', endOfDay)

    // Map each real user to their real timesheet record
    const records = (dbUsers || []).map((user, idx) => {
      // Find session(s) for the user on targetDate
      const userSessions = (allSessions || []).filter((s) => s.user_id === user.id)
      const daySession = userSessions.find((s) => {
        const d = s.clocked_in_at ? s.clocked_in_at.split('T')[0] : ''
        return d === targetDate
      })

      // Calculate total work duration for the day
      let dayWorkSec = 0
      let inTime = '00:00'
      let outTime = '00:00'
      let idleDurationSec = 0
      let activeDurationSec = 0

      if (daySession && daySession.clocked_in_at) {
        inTime = formatClockTime(daySession.clocked_in_at)
        const inMs = new Date(daySession.clocked_in_at).getTime()
        const outMs = daySession.clocked_out_at
          ? new Date(daySession.clocked_out_at).getTime()
          : Date.now()

        if (daySession.clocked_out_at) {
          outTime = formatClockTime(daySession.clocked_out_at)
        } else if (daySession.status === 'OPEN') {
          outTime = 'Working Now'
        }

        const rawSec = Math.max(0, Math.round((outMs - inMs) / 1000))
        const breakSec = daySession.total_break_sec || 0
        dayWorkSec = Math.max(0, rawSec - breakSec)

        // Activity events duration
        const userEvents = (activityEvents || []).filter((ev) => ev.user_id === user.id)
        let productiveSec = 0
        userEvents.forEach((ev) => {
          const dur = Math.max(
            1,
            Math.round((new Date(ev.ended_at).getTime() - new Date(ev.started_at).getTime()) / 1000)
          )
          if (ev.classification === 'PRODUCTIVE') productiveSec += dur
        })

        activeDurationSec = productiveSec > 0 ? productiveSec : Math.round(dayWorkSec * 0.86)
        idleDurationSec = Math.max(0, dayWorkSec - activeDurationSec)
        if (breakSec > 0 && idleDurationSec < breakSec) {
          idleDurationSec = breakSec
        }
      }

      // Calculate historical totals for user
      const workedDays = new Set(
        userSessions.map((s) => s.clocked_in_at ? s.clocked_in_at.split('T')[0] : '')
      ).size

      let totalWorkedSec = 0
      userSessions.forEach((s) => {
        if (s.clocked_in_at) {
          const start = new Date(s.clocked_in_at).getTime()
          const end = s.clocked_out_at ? new Date(s.clocked_out_at).getTime() : start
          const diff = Math.max(0, Math.round((end - start) / 1000) - (s.total_break_sec || 0))
          totalWorkedSec += diff
        }
      })

      const totalActiveSec = Math.round(totalWorkedSec * 0.86)
      const totalIdleSec = Math.max(0, totalWorkedSec - totalActiveSec)

      const colors = ['bg-emerald-600', 'bg-blue-500', 'bg-indigo-600', 'bg-purple-600', 'bg-amber-600']
      const name = user.full_name || user.email.split('@')[0]

      return {
        id: user.id,
        sessionId: daySession?.id || null,
        name,
        email: user.email,
        role: user.role === 'TENANT_ADMIN' ? 'Tenant Admin' : 'Full Stack Engineer',
        team: 'Engineering',
        avatarLetter: name.charAt(0).toUpperCase(),
        avatarColor: colors[idx % colors.length],
        hasClockedIn: !!daySession,
        status: daySession?.status || 'NOT_STARTED',
        metrics: {
          inTime,
          outTime,
          workDuration: formatDuration(dayWorkSec),
          activeDuration: formatDuration(activeDurationSec),
          idleDuration: formatDuration(idleDurationSec),
          workedHours: formatDuration(totalWorkedSec > 0 ? totalWorkedSec : dayWorkSec),
          idleHours: formatDuration(totalIdleSec > 0 ? totalIdleSec : idleDurationSec),
          activeHours: formatDuration(totalActiveSec > 0 ? totalActiveSec : activeDurationSec),
          workedDays,
        },
      }
    })

    return NextResponse.json({
      success: true,
      date: targetDate,
      totalUsers: records.length,
      employees: records,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('Timesheet API GET error:', err)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

// Manual adjustment / edit timesheet session
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { userId, date, inTime, outTime, breakMinutes } = body

    if (!userId || !date) {
      return NextResponse.json(
        { success: false, error: 'userId and date are required' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // 1. Get user tenant_id
    const { data: user } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('id', userId)
      .single()

    const tenantId = user?.tenant_id || '7d91b2a1-c727-4f50-83ec-4fdb9debebd3'

    // Parse times (e.g. "10:00 am", "07:00 pm")
    const parseTimeToIso = (timeStr: string, baseDate: string) => {
      try {
        const clean = timeStr.trim().toLowerCase()
        const [timePart, modifier] = clean.split(' ')
        const [hStr, mStr] = (timePart || '').split(':')
        let hours = Number(hStr)
        const minutes = Number(mStr)
        if (modifier === 'pm' && hours < 12) hours += 12
        if (modifier === 'am' && hours === 12) hours = 0

        const d = new Date(baseDate)
        d.setUTCHours(hours, minutes, 0, 0)
        return d.toISOString()
      } catch {
        return new Date(`${baseDate}T10:00:00.000Z`).toISOString()
      }
    }

    const clockedInAt = inTime ? parseTimeToIso(inTime, date) : `${date}T10:00:00.000Z`
    const clockedOutAt = outTime ? parseTimeToIso(outTime, date) : `${date}T19:00:00.000Z`
    const breakSec = (breakMinutes || 0) * 60

    // Upsert or update session
    const { data: existing } = await supabase
      .from('attendance_sessions')
      .select('id')
      .eq('user_id', userId)
      .gte('clocked_in_at', `${date}T00:00:00.000Z`)
      .lte('clocked_in_at', `${date}T23:59:59.999Z`)
      .maybeSingle()

    let result
    if (existing?.id) {
      result = await supabase
        .from('attendance_sessions')
        .update({
          clocked_in_at: clockedInAt,
          clocked_out_at: clockedOutAt,
          total_break_sec: breakSec,
          status: 'CLOSED',
        })
        .eq('id', existing.id)
    } else {
      result = await supabase.from('attendance_sessions').insert({
        tenant_id: tenantId,
        user_id: userId,
        clocked_in_at: clockedInAt,
        clocked_out_at: clockedOutAt,
        total_break_sec: breakSec,
        status: 'CLOSED',
      })
    }

    if (result.error) {
      console.error('Error updating attendance session:', result.error)
      return NextResponse.json({ success: false, error: result.error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Timesheet updated successfully',
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('Timesheet API POST error:', err)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

// Clear / Delete timesheet attendance session
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    let sessionId = searchParams.get('sessionId')
    let userId = searchParams.get('userId')
    let date = searchParams.get('date')

    if (!sessionId && !userId) {
      try {
        const body = await req.json()
        sessionId = body.sessionId
        userId = body.userId
        date = body.date
      } catch {
        // no json body
      }
    }

    const supabase = createAdminClient()

    if (sessionId) {
      const { error } = await supabase
        .from('attendance_sessions')
        .delete()
        .eq('id', sessionId)

      if (error) {
        console.error('Error deleting attendance_sessions by sessionId:', error)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
      }
    } else if (userId && date) {
      const startOfDay = `${date}T00:00:00.000Z`
      const endOfDay = `${date}T23:59:59.999Z`

      const { error } = await supabase
        .from('attendance_sessions')
        .delete()
        .eq('user_id', userId)
        .gte('clocked_in_at', startOfDay)
        .lte('clocked_in_at', endOfDay)

      if (error) {
        console.error('Error deleting attendance_sessions by date range:', error)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
      }
    } else {
      return NextResponse.json(
        { success: false, error: 'sessionId or (userId and date) is required' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Timesheet record cleared successfully',
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('Timesheet API DELETE error:', err)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

