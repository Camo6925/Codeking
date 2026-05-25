import { createReadStream } from 'node:fs'
import { createInterface } from 'node:readline'
import type { CatalogItem } from '@rr/supplier-adapters'

export interface PiesItem {
  partNumber: string
  supplierPartNum: string
  brandName: string
  name: string
  categorySlug: string
  upc?: string
  costCents: number
  msrpCents?: number
  mapPriceCents?: number
  imageUrls: string[]
  attributes: Record<string, string>
}

// PIES EPI codes we care about for wheel/suspension attributes
const EPI_KEYS: Record<string, string> = {
  WD: 'diameter',
  WW: 'width',
  WO: 'offset',
  CLR: 'finish',
  BP: 'boltPattern',
  HB: 'hubBore',
  LT: 'loadRating',
}

export async function parsePiesFile(filePath: string): Promise<CatalogItem[]> {
  const results: CatalogItem[] = []
  const rl = createInterface({ input: createReadStream(filePath), crlfDelay: Infinity })

  let current: Partial<PiesItem> & { attributes: Record<string, string> } = { attributes: {} }
  let inItem = false
  let inPricing = false
  let currentPriceType = ''

  for await (const line of rl) {
    const trimmed = line.trim()

    if (trimmed === '<Item>') {
      inItem = true
      current = { imageUrls: [], attributes: {}, costCents: 0 }
      continue
    }

    if (trimmed === '</Item>') {
      inItem = false
      inPricing = false
      const item = buildItem(current)
      if (item) results.push(item)
      current = { imageUrls: [], attributes: {}, costCents: 0 }
      continue
    }

    if (!inItem) continue

    if (trimmed === '<Pricing>') { inPricing = true; continue }
    if (trimmed === '</Pricing>') { inPricing = false; currentPriceType = ''; continue }

    const tagged = extractTagValue(trimmed)
    if (!tagged) continue
    const { tag, value, attrs } = tagged

    if (tag === 'PartNumber') { current.partNumber = value; current.supplierPartNum = value; continue }
    if (tag === 'BrandAAIAID' || tag === 'BrandName') { current.brandName = current.brandName || value; continue }
    if (tag === 'PartTerminologyName') { current.categorySlug = value.toLowerCase().replace(/\s+/g, '-'); continue }

    if (tag === 'Description' && attrs['DescriptionCode'] === 'MKT') { current.name = value; continue }
    if (tag === 'Description' && !current.name) { current.name = value; continue }

    if (tag === 'GTIN' || tag === 'ItemLevelGTIN') { current.upc = value || undefined; continue }

    if (inPricing) {
      if (tag === 'PriceType') { currentPriceType = value; continue }
      if (tag === 'Price') {
        const cents = Math.round(parseFloat(value) * 100)
        if (currentPriceType === 'REG' || currentPriceType === 'JOBBER') {
          current.costCents = cents
        } else if (currentPriceType === 'RET' || currentPriceType === 'MSRP') {
          current.msrpCents = cents
        } else if (currentPriceType === 'MAP') {
          current.mapPriceCents = cents
        }
        continue
      }
    }

    if (tag === 'EPI' && attrs['EpiCode']) {
      const key = EPI_KEYS[attrs['EpiCode']]
      if (key) current.attributes[key] = value
      continue
    }

    if (tag === 'URI' || tag === 'AssetURI') {
      if (value && /\.(jpg|jpeg|png|webp)/i.test(value)) {
        current.imageUrls = [...(current.imageUrls ?? []), value]
      }
      continue
    }
  }

  return results
}

function extractTagValue(line: string): { tag: string; value: string; attrs: Record<string, string> } | null {
  const m = line.match(/^<([A-Za-z][A-Za-z0-9]*)([^>]*)>([^<]*)<\/[A-Za-z][A-Za-z0-9]*>$/)
  if (!m) return null
  const [, tag, attrStr, value] = m
  if (!tag) return null
  const attrs: Record<string, string> = {}
  const attrRe = /(\w+)="([^"]*)"/g
  let am: RegExpExecArray | null
  while ((am = attrRe.exec(attrStr ?? '')) !== null) {
    attrs[am[1]!] = am[2]!
  }
  return { tag, value: value?.trim() ?? '', attrs }
}

function buildItem(c: Partial<PiesItem> & { attributes: Record<string, string> }): CatalogItem | null {
  if (!c.partNumber || !c.name) return null
  return {
    partNumber: c.partNumber,
    supplierPartNum: c.supplierPartNum ?? c.partNumber,
    brandName: c.brandName ?? '',
    name: c.name,
    categorySlug: c.categorySlug ?? 'wheels',
    upc: c.upc,
    costCents: c.costCents ?? 0,
    msrpCents: c.msrpCents,
    mapPriceCents: c.mapPriceCents,
    imageUrls: c.imageUrls ?? [],
    attributes: c.attributes,
  }
}
