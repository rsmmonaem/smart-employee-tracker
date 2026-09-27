'use client'

import React from 'react'
import { AlertTriangle } from 'lucide-react'
import AdminHeader from '../admin-header'

export default function RiskUsersPage() {
  return (
    <div className="min-h-full bg-white dark:bg-gray-900 pb-16">
      <AdminHeader
        title="Risk Users"
        subtitle="Employees exhibiting prolonged idle time or anomalous attendance behavior"
        searchPlaceholder="Search in risk users"
      />

      <div className="p-8 space-y-6 max-w-7xl mx-auto w-full">
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800 overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">Active Alerts</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Employees exhibiting prolonged idle time or anomalous attendance behavior.
            </p>
          </div>

          <div className="flex flex-col items-center justify-center p-12 text-center">
            <div className="rounded-full bg-red-50 p-3 dark:bg-red-900/20 mb-4">
              <AlertTriangle className="w-8 h-8 text-red-500 dark:text-red-400" />
            </div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">No active alerts</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              All team members are operating within healthy parameters.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
