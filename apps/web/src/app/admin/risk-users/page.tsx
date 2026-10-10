'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  AlertTriangle,
  AlertCircle,
  Flame,
  CheckCircle2,
  Clock,
  ExternalLink,
  Search,
  Filter,
  RefreshCw,
  Activity,
  Zap,
  TrendingDown,
  ChevronRight,
} from 'lucide-react'
import AdminHeader from '../admin-header'

interface RiskUserItem {
  id: string
  name: string
  email: string
  avatar: string
  role: string
  riskLevel: 'CRITICAL' | 'WARNING' | 'ADVISORY' | 'HEALTHY'
  triggers: string[]
  performanceScore: number
  workedHours: string
  idleTime: string
  idlePercent: number
  unproductiveHours: string
  unproductivePercent: number
  productiveHours: string
  productivePercent: number
  isLate: boolean
  isBurnout: boolean
  lastActive: string | null
}

interface RiskSummary {
  criticalCount: number
  warningCount: number
  burnoutCount: number
  healthyCount: number
  totalTracked: number
}

export default function RiskUsersPage() {
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<string>(
    () => new Date().toISOString().slice(0, 10)
  )
  const [riskFilter, setRiskFilter] = useState<'ALL' | 'CRITICAL' | 'WARNING' | 'ADVISORY' | 'HEALTHY'>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [riskUsers, setRiskUsers] = useState<RiskUserItem[]>([])
  const [summary, setSummary] = useState<RiskSummary | null>(null)

  const fetchRiskData = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/admin/risk-users?date=${selectedDate}`, { cache: 'no-store' })
      const data = await res.json()
      if (data.success) {
        setRiskUsers(data.riskUsers || [])
        setSummary(data.summary || null)
      }
    } catch (err) {
      console.error('Failed to fetch risk users:', err)
    } finally {
      setLoading(false)
    }
  }, [selectedDate])

  useEffect(() => {
    fetchRiskData()
  }, [fetchRiskData])

  const filteredUsers = riskUsers.filter((u) => {
    const matchesFilter = riskFilter === 'ALL' || u.riskLevel === riskFilter
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesFilter && matchesSearch
  })

  return (
    <div className="min-h-full bg-white dark:bg-gray-950 pb-16 font-sans text-gray-800 dark:text-gray-100 flex flex-col">
      <AdminHeader
        title="Risk & Anomaly Center"
        subtitle="AI-assisted behavior analytics, excessive idle detection & burnout prevention"
        searchPlaceholder="Search risk users..."
        loading={loading}
        onRefresh={fetchRiskData}
      />

      <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
        {/* KPI Cards Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            onClick={() => setRiskFilter(riskFilter === 'CRITICAL' ? 'ALL' : 'CRITICAL')}
            className={`p-5 rounded-2xl border transition-all cursor-pointer shadow-2xs ${
              riskFilter === 'CRITICAL'
                ? 'border-rose-500 bg-rose-50/70 dark:bg-rose-950/40'
                : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-rose-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                Critical Anomalies
              </span>
              <AlertTriangle className="w-5 h-5 text-rose-500" />
            </div>
            <div className="text-3xl font-black text-rose-600 dark:text-rose-400 mt-2">
              {summary?.criticalCount ?? 0}
            </div>
            <span className="text-xs text-gray-500 mt-1 block">
              Severe idle (&gt;35%) or high distraction
            </span>
          </div>

          <div
            onClick={() => setRiskFilter(riskFilter === 'WARNING' ? 'ALL' : 'WARNING')}
            className={`p-5 rounded-2xl border transition-all cursor-pointer shadow-2xs ${
              riskFilter === 'WARNING'
                ? 'border-amber-500 bg-amber-50/70 dark:bg-amber-950/40'
                : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-amber-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Moderate Warnings
              </span>
              <AlertCircle className="w-5 h-5 text-amber-500" />
            </div>
            <div className="text-3xl font-black text-amber-600 dark:text-amber-400 mt-2">
              {summary?.warningCount ?? 0}
            </div>
            <span className="text-xs text-gray-500 mt-1 block">
              Unproductive time or frequent delays
            </span>
          </div>

          <div
            onClick={() => setRiskFilter(riskFilter === 'ADVISORY' ? 'ALL' : 'ADVISORY')}
            className={`p-5 rounded-2xl border transition-all cursor-pointer shadow-2xs ${
              riskFilter === 'ADVISORY'
                ? 'border-purple-500 bg-purple-50/70 dark:bg-purple-950/40'
                : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-purple-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                Burnout Risk
              </span>
              <Flame className="w-5 h-5 text-purple-500" />
            </div>
            <div className="text-3xl font-black text-purple-600 dark:text-purple-400 mt-2">
              {summary?.burnoutCount ?? 0}
            </div>
            <span className="text-xs text-gray-500 mt-1 block">
              Working &gt;5h continuously without break
            </span>
          </div>

          <div
            onClick={() => setRiskFilter(riskFilter === 'HEALTHY' ? 'ALL' : 'HEALTHY')}
            className={`p-5 rounded-2xl border transition-all cursor-pointer shadow-2xs ${
              riskFilter === 'HEALTHY'
                ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40'
                : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-emerald-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Healthy Workforce
              </span>
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            </div>
            <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
              {summary?.healthyCount ?? 0}
            </div>
            <span className="text-xs text-gray-500 mt-1 block">
              Operating within optimal productivity
            </span>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-2xs flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[200px]">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-gray-800 dark:text-gray-200 focus:outline-none focus:border-blue-500 shadow-2xs"
              />
            </div>

            <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 p-0.5 rounded-lg text-xs font-semibold">
              <button
                onClick={() => setRiskFilter('ALL')}
                className={`px-3 py-1 rounded-md transition-all ${
                  riskFilter === 'ALL'
                    ? 'bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 shadow-2xs font-bold'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                All ({riskUsers.length})
              </button>
              <button
                onClick={() => setRiskFilter('CRITICAL')}
                className={`px-3 py-1 rounded-md transition-all ${
                  riskFilter === 'CRITICAL'
                    ? 'bg-rose-500 text-white shadow-2xs font-bold'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                Critical ({summary?.criticalCount ?? 0})
              </button>
              <button
                onClick={() => setRiskFilter('WARNING')}
                className={`px-3 py-1 rounded-md transition-all ${
                  riskFilter === 'WARNING'
                    ? 'bg-amber-500 text-white shadow-2xs font-bold'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                Warning ({summary?.warningCount ?? 0})
              </button>
              <button
                onClick={() => setRiskFilter('HEALTHY')}
                className={`px-3 py-1 rounded-md transition-all ${
                  riskFilter === 'HEALTHY'
                    ? 'bg-emerald-600 text-white shadow-2xs font-bold'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                Healthy ({summary?.healthyCount ?? 0})
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 text-xs font-semibold text-gray-800 dark:text-gray-200 focus:outline-none focus:border-blue-500 shadow-2xs"
            />
          </div>
        </div>

        {/* Live Alerts & Risk Table */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-2xs">
          {filteredUsers.length === 0 ? (
            <div className="p-16 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500 flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-sm text-gray-900 dark:text-white">
                {riskFilter === 'ALL'
                  ? 'No activity logs found for this date.'
                  : `No users matched the "${riskFilter}" criteria.`}
              </h3>
              <p className="text-xs text-gray-400 max-w-sm mx-auto mt-1">
                All clocked-in employees are working within normal activity ranges.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-800 text-gray-400 font-semibold uppercase tracking-wider text-[11px] bg-gray-50/60 dark:bg-gray-950/40">
                    <th className="py-3 px-5">Employee</th>
                    <th className="py-3 px-4">Risk Severity</th>
                    <th className="py-3 px-4">Detected Behavioral Triggers</th>
                    <th className="py-3 px-4">Score</th>
                    <th className="py-3 px-4">Worked / Idle Ratio</th>
                    <th className="py-3 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-150 dark:divide-gray-800">
                  {filteredUsers.map((u) => {
                    const badgeClass =
                      u.riskLevel === 'CRITICAL'
                        ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border-rose-300'
                        : u.riskLevel === 'WARNING'
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-amber-300'
                        : u.riskLevel === 'ADVISORY'
                        ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border-purple-300'
                        : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300'

                    return (
                      <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-850/40 transition-colors">
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-2.5">
                            <span className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[11px]">
                              {u.avatar}
                            </span>
                            <div>
                              <span className="font-bold text-gray-900 dark:text-white block">{u.name}</span>
                              <span className="text-[10px] text-gray-400">{u.email}</span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badgeClass}`}
                          >
                            <span>{u.riskLevel}</span>
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex flex-wrap gap-1.5">
                            {u.triggers.length === 0 ? (
                              <span className="text-gray-400 italic">None (Optimal Activity)</span>
                            ) : (
                              u.triggers.map((t, i) => (
                                <span
                                  key={i}
                                  className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                                >
                                  {t}
                                </span>
                              ))
                            )}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 font-mono">
                          <span
                            className={`font-black text-xs ${
                              u.performanceScore >= 80
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : u.performanceScore >= 60
                                ? 'text-blue-600 dark:text-blue-400'
                                : u.performanceScore >= 40
                                ? 'text-amber-500'
                                : 'text-rose-500'
                            }`}
                          >
                            {u.performanceScore}%
                          </span>
                        </td>

                        <td className="py-3.5 px-4 font-mono text-[11px]">
                          <div>
                            <span className="font-bold text-gray-900 dark:text-white">{u.workedHours}</span>
                            <span className="text-gray-400 ml-1.5">worked</span>
                          </div>
                          <div className="text-[10px] text-rose-500">
                            {u.idleTime} idle ({u.idlePercent}%)
                          </div>
                        </td>

                        <td className="py-3.5 px-5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/admin/timeline`}
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:underline"
                            >
                              <span>Timeline</span>
                              <ExternalLink className="w-3 h-3" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
