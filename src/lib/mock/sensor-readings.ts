import { SensorReading, SiteId } from '@/lib/types';
import { sensors } from './sensors';

// Generate time-series sensor readings (last 24 readings per sensor)
function generateReadings(): SensorReading[] {
  const readings: SensorReading[] = [];
  const now = Date.now();

  sensors.forEach((sensor, sensorIdx) => {
    if (sensor.status === 'offline') {
      // Only one historical reading before going offline
      readings.push({
        id: `${sensor.id}-r-0`,
        sensorId: sensor.id,
        plotId: sensor.plotId,
        siteId: sensor.siteId,
        type: sensor.type,
        value: sensor.lastReading,
        unit: sensor.lastReadingUnit,
        timestamp: new Date(now - 86400000).toISOString(),
      });
      return;
    }

    for (let i = 0; i < 24; i++) {
      const seed = (sensorIdx * 7 + i * 3) % 100;
      const baseValue = sensor.lastReading;
      const variance = sensor.type === 'soil-moisture' ? 8 : sensor.type === 'temperature' ? 3 : 6;
      const value = baseValue + ((seed % variance) - variance / 2);
      readings.push({
        id: `${sensor.id}-r-${i}`,
        sensorId: sensor.id,
        plotId: sensor.plotId,
        siteId: sensor.siteId,
        type: sensor.type,
        value: Number(value.toFixed(1)),
        unit: sensor.lastReadingUnit,
        timestamp: new Date(now - (i * 15 * 60 * 1000)).toISOString(),
      });
    }
  });

  return readings;
}

export const sensorReadings: SensorReading[] = generateReadings();

export function getReadingsBySensor(sensorId: string): SensorReading[] {
  return sensorReadings
    .filter((r) => r.sensorId === sensorId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export function getLatestReadingsBySite(siteId: SiteId): SensorReading[] {
  const siteSensors = sensors.filter((s) => s.siteId === siteId);
  return siteSensors.map((s) => {
    const sensorReadings = sensorReadings.filter((r) => r.sensorId === s.id);
    return sensorReadings.length > 0
      ? sensorReadings.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0]
      : null;
  }).filter(Boolean) as SensorReading[];
}
