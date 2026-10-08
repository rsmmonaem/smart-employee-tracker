'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  Download,
  Edit2,
  Trash2,
  X,
  RefreshCw,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { useAdminFilter } from '../admin-filter-context'
import AdminHeader from '../admin-header'

// Employee Timesheet Record Type from Real Database
type EmployeeRecord = {
  id: string
  sessionId: string | null
  name: string
  email: string
  role: string
  team: string
  avatarLetter: string
  avatarColor: string
  hasClockedIn: boolean
  status: string
  metrics: {
    inTime: string
    outTime: string
    workDuration: string
    activeDuration: string
    idleDuration: string
    workedHours: string
    idleHours: string
    activeHours: string
    workedDays: number
  }
}

type PeriodPreset =
  | 'Today'
  | 'This Week'
  | 'Yesterday'
  | 'This Month'
  | 'Last 7 Days'
  | 'Last Month'
  | 'Last Week'
  | 'Custom'

// Helper date formatters
const formatDateLabel = (dateStr: string) => {
  const [year, month, day] = dateStr.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const dayPad = day.toString().padStart(2, '0')
  return `${dayPad} ${monthNames[date.getMonth()]}`
}

const getHeaderDateTitle = (dateStr: string) => {
  const [year, month, day] = dateStr.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const dayPad = day.toString().padStart(2, '0')
  const dateFmt = `(${dayPad} ${monthNames[date.getMonth()]},${year})`

  if (dateStr === '2026-09-10') return `TODAY ${dateFmt}`
  if (dateStr === '2026-09-09') return `YESTERDAY ${dateFmt}`
  return dateFmt
}

