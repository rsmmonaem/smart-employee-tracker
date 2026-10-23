import { NextResponse } from 'next/server'
import { SupabaseClient } from '@supabase/supabase-js'
import {
  DEFAULT_TIMEZONE,
  formatLocalDateString,
  getTargetTimeMs,
  parseClockInMinutes,
} from '@/utils/date'

export interface DailyLogEntry {
  date: string
  dayName: string
  clockIn: string
  clockOut: string
  workDuration: string
  breakDuration: string
  workSec: number
  breakSec: number
  status: 'PRESENT' | 'LATE' | 'ABSENT' | 'ON_LEAVE' | 'WEEKEND' | 'HOLIDAY'
  notes: string
}

export interface MonthlyEmployeeRecord {
  id: string
  name: string
  email: string
  avatar: string
  team: string
  role: string
  daysPresent: number
  daysLate: number
  daysAbsent: number
  daysLeave: number
  totalWorkingDays: number
  attendanceRate: number
  punctualityRate: number
  avgClockIn: string
  avgClockOut: string
  avgDailyWork: string
  avgDailyWorkSec: number
  avgDailyBreak: string
  avgDailyBreakSec: number
  diligenceScore: number
  slackingRiskLevel: 'LOW' | 'MODERATE' | 'HIGH'
  aiArchetype: {
    id: string
    titleEn: string
    titleBn: string
    badgeColor: string
    icon: string
    tagline: string
  }
  aiHabitReport: {
    arrivalHabit: string
    slackingAnalysis: string
    workConsistency: string
    managerRecommendation: string
  }
  dailyLogs: DailyLogEntry[]
}

function formatMinutesTo12Hour(minutes: number): string {
  if (minutes <= 0) return '-'
  const h24 = Math.floor(minutes / 60) % 24
  const m = Math.round(minutes % 60)
  const period = h24 >= 12 ? 'PM' : 'AM'
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12
  return `${h12.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} ${period}`
}

function formatDurationSec(totalSeconds: number): string {
  if (totalSeconds <= 0) return '00h 00m'
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  return `${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m`
}

function formatClockTime(isoStr?: string | null, timeZone: string = DEFAULT_TIMEZONE): string {
  if (!isoStr) return '-'
  try {
    const d = new Date(isoStr)
    if (isNaN(d.getTime())) return '-'
    return d.toLocaleTimeString('en-US', {
      timeZone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
  } catch {
    return '-'
  }
}

function getMinutesFromMidnight(isoStr: string, timeZone: string): number {
  try {
    const dtf = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hour: 'numeric',
      minute: 'numeric',
      hour12: false,
    })
    const parts = dtf.formatToParts(new Date(isoStr))
    let hour = 0
    let minute = 0
    for (const p of parts) {
      if (p.type === 'hour') hour = parseInt(p.value, 10)
      if (p.type === 'minute') minute = parseInt(p.value, 10)
    }
    // Intl hour in 24h might return 24 for midnight in some versions
    if (hour === 24) hour = 0
    return hour * 60 + minute
  } catch {
    const d = new Date(isoStr)
    return d.getUTCHours() * 60 + d.getUTCMinutes()
  }
}

