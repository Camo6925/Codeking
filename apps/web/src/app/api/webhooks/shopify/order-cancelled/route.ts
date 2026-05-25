import { NextResponse } from 'next/server'
import { prisma } from '@rr/db'
import { validateShopifyHmac } from '@/lib/utils/shopify-hmac'
import { getAdapter } from '@rr/supplier-adapters'

export async function POST(request: Request) {
  const rawBody = await request.text()

  const isValid = await validateShopifyHmac(request, rawBody)
  if (!isValid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const payload = JSON.parse(rawBody) as { id: string; cancelled_at: string }
  const shopifyOrderId = `gid://shopify/Order/${payload.id}`

  const order = await prisma.order.findUnique({
    where: { shopifyOrderId },
    include: {
      supplierOrders: { include: { supplier: true } },
    },
  })

  if (!order) return NextResponse.json({ ok: true })

  await prisma.order.update({
    where: { id: order.id },
    data: { status: 'CANCELLED', cancelledAt: new Date(payload.cancelled_at) },
  })

  // Attempt to cancel each supplier order
  for (const so of order.supplierOrders) {
    if (!so.supplierPoNumber || so.status === 'SHIPPED') continue
    try {
      const adapter = getAdapter(so.supplier.adapterKey)
      await adapter.cancelOrder(so.supplierPoNumber)
      await prisma.supplierOrder.update({
        where: { id: so.id },
        data: { status: 'CANCELLED' },
      })
    } catch (err) {
      console.error(`[webhook:order-cancelled] Could not cancel supplier PO ${so.supplierPoNumber}:`, err)
    }
  }

  return NextResponse.json({ ok: true })
}
