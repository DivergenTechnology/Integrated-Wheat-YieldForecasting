'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  FlaskConical,
  Loader2,
  Play,
  Radar,
  Save,
  Satellite,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar as RadarShape,
  RadarChart,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  assessAllDiseases,
  DISEASE_KB,
  RISK_COLORS,
  type RiskLevel,
  type SoilSnapshot,
  type UavSnapshot,
} from '@/lib/disease-engine'
import type { DiseaseData } from './types'

const LEVEL_BADGE: Record<RiskLevel, string> = {
  low: 'bg-green-100 text-green-800 hover:bg-green-100',
  moderate: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100',
  high: 'bg-orange-100 text-orange-800 hover:bg-orange-100',
  severe: 'bg-red-100 text-red-800 hover:bg-red-100',
}

interface LabState {
  ph: string
  nitrogen: string
  phosphorus: string
  potassium: string
  organicMatter: string
  moisture: string
  temperature: string
  electricalCond: string
  blue: string
  green: string
  red: string
  redEdge: string
  nir: string
  canopyTempC: string
}

const DEFAULT_LAB: LabState = {
  ph: '6.7',
  nitrogen: '145',
  phosphorus: '36',
  potassium: '165',
  organicMatter: '4.1',
  moisture: '45',
  temperature: '22',
  electricalCond: '0.48',
  blue: '0.07',
  green: '0.28',
  red: '0.24',
  redEdge: '0.29',
  nir: '0.48',
  canopyTempC: '24',
}

function NumField({
  label,
  value,
  onChange,
  step = '0.1',
}: {
  label: string
  value: string
  onChange: (v: string) => void
  step?: string
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-stone-600">{label}</Label>
      <Input type="number" step={step} value={value} onChange={(e) => onChange(e.target.value)} aria-label={label} />
    </div>
  )
}

