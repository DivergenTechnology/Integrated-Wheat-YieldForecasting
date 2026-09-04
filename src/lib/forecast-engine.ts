/**
 * UAV Yield Forecasting Engine
 * =============================
 * Predicts expected yield (t/ha and total tonnes) for farming zones using
 * vegetation indices derived from UAV (drone) multispectral imagery.
 *
 * Supported indices:
 *  - NDVI  = (NIR - Red) / (NIR + Red)          Canopy vigour / biomass proxy
 *  - GNDVI = (NIR - Green) / (NIR + Green)      Chlorophyll concentration
 *  - NDRE  = (NIR - RedEdge) / (NIR + RedEdge)  Late-season N status (no saturation)
 *  - LAI   Leaf Area Index (m2/m2)              Canopy size / photosynthetic capacity
 *  - Canopy Cover (%)                          Ground shading fraction
 *
 * Models:
 *  1. MVHS  — Multi-Index Vegetation Health Score: growth-stage weighted blend
 *             of the five normalized indices mapped through a calibrated
 *             response curve to a fraction of the crop's attainable yield.
 *  2. NDVI Regression — classic linear NDVI→yield regression calibrated per crop.
 *  3. Ensemble — weighted average of both models (default).
 */

export type GrowthStage = 'early' | 'mid' | 'late'
export type ModelType = 'mvhs' | 'regression' | 'ensemble'
export type CropType = 'maize' | 'wheat' | 'soybean' | 'rice' | 'cotton'

export interface UavIndices {
  ndvi: number
  gndvi: number
  ndre: number
  lai: number
  canopyCover: number // percent
}

export interface ZoneReadingInput {
  id: string
  zoneId: string
  surveyDate: string | Date
  growthStage: GrowthStage
  ndvi: number
  gndvi: number
  ndre: number
  lai: number
  canopyCover: number
}

export interface ZoneInput {
  id: string
  name: string
  cropType: string
  areaHectares: number
  soilType?: string | null
  readings: ZoneReadingInput[]
}

export interface IndexContribution {
  index: string
  label: string
  value: number
  normalized: number // 0-1
  weight: number
  contribution: number // weight * normalized
  status: 'low' | 'moderate' | 'optimal'
}

export interface ZoneForecast {
  zoneId: string
  zoneName: string
  cropType: CropType
  areaHectares: number
  /** Predicted yield in tonnes per hectare */
  yieldPerHectare: number
  /** Predicted total production in tonnes */
  totalYieldTonnes: number
  /** Attainable (potential) yield for the crop under best practice, t/ha */
  potentialYield: number
  /** Achieved fraction of potential 0-1 */
  yieldFraction: number
  /** 0-1 composite vegetation health score (MVHS) */
  vegetationScore: number
  /** Model used */
  model: ModelType
  /** Forecast confidence 0-1 */
  confidence: number
  confidenceBand: { lower: number; upper: number } // t/ha
  /** Health classification for coloring */
  health: 'critical' | 'poor' | 'fair' | 'good' | 'excellent'
  /** Deviation of trend vs previous survey, t/ha delta */
  trendDelta: number
  /** Per-index breakdown of the latest survey */
  contributions: IndexContribution[]
  /** Stress flags detected from the latest survey */
  stressFlags: string[]
  surveysUsed: number
  lastSurveyDate: string
  dominantStage: GrowthStage
}

/* ------------------------------------------------------------------ */
/* Crop calibration profiles                                           */
/* ------------------------------------------------------------------ */

export interface CropProfile {
  label: string
  /** Attainable yield ceiling t/ha (good practice, irrigated) */
  potentialYield: number
  /** Typical NDVI range used for normalization [min, max] */
  ndviRange: [number, number]
  /** Linear regression: yield = slope * NDVI + intercept (t/ha) */
  regression: { slope: number; intercept: number }
  emoji: string
}

