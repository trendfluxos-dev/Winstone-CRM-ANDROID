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
          } bg-rose-50 text-rose-700 border-rose-200`}
        >
          <Flame className={isSm ? 'w-3 h-3 text-rose-600' : 'w-3.5 h-3.5 text-rose-600'} />
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
          } bg-slate-100 text-slate-700 border-slate-200`}
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

  // Distinct clean luxury light styling for Category A/B/C/D
  const styles: Record<OperationalCategory, string> = {
    A: 'bg-[#FAF6EE] text-[#8C6B24] border-[#E2D5B8] font-bold shadow-2xs',
    B: 'bg-blue-50 text-blue-800 border-blue-200 font-semibold',
    C: 'bg-neutral-100 text-neutral-700 border-neutral-200 font-medium',
    D: 'bg-slate-50 text-slate-600 border-slate-200 font-medium',
  };

  const descriptions: Record<OperationalCategory, string> = {
    A: 'Cat A (Immediate High-Value)',
    B: 'Cat B (1-3 Months)',
    C: 'Cat C (Exploring Market)',
    D: 'Cat D (Low Priority)',
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
    New: 'bg-[#B8934A] text-white font-bold shadow-2xs',
    Interested: 'bg-[#FAF6EE] text-[#8C6B24] border border-[#E2D5B8] font-semibold',
    'Active Lead': 'bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold',
    'Follow-up': 'bg-amber-50 text-amber-800 border border-amber-200 font-medium',
    'Site Visit': 'bg-purple-50 text-purple-800 border border-purple-200 font-medium',
    Negotiation: 'bg-indigo-50 text-indigo-800 border border-indigo-200 font-medium',
    Closed: 'bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold',
    'Closed Won': 'bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold',
    Lost: 'bg-neutral-100 text-neutral-600 border border-neutral-200 font-medium',
  };

  return (
    <span
      className={`inline-flex items-center rounded-md ${colorMap[status] || 'bg-neutral-100 text-neutral-700 border border-neutral-200'} ${
        isSm ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-xs'
      }`}
    >
      {status}
    </span>
  );
};
