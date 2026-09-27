import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = createAdminClient()

    // 1. Fetch all tenants
    const { data: tenants, error: tenantsErr } = await supabase
      .from('tenants')
      .select('*')
      .order('created_at', { ascending: false })

    if (tenantsErr) {
      return NextResponse.json({ success: false, error: tenantsErr.message }, { status: 500 })
    }

    // 2. Fetch all users count
    const { count: totalUsers, error: usersErr } = await supabase
      .from('users')
      .select('id', { count: 'exact', head: true })

    // 3. Fetch all screenshots count
    const { count: totalScreenshots, error: screenErr } = await supabase
      .from('screenshots')
      .select('id', { count: 'exact', head: true })

    const tenantList = tenants || []

    // Calculate plan distribution
    const planCounts = {
      BASIC: 0,
      PRO: 0,
      ENTERPRISE: 0,
    }
    const statusCounts = {
      ACTIVE: 0,
      TRIAL: 0,
      SUSPENDED: 0,
      CANCELLED: 0,
    }

    let totalSeats = 0
    let estimatedMRR = 0

    tenantList.forEach((t) => {
      const plan = (t.plan || 'BASIC') as keyof typeof planCounts
      const status = (t.status || 'ACTIVE') as keyof typeof statusCounts

      if (planCounts[plan] !== undefined) planCounts[plan]++
      if (statusCounts[status] !== undefined) statusCounts[status]++

      const seats = t.max_seats || 10
      totalSeats += seats

      // Pricing logic:
      // PRO = $4.99/user/month (or $3.99 billed annually, avg $4.49)
      // ENTERPRISE = $19.99/user/month
      // BASIC = $0
      if (status === 'ACTIVE') {
        if (plan === 'PRO') {
          estimatedMRR += Math.round(seats * 4.99)
        } else if (plan === 'ENTERPRISE') {
          estimatedMRR += Math.round(seats * 19.99)
        }
      }
    })

    // Estimated Storage Used (approx 200KB per screenshot + quota)
    const storageUsedMb = Math.round(((totalScreenshots || 0) * 0.25) + 1420)

    return NextResponse.json({
      success: true,
      stats: {
        mrr: estimatedMRR,
        arr: estimatedMRR * 12,
        totalTenants: tenantList.length,
        activeTenants: statusCounts.ACTIVE,
        trialTenants: statusCounts.TRIAL,
        totalUsers: totalUsers || 0,
        totalSeats,
        totalScreenshots: totalScreenshots || 0,
        storageUsedMb,
        planDistribution: planCounts,
        statusDistribution: statusCounts,
        recentTenants: tenantList.slice(0, 5),
      }
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
