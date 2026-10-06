'use client'

import React, { useState } from 'react'

export default function LandingTestimonials() {
  const [currentIndex, setCurrentIndex] = useState(0)

  const testimonials = [
    {
      name: 'Rafiqul Islam',
      role: 'CEO, TechWave Ltd.',
      quote:
        'Tracmatrix has completely changed the way we manage our remote team. The insights are accurate and easy to understand.',
      avatar: '/images/avatar-1.jpg',
      isImage: true,
    },
    {
      name: 'Nusrat Jahan',
      role: 'HR Manager, InnovateBD',
      quote:
        'Simple, powerful and reliable. Our team is now more focused and productive than ever before.',
      initials: 'NJ',
      avatarClass: 'wt-av-nusrat',
      isImage: false,
    },
    {
      name: 'Imran Hossain',
      role: 'Operations Lead, NextGen',
      quote:
        'The real-time monitoring and detailed reports help us make better decisions. Highly recommended!',
      initials: 'IH',
      avatarClass: 'wt-av-imran',
      isImage: false,
    },
  ]

  const prev = () => {
    setCurrentIndex((prevIdx) => (prevIdx > 0 ? prevIdx - 1 : testimonials.length - 1))
  }

  const next = () => {
    setCurrentIndex((prevIdx) => (prevIdx < testimonials.length - 1 ? prevIdx + 1 : 0))
  }

  return (
    <section className="wt-testimonials" id="testimonials">
      <div className="wt-container">
        {/* Header with navigation arrows */}
        <div className="wt-test-header">
          <div className="wt-test-header-left">
            <div className="wt-pill-eyebrow">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 0L9.8 5.4L15.2 7.2L9.8 9L8 14.4L6.2 9L0.8 7.2L6.2 5.4L8 0Z"/>
              </svg>
              <span>OUR CLIENTS</span>
            </div>
            <h2 className="wt-section-title">
              What Our <span className="wt-highlight-blue">Customers Say</span>
            </h2>
            <p className="wt-section-subtitle">
              Join thousands of businesses that trust Tracmatrix to build a more productive and transparent workplace.
            </p>
          </div>

          {/* Slider Control Arrows */}
          <div className="wt-test-controls">
            <button type="button" className="wt-test-btn" id="prevTestimonial" onClick={prev} aria-label="Previous Testimonials">
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <button type="button" className="wt-test-btn" id="nextTestimonial" onClick={next} aria-label="Next Testimonials">
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                <path d="M7.5 15L12.5 10L7.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>

        {/* 3 Testimonial Cards Carousel / Grid */}
        <div className="wt-test-carousel" id="testCarousel">
          <div className="wt-test-grid">
            {testimonials.map((t, idx) => {
              return (
                <div key={t.name} className="wt-test-card">
                  <div className="wt-test-user-header">
                    {t.isImage ? (
                      <img src={t.avatar} alt={t.name} className="wt-test-avatar" loading="lazy" />
                    ) : (
                      <div className={`wt-test-avatar-placeholder ${t.avatarClass}`}>{t.initials}</div>
                    )}
                    <div className="wt-test-user-meta">
                      <h4 className="wt-test-name">{t.name}</h4>
                      <span className="wt-test-role">{t.role}</span>
                    </div>
                  </div>
                  <p className="wt-test-quote">&ldquo;{t.quote}&rdquo;</p>
                  <div className="wt-stars-row">
                    {[0, 1, 2, 3, 4].map((star) => (
                      <svg key={star} className="wt-star-icon" width="18" height="18" viewBox="0 0 20 20" fill="#FBBF24">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                      </svg>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
