import React from 'react'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import SuperAdminShell from './superadmin-shell'

export default async function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?redirectTo=/superadmin')
  }

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'SUPER_ADMIN') {
    redirect('/admin/dashboard')
  }

  return <SuperAdminShell userEmail={user.email}>{children}</SuperAdminShell>
}
