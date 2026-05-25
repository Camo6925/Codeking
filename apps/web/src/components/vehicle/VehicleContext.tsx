'use client'

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'

export interface SelectedVehicle {
  trimId: number
  year: number
  make: string
  model: string
  trim: string
  boltPattern?: string
  label: string // "2022 Toyota Tacoma TRD Pro"
}

interface VehicleContextValue {
  selectedVehicle: SelectedVehicle | null
  setSelectedVehicle: (vehicle: SelectedVehicle | null) => void
  clearVehicle: () => void
}

const VehicleContext = createContext<VehicleContextValue | null>(null)

const STORAGE_KEY = 'rr:selected-vehicle'

export function VehicleProvider({ children }: { children: ReactNode }) {
  const [selectedVehicle, setSelectedVehicleState] = useState<SelectedVehicle | null>(null)

  // Restore from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) setSelectedVehicleState(JSON.parse(stored))
    } catch {
      // Ignore parse errors
    }
  }, [])

  function setSelectedVehicle(vehicle: SelectedVehicle | null) {
    setSelectedVehicleState(vehicle)
    if (vehicle) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(vehicle))
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  }

  return (
    <VehicleContext.Provider
      value={{ selectedVehicle, setSelectedVehicle, clearVehicle: () => setSelectedVehicle(null) }}
    >
      {children}
    </VehicleContext.Provider>
  )
}

export function useVehicle() {
  const ctx = useContext(VehicleContext)
  if (!ctx) throw new Error('useVehicle must be used within VehicleProvider')
  return ctx
}
