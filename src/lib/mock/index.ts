// Aggregated mock data — single entry point for components
export { sites, getSite } from './sites';
export { plots, getPlotsBySite } from './plots';
export { sensors, getSensorsBySite, getOnlineSensors } from './sensors';
export {
  yieldPredictions,
  getYieldPredictionsBySite,
  getAveragePredictedYield,
} from './yield-predictions';
export {
  irrigationRecommendations,
  getIrrigationBySite,
  getIrrigateNowCount,
  getAverageWaterSavingPct,
} from './irrigation-recommendations';
export {
  diseaseAlerts,
  getDiseaseAlertsBySite,
  getDiseaseAlertCount,
  getDiseaseDistribution,
} from './disease-alerts';
export {
  sensorReadings,
  getReadingsBySensor,
  getLatestReadingsBySite,
} from './sensor-readings';

import { sites } from './sites';
import { plots } from './plots';
import { sensors } from './sensors';
import { getAveragePredictedYield } from './yield-predictions';
import { getIrrigateNowCount, getAverageWaterSavingPct } from './irrigation-recommendations';
import { getDiseaseAlertCount } from './disease-alerts';

export function getDashboardStats() {
  return {
    totalPlots: plots.length,
    totalHectares: sites.reduce((acc, s) => acc + s.totalHectares, 0),
    averagePredictedYield: getAveragePredictedYield(),
    activeSensors: sensors.filter((s) => s.status === 'online').length,
    offlineSensors: sensors.filter((s) => s.status === 'offline').length,
    irrigationRecommendations: getIrrigateNowCount(),
    diseaseAlerts: getDiseaseAlertCount(),
    waterSavedPct: getAverageWaterSavingPct(),
    lastUpdated: new Date().toISOString(),
  };
}
