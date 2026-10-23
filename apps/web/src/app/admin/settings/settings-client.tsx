'use client'

import React, { useState, useEffect } from 'react'
import {
  Users,
  UserPlus,
  Sliders,
  Bell,
  Mail,
  Zap,
  ChevronRight,
  Download,
  Copy,
  Terminal,
  AlertTriangle,
  ShieldAlert,
  CalendarDays,
} from 'lucide-react'
import TrackSettingsForm from './track-settings-form'
import {
  ManageTeamsView,
  ManageEmployeesView,
  LeavePolicySettingsView,
  RiskUserSettingsView,
  EmailReportsView,
  RebrandSettingsView,
} from './settings-views'

type TabKey =
  | 'download-apps'
  | 'manage-teams'
  | 'manage-employees'
  | 'track-settings'
  | 'leave-policy'
  | 'risk-user'
  | 'email-reports'
  | 'rebrand'

interface NavItem {
  key: TabKey
  label: string
  icon: React.ComponentType<{ className?: string }>
}

const ADMIN_NAV_ITEMS: NavItem[] = [
  { key: 'download-apps', label: 'Download Tracker Apps', icon: Download },
  { key: 'manage-teams', label: 'Manage Teams', icon: Users },
  { key: 'manage-employees', label: 'Manage Employees', icon: UserPlus },
  { key: 'track-settings', label: 'Track Settings', icon: Sliders },
  { key: 'leave-policy', label: 'Leave Policy Settings', icon: CalendarDays },
  { key: 'risk-user', label: 'Risk User Settings', icon: Bell },
  { key: 'email-reports', label: 'Email Reports', icon: Mail },
  { key: 'rebrand', label: 'Rebrand Settings', icon: Zap },
]

interface MemberItem {
  id: string
  full_name?: string | null
  email: string
  role: string
}

interface SettingsClientProps {
  isEmployee: boolean
  userRole?: string
}

