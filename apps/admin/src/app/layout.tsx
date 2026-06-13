import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Ruckus Renditions — Admin',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: 'system-ui, sans-serif', margin: 0, background: '#0f0f0f', color: '#f5f5f5' }}>
        <nav style={{ background: '#1a1a1a', borderBottom: '1px solid #2a2a2a', padding: '12px 24px', display: 'flex', gap: '24px', alignItems: 'center' }}>
          <span style={{ fontWeight: 700, fontSize: '16px', color: '#ff4c00' }}>RUCKUS ADMIN</span>
          <a href="/" style={{ color: '#ccc', textDecoration: 'none', fontSize: '14px' }}>Dashboard</a>
          <a href="/builds" style={{ color: '#ccc', textDecoration: 'none', fontSize: '14px' }}>Builds</a>
          <a href="/orders" style={{ color: '#ccc', textDecoration: 'none', fontSize: '14px' }}>Orders</a>
        </nav>
        <main style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
          {children}
        </main>
      </body>
    </html>
  )
}
