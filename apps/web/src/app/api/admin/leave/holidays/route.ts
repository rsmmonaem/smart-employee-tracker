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
      return NextResponse.json({ success: true, holidays: [] })
    }

    let holidaysQuery = supabase
      .from('holidays')
      .select('*')
      .order('date', { ascending: true })

    if (!session.isSuperAdmin) {
      holidaysQuery = holidaysQuery.eq('tenant_id', tenantId)
    } else if (tenantId) {
      holidaysQuery = holidaysQuery.eq('tenant_id', tenantId)
    }

    const { data: holidays, error } = await holidaysQuery

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, holidays: holidays || [] })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

// POST: Add new organization holiday
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

    const { name, date, type } = body

    if (!name || !date) {
      return NextResponse.json({ success: false, error: 'Name and Date are required' }, { status: 400 })
    }

    const d = new Date(date)
    const day = d.toLocaleDateString('en-US', { weekday: 'long' })

    const { data, error } = await supabase
      .from('holidays')
      .insert({
        tenant_id: tenantId,
        name,
        date,
        day,
        type: type || 'Public Holiday',
      })
      .select('*')
      .single()

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, holiday: data })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

// DELETE: Remove organization holiday
export async function DELETE(req: Request) {
  try {
    const session = await getSessionContext()
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    let tenantId = searchParams.get('tenantId') || session.tenantId

    if (!id) {
      return NextResponse.json({ success: false, error: 'Holiday ID required' }, { status: 400 })
    }

    const supabase = createAdminClient()

    let deleteQuery = supabase
      .from('holidays')
      .delete()
      .eq('id', id)

    if (!session.isSuperAdmin) {
      if (!session.tenantId) {
        return NextResponse.json({ success: false, error: 'Unauthorized tenant' }, { status: 401 })
      }
      deleteQuery = deleteQuery.eq('tenant_id', session.tenantId)
    } else if (tenantId) {
      deleteQuery = deleteQuery.eq('tenant_id', tenantId)
    }

    const { error } = await deleteQuery

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
