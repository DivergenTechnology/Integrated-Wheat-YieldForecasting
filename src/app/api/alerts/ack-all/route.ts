import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

/** POST /api/alerts/ack-all — acknowledge every unacknowledged alert */
export async function POST() {
  try {
    const result = await db.diseaseAlert.updateMany({
      where: { acknowledged: false },
      data: { acknowledged: true, acknowledgedAt: new Date() },
    })
    return NextResponse.json({ acknowledged: result.count })
  } catch (error) {
    console.error('POST /api/alerts/ack-all error:', error)
    return NextResponse.json({ error: 'Failed to acknowledge alerts' }, { status: 500 })
  }
}
