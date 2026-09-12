import type { AlertSeverity, DiseaseId, RiskLevel } from '@/lib/disease-engine'

export interface DiseaseAlertItem {
  id: string
  zoneId: string
  detectionId: string | null
  severity: AlertSeverity
  title: string
  message: string
  action: string | null
  acknowledged: boolean
  acknowledgedAt: string | null
  triggeredAt: string
  zone: { id: string; name: string; cropType: string }
}

export interface LatestRisk {
  disease: string
  label: string
  riskScore: number
  riskLevel: RiskLevel
  soilContribution: number
  uavContribution: number
  confidence: number
}

export interface DiseaseZoneState {
  id: string
  name: string
  cropType: string
  areaHectares: number
  variety: string | null
  growthStage: string | null
  lastSurveyAt: string | null
  lastSoilAt: string | null
  latestRisks: LatestRisk[]
  avgRisk: number
  maxRisk: number
}

export interface DiseaseData {
  kpis: {
    zoneCount: number
    avgRisk: number
    unackAlerts: number
    criticalAlerts: number
    detectionCount: number
    alertCount: number
  }
  levelCounts: Record<RiskLevel, number>
  diseaseCounts: Record<string, number>
  zones: DiseaseZoneState[]
  recentAlerts: DiseaseAlertItem[]
}

export interface SoilSampleItem {
  id: string
  zoneId: string
  sampledAt: string
  ph: number
  nitrogen: number
  phosphorus: number
  potassium: number
  organicMatter: number
  moisture: number
  temperature: number
  electricalCond: number | null
  cationExchangeCap: number | null
  bulkDensity: number | null
  notes: string | null
}

export interface DetectionItem {
  id: string
  zoneId: string
  detectedAt: string
  disease: DiseaseId
  riskScore: number
  riskLevel: RiskLevel
  soilContribution: number
  uavContribution: number
  confidence: number
  featureSnapshot: string | null
  explanation: string | null
  recommendations: string | null
}

export interface ZoneAlertItem {
  id: string
  severity: AlertSeverity
  title: string
  message: string
  action: string | null
  acknowledged: boolean
  triggeredAt: string
}

export interface ZoneDiseaseDetail {
  id: string
  name: string
  cropType: string
  areaHectares: number
  variety: string | null
  readings: { id: string; surveyDate: string; growthStage: string; ndvi: number; gndvi: number; ndre: number; lai: number; canopyCover: number }[]
  soilSamples?: SoilSampleItem[]
  detections?: DetectionItem[]
  alerts?: ZoneAlertItem[]
}
