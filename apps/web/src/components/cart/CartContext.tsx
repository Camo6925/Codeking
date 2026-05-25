'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { storefrontFetch } from '@/lib/shopify/client'
import { CART_CREATE_MUTATION, CART_LINES_ADD_MUTATION, CART_LINES_REMOVE_MUTATION } from '@/lib/shopify/mutations/cart'
import { CART_QUERY } from '@/lib/shopify/queries/cart'

export interface CartLine {
  id: string
  quantity: number
  merchandise: {
    id: string
    title: string
    price: { amount: string; currencyCode: string }
    compareAtPrice?: { amount: string; currencyCode: string } | null
    product: {
      title: string
      handle: string
      images: { edges: Array<{ node: { url: string; altText?: string } }> }
    }
  }
}

export interface Cart {
  id: string
  checkoutUrl: string
  totalQuantity: number
  lines: { edges: Array<{ node: CartLine }> }
  cost: {
    subtotalAmount: { amount: string; currencyCode: string }
    totalAmount: { amount: string; currencyCode: string }
  }
}

interface CartContextValue {
  cart: Cart | null
  isOpen: boolean
  isLoading: boolean
  openCart: () => void
  closeCart: () => void
  addToCart: (variantId: string, quantity?: number) => Promise<void>
  removeFromCart: (lineId: string) => Promise<void>
}

const CartContext = createContext<CartContextValue | null>(null)
const CART_ID_KEY = 'rr:cart-id'

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Restore cart from localStorage on mount
  useEffect(() => {
    const cartId = localStorage.getItem(CART_ID_KEY)
    if (!cartId) return
    storefrontFetch<{ cart: Cart }>(CART_QUERY, { cartId })
      .then(({ cart }) => { if (cart) setCart(cart) })
      .catch(() => localStorage.removeItem(CART_ID_KEY))
  }, [])

  const addToCart = useCallback(async (merchandiseId: string, quantity = 1) => {
    setIsLoading(true)
    try {
      const cartId = cart?.id ?? localStorage.getItem(CART_ID_KEY)

      if (cartId) {
        const data = await storefrontFetch<{ cartLinesAdd: { cart: Cart } }>(
          CART_LINES_ADD_MUTATION,
          { cartId, lines: [{ merchandiseId, quantity }] }
        )
        setCart(data.cartLinesAdd.cart)
      } else {
        const data = await storefrontFetch<{ cartCreate: { cart: Cart } }>(
          CART_CREATE_MUTATION,
          { input: { lines: [{ merchandiseId, quantity }] } }
        )
        setCart(data.cartCreate.cart)
        localStorage.setItem(CART_ID_KEY, data.cartCreate.cart.id)
      }

      setIsOpen(true)
    } finally {
      setIsLoading(false)
    }
  }, [cart])

  const removeFromCart = useCallback(async (lineId: string) => {
    if (!cart) return
    setIsLoading(true)
    try {
      await storefrontFetch(CART_LINES_REMOVE_MUTATION, { cartId: cart.id, lineIds: [lineId] })
      // Re-fetch cart to get updated state
      const data = await storefrontFetch<{ cart: Cart }>(CART_QUERY, { cartId: cart.id })
      setCart(data.cart)
    } finally {
      setIsLoading(false)
    }
  }, [cart])

  return (
    <CartContext.Provider value={{
      cart,
      isOpen,
      isLoading,
      openCart: () => setIsOpen(true),
      closeCart: () => setIsOpen(false),
      addToCart,
      removeFromCart,
    }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
