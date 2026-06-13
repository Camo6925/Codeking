import type {
  SupplierAdapter,
  CatalogItem,
  SupplierOrderPayload,
  SupplierOrderConfirmation,
  TrackingUpdate,
} from '../types'

// Meyer Distributing uses EDI (850/855/856/810) and SFTP for catalog files.
// This adapter is a stub — full EDI implementation requires AS2 gateway setup.
// Orders fall back to email until EDI adapter is complete.

export const meyerAdapter: SupplierAdapter = {
  supplierId: '',
  adapterKey: 'meyer',

  async fetchCatalogDelta(_since: Date): Promise<CatalogItem[]> {
    // Meyer provides EDI 832 catalog files via SFTP.
    // The catalog-sync service handles SFTP download + EDI parsing separately.
    // This stub returns empty until the EDI parser is wired up.
    console.warn('[Meyer] fetchCatalogDelta: EDI 832 parser not yet implemented')
    return []
  },

  async *fetchFullCatalog(): AsyncGenerator<CatalogItem, void> {
    console.warn('[Meyer] fetchFullCatalog: EDI 832 parser not yet implemented')
  },

  async submitOrder(payload: SupplierOrderPayload): Promise<SupplierOrderConfirmation> {
    // Until EDI 850 is implemented, log order details for manual email submission.
    // Ops team receives alert and emails the order form to Meyer.
    console.error('[Meyer] Manual order required — EDI 850 not yet implemented', {
      poReference: payload.poReference,
      shopifyOrderName: payload.shopifyOrderName,
      lineItems: payload.lineItems,
    })
    throw new Error(
      `Meyer EDI 850 not implemented. Manual order required for ${payload.shopifyOrderName}`
    )
  },

  async cancelOrder(supplierPoNumber: string): Promise<boolean> {
    console.error(`[Meyer] Manual cancellation required for PO ${supplierPoNumber}`)
    return false
  },

  async getTrackingStatus(_supplierPoNumber: string): Promise<TrackingUpdate[]> {
    // EDI 856 ASN provides tracking. Stub until EDI parser ready.
    return []
  },
}
