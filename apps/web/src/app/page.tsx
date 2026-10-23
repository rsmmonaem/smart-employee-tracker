'use client'

import React, { useState, useEffect } from 'react'
import LandingNavbar from '@/components/landing/LandingNavbar'
import LandingHero from '@/components/landing/LandingHero'
import LandingMetrics from '@/components/landing/LandingMetrics'
import LandingFeatures from '@/components/landing/LandingFeatures'
import LandingWorkflow from '@/components/landing/LandingWorkflow'
import LandingProcess from '@/components/landing/LandingProcess'
import LandingReports from '@/components/landing/LandingReports'
import LandingIntegrations from '@/components/landing/LandingIntegrations'
import LandingTestimonials from '@/components/landing/LandingTestimonials'
import LandingPricing, { PackageItem } from '@/components/landing/LandingPricing'
import LandingCta from '@/components/landing/LandingCta'
import LandingFooter from '@/components/landing/LandingFooter'
import ProUpgradeModal from './admin/pro-upgrade-modal'
import './landing.css'

export default function Home() {
  const [packages, setPackages] = useState<PackageItem[]>([])
  const [loadingPackages, setLoadingPackages] = useState(true)
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false)
  const [selectedPlanUpgrade, setSelectedPlanUpgrade] = useState('PRO')

  // Fetch dynamic packages from API (Supabase platform_settings)
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

  const handleSelectPlan = (planId: string) => {
    setSelectedPlanUpgrade(planId.toUpperCase())
    setUpgradeModalOpen(true)
  }

  return (
    <div className="landing-page-root" style={{ minHeight: '100vh', background: '#0B1E3D', color: '#FFFFFF' }}>
      {/* 1. Top Navbar */}
      <LandingNavbar />

      <main id="main-content">
        {/* 2. Hero Section with Holographic Command Scene & Feature Badges */}
        <LandingHero />

        {/* 3. Social Proof Logo Cloud (Trusted by 5,000+ Businesses) */}
        <LandingMetrics />

        {/* 4. Key Features 8-Card Grid with Micro-software Live Demos */}
        <LandingFeatures />

        {/* 5. Visibility Dual-Device Mockup (Dashboard + Floating Phone) */}
        <LandingWorkflow />

        {/* 6. How It Works (3 Steps + Interactive Employee Invite Form) */}
        <LandingProcess />

        {/* 7. Reports & Analytics (Productivity Report Bar Chart & Table) */}
        <LandingReports />

        {/* 8. Integrations Row (Google, Microsoft, Slack, Zoom, Trello, GitHub, Jira) */}
        <LandingIntegrations />

        {/* 9. Dynamic Pricing Plans from Supabase + Quote Request Modal */}
        <LandingPricing
          packages={packages}
          loading={loadingPackages}
          onSelectPlan={handleSelectPlan}
        />

        {/* 10. Customer Testimonials */}
        <LandingTestimonials />

        {/* 11. Final Call To Action Banner */}
        <LandingCta />
      </main>

      {/* 12. Footer with Map & WhatsApp Floating Button */}
      <LandingFooter />

      {/* Direct In-Page Pro Upgrade / Checkout Modal for Online Payments */}
      <ProUpgradeModal
        isOpen={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
        featureRequested={`Tracmatrix ${selectedPlanUpgrade} Package`}
      />
    </div>
  )
}
