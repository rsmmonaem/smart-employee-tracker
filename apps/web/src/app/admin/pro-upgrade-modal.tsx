'use client'

import React, { useState } from 'react'
import {
  Crown,
  Check,
  Zap,
  Sparkles,
  Shield,
  Clock,
  HardDrive,
  Trash2,
  X,
  ArrowRight,
  RefreshCw,
  Layers,
  CreditCard,
  Phone,
  Building
} from 'lucide-react'

interface ProUpgradeModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  featureRequested?: string
}

export default function ProUpgradeModal({
  isOpen,
  onClose,
  onSuccess,
  featureRequested = 'Multiple Bulk Screenshot Deletion',
}: ProUpgradeModalProps) {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual')
  const [currency, setCurrency] = useState<'USD' | 'BDT'>('BDT')
  const [selectedGateway, setSelectedGateway] = useState<'bkash' | 'eps' | 'stripe'>('bkash')
  const [bkashNumber, setBkashNumber] = useState('01712345678')
  const [epsBank, setEpsBank] = useState('Dutch-Bangla Bank (NexusPay / Cards)')
  const [loading, setLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  if (!isOpen) return null

  const handleUpgrade = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gateway: selectedGateway,
          plan: 'PRO',
          billingCycle,
          currency,
          seats: 1,
          paymentDetails: {
            phone: bkashNumber,
            bank: epsBank,
          },
        }),
      })
      const data = await res.json()
      if (data.success) {
        setSuccessMessage(data.message || 'Payment successfully processed! Organization upgraded to Smart Employee Tracker PRO.')
        setTimeout(() => {
          if (onSuccess) onSuccess()
          onClose()
        }, 1800)
      } else {
        alert(data.error || 'Failed to complete payment checkout.')
      }
    } catch (err) {
      console.error(err)
      alert('Error during plan upgrade checkout.')
    } finally {
      setLoading(false)
    }
  }

  const priceMonthly = currency === 'USD' ? '$4.99' : '590 ৳'
  const priceAnnual = currency === 'USD' ? '$3.99' : '470 ৳'
  const activePrice = billingCycle === 'annual' ? priceAnnual : priceMonthly

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Glow Header */}
        <div className="relative bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-700 px-8 py-5 text-white overflow-hidden shrink-0">
          <div className="absolute -right-8 -top-8 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute right-12 bottom-2 text-white/10 pointer-events-none">
            <Crown className="w-28 h-28" />
          </div>

          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 text-white/70 hover:text-white rounded-full bg-black/10 hover:bg-black/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-xs text-white">
              <Crown className="w-3.5 h-3.5 text-amber-300" />
              Smart Tracker PRO
            </span>
            <span className="text-[11px] bg-amber-400 text-gray-900 font-bold px-2 py-0.5 rounded-full">
              PREMIUM
            </span>
          </div>

          <h2 className="text-2xl font-bold tracking-tight">
            Unlock {featureRequested}
          </h2>
          <p className="text-blue-100 text-xs mt-1 max-w-md">
            Your organization is currently on the <strong className="text-white">Basic (Free Forever)</strong> plan. Upgrade to Smart Employee Tracker PRO to unlock bulk screenshot deletion and 1-minute interval tracking.
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Billing selector & currency */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-gray-50 dark:bg-gray-800/60 p-3 rounded-xl border border-gray-150 dark:border-gray-800">
            {/* Monthly / Annual toggle */}
            <div className="flex items-center p-1 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 text-xs font-semibold shadow-2xs">
              <button
                type="button"
                onClick={() => setBillingCycle('monthly')}
                className={`px-3 py-1.5 rounded-md transition-all ${
                  billingCycle === 'monthly'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900'
                }`}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle('annual')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-md transition-all ${
                  billingCycle === 'annual'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900'
                }`}
              >
                Annual
                <span className="text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 font-bold px-1.5 py-0.5 rounded">
                  Save 20%
                </span>
              </button>
            </div>

            {/* Currency toggle */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-gray-500 dark:text-gray-400 font-medium">Currency:</span>
              <div className="flex bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-0.5">
                <button
                  type="button"
                  onClick={() => {
                    setCurrency('BDT')
                    setSelectedGateway('bkash')
                  }}
                  className={`px-2.5 py-1 rounded text-xs font-bold ${
                    currency === 'BDT'
                      ? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900'
                      : 'text-gray-600 dark:text-gray-400'
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
                  className={`px-2.5 py-1 rounded text-xs font-bold ${
                    currency === 'USD'
                      ? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}
                >
                  USD ($)
                </button>
              </div>
            </div>
          </div>

          {/* Pricing & Feature comparison cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Basic card */}
            <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 opacity-75">
              <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                Current Plan
              </div>
              <div className="text-base font-bold text-gray-900 dark:text-white">
                BASIC
              </div>
              <div className="text-xl font-bold text-gray-900 dark:text-white mt-1">
                $0 / 0 ৳ <span className="text-xs font-normal text-gray-500">forever</span>
              </div>
              <ul className="mt-3 space-y-1.5 text-xs text-gray-600 dark:text-gray-300">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-gray-400" />
                  <span>Screenshots every 10 mins</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-gray-400" />
                  <span>14 days data retention</span>
                </li>
                <li className="flex items-center gap-2 text-rose-500 font-medium">
                  <X className="w-3.5 h-3.5 text-rose-500" />
                  <span>No bulk screenshot delete</span>
                </li>
              </ul>
            </div>

            {/* Pro card */}
            <div className="p-4 rounded-xl border-2 border-blue-600 bg-blue-50/20 dark:bg-blue-950/20 relative shadow-sm">
              <div className="absolute -top-3 right-3 bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-xs">
                Recommended
              </div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-1">
                Smart Employee Tracker Pro
              </div>
              <div className="text-base font-bold text-gray-900 dark:text-white">
                PRO PLAN
              </div>
              <div className="text-xl font-extrabold text-blue-600 dark:text-blue-400 mt-1">
                {activePrice}
                <span className="text-xs font-normal text-gray-500 dark:text-gray-400 ml-1">
                  /user/month {billingCycle === 'annual' && '(Annual)'}
                </span>
              </div>
              <ul className="mt-3 space-y-1.5 text-xs text-gray-700 dark:text-gray-200">
                <li className="flex items-center gap-2 font-semibold text-blue-600 dark:text-blue-400">
                  <Check className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Multiple bulk screenshot delete</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Screenshots every 1 minute</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Last 1 year data retention & Unlimited Storage</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Payment Gateway Selector */}
          <div className="space-y-3 pt-2 border-t border-gray-150 dark:border-gray-800">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300 block">
              Select Payment Method
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* BKASH */}
              <div
                onClick={() => setSelectedGateway('bkash')}
                className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                  selectedGateway === 'bkash'
                    ? 'border-pink-500 bg-pink-50/40 dark:bg-pink-950/30 ring-2 ring-pink-500/20'
                    : 'border-gray-200 dark:border-gray-800 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-pink-600 dark:text-pink-400">bKash</span>
                  <span className="text-[10px] font-bold bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-300 px-1.5 py-0.2 rounded">
                    MFS
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 mt-1">Direct Tokenized PGW (BDT)</p>
              </div>

              {/* EPS */}
              <div
                onClick={() => setSelectedGateway('eps')}
                className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                  selectedGateway === 'eps'
                    ? 'border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/30 ring-2 ring-indigo-500/20'
                    : 'border-gray-200 dark:border-gray-800 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-indigo-600 dark:text-indigo-400">EPS</span>
                  <span className="text-[10px] font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 px-1.5 py-0.2 rounded">
                    Banks & Cards
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 mt-1">merchant.eps.com.bd (BDT)</p>
              </div>

              {/* Stripe */}
              <div
                onClick={() => setSelectedGateway('stripe')}
                className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                  selectedGateway === 'stripe'
                    ? 'border-blue-500 bg-blue-50/40 dark:bg-blue-950/30 ring-2 ring-blue-500/20'
                    : 'border-gray-200 dark:border-gray-800 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-blue-600 dark:text-blue-400">Stripe</span>
                  <span className="text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 px-1.5 py-0.2 rounded">
                    Global Cards
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 mt-1">Visa, Master, Amex (USD)</p>
              </div>
            </div>

            {/* Gateway Interactive Inputs */}
            {selectedGateway === 'bkash' && (
              <div className="p-3 bg-pink-50/30 dark:bg-pink-950/20 border border-pink-200/60 dark:border-pink-900/40 rounded-xl space-y-2 text-xs">
                <div className="flex items-center gap-2 text-pink-700 dark:text-pink-300 font-semibold">
                  <Phone className="w-3.5 h-3.5" />
                  <span>bKash Merchant Checkout</span>
                </div>
                <div>
                  <label className="block text-[11px] text-gray-500 mb-0.5">Your bKash Wallet Number</label>
                  <input
                    type="text"
                    value={bkashNumber}
                    onChange={(e) => setBkashNumber(e.target.value)}
                    className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 text-xs text-gray-900 dark:text-white font-mono"
                  />
                </div>
              </div>
            )}

            {selectedGateway === 'eps' && (
              <div className="p-3 bg-indigo-50/30 dark:bg-indigo-950/20 border border-indigo-200/60 dark:border-indigo-900/40 rounded-xl space-y-2 text-xs">
                <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300 font-semibold">
                  <Building className="w-3.5 h-3.5" />
                  <span>EPS Gateway (merchant.eps.com.bd)</span>
                </div>
                <div>
                  <label className="block text-[11px] text-gray-500 mb-0.5">Payment Channel</label>
                  <select
                    value={epsBank}
                    onChange={(e) => setEpsBank(e.target.value)}
                    className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 text-xs text-gray-900 dark:text-white"
                  >
                    <option>Dutch-Bangla Bank (NexusPay / Cards)</option>
                    <option>City Bank (Citytouch / Amex)</option>
                    <option>BRAC Bank (Astha)</option>
                    <option>Islami Bank (CellFin)</option>
                    <option>Eastern Bank (EBL Skybanking)</option>
                    <option>Visa / Mastercard Bangladesh</option>
                  </select>
                </div>
              </div>
            )}

            {selectedGateway === 'stripe' && (
              <div className="p-3 bg-blue-50/30 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40 rounded-xl space-y-2 text-xs">
                <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 font-semibold">
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Stripe Card Checkout</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <label className="block text-[11px] text-gray-500 mb-0.5">Card Number</label>
                    <input
                      type="text"
                      defaultValue="4242 •••• •••• 4242"
                      disabled
                      className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1 text-xs text-gray-700 dark:text-gray-300 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-gray-500 mb-0.5">Exp / CVC</label>
                    <input
                      type="text"
                      defaultValue="12/28 • 123"
                      disabled
                      className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1 text-xs text-gray-700 dark:text-gray-300 font-mono"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {successMessage && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800">
            <button
              type="button"
              onClick={onClose}
              className="text-xs font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 px-3 py-2"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleUpgrade}
              disabled={loading}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md shadow-blue-500/25 transition-all transform active:scale-95 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Processing Payment via {selectedGateway.toUpperCase()}...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 fill-amber-300 text-amber-300" />
                  <span>Pay {activePrice} via {selectedGateway.toUpperCase()}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
