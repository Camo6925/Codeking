import type {
  SupplierAdapter,
  CatalogItem,
  SupplierOrderPayload,
  SupplierOrderConfirmation,
  TrackingUpdate,
  AvailabilityMap,
} from '../types'

const API_BASE = process.env.KEYSTONE_API_BASE_URL ?? 'https://api.keystoneautomotive.com/v2'
const ACCOUNT = process.env.KEYSTONE_ACCOUNT_NUMBER
const API_KEY = process.env.KEYSTONE_API_KEY

function keystoneHeaders() {
  return {
    'Content-Type': 'application/json',
    'X-Account-Number': ACCOUNT ?? '',
    'X-Api-Key': API_KEY ?? '',
  }
}

export const keystoneAdapter: SupplierAdapter = {
  supplierId: '', // set at runtime via db lookup
  adapterKey: 'keystone',

  // Keystone delivers nightly ACES/PIES files via FTP.
  // The catalog-sync service handles FTP download + parsing separately.
  // This method is the fallback REST-based delta for mid-day refreshes.
  async fetchCatalogDelta(since: Date): Promise<CatalogItem[]> {
    const url = `${API_BASE}/products?updated_since=${since.toISOString()}`
    const res = await fetch(url, { headers: keystoneHeaders() })
    if (!res.ok) throw new Error(`Keystone catalog delta failed: ${res.status} ${res.statusText}`)
    const data = await res.json() as Record<string, unknown>
    return mapKeystoneCatalog((data.products as Record<string, unknown>[] | undefined) ?? [])
  },

  async *fetchFullCatalog(): AsyncGenerator<CatalogItem> {
    // Full catalog is handled via FTP ACES/PIES file download in catalog-sync pipeline.
    // This REST path pages through products as a fallback.
    let page = 1
    while (true) {
      const res = await fetch(`${API_BASE}/products?page=${page}&limit=500`, {
        headers: keystoneHeaders(),
      })
      if (!res.ok) throw new Error(`Keystone full catalog page ${page} failed`)
      const data = await res.json() as Record<string, unknown>
      const items: CatalogItem[] = mapKeystoneCatalog((data.products as Record<string, unknown>[] | undefined) ?? [])
      for (const item of items) yield item
      if (!data.hasNextPage) break
      page++
    }
  },

  async submitOrder(payload: SupplierOrderPayload): Promise<SupplierOrderConfirmation> {
    const body = {
      purchaseOrderNumber: payload.poReference,
      shipTo: {
        name: payload.shippingAddress.name,
        address1: payload.shippingAddress.address1,
        address2: payload.shippingAddress.address2,
        city: payload.shippingAddress.city,
        state: payload.shippingAddress.province,
        zip: payload.shippingAddress.zip,
        country: payload.shippingAddress.country,
        phone: payload.shippingAddress.phone,
      },
      lines: payload.lineItems.map((li) => ({
        partNumber: li.supplierPartNum,
        quantity: li.quantity,
      })),
    }

    const res = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: keystoneHeaders(),
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const text = await res.text()
      throw new Error(`Keystone order submission failed: ${res.status} — ${text}`)
    }

    const data = await res.json() as Record<string, unknown>
    return {
      supplierPoNumber: String(data.orderNumber ?? ''),
      estimatedShipDate: data.estimatedShipDate ? new Date(String(data.estimatedShipDate)) : undefined,
      status: 'confirmed',
    }
  },

  async cancelOrder(supplierPoNumber: string): Promise<boolean> {
    const res = await fetch(`${API_BASE}/orders/${supplierPoNumber}/cancel`, {
      method: 'POST',
      headers: keystoneHeaders(),
    })
    return res.ok
  },

  async getTrackingStatus(supplierPoNumber: string): Promise<TrackingUpdate[]> {
    const res = await fetch(`${API_BASE}/orders/${supplierPoNumber}/status`, {
      headers: keystoneHeaders(),
    })
    if (!res.ok) return []
    const data = await res.json() as Record<string, unknown>
    return ((data.shipments as Record<string, unknown>[] | undefined) ?? []).map(
      (s: Record<string, unknown>): TrackingUpdate => ({
        carrier: String(s.carrier ?? ''),
        trackingNumber: String(s.trackingNumber ?? ''),
        trackingUrl: s.trackingUrl ? String(s.trackingUrl) : undefined,
        status: mapKeystoneStatus(String(s.status ?? '')),
      })
    )
  },

  async checkAvailability(partNumbers: string[]): Promise<AvailabilityMap> {
    const res = await fetch(`${API_BASE}/inventory`, {
      method: 'POST',
      headers: keystoneHeaders(),
      body: JSON.stringify({ partNumbers }),
    })
    if (!res.ok) return {}
    const data = await res.json() as Record<string, unknown>
    const result: AvailabilityMap = {}
    for (const item of (data.items as Record<string, unknown>[] | undefined) ?? []) {
      const partNumber = String(item.partNumber ?? '')
      result[partNumber] = {
        qtyAvailable: Number(item.quantityAvailable ?? 0),
        warehouseCode: item.warehouseCode ? String(item.warehouseCode) : undefined,
      }
    }
    return result
  },
}

function mapKeystoneCatalog(raw: Record<string, unknown>[]): CatalogItem[] {
  return raw.map((p) => ({
    partNumber: String(p.partNumber ?? ''),
    supplierPartNum: String(p.keystonePartNumber ?? p.partNumber ?? ''),
    name: String(p.description ?? ''),
    brandName: String(p.brandName ?? ''),
    categorySlug: String(p.categorySlug ?? 'wheels'),
    upc: p.upc ? String(p.upc) : undefined,
    costCents: Math.round(Number(p.cost ?? 0) * 100),
    msrpCents: p.msrp ? Math.round(Number(p.msrp) * 100) : undefined,
    attributes: (p.attributes as Record<string, string>) ?? {},
  }))
}

function mapKeystoneStatus(status: string): TrackingUpdate['status'] {
  const map: Record<string, TrackingUpdate['status']> = {
    SHIPPED: 'in_transit',
    IN_TRANSIT: 'in_transit',
    OUT_FOR_DELIVERY: 'out_for_delivery',
    DELIVERED: 'delivered',
    EXCEPTION: 'exception',
  }
  return map[status.toUpperCase()] ?? 'in_transit'
}
