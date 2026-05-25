// Shared types and interface for all supplier adapters.
// Every supplier adapter must implement SupplierAdapter.

export interface CatalogItem {
  partNumber: string
  supplierPartNum: string
  supplierSku?: string
  name: string
  brandName: string
  categorySlug: string
  description?: string
  upc?: string
  msrpCents?: number
  mapPriceCents?: number
  costCents: number
  weightLbs?: number
  imageUrls?: string[]
  // PIES attributes (wheel-specific and generic)
  attributes?: Record<string, string>
  // ACES fitment application references
  fitmentApplications?: AcesApplication[]
  variants?: CatalogVariant[]
}

export interface CatalogVariant {
  supplierPartNum: string
  diameter?: string
  width?: string
  finish?: string
  boltPattern?: string
  offset?: string
  priceCents: number
  upc?: string
}

export interface AcesApplication {
  acesBaseVehicleId: number
  notes?: string
}

export interface SupplierOrderPayload {
  internalOrderId: string
  shopifyOrderName: string
  poReference: string
  shippingAddress: ShippingAddress
  customerEmail: string
  lineItems: SupplierOrderLineItem[]
}

export interface SupplierOrderLineItem {
  supplierPartNum: string
  quantity: number
  unitCostCents: number
}

export interface ShippingAddress {
  name: string
  address1: string
  address2?: string
  city: string
  province: string
  zip: string
  country: string
  phone?: string
}

export interface SupplierOrderConfirmation {
  supplierPoNumber: string
  estimatedShipDate?: Date
  status: 'confirmed' | 'pending' | 'rejected'
  rejectionReason?: string
}

export interface TrackingUpdate {
  carrier: string
  trackingNumber: string
  trackingUrl?: string
  status: 'label_created' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'exception'
  estimatedDelivery?: Date
  deliveredAt?: Date
}

export type AvailabilityMap = Record<string, { qtyAvailable: number; warehouseCode?: string }>

export interface SupplierAdapter {
  supplierId: string
  adapterKey: string

  // Catalog sync — delta preferred for regular runs, full for initial import
  fetchCatalogDelta(since: Date): Promise<CatalogItem[]>
  fetchFullCatalog(): AsyncGenerator<CatalogItem>

  // Order lifecycle
  submitOrder(payload: SupplierOrderPayload): Promise<SupplierOrderConfirmation>
  cancelOrder(supplierPoNumber: string): Promise<boolean>

  // Tracking
  getTrackingStatus(supplierPoNumber: string): Promise<TrackingUpdate[]>

  // Optional real-time availability check (used pre-checkout)
  checkAvailability?(partNumbers: string[]): Promise<AvailabilityMap>
}
