/**
 * One-time bulk product push to Shopify Admin API.
 * Reads active products from the DB and creates/updates them in Shopify.
 *
 * Usage:
 *   DRY_RUN=1 pnpm tsx scripts/shopify-product-push.ts   # preview only
 *   pnpm tsx scripts/shopify-product-push.ts             # live push
 *
 * Rate limit: Shopify Admin API allows 2 req/s on Basic plan.
 * This script processes in batches of 10 with 1s delays.
 */
import { prisma } from '@rr/db'

const SHOPIFY_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN!
const SHOPIFY_ADMIN_TOKEN = process.env.SHOPIFY_ADMIN_API_KEY!
const DRY_RUN = process.env.DRY_RUN === '1'
const BATCH_SIZE = 10
const RATE_LIMIT_MS = 1000

if (!SHOPIFY_DOMAIN || !SHOPIFY_ADMIN_TOKEN) {
  console.error('SHOPIFY_STORE_DOMAIN and SHOPIFY_ADMIN_API_KEY must be set')
  process.exit(1)
}

interface ShopifyProductInput {
  title: string
  handle: string
  body_html: string
  vendor: string
  product_type: string
  status: 'active' | 'draft'
  variants: Array<{ sku: string; price: string; compare_at_price?: string }>
  images: Array<{ src: string; alt: string }>
}

async function shopifyRequest(path: string, method: string, body?: unknown) {
  const res = await fetch(`https://${SHOPIFY_DOMAIN}/admin/api/2024-01/${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': SHOPIFY_ADMIN_TOKEN,
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Shopify API ${method} ${path} → ${res.status}: ${text}`)
  }
  return res.json() as Promise<Record<string, unknown>>
}

async function pushProduct(product: {
  id: string
  name: string
  slug: string
  description: string | null
  shopifyProductId: string | null
  partNumber: string
  brand: { name: string }
  category: { name: string }
  images: Array<{ url: string; altText: string | null }>
  variants: Array<{ price: number; compareAtPrice: number | null }>
}): Promise<string | null> {
  const lowestVariant = product.variants[0]
  if (!lowestVariant) return null

  const payload: ShopifyProductInput = {
    title: product.name,
    handle: product.slug,
    body_html: product.description ?? '',
    vendor: product.brand.name,
    product_type: product.category.name,
    status: 'active',
    variants: product.variants.map((v, i) => ({
      sku: i === 0 ? product.partNumber : `${product.partNumber}-${i}`,
      price: (v.price / 100).toFixed(2),
      compare_at_price: v.compareAtPrice ? (v.compareAtPrice / 100).toFixed(2) : undefined,
    })),
    images: product.images.map((img) => ({ src: img.url, alt: img.altText ?? product.name })),
  }

  if (product.shopifyProductId) {
    const id = product.shopifyProductId.replace('gid://shopify/Product/', '')
    const data = await shopifyRequest(`products/${id}.json`, 'PUT', { product: payload })
    return `gid://shopify/Product/${(data.product as Record<string, unknown>)['id']}`
  } else {
    const data = await shopifyRequest('products.json', 'POST', { product: payload })
    return `gid://shopify/Product/${(data.product as Record<string, unknown>)['id']}`
  }
}

async function main() {
  console.log(`Starting Shopify product push${DRY_RUN ? ' (DRY RUN)' : ''}...`)

  const products = await prisma.product.findMany({
    where: { isActive: true },
    include: {
      brand: { select: { name: true } },
      category: { select: { name: true } },
      images: { where: { isPrimary: true }, take: 5 },
      variants: { take: 10, orderBy: { price: 'asc' } },
    },
  })

  console.log(`Found ${products.length} active products to push.`)

  let pushed = 0
  let errors = 0

  for (let i = 0; i < products.length; i += BATCH_SIZE) {
    const batch = products.slice(i, i + BATCH_SIZE)

    await Promise.allSettled(
      batch.map(async (product) => {
        if (DRY_RUN) {
          console.log(`  [DRY] Would push: ${product.partNumber} — ${product.name}`)
          return
        }
        try {
          const shopifyId = await pushProduct(product)
          if (shopifyId) {
            await prisma.product.update({
              where: { id: product.id },
              data: { shopifyProductId: shopifyId, shopifyHandle: product.slug, shopifySyncedAt: new Date() },
            })
          }
          pushed++
          console.log(`  ✓ ${product.partNumber} → ${shopifyId}`)
        } catch (err) {
          errors++
          console.error(`  ✗ ${product.partNumber}: ${err}`)
        }
      })
    )

    if (i + BATCH_SIZE < products.length) {
      await new Promise((r) => setTimeout(r, RATE_LIMIT_MS))
    }
  }

  console.log(`\nDone. Pushed: ${pushed}, Errors: ${errors}`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
