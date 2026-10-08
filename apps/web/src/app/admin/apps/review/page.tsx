'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Globe,
  AppWindow,
  Download,
  UserPlus,
  ChevronDown,
  Check,
  RefreshCw,
  X,
  Clock,
  AlertCircle,
  Trash2,
  Users
} from 'lucide-react'
import { useAdminFilter } from '../../admin-filter-context'
import AdminHeader from '../../admin-header'

type TabType = 'unreviewed' | 'reviewed' | 'top-used' | 'idle-exclusions'
type Classification = 'PRODUCTIVE' | 'NEUTRAL' | 'UNPRODUCTIVE'

interface AppItem {
  id: string
  ruleId?: string
  name: string
  type: 'APP' | 'DOMAIN'
  classification?: Classification
  usageCount: number
  totalSeconds: number
  usedBy?: string[]
}

interface TopAppItem {
  name: string
  type: 'APP' | 'DOMAIN'
  totalSeconds: number
  count: number
  classification: string
}

interface EmployeeOption {
  id: string
  name: string
  email: string
}

function formatDuration(totalSeconds: number): string {
  if (totalSeconds <= 0) return '0m'
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes}m`
}

export default function ReviewAppsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('unreviewed')
  const [unreviewedApps, setUnreviewedApps] = useState<AppItem[]>([])
  const [reviewedApps, setReviewedApps] = useState<AppItem[]>([])
  const [topUsedApps, setTopUsedApps] = useState<TopAppItem[]>([])
  const [idleExcluded, setIdleExcluded] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [appliedSearch, setAppliedSearch] = useState('')
  const [selectedEmployee, setSelectedEmployee] = useState<string>('ALL')
  const [employees, setEmployees] = useState<EmployeeOption[]>([])
  const { selectedTeam, refreshTrigger, triggerRefresh } = useAdminFilter()
  const [copiedName, setCopiedName] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Custom Idle Exclude input
  const [newExcludeApp, setNewExcludeApp] = useState('')

  // Fetch employees list
  useEffect(() => {
    fetch('/api/admin/users')
      .then((r) => r.json())
      .then((data) => {
        if (data.success && Array.isArray(data.employees)) {
          setEmployees(
            data.employees.map((e: any) => ({
              id: e.id,
              name: e.full_name || e.email?.split('@')[0] || 'Employee',
              email: e.email,
            }))
          )
        }
      })
      .catch((err) => console.error('Error fetching employees:', err))
  }, [refreshTrigger])

  // Fetch apps review data with employee filter
  const fetchReviewData = useCallback(async () => {
    try {
      setLoading(true)
      const url = selectedEmployee && selectedEmployee !== 'ALL'
        ? `/api/admin/apps/review?userId=${encodeURIComponent(selectedEmployee)}`
        : '/api/admin/apps/review'
      const res = await fetch(url, { cache: 'no-store' })
      const json = await res.json()
      if (json.success) {
        setUnreviewedApps(json.unreviewed || [])
        setReviewedApps(json.reviewed || [])
        setTopUsedApps(json.topUsed || [])
        setIdleExcluded(json.idleExcluded || [])
      }
    } catch (err) {
      console.error('Error fetching review apps:', err)
    } finally {
      setLoading(false)
    }
  }, [selectedEmployee])

  useEffect(() => {
    fetchReviewData()
  }, [fetchReviewData])

  // Classify App
  const handleClassify = async (item: AppItem, classification: Classification) => {
    try {
      setActionLoading(item.name)

      // Optimistic state transition
      if (activeTab === 'unreviewed') {
        setUnreviewedApps((prev) => prev.filter((a) => a.name !== item.name))
        setReviewedApps((prev) => [
          {
            ...item,
            classification,
            id: `rev-${item.name.toLowerCase()}`,
          },
          ...prev.filter((a) => a.name !== item.name),
        ])
      } else {
        setReviewedApps((prev) =>
          prev.map((a) => (a.name === item.name ? { ...a, classification } : a))
        )
      }

      const res = await fetch('/api/admin/apps/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pattern: item.name,
          classification,
          matchType: item.type,
        }),
      })

      const json = await res.json()
      if (!json.success) {
        alert(json.error || 'Failed to classify app')
        await fetchReviewData()
      } else {
        // Automatically sync timeline and reports
        triggerRefresh()
      }
    } catch (err) {
      console.error('Error classifying app:', err)
      await fetchReviewData()
    } finally {
      setActionLoading(null)
    }
  }

  // Remove classification (unreview)
  const handleRemoveReview = async (item: AppItem) => {
    try {
      setActionLoading(item.name)
      // Optimistic update
      setReviewedApps((prev) => prev.filter((a) => a.name !== item.name))
      setUnreviewedApps((prev) => [
        {
          ...item,
          classification: undefined,
          id: `unrev-${item.name.toLowerCase()}`,
        },
        ...prev,
      ])

      const res = await fetch(`/api/admin/apps/review?pattern=${encodeURIComponent(item.name)}`, {
        method: 'DELETE',
      })
      const json = await res.json()
      if (!json.success) {
        alert(json.error || 'Failed to remove rule')
        await fetchReviewData()
      } else {
        triggerRefresh()
      }
    } catch (err) {
      console.error('Error removing review:', err)
      await fetchReviewData()
    } finally {
      setActionLoading(null)
    }
  }

  // Toggle Idle Exclusion
  const handleToggleIdleExclusion = async (appName: string, excluded: boolean) => {
    try {
      setIdleExcluded((prev) =>
        excluded ? [...prev, appName] : prev.filter((a) => a.toLowerCase() !== appName.toLowerCase())
      )

      await fetch('/api/admin/apps/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggle_idle_exclusion',
          appName,
          excluded,
        }),
      })
    } catch (err) {
      console.error('Error toggling idle exclusion:', err)
    }
  }

  const handleAddCustomIdleExclude = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newExcludeApp.trim()) return
    handleToggleIdleExclusion(newExcludeApp.trim(), true)
    setNewExcludeApp('')
  }

  // Copy to clipboard
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedName(text)
    setTimeout(() => {
      setCopiedName(null)
    }, 2000)
  }

  // Download CSV
  const handleDownloadCSV = () => {
    const isUnreviewed = activeTab === 'unreviewed'
    const items = isUnreviewed ? filteredUnreviewed : filteredReviewed
    const filename = isUnreviewed ? 'unreviewed_apps.csv' : 'reviewed_apps.csv'

    const headers = ['Name', 'Type', 'Classification', 'Usage Count', 'Total Duration']
    const rows = items.map((a) => [
      `"${a.name}"`,
      `"${a.type}"`,
      `"${a.classification || 'UNREVIEWED'}"`,
      `"${a.usageCount}"`,
      `"${formatDuration(a.totalSeconds)}"`,
    ])

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Filtered lists
  const filteredUnreviewed = useMemo(() => {
    if (!appliedSearch) return unreviewedApps
    return unreviewedApps.filter((item) =>
      item.name.toLowerCase().includes(appliedSearch.toLowerCase())
    )
  }, [unreviewedApps, appliedSearch])

  const filteredReviewed = useMemo(() => {
    if (!appliedSearch) return reviewedApps
    return reviewedApps.filter((item) =>
      item.name.toLowerCase().includes(appliedSearch.toLowerCase())
    )
  }, [reviewedApps, appliedSearch])

  return (
    <div className="min-h-full bg-[#f8f9fa] dark:bg-gray-950 pb-16">
      {/* Top Navigation Header matching Screenshot */}
      <AdminHeader
        title="Review Apps"
        searchPlaceholder="Search in review apps"
        loading={loading}
        onRefresh={fetchReviewData}
        onUserAdded={fetchReviewData}
      />


      {/* Main Content Area */}
      <div className="p-8 max-w-7xl mx-auto space-y-5">
        {/* Title Bar & Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200/80 dark:border-gray-800 shadow-2xs">
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400 block uppercase tracking-wider">
                Reviewing Usage For
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-bold text-gray-900 dark:text-white">
                  {selectedEmployee === 'ALL'
                    ? 'Entire Organization'
                    : employees.find((e) => e.id === selectedEmployee)?.name || 'Selected Employee'}
                </span>
              </div>
            </div>

            {/* Employee Selector Dropdown */}
            <div className="relative sm:ml-4">
              <select
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value)}
                className="appearance-none bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg pl-3 pr-8 py-1.5 text-xs font-semibold text-gray-800 dark:text-gray-100 focus:outline-none focus:border-blue-500 shadow-2xs"
              >
                <option value="ALL">🏢 All Employees (Organization-wide)</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    👤 {emp.name} ({emp.email})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-2.5 pointer-events-none" />
            </div>
          </div>

          {(activeTab === 'unreviewed' || activeTab === 'reviewed') && (
            <button
              onClick={handleDownloadCSV}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-900/60 rounded-lg text-xs font-semibold text-[#1677ff] dark:text-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-950/30 shadow-2xs transition-colors self-start sm:self-auto shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>
                {activeTab === 'unreviewed' ? 'Download Unreviewed Apps' : 'Download Reviewed Apps'}
              </span>
            </button>
          )}
        </div>

        {/* 4 Tabs matching Screenshot */}
        <div className="border-b border-gray-200 dark:border-gray-800">
          <nav className="flex space-x-8 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('unreviewed')}
              className={`pb-3 relative transition-colors ${
                activeTab === 'unreviewed'
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
              }`}
            >
              <span>Unreviewed apps</span>
              <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 font-normal">
                {unreviewedApps.length}
              </span>
              {activeTab === 'unreviewed' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1677ff] rounded-t-full" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('reviewed')}
              className={`pb-3 relative transition-colors ${
                activeTab === 'reviewed'
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
              }`}
            >
              <span>Reviewed apps</span>
              <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 font-normal">
                {reviewedApps.length}
              </span>
              {activeTab === 'reviewed' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1677ff] rounded-t-full" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('top-used')}
              className={`pb-3 relative transition-colors ${
                activeTab === 'top-used'
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
              }`}
            >
              <span>Top used apps</span>
              {activeTab === 'top-used' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1677ff] rounded-t-full" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('idle-exclusions')}
              className={`pb-3 relative transition-colors ${
                activeTab === 'idle-exclusions'
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
              }`}
            >
              <span>Exclude apps from idle time</span>
              {activeTab === 'idle-exclusions' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1677ff] rounded-t-full" />
              )}
            </button>
          </nav>
        </div>

        {/* Tab 1: Unreviewed Apps */}
        {activeTab === 'unreviewed' && (
          <div className="space-y-4">
            {/* Search Bar matching screenshot */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && setAppliedSearch(searchQuery)}
                  placeholder="Search apps"
                  className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 shadow-2xs"
                />
              </div>
              <button
                onClick={() => setAppliedSearch(searchQuery)}
                className="bg-[#1677ff] hover:bg-blue-600 text-white px-5 py-2 text-xs font-semibold rounded-lg shadow-2xs transition-colors"
              >
                Search Apps
              </button>
            </div>

            {/* List */}
            <div className="rounded-xl border border-gray-200/80 bg-white dark:border-gray-800 dark:bg-gray-900 shadow-2xs overflow-hidden divide-y divide-gray-150 dark:divide-gray-800">
              {filteredUnreviewed.length === 0 ? (
                <div className="p-12 text-center text-xs text-gray-500 dark:text-gray-400">
                  {appliedSearch ? 'No unreviewed apps matched your search.' : 'All detected apps have been reviewed! 🎉'}
                </div>
              ) : (
                filteredUnreviewed.map((app) => (
                  <div
                    key={app.id}
                    className="flex items-center justify-between py-3 px-5 hover:bg-gray-50/70 dark:hover:bg-gray-850/50 transition-colors group"
                  >
                    {/* App icon & name */}
                    <div className="flex items-center gap-3.5 min-w-0 pr-4">
                      <div className="w-6 h-6 rounded-md bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                        {app.type === 'DOMAIN' ? (
                          <Globe className="w-3.5 h-3.5" />
                        ) : (
                          <AppWindow className="w-3.5 h-3.5" />
                        )}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2 truncate">
                          <span className="text-xs font-semibold text-gray-900 dark:text-white truncate">
                            {app.name}
                          </span>
                          <button
                            onClick={() => handleCopy(app.name)}
                            title="Copy app name"
                            className="opacity-0 group-hover:opacity-100 text-[11px] text-blue-600 hover:text-blue-700 font-medium transition-opacity inline-flex items-center gap-0.5"
                          >
                            {copiedName === app.name ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-600" />
                                <span className="text-emerald-600">Copied</span>
                              </>
                            ) : (
                              <span>Copy</span>
                            )}
                          </button>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-gray-400">
                          {app.totalSeconds > 0 && (
                            <span className="font-mono text-gray-500 dark:text-gray-400 font-medium">
                              ⏱ {formatDuration(app.totalSeconds)}
                            </span>
                          )}
                          {app.usedBy && app.usedBy.length > 0 && (
                            <span className="text-blue-600 dark:text-blue-400 font-medium truncate max-w-xs">
                              Used by: {app.usedBy.slice(0, 3).join(', ')}
                              {app.usedBy.length > 3 && ` +${app.usedBy.length - 3} more`}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* 3 Classification Pills */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleClassify(app, 'PRODUCTIVE')}
                        disabled={actionLoading === app.name}
                        className="rounded-full px-4 py-1 text-xs font-medium border border-[#22c55e] text-[#16a34a] hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-all cursor-pointer"
                      >
                        Productive
                      </button>
                      <button
                        onClick={() => handleClassify(app, 'NEUTRAL')}
                        disabled={actionLoading === app.name}
                        className="rounded-full px-4 py-1 text-xs font-medium border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all cursor-pointer"
                      >
                        Neutral
                      </button>
                      <button
                        onClick={() => handleClassify(app, 'UNPRODUCTIVE')}
                        disabled={actionLoading === app.name}
                        className="rounded-full px-4 py-1 text-xs font-medium border border-[#ef4444] text-[#dc2626] hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all cursor-pointer"
                      >
                        Unproductive
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Reviewed Apps (matching Screenshot 2) */}
        {activeTab === 'reviewed' && (
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && setAppliedSearch(searchQuery)}
                  placeholder="Search Reviewed apps"
                  className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 shadow-2xs"
                />
              </div>
              <button
                onClick={() => setAppliedSearch(searchQuery)}
                className="bg-[#1677ff] hover:bg-blue-600 text-white px-5 py-2 text-xs font-semibold rounded-lg shadow-2xs transition-colors"
              >
                Search Apps
              </button>
            </div>

            {/* List with active pill states */}
            <div className="rounded-xl border border-gray-200/80 bg-white dark:border-gray-800 dark:bg-gray-900 shadow-2xs overflow-hidden divide-y divide-gray-150 dark:divide-gray-800">
              {filteredReviewed.length === 0 ? (
                <div className="p-12 text-center text-xs text-gray-500 dark:text-gray-400">
                  {appliedSearch ? 'No reviewed apps matched your search.' : 'No reviewed apps found. Review apps from the unreviewed tab!'}
                </div>
              ) : (
                filteredReviewed.map((app) => {
                  const isProd = app.classification === 'PRODUCTIVE'
                  const isNeutral = app.classification === 'NEUTRAL'
                  const isUnprod = app.classification === 'UNPRODUCTIVE'

                  return (
                    <div
                      key={app.id}
                      className="flex items-center justify-between py-3 px-5 hover:bg-gray-50/70 dark:hover:bg-gray-850/50 transition-colors group"
                    >
                      {/* App icon & name */}
                      <div className="flex items-center gap-3.5 min-w-0 pr-4">
                        <div className="w-6 h-6 rounded-md bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                          {app.type === 'DOMAIN' ? (
                            <Globe className="w-3.5 h-3.5" />
                          ) : (
                            <AppWindow className="w-3.5 h-3.5" />
                          )}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-2 truncate">
                            <span className="text-xs font-semibold text-gray-900 dark:text-white truncate">
                              {app.name}
                            </span>
                            <button
                              onClick={() => handleCopy(app.name)}
                              title="Copy app name"
                              className="opacity-0 group-hover:opacity-100 text-[11px] text-blue-600 hover:text-blue-700 font-medium transition-opacity inline-flex items-center gap-0.5"
                            >
                              {copiedName === app.name ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-600" />
                                  <span className="text-emerald-600">Copied</span>
                                </>
                              ) : (
                                <span>Copy</span>
                              )}
                            </button>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-gray-400">
                            {app.totalSeconds > 0 && (
                              <span className="font-mono text-gray-500 dark:text-gray-400 font-medium">
                                ⏱ {formatDuration(app.totalSeconds)}
                              </span>
                            )}
                            {app.usedBy && app.usedBy.length > 0 && (
                              <span className="text-blue-600 dark:text-blue-400 font-medium truncate max-w-xs">
                                Used by: {app.usedBy.slice(0, 3).join(', ')}
                                {app.usedBy.length > 3 && ` +${app.usedBy.length - 3} more`}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* 3 Classification Pills with solid active state matching Screenshot 2 */}
                      <div className="flex items-center gap-2 shrink-0">
                        {/* Productive Pill */}
                        <button
                          onClick={() => handleClassify(app, 'PRODUCTIVE')}
                          disabled={actionLoading === app.name}
                          className={`rounded-full px-4 py-1 text-xs font-medium transition-all cursor-pointer ${
                            isProd
                              ? 'bg-[#16a34a] text-white border border-[#16a34a] shadow-xs'
                              : 'border border-[#22c55e] text-[#16a34a] hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                          }`}
                        >
                          Productive
                        </button>

                        {/* Neutral Pill */}
                        <button
                          onClick={() => handleClassify(app, 'NEUTRAL')}
                          disabled={actionLoading === app.name}
                          className={`rounded-full px-4 py-1 text-xs font-medium transition-all cursor-pointer ${
                            isNeutral
                              ? 'bg-[#2563eb] text-white border border-[#2563eb] shadow-xs'
                              : 'border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                          }`}
                        >
                          Neutral
                        </button>

                        {/* Unproductive Pill */}
                        <button
                          onClick={() => handleClassify(app, 'UNPRODUCTIVE')}
                          disabled={actionLoading === app.name}
                          className={`rounded-full px-4 py-1 text-xs font-medium transition-all cursor-pointer ${
                            isUnprod
                              ? 'bg-[#dc2626] text-white border border-[#dc2626] shadow-xs'
                              : 'border border-[#ef4444] text-[#dc2626] hover:bg-rose-50 dark:hover:bg-rose-950/30'
                          }`}
                        >
                          Unproductive
                        </button>

                        {/* Quick Unreview Action */}
                        <button
                          onClick={() => handleRemoveReview(app)}
                          title="Reset to unreviewed status"
                          className="p-1 text-gray-300 hover:text-gray-600 dark:hover:text-gray-300 rounded ml-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Top Used Apps */}
        {activeTab === 'top-used' && (
          <div className="rounded-xl border border-gray-200/80 bg-white dark:border-gray-800 dark:bg-gray-900 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-gray-100 dark:border-gray-800">
              <h3 className="text-xs font-bold text-gray-800 dark:text-white uppercase tracking-wider">
                Most Used Applications Across Teams
              </h3>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {topUsedApps.map((item, idx) => (
                <div key={item.name} className="flex items-center justify-between p-4 hover:bg-gray-50/50">
                  <div className="flex items-center gap-3">
                    <span className="w-6 text-xs font-bold text-gray-400 font-mono">#{idx + 1}</span>
                    <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center font-bold text-xs">
                      {item.type === 'DOMAIN' ? <Globe className="w-3.5 h-3.5" /> : <AppWindow className="w-3.5 h-3.5" />}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-900 dark:text-white">{item.name}</p>
                      <p className="text-[11px] text-gray-400">{item.count} activity intervals logged</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-gray-800 dark:text-gray-200 font-mono">
                      {formatDuration(item.totalSeconds)}
                    </span>
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
          </div>
        )}

        {/* Tab 4: Exclude Apps from Idle Time */}
        {activeTab === 'idle-exclusions' && (
          <div className="space-y-4">
            <div className="p-4 bg-blue-50/60 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 rounded-xl text-xs text-blue-800 dark:text-blue-300 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-blue-600" />
              <div>
                <p className="font-semibold">Idle Time Exclusion Rules</p>
                <p className="mt-0.5 text-blue-700 dark:text-blue-400">
                  When employees are using excluded apps (e.g. video conferencing or screen presentations), the desktop agent will not trigger idle status even if there are no mouse or keyboard events.
                </p>
              </div>
            </div>

            {/* Add Custom App */}
            <form onSubmit={handleAddCustomIdleExclude} className="flex gap-2">
              <input
                type="text"
                value={newExcludeApp}
                onChange={(e) => setNewExcludeApp(e.target.value)}
                placeholder="Enter app name to exclude (e.g. Webex, QuickTime Player)..."
                className="flex-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 shadow-2xs"
              />
              <button
                type="submit"
                className="bg-[#1677ff] hover:bg-blue-600 text-white px-4 py-2 text-xs font-semibold rounded-lg shadow-2xs transition-colors"
              >
                Add Exclusion
              </button>
            </form>

            {/* List of default and custom exclusions */}
            <div className="rounded-xl border border-gray-200/80 bg-white dark:border-gray-800 dark:bg-gray-900 shadow-2xs overflow-hidden divide-y divide-gray-150 dark:divide-gray-800">
              {idleExcluded.map((appName) => (
                <div key={appName} className="flex items-center justify-between p-4 hover:bg-gray-50/50">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-purple-50 dark:bg-purple-950/30 text-purple-600 flex items-center justify-center font-bold text-xs">
                      <Clock className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-900 dark:text-white">{appName}</p>
                      <p className="text-[11px] text-gray-400">Exempt from inactivity timeout</p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleToggleIdleExclusion(appName, false)}
                    className="text-xs font-medium text-red-600 hover:text-red-700 px-3 py-1 rounded hover:bg-red-50 dark:hover:bg-red-950/20"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

    </div>
  )
}
