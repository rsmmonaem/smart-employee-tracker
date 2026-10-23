import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const email = body.email?.trim()
    const password = body.password

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Please enter both email and password' },
        { status: 400 }
      )
    }

    const supabase = createClient()
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error || !authData?.user) {
      return NextResponse.json(
        { error: error?.message || 'Invalid email or password' },
        { status: 401 }
      )
    }

    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', authData.user.id)
      .single()

    const redirectTo =
      profile?.role === 'SUPER_ADMIN' ? '/superadmin' : '/admin/dashboard'

    return NextResponse.json({
      success: true,
      redirectTo,
    })
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Internal server error during authentication' },
      { status: 500 }
    )
  }
}
