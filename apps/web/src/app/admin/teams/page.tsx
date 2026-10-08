'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Users,
  Plus,
  Search,
  Edit2,
  Trash2,
  RefreshCw,
  FolderKanban,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  UserCheck,
  Shield,
  Layers,
  Calendar,
  X,
  Check,
} from 'lucide-react'
import AdminHeader from '../admin-header'

interface TeamMember {
  id: string
  name: string
  email: string
  role?: string
}

interface TeamItem {
  id: string
  name: string
  description?: string
  lead?: string
  membersCount: number
  members?: TeamMember[]
  createdAt?: string
}

export default function TeamsManagementPage() {
  const [teams, setTeams] = useState<TeamItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')

  // Create Modal state
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createName, setCreateName] = useState('')
  const [createDesc, setCreateDesc] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [createError, setCreateError] = useState('')

  // Edit Modal state
  const [editTeam, setEditTeam] = useState<TeamItem | null>(null)
  const [editName, setEditName] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [editError, setEditError] = useState('')

  // Delete State
  const [deleteConfirmTeam, setDeleteConfirmTeam] = useState<TeamItem | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // View Members Modal State
  const [viewMembersTeam, setViewMembersTeam] = useState<TeamItem | null>(null)

  // Fetch teams from multi-tenant API
  const fetchTeams = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const res = await fetch('/api/admin/teams')
      const data = await res.json()
      if (data.success) {
        setTeams(data.teams || [])
      } else {
        setError(data.error || 'Failed to load teams')
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error fetching teams')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTeams()
  }, [fetchTeams])

  // Filtered teams
  const filteredTeams = useMemo(() => {
    if (!search.trim()) return teams
    const q = search.toLowerCase()
    return teams.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        (t.description && t.description.toLowerCase().includes(q)) ||
        (t.lead && t.lead.toLowerCase().includes(q))
    )
  }, [teams, search])

  // Handle Create Team
  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!createName.trim()) {
      setCreateError('Team name is required')
      return
    }

    setIsCreating(true)
    setCreateError('')

    try {
      const res = await fetch('/api/admin/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: createName.trim(),
          description: createDesc.trim() || undefined,
        }),
      })

      const json = await res.json()
      if (json.success) {
        setCreateName('')
        setCreateDesc('')
        setShowCreateModal(false)
        await fetchTeams()
      } else {
        setCreateError(json.error || 'Failed to create team')
      }
    } catch (err: unknown) {
      setCreateError(err instanceof Error ? err.message : 'Failed to create team')
    } finally {
      setIsCreating(false)
    }
  }

  // Handle Edit Team
  const handleEditTeam = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editTeam) return
    if (!editName.trim()) {
      setEditError('Team name is required')
      return
    }

    setIsEditing(true)
    setEditError('')

    try {
      const res = await fetch('/api/admin/teams', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editTeam.id,
          name: editName.trim(),
          description: editDesc.trim() || null,
        }),
      })

      const json = await res.json()
      if (json.success) {
        setEditTeam(null)
        await fetchTeams()
      } else {
        setEditError(json.error || 'Failed to update team')
      }
    } catch (err: unknown) {
      setEditError(err instanceof Error ? err.message : 'Failed to update team')
    } finally {
      setIsEditing(false)
    }
  }

  // Handle Delete Team
  const handleDeleteTeam = async () => {
    if (!deleteConfirmTeam) return

    setIsDeleting(true)
    try {
      const res = await fetch(`/api/admin/teams?id=${deleteConfirmTeam.id}`, {
        method: 'DELETE',
      })

      const json = await res.json()
      if (json.success) {
        setDeleteConfirmTeam(null)
        await fetchTeams()
      } else {
        alert(json.error || 'Failed to delete team')
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to delete team')
    } finally {
      setIsDeleting(false)
    }
  }

  const openEditModal = (team: TeamItem) => {
    setEditTeam(team)
    setEditName(team.name)
    setEditDesc(team.description || '')
    setEditError('')
  }

  return (
    <div className="min-h-full bg-gray-50 dark:bg-gray-950 font-sans text-gray-800 dark:text-gray-100 pb-20">
      <AdminHeader
        title="Teams Management"
        subtitle="Create, configure, edit and manage company teams and department structures"
        searchPlaceholder="Search teams..."
        loading={loading}
        onRefresh={fetchTeams}
        extraActions={
          <button
            onClick={() => {
              setCreateName('')
              setCreateDesc('')
              setCreateError('')
              setShowCreateModal(true)
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create Team</span>
          </button>
        }
      />

      <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
        {/* Metric Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 flex items-center justify-between shadow-2xs">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Total Teams</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{teams.length}</h3>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
              <FolderKanban className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 flex items-center justify-between shadow-2xs">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Total Assigned Members</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {teams.reduce((acc, t) => acc + (t.membersCount || 0), 0)}
              </h3>
            </div>
            <div className="p-3 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-xl">
              <Users className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 flex items-center justify-between shadow-2xs">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Average Team Size</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {teams.length > 0 ? (teams.reduce((acc, t) => acc + (t.membersCount || 0), 0) / teams.length).toFixed(1) : 0}
              </h3>
            </div>
            <div className="p-3 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-xl">
              <Layers className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Search bar inside container */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-2xs">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search teams by name, description or lead..."
              className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg pl-9 pr-8 py-2 text-xs text-gray-800 dark:text-gray-200 focus:outline-none focus:border-blue-500"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="text-xs text-gray-500 dark:text-gray-400">
            Showing <span className="font-semibold text-gray-800 dark:text-gray-200">{filteredTeams.length}</span> of {teams.length} teams
          </div>
        </div>

        {/* Error notice */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Teams Table / Grid */}
        {loading && teams.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-gray-400">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
            <p className="text-xs">Loading teams...</p>
          </div>
        ) : filteredTeams.length === 0 ? (
          <div className="py-16 text-center bg-white dark:bg-gray-900 rounded-xl border border-dashed border-gray-300 dark:border-gray-800 p-8">
            <FolderKanban className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200">No teams found</h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-sm mx-auto">
              {search ? 'No teams matched your search criteria.' : 'No teams exist yet. Click the Create Team button above to add your first department.'}
            </p>
            {!search && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs"
              >
                Create First Team
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredTeams.map((team) => (
              <div
                key={team.id}
                className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm">
                        {team.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors">
                          {team.name}
                        </h3>
                        <p className="text-[11px] text-gray-400">
                          Created {team.createdAt ? new Date(team.createdAt).toLocaleDateString() : 'Active'}
                        </p>
                      </div>
                    </div>

                    {/* Actions menu */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(team)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                        title="Edit Team"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirmTeam(team)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                        title="Delete Team"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="mt-3 text-xs text-gray-600 dark:text-gray-300 line-clamp-2 min-h-[32px]">
                    {team.description || 'No description provided for this team.'}
                  </p>

                  <div 
                    onClick={() => setViewMembersTeam(team)}
                    className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs cursor-pointer hover:bg-gray-50/60 dark:hover:bg-gray-800/40 p-1.5 -mx-1.5 rounded-lg transition-colors"
                    title="Click to view all team members"
                  >
                    <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                      <Users className="w-3.5 h-3.5 text-blue-500" />
                      <span className="font-medium text-gray-700 dark:text-gray-300">{team.membersCount} {team.membersCount === 1 ? 'Member' : 'Members'}</span>
                    </div>

                    {team.members && team.members.length > 0 ? (
                      <div className="flex -space-x-1.5 overflow-hidden">
                        {team.members.slice(0, 4).map((m) => (
                          <div
                            key={m.id}
                            title={`${m.name} (${m.email})`}
                            className="inline-block h-6 w-6 rounded-full ring-2 ring-white dark:ring-gray-900 bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-[10px] font-bold flex items-center justify-center shadow-2xs"
                          >
                            {m.name.charAt(0).toUpperCase()}
                          </div>
                        ))}
                        {team.members.length > 4 && (
                          <div className="inline-block h-6 w-6 rounded-full ring-2 ring-white dark:ring-gray-900 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-[9px] font-semibold flex items-center justify-center shadow-2xs">
                            +{team.members.length - 4}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-[11px] text-gray-400 italic">No members yet</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CREATE TEAM MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200 dark:border-gray-800 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-lg">
                  <FolderKanban className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">Create New Team</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {createError && (
              <div className="mt-3 p-3 bg-red-50 text-red-700 rounded-lg text-xs flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>{createError}</span>
              </div>
            )}

            <form onSubmit={handleCreateTeam} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Team Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  placeholder="e.g. Mobile Engineering, Sales & BD"
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={createDesc}
                  onChange={(e) => setCreateDesc(e.target.value)}
                  placeholder="What is this team responsible for?"
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-gray-100 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3.5 py-2 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg shadow-xs flex items-center gap-1.5"
                >
                  {isCreating && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isCreating ? 'Creating...' : 'Create Team'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT TEAM MODAL */}
      {editTeam && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200 dark:border-gray-800 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-lg">
                  <Edit2 className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">Edit Team</h3>
              </div>
              <button
                onClick={() => setEditTeam(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {editError && (
              <div className="mt-3 p-3 bg-red-50 text-red-700 rounded-lg text-xs flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleEditTeam} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Team Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-gray-100 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setEditTeam(null)}
                  className="px-3.5 py-2 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isEditing}
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg shadow-xs flex items-center gap-1.5"
                >
                  {isEditing && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isEditing ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirmTeam && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-gray-200 dark:border-gray-800 animate-in fade-in zoom-in-95 duration-150">
            <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-600 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6" />
            </div>

            <h3 className="text-center text-sm font-bold text-gray-900 dark:text-white">
              Delete Team &quot;{deleteConfirmTeam.name}&quot;?
            </h3>
            <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-2">
              Are you sure you want to delete this team? Employees assigned to this team will remain in your company.
            </p>

            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirmTeam(null)}
                className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg flex-1"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteTeam}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-lg flex-1 shadow-xs flex items-center justify-center gap-1.5"
              >
                {isDeleting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>{isDeleting ? 'Deleting...' : 'Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW MEMBERS MODAL */}
      {viewMembersTeam && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200 dark:border-gray-800 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs">
                  {viewMembersTeam.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                    {viewMembersTeam.name} Members
                  </h3>
                  <p className="text-[11px] text-gray-400">
                    {viewMembersTeam.membersCount} {viewMembersTeam.membersCount === 1 ? 'employee assigned' : 'employees assigned'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViewMembersTeam(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 max-h-[360px] overflow-y-auto space-y-2 divide-y divide-gray-50 dark:divide-gray-800/60">
              {(!viewMembersTeam.members || viewMembersTeam.members.length === 0) ? (
                <div className="py-8 text-center text-gray-400 text-xs">
                  No members are currently assigned to this team.
                </div>
              ) : (
                viewMembersTeam.members.map((member) => (
                  <div key={member.id} className="pt-2 first:pt-0 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold text-xs flex items-center justify-center shrink-0">
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-gray-900 dark:text-gray-100 truncate">
                          {member.name}
                        </p>
                        <p className="text-[11px] text-gray-400 truncate">
                          {member.email}
                        </p>
                      </div>
                    </div>

                    <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                      {member.role || 'Member'}
                    </span>
                  </div>
                ))
              )}
            </div>

            <div className="mt-5 pt-3 border-t border-gray-100 dark:border-gray-800 flex justify-end">
              <button
                type="button"
                onClick={() => setViewMembersTeam(null)}
                className="px-4 py-1.5 text-xs font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