export const CROP_PROFILES: Record<CropType, CropProfile> = {
  maize: {
    label: 'Maize',
    potentialYield: 13.0,
    ndviRange: [0.25, 0.94],
    regression: { slope: 24.0, intercept: -10.2 },
    emoji: '🌽',
  },
  wheat: {
    label: 'Wheat',
    potentialYield: 6.5,
    ndviRange: [0.2, 0.9],
    regression: { slope: 8.6, intercept: -3.2 },
    emoji: '🌾',
  },
  soybean: {
    label: 'Soybean',
    potentialYield: 5.5,
    ndviRange: [0.22, 0.9],
    regression: { slope: 7.4, intercept: -2.4 },
    emoji: '🫘',
  },
  rice: {
    label: 'Rice',
    potentialYield: 8.0,
    ndviRange: [0.25, 0.92],
    regression: { slope: 10.8, intercept: -4.0 },
    emoji: '🍚',
  },
  cotton: {
    label: 'Cotton',
    potentialYield: 4.5,
    ndviRange: [0.2, 0.88],
    regression: { slope: 5.4, intercept: -1.8 },
    emoji: '☁️',
  },
}

/** Normalization ranges for the non-NDVI indices */
export const INDEX_RANGES = {
  ndvi: [0.2, 0.95] as const,
  gndvi: [0.18, 0.92] as const,
  ndre: [0.12, 0.62] as const,
  lai: [0.4, 6.5] as const,
  canopy: [15, 100] as const,
}

export const INDEX_LABELS: Record<string, string> = {
  ndvi: 'NDVI',
  gndvi: 'GNDVI',
  ndre: 'NDRE',
  lai: 'LAI',
  canopy: 'Canopy Cover',
}

/* ------------------------------------------------------------------ */
/* Growth-stage weightings (NDVI saturates late → NDRE takes over)     */
/* ------------------------------------------------------------------ */

export const STAGE_WEIGHTS: Record<GrowthStage, Record<string, number>> = {
  early: { ndvi: 0.45, gndvi: 0.25, ndre: 0.10, lai: 0.10, canopy: 0.10 },
  mid: { ndvi: 0.35, gndvi: 0.20, ndre: 0.20, lai: 0.15, canopy: 0.10 },
  late: { ndvi: 0.20, gndvi: 0.15, ndre: 0.35, lai: 0.15, canopy: 0.15 },
}

export const STAGE_LABELS: Record<GrowthStage, string> = {
  early: 'Early (VE–V6)',
  mid: 'Mid (V6–VT / Flowering)',
  late: 'Late (Grain Fill)',
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))

function normalize(value: number, range: readonly [number, number] | number[]): number {
  const [min, max] = range
  return clamp((value - min) / (max - min), 0, 1)
}

function statusFor(norm: number): IndexContribution['status'] {
  if (norm >= 0.7) return 'optimal'
  if (norm >= 0.4) return 'moderate'
  return 'low'
}

/**
 * Calibrated response curve mapping vegetation score (0-1) to the fraction
 * of attainable yield. Mild convexity reflects that very low vigour still
 * produces some biomass, while high scores approach the ceiling asymptotically.
 */
function yieldResponseCurve(score: number): number {
  return clamp(0.12 + 0.98 * Math.pow(score, 1.35), 0.05, 1.0)
}

/* ------------------------------------------------------------------ */
/* Model 1: Multi-Index Vegetation Health Score (MVHS)                 */
/* ------------------------------------------------------------------ */

function forecastMvhs(
  reading: ZoneReadingInput,
  crop: CropProfile
): { score: number; contributions: IndexContribution[]; stressFlags: string[] } {
  const stage = reading.growthStage
  const weights = STAGE_WEIGHTS[stage] ?? STAGE_WEIGHTS.mid

  const norms: Record<string, number> = {
    ndvi: normalize(reading.ndvi, INDEX_RANGES.ndvi),
    gndvi: normalize(reading.gndvi, INDEX_RANGES.gndvi),
    ndre: normalize(reading.ndre, INDEX_RANGES.ndre),
    lai: normalize(reading.lai, INDEX_RANGES.lai),
    canopy: normalize(reading.canopyCover, INDEX_RANGES.canopy),
  }

  const contributions: IndexContribution[] = (Object.keys(weights) as string[]).map((key) => ({
    index: key,
    label: INDEX_LABELS[key],
    value: key === 'canopy' ? reading.canopyCover : key === 'lai' ? reading.lai : (reading as unknown as Record<string, number>)[key],
    normalized: norms[key],
    weight: weights[key],
    contribution: weights[key] * norms[key],
    status: statusFor(norms[key]),
  }))

  const score = contributions.reduce((acc, c) => acc + c.contribution, 0)

  // Stress detection
  const stressFlags: string[] = []
  if (reading.ndvi < 0.45) stressFlags.push('Low canopy vigour (NDVI < 0.45)')
  if (reading.ndre < 0.22 && stage !== 'early') stressFlags.push('Possible nitrogen deficiency (NDRE < 0.22)')
  if (reading.canopyCover < 55 && stage !== 'early') stressFlags.push('Incomplete canopy closure (< 55%)')
  if (reading.lai < 1.8 && stage === 'late') stressFlags.push('Low leaf area at grain fill (LAI < 1.8)')
  // Index disagreement — when normalized indices diverge strongly
  const spread = Math.max(...Object.values(norms)) - Math.min(...Object.values(norms))
  if (spread > 0.45) stressFlags.push('High index disagreement — heterogeneous canopy')

  return { score, contributions, stressFlags }
}

