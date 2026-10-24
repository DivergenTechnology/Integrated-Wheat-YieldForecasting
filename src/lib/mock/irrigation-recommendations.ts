import { IrrigationRecommendation, SiteId } from '@/lib/types';
import { plots } from './plots';

const irrigationStatuses: IrrigationRecommendation['status'][] = [
  'irrigate-now', 'monitor', 'no-irrigation', 'irrigating', 'monitor', 'no-irrigation', 'irrigate-now',
];

const urgencies: IrrigationRecommendation['urgency'][] = [
  'low', 'medium', 'high', 'critical',
];

export const irrigationRecommendations: IrrigationRecommendation[] = plots.map((plot, idx) => {
  const seed = (idx * 19 + 5) % 100;
  const statusIdx = seed % irrigationStatuses.length;
  const urgencyIdx = Math.floor(seed / 25) % 4;
  const soilMoisture = statusIdx === 0 ? 18 + (seed % 8) : statusIdx === 2 ? 45 + (seed % 15) : 28 + (seed % 18);
  const humidity = 50 + (seed % 35);
  const etc = 3 + (seed % 4); // mm/day
  const rainfall7d = (seed * 3) % 80;
  const waterSaving = 15 + (seed % 18);

  const rec: IrrigationRecommendation = {
    plotId: plot.id,
    siteId: plot.siteId,
    status: irrigationStatuses[statusIdx],
    urgency: urgencies[urgencyIdx],
    soilMoisturePct: soilMoisture,
    humidityPct: humidity,
    etcMm: Number(etc.toFixed(1)),
    rainfallForecastMm: rainfall7d,
    recommendedVolumeLiters: statusIdx === 0 ? 800 + (seed * 30) : statusIdx === 3 ? 0 : 200 + (seed * 10),
    recommendedTiming: statusIdx === 0
      ? 'Within 6 hours'
      : statusIdx === 1
        ? 'Within 48 hours'
        : statusIdx === 2
          ? 'No irrigation needed this week'
          : 'Irrigation in progress',
    lastIrrigation: new Date(Date.now() - ((seed + 1) * 86400000)).toISOString(),
    waterSavingPct: waterSaving,
  };
  return rec;
});

export function getIrrigationBySite(siteId: SiteId): IrrigationRecommendation[] {
  return irrigationRecommendations.filter((r) => r.siteId === siteId);
}

export function getIrrigateNowCount(siteId?: SiteId): number {
  const data = siteId ? getIrrigationBySite(siteId) : irrigationRecommendations;
  return data.filter((r) => r.status === 'irrigate-now').length;
}

export function getAverageWaterSavingPct(siteId?: SiteId): number {
  const data = siteId ? getIrrigationBySite(siteId) : irrigationRecommendations;
  if (data.length === 0) return 0;
  const sum = data.reduce((acc, r) => acc + r.waterSavingPct, 0);
  return Number((sum / data.length).toFixed(1));
}
