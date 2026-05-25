import type { Metadata } from 'next'
import { SearchResults } from '@/components/product/SearchResults'

export const metadata: Metadata = {
  title: 'Search',
}

export default function SearchPage({
  searchParams,
}: {
  searchParams: { q?: string }
}) {
  const q = searchParams.q ?? ''

  return (
    <main className="min-h-screen bg-ruckus-black text-white">
      <div className="mx-auto max-w-7xl px-4 py-10">
        <h1 className="mb-6 text-2xl font-black uppercase tracking-tight">Search</h1>
        <SearchResults initialQuery={q} />
      </div>
    </main>
  )
}
