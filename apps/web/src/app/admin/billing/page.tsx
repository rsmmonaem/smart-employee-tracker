'use client'

import React, { useState, useEffect } from 'react'
import {
  CreditCard,
  Crown,
  CheckCircle2,
  Clock,
  HardDrive,
  Trash2,
  Calendar,
  Building,
  RefreshCw,
  Zap,
  ArrowRight,
  ShieldCheck,
  Download,
  Check,
  AlertCircle,
  HelpCircle,
  FileText,
  Users,
} from 'lucide-react'
import InvoiceReceiptModal, { InvoiceItem } from './invoice-receipt-modal'

interface TenantInfo {
  id: string
  name: string
  plan: 'BASIC' | 'PRO' | 'ENTERPRISE'
  status: string
  max_seats: number
  screenshot_interval_sec: number
  retention_days: number
  storage_quota_mb: number
}

export default function AdminBillingPage() {
  const [tenant, setTenant] = useState<TenantInfo | null>(null)
  const [invoices, setInvoices] = useState<InvoiceItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedReceipt, setSelectedReceipt] = useState<InvoiceItem | null>(null)

  // Checkout state
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual')
  const [currency, setCurrency] = useState<'BDT' | 'USD'>('BDT')
  const [selectedGateway, setSelectedGateway] = useState<'bkash' | 'eps' | 'stripe'>('bkash')
  const [employeeCount, setEmployeeCount] = useState(1)
  const [seats, setSeats] = useState(1)
  const [processing, setProcessing] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const loadData = async () => {
    try {
      setLoading(true)
      const [tenantRes, invRes, usersRes] = await Promise.all([
        fetch('/api/admin/tenant').catch(() => null),
        fetch('/api/billing/invoices').catch(() => null),
        fetch('/api/admin/users').catch(() => null),
      ])

      if (tenantRes && tenantRes.ok) {
        const tenantJson = await tenantRes.json()
        if (tenantJson.success && tenantJson.tenant) {
          setTenant(tenantJson.tenant)
        }
      } else {
        setTenant({
          id: 'default',
          name: 'My Organization',
          plan: 'BASIC',
          status: 'ACTIVE',
          max_seats: 10,
          screenshot_interval_sec: 600,
          retention_days: 2,
          storage_quota_mb: 500,
        })
      }

      if (usersRes && usersRes.ok) {
        const usersJson = await usersRes.json()
        const count = Array.isArray(usersJson.employees) && usersJson.employees.length > 0
          ? usersJson.employees.length
          : 1
        setEmployeeCount(count)
        setSeats(count)
      }

      if (invRes && invRes.ok) {
        const invJson = await invRes.json()
        if (invJson.success && invJson.invoices) {
          setInvoices(invJson.invoices)
        }
      }
    } catch (err) {
      console.error('Failed to load billing details:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const status = params.get('status')
      const payment = params.get('payment')
      if (status === 'success' || payment === 'success') {
        setFeedback({
          type: 'success',
          message: 'Payment received successfully! Your organization subscription is upgraded and active.',
        })
      } else if (status === 'failed' || status === 'cancelled') {
        setFeedback({
          type: 'error',
          message: 'Payment was not completed or was cancelled.',
        })
      }
    }
  }, [])

  // Currency specific pricing
  const isAnnual = billingCycle === 'annual'
  const isBDT = currency === 'BDT'

  // Pricing constants (matches pricing table)
  const proMonthly = isBDT ? 590 : 4.99
  const proAnnual = isBDT ? 470 : 3.99
  const activeProRate = isAnnual ? proAnnual : proMonthly
  const totalAmount = Math.round(seats * activeProRate * (isAnnual ? 12 : 1))

  const handleCheckout = async (targetPlan: 'PRO' | 'ENTERPRISE' = 'PRO') => {
    try {
      setProcessing(true)
      setFeedback(null)

      const payload = {
        gateway: selectedGateway,
        plan: targetPlan,
        billingCycle,
        currency,
        seats,
        tenantId: tenant?.id,
        returnUrl: 'https://app.tracmatrix.com/api/billing/eps/callback',
      }

      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (data.success) {
        if (data.paymentUrl) {
          setFeedback({
            type: 'success',
            message: `Order created! Redirecting to secure ${selectedGateway.toUpperCase()} Gateway to complete payment...`,
          })
          setTimeout(() => {
            window.location.href = data.paymentUrl
          }, 800)
          return
        }

        setFeedback({
          type: 'success',
          message: data.message || `Payment verified! Organization upgraded to ${targetPlan}.`,
        })
        if (data.invoice) {
          setInvoices((prev) => [data.invoice, ...prev])
          setSelectedReceipt(data.invoice)
        }
        await loadData()
      } else {
        setFeedback({
          type: 'error',
          message: data.error || 'Payment failed to process',
        })
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      setFeedback({ type: 'error', message: msg })
    } finally {
      setProcessing(false)
    }
  }

  const verifyPayment = async (trxId: string) => {
    try {
      setProcessing(true)
      const res = await fetch(`/api/billing/verify?trxId=${encodeURIComponent(trxId)}`)
      const data = await res.json()
      if (data.success && data.status === 'PAID') {
        setFeedback({
          type: 'success',
          message: 'Payment confirmed! Organization subscription is now ACTIVE.',
        })
        await loadData()
      } else {
        setFeedback({
          type: 'error',
          message: data.message || 'Payment has not been completed yet.',
        })
      }
    } catch {
      setFeedback({ type: 'error', message: 'Failed to verify payment status.' })
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-2.5">
            <CreditCard className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <span>Subscription & Billing</span>
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Manage your subscription plan, gateway payment methods (bKash, EPS, Stripe), and tax receipts.
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-xs animate-in fade-in duration-200 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
              : 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-xs font-bold hover:underline opacity-80"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Current Active Plan Overview */}
      <div className="bg-gradient-to-r from-blue-900/10 via-indigo-900/10 to-violet-900/10 border border-blue-200 dark:border-blue-900/40 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Active Organization Plan
              </span>
              <span
                className={`px-3 py-0.5 rounded-full text-xs font-bold ${
                  tenant?.plan === 'PRO'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : tenant?.plan === 'ENTERPRISE'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200'
                }`}
              >
                {tenant?.plan || 'BASIC'} PLAN
              </span>
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full">
                {tenant?.status || 'ACTIVE'}
              </span>
            </div>

            <h2 className="text-xl font-extrabold text-gray-900 dark:text-white">
              {tenant?.name || 'My Organization'}
            </h2>
            <p className="text-xs text-gray-600 dark:text-gray-300 max-w-xl">
              {tenant?.plan === 'PRO'
                ? 'Your organization is unlocked on Smart Employee Tracker PRO. You have unlimited bulk screenshot deletion, 1-minute screenshot frequency, and 1-year data history.'
                : 'Your organization is on the Basic (Free Forever) plan. Single screenshot deletion is permitted, but multiple bulk screenshot deletion requires a Smart Employee Tracker PRO subscription.'}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 border-t md:border-t-0 md:border-l border-gray-200 dark:border-gray-800 pt-4 md:pt-0 md:pl-6 text-xs">
            <div className="bg-white/80 dark:bg-gray-900/80 p-3 rounded-xl border border-gray-150 dark:border-gray-800">
              <span className="text-gray-400 text-[10px] uppercase font-bold block">Interval</span>
              <span className="font-extrabold text-gray-900 dark:text-white text-sm">
                {tenant?.screenshot_interval_sec ? `${tenant.screenshot_interval_sec / 60}m` : '10m'}
              </span>
              <span className="text-[10px] text-gray-500 block">Screenshots</span>
            </div>

            <div className="bg-white/80 dark:bg-gray-900/80 p-3 rounded-xl border border-gray-150 dark:border-gray-800">
              <span className="text-gray-400 text-[10px] uppercase font-bold block">Retention</span>
              <span className="font-extrabold text-gray-900 dark:text-white text-sm">
                {tenant?.retention_days || 14} Days
              </span>
              <span className="text-[10px] text-gray-500 block">Cloud storage</span>
            </div>

            <div className="bg-white/80 dark:bg-gray-900/80 p-3 rounded-xl border border-gray-150 dark:border-gray-800 col-span-2 sm:col-span-1">
              <span className="text-gray-400 text-[10px] uppercase font-bold block">Bulk Delete</span>
              <span
                className={`font-extrabold text-sm ${
                  tenant?.plan === 'PRO' || tenant?.plan === 'ENTERPRISE'
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-amber-500'
                }`}
              >
                {tenant?.plan === 'PRO' || tenant?.plan === 'ENTERPRISE' ? 'Unlocked' : 'Requires Pro'}
              </span>
              <span className="text-[10px] text-gray-500 block">Multiple select</span>
            </div>
          </div>
        </div>
      </div>

      {/* Plan Selection & Checkout Section */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 md:p-8 space-y-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-500" />
              <span>Upgrade or Renew Subscription</span>
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Select your currency, billing period, and preferred Bangladesh (bKash, EPS) or Global (Stripe) gateway.
            </p>
          </div>

          {/* Controls: Billing Cycle + Currency */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Monthly / Annual toggle */}
            <div className="flex items-center p-1 bg-gray-100 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setBillingCycle('monthly')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  billingCycle === 'monthly'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-gray-600 dark:text-gray-300'
                }`}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle('annual')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                  billingCycle === 'annual'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-gray-600 dark:text-gray-300'
                }`}
              >
                Annual
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  Save 20%
                </span>
              </button>
            </div>

            {/* Currency toggle: BDT vs USD */}
            <div className="flex items-center p-1 bg-gray-100 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  setCurrency('BDT')
                  setSelectedGateway('bkash')
                }}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  currency === 'BDT'
                    ? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900 shadow-xs'
                    : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                BDT (৳)
              </button>
              <button
                type="button"
                onClick={() => {
                  setCurrency('USD')
                  setSelectedGateway('stripe')
                }}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  currency === 'USD'
                    ? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900 shadow-xs'
                    : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                USD ($)
              </button>
            </div>
          </div>
        </div>

        {/* Pricing Plan Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
          {/* BASIC */}
          <div className="p-5 rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-850/40 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Entry Tier</span>
              <h4 className="text-base font-bold text-gray-900 dark:text-white mt-0.5">BASIC</h4>
              <div className="text-2xl font-extrabold text-gray-900 dark:text-white mt-2">
                {isBDT ? '0 ৳' : '$0'}
                <span className="text-xs font-normal text-gray-500 ml-1">/ forever</span>
              </div>
              <ul className="mt-4 space-y-2 text-xs text-gray-600 dark:text-gray-300">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-gray-400" />
                  <span>Screenshots every 10 mins</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-gray-400" />
                  <span>Last 2 days data retention (500 MB limit)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-gray-400" />
                  <span>Up to 10 users &amp; 2 teams</span>
                </li>
                <li className="flex items-center gap-2 text-rose-500 font-medium">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                  <span>Single screenshot delete only (Bulk locked)</span>
                </li>
              </ul>
            </div>

            <button
              disabled
              className="mt-6 w-full py-2 px-3 text-xs font-semibold rounded-xl bg-gray-200 dark:bg-gray-800 text-gray-500 cursor-not-allowed text-center"
            >
              Current Basic Plan
            </button>
          </div>

          {/* PRO */}
          <div className="p-5 rounded-2xl border-2 border-blue-600 bg-blue-50/20 dark:bg-blue-950/20 relative shadow-sm flex flex-col justify-between">
            <div className="absolute -top-3 right-4 bg-blue-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-xs">
              Most Popular
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                Professional Workplaces
              </span>
              <h4 className="text-base font-bold text-gray-900 dark:text-white mt-0.5">SMART TRACKER PRO</h4>
              <div className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-2">
                {isBDT ? `${activeProRate} ৳` : `$${activeProRate}`}
                <span className="text-xs font-normal text-gray-500 dark:text-gray-400 ml-1">
                  /user/mo {isAnnual && '(Annual)'}
                </span>
              </div>
              <ul className="mt-4 space-y-2 text-xs text-gray-700 dark:text-gray-200">
                <li className="flex items-center gap-2 font-bold text-blue-600 dark:text-blue-400">
                  <Check className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Multiple bulk screenshot deletion</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Screenshots every 1 minute</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Last 1 year data retention</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>500 GB cloud storage</span>
                </li>
              </ul>
            </div>

            <div className="mt-6 pt-3 border-t border-blue-200 dark:border-blue-900/40">
              <span className="text-[11px] font-semibold text-blue-700 dark:text-blue-300">
                Configured below for instant activation
              </span>
            </div>
          </div>

          {/* ENTERPRISE */}
          <div className="p-5 rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-850/40 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                Large Teams
              </span>
              <h4 className="text-base font-bold text-gray-900 dark:text-white mt-0.5">ENTERPRISE</h4>
              <div className="text-2xl font-extrabold text-gray-900 dark:text-white mt-2">
                {isBDT ? (isAnnual ? '1,880 ৳' : '2,350 ৳') : isAnnual ? '$15.99' : '$19.99'}
                <span className="text-xs font-normal text-gray-500 ml-1">/user/mo</span>
              </div>
              <ul className="mt-4 space-y-2 text-xs text-gray-600 dark:text-gray-300">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Everything in Pro Plan</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span>2 Years data retention</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Dedicated SLA & custom domain</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => handleCheckout('ENTERPRISE')}
              disabled={processing}
              className="mt-6 w-full py-2 px-3 text-xs font-semibold rounded-xl bg-purple-600 hover:bg-purple-700 text-white transition-colors"
            >
              Contact / Switch Enterprise
            </button>
          </div>
        </div>

        {/* Integrated Direct Gateway Checkout Box */}
        <div className="mt-6 p-6 rounded-2xl bg-gray-50 dark:bg-gray-950/50 border border-gray-200 dark:border-gray-800 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-gray-200 dark:border-gray-800 pb-3">
            <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Direct Payment Gateway &amp; Instant License Activation</span>
            </h4>
            <span className="text-xs font-mono text-gray-500 bg-gray-200 dark:bg-gray-800 px-2.5 py-0.5 rounded-full">
              {seats} Seats • {isAnnual ? 'Annual (20% Off)' : 'Monthly'}
            </span>
          </div>

          {/* Employee Count Based Seat License Selector */}
          <div className="p-4 rounded-xl bg-white dark:bg-gray-900 border border-blue-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-gray-900 dark:text-white block">
                  Employee Seats to License
                </span>
                <span className="text-[11px] text-gray-500 dark:text-gray-400">
                  Calculated based on your team ({employeeCount} active {employeeCount === 1 ? 'employee' : 'employees'} registered)
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSeats((prev) => Math.max(1, prev - 1))}
                className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 font-bold text-sm flex items-center justify-center transition-colors cursor-pointer"
                title="Decrease seats"
              >
                -
              </button>
              <input
                type="number"
                min="1"
                max="500"
                value={seats}
                onChange={(e) => setSeats(Math.max(1, Number(e.target.value) || 1))}
                className="w-16 text-center text-sm font-black py-1 px-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
              />
              <button
                type="button"
                onClick={() => setSeats((prev) => prev + 1)}
                className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 font-bold text-sm flex items-center justify-center transition-colors cursor-pointer"
                title="Increase seats"
              >
                +
              </button>
              <span className="text-xs font-semibold text-gray-500 ml-1">Seats</span>
            </div>
          </div>

          {/* Direct Payment Gateway Selection */}
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
              Choose Direct Payment Method:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* BKASH */}
              <div
                onClick={() => setSelectedGateway('bkash')}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  selectedGateway === 'bkash'
                    ? 'border-pink-500 bg-pink-500/10 ring-2 ring-pink-500/30'
                    : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 bg-white dark:bg-gray-900'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-sm text-pink-600 dark:text-pink-400">bKash</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-300">
                    Direct MFS
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 mt-1">bKash Tokenized Direct PGW (BDT)</p>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-2 block">
                  • Instant automated checkout
                </span>
              </div>

              {/* EPS */}
              <div
                onClick={() => setSelectedGateway('eps')}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  selectedGateway === 'eps'
                    ? 'border-emerald-500 bg-emerald-500/10 ring-2 ring-emerald-500/30'
                    : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 bg-white dark:bg-gray-900'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-sm text-emerald-600 dark:text-emerald-400 font-mono">
                    merchant.eps.com.bd
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                    EPS PGW
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 mt-1">Cards, NexusPay, DBBL &amp; All Bangladesh Banks</p>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-2 block">
                  • Direct bank &amp; card payment gateway
                </span>
              </div>

              {/* STRIPE */}
              <div
                onClick={() => setSelectedGateway('stripe')}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  selectedGateway === 'stripe'
                    ? 'border-blue-500 bg-blue-500/10 ring-2 ring-blue-500/30'
                    : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 bg-white dark:bg-gray-900'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-sm text-blue-600 dark:text-blue-400">Stripe</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                    Global Card
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 mt-1">Visa, MasterCard, Amex &amp; UnionPay (USD)</p>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-2 block">
                  • Instant international card checkout
                </span>
              </div>
            </div>
          </div>

          {/* Total calculation & Direct Pay button */}
          <div className="p-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <span className="text-xs text-gray-500 dark:text-gray-400 block">Total Due for {seats} {seats === 1 ? 'Employee' : 'Employees'}:</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-gray-900 dark:text-white">
                  {isBDT ? `${totalAmount.toLocaleString()} ৳` : `$${totalAmount.toLocaleString()}`}
                </span>
                <span className="text-xs text-gray-500">
                  ({seats} seats • {isAnnual ? '12 months with 20% discount' : '1 month'})
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleCheckout('PRO')}
              disabled={processing}
              className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs text-white transition-all shadow-md hover:shadow-lg disabled:opacity-50 cursor-pointer ${
                selectedGateway === 'bkash'
                  ? 'bg-pink-600 hover:bg-pink-700'
                  : selectedGateway === 'eps'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {processing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Processing {selectedGateway.toUpperCase()} Payment...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
                  <span>
                    Direct Pay with {selectedGateway === 'bkash' ? 'bKash' : selectedGateway === 'eps' ? 'EPS' : 'Stripe'} ({isBDT ? `${totalAmount.toLocaleString()} ৳` : `$${totalAmount.toLocaleString()}`})
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Invoices & Receipts History */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white">Invoices & Payment History</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Official tax invoices and transaction records for this organization.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800 text-gray-400 font-semibold uppercase tracking-wider text-[11px] bg-gray-50 dark:bg-gray-950/40">
                <th className="py-3.5 px-6">Invoice #</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Plan & Seats</th>
                <th className="py-3.5 px-4">Gateway</th>
                <th className="py-3.5 px-4">Amount</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-6 text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-150 dark:divide-gray-800">
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-400">
                    No invoices issued yet. Upgrade to Pro above to generate your first tax invoice.
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-gray-50 dark:hover:bg-gray-850/50 transition-colors">
                    <td className="py-3.5 px-6 font-mono font-bold text-gray-900 dark:text-white">
                      {inv.id}
                    </td>
                    <td className="py-3.5 px-4 text-gray-600 dark:text-gray-300">
                      {inv.date}
                    </td>
                    <td className="py-3.5 px-4 text-gray-800 dark:text-gray-200">
                      <span className="font-semibold">{inv.plan}</span> ({inv.seats} seats - {inv.billingCycle})
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          inv.gateway === 'BKASH'
                            ? 'bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-300'
                            : inv.gateway.includes('EPS')
                            ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 font-mono'
                            : 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                        }`}
                      >
                        {inv.gateway}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-gray-900 dark:text-white">
                      {inv.currency === 'BDT' ? `${inv.amount.toLocaleString()} ৳` : `$${inv.amount.toLocaleString()}`}
                    </td>
                    <td className="py-3.5 px-4">
                      {inv.status === 'PAID' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>PAID</span>
                        </span>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/60 px-2 py-0.5 rounded-md">
                            <Clock className="w-3 h-3" />
                            <span>PENDING</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => verifyPayment(inv.trxId || inv.id)}
                            className="px-2 py-0.5 text-[10px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/50 dark:text-blue-300 rounded border border-blue-200 dark:border-blue-800 transition-colors"
                          >
                            Verify
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      <button
                        onClick={() => setSelectedReceipt(inv)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/40 transition-colors"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Receipt</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Receipt Modal */}
      {selectedReceipt && (
        <InvoiceReceiptModal
          invoice={selectedReceipt}
          onClose={() => setSelectedReceipt(null)}
        />
      )}
    </div>
  )
}
