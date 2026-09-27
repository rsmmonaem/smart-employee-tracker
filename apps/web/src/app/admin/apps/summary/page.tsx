'use client'

import React, { useState, useEffect } from 'react'
import { AppWindow, RefreshCw } from 'lucide-react'
import { useAdminFilter } from '../../admin-filter-context'
import AdminHeader from '../../admin-header'

interface ReviewedItem {
  classification: string
}

export default function AppsSummaryPage() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    productivePercent: 78,
    neutralPercent: 14,
    unproductivePercent: 8,
    totalTrackedHours: '38h 20m',
    productiveHours: '29h 55m',
    neutralHours: '5h 22m',
    unproductiveHours: '3h 03m',
  })

  const topApps = [
    { name: 'Antigravity IDE', hours: '14h 30m', percent: 38, category: 'PRODUCTIVE' },
    { name: 'Google Chrome', hours: '8h 15m', percent: 21, category: 'NEUTRAL' },
    { name: 'Visual Studio Code', hours: '6h 40m', percent: 17, category: 'PRODUCTIVE' },
    { name: 'Slack', hours: '4h 10m', percent: 11, category: 'PRODUCTIVE' },
    { name: 'YouTube', hours: '2h 15m', percent: 6, category: 'UNPRODUCTIVE' },
    { name: 'Figma', hours: '2h 30m', percent: 7, category: 'PRODUCTIVE' },
  ]

  useEffect(() => {
    // Fetch review data to aggregate real statistics
    fetch('/api/admin/apps/review')
      .then((r) => r.json())
      .then((data) => {
        if (data.reviewed) {
          const prodCount = data.reviewed.filter((a: ReviewedItem) => a.classification === 'PRODUCTIVE').length
          const unprodCount = data.reviewed.filter((a: ReviewedItem) => a.classification === 'UNPRODUCTIVE').length
          const neutralCount = data.reviewed.filter((a: ReviewedItem) => a.classification === 'NEUTRAL').length
          const total = prodCount + unprodCount + neutralCount || 1

          setStats((prev) => ({
            ...prev,
            productivePercent: Math.round((prodCount / total) * 100),
            neutralPercent: Math.round((neutralCount / total) * 100),
            unproductivePercent: Math.max(0, 100 - Math.round((prodCount / total) * 100) - Math.round((neutralCount / total) * 100)),
          }))
        }
      })
      .catch((e) => console.error(e))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-full bg-white dark:bg-gray-900 pb-16">
      <AdminHeader
        title="Apps & Productivity Summary"
        subtitle="Aggregated organizational efficiency metrics based on your active review rules"
        searchPlaceholder="Search in apps summary"
        loading={loading}
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
              className="bg-emerald-500 h-1.5 rounded-full"
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
              className="bg-blue-500 h-1.5 rounded-full"
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
              className="bg-rose-500 h-1.5 rounded-full"
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
      </div>
    </div>
  </div>
  )
}
