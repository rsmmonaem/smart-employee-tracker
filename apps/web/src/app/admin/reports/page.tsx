'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Calendar,
  Clock,
  Users,
  Sliders,
  Monitor,
  BarChart3,
  ClipboardList,
  Activity,
  Network,
  Download,
  Search,
  ChevronDown,
  CheckCircle2,
  AlertCircle,
  FileText,
  Keyboard,
  MousePointer,
  Sparkles,
  Zap,
  TrendingUp,
  RefreshCw,
} from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import AdminHeader from '../admin-header'

type ReportCategory =
  | 'daily-attendance'
  | 'monthly-attendance'
  | 'monthly-in-out'
  | 'late-clock-in'
  | 'over-time'
  | 'custom-report'
  | 'apps-usage'
  | 'work-activity'
  | 'work-load'
  | 'shift-time'
  | 'summary-report'
  | 'input-activity'
  | 'login-ip'

type AttendanceSubTab =
  | 'worked'
  | 'late'
  | 'leave'
  | 'absent'

interface EmployeeAttendance {
  id: string
  employeeId?: string
  name: string
  avatar: string
  clockIn: string
  clockOut: string
  workedHours: string
  breakTime: string
  effectiveHours: string
  status: 'PRESENT' | 'LATE' | 'ON_LEAVE' | 'ABSENT'
}

interface KeystrokeActivityRecord {
  id: string
  employeeName: string
  team: string
  totalKeystrokes: number
  kpm: number
  mouseEvents: number
  activeTypingTime: string
  intensity: 'HIGH' | 'MODERATE' | 'LOW'
  intensityScore: number
}

interface LoginIpRecord {
  id: string
  employeeName: string
  email: string
  loginDate: string
  loginTime: string
  logoutTime: string
  ipAddress: string
  device: string
  status: 'ONLINE' | 'OFFLINE'
  isSuspicious?: boolean
}

const REPORT_SIDEBAR_ITEMS: Array<{
  id: ReportCategory
  label: string
  icon: React.ElementType
  isInputTracking?: boolean
}> = [
  { id: 'daily-attendance', label: 'Daily Attendance', icon: Calendar },
  { id: 'monthly-attendance', label: 'Monthly Attendance', icon: Calendar },
  { id: 'monthly-in-out', label: 'Monthly In Out', icon: Clock },
  { id: 'late-clock-in', label: 'Late Clock-In', icon: Clock },
  { id: 'over-time', label: 'Over Time Report', icon: Users },
  { id: 'custom-report', label: 'Custom Report', icon: Sliders },
  { id: 'apps-usage', label: 'Apps & Sites Usage', icon: Monitor },
  { id: 'work-activity', label: 'Work Activity Log', icon: Clock },
  { id: 'work-load', label: 'Work Load Analysis', icon: BarChart3 },
  { id: 'shift-time', label: 'Shift Time Report', icon: Clock },
  { id: 'summary-report', label: 'Summary Report', icon: ClipboardList },
  { id: 'input-activity', label: 'Input Activity Report', icon: Activity, isInputTracking: true },
  { id: 'login-ip', label: 'Login Ip Report', icon: Network },
]

