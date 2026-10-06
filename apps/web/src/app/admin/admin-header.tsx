'use client'

import React, { useState, useRef, useEffect } from 'react'
import {
  Search,
  Calendar as CalendarIcon,
  Users,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  RefreshCw,
  Check,
  X,
} from 'lucide-react'
import { useAdminFilter, PeriodPreset } from './admin-filter-context'
import AddUserModal from './add-user-modal'

export interface AdminHeaderProps {
  title: string
  subtitle?: string
  searchPlaceholder?: string
  showSearch?: boolean
  showDatePicker?: boolean
  showTeamFilter?: boolean
  showAddUser?: boolean
  loading?: boolean
  onRefresh?: () => void
  extraActions?: React.ReactNode
  onUserAdded?: () => void
}

const calendarDays = [
  { day: 30, isCurrentMonth: false },
  { day: 31, isCurrentMonth: false },
  { day: 1, isCurrentMonth: true },
  { day: 2, isCurrentMonth: true },
  { day: 3, isCurrentMonth: true },
  { day: 4, isCurrentMonth: true },
  { day: 5, isCurrentMonth: true },
  { day: 6, isCurrentMonth: true },
  { day: 7, isCurrentMonth: true },
  { day: 8, isCurrentMonth: true },
  { day: 9, isCurrentMonth: true },
  { day: 10, isCurrentMonth: true },
  { day: 11, isCurrentMonth: true },
  { day: 12, isCurrentMonth: true },
  { day: 13, isCurrentMonth: true },
  { day: 14, isCurrentMonth: true },
  { day: 15, isCurrentMonth: true },
  { day: 16, isCurrentMonth: true },
  { day: 17, isCurrentMonth: true },
  { day: 18, isCurrentMonth: true },
  { day: 19, isCurrentMonth: true },
  { day: 20, isCurrentMonth: true },
  { day: 21, isCurrentMonth: true },
  { day: 22, isCurrentMonth: true },
  { day: 23, isCurrentMonth: true },
  { day: 24, isCurrentMonth: true },
  { day: 25, isCurrentMonth: true },
  { day: 26, isCurrentMonth: true },
  { day: 27, isCurrentMonth: true },
  { day: 28, isCurrentMonth: true },
  { day: 29, isCurrentMonth: true },
  { day: 30, isCurrentMonth: true },
  { day: 1, isCurrentMonth: false },
  { day: 2, isCurrentMonth: false },
  { day: 3, isCurrentMonth: false },
]

