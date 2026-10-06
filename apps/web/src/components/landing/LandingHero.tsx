'use client'

import React, { useRef, useEffect } from 'react'

export default function LandingHero() {
  const sceneRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const heroScene = sceneRef.current
    if (!heroScene) return

    const floatCards = heroScene.querySelectorAll<HTMLElement>('.wt-hologram-card, .wt-float-card')

    const handleMouseMove = (e: MouseEvent) => {
      if (window.innerWidth <= 1024) return
      const rect = heroScene.getBoundingClientRect()
      const mouseX = e.clientX - rect.left - rect.width / 2
      const mouseY = e.clientY - rect.top - rect.height / 2

      floatCards.forEach((card) => {
        const speed = parseFloat(card.getAttribute('data-speed') || '1.0')
        const xOffset = mouseX * 0.04 * speed
        const yOffset = mouseY * 0.04 * speed
        card.style.transform = `translate(${xOffset}px, ${yOffset}px)`
      })
    }

    const handleMouseLeave = () => {
      floatCards.forEach((card) => {
        card.style.transform = ''
      })
    }

    heroScene.addEventListener('mousemove', handleMouseMove)
    heroScene.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      heroScene.removeEventListener('mousemove', handleMouseMove)
      heroScene.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [])

  const handleWatchDemo = () => {
    alert('Tracmatrix Interactive Demo: Welcome! Live product walkthrough tour starting...')
  }

  return (
    <section className="wt-hero-cinematic" id="home">
      {/* Cinematic Full-Bleed Panorama Background with Left Gradient Mask */}
      <div className="wt-hero-panoramic-bg"></div>
      <div className="wt-hero-grid-overlay"></div>
      <div className="wt-hero-ambient-glow"></div>

      <div className="wt-container wt-hero-master-container">
        {/* LEFT COLUMN: Live Semantic Crisp Content */}
        <div className="wt-hero-left-content">
          {/* Badge: ● Employee Monitoring Software */}
          <div className="wt-hero-pill-badge">
            <span className="wt-badge-dot-live"></span>
            <span className="wt-badge-cyan">Employee</span>
            <span className="wt-badge-white">Monitoring Software</span>
          </div>

          {/* Main Headline */}
          <h1 className="wt-hero-master-title">
            Track What Matters.<br />
            <span className="wt-hero-cyan-glow">Build a More Productive Team.</span>
          </h1>

          {/* Subtitle */}
          <p className="wt-hero-master-desc">
            Monitor work hours, track activity, and get real-time insights into your team&apos;s performance &mdash; all in one powerful platform.
          </p>

          {/* CTA Action Buttons */}
          <div className="wt-hero-actions-row">
            <a href="#pricing" className="wt-btn-master-primary">
              <span>Start Free Trial</span>
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                <path d="M4.16669 10H15.8334M15.8334 10L10.8334 5M15.8334 10L10.8334 15" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </a>
            <button type="button" className="wt-btn-master-demo" id="watchDemoBtn" onClick={handleWatchDemo}>
              <span className="wt-demo-play-icon">
                <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M4 2.667v10.666l9.333-5.333L4 2.667z"/>
                </svg>
              </span>
              <span>Watch Demo</span>
            </button>
          </div>

          {/* Trust Checkmarks */}
          <div className="wt-hero-trust-checks">
            <div className="wt-trust-check-item">
              <svg className="wt-check-icon-svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="8" fill="#1E3A8A"/>
                <path d="M5 8.2L7 10.2L11 6" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>No credit card required</span>
            </div>
            <div className="wt-trust-check-item">
              <svg className="wt-check-icon-svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="8" fill="#1E3A8A"/>
                <path d="M5 8.2L7 10.2L11 6" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>Setup in minutes</span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Interactive Animated Holographic Command Scene */}
        <div className="wt-hero-right-scene" id="heroInteractiveScene" ref={sceneRef}>
          {/* Animated High-Tech Connecting Circuit Lines (SVG) */}
          <svg className="wt-circuit-lines-svg" viewBox="0 0 600 480" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path className="wt-circuit-path" d="M 120 110 Q 180 180 320 280" />
            <path className="wt-circuit-path" d="M 280 100 Q 320 180 350 280" />
            <path className="wt-circuit-path" d="M 480 110 Q 420 190 380 290" />
            <path className="wt-circuit-path" d="M 140 250 Q 200 270 300 300" />
            <path className="wt-circuit-path" d="M 470 250 Q 420 280 390 320" />
            <path className="wt-circuit-path" d="M 110 390 Q 200 360 310 340" />

            {/* Pulsing Circuit Nodes */}
            <circle className="wt-node-dot" cx="120" cy="110" r="3.5" fill="#06B6D4"/>
            <circle className="wt-node-dot" cx="280" cy="100" r="3.5" fill="#8B5CF6"/>
            <circle className="wt-node-dot" cx="480" cy="110" r="3.5" fill="#38BDF8"/>
            <circle className="wt-node-dot" cx="140" cy="250" r="3.5" fill="#F43F5E"/>
            <circle className="wt-node-dot" cx="470" cy="250" r="3.5" fill="#F59E0B"/>
            <circle className="wt-node-dot" cx="110" cy="390" r="3.5" fill="#10B981"/>
          </svg>

          {/* 6 FLOATING ANIMATED GLASSMORPHISM FEATURE CARDS */}
          {/* 1. Time Tracking (Mint/Cyan) */}
          <div className="wt-hologram-card wt-holo-pos-1 wt-glow-cyan" data-speed="1.2">
            <div className="wt-holo-icon-wrap wt-icon-cyan">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
            <div className="wt-holo-text">
              <strong className="wt-holo-title">Time Tracking</strong>
              <span className="wt-holo-desc">Track working hours &amp; activities</span>
            </div>
          </div>

          {/* 2. Screenshots (Purple/Violet) */}
          <div className="wt-hologram-card wt-holo-pos-2 wt-glow-purple" data-speed="0.9">
            <div className="wt-holo-icon-wrap wt-icon-purple">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                <line x1="8" y1="21" x2="16" y2="21"/>
                <line x1="12" y1="17" x2="12" y2="21"/>
              </svg>
            </div>
            <div className="wt-holo-text">
              <strong className="wt-holo-title">Screenshots</strong>
              <span className="wt-holo-desc">View real-time screenshots</span>
            </div>
          </div>

          {/* 3. App & Website Usage (Cyan/Sky) */}
          <div className="wt-hologram-card wt-holo-pos-3 wt-glow-blue" data-speed="1.3">
            <div className="wt-holo-icon-wrap wt-icon-blue">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <line x1="3" y1="9" x2="21" y2="9"/>
                <line x1="9" y1="21" x2="9" y2="9"/>
              </svg>
            </div>
            <div className="wt-holo-text">
              <strong className="wt-holo-title">App &amp; Website Usage</strong>
              <span className="wt-holo-desc">See what tools &amp; sites they use</span>
            </div>
          </div>

          {/* 4. Location Tracking (Pink/Coral) */}
          <div className="wt-hologram-card wt-holo-pos-4 wt-glow-pink" data-speed="1.1">
            <div className="wt-holo-icon-wrap wt-icon-pink">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
            </div>
            <div className="wt-holo-text">
              <strong className="wt-holo-title">Location Tracking</strong>
              <span className="wt-holo-desc">Track remote teams</span>
            </div>
          </div>

          {/* 5. Reports (Amber/Orange) */}
          <div className="wt-hologram-card wt-holo-pos-5 wt-glow-amber" data-speed="1.4">
            <div className="wt-holo-icon-wrap wt-icon-amber">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
            </div>
            <div className="wt-holo-text">
              <strong className="wt-holo-title">Reports</strong>
              <span className="wt-holo-desc">Get detailed insights &amp; analytics</span>
            </div>
          </div>

          {/* 6. Employee Activity (Teal/Mint) */}
          <div className="wt-hologram-card wt-holo-pos-6 wt-glow-teal" data-speed="1.0">
            <div className="wt-holo-icon-wrap wt-icon-teal">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <div className="wt-holo-text">
              <strong className="wt-holo-title">Employee Activity</strong>
              <span className="wt-holo-desc">Monitor productivity &amp; behavior</span>
            </div>
          </div>

          {/* Floating Live Status Beacon on Laptop Area */}
          <div className="wt-laptop-live-beacon-pill" title="Live Synced">
            <span className="wt-beacon-pulse-dot"></span>
            <span>Tracmatrix Live Sync</span>
          </div>
        </div>
      </div>
    </section>
  )
}
