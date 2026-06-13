export interface FitmentQueryResult {
  products: FitmentProduct[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNextPage: boolean
  }
}

export interface FitmentProduct {
  id: string
  name: string
  slug: string
  partNumber: string
  msrp?: number | null
  mapPrice?: number | null
  images: Array<{ url: string; altText?: string | null; isPrimary: boolean }>
  variants: Array<{ price: number }>
  brand: { name: string }
  category: { slug: string; name: string }
}

export async function fetchFitmentProducts(params: {
  trimId: number
  categorySlug?: string
  page?: number
  limit?: number
}): Promise<FitmentQueryResult> {
  const sp = new URLSearchParams({
    trimId: String(params.trimId),
    page: String(params.page ?? 1),
    limit: String(params.limit ?? 24),
  })
  if (params.categorySlug) sp.set('categorySlug', params.categorySlug)

  const res = await fetch(`/api/fitment?${sp}`, { next: { tags: ['fitment'] } })
  if (!res.ok) throw new Error(`Fitment query failed: ${res.status}`)
  return res.json() as Promise<FitmentQueryResult>
}

export async function checkProductFitment(trimId: number, productId: string): Promise<boolean> {
  const sp = new URLSearchParams({ trimId: String(trimId), productId, limit: '1' })
  const res = await fetch(`/api/fitment?${sp}`)
  if (!res.ok) return false
  const data = (await res.json()) as FitmentQueryResult
  return data.products.some((p) => p.id === productId)
}
