import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { DISEASE_ORDER } from '@/lib/disease-engine'

export const dynamic = 'force-dynamic'

/**
 * GET /api/disease — full payload for the Disease Monitoring tab:
 * KPIs, risk-level distribution, disease threat counts, recent alerts,
 * recent detections and per-zone latest state (soil + UAV + risks).
 */
export async function GET() {
  try {
    const zones = await db.zone.findMany({
      include: {
        readings: { orderBy: { surveyDate: 'desc' }, take: 1 },
        soilSamples: { orderBy: { sampledAt: 'desc' }, take: 1 },
        detections: { orderBy: { detectedAt: 'desc' }, take: 12 },
      },
      orderBy: { createdAt: 'asc' },
    })

    const alertCount = await db.diseaseAlert.count()
    const detectionCount = await db.diseaseDetection.count()

    interface ZoneState {
      id: string
      name: string
      cropType: string
      areaHectares: number
      variety: string | null
      growthStage: string | null
      lastSurveyAt: string | null
      lastSoilAt: string | null
      latestRisks: {
        disease: string
        label: string
        riskScore: number
        riskLevel: string
        soilContribution: number
        uavContribution: number
        confidence: number
      }[]
      avgRisk: number
      maxRisk: number
    }

    const zoneStates: ZoneState[] = []
    const levelCounts = { low: 0, moderate: 0, high: 0, severe: 0 }
    const diseaseCounts: Record<string, number> = {}
    let riskSum = 0
    let riskZones = 0

    for (const zone of zones) {
      // latest batch = detections sharing the newest detectedAt for this zone
      const newest = zone.detections[0]
      const batch = newest
        ? zone.detections.filter((d) => d.detectedAt.getTime() === newest.detectedAt.getTime())
        : []

      const latestRisks = DISEASE_ORDER.map((d) => {
        const det = batch.find((b) => b.disease === d)
        if (!det) return null
        return {
          disease: det.disease,
          label: det.disease
            .split('_')
            .map((w) => w[0].toUpperCase() + w.slice(1))
            .join(' '),
          riskScore: det.riskScore,
          riskLevel: det.riskLevel,
          soilContribution: det.soilContribution,
          uavContribution: det.uavContribution,
          confidence: det.confidence,
        }
      }).filter(Boolean) as ZoneState['latestRisks']

      const avgRisk = latestRisks.length
        ? latestRisks.reduce((a, r) => a + r.riskScore, 0) / latestRisks.length
        : 0
      const maxRisk = latestRisks.length ? Math.max(...latestRisks.map((r) => r.riskScore)) : 0

      if (latestRisks.length) {
        riskSum += maxRisk
        riskZones++
        for (const r of latestRisks) {
          if (r.riskLevel in levelCounts) levelCounts[r.riskLevel as keyof typeof levelCounts]++
          diseaseCounts[r.disease] = (diseaseCounts[r.disease] ?? 0) + 1
        }
      }

      zoneStates.push({
        id: zone.id,
        name: zone.name,
        cropType: zone.cropType,
        areaHectares: zone.areaHectares,
        variety: zone.variety,
        growthStage: zone.readings[0]?.growthStage ?? null,
        lastSurveyAt: zone.readings[0]?.surveyDate.toISOString() ?? null,
        lastSoilAt: zone.soilSamples[0]?.sampledAt.toISOString() ?? null,
        latestRisks,
        avgRisk: Math.round(avgRisk),
        maxRisk: Math.round(maxRisk),
      })
    }

    const recentAlerts = await db.diseaseAlert.findMany({
      orderBy: { triggeredAt: 'desc' },
      take: 20,
      include: { zone: { select: { id: true, name: true, cropType: true } } },
    })
    const unackAlerts = await db.diseaseAlert.count({ where: { acknowledged: false } })
    const criticalAlerts = await db.diseaseAlert.count({
      where: { acknowledged: false, severity: 'critical' },
    })

    return NextResponse.json({
      kpis: {
        zoneCount: zones.length,
        avgRisk: riskZones ? Math.round(riskSum / riskZones) : 0,
        unackAlerts,
        criticalAlerts,
        detectionCount,
        alertCount,
      },
      levelCounts,
      diseaseCounts,
      zones: zoneStates,
      recentAlerts,
    })
  } catch (error) {
    console.error('GET /api/disease error:', error)
    return NextResponse.json({ error: 'Failed to load disease monitoring data' }, { status: 500 })
  }
}
