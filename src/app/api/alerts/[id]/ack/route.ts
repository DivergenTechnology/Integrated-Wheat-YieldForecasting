import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

/** PATCH /api/alerts/[id]/ack — acknowledge a single disease alert */
export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const alert = await db.diseaseAlert.update({
      where: { id },
      data: { acknowledged: true, acknowledgedAt: new Date() },
    })
    return NextResponse.json({ alert })
  } catch (error) {
    console.error('PATCH /api/alerts/[id]/ack error:', error)
    return NextResponse.json({ error: 'Failed to acknowledge alert' }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  return PATCH(req, ctx)
}
