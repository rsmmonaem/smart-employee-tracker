import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { getSessionContext } from '@/utils/supabase/auth-context'

export const dynamic = 'force-dynamic'

// GET tenant info for current logged-in company (STRICT MULTI-TENANT ISOLATED)
export async function GET() {
  try {
    const session = await getSessionContext()
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createAdminClient()

    let query = supabase.from('tenants').select('*')

    if (!session.isSuperAdmin) {
      if (!session.tenantId) {
        return NextResponse.json({
          success: true,
          tenant: {
            id: 'unassigned',
            name: 'Company Workspace',
            plan: 'BASIC',
            status: 'ACTIVE',
          },
        })
      }
      query = query.eq('id', session.tenantId)
    }

    const { data: tenant, error } = await query
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle()

    if (error || !tenant) {
      return NextResponse.json({
        success: true,
        tenant: {
          id: session.tenantId || 'default',
          name: 'My Company',
          plan: 'BASIC',
          status: 'ACTIVE',
        },
      })
    }

    const [usersCount, screenshotsCount] = await Promise.all([
      supabase.from('users').select('id', { count: 'exact', head: true }).eq('tenant_id', tenant.id),
      supabase.from('screenshots').select('id', { count: 'exact', head: true }).eq('tenant_id', tenant.id),
    ])

    return NextResponse.json({
      success: true,
      tenant: {
        ...tenant,
        active_employees: usersCount.count || 0,
        total_screenshots: screenshotsCount.count || 0,
      },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

// POST upgrade tenant plan
export async function POST(req: Request) {
  try {
    const session = await getSessionContext()
    if (!session || (session.role !== 'TENANT_ADMIN' && !session.isSuperAdmin)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const { action, plan } = body

    if (action === 'upgrade') {
      const targetPlan = plan || 'PRO'
      const targetTenantId = session.tenantId

      if (!targetTenantId) {
        return NextResponse.json({ success: false, error: 'No tenant found to upgrade' }, { status: 400 })
      }

      const supabase = createAdminClient()

      const { data, error } = await supabase
        .from('tenants')
        .update({
          plan: targetPlan,
          storage_quota_mb: targetPlan === 'ENTERPRISE' ? 50000 : targetPlan === 'PRO' ? 20000 : 5000,
          screenshot_interval_sec: targetPlan === 'ENTERPRISE' ? 30 : targetPlan === 'PRO' ? 60 : 300,
          retention_days: targetPlan === 'ENTERPRISE' ? 365 : targetPlan === 'PRO' ? 90 : 30,
          updated_at: new Date().toISOString(),
        })
        .eq('id', targetTenantId)
        .select()
        .single()

      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        message: `Plan successfully upgraded to ${targetPlan}!`,
        plan: targetPlan,
        tenant: data,
      })
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
