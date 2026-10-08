'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { RefreshCw } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { useAdminFilter } from '../admin-filter-context'
import AdminHeader from '../admin-header'

// Timeline Activity Classification
type ActivityType =
  | 'PRODUCTIVE'
  | 'UNPRODUCTIVE'
  | 'NEUTRAL'
  | 'IDLE'
  | 'NOT_IN_WORK'
  | 'UNTRACKED'

interface TimelineSegment {
  id: string
  startMin: number // minutes from 10:00 AM (0 to 570)
  durationMin: number
  type: ActivityType
  appName: string
  windowTitle?: string
  startTimeStr: string
  endTimeStr: string
  durationStr: string
}

interface EmployeeTimelineRow {
  id: string
  name: string
  email: string
  role: string
  team: string
  teams?: string[]
  hasClockedIn: boolean
  hasEvents: boolean
  segments: TimelineSegment[]
}

// Activity Color Config matching Screenshot 4
const TYPE_CONFIG: Record<
  ActivityType,
  { label: string; dotColor: string; bgHex: string }
> = {
  PRODUCTIVE: {
    label: 'Productive Apps Time',
    dotColor: 'bg-[#22c55e]',
    bgHex: '#22c55e',
  },
  UNPRODUCTIVE: {
    label: 'Unproductive Apps Time',
    dotColor: 'bg-[#ef4444]',
    bgHex: '#ef4444',
  },
  NEUTRAL: {
    label: 'Neutral Apps Time',
    dotColor: 'bg-[#3b82f6]',
    bgHex: '#3b82f6',
  },
  IDLE: {
    label: 'Idle Time',
    dotColor: 'bg-[#f97316]',
    bgHex: '#f97316',
  },
  NOT_IN_WORK: {
    label: 'Not In Work',
    dotColor: 'bg-[#eab308]',
    bgHex: '#eab308',
  },
  UNTRACKED: {
    label: 'Untracked',
    dotColor: 'bg-[#d4c5a9]',
    bgHex: '#d4c5a9',
  },
}

// Total timeline width represents 10:00 AM to 19:30 PM = 9.5 hours = 570 mins
const TOTAL_MINUTES = 570

// Axis ticks: 10:30, 11:00, 11:30 ... 19:00
const TIME_TICKS = [
  { min: 30, label: ':30' },
  { min: 60, label: '11:00' },
  { min: 90, label: ':30' },
  { min: 120, label: '12:00' },
  { min: 150, label: ':30' },
  { min: 180, label: '13:00' },
  { min: 210, label: ':30' },
  { min: 240, label: '14:00' },
  { min: 270, label: ':30' },
  { min: 300, label: '15:00' },
  { min: 330, label: ':30' },
  { min: 360, label: '16:00' },
  { min: 390, label: ':30' },
  { min: 420, label: '17:00' },
  { min: 450, label: ':30' },
  { min: 480, label: '18:00' },
  { min: 510, label: ':30' },
  { min: 540, label: '19:00' },
]

