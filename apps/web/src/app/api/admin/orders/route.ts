import { NextResponse } from 'next/server'
import { prisma } from '@rr/db'

function isAuthorized(request: Request): boolean {
  const secret = process.env.ADMIN_SECRET
  if (!secret) return false
  const auth = request.headers.get('Authorization')
  return auth === `Bearer ${secret}`
}

const DEFAULT_LIMIT = 50

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
  const limit = Math.min(100, parseInt(searchParams.get('limit') ?? String(DEFAULT_LIMIT), 10))
  const status = searchParams.get('status') ?? undefined
  const skip = (page - 1) * limit

  const where = status ? { status: status as Parameters<typeof prisma.order.findMany>[0]['where']['status'] } : {}

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        supplierOrders: {
          select: { status: true, supplierId: true, supplierPoNumber: true },
          include: { supplier: { select: { name: true } } },
        },
        _count: { select: { items: true } },
      },
    }),
    prisma.order.count({ where }),
  ])

  return NextResponse.json({
    orders,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  })
}
