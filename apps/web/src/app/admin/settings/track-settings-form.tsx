'use client'

import React, { useState, useEffect } from 'react'
import {
  Check,
  Save,
  RefreshCw,
  Sliders,
  AlertCircle,
  ExternalLink,
  Search,
  CheckCircle2,
  X
} from 'lucide-react'

// Generate 15-minute intervals up to 15 hour 45 mins
const TIME_INTERVALS: string[] = (() => {
  const list: string[] = []
  for (let h = 0; h <= 15; h++) {
    for (let m = 0; m < 60; m += 15) {
      if (h === 0 && m === 0) continue
      if (h === 0) {
        list.push(`${m} mins`)
      } else if (m === 0) {
        list.push(`${h} hour`)
      } else {
        list.push(`${h} hour ${m} mins`)
      }
    }
  }
  return list
})()

const TIMEZONES = [
  'Asia/Dhaka',
  'Asia/Kolkata',
  'Asia/Dubai',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'America/New_York',
  'America/Chicago',
  'America/Los_Angeles',
  'Australia/Sydney',
  'UTC',
]

const CURRENCIES = [
  'United States Dollar ($)',
  'Euro (€)',
  'British Pound (£)',
  'Bangladeshi Taka (৳)',
  'Indian Rupee (₹)',
  'Canadian Dollar ($)',
  'Australian Dollar ($)',
  'Singapore Dollar ($)',
]

const SCREENSHOT_INTERVALS = [
  'Every 1 min',
  'Every 2 mins',
  'Every 3 mins',
  'Every 5 mins',
  'Every 10 mins',
  'Every 15 mins',
  'Every 30 mins',
  'Every 60 mins',
]

const IDLE_INTERVALS = [
  '1 min',
  '2 mins',
  '3 mins',
  '5 mins',
  '10 mins',
  '15 mins',
  '30 mins',
]

const ALL_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

interface Member {
  id: string
  full_name: string | null
  email: string
  role: string
  is_active: boolean
  tracking_mode?: string
  app_version?: string
  team?: string
  os?: string
}

interface MemberOverride {
  enableScreenCapture?: boolean
  blurScreenCapture?: boolean
  screenshotInterval?: string
  idleTimeout?: string
  allowEmployeeSeeScreenshot?: boolean
  allowEmployeeDeleteScreenshot?: boolean
}

interface TrackSettings {
  workDays?: string[]
  expectedWorkHours?: string
  expectedProductiveTime?: string
  expectedActiveTime?: string
  timezone?: string
  expectedClockIn?: string
  enableProjectManagement?: boolean
  allowTeamAddEditDeleteTasks?: boolean
  allowTeamCompleteAndHoldTasks?: boolean
  allowTeamEditTaskTimes?: boolean
  sendEmailOnTaskStatusChange?: boolean
  autoStartEndTaskUsingCurrentTime?: boolean
  restrictNewTasksWhenPending?: boolean
  projectCurrency?: string
  enableLeaveManagement?: boolean
  enableManualTimeToEveryone?: boolean
  untrackedHoursBehavior?: string
  enablePayrollCalculator?: boolean
  enableTrackKeypressCountWindows?: boolean
  enableMouseActivityTrackingWindows?: boolean
  emailReportScope?: string
  enableScreenCapture?: boolean
  blurScreenCapture?: boolean
  screenshotInterval?: string
  allowTimelapseVideo?: boolean
  idleTimeout?: string
  hideAdminTrackingAndLeaveFromHeads?: boolean
  allowEmployeeSeeScreenshot?: boolean
  allowEmployeeDeleteScreenshot?: boolean
  allowHeadsDeleteExportScreenshot?: boolean
  allowEmployeeSeeTimesheet?: boolean
  allowEmployeeSeeTimelapse?: boolean
  allowHeadsReviewAppsSites?: boolean
  allowEmployeeAccessWebsite?: boolean
  hideAdminDataFromAllPages?: boolean
  hideTeamHeadDataFromAllPages?: boolean
  hideEditTrackSettingsFromHeads?: boolean
  autoSendHolidayNotifications?: boolean
  enableApiAccess?: boolean
  enableRealTimeAlert?: boolean
  memberOverrides?: Record<string, MemberOverride>
  [key: string]: unknown
}

interface TrackSettingsProps {
  initialSettings?: TrackSettings
  initialMembers?: Member[]
}

