'use client'

import { useVehicle } from '../vehicle/VehicleContext'
import { cn } from '@/lib/utils/cn'

interface FitmentBadgeProps {
  fits: boolean
  notes?: string | null
  className?: string
}

export function FitmentBadge({ fits, notes, className }: FitmentBadgeProps) {
  const { selectedVehicle } = useVehicle()

  if (!selectedVehicle) return null

  return (
    <div
      className={cn(
        'flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium',
        fits
          ? 'bg-green-100 text-green-800'
          : 'bg-red-100 text-red-800',
        className
      )}
      title={notes ?? undefined}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', fits ? 'bg-green-500' : 'bg-red-500')} />
      {fits ? `Fits your ${selectedVehicle.year} ${selectedVehicle.make}` : 'Does not fit your vehicle'}
      {notes && <span className="ml-1 opacity-75">· {notes}</span>}
    </div>
  )
}
