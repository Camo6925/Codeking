// Normalize strings from different supplier catalogs to consistent values.

const MAKE_ALIASES: Record<string, string> = {
  'TOYOTA MOTOR': 'Toyota',
  'FORD MOTOR': 'Ford',
  CHEVROLET: 'Chevrolet',
  GMC: 'GMC',
  JEEP: 'Jeep',
  DODGE: 'Dodge',
  RAM: 'Ram',
  NISSAN: 'Nissan',
  HONDA: 'Honda',
  SUBARU: 'Subaru',
}

const FINISH_ALIASES: Record<string, string> = {
  'MATTE BLACK': 'Matte Black',
  'FLAT BLACK': 'Matte Black',
  'SATIN BLACK': 'Satin Black',
  'GLOSS BLACK': 'Gloss Black',
  'CHROME': 'Chrome',
  'MACHINED': 'Machined',
  'BRONZE': 'Bronze',
  'GUNMETAL': 'Gunmetal',
}

export function normalizeMake(raw: string): string {
  const upper = raw.trim().toUpperCase()
  return MAKE_ALIASES[upper] ?? titleCase(raw.trim())
}

export function normalizeFinish(raw: string): string {
  const upper = raw.trim().toUpperCase()
  return FINISH_ALIASES[upper] ?? titleCase(raw.trim())
}

export function normalizePartNumber(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, '')
}

export function normalizeBoltPattern(raw: string): string {
  // Normalize "5x4.5" → "5x114.3" and "6x5.5" → "6x139.7" (inch → mm)
  const match = raw.match(/^(\d+)[xX]([\d.]+)$/)
  if (!match) return raw.trim()
  const [, lug, pitch] = match
  const pitchNum = parseFloat(pitch)
  // Convert inch pitch to mm if < 10 (heuristic: mm values are > 10)
  const pitchMm = pitchNum < 10 ? Math.round(pitchNum * 25.4 * 10) / 10 : pitchNum
  return `${lug}x${pitchMm}`
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function titleCase(str: string): string {
  return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase())
}
