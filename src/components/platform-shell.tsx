'use client'

import { useState } from 'react'
import { Info, Sprout } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import YieldForecastDashboard from '@/components/yield-forecast/dashboard'
import DiseaseDashboard from '@/components/disease/dashboard'
import DetectionLab from '@/components/disease/detection-lab'
import KnowledgeBase from '@/components/disease/knowledge-base'

type TabKey = 'yield' | 'disease' | 'lab' | 'knowledge'

const TAB_META: Record<TabKey, { label: string; note: string }> = {
  yield: {
    label: 'Yield Forecast',
    note: 'Vegetation-index yield models (MVHS, NDVI regression, ensemble) turn drone surveys into per-zone production estimates with confidence bands.',
  },
  disease: {
    label: 'Disease Monitoring',
    note: 'Fused soil + UAV risk scoring for six wheat diseases, with threshold-triggered alerts and acknowledgement tracking.',
  },
  lab: {
    label: 'Detection Lab',
    note: 'Interactive sandbox — adjust soil properties and multispectral bands to explore how the fusion engine scores disease risk.',
  },
  knowledge: {
    label: 'Knowledge Base',
    note: 'The curated agronomic knowledge behind the engine: favourable ranges, feature weights, critical growth stages and recommendations.',
  },
}

export default function PlatformShell() {
  const [tab, setTab] = useState<TabKey>('yield')
  const [dataVersion, setDataVersion] = useState(0)

  function bumpData() {
    setDataVersion((v) => v + 1)
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#f5f7f2]">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-700 text-white">
            <Sprout className="h-5 w-5" aria-hidden />
          </div>
          <div className="mr-auto">
            <h1 className="text-lg font-bold leading-tight">Integrated Crop Intelligence</h1>
            <p className="text-xs text-stone-500">
              UAV yield forecasting · soil + UAV disease fusion · agronomic knowledge base
            </p>
          </div>
        </div>
        <div className="border-t">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)}>
              <TabsList className="h-11 w-full justify-start gap-1 rounded-none border-b bg-transparent p-0">
                {(Object.keys(TAB_META) as TabKey[]).map((key) => (
                  <TabsTrigger
                    key={key}
                    value={key}
                    className="rounded-none border-b-2 border-transparent px-4 py-2.5 text-sm font-medium text-stone-500 shadow-none transition-colors data-[state=active]:border-emerald-700 data-[state=active]:bg-transparent data-[state=active]:text-emerald-800 data-[state=active]:shadow-none"
                  >
                    {TAB_META[key].label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        </div>
        <div className="border-t bg-emerald-50/60">
          <p className="mx-auto flex max-w-7xl items-start gap-1.5 px-4 py-1.5 text-xs text-emerald-900 sm:px-6">
            <Info className="mt-0.5 h-3 w-3 shrink-0" aria-hidden />
            <span>{TAB_META[tab].note}</span>
          </p>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6">
        <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)}>
          <TabsContent value="yield" className="mt-0">
            <YieldForecastDashboard />
          </TabsContent>
          <TabsContent value="disease" className="mt-0">
            <DiseaseDashboard key={`disease-${dataVersion}`} />
          </TabsContent>
          <TabsContent value="lab" className="mt-0">
            <DetectionLab key={`lab-${dataVersion}`} onDataChanged={bumpData} />
          </TabsContent>
          <TabsContent value="knowledge" className="mt-0">
            <KnowledgeBase />
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-3 text-xs text-stone-500 sm:px-6">
          <p>Integrated Crop Intelligence · yield forecasting + early disease detection for precision farming</p>
          <p>Soil + UAV fusion engine · 6 wheat diseases · knowledge-based risk scoring</p>
        </div>
      </footer>
    </div>
  )
}
