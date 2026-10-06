'use client'

import React from 'react'

export default function LandingFeatures() {
  return (
    <section className="wt-features" id="features">
      <div className="wt-container">
        {/* Section Header with space-between layout */}
        <div className="wt-features-header">
          <div className="wt-features-header-left">
            <div className="wt-pill-eyebrow">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 0L9.8 5.4L15.2 7.2L9.8 9L8 14.4L6.2 9L0.8 7.2L6.2 5.4L8 0Z"/>
              </svg>
              <span>KEY FEATURES</span>
            </div>
            <h2 className="wt-section-title">
              Everything You Need to<br />
              <span className="wt-highlight-blue">Monitor and Manage Your Team</span>
            </h2>
            <p className="wt-section-subtitle">
              From real-time activity tracking to detailed reports, Tracmatrix gives you the tools to build a more focused, secure and productive team.
            </p>
          </div>
          <div className="wt-features-header-right">
            <a href="#pricing" className="wt-link-explore">
              <span>Explore All Features</span>
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                <path d="M4.16669 10H15.8334M15.8334 10L10.8334 5M15.8334 10L10.8334 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </a>
          </div>
        </div>

        {/* 8 Interactive Features Grid with Live Software Demonstrations */}
        <div className="wt-features-grid">

          {/* 1. Real-time Activity Monitoring */}
          <div className="wt-feature-card wt-feat-blue">
            <div className="wt-card-top-row">
              <div className="wt-feature-icon-box wt-bg-grad-blue">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                  <line x1="8" y1="21" x2="16" y2="21"/>
                  <line x1="12" y1="17" x2="12" y2="21"/>
                </svg>
              </div>
              <span className="wt-card-live-pill">
                <span className="wt-live-dot-green"></span>
                LIVE SYNC
              </span>
            </div>

            <h3 className="wt-feature-title">Real-time Activity Monitoring</h3>
            <p className="wt-feature-desc">See what your team is doing right now &mdash; active apps, websites and files.</p>

            {/* Micro Software UI Simulation */}
            <div className="wt-feature-micro-demo">
              <div className="wt-micro-active-app">
                <div className="wt-micro-app-icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.5"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
                </div>
                <div className="wt-micro-app-meta">
                  <span className="wt-micro-app-name">VS Code &bull; MainApp.js</span>
                  <span className="wt-micro-app-time">Active: 4h 15m</span>
                </div>
                <span className="wt-micro-app-tag active">98% Active</span>
              </div>
              {/* Live Scanning Light Beam */}
              <div className="wt-scan-tracker">
                <div className="wt-scan-pulse"></div>
              </div>
            </div>
          </div>

          {/* 2. Screenshots & Timelapse */}
          <div className="wt-feature-card wt-feat-purple">
            <div className="wt-card-top-row">
              <div className="wt-feature-icon-box wt-bg-grad-purple">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                  <circle cx="12" cy="13" r="4"/>
                </svg>
              </div>
              <span className="wt-card-tag-badge">AUTOCAPTURE</span>
            </div>

            <h3 className="wt-feature-title">Screenshots &amp; Timelapse</h3>
            <p className="wt-feature-desc">Capture periodic screenshots and timelapse videos for full visibility.</p>

            {/* Micro Software UI Simulation: 3 Screenshots strip */}
            <div className="wt-feature-micro-demo">
              <div className="wt-shot-preview-row">
                <div className="wt-micro-shot">
                  <span className="wt-shot-time">10:40 AM</span>
                </div>
                <div className="wt-micro-shot wt-shot-captured">
                  <span className="wt-shutter-flash"></span>
                  <span className="wt-shot-time">10:45 AM</span>
                </div>
                <div className="wt-micro-shot">
                  <span className="wt-shot-time">10:50 AM</span>
                </div>
              </div>
              <div className="wt-shot-footer">
                <span className="wt-shutter-status">Interval: Every 5 Mins &bull; 1080p HD</span>
                <span className="wt-privacy-blur">Privacy Blur: ON</span>
              </div>
            </div>
          </div>

          {/* 3. Time Tracking */}
          <div className="wt-feature-card wt-feat-mint">
            <div className="wt-card-top-row">
              <div className="wt-feature-icon-box wt-bg-grad-mint">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
              </div>
              <span className="wt-card-tag-badge">ACCURATE</span>
            </div>

            <h3 className="wt-feature-title">Time Tracking</h3>
            <p className="wt-feature-desc">Track productive hours, idle time and detailed work logs.</p>

            {/* Micro Software UI Simulation: Live Digital Stopwatch */}
            <div className="wt-feature-micro-demo">
              <div className="wt-timer-display">
                <div className="wt-timer-digits">
                  <span className="wt-time-unit">07</span><span className="wt-colon">:</span>
                  <span className="wt-time-unit">45</span><span className="wt-colon">:</span>
                  <span className="wt-time-unit wt-seconds-tick">18</span>
                </div>
                <div className="wt-timer-pill">
                  <span className="wt-pulse-core"></span>
                  TRACKING
                </div>
              </div>
              <div className="wt-timer-bar-wrap">
                <div className="wt-timer-bar-fill" style={{ width: '88%' }}></div>
              </div>
              <div className="wt-timer-split">
                <span>Productive: 6h 52m</span>
                <span className="wt-text-green font-bold">88% Score</span>
              </div>
            </div>
          </div>

          {/* 4. Website & App Usage */}
          <div className="wt-feature-card wt-feat-cyan">
            <div className="wt-card-top-row">
              <div className="wt-feature-icon-box wt-bg-grad-cyan">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7"/>
                  <rect x="14" y="3" width="7" height="7"/>
                  <rect x="14" y="14" width="7" height="7"/>
                  <rect x="3" y="14" width="7" height="7"/>
                </svg>
              </div>
              <span className="wt-card-tag-badge">ANALYTICS</span>
            </div>

            <h3 className="wt-feature-title">Website &amp; App Usage</h3>
            <p className="wt-feature-desc">Know which websites and applications your team uses during work hours.</p>

            {/* Micro Software UI Simulation: Categorized Apps List */}
            <div className="wt-feature-micro-demo">
              <div className="wt-usage-mini-list">
                <div className="wt-usage-item">
                  <span className="wt-usage-label">Google Chrome</span>
                  <div className="wt-usage-track"><div className="wt-usage-fill wt-bg-blue" style={{ width: '48%' }}></div></div>
                  <span className="wt-usage-pct">48%</span>
                </div>
                <div className="wt-usage-item">
                  <span className="wt-usage-label">Figma Design</span>
                  <div className="wt-usage-track"><div className="wt-usage-fill wt-bg-purple" style={{ width: '34%' }}></div></div>
                  <span className="wt-usage-pct">34%</span>
                </div>
                <div className="wt-usage-item">
                  <span className="wt-usage-label">Slack Comms</span>
                  <div className="wt-usage-track"><div className="wt-usage-fill wt-bg-teal" style={{ width: '18%' }}></div></div>
                  <span className="wt-usage-pct">18%</span>
                </div>
              </div>
            </div>
          </div>

          {/* 5. Attendance Management */}
          <div className="wt-feature-card wt-feat-indigo">
            <div className="wt-card-top-row">
              <div className="wt-feature-icon-box wt-bg-grad-indigo">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                  <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01"/>
                </svg>
              </div>
              <span className="wt-card-tag-badge">AUTOMATED</span>
            </div>

            <h3 className="wt-feature-title">Attendance Management</h3>
            <p className="wt-feature-desc">Track check-ins, check-outs, leaves and overtime hours automatically.</p>

            {/* Micro Software UI Simulation: Punch Status Card */}
            <div className="wt-feature-micro-demo">
              <div className="wt-punch-card">
                <div className="wt-punch-left">
                  <span className="wt-punch-type">Clock In</span>
                  <strong className="wt-punch-time">09:00 AM</strong>
                </div>
                <div className="wt-punch-badge on-time">
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/></svg>
                  On-Time
                </div>
              </div>
              <div className="wt-punch-sub">
                <span>Work Shift: 9:00 AM &ndash; 6:00 PM</span>
                <span className="wt-overtime-pill">+0.5h OT</span>
              </div>
            </div>
          </div>

          {/* 6. Employee Productivity */}
          <div className="wt-feature-card wt-feat-amber">
            <div className="wt-card-top-row">
              <div className="wt-feature-icon-box wt-bg-grad-amber">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                </svg>
              </div>
              <span className="wt-card-tag-badge">AI INSIGHTS</span>
            </div>

            <h3 className="wt-feature-title">Employee Productivity</h3>
            <p className="wt-feature-desc">Get insights into individual and team performance with smart reports.</p>

            {/* Micro Software UI Simulation: Productivity Velocity Chart */}
            <div className="wt-feature-micro-demo">
              <div className="wt-prod-row">
                <div className="wt-prod-metric">
                  <span className="wt-prod-num">94.2%</span>
                  <span className="wt-prod-label">Productivity Index</span>
                </div>
                <div className="wt-prod-trend-pill">
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path fillRule="evenodd" d="M14 2.5a.5.5 0 0 0-.5-.5h-6a.5.5 0 0 0 0 1h4.793L2.146 13.146a.5.5 0 0 0 .708.708L13 3.707V8.5a.5.5 0 0 0 1 0v-6z"/></svg>
                  +12% Trend
                </div>
              </div>
              <div className="wt-micro-sparkline">
                <span className="wt-spark-bar" style={{ height: '40%' }}></span>
                <span className="wt-spark-bar" style={{ height: '60%' }}></span>
                <span className="wt-spark-bar" style={{ height: '55%' }}></span>
                <span className="wt-spark-bar" style={{ height: '80%' }}></span>
                <span className="wt-spark-bar" style={{ height: '75%' }}></span>
                <span className="wt-spark-bar" style={{ height: '95%' }}></span>
                <span className="wt-spark-bar wt-spark-top" style={{ height: '100%' }}></span>
              </div>
            </div>
          </div>

          {/* 7. Alerts & Risk Users */}
          <div className="wt-feature-card wt-feat-rose">
            <div className="wt-card-top-row">
              <div className="wt-feature-icon-box wt-bg-grad-rose">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
              </div>
              <span className="wt-card-alert-badge">SECURITY</span>
            </div>

            <h3 className="wt-feature-title">Alerts &amp; Risk Users</h3>
            <p className="wt-feature-desc">Detect unusual behavior, policy violations and high-risk users instantly.</p>

            {/* Micro Software UI Simulation: Instant Security Toast Alert */}
            <div className="wt-feature-micro-demo">
              <div className="wt-alert-toast">
                <span className="wt-alert-icon-ring">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#E11D48" strokeWidth="3"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                </span>
                <div className="wt-alert-msg">
                  <strong className="wt-alert-title">Excessive Idle Detected</strong>
                  <span className="wt-alert-sub">User away from desk &gt; 45 mins</span>
                </div>
              </div>
              <div className="wt-alert-status-bar">
                <span>Smart Audit Protection: Active</span>
                <span className="wt-text-green font-bold">&check; Secured</span>
              </div>
            </div>
          </div>

          {/* 8. Reports & Analytics */}
          <div className="wt-feature-card wt-feat-teal">
            <div className="wt-card-top-row">
              <div className="wt-feature-icon-box wt-bg-grad-teal">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="20" x2="18" y2="10"/>
                  <line x1="12" y1="20" x2="12" y2="4"/>
                  <line x1="6" y1="20" x2="6" y2="14"/>
                </svg>
              </div>
              <span className="wt-card-tag-badge">ONE-CLICK EXPORT</span>
            </div>

            <h3 className="wt-feature-title">Reports &amp; Analytics</h3>
            <p className="wt-feature-desc">Generate detailed reports in PDF, Excel, or CSV formats with 1-click.</p>

            {/* Micro Software UI Simulation: Export Format Pills */}
            <div className="wt-feature-micro-demo">
              <div className="wt-export-file-preview">
                <div className="wt-file-meta">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0D9488" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                  <span>Team_Weekly_Report.pdf</span>
                </div>
                <span className="wt-ready-tag">Ready</span>
              </div>
              <div className="wt-export-format-pills">
                <span className="wt-format-chip">PDF</span>
                <span className="wt-format-chip">Excel / XLS</span>
                <span className="wt-format-chip">CSV</span>
                <span className="wt-format-chip wt-chip-download">
                  <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor"><path d="M8 12l-4-4h2.5V2h3v6H12l-4 4zm-6 2h12v1.5H2V14z"/></svg>
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
