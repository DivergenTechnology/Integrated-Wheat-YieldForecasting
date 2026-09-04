'use client'

import { useState } from 'react'
import {
  Activity,
  ChevronRight,
  CircleAlert,
  Info,
  Leaf,
  Plane,
  Plus,
  RefreshCw,
  Sprout,
  TrendingDown,
  TrendingUp,
  Wheat,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useToast } from '@/hooks/use-toast'
import {
  CROP_PROFILES,
  HEALTH_COLORS,
  HEALTH_LABELS,
  type ModelType,
  type ZoneForecast,
} from '@/lib/forecast-engine'
import { MODEL_INFO, useDerivedData, useForecastData } from './hooks'
import { ForecastBarChart, NdviTrendChart } from './charts'
import { AddReadingDialog, AddZoneDialog, ZoneDetailDialog } from './dialogs'
import type { ApiData } from './types'

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  tint,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  sub: string
  tint: string
}) {
  return (
    <Card className="border shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-center gap-2">
          <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${tint}`}>
            <Icon className="h-4 w-4" aria-hidden />
          </div>
          <p className="text-xs font-medium uppercase tracking-wide text-stone-500">{label}</p>
        </div>
        <p className="mt-2 text-2xl font-bold tabular-nums leading-none">{value}</p>
        <p className="mt-1 text-xs text-stone-500">{sub}</p>
      </CardContent>
    </Card>
  )
}

function ZoneCard({
  zoneName,
  cropType,
  areaHectares,
  forecast,
  onOpen,
}: {
  zoneName: string
  cropType: string
  areaHectares: number
  forecast: ZoneForecast | undefined
  onOpen: () => void
}) {
  const crop = CROP_PROFILES[cropType as keyof typeof CROP_PROFILES] ?? CROP_PROFILES.maize

  return (
    <button
      onClick={onOpen}
      className="group relative overflow-hidden rounded-xl border bg-card text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
      aria-label={`Open details for ${zoneName}`}
    >
      {/* health color spine */}
      <span
        className="absolute inset-y-0 left-0 w-1.5"
        style={{ backgroundColor: forecast ? HEALTH_COLORS[forecast.health] : '#d6d3d1' }}
        aria-hidden
      />
      <div className="p-4 pl-5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="flex items-center gap-1.5 font-semibold leading-tight">
              <span aria-hidden>{crop.emoji}</span> {zoneName}
            </p>
            <p className="mt-0.5 text-xs text-stone-500">
              {crop.label} · {areaHectares} ha
            </p>
          </div>
          {forecast ? (
            <Badge
              className="shrink-0 border-0 text-white"
              style={{ backgroundColor: HEALTH_COLORS[forecast.health] }}
            >
              {HEALTH_LABELS[forecast.health]}
            </Badge>
          ) : (
            <Badge variant="outline" className="shrink-0 border-dashed text-stone-500">
              Awaiting survey
            </Badge>
          )}
        </div>

        {forecast ? (
          <>
            <div className="mt-3 flex items-end justify-between">
              <div>
                <p className="text-3xl font-bold tabular-nums leading-none">
                  {forecast.yieldPerHectare.toFixed(2)}
                  <span className="ml-1 text-sm font-normal text-stone-500">t/ha</span>
                </p>
                <p className="mt-1 text-xs text-stone-500">
                  ≈ <span className="font-semibold text-stone-700">{forecast.totalYieldTonnes.toFixed(1)} t</span> total ·{' '}
                  {Math.round(forecast.yieldFraction * 100)}% of attainable
                </p>
              </div>
              <ChevronRight className="h-5 w-5 text-stone-300 transition-colors group-hover:text-emerald-700" aria-hidden />
            </div>

            <div className="mt-3 flex items-center gap-2 text-xs">
              <Badge variant="secondary" className="font-mono">
                NDVI {forecast.contributions.find((c) => c.index === 'ndvi')?.value.toFixed(2)}
              </Badge>
              <span className="flex items-center gap-1 text-stone-500">
                <Activity className="h-3 w-3" aria-hidden /> {Math.round(forecast.confidence * 100)}% conf.
              </span>
              {forecast.trendDelta !== 0 && (
                <span className={`flex items-center gap-0.5 font-medium ${forecast.trendDelta > 0 ? 'text-green-700' : 'text-red-700'}`}>
                  {forecast.trendDelta > 0 ? (
                    <TrendingUp className="h-3 w-3" aria-hidden />
                  ) : (
                    <TrendingDown className="h-3 w-3" aria-hidden />
                  )}
                  {forecast.trendDelta > 0 ? '+' : ''}
                  {forecast.trendDelta.toFixed(2)}
                </span>
              )}
            </div>

            {forecast.stressFlags.length > 0 && (
              <p className="mt-2 flex items-center gap-1 text-xs text-amber-700">
                <CircleAlert className="h-3.5 w-3.5 shrink-0" aria-hidden />
                {forecast.stressFlags.length} stress indicator{forecast.stressFlags.length > 1 ? 's' : ''} detected
              </p>
            )}
          </>
        ) : (
          <div className="mt-3 rounded-lg border border-dashed border-stone-300 bg-stone-50 p-3 text-xs text-stone-500">
            Record a UAV survey with vegetation indices to unlock the yield forecast for this zone.
          </div>
        )}
      </div>
    </button>
  )
}

export default function YieldForecastDashboard() {
  const [model, setModel] = useState<ModelType>('ensemble')
  const { data, loading, error, refresh } = useForecastData(model)
  const derived = useDerivedData(data)

  const [detailZoneId, setDetailZoneId] = useState<string | null>(null)
  const [readingZoneId, setReadingZoneId] = useState<string | null>(null)
  const [addReadingOpen, setAddReadingOpen] = useState(false)
  const [addZoneOpen, setAddZoneOpen] = useState(false)
  const { toast } = useToast()

  const detailZone = data?.zones.find((z) => z.id === detailZoneId) ?? null
  const detailForecast = detailZone ? derived?.forecastByZone.get(detailZone.id) ?? null : null

  function openAddReading(zoneId?: string) {
    setReadingZoneId(zoneId ?? data?.zones[0]?.id ?? null)
    setAddReadingOpen(true)
  }

  async function handleRefreshWithToast() {
    await refresh()
    toast({ title: 'Forecasts updated', description: `Model: ${MODEL_INFO[model].label}` })
  }

  return (
    <TooltipProvider delayDuration={200}>
      <div className="min-h-screen bg-[#f5f7f2]">
        {/* Header */}
        <header className="border-b bg-white/80 backdrop-blur sticky top-0 z-20">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-700 text-white">
              <Sprout className="h-5 w-5" aria-hidden />
            </div>
            <div className="mr-auto">
              <h1 className="text-lg font-bold leading-tight">UAV Yield Forecast</h1>
              <p className="text-xs text-stone-500">Precision farming · drone-index-driven yield estimation per zone</p>
            </div>

            <Tooltip>
              <TooltipTrigger asChild>
                <div className="hidden md:flex h-9 items-center gap-2 rounded-lg border bg-stone-50 px-3 text-xs text-stone-600">
                  <Wheat className="h-3.5 w-3.5" aria-hidden />
                  {data ? `${data.zones.length} zones · ${data.zones.reduce((a, z) => a + z.areaHectares, 0).toFixed(1)} ha` : '—'}
                </div>
              </TooltipTrigger>
              <TooltipContent>Registered farming area covered by UAV surveys</TooltipContent>
            </Tooltip>

            <Select value={model} onValueChange={(v) => setModel(v as ModelType)}>
              <SelectTrigger className="w-[240px]" aria-label="Forecast model">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(MODEL_INFO) as ModelType[]).map((m) => (
                  <SelectItem key={m} value={m}>
                    {MODEL_INFO[m].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="icon"
              onClick={handleRefreshWithToast}
              aria-label="Refresh forecasts"
              className="shrink-0"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={() => openAddReading()} className="shrink-0">
              <Plane className="mr-1.5 h-4 w-4" aria-hidden /> Record survey
            </Button>
            <Button onClick={() => setAddZoneOpen(true)} className="shrink-0 bg-emerald-700 hover:bg-emerald-800">
              <Plus className="mr-1.5 h-4 w-4" aria-hidden /> Add zone
            </Button>
          </div>
          <div className="border-t bg-emerald-50/60">
            <p className="mx-auto max-w-7xl px-4 py-1.5 text-xs text-emerald-900 sm:px-6">
              <Info className="mr-1 inline h-3 w-3" aria-hidden />
              <span className="font-medium">{MODEL_INFO[model].label}:</span> {MODEL_INFO[model].description}
            </p>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
          {error && (
            <Card className="mb-6 border-red-200 bg-red-50">
              <CardContent className="flex items-center gap-3 p-4">
                <CircleAlert className="h-5 w-5 text-red-600" aria-hidden />
                <div className="flex-1">
                  <p className="font-medium text-red-800">Failed to load forecast data</p>
                  <p className="text-sm text-red-600">{error}</p>
                </div>
                <Button variant="outline" size="sm" onClick={refresh}>Retry</Button>
              </CardContent>
            </Card>
          )}

          {/* Stats row */}
          <section aria-label="Season forecast summary" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {loading && !data ? (
              Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[104px] rounded-xl" />)
            ) : data ? (
              <>
                <StatCard
                  icon={Leaf}
                  label="Forecast production"
                  value={`${data.summary.totalTonnes.toFixed(1)} t`}
                  sub={`across ${data.summary.totalArea} ha surveyed`}
                  tint="bg-emerald-100 text-emerald-700"
                />
                <StatCard
                  icon={Activity}
                  label="Average yield"
                  value={`${data.summary.avgYield.toFixed(2)} t/ha`}
                  sub={`confidence ${Math.round(data.summary.avgConfidence * 100)}%`}
                  tint="bg-lime-100 text-lime-700"
                />
                <StatCard
                  icon={Sprout}
                  label="Vegetation health"
                  value={`${Math.round(data.summary.avgScore * 100)}`}
                  sub="avg multi-index score (0–100)"
                  tint="bg-green-100 text-green-700"
                />
                <StatCard
                  icon={CircleAlert}
                  label="Zones under stress"
                  value={`${data.summary.stressedZones}/${data.summary.zoneCount}`}
                  sub={
                    data.summary.stressedZones > 0
                      ? 'check stress indicators before harvest planning'
                      : 'no stress flags detected'
                  }
                  tint={data.summary.stressedZones > 0 ? 'bg-amber-100 text-amber-700' : 'bg-stone-100 text-stone-600'}
                />
              </>
            ) : null}
          </section>

          {/* Main grid: zone cards + charts */}
          <div className="mt-6 grid gap-6 xl:grid-cols-5">
            <section aria-label="Farming zones" className="xl:col-span-3">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
                  Zone forecasts — ranked by expected production
                </h2>
                <span className="text-xs text-stone-400">click a zone for full breakdown</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {loading && !data ? (
                  Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[150px] rounded-xl" />)
                ) : data ? (
                  data.zones.map((z) => (
                    <ZoneCard
                      key={z.id}
                      zoneName={z.name}
                      cropType={z.cropType}
                      areaHectares={z.areaHectares}
                      forecast={derived?.forecastByZone.get(z.id)}
                      onOpen={() => setDetailZoneId(z.id)}
                    />
                  ))
                ) : null}
              </div>
            </section>

            <section aria-label="Forecast analytics" className="space-y-6 xl:col-span-2">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Yield forecast per zone</CardTitle>
                  <CardDescription>Predicted vs attainable yield (t/ha) with confidence bars</CardDescription>
                </CardHeader>
                <CardContent>
                  {data && data.forecasts.length > 0 ? (
                    <ForecastBarChart forecasts={derived?.sortedForecasts ?? data.forecasts} />
                  ) : (
                    <div className="flex h-72 items-center justify-center text-sm text-stone-400">
                      No surveyed zones yet
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">NDVI season trend</CardTitle>
                  <CardDescription>Canopy vigour evolution from UAV surveys</CardDescription>
                </CardHeader>
                <CardContent>
                  {data && data.ndviTrend.length > 0 ? (
                    <NdviTrendChart trend={data.ndviTrend} />
                  ) : (
                    <div className="flex h-72 items-center justify-center text-sm text-stone-400">
                      No survey data yet
                    </div>
                  )}
                </CardContent>
              </Card>
            </section>
          </div>
        </main>

        {/* Sticky footer */}
        <footer className="mt-auto border-t bg-white">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-3 text-xs text-stone-500 sm:px-6">
            <p>
              UAV Yield Forecast · vegetation-index models for zone-level yield estimation ·
              <span className="ml-1 font-medium text-stone-600">{MODEL_INFO[model].label}</span>
            </p>
            <p>
              {data
                ? `${data.zones.length} zones · ${data.zones.reduce((a, z) => a + z.readingCount, 0)} UAV surveys processed`
                : 'loading…'}
            </p>
          </div>
        </footer>

        {/* Dialogs */}
        {detailZone && (
          <ZoneDetailDialog
            zone={detailZone}
            forecast={detailForecast}
            model={model}
            open={!!detailZoneId}
            onOpenChange={(v) => !v && setDetailZoneId(null)}
            onChanged={refresh}
          />
        )}
        <AddReadingDialog
          zones={(data?.zones ?? []).map((z) => ({ id: z.id, name: z.name }))}
          defaultZoneId={readingZoneId ?? undefined}
          open={addReadingOpen}
          onOpenChange={setAddReadingOpen}
          onAdded={refresh}
        />
        <AddZoneDialog open={addZoneOpen} onOpenChange={setAddZoneOpen} onAdded={refresh} />
      </div>
    </TooltipProvider>
  )
}
