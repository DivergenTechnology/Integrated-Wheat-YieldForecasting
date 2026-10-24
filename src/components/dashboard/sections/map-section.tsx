'use client';

import { useEffect, useRef, useState } from 'react';
import { Map as MaplibreMap } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { SiteId, Plot } from '@/lib/types';
import { sites, getPlotsBySite, getSensorsBySite } from '@/lib/mock';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Satellite, Radio, MapPin, Wheat } from 'lucide-react';

interface Props {
  siteId: SiteId | 'all';
}

export function MapSection({ siteId }: Props) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MaplibreMap | null>(null);
  const [selectedPlot, setSelectedPlot] = useState<Plot | null>(null);

  // The demo uses a no-tiles raster background to ensure the prototype
  // runs without external tile dependencies. In production this would be
  // swapped for Sentinel-2 RGB composite via GeoServer WMS.
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    const targetSite = siteId === 'all' ? sites[0] : sites.find((s) => s.id === siteId)!;

    const map = new MaplibreMap({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {},
        layers: [
          {
            id: 'background',
            type: 'background',
            paint: { 'background-color': '#f1f5f4' },
          },
        ],
      },
      center: [targetSite.lng, targetSite.lat],
      zoom: 13,
      attributionControl: false,
    });

    mapRef.current = map;

    map.on('load', () => {
      // Build plot circle sources for the selected site (or all sites)
      const visiblePlots = siteId === 'all'
        ? sites.flatMap((s) => getPlotsBySite(s.id))
        : getPlotsBySite(siteId);

      const features = visiblePlots.map((p) => ({
        type: 'Feature' as const,
        geometry: {
          type: 'Point' as const,
          coordinates: [p.centerLng, p.centerLat],
        },
        properties: {
          id: p.id,
          plotCode: p.plotCode,
          areaHectares: p.areaHectares,
          variety: p.variety,
          growthStage: p.growthStage,
          irrigationType: p.irrigationType,
        },
      }));

      map.addSource('plots', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features,
        },
      });

      // Plot circles (radius scales with area)
      map.addLayer({
        id: 'plots-circle',
        type: 'circle',
        source: 'plots',
        paint: {
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['get', 'areaHectares'],
            5, 8,
            20, 18,
          ],
          'circle-color': [
            'match',
            ['get', 'growthStage'],
            'tillering', '#84cc16',
            'stem-elongation', '#65a30d',
            'booting', '#16a34a',
            'flowering', '#15803d',
            'grain-filling', '#166534',
            'maturity', '#14532d',
            '#166534',
          ],
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 1.5,
          'circle-opacity': 0.85,
        },
      });

      // Plot labels
      map.addLayer({
        id: 'plots-label',
        type: 'symbol',
        source: 'plots',
        layout: {
          'text-field': ['get', 'plotCode'],
          'text-size': 9,
          'text-offset': [0, 1.5],
        },
        paint: {
          'text-color': '#374151',
        },
      });

      // Sensor markers (small red dots)
      const visibleSensors = siteId === 'all'
        ? sites.flatMap((s) => getSensorsBySite(s.id))
        : getSensorsBySite(siteId);

      const sensorFeatures = visibleSensors.map((s) => {
        const plot = visiblePlots.find((p) => p.id === s.plotId);
        return plot ? {
          type: 'Feature' as const,
          geometry: {
            type: 'Point' as const,
            coordinates: [plot.centerLng + 0.0005, plot.centerLat + 0.0005],
          },
          properties: {
            sensorId: s.id,
            type: s.type,
            status: s.status,
          },
        } : null;
      }).filter(Boolean) as GeoJSON.Feature<GeoJSON.Point>[];

      map.addSource('sensors', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: sensorFeatures },
      });

      map.addLayer({
        id: 'sensors-circle',
        type: 'circle',
        source: 'sensors',
        paint: {
          'circle-radius': 3,
          'circle-color': [
            'match',
            ['get', 'status'],
            'online', '#10b981',
            'warning', '#f59e0b',
            'offline', '#dc2626',
            '#10b981',
          ],
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 1,
        },
      });

      // Click handler
      map.on('click', 'plots-circle', (e) => {
        if (e.features && e.features[0]) {
          const f = e.features[0];
          const plotId = f.properties?.id as string;
          const plot = visiblePlots.find((p) => p.id === plotId);
          if (plot) setSelectedPlot(plot);
        }
      });

      // Cursor pointer on hover
      map.on('mouseenter', 'plots-circle', () => {
        map.getCanvas().style.cursor = 'pointer';
      });
      map.on('mouseleave', 'plots-circle', () => {
        map.getCanvas().style.cursor = '';
      });
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [siteId]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          Map View — {siteId === 'all' ? 'All Pilot Sites' : sites.find((s) => s.id === siteId)?.name}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Spatial distribution of irrigated wheat plots and IoT sensors.
          Click any plot circle for plot-level metadata.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        {/* Legend card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Growth Stage</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            {[
              { label: 'Tillering', color: '#84cc16' },
              { label: 'Stem Elongation', color: '#65a30d' },
              { label: 'Booting', color: '#16a34a' },
              { label: 'Flowering', color: '#15803d' },
              { label: 'Grain Filling', color: '#166534' },
              { label: 'Maturity', color: '#14532d' },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-2">
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: s.color }}
                />
                <span>{s.label}</span>
              </div>
            ))}
            <div className="border-t pt-2 mt-2">
              <div className="text-xs font-medium text-muted-foreground mb-2">
                Sensor Status
              </div>
              {[
                { label: 'Online', color: '#10b981' },
                { label: 'Warning', color: '#f59e0b' },
                { label: 'Offline', color: '#dc2626' },
              ].map((s) => (
                <div key={s.label} className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
                  <span>{s.label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Map container */}
        <Card className="lg:col-span-3">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Satellite className="h-4 w-4 text-emerald-700" />
              AOI Map — Sentinel-2 + UAV Composite
            </CardTitle>
            <CardDescription>
              Plot circles sized by area; sensor markers colored by status.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              ref={mapContainer}
              className="h-[500px] w-full rounded-lg border"
            />
          </CardContent>
        </Card>
      </div>

      {/* Selected plot details */}
      {selectedPlot && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <MapPin className="h-4 w-4 text-emerald-700" />
              Plot {selectedPlot.plotCode} — Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5 text-sm">
              <div>
                <div className="text-xs text-muted-foreground">Area</div>
                <div className="font-medium">{selectedPlot.areaHectares} ha</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Irrigation</div>
                <div className="font-medium capitalize">{selectedPlot.irrigationType}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Variety</div>
                <div className="font-medium capitalize">{selectedPlot.variety}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Growth Stage</div>
                <Badge variant="secondary" className="capitalize">
                  {selectedPlot.growthStage}
                </Badge>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Planted</div>
                <div className="font-medium">{selectedPlot.plantingDate}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
