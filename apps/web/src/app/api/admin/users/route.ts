import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'

export const dynamic = 'force-dynamic'

// GET all users/employees
export async function GET() {
  try {
    const supabase = createAdminClient()

    // 1. Fetch public.users
    const { data: dbUsers, error: usersErr } = await supabase
      .from('users')
      .select('id, full_name, email, role, is_active, created_at, avatar_url, tenant_id')
      .order('created_at', { ascending: false })

    if (usersErr) {
      console.error('Error fetching users:', usersErr)
      return NextResponse.json({ success: false, error: usersErr.message }, { status: 500 })
    }

    // 2. Fetch auth users to get team metadata
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

// POST create employee
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { email, fullName, role, team } = body

    if (!email || !fullName) {
      return NextResponse.json(
        { success: false, error: 'Email and Full Name are required' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // 1. Get default tenant
    const { data: tenant } = await supabase
      .from('tenants')
      .select('id')
      .eq('slug', 'test-tenant')
      .single()

    const tenantId = tenant?.id || '7d91b2a1-c727-4f50-83ec-4fdb9debebd3'

    // 2. Create in auth.users
    const { data: authUser, error: authErr } = await supabase.auth.admin.createUser({
      email,
      password: 'password123',
      email_confirm: true,
      user_metadata: { full_name: fullName, team: team || 'Engineering' },
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

    // 3. Insert into public.users
    const { error: insertErr } = await supabase.from('users').insert({
      id: userId,
      tenant_id: tenantId,
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

// PUT update employee details (Name, Role, is_active, team)
export async function PUT(req: Request) {
  try {
    const body = await req.json()
    const { id, fullName, role, isActive, team } = body

    if (!id) {
      return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Build update object for public.users
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
        console.error('Error updating public.users:', updateErr)
        return NextResponse.json({ success: false, error: updateErr.message }, { status: 500 })
      }
    }

    // Update auth metadata if fullName or team changed
    const metaUpdates: Record<string, unknown> = {}
    if (fullName !== undefined) metaUpdates.full_name = fullName
    if (team !== undefined) metaUpdates.team = team

    if (Object.keys(metaUpdates).length > 0) {
      await supabase.auth.admin.updateUserById(id, {
        user_metadata: metaUpdates,
      })
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

// DELETE employee
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    let userId = searchParams.get('id')

    if (!userId) {
      try {
        const body = await req.json()
        userId = body.id || body.userId
      } catch {
        // no body
      }
    }

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // 1. Delete from public.users (foreign keys have ON DELETE CASCADE)
    const { error: dbErr } = await supabase.from('users').delete().eq('id', userId)
    if (dbErr) {
      console.error('Error deleting from public.users:', dbErr)
      return NextResponse.json({ success: false, error: dbErr.message }, { status: 500 })
    }

    // 2. Delete from auth.users
    const { error: authErr } = await supabase.auth.admin.deleteUser(userId)
    if (authErr) {
      console.warn('Warning: Could not delete from auth.users:', authErr.message)
    }

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
