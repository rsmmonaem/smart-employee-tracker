import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'

export const dynamic = 'force-dynamic'

const DEFAULT_PLATFORM_CONFIG = {
  appName: 'Smart Employee Tracker',
  supportEmail: 'support@smartemployeetracker.com',
  defaultTrialDays: 14,
  requireCreditCardForTrial: false,
  basicStorageLimitMb: 10000,
  proStorageLimitMb: 500000,
  basicScreenshotIntervalSec: 600,
  proScreenshotIntervalSec: 60,
  allowSelfRegistration: true,
  maintenanceMode: false,
  broadcastBanner: '',
  stripeWebhookStatus: 'active',
  defaultCurrency: 'USD',
}

export async function GET() {
  try {
    const supabase = createAdminClient()

    const { data: dbSetting } = await supabase
      .from('platform_settings')
      .select('value')
      .eq('key', 'superadmin_platform_config')
      .single()

    const settings = {
      ...DEFAULT_PLATFORM_CONFIG,
      ...(dbSetting?.value || {}),
    }

    return NextResponse.json({ success: true, settings })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ success: true, settings: DEFAULT_PLATFORM_CONFIG, fallbackError: message })
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json()
    const { settings } = body

    if (!settings) {
      return NextResponse.json({ success: false, error: 'Settings object is required' }, { status: 400 })
    }

    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('platform_settings')
      .upsert(
        {
          key: 'superadmin_platform_config',
          value: { ...settings, updated_at: new Date().toISOString() },
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'key' }
      )
      .select()
      .single()

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Platform settings saved successfully', settings })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
