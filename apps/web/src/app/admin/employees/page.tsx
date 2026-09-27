'use client'

import React, { useState, useEffect, useCallback } from 'react'
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
}

// Workfolio default members matching user screenshot
const DEFAULT_WORKFOLIO_TEAM: TeamMemberCardData[] = [
  {
    id: 'wf-1',
    name: 'Ajim Ali',
    avatar: 'A',
    workedDaysText: 'Worked for 2 days',
    activeTimePct: 91,
    appsUsedText: '20 apps used',
    checkInTime: '03:21 pm',
    hoursWorked: '13h 34m',
    progressPct: 65,
    statusCategory: 'WORKING',
    cardTheme: 'green',
    role: 'Video Editor',
    email: 'ajim@workfolio.io',
  },
  {
    id: 'wf-2',
    name: 'Foyz',
    avatar: 'F',
    workedDaysText: 'Yet to start work',
    activeTimePct: 0,
    appNotInstalled: true,
    checkInTime: '00:00',
    hoursWorked: '00h 00m',
    progressPct: 0,
    statusCategory: 'NOT_INSTALLED',
    cardTheme: 'yellow',
    role: 'Designer',
    email: 'foyz.desk@workfolio.io',
  },
  {
    id: 'wf-3',
    name: 'Foyz',
    avatar: 'F',
    workedDaysText: 'Worked for 5 days',
    activeTimePct: 89,
    appsUsedText: '43 apps used',
    checkInTime: '10:16 am',
    hoursWorked: '42h 40m',
    progressPct: 85,
    statusCategory: 'STOPPED',
    cardTheme: 'pink',
    role: 'Motion Designer',
    email: 'foyz@workfolio.io',
  },
  {
    id: 'wf-4',
    name: 'Masud',
    avatar: 'M',
    workedDaysText: 'Worked for 5 days',
    activeTimePct: 83,
    appsUsedText: '11 apps used',
    checkInTime: '10:16 am',
    hoursWorked: '41h 41m',
    progressPct: 80,
    statusCategory: 'STOPPED',
    cardTheme: 'pink',
    role: 'Lead Editor',
    email: 'masud@workfolio.io',
  },
  {
    id: 'wf-5',
    name: 'MOHAMMAD MUNAYAM ...',
    avatar: 'M',
    workedDaysText: 'Yet to start work',
    activeTimePct: 0,
    appNotInstalled: true,
    checkInTime: '00:00',
    hoursWorked: '00h 00m',
    progressPct: 0,
    statusCategory: 'NOT_INSTALLED',
    cardTheme: 'yellow',
    role: 'Software Engineer',
    email: 'munayam@workfolio.io',
  },
]

