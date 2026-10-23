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
  ExternalLink,
  Plus,
  Trash2,
  Sliders,
  Layers,
  RotateCcw,
  AlertTriangle
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
    maxUsers?: number
    bulkScreenshotDelete: boolean
  }
}

export default function SuperAdminPackagesPage() {
  const [packages, setPackages] = useState<PackagePlan[]>([])
  const [loading, setLoading] = useState(true)
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual')
  const [currency, setCurrency] = useState<'USD' | 'BDT'>('BDT')
  const [editingPackageId, setEditingPackageId] = useState<string | null>(null)
  const [editAll, setEditAll] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [newFeatureText, setNewFeatureText] = useState<{ [pkgId: string]: string }>({})

  const fetchPackages = async (forceReset = false) => {
    try {
      setLoading(true)
      const url = forceReset ? '/api/superadmin/packages?reset=true' : '/api/superadmin/packages'
      const res = await fetch(url)
      const json = await res.json()
      if (json.success && Array.isArray(json.packages)) {
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

  const handleLimitChange = (
    pkgId: string,
    field: keyof PackagePlan['limits'],
    val: any
  ) => {
    setPackages((prev) =>
      prev.map((pkg) => {
        if (pkg.id !== pkgId) return pkg
        return {
          ...pkg,
          limits: {
            ...pkg.limits,
            [field]: val,
          },
        }
      })
    )
  }

  const handleMetaChange = (
    pkgId: string,
    field: 'name' | 'badge' | 'tagline',
    val: string
  ) => {
    setPackages((prev) =>
      prev.map((pkg) => {
        if (pkg.id !== pkgId) return pkg
        return {
          ...pkg,
          [field]: val,
        }
      })
    )
  }

  const handleFeatureToggle = (pkgId: string, index: number, field: 'included' | 'isPremiumOnly') => {
    setPackages((prev) =>
      prev.map((pkg) => {
        if (pkg.id !== pkgId) return pkg
        const updatedFeatures = [...pkg.features]
        updatedFeatures[index] = {
          ...updatedFeatures[index],
          [field]: !updatedFeatures[index][field],
        }
        return {
          ...pkg,
          features: updatedFeatures,
        }
      })
    )
  }

  const handleFeatureTextChange = (pkgId: string, index: number, text: string) => {
    setPackages((prev) =>
      prev.map((pkg) => {
        if (pkg.id !== pkgId) return pkg
        const updatedFeatures = [...pkg.features]
        updatedFeatures[index] = {
          ...updatedFeatures[index],
          text,
        }
        return {
          ...pkg,
          features: updatedFeatures,
        }
      })
    )
  }

  const handleDeleteFeature = (pkgId: string, index: number) => {
    setPackages((prev) =>
      prev.map((pkg) => {
        if (pkg.id !== pkgId) return pkg
        return {
          ...pkg,
          features: pkg.features.filter((_, i) => i !== index),
        }
      })
    )
  }

  const handleAddFeature = (pkgId: string) => {
    const text = newFeatureText[pkgId]?.trim()
    if (!text) return

    setPackages((prev) =>
      prev.map((pkg) => {
        if (pkg.id !== pkgId) return pkg
        return {
          ...pkg,
          features: [
            ...pkg.features,
            { text, included: true, isPremiumOnly: false },
          ],
        }
      })
    )
    setNewFeatureText((prev) => ({ ...prev, [pkgId]: '' }))
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
        setEditAll(false)
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

  const handleResetToNewDefaults = async () => {
    if (
      !confirm(
        'Are you sure you want to apply the new recommended specifications (BASIC: 2 Days Retention, 500MB Storage, 10 Users)? This will overwrite obsolete database values.'
      )
    ) {
      return
    }
    await fetchPackages(true)
    setSaveSuccess(true)
    setTimeout(() => setSaveSuccess(false), 3000)
  }

  // Check if BASIC is showing obsolete 14 days or 10 GB
  const basicPkg = packages.find((p) => p.id === 'basic')
  const isBasicLegacy =
    basicPkg &&
    (basicPkg.limits.retentionDays === 14 ||
      basicPkg.limits.storageQuotaMb === 10000 ||
      basicPkg.features.some((f) => f.text.includes('14 days') || f.text.includes('10 GB') || f.text.includes('Unlimited users')))

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <Package className="w-6 h-6 text-blue-500" />
              <span>SaaS Packages &amp; Pricing Manager</span>
            </h1>
            <span className="text-xs text-blue-400 flex items-center gap-1 bg-blue-950/40 px-2.5 py-1 rounded-full border border-blue-800/50">
              <span>All Content Fully Dynamic</span>
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Edit subscription packages, feature lists, storage limits, screenshot intervals, and user seats dynamically.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {saveSuccess && (
            <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1 bg-emerald-950/60 px-3 py-1.5 rounded-xl border border-emerald-800">
              <CheckCircle2 className="w-4 h-4" />
              Saved to Database!
            </span>
          )}

          <button
            type="button"
            onClick={handleResetToNewDefaults}
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition-all disabled:opacity-50"
            title="Reset BASIC to 2-day retention, 500MB storage, and 10 users"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to New 2-Day Specs</span>
          </button>

          <button
            type="button"
            onClick={() => setEditAll(!editAll)}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              editAll
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:text-white border border-gray-700'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>{editAll ? 'Exit Edit All' : 'Edit All Cards'}</span>
          </button>

          <button
            type="button"
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

      {/* Legacy Warning & One-Click Upgrade Banner if obsolete DB values detected */}
      {isBasicLegacy && (
        <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-600/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-start sm:items-center gap-2.5 text-amber-300">
            <AlertTriangle className="w-5 h-5 shrink-0 text-amber-400" />
            <span>
              Your database currently has the legacy BASIC package with <strong>14 days retention</strong> and <strong>10 GB storage</strong>. Click the button to sync the new <strong>2 Days Retention</strong> and <strong>500 MB Storage</strong> specifications immediately!
            </span>
          </div>
          <button
            type="button"
            onClick={handleResetToNewDefaults}
            className="px-4 py-2 rounded-xl bg-amber-500 text-gray-950 font-bold hover:bg-amber-400 transition-colors shrink-0 shadow-sm"
          >
            Apply 2 Days &amp; 500MB Spec Now
          </button>
        </div>
      )}

      {/* Pricing Controls: Billing Cycle & Currency Switchers */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Monthly / Annual toggle */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400 font-medium">Billing Period:</span>
          <div className="flex p-1 bg-gray-950 rounded-xl border border-gray-800 text-xs font-semibold">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                billingCycle === 'monthly'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                billingCycle === 'annual'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <span>Annual</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 font-bold">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        {/* Currency Switcher */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400 font-medium">Target Currency:</span>
          <div className="flex p-1 bg-gray-950 rounded-xl border border-gray-800 text-xs font-semibold">
            <button
              onClick={() => setCurrency('USD')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                currency === 'USD'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              USD ($)
            </button>
            <button
              onClick={() => setCurrency('BDT')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                currency === 'BDT'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              BDT (৳)
            </button>
          </div>
        </div>
      </div>

      {/* Package Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-3 py-20 text-center text-gray-500">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-500 mb-2" />
            <span>Loading packages configuration...</span>
          </div>
        ) : (
          packages.map((pkg) => {
            const isEditing = editAll || editingPackageId === pkg.id
            const currentPrice = pkg.price[currency][billingCycle]
            const currencySymbol = currency === 'BDT' ? '৳' : '$'

            return (
              <div
                key={pkg.id}
                className={`relative flex flex-col rounded-3xl border transition-all ${
                  isEditing
                    ? 'border-blue-500 bg-gray-900 shadow-2xl shadow-blue-900/30 ring-1 ring-blue-500/50'
                    : pkg.isPopular
                    ? 'bg-gradient-to-b from-blue-950/40 via-gray-900 to-gray-900 border-blue-500 shadow-xl shadow-blue-500/10'
                    : 'bg-gray-900 border-gray-800 hover:border-gray-700'
                }`}
              >
                {/* Popular Badge */}
                {pkg.isPopular && !isEditing && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-[11px] font-extrabold shadow-md flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>MOST POPULAR CHOICE</span>
                  </div>
                )}

                {/* Edit Mode Active Indicator */}
                {isEditing && (
                  <div className="absolute -top-3 left-4 px-3 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-bold shadow-md flex items-center gap-1">
                    <Edit3 className="w-3 h-3" />
                    <span>EDITING ACTIVE</span>
                  </div>
                )}

                <div className="p-6 flex-1 flex flex-col">
                  {/* Top Header */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex-1">
                      {isEditing ? (
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-gray-400 uppercase">Plan Name</label>
                          <input
                            type="text"
                            value={pkg.name}
                            onChange={(e) => handleMetaChange(pkg.id, 'name', e.target.value)}
                            className="bg-gray-950 border border-gray-700 rounded-lg px-2.5 py-1 text-sm font-bold text-white w-full"
                          />
                          <label className="text-[10px] font-bold text-gray-400 uppercase mt-1 block">Badge Text</label>
                          <input
                            type="text"
                            value={pkg.badge}
                            onChange={(e) => handleMetaChange(pkg.id, 'badge', e.target.value)}
                            className="bg-gray-950 border border-gray-700 rounded-lg px-2 py-1 text-xs text-blue-400 w-full"
                            placeholder="e.g. Free Forever"
                          />
                        </div>
                      ) : (
                        <>
                          <h3 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
                            <span>{pkg.name}</span>
                            {pkg.id === 'pro' && <Crown className="w-4 h-4 text-amber-400" />}
                          </h3>
                          <span className="text-xs font-semibold text-blue-400">
                            {pkg.badge}
                          </span>
                        </>
                      )}
                    </div>

                    {!editAll && (
                      <button
                        type="button"
                        onClick={() => setEditingPackageId(isEditing ? null : pkg.id)}
                        className={`p-2 rounded-xl border text-xs font-medium transition-colors ${
                          isEditing
                            ? 'bg-blue-600 text-white border-blue-500'
                            : 'bg-gray-950 text-gray-400 hover:text-white border-gray-800'
                        }`}
                        title={isEditing ? 'Close Edit' : 'Edit Plan Settings'}
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Price display / Inline editing */}
                  <div className="my-4">
                    {isEditing ? (
                      <div className="p-3 bg-gray-950 rounded-xl border border-gray-800 space-y-2">
                        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                          Edit Pricing ({currency}):
                        </span>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <label className="block text-gray-500 text-[10px] mb-1">Monthly</label>
                            <input
                              type="number"
                              step="any"
                              value={pkg.price[currency].monthly}
                              onChange={(e) =>
                                handlePriceChange(
                                  pkg.id,
                                  currency,
                                  'monthly',
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-2 py-1 text-white text-xs"
                            />
                          </div>
                          <div>
                            <label className="block text-gray-500 text-[10px] mb-1">Annual</label>
                            <input
                              type="number"
                              step="any"
                              value={pkg.price[currency].annual}
                              onChange={(e) =>
                                handlePriceChange(
                                  pkg.id,
                                  currency,
                                  'annual',
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-2 py-1 text-white text-xs"
                            />
                          </div>
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

                  {isEditing ? (
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase">Tagline / Description</label>
                      <textarea
                        value={pkg.tagline}
                        onChange={(e) => handleMetaChange(pkg.id, 'tagline', e.target.value)}
                        rows={2}
                        className="w-full bg-gray-950 border border-gray-800 rounded-xl p-2 text-xs text-gray-300 mt-1"
                        placeholder="Tagline description..."
                      />
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 min-h-[36px] line-clamp-2 mt-1">
                      {pkg.tagline}
                    </p>
                  )}

                  {/* Feature Limits & Specs */}
                  <div className="my-5 p-3.5 rounded-xl bg-gray-950/60 border border-gray-800/80 space-y-2.5 text-xs">
                    <div className="flex items-center justify-between font-bold text-gray-400 pb-1 border-b border-gray-800 text-[11px] uppercase tracking-wider">
                      <span>Package Limits &amp; Quotas</span>
                      <Sliders className="w-3.5 h-3.5 text-blue-400" />
                    </div>

                    {/* Screenshot Interval */}
                    <div className="flex items-center justify-between text-gray-300">
                      <span className="text-gray-400">Screenshot Interval:</span>
                      {isEditing ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            value={pkg.limits.screenshotIntervalSec}
                            onChange={(e) => handleLimitChange(pkg.id, 'screenshotIntervalSec', parseInt(e.target.value) || 600)}
                            className="w-20 bg-gray-900 border border-gray-700 rounded px-1.5 py-0.5 text-right text-xs text-white"
                          />
                          <span className="text-[10px] text-gray-400">sec</span>
                        </div>
                      ) : (
                        <span className="font-semibold text-white">
                          {pkg.limits.screenshotIntervalSec >= 60
                            ? `Every ${pkg.limits.screenshotIntervalSec / 60} min`
                            : `Every ${pkg.limits.screenshotIntervalSec} sec`}
                        </span>
                      )}
                    </div>

                    {/* Data Retention (e.g. 2 days) */}
                    <div className="flex items-center justify-between text-gray-300">
                      <span className="text-gray-400">Data Retention:</span>
                      {isEditing ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            value={pkg.limits.retentionDays}
                            onChange={(e) => handleLimitChange(pkg.id, 'retentionDays', parseInt(e.target.value) || 2)}
                            className="w-16 bg-gray-900 border border-gray-700 rounded px-1.5 py-0.5 text-right text-xs text-white"
                          />
                          <span className="text-[10px] text-gray-400">days</span>
                        </div>
                      ) : (
                        <span className="font-semibold text-white">
                          {pkg.limits.retentionDays >= 365
                            ? `${pkg.limits.retentionDays / 365} year`
                            : `${pkg.limits.retentionDays} days`}
                        </span>
                      )}
                    </div>

                    {/* File Storage (e.g. 500 MB) */}
                    <div className="flex items-center justify-between text-gray-300">
                      <span className="text-gray-400">File Storage:</span>
                      {isEditing ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            value={pkg.limits.storageQuotaMb}
                            onChange={(e) => handleLimitChange(pkg.id, 'storageQuotaMb', parseInt(e.target.value) || 500)}
                            className="w-20 bg-gray-900 border border-gray-700 rounded px-1.5 py-0.5 text-right text-xs text-white"
                          />
                          <span className="text-[10px] text-gray-400">MB</span>
                        </div>
                      ) : (
                        <span className="font-semibold text-white">
                          {pkg.limits.storageQuotaMb >= 500000
                            ? 'Unlimited'
                            : pkg.limits.storageQuotaMb < 1000
                            ? `${pkg.limits.storageQuotaMb} MB limit`
                            : `${pkg.limits.storageQuotaMb / 1000} GB limit`}
                        </span>
                      )}
                    </div>

                    {/* Max Teams */}
                    <div className="flex items-center justify-between text-gray-300">
                      <span className="text-gray-400">Max Teams:</span>
                      {isEditing ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            value={pkg.limits.maxTeams}
                            onChange={(e) => handleLimitChange(pkg.id, 'maxTeams', parseInt(e.target.value) || 2)}
                            className="w-16 bg-gray-900 border border-gray-700 rounded px-1.5 py-0.5 text-right text-xs text-white"
                          />
                          <span className="text-[10px] text-gray-400">teams</span>
                        </div>
                      ) : (
                        <span className="font-semibold text-white">
                          {pkg.limits.maxTeams > 900 ? 'Unlimited' : `Upto ${pkg.limits.maxTeams} teams`}
                        </span>
                      )}
                    </div>

                    {/* Max Users / Seats */}
                    <div className="flex items-center justify-between text-gray-300">
                      <span className="text-gray-400">User Limit:</span>
                      {isEditing ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            value={pkg.limits.maxUsers || 10}
                            onChange={(e) => handleLimitChange(pkg.id, 'maxUsers', parseInt(e.target.value) || 10)}
                            className="w-16 bg-gray-900 border border-gray-700 rounded px-1.5 py-0.5 text-right text-xs text-white"
                          />
                          <span className="text-[10px] text-gray-400">users</span>
                        </div>
                      ) : (
                        <span className="font-semibold text-white">
                          {pkg.limits.maxUsers ? `${pkg.limits.maxUsers} Users` : 'Unlimited users'}
                        </span>
                      )}
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
                      {isEditing ? (
                        <button
                          type="button"
                          onClick={() => handleLimitChange(pkg.id, 'bulkScreenshotDelete', !pkg.limits.bulkScreenshotDelete)}
                          className={`font-bold px-2 py-0.5 rounded text-[10px] transition-colors ${
                            pkg.limits.bulkScreenshotDelete
                              ? 'bg-emerald-600 text-white'
                              : 'bg-rose-600 text-white'
                          }`}
                        >
                          {pkg.limits.bulkScreenshotDelete ? 'UNLOCKED' : 'LOCKED'}
                        </button>
                      ) : (
                        <span
                          className={`font-bold px-1.5 py-0.5 rounded text-[10px] ${
                            pkg.limits.bulkScreenshotDelete
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              : 'bg-rose-950 text-rose-300 border border-rose-800'
                          }`}
                        >
                          {pkg.limits.bulkScreenshotDelete ? 'UNLOCKED (PRO)' : 'LOCKED (FREE)'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Checklist of features */}
                  <div className="space-y-2.5 flex-1 pt-2">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-2 flex items-center justify-between">
                      <span>Included Capabilities ({pkg.features.length})</span>
                      {isEditing && <span className="text-[10px] text-blue-400">Click icon to toggle</span>}
                    </div>

                    {pkg.features.map((feat, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs group">
                        {isEditing ? (
                          <button
                            type="button"
                            onClick={() => handleFeatureToggle(pkg.id, i, 'included')}
                            className="p-1 rounded bg-gray-950 border border-gray-800 hover:border-gray-600 transition-colors shrink-0"
                            title={feat.included ? 'Mark Excluded' : 'Mark Included'}
                          >
                            {feat.included ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <X className="w-3.5 h-3.5 text-rose-500" />
                            )}
                          </button>
                        ) : feat.included ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        ) : (
                          <X className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        )}

                        {isEditing ? (
                          <div className="flex-1 flex items-center gap-1.5">
                            <input
                              type="text"
                              value={feat.text}
                              onChange={(e) => handleFeatureTextChange(pkg.id, i, e.target.value)}
                              className="flex-1 bg-gray-950 border border-gray-800 rounded px-2 py-1 text-xs text-white"
                            />
                            <button
                              type="button"
                              onClick={() => handleFeatureToggle(pkg.id, i, 'isPremiumOnly')}
                              className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border transition-colors ${
                                feat.isPremiumOnly
                                  ? 'bg-amber-950 text-amber-300 border-amber-800'
                                  : 'bg-gray-800 text-gray-400 border-gray-700 hover:text-white'
                              }`}
                              title="Toggle Requires PRO badge"
                            >
                              PRO
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteFeature(pkg.id, i)}
                              className="p-1 text-gray-500 hover:text-rose-400 rounded transition-colors"
                              title="Delete feature"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
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
                        )}
                      </div>
                    ))}

                    {/* Add new feature input if in edit mode */}
                    {isEditing && (
                      <div className="flex items-center gap-1.5 pt-2 border-t border-gray-800">
                        <input
                          type="text"
                          placeholder="New capability title..."
                          value={newFeatureText[pkg.id] || ''}
                          onChange={(e) =>
                            setNewFeatureText((prev) => ({ ...prev, [pkg.id]: e.target.value }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              handleAddFeature(pkg.id)
                            }
                          }}
                          className="flex-1 bg-gray-950 border border-gray-800 rounded-lg px-2.5 py-1 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-blue-500"
                        />
                        <button
                          type="button"
                          onClick={() => handleAddFeature(pkg.id)}
                          className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Card Footer Actions */}
                  <div className="mt-6 pt-4 border-t border-gray-800 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setEditingPackageId(isEditing ? null : pkg.id)}
                      className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-semibold transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>{isEditing ? 'Done Editing' : 'Edit Features & Limits'}</span>
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

      {/* Feature comparison banner & Bottom Save Action */}
      <div className="bg-gradient-to-r from-blue-950/40 via-indigo-950/30 to-purple-950/40 border border-blue-900/40 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <ShieldCheck className="w-5 h-5 text-blue-400" />
            <span>Multi-Tier Feature Gating Active</span>
          </div>
          <p className="text-xs text-gray-400 max-w-xl">
            Tenants on the <strong>BASIC</strong> plan are limited to <strong>500 MB storage</strong>, <strong>10 users</strong>, <strong>2 teams</strong>, and <strong>2 days data retention</strong>. High-throughput actions like multiple bulk screenshot deletion automatically require upgrading to <strong>PRO</strong>.
          </p>
        </div>

        <button
          onClick={handleSavePackages}
          disabled={isSaving}
          className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white transition-colors shadow-lg shadow-blue-600/20 shrink-0"
        >
          <Save className="w-3.5 h-3.5" />
          <span>Save All Package Changes</span>
        </button>
      </div>
    </div>
  )
}
