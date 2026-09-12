'use client'

import { useMemo, useState } from 'react'
import {
  Activity,
  Bug,
  CheckCheck,
  CircleAlert,
  FlaskConical,
  Radar,
  ShieldCheck,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'
import { Cell, Pie, PieChart, Bar, BarChart, ResponsiveContainer, Tooltip as RTooltip, XAxis, YAxis } from 'recharts'
import {
  DISEASE_KB,
  RISK_COLORS,
  SEVERITY_COLORS,
  type RiskLevel,
} from '@/lib/disease-engine'
import { useDiseaseData } from './hooks'
import { AddSoilDialog, ZoneDiseaseDialog } from './dialogs'
import type { DiseaseZoneState } from './types'

const LEVEL_BADGE: Record<RiskLevel, string> = {
  low: 'bg-green-100 text-green-800 hover:bg-green-100',
  moderate: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100',
  high: 'bg-orange-100 text-orange-800 hover:bg-orange-100',
  severe: 'bg-red-100 text-red-800 hover:bg-red-100',
}

const SEVERITY_BADGE: Record<string, string> = {
  info: 'bg-sky-100 text-sky-800 hover:bg-sky-100',
  warning: 'bg-amber-100 text-amber-800 hover:bg-amber-100',
  critical: 'bg-red-100 text-red-800 hover:bg-red-100',
}

function KpiCard({
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

function ZoneDiseaseCard({
  zone,
  onOpen,
  onRun,
  running,
}: {
  zone: DiseaseZoneState
  onOpen: () => void
  onRun: () => void
  running: boolean
}) {
  const top = [...zone.latestRisks].sort((a, b) => b.riskScore - a.riskScore).slice(0, 3)
  const color =
    zone.maxRisk >= 70 ? '#dc2626' : zone.maxRisk >= 50 ? '#f97316' : zone.maxRisk >= 30 ? '#eab308' : zone.latestRisks.length ? '#16a34a' : '#d6d3d1'
  return (
    <div className="group relative overflow-hidden rounded-xl border bg-card shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
      <span className="absolute inset-y-0 left-0 w-1.5" style={{ backgroundColor: color }} aria-hidden />
      <div className="p-4 pl-5">
        <button onClick={onOpen} className="w-full text-left" aria-label={`Open disease detail for ${zone.name}`}>
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-semibold leading-tight">{zone.name}</p>
              <p className="mt-0.5 text-xs text-stone-500">
                {zone.cropType} · {zone.areaHectares} ha
                {zone.growthStage ? ` · ${zone.growthStage}` : ''}
                {zone.variety ? ` · ${zone.variety}` : ''}
              </p>
            </div>
            {zone.latestRisks.length > 0 ? (
              <Badge className="shrink-0 border-0 text-white" style={{ backgroundColor: color }}>
                peak {zone.maxRisk}/100
              </Badge>
            ) : (
              <Badge variant="outline" className="shrink-0 border-dashed text-stone-500">
                No detections
              </Badge>
            )}
          </div>

          {top.length > 0 ? (
            <div className="mt-3 space-y-1.5">
              {top.map((r) => (
                <div key={r.disease} className="flex items-center gap-2">
                  <p className="w-40 shrink-0 truncate text-xs text-stone-600">{r.label}</p>
                  <Progress value={r.riskScore} className="h-2 flex-1" aria-label={`${r.label} risk`} />
                  <span
                    className="w-7 shrink-0 text-right text-xs font-semibold tabular-nums"
                    style={{ color: RISK_COLORS[r.riskLevel] }}
                  >
                    {r.riskScore}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 rounded-lg border border-dashed border-stone-300 bg-stone-50 p-2.5 text-xs text-stone-500">
              Run detection to score the six wheat diseases for this zone.
            </p>
          )}
        </button>

        <div className="mt-3 flex items-center justify-between gap-2">
          <p className="text-[11px] text-stone-400">
            {zone.lastSurveyAt ? `survey ${new Date(zone.lastSurveyAt).toLocaleDateString()}` : 'no survey'} ·{' '}
            {zone.lastSoilAt ? `soil ${new Date(zone.lastSoilAt).toLocaleDateString()}` : 'no soil data'}
          </p>
          <Button size="sm" variant="outline" onClick={onRun} disabled={running} className="shrink-0">
            <Radar className={`mr-1 h-3.5 w-3.5 ${running ? 'animate-pulse' : ''}`} aria-hidden />
            {running ? 'Running…' : 'Detect'}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function DiseaseDashboard() {
  const { data, loading, error, refresh } = useDiseaseData()
  const { toast } = useToast()
  const [detailZone, setDetailZone] = useState<{ id: string; name: string } | null>(null)
  const [soilZone, setSoilZone] = useState<{ id: string; name: string } | null>(null)
  const [runningZone, setRunningZone] = useState<string | null>(null)
  const [acking, setAcking] = useState(false)

  const levelData = useMemo(() => {
    if (!data) return []
    return (['low', 'moderate', 'high', 'severe'] as RiskLevel[])
      .map((level) => ({ name: level, value: data.levelCounts[level] ?? 0, fill: RISK_COLORS[level] }))
      .filter((d) => d.value > 0)
  }, [data])

  const diseaseData = useMemo(() => {
    if (!data) return []
    return Object.entries(DISEASE_KB)
      .map(([id, kb]) => ({ name: kb.label.replace('Tritici Blotch', '').replace(' Head Blight', ''), disease: id, count: data.diseaseCounts[id] ?? 0 }))
      .sort((a, b) => b.count - a.count)
  }, [data])

  async function runDetection(zoneId: string) {
    setRunningZone(zoneId)
    try {
      const res = await fetch(`/api/zones/${zoneId}/detect`, { method: 'POST' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Detection failed')
      toast({ title: 'Disease detection complete', description: 'Alerts raised where fused risk ≥ high.' })
      await refresh()
    } catch (e) {
      toast({
        title: 'Detection failed',
        description: e instanceof Error ? e.message : 'Unknown error',
        variant: 'destructive',
      })
    } finally {
      setRunningZone(null)
    }
  }

  async function ackAll() {
    setAcking(true)
    try {
      const res = await fetch('/api/alerts/ack-all', { method: 'POST' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed')
      toast({ title: 'All alerts acknowledged', description: `${json.acknowledged} alerts cleared` })
      await refresh()
    } catch (e) {
      toast({
        title: 'Error',
        description: e instanceof Error ? e.message : 'Failed to acknowledge alerts',
        variant: 'destructive',
      })
    } finally {
      setAcking(false)
    }
  }

  async function ackOne(alertId: string) {
    const res = await fetch(`/api/alerts/${alertId}/ack`, { method: 'PATCH' })
    if (res.ok) await refresh()
  }

  return (
    <div className="space-y-6">
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-center gap-3 p-4">
            <CircleAlert className="h-5 w-5 text-red-600" aria-hidden />
            <div className="flex-1">
              <p className="font-medium text-red-800">Failed to load disease data</p>
              <p className="text-sm text-red-600">{error}</p>
            </div>
            <Button variant="outline" size="sm" onClick={refresh}>Retry</Button>
          </CardContent>
        </Card>
      )}

      {/* KPI row */}
      <section aria-label="Disease monitoring KPIs" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {loading && !data ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[104px] rounded-xl" />)
        ) : data ? (
          <>
            <KpiCard
              icon={Activity}
              label="Average peak risk"
              value={`${data.kpis.avgRisk}/100`}
              sub={`across ${data.kpis.zoneCount} zones`}
              tint="bg-orange-100 text-orange-700"
            />
            <KpiCard
              icon={ShieldCheck}
              label="Active alerts"
              value={`${data.kpis.unackAlerts}`}
              sub={`${data.kpis.criticalAlerts} critical unacknowledged`}
              tint={data.kpis.criticalAlerts > 0 ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}
            />
            <KpiCard
              icon={Bug}
              label="Detections run"
              value={`${data.kpis.detectionCount}`}
              sub={`${data.kpis.alertCount} alerts historically`}
              tint="bg-amber-100 text-amber-700"
            />
            <KpiCard
              icon={FlaskConical}
              label="Zones with soil data"
              value={`${data.zones.filter((z) => z.lastSoilAt).length}/${data.zones.length}`}
              sub="soil samples enable full fusion"
              tint="bg-sky-100 text-sky-700"
            />
          </>
        ) : null}
      </section>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Risk level distribution</CardTitle>
            <CardDescription>Latest detection per zone, by risk category</CardDescription>
          </CardHeader>
          <CardContent>
            {levelData.length > 0 ? (
              <div className="flex items-center gap-4">
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={levelData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3} strokeWidth={1}>
                      {levelData.map((d) => (
                        <Cell key={d.name} fill={d.fill} />
                      ))}
                    </Pie>
                    <RTooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1.5 text-xs">
                  {levelData.map((d) => (
                    <p key={d.name} className="flex items-center gap-1.5">
                      <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: d.fill }} aria-hidden />
                      <span className="capitalize">{d.name}</span>
                      <span className="font-semibold tabular-nums">{d.value}</span>
                    </p>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex h-56 items-center justify-center text-sm text-stone-400">
                Run a detection to populate the risk distribution
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Disease threat distribution</CardTitle>
            <CardDescription>Latest detections per disease across zones</CardDescription>
          </CardHeader>
          <CardContent>
            {data && data.kpis.detectionCount > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={diseaseData} layout="vertical" margin={{ left: 8, right: 16 }}>
                  <XAxis type="number" allowDecimals={false} fontSize={11} stroke="#78716c" />
                  <YAxis type="category" dataKey="name" width={110} fontSize={11} stroke="#78716c" />
                  <RTooltip />
                  <Bar dataKey="count" fill="#f97316" radius={[0, 4, 4, 0]} barSize={16} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-56 items-center justify-center text-sm text-stone-400">No detections yet</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Alerts feed */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base">Recent alerts</CardTitle>
              <CardDescription>Triggered when fused risk reaches high or severe</CardDescription>
            </div>
            {data && data.kpis.unackAlerts > 0 && (
              <Button variant="outline" size="sm" onClick={ackAll} disabled={acking}>
                <CheckCheck className="mr-1.5 h-4 w-4" aria-hidden /> Ack all
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {loading && !data ? (
            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-lg" />)
          ) : data && data.recentAlerts.length > 0 ? (
            data.recentAlerts.map((a) => (
              <div
                key={a.id}
                className={`rounded-lg border p-3 transition-opacity ${a.acknowledged ? 'opacity-55' : ''}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className={`border-0 capitalize ${SEVERITY_BADGE[a.severity] ?? SEVERITY_BADGE.info}`}>
                        {a.severity}
                      </Badge>
                      <p className="text-sm font-semibold">{a.title}</p>
                    </div>
                    <p className="mt-0.5 text-[11px] text-stone-400">
                      {a.zone.name} · {new Date(a.triggeredAt).toLocaleString()}
                    </p>
                  </div>
                  {!a.acknowledged && (
                    <Button variant="outline" size="sm" onClick={() => ackOne(a.id)} className="shrink-0">
                      Ack
                    </Button>
                  )}
                </div>
                <p className="mt-1.5 line-clamp-2 text-xs text-stone-600">{a.message}</p>
                {a.action && <p className="mt-1 text-xs font-medium text-emerald-800">→ {a.action}</p>}
              </div>
            ))
          ) : (
            <div className="flex h-24 items-center justify-center text-sm text-stone-400">
              No alerts — risks are below the high threshold, or detection has not been run yet
            </div>
          )}
        </CardContent>
      </Card>

      {/* Zone risk grid */}
      <section aria-label="Per-zone disease risk">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
            Zone disease risk — latest fused scores
          </h2>
          <span className="text-xs text-stone-400">click a zone for the full breakdown</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {loading && !data ? (
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[168px] rounded-xl" />)
          ) : data ? (
            data.zones.map((z) => (
              <ZoneDiseaseCard
                key={z.id}
                zone={z}
                running={runningZone === z.id}
                onOpen={() => setDetailZone({ id: z.id, name: z.name })}
                onRun={() => runDetection(z.id)}
              />
            ))
          ) : null}
        </div>
      </section>

      {/* Dialogs */}
      <ZoneDiseaseDialog
        zoneId={detailZone?.id ?? null}
        zoneName={detailZone?.name ?? ''}
        open={!!detailZone}
        onOpenChange={(v) => !v && setDetailZone(null)}
        onChanged={refresh}
      />
      <AddSoilDialog
        zoneId={soilZone?.id ?? null}
        zoneName={soilZone?.name ?? ''}
        open={!!soilZone}
        onOpenChange={(v) => !v && setSoilZone(null)}
        onAdded={refresh}
      />
    </div>
  )
}
