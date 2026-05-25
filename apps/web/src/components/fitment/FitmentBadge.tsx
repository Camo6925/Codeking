'use client'

import { useEffect, useState } from 'react'
import { useVehicle } from '../vehicle/VehicleContext'

interface FitmentBadgeProps {
  productId: string
  trimId?: number | null
  className?: string
}

export function FitmentBadge({ productId, trimId: explicitTrimId, className }: FitmentBadgeProps) {
  const { selectedVehicle } = useVehicle()
  const trimId = explicitTrimId ?? selectedVehicle?.trimId
  const [fits, setFits] = useState<boolean | null>(null)

  useEffect(() => {
    if (!trimId) { setFits(null); return }
    const params = new URLSearchParams({ trimId: String(trimId), productId, limit: '1' })
    fetch(`/api/fitment?${params}`)
      .then((r) => r.json())
      .then((d) => setFits((d.products ?? []).some((p: { id: string }) => p.id === productId)))
      .catch(() => setFits(null))
  }, [productId, trimId])

  if (!trimId || fits === null) return null

  const vehicleLabel = selectedVehicle
    ? `${selectedVehicle.year} ${selectedVehicle.make}`
    : 'your vehicle'

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
        fits
          ? 'bg-green-900/60 text-green-300'
          : 'bg-red-900/60 text-red-300'
      } ${className ?? ''}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${fits ? 'bg-green-400' : 'bg-red-400'}`} />
      {fits ? `Fits ${vehicleLabel}` : `Doesn't fit ${vehicleLabel}`}
    </span>
  )
}
