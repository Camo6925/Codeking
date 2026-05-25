import { createReadStream } from 'node:fs'
import { createInterface } from 'node:readline'

export interface AcesApplication {
  year: number
  makeName: string
  modelName: string
  subModelName?: string
  driveType?: string
  engineDesc?: string
  bodyStyle?: string
  partNumber: string
  partTypeName?: string
  notes?: string
  acesApplicationId?: string
}

// Streaming ACES XML parser — handles multi-GB files without loading into memory.
// Reads line by line, extracts tag content with a simple state machine.
export async function parseAcesFile(filePath: string): Promise<AcesApplication[]> {
  const results: AcesApplication[] = []
  const rl = createInterface({ input: createReadStream(filePath), crlfDelay: Infinity })

  let current: Partial<Record<string, string>> = {}
  let inApp = false

  for await (const line of rl) {
    const trimmed = line.trim()

    if (trimmed === '<App>' || trimmed.startsWith('<App ')) {
      inApp = true
      current = {}
      continue
    }

    if (trimmed === '</App>') {
      inApp = false
      const app = buildApplication(current)
      if (app) results.push(app)
      current = {}
      continue
    }

    if (!inApp) continue

    const match = trimmed.match(/^<(\w+)(?:\s[^>]*)?>([^<]*)<\/\1>$/)
    if (match) {
      const [, tag, value] = match
      if (tag && value !== undefined) current[tag] = value.trim()
    }

    const attrMatch = trimmed.match(/^<(\w+)\s+id="([^"]+)"(?:\s*\/>|>([^<]*)<\/\1>)$/)
    if (attrMatch) {
      const [, tag, , value] = attrMatch
      if (tag && value !== undefined) current[tag] = value.trim()
    }
  }

  return results
}

function buildApplication(c: Partial<Record<string, string>>): AcesApplication | null {
  const year = parseInt(c['Year'] ?? '', 10)
  const makeName = c['Make']
  const modelName = c['Model']
  const partNumber = c['Part'] ?? c['PartNumber']

  if (!year || !makeName || !modelName || !partNumber) return null

  return {
    year,
    makeName,
    modelName,
    subModelName: c['SubModel'] || undefined,
    driveType: c['DriveType'] || undefined,
    engineDesc: c['EngineBase'] || undefined,
    bodyStyle: c['BodyType'] || undefined,
    partNumber,
    partTypeName: c['PartType'] || undefined,
    notes: c['Note'] || undefined,
    acesApplicationId: c['ApplicationID'] || undefined,
  }
}
