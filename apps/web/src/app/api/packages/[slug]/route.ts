import { NextResponse } from 'next/server'
import { prisma } from '@rr/db'

export async function GET(
  _req: Request,
  { params }: { params: { slug: string } }
) {
  const pkg = await prisma.package.findUnique({
    where: { slug: params.slug },
    include: {
      items: {
        orderBy: { sortOrder: 'asc' },
        include: {
          product: {
            include: {
              images: { orderBy: { sortOrder: 'asc' } },
              variants: { orderBy: { price: 'asc' } },
              brand: { select: { name: true, slug: true, logoUrl: true } },
              category: { select: { name: true, slug: true } },
            },
          },
        },
      },
      fitment: {
        include: {
          trim: {
            include: {
              model: {
                include: {
                  make: {
                    include: { year: true },
                  },
                },
              },
            },
          },
        },
      },
    },
  })

  if (!pkg || !pkg.isActive) {
    return NextResponse.json({ error: 'Package not found' }, { status: 404 })
  }

  return NextResponse.json(pkg, {
    headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
  })
}
