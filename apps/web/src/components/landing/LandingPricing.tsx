'use client'

import React, { useState, useEffect } from 'react'

export interface PackageFeature {
  text: string
  included: boolean
  isPremiumOnly?: boolean
}

export interface PackageItem {
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

import LandingSignupModal from './LandingSignupModal'

interface LandingPricingProps {
  packages: PackageItem[]
  loading: boolean
  onSelectPlan: (planId: string) => void
}

export default function LandingPricing({
  packages,
  loading,
  onSelectPlan,
}: LandingPricingProps) {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual')
  const [currency, setCurrency] = useState<'BDT' | 'USD'>('BDT')
  const [internalPackages, setInternalPackages] = useState<PackageItem[]>(packages || [])

  const [selectedPlanForQuote, setSelectedPlanForQuote] = useState<string>('PRO - 470 ৳/mo')
  const [quoteModalOpen, setQuoteModalOpen] = useState(false)
  const [quoteName, setQuoteName] = useState('')
  const [quotePhone, setQuotePhone] = useState('')
  const [quoteCompany, setQuoteCompany] = useState('')
  const [quoteSuccess, setQuoteSuccess] = useState(false)

  // Sync prop or fetch from api
  useEffect(() => {
    if (packages && packages.length > 0) {
      setInternalPackages(packages)
    } else {
      fetch('/api/superadmin/packages')
        .then((res) => res.json())
        .then((data) => {
          if (data?.success && Array.isArray(data.packages) && data.packages.length > 0) {
            setInternalPackages(data.packages)
          }
        })
        .catch((err) => console.error('Failed to load packages in LandingPricing:', err))
    }
  }, [packages])

  // Company Owner Free Trial Signup Modal State
  const [trialModalOpen, setTrialModalOpen] = useState(false)
  const [trialPlanId, setTrialPlanId] = useState('BASIC')
  const [trialPlanName, setTrialPlanName] = useState('BASIC')

  const openTrialModal = (planId: string, planTitle: string) => {
    setTrialPlanId(planId.toUpperCase())
    setTrialPlanName(planTitle)
    setTrialModalOpen(true)
  }

  const openQuoteModal = (planLabel: string) => {
    setSelectedPlanForQuote(planLabel)
    setQuoteModalOpen(true)
  }

  const closeQuoteModal = () => {
    setQuoteModalOpen(false)
    setQuoteSuccess(false)
  }

  const handleQuoteSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setQuoteSuccess(true)
    setTimeout(() => {
      alert(`Thank you, ${quoteName}! Your quotation request for ${selectedPlanForQuote} has been received. Our sales engineer will contact you at ${quotePhone}.`)
      closeQuoteModal()
    }, 400)
  }

