'use client'

import React from 'react'
import {
  X,
  Printer,
  CheckCircle2,
  Building,
  Calendar,
  CreditCard,
  ShieldCheck,
  Download,
} from 'lucide-react'

export interface InvoiceItem {
  id: string
  trxId?: string
  tenantId?: string
  tenantName: string
  plan: string
  seats: number
  billingCycle: 'MONTHLY' | 'ANNUAL'
  amount: number
  currency: string
  status: string
  gateway: string
  paymentMethod: string
  date: string
}

interface InvoiceReceiptModalProps {
  invoice: InvoiceItem | null
  onClose: () => void
}

export default function InvoiceReceiptModal({ invoice, onClose }: InvoiceReceiptModalProps) {
  if (!invoice) return null

  const handlePrint = () => {
    window.print()
  }

  const isBDT = invoice.currency === 'BDT'
  const formattedAmount = isBDT
    ? `${invoice.amount.toLocaleString()} ৳`
    : `$${invoice.amount.toLocaleString()}`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Top Actions */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between bg-gray-50/70 dark:bg-gray-950/60 print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Tax Invoice & Payment Receipt
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5 text-blue-500" />
              <span>Print / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Body */}
        <div className="p-8 space-y-6 overflow-y-auto flex-1 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-xs font-sans">
          {/* Header */}
          <div className="flex items-start justify-between border-b border-gray-150 dark:border-gray-800 pb-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center font-extrabold text-white text-xl shadow-xs select-none">
                S.
              </div>
              <div>
                <h2 className="text-xl font-black tracking-tight text-gray-900 dark:text-white">
                  Smart Employee Tracker
                </h2>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  Global Employee Monitoring & Productivity SaaS
                </p>
              </div>
            </div>

            <div className="text-right">
              <div className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-400 px-2.5 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>PAID IN FULL</span>
              </div>
              <div className="text-[11px] font-mono text-gray-500 dark:text-gray-400 mt-1">
                {invoice.id}
              </div>
            </div>
          </div>

          {/* Bill To & Invoice Info */}
          <div className="grid grid-cols-2 gap-6 bg-gray-50 dark:bg-gray-950/40 p-4 rounded-xl border border-gray-150 dark:border-gray-800">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
                Billed To
              </span>
              <p className="font-bold text-sm text-gray-900 dark:text-white">
                {invoice.tenantName}
              </p>
              <p className="text-gray-500 dark:text-gray-400 text-[11px] mt-0.5">
                Smart Employee Tracker Organization Account
              </p>
            </div>

            <div className="text-right space-y-1">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Invoice Date:{' '}
                </span>
                <span className="font-semibold text-gray-800 dark:text-gray-200">
                  {invoice.date}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Transaction Ref:{' '}
                </span>
                <span className="font-mono text-[11px] text-blue-600 dark:text-blue-400">
                  {invoice.trxId || 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Settlement Gateway:{' '}
                </span>
                <span className="font-semibold text-gray-800 dark:text-gray-200">
                  {invoice.gateway}
                </span>
              </div>
            </div>
          </div>

          {/* Itemized Table */}
          <div className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-800 text-[11px] font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">
                  <th className="py-2.5 px-4">Description</th>
                  <th className="py-2.5 px-4 text-center">Cycle</th>
                  <th className="py-2.5 px-4 text-center">Seats</th>
                  <th className="py-2.5 px-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-150 dark:divide-gray-800 text-xs">
                <tr>
                  <td className="py-3 px-4">
                    <div className="font-bold text-gray-900 dark:text-white">
                      Smart Employee Tracker {invoice.plan} Subscription
                    </div>
                    <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                      Includes 1-min screenshot frequency, bulk screenshot deletion, 1-year retention.
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center font-medium">
                    {invoice.billingCycle}
                  </td>
                  <td className="py-3 px-4 text-center font-medium">
                    {invoice.seats}
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-gray-900 dark:text-white">
                    {formattedAmount}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-64 space-y-2 border-t border-gray-200 dark:border-gray-800 pt-3 text-xs">
              <div className="flex justify-between text-gray-500 dark:text-gray-400">
                <span>Subtotal</span>
                <span>{formattedAmount}</span>
              </div>
              <div className="flex justify-between text-gray-500 dark:text-gray-400">
                <span>Platform Tax / VAT (0%)</span>
                <span>{isBDT ? '0 ৳' : '$0.00'}</span>
              </div>
              <div className="flex justify-between font-extrabold text-sm text-gray-900 dark:text-white border-t border-gray-200 dark:border-gray-800 pt-2">
                <span>Total Paid</span>
                <span className="text-blue-600 dark:text-blue-400">{formattedAmount}</span>
              </div>
            </div>
          </div>

          {/* Payment Method Details */}
          <div className="p-3.5 bg-blue-50/50 dark:bg-blue-950/20 rounded-xl border border-blue-200 dark:border-blue-900/40 flex items-center gap-3">
            <CreditCard className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
            <div className="text-[11px]">
              <span className="font-bold text-gray-900 dark:text-gray-100">Paid via: </span>
              <span className="text-gray-600 dark:text-gray-300">{invoice.paymentMethod}</span>
            </div>
          </div>

          {/* Footer notice */}
          <p className="text-[10px] text-gray-400 text-center pt-2">
            This is an electronically generated receipt for Smart Employee Tracker subscription services.
          </p>
        </div>
      </div>
    </div>
  )
}
