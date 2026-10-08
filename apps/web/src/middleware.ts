import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Protected paths that require authentication
  const isProtectedPath =
    pathname.startsWith('/admin') ||
    pathname.startsWith('/superadmin') ||
    pathname.startsWith('/my-teams') ||
    pathname.startsWith('/reports') ||
    pathname.startsWith('/overview')

  // 1. Unauthenticated users cannot access protected routes
  if (!user && isProtectedPath) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(url)
  }

  // 2. Authenticated users visiting /login get redirected based on their role
  if (user && pathname === '/login') {
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    const userRole = profile?.role || user.user_metadata?.role || 'EMPLOYEE'

    const url = request.nextUrl.clone()
    if (userRole === 'SUPER_ADMIN') {
      url.pathname = '/superadmin'
    } else if (userRole === 'EMPLOYEE') {
      url.pathname = '/admin/timeline'
    } else {
      url.pathname = '/admin/dashboard'
    }
    return NextResponse.redirect(url)
  }

  // 3. Authenticated users accessing /superadmin must have SUPER_ADMIN role
  if (user && pathname.startsWith('/superadmin')) {
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    const userRole = profile?.role || user.user_metadata?.role || 'EMPLOYEE'

    if (userRole !== 'SUPER_ADMIN') {
      const url = request.nextUrl.clone()
      url.pathname = userRole === 'EMPLOYEE' ? '/admin/timeline' : '/admin/dashboard'
      return NextResponse.redirect(url)
    }
  }

  // 4. Protect Admin-only routes from EMPLOYEE role
  const adminOnlyRoutes = [
    '/admin/dashboard',
    '/admin/employees',
    '/admin/teams',
    '/admin/apps/review',
    '/admin/billing',
    '/admin/risk-users',
    '/admin/reports',
  ]

  const isAdminOnly = adminOnlyRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`))
  if (user && isAdminOnly) {
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    const userRole = profile?.role || user.user_metadata?.role || 'EMPLOYEE'

    if (userRole === 'EMPLOYEE') {
      const url = request.nextUrl.clone()
      url.pathname = '/admin/timeline'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
