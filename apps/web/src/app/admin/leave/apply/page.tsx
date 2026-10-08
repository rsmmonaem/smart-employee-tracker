'use client'

import React, { useState, useEffect } from 'react'
import AdminHeader from '../../admin-header'
import { CalendarPlus, Send, CheckCircle2, AlertCircle } from 'lucide-react'

export default function ApplyLeavePage() {
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [leaveType, setLeaveType] = useState('Casual Leave')
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0])
  const [days, setDays] = useState(1)
  const [reason, setReason] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  // Calculate day difference
  useEffect(() => {
    if (startDate && endDate) {
      const s = new Date(startDate).getTime()
      const e = new Date(endDate).getTime()
      if (e >= s) {
        const diff = Math.round((e - s) / (1000 * 3600 * 24)) + 1
        setDays(diff)
      } else {
        setDays(1)
      }
    }
  }, [startDate, endDate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    try {
      setLoading(true)
      const res = await fetch('/api/admin/leave/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leaveType,
          startDate,
          endDate,
          days,
          reason,
        }),
      })

      const data = await res.json()
      if (data.success) {
        setSubmitted(true)
      } else {
        setErrorMsg(data.error || 'Failed to submit leave request')
      }
    } catch (err) {
      console.error(err)
      setErrorMsg('Error submitting leave request')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-full bg-[#f8f9fa] dark:bg-gray-950 pb-20 font-sans">
      <AdminHeader
        title="Apply Leave"
        subtitle="Submit a leave request for administrative review or company approval"
      />

      <div className="max-w-2xl mx-auto p-6 mt-6">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200/80 dark:border-gray-800 p-8 shadow-xs">
          {submitted ? (
            <div className="text-center py-8 space-y-4">
              <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Leave Application Submitted</h3>
              <p className="text-sm text-gray-500 max-w-md mx-auto">
                Your request has been logged in the database and sent to your organization administrator for review.
              </p>
              <button
                onClick={() => {
                  setSubmitted(false)
                  setReason('')
                }}
                className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors"
              >
                Submit Another Request
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-gray-100 dark:border-gray-800">
                <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <CalendarPlus className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900 dark:text-white">New Leave Request</h2>
                  <p className="text-xs text-gray-400">Specify dates and leave classification</p>
                </div>
              </div>

              {errorMsg && (
                <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Leave Type
                  </label>
                  <select
                    value={leaveType}
                    onChange={(e) => setLeaveType(e.target.value)}
                    className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-xs font-medium text-gray-800 dark:text-gray-200 focus:outline-none focus:border-blue-500 shadow-2xs"
                  >
                    <option value="Casual Leave">Casual Leave (CL)</option>
                    <option value="Medical / Sick Leave">Medical / Sick Leave (SL)</option>
                    <option value="Earned / Annual Leave">Earned / Annual Leave (EL)</option>
                    <option value="Unpaid Leave">Unpaid Leave</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-xs font-medium text-gray-800 dark:text-gray-200 focus:outline-none focus:border-blue-500 shadow-2xs"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-xs font-medium text-gray-800 dark:text-gray-200 focus:outline-none focus:border-blue-500 shadow-2xs"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Total Duration
                  </label>
                  <div className="px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 text-xs font-mono font-bold text-blue-600 dark:text-blue-400">
                    {days} {days === 1 ? 'Day' : 'Days'}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Reason / Explanation
                  </label>
                  <textarea
                    rows={3}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Provide details regarding this leave request..."
                    className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 text-xs font-medium text-gray-800 dark:text-gray-200 focus:outline-none focus:border-blue-500 shadow-2xs"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1677ff] hover:bg-blue-600 disabled:opacity-50 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{loading ? 'Submitting...' : 'Submit Leave Request'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
