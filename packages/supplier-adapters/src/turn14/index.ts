import type {
  SupplierAdapter,
  CatalogItem,
  SupplierOrderPayload,
  SupplierOrderConfirmation,
  TrackingUpdate,
  AvailabilityMap,
} from '../types'

const API_BASE = process.env.TURN14_API_BASE_URL ?? 'https://api.turn14.com/v1'
const API_KEY = process.env.TURN14_API_KEY

function turn14Headers() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${API_KEY ?? ''}`,
  }
}

export const turn14Adapter: SupplierAdapter = {
  supplierId: '',
  adapterKey: 'turn14',

  async fetchCatalogDelta(since: Date): Promise<CatalogItem[]> {
    const res = await fetch(
      `${API_BASE}/products?updated_since=${since.toISOString()}&limit=1000`,
      { headers: turn14Headers() }
    )
    if (!res.ok) throw new Error(`Turn 14 catalog delta failed: ${res.status}`)
    const data = await res.json()
    return mapTurn14Catalog(data.data ?? [])
  },

  async *fetchFullCatalog(): AsyncGenerator<CatalogItem> {
    let cursor: string | null = null
    do {
      const url = cursor
        ? `${API_BASE}/products?cursor=${cursor}&limit=500`
        : `${API_BASE}/products?limit=500`
      const res = await fetch(url, { headers: turn14Headers() })
      if (!res.ok) throw new Error(`Turn 14 full catalog failed: ${res.status}`)
      const data = await res.json()
      const items = mapTurn14Catalog(data.data ?? [])
      for (const item of items) yield item
      cursor = data.meta?.nextCursor ?? null
    } while (cursor)
  },

  async submitOrder(payload: SupplierOrderPayload): Promise<SupplierOrderConfirmation> {
    const body = {
      po_number: payload.poReference,
      ship_to: {
        name: payload.shippingAddress.name,
        address_1: payload.shippingAddress.address1,
        address_2: payload.shippingAddress.address2,
        city: payload.shippingAddress.city,
        state: payload.shippingAddress.province,
        postal_code: payload.shippingAddress.zip,
        country_code: payload.shippingAddress.country,
      },
      items: payload.lineItems.map((li) => ({
        sku: li.supplierPartNum,
        qty: li.quantity,
      })),
    }

    const res = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: turn14Headers(),
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const text = await res.text()
      throw new Error(`Turn 14 order submission failed: ${res.status} — ${text}`)
    }

    const data = await res.json()
    return {
      supplierPoNumber: data.data.order_number,
      status: data.data.status === 'accepted' ? 'confirmed' : 'pending',
    }
  },

  async cancelOrder(supplierPoNumber: string): Promise<boolean> {
    const res = await fetch(`${API_BASE}/orders/${supplierPoNumber}`, {
      method: 'DELETE',
      headers: turn14Headers(),
    })
    return res.ok
  },

  async getTrackingStatus(supplierPoNumber: string): Promise<TrackingUpdate[]> {
    const res = await fetch(`${API_BASE}/orders/${supplierPoNumber}/tracking`, {
      headers: turn14Headers(),
    })
    if (!res.ok) return []
    const data = await res.json()
    return (data.data ?? []).map(
      (t: Record<string, unknown>): TrackingUpdate => ({
        carrier: String(t.carrier ?? ''),
        trackingNumber: String(t.tracking_number ?? ''),
        trackingUrl: t.tracking_url ? String(t.tracking_url) : undefined,
        status: mapTurn14Status(String(t.status ?? '')),
        estimatedDelivery: t.estimated_delivery
          ? new Date(String(t.estimated_delivery))
          : undefined,
        deliveredAt: t.delivered_at ? new Date(String(t.delivered_at)) : undefined,
      })
    )
  },

  async checkAvailability(partNumbers: string[]): Promise<AvailabilityMap> {
    const result: AvailabilityMap = {}
    // Turn 14 requires individual lookups per SKU
    await Promise.all(
      partNumbers.map(async (sku) => {
        const res = await fetch(`${API_BASE}/products/${sku}/inventory`, {
          headers: turn14Headers(),
        })
        if (!res.ok) return
        const data = await res.json()
        result[sku] = {
          qtyAvailable: data.data?.qty_available ?? 0,
          warehouseCode: data.data?.warehouse,
        }
      })
    )
    return result
  },
}

function mapTurn14Catalog(raw: Record<string, unknown>[]): CatalogItem[] {
  return raw.map((p) => ({
    partNumber: String(p.part_number ?? ''),
    supplierPartNum: String(p.sku ?? p.part_number ?? ''),
    name: String(p.name ?? ''),
    brandName: String(p.brand?.name ?? ''),
    categorySlug: String(p.category?.slug ?? 'wheels'),
    upc: p.upc ? String(p.upc) : undefined,
    costCents: Math.round(Number(p.pricing?.cost ?? 0) * 100),
    msrpCents: p.pricing?.retail ? Math.round(Number(p.pricing.retail) * 100) : undefined,
    mapPriceCents: p.pricing?.map ? Math.round(Number(p.pricing.map) * 100) : undefined,
    imageUrls: Array.isArray(p.images) ? (p.images as string[]) : [],
    attributes: (p.dimensions as Record<string, string>) ?? {},
  }))
}

function mapTurn14Status(status: string): TrackingUpdate['status'] {
  const map: Record<string, TrackingUpdate['status']> = {
    shipped: 'in_transit',
    in_transit: 'in_transit',
    out_for_delivery: 'out_for_delivery',
    delivered: 'delivered',
    exception: 'exception',
  }
  return map[status.toLowerCase()] ?? 'in_transit'
}
