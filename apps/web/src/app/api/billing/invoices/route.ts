import { NextResponse } from 'next/server'
import { PaymentGatewayService } from '@/lib/payments/gateway-service'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const tenantId = url.searchParams.get('tenantId') || undefined
    const invoices = await PaymentGatewayService.getInvoices(tenantId)

    return NextResponse.json({
      success: true,
      invoices,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
