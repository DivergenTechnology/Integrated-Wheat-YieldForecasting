import { Sensor, SiteId } from '@/lib/types';
import { plots } from './plots';

// Generate sensors per plot — at minimum 1 soil-moisture + 1 NPK per plot.
// Some plots get extra sensors (temperature / humidity).

export const sensors: Sensor[] = plots.flatMap((plot, idx) => {
  const sensorList: Sensor[] = [];
  const seed = (idx * 17 + 3) % 100;

  // Soil moisture sensor (always present)
  sensorList.push({
    id: `${plot.id}-sm`,
    plotId: plot.id,
    siteId: plot.siteId,
    type: 'soil-moisture',
    status: seed % 11 === 0 ? 'offline' : seed % 7 === 0 ? 'warning' : 'online',
    battery: 30 + (seed % 70),
    lastReading: 28 + (seed % 32), // percent
    lastReadingUnit: '%',
    lastUpdated: new Date(Date.now() - (seed * 60000)).toISOString(),
  });

  // NPK sensor (most plots)
  if (seed % 4 !== 0) {
    sensorList.push({
      id: `${plot.id}-npk`,
      plotId: plot.id,
      siteId: plot.siteId,
      type: 'npk',
      status: seed % 13 === 0 ? 'warning' : 'online',
      battery: 40 + (seed % 50),
      lastReading: 45 + (seed % 40), // simplified N index
      lastReadingUnit: 'mg/kg',
      lastUpdated: new Date(Date.now() - ((seed + 5) * 60000)).toISOString(),
    });
  }

  // Humidity sensor (some plots)
  if (seed % 3 === 0) {
    sensorList.push({
      id: `${plot.id}-hum`,
      plotId: plot.id,
      siteId: plot.siteId,
      type: 'soil-humidity',
      status: 'online',
      battery: 50 + (seed % 40),
      lastReading: 55 + (seed % 35),
      lastReadingUnit: '%',
      lastUpdated: new Date(Date.now() - ((seed + 10) * 60000)).toISOString(),
    });
  }

  // Temperature sensor (fewer plots)
  if (seed % 5 === 0) {
    sensorList.push({
      id: `${plot.id}-tmp`,
      plotId: plot.id,
      siteId: plot.siteId,
      type: 'temperature',
      status: 'online',
      battery: 55 + (seed % 35),
      lastReading: 18 + (seed % 12),
      lastReadingUnit: '°C',
      lastUpdated: new Date(Date.now() - ((seed + 15) * 60000)).toISOString(),
    });
  }

  return sensorList;
});

export function getSensorsBySite(siteId: SiteId): Sensor[] {
  return sensors.filter((s) => s.siteId === siteId);
}

export function getOnlineSensors(siteId?: SiteId): Sensor[] {
  return sensors.filter(
    (s) => (!siteId || s.siteId === siteId) && s.status === 'online',
  );
}
