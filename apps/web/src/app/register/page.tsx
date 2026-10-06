'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  Building2,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  Shield,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
} from 'lucide-react'

export default function RegisterPage() {
  const [companyName, setCompanyName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [plan, setPlan] = useState<'BASIC' | 'PRO' | 'ENTERPRISE'>('PRO')
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName,
          email,
          phone,
          password,
          plan,
        }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        setErrorMessage(data.error || 'Failed to create company account.')
        setLoading(false)
        return
      }

      setSuccess(true)
      setTimeout(() => {
        window.location.href = data.redirectTo || '/admin/dashboard'
      }, 1000)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred.'
      setErrorMessage(message)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center bg-slate-950 px-4 sm:px-6 py-12 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top back button */}
      <div className="absolute top-6 left-6 z-20">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-gray-400 hover:text-white transition-colors bg-slate-900/60 hover:bg-slate-800/80 px-3.5 py-2 rounded-xl border border-slate-800"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </Link>
      </div>

      <div className="w-full max-w-lg space-y-7 relative z-10">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 shadow-lg shadow-blue-500/25 mx-auto mb-2">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Register Your Company
          </h1>
          <p className="text-xs sm:text-sm text-gray-400">
            Start your 14-day free trial &bull; No credit card required &bull; Instant workspace setup
          </p>
        </div>

        {/* Card */}
        <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-black/60">
          {success ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <h3 className="text-xl font-bold text-white">Welcome, {companyName}!</h3>
              <p className="text-sm text-gray-300">
                Your company workspace is active. Logging you into the admin dashboard...
              </p>
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mt-4" />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-start gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-red-500 mt-1 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Plan Choice Selector */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-2">
                  Select Trial Plan
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPlan('BASIC')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all text-center ${
                      plan === 'BASIC'
                        ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300 shadow-xs'
                        : 'bg-slate-800/60 border-slate-700/60 text-gray-400 hover:text-white'
                    }`}
                  >
                    Starter
                  </button>
                  <button
                    type="button"
                    onClick={() => setPlan('PRO')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all text-center relative ${
                      plan === 'PRO'
                        ? 'bg-blue-500/20 border-blue-500/60 text-blue-300 shadow-xs'
                        : 'bg-slate-800/60 border-slate-700/60 text-gray-400 hover:text-white'
                    }`}
                  >
                    <span className="absolute -top-2 right-2 text-[9px] bg-blue-600 text-white px-1.5 py-0.2 rounded-full">
                      POPULAR
                    </span>
                    Business (Pro)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPlan('ENTERPRISE')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all text-center ${
                      plan === 'ENTERPRISE'
                        ? 'bg-purple-500/20 border-purple-500/60 text-purple-300 shadow-xs'
                        : 'bg-slate-800/60 border-slate-700/60 text-gray-400 hover:text-white'
                    }`}
                  >
                    Enterprise
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  Company Name <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-500">
                    <Building2 className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Acme Innovations Ltd."
                    className="block w-full rounded-xl bg-slate-900/80 border border-slate-700/80 py-2.5 pl-10 pr-3 text-sm text-white placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  Company / Work Email <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-500">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="owner@company.com"
                    className="block w-full rounded-xl bg-slate-900/80 border border-slate-700/80 py-2.5 pl-10 pr-3 text-sm text-white placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  Phone Number
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-500">
                    <Phone className="h-4 w-4" />
                  </div>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +880 1712-345678"
                    className="block w-full rounded-xl bg-slate-900/80 border border-slate-700/80 py-2.5 pl-10 pr-3 text-sm text-white placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  Password <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-500">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="block w-full rounded-xl bg-slate-900/80 border border-slate-700/80 py-2.5 pl-10 pr-10 text-sm text-white placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-gray-400 hover:text-gray-200"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-60 shadow-lg shadow-blue-600/25 hover:shadow-blue-600/35 transition-all cursor-pointer mt-2"
              >
                {loading ? (
                  <span>Registering Workspace...</span>
                ) : (
                  <>
                    <span>Create Company Account &amp; Start Trial</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <span className="text-xs text-gray-400">
                  Already have an account?{' '}
                  <Link href="/login" className="text-blue-400 hover:underline font-semibold">
                    Sign In
                  </Link>
                </span>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-500">
          Secured by Smart Employee Tracker Identity &bull; 256-Bit SSL Encryption
        </p>
      </div>
    </div>
  )
}
