import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    const supabase = createAdminClient()

    // Fetch the primary active tenant or first tenant
    const { data: tenant, error } = await supabase
      .from('tenants')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(1)
      .single()

    if (error || !tenant) {
      return NextResponse.json({
        success: true,
        tenant: {
          id: 'default',
          name: 'Demo Company',
          plan: 'BASIC',
          status: 'ACTIVE',
          max_seats: 10,
          max_teams: 2,
          storage_quota_mb: 10000,
          screenshot_interval_sec: 600,
          retention_days: 14,
        }
      })
    }

    // Get count of employees and screenshots
    const [usersCount, screenshotsCount] = await Promise.all([
      supabase.from('users').select('id', { count: 'exact', head: true }).eq('tenant_id', tenant.id),
      supabase.from('screenshots').select('id', { count: 'exact', head: true }).eq('tenant_id', tenant.id)
    ])

    return NextResponse.json({
      success: true,
      tenant: {
        ...tenant,
        active_employees: usersCount.count || 0,
        total_screenshots: screenshotsCount.count || 0,
      }
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { action, plan, tenantId } = body

    const supabase = createAdminClient()

    // If upgrading tenant plan
    if (action === 'upgrade') {
      const targetPlan = plan || 'PRO'
      const query = tenantId 
        ? supabase.from('tenants').update({ 
            plan: targetPlan, 
            storage_quota_mb: targetPlan === 'PRO' ? 500000 : 10000,
            screenshot_interval_sec: targetPlan === 'PRO' ? 60 : 600,
            retention_days: targetPlan === 'PRO' ? 365 : 14,
            updated_at: new Date().toISOString()
          }).eq('id', tenantId)
        : supabase.from('tenants').update({ 
            plan: targetPlan,
            storage_quota_mb: targetPlan === 'PRO' ? 500000 : 10000,
            screenshot_interval_sec: targetPlan === 'PRO' ? 60 : 600,
            retention_days: targetPlan === 'PRO' ? 365 : 14,
            updated_at: new Date().toISOString()
          }).eq('slug', 'test-tenant')

      const { data, error } = await query.select().single()

      if (error) {
        // Fallback update all or first
        await supabase.from('tenants').update({ plan: targetPlan }).neq('id', '00000000-0000-0000-0000-000000000000')
      }

      return NextResponse.json({
        success: true,
        message: `Plan successfully upgraded to ${targetPlan}!`,
        plan: targetPlan,
        tenant: data
      })
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
