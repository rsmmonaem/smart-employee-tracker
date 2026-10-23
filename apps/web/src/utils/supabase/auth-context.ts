import { cookies } from 'next/headers'
import crypto from 'crypto'
import { createClient } from './server'
import { createAdminClient } from './admin'

export interface UserContext {
  userId: string
  email: string
  role: 'SUPER_ADMIN' | 'TENANT_ADMIN' | 'EMPLOYEE'
  tenantId: string | null
  isSuperAdmin: boolean
}

interface CachedSession {
  context: UserContext
  expiresAt: number
}

// In-memory cache to prevent redundant Supabase Auth network roundtrips on every request
const sessionCache = new Map<string, CachedSession>()

/**
 * Resolves the authenticated user, role, and tenantId from the current request session.
 * Uses a high-performance in-memory cache (60s TTL) to eliminate repetitive auth network overhead.
 * Returns null if the user is unauthenticated.
 */
export async function getSessionContext(): Promise<UserContext | null> {
  try {
    const cookieStore = cookies()
    const allCookies = cookieStore.getAll()

    // Build a cryptographically unique SHA-256 key from Supabase authentication cookies
    const authCookiesStr = allCookies
      .filter((c) => c.name.startsWith('sb-'))
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((c) => `${c.name}=${c.value}`)
      .join(';')

    if (!authCookiesStr) {
      return null
    }

    const authKeyParts = crypto.createHash('sha256').update(authCookiesStr).digest('hex')

    const now = Date.now()
    const cached = sessionCache.get(authKeyParts)
    if (cached && cached.expiresAt > now) {
      return cached.context
    }

    const supabase = createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      sessionCache.delete(authKeyParts)
      return null
    }

    const admin = createAdminClient()
    const { data: profile } = await admin
      .from('users')
      .select('id, email, role, tenant_id')
      .eq('id', user.id)
      .maybeSingle()

    const role = (profile?.role || user.user_metadata?.role || 'EMPLOYEE') as
      | 'SUPER_ADMIN'
      | 'TENANT_ADMIN'
      | 'EMPLOYEE'

    const tenantId = profile?.tenant_id || user.user_metadata?.tenant_id || null

    const context: UserContext = {
      userId: user.id,
      email: user.email || profile?.email || '',
      role,
      tenantId,
      isSuperAdmin: role === 'SUPER_ADMIN',
    }

    // Cache valid session for 60 seconds
    sessionCache.set(authKeyParts, {
      context,
      expiresAt: now + 60_000,
    })

    // Housekeeping: clean expired entries if cache grows
    if (sessionCache.size > 300) {
      sessionCache.forEach((val, key) => {
        if (val.expiresAt < now) {
          sessionCache.delete(key)
        }
      })
    }

    return context
  } catch (err) {
    console.error('Error resolving session context:', err)
    return null
  }
}
