import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { getSessionContext } from '@/utils/supabase/auth-context'

export const dynamic = 'force-dynamic'

const DEFAULT_TEAMS = [
  {
    name: 'Engineering',
    description: 'Core product engineers, frontend and backend developers',
  },
  {
    name: 'Design & UI/UX',
    description: 'Product design, UI components, and user experience research',
  },
  {
    name: 'Product & QA',
    description: 'Quality assurance, product specs, and release verification',
  },
  {
    name: 'Marketing',
    description: 'Growth marketing, acquisition and product promotion',
  },
  {
    name: 'Management',
    description: 'Executive operations and resource planning',
  },
]

// GET all teams for the active company tenant
export async function GET() {
  try {
    const session = await getSessionContext()
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = session.tenantId
    if (!tenantId && !session.isSuperAdmin) {
      return NextResponse.json({ success: true, teams: [] })
    }

    const supabase = createAdminClient()

    let query = supabase.from('teams').select('*').order('created_at', { ascending: true })
    if (!session.isSuperAdmin && tenantId) {
      query = query.eq('tenant_id', tenantId)
    }

    let { data: teams, error } = await query

    if (error) {
      console.error('Error fetching teams:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    // Auto-seed default initial teams if empty for this tenant
    if ((!teams || teams.length === 0) && tenantId) {
      const inserts = DEFAULT_TEAMS.map((t) => ({
        tenant_id: tenantId,
        name: t.name,
        description: t.description,
      }))
      const { data: seeded, error: seedErr } = await supabase
        .from('teams')
        .insert(inserts)
        .select('*')

      if (!seedErr && seeded) {
        teams = seeded
      }
    }

    // Fetch tenant users to compute exact member counts per team
    let userQuery = supabase
      .from('users')
      .select('id, full_name, email, role, is_active')
    if (!session.isSuperAdmin && tenantId) {
      userQuery = userQuery.eq('tenant_id', tenantId)
    }
    const { data: dbUsers } = await userQuery

    const { data: authData } = await supabase.auth.admin.listUsers()
    const authMap = new Map((authData?.users || []).map((u) => [u.id, u.user_metadata || {}]))

    const tenantEmployees = (dbUsers || []).map((u) => {
      const meta = authMap.get(u.id) || {}
      return {
        id: u.id,
        name: u.full_name || u.email?.split('@')[0] || 'User',
        email: u.email,
        role: u.role,
        team: meta.team || 'Engineering',
      }
    })

    const teamList = (teams || []).map((t) => {
      const members = tenantEmployees.filter(
        (u) => (u.team || '').trim().toLowerCase() === t.name.trim().toLowerCase()
      )

      return {
        id: t.id,
        name: t.name,
        description: t.description || '',
        lead: members[0]?.name || 'Admin',
        membersCount: members.length,
        members: members.map((m) => ({ id: m.id, name: m.name, email: m.email, role: m.role })),
        createdAt: t.created_at,
      }
    })

    return NextResponse.json({
      success: true,
      teams: teamList,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('GET /api/admin/teams error:', err)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

// POST create team
export async function POST(req: Request) {
  try {
    const session = await getSessionContext()
    if (!session || (session.role !== 'TENANT_ADMIN' && !session.isSuperAdmin)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const tenantId = session.tenantId
    if (!tenantId) {
      return NextResponse.json({ success: false, error: 'Tenant context required' }, { status: 400 })
    }

    const body = await req.json()
    const { name, description } = body

    if (!name || !name.trim()) {
      return NextResponse.json({ success: false, error: 'Team name is required' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Check if team with same name already exists in this tenant
    const { data: existing } = await supabase
      .from('teams')
      .select('id')
      .eq('tenant_id', tenantId)
      .ilike('name', name.trim())
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ success: false, error: 'A team with this name already exists' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('teams')
      .insert({
        tenant_id: tenantId,
        name: name.trim(),
        description: description ? description.trim() : null,
      })
      .select('*')
      .single()

    if (error) {
      console.error('Error inserting team:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      team: data,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('POST /api/admin/teams error:', err)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

// PUT update team
export async function PUT(req: Request) {
  try {
    const session = await getSessionContext()
    if (!session || (session.role !== 'TENANT_ADMIN' && !session.isSuperAdmin)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const { id, name, description } = body

    if (!id || !name || !name.trim()) {
      return NextResponse.json(
        { success: false, error: 'Team ID and name are required' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Fetch team to verify tenant ownership
    const { data: teamRec } = await supabase
      .from('teams')
      .select('id, name, tenant_id')
      .eq('id', id)
      .single()

    if (!teamRec) {
      return NextResponse.json({ success: false, error: 'Team not found' }, { status: 404 })
    }

    if (!session.isSuperAdmin && teamRec.tenant_id !== session.tenantId) {
      return NextResponse.json({ success: false, error: 'Forbidden: Cannot edit other company teams' }, { status: 403 })
    }

    const oldName = teamRec.name
    const newName = name.trim()

    const { data, error } = await supabase
      .from('teams')
      .update({
        name: newName,
        description: description !== undefined ? (description ? description.trim() : null) : undefined,
      })
      .eq('id', id)
      .select('*')
      .single()

    if (error) {
      console.error('Error updating team:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    // If the name changed, migrate employees assigned to the old team name to the new team name
    if (oldName.toLowerCase() !== newName.toLowerCase()) {
      const { data: authData } = await supabase.auth.admin.listUsers()
      const { data: dbUsers } = await supabase
        .from('users')
        .select('id')
        .eq('tenant_id', teamRec.tenant_id)

      const tenantUserIds = new Set((dbUsers || []).map((u) => u.id))

      for (const u of authData?.users || []) {
        if (tenantUserIds.has(u.id)) {
          const currentTeam = u.user_metadata?.team || ''
          if (currentTeam.trim().toLowerCase() === oldName.trim().toLowerCase()) {
            await supabase.auth.admin.updateUserById(u.id, {
              user_metadata: {
                ...u.user_metadata,
                team: newName,
              },
            })
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      team: data,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('PUT /api/admin/teams error:', err)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

// DELETE team
export async function DELETE(req: Request) {
  try {
    const session = await getSessionContext()
    if (!session || (session.role !== 'TENANT_ADMIN' && !session.isSuperAdmin)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    let teamId = searchParams.get('id')

    if (!teamId) {
      try {
        const body = await req.json()
        teamId = body.id
      } catch {
        // no body
      }
    }

    if (!teamId) {
      return NextResponse.json({ success: false, error: 'Team ID is required' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Verify tenant ownership
    const { data: teamRec } = await supabase
      .from('teams')
      .select('id, name, tenant_id')
      .eq('id', teamId)
      .single()

    if (!teamRec) {
      return NextResponse.json({ success: false, error: 'Team not found' }, { status: 404 })
    }

    if (!session.isSuperAdmin && teamRec.tenant_id !== session.tenantId) {
      return NextResponse.json({ success: false, error: 'Forbidden: Cannot delete other company teams' }, { status: 403 })
    }

    const { error } = await supabase.from('teams').delete().eq('id', teamId)

    if (error) {
      console.error('Error deleting team:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Team deleted successfully',
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('DELETE /api/admin/teams error:', err)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