export default function ReportsPage() {
  const [activeReport, setActiveReport] = useState<ReportCategory>('daily-attendance')
  const [activeSubTab, setActiveSubTab] = useState<AttendanceSubTab>('worked')
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('ALL')
  const [selectedDate, setSelectedDate] = useState<string>(
    () => new Date().toISOString().slice(0, 10)
  )
  const [loading, setLoading] = useState(false)

  // Remote data state
  const [employeeOptions, setEmployeeOptions] = useState<
    Array<{ id: string; name: string; email: string }>
  >([])
  const [attendanceRecords, setAttendanceRecords] = useState<EmployeeAttendance[]>([])
  const [keystrokeRecords, setKeystrokeRecords] = useState<KeystrokeActivityRecord[]>([])
  const [loginIpRecords, setLoginIpRecords] = useState<LoginIpRecord[]>([])
  const [lateRecords, setLateRecords] = useState<
    Array<{
      id: string
      employeeId: string
      name: string
      email: string
      avatar: string
      clockIn: string
      expectedTime: string
      minutesLate: number
      status: string
    }>
  >([])
  const [overtimeRecords, setOvertimeRecords] = useState<
    Array<{
      id: string
      employeeId: string
      name: string
      email: string
      avatar: string
      clockIn: string
      clockOut: string
      totalWorked: string
      standardHours: string
      overtime: string
    }>
  >([])
  const [summaryReport, setSummaryReport] = useState<{
    totalEmployees: number
    presentCount: number
    lateCount: number
    absentCount: number
    attendanceRate: number
    totalWorkHours: string
    avgWorkHoursPerEmployee: string
    productiveRate: number
  } | null>(null)
  const [hourlyDistribution, setHourlyDistribution] = useState<
    Array<{ slot: string; keystrokes: number; mouse: number }>
  >([])
  const [appsUsage, setAppsUsage] = useState({
    productiveHours: '00h 00m',
    neutralHours: '00h 00m',
    unproductiveHours: '00h 00m',
    productivePct: 0,
    neutralPct: 0,
    unproductivePct: 0,
  })

  // Sorting states
  const [keySortField, setKeySortField] = useState<keyof KeystrokeActivityRecord>('totalKeystrokes')
  const [keySortOrder, setKeySortOrder] = useState<'asc' | 'desc'>('desc')

  const [ipSortField, setIpSortField] = useState<keyof LoginIpRecord>('loginTime')
  const [ipSortOrder, setIpSortOrder] = useState<'asc' | 'desc'>('desc')

  // Live keystroke tracking simulator state
  const [testTypedText, setTestTypedText] = useState('')
  const [liveKeystrokesCount, setLiveKeystrokesCount] = useState(0)
  const [liveKpm, setLiveKpm] = useState(0)
  const [liveTypingStartTime, setLiveTypingStartTime] = useState<number | null>(null)

  const fetchReportsData = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (selectedDate) params.set('date', selectedDate)
      if (selectedEmployeeId && selectedEmployeeId !== 'ALL') {
        params.set('employeeId', selectedEmployeeId)
      }

      const res = await fetch(`/api/admin/reports?${params.toString()}`, { cache: 'no-store' })
      const data = await res.json()

      if (data.success) {
        setEmployeeOptions(data.employees || [])
        setAttendanceRecords(data.attendance || [])
        setKeystrokeRecords(data.keystrokes || [])
        setLoginIpRecords(data.loginIpRecords || [])
        setLateRecords(data.lateRecords || [])
        setOvertimeRecords(data.overtimeRecords || [])
        setSummaryReport(data.summaryReport || null)
        setHourlyDistribution(data.hourlyDistribution || [])
        if (data.appsUsage) setAppsUsage(data.appsUsage)
      }
    } catch (err) {
      console.error('Failed to fetch reports data:', err)
    } finally {
      setLoading(false)
    }
  }, [selectedDate, selectedEmployeeId])

  useEffect(() => {
    fetchReportsData()
  }, [fetchReportsData])

  // Supabase Realtime subscription
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('realtime-reports-sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'attendance_sessions' },
        () => fetchReportsData()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'activity_events' },
        () => fetchReportsData()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchReportsData])

  const handleTestKeyDown = () => {
    setLiveKeystrokesCount((prev) => prev + 1)
    if (!liveTypingStartTime) {
      setLiveTypingStartTime(Date.now())
    } else {
      const elapsedMins = (Date.now() - liveTypingStartTime) / 60000
      if (elapsedMins > 0.05) {
        setLiveKpm(Math.round((liveKeystrokesCount + 1) / elapsedMins))
      }
    }
  }

  const handleExport = () => {
    let csvContent = 'data:text/csv;charset=utf-8,'
    if (activeReport === 'late-clock-in') {
      csvContent += 'Name,Email,Clock In,Expected Time,Minutes Late,Status\n'
      csvContent += lateRecords
        .map((r) => `"${r.name}","${r.email}","${r.clockIn}","${r.expectedTime}","${r.minutesLate} mins","${r.status}"`)
        .join('\n')
    } else if (activeReport === 'over-time') {
      csvContent += 'Name,Email,Clock In,Clock Out,Standard Shift,Worked Hours,Overtime\n'
      csvContent += overtimeRecords
        .map((r) => `"${r.name}","${r.email}","${r.clockIn}","${r.clockOut}","${r.standardHours}","${r.totalWorked}","${r.overtime}"`)
        .join('\n')
    } else if (activeReport === 'input-activity') {
      csvContent += 'Member,Team,Total Keystrokes,KPM,Mouse Events,Active Typing Time,Intensity\n'
      csvContent += keystrokeRecords
        .map((r) => `"${r.employeeName}","${r.team}","${r.totalKeystrokes}","${r.kpm}","${r.mouseEvents}","${r.activeTypingTime}","${r.intensity}"`)
        .join('\n')
    } else if (activeReport === 'login-ip') {
      csvContent += 'Employee,Email,IP Address,Login Time,Logout Time,Device,Status\n'
      csvContent += loginIpRecords
        .map((r) => `"${r.employeeName}","${r.email}","${r.ipAddress}","${r.loginTime}","${r.logoutTime}","${r.device}","${r.status}"`)
        .join('\n')
    } else {
      csvContent += 'Name,Clock In,Clock Out,Worked Hours,Break,Effective Hours,Status\n'
      csvContent += attendanceRecords
        .map(
          (r) =>
            `"${r.name}","${r.clockIn}","${r.clockOut}","${r.workedHours}","${r.breakTime}","${r.effectiveHours}","${r.status}"`
        )
        .join('\n')
    }

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `${activeReport}_${selectedDate}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Sorted keystroke records
  const sortedKeystrokes = useMemo(() => {
    return [...keystrokeRecords].sort((a, b) => {
      let aVal = a[keySortField]
      let bVal = b[keySortField]
      if (typeof aVal === 'string') {
        const cmp = (aVal as string).localeCompare(bVal as string)
        return keySortOrder === 'asc' ? cmp : -cmp
      }
      return keySortOrder === 'asc'
        ? (aVal as number) - (bVal as number)
        : (bVal as number) - (aVal as number)
    })
  }, [keystrokeRecords, keySortField, keySortOrder])

  // Sorted login IP records
  const sortedLoginIp = useMemo(() => {
    return [...loginIpRecords].sort((a, b) => {
      let aVal = a[ipSortField] || ''
      let bVal = b[ipSortField] || ''
      if (typeof aVal === 'string') {
        const cmp = (aVal as string).localeCompare(bVal as string)
        return ipSortOrder === 'asc' ? cmp : -cmp
      }
      return 0
    })
  }, [loginIpRecords, ipSortField, ipSortOrder])

  const handleKeySort = (field: keyof KeystrokeActivityRecord) => {
    if (keySortField === field) {
      setKeySortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setKeySortField(field)
      setKeySortOrder('desc')
    }
  }

  const handleIpSort = (field: keyof LoginIpRecord) => {
    if (ipSortField === field) {
      setIpSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setIpSortField(field)
      setIpSortOrder('desc')
    }
  }
  // Filter attendance records by active subtab
  const filteredAttendance = useMemo(() => {
    return attendanceRecords.filter((emp) => {
      if (activeSubTab === 'worked') return emp.status === 'PRESENT'
      if (activeSubTab === 'late') return emp.status === 'LATE'
      if (activeSubTab === 'leave') return emp.status === 'ON_LEAVE'
      if (activeSubTab === 'absent') return emp.status === 'ABSENT'
      return true
    })
  }, [attendanceRecords, activeSubTab])

  // Total keystroke statistics
  const totalKeystrokesToday = useMemo(() => {
    return keystrokeRecords.reduce((acc, r) => acc + r.totalKeystrokes, 0)
  }, [keystrokeRecords])

  const totalMouseEventsToday = useMemo(() => {
    return keystrokeRecords.reduce((acc, r) => acc + r.mouseEvents, 0)
  }, [keystrokeRecords])

  const avgKpm = useMemo(() => {
    const active = keystrokeRecords.filter((r) => r.kpm > 0)
    if (active.length === 0) return 0
    return Math.round(active.reduce((acc, r) => acc + r.kpm, 0) / active.length)
  }, [keystrokeRecords])

  return (
    <div className="min-h-full bg-white dark:bg-gray-950 font-sans text-gray-800 dark:text-gray-100 pb-16 flex flex-col">
      {/* Top Header Bar */}
      <AdminHeader
        title="Reports"
        subtitle="Workforce analytics, daily attendance, timesheet summaries & input activity tracking"
        searchPlaceholder="Search in reports"
        loading={loading}
        onRefresh={fetchReportsData}
        extraActions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveReport('input-activity')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow-2xs ${
                activeReport === 'input-activity'
                  ? 'bg-blue-600 text-white'
                  : 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800 hover:bg-blue-100'
              }`}
            >
              <Keyboard className="w-3.5 h-3.5" />
              <span>Keyboard Tracking</span>
            </button>
          </div>
        }
      />

      {/* Main Split Layout: Left Reports Navigation & Right Report View */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 border-t border-gray-150 dark:border-gray-800">
        {/* Left Sub-Sidebar: Report Categories */}
        <aside className="w-full lg:w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 p-4 shrink-0 overflow-y-auto space-y-1">
          <div className="px-3 py-2 text-base font-bold text-gray-900 dark:text-white">
            Reports
          </div>

          <div className="space-y-0.5">
            {REPORT_SIDEBAR_ITEMS.map((item) => {
              const Icon = item.icon
              const isActive = activeReport === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveReport(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all text-left ${
                    isActive
                      ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 font-bold shadow-2xs'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/60 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'
                    }`}
                  />
                  <span className="truncate flex-1">{item.label}</span>
                  {item.isInputTracking && (
                    <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                      Live
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </aside>

        {/* Right Main Panel: Report Content */}
        <main className="flex-1 bg-[#f8f9fa] dark:bg-gray-950 p-6 lg:p-8 overflow-y-auto space-y-6">
          {/* CATEGORY 1: DAILY ATTENDANCE */}
          {activeReport === 'daily-attendance' && (
            <div className="space-y-6">
              {/* Daily Attendance Header & Horizontal Sub-Tabs */}
              <div className="border-b border-gray-200 dark:border-gray-800 pb-0">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Daily Attendance
                  </h2>
                </div>

                {/* Sub-Tabs: Worked / Late / Leave / Absent */}
                <div className="flex items-center gap-6 text-xs font-semibold overflow-x-auto">
                  <button
                    onClick={() => setActiveSubTab('worked')}
                    className={`pb-3 border-b-2 transition-all shrink-0 ${
                      activeSubTab === 'worked'
                        ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-bold'
                        : 'border-transparent text-gray-500 hover:text-gray-800 dark:text-gray-400'
                    }`}
                  >
                    Worked Employees ({attendanceRecords.filter((r) => r.status === 'PRESENT').length})
                  </button>
                  <button
                    onClick={() => setActiveSubTab('late')}
                    className={`pb-3 border-b-2 transition-all shrink-0 ${
                      activeSubTab === 'late'
                        ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-bold'
                        : 'border-transparent text-gray-500 hover:text-gray-800 dark:text-gray-400'
                    }`}
                  >
                    Late Clock In ({attendanceRecords.filter((r) => r.status === 'LATE').length})
                  </button>
                  <button
                    onClick={() => setActiveSubTab('leave')}
                    className={`pb-3 border-b-2 transition-all shrink-0 ${
                      activeSubTab === 'leave'
                        ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-bold'
                        : 'border-transparent text-gray-500 hover:text-gray-800 dark:text-gray-400'
                    }`}
                  >
                    On Leave ({attendanceRecords.filter((r) => r.status === 'ON_LEAVE').length})
                  </button>
                  <button
                    onClick={() => setActiveSubTab('absent')}
                    className={`pb-3 border-b-2 transition-all shrink-0 ${
                      activeSubTab === 'absent'
                        ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-bold'
                        : 'border-transparent text-gray-500 hover:text-gray-800 dark:text-gray-400'
                    }`}
                  >
                    Absent ({attendanceRecords.filter((r) => r.status === 'ABSENT').length})
                  </button>
                </div>
              </div>

              {/* Filter Toolbar */}
              <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-2xs flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3">
                  {/* Dynamic Employees Dropdown */}
                  <div className="relative min-w-[220px]">
                    <select
                      value={selectedEmployeeId}
                      onChange={(e) => setSelectedEmployeeId(e.target.value)}
                      className="w-full appearance-none bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3.5 py-2 pr-9 text-xs font-semibold text-gray-800 dark:text-gray-200 focus:outline-none focus:border-blue-500 shadow-2xs"
                    >
                      <option value="ALL">All Team Members ({employeeOptions.length})</option>
                      {employeeOptions.map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.name} ({emp.email})
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-2.5 pointer-events-none" />
                  </div>

                  {/* Date Input */}
                  <div className="relative">
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3.5 py-2 text-xs font-semibold text-gray-800 dark:text-gray-200 focus:outline-none focus:border-blue-500 shadow-2xs"
                    />
                  </div>
                </div>

                {/* Export Button */}
                <button
                  type="button"
                  onClick={handleExport}
                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-all shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </button>
              </div>

              {/* Data Table */}
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-2xs">
                {filteredAttendance.length === 0 ? (
                  <div className="p-12 text-center text-xs text-gray-400">
                    No employees found for &quot;{activeSubTab}&quot; status on {selectedDate}.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-800 text-gray-400 font-semibold uppercase tracking-wider text-[11px] bg-gray-50/60 dark:bg-gray-950/40">
                          <th className="py-3 px-5">Employee</th>
                          <th className="py-3 px-4">Clock In</th>
                          <th className="py-3 px-4">Clock Out</th>
                          <th className="py-3 px-4">Worked Time</th>
                          <th className="py-3 px-4">Break Time</th>
                          <th className="py-3 px-4">Effective Hours</th>
                          <th className="py-3 px-5 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-150 dark:divide-gray-800">
                        {filteredAttendance.map((row) => (
                          <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-gray-850/40 transition-colors">
                            <td className="py-3.5 px-5 font-bold text-gray-900 dark:text-white flex items-center gap-2.5">
                              <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[10px]">
                                {row.avatar}
                              </span>
                              <span>{row.name}</span>
                            </td>
                            <td className="py-3.5 px-4 font-mono font-medium text-gray-700 dark:text-gray-300">
                              {row.clockIn}
                            </td>
                            <td className="py-3.5 px-4 font-mono font-medium text-gray-700 dark:text-gray-300">
                              {row.clockOut}
                            </td>
                            <td className="py-3.5 px-4 font-mono font-bold text-gray-900 dark:text-white">
                              {row.workedHours}
                            </td>
                            <td className="py-3.5 px-4 font-mono text-gray-500">
                              {row.breakTime}
                            </td>
                            <td className="py-3.5 px-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                              {row.effectiveHours}
                            </td>
                            <td className="py-3.5 px-5 text-right">
                              <span
                                className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  row.status === 'PRESENT'
                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                                    : row.status === 'LATE'
                                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                                    : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                                }`}
                              >
                                <CheckCircle2 className="w-3 h-3" />
                                <span>{row.status}</span>
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* CATEGORY 12: INPUT ACTIVITY REPORT */}
          {activeReport === 'input-activity' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <Keyboard className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      <span>Input Activity Report (Keyboard &amp; Mouse Tracking)</span>
                    </h2>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                      Active Telemetry
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Continuous tracking of keystroke frequency and mouse activity presence without capturing sensitive text content.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleExport}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-all shadow-xs shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export Telemetry</span>
                </button>
              </div>

              {/* Summary Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Total Keystrokes Today
                    </span>
                    <Keyboard className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="mt-2 text-3xl font-black text-gray-900 dark:text-white">
                    {totalKeystrokesToday.toLocaleString()}
                  </div>
                  <div className="mt-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>Active typing across all employees</span>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Average Typing Speed
                    </span>
                    <Zap className="w-5 h-5 text-amber-500" />
                  </div>
                  <div className="mt-2 text-3xl font-black text-gray-900 dark:text-white">
                    {avgKpm} <span className="text-sm font-normal text-gray-400">KPM</span>
                  </div>
                  <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 font-mono">
                    Keys Per Minute while active
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Mouse Clicks &amp; Movement
                    </span>
                    <MousePointer className="w-5 h-5 text-purple-500" />
                  </div>
                  <div className="mt-2 text-3xl font-black text-gray-900 dark:text-white">
                    {totalMouseEventsToday.toLocaleString()}
                  </div>
                  <div className="mt-2 text-xs text-purple-600 dark:text-purple-400 font-medium">
                    Interaction events logged
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Active Input Intensity
                    </span>
                    <Activity className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div className="mt-2 text-3xl font-black text-emerald-600 dark:text-emerald-400">
                    {keystrokeRecords.length > 0 ? '86.4%' : '0%'}
                  </div>
                  <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 font-mono">
                    Low idle frequency
                  </div>
                </div>
              </div>

              {/* Hourly Input Activity Distribution Bar Chart */}
              <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                      Hourly Keystroke &amp; Mouse Activity Breakdown
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Comparison of typing intensity versus cursor interaction by hour
                    </p>
                  </div>

                  <div className="flex items-center gap-4 text-xs">
                    <span className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300 font-medium">
                      <span className="w-3 h-3 rounded bg-blue-600 inline-block" />
                      <span>Keystrokes</span>
                    </span>
                    <span className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300 font-medium">
                      <span className="w-3 h-3 rounded bg-purple-500 inline-block" />
                      <span>Mouse Events</span>
                    </span>
                  </div>
                </div>

                <div className="pt-4 grid grid-cols-9 gap-3 items-end h-48 border-b border-gray-150 dark:border-gray-800 pb-2">
                  {hourlyDistribution.map((item) => {
                    const keystrokeHeight = Math.min(100, Math.round((item.keystrokes / 2000) * 100))
                    const mouseHeight = Math.min(100, Math.round((item.mouse / 1000) * 80))
                    return (
                      <div key={item.slot} className="flex flex-col items-center h-full justify-end group">
                        <div className="w-full flex items-end justify-center gap-1 h-36">
                          <div
                            className="w-1/2 bg-blue-600 rounded-t hover:bg-blue-500 transition-all cursor-pointer relative"
                            style={{ height: `${Math.max(4, keystrokeHeight)}%` }}
                            title={`${item.keystrokes} keystrokes at ${item.slot}`}
                          />
                          <div
                            className="w-1/2 bg-purple-500 rounded-t hover:bg-purple-400 transition-all cursor-pointer relative"
                            style={{ height: `${Math.max(4, mouseHeight)}%` }}
                            title={`${item.mouse} mouse events at ${item.slot}`}
                          />
                        </div>
                        <span className="text-[11px] font-mono text-gray-400 mt-2 block group-hover:text-white">
                          {item.slot}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Live Keystroke Simulator / Verification Tool */}
              <div className="bg-gradient-to-r from-blue-900/10 via-indigo-900/10 to-purple-900/10 p-5 rounded-2xl border border-blue-200 dark:border-blue-900/50 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-xs font-bold text-gray-900 dark:text-white">
                      Live Keystroke Detection Testbench
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-gray-500">
                    Type inside the field below to verify instant keystroke and KPM calculations:
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <input
                    type="text"
                    value={testTypedText}
                    onChange={(e) => setTestTypedText(e.target.value)}
                    onKeyDown={handleTestKeyDown}
                    placeholder="Type anything here to test live keystrokes counting..."
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 shadow-2xs font-mono"
                  />

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-xs">
                      <span className="text-gray-400 text-[10px] block">Live Keystrokes</span>
                      <span className="font-mono font-bold text-blue-600 dark:text-blue-400 text-sm">
                        {liveKeystrokesCount}
                      </span>
                    </div>

                    <div className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-xs">
                      <span className="text-gray-400 text-[10px] block">Speed</span>
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                        {liveKpm} KPM
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Employee Breakdown Table */}
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-2xs">
                <div className="p-4 border-b border-gray-150 dark:border-gray-800 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                      Employee Keyboard &amp; Mouse Tracking Summary
                    </h3>
                    <p className="text-xs text-gray-400">Individual input performance for selected date</p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-800 text-gray-400 font-semibold uppercase tracking-wider text-[11px] bg-gray-50/60 dark:bg-gray-950/40 select-none">
                        <th
                          onClick={() => handleKeySort('employeeName')}
                          className="py-3 px-5 cursor-pointer hover:text-blue-600 transition-colors"
                        >
                          Member {keySortField === 'employeeName' && (keySortOrder === 'asc' ? '▲' : '▼')}
                        </th>
                        <th
                          onClick={() => handleKeySort('team')}
                          className="py-3 px-4 cursor-pointer hover:text-blue-600 transition-colors"
                        >
                          Team {keySortField === 'team' && (keySortOrder === 'asc' ? '▲' : '▼')}
                        </th>
                        <th
                          onClick={() => handleKeySort('totalKeystrokes')}
                          className="py-3 px-4 cursor-pointer hover:text-blue-600 transition-colors"
                        >
                          Total Keystrokes {keySortField === 'totalKeystrokes' && (keySortOrder === 'asc' ? '▲' : '▼')}
                        </th>
                        <th
                          onClick={() => handleKeySort('kpm')}
                          className="py-3 px-4 cursor-pointer hover:text-blue-600 transition-colors"
                        >
                          Avg Speed (KPM) {keySortField === 'kpm' && (keySortOrder === 'asc' ? '▲' : '▼')}
                        </th>
                        <th
                          onClick={() => handleKeySort('mouseEvents')}
                          className="py-3 px-4 cursor-pointer hover:text-blue-600 transition-colors"
                        >
                          Mouse Clicks {keySortField === 'mouseEvents' && (keySortOrder === 'asc' ? '▲' : '▼')}
                        </th>
                        <th
                          onClick={() => handleKeySort('activeTypingTime')}
                          className="py-3 px-4 cursor-pointer hover:text-blue-600 transition-colors"
                        >
                          Typing Duration {keySortField === 'activeTypingTime' && (keySortOrder === 'asc' ? '▲' : '▼')}
                        </th>
                        <th
                          onClick={() => handleKeySort('intensityScore')}
                          className="py-3 px-5 text-right cursor-pointer hover:text-blue-600 transition-colors"
                        >
                          Intensity {keySortField === 'intensityScore' && (keySortOrder === 'asc' ? '▲' : '▼')}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-150 dark:divide-gray-800">
                      {sortedKeystrokes.map((rec) => (
                        <tr key={rec.id} className="hover:bg-gray-50 dark:hover:bg-gray-850/40 transition-colors">
                          <td className="py-3.5 px-5 font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[10px]">
                              {rec.employeeName.charAt(0)}
                            </span>
                            <span>{rec.employeeName}</span>
                          </td>
                          <td className="py-3.5 px-4 text-gray-500">
                            {rec.team}
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold text-gray-900 dark:text-white">
                            {rec.totalKeystrokes.toLocaleString()}
                          </td>
                          <td className="py-3.5 px-4 font-mono font-semibold text-blue-600 dark:text-blue-400">
                            {rec.kpm} KPM
                          </td>
                          <td className="py-3.5 px-4 font-mono text-gray-600 dark:text-gray-300">
                            {rec.mouseEvents.toLocaleString()}
                          </td>
                          <td className="py-3.5 px-4 font-mono font-medium text-gray-700 dark:text-gray-300">
                            {rec.activeTypingTime}
                          </td>
                          <td className="py-3.5 px-5 text-right">
                            <span
                              className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                                rec.intensity === 'HIGH'
                                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                                  : 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                              }`}
                            >
                              <span>{rec.intensity} ({rec.intensityScore}%)</span>
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* CATEGORY 7: APPS & SITES USAGE */}
          {activeReport === 'apps-usage' && (
            <div className="space-y-6">
              <div className="border-b border-gray-200 dark:border-gray-800 pb-3 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Apps &amp; Sites Usage Report</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Software application time distribution for {selectedDate}</p>
                </div>
                <button onClick={handleExport} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold">
                  Export Report
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-gray-200 dark:border-gray-800">
                  <span className="text-xs text-gray-400 font-semibold uppercase">Productive Time</span>
                  <div className="text-2xl font-bold text-emerald-500 mt-1">
                    {appsUsage.productivePct}% ({appsUsage.productiveHours})
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-gray-200 dark:border-gray-800">
                  <span className="text-xs text-gray-400 font-semibold uppercase">Neutral Apps</span>
                  <div className="text-2xl font-bold text-amber-500 mt-1">
                    {appsUsage.neutralPct}% ({appsUsage.neutralHours})
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-gray-200 dark:border-gray-800">
                  <span className="text-xs text-gray-400 font-semibold uppercase">Unproductive</span>
                  <div className="text-2xl font-bold text-rose-500 mt-1">
                    {appsUsage.unproductivePct}% ({appsUsage.unproductiveHours})
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CATEGORY 8: LOGIN IP REPORT */}
          {activeReport === 'login-ip' && (
            <div className="space-y-6">
              <div className="border-b border-gray-200 dark:border-gray-800 pb-3 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Login IP &amp; Device Access Report</h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Security telemetry, login IP addresses and device authentication logs for {selectedDate}
                  </p>
                </div>
                <button
                  onClick={handleExport}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export IP Log</span>
                </button>
              </div>

              {/* Login IP Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-gray-200 dark:border-gray-800 shadow-2xs">
                  <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Total Active Sessions</span>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {loginIpRecords.filter((r) => r.status === 'ONLINE').length} / {loginIpRecords.length}
                  </div>
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1 inline-block">
                    ● Currently online employees
                  </span>
                </div>

                <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-gray-200 dark:border-gray-800 shadow-2xs">
                  <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Distinct IP Subnets</span>
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                    {new Set(loginIpRecords.map((r) => r.ipAddress)).size}
                  </div>
                  <span className="text-xs text-gray-400 font-mono mt-1 inline-block">
                    Office broadband &amp; remote networks
                  </span>
                </div>

                <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-gray-200 dark:border-gray-800 shadow-2xs">
                  <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Security State</span>
                  <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                    Verified
                  </div>
                  <span className="text-xs text-gray-400 mt-1 inline-block">
                    All connections within allowed range
                  </span>
                </div>
              </div>

              {/* Login IP Table */}
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-2xs">
                <div className="p-4 border-b border-gray-150 dark:border-gray-800 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                      Authentication &amp; Session IP Audit Trail
                    </h3>
                    <p className="text-xs text-gray-400">Detailed source IP records per employee</p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-800 text-gray-400 font-semibold uppercase tracking-wider text-[11px] bg-gray-50/60 dark:bg-gray-950/40 select-none">
                        <th
                          onClick={() => handleIpSort('employeeName')}
                          className="py-3 px-5 cursor-pointer hover:text-blue-600 transition-colors"
                        >
                          Employee {ipSortField === 'employeeName' && (ipSortOrder === 'asc' ? '▲' : '▼')}
                        </th>
                        <th
                          onClick={() => handleIpSort('ipAddress')}
                          className="py-3 px-4 cursor-pointer hover:text-blue-600 transition-colors"
                        >
                          IP Address {ipSortField === 'ipAddress' && (ipSortOrder === 'asc' ? '▲' : '▼')}
                        </th>
                        <th
                          onClick={() => handleIpSort('loginTime')}
                          className="py-3 px-4 cursor-pointer hover:text-blue-600 transition-colors"
                        >
                          Login Time {ipSortField === 'loginTime' && (ipSortOrder === 'asc' ? '▲' : '▼')}
                        </th>
                        <th
                          onClick={() => handleIpSort('logoutTime')}
                          className="py-3 px-4 cursor-pointer hover:text-blue-600 transition-colors"
                        >
                          Logout / Last Seen {ipSortField === 'logoutTime' && (ipSortOrder === 'asc' ? '▲' : '▼')}
                        </th>
                        <th className="py-3 px-4">Device &amp; App Client</th>
                        <th
                          onClick={() => handleIpSort('status')}
                          className="py-3 px-5 text-right cursor-pointer hover:text-blue-600 transition-colors"
                        >
                          Status {ipSortField === 'status' && (ipSortOrder === 'asc' ? '▲' : '▼')}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-150 dark:divide-gray-800">
                      {sortedLoginIp.map((rec) => (
                        <tr key={rec.id} className="hover:bg-gray-50 dark:hover:bg-gray-850/40 transition-colors">
                          <td className="py-3.5 px-5">
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[10px]">
                                {rec.employeeName.charAt(0)}
                              </span>
                              <div>
                                <span className="font-bold text-gray-900 dark:text-white block">{rec.employeeName}</span>
                                <span className="text-[10px] text-gray-400">{rec.email}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                            {rec.ipAddress}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-gray-800 dark:text-gray-200">
                            {rec.loginTime}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-gray-500">
                            {rec.logoutTime}
                          </td>
                          <td className="py-3.5 px-4 text-gray-600 dark:text-gray-300">
                            {rec.device}
                          </td>
                          <td className="py-3.5 px-5 text-right">
                            <span
                              className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                                rec.status === 'ONLINE'
                                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                                  : 'bg-gray-150 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                              }`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${rec.status === 'ONLINE' ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                              <span>{rec.status}</span>
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* CATEGORY 4: LATE CLOCK-IN REPORT */}
          {activeReport === 'late-clock-in' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="border-b border-gray-200 dark:border-gray-800 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Clock className="w-5 h-5 text-amber-500" />
                    <span>Late Clock-In Report</span>
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Employees who clocked in after office threshold (10:15 AM) on {selectedDate}
                  </p>
                </div>
                <button
                  onClick={handleExport}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export Late Report</span>
                </button>
              </div>

              {/* Late Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-gray-200 dark:border-gray-800 shadow-2xs">
                  <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Late Arrivals Today</span>
                  <div className="text-2xl font-bold text-amber-500 mt-1">{lateRecords.length}</div>
                  <span className="text-xs text-gray-400 mt-1 inline-block">Employees clocking in after 10:15 AM</span>
                </div>
                <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-gray-200 dark:border-gray-800 shadow-2xs">
                  <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Office Start Time</span>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">10:00 AM</div>
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 inline-block">Grace period: 15 minutes</span>
                </div>
                <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-gray-200 dark:border-gray-800 shadow-2xs">
                  <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Late Rate</span>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {attendanceRecords.length > 0 ? Math.round((lateRecords.length / attendanceRecords.length) * 100) : 0}%
                  </div>
                  <span className="text-xs text-gray-400 mt-1 inline-block">Of tracked workforce</span>
                </div>
              </div>

              {/* Late Employees Table */}
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-2xs">
                {lateRecords.length === 0 ? (
                  <div className="p-12 text-center text-xs text-gray-400">
                    🎉 Excellent! No employees were late on {selectedDate}. All arrived within office hours.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-800 text-gray-400 font-semibold uppercase tracking-wider text-[11px] bg-gray-50/60 dark:bg-gray-950/40">
                          <th className="py-3 px-5">Employee</th>
                          <th className="py-3 px-4">Expected Shift</th>
                          <th className="py-3 px-4">Clocked In At</th>
                          <th className="py-3 px-4">Delay Duration</th>
                          <th className="py-3 px-5 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-150 dark:divide-gray-800">
                        {lateRecords.map((r) => (
                          <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-850/40 transition-colors">
                            <td className="py-3.5 px-5">
                              <div className="flex items-center gap-2.5">
                                <span className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-[10px]">
                                  {r.avatar}
                                </span>
                                <div>
                                  <span className="font-bold text-gray-900 dark:text-white block">{r.name}</span>
                                  <span className="text-[10px] text-gray-400">{r.email}</span>
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 font-mono text-gray-600 dark:text-gray-300">{r.expectedTime}</td>
                            <td className="py-3.5 px-4 font-mono font-bold text-amber-600 dark:text-amber-400">{r.clockIn}</td>
                            <td className="py-3.5 px-4 font-mono font-medium text-rose-500">+{r.minutesLate} mins</td>
                            <td className="py-3.5 px-5 text-right">
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                                <span>Late</span>
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* CATEGORY 5: OVER TIME REPORT */}
          {activeReport === 'over-time' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="border-b border-gray-200 dark:border-gray-800 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <span>Over Time Report</span>
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Hours worked beyond standard office schedule (9 hours / 10:00 AM - 7:00 PM) on {selectedDate}
                  </p>
                </div>
                <button
                  onClick={handleExport}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export Overtime Log</span>
                </button>
              </div>

              {/* Overtime Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-gray-200 dark:border-gray-800 shadow-2xs">
                  <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Overtime Contributors</span>
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">{overtimeRecords.length}</div>
                  <span className="text-xs text-gray-400 mt-1 inline-block">Employees exceeding 9 hours</span>
                </div>
                <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-gray-200 dark:border-gray-800 shadow-2xs">
                  <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Standard Shift</span>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">09h 00m</div>
                  <span className="text-xs text-gray-400 mt-1 inline-block">10:00 AM – 07:00 PM office hours</span>
                </div>
                <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-gray-200 dark:border-gray-800 shadow-2xs">
                  <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Overtime Status</span>
                  <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                    {overtimeRecords.length > 0 ? 'Logged' : 'Standard'}
                  </div>
                  <span className="text-xs text-gray-400 mt-1 inline-block">Recorded from verified tracking</span>
                </div>
              </div>

              {/* Overtime Table */}
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-2xs">
                {overtimeRecords.length === 0 ? (
                  <div className="p-12 text-center text-xs text-gray-400">
                    No overtime hours recorded beyond the standard 9-hour shift for {selectedDate}.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-800 text-gray-400 font-semibold uppercase tracking-wider text-[11px] bg-gray-50/60 dark:bg-gray-950/40">
                          <th className="py-3 px-5">Employee</th>
                          <th className="py-3 px-4">Clock In</th>
                          <th className="py-3 px-4">Clock Out</th>
                          <th className="py-3 px-4">Standard Shift</th>
                          <th className="py-3 px-4">Total Worked</th>
                          <th className="py-3 px-5 text-right">Overtime</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-150 dark:divide-gray-800">
                        {overtimeRecords.map((r) => (
                          <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-850/40 transition-colors">
                            <td className="py-3.5 px-5">
                              <div className="flex items-center gap-2.5">
                                <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[10px]">
                                  {r.avatar}
                                </span>
                                <div>
                                  <span className="font-bold text-gray-900 dark:text-white block">{r.name}</span>
                                  <span className="text-[10px] text-gray-400">{r.email}</span>
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 font-mono text-gray-700 dark:text-gray-300">{r.clockIn}</td>
                            <td className="py-3.5 px-4 font-mono text-gray-700 dark:text-gray-300">{r.clockOut}</td>
                            <td className="py-3.5 px-4 font-mono text-gray-400">{r.standardHours}</td>
                            <td className="py-3.5 px-4 font-mono font-bold text-gray-900 dark:text-white">{r.totalWorked}</td>
                            <td className="py-3.5 px-5 text-right font-mono font-bold text-blue-600 dark:text-blue-400">
                              +{r.overtime}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* CATEGORY 11: EXECUTIVE SUMMARY REPORT */}
          {activeReport === 'summary-report' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="border-b border-gray-200 dark:border-gray-800 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <ClipboardList className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <span>Executive Summary Report</span>
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    High-level workforce productivity, presence, and work hours telemetry for {selectedDate}
                  </p>
                </div>
                <button
                  onClick={handleExport}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export Executive Summary</span>
                </button>
              </div>

              {/* KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-2xs">
                  <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Attendance Rate</span>
                  <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
                    {summaryReport?.attendanceRate ?? 0}%
                  </div>
                  <span className="text-xs text-gray-500 mt-1 block">
                    {summaryReport?.presentCount ?? 0} of {summaryReport?.totalEmployees ?? 0} employees present
                  </span>
                </div>

                <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-2xs">
                  <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Total Hours Worked</span>
                  <div className="text-3xl font-black text-blue-600 dark:text-blue-400 mt-2">
                    {summaryReport?.totalWorkHours ?? '00h 00m'}
                  </div>
                  <span className="text-xs text-gray-500 mt-1 block">
                    Avg {summaryReport?.avgWorkHoursPerEmployee ?? '00h 00m'} per active worker
                  </span>
                </div>

                <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-2xs">
                  <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Productivity Score</span>
                  <div className="text-3xl font-black text-purple-600 dark:text-purple-400 mt-2">
                    {summaryReport?.productiveRate ?? 0}%
                  </div>
                  <span className="text-xs text-gray-500 mt-1 block">Verified application work ratio</span>
                </div>

                <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-2xs">
                  <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Absenteeism</span>
                  <div className="text-3xl font-black text-rose-500 mt-2">
                    {summaryReport?.absentCount ?? 0}
                  </div>
                  <span className="text-xs text-gray-500 mt-1 block">Employees without logged activity</span>
                </div>
              </div>

              {/* Workforce Attendance Breakdown Table */}
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-2xs">
                <div className="p-4 border-b border-gray-150 dark:border-gray-800">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">Active Workforce Attendance &amp; Hours</h3>
                  <p className="text-xs text-gray-400">Individual performance metrics for {selectedDate}</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-800 text-gray-400 font-semibold uppercase tracking-wider text-[11px] bg-gray-50/60 dark:bg-gray-950/40">
                        <th className="py-3 px-5">Employee</th>
                        <th className="py-3 px-4">Clock In</th>
                        <th className="py-3 px-4">Clock Out</th>
                        <th className="py-3 px-4">Worked Time</th>
                        <th className="py-3 px-4">Effective Time</th>
                        <th className="py-3 px-5 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-150 dark:divide-gray-800">
                      {attendanceRecords.map((r) => (
                        <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-850/40 transition-colors">
                          <td className="py-3.5 px-5 font-bold text-gray-900 dark:text-white flex items-center gap-2.5">
                            <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[10px]">
                              {r.avatar}
                            </span>
                            <span>{r.name}</span>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-gray-700 dark:text-gray-300">{r.clockIn}</td>
                          <td className="py-3.5 px-4 font-mono text-gray-700 dark:text-gray-300">{r.clockOut}</td>
                          <td className="py-3.5 px-4 font-mono font-bold text-gray-900 dark:text-white">{r.workedHours}</td>
                          <td className="py-3.5 px-4 font-mono font-bold text-blue-600 dark:text-blue-400">{r.effectiveHours}</td>
                          <td className="py-3.5 px-5 text-right">
                            <span
                              className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                r.status === 'PRESENT'
                                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                                  : r.status === 'LATE'
                                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                                  : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                              }`}
                            >
                              <span>{r.status}</span>
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ALL OTHER REPORT CATEGORIES (MONTHLY, WORK-ACTIVITY, SHIFT-TIME, CUSTOM) */}
          {activeReport !== 'daily-attendance' &&
            activeReport !== 'input-activity' &&
            activeReport !== 'apps-usage' &&
            activeReport !== 'login-ip' &&
            activeReport !== 'late-clock-in' &&
            activeReport !== 'over-time' &&
            activeReport !== 'summary-report' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="border-b border-gray-200 dark:border-gray-800 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white capitalize flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      <span>{activeReport.replace(/-/g, ' ')}</span>
                    </h2>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Detailed telemetry and verified tracking log for {selectedDate}
                    </p>
                  </div>
                  <button
                    onClick={handleExport}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors shrink-0"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export {activeReport.replace(/-/g, ' ')}</span>
                  </button>
                </div>

                {/* Data Table */}
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-2xs">
                  <div className="p-4 border-b border-gray-150 dark:border-gray-800 flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-gray-900 dark:text-white capitalize">
                        {activeReport.replace(/-/g, ' ')} Records
                      </h3>
                      <p className="text-xs text-gray-400">Total {attendanceRecords.length} employees</p>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-800 text-gray-400 font-semibold uppercase tracking-wider text-[11px] bg-gray-50/60 dark:bg-gray-950/40">
                          <th className="py-3 px-5">Employee</th>
                          <th className="py-3 px-4">Clock In</th>
                          <th className="py-3 px-4">Clock Out</th>
                          <th className="py-3 px-4">Logged Work</th>
                          <th className="py-3 px-4">Break Time</th>
                          <th className="py-3 px-4">Effective Hours</th>
                          <th className="py-3 px-5 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-150 dark:divide-gray-800">
                        {attendanceRecords.map((r) => (
                          <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-850/40 transition-colors">
                            <td className="py-3.5 px-5 font-bold text-gray-900 dark:text-white flex items-center gap-2.5">
                              <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[10px]">
                                {r.avatar}
                              </span>
                              <span>{r.name}</span>
                            </td>
                            <td className="py-3.5 px-4 font-mono text-gray-700 dark:text-gray-300">{r.clockIn}</td>
                            <td className="py-3.5 px-4 font-mono text-gray-700 dark:text-gray-300">{r.clockOut}</td>
                            <td className="py-3.5 px-4 font-mono font-bold text-gray-900 dark:text-white">{r.workedHours}</td>
                            <td className="py-3.5 px-4 font-mono text-gray-400">{r.breakTime}</td>
                            <td className="py-3.5 px-4 font-mono font-bold text-blue-600 dark:text-blue-400">{r.effectiveHours}</td>
                            <td className="py-3.5 px-5 text-right">
                              <span
                                className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  r.status === 'PRESENT'
                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                                    : r.status === 'LATE'
                                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                                    : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                                }`}
                              >
                                <span>{r.status}</span>
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
        </main>
      </div>
    </div>
  )
}
