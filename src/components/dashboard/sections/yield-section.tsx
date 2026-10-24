'use client';

import { SiteId } from '@/lib/types';
import {
  getYieldPredictionsBySite,
  yieldPredictions,
  getAveragePredictedYield,
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
  Legend,
} from 'recharts';
import { Wheat, TrendingUp, Gauge, Sparkles } from 'lucide-react';

interface Props {
  siteId: SiteId | 'all';
}

export function YieldSection({ siteId }: Props) {
  const isAll = siteId === 'all';
  const data = isAll ? yieldPredictions : getYieldPredictionsBySite(siteId);
  const avgYield = isAll ? getAveragePredictedYield() : getAveragePredictedYield(siteId);

  // Aggregate attention weights across all predictions
  const attentionAgg: Record<string, { weight: number; count: number }> = {};
  data.forEach((y) => {
    y.topAttentionFeatures.forEach((f) => {
      if (!attentionAgg[f.feature]) attentionAgg[f.feature] = { weight: 0, count: 0 };
      attentionAgg[f.feature].weight += f.weight;
      attentionAgg[f.feature].count += 1;
    });
  });
  const attentionData = Object.entries(attentionAgg)
    .map(([feature, v]) => ({
      feature,
      avgWeight: Number((v.weight / v.count).toFixed(3)),
    }))
    .sort((a, b) => b.avgWeight - a.avgWeight)
    .slice(0, 8);

  // Yield distribution histogram
  const buckets = [0, 1, 2, 3, 4, 5, 6];
  const histogram = buckets.map((b) => ({
    bucket: `${b}-${b + 1} t/ha`,
    count: data.filter((y) => y.predictedYield >= b && y.predictedYield < b + 1).length,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          IWCYES Yield Estimation
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Attention-based dual-branch model fusing vegetation indices with soil NPK data.
          Average predicted yield:{' '}
          <span className="font-semibold text-emerald-700">{avgYield} t/ha</span>{' '}
          across {data.length} plots.
        </p>
      </div>

      {/* KPI strip */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Wheat className="h-4 w-4 text-emerald-700" />
              Predictions Generated
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.length}</div>
            <p className="text-xs text-muted-foreground mt-1">plots estimated</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Gauge className="h-4 w-4 text-emerald-700" />
              Model R²
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0.78</div>
            <p className="text-xs text-muted-foreground mt-1">target: ≥ 0.80 (Year 2)</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <TrendingUp className="h-4 w-4 text-emerald-700" />
              Avg. Confidence Interval
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">±0.55</div>
            <p className="text-xs text-muted-foreground mt-1">t/ha margin</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Sparkles className="h-4 w-4 text-emerald-700" />
              Attention Features
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{attentionData.length}</div>
            <p className="text-xs text-muted-foreground mt-1">tracked per plot</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts row */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Attention attribution bar chart */}
        <Card>
          <CardHeader>
            <CardTitle>Top Attention Features — Aggregate Attribution</CardTitle>
            <CardDescription>
              Model attention weights averaged across {data.length} plot predictions.
              Higher weight = stronger contribution to yield prediction.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={attentionData}
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
                <Bar
                  dataKey="avgWeight"
                  fill="#2a7a65"
                  name="Attention Weight"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Yield distribution histogram */}
        <Card>
          <CardHeader>
            <CardTitle>Yield Distribution</CardTitle>
            <CardDescription>
              Histogram of predicted yields per plot — shows the spread of expected outcomes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={histogram}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="bucket" stroke="#6b7280" fontSize={11} />
                <YAxis stroke="#6b7280" fontSize={11} />
                <Tooltip />
                <Bar
                  dataKey="count"
                  fill="#84cc16"
                  name="Number of Plots"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Plot-level predictions table */}
      <Card>
        <CardHeader>
          <CardTitle>Plot-Level Predictions</CardTitle>
          <CardDescription>
            Top-50 predictions with confidence intervals and dominant attention features.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-h-[500px] overflow-y-auto rounded-lg border">
            <Table>
              <TableHeader className="sticky top-0 bg-background">
                <TableRow>
                  <TableHead>Plot Code</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead className="text-right">Predicted Yield (t/ha)</TableHead>
                  <TableHead className="text-right">95% CI</TableHead>
                  <TableHead>Top Attention Feature</TableHead>
                  <TableHead className="text-right">Weight</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.slice(0, 50).map((y) => {
                  const plot = (isAll ? plots : getPlotsBySite(siteId)).find(
                    (p) => p.id === y.plotId,
                  );
                  const topFeature = y.topAttentionFeatures[0];
                  return (
                    <TableRow key={y.plotId}>
                      <TableCell className="font-mono text-xs">
                        {plot?.plotCode || y.plotId}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize text-xs">
                          {y.stageAtPrediction}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {y.predictedYield.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground">
                        [{y.confidenceInterval[0].toFixed(2)}, {y.confidenceInterval[1].toFixed(2)}]
                      </TableCell>
                      <TableCell className="text-xs">{topFeature.feature}</TableCell>
                      <TableCell className="text-right font-mono text-xs">
                        {topFeature.weight.toFixed(3)}
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
