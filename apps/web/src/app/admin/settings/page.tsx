'use client'

import React, { useState, useEffect } from 'react'
import {
  Users,
  UserPlus,
  Sliders,
  Bell,
  Mail,
  Zap,
  ChevronRight
} from 'lucide-react'
import TrackSettingsForm from './track-settings-form'
import {
  ManageTeamsView,
  ManageEmployeesView,
  RiskUserSettingsView,
  EmailReportsView,
  RebrandSettingsView
} from './settings-views'

type TabKey = 'manage-teams' | 'manage-employees' | 'track-settings' | 'risk-user' | 'email-reports' | 'rebrand'

interface NavItem {
  key: TabKey
  label: string
  icon: React.ComponentType<{ className?: string }>
}

const NAV_ITEMS: NavItem[] = [
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
      {/* Settings Sub-Sidebar matching Workfolio design */}
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
