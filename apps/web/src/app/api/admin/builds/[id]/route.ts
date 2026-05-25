import { NextResponse } from 'next/server'
import { prisma } from '@rr/db'

function isAuthorized(request: Request): boolean {
  const secret = process.env.ADMIN_SECRET
  if (!secret) return false
  const auth = request.headers.get('Authorization')
  return auth === `Bearer ${secret}`
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const action = body.action as string
  if (action !== 'approve' && action !== 'reject') {
    return NextResponse.json({ error: 'action must be "approve" or "reject"' }, { status: 400 })
  }

  const build = await prisma.build.findUnique({ where: { id: params.id } })
  if (!build) {
    return NextResponse.json({ error: 'Build not found' }, { status: 404 })
  }

  const updated = await prisma.build.update({
    where: { id: params.id },
    data: {
      status: action === 'approve' ? 'APPROVED' : 'REJECTED',
      approvedAt: action === 'approve' ? new Date() : null,
    },
    select: { id: true, status: true, approvedAt: true, vehicleLabel: true },
  })

  return NextResponse.json(updated)
}
