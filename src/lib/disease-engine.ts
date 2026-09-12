/**
 * Disease Detection Engine — Soil + UAV Knowledge-Based Fusion
 * =============================================================
 * Estimates risk for six common wheat diseases by fusing two independent
 * signal sources:
 *   1. Soil properties  (lab / sensor samples)
 *   2. UAV multispectral reflectance (bands + derived vegetation indices)
 *
 * For each disease, a curated knowledge base defines
 *   (a) soil property ranges that favour the pathogen, and
 *   (b) UAV band / vegetation-index signatures that indicate the disease.
 * Each feature carries a weight representing its relative importance.
 *
 * Pipeline:
 *   For each feature, compute a 0-1 risk contribution using a trapezoidal
 *   membership function based on whether the measured value is inside or
 *   outside the disease-favourable range.
 *   → Aggregate weighted features  → soil risk score (0-100)
 *   → Aggregate weighted UAV features → UAV risk score (0-100)
 *   → Fuse:  risk = soil × soilShare + uav × (1 − soilShare)
 *     where soilShare is disease-specific (0.40-0.55).
 *   → Categorical level: low (≤29), moderate (30-49), high (50-69), severe (≥70)
 *   → If level ≥ high, raise an alert with the disease-specific recommendation.
 *
 * Derived index formulas (from raw reflectance bands):
 *   NDVI  = (NIR − Red) / (NIR + Red)
 *   NDRE  = (NIR − RedEdge) / (NIR + RedEdge)
 *   GNDVI = (NIR − Green) / (NIR + Green)
 *   SAVI  = 1.5 × (NIR − Red) / (NIR + Red + 0.5)
 *   EVI   = 2.5 × (NIR − Red) / (NIR + 6·Red − 7.5·Blue + 1)
 *   SIPI  = (NIR − Blue) / (NIR − Red)
 *   PRI*  = (Green − Blue) / (Green + Blue)   (band-surrogate photochemical reflectance)
 */

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export type DiseaseId =
  | 'yellow_rust'
  | 'brown_rust'
  | 'powdery_mildew'
  | 'fusarium_head_blight'
  | 'septoria_tritici_blotch'
  | 'tan_spot'

export type RiskLevel = 'low' | 'moderate' | 'high' | 'severe'
export type AlertSeverity = 'info' | 'warning' | 'critical'

/** Direction hint shown in the knowledge base (pathogen favours the high/low end) */
export type FeatureDirection = 'high' | 'low'

export interface SoilSnapshot {
  ph?: number
  nitrogen?: number // mg/kg
  phosphorus?: number // mg/kg
  potassium?: number // mg/kg
  organicMatter?: number // %
  moisture?: number // %
  temperature?: number // °C
  electricalCond?: number // dS/m
  cationExchangeCap?: number // cmol/kg
  bulkDensity?: number // g/cm3
}

export interface UavSnapshot {
  blue?: number
  green?: number
  red?: number
  redEdge?: number
  nir?: number
  ndvi?: number
  ndre?: number
  gndvi?: number
  savi?: number
  evi?: number
  sipi?: number
  pri?: number
  canopyTempC?: number
}

export interface FeatureSpec {
  key: string
  label: string
  /** Disease-favourable range [min, max] */
  range: [number, number]
  weight: number
  direction: FeatureDirection
  unit?: string
  /**
   * When true the range is interpreted as a HEALTHY range: being inside it
   * contributes no risk and drifting outside raises risk (e.g. SIPI stress).
   */
  inverse?: boolean
}

export interface DiseaseKnowledge {
  id: DiseaseId
  label: string
  pathogen: string
  /** Weight of the soil risk in the fusion (0-1); UAV takes the remainder */
  soilShare: number
  symptoms: string
  soil: FeatureSpec[]
  uav: FeatureSpec[]
  criticalStages: string[]
  recommendation: string
}

export interface FeatureSignal {
  key: string
  label: string
  value: number
  range: [number, number]
  weight: number
  /** 0-1 trapezoidal risk contribution before weighting */
  membership: number
  /** Human-readable status used in the explanation text */
  status: string
}

