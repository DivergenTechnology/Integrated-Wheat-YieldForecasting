'use client';

import { SiteId } from '@/lib/types';
import {
  getDiseaseAlertsBySite,
  diseaseAlerts,
  getDiseaseDistribution,
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
import { Bug, AlertTriangle, Microscope, ShieldAlert } from 'lucide-react';

interface Props {
  siteId: SiteId | 'all';
}

const SEVERITY_COLORS: Record<string, string> = {
  none: 'bg-gray-100 text-gray-800 border-gray-300',
  low: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  medium: 'bg-orange-100 text-orange-800 border-orange-300',
  high: 'bg-red-100 text-red-800 border-red-300',
  severe: 'bg-red-900 text-white border-red-900',
};

const DISEASE_LABELS: Record<string, string> = {
  'yellow-rust': 'Yellow Rust',
  'stem-rust': 'Stem Rust',
  'leaf-rust': 'Leaf Rust',
  'septoria-blotch': 'Septoria Blotch',
  'powdery-mildew': 'Powdery Mildew',
  'loose-smut': 'Loose Smut',
  'fusarium-head-blight': 'Fusarium Head Blight',
};

export function DiseaseSection({ siteId }: Props) {
  const isAll = siteId === 'all';
  const allAlerts = isAll
    ? diseaseAlerts.filter((a) => a.severity !== 'none')
    : getDiseaseAlertsBySite(siteId);
  const distribution = getDiseaseDistribution();

  // Severity distribution
  const severityDist: Record<string, number> = {};
  allAlerts.forEach((a) => {
    severityDist[a.severity] = (severityDist[a.severity] || 0) + 1;
  });
  const severityData = Object.entries(severityDist).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
  }));
  const severityColors = ['#facc15', '#f97316', '#dc2626', '#7f1d1d'];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          UAV Disease Early Detection
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          CNN classifier on UAV multispectral imagery — pre-symptomatic alerts via Red-Edge shift.
          {allAlerts.length} active alerts across monitored plots.
        </p>
      </div>

      {/* KPI strip */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Bug className="h-4 w-4 text-red-700" />
              Active Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700">{allAlerts.length}</div>
            <p className="text-xs text-muted-foreground mt-1">plots with symptoms</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <ShieldAlert className="h-4 w-4 text-red-900" />
              Severe Cases
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-900">
              {allAlerts.filter((a) => a.severity === 'severe').length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">plots need immediate action</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Microscope className="h-4 w-4 text-emerald-700" />
              CNN Precision
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0.87</div>
            <p className="text-xs text-muted-foreground mt-1">on validation set</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <AlertTriangle className="h-4 w-4 text-amber-700" />
              High Severity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-700">
              {allAlerts.filter((a) => a.severity === 'high').length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">plots monitored</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Disease Distribution</CardTitle>
            <CardDescription>
              Number of plots affected by each disease type across the monitored area.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={distribution.map((d) => ({ disease: DISEASE_LABELS[d.disease] || d.disease, count: d.count }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="disease" stroke="#6b7280" fontSize={10} angle={-15} textAnchor="end" height={70} />
                <YAxis stroke="#6b7280" fontSize={11} />
                <Tooltip />
                <Bar
                  dataKey="count"
                  fill="#dc2626"
                  name="Plots Affected"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Severity Distribution</CardTitle>
            <CardDescription>
              Breakdown of alerts by severity tier.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={severityData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  labelLine={false}
                >
                  {severityData.map((_, idx) => (
                    <Cell key={idx} fill={severityColors[idx % severityColors.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Alerts table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bug className="h-4 w-4 text-red-700" />
            Disease Alerts — Detailed Log
          </CardTitle>
          <CardDescription>
            Sorted by severity (severe first). Click a row in production for the UAV image with
            annotated lesion segmentation overlay.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-h-[500px] overflow-y-auto rounded-lg border">
            <Table>
              <TableHeader className="sticky top-0 bg-background">
                <TableRow>
                  <TableHead>Plot Code</TableHead>
                  <TableHead>Disease</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead className="text-right">Incidence</TableHead>
                  <TableHead className="text-right">Confidence</TableHead>
                  <TableHead>Detection Method</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...allAlerts]
                  .sort((a, b) => {
                    const order = { severe: 0, high: 1, medium: 2, low: 3, none: 4 };
                    return order[a.severity] - order[b.severity];
                  })
                  .map((a) => {
                    const plot = (isAll ? plots : getPlotsBySite(siteId)).find(
                      (p) => p.id === a.plotId,
                    );
                    return (
                      <TableRow key={a.id}>
                        <TableCell className="font-mono text-xs">
                          {plot?.plotCode || a.plotId}
                        </TableCell>
                        <TableCell className="text-xs">
                          {DISEASE_LABELS[a.disease] || a.disease}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`text-xs capitalize ${SEVERITY_COLORS[a.severity]}`}
                          >
                            {a.severity}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right text-xs font-mono">
                          {a.incidencePct}%
                        </TableCell>
                        <TableCell className="text-right text-xs font-mono">
                          {(a.confidenceScore * 100).toFixed(0)}%
                        </TableCell>
                        <TableCell className="text-xs">
                          {a.detectionMethod === 'uav-multispectral' ? 'UAV MultiSpec' : 'CNN Classifier'}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-md">
                          {a.notes}
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
