import { createHmac } from 'crypto'

// Validate Shopify HMAC signature before processing any webhook.
// https://shopify.dev/docs/apps/build/webhooks/secure/hmac-validation
export async function validateShopifyHmac(
  request: Request,
  rawBody: string
): Promise<boolean> {
  const hmacHeader = request.headers.get('X-Shopify-Hmac-SHA256')
  if (!hmacHeader) return false

  const secret = process.env.SHOPIFY_WEBHOOK_SECRET
  if (!secret) throw new Error('SHOPIFY_WEBHOOK_SECRET not configured')

  const computedHmac = createHmac('sha256', secret)
    .update(rawBody, 'utf8')
    .digest('base64')

  // Use a constant-time comparison to prevent timing attacks
  return timingSafeEqual(hmacHeader, computedHmac)
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  let result = 0
  for (let i = 0; i < bufA.length; i++) {
    result |= bufA[i]! ^ bufB[i]!
  }
  return result === 0
}
