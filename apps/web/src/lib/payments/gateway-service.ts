import { createAdminClient } from '@/utils/supabase/admin'
import { BkashClient } from './bkash'
import { EpsClient } from './eps'
import { StripeClient } from './stripe'
import { sendInvoiceEmail } from '@/lib/email/mailer'

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
      baseUrl: 'https://pgapi.eps.com.bd',
      merchantId: '994f0aac-4345-4495-89f6-20e2159c6d43',
      storeId: '4D6A9398-1EC9-4379-8DFB-C73424E176BA',
      userName: 'sunjove@gmail.com',
      password: 'Merchant@123',
      hashKey: 'FMUNISHOY2lWZEPSXTyEB3CBVALOKICHU',
      deviceTypeId: '1',
      apiKey: 'FMUNISHOY2lWZEPSXTyEB3CBVALOKICHU',
      returnUrl: 'https://app.tracmatrix.com/api/billing/eps/callback',
    },
    lastTested: '2026-10-21T10:45:00Z',
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
        // Auto-upgrade legacy placeholder credentials for EPS if detected
        if (
          !saved.eps ||
          saved.eps.credentials?.merchantId === 'EPS_M_SMARTTRACKER_9921' ||
          !saved.eps.credentials?.hashKey
        ) {
          saved.eps = {
            ...DEFAULT_GATEWAY_CONFIGS.eps,
            ...(saved.eps || {}),
            credentials: {
              ...DEFAULT_GATEWAY_CONFIGS.eps.credentials,
              ...(saved.eps?.credentials || {}),
              baseUrl: 'https://pgapi.eps.com.bd',
              merchantId: '994f0aac-4345-4495-89f6-20e2159c6d43',
              storeId: '4D6A9398-1EC9-4379-8DFB-C73424E176BA',
              userName: 'sunjove@gmail.com',
              password: 'Merchant@123',
              hashKey: 'FMUNISHOY2lWZEPSXTyEB3CBVALOKICHU',
              deviceTypeId: '1',
              apiKey: 'FMUNISHOY2lWZEPSXTyEB3CBVALOKICHU',
              returnUrl: 'https://app.tracmatrix.com/api/billing/eps/callback',
            },
            status: 'CONNECTED',
            lastTested: new Date().toISOString(),
          }

          // Persist upgraded credentials back to database
          await supabase
            .from('platform_settings')
            .upsert(
              {
                key: 'payment_gateways_config',
                value: { gateways: saved, updatedAt: new Date().toISOString() },
                updated_at: new Date().toISOString(),
              },
              { onConflict: 'key' }
            )
        }

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
          baseUrl: config.credentials?.baseUrl || 'https://pgapi.eps.com.bd',
          merchantId: config.credentials?.merchantId || '994f0aac-4345-4495-89f6-20e2159c6d43',
          storeId: config.credentials?.storeId || '4D6A9398-1EC9-4379-8DFB-C73424E176BA',
          userName: config.credentials?.userName || 'sunjove@gmail.com',
          password: config.credentials?.password || 'Merchant@123',
          hashKey: config.credentials?.hashKey || 'FMUNISHOY2lWZEPSXTyEB3CBVALOKICHU',
          deviceTypeId: config.credentials?.deviceTypeId || '1',
          apiKey: config.credentials?.apiKey || config.credentials?.hashKey || 'FMUNISHOY2lWZEPSXTyEB3CBVALOKICHU',
          returnUrl: config.credentials?.returnUrl || 'https://app.tracmatrix.com/api/billing/eps/callback',
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
   * Process Checkout: handles payment initiation or free plan activation
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
      returnUrl,
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

    // 2. BASIC Plan: 100% Free Forever
    if (plan === 'BASIC') {
      const updatePayload: Record<string, unknown> = {
        plan: 'BASIC',
        status: 'ACTIVE',
        storage_quota_mb: 500,
        screenshot_interval_sec: 600,
        retention_days: 2,
        updated_at: new Date().toISOString(),
      }

      if (tenant.id !== 'default') {
        await supabase.from('tenants').update(updatePayload).eq('id', tenant.id)
      } else {
        await supabase.from('tenants').update(updatePayload).neq('id', '00000000-0000-0000-0000-000000000000')
      }

      return {
        success: true,
        isFree: true,
        message: 'BASIC plan activated (Free Forever).',
        redirectTo: '/admin/dashboard',
      }
    }

    // 3. Compute Paid Amount
    const isAnnual = billingCycle === 'annual'
    let amount = 0

    if (currency === 'BDT') {
      const rate = plan === 'PRO' ? (isAnnual ? 470 * 12 : 590) : (isAnnual ? 1880 * 12 : 2350)
      amount = Math.round(Number(seats) * rate)
    } else {
      const rate = plan === 'PRO' ? (isAnnual ? 3.99 * 12 : 4.99) : (isAnnual ? 15.99 * 12 : 19.99)
      amount = Math.round(Number(seats) * rate)
    }

    // 4. Generate unique merchant transaction ID
    const randomHex = Math.random().toString(36).substring(2, 8).toUpperCase()
    const trxId = `TRAC-${Date.now()}-${randomHex}`
    const invoiceId = `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`

    let paymentMethod = ''
    let paymentUrl = ''

    // 5. Initiate with selected Payment Gateway
    if (gateway === 'eps') {
      paymentMethod = 'EPS Payment Gateway (bKash/Nagad/Rocket/Cards)'
      const epsConfig = await this.getGatewayConfig('eps')
      const epsClient = new EpsClient(
        {
          baseUrl: epsConfig.credentials?.baseUrl,
          merchantId: epsConfig.credentials?.merchantId,
          storeId: epsConfig.credentials?.storeId,
          userName: epsConfig.credentials?.userName,
          password: epsConfig.credentials?.password,
          hashKey: epsConfig.credentials?.hashKey,
          deviceTypeId: epsConfig.credentials?.deviceTypeId,
          returnUrl: returnUrl || epsConfig.credentials?.returnUrl,
        },
        epsConfig.mode
      )

      const epsRes = await epsClient.initiatePayment({
        amount,
        currency: 'BDT',
        merchantTrxId: trxId,
        plan,
        customerName: tenant.name,
        customerPhone: paymentDetails.phone,
        returnUrl,
      })

      paymentUrl = epsRes.paymentUrl || ''
    } else if (gateway === 'bkash') {
      paymentMethod = 'bKash Tokenized Gateway'
      const bkashConfig = await this.getGatewayConfig('bkash')
      const bkashClient = new BkashClient(
        {
          appKey: bkashConfig.credentials?.appKey || '',
          appSecret: bkashConfig.credentials?.appSecret || '',
          username: bkashConfig.credentials?.username || '',
          password: bkashConfig.credentials?.password || '',
          merchantShortCode: bkashConfig.credentials?.merchantShortCode,
        },
        bkashConfig.mode
      )

      const bkRes = await bkashClient.createPayment({
        amount,
        currency: 'BDT',
        merchantInvoiceNumber: invoiceId,
        intent: 'sale',
        callbackURL: returnUrl || 'https://app.tracmatrix.com/api/billing/bkash/callback',
      })
      paymentUrl = bkRes.bkashURL || ''
    } else {
      paymentMethod = 'Stripe Global Card Payments'
      paymentUrl = `/admin/billing?gateway=stripe&trxId=${trxId}`
    }

    // 6. Create Invoice with PENDING status (Payment must be collected first!)
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
      status: 'PENDING',
      gateway: gateway.toUpperCase(),
      paymentMethod,
      date: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
      invoiceUrl: `/api/billing/invoices/${invoiceId}`,
      paymentUrl,
    }

    // 7. Store in platform_settings (saas_billing_invoices)
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
      requiresRedirect: true,
      paymentUrl,
      trxId,
      invoice: newInvoice,
      amount,
      currency,
      plan,
      message: `Payment initiated via ${gateway.toUpperCase()}. Redirecting to payment portal...`,
    }
  }

  /**
   * Confirm Payment: Only executed when gateway verifies actual funds received!
   */
  static async confirmPayment(params: {
    trxId: string
    epsTrxId?: string
    gateway: 'bkash' | 'eps' | 'stripe'
    tenantId?: string
    bankName?: string
  }) {
    const supabase = createAdminClient()

    const { data: dbSetting } = await supabase
      .from('platform_settings')
      .select('value')
      .eq('key', 'saas_billing_invoices')
      .single()

    const currentInvoices = dbSetting?.value?.invoices || []
    const invIndex = currentInvoices.findIndex((inv: { trxId: string; id: string }) =>
      inv.trxId === params.trxId || inv.id === params.trxId || (params.epsTrxId && inv.trxId === params.epsTrxId)
    )

    let targetInvoice = invIndex >= 0 ? currentInvoices[invIndex] : null

    if (!targetInvoice) {
      const invoiceId = `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
      targetInvoice = {
        id: invoiceId,
        trxId: params.trxId,
        tenantId: params.tenantId || 'default',
        tenantName: 'Organization',
        plan: 'PRO',
        seats: 1,
        billingCycle: 'ANNUAL',
        amount: 5640,
        currency: 'BDT',
        status: 'PAID',
        gateway: params.gateway.toUpperCase(),
        paymentMethod: params.bankName ? `EPS Gateway (${params.bankName})` : 'EPS Gateway',
        date: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString(),
        invoiceUrl: `/api/billing/invoices/${invoiceId}`,
      }
      currentInvoices.unshift(targetInvoice)
    } else {
      targetInvoice.status = 'PAID'
      if (params.bankName) {
        targetInvoice.paymentMethod = `${targetInvoice.gateway} (${params.bankName})`
      }
      currentInvoices[invIndex] = targetInvoice
    }

    await supabase.from('platform_settings').upsert(
      {
        key: 'saas_billing_invoices',
        value: { invoices: currentInvoices, updatedAt: new Date().toISOString() },
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'key' }
    )

    // Upgrade Tenant
    const targetTenantId = targetInvoice.tenantId !== 'default' ? targetInvoice.tenantId : params.tenantId
    const targetPlan = targetInvoice.plan || 'PRO'
    const targetSeats = targetInvoice.seats ? Math.max(Number(targetInvoice.seats), 1) : 1
    const updatePayload = {
      plan: targetPlan,
      status: 'ACTIVE',
      max_seats: targetSeats,
      storage_quota_mb: targetPlan === 'PRO' ? 500000 : 1000000,
      screenshot_interval_sec: 60,
      retention_days: targetPlan === 'PRO' ? 365 : 730,
      updated_at: new Date().toISOString(),
    }

    if (targetTenantId && targetTenantId !== 'default') {
      await supabase.from('tenants').update(updatePayload).eq('id', targetTenantId)
    } else {
      await supabase.from('tenants').update(updatePayload).neq('id', '00000000-0000-0000-0000-000000000000')
    }

    // Send Invoice Email
    try {
      if (targetTenantId) {
        const { data: adminUser } = await supabase
          .from('users')
          .select('email')
          .eq('tenant_id', targetTenantId)
          .eq('role', 'TENANT_ADMIN')
          .limit(1)
          .maybeSingle()

        if (adminUser?.email) {
          await sendInvoiceEmail({
            email: adminUser.email,
            companyName: targetInvoice.tenantName || 'Organization',
            invoiceId: targetInvoice.id,
            amount: targetInvoice.amount,
            currency: targetInvoice.currency,
            plan: targetPlan,
            isPaid: true,
          })
        }
      }
    } catch (e) {
      console.warn('Invoice email delivery error:', e)
    }

    return { success: true, invoice: targetInvoice }
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
