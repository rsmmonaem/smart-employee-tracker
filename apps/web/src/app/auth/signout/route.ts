import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { type NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

async function handleSignOut(req: NextRequest) {
  const supabase = createClient()

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      await supabase.auth.signOut()
    }
  } catch (err) {
    console.error('Error during signOut:', err)
  }

  revalidatePath('/', 'layout')

  // Resolve absolute base URL properly behind proxies/load balancers
  const host =
    req.headers.get('x-forwarded-host') ||
    req.headers.get('host') ||
    'app.tracmatrix.com'
  const proto =
    req.headers.get('x-forwarded-proto') ||
    (host.includes('localhost') ? 'http' : 'https')
  const loginUrl = new URL('/login', `${proto}://${host}`)

  const response = NextResponse.redirect(loginUrl, {
    status: 303, // 303 See Other is the proper status for POST redirecting to GET
  })

  // Explicitly clear all Supabase authentication cookies across root domain
  const cookiesToClear = [
    'sb-access-token',
    'sb-refresh-token',
    'supabase-auth-token',
  ]

  // Clear any cookie starting with sb- or supabase-
  req.cookies.getAll().forEach((cookie) => {
    if (
      cookie.name.startsWith('sb-') ||
      cookie.name.startsWith('supabase-') ||
      cookiesToClear.includes(cookie.name)
    ) {
      response.cookies.delete(cookie.name)
      response.cookies.set(cookie.name, '', {
        path: '/',
        expires: new Date(0),
        maxAge: 0,
      })
    }
  })

  return response
}

export async function POST(req: NextRequest) {
  return handleSignOut(req)
}

export async function GET(req: NextRequest) {
  return handleSignOut(req)
}
