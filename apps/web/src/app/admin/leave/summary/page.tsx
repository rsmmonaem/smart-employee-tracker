'use client'

import React, { useState } from 'react'
import AdminHeader from '../../admin-header'
import { CalendarDays, Filter, UserCheck, Clock, CheckCircle2 } from 'lucide-react'
import { useAdminFilter } from '../../admin-filter-context'

const MOCK_LEAVE_SUMMARY = [
  { employee: 'Admin User', role: 'Tenant Admin', clTaken: 2, clRemaining: 10, slTaken: 1, slRemaining: 9, elTaken: 0, elRemaining: 15 },
  { employee: 'Demo Employee', role: 'Employee', clTaken: 4, clRemaining: 8, slTaken: 2, slRemaining: 8, elTaken: 5, elRemaining: 10 },
  { employee: 'Masud', role: 'Employee', clTaken: 1, clRemaining: 11, slTaken: 0, slRemaining: 10, elTaken: 2, elRemaining: 13 },
  { employee: 'Foyz', role: 'Employee', clTaken: 3, clRemaining: 9, slTaken: 1, slRemaining: 9, elTaken: 1, elRemaining: 14 },
]

export default function LeaveSummaryPage() {
  const { searchQuery } = useAdminFilter()

  const filtered = MOCK_LEAVE_SUMMARY.filter((item) =>
    item.employee.toLowerCase().includes((searchQuery || '').toLowerCase())
  )

  return (
    <div className="min-h-full bg-[#f8f9fa] dark:bg-gray-950 pb-20 font-sans">
      <AdminHeader
        title="Leave Summary"
        subtitle="Annual leave balance, allocations, and utilized quotas per team member"
        searchPlaceholder="Filter employees in leave summary"
      />

      <div className="p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-gray-200/80 dark:border-gray-800 shadow-2xs">
            <span className="text-xs text-gray-400 font-semibold uppercase">Total Casual Leave Quota</span>
            <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1 font-mono">12 Days / Yr</div>
          </div>
          <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-gray-200/80 dark:border-gray-800 shadow-2xs">
            <span className="text-xs text-gray-400 font-semibold uppercase">Total Sick Leave Quota</span>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1 font-mono">10 Days / Yr</div>
          </div>
          <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-gray-200/80 dark:border-gray-800 shadow-2xs">
            <span className="text-xs text-gray-400 font-semibold uppercase">Earned / Annual Leave</span>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1 font-mono">15 Days / Yr</div>
          </div>
          <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-gray-200/80 dark:border-gray-800 shadow-2xs">
            <span className="text-xs text-gray-400 font-semibold uppercase">Active Employees Tracked</span>
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1 font-mono">{filtered.length}</div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200/80 dark:border-gray-800 shadow-2xs overflow-hidden">
          <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <h3 className="font-bold text-base text-gray-900 dark:text-white">Leave Quota Balances</h3>
            <span className="text-xs text-gray-400 font-mono">Cycle: 2026</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800 text-gray-400 font-semibold uppercase tracking-wider text-[11px] bg-gray-50/50 dark:bg-gray-850/50">
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Casual Leave (Used / Left)</th>
                  <th className="py-3 px-4">Sick Leave (Used / Left)</th>
                  <th className="py-3 px-4">Earned Leave (Used / Left)</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60">
                {filtered.map((item) => (
                  <tr key={item.employee} className="hover:bg-gray-50/60 dark:hover:bg-gray-850/40 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-gray-900 dark:text-white">{item.employee}</div>
                      <div className="text-[11px] text-gray-400">{item.role}</div>
                    </td>
                    <td className="py-3 px-4 font-mono">
                      <span className="text-gray-900 dark:text-white font-bold">{item.clTaken}</span>
                      <span className="text-gray-400"> / {item.clRemaining} left</span>
                    </td>
                    <td className="py-3 px-4 font-mono">
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">{item.slTaken}</span>
                      <span className="text-gray-400"> / {item.slRemaining} left</span>
                    </td>
                    <td className="py-3 px-4 font-mono">
                      <span className="text-blue-600 dark:text-blue-400 font-bold">{item.elTaken}</span>
                      <span className="text-gray-400"> / {item.elRemaining} left</span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                        Active
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
