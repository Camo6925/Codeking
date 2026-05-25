import { prisma } from '@rr/db'
import { getAdapter } from '@rr/supplier-adapters'
import { normalizePartNumber, slugify, normalizeBoltPattern } from '@rr/fitment-engine'
import type { CatalogItem } from '@rr/supplier-adapters'

interface PipelineOptions {
  supplierId: string
  adapterKey: string
  mode: 'delta' | 'full'
  dryRun?: boolean
}

interface PipelineResult {
  productsFound: number
  productsCreated: number
  productsUpdated: number
  productsSkipped: number
  errorCount: number
  errors: string[]
}

export async function runCatalogPipeline(options: PipelineOptions): Promise<PipelineResult> {
  const { supplierId, adapterKey, mode, dryRun = false } = options
  const adapter = getAdapter(adapterKey)
  const result: PipelineResult = {
    productsFound: 0,
    productsCreated: 0,
    productsUpdated: 0,
    productsSkipped: 0,
    errorCount: 0,
    errors: [],
  }

  const logId = await prisma.catalogSyncLog.create({
    data: { supplierId, status: 'RUNNING' },
    select: { id: true },
  })

  try {
    const lastSync = await prisma.catalogSyncLog.findFirst({
      where: { supplierId, status: 'COMPLETED' },
      orderBy: { completedAt: 'desc' },
      select: { completedAt: true },
    })

    const items: AsyncIterable<CatalogItem> =
      mode === 'full' || !lastSync?.completedAt
        ? adapter.fetchFullCatalog()
        : (async function* () {
            const items = await adapter.fetchCatalogDelta(lastSync.completedAt!)
            for (const item of items) yield item
          })()

    for await (const item of items) {
      result.productsFound++
      try {
        if (!dryRun) {
          await upsertProduct(item, supplierId)
          // Simplified: would check if created or updated
          result.productsUpdated++
        }
      } catch (err) {
        result.errorCount++
        const msg = err instanceof Error ? err.message : String(err)
        if (result.errors.length < 20) result.errors.push(`${item.partNumber}: ${msg}`)
      }
    }

    await prisma.catalogSyncLog.update({
      where: { id: logId.id },
      data: {
        status: result.errorCount > 0 ? 'PARTIAL' : 'COMPLETED',
        completedAt: new Date(),
        productsFound: result.productsFound,
        productsCreated: result.productsCreated,
        productsUpdated: result.productsUpdated,
        productsSkipped: result.productsSkipped,
        errorCount: result.errorCount,
        errorSample: result.errors.length ? result.errors : undefined,
      },
    })
  } catch (err) {
    await prisma.catalogSyncLog.update({
      where: { id: logId.id },
      data: { status: 'FAILED', completedAt: new Date() },
    })
    throw err
  }

  return result
}

async function upsertProduct(item: CatalogItem, supplierId: string): Promise<void> {
  const partNumber = normalizePartNumber(item.partNumber)
  const slug = slugify(`${item.brandName}-${partNumber}`)

  // Upsert brand
  const brand = await prisma.brand.upsert({
    where: { slug: slugify(item.brandName) },
    update: {},
    create: {
      name: item.brandName,
      slug: slugify(item.brandName),
    },
  })

  // Upsert category
  const category = await prisma.category.upsert({
    where: { slug: item.categorySlug },
    update: {},
    create: {
      name: item.categorySlug.charAt(0).toUpperCase() + item.categorySlug.slice(1),
      slug: item.categorySlug,
    },
  })

  // Upsert product
  const product = await prisma.product.upsert({
    where: { partNumber },
    update: {
      name: item.name,
      description: item.description,
      msrp: item.msrpCents,
      mapPrice: item.mapPriceCents,
      attributes: item.attributes,
      updatedAt: new Date(),
    },
    create: {
      partNumber,
      upc: item.upc,
      name: item.name,
      slug,
      description: item.description,
      brandId: brand.id,
      categoryId: category.id,
      msrp: item.msrpCents,
      mapPrice: item.mapPriceCents,
      attributes: item.attributes,
    },
  })

  // Upsert supplier product link
  await prisma.supplierProduct.upsert({
    where: { supplierId_supplierPartNum: { supplierId, supplierPartNum: item.supplierPartNum } },
    update: { cost: item.costCents, lastSyncedAt: new Date() },
    create: {
      supplierId,
      productId: product.id,
      supplierPartNum: item.supplierPartNum,
      supplierSku: item.supplierSku,
      cost: item.costCents,
      lastSyncedAt: new Date(),
    },
  })

  // Upsert variants
  for (const variant of item.variants ?? []) {
    const boltPattern = variant.boltPattern
      ? normalizeBoltPattern(variant.boltPattern)
      : undefined
    await prisma.productVariant.upsert({
      where: { shopifyVariantId: variant.supplierPartNum }, // temp key until Shopify sync
      update: { price: variant.priceCents, boltPattern },
      create: {
        productId: product.id,
        shopifyVariantId: variant.supplierPartNum,
        diameter: variant.diameter,
        width: variant.width,
        finish: variant.finish,
        boltPattern,
        offset: variant.offset,
        price: variant.priceCents,
        upc: variant.upc,
      },
    })
  }

  // Upsert fitment applications
  for (const app of item.fitmentApplications ?? []) {
    const trim = await prisma.vehicleTrim.findFirst({
      where: { acesBaseVehicleId: app.acesBaseVehicleId },
      select: { id: true },
    })
    if (!trim) continue

    await prisma.fitmentApplication.upsert({
      where: { productId_trimId: { productId: product.id, trimId: trim.id } },
      update: { notes: app.notes },
      create: {
        productId: product.id,
        trimId: trim.id,
        notes: app.notes,
        acesApplicationId: String(app.acesBaseVehicleId),
        sourceSupplier: supplierId,
      },
    })
  }
}
