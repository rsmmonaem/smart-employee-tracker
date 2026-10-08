import { NextResponse } from 'next/server'
import { getSessionContext } from '@/utils/supabase/auth-context'
import { createAdminClient } from '@/utils/supabase/admin'

export const dynamic = 'force-dynamic'

// GET current authenticated user profile and permissions
export async function GET() {
  try {
    const session = await getSessionContext()
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createAdminClient()
    const { data: userProfile } = await supabase
      .from('users')
      .select('id, email, full_name, role, tenant_id, avatar_url, created_at')
      .eq('id', session.userId)
      .maybeSingle()

    return NextResponse.json({
      success: true,
      user: {
        id: session.userId,
        email: session.email,
        fullName: userProfile?.full_name || session.email.split('@')[0],
        role: session.role,
        tenantId: session.tenantId,
        isSuperAdmin: session.isSuperAdmin,
        isTenantAdmin: session.role === 'TENANT_ADMIN' || session.isSuperAdmin,
        isEmployee: session.role === 'EMPLOYEE',
      },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

// PUT update current user's OWN profile (Full Name, Password)
export async function PUT(req: Request) {
  try {
    const session = await getSessionContext()
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { fullName, password } = body

    const supabase = createAdminClient()

    // 1. Update public.users full_name
    if (fullName !== undefined) {
      const { error: dbErr } = await supabase
        .from('users')
        .update({ full_name: fullName.trim() })
        .eq('id', session.userId)

      if (dbErr) {
        return NextResponse.json({ success: false, error: dbErr.message }, { status: 500 })
      }
    }

    // 2. Update Supabase Auth user metadata & password
    const authUpdates: Record<string, unknown> = {}
    if (fullName !== undefined) {
      authUpdates.user_metadata = { full_name: fullName.trim() }
    }
    if (password && password.trim().length >= 6) {
      authUpdates.password = password.trim()
    }

    if (Object.keys(authUpdates).length > 0) {
      const { error: authErr } = await supabase.auth.admin.updateUserById(
        session.userId,
        authUpdates
      )
      if (authErr) {
        return NextResponse.json({ success: false, error: authErr.message }, { status: 500 })
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
