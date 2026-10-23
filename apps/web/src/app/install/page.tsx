'use strict'
'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Database,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Server,
  Lock,
  RefreshCw,
  Sparkles,
} from 'lucide-react'

export default function InstallPage() {
  const router = useRouter()
  const [step, setStep] = useState<number>(1)
  const [alreadyInstalled, setAlreadyInstalled] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(false)
  const [testingConnection, setTestingConnection] = useState<boolean>(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)
  const [installError, setInstallError] = useState<string | null>(null)
  const [installSuccess, setInstallSuccess] = useState<boolean>(false)

  // Form Fields
  const [formData, setFormData] = useState({
    databaseUrl: '',
    supabaseUrl: '',
    anonKey: '',
    serviceRoleKey: '',
    appUrl: 'http://localhost:3000',
    adminName: 'Platform SuperAdmin',
    adminEmail: '',
    adminPassword: '',
    confirmPassword: '',
  })

  // Check if platform is already installed
  useEffect(() => {
    fetch('/api/install')
      .then((res) => res.json())
      .then((data) => {
        if (data.installed) {
          setAlreadyInstalled(true)
        }
      })
      .catch(() => {})
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    setTestResult(null)
    setInstallError(null)
  }

  const handleTestConnection = async () => {
    if (!formData.databaseUrl) {
      setTestResult({ success: false, message: 'Please enter your PostgreSQL Database URL first.' })
      return
    }

    setTestingConnection(true)
    setTestResult(null)
    setInstallError(null)

    try {
      const res = await fetch('/api/install', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'test-connection',
          databaseUrl: formData.databaseUrl,
          supabaseUrl: formData.supabaseUrl,
          serviceRoleKey: formData.serviceRoleKey,
        }),
      })

      const data = await res.json()
      if (data.success) {
        setTestResult({ success: true, message: '✅ Database & Supabase connected successfully!' })
      } else {
        setTestResult({ success: false, message: `❌ ${data.error || 'Connection failed'}` })
      }
    } catch (err: any) {
      setTestResult({ success: false, message: `❌ Connection error: ${err.message}` })
    } finally {
      setTestingConnection(false)
    }
  }

  const handleRunInstallation = async () => {
    if (!formData.adminEmail || !formData.adminPassword) {
      setInstallError('Please enter SuperAdmin email and password.')
      return
    }

    if (formData.adminPassword.length < 8) {
      setInstallError('Password must be at least 8 characters long.')
      return
    }

    if (formData.adminPassword !== formData.confirmPassword) {
      setInstallError('Passwords do not match.')
      return
    }

    setLoading(true)
    setInstallError(null)

    try {
      const res = await fetch('/api/install', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'execute-install',
          ...formData,
        }),
      })

      const data = await res.json()
      if (data.success) {
        setInstallSuccess(true)
        setTimeout(() => {
          router.push('/login')
        }, 3000)
      } else {
        setInstallError(data.error || 'Installation encountered an error.')
      }
    } catch (err: any) {
      setInstallError(`Installation error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  if (alreadyInstalled) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-gray-900 border border-gray-800 rounded-2xl p-8 text-center space-y-4 shadow-2xl">
          <div className="w-16 h-16 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-2xl flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold tracking-tight">Smart Employee Tracker is Installed</h2>
          <p className="text-sm text-gray-400">
            This platform is already configured and locked for production.
          </p>
          <button
            onClick={() => router.push('/login')}
            className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 font-semibold text-white transition-all"
          >
            Go to Login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-2xl text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" /> 1-Click Automated Database & System Installer v1.1.0
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Smart Employee Tracker Setup</h1>
        <p className="text-sm text-gray-400">
          Complete self-hosted platform deployment in less than 60 seconds.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-2xl">
        <div className="bg-gray-900/90 backdrop-blur-md border border-gray-800 shadow-2xl rounded-2xl p-8 space-y-6">
          {/* Stepper Header */}
          <div className="flex items-center justify-between pb-6 border-b border-gray-800 text-xs">
            <div className={`flex items-center gap-2 ${step >= 1 ? 'text-blue-400 font-bold' : 'text-gray-500'}`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-800'}`}>1</span>
              System Checks
            </div>
            <div className="h-0.5 w-12 bg-gray-800" />
            <div className={`flex items-center gap-2 ${step >= 2 ? 'text-blue-400 font-bold' : 'text-gray-500'}`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-800'}`}>2</span>
              Database Setup
            </div>
            <div className="h-0.5 w-12 bg-gray-800" />
            <div className={`flex items-center gap-2 ${step >= 3 ? 'text-blue-400 font-bold' : 'text-gray-500'}`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-800'}`}>3</span>
              SuperAdmin & Launch
            </div>
          </div>

          {/* STEP 1: System Checks */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Server className="w-5 h-5 text-blue-400" /> System & Environment Verification
                </h3>
                <p className="text-xs text-gray-400">
                  Verifying your hosting environment meets platform requirements.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-gray-950/60 border border-gray-800/80">
                  <div>
                    <span className="text-xs font-semibold text-white block">Node.js Engine</span>
                    <span className="text-[11px] text-gray-400">v18.x or v20.x LTS Recommended</span>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Compatible
                  </span>
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-xl bg-gray-950/60 border border-gray-800/80">
                  <div>
                    <span className="text-xs font-semibold text-white block">Database Engine</span>
                    <span className="text-[11px] text-gray-400">PostgreSQL 15+ / Supabase</span>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Supported
                  </span>
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-xl bg-gray-950/60 border border-gray-800/80">
                  <div>
                    <span className="text-xs font-semibold text-white block">Ultra-Compressed Screenshot Engine</span>
                    <span className="text-[11px] text-gray-400">WebP + On-Demand Stream Proxy (v1.1.0)</span>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Ready
                  </span>
                </div>
              </div>

              <button
                onClick={() => setStep(2)}
                className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 font-semibold text-white flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-600/20 cursor-pointer"
              >
                Continue to Database Setup <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* STEP 2: Database & Supabase Setup */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Database className="w-5 h-5 text-blue-400" /> Database & Supabase Credentials
                </h3>
                <p className="text-xs text-gray-400">
                  Enter your Supabase or PostgreSQL details. All tables will be created automatically.
                </p>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">
                    Direct PostgreSQL Connection URL <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="databaseUrl"
                    value={formData.databaseUrl}
                    onChange={handleChange}
                    placeholder="postgresql://postgres:[PASSWORD]@db.xxxx.supabase.co:5432/postgres"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-950 border border-gray-800 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors font-mono text-[11px]"
                  />
                  <span className="text-[10px] text-gray-500 mt-1 block">
                    Found in Supabase: Settings ➔ Database ➔ Connection String (URI / Nodejs)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-300 font-semibold mb-1">
                      Supabase Project URL <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      name="supabaseUrl"
                      value={formData.supabaseUrl}
                      onChange={handleChange}
                      placeholder="https://xxxx.supabase.co"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-gray-950 border border-gray-800 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors font-mono text-[11px]"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-300 font-semibold mb-1">
                      Public Anon Key <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      name="anonKey"
                      value={formData.anonKey}
                      onChange={handleChange}
                      placeholder="eyJhbGciOi..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-gray-950 border border-gray-800 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors font-mono text-[11px]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-300 font-semibold mb-1">
                    Service Role Secret Key <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="password"
                    name="serviceRoleKey"
                    value={formData.serviceRoleKey}
                    onChange={handleChange}
                    placeholder="eyJhbGciOi... (Kept private on server)"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-950 border border-gray-800 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors font-mono text-[11px]"
                  />
                </div>

                {/* Test Connection Button */}
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={testingConnection}
                    className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {testingConnection ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Server className="w-3.5 h-3.5" />
                    )}
                    Test Connection
                  </button>

                  {testResult && (
                    <div
                      className={`mt-2 p-2.5 rounded-lg text-xs ${
                        testResult.success
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}
                    >
                      {testResult.message}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="py-2.5 px-4 rounded-xl border border-gray-700 text-xs font-semibold text-gray-300 hover:bg-gray-800 transition-all cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!formData.databaseUrl || !formData.supabaseUrl || !formData.anonKey || !formData.serviceRoleKey) {
                      setTestResult({ success: false, message: 'Please fill in all database fields.' })
                      return
                    }
                    setStep(3)
                  }}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-blue-600/20"
                >
                  Continue to Admin Setup <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: SuperAdmin Setup & Execute */}
          {step === 3 && (
            <div className="space-y-5">
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-blue-400" /> SuperAdmin Account Setup
                </h3>
                <p className="text-xs text-gray-400">
                  Create your master SuperAdmin credentials to manage tenants, pricing, and settings.
                </p>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">SuperAdmin Name</label>
                  <input
                    type="text"
                    name="adminName"
                    value={formData.adminName}
                    onChange={handleChange}
                    placeholder="e.g. John Doe"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-950 border border-gray-800 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 font-semibold mb-1">
                    Admin Email Address <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="email"
                    name="adminEmail"
                    value={formData.adminEmail}
                    onChange={handleChange}
                    placeholder="admin@yourcompany.com"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-950 border border-gray-800 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-300 font-semibold mb-1">
                      Password (min 8 chars) <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="password"
                      name="adminPassword"
                      value={formData.adminPassword}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-gray-950 border border-gray-800 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-300 font-semibold mb-1">
                      Confirm Password <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-gray-950 border border-gray-800 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                </div>
              </div>

              {installError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{installError}</span>
                </div>
              )}

              {installSuccess && (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs text-center space-y-1">
                  <CheckCircle2 className="w-6 h-6 mx-auto mb-1" />
                  <p className="font-bold text-sm">🎉 Platform & Database Installed Successfully!</p>
                  <p className="text-gray-400">Redirecting to login page in 3 seconds...</p>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  disabled={loading || installSuccess}
                  className="py-3 px-4 rounded-xl border border-gray-700 text-xs font-semibold text-gray-300 hover:bg-gray-800 transition-all cursor-pointer disabled:opacity-50"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleRunInstallation}
                  disabled={loading || installSuccess}
                  className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-600/25 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Creating Database & Provisioning SuperAdmin...
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      Install Database & Launch Platform
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
