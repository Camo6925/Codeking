#!/usr/bin/env tsx
/**
 * Import ACES base vehicle data into the database.
 *
 * Usage:
 *   pnpm tsx scripts/seed-vehicles.ts                 # Run full seed
 *   pnpm tsx scripts/seed-vehicles.ts --dry-run       # Preview without writing
 *
 * For production use, replace the SAMPLE_DATA below with the full ACES base
 * vehicle file from the Auto Care Association (acesapi.autocare.org).
 * The ACES base file contains ~600K+ records covering all domestic/import
 * makes from 1900 to present.
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const DRY_RUN = process.argv.includes('--dry-run')

interface VehicleRecord {
  year: number
  make: string
  model: string
  trim: string
  driveType?: string
  engineDesc?: string
  bodyStyle?: string
  boltPattern?: string
  hubBoreMm?: number
  frontOffsetRange?: string
  tpmsRequired?: boolean
  acesBaseVehicleId?: number
}

// Replace with full ACES import in production
const SAMPLE_RECORDS: VehicleRecord[] = [
  { year: 2024, make: 'Toyota', model: 'Tacoma', trim: 'TRD Pro', driveType: '4WD', boltPattern: '6x139.7', hubBoreMm: 106.1, acesBaseVehicleId: 60001 },
  { year: 2024, make: 'Toyota', model: 'Tacoma', trim: 'TRD Off-Road', driveType: '4WD', boltPattern: '6x139.7', hubBoreMm: 106.1, acesBaseVehicleId: 60002 },
  { year: 2024, make: 'Toyota', model: 'Tundra', trim: 'TRD Pro', driveType: '4WD', boltPattern: '6x139.7', hubBoreMm: 110.0, acesBaseVehicleId: 60003 },
  { year: 2024, make: 'Ford', model: 'F-150', trim: 'Raptor', driveType: '4WD', boltPattern: '6x135', hubBoreMm: 87.1, acesBaseVehicleId: 60010 },
  { year: 2024, make: 'Ford', model: 'Bronco', trim: 'Wildtrak', driveType: '4WD', boltPattern: '6x139.7', hubBoreMm: 87.1, acesBaseVehicleId: 60011 },
  { year: 2024, make: 'Jeep', model: 'Wrangler', trim: 'Rubicon 4xe', driveType: '4WD', boltPattern: '5x127', hubBoreMm: 71.5, acesBaseVehicleId: 60020 },
  { year: 2024, make: 'Ram', model: '1500', trim: 'TRX', driveType: '4WD', boltPattern: '6x139.7', hubBoreMm: 77.8, acesBaseVehicleId: 60030 },
  { year: 2023, make: 'Toyota', model: 'Tacoma', trim: 'TRD Pro', driveType: '4WD', boltPattern: '6x139.7', hubBoreMm: 106.1, acesBaseVehicleId: 55001 },
  { year: 2023, make: 'Jeep', model: 'Wrangler', trim: 'Rubicon', driveType: '4WD', boltPattern: '5x127', hubBoreMm: 71.5, acesBaseVehicleId: 55020 },
  { year: 2022, make: 'Toyota', model: 'Tacoma', trim: 'TRD Pro', driveType: '4WD', boltPattern: '6x139.7', hubBoreMm: 106.1, acesBaseVehicleId: 47832 },
  { year: 2022, make: 'Ford', model: 'F-150', trim: 'Raptor', driveType: '4WD', boltPattern: '6x135', hubBoreMm: 87.1, acesBaseVehicleId: 51200 },
  { year: 2021, make: 'Chevrolet', model: 'Silverado 1500', trim: 'LTZ', driveType: '4WD', boltPattern: '6x139.7', hubBoreMm: 78.1, acesBaseVehicleId: 48500 },
  { year: 2020, make: 'Toyota', model: '4Runner', trim: 'TRD Pro', driveType: '4WD', boltPattern: '6x139.7', hubBoreMm: 106.1, acesBaseVehicleId: 44000 },
]

async function main() {
  console.log(`Seeding ${SAMPLE_RECORDS.length} vehicle records${DRY_RUN ? ' [DRY RUN]' : ''}...`)

  const makeMap = new Map<string, string>() // slug → name
  for (const record of SAMPLE_RECORDS) {
    makeMap.set(record.make.toLowerCase().replace(/\s+/g, '-'), record.make)
  }

  let created = 0
  let skipped = 0

  for (const record of SAMPLE_RECORDS) {
    const makeSlug = `${record.make.toLowerCase().replace(/\s+/g, '-')}-${record.year}`
    const modelSlug = record.model.toLowerCase().replace(/\s+/g, '-')

    if (DRY_RUN) {
      console.log(`  Would create: ${record.year} ${record.make} ${record.model} ${record.trim}`)
      created++
      continue
    }

    const yearRecord = await prisma.vehicleYear.upsert({
      where: { year: record.year },
      update: {},
      create: { year: record.year },
    })

    const makeRecord = await prisma.vehicleMake.upsert({
      where: { slug: makeSlug },
      update: {},
      create: { name: record.make, slug: makeSlug, yearId: yearRecord.id },
    })

    const modelRecord = await prisma.vehicleModel.upsert({
      where: { makeId_slug: { makeId: makeRecord.id, slug: modelSlug } },
      update: {},
      create: { name: record.model, slug: modelSlug, makeId: makeRecord.id },
    })

    if (record.acesBaseVehicleId) {
      const existing = await prisma.vehicleTrim.findFirst({
        where: { acesBaseVehicleId: record.acesBaseVehicleId },
      })
      if (existing) { skipped++; continue }
    }

    await prisma.vehicleTrim.create({
      data: {
        name: record.trim,
        modelId: modelRecord.id,
        driveType: record.driveType,
        engineDesc: record.engineDesc,
        bodyStyle: record.bodyStyle,
        boltPattern: record.boltPattern,
        hubBore: record.hubBoreMm,
        frontOffsetRange: record.frontOffsetRange,
        tpmsRequired: record.tpmsRequired ?? false,
        acesBaseVehicleId: record.acesBaseVehicleId,
      },
    })
    created++
  }

  console.log(`Done. Created: ${created}, Skipped: ${skipped}`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