export async function handleMonthlyAttendanceReport({
  supabase,
  session,
  targetTenant,
  searchParams,
  orgTimezone,
  expectedInMinutes,
  expectedOutMinutes,
  allUsers,
  teamsMap,
  dbTeamMembers,
  authMap,
}: {
  supabase: SupabaseClient
  session: any
  targetTenant: string | null
  searchParams: URLSearchParams
  orgTimezone: string
  expectedInMinutes: number
  expectedOutMinutes: number
  allUsers: any[]
  teamsMap: Map<string, string>
  dbTeamMembers: any[]
  authMap: Map<string, any>
}) {
  // 1. Determine Target Month (e.g. "2026-10")
  const currentMonthStr = formatLocalDateString(new Date(), orgTimezone).slice(0, 7)
  const targetMonth = searchParams.get('month') || currentMonthStr
  const [yearStr, monthNumStr] = targetMonth.split('-')
  const year = parseInt(yearStr, 10) || new Date().getFullYear()
  const monthNum = parseInt(monthNumStr, 10) || (new Date().getMonth() + 1)

  // Calculate days in the target month
  const daysInMonth = new Date(year, monthNum, 0).getDate()
  const monthStartStr = `${targetMonth}-01`
  const monthEndStr = `${targetMonth}-${String(daysInMonth).padStart(2, '0')}`

  // Broad UTC boundary (+/- 48 hours) to capture all local events
  const startBoundIso = new Date(new Date(monthStartStr).getTime() - 48 * 3600 * 1000).toISOString()
  const endBoundIso = new Date(new Date(monthEndStr).getTime() + 72 * 3600 * 1000).toISOString()

  const userIds = allUsers.map((u) => u.id)
  if (userIds.length === 0) {
    return NextResponse.json({
      success: true,
      month: targetMonth,
      monthName: new Date(year, monthNum - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      employees: [],
      summary: null,
    })
  }

  // 2. Fetch Sessions for the entire month
  let sessionsQuery = supabase
    .from('attendance_sessions')
    .select('id, user_id, clocked_in_at, clocked_out_at, total_break_sec, status')
    .in('user_id', userIds)
    .gte('clocked_in_at', startBoundIso)
    .lte('clocked_in_at', endBoundIso)
    .order('clocked_in_at', { ascending: true })

  if (!session.isSuperAdmin && session.tenantId) {
    sessionsQuery = sessionsQuery.eq('tenant_id', session.tenantId)
  } else if (targetTenant) {
    sessionsQuery = sessionsQuery.eq('tenant_id', targetTenant)
  }

  // 3. Fetch Holidays in this tenant
  let holidaysQuery = supabase
    .from('holidays')
    .select('id, name, date')
    .gte('date', monthStartStr)
    .lte('date', monthEndStr)

  if (!session.isSuperAdmin && session.tenantId) {
    holidaysQuery = holidaysQuery.eq('tenant_id', session.tenantId)
  } else if (targetTenant) {
    holidaysQuery = holidaysQuery.eq('tenant_id', targetTenant)
  }

  // 4. Fetch Approved Leaves for this tenant
  let leavesQuery = supabase
    .from('leave_requests')
    .select('id, user_id, start_date, end_date, status, leave_type')
    .in('user_id', userIds)
    .eq('status', 'APPROVED')

  if (!session.isSuperAdmin && session.tenantId) {
    leavesQuery = leavesQuery.eq('tenant_id', session.tenantId)
  } else if (targetTenant) {
    leavesQuery = leavesQuery.eq('tenant_id', targetTenant)
  }

  // 5. Fetch Activity Events summary for slacking analysis
  let activityQuery = supabase
    .from('activity_events')
    .select('user_id, classification, started_at, ended_at')
    .in('user_id', userIds)
    .gte('started_at', startBoundIso)
    .lte('started_at', endBoundIso)
    .limit(30000)

  if (!session.isSuperAdmin && session.tenantId) {
    activityQuery = activityQuery.eq('tenant_id', session.tenantId)
  } else if (targetTenant) {
    activityQuery = activityQuery.eq('tenant_id', targetTenant)
  }

  const [
    { data: rawSessions },
    { data: dbHolidays },
    { data: dbLeaves },
    { data: dbEvents },
  ] = await Promise.all([
    sessionsQuery,
    holidaysQuery,
    leavesQuery,
    activityQuery,
  ])

  const holidaysMap = new Map<string, string>()
  ;(dbHolidays || []).forEach((h) => holidaysMap.set(h.date, h.name))

  const todayStr = formatLocalDateString(new Date(), orgTimezone)
  const isCurrentMonth = targetMonth === todayStr.slice(0, 7)
  const maxDayLimit = isCurrentMonth ? parseInt(todayStr.split('-')[2], 10) : daysInMonth

  // Team helper
  const getUserTeamName = (userId: string): string => {
    const memberEntry = (dbTeamMembers || []).find((tm) => tm.user_id === userId)
    if (memberEntry && teamsMap.has(memberEntry.team_id)) {
      return teamsMap.get(memberEntry.team_id)!
    }
    const meta = authMap.get(userId) || {}
    if (meta.team) return String(meta.team)
    if (Array.isArray(meta.teams) && meta.teams.length > 0) return String(meta.teams[0])
    return 'General'
  }

  // Filter users by team or employee if specified in query
  const teamFilter = searchParams.get('team')
  const employeeIdFilter = searchParams.get('employeeId')

  let filteredUsers = allUsers
  if (teamFilter && teamFilter !== 'All Team') {
    const lowerTeam = teamFilter.toLowerCase().trim()
    filteredUsers = filteredUsers.filter((u) => {
      const tName = getUserTeamName(u.id).toLowerCase()
      return tName === lowerTeam
    })
  }

  if (employeeIdFilter && employeeIdFilter !== 'ALL') {
    filteredUsers = filteredUsers.filter((u) => u.id === employeeIdFilter)
  }

  // Pre-index sessions by userId and dateStr
  // map: userId -> Map<dateStr, session[]>
  const userDateSessionsMap = new Map<string, Map<string, any[]>>()
  for (const s of rawSessions || []) {
    const dateStr = formatLocalDateString(s.clocked_in_at, orgTimezone)
    if (!dateStr.startsWith(targetMonth)) continue

    let userMap = userDateSessionsMap.get(s.user_id)
    if (!userMap) {
      userMap = new Map()
      userDateSessionsMap.set(s.user_id, userMap)
    }
    let dateList = userMap.get(dateStr)
    if (!dateList) {
      dateList = []
      userMap.set(dateStr, dateList)
    }
    dateList.push(s)
  }

  // Pre-index activity events by userId for productivity / idle ratio
  const userEventsMap = new Map<string, { prodSec: number; unprodSec: number; totalSec: number }>()
  for (const ev of dbEvents || []) {
    const cur = userEventsMap.get(ev.user_id) || { prodSec: 0, unprodSec: 0, totalSec: 0 }
    const dur = Math.max(1, Math.round((new Date(ev.ended_at).getTime() - new Date(ev.started_at).getTime()) / 1000))
    cur.totalSec += dur
    if (ev.classification === 'PRODUCTIVE') cur.prodSec += dur
    else if (ev.classification === 'UNPRODUCTIVE') cur.unprodSec += dur
    userEventsMap.set(ev.user_id, cur)
  }

  // 6. Process each employee
  const employeeRecords: MonthlyEmployeeRecord[] = []

  let companyClockInSum = 0
  let companyClockInCount = 0
  let companyClockOutSum = 0
  let companyClockOutCount = 0
  let companyWorkSecSum = 0
  let companyBreakSecSum = 0
  let companyWorkedDaysCount = 0

  for (const u of filteredUsers) {
    const name = u.full_name || u.email.split('@')[0]
    const avatar = name.charAt(0).toUpperCase()
    const team = getUserTeamName(u.id)

    const userSessionsByDate = userDateSessionsMap.get(u.id) || new Map<string, any[]>()
    const userLeaves = (dbLeaves || []).filter((l) => l.user_id === u.id)

    const dailyLogs: DailyLogEntry[] = []

    let daysPresent = 0
    let daysLate = 0
    let daysAbsent = 0
    let daysLeave = 0
    let workingDaysElapsed = 0

    const clockInMinutesList: number[] = []
    const clockOutMinutesList: number[] = []
    let totalWorkSec = 0
    let totalBreakSec = 0

    // Loop through all calendar days 1..daysInMonth
    for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
      const dayStr = String(dayNum).padStart(2, '0')
      const dateStr = `${targetMonth}-${dayStr}`
      const dateObj = new Date(year, monthNum - 1, dayNum)
      const dayOfWeek = dateObj.getDay() // 0 = Sun, 5 = Fri, 6 = Sat
      const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' })

      // Standard weekend in Bangladesh: Friday (5) & Saturday (6)
      const isWeekend = dayOfWeek === 5 || dayOfWeek === 6
      const isOfficialHoliday = holidaysMap.has(dateStr)
      const isFutureDay = isCurrentMonth && dayNum > maxDayLimit

      // Check if user has an approved leave on this date
      const hasApprovedLeave = userLeaves.some((l) => {
        const start = l.start_date?.slice(0, 10)
        const end = l.end_date?.slice(0, 10)
        return start && end && dateStr >= start && dateStr <= end
      })

      const daySessions = userSessionsByDate.get(dateStr) || []

      if (daySessions.length > 0) {
        // Sort sessions chronologically
        daySessions.sort(
          (a, b) => new Date(a.clocked_in_at).getTime() - new Date(b.clocked_in_at).getTime()
        )

        const firstSession = daySessions[0]
        const lastSession = daySessions[daySessions.length - 1]

        const clockInTime = formatClockTime(firstSession.clocked_in_at, orgTimezone)
        let clockOutTime = '-'
        let hasClockOut = false

        if (lastSession.clocked_out_at && lastSession.status !== 'OPEN') {
          clockOutTime = formatClockTime(lastSession.clocked_out_at, orgTimezone)
          hasClockOut = true
        } else if (dateStr === todayStr) {
          clockOutTime = 'Active (Now)'
        }

        const inMins = getMinutesFromMidnight(firstSession.clocked_in_at, orgTimezone)
        clockInMinutesList.push(inMins)

        if (hasClockOut && lastSession.clocked_out_at) {
          const outMins = getMinutesFromMidnight(lastSession.clocked_out_at, orgTimezone)
          clockOutMinutesList.push(outMins)
        }

        // Calculate day's total work & break seconds
        let dayWorkSec = 0
        let dayBreakSec = 0

        for (const s of daySessions) {
          const inT = new Date(s.clocked_in_at).getTime()
          const outT = s.clocked_out_at ? new Date(s.clocked_out_at).getTime() : (dateStr === todayStr ? Date.now() : inT)
          const spanSec = Math.max(0, Math.round((outT - inT) / 1000))
          const bSec = Math.min(spanSec, Math.max(0, s.total_break_sec || 0))
          dayWorkSec += Math.max(0, spanSec - bSec)
          dayBreakSec += bSec
        }

        totalWorkSec += dayWorkSec
        totalBreakSec += dayBreakSec

        // Late evaluation: Grace threshold 15 mins (10:15 AM = 615 mins)
        const isLate = inMins > (expectedInMinutes + 15)
        const status: DailyLogEntry['status'] = isLate ? 'LATE' : 'PRESENT'

        if (isLate) {
          daysLate++
          daysPresent++
        } else {
          daysPresent++
        }

        let notes = isLate
          ? `${Math.max(1, inMins - expectedInMinutes)} mins late`
          : 'Punctual / On-time'
        if (isWeekend) notes += ' (Weekend Shift)'

        dailyLogs.push({
          date: dateStr,
          dayName,
          clockIn: clockInTime,
          clockOut: clockOutTime,
          workDuration: formatDurationSec(dayWorkSec),
          breakDuration: formatDurationSec(dayBreakSec),
          workSec: dayWorkSec,
          breakSec: dayBreakSec,
          status,
          notes,
        })

        if (!isWeekend && !isOfficialHoliday && !isFutureDay) {
          workingDaysElapsed++
        }
      } else {
        // No attendance session
        if (isFutureDay) {
          dailyLogs.push({
            date: dateStr,
            dayName,
            clockIn: '-',
            clockOut: '-',
            workDuration: '00h 00m',
            breakDuration: '00h 00m',
            workSec: 0,
            breakSec: 0,
            status: isWeekend ? 'WEEKEND' : 'ABSENT',
            notes: 'Upcoming day',
          })
        } else if (hasApprovedLeave) {
          daysLeave++
          dailyLogs.push({
            date: dateStr,
            dayName,
            clockIn: '-',
            clockOut: '-',
            workDuration: '00h 00m',
            breakDuration: '00h 00m',
            workSec: 0,
            breakSec: 0,
            status: 'ON_LEAVE',
            notes: 'Approved Leave',
          })
          if (!isWeekend && !isOfficialHoliday) workingDaysElapsed++
        } else if (isOfficialHoliday) {
          dailyLogs.push({
            date: dateStr,
            dayName,
            clockIn: '-',
            clockOut: '-',
            workDuration: '00h 00m',
            breakDuration: '00h 00m',
            workSec: 0,
            breakSec: 0,
            status: 'HOLIDAY',
            notes: holidaysMap.get(dateStr) || 'Official Holiday',
          })
        } else if (isWeekend) {
          dailyLogs.push({
            date: dateStr,
            dayName,
            clockIn: '-',
            clockOut: '-',
            workDuration: '00h 00m',
            breakDuration: '00h 00m',
            workSec: 0,
            breakSec: 0,
            status: 'WEEKEND',
            notes: 'Scheduled Weekend',
          })
        } else {
          // Unexcused Absent on a working day
          daysAbsent++
          workingDaysElapsed++
          dailyLogs.push({
            date: dateStr,
            dayName,
            clockIn: '-',
            clockOut: '-',
            workDuration: '00h 00m',
            breakDuration: '00h 00m',
            workSec: 0,
            breakSec: 0,
            status: 'ABSENT',
            notes: 'Unexcused Absence',
          })
        }
      }
    }

    // Averages calculation for this employee
    const avgInMinutes =
      clockInMinutesList.length > 0
        ? Math.round(clockInMinutesList.reduce((acc, m) => acc + m, 0) / clockInMinutesList.length)
        : 0

    const avgOutMinutes =
      clockOutMinutesList.length > 0
        ? Math.round(clockOutMinutesList.reduce((acc, m) => acc + m, 0) / clockOutMinutesList.length)
        : 0

    const avgDailyWorkSec =
      daysPresent > 0 ? Math.round(totalWorkSec / daysPresent) : 0

    const avgDailyBreakSec =
      daysPresent > 0 ? Math.round(totalBreakSec / daysPresent) : 0

    const avgClockIn = formatMinutesTo12Hour(avgInMinutes)
    const avgClockOut = formatMinutesTo12Hour(avgOutMinutes)
    const avgDailyWork = formatDurationSec(avgDailyWorkSec)
    const avgDailyBreak = formatDurationSec(avgDailyBreakSec)

    // Aggregate into company sums
    if (daysPresent > 0) {
      if (avgInMinutes > 0) {
        companyClockInSum += avgInMinutes
        companyClockInCount++
      }
      if (avgOutMinutes > 0) {
        companyClockOutSum += avgOutMinutes
        companyClockOutCount++
      }
      companyWorkSecSum += avgDailyWorkSec
      companyBreakSecSum += avgDailyBreakSec
      companyWorkedDaysCount++
    }

    // Rates
    const attendanceDenominator = Math.max(1, workingDaysElapsed)
    const attendanceRate = Math.min(100, Math.round((daysPresent / attendanceDenominator) * 100))
    const punctualityRate = daysPresent > 0 ? Math.round(((daysPresent - daysLate) / daysPresent) * 100) : 0

    // Diligence & Slacking Computation (0 - 100 Score)
    const avgDailyBreakMins = avgDailyBreakSec / 60
    const breakExcessMins = Math.max(0, avgDailyBreakMins - 60)
    const avgDailyWorkHours = avgDailyWorkSec / 3600

    let diligence = 100
    // Deduct for late rate
    const lateRate = daysPresent > 0 ? (daysLate / daysPresent) : 0
    diligence -= lateRate * 25

    // Deduct for break stretching (>60m avg/day)
    diligence -= Math.min(25, breakExcessMins * 0.7)

    // Deduct for short work hours (less than 7.5 hours avg)
    if (avgDailyWorkHours < 7.5 && daysPresent > 0) {
      diligence -= Math.min(25, (7.5 - avgDailyWorkHours) * 8)
    }

    // Deduct for unexcused absences
    if (workingDaysElapsed > 0) {
      const absentRate = daysAbsent / workingDaysElapsed
      diligence -= absentRate * 35
    }

    // Telemetry adjustment if productive apps data exists
    const userEvents = userEventsMap.get(u.id)
    if (userEvents && userEvents.totalSec > 3600) {
      const unprodPct = (userEvents.unprodSec / userEvents.totalSec) * 100
      if (unprodPct > 25) {
        diligence -= Math.min(15, (unprodPct - 25) * 0.5)
      }
    }

    diligence = Math.round(Math.max(15, Math.min(99, diligence)))

    // Slacking risk level
    let slackingRiskLevel: 'LOW' | 'MODERATE' | 'HIGH' = 'LOW'
    if (diligence < 55 || avgDailyBreakMins > 85 || (daysAbsent >= 4 && daysPresent < 10)) {
      slackingRiskLevel = 'HIGH'
    } else if (diligence < 75 || avgDailyBreakMins > 65 || daysLate > 5) {
      slackingRiskLevel = 'MODERATE'
    }

    // AI Work Archetype Decision
    let aiArchetype = {
      id: 'steady-anchor',
      titleEn: 'The Steady Anchor',
      titleBn: 'Consistent & Reliable Professional',
      badgeColor: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      icon: '⚖️',
      tagline: 'Consistent and reliable; fulfills assigned tasks smoothly during scheduled office hours.',
    }

    if (daysPresent >= 12 && attendanceRate >= 90 && punctualityRate >= 80 && avgDailyWorkHours >= 7.8 && breakExcessMins === 0 && diligence >= 85) {
      aiArchetype = {
        id: 'high-performer',
        titleEn: 'The Dedicated High Performer',
        titleBn: 'Exemplary & Top Contributor',
        badgeColor: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
        icon: '🌟',
        tagline: 'Always punctual, highly dedicated, and demonstrates superior work focus across all tasks.',
      }
    } else if (daysLate >= 4 && (daysLate / Math.max(1, daysPresent)) >= 0.35 && avgDailyWorkHours >= 7.8) {
      aiArchetype = {
        id: 'late-sprinter',
        titleEn: 'The Late Sprinter',
        titleBn: 'Late Arrival with High Evening Output',
        badgeColor: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
        icon: '⚡',
        tagline: 'Arrives slightly late in the morning but compensates with intense focus and evening hours to meet goals.',
      }
    } else if (breakExcessMins >= 15 || avgDailyBreakMins >= 75) {
      aiArchetype = {
        id: 'break-stretcher',
        titleEn: 'The Break Stretcher',
        titleBn: 'Excessive Breaks & Desk Absence Risk',
        badgeColor: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
        icon: '☕',
        tagline: 'Frequent or extended break intervals exceeding designated company limits.',
      }
    } else if (daysLate >= 5 && punctualityRate < 60) {
      aiArchetype = {
        id: 'chronic-latecomer',
        titleEn: 'The Chronic Latecomer',
        titleBn: 'Recurring Tardy Pattern',
        badgeColor: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
        icon: '⚠️',
        tagline: 'Enters significantly past shift start on majority of working days; needs shift discipline.',
      }
    } else if (attendanceRate < 60 || daysAbsent >= 5 || diligence < 50) {
      aiArchetype = {
        id: 'disengagement-risk',
        titleEn: 'Disengagement & Slacking Risk',
        titleBn: 'Low Participation & Retention Alert',
        badgeColor: 'bg-red-500/10 text-red-500 border-red-500/20',
        icon: '🛑',
        tagline: 'Critically low attendance and work hours; demonstrates noticeable disengagement and slacking risk.',
      }
    }

    // Behavioral Habit Narrative Generation (100% English)
    const arrivalPunctualityNarrative =
      daysPresent === 0
        ? 'No attendance records recorded for the selected month.'
        : `Average arrival time: ${avgClockIn} (Scheduled shift: 10:00 AM). Late on ${daysLate} of ${daysPresent} recorded working days (${punctualityRate}% punctuality rate). ${
            punctualityRate >= 85
              ? 'Arrives on time almost every day and maintains an exemplary punctuality record.'
              : punctualityRate >= 65
              ? 'Punctual on most days with occasional 10–25 minute morning delays.'
              : 'Arrival punctuality shows noticeable inconsistency with recurring morning delays.'
          }`

    const slackingAnalysisNarrative =
      daysPresent === 0
        ? 'Slacking evaluation not applicable due to lack of presence data.'
        : `Slacking Risk Level: ${
            slackingRiskLevel === 'LOW'
              ? 'Low Risk (Honest, dedicated, and active)'
              : slackingRiskLevel === 'MODERATE'
              ? 'Moderate Risk (Occasional lapses; monitoring recommended)'
              : 'High Risk (Significant unproductive intervals detected)'
          }. Diligence Score: ${diligence}/100. Average daily break: ${avgDailyBreak} (${
            avgDailyBreakMins <= 50
              ? 'Well within the allowed 60-minute window'
              : avgDailyBreakMins <= 65
              ? 'Standard compliant break duration'
              : `Averages ${Math.round(breakExcessMins)} minutes over designated break allowance`
          }). ${
            userEvents && userEvents.unprodSec > 3600
              ? 'Telemetry logs indicate noticeable unproductive website or application usage during active shifts.'
              : 'No abnormal or patterned desk absence detected during working intervals.'
          }`

    const workConsistencyNarrative =
      daysPresent === 0
        ? 'No active working hour data recorded this month.'
        : `Average daily productive time: ${avgDailyWork} (Target: 08h 00m). Average departure: ${avgClockOut}. ${
            avgDailyWorkHours >= 8
              ? 'Consistently fulfills full shift quotas and remains dedicated until targets are met.'
              : avgDailyWorkHours >= 7
              ? 'Satisfactory working hours with minor early departures observed on specific days.'
              : 'Daily productive hours fall below shift benchmarks; early logout pattern observed.'
          }`

    const managerRecommendationNarrative =
      aiArchetype.id === 'high-performer'
        ? 'Performance and attendance are stellar. Recognize contributions with team appreciation or milestone incentives.'
        : aiArchetype.id === 'late-sprinter'
        ? 'Strong task commitment is evident. Recommend reinforcing morning shift schedule to align better with team meetings.'
        : aiArchetype.id === 'break-stretcher'
        ? 'Review daily lunch and personal break limits with employee to maintain healthy shift workflow.'
        : aiArchetype.id === 'chronic-latecomer'
        ? 'Address recurring late arrivals via 1-on-1 feedback session or standard company HR attendance guidelines.'
        : aiArchetype.id === 'disengagement-risk'
        ? 'Conduct an urgent check-in to investigate root causes behind absenteeism and productivity drop.'
        : 'Work consistency is satisfactory. Maintain standard periodic operational check-ins.'

    employeeRecords.push({
      id: u.id,
      name,
      email: u.email,
      avatar,
      team,
      role: u.role || 'Employee',
      daysPresent,
      daysLate,
      daysAbsent,
      daysLeave,
      totalWorkingDays: workingDaysElapsed,
      attendanceRate,
      punctualityRate,
      avgClockIn,
      avgClockOut,
      avgDailyWork,
      avgDailyWorkSec,
      avgDailyBreak,
      avgDailyBreakSec,
      diligenceScore: diligence,
      slackingRiskLevel,
      aiArchetype,
      aiHabitReport: {
        arrivalHabit: arrivalPunctualityNarrative,
        slackingAnalysis: slackingAnalysisNarrative,
        workConsistency: workConsistencyNarrative,
        managerRecommendation: managerRecommendationNarrative,
      },
      dailyLogs,
    })
  }

  // Sort employees: High performers & diligent first, then latecomers, then disengaged
  employeeRecords.sort((a, b) => {
    // 1. More present days first
    if (b.daysPresent !== a.daysPresent) return b.daysPresent - a.daysPresent
    // 2. Higher diligence score next
    return b.diligenceScore - a.diligenceScore
  })

  // Company Overall Monthly Summary
  const avgCompanyClockIn =
    companyClockInCount > 0 ? formatMinutesTo12Hour(Math.round(companyClockInSum / companyClockInCount)) : '-'
  const avgCompanyClockOut =
    companyClockOutCount > 0 ? formatMinutesTo12Hour(Math.round(companyClockOutSum / companyClockOutCount)) : '-'
  const avgCompanyWorkDuration =
    companyWorkedDaysCount > 0 ? formatDurationSec(Math.round(companyWorkSecSum / companyWorkedDaysCount)) : '00h 00m'
  const avgCompanyBreakDuration =
    companyWorkedDaysCount > 0 ? formatDurationSec(Math.round(companyBreakSecSum / companyWorkedDaysCount)) : '00h 00m'

  const totalEmployees = employeeRecords.length
  const avgAttendanceRate =
    totalEmployees > 0
      ? Math.round(employeeRecords.reduce((acc, e) => acc + e.attendanceRate, 0) / totalEmployees)
      : 0
  const avgPunctualityRate =
    totalEmployees > 0
      ? Math.round(employeeRecords.reduce((acc, e) => acc + e.punctualityRate, 0) / totalEmployees)
      : 0

  const highPerformersCount = employeeRecords.filter((e) => e.aiArchetype.id === 'high-performer').length
  const lateComersCount = employeeRecords.filter((e) => e.aiArchetype.id === 'chronic-latecomer' || e.daysLate > 4).length
  const slackingRiskCount = employeeRecords.filter((e) => e.slackingRiskLevel === 'HIGH').length

  const monthDateObj = new Date(year, monthNum - 1, 1)
  const monthName = monthDateObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  return NextResponse.json({
    success: true,
    month: targetMonth,
    monthName,
    summary: {
      month: targetMonth,
      monthName,
      totalEmployees,
      avgCompanyClockIn,
      avgCompanyClockOut,
      avgCompanyWorkDuration,
      avgCompanyBreakDuration,
      avgAttendanceRate,
      avgPunctualityRate,
      highPerformersCount,
      lateComersCount,
      slackingRiskCount,
    },
    employees: employeeRecords,
  })
}
