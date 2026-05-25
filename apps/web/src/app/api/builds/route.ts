import { NextResponse } from 'next/server'
import { prisma } from '@rr/db'

const DEFAULT_LIMIT = 12

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
  const limit = Math.min(50, parseInt(searchParams.get('limit') ?? String(DEFAULT_LIMIT), 10))
  const trimId = searchParams.get('trimId') ? parseInt(searchParams.get('trimId')!, 10) : undefined
  const skip = (page - 1) * limit

  const where = {
    status: 'APPROVED' as const,
    ...(trimId && !isNaN(trimId) ? { trimId } : {}),
  }

  const [builds, total] = await Promise.all([
    prisma.build.findMany({
      where,
      orderBy: { approvedAt: 'desc' },
      skip,
      take: limit,
      select: {
        id: true,
        slug: true,
        vehicleLabel: true,
        submitterName: true,
        instagramHandle: true,
        imageUrls: true,
        caption: true,
        featuredProducts: true,
        approvedAt: true,
        trimId: true,
      },
    }),
    prisma.build.count({ where }),
  ])

  return NextResponse.json({
    builds,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
    },
  })
}

export async function POST(request: Request) {
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { vehicleLabel, submitterName, submitterEmail, instagramHandle, imageUrls, caption, featuredProducts, trimId } = body as {
    vehicleLabel?: string
    submitterName?: string
    submitterEmail?: string
    instagramHandle?: string
    imageUrls?: string[]
    caption?: string
    featuredProducts?: unknown
    trimId?: number
  }

  if (!vehicleLabel || !submitterName || !submitterEmail) {
    return NextResponse.json(
      { error: 'vehicleLabel, submitterName, and submitterEmail are required' },
      { status: 400 }
    )
  }
  if (!Array.isArray(imageUrls) || imageUrls.length === 0) {
    return NextResponse.json({ error: 'At least one image URL is required' }, { status: 400 })
  }

  const build = await prisma.build.create({
    data: {
      vehicleLabel,
      submitterName,
      submitterEmail,
      instagramHandle: instagramHandle ?? null,
      imageUrls,
      caption: caption ?? null,
      featuredProducts: featuredProducts ?? null,
      trimId: trimId ?? null,
      status: 'PENDING',
    },
    select: { id: true, slug: true, vehicleLabel: true, status: true },
  })

  return NextResponse.json(build, { status: 201 })
}