export default function DetectionLab({ onDataChanged }: { onDataChanged: () => void }) {
  const { toast } = useToast()
  const [zones, setZones] = useState<DiseaseData['zones']>([])
  const [zoneId, setZoneId] = useState<string>('')
  const [state, setState] = useState<LabState>(DEFAULT_LAB)
  const [results, setResults] = useState<ReturnType<typeof assessAllDiseases> | null>(null)
  const [running, setRunning] = useState(false)
  const [persisting, setPersisting] = useState(false)

  useEffect(() => {
    fetch('/api/disease', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((json: DiseaseData) => {
        setZones(json.zones)
        if (json.zones.length > 0) setZoneId((cur) => cur || json.zones[0].id)
      })
      .catch(() => undefined)
  }, [])

  // Prefill from the selected zone's latest soil sample + UAV reading
  async function prefillFromZone(id: string) {
    setZoneId(id)
    try {
      const res = await fetch(`/api/zones/${id}`, { cache: 'no-store' })
      if (!res.ok) return
      const json = (await res.json()) as {
        zone: {
          soilSamples?: { ph: number; nitrogen: number; phosphorus: number; potassium: number; organicMatter: number; moisture: number; temperature: number; electricalCond: number | null }[]
          readings: { blue: number | null; green: number | null; red: number | null; redEdge: number | null; nir: number | null; canopyTempC: number | null }[]
        }
      }
      const soil = json.zone.soilSamples?.[json.zone.soilSamples.length - 1]
      const reading = json.zone.readings?.[json.zone.readings.length - 1]
      setState((s) => ({
        ...s,
        ph: soil ? String(soil.ph) : s.ph,
        nitrogen: soil ? String(soil.nitrogen) : s.nitrogen,
        phosphorus: soil ? String(soil.phosphorus) : s.phosphorus,
        potassium: soil ? String(soil.potassium) : s.potassium,
        organicMatter: soil ? String(soil.organicMatter) : s.organicMatter,
        moisture: soil ? String(soil.moisture) : s.moisture,
        temperature: soil ? String(soil.temperature) : s.temperature,
        electricalCond: soil?.electricalCond != null ? String(soil.electricalCond) : s.electricalCond,
        blue: reading?.blue != null ? String(Number(reading.blue.toFixed(3))) : s.blue,
        green: reading?.green != null ? String(Number(reading.green.toFixed(3))) : s.green,
        red: reading?.red != null ? String(Number(reading.red.toFixed(3))) : s.red,
        redEdge: reading?.redEdge != null ? String(Number(reading.redEdge.toFixed(3))) : s.redEdge,
        nir: reading?.nir != null ? String(Number(reading.nir.toFixed(3))) : s.nir,
        canopyTempC: reading?.canopyTempC != null ? String(reading.canopyTempC) : s.canopyTempC,
      }))
    } catch {
      // keep defaults
    }
  }

  const soilSnapshot: SoilSnapshot = useMemo(() => {
    const n = (v: string) => (v === '' ? undefined : Number(v))
    return {
      ph: n(state.ph),
      nitrogen: n(state.nitrogen),
      phosphorus: n(state.phosphorus),
      potassium: n(state.potassium),
      organicMatter: n(state.organicMatter),
      moisture: n(state.moisture),
      temperature: n(state.temperature),
      electricalCond: n(state.electricalCond),
    }
  }, [state])

  const uavSnapshot: UavSnapshot = useMemo(() => {
    const n = (v: string) => (v === '' ? undefined : Number(v))
    return {
      blue: n(state.blue),
      green: n(state.green),
      red: n(state.red),
      redEdge: n(state.redEdge),
      nir: n(state.nir),
      canopyTempC: n(state.canopyTempC),
    }
  }, [state])

  function runPreview() {
    setRunning(true)
    // small delay so the spinner is visible and the interaction feels responsive
    setTimeout(() => {
      setResults(assessAllDiseases(soilSnapshot, uavSnapshot))
      setRunning(false)
    }, 350)
  }

  async function saveAndPersist() {
    if (!zoneId) {
      toast({ title: 'Select a zone first', variant: 'destructive' })
      return
    }
    setPersisting(true)
    try {
      // 1. persist soil sample
      const soilRes = await fetch(`/api/zones/${zoneId}/soil`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ph: Number(state.ph),
          nitrogen: Number(state.nitrogen),
          phosphorus: Number(state.phosphorus),
          potassium: Number(state.potassium),
          organicMatter: Number(state.organicMatter),
          moisture: Number(state.moisture),
          temperature: Number(state.temperature),
          electricalCond: state.electricalCond === '' ? undefined : Number(state.electricalCond),
        }),
      })
      const soilJson = await soilRes.json()
      if (!soilRes.ok) throw new Error(soilJson.error || 'Failed to save soil sample')

      // 2. run detection (uses the just-saved soil + latest UAV reading)
      const detRes = await fetch(`/api/zones/${zoneId}/detect`, { method: 'POST' })
      const detJson = await detRes.json()
      if (!detRes.ok) throw new Error(detJson.error || 'Detection failed')

      toast({
        title: 'Saved to zone',
        description: 'Soil sample recorded and detection persisted — see Disease Monitoring tab.',
      })
      onDataChanged()
    } catch (e) {
      toast({
        title: 'Save failed',
        description: e instanceof Error ? e.message : 'Unknown error',
        variant: 'destructive',
      })
    } finally {
      setPersisting(false)
    }
  }

  const barData = useMemo(() => {
    if (!results) return []
    return results.map((r) => ({
      name: r.label.replace('Tritici Blotch', '').replace(' Head Blight', ''),
      Soil: r.soilScore,
      UAV: r.uavScore,
      Fused: r.riskScore,
    }))
  }, [results])

  const radarData = useMemo(() => {
    if (!results) return []
    return results.map((r) => ({
      subject: r.label.split(' ')[0],
      risk: r.riskScore,
    }))
  }, [results])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Detection Lab — fuse soil + UAV signals</CardTitle>
          <CardDescription>
            Adjust the inputs below to see how soil properties and UAV multispectral reflectance jointly
            drive disease risk. Preview updates on demand without persisting.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-5 lg:grid-cols-2">
            {/* Soil panel */}
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5 text-sm font-medium">
                  <FlaskConical className="h-4 w-4 text-amber-600" aria-hidden /> Soil properties
                </Label>
                <Select value={zoneId} onValueChange={prefillFromZone}>
                  <SelectTrigger aria-label="Load from zone">
                    <SelectValue placeholder="Load latest from zone…" />
                  </SelectTrigger>
                  <SelectContent>
                    {zones.map((z) => (
                      <SelectItem key={z.id} value={z.id}>
                        {z.name} ({z.cropType})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <NumField label="pH" value={state.ph} onChange={(v) => setState((s) => ({ ...s, ph: v }))} step="0.1" />
                <NumField label="N (mg/kg)" value={state.nitrogen} onChange={(v) => setState((s) => ({ ...s, nitrogen: v }))} step="1" />
                <NumField label="P (mg/kg)" value={state.phosphorus} onChange={(v) => setState((s) => ({ ...s, phosphorus: v }))} step="1" />
                <NumField label="K (mg/kg)" value={state.potassium} onChange={(v) => setState((s) => ({ ...s, potassium: v }))} step="1" />
                <NumField label="OM (%)" value={state.organicMatter} onChange={(v) => setState((s) => ({ ...s, organicMatter: v }))} step="0.1" />
                <NumField label="Moisture (%)" value={state.moisture} onChange={(v) => setState((s) => ({ ...s, moisture: v }))} step="1" />
                <NumField label="Temp (°C)" value={state.temperature} onChange={(v) => setState((s) => ({ ...s, temperature: v }))} step="0.5" />
                <NumField label="EC (dS/m)" value={state.electricalCond} onChange={(v) => setState((s) => ({ ...s, electricalCond: v }))} step="0.01" />
              </div>
            </div>

            {/* UAV panel */}
            <div className="space-y-3">
              <Label className="flex items-center gap-1.5 text-sm font-medium">
                <Satellite className="h-4 w-4 text-sky-600" aria-hidden /> UAV multispectral bands
              </Label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                <NumField label="Blue" value={state.blue} onChange={(v) => setState((s) => ({ ...s, blue: v }))} step="0.005" />
                <NumField label="Green" value={state.green} onChange={(v) => setState((s) => ({ ...s, green: v }))} step="0.005" />
                <NumField label="Red" value={state.red} onChange={(v) => setState((s) => ({ ...s, red: v }))} step="0.005" />
                <NumField label="Red edge" value={state.redEdge} onChange={(v) => setState((s) => ({ ...s, redEdge: v }))} step="0.005" />
                <NumField label="NIR" value={state.nir} onChange={(v) => setState((s) => ({ ...s, nir: v }))} step="0.005" />
                <NumField label="Canopy temp (°C)" value={state.canopyTempC} onChange={(v) => setState((s) => ({ ...s, canopyTempC: v }))} step="0.5" />
              </div>
              <p className="text-xs text-stone-500">
                Derived indices (NDVI, NDRE, GNDVI, SAVI, EVI, SIPI, PRI) are computed from the bands automatically.
              </p>
            </div>
          </div>

          <Separator />

          <div className="flex flex-wrap gap-2">
            <Button onClick={runPreview} disabled={running} className="bg-emerald-700 hover:bg-emerald-800">
              {running ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" aria-hidden /> : <Play className="mr-1.5 h-4 w-4" aria-hidden />}
              {running ? 'Running…' : 'Run detection (preview)'}
            </Button>
            <Button variant="outline" onClick={saveAndPersist} disabled={persisting}>
              {persisting ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" aria-hidden /> : <Save className="mr-1.5 h-4 w-4" aria-hidden />}
              Save &amp; persist to zone
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {results && (
        <>
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Soil vs UAV contribution per disease</CardTitle>
                <CardDescription>Stacked source scores with the fused result</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={barData} margin={{ left: -12, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" fontSize={10} stroke="#78716c" interval={0} angle={-16} dy={8} />
                    <YAxis fontSize={11} stroke="#78716c" domain={[0, 100]} />
                    <RTooltip />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="Soil" stackId="a" fill="#f59e0b" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="UAV" stackId="a" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Fused" fill="#334155" radius={[4, 4, 0, 0]} barSize={10} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Risk profile (radar)</CardTitle>
                <CardDescription>Shape of the disease pressure across all six diseases</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <RadarChart data={radarData} outerRadius={95}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="subject" fontSize={11} stroke="#57534e" />
                    <PolarRadiusAxis domain={[0, 100]} fontSize={10} stroke="#a8a29e" />
                    <RadarShape dataKey="risk" stroke="#dc2626" fill="#dc2626" fillOpacity={0.25} />
                    <RTooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Detailed per-disease results</CardTitle>
              <CardDescription>Sorted by fused risk score (highest first)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {results.map((r, i) => (
                <div key={r.disease} className="rounded-lg border p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold text-stone-400">#{i + 1}</span>
                    <p className="font-semibold">{r.label}</p>
                    <Badge className={`border-0 ${LEVEL_BADGE[r.riskLevel]}`}>{r.riskLevel.toUpperCase()}</Badge>
                    <p className="ml-auto text-sm tabular-nums">
                      <span className="text-lg font-bold" style={{ color: RISK_COLORS[r.riskLevel] }}>{r.riskScore}</span>
                      <span className="text-stone-400">/100 · conf {Math.round(r.confidence * 100)}%</span>
                    </p>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-stone-600">
                    <span>Soil contribution <b className="tabular-nums">{r.soilScore}/100</b></span>
                    <span>UAV contribution <b className="tabular-nums">{r.uavScore}/100</b></span>
                  </div>
                  <p className="mt-2 text-xs text-stone-600">{r.explanation}</p>
                  <p className="mt-1 text-xs font-medium text-emerald-800">Action: {r.recommendation}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </>
      )}

      {!results && (
        <Card className="border-dashed">
          <CardContent className="flex h-40 flex-col items-center justify-center gap-2 text-center">
            <Radar className="h-8 w-8 text-stone-300" aria-hidden />
            <p className="text-sm text-stone-500">
              Set the soil and band values, then run a preview — all six diseases are scored instantly in the browser.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
