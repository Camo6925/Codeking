import { NextResponse } from 'next/server'
import { prisma } from '@rr/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  const years = await prisma.vehicleYear.findMany({
    orderBy: { year: 'desc' },
    select: { year: true },
  })

  return NextResponse.json(
    { years: years.map((y) => y.year) },
    {
      headers: {
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=3600',
      },
    }
  )
}
