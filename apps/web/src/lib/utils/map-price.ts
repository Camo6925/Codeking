// MAP (Minimum Advertised Price) enforcement utilities.
// MAP is a contractual floor set by the brand — we may not display or
// advertise a price below this value, though the actual sale price at checkout
// can sometimes be lower (brand-dependent — assume display floor = sale floor).

export function enforceMAPCents(displayPriceCents: number, mapPriceCents: number | null | undefined): number {
  if (!mapPriceCents) return displayPriceCents
  return Math.max(displayPriceCents, mapPriceCents)
}

export function formatPrice(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100)
}

export function parsePriceCents(shopifyAmount: string): number {
  return Math.round(parseFloat(shopifyAmount) * 100)
}

// Validate that a discount code/amount would not push the price below MAP
export function isDiscountMAPCompliant(
  originalCents: number,
  discountCents: number,
  mapPriceCents: number | null | undefined
): boolean {
  if (!mapPriceCents) return true
  return originalCents - discountCents >= mapPriceCents
}
