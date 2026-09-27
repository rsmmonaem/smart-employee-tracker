import { NextResponse } from 'next/server'
import { PaymentGatewayService } from '@/lib/payments/gateway-service'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const result = await PaymentGatewayService.processCheckout(body)
    return NextResponse.json(result)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('Checkout error:', err)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
