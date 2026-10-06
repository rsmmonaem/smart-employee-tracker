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
}

const DEFAULT_TEAMS = [
  'All Team',
  'Engineering',
  'Design',
  'Marketing',
  'Management',
]

const AdminFilterContext = createContext<AdminFilterContextType | undefined>(undefined)

export function AdminFilterProvider({ children }: { children: ReactNode }) {
  const [searchQuery, setSearchQuery] = useState('')
  const todayStr = new Date().toISOString().slice(0, 10)
  const [selectedDate, setSelectedDate] = useState(todayStr)
  const [selectedPreset, setSelectedPreset] = useState<PeriodPreset>('Today')
  const [selectedTeam, setSelectedTeam] = useState('All Team')
  const [teams, setTeams] = useState<string[]>(DEFAULT_TEAMS)
  const [showAddUserModal, setShowAddUserModal] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const triggerRefresh = () => setRefreshTrigger((prev) => prev + 1)

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
