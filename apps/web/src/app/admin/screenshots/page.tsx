'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import {
  Image as ImageIcon,
  RefreshCw,
  Clock,
  ExternalLink,
  X,
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Crown,
  CheckSquare,
  Square,
  Sparkles,
  Users,
} from 'lucide-react'
import { useAdminFilter } from '../admin-filter-context'
import AdminHeader from '../admin-header'
import ProUpgradeModal from '../pro-upgrade-modal'

type ScreenshotItem = {
  id: string
  tenant_id: string
  user_id: string
  storage_path: string
  taken_at: string
  is_blurred: boolean
  created_at: string
  users?: {
    full_name: string | null
    email: string
  } | null
}

export default function ScreenshotsPage() {
  const { searchQuery, selectedDate, selectedTeam, refreshTrigger, currentUser } = useAdminFilter()
  const [screenshots, setScreenshots] = useState<ScreenshotItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState<ScreenshotItem | null>(null)
  const [selectedUser, setSelectedUser] = useState<string>('all')
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [tenantPlan, setTenantPlan] = useState<'BASIC' | 'PRO' | 'ENTERPRISE'>('BASIC')
  const [showProModal, setShowProModal] = useState(false)

  const [employees, setEmployees] = useState<Array<{ id: string; name: string; email: string }>>([])
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [pageSize, setPageSize] = useState<number>(24)
  const [totalCount, setTotalCount] = useState<number>(0)
  const [totalPages, setTotalPages] = useState<number>(1)

  const supabase = createClient()
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://supabase.tracmatrix.com'

  // Fetch full employee directory for dropdown
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
      .catch((err) => console.error('Failed to load employees for filter:', err))
  }, [refreshTrigger])

  const fetchScreenshots = async (page = currentPage, size = pageSize) => {
    try {
      setLoading(true)
      // Dedicated server API with tenant isolation, date filtering, team and employee filters
      const params = new URLSearchParams()
      if (selectedDate) params.set('date', selectedDate)
      if (selectedUser && selectedUser !== 'all') params.set('userId', selectedUser)
      if (selectedTeam && selectedTeam !== 'All Team' && selectedTeam !== 'all') params.set('team', selectedTeam)
      params.set('page', page.toString())
      params.set('limit', size.toString())

      const res = await fetch(`/api/admin/screenshots?${params.toString()}`, { cache: 'no-store' })
      const json = await res.json()
      if (json.success && json.screenshots) {
        setScreenshots(json.screenshots as ScreenshotItem[])
        if (typeof json.totalCount === 'number') {
          setTotalCount(json.totalCount)
        } else {
          setTotalCount(json.screenshots.length)
        }
        if (typeof json.totalPages === 'number') {
          setTotalPages(json.totalPages)
        } else {
          setTotalPages(Math.max(1, Math.ceil((json.screenshots.length || 0) / size)))
        }
      }
    } catch (err) {
      console.error('Failed to fetch screenshots:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchTenantPlan = async () => {
    try {
      const res = await fetch('/api/admin/tenant')
      const data = await res.json()
      if (data.success && data.tenant?.plan) {
        setTenantPlan(data.tenant.plan)
      }
    } catch (err) {
      console.error('Failed to fetch tenant plan:', err)
    }
  }

  useEffect(() => {
    setCurrentPage(1)
    fetchScreenshots(1, pageSize)
  }, [selectedDate, selectedUser, selectedTeam])

  useEffect(() => {
    fetchTenantPlan()

    // Realtime Postgres Changes Subscription
    const channel = supabase
      .channel('realtime-screenshots-grid')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'screenshots' },
        () => {
          fetchScreenshots(currentPage, pageSize)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, refreshTrigger, currentPage, pageSize])

  // Periodic Auto-refresh when enabled (every 8 seconds)
  useEffect(() => {
    if (!autoRefresh) return
    const interval = setInterval(() => {
      fetchScreenshots(currentPage, pageSize)
    }, 8000)
    return () => clearInterval(interval)
  }, [autoRefresh, currentPage, pageSize, selectedDate, selectedUser])

  const toggleSelect = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleSelectAll = () => {
    if (selectedIds.size === filteredScreenshots.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredScreenshots.map((s) => s.id)))
    }
  }

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return

    // If multiple items selected and plan is BASIC, block with PRO modal!
    if (selectedIds.size > 1 && tenantPlan === 'BASIC') {
      setShowProModal(true)
      return
    }

    if (
      !confirm(
        `Are you sure you want to permanently delete ${selectedIds.size} screenshot${
          selectedIds.size > 1 ? 's' : ''
        }?`
      )
    ) {
      return
    }

    try {
      setIsDeleting(true)
      const res = await fetch('/api/admin/screenshots', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      })
      const json = await res.json()
      if (json.success) {
        const deletedSet = new Set(selectedIds)
        setScreenshots((prev) => prev.filter((s) => !deletedSet.has(s.id)))
        setSelectedIds(new Set())
        if (selectedImage && deletedSet.has(selectedImage.id)) {
          setSelectedImage(null)
        }
      } else {
        if (json.requiresUpgrade) {
          setShowProModal(true)
        } else {
          alert(json.error || 'Failed to delete screenshots')
        }
      }
    } catch (err) {
      console.error('Error bulk deleting screenshots:', err)
      alert('Error bulk deleting screenshots')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDeleteScreenshot = async (item: ScreenshotItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    if (!confirm('Are you sure you want to permanently delete this screenshot?')) {
      return
    }

    try {
      setIsDeleting(true)
      const res = await fetch(
        `/api/admin/screenshots?id=${item.id}&path=${encodeURIComponent(item.storage_path)}`,
        { method: 'DELETE' }
      )
      const json = await res.json()
      if (json.success) {
        if (selectedImage?.id === item.id) {
          setSelectedImage(null)
        }
        setScreenshots((prev) => prev.filter((s) => s.id !== item.id))
        setSelectedIds((prev) => {
          const next = new Set(prev)
          next.delete(item.id)
          return next
        })
      } else {
        alert(json.error || 'Failed to delete screenshot')
      }
    } catch (err) {
      console.error('Error deleting screenshot:', err)
      alert('Error deleting screenshot')
    } finally {
      setIsDeleting(false)
    }
  }

  const getPublicUrl = (path: string) => {
    return `${baseUrl}/storage/v1/object/public/screenshots/${path}`
  }

  const formatTimestamp = (dateStr: string) => {
    try {
      const d = new Date(dateStr)
      if (isNaN(d.getTime())) return dateStr
      return d.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      })
    } catch {
      return dateStr
    }
  }

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr)
      if (isNaN(d.getTime())) return dateStr
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    } catch {
      return dateStr
    }
  }

  const filteredScreenshots = screenshots.filter((s) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      const name = (s.users?.full_name || '').toLowerCase()
      const email = (s.users?.email || s.user_id || '').toLowerCase()
      if (!name.includes(q) && !email.includes(q)) return false
    }
    return true
  })

  return (
    <div className="min-h-full bg-white dark:bg-gray-900 pb-16">
      {/* Top Header Bar */}
      <AdminHeader
        title={currentUser?.role === 'EMPLOYEE' ? 'My Screenshots' : 'Screenshots'}
        subtitle={
          currentUser?.role === 'EMPLOYEE'
            ? 'Your synced desktop screen captures'
            : 'Realtime screen captures synced from the desktop tracking agent'
        }
        searchPlaceholder={currentUser?.role === 'EMPLOYEE' ? undefined : 'Search in screenshots'}
        showSearch={currentUser?.role !== 'EMPLOYEE'}
        showTeamFilter={currentUser?.role !== 'EMPLOYEE'}
        showAddUser={false}
        loading={loading}
        onRefresh={() => {
          setLoading(true)
          fetchScreenshots()
        }}
        onUserAdded={() => fetchScreenshots()}
        extraActions={
          currentUser?.role === 'EMPLOYEE' ? null : (
            /* Clean Plan Badge Pill in top header */
            tenantPlan === 'BASIC' ? (
              <button
                type="button"
                onClick={() => setShowProModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-700 shadow-2xs hover:bg-amber-100 transition-colors"
                title="Click to upgrade to PRO"
              >
                <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                <span>BASIC (Upgrade)</span>
              </button>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-300">
                <Crown className="w-3.5 h-3.5 text-blue-600 fill-blue-600" />
                <span>PRO Plan</span>
              </span>
            )
          )
        }
      />

      {/* Dedicated Screenshots Action & Filter Toolbar */}
      <div className="bg-gray-50/90 dark:bg-gray-850/60 border-b border-gray-200 dark:border-gray-800 px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-3 shadow-2xs sticky top-16 z-20 backdrop-blur-sm">
        {/* Left: Filters & Counters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Member Dropdown Selector (Only for Admins) */}
          {currentUser?.role !== 'EMPLOYEE' && (
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">Employee:</span>
              <div className="relative">
                <Users className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5 pointer-events-none" />
                <select
                  value={selectedUser}
                  onChange={(e) => {
                    setSelectedUser(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="appearance-none bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg pl-8 pr-8 py-1.5 text-xs font-semibold text-gray-800 dark:text-gray-100 focus:outline-none focus:border-blue-500 shadow-2xs cursor-pointer"
                >
                  <option value="all">🏢 All Employees</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      👤 {emp.name} ({emp.email})
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-2.5 pointer-events-none" />
              </div>
            </div>
          )}

          {/* Counter Badge */}
          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs text-gray-600 dark:text-gray-300 font-medium">
            <ImageIcon className="w-3.5 h-3.5 text-blue-500" />
            <span>
              {filteredScreenshots.length} {filteredScreenshots.length === 1 ? 'Screenshot' : 'Screenshots'}
            </span>
          </div>

          {/* Auto Refresh Toggle */}
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-all ${
              autoRefresh
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800'
                : 'bg-white text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700'
            }`}
            title="Toggle live screenshot updates"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                autoRefresh ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'
              }`}
            />
            <span>{autoRefresh ? 'Live Sync (8s)' : 'Sync Paused'}</span>
          </button>
        </div>

        {/* Right: Multi-Select & Bulk Actions */}
        <div className="flex items-center gap-2.5">
          {/* Select All Toggle Button */}
          {filteredScreenshots.length > 0 && (
            <button
              type="button"
              onClick={handleSelectAll}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors shadow-2xs"
            >
              {selectedIds.size === filteredScreenshots.length && filteredScreenshots.length > 0 ? (
                <>
                  <CheckSquare className="w-3.5 h-3.5 text-blue-600" />
                  <span>Deselect All</span>
                </>
              ) : (
                <>
                  <Square className="w-3.5 h-3.5 text-gray-400" />
                  <span>Select All ({filteredScreenshots.length})</span>
                </>
              )}
            </button>
          )}

          {/* When items are selected: Inline Bulk Action Button */}
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-2 animate-in fade-in duration-150">
              <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2 py-1 rounded-md border border-blue-200 dark:border-blue-800">
                {selectedIds.size} Selected
              </span>

              <button
                type="button"
                onClick={handleBulkDelete}
                disabled={isDeleting}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-xs disabled:opacity-50 ${
                  tenantPlan === 'BASIC' && selectedIds.size > 1
                    ? 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white'
                    : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
              >
                {tenantPlan === 'BASIC' && selectedIds.size > 1 ? (
                  <>
                    <Crown className="w-3.5 h-3.5 text-amber-300" />
                    <span>Bulk Delete ({selectedIds.size}) — PRO</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Selected ({selectedIds.size})</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Plan Specs Tag */}
          <div className="hidden xl:inline-flex items-center gap-1 text-[11px] text-gray-400 dark:text-gray-500 font-mono">
            <span>{tenantPlan === 'PRO' ? '1m interval · 365d retention' : '10m interval · 14d retention'}</span>
          </div>
        </div>
      </div>

      <div className="p-6 lg:p-8 space-y-6">

      {/* Grid of Screenshots & Pagination */}
      {filteredScreenshots.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredScreenshots.map((item) => {
            const imageUrl = getPublicUrl(item.storage_path)
            const userName = item.users?.full_name || item.users?.email?.split('@')[0] || 'Employee'
            const userEmail = item.users?.email || item.user_id
            const isSelected = selectedIds.has(item.id)

            return (
              <div
                key={item.id}
                className={`group relative bg-white dark:bg-gray-850 rounded-2xl border overflow-hidden shadow-xs hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex flex-col ${
                  isSelected
                    ? 'border-blue-500 ring-2 ring-blue-500/30 shadow-md'
                    : 'border-gray-200/80 dark:border-gray-800 hover:border-blue-300 dark:hover:border-blue-700'
                }`}
              >
                {/* Multi-select Checkbox Overlay */}
                <div
                  onClick={(e) => toggleSelect(item.id, e)}
                  className="absolute top-2.5 left-2.5 z-20 cursor-pointer"
                  title={isSelected ? 'Deselect screenshot' : 'Select screenshot'}
                >
                  <div
                    className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all duration-150 shadow-sm ${
                      isSelected
                        ? 'bg-blue-600 text-white'
                        : 'bg-black/40 hover:bg-black/70 text-transparent border border-white/60 hover:border-white'
                    }`}
                  >
                    <CheckSquare className={`w-3.5 h-3.5 ${isSelected ? 'opacity-100' : 'opacity-0'}`} />
                  </div>
                </div>

                {/* Image Preview */}
                <div
                  onClick={() => setSelectedImage(item)}
                  className="relative aspect-video bg-gray-950 cursor-pointer overflow-hidden group/img"
                >
                  <img
                    src={imageUrl}
                    alt={`Screenshot by ${userName}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                    <span className="bg-white/95 dark:bg-gray-900/95 text-gray-900 dark:text-white text-xs font-semibold px-3.5 py-1.5 rounded-full shadow-lg transition-transform duration-200 transform scale-90 group-hover:scale-100 flex items-center space-x-1.5">
                      <ExternalLink className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      <span>View Screenshot</span>
                    </span>
                  </div>

                  {/* Multi-screen indicator badge if applicable */}
                  {item.storage_path.includes('_screen_') && (
                    <div className="absolute bottom-2 right-2 bg-black/75 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-md border border-white/20 shadow-xs">
                      {`Screen ${item.storage_path.match(/_screen_(\d+)/)?.[1] || '1'}`}
                    </div>
                  )}
                </div>

                {/* Card Metadata with Large & Prominent Highlighted User Info */}
                <div className="p-4 flex flex-col justify-between flex-1 bg-white dark:bg-gray-850">
                  <div className="bg-blue-50/60 dark:bg-blue-950/30 p-2.5 rounded-xl border border-blue-100 dark:border-blue-900/40">
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-extrabold text-sm shrink-0 shadow-xs ring-2 ring-blue-400/30">
                        {userName.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-gray-950 dark:text-white truncate tracking-tight">
                          {userName}
                        </p>
                        <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 truncate mt-0.5">
                          {userEmail}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3.5 pt-2.5 border-t border-gray-150 dark:border-gray-800 flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400">
                    <div className="flex items-center space-x-2.5">
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3 h-3 text-gray-400" />
                        <span className="font-medium">{formatTimestamp(item.taken_at)}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3 text-gray-400" />
                        <span>{formatDate(item.taken_at)}</span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => handleDeleteScreenshot(item, e)}
                      title="Delete screenshot"
                      className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Pagination Bar */}
        <div className="mt-8 pt-5 border-t border-gray-200 dark:border-gray-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <span>Showing</span>
            <span className="font-semibold text-gray-800 dark:text-gray-200">
              {totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1}
            </span>
            <span>to</span>
            <span className="font-semibold text-gray-800 dark:text-gray-200">
              {Math.min(currentPage * pageSize, totalCount || filteredScreenshots.length)}
            </span>
            <span>of</span>
            <span className="font-semibold text-gray-800 dark:text-gray-200">
              {totalCount || filteredScreenshots.length}
            </span>
            <span>screenshots</span>

            <span className="mx-2 text-gray-300 dark:text-gray-700">|</span>

            <span>Per page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                const newSize = Number(e.target.value)
                setPageSize(newSize)
                setCurrentPage(1)
                fetchScreenshots(1, newSize)
              }}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md px-2 py-1 text-xs text-gray-700 dark:text-gray-300 focus:outline-none focus:border-blue-500 shadow-2xs"
            >
              <option value={12}>12</option>
              <option value={24}>24</option>
              <option value={48}>48</option>
              <option value={96}>96</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={currentPage <= 1 || loading}
              onClick={() => {
                const prev = Math.max(1, currentPage - 1)
                setCurrentPage(prev)
                fetchScreenshots(prev, pageSize)
              }}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-750 disabled:opacity-40 disabled:pointer-events-none transition-colors shadow-2xs"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>

            {/* Page number buttons */}
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => {
                  if (totalPages <= 7) return true
                  if (p === 1 || p === totalPages) return true
                  return Math.abs(p - currentPage) <= 1
                })
                .map((p, idx, arr) => {
                  const showEllipsis = idx > 0 && p - arr[idx - 1] > 1
                  return (
                    <React.Fragment key={p}>
                      {showEllipsis && (
                        <span className="px-1 text-xs text-gray-400">...</span>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setCurrentPage(p)
                          fetchScreenshots(p, pageSize)
                        }}
                        className={`w-7 h-7 rounded-lg text-xs font-bold transition-colors ${
                          currentPage === p
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-750 border border-gray-200 dark:border-gray-700'
                        }`}
                      >
                        {p}
                      </button>
                    </React.Fragment>
                  )
                })}
            </div>

            <button
              type="button"
              disabled={currentPage >= totalPages || loading}
              onClick={() => {
                const next = Math.min(totalPages, currentPage + 1)
                setCurrentPage(next)
                fetchScreenshots(next, pageSize)
              }}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-750 disabled:opacity-40 disabled:pointer-events-none transition-colors shadow-2xs"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        </>
      ) : (
        /* Empty State */
        <div className="rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-12 text-center shadow-2xs">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-4">
            <ImageIcon className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-gray-900 dark:text-white">
            No Screenshots Captured Yet
          </h3>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">
            Screenshots are captured automatically when employees start tracking on the desktop
            client.
          </p>

          <div className="mt-6 p-4 max-w-md mx-auto bg-gray-50 dark:bg-gray-900 rounded-xl text-left border border-gray-200 dark:border-gray-700 text-xs text-gray-600 dark:text-gray-300 space-y-2">
            <p className="font-semibold text-gray-900 dark:text-white">How to test live tracking:</p>
            <ol className="list-decimal list-inside space-y-1 text-gray-500 dark:text-gray-400">
              <li>Open terminal and run: <code className="bg-gray-200 dark:bg-gray-800 px-1 py-0.5 rounded text-blue-600 font-mono">npm run dev:agent</code></li>
              <li>Sign in with <code className="font-mono text-gray-800 dark:text-gray-200">employee@example.com</code> / <code className="font-mono text-gray-800 dark:text-gray-200">password123</code></li>
              <li>Click <strong>Start Tracking</strong> (or the camera button)</li>
              <li>Screenshots will appear here live!</li>
            </ol>
          </div>
        </div>
      )}

      {/* Lightbox / Modal for Full Size Inspection */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="relative max-w-5xl w-full bg-gray-900 rounded-2xl overflow-hidden shadow-2xl border border-gray-800"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gray-950 border-b border-gray-800 flex items-center justify-between">
              <div className="flex items-center space-x-3.5">
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-black text-sm ring-2 ring-blue-400/40">
                  {(selectedImage.users?.full_name || selectedImage.users?.email || 'E').charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white tracking-tight">
                      {selectedImage.users?.full_name || selectedImage.users?.email?.split('@')[0] || 'Employee'}
                    </h3>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-blue-950 text-blue-300 border border-blue-800">
                      {selectedImage.users?.email || selectedImage.user_id}
                    </span>
                    {selectedImage.storage_path.includes('_screen_') && (
                      <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-amber-950 text-amber-300 border border-amber-800">
                        {`Screen ${selectedImage.storage_path.match(/_screen_(\d+)/)?.[1] || '1'}`}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Captured at {formatDate(selectedImage.taken_at)} · {formatTimestamp(selectedImage.taken_at)}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <a
                  href={getPublicUrl(selectedImage.storage_path)}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-medium transition-colors flex items-center space-x-1"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Fullscreen</span>
                </a>
                <button
                  onClick={() => handleDeleteScreenshot(selectedImage)}
                  disabled={isDeleting}
                  className="px-3 py-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-400 text-xs font-medium transition-colors flex items-center space-x-1 border border-red-800/40 disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
                <button
                  onClick={() => setSelectedImage(null)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Image */}
            <div className="relative max-h-[75vh] overflow-auto bg-black flex items-center justify-center p-2">
              <img
                src={getPublicUrl(selectedImage.storage_path)}
                alt="Full screen capture"
                className="max-h-[70vh] w-auto object-contain rounded"
              />
            </div>
          </div>
        </div>
      )}
      </div>

      {/* Floating Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-gray-900/95 dark:bg-gray-800/95 backdrop-blur-md border border-gray-700 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <span className="bg-blue-600 px-2 py-0.5 rounded-full">{selectedIds.size}</span>
            <span>selected</span>
          </div>

          <div className="h-4 w-px bg-gray-700" />

          <button
            type="button"
            onClick={handleSelectAll}
            className="text-xs text-gray-300 hover:text-white transition-colors"
          >
            {selectedIds.size === filteredScreenshots.length ? 'Deselect All' : 'Select All'}
          </button>

          <button
            type="button"
            onClick={handleBulkDelete}
            disabled={isDeleting}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-50 shadow-xs ${
              tenantPlan === 'BASIC' && selectedIds.size > 1
                ? 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white'
                : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
          >
            {tenantPlan === 'BASIC' && selectedIds.size > 1 ? (
              <>
                <Crown className="w-3.5 h-3.5 text-amber-300" />
                <span>Bulk Delete ({selectedIds.size}) — PRO</span>
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Selected ({selectedIds.size})</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => setSelectedIds(new Set())}
            className="p-1 text-gray-400 hover:text-white rounded-md transition-colors"
            title="Clear selection"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Pro Upgrade Modal */}
      <ProUpgradeModal
        isOpen={showProModal}
        onClose={() => setShowProModal(false)}
        featureRequested="Multiple Bulk Screenshot Deletion"
        onSuccess={() => {
          setTenantPlan('PRO')
          fetchTenantPlan()
        }}
      />
    </div>
  )
}
