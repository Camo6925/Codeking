import { NextResponse } from 'next/server'
import { revalidatePath, revalidateTag } from 'next/cache'

// Called by Shopify products/update webhook to trigger Next.js ISR revalidation.
export async function POST(request: Request) {
  const secret = request.headers.get('X-Revalidation-Secret')
  if (secret !== process.env.SHOPIFY_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json() as { handle?: string }

  if (body.handle) {
    revalidatePath(`/catalog/${body.handle}`)
    revalidateTag(`product:${body.handle}`)
  }

  // Always revalidate collection pages
  revalidatePath('/wheels')
  revalidatePath('/catalog')

  return NextResponse.json({ revalidated: true, handle: body.handle })
}
