'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Image as ImageIcon,
  ShieldAlert,
  BarChart3,
  Play,
  Pause,
  Monitor,
  Activity,
  Sparkles,
  Crown,
  Check,
  X,
  CreditCard,
  Laptop,
} from 'lucide-react'
import ProUpgradeModal from './admin/pro-upgrade-modal'
import { createClient } from '@/utils/supabase/client'

interface PackageFeature {
  text: string
  included: boolean
  isPremiumOnly?: boolean
}

interface PackageItem {
  id: string
  name: string
  badge: string
  tagline: string
  price: {
    USD: { monthly: number; annual: number }
    BDT: { monthly: number; annual: number }
  }
  isPopular: boolean
  colorScheme: string
  features: PackageFeature[]
  limits: {
    screenshotIntervalSec: number
    retentionDays: number
    storageQuotaMb: number
    maxTeams: number
    bulkScreenshotDelete: boolean
  }
}

export default function Home() {
  // Package state
  const [packages, setPackages] = useState<PackageItem[]>([])
  const [currency, setCurrency] = useState<'USD' | 'BDT'>('BDT')
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual')
  const [loadingPackages, setLoadingPackages] = useState(true)

  // Interactive Tracker Widget state
  const [isTracking, setIsTracking] = useState(true)
  const [trackedSeconds, setTrackedSeconds] = useState(16418) // ~04:33:38
  const [activeAppIndex, setActiveAppIndex] = useState(0)
  const [screenshotCountdown, setScreenshotCountdown] = useState(38)
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false)
  const [selectedPlanUpgrade, setSelectedPlanUpgrade] = useState('PRO')
  const [currentUser, setCurrentUser] = useState<{ email?: string; role?: string } | null>(null)

  const simulatedApps = [
    { name: 'Visual Studio Code', file: 'SmartTracker-Core / tracker.ts', category: 'Development', productive: true, pct: 64 },
    { name: 'Google Chrome', file: 'Smart Employee Tracker Console', category: 'Browsing', productive: true, pct: 22 },
    { name: 'Figma', file: 'Smart Employee Tracker Design v2.4', category: 'Design', productive: true, pct: 10 },
    { name: 'Slack', file: '#engineering-standup', category: 'Collaboration', productive: true, pct: 4 },
  ]

  // Timer simulation
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    if (isTracking) {
      interval = setInterval(() => {
        setTrackedSeconds((prev) => prev + 1)
        setScreenshotCountdown((prev) => (prev <= 1 ? 60 : prev - 1))
      }, 1000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isTracking])

  // Cycle active apps
  useEffect(() => {
    const appInterval = setInterval(() => {
      setActiveAppIndex((prev) => (prev + 1) % simulatedApps.length)
    }, 4500)
    return () => clearInterval(appInterval)
  }, [simulatedApps.length])

  // Fetch dynamic packages from API
  useEffect(() => {
    const fetchPackages = async () => {
      try {
        setLoadingPackages(true)
        const res = await fetch('/api/superadmin/packages')
        const data = await res.json()
        if (data.success && data.packages) {
          setPackages(data.packages)
        }
      } catch (err) {
        console.error('Failed to load packages:', err)
      } finally {
        setLoadingPackages(false)
      }
    }
    fetchPackages()
  }, [])

  // Check auth status
  useEffect(() => {
    try {
      const supabase = createClient()
      supabase.auth.getUser().then(async ({ data }) => {
        if (data?.user) {
          const { data: profile } = await supabase
            .from('users')
            .select('role')
            .eq('id', data.user.id)
            .single()
          setCurrentUser({ email: data.user.email, role: profile?.role })
        } else {
          setCurrentUser(null)
        }
      })
    } catch {
      setCurrentUser(null)
    }
  }, [])

  // Format seconds to HH:MM:SS
  const formatTimer = (totalSecs: number) => {
    const hrs = Math.floor(totalSecs / 3600)
    const mins = Math.floor((totalSecs % 3600) / 60)
    const secs = totalSecs % 60
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const isAnnual = billingCycle === 'annual'
  const isBDT = currency === 'BDT'

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-gray-100 selection:bg-blue-600 selection:text-white">
      {/* Dynamic Ambient Background Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[1000px] h-[550px] bg-gradient-to-b from-blue-600/20 via-indigo-600/10 to-transparent blur-[140px] rounded-full" />
        <div className="absolute top-[600px] -left-48 w-96 h-96 bg-purple-600/15 blur-[120px] rounded-full" />
        <div className="absolute top-[800px] -right-48 w-96 h-96 bg-pink-600/10 blur-[120px] rounded-full" />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-black text-white text-base shadow-md select-none">
                S.
              </div>
              <span className="text-xl font-black tracking-tight text-white flex items-center gap-1.5">
                Smart Employee Tracker
                <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30">
                  Cloud
                </span>
              </span>
            </div>

            {/* Nav links */}
            <div className="hidden md:flex items-center space-x-7 text-xs font-semibold text-gray-300">
              <a href="#tracker-demo" className="hover:text-white transition-colors">
                Live Tracker
              </a>
              <a href="#features" className="hover:text-white transition-colors">
                Proof of Work
              </a>
              <a href="#pricing" className="hover:text-white transition-colors">
                Pricing & Packages
              </a>
              <a href="#gateways" className="hover:text-white transition-colors">
                Payment Gateways
              </a>
            </div>

            {/* Action buttons */}
            <div className="flex items-center space-x-3">
              {currentUser ? (
                <>
                  {currentUser.role === 'SUPER_ADMIN' ? (
                    <>
                      <Link
                        href="/superadmin"
                        className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 px-3 py-2 rounded-lg bg-indigo-950/40 border border-indigo-800/50 hover:bg-indigo-900/40 transition-colors"
                      >
                        SuperAdmin
                      </Link>
                      <Link
                        href="/admin/dashboard"
                        className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 px-3 py-2 rounded-lg bg-emerald-950/30 border border-emerald-800/40 hover:bg-emerald-900/40 transition-colors"
                      >
                        Client Admin
                      </Link>
                    </>
                  ) : (
                    <Link
                      href="/admin/dashboard"
                      className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 px-3 py-2 rounded-lg bg-emerald-950/30 border border-emerald-800/40 hover:bg-emerald-900/40 transition-colors"
                    >
                      Go to Dashboard
                    </Link>
                  )}
                  <form action="/auth/signout" method="post">
                    <button
                      type="submit"
                      className="text-xs font-semibold text-gray-400 hover:text-red-400 px-2.5 py-1.5 transition-colors cursor-pointer"
                    >
                      Sign Out
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="text-xs font-semibold text-gray-300 hover:text-white px-3.5 py-2 rounded-lg hover:bg-slate-800/60 transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/login"
                    className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-md hover:shadow-blue-500/25 transition-all"
                  >
                    Start Free Trial
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-16 lg:pt-44 lg:pb-24 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          {/* Top Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs text-gray-300 shadow-inner">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold text-white">Smart Employee Tracker</span>
            <span className="text-gray-500">|</span>
            <span className="text-blue-400 font-medium">bKash, EPS & Stripe Gateway Ready</span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white max-w-4xl mx-auto leading-tight sm:leading-none">
            Effortless Remote Team{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-violet-400">
              Productivity Tracking
            </span>
          </h1>

          {/* Subtitle */}
          <p className="max-w-2xl text-sm sm:text-base text-gray-400 mx-auto leading-relaxed">
            Automated screen capture at 1-minute intervals, bulk screenshot management, intelligent slacking detection,
            and localized instant billing across Bangladesh and global enterprises.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <a
              href="#pricing"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-lg hover:shadow-blue-500/30 hover:-translate-y-0.5 transition-all"
            >
              <span>Explore Dynamic Packages</span>
              <ArrowRight className="w-4 h-4" />
            </a>
            <a
              href="#tracker-demo"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 rounded-xl text-xs font-bold text-gray-200 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 transition-all"
            >
              <Monitor className="w-4 h-4 text-blue-400" />
              <span>Interactive Desktop Demo</span>
            </a>
          </div>

          {/* Live Tracker Teaser / Telemetry bar */}
          <div className="pt-8 flex flex-wrap items-center justify-center gap-6 text-[11px] text-gray-400 font-mono">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Screenshots: Every 60 Seconds (Pro)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Multiple Bulk Screenshot Delete Locked on Basic</span>
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Currencies: BDT (৳) & USD ($)</span>
            </span>
          </div>
        </div>
      </section>

      {/* Interactive Tracker Widget Simulation Section */}
      <section id="tracker-demo" className="py-16 relative z-10 bg-slate-950/60 border-y border-slate-800/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 space-y-2">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-blue-400 bg-blue-950/60 px-3 py-1 rounded-full border border-blue-800/50">
              <Activity className="w-3.5 h-3.5" />
              <span>Live Interactive Experience</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              Experience the Smart Employee Tracker
            </h2>
            <p className="text-xs text-gray-400 max-w-xl mx-auto">
              Simulate the lightweight background tracker agent used by employees to log hours, record verified proof of
              work, and sync activity to the Cloud Console.
            </p>
          </div>

          {/* Desktop App Window Container */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900/90 shadow-2xl backdrop-blur-md overflow-hidden max-w-4xl mx-auto">
            {/* Window title bar */}
            <div className="px-5 py-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
                  <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
                  <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
                </div>
                <span className="ml-3 text-xs font-mono font-bold text-gray-400 flex items-center gap-1.5">
                  <Laptop className="w-3.5 h-3.5 text-blue-400" />
                  Smart Employee Tracker Desktop Agent (Active)
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/50 border border-emerald-800/60 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Sync Active
                </span>
              </div>
            </div>

            {/* Widget Main Interior */}
            <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              {/* Left Column: Big Timer & Tracker controls */}
              <div className="md:col-span-6 space-y-6">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-gray-400 block mb-1">
                    Today&apos;s Tracked Shift
                  </span>
                  <div className="text-5xl sm:text-6xl font-black font-mono tracking-tight text-white flex items-center gap-2">
                    <span>{formatTimer(trackedSeconds)}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-2 text-xs">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                        isTracking
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${isTracking ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                      {isTracking ? 'TRACKING IN PROGRESS' : 'TRACKING PAUSED'}
                    </span>
                    <span className="text-gray-500">• 96% Productive Score</span>
                  </div>
                </div>

                {/* Control button */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setIsTracking(!isTracking)}
                    className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all shadow-md ${
                      isTracking
                        ? 'bg-amber-500 hover:bg-amber-600 text-slate-950'
                        : 'bg-emerald-500 hover:bg-emerald-600 text-slate-950'
                    }`}
                  >
                    {isTracking ? (
                      <>
                        <Pause className="w-4 h-4 fill-slate-950" />
                        <span>Pause Tracking</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 fill-slate-950" />
                        <span>Resume Tracking</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => setScreenshotCountdown(60)}
                    className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl font-semibold text-xs bg-slate-800 hover:bg-slate-750 text-gray-200 border border-slate-700 transition-colors"
                  >
                    <ImageIcon className="w-4 h-4 text-blue-400" />
                    <span>Capture Screen Now</span>
                  </button>
                </div>

                {/* Active Application Detector */}
                <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800/80 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-gray-400 font-semibold flex items-center gap-1">
                      <Monitor className="w-3.5 h-3.5 text-blue-400" />
                      Active Foreground App:
                    </span>
                    <span className="text-emerald-400 font-mono font-bold">Productive</span>
                  </div>
                  <div className="font-bold text-sm text-white truncate">
                    {simulatedApps[activeAppIndex].name}
                  </div>
                  <div className="text-[11px] font-mono text-gray-400 truncate">
                    {simulatedApps[activeAppIndex].file}
                  </div>
                </div>
              </div>

              {/* Right Column: Screenshot & Capture Telemetry */}
              <div className="md:col-span-6 space-y-4 bg-slate-950/60 p-5 rounded-2xl border border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-purple-400" />
                    <span>Verified Screenshot Feed (1m interval)</span>
                  </span>
                  <span className="text-[10px] font-mono text-gray-400">
                    Next in: <strong className="text-blue-400">{screenshotCountdown}s</strong>
                  </span>
                </div>

                {/* Simulated Screen Canvas Thumbnail */}
                <div className="relative aspect-video rounded-xl overflow-hidden border border-slate-800 bg-slate-900 group shadow-inner">
                  {/* Mock Desktop Screen */}
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-900 p-3 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 rounded bg-[#f9bb04] flex items-center justify-center font-bold text-[8px] text-[#1c64f2]">
                          N.
                        </div>
                        <span className="text-[9px] font-mono text-gray-400">Employee: John Doe (Senior Eng)</span>
                      </div>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 bg-blue-600/30 text-blue-300 rounded border border-blue-500/30">
                        HD 1080p
                      </span>
                    </div>

                    {/* Window mockup */}
                    <div className="p-3 bg-slate-950/80 rounded-lg border border-slate-800 text-[10px] font-mono text-gray-300 space-y-1 shadow-sm">
                      <div className="text-blue-400 font-bold">$ npm run dev:web</div>
                      <div className="text-emerald-400">✓ Ready in 654ms on http://localhost:3000</div>
                      <div className="text-gray-500">{'// Syncing screenshots to Smart Employee Tracker SaaS...'}</div>
                    </div>

                    <div className="flex items-center justify-between text-[9px] text-gray-400">
                      <span>Smart Employee Tracker Proof</span>
                      <span className="font-mono">Timestamp: 2026-09-27 01:14:22</span>
                    </div>
                  </div>

                  {/* Watermark overlay */}
                  <div className="absolute top-2 right-2">
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-xs text-white border border-white/10">
                      PRO VERIFIED
                    </span>
                  </div>
                </div>

                {/* Pro feature note */}
                <div className="p-2.5 rounded-xl bg-blue-950/30 border border-blue-900/40 flex items-center justify-between text-[11px]">
                  <span className="text-gray-300">Bulk Delete Permission:</span>
                  <span className="font-bold text-blue-400 flex items-center gap-1">
                    <Crown className="w-3 h-3 text-amber-400" />
                    Unlocked in PRO (Billed in ৳ or $)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Dynamic Packages & Pricing Section */}
      <section id="pricing" className="py-20 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-400 bg-blue-950/60 px-3.5 py-1 rounded-full border border-blue-800/50">
              Smart Employee Tracker Subscription Plans
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white">
              Dynamic Packages Synced with Official Pricing
            </h2>
            <p className="text-xs sm:text-sm text-gray-400 max-w-2xl mx-auto">
              Real-time prices loaded directly from the SaaS database. Choose between local Bangladesh settlement (bKash &
              merchant.eps.com.bd) or Global Cards (Stripe).
            </p>

            {/* Currency & Billing Period Switcher Bar */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              {/* Monthly vs Annual Toggle */}
              <div className="flex items-center p-1 bg-slate-900 rounded-xl border border-slate-800 text-xs font-semibold shadow-inner">
                <button
                  type="button"
                  onClick={() => setBillingCycle('monthly')}
                  className={`px-4 py-2 rounded-lg transition-all ${
                    billingCycle === 'monthly'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Monthly
                </button>
                <button
                  type="button"
                  onClick={() => setBillingCycle('annual')}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg transition-all ${
                    billingCycle === 'annual'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <span>Annual</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Save 20%
                  </span>
                </button>
              </div>

              {/* Currency Toggle: USD vs BDT */}
              <div className="flex items-center p-1 bg-slate-900 rounded-xl border border-slate-800 text-xs font-bold shadow-inner">
                <button
                  type="button"
                  onClick={() => setCurrency('BDT')}
                  className={`px-4 py-2 rounded-lg transition-all ${
                    currency === 'BDT'
                      ? 'bg-slate-800 text-white border border-slate-700 shadow-md'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  BDT (৳)
                </button>
                <button
                  type="button"
                  onClick={() => setCurrency('USD')}
                  className={`px-4 py-2 rounded-lg transition-all ${
                    currency === 'USD'
                      ? 'bg-slate-800 text-white border border-slate-700 shadow-md'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  USD ($)
                </button>
              </div>
            </div>
          </div>

          {/* Pricing Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto items-stretch">
            {packages.map((pkg) => {
              const isPro = pkg.id === 'pro'
              const isEnterprise = pkg.id === 'enterprise'

              // Price computation
              const priceUSD = isAnnual ? pkg.price.USD.annual : pkg.price.USD.monthly
              const priceBDT = isAnnual ? pkg.price.BDT.annual : pkg.price.BDT.monthly
              const displayPrice = isBDT
                ? `${priceBDT.toLocaleString()} ৳`
                : `$${priceUSD}`

              return (
                <div
                  key={pkg.id}
                  className={`relative rounded-3xl p-7 flex flex-col justify-between transition-all duration-300 ${
                    isPro
                      ? 'bg-gradient-to-b from-blue-950/40 via-slate-900 to-slate-900 border-2 border-blue-500 shadow-2xl shadow-blue-500/10 md:-translate-y-3'
                      : 'bg-slate-900/70 border border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {/* Top Badge */}
                  {isPro && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                      <span className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-[11px] font-black uppercase tracking-wider py-1 px-4 rounded-full shadow-lg flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        Most Popular Package
                      </span>
                    </div>
                  )}

                  <div>
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-black text-white">{pkg.name}</h3>
                      <span className="text-[11px] font-semibold text-gray-400 bg-slate-800/80 px-2.5 py-0.5 rounded-full border border-slate-700">
                        {pkg.badge}
                      </span>
                    </div>

                    <p className="text-xs text-gray-400 mt-2 min-h-[34px]">
                      {pkg.tagline}
                    </p>

                    {/* Price Header */}
                    <div className="mt-5 pb-5 border-b border-slate-800">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-4xl sm:text-5xl font-black text-white tracking-tight">
                          {displayPrice}
                        </span>
                        <span className="text-xs font-semibold text-gray-400">
                          {pkg.price.USD.monthly === 0 ? 'forever' : '/user/mo'}
                        </span>
                      </div>
                      <div className="text-[11px] text-gray-500 mt-1 font-mono">
                        {isAnnual && pkg.price.USD.monthly > 0 ? '(Billed Annually)' : ''}
                      </div>
                    </div>

                    {/* Feature list */}
                    <ul className="mt-6 space-y-3 text-xs flex-1">
                      {pkg.features.map((feat, fIdx) => (
                        <li key={fIdx} className="flex items-start gap-2.5">
                          {feat.included ? (
                            <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          ) : (
                            <X className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                          )}
                          <span
                            className={
                              feat.isPremiumOnly && !feat.included
                                ? 'text-rose-400 font-semibold'
                                : feat.isPremiumOnly && feat.included
                                ? 'text-blue-300 font-bold'
                                : 'text-gray-300'
                            }
                          >
                            {feat.text}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Action Button */}
                  <div className="mt-8 pt-5 border-t border-slate-800/80">
                    {pkg.id === 'basic' ? (
                      <Link
                        href="/login"
                        className="w-full py-3 px-4 rounded-xl text-xs font-bold text-center block bg-slate-800 hover:bg-slate-750 text-gray-200 border border-slate-700 transition-colors"
                      >
                        Start Free Basic Plan
                      </Link>
                    ) : (
                      <button
                        onClick={() => {
                          setSelectedPlanUpgrade(pkg.name)
                          setUpgradeModalOpen(true)
                        }}
                        className={`w-full py-3 px-4 rounded-xl text-xs font-bold text-center block transition-all shadow-md ${
                          isPro
                            ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20'
                            : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                        }`}
                      >
                        <span>Upgrade to {pkg.name}</span>
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Payment Gateways Section */}
      <section id="gateways" className="py-16 bg-slate-900/40 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/60 px-3.5 py-1 rounded-full border border-emerald-800/50">
              Payment Gateway Integrations
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mt-2">
              Seamless Local Bangladesh & Global Settlement
            </h2>
            <p className="text-xs text-gray-400 max-w-xl mx-auto mt-1">
              Direct API integrations configured for automated tokenized billing in BDT (৳) and USD ($).
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 max-w-4xl mx-auto">
            {/* bKash */}
            <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col justify-between items-center text-center space-y-3">
              <div className="h-10 w-10 rounded-xl bg-pink-950/60 border border-pink-800/60 flex items-center justify-center font-bold text-pink-400">
                MFS
              </div>
              <div>
                <h4 className="font-extrabold text-base text-pink-400">BKASH</h4>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  bKash Merchant PGW (Tokenized API v1.2.0-beta)
                </p>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800">
                Live Settlement (BDT ৳)
              </span>
            </div>

            {/* EPS */}
            <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col justify-between items-center text-center space-y-3">
              <div className="h-10 w-10 rounded-xl bg-indigo-950/60 border border-indigo-800/60 flex items-center justify-center font-bold text-indigo-400 font-mono">
                EPS
              </div>
              <div>
                <h4 className="font-extrabold text-base text-indigo-400 font-mono">merchant.eps.com.bd</h4>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  Easy Payment System (Bangladesh Internet Banking & Cards)
                </p>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800">
                Live Settlement (BDT ৳)
              </span>
            </div>

            {/* Stripe */}
            <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col justify-between items-center text-center space-y-3">
              <div className="h-10 w-10 rounded-xl bg-blue-950/60 border border-blue-800/60 flex items-center justify-center font-bold text-blue-400">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-base text-blue-400">Stripe Global</h4>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  International Visa, Mastercard & Amex Cards
                </p>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800">
                Live Settlement (USD $)
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid Section */}
      <section id="features" className="py-20 bg-slate-950 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 space-y-2">
            <h2 className="text-3xl font-extrabold text-white">
              Everything Your Organization Needs for Proof of Work
            </h2>
            <p className="text-xs text-gray-400 max-w-xl mx-auto">
              Built for engineering agencies, remote companies, and high-velocity teams.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-950/60 text-blue-400 flex items-center justify-center">
                <ImageIcon className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-white">Automated Screenshots</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                High-definition screen capture at 1-minute intervals. Visual proof of work stored with end-to-end encryption.
              </p>
            </div>

            <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-950/60 text-indigo-400 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-white">Timesheets & Timeline</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Automated shift timesheets, break tracking, and chronological activity playback for every employee.
              </p>
            </div>

            <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-rose-950/60 text-rose-400 flex items-center justify-center">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-white">Risk User Detection</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Smart heuristics flag prolonged idle intervals, slacking employees, and non-productive web browsing.
              </p>
            </div>

            <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-950/60 text-emerald-400 flex items-center justify-center">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-white">App & URL Analytics</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Granular reports on software utilization, categorized into Productive, Neutral, and Unproductive apps.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 py-12 border-t border-slate-800/80 text-xs text-gray-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white text-xs">
              S.
            </div>
            <span className="font-bold text-gray-400">
              Smart Employee Tracker &copy; 2026. Built by{' '}
              <a
                href="https://www.linkedin.com/in/rsm-monaem/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 font-bold underline transition-colors"
              >
                Rsm Monaem
              </a>
              . All rights reserved.
            </span>
          </div>

          <div className="flex items-center gap-6">
            {currentUser ? (
              <>
                <Link href="/admin/dashboard" className="hover:text-gray-300">
                  Dashboard
                </Link>
                {currentUser.role === 'SUPER_ADMIN' && (
                  <Link href="/superadmin" className="hover:text-gray-300">
                    Super Admin
                  </Link>
                )}
                <Link href="/admin/billing" className="hover:text-gray-300">
                  Billing
                </Link>
              </>
            ) : (
              <>
                <a href="#features" className="hover:text-gray-300">
                  Proof of Work
                </a>
                <a href="#pricing" className="hover:text-gray-300">
                  Pricing & Packages
                </a>
                <Link href="/login" className="hover:text-gray-300">
                  Sign In
                </Link>
              </>
            )}
          </div>
        </div>
      </footer>

      {/* Direct In-Page Pro Upgrade / Checkout Modal */}
      <ProUpgradeModal
        isOpen={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
        featureRequested={`Smart Employee Tracker ${selectedPlanUpgrade} Package`}
      />
    </div>
  )
}
