'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import {
  Users,
  Image as ImageIcon,
  Clock,
  Activity,
  ArrowRight,
  TrendingUp,
  RefreshCw,
  Laptop,
  Palmtree,
  Calendar,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Monitor,
  CheckCircle2,
  AppWindow,
} from 'lucide-react'
import AdminHeader from '../admin-header'

type ScreenshotCard = {
  id: string
  storage_path: string
  taken_at: string
  users?: {
    full_name?: string | null
    email: string
  } | null
}

interface TopAppItem {
  id: string
  name: string
  hours: string
  rawHours: number
  category: string
  bgClass: string
  badgeBg: string
  badgeText: string
}

const COLOR_SCHEMES = [
  {
    bgClass: 'bg-[#d8f3ea] text-[#065f46] border-[#a7f3d0]',
    badgeBg: 'bg-black text-white',
    badgeText: '●',
  },
  {
    bgClass: 'bg-[#fde8ef] text-[#9d174d] border-[#fbcfe8]',
    badgeBg: 'bg-[#00005b] text-[#ea77ff]',
    badgeText: '★',
  },
  {
    bgClass: 'bg-[#ede9fe] text-[#5b21b6] border-[#ddd6fe]',
    badgeBg: 'bg-[#00005b] text-[#9999ff]',
    badgeText: '◆',
  },
  {
    bgClass: 'bg-[#fef3c7] text-[#92400e] border-[#fde68a]',
    badgeBg: 'bg-amber-600 text-white',
    badgeText: '▲',
  },
  {
    bgClass: 'bg-[#e0f2fe] text-[#075985] border-[#bae6fd]',
    badgeBg: 'bg-[#0284c7] text-white',
    badgeText: '■',
  },
  {
    bgClass: 'bg-[#fef9c3] text-[#854d0e] border-[#fef08a]',
    badgeBg: 'bg-[#007acc] text-white',
    badgeText: '⟨/⟩',
  },
]

