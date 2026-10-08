import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { getSessionContext } from '@/utils/supabase/auth-context'

export const dynamic = 'force-dynamic'

// GET all screenshots (STRICT MULTI-TENANT ISOLATED)
export async function GET(req: Request) {
  try {
    const session = await getSessionContext()
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const targetDate = searchParams.get('date') // optional YYYY-MM-DD
    const userId = searchParams.get('userId') // optional filter (UUID or email)
    const team = searchParams.get('team') || searchParams.get('teamId') // optional filter (name or UUID)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = parseInt(searchParams.get('limit') || searchParams.get('pageSize') || '24', 10)
    const offset = (page - 1) * limit

    const supabase = createAdminClient()

    let query = supabase
      .from('screenshots')
      .select('id, tenant_id, user_id, storage_path, taken_at, is_blurred, created_at, users(full_name, email)', { count: 'exact' })
      .order('created_at', { ascending: false })

    // Strict Tenant Isolation: Non-superadmin users can ONLY see their own company's screenshots
    if (!session.isSuperAdmin) {
      if (!session.tenantId) {
        return NextResponse.json({ success: true, screenshots: [], count: 0, totalCount: 0, page: 1, totalPages: 1 })
      }
      query = query.eq('tenant_id', session.tenantId)

      // If an employee is logged in, they can only view their own screenshots
      if (session.role === 'EMPLOYEE') {
        query = query.eq('user_id', session.userId)
      }
    }

    // 1. Filter by specific Employee (by UUID or email)
    if (userId && userId !== 'all') {
      if (userId.includes('@')) {
        let uLookup = supabase.from('users').select('id').eq('email', userId)
        if (!session.isSuperAdmin && session.tenantId) {
          uLookup = uLookup.eq('tenant_id', session.tenantId)
        }
        const { data: u } = await uLookup.maybeSingle()
        if (u?.id) {
          query = query.eq('user_id', u.id)
        } else {
          return NextResponse.json({ success: true, screenshots: [], count: 0, totalCount: 0, page: 1, totalPages: 1 })
        }
      } else {
        query = query.eq('user_id', userId)
      }
    }

    // 2. Filter by Team if selected
    if (team && team !== 'all' && team !== 'All Team') {
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(team)
      let targetTeamId = isUUID ? team : null

      if (!targetTeamId) {
        let teamLookup = supabase.from('teams').select('id').ilike('name', team)
        if (!session.isSuperAdmin && session.tenantId) {
          teamLookup = teamLookup.eq('tenant_id', session.tenantId)
        }
        const { data: teamRow } = await teamLookup.maybeSingle()
        targetTeamId = teamRow?.id || null
      }

      if (targetTeamId) {
        let memberQuery = supabase.from('team_members').select('user_id').eq('team_id', targetTeamId)
        if (!session.isSuperAdmin && session.tenantId) {
          memberQuery = memberQuery.eq('tenant_id', session.tenantId)
        }
        const { data: members } = await memberQuery
        const memberIds = (members || []).map((m) => m.user_id)

        if (memberIds.length > 0) {
          query = query.in('user_id', memberIds)
        } else {
          return NextResponse.json({ success: true, screenshots: [], count: 0, totalCount: 0, page: 1, totalPages: 1 })
        }
      }
    }

    if (targetDate) {
      // Create flexible date boundaries to handle both UTC and local timezone offsets (+/- 14h)
      const startOfDay = `${targetDate}T00:00:00.000Z`
      const endOfDay = `${targetDate}T23:59:59.999Z`
      query = query.gte('taken_at', startOfDay).lte('taken_at', endOfDay)
    }

    query = query.range(offset, offset + limit - 1)

    const { data, error, count: totalCount } = await query

    if (error) {
      console.error('Error fetching screenshots from database:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    const total = totalCount ?? (data || []).length
    const totalPages = Math.max(1, Math.ceil(total / limit))

    return NextResponse.json({
      success: true,
      screenshots: data || [],
      count: (data || []).length,
      totalCount: total,
      page,
      limit,
      totalPages,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('GET /api/admin/screenshots error:', err)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

// DELETE screenshots (STRICT MULTI-TENANT ISOLATED)
export async function DELETE(req: Request) {
  try {
    const session = await getSessionContext()
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    let id = searchParams.get('id')
    let storagePath = searchParams.get('path')
    let ids: string[] = []
    let storagePaths: string[] = []

    try {
      const body = await req.json()
      if (body) {
        if (body.ids && Array.isArray(body.ids)) {
          ids = body.ids
          storagePaths = body.paths || []
        } else if (body.id) {
          id = body.id
          storagePath = body.storagePath || body.path
        }
      }
    } catch {
      // no json body
    }

    if (!id && ids.length === 0) {
      return NextResponse.json({ success: false, error: 'Screenshot ID or IDs are required' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // 1. Check Tenant Subscription Plan
    const isBulk = ids.length > 1

    if (isBulk && !session.isSuperAdmin) {
      let tenantPlan = 'BASIC'
      if (session.tenantId) {
        const { data: tenant } = await supabase
          .from('tenants')
          .select('plan')
          .eq('id', session.tenantId)
          .single()
        tenantPlan = tenant?.plan || 'BASIC'
      }

      if (tenantPlan === 'BASIC') {
        return NextResponse.json(
          {
            success: false,
            error: 'Bulk screenshot deletion is a PRO feature. Upgrade to Smart Employee Tracker PRO to delete multiple screenshots at once.',
            requiresUpgrade: true,
            currentPlan: 'BASIC',
            requiredPlan: 'PRO',
            feature: 'BULK_SCREENSHOT_DELETE',
          },
          { status: 403 }
        )
      }
    }

    // 2. Perform Single Deletion (verify tenant ownership)
    if (id && ids.length <= 1) {
      const targetId = id || ids[0]
      const { data: targetRecord } = await supabase
        .from('screenshots')
        .select('id, storage_path, tenant_id, user_id')
        .eq('id', targetId)
        .single()

      if (!targetRecord) {
        return NextResponse.json({ success: false, error: 'Screenshot not found' }, { status: 404 })
      }

      // Security check: must belong to company or be superadmin
      if (!session.isSuperAdmin && targetRecord.tenant_id !== session.tenantId) {
        return NextResponse.json({ success: false, error: 'Forbidden: Cannot delete other companies data' }, { status: 403 })
      }

      const { error: dbErr } = await supabase.from('screenshots').delete().eq('id', targetId)
      if (dbErr) {
        return NextResponse.json({ success: false, error: dbErr.message }, { status: 500 })
      }

      const targetPath = storagePath || targetRecord.storage_path
      if (targetPath) {
        await supabase.storage.from('screenshots').remove([targetPath])
      }

      return NextResponse.json({
        success: true,
        message: 'Screenshot deleted successfully',
      })
    }

    // 3. Perform Bulk Deletion (verify tenant ownership for all)
    let fetchQuery = supabase.from('screenshots').select('id, storage_path, tenant_id').in('id', ids)
    if (!session.isSuperAdmin && session.tenantId) {
      fetchQuery = fetchQuery.eq('tenant_id', session.tenantId)
    }

    const { data: rows } = await fetchQuery
    const validIds = (rows || []).map((r) => r.id)
    const validPaths = (rows || []).map((r) => r.storage_path).filter(Boolean)

    if (validIds.length === 0) {
      return NextResponse.json({ success: false, error: 'No matching screenshots found for your company' }, { status: 404 })
    }

    const { error: bulkDbErr } = await supabase.from('screenshots').delete().in('id', validIds)
    if (bulkDbErr) {
      return NextResponse.json({ success: false, error: bulkDbErr.message }, { status: 500 })
    }

    if (validPaths.length > 0) {
      await supabase.storage.from('screenshots').remove(validPaths)
    }

    return NextResponse.json({
      success: true,
      message: `Successfully deleted ${validIds.length} screenshots`,
      count: validIds.length,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('DELETE /api/admin/screenshots error:', err)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
