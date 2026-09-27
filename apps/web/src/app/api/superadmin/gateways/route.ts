import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { PaymentGatewayService, DEFAULT_GATEWAY_CONFIGS } from '@/lib/payments/gateway-service'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const gateways = await PaymentGatewayService.getAllGateways()
    return NextResponse.json({
      success: true,
      gateways,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ success: true, gateways: Object.values(DEFAULT_GATEWAY_CONFIGS), fallbackError: message })
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json()
    const { gatewayId, updates } = body

    if (!gatewayId || !updates) {
      return NextResponse.json({ success: false, error: 'gatewayId and updates are required' }, { status: 400 })
    }

    const updated = await PaymentGatewayService.updateGateway(gatewayId, updates)

    return NextResponse.json({
      success: true,
      message: `Gateway ${gatewayId} updated successfully`,
      gateway: updated,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { action, gatewayId } = body

    if (action === 'test_connection') {
      const testResult = await PaymentGatewayService.testConnection(gatewayId)
      return NextResponse.json({
        ...testResult,
        gatewayId,
      })
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
