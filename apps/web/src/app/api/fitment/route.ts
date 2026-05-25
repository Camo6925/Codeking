import { NextResponse } from 'next/server'
import { prisma } from '@rr/db'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const trimId = searchParams.get('trimId')
  const vehicleId = searchParams.get('vehicleId') // alias for trimId
  const categorySlug = searchParams.get('categorySlug')
  const page = parseInt(searchParams.get('page') ?? '1', 10)
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '24', 10), 100)

  const resolvedTrimId = parseInt(trimId ?? vehicleId ?? '', 10)
  if (isNaN(resolvedTrimId)) {
    return NextResponse.json({ error: 'trimId is required' }, { status: 400 })
  }

  // Get product IDs that fit this trim
  const applications = await prisma.fitmentApplication.findMany({
    where: {
      trimId: resolvedTrimId,
      product: {
        isActive: true,
        ...(categorySlug ? { category: { slug: categorySlug } } : {}),
      },
    },
    select: { productId: true },
  })

  const productIds = applications.map((a) => a.productId)
  const total = productIds.length

  // Paginate products
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    include: {
      images: { where: { isPrimary: true }, take: 1 },
      variants: { take: 1, orderBy: { price: 'asc' } },
      brand: { select: { name: true } },
      category: { select: { slug: true, name: true } },
    },
    skip: (page - 1) * limit,
    take: limit,
    orderBy: { name: 'asc' },
  })

  return NextResponse.json({
    products,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
    },
  })
}
