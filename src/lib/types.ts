// ============================================================================
// Type definitions for the IWCYES-IWSS Dashboard
// ============================================================================

export type SiteId = 'bishoftu' | 'asella' | 'ambo';

export interface Site {
  id: SiteId;
  name: string;
  region: string;
  institute: string;
  lat: number;
  lng: number;
  elevation: number; // meters above sea level
  plotCount: number;
  sensorCount: number;
  totalHectares: number;
}

export type IrrigationType = 'surface' | 'sprinkler' | 'drip';
export type WheatVariety = 'kubsa' | "danda'a" | 'mada-walabu' | 'ogolcho' | 'fentale-1';

export interface Plot {
  id: string;
  siteId: SiteId;
  plotCode: string;
  areaHectares: number;
  irrigationType: IrrigationType;
  variety: WheatVariety;
  plantingDate: string; // ISO date
  growthStage: 'tillering' | 'stem-elongation' | 'booting' | 'flowering' | 'grain-filling' | 'maturity';
  // Bounding box (simplified as a center + extent for prototyping)
  centerLat: number;
  centerLng: number;
  extentMeters: number;
}

export type SensorStatus = 'online' | 'offline' | 'warning';
export type SensorType = 'soil-moisture' | 'soil-humidity' | 'npk' | 'temperature';

export interface Sensor {
  id: string;
  plotId: string;
  siteId: SiteId;
  type: SensorType;
  status: SensorStatus;
  battery: number; // percent
  lastReading: number;
  lastReadingUnit: string;
  lastUpdated: string; // ISO timestamp
}

export interface SensorReading {
  id: string;
  sensorId: string;
  plotId: string;
  siteId: SiteId;
  type: SensorType;
  value: number;
  unit: string;
  timestamp: string;
}

export interface AttentionWeight {
  feature: string;
  weight: number; // 0-1
  value: string;
}

export interface YieldPrediction {
  plotId: string;
  siteId: SiteId;
  predictedYield: number; // tonnes per hectare
  confidenceInterval: [number, number];
  modelAccuracy: number; // R^2
  topAttentionFeatures: AttentionWeight[];
  predictionTimestamp: string;
  stageAtPrediction: Plot['growthStage'];
}

export type IrrigationStatus = 'irrigate-now' | 'monitor' | 'no-irrigation' | 'irrigating';
export type IrrigationUrgency = 'low' | 'medium' | 'high' | 'critical';

export interface IrrigationRecommendation {
  plotId: string;
  siteId: SiteId;
  status: IrrigationStatus;
  urgency: IrrigationUrgency;
  soilMoisturePct: number;
  humidityPct: number;
  etcMm: number; // crop evapotranspiration in mm
  rainfallForecastMm: number; // 7-day forecast
  recommendedVolumeLiters: number;
  recommendedTiming: string;
  lastIrrigation: string;
  waterSavingPct: number; // vs. baseline practice
}

export type DiseaseSeverity = 'none' | 'low' | 'medium' | 'high' | 'severe';
export type DiseaseType =
  | 'yellow-rust'
  | 'stem-rust'
  | 'leaf-rust'
  | 'septoria-blotch'
  | 'powdery-mildew'
  | 'loose-smut'
  | 'fusarium-head-blight';

export interface DiseaseAlert {
  id: string;
  plotId: string;
  siteId: SiteId;
  disease: DiseaseType;
  severity: DiseaseSeverity;
  incidencePct: number; // % of plot area affected
  detectedAt: string;
  confidenceScore: number; // 0-1
  detectionMethod: 'uav-multispectral' | 'cnn-classifier' | 'manual';
  notes: string;
}

export interface DashboardStats {
  totalPlots: number;
  totalHectares: number;
  averagePredictedYield: number;
  activeSensors: number;
  offlineSensors: number;
  irrigationRecommendations: number;
  diseaseAlerts: number;
  waterSavedPct: number;
  lastUpdated: string;
}

export type SectionId =
  | 'overview'
  | 'map'
  | 'yield'
  | 'irrigation'
  | 'disease'
  | 'sensors'
  | 'attention';
