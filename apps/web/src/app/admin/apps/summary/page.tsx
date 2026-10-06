'use client'

import React, { useState, useEffect } from 'react'
import { AppWindow, RefreshCw, BarChart2 } from 'lucide-react'
import { useAdminFilter } from '../../admin-filter-context'
import AdminHeader from '../../admin-header'

interface TopAppItem {
  name: string
  type: 'APP' | 'DOMAIN'
  totalSeconds: number
  count: number
  classification: string
}

function formatDuration(totalSeconds: number): string {
  if (!totalSeconds || totalSeconds <= 0) return '0h 00m'
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  return `${hours}h ${minutes.toString().padStart(2, '0')}m`
}

export default function AppsSummaryPage() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    productivePercent: 0,
    neutralPercent: 0,
    unproductivePercent: 0,
    totalTrackedHours: '0h 00m',
    productiveHours: '0h 00m',
    neutralHours: '0h 00m',
    unproductiveHours: '0h 00m',
  })

  const [topApps, setTopApps] = useState<
    Array<{
      name: string
      hours: string
      percent: number
      category: string
    }>
  >([])

  const loadData = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/apps/review', { cache: 'no-store' })
      const data = await res.json()

      if (data.success) {
        const topUsed: TopAppItem[] = (data.topUsed || []).filter(
          (a: TopAppItem) => a.totalSeconds > 0 || a.count > 0
        )

        let totalSec = 0
        let prodSec = 0
        let neutralSec = 0
        let unprodSec = 0

        topUsed.forEach((item) => {
          totalSec += item.totalSeconds
          if (item.classification === 'PRODUCTIVE') {
            prodSec += item.totalSeconds
          } else if (item.classification === 'UNPRODUCTIVE') {
            unprodSec += item.totalSeconds
          } else {
            neutralSec += item.totalSeconds
          }
        })

        const totalForPct = totalSec || 1
        const prodPct = totalSec > 0 ? Math.round((prodSec / totalForPct) * 100) : 0
        const neutralPct = totalSec > 0 ? Math.round((neutralSec / totalForPct) * 100) : 0
        const unprodPct = totalSec > 0 ? Math.max(0, 100 - prodPct - neutralPct) : 0

        setStats({
          productivePercent: prodPct,
          neutralPercent: neutralPct,
          unproductivePercent: unprodPct,
          totalTrackedHours: formatDuration(totalSec),
          productiveHours: formatDuration(prodSec),
          neutralHours: formatDuration(neutralSec),
          unproductiveHours: formatDuration(unprodSec),
        })

        const mappedTopApps = topUsed.slice(0, 15).map((item) => ({
          name: item.name,
          hours: formatDuration(item.totalSeconds),
          percent: totalSec > 0 ? Math.round((item.totalSeconds / totalSec) * 100) : 0,
          category: item.classification || 'NEUTRAL',
        }))

        setTopApps(mappedTopApps)
      }
    } catch (e) {
      console.error('Failed to load apps summary:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  return (
    <div className="min-h-full bg-white dark:bg-gray-900 pb-16">
      <AdminHeader
        title="Apps & Productivity Summary"
        subtitle="Aggregated organizational efficiency metrics based on your active review rules"
        searchPlaceholder="Search in apps summary"
        loading={loading}
        onRefresh={loadData}
      />
      <div className="p-8 max-w-7xl mx-auto space-y-6">
        {/* 3 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="bg-white dark:bg-gray-900 border border-emerald-100 dark:border-emerald-900/40 rounded-xl p-5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                Productive Time
              </span>
              <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 font-bold text-xs">
                {stats.productivePercent}%
              </span>
            </div>
            <p className="text-3xl font-bold text-emerald-600 mt-2">{stats.productiveHours}</p>
            <div className="w-full bg-emerald-100 dark:bg-emerald-950/50 rounded-full h-1.5 mt-3">
              <div
                className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${stats.productivePercent}%` }}
              />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 border border-blue-100 dark:border-blue-900/40 rounded-xl p-5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wider">
                Neutral Time
              </span>
              <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600 font-bold text-xs">
                {stats.neutralPercent}%
              </span>
            </div>
            <p className="text-3xl font-bold text-blue-600 mt-2">{stats.neutralHours}</p>
            <div className="w-full bg-blue-100 dark:bg-blue-950/50 rounded-full h-1.5 mt-3">
              <div
                className="bg-blue-500 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${stats.neutralPercent}%` }}
              />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 border border-rose-100 dark:border-rose-900/40 rounded-xl p-5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-rose-700 dark:text-rose-400 uppercase tracking-wider">
                Unproductive Time
              </span>
              <span className="p-1.5 rounded-lg bg-rose-50 text-rose-600 font-bold text-xs">
                {stats.unproductivePercent}%
              </span>
            </div>
            <p className="text-3xl font-bold text-rose-600 mt-2">{stats.unproductiveHours}</p>
            <div className="w-full bg-rose-100 dark:bg-rose-950/50 rounded-full h-1.5 mt-3">
              <div
                className="bg-rose-500 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${stats.unproductivePercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Top Application Ranking Table */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 rounded-xl shadow-2xs overflow-hidden">
          <div className="p-5 border-b border-gray-150 dark:border-gray-800 flex items-center justify-between">
            <h3 className="text-xs font-bold text-gray-800 dark:text-white uppercase tracking-wider">
              Primary Software Stack &amp; Usage Share
            </h3>
            <span className="text-xs text-gray-400">Total: {stats.totalTrackedHours}</span>
          </div>

          {topApps.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-3">
                <BarChart2 className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-sm text-gray-900 dark:text-white">
                No Application Activity Recorded Yet
              </h4>
              <p className="text-xs text-gray-400 max-w-sm mx-auto mt-1">
                Once employees run the desktop tracking client, active software applications and domains will be categorized here automatically.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {topApps.map((item) => (
                <div key={item.name} className="p-4 flex items-center justify-between hover:bg-gray-50/50">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center font-bold text-xs">
                      <AppWindow className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-gray-900 dark:text-white">{item.name}</span>
                      <div className="w-48 bg-gray-100 dark:bg-gray-800 rounded-full h-1.5 mt-1.5">
                        <div
                          className={`h-1.5 rounded-full ${
                            item.category === 'PRODUCTIVE'
                              ? 'bg-emerald-500'
                              : item.category === 'UNPRODUCTIVE'
                              ? 'bg-rose-500'
                              : 'bg-blue-500'
                          }`}
                          style={{ width: `${item.percent}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="text-xs font-mono font-bold text-gray-700 dark:text-gray-300">{item.hours}</span>
                    <span
                      className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full ${
                        item.category === 'PRODUCTIVE'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                          : item.category === 'UNPRODUCTIVE'
                          ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                          : 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
                      }`}
                    >
                      {item.category}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