export default function EmployeesPage() {
  const { searchQuery, setSearchQuery, selectedTeam, refreshTrigger } = useAdminFilter()
  const [activeFilterPill, setActiveFilterPill] = useState<StatusPill>('ALL')
  const [viewMode, setViewMode] = useState<'CARDS' | 'TABLE'>('CARDS')
  const [loading, setLoading] = useState(false)

  // DB Employees
  const [dbEmployees, setDbEmployees] = useState<any[]>([])

  // Modals
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedMember, setSelectedMember] = useState<any | null>(null)

  // Add Form
  const [newFullName, setNewFullName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newRole, setNewRole] = useState('EMPLOYEE')
  const [newTeam, setNewTeam] = useState('Engineering')
  const [isSubmittingAdd, setIsSubmittingAdd] = useState(false)
  const [addError, setAddError] = useState('')

  // Edit Form
  const [editFullName, setEditFullName] = useState('')
  const [editRole, setEditRole] = useState('EMPLOYEE')
  const [editTeam, setEditTeam] = useState('Engineering')
  const [editIsActive, setEditIsActive] = useState(true)
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false)
  const [editError, setEditError] = useState('')

  const fetchDbEmployees = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/users', { cache: 'no-store' })
      const json = await res.json()
      if (json.success && json.employees) {
        setDbEmployees(json.employees)
      }
    } catch (err) {
      console.error('Failed to load DB employees:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDbEmployees()
  }, [fetchDbEmployees, refreshTrigger])

  // Merge default Workfolio members with any DB records
  const allTeamCards: TeamMemberCardData[] = DEFAULT_WORKFOLIO_TEAM

  // Filter based on active status pill & search query
  const filteredCards = allTeamCards.filter((card) => {
    // Search match
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      const matchName = card.name.toLowerCase().includes(q)
      const matchEmail = (card.email || '').toLowerCase().includes(q)
      if (!matchName && !matchEmail) return false
    }

    // Status pill match
    if (activeFilterPill === 'ALL') return true
    if (activeFilterPill === 'WORKING') return card.statusCategory === 'WORKING'
    if (activeFilterPill === 'BREAK') return card.statusCategory === 'BREAK'
    if (activeFilterPill === 'STOPPED') return card.statusCategory === 'STOPPED'
    if (activeFilterPill === 'LEAVE') return card.statusCategory === 'LEAVE'
    if (activeFilterPill === 'NOT_INSTALLED') return card.statusCategory === 'NOT_INSTALLED'
    if (activeFilterPill === 'YET_TO_START') return card.statusCategory === 'NOT_INSTALLED' || card.statusCategory === 'YET_TO_START'
    return true
  })

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
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: newFullName.trim(),
          email: newEmail.trim(),
          role: newRole,
          team: newTeam,
        }),
      })
      const json = await res.json()
      if (json.success) {
        setNewFullName('')
        setNewEmail('')
        setShowAddModal(false)
        await fetchDbEmployees()
      } else {
        setAddError(json.error || 'Failed to add employee.')
      }
    } catch (err: unknown) {
      setAddError(err instanceof Error ? err.message : 'Error adding employee.')
    } finally {
      setIsSubmittingAdd(false)
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
        onRefresh={() => fetchDbEmployees()}
        onUserAdded={() => fetchDbEmployees()}
        extraActions={
          <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-800 p-0.5 rounded-lg border border-gray-200 dark:border-gray-700">
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
        }
      />

      <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
        {/* Horizontal Status Pills Bar (Matches Screenshot) */}
        <div className="flex items-center gap-2.5 overflow-x-auto pb-1 text-xs font-semibold no-scrollbar">
          {/* 1. All Members (5) */}
          <button
            onClick={() => setActiveFilterPill('ALL')}
            className={`px-4 py-1.5 rounded-full transition-all shrink-0 ${
              activeFilterPill === 'ALL'
                ? 'bg-[#dbeafe] text-[#1d4ed8] border border-[#bfdbfe] font-bold shadow-2xs'
                : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-800 hover:bg-gray-50'
            }`}
          >
            All Members ({allTeamCards.length})
          </button>

          {/* 2. Currently Working (1) */}
          <button
            onClick={() => setActiveFilterPill('WORKING')}
            className={`px-4 py-1.5 rounded-full transition-all shrink-0 ${
              activeFilterPill === 'WORKING'
                ? 'bg-[#dcfce7] text-[#15803d] border border-[#bbf7d0] font-bold shadow-2xs'
                : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-800 hover:bg-gray-50'
            }`}
          >
            Currently Working (1)
          </button>

          {/* 3. Currently In Break */}
          <button
            onClick={() => setActiveFilterPill('BREAK')}
            className={`px-4 py-1.5 rounded-full transition-all shrink-0 ${
              activeFilterPill === 'BREAK'
                ? 'bg-[#fef3c7] text-[#b45309] border border-[#fde68a] font-bold shadow-2xs'
                : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-800 hover:bg-gray-50'
            }`}
          >
            Currently In Break
          </button>

          {/* 4. Stopped Work (2) */}
          <button
            onClick={() => setActiveFilterPill('STOPPED')}
            className={`px-4 py-1.5 rounded-full transition-all shrink-0 ${
              activeFilterPill === 'STOPPED'
                ? 'bg-[#ffe4e6] text-[#be123c] border border-[#fecdd3] font-bold shadow-2xs'
                : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-800 hover:bg-gray-50'
            }`}
          >
            Stopped Work (2)
          </button>

          {/* 5. On Leave */}
          <button
            onClick={() => setActiveFilterPill('LEAVE')}
            className={`px-4 py-1.5 rounded-full transition-all shrink-0 ${
              activeFilterPill === 'LEAVE'
                ? 'bg-[#ede9fe] text-[#6d28d9] border border-[#ddd6fe] font-bold shadow-2xs'
                : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-800 hover:bg-gray-50'
            }`}
          >
            On Leave
          </button>

          {/* 6. App Not Installed (2) */}
          <button
            onClick={() => setActiveFilterPill('NOT_INSTALLED')}
            className={`px-4 py-1.5 rounded-full transition-all shrink-0 ${
              activeFilterPill === 'NOT_INSTALLED'
                ? 'bg-[#fef9c3] text-[#a16207] border border-[#fef08a] font-bold shadow-2xs'
                : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-800 hover:bg-gray-50'
            }`}
          >
            App Not Installed (2)
          </button>

          {/* 7. Yet To Start */}
          <button
            onClick={() => setActiveFilterPill('YET_TO_START')}
            className={`px-4 py-1.5 rounded-full transition-all shrink-0 ${
              activeFilterPill === 'YET_TO_START'
                ? 'bg-[#fef9c3] text-[#a16207] border border-[#fef08a] font-bold shadow-2xs'
                : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-800 hover:bg-gray-50'
            }`}
          >
            Yet To Start
          </button>
        </div>

        {/* ========================================================
            VIEW MODE 1: WORKFOLIO CARDS GRID (Matches Screenshot)
            ======================================================== */}
        {viewMode === 'CARDS' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredCards.map((card) => {
                const isGreen = card.cardTheme === 'green'
                const isYellow = card.cardTheme === 'yellow'
                const isPink = card.cardTheme === 'pink'

                return (
                  <div
                    key={card.id}
                    className={`rounded-2xl p-5 border transition-all duration-200 flex flex-col justify-between shadow-2xs hover:shadow-xs ${
                      isGreen
                        ? 'bg-[#d1fae5] dark:bg-[#064e3b]/30 border-[#86efac] dark:border-[#065f46]'
                        : isYellow
                        ? 'bg-[#fef9c3] dark:bg-[#713f12]/20 border-[#fde047] dark:border-[#854d0e]'
                        : 'bg-[#fde8ef] dark:bg-[#831843]/20 border-[#fbcfe8] dark:border-[#9d174d]'
                    }`}
                  >
                    {/* Top Row: Avatar, Name, Days & Active Time Percentage */}
                    <div>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          {/* Circular Avatar */}
                          <div className="w-10 h-10 rounded-full bg-black/10 dark:bg-white/10 flex items-center justify-center font-bold text-base text-gray-800 dark:text-gray-200 shrink-0">
                            {card.avatar}
                          </div>

                          <div>
                            <h3 className="font-bold text-sm text-gray-900 dark:text-white leading-tight">
                              {card.name}
                            </h3>
                            <p className="text-[11px] text-gray-600 dark:text-gray-400 mt-0.5">
                              {card.workedDaysText}
                            </p>
                          </div>
                        </div>

                        {/* Top Right: Active Time % */}
                        <div className="text-right">
                          <span
                            className={`text-xl font-black block leading-none ${
                              card.activeTimePct > 0 ? 'text-[#15803d] dark:text-[#4ade80]' : 'text-gray-700 dark:text-gray-400'
                            }`}
                          >
                            {card.activeTimePct}%
                          </span>
                          <span className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 block">
                            Active Time
                          </span>
                        </div>
                      </div>

                      {/* Middle Pill: Apps Used or Desktop App Not Installed */}
                      <div className="flex justify-center my-5">
                        {card.appNotInstalled ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#cbd5e1] dark:bg-slate-800 text-[#334155] dark:text-slate-300 text-xs font-semibold shadow-2xs">
                            Desktop app not installed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#cffafe] dark:bg-cyan-950/70 border border-[#67e8f9] dark:border-cyan-800 text-[#0e7490] dark:text-cyan-300 text-xs font-semibold shadow-2xs">
                            {card.appsUsedText}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Bottom Row: Checked-in, Progress Bar, Hours worked */}
                    <div className="pt-2 border-t border-black/5 dark:border-white/5 flex items-center justify-between gap-3 text-xs">
                      {/* Left: Checked-in */}
                      <div className="min-w-[65px]">
                        <span className="font-mono font-bold text-gray-900 dark:text-white block leading-tight">
                          {card.checkInTime}
                        </span>
                        <span className="text-[10px] text-gray-500 dark:text-gray-400 block">
                          Checked-in
                        </span>
                      </div>

                      {/* Middle: Progress Bar */}
                      <div className="flex-1 px-1">
                        <div className="w-full bg-black/10 dark:bg-white/10 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              card.progressPct > 0 ? 'bg-[#22d3ee] dark:bg-[#06b6d4]' : 'bg-transparent'
                            }`}
                            style={{ width: `${card.progressPct}%` }}
                          />
                        </div>
                      </div>

                      {/* Right: Hours worked */}
                      <div className="min-w-[70px] text-right">
                        <span className="font-mono font-bold text-gray-900 dark:text-white block leading-tight">
                          {card.hoursWorked}
                        </span>
                        <span className="text-[10px] text-gray-500 dark:text-gray-400 block">
                          Hours worked
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Footer Notice */}
            <div className="text-center pt-4 text-xs text-gray-400 dark:text-gray-500 font-medium">
              You have seen all the team members
            </div>
          </div>
        )}

        {/* ========================================================
            VIEW MODE 2: DIRECTORY TABLE (Management & Role Control)
            ======================================================== */}
        {viewMode === 'TABLE' && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-800 text-gray-400 font-semibold uppercase tracking-wider text-[11px] bg-gray-50 dark:bg-gray-950/40">
                    <th className="py-3 px-5">Member</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Checked-in</th>
                    <th className="py-3 px-4">Hours Worked</th>
                    <th className="py-3 px-4">Active Time</th>
                    <th className="py-3 px-4">Desktop Client</th>
                    <th className="py-3 px-5 text-right">Status</th>
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
                      <td className="py-3.5 px-5 text-right">
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
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-gray-700 dark:text-gray-300">Email Address</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="sarah@workfolio.io"
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs"
                />
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
    </div>
  )
}
