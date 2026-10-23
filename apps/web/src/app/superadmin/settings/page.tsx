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
  Globe,
  Send,
  Server,
  Zap,
  Play
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
  smtpHost?: string
  smtpPort?: number
  smtpUser?: string
}

export default function SuperAdminSettingsPage() {
  const [config, setConfig] = useState<PlatformConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savedSuccess, setSavedSuccess] = useState(false)

  // Test email state
  const [testEmail, setTestEmail] = useState('info@tracmatrix.com')
  const [testingEmail, setTestingEmail] = useState(false)
  const [testEmailResult, setTestEmailResult] = useState<string | null>(null)

  // Recurring check state
  const [runningRecurringCheck, setRunningRecurringCheck] = useState(false)
  const [recurringResult, setRecurringResult] = useState<string | null>(null)

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

  const handleSendTestEmail = async () => {
    try {
      setTestingEmail(true)
      setTestEmailResult(null)
      const res = await fetch('/api/superadmin/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmail }),
      })
      const json = await res.json()
      if (json.success) {
        setTestEmailResult(`Success: ${json.message}`)
      } else {
        setTestEmailResult(`Error: ${json.error}`)
      }
    } catch (err: unknown) {
      setTestEmailResult(`Failed to connect: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setTestingEmail(false)
    }
  }

  const handleRunRecurringCheck = async () => {
    try {
      setRunningRecurringCheck(true)
      setRecurringResult(null)
      const res = await fetch('/api/billing/recurring-check')
      const json = await res.json()
      if (json.success) {
        setRecurringResult(
          `Audit Finished: Processed ${json.summary.processed} tenants. Active: ${json.summary.active}, Suspensions/Auto-Cuts applied: ${json.summary.autoCutsApplied}, Warning emails: ${json.summary.warningsSent}.`
        )
      } else {
        setRecurringResult(`Error: ${json.error}`)
      }
    } catch (err: unknown) {
      setRecurringResult(`Failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setRunningRecurringCheck(false)
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
            <span>Platform Configuration &amp; Mail Services</span>
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Global defaults, SMTP mail gateway, recurring billing auto-cuts, and system-wide controls.
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

        {/* Mail Client & SMTP Configuration */}
        <div className="bg-gray-900 border border-blue-500/30 rounded-2xl p-6 space-y-4 shadow-xl shadow-blue-950/20">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-gray-800 pb-3">
            <div className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-cyan-400" />
              <h3 className="text-base font-bold text-white">Mail Client &amp; SMTP Configuration</h3>
            </div>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 font-semibold">
              Live Gateway: info@tracmatrix.com
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-gray-400 font-semibold mb-1">SMTP Server</label>
              <input
                type="text"
                value={config.smtpHost || 'tracmatrix.com'}
                onChange={(e) => setConfig({ ...config, smtpHost: e.target.value })}
                className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3.5 py-2 text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-gray-400 font-semibold mb-1">SMTP Port (SSL / STARTTLS)</label>
              <input
                type="number"
                value={config.smtpPort || 465}
                onChange={(e) => setConfig({ ...config, smtpPort: parseInt(e.target.value) || 465 })}
                className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3.5 py-2 text-white font-mono"
              />
              <span className="text-[10px] text-gray-500 mt-1 block">SSL: 465 | STARTTLS: 587 | Port 25</span>
            </div>
            <div>
              <label className="block text-gray-400 font-semibold mb-1">SMTP Account / Sender</label>
              <input
                type="text"
                value={config.smtpUser || 'info@tracmatrix.com'}
                onChange={(e) => setConfig({ ...config, smtpUser: e.target.value })}
                className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3.5 py-2 text-white font-mono"
              />
            </div>
          </div>

          {/* Reference Specs Matrix */}
          <div className="p-4 bg-gray-950 rounded-xl border border-gray-800 space-y-2">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
              Mail Client Protocols (POP3 / IMAP / SMTP / Sieve)
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-2.5 rounded-lg bg-gray-900 border border-gray-800/80">
                <div className="text-gray-400 font-semibold">POP3 Settings</div>
                <div className="text-white font-mono text-[11px] mt-0.5">tracmatrix.com</div>
                <div className="text-cyan-400 text-[10px] mt-0.5">Port 110 / 995 (SSL)</div>
              </div>
              <div className="p-2.5 rounded-lg bg-gray-900 border border-gray-800/80">
                <div className="text-gray-400 font-semibold">IMAP Settings</div>
                <div className="text-white font-mono text-[11px] mt-0.5">tracmatrix.com</div>
                <div className="text-cyan-400 text-[10px] mt-0.5">Port 143 / 993 (SSL)</div>
              </div>
              <div className="p-2.5 rounded-lg bg-gray-900 border border-gray-800/80">
                <div className="text-gray-400 font-semibold">SMTP Settings</div>
                <div className="text-white font-mono text-[11px] mt-0.5">tracmatrix.com</div>
                <div className="text-cyan-400 text-[10px] mt-0.5">Port 25 / 587 / 465</div>
              </div>
              <div className="p-2.5 rounded-lg bg-gray-900 border border-gray-800/80">
                <div className="text-gray-400 font-semibold">Sieve Filtering</div>
                <div className="text-white font-mono text-[11px] mt-0.5">tracmatrix.com</div>
                <div className="text-cyan-400 text-[10px] mt-0.5">Port 4190 (Filtering)</div>
              </div>
            </div>
          </div>

          {/* Test Email Form */}
          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <input
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="Recipient email for test..."
              className="flex-1 bg-gray-950 border border-gray-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500 font-mono"
            />
            <button
              type="button"
              onClick={handleSendTestEmail}
              disabled={testingEmail}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
            >
              {testingEmail ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              <span>Send Test Email</span>
            </button>
          </div>

          {testEmailResult && (
            <div
              className={`p-3 rounded-xl text-xs font-mono ${
                testEmailResult.startsWith('Success')
                  ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-800'
                  : 'bg-rose-950/40 text-rose-300 border border-rose-800'
              }`}
            >
              {testEmailResult}
            </div>
          )}
        </div>

        {/* Automated Recurring Invoicing & Auto-Cut Engine */}
        <div className="bg-gray-900 border border-amber-500/30 rounded-2xl p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-gray-800 pb-3">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />
              <h3 className="text-base font-bold text-white">Recurring Auto-Invoicing &amp; Service Cut Engine</h3>
            </div>
            <button
              type="button"
              onClick={handleRunRecurringCheck}
              disabled={runningRecurringCheck}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-gray-950 transition-colors shadow-sm disabled:opacity-50"
            >
              {runningRecurringCheck ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Play className="w-3.5 h-3.5 fill-current" />
              )}
              <span>Run Audit &amp; Auto-Cut Now</span>
            </button>
          </div>

          <p className="text-xs text-gray-400">
            Automatically scans active subscriptions and pending invoices. When a recurring invoice is unpaid, it delivers modern overdue warning notifications and executes automatic service cutoffs (suspension &amp; storage/screenshot limits downgrade) to protect infrastructure.
          </p>

          {recurringResult && (
            <div className="p-3.5 rounded-xl bg-gray-950 border border-amber-800/60 text-xs font-mono text-amber-300">
              {recurringResult}
            </div>
          )}
        </div>

        {/* Package Default Quotas */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-amber-400" />
            <span>Tier Quotas &amp; Screenshot Defaults</span>
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
            <span>Platform Announcements &amp; Maintenance</span>
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
