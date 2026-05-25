import { prisma } from '@rr/db'

export interface FitmentQueryResult {
  productId: string
  trimId: number
  notes: string | null
  isUniversal: boolean
}

export interface VehicleFilter {
  year: number
  make: string
  model: string
  trim: string
}

// Resolve a vehicle filter to a VehicleTrim ID. Returns null if not found.
export async function resolveTrimId(filter: VehicleFilter): Promise<number | null> {
  const trim = await prisma.vehicleTrim.findFirst({
    where: {
      name: { equals: filter.trim, mode: 'insensitive' },
      model: {
        slug: { equals: filter.model.toLowerCase().replace(/\s+/g, '-') },
        make: {
          slug: { equals: `${filter.make.toLowerCase().replace(/\s+/g, '-')}-${filter.year}` },
          year: { year: filter.year },
        },
      },
    },
    select: { id: true },
  })
  return trim?.id ?? null
}

// Return all product IDs that fit a given trim, optionally filtered by category.
export async function getProductIdsByTrim(
  trimId: number,
  categorySlug?: string
): Promise<string[]> {
  const applications = await prisma.fitmentApplication.findMany({
    where: {
      trimId,
      product: {
        isActive: true,
        ...(categorySlug ? { category: { slug: categorySlug } } : {}),
      },
    },
    select: { productId: true },
  })
  return applications.map((a) => a.productId)
}

// Check if a specific product fits a specific trim.
export async function checkFitment(
  productId: string,
  trimId: number
): Promise<{ fits: boolean; notes: string | null }> {
  const application = await prisma.fitmentApplication.findFirst({
    where: {
      productId,
      OR: [{ trimId }, { isUniversal: true }],
    },
    select: { notes: true, isUniversal: true },
  })
  return {
    fits: application !== null,
    notes: application?.notes ?? null,
  }
}
