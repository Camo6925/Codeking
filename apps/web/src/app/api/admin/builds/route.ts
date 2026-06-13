import { NextResponse } from 'next/server'
import { prisma } from '@rr/db'

function isAuthorized(request: Request): boolean {
  const secret = process.env.ADMIN_SECRET
  if (!secret) return false
  const auth = request.headers.get('Authorization')
  return auth === `Bearer ${secret}`
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const status = (searchParams.get('status') ?? 'PENDING') as 'PENDING' | 'APPROVED' | 'REJECTED'

  const builds = await prisma.build.findMany({
    where: { status },
    orderBy: { createdAt: 'desc' },
    take: 100,
    select: {
      id: true,
      vehicleLabel: true,
      submitterName: true,
      submitterEmail: true,
      instagramHandle: true,
      imageUrls: true,
      caption: true,
      status: true,
      createdAt: true,
    },
  })

  return NextResponse.json({ builds })
}
