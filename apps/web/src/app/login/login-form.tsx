'use client'

import React, { useState } from 'react'
import { login } from './actions'
import { Lock, Mail, Eye, EyeOff, Shield, ShieldCheck, ArrowRight, UserCheck } from 'lucide-react'

interface LoginFormProps {
  initialError?: string
  redirectTo?: string
}

export default function LoginForm({ initialError, redirectTo }: LoginFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const setDemoCredentials = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail)
    setPassword(demoPass)
  }

  return (
    <div className="space-y-6">
      {initialError && (
        <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-start gap-2.5">
          <span className="w-2 h-2 rounded-full bg-red-500 mt-1 shrink-0" />
          <span>{initialError}</span>
        </div>
      )}

      {/* Demo Credentials Quick Switcher */}
      <div className="bg-slate-900/60 dark:bg-slate-900/80 rounded-xl p-3 border border-slate-800 space-y-2">
        <div className="flex items-center justify-between text-[11px] font-semibold text-gray-400">
          <span className="flex items-center gap-1.5 text-blue-400">
            <UserCheck className="w-3.5 h-3.5" />
            Quick Demo Autofill
          </span>
          <span className="text-[10px] text-gray-500">Click to fill</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setDemoCredentials('admin@example.com', 'password123')}
            className="flex flex-col items-start p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 hover:border-blue-500/50 transition-all text-left group"
          >
            <span className="text-[11px] font-bold text-white group-hover:text-blue-400 transition-colors flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Tenant Admin
            </span>
            <span className="text-[10px] font-mono text-gray-400 truncate w-full">admin@example.com</span>
          </button>

          <button
            type="button"
            onClick={() => setDemoCredentials('superadmin@example.com', 'password123')}
            className="flex flex-col items-start p-2 rounded-lg bg-indigo-950/40 hover:bg-indigo-900/40 border border-indigo-800/50 hover:border-indigo-500/50 transition-all text-left group"
          >
            <span className="text-[11px] font-bold text-indigo-300 group-hover:text-indigo-200 transition-colors flex items-center gap-1">
              <Shield className="w-2.5 h-2.5 text-indigo-400" />
              Super Admin
            </span>
            <span className="text-[10px] font-mono text-indigo-300/70 truncate w-full">superadmin@example.com</span>
          </button>
        </div>
      </div>

      <form
        action={login}
        onSubmit={() => setIsSubmitting(true)}
        className="space-y-4"
      >
        <input type="hidden" name="redirectTo" value={redirectTo || ''} />

        <div>
          <label className="block text-xs font-semibold text-gray-300 mb-1.5">
            Email Address
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
              <Mail className="h-4 w-4 text-gray-500" />
            </div>
            <input
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="block w-full rounded-xl bg-slate-900/80 border border-slate-700/80 py-2.5 pl-10 pr-3 text-sm text-white placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold text-gray-300">
              Password
            </label>
            <span className="text-[11px] text-gray-500 font-mono">Demo: password123</span>
          </div>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
              <Lock className="h-4 w-4 text-gray-500" />
            </div>
            <input
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="block w-full rounded-xl bg-slate-900/80 border border-slate-700/80 py-2.5 pl-10 pr-10 text-sm text-white placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-gray-400 hover:text-gray-200"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-60 shadow-lg shadow-blue-600/20 hover:shadow-blue-600/30 transition-all active:scale-[0.99] cursor-pointer"
        >
          {isSubmitting ? (
            <span>Authenticating...</span>
          ) : (
            <>
              <span>Sign In to Smart Employee Tracker</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      </form>
    </div>
  )
}
