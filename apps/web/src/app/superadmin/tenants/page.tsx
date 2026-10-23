'use client'

import React, { useState, useEffect } from 'react'
import {
  Building2,
  Search,
  Plus,
  Crown,
  Edit2,
  Trash2,
  RefreshCw,
  ExternalLink,
  Shield,
  Check,
  X,
  Clock,
  HardDrive,
  Users,
  Filter
} from 'lucide-react'

interface Tenant {
  id: string
  name: string
  slug: string
  plan: 'BASIC' | 'PRO' | 'ENTERPRISE'
  status: 'ACTIVE' | 'TRIAL' | 'SUSPENDED' | 'CANCELLED'
  max_seats: number
  max_teams: number
  storage_quota_mb: number
  screenshot_interval_sec: number
  retention_days: number
  current_users_count?: number
  created_at: string
}

export default function SuperAdminTenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedPlan, setSelectedPlan] = useState('ALL')
  const [selectedStatus, setSelectedStatus] = useState('ALL')

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // Form states
  const [formName, setFormName] = useState('')
  const [formSlug, setFormSlug] = useState('')
  const [formPlan, setFormPlan] = useState<'BASIC' | 'PRO' | 'ENTERPRISE'>('PRO')
  const [formStatus, setFormStatus] = useState<'ACTIVE' | 'TRIAL' | 'SUSPENDED'>('ACTIVE')
  const [formSeats, setFormSeats] = useState('25')
  const [formTeams, setFormTeams] = useState('5')

  const fetchTenants = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (selectedPlan !== 'ALL') params.set('plan', selectedPlan)
      if (selectedStatus !== 'ALL') params.set('status', selectedStatus)
      if (search.trim()) params.set('search', search.trim())

      const res = await fetch(`/api/superadmin/tenants?${params.toString()}`)
      const json = await res.json()
      if (json.success) {
        setTenants(json.tenants)
      }
    } catch (err) {
      console.error('Failed to load tenants:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTenants()
  }, [selectedPlan, selectedStatus])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    fetchTenants()
  }

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formName || !formSlug) return

    try {
      setIsSaving(true)
      const res = await fetch('/api/superadmin/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName,
          slug: formSlug,
          plan: formPlan,
          status: formStatus,
          max_seats: Number(formSeats),
          max_teams: Number(formTeams),
        }),
      })
      const json = await res.json()
      if (json.success) {
        setIsCreateOpen(false)
        setFormName('')
        setFormSlug('')
        fetchTenants()
      } else {
        alert(json.error || 'Failed to create organization')
      }
    } catch (err) {
      console.error(err)
      alert('Error creating organization')
    } finally {
      setIsSaving(false)
    }
  }

  const handleUpdateTenant = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingTenant) return

    try {
      setIsSaving(true)
      const res = await fetch('/api/superadmin/tenants', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingTenant.id,
          name: editingTenant.name,
          plan: editingTenant.plan,
          status: editingTenant.status,
          max_seats: editingTenant.max_seats,
          max_teams: editingTenant.max_teams,
          storage_quota_mb: editingTenant.storage_quota_mb,
          screenshot_interval_sec: editingTenant.screenshot_interval_sec,
          retention_days: editingTenant.retention_days,
        }),
      })
      const json = await res.json()
      if (json.success) {
        setEditingTenant(null)
        fetchTenants()
      } else {
        alert(json.error || 'Failed to update organization')
      }
    } catch (err) {
      console.error(err)
      alert('Error updating organization')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteTenant = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete organization "${name}"? This action is irreversible.`)) {
      return
    }

    try {
      const res = await fetch(`/api/superadmin/tenants?id=${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (json.success) {
        fetchTenants()
      } else {
        alert(json.error || 'Failed to delete tenant')
      }
    } catch (err) {
      console.error(err)
      alert('Error deleting tenant')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Building2 className="w-6 h-6 text-blue-500" />
            <span>All Organizations (Tenants)</span>
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Manage multi-tenant workspaces, subscription tiers, seat quotas, and plan configurations.
          </p>
        </div>

        <button
          onClick={() => {
            setFormName('')
            setFormSlug('')
            setFormPlan('PRO')
            setFormStatus('ACTIVE')
            setFormSeats('25')
            setFormTeams('5')
            setIsCreateOpen(true)
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Create Organization</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="flex-1 relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by organization name or slug..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-gray-950 border border-gray-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
        </form>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <Filter className="w-3.5 h-3.5" />
            <span>Plan:</span>
            <select
              value={selectedPlan}
              onChange={(e) => setSelectedPlan(e.target.value)}
              className="bg-gray-950 border border-gray-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">All Plans</option>
              <option value="BASIC">BASIC</option>
              <option value="PRO">PRO</option>
              <option value="ENTERPRISE">ENTERPRISE</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <span>Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-gray-950 border border-gray-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="TRIAL">TRIAL</option>
              <option value="SUSPENDED">SUSPENDED</option>
            </select>
          </div>

          <button
            onClick={fetchTenants}
            className="p-2 text-gray-400 hover:text-white bg-gray-950 border border-gray-800 rounded-lg hover:border-gray-700 transition-colors"
            title="Refresh list"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Tenants Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-800 text-gray-400 font-semibold uppercase tracking-wider text-[11px] bg-gray-950/40">
                <th className="py-3.5 px-6">Organization</th>
                <th className="py-3.5 px-4">Plan</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Seats & Teams</th>
                <th className="py-3.5 px-4">Screenshots</th>
                <th className="py-3.5 px-4">Storage & Retention</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-500">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto text-blue-500 mb-2" />
                    <span>Loading organizations...</span>
                  </td>
                </tr>
              ) : tenants.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">
                    No organizations match the selected criteria.
                  </td>
                </tr>
              ) : (
                tenants.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-850/40 transition-colors">
                    {/* Name */}
                    <td className="py-4 px-6">
                      <div className="font-bold text-white text-sm">{t.name}</div>
                      <div className="text-[11px] font-mono text-gray-500 flex items-center gap-1.5 mt-0.5">
                        <span>slug: {t.slug}</span>
                      </div>
                    </td>

                    {/* Plan */}
                    <td className="py-4 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                          t.plan === 'PRO'
                            ? 'bg-blue-950 text-blue-300 border border-blue-800'
                            : t.plan === 'ENTERPRISE'
                            ? 'bg-purple-950 text-purple-300 border border-purple-800'
                            : 'bg-gray-800 text-gray-400 border border-gray-700'
                        }`}
                      >
                        {t.plan === 'PRO' && <Crown className="w-3 h-3 text-amber-300 fill-amber-300" />}
                        {t.plan}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-4 px-4">
                      <span
                        className={`px-2.5 py-1 rounded-md text-[10px] font-bold ${
                          t.status === 'ACTIVE'
                            ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/50'
                            : t.status === 'TRIAL'
                            ? 'bg-amber-950/60 text-amber-400 border border-amber-800/50'
                            : 'bg-red-950/60 text-red-400 border border-red-800/50'
                        }`}
                      >
                        {t.status}
                      </span>
                    </td>

                    {/* Seats & Teams */}
                    <td className="py-4 px-4 text-gray-300">
                      <div className="flex items-center gap-1.5 font-medium">
                        <Users className="w-3.5 h-3.5 text-gray-500" />
                        <span>{t.current_users_count || 0} / {t.max_seats} seats</span>
                      </div>
                      <div className="text-[11px] text-gray-500 mt-0.5">
                        Max {t.max_teams} teams
                      </div>
                    </td>

                    {/* Screenshots */}
                    <td className="py-4 px-4 text-gray-300">
                      <div className="flex items-center gap-1.5 font-medium">
                        <Clock className="w-3.5 h-3.5 text-gray-500" />
                        <span>Every {t.screenshot_interval_sec >= 60 ? `${t.screenshot_interval_sec / 60}m` : `${t.screenshot_interval_sec}s`}</span>
                      </div>
                      <div className="text-[11px] text-gray-500 mt-0.5">
                        {t.plan === 'BASIC' ? 'Single delete only' : '✨ Bulk delete enabled'}
                      </div>
                    </td>

                    {/* Storage & Retention */}
                    <td className="py-4 px-4 text-gray-300">
                      <div className="flex items-center gap-1.5 font-medium">
                        <HardDrive className="w-3.5 h-3.5 text-gray-500" />
                        <span>{(t.storage_quota_mb / 1000).toFixed(0)} GB quota</span>
                      </div>
                      <div className="text-[11px] text-gray-500 mt-0.5">
                        {t.retention_days} days retention
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-6 text-right space-x-2">
                      <button
                        onClick={() => setEditingTenant({ ...t })}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
                        title="Edit organization"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleDeleteTenant(t.id, t.name)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-950/30 transition-colors"
                        title="Delete organization"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Tenant Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-gray-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-500" />
                <span>Create New Organization</span>
              </h3>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="text-gray-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTenant} className="space-y-4 text-xs">
              <div>
                <label className="block text-gray-400 font-semibold mb-1">Company / Organization Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Global Labs"
                  value={formName}
                  onChange={(e) => {
                    setFormName(e.target.value)
                    if (!formSlug) {
                      setFormSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-'))
                    }
                  }}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3.5 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-gray-400 font-semibold mb-1">Tenant Slug (Identifier)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. apex-global"
                  value={formSlug}
                  onChange={(e) => setFormSlug(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3.5 py-2.5 text-white font-mono placeholder-gray-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 font-semibold mb-1">Initial Plan</label>
                  <select
                    value={formPlan}
                    onChange={(e) => setFormPlan(e.target.value as any)}
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="BASIC">BASIC (Free Forever)</option>
                    <option value="PRO">PRO ($4.99/user/mo)</option>
                    <option value="ENTERPRISE">ENTERPRISE (Custom)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-400 font-semibold mb-1">Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="TRIAL">TRIAL (14 Days)</option>
                    <option value="SUSPENDED">SUSPENDED</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 font-semibold mb-1">Max Seats</label>
                  <input
                    type="number"
                    min="1"
                    value={formSeats}
                    onChange={(e) => setFormSeats(e.target.value)}
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 font-semibold mb-1">Max Teams</label>
                  <input
                    type="number"
                    min="1"
                    value={formTeams}
                    onChange={(e) => setFormTeams(e.target.value)}
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 rounded-xl text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 rounded-xl font-bold bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50"
                >
                  {isSaving ? 'Creating...' : 'Create Organization'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Tenant Modal */}
      {editingTenant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-gray-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-blue-500" />
                <span>Configure {editingTenant.name}</span>
              </h3>
              <button
                onClick={() => setEditingTenant(null)}
                className="text-gray-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateTenant} className="space-y-4 text-xs">
              <div>
                <label className="block text-gray-400 font-semibold mb-1">Company Name</label>
                <input
                  type="text"
                  required
                  value={editingTenant.name}
                  onChange={(e) => setEditingTenant({ ...editingTenant, name: e.target.value })}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 font-semibold mb-1">Subscription Plan</label>
                  <select
                    value={editingTenant.plan}
                    onChange={(e) => {
                      const newPlan = e.target.value as any
                      const updates: Partial<Tenant> = { plan: newPlan }
                      if (newPlan === 'BASIC') {
                        updates.screenshot_interval_sec = 600
                        updates.retention_days = 14
                        updates.storage_quota_mb = 10000
                      } else if (newPlan === 'PRO') {
                        updates.screenshot_interval_sec = 60
                        updates.retention_days = 365
                        updates.storage_quota_mb = 500000
                      }
                      setEditingTenant({ ...editingTenant, ...updates })
                    }}
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500 font-bold"
                  >
                    <option value="BASIC">BASIC (Free Forever)</option>
                    <option value="PRO">PRO ($4.99/mo - Bulk Delete Enabled)</option>
                    <option value="ENTERPRISE">ENTERPRISE (Custom)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-400 font-semibold mb-1">Status</label>
                  <select
                    value={editingTenant.status}
                    onChange={(e) => setEditingTenant({ ...editingTenant, status: e.target.value as any })}
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="TRIAL">TRIAL</option>
                    <option value="SUSPENDED">SUSPENDED</option>
                    <option value="CANCELLED">CANCELLED</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-gray-400 font-semibold mb-1">Max Seats</label>
                  <input
                    type="number"
                    value={editingTenant.max_seats}
                    onChange={(e) => setEditingTenant({ ...editingTenant, max_seats: Number(e.target.value) })}
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 font-semibold mb-1">Screenshot (s)</label>
                  <input
                    type="number"
                    value={editingTenant.screenshot_interval_sec}
                    onChange={(e) => setEditingTenant({ ...editingTenant, screenshot_interval_sec: Number(e.target.value) })}
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 font-semibold mb-1">Retention (Days)</label>
                  <input
                    type="number"
                    value={editingTenant.retention_days}
                    onChange={(e) => setEditingTenant({ ...editingTenant, retention_days: Number(e.target.value) })}
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div className="p-3 bg-blue-950/30 border border-blue-900/40 rounded-xl text-blue-300 text-[11px]">
                {editingTenant.plan === 'PRO' ? (
                  <p>👑 <strong>PRO Plan features:</strong> Multiple bulk screenshot delete enabled, 1-minute screenshot intervals, 1-year data retention, and unlimited storage.</p>
                ) : editingTenant.plan === 'BASIC' ? (
                  <p>⚠️ <strong>BASIC Plan features:</strong> Single screenshot delete only (bulk delete restricted), 10-minute screenshot intervals, 14 days retention.</p>
                ) : (
                  <p>💼 <strong>ENTERPRISE Plan features:</strong> Custom SLAs, dedicated cloud, unlimited retention, bulk deletion enabled.</p>
                )}
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setEditingTenant(null)}
                  className="px-4 py-2 rounded-xl text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 rounded-xl font-bold bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
