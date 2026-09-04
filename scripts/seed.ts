/**
 * Seed script: creates realistic farming zones with season-long UAV survey data.
 * Run: bun scripts/seed.ts
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface SeedReading {
  surveyDate: string
  growthStage: 'early' | 'mid' | 'late'
  ndvi: number
  gndvi: number
  ndre: number
  lai: number
  canopyCover: number
  droneModel: string
  sensorType: string
  notes?: string
}

interface SeedZone {
  name: string
  cropType: string
  areaHectares: number
  soilType: string
  description: string
  readings: SeedReading[]
}

const DRONE = { droneModel: 'DJI Mavic 3M', sensorType: 'Multispectral (4-band + RGB)' }

const ZONES: SeedZone[] = [
  {
    name: 'North Block A',
    cropType: 'maize',
    areaHectares: 24.5,
    soilType: 'Deep loam',
    description: 'Prime irrigated field, centre-pivot, high fertility history.',
    readings: [
      { surveyDate: '2026-05-02', growthStage: 'early', ndvi: 0.42, gndvi: 0.38, ndre: 0.18, lai: 0.9, canopyCover: 24, ...DRONE, notes: 'Emergence uniformity check' },
      { surveyDate: '2026-05-28', growthStage: 'early', ndvi: 0.66, gndvi: 0.61, ndre: 0.27, lai: 2.3, canopyCover: 58, ...DRONE, notes: 'Rapid vegetative growth' },
      { surveyDate: '2026-06-24', growthStage: 'mid', ndvi: 0.84, gndvi: 0.76, ndre: 0.38, lai: 4.1, canopyCover: 88, ...DRONE, notes: 'Pre-tasseling, optimal' },
      { surveyDate: '2026-07-20', growthStage: 'mid', ndvi: 0.90, gndvi: 0.81, ndre: 0.44, lai: 5.0, canopyCover: 96, ...DRONE, notes: 'Tasseling, dense canopy' },
      { surveyDate: '2026-08-14', growthStage: 'late', ndvi: 0.82, gndvi: 0.74, ndre: 0.42, lai: 4.6, canopyCover: 92, ...DRONE, notes: 'Grain fill initiated' },
    ],
  },
  {
    name: 'North Block B',
    cropType: 'maize',
    areaHectares: 18.2,
    soilType: 'Sandy loam',
    description: 'Sandy texture, leaching risk, variable emergence in west rows.',
    readings: [
      { surveyDate: '2026-05-02', growthStage: 'early', ndvi: 0.36, gndvi: 0.33, ndre: 0.15, lai: 0.7, canopyCover: 18, ...DRONE, notes: 'Patchy emergence west side' },
      { surveyDate: '2026-05-28', growthStage: 'early', ndvi: 0.57, gndvi: 0.52, ndre: 0.23, lai: 1.8, canopyCover: 45, ...DRONE, notes: 'Replant strips recovering' },
      { surveyDate: '2026-06-24', growthStage: 'mid', ndvi: 0.72, gndvi: 0.65, ndre: 0.31, lai: 3.2, canopyCover: 74, ...DRONE, notes: 'Closing canopy' },
      { surveyDate: '2026-07-20', growthStage: 'mid', ndvi: 0.79, gndvi: 0.71, ndre: 0.35, lai: 3.9, canopyCover: 85, ...DRONE, notes: 'N top-up applied after survey' },
      { surveyDate: '2026-08-14', growthStage: 'late', ndvi: 0.71, gndvi: 0.63, ndre: 0.33, lai: 3.5, canopyCover: 80, ...DRONE, notes: 'Slight early senescence edges' },
    ],
  },
  {
    name: 'East River Field',
    cropType: 'soybean',
    areaHectares: 32.0,
    soilType: 'Silt loam',
    description: 'River-adjacent alluvial field, high organic matter, drainage channels installed.',
    readings: [
      { surveyDate: '2026-05-10', growthStage: 'early', ndvi: 0.38, gndvi: 0.35, ndre: 0.16, lai: 0.8, canopyCover: 20, ...DRONE, notes: 'Post-planting baseline' },
      { surveyDate: '2026-06-08', growthStage: 'early', ndvi: 0.62, gndvi: 0.58, ndre: 0.26, lai: 2.1, canopyCover: 55, ...DRONE, notes: 'V4 stage, uniform' },
      { surveyDate: '2026-07-05', growthStage: 'mid', ndvi: 0.81, gndvi: 0.73, ndre: 0.37, lai: 3.8, canopyCover: 86, ...DRONE, notes: 'R1 flowering onset' },
      { surveyDate: '2026-08-01', growthStage: 'mid', ndvi: 0.86, gndvi: 0.78, ndre: 0.41, lai: 4.4, canopyCover: 93, ...DRONE, notes: 'Pod set progressing well' },
      { surveyDate: '2026-08-26', growthStage: 'late', ndvi: 0.78, gndvi: 0.70, ndre: 0.39, lai: 4.0, canopyCover: 89, ...DRONE, notes: 'R5 seed fill' },
    ],
  },
  {
    name: 'South Terrace',
    cropType: 'wheat',
    areaHectares: 27.8,
    soilType: 'Clay loam',
    description: 'Terraced winter wheat, rain-fed, historical septoria pressure.',
    readings: [
      { surveyDate: '2026-03-15', growthStage: 'early', ndvi: 0.45, gndvi: 0.41, ndre: 0.20, lai: 1.2, canopyCover: 30, ...DRONE, notes: 'Tillering complete' },
      { surveyDate: '2026-04-12', growthStage: 'early', ndvi: 0.68, gndvi: 0.62, ndre: 0.29, lai: 2.6, canopyCover: 62, ...DRONE, notes: 'Stem extension' },
      { surveyDate: '2026-05-10', growthStage: 'mid', ndvi: 0.83, gndvi: 0.74, ndre: 0.38, lai: 4.2, canopyCover: 90, ...DRONE, notes: 'Booting, fungicide T2 applied' },
      { surveyDate: '2026-06-08', growthStage: 'late', ndvi: 0.74, gndvi: 0.66, ndre: 0.36, lai: 3.7, canopyCover: 84, ...DRONE, notes: 'Anthesis, dry spell' },
      { surveyDate: '2026-07-02', growthStage: 'late', ndvi: 0.61, gndvi: 0.54, ndre: 0.30, lai: 2.9, canopyCover: 70, ...DRONE, notes: 'Grain fill, heat stress episodes' },
    ],
  },
  {
    name: 'West Pivot 1',
    cropType: 'rice',
    areaHectares: 15.6,
    soilType: 'Puddled clay',
    description: 'Bunded paddy under pivot-assisted flood, aerobic alternate wetting trial.',
    readings: [
      { surveyDate: '2026-05-20', growthStage: 'early', ndvi: 0.40, gndvi: 0.36, ndre: 0.17, lai: 0.9, canopyCover: 22, ...DRONE, notes: 'Transplant establishment' },
      { surveyDate: '2026-06-16', growthStage: 'early', ndvi: 0.64, gndvi: 0.59, ndre: 0.27, lai: 2.2, canopyCover: 56, ...DRONE, notes: 'Tillering active' },
      { surveyDate: '2026-07-14', growthStage: 'mid', ndvi: 0.82, gndvi: 0.75, ndre: 0.38, lai: 4.0, canopyCover: 89, ...DRONE, notes: 'Panicle initiation' },
      { surveyDate: '2026-08-10', growthStage: 'mid', ndvi: 0.87, gndvi: 0.80, ndre: 0.43, lai: 4.7, canopyCover: 94, ...DRONE, notes: 'Boot stage, heads emerging' },
      { surveyDate: '2026-09-01', growthStage: 'late', ndvi: 0.80, gndvi: 0.72, ndre: 0.40, lai: 4.2, canopyCover: 90, ...DRONE, notes: 'Milky ripeness' },
    ],
  },
  {
    name: 'Hillside Plot C',
    cropType: 'cotton',
    areaHectares: 11.4,
    soilType: 'Shallow rocky loam',
    description: 'Marginal hillside plot, eroded patches, drip-irrigated.',
    readings: [
      { surveyDate: '2026-05-25', growthStage: 'early', ndvi: 0.28, gndvi: 0.26, ndre: 0.13, lai: 0.5, canopyCover: 12, ...DRONE, notes: 'Slow start, cool nights' },
      { surveyDate: '2026-06-22', growthStage: 'early', ndvi: 0.44, gndvi: 0.40, ndre: 0.19, lai: 1.1, canopyCover: 28, ...DRONE, notes: 'Uneven stand, rocky section lagging' },
      { surveyDate: '2026-07-19', growthStage: 'mid', ndvi: 0.58, gndvi: 0.52, ndre: 0.24, lai: 1.9, canopyCover: 47, ...DRONE, notes: 'Squaring; iron chlorosis spots' },
      { surveyDate: '2026-08-15', growthStage: 'mid', ndvi: 0.64, gndvi: 0.57, ndre: 0.27, lai: 2.3, canopyCover: 55, ...DRONE, notes: 'First flowers, canopy thin' },
      { surveyDate: '2026-09-01', growthStage: 'late', ndvi: 0.59, gndvi: 0.52, ndre: 0.25, lai: 2.0, canopyCover: 50, ...DRONE, notes: 'Boll set moderate, stress visible' },
    ],
  },
]

async function main() {
  const existing = await prisma.zone.count()
  if (existing > 0) {
    console.log(`Database already has ${existing} zones — skipping seed.`)
    return
  }
  for (const z of ZONES) {
    const zone = await prisma.zone.create({
      data: {
        name: z.name,
        cropType: z.cropType,
        areaHectares: z.areaHectares,
        soilType: z.soilType,
        description: z.description,
      },
    })
    for (const r of z.readings) {
      await prisma.zoneReading.create({
        data: { ...r, zoneId: zone.id, surveyDate: new Date(r.surveyDate) },
      })
    }
  }
  console.log(`Seeded ${ZONES.length} zones with ${ZONES.reduce((a, z) => a + z.readings.length, 0)} UAV readings.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
