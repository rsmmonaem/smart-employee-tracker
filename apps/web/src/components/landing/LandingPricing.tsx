'use client'

import React, { useState } from 'react'

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
  const [selectedPlanForQuote, setSelectedPlanForQuote] = useState<string>('Business - ৳15,400 BDT')
  const [quoteModalOpen, setQuoteModalOpen] = useState(false)
  const [quoteName, setQuoteName] = useState('')
  const [quotePhone, setQuotePhone] = useState('')
  const [quoteCompany, setQuoteCompany] = useState('')
  const [quoteSuccess, setQuoteSuccess] = useState(false)

  // Company Owner Free Trial Signup Modal State
  const [trialModalOpen, setTrialModalOpen] = useState(false)
  const [trialPlanId, setTrialPlanId] = useState('BASIC')
  const [trialPlanName, setTrialPlanName] = useState('Starter')

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

  // Fallback plans if database packages are still loading or empty
  const defaultCards = [
    {
      id: 'starter',
      theme: 'starter',
      badgeColor: 'badge-green',
      circleColor: 'circle-green',
      badgeText: 'STARTER',
      iconColor: '#10b981',
      title: 'Basic HR Management',
      desc: 'Perfect for small businesses and startups looking for essential HR features.',
      struckPrice: '৳12,000 BDT',
      discountPill: 'SAVE 20%',
      discountClass: 'pill-green',
      priceColor: 'text-green',
      price: '9,600',
      term: '/ One Time Payment',
      quoteLabel: 'Starter - ৳9,600 BDT',
      btnClass: 'btn-green-plan',
      features: [
        { strong: 'Employee Management', small: '(Profiles & Database)' },
        { strong: 'Attendance Management', small: '(Time Tracking & Reports)' },
        { strong: 'Leave Management', small: '(Request & Approval)' },
        { strong: 'Department & Designation', small: '(Organizational Structure)' },
        { strong: 'Basic Payroll Management', small: '(Salary & Deductions)' },
        { strong: 'Basic HR Reports', small: '(Essential Reports)' },
        { strong: 'Email Notifications', small: '(System Alerts)' },
      ],
    },
    {
      id: 'business',
      theme: 'business',
      isPopular: true,
      badgeColor: 'badge-blue',
      circleColor: 'circle-blue',
      badgeText: 'BUSINESS',
      iconColor: '#0070f3',
      title: 'Advanced HR Solution',
      desc: 'Ideal for growing companies with multiple employees and departments.',
      struckPrice: '৳22,000 BDT',
      discountPill: 'SAVE 30%',
      discountClass: 'pill-blue',
      priceColor: 'text-blue',
      price: '15,400',
      term: '/ One Time Payment',
      quoteLabel: 'Business - ৳15,400 BDT',
      btnClass: 'btn-blue-plan',
      features: [
        { strong: 'Everything in Starter Plan', small: '(All Basic Features Included)', highlight: true },
        { strong: 'Advanced Payroll Management', small: '(Tax, Bonus & Deductions)' },
        { strong: 'Salary Structure & Payslip', small: '(Automated Generation)' },
        { strong: 'Shift & Roster Management', small: '(Flexible Scheduling)' },
        { strong: 'Late, Absent & Overtime Tracking', small: '(Real-time Monitoring)' },
        { strong: 'Performance Management', small: '(Goals & Appraisal)' },
        { strong: 'Recruitment & Applicant Management', small: '(Job Posting & Hiring)' },
        { strong: 'Employee Document Management', small: '(Digital Repository)' },
        { strong: 'Advanced Reports & Analytics', small: '(Custom Reports)' },
        { strong: 'SMS & Email Notifications', small: '(Instant Alerts)' },
        { strong: 'Attendance Device / Biometric Integration', small: '(Device Support)' },
      ],
    },
    {
      id: 'enterprise',
      theme: 'enterprise',
      badgeColor: 'badge-purple',
      circleColor: 'circle-purple',
      badgeText: 'ENTERPRISE',
      iconColor: '#7928ca',
      title: 'Complete HR Platform',
      desc: 'Built for large organizations, corporate groups and multi-branch businesses.',
      struckPrice: '৳35,000 BDT',
      discountPill: 'SAVE 35%',
      discountClass: 'pill-purple',
      priceColor: 'text-purple',
      price: '22,750',
      term: '/ One Time Payment',
      quoteLabel: 'Enterprise - ৳22,750 BDT',
      btnClass: 'btn-purple-plan',
      features: [
        { strong: 'Everything in Business Plan', small: '(All Features Included)', highlight: true },
        { strong: 'Multi-Branch Management', small: '(Multiple Locations)' },
        { strong: 'Advanced Payroll & Tax Management', small: '(Tax, Compliance & Reports)' },
        { strong: 'Advanced Recruitment & Onboarding', small: '(Full Hiring Workflow)' },
        { strong: 'Performance & KPI Management', small: '(Goal, Review & Growth)' },
        { strong: 'Training & Development Management', small: '(Learning & Skill Building)' },
        { strong: 'Asset Management', small: '(Company Assets & Inventory)' },
        { strong: 'Expense & Loan Management', small: '(Financial Tracking)' },
        { strong: 'Advanced HR Analytics', small: '(Data-Driven Insights)' },
        { strong: 'Custom Reports & Dashboard', small: '(Real-time Dashboard)' },
        { strong: 'Role-Based Access Control', small: '(Security & Permissions)' },
        { strong: 'API Integration', small: '(Third Party Integration)' },
        { strong: 'Mobile App Support', small: '(iOS & Android)' },
        { strong: 'Custom Branding / White Label', small: '(Your Brand, Our Platform)' },
        { strong: 'Priority Support & Assistance', small: '(Dedicated Account Manager)' },
      ],
    },
  ]

  // If dynamic packages exist, map them to preserve the exact UI aesthetics
  const renderCards = packages.length > 0
    ? packages.map((pkg, index) => {
        const isMiddle = pkg.isPopular || index === 1
        const isThird = index === 2 || pkg.id.toLowerCase().includes('enterprise')
        const theme = isMiddle ? 'business' : isThird ? 'enterprise' : 'starter'
        const badgeColor = isMiddle ? 'badge-blue' : isThird ? 'badge-purple' : 'badge-green'
        const circleColor = isMiddle ? 'circle-blue' : isThird ? 'circle-purple' : 'circle-green'
        const iconColor = isMiddle ? '#0070f3' : isThird ? '#7928ca' : '#10b981'
        const btnClass = isMiddle ? 'btn-blue-plan' : isThird ? 'btn-purple-plan' : 'btn-green-plan'
        const discountClass = isMiddle ? 'pill-blue' : isThird ? 'pill-purple' : 'pill-green'
        const priceColor = isMiddle ? 'text-blue' : isThird ? 'text-purple' : 'text-green'

        const bdtPrice = pkg.price?.BDT?.monthly || pkg.price?.BDT?.annual || (isMiddle ? 15400 : isThird ? 22750 : 9600)
        const struckBdt = Math.round(bdtPrice * 1.25).toLocaleString()

        return {
          id: pkg.id,
          theme,
          isPopular: pkg.isPopular || isMiddle,
          badgeColor,
          circleColor,
          badgeText: pkg.name || 'PLAN',
          iconColor,
          title: pkg.name.toLowerCase() === 'basic' ? 'Basic HR Management' : pkg.name.toLowerCase() === 'pro' ? 'Advanced HR Solution' : 'Complete HR Platform',
          desc: pkg.tagline || (isMiddle ? 'Ideal for growing companies with multiple employees and departments.' : isThird ? 'Built for large organizations, corporate groups and multi-branch businesses.' : 'Perfect for small businesses and startups looking for essential HR features.'),
          struckPrice: `৳${struckBdt} BDT`,
          discountPill: pkg.badge || (isMiddle ? 'SAVE 30%' : isThird ? 'SAVE 35%' : 'SAVE 20%'),
          discountClass,
          priceColor,
          price: bdtPrice.toLocaleString(),
          term: '/ Billed Yearly',
          quoteLabel: `${pkg.name} - ৳${bdtPrice.toLocaleString()} BDT`,
          btnClass,
          features: pkg.features && pkg.features.length > 0
            ? pkg.features.slice(0, 12).map((f) => ({
                strong: f.text,
                small: f.isPremiumOnly ? '(Premium Feature)' : '',
                highlight: f.text.toLowerCase().includes('everything'),
              }))
            : defaultCards[index % defaultCards.length].features,
        }
      })
    : defaultCards

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
              Simple Plans. <span className="gradient-text-blue">Powerful HR Solutions.</span>
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
              <span className="ptb-country">Businesses Across<br />Bangladesh</span>
            </div>
            <svg className="ptb-curve-arrow" viewBox="0 0 32 32" fill="none">
              <path d="M10 24C16 18 20 12 22 4" stroke="#7928ca" strokeWidth="2" strokeLinecap="round"/>
              <path d="M16 5L22 4L23 10" stroke="#7928ca" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
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
                    <span className="pc-struck-price">{card.struckPrice}</span>
                    <span className={`pc-discount-pill ${card.discountClass}`}>{card.discountPill}</span>
                  </div>
                  <div className={`pc-main-price ${card.priceColor}`}>
                    <span className="pc-currency-symbol">&#2547;</span>{card.price} <span className="pc-bdt">BDT</span>
                  </div>
                  <span className="pc-billing-term">{card.term}</span>
                </div>

                {/* Features List */}
                <ul className="pc-features-list">
                  {card.features.map((feat, fIdx) => {
                    const chkClass = isStarter ? 'icon-chk-green' : isBusiness ? 'icon-chk-blue' : 'icon-chk-purple'
                    return (
                      <li key={fIdx} className={feat.highlight ? 'pc-feat-highlight' : ''}>
                        <span className={`pc-check-icon ${chkClass}`}>&check;</span>
                        <span className={`pc-feature-icon-wrapper ${feat.highlight ? 'star-icon' : ''}`}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill={feat.highlight ? card.iconColor : 'none'} stroke={card.iconColor} strokeWidth="2">
                            {feat.highlight ? (
                              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                            ) : (
                              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                            )}
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
                  {/* Primary Free Trial Button */}
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
                    <span>Start 14-Day Free Trial</span>
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
                      bKash / Card
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