  // Fallback defaults aligned with SuperAdmin packages if API is not yet loaded
  const fallbackPackages: PackageItem[] = [
    {
      id: 'basic',
      name: 'BASIC',
      badge: 'Free Forever',
      tagline: 'For teams monitoring their work productivity for the short term',
      price: {
        USD: { monthly: 0, annual: 0 },
        BDT: { monthly: 0, annual: 0 },
      },
      isPopular: false,
      colorScheme: 'green',
      features: [
        { text: 'Unlimited users', included: true },
        { text: 'Upto 2 teams', included: true },
        { text: 'Computer activity tracking', included: true },
        { text: 'Timesheet and attendance', included: true },
        { text: 'Custom rules to detect slacking employees', included: true },
        { text: 'Screenshots every 10 minutes', included: true },
        { text: 'Last 14 days data retention', included: true },
        { text: '10 GB file storage limit', included: true },
        { text: 'Data Export to CSV, XLS', included: true },
        { text: 'Standard email support', included: true },
      ],
      limits: {
        screenshotIntervalSec: 600,
        retentionDays: 14,
        storageQuotaMb: 10000,
        maxTeams: 2,
        bulkScreenshotDelete: false,
      },
    },
    {
      id: 'pro',
      name: 'PRO',
      badge: 'Save 20% on Annual',
      tagline: 'For teams optimizing their work productivity for the long term',
      price: {
        USD: { monthly: 4.99, annual: 3.99 },
        BDT: { monthly: 590, annual: 470 },
      },
      isPopular: true,
      colorScheme: 'blue',
      features: [
        { text: 'Unlimited tracking', included: true },
        { text: 'Unlimited teams', included: true },
        { text: 'Computer activity tracking', included: true },
        { text: 'Timesheet and attendance', included: true },
        { text: 'Custom rules to detect slacking employees', included: true },
        { text: 'Screenshots every 1 minute', included: true },
        { text: 'Last 1 year data retention', included: true },
        { text: 'Unlimited Storage', included: true },
        { text: 'Timelapse videos of work progress', included: true },
        { text: 'Data Export to CSV, XLS', included: true },
        { text: 'Priority support 24/7', included: true },
        { text: 'Multiple bulk screenshot deletion', included: true, isPremiumOnly: true },
      ],
      limits: {
        screenshotIntervalSec: 60,
        retentionDays: 365,
        storageQuotaMb: 500000,
        maxTeams: 9999,
        bulkScreenshotDelete: true,
      },
    },
    {
      id: 'enterprise',
      name: 'ENTERPRISE',
      badge: 'Custom Scale',
      tagline: 'For large enterprises requiring custom retention, security, and dedicated infrastructure',
      price: {
        USD: { monthly: 19.99, annual: 15.99 },
        BDT: { monthly: 2350, annual: 1880 },
      },
      isPopular: false,
      colorScheme: 'purple',
      features: [
        { text: 'Everything in PRO Plan included', included: true },
        { text: 'Multi-branch & company isolation', included: true },
        { text: 'Custom screenshot frequency & retention', included: true },
        { text: 'Custom branding & white labeling', included: true },
        { text: 'Role-Based Access Control & audit logs', included: true },
        { text: 'Dedicated Account Manager', included: true },
        { text: 'SLA 99.99% uptime guarantee', included: true },
        { text: 'Custom integrations & API access', included: true },
      ],
      limits: {
        screenshotIntervalSec: 30,
        retentionDays: 730,
        storageQuotaMb: 1000000,
        maxTeams: 99999,
        bulkScreenshotDelete: true,
      },
    },
  ]

  const activePackages = internalPackages.length > 0 ? internalPackages : fallbackPackages
  const currSymbol = currency === 'BDT' ? '৳' : '$'

