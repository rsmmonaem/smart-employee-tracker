import { NextResponse } from 'next/server'
import { PaymentGatewayService } from '@/lib/payments/gateway-service'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const eventType = body?.type || 'payment_intent.succeeded'

    if (eventType === 'payment_intent.succeeded' || eventType === 'checkout.session.completed') {
      const dataObject = body?.data?.object || {}
      await PaymentGatewayService.processCheckout({
        gateway: 'stripe',
        plan: 'PRO',
        billingCycle: 'annual',
        currency: 'USD',
        paymentDetails: { cardNumber: '•••• 4242' },
      })
    }

    return NextResponse.json({ received: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