export default function AdminHeader({
  title,
  subtitle,
  searchPlaceholder,
  showSearch = true,
  showDatePicker = true,
  showTeamFilter = true,
  showAddUser = true,
  loading = false,
  onRefresh,
  extraActions,
  onUserAdded,
}: AdminHeaderProps) {
  const {
    searchQuery,
    setSearchQuery,
    selectedDate,
    setSelectedDate,
    selectedPreset,
    setSelectedPreset,
    selectedTeam,
    setSelectedTeam,
    teams,
    showAddUserModal,
    setShowAddUserModal,
    triggerRefresh,
  } = useAdminFilter()

  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false)
  const [isTeamMenuOpen, setIsTeamMenuOpen] = useState(false)
  const [selectedCalendarDays, setSelectedCalendarDays] = useState<number[]>([10])

  const datePickerRef = useRef<HTMLDivElement>(null)
  const teamDropdownRef = useRef<HTMLDivElement>(null)

  // Sync calendar selected day from selectedDate
  useEffect(() => {
    try {
      const parts = selectedDate.split('-')
      if (parts.length === 3) {
        const day = parseInt(parts[2], 10)
        if (!isNaN(day)) {
          setSelectedCalendarDays([day])
        }
      }
    } catch {}
  }, [selectedDate])

  // Close menus when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (datePickerRef.current && !datePickerRef.current.contains(e.target as Node)) {
        setIsDatePickerOpen(false)
      }
      if (teamDropdownRef.current && !teamDropdownRef.current.contains(e.target as Node)) {
        setIsTeamMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const formatDateLabel = (d: string) => {
    try {
      const parts = d.split('-')
      if (parts.length === 3) {
        const monthIndex = parseInt(parts[1], 10) - 1
        const day = parseInt(parts[2], 10)
        const months = [
          'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
          'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
        ]
        return `${months[monthIndex]} ${day}`
      }
    } catch {}
    return d
  }

  const todayActual = new Date().toISOString().slice(0, 10)
  const yesterdayActual = new Date(Date.now() - 86400000).toISOString().slice(0, 10)

  const dateTag = formatDateLabel(selectedDate)
  const dateLabel =
    selectedDate === todayActual || selectedDate === '2026-09-10'
      ? 'Today'
      : selectedDate === yesterdayActual || selectedDate === '2026-09-09'
      ? 'Yesterday'
      : dateTag

  const handleShiftDate = (days: number) => {
    const [year, month, day] = selectedDate.split('-').map(Number)
    const d = new Date(year, month - 1, day + days)
    const yStr = d.getFullYear()
    const mStr = (d.getMonth() + 1).toString().padStart(2, '0')
    const dStr = d.getDate().toString().padStart(2, '0')
    const nextDate = `${yStr}-${mStr}-${dStr}`

    setSelectedDate(nextDate)
    setSelectedCalendarDays([d.getDate()])
    if (nextDate === todayActual || nextDate === '2026-09-10') setSelectedPreset('Today')
    else if (nextDate === yesterdayActual || nextDate === '2026-09-09') setSelectedPreset('Yesterday')
    else setSelectedPreset('Custom')
  }

  const handleSelectPreset = (preset: PeriodPreset) => {
    setSelectedPreset(preset)
    const now = new Date()
    if (preset === 'Today') {
      setSelectedCalendarDays([now.getDate()])
    } else if (preset === 'Yesterday') {
      const yest = new Date(Date.now() - 86400000)
      setSelectedCalendarDays([yest.getDate()])
    } else if (preset === 'Last 7 Days' || preset === 'This Week') {
      setSelectedCalendarDays([now.getDate()])
    } else if (preset === 'This Month') {
      setSelectedCalendarDays([now.getDate()])
    }
  }

  const handleApplyDateRange = () => {
    if (selectedPreset === 'Yesterday') {
      setSelectedDate(yesterdayActual)
    } else if (selectedPreset === 'Today') {
      setSelectedDate(todayActual)
    } else if (selectedCalendarDays.length > 0) {
      const now = new Date()
      const day = selectedCalendarDays[0]
      const dayPad = day.toString().padStart(2, '0')
      const mPad = (now.getMonth() + 1).toString().padStart(2, '0')
      setSelectedDate(`${now.getFullYear()}-${mPad}-${dayPad}`)
    }
    setIsDatePickerOpen(false)
  }

  const placeholder = searchPlaceholder || `Search in ${title.toLowerCase()}`

  return (
    <>
      <div className="min-h-16 px-6 lg:px-8 py-2.5 border-b border-gray-150 dark:border-gray-800 flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-gray-900 sticky top-0 z-30">
        {/* Left: Title & Release Notes */}
        <div className="flex items-center gap-3 min-w-0">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-gray-800 dark:text-white tracking-tight truncate">
                {title}
              </h1>
              <div className="hidden sm:flex items-center gap-1.5 text-xs text-gray-400 font-normal">
                <span>Release Notes</span>
                <span className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600 inline-block"></span>
              </div>
              {loading && (
                <RefreshCw className="w-3.5 h-3.5 text-blue-500 animate-spin" />
              )}
            </div>
            {subtitle && (
              <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Right: Actions and Common Filters */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 relative">
          {/* Extra Actions if any */}
          {extraActions}

          {/* Add Users Button */}
          {showAddUser && (
            <button
              onClick={() => setShowAddUserModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#1677ff] hover:bg-blue-600 text-white rounded-full text-xs font-semibold shadow-xs transition-colors shrink-0"
            >
              <UserPlus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span className="hidden sm:inline">ADD USERS</span>
            </button>
          )}

          {/* Search Input */}
          {showSearch && (
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={placeholder}
                className="w-36 sm:w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full pl-8 pr-7 py-1.5 text-xs text-gray-700 dark:text-gray-200 placeholder:text-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          )}

          {/* Date Picker Button & Popover */}
          {showDatePicker && (
            <div className="relative" ref={datePickerRef}>
              <button
                onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-medium text-gray-700 dark:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600 transition-colors shadow-2xs shrink-0"
              >
                <CalendarIcon className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
                <span>{dateLabel}</span>
              </button>

              {/* Date Picker Modal / Popover */}
              {isDatePickerOpen && (
                <div className="absolute right-0 top-10 w-[580px] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-5 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex divide-x divide-gray-150 dark:divide-gray-700">
                    {/* Left Column: Calendar */}
                    <div className="pr-6 flex-1">
                      <div className="flex items-center justify-between mb-4">
                        <button
                          onClick={() => handleShiftDate(-30)}
                          className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <div className="text-xs font-bold text-gray-800 dark:text-white">
                          September 2026
                        </div>
                        <button
                          onClick={() => handleShiftDate(30)}
                          className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Weekday headers */}
                      <div className="grid grid-cols-7 text-center text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-2">
                        <span>Su</span>
                        <span>Mo</span>
                        <span>Tu</span>
                        <span>We</span>
                        <span>Th</span>
                        <span>Fr</span>
                        <span>Sa</span>
                      </div>

                      {/* Days Grid */}
                      <div className="grid grid-cols-7 gap-y-1 text-center text-xs">
                        {calendarDays.map((item, idx) => {
                          const isSelected =
                            selectedCalendarDays.includes(item.day) &&
                            item.isCurrentMonth
                          return (
                            <div
                              key={idx}
                              className="flex items-center justify-center p-0.5"
                            >
                              <button
                                onClick={() => {
                                  if (item.isCurrentMonth) {
                                    setSelectedCalendarDays([item.day])
                                    if (item.day === 9) setSelectedPreset('Yesterday')
                                    else if (item.day === 10) setSelectedPreset('Today')
                                    else setSelectedPreset('Custom')
                                  }
                                }}
                                className={`w-7 h-7 rounded-md flex items-center justify-center transition-all ${
                                  !item.isCurrentMonth
                                    ? 'text-gray-300 dark:text-gray-600 cursor-default'
                                    : isSelected
                                    ? 'bg-[#1677ff] text-white font-bold shadow-xs'
                                    : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                                }`}
                              >
                                {item.day}
                              </button>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {/* Right Column: Filter by Period */}
                    <div className="pl-6 w-48 flex flex-col justify-between">
                      <div>
                        <div className="text-xs font-semibold text-gray-700 dark:text-gray-200 mb-3">
                          Filter by Period
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {(
                            [
                              'Today',
                              'This Week',
                              'Yesterday',
                              'This Month',
                              'Last 7 Days',
                              'Last Month',
                              'Last Week',
                              'Custom',
                            ] as PeriodPreset[]
                          ).map((preset) => {
                            const isCurrent = selectedPreset === preset
                            return (
                              <button
                                key={preset}
                                onClick={() => handleSelectPreset(preset)}
                                className={`px-2 py-1.5 rounded-full text-[11px] font-medium border text-center transition-all ${
                                  isCurrent
                                    ? 'border-blue-500 text-blue-600 bg-blue-50/50 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-400 font-semibold'
                                    : 'border-gray-200 text-gray-600 hover:border-gray-300 dark:border-gray-700 dark:text-gray-300'
                                }`}
                              >
                                {preset}
                              </button>
                            )
                          })}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-end gap-2 pt-6">
                        <button
                          onClick={() => setIsDatePickerOpen(false)}
                          className="px-3.5 py-1.5 text-xs text-blue-600 border border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleApplyDateRange}
                          className="px-4 py-1.5 text-xs font-medium text-white bg-[#1677ff] hover:bg-blue-600 rounded-lg shadow-xs transition-colors"
                        >
                          Apply
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Team Dropdown */}
          {showTeamFilter && (
            <div className="relative" ref={teamDropdownRef}>
              <button
                onClick={() => setIsTeamMenuOpen(!isTeamMenuOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-medium text-gray-700 dark:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600 transition-colors shadow-2xs shrink-0"
              >
                <Users className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
                <span>{selectedTeam}</span>
                <ChevronDown className="w-3 h-3 text-gray-400 ml-0.5" />
              </button>

              {isTeamMenuOpen && (
                <div className="absolute right-0 top-10 w-44 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-1.5 z-40">
                  {teams.map((team) => (
                    <button
                      key={team}
                      onClick={() => {
                        setSelectedTeam(team)
                        setIsTeamMenuOpen(false)
                      }}
                      className={`w-full text-left px-3.5 py-1.5 text-xs flex items-center justify-between transition-colors ${
                        selectedTeam === team
                          ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300 font-semibold'
                          : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/60'
                      }`}
                    >
                      <span>{team}</span>
                      {selectedTeam === team && (
                        <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Optional Refresh Button if onRefresh supplied */}
          {onRefresh && (
            <button
              onClick={onRefresh}
              title="Refresh Data"
              className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          )}
        </div>
      </div>

      {/* Add User Modal */}
      <AddUserModal
        isOpen={showAddUserModal}
        onClose={() => setShowAddUserModal(false)}
        onSuccess={() => {
          triggerRefresh()
          if (onUserAdded) onUserAdded()
        }}
      />
    </>
  )
}
