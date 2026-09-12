/**
 * Seed script: creates realistic farming zones with season-long UAV survey data,
 * soil samples, and runs the disease fusion engine to populate detections + alerts.
 * Run: bun scripts/seed.ts
 */
import { db as prisma } from '../src/lib/db'
import { deriveIndices } from '../src/lib/disease-engine'
import { GROWTH_STAGES, type GrowthStage } from '../src/lib/forecast-engine'

type Stage = GrowthStage

interface SeedReading {
  surveyDate: string
  growthStage: Stage
  ndvi: number
  gndvi: number
  ndre: number
  lai: number
  canopyCover: number
  canopyTempC?: number
  notes?: string
}

interface SeedSoil {
  sampledAt: string
  ph: number
  nitrogen: number
  phosphorus: number
  potassium: number
  organicMatter: number
  moisture: number
  temperature: number
  electricalCond?: number
  cationExchangeCap?: number
  bulkDensity?: number
  notes?: string
}

interface SeedZone {
  name: string
  cropType: string
  areaHectares: number
  soilType: string
  description: string
  variety?: string
  latitude?: number
  longitude?: number
  sowingDate?: string
  readings: SeedReading[]
  soilSamples: SeedSoil[]
}

const DRONE = { droneModel: 'DJI Mavic 3M', sensorType: 'Multispectral (4-band + RGB)' }

/**
 * Build physically plausible reflectance bands from the indices so that
 * band-derived indices match the seeded ones (consistent for the fusion engine).
 */
function bandsFromIndices(ndvi: number, gndvi: number, ndre: number, canopyTempC?: number) {
  const nir = Math.min(0.85, Math.max(0.25, 0.35 + ndvi * 0.55))
  const red = nir * (1 - ndvi) / (1 + ndvi)
  const green = nir * (1 - gndvi) / (1 + gndvi)
  const redEdge = nir * (1 - ndre) / (1 + ndre)
  const blue = Math.min(green, Math.max(0.02, green * 0.28))
  const derived = deriveIndices({ blue, green, red, redEdge, nir })
  return { ...derived, canopyTempC: canopyTempC ?? undefined }
}