export interface DiseaseRisk {
  disease: DiseaseId
  label: string
  pathogen: string
  soilScore: number // 0-100
  uavScore: number // 0-100
  riskScore: number // fused, 0-100
  riskLevel: RiskLevel
  confidence: number // 0-1
  soilSignals: FeatureSignal[]
  uavSignals: FeatureSignal[]
  explanation: string
  recommendation: string
  soilShare: number
}

/* ------------------------------------------------------------------ */
/* Knowledge base — six wheat diseases                                 */
/* ------------------------------------------------------------------ */

export const DISEASE_KB: Record<DiseaseId, DiseaseKnowledge> = {
  yellow_rust: {
    id: 'yellow_rust',
    label: 'Yellow Rust',
    pathogen: 'Puccinia striiformis f. sp. tritici',
    soilShare: 0.45,
    symptoms:
      'Yellow-orange pustules arranged in stripes on leaves; chlorotic stripes running parallel to leaf veins.',
    soil: [
      { key: 'temperature', label: 'temperature', range: [8, 15], weight: 0.35, direction: 'low', unit: '°C' },
      { key: 'moisture', label: 'moisture', range: [28, 45], weight: 0.25, direction: 'high', unit: '%' },
      { key: 'nitrogen', label: 'nitrogen', range: [80, 220], weight: 0.2, direction: 'high', unit: 'mg/kg' },
      { key: 'potassium', label: 'potassium', range: [80, 200], weight: 0.12, direction: 'low', unit: 'mg/kg' },
      { key: 'ph', label: 'ph', range: [5.5, 7.2], weight: 0.08, direction: 'low' },
    ],
    uav: [
      { key: 'ndvi', label: 'ndvi', range: [0.4, 0.85], weight: 0.3, direction: 'low' },
      { key: 'ndre', label: 'ndre', range: [0.2, 0.55], weight: 0.22, direction: 'low' },
      { key: 'green', label: 'green', range: [0.18, 0.45], weight: 0.18, direction: 'high' },
      { key: 'red', label: 'red', range: [0.1, 0.35], weight: 0.15, direction: 'high' },
      { key: 'canopyTempC', label: 'canopyTempC', range: [10, 18], weight: 0.15, direction: 'low', unit: '°C' },
    ],
    criticalStages: ['Tillering', 'Jointing', 'Booting', 'Heading'],
    recommendation:
      'Apply a triazole fungicide (e.g. tebuconazole) at early detection. Avoid excess nitrogen; ensure adequate potassium. Use resistant varieties for the next cycle.',
  },
  brown_rust: {
    id: 'brown_rust',
    label: 'Brown Rust',
    pathogen: 'Puccinia triticina',
    soilShare: 0.4,
    symptoms:
      'Orange-brown round pustules scattered on the upper leaf surface; surrounding tissue becomes chlorotic.',
    soil: [
      { key: 'temperature', label: 'temperature', range: [15, 25], weight: 0.45, direction: 'high', unit: '°C' },
      { key: 'nitrogen', label: 'nitrogen', range: [90, 220], weight: 0.35, direction: 'high', unit: 'mg/kg' },
      { key: 'moisture', label: 'moisture', range: [30, 55], weight: 0.2, direction: 'high', unit: '%' },
    ],
    uav: [
      { key: 'red', label: 'red', range: [0.15, 0.4], weight: 0.3, direction: 'high' },
      { key: 'green', label: 'green', range: [0.12, 0.35], weight: 0.25, direction: 'high' },
      { key: 'canopyTempC', label: 'canopyTempC', range: [18, 28], weight: 0.25, direction: 'high', unit: '°C' },
      { key: 'nir', label: 'nir', range: [0.4, 0.75], weight: 0.2, direction: 'low' },
    ],
    criticalStages: ['Jointing', 'Booting', 'Heading', 'Flowering'],
    recommendation:
      'Apply strobilurin + triazole mixture (e.g. azoxystrobin + propiconazole). Reduce irrigation frequency to lower leaf wetness.',
  },
  powdery_mildew: {
    id: 'powdery_mildew',
    label: 'Powdery Mildew',
    pathogen: 'Blumeria graminis f. sp. tritici',
    soilShare: 0.5,
    symptoms:
      'White to light-grey fluffy pustules on the upper leaf surface, later turning dull grey-brown; tissue yellows beneath.',
    soil: [
      { key: 'nitrogen', label: 'nitrogen', range: [130, 240], weight: 0.45, direction: 'high', unit: 'mg/kg' },
      { key: 'moisture', label: 'moisture', range: [25, 45], weight: 0.3, direction: 'high', unit: '%' },
      { key: 'organicMatter', label: 'organicMatter', range: [2.5, 5], weight: 0.25, direction: 'high', unit: '%' },
    ],
    uav: [
      { key: 'green', label: 'green', range: [0.22, 0.5], weight: 0.4, direction: 'high' },
      { key: 'blue', label: 'blue', range: [0.08, 0.2], weight: 0.35, direction: 'high' },
      { key: 'sipi', label: 'sipi', range: [0.7, 1.4], weight: 0.25, direction: 'high', inverse: true },
    ],
    criticalStages: ['Tillering', 'Jointing', 'Booting', 'Heading'],
    recommendation:
      'Reduce nitrogen rate. Apply sulfur-based fungicide or triazole. Improve air circulation by adjusting planting density.',
  },
  fusarium_head_blight: {
    id: 'fusarium_head_blight',
    label: 'Fusarium Head Blight',
    pathogen: 'Fusarium graminearum',
    soilShare: 0.55,
    symptoms:
      'Bleached white spikelets on the head, often starting from one point; pinkish spore masses; shrivelled, chalky grain.',
    soil: [
      { key: 'temperature', label: 'temperature', range: [20, 28], weight: 0.3, direction: 'high', unit: '°C' },
      { key: 'moisture', label: 'moisture', range: [30, 50], weight: 0.3, direction: 'high', unit: '%' },
      { key: 'organicMatter', label: 'organicMatter', range: [3, 6], weight: 0.2, direction: 'high', unit: '%' },
      { key: 'nitrogen', label: 'nitrogen', range: [100, 220], weight: 0.2, direction: 'high', unit: 'mg/kg' },
    ],
    uav: [
      { key: 'green', label: 'green', range: [0.25, 0.55], weight: 0.35, direction: 'high' },
      { key: 'red', label: 'red', range: [0.2, 0.5], weight: 0.3, direction: 'high' },
      { key: 'canopyTempC', label: 'canopyTempC', range: [22, 30], weight: 0.35, direction: 'high', unit: '°C' },
    ],
    criticalStages: ['Heading', 'Flowering'],
    recommendation:
      'Apply a triazole fungicide (prothioconazole or metconazole) at early flowering. Avoid maize as preceding crop. Plough under crop residues.',
  },
  septoria_tritici_blotch: {
    id: 'septoria_tritici_blotch',
    label: 'Septoria Tritici Blotch',
    pathogen: 'Zymoseptoria tritici',
    soilShare: 0.45,
    symptoms:
      'Pale grey-green elongated lesions with tiny black pycnidia embedded, running parallel to leaf veins; leaf tip dieback.',
    soil: [
      { key: 'moisture', label: 'moisture', range: [32, 50], weight: 0.4, direction: 'high', unit: '%' },
      { key: 'nitrogen', label: 'nitrogen', range: [110, 220], weight: 0.35, direction: 'high', unit: 'mg/kg' },
      { key: 'organicMatter', label: 'organicMatter', range: [2.5, 5], weight: 0.25, direction: 'high', unit: '%' },
    ],
    uav: [
      { key: 'red', label: 'red', range: [0.15, 0.4], weight: 0.35, direction: 'high' },
      { key: 'green', label: 'green', range: [0.12, 0.35], weight: 0.3, direction: 'high' },
      { key: 'sipi', label: 'sipi', range: [0.7, 1.3], weight: 0.35, direction: 'high', inverse: true },
    ],
    criticalStages: ['Jointing', 'Booting', 'Heading', 'Flowering'],
    recommendation:
      'Apply triazole + SDHI mixture at flag leaf emergence. Reduce overhead irrigation. Rotate with non-host crops.',
  },
  tan_spot: {
    id: 'tan_spot',
    label: 'Tan Spot',
    pathogen: 'Pyrenophora tritici-repentis',
    soilShare: 0.45,
    symptoms:
      'Small brown lesions with yellow halos expanding to diamond-shaped necrotic spots with tan centres and dark borders.',
    soil: [
      { key: 'nitrogen', label: 'nitrogen', range: [0, 60], weight: 0.35, direction: 'low', unit: 'mg/kg' },
      { key: 'moisture', label: 'moisture', range: [25, 45], weight: 0.3, direction: 'high', unit: '%' },
      { key: 'temperature', label: 'temperature', range: [15, 25], weight: 0.2, direction: 'high', unit: '°C' },
      { key: 'organicMatter', label: 'organicMatter', range: [3, 6], weight: 0.15, direction: 'high', unit: '%' },
    ],
    uav: [
      { key: 'red', label: 'red', range: [0.15, 0.4], weight: 0.35, direction: 'high' },
      { key: 'green', label: 'green', range: [0.12, 0.35], weight: 0.3, direction: 'high' },
      { key: 'sipi', label: 'sipi', range: [0.8, 1.4], weight: 0.35, direction: 'high', inverse: true },
    ],
    criticalStages: ['Tillering', 'Jointing', 'Booting'],
    recommendation:
      'Increase nitrogen application. Apply triazole fungicide. Plough under crop residues to reduce primary inoculum.',
  },
}

