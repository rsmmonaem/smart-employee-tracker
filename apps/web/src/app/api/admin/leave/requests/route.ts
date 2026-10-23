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
    const supabase = createAdminClient()
    let tenantId = searchParams.get('tenantId') || session.tenantId
    if (!tenantId && session.isSuperAdmin) {
      const { data: defaultTenant } = await supabase.from('tenants').select('id').order('created_at', { ascending: false }).limit(1).maybeSingle()
      tenantId = defaultTenant?.id || null
    }

    if (!tenantId) {
      return NextResponse.json({ success: true, requests: [] })
    }

    let requestsQuery = supabase
      .from('leave_requests')
      .select('*, users(full_name, email, role)')
      .order('created_at', { ascending: false })

    if (!session.isSuperAdmin) {
      requestsQuery = requestsQuery.eq('tenant_id', tenantId)
    }

    const { data: requests, error } = await requestsQuery

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    const formatted = (requests || []).map((r: any) => ({
      id: r.id,
      employee: r.users?.full_name || r.users?.email?.split('@')[0] || 'Employee',
      employeeEmail: r.users?.email || '',
      leaveType: r.leave_type,
      startDate: r.start_date,
      endDate: r.end_date,
      days: r.days,
      reason: r.reason || '',
      status: r.status,
      createdAt: r.created_at,
    }))

    return NextResponse.json({ success: true, requests: formatted })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

// POST: Submit a new leave request
export async function POST(req: Request) {
  try {
    const session = await getSessionContext()
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const supabase = createAdminClient()
    let tenantId = body.tenantId || session.tenantId
    if (!tenantId && session.isSuperAdmin) {
      const { data: defaultTenant } = await supabase.from('tenants').select('id').order('created_at', { ascending: false }).limit(1).maybeSingle()
      tenantId = defaultTenant?.id || null
    }

    if (!tenantId) {
      return NextResponse.json({ success: false, error: 'Tenant ID required' }, { status: 400 })
    }

    const { leaveType, startDate, endDate, days, reason, userId } = body

    if (!leaveType || !startDate || !endDate) {
      return NextResponse.json({ success: false, error: 'Missing required leave fields' }, { status: 400 })
    }

    const targetUserId = userId || session.userId

    const { data, error } = await supabase
      .from('leave_requests')
      .insert({
        tenant_id: tenantId,
        user_id: targetUserId,
        leave_type: leaveType,
        start_date: startDate,
        end_date: endDate,
        days: days || 1,
        reason: reason || '',
        status: 'PENDING',
      })
      .select('*')
      .single()

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, request: data })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

// PUT: Approve / Reject leave request
export async function PUT(req: Request) {
  try {
    const session = await getSessionContext()
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { id, status } = body

    if (!id || !['APPROVED', 'REJECTED', 'PENDING'].includes(status)) {
      return NextResponse.json({ success: false, error: 'Invalid leave request ID or status' }, { status: 400 })
    }

    const supabase = createAdminClient()
    let tenantId = body.tenantId || session.tenantId

    let updateQuery = supabase
      .from('leave_requests')
      .update({ status })
      .eq('id', id)

    if (!session.isSuperAdmin) {
      if (!session.tenantId) {
        return NextResponse.json({ success: false, error: 'Unauthorized tenant' }, { status: 401 })
      }
      updateQuery = updateQuery.eq('tenant_id', session.tenantId)
    } else if (tenantId) {
      updateQuery = updateQuery.eq('tenant_id', tenantId)
    }

    const { error } = await updateQuery

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
