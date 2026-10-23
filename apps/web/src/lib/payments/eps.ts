/**
 * Easy Payment System (EPS - Bangladesh)
 * Official Portal: https://merchant.eps.com.bd
 * PG API: https://pgapi.eps.com.bd
 */

import crypto from 'crypto'

export interface EpsCredentials {
  baseUrl?: string
  merchantId: string
  storeId: string
  userName?: string
  password?: string
  hashKey?: string
  deviceTypeId?: number | string
  apiKey?: string
  webhookSecret?: string
  returnUrl?: string
}

export interface EpsInitiatePaymentParams {
  amount: number
  currency: 'BDT'
  merchantTrxId: string
  plan?: string
  customerName?: string
  customerEmail?: string
  customerPhone?: string
  returnUrl?: string
  cancelUrl?: string
}

export interface EpsPaymentResponse {
  status: 'SUCCESS' | 'PENDING' | 'FAILED' | 'CANCELLED'
  statusCode: string
  message: string
  epsTrxId?: string
  merchantTrxId?: string
  paymentUrl?: string
  financialInstitution?: string
  amount?: number
}

export const EPS_DEFAULT_CONFIG: EpsCredentials = {
  baseUrl: process.env.EPS_BASE_URL || 'https://pgapi.eps.com.bd',
  merchantId: process.env.EPS_MERCHANT_ID || '994f0aac-4345-4495-89f6-20e2159c6d43',
  storeId: process.env.EPS_STORE_ID || '4D6A9398-1EC9-4379-8DFB-C73424E176BA',
  userName: process.env.EPS_USER_NAME || 'sunjove@gmail.com',
  password: process.env.EPS_PASSWORD || 'Merchant@123',
  hashKey: process.env.EPS_HASH_KEY || 'FMUNISHOY2lWZEPSXTyEB3CBVALOKICHU',
  deviceTypeId: process.env.EPS_DEVICE_TYPE_ID || '1',
  apiKey: process.env.EPS_HASH_KEY || 'FMUNISHOY2lWZEPSXTyEB3CBVALOKICHU',
  returnUrl: process.env.EPS_RETURN_URL || 'https://app.tracmatrix.com/api/billing/eps/callback',
}

export const EPS_SUPPORTED_BANKS = [
  { code: 'BKASH', name: 'bKash Mobile Financial Services', type: 'MFS' },
  { code: 'NAGAD', name: 'Nagad Mobile Financial Services', type: 'MFS' },
  { code: 'ROCKET', name: 'Dutch-Bangla Rocket', type: 'MFS' },
  { code: 'DBBL_NEXUS', name: 'Dutch-Bangla Bank (NexusPay / Nexus Cards)', type: 'Card & App' },
  { code: 'CITY_TOUCH', name: 'City Bank (City Touch / Visa / Mastercard)', type: 'Internet Banking' },
  { code: 'BRAC_ASTHA', name: 'BRAC Bank (Astha Internet Banking & Cards)', type: 'Internet Banking' },
  { code: 'IBBL_CELLFIN', name: 'Islami Bank Bangladesh (CellFin & iBanking)', type: 'Internet Banking' },
  { code: 'VISA_MC', name: 'Visa & Mastercard (Debit / Credit)', type: 'Card' },
]

export function generateEpsHash(value: string, hashKey: string): string {
  const hmac = crypto.createHmac('sha512', Buffer.from(hashKey, 'utf8'))
  hmac.update(value, 'utf8')
  return hmac.digest('base64')
}

export class EpsClient {
  private credentials: EpsCredentials
  private mode: 'Live' | 'Sandbox'
  private baseUrl: string
  private cachedToken: string | null = null
  private tokenExpiry: number | null = null

  constructor(credentials?: Partial<EpsCredentials>, mode: 'Live' | 'Sandbox' = 'Live') {
    this.credentials = {
      ...EPS_DEFAULT_CONFIG,
      ...(credentials || {}),
    }
    this.mode = mode
    this.baseUrl = this.credentials.baseUrl || 'https://pgapi.eps.com.bd'
  }

