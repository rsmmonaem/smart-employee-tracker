'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Users,
  UserPlus,
  Search,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  RefreshCw,
  X,
  Shield,
  Briefcase,
  AlertTriangle,
  LayoutGrid,
  List,
  Clock,
  Laptop,
  Check,
  ChevronDown,
} from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { useAdminFilter } from '../admin-filter-context'
import AdminHeader from '../admin-header'

type StatusPill =
  | 'ALL'
  | 'WORKING'
  | 'BREAK'
  | 'STOPPED'
  | 'LEAVE'
  | 'NOT_INSTALLED'
  | 'YET_TO_START'

interface TeamMemberCardData {
  id: string
  name: string
  avatar: string
  workedDaysText: string
  activeTimePct: number
  appsUsedText?: string
  appNotInstalled?: boolean
  checkInTime: string
  hoursWorked: string
  progressPct: number
  statusCategory: 'WORKING' | 'STOPPED' | 'NOT_INSTALLED' | 'BREAK' | 'LEAVE' | 'YET_TO_START'
  cardTheme: 'green' | 'yellow' | 'pink'
  role?: string
  email?: string
  team?: string
  teams?: string[]
}

// In-memory cache for instant navigation transitions
let cachedEmployeesCards: TeamMemberCardData[] | null = null

