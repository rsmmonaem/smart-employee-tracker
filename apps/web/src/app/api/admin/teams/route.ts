import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'

export const dynamic = 'force-dynamic'

const DEFAULT_TENANT_ID = '7d91b2a1-c727-4f50-83ec-4fdb9debebd3'

const INITIAL_TEAMS = [
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
]

// GET all teams
export async function GET() {
  try {
    const supabase = createAdminClient()

    // 1. Fetch teams
    const { data: initialTeams, error } = await supabase
      .from('teams')
      .select('*')
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching teams:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    let teams = initialTeams

    // Auto-seed if empty
    if (!teams || teams.length === 0) {
      const inserts = INITIAL_TEAMS.map((t) => ({
        tenant_id: DEFAULT_TENANT_ID,
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

    // Get member counts from auth users metadata
    const { data: authData } = await supabase.auth.admin.listUsers()
    const allUsers = authData?.users || []

    const teamList = (teams || []).map((t) => {
      const count = allUsers.filter(
        (u) => (u.user_metadata?.team || 'Engineering').toLowerCase() === t.name.toLowerCase()
      ).length

      return {
        id: t.id,
        name: t.name,
        description: t.description,
        lead: 'Admin User',
        membersCount: count > 0 ? count : 1,
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
    const body = await req.json()
    const { name, description } = body

    if (!name || !name.trim()) {
      return NextResponse.json({ success: false, error: 'Team name is required' }, { status: 400 })
    }

    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('teams')
      .insert({
        tenant_id: DEFAULT_TENANT_ID,
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
    const body = await req.json()
    const { id, name, description } = body

    if (!id || !name || !name.trim()) {
      return NextResponse.json(
        { success: false, error: 'Team ID and name are required' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('teams')
      .update({
        name: name.trim(),
        description: description !== undefined ? description.trim() : null,
      })
      .eq('id', id)
      .select('*')
      .single()

    if (error) {
      console.error('Error updating team:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
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
