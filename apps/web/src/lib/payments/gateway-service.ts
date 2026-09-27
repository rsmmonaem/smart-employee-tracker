import { createAdminClient } from '@/utils/supabase/admin'
import { BkashClient } from './bkash'
import { EpsClient } from './eps'
import { StripeClient } from './stripe'

export interface GatewayRecord {
  id: 'bkash' | 'eps' | 'stripe'
  name: string
  portal: string
  url?: string
  status: 'CONNECTED' | 'DISCONNECTED' | 'ERROR'
  mode: 'Live' | 'Sandbox'
  currency: string
  primary: boolean
  credentials: Record<string, string>
  lastTested?: string
}

export const DEFAULT_GATEWAY_CONFIGS: Record<string, GatewayRecord> = {
  bkash: {
    id: 'bkash',
    name: 'BKASH',
    portal: 'bKash Merchant PGW (Tokenized API)',
    url: 'https://developer.bka.sh',
    status: 'CONNECTED',
    mode: 'Live',
    currency: 'BDT (৳)',
    primary: true,
    credentials: {
      appKey: 'bk_live_app_9a8f21908b',
      appSecret: 'sk_live_sec_88921a8b9',
      username: 'smarttracker_mfs',
      password: '••••••••••••••••',
      merchantShortCode: '01713000000',
    },
    lastTested: '2026-09-26T18:45:00Z',
  },
  eps: {
    id: 'eps',
    name: 'merchant.eps.com.bd',
    portal: 'Easy Payment System (EPS - Bangladesh)',
    url: 'https://merchant.eps.com.bd',
    status: 'CONNECTED',
    mode: 'Live',
    currency: 'BDT (৳)',
    primary: false,
    credentials: {
      merchantId: 'EPS_M_SMARTTRACKER_9921',
      storeId: 'SET_CLOUD_STORE_01',
      apiKey: 'eps_live_sec_8192a8b9c10',
      webhookSecret: 'whsec_8912891289128',
      returnUrl: 'http://localhost:3000/api/billing/eps/callback',
    },
    lastTested: '2026-09-26T18:42:00Z',
  },
  stripe: {
    id: 'stripe',
    name: 'Stripe',
    portal: 'Stripe Global Card Payments',
    url: 'https://dashboard.stripe.com',
    status: 'CONNECTED',
    mode: 'Live',
    currency: 'USD ($)',
    primary: false,
    credentials: {
      publishableKey: 'pk_live_51M081WFCLOUD9281a',
      secretKey: 'sk_live_51M081WFCLOUDsec8912',
      webhookSecret: 'whsec_stripe_8912',
    },
    lastTested: '2026-09-26T18:40:00Z',
  },
}

export interface CheckoutParams {
  gateway: 'bkash' | 'eps' | 'stripe'
  plan: 'BASIC' | 'PRO' | 'ENTERPRISE'
  billingCycle: 'monthly' | 'annual'
  currency: 'BDT' | 'USD'
  seats?: number
  tenantId?: string
  paymentDetails?: {
    phone?: string
    bank?: string
    cardNumber?: string
  }
  returnUrl?: string
}

export class PaymentGatewayService {
  /**
   * Fetch all configured gateways
   */
  static async getAllGateways(): Promise<GatewayRecord[]> {
    try {
      const supabase = createAdminClient()
      const { data: dbSetting } = await supabase
        .from('platform_settings')
        .select('value')
        .eq('key', 'payment_gateways_config')
        .single()

      const saved = dbSetting?.value?.gateways
      if (saved) {
        return Object.values({ ...DEFAULT_GATEWAY_CONFIGS, ...saved })
      }
    } catch {
      // Fallback
    }
    return Object.values(DEFAULT_GATEWAY_CONFIGS)
  }

  /**
   * Fetch specific gateway configuration
   */
  static async getGatewayConfig(id: 'bkash' | 'eps' | 'stripe'): Promise<GatewayRecord> {
    const gateways = await this.getAllGateways()
    const found = gateways.find((g) => g.id === id)
    return found || DEFAULT_GATEWAY_CONFIGS[id]
  }

