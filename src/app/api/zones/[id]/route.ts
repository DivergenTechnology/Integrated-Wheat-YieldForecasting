import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

/**
 * GET /api/zones/[id]?disease=1 — zone detail.
 * With ?disease=1 returns soil-sample history, detection history and alerts
 * for the disease monitoring dialog.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const zone = await db.zone.findUnique({
      where: { id },
      include: {
        readings: { orderBy: { surveyDate: 'asc' } },
        soilSamples: req.nextUrl.searchParams.get('disease')
          ? { orderBy: { sampledAt: 'asc' } }
          : false,
        detections: req.nextUrl.searchParams.get('disease')
          ? { orderBy: { detectedAt: 'desc' }, take: 30 }
          : false,
        alerts: req.nextUrl.searchParams.get('disease')
          ? { orderBy: { triggeredAt: 'desc' }, take: 30 }
          : false,
      },
    })
    if (!zone) {
      return NextResponse.json({ error: 'Zone not found' }, { status: 404 })
    }
    return NextResponse.json({ zone })
  } catch (error) {
    console.error('GET /api/zones/[id] error:', error)
    return NextResponse.json({ error: 'Failed to load zone' }, { status: 500 })
  }
}

/** DELETE /api/zones/[id] — delete a zone and its readings (cascade) */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const existing = await db.zone.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Zone not found' }, { status: 404 })
    }
    await db.zone.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('DELETE /api/zones/[id] error:', error)
    return NextResponse.json({ error: 'Failed to delete zone' }, { status: 500 })
  }
}
