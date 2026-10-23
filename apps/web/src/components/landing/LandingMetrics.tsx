import React from 'react'

export default function LandingMetrics() {
  return (
    <section className="wt-logo-cloud" id="partners">
      <div className="wt-container">
        <p className="wt-logo-cloud-heading">Trusted by 5,000+ Businesses Worldwide</p>

        <div className="wt-logos-row">
          {/* NRDL */}
          <div className="wt-partner-logo" title="NRDL">
            <img
              src="/images/partners/nrdl.png"
              alt="NRDL"
              className="wt-partner-img wt-partner-nrdl"
              loading="lazy"
            />
          </div>

          {/* Birdem Hospital */}
          <div className="wt-partner-logo" title="Birdem Hospital">
            <img
              src="/images/partners/birdem-hospital.png"
              alt="Birdem Hospital"
              className="wt-partner-img wt-partner-birdem"
              loading="lazy"
            />
          </div>

          {/* kai Aluminium */}
          <div className="wt-partner-logo" title="kai Aluminium">
            <img
              src="/images/partners/kai-aluminium.png"
              alt="kai Aluminium"
              className="wt-partner-img wt-partner-kai"
              loading="lazy"
            />
          </div>

          {/* Tokyo Development Engineers Ltd. */}
          <div className="wt-partner-logo" title="Tokyo Development Engineers Ltd.">
            <img
              src="/images/partners/tokyo-engineers.png"
              alt="Tokyo Development Engineers Ltd."
              className="wt-partner-img wt-partner-tokyo"
              loading="lazy"
            />
          </div>

          {/* Alliance Builders */}
          <div className="wt-partner-logo" title="Alliance Builders">
            <img
              src="/images/partners/alliance-builders.png"
              alt="Alliance Builders"
              className="wt-partner-img wt-partner-alliance"
              loading="lazy"
            />
          </div>

          {/* PAPERTECH */}
          <div className="wt-partner-logo" title="PAPERTECH">
            <img
              src="/images/partners/papertech.png"
              alt="PAPERTECH"
              className="wt-partner-img wt-partner-papertech"
              loading="lazy"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
