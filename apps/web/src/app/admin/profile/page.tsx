'use client'

import React, { useState, useEffect } from 'react'
import {
  User,
  Mail,
  Lock,
  CheckCircle2,
  AlertCircle,
  Save,
  Shield,
  Clock,
  Camera,
} from 'lucide-react'
import AdminHeader from '../admin-header'
import { useAdminFilter } from '../admin-filter-context'
import Link from 'next/link'

export default function ProfilePage() {
  const { currentUser, triggerRefresh } = useAdminFilter()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (currentUser) {
      setFullName(currentUser.fullName || '')
      setEmail(currentUser.email || '')
      setRole(currentUser.role || 'EMPLOYEE')
    } else {
      fetch('/api/admin/me')
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.user) {
            setFullName(data.user.fullName || '')
            setEmail(data.user.email || '')
            setRole(data.user.role || 'EMPLOYEE')
          }
        })
        .catch(() => {})
    }
  }, [currentUser])

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    setSuccessMsg('')

    if (newPassword && newPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.')
      return
    }

    if (newPassword && newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match.')
      return
    }

    try {
      setSaving(true)
      const payload: Record<string, string> = {
        fullName: fullName.trim(),
      }
      if (newPassword) {
        payload.password = newPassword.trim()
      }

      const res = await fetch('/api/admin/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()

      if (json.success) {
        setSuccessMsg('Your profile has been updated successfully!')
        setNewPassword('')
        setConfirmPassword('')
        triggerRefresh()
      } else {
        setErrorMsg(json.error || 'Failed to update profile.')
      }
    } catch {
      setErrorMsg('Network error. Failed to update profile.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-full bg-white dark:bg-gray-900 pb-16">
      <AdminHeader
        title="My Profile"
        subtitle="Manage your personal details, name, and account password"
        showSearch={false}
        showDatePicker={false}
        showTeamFilter={false}
        showAddUser={false}
      />

      <div className="p-6 lg:p-8 max-w-3xl">
        <div className="bg-white dark:bg-gray-850 rounded-2xl border border-gray-200/80 dark:border-gray-800 p-6 sm:p-8 shadow-xs">
          {/* Header Card */}
          <div className="flex items-center gap-4 pb-6 border-b border-gray-150 dark:border-gray-800">
            <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black text-2xl shadow-sm ring-4 ring-blue-500/20">
              {(fullName || email || 'U').charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                {fullName || 'Employee Account'}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                  {email}
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  {role}
                </span>
              </div>
            </div>
          </div>

          {/* Alert notifications */}
          {successMsg && (
            <div className="mt-6 p-4 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 flex items-center gap-3 text-xs font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="mt-6 p-4 rounded-xl bg-red-50 text-red-800 border border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800 flex items-center gap-3 text-xs font-medium">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSaveProfile} className="mt-6 space-y-6">
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                Personal Information
              </h3>

              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-gray-400 absolute left-3 top-3 pointer-events-none" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    placeholder="Enter your full name"
                    className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl pl-9 pr-4 py-2.5 text-xs text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-blue-500 transition-colors shadow-2xs"
                  />
                </div>
              </div>

              {/* Email (Read-only for security) */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3 pointer-events-none" />
                  <input
                    type="email"
                    value={email}
                    disabled
                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-gray-500 dark:text-gray-400 cursor-not-allowed shadow-2xs"
                  />
                </div>
                <p className="text-[11px] text-gray-400 mt-1">
                  Email address is managed by your organization administrator.
                </p>
              </div>
            </div>

            {/* Password Section */}
            <div className="pt-4 border-t border-gray-150 dark:border-gray-800 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                Change Password
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    New Password (optional)
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3 pointer-events-none" />
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Leave blank to keep current"
                      className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl pl-9 pr-4 py-2.5 text-xs text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-blue-500 transition-colors shadow-2xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3 pointer-events-none" />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl pl-9 pr-4 py-2.5 text-xs text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-blue-500 transition-colors shadow-2xs"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Link
                  href="/admin/timeline"
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Go to My Timeline</span>
                </Link>
                <Link
                  href="/admin/screenshots"
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Go to My Screenshots</span>
                </Link>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs disabled:opacity-50 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{saving ? 'Saving...' : 'Save Profile'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
