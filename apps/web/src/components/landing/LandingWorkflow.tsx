'use client'

import React, { useRef, useEffect, useState } from 'react'

export default function LandingWorkflow() {
  const deviceStageRef = useRef<HTMLDivElement>(null)
  const dashboardWindowRef = useRef<HTMLDivElement>(null)
  const floatingPhoneRef = useRef<HTMLDivElement>(null)
  const [liveSecs, setLiveSecs] = useState(8 * 3600 + 24 * 60 + 15)

  // Live stopwatch micro-ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setLiveSecs((prev) => prev + 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // 3D Parallax tilt effect
  useEffect(() => {
    const deviceStage = deviceStageRef.current
    const dashboardWindow = dashboardWindowRef.current
    const floatingPhone = floatingPhoneRef.current
    if (!deviceStage || !dashboardWindow || !floatingPhone) return

    const handleMouseMove = (e: MouseEvent) => {
      if (window.innerWidth <= 1024) return
      const rect = deviceStage.getBoundingClientRect()
      const xVal = (e.clientX - rect.left) / rect.width - 0.5
      const yVal = (e.clientY - rect.top) / rect.height - 0.5

      const tiltX = -yVal * 9
      const tiltY = xVal * 11
      dashboardWindow.style.transform = `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) translateZ(10px)`

      const phoneMoveX = xVal * 24
      const phoneMoveY = yVal * 20
      floatingPhone.style.transform = `translate3d(${phoneMoveX}px, ${phoneMoveY}px, 40px) rotateX(${tiltX * 0.8}deg) rotateY(${tiltY * 0.8}deg)`
    }

    const handleMouseLeave = () => {
      dashboardWindow.style.transform = ''
      floatingPhone.style.transform = ''
    }

    deviceStage.addEventListener('mousemove', handleMouseMove)
    deviceStage.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      deviceStage.removeEventListener('mousemove', handleMouseMove)
      deviceStage.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [])

  const hours = Math.floor(liveSecs / 3600)
  const minutes = Math.floor((liveSecs % 3600) / 60)
  const seconds = liveSecs % 60
  const secFormatted = seconds < 10 ? '0' + seconds : seconds

  return (
    <section className="wt-visibility" id="visibility">
      {/* Ambient Atmospheric Lighting Backdrop */}
      <div className="wt-vis-ambient-glow wt-vis-glow-blue"></div>
      <div className="wt-vis-ambient-glow wt-vis-glow-cyan"></div>

      <div className="wt-container wt-visibility-container">
        {/* Left Side: Interactive Dual Device Composition (Dashboard Window + Floating iPhone) */}
        <div className="wt-visibility-visual">
          <div className="wt-device-stage" id="deviceStage" ref={deviceStageRef}>

            {/* Floating Micro-Badge 1: Live Cloud Sync */}
            <div className="wt-orbit-chip wt-chip-top-left">
              <span className="wt-chip-pulse-dot"></span>
              <span>⚡ Cloud Sync &bull; 99.9% Uptime</span>
            </div>

            {/* Floating Micro-Badge 2: Bank-Grade Security */}
            <div className="wt-orbit-chip wt-chip-bottom-left">
              <span className="wt-chip-icon">🛡️</span>
              <span>256-Bit Encrypted Data</span>
            </div>

            {/* Sleek macOS / Web Dashboard Card Window */}
            <div className="wt-dashboard-window" id="dashboardWindow" ref={dashboardWindowRef}>
              {/* Window Chrome Header */}
              <div className="wt-window-chrome">
                <div className="wt-window-dots">
                  <span className="wt-wdot wt-wdot-close"></span>
                  <span className="wt-wdot wt-wdot-min"></span>
                  <span className="wt-wdot wt-wdot-max"></span>
                </div>
                <div className="wt-window-url-bar">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                  <span>app.tracmatrix.com/admin/dashboard</span>
                </div>
                <div className="wt-window-sync-tag">
                  <span className="wt-sync-live-dot"></span>
                  <span>Sync: Live</span>
                </div>
              </div>

              {/* Inner Dashboard App Canvas */}
              <div className="wt-dashboard-canvas">
                {/* Top Header: Team Overview + Live Active Badge */}
                <div className="wt-dash-topbar">
                  <div>
                    <h3 className="wt-dash-title">Team Overview</h3>
                    <p className="wt-dash-subtitle">Real-time productivity monitor</p>
                  </div>
                  <div className="wt-live-active-pill">
                    <span className="wt-live-active-dot"></span>
                    <span>Live Active</span>
                  </div>
                </div>

                {/* 3 Stat Metric Cards */}
                <div className="wt-dash-stats-row">
                  <div className="wt-dash-stat-card">
                    <span className="wt-dstat-val">24</span>
                    <span className="wt-dstat-lbl">Total Monitored</span>
                  </div>
                  <div className="wt-dash-stat-card wt-stat-card-highlight">
                    <span className="wt-dstat-val text-green">18</span>
                    <span className="wt-dstat-lbl">Productive</span>
                  </div>
                  <div className="wt-dash-stat-card">
                    <span className="wt-dstat-val text-blue">92%</span>
                    <span className="wt-dstat-lbl">Team Score</span>
                  </div>
                </div>

                {/* Middle Row: Time Tracking Donut + Live Team Roster */}
                <div className="wt-dash-mid-grid">
                  {/* Time Tracking Circular Donut Box */}
                  <div className="wt-dash-card wt-donut-widget">
                    <div className="wt-widget-header">
                      <span className="wt-widget-name">Time Tracking</span>
                    </div>
                    <div className="wt-donut-circle-wrap">
                      <svg viewBox="0 0 40 40" className="wt-donut-svg">
                        <circle className="wt-donut-track" cx="20" cy="20" r="15.9155" />
                        <circle className="wt-donut-value" cx="20" cy="20" r="15.9155" strokeDasharray="78 100" strokeDashoffset="25" />
                      </svg>
                      <div className="wt-donut-inner-label">
                        <strong>78%</strong>
                      </div>
                    </div>
                    <div className="wt-donut-breakdown-legend">
                      <div className="wt-legend-item">
                        <span className="wt-lgt-dot bg-blue"></span>
                        <span className="wt-lgt-text">Productive <strong>78%</strong></span>
                      </div>
                      <div className="wt-legend-item">
                        <span className="wt-lgt-dot bg-teal"></span>
                        <span className="wt-lgt-text">Neutral <strong>14%</strong></span>
                      </div>
                      <div className="wt-legend-item">
                        <span className="wt-lgt-dot bg-gray"></span>
                        <span className="wt-lgt-text">Idle <strong>8%</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Live Team Members List */}
                  <div className="wt-dash-card wt-roster-widget">
                    <div className="wt-roster-item">
                      <div className="wt-roster-avatar avatar-blue">FA</div>
                      <div className="wt-roster-meta">
                        <span className="wt-roster-name">Fahim Ahmed</span>
                        <span className="wt-roster-role">Frontend Dev</span>
                      </div>
                      <span className="wt-roster-score text-green">94%</span>
                    </div>

                    <div className="wt-roster-item">
                      <div className="wt-roster-avatar avatar-pink">NJ</div>
                      <div className="wt-roster-meta">
                        <span className="wt-roster-name">Nusrat Jahan</span>
                        <span className="wt-roster-role">UI/UX Designer</span>
                      </div>
                      <span className="wt-roster-score text-green">88%</span>
                    </div>

                    <div className="wt-roster-item">
                      <div className="wt-roster-avatar avatar-green">SH</div>
                      <div className="wt-roster-meta">
                        <span className="wt-roster-name">Sabber Hasan</span>
                        <span className="wt-roster-role">Backend Lead</span>
                      </div>
                      <span className="wt-roster-score text-green">85%</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Row: Recent Screenshots */}
                <div className="wt-dash-card wt-shots-widget">
                  <div className="wt-widget-header wt-shots-head">
                    <span className="wt-widget-name">Recent Screenshots</span>
                    <span className="wt-shots-auto-tag">Auto-Captured</span>
                  </div>
                  <div className="wt-shots-thumbnails">
                    <div className="wt-shot-thumb">
                      <div className="wt-shot-screen-ph">
                        <div className="wt-shot-lines">
                          <span className="wt-sline"></span>
                          <span className="wt-sline sline-short"></span>
                        </div>
                      </div>
                      <span className="wt-shot-time">10:45 AM</span>
                    </div>
                    <div className="wt-shot-thumb active">
                      <div className="wt-shot-screen-ph active">
                        <div className="wt-shot-lines">
                          <span className="wt-sline"></span>
                          <span className="wt-sline sline-short"></span>
                        </div>
                      </div>
                      <span className="wt-shot-time">10:50 AM</span>
                    </div>
                    <div className="wt-shot-thumb">
                      <div className="wt-shot-screen-ph">
                        <div className="wt-shot-lines">
                          <span className="wt-sline"></span>
                          <span className="wt-sline sline-short"></span>
                        </div>
                      </div>
                      <span className="wt-shot-time">10:55 AM</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Modern Smartphone Mockup (Overlapping & Levitating) */}
            <div className="wt-floating-phone-wrap" id="floatingPhone" ref={floatingPhoneRef}>
              <div className="wt-phone-glass-glare"></div>

              <div className="wt-phone-device">
                <div className="wt-phone-dynamic-island">
                  <span className="wt-island-cam"></span>
                  <span className="wt-island-sensor"></span>
                </div>

                <div className="wt-phone-screen">
                  {/* Status Bar */}
                  <div className="wt-phone-statusbar">
                    <span className="wt-phone-clock">9:41</span>
                    <div className="wt-phone-icons">
                      <span className="wt-phone-cell">5G</span>
                      <div className="wt-phone-batt">
                        <span className="wt-batt-level"></span>
                      </div>
                    </div>
                  </div>

                  {/* Phone Header */}
                  <div className="wt-phone-appbar">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <img src="/images/trackmatrix-icon.png" alt="Tracmatrix Icon" style={{ width: '16px', height: '16px', objectFit: 'contain' }} />
                      <span className="wt-phone-brand">Tracmatrix</span>
                    </div>
                    <div className="wt-phone-profile">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="#3B82F6">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                      </svg>
                    </div>
                  </div>

                  {/* Today Hours Card */}
                  <div className="wt-phone-today-card">
                    <span className="wt-ptoday-lbl">Today</span>
                    <h4 className="wt-ptoday-hours">
                      <span id="liveHoursCounter">{hours}h {minutes}m <span style={{ fontSize: '13px', fontWeight: 600, opacity: 0.75, color: '#3B82F6' }}>{secFormatted}s</span></span>
                    </h4>
                    <div className="wt-ptoday-status">
                      <span className="wt-ptoday-pulse"></span>
                      <span>On Track</span>
                    </div>
                  </div>

                  {/* App Breakdown Progress Bars */}
                  <div className="wt-phone-app-list">
                    <div className="wt-app-row">
                      <span className="wt-app-title">Chrome</span>
                      <div className="wt-app-bar-bg">
                        <div className="wt-app-bar-fill fill-blue" style={{ width: '42%' }}>
                          <span className="wt-bar-shimmer"></span>
                        </div>
                      </div>
                      <span className="wt-app-pct">42%</span>
                    </div>

                    <div className="wt-app-row">
                      <span className="wt-app-title">VS Code</span>
                      <div className="wt-app-bar-bg">
                        <div className="wt-app-bar-fill fill-indigo" style={{ width: '28%' }}>
                          <span className="wt-bar-shimmer"></span>
                        </div>
                      </div>
                      <span className="wt-app-pct">28%</span>
                    </div>

                    <div className="wt-app-row">
                      <span className="wt-app-title">YouTube</span>
                      <div className="wt-app-bar-bg">
                        <div className="wt-app-bar-fill fill-amber" style={{ width: '14%' }}>
                          <span className="wt-bar-shimmer"></span>
                        </div>
                      </div>
                      <span className="wt-app-pct">14%</span>
                    </div>

                    <div className="wt-app-row">
                      <span className="wt-app-title">Zoom</span>
                      <div className="wt-app-bar-bg">
                        <div className="wt-app-bar-fill fill-cyan" style={{ width: '10%' }}>
                          <span className="wt-bar-shimmer"></span>
                        </div>
                      </div>
                      <span className="wt-app-pct">10%</span>
                    </div>

                    <div className="wt-app-row">
                      <span className="wt-app-title">Others</span>
                      <div className="wt-app-bar-bg">
                        <div className="wt-app-bar-fill fill-gray" style={{ width: '6%' }}>
                          <span className="wt-bar-shimmer"></span>
                        </div>
                      </div>
                      <span className="wt-app-pct">6%</span>
                    </div>
                  </div>

                  <a href="#pricing" className="wt-phone-btn-detail">
                    <span>View Detail</span>
                  </a>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Right Side: Crisp SaaS Typography & Visual Feature Highlights */}
        <div className="wt-visibility-content">
          <div className="wt-realtime-badge">
            <span className="wt-badge-plus">+</span>
            <span>REAL-TIME INSIGHTS</span>
          </div>

          <h2 className="wt-visibility-title">
            Gain Full Visibility,<br />
            <span className="wt-title-gradient">Anywhere, Anytime</span>
          </h2>

          <p className="wt-visibility-sub">
            Whether your team works in the office, remotely, or hybrid &mdash; Tracmatrix gives you complete control and peace of mind.
          </p>

          <div className="wt-visibility-checklist">
            <div className="wt-check-item">
              <div className="wt-check-circle">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path d="M3.5 8.2L6.5 11.2L12.5 4.8" stroke="#FFFFFF" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className="wt-check-text">Monitor from any device</span>
            </div>

            <div className="wt-check-item">
              <div className="wt-check-circle">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path d="M3.5 8.2L6.5 11.2L12.5 4.8" stroke="#FFFFFF" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className="wt-check-text">Easy and simple to use</span>
            </div>

            <div className="wt-check-item">
              <div className="wt-check-circle">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path d="M3.5 8.2L6.5 11.2L12.5 4.8" stroke="#FFFFFF" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className="wt-check-text">Secure and reliable</span>
            </div>

            <div className="wt-check-item">
              <div className="wt-check-circle">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path d="M3.5 8.2L6.5 11.2L12.5 4.8" stroke="#FFFFFF" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className="wt-check-text">Improve productivity &amp; performance</span>
            </div>
          </div>

          <div className="wt-visibility-cta-box">
            <a href="#features" className="wt-btn-explore-features">
              <span>Explore All Features</span>
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                <path d="M7.5 4.16669L13.3333 10L7.5 15.8334" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
