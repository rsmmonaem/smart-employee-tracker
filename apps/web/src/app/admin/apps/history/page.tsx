'use client'

import React, { useState, useEffect } from 'react'
import {
  AppWindow,
  Globe,
  ChevronDown,
  RefreshCw
} from 'lucide-react'

import { useAdminFilter } from '../../admin-filter-context'
import AdminHeader from '../../admin-header'

interface UserItem {
  id: string
  full_name?: string | null
  email: string
}

interface SegmentItem {
  id: string
  appName: string
  windowTitle?: string
  startTimeStr: string
  endTimeStr: string
  type: string
}

interface EmployeeItem {
  id: string
  name: string
  email: string
  segments?: SegmentItem[]
}

interface ActivityItem {
  id: string
  user_id: string
  app_name: string
  window_title: string | null
  domain: string | null
  started_at: string
  ended_at: string
  classification: string
  user?: {
    full_name: string | null
    email: string
  }
}

export default function AppsHistoryPage() {
  const [events, setEvents] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState('ALL')
  const [users, setUsers] = useState<Array<{ id: string; name: string }>>([])
  const { searchQuery, selectedDate, refreshTrigger } = useAdminFilter()

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        const [usersRes, timelineRes] = await Promise.all([
          fetch('/api/admin/users').then((r) => r.json()),
          fetch(`/api/admin/timeline?date=${selectedDate || '2026-09-10'}`).then((r) => r.json()),
        ])

        if (usersRes.success && usersRes.employees) {
          setUsers(
            usersRes.employees.map((e: UserItem) => ({
              id: e.id,
              name: e.full_name || e.email,
            }))
          )
        }

        if (timelineRes.employees) {
          const list: ActivityItem[] = []
          timelineRes.employees.forEach((emp: EmployeeItem) => {
            emp.segments?.forEach((seg: SegmentItem) => {
              list.push({
                id: seg.id,
                user_id: emp.id,
                app_name: seg.appName,
                window_title: seg.windowTitle || null,
                domain: seg.appName.includes('.') ? seg.appName : null,
                started_at: seg.startTimeStr,
                ended_at: seg.endTimeStr,
                classification: seg.type,
                user: {
                  full_name: emp.name,
                  email: emp.email,
                },
              })
            })
          })
          setEvents(list)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [selectedDate, refreshTrigger])

  const filteredEvents = events.filter((e) => {
    if (selectedUser !== 'ALL' && e.user_id !== selectedUser) return false
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const matchApp = e.app_name.toLowerCase().includes(q)
      const matchWindow = (e.window_title || '').toLowerCase().includes(q)
      const matchUser = (e.user?.full_name || e.user?.email || '').toLowerCase().includes(q)
      if (!matchApp && !matchWindow && !matchUser) return false
    }
    return true
  })

  return (
    <div className="min-h-full bg-white dark:bg-gray-900 pb-16">
      <AdminHeader
        title="Apps History"
        searchPlaceholder="Search in history..."
        loading={loading}
      />
      <div className="p-8 max-w-7xl mx-auto space-y-6">
        {/* Subheader */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
                Chronological History
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                {filteredEvents.length} Intervals
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Audit chronological app and website usage logged across team members.
            </p>
          </div>

          {/* User filter */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="appearance-none bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3.5 py-2 pr-8 text-xs text-gray-700 dark:text-gray-200 focus:outline-none focus:border-blue-500 shadow-2xs"
              >
                <option value="ALL">All Employees</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-2.5 pointer-events-none" />
            </div>
          </div>
        </div>

      {/* History Table */}
      <div className="rounded-xl border border-gray-200/80 bg-white dark:border-gray-800 dark:bg-gray-900 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-gray-500 flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
            <span>Loading app usage history...</span>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="p-12 text-center text-xs text-gray-500 dark:text-gray-400">
            No activity intervals recorded yet for this selection.
          </div>
        ) : (
          <div className="divide-y divide-gray-150 dark:divide-gray-800">
            {filteredEvents.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-4 hover:bg-gray-50/60 dark:hover:bg-gray-850/40 transition-colors"
              >
                <div className="flex items-center gap-3.5 min-w-0 pr-4">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center shrink-0">
                    {item.domain ? <Globe className="w-4 h-4" /> : <AppWindow className="w-4 h-4" />}
                  </div>
                  <div className="truncate">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-gray-900 dark:text-white truncate">
                        {item.app_name}
                      </span>
                      {item.user && (
                        <span className="text-[11px] text-gray-400">
                          &bull; {item.user.full_name || item.user.email}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                      {item.window_title || 'Application window in focus'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <span className="text-xs font-mono font-medium text-gray-700 dark:text-gray-300 block">
                      {item.started_at} - {item.ended_at}
                    </span>
                  </div>
                  <span
                    className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full ${
                      item.classification === 'PRODUCTIVE'
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                        : item.classification === 'UNPRODUCTIVE'
                        ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                        : item.classification === 'NEUTRAL'
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                    }`}
                  >
                    {item.classification}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  </div>
  )
}
