'use client';

import { SiteId } from '@/lib/types';
import {
  getIrrigationBySite,
  irrigationRecommendations,
  getIrrigateNowCount,
  getAverageWaterSavingPct,
  getPlotsBySite,
  plots,
} from '@/lib/mock';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { Droplets, CloudRain, Gauge, Clock, Save } from 'lucide-react';

interface Props {
  siteId: SiteId | 'all';
}

const STATUS_COLORS: Record<string, string> = {
  'irrigate-now': 'bg-red-100 text-red-800 border-red-300',
  'monitor': 'bg-amber-100 text-amber-800 border-amber-300',
  'no-irrigation': 'bg-emerald-100 text-emerald-800 border-emerald-300',
  'irrigating': 'bg-blue-100 text-blue-800 border-blue-300',
};

export function IrrigationSection({ siteId }: Props) {
  const isAll = siteId === 'all';
  const data = isAll ? irrigationRecommendations : getIrrigationBySite(siteId);
  const irrigateNow = isAll ? getIrrigateNowCount() : getIrrigateNowCount(siteId);
  const waterSaving = isAll ? getAverageWaterSavingPct() : getAverageWaterSavingPct(siteId);

  // Status distribution pie
  const statusDist: Record<string, number> = {};
  data.forEach((r) => {
    statusDist[r.status] = (statusDist[r.status] || 0) + 1;
  });
  const statusData = Object.entries(statusDist).map(([name, value]) => ({
    name: name.replace('-', ' '),
    value,
  }));
  const pieColors = ['#dc2626', '#f59e0b', '#10b981', '#3b82f6'];

  // Top 10 plots by water saving
  const topSavers = [...data]
    .sort((a, b) => b.waterSavingPct - a.waterSavingPct)
    .slice(0, 10)
    .map((r) => ({
      plotCode: (isAll ? plots : getPlotsBySite(siteId)).find((p) => p.id === r.plotId)?.plotCode || r.plotId,
      waterSaving: r.waterSavingPct,
    }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          IWSS Irrigation Water Scheduling
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Real-time recommendations based on NPK sensor readings, soil-water balance,
          and weather forecast. {irrigateNow} plots need immediate irrigation.
        </p>
      </div>

      {/* KPI strip */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Droplets className="h-4 w-4 text-red-700" />
              Irrigate Now
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700">{irrigateNow}</div>
            <p className="text-xs text-muted-foreground mt-1">plots critical</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Save className="h-4 w-4 text-emerald-700" />
              Avg Water Saved
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-700">{waterSaving}%</div>
            <p className="text-xs text-muted-foreground mt-1">vs. baseline practice</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <CloudRain className="h-4 w-4 text-blue-700" />
              Forecast Rain (7d)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(data.reduce((acc, r) => acc + r.rainfallForecastMm, 0) / data.length).toFixed(0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">mm average</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Gauge className="h-4 w-4 text-amber-700" />
              Avg Soil Moisture
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(data.reduce((acc, r) => acc + r.soilMoisturePct, 0) / data.length).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">across monitored plots</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts row */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recommendation Status Distribution</CardTitle>
            <CardDescription>
              How many plots fall into each irrigation status bucket right now.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={statusData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  labelLine={false}
                >
                  {statusData.map((_, idx) => (
                    <Cell key={idx} fill={pieColors[idx % pieColors.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top 10 Plots by Water Saving</CardTitle>
            <CardDescription>
              Highest water-saving percentages vs. baseline irrigation practice.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={topSavers}
                layout="vertical"
                margin={{ left: 30, right: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis type="number" domain={[0, 35]} stroke="#6b7280" fontSize={11} />
                <YAxis
                  type="category"
                  dataKey="plotCode"
                  stroke="#6b7280"
                  fontSize={11}
                  width={80}
                />
                <Tooltip />
                <Bar
                  dataKey="waterSaving"
                  fill="#10b981"
                  name="Water Saving (%)"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recommendations table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-emerald-700" />
            Real-Time Irrigation Recommendations
          </CardTitle>
          <CardDescription>
            Live recommendations pushed from Firebase-backed IWSS scheduling API.
            Sorted by urgency (critical first).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-h-[600px] overflow-y-auto rounded-lg border">
            <Table>
              <TableHeader className="sticky top-0 bg-background">
                <TableRow>
                  <TableHead>Plot Code</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Urgency</TableHead>
                  <TableHead className="text-right">Soil Moisture</TableHead>
                  <TableHead className="text-right">ETc (mm)</TableHead>
                  <TableHead className="text-right">Rain 7d (mm)</TableHead>
                  <TableHead className="text-right">Volume (L)</TableHead>
                  <TableHead>Timing</TableHead>
                  <TableHead className="text-right">Saved</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...data]
                  .sort((a, b) => {
                    const order = { critical: 0, high: 1, medium: 2, low: 3 };
                    return order[a.urgency] - order[b.urgency];
                  })
                  .map((r) => {
                    const plot = (isAll ? plots : getPlotsBySite(siteId)).find(
                      (p) => p.id === r.plotId,
                    );
                    return (
                      <TableRow key={r.plotId}>
                        <TableCell className="font-mono text-xs">
                          {plot?.plotCode || r.plotId}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`text-xs ${STATUS_COLORS[r.status]}`}
                          >
                            {r.status.replace('-', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs capitalize font-medium">{r.urgency}</span>
                        </TableCell>
                        <TableCell className="text-right text-xs font-mono">
                          {r.soilMoisturePct}%
                        </TableCell>
                        <TableCell className="text-right text-xs font-mono">
                          {r.etcMm}
                        </TableCell>
                        <TableCell className="text-right text-xs font-mono">
                          {r.rainfallForecastMm}
                        </TableCell>
                        <TableCell className="text-right text-xs font-mono">
                          {r.recommendedVolumeLiters.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-xs">{r.recommendedTiming}</TableCell>
                        <TableCell className="text-right text-xs font-mono font-semibold text-emerald-700">
                          {r.waterSavingPct}%
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
