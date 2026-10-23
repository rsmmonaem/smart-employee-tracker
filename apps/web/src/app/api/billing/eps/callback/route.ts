import { NextResponse } from 'next/server'
import { EpsClient } from '@/lib/payments/eps'
import { PaymentGatewayService } from '@/lib/payments/gateway-service'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const epsTrxId =
    url.searchParams.get('epsTrxId') ||
    url.searchParams.get('EPSTransactionId') ||
    url.searchParams.get('TransactionId') ||
    url.searchParams.get('transactionId') ||
    undefined
  const merchantTrxId =
    url.searchParams.get('merchantTrxId') ||
    url.searchParams.get('merchantTransactionId') ||
    url.searchParams.get('MerchantTransactionId') ||
    undefined
  const status = (url.searchParams.get('status') || url.searchParams.get('Status') || '').toUpperCase()

  if (status === 'FAILED' || status === 'CANCELLED') {
    return NextResponse.redirect(new URL('/admin/billing?status=failed&gateway=eps', req.url))
  }

  const targetTrx = merchantTrxId || epsTrxId
  if (targetTrx) {
    try {
      const config = await PaymentGatewayService.getGatewayConfig('eps')
      const eps = new EpsClient(
        {
          baseUrl: config.credentials?.baseUrl,
          merchantId: config.credentials?.merchantId,
          storeId: config.credentials?.storeId,
          userName: config.credentials?.userName,
          password: config.credentials?.password,
          hashKey: config.credentials?.hashKey,
          deviceTypeId: config.credentials?.deviceTypeId,
        },
        config.mode
      )

      const verification = await eps.verifyPayment(merchantTrxId, epsTrxId)

      if (verification.status === 'SUCCESS') {
        await PaymentGatewayService.confirmPayment({
          trxId: targetTrx,
          epsTrxId,
          gateway: 'eps',
          bankName: verification.financialInstitution,
        })

        return NextResponse.redirect(
          new URL(`/admin/billing?status=success&gateway=eps&trxId=${targetTrx}`, req.url)
        )
      } else {
        return NextResponse.redirect(
          new URL(`/admin/billing?status=failed&gateway=eps&message=${encodeURIComponent(verification.message)}`, req.url)
        )
      }
    } catch (err) {
      console.error('EPS verification callback error:', err)
      return NextResponse.redirect(new URL('/admin/billing?status=error&gateway=eps', req.url))
    }
  }

  return NextResponse.redirect(new URL('/admin/billing?status=pending&gateway=eps', req.url))
}

export async function POST(req: Request) {
  // IPN Webhook from merchant.eps.com.bd
  try {
    const body = await req.json().catch(() => ({}))
    const epsTrxId = body.epsTrxId || body.EPSTransactionId || body.TransactionId
    const merchantTrxId = body.merchantTrxId || body.merchantTransactionId || body.MerchantTransactionId

    const targetTrx = merchantTrxId || epsTrxId
    if (targetTrx) {
      const config = await PaymentGatewayService.getGatewayConfig('eps')
      const eps = new EpsClient(
        {
          baseUrl: config.credentials?.baseUrl,
          merchantId: config.credentials?.merchantId,
          storeId: config.credentials?.storeId,
          userName: config.credentials?.userName,
          password: config.credentials?.password,
          hashKey: config.credentials?.hashKey,
        },
        config.mode
      )

      const verification = await eps.verifyPayment(merchantTrxId, epsTrxId)
      if (verification.status === 'SUCCESS') {
        await PaymentGatewayService.confirmPayment({
          trxId: targetTrx,
          epsTrxId,
          gateway: 'eps',
          bankName: verification.financialInstitution || body.bankName,
        })
      }
    }

    return NextResponse.json({ success: true, acknowledged: true })
  } catch (err) {
    console.warn('EPS IPN processing error:', err)
    return NextResponse.json({ success: true })
  }
}
