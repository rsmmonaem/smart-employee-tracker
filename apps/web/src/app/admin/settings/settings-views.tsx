import React, { useState, useEffect, useCallback } from 'react'
import {
  Users,
  UserPlus,
  Plus,
  CheckCircle2,
  Upload,
  Check,
  Edit2,
  Trash2,
  X,
  RefreshCw
} from 'lucide-react'

// Minimalist Toggle Switch
function Toggle({
  checked,
  onChange,
}: {
  checked: boolean
  onChange: () => void
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-600/20 ${
        checked ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
      }`}
    >
      <span
        aria-hidden="true"
        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
          checked ? 'translate-x-4' : 'translate-x-0'
        }`}
      />
    </button>
  )
}

interface Team {
  id: string
  name: string
  description: string | null
  lead: string
  membersCount: number
}

export function ManageTeamsView() {
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)

  // Create Modal
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [newTeamName, setNewTeamName] = useState('')
  const [newTeamDesc, setNewTeamDesc] = useState('')
  const [isSubmittingAdd, setIsSubmittingAdd] = useState(false)

  // Edit Modal
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingTeam, setEditingTeam] = useState<Team | null>(null)
  const [editTeamName, setEditTeamName] = useState('')
  const [editTeamDesc, setEditTeamDesc] = useState('')
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false)

  // Delete Modal
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [teamToDelete, setTeamToDelete] = useState<Team | null>(null)
  const [isSubmittingDelete, setIsSubmittingDelete] = useState(false)

  const fetchTeams = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/teams', { cache: 'no-store' })
      const json = await res.json()
      if (json.success && json.teams) {
        setTeams(json.teams)
      }
    } catch (err) {
      console.error('Failed to fetch teams:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTeams()
  }, [fetchTeams])

  // Add team
  const handleAddTeam = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTeamName.trim()) return

    try {
      setIsSubmittingAdd(true)
      const res = await fetch('/api/admin/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newTeamName.trim(),
          description: newTeamDesc.trim(),
        }),
      })
      const json = await res.json()
      if (json.success) {
        setNewTeamName('')
        setNewTeamDesc('')
        setIsAddOpen(false)
        await fetchTeams()
      } else {
        alert(json.error || 'Failed to create team')
      }
    } catch (err) {
      console.error('Error creating team:', err)
      alert('Error creating team')
    } finally {
      setIsSubmittingAdd(false)
    }
  }

  // Edit team
  const openEditTeam = (team: Team) => {
    setEditingTeam(team)
    setEditTeamName(team.name)
    setEditTeamDesc(team.description || '')
    setIsEditOpen(true)
  }

  const handleEditTeam = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingTeam || !editTeamName.trim()) return

    try {
      setIsSubmittingEdit(true)
      const res = await fetch('/api/admin/teams', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingTeam.id,
          name: editTeamName.trim(),
          description: editTeamDesc.trim(),
        }),
      })
      const json = await res.json()
      if (json.success) {
        setIsEditOpen(false)
        setEditingTeam(null)
        await fetchTeams()
      } else {
        alert(json.error || 'Failed to update team')
      }
    } catch (err) {
      console.error('Error updating team:', err)
      alert('Error updating team')
    } finally {
      setIsSubmittingEdit(false)
    }
  }

  // Delete team
  const openDeleteTeam = (team: Team) => {
    setTeamToDelete(team)
    setIsDeleteOpen(true)
  }

  const handleDeleteTeam = async () => {
    if (!teamToDelete) return

    try {
      setIsSubmittingDelete(true)
      const res = await fetch(`/api/admin/teams?id=${teamToDelete.id}`, {
        method: 'DELETE',
      })
      const json = await res.json()
      if (json.success) {
        setIsDeleteOpen(false)
        setTeamToDelete(null)
        await fetchTeams()
      } else {
        alert(json.error || 'Failed to delete team')
      }
    } catch (err) {
      console.error('Error deleting team:', err)
      alert('Error deleting team')
    } finally {
      setIsSubmittingDelete(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-gray-200/80 pb-4 dark:border-gray-800">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Manage Teams</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Organize employees into teams to apply specialized policies and assign department leads.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchTeams()}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            title="Refresh Teams"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setIsAddOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition-all"
          >
            <Plus className="h-3.5 w-3.5" />
            Create Team
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {teams.map((t) => (
          <div
            key={t.id}
            className="rounded-xl border border-gray-200/80 bg-white p-4 shadow-xs hover:border-gray-300 dark:border-gray-800 dark:bg-gray-900 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300">
                  <Users className="h-4.5 w-4.5" />
                </div>
                <div className="flex items-center gap-1">
                  <span className="rounded bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                    {t.membersCount} members
                  </span>
                  <button
                    onClick={() => openEditTeam(t)}
                    title="Edit Team"
                    className="p-1 text-gray-400 hover:text-blue-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => openDeleteTeam(t)}
                    title="Delete Team"
                    className="p-1 text-gray-400 hover:text-red-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <h3 className="mt-3 text-sm font-semibold text-gray-900 dark:text-white">{t.name}</h3>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                {t.description || 'No description provided'}
              </p>
            </div>
            <div className="mt-4 border-t border-gray-100 pt-2.5 text-xs text-gray-500 dark:border-gray-800 dark:text-gray-400 flex items-center justify-between">
              <span>Lead: <strong className="text-gray-800 dark:text-gray-200 font-medium">{t.lead}</strong></span>
              <button
                onClick={() => openEditTeam(t)}
                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 font-medium text-xs"
              >
                Manage
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Create Team Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <form
            onSubmit={handleAddTeam}
            className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl dark:bg-gray-900 dark:border dark:border-gray-800"
          >
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">Create New Team</h3>
              <button
                type="button"
                onClick={() => setIsAddOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1">
                  Team Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mobile Engineering"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="What is this team responsible for?"
                  value={newTeamDesc}
                  onChange={(e) => setNewTeamDesc(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAddOpen(false)}
                className="rounded-lg px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmittingAdd}
                className="rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1.5"
              >
                {isSubmittingAdd && <RefreshCw className="w-3 h-3 animate-spin" />}
                <span>Create Team</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Team Modal */}
      {isEditOpen && editingTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <form
            onSubmit={handleEditTeam}
            className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl dark:bg-gray-900 dark:border dark:border-gray-800"
          >
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">Edit Team</h3>
              <button
                type="button"
                onClick={() => setIsEditOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1">
                  Team Name
                </label>
                <input
                  type="text"
                  required
                  value={editTeamName}
                  onChange={(e) => setEditTeamName(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={editTeamDesc}
                  onChange={(e) => setEditTeamDesc(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsEditOpen(false)}
                className="rounded-lg px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmittingEdit}
                className="rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1.5"
              >
                {isSubmittingEdit && <RefreshCw className="w-3 h-3 animate-spin" />}
                <span>Save Changes</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Team Modal */}
      {isDeleteOpen && teamToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl dark:bg-gray-900 dark:border dark:border-gray-800">
            <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center mb-3">
              <Trash2 className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">Delete Team</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Are you sure you want to delete <strong className="text-gray-900 dark:text-white">{teamToDelete.name}</strong>?
            </p>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsDeleteOpen(false)}
                className="rounded-lg px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteTeam}
                disabled={isSubmittingDelete}
                className="rounded-lg bg-red-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50 flex items-center gap-1.5"
              >
                {isSubmittingDelete && <RefreshCw className="w-3 h-3 animate-spin" />}
                <span>Delete Team</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

interface EmployeeItem {
  id: string
  full_name?: string | null
  email: string
  role: string
  is_active?: boolean
  team?: string
}

export function ManageEmployeesView({ members: initialMembers }: { members: EmployeeItem[] }) {
  const [members, setMembers] = useState<EmployeeItem[]>(initialMembers || [])
  const [loading, setLoading] = useState(false)

  // Invite modal
  const [isInviteOpen, setIsInviteOpen] = useState(false)
  const [inviteName, setInviteName] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('EMPLOYEE')
  const [inviteTeam, setInviteTeam] = useState('Engineering')
  const [isSubmittingInvite, setIsSubmittingInvite] = useState(false)

  // Edit Access Modal
  const [isAccessOpen, setIsAccessOpen] = useState(false)
  const [editingMember, setEditingMember] = useState<EmployeeItem | null>(null)
  const [editRole, setEditRole] = useState('EMPLOYEE')
  const [editActive, setEditActive] = useState(true)
  const [isSubmittingAccess, setIsSubmittingAccess] = useState(false)

  // Delete Modal
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [memberToDelete, setMemberToDelete] = useState<EmployeeItem | null>(null)
  const [isSubmittingDelete, setIsSubmittingDelete] = useState(false)

  const reloadMembers = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/users', { cache: 'no-store' })
      const json = await res.json()
      if (json.success && json.employees) {
        setMembers(json.employees)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!initialMembers || initialMembers.length === 0) {
      reloadMembers()
    } else {
      setMembers(initialMembers)
    }
  }, [initialMembers])

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteName.trim() || !inviteEmail.trim()) return

    try {
      setIsSubmittingInvite(true)
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: inviteName.trim(),
          email: inviteEmail.trim(),
          role: inviteRole,
          team: inviteTeam,
        }),
      })
      const json = await res.json()
      if (json.success) {
        setInviteName('')
        setInviteEmail('')
        setIsInviteOpen(false)
        await reloadMembers()
      } else {
        alert(json.error || 'Failed to invite employee')
      }
    } catch (e) {
      console.error(e)
      alert('Error inviting employee')
    } finally {
      setIsSubmittingInvite(false)
    }
  }

  const openAccess = (m: EmployeeItem) => {
    setEditingMember(m)
    setEditRole(m.role)
    setEditActive(m.is_active ?? true)
    setIsAccessOpen(true)
  }

  const handleSaveAccess = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingMember) return

    try {
      setIsSubmittingAccess(true)
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingMember.id,
          role: editRole,
          isActive: editActive,
        }),
      })
      const json = await res.json()
      if (json.success) {
        setIsAccessOpen(false)
        setEditingMember(null)
        await reloadMembers()
      } else {
        alert(json.error || 'Failed to update access')
      }
    } catch (e) {
      console.error(e)
      alert('Error updating access')
    } finally {
      setIsSubmittingAccess(false)
    }
  }

  const handleDeleteMember = async () => {
    if (!memberToDelete) return

    try {
      setIsSubmittingDelete(true)
      const res = await fetch(`/api/admin/users?id=${memberToDelete.id}`, {
        method: 'DELETE',
      })
      const json = await res.json()
      if (json.success) {
        setIsDeleteOpen(false)
        setMemberToDelete(null)
        await reloadMembers()
      } else {
        alert(json.error || 'Failed to delete employee')
      }
    } catch (e) {
      console.error(e)
      alert('Error deleting employee')
    } finally {
      setIsSubmittingDelete(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-gray-200/80 pb-4 dark:border-gray-800">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Manage Employees</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Invite employees, assign team roles, and configure active tracking status.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={reloadMembers}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            title="Refresh Directory"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setIsInviteOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-blue-700"
          >
            <UserPlus className="h-3.5 w-3.5" />
            Invite Employee
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200/80 bg-white shadow-xs dark:border-gray-800 dark:bg-gray-900 overflow-hidden">
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {members.map((m) => (
            <div key={m.id} className="flex items-center justify-between p-4 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-blue-600 border border-blue-100 font-semibold text-xs dark:bg-blue-900/30 dark:border-blue-850 dark:text-blue-300">
                  {(m.full_name || m.email || 'M').charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-gray-900 dark:text-white">
                      {m.full_name || 'Member'}
                    </span>
                    <span className={`rounded px-1.5 py-0.2 text-[10px] font-medium ${
                      m.role === 'TENANT_ADMIN'
                        ? 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                        : 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                    }`}>
                      {m.role}
                    </span>
                  </div>
                  <div className="text-[11px] text-gray-500 dark:text-gray-400">{m.email}</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${
                  m.is_active !== false
                    ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400'
                    : 'text-gray-500 bg-gray-100 dark:bg-gray-800 dark:text-gray-400'
                }`}>
                  <CheckCircle2 className="h-3 w-3" />
                  {m.is_active !== false ? 'Active' : 'Inactive'}
                </span>
                <button
                  onClick={() => openAccess(m)}
                  className="text-xs font-medium text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  Manage Access
                </button>
                <button
                  onClick={() => {
                    setMemberToDelete(m)
                    setIsDeleteOpen(true)
                  }}
                  className="p-1 text-gray-400 hover:text-red-600 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                  title="Delete Member"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Invite Modal */}
      {isInviteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <form
            onSubmit={handleInvite}
            className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl dark:bg-gray-900 dark:border dark:border-gray-800"
          >
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">Invite Employee</h3>
              <button
                type="button"
                onClick={() => setIsInviteOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Morgan"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. alex@workfolio.io"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1">
                  Role
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                >
                  <option value="EMPLOYEE">Employee</option>
                  <option value="TENANT_ADMIN">Tenant Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1">
                  Team
                </label>
                <select
                  value={inviteTeam}
                  onChange={(e) => setInviteTeam(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                >
                  <option value="Engineering">Engineering</option>
                  <option value="Design & UI/UX">Design & UI/UX</option>
                  <option value="Product & QA">Product & QA</option>
                </select>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsInviteOpen(false)}
                className="rounded-lg px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmittingInvite}
                className="rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1.5"
              >
                {isSubmittingInvite && <RefreshCw className="w-3 h-3 animate-spin" />}
                <span>Send Invite</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Manage Access Modal */}
      {isAccessOpen && editingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <form
            onSubmit={handleSaveAccess}
            className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl dark:bg-gray-900 dark:border dark:border-gray-800"
          >
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">Manage Access</h3>
              <button
                type="button"
                onClick={() => setIsAccessOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <span className="text-xs font-semibold text-gray-800 dark:text-white">
                  {editingMember.full_name || editingMember.email}
                </span>
                <p className="text-[11px] text-gray-400">{editingMember.email}</p>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1">
                  Role
                </label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                >
                  <option value="EMPLOYEE">Employee</option>
                  <option value="TENANT_ADMIN">Tenant Admin</option>
                </select>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-150 dark:border-gray-700">
                <div>
                  <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">Active Status</span>
                  <p className="text-[11px] text-gray-400">Allow login and time tracking</p>
                </div>
                <input
                  type="checkbox"
                  checked={editActive}
                  onChange={(e) => setEditActive(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAccessOpen(false)}
                className="rounded-lg px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmittingAccess}
                className="rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1.5"
              >
                {isSubmittingAccess && <RefreshCw className="w-3 h-3 animate-spin" />}
                <span>Save Changes</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Member Modal */}
      {isDeleteOpen && memberToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl dark:bg-gray-900 dark:border dark:border-gray-800">
            <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center mb-3">
              <Trash2 className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">Delete Employee</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Are you sure you want to delete <strong className="text-gray-900 dark:text-white">{memberToDelete.full_name || memberToDelete.email}</strong>?
            </p>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsDeleteOpen(false)}
                className="rounded-lg px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteMember}
                disabled={isSubmittingDelete}
                className="rounded-lg bg-red-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50 flex items-center gap-1.5"
              >
                {isSubmittingDelete && <RefreshCw className="w-3 h-3 animate-spin" />}
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


export function RiskUserSettingsView() {
  const [highIdleLimit, setHighIdleLimit] = useState('45')
  const [unproductiveLimit, setUnproductiveLimit] = useState('20')
  const [saved, setSaved] = useState(false)

  return (
    <div className="space-y-5">
      <div className="border-b border-gray-200/80 pb-4 dark:border-gray-800">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Risk User Settings</h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          Define heuristic triggers to automatically flag disengaged or high-risk employee behavior.
        </p>
      </div>

      <div className="rounded-xl border border-gray-200/80 bg-white p-5 shadow-xs dark:border-gray-800 dark:bg-gray-900 space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-800 dark:text-gray-200 mb-1">
            Excessive Inactivity / Idle Trigger (minutes per day)
          </label>
          <input
            type="number"
            value={highIdleLimit}
            onChange={(e) => setHighIdleLimit(e.target.value)}
            className="w-full max-w-xs rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-800 shadow-xs focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
          <p className="text-[11px] text-gray-400 mt-1">Users exceeding this daily idle threshold appear on the Risk Users dashboard.</p>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-800 dark:text-gray-200 mb-1">
            Unproductive App Usage Trigger (% of daily time)
          </label>
          <input
            type="number"
            value={unproductiveLimit}
            onChange={(e) => setUnproductiveLimit(e.target.value)}
            className="w-full max-w-xs rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-800 shadow-xs focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
          <p className="text-[11px] text-gray-400 mt-1">Triggers an immediate notification to the tenant administrator when surpassed.</p>
        </div>

        <button
          onClick={() => {
            setSaved(true)
            setTimeout(() => setSaved(false), 3000)
          }}
          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 shadow-xs transition-all"
        >
          {saved ? <Check className="h-3.5 w-3.5" /> : null}
          {saved ? 'Saved' : 'Save Risk Rules'}
        </button>
      </div>
    </div>
  )
}

export function EmailReportsView() {
  const [dailyDigest, setDailyDigest] = useState(true)
  const [weeklyDigest, setWeeklyDigest] = useState(true)
  const [recipient, setRecipient] = useState('admin@example.com')
  const [saved, setSaved] = useState(false)

  return (
    <div className="space-y-5">
      <div className="border-b border-gray-200/80 pb-4 dark:border-gray-800">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Email Reports</h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          Automate PDF executive summaries delivered straight to leadership inboxes.
        </p>
      </div>

      <div className="rounded-xl border border-gray-200/80 bg-white p-5 shadow-xs dark:border-gray-800 dark:bg-gray-900 space-y-4">
        <div className="flex items-center justify-between py-1">
          <div>
            <span className="text-xs font-medium text-gray-800 dark:text-gray-200">Daily Attendance &amp; Activity Digest</span>
            <p className="text-[11px] text-gray-400">Dispatched every evening at 18:00 local time</p>
          </div>
          <Toggle
            checked={dailyDigest}
            onChange={() => setDailyDigest(!dailyDigest)}
          />
        </div>

        <div className="flex items-center justify-between py-1 border-t border-gray-100 dark:border-gray-800 pt-3">
          <div>
            <span className="text-xs font-medium text-gray-800 dark:text-gray-200">Weekly Productivity Executive Summary</span>
            <p className="text-[11px] text-gray-400">Dispatched every Monday morning at 08:00 local time</p>
          </div>
          <Toggle
            checked={weeklyDigest}
            onChange={() => setWeeklyDigest(!weeklyDigest)}
          />
        </div>

        <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1">
            Recipient Emails (Comma separated)
          </label>
          <input
            type="text"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            className="w-full max-w-md rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-800 shadow-xs dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
        </div>

        <button
          onClick={() => {
            setSaved(true)
            setTimeout(() => setSaved(false), 3000)
          }}
          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 shadow-xs transition-all"
        >
          {saved ? <Check className="h-3.5 w-3.5" /> : null}
          {saved ? 'Saved' : 'Save Email Configuration'}
        </button>
      </div>
    </div>
  )
}

export function RebrandSettingsView() {
  const [orgName, setOrgName] = useState('TimeGuard Enterprise')
  const [saved, setSaved] = useState(false)

  return (
    <div className="space-y-5">
      <div className="border-b border-gray-200/80 pb-4 dark:border-gray-800">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Rebrand Settings</h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          White-label the employee desktop agent, notifications, and portal logo.
        </p>
      </div>

      <div className="rounded-xl border border-gray-200/80 bg-white p-5 shadow-xs dark:border-gray-800 dark:bg-gray-900 space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-800 dark:text-gray-200 mb-1">
            Organization Display Name
          </label>
          <input
            type="text"
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
            className="w-full max-w-md rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-800 shadow-xs dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-800 dark:text-gray-200 mb-1">
            Custom Logo
          </label>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
              <Upload className="h-4 w-4 text-gray-400" />
            </div>
            <div>
              <button className="rounded-lg border border-gray-200 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 shadow-xs">
                Upload New Image
              </button>
              <p className="text-[10px] text-gray-400 mt-0.5">PNG, JPG, or SVG up to 2MB (Recommended 256x256)</p>
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            setSaved(true)
            setTimeout(() => setSaved(false), 3000)
          }}
          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 shadow-xs transition-all"
        >
          {saved ? <Check className="h-3.5 w-3.5" /> : null}
          {saved ? 'Saved' : 'Save Rebrand Settings'}
        </button>
      </div>
    </div>
  )
}
