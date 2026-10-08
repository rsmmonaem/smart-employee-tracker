import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { getSessionContext } from '@/utils/supabase/auth-context'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    const session = await getSessionContext()
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const targetTenant = searchParams.get('tenantId') || session.tenantId
    const supabase = createAdminClient()

    // 1. Fetch real users for this tenant
    let usersQuery = supabase
      .from('users')
      .select('id, full_name, email, role')
      .order('full_name', { ascending: true })

    // 2. Fetch all leave requests for this tenant
    let requestsQuery = supabase
      .from('leave_requests')
      .select('*')
      .order('created_at', { ascending: false })

    if (!session.isSuperAdmin) {
      if (!session.tenantId) {
        return NextResponse.json({ success: true, summary: [] })
      }
      usersQuery = usersQuery.eq('tenant_id', session.tenantId)
      requestsQuery = requestsQuery.eq('tenant_id', session.tenantId)
    } else if (targetTenant) {
      usersQuery = usersQuery.eq('tenant_id', targetTenant)
      requestsQuery = requestsQuery.eq('tenant_id', targetTenant)
    }

    const { data: dbUsers } = await usersQuery
    const { data: leaveRequests } = await requestsQuery

    // Calculate quota balances per user based on approved leave requests
    const users = dbUsers || []
    const requests = leaveRequests || []

    const summary = users.map((u) => {
      const userRequests = requests.filter((r) => r.user_id === u.id && r.status === 'APPROVED')
      
      let clTaken = 0
      let slTaken = 0
      let elTaken = 0

      userRequests.forEach((r) => {
        const type = (r.leave_type || '').toUpperCase()
        const days = r.days || 1
        if (type.includes('SICK') || type.includes('MEDICAL')) {
          slTaken += days
        } else if (type.includes('EARNED') || type.includes('ANNUAL')) {
          elTaken += days
        } else {
          clTaken += days
        }
      })

      return {
        id: u.id,
        employee: u.full_name || u.email.split('@')[0],
        email: u.email,
        role: u.role === 'TENANT_ADMIN' ? 'Tenant Admin' : 'Employee',
        clTaken,
        clRemaining: Math.max(0, 12 - clTaken),
        slTaken,
        slRemaining: Math.max(0, 10 - slTaken),
        elTaken,
        elRemaining: Math.max(0, 15 - elTaken),
      }
    })

    return NextResponse.json({
      success: true,
      summary,
      totalEmployees: users.length,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
