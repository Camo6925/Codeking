import { prisma } from '@rr/db'

export const dynamic = 'force-dynamic'

async function getStats() {
  const [pendingBuilds, openOrders, lastSync] = await Promise.all([
    prisma.build.count({ where: { status: 'PENDING' } }),
    prisma.order.count({ where: { status: { in: ['NEW', 'PROCESSING'] } } }),
    prisma.catalogSyncLog.findFirst({
      where: { status: 'COMPLETED' },
      orderBy: { completedAt: 'desc' },
      select: { completedAt: true, productsCreated: true, productsUpdated: true },
    }),
  ])
  return { pendingBuilds, openOrders, lastSync }
}

const cardStyle = {
  background: '#1a1a1a',
  border: '1px solid #2a2a2a',
  borderRadius: '8px',
  padding: '24px',
  flex: 1,
}

export default async function DashboardPage() {
  const { pendingBuilds, openOrders, lastSync } = await getStats()

  return (
    <div>
      <h1 style={{ fontSize: '24px', marginBottom: '24px' }}>Dashboard</h1>
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        <div style={cardStyle}>
          <div style={{ fontSize: '36px', fontWeight: 700, color: pendingBuilds > 0 ? '#ff4c00' : '#f5f5f5' }}>{pendingBuilds}</div>
          <div style={{ color: '#999', marginTop: '4px' }}>Builds Pending Review</div>
          <a href="/builds" style={{ display: 'inline-block', marginTop: '12px', color: '#ff4c00', textDecoration: 'none', fontSize: '14px' }}>Review →</a>
        </div>
        <div style={cardStyle}>
          <div style={{ fontSize: '36px', fontWeight: 700, color: openOrders > 0 ? '#fbbf24' : '#f5f5f5' }}>{openOrders}</div>
          <div style={{ color: '#999', marginTop: '4px' }}>Open Orders</div>
          <a href="/orders" style={{ display: 'inline-block', marginTop: '12px', color: '#ff4c00', textDecoration: 'none', fontSize: '14px' }}>View →</a>
        </div>
        <div style={cardStyle}>
          <div style={{ fontSize: '14px', color: '#999' }}>Last Catalog Sync</div>
          {lastSync ? (
            <>
              <div style={{ fontSize: '16px', marginTop: '8px' }}>{lastSync.completedAt?.toLocaleDateString()}</div>
              <div style={{ fontSize: '13px', color: '#777', marginTop: '4px' }}>
                +{lastSync.productsCreated} created, {lastSync.productsUpdated} updated
              </div>
            </>
          ) : (
            <div style={{ fontSize: '14px', marginTop: '8px', color: '#f87171' }}>No sync run yet</div>
          )}
        </div>
      </div>
    </div>
  )
}
