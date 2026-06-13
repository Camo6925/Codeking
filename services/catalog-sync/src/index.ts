import { prisma } from '@rr/db'
import { runCatalogPipeline } from './pipeline'

const DRY_RUN = process.argv.includes('--dry-run')
const MODE = process.argv.includes('--full') ? 'full' : 'delta'

async function main() {
  console.log(`Catalog sync starting — mode: ${MODE}${DRY_RUN ? ' [DRY RUN]' : ''}`)

  const suppliers = await prisma.supplier.findMany({
    where: { isActive: true },
    select: { id: true, name: true, adapterKey: true },
  })

  for (const supplier of suppliers) {
    console.log(`\nSyncing supplier: ${supplier.name} (${supplier.adapterKey})`)
    try {
      const result = await runCatalogPipeline({
        supplierId: supplier.id,
        adapterKey: supplier.adapterKey,
        mode: MODE,
        dryRun: DRY_RUN,
      })
      console.log(`  Found: ${result.productsFound} | Created: ${result.productsCreated} | Updated: ${result.productsUpdated} | Errors: ${result.errorCount}`)
      if (result.errors.length) {
        console.log('  Sample errors:')
        result.errors.slice(0, 5).forEach((e) => console.log(`    - ${e}`))
      }
    } catch (err) {
      console.error(`  FAILED: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  await prisma.$disconnect()
  console.log('\nCatalog sync complete.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