const ZONES: SeedZone[] = [
  {
    name: 'North Block A',
    cropType: 'maize',
    areaHectares: 24.5,
    soilType: 'Deep loam',
    description: 'Prime irrigated field, centre-pivot, high fertility history.',
    soilSamples: [
      { sampledAt: '2026-04-20', ph: 6.8, nitrogen: 160, phosphorus: 42, potassium: 180, organicMatter: 3.8, moisture: 38, temperature: 17, electricalCond: 0.42, cationExchangeCap: 18, bulkDensity: 1.25, notes: 'Spring baseline' },
      { sampledAt: '2026-07-10', ph: 6.9, nitrogen: 175, phosphorus: 45, potassium: 175, organicMatter: 3.9, moisture: 30, temperature: 24, electricalCond: 0.46, notes: 'Mid-season after side-dress' },
    ],
    readings: [
      { surveyDate: '2026-05-02', growthStage: 'early', ndvi: 0.42, gndvi: 0.38, ndre: 0.18, lai: 0.9, canopyCover: 24, canopyTempC: 21, notes: 'Emergence uniformity check' },
      { surveyDate: '2026-05-28', growthStage: 'early', ndvi: 0.66, gndvi: 0.61, ndre: 0.27, lai: 2.3, canopyCover: 58, canopyTempC: 23, notes: 'Rapid vegetative growth' },
      { surveyDate: '2026-06-24', growthStage: 'mid', ndvi: 0.84, gndvi: 0.76, ndre: 0.38, lai: 4.1, canopyCover: 88, canopyTempC: 25, notes: 'Pre-tasseling, optimal' },
      { surveyDate: '2026-07-20', growthStage: 'mid', ndvi: 0.90, gndvi: 0.81, ndre: 0.44, lai: 5.0, canopyCover: 96, canopyTempC: 26, notes: 'Tasseling, dense canopy' },
      { surveyDate: '2026-08-14', growthStage: 'late', ndvi: 0.82, gndvi: 0.74, ndre: 0.42, lai: 4.6, canopyCover: 92, canopyTempC: 25, notes: 'Grain fill initiated' },
    ],
  },
  {
    name: 'North Block B',
    cropType: 'maize',
    areaHectares: 18.2,
    soilType: 'Sandy loam',
    description: 'Sandy texture, leaching risk, variable emergence in west rows.',
    soilSamples: [
      { sampledAt: '2026-04-22', ph: 6.2, nitrogen: 95, phosphorus: 28, potassium: 120, organicMatter: 2.2, moisture: 24, temperature: 18, electricalCond: 0.31, cationExchangeCap: 10, bulkDensity: 1.45, notes: 'Sandy profile, low CEC' },
    ],
    readings: [
      { surveyDate: '2026-05-02', growthStage: 'early', ndvi: 0.36, gndvi: 0.33, ndre: 0.15, lai: 0.7, canopyCover: 18, canopyTempC: 22, notes: 'Patchy emergence west side' },
      { surveyDate: '2026-05-28', growthStage: 'early', ndvi: 0.57, gndvi: 0.52, ndre: 0.23, lai: 1.8, canopyCover: 45, canopyTempC: 24, notes: 'Replant strips recovering' },
      { surveyDate: '2026-06-24', growthStage: 'mid', ndvi: 0.72, gndvi: 0.65, ndre: 0.31, lai: 3.2, canopyCover: 74, canopyTempC: 26, notes: 'Closing canopy' },
      { surveyDate: '2026-07-20', growthStage: 'mid', ndvi: 0.79, gndvi: 0.71, ndre: 0.35, lai: 3.9, canopyCover: 85, canopyTempC: 27, notes: 'N top-up applied after survey' },
      { surveyDate: '2026-08-14', growthStage: 'late', ndvi: 0.71, gndvi: 0.63, ndre: 0.33, lai: 3.5, canopyCover: 80, canopyTempC: 26, notes: 'Slight early senescence edges' },
    ],
  },
  {
    name: 'East River Field',
    cropType: 'soybean',
    areaHectares: 32.0,
    soilType: 'Silt loam',
    description: 'River-adjacent alluvial field, high organic matter, drainage channels installed.',
    soilSamples: [
      { sampledAt: '2026-04-28', ph: 6.6, nitrogen: 140, phosphorus: 38, potassium: 165, organicMatter: 4.6, moisture: 42, temperature: 16, electricalCond: 0.5, cationExchangeCap: 19, bulkDensity: 1.2, notes: 'Alluvial, naturally fertile' },
    ],
    readings: [
      { surveyDate: '2026-05-10', growthStage: 'early', ndvi: 0.38, gndvi: 0.35, ndre: 0.16, lai: 0.8, canopyCover: 20, canopyTempC: 22, notes: 'Post-planting baseline' },
      { surveyDate: '2026-06-08', growthStage: 'early', ndvi: 0.62, gndvi: 0.58, ndre: 0.26, lai: 2.1, canopyCover: 55, canopyTempC: 24, notes: 'V4 stage, uniform' },
      { surveyDate: '2026-07-05', growthStage: 'mid', ndvi: 0.81, gndvi: 0.73, ndre: 0.37, lai: 3.8, canopyCover: 86, canopyTempC: 26, notes: 'R1 flowering onset' },
      { surveyDate: '2026-08-01', growthStage: 'mid', ndvi: 0.86, gndvi: 0.78, ndre: 0.41, lai: 4.4, canopyCover: 93, canopyTempC: 27, notes: 'Pod set progressing well' },
      { surveyDate: '2026-08-26', growthStage: 'late', ndvi: 0.78, gndvi: 0.70, ndre: 0.39, lai: 4.0, canopyCover: 89, canopyTempC: 25, notes: 'R5 seed fill' },
    ],
  },
  {
    name: 'South Terrace',
    cropType: 'wheat',
    areaHectares: 27.8,
    soilType: 'Clay loam',
    description: 'Terraced winter wheat, rain-fed, historical septoria pressure.',
    variety: 'Crusoe',
    latitude: 52.0122,
    longitude: 0.1265,
    sowingDate: '2026-03-15',
    soilSamples: [
      { sampledAt: '2026-03-01', ph: 6.4, nitrogen: 115, phosphorus: 34, potassium: 155, organicMatter: 3.4, moisture: 34, temperature: 9, electricalCond: 0.44, cationExchangeCap: 16, bulkDensity: 1.3, notes: 'Pre-drilling' },
      { sampledAt: '2026-04-25', ph: 6.5, nitrogen: 145, phosphorus: 36, potassium: 160, organicMatter: 3.6, moisture: 46, temperature: 14, electricalCond: 0.48, notes: 'After first N application' },
    ],
    readings: [
      { surveyDate: '2026-03-15', growthStage: 'tillering', ndvi: 0.45, gndvi: 0.41, ndre: 0.20, lai: 1.2, canopyCover: 30, canopyTempC: 12, notes: 'Tillering complete' },
      { surveyDate: '2026-04-12', growthStage: 'jointing', ndvi: 0.68, gndvi: 0.62, ndre: 0.29, lai: 2.6, canopyCover: 62, canopyTempC: 15, notes: 'Stem extension' },
      { surveyDate: '2026-05-10', growthStage: 'booting', ndvi: 0.83, gndvi: 0.74, ndre: 0.38, lai: 4.2, canopyCover: 90, canopyTempC: 19, notes: 'Booting, fungicide T2 applied' },
      { surveyDate: '2026-06-08', growthStage: 'heading', ndvi: 0.74, gndvi: 0.66, ndre: 0.36, lai: 3.7, canopyCover: 84, canopyTempC: 22, notes: 'Anthesis, dry spell' },
      { surveyDate: '2026-07-02', growthStage: 'grain_fill', ndvi: 0.61, gndvi: 0.54, ndre: 0.30, lai: 2.9, canopyCover: 70, canopyTempC: 27, notes: 'Grain fill, heat stress episodes' },
    ],
  },
  {
    name: 'West Pivot 1',
    cropType: 'rice',
    areaHectares: 15.6,
    soilType: 'Puddled clay',
    description: 'Bunded paddy under pivot-assisted flood, aerobic alternate wetting trial.',
    soilSamples: [
      { sampledAt: '2026-05-05', ph: 6.1, nitrogen: 130, phosphorus: 30, potassium: 140, organicMatter: 4.2, moisture: 58, temperature: 20, electricalCond: 0.72, cationExchangeCap: 22, bulkDensity: 1.05, notes: 'Puddled, anaerobic pockets' },
    ],
    readings: [
      { surveyDate: '2026-05-20', growthStage: 'early', ndvi: 0.40, gndvi: 0.36, ndre: 0.17, lai: 0.9, canopyCover: 22, canopyTempC: 24, notes: 'Transplant establishment' },
      { surveyDate: '2026-06-16', growthStage: 'early', ndvi: 0.64, gndvi: 0.59, ndre: 0.27, lai: 2.2, canopyCover: 56, canopyTempC: 26, notes: 'Tillering active' },
      { surveyDate: '2026-07-14', growthStage: 'mid', ndvi: 0.82, gndvi: 0.75, ndre: 0.38, lai: 4.0, canopyCover: 89, canopyTempC: 28, notes: 'Panicle initiation' },
      { surveyDate: '2026-08-10', growthStage: 'mid', ndvi: 0.87, gndvi: 0.80, ndre: 0.43, lai: 4.7, canopyCover: 94, canopyTempC: 28, notes: 'Boot stage, heads emerging' },
      { surveyDate: '2026-09-01', growthStage: 'late', ndvi: 0.80, gndvi: 0.72, ndre: 0.40, lai: 4.2, canopyCover: 90, canopyTempC: 27, notes: 'Milky ripeness' },
    ],
  },
  {
    name: 'Hillside Plot C',
    cropType: 'cotton',
    areaHectares: 11.4,
    soilType: 'Shallow rocky loam',
    description: 'Marginal hillside plot, eroded patches, drip-irrigated.',
    soilSamples: [
      { sampledAt: '2026-05-10', ph: 7.3, nitrogen: 48, phosphorus: 18, potassium: 95, organicMatter: 1.6, moisture: 19, temperature: 22, electricalCond: 0.28, cationExchangeCap: 8, bulkDensity: 1.55, notes: 'Eroded shallow topsoil' },
    ],
    readings: [
      { surveyDate: '2026-05-25', growthStage: 'early', ndvi: 0.28, gndvi: 0.26, ndre: 0.13, lai: 0.5, canopyCover: 12, canopyTempC: 25, notes: 'Slow start, cool nights' },
      { surveyDate: '2026-06-22', growthStage: 'early', ndvi: 0.44, gndvi: 0.40, ndre: 0.19, lai: 1.1, canopyCover: 28, canopyTempC: 27, notes: 'Uneven stand, rocky section lagging' },
      { surveyDate: '2026-07-19', growthStage: 'mid', ndvi: 0.58, gndvi: 0.52, ndre: 0.24, lai: 1.9, canopyCover: 47, canopyTempC: 29, notes: 'Squaring; iron chlorosis spots' },
      { surveyDate: '2026-08-15', growthStage: 'mid', ndvi: 0.64, gndvi: 0.57, ndre: 0.27, lai: 2.3, canopyCover: 55, canopyTempC: 28, notes: 'First flowers, canopy thin' },
      { surveyDate: '2026-09-01', growthStage: 'late', ndvi: 0.59, gndvi: 0.52, ndre: 0.25, lai: 2.0, canopyCover: 50, canopyTempC: 27, notes: 'Boll set moderate, stress visible' },
    ],
  },
  {
    name: 'East Field C',
    cropType: 'wheat',
    areaHectares: 19.3,
    soilType: 'Sandy clay loam',
    description: 'Second-season wheat after pulses, cooler slope aspect, yellow rust watch list.',
    variety: 'Siskin',
    latitude: 52.021,
    longitude: 0.142,
    sowingDate: '2026-03-20',
    soilSamples: [
      { sampledAt: '2026-03-05', ph: 6.7, nitrogen: 58, phosphorus: 26, potassium: 130, organicMatter: 2.9, moisture: 30, temperature: 10, electricalCond: 0.36, cationExchangeCap: 14, bulkDensity: 1.38, notes: 'Post-legume residual N low' },
      { sampledAt: '2026-04-28', ph: 6.7, nitrogen: 88, phosphorus: 28, potassium: 135, organicMatter: 3.0, moisture: 38, temperature: 15, electricalCond: 0.4, notes: 'Top-up applied' },
    ],
    readings: [
      { surveyDate: '2026-03-20', growthStage: 'tillering', ndvi: 0.42, gndvi: 0.38, ndre: 0.19, lai: 1.1, canopyCover: 27, canopyTempC: 13, notes: 'Slow spring green-up' },
      { surveyDate: '2026-04-18', growthStage: 'jointing', ndvi: 0.61, gndvi: 0.55, ndre: 0.27, lai: 2.2, canopyCover: 56, canopyTempC: 16, notes: 'Uniform stem extension' },
      { surveyDate: '2026-05-15', growthStage: 'booting', ndvi: 0.76, gndvi: 0.68, ndre: 0.34, lai: 3.6, canopyCover: 82, canopyTempC: 19, notes: 'T3 fungicide timing near' },
      { surveyDate: '2026-06-12', growthStage: 'heading', ndvi: 0.70, gndvi: 0.63, ndre: 0.33, lai: 3.3, canopyCover: 78, canopyTempC: 23, notes: 'Head emergence complete' },
    ],
  },
]

