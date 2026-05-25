import { NextResponse } from 'next/server'
import { prisma } from '@rr/db'
import { validateShopifyHmac } from '@/lib/utils/shopify-hmac'

export async function POST(request: Request) {
  const rawBody = await request.text()

  const isValid = await validateShopifyHmac(request, rawBody)
  if (!isValid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const payload = JSON.parse(rawBody) as {
    id: string
    fulfillment_status: string
  }

  const shopifyOrderId = `gid://shopify/Order/${payload.id}`

  await prisma.order.updateMany({
    where: { shopifyOrderId },
    data: {
      status: 'FULFILLED',
      shopifyFulfillmentStatus: payload.fulfillment_status,
    },
  })

  return NextResponse.json({ ok: true })
}
