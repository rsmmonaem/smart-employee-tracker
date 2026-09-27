import React from 'react'
import Link from 'next/link'
import { Shield, Sparkles, ArrowLeft } from 'lucide-react'
import LoginForm from './login-form'

export default function LoginPage({
  searchParams,
}: {
  searchParams?: { error?: string; message?: string; redirectTo?: string }
}) {
  const initialError = searchParams?.error || searchParams?.message

  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center bg-slate-950 px-4 sm:px-6 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top back button */}
      <div className="absolute top-6 left-6 z-20">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-gray-400 hover:text-white transition-colors bg-slate-900/60 hover:bg-slate-800/80 px-3.5 py-2 rounded-xl border border-slate-800"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </Link>
      </div>

      <div className="w-full max-w-md space-y-7 relative z-10">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 shadow-lg shadow-blue-500/25 mx-auto mb-2">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            Smart Employee Tracker
          </h1>
          <p className="text-xs text-gray-400">
            Sign in to access your tracking dashboards and reports
          </p>
        </div>

        {/* Card */}
        <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-black/60">
          <LoginForm initialError={initialError} redirectTo={searchParams?.redirectTo} />
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-500">
          Secured by Smart Employee Tracker Identity &bull; 256-Bit SSL Encryption
        </p>
      </div>
    </div>
  )
}
