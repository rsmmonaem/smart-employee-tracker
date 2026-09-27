'use client'

import React, { useState, useEffect } from 'react'
import {
  Settings,
  Save,
  RefreshCw,
  Shield,
  Mail,
  Clock,
  HardDrive,
  AlertTriangle,
  CheckCircle2,
  Bell,
  Globe
} from 'lucide-react'

interface PlatformConfig {
  appName: string
  supportEmail: string
  defaultTrialDays: number
  requireCreditCardForTrial: boolean
  basicStorageLimitMb: number
  proStorageLimitMb: number
  basicScreenshotIntervalSec: number
  proScreenshotIntervalSec: number
  allowSelfRegistration: boolean
  maintenanceMode: boolean
  broadcastBanner: string
  stripeWebhookStatus: string
  defaultCurrency: string
}

export default function SuperAdminSettingsPage() {
  const [config, setConfig] = useState<PlatformConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savedSuccess, setSavedSuccess] = useState(false)

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/superadmin/settings')
      const json = await res.json()
      if (json.success) {
        setConfig(json.settings)
      }
    } catch (err) {
      console.error('Failed to load settings:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!config) return

    try {
      setSaving(true)
      const res = await fetch('/api/superadmin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: config }),
      })
      const json = await res.json()
      if (json.success) {
        setSavedSuccess(true)
        setTimeout(() => setSavedSuccess(false), 3000)
      } else {
        alert(json.error || 'Failed to save settings')
      }
    } catch (err) {
      console.error(err)
      alert('Error updating settings')
    } finally {
      setSaving(false)
    }
  }

  if (loading || !config) {
    return (
      <div className="py-24 text-center text-gray-500">
        <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-500 mb-2" />
        <span>Loading platform configurations...</span>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Settings className="w-6 h-6 text-blue-500" />
            <span>Platform Configuration</span>
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Global defaults, subscription limits, and system-wide controls for Smart Employee Tracker.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {savedSuccess && (
            <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" />
              Settings Saved!
            </span>
          )}

          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20 transition-all disabled:opacity-50"
          >
            {saving ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>Save Settings</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* General SaaS Settings */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Globe className="w-5 h-5 text-blue-400" />
            <span>General SaaS Settings</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-gray-400 font-semibold mb-1">Platform Brand Name</label>
              <input
                type="text"
                value={config.appName}
                onChange={(e) => setConfig({ ...config, appName: e.target.value })}
                className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-gray-400 font-semibold mb-1">Global Support Email</label>
              <input
                type="email"
                value={config.supportEmail}
                onChange={(e) => setConfig({ ...config, supportEmail: e.target.value })}
                className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Trial & Onboarding Defaults */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-400" />
            <span>Trial & Onboarding Policies</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-gray-400 font-semibold mb-1">Default Trial Length (Days)</label>
              <input
                type="number"
                value={config.defaultTrialDays}
                onChange={(e) => setConfig({ ...config, defaultTrialDays: Number(e.target.value) })}
                className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 bg-gray-950 rounded-xl border border-gray-800">
              <div>
                <span className="font-semibold text-white block">Credit Card Required for Trial</span>
                <span className="text-[11px] text-gray-500 block">Require billing card before starting 14-day trial</span>
              </div>
              <input
                type="checkbox"
                checked={config.requireCreditCardForTrial}
                onChange={(e) => setConfig({ ...config, requireCreditCardForTrial: e.target.checked })}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Package Default Quotas */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-amber-400" />
            <span>Tier Quotas & Screenshot Defaults</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-gray-950 rounded-xl border border-gray-800 space-y-3">
              <span className="font-bold text-gray-300 block text-sm">BASIC Tier Defaults</span>

              <div>
                <label className="block text-gray-500 text-[11px] font-medium mb-1">Storage Quota (MB)</label>
                <input
                  type="number"
                  value={config.basicStorageLimitMb}
                  onChange={(e) => setConfig({ ...config, basicStorageLimitMb: Number(e.target.value) })}
                  className="w-full bg-gray-900 border border-gray-800 rounded-lg px-3 py-1.5 text-white"
                />
              </div>

              <div>
                <label className="block text-gray-500 text-[11px] font-medium mb-1">Screenshot Interval (Seconds)</label>
                <input
                  type="number"
                  value={config.basicScreenshotIntervalSec}
                  onChange={(e) => setConfig({ ...config, basicScreenshotIntervalSec: Number(e.target.value) })}
                  className="w-full bg-gray-900 border border-gray-800 rounded-lg px-3 py-1.5 text-white"
                />
                <span className="text-[10px] text-gray-500">600s = 10 minutes</span>
              </div>
            </div>

            <div className="p-4 bg-gray-950 rounded-xl border border-gray-800 space-y-3">
              <span className="font-bold text-blue-400 block text-sm">PRO Tier Defaults</span>

              <div>
                <label className="block text-gray-500 text-[11px] font-medium mb-1">Storage Quota (MB)</label>
                <input
                  type="number"
                  value={config.proStorageLimitMb}
                  onChange={(e) => setConfig({ ...config, proStorageLimitMb: Number(e.target.value) })}
                  className="w-full bg-gray-900 border border-gray-800 rounded-lg px-3 py-1.5 text-white"
                />
              </div>

              <div>
                <label className="block text-gray-500 text-[11px] font-medium mb-1">Screenshot Interval (Seconds)</label>
                <input
                  type="number"
                  value={config.proScreenshotIntervalSec}
                  onChange={(e) => setConfig({ ...config, proScreenshotIntervalSec: Number(e.target.value) })}
                  className="w-full bg-gray-900 border border-gray-800 rounded-lg px-3 py-1.5 text-white"
                />
                <span className="text-[10px] text-gray-500">60s = 1 minute</span>
              </div>
            </div>
          </div>
        </div>

        {/* System Broadcast & Maintenance */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Bell className="w-5 h-5 text-purple-400" />
            <span>Platform Announcements & Maintenance</span>
          </h3>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block text-gray-400 font-semibold mb-1">
                Global Notification Banner (shown to all tenant admins)
              </label>
              <input
                type="text"
                placeholder="e.g. Scheduled platform maintenance on Sunday at 02:00 UTC."
                value={config.broadcastBanner}
                onChange={(e) => setConfig({ ...config, broadcastBanner: e.target.value })}
                className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3.5 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-red-950/20 border border-red-900/40 rounded-xl">
              <div>
                <span className="font-bold text-red-300 block text-sm">Platform Maintenance Mode</span>
                <span className="text-[11px] text-gray-400 block mt-0.5">
                  Temporarily pause tenant client tracking sync and restrict access to SuperAdmin only.
                </span>
              </div>
              <input
                type="checkbox"
                checked={config.maintenanceMode}
                onChange={(e) => setConfig({ ...config, maintenanceMode: e.target.checked })}
                className="w-5 h-5 rounded text-red-600 focus:ring-red-500 cursor-pointer"
              />
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
