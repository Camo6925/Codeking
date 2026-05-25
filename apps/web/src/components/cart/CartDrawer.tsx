'use client'

import { useCart } from './CartContext'

function formatMoney(amount: string, currency: string) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(parseFloat(amount))
}

export function CartDrawer() {
  const { cart, isOpen, isLoading, closeCart, removeFromCart } = useCart()
  const lines = cart?.lines.edges.map((e) => e.node) ?? []

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={closeCart}
          aria-hidden
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-ruckus-gray-dark shadow-2xl transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-ruckus-gray-mid px-6 py-4">
          <h2 className="text-lg font-bold uppercase tracking-tight">
            Cart {cart && cart.totalQuantity > 0 && `(${cart.totalQuantity})`}
          </h2>
          <button
            onClick={closeCart}
            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:text-white"
            aria-label="Close cart"
          >
            ✕
          </button>
        </div>

        {/* Lines */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {lines.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 text-center text-gray-500">
              <span className="text-4xl">🛒</span>
              <p className="text-sm">Your cart is empty.</p>
              <button
                onClick={closeCart}
                className="text-sm text-ruckus-red hover:underline"
              >
                Continue shopping
              </button>
            </div>
          ) : (
            <ul className="space-y-4">
              {lines.map((line) => {
                const img = line.merchandise.product.images.edges[0]?.node
                return (
                  <li key={line.id} className="flex gap-4">
                    {img && (
                      <img
                        src={img.url}
                        alt={img.altText ?? line.merchandise.product.title}
                        className="h-20 w-20 rounded-lg object-cover"
                      />
                    )}
                    <div className="flex flex-1 flex-col justify-between">
                      <div>
                        <p className="text-sm font-semibold leading-tight">
                          {line.merchandise.product.title}
                        </p>
                        {line.merchandise.title !== 'Default Title' && (
                          <p className="mt-0.5 text-xs text-gray-400">{line.merchandise.title}</p>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-ruckus-red">
                          {formatMoney(line.merchandise.price.amount, line.merchandise.price.currencyCode)}
                          {line.quantity > 1 && <span className="text-xs text-gray-400"> × {line.quantity}</span>}
                        </span>
                        <button
                          onClick={() => removeFromCart(line.id)}
                          disabled={isLoading}
                          className="text-xs text-gray-500 hover:text-ruckus-red"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {/* Footer */}
        {lines.length > 0 && cart && (
          <div className="border-t border-ruckus-gray-mid px-6 py-4 space-y-3">
            <div className="flex justify-between text-sm text-gray-400">
              <span>Subtotal</span>
              <span>{formatMoney(cart.cost.subtotalAmount.amount, cart.cost.subtotalAmount.currencyCode)}</span>
            </div>
            <div className="flex justify-between font-bold">
              <span>Total</span>
              <span>{formatMoney(cart.cost.totalAmount.amount, cart.cost.totalAmount.currencyCode)}</span>
            </div>
            <a
              href={cart.checkoutUrl}
              className="block w-full rounded-lg bg-ruckus-red px-6 py-3 text-center text-sm font-bold uppercase tracking-wider text-white hover:bg-ruckus-red-dark"
            >
              Checkout
            </a>
            <p className="text-center text-xs text-gray-600">
              Shipping, taxes, and discounts calculated at checkout.
            </p>
          </div>
        )}
      </div>
    </>
  )
}
