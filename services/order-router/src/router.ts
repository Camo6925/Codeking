import { prisma, type Order, type OrderItem } from '@rr/db'
import { getAdapter } from '@rr/supplier-adapters'
import type { SupplierOrderPayload, ShippingAddress } from '@rr/supplier-adapters'

interface ShopifyOrderPayload {
  id: string
  name: string
  order_number: number
  email: string
  billing_address: { name: string }
  shipping_address: {
    name: string
    address1: string
    address2?: string
    city: string
    province_code: string
    zip: string
    country_code: string
    phone?: string
  }
  line_items: Array<{
    id: string
    variant_id: string
    title: string
    variant_title?: string
    quantity: number
    price: string
    sku: string
  }>
  subtotal_price: string
  total_shipping_price_set: { shop_money: { amount: string } }
  total_tax: string
  total_price: string
  created_at: string
  financial_status: string
}

export async function routeOrder(shopifyPayload: ShopifyOrderPayload): Promise<Order> {
  const shopifyOrderId = `gid://shopify/Order/${shopifyPayload.id}`

  // Idempotency: skip if already processed
  const existing = await prisma.order.findUnique({ where: { shopifyOrderId } })
  if (existing) return existing

  // Create Order record
  const order = await prisma.order.create({
    data: {
      shopifyOrderId,
      shopifyOrderName: shopifyPayload.name,
      shopifyOrderNumber: shopifyPayload.order_number,
      customerEmail: shopifyPayload.email,
      customerName:
        shopifyPayload.shipping_address?.name ?? shopifyPayload.billing_address?.name ?? '',
      subtotalCents: Math.round(parseFloat(shopifyPayload.subtotal_price) * 100),
      shippingCents: Math.round(
        parseFloat(
          shopifyPayload.total_shipping_price_set?.shop_money?.amount ?? '0'
        ) * 100
      ),
      taxCents: Math.round(parseFloat(shopifyPayload.total_tax) * 100),
      totalCents: Math.round(parseFloat(shopifyPayload.total_price) * 100),
      shopifyCreatedAt: new Date(shopifyPayload.created_at),
      paidAt: shopifyPayload.financial_status === 'paid' ? new Date() : null,
      status: 'PROCESSING',
    },
  })

  // Create order items and group by supplier
  const itemsBySupplier = new Map<string, { supplierId: string; items: OrderItem[] }>()

  for (const lineItem of shopifyPayload.line_items) {
    const variant = await prisma.productVariant.findFirst({
      where: { shopifyVariantId: lineItem.variant_id },
      include: {
        product: {
          include: {
            supplierProducts: {
              where: { isPreferred: true, isActive: true },
              include: { supplier: true },
              take: 1,
            },
          },
        },
      },
    })

    if (!variant) {
      console.warn(`[order-router] No variant found for shopifyVariantId=${lineItem.variant_id} sku=${lineItem.sku} — item will not be routed to a supplier`)
    }

    const orderItem = await prisma.orderItem.create({
      data: {
        orderId: order.id,
        variantId: variant?.id,
        productName: lineItem.title,
        partNumber: lineItem.sku,
        variantTitle: lineItem.variant_title,
        quantity: lineItem.quantity,
        unitPriceCents: Math.round(parseFloat(lineItem.price) * 100),
        totalPriceCents: Math.round(parseFloat(lineItem.price) * 100 * lineItem.quantity),
        shopifyLineItemId: lineItem.id,
      },
    })

    const preferredSupplier = variant?.product?.supplierProducts[0]
    if (!preferredSupplier) {
      console.warn(`[order-router] No preferred supplier for sku=${lineItem.sku} orderId=${order.id} — item will not be dispatched`)
    } else {
      const supplierId = preferredSupplier.supplierId
      if (!itemsBySupplier.has(supplierId)) {
        itemsBySupplier.set(supplierId, { supplierId, items: [] })
      }
      itemsBySupplier.get(supplierId)!.items.push(orderItem)
    }
  }

  const shippingAddress: ShippingAddress = {
    name: shopifyPayload.shipping_address.name,
    address1: shopifyPayload.shipping_address.address1,
    address2: shopifyPayload.shipping_address.address2 ?? undefined,
    city: shopifyPayload.shipping_address.city,
    province: shopifyPayload.shipping_address.province_code,
    zip: shopifyPayload.shipping_address.zip,
    country: shopifyPayload.shipping_address.country_code,
    phone: shopifyPayload.shipping_address.phone ?? undefined,
  }

  // Dispatch to each supplier
  await Promise.allSettled(
    Array.from(itemsBySupplier.values()).map(({ supplierId, items }) =>
      dispatchToSupplier(order, supplierId, items, shippingAddress)
    )
  )

  return order
}

async function dispatchToSupplier(
  order: Order,
  supplierId: string,
  items: OrderItem[],
  shippingAddress: ShippingAddress
): Promise<void> {
  const supplier = await prisma.supplier.findUniqueOrThrow({ where: { id: supplierId } })
  const supplierOrder = await prisma.supplierOrder.create({
    data: { orderId: order.id, supplierId, status: 'PENDING' },
  })

  const poReference = `RR-${order.shopifyOrderNumber}-${supplier.slug.toUpperCase()}`

  // Resolve supplier part numbers for each item
  const lineItems = await Promise.all(
    items.map(async (item) => {
      const sp = await prisma.supplierProduct.findFirst({
        where: {
          supplierId,
          product: { variants: { some: { orderItems: { some: { id: item.id } } } } },
        },
        select: { supplierPartNum: true, cost: true },
      })
      return {
        supplierPartNum: sp?.supplierPartNum ?? item.partNumber,
        quantity: item.quantity,
        unitCostCents: sp?.cost ?? item.unitPriceCents,
      }
    })
  )

  const payload: SupplierOrderPayload = {
    internalOrderId: order.id,
    shopifyOrderName: order.shopifyOrderName,
    poReference,
    shippingAddress,
    customerEmail: order.customerEmail,
    lineItems,
  }

  try {
    const adapter = getAdapter(supplier.adapterKey)
    const confirmation = await submitWithRetry(adapter.submitOrder.bind(adapter), payload)

    await prisma.supplierOrder.update({
      where: { id: supplierOrder.id },
      data: {
        supplierPoNumber: confirmation.supplierPoNumber,
        status: 'CONFIRMED',
        confirmedAt: new Date(),
        submittedAt: new Date(),
      },
    })
  } catch (err) {
    await prisma.supplierOrder.update({
      where: { id: supplierOrder.id },
      data: {
        status: 'FAILED',
        errorMessage: err instanceof Error ? err.message : String(err),
      },
    })
    // Re-throw so the caller can alert ops
    throw err
  }
}

async function submitWithRetry<T, R>(
  fn: (payload: T) => Promise<R>,
  payload: T,
  maxRetries = 3
): Promise<R> {
  let lastError: Error | undefined
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn(payload)
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err))
      const delayMs = Math.pow(2, attempt) * 1000
      await new Promise((resolve) => setTimeout(resolve, delayMs))
    }
  }
  throw lastError
}
