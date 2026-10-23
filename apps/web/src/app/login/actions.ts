'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function login(formData: FormData) {
  const supabase = createClient()

  const email = (formData.get('email') as string)?.trim()
  const password = formData.get('password') as string
  const redirectTo = (formData.get('redirectTo') as string)?.trim() || ''

  if (!email || !password) {
    redirect(`/login?error=${encodeURIComponent('Please enter both email and password')}${redirectTo ? `&redirectTo=${encodeURIComponent(redirectTo)}` : ''}`)
  }

  const { data: authData, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error || !authData?.user) {
    redirect(`/login?error=${encodeURIComponent(error?.message || 'Invalid email or password')}${redirectTo ? `&redirectTo=${encodeURIComponent(redirectTo)}` : ''}`)
  }

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', authData.user.id)
    .single()

  revalidatePath('/', 'layout')

  // If a valid internal path was requested, honor it
  if (redirectTo && redirectTo.startsWith('/') && !redirectTo.startsWith('//')) {
    // If attempting to go to superadmin but not superadmin, route to admin dashboard
    if (redirectTo.startsWith('/superadmin') && profile?.role !== 'SUPER_ADMIN') {
      redirect('/admin/dashboard')
    }
    redirect(redirectTo)
  }

  // Default redirects based on role
  if (profile?.role === 'SUPER_ADMIN') {
    redirect('/superadmin')
  } else {
    redirect('/admin/dashboard')
  }
}