export default function EmployeesPage() {
  const [teamCards, setTeamCards] = useState<TeamMemberCardData[]>(cachedEmployeesCards || [])
  const [loading, setLoading] = useState(!cachedEmployeesCards)
  const [activeFilterPill, setActiveFilterPill] = useState<StatusPill>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'CARDS' | 'TABLE'>('CARDS')
  const supabase = useMemo(() => createClient(), [])

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false)
  const [newFullName, setNewFullName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newRole, setNewRole] = useState<'EMPLOYEE' | 'TENANT_ADMIN'>('EMPLOYEE')
  const [newTeam, setNewTeam] = useState('Engineering')
  const [newTeams, setNewTeams] = useState<string[]>(['Engineering'])
  const [isSubmittingAdd, setIsSubmittingAdd] = useState(false)
  const [addError, setAddError] = useState('')

  // Edit Modal State
  const [editMember, setEditMember] = useState<TeamMemberCardData | null>(null)
  const [editFullName, setEditFullName] = useState('')
  const [editPassword, setEditPassword] = useState('')
  const [editRole, setEditRole] = useState<'EMPLOYEE' | 'TENANT_ADMIN'>('EMPLOYEE')
  const [editTeam, setEditTeam] = useState('Engineering')
  const [editTeams, setEditTeams] = useState<string[]>([])
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false)
  const [editError, setEditError] = useState('')

  // Dynamic Teams List from backend
  const [availableTeams, setAvailableTeams] = useState<string[]>([])

  // Delete State
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const { refreshTrigger, selectedTeam } = useAdminFilter()

  const fetchEmployeesData = useCallback(async (isBackground = false) => {
    try {
      if (!isBackground && !cachedEmployeesCards) {
        setLoading(true)
      }
      // Fetch both timesheet metrics and user directory
      const todayStr = new Date().toISOString().slice(0, 10)
      const [timesheetRes, usersRes] = await Promise.all([
        fetch(`/api/admin/timesheet?date=${todayStr}`, { cache: 'no-store' }),
        fetch('/api/admin/users', { cache: 'no-store' }),
      ])

      const timesheetData = await timesheetRes.json()
      const usersData = await usersRes.json()

      const rawTimesheetEmployees = timesheetData.success ? timesheetData.employees || [] : []
      const rawUsers = usersData.success ? usersData.employees || [] : []

      // Create a map by user ID
      const userMap = new Map<string, any>()
      rawUsers.forEach((u: any) => userMap.set(u.id, u))

      // Combine into cards
      const mapped: TeamMemberCardData[] = []

      // 1. Process users who have timesheet entries or all users
      const allUserIds = new Set<string>([
        ...rawTimesheetEmployees.map((e: any) => e.id),
        ...rawUsers.map((u: any) => u.id),
      ])

      allUserIds.forEach((uid) => {
        const ts = rawTimesheetEmployees.find((e: any) => e.id === uid)
        const dbU = userMap.get(uid)

        const name = ts?.name || dbU?.full_name || dbU?.email?.split('@')[0] || 'Employee'
        const email = ts?.email || dbU?.email || ''
        const role = dbU?.role === 'TENANT_ADMIN' ? 'Tenant Admin' : ts?.role || 'Employee'
        const teamsList: string[] = Array.isArray(dbU?.teams)
          ? dbU.teams
          : dbU?.team
          ? [dbU.team]
          : ts?.team
          ? [ts.team]
          : ['General']
        const team = teamsList.join(', ')
        const avatar = ts?.avatarLetter || name.charAt(0).toUpperCase()

        const hasClockedIn = !!ts?.hasClockedIn
        const workedDays = ts?.metrics?.workedDays || 0
        const inTime = ts?.metrics?.inTime && ts.metrics.inTime !== '00:00' ? ts.metrics.inTime : '00:00'
        const workedHours = ts?.metrics?.workDuration || '00h 00m'

        // Determine statusCategory
        let statusCategory: TeamMemberCardData['statusCategory'] = 'YET_TO_START'
        let cardTheme: TeamMemberCardData['cardTheme'] = 'yellow'

        if (ts?.status === 'Active') {
          statusCategory = 'WORKING'
          cardTheme = 'green'
        } else if (ts?.status === 'Completed') {
          statusCategory = 'STOPPED'
          cardTheme = 'pink'
        } else if (workedDays === 0 && !hasClockedIn) {
          statusCategory = 'NOT_INSTALLED'
          cardTheme = 'yellow'
        } else {
          statusCategory = 'YET_TO_START'
          cardTheme = 'yellow'
        }

        // Active time percentage
        let activeTimePct = 0
        if (hasClockedIn) {
          activeTimePct = statusCategory === 'WORKING' ? 88 : 82
        }

        // Calculate progress percentage assuming 8 hour day
        let progressPct = 0
        if (hasClockedIn && workedHours !== '00h 00m') {
          const parts = workedHours.match(/(\d+)h\s*(\d+)m/)
          if (parts) {
            const h = parseInt(parts[1], 10)
            const m = parseInt(parts[2], 10)
            const totalMins = h * 60 + m
            progressPct = Math.min(100, Math.round((totalMins / 480) * 100))
          }
        }

        mapped.push({
          id: uid,
          name,
          email,
          avatar,
          role,
          team,
          teams: teamsList,
          workedDaysText: workedDays > 0 ? `Worked for ${workedDays} days` : 'Yet to start work',
          activeTimePct,
          appsUsedText: hasClockedIn ? 'Activity monitored' : undefined,
          appNotInstalled: statusCategory === 'NOT_INSTALLED',
          checkInTime: inTime,
          hoursWorked: workedHours,
          progressPct,
          statusCategory,
          cardTheme,
        })
      })

      cachedEmployeesCards = mapped
      setTeamCards(mapped)
    } catch (err) {
      console.error('Failed to load team members:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch available dynamic teams
  useEffect(() => {
    fetch('/api/admin/teams')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.teams) && data.teams.length > 0) {
          const names = data.teams.map((t: any) => t.name?.trim()).filter(Boolean)
          setAvailableTeams(names)
          if (names.length > 0) {
            setNewTeam(names[0])
            setNewTeams([names[0]])
          }
        }
      })
      .catch((err) => console.error('Failed to fetch teams:', err))
  }, [])

  useEffect(() => {
    fetchEmployeesData(!!cachedEmployeesCards)
  }, [fetchEmployeesData, refreshTrigger])

  // Realtime subscription on attendance and user changes
  useEffect(() => {
    const channel = supabase
      .channel('realtime-employees-page')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'attendance_sessions' },
        () => fetchEmployeesData(true)
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'users' },
        () => fetchEmployeesData(true)
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, fetchEmployeesData])

  // Dynamic status pill counts
  const pillCounts = useMemo(() => {
    return {
      all: teamCards.length,
      working: teamCards.filter((c) => c.statusCategory === 'WORKING').length,
      break: teamCards.filter((c) => c.statusCategory === 'BREAK').length,
      stopped: teamCards.filter((c) => c.statusCategory === 'STOPPED').length,
      leave: teamCards.filter((c) => c.statusCategory === 'LEAVE').length,
      notInstalled: teamCards.filter((c) => c.statusCategory === 'NOT_INSTALLED').length,
      yetToStart: teamCards.filter(
        (c) => c.statusCategory === 'YET_TO_START' || c.statusCategory === 'NOT_INSTALLED'
      ).length,
    }
  }, [teamCards])

  // Filter based on active status pill & search query
  const filteredCards = useMemo(() => {
    return teamCards.filter((card) => {
      // Search match
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        const matchName = card.name.toLowerCase().includes(q)
        const matchEmail = (card.email || '').toLowerCase().includes(q)
        if (!matchName && !matchEmail) return false
      }

      // Team filter match
      if (selectedTeam && selectedTeam !== 'All Team') {
        const matchesTeam =
          (card.team && card.team.toLowerCase().includes(selectedTeam.toLowerCase())) ||
          (card.teams && card.teams.some((t) => t.toLowerCase() === selectedTeam.toLowerCase()))
        if (!matchesTeam) return false
      }

      // Status pill match
      if (activeFilterPill === 'ALL') return true
      if (activeFilterPill === 'WORKING') return card.statusCategory === 'WORKING'
      if (activeFilterPill === 'BREAK') return card.statusCategory === 'BREAK'
      if (activeFilterPill === 'STOPPED') return card.statusCategory === 'STOPPED'
      if (activeFilterPill === 'LEAVE') return card.statusCategory === 'LEAVE'
      if (activeFilterPill === 'NOT_INSTALLED') return card.statusCategory === 'NOT_INSTALLED'
      if (activeFilterPill === 'YET_TO_START')
        return card.statusCategory === 'NOT_INSTALLED' || card.statusCategory === 'YET_TO_START'
      return true
    })
  }, [teamCards, activeFilterPill, searchQuery, selectedTeam])

  // Add Employee Handler
  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault()
    setAddError('')
    if (!newFullName.trim() || !newEmail.trim()) {
      setAddError('Full name and email are required.')
      return
    }

    try {
      setIsSubmittingAdd(true)
      const primaryTeam = newTeams[0] || newTeam || (availableTeams[0] || 'General')
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: newFullName.trim(),
          email: newEmail.trim(),
          password: newPassword.trim() || undefined,
          role: newRole,
          team: primaryTeam,
          teams: newTeams.length > 0 ? newTeams : [primaryTeam],
        }),
      })
      const json = await res.json()
      if (json.success) {
        setNewFullName('')
        setNewEmail('')
        setNewPassword('')
        if (availableTeams.length > 0) {
          setNewTeam(availableTeams[0])
          setNewTeams([availableTeams[0]])
        }
        setShowAddModal(false)
        await fetchEmployeesData()
      } else {
        setAddError(json.error || 'Failed to add employee.')
      }
    } catch (err: unknown) {
      setAddError(err instanceof Error ? err.message : 'Error adding employee.')
    } finally {
      setIsSubmittingAdd(false)
    }
  }

  // Edit Employee Handler
  const handleEditEmployee = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editMember) return
    setEditError('')

    try {
      setIsSubmittingEdit(true)
      const primaryTeam = editTeams[0] || editTeam || (availableTeams[0] || 'General')
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editMember.id,
          fullName: editFullName.trim(),
          role: editRole,
          team: primaryTeam,
          teams: editTeams.length > 0 ? editTeams : [primaryTeam],
          password: editPassword.trim() || undefined,
        }),
      })
      const json = await res.json()
      if (json.success) {
        setEditMember(null)
        setEditPassword('')
        await fetchEmployeesData()
      } else {
        setEditError(json.error || 'Failed to update employee.')
      }
    } catch (err: unknown) {
      setEditError(err instanceof Error ? err.message : 'Error updating employee.')
    } finally {
      setIsSubmittingEdit(false)
    }
  }

  // Delete Employee Handler
  const handleDeleteEmployee = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove ${name} from your team?`)) return
    try {
      setDeletingId(id)
      const res = await fetch(`/api/admin/users?id=${id}`, {
        method: 'DELETE',
      })
      const json = await res.json()
      if (json.success) {
        await fetchEmployeesData()
      } else {
        alert(json.error || 'Failed to delete employee')
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error deleting employee')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="min-h-full bg-white dark:bg-gray-950 font-sans text-gray-800 dark:text-gray-100 pb-20">
      {/* Top Header Bar */}
      <AdminHeader
        title="My Team"
        subtitle="Live team member attendance, active time percentage, and tracking status"
        searchPlaceholder="Search in my teams"
        loading={loading}
        onRefresh={fetchEmployeesData}
        onUserAdded={fetchEmployeesData}
        extraActions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition-all"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Add Member</span>
            </button>
            <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 p-0.5 rounded-lg border border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => setViewMode('CARDS')}
                className={`p-1.5 rounded-md text-xs font-semibold flex items-center gap-1 transition-all ${
                  viewMode === 'CARDS'
                    ? 'bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 shadow-2xs'
                    : 'text-gray-500 hover:text-gray-800 dark:text-gray-400'
                }`}
                title="Card Grid View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Cards</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('TABLE')}
                className={`p-1.5 rounded-md text-xs font-semibold flex items-center gap-1 transition-all ${
                  viewMode === 'TABLE'
                    ? 'bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 shadow-2xs'
                    : 'text-gray-500 hover:text-gray-800 dark:text-gray-400'
                }`}
                title="Directory Table View"
              >
                <List className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Directory</span>
              </button>
            </div>
          </div>
        }
      />

      <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
        {/* Horizontal Status Pills Bar */}
        <div className="flex items-center gap-2.5 overflow-x-auto pb-1 text-xs font-semibold no-scrollbar">
          <button
            onClick={() => setActiveFilterPill('ALL')}
            className={`px-4 py-1.5 rounded-full transition-all shrink-0 ${
              activeFilterPill === 'ALL'
                ? 'bg-blue-100 text-blue-700 border border-blue-200 dark:bg-blue-950/70 dark:text-blue-300 dark:border-blue-700 font-bold shadow-2xs'
                : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-850'
            }`}
          >
            All Members ({pillCounts.all})
          </button>

          <button
            onClick={() => setActiveFilterPill('WORKING')}
            className={`px-4 py-1.5 rounded-full transition-all shrink-0 ${
              activeFilterPill === 'WORKING'
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-700 font-bold shadow-2xs'
                : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-850'
            }`}
          >
            Currently Working ({pillCounts.working})
          </button>

          <button
            onClick={() => setActiveFilterPill('BREAK')}
            className={`px-4 py-1.5 rounded-full transition-all shrink-0 ${
              activeFilterPill === 'BREAK'
                ? 'bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-950/70 dark:text-amber-300 dark:border-amber-700 font-bold shadow-2xs'
                : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-850'
            }`}
          >
            Currently In Break ({pillCounts.break})
          </button>

          <button
            onClick={() => setActiveFilterPill('STOPPED')}
            className={`px-4 py-1.5 rounded-full transition-all shrink-0 ${
              activeFilterPill === 'STOPPED'
                ? 'bg-rose-100 text-rose-800 border border-rose-200 dark:bg-rose-950/70 dark:text-rose-300 dark:border-rose-700 font-bold shadow-2xs'
                : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-850'
            }`}
          >
            Stopped Work ({pillCounts.stopped})
          </button>

          <button
            onClick={() => setActiveFilterPill('LEAVE')}
            className={`px-4 py-1.5 rounded-full transition-all shrink-0 ${
              activeFilterPill === 'LEAVE'
                ? 'bg-purple-100 text-purple-800 border border-purple-200 dark:bg-purple-950/70 dark:text-purple-300 dark:border-purple-700 font-bold shadow-2xs'
                : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-850'
            }`}
          >
            On Leave ({pillCounts.leave})
          </button>

          <button
            onClick={() => setActiveFilterPill('NOT_INSTALLED')}
            className={`px-4 py-1.5 rounded-full transition-all shrink-0 ${
              activeFilterPill === 'NOT_INSTALLED'
                ? 'bg-amber-50 text-amber-800 border border-amber-300 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-700 font-bold shadow-2xs'
                : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-850'
            }`}
          >
            App Not Installed ({pillCounts.notInstalled})
          </button>

          <button
            onClick={() => setActiveFilterPill('YET_TO_START')}
            className={`px-4 py-1.5 rounded-full transition-all shrink-0 ${
              activeFilterPill === 'YET_TO_START'
                ? 'bg-amber-50 text-amber-800 border border-amber-300 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-700 font-bold shadow-2xs'
                : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-850'
            }`}
          >
            Yet To Start ({pillCounts.yetToStart})
          </button>
        </div>

        {/* Empty State */}
        {filteredCards.length === 0 && !loading && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-12 text-center shadow-2xs">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-3">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-sm text-gray-900 dark:text-white">
              {searchQuery || activeFilterPill !== 'ALL'
                ? 'No matching team members'
                : 'No team members added yet'}
            </h3>
            <p className="text-xs text-gray-400 max-w-sm mx-auto mt-1 mb-4">
              {searchQuery || activeFilterPill !== 'ALL'
                ? 'Try adjusting your search query or filter pill to see other members.'
                : 'Add your team members to monitor active work sessions, app usage, and attendance.'}
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Member</span>
            </button>
          </div>
        )}

        {/* VIEW MODE 1: SMART EMPLOYEE TRACKER CARDS GRID */}
        {viewMode === 'CARDS' && filteredCards.length > 0 && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredCards.map((card) => {
                const isWorking = card.statusCategory === 'WORKING'
                const isBreak = card.statusCategory === 'BREAK'

                return (
                  <div
                    key={card.id}
                    className="group bg-white dark:bg-gray-850 rounded-2xl p-5 border border-gray-200/80 dark:border-gray-800 hover:border-blue-400 dark:hover:border-blue-600 transition-all duration-200 flex flex-col justify-between shadow-2xs hover:shadow-md hover:-translate-y-0.5"
                  >
                    {/* Top Row: Avatar, Name, Days & Active Time Percentage */}
                    <div>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-xs shrink-0 ${
                            isWorking
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 ring-2 ring-emerald-500/20'
                              : isBreak
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 ring-2 ring-amber-500/20'
                              : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 ring-2 ring-blue-500/20'
                          }`}>
                            {card.avatar}
                          </div>

                          <div>
                            <h3 className="font-bold text-sm text-gray-900 dark:text-white leading-tight group-hover:text-blue-600 transition-colors">
                              {card.name}
                            </h3>
                            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                              {card.workedDaysText}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <span
                              className={`text-xl font-black block leading-none font-mono ${
                                card.activeTimePct > 0
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : 'text-gray-400 dark:text-gray-500'
                              }`}
                            >
                              {card.activeTimePct}%
                            </span>
                            <span className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5 block font-medium">
                              Active Time
                            </span>
                          </div>

                          <div className="flex items-center gap-1 pl-2 border-l border-gray-150 dark:border-gray-800">
                            <button
                              onClick={() => {
                                setEditMember(card)
                                setEditFullName(card.name)
                                setEditRole(card.role?.includes('Admin') ? 'TENANT_ADMIN' : 'EMPLOYEE')
                                const memberTeams = card.teams && card.teams.length > 0
                                  ? card.teams
                                  : card.team
                                  ? card.team.split(',').map((t) => t.trim()).filter(Boolean)
                                  : []
                                setEditTeams(memberTeams)
                                setEditTeam(memberTeams[0] || 'General')
                                setEditError('')
                              }}
                              className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                              title="Edit Member"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteEmployee(card.id, card.name)}
                              disabled={deletingId === card.id}
                              className="p-1.5 text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                              title="Delete Member"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Middle Pill: Apps Used or Desktop App Not Installed */}
                      <div className="flex justify-center my-5">
                        {card.appNotInstalled ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs font-semibold shadow-2xs">
                            Desktop app not installed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-cyan-50 dark:bg-cyan-950/60 border border-cyan-200 dark:border-cyan-800/60 text-cyan-700 dark:text-cyan-300 text-xs font-semibold shadow-2xs">
                            {card.appsUsedText || 'Activity active'}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Bottom Row: Checked-in, Progress Bar, Hours worked */}
                    <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between gap-3 text-xs">
                      <div className="min-w-[65px]">
                        <span className="font-mono font-bold text-gray-900 dark:text-white block leading-tight">
                          {card.checkInTime}
                        </span>
                        <span className="text-[10px] text-gray-400 dark:text-gray-500 block font-medium">
                          Checked-in
                        </span>
                      </div>

                      <div className="flex-1 px-1">
                        <div className="w-full bg-gray-100 dark:bg-gray-800 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              card.progressPct > 0 ? 'bg-cyan-500 dark:bg-cyan-400' : 'bg-transparent'
                            }`}
                            style={{ width: `${card.progressPct}%` }}
                          />
                        </div>
                      </div>

                      <div className="min-w-[70px] text-right">
                        <span className="font-mono font-bold text-gray-900 dark:text-white block leading-tight">
                          {card.hoursWorked}
                        </span>
                        <span className="text-[10px] text-gray-400 dark:text-gray-500 block font-medium">
                          Hours worked
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="text-center pt-4 text-xs text-gray-400 dark:text-gray-500 font-medium">
              Showing {filteredCards.length} of {teamCards.length} team members
            </div>
          </div>
        )}

        {/* VIEW MODE 2: DIRECTORY TABLE (Management & Role Control) */}
        {viewMode === 'TABLE' && filteredCards.length > 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-800 text-gray-400 font-semibold uppercase tracking-wider text-[11px] bg-gray-50 dark:bg-gray-950/40">
                    <th className="py-3 px-5">Member</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Team</th>
                    <th className="py-3 px-4">Checked-in</th>
                    <th className="py-3 px-4">Hours Worked</th>
                    <th className="py-3 px-4">Active Time</th>
                    <th className="py-3 px-4">Desktop Client</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-150 dark:divide-gray-800">
                  {filteredCards.map((row) => (
                    <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-gray-850/40 transition-colors">
                      <td className="py-3.5 px-5 font-bold text-gray-900 dark:text-white flex items-center gap-2.5">
                        <span className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                          {row.avatar}
                        </span>
                        <div>
                          <span>{row.name}</span>
                          <span className="text-[10px] text-gray-400 block font-normal">{row.email}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-gray-600 dark:text-gray-300 font-medium">
                        {row.role}
                      </td>
                      <td className="py-3.5 px-4 text-gray-500">
                        {row.team || '—'}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-gray-700 dark:text-gray-300">
                        {row.checkInTime}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-gray-900 dark:text-white">
                        {row.hoursWorked}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {row.activeTimePct}%
                      </td>
                      <td className="py-3.5 px-4">
                        {row.appNotInstalled ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                            Not Installed
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                            Connected
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                            row.statusCategory === 'WORKING'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : row.statusCategory === 'STOPPED'
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                              : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                          }`}
                        >
                          {row.statusCategory}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setEditMember(row)
                              setEditFullName(row.name)
                              setEditRole(row.role?.includes('Admin') ? 'TENANT_ADMIN' : 'EMPLOYEE')
                              const memberTeams = row.teams && row.teams.length > 0
                                ? row.teams
                                : row.team
                                ? row.team.split(',').map((t) => t.trim()).filter(Boolean)
                                : []
                              setEditTeams(memberTeams)
                              setEditTeam(memberTeams[0] || 'General')
                              setEditError('')
                            }}
                            className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                            title="Edit Employee"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteEmployee(row.id, row.name)}
                            disabled={deletingId === row.id}
                            className="p-1 text-gray-400 hover:text-rose-600 transition-colors"
                            title="Delete Employee"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-150 dark:border-gray-800 pb-3">
              <h3 className="text-base font-bold text-gray-900 dark:text-white">Add New Team Member</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddEmployee} className="space-y-3 text-xs">
              {addError && <p className="text-rose-500 font-semibold">{addError}</p>}
              <div>
                <label className="block font-semibold mb-1 text-gray-700 dark:text-gray-300">Full Name</label>
                <input
                  type="text"
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  placeholder="e.g. Sarah Jenkins"
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-gray-700 dark:text-gray-300">Email Address</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="sarah@company.com"
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-gray-700 dark:text-gray-300">
                  Password <span className="text-gray-400 font-normal">(Default: password123)</span>
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Leave blank for password123 or enter custom"
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-gray-700 dark:text-gray-300">Role</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs"
                >
                  <option value="EMPLOYEE">Employee (Monitored)</option>
                  <option value="TENANT_ADMIN">Tenant Admin</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block font-semibold text-gray-700 dark:text-gray-300">
                    Team(s) Assignment
                  </label>
                  <span className="text-[11px] text-gray-400">Can belong to 1 or more teams</span>
                </div>
                {availableTeams.length === 0 ? (
                  <div className="p-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs text-gray-400 text-center">
                    Loading teams...
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-1.5 p-2 bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-lg max-h-36 overflow-y-auto">
                      {availableTeams.map((t) => {
                        const isChecked = newTeams.includes(t)
                        return (
                          <button
                            key={t}
                            type="button"
                            onClick={() => {
                              const updated = isChecked
                                ? newTeams.filter((item) => item !== t)
                                : [...newTeams, t]
                              setNewTeams(updated)
                              if (updated.length > 0) setNewTeam(updated[0])
                            }}
                            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
                              isChecked
                                ? 'bg-blue-600 text-white shadow-2xs'
                                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-blue-400'
                            }`}
                          >
                            <span>{t}</span>
                            {isChecked && <span className="text-[10px] font-bold">✓</span>}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3.5 py-1.5 rounded-lg text-gray-500 hover:text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAdd}
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold"
                >
                  {isSubmittingAdd ? 'Adding...' : 'Add Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-150 dark:border-gray-800 pb-3">
              <h3 className="text-base font-bold text-gray-900 dark:text-white">Edit Team Member</h3>
              <button onClick={() => setEditMember(null)} className="text-gray-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditEmployee} className="space-y-3 text-xs">
              {editError && <p className="text-rose-500 font-semibold">{editError}</p>}
              <div>
                <label className="block font-semibold mb-1 text-gray-700 dark:text-gray-300">Email Address (Read-only)</label>
                <input
                  type="text"
                  value={editMember.email}
                  disabled
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-800 text-gray-500 text-xs cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-gray-700 dark:text-gray-300">Full Name</label>
                <input
                  type="text"
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-gray-700 dark:text-gray-300">
                  New Password <span className="text-gray-400 font-normal">(Leave blank to keep unchanged)</span>
                </label>
                <input
                  type="password"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  placeholder="Enter new password (min 6 chars)"
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-gray-700 dark:text-gray-300">Role</label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs"
                >
                  <option value="EMPLOYEE">Employee</option>
                  <option value="TENANT_ADMIN">Tenant Admin</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block font-semibold text-gray-700 dark:text-gray-300">
                    Team(s) Assignment
                  </label>
                  <span className="text-[11px] text-gray-400">Can belong to 1 or more teams</span>
                </div>
                {availableTeams.length === 0 ? (
                  <div className="p-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs text-gray-400 text-center">
                    Loading teams...
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-1.5 p-2 bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-lg max-h-36 overflow-y-auto">
                      {availableTeams.map((t) => {
                        const isChecked = editTeams.includes(t)
                        return (
                          <button
                            key={t}
                            type="button"
                            onClick={() => {
                              const updated = isChecked
                                ? editTeams.filter((item) => item !== t)
                                : [...editTeams, t]
                              setEditTeams(updated)
                              if (updated.length > 0) setEditTeam(updated[0])
                            }}
                            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
                              isChecked
                                ? 'bg-blue-600 text-white shadow-2xs'
                                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-blue-400'
                            }`}
                          >
                            <span>{t}</span>
                            {isChecked && <span className="text-[10px] font-bold">✓</span>}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditMember(null)}
                  className="px-3.5 py-1.5 rounded-lg text-gray-500 hover:text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEdit}
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold"
                >
                  {isSubmittingEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
