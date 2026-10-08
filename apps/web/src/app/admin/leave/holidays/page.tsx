'use client'

import React, { useState, useEffect, useCallback } from 'react'
import AdminHeader from '../../admin-header'
import { Palmtree, Plus, Trash2, Calendar, RefreshCw, AlertCircle } from 'lucide-react'

type Holiday = {
  id: string
  name: string
  date: string
  day: string
  type: string
}

export default function HolidaysPage() {
  const [holidays, setHolidays] = useState<Holiday[]>([])
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [date, setDate] = useState('')
  const [type, setType] = useState('Public Holiday')

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
        setHolidays((prev) => [...prev, data.holiday])
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

  return (
    <div className="min-h-full bg-[#f8f9fa] dark:bg-gray-950 pb-20 font-sans">
      <AdminHeader
        title="Organization Holidays"
        subtitle="Manage official calendar holidays and non-working business days"
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
                  <option value="Public Holiday">Public Holiday</option>
                  <option value="National Holiday">National Holiday</option>
                  <option value="Religious Holiday">Religious Holiday</option>
                  <option value="Festival">Festival</option>
                  <option value="Company Event">Company Event</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Saving...' : 'Add To Calendar'}</span>
              </button>
            </form>
          </div>

          {/* Holiday Calendar List */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-xl border border-gray-200/80 dark:border-gray-800 shadow-2xs overflow-hidden">
            <div className="p-5 border-b border-gray-150 dark:border-gray-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-gray-900 dark:text-white">Declared Holidays (2026)</h3>
                <p className="text-xs text-gray-400 mt-0.5">Automated non-working days for employee timesheets</p>
              </div>
              <button
                onClick={fetchHolidays}
                className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg transition-colors"
                title="Refresh holidays"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>

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
                        <div className="text-xs font-bold text-gray-900 dark:text-white">{h.name}</div>
                        <div className="text-[11px] text-gray-400 mt-0.5 font-mono">
                          {h.day} &bull; {h.date}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/50 dark:border-blue-900/50">
                        {h.type}
                      </span>
                      <button
                        onClick={() => handleDelete(h.id, h.name)}
                        disabled={deletingId === h.id}
                        className="p-1.5 text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-md transition-colors"
                        title="Delete Holiday"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
