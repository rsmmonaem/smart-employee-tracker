import React from 'react'

export default function LandingIntegrations() {
  return (
    <section className="wt-integrations" id="integrations">
      <div className="wt-container">
        {/* Section Header */}
        <div className="wt-integrations-header">
          <div className="wt-pill-eyebrow">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 0L9.8 5.4L15.2 7.2L9.8 9L8 14.4L6.2 9L0.8 7.2L6.2 5.4L8 0Z"/>
            </svg>
            <span>INTEGRATIONS</span>
          </div>
          <h2 className="wt-section-title">
            Works Seamlessly With <span className="wt-highlight-blue">Your Favorite Tools</span>
          </h2>
          <p className="wt-section-subtitle">
            Connect with the tools you already use and get more out of Tracmatrix.
          </p>
        </div>

        {/* 7 Integrations Grid / Row */}
        <div className="wt-integrations-row">
          {/* Google Workspace */}
          <div className="wt-tool-pill">
            <div className="wt-tool-icon">
              <svg width="22" height="22" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
                <path fill="#FBBC05" d="M5.28 14.27A7.03 7.03 0 0 1 4.9 12c0-.79.14-1.57.38-2.27V6.58H1.25A11.96 11.96 0 0 0 0 12c0 1.92.45 3.74 1.25 5.42l4.03-3.15z"/>
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
              </svg>
            </div>
            <span className="wt-tool-name">Google Workspace</span>
          </div>

          {/* Microsoft 365 */}
          <div className="wt-tool-pill">
            <div className="wt-tool-icon">
              <svg width="22" height="22" viewBox="0 0 24 24">
                <rect x="1" y="1" width="10" height="10" fill="#F25022"/>
                <rect x="13" y="1" width="10" height="10" fill="#7FBA00"/>
                <rect x="1" y="13" width="10" height="10" fill="#00A4EF"/>
                <rect x="13" y="13" width="10" height="10" fill="#FFB900"/>
              </svg>
            </div>
            <span className="wt-tool-name">Microsoft 365</span>
          </div>

          {/* Slack */}
          <div className="wt-tool-pill">
            <div className="wt-tool-icon">
              <svg width="22" height="22" viewBox="0 0 24 24">
                <circle cx="7" cy="8" r="2.5" fill="#E01E5A"/>
                <rect x="5.5" y="12" width="3" height="7" rx="1.5" fill="#36C5F0"/>
                <circle cx="17" cy="12" r="2.5" fill="#2EB67D"/>
                <rect x="11" y="10.5" width="7" height="3" rx="1.5" fill="#ECB22E"/>
              </svg>
            </div>
            <span className="wt-tool-name">Slack</span>
          </div>

          {/* Zoom */}
          <div className="wt-tool-pill">
            <div className="wt-tool-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <rect width="24" height="24" rx="6" fill="#2D8CFF"/>
                <path d="M5 8.5C5 7.67 5.67 7 6.5 7H13.5C14.33 7 15 7.67 15 8.5V15.5C15 16.33 14.33 17 13.5 17H6.5C5.67 17 5 16.33 5 15.5V8.5Z" fill="white"/>
                <path d="M15 10.5L19 7.5V16.5L15 13.5V10.5Z" fill="white"/>
              </svg>
            </div>
            <span className="wt-tool-name">Zoom</span>
          </div>

          {/* Trello */}
          <div className="wt-tool-pill">
            <div className="wt-tool-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <rect width="24" height="24" rx="5" fill="#0079BF"/>
                <rect x="4" y="4" width="6.5" height="14" rx="2" fill="white"/>
                <rect x="13.5" y="4" width="6.5" height="9" rx="2" fill="white"/>
              </svg>
            </div>
            <span className="wt-tool-name">Trello</span>
          </div>

          {/* GitHub */}
          <div className="wt-tool-pill">
            <div className="wt-tool-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="#24292F">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
              </svg>
            </div>
            <span className="wt-tool-name">GitHub</span>
          </div>

          {/* Jira */}
          <div className="wt-tool-pill">
            <div className="wt-tool-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M11.53 2H2v9.53a9.53 9.53 0 0 0 9.53-9.53Z" fill="#0052CC"/>
                <path d="M12.47 11.53a9.53 9.53 0 0 0 9.53-9.53H12.47v9.53Z" fill="#2684FF"/>
                <path d="M12.47 22a9.53 9.53 0 0 0 9.53-9.53H12.47V22Z" fill="#0052CC"/>
              </svg>
            </div>
            <span className="wt-tool-name">Jira</span>
          </div>
        </div>
      </div>
    </section>
  )
}
