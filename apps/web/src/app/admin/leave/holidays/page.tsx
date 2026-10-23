'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import AdminHeader from '../../admin-header'
import {
  Palmtree,
  Plus,
  Trash2,
  Calendar,
  RefreshCw,
  AlertCircle,
  Pencil,
  ChevronLeft,
  ChevronRight,
  X,
  Check,
  CalendarDays,
  Sparkles,
} from 'lucide-react'

type Holiday = {
  id: string
  name: string
  date: string
  day: string
  type: string
}

const HOLIDAY_TYPES = [
  'Public Holiday',
  'National Holiday',
  'Religious Holiday',
  'Festival',
  'Company Event',
]

export default function HolidaysPage() {
  const [holidays, setHolidays] = useState<Holiday[]>([])
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Add form state
  const [name, setName] = useState('')
  const [date, setDate] = useState('')
  const [type, setType] = useState('Public Holiday')

  // Calendar toggle & navigation state
  const [showCalendarView, setShowCalendarView] = useState(false)
  const [currentMonth, setCurrentMonth] = useState<Date>(() => new Date())

  // Edit Modal State
  const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null)
  const [editName, setEditName] = useState('')
  const [editDate, setEditDate] = useState('')
  const [editType, setEditType] = useState('Public Holiday')
  const [isEditingSubmitting, setIsEditingSubmitting] = useState(false)

  const fetchHolidays = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/leave/holidays', { cache: 'no-store' })
      const data = await res.json()
      if (data.success && data.holidays) {
        setHolidays(data.holidays)
      }
    } catch (err) {
      console.error('Failed to load holidays:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchHolidays()
  }, [fetchHolidays])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !date) return

    try {
      setIsSubmitting(true)
      const res = await fetch('/api/admin/leave/holidays', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), date, type }),
      })
      const data = await res.json()
      if (data.success && data.holiday) {
        setHolidays((prev) => [...prev, data.holiday].sort((a, b) => a.date.localeCompare(b.date)))
        setName('')
        setDate('')
      } else {
        alert(data.error || 'Failed to save holiday')
      }
    } catch (err) {
      console.error('Error adding holiday:', err)
      alert('Error adding holiday')
    } finally {
      setIsSubmitting(false)
    }
  }

  const openEditModal = (holiday: Holiday) => {
    setEditingHoliday(holiday)
    setEditName(holiday.name)
    setEditDate(holiday.date.split('T')[0])
    setEditType(holiday.type || 'Public Holiday')
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingHoliday || !editName.trim() || !editDate) return

    try {
      setIsEditingSubmitting(true)
      const res = await fetch('/api/admin/leave/holidays', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingHoliday.id,
          name: editName.trim(),
          date: editDate,
          type: editType,
        }),
      })

      const data = await res.json()
      if (data.success && data.holiday) {
        setHolidays((prev) =>
          prev
            .map((h) => (h.id === editingHoliday.id ? data.holiday : h))
            .sort((a, b) => a.date.localeCompare(b.date))
        )
        setEditingHoliday(null)
      } else {
        alert(data.error || 'Failed to update holiday')
      }
    } catch (err) {
      console.error('Error updating holiday:', err)
      alert('Error updating holiday')
    } finally {
      setIsEditingSubmitting(false)
    }
  }

  const handleDelete = async (id: string, holidayName: string) => {
    if (!confirm(`Are you sure you want to remove holiday "${holidayName}"?`)) return
    try {
      setDeletingId(id)
      const res = await fetch(`/api/admin/leave/holidays?id=${id}`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (data.success) {
        setHolidays((prev) => prev.filter((h) => h.id !== id))
        if (editingHoliday?.id === id) {
          setEditingHoliday(null)
        }
      } else {
        alert(data.error || 'Failed to delete holiday')
      }
    } catch (err) {
      console.error('Error deleting holiday:', err)
      alert('Error deleting holiday')
    } finally {
      setDeletingId(null)
    }
  }

  // Map holidays by exact YYYY-MM-DD
  const holidayDateMap = useMemo(() => {
    const map = new Map<string, Holiday[]>()
    holidays.forEach((h) => {
      const key = h.date.split('T')[0]
      const list = map.get(key) || []
      list.push(h)
      map.set(key, list)
    })
    return map
  }, [holidays])

  // Calendar Grid Computations
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const firstDayIndex = new Date(year, month, 1).getDay() // 0 = Sun
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const daysInPrevMonth = new Date(year, month, 0).getDate()

    const todayStr = new Date().toISOString().split('T')[0]

    type CellDay = {
      dateStr: string
      dayNum: number
      isCurrentMonth: boolean
      isToday: boolean
      holidays: Holiday[]
    }

    const cells: CellDay[] = []

    // Previous month filler days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dNum = daysInPrevMonth - i
      const prevDate = new Date(year, month - 1, dNum)
      const dateStr = prevDate.toISOString().split('T')[0]
      cells.push({
        dateStr,
        dayNum: dNum,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        holidays: holidayDateMap.get(dateStr) || [],
      })
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(year, month, d)
      // Formatted YYYY-MM-DD
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      cells.push({
        dateStr,
        dayNum: d,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
        holidays: holidayDateMap.get(dateStr) || [],
      })
    }

    // Next month filler days to complete grid (42 cells = 6 weeks)
    const totalCells = Math.ceil(cells.length / 7) * 7
    const remaining = totalCells - cells.length
    for (let nextD = 1; nextD <= remaining; nextD++) {
      const nextDate = new Date(year, month + 1, nextD)
      const dateStr = nextDate.toISOString().split('T')[0]
      cells.push({
        dateStr,
        dayNum: nextD,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        holidays: holidayDateMap.get(dateStr) || [],
      })
    }

    return cells
  }, [currentMonth, holidayDateMap])

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  }

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
  }

  const goToToday = () => {
    setCurrentMonth(new Date())
  }

  const currentMonthLabel = currentMonth.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="min-h-full bg-[#f8f9fa] dark:bg-gray-950 pb-20 font-sans">
      <AdminHeader
        title="Organization Holidays"
        subtitle="Manage official calendar holidays, non-working days, and timesheet schedules"
        loading={loading}
        onRefresh={fetchHolidays}
      />

      <div className="p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Add Holiday Form */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200/80 dark:border-gray-800 p-6 shadow-2xs h-fit space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-gray-150 dark:border-gray-800">
              <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Palmtree className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm text-gray-900 dark:text-white">Add New Holiday</h3>
            </div>

            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Holiday Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Independence Day"
                  className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-xs font-medium text-gray-800 dark:text-gray-200 focus:outline-none focus:border-blue-500 shadow-2xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-xs font-medium text-gray-800 dark:text-gray-200 focus:outline-none focus:border-blue-500 shadow-2xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Classification
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-xs font-medium text-gray-800 dark:text-gray-200 focus:outline-none focus:border-blue-500 shadow-2xs"
                >
                  {HOLIDAY_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs disabled:opacity-50"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Saving...' : 'Add To Calendar'}</span>
              </button>
            </form>
          </div>

          {/* Right Main Area: Calendar View or List View */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-xl border border-gray-200/80 dark:border-gray-800 shadow-2xs overflow-hidden">
            {/* Header Toolbar */}
            <div className="p-4 sm:p-5 border-b border-gray-150 dark:border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-sm text-gray-900 dark:text-white">
                  Declared Organization Holidays ({holidays.length})
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Automated non-working days for employee timesheets and attendance
                </p>
              </div>

              <div className="flex items-center gap-2">
                {/* Modern Calendar Toggle Button */}
                <button
                  type="button"
                  onClick={() => setShowCalendarView(!showCalendarView)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-2xs ${
                    showCalendarView
                      ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-xs'
                      : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-750'
                  }`}
                  title={showCalendarView ? 'Switch to List View' : 'Show Minimal Calendar'}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{showCalendarView ? 'Show List View' : 'Show Calendar'}</span>
                </button>

                <button
                  onClick={fetchHolidays}
                  className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg transition-colors border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-2xs"
                  title="Refresh holidays"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* CONDITIONAL RENDER: MODERN MINIMAL CALENDAR VIEW */}
            {showCalendarView ? (
              <div className="p-4 sm:p-6 space-y-4">
                {/* Calendar Navigation Bar */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h4 className="text-base font-bold text-gray-900 dark:text-white font-mono">
                      {currentMonthLabel}
                    </h4>
                    <button
                      type="button"
                      onClick={goToToday}
                      className="px-2 py-0.5 text-[11px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 rounded-md hover:bg-blue-100 transition-colors"
                    >
                      Today
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={prevMonth}
                      className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors"
                      title="Previous Month"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={nextMonth}
                      className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors"
                      title="Next Month"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Day of Week Headers */}
                <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-gray-400 uppercase tracking-wider py-1.5 border-b border-gray-150 dark:border-gray-800">
                  <span>Sun</span>
                  <span>Mon</span>
                  <span>Tue</span>
                  <span>Wed</span>
                  <span>Thu</span>
                  <span>Fri</span>
                  <span>Sat</span>
                </div>

                {/* Modern Days Grid */}
                <div className="grid grid-cols-7 gap-1.5">
                  {calendarDays.map((cell, idx) => {
                    const hasHolidays = cell.holidays.length > 0

                    return (
                      <div
                        key={idx}
                        onClick={() => {
                          if (cell.isCurrentMonth) {
                            setDate(cell.dateStr)
                          }
                        }}
                        className={`min-h-[82px] p-2 rounded-xl border transition-all flex flex-col justify-between cursor-pointer ${
                          !cell.isCurrentMonth
                            ? 'opacity-30 border-gray-100 dark:border-gray-800/40 bg-gray-50/30 dark:bg-gray-900/20'
                            : hasHolidays
                            ? 'bg-blue-50/50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900/60 shadow-2xs'
                            : 'bg-white dark:bg-gray-850/40 border-gray-150 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={`text-xs font-mono font-bold w-5 h-5 flex items-center justify-center rounded-full ${
                              cell.isToday
                                ? 'bg-blue-600 text-white'
                                : cell.isCurrentMonth
                                ? 'text-gray-800 dark:text-gray-200'
                                : 'text-gray-400'
                            }`}
                          >
                            {cell.dayNum}
                          </span>

                          {hasHolidays && (
                            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                          )}
                        </div>

                        {/* Holiday Chips */}
                        <div className="mt-1 space-y-1">
                          {cell.holidays.map((h) => (
                            <div
                              key={h.id}
                              onClick={(e) => {
                                e.stopPropagation()
                                openEditModal(h)
                              }}
                              className="group px-1.5 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/70 border border-blue-200 dark:border-blue-800 text-[10px] font-semibold text-blue-900 dark:text-blue-100 truncate hover:bg-blue-200 transition-colors flex items-center justify-between gap-1"
                              title={`${h.name} (${h.type}) - Click to edit`}
                            >
                              <span className="truncate">{h.name}</span>
                              <Pencil className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 shrink-0 text-blue-700 dark:text-blue-300" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>

                <div className="pt-2 flex items-center justify-between text-[11px] text-gray-400">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    <span>Highlighted days represent declared official holidays</span>
                  </div>
                  <span>Click any date to pre-fill the Add Holiday form</span>
                </div>
              </div>
            ) : (
              /* STANDARD LIST VIEW */
              <div className="divide-y divide-gray-100 dark:divide-gray-800/60 max-h-[600px] overflow-y-auto">
                {holidays.length === 0 ? (
                  <div className="p-12 text-center text-xs text-gray-400">
                    {loading ? 'Loading holidays from database...' : 'No holidays registered.'}
                  </div>
                ) : (
                  holidays.map((h) => (
                    <div
                      key={h.id}
                      className="p-4 flex items-center justify-between hover:bg-gray-50/50 dark:hover:bg-gray-850/40 transition-colors"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex flex-col items-center justify-center text-center shrink-0">
                          <span className="text-[10px] font-bold uppercase leading-none">
                            {new Date(h.date).toLocaleDateString('en-US', { month: 'short' })}
                          </span>
                          <span className="text-sm font-black font-mono leading-tight">
                            {new Date(h.date).getDate()}
                          </span>
                        </div>
                        <div>
                          <div className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <span>{h.name}</span>
                          </div>
                          <div className="text-[11px] text-gray-400 mt-0.5 font-mono">
                            {h.day} &bull; {h.date}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/50 dark:border-blue-900/50">
                          {h.type}
                        </span>

                        {/* EDIT BUTTON */}
                        <button
                          type="button"
                          onClick={() => openEditModal(h)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-md transition-colors"
                          title="Edit Holiday"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>

                        {/* DELETE BUTTON */}
                        <button
                          type="button"
                          onClick={() => handleDelete(h.id, h.name)}
                          disabled={deletingId === h.id}
                          className="p-1.5 text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-md transition-colors disabled:opacity-50"
                          title="Delete Holiday"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* EDIT HOLIDAY MODAL */}
      {editingHoliday && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 w-full max-w-md shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-gray-150 dark:border-gray-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Pencil className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-gray-900 dark:text-white">Edit Holiday</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingHoliday(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Holiday Name
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-xs font-medium text-gray-800 dark:text-gray-200 focus:outline-none focus:border-blue-500 shadow-2xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-xs font-medium text-gray-800 dark:text-gray-200 focus:outline-none focus:border-blue-500 shadow-2xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Classification
                </label>
                <select
                  value={editType}
                  onChange={(e) => setEditType(e.target.value)}
                  className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-xs font-medium text-gray-800 dark:text-gray-200 focus:outline-none focus:border-blue-500 shadow-2xs"
                >
                  {HOLIDAY_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-150 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setEditingHoliday(null)}
                  className="px-3.5 py-2 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isEditingSubmitting}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs disabled:opacity-50"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{isEditingSubmitting ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
