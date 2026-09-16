import React, { useState } from 'react';
import {
  TrendingUp,
  PhoneCall,
  UserCheck,
  CalendarCheck,
  MapPin,
  Clock,
  BarChart2,
} from 'lucide-react';
import { PerformanceData, MetricBreakdown } from '../types';

interface PerformanceScreenProps {
  performance: PerformanceData;
}

type Period = 'today' | 'sevenDays' | 'thirtyDays';

export const PerformanceScreen: React.FC<PerformanceScreenProps> = ({ performance }) => {
  const [period, setPeriod] = useState<Period>('today');

  const currentMetrics: MetricBreakdown = performance[period];

  const connectRate =
    currentMetrics.callsMade > 0
      ? Math.round((currentMetrics.connectedCalls / currentMetrics.callsMade) * 100)
      : 0;

  const interestRate =
    currentMetrics.connectedCalls > 0
      ? Math.round((currentMetrics.interestedLeads / currentMetrics.connectedCalls) * 100)
      : 0;

  // Visual activity chart
  const activityDistribution =
    period === 'today'
      ? [
          { label: '09 AM', calls: 2, conn: 1 },
          { label: '11 AM', calls: 5, conn: 4 },
          { label: '01 PM', calls: 3, conn: 2 },
          { label: '03 PM', calls: 4, conn: 4 },
        ]
      : period === 'sevenDays'
      ? [
          { label: 'Sat', calls: 12, conn: 9 },
          { label: 'Sun', calls: 16, conn: 13 },
          { label: 'Mon', calls: 14, conn: 11 },
          { label: 'Tue', calls: 15, conn: 12 },
          { label: 'Wed', calls: 11, conn: 9 },
          { label: 'Thu', calls: 18, conn: 14 },
        ]
      : [
          { label: 'Wk 1', calls: 82, conn: 65 },
          { label: 'Wk 2', calls: 94, conn: 76 },
          { label: 'Wk 3', calls: 88, conn: 70 },
          { label: 'Wk 4', calls: 96, conn: 77 },
        ];

  const maxCalls = Math.max(...activityDistribution.map((d) => d.calls), 1);

  return (
    <div id="performance-screen" className="flex-1 flex flex-col bg-[#F8F9FA] text-[#0F172A] overflow-hidden">
      {/* Timeframe Selector */}
      <div className="bg-white p-3 border-b border-[#E5E7EB] shadow-2xs shrink-0">
        <div className="grid grid-cols-3 gap-1 p-1 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
          <button
            onClick={() => setPeriod('today')}
            className={`py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              period === 'today'
                ? 'bg-[#FAF6EE] text-[#8C6B24] border border-[#E8DFCF] shadow-2xs'
                : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            Today
          </button>
          <button
            onClick={() => setPeriod('sevenDays')}
            className={`py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              period === 'sevenDays'
                ? 'bg-[#FAF6EE] text-[#8C6B24] border border-[#E8DFCF] shadow-2xs'
                : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            7 Days
          </button>
          <button
            onClick={() => setPeriod('thirtyDays')}
            className={`py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              period === 'thirtyDays'
                ? 'bg-[#FAF6EE] text-[#8C6B24] border border-[#E8DFCF] shadow-2xs'
                : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            30 Days
          </button>
        </div>
      </div>

      {/* Analytics Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24 custom-scrollbar">
        {/* Conversion Ratios Banner */}
        <div className="bg-white rounded-2xl p-4 border border-[#E5E7EB] shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-[#8C6B24] uppercase tracking-wider">
              Efficiency Rates
            </h3>
            <span className="text-[11px] text-[#64748B] font-mono">
              Period: {period === 'today' ? 'Today' : period === 'sevenDays' ? 'Last 7 Days' : 'Last 30 Days'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-[#FAF9F6] border border-[#E8DFCF] rounded-xl">
              <span className="text-[11px] text-[#64748B] font-medium block">Call Connect Rate</span>
              <div className="text-xl font-extrabold text-[#0F172A] mt-0.5">{connectRate}%</div>
              <div className="w-full bg-[#E2E8F0] h-1.5 rounded-full mt-2 overflow-hidden">
                <div
                  className="bg-[#B8934A] h-full rounded-full transition-all"
                  style={{ width: `${connectRate}%` }}
                />
              </div>
              <span className="text-[10px] text-[#8C6B24] mt-1 block font-medium">
                {currentMetrics.connectedCalls} of {currentMetrics.callsMade} dials
              </span>
            </div>

            <div className="p-3 bg-[#FAF9F6] border border-[#E8DFCF] rounded-xl">
              <span className="text-[11px] text-[#64748B] font-medium block">Lead Interest Rate</span>
              <div className="text-xl font-extrabold text-[#8C6B24] mt-0.5">{interestRate}%</div>
              <div className="w-full bg-[#E2E8F0] h-1.5 rounded-full mt-2 overflow-hidden">
                <div
                  className="bg-[#B8934A] h-full rounded-full transition-all"
                  style={{ width: `${interestRate}%` }}
                />
              </div>
              <span className="text-[10px] text-[#64748B] mt-1 block font-medium">
                {currentMetrics.interestedLeads} of {currentMetrics.connectedCalls} connected
              </span>
            </div>
          </div>
        </div>

        {/* 6 Core Required Metrics Grid */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-[#475569] uppercase tracking-wider px-0.5">
            Key Operational Output
          </h3>

          <div className="grid grid-cols-2 gap-2.5">
            {/* 1. Leads Assigned */}
            <div className="bg-white p-3.5 rounded-2xl border border-[#E5E7EB] shadow-xs">
              <span className="text-[11px] text-[#64748B] font-medium block">Leads Assigned</span>
              <div className="text-xl font-bold text-[#0F172A] mt-1">
                {currentMetrics.leadsAssigned}
              </div>
              <span className="text-[10px] text-[#94A3B8] mt-0.5 block">Via Meta CRM & Web</span>
            </div>

            {/* 2. Total Calls */}
            <div className="bg-white p-3.5 rounded-2xl border border-[#E5E7EB] shadow-xs">
              <span className="text-[11px] text-[#64748B] font-medium block">Total Dials</span>
              <div className="text-xl font-bold text-[#0F172A] mt-1">
                {currentMetrics.callsMade}
              </div>
              <span className="text-[10px] text-[#94A3B8] mt-0.5 block">Outbound attempts</span>
            </div>

            {/* 3. Connected Calls */}
            <div className="bg-white p-3.5 rounded-2xl border border-[#E5E7EB] shadow-xs">
              <span className="text-[11px] text-[#64748B] font-medium block">Connected Calls</span>
              <div className="text-xl font-bold text-[#8C6B24] mt-1">
                {currentMetrics.connectedCalls}
              </div>
              <span className="text-[10px] text-[#8C6B24] mt-0.5 block">Answered by prospect</span>
            </div>

            {/* 4. Interested Leads */}
            <div className="bg-white p-3.5 rounded-2xl border border-[#E5E7EB] shadow-xs">
              <span className="text-[11px] text-[#64748B] font-medium block">Interested Leads</span>
              <div className="text-xl font-bold text-[#B8934A] mt-1">
                {currentMetrics.interestedLeads}
              </div>
              <span className="text-[10px] text-[#8C6B24] mt-0.5 block">Hot & Warm classified</span>
            </div>

            {/* 5. Follow-ups Done */}
            <div className="bg-white p-3.5 rounded-2xl border border-[#E5E7EB] shadow-xs">
              <span className="text-[11px] text-[#64748B] font-medium block">Follow-ups Executed</span>
              <div className="text-xl font-bold text-[#0F172A] mt-1">
                {currentMetrics.followUpsDone}
              </div>
              <span className="text-[10px] text-[#94A3B8] mt-0.5 block">Completed interactions</span>
            </div>

            {/* 6. Site Visits */}
            <div className="bg-white p-3.5 rounded-2xl border border-[#E5E7EB] shadow-xs">
              <span className="text-[11px] text-[#64748B] font-medium block">Site Visits Booked</span>
              <div className="text-xl font-bold text-[#8C6B24] mt-1">
                {currentMetrics.siteVisits}
              </div>
              <span className="text-[10px] text-[#94A3B8] mt-0.5 block">Physical site tours</span>
            </div>
          </div>
        </div>

        {/* Call Volume Chart */}
        <div className="bg-white rounded-2xl p-4 border border-[#E5E7EB] shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-[#8C6B24] uppercase tracking-wider">
              Call Activity Distribution
            </h3>
            <div className="flex items-center gap-3 text-[10px]">
              <span className="flex items-center gap-1 text-[#64748B]">
                <span className="w-2 h-2 rounded-xs bg-[#CBD5E1]" /> Dials
              </span>
              <span className="flex items-center gap-1 text-[#8C6B24] font-semibold">
                <span className="w-2 h-2 rounded-xs bg-[#B8934A]" /> Connected
              </span>
            </div>
          </div>

          {/* Bar Columns */}
          <div className="h-36 pt-4 flex items-end justify-around gap-2 border-b border-[#E2E8F0]">
            {activityDistribution.map((col, idx) => {
              const dialHeight = Math.round((col.calls / maxCalls) * 100);
              const connHeight = Math.round((col.conn / maxCalls) * 100);
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group">
                  <div className="w-full max-w-[32px] flex items-end justify-center gap-0.5 h-full">
                    {/* Dial bar */}
                    <div
                      className="w-1/2 bg-[#E2E8F0] rounded-t transition-all group-hover:bg-[#CBD5E1]"
                      style={{ height: `${dialHeight}%` }}
                      title={`Total Dials: ${col.calls}`}
                    />
                    {/* Connected bar */}
                    <div
                      className="w-1/2 bg-[#B8934A] rounded-t transition-all group-hover:bg-[#A68035]"
                      style={{ height: `${connHeight}%` }}
                      title={`Connected: ${col.conn}`}
                    />
                  </div>
                  <span className="text-[10px] text-[#64748B] font-medium">
                    {col.label}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-[11px] text-[#64748B] pt-1">
            <span>Cumulative Talk Time: <strong className="text-[#0F172A]">{currentMetrics.talkTimeMinutes} minutes</strong></span>
            <span>Avg: <strong className="text-[#8C6B24]">{Math.round(currentMetrics.talkTimeMinutes / (currentMetrics.connectedCalls || 1))}m/call</strong></span>
          </div>
        </div>

        {/* Objective Performance Statement */}
        <div className="bg-[#FAF9F6] rounded-xl p-3.5 border border-[#E8DFCF] text-xs text-[#64748B] space-y-1">
          <span className="font-bold text-[#0F172A] block">Performance Audit Note</span>
          <p className="text-[11px] text-[#64748B] leading-relaxed">
            All metrics reflect local session and logged interactions. Call records and follow-up activities are synced locally and pushed to the Winstone CRM gateway.
          </p>
        </div>
      </div>
    </div>
  );
};