export const DISEASE_ORDER: DiseaseId[] = [
  'yellow_rust',
  'brown_rust',
  'tan_spot',
  'septoria_tritici_blotch',
  'powdery_mildew',
  'fusarium_head_blight',
]

export const RISK_LEVELS: RiskLevel[] = ['low', 'moderate', 'high', 'severe']

export const RISK_COLORS: Record<RiskLevel, string> = {
  low: '#16a34a',
  moderate: '#eab308',
  high: '#f97316',
  severe: '#dc2626',
}

export const SEVERITY_COLORS: Record<AlertSeverity, string> = {
  info: '#0284c7',
  warning: '#d97706',
  critical: '#dc2626',
}

export function levelFor(score: number): RiskLevel {
  if (score >= 70) return 'severe'
  if (score >= 50) return 'high'
  if (score >= 30) return 'moderate'
  return 'low'
}

export function severityFor(level: RiskLevel): AlertSeverity {
  if (level === 'severe') return 'critical'
  if (level === 'high') return 'warning'
  return 'info'
}

/* ------------------------------------------------------------------ */
/* Derived index computation from raw bands                            */
/* ------------------------------------------------------------------ */

export interface RawBands {
  blue: number
  green: number
  red: number
  redEdge: number
  nir: number
}

const div = (a: number, b: number) => (Math.abs(b) < 1e-9 ? 0 : a / b)