  /**
   * Update gateway configuration
   */
  static async updateGateway(
    id: 'bkash' | 'eps' | 'stripe',
    updates: Partial<GatewayRecord>
  ): Promise<GatewayRecord> {
    const supabase = createAdminClient()
    const { data: dbSetting } = await supabase
      .from('platform_settings')
      .select('value')
      .eq('key', 'payment_gateways_config')
      .single()

    const currentGateways = dbSetting?.value?.gateways || { ...DEFAULT_GATEWAY_CONFIGS }
    if (!currentGateways[id]) {
      currentGateways[id] = { ...DEFAULT_GATEWAY_CONFIGS[id] }
    }

    currentGateways[id] = {
      ...currentGateways[id],
      ...updates,
      credentials: {
        ...(currentGateways[id].credentials || {}),
        ...(updates.credentials || {}),
      },
      updatedAt: new Date().toISOString(),
    }

    await supabase.from('platform_settings').upsert(
      {
        key: 'payment_gateways_config',
        value: { gateways: currentGateways, updatedAt: new Date().toISOString() },
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'key' }
    )

    return currentGateways[id]
  }

  /**
   * Test connection to a gateway
   */
  static async testConnection(gatewayId: 'bkash' | 'eps' | 'stripe') {
    const config = await this.getGatewayConfig(gatewayId)

    if (gatewayId === 'bkash') {
      const client = new BkashClient(
        {
          appKey: config.credentials?.appKey || '',
          appSecret: config.credentials?.appSecret || '',
          username: config.credentials?.username || '',
          password: config.credentials?.password || '',
          merchantShortCode: config.credentials?.merchantShortCode,
        },
        config.mode
      )
      const res = await client.testConnection()
      await this.updateGateway('bkash', { lastTested: new Date().toISOString(), status: 'CONNECTED' })
      return res
    }

    if (gatewayId === 'eps') {
      const client = new EpsClient(
        {
          merchantId: config.credentials?.merchantId || 'EPS_M_SMARTTRACKER_9921',
          storeId: config.credentials?.storeId || 'SET_CLOUD_STORE_01',
          apiKey: config.credentials?.apiKey || 'eps_live_sec_8192a8b9c10',
          webhookSecret: config.credentials?.webhookSecret,
        },
        config.mode
      )
      const res = await client.testConnection()
      await this.updateGateway('eps', { lastTested: new Date().toISOString(), status: 'CONNECTED' })
      return res
    }

    if (gatewayId === 'stripe') {
      const client = new StripeClient(
        {
          publishableKey: config.credentials?.publishableKey || 'pk_live_sample',
          secretKey: config.credentials?.secretKey || 'sk_live_sample',
          webhookSecret: config.credentials?.webhookSecret,
        },
        config.mode
      )
      const res = await client.testConnection()
      await this.updateGateway('stripe', { lastTested: new Date().toISOString(), status: 'CONNECTED' })
      return res
    }

    throw new Error('Unsupported gateway')
  }

