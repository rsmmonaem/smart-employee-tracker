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
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      'Name,Clock In,Clock Out,Worked Hours,Break,Effective Hours,Status\n' +
      attendanceRecords
        .map(
          (r) =>
            `"${r.name}","${r.clockIn}","${r.clockOut}","${r.workedHours}","${r.breakTime}","${r.effectiveHours}","${r.status}"`
        )
        .join('\n')

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `${activeReport}_${selectedDate}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
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
                      <tr className="border-b border-gray-200 dark:border-gray-800 text-gray-400 font-semibold uppercase tracking-wider text-[11px] bg-gray-50/60 dark:bg-gray-950/40">
                        <th className="py-3 px-5">Member</th>
                        <th className="py-3 px-4">Team</th>
                        <th className="py-3 px-4">Total Keystrokes</th>
                        <th className="py-3 px-4">Avg Speed (KPM)</th>
                        <th className="py-3 px-4">Mouse Clicks</th>
                        <th className="py-3 px-4">Typing Duration</th>
                        <th className="py-3 px-5 text-right">Intensity</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-150 dark:divide-gray-800">
                      {keystrokeRecords.map((rec) => (
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

          {/* OTHER REPORT CATEGORIES */}
          {activeReport !== 'daily-attendance' &&
            activeReport !== 'input-activity' &&
            activeReport !== 'apps-usage' && (
              <div className="space-y-6">
                <div className="border-b border-gray-200 dark:border-gray-800 pb-3 flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white capitalize">
                      {activeReport.replace(/-/g, ' ')}
                    </h2>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Detailed telemetry records for {selectedDate}
                    </p>
                  </div>
                  <button onClick={handleExport} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold">
                    Export
                  </button>
                </div>

                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-12 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-3">
                    <FileText className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-sm text-gray-900 dark:text-white">
                    {activeReport.replace(/-/g, ' ')} Ready
                  </h3>
                  <p className="text-xs text-gray-400 max-w-sm mx-auto mt-1">
                    Telemetry data compiled live from active tracking sessions on {selectedDate}.
                  </p>
                </div>
              </div>
            )}
        </main>
      </div>
    </div>
  )
}
