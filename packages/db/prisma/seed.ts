import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding categories...')
  const categories = [
    { name: 'Wheels', slug: 'wheels' },
    { name: 'Suspension', slug: 'suspension' },
    { name: 'Performance', slug: 'performance' },
    { name: 'Lighting', slug: 'lighting' },
    { name: 'Packages', slug: 'packages' },
  ]

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    })
  }

  console.log('Seeding suppliers...')
  const suppliers = [
    {
      name: 'Keystone Automotive',
      slug: 'keystone',
      adapterKey: 'keystone',
      defaultLeadDays: 3,
      supportsEdi: false,
      apiBaseUrl: 'https://api.keystoneautomotive.com/v2',
      ftpHost: 'ftp.keystoneautomotive.com',
    },
    {
      name: 'Turn 14 Distribution',
      slug: 'turn14',
      adapterKey: 'turn14',
      defaultLeadDays: 2,
      supportsEdi: false,
      apiBaseUrl: 'https://api.turn14.com/v1',
    },
    {
      name: 'Meyer Distributing',
      slug: 'meyer',
      adapterKey: 'meyer',
      defaultLeadDays: 4,
      supportsEdi: true,
      ftpHost: 'ftp.meyerdist.com',
    },
  ]

  for (const supplier of suppliers) {
    await prisma.supplier.upsert({
      where: { slug: supplier.slug },
      update: {},
      create: supplier,
    })
  }

  console.log('Seeding sample vehicle data...')
  // Sample data — replace with full ACES base vehicle import via seed-vehicles.ts
  const sampleVehicles = [
    {
      year: 2022,
      makes: [
        {
          name: 'Toyota',
          slug: 'toyota',
          models: [
            {
              name: 'Tacoma',
              slug: 'tacoma',
              trims: [
                {
                  name: 'TRD Pro',
                  boltPattern: '6x139.7',
                  hubBore: 106.1,
                  frontOffsetRange: '-12 to +20',
                  driveType: '4WD',
                  engineDesc: '3.5L V6',
                  bodyStyle: '4-Door Double Cab',
                  tpmsRequired: true,
                  acesBaseVehicleId: 47832,
                },
                {
                  name: 'TRD Off-Road',
                  boltPattern: '6x139.7',
                  hubBore: 106.1,
                  frontOffsetRange: '-12 to +20',
                  driveType: '4WD',
                  engineDesc: '3.5L V6',
                  bodyStyle: '4-Door Double Cab',
                  tpmsRequired: true,
                  acesBaseVehicleId: 47833,
                },
              ],
            },
          ],
        },
        {
          name: 'Ford',
          slug: 'ford',
          models: [
            {
              name: 'F-150',
              slug: 'f-150',
              trims: [
                {
                  name: 'Raptor',
                  boltPattern: '6x135',
                  hubBore: 87.1,
                  frontOffsetRange: '+34 to +44',
                  driveType: '4WD',
                  engineDesc: '3.5L EcoBoost V6',
                  bodyStyle: '4-Door SuperCrew',
                  tpmsRequired: true,
                  acesBaseVehicleId: 51200,
                },
                {
                  name: 'Lariat',
                  boltPattern: '6x135',
                  hubBore: 87.1,
                  frontOffsetRange: '+34 to +44',
                  driveType: '4WD',
                  engineDesc: '3.5L EcoBoost V6',
                  bodyStyle: '4-Door SuperCrew',
                  tpmsRequired: true,
                  acesBaseVehicleId: 51201,
                },
              ],
            },
          ],
        },
      ],
    },
    {
      year: 2023,
      makes: [
        {
          name: 'Toyota',
          slug: 'toyota',
          models: [
            {
              name: 'Tundra',
              slug: 'tundra',
              trims: [
                {
                  name: 'TRD Pro',
                  boltPattern: '6x139.7',
                  hubBore: 106.1,
                  frontOffsetRange: '-12 to +25',
                  driveType: '4WD',
                  engineDesc: '3.4L Twin-Turbo V6',
                  bodyStyle: '4-Door CrewMax',
                  tpmsRequired: true,
                  acesBaseVehicleId: 52100,
                },
              ],
            },
          ],
        },
        {
          name: 'Jeep',
          slug: 'jeep',
          models: [
            {
              name: 'Wrangler',
              slug: 'wrangler',
              trims: [
                {
                  name: 'Rubicon',
                  boltPattern: '5x127',
                  hubBore: 71.5,
                  frontOffsetRange: '-51 to +25',
                  driveType: '4WD',
                  engineDesc: '3.6L Pentastar V6',
                  bodyStyle: '4-Door Unlimited',
                  tpmsRequired: true,
                  acesBaseVehicleId: 42000,
                },
                {
                  name: 'Sport S',
                  boltPattern: '5x127',
                  hubBore: 71.5,
                  frontOffsetRange: '-51 to +25',
                  driveType: '4WD',
                  engineDesc: '3.6L Pentastar V6',
                  bodyStyle: '4-Door Unlimited',
                  tpmsRequired: true,
                  acesBaseVehicleId: 42001,
                },
              ],
            },
          ],
        },
      ],
    },
  ]

  for (const vehicleYear of sampleVehicles) {
    const yearRecord = await prisma.vehicleYear.upsert({
      where: { year: vehicleYear.year },
      update: {},
      create: { year: vehicleYear.year },
    })

    for (const make of vehicleYear.makes) {
      const makeRecord = await prisma.vehicleMake.upsert({
        where: { slug: `${make.slug}-${vehicleYear.year}` },
        update: {},
        create: {
          name: make.name,
          slug: `${make.slug}-${vehicleYear.year}`,
          yearId: yearRecord.id,
        },
      })

      for (const model of make.models) {
        const modelRecord = await prisma.vehicleModel.upsert({
          where: { makeId_slug: { makeId: makeRecord.id, slug: model.slug } },
          update: {},
          create: {
            name: model.name,
            slug: model.slug,
            makeId: makeRecord.id,
          },
        })

        for (const trim of model.trims) {
          await prisma.vehicleTrim.upsert({
            where: { modelId_name: { modelId: modelRecord.id, name: trim.name } },
            update: {
              boltPattern: trim.boltPattern,
              hubBore: trim.hubBore,
              frontOffsetRange: trim.frontOffsetRange,
              driveType: trim.driveType,
              engineDesc: trim.engineDesc,
              bodyStyle: trim.bodyStyle,
              tpmsRequired: trim.tpmsRequired,
              acesBaseVehicleId: trim.acesBaseVehicleId,
            },
            create: {
              name: trim.name,
              modelId: modelRecord.id,
              boltPattern: trim.boltPattern,
              hubBore: trim.hubBore,
              frontOffsetRange: trim.frontOffsetRange,
              driveType: trim.driveType,
              engineDesc: trim.engineDesc,
              bodyStyle: trim.bodyStyle,
              tpmsRequired: trim.tpmsRequired,
              acesBaseVehicleId: trim.acesBaseVehicleId,
            },
          })
        }
      }
    }
  }

  console.log('Seed complete.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
