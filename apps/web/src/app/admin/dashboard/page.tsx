'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
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
} from 'lucide-react'
import { useAdminFilter } from '../admin-filter-context'
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

const TOP_APPS_DATA = [
  {
    id: 'capcut',
    name: 'CapCut',
    hours: '79,860',
    rawHours: 79860,
    color: 'mint',
    bgClass: 'bg-[#d8f3ea] text-[#065f46] border-[#a7f3d0]',
    badgeBg: 'bg-black text-white',
    badgeText: '✂',
    category: 'Video Editing',
  },
  {
    id: 'premiere',
    name: 'Adobe Premiere Pro 2026',
    hours: '44,640',
    rawHours: 44640,
    color: 'rose',
    bgClass: 'bg-[#fde8ef] text-[#9d174d] border-[#fbcfe8]',
    badgeBg: 'bg-[#00005b] text-[#ea77ff]',
    badgeText: 'Pr',
    category: 'Video Production',
  },
  {
    id: 'aftereffects',
    name: 'Adobe After Effects 2026',
    hours: '40,980',
    rawHours: 40980,
    color: 'purple',
    bgClass: 'bg-[#ede9fe] text-[#5b21b6] border-[#ddd6fe]',
    badgeBg: 'bg-[#00005b] text-[#9999ff]',
    badgeText: 'Ae',
    category: 'Motion Graphics',
  },
  {
    id: 'chrome',
    name: 'Google Chrome',
    hours: '33,660',
    rawHours: 33660,
    color: 'amber',
    bgClass: 'bg-[#fef3c7] text-[#92400e] border-[#fde68a]',
    badgeBg: 'bg-gradient-to-tr from-red-500 via-yellow-400 to-green-500 text-white',
    badgeText: '●',
    category: 'Web Browsing',
  },
  {
    id: 'desktop',
    name: 'mac - Desktop',
    hours: '21,360',
    rawHours: 21360,
    color: 'sky',
    bgClass: 'bg-[#e0f2fe] text-[#075985] border-[#bae6fd]',
    badgeBg: 'bg-[#0284c7] text-white',
    badgeText: '⌘',
    category: 'System Window',
  },
  {
    id: 'code',
    name: 'Code',
    hours: '16,980',
    rawHours: 16980,
    color: 'yellow',
    bgClass: 'bg-[#fef9c3] text-[#854d0e] border-[#fef08a]',
    badgeBg: 'bg-[#007acc] text-white',
    badgeText: '⟨/⟩',
    category: 'Software Development',
  },
]

const WORK_HOURS_SUMMARY = [
  {
    name: 'Masud',
    slug: 'swQoUzG9oBueyaLxgUwMC',
    hoursWorked: '41h 41m',
    clockIn: '10:16 am',
    status: 'ACTIVE',
    color: 'bg-indigo-600',
  },
  {
    name: 'Foyz',
    slug: 'F8WrWHUqx-vPMulgPadl7',
    hoursWorked: '42h 40m',
    clockIn: '10:16 am',
    status: 'ACTIVE',
    color: 'bg-blue-600',
  },
  {
    name: 'Ajim Ali',
    slug: 'x9Xvgqhposz6XFXZXo9pC',
    hoursWorked: '13h 34m',
    clockIn: '03:21 pm',
    status: 'ACTIVE',
    color: 'bg-emerald-600',
  },
]

