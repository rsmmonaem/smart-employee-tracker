import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { createClient } from '@/utils/supabase/server'
import { sendWelcomeEmail } from '@/lib/email/mailer'
import { PaymentGatewayService } from '@/lib/payments/gateway-service'

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
    const requestedSeats = Math.max(1, Number(body.seats) || 1)

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
        max_seats: isEnterprise ? Math.max(requestedSeats, 10) : isPro ? requestedSeats : 10,
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

    // 6. Ensure record in public.users is aligned as TENANT_ADMIN
    const { error: userProfileErr } = await adminSupabase.from('users').upsert({
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

    // 8.5. If paid plan (PRO / ENTERPRISE) with payment gateway selected, initiate checkout session
    let checkoutDetails = null
    if (tenantPlan !== 'BASIC' && body.gateway) {
      try {
        checkoutDetails = await PaymentGatewayService.processCheckout({
          gateway: body.gateway,
          plan: tenantPlan,
          billingCycle: body.billingCycle || 'annual',
          currency: body.currency || 'BDT',
          seats: Number(body.seats) || 1,
          tenantId: tenant.id,
          paymentDetails: body.paymentDetails || {},
          returnUrl: 'https://app.tracmatrix.com/api/billing/eps/callback',
        })
      } catch (payErr) {
        console.warn('Checkout payment initiation error during registration:', payErr)
      }
    }

    // 9. Send Welcome Email via SMTP
    try {
      await sendWelcomeEmail({
        email,
        companyName,
        loginUrl: 'https://app.tracmatrix.com/login',
      })
    } catch (mailErr) {
      console.warn('Welcome email delivery error:', mailErr)
    }

    // If paid plan requires redirection to payment gateway
    if (checkoutDetails?.requiresRedirect && checkoutDetails?.paymentUrl) {
      return NextResponse.json({
        success: true,
        requiresPayment: true,
        paymentUrl: checkoutDetails.paymentUrl,
        trxId: checkoutDetails.trxId,
        message: 'Account created! Redirecting to payment portal to complete subscription...',
        tenant: {
          id: tenant.id,
          name: tenant.name,
          plan: tenant.plan,
          slug: tenant.slug,
        },
        redirectTo: checkoutDetails.paymentUrl,
      })
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
