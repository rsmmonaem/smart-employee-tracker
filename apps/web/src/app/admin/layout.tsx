import AdminSidebar from './admin-sidebar'
import { createClient } from '@/utils/supabase/server'
import { AdminFilterProvider } from './admin-filter-context'
import { redirect } from 'next/navigation'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <AdminFilterProvider>
      <div className="flex h-screen bg-[#f8f9fa] dark:bg-gray-950 font-sans antialiased text-gray-800 dark:text-gray-100 overflow-hidden">
        <AdminSidebar userEmail={user?.email} />
        <main className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-white dark:bg-gray-900">
          {children}
        </main>
      </div>
    </AdminFilterProvider>
  )
}
