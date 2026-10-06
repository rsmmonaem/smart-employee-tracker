import { createClient } from './server'
import { createAdminClient } from './admin'

export interface UserContext {
  userId: string
  email: string
  role: 'SUPER_ADMIN' | 'TENANT_ADMIN' | 'EMPLOYEE'
  tenantId: string | null
  isSuperAdmin: boolean
}

/**
 * Resolves the authenticated user, role, and tenantId from the current request session.
 * Returns null if the user is unauthenticated.
 */
export async function getSessionContext(): Promise<UserContext | null> {
  try {
    const supabase = createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
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

    return {
      userId: user.id,
      email: user.email || profile?.email || '',
      role,
      tenantId,
      isSuperAdmin: role === 'SUPER_ADMIN',
    }
  } catch (err) {
    console.error('Error resolving session context:', err)
    return null
  }
}
