import { NextResponse } from 'next/server'
import { BkashClient } from '@/lib/payments/bkash'
import { PaymentGatewayService } from '@/lib/payments/gateway-service'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const paymentID = url.searchParams.get('paymentID')
  const status = url.searchParams.get('status')

  if (status === 'cancel' || status === 'failure') {
    return NextResponse.redirect(new URL(`/admin/billing?status=${status}&gateway=bkash`, req.url))
  }

  if (status === 'success' && paymentID) {
    try {
      const config = await PaymentGatewayService.getGatewayConfig('bkash')
      const bkash = new BkashClient(
        {
          appKey: config.credentials?.appKey || '',
          appSecret: config.credentials?.appSecret || '',
          username: config.credentials?.username || '',
          password: config.credentials?.password || '',
          merchantShortCode: config.credentials?.merchantShortCode,
        },
        config.mode
      )

      const execution = await bkash.executePayment(paymentID)

      if (execution.statusCode === '0000' || execution.transactionStatus === 'Completed') {
        const checkoutRes = await PaymentGatewayService.processCheckout({
          gateway: 'bkash',
          plan: 'PRO',
          billingCycle: 'annual',
          currency: 'BDT',
          paymentDetails: { phone: execution.customerMsisdn || '01713000000' },
        })

        return NextResponse.redirect(
          new URL(
            `/admin/billing?status=success&gateway=bkash&trxId=${execution.trxID || checkoutRes.trxId}`,
            req.url
          )
        )
      }
    } catch (err) {
      console.error('bKash callback execution error:', err)
    }
  }

  return NextResponse.redirect(new URL('/admin/billing?status=completed&gateway=bkash', req.url))
}

export async function POST(req: Request) {
  // Webhook notification from bKash IPN
  try {
    const body = await req.json()
    return NextResponse.json({ success: true, received: body })
  } catch {
    return NextResponse.json({ success: true })
  }
}
