'use client';

import { SectionId } from '@/lib/types';
import {
  LayoutDashboard,
  Map as MapIcon,
  Wheat,
  Droplets,
  Bug,
  Activity,
  Flame,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarNavProps {
  active: SectionId;
  onChange: (id: SectionId) => void;
}

const navItems: { id: SectionId; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'map', label: 'Map View', icon: MapIcon },
  { id: 'yield', label: 'Yield Estimation', icon: Wheat },
  { id: 'irrigation', label: 'Irrigation Scheduling', icon: Droplets },
  { id: 'disease', label: 'Disease Detection', icon: Bug },
  { id: 'sensors', label: 'Sensor Feed', icon: Activity },
  { id: 'attention', label: 'Attention Heatmap', icon: Flame },
];

export function SidebarNav({ active, onChange }: SidebarNavProps) {
  return (
    <nav className="flex flex-col gap-1 p-3">
      <div className="px-2 pb-2 text-xs font-semibold uppercase text-muted-foreground tracking-wider">
        Sections
      </div>
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = active === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onChange(item.id)}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
              'hover:bg-accent hover:text-accent-foreground',
              isActive && 'bg-emerald-100 text-emerald-900 font-medium',
              !isActive && 'text-foreground',
            )}
          >
            <Icon className={cn('h-4 w-4', isActive && 'text-emerald-700')} />
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
