/**
 * Seed sample fitment applications for development/testing.
 * Links existing products to vehicle trims using sample data.
 *
 * Usage: pnpm tsx scripts/seed-fitment.ts
 */
import { prisma } from '@rr/db'

async function main() {
  console.log('Seeding fitment applications...')

  const products = await prisma.product.findMany({ take: 50, select: { id: true, partNumber: true } })
  const trims = await prisma.vehicleTrim.findMany({
    take: 20,
    select: { id: true, name: true, model: { select: { name: true, make: { select: { name: true } } } } },
  })

  if (products.length === 0) {
    console.warn('No products found — run catalog sync first or seed products.')
    return
  }
  if (trims.length === 0) {
    console.warn('No vehicle trims found — run seed-vehicles.ts first.')
    return
  }

  let created = 0
  let skipped = 0

  for (const trim of trims) {
    // Assign ~10 random products per trim for a realistic sample
    const count = Math.min(10, products.length)
    const subset = products.slice(0, count)

    for (const product of subset) {
      try {
        await prisma.fitmentApplication.upsert({
          where: { productId_trimId: { productId: product.id, trimId: trim.id } },
          update: {},
          create: {
            productId: product.id,
            trimId: trim.id,
            sourceSupplier: 'seed',
          },
        })
        created++
      } catch {
        skipped++
      }
    }
  }

  console.log(`Done — created ${created} fitment applications, skipped ${skipped} existing.`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
