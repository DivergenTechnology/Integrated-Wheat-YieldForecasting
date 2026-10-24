import { DiseaseAlert, DiseaseType, DiseaseSeverity, SiteId } from '@/lib/types';
import { plots } from './plots';

const diseases: DiseaseType[] = [
  'yellow-rust', 'stem-rust', 'leaf-rust', 'septoria-blotch', 'powdery-mildew', 'loose-smut',
];

const severities: DiseaseSeverity[] = ['none', 'low', 'medium', 'high', 'severe'];

const notesByDisease: Record<DiseaseType, string> = {
  'yellow-rust': 'Yellow-orange pustules on leaves, characteristic stripe pattern on the leaf blade. UAV multispectral shows elevated Red-Edge shift.',
  'stem-rust': 'Dark reddish-brown pustules on stems and leaf sheaths. Detected via CNN classifier with 87% confidence.',
  'leaf-rust': 'Orange-brown pustules scattered on leaf blades. Pre-symptomatic stress detected via chlorophyll loss indicator.',
  'septoria-blotch': 'Lens-shaped lesions with dark pycnidia. UAV imagery shows characteristic gray-brown patches.',
  'powdery-mildew': 'White cottony growth on upper leaf surface. Detected via RGB-CNN trained on local imagery.',
  'loose-smut': 'Smuted heads visible. Detected via UAV RGB imagery at flowering stage.',
  'fusarium-head-blight': 'Bleached spikelets, salmon-pink spore masses. Detected via multispectral UAV at flowering.',
};

// Generate disease alerts — not every plot has disease; about 30% do.
export const diseaseAlerts: DiseaseAlert[] = plots
  .filter((plot, idx) => idx % 3 === 0 || idx % 7 === 0) // ~30% of plots
  .map((plot, idx) => {
    const seed = (idx * 23 + 11) % 100;
    const diseaseIdx = seed % diseases.length;
    const severityIdx = (seed % 5);
    const disease = diseases[diseaseIdx];
    const severity = severities[severityIdx];
    const incidence = severity === 'none' ? 0 : severity === 'low' ? 5 + (seed % 10) : severity === 'medium' ? 15 + (seed % 15) : severity === 'high' ? 30 + (seed % 20) : 50 + (seed % 30);
    const confidence = 0.65 + (seed % 30) / 100;

    return {
      id: `alert-${plot.id}-${disease}`,
      plotId: plot.id,
      siteId: plot.siteId,
      disease,
      severity,
      incidencePct: incidence,
      detectedAt: new Date(Date.now() - ((seed + 1) * 43200000)).toISOString(),
      confidenceScore: Number(confidence.toFixed(2)),
      detectionMethod: seed % 2 === 0 ? 'uav-multispectral' : 'cnn-classifier',
      notes: notesByDisease[disease],
    };
  });

export function getDiseaseAlertsBySite(siteId: SiteId): DiseaseAlert[] {
  return diseaseAlerts.filter((a) => a.siteId === siteId && a.severity !== 'none');
}

export function getDiseaseAlertCount(siteId?: SiteId): number {
  const data = siteId ? getDiseaseAlertsBySite(siteId) : diseaseAlerts.filter((a) => a.severity !== 'none');
  return data.length;
}

export function getDiseaseDistribution() {
  const dist: Record<string, number> = {};
  diseaseAlerts.forEach((a) => {
    if (a.severity !== 'none') {
      dist[a.disease] = (dist[a.disease] || 0) + 1;
    }
  });
  return Object.entries(dist).map(([disease, count]) => ({ disease, count }));
}
