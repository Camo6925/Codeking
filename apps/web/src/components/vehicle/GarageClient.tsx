'use client'

import { useVehicle } from './VehicleContext'
import { VehicleSelector } from './VehicleSelector'
import Link from 'next/link'

export function GarageClient() {
  const { selectedVehicle, setSelectedVehicle } = useVehicle()

  return (
    <div className="space-y-6">
      {/* Current vehicle */}
      {selectedVehicle ? (
        <div className="rounded-xl border border-ruckus-red/30 bg-ruckus-gray-dark p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-ruckus-red">Active Vehicle</p>
              <p className="mt-1 text-lg font-bold">{selectedVehicle.label}</p>
              {selectedVehicle.boltPattern && (
                <p className="mt-0.5 text-xs text-gray-500">Bolt pattern: {selectedVehicle.boltPattern}</p>
              )}
            </div>
            <button
              onClick={() => setSelectedVehicle(null)}
              className="text-sm text-gray-600 hover:text-ruckus-red"
            >
              Remove
            </button>
          </div>
          <div className="mt-4 flex gap-3 flex-wrap">
            <Link
              href="/wheels"
              className="rounded-lg bg-ruckus-red px-4 py-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-ruckus-red-dark"
            >
              Shop Wheels
            </Link>
            <Link
              href="/suspension"
              className="rounded-lg border border-ruckus-gray-mid px-4 py-2 text-xs font-bold uppercase tracking-wider text-gray-400 hover:text-white"
            >
              Shop Suspension
            </Link>
            <Link
              href="/packages"
              className="rounded-lg border border-ruckus-gray-mid px-4 py-2 text-xs font-bold uppercase tracking-wider text-gray-400 hover:text-white"
            >
              Browse Packages
            </Link>
          </div>
        </div>
      ) : (
        <div className="rounded-xl bg-ruckus-gray-dark p-5 text-center text-sm text-gray-600">
          No vehicle saved. Add one below to get fitment-matched products.
        </div>
      )}

      {/* Add / switch vehicle */}
      <div className="rounded-xl bg-ruckus-gray-dark p-5">
        <p className="mb-4 text-sm font-bold uppercase tracking-wider text-gray-500">
          {selectedVehicle ? 'Switch Vehicle' : 'Add a Vehicle'}
        </p>
        <VehicleSelector />
      </div>
    </div>
  )
}
