import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { deriveIndices } from '@/lib/disease-engine'
import { GROWTH_STAGES } from '@/lib/forecast-engine'

export const dynamic = 'force-dynamic'

const VALID_STAGES: string[] = GROWTH_STAGES

/**
 * POST /api/readings — record a UAV survey reading for a zone.
 * Body: { zoneId, surveyDate, growthStage, ndvi, gndvi, ndre, lai, canopyCover,
 *         altitudeM?, blue?, green?, red?, redEdge?, nir?, canopyTempC?,
 *         savi?, evi?, sipi?, pri?, droneModel?, sensorType?, notes? }
 *
 * When raw multispectral bands are supplied, any missing derived index
 * (ndvi/gndvi/ndre/savi/evi/sipi/pri) is computed from them automatically.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      zoneId,
      surveyDate,
      growthStage,
      lai,
      canopyCover,
      droneModel,
      sensorType,
      notes,
      ...rest
    } = body ?? {}

    if (!zoneId || typeof zoneId !== 'string') {
      return NextResponse.json({ error: 'zoneId is required' }, { status: 400 })
    }
    const zone = await db.zone.findUnique({ where: { id: zoneId } })
    if (!zone) {
      return NextResponse.json({ error: 'Zone not found' }, { status: 404 })
    }
    if (!VALID_STAGES.includes(String(growthStage))) {
      return NextResponse.json(
        { error: `growthStage must be one of: ${VALID_STAGES.join(', ')}` },
        { status: 400 }
      )
    }

    const date = surveyDate ? new Date(surveyDate) : new Date()
    if (isNaN(date.getTime())) {
      return NextResponse.json({ error: 'Invalid survey date' }, { status: 400 })
    }

    const numOrNull = (v: unknown): number | undefined => {
      if (v === undefined || v === null || v === '') return undefined
      const n = Number(v)
      return Number.isFinite(n) ? n : undefined
    }

    // Raw reflectance bands (optional)
    const bands = {
      blue: numOrNull(rest.blue),
      green: numOrNull(rest.green),
      red: numOrNull(rest.red),
      redEdge: numOrNull(rest.redEdge),
      nir: numOrNull(rest.nir),
    }
    const hasAllBands = Object.values(bands).every((v) => v !== undefined)

    // Derived indices: use supplied values, fall back to band computation
    const derived = hasAllBands ? deriveIndices(bands as never) : {}
    const pick = (key: string, lo: number, hi: number): number => {
      const supplied = numOrNull(rest[key]) ?? (derived as Record<string, number>)[key]
      if (supplied === undefined || supplied < lo || supplied > hi) return NaN
      return supplied
    }

    const ndvi = pick('ndvi', -1, 1)
    const gndvi = pick('gndvi', -1, 1)
    const ndre = pick('ndre', -1, 1)
    if ([ndvi, gndvi, ndre].some((v) => Number.isNaN(v))) {
      return NextResponse.json(
        { error: 'ndvi, gndvi and ndre are required (range -1 to 1) — supply values or full raw bands' },
        { status: 400 }
      )
    }

    const laiN = Number(lai)
    const canopyN = Number(canopyCover)
    if (!Number.isFinite(laiN) || laiN < 0 || laiN > 12) {
      return NextResponse.json({ error: 'lai must be a number between 0 and 12' }, { status: 400 })
    }
    if (!Number.isFinite(canopyN) || canopyN < 0 || canopyN > 100) {
      return NextResponse.json({ error: 'canopyCover must be a number between 0 and 100' }, { status: 400 })
    }

    const optional: [string, number | undefined, number, number][] = [
      ['savi', numOrNull(rest.savi) ?? (derived as Record<string, number>).savi, -1, 2],
      ['evi', numOrNull(rest.evi) ?? (derived as Record<string, number>).evi, -3, 5],
      ['sipi', numOrNull(rest.sipi) ?? (derived as Record<string, number>).sipi, 0, 10],
      ['pri', numOrNull(rest.pri) ?? (derived as Record<string, number>).pri, -2, 2],
      ['canopyTempC', numOrNull(rest.canopyTempC), -20, 70],
      ['altitudeM', numOrNull(rest.altitudeM), 0, 5000],
      ['blue', bands.blue, 0, 1],
      ['green', bands.green, 0, 1],
      ['red', bands.red, 0, 1],
      ['redEdge', bands.redEdge, 0, 1],
      ['nir', bands.nir, 0, 1],
    ]
    const extra: Record<string, number> = {}
    for (const [name, value, min, max] of optional) {
      if (value === undefined) continue
      if (value < min || value > max) {
        return NextResponse.json({ error: `${name} must be between ${min} and ${max}` }, { status: 400 })
      }
      extra[name] = value
    }

    const reading = await db.zoneReading.create({
      data: {
        zoneId,
        surveyDate: date,
        growthStage: String(growthStage),
        ndvi,
        gndvi,
        ndre,
        lai: laiN,
        canopyCover: canopyN,
        ...extra,
        droneModel: droneModel ? String(droneModel).trim() : null,
        sensorType: sensorType ? String(sensorType).trim() : null,
        notes: notes ? String(notes).trim() : null,
      },
    })

    return NextResponse.json({ reading }, { status: 201 })
  } catch (error) {
    console.error('POST /api/readings error:', error)
    return NextResponse.json({ error: 'Failed to record UAV reading' }, { status: 500 })
  }
}