export default function TimelinePage() {
  const { searchQuery, selectedDate, selectedTeam, refreshTrigger, currentUser } = useAdminFilter()
  const [timelines, setTimelines] = useState<EmployeeTimelineRow[]>([])
  const [loading, setLoading] = useState(true)

  // Interactive Hover Tooltip State
  const [hoveredSegment, setHoveredSegment] = useState<{
    segment: TimelineSegment
    employeeName: string
    x: number
    y: number
  } | null>(null)

  // Fetch real timeline data from API
  const fetchTimelineData = useCallback(async (date: string) => {
    try {
      setLoading(true)
      const res = await fetch(`/api/admin/timeline?date=${date}`, { cache: 'no-store' })
      const json = await res.json()
      if (json.success && json.timelines) {
        setTimelines(json.timelines)
      }
    } catch (err) {
      console.error('Failed to fetch timeline data:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTimelineData(selectedDate)
  }, [selectedDate, fetchTimelineData, refreshTrigger])

  // Realtime Supabase Subscription for activity events
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('timeline_realtime_sync')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'activity_events' },
        () => {
          console.log('⚡ Realtime activity_events insert detected, updating timeline...')
          fetchTimelineData(selectedDate)
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'users' },
        () => {
          fetchTimelineData(selectedDate)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [selectedDate, fetchTimelineData])

  const filteredTimelines = timelines.filter((emp) => {
    const matchesSearch =
      emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesTeam =
      selectedTeam === 'All Team' ||
      emp.team === selectedTeam ||
      (emp.teams && emp.teams.includes(selectedTeam))
    return matchesSearch && matchesTeam
  })

  const todayActual = new Date().toISOString().slice(0, 10)
  const yesterdayActual = new Date(Date.now() - 86400000).toISOString().slice(0, 10)

  const dayTitle =
    selectedDate === todayActual || selectedDate === '2026-09-10'
      ? 'Today Activities'
      : selectedDate === yesterdayActual || selectedDate === '2026-09-09'
      ? 'Yesterday Activities'
      : `${selectedDate} Activities`

  return (
    <div className="min-h-full bg-white dark:bg-gray-900 pb-16">
      {/* Top Header Bar */}
      <AdminHeader
        title={currentUser?.role === 'EMPLOYEE' ? 'My Timeline' : 'Timeline'}
        subtitle={
          currentUser?.role === 'EMPLOYEE'
            ? 'Your daily proof of work and tracked application activities'
            : undefined
        }
        searchPlaceholder={currentUser?.role === 'EMPLOYEE' ? undefined : 'Search in timeline'}
        showSearch={currentUser?.role !== 'EMPLOYEE'}
        showTeamFilter={currentUser?.role !== 'EMPLOYEE'}
        showAddUser={false}
        loading={loading}
        onRefresh={() => fetchTimelineData(selectedDate)}
        onUserAdded={() => fetchTimelineData(selectedDate)}
      />

      {/* Subheader & Activity Legend Row (Screenshot 4) */}
      <div className="px-8 pt-6 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100 tracking-tight">
          {dayTitle}
        </h2>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-gray-600 dark:text-gray-300 font-normal">
          {(Object.keys(TYPE_CONFIG) as ActivityType[]).map((type) => {
            const config = TYPE_CONFIG[type]
            return (
              <div key={type} className="flex items-center gap-1.5">
                <span className={`w-2.5 h-2.5 rounded-full ${config.dotColor} inline-block shadow-2xs`} />
                <span>{config.label}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Main Visual Multi-Track Timeline */}
      <div className="px-8">
        <div className="border border-gray-150 dark:border-gray-800 rounded-xl bg-white dark:bg-gray-900 p-6 shadow-2xs overflow-x-auto">
          <div className="min-w-[860px]">
            {/* Rows for Employees */}
            <div className="space-y-6">
              {filteredTimelines.length === 0 ? (
                <div className="py-12 text-center text-xs text-gray-400">
                  No employee activities recorded for this date.
                </div>
              ) : (
                filteredTimelines.map((emp) => {
                  return (
                    <div key={emp.id} className="grid grid-cols-12 items-center gap-4">
                      {/* Left Column: Employee Name */}
                      <div className="col-span-2 text-xs font-semibold text-gray-800 dark:text-gray-100 truncate">
                        {emp.name}
                      </div>

                      {/* Right Column: Multi-segment Activity Bar */}
                      <div className="col-span-10 relative">
                        {/* Background Track Bar */}
                        <div className="h-9 w-full bg-gray-50 dark:bg-gray-800/60 rounded-xs relative overflow-hidden flex items-stretch">
                          {emp.segments.length === 0 ? (
                            <div className="w-full h-full flex items-center justify-center text-[11px] text-gray-400 dark:text-gray-500 font-normal">
                              No activity tracked
                            </div>
                          ) : (
                            emp.segments.map((seg) => {
                              const leftPct = (seg.startMin / TOTAL_MINUTES) * 100
                              const widthPct = Math.max(0.6, (seg.durationMin / TOTAL_MINUTES) * 100)
                              const color = TYPE_CONFIG[seg.type]?.bgHex || '#3b82f6'

                              return (
                                <div
                                  key={seg.id}
                                  onMouseEnter={(e) => {
                                    const rect = e.currentTarget.getBoundingClientRect()
                                    setHoveredSegment({
                                      segment: seg,
                                      employeeName: emp.name,
                                      x: rect.left + rect.width / 2,
                                      y: rect.top - 8,
                                    })
                                  }}
                                  onMouseLeave={() => setHoveredSegment(null)}
                                  className="absolute top-0 bottom-0 cursor-pointer hover:brightness-105 hover:z-10 transition-all border-r border-black/5"
                                  style={{
                                    left: `${leftPct}%`,
                                    width: `${widthPct}%`,
                                    backgroundColor: color,
                                  }}
                                />
                              )
                            })
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* Bottom Timeline Axis & Ticks */}
            <div className="grid grid-cols-12 items-center gap-4 mt-6 pt-3 border-t border-gray-150 dark:border-gray-800">
              <div className="col-span-2" />
              <div className="col-span-10 relative h-6">
                {TIME_TICKS.map((tick, idx) => {
                  const leftPct = (tick.min / TOTAL_MINUTES) * 100
                  const isHour = tick.label !== ':30'
                  return (
                    <div
                      key={idx}
                      className="absolute -translate-x-1/2 flex flex-col items-center"
                      style={{ left: `${leftPct}%` }}
                    >
                      <span
                        className={`text-[11px] ${
                          isHour
                            ? 'font-bold text-gray-800 dark:text-gray-200'
                            : 'font-normal text-gray-400 dark:text-gray-500'
                        }`}
                      >
                        {tick.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Interactive Tooltip (Screenshot 4) */}
      {hoveredSegment && (
        <div
          className="fixed pointer-events-none z-50 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 px-4 py-3 text-xs w-64 -translate-x-1/2 -translate-y-full mb-2 animate-in fade-in zoom-in-95 duration-100"
          style={{
            left: `${hoveredSegment.x}px`,
            top: `${hoveredSegment.y}px`,
          }}
        >
          {/* Tooltip Title */}
          <div className="font-bold text-gray-900 dark:text-white truncate">
            {hoveredSegment.segment.type === 'PRODUCTIVE'
              ? `Productive App (${hoveredSegment.segment.appName})`
              : hoveredSegment.segment.type === 'UNPRODUCTIVE'
              ? `Unproductive App (${hoveredSegment.segment.appName})`
              : hoveredSegment.segment.type === 'NEUTRAL'
              ? `Neutral App (${hoveredSegment.segment.appName})`
              : hoveredSegment.segment.type === 'IDLE'
              ? 'Idle Time'
              : hoveredSegment.segment.type === 'NOT_IN_WORK'
              ? hoveredSegment.segment.appName
              : 'Untracked Activity'}
          </div>

          {/* User & Time Range */}
          <div className="text-gray-700 dark:text-gray-200 mt-1 font-medium truncate">
            {hoveredSegment.employeeName} : {hoveredSegment.segment.startTimeStr} -{' '}
            {hoveredSegment.segment.endTimeStr}
          </div>

          {/* Date */}
          <div className="text-gray-500 dark:text-gray-400 mt-0.5">
            Date : {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
          </div>

          {/* Duration */}
          <div className="text-gray-500 dark:text-gray-400 mt-0.5">
            Duration: {hoveredSegment.segment.durationStr}
          </div>
        </div>
      )}

    </div>
  )
}
