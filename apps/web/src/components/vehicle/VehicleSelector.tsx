'use client'

import { useState, useEffect } from 'react'
import { useVehicle, type SelectedVehicle } from './VehicleContext'

interface VehicleSelectorProps {
  onSelect?: (vehicle: SelectedVehicle) => void
  className?: string
}

export function VehicleSelector({ onSelect, className }: VehicleSelectorProps) {
  const { setSelectedVehicle } = useVehicle()

  const [years, setYears] = useState<number[]>([])
  const [makes, setMakes] = useState<Array<{ name: string; slug: string }>>([])
  const [models, setModels] = useState<Array<{ name: string; slug: string }>>([])
  const [trims, setTrims] = useState<Array<{ id: number; name: string; boltPattern?: string | null }>>([])

  const [selectedYear, setSelectedYear] = useState('')
  const [selectedMake, setSelectedMake] = useState('')
  const [selectedModel, setSelectedModel] = useState('')
  const [selectedTrim, setSelectedTrim] = useState('')

  const [loading, setLoading] = useState(false)

  // Load years on mount
  useEffect(() => {
    fetch('/api/vehicles')
      .then((r) => r.json())
      .then((d) => setYears(d.years ?? []))
      .catch(() => {})
  }, [])

  async function handleYearChange(year: string) {
    setSelectedYear(year)
    setSelectedMake('')
    setSelectedModel('')
    setSelectedTrim('')
    setMakes([])
    setModels([])
    setTrims([])
    if (!year) return

    setLoading(true)
    try {
      const res = await fetch(`/api/vehicles/${year}`)
      const data = await res.json()
      setMakes(data.makes ?? [])
    } finally {
      setLoading(false)
    }
  }

  async function handleMakeChange(makeSlug: string) {
    setSelectedMake(makeSlug)
    setSelectedModel('')
    setSelectedTrim('')
    setModels([])
    setTrims([])
    if (!makeSlug || !selectedYear) return

    setLoading(true)
    try {
      const res = await fetch(`/api/vehicles/${selectedYear}/${makeSlug}`)
      const data = await res.json()
      setModels(data.models ?? [])
    } finally {
      setLoading(false)
    }
  }

  async function handleModelChange(modelSlug: string) {
    setSelectedModel(modelSlug)
    setSelectedTrim('')
    setTrims([])
    if (!modelSlug || !selectedYear || !selectedMake) return

    setLoading(true)
    try {
      const res = await fetch(`/api/vehicles/${selectedYear}/${selectedMake}/${modelSlug}`)
      const data = await res.json()
      setTrims(data.trims ?? [])
    } finally {
      setLoading(false)
    }
  }

  function handleTrimChange(trimId: string) {
    setSelectedTrim(trimId)
  }

  function handleConfirm() {
    const trim = trims.find((t) => String(t.id) === selectedTrim)
    const make = makes.find((m) => m.slug === selectedMake)
    const model = models.find((m) => m.slug === selectedModel)
    if (!trim || !make || !model) return

    const vehicle: SelectedVehicle = {
      trimId: trim.id,
      year: parseInt(selectedYear, 10),
      make: make.name,
      model: model.name,
      trim: trim.name,
      boltPattern: trim.boltPattern ?? undefined,
      label: `${selectedYear} ${make.name} ${model.name} ${trim.name}`,
    }

    setSelectedVehicle(vehicle)
    onSelect?.(vehicle)
  }

  const isComplete = selectedYear && selectedMake && selectedModel && selectedTrim

  return (
    <div className={`flex flex-col gap-3 ${className ?? ''}`}>
      <select
        value={selectedYear}
        onChange={(e) => handleYearChange(e.target.value)}
        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ruckus-red"
        disabled={loading}
        aria-label="Select year"
      >
        <option value="">Year</option>
        {years.map((y) => (
          <option key={y} value={y}>{y}</option>
        ))}
      </select>

      <select
        value={selectedMake}
        onChange={(e) => handleMakeChange(e.target.value)}
        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ruckus-red disabled:opacity-50"
        disabled={!selectedYear || loading}
        aria-label="Select make"
      >
        <option value="">Make</option>
        {makes.map((m) => (
          <option key={m.slug} value={m.slug}>{m.name}</option>
        ))}
      </select>

      <select
        value={selectedModel}
        onChange={(e) => handleModelChange(e.target.value)}
        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ruckus-red disabled:opacity-50"
        disabled={!selectedMake || loading}
        aria-label="Select model"
      >
        <option value="">Model</option>
        {models.map((m) => (
          <option key={m.slug} value={m.slug}>{m.name}</option>
        ))}
      </select>

      <select
        value={selectedTrim}
        onChange={(e) => handleTrimChange(e.target.value)}
        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ruckus-red disabled:opacity-50"
        disabled={!selectedModel || loading}
        aria-label="Select trim"
      >
        <option value="">Trim</option>
        {trims.map((t) => (
          <option key={t.id} value={String(t.id)}>{t.name}</option>
        ))}
      </select>

      <button
        onClick={handleConfirm}
        disabled={!isComplete || loading}
        className="w-full rounded-md bg-ruckus-red px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-ruckus-red-dark disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? 'Loading...' : 'Find Parts for My Vehicle'}
      </button>
    </div>
  )
}
