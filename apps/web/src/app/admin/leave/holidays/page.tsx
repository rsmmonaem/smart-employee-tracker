'use client'

import React, { useState } from 'react'
import AdminHeader from '../../admin-header'
import { Palmtree, Plus, Trash2, Calendar } from 'lucide-react'

type Holiday = {
  id: string
  name: string
  date: string
  day: string
  type: string
}

const DEFAULT_HOLIDAYS: Holiday[] = [
  { id: 'h-1', name: 'New Year Day', date: '2026-01-01', day: 'Thursday', type: 'Public Holiday' },
  { id: 'h-2', name: 'International Mother Language Day', date: '2026-02-21', day: 'Saturday', type: 'National Holiday' },
  { id: 'h-3', name: 'Independence Day', date: '2026-03-26', day: 'Thursday', type: 'National Holiday' },
  { id: 'h-4', name: 'Eid-ul-Fitr (Estimated)', date: '2026-03-21', day: 'Saturday', type: 'Religious Holiday' },
  { id: 'h-5', name: 'Bengali New Year (Pohela Boishakh)', date: '2026-04-14', day: 'Tuesday', type: 'Festival' },
  { id: 'h-6', name: 'May Day', date: '2026-05-01', day: 'Friday', type: 'Public Holiday' },
  { id: 'h-7', name: 'Eid-ul-Adha (Estimated)', date: '2026-05-27', day: 'Wednesday', type: 'Religious Holiday' },
  { id: 'h-8', name: 'Victory Day', date: '2026-12-16', day: 'Wednesday', type: 'National Holiday' },
]

export default function HolidaysPage() {
  const [holidays, setHolidays] = useState<Holiday[]>(DEFAULT_HOLIDAYS)
  const [name, setName] = useState('')
  const [date, setDate] = useState('')
  const [type, setType] = useState('Public Holiday')

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !date) return

    const d = new Date(date)
    const day = d.toLocaleDateString('en-US', { weekday: 'long' })

    setHolidays((prev) => [
      ...prev,
      {
        id: `h-${Date.now()}`,
        name,
        date,
        day,
        type,
      },
    ])

    setName('')
    setDate('')
  }

  const handleDelete = (id: string) => {
    setHolidays((prev) => prev.filter((h) => h.id !== id))
  }

  return (
    <div className="min-h-full bg-[#f8f9fa] dark:bg-gray-950 pb-20 font-sans">
      <AdminHeader
        title="Manage Holidays"
        subtitle="Annual corporate calendar, government holidays, and company festival days"
      />

      <div className="p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto">
        {/* Add Holiday Form */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200/80 dark:border-gray-800 p-6 shadow-2xs">
          <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Plus className="w-4 h-4 text-blue-600" />
            <span>Add New Holiday</span>
          </h3>

          <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 uppercase tracking-wider">
                Holiday Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Company Foundation Day"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 uppercase tracking-wider">
                Date
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 uppercase tracking-wider">
                Classification
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs focus:ring-2 focus:ring-blue-500"
              >
                <option value="Public Holiday">Public Holiday</option>
                <option value="National Holiday">National Holiday</option>
                <option value="Religious Holiday">Religious Holiday</option>
                <option value="Festival">Festival</option>
                <option value="Company Event">Company Event</option>
              </select>
            </div>
            <div>
              <button
                type="submit"
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add to Schedule</span>
              </button>
            </div>
          </form>
        </div>

        {/* Holidays List */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200/80 dark:border-gray-800 shadow-2xs overflow-hidden">
          <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <h3 className="font-bold text-base text-gray-900 dark:text-white">Annual Holidays Schedule</h3>
            <span className="text-xs text-gray-400 font-mono">Year: 2026</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800 text-gray-400 font-semibold uppercase tracking-wider text-[11px] bg-gray-50/50 dark:bg-gray-850/50">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Day</th>
                  <th className="py-3 px-4">Holiday Name</th>
                  <th className="py-3 px-4">Classification</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60">
                {holidays.map((h) => (
                  <tr key={h.id} className="hover:bg-gray-50/60 dark:hover:bg-gray-850/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-gray-900 dark:text-white">{h.date}</td>
                    <td className="py-3 px-4 text-gray-500 dark:text-gray-400">{h.day}</td>
                    <td className="py-3 px-4 font-semibold text-gray-900 dark:text-white">{h.name}</td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                        {h.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleDelete(h.id)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
