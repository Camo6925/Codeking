import { NextResponse } from 'next/server'
import { prisma } from '@rr/db'

export async function GET(_req: Request, { params }: { params: { year: string } }) {
  const year = parseInt(params.year, 10)
  if (isNaN(year)) return NextResponse.json({ error: 'Invalid year' }, { status: 400 })

  const yearRecord = await prisma.vehicleYear.findUnique({
    where: { year },
    include: { makes: { orderBy: { name: 'asc' }, select: { name: true, slug: true } } },
  })

  if (!yearRecord) return NextResponse.json({ makes: [] })

  return NextResponse.json(
    { makes: yearRecord.makes },
    { headers: { 'Cache-Control': 'public, max-age=86400' } }
  )
}
