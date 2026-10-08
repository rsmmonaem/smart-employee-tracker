'use client'

import React, { useState, useEffect } from 'react'
import { Play, Video } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { useAdminFilter } from '../admin-filter-context'
import AdminHeader from '../admin-header'

type TimelapseJob = {
  id: string
  date: string
  user_id: string
  created_at: string
  users?: {
    full_name: string | null
    email: string
  } | null
}

export default function TimelapsePage() {
  const { searchQuery, selectedDate, refreshTrigger } = useAdminFilter()
  const [timelapses, setTimelapses] = useState<TimelapseJob[]>([])
  const [loading, setLoading] = useState(true)

  const fetchTimelapses = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/timelapse')
      const json = await res.json()
      if (json.success && json.jobs) {
        setTimelapses(json.jobs)
      } else {
        setTimelapses([])
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTimelapses()
  }, [refreshTrigger])

  const filtered = timelapses.filter((job) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      const name = (job.users?.full_name || '').toLowerCase()
      const email = (job.users?.email || job.user_id || '').toLowerCase()
      if (!name.includes(q) && !email.includes(q)) return false
    }
    if (selectedDate && job.date) {
      if (!job.date.startsWith(selectedDate)) return false
    }
    return true
  })

  return (
    <div className="min-h-full bg-white dark:bg-gray-900 pb-16">
      <AdminHeader
        title="Timelapse Videos"
        subtitle="Generated videos stitching together daily screenshot activity"
        searchPlaceholder="Search in timelapse"
        loading={loading}
        onRefresh={fetchTimelapses}
        onUserAdded={fetchTimelapses}
        extraActions={
          <button className="inline-flex items-center justify-center rounded-full bg-[#1677ff] hover:bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs transition-colors shrink-0">
            Generate New Timelapse
          </button>
        }
      />

      <div className="p-8 space-y-6">
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800 overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
              Available Timelapses
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Rendered timelapse videos from employee work sessions.
            </p>
          </div>

          {filtered.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 p-6 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((job) => (
                <div
                  key={job.id}
                  className="group relative rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden bg-gray-50 dark:bg-gray-900 aspect-video flex items-center justify-center hover:ring-2 hover:ring-blue-500 transition-all cursor-pointer"
                >
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors z-10" />
                  <Play className="w-12 h-12 text-white opacity-70 group-hover:opacity-100 group-hover:scale-110 transition-all z-20" />
                  <div className="absolute bottom-3 left-3 z-20">
                    <p className="text-sm font-medium text-white">
                      {job.users?.full_name || job.users?.email || 'Employee'}
                    </p>
                    <p className="text-xs text-gray-200">{job.date}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <div className="rounded-full bg-blue-50 p-3 dark:bg-blue-900/20 mb-4">
                <Video className="w-8 h-8 text-blue-500 dark:text-blue-400" />
              </div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                No Timelapse Videos Generated Yet
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 max-w-sm">
                Once an employee captures enough screenshots, click &quot;Generate New Timelapse&quot; to stitch them into a video.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
