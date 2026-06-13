'use client'

import { useState } from 'react'
import { useCart } from '@/components/cart/CartContext'

interface AddToCartButtonProps {
  shopifyVariantId: string
  disabled?: boolean
  className?: string
}

export function AddToCartButton({ shopifyVariantId, disabled, className }: AddToCartButtonProps) {
  const { addToCart, isLoading } = useCart()
  const [added, setAdded] = useState(false)

  async function handleClick() {
    if (!shopifyVariantId || disabled || isLoading) return
    await addToCart(shopifyVariantId)
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  return (
    <button
      onClick={handleClick}
      disabled={disabled || isLoading || !shopifyVariantId}
      className={
        className ??
        'w-full rounded-lg bg-ruckus-red px-6 py-3 text-center text-sm font-bold uppercase tracking-wider text-white transition-colors hover:bg-ruckus-red-dark disabled:cursor-not-allowed disabled:opacity-50'
      }
    >
      {isLoading ? 'Adding…' : added ? '✓ Added to Cart' : disabled ? 'Out of Stock' : 'Add to Cart'}
    </button>
  )
}
