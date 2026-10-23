import React from 'react'

export default function LandingFooter() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="wt-footer">
      {/* Top Signature Theme Accent Bar */}
      <div className="wt-footer-top-accent"></div>

      <div className="wt-container wt-footer-container">
        {/* Main Footer 4 Columns */}
        <div className="wt-footer-grid">
          {/* Column 1: About Solution & Social Icons */}
          <div className="wt-footer-col wt-footer-col-about">
            <a href="#home" className="wt-footer-brand" aria-label="Tracmatrix Home">
              <img
                src="/images/trackmatrix-logo-darkmode.png"
                alt="Tracmatrix — Employee Monitoring Software"
                className="wt-footer-logo-img"
              />
            </a>
            <p className="wt-footer-desc">
              Comprehensive employee monitoring &amp; productivity tracking platform. Monitor work hours, track app and web activity, capture screenshots, and gain actionable workforce intelligence.
            </p>
            <div className="wt-footer-socials">
              {/* Facebook */}
              <a href="https://facebook.com/nibizsoft" target="_blank" rel="noopener noreferrer" className="wt-f-social-btn" aria-label="Facebook">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/>
                </svg>
              </a>
              {/* LinkedIn */}
              <a href="https://linkedin.com/company/nibizsoft" target="_blank" rel="noopener noreferrer" className="wt-f-social-btn" aria-label="LinkedIn">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                </svg>
              </a>
              {/* YouTube */}
              <a href="https://youtube.com/@nibizsoft" target="_blank" rel="noopener noreferrer" className="wt-f-social-btn" aria-label="YouTube">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Column 2: Included In System */}
          <div className="wt-footer-col">
            <h4 className="wt-footer-heading">Included In System</h4>
            <ul className="wt-footer-link-list">
              <li><a href="#features">Employee Desktop Agent</a></li>
              <li><a href="#features">Web Admin Console</a></li>
              <li><a href="#features">Real-time Screenshots</a></li>
              <li><a href="#features">Productivity Analytics</a></li>
              <li><a href="#pricing">License Plans</a></li>
            </ul>
          </div>

          {/* Column 3: Live Interactive Demos */}
          <div className="wt-footer-col">
            <h4 className="wt-footer-heading">Live Interactive Demos</h4>
            <ul className="wt-footer-link-list">
              <li><a href="#visibility">Admin Panel</a></li>
              <li><a href="#visibility">Employee Tracker</a></li>
              <li><a href="#reports">Productivity Reports</a></li>
              <li><a href="#integrations">Integrations</a></li>
              <li><a href="#pricing">Pricing &amp; Plans</a></li>
            </ul>
          </div>

          {/* Column 4: Corporate Office & Support + Centered Google Maps */}
          <div className="wt-footer-col wt-footer-col-contact">
            <h4 className="wt-footer-heading">Corporate Office &amp; Support</h4>

            <div className="wt-f-contact-details">
              {/* Head Office */}
              <div className="wt-f-contact-item">
                <div className="wt-f-c-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0c-4.198 0-8 3.403-8 7.602 0 4.198 3.469 9.21 8 16.398 4.531-7.188 8-12.2 8-16.398 0-4.199-3.801-7.602-8-7.602zm0 11c-1.657 0-3-1.343-3-3s1.343-3 3-3 3 1.343 3 3-1.343 3-3 3z"/>
                  </svg>
                </div>
                <div className="wt-f-c-text">
                  <span className="wt-f-c-label">HEAD OFFICE:</span>
                  <address className="wt-f-c-val">House 3, Road 3A, Sector 15, Uttara Model Town, Dhaka 1230, Bangladesh</address>
                </div>
              </div>

              {/* Call / WhatsApp */}
              <div className="wt-f-contact-item">
                <div className="wt-f-c-icon">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20 15.5c-1.2 0-2.4-.2-3.6-.6-.3-.1-.7 0-1 .2l-2.2 2.2c-2.8-1.4-5.1-3.8-6.6-6.6l2.2-2.2c.3-.3.4-.7.2-1-.4-1.1-.6-2.3-.6-3.5 0-.6-.4-1-1-1H4c-.6 0-1 .4-1 1 0 9.4 7.6 17 17 17 .6 0 1-.4 1-1v-3.5c0-.6-.4-1-1-1z"/>
                  </svg>
                </div>
                <div className="wt-f-c-text">
                  <span className="wt-f-c-label">CALL / WHATSAPP:</span>
                  <a href="tel:+8801956000056" className="wt-f-c-link">+880 1956-000056</a>
                </div>
              </div>

              {/* Email Address */}
              <div className="wt-f-contact-item">
                <div className="wt-f-c-icon">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                  </svg>
                </div>
                <div className="wt-f-c-text">
                  <span className="wt-f-c-label">EMAIL ADDRESS:</span>
                  <a href="mailto:support@nibizsoft.com" className="wt-f-c-link">support@nibizsoft.com</a>
                </div>
              </div>
            </div>

            {/* Google Maps Embed Container */}
            <div className="wt-map-widget-card">
              <a href="https://maps.google.com/?q=N.I.Biz+Soft,+House+3,+Road+3A,+Sector+15,+Uttara,+Dhaka+1230" target="_blank" rel="noopener noreferrer" className="wt-map-corner-tag">
                <span>Maps</span>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6">
                  <path d="M7 17L17 7M17 7H7M17 7V17"/>
                </svg>
              </a>

              <div className="wt-map-iframe-holder">
                <iframe
                  title="N.I.Biz Soft Location Map"
                  src="https://maps.google.com/maps?q=N.I.Biz+Soft,+House+3,+Road+3A,+Sector+15,+Uttara,+Dhaka+1230&t=&z=16&ie=UTF8&iwloc=&output=embed"
                  width="100%"
                  height="125"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                ></iframe>
              </div>

              <a href="https://maps.google.com/?q=N.I.Biz+Soft,+House+3,+Road+3A,+Sector+15,+Uttara,+Dhaka+1230" target="_blank" rel="noopener noreferrer" className="wt-map-footer-action">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0c-4.198 0-8 3.403-8 7.602 0 4.198 3.469 9.21 8 16.398 4.531-7.188 8-12.2 8-16.398 0-4.199-3.801-7.602-8-7.602zm0 11c-1.657 0-3-1.343-3-3s1.343-3 3-3 3 1.343 3 3-1.343 3-3 3z"/>
                </svg>
                <span>View on Google Maps</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M7 17L17 7M17 7H7M17 7V17"/>
                </svg>
              </a>
            </div>
          </div>
        </div>

        {/* Footer Bottom Bar */}
        <div className="wt-footer-bottom">
          <p className="wt-footer-copy">
            &copy; {currentYear} <strong>Tracmatrix</strong> &bull; Developed by <strong>N.I.Biz Soft</strong>. All rights reserved.
          </p>
          <div className="wt-footer-legal-links">
            <a href="#privacy">Privacy Policy</a>
            <span>&bull;</span>
            <a href="#terms">Terms of Service</a>
            <span>&bull;</span>
            <a href="#security">Security &amp; Compliance</a>
          </div>
        </div>
      </div>

      {/* Floating WhatsApp Action Widget */}
      <a
        href="https://wa.me/8801956000056"
        target="_blank"
        rel="noopener noreferrer"
        className="wt-floating-wa-btn"
        title="Chat with N.I.Biz Soft on WhatsApp"
        aria-label="Chat on WhatsApp"
      >
        <span className="wt-wa-pulse-wave"></span>
        <svg width="34" height="34" viewBox="0 0 24 24" fill="#FFFFFF">
          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
        </svg>
      </a>
    </footer>
  )
}