// Minimalist iOS-style Toggle Component
function Toggle({
  checked,
  onChange,
  disabled = false,
}: {
  checked: boolean
  onChange: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={onChange}
      className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-600/20 ${
        checked ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
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

export default function TrackSettingsForm({ initialSettings, initialMembers = [] }: TrackSettingsProps) {
  const [settings, setSettings] = useState<TrackSettings>(initialSettings || {})
  const [members, setMembers] = useState<Member[]>(initialMembers)
  const [saving, setSaving] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Filters for member overrides table
  const [roleFilter, setRoleFilter] = useState('All Roles')
  const [teamFilter, setTeamFilter] = useState('All Teams')
  const [osFilter, setOsFilter] = useState('All OS')
  const [searchQuery, setSearchQuery] = useState('')

  // Member modal for editing specific track settings
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const [memberModalOpen, setMemberModalOpen] = useState(false)
  const [memberOverrideState, setMemberOverrideState] = useState<MemberOverride>({})

  // Fetch settings and members on mount
  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch('/api/admin/settings')
        if (res.ok) {
          const data = await res.json()
          if (data.settings) setSettings(data.settings)
          if (data.members && data.members.length > 0) {
            setMembers(data.members)
          }
        }
      } catch (err) {
        console.error('Failed to load settings:', err)
      }
    }
    loadData()
  }, [])

  // Auto-dismiss toast
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3500)
      return () => clearTimeout(timer)
    }
  }, [toastMessage])

  const handleSave = async () => {
    setSaving(true)
    setErrorMessage(null)
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setToastMessage('Track settings saved successfully!')
      } else {
        setErrorMessage(data.error || 'Failed to save settings')
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error occurred while saving'
      setErrorMessage(message)
    } finally {
      setSaving(false)
    }
  }

  const toggleDay = (day: string) => {
    const currentDays = settings.workDays || []
    if (currentDays.includes(day)) {
      setSettings({
        ...settings,
        workDays: currentDays.filter((d: string) => d !== day),
      })
    } else {
      setSettings({
        ...settings,
        workDays: [...currentDays, day],
      })
    }
  }

  const handleToggle = (key: string) => {
    setSettings((prev: TrackSettings) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  const handleChange = (key: string, value: unknown) => {
    setSettings((prev: TrackSettings) => ({
      ...prev,
      [key]: value,
    }))
  }

  // Open Edit Track Settings Modal for a specific member
  const handleOpenMemberSettings = (member: Member) => {
    setSelectedMember(member)
    const existingOverride = settings.memberOverrides?.[member.id] || {
      enableScreenCapture: settings.enableScreenCapture ?? true,
      blurScreenCapture: settings.blurScreenCapture ?? false,
      screenshotInterval: settings.screenshotInterval ?? 'Every 10 mins',
      idleTimeout: settings.idleTimeout ?? '1 min',
      allowEmployeeSeeScreenshot: settings.allowEmployeeSeeScreenshot ?? true,
      allowEmployeeDeleteScreenshot: settings.allowEmployeeDeleteScreenshot ?? false,
    }
    setMemberOverrideState(existingOverride)
    setMemberModalOpen(true)
  }

  const handleSaveMemberOverride = () => {
    if (!selectedMember) return
    const updatedOverrides = {
      ...(settings.memberOverrides || {}),
      [selectedMember.id]: memberOverrideState,
    }
    setSettings({
      ...settings,
      memberOverrides: updatedOverrides,
    })
    setMemberModalOpen(false)
    setToastMessage(`Custom track settings applied for ${selectedMember.full_name || selectedMember.email}`)
  }

  // Filtered members
  const filteredMembers = members.filter((m) => {
    if (roleFilter !== 'All Roles') {
      if (roleFilter === 'Admin' && m.role !== 'TENANT_ADMIN' && m.role !== 'SUPER_ADMIN') return false
      if (roleFilter === 'Employee' && m.role !== 'EMPLOYEE') return false
    }
    if (teamFilter !== 'All Teams' && m.team && m.team !== teamFilter) return false
    if (osFilter !== 'All OS' && m.os && m.os !== osFilter) return false
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const matchName = m.full_name?.toLowerCase().includes(q)
      const matchEmail = m.email?.toLowerCase().includes(q)
      if (!matchName && !matchEmail) return false
    }
    return true
  })

  return (
    <div className="space-y-5 pb-16">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-xl bg-gray-900 px-4 py-3 text-xs font-medium text-white shadow-lg dark:bg-white dark:text-gray-900 transition-all animate-in fade-in slide-in-from-bottom-3">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 dark:text-emerald-600" />
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="ml-2 opacity-60 hover:opacity-100">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="rounded-xl border border-red-200 bg-red-50/60 p-3.5 text-xs text-red-700 dark:border-red-900/40 dark:bg-red-900/10 dark:text-red-300">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 flex-shrink-0 text-red-600" />
            <span>{errorMessage}</span>
          </div>
        </div>
      )}

      {/* Sticky Header with Save Button */}
      <div className="sticky top-0 z-20 -mx-6 flex items-center justify-between border-b border-gray-200/80 bg-gray-50/90 px-6 py-3.5 backdrop-blur-md dark:border-gray-800 dark:bg-gray-900/90">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Track Settings</h2>
          <p className="text-[12px] text-gray-500 dark:text-gray-400">
            Configure attendance, tracking rules, privacy, and desktop agent behaviors across your organization.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 transition-all active:scale-[0.98]"
          >
            {saving ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-3.5 w-3.5" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>

      {/* 1. Work Day Settings */}
      <section className="rounded-xl border border-gray-200/80 bg-white p-5 shadow-xs dark:border-gray-800 dark:bg-gray-900">
        <div className="mb-3.5">
          <h3 className="text-[15px] font-semibold text-gray-900 dark:text-white">Work Day Settings</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Choose work days for attendance calculations and expected weekly schedules.
          </p>
        </div>
        <div>
          <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Choose work days
          </label>
          <div className="flex flex-wrap gap-2">
            {ALL_DAYS.map((day) => {
              const isSelected = (settings.workDays || []).includes(day)
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(day)}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-750'
                  }`}
                >
                  {isSelected && <Check className="h-3.5 w-3.5 stroke-[2.5]" />}
                  {day}
                </button>
              )
            })}
          </div>
        </div>
      </section>

      {/* 2. Work Time Settings */}
      <section className="rounded-xl border border-gray-200/80 bg-white p-5 shadow-xs dark:border-gray-800 dark:bg-gray-900">
        <div className="mb-4">
          <h3 className="text-[15px] font-semibold text-gray-900 dark:text-white">Work Time Settings</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Set productivity targets, daily shift lengths, and default timezone.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Expected work hours */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-300">
              Expected work hours
            </label>
            <select
              value={settings.expectedWorkHours || '8 hour'}
              onChange={(e) => handleChange('expectedWorkHours', e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-800 shadow-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
            >
              {[...Array(16)].map((_, idx) => (
                <option key={idx + 1} value={`${idx + 1} hour`}>
                  {idx + 1} hour{idx > 0 ? 's' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Expected productive apps usage time */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-300">
              Expected productive apps usage time
            </label>
            <select
              value={settings.expectedProductiveTime || '6 hour'}
              onChange={(e) => handleChange('expectedProductiveTime', e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-800 shadow-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
            >
              {TIME_INTERVALS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Expected active time */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                Expected active time
              </label>
              <span className="text-[11px] text-gray-400">
                (Excluding idle time from total work time)
              </span>
            </div>
            <select
              value={settings.expectedActiveTime || '8 hour (Recommended)'}
              onChange={(e) => handleChange('expectedActiveTime', e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-800 shadow-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
            >
              {TIME_INTERVALS.map((t) => {
                const isRec = t === '8 hour'
                const val = isRec ? '8 hour (Recommended)' : t
                return (
                  <option key={t} value={val}>
                    {val}
                  </option>
                )
              })}
            </select>
          </div>

          {/* Organisation timezone */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-300">
              Organisation timezone
            </label>
            <select
              value={settings.timezone || 'Asia/Dhaka'}
              onChange={(e) => handleChange('timezone', e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-800 shadow-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
            >
              {TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </select>
          </div>

          {/* Expected Clock-in */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-300">
              Expected Clock-in
            </label>
            <input
              type="text"
              value={settings.expectedClockIn || '09:00 AM'}
              onChange={(e) => handleChange('expectedClockIn', e.target.value)}
              placeholder="09:00 AM"
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-800 shadow-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
            />
          </div>
        </div>
      </section>

      {/* 3. Project Management */}
      <section className="rounded-xl border border-gray-200/80 bg-white p-5 shadow-xs dark:border-gray-800 dark:bg-gray-900">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h3 className="text-[15px] font-semibold text-gray-900 dark:text-white">Project Management</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Control task tracking, member editing permissions, and project currency.
            </p>
          </div>
          <Toggle
            checked={!!settings.enableProjectManagement}
            onChange={() => handleToggle('enableProjectManagement')}
          />
        </div>

        {settings.enableProjectManagement && (
          <div className="space-y-3.5 pt-2 border-t border-gray-100 dark:border-gray-800">
            {/* Toggles */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between py-1">
                <span className="text-xs text-gray-800 dark:text-gray-200">
                  Allow team members to add, edit and delete their tasks
                </span>
                <Toggle
                  checked={!!settings.allowTeamAddEditDeleteTasks}
                  onChange={() => handleToggle('allowTeamAddEditDeleteTasks')}
                />
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="text-xs text-gray-800 dark:text-gray-200">
                  Allow team members to mark their tasks as completed &amp; hold
                </span>
                <Toggle
                  checked={!!settings.allowTeamCompleteAndHoldTasks}
                  onChange={() => handleToggle('allowTeamCompleteAndHoldTasks')}
                />
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="text-xs text-gray-800 dark:text-gray-200">
                  Allow team members to edit task times
                </span>
                <Toggle
                  checked={!!settings.allowTeamEditTaskTimes}
                  onChange={() => handleToggle('allowTeamEditTaskTimes')}
                />
              </div>
            </div>

            {/* Advanced Features (Premium) */}
            <div className="mt-3 rounded-lg border border-amber-200/60 bg-amber-50/30 p-3.5 dark:border-amber-900/40 dark:bg-amber-950/15">
              <div className="mb-2.5 flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-900 dark:text-white">Advanced Features</span>
                <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                  Premium
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <span className="text-xs text-gray-700 dark:text-gray-300 pr-3">
                    Send email notifications to associated users when the task status changes.
                  </span>
                  <Toggle
                    checked={!!settings.sendEmailOnTaskStatusChange}
                    onChange={() => handleToggle('sendEmailOnTaskStatusChange')}
                  />
                </div>

                <div className="flex items-start justify-between">
                  <div className="pr-3">
                    <p className="text-xs font-medium text-gray-800 dark:text-gray-200">
                      Auto start and end task using current time
                    </p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                      When enabled, the task start and end time will be recorded automatically based on when the employee clicks the start and stop buttons.
                    </p>
                  </div>
                  <Toggle
                    checked={!!settings.autoStartEndTaskUsingCurrentTime}
                    onChange={() => handleToggle('autoStartEndTaskUsingCurrentTime')}
                  />
                </div>

                <div className="flex items-start justify-between">
                  <div className="pr-3">
                    <p className="text-xs font-medium text-gray-800 dark:text-gray-200">
                      Restrict new tasks when a previous task is pending
                    </p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                      When enabled, employees cannot start a new task if their previous task is not completed or ended.
                    </p>
                  </div>
                  <Toggle
                    checked={!!settings.restrictNewTasksWhenPending}
                    onChange={() => handleToggle('restrictNewTasksWhenPending')}
                  />
                </div>
              </div>
            </div>

            {/* Currency selector */}
            <div className="pt-2">
              <label className="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-300">
                Project currency
              </label>
              <select
                value={settings.projectCurrency || 'United States Dollar ($)'}
                onChange={(e) => handleChange('projectCurrency', e.target.value)}
                className="w-full max-w-sm rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-800 shadow-xs focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </section>

      {/* 4. Leave Management */}
      <section className="rounded-xl border border-gray-200/80 bg-white p-5 shadow-xs dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-[15px] font-semibold text-gray-900 dark:text-white">Leave Management</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Enable leave management and automated balance calculations.
            </p>
          </div>
          <Toggle
            checked={!!settings.enableLeaveManagement}
            onChange={() => handleToggle('enableLeaveManagement')}
          />
        </div>
      </section>

      {/* 5. Manual Time */}
      <section className="rounded-xl border border-gray-200/80 bg-white p-5 shadow-xs dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-[15px] font-semibold text-gray-900 dark:text-white">Manual Time</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Enable manual time to everyone
            </p>
          </div>
          <Toggle
            checked={!!settings.enableManualTimeToEveryone}
            onChange={() => handleToggle('enableManualTimeToEveryone')}
          />
        </div>
      </section>

      {/* 6. Untracked (Internet-Interrupted) Hours Settings */}
      <section className="rounded-xl border border-gray-200/80 bg-white p-5 shadow-xs dark:border-gray-800 dark:bg-gray-900">
        <div className="mb-3">
          <h3 className="text-[15px] font-semibold text-gray-900 dark:text-white">
            Untracked (Internet-Interrupted) Hours Settings
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Exclude hours with internet interruptions in total work hours?
          </p>
        </div>

        <div className="space-y-2">
          <label className={`flex items-center gap-3 cursor-pointer rounded-lg border p-3 transition-colors ${
            (settings.untrackedHoursBehavior || 'exclude') === 'exclude'
              ? 'border-blue-500 bg-blue-50/25 dark:border-blue-500/50 dark:bg-blue-900/10'
              : 'border-gray-200/80 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/40'
          }`}>
            <input
              type="radio"
              name="untrackedHours"
              value="exclude"
              checked={(settings.untrackedHoursBehavior || 'exclude') === 'exclude'}
              onChange={() => handleChange('untrackedHoursBehavior', 'exclude')}
              className="h-3.5 w-3.5 text-blue-600 focus:ring-blue-500 border-gray-300"
            />
            <span className="text-xs font-medium text-gray-800 dark:text-gray-200">
              Yes - Exclude the untracked hours from total work time
            </span>
          </label>

          <label className={`flex items-center gap-3 cursor-pointer rounded-lg border p-3 transition-colors ${
            settings.untrackedHoursBehavior === 'include'
              ? 'border-blue-500 bg-blue-50/25 dark:border-blue-500/50 dark:bg-blue-900/10'
              : 'border-gray-200/80 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/40'
          }`}>
            <input
              type="radio"
              name="untrackedHours"
              value="include"
              checked={settings.untrackedHoursBehavior === 'include'}
              onChange={() => handleChange('untrackedHoursBehavior', 'include')}
              className="h-3.5 w-3.5 text-blue-600 focus:ring-blue-500 border-gray-300"
            />
            <span className="text-xs font-medium text-gray-800 dark:text-gray-200">
              No - Include the untracked hours to total work time
            </span>
          </label>
        </div>
      </section>

      {/* 7. Payroll Settings (Premium) */}
      <section className="rounded-xl border border-gray-200/80 bg-white p-5 shadow-xs dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-[15px] font-semibold text-gray-900 dark:text-white">Payroll Settings</h3>
              <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                Premium
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Enable Payroll Calculator
            </p>
          </div>
          <Toggle
            checked={!!settings.enablePayrollCalculator}
            onChange={() => handleToggle('enablePayrollCalculator')}
          />
        </div>
      </section>

      {/* 8. Keyboard & Mouse Activity Tracking (Premium) */}
      <section className="rounded-xl border border-gray-200/80 bg-white p-5 shadow-xs dark:border-gray-800 dark:bg-gray-900">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-[15px] font-semibold text-gray-900 dark:text-white">
              Keyboard &amp; Mouse Activity Tracking
            </h3>
            <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
              Premium
            </span>
            <a
              href="https://workfolio.tawk.help/article/keyboard-mouse-activity-tracking"
              target="_blank"
              rel="noreferrer"
              className="text-[11px] text-blue-600 hover:underline dark:text-blue-400 inline-flex items-center gap-0.5 ml-1"
            >
              (Learn more)
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-start justify-between rounded-lg border border-gray-150 bg-gray-50/50 p-3.5 dark:border-gray-800 dark:bg-gray-850/40">
            <div className="pr-3">
              <p className="text-xs font-medium text-gray-800 dark:text-gray-200">
                Enable Track Keypress Count on Windows
              </p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                Tracks how many keys a user presses during work hours.
              </p>
            </div>
            <Toggle
              checked={!!settings.enableTrackKeypressCountWindows}
              onChange={() => handleToggle('enableTrackKeypressCountWindows')}
            />
          </div>

          <div className="flex items-start justify-between rounded-lg border border-gray-150 bg-gray-50/50 p-3.5 dark:border-gray-800 dark:bg-gray-850/40">
            <div className="pr-3">
              <p className="text-xs font-medium text-gray-800 dark:text-gray-200">
                Enable Mouse Activity Tracking on Windows
              </p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                Tracks mouse clicks, scrolls, and movement to measure interaction.
              </p>
            </div>
            <Toggle
              checked={!!settings.enableMouseActivityTrackingWindows}
              onChange={() => handleToggle('enableMouseActivityTrackingWindows')}
            />
          </div>
        </div>
      </section>

      {/* 9. Email Report Settings */}
      <section className="rounded-xl border border-gray-200/80 bg-white p-5 shadow-xs dark:border-gray-800 dark:bg-gray-900">
        <div className="mb-3">
          <h3 className="text-[15px] font-semibold text-gray-900 dark:text-white">Email Report Settings</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Configure report recipient scope and exclusions.
          </p>
        </div>

        <div className="space-y-2">
          <label className={`flex items-center gap-3 cursor-pointer rounded-lg border p-3 transition-colors ${
            (settings.emailReportScope || 'all') === 'all'
              ? 'border-blue-500 bg-blue-50/25 dark:border-blue-500/50 dark:bg-blue-900/10'
              : 'border-gray-200/80 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/40'
          }`}>
            <input
              type="radio"
              name="emailReportScope"
              value="all"
              checked={(settings.emailReportScope || 'all') === 'all'}
              onChange={() => handleChange('emailReportScope', 'all')}
              className="h-3.5 w-3.5 text-blue-600 focus:ring-blue-500 border-gray-300"
            />
            <span className="text-xs font-medium text-gray-800 dark:text-gray-200">
              Show all users in report
            </span>
          </label>

          <label className={`flex items-center gap-3 cursor-pointer rounded-lg border p-3 transition-colors ${
            settings.emailReportScope === 'exclude_admin'
              ? 'border-blue-500 bg-blue-50/25 dark:border-blue-500/50 dark:bg-blue-900/10'
              : 'border-gray-200/80 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/40'
          }`}>
            <input
              type="radio"
              name="emailReportScope"
              value="exclude_admin"
              checked={settings.emailReportScope === 'exclude_admin'}
              onChange={() => handleChange('emailReportScope', 'exclude_admin')}
              className="h-3.5 w-3.5 text-blue-600 focus:ring-blue-500 border-gray-300"
            />
            <span className="text-xs font-medium text-gray-800 dark:text-gray-200">
              Exclude admin users in report
            </span>
          </label>

          <label className={`flex items-center gap-3 cursor-pointer rounded-lg border p-3 transition-colors ${
            settings.emailReportScope === 'exclude_admin_head'
              ? 'border-blue-500 bg-blue-50/25 dark:border-blue-500/50 dark:bg-blue-900/10'
              : 'border-gray-200/80 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/40'
          }`}>
            <input
              type="radio"
              name="emailReportScope"
              value="exclude_admin_head"
              checked={settings.emailReportScope === 'exclude_admin_head'}
              onChange={() => handleChange('emailReportScope', 'exclude_admin_head')}
              className="h-3.5 w-3.5 text-blue-600 focus:ring-blue-500 border-gray-300"
            />
            <span className="text-xs font-medium text-gray-800 dark:text-gray-200">
              Exclude admin &amp; head users in report
            </span>
          </label>
        </div>
      </section>

      {/* 10. Screenshot Settings */}
      <section className="rounded-xl border border-gray-200/80 bg-white p-5 shadow-xs dark:border-gray-800 dark:bg-gray-900">
        <div className="mb-4">
          <h3 className="text-[15px] font-semibold text-gray-900 dark:text-white">Screenshot Settings</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Configure screen capture frequency, privacy blurring, and video generation.
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between py-1">
            <div>
              <p className="text-xs font-medium text-gray-800 dark:text-gray-200">Enable screen capture</p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">Takes desktop snapshots at regular intervals</p>
            </div>
            <Toggle
              checked={!!settings.enableScreenCapture}
              onChange={() => handleToggle('enableScreenCapture')}
            />
          </div>

          <div className="flex items-center justify-between py-1">
            <div>
              <p className="text-xs font-medium text-gray-800 dark:text-gray-200">Blur screen capture</p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">Blurs sensitive content for privacy compliance</p>
            </div>
            <Toggle
              checked={!!settings.blurScreenCapture}
              onChange={() => handleToggle('blurScreenCapture')}
            />
          </div>

          <div className="flex items-center justify-between py-1">
            <div>
              <p className="text-xs font-medium text-gray-800 dark:text-gray-200">Screen capture interval</p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">How often desktop screenshots are captured</p>
            </div>
            <select
              value={settings.screenshotInterval || 'Every 10 mins'}
              onChange={(e) => handleChange('screenshotInterval', e.target.value)}
              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-800 shadow-xs focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
            >
              {SCREENSHOT_INTERVALS.map((intv) => (
                <option key={intv} value={intv}>
                  {intv}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-between py-1">
            <div>
              <p className="text-xs font-medium text-gray-800 dark:text-gray-200">Allow to generate timelapse video</p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">Assembles full-day work sessions into fast timelapse clips</p>
            </div>
            <Toggle
              checked={!!settings.allowTimelapseVideo}
              onChange={() => handleToggle('allowTimelapseVideo')}
            />
          </div>
        </div>
      </section>

      {/* 11. Idle Time Settings */}
      <section className="rounded-xl border border-gray-200/80 bg-white p-5 shadow-xs dark:border-gray-800 dark:bg-gray-900">
        <div className="mb-3">
          <h3 className="text-[15px] font-semibold text-gray-900 dark:text-white">Idle Time Settings</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Determine the inactivity threshold before time is classified as idle.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div>
            <p className="text-xs font-medium text-gray-800 dark:text-gray-200">
              Start to consider as idle if the employee is inactive for
            </p>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
              Absence of keyboard and mouse input triggers an idle state.
            </p>
          </div>
          <select
            value={settings.idleTimeout || '1 min'}
            onChange={(e) => handleChange('idleTimeout', e.target.value)}
            className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-800 shadow-xs focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
          >
            {IDLE_INTERVALS.map((i) => (
              <option key={i} value={i}>
                {i}
              </option>
            ))}
          </select>
        </div>
      </section>

      {/* 12. Permissions */}
      <section className="rounded-xl border border-gray-200/80 bg-white p-5 shadow-xs dark:border-gray-800 dark:bg-gray-900">
        <div className="mb-4">
          <h3 className="text-[15px] font-semibold text-gray-900 dark:text-white">Permissions</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Granular access controls for employees, team heads, and administrative data confidentiality.
          </p>
        </div>

        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {[
            {
              key: 'hideAdminTrackingAndLeaveFromHeads',
              title: "Hide the admin's tracking and leave data from the team head and leave approver view",
            },
            {
              key: 'allowEmployeeSeeScreenshot',
              title: 'Allow the employee to see their screen capture',
            },
            {
              key: 'allowEmployeeDeleteScreenshot',
              title: 'Allow the employee to delete their screen capture',
            },
            {
              key: 'allowHeadsDeleteExportScreenshot',
              title: "Allow heads to delete & export their team member's screenshot",
            },
            {
              key: 'allowEmployeeSeeTimesheet',
              title: 'Allow the employee to see their timesheet',
            },
            {
              key: 'allowEmployeeSeeTimelapse',
              title: 'Allow the employee to see their time-lapse video',
            },
            {
              key: 'allowHeadsReviewAppsSites',
              title: 'Allow heads to review apps & sites',
            },
            {
              key: 'allowEmployeeAccessWebsite',
              title: 'Allow the employee to access website',
            },
            {
              key: 'hideAdminDataFromAllPages',
              title: "Hide the admin's data from all pages",
            },
            {
              key: 'hideTeamHeadDataFromAllPages',
              title: "Hide the team head's data from all pages",
            },
            {
              key: 'hideEditTrackSettingsFromHeads',
              title: 'Hide edit track settings from team heads',
            },
          ].map((perm) => (
            <div key={perm.key} className="flex items-center justify-between py-3 first:pt-1 last:pb-1">
              <span className="text-xs text-gray-800 dark:text-gray-200 pr-4">{perm.title}</span>
              <Toggle
                checked={!!settings[perm.key]}
                onChange={() => handleToggle(perm.key)}
              />
            </div>
          ))}
        </div>
      </section>

      {/* 13. Holiday Settings (Premium) */}
      <section className="rounded-xl border border-gray-200/80 bg-white p-5 shadow-xs dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-[15px] font-semibold text-gray-900 dark:text-white">Holiday Settings</h3>
              <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                Premium
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Auto-send holiday notifications to employees
            </p>
          </div>
          <Toggle
            checked={!!settings.autoSendHolidayNotifications}
            onChange={() => handleToggle('autoSendHolidayNotifications')}
          />
        </div>
      </section>

      {/* 14. API Settings (Premium) */}
      <section className="rounded-xl border border-gray-200/80 bg-white p-5 shadow-xs dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-[15px] font-semibold text-gray-900 dark:text-white">API Settings</h3>
              <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                Premium
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Enable API Access
            </p>
          </div>
          <Toggle
            checked={!!settings.enableApiAccess}
            onChange={() => handleToggle('enableApiAccess')}
          />
        </div>
      </section>

      {/* 15. Real Time Alert Settings (Premium) */}
      <section className="rounded-xl border border-gray-200/80 bg-white p-5 shadow-xs dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-[15px] font-semibold text-gray-900 dark:text-white">
                Real Time Alert Settings
              </h3>
              <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                Premium
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Enable Real Time Alert
            </p>
          </div>
          <Toggle
            checked={!!settings.enableRealTimeAlert}
            onChange={() => handleToggle('enableRealTimeAlert')}
          />
        </div>
      </section>

      {/* Member Overrides Table ("Showing All Members") */}
      <section className="rounded-xl border border-gray-200/80 bg-white shadow-xs dark:border-gray-800 dark:bg-gray-900 overflow-hidden">
        <div className="p-5 border-b border-gray-100 dark:border-gray-800">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="text-[15px] font-semibold text-gray-900 dark:text-white">
                Showing All Members ({filteredMembers.length})
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Customize individual tracking intervals, permissions, and screenshot configurations.
              </p>
            </div>

            {/* Filter selectors */}
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-700 shadow-xs dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
              >
                <option value="All Roles">Role: All Roles</option>
                <option value="Admin">Role: Admin</option>
                <option value="Employee">Role: Employee</option>
              </select>

              <select
                value={teamFilter}
                onChange={(e) => setTeamFilter(e.target.value)}
                className="rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-700 shadow-xs dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
              >
                <option value="All Teams">Team: All Teams</option>
                <option value="Engineering">Team: Engineering</option>
                <option value="Design">Team: Design</option>
                <option value="Marketing">Team: Marketing</option>
              </select>

              <select
                value={osFilter}
                onChange={(e) => setOsFilter(e.target.value)}
                className="rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-700 shadow-xs dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
              >
                <option value="All OS">OS: All OS</option>
                <option value="macOS">OS: macOS</option>
                <option value="Windows">OS: Windows</option>
                <option value="Linux">OS: Linux</option>
              </select>

              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search member..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="rounded-lg border border-gray-200 bg-white pl-8 pr-3 py-1.5 text-xs text-gray-700 shadow-xs focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-800">
            <thead className="bg-gray-50/70 dark:bg-gray-800/40">
              <tr>
                <th
                  scope="col"
                  className="px-5 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider dark:text-gray-400"
                >
                  Account Details
                </th>
                <th
                  scope="col"
                  className="px-5 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider dark:text-gray-400"
                >
                  App Version
                </th>
                <th
                  scope="col"
                  className="px-5 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider dark:text-gray-400"
                >
                  Team
                </th>
                <th
                  scope="col"
                  className="px-5 py-3 text-right text-[11px] font-semibold text-gray-500 uppercase tracking-wider dark:text-gray-400"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white dark:divide-gray-800 dark:bg-gray-900">
              {filteredMembers.map((member) => {
                const initial = (member.full_name || member.email || 'M').charAt(0).toUpperCase()
                const hasCustomOverride = !!settings.memberOverrides?.[member.id]

                return (
                  <tr key={member.id} className="hover:bg-gray-50/60 dark:hover:bg-gray-800/40 transition-colors">
                    {/* Account Details */}
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600 border border-blue-100 font-semibold text-xs dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-300">
                          {initial}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-gray-900 dark:text-white">
                              {member.full_name || 'Member'}
                            </span>
                            {hasCustomOverride && (
                              <span className="rounded bg-purple-50 px-1.5 py-0.2 text-[10px] font-medium text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                                Custom Track
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-gray-500 dark:text-gray-400">{member.email}</div>
                          <button
                            type="button"
                            onClick={() => handleOpenMemberSettings(member)}
                            className="mt-0.5 text-[11px] font-medium text-blue-600 hover:text-blue-700 hover:underline dark:text-blue-400 inline-flex items-center gap-1"
                          >
                            <Sliders className="h-2.5 w-2.5" />
                            Edit Track Settings
                          </button>
                        </div>
                      </div>
                    </td>

                    {/* App Version */}
                    <td className="px-5 py-3.5 whitespace-nowrap text-xs text-gray-500 dark:text-gray-400">
                      {member.app_version || 'NA'}
                    </td>

                    {/* Team */}
                    <td className="px-5 py-3.5 whitespace-nowrap text-xs text-gray-500 dark:text-gray-400">
                      {member.team || 'NA'}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3.5 whitespace-nowrap text-right text-xs font-medium space-x-2.5">
                      <button
                        type="button"
                        onClick={() => handleOpenMemberSettings(member)}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Remove custom overrides for ${member.full_name || member.email}?`)) {
                            const updated = { ...(settings.memberOverrides || {}) }
                            delete updated[member.id]
                            setSettings({ ...settings, memberOverrides: updated })
                            setToastMessage('Track overrides removed')
                          }
                        }}
                        className="text-red-500 hover:text-red-700 dark:text-red-400"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className="p-3 text-center border-t border-gray-100 dark:border-gray-800 bg-gray-50/40 dark:bg-gray-800/20">
          <p className="text-[11px] text-gray-400 dark:text-gray-500">You have seen all the employees</p>
        </div>
      </section>

      {/* Member Edit Track Settings Modal */}
      {memberModalOpen && selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl dark:bg-gray-900 dark:border dark:border-gray-800 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 dark:border-gray-800">
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                  Edit Track Settings
                </h3>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  Custom rules for {selectedMember.full_name || selectedMember.email}
                </p>
              </div>
              <button
                onClick={() => setMemberModalOpen(false)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3.5 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-medium text-gray-800 dark:text-gray-200">
                    Enable Screen Capture
                  </span>
                  <p className="text-[11px] text-gray-400">Capture desktop snapshots</p>
                </div>
                <Toggle
                  checked={!!memberOverrideState.enableScreenCapture}
                  onChange={() =>
                    setMemberOverrideState({
                      ...memberOverrideState,
                      enableScreenCapture: !memberOverrideState.enableScreenCapture,
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-medium text-gray-800 dark:text-gray-200">
                    Blur Screen Capture
                  </span>
                  <p className="text-[11px] text-gray-400">Obfuscate text and images</p>
                </div>
                <Toggle
                  checked={!!memberOverrideState.blurScreenCapture}
                  onChange={() =>
                    setMemberOverrideState({
                      ...memberOverrideState,
                      blurScreenCapture: !memberOverrideState.blurScreenCapture,
                    })
                  }
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                  Screen capture interval
                </label>
                <select
                  value={memberOverrideState.screenshotInterval || 'Every 10 mins'}
                  onChange={(e) =>
                    setMemberOverrideState({
                      ...memberOverrideState,
                      screenshotInterval: e.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-800 shadow-xs focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                >
                  {SCREENSHOT_INTERVALS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                  Idle time threshold
                </label>
                <select
                  value={memberOverrideState.idleTimeout || '1 min'}
                  onChange={(e) =>
                    setMemberOverrideState({
                      ...memberOverrideState,
                      idleTimeout: e.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-800 shadow-xs focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                >
                  {IDLE_INTERVALS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-800 dark:text-gray-200">
                  Allow employee to see screenshots
                </span>
                <Toggle
                  checked={!!memberOverrideState.allowEmployeeSeeScreenshot}
                  onChange={() =>
                    setMemberOverrideState({
                      ...memberOverrideState,
                      allowEmployeeSeeScreenshot: !memberOverrideState.allowEmployeeSeeScreenshot,
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-800 dark:text-gray-200">
                  Allow employee to delete screenshots
                </span>
                <Toggle
                  checked={!!memberOverrideState.allowEmployeeDeleteScreenshot}
                  onChange={() =>
                    setMemberOverrideState({
                      ...memberOverrideState,
                      allowEmployeeDeleteScreenshot: !memberOverrideState.allowEmployeeDeleteScreenshot,
                    })
                  }
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-gray-100 pt-3 dark:border-gray-800">
              <button
                type="button"
                onClick={() => setMemberModalOpen(false)}
                className="rounded-lg px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveMemberOverride}
                className="rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
              >
                Apply Custom Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
