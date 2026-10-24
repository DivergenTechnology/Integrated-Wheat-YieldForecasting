import { Plot, SiteId } from '@/lib/types';

// Generates synthetic plot data per site — used to populate the dashboard
// mock. Coordinates are perturbations around the site center to create a
// realistic cluster of irrigated wheat plots.

function makePlotsForSite(siteId: SiteId, count: number): Plot[] {
  const plots: Plot[] = [];
  // deterministic seed offset per site
  const seedOffsets: Record<SiteId, number> = {
    bishoftu: 0.018,
    asella: 0.022,
    ambo: 0.020,
  };
  const offset = seedOffsets[siteId];

  const stages: Plot['growthStage'][] = [
    'tillering', 'stem-elongation', 'booting', 'flowering', 'grain-filling',
  ];
  const irrigationTypes: Plot['irrigationType'][] = ['sprinkler', 'drip', 'surface'];
  const varieties: Plot['wheatVariety'][] = ['kubsa', "danda'a", 'ogolcho', 'fentale-1'];

  for (let i = 0; i < count; i++) {
    const plotNum = i + 1;
    // spread plots around the site center in a grid-like pattern
    const row = Math.floor(i / 5);
    const col = i % 5;
    const latOffset = (row - 1.5) * 0.004;
    const lngOffset = (col - 2) * 0.005;

    const siteLat = siteId === 'bishoftu' ? 8.7547 : siteId === 'asella' ? 7.9577 : 8.9847;
    const siteLng = siteId === 'bishoftu' ? 39.0000 : siteId === 'asella' ? 39.1667 : 37.7833;

    const seed = (plotNum * 13 + (siteId === 'bishoftu' ? 1 : siteId === 'asella' ? 2 : 3)) % 100;
    const stageIdx = (seed % stages.length);
    const irrIdx = (seed % irrigationTypes.length);
    const varIdx = (seed % varieties.length);

    plots.push({
      id: `${siteId}-p${String(plotNum).padStart(3, '0')}`,
      siteId,
      plotCode: `${siteId.substring(0, 3).toUpperCase()}-${String(plotNum).padStart(3, '0')}`,
      areaHectares: 5 + ((seed * 7) % 15),
      irrigationType: irrigationTypes[irrIdx],
      variety: varieties[varIdx],
      plantingDate: `2026-06-${String(10 + (seed % 15)).padStart(2, '0')}`,
      growthStage: stages[stageIdx],
      centerLat: siteLat + latOffset + (offset * Math.sin(plotNum)),
      centerLng: siteLng + lngOffset + (offset * Math.cos(plotNum)),
      extentMeters: 80 + ((seed * 5) % 60),
    });
  }
  return plots;
}

export const plots: Plot[] = [
  ...makePlotsForSite('bishoftu', 20),
  ...makePlotsForSite('asella', 22),
  ...makePlotsForSite('ambo', 18),
];

export function getPlotsBySite(siteId: SiteId): Plot[] {
  return plots.filter((p) => p.siteId === siteId);
}
