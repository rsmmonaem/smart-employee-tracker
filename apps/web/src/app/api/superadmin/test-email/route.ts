import { NextResponse } from 'next/server'
import { createMailerTransport, getSmtpConfig } from '@/lib/email/mailer'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const targetEmail = body.email?.trim() || 'info@tracmatrix.com'

    const cfg = getSmtpConfig()
    const transporter = createMailerTransport()

    // Test verify connection
    await transporter.verify()

    const info = await transporter.sendMail({
      from: cfg.from,
      to: targetEmail,
      subject: 'Tracmatrix SMTP Connection Test — Successful',
      html: `
        <div style="font-family: sans-serif; padding: 24px; background: #0f172a; color: #f8fafc; border-radius: 12px;">
          <h2 style="color: #38bdf8; margin-top: 0;">Tracmatrix Mail Delivery Test Passed!</h2>
          <p>This email verifies that your SMTP mail client settings on <strong>${cfg.host}</strong> (Port ${cfg.port}) are functional.</p>
          <p style="font-size: 13px; color: #94a3b8;">Sent via info@tracmatrix.com on ${new Date().toUTCString()}</p>
        </div>
      `,
    })

    return NextResponse.json({
      success: true,
      message: `Test email successfully sent to ${targetEmail}`,
      messageId: info.messageId,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
