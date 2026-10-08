'use client'

import React, { createContext, useContext, useState, ReactNode } from 'react'

export type PeriodPreset =
  | 'Today'
  | 'This Week'
  | 'Yesterday'
  | 'This Month'
  | 'Last 7 Days'
  | 'Last Month'
  | 'Last Week'
  | 'Custom'

export interface CurrentUserProfile {
  id: string
  email: string
  fullName: string
  role: 'SUPER_ADMIN' | 'TENANT_ADMIN' | 'EMPLOYEE'
  tenantId: string | null
  isSuperAdmin: boolean
  isTenantAdmin: boolean
  isEmployee: boolean
}

interface AdminFilterContextType {
  searchQuery: string
  setSearchQuery: (query: string) => void
  selectedDate: string
  setSelectedDate: (date: string) => void
  selectedPreset: PeriodPreset
  setSelectedPreset: (preset: PeriodPreset) => void
  selectedTeam: string
  setSelectedTeam: (team: string) => void
  teams: string[]
  setTeams: (teams: string[]) => void
  showAddUserModal: boolean
  setShowAddUserModal: (show: boolean) => void
  refreshTrigger: number
  triggerRefresh: () => void
  currentUser: CurrentUserProfile | null
}

const AdminFilterContext = createContext<AdminFilterContextType | undefined>(undefined)

export function AdminFilterProvider({ children }: { children: ReactNode }) {
  const [searchQuery, setSearchQuery] = useState('')
  const todayStr = new Date().toISOString().slice(0, 10)
  const [selectedDate, setSelectedDate] = useState(todayStr)
  const [selectedPreset, setSelectedPreset] = useState<PeriodPreset>('Today')
  const [selectedTeam, setSelectedTeam] = useState('All Team')
  const [teams, setTeams] = useState<string[]>(['All Team'])
  const [showAddUserModal, setShowAddUserModal] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [currentUser, setCurrentUser] = useState<CurrentUserProfile | null>(null)

  const triggerRefresh = () => setRefreshTrigger((prev) => prev + 1)

  // Fetch current authenticated user role & profile
  React.useEffect(() => {
    let isMounted = true
    const fetchMe = async () => {
      try {
        const res = await fetch('/api/admin/me')
        const data = await res.json()
        if (isMounted && data.success && data.user) {
          setCurrentUser(data.user)
        }
      } catch (err) {
        console.error('Error fetching current user profile:', err)
      }
    }
    fetchMe()
    return () => {
      isMounted = false
    }
  }, [])

  // Dynamically load teams from database
  React.useEffect(() => {
    let isMounted = true
    const fetchTeams = async () => {
      try {
        const res = await fetch('/api/admin/teams', { cache: 'no-store' })
        const data = await res.json()
        if (isMounted && data.success && Array.isArray(data.teams)) {
          const fetchedNames = data.teams
            .map((t: any) => t.name?.trim())
            .filter(Boolean)
          const uniqueTeams = ['All Team', ...Array.from(new Set(fetchedNames as string[]))]
          setTeams(uniqueTeams)
        }
      } catch (err) {
        console.error('Error fetching dynamic teams:', err)
      }
    }
    fetchTeams()
    return () => {
      isMounted = false
    }
  }, [refreshTrigger])

  return (
    <AdminFilterContext.Provider
      value={{
        searchQuery,
        setSearchQuery,
        selectedDate,
        setSelectedDate,
        selectedPreset,
        setSelectedPreset,
        selectedTeam,
        setSelectedTeam,
        teams,
        setTeams,
        showAddUserModal,
        setShowAddUserModal,
        refreshTrigger,
        triggerRefresh,
        currentUser,
      }}
    >
      {children}
    </AdminFilterContext.Provider>
  )
}

export function useAdminFilter() {
  const context = useContext(AdminFilterContext)
  if (!context) {
    throw new Error('useAdminFilter must be used within an AdminFilterProvider')
  }
  return context
}
