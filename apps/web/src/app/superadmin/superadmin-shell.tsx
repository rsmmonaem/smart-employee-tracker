'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Building2,
  Package,
  CreditCard,
  Settings,
  Shield,
  ExternalLink,
  LogOut,
  Sparkles,
} from 'lucide-react'

export default function SuperAdminShell({
  children,
  userEmail,
}: {
  children: React.ReactNode
  userEmail?: string
}) {
  const pathname = usePathname()

  const navItems = [
    {
      name: 'Overview',
      href: '/superadmin',
      icon: LayoutDashboard,
      exact: true,
    },
    {
      name: 'All Tenants',
      href: '/superadmin/tenants',
      icon: Building2,
    },
    {
      name: 'Packages & Pricing',
      href: '/superadmin/packages',
      icon: Package,
    },
    {
      name: 'Billing & Revenue',
      href: '/superadmin/billing',
      icon: CreditCard,
    },
    {
      name: 'Platform Settings',
      href: '/superadmin/settings',
      icon: Settings,
    },
  ]

  const isActive = (item: (typeof navItems)[0]) => {
    if (item.exact) {
      return pathname === item.href
    }
    return pathname.startsWith(item.href)
  }

  return (
    <div className="flex h-screen bg-gray-950 text-gray-100 font-sans antialiased overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col shrink-0">
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-gray-800 bg-gray-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-md shadow-blue-500/20">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="font-bold text-xs tracking-tight text-white block leading-tight">
                Smart Tracker
              </span>
              <span className="text-[10px] font-semibold tracking-wider uppercase text-blue-400 block leading-tight">
                Super Admin
              </span>
            </div>
          </div>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-950 text-blue-300 border border-blue-800/60">
            SaaS
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3.5 space-y-1 overflow-y-auto">
          <div className="px-3 py-1.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
            Management
          </div>

          {navItems.map((item) => {
            const active = isActive(item)
            const Icon = item.icon

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center px-3.5 py-2.5 text-xs font-semibold rounded-xl transition-all duration-150 ${
                  active
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20 font-bold'
                    : 'text-gray-400 hover:text-gray-100 hover:bg-gray-800/70'
                }`}
              >
                <Icon className={`w-4 h-4 mr-3 shrink-0 ${active ? 'text-white' : 'text-gray-400'}`} />
                <span>{item.name}</span>
              </Link>
            )
          })}

          <div className="pt-4 px-3 py-1.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
            Shortcuts
          </div>

          <Link
            href="/admin/dashboard"
            className="flex items-center px-3.5 py-2.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/20 rounded-xl transition-all border border-emerald-900/30"
          >
            <ExternalLink className="w-4 h-4 mr-3 shrink-0 text-emerald-400" />
            <span>Client Admin View</span>
          </Link>

          <Link
            href="/admin/screenshots"
            className="flex items-center px-3.5 py-2 text-xs font-medium text-gray-400 hover:text-gray-200 hover:bg-gray-800/40 rounded-xl transition-all"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-3.5" />
            <span>Screenshot Audit</span>
          </Link>
        </nav>

        {/* System Health / Footer */}
        <div className="p-3.5 border-t border-gray-800 bg-gray-950/40 space-y-3">
          <div className="p-2.5 rounded-xl bg-gray-800/60 border border-gray-750 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-medium text-gray-300">Cluster Live</span>
            </div>
            <span className="text-[10px] font-mono text-gray-400">99.98%</span>
          </div>

          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="flex w-full items-center justify-center px-3 py-2 text-xs font-semibold text-red-400 hover:text-red-300 rounded-lg hover:bg-red-950/30 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5 mr-2" />
              <span>Sign Out</span>
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 flex items-center justify-between px-8 bg-gray-900/80 backdrop-blur-md border-b border-gray-800 shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800/40 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-indigo-400" />
              Platform Command Center
            </span>
          </div>

          <div className="flex items-center space-x-4 text-xs">
            <div className="flex items-center gap-2 text-gray-300 bg-gray-800/80 px-3 py-1.5 rounded-lg border border-gray-700/60">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <span>{userEmail || 'superadmin@smartemployeetracker.com'}</span>
            </div>
          </div>
        </header>

        {/* Content Container */}
        <div className="flex-1 overflow-y-auto bg-gray-950 p-8">
          <div className="max-w-7xl mx-auto space-y-8">
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}
