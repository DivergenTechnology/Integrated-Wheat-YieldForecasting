import { Site, SiteId } from '@/lib/types';

export const sites: Site[] = [
  {
    id: 'bishoftu',
    name: 'Bishoftu',
    region: 'Oromia — East Shewa',
    institute: 'Debre Zeit Agricultural Research Center',
    lat: 8.7547,
    lng: 39.0000,
    elevation: 1860,
    plotCount: 20,
    sensorCount: 24,
    totalHectares: 187.5,
  },
  {
    id: 'asella',
    name: 'Asella',
    region: 'Oromia — Arsi',
    institute: 'Asella / Kulumsa Agricultural Research Center',
    lat: 7.9577,
    lng: 39.1667,
    elevation: 2430,
    plotCount: 22,
    sensorCount: 22,
    totalHectares: 224.0,
  },
  {
    id: 'ambo',
    name: 'Ambo',
    region: 'Oromia — West Shewa',
    institute: 'Ambo Agricultural Research Center',
    lat: 8.9847,
    lng: 37.7833,
    elevation: 2100,
    plotCount: 18,
    sensorCount: 18,
    totalHectares: 156.5,
  },
];

export function getSite(id: SiteId): Site | undefined {
  return sites.find((s) => s.id === id);
}
