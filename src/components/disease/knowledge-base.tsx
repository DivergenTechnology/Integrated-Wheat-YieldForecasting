'use client'

import { Bug, Dna, FlaskConical, Info, Satellite, Sprout } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DISEASE_KB, DISEASE_ORDER } from '@/lib/disease-engine'

const PIPELINE = [
  'For each soil feature, a trapezoidal membership function scores whether the measured value lies inside the disease-favourable range (0-1 contribution).',
  'Weighted soil features aggregate into a soil risk score (0-100); missing features are skipped and weights renormalised.',
  'The same scoring runs for UAV features — vegetation indices and raw band reflectances — producing a UAV risk score (0-100).',
  'Fusion: risk = soil × soilShare + uav × (1 − soilShare), where soilShare is disease-specific (0.40-0.55).',
  'The fused score is classified: low ≤ 29, moderate 30-49, high 50-69, severe ≥ 70.',
  'Any high or severe finding raises an alert carrying the disease-specific agronomic recommendation.',
]

function DriverChip({
  label,
  range,
  weight,
  direction,
  inverse,
}: {
  label: string
  range: [number, number]
  weight: number
  direction: 'high' | 'low'
  inverse?: boolean
}) {
  const fmt = (v: number) => (Number.isInteger(v) ? String(v) : String(v))
  return (
    <span className="inline-flex items-center gap-1 rounded-md border bg-stone-50 px-1.5 py-0.5 font-mono text-[11px] text-stone-700">
      {label}: {fmt(range[0])}–{fmt(range[1])}
      {inverse ? (
        <span className="font-sans text-[10px] text-red-700" title="risk when outside healthy range">
          ∉ healthy
        </span>
      ) : (
        <span title={direction === 'high' ? 'higher values favour the pathogen' : 'lower values favour the pathogen'}>
          {direction === 'high' ? '↑' : '↓'}
        </span>
      )}
      <span className="text-stone-400">×{weight}</span>
    </span>
  )
}

export default function KnowledgeBase() {
  return (
    <div className="space-y-6">
      {/* How it works */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Info className="h-4 w-4 text-emerald-700" aria-hidden /> How the fusion engine works
          </CardTitle>
          <CardDescription>
            Combining soil properties and UAV-based multispectral reflectance for six wheat diseases
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm leading-relaxed text-stone-700">
            The detection engine fuses two independent signal sources to estimate disease risk for six common
            wheat diseases: Yellow Rust, Brown Rust, Powdery Mildew, Fusarium Head Blight, Septoria Tritici
            Blotch, and Tan Spot. For each disease, a curated knowledge base defines (a) soil property ranges
            that favour the pathogen and (b) UAV multispectral band / vegetation-index signatures that indicate
            the disease. Each feature carries a weight representing its relative importance, and the two source
            scores are blended with a disease-specific soil share so that soil-borne pathogens lean more on
            agronomic conditions while canopy-borne ones lean more on remote sensing.
          </p>
          <ol className="space-y-2">
            {PIPELINE.map((step, i) => (
              <li key={i} className="flex gap-2.5 text-sm text-stone-700">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[11px] font-bold text-emerald-800">
                  {i + 1}
                </span>
                <span className="leading-relaxed">{step}</span>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      {/* Disease cards */}
      <div className="grid gap-4 lg:grid-cols-2">
        {DISEASE_ORDER.map((id) => {
          const kb = DISEASE_KB[id]
          return (
            <Card key={id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Bug className="h-4 w-4 text-orange-600" aria-hidden /> {kb.label}
                    </CardTitle>
                    <CardDescription className="italic">{kb.pathogen}</CardDescription>
                  </div>
                  <Badge variant="outline" className="shrink-0 font-mono text-[11px]">
                    soil × {Math.round(kb.soilShare * 100)}%
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm leading-relaxed text-stone-700">{kb.symptoms}</p>

                <div>
                  <p className="mb-1.5 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-amber-700">
                    <FlaskConical className="h-3.5 w-3.5" aria-hidden /> Soil drivers
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {kb.soil.map((f) => (
                      <DriverChip
                        key={f.key}
                        label={f.label}
                        range={f.range}
                        weight={f.weight}
                        direction={f.direction}
                        inverse={f.inverse}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <p className="mb-1.5 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-sky-700">
                    <Satellite className="h-3.5 w-3.5" aria-hidden /> UAV drivers
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {kb.uav.map((f) => (
                      <DriverChip
                        key={f.key}
                        label={f.label}
                        range={f.range}
                        weight={f.weight}
                        direction={f.direction}
                        inverse={f.inverse}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <p className="mb-1.5 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-emerald-700">
                    <Sprout className="h-3.5 w-3.5" aria-hidden /> Critical growth stages
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {kb.criticalStages.map((s) => (
                      <Badge key={s} variant="secondary" className="text-[11px]">
                        {s}
                      </Badge>
                    ))}
                  </div>
                </div>

                <p className="rounded-lg bg-emerald-50 p-2.5 text-xs leading-relaxed text-emerald-900">
                  <Dna className="mr-1 inline h-3.5 w-3.5" aria-hidden />
                  <b>Recommendation:</b> {kb.recommendation}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
