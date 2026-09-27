'use client'

import React, { useState, useEffect } from 'react'
import {
  CreditCard,
  DollarSign,
  TrendingUp,
  Download,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Building2,
  Calendar,
  Zap,
  Settings,
  FileText,
} from 'lucide-react'
import GatewayConfigModal, { GatewayItem } from './gateway-config-modal'
import InvoiceReceiptModal, { InvoiceItem } from '../../admin/billing/invoice-receipt-modal'

interface TransactionItem {
  id: string
  tenantId: string
  tenantName: string
  plan: string
  seats: number
  billingCycle: 'MONTHLY' | 'ANNUAL'
  amount: number
  currency: string
  status: string
  paymentMethod: string
  date: string
}

interface BillingData {
  totalMRR: number
  totalARR: number
  paidTenantsCount: number
  arpu: number
  churnRate: string
  gateways: Array<{
    name: string
    portal?: string
    url?: string
    currency?: string
    status: string
    mode: string
    primary: boolean
  }>
  transactions: TransactionItem[]
}

export default function SuperAdminBillingPage() {
  const [billing, setBilling] = useState<BillingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [configuringGateway, setConfiguringGateway] = useState<GatewayItem | null>(null)
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceItem | null>(null)

  const fetchBilling = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/superadmin/billing')
      const json = await res.json()
      if (json.success) {
        setBilling(json.billing)
      }
    } catch (err) {
      console.error('Failed to load billing metrics:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBilling()
  }, [])

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-blue-500" />
            <span>Billing, Subscriptions & Revenue</span>
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Realtime invoice records, subscription renewals, and payment gateway status.
          </p>
        </div>

        <button
          onClick={fetchBilling}
          disabled={loading}
          className="p-2 rounded-xl bg-gray-900 border border-gray-800 text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
          title="Refresh billing data"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 shadow-sm">
          <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">
            Monthly Recurring Revenue (MRR)
          </p>
          <h3 className="text-3xl font-extrabold text-white mt-2">
            ${billing ? billing.totalMRR.toLocaleString() : '---'}
          </h3>
          <div className="mt-2 text-xs text-emerald-400 font-semibold flex items-center">
            <TrendingUp className="w-3.5 h-3.5 mr-1" />
            Active recurring revenue
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 shadow-sm">
          <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">
            Annual Run Rate (ARR)
          </p>
          <h3 className="text-3xl font-extrabold text-white mt-2">
            ${billing ? billing.totalARR.toLocaleString() : '---'}
          </h3>
          <div className="mt-2 text-xs text-blue-400 font-semibold">
            Based on current subscriber run-rate
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 shadow-sm">
          <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">
            Average Revenue / Account (ARPU)
          </p>
          <h3 className="text-3xl font-extrabold text-white mt-2">
            ${billing ? billing.arpu.toLocaleString() : '---'}
          </h3>
          <div className="mt-2 text-xs text-gray-400">
            Across {billing?.paidTenantsCount || 0} paying tenants
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 shadow-sm">
          <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">
            Subscription Churn Rate
          </p>
          <h3 className="text-3xl font-extrabold text-white mt-2">
            {billing ? billing.churnRate : '---'}
          </h3>
          <div className="mt-2 text-xs text-emerald-400 font-semibold">
            Top tier industry retention
          </div>
        </div>
      </div>

      {/* Gateway status */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <span>Payment Gateway Integrations</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {billing?.gateways.map((gw) => (
            <div
              key={gw.name}
              className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                gw.name === 'BKASH'
                  ? 'bg-pink-950/20 border-pink-900/40 hover:border-pink-800'
                  : gw.name === 'merchant.eps.com.bd'
                  ? 'bg-indigo-950/20 border-indigo-900/40 hover:border-indigo-800'
                  : 'bg-gray-950 border-gray-800'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-bold text-sm ${
                        gw.name === 'BKASH'
                          ? 'text-pink-400'
                          : gw.name === 'merchant.eps.com.bd'
                          ? 'text-indigo-400 font-mono'
                          : 'text-white'
                      }`}
                    >
                      {gw.name}
                    </span>
                    {gw.primary && (
                      <span className="text-[10px] font-bold uppercase px-2 py-0.2 rounded-full bg-pink-950 text-pink-300 border border-pink-800">
                        Primary
                      </span>
                    )}
                  </div>

                  <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-950/40 px-2.5 py-0.5 rounded-md border border-emerald-800/50">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{gw.status}</span>
                  </span>
                </div>

                <div className="text-[11px] text-gray-400 mt-1">{gw.portal}</div>
                {gw.url && (
                  <a
                    href={gw.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-1 mt-1 font-mono"
                  >
                    <span>{gw.url}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              <div className="mt-3 pt-2.5 border-t border-gray-800/60 flex items-center justify-between text-[11px] text-gray-400">
                <span>Mode: <strong className="text-gray-200">{gw.mode}</strong></span>
                <span>Settlement: <strong className="text-gray-200">{gw.currency}</strong></span>
              </div>

              <button
                type="button"
                onClick={() => setConfiguringGateway(gw)}
                className="w-full mt-3 py-1.5 px-3 rounded-xl text-xs font-semibold bg-gray-900 hover:bg-gray-800 text-gray-200 border border-gray-750 flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
              >
                <Settings className="w-3.5 h-3.5 text-blue-400" />
                <span>Configure & Test Credentials</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Invoices and Transactions */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-gray-800 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white">Subscription Invoices</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Automated billing receipts issued to active tenants via BKASH, EPS, and Stripe.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-800 text-gray-400 font-semibold uppercase tracking-wider text-[11px] bg-gray-950/40">
                <th className="py-3.5 px-6">Invoice #</th>
                <th className="py-3.5 px-4">Organization</th>
                <th className="py-3.5 px-4">Plan & Seats</th>
                <th className="py-3.5 px-4">Cycle</th>
                <th className="py-3.5 px-4">Amount</th>
                <th className="py-3.5 px-4">Payment Method</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-center">Date</th>
                <th className="py-3.5 px-6 text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-gray-500">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto text-blue-500 mb-2" />
                    <span>Loading invoice records...</span>
                  </td>
                </tr>
              ) : billing?.transactions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-gray-400">
                    No billing records found.
                  </td>
                </tr>
              ) : (
                billing?.transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-gray-850/40 transition-colors">
                    <td className="py-3.5 px-6 font-mono font-bold text-blue-400">
                      {tx.id}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-white">
                      {tx.tenantName}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-gray-200">{tx.plan}</span>
                      <span className="text-gray-500 ml-1">({tx.seats} seats)</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-gray-800 text-gray-300">
                        {tx.billingCycle}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-white text-sm">
                      {tx.currency === 'BDT'
                        ? `${tx.amount.toLocaleString()} ৳`
                        : `$${tx.amount.toLocaleString()}`}
                    </td>
                    <td className="py-3.5 px-4 text-gray-300 font-mono text-[11px]">
                      {tx.paymentMethod}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        {tx.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono text-gray-400 text-[11px]">
                      {tx.date}
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      <button
                        onClick={() =>
                          setSelectedInvoice({
                            id: tx.id,
                            tenantName: tx.tenantName,
                            plan: tx.plan,
                            seats: tx.seats,
                            billingCycle: tx.billingCycle,
                            amount: tx.amount,
                            currency: tx.currency,
                            status: tx.status,
                            gateway: tx.paymentMethod.includes('bKash')
                              ? 'BKASH'
                              : tx.paymentMethod.includes('eps')
                              ? 'EPS'
                              : 'STRIPE',
                            paymentMethod: tx.paymentMethod,
                            date: tx.date,
                          })
                        }
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-blue-400 hover:text-blue-300 bg-blue-950/40 hover:bg-blue-900/40 border border-blue-800/40 transition-colors"
                      >
                        <FileText className="w-3 h-3" />
                        <span>Receipt</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Gateway Configuration & Test Modal */}
      <GatewayConfigModal
        gateway={configuringGateway}
        onClose={() => setConfiguringGateway(null)}
        onSaved={fetchBilling}
      />

      {/* Invoice Receipt Modal */}
      {selectedInvoice && (
        <InvoiceReceiptModal
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
        />
      )}
    </div>
  )
}
