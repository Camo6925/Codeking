import { NextResponse } from 'next/server'
import { prisma } from '@rr/db'

export async function GET(
  _req: Request,
  { params }: { params: { year: string; make: string; model: string } }
) {
  const year = parseInt(params.year, 10)
  if (isNaN(year)) return NextResponse.json({ error: 'Invalid year' }, { status: 400 })

  const modelRecord = await prisma.vehicleModel.findFirst({
    where: {
      slug: params.model,
      make: {
        slug: `${params.make}-${year}`,
        year: { year },
      },
    },
    include: {
      trims: {
        orderBy: { name: 'asc' },
        select: {
          id: true,
          name: true,
          driveType: true,
          engineDesc: true,
          bodyStyle: true,
          boltPattern: true,
        },
      },
    },
  })

  if (!modelRecord) return NextResponse.json({ trims: [] })

  return NextResponse.json(
    { trims: modelRecord.trims },
    { headers: { 'Cache-Control': 'public, max-age=86400' } }
  )
}
