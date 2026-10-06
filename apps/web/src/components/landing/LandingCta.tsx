'use client'

import React from 'react'

export default function LandingCta() {
  const handleBookDemo = () => {
    alert('Thank you for your interest! A product specialist from Tracmatrix will connect with you.')
  }

  return (
    <section className="wt-cta-section" id="trial">
      <div className="wt-container">
        <div className="wt-cta-box">
          {/* Glow background overlay */}
          <div className="wt-cta-glow"></div>

          <div className="wt-cta-inner">
            {/* Left text content */}
            <div className="wt-cta-left">
              <div className="wt-pill-eyebrow wt-eyebrow-dark">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 0L9.8 5.4L15.2 7.2L9.8 9L8 14.4L6.2 9L0.8 7.2L6.2 5.4L8 0Z"/>
                </svg>
                <span>READY TO GET STARTED?</span>
              </div>

              <h2 className="wt-cta-title">
                Take Control of Your Team&apos;s Productivity Today
              </h2>

              <p className="wt-cta-subtext">
                Join thousands of businesses that trust Tracmatrix. Start your free trial now and experience the difference.
              </p>
            </div>

            {/* Right button actions */}
            <div className="wt-cta-right">
              <a href="#pricing" className="wt-btn-primary wt-btn-cta">
                <span>Start Free Trial</span>
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                  <path d="M4.16669 10H15.8334M15.8334 10L10.8334 5M15.8334 10L10.8334 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </a>
              <button type="button" className="wt-btn-ghost-demo" id="ctaBookDemoBtn" onClick={handleBookDemo}>
                Book a Demo
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