  const renderCards = activePackages.map((pkg, index) => {
    const isMiddle = pkg.isPopular || index === 1
    const isThird = index === 2 || pkg.id.toLowerCase().includes('enterprise')
    const theme = isMiddle ? 'business' : isThird ? 'enterprise' : 'starter'
    const badgeColor = isMiddle ? 'badge-blue' : isThird ? 'badge-purple' : 'badge-green'
    const circleColor = isMiddle ? 'circle-blue' : isThird ? 'circle-purple' : 'circle-green'
    const iconColor = isMiddle ? '#0070f3' : isThird ? '#7928ca' : '#10b981'
    const btnClass = isMiddle ? 'btn-blue-plan' : isThird ? 'btn-purple-plan' : 'btn-green-plan'
    const discountClass = isMiddle ? 'pill-blue' : isThird ? 'pill-purple' : 'pill-green'
    const priceColor = isMiddle ? 'text-blue' : isThird ? 'text-purple' : 'text-green'

    const priceObj = pkg.price?.[currency]
    const priceVal = priceObj?.[billingCycle] ?? (pkg.id.toLowerCase() === 'basic' ? 0 : isMiddle ? (currency === 'BDT' ? 470 : 3.99) : (currency === 'BDT' ? 1880 : 15.99))
    const isFree = Number(priceVal) === 0 || pkg.id.toLowerCase() === 'basic'

    let formattedPrice = '0'
    let struckPrice = ''
    let discountPill = pkg.badge || ''
    let billingTerm = '/ Free Forever'
    let quoteLabel = `${pkg.name} - Free Plan`

    if (isFree) {
      formattedPrice = '0'
      discountPill = pkg.badge || 'FREE FOREVER'
      billingTerm = '/ Free Forever'
      quoteLabel = `${pkg.name} - Free Forever`
    } else {
      formattedPrice = currency === 'BDT' ? Math.round(Number(priceVal)).toLocaleString() : priceVal.toString()
      if (billingCycle === 'annual') {
        const monthlyVal = priceObj?.monthly
        if (monthlyVal && monthlyVal > Number(priceVal)) {
          const struckFormatted = currency === 'BDT' ? Math.round(Number(monthlyVal)).toLocaleString() : monthlyVal.toString()
          struckPrice = `${currSymbol}${struckFormatted} ${currency}`
        } else {
          const fallbackStruck = currency === 'BDT' ? Math.round(Number(priceVal) * 1.25).toLocaleString() : (Number((Number(priceVal) * 1.25).toFixed(2))).toString()
          struckPrice = `${currSymbol}${fallbackStruck} ${currency}`
        }
        discountPill = pkg.badge || 'SAVE 20%'
        billingTerm = '/ user / month (Billed Annually)'
      } else {
        discountPill = pkg.badge || 'MONTHLY'
        billingTerm = '/ user / month'
      }
      quoteLabel = `${pkg.name} - ${currSymbol}${formattedPrice} ${currency}/mo (${billingCycle})`
    }

    return {
      id: pkg.id,
      theme,
      isPopular: pkg.isPopular || isMiddle,
      badgeColor,
      circleColor,
      badgeText: pkg.badge || pkg.name.toUpperCase(),
      iconColor,
      title: pkg.name,
      desc: pkg.tagline || (isMiddle ? 'For teams optimizing their work productivity for the long term' : isThird ? 'For large enterprises requiring custom retention, security, and dedicated infrastructure' : 'For teams monitoring their work productivity for the short term'),
      struckPrice,
      discountPill,
      discountClass,
      priceColor,
      price: formattedPrice,
      term: billingTerm,
      quoteLabel,
      btnClass,
      isFree,
      features: pkg.features && pkg.features.length > 0
        ? pkg.features.slice(0, 14).map((f) => ({
            strong: f.text,
            small: f.isPremiumOnly ? '(Pro / Enterprise)' : '',
            highlight: f.text.toLowerCase().includes('everything') || f.text.toLowerCase().includes('unlimited'),
          }))
        : fallbackPackages[index % fallbackPackages.length].features.map((f) => ({
            strong: f.text,
            small: f.isPremiumOnly ? '(Pro / Enterprise)' : '',
            highlight: f.text.toLowerCase().includes('everything') || f.text.toLowerCase().includes('unlimited'),
          })),
    }
  })

