import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { createClient } from '@/utils/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const companyName = body.companyName?.trim()
    const email = body.email?.trim().toLowerCase()
    const phone = body.phone?.trim()
    const password = body.password
    const plan = (body.plan || 'BASIC').toUpperCase()

    // 1. Validation
    if (!companyName || !email || !password) {
      return NextResponse.json(
        { success: false, error: 'Company Name, Email, and Password are required.' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 6 characters.' },
        { status: 400 }
      )
    }

    const adminSupabase = createAdminClient()

    // 2. Check if email already exists
    const { data: existingUser } = await adminSupabase
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle()

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'An account with this email address already exists. Please log in instead.' },
        { status: 400 }
      )
    }

    // 3. Generate unique tenant slug
    let baseSlug = companyName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
    if (!baseSlug) baseSlug = 'company'
    const slug = `${baseSlug}-${Math.random().toString(36).substring(2, 7)}`

    // Determine plan quotas
    const isPro = plan === 'PRO'
    const isEnterprise = plan === 'ENTERPRISE'
    const tenantPlan = isEnterprise ? 'ENTERPRISE' : isPro ? 'PRO' : 'BASIC'

    // 4. Create new Tenant in public.tenants
    const { data: tenant, error: tenantErr } = await adminSupabase
      .from('tenants')
      .insert({
        name: companyName,
        slug,
        plan: tenantPlan,
        status: 'TRIAL',
        screenshot_interval_sec: isEnterprise ? 30 : isPro ? 60 : 300,
        retention_days: isEnterprise ? 365 : isPro ? 90 : 30,
        storage_quota_mb: isEnterprise ? 50000 : isPro ? 20000 : 5000,
        max_teams: isEnterprise ? 50 : isPro ? 20 : 5,
        max_seats: isEnterprise ? 100 : isPro ? 30 : 10,
      })
      .select()
      .single()

    if (tenantErr || !tenant) {
      console.error('Error creating tenant:', tenantErr)
      return NextResponse.json(
        { success: false, error: tenantErr?.message || 'Failed to create company tenant.' },
        { status: 500 }
      )
    }

    // 5. Create user in Supabase auth.users
    const { data: authData, error: authErr } = await adminSupabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: companyName,
        phone: phone || '',
        company_name: companyName,
        role: 'TENANT_ADMIN',
        tenant_id: tenant.id,
      },
    })

    if (authErr || !authData?.user) {
      console.error('Error creating auth user:', authErr)
      await adminSupabase.from('tenants').delete().eq('id', tenant.id)
      return NextResponse.json(
        { success: false, error: authErr?.message || 'Failed to create user account.' },
        { status: 500 }
      )
    }

    const userId = authData.user.id

    // 6. Create record in public.users as TENANT_ADMIN
    const { error: userProfileErr } = await adminSupabase.from('users').insert({
      id: userId,
      tenant_id: tenant.id,
      email,
      full_name: companyName,
      role: 'TENANT_ADMIN',
      tracking_mode: 'VISIBLE',
      is_active: true,
    })

    if (userProfileErr) {
      console.error('Error inserting into public.users:', userProfileErr)
    }

    // 7. Auto-create default team for company
    try {
      const { data: team } = await adminSupabase
        .from('teams')
        .insert({
          tenant_id: tenant.id,
          name: 'Core Team',
          description: `${companyName} default team`,
        })
        .select()
        .single()

      if (team) {
        await adminSupabase.from('team_members').insert({
          tenant_id: tenant.id,
          team_id: team.id,
          user_id: userId,
          role: 'ADMIN',
        })
      }
    } catch (teamErr) {
      console.warn('Default team creation warning:', teamErr)
    }

    // 8. Sign in the user immediately on server cookies so they are logged in!
    try {
      const serverSupabase = createClient()
      await serverSupabase.auth.signInWithPassword({
        email,
        password,
      })
    } catch (loginErr) {
      console.warn('Auto sign-in warning:', loginErr)
    }

    return NextResponse.json({
      success: true,
      message: 'Account created successfully! Welcome to Tracmatrix.',
      tenant: {
        id: tenant.id,
        name: tenant.name,
        plan: tenant.plan,
        slug: tenant.slug,
      },
      redirectTo: '/admin/dashboard',
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('POST /api/auth/register error:', err)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
