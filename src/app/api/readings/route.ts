import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

const VALID_STAGES = ['early', 'mid', 'late']

/**
 * POST /api/readings — record a UAV survey reading for a zone.
 * Body: { zoneId, surveyDate, growthStage, ndvi, gndvi, ndre, lai, canopyCover, droneModel?, sensorType?, notes? }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      zoneId,
      surveyDate,
      growthStage,
      ndvi,
      gndvi,
      ndre,
      lai,
      canopyCover,
      droneModel,
      sensorType,
      notes,
    } = body ?? {}

    if (!zoneId || typeof zoneId !== 'string') {
      return NextResponse.json({ error: 'zoneId is required' }, { status: 400 })
    }
    const zone = await db.zone.findUnique({ where: { id: zoneId } })
    if (!zone) {
      return NextResponse.json({ error: 'Zone not found' }, { status: 404 })
    }
    if (!VALID_STAGES.includes(String(growthStage))) {
      return NextResponse.json({ error: 'growthStage must be early, mid or late' }, { status: 400 })
    }

    const date = surveyDate ? new Date(surveyDate) : new Date()
    if (isNaN(date.getTime())) {
      return NextResponse.json({ error: 'Invalid survey date' }, { status: 400 })
    }

    const num = (v: unknown) => Number(v)
    const checks: [string, number, number, number][] = [
      ['ndvi', num(ndvi), -1, 1],
      ['gndvi', num(gndvi), -1, 1],
      ['ndre', num(ndre), -1, 1],
      ['lai', num(lai), 0, 12],
      ['canopyCover', num(canopyCover), 0, 100],
    ]
    const data: Record<string, number> = {}
    for (const [name, value, min, max] of checks) {
      if (!Number.isFinite(value) || value < min || value > max) {
        return NextResponse.json(
          { error: `${name} must be a number between ${min} and ${max}` },
          { status: 400 }
        )
      }
      data[name] = value
    }

    const reading = await db.zoneReading.create({
      data: {
        zoneId,
        surveyDate: date,
        growthStage: String(growthStage),
        ndvi: data.ndvi,
        gndvi: data.gndvi,
        ndre: data.ndre,
        lai: data.lai,
        canopyCover: data.canopyCover,
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