const SIMULATED_RECENT_SCREENSHOTS = [
  { id: 'sc-1', user: 'Ajim Ali', time: '10:12 am', task: 'CapCut Video Editing', img: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&auto=format&fit=crop&q=80' },
  { id: 'sc-2', user: 'Ajim Ali', time: '10:02 am', task: 'Timeline Color Grading', img: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&auto=format&fit=crop&q=80' },
  { id: 'sc-3', user: 'Ajim Ali', time: '09:52 am', task: 'Audio Waveform Edit', img: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400&auto=format&fit=crop&q=80' },
  { id: 'sc-4', user: 'Masud', time: '09:44 am', task: 'Premiere Pro Motion Cut', img: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&auto=format&fit=crop&q=80' },
  { id: 'sc-5', user: 'Ajim Ali', time: '09:34 am', task: 'B-Roll Clip Trimming', img: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=400&auto=format&fit=crop&q=80' },
  { id: 'sc-6', user: 'Masud', time: '09:24 am', task: 'After Effects Keyframes', img: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=400&auto=format&fit=crop&q=80' },
]

export default function DashboardPage() {
  const [loading, setLoading] = useState(false)
  const [activeAppPill, setActiveAppPill] = useState('capcut')
  const [dbScreenshots, setDbScreenshots] = useState<ScreenshotCard[]>([])

  const supabase = createClient()
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321'

  const fetchLiveScreenshots = async () => {
    try {
      const res = await fetch('/api/admin/screenshots?limit=6', { cache: 'no-store' })
      const json = await res.json()
      if (json.success && json.screenshots && json.screenshots.length > 0) {
        setDbScreenshots(json.screenshots as ScreenshotCard[])
        return
      }

      const { data } = await supabase
        .from('screenshots')
        .select('*, users(full_name, email)')
        .order('taken_at', { ascending: false })
        .limit(6)
      if (data && data.length > 0) {
        setDbScreenshots(data as ScreenshotCard[])
      }
    } catch {
      // Fallback
    }
  }

  useEffect(() => {
    fetchLiveScreenshots()

    const channel = supabase
      .channel('dashboard_recent_screenshots')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'screenshots' },
        () => {
          fetchLiveScreenshots()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const maxHours = 79860

  return (
    <div className="min-h-full bg-[#f8f9fa] dark:bg-gray-950 pb-20 font-sans">
      {/* Top Header Bar */}
      <AdminHeader
        title="Overview"
        subtitle="Live team tracking status, top used apps, and productivity overview"
        searchPlaceholder="Search in overview"
        loading={loading}
        onRefresh={() => {
          setLoading(true)
          fetchLiveScreenshots()
          setTimeout(() => setLoading(false), 500)
        }}
        onUserAdded={() => fetchLiveScreenshots()}
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
              5
            </div>
          </div>

          {/* 2. Currently Working */}
          <div className="bg-white dark:bg-gray-900 rounded-xl p-5 border border-gray-200/80 dark:border-gray-800 shadow-2xs hover:shadow-xs transition-shadow">
            <span className="text-[13px] font-normal text-gray-500 dark:text-gray-400 block leading-tight">
              Currently Working
            </span>
            <div className="mt-2 text-3xl font-extrabold text-gray-400 dark:text-gray-500 tracking-tight">
              -
            </div>
          </div>

          {/* 3. Currently On Break */}
          <div className="bg-white dark:bg-gray-900 rounded-xl p-5 border border-gray-200/80 dark:border-gray-800 shadow-2xs hover:shadow-xs transition-shadow">
            <span className="text-[13px] font-normal text-gray-500 dark:text-gray-400 block leading-tight">
              Currently On Break
            </span>
            <div className="mt-2 text-3xl font-extrabold text-gray-400 dark:text-gray-500 tracking-tight">
              -
            </div>
          </div>

          {/* 4. Currently Stopped Work */}
          <div className="bg-white dark:bg-gray-900 rounded-xl p-5 border border-gray-200/80 dark:border-gray-800 shadow-2xs hover:shadow-xs transition-shadow">
            <span className="text-[13px] font-normal text-gray-500 dark:text-gray-400 block leading-tight">
              Currently Stopped Work
            </span>
            <div className="mt-2 text-3xl font-extrabold text-gray-400 dark:text-gray-500 tracking-tight">
              -
            </div>
          </div>

          {/* 5. App Not Installed */}
          <div className="bg-white dark:bg-gray-900 rounded-xl p-5 border border-gray-200/80 dark:border-gray-800 shadow-2xs hover:shadow-xs transition-shadow col-span-2 sm:col-span-1">
            <span className="text-[13px] font-normal text-gray-500 dark:text-gray-400 block leading-tight">
              App Not Installed
            </span>
            <div className="mt-2 text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              2
            </div>
          </div>
        </div>

        {/* ROW 2: Top Used Apps & Late Clock-in Employees */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Top Used Apps (7 Columns) */}
          <div className="lg:col-span-7 bg-white dark:bg-gray-900 rounded-xl border border-gray-200/80 dark:border-gray-800 p-6 shadow-2xs flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                Top Used Apps
              </h3>

              {/* Colorful App Pills */}
              <div className="flex flex-wrap gap-2.5 mb-6">
                {TOP_APPS_DATA.map((app) => (
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

              {/* Slider underline indicator bar */}
              <div className="w-16 h-1 bg-gray-400 dark:bg-gray-600 rounded-full mb-6" />

              {/* Table / Usage Breakdown */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 pb-2 border-b border-gray-100 dark:border-gray-800">
                  <span>Website / Application</span>
                  <span>Hours per Day</span>
                </div>

                <div className="divide-y divide-gray-100 dark:divide-gray-800/60 text-xs">
                  {TOP_APPS_DATA.map((app) => {
                    const pct = Math.round((app.rawHours / maxHours) * 100)
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
                              style={{ width: `${pct}%` }}
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
            </div>
          </div>

          {/* Late Clock-in Employees (5 Columns) */}
          <div className="lg:col-span-5 bg-white dark:bg-gray-900 rounded-xl border border-gray-200/80 dark:border-gray-800 p-6 shadow-2xs flex flex-col justify-between min-h-[300px]">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Late Clock-in Employees
            </h3>

            {/* Muted Placeholder Message */}
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

            {/* Centered Message */}
            <div className="flex-1 flex items-center justify-center p-6 text-center">
              <p className="text-sm text-gray-400 dark:text-gray-500 max-w-xs">
                Leave report is available for one day selection only
              </p>
            </div>

            <div className="text-[11px] text-gray-400 border-t border-gray-100 dark:border-gray-800 pt-3 flex items-center justify-between">
              <span>Leave & Absence Policy</span>
              <Link href="/admin/leave/summary" className="text-blue-600 dark:text-blue-400 font-medium hover:underline">
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

            {/* Horizontal Scrolling Thumbnails */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 overflow-x-auto pb-2">
              {(dbScreenshots.length > 0
                ? dbScreenshots.map((sc: any) => ({
                    id: sc.id,
                    user: sc.users?.full_name || sc.users?.email || 'Employee',
                    time: new Date(sc.taken_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    task: 'Screen Capture',
                    img: `${baseUrl}/storage/v1/object/public/screenshots/${sc.storage_path}`,
                  }))
                : SIMULATED_RECENT_SCREENSHOTS
              ).map((sc) => (
                <Link
                  key={sc.id}
                  href="/admin/screenshots"
                  className="group flex flex-col rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 hover:border-blue-500 transition-all shadow-2xs"
                >
                  <div className="relative aspect-video overflow-hidden bg-gray-900">
                    <img
                      src={sc.img}
                      alt={sc.task}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-1 right-1 px-1 rounded bg-black/60 text-[9px] font-mono text-white">
                      LIVE
                    </div>
                  </div>
                  <div className="p-2">
                    <span className="font-bold text-xs text-gray-900 dark:text-white block truncate">
                      {sc.user}
                    </span>
                    <span className="text-[10px] text-gray-400 font-mono block truncate">
                      {sc.time}
                    </span>
                  </div>
                </Link>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs text-gray-400">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Synced via Smart Employee Tracker Agent</span>
              </span>
              <span className="font-mono text-[11px]">1-min / 10-min capture rule</span>
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

              {/* Table */}
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
                    {WORK_HOURS_SUMMARY.map((member) => (
                      <tr
                        key={member.slug}
                        className="hover:bg-gray-50/60 dark:hover:bg-gray-850/40 transition-colors"
                      >
                        <td className="py-3 px-3">
                          <Link
                            href={`/admin/timesheet`}
                            className="font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-2"
                          >
                            <span
                              className={`w-6 h-6 rounded-full ${member.color} text-white flex items-center justify-center font-bold text-[10px]`}
                            >
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
            </div>

            <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 text-center text-xs text-gray-400">
              You have seen all the users
            </div>
          </div>

          {/* Upcoming Holidays (5 Columns) */}
          <div className="lg:col-span-5 bg-white dark:bg-gray-900 rounded-xl border border-gray-200/80 dark:border-gray-800 p-6 shadow-2xs flex flex-col justify-between min-h-[220px]">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Upcoming Holidays
            </h3>

            {/* Empty holiday note */}
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
              <Link href="/admin/leave/holidays" className="text-blue-600 dark:text-blue-400 font-medium hover:underline">
                Manage Holidays →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