/** Compute derived vegetation indices from multispectral reflectance bands */
export function deriveIndices(bands: RawBands): Partial<UavSnapshot> {
  const { blue, green, red, redEdge, nir } = bands
  return {
    ndvi: div(nir - red, nir + red),
    ndre: div(nir - redEdge, nir + redEdge),
    gndvi: div(nir - green, nir + green),
    savi: 1.5 * div(nir - red, nir + red + 0.5),
    evi: 2.5 * div(nir - red, nir + 6 * red - 7.5 * blue + 1),
    sipi: div(nir - blue, nir - red),
    pri: div(green - blue, green + blue),
  }
}

/* ------------------------------------------------------------------ */
/* Trapezoidal membership                                              */
/* ------------------------------------------------------------------ */

function membership(value: number, [a, b]: [number, number], inverse: boolean): number {
  const width = b - a
  const shoulder = Math.max(width * 0.6, width === 0 ? 1 : Math.max(Math.abs(a) * 0.25, 1e-3))
  let m: number
  if (value >= a && value <= b) {
    m = 1
  } else if (value < a) {
    m = Math.max(0, 1 - (a - value) / shoulder)
  } else {
    m = Math.max(0, 1 - (value - b) / shoulder)
  }
  return inverse ? 1 - m : m
}

function fmt(v: number): string {
  return Number.isInteger(v) ? String(v) : v.toFixed(2).replace(/0$/, '')
}

function rangeText([a, b]: [number, number]): string {
  return `[${fmt(a)}-${fmt(b)}]`
}

/* ------------------------------------------------------------------ */
/* Core scoring                                                        */
/* ------------------------------------------------------------------ */

