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
  Check,
  Terminal,
  AlertTriangle
} from 'lucide-react'
import TrackSettingsForm from './track-settings-form'
import {
  ManageTeamsView,
  ManageEmployeesView,
  RiskUserSettingsView,
  EmailReportsView,
  RebrandSettingsView
} from './settings-views'

type TabKey = 'download-apps' | 'manage-teams' | 'manage-employees' | 'track-settings' | 'risk-user' | 'email-reports' | 'rebrand'

interface NavItem {
  key: TabKey
  label: string
  icon: React.ComponentType<{ className?: string }>
}

const NAV_ITEMS: NavItem[] = [
  { key: 'download-apps', label: 'Download Tracker Apps', icon: Download },
  { key: 'manage-teams', label: 'Manage Teams', icon: Users },
  { key: 'manage-employees', label: 'Manage Employees', icon: UserPlus },
  { key: 'track-settings', label: 'Track Settings', icon: Sliders },
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

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('track-settings')
  const [members, setMembers] = useState<MemberItem[]>([])

  useEffect(() => {
    // Read URL hash or query if provided
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const tabParam = params.get('tab') as TabKey
      if (tabParam && NAV_ITEMS.some((n) => n.key === tabParam)) {
        setActiveTab(tabParam)
      }
    }

    // Fetch members
    fetch('/api/admin/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.members) setMembers(data.members)
      })
      .catch(() => {})
  }, [])

  const handleTabChange = (tab: TabKey) => {
    setActiveTab(tab)
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href)
      url.searchParams.set('tab', tab)
      window.history.replaceState({}, '', url.toString())
    }
  }

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
            {NAV_ITEMS.map((item) => {
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
        {activeTab === 'risk-user' && <RiskUserSettingsView />}
        {activeTab === 'email-reports' && <EmailReportsView />}
        {activeTab === 'rebrand' && <RebrandSettingsView />}
      </div>
    </div>
  )
}

function DownloadAppsView() {
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
          <div className="flex flex-col justify-between rounded-xl border-2 border-emerald-500/30 bg-emerald-50/20 p-5 dark:border-emerald-500/40 dark:bg-emerald-950/10">
            <div>
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300">
                  📱 Mobile (New)
                </span>
                <span className="text-xs font-mono text-gray-500">v1.0.0 (5.1 MB)</span>
              </div>
              <h3 className="mt-3 text-lg font-bold text-gray-900 dark:text-white">Android Phone & Tablet</h3>
              <p className="mt-2 text-xs text-gray-600 dark:text-gray-300">
                Full background screenshots (MediaProjection), mobile app usage tracking (UsageStatsManager), live notification timer, and battery optimization exemption.
              </p>
            </div>
            <a
              href="/downloads/Smart-Employee-Tracker.apk"
              download
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors shadow-xs"
            >
              <Download className="h-4 w-4" />
              Download Android APK
            </a>
          </div>

          {/* macOS Universal & Apple Silicon Card */}
          <div className="flex flex-col justify-between rounded-xl border border-gray-200 bg-gray-50/50 p-5 dark:border-gray-800 dark:bg-gray-850">
            <div>
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">
                  🍎 macOS Universal
                </span>
                <span className="text-xs font-mono text-gray-500">Universal & M1/M2/M3</span>
              </div>
              <h3 className="mt-3 text-lg font-bold text-gray-900 dark:text-white">macOS (Apple Silicon & Intel)</h3>
              <p className="mt-2 text-xs text-gray-600 dark:text-gray-300">
                Native macOS build supporting Apple Silicon (M1/M2/M3/M4) chips and Intel x86_64 processors with automated screen capture and window tracking.
              </p>
            </div>
            <div className="mt-5 space-y-2">
              <a
                href="/downloads/Smart-Employee-Tracker-macOS.dmg"
                download
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors shadow-xs"
              >
                <Download className="h-4 w-4" />
                Download Universal (.dmg - 10 MB)
              </a>
              <a
                href="/downloads/Smart-Employee-Tracker-AppleSilicon.dmg"
                download
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-blue-300 dark:border-blue-700 bg-white dark:bg-gray-800 px-4 py-2 text-xs font-semibold text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-gray-750 transition-colors"
              >
                <Download className="h-3.5 w-3.5" />
                Download Apple Silicon Only (.dmg - 7.4 MB)
              </a>
            </div>
          </div>

          {/* Windows Card */}
          <div className="flex flex-col justify-between rounded-xl border border-gray-200 bg-gray-50/50 p-5 dark:border-gray-800 dark:bg-gray-850">
            <div>
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300">
                  🪟 Windows (x64)
                </span>
                <span className="text-xs font-mono text-gray-500">Portable</span>
              </div>
              <h3 className="mt-3 text-lg font-bold text-gray-900 dark:text-white">Windows 10 / 11</h3>
              <p className="mt-2 text-xs text-gray-600 dark:text-gray-300">
                Self-contained 64-bit Windows build with built-in WebView2 loader, automated background capture, and app usage monitoring.
              </p>
            </div>
            <div className="mt-5 space-y-2">
              <a
                href="/downloads/Smart-Employee-Tracker.exe"
                download
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors shadow-xs"
              >
                <Download className="h-4 w-4" />
                Download Windows (.exe)
              </a>
              <a
                href="/downloads/Smart-Employee-Tracker-Windows.zip"
                download
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-indigo-300 dark:border-indigo-700 bg-white dark:bg-gray-800 px-4 py-2 text-xs font-semibold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-gray-750 transition-colors"
              >
                <Download className="h-3.5 w-3.5" />
                Download Windows Bundle (.zip - 10 MB)
              </a>
            </div>
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
      </div>
    </div>
  )
}

