import { NextResponse } from 'next/server'
import { EpsClient } from '@/lib/payments/eps'
import { PaymentGatewayService } from '@/lib/payments/gateway-service'
import { createAdminClient } from '@/utils/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const trxId = url.searchParams.get('trxId')

    if (!trxId) {
      return NextResponse.json({ success: false, error: 'Transaction ID is required' }, { status: 400 })
    }

    const supabase = createAdminClient()
    const { data: dbSetting } = await supabase
      .from('platform_settings')
      .select('value')
      .eq('key', 'saas_billing_invoices')
      .single()

    const currentInvoices = dbSetting?.value?.invoices || []
    const inv = currentInvoices.find(
      (i: { trxId: string; id: string }) => i.trxId === trxId || i.id === trxId
    )

    if (inv && inv.status === 'PAID') {
      return NextResponse.json({ success: true, status: 'PAID', message: 'Invoice already verified and paid.' })
    }

    // Verify with EPS
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

    const verification = await eps.verifyPayment(trxId)

    if (verification.status === 'SUCCESS') {
      await PaymentGatewayService.confirmPayment({
        trxId,
        gateway: 'eps',
        bankName: verification.financialInstitution,
      })

      return NextResponse.json({
        success: true,
        status: 'PAID',
        message: 'Payment verified successfully with EPS! Subscription upgraded to active.',
      })
    }

    return NextResponse.json({
      success: false,
      status: verification.status || 'PENDING',
      message: verification.message || 'Payment has not been completed on EPS.',
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown verification error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
