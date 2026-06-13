'use client'

import { useState, useEffect } from 'react'
import { useVehicle } from '@/components/vehicle/VehicleContext'
import type { FitmentProduct, FitmentQueryResult } from '@/lib/fitment/query'

interface UseFitmentOptions {
  categorySlug?: string
  limit?: number
}

interface UseFitmentResult {
  products: FitmentProduct[]
  total: number
  page: number
  totalPages: number
  hasNextPage: boolean
  loading: boolean
  error: string | null
  loadMore: () => void
}

export function useFitment({ categorySlug, limit = 24 }: UseFitmentOptions = {}): UseFitmentResult {
  const { selectedVehicle } = useVehicle()
  const [products, setProducts] = useState<FitmentProduct[]>([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const trimId = selectedVehicle?.trimId

  useEffect(() => {
    if (!trimId) { setProducts([]); setTotal(0); return }

    setLoading(true)
    setError(null)

    const sp = new URLSearchParams({ trimId: String(trimId), page: String(page), limit: String(limit) })
    if (categorySlug) sp.set('categorySlug', categorySlug)

    fetch(`/api/fitment?${sp}`)
      .then((r) => {
        if (!r.ok) throw new Error(`Fitment query failed: ${r.status}`)
        return r.json() as Promise<FitmentQueryResult>
      })
      .then((data) => {
        setProducts((prev) => page === 1 ? data.products : [...prev, ...data.products])
        setTotal(data.pagination.total)
        setTotalPages(data.pagination.totalPages)
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [trimId, categorySlug, page, limit])

  // Reset to page 1 when vehicle or category changes
  useEffect(() => { setPage(1); setProducts([]) }, [trimId, categorySlug])

  return {
    products,
    total,
    page,
    totalPages,
    hasNextPage: page < totalPages,
    loading,
    error,
    loadMore: () => setPage((p) => p + 1),
  }
}
