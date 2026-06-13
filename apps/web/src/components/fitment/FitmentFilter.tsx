'use client'

import { useEffect, useState } from 'react'
import { useVehicle } from '@/components/vehicle/VehicleContext'
import { ProductCard } from '@/components/product/ProductCard'

interface ProductSummary {
  id: string
  name: string
  slug: string
  partNumber: string
  msrp?: number | null
  mapPrice?: number | null
  images: Array<{ url: string; altText?: string | null; isPrimary: boolean }>
  brand: { name: string; slug: string }
  variants: Array<{ price: number }>
}

interface FitmentFilterProps {
  categorySlug: string
}

export function FitmentFilter({ categorySlug }: FitmentFilterProps) {
  const { selectedVehicle } = useVehicle()
  const [products, setProducts] = useState<ProductSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)

  const trimId = selectedVehicle?.trimId

  useEffect(() => {
    setLoading(true)
    setPage(1)
    const params = new URLSearchParams({ categorySlug, limit: '24', page: '1' })
    if (trimId) params.set('trimId', String(trimId))

    fetch(`/api/fitment?${params}`)
      .then((r) => r.json())
      .then((d) => {
        setProducts(d.products ?? [])
        setHasMore(d.hasNextPage ?? false)
      })
      .finally(() => setLoading(false))
  }, [categorySlug, trimId])

  function loadMore() {
    const nextPage = page + 1
    const params = new URLSearchParams({ categorySlug, limit: '24', page: String(nextPage) })
    if (trimId) params.set('trimId', String(trimId))

    fetch(`/api/fitment?${params}`)
      .then((r) => r.json())
      .then((d) => {
        setProducts((prev) => [...prev, ...(d.products ?? [])])
        setHasMore(d.hasNextPage ?? false)
        setPage(nextPage)
      })
  }

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="aspect-square animate-pulse rounded-xl bg-ruckus-gray-dark" />
        ))}
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="py-16 text-center text-gray-500">
        {trimId
          ? 'No products found for your vehicle. Try browsing without a vehicle filter.'
          : 'No products found in this category.'}
      </div>
    )
  }

  return (
    <div>
      {trimId && (
        <p className="mb-4 text-sm text-gray-500">
          Showing {products.length} product{products.length !== 1 ? 's' : ''} that fit your{' '}
          <span className="text-ruckus-red">{selectedVehicle!.label}</span>
        </p>
      )}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} trimId={trimId} />
        ))}
      </div>
      {hasMore && (
        <div className="mt-10 text-center">
          <button
            onClick={loadMore}
            className="rounded-lg border border-ruckus-gray-mid px-8 py-3 text-sm font-semibold uppercase tracking-wider text-gray-400 hover:border-ruckus-red hover:text-white"
          >
            Load More
          </button>
        </div>
      )}
    </div>
  )
}
