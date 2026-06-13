'use client'

import { enforceMAPCents, formatPrice } from '@/lib/utils/map-price'
import { cn } from '@/lib/utils/cn'

interface PriceDisplayProps {
  priceCents: number
  compareAtPriceCents?: number | null
  mapPriceCents?: number | null
  className?: string
}

export function PriceDisplay({
  priceCents,
  compareAtPriceCents,
  mapPriceCents,
  className,
}: PriceDisplayProps) {
  // Never display a price below MAP floor
  const displayPrice = enforceMAPCents(priceCents, mapPriceCents)
  const isOnSale = compareAtPriceCents && compareAtPriceCents > displayPrice

  return (
    <div className={cn('flex items-baseline gap-2', className)}>
      <span className={cn('text-lg font-bold', isOnSale ? 'text-ruckus-red' : 'text-gray-900')}>
        {formatPrice(displayPrice)}
      </span>
      {isOnSale && (
        <span className="text-sm text-gray-400 line-through">
          {formatPrice(compareAtPriceCents)}
        </span>
      )}
    </div>
  )
}
