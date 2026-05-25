'use client'

import Link from 'next/link'
import { useCart } from '@/components/cart/CartContext'
import { useVehicle } from '@/components/vehicle/VehicleContext'

export function Navbar() {
  const { cart, openCart } = useCart()
  const { selectedVehicle, setSelectedVehicle } = useVehicle()
  const itemCount = cart?.totalQuantity ?? 0

  return (
    <header className="sticky top-0 z-30 border-b border-ruckus-gray-mid bg-ruckus-black/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-black uppercase tracking-tight text-white">
            Ruckus<span className="text-ruckus-red">.</span>
          </span>
        </Link>

        {/* Category nav — hidden on mobile */}
        <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
          <Link href="/wheels" className="text-gray-400 hover:text-white transition-colors">Wheels</Link>
          <Link href="/suspension" className="text-gray-400 hover:text-white transition-colors">Suspension</Link>
          <Link href="/performance" className="text-gray-400 hover:text-white transition-colors">Performance</Link>
          <Link href="/lighting" className="text-gray-400 hover:text-white transition-colors">Lighting</Link>
          <Link href="/packages" className="text-gray-400 hover:text-white transition-colors">Packages</Link>
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* Vehicle chip */}
          {selectedVehicle ? (
            <div className="hidden items-center gap-2 rounded-full bg-ruckus-gray-dark px-3 py-1 text-xs sm:flex">
              <span className="text-ruckus-red">●</span>
              <span className="max-w-[140px] truncate text-gray-300">{selectedVehicle.label}</span>
              <button
                onClick={() => setSelectedVehicle(null)}
                className="text-gray-600 hover:text-gray-400"
                aria-label="Clear vehicle"
              >
                ✕
              </button>
            </div>
          ) : (
            <Link
              href="/"
              className="hidden rounded-full bg-ruckus-gray-dark px-3 py-1 text-xs text-gray-500 hover:text-white sm:block"
            >
              + Add vehicle
            </Link>
          )}

          {/* Search */}
          <Link href="/search" aria-label="Search" className="text-gray-400 hover:text-white p-1">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </Link>

          {/* Garage */}
          <Link href="/garage" aria-label="My Garage" className="text-gray-400 hover:text-white p-1">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </Link>

          {/* Cart */}
          <button
            onClick={openCart}
            aria-label={`Cart (${itemCount} items)`}
            className="relative text-gray-400 hover:text-white p-1"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            {itemCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-ruckus-red text-[10px] font-bold text-white">
                {itemCount > 9 ? '9+' : itemCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  )
}
