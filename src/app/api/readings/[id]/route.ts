import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

/** DELETE /api/readings/[id] — remove a UAV survey reading */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const existing = await db.zoneReading.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Reading not found' }, { status: 404 })
    }
    await db.zoneReading.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('DELETE /api/readings/[id] error:', error)
    return NextResponse.json({ error: 'Failed to delete reading' }, { status: 500 })
  }
}
