'use client';

import { SiteId } from '@/lib/types';
import {
  sensors,
  getSensorsBySite,
  sensorReadings,
  getReadingsBySensor,
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
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts';
import { Activity, Wifi, WifiOff, AlertTriangle, Battery } from 'lucide-react';
import { useState } from 'react';

interface Props {
  siteId: SiteId | 'all';
}

const SENSOR_TYPE_LABELS: Record<string, string> = {
  'soil-moisture': 'Soil Moisture',
  'soil-humidity': 'Soil Humidity',
  'npk': 'NPK',
  'temperature': 'Temperature',
};

export function SensorFeedSection({ siteId }: Props) {
  const isAll = siteId === 'all';
  const data = isAll ? sensors : getSensorsBySite(siteId);
  const [selectedSensorId, setSelectedSensorId] = useState<string | null>(
    data[0]?.id || null,
  );

  // Time-series chart for the selected sensor
  const selectedSensor = data.find((s) => s.id === selectedSensorId);
  const sensorReadingsData = selectedSensor
    ? getReadingsBySensor(selectedSensor.id)
        .slice(0, 24)
        .reverse()
        .map((r) => ({
          time: new Date(r.timestamp).toLocaleTimeString('en-GB', {
            hour: '2-digit',
            minute: '2-digit',
          }),
          value: r.value,
        }))
    : [];

  const onlineCount = data.filter((s) => s.status === 'online').length;
  const warningCount = data.filter((s) => s.status === 'warning').length;
  const offlineCount = data.filter((s) => s.status === 'offline').length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          Real-Time IoT Sensor Feed
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Live readings from NPK / soil-moisture / humidity sensors, streamed to Firebase RTDB
          at 15-minute intervals.
        </p>
      </div>

      {/* KPI strip */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Wifi className="h-4 w-4 text-emerald-700" />
              Online Sensors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-700">{onlineCount}</div>
            <p className="text-xs text-muted-foreground mt-1">actively streaming</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <AlertTriangle className="h-4 w-4 text-amber-700" />
              Warnings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-700">{warningCount}</div>
            <p className="text-xs text-muted-foreground mt-1">need maintenance</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <WifiOff className="h-4 w-4 text-red-700" />
              Offline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700">{offlineCount}</div>
            <p className="text-xs text-muted-foreground mt-1">require site visit</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Battery className="h-4 w-4 text-emerald-700" />
              Avg Battery
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.length > 0
                ? Math.round(
                    data.reduce((acc, s) => acc + s.battery, 0) / data.length,
                  )
                : 0}
              %
            </div>
            <p className="text-xs text-muted-foreground mt-1">across all sensors</p>
          </CardContent>
        </Card>
      </div>

      {/* Time-series chart for selected sensor */}
      {selectedSensor && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-emerald-700" />
              {SENSOR_TYPE_LABELS[selectedSensor.type]} — Sensor {selectedSensor.id}
            </CardTitle>
            <CardDescription>
              Plot {selectedSensor.plotId} · Last 6 hours (15-minute intervals) · Unit: {selectedSensor.lastReadingUnit}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={sensorReadingsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="time" stroke="#6b7280" fontSize={11} />
                <YAxis stroke="#6b7280" fontSize={11} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#2a7a65"
                  strokeWidth={2}
                  name={`Reading (${selectedSensor.lastReadingUnit})`}
                  dot={{ r: 3 }}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Sensors table */}
      <Card>
        <CardHeader>
          <CardTitle>Sensor Inventory</CardTitle>
          <CardDescription>
            Click a row to view its time-series chart above. Status reflects the latest Firebase heartbeat.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-h-[500px] overflow-y-auto rounded-lg border">
            <Table>
              <TableHeader className="sticky top-0 bg-background">
                <TableRow>
                  <TableHead>Sensor ID</TableHead>
                  <TableHead>Plot Code</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Last Reading</TableHead>
                  <TableHead className="text-right">Battery</TableHead>
                  <TableHead>Last Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((s) => {
                  const plot = (isAll ? plots : getPlotsBySite(siteId)).find(
                    (p) => p.id === s.plotId,
                  );
                  return (
                    <TableRow
                      key={s.id}
                      onClick={() => setSelectedSensorId(s.id)}
                      className={`cursor-pointer hover:bg-accent ${
                        selectedSensorId === s.id ? 'bg-emerald-50' : ''
                      }`}
                    >
                      <TableCell className="font-mono text-xs">{s.id}</TableCell>
                      <TableCell className="font-mono text-xs">
                        {plot?.plotCode || s.plotId}
                      </TableCell>
                      <TableCell className="text-xs">
                        {SENSOR_TYPE_LABELS[s.type]}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-xs ${
                            s.status === 'online'
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              : s.status === 'warning'
                                ? 'bg-amber-100 text-amber-800 border-amber-300'
                                : 'bg-red-100 text-red-800 border-red-300'
                          }`}
                        >
                          {s.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-xs font-mono">
                        {s.lastReading} {s.lastReadingUnit}
                      </TableCell>
                      <TableCell className="text-right text-xs font-mono">
                        <span
                          className={
                            s.battery < 30
                              ? 'text-red-600 font-semibold'
                              : s.battery < 60
                                ? 'text-amber-600'
                                : ''
                          }
                        >
                          {s.battery}%
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(s.lastUpdated).toLocaleString('en-GB', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
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
