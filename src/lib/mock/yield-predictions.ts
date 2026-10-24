import { YieldPrediction, SiteId, AttentionWeight } from '@/lib/types';
import { plots } from './plots';

// Yield predictions per plot with attention-based feature attributions.
// Mock data is internally consistent (confidence intervals widen with stress,
// attention weights emphasize the dominant driver).

const attentionFeaturesTemplates: AttentionWeight[][] = [
  [
    { feature: 'NDVI (Jun-15)', weight: 0.27, value: '0.81' },
    { feature: 'Soil Nitrogen', weight: 0.21, value: '52 mg/kg' },
    { feature: 'NDRE', weight: 0.16, value: '0.32' },
    { feature: 'Soil Moisture', weight: 0.14, value: '34%' },
    { feature: 'Rainfall (60d)', weight: 0.09, value: '180 mm' },
    { feature: 'EVI', weight: 0.07, value: '2.4' },
    { feature: 'Planting Date', weight: 0.06, value: 'Jun 12' },
  ],
  [
    { feature: 'Soil Moisture', weight: 0.29, value: '22%' },
    { feature: 'NDVI (Jul-10)', weight: 0.22, value: '0.68' },
    { feature: 'Etc Cumulative', weight: 0.18, value: '184 mm' },
    { feature: 'Soil Nitrogen', weight: 0.13, value: '38 mg/kg' },
    { feature: 'NDMI', weight: 0.10, value: '0.41' },
    { feature: 'Temperature avg', weight: 0.05, value: '22 °C' },
    { feature: 'Variety', weight: 0.03, value: 'Ogolcho' },
  ],
  [
    { feature: 'NDRE', weight: 0.26, value: '0.41' },
    { feature: 'LAI', weight: 0.20, value: '4.2' },
    { feature: 'Soil Nitrogen', weight: 0.18, value: '58 mg/kg' },
    { feature: 'NDVI (Aug-05)', weight: 0.14, value: '0.86' },
    { feature: 'GNDVI', weight: 0.09, value: '0.71' },
    { feature: 'Rainfall (60d)', weight: 0.08, value: '210 mm' },
    { feature: 'Irrigation events', weight: 0.05, value: '3' },
  ],
];

function yieldForPlot(plotIdx: number, plotId: string, siteId: SiteId): YieldPrediction {
  const seed = (plotIdx * 11 + 7) % 100;
  const baseYield = 2.8 + (seed % 30) / 10; // 2.8 to 5.8 t/ha
  const ciWidth = 0.4 + (seed % 8) / 10;
  const stageIdx = seed % 5;
  const stages: YieldPrediction['stageAtPrediction'][] = [
    'tillering', 'stem-elongation', 'booting', 'flowering', 'grain-filling',
  ];
  return {
    plotId,
    siteId,
    predictedYield: Number(baseYield.toFixed(2)),
    confidenceInterval: [
      Number((baseYield - ciWidth).toFixed(2)),
      Number((baseYield + ciWidth).toFixed(2)),
    ],
    modelAccuracy: 0.78 + (seed % 7) / 50,
    topAttentionFeatures: attentionFeaturesTemplates[seed % 3],
    predictionTimestamp: new Date(Date.now() - (plotIdx * 3600000)).toISOString(),
    stageAtPrediction: stages[stageIdx],
  };
}

export const yieldPredictions: YieldPrediction[] = plots.map((plot, idx) =>
  yieldForPlot(idx, plot.id, plot.siteId),
);

export function getYieldPredictionsBySite(siteId: SiteId): YieldPrediction[] {
  return yieldPredictions.filter((y) => y.siteId === siteId);
}

export function getAveragePredictedYield(siteId?: SiteId): number {
  const data = siteId ? getYieldPredictionsBySite(siteId) : yieldPredictions;
  if (data.length === 0) return 0;
  const sum = data.reduce((acc, y) => acc + y.predictedYield, 0);
  return Number((sum / data.length).toFixed(2));
}
