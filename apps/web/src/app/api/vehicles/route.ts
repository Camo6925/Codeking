import { NextResponse } from 'next/server'
import { prisma } from '@rr/db'

// Returns all available model years, sorted descending.
// Cached for 24h — vehicle years change once a year.
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
