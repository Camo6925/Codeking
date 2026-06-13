import type { Metadata } from 'next'
import { GarageClient } from '@/components/vehicle/GarageClient'

export const metadata: Metadata = {
  title: 'My Garage',
  description: 'Your saved vehicles for quick fitment filtering.',
}

export default function GaragePage() {
  return (
    <main className="min-h-screen bg-ruckus-black text-white">
      <div className="mx-auto max-w-2xl px-4 py-10">
        <h1 className="mb-2 text-3xl font-black uppercase tracking-tight">My Garage</h1>
        <p className="mb-8 text-gray-500">Save your vehicles for instant fitment filtering.</p>
        <GarageClient />
      </div>
    </main>
  )
}
