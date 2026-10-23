'use client'

import React, { useState, useEffect } from 'react'
import {
  Building2,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Shield,
  CreditCard,
  Zap,
  X,
} from 'lucide-react'
import { createClient } from '@/utils/supabase/client'

interface LandingSignupModalProps {
  isOpen: boolean
  onClose: () => void
  initialPlan?: string
  planName?: string
  initialBillingCycle?: 'monthly' | 'annual'
  initialCurrency?: 'BDT' | 'USD'
}

export default function LandingSignupModal({
  isOpen,
  onClose,
  initialPlan = 'BASIC',
  planName = 'BASIC',
  initialBillingCycle = 'annual',
  initialCurrency = 'BDT',
}: LandingSignupModalProps) {
  const isBasic = initialPlan.toUpperCase() === 'BASIC'
  const isEnterprise = initialPlan.toUpperCase() === 'ENTERPRISE'
  const isPro = initialPlan.toUpperCase() === 'PRO' || (!isBasic && !isEnterprise)

  const [companyName, setCompanyName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // Paid plan options
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>(initialBillingCycle)
  const [currency, setCurrency] = useState<'BDT' | 'USD'>(initialCurrency)
  const [gateway, setGateway] = useState<'bkash' | 'eps' | 'stripe'>('bkash')
  const [seats, setSeats] = useState<number | string>(1)

  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [success, setSuccess] = useState(false)
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null)

  useEffect(() => {
    if (initialBillingCycle) setBillingCycle(initialBillingCycle)
    if (initialCurrency) setCurrency(initialCurrency)
  }, [initialBillingCycle, initialCurrency, isOpen])

  if (!isOpen) return null

  // Pricing calculation based on seats / users count
  const getPrice = () => {
    if (isBasic) {
      return {
        unitRate: 0,
        monthly: 0,
        total: 0,
        text: 'Free Forever',
        unitText: '0 ৳ / user',
      }
    }

    const currentSeats = Math.max(1, Number(seats) || 1)

    if (isPro) {
      if (currency === 'BDT') {
        const unitMonthly = billingCycle === 'annual' ? 470 : 590
        const total = billingCycle === 'annual' ? unitMonthly * 12 * currentSeats : unitMonthly * currentSeats
        return {
          unitRate: unitMonthly,
          monthly: unitMonthly * currentSeats,
          total,
          text: `${total.toLocaleString()} ৳`,
          unitText: `${unitMonthly.toLocaleString()} ৳/user/mo`,
        }
      } else {
        const unitMonthly = billingCycle === 'annual' ? 3.99 : 4.99
        const total = billingCycle === 'annual' ? Math.round(unitMonthly * 12 * currentSeats * 100) / 100 : Math.round(unitMonthly * currentSeats * 100) / 100
        return {
          unitRate: unitMonthly,
          monthly: unitMonthly * currentSeats,
          total,
          text: `$${total.toFixed(2)}`,
          unitText: `$${unitMonthly}/user/mo`,
        }
      }
    }

    // Enterprise
    if (currency === 'BDT') {
      const unitMonthly = billingCycle === 'annual' ? 1880 : 2350
      const total = billingCycle === 'annual' ? unitMonthly * 12 * currentSeats : unitMonthly * currentSeats
      return {
        unitRate: unitMonthly,
        monthly: unitMonthly * currentSeats,
        total,
        text: `${total.toLocaleString()} ৳`,
        unitText: `${unitMonthly.toLocaleString()} ৳/user/mo`,
      }
    } else {
      const unitMonthly = billingCycle === 'annual' ? 15.99 : 19.99
      const total = billingCycle === 'annual' ? Math.round(unitMonthly * 12 * currentSeats * 100) / 100 : Math.round(unitMonthly * currentSeats * 100) / 100
      return {
        unitRate: unitMonthly,
        monthly: unitMonthly * currentSeats,
        total,
        text: `$${total.toFixed(2)}`,
        unitText: `$${unitMonthly}/user/mo`,
      }
    }
  }

  const priceInfo = getPrice()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    setLoading(true)

    try {
      const currentSeats = Math.max(1, Number(seats) || 1)
      const payload: Record<string, unknown> = {
        companyName,
        email,
        phone,
        password,
        plan: initialPlan.toUpperCase(),
      }

      if (!isBasic) {
        payload.gateway = gateway
        payload.billingCycle = billingCycle
        payload.currency = currency
        payload.seats = currentSeats
        payload.paymentDetails = { phone }
      }

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        setErrorMsg(data.error || 'Failed to create workspace. Please check your information.')
        setLoading(false)
        return
      }

      // Client-side authentication sync to guarantee immediate cookies & localStorage session
      try {
        const supabase = createClient()
        await supabase.auth.signInWithPassword({
          email,
          password,
        })
      } catch (authClientErr) {
        console.warn('Client auth sync note:', authClientErr)
      }

      const dest = data.paymentUrl || data.redirectTo || '/admin/dashboard'
      setRedirectUrl(dest)
      setSuccess(true)
      setTimeout(() => {
        window.location.href = dest
      }, 1200)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred.'
      setErrorMsg(message)
      setLoading(false)
    }
  }

  return (
    <div
      className="quote-modal-overlay active"
      style={{ zIndex: 99999, padding: '16px', overflowY: 'auto' }}
      onClick={onClose}
    >
      <div
        className="quote-modal-card"
        style={{
          maxWidth: isBasic ? '500px' : '560px',
          width: '100%',
          background: '#0B1E3D',
          border: '1px solid rgba(59, 130, 246, 0.35)',
          boxShadow: '0 30px 70px -15px rgba(0, 0, 0, 0.85), 0 0 40px rgba(37, 99, 235, 0.25)',
          borderRadius: '24px',
          padding: '28px 24px',
          position: 'relative',
          margin: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="quote-modal-close"
          onClick={onClose}
          aria-label="Close"
          style={{ position: 'absolute', top: '18px', right: '18px', cursor: 'pointer' }}
        >
          <X className="w-5 h-5 text-gray-400 hover:text-white" />
        </button>

        {success ? (
          <div className="text-center py-8 space-y-4">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto ${
              isBasic
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                : 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
            }`}>
              {isBasic ? <CheckCircle2 className="w-9 h-9" /> : <Zap className="w-9 h-9" />}
            </div>
            <h3 className="text-2xl font-bold text-white">
              {isBasic ? 'Welcome to Tracmatrix!' : 'Redirecting to Payment...'}
            </h3>
            <p className="text-sm text-gray-300 max-w-sm mx-auto">
              {isBasic ? (
                <>Your free workspace for <strong>{companyName}</strong> is active. Launching your admin dashboard...</>
              ) : (
                <>Taking you to <strong>{gateway.toUpperCase()} Payment Gateway</strong> (bKash / Nagad / Cards) to complete payment for <strong>{companyName}</strong>...</>
              )}
            </p>
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mt-4" />
          </div>
        ) : (
          <>
            {/* Modal Header */}
            <div className="text-center mb-5">
              <div
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2 ${
                  isBasic
                    ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
                    : 'bg-blue-500/15 border border-blue-400/30 text-blue-400'
                }`}
              >
                {isBasic ? <Sparkles className="w-3.5 h-3.5" /> : <Zap className="w-3.5 h-3.5" />}
                <span>{isBasic ? 'Free Forever • BASIC Plan' : `Direct Purchase • ${planName} Plan`}</span>
              </div>

              <h3 className="text-2xl font-black text-white tracking-tight">
                {isBasic ? 'Start Your Free Workspace' : `Get Started with ${planName}`}
              </h3>
              <p className="text-xs text-gray-400 mt-1 max-w-md mx-auto">
                {isBasic
                  ? 'Free forever. 10 users, 2 teams, and 500 MB storage included. No payment needed.'
                  : 'Fast checkout via bKash, Nagad, Rocket, NexusPay or Card. Instant upgrade on payment.'}
              </p>
            </div>

            {/* Paid Plan Pricing & Gateway Selector */}
            {!isBasic && (
              <div className="mb-5 p-3.5 rounded-2xl bg-slate-900/90 border border-blue-500/25 space-y-3">
                {/* Billing Cycle & Currency Switchers */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-1.5">
                    <span className="text-gray-400 font-semibold">Billing:</span>
                    <button
                      type="button"
                      onClick={() => setBillingCycle('annual')}
                      className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                        billingCycle === 'annual'
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-slate-800 text-gray-400 hover:text-white'
                      }`}
                    >
                      Annual (Save 20%)
                    </button>
                    <button
                      type="button"
                      onClick={() => setBillingCycle('monthly')}
                      className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                        billingCycle === 'monthly'
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-slate-800 text-gray-400 hover:text-white'
                      }`}
                    >
                      Monthly
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-gray-400 font-semibold">Currency:</span>
                    <button
                      type="button"
                      onClick={() => setCurrency('BDT')}
                      className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                        currency === 'BDT'
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-slate-800 text-gray-400 hover:text-white'
                      }`}
                    >
                      BDT (৳)
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrency('USD')}
                      className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                        currency === 'USD'
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-slate-800 text-gray-400 hover:text-white'
                      }`}
                    >
                      USD ($)
                    </button>
                  </div>
                </div>

                {/* User / Seat Quantity Selector */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div>
                    <label className="block text-xs font-bold text-gray-200">
                      Employees / Users to Track:
                    </label>
                    <span className="text-[11px] text-gray-400">
                      {priceInfo.unitText} • Auto counts 1 if empty
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setSeats((prev) => Math.max(1, (parseInt(String(prev), 10) || 1) - 1))}
                      className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm flex items-center justify-center transition-colors border border-slate-700 disabled:opacity-30"
                      disabled={Number(seats) <= 1}
                      aria-label="Decrease users"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min={1}
                      max={1000}
                      value={seats}
                      onChange={(e) => setSeats(e.target.value)}
                      onBlur={() => setSeats((prev) => Math.max(1, parseInt(String(prev), 10) || 1))}
                      placeholder="1"
                      className="w-14 text-center py-1 bg-slate-950 border border-slate-700 rounded-lg text-white font-black text-sm focus:outline-none focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setSeats((prev) => (parseInt(String(prev), 10) || 0) + 1)}
                      className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm flex items-center justify-center transition-colors border border-slate-700"
                      aria-label="Increase users"
                    >
                      +
                    </button>
                    <span className="text-xs text-gray-400 font-semibold pl-0.5">users</span>
                  </div>
                </div>

                {/* Price Summary Banner */}
                {(() => {
                  const displaySeats = Math.max(1, Number(seats) || 1)
                  return (
                    <div className="flex items-center justify-between px-2.5 py-2 rounded-xl bg-slate-950/70 border border-slate-800/80">
                      <div>
                        <span className="text-xs text-gray-400 block">Total Due Today:</span>
                        <div className="text-xl font-black text-emerald-400">
                          {priceInfo.text}{' '}
                          <span className="text-xs font-normal text-gray-400">
                            ({billingCycle === 'annual' ? `${priceInfo.unitText} × ${displaySeats} × 12 mo` : `${priceInfo.unitText} × ${displaySeats} user${displaySeats > 1 ? 's' : ''}`})
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[11px] text-blue-400 font-bold bg-blue-500/10 px-2.5 py-1 rounded-full border border-blue-500/20 inline-block">
                          {displaySeats} {displaySeats === 1 ? 'User' : 'Users'} Tracked
                        </span>
                      </div>
                    </div>
                  )
                })()}

                {/* Payment Gateway Radio Selection */}
                <div>
                  <label className="block text-[11px] font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                    Select Payment Method:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {/* bKash Option */}
                    <button
                      type="button"
                      onClick={() => setGateway('bkash')}
                      className={`p-2 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        gateway === 'bkash'
                          ? 'border-pink-500 bg-pink-950/30 ring-1 ring-pink-500'
                          : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-pink-400">bKash</span>
                        <span className={`w-2 h-2 rounded-full ${gateway === 'bkash' ? 'bg-pink-400' : 'bg-slate-700'}`} />
                      </div>
                      <span className="text-[10px] text-gray-400 mt-1">Instant MFS</span>
                    </button>

                    {/* EPS Gateway Option */}
                    <button
                      type="button"
                      onClick={() => setGateway('eps')}
                      className={`p-2 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        gateway === 'eps'
                          ? 'border-emerald-500 bg-emerald-950/30 ring-1 ring-emerald-500'
                          : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-emerald-400">EPS PGW</span>
                        <span className={`w-2 h-2 rounded-full ${gateway === 'eps' ? 'bg-emerald-400' : 'bg-slate-700'}`} />
                      </div>
                      <span className="text-[10px] text-gray-400 mt-1">Cards / Bank / MFS</span>
                    </button>

                    {/* Stripe Card Option */}
                    <button
                      type="button"
                      onClick={() => setGateway('stripe')}
                      className={`p-2 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        gateway === 'stripe'
                          ? 'border-indigo-500 bg-indigo-950/30 ring-1 ring-indigo-500'
                          : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-indigo-400">Stripe</span>
                        <span className={`w-2 h-2 rounded-full ${gateway === 'stripe' ? 'bg-indigo-400' : 'bg-slate-700'}`} />
                      </div>
                      <span className="text-[10px] text-gray-400 mt-1">Global Card</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs flex items-start gap-2">
                <span className="w-2 h-2 rounded-full bg-red-400 mt-1 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Signup & Direct Buy Form */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1">
                  Company Name <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Acme Corporation"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl pl-10 pr-3 py-2.5 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1">
                    Work Email <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      required
                      placeholder="owner@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl pl-10 pr-3 py-2.5 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1">
                    Phone / MFS Number {!isBasic && <span className="text-red-400">*</span>}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                      <Phone className="w-4 h-4" />
                    </div>
                    <input
                      type="tel"
                      required={!isBasic}
                      placeholder={isBasic ? 'Optional (+880)' : 'e.g. 01712345678'}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl pl-10 pr-3 py-2.5 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1">
                  Password <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    placeholder="Minimum 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full mt-3 py-3 px-4 rounded-xl text-sm font-bold text-white transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg disabled:opacity-60 ${
                  isBasic
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-600/30'
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-blue-600/30'
                }`}
              >
                {loading ? (
                  <span>{isBasic ? 'Setting Up Free Workspace...' : 'Processing Payment & Workspace...'}</span>
                ) : (
                  <>
                    <span>
                      {isBasic
                        ? 'Create Free Workspace & Sign In'
                        : `Buy ${planName} (${priceInfo.text}) & Sign In`}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-2 text-[11px] text-gray-400 mt-2">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                <span>
                  {isBasic
                    ? '100% Free Forever • No card required • Instant activation'
                    : 'Encrypted checkout • Instant auto-login • Cancel anytime'}
                </span>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
