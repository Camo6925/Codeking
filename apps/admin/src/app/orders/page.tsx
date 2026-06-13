import { prisma } from '@rr/db'

export const dynamic = 'force-dynamic'

const STATUS_COLORS: Record<string, string> = {
  NEW: '#fbbf24',
  PROCESSING: '#60a5fa',
  PARTIALLY_FULFILLED: '#a78bfa',
  FULFILLED: '#34d399',
  DELIVERED: '#22c55e',
  CANCELLED: '#9ca3af',
  REFUNDED: '#f87171',
}

async function getOrders() {
  return prisma.order.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: {
      supplierOrders: {
        include: { supplier: { select: { name: true } } },
      },
    },
  })
}

export default async function OrdersPage() {
  const orders = await getOrders()

  return (
    <div>
      <h1 style={{ fontSize: '24px', marginBottom: '24px' }}>Orders ({orders.length})</h1>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #2a2a2a', color: '#777' }}>
            <th style={{ textAlign: 'left', padding: '8px' }}>Order</th>
            <th style={{ textAlign: 'left', padding: '8px' }}>Customer</th>
            <th style={{ textAlign: 'left', padding: '8px' }}>Total</th>
            <th style={{ textAlign: 'left', padding: '8px' }}>Status</th>
            <th style={{ textAlign: 'left', padding: '8px' }}>Suppliers</th>
            <th style={{ textAlign: 'left', padding: '8px' }}>Date</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id} style={{ borderBottom: '1px solid #1a1a1a' }}>
              <td style={{ padding: '10px 8px', fontWeight: 600 }}>
                <a
                  href={`https://${process.env.NEXT_PUBLIC_SHOPIFY_DOMAIN ?? ''}/admin/orders/${o.shopifyOrderId.replace('gid://shopify/Order/', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#ff4c00', textDecoration: 'none' }}
                >
                  {o.shopifyOrderName}
                </a>
              </td>
              <td style={{ padding: '10px 8px', color: '#ccc' }}>{o.customerEmail}</td>
              <td style={{ padding: '10px 8px' }}>${(o.totalCents / 100).toFixed(2)}</td>
              <td style={{ padding: '10px 8px' }}>
                <span style={{ background: STATUS_COLORS[o.status] ?? '#555', color: '#000', borderRadius: '4px', padding: '2px 8px', fontSize: '11px', fontWeight: 700 }}>
                  {o.status}
                </span>
              </td>
              <td style={{ padding: '10px 8px', color: '#999' }}>
                {o.supplierOrders.map((so) => (
                  <div key={so.id} style={{ fontSize: '12px' }}>
                    {so.supplier.name}: <strong>{so.status}</strong>
                    {so.supplierPoNumber && ` (${so.supplierPoNumber})`}
                  </div>
                ))}
              </td>
              <td style={{ padding: '10px 8px', color: '#777' }}>
                {new Date(o.createdAt).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
