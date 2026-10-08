'use client'

import React, { useState, useEffect, useCallback } from 'react'
import AdminHeader from '../../admin-header'
import { CalendarCheck, Check, X, Clock, AlertCircle, RefreshCw } from 'lucide-react'

type LeaveApplication = {
  id: string
  employee: string
  employeeEmail: string
  leaveType: string
  startDate: string
  endDate: string
  days: number
  reason: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  createdAt: string
}

export default function ManageLeavePage() {
  const [requests, setRequests] = useState<LeaveApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/leave/requests', { cache: 'no-store' })
      const data = await res.json()
      if (data.success && data.requests) {
        setRequests(data.requests)
      }
    } catch (err) {
      console.error('Failed to fetch leave requests:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRequests()
  }, [fetchRequests])

  const handleAction = async (id: string, newStatus: 'APPROVED' | 'REJECTED') => {
    try {
      setActionLoading(id)
      const res = await fetch('/api/admin/leave/requests', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      })
      const data = await res.json()
      if (data.success) {
        setRequests((prev) =>
          prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
        )
      } else {
        alert(data.error || 'Failed to update leave status')
      }
    } catch (err) {
      console.error('Error updating leave status:', err)
      alert('Error updating leave status')
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div className="min-h-full bg-[#f8f9fa] dark:bg-gray-950 pb-20 font-sans">
      <AdminHeader
        title="Manage Leaves"
        subtitle="Review, approve, or reject employee leave requests across your company"
        loading={loading}
        onRefresh={fetchRequests}
      />

      <div className="p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200/80 dark:border-gray-800 shadow-2xs overflow-hidden">
          <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-gray-900 dark:text-white">Pending &amp; Processed Requests</h3>
              <p className="text-xs text-gray-400 mt-0.5">Real employee leave applications submitted to organization</p>
            </div>
            <button
              onClick={fetchRequests}
              className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg transition-colors"
              title="Refresh requests"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800 text-gray-400 font-semibold uppercase tracking-wider text-[11px] bg-gray-50/50 dark:bg-gray-850/50">
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Leave Category</th>
                  <th className="py-3 px-4">Timeline</th>
                  <th className="py-3 px-4">Days</th>
                  <th className="py-3 px-4">Reason</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60">
                {requests.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-12 text-center text-xs text-gray-400">
                      {loading ? 'Loading real leave requests...' : 'No leave requests submitted yet.'}
                    </td>
                  </tr>
                ) : (
                  requests.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50/60 dark:hover:bg-gray-850/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-gray-900 dark:text-white">{item.employee}</div>
                        <div className="text-[11px] text-gray-400">{item.employeeEmail}</div>
                      </td>
                      <td className="py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                        {item.leaveType}
                      </td>
                      <td className="py-3 px-4 font-mono text-gray-500">
                        {item.startDate} &rarr; {item.endDate}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-gray-900 dark:text-white">
                        {item.days} {item.days === 1 ? 'Day' : 'Days'}
                      </td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-400 max-w-xs truncate">
                        {item.reason || 'None specified'}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            item.status === 'APPROVED'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : item.status === 'REJECTED'
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {item.status === 'PENDING' ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleAction(item.id, 'APPROVED')}
                              disabled={actionLoading === item.id}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-[11px] font-semibold transition-colors flex items-center gap-1"
                            >
                              <Check className="w-3 h-3" />
                              <span>Approve</span>
                            </button>
                            <button
                              onClick={() => handleAction(item.id, 'REJECTED')}
                              disabled={actionLoading === item.id}
                              className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-md text-[11px] font-semibold transition-colors flex items-center gap-1"
                            >
                              <X className="w-3 h-3" />
                              <span>Reject</span>
                            </button>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs italic">Processed</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