export default function SettingsClient({ isEmployee, userRole }: SettingsClientProps) {
  const [activeTab, setActiveTab] = useState<TabKey>(isEmployee ? 'download-apps' : 'track-settings')
  const [members, setMembers] = useState<MemberItem[]>([])

  useEffect(() => {
    if (isEmployee) {
      // Employees are strictly restricted to download-apps
      setActiveTab('download-apps')
      return
    }

    // For Admins: Read URL hash or query if provided
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const tabParam = params.get('tab') as TabKey
      if (tabParam && ADMIN_NAV_ITEMS.some((n) => n.key === tabParam)) {
        setActiveTab(tabParam)
      }
    }

    // Fetch members for admin views only
    fetch('/api/admin/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.members) setMembers(data.members)
      })
      .catch(() => {})
  }, [isEmployee])

  const handleTabChange = (tab: TabKey) => {
    if (isEmployee) {
      // Cannot switch tab
      return
    }
    setActiveTab(tab)
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href)
      url.searchParams.set('tab', tab)
      window.history.replaceState({}, '', url.toString())
    }
  }

  // --- EMPLOYEE VIEW: Clean, full-width download portal with zero access to admin settings ---
  if (isEmployee) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto py-2">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-gray-200 dark:border-gray-800">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-2.5">
              <Download className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              Download Tracker Applications
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Download and run TracMatrix Smart Tracker on your desktop or mobile device to start your shift.
            </p>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 text-xs font-semibold border border-blue-200/60 dark:border-blue-800/60">
            <span>Role: Employee</span>
          </div>
        </div>

        <DownloadAppsView />
      </div>
    )
  }

  // --- ADMIN VIEW: Full configuration suite with sub-sidebar navigation ---
  return (
    <div className="flex flex-col lg:flex-row gap-6 min-h-[calc(100vh-8rem)]">
      {/* Settings Sub-Sidebar matching Smart Employee Tracker design */}
      <aside className="w-full lg:w-64 flex-shrink-0">
        <div className="rounded-xl border border-gray-200/80 bg-white shadow-xs dark:border-gray-800 dark:bg-gray-900 overflow-hidden sticky top-6">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
            <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
              Settings
            </h1>
          </div>

          <nav className="p-2 space-y-0.5">
            {ADMIN_NAV_ITEMS.map((item) => {
              const Icon = item.icon
              const isActive = activeTab === item.key

              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => handleTabChange(item.key)}
                  className={`flex w-full items-center justify-between px-3.5 py-2.5 text-sm rounded-lg transition-all text-left ${
                    isActive
                      ? 'bg-blue-50/90 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 font-semibold'
                      : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800/60 font-normal'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`h-4.5 w-4.5 flex-shrink-0 ${
                        isActive
                          ? 'text-blue-600 dark:text-blue-400 stroke-[2.2]'
                          : 'text-gray-500 dark:text-gray-400 stroke-[1.8]'
                      }`}
                    />
                    <span className="text-[14px]">{item.label}</span>
                  </div>
                  {isActive && (
                    <ChevronRight className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                  )}
                </button>
              )
            })}
          </nav>
        </div>
      </aside>

      {/* Main Settings Content Area */}
      <div className="flex-1 min-w-0">
        {activeTab === 'download-apps' && <DownloadAppsView />}
        {activeTab === 'track-settings' && <TrackSettingsForm />}
        {activeTab === 'manage-teams' && <ManageTeamsView />}
        {activeTab === 'manage-employees' && <ManageEmployeesView members={members} />}
        {activeTab === 'leave-policy' && <LeavePolicySettingsView />}
        {activeTab === 'risk-user' && <RiskUserSettingsView />}
        {activeTab === 'email-reports' && <EmailReportsView />}
        {activeTab === 'rebrand' && <RebrandSettingsView />}
      </div>
    </div>
  )
}

export function DownloadAppsView() {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-gray-200/80 bg-white p-6 shadow-xs dark:border-gray-800 dark:bg-gray-900">
        <div className="border-b border-gray-150 pb-4 dark:border-gray-800">
          <h2 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
            Download Tracker Applications
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Install TracMatrix Smart Tracker on your desktop and mobile devices for time tracking, automated screenshots, and app usage monitoring.
          </p>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Android Card */}
          <div className="flex flex-col justify-between rounded-xl border border-gray-200 bg-gray-50/50 p-5 dark:border-gray-800 dark:bg-gray-850 opacity-90">
            <div>
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300">
                  📱 Mobile (Coming Soon)
                </span>
                <span className="text-xs font-mono text-gray-500">In Development</span>
              </div>
              <h3 className="mt-3 text-lg font-bold text-gray-900 dark:text-white">Android Phone & Tablet</h3>
              <p className="mt-2 text-xs text-gray-600 dark:text-gray-300">
                Mobile time tracking, location telemetry, and background productivity monitoring for on-the-go teams.
              </p>
            </div>
            <div className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-gray-200 dark:bg-gray-800 px-4 py-2.5 text-sm font-semibold text-gray-500 dark:text-gray-400 cursor-not-allowed">
              🚀 Coming Soon
            </div>
          </div>

          {/* macOS Universal & Apple Silicon Card */}
          <div className="flex flex-col justify-between rounded-xl border border-blue-200/80 bg-blue-50/20 p-5 dark:border-blue-900/40 dark:bg-gray-850">
            <div>
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">
                  🍎 macOS
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                  v1.1.0 (Beta)
                </span>
              </div>
              <h3 className="mt-3 text-lg font-bold text-gray-900 dark:text-white">macOS (Apple Silicon & Intel)</h3>
              <p className="mt-2 text-xs text-gray-600 dark:text-gray-300">
                Native macOS desktop agent with 85% WebP screenshot compression, in-app auto-updater, and active window monitoring.
              </p>

              {/* Latest Beta Section */}
              <div className="mt-4 rounded-lg border border-blue-200 dark:border-blue-800/60 bg-white/80 dark:bg-gray-800/80 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wide">
                    ⚡ Latest Release: v1.1.0 (Beta)
                  </span>
                  <span className="text-[10px] text-gray-500 font-mono">WebP + Auto-Updater</span>
                </div>
                <a
                  href="/downloads/Smart-Employee-Tracker-AppleSilicon.dmg"
                  download
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition-colors shadow-xs"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download Apple Silicon (M1–M4) - v1.1.0 (.dmg) ⭐
                </a>
                <a
                  href="/downloads/Smart-Employee-Tracker-macOS.dmg"
                  download
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-blue-300 dark:border-blue-700 bg-white dark:bg-gray-800 px-3.5 py-1.5 text-xs font-semibold text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-gray-750 transition-colors"
                >
                  <Download className="h-3 w-3" />
                  Download macOS Universal / Intel - v1.1.0 (.dmg)
                </a>
              </div>

              {/* Previous Stable Section */}
              <div className="mt-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-900/50 p-2.5">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-semibold text-gray-700 dark:text-gray-300">
                    🛡️ Previous Release: v1.0.0 (Stable)
                  </span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium font-mono">Stable</span>
                </div>
                <a
                  href="/downloads/Smart-Employee-Tracker-macOS-v1.0.0.dmg"
                  download
                  className="flex w-full items-center justify-center gap-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors"
                >
                  <Download className="h-3 w-3 text-gray-500" />
                  Download macOS v1.0.0 Stable (.dmg - 7.4 MB)
                </a>
              </div>
            </div>

            <p className="mt-3 text-[11px] text-amber-700 dark:text-amber-400 font-medium">
              💡 <strong>macOS Permissions:</strong> Enable <strong>Accessibility</strong> and <strong>Screen Recording</strong> in <em>System Settings &gt; Privacy &amp; Security</em>.
            </p>
          </div>

          {/* Windows Card */}
          <div className="flex flex-col justify-between rounded-xl border border-indigo-200/80 bg-indigo-50/20 p-5 dark:border-indigo-900/40 dark:bg-gray-850">
            <div>
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300">
                  🪟 Windows (x64)
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                  v1.1.0 (Beta)
                </span>
              </div>
              <h3 className="mt-3 text-lg font-bold text-gray-900 dark:text-white">Windows 10 / 11</h3>
              <p className="mt-2 text-xs text-gray-600 dark:text-gray-300">
                Self-contained 64-bit Windows build with built-in WebView2 loader, automated background capture, and app usage monitoring.
              </p>

              {/* Latest Beta Section */}
              <div className="mt-4 rounded-lg border border-indigo-200 dark:border-indigo-800/60 bg-white/80 dark:bg-gray-800/80 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wide">
                    ⚡ Latest Release: v1.1.0 (Beta)
                  </span>
                  <span className="text-[10px] text-gray-500 font-mono">WebP + Auto-Updater</span>
                </div>
                <a
                  href="/downloads/Smart-Employee-Tracker.exe"
                  download
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors shadow-xs"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download Windows - v1.1.0 (.exe - 41 MB) ⭐
                </a>
                <a
                  href="/downloads/Smart-Employee-Tracker-Windows.zip"
                  download
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-indigo-300 dark:border-indigo-700 bg-white dark:bg-gray-800 px-3.5 py-1.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-gray-750 transition-colors"
                >
                  <Download className="h-3 w-3" />
                  Download Windows Bundle - v1.1.0 (.zip - 24 MB)
                </a>
              </div>

              {/* Previous Stable Section */}
              <div className="mt-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-900/50 p-2.5">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-semibold text-gray-700 dark:text-gray-300">
                    🛡️ Previous Release: v1.0.0 (Stable)
                  </span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium font-mono">Stable</span>
                </div>
                <a
                  href="/downloads/Smart-Employee-Tracker-v1.0.0.exe"
                  download
                  className="flex w-full items-center justify-center gap-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors"
                >
                  <Download className="h-3 w-3 text-gray-500" />
                  Download Windows v1.0.0 Stable (.exe - 41 MB)
                </a>
              </div>
            </div>

            <p className="mt-3 text-[11px] text-gray-500 dark:text-gray-400 font-medium">
              💡 <strong>Compatibility:</strong> Compatible with Windows 10 & 11 (64-bit). No prerequisite installation required.
            </p>
          </div>
        </div>

        {/* macOS Gatekeeper Troubleshooting Banner */}
        <div className="mt-6 rounded-xl border border-amber-300/80 bg-amber-50/70 p-5 dark:border-amber-800/60 dark:bg-amber-950/20">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-2 flex-1">
              <h4 className="text-sm font-bold text-amber-900 dark:text-amber-200">
                macOS Security Notice: &quot;Smart Employee Tracker is damaged and can&apos;t be opened&quot;
              </h4>
              <p className="text-xs text-amber-800/90 dark:text-amber-300/80 leading-relaxed">
                Because this application is distributed directly outside the Mac App Store, Apple Gatekeeper attaches a security quarantine flag on downloaded files and displays a warning saying the file is damaged. <strong>The application is completely safe and undamaged.</strong>
              </p>

              <div className="pt-2">
                <span className="text-xs font-semibold text-gray-800 dark:text-gray-200 block mb-1.5">
                  Fix: Open Terminal (Command + Space &gt; Terminal) and paste this one command:
                </span>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <div className="flex-1 flex items-center gap-2 bg-gray-900 text-gray-100 px-3.5 py-2 rounded-lg font-mono text-xs overflow-x-auto border border-gray-800">
                    <Terminal className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    <span className="select-all">xattr -cr &quot;/Applications/Smart Employee Tracker.app&quot;</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText('xattr -cr "/Applications/Smart Employee Tracker.app"')
                      alert('Command copied to clipboard! Paste it into Terminal and press Enter.')
                    }}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold transition-colors shrink-0 shadow-xs"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    Copy Command
                  </button>
                </div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-2">
                  Alternatively, open <strong>System Settings &gt; Privacy &amp; Security</strong>, scroll down to the Security section and click <strong>&quot;Open Anyway&quot;</strong>, or Control-Click (Right-Click) the App and select <strong>Open</strong>.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* macOS Screen & Audio Recording Repeating Popup Fix Banner */}
        <div className="mt-4 rounded-xl border border-blue-300/80 bg-blue-50/70 p-5 dark:border-blue-800/60 dark:bg-blue-950/20">
          <div className="flex items-start gap-3">
            <ShieldAlert className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <div className="space-y-2 flex-1">
              <h4 className="text-sm font-bold text-blue-950 dark:text-blue-200">
                macOS Screen &amp; Audio Recording: Repeating Permission Popup Fix
              </h4>
              <p className="text-xs text-blue-900/90 dark:text-blue-300/80 leading-relaxed">
                If macOS keeps asking for <em>&quot;Screen and System Audio Recording&quot;</em> repeatedly even after enabling it in System Settings, macOS permission cache is holding stale records. Resetting the TCC cache resolves this immediately.
              </p>

              <div className="pt-2">
                <span className="text-xs font-semibold text-gray-800 dark:text-gray-200 block mb-1.5">
                  Fix: Open Terminal (Command + Space &gt; Terminal) and paste this reset command:
                </span>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <div className="flex-1 flex items-center gap-2 bg-gray-900 text-gray-100 px-3.5 py-2 rounded-lg font-mono text-xs overflow-x-auto border border-gray-800">
                    <Terminal className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                    <span className="select-all">tccutil reset ScreenCapture com.smartemployeetracker.app</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText('tccutil reset ScreenCapture com.smartemployeetracker.app')
                      alert('Reset command copied to clipboard! Paste it into Terminal and press Enter.')
                    }}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors shrink-0 shadow-xs"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    Copy Command
                  </button>
                </div>
                <div className="mt-2.5 rounded-lg bg-blue-100/70 dark:bg-blue-900/30 p-2.5 text-[11px] text-blue-900 dark:text-blue-200 space-y-1">
                  <p className="font-semibold">After running the command above in Terminal:</p>
                  <ol className="list-decimal list-inside space-y-0.5 text-blue-800 dark:text-blue-300">
                    <li>Open <strong>System Settings &gt; Privacy &amp; Security &gt; Screen &amp; System Audio Recording</strong>.</li>
                    <li>Toggle <strong>Smart Employee Tracker</strong> to ON.</li>
                    <li>Click <strong>Quit &amp; Reopen</strong> when prompted by macOS.</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
