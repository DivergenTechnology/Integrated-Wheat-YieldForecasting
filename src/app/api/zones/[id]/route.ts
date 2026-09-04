import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

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
