'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KpiCardProps {
  title: string;
  value: string | number;
  unit?: string;
  delta?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon: LucideIcon;
  className?: string;
  accentColor?: string; // tailwind text color e.g. 'text-emerald-600'
}

export function KpiCard({
  title,
  value,
  unit,
  delta,
  trend,
  icon: Icon,
  className,
  accentColor = 'text-emerald-700',
}: KpiCardProps) {
  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className={cn('h-4 w-4', accentColor)} />
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold tracking-tight">{value}</span>
          {unit && <span className="text-xs text-muted-foreground">{unit}</span>}
        </div>
        {delta && (
          <p
            className={cn(
              'mt-1 text-xs',
              trend === 'up' && 'text-emerald-600',
              trend === 'down' && 'text-red-600',
              trend === 'neutral' && 'text-muted-foreground',
            )}
          >
            {delta}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
