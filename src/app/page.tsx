'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { SectionId, SiteId } from '@/lib/types';
import { SidebarNav } from '@/components/dashboard/sidebar-nav';
import { OverviewSection } from '@/components/dashboard/sections/overview-section';
import { YieldSection } from '@/components/dashboard/sections/yield-section';
import { IrrigationSection } from '@/components/dashboard/sections/irrigation-section';
import { DiseaseSection } from '@/components/dashboard/sections/disease-section';
import { SensorFeedSection } from '@/components/dashboard/sections/sensor-feed-section';
import { AttentionHeatmapSection } from '@/components/dashboard/sections/attention-heatmap-section';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { sites } from '@/lib/mock';
import { Wheat, Radio, Database, Cloud } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// MapLibre GL requires browser APIs (window, WebGL). Dynamically import the
// map component with SSR disabled to prevent build-time "window is not
// defined" errors during the Next.js production build / deployment step.
const MapSection = dynamic(
  () => import('@/components/dashboard/sections/map-section').then((m) => m.MapSection),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-[500px] rounded-lg border bg-muted/30 text-sm text-muted-foreground">
        Loading map view…
      </div>
    ),
  },
);

type FilteredSite = SiteId | 'all';

export default function Home() {
  const [section, setSection] = useState<SectionId>('overview');
  const [siteId, setSiteId] = useState<FilteredSite>('all');

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top header bar */}
      <header className="sticky top-0 z-50 border-b bg-white/95 backdrop-blur">
        <div className="flex items-center justify-between px-4 lg:px-6 h-14">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-emerald-700 text-white">
              <Wheat className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-bold tracking-tight">
                IWCYES · IWSS Dashboard
              </div>
              <div className="text-[10px] text-muted-foreground">
                Remote Sensing-Enabled Decision Support for Irrigated Wheat Farming · Ethiopia
              </div>
            </div>
          </div>

          {/* Site selector */}
          <div className="flex items-center gap-2">
            <span className="hidden md:inline text-xs text-muted-foreground">Pilot site:</span>
            <Select
              value={siteId}
              onValueChange={(v) => setSiteId(v as FilteredSite)}
            >
              <SelectTrigger className="w-[140px] h-8 text-xs">
                <SelectValue placeholder="All sites" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Pilot Sites</SelectItem>
                {sites.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </header>

      {/* Body: sidebar + content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="hidden md:flex flex-col w-60 border-r bg-white/60 overflow-y-auto">
          <SidebarNav active={section} onChange={setSection} />

          {/* Live data status */}
          <div className="mt-auto p-3 border-t">
            <div className="text-xs font-semibold uppercase text-muted-foreground tracking-wider mb-2">
              Live Data
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs">
                <Radio className="h-3 w-3 text-emerald-600" />
                <span className="text-muted-foreground">Firebase RTDB</span>
                <Badge variant="outline" className="ml-auto text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">
                  Live
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <Database className="h-3 w-3 text-emerald-600" />
                <span className="text-muted-foreground">PostGIS</span>
                <Badge variant="outline" className="ml-auto text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">
                  Synced
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <Cloud className="h-3 w-3 text-emerald-600" />
                <span className="text-muted-foreground">Sentinel-2</span>
                <Badge variant="outline" className="ml-auto text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">
                  5d
                </Badge>
              </div>
            </div>
            <div className="text-[10px] text-muted-foreground mt-3">
              Last updated: {new Date().toLocaleString('en-GB', {
                day: '2-digit',
                month: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
          </div>
        </aside>

        {/* Mobile section selector */}
        <div className="md:hidden border-b p-2 overflow-x-auto">
          <div className="flex gap-1 min-w-max">
            {(
              [
                ['overview', 'Overview'],
                ['map', 'Map'],
                ['yield', 'Yield'],
                ['irrigation', 'Irrigation'],
                ['disease', 'Disease'],
                ['sensors', 'Sensors'],
                ['attention', 'Attention'],
              ] as [SectionId, string][]
            ).map(([id, label]) => (
              <button
                key={id}
                onClick={() => setSection(id)}
                className={`px-3 py-1.5 text-xs rounded-md whitespace-nowrap ${
                  section === id
                    ? 'bg-emerald-100 text-emerald-900 font-medium'
                    : 'bg-muted hover:bg-accent'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Main content area */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {section === 'overview' && <OverviewSection siteId={siteId} />}
          {section === 'map' && <MapSection siteId={siteId} />}
          {section === 'yield' && <YieldSection siteId={siteId} />}
          {section === 'irrigation' && <IrrigationSection siteId={siteId} />}
          {section === 'disease' && <DiseaseSection siteId={siteId} />}
          {section === 'sensors' && <SensorFeedSection siteId={siteId} />}
          {section === 'attention' && <AttentionHeatmapSection siteId={siteId} />}

          {/* Footer */}
          <footer className="mt-12 pt-6 border-t text-center text-xs text-muted-foreground">
            <div>
              IWCYES · IWSS Dashboard Prototype · Pilot sites: Bishoftu · Asella · Ambo
            </div>
            <div className="mt-1">
              Generated under the SSGI-Project · v0.1 · Mock data · Live integration pending
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}
