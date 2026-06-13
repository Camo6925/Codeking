import type { Metadata } from 'next'
import { VehicleSelector } from '@/components/vehicle/VehicleSelector'
import { FitmentFilter } from '@/components/fitment/FitmentFilter'

export const metadata: Metadata = {
  title: 'Lighting',
  description: 'LED light bars, headlights, fog lights and more for off-road and street use.',
}

export default function LightingPage() {
  return (
    <main className="min-h-screen bg-ruckus-black text-white">
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="mb-8 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tight">Lighting</h1>
            <p className="mt-1 text-gray-500">LED bars, headlights, and off-road lighting.</p>
          </div>
          <div className="w-full max-w-xs">
            <VehicleSelector compact />
          </div>
        </div>
        <FitmentFilter categorySlug="lighting" />
      </div>
    </main>
  )
}
