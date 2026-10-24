'use client';

import { SiteId } from '@/lib/types';
import { KpiCard } from '../kpi/kpi-card';
import {
  Layers,
  Wheat,
  Wifi,
  WifiOff,
  Droplets,
  Bug,
  TrendingUp,
} from 'lucide-react';
import {
  getPlotsBySite,
  getSensorsBySite,
  getAveragePredictedYield,
  getIrrigateNowCount,
  getDiseaseAlertCount,
  getAverageWaterSavingPct,
  sites,
  plots,
  sensors,
} from '@/lib/mock';
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
  LineChart,
  Line,
} from 'recharts';

interface Props {
  siteId: SiteId | 'all';
}

export function OverviewSection({ siteId }: Props) {
  const isAll = siteId === 'all';
  const site = isAll ? null : sites.find((s) => s.id === siteId)!;
  const filteredPlots = isAll ? plots : getPlotsBySite(siteId);
  const filteredSensors = isAll ? sensors : getSensorsBySite(siteId);
  const avgYield = isAll
    ? getAveragePredictedYield()
    : getAveragePredictedYield(siteId);
  const irrigateNow = isAll ? getIrrigateNowCount() : getIrrigateNowCount(siteId);
  const diseaseAlerts = isAll ? getDiseaseAlertCount() : getDiseaseAlertCount(siteId);
  const waterSaving = isAll ? getAverageWaterSavingPct() : getAverageWaterSavingPct(siteId);
  const activeSensors = filteredSensors.filter((s) => s.status === 'online').length;
  const offlineSensors = filteredSensors.filter((s) => s.status === 'offline').length;
  const totalHectares = isAll
    ? sites.reduce((acc, s) => acc + s.totalHectares, 0)
    : site!.totalHectares;

  // Site comparison data (for "all" view)
  const siteComparison = sites.map((s) => ({
    name: s.name,
    plots: getPlotsBySite(s.id).length,
    yield: Number(getAveragePredictedYield(s.id).toFixed(2)),
    waterSaving: getAverageWaterSavingPct(s.id),
  }));

  // Trend chart — synthetic 7-day trend
  const trendData = Array.from({ length: 7 }, (_, i) => ({
    day: `D-${6 - i}`,
    yield: Number((avgYield + Math.sin(i * 0.8) * 0.3).toFixed(2)),
    moisture: Number((28 + Math.sin(i * 0.6) * 6).toFixed(1)),
  }));

  return (
    <div className="space-y-6">
      {/* Header text */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          {isAll ? 'Project Overview — All Pilot Sites' : `${site!.name} — ${site!.institute}`}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {isAll
            ? 'Aggregated KPIs across Bishoftu, Asella, and Ambo agricultural research institutes.'
            : `Regional view for ${site!.region}. Elevation: ${site!.elevation} m ASL.`}
        </p>
      </div>

      {/* KPI Grid */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Total Plots"
          value={filteredPlots.length}
          unit="plots"
          delta={`${totalHectares.toFixed(1)} ha total`}
          trend="neutral"
          icon={Layers}
          accentColor="text-emerald-700"
        />
        <KpiCard
          title="Avg. Predicted Yield"
          value={avgYield}
          unit="t/ha"
          delta="R² = 0.78"
          trend="up"
          icon={Wheat}
          accentColor="text-emerald-700"
        />
        <KpiCard
          title="Active Sensors"
          value={activeSensors}
          unit={`of ${filteredSensors.length}`}
          delta={`${offlineSensors} offline`}
          trend={offlineSensors > 0 ? 'down' : 'up'}
          icon={activeSensors > offlineSensors ? Wifi : WifiOff}
          accentColor="text-emerald-700"
        />
        <KpiCard
          title="Irrigation Alerts"
          value={irrigateNow}
          unit="plots"
          delta={`Water saving: ${waterSaving}%`}
          trend="up"
          icon={Droplets}
          accentColor="text-emerald-700"
        />
      </div>

      {/* Secondary KPIs */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Disease Alerts"
          value={diseaseAlerts}
          unit="plots"
          delta="CNN precision 0.87"
          trend={diseaseAlerts > 5 ? 'down' : 'neutral'}
          icon={Bug}
          accentColor="text-amber-700"
        />
        <KpiCard
          title="Water Saved"
          value={waterSaving}
          unit="%"
          delta="vs. baseline practice"
          trend="up"
          icon={TrendingUp}
          accentColor="text-emerald-700"
        />
        <KpiCard
          title="Varieties Monitored"
          value={5}
          unit="cultivars"
          delta="Kubsa · Ogolcho · Danda'a · Fentale-1 · Mada-Walabu"
          trend="neutral"
          icon={Wheat}
          accentColor="text-emerald-700"
        />
        <KpiCard
          title="Satellite Tiles"
          value={isAll ? 12 : 4}
          unit="Sentinel-2"
          delta="5-day revisit · 10 m GSD"
          trend="neutral"
          icon={Layers}
          accentColor="text-emerald-700"
        />
      </div>

      {/* Charts row */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Trend chart */}
        <Card>
          <CardHeader>
            <CardTitle>7-Day Trend — Yield Prediction vs. Soil Moisture</CardTitle>
            <CardDescription>
              Attention-based model output. Moisture trend drives irrigation scheduling.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="day" stroke="#6b7280" fontSize={12} />
                <YAxis yAxisId="left" stroke="#6b7280" fontSize={12} />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="#6b7280"
                  fontSize={12}
                />
                <Tooltip />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="yield"
                  stroke="#2a7a65"
                  strokeWidth={2}
                  name="Yield (t/ha)"
                  dot={{ r: 3 }}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="moisture"
                  stroke="#0891b2"
                  strokeWidth={2}
                  name="Moisture (%)"
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Site comparison chart (only when "all") */}
        <Card>
          <CardHeader>
            <CardTitle>Site Comparison — Plots &amp; Average Yield</CardTitle>
            <CardDescription>
              Distribution of instrumented plots and predicted yield per site.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={siteComparison}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
                <YAxis yAxisId="left" stroke="#6b7280" fontSize={12} />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="#6b7280"
                  fontSize={12}
                />
                <Tooltip />
                <Legend />
                <Bar
                  yAxisId="left"
                  dataKey="plots"
                  fill="#2a7a65"
                  name="Plots"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  yAxisId="right"
                  dataKey="yield"
                  fill="#84cc16"
                  name="Avg Yield (t/ha)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* System status footer */}
      <Card>
        <CardHeader>
          <CardTitle>System Status</CardTitle>
          <CardDescription>
            Real-time subsystem health indicators
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { name: 'Firebase RTDB', status: 'Operational', color: 'bg-emerald-500' },
              { name: 'PostGIS / GeoServer', status: 'Operational', color: 'bg-emerald-500' },
              { name: 'Sentinel-2 Sync', status: 'Operational', color: 'bg-emerald-500' },
              { name: 'UAV Pipeline', status: 'Standby', color: 'bg-amber-500' },
              { name: 'CNN Disease Model', status: 'Operational', color: 'bg-emerald-500' },
              { name: 'Attention Yield Model', status: 'Operational', color: 'bg-emerald-500' },
              { name: 'IWSS Scheduling API', status: 'Operational', color: 'bg-emerald-500' },
              { name: 'IWCYS Inference API', status: 'Operational', color: 'bg-emerald-500' },
            ].map((s) => (
              <div
                key={s.name}
                className="flex items-center gap-2 rounded-lg border p-2.5"
              >
                <span className={`h-2 w-2 rounded-full ${s.color}`} />
                <div className="flex-1">
                  <div className="text-xs text-muted-foreground">{s.name}</div>
                  <div className="text-sm font-medium">{s.status}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