function formatDuration(totalSeconds: number): string {
  if (!totalSeconds || totalSeconds <= 0) return '0m'
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(false)
  const [activeAppPill, setActiveAppPill] = useState<string>('')
  const [dbScreenshots, setDbScreenshots] = useState<ScreenshotCard[]>([])

  // Live Stats State
  const [stats, setStats] = useState({
    totalMembers: 0,
    currentlyWorking: 0,
    currentlyOnBreak: 0,
    currentlyStopped: 0,
    appNotInstalled: 0,
  })

  // Live Work Hours & Apps State
  const [workHoursList, setWorkHoursList] = useState<
    Array<{
      id: string
      name: string
      hoursWorked: string
      clockIn: string
      color: string
    }>
  >([])

  const [topAppsList, setTopAppsList] = useState<TopAppItem[]>([])

  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321'

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true)
      const todayStr = new Date().toISOString().slice(0, 10)

      const [timesheetRes, appsRes, screenshotsRes] = await Promise.all([
        fetch(`/api/admin/timesheet?date=${todayStr}`, { cache: 'no-store' }),
        fetch('/api/admin/apps/review', { cache: 'no-store' }),
        fetch('/api/admin/screenshots?limit=6', { cache: 'no-store' }),
      ])

      const timesheetJson = await timesheetRes.json()
      const appsJson = await appsRes.json()
      const screenshotsJson = await screenshotsRes.json()

      // 1. Process Timesheet
      if (timesheetJson.success && Array.isArray(timesheetJson.employees)) {
        const emps = timesheetJson.employees
        const working = emps.filter((e: any) => e.status === 'Active').length
        const stopped = emps.filter((e: any) => e.status === 'Completed').length
        const notInstalled = emps.filter(
          (e: any) => e.status === 'Yet to start work' && (!e.metrics.workedDays || e.metrics.workedDays === 0)
        ).length

        setStats({
          totalMembers: emps.length,
          currentlyWorking: working,
          currentlyOnBreak: 0,
          currentlyStopped: stopped,
          appNotInstalled: notInstalled,
        })

        setWorkHoursList(
          emps.map((e: any, idx: number) => ({
            id: e.id,
            name: e.name,
            hoursWorked: e.metrics?.workDuration || '00h 00m',
            clockIn: e.metrics?.inTime !== '00:00' ? e.metrics.inTime : 'Not clocked in',
            color: e.avatarColor || COLOR_SCHEMES[idx % COLOR_SCHEMES.length].bgClass,
          }))
        )
      }

      // 2. Process Top Apps
      if (appsJson.success && Array.isArray(appsJson.topUsed)) {
        const rawApps: any[] = appsJson.topUsed.filter(
          (a: any) => a.totalSeconds > 0 || a.count > 0
        )

        const mappedApps: TopAppItem[] = rawApps.slice(0, 6).map((app: any, idx: number) => {
          const scheme = COLOR_SCHEMES[idx % COLOR_SCHEMES.length]
          return {
            id: `app-${idx}`,
            name: app.name,
            hours: formatDuration(app.totalSeconds),
            rawHours: app.totalSeconds,
            category: app.classification || 'Software Activity',
            bgClass: scheme.bgClass,
            badgeBg: scheme.badgeBg,
            badgeText: app.type === 'DOMAIN' ? '🌐' : '⚡',
          }
        })

        setTopAppsList(mappedApps)
        if (mappedApps.length > 0 && !activeAppPill) {
          setActiveAppPill(mappedApps[0].id)
        }
      }

      // 3. Process Screenshots
      if (screenshotsJson.success && screenshotsJson.screenshots) {
        setDbScreenshots(screenshotsJson.screenshots as ScreenshotCard[])
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err)
    } finally {
      setLoading(false)
    }
  }, [activeAppPill])

  useEffect(() => {
    fetchDashboardData()

    // Poll every 15 seconds for live sync
    const interval = setInterval(() => {
      fetchDashboardData()
    }, 15000)

    return () => clearInterval(interval)
  }, [fetchDashboardData])

  const maxRawHours = useMemo(() => {
    if (topAppsList.length === 0) return 1
    return Math.max(...topAppsList.map((a) => a.rawHours), 1)
  }, [topAppsList])

  return (
    <div className="min-h-full bg-[#f8f9fa] dark:bg-gray-950 pb-20 font-sans">
      {/* Top Header Bar */}
      <AdminHeader
        title="Overview"
        subtitle="Live team tracking status, top used apps, and productivity overview"
        searchPlaceholder="Search in overview"
        loading={loading}
        onRefresh={fetchDashboardData}
        onUserAdded={fetchDashboardData}
      />

      <div className="p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto">
        {/* ROW 1: Top 5 Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {/* 1. Total Team Members */}
          <div className="bg-white dark:bg-gray-900 rounded-xl p-5 border border-gray-200/80 dark:border-gray-800 shadow-2xs hover:shadow-xs transition-shadow">
            <span className="text-[13px] font-normal text-gray-500 dark:text-gray-400 block leading-tight">
              Total Team Members
            </span>
            <div className="mt-2 text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              {stats.totalMembers}
            </div>
          </div>

          {/* 2. Currently Working */}
          <div className="bg-white dark:bg-gray-900 rounded-xl p-5 border border-gray-200/80 dark:border-gray-800 shadow-2xs hover:shadow-xs transition-shadow">
            <span className="text-[13px] font-normal text-gray-500 dark:text-gray-400 block leading-tight">
              Currently Working
            </span>
            <div
              className={`mt-2 text-3xl font-extrabold tracking-tight ${
                stats.currentlyWorking > 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-gray-400 dark:text-gray-500'
              }`}
            >
              {stats.currentlyWorking > 0 ? stats.currentlyWorking : '-'}
            </div>
          </div>

          {/* 3. Currently On Break */}
          <div className="bg-white dark:bg-gray-900 rounded-xl p-5 border border-gray-200/80 dark:border-gray-800 shadow-2xs hover:shadow-xs transition-shadow">
            <span className="text-[13px] font-normal text-gray-500 dark:text-gray-400 block leading-tight">
              Currently On Break
            </span>
            <div className="mt-2 text-3xl font-extrabold text-gray-400 dark:text-gray-500 tracking-tight">
              {stats.currentlyOnBreak > 0 ? stats.currentlyOnBreak : '-'}
            </div>
          </div>

          {/* 4. Currently Stopped Work */}
          <div className="bg-white dark:bg-gray-900 rounded-xl p-5 border border-gray-200/80 dark:border-gray-800 shadow-2xs hover:shadow-xs transition-shadow">
            <span className="text-[13px] font-normal text-gray-500 dark:text-gray-400 block leading-tight">
              Currently Stopped Work
            </span>
            <div className="mt-2 text-3xl font-extrabold text-gray-400 dark:text-gray-500 tracking-tight">
              {stats.currentlyStopped > 0 ? stats.currentlyStopped : '-'}
            </div>
          </div>

          {/* 5. App Not Installed */}
          <div className="bg-white dark:bg-gray-900 rounded-xl p-5 border border-gray-200/80 dark:border-gray-800 shadow-2xs hover:shadow-xs transition-shadow col-span-2 sm:col-span-1">
            <span className="text-[13px] font-normal text-gray-500 dark:text-gray-400 block leading-tight">
              App Not Installed
            </span>
            <div className="mt-2 text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              {stats.appNotInstalled}
            </div>
          </div>
        </div>

        {/* ROW 2: Top Used Apps & Late Clock-in Employees */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Top Used Apps (7 Columns) */}
          <div className="lg:col-span-7 bg-white dark:bg-gray-900 rounded-xl border border-gray-200/80 dark:border-gray-800 p-6 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Top Used Apps
                </h3>
                <Link
                  href="/admin/apps/summary"
                  className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                >
                  <span>View All Apps</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {topAppsList.length === 0 ? (
                <div className="p-8 text-center text-xs text-gray-400">
                  <Monitor className="w-8 h-8 text-gray-300 dark:text-gray-700 mx-auto mb-2" />
                  <p className="font-semibold text-gray-700 dark:text-gray-300">
                    No Application Activity Logged Today
                  </p>
                  <p className="mt-0.5">
                    Start tracking from the employee desktop app to populate real software metrics.
                  </p>
                </div>
              ) : (
                <>
                  {/* Colorful App Pills */}
                  <div className="flex flex-wrap gap-2.5 mb-6">
                    {topAppsList.map((app) => (
                      <button
                        key={app.id}
                        onClick={() => setActiveAppPill(app.id)}
                        className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-semibold transition-all ${
                          app.bgClass
                        } ${
                          activeAppPill === app.id
                            ? 'ring-2 ring-blue-500/40 shadow-xs'
                            : 'opacity-90 hover:opacity-100'
                        }`}
                      >
                        <span
                          className={`w-4 h-4 rounded flex items-center justify-center text-[10px] font-bold ${app.badgeBg}`}
                        >
                          {app.badgeText}
                        </span>
                        <span>{app.name}</span>
                      </button>
                    ))}
                  </div>

                  <div className="w-16 h-1 bg-gray-400 dark:bg-gray-600 rounded-full mb-6" />

                  {/* Table / Usage Breakdown */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 pb-2 border-b border-gray-100 dark:border-gray-800">
                      <span>Website / Application</span>
                      <span>Hours Tracked</span>
                    </div>

                    <div className="divide-y divide-gray-100 dark:divide-gray-800/60 text-xs">
                      {topAppsList.map((app) => {
                        const pct = Math.round((app.rawHours / maxRawHours) * 100)
                        return (
                          <div key={app.id} className="py-2.5 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3 min-w-[200px]">
                              <span
                                className={`w-5 h-5 rounded flex items-center justify-center text-[11px] font-bold shrink-0 ${app.badgeBg}`}
                              >
                                {app.badgeText}
                              </span>
                              <div>
                                <span className="font-semibold text-gray-800 dark:text-gray-200">
                                  {app.name}
                                </span>
                                <span className="text-[10px] text-gray-400 block">{app.category}</span>
                              </div>
                            </div>

                            {/* Progress Bar in middle */}
                            <div className="hidden sm:block flex-1 max-w-xs">
                              <div className="w-full bg-gray-100 dark:bg-gray-800 h-2 rounded-full overflow-hidden">
                                <div
                                  className="bg-blue-600 h-full rounded-full transition-all duration-500"
                                  style={{ width: `${Math.max(5, pct)}%` }}
                                />
                              </div>
                            </div>

                            <span className="font-mono font-bold text-gray-900 dark:text-white text-right">
                              {app.hours}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Late Clock-in Employees (5 Columns) */}
          <div className="lg:col-span-5 bg-white dark:bg-gray-900 rounded-xl border border-gray-200/80 dark:border-gray-800 p-6 shadow-2xs flex flex-col justify-between min-h-[300px]">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Late Clock-in Employees
            </h3>

            <div className="flex-1 flex items-center justify-center p-6 text-center">
              <p className="text-sm text-gray-400 dark:text-gray-500 max-w-xs">
                Late clock-in report is available for one day selection only
              </p>
            </div>

            <div className="text-[11px] text-gray-400 border-t border-gray-100 dark:border-gray-800 pt-3 flex items-center justify-between">
              <span>Automated Attendance Engine</span>
              <span className="text-blue-600 dark:text-blue-400 font-medium">Smart Tracker Time</span>
            </div>
          </div>
        </div>

        {/* ROW 3: Absence Last 7 Days & Recent Screenshots */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Absence Last 7 Days (5 Columns) */}
          <div className="lg:col-span-5 bg-white dark:bg-gray-900 rounded-xl border border-gray-200/80 dark:border-gray-800 p-6 shadow-2xs flex flex-col justify-between min-h-[280px]">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Absence Last 7 Days
            </h3>

            <div className="flex-1 flex items-center justify-center p-6 text-center">
              <p className="text-sm text-gray-400 dark:text-gray-500 max-w-xs">
                Leave report is available for one day selection only
              </p>
            </div>

            <div className="text-[11px] text-gray-400 border-t border-gray-100 dark:border-gray-800 pt-3 flex items-center justify-between">
              <span>Leave &amp; Absence Policy</span>
              <Link
                href="/admin/leave/summary"
                className="text-blue-600 dark:text-blue-400 font-medium hover:underline"
              >
                View Leave Summary →
              </Link>
            </div>
          </div>

          {/* Recent Screenshots (7 Columns) */}
          <div className="lg:col-span-7 bg-white dark:bg-gray-900 rounded-xl border border-gray-200/80 dark:border-gray-800 p-6 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Recent Screenshots
              </h3>
              <Link
                href="/admin/screenshots"
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                <span>All Screenshots</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {dbScreenshots.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-400">
                <ImageIcon className="w-8 h-8 text-gray-300 dark:text-gray-700 mx-auto mb-2" />
                <p className="font-semibold text-gray-700 dark:text-gray-300">
                  No Screenshots Uploaded Today Yet
                </p>
                <p className="mt-0.5">
                  Screenshots captured from active desktop client sessions will stream here in real time.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 overflow-x-auto pb-2">
                {dbScreenshots.map((sc) => {
                  const userDisplayName =
                    sc.users?.full_name || sc.users?.email || 'Employee'
                  const timeStr = new Date(sc.taken_at).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                  return (
                    <Link
                      key={sc.id}
                      href="/admin/screenshots"
                      className="group flex flex-col rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 hover:border-blue-500 transition-all shadow-2xs"
                    >
                      <div className="relative aspect-video overflow-hidden bg-gray-900">
                        <img
                          src={`${baseUrl}/storage/v1/object/public/screenshots/${sc.storage_path}`}
                          alt="Screenshot Capture"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute top-1 right-1 px-1 rounded bg-black/60 text-[9px] font-mono text-white">
                          LIVE
                        </div>
                      </div>
                      <div className="p-2">
                        <span className="font-bold text-xs text-gray-900 dark:text-white block truncate">
                          {userDisplayName}
                        </span>
                        <span className="text-[10px] text-gray-400 font-mono block truncate">
                          {timeStr}
                        </span>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}

            <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs text-gray-400">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Synced via Smart Employee Tracker Agent</span>
              </span>
              <span className="font-mono text-[11px]">Interval automated capture</span>
            </div>
          </div>
        </div>

        {/* ROW 4: Work Hours Summary & Upcoming Holidays */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Work Hours Summary (7 Columns) */}
          <div className="lg:col-span-7 bg-white dark:bg-gray-900 rounded-xl border border-gray-200/80 dark:border-gray-800 p-6 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Work Hours Summary
                </h3>
                <span className="text-xs text-gray-400 font-medium">Shift Statistics</span>
              </div>

              {workHoursList.length === 0 ? (
                <div className="p-8 text-center text-xs text-gray-400">
                  <Clock className="w-8 h-8 text-gray-300 dark:text-gray-700 mx-auto mb-2" />
                  <p className="font-semibold text-gray-700 dark:text-gray-300">
                    No Members Clocked In Yet
                  </p>
                  <p className="mt-0.5">
                    When employees start their shift, their active hours will be calculated here.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-800 text-gray-400 font-semibold uppercase tracking-wider text-[11px]">
                        <th className="py-2.5 px-3">Member</th>
                        <th className="py-2.5 px-3">Hours Worked</th>
                        <th className="py-2.5 px-3 text-right">ClockIn</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60">
                      {workHoursList.map((member) => (
                        <tr
                          key={member.id}
                          className="hover:bg-gray-50/60 dark:hover:bg-gray-850/40 transition-colors"
                        >
                          <td className="py-3 px-3">
                            <Link
                              href="/admin/timesheet"
                              className="font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-2"
                            >
                              <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[10px]">
                                {member.name.charAt(0)}
                              </span>
                              <span>{member.name}</span>
                            </Link>
                          </td>
                          <td className="py-3 px-3 font-mono font-bold text-gray-800 dark:text-gray-200">
                            {member.hoursWorked}
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-medium text-gray-600 dark:text-gray-400">
                            {member.clockIn}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 text-center text-xs text-gray-400">
              Showing {workHoursList.length} registered members
            </div>
          </div>

          {/* Upcoming Holidays (5 Columns) */}
          <div className="lg:col-span-5 bg-white dark:bg-gray-900 rounded-xl border border-gray-200/80 dark:border-gray-800 p-6 shadow-2xs flex flex-col justify-between min-h-[220px]">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Upcoming Holidays
            </h3>

            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
              <div className="w-10 h-10 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-2">
                <Palmtree className="w-5 h-5" />
              </div>
              <p className="text-sm text-gray-400 dark:text-gray-500">
                No holidays found in the next 30 days.
              </p>
            </div>

            <div className="text-[11px] text-gray-400 border-t border-gray-100 dark:border-gray-800 pt-3 flex items-center justify-between">
              <span>Calendar Schedule</span>
              <Link
                href="/admin/leave/holidays"
                className="text-blue-600 dark:text-blue-400 font-medium hover:underline"
              >
                Manage Holidays →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
