'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ModelType } from '@/lib/forecast-engine'
import type { ApiData } from './types'

export type { ModelType }

export function useForecastData(model: ModelType) {
  const [data, setData] = useState<ApiData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      setError(null)
      const res = await fetch(`/api/zones?model=${model}`, { cache: 'no-store' })
      if (!res.ok) throw new Error(`Server responded ${res.status}`)
      const json = (await res.json()) as ApiData
      setData(json)
    } catch (e) {
      console.error(e)
      setError(e instanceof Error ? e.message : 'Failed to load forecast data')
    } finally {
      setLoading(false)
    }
  }, [model])

  useEffect(() => {
    setLoading(true)
    refresh()
  }, [refresh])

  return { data, loading, error, refresh }
}

/** Precomputed lookups used by the grid and charts */
export function useDerivedData(data: ApiData | null) {
  return useMemo(() => {
    if (!data) return null
    const forecastByZone = new Map(data.forecasts.map((f) => [f.zoneId, f]))
    const sortedForecasts = [...data.forecasts].sort(
      (a, b) => b.totalYieldTonnes - a.totalYieldTonnes
    )
    return { forecastByZone, sortedForecasts }
  }, [data])
}

export const MODEL_INFO: Record<ModelType, { label: string; description: string }> = {
  mvhs: {
    label: 'Multi-Index Health Score',
    description:
      'Blends NDVI, GNDVI, NDRE, LAI & canopy cover with growth-stage weighting, then maps the score through a calibrated yield-response curve.',
  },
  regression: {
    label: 'NDVI Regression',
    description:
      'Classic linear NDVI → yield regression with crop-specific slopes calibrated from field trial data.',
  },
  ensemble: {
    label: 'Ensemble (Recommended)',
    description:
      'Weighted blend (55/45) of the multi-index model and the NDVI regression for the most stable forecast.',
  },
}