  return (
    <section className="pricing-section" id="pricing">
      {/* Ambient Lighting Accents */}
      <div className="pricing-bg-glow pricing-glow-1"></div>
      <div className="pricing-bg-glow pricing-glow-2"></div>

      <div className="container pricing-container">
        {/* Top Header Area */}
        <div className="pricing-header-wrap">
          {/* Left Handwritten Script Slogan */}
          <div className="pricing-script-slogan">
            <span className="ps-text">
              Better<br />
              HR Management<br />
              for a Brighter<br />
              Future
            </span>
            <svg className="ps-arrow" viewBox="0 0 80 40" fill="none">
              <path d="M5 30C25 32 55 25 70 8" stroke="#0070f3" strokeWidth="2.2" strokeLinecap="round"/>
              <path d="M60 6L72 8L68 18" stroke="#0070f3" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>

          {/* Center Headings & Logo */}
          <div className="pricing-header-center">
            <div className="pricing-brand-badge" aria-label="Tracmatrix">
              <img
                src="/images/trackmatrix-logo-clean.png"
                alt="Tracmatrix — Employee Monitoring Software"
                className="pricing-brand-logo-img"
                width="180"
                height="44"
              />
            </div>

            <h2 className="pricing-main-title">
              Simple Plans. <span className="gradient-text-blue">Powerful Productivity Solutions.</span>
            </h2>

            <p className="pricing-main-sub">
              Choose the perfect plan for your business and streamline your workforce with Tracmatrix.
            </p>
          </div>

          {/* Right Trust Badge */}
          <div className="pricing-trust-badge">
            <div className="ptb-shield-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0070f3" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                <polyline points="9 12 11 14 15 10"></polyline>
              </svg>
            </div>
            <div className="ptb-info">
              <span className="ptb-title">Trusted by</span>
              <span className="ptb-country">Businesses Across<br />Bangladesh &amp; Worldwide</span>
            </div>
            <svg className="ptb-curve-arrow" viewBox="0 0 32 32" fill="none">
              <path d="M10 24C16 18 20 12 22 4" stroke="#7928ca" strokeWidth="2" strokeLinecap="round"/>
              <path d="M16 5L22 4L23 10" stroke="#7928ca" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>

        {/* Pricing Controls Bar: Billing Period (Monthly/Annual) & Currency (BDT/USD) */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
          margin: '0 auto 45px auto',
          padding: '10px 22px',
          background: 'rgba(15, 23, 42, 0.75)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '20px',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          maxWidth: 'fit-content',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.35)'
        }}>
          {/* Billing Cycle Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#94A3B8' }}>Billing:</span>
            <div style={{
              display: 'flex',
              background: 'rgba(2, 6, 23, 0.85)',
              padding: '3px',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.08)'
            }}>
              <button
                type="button"
                onClick={() => setBillingCycle('monthly')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '9px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: 'none',
                  transition: 'all 0.2s ease',
                  background: billingCycle === 'monthly' ? '#2563EB' : 'transparent',
                  color: billingCycle === 'monthly' ? '#FFFFFF' : '#94A3B8',
                }}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle('annual')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '9px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: 'none',
                  transition: 'all 0.2s ease',
                  background: billingCycle === 'annual' ? '#2563EB' : 'transparent',
                  color: billingCycle === 'annual' ? '#FFFFFF' : '#94A3B8',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span>Annual</span>
                <span style={{
                  fontSize: '10px',
                  background: 'rgba(16, 185, 129, 0.2)',
                  color: '#34D399',
                  padding: '1px 6px',
                  borderRadius: '9999px',
                  border: '1px solid rgba(16, 185, 129, 0.35)',
                  fontWeight: 800,
                }}>
                  SAVE 20%
                </span>
              </button>
            </div>
          </div>

          <div style={{ width: '1px', height: '22px', background: 'rgba(255, 255, 255, 0.12)' }} />

          {/* Currency Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#94A3B8' }}>Currency:</span>
            <div style={{
              display: 'flex',
              background: 'rgba(2, 6, 23, 0.85)',
              padding: '3px',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.08)'
            }}>
              <button
                type="button"
                onClick={() => setCurrency('BDT')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '9px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: 'none',
                  transition: 'all 0.2s ease',
                  background: currency === 'BDT' ? '#3B82F6' : 'transparent',
                  color: currency === 'BDT' ? '#FFFFFF' : '#94A3B8',
                }}
              >
                BDT (৳)
              </button>
              <button
                type="button"
                onClick={() => setCurrency('USD')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '9px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: 'none',
                  transition: 'all 0.2s ease',
                  background: currency === 'USD' ? '#3B82F6' : 'transparent',
                  color: currency === 'USD' ? '#FFFFFF' : '#94A3B8',
                }}
              >
                USD ($)
              </button>
            </div>
          </div>
        </div>

        {/* 3 Pricing Cards Grid */}
        <div className="pricing-cards-grid">
          {renderCards.map((card) => {
            const isStarter = card.theme === 'starter'
            const isBusiness = card.theme === 'business'

            return (
              <div
                key={card.id}
                className={`pricing-card card-${card.theme} ${card.isPopular ? 'is-popular' : ''}`}
                tabIndex={0}
              >
                {/* Popular Badge */}
                {card.isPopular && (
                  <div className="pc-popular-badge">
                    <span>&#9733; MOST POPULAR</span>
                  </div>
                )}

                {/* Top Row */}
                <div className="pc-top-row">
                  <span className={`pc-plan-badge ${card.badgeColor}`}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      {isStarter && <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>}
                      {isBusiness && <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>}
                      {!isStarter && !isBusiness && <polygon points="6 2 18 2 22 8 12 22 2 8 6 2"></polygon>}
                    </svg>
                    <span>{card.badgeText}</span>
                  </span>
                  <div className={`pc-top-circle ${card.circleColor}`}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={card.iconColor} strokeWidth="2.2">
                      {isStarter && <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/></>}
                      {isBusiness && <path d="M3 21h18M3 7v14M21 7v14M6 10h2M6 14h2M6 18h2M10 10h2M10 14h2M10 18h2M14 10h2M14 14h2M14 18h2M18 10h2M18 14h2M18 18h2M9 3h6v4H9z"/>}
                      {!isStarter && !isBusiness && <path d="M3 21h18M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16M9 9h1M9 13h1M9 17h1M14 9h1M14 13h1M14 17h1"/>}
                    </svg>
                  </div>
                </div>

                <h3 className="pc-plan-name">{card.title}</h3>
                <p className="pc-plan-desc">{card.desc}</p>

                {/* Price Box */}
                <div className="pc-price-box">
                  <div className="pc-original-row">
                    {card.struckPrice && (
                      <span className="pc-struck-price">{card.struckPrice}</span>
                    )}
                    {card.discountPill && (
                      <span className={`pc-discount-pill ${card.discountClass}`}>{card.discountPill}</span>
                    )}
                  </div>
                  <div className={`pc-main-price ${card.priceColor}`}>
                    <span className="pc-currency-symbol">{currSymbol}</span>{card.price} <span className="pc-bdt">{currency}</span>
                  </div>
                  <span className="pc-billing-term">{card.term}</span>
                </div>

                {/* Features List */}
                <ul className="pc-features-list">
                  {card.features.map((feat, fIdx) => {
                    const chkClass = isStarter ? 'icon-chk-green' : isBusiness ? 'icon-chk-blue' : 'icon-chk-purple'
                    return (
                      <li key={fIdx} className={feat.highlight ? 'pc-feat-highlight' : ''}>
                        <span className={`pc-check-icon ${chkClass}`}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </span>
                        <div className="pc-feature-text">
                          <strong>{feat.strong}</strong>
                          {feat.small && <small>{' '}{feat.small}</small>}
                        </div>
                      </li>
                    )
                  })}
                </ul>

                {/* CTA Action Buttons */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: 'auto' }}>
                  {/* Primary Free Trial / Get Started Button */}
                  <button
                    type="button"
                    className={`btn pc-cta-btn ${card.btnClass}`}
                    onClick={() => openTrialModal(card.id, card.title)}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <polyline points="16 11 18 13 22 9" />
                    </svg>
                    <span>{card.isFree ? 'Get Started Free' : 'Start 14-Day Free Trial'}</span>
                    <span className="pc-arrow">&rarr;</span>
                  </button>

                  {/* Secondary Get Quote & Online Payment Options */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => openQuoteModal(card.quoteLabel)}
                      style={{
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.12)',
                        color: '#E2E8F0',
                        fontSize: '12px',
                        fontWeight: 600,
                        padding: '8px 10px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        textAlign: 'center',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
                    >
                      Get Quote
                    </button>

                    <button
                      type="button"
                      onClick={() => onSelectPlan(card.id)}
                      style={{
                        background: 'transparent',
                        border: '1px solid rgba(255,255,255,0.15)',
                        color: '#94A3B8',
                        fontSize: '12px',
                        fontWeight: 500,
                        padding: '8px 10px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        textAlign: 'center',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = '#FFFFFF'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = '#94A3B8'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; }}
                    >
                      {currency === 'BDT' ? 'bKash / Card' : 'Card / Online'}
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Bottom Trust Pillars Bar (4 Pillars) */}
        <div className="pricing-trust-bar">
          <div className="ptb-pillar">
            <div className="ptb-pillar-icon icon-shield">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0070f3" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              </svg>
            </div>
            <div className="ptb-pillar-info">
              <span className="ptb-p-title">Secure &amp; Reliable</span>
              <span className="ptb-p-desc">Your data is always safe with us</span>
            </div>
          </div>

          <div className="ptb-divider"></div>

          <div className="ptb-pillar">
            <div className="ptb-pillar-icon icon-headset">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0070f3" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 18v-6a9 9 0 0 1 18 0v6"></path>
                <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path>
              </svg>
            </div>
            <div className="ptb-pillar-info">
              <span className="ptb-p-title">24/7 Support</span>
              <span className="ptb-p-desc">We&apos;re here whenever you need us</span>
            </div>
          </div>

          <div className="ptb-divider"></div>

          <div className="ptb-pillar">
            <div className="ptb-pillar-icon icon-cloud">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0070f3" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"></path>
              </svg>
            </div>
            <div className="ptb-pillar-info">
              <span className="ptb-p-title">Cloud Based</span>
              <span className="ptb-p-desc">Access from anywhere, anytime</span>
            </div>
          </div>

          <div className="ptb-divider"></div>

          <div className="ptb-pillar">
            <div className="ptb-pillar-icon icon-scale">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0070f3" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
              </svg>
            </div>
            <div className="ptb-pillar-info">
              <span className="ptb-p-title">Easy to Scale</span>
              <span className="ptb-p-desc">Grows with your business</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Interactive Quote Request Modal */}
      {quoteModalOpen && (
        <div
          className="quote-modal-overlay active"
          id="quoteModalOverlay"
          onClick={closeQuoteModal}
        >
          <div
            className="quote-modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="quoteModalTitle"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="quote-modal-close"
              id="quoteModalClose"
              aria-label="Close quote dialog"
              onClick={closeQuoteModal}
            >
              &times;
            </button>
            <div className="quote-modal-header">
              <div className="quote-icon-badge">📄</div>
              <h3 id="quoteModalTitle">Request Official Quotation</h3>
              <p>Fill out the details below to receive customized pricing &amp; product onboarding.</p>
            </div>
            <form id="quoteRequestForm" className="quote-form" onSubmit={handleQuoteSubmit}>
              <div className="quote-field">
                <label htmlFor="quotePlanInput">Selected Package</label>
                <input type="text" id="quotePlanInput" readOnly value={selectedPlanForQuote} />
              </div>
              <div className="quote-field-row">
                <div className="quote-field">
                  <label htmlFor="quoteNameInput">Your Name *</label>
                  <input
                    type="text"
                    id="quoteNameInput"
                    required
                    placeholder="e.g. Tanvir Ahmed"
                    value={quoteName}
                    onChange={(e) => setQuoteName(e.target.value)}
                  />
                </div>
                <div className="quote-field">
                  <label htmlFor="quotePhoneInput">Phone Number *</label>
                  <input
                    type="tel"
                    id="quotePhoneInput"
                    required
                    placeholder="e.g. 017XXXXXXXX"
                    value={quotePhone}
                    onChange={(e) => setQuotePhone(e.target.value)}
                  />
                </div>
              </div>
              <div className="quote-field">
                <label htmlFor="quoteCompanyInput">Company Name</label>
                <input
                  type="text"
                  id="quoteCompanyInput"
                  placeholder="e.g. Apex Tech Ltd."
                  value={quoteCompany}
                  onChange={(e) => setQuoteCompany(e.target.value)}
                />
              </div>
              <button type="submit" className="btn quote-submit-btn">
                <span>Submit Quote Request</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Company Owner Free Trial & Registration Modal */}
      <LandingSignupModal
        isOpen={trialModalOpen}
        onClose={() => setTrialModalOpen(false)}
        initialPlan={trialPlanId}
        planName={trialPlanName}
      />
    </section>
  )
}
