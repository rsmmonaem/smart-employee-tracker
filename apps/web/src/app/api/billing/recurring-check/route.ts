import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { sendInvoiceEmail } from '@/lib/email/mailer'

export const dynamic = 'force-dynamic'

/**
 * GET/POST /api/billing/recurring-check
 * Automated Recurring Invoicing & Service Cutoff Monitor:
 * Scans tenants for overdue subscriptions or unpaid recurring cycles,
 * issues automated email invoices, and automatically suspends (cuts) services if unpaid.
 */
export async function GET(req: Request) {
  return handleRecurringCheck(req)
}

export async function POST(req: Request) {
  return handleRecurringCheck(req)
}

async function handleRecurringCheck(req: Request) {
  try {
    const supabase = createAdminClient()

    // 1. Fetch all tenants
    const { data: tenants, error: tenantErr } = await supabase
      .from('tenants')
      .select('id, name, plan, status, created_at, updated_at')

    if (tenantErr || !tenants) {
      return NextResponse.json({ success: false, error: tenantErr?.message }, { status: 500 })
    }

    // 2. Fetch all recorded invoices
    const { data: dbSetting } = await supabase
      .from('platform_settings')
      .select('value')
      .eq('key', 'saas_billing_invoices')
      .single()

    const invoices: any[] = dbSetting?.value?.invoices || []

    const results = {
      totalTenants: tenants.length,
      processed: 0,
      active: 0,
      suspended: 0,
      warningsSent: 0,
      autoCutsApplied: 0,
      details: [] as any[],
    }

    const now = new Date()

    for (const tenant of tenants) {
      results.processed++

      // Tenant admin user
      const { data: adminUser } = await supabase
        .from('users')
        .select('email')
        .eq('tenant_id', tenant.id)
        .eq('role', 'TENANT_ADMIN')
        .limit(1)
        .maybeSingle()

      const adminEmail = adminUser?.email

      // Check tenant invoices
      const tenantInvoices = invoices.filter((inv) => inv.tenantId === tenant.id)
      const unpaidInvoices = tenantInvoices.filter((inv) => inv.status === 'UNPAID' || inv.status === 'PENDING')

      if (tenant.plan !== 'BASIC') {
        // If tenant is on PRO or ENTERPRISE with an unpaid invoice past due
        if (unpaidInvoices.length > 0) {
          const unpaid = unpaidInvoices[0]

          // Auto-cut service: Suspend tenant and downgrade quotas
          await supabase
            .from('tenants')
            .update({
              status: 'SUSPENDED',
              plan: 'BASIC',
              storage_quota_mb: 500,
              screenshot_interval_sec: 600,
              updated_at: new Date().toISOString(),
            })
            .eq('id', tenant.id)

          results.autoCutsApplied++
          results.suspended++

          // Send warning & suspension email
          if (adminEmail) {
            await sendInvoiceEmail({
              email: adminEmail,
              companyName: tenant.name,
              invoiceId: unpaid.id || `REC-${tenant.id.slice(0, 5)}`,
              amount: unpaid.amount || 470,
              currency: unpaid.currency || 'BDT',
              plan: tenant.plan,
              isPaid: false,
              dueDate: unpaid.date || 'Immediate',
            })
            results.warningsSent++
          }

          results.details.push({
            tenantId: tenant.id,
            name: tenant.name,
            action: 'AUTOCUT_SUSPENDED',
            reason: 'Unpaid recurring subscription invoice',
          })
        } else {
          results.active++
        }
      } else {
        results.active++
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Recurring subscription audit completed successfully.',
      timestamp: new Date().toISOString(),
      summary: results,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
