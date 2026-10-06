'use client'

import React, { useState } from 'react'
import Link from 'next/link'

export default function LandingNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const toggleMobileMenu = () => {
    setMobileMenuOpen((prev) => !prev)
  }

  const closeMobileMenu = () => {
    setMobileMenuOpen(false)
  }

  return (
    <header className="wt-navbar" id="topNavbar">
      <div className="wt-container wt-nav-container">
        {/* Logo */}
        <Link href="#home" className="wt-brand" aria-label="Tracmatrix Home">
          <img
            src="/images/trackmatrix-logo-darkmode.png"
            alt="Tracmatrix — Employee Monitoring Software"
            className="wt-brand-logo-img"
          />
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="wt-nav-links" id="desktopNav" aria-label="Main Navigation">
          <a href="#home" className="wt-nav-link active">Home</a>
          <a href="#features" className="wt-nav-link">Features</a>
          <a href="#visibility" className="wt-nav-link">Visibility</a>
          <a href="#how-it-works" className="wt-nav-link">How it Works</a>
          <a href="#reports" className="wt-nav-link">Reports</a>
          <a href="#integrations" className="wt-nav-link">Integrations</a>
          <a href="#testimonials" className="wt-nav-link">Reviews</a>
          <a href="#pricing" className="wt-nav-link">Pricing</a>
        </nav>

        {/* Right Action Buttons */}
        <div className="wt-nav-actions">
          <Link href="/login" className="wt-nav-login">Login</Link>
          <a href="#pricing" className="wt-btn-primary wt-btn-nav">
            <span>Start Free Trial</span>
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 3L11 8L6 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </a>
          {/* Mobile Toggle Button */}
          <button
            type="button"
            className={`wt-hamburger ${mobileMenuOpen ? 'active' : ''}`}
            id="navToggle"
            onClick={toggleMobileMenu}
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            <span className="wt-bar"></span>
            <span className="wt-bar"></span>
            <span className="wt-bar"></span>
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      <div className={`wt-mobile-drawer ${mobileMenuOpen ? 'active' : ''}`} id="mobileDrawer">
        <nav className="wt-mobile-nav">
          <a href="#home" className="wt-mobile-link active" onClick={closeMobileMenu}>Home</a>
          <a href="#features" className="wt-mobile-link" onClick={closeMobileMenu}>Features</a>
          <a href="#visibility" className="wt-mobile-link" onClick={closeMobileMenu}>Visibility</a>
          <a href="#how-it-works" className="wt-mobile-link" onClick={closeMobileMenu}>How it Works</a>
          <a href="#reports" className="wt-mobile-link" onClick={closeMobileMenu}>Reports</a>
          <a href="#integrations" className="wt-mobile-link" onClick={closeMobileMenu}>Integrations</a>
          <a href="#testimonials" className="wt-mobile-link" onClick={closeMobileMenu}>Reviews</a>
          <a href="#pricing" className="wt-mobile-link" onClick={closeMobileMenu}>Pricing</a>
          <div className="wt-mobile-actions">
            <Link href="/login" className="wt-mobile-login" onClick={closeMobileMenu}>Login</Link>
            <a href="#pricing" className="wt-btn-primary wt-btn-full" onClick={closeMobileMenu}>
              <span>Start Free Trial</span>
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                <path d="M6 3L11 8L6 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </a>
          </div>
        </nav>
      </div>
    </header>
  )
}
