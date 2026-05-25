'use client'

import { useEffect, useState } from 'react'

interface Build {
  id: string
  vehicleLabel: string
  submitterName: string
  submitterEmail: string
  instagramHandle?: string
  imageUrls: string[]
  caption?: string
  status: string
  createdAt: string
}

const rowStyle = {
  background: '#1a1a1a',
  border: '1px solid #2a2a2a',
  borderRadius: '8px',
  padding: '16px',
  marginBottom: '12px',
}

const btnStyle = (color: string) => ({
  background: color,
  color: '#fff',
  border: 'none',
  borderRadius: '6px',
  padding: '8px 16px',
  cursor: 'pointer',
  fontSize: '13px',
  fontWeight: 600,
})

export default function BuildsPage() {
  const [builds, setBuilds] = useState<Build[]>([])
  const [loading, setLoading] = useState(true)
  const [working, setWorking] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/builds')
      .then((r) => r.json())
      .then((d) => setBuilds(d.builds ?? []))
      .finally(() => setLoading(false))
  }, [])

  async function act(id: string, action: 'approve' | 'reject') {
    setWorking(id)
    await fetch(`/api/admin/builds/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.NEXT_PUBLIC_ADMIN_SECRET ?? ''}` },
      body: JSON.stringify({ action }),
    })
    setBuilds((prev) => prev.filter((b) => b.id !== id))
    setWorking(null)
  }

  if (loading) return <p>Loading...</p>

  return (
    <div>
      <h1 style={{ fontSize: '24px', marginBottom: '24px' }}>Build Gallery — Pending Review ({builds.length})</h1>
      {builds.length === 0 && <p style={{ color: '#777' }}>No pending builds.</p>}
      {builds.map((b) => (
        <div key={b.id} style={rowStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontWeight: 600 }}>{b.vehicleLabel}</div>
              <div style={{ color: '#999', fontSize: '13px', marginTop: '2px' }}>
                {b.submitterName} · {b.submitterEmail}
                {b.instagramHandle && <span> · @{b.instagramHandle}</span>}
              </div>
              {b.caption && <div style={{ marginTop: '8px', fontSize: '14px', color: '#ccc' }}>{b.caption}</div>}
              <div style={{ marginTop: '8px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {b.imageUrls.slice(0, 3).map((url, i) => (
                  <img key={i} src={url} alt="" style={{ width: '80px', height: '60px', objectFit: 'cover', borderRadius: '4px' }} />
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexShrink: 0, marginLeft: '16px' }}>
              <button
                style={btnStyle('#22c55e')}
                onClick={() => act(b.id, 'approve')}
                disabled={working === b.id}
              >
                Approve
              </button>
              <button
                style={btnStyle('#ef4444')}
                onClick={() => act(b.id, 'reject')}
                disabled={working === b.id}
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
