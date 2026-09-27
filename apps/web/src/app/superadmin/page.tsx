'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  DollarSign,
  Building2,
  Users,
  Activity,
  ArrowUpRight,
  Shield,
  Layers,
  HardDrive,
  RefreshCw,
  Plus,
  Crown,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'

interface StatsData {
  mrr: number
  arr: number
  totalTenants: number
  activeTenants: number
  trialTenants: number
  totalUsers: number
  totalSeats: number
  totalScreenshots: number
  storageUsedMb: number
  planDistribution: {
    BASIC: number
    PRO: number
    ENTERPRISE: number
  }
  statusDistribution: {
    ACTIVE: number
    TRIAL: number
    SUSPENDED: number
    CANCELLED: number
  }
  recentTenants: Array<{
    id: string
    name: string
    slug: string
    plan: string
    status: string
    max_seats: number
    created_at: string
  }>
}

export default function SuperAdminOverviewPage() {
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchStats = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/superadmin/stats')
      const json = await res.json()
      if (json.success) {
        setStats(json.stats)
      }
    } catch (err) {
      console.error('Failed to load superadmin stats:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Banner / Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>SaaS Platform Overview</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
              Live Production
            </span>
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Global telemetry, revenue metrics, and tenant distribution for Smart Employee Tracker.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchStats}
            disabled={loading}
            className="p-2 rounded-xl bg-gray-800 text-gray-300 hover:text-white hover:bg-gray-750 transition-colors border border-gray-700/60 disabled:opacity-50"
            title="Refresh metrics"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <Link
            href="/superadmin/tenants"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Organization</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Metric 1: MRR */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 shadow-sm hover:border-gray-700 transition-all relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">
                Monthly Recurring (MRR)
              </p>
              <h3 className="text-3xl font-extrabold text-white mt-2">
                ${stats ? stats.mrr.toLocaleString() : '---'}
              </h3>
            </div>
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs">
            <span className="flex items-center text-emerald-400 font-semibold">
              <ArrowUpRight className="w-3.5 h-3.5 mr-1" />
              +18.4% MoM
            </span>
            <span className="text-gray-500 font-mono">
              ARR: ${stats ? (stats.arr).toLocaleString() : '---'}
            </span>
          </div>
        </div>

        {/* Metric 2: Active Tenants */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 shadow-sm hover:border-gray-700 transition-all relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">
                Total Organizations
              </p>
              <h3 className="text-3xl font-extrabold text-white mt-2">
                {stats ? stats.totalTenants : '---'}
              </h3>
            </div>
            <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs">
            <span className="text-gray-400 font-medium">
              <strong className="text-white">{stats ? stats.activeTenants : 0}</strong> Active
            </span>
            <span className="text-amber-400 font-medium">
              <strong className="text-amber-300">{stats ? stats.trialTenants : 0}</strong> Trial
            </span>
          </div>
        </div>

        {/* Metric 3: Monitored Users */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 shadow-sm hover:border-gray-700 transition-all relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">
                Monitored Employees
              </p>
              <h3 className="text-3xl font-extrabold text-white mt-2">
                {stats ? stats.totalUsers : '---'}
              </h3>
            </div>
            <div className="p-2.5 bg-purple-500/10 border border-purple-500/20 rounded-xl text-purple-400">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs">
            <span className="text-purple-400 font-medium flex items-center">
              <TrendingUp className="w-3.5 h-3.5 mr-1" />
              Seats Quota: {stats ? stats.totalSeats : 0}
            </span>
          </div>
        </div>

        {/* Metric 4: Cloud Storage & Screenshots */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 shadow-sm hover:border-gray-700 transition-all relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">
                Screenshots & Media
              </p>
              <h3 className="text-3xl font-extrabold text-white mt-2">
                {stats ? stats.totalScreenshots.toLocaleString() : '---'}
              </h3>
            </div>
            <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
              <HardDrive className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs text-gray-400">
            <span>Storage Used:</span>
            <span className="font-mono text-gray-200">
              {stats ? (stats.storageUsedMb / 1024).toFixed(2) : '0.00'} GB
            </span>
          </div>
        </div>
      </div>

      {/* Plan Distribution & Smart Employee Tracker Packages Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tier Distribution Card */}
        <div className="lg:col-span-1 bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-5">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-400" />
              <span>Subscription Tier Mix</span>
            </h3>
            <p className="text-xs text-gray-400 mt-1">
              Active tenants distributed across Smart Employee Tracker packages.
            </p>
          </div>

          <div className="space-y-4">
            {/* PRO */}
            <div className="p-3.5 rounded-xl bg-blue-950/20 border border-blue-900/40">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Crown className="w-4 h-4 text-blue-400" />
                  <span className="text-xs font-bold text-white">PRO ($4.99/user/mo)</span>
                </div>
                <span className="text-xs font-bold text-blue-400 font-mono">
                  {stats?.planDistribution.PRO || 0} Tenants
                </span>
              </div>
              <div className="w-full bg-gray-800 h-1.5 rounded-full mt-2 overflow-hidden">
                <div
                  className="bg-blue-500 h-full rounded-full"
                  style={{
                    width: `${
                      stats && stats.totalTenants > 0
                        ? ((stats.planDistribution.PRO || 0) / stats.totalTenants) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>

            {/* BASIC */}
            <div className="p-3.5 rounded-xl bg-gray-800/40 border border-gray-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-300">BASIC (Free Forever)</span>
                <span className="text-xs font-bold text-gray-400 font-mono">
                  {stats?.planDistribution.BASIC || 0} Tenants
                </span>
              </div>
              <div className="w-full bg-gray-800 h-1.5 rounded-full mt-2 overflow-hidden">
                <div
                  className="bg-gray-500 h-full rounded-full"
                  style={{
                    width: `${
                      stats && stats.totalTenants > 0
                        ? ((stats.planDistribution.BASIC || 0) / stats.totalTenants) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>

            {/* ENTERPRISE */}
            <div className="p-3.5 rounded-xl bg-purple-950/20 border border-purple-900/40">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-300">ENTERPRISE (Custom)</span>
                <span className="text-xs font-bold text-purple-400 font-mono">
                  {stats?.planDistribution.ENTERPRISE || 0} Tenants
                </span>
              </div>
              <div className="w-full bg-gray-800 h-1.5 rounded-full mt-2 overflow-hidden">
                <div
                  className="bg-purple-500 h-full rounded-full"
                  style={{
                    width: `${
                      stats && stats.totalTenants > 0
                        ? ((stats.planDistribution.ENTERPRISE || 0) / stats.totalTenants) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-gray-800">
            <Link
              href="/superadmin/packages"
              className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center justify-between group"
            >
              <span>Review Package Specs</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>

        {/* Recent Tenants Table */}
        <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-400" />
                <span>Recent Organizations</span>
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Latest tenants created and current subscription state.
              </p>
            </div>
            <Link
              href="/superadmin/tenants"
              className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-800 text-gray-400 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="pb-3">Organization</th>
                  <th className="pb-3">Plan</th>
                  <th className="pb-3">Seats</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {stats?.recentTenants.map((tenant) => (
                  <tr key={tenant.id} className="hover:bg-gray-850/40 transition-colors">
                    <td className="py-3 font-semibold text-white">
                      <div>{tenant.name}</div>
                      <div className="text-[10px] font-mono text-gray-500">{tenant.slug}</div>
                    </td>
                    <td className="py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          tenant.plan === 'PRO'
                            ? 'bg-blue-950 text-blue-300 border border-blue-800'
                            : tenant.plan === 'ENTERPRISE'
                            ? 'bg-purple-950 text-purple-300 border border-purple-800'
                            : 'bg-gray-800 text-gray-400 border border-gray-700'
                        }`}
                      >
                        {tenant.plan === 'PRO' && <Crown className="w-2.5 h-2.5" />}
                        {tenant.plan}
                      </span>
                    </td>
                    <td className="py-3 font-mono text-gray-300">
                      {tenant.max_seats} seats
                    </td>
                    <td className="py-3">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          tenant.status === 'ACTIVE'
                            ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/50'
                            : tenant.status === 'TRIAL'
                            ? 'bg-amber-950/60 text-amber-400 border border-amber-800/50'
                            : 'bg-red-950/60 text-red-400 border border-red-800/50'
                        }`}
                      >
                        {tenant.status}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <Link
                        href={`/superadmin/tenants?search=${encodeURIComponent(tenant.slug)}`}
                        className="text-xs text-blue-400 hover:text-blue-300 font-semibold"
                      >
                        Manage
                      </Link>
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
