'use client'

import React, { useState } from 'react'
import {
  X,
  Sparkles,
  Clock,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Zap,
  Coffee,
  AlertCircle,
  TrendingUp,
  User,
  Award,
  ChevronRight,
  Briefcase,
  HelpCircle,
  FileText,
} from 'lucide-react'
import type { MonthlyEmployeeRecord } from '@/app/api/admin/reports/monthly-attendance'

interface EmployeeAiDossierModalProps {
  employee: MonthlyEmployeeRecord | null
  monthName: string
  onClose: () => void
}

export default function EmployeeAiDossierModal({
  employee,
  monthName,
  onClose,
}: EmployeeAiDossierModalProps) {
  const [activeTab, setActiveTab] = useState<'ai-dossier' | 'daily-history'>('ai-dossier')

  if (!employee) return null

  const {
    name,
    email,
    avatar,
    team,
    role,
    daysPresent,
    daysLate,
    daysAbsent,
    daysLeave,
    totalWorkingDays,
    attendanceRate,
    punctualityRate,
    avgClockIn,
    avgClockOut,
    avgDailyWork,
    avgDailyBreak,
    diligenceScore,
    slackingRiskLevel,
    aiArchetype,
    aiHabitReport,
    dailyLogs,
  } = employee

  // Grade badge helper
  const getGrade = (score: number) => {
    if (score >= 90) return { grade: 'A+', label: 'Exemplary', color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' }
    if (score >= 80) return { grade: 'A', label: 'Great', color: 'text-blue-500 bg-blue-500/10 border-blue-500/20' }
    if (score >= 70) return { grade: 'B', label: 'Good', color: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20' }
    if (score >= 60) return { grade: 'C', label: 'Needs Attention', color: 'text-amber-500 bg-amber-500/10 border-amber-500/20' }
    return { grade: 'D', label: 'High Slacking Risk', color: 'text-rose-500 bg-rose-500/10 border-rose-500/20' }
  }

  const gradeInfo = getGrade(diligenceScore)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-5xl max-h-[92vh] flex flex-col rounded-2xl bg-white dark:bg-[#121824] border border-gray-200 dark:border-gray-800 shadow-2xl overflow-hidden text-gray-900 dark:text-gray-100"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Top Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
          <div className="flex items-center gap-4">
            <div className="w-13 h-13 rounded-full bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 font-bold text-xl flex items-center justify-center border border-indigo-500/20 ring-4 ring-indigo-500/5">
              {avatar}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
                  {name}
                </h2>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
                  {team}
                </span>
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${gradeInfo.color}`}>
                  Grade {gradeInfo.grade} • {gradeInfo.label}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-2">
                <span>{email}</span>
                <span>•</span>
                <span>{role}</span>
                <span>•</span>
                <span className="text-indigo-600 dark:text-indigo-400 font-medium">{monthName} AI Dossier</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-[#121824]">
          <button
            onClick={() => setActiveTab('ai-dossier')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-t-lg border-b-2 transition-colors ${
              activeTab === 'ai-dossier'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-indigo-50/40 dark:bg-indigo-950/20'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Behavioral Dossier &amp; Work Habits</span>
          </button>
          <button
            onClick={() => setActiveTab('daily-history')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-t-lg border-b-2 transition-colors ${
              activeTab === 'daily-history'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-indigo-50/40 dark:bg-indigo-950/20'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Monthly Attendance History ({dailyLogs.length} Days)</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'ai-dossier' && (
            <>
              {/* AI Persona Spotlight Card */}
              <div className="relative overflow-hidden rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-transparent p-6 dark:from-indigo-950/30 dark:via-purple-950/20 dark:to-transparent">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl">{aiArchetype.icon}</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${aiArchetype.badgeColor}`}>
                        {aiArchetype.titleEn}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 font-medium max-w-2xl">
                      {aiArchetype.tagline}
                    </p>
                  </div>

                  {/* Slacking Risk Indicator */}
                  <div className="flex md:flex-col items-center md:items-end justify-between gap-2 p-3 rounded-xl bg-white/80 dark:bg-gray-900/80 border border-gray-200 dark:border-gray-800 shrink-0">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      Slacking Risk Level
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold border ${
                        slackingRiskLevel === 'LOW'
                          ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                          : slackingRiskLevel === 'MODERATE'
                          ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                          : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                      }`}
                    >
                      {slackingRiskLevel === 'LOW' && '🛡️ Low Risk (Honest & Active)'}
                      {slackingRiskLevel === 'MODERATE' && '⚠️ Moderate Risk (Supervision Recommended)'}
                      {slackingRiskLevel === 'HIGH' && '🛑 High Risk (Slacking Detected)'}
                    </span>
                  </div>
                </div>
              </div>

              {/* 4 Quick Average KPI Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Avg Clock In */}
                <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-900/50 space-y-1">
                  <div className="flex items-center justify-between text-xs font-medium text-gray-500 dark:text-gray-400">
                    <span>Average Clock In</span>
                    <Clock className="w-4 h-4 text-indigo-500" />
                  </div>
                  <div className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
                    {avgClockIn}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Shift: 10:00 AM • {punctualityRate}% Punctual
                  </div>
                </div>

                {/* Avg Clock Out */}
                <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-900/50 space-y-1">
                  <div className="flex items-center justify-between text-xs font-medium text-gray-500 dark:text-gray-400">
                    <span>Average Clock Out</span>
                    <Clock className="w-4 h-4 text-blue-500" />
                  </div>
                  <div className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
                    {avgClockOut}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Shift End: 07:00 PM
                  </div>
                </div>

                {/* Avg Daily Work */}
                <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-900/50 space-y-1">
                  <div className="flex items-center justify-between text-xs font-medium text-gray-500 dark:text-gray-400">
                    <span>Daily Productive Time</span>
                    <Briefcase className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div className="text-xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
                    {avgDailyWork}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Days Active: {daysPresent}/{totalWorkingDays} days
                  </div>
                </div>

                {/* Avg Daily Break */}
                <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-900/50 space-y-1">
                  <div className="flex items-center justify-between text-xs font-medium text-gray-500 dark:text-gray-400">
                    <span>Average Daily Break</span>
                    <Coffee className="w-4 h-4 text-amber-500" />
                  </div>
                  <div className="text-xl font-bold tracking-tight text-amber-600 dark:text-amber-400">
                    {avgDailyBreak}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Allowed Limit: ≤ 60 min
                  </div>
                </div>
              </div>

              {/* Comprehensive 4-Part AI Behavioral Habit Narrative */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-500" />
                  <span>Comprehensive Workplace Behavioral Analysis</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Part 1: Arrival & Punctuality */}
                  <div className="p-5 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#151c2c] space-y-2.5">
                    <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-sm">
                      <Clock className="w-4 h-4" />
                      <span>1. Arrival &amp; Punctuality Habits</span>
                    </div>
                    <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                      {aiHabitReport.arrivalHabit}
                    </p>
                    <div className="flex items-center gap-3 pt-2 text-xs text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-gray-800">
                      <span>Present: <strong className="text-gray-900 dark:text-white">{daysPresent} Days</strong></span>
                      <span>•</span>
                      <span>Late: <strong className="text-amber-600 dark:text-amber-400">{daysLate} Days</strong></span>
                      <span>•</span>
                      <span>Absent: <strong className="text-rose-600 dark:text-rose-400">{daysAbsent} Days</strong></span>
                      {daysLeave > 0 && (
                        <>
                          <span>•</span>
                          <span>Leave: <strong className="text-blue-500">{daysLeave} Days</strong></span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Part 2: Slacking & Diligence */}
                  <div className="p-5 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#151c2c] space-y-2.5">
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                      <ShieldCheck className="w-4 h-4" />
                      <span>2. Diligence &amp; Slacking Risk Assessment</span>
                    </div>
                    <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                      {aiHabitReport.slackingAnalysis}
                    </p>
                    <div className="flex items-center gap-3 pt-2 text-xs text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-gray-800">
                      <span>Diligence Score: <strong className="text-indigo-600 dark:text-indigo-400">{diligenceScore}/100</strong></span>
                      <span>•</span>
                      <span>Avg Break: <strong className="text-gray-900 dark:text-white">{avgDailyBreak}</strong></span>
                    </div>
                  </div>

                  {/* Part 3: Work Consistency */}
                  <div className="p-5 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#151c2c] space-y-2.5">
                    <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-sm">
                      <TrendingUp className="w-4 h-4" />
                      <span>3. Work Consistency &amp; Shift Discipline</span>
                    </div>
                    <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                      {aiHabitReport.workConsistency}
                    </p>
                    <div className="flex items-center gap-3 pt-2 text-xs text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-gray-800">
                      <span>Avg Work Hours: <strong className="text-gray-900 dark:text-white">{avgDailyWork}</strong></span>
                      <span>•</span>
                      <span>Avg Logout: <strong className="text-gray-900 dark:text-white">{avgClockOut}</strong></span>
                    </div>
                  </div>

                  {/* Part 4: Manager Recommendation */}
                  <div className="p-5 rounded-2xl border border-indigo-200 dark:border-indigo-900/50 bg-indigo-50/50 dark:bg-indigo-950/20 space-y-2.5">
                    <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300 font-bold text-sm">
                      <Award className="w-4 h-4" />
                      <span>4. Manager Guidance &amp; Action Plan</span>
                    </div>
                    <p className="text-sm leading-relaxed text-indigo-950 dark:text-indigo-200 font-medium">
                      {aiHabitReport.managerRecommendation}
                    </p>
                    <div className="flex items-center gap-2 pt-2 text-xs text-indigo-600 dark:text-indigo-400 border-t border-indigo-200/50 dark:border-indigo-900/30">
                      <span>Automated Workforce Intelligence Analysis</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'daily-history' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  {monthName} — Daily Attendance Breakdown
                </h3>
                <div className="flex items-center gap-2 text-xs">
                  <span className="flex items-center gap-1 text-emerald-600 font-medium">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Present ({daysPresent - daysLate})
                  </span>
                  <span className="flex items-center gap-1 text-amber-600 font-medium">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    Late ({daysLate})
                  </span>
                  <span className="flex items-center gap-1 text-rose-600 font-medium">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    Absent ({daysAbsent})
                  </span>
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                <div className="overflow-x-auto max-h-[500px]">
                  <table className="w-full text-left text-sm">
                    <thead className="sticky top-0 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      <tr>
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4">Day</th>
                        <th className="py-3 px-4">Clock In</th>
                        <th className="py-3 px-4">Clock Out</th>
                        <th className="py-3 px-4">Work Duration</th>
                        <th className="py-3 px-4">Break Duration</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-[#121824]">
                      {dailyLogs.map((log) => {
                        const isLate = log.status === 'LATE'
                        const isPresent = log.status === 'PRESENT'
                        const isAbsent = log.status === 'ABSENT'
                        const isWeekend = log.status === 'WEEKEND'
                        const isHoliday = log.status === 'HOLIDAY'
                        const isLeave = log.status === 'ON_LEAVE'

                        return (
                          <tr
                            key={log.date}
                            className={`hover:bg-gray-50/50 dark:hover:bg-gray-800/40 transition-colors ${
                              isWeekend || isHoliday ? 'bg-gray-50/30 dark:bg-gray-900/20 text-gray-400' : ''
                            }`}
                          >
                            <td className="py-3 px-4 font-mono font-medium text-xs text-gray-900 dark:text-gray-200">
                              {log.date}
                            </td>
                            <td className="py-3 px-4 font-medium text-xs text-gray-500 dark:text-gray-400">
                              {log.dayName}
                            </td>
                            <td className="py-3 px-4 font-mono text-xs">
                              {log.clockIn !== '-' ? (
                                <span className={isLate ? 'text-amber-600 dark:text-amber-400 font-bold' : 'text-gray-900 dark:text-gray-100 font-semibold'}>
                                  {log.clockIn}
                                </span>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                            <td className="py-3 px-4 font-mono text-xs text-gray-600 dark:text-gray-300">
                              {log.clockOut}
                            </td>
                            <td className="py-3 px-4 font-mono text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                              {log.workDuration !== '00h 00m' ? log.workDuration : '-'}
                            </td>
                            <td className="py-3 px-4 font-mono text-xs text-amber-600 dark:text-amber-400">
                              {log.breakDuration !== '00h 00m' ? log.breakDuration : '-'}
                            </td>
                            <td className="py-3 px-4">
                              {isPresent && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                  PRESENT
                                </span>
                              )}
                              {isLate && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                  LATE
                                </span>
                              )}
                              {isAbsent && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                                  ABSENT
                                </span>
                              )}
                              {isLeave && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                                  LEAVE
                                </span>
                              )}
                              {isHoliday && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                                  HOLIDAY
                                </span>
                              )}
                              {isWeekend && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
                                  WEEKEND
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-xs text-gray-500 dark:text-gray-400">
                              {log.notes}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
          <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            <span>Workforce Intelligence Dossier • Verified Attendance &amp; Shift Analytics</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-sm cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
