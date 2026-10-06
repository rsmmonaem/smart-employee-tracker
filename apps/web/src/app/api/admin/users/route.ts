import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { getSessionContext } from '@/utils/supabase/auth-context'

export const dynamic = 'force-dynamic'

// GET all users/employees (STRICT MULTI-TENANT ISOLATED)
export async function GET() {
  try {
    const session = await getSessionContext()
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createAdminClient()

    let query = supabase
      .from('users')
      .select('id, full_name, email, role, is_active, created_at, avatar_url, tenant_id')
      .order('created_at', { ascending: false })

    // Strict Tenant Isolation
    if (!session.isSuperAdmin) {
      if (!session.tenantId) {
        return NextResponse.json({ success: true, employees: [], total: 0 })
      }
      query = query.eq('tenant_id', session.tenantId)
    }

    const { data: dbUsers, error: usersErr } = await query

    if (usersErr) {
      console.error('Error fetching users:', usersErr)
      return NextResponse.json({ success: false, error: usersErr.message }, { status: 500 })
    }

    // Auth metadata for teams
    const { data: authData } = await supabase.auth.admin.listUsers()
    const authMap = new Map((authData?.users || []).map((u) => [u.id, u.user_metadata || {}]))

    const employees = (dbUsers || []).map((u) => {
      const meta = authMap.get(u.id) || {}
      return {
        id: u.id,
        full_name: u.full_name,
        email: u.email,
        role: u.role,
        is_active: u.is_active,
        created_at: u.created_at,
        team: meta.team || 'Engineering',
      }
    })

    return NextResponse.json({
      success: true,
      employees,
      total: employees.length,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('GET /api/admin/users error:', err)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

// POST create employee (STRICT MULTI-TENANT ISOLATED)
export async function POST(req: Request) {
  try {
    const session = await getSessionContext()
    if (!session || (session.role !== 'TENANT_ADMIN' && !session.isSuperAdmin)) {
      return NextResponse.json({ success: false, error: 'Forbidden: Admin access required' }, { status: 403 })
    }

    const body = await req.json()
    const { email, fullName, role, team, password } = body

    if (!email || !fullName) {
      return NextResponse.json(
        { success: false, error: 'Email and Full Name are required' },
        { status: 400 }
      )
    }

    const userPassword = password && password.trim().length >= 6 ? password.trim() : 'password123'

    const targetTenantId = session.isSuperAdmin ? (body.tenantId || session.tenantId) : session.tenantId

    if (!targetTenantId) {
      return NextResponse.json({ success: false, error: 'No tenant workspace configured' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // 1. Create in auth.users
    const { data: authUser, error: authErr } = await supabase.auth.admin.createUser({
      email,
      password: userPassword,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        team: team || 'Engineering',
        tenant_id: targetTenantId,
        role: role || 'EMPLOYEE',
      },
    })

    if (authErr) {
      if (authErr.message.includes('already registered')) {
        return NextResponse.json(
          { success: false, error: 'User with this email already exists' },
          { status: 400 }
        )
      }
      return NextResponse.json({ success: false, error: authErr.message }, { status: 500 })
    }

    const userId = authUser.user.id

    // 2. Ensure public.users has updated tenant and team attributes (trigger handles insertion, upsert guarantees correct state)
    const { error: insertErr } = await supabase.from('users').upsert({
      id: userId,
      tenant_id: targetTenantId,
      email,
      full_name: fullName,
      role: role || 'EMPLOYEE',
      is_active: true,
    })

    if (insertErr) {
      console.error('Error inserting into public.users:', insertErr)
      return NextResponse.json({ success: false, error: insertErr.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      user: {
        id: userId,
        email,
        full_name: fullName,
        role: role || 'EMPLOYEE',
        team: team || 'Engineering',
        is_active: true,
      },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('POST /api/admin/users error:', err)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

// PUT update employee (STRICT MULTI-TENANT ISOLATED)
export async function PUT(req: Request) {
  try {
    const session = await getSessionContext()
    if (!session || (session.role !== 'TENANT_ADMIN' && !session.isSuperAdmin)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const { id, fullName, role, isActive, team, password } = body

    if (!id) {
      return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Verify target user belongs to caller's company
    const { data: targetUser } = await supabase
      .from('users')
      .select('id, tenant_id')
      .eq('id', id)
      .single()

    if (!targetUser) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    if (!session.isSuperAdmin && targetUser.tenant_id !== session.tenantId) {
      return NextResponse.json({ success: false, error: 'Forbidden: Cannot edit other companies employees' }, { status: 403 })
    }

    const updatePayload: Record<string, unknown> = {}
    if (fullName !== undefined) updatePayload.full_name = fullName
    if (role !== undefined) updatePayload.role = role
    if (isActive !== undefined) updatePayload.is_active = isActive

    if (Object.keys(updatePayload).length > 0) {
      const { error: updateErr } = await supabase
        .from('users')
        .update(updatePayload)
        .eq('id', id)

      if (updateErr) {
        return NextResponse.json({ success: false, error: updateErr.message }, { status: 500 })
      }
    }

    const authUpdates: Record<string, unknown> = {}
    const metaUpdates: Record<string, unknown> = {}
    if (fullName !== undefined) metaUpdates.full_name = fullName
    if (team !== undefined) metaUpdates.team = team
    if (role !== undefined) metaUpdates.role = role

    if (Object.keys(metaUpdates).length > 0) {
      authUpdates.user_metadata = metaUpdates
    }
    if (password && password.trim().length >= 6) {
      authUpdates.password = password.trim()
    }

    if (Object.keys(authUpdates).length > 0) {
      const { error: authUpdateErr } = await supabase.auth.admin.updateUserById(id, authUpdates)
      if (authUpdateErr) {
        return NextResponse.json({ success: false, error: authUpdateErr.message }, { status: 500 })
      }
    }

    return NextResponse.json({
      success: true,
      message: 'User updated successfully',
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('PUT /api/admin/users error:', err)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

// DELETE employee (STRICT MULTI-TENANT ISOLATED)
export async function DELETE(req: Request) {
  try {
    const session = await getSessionContext()
    if (!session || (session.role !== 'TENANT_ADMIN' && !session.isSuperAdmin)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    let userId = searchParams.get('id')

    if (!userId) {
      try {
        const body = await req.json()
        userId = body.id || body.userId
      } catch {}
    }

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Verify tenant ownership
    const { data: targetUser } = await supabase
      .from('users')
      .select('id, tenant_id')
      .eq('id', userId)
      .single()

    if (!targetUser) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    if (!session.isSuperAdmin && targetUser.tenant_id !== session.tenantId) {
      return NextResponse.json({ success: false, error: 'Forbidden: Cannot delete other companies employees' }, { status: 403 })
    }

    await supabase.from('users').delete().eq('id', userId)
    await supabase.auth.admin.deleteUser(userId)

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully',
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('DELETE /api/admin/users error:', err)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