async function runDetections(zoneId: string) {
  const zone = await prisma.zone.findUnique({
    where: { id: zoneId },
    include: {
      readings: { orderBy: { surveyDate: 'desc' }, take: 1 },
      soilSamples: { orderBy: { sampledAt: 'desc' }, take: 1 },
    },
  })
  if (!zone || zone.readings.length === 0) return 0

  const reading = zone.readings[0]
  const soilRow = zone.soilSamples[0] ?? null

  // Lazy-import to keep bun happy with TS path aliases
  const { assessAllDiseases, DISEASE_ORDER, severityFor } = await import('../src/lib/disease-engine')

  const soil = soilRow
    ? {
        ph: soilRow.ph,
        nitrogen: soilRow.nitrogen,
        phosphorus: soilRow.phosphorus,
        potassium: soilRow.potassium,
        organicMatter: soilRow.organicMatter,
        moisture: soilRow.moisture,
        temperature: soilRow.temperature,
        electricalCond: soilRow.electricalCond ?? undefined,
        cationExchangeCap: soilRow.cationExchangeCap ?? undefined,
        bulkDensity: soilRow.bulkDensity ?? undefined,
      }
    : {}

  const uav = {
    ndvi: reading.ndvi,
    ndre: reading.ndre,
    gndvi: reading.gndvi,
    savi: reading.savi ?? undefined,
    evi: reading.evi ?? undefined,
    sipi: reading.sipi ?? undefined,
    pri: reading.pri ?? undefined,
    blue: reading.blue ?? undefined,
    green: reading.green ?? undefined,
    red: reading.red ?? undefined,
    redEdge: reading.redEdge ?? undefined,
    nir: reading.nir ?? undefined,
    canopyTempC: reading.canopyTempC ?? undefined,
  }

  const results = assessAllDiseases(soil, uav)
  const ordered = DISEASE_ORDER.map((d) => results.find((r) => r.disease === d)!)
  const featureSnapshot = JSON.stringify({
    soil,
    uav,
    soilSampledAt: soilRow?.sampledAt ?? null,
    uavSurveyedAt: reading.surveyDate,
    computedAt: new Date().toISOString(),
  })

  let alertCount = 0
  for (const r of ordered) {
    const detection = await prisma.diseaseDetection.create({
      data: {
        zoneId: zone.id,
        disease: r.disease,
        riskScore: r.riskScore,
        riskLevel: r.riskLevel,
        soilContribution: r.soilScore,
        uavContribution: r.uavScore,
        confidence: r.confidence,
        featureSnapshot,
        explanation: r.explanation,
        recommendations: r.recommendation,
      },
    })
    const severity = severityFor(r.riskLevel)
    if (severity !== 'info') {
      await prisma.diseaseAlert.create({
        data: {
          zoneId: zone.id,
          detectionId: detection.id,
          severity,
          title: `${r.label} — ${r.riskLevel.toUpperCase()} risk`,
          message: r.explanation,
          action: r.recommendation,
          triggeredAt: new Date(),
        },
      })
      alertCount++
    }
  }
  return alertCount
}

