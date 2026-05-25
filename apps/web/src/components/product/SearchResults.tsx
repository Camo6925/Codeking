'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ProductCard } from './ProductCard'
import { useVehicle } from '@/components/vehicle/VehicleContext'

interface Product {
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

export function SearchResults({ initialQuery }: { initialQuery: string }) {
  const router = useRouter()
  const { selectedVehicle } = useVehicle()
  const [query, setQuery] = useState(initialQuery)
  const [results, setResults] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  const doSearch = useCallback(async (q: string) => {
    if (!q || q.trim().length < 2) { setResults([]); setSearched(false); return }
    setLoading(true)
    const params = new URLSearchParams({ q: q.trim() })
    if (selectedVehicle?.trimId) params.set('trimId', String(selectedVehicle.trimId))
    const res = await fetch(`/api/search?${params}`)
    const data = await res.json()
    setResults(data.products ?? [])
    setSearched(true)
    setLoading(false)
    router.replace(`/search?q=${encodeURIComponent(q.trim())}`, { scroll: false })
  }, [selectedVehicle, router])

  // Run search for initial query
  useEffect(() => {
    if (initialQuery) doSearch(initialQuery)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    doSearch(query)
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="mb-8 flex gap-3">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by part name, number, or keyword…"
          className="flex-1 rounded-lg border border-ruckus-gray-mid bg-ruckus-gray-dark px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-ruckus-red"
          autoFocus
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-ruckus-red px-6 py-3 text-sm font-bold text-white hover:bg-ruckus-red-dark disabled:opacity-50"
        >
          Search
        </button>
      </form>

      {selectedVehicle && (
        <p className="mb-4 text-sm text-gray-500">
          Filtering for <span className="text-ruckus-red">{selectedVehicle.label}</span>
        </p>
      )}

      {loading && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="aspect-square animate-pulse rounded-xl bg-ruckus-gray-dark" />
          ))}
        </div>
      )}

      {!loading && searched && results.length === 0 && (
        <p className="py-12 text-center text-gray-600">No products found for "{query}".</p>
      )}

      {!loading && results.length > 0 && (
        <>
          <p className="mb-4 text-sm text-gray-600">{results.length} result{results.length !== 1 ? 's' : ''}</p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {results.map((p) => (
              <ProductCard key={p.id} product={p} trimId={selectedVehicle?.trimId} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
