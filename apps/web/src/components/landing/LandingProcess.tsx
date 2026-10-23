'use client'

import React, { useState } from 'react'

export default function LandingProcess() {
  const [activeStep, setActiveStep] = useState(1)
  const [invited, setInvited] = useState(false)
  const [inviting, setInviting] = useState(false)

  const handleInvite = () => {
    setInviting(true)
    setTimeout(() => {
      setInviting(false)
      setInvited(true)
      setTimeout(() => {
        setInvited(false)
      }, 3000)
    }, 600)
  }

  return (
    <section className="wt-steps" id="how-it-works">
      {/* Ambient Subtle Background Glow */}
      <div className="wt-steps-glow"></div>

      <div className="wt-container">
        {/* Section Header */}
        <div className="wt-steps-header">
          <h2 className="wt-steps-title">
            Get Started in <span className="wt-highlight-blue">3 Simple Steps</span>
          </h2>
          <p className="wt-steps-subtitle">
            Set up your account, invite your team, and start tracking productivity in just a few minutes.
          </p>
        </div>

        <div className="wt-steps-grid">
          {/* Left Side: 3 Numbered Steps with Animated Connection Line */}
          <div className="wt-steps-left">
            {/* Step 1 */}
            <div
              className={`wt-step-item ${activeStep === 1 ? 'active' : ''}`}
              data-step="1"
              onClick={() => setActiveStep(1)}
              style={{ cursor: 'pointer' }}
            >
              <div className="wt-step-icon-col">
                <div className="wt-step-badge">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                    <line x1="8" y1="21" x2="16" y2="21"/>
                    <line x1="12" y1="17" x2="12" y2="21"/>
                  </svg>
                  <span className="wt-step-num">1</span>
                </div>
                <div className="wt-step-line">
                  <span className="wt-step-line-beam"></span>
                </div>
              </div>
              <div className="wt-step-info">
                <h3 className="wt-step-title">Create Account</h3>
                <p className="wt-step-desc">Sign up and set up your organization in less than two minutes.</p>
              </div>
            </div>

            {/* Step 2 */}
            <div
              className={`wt-step-item ${activeStep === 2 ? 'active' : ''}`}
              data-step="2"
              onClick={() => setActiveStep(2)}
              style={{ cursor: 'pointer' }}
            >
              <div className="wt-step-icon-col">
                <div className="wt-step-badge">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="8.5" cy="7" r="4"/>
                    <line x1="20" y1="8" x2="20" y2="14"/>
                    <line x1="23" y1="11" x2="17" y2="11"/>
                  </svg>
                  <span className="wt-step-num">2</span>
                </div>
                <div className="wt-step-line">
                  <span className="wt-step-line-beam"></span>
                </div>
              </div>
              <div className="wt-step-info">
                <h3 className="wt-step-title">Add Employees</h3>
                <p className="wt-step-desc">Invite team members via email and set customized role permissions.</p>
              </div>
            </div>

            {/* Step 3 */}
            <div
              className={`wt-step-item ${activeStep === 3 ? 'active' : ''}`}
              data-step="3"
              onClick={() => setActiveStep(3)}
              style={{ cursor: 'pointer' }}
            >
              <div className="wt-step-icon-col">
                <div className="wt-step-badge">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="6 3 20 12 6 21 6 3"/>
                  </svg>
                  <span className="wt-step-num">3</span>
                </div>
              </div>
              <div className="wt-step-info">
                <h3 className="wt-step-title">Start Monitoring</h3>
                <p className="wt-step-desc">Track activity, generate automated reports, and get real-time insights.</p>
              </div>
            </div>
          </div>

          {/* Right Side: Dual-Panel Showcase Card (Add Employee Modal + Office Photo + Setup Complete Toast) */}
          <div className="wt-steps-right">
            <div className="wt-steps-showcase-card" id="stepsShowcaseCard">
              {/* Column 1: Add Employee Modal Form */}
              <div className="wt-form-mockup">
                <div className="wt-form-header">
                  <h4 className="wt-form-title">Add Employee</h4>
                  <span className="wt-form-close" title="Close">✕</span>
                </div>

                <form className="wt-form-fields" onSubmit={(e) => { e.preventDefault(); handleInvite(); }}>
                  <div className="wt-form-group">
                    <label className="wt-form-label">Full Name</label>
                    <div className="wt-form-input-box">
                      <input type="text" className="wt-step-input" defaultValue="John Smith" spellCheck={false} />
                    </div>
                  </div>

                  <div className="wt-form-group">
                    <label className="wt-form-label">Email</label>
                    <div className="wt-form-input-box">
                      <input type="email" className="wt-step-input" defaultValue="john@company.com" spellCheck={false} />
                    </div>
                  </div>

                  <div className="wt-form-group">
                    <label className="wt-form-label">Department</label>
                    <div className="wt-form-input-box wt-form-select-box">
                      <span className="wt-input-val">Development</span>
                      <svg className="wt-select-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="6 9 12 15 18 9"/>
                      </svg>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="wt-btn-invite"
                    id="inviteEmployeeBtn"
                    onClick={handleInvite}
                    style={
                      invited
                        ? { backgroundColor: '#10B981', boxShadow: '0 6px 20px rgba(16, 185, 129, 0.45)' }
                        : inviting
                        ? { backgroundColor: '#2563EB', opacity: 0.85 }
                        : {}
                    }
                  >
                    <span className="wt-invite-text">
                      {invited ? '✓ Invite Sent!' : inviting ? 'Inviting...' : 'Invite'}
                    </span>
                    <span className="wt-invite-ripple"></span>
                  </button>
                </form>
              </div>

              {/* Column 2: Photo of Employee + Floating Setup Complete Toast */}
              <div className="wt-employee-photo-wrap">
                <img
                  src="/images/employee-step-portrait.jpg"
                  alt="Happy smiling employee in office"
                  className="wt-employee-photo"
                  loading="lazy"
                />

                {/* Floating Setup Complete Toast Badge */}
                <div
                  className="wt-setup-complete-badge"
                  id="setupCompleteToast"
                  style={
                    invited
                      ? {
                          transform: 'scale(1.06) translateY(-8px)',
                          borderColor: '#10B981',
                          boxShadow: '0 16px 35px -4px rgba(16, 185, 129, 0.3)',
                          transition: 'all 0.4s ease',
                        }
                      : {}
                  }
                >
                  <div className="wt-complete-icon-circle">
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                      <path d="M3.5 8.2L6.5 11.2L12.5 4.8" stroke="#FFFFFF" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div className="wt-complete-text">
                    <strong className="wt-complete-bold">Setup Complete!</strong>
                    <span className="wt-complete-sub">Your team is now being monitored</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
