import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import {
  forecastAllZones,
  summarizeForecasts,
  buildNdviTrend,
  type ModelType,
  type ZoneInput,
  type GrowthStage,
} from '@/lib/forecast-engine'

export const dynamic = 'force-dynamic'

const VALID_MODELS: ModelType[] = ['mvhs', 'regression', 'ensemble']

/** GET /api/zones?model=ensemble — zones + readings + forecasts + summary */
export async function GET(req: NextRequest) {
  try {
    const modelParam = req.nextUrl.searchParams.get('model') as ModelType | null
    const model: ModelType = modelParam && VALID_MODELS.includes(modelParam) ? modelParam : 'ensemble'

    const zones = await db.zone.findMany({
      include: { readings: { orderBy: { surveyDate: 'asc' } } },
      orderBy: { createdAt: 'asc' },
    })

    const zoneInputs: ZoneInput[] = zones.map((z) => ({
      id: z.id,
      name: z.name,
      cropType: z.cropType,
      areaHectares: z.areaHectares,
      soilType: z.soilType,
      readings: z.readings.map((r) => ({
        id: r.id,
        zoneId: r.zoneId,
        surveyDate: r.surveyDate,
        growthStage: r.growthStage as GrowthStage,
        ndvi: r.ndvi,
        gndvi: r.gndvi,
        ndre: r.ndre,
        lai: r.lai,
        canopyCover: r.canopyCover,
      })),
    }))

    const forecasts = forecastAllZones(zoneInputs, model)
    const summary = summarizeForecasts(forecasts)
    const ndviTrend = buildNdviTrend(zoneInputs)

    return NextResponse.json({
      zones: zoneInputs.map((z) => ({ ...z, readingCount: z.readings.length })),
      forecasts,
      summary,
      ndviTrend,
    })
  } catch (error) {
    console.error('GET /api/zones error:', error)
    return NextResponse.json({ error: 'Failed to load zones and forecasts' }, { status: 500 })
  }
}

/** POST /api/zones — create a new farming zone */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, cropType, areaHectares, soilType, description } = body ?? {}

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Zone name is required' }, { status: 400 })
    }
    const crop = String(cropType || '')
    if (!['maize', 'wheat', 'soybean', 'rice', 'cotton'].includes(crop)) {
      return NextResponse.json({ error: 'Invalid crop type' }, { status: 400 })
    }
    const area = Number(areaHectares)
    if (!Number.isFinite(area) || area <= 0 || area > 100000) {
      return NextResponse.json({ error: 'Area must be a positive number of hectares' }, { status: 400 })
    }

    const zone = await db.zone.create({
      data: {
        name: name.trim(),
        cropType: crop,
        areaHectares: area,
        soilType: soilType ? String(soilType).trim() : null,
        description: description ? String(description).trim() : null,
      },
      include: { readings: true },
    })

    return NextResponse.json({ zone }, { status: 201 })
  } catch (error) {
    console.error('POST /api/zones error:', error)
    return NextResponse.json({ error: 'Failed to create zone' }, { status: 500 })
  }
}
