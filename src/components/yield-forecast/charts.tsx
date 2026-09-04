'use client'

import { useMemo } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ErrorBar,
  Legend,
  Line,
  LineChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { ZoneForecast } from '@/lib/forecast-engine'

const TREND_PALETTE = ['#15803d', '#65a30d', '#ca8a04', '#ea580c', '#4d7c0f', '#a16207']

/** Predicted vs attainable yield per zone, with confidence error bars */
export function ForecastBarChart({ forecasts }: { forecasts: ZoneForecast[] }) {
  const data = forecasts.map((f) => ({
    name: f.zoneName.replace(/^(North|South|East|West)\s/, '$1 ').slice(0, 14),
    predicted: f.yieldPerHectare,
    potential: f.potentialYield,
    band: [f.yieldPerHectare - f.confidenceBand.lower, f.confidenceBand.upper - f.yieldPerHectare] as [number, number],
    fill: undefined,
  }))

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 12, left: -12, bottom: 0 }} barGap={-28}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e4e9e0" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#4b5563' }} interval={0} angle={-14} dy={8} height={44} />
          <YAxis tick={{ fontSize: 11, fill: '#4b5563' }} label={{ value: 't/ha', angle: -90, position: 'insideLeft', style: { fontSize: 11, fill: '#6b7280' } }} />
          <Tooltip
            formatter={(value: number, name: string) => [`${Number(value).toFixed(2)} t/ha`, name === 'predicted' ? 'Forecast' : 'Attainable']}
            contentStyle={{ borderRadius: 10, border: '1px solid #e5e7eb', fontSize: 12 }}
          />
          <Bar dataKey="potential" name="Attainable" radius={[4, 4, 0, 0]} barSize={26}>
            {data.map((_, i) => (
              <Cell key={i} fill="#e2e8dd" />
            ))}
          </Bar>
          <Bar dataKey="predicted" name="Forecast" radius={[4, 4, 0, 0]} barSize={26}>
            {data.map((entry, i) => (
              <Cell key={i} fill={HEALTH_FILL[forecasts[i].health]} />
            ))}
            <ErrorBar dataKey="band" width={5} strokeWidth={1.5} stroke="#52525b" />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

const HEALTH_FILL: Record<ZoneForecast['health'], string> = {
  critical: '#b91c1c',
  poor: '#ea580c',
  fair: '#ca8a04',
  good: '#65a30d',
  excellent: '#15803d',
}

/** Season-long NDVI evolution per zone */
export function NdviTrendChart({ trend }: { trend: { date: string; [zoneName: string]: string | number }[] }) {
  const zoneNames = useMemo(() => {
    const keys = new Set<string>()
    for (const row of trend) Object.keys(row).forEach((k) => k !== 'date' && keys.add(k))
    return Array.from(keys)
  }, [trend])

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={trend} margin={{ top: 10, right: 12, left: -12, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e4e9e0" vertical={false} />
          <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#4b5563' }} tickFormatter={(v: string) => v.slice(5)} />
          <YAxis domain={[0.2, 1]} tick={{ fontSize: 11, fill: '#4b5563' }} />
          <Tooltip
            formatter={(value: number) => Number(value).toFixed(2)}
            contentStyle={{ borderRadius: 10, border: '1px solid #e5e7eb', fontSize: 12 }}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          {zoneNames.map((name, i) => (
            <Line
              key={name}
              type="monotone"
              dataKey={name}
              stroke={TREND_PALETTE[i % TREND_PALETTE.length]}
              strokeWidth={2}
              dot={{ r: 2.5 }}
              activeDot={{ r: 4 }}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

/** Normalized index profile of the latest survey vs an optimal benchmark */
export function IndexRadarChart({ forecast }: { forecast: ZoneForecast }) {
  const data = forecast.contributions.map((c) => ({
    index: c.label,
    zone: Math.round(c.normalized * 100) / 100,
    optimal: 0.78,
  }))
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} outerRadius="78%">
          <PolarGrid stroke="#dfe5da" />
          <PolarAngleAxis dataKey="index" tick={{ fontSize: 10, fill: '#4b5563' }} />
          <PolarRadiusAxis domain={[0, 1]} tick={false} axisLine={false} />
          <Radar name="Optimal" dataKey="optimal" stroke="#a8b5a2" fill="#c8d3c2" fillOpacity={0.35} />
          <Radar name={forecast.zoneName} dataKey="zone" stroke="#15803d" fill="#4ade80" fillOpacity={0.45} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Tooltip formatter={(v: number) => Number(v).toFixed(2)} contentStyle={{ borderRadius: 10, border: '1px solid #e5e7eb', fontSize: 12 }} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}
