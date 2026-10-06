'use client'

import React, { useState } from 'react'
import AdminHeader from '../../admin-header'
import { CalendarCheck, Check, X, Clock, AlertCircle } from 'lucide-react'

type LeaveApplication = {
  id: string
  employee: string
  leaveType: string
  startDate: string
  endDate: string
  days: number
  reason: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
}

const INITIAL_REQUESTS: LeaveApplication[] = [
  {
    id: 'req-1',
    employee: 'Demo Employee',
    leaveType: 'Medical / Sick Leave',
    startDate: '2026-10-12',
    endDate: '2026-10-14',
    days: 3,
    reason: 'Medical checkup and recovery',
    status: 'PENDING',
  },
  {
    id: 'req-2',
    employee: 'Masud',
    leaveType: 'Casual Leave',
    startDate: '2026-10-20',
    endDate: '2026-10-21',
    days: 2,
    reason: 'Personal family event',
    status: 'APPROVED',
  },
]

export default function ManageLeavePage() {
  const [requests, setRequests] = useState<LeaveApplication[]>(INITIAL_REQUESTS)

  const handleAction = (id: string, newStatus: 'APPROVED' | 'REJECTED') => {
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
    )
  }

  return (
    <div className="min-h-full bg-[#f8f9fa] dark:bg-gray-950 pb-20 font-sans">
      <AdminHeader
        title="Manage Leaves"
        subtitle="Review, approve, or reject employee leave requests across your company"
      />

      <div className="p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200/80 dark:border-gray-800 shadow-2xs overflow-hidden">
          <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <h3 className="font-bold text-base text-gray-900 dark:text-white">Pending & Processed Requests</h3>
            <span className="text-xs text-gray-400 font-mono">Total: {requests.length}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800 text-gray-400 font-semibold uppercase tracking-wider text-[11px] bg-gray-50/50 dark:bg-gray-850/50">
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4">Reason</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60">
                {requests.map((req) => (
                  <tr key={req.id} className="hover:bg-gray-50/60 dark:hover:bg-gray-850/40 transition-colors">
                    <td className="py-3 px-4 font-bold text-gray-900 dark:text-white">{req.employee}</td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-300">{req.leaveType}</td>
                    <td className="py-3 px-4 font-mono">
                      <div>{req.startDate} to {req.endDate}</div>
                      <div className="text-[10px] text-gray-400">{req.days} days</div>
                    </td>
                    <td className="py-3 px-4 text-gray-500 dark:text-gray-400 max-w-xs truncate">{req.reason}</td>
                    <td className="py-3 px-4">
                      {req.status === 'PENDING' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                          Pending
                        </span>
                      )}
                      {req.status === 'APPROVED' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                          Approved
                        </span>
                      )}
                      {req.status === 'REJECTED' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300">
                          Rejected
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {req.status === 'PENDING' ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleAction(req.id, 'APPROVED')}
                            className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 transition-colors"
                            title="Approve"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleAction(req.id, 'REJECTED')}
                            className="p-1.5 rounded-lg bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 hover:bg-red-100 transition-colors"
                            title="Reject"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-gray-400">Processed</span>
                      )}
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
