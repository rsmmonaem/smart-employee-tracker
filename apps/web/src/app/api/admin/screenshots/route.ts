import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'

export const dynamic = 'force-dynamic'

export async function DELETE(req: Request) {
  try {
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
    // If attempting bulk deletion (more than 1 screenshot), PRO or ENTERPRISE is required
    const isBulk = ids.length > 1

    if (isBulk) {
      // Fetch tenant plan
      const { data: tenant } = await supabase
        .from('tenants')
        .select('id, name, plan')
        .order('created_at', { ascending: true })
        .limit(1)
        .single()

      const currentPlan = tenant?.plan || 'BASIC'

      if (currentPlan === 'BASIC') {
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

    // 2. Perform Single Deletion
    if (id && ids.length <= 1) {
      const targetId = id || ids[0]
      if (!storagePath) {
        const { data } = await supabase
          .from('screenshots')
          .select('storage_path')
          .eq('id', targetId)
          .single()
        storagePath = data?.storage_path
      }

      const { error: dbErr } = await supabase.from('screenshots').delete().eq('id', targetId)
      if (dbErr) {
        console.error('Error deleting screenshot row:', dbErr)
        return NextResponse.json({ success: false, error: dbErr.message }, { status: 500 })
      }

      if (storagePath) {
        await supabase.storage.from('screenshots').remove([storagePath])
      }

      return NextResponse.json({
        success: true,
        message: 'Screenshot deleted successfully',
      })
    }

    // 3. Perform Bulk Deletion (PRO / ENTERPRISE only)
    // If storage paths weren't passed, fetch them for all IDs
    if (storagePaths.length === 0) {
      const { data: rows } = await supabase
        .from('screenshots')
        .select('storage_path')
        .in('id', ids)

      if (rows) {
        storagePaths = rows.map((r) => r.storage_path).filter(Boolean)
      }
    }

    // Delete database rows
    const { error: bulkDbErr } = await supabase.from('screenshots').delete().in('id', ids)
    if (bulkDbErr) {
      console.error('Error in bulk screenshot deletion:', bulkDbErr)
      return NextResponse.json({ success: false, error: bulkDbErr.message }, { status: 500 })
    }

    // Delete files from storage
    if (storagePaths.length > 0) {
      await supabase.storage.from('screenshots').remove(storagePaths)
    }

    return NextResponse.json({
      success: true,
      message: `Successfully deleted ${ids.length} screenshots`,
      count: ids.length,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('DELETE /api/admin/screenshots error:', err)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
