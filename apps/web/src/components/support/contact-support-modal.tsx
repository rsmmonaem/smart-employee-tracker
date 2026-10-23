'use strict'
'use client'

import React, { useState } from 'react'
import { X, MessageSquare, ExternalLink, Copy, Check, Mail, BookOpen, ShieldCheck, Headphones } from 'lucide-react'

interface ContactSupportModalProps {
  isOpen: boolean
  onClose: () => void
}

export function ContactSupportModal({ isOpen, onClose }: ContactSupportModalProps) {
  const [copied, setCopied] = useState(false)
  const whatsappHandle = '@rsmmonaemwp'
  const whatsappUrl = 'https://wa.me/message/rsmmonaemwp'

  if (!isOpen) return null

  const handleCopy = () => {
    navigator.clipboard.writeText(whatsappHandle)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-[#121824] border border-gray-200 dark:border-gray-800 shadow-2xl overflow-hidden text-gray-900 dark:text-gray-100 animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 dark:border-gray-800 bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20 shadow-xs">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <span>Official Technical Support</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                  Online
                </span>
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Direct developer assistance for deployment, licensing, and troubleshooting.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          {/* Primary Option: WhatsApp Direct */}
          <div className="p-4 rounded-xl border border-emerald-300/80 bg-emerald-50/50 dark:border-emerald-900/50 dark:bg-emerald-950/20 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">💬</span>
                <div>
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                    Direct WhatsApp Support
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Fastest channel • Real-time developer replies
                  </p>
                </div>
              </div>
              <span className="font-mono text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-white dark:bg-gray-900 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800">
                {whatsappHandle}
              </span>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors shadow-sm cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Chat on WhatsApp</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-70" />
              </a>

              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 text-xs font-semibold text-gray-700 dark:text-gray-300 transition-colors cursor-pointer"
                title="Copy WhatsApp username"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-500" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Secondary Option: Email Contact */}
          <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-900/40 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-500/20">
                <Mail className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-gray-900 dark:text-white">
                  Email Inquiries &amp; Enterprise
                </h4>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  info@tracmatrix.com
                </p>
              </div>
            </div>

            <a
              href="mailto:info@tracmatrix.com"
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Send Email &rarr;
            </a>
          </div>

          {/* Quick Help & Docs Reference */}
          <div className="pt-2 text-xs text-gray-500 dark:text-gray-400 flex items-center justify-between border-t border-gray-100 dark:border-gray-800">
            <span className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Verified Developer Support</span>
            </span>
            <span className="text-[11px] text-gray-400">
              Response time: ~15 mins
            </span>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