function scoreGroup(
  specs: FeatureSpec[],
  snapshot: Record<string, number | undefined>
): { score: number; signals: FeatureSignal[]; coverage: number } {
  const signals: FeatureSignal[] = []
  let weightSum = 0
  let contribution = 0
  let availableWeight = 0

  for (const spec of specs) {
    weightSum += spec.weight
    const value = snapshot[spec.key]
    if (value === undefined || !Number.isFinite(value)) continue
    availableWeight += spec.weight
    const m = membership(value, spec.range, !!spec.inverse)
    contribution += spec.weight * m
    const inside = value >= spec.range[0] && value <= spec.range[1]
    const status = spec.inverse
      ? inside
        ? `inside healthy range ${rangeText(spec.range)}`
        : `outside healthy range ${rangeText(spec.range)}`
      : inside
        ? `${fmt(value)} inside disease-favourable range ${rangeText(spec.range)}`
        : `${fmt(value)} outside disease-favourable range ${rangeText(spec.range)}`
    signals.push({
      key: spec.key,
      label: spec.label,
      value,
      range: spec.range,
      weight: spec.weight,
      membership: m,
      status,
    })
  }

  const score = weightSum > 0 ? (contribution / weightSum) * 100 : 0
  const coverage = weightSum > 0 ? availableWeight / weightSum : 0
  // Sort: strongest evidence first, cap at top 5 for readable explanations
  signals.sort((x, y) => y.weight * y.membership - x.weight * x.membership)
  return { score, signals, coverage }
}

/** Run the fused risk assessment for one disease */
export function assessDisease(
  disease: DiseaseId,
  soil: SoilSnapshot,
  uav: UavSnapshot
): DiseaseRisk {
  const kb = DISEASE_KB[disease]
  const soilResult = scoreGroup(kb.soil, soil as Record<string, number | undefined>)
  const uavResult = scoreGroup(kb.uav, uav as Record<string, number | undefined>)

  // If no soil data at all, mirror the UAV signal so the fusion stays meaningful
  const soilMissing = soilResult.coverage === 0
  const soilScore = soilMissing ? uavResult.score : soilResult.score
  const soilShare = kb.soilShare
  const fused = soilScore * soilShare + uavResult.score * (1 - soilShare)
  const level = levelFor(fused)

  // Confidence: feature coverage drives certainty; soil/UAV agreement refines it
  const avgCoverage = (soilResult.coverage + uavResult.coverage) / 2
  const agreement = 1 - Math.abs(soilScore - uavResult.score) / 100
  let confidence = 0.45 + 0.4 * avgCoverage + 0.15 * agreement
  if (soilMissing) confidence *= 0.6
  confidence = Math.min(0.99, Math.max(0.4, confidence))

  const soilTxt = soilResult.signals
    .slice(0, 4)
    .map((s) => `${s.label}=${fmt(s.value)} (${s.status})`)
    .join('; ')
  const uavTxt = uavResult.signals
    .slice(0, 4)
    .map((s) => `${s.label}=${fmt(s.value)} (${s.status})`)
    .join('; ')

  const soilPart = soilMissing
    ? 'no soil sample available — UAV-only estimate'
    : `soil ${Math.round(soilScore)} × ${soilShare.toFixed(2)}`
  const explanation =
    `${kb.label} (${kb.pathogen}) fused risk = ${(fused / 100).toFixed(1)} ` +
    `(${soilPart} + UAV ${Math.round(uavResult.score)} × ${(1 - soilShare).toFixed(2)}). ` +
    (soilResult.signals.length ? `Soil signals: ${soilTxt}. ` : '') +
    (uavResult.signals.length ? `UAV signals: ${uavTxt}.` : '')

  return {
    disease,
    label: kb.label,
    pathogen: kb.pathogen,
    soilScore: Math.round(soilScore),
    uavScore: Math.round(uavResult.score),
    riskScore: Math.round(fused),
    riskLevel: level,
    confidence: Math.round(confidence * 1000) / 1000,
    soilSignals: soilResult.signals,
    uavSignals: uavResult.signals,
    explanation,
    recommendation: kb.recommendation,
    soilShare,
  }
}

/** Assess all six diseases, sorted by fused risk (highest first) */
export function assessAllDiseases(soil: SoilSnapshot, uav: UavSnapshot): DiseaseRisk[] {
  return DISEASE_ORDER.map((d) => assessDisease(d, soil, uav)).sort(
    (a, b) => b.riskScore - a.riskScore
  )
}
