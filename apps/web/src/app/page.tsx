import type { Metadata } from 'next'
import { VehicleSelector } from '@/components/vehicle/VehicleSelector'

export const metadata: Metadata = {
  title: 'Ruckus Renditions | Built for Fitment. Built for Performance.',
}

export default function HomePage() {
  return (
    <main className="min-h-screen bg-ruckus-black text-white">
      {/* Hero */}
      <section className="relative flex min-h-[80vh] flex-col items-center justify-center px-4 py-20 text-center">
        <h1 className="mb-4 text-4xl font-black uppercase tracking-tight sm:text-6xl lg:text-7xl">
          Built for Fitment.
          <br />
          <span className="text-ruckus-red">Built for Performance.</span>
        </h1>
        <p className="mb-8 max-w-xl text-lg text-gray-400">
          Wheels, suspension, and performance upgrades — precisely matched to your vehicle.
        </p>

        {/* Vehicle Selector CTA */}
        <div className="w-full max-w-sm rounded-xl bg-ruckus-gray-dark p-6">
          <p className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400">
            Start with your vehicle
          </p>
          <VehicleSelector />
        </div>
      </section>

      {/* Categories */}
      <section className="px-4 py-16">
        <h2 className="mb-8 text-center text-2xl font-bold uppercase tracking-tight">
          Shop by Category
        </h2>
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: 'Wheels', href: '/wheels', emoji: '⚙️' },
            { label: 'Suspension', href: '/suspension', emoji: '🔩' },
            { label: 'Performance', href: '/performance', emoji: '🏎️' },
            { label: 'Lighting', href: '/lighting', emoji: '💡' },
          ].map((cat) => (
            <a
              key={cat.href}
              href={cat.href}
              className="flex flex-col items-center rounded-xl bg-ruckus-gray-dark p-6 text-center transition-colors hover:bg-ruckus-gray-mid"
            >
              <span className="mb-2 text-3xl">{cat.emoji}</span>
              <span className="font-semibold">{cat.label}</span>
            </a>
          ))}
        </div>
      </section>

      {/* Tagline */}
      <section className="border-t border-ruckus-gray-mid px-4 py-12 text-center">
        <p className="text-xl font-bold uppercase tracking-widest text-ruckus-red">
          Bring the Ruckus.
        </p>
      </section>
    </main>
  )
}
