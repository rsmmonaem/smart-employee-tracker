'use client'

import React, { useState } from 'react'
import {
  X,
  Shield,
  Zap,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Save,
  RefreshCw,
  Eye,
  EyeOff,
  Globe
} from 'lucide-react'

export interface GatewayItem {
  id?: string
  name: string
  portal?: string
  url?: string
  status: string
  mode: string
  currency?: string
  primary?: boolean
  credentials?: Record<string, string>
}

interface GatewayConfigModalProps {
  gateway: GatewayItem | null
  onClose: () => void
  onSaved: () => void
}

export default function GatewayConfigModal({
  gateway,
  onClose,
  onSaved,
}: GatewayConfigModalProps) {
  if (!gateway) return null

  return (
    <GatewayConfigModalContent
      gateway={gateway}
      onClose={onClose}
      onSaved={onSaved}
    />
  )
}

function GatewayConfigModalContent({
  gateway,
  onClose,
  onSaved,
}: {
  gateway: GatewayItem
  onClose: () => void
  onSaved: () => void
}) {
  const gatewayId = (gateway.id || (gateway.name === 'BKASH' ? 'bkash' : gateway.name.includes('eps') ? 'eps' : 'stripe')) as 'bkash' | 'eps' | 'stripe'

  const [mode, setMode] = useState<string>(gateway.mode || 'Live')
  const [status, setStatus] = useState<string>(gateway.status || 'CONNECTED')
  const [showSecrets, setShowSecrets] = useState(false)
  const [credentials, setCredentials] = useState<Record<string, string>>({
    appKey: gateway.credentials?.appKey || 'bk_live_app_9a8f21908b',
    appSecret: gateway.credentials?.appSecret || 'sk_live_sec_88921a8b9',
    username: gateway.credentials?.username || 'workfolio_mfs',
    password: gateway.credentials?.password || '••••••••••••••••',
    merchantShortCode: gateway.credentials?.merchantShortCode || '01713000000',
    merchantId: gateway.credentials?.merchantId || 'EPS_M_WORKFOLIO_9921',
    storeId: gateway.credentials?.storeId || 'WF_CLOUD_STORE_01',
    apiKey: gateway.credentials?.apiKey || 'eps_live_sec_8192a8b9c10',
    webhookSecret: gateway.credentials?.webhookSecret || 'whsec_8912891289128',
    publishableKey: gateway.credentials?.publishableKey || 'pk_live_51M081WFCLOUD9281a',
    secretKey: gateway.credentials?.secretKey || 'sk_live_51M081WFCLOUDsec8912',
    ...(gateway.credentials || {}),
  })

  const [isTesting, setIsTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; latencyMs?: number } | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const handleTestConnection = async () => {
    try {
      setIsTesting(true)
      setTestResult(null)
      const res = await fetch('/api/superadmin/gateways', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test_connection', gatewayId }),
      })
      const json = await res.json()
      if (json.success) {
        setTestResult(json)
      } else {
        setTestResult({ success: false, message: json.error || 'Connection failed' })
      }
    } catch {
      setTestResult({ success: false, message: 'Network or gateway error while testing handshake' })
    } finally {
      setIsTesting(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setIsSaving(true)
      const res = await fetch('/api/superadmin/gateways', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gatewayId,
          updates: {
            mode,
            status,
            credentials,
          },
        }),
      })
      const json = await res.json()
      if (json.success) {
        onSaved()
        onClose()
      } else {
        alert(json.error || 'Failed to save gateway')
      }
    } catch (err) {
      console.error(err)
      alert('Error updating gateway')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-gray-800 flex items-center justify-between bg-gray-950/60">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
              gatewayId === 'bkash'
                ? 'bg-pink-950 text-pink-300 border border-pink-800'
                : gatewayId === 'eps'
                ? 'bg-indigo-950 text-indigo-300 border border-indigo-800'
                : 'bg-blue-950 text-blue-300 border border-blue-800'
            }`}>
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Configure {gateway.name}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-gray-800 text-gray-400">
                  {gatewayId}
                </span>
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">{gateway.portal}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSave} className="p-6 space-y-5 overflow-y-auto flex-1 text-xs">
          {/* External portal banner */}
          {gateway.url && (
            <div className="p-3 bg-gray-950 rounded-xl border border-gray-800 flex items-center justify-between">
              <span className="text-gray-400">Official Merchant Portal:</span>
              <a
                href={gateway.url}
                target="_blank"
                rel="noreferrer"
                className="text-blue-400 hover:text-blue-300 font-mono font-semibold flex items-center gap-1"
              >
                <span>{gateway.url}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}

          {/* Mode & Status Controls */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-400 font-semibold mb-1">Environment Mode</label>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value)}
                className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500 font-medium"
              >
                <option value="Live">Live (Production)</option>
                <option value="Sandbox">Sandbox / Test</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-400 font-semibold mb-1">Integration Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500 font-medium"
              >
                <option value="CONNECTED">CONNECTED (Active)</option>
                <option value="DISCONNECTED">DISCONNECTED (Disabled)</option>
              </select>
            </div>
          </div>

          {/* Gateway-specific Credential Fields */}
          <div className="space-y-3.5 pt-2 border-t border-gray-800/80">
            <div className="flex items-center justify-between">
              <span className="text-gray-300 font-bold uppercase tracking-wider text-[11px]">
                API Keys & Merchant Credentials
              </span>
              <button
                type="button"
                onClick={() => setShowSecrets(!showSecrets)}
                className="text-gray-400 hover:text-white flex items-center gap-1 text-[11px]"
              >
                {showSecrets ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{showSecrets ? 'Hide Values' : 'Reveal Values'}</span>
              </button>
            </div>

            {/* BKASH Fields */}
            {gatewayId === 'bkash' && (
              <>
                <div>
                  <label className="block text-gray-400 mb-1">bKash App Key</label>
                  <input
                    type="text"
                    value={credentials.appKey || ''}
                    onChange={(e) => setCredentials({ ...credentials, appKey: e.target.value })}
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 mb-1">bKash App Secret</label>
                  <input
                    type={showSecrets ? 'text' : 'password'}
                    value={credentials.appSecret || ''}
                    onChange={(e) => setCredentials({ ...credentials, appSecret: e.target.value })}
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-gray-400 mb-1">bKash Username</label>
                    <input
                      type="text"
                      value={credentials.username || ''}
                      onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                      className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 mb-1">bKash Merchant Wallet</label>
                    <input
                      type="text"
                      placeholder="017XXXXXXXX"
                      value={credentials.merchantShortCode || ''}
                      onChange={(e) => setCredentials({ ...credentials, merchantShortCode: e.target.value })}
                      className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-white font-mono"
                    />
                  </div>
                </div>
              </>
            )}

            {/* EPS Fields (merchant.eps.com.bd) */}
            {gatewayId === 'eps' && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-gray-400 mb-1">EPS Merchant ID</label>
                    <input
                      type="text"
                      placeholder="EPS_M_XXXX"
                      value={credentials.merchantId || ''}
                      onChange={(e) => setCredentials({ ...credentials, merchantId: e.target.value })}
                      className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 mb-1">Store ID</label>
                    <input
                      type="text"
                      placeholder="STORE_01"
                      value={credentials.storeId || ''}
                      onChange={(e) => setCredentials({ ...credentials, storeId: e.target.value })}
                      className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-white font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-gray-400 mb-1">EPS Secret API Key</label>
                  <input
                    type={showSecrets ? 'text' : 'password'}
                    value={credentials.apiKey || ''}
                    onChange={(e) => setCredentials({ ...credentials, apiKey: e.target.value })}
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 mb-1">Webhook Signing Secret</label>
                  <input
                    type={showSecrets ? 'text' : 'password'}
                    value={credentials.webhookSecret || ''}
                    onChange={(e) => setCredentials({ ...credentials, webhookSecret: e.target.value })}
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
              </>
            )}

            {/* Stripe Fields */}
            {gatewayId === 'stripe' && (
              <>
                <div>
                  <label className="block text-gray-400 mb-1">Publishable Key</label>
                  <input
                    type="text"
                    value={credentials.publishableKey || ''}
                    onChange={(e) => setCredentials({ ...credentials, publishableKey: e.target.value })}
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 mb-1">Secret Key</label>
                  <input
                    type={showSecrets ? 'text' : 'password'}
                    value={credentials.secretKey || ''}
                    onChange={(e) => setCredentials({ ...credentials, secretKey: e.target.value })}
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
              </>
            )}
          </div>

          {/* Webhook & Callback URLs Display */}
          <div className="p-3.5 bg-gray-950 rounded-xl border border-gray-800/80 space-y-2">
            <div className="flex items-center justify-between text-gray-400 font-semibold">
              <span className="flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-blue-400" />
                <span>Webhook & IPN Callback URL (Copy to Merchant Console):</span>
              </span>
            </div>
            <div className="p-2 bg-gray-900 rounded-lg border border-gray-800 font-mono text-[11px] text-emerald-400 break-all select-all flex items-center justify-between">
              <span>
                {gatewayId === 'bkash'
                  ? 'http://localhost:3000/api/billing/bkash/callback'
                  : gatewayId === 'eps'
                  ? 'http://localhost:3000/api/billing/eps/callback'
                  : 'http://localhost:3000/api/billing/stripe/webhook'}
              </span>
            </div>
            <p className="text-[10px] text-gray-500">
              Register this URL in your {gateway.name} merchant portal to receive automated transaction settlement notifications.
            </p>
          </div>

          {/* Test connection result banner */}
          {testResult && (
            <div
              className={`p-3.5 rounded-xl border flex items-start gap-2.5 ${
                testResult.success
                  ? 'bg-emerald-950/40 border-emerald-800/50 text-emerald-300'
                  : 'bg-red-950/40 border-red-800/50 text-red-300'
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              )}
              <div className="space-y-0.5">
                <p className="font-semibold">{testResult.message}</p>
                {testResult.latencyMs && (
                  <p className="text-[10px] text-gray-400 font-mono">
                    API Response latency: {testResult.latencyMs}ms
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-4 border-t border-gray-800 flex items-center justify-between">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={isTesting}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-gray-800 hover:bg-gray-750 text-gray-200 border border-gray-700/60 disabled:opacity-50"
            >
              {isTesting ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Zap className="w-3.5 h-3.5 text-amber-400" />
              )}
              <span>{isTesting ? 'Testing Handshake...' : 'Test Connection'}</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 rounded-xl text-gray-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50"
              >
                {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                <span>Save Credentials</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
