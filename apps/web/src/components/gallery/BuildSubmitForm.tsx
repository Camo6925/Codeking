'use client'

import { useState } from 'react'
import { useVehicle } from '@/components/vehicle/VehicleContext'

export function BuildSubmitForm() {
  const { selectedVehicle } = useVehicle()
  const [form, setForm] = useState({
    vehicleLabel: selectedVehicle?.label ?? '',
    submitterName: '',
    submitterEmail: '',
    instagramHandle: '',
    imageUrls: '',
    caption: '',
  })
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [error, setError] = useState('')

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('submitting')
    setError('')

    const imageUrls = form.imageUrls.split('\n').map((u) => u.trim()).filter(Boolean)
    if (imageUrls.length === 0) {
      setError('Please provide at least one image URL.')
      setStatus('idle')
      return
    }

    const res = await fetch('/api/builds', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vehicleLabel: form.vehicleLabel,
        submitterName: form.submitterName,
        submitterEmail: form.submitterEmail,
        instagramHandle: form.instagramHandle || undefined,
        imageUrls,
        caption: form.caption || undefined,
        trimId: selectedVehicle?.trimId,
      }),
    })

    if (res.ok) {
      setStatus('success')
    } else {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? 'Something went wrong. Please try again.')
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <div className="rounded-xl bg-ruckus-gray-dark p-8 text-center">
        <div className="mb-3 text-4xl">🤙</div>
        <h2 className="mb-2 text-xl font-bold">Build submitted!</h2>
        <p className="text-gray-500">Your build is under review. We'll feature it in the gallery once approved.</p>
      </div>
    )
  }

  const inputClass = 'w-full rounded-md border border-ruckus-gray-mid bg-ruckus-gray-dark px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-ruckus-red'
  const labelClass = 'mb-1 block text-xs font-bold uppercase tracking-wider text-gray-500'

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className={labelClass}>Vehicle *</label>
        <input
          type="text"
          required
          value={form.vehicleLabel}
          onChange={(e) => update('vehicleLabel', e.target.value)}
          placeholder="e.g. 2022 Toyota Tacoma TRD Pro"
          className={inputClass}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Your Name *</label>
          <input
            type="text"
            required
            value={form.submitterName}
            onChange={(e) => update('submitterName', e.target.value)}
            placeholder="First Last"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Email *</label>
          <input
            type="email"
            required
            value={form.submitterEmail}
            onChange={(e) => update('submitterEmail', e.target.value)}
            placeholder="you@example.com"
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>Instagram Handle</label>
        <input
          type="text"
          value={form.instagramHandle}
          onChange={(e) => update('instagramHandle', e.target.value)}
          placeholder="@yourusername"
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass}>Image URLs * (one per line)</label>
        <textarea
          required
          rows={4}
          value={form.imageUrls}
          onChange={(e) => update('imageUrls', e.target.value)}
          placeholder="https://example.com/my-build.jpg"
          className={`${inputClass} resize-none`}
        />
        <p className="mt-1 text-xs text-gray-600">Upload photos to Imgur, Google Drive, or similar, then paste the direct image URLs.</p>
      </div>

      <div>
        <label className={labelClass}>Caption</label>
        <textarea
          rows={3}
          value={form.caption}
          onChange={(e) => update('caption', e.target.value)}
          placeholder="Tell us about your build..."
          className={`${inputClass} resize-none`}
        />
      </div>

      {error && <p className="rounded-lg bg-red-950 px-4 py-3 text-sm text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={status === 'submitting'}
        className="w-full rounded-lg bg-ruckus-red px-6 py-3 text-sm font-bold uppercase tracking-wider text-white hover:bg-ruckus-red-dark disabled:opacity-50"
      >
        {status === 'submitting' ? 'Submitting…' : 'Submit Build'}
      </button>
      <p className="text-center text-xs text-gray-700">
        By submitting you grant Ruckus Renditions permission to feature your photos in the gallery.
      </p>
    </form>
  )
}
