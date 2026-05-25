import { prisma } from '@rr/db'
import { getAdapter } from '@rr/supplier-adapters'

const SHOPIFY_ADMIN_BASE = `https://${process.env.SHOPIFY_STORE_DOMAIN}/admin/api/2024-01`
const SHOPIFY_ADMIN_KEY = process.env.SHOPIFY_ADMIN_API_KEY
const SHOPIFY_ADMIN_SECRET = process.env.SHOPIFY_ADMIN_API_SECRET

async function shopifyAdminFetch(path: string, options: RequestInit = {}) {
  const credentials = Buffer.from(`${SHOPIFY_ADMIN_KEY}:${SHOPIFY_ADMIN_SECRET}`).toString('base64')
  const res = await fetch(`${SHOPIFY_ADMIN_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${credentials}`,
      ...(options.headers ?? {}),
    },
  })
  if (!res.ok) throw new Error(`Shopify Admin API error: ${res.status} ${path}`)
  return res.json()
}

async function pollTracking() {
  console.log('Tracking poller starting...')

  const openSupplierOrders = await prisma.supplierOrder.findMany({
    where: {
      status: { in: ['CONFIRMED', 'SUBMITTED'] },
      supplierPoNumber: { not: null },
    },
    include: { supplier: true, order: true },
  })

  console.log(`Found ${openSupplierOrders.length} open supplier orders to check`)

  for (const so of openSupplierOrders) {
    if (!so.supplierPoNumber) continue
    try {
      const adapter = getAdapter(so.supplier.adapterKey)
      const updates = await adapter.getTrackingStatus(so.supplierPoNumber)

      for (const update of updates) {
        // Upsert shipment record using composite unique key
        const shipment = await prisma.shipment.upsert({
          where: { orderId_trackingNumber: { orderId: so.orderId, trackingNumber: update.trackingNumber } },
          update: {
            status: mapTrackingStatus(update.status),
            estimatedDelivery: update.estimatedDelivery,
            deliveredAt: update.deliveredAt,
            lastTrackingData: update as Record<string, unknown>,
          },
          create: {
            orderId: so.orderId,
            carrier: update.carrier,
            trackingNumber: update.trackingNumber,
            trackingUrl: update.trackingUrl,
            status: mapTrackingStatus(update.status),
            estimatedDelivery: update.estimatedDelivery,
            deliveredAt: update.deliveredAt,
            lastTrackingData: update as Record<string, unknown>,
          },
        })

        // Sync fulfillment to Shopify if not already done
        if (!shipment.shopifyFulfillmentId) {
          await syncFulfillmentToShopify(so.order.shopifyOrderId, shipment.id, update)
        }

        // Update order delivered_at when shipment is delivered
        if (update.status === 'delivered' && update.deliveredAt) {
          await prisma.order.update({
            where: { id: so.orderId },
            data: { deliveredAt: update.deliveredAt, status: 'DELIVERED' },
          })
        }
      }

      if (updates.some((u) => u.status === 'delivered')) {
        await prisma.supplierOrder.update({
          where: { id: so.id },
          data: { status: 'SHIPPED', shippedAt: so.shippedAt ?? new Date() },
        })
      }
    } catch (err) {
      console.error(`Error polling tracking for ${so.supplierPoNumber}:`, err)
    }
  }

  await prisma.$disconnect()
  console.log('Tracking poller complete.')
}

async function syncFulfillmentToShopify(
  shopifyOrderId: string,
  shipmentId: string,
  update: { carrier: string; trackingNumber: string; trackingUrl?: string }
) {
  try {
    // Extract numeric order ID from GID
    const orderId = shopifyOrderId.replace('gid://shopify/Order/', '')
    const data = await shopifyAdminFetch(`/orders/${orderId}/fulfillments.json`, {
      method: 'POST',
      body: JSON.stringify({
        fulfillment: {
          tracking_company: update.carrier,
          tracking_number: update.trackingNumber,
          tracking_url: update.trackingUrl,
          notify_customer: true,
        },
      }),
    })

    await prisma.shipment.update({
      where: { id: shipmentId },
      data: { shopifyFulfillmentId: String(data.fulfillment.id) },
    })
  } catch (err) {
    console.error('Failed to sync fulfillment to Shopify:', err)
  }
}

function mapTrackingStatus(status: string): 'LABEL_CREATED' | 'IN_TRANSIT' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'EXCEPTION' | 'RETURNED' {
  const map: Record<string, 'LABEL_CREATED' | 'IN_TRANSIT' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'EXCEPTION' | 'RETURNED'> = {
    label_created: 'LABEL_CREATED',
    in_transit: 'IN_TRANSIT',
    out_for_delivery: 'OUT_FOR_DELIVERY',
    delivered: 'DELIVERED',
    exception: 'EXCEPTION',
    returned: 'RETURNED',
  }
  return map[status] ?? 'IN_TRANSIT'
}

pollTracking().catch((e) => {
  console.error(e)
  process.exit(1)
})
