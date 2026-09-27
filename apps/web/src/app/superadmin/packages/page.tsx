'use client'

import React, { useState, useEffect } from 'react'
import {
  Package,
  Crown,
  Check,
  X,
  Sparkles,
  Zap,
  Edit3,
  Save,
  RefreshCw,
  Info,
  DollarSign,
  ShieldCheck,
  Lock,
  Unlock,
  CheckCircle2,
  ExternalLink
} from 'lucide-react'

interface FeatureItem {
  text: string
  included: boolean
  isPremiumOnly?: boolean
}

interface PackagePlan {
  id: string
  name: string
  badge: string
  tagline: string
  price: {
    USD: { monthly: number; annual: number }
    BDT: { monthly: number; annual: number }
  }
  billingText: {
    monthly: string
    annual: string
    monthlyBDT?: string
    annualBDT?: string
  }
  isPopular: boolean
  colorScheme: string
  features: FeatureItem[]
  limits: {
    screenshotIntervalSec: number
    retentionDays: number
    storageQuotaMb: number
    maxTeams: number
    bulkScreenshotDelete: boolean
  }
}

export default function SuperAdminPackagesPage() {
  const [packages, setPackages] = useState<PackagePlan[]>([])
  const [loading, setLoading] = useState(true)
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual')
  const [currency, setCurrency] = useState<'USD' | 'BDT'>('USD')
  const [editingPackageId, setEditingPackageId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const fetchPackages = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/superadmin/packages')
      const json = await res.json()
      if (json.success) {
        setPackages(json.packages)
      }
    } catch (err) {
      console.error('Failed to load packages:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPackages()
  }, [])

  const handlePriceChange = (
    pkgId: string,
    curr: 'USD' | 'BDT',
    cycle: 'monthly' | 'annual',
    val: number
  ) => {
    setPackages((prev) =>
      prev.map((pkg) => {
        if (pkg.id !== pkgId) return pkg
        return {
          ...pkg,
          price: {
            ...pkg.price,
            [curr]: {
              ...pkg.price[curr],
              [cycle]: val,
            },
          },
        }
      })
    )
  }

  const handleSavePackages = async () => {
    try {
      setIsSaving(true)
      const res = await fetch('/api/superadmin/packages', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packages }),
      })
      const json = await res.json()
      if (json.success) {
        setSaveSuccess(true)
        setEditingPackageId(null)
        setTimeout(() => setSaveSuccess(false), 3000)
      } else {
        alert(json.error || 'Failed to save packages')
      }
    } catch (err) {
      console.error(err)
      alert('Error updating packages')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <Package className="w-6 h-6 text-blue-500" />
              <span>SaaS Packages & Pricing</span>
            </h1>
            <a
              href="https://www.getworkfolio.com/pricing"
              target="_blank"
              rel="noreferrer"
              className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 bg-blue-950/40 px-2.5 py-1 rounded-full border border-blue-800/50"
            >
              <span>Synced with getworkfolio.com/pricing</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Configure subscription tiers, feature flags, and currency rates across the SaaS platform.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {saveSuccess && (
            <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" />
              Saved successfully!
            </span>
          )}

          <button
            onClick={handleSavePackages}
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20 transition-all disabled:opacity-50"
          >
            {isSaving ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>Save Package Changes</span>
          </button>
        </div>
      </div>

      {/* Pricing Controls: Billing Cycle & Currency Switchers */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Monthly / Annual toggle */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400 font-medium">Billing Period:</span>
          <div className="flex p-1 bg-gray-950 rounded-xl border border-gray-800 text-xs font-semibold">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                billingCycle === 'annual'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <span>Annual</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-1.5 py-0.2 rounded-full border border-emerald-500/30">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        {/* Currency Switcher */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400 font-medium">Currency:</span>
          <div className="flex p-1 bg-gray-950 rounded-xl border border-gray-800 text-xs font-semibold">
            <button
              onClick={() => setCurrency('USD')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                currency === 'USD'
                  ? 'bg-gray-800 text-white shadow-xs'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              USD ($)
            </button>
            <button
              onClick={() => setCurrency('BDT')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                currency === 'BDT'
                  ? 'bg-gray-800 text-white shadow-xs'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              BDT (৳)
            </button>
          </div>
        </div>
      </div>

      {/* Packages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-3 py-16 text-center text-gray-500">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-500 mb-2" />
            <span>Loading packages...</span>
          </div>
        ) : (
          packages.map((pkg) => {
            const isEditing = editingPackageId === pkg.id
            const currentPrice =
              billingCycle === 'annual'
                ? (pkg.price[currency]?.annual ?? 0)
                : (pkg.price[currency]?.monthly ?? 0)
            const currencySymbol = currency === 'USD' ? '$' : '৳ '

            return (
              <div
                key={pkg.id}
                className={`bg-gray-900 rounded-2xl border transition-all flex flex-col overflow-hidden relative ${
                  pkg.isPopular
                    ? 'border-blue-500 shadow-xl shadow-blue-500/10 ring-1 ring-blue-500/20'
                    : 'border-gray-800'
                }`}
              >
                {/* Popular Badge */}
                {pkg.isPopular && (
                  <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[11px] font-bold py-1 text-center uppercase tracking-wider">
                    Most Popular & Recommended
                  </div>
                )}

                <div className="p-6 flex-1 flex flex-col">
                  {/* Top card info */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                      {pkg.name}
                    </span>
                    <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-gray-800 text-gray-300 border border-gray-700">
                      {pkg.badge}
                    </span>
                  </div>

                  {/* Price display */}
                  <div className="my-3">
                    {isEditing ? (
                      <div className="space-y-2 p-3 bg-gray-950 rounded-xl border border-gray-800">
                        <div className="text-[11px] text-gray-400 font-semibold">
                          Edit {currency} {billingCycle} price:
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-white font-bold">{currencySymbol}</span>
                          <input
                            type="number"
                            step="0.01"
                            value={currentPrice}
                            onChange={(e) =>
                              handlePriceChange(
                                pkg.id,
                                currency,
                                billingCycle,
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-2.5 py-1 text-sm text-white font-mono"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-extrabold text-white tracking-tight">
                          {currencySymbol}
                          {currentPrice}
                        </span>
                        <span className="text-xs text-gray-400">
                          {pkg.price.USD.monthly === 0
                            ? '/forever'
                            : `/user/month ${billingCycle === 'annual' ? '(Billed Annually)' : ''}`}
                        </span>
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-gray-400 min-h-[36px] line-clamp-2 mt-1">
                    {pkg.tagline}
                  </p>

                  {/* Feature Limits & Specs */}
                  <div className="my-5 p-3 rounded-xl bg-gray-950/60 border border-gray-800/80 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-gray-300">
                      <span className="text-gray-400">Screenshot Interval:</span>
                      <span className="font-semibold text-white">
                        {pkg.limits.screenshotIntervalSec >= 60
                          ? `Every ${pkg.limits.screenshotIntervalSec / 60} min`
                          : `Every ${pkg.limits.screenshotIntervalSec} sec`}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-gray-300">
                      <span className="text-gray-400">Data Retention:</span>
                      <span className="font-semibold text-white">
                        {pkg.limits.retentionDays >= 365
                          ? `${pkg.limits.retentionDays / 365} year`
                          : `${pkg.limits.retentionDays} days`}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-gray-300">
                      <span className="text-gray-400">File Storage:</span>
                      <span className="font-semibold text-white">
                        {pkg.limits.storageQuotaMb >= 500000 ? 'Unlimited' : `${pkg.limits.storageQuotaMb / 1000} GB limit`}
                      </span>
                    </div>

                    {/* Bulk Delete Feature Highlight */}
                    <div className="flex items-center justify-between pt-1 border-t border-gray-800">
                      <span className="text-gray-400 flex items-center gap-1">
                        {pkg.limits.bulkScreenshotDelete ? (
                          <Unlock className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Lock className="w-3 h-3 text-rose-400" />
                        )}
                        <span>Bulk Screenshot Delete:</span>
                      </span>
                      <span
                        className={`font-bold px-1.5 py-0.5 rounded text-[10px] ${
                          pkg.limits.bulkScreenshotDelete
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : 'bg-rose-950 text-rose-300 border border-rose-800'
                        }`}
                      >
                        {pkg.limits.bulkScreenshotDelete ? 'UNLOCKED (PRO)' : 'LOCKED (FREE)'}
                      </span>
                    </div>
                  </div>

                  {/* Checklist of features */}
                  <div className="space-y-2.5 flex-1 pt-2">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-2">
                      Included Capabilities
                    </div>
                    {pkg.features.map((feat, i) => (
                      <div key={i} className="flex items-start gap-2.5 text-xs">
                        {feat.included ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        ) : (
                          <X className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                        )}
                        <span
                          className={`${
                            feat.included
                              ? feat.isPremiumOnly
                                ? 'text-blue-300 font-semibold'
                                : 'text-gray-300'
                              : 'text-gray-500 line-through'
                          }`}
                        >
                          {feat.text}
                          {feat.isPremiumOnly && !feat.included && (
                            <span className="ml-1 text-[10px] font-bold text-amber-400 not-italic no-underline">
                              (Requires PRO)
                            </span>
                          )}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Card Footer Actions */}
                  <div className="mt-6 pt-4 border-t border-gray-800 flex items-center justify-between">
                    <button
                      onClick={() => setEditingPackageId(isEditing ? null : pkg.id)}
                      className="text-xs text-gray-400 hover:text-white flex items-center gap-1 font-medium"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>{isEditing ? 'Cancel Edit' : 'Edit Pricing'}</span>
                    </button>

                    <span className="text-[10px] text-gray-500 font-mono">
                      id: {pkg.id}
                    </span>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Feature comparison banner */}
      <div className="bg-gradient-to-r from-blue-950/40 via-indigo-950/30 to-purple-950/40 border border-blue-900/40 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <ShieldCheck className="w-5 h-5 text-blue-400" />
            <span>Multi-Tier Feature Gating Active</span>
          </div>
          <p className="text-xs text-gray-400 max-w-xl">
            Tenants on the <strong>BASIC</strong> plan are limited to single-file operations. High-throughput bulk actions such as multiple bulk screenshot deletion and 1-minute intervals automatically require upgrading to <strong>Smart Employee Tracker PRO</strong>.
          </p>
        </div>

        <a
          href="/admin/screenshots"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-white text-gray-900 hover:bg-gray-100 transition-colors shadow-sm shrink-0"
        >
          <span>Test Bulk Deletion Gate</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  )
}
