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
    const required: [string, number, number, number][] = [
      ['ph', num(body?.ph), 0, 14],
      ['nitrogen', num(body?.nitrogen), 0, 1000],
      ['phosphorus', num(body?.phosphorus), 0, 500],
      ['potassium', num(body?.potassium), 0, 1000],
      ['organicMatter', num(body?.organicMatter), 0, 20],
      ['moisture', num(body?.moisture), 0, 100],
      ['temperature', num(body?.temperature), -20, 60],
    ]
    const data: Record<string, number> = {}
    for (const [name, value, min, max] of required) {
      if (!Number.isFinite(value) || value < min || value > max) {
        return NextResponse.json(
          { error: `${name} must be a number between ${min} and ${max}` },
          { status: 400 }
        )
      }
      data[name] = value
    }

    const optional: [string, number | null, number, number][] = [
      ['electricalCond', body?.electricalCond == null ? null : num(body.electricalCond), 0, 20],
      ['cationExchangeCap', body?.cationExchangeCap == null ? null : num(body.cationExchangeCap), 0, 100],
      ['bulkDensity', body?.bulkDensity == null ? null : num(body.bulkDensity), 0.2, 3],
    ]
    const extra: Record<string, number | null> = {}
    for (const [name, value, min, max] of optional) {
      if (value == null) {
        extra[name] = null
        continue
      }
      if (!Number.isFinite(value) || value < min || value > max) {
        return NextResponse.json(
          { error: `${name} must be between ${min} and ${max}` },
          { status: 400 }
        )
      }
      extra[name] = value
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
