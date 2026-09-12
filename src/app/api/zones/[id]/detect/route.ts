import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import {
  assessAllDiseases,
  DISEASE_ORDER,
  severityFor,
  type SoilSnapshot,
  type UavSnapshot,
} from '@/lib/disease-engine'

export const dynamic = 'force-dynamic'

/**
 * POST /api/zones/[id]/detect — run the fused soil+UAV disease detection
 * for a zone using its latest soil sample and latest UAV reading.
 * Persists one detection row per disease and creates alerts for
 * high/severe risk findings. Returns the full per-disease breakdown.
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const zone = await db.zone.findUnique({
      where: { id },
      include: {
        readings: { orderBy: { surveyDate: 'desc' }, take: 1 },
        soilSamples: { orderBy: { sampledAt: 'desc' }, take: 1 },
      },
    })
    if (!zone) {
      return NextResponse.json({ error: 'Zone not found' }, { status: 404 })
    }
    if (zone.readings.length === 0) {
      return NextResponse.json(
        { error: 'No UAV survey recorded for this zone yet — record a survey first' },
        { status: 400 }
      )
    }

    const reading = zone.readings[0]
    const soilRow = zone.soilSamples[0] ?? null

    const soil: SoilSnapshot = soilRow
      ? {
          ph: soilRow.ph,
          nitrogen: soilRow.nitrogen,
          phosphorus: soilRow.phosphorus,
          potassium: soilRow.potassium,
          organicMatter: soilRow.organicMatter,
          moisture: soilRow.moisture,
          temperature: soilRow.temperature,
          electricalCond: soilRow.electricalCond ?? undefined,
          cationExchangeCap: soilRow.cationExchangeCap ?? undefined,
          bulkDensity: soilRow.bulkDensity ?? undefined,
        }
      : {}

    const uav: UavSnapshot = {
      ndvi: reading.ndvi,
      ndre: reading.ndre,
      gndvi: reading.gndvi,
      savi: reading.savi ?? undefined,
      evi: reading.evi ?? undefined,
      sipi: reading.sipi ?? undefined,
      pri: reading.pri ?? undefined,
      blue: reading.blue ?? undefined,
      green: reading.green ?? undefined,
      red: reading.red ?? undefined,
      redEdge: reading.redEdge ?? undefined,
      nir: reading.nir ?? undefined,
      canopyTempC: reading.canopyTempC ?? undefined,
    }

    const results = assessAllDiseases(soil, uav)

    // Order rows by canonical DISEASE_ORDER for stable display
    const ordered = DISEASE_ORDER.map(
      (d) => results.find((r) => r.disease === d)!
    )

    const featureSnapshot = JSON.stringify({
      soil,
      uav,
      soilSampledAt: soilRow?.sampledAt ?? null,
      uavSurveyedAt: reading.surveyDate,
      computedAt: new Date().toISOString(),
    })

    await db.$transaction(async (tx) => {
      for (const r of ordered) {
        const detection = await tx.diseaseDetection.create({
          data: {
            zoneId: zone.id,
            disease: r.disease,
            riskScore: r.riskScore,
            riskLevel: r.riskLevel,
            soilContribution: r.soilScore,
            uavContribution: r.uavScore,
            confidence: r.confidence,
            featureSnapshot,
            explanation: r.explanation,
            recommendations: r.recommendation,
          },
        })
        const severity = severityFor(r.riskLevel)
        if (severity !== 'info') {
          await tx.diseaseAlert.create({
            data: {
              zoneId: zone.id,
              detectionId: detection.id,
              severity,
              title: `${r.label} — ${r.riskLevel.toUpperCase()} risk`,
              message: r.explanation,
              action: r.recommendation,
              triggeredAt: new Date(),
            },
          })
        }
      }
    })

    return NextResponse.json(
      {
        zone: { id: zone.id, name: zone.name, cropType: zone.cropType },
        detections: ordered,
        soilAvailable: !!soilRow,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('POST /api/zones/[id]/detect error:', error)
    return NextResponse.json({ error: 'Failed to run disease detection' }, { status: 500 })
  }
}
