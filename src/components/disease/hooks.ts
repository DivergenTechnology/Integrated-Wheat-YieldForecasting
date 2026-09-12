'use client'

import { useCallback, useEffect, useState } from 'react'
import type { DiseaseData, ZoneDiseaseDetail } from './types'

export function useDiseaseData() {
  const [data, setData] = useState<DiseaseData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      setError(null)
      const res = await fetch('/api/disease', { cache: 'no-store' })
      if (!res.ok) throw new Error(`Server responded ${res.status}`)
      setData((await res.json()) as DiseaseData)
    } catch (e) {
      console.error(e)
      setError(e instanceof Error ? e.message : 'Failed to load disease data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { data, loading, error, refresh }
}

export function useZoneDiseaseDetail(zoneId: string | null) {
  const [detail, setDetail] = useState<ZoneDiseaseDetail | null>(null)
  const [loading, setLoading] = useState(false)

  const reload = useCallback(async () => {
    if (!zoneId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/zones/${zoneId}?disease=1`, { cache: 'no-store' })
      if (!res.ok) throw new Error(`Server responded ${res.status}`)
      const json = (await res.json()) as { zone: ZoneDiseaseDetail }
      setDetail(json.zone)
    } catch (e) {
      console.error(e)
      setDetail(null)
    } finally {
      setLoading(false)
    }
  }, [zoneId])

  useEffect(() => {
    if (zoneId) reload()
    else setDetail(null)
  }, [zoneId, reload])

  return { detail, loading, reload }
}
