'use client'

import React from 'react'

export default function LandingReports() {
  const handleExport = () => {
    alert('Exporting sample PDF report for Tracmatrix...')
  }

  return (
    <section className="wt-reports" id="reports">
      <div className="wt-container wt-reports-container">
        {/* Left Side: Content & Checklist */}
        <div className="wt-reports-content">
          <div className="wt-pill-eyebrow">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 0L9.8 5.4L15.2 7.2L9.8 9L8 14.4L6.2 9L0.8 7.2L6.2 5.4L8 0Z"/>
            </svg>
            <span>DETAILED REPORTS</span>
          </div>

          <h2 className="wt-section-title">
            Turn Data into<br />
            <span className="wt-highlight-blue">Better Decisions</span>
          </h2>

          <p className="wt-section-subtitle">
            Get detailed and customizable reports to analyze your team&apos;s performance, working hours, and productivity trends.
          </p>

          <ul className="wt-reports-checklist">
            <li className="wt-rep-check-item">
              <span className="wt-rep-bullet">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path d="M4 8.5L6.5 11L12 5.5" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
              <span>Productivity reports</span>
            </li>
            <li className="wt-rep-check-item">
              <span className="wt-rep-bullet">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path d="M4 8.5L6.5 11L12 5.5" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
              <span>Attendance &amp; leave reports</span>
            </li>
            <li className="wt-rep-check-item">
              <span className="wt-rep-bullet">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path d="M4 8.5L6.5 11L12 5.5" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
              <span>App &amp; website usage</span>
            </li>
            <li className="wt-rep-check-item">
              <span className="wt-rep-bullet">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path d="M4 8.5L6.5 11L12 5.5" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
              <span>Export to PDF, Excel or CSV</span>
            </li>
            <li className="wt-rep-check-item">
              <span className="wt-rep-bullet">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path d="M4 8.5L6.5 11L12 5.5" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
              <span>Custom date range and filters</span>
            </li>
          </ul>

          <div className="wt-reports-action">
            <a href="#pricing" className="wt-btn-primary">
              <span>Explore Reports</span>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M6 3L11 8L6 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </a>
          </div>
        </div>

        {/* Right Side: Interactive Productivity Report Card */}
        <div className="wt-reports-visual">
          <div className="wt-report-card">
            {/* Report Card Header */}
            <div className="wt-report-header">
              <div className="wt-rep-title-group">
                <h4 className="wt-rep-title">Productivity Report</h4>
                <div className="wt-rep-filter-pill">
                  <span>Last 7 Days</span>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
              <button type="button" className="wt-btn-export-pdf" id="exportPdfBtn" onClick={handleExport}>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M14 10v3a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-3h2v2h8v-2h2zM7 2v6.586L4.707 6.293 3.293 7.707 8 12.414l4.707-4.707-1.414-1.414L9 8.586V2H7z"/>
                </svg>
                <span>Export PDF</span>
              </button>
            </div>

            {/* Legend */}
            <div className="wt-rep-legend-row">
              <div className="wt-rep-legend-item">
                <span className="wt-leg-dot wt-dot-blue"></span>
                <span className="wt-leg-txt">Productive <strong>68%</strong></span>
              </div>
              <div className="wt-rep-legend-item">
                <span className="wt-leg-dot wt-dot-teal"></span>
                <span className="wt-leg-txt">Inactive <strong>18%</strong></span>
              </div>
            </div>

            {/* Custom Bar Chart Visualizer */}
            <div className="wt-rep-chart-container">
              <div className="wt-chart-bars">
                <div className="wt-bar-col" title="Mon"><div className="wt-bar-fill" style={{ height: '48%' }}></div><span className="wt-day-lbl">M</span></div>
                <div className="wt-bar-col" title="Tue"><div className="wt-bar-fill" style={{ height: '65%' }}></div><span className="wt-day-lbl">T</span></div>
                <div className="wt-bar-col" title="Wed"><div className="wt-bar-fill" style={{ height: '82%' }}></div><span className="wt-day-lbl">W</span></div>
                <div className="wt-bar-col" title="Thu"><div className="wt-bar-fill" style={{ height: '70%' }}></div><span className="wt-day-lbl">T</span></div>
                <div className="wt-bar-col" title="Fri"><div className="wt-bar-fill" style={{ height: '90%' }}></div><span className="wt-day-lbl">F</span></div>
                <div className="wt-bar-col" title="Sat"><div className="wt-bar-fill" style={{ height: '52%' }}></div><span className="wt-day-lbl">S</span></div>
                <div className="wt-bar-col" title="Sun"><div className="wt-bar-fill" style={{ height: '38%' }}></div><span className="wt-day-lbl">S</span></div>
                <div className="wt-bar-col" title="Mon"><div className="wt-bar-fill" style={{ height: '78%' }}></div><span className="wt-day-lbl">M</span></div>
                <div className="wt-bar-col" title="Tue"><div className="wt-bar-fill" style={{ height: '86%' }}></div><span className="wt-day-lbl">T</span></div>
                <div className="wt-bar-col" title="Wed"><div className="wt-bar-fill" style={{ height: '62%' }}></div><span className="wt-day-lbl">W</span></div>
                <div className="wt-bar-col" title="Thu"><div className="wt-bar-fill" style={{ height: '94%' }}></div><span className="wt-day-lbl">T</span></div>
                <div className="wt-bar-col" title="Fri"><div className="wt-bar-fill" style={{ height: '88%' }}></div><span className="wt-day-lbl">F</span></div>
              </div>
            </div>

            {/* Employee Ranking Table */}
            <div className="wt-table-responsive">
              <table className="wt-employee-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Total Hours</th>
                    <th>Productive</th>
                    <th>Idle</th>
                    <th>Activity</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <div className="wt-table-user">
                        <div className="wt-avatar-circle wt-bg-indigo">FA</div>
                        <div>
                          <span className="wt-tbl-name">Fahim Ahmed</span>
                          <span className="wt-tbl-sub">Sr. Engineer</span>
                        </div>
                      </div>
                    </td>
                    <td>8h 24m</td>
                    <td className="wt-text-green font-medium">6h 15m</td>
                    <td className="wt-text-muted">1h 20m</td>
                    <td><span className="wt-badge-pct green">92%</span></td>
                  </tr>
                  <tr>
                    <td>
                      <div className="wt-table-user">
                        <div className="wt-avatar-circle wt-bg-purple">NJ</div>
                        <div>
                          <span className="wt-tbl-name">Nusrat Jahan</span>
                          <span className="wt-tbl-sub">Product Designer</span>
                        </div>
                      </div>
                    </td>
                    <td>7h 56m</td>
                    <td className="wt-text-green font-medium">5h 45m</td>
                    <td className="wt-text-muted">1h 10m</td>
                    <td><span className="wt-badge-pct green">88%</span></td>
                  </tr>
                  <tr>
                    <td>
                      <div className="wt-table-user">
                        <div className="wt-avatar-circle wt-bg-blue">SH</div>
                        <div>
                          <span className="wt-tbl-name">Sabber Hasan</span>
                          <span className="wt-tbl-sub">Lead Architect</span>
                        </div>
                      </div>
                    </td>
                    <td>8h 10m</td>
                    <td className="wt-text-green font-medium">6h 30m</td>
                    <td className="wt-text-muted">1h 40m</td>
                    <td><span className="wt-badge-pct green">85%</span></td>
                  </tr>
                  <tr>
                    <td>
                      <div className="wt-table-user">
                        <div className="wt-avatar-circle wt-bg-teal">TA</div>
                        <div>
                          <span className="wt-tbl-name">Tanvir Akter</span>
                          <span className="wt-tbl-sub">QA Engineer</span>
                        </div>
                      </div>
                    </td>
                    <td>7h 20m</td>
                    <td className="wt-text-green font-medium">5h 10m</td>
                    <td className="wt-text-muted">2h 10m</td>
                    <td><span className="wt-badge-pct teal">78%</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
