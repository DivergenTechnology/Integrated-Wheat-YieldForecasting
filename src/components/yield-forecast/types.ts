import type {
  ModelType,
  ZoneForecast,
  ZoneInput,
} from '@/lib/forecast-engine'

export interface ApiData {
  zones: (ZoneInput & { readingCount: number })[]
  forecasts: ZoneForecast[]
  summary: {
    totalTonnes: number
    totalArea: number
    avgYield: number
    avgScore: number
    avgConfidence: number
    healthDist: Record<ZoneForecast['health'], number>
    stressedZones: number
    zoneCount: number
  }
  ndviTrend: { date: string; [zoneName: string]: string | number }[]
}

export type { ModelType, ZoneForecast, ZoneInput }
