'use client'

import React, { useState } from 'react'
import { X, RefreshCw } from 'lucide-react'

interface AddUserModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export default function AddUserModal({ isOpen, onClose, onSuccess }: AddUserModalProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('EMPLOYEE')
  const [team, setTeam] = useState('Engineering')
  const [availableTeams, setAvailableTeams] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  React.useEffect(() => {
    if (isOpen) {
      fetch('/api/admin/teams')
        .then((res) => res.json())
        .then((data) => {
          if (data.success && Array.isArray(data.teams) && data.teams.length > 0) {
            const names = data.teams.map((t: any) => t.name)
            setAvailableTeams(names)
            if (!names.includes(team)) {
              setTeam(names[0])
            }
          }
        })
        .catch(() => {})
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: name,
          email,
          role,
          team,
        }),
      })
      const json = await res.json()
      if (json.success) {
        setName('')
        setEmail('')
        setRole('EMPLOYEE')
        setTeam('Engineering')
        onClose()
        if (onSuccess) onSuccess()
      } else {
        setError(json.error || 'Failed to add user')
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error adding user')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-gray-200 dark:border-gray-700 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-4 border-b border-gray-150 dark:border-gray-700">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">
            Add Team Member
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg p-1 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mt-3 p-2.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Full Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. John Doe"
              className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. john@smartemployeetracker.com"
              className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
            >
              <option value="EMPLOYEE">Employee</option>
              <option value="TENANT_ADMIN">Tenant Admin</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Team
            </label>
            <select
              value={team}
              onChange={(e) => setTeam(e.target.value)}
              className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
            >
              {(availableTeams.length > 0 ? availableTeams : ['Engineering', 'Design', 'Marketing', 'Management']).map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-150 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-semibold text-white bg-[#1677ff] hover:bg-blue-600 rounded-lg shadow-xs flex items-center gap-1.5 disabled:opacity-50 transition-colors"
            >
              {isSubmitting && <RefreshCw className="w-3 h-3 animate-spin" />}
              <span>Add User</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
