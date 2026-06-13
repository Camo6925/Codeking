// Validate that a vehicle selection is complete and usable for fitment queries.
export function isValidTrimId(trimId: unknown): trimId is number {
  return typeof trimId === 'number' && Number.isInteger(trimId) && trimId > 0
}

// Bolt pattern examples: "5x114.3", "5x4.5", "6x139.7"
export function isValidBoltPattern(bp: string | null | undefined): boolean {
  if (!bp) return false
  return /^\d+x[\d.]+$/i.test(bp.trim())
}

// Wheel size examples: "17x8", "20x9.5"
export function parseWheelSize(size: string): { diameter: number; width: number } | null {
  const m = size.match(/^(\d+(?:\.\d+)?)x(\d+(?:\.\d+)?)/)
  if (!m) return null
  return { diameter: parseFloat(m[1]!), width: parseFloat(m[2]!) }
}

// Offset: number between -50 and +50mm typically
export function isValidOffset(offset: string | null | undefined): boolean {
  if (!offset) return false
  const n = parseFloat(offset.replace(/[^-\d.]/g, ''))
  return !isNaN(n) && n >= -75 && n <= 75
}

// Fitment disclaimer required on all vehicle-filtered result pages
export const FITMENT_DISCLAIMER =
  'Fitment data is provided as a guide. Always verify with your vehicle manufacturer before purchasing. ' +
  'Free returns on fitment errors within 30 days of delivery.'
