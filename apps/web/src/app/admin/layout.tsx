import AdminSidebar from './admin-sidebar'
import { getSessionContext } from '@/utils/supabase/auth-context'
import { AdminFilterProvider } from './admin-filter-context'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSessionContext()

  if (!session) {
    redirect('/login')
  }

  return (
    <AdminFilterProvider>
      <div className="flex h-screen bg-gray-50 dark:bg-gray-950 font-sans antialiased text-gray-900 dark:text-gray-100 overflow-hidden transition-colors duration-150">
        <AdminSidebar userEmail={session.email} />
        <main className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-gray-50/50 dark:bg-gray-950 transition-colors duration-150">
          {children}
        </main>
      </div>
    </AdminFilterProvider>
  )
}