async function main() {
  const existing = await prisma.zone.count()
  if (existing > 0) {
    console.log(`Database already has ${existing} zones — skipping seed.`)
    return
  }
  let readingCount = 0
  let soilCount = 0
  let alertTotal = 0

  for (const z of ZONES) {
    const zone = await prisma.zone.create({
      data: {
        name: z.name,
        cropType: z.cropType,
        areaHectares: z.areaHectares,
        soilType: z.soilType,
        description: z.description,
        variety: z.variety ?? null,
        latitude: z.latitude ?? null,
        longitude: z.longitude ?? null,
        sowingDate: z.sowingDate ? new Date(z.sowingDate) : null,
      },
    })
    for (const r of z.readings) {
      if (!GROWTH_STAGES.includes(r.growthStage)) throw new Error(`bad stage ${r.growthStage}`)
      const bands = bandsFromIndices(r.ndvi, r.gndvi, r.ndre, r.canopyTempC)
      await prisma.zoneReading.create({
        data: {
          zoneId: zone.id,
          surveyDate: new Date(r.surveyDate),
          growthStage: r.growthStage,
          ndvi: r.ndvi,
          gndvi: r.gndvi,
          ndre: r.ndre,
          lai: r.lai,
          canopyCover: r.canopyCover,
          altitudeM: 60,
          blue: bands.blue,
          green: bands.green,
          red: bands.red,
          redEdge: bands.redEdge,
          nir: bands.nir,
          savi: bands.savi,
          evi: bands.evi,
          sipi: bands.sipi,
          pri: bands.pri,
          canopyTempC: bands.canopyTempC ?? null,
          droneModel: DRONE.droneModel,
          sensorType: DRONE.sensorType,
          notes: r.notes ?? null,
        },
      })
      readingCount++
    }
    for (const s of z.soilSamples) {
      const { sampledAt, ...rest } = s
      await prisma.soilSample.create({
        data: { zoneId: zone.id, sampledAt: new Date(sampledAt), ...rest, notes: rest.notes ?? null },
      })
      soilCount++
    }
    // Run the disease fusion engine on the latest survey + soil
    const alerts = await runDetections(zone.id)
    alertTotal += alerts
    console.log(`  ✓ ${zone.name}: ${z.readings.length} surveys, ${z.soilSamples.length} soil samples, ${alerts} alerts`)
  }

  console.log(
    `Seeded ${ZONES.length} zones · ${readingCount} UAV readings · ${soilCount} soil samples · ${alertTotal} disease alerts.`
  )
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