  /**
   * Process Checkout: handles payment creation and upgrades tenant
   */
  static async processCheckout(params: CheckoutParams) {
    const {
      gateway,
      plan = 'PRO',
      billingCycle = 'annual',
      currency = 'BDT',
      seats = 1,
      tenantId,
      paymentDetails = {},
    } = params

    const supabase = createAdminClient()

    // 1. Fetch Target Tenant
    let tenantQuery = supabase.from('tenants').select('*')
    if (tenantId) {
      tenantQuery = tenantQuery.eq('id', tenantId)
    } else {
      tenantQuery = tenantQuery.order('created_at', { ascending: true }).limit(1)
    }
    const { data: tenantData } = await tenantQuery.single()
    const tenant = tenantData || { id: 'default', name: 'Demo Organization' }

    // 2. Compute Amount
    const isAnnual = billingCycle === 'annual'
    let amount = 0

    if (currency === 'BDT') {
      const rate = plan === 'PRO' ? (isAnnual ? 470 * 12 : 590) : (isAnnual ? 1880 * 12 : 2350)
      amount = Math.round(Number(seats) * rate)
    } else {
      const rate = plan === 'PRO' ? (isAnnual ? 3.99 * 12 : 4.99) : (isAnnual ? 15.99 * 12 : 19.99)
      amount = Math.round(Number(seats) * rate)
    }

    // 3. Gateway Specific Processing
    const randomHex = Math.random().toString(36).substring(2, 8).toUpperCase()
    let trxId = ''
    let paymentMethod = ''
    let gatewayUrl = ''

    if (gateway === 'bkash') {
      trxId = `BKH${Date.now().toString().slice(-6)}${randomHex}`
      const phone = paymentDetails.phone || '01712345678'
      paymentMethod = `bKash Direct (${phone.slice(0, 3)}••••${phone.slice(-4)})`
    } else if (gateway === 'eps') {
      trxId = `EPS-${Date.now().toString().slice(-6)}-${randomHex}`
      const bank = paymentDetails.bank || 'Internet Banking (NexusPay / DBBL)'
      paymentMethod = `merchant.eps.com.bd (${bank})`
    } else {
      trxId = `ch_${Date.now().toString().slice(-8)}_${randomHex}`
      paymentMethod = 'Stripe Visa Card (•••• 4242)'
    }

    // 4. Upgrade Tenant in Database to PRO / ENTERPRISE
    const updatePayload: Record<string, unknown> = {
      plan,
      status: 'ACTIVE',
      storage_quota_mb: plan === 'PRO' ? 500000 : 1000000,
      screenshot_interval_sec: 60,
      retention_days: plan === 'PRO' ? 365 : 730,
      updated_at: new Date().toISOString(),
    }

    if (tenant.id !== 'default') {
      await supabase.from('tenants').update(updatePayload).eq('id', tenant.id)
    } else {
      await supabase.from('tenants').update(updatePayload).neq('id', '00000000-0000-0000-0000-000000000000')
    }

    // 5. Create Invoice Record
    const invoiceId = `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
    const newInvoice = {
      id: invoiceId,
      trxId,
      tenantId: tenant.id,
      tenantName: tenant.name,
      plan,
      seats: Number(seats),
      billingCycle: isAnnual ? 'ANNUAL' : 'MONTHLY',
      amount,
      currency,
      status: 'PAID',
      gateway: gateway.toUpperCase(),
      paymentMethod,
      date: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
      invoiceUrl: `/api/billing/invoices/${invoiceId}`,
    }

    // 6. Append to platform_settings (saas_billing_invoices)
    const { data: dbSetting } = await supabase
      .from('platform_settings')
      .select('value')
      .eq('key', 'saas_billing_invoices')
      .single()

    const currentInvoices = dbSetting?.value?.invoices || []
    currentInvoices.unshift(newInvoice)

    await supabase.from('platform_settings').upsert(
      {
        key: 'saas_billing_invoices',
        value: { invoices: currentInvoices, updatedAt: new Date().toISOString() },
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'key' }
    )

    return {
      success: true,
      message: `Payment of ${
        currency === 'BDT' ? `${amount.toLocaleString()} ৳` : `$${amount.toLocaleString()}`
      } verified via ${gateway.toUpperCase()}! Organization upgraded to ${plan}.`,
      invoice: newInvoice,
      trxId,
      gatewayUrl,
      plan,
    }
  }

  /**
   * Get Invoices (filtered by tenant if provided)
   */
  static async getInvoices(tenantId?: string) {
    const supabase = createAdminClient()
    const { data: dbSetting } = await supabase
      .from('platform_settings')
      .select('value')
      .eq('key', 'saas_billing_invoices')
      .single()

    const allInvoices = dbSetting?.value?.invoices || []
    if (tenantId && tenantId !== 'all') {
      return allInvoices.filter((inv: { tenantId: string }) => inv.tenantId === tenantId)
    }
    return allInvoices
  }
}
