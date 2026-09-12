import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

const num = (v: unknown) => Number(v)

/**
 * POST /api/zones/[id]/soil — record a soil sample for a zone.
 * Body: { ph, nitrogen, phosphorus, potassium, organicMatter, moisture,
 *         temperature, electricalCond?, cationExchangeCap?, bulkDensity?,
 *         sampledAt?, notes? }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const zone = await db.zone.findUnique({ where: { id } })
    if (!zone) {
      return NextResponse.json({ error: 'Zone not found' }, { status: 404 })
    }

    const body = await req.json()
    const data = {
      ph: num(body?.ph),
      nitrogen: num(body?.nitrogen),
      phosphorus: num(body?.phosphorus),
      potassium: num(body?.potassium),
      organicMatter: num(body?.organicMatter),
      moisture: num(body?.moisture),
      temperature: num(body?.temperature),
    }
    const required: [string, number, number, number][] = [
      ['ph', data.ph, 0, 14],
      ['nitrogen', data.nitrogen, 0, 1000],
      ['phosphorus', data.phosphorus, 0, 500],
      ['potassium', data.potassium, 0, 1000],
      ['organicMatter', data.organicMatter, 0, 20],
      ['moisture', data.moisture, 0, 100],
      ['temperature', data.temperature, -20, 60],
    ]
    for (const [name, value, min, max] of required) {
      if (!Number.isFinite(value) || value < min || value > max) {
        return NextResponse.json(
          { error: `${name} must be a number between ${min} and ${max}` },
          { status: 400 }
        )
      }
    }

    const extra = {
      electricalCond: body?.electricalCond == null ? null : num(body.electricalCond),
      cationExchangeCap: body?.cationExchangeCap == null ? null : num(body.cationExchangeCap),
      bulkDensity: body?.bulkDensity == null ? null : num(body.bulkDensity),
    }
    const optional: [string, number | null, number, number][] = [
      ['electricalCond', extra.electricalCond, 0, 20],
      ['cationExchangeCap', extra.cationExchangeCap, 0, 100],
      ['bulkDensity', extra.bulkDensity, 0.2, 3],
    ]
    for (const [name, value, min, max] of optional) {
      if (value == null) continue
      if (!Number.isFinite(value) || value < min || value > max) {
        return NextResponse.json(
          { error: `${name} must be between ${min} and ${max}` },
          { status: 400 }
        )
      }
    }

    const sampledAt = body?.sampledAt ? new Date(body.sampledAt) : new Date()
    if (isNaN(sampledAt.getTime())) {
      return NextResponse.json({ error: 'Invalid sampling date' }, { status: 400 })
    }

    const sample = await db.soilSample.create({
      data: {
        zoneId: zone.id,
        sampledAt,
        ...data,
        ...extra,
        notes: body?.notes ? String(body.notes).trim() : null,
      },
    })

    return NextResponse.json({ sample }, { status: 201 })
  } catch (error) {
    console.error('POST /api/zones/[id]/soil error:', error)
    return NextResponse.json({ error: 'Failed to record soil sample' }, { status: 500 })
  }
}
