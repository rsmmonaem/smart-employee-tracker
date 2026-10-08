'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Lock, Mail, Eye, EyeOff, Shield, ArrowRight, UserCheck } from 'lucide-react'

interface LoginFormProps {
  initialError?: string
  redirectTo?: string
}

export default function LoginForm({ initialError, redirectTo }: LoginFormProps) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errorMessage, setErrorMessage] = useState(initialError || '')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const setDemoCredentials = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail)
    setPassword(demoPass)
    setErrorMessage('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage('')
    setIsSubmitting(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      })

      const data = await res.json()

      if (!res.ok || data.error) {
        setErrorMessage(data.error || 'Invalid email or password')
        setIsSubmitting(false)
        return
      }

      const target = (redirectTo && redirectTo.startsWith('/') && !redirectTo.startsWith('//'))
        ? redirectTo
        : (data.redirectTo || '/admin/dashboard')

      window.location.href = target
    } catch (err: any) {
      setErrorMessage(err?.message || 'An unexpected error occurred. Please try again.')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-start gap-2.5">
          <span className="w-2 h-2 rounded-full bg-red-500 mt-1 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Demo Credentials Quick Switcher */}
      <div className="bg-slate-900/60 dark:bg-slate-900/80 rounded-xl p-3 border border-slate-800 space-y-2">
        <div className="flex items-center justify-between text-[11px] font-semibold text-gray-400">
          <span className="flex items-center gap-1.5 text-blue-400">
            <UserCheck className="w-3.5 h-3.5" />
            Explore Live Demo
          </span>
          <span className="text-[10px] text-gray-500">Click to autofill</span>
        </div>

        <button
          type="button"
          onClick={() => setDemoCredentials('admin@example.com', 'password123')}
          className="w-full flex items-center justify-between p-2.5 rounded-lg bg-slate-800/80 hover:bg-slate-750 border border-slate-700/70 hover:border-blue-500/50 transition-all text-left group"
        >
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <div>
              <span className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors block leading-tight">
                Live Admin Demo Account
              </span>
              <span className="text-[10px] font-mono text-gray-400">admin@example.com</span>
            </div>
          </div>
          <span className="text-[11px] font-semibold text-blue-400 font-mono px-2 py-0.5 rounded bg-blue-950/60 border border-blue-800/40">
            password123
          </span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
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

        <div className="text-center pt-2">
          <span className="text-xs text-gray-400">
            Company Owner?{' '}
            <a href="/register" className="text-blue-400 hover:underline font-semibold">
              Sign Up / Start Free Trial
            </a>
          </span>
        </div>
      </form>
    </div>
  )
}
