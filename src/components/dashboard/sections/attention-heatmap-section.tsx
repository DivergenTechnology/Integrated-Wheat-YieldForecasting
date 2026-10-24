'use client';

import { SiteId } from '@/lib/types';
import { yieldPredictions, getYieldPredictionsBySite } from '@/lib/mock';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import { Flame, Brain, Eye } from 'lucide-react';
import { useState } from 'react';

interface Props {
  siteId: SiteId | 'all';
}

const FEATURE_COLORS = [
  '#2a7a65', '#84cc16', '#f59e0b', '#dc2626', '#0891b2',
  '#7c3aed', '#db2777', '#0284c7',
];

export function AttentionHeatmapSection({ siteId }: Props) {
  const isAll = siteId === 'all';
  const data = isAll ? yieldPredictions : getYieldPredictionsBySite(siteId);

  // Build a heatmap matrix: rows = plots (top 12), cols = top features
  const topPlots = data.slice(0, 12);
  const allFeatures = Array.from(
    new Set(data.flatMap((y) => y.topAttentionFeatures.map((f) => f.feature))),
  );
  const topFeatures = allFeatures
    .map((feat) => {
      const weights = data
        .map((y) => y.topAttentionFeatures.find((f) => f.feature === feat)?.weight || 0)
        .filter((w) => w > 0);
      const avg = weights.length > 0 ? weights.reduce((a, b) => a + b, 0) / weights.length : 0;
      return { feature: feat, avgWeight: avg };
    })
    .sort((a, b) => b.avgWeight - a.avgWeight)
    .slice(0, 8)
    .map((f) => f.feature);

  // Heatmap cells: get weight for plot × feature
  function getWeight(plotId: string, feature: string): number {
    const y = data.find((d) => d.plotId === plotId);
    if (!y) return 0;
    return y.topAttentionFeatures.find((f) => f.feature === feature)?.weight || 0;
  }

  function weightColor(w: number): string {
    if (w === 0) return 'transparent';
    // 0 → light, 0.3+ → dark emerald
    const intensity = Math.min(w / 0.3, 1);
    const r = Math.round(255 - intensity * (255 - 42));
    const g = Math.round(255 - intensity * (255 - 122));
    const b = Math.round(255 - intensity * (255 - 100));
    return `rgb(${r}, ${g}, ${b})`;
  }

  // Aggregate bar chart — top features average
  const aggregateData = topFeatures.map((feat) => {
    const weights = data
      .map((y) => y.topAttentionFeatures.find((f) => f.feature === feat)?.weight || 0)
      .filter((w) => w > 0);
    const avg = weights.length > 0 ? weights.reduce((a, b) => a + b, 0) / weights.length : 0;
    return { feature: feat, avgWeight: Number(avg.toFixed(3)) };
  });

  // Radar chart — first 3 plots compared across top features
  const radarData = topFeatures.map((feat) => {
    const entry: Record<string, number | string> = { feature: feat };
    topPlots.slice(0, 3).forEach((p) => {
      entry[p.plotId] = Number(getWeight(p.plotId, feat).toFixed(3));
    });
    return entry;
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          Attention Heatmap — ML Model Attribution
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Visualizes which input features drive the dual-branch attention model's predictions
          per plot. Critical for building decision-maker trust in AI outputs.
        </p>
      </div>

      {/* KPI strip */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Brain className="h-4 w-4 text-emerald-700" />
              Model Type
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-base font-bold">Dual-Branch Attention</div>
            <p className="text-xs text-muted-foreground mt-1">
              Temporal Transformer + XGBoost tabular branch
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Eye className="h-4 w-4 text-emerald-700" />
              Tracked Features
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{topFeatures.length}</div>
            <p className="text-xs text-muted-foreground mt-1">per prediction</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Flame className="h-4 w-4 text-emerald-700" />
              Plots Visualized
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{topPlots.length}</div>
            <p className="text-xs text-muted-foreground mt-1">top predictions</p>
          </CardContent>
        </Card>
      </div>

      {/* Heatmap matrix */}
      <Card>
        <CardHeader>
          <CardTitle>Plot × Feature Attention Matrix</CardTitle>
          <CardDescription>
            Each cell shows the attention weight (0 — 0.30) the model assigned to that feature
            for that plot's yield prediction. Darker green = stronger contribution.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr>
                  <th className="px-2 py-1.5 text-left font-medium text-muted-foreground">
                    Plot
                  </th>
                  {topFeatures.map((feat) => (
                    <th
                      key={feat}
                      className="px-2 py-1.5 text-center font-medium text-muted-foreground text-[10px] leading-tight"
                      style={{ minWidth: 70, maxWidth: 90 }}
                    >
                      {feat}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {topPlots.map((p) => (
                  <tr key={p.plotId}>
                    <td className="px-2 py-1.5 font-mono text-[10px]">{p.plotId}</td>
                    {topFeatures.map((feat) => {
                      const w = getWeight(p.plotId, feat);
                      return (
                        <td key={feat} className="px-1 py-1 text-center">
                          <div
                            className="rounded h-9 flex items-center justify-center font-mono text-[10px]"
                            style={{
                              backgroundColor: weightColor(w),
                              color: w > 0.15 ? '#fff' : '#374151',
                            }}
                          >
                            {w > 0 ? w.toFixed(2) : '-'}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Aggregate + radar */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Aggregate Feature Attribution</CardTitle>
            <CardDescription>
              Average attention weight per feature across all plots.
              Reveals which features dominate model decisions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={aggregateData}
                layout="vertical"
                margin={{ left: 50, right: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis type="number" domain={[0, 0.35]} stroke="#6b7280" fontSize={11} />
                <YAxis
                  type="category"
                  dataKey="feature"
                  stroke="#6b7280"
                  fontSize={11}
                  width={120}
                />
                <Tooltip />
                <Bar dataKey="avgWeight" name="Avg Weight" radius={[0, 4, 4, 0]}>
                  {aggregateData.map((_, idx) => (
                    <Cell key={idx} fill={FEATURE_COLORS[idx % FEATURE_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Plot Comparison — Radar</CardTitle>
            <CardDescription>
              Attention profile comparison across the top 3 plots. Each axis is a feature,
              each polygon is a plot.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData} outerRadius="80%">
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis dataKey="feature" stroke="#6b7280" fontSize={10} />
                <PolarRadiusAxis domain={[0, 0.35]} stroke="#9ca3af" fontSize={9} />
                {topPlots.slice(0, 3).map((p, idx) => (
                  <Radar
                    key={p.plotId}
                    name={p.plotId}
                    dataKey={p.plotId}
                    stroke={FEATURE_COLORS[idx]}
                    fill={FEATURE_COLORS[idx]}
                    fillOpacity={0.15}
                    strokeWidth={2}
                  />
                ))}
                <Legend />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
