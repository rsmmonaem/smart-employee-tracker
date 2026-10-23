import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { getSessionContext } from '@/utils/supabase/auth-context'

export const dynamic = 'force-dynamic'

// GET timelapse jobs (STRICT MULTI-TENANT ISOLATED)
export async function GET(req: Request) {
  try {
    const session = await getSessionContext()
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const targetDate = searchParams.get('date')
    const userId = searchParams.get('userId')
    const limit = parseInt(searchParams.get('limit') || '50', 10)

    const supabase = createAdminClient()

    let query = supabase
      .from('timelapse_jobs')
      .select('id, tenant_id, user_id, date, status, video_url, created_at, users(full_name, email)')
      .order('created_at', { ascending: false })
      .limit(limit)

    // Strict Tenant Isolation
    if (!session.isSuperAdmin) {
      if (!session.tenantId) {
        return NextResponse.json({ success: true, jobs: [], count: 0 })
      }
      query = query.eq('tenant_id', session.tenantId)

      if (session.role === 'EMPLOYEE') {
        query = query.eq('user_id', session.userId)
      }
    }

    if (userId && userId !== 'all') {
      query = query.eq('user_id', userId)
    }

    if (targetDate) {
      query = query.eq('date', targetDate)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching timelapse jobs:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      jobs: data || [],
      count: (data || []).length,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('GET /api/admin/timelapse error:', err)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
