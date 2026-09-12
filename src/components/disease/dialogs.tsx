'use client'

import { useState } from 'react'
import {
  Check,
  FlaskConical,
  Loader2,
  Radar,
  ShieldAlert,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import {
  RISK_COLORS,
  type DiseaseId,
  type RiskLevel,
} from '@/lib/disease-engine'
import { useZoneDiseaseDetail } from './hooks'
import type { SoilSampleItem } from './types'

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

/* ------------------------------------------------------------------ */
/* Add soil sample dialog                                              */
/* ------------------------------------------------------------------ */

const SOIL_FIELDS: { key: string; label: string; unit: string; step: string; required: boolean; hint?: string }[] = [
  { key: 'ph', label: 'pH', unit: '', step: '0.1', required: true },
  { key: 'nitrogen', label: 'Nitrogen (N)', unit: 'mg/kg', step: '1', required: true },
  { key: 'phosphorus', label: 'Phosphorus (P)', unit: 'mg/kg', step: '1', required: true },
  { key: 'potassium', label: 'Potassium (K)', unit: 'mg/kg', step: '1', required: true },
  { key: 'organicMatter', label: 'Organic matter', unit: '%', step: '0.1', required: true },
  { key: 'moisture', label: 'Moisture', unit: '%', step: '1', required: true },
  { key: 'temperature', label: 'Soil temperature', unit: '°C', step: '0.5', required: true },
  { key: 'electricalCond', label: 'EC', unit: 'dS/m', step: '0.01', required: false },
  { key: 'cationExchangeCap', label: 'CEC', unit: 'cmol/kg', step: '0.1', required: false },
  { key: 'bulkDensity', label: 'Bulk density', unit: 'g/cm³', step: '0.01', required: false },
]

export function AddSoilDialog({
  zoneId,
  zoneName,
  open,
  onOpenChange,
  onAdded,
}: {
  zoneId: string | null
  zoneName: string
  open: boolean
  onOpenChange: (v: boolean) => void
  onAdded: () => void
}) {
  const { toast } = useToast()
  const empty: Record<string, string> = Object.fromEntries(SOIL_FIELDS.map((f) => [f.key, '']))
  const [values, setValues] = useState<Record<string, string>>({ ...empty, ph: '6.5', nitrogen: '120', phosphorus: '30', potassium: '150', organicMatter: '3.5', moisture: '35', temperature: '18' })
  const [sampledAt, setSampledAt] = useState(new Date().toISOString().slice(0, 10))
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  async function submit() {
    if (!zoneId) return
    setSaving(true)
    try {
      const payload: Record<string, unknown> = { sampledAt, notes: notes || undefined }
      for (const f of SOIL_FIELDS) {
        const raw = values[f.key]
        if (raw === '') {
          if (f.required) throw new Error(`${f.label} is required`)
          continue
        }
        payload[f.key] = Number(raw)
      }
      const res = await fetch(`/api/zones/${zoneId}/soil`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to save soil sample')
      toast({ title: 'Soil sample recorded', description: 'Disease detection can now fuse soil + UAV signals.' })
      setNotes('')
      onOpenChange(false)
      onAdded()
    } catch (e) {
      toast({
        title: 'Error',
        description: e instanceof Error ? e.message : 'Failed to save soil sample',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5 text-amber-700" aria-hidden /> Record soil sample — {zoneName}
          </DialogTitle>
          <DialogDescription>
            Laboratory or sensor measurements used by the fusion engine to score soil-driven disease pressure.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 py-1 sm:grid-cols-3">
          {SOIL_FIELDS.map((f) => (
            <div key={f.key} className="space-y-1">
              <Label className="text-xs text-stone-600">
                {f.label} {f.required ? '' : '(optional)'}
              </Label>
              <Input
                type="number"
                step={f.step}
                value={values[f.key]}
                onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                aria-label={f.label}
                placeholder={f.unit}
              />
            </div>
          ))}
          <div className="space-y-1 sm:col-span-1">
            <Label className="text-xs text-stone-600">Sample date</Label>
            <Input type="date" value={sampledAt} onChange={(e) => setSampledAt(e.target.value)} aria-label="Sample date" />
          </div>
        </div>

        <div className="space-y-1">
          <Label className="text-xs text-stone-600">Notes</Label>
          <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Lab reference, sampling depth… (optional)" aria-label="Soil notes" />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={saving} className="bg-emerald-700 hover:bg-emerald-800">
            {saving ? 'Saving…' : 'Save soil sample'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/* ------------------------------------------------------------------ */
/* Zone disease dialog                                                 */
/* ------------------------------------------------------------------ */

function ContributionBar({ soil, uav }: { soil: number; uav: number }) {
  const total = Math.max(soil + uav, 1)
  const soilPct = (soil / total) * 100
  return (
    <div className="flex h-2 w-full overflow-hidden rounded-full bg-stone-100" aria-hidden>
      <div className="h-full bg-amber-500" style={{ width: `${soilPct}%` }} />
      <div className="h-full bg-sky-500" style={{ width: `${100 - soilPct}%` }} />
    </div>
  )
}

function SoilSampleCard({ sample }: { sample: SoilSampleItem }) {
  const cells: [string, string][] = [
    ['pH', sample.ph.toFixed(1)],
    ['N', `${sample.nitrogen} mg/kg`],
    ['P', `${sample.phosphorus} mg/kg`],
    ['K', `${sample.potassium} mg/kg`],
    ['OM', `${sample.organicMatter}%`],
    ['Moist', `${sample.moisture}%`],
    ['Temp', `${sample.temperature}°C`],
    ['EC', sample.electricalCond != null ? `${sample.electricalCond}` : '—'],
  ]
  return (
    <div className="rounded-lg border p-3">
      <p className="text-xs font-medium text-stone-500">
        {new Date(sample.sampledAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
      </p>
      <div className="mt-2 grid grid-cols-4 gap-2 text-center">
        {cells.map(([k, v]) => (
          <div key={k} className="rounded-md bg-stone-50 px-1 py-1.5">
            <p className="text-[10px] uppercase tracking-wide text-stone-400">{k}</p>
            <p className="text-sm font-semibold tabular-nums">{v}</p>
          </div>
        ))}
      </div>
      {sample.notes && <p className="mt-2 text-xs text-stone-500">{sample.notes}</p>}
    </div>
  )
}

export function ZoneDiseaseDialog({
  zoneId,
  zoneName,
  open,
  onOpenChange,
  onChanged,
}: {
  zoneId: string | null
  zoneName: string
  open: boolean
  onOpenChange: (v: boolean) => void
  onChanged: () => void
}) {
  const { toast } = useToast()
  const { detail, loading, reload } = useZoneDiseaseDetail(open ? zoneId : null)
  const [running, setRunning] = useState(false)
  const [soilDialogOpen, setSoilDialogOpen] = useState(false)

  async function runDetection() {
    if (!zoneId) return
    setRunning(true)
    try {
      const res = await fetch(`/api/zones/${zoneId}/detect`, { method: 'POST' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Detection failed')
      toast({
        title: 'Disease detection complete',
        description: `${json.detections.length} diseases scored · alerts raised where risk ≥ high`,
      })
      await reload()
      onChanged()
    } catch (e) {
      toast({
        title: 'Detection failed',
        description: e instanceof Error ? e.message : 'Unknown error',
        variant: 'destructive',
      })
    } finally {
      setRunning(false)
    }
  }

  async function ackAlert(alertId: string) {
    const res = await fetch(`/api/alerts/${alertId}/ack`, { method: 'PATCH' })
    if (res.ok) {
      toast({ title: 'Alert acknowledged' })
      await reload()
      onChanged()
    }
  }

  // latest batch per disease
  const latestBatch = detail?.detections?.length
    ? detail.detections.filter(
        (d) => d.detectedAt === detail.detections![0].detectedAt
      )
    : []

  const sortedBatch = [...latestBatch].sort((a, b) => b.riskScore - a.riskScore)
  const zoneAlerts = detail?.alerts ?? []

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-orange-600" aria-hidden /> {zoneName}
            </DialogTitle>
            <DialogDescription>
              Fused soil + UAV disease risk · latest survey{' '}
              {detail?.readings?.length
                ? new Date(detail.readings[detail.readings.length - 1].surveyDate).toLocaleDateString()
                : '—'}
              {' · '}latest soil{' '}
              {detail?.soilSamples?.length
                ? new Date(detail.soilSamples[detail.soilSamples.length - 1].sampledAt).toLocaleDateString()
                : 'not recorded'}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-wrap gap-2">
            <Button onClick={runDetection} disabled={running} size="sm" className="bg-emerald-700 hover:bg-emerald-800">
              {running ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" aria-hidden /> : <Radar className="mr-1.5 h-4 w-4" aria-hidden />}
              {running ? 'Running…' : 'Run disease detection'}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setSoilDialogOpen(true)}>
              <FlaskConical className="mr-1.5 h-4 w-4" aria-hidden /> Record soil sample
            </Button>
          </div>

          {loading && !detail ? (
            <div className="flex h-40 items-center justify-center text-sm text-stone-400">Loading zone data…</div>
          ) : (
            <Tabs defaultValue="detection">
              <TabsList className="w-full justify-start overflow-x-auto">
                <TabsTrigger value="detection">Detection</TabsTrigger>
                <TabsTrigger value="soil">Soil ({detail?.soilSamples?.length ?? 0})</TabsTrigger>
                <TabsTrigger value="alerts">
                  Alerts ({zoneAlerts.filter((a) => !a.acknowledged).length})
                </TabsTrigger>
              </TabsList>

              {/* Detection tab */}
              <TabsContent value="detection" className="space-y-3">
                {sortedBatch.length === 0 ? (
                  <div className="rounded-lg border border-dashed p-4 text-sm text-stone-500">
                    No detections yet — run disease detection to score all six diseases against the latest
                    soil sample and UAV survey.
                  </div>
                ) : (
                  sortedBatch.map((d) => (
                    <div key={d.id} className="rounded-lg border p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">{d.disease.split('_').map((w) => w[0].toUpperCase() + w.slice(1)).join(' ')}</p>
                          <Badge className={`border-0 ${LEVEL_BADGE[d.riskLevel as RiskLevel]}`}>{d.riskLevel.toUpperCase()}</Badge>
                        </div>
                        <p className="text-sm tabular-nums">
                          <span className="text-lg font-bold" style={{ color: RISK_COLORS[d.riskLevel as RiskLevel] }}>
                            {d.riskScore}
                          </span>
                          <span className="text-stone-400">/100 · conf {Math.round(d.confidence * 100)}%</span>
                        </p>
                      </div>

                      <div className="mt-2 space-y-1">
                        <ContributionBar soil={d.soilContribution} uav={d.uavContribution} />
                        <div className="flex justify-between text-[11px] text-stone-500">
                          <span className="flex items-center gap-1">
                            <span className="inline-block h-2 w-2 rounded-full bg-amber-500" aria-hidden /> soil {d.soilContribution}
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="inline-block h-2 w-2 rounded-full bg-sky-500" aria-hidden /> UAV {d.uavContribution}
                          </span>
                        </div>
                      </div>

                      {d.explanation && (
                        <p className="mt-2 line-clamp-3 text-xs text-stone-600">{d.explanation}</p>
                      )}
                      {d.recommendations && (
                        <p className="mt-1 text-xs font-medium text-emerald-800">→ {d.recommendations}</p>
                      )}
                    </div>
                  ))
                )}
              </TabsContent>

              {/* Soil tab */}
              <TabsContent value="soil" className="space-y-3">
                {detail?.soilSamples?.length ? (
                  <div className="max-h-64 overflow-y-auto pr-1">
                    <div className="space-y-2">
                      {[...detail.soilSamples].reverse().map((s) => (
                        <SoilSampleCard key={s.id} sample={s} />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed p-4 text-sm text-stone-500">
                    No soil samples recorded yet. Add one to enable the soil half of the fusion engine.
                  </div>
                )}
              </TabsContent>

              {/* Alerts tab */}
              <TabsContent value="alerts" className="space-y-2">
                {zoneAlerts.length === 0 ? (
                  <div className="rounded-lg border border-dashed p-4 text-sm text-stone-500">No alerts for this zone.</div>
                ) : (
                  zoneAlerts.map((a) => (
                    <div key={a.id} className={`rounded-lg border p-3 ${a.acknowledged ? 'opacity-60' : ''}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge className={`border-0 ${SEVERITY_BADGE[a.severity]}`}>{a.severity}</Badge>
                            <p className="truncate text-sm font-semibold">{a.title}</p>
                          </div>
                          <p className="text-[11px] text-stone-400">
                            {new Date(a.triggeredAt).toLocaleString()}
                          </p>
                        </div>
                        {!a.acknowledged && (
                          <Button variant="outline" size="sm" onClick={() => ackAlert(a.id)}>
                            <Check className="mr-1 h-3.5 w-3.5" aria-hidden /> Ack
                          </Button>
                        )}
                      </div>
                      <p className="mt-1.5 line-clamp-2 text-xs text-stone-600">{a.message}</p>
                      {a.action && <p className="mt-1 text-xs font-medium text-emerald-800">→ {a.action}</p>}
                    </div>
                  ))
                )}
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      <AddSoilDialog
        zoneId={zoneId}
        zoneName={zoneName}
        open={soilDialogOpen}
        onOpenChange={setSoilDialogOpen}
        onAdded={async () => {
          await reload()
          onChanged()
        }}
      />
    </>
  )
}
