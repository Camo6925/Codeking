'use client'

import { useState } from 'react'
import { enforceMAPCents } from '@/lib/utils/map-price'
import { AddToCartButton } from './AddToCartButton'

interface Variant {
  id: string
  diameter?: string | null
  width?: string | null
  finish?: string | null
  boltPattern?: string | null
  offset?: string | null
  price: number
  shopifyVariantId?: string | null
  availabilityStatus: string
}

interface VariantSelectorProps {
  variants: Variant[]
  mapPrice?: number | null
}

function formatCents(cents: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100)
}

export function VariantSelector({ variants, mapPrice }: VariantSelectorProps) {
  const [selectedId, setSelectedId] = useState('')
  const selected = variants.find((v) => v.id === selectedId)
  const displayPrice = selected
    ? enforceMAPCents(selected.price, mapPrice ?? undefined)
    : null

  return (
    <div className="space-y-3">
      <select
        value={selectedId}
        onChange={(e) => setSelectedId(e.target.value)}
        className="w-full rounded-md border border-ruckus-gray-mid bg-ruckus-gray-dark px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-ruckus-red"
      >
        <option value="">Select a variant</option>
        {variants.map((v) => (
          <option key={v.id} value={v.id} disabled={v.availabilityStatus === 'OUT_OF_STOCK'}>
            {[v.diameter, v.width, v.finish, v.offset].filter(Boolean).join(' / ')}
            {v.availabilityStatus === 'OUT_OF_STOCK' ? ' — Out of Stock' : ''}
            {' '}— {formatCents(enforceMAPCents(v.price, mapPrice ?? undefined))}
          </option>
        ))}
      </select>
      {selected && displayPrice != null && (
        <p className="text-xl font-bold text-ruckus-red">{formatCents(displayPrice)}</p>
      )}
      <AddToCartButton
        shopifyVariantId={selected?.shopifyVariantId ?? ''}
        disabled={!selected || !selected.shopifyVariantId || selected.availabilityStatus === 'OUT_OF_STOCK'}
      />
    </div>
  )
}
