import { NextResponse } from 'next/server'
import { prisma } from '@rr/db'

const DEFAULT_LIMIT = 20
const MAX_LIMIT = 50

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = (searchParams.get('q') ?? '').trim()
  const trimId = searchParams.get('trimId') ? parseInt(searchParams.get('trimId')!, 10) : undefined
  const limit = Math.min(MAX_LIMIT, parseInt(searchParams.get('limit') ?? String(DEFAULT_LIMIT), 10))

  if (!q || q.length < 2) {
    return NextResponse.json({ products: [] })
  }

  // When trimId is provided, restrict to products with fitment for that vehicle
  const fitmentFilter = trimId && !isNaN(trimId)
    ? {
        fitmentApplications: {
          some: { trimId },
        },
      }
    : {}

  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      ...fitmentFilter,
      OR: [
        { name: { contains: q, mode: 'insensitive' } },
        { partNumber: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ],
    },
    take: limit,
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      slug: true,
      partNumber: true,
      msrp: true,
      mapPrice: true,
      images: {
        where: { isPrimary: true },
        take: 1,
        select: { url: true, altText: true },
      },
      brand: { select: { name: true, slug: true } },
      category: { select: { name: true, slug: true } },
    },
  })

  return NextResponse.json({ products, query: q })
}
