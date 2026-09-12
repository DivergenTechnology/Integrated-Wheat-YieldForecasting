'use client'

import { useState } from 'react'
import {
  AlertTriangle,
  CalendarDays,
  Trash2,
  TrendingDown,
  TrendingUp,
  Plane,
} from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
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
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Slider } from '@/components/ui/slider'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import {
  CROP_PROFILES,
  GROWTH_STAGES,
  HEALTH_LABELS,
  HEALTH_COLORS,
  STAGE_LABELS,
  type GrowthStage,
  type ModelType,
  type ZoneForecast,
  type ZoneInput,
} from '@/lib/forecast-engine'
import { IndexRadarChart } from './charts'

const STATUS_BADGE: Record<'low' | 'moderate' | 'optimal', string> = {
  low: 'bg-red-100 text-red-800 hover:bg-red-100',
  moderate: 'bg-amber-100 text-amber-800 hover:bg-amber-100',
  optimal: 'bg-green-100 text-green-800 hover:bg-green-100',
}

/* ------------------------------------------------------------------ */
/* Zone detail dialog                                                  */
/* ------------------------------------------------------------------ */

export function ZoneDetailDialog({
  zone,
  forecast,
  model,
  open,
  onOpenChange,
  onChanged,
}: {
  zone: ZoneInput
  forecast: ZoneForecast | null
  model: ModelType
  open: boolean
  onOpenChange: (v: boolean) => void
  onChanged: () => void
}) {
  const { toast } = useToast()
  const [deletingReading, setDeletingReading] = useState<string | null>(null)

  const crop = CROP_PROFILES[zone.cropType as keyof typeof CROP_PROFILES] ?? CROP_PROFILES.maize
  const sortedReadings = [...zone.readings].sort(
    (a, b) => new Date(b.surveyDate).getTime() - new Date(a.surveyDate).getTime()
  )

  async function deleteReading(id: string) {
    setDeletingReading(id)
    try {
      const res = await fetch(`/api/readings/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      toast({ title: 'Reading removed', description: 'The UAV survey was deleted and forecasts recomputed.' })
      onChanged()
    } catch {
      toast({ title: 'Error', description: 'Could not delete the reading.', variant: 'destructive' })
    } finally {
      setDeletingReading(null)
    }
  }

  async function deleteZone() {
    try {
      const res = await fetch(`/api/zones/${zone.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      toast({ title: 'Zone deleted', description: `${zone.name} and its surveys were removed.` })
      onOpenChange(false)
      onChanged()
    } catch {
      toast({ title: 'Error', description: 'Could not delete the zone.', variant: 'destructive' })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <span aria-hidden>{crop.emoji}</span> {zone.name}
            {forecast && (
              <Badge style={{ backgroundColor: HEALTH_COLORS[forecast.health], color: 'white' }}>
                {HEALTH_LABELS[forecast.health]}
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription className="flex flex-wrap gap-x-4 gap-y-1">
            <span>{crop.label}</span>
            <span>{zone.areaHectares} ha</span>
            {zone.soilType && <span>{zone.soilType}</span>}
            {forecast && <span>{STAGE_LABELS[forecast.dominantStage]}</span>}
          </DialogDescription>
        </DialogHeader>

        {zone.description && <p className="text-sm text-muted-foreground -mt-2">{zone.description}</p>}

        <div
          className="min-h-0 flex-1 overflow-y-auto -mx-6 px-6"
          style={{ maxHeight: 'calc(90vh - 220px)', overscrollBehavior: 'contain' }}
        >
          <div className="pr-2 space-y-5 pb-2">
            {!forecast ? (
              <div className="rounded-lg border border-dashed border-stone-300 bg-stone-50 p-6 text-center">
                <Plane className="mx-auto h-8 w-8 text-stone-400" aria-hidden />
                <p className="mt-2 font-medium">No UAV surveys yet</p>
                <p className="text-sm text-muted-foreground">
                  Record a drone survey with vegetation index values to generate a yield forecast for this zone.
                </p>
              </div>
            ) : (
              <>
                {/* Forecast headline */}
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-xl border bg-gradient-to-br from-emerald-50 to-lime-50 p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-emerald-800">Forecast yield</p>
                    <p className="mt-1 text-3xl font-bold text-emerald-900">{forecast.yieldPerHectare.toFixed(2)}</p>
                    <p className="text-xs text-emerald-700">t/ha · band {forecast.confidenceBand.lower}–{forecast.confidenceBand.upper}</p>
                  </div>
                  <div className="rounded-xl border bg-stone-50 p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-stone-500">Total production</p>
                    <p className="mt-1 text-3xl font-bold">{forecast.totalYieldTonnes.toFixed(1)}</p>
                    <p className="text-xs text-stone-500">tonnes over {zone.areaHectares} ha</p>
                  </div>
                  <div className="rounded-xl border bg-stone-50 p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-stone-500">vs attainable</p>
                    <p className="mt-1 text-3xl font-bold">{Math.round(forecast.yieldFraction * 100)}%</p>
                    <Progress value={forecast.yieldFraction * 100} className="mt-2 h-2" aria-label="Fraction of attainable yield" />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <span className="font-medium">Confidence</span>
                  <Progress value={forecast.confidence * 100} className="h-2 w-40" aria-label="Forecast confidence" />
                  <span>{Math.round(forecast.confidence * 100)}%</span>
                  <Separator orientation="vertical" className="h-5" />
                  <span className="font-medium">Trend</span>
                  {forecast.trendDelta >= 0 ? (
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                      <TrendingUp className="mr-1 h-3 w-3" aria-hidden /> +{forecast.trendDelta.toFixed(2)} t/ha
                    </Badge>
                  ) : (
                    <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
                      <TrendingDown className="mr-1 h-3 w-3" aria-hidden /> {forecast.trendDelta.toFixed(2)} t/ha
                    </Badge>
                  )}
                  <span className="text-muted-foreground">vs previous survey · {forecast.surveysUsed} surveys · model: {model.toUpperCase()}</span>
                </div>

                {forecast.stressFlags.length > 0 && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                    <p className="flex items-center gap-2 text-sm font-medium text-amber-900">
                      <AlertTriangle className="h-4 w-4" aria-hidden /> Stress indicators
                    </p>
                    <ul className="mt-1 list-inside list-disc text-sm text-amber-800">
                      {forecast.stressFlags.map((flag) => (
                        <li key={flag}>{flag}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Index contributions */}
                <div>
                  <h4 className="mb-2 text-sm font-semibold">Index contribution breakdown (latest survey)</h4>
                  <div className="space-y-2">
                    {forecast.contributions.map((c) => (
                      <div key={c.index} className="flex items-center gap-3 text-sm">
                        <span className="w-24 font-medium">{c.label}</span>
                        <span className="w-14 tabular-nums text-stone-600">
                          {c.index === 'canopy' ? `${Math.round(c.value)}%` : c.value.toFixed(2)}
                        </span>
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-stone-100">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${Math.min(100, (c.value / (c.index === 'canopy' ? 100 : c.index === 'lai' ? 6.5 : 1)) * 100)}%`,
                              backgroundColor: HEALTH_COLORS[forecast.health],
                            }}
                          />
                        </div>
                        <span className="w-20 text-right text-xs text-stone-500">weight {Math.round(c.weight * 100)}%</span>
                        <Badge className={`w-20 justify-center ${STATUS_BADGE[c.status]}`}>{c.status}</Badge>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border p-3">
                    <h4 className="mb-1 text-sm font-semibold">Index profile</h4>
                    <IndexRadarChart forecast={forecast} />
                  </div>
                  <div className="rounded-xl border p-4 text-sm">
                    <h4 className="mb-2 font-semibold">Model math (MVHS core)</h4>
                    <p className="text-muted-foreground">
                      Score = Σ(weight × normalized index) using {STAGE_LABELS[forecast.dominantStage]} weights.
                    </p>
                    <p className="mt-2 font-mono text-xs bg-stone-50 rounded p-2 leading-relaxed">
                      score = {forecast.vegetationScore.toFixed(3)}<br />
                      yield = potential × response(score)<br />
                      &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;= {forecast.potentialYield} × {forecast.yieldFraction.toFixed(3)}<br />
                      &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;≈ {forecast.yieldPerHectare.toFixed(2)} t/ha
                    </p>
                    <p className="mt-2 text-muted-foreground">
                      Confidence reflects survey count, index agreement and recency.
                    </p>
                  </div>
                </div>
              </>
            )}

            {/* Reading history */}
            <div>
              <h4 className="mb-2 text-sm font-semibold">UAV survey history</h4>
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Stage</TableHead>
                      <TableHead className="text-right">NDVI</TableHead>
                      <TableHead className="text-right">GNDVI</TableHead>
                      <TableHead className="text-right">NDRE</TableHead>
                      <TableHead className="text-right">LAI</TableHead>
                      <TableHead className="text-right">Canopy</TableHead>
                      <TableHead className="w-10" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedReadings.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-sm text-muted-foreground">
                          No surveys recorded
                        </TableCell>
                      </TableRow>
                    )}
                    {sortedReadings.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="whitespace-nowrap text-xs">
                          <CalendarDays className="mr-1 inline h-3 w-3 text-stone-400" aria-hidden />
                          {new Date(r.surveyDate).toISOString().slice(0, 10)}
                        </TableCell>
                        <TableCell className="text-xs capitalize">{r.growthStage}</TableCell>
                        <TableCell className="text-right tabular-nums">{r.ndvi.toFixed(2)}</TableCell>
                        <TableCell className="text-right tabular-nums">{r.gndvi.toFixed(2)}</TableCell>
                        <TableCell className="text-right tabular-nums">{r.ndre.toFixed(2)}</TableCell>
                        <TableCell className="text-right tabular-nums">{r.lai.toFixed(1)}</TableCell>
                        <TableCell className="text-right tabular-nums">{Math.round(r.canopyCover)}%</TableCell>
                        <TableCell>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-stone-400 hover:text-red-600"
                                aria-label={`Delete survey from ${new Date(r.surveyDate).toISOString().slice(0, 10)}`}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete this survey?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  The forecast will be recalculated from the remaining surveys.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-red-600 hover:bg-red-700"
                                  disabled={deletingReading === r.id}
                                  onClick={() => deleteReading(r.id)}
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="items-center gap-2 border-t pt-3">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="text-red-600 hover:bg-red-50 hover:text-red-700">
                <Trash2 className="mr-1.5 h-4 w-4" /> Delete zone
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete {zone.name}?</AlertDialogTitle>
                <AlertDialogDescription>
                  This permanently removes the zone and all {zone.readings.length} UAV surveys. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={deleteZone}>
                  Delete zone
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button size="sm" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/* ------------------------------------------------------------------ */
/* Add UAV reading dialog                                              */
/* ------------------------------------------------------------------ */

interface IndexFieldProps {
  label: string
  hint: string
  min: number
  max: number
  step: number
  value: number
  decimals: number
  onChange: (v: number) => void
  unit?: string
}

function IndexField({ label, hint, min, max, step, value, decimals, onChange, unit }: IndexFieldProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">{label}</Label>
        <div className="flex items-center gap-1.5">
          <Input
            type="number"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => {
              const v = Number(e.target.value)
              if (Number.isFinite(v)) onChange(v)
            }}
            className="h-8 w-24 text-right tabular-nums"
            aria-label={`${label} value`}
          />
          {unit && <span className="text-xs text-stone-500">{unit}</span>}
        </div>
      </div>
      <Slider
        min={min}
        max={max}
        step={step}
        value={[value]}
        onValueChange={(vals) => onChange(vals[0])}
        aria-label={`${label} slider`}
      />
      <p className="text-xs text-stone-500">{hint}</p>
    </div>
  )
}

export function AddReadingDialog({
  zones,
  defaultZoneId,
  open,
  onOpenChange,
  onAdded,
}: {
  zones: { id: string; name: string }[]
  defaultZoneId?: string
  open: boolean
  onOpenChange: (v: boolean) => void
  onAdded: () => void
}) {
  const { toast } = useToast()
  const [zoneId, setZoneId] = useState(defaultZoneId ?? zones[0]?.id ?? '')
  const [surveyDate, setSurveyDate] = useState(new Date().toISOString().slice(0, 10))
  const [growthStage, setGrowthStage] = useState<GrowthStage>('mid')
  const [ndvi, setNdvi] = useState(0.75)
  const [gndvi, setGndvi] = useState(0.68)
  const [ndre, setNdre] = useState(0.32)
  const [lai, setLai] = useState(3.5)
  const [canopyCover, setCanopyCover] = useState(75)
  const [droneModel, setDroneModel] = useState('DJI Mavic 3M')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [showBands, setShowBands] = useState(false)
  const [bands, setBands] = useState({ blue: '', green: '', red: '', redEdge: '', nir: '', canopyTempC: '' })

  function resetDefaults() {
    setSurveyDate(new Date().toISOString().slice(0, 10))
    setGrowthStage('mid')
    setNdvi(0.75)
    setGndvi(0.68)
    setNdre(0.32)
    setLai(3.5)
    setCanopyCover(75)
    setNotes('')
  }

  async function submit() {
    if (!zoneId) {
      toast({ title: 'Select a zone', description: 'Choose which farming zone this survey belongs to.', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      const bandPayload = showBands
        ? Object.fromEntries(
            Object.entries(bands)
              .filter(([, v]) => v !== '' && Number.isFinite(Number(v)))
              .map(([k, v]) => [k, Number(v)])
          )
        : {}
      const res = await fetch('/api/readings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          zoneId,
          surveyDate,
          growthStage,
          ndvi,
          gndvi,
          ndre,
          lai,
          canopyCover,
          droneModel,
          notes,
          ...bandPayload,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to save survey')
      toast({ title: 'UAV survey recorded', description: 'Yield forecasts have been recomputed for the zone.' })
      resetDefaults()
      onOpenChange(false)
      onAdded()
    } catch (e) {
      toast({
        title: 'Error',
        description: e instanceof Error ? e.message : 'Failed to save survey',
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
            <Plane className="h-5 w-5 text-emerald-700" aria-hidden /> Record UAV survey
          </DialogTitle>
          <DialogDescription>
            Enter vegetation index values extracted from the drone multispectral flight.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-1">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Farming zone</Label>
              <Select value={zoneId} onValueChange={setZoneId}>
                <SelectTrigger aria-label="Farming zone">
                  <SelectValue placeholder="Select zone" />
                </SelectTrigger>
                <SelectContent>
                  {zones.map((z) => (
                    <SelectItem key={z.id} value={z.id}>{z.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Survey date</Label>
              <Input type="date" value={surveyDate} onChange={(e) => setSurveyDate(e.target.value)} aria-label="Survey date" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Growth stage</Label>
            <Select value={growthStage} onValueChange={(v) => setGrowthStage(v as GrowthStage)}>
              <SelectTrigger aria-label="Growth stage">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {GROWTH_STAGES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {STAGE_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-stone-500">Stage controls the yield-model index weighting — NDRE gains weight in later phases.</p>
          </div>

          <Separator />

          <IndexField label="NDVI" hint="Canopy vigour — healthy crops typically 0.6–0.9" min={0} max={1} step={0.01} value={ndvi} decimals={2} onChange={setNdvi} />
          <IndexField label="GNDVI" hint="Chlorophyll concentration — typically 0.5–0.85" min={0} max={1} step={0.01} value={gndvi} decimals={2} onChange={setGndvi} />
          <IndexField label="NDRE" hint="Late-season nitrogen status — typically 0.2–0.5" min={0} max={1} step={0.01} value={ndre} decimals={2} onChange={setNdre} />
          <IndexField label="LAI" hint="Leaf Area Index — dense canopy reaches 4–6" min={0} max={8} step={0.1} value={lai} decimals={1} onChange={setLai} unit="m²/m²" />
          <IndexField label="Canopy cover" hint="Ground shading fraction from orthomosaic classification" min={0} max={100} step={1} value={canopyCover} decimals={0} onChange={setCanopyCover} unit="%" />

          <div className="rounded-lg border border-dashed">
            <button
              type="button"
              onClick={() => setShowBands((v) => !v)}
              className="flex w-full items-center justify-between px-3 py-2 text-left text-sm font-medium"
              aria-expanded={showBands}
            >
              <span>Multispectral raw bands (optional)</span>
              <span className="text-xs text-stone-500">{showBands ? 'hide' : 'show'}</span>
            </button>
            {showBands && (
              <div className="space-y-3 border-t px-3 py-3">
                <p className="text-xs text-stone-500">
                  Reflectance 0–1 per band. Used by the disease fusion engine; derived indices (SAVI, EVI, SIPI, PRI) are computed automatically.
                </p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {(
                    [
                      ['blue', 'Blue'],
                      ['green', 'Green'],
                      ['red', 'Red'],
                      ['redEdge', 'Red edge'],
                      ['nir', 'NIR'],
                      ['canopyTempC', 'Canopy temp (°C)'],
                    ] as const
                  ).map(([key, label]) => (
                    <div key={key} className="space-y-1">
                      <Label className="text-xs text-stone-600">{label}</Label>
                      <Input
                        type="number"
                        step="0.001"
                        min={key === 'canopyTempC' ? -20 : 0}
                        max={key === 'canopyTempC' ? 70 : 1}
                        value={bands[key]}
                        onChange={(e) => setBands((b) => ({ ...b, [key]: e.target.value }))}
                        aria-label={label}
                        placeholder={key === 'canopyTempC' ? 'e.g. 24' : '0–1'}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Drone / notes</Label>
            <Input value={droneModel} onChange={(e) => setDroneModel(e.target.value)} placeholder="Drone model" aria-label="Drone model" />
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Flight notes (optional)" rows={2} aria-label="Flight notes" />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={saving} className="bg-emerald-700 hover:bg-emerald-800">
            {saving ? 'Saving…' : 'Save survey'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/* ------------------------------------------------------------------ */
/* Add zone dialog                                                     */
/* ------------------------------------------------------------------ */

export function AddZoneDialog({
  open,
  onOpenChange,
  onAdded,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  onAdded: () => void
}) {
  const { toast } = useToast()
  const [name, setName] = useState('')
  const [cropType, setCropType] = useState('maize')
  const [area, setArea] = useState('10')
  const [soilType, setSoilType] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)

  async function submit() {
    if (!name.trim()) {
      toast({ title: 'Name required', description: 'Give the farming zone a name.', variant: 'destructive' })
      return
    }
    const areaNum = Number(area)
    if (!Number.isFinite(areaNum) || areaNum <= 0) {
      toast({ title: 'Invalid area', description: 'Area must be a positive number of hectares.', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/zones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, cropType, areaHectares: areaNum, soilType, description }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to create zone')
      toast({ title: 'Zone created', description: `${name} is ready — record a UAV survey to forecast yield.` })
      setName('')
      setSoilType('')
      setDescription('')
      onOpenChange(false)
      onAdded()
    } catch (e) {
      toast({
        title: 'Error',
        description: e instanceof Error ? e.message : 'Failed to create zone',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add farming zone</DialogTitle>
          <DialogDescription>Register a new zone, then record UAV surveys to forecast its yield.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-1">
          <div className="space-y-1.5">
            <Label htmlFor="zone-name">Zone name</Label>
            <Input id="zone-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. North Block C" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Crop</Label>
              <Select value={cropType} onValueChange={setCropType}>
                <SelectTrigger aria-label="Crop type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CROP_PROFILES).map(([key, p]) => (
                    <SelectItem key={key} value={key}>{p.emoji} {p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="zone-area">Area (ha)</Label>
              <Input id="zone-area" type="number" min="0.1" step="0.1" value={area} onChange={(e) => setArea(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="zone-soil">Soil type</Label>
            <Input id="zone-soil" value={soilType} onChange={(e) => setSoilType(e.target.value)} placeholder="e.g. Sandy loam" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="zone-desc">Description</Label>
            <Textarea id="zone-desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Irrigation, fertility history…" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={saving} className="bg-emerald-700 hover:bg-emerald-800">
            {saving ? 'Creating…' : 'Create zone'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
