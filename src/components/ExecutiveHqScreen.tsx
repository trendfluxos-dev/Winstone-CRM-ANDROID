import React from 'react';
import {
  TrendingUp,
  Building2,
  PieChart,
  Award,
  Users,
  DollarSign,
  ArrowUpRight,
  ShieldCheck,
  MapPin,
  Calendar,
} from 'lucide-react';
import { Lead } from '../types';

interface ExecutiveHqScreenProps {
  leads: Lead[];
}

export const ExecutiveHqScreen: React.FC<ExecutiveHqScreenProps> = ({ leads }) => {
  const hotCount = leads.filter((l) => l.temperature === 'Hot').length;
  const gradeACount = leads.filter((l) => l.operationalCategory === 'A').length;

  const territories = [
    { name: 'Gulshan & Banani Prime', pipeline: '৳ 42.8 Cr', deals: 16, growth: '+18%' },
    { name: 'Baridhara Diplomatic Zone', pipeline: '৳ 28.5 Cr', deals: 8, growth: '+12%' },
    { name: 'Bashundhara & Purbachal Express', pipeline: '৳ 19.2 Cr', deals: 21, growth: '+24%' },
    { name: 'Dhanmondi Commercial', pipeline: '৳ 14.0 Cr', deals: 11, growth: '+8%' },
    { name: 'Uttara Residential Hub', pipeline: '৳ 11.5 Cr', deals: 14, growth: '+15%' },
  ];

  const agentLeaderboard = [
    { name: 'Tanvir Ahmed', dealsClosed: '৳ 18.2 Cr', conversion: '32%', rank: '1' },
    { name: 'Nusrat Jahan', dealsClosed: '৳ 14.8 Cr', conversion: '29%', rank: '2' },
    { name: 'Mahmudul Hasan', dealsClosed: '৳ 12.0 Cr', conversion: '26%', rank: '3' },
    { name: 'Farzana Rahman', dealsClosed: '৳ 9.5 Cr', conversion: '22%', rank: '4' },
  ];

  return (
    <div id="executive-hq-screen" className="flex-1 flex flex-col bg-[#F8F9FA] overflow-y-auto no-scrollbar pb-20 selection:bg-[#FAF0DB] selection:text-[#8C6B24]">
      {/* Executive Header */}
      <div className="bg-white p-4 border-b border-[#E5E7EB] sticky top-0 z-20 shadow-2xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#FAF6EE] border border-[#E8DFCF] flex items-center justify-center text-[#8C6B24]">
              <TrendingUp className="w-4 h-4 text-[#B8934A]" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#111827]">Winstone Executive HQ</h2>
              <p className="text-[10px] text-[#6B7280]">Macro Performance & Territory Pipeline Cockpit</p>
            </div>
          </div>
          <span className="bg-[#111827] text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
            HQ Live
          </span>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Top Key Performance Metrics */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="bg-white p-3.5 rounded-2xl border border-[#E5E7EB] shadow-2xs text-left">
            <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider block">Total Active Pipeline</span>
            <div className="text-lg font-extrabold text-[#111827] mt-0.5">৳ 116.0 Cr</div>
            <span className="text-[10px] font-semibold text-emerald-600 flex items-center gap-0.5 mt-1">
              <ArrowUpRight className="w-3 h-3" /> +16.4% this quarter
            </span>
          </div>

          <div className="bg-white p-3.5 rounded-2xl border border-[#E5E7EB] shadow-2xs text-left">
            <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider block">Grade A Qualified</span>
            <div className="text-lg font-extrabold text-[#B8934A] mt-0.5">{gradeACount + 12} Deals</div>
            <span className="text-[10px] font-semibold text-[#4B5563] mt-1 block">
              {hotCount + 8} High-Intent Buyers
            </span>
          </div>
        </div>

        {/* Territory Revenue Breakdown */}
        <div className="bg-white p-4 rounded-2xl border border-[#E5E7EB] shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-[#111827] flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#B8934A]" />
              <span>Territory Pipeline Valuation</span>
            </h3>
            <span className="text-[10px] text-[#6B7280]">Dhaka Prime</span>
          </div>

          <div className="space-y-2">
            {territories.map((t) => (
              <div key={t.name} className="p-2.5 bg-[#F9FAFB] rounded-xl border border-[#E5E7EB] flex items-center justify-between text-left">
                <div>
                  <div className="text-xs font-bold text-[#111827]">{t.name}</div>
                  <div className="text-[10px] text-[#6B7280]">{t.deals} active qualified negotiations</div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-[#B8934A]">{t.pipeline}</div>
                  <div className="text-[10px] font-semibold text-emerald-600">{t.growth}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Agent Leaderboard */}
        <div className="bg-white p-4 rounded-2xl border border-[#E5E7EB] shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-[#111827] flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-[#B8934A]" />
              <span>Top Consultant Leaderboard</span>
            </h3>
            <span className="text-[10px] font-semibold text-[#B8934A]">Q3 2026</span>
          </div>

          <div className="space-y-2">
            {agentLeaderboard.map((ag) => (
              <div key={ag.name} className="p-2.5 bg-[#F9FAFB] rounded-xl border border-[#E5E7EB] flex items-center justify-between text-left">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#111827] text-white text-[10px] font-bold flex items-center justify-center">
                    {ag.rank}
                  </span>
                  <div>
                    <div className="text-xs font-bold text-[#111827]">{ag.name}</div>
                    <div className="text-[10px] text-[#6B7280]">Conversion: {ag.conversion}</div>
                  </div>
                </div>
                <div className="text-xs font-bold text-[#111827] font-mono">{ag.dealsClosed}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
