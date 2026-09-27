import { NextResponse } from 'next/server'
import { EpsClient } from '@/lib/payments/eps'
import { PaymentGatewayService } from '@/lib/payments/gateway-service'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const epsTrxId = url.searchParams.get('epsTrxId')
  const merchantTrxId = url.searchParams.get('merchantTrxId')
  const status = url.searchParams.get('status')

  if (status === 'FAILED' || status === 'CANCELLED') {
    return NextResponse.redirect(new URL(`/admin/billing?status=${status.toLowerCase()}&gateway=eps`, req.url))
  }

  if (epsTrxId) {
    try {
      const config = await PaymentGatewayService.getGatewayConfig('eps')
      const eps = new EpsClient(
        {
          merchantId: config.credentials?.merchantId || 'EPS_M_WORKFOLIO_9921',
          storeId: config.credentials?.storeId || 'WF_CLOUD_STORE_01',
          apiKey: config.credentials?.apiKey || 'eps_live_sec_8192a8b9c10',
          webhookSecret: config.credentials?.webhookSecret,
        },
        config.mode
      )

      const verification = await eps.verifyPayment(epsTrxId, merchantTrxId || undefined)

      if (verification.status === 'SUCCESS') {
        const checkoutRes = await PaymentGatewayService.processCheckout({
          gateway: 'eps',
          plan: 'PRO',
          billingCycle: 'annual',
          currency: 'BDT',
          paymentDetails: { bank: verification.financialInstitution || 'Internet Banking' },
        })

        return NextResponse.redirect(
          new URL(
            `/admin/billing?status=success&gateway=eps&trxId=${epsTrxId || checkoutRes.trxId}`,
            req.url
          )
        )
      }
    } catch (err) {
      console.error('EPS callback error:', err)
    }
  }

  return NextResponse.redirect(new URL('/admin/billing?status=completed&gateway=eps', req.url))
}

export async function POST(req: Request) {
  // IPN Webhook from merchant.eps.com.bd
  try {
    const body = await req.json()
    const { epsTrxId, merchantTrxId, status } = body

    if (status === 'SUCCESS' && epsTrxId) {
      await PaymentGatewayService.processCheckout({
        gateway: 'eps',
        plan: 'PRO',
        billingCycle: 'annual',
        currency: 'BDT',
        paymentDetails: { bank: body.bankName || 'EPS Bangladesh Gateway' },
      })
    }

    return NextResponse.json({ success: true, acknowledged: true })
  } catch {
    return NextResponse.json({ success: true })
  }
}