  /**
   * Acquire or reuse cached Bearer JWT Token from EPS Auth API
   */
  async getToken(): Promise<string> {
    if (this.cachedToken && this.tokenExpiry && Date.now() < this.tokenExpiry - 60000) {
      return this.cachedToken
    }

    const username = this.credentials.userName || 'sunjove@gmail.com'
    const password = this.credentials.password || 'Merchant@123'
    const hashKey = this.credentials.hashKey || 'FMUNISHOY2lWZEPSXTyEB3CBVALOKICHU'

    const hash = generateEpsHash(username, hashKey)
    const endpoint = `${this.baseUrl}/v1/Auth/GetToken`

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-hash': hash,
      },
      body: JSON.stringify({ userName: username, password }),
    })

    if (!res.ok) {
      const errText = await res.text()
      throw new Error(`EPS Authentication failed (${res.status}): ${errText}`)
    }

    const data = await res.json()
    if (!data.token) {
      throw new Error(data.errorMessage || data.message || 'Failed to acquire EPS token')
    }

    this.cachedToken = data.token
    if (data.expireDate) {
      this.tokenExpiry = new Date(data.expireDate).getTime()
    } else {
      this.tokenExpiry = Date.now() + 3600 * 1000
    }

    return this.cachedToken!
  }

  /**
   * Initiate Payment Session with EPS PGW
   * Directs to genuine live EPS payment portal (bKash/Nagad/Rocket/Cards)
   */
  async initiatePayment(params: EpsInitiatePaymentParams): Promise<EpsPaymentResponse> {
    const token = await this.getToken()
    const hashKey = this.credentials.hashKey || 'FMUNISHOY2lWZEPSXTyEB3CBVALOKICHU'
    const trxId = params.merchantTrxId
    const trxHash = generateEpsHash(trxId, hashKey)

    const defaultReturnUrl = params.returnUrl || this.credentials.returnUrl || 'https://app.tracmatrix.com/api/billing/eps/callback'
    const cancelUrl = params.cancelUrl || `${defaultReturnUrl}?status=CANCELLED`

    const createPayload = (successUrl: string, failUrl: string, cancelUrl: string) => ({
      merchantId: this.credentials.merchantId,
      storeId: this.credentials.storeId,
      CustomerOrderId: `ORD-${Date.now()}`,
      merchantTransactionId: trxId,
      transactionTypeId: 1,
      financialEntityId: 0,
      transitionStatusId: 0,
      totalAmount: params.amount,
      ipAddress: '127.0.0.1',
      version: '1',
      successUrl,
      failUrl,
      cancelUrl,
      customerName: params.customerName || 'Tracmatrix Subscriber',
      customerEmail: params.customerEmail || 'billing@tracmatrix.com',
      CustomerAddress: 'Dhaka',
      CustomerAddress2: '',
      CustomerCity: 'Dhaka',
      CustomerState: 'Dhaka',
      CustomerPostcode: '1200',
      CustomerCountry: 'BD',
      CustomerPhone: params.customerPhone || '01700000000',
      ShippingMethod: 'NO',
      NoOfItem: '1',
      ProductName: `Tracmatrix ${params.plan || 'PRO'} Plan`,
      ProductProfile: 'general',
      ProductCategory: 'general',
      ProductList: [],
    })

    const endpoint = `${this.baseUrl}/v1/EPSEngine/InitializeEPS`

    // Attempt 1: with configured return URL
    let res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-hash': trxHash,
      },
      body: JSON.stringify(createPayload(defaultReturnUrl, `${defaultReturnUrl}?status=FAILED`, cancelUrl)),
    })

    let resText = await res.text()

    // If EPS reports domain mismatch for registered base domain (e.g. valokichu.com), retry with registered domain
    if (res.status === 400 && resText.includes('Domain mismatch')) {
      const match = resText.match(/Your Correct Url \(BaseUrl\):\s*([a-zA-Z0-9.-]+)/i)
      const registeredBase = match ? match[1].trim() : 'valokichu.com'
      const fallbackReturn = `https://${registeredBase}/api/billing/eps/callback`

      res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-hash': trxHash,
        },
        body: JSON.stringify(createPayload(fallbackReturn, `${fallbackReturn}?status=FAILED`, `${fallbackReturn}?status=CANCELLED`)),
      })
      resText = await res.text()
    }

    if (!res.ok) {
      throw new Error(`EPS Initialize failed (${res.status}): ${resText}`)
    }

    const data = JSON.parse(resText)
    const paymentUrl = data.RedirectURL || data.redirectUrl || data.PaymentURL

    if (!paymentUrl) {
      throw new Error(data.ErrorMessage || data.errorMessage || 'No RedirectURL returned by EPS Gateway')
    }

    return {
      status: 'PENDING',
      statusCode: 'EPS_PENDING',
      message: 'Payment session created with merchant.eps.com.bd',
      epsTrxId: data.TransactionId || data.transactionId,
      merchantTrxId: trxId,
      paymentUrl,
      amount: params.amount,
    }
  }

  /**
   * Verify EPS Payment status via official CheckMerchantTransactionStatus API
   */
  async verifyPayment(merchantTrxId?: string, epsTrxId?: string): Promise<EpsPaymentResponse> {
    const targetId = merchantTrxId || epsTrxId
    if (!targetId) {
      throw new Error('Either merchantTransactionId or EPSTransactionId is required for EPS verification')
    }

    const token = await this.getToken()
    const hashKey = this.credentials.hashKey || 'FMUNISHOY2lWZEPSXTyEB3CBVALOKICHU'
    const trxHash = generateEpsHash(targetId, hashKey)

    const query = new URLSearchParams()
    if (merchantTrxId) query.set('merchantTransactionId', merchantTrxId)
    if (epsTrxId) query.set('EPSTransactionId', epsTrxId)

    const endpoint = `${this.baseUrl}/v1/EPSEngine/CheckMerchantTransactionStatus?${query.toString()}`

    const res = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-hash': trxHash,
      },
    })

    if (!res.ok) {
      const errText = await res.text()
      return {
        status: 'FAILED',
        statusCode: `HTTP_${res.status}`,
        message: `EPS verification request failed: ${errText}`,
        merchantTrxId,
        epsTrxId,
      }
    }

    const data = await res.json()
    const rawStatus = (data.Status || data.status || '').toLowerCase()
    const isSuccess = rawStatus === 'success'

    return {
      status: isSuccess ? 'SUCCESS' : rawStatus === 'pending' ? 'PENDING' : 'FAILED',
      statusCode: String(data.ErrorCode ?? (isSuccess ? '0' : '400')),
      message: data.ErrorMessage || (isSuccess ? 'Payment verified successfully' : 'Payment not successful'),
      epsTrxId: data.EPSTransactionId || epsTrxId,
      merchantTrxId: data.MerchantTransactionId || merchantTrxId,
      financialInstitution: data.FinancialEntity || 'EPS Payment Gateway (bKash/Nagad/Bank)',
      amount: data.TotalAmount ? Number(data.TotalAmount) : undefined,
    }
  }

  /**
   * Test Connection / Handshake with pgapi.eps.com.bd
   */
  async testConnection(): Promise<{ success: boolean; message: string; latencyMs: number }> {
    const start = Date.now()
    try {
      const token = await this.getToken()
      const latency = Date.now() - start

      return {
        success: true,
        message: `EPS Live Gateway Handshake verified! Merchant: ${this.credentials.merchantId}. Store: ${this.credentials.storeId}. Auth Token active (${token.substring(0, 16)}...).`,
        latencyMs: latency,
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      return {
        success: false,
        message: `EPS Handshake failed: ${message}`,
        latencyMs: Date.now() - start,
      }
    }
  }
}
