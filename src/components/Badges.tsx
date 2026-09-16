import React from 'react';
import { LeadTemperature, OperationalCategory, LeadStatus } from '../types';
import { Flame, Sun, Snowflake } from 'lucide-react';

export const TemperatureBadge: React.FC<{ temperature: LeadTemperature; size?: 'sm' | 'md' }> = ({
  temperature,
  size = 'md',
}) => {
  const isSm = size === 'sm';
  switch (temperature) {
    case 'Hot':
      return (
        <span
          className={`inline-flex items-center gap-1 font-semibold rounded-md border ${
            isSm ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-xs'
          } bg-red-50 text-red-700 border-red-200`}
        >
          <Flame className={isSm ? 'w-3 h-3 text-red-600' : 'w-3.5 h-3.5 text-red-600'} />
          Hot
        </span>
      );
    case 'Warm':
      return (
        <span
          className={`inline-flex items-center gap-1 font-semibold rounded-md border ${
            isSm ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-xs'
          } bg-amber-50 text-amber-800 border-amber-200`}
        >
          <Sun className={isSm ? 'w-3 h-3 text-amber-600' : 'w-3.5 h-3.5 text-amber-600'} />
          Warm
        </span>
      );
    case 'Cold':
      return (
        <span
          className={`inline-flex items-center gap-1 font-semibold rounded-md border ${
            isSm ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-xs'
          } bg-slate-50 text-slate-700 border-slate-200`}
        >
          <Snowflake className={isSm ? 'w-3 h-3 text-slate-500' : 'w-3.5 h-3.5 text-slate-500'} />
          Cold
        </span>
      );
  }
};

export const CategoryBadge: React.FC<{ category: OperationalCategory; size?: 'sm' | 'md' }> = ({
  category,
  size = 'md',
}) => {
  const isSm = size === 'sm';

  // Distinct clean styling for Category A/B/C/D (Operational readiness)
  const styles: Record<OperationalCategory, string> = {
    A: 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold',
    B: 'bg-blue-50 text-blue-800 border-blue-200 font-semibold',
    C: 'bg-neutral-100 text-neutral-700 border-neutral-300 font-medium',
    D: 'bg-zinc-100 text-zinc-600 border-zinc-200 font-medium',
  };

  const descriptions: Record<OperationalCategory, string> = {
    A: 'Cat A (Immediate)',
    B: 'Cat B (1-3 Mo)',
    C: 'Cat C (Exploring)',
    D: 'Cat D (Low Fit)',
  };

  return (
    <span
      className={`inline-flex items-center rounded-md border ${styles[category]} ${
        isSm ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-xs'
      }`}
      title={descriptions[category]}
    >
      Cat {category}
    </span>
  );
};

export const StatusBadge: React.FC<{ status: LeadStatus; size?: 'sm' | 'md' }> = ({
  status,
  size = 'md',
}) => {
  const isSm = size === 'sm';
  const colorMap: Record<LeadStatus, string> = {
    New: 'bg-emerald-600 text-white font-bold',
    Interested: 'bg-emerald-100 text-emerald-800 border border-emerald-200 font-medium',
    'Active Lead': 'bg-emerald-100 text-emerald-800 border border-emerald-200 font-medium',
    'Follow-up': 'bg-amber-100 text-amber-800 border border-amber-200 font-medium',
    'Site Visit': 'bg-purple-100 text-purple-800 border border-purple-200 font-medium',
    Negotiation: 'bg-indigo-100 text-indigo-800 border border-indigo-200 font-medium',
    Closed: 'bg-green-100 text-green-900 border border-green-300 font-bold',
    'Closed Won': 'bg-green-100 text-green-900 border border-green-300 font-bold',
    Lost: 'bg-neutral-100 text-neutral-600 border border-neutral-200 font-medium',
  };

  return (
    <span
      className={`inline-flex items-center rounded-md ${colorMap[status]} ${
        isSm ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-xs'
      }`}
    >
      {status}
    </span>
  );
};
