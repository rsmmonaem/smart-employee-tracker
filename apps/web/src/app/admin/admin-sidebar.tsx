'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  Camera,
  Video,
  Calendar,
  AlertTriangle,
  Clock,
  FileText,
  CalendarPlus,
  CalendarDays,
  CalendarCheck,
  Palmtree,
  CheckSquare,
  History,
  BarChart2,
  Settings,
  CreditCard,
  LogOut,
  Shield,
} from 'lucide-react'

export default function AdminSidebar({ userEmail }: { userEmail?: string }) {
  const pathname = usePathname()

  const navGroups = [
    {
      title: 'Realtime',
      items: [
        { label: 'Overview', href: '/admin/dashboard', icon: LayoutDashboard },
        { label: 'My Team', href: '/admin/employees', icon: Users },
      ],
    },
    {
      title: 'Proof of work',
      items: [
        { label: 'Screenshots', href: '/admin/screenshots', icon: Camera },
        { label: 'Timelapse Videos', href: '/admin/timelapse', icon: Video },
        { label: 'Timesheet', href: '/admin/timesheet', icon: Calendar },
        { label: 'Risk Users', href: '/admin/risk-users', icon: AlertTriangle },
        { label: 'Timeline', href: '/admin/timeline', icon: Clock },
        { label: 'Reports', href: '/admin/reports', icon: FileText },
      ],
    },
    {
      title: 'Leave Management',
      items: [
        { label: 'Apply Leave', href: '/admin/leave/apply', icon: CalendarPlus },
        { label: 'Leave Summary', href: '/admin/leave/summary', icon: CalendarDays },
        { label: 'Manage Leave', href: '/admin/leave/manage', icon: CalendarCheck },
        { label: 'Manage Holiday', href: '/admin/leave/holidays', icon: Palmtree },
      ],
    },
    {
      title: 'Apps Usage',
      items: [
        { label: 'Review Apps', href: '/admin/apps/review', icon: CheckSquare },
        { label: 'Apps History', href: '/admin/apps/history', icon: History },
        { label: 'Apps Summary', href: '/admin/apps/summary', icon: BarChart2 },
      ],
    },
    {
      title: 'Configuration',
      items: [
        { label: 'Settings', href: '/admin/settings', icon: Settings },
        { label: 'Billing & Plans', href: '/admin/billing', icon: CreditCard },
      ],
    },
  ]

  return (
    <aside className="w-64 bg-white border-r border-gray-200 dark:bg-gray-900 dark:border-gray-800 hidden md:flex flex-col flex-shrink-0">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-gray-150 dark:border-gray-800 gap-2.5">
        <div className="h-9 w-9 rounded-xl bg-blue-600 flex items-center justify-center font-extrabold text-white text-base shadow-xs select-none">
          S.
        </div>
        <span className="text-base font-bold tracking-tight text-gray-900 dark:text-white truncate">
          Smart Employee Tracker
        </span>
      </div>

      {/* Navigation Groups */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-4">
        {navGroups.map((group) => (
          <div key={group.title} className="space-y-1">
            <p className="px-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider dark:text-gray-500">
              {group.title}
            </p>
            {group.items.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || (item.href !== '/admin' && pathname?.startsWith(item.href))

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`flex items-center px-3 py-2 text-xs rounded-lg transition-all ${
                    isActive
                      ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 font-semibold'
                      : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800/60 font-normal'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 mr-2.5 flex-shrink-0 ${
                      isActive ? 'text-blue-600 dark:text-blue-400 stroke-[2.2]' : 'text-gray-400 stroke-[1.8]'
                    }`}
                  />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      {/* Footer / Sign Out */}
      <div className="p-3 border-t border-gray-150 dark:border-gray-800 space-y-1">
        <Link
          href="/superadmin"
          className="flex items-center px-3 py-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-colors"
        >
          <Shield className="w-4 h-4 mr-2.5 text-indigo-500" />
          <span>Super Admin Panel</span>
        </Link>
        {userEmail && (
          <div className="px-3 py-1 text-[11px] text-gray-400 dark:text-gray-500 truncate font-mono">
            {userEmail}
          </div>
        )}
        <button
          type="button"
          onClick={async () => {
            try {
              const { createClient } = await import('@/utils/supabase/client')
              const supabase = createClient()
              await supabase.auth.signOut()
            } catch (err) {
              console.error('Client signOut error:', err)
            }
            window.location.href = '/auth/signout'
          }}
          className="flex w-full items-center px-3 py-2 text-xs font-medium text-red-600 rounded-lg hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4 mr-2.5" />
          Sign Out
        </button>
      </div>
    </aside>
  )
}