export default function TimesheetPage() {
  const { searchQuery, selectedDate, setSelectedDate, selectedTeam, refreshTrigger } = useAdminFilter()
  const [employees, setEmployees] = useState<EmployeeRecord[]>([])
  const [loading, setLoading] = useState(true)

  // Edit Timecard Modal State
  const [editingEmployee, setEditingEmployee] = useState<EmployeeRecord | null>(null)
  const [editInTime, setEditInTime] = useState('')
  const [editOutTime, setEditOutTime] = useState('')
  const [isSavingEdit, setIsSavingEdit] = useState(false)
  const [isDeletingSession, setIsDeletingSession] = useState(false)

  const handleShiftDate = (days: number) => {
    try {
      const [year, month, day] = selectedDate.split('-').map(Number)
      const cur = new Date(year, month - 1, day)
      cur.setDate(cur.getDate() + days)
      const nextY = cur.getFullYear()
      const nextM = (cur.getMonth() + 1).toString().padStart(2, '0')
      const nextD = cur.getDate().toString().padStart(2, '0')
      setSelectedDate(`${nextY}-${nextM}-${nextD}`)
    } catch {
      // fallback
    }
  }

  const dayLabel = formatDateLabel(selectedDate)
  const dateTag =
    selectedDate === '2026-09-10'
      ? 'Today'
      : selectedDate === '2026-09-09'
      ? 'Yesterday'
      : ''

  // Fetch real data from API
  const fetchTimesheetData = useCallback(async (date: string) => {
    try {
      setLoading(true)
      const res = await fetch(`/api/admin/timesheet?date=${date}`, { cache: 'no-store' })
      const json = await res.json()
      if (json.success && json.employees) {
        setEmployees(json.employees)
      }
    } catch (err) {
      console.error('Failed to fetch timesheet data:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Initial load and on selectedDate/refreshTrigger change
  useEffect(() => {
    fetchTimesheetData(selectedDate)
  }, [selectedDate, fetchTimesheetData, refreshTrigger])

  // Realtime Supabase Subscription for attendance sessions
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('timesheet_db_sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'attendance_sessions' },
        () => {
          console.log('⚡ Realtime attendance_sessions change detected, refreshing timesheet...')
          fetchTimesheetData(selectedDate)
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'users' },
        () => {
          fetchTimesheetData(selectedDate)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [selectedDate, fetchTimesheetData])

  // Export real CSV
  const handleExportCSV = () => {
    const headers = ['Employee Name', 'Email', 'Role', 'Date', 'Clock In', 'Clock Out', 'Work Duration', 'Active Duration', 'Idle Duration', 'Worked Days']
    const rows = employees.map((emp) => [
      `"${emp.name}"`,
      `"${emp.email}"`,
      `"${emp.role}"`,
      `"${selectedDate}"`,
      `"${emp.metrics.inTime}"`,
      `"${emp.metrics.outTime}"`,
      `"${emp.metrics.workDuration}"`,
      `"${emp.metrics.activeDuration}"`,
      `"${emp.metrics.idleDuration}"`,
      `"${emp.metrics.workedDays}"`,
    ])
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `timesheet_real_${selectedDate}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }


  // Save manual edit to database
  const handleSaveEdit = async () => {
    if (!editingEmployee) return
    try {
      setIsSavingEdit(true)
      const res = await fetch('/api/admin/timesheet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: editingEmployee.id,
          date: selectedDate,
          inTime: editInTime || editingEmployee.metrics.inTime,
          outTime: editOutTime || editingEmployee.metrics.outTime,
        }),
      })

      const json = await res.json()
      if (json.success) {
        setEditingEmployee(null)
        await fetchTimesheetData(selectedDate)
      } else {
        alert(json.error || 'Failed to save timesheet edit')
      }
    } catch (err) {
      console.error('Error saving timesheet:', err)
      alert('Error saving timesheet')
    } finally {
      setIsSavingEdit(false)
    }
  }

  // Delete / Clear session from database
  const handleDeleteSession = async (emp: EmployeeRecord) => {
    if (!confirm(`Are you sure you want to clear the timesheet entry for ${emp.name} on ${selectedDate}?`)) {
      return
    }
    try {
      setIsDeletingSession(true)
      const res = await fetch(
        `/api/admin/timesheet?userId=${emp.id}&date=${selectedDate}${
          emp.sessionId ? `&sessionId=${emp.sessionId}` : ''
        }`,
        { method: 'DELETE' }
      )
      const json = await res.json()
      if (json.success) {
        if (editingEmployee?.id === emp.id) {
          setEditingEmployee(null)
        }
        await fetchTimesheetData(selectedDate)
      } else {
        alert(json.error || 'Failed to clear timesheet entry')
      }
    } catch (err) {
      console.error('Error deleting session:', err)
      alert('Error clearing timesheet entry')
    } finally {
      setIsDeletingSession(false)
    }
  }

  // Filtered employees
  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesTeam = selectedTeam === 'All Team' || emp.team === selectedTeam
    return matchesSearch && matchesTeam
  })

  return (
    <div className="min-h-full bg-white dark:bg-gray-900 pb-16">
      {/* Top Header Bar */}
      <AdminHeader
        title="Timesheet"
        searchPlaceholder="Search in timesheet"
        loading={loading}
        onRefresh={() => fetchTimesheetData(selectedDate)}
        onUserAdded={() => fetchTimesheetData(selectedDate)}
      />

      {/* Main Container */}
      <div className="px-8 py-6 space-y-6">
        {/* Banner / Notice Row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
          <div className="text-gray-500 dark:text-gray-400">
            Note: Learn about timesheets effortlessly with{' '}
            <a href="#" className="text-blue-600 hover:underline font-normal">
              this link
            </a>
            .
          </div>

          <div className="flex items-center gap-3">
            {/* Filter Columns */}
            <div className="flex items-center gap-2">
              <span className="text-gray-500 dark:text-gray-400">Filter Columns</span>
              <div className="relative">
                <select className="appearance-none bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg pl-3 pr-8 py-1.5 text-xs text-gray-700 dark:text-gray-200 focus:outline-none focus:border-blue-500 shadow-2xs">
                  <option>Clock In, Clock Out...</option>
                  <option>Full Breakdown</option>
                  <option>Active & Idle Only</option>
                </select>
                <ChevronDown className="w-3 h-3 text-gray-400 absolute right-2.5 top-2.5 pointer-events-none" />
              </div>
            </div>

            {/* Export Button */}
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#1677ff] hover:bg-blue-600 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* Timesheet Matrix Table */}
        <div className="border border-gray-150 dark:border-gray-800 rounded-xl overflow-hidden bg-white dark:bg-gray-900 shadow-2xs">
          {/* Table Header */}
          <div className="grid grid-cols-12 border-b border-gray-150 dark:border-gray-800 bg-[#fbfbfb] dark:bg-gray-850 py-3 px-6 text-[11px] font-semibold tracking-wider text-gray-500 dark:text-gray-400 uppercase">
            <div className="col-span-3 text-gray-500 dark:text-gray-400">EMPLOYEE</div>
            <div className="col-span-5 flex items-center justify-center gap-3 text-gray-500 dark:text-gray-400">
              <button
                onClick={() => handleShiftDate(-1)}
                title="Previous Day"
                className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-300"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-bold tracking-wide text-gray-700 dark:text-gray-200">
                {getHeaderDateTitle(selectedDate)}
              </span>
              <button
                onClick={() => handleShiftDate(1)}
                title="Next Day"
                className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-300"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="col-span-4 pl-4 text-gray-500 dark:text-gray-400">TOTAL WORK SUMMARY</div>
          </div>

          {/* Rows */}
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {filteredEmployees.length === 0 ? (
              <div className="py-12 text-center text-xs text-gray-400">
                No employees found matching the filter.
              </div>
            ) : (
              filteredEmployees.map((emp) => {
                const data = emp.metrics

                return (
                  <div
                    key={emp.id}
                    className="grid grid-cols-12 items-center py-5 px-6 hover:bg-gray-50/40 dark:hover:bg-gray-850/40 transition-colors"
                  >
                    {/* Employee Name & Avatar */}
                    <div className="col-span-3 flex items-center gap-3 pr-4">
                      <div
                        className={`w-9 h-9 rounded-full ${emp.avatarColor} text-white flex items-center justify-center font-bold text-sm shadow-xs flex-shrink-0`}
                      >
                        {emp.avatarLetter}
                      </div>
                      <div className="truncate">
                        <div className="text-xs font-semibold text-gray-800 dark:text-gray-100 truncate">
                          {emp.name}
                        </div>
                        <div className="text-[11px] text-gray-400 dark:text-gray-500 truncate">
                          {emp.role}
                        </div>
                      </div>
                    </div>

                    {/* Daily Timecard Card */}
                    <div className="col-span-5 flex justify-center px-4">
                      <div className="w-68 border border-gray-200 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-800/40 hover:bg-white dark:hover:bg-gray-800 hover:border-blue-300 dark:hover:border-blue-600 rounded-xl p-3.5 space-y-2 shadow-2xs hover:shadow-sm transition-all duration-150">
                        {/* Card Header */}
                        <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400 pb-1.5 border-b border-gray-200/60 dark:border-gray-700">
                          <div className="flex items-center gap-1.5 font-semibold text-gray-700 dark:text-gray-200">
                            <span>{dayLabel}</span>
                            <button
                              onClick={() => {
                                setEditingEmployee(emp)
                                setEditInTime(data.inTime)
                                setEditOutTime(data.outTime)
                              }}
                              className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 p-1 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                              title="Edit Timesheet"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            {emp.hasClockedIn && (
                              <button
                                onClick={() => handleDeleteSession(emp)}
                                className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 p-1 rounded-md hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                                title="Clear Timesheet Entry"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-gray-200/60 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                            {data.inTime !== '00:00' ? 'RECORDED' : 'NO RECORD'}
                          </span>
                        </div>

                        {/* Card Metric Rows */}
                        <div className="space-y-1.5 text-xs">
                          <div className="flex justify-between items-center text-gray-700 dark:text-gray-300">
                            <span className="font-semibold text-gray-800 dark:text-gray-200 font-mono">
                              {data.inTime}
                            </span>
                            <span className="text-[10px] uppercase font-semibold text-gray-400 tracking-wider">
                              IN
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-gray-700 dark:text-gray-300">
                            <span className="font-semibold text-gray-800 dark:text-gray-200 font-mono">
                              {data.outTime}
                            </span>
                            <span className="text-[10px] uppercase font-semibold text-gray-400 tracking-wider">
                              OUT
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-gray-700 dark:text-gray-300">
                            <span className="font-semibold text-gray-800 dark:text-gray-200 font-mono">
                              {data.workDuration}
                            </span>
                            <span className="text-[10px] uppercase font-semibold text-blue-500 tracking-wider">
                              WORK
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-gray-700 dark:text-gray-300">
                            <span className="font-semibold text-emerald-600 dark:text-emerald-400 font-mono">
                              {data.activeDuration}
                            </span>
                            <span className="text-[10px] uppercase font-semibold text-emerald-500 tracking-wider">
                              ACTIVE
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-gray-700 dark:text-gray-300">
                            <span className="font-semibold text-amber-600 dark:text-amber-400 font-mono">
                              {data.idleDuration}
                            </span>
                            <span className="text-[10px] uppercase font-semibold text-amber-500 tracking-wider">
                              IDLE
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Total Work Summary Card */}
                    <div className="col-span-4 pl-4 flex justify-start">
                      <div className="w-68 bg-gray-50/70 dark:bg-gray-800/40 hover:bg-white dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 rounded-xl p-3.5 space-y-2 text-xs shadow-2xs hover:shadow-sm transition-all duration-150">
                        <div className="flex justify-between items-center text-gray-700 dark:text-gray-300">
                          <span className="font-bold text-gray-900 dark:text-white font-mono">
                            {data.workedHours}
                          </span>
                          <span className="text-[11px] text-gray-400 font-medium">Worked hours</span>
                        </div>
                        <div className="flex justify-between items-center text-gray-700 dark:text-gray-300">
                          <span className="font-bold text-amber-600 dark:text-amber-400 font-mono">
                            {data.idleHours}
                          </span>
                          <span className="text-[11px] text-gray-400 font-medium">Idle time</span>
                        </div>
                        <div className="flex justify-between items-center text-gray-700 dark:text-gray-300">
                          <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                            {data.activeHours}
                          </span>
                          <span className="text-[11px] text-gray-400 font-medium">Active time</span>
                        </div>
                        <div className="flex justify-between items-center text-gray-700 dark:text-gray-300 pt-1 border-t border-gray-200/50 dark:border-gray-700/50">
                          <span className="font-bold text-gray-800 dark:text-gray-200 font-mono">
                            {data.workedDays}
                          </span>
                          <span className="text-[11px] text-gray-400 font-medium">Worked days</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* Edit Timecard Modal */}
      {editingEmployee && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-gray-200 dark:border-gray-700 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-gray-150 dark:border-gray-700">
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                  Adjust Timesheet Entry
                </h3>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  {editingEmployee.name} &bull; {selectedDate}
                </p>
              </div>
              <button
                onClick={() => setEditingEmployee(null)}
                className="text-gray-400 hover:text-gray-600 rounded-lg p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Clock In Time
                </label>
                <input
                  type="text"
                  value={editInTime}
                  onChange={(e) => setEditInTime(e.target.value)}
                  placeholder="e.g. 10:00 am"
                  className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Clock Out Time
                </label>
                <input
                  type="text"
                  value={editOutTime}
                  onChange={(e) => setEditOutTime(e.target.value)}
                  placeholder="e.g. 07:00 pm"
                  className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-gray-150 dark:border-gray-700">
                {editingEmployee.hasClockedIn ? (
                  <button
                    type="button"
                    onClick={() => handleDeleteSession(editingEmployee)}
                    disabled={isDeletingSession}
                    className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear Entry</span>
                  </button>
                ) : (
                  <div />
                )}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEditingEmployee(null)}
                    className="px-4 py-2 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    disabled={isSavingEdit}
                    className="px-5 py-2 text-xs font-semibold text-white bg-[#1677ff] hover:bg-blue-600 rounded-lg shadow-xs flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {isSavingEdit && <RefreshCw className="w-3 h-3 animate-spin" />}
                    <span>Save Changes</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