/* ------------------------------------------------------------------ */
/* Model 2: NDVI linear regression                                     */
/* ------------------------------------------------------------------ */

function forecastRegression(reading: ZoneReadingInput, crop: CropProfile): number {
  const raw = crop.regression.slope * reading.ndvi + crop.regression.intercept
  return clamp(raw, 0, crop.potentialYield)
}

/* ------------------------------------------------------------------ */
/* Confidence estimation                                               */
/* ------------------------------------------------------------------ */

function estimateConfidence(
  readings: ZoneReadingInput[],
  scoreSpread: number
): number {
  const n = readings.length
  const recencyFactor = clamp(1 - scoreSpread * 0.6, 0, 1) // agreement between indices
  const countFactor = clamp(n / 4, 0, 1) // more surveys → more certainty
  const base = 0.5 + 0.28 * countFactor + 0.17 * recencyFactor
  return clamp(base, 0.4, 0.95)
}

/* ------------------------------------------------------------------ */
/* Health classification                                               */
/* ------------------------------------------------------------------ */

function classifyHealth(score: number): ZoneForecast['health'] {
  if (score >= 0.8) return 'excellent'
  if (score >= 0.65) return 'good'
  if (score >= 0.5) return 'fair'
  if (score >= 0.35) return 'poor'
  return 'critical'
}

export const HEALTH_COLORS: Record<ZoneForecast['health'], string> = {
  critical: '#b91c1c',
  poor: '#ea580c',
  fair: '#ca8a04',
  good: '#65a30d',
  excellent: '#15803d',
}

export const HEALTH_LABELS: Record<ZoneForecast['health'], string> = {
  critical: 'Critical',
  poor: 'Poor',
  fair: 'Fair',
  good: 'Good',
  excellent: 'Excellent',
}

/* ------------------------------------------------------------------ */
/* Main entry: forecast one zone                                       */
/* ------------------------------------------------------------------ */

