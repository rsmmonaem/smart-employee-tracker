import { getSessionContext } from '@/utils/supabase/auth-context'
import { redirect } from 'next/navigation'
import SettingsClient from './settings-client'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const session = await getSessionContext()
  if (!session) {
    redirect('/login')
  }

  const isEmployee = session.role === 'EMPLOYEE'

  return <SettingsClient isEmployee={isEmployee} userRole={session.role} />
}
