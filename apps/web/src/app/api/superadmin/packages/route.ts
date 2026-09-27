import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'

export const dynamic = 'force-dynamic'

const DEFAULT_PACKAGES = [
  {
    id: 'basic',
    name: 'BASIC',
    badge: 'Free Forever',
    tagline: 'For teams monitoring their work productivity for the short term',
    price: {
      USD: { monthly: 0, annual: 0 },
      BDT: { monthly: 0, annual: 0 },
    },
    billingText: {
      monthly: '$0/month',
      annual: '$0/month',
      monthlyBDT: '0 ৳/month',
      annualBDT: '0 ৳/month',
    },
    isPopular: false,
    colorScheme: 'gray',
    features: [
      { text: 'Unlimited users', included: true },
      { text: 'Upto 2 teams', included: true },
      { text: 'Computer activity tracking', included: true },
      { text: 'Timesheet and attendance', included: true },
      { text: 'Custom rules to detect slacking employees', included: true },
      { text: 'Screenshots every 10 minutes', included: true },
      { text: 'Last 14 days data retention', included: true },
      { text: '10 GB file storage limit', included: true },
      { text: 'Last 3 months screenshot retention', included: true },
      { text: 'Timelapse videos of work progress', included: true },
      { text: 'Data Export to CSV, XLS', included: true },
      { text: 'Priority support', included: true },
      { text: 'Multiple bulk screenshot deletion', included: false, isPremiumOnly: true },
    ],
    limits: {
      screenshotIntervalSec: 600,
      retentionDays: 14,
      storageQuotaMb: 10000,
      maxTeams: 2,
      bulkScreenshotDelete: false,
    },
  },
  {
    id: 'pro',
    name: 'PRO',
    badge: 'Save 20% on Annual',
    tagline: 'For teams optimizing their work productivity for the long term',
    price: {
      USD: { monthly: 4.99, annual: 3.99 },
      BDT: { monthly: 590, annual: 470 },
    },
    billingText: {
      monthly: '$4.99/user/month',
      annual: '$3.99/user/month (Billed Annually)',
      monthlyBDT: '590 ৳/user/month',
      annualBDT: '470 ৳/user/month (Billed Annually)',
    },
    isPopular: true,
    colorScheme: 'blue',
    features: [
      { text: 'Unlimited tracking', included: true },
      { text: 'Unlimited teams', included: true },
      { text: 'Computer activity tracking', included: true },
      { text: 'Timesheet and attendance', included: true },
      { text: 'Custom rules to detect slacking employees', included: true },
      { text: 'Screenshots every 1 minute', included: true },
      { text: 'Last 1 year data retention', included: true },
      { text: 'Unlimited Storage', included: true },
      { text: 'Last 3 months screenshot retention', included: true },
      { text: 'Timelapse videos of work progress', included: true },
      { text: 'Data Export to CSV, XLS', included: true },
      { text: 'Priority support 24/7', included: true },
      { text: 'Multiple bulk screenshot deletion', included: true, isPremiumOnly: true },
    ],
    limits: {
      screenshotIntervalSec: 60,
      retentionDays: 365,
      storageQuotaMb: 500000,
      maxTeams: 9999,
      bulkScreenshotDelete: true,
    },
  },
  {
    id: 'enterprise',
    name: 'ENTERPRISE',
    badge: 'Custom Scale',
    tagline: 'For large enterprises requiring custom retention, security, and dedicated infrastructure',
    price: {
      USD: { monthly: 19.99, annual: 15.99 },
      BDT: { monthly: 2350, annual: 1880 },
    },
    billingText: {
      monthly: '$19.99/user/month',
      annual: '$15.99/user/month (Billed Annually)',
      monthlyBDT: '2,350 ৳/user/month',
      annualBDT: '1,880 ৳/user/month',
    },
    isPopular: false,
    colorScheme: 'indigo',
    features: [
      { text: 'Everything in PRO', included: true },
      { text: 'Dedicated Account Manager', included: true },
      { text: 'Custom SLA & 99.99% Uptime Guarantee', included: true },
      { text: 'SSO / SAML 2.0 Integration', included: true },
      { text: 'Custom Data Retention (Up to 7 Years)', included: true },
      { text: 'Multiple bulk screenshot deletion', included: true, isPremiumOnly: true },
      { text: 'On-premise / Private Cloud Deployment Option', included: true },
      { text: 'Automated Compliance & Audit Logging', included: true },
    ],
    limits: {
      screenshotIntervalSec: 30,
      retentionDays: 2555,
      storageQuotaMb: 2000000,
      maxTeams: 99999,
      bulkScreenshotDelete: true,
    },
  },
]

export async function GET() {
  try {
    const supabase = createAdminClient()

    // Try fetching custom packages config from platform_settings
    const { data: dbSetting } = await supabase
      .from('platform_settings')
      .select('value')
      .eq('key', 'saas_packages_config')
      .single()

    const packages = dbSetting?.value?.packages || DEFAULT_PACKAGES

    return NextResponse.json({
      success: true,
      packages,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ success: true, packages: DEFAULT_PACKAGES, fallbackError: message })
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json()
    const { packages } = body

    if (!packages || !Array.isArray(packages)) {
      return NextResponse.json({ success: false, error: 'Packages array is required' }, { status: 400 })
    }

    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('platform_settings')
      .upsert(
        {
          key: 'saas_packages_config',
          value: { packages, updated_at: new Date().toISOString() },
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'key' }
      )
      .select()
      .single()

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'SaaS packages updated successfully',
      packages,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
