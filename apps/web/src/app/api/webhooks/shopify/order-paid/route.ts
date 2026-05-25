import { NextResponse } from 'next/server'
import { validateShopifyHmac } from '@/lib/utils/shopify-hmac'
import { routeOrder } from '@rr/order-router'

export async function POST(request: Request) {
  const rawBody = await request.text()

  const isValid = await validateShopifyHmac(request, rawBody)
  if (!isValid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let payload: Record<string, unknown>
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  try {
    // routeOrder is idempotent — safe to call multiple times for same order
    await routeOrder(payload as Parameters<typeof routeOrder>[0])
    return NextResponse.json({ ok: true })
  } catch (err) {
    // Log but return 200 to prevent Shopify from retrying healthy failures.
    // Ops dashboard will surface stuck orders via the NEW status monitor.
    console.error('[webhook:order-paid] Error routing order:', err)
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
