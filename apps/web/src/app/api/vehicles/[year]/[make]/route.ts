import { NextResponse } from 'next/server'
import { prisma } from '@rr/db'

export async function GET(
  _req: Request,
  { params }: { params: { year: string; make: string } }
) {
  const year = parseInt(params.year, 10)
  if (isNaN(year)) return NextResponse.json({ error: 'Invalid year' }, { status: 400 })

  const makeRecord = await prisma.vehicleMake.findFirst({
    where: {
      slug: `${params.make}-${year}`,
      year: { year },
    },
    include: {
      models: {
        orderBy: { name: 'asc' },
        select: { name: true, slug: true },
      },
    },
  })

  if (!makeRecord) return NextResponse.json({ models: [] })

  return NextResponse.json(
    { models: makeRecord.models },
    { headers: { 'Cache-Control': 'public, max-age=86400' } }
  )
}