export function forecastZone(zone: ZoneInput, model: ModelType): ZoneForecast | null {
  if (!zone.readings || zone.readings.length === 0) return null

  const cropKey = (zone.cropType as CropType) in CROP_PROFILES ? (zone.cropType as CropType) : 'maize'
  const crop = CROP_PROFILES[cropKey]

  // Sort readings chronologically and take the latest for the current state
  const sorted = [...zone.readings].sort(
    (a, b) => new Date(a.surveyDate).getTime() - new Date(b.surveyDate).getTime()
  )
  const latest = sorted[sorted.length - 1]
  const previous = sorted.length > 1 ? sorted[sorted.length - 2] : null

  const { score, contributions, stressFlags } = forecastMvhs(latest, crop)
  const mvhsFraction = yieldResponseCurve(score)
  const mvhsYield = crop.potentialYield * mvhsFraction * (1 - 0.05 * stressFlags.length)
  const regressionYield = forecastRegression(latest, crop)

  let yieldPerHectare: number
  if (model === 'mvhs') yieldPerHectare = mvhsYield
  else if (model === 'regression') yieldPerHectare = regressionYield
  else yieldPerHectare = 0.55 * mvhsYield + 0.45 * regressionYield // ensemble

  yieldPerHectare = clamp(yieldPerHectare, 0, crop.potentialYield)
  const yieldFraction = yieldPerHectare / crop.potentialYield

  // Trend: recompute the same model one survey back for a delta
  let trendDelta = 0
  if (previous) {
    const prevMvhs = forecastMvhs(previous, crop)
    const prevMvhsYield = crop.potentialYield * yieldResponseCurve(prevMvhs.score) * (1 - 0.05 * prevMvhs.stressFlags.length)
    const prevRegressionYield = forecastRegression(previous, crop)
    let prevYield: number
    if (model === 'mvhs') prevYield = prevMvhsYield
    else if (model === 'regression') prevYield = prevRegressionYield
    else prevYield = 0.55 * prevMvhsYield + 0.45 * prevRegressionYield
    trendDelta = yieldPerHectare - clamp(prevYield, 0, crop.potentialYield)
  }

  const norms = contributions.map((c) => c.normalized)
  const scoreSpread = Math.max(...norms) - Math.min(...norms)
  const confidence = estimateConfidence(sorted, scoreSpread)
  const halfBand = yieldPerHectare * (1 - confidence) * 0.9

  // Dominant growth stage: stage of the latest survey
  const dominantStage = latest.growthStage

  return {
    zoneId: zone.id,
    zoneName: zone.name,
    cropType: cropKey,
    areaHectares: zone.areaHectares,
    yieldPerHectare: Math.round(yieldPerHectare * 100) / 100,
    totalYieldTonnes: Math.round(yieldPerHectare * zone.areaHectares * 10) / 10,
    potentialYield: crop.potentialYield,
    yieldFraction: Math.round(yieldFraction * 1000) / 1000,
    vegetationScore: Math.round(score * 1000) / 1000,
    model,
    confidence: Math.round(confidence * 1000) / 1000,
    confidenceBand: {
      lower: Math.max(0, Math.round((yieldPerHectare - halfBand) * 100) / 100),
      upper: Math.round((yieldPerHectare + halfBand) * 100) / 100,
    },
    health: classifyHealth(score),
    trendDelta: Math.round(trendDelta * 100) / 100,
    contributions,
    stressFlags,
    surveysUsed: sorted.length,
    lastSurveyDate: new Date(latest.surveyDate).toISOString(),
    dominantStage,
  }
}

/** Forecast every zone, skipping zones without readings */
export function forecastAllZones(zones: ZoneInput[], model: ModelType): ZoneForecast[] {
  return zones
    .map((z) => forecastZone(z, model))
    .filter((f): f is ZoneForecast => f !== null)
}

/** Season-long NDVI trend series for charting */
export function buildNdviTrend(zones: ZoneInput[]): { date: string; [zoneName: string]: string | number }[] {
  const byDate = new Map<string, { date: string; [zoneName: string]: string | number }>()
  for (const zone of zones) {
    for (const r of zone.readings) {
      const key = new Date(r.surveyDate).toISOString().slice(0, 10)
      if (!byDate.has(key)) byDate.set(key, { date: key })
      const entry = byDate.get(key)!
      entry[zone.name] = r.ndvi
    }
  }
  return Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date))
}

/** Aggregate summary across all zones */
export function summarizeForecasts(forecasts: ZoneForecast[]) {
  const totalTonnes = forecasts.reduce((acc, f) => acc + f.totalYieldTonnes, 0)
  const totalArea = forecasts.reduce((acc, f) => acc + f.areaHectares, 0)
  const avgYield = totalArea > 0 ? totalTonnes / totalArea : 0
  const avgScore = forecasts.length ? forecasts.reduce((acc, f) => acc + f.vegetationScore, 0) / forecasts.length : 0
  const avgConfidence = forecasts.length ? forecasts.reduce((acc, f) => acc + f.confidence, 0) / forecasts.length : 0
  const healthDist = { critical: 0, poor: 0, fair: 0, good: 0, excellent: 0 }
  for (const f of forecasts) healthDist[f.health]++
  const stressedZones = forecasts.filter((f) => f.stressFlags.length > 0).length
  return {
    totalTonnes: Math.round(totalTonnes * 10) / 10,
    totalArea: Math.round(totalArea * 10) / 10,
    avgYield: Math.round(avgYield * 100) / 100,
    avgScore: Math.round(avgScore * 1000) / 1000,
    avgConfidence: Math.round(avgConfidence * 1000) / 1000,
    healthDist,
    stressedZones,
    zoneCount: forecasts.length,
  }
}
