import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const plan = searchParams.get('plan')
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    const supabase = createAdminClient()

    let query = supabase.from('tenants').select('*').order('created_at', { ascending: false })

    if (plan && plan !== 'ALL') {
      query = query.eq('plan', plan)
    }
    if (status && status !== 'ALL') {
      query = query.eq('status', status)
    }
    if (search) {
      query = query.or(`name.ilike.%${search}%,slug.ilike.%${search}%`)
    }

    const { data: tenants, error } = await query

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    // Attach user count for each tenant
    const { data: users } = await supabase.from('users').select('id, tenant_id')
    const usersMap: Record<string, number> = {}
    users?.forEach((u) => {
      if (u.tenant_id) {
        usersMap[u.tenant_id] = (usersMap[u.tenant_id] || 0) + 1
      }
    })

    const enriched = (tenants || []).map((t) => ({
      ...t,
      current_users_count: usersMap[t.id] || 0,
    }))

    return NextResponse.json({ success: true, tenants: enriched })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, slug, plan = 'BASIC', status = 'ACTIVE', max_seats = 10, max_teams = 2 } = body

    if (!name || !slug) {
      return NextResponse.json({ success: false, error: 'Name and slug are required' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Determine quotas based on Smart Employee Tracker package specs
    let storage_quota_mb = 10000 // 10 GB for basic
    let screenshot_interval_sec = 600 // 10 min for basic
    let retention_days = 14 // 14 days for basic

    if (plan === 'PRO') {
      storage_quota_mb = 500000 // Unlimited (500GB virtual)
      screenshot_interval_sec = 60 // 1 minute
      retention_days = 365 // 1 year
    } else if (plan === 'ENTERPRISE') {
      storage_quota_mb = 1000000
      screenshot_interval_sec = 60
      retention_days = 730
    }

    const { data, error } = await supabase
      .from('tenants')
      .insert([
        {
          name,
          slug: slug.toLowerCase().trim().replace(/[^a-z0-9-]/g, '-'),
          plan,
          status,
          max_seats: Number(max_seats),
          max_teams: Number(max_teams),
          storage_quota_mb,
          screenshot_interval_sec,
          retention_days,
        },
      ])
      .select()
      .single()

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, tenant: data })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json()
    const { id, name, plan, status, max_seats, max_teams, storage_quota_mb, screenshot_interval_sec, retention_days } = body

    if (!id) {
      return NextResponse.json({ success: false, error: 'Tenant ID is required' }, { status: 400 })
    }

    const supabase = createAdminClient()

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (name !== undefined) updates.name = name
    if (plan !== undefined) {
      updates.plan = plan
      // Automatically adjust default quotas when changing plan
      if (plan === 'BASIC') {
        if (!storage_quota_mb) updates.storage_quota_mb = 10000
        if (!screenshot_interval_sec) updates.screenshot_interval_sec = 600
        if (!retention_days) updates.retention_days = 14
      } else if (plan === 'PRO') {
        if (!storage_quota_mb) updates.storage_quota_mb = 500000
        if (!screenshot_interval_sec) updates.screenshot_interval_sec = 60
        if (!retention_days) updates.retention_days = 365
      }
    }
    if (status !== undefined) updates.status = status
    if (max_seats !== undefined) updates.max_seats = Number(max_seats)
    if (max_teams !== undefined) updates.max_teams = Number(max_teams)
    if (storage_quota_mb !== undefined) updates.storage_quota_mb = Number(storage_quota_mb)
    if (screenshot_interval_sec !== undefined) updates.screenshot_interval_sec = Number(screenshot_interval_sec)
    if (retention_days !== undefined) updates.retention_days = Number(retention_days)

    const { data, error } = await supabase
      .from('tenants')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, tenant: data })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ success: false, error: 'Tenant ID is required' }, { status: 400 })
    }

    const supabase = createAdminClient()

    const { error } = await supabase.from('tenants').delete().eq('id', id)
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Tenant successfully deleted' })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
