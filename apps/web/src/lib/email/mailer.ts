import nodemailer from 'nodemailer'

export interface SmtpConfig {
  host: string
  port: number
  secure: boolean
  user: string
  pass: string
  from: string
}

export function getSmtpConfig(): SmtpConfig {
  const host = process.env.SMTP_HOST || 'tracmatrix.com'
  const port = parseInt(process.env.SMTP_PORT || '465', 10)
  const secure = process.env.SMTP_SECURE === 'true' || port === 465
  const user = process.env.SMTP_USER || 'info@tracmatrix.com'
  const pass = process.env.SMTP_PASSWORD || process.env.MAIL_PASSWORD || 'TracMatrix@2026!'
  const from = process.env.SMTP_FROM || `"Tracmatrix" <${user}>`

  return { host, port, secure, user, pass, from }
}

export function createMailerTransport() {
  const cfg = getSmtpConfig()

  return nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.secure,
    auth: {
      user: cfg.user,
      pass: cfg.pass,
    },
    tls: {
      rejectUnauthorized: false,
    },
  })
}

/**
 * Base email layout wrapper with modern dark-mode aesthetic & Tracmatrix styling
 */
function wrapHtmlEmail(title: string, contentHtml: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #0b1e3d;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #e2e8f0;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      background-color: #0b1e3d;
      padding: 40px 16px;
    }
    .card {
      max-width: 600px;
      margin: 0 auto;
      background-color: #0f244a;
      border: 1px solid #1e3a8a;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
    }
    .header {
      background: linear-gradient(135deg, #0f2b5c 0%, #173b75 100%);
      padding: 32px 36px 28px 36px;
      text-align: center;
      border-bottom: 1px solid #1e40af;
    }
    .logo-text {
      font-size: 24px;
      font-weight: 800;
      letter-spacing: -0.5px;
      color: #38bdf8;
      text-transform: uppercase;
      margin: 0;
    }
    .tagline {
      font-size: 13px;
      color: #94a3b8;
      margin-top: 6px;
    }
    .content {
      padding: 36px;
      line-height: 1.6;
      font-size: 15px;
      color: #cbd5e1;
    }
    .h1-title {
      font-size: 20px;
      font-weight: 700;
      color: #ffffff;
      margin-top: 0;
      margin-bottom: 18px;
    }
    .btn {
      display: inline-block;
      background: linear-gradient(135deg, #0284c7 0%, #2563eb 100%);
      color: #ffffff !important;
      text-decoration: none;
      font-weight: 700;
      font-size: 14px;
      padding: 13px 28px;
      border-radius: 8px;
      margin: 20px 0;
      text-align: center;
      box-shadow: 0 4px 14px rgba(37, 99, 235, 0.35);
    }
    .credential-box {
      background-color: #0b172e;
      border: 1px solid #1e3a8a;
      border-radius: 10px;
      padding: 18px 22px;
      margin: 20px 0;
    }
    .credential-item {
      margin-bottom: 8px;
      font-size: 14px;
    }
    .credential-item:last-child {
      margin-bottom: 0;
    }
    .cred-label {
      color: #94a3b8;
      font-size: 12px;
      text-transform: uppercase;
      font-weight: 600;
      display: block;
      margin-bottom: 2px;
    }
    .cred-value {
      color: #38bdf8;
      font-family: monospace;
      font-size: 15px;
      font-weight: 700;
    }
    .download-grid {
      display: table;
      width: 100%;
      margin: 20px 0;
    }
    .download-cell {
      display: table-cell;
      padding: 6px;
      width: 33.33%;
    }
    .download-btn {
      display: block;
      background: #132b54;
      border: 1px solid #1d4ed8;
      border-radius: 8px;
      padding: 10px 8px;
      text-align: center;
      color: #93c5fd !important;
      text-decoration: none;
      font-size: 12px;
      font-weight: 600;
    }
    .footer {
      background-color: #08152b;
      padding: 24px 36px;
      text-align: center;
      font-size: 12px;
      color: #64748b;
      border-top: 1px solid #172554;
    }
    .footer a {
      color: #38bdf8;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      <div class="header">
        <h2 class="logo-text">TRACMATRIX</h2>
        <div class="tagline">Smart Workforce Productivity &amp; Proof-of-Work Platform</div>
      </div>
      <div class="content">
        ${contentHtml}
      </div>
      <div class="footer">
        <p>&copy; ${new Date().getFullYear()} Tracmatrix. All rights reserved.</p>
        <p>Support: <a href="mailto:info@tracmatrix.com">info@tracmatrix.com</a> &bull; <a href="https://app.tracmatrix.com">https://app.tracmatrix.com</a></p>
      </div>
    </div>
  </div>
</body>
</html>
`
}

/**
 * 1. Send Welcome Email on Company / Tenant Registration
 */
export async function sendWelcomeEmail({
  email,
  companyName,
  loginUrl = 'https://app.tracmatrix.com/login',
}: {
  email: string
  companyName: string
  loginUrl?: string
}) {
  const cfg = getSmtpConfig()
  const subject = `Welcome to Tracmatrix — ${companyName}`

  const contentHtml = `
    <h1 class="h1-title">Welcome aboard, ${companyName}! 👋</h1>
    <p>Thank you for choosing <strong>Tracmatrix</strong> as your enterprise employee monitoring and productivity proof-of-work solution.</p>

    <p>Your company workspace is active and ready. You now have full access to:</p>
    <ul style="padding-left: 20px; color: #94a3b8; font-size: 14px;">
      <li>Automated stealth &amp; visible screenshot capturing</li>
      <li>Real-time timesheet &amp; active application analytics</li>
      <li>Team &amp; department productivity tracking</li>
      <li>Instant team invitation &amp; automated credential delivery</li>
    </ul>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${loginUrl}" class="btn">Go to Company Admin Portal</a>
    </div>

    <p style="font-size: 13px; color: #94a3b8;">
      If you need any technical assistance or onboarding support, our engineering team is available 24/7 at <a href="mailto:info@tracmatrix.com" style="color: #38bdf8;">info@tracmatrix.com</a>.
    </p>
  `

  const html = wrapHtmlEmail(subject, contentHtml)

  try {
    const transporter = createMailerTransport()
    const info = await transporter.sendMail({
      from: cfg.from,
      to: email,
      subject,
      html,
    })
    console.log(`[SMTP] Welcome email successfully sent to ${email}:`, info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (err) {
    console.warn(`[SMTP Warning] Could not deliver welcome email to ${email}:`, err)
    return { success: false, error: err instanceof Error ? err.message : 'Unknown mail error' }
  }
}

/**
 * 2. Send Invitation Email with ID, Password, and Desktop App Download Links
 * Triggered when Company Admin adds a new team member
 */
export async function sendTeamMemberInviteEmail({
  email,
  fullName,
  password,
  companyName = 'Your Organization',
  role = 'Employee',
  loginUrl = 'https://app.tracmatrix.com/login',
  appDownloads = {
    windows: 'https://app.tracmatrix.com/downloads/tracmatrix-agent-setup.exe',
    mac: 'https://app.tracmatrix.com/downloads/tracmatrix-agent-mac.dmg',
    android: 'https://app.tracmatrix.com/downloads/tracmatrix-mobile.apk',
  },
}: {
  email: string
  fullName: string
  password: string
  companyName?: string
  role?: string
  loginUrl?: string
  appDownloads?: {
    windows: string
    mac: string
    android: string
  }
}) {
  const cfg = getSmtpConfig()
  const subject = `Your Tracmatrix Workspace Account Credentials — ${companyName}`

  const contentHtml = `
    <h1 class="h1-title">Hello ${fullName},</h1>
    <p>You have been registered as <strong>${role}</strong> at <strong>${companyName}</strong> on the Tracmatrix Productivity Platform.</p>

    <div class="credential-box">
      <div class="credential-item">
        <span class="cred-label">Login Email / User ID:</span>
        <span class="cred-value">${email}</span>
      </div>
      <div class="credential-item" style="margin-top: 12px;">
        <span class="cred-label">Temporary Password:</span>
        <span class="cred-value">${password}</span>
      </div>
      <div class="credential-item" style="margin-top: 12px;">
        <span class="cred-label">Assigned Role:</span>
        <span style="color: #a7f3d0; font-weight: 600;">${role}</span>
      </div>
    </div>

    <div style="text-align: center;">
      <a href="${loginUrl}" class="btn">Login to Web Dashboard</a>
    </div>

    <h2 style="font-size: 15px; color: #ffffff; margin-top: 24px; margin-bottom: 8px;">
      Download Desktop &amp; Mobile Time Tracker
    </h2>
    <p style="font-size: 13px; color: #94a3b8; margin-top: 0;">
      Install the tracker application on your work machine to begin logging hours:
    </p>

    <div class="download-grid">
      <div class="download-cell">
        <a href="${appDownloads.windows}" class="download-btn">
          💻 Windows (EXE)
        </a>
      </div>
      <div class="download-cell">
        <a href="${appDownloads.mac}" class="download-btn">
          🍏 macOS (DMG)
        </a>
      </div>
      <div class="download-cell">
        <a href="${appDownloads.android}" class="download-btn">
          📱 Android (APK)
        </a>
      </div>
    </div>

    <p style="font-size: 12px; color: #64748b; margin-top: 20px;">
      Security Tip: Please change your password after logging into your dashboard for the first time.
    </p>
  `

  const html = wrapHtmlEmail(subject, contentHtml)

  try {
    const transporter = createMailerTransport()
    const info = await transporter.sendMail({
      from: cfg.from,
      to: email,
      subject,
      html,
    })
    console.log(`[SMTP] Team member invite sent to ${email}:`, info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (err) {
    console.warn(`[SMTP Warning] Could not deliver invite email to ${email}:`, err)
    return { success: false, error: err instanceof Error ? err.message : 'Unknown mail error' }
  }
}

/**
 * 3. Send Recurring Invoice Receipt or Overdue / Auto-Cut Suspension Notice
 */
export async function sendInvoiceEmail({
  email,
  companyName,
  invoiceId,
  amount,
  currency,
  plan,
  isPaid,
  dueDate,
  invoiceUrl = 'https://app.tracmatrix.com/admin/billing',
}: {
  email: string
  companyName: string
  invoiceId: string
  amount: number
  currency: string
  plan: string
  isPaid: boolean
  dueDate?: string
  invoiceUrl?: string
}) {
  const cfg = getSmtpConfig()
  const subject = isPaid
    ? `Payment Receipt for Invoice #${invoiceId} — Tracmatrix ${plan}`
    : `URGENT: Unpaid Recurring Invoice #${invoiceId} — Tracmatrix Service Notice`

  const formattedAmount = currency === 'BDT' ? `${amount.toLocaleString()} ৳` : `$${amount.toLocaleString()}`

  const contentHtml = isPaid
    ? `
      <h1 class="h1-title">Payment Confirmed ✅</h1>
      <p>Dear <strong>${companyName}</strong>, thank you for your payment. Your subscription to <strong>Tracmatrix ${plan}</strong> has been successfully renewed.</p>

      <div class="credential-box">
        <div class="credential-item">
          <span class="cred-label">Invoice Number:</span>
          <span class="cred-value">${invoiceId}</span>
        </div>
        <div class="credential-item" style="margin-top: 8px;">
          <span class="cred-label">Amount Paid:</span>
          <span class="cred-value" style="color: #4ade80;">${formattedAmount}</span>
        </div>
        <div class="credential-item" style="margin-top: 8px;">
          <span class="cred-label">Subscription Tier:</span>
          <span class="cred-value">${plan} Plan</span>
        </div>
        <div class="credential-item" style="margin-top: 8px;">
          <span class="cred-label">Status:</span>
          <span style="color: #4ade80; font-weight: bold;">PAID</span>
        </div>
      </div>

      <div style="text-align: center;">
        <a href="${invoiceUrl}" class="btn">View Invoice in Billing Portal</a>
      </div>
    `
    : `
      <h1 class="h1-title" style="color: #f87171;">Action Required: Recurring Payment Due ⚠️</h1>
      <p>Dear <strong>${companyName}</strong>, this is an automated notification that invoice <strong>#${invoiceId}</strong> for your <strong>Tracmatrix ${plan}</strong> subscription remains unpaid.</p>

      <div class="credential-box" style="border-color: #ef4444;">
        <div class="credential-item">
          <span class="cred-label">Invoice Number:</span>
          <span class="cred-value">${invoiceId}</span>
        </div>
        <div class="credential-item" style="margin-top: 8px;">
          <span class="cred-label">Total Overdue:</span>
          <span class="cred-value" style="color: #f87171;">${formattedAmount}</span>
        </div>
        <div class="credential-item" style="margin-top: 8px;">
          <span class="cred-label">Due Date:</span>
          <span style="color: #fbbf24; font-weight: bold;">${dueDate || 'Immediate'}</span>
        </div>
      </div>

      <p style="color: #fca5a5; font-size: 13px; font-weight: 600;">
        Important: If payment is not received, your tracking services, cloud screenshot sync, and multi-team features will be automatically paused/cut to prevent data overflow.
      </p>

      <div style="text-align: center;">
        <a href="${invoiceUrl}" class="btn" style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);">
          Pay Invoice Now &rarr;
        </a>
      </div>
    `

  const html = wrapHtmlEmail(subject, contentHtml)

  try {
    const transporter = createMailerTransport()
    const info = await transporter.sendMail({
      from: cfg.from,
      to: email,
      subject,
      html,
    })
    console.log(`[SMTP] Invoice email sent to ${email}:`, info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (err) {
    console.warn(`[SMTP Warning] Could not deliver invoice email to ${email}:`, err)
    return { success: false, error: err instanceof Error ? err.message : 'Unknown mail error' }
  }
}
