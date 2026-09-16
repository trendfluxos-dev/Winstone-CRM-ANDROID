import React from 'react';
import {
  PhoneCall,
  Clock,
  ThumbsUp,
  FileCheck,
  Timer,
  Wifi,
  MapPinOff,
  Trophy,
  CheckCircle2,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import {
  AgentDailyActivity,
  getDhakaFormattedDate,
  getDailyTopPerformers,
  formatTalkTime,
} from '../engines/dailyPerformanceEngine';

interface DailyPerformanceWidgetProps {
  currentAgentActivity: AgentDailyActivity;
  allFloorActivities?: AgentDailyActivity[];
  showTopPerformers?: boolean;
}

export const DailyPerformanceWidget: React.FC<DailyPerformanceWidgetProps> = ({
  currentAgentActivity,
  allFloorActivities = [],
  showTopPerformers = true,
}) => {
  const { dateStr, timeStr } = getDhakaFormattedDate();
  const topPerformers = getDailyTopPerformers(allFloorActivities);

  return (
    <div className="space-y-3.5 text-left">
      {/* 1. Daily Performance Banner ("আজকের কাজ") */}
      <div className="bg-white rounded-2xl p-4 border border-[#E8DFCF] shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2.5 border-b border-[#F1F5F9]">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-extrabold text-[#111827]">আজকের কাজ</h3>
              <span className="text-xs text-[#8C6B24] font-bold tracking-tight">
                (Daily Performance)
              </span>
            </div>
            <p className="text-[11px] text-[#6B7280] mt-0.5">
              টাইমজোন: Asia/Dhaka • {dateStr} • {timeStr}
            </p>
          </div>

          {/* Sync & Online State Badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-emerald-800 text-[10.5px] font-bold">
            <Wifi className="w-3 h-3 text-emerald-600 animate-pulse" />
            <span>লাইভ সিঙ্ক</span>
          </div>
        </div>

        {/* 7 Required Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-left">
          {/* Calls Made */}
          <div className="p-2.5 bg-[#FAF9F6] border border-[#E8DFCF] rounded-xl">
            <div className="flex items-center justify-between text-[#6B7280]">
              <span className="text-[10.5px] font-semibold">কল করা হয়েছে</span>
              <PhoneCall className="w-3.5 h-3.5 text-[#8C6B24]" />
            </div>
            <div className="text-lg font-extrabold text-[#111827] font-mono mt-0.5">
              {currentAgentActivity.callsMade}
            </div>
            <span className="text-[9.5px] text-[#8C6B24] font-medium">Calls Made</span>
          </div>

          {/* Connected */}
          <div className="p-2.5 bg-[#FAF9F6] border border-[#E8DFCF] rounded-xl">
            <div className="flex items-center justify-between text-[#6B7280]">
              <span className="text-[10.5px] font-semibold">সংযুক্ত কল</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <div className="text-lg font-extrabold text-emerald-700 font-mono mt-0.5">
              {currentAgentActivity.connected}
            </div>
            <span className="text-[9.5px] text-[#6B7280] font-medium">Connected</span>
          </div>

          {/* Interested */}
          <div className="p-2.5 bg-[#FAF9F6] border border-[#E8DFCF] rounded-xl">
            <div className="flex items-center justify-between text-[#6B7280]">
              <span className="text-[10.5px] font-semibold">আগ্রহী লিড</span>
              <ThumbsUp className="w-3.5 h-3.5 text-[#B8934A]" />
            </div>
            <div className="text-lg font-extrabold text-[#8C6B24] font-mono mt-0.5">
              {currentAgentActivity.interested}
            </div>
            <span className="text-[9.5px] text-[#6B7280] font-medium">Interested</span>
          </div>

          {/* Follow-ups Due */}
          <div className="p-2.5 bg-[#FAF9F6] border border-[#E8DFCF] rounded-xl">
            <div className="flex items-center justify-between text-[#6B7280]">
              <span className="text-[10.5px] font-semibold">বাকি ফলো-আপ</span>
              <Clock className="w-3.5 h-3.5 text-amber-600" />
            </div>
            <div className="text-lg font-extrabold text-amber-700 font-mono mt-0.5">
              {currentAgentActivity.followUpsDue}
            </div>
            <span className="text-[9.5px] text-[#6B7280] font-medium">Follow-ups Due</span>
          </div>

          {/* Reports Submitted */}
          <div className="p-2.5 bg-[#FAF9F6] border border-[#E8DFCF] rounded-xl">
            <div className="flex items-center justify-between text-[#6B7280]">
              <span className="text-[10.5px] font-semibold">রিপোর্ট দাখিল</span>
              <FileCheck className="w-3.5 h-3.5 text-blue-600" />
            </div>
            <div className="text-lg font-extrabold text-blue-700 font-mono mt-0.5">
              {currentAgentActivity.reportsSubmitted}
            </div>
            <span className="text-[9.5px] text-[#6B7280] font-medium">Reports Submitted</span>
          </div>

          {/* Talk Time */}
          <div className="p-2.5 bg-[#FAF9F6] border border-[#E8DFCF] rounded-xl">
            <div className="flex items-center justify-between text-[#6B7280]">
              <span className="text-[10.5px] font-semibold">মোট কথা বলার সময়</span>
              <Timer className="w-3.5 h-3.5 text-purple-600" />
            </div>
            <div className="text-sm font-extrabold text-purple-700 font-mono mt-1">
              {formatTalkTime(currentAgentActivity.talkTimeMinutes)}
            </div>
            <span className="text-[9.5px] text-[#6B7280] font-medium">Talk Time</span>
          </div>
        </div>

        {/* Site Visit Note (Strictly contract compliant) */}
        <div className="pt-2 border-t border-[#F1F5F9] flex items-center justify-between text-[11px] text-[#6B7280]">
          <div className="flex items-center gap-1.5">
            <MapPinOff className="w-3.5 h-3.5 text-[#9CA3AF]" />
            <span className="font-medium text-[#4B5563]">Site Visit — ট্র্যাক হয় না</span>
          </div>
          <span className="text-[10px] text-[#9CA3AF]">
            সিঙ্ক স্ট্যাটাস: {currentAgentActivity.syncState === 'synced' ? 'Online Synced' : 'Ready'}
          </span>
        </div>
      </div>

      {/* 2. Top 3 Performers ("আজকের সেরা ৩ পারফর্মার") */}
      {showTopPerformers && (
        <div className="bg-white rounded-2xl p-4 border border-[#E8DFCF] shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#F1F5F9]">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-[#B8934A]" />
              <h3 className="text-sm font-extrabold text-[#111827]">আজকের সেরা ৩ পারফর্মার</h3>
            </div>
            <span className="text-[10.5px] font-bold text-[#8C6B24] bg-[#FAF6EE] px-2 py-0.5 rounded-full border border-[#E8DFCF]">
              Top 3 Today
            </span>
          </div>

          {topPerformers.length === 0 ? (
            <div className="p-4 bg-[#FAF9F6] rounded-xl border border-[#E8DFCF] text-center text-xs text-[#6B7280]">
              <AlertCircle className="w-4 h-4 text-[#9CA3AF] mx-auto mb-1" />
              <span>আজকের পারফরম্যান্স ডেটা এখনও পাওয়া যায়নি</span>
            </div>
          ) : (
            <div className="space-y-2.5">
              {topPerformers.map((perf) => (
                <div
                  key={perf.employeeId}
                  className="p-3 bg-[#FAF9F6] hover:bg-white rounded-xl border border-[#E8DFCF] transition-all space-y-2 text-left"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-[#111827] text-[#FAF0DB] text-xs font-bold flex items-center justify-center font-mono shrink-0">
                        #{perf.rank}
                      </span>
                      <div>
                        <div className="text-xs font-extrabold text-[#111827]">
                          {perf.agentName}
                        </div>
                        <span className="text-[10px] font-mono text-[#8C6B24] font-bold">
                          {perf.employeeId}
                        </span>
                      </div>
                    </div>

                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {perf.syncState === 'synced' ? 'Synced' : 'Active'}
                    </span>
                  </div>

                  {/* Operational Metrics Strip */}
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 text-[10.5px] bg-white p-2 rounded-lg border border-[#F1F5F9]">
                    <div>
                      <span className="text-[#6B7280] block text-[9.5px]">কলস</span>
                      <span className="font-bold text-[#111827] font-mono">{perf.callsMade}</span>
                    </div>
                    <div>
                      <span className="text-[#6B7280] block text-[9.5px]">সংযুক্ত</span>
                      <span className="font-bold text-emerald-700 font-mono">{perf.connected}</span>
                    </div>
                    <div>
                      <span className="text-[#6B7280] block text-[9.5px]">আগ্রহী</span>
                      <span className="font-bold text-[#8C6B24] font-mono">{perf.interested}</span>
                    </div>
                    <div>
                      <span className="text-[#6B7280] block text-[9.5px]">ফলো-আপ</span>
                      <span className="font-bold text-amber-700 font-mono">{perf.followUpsDue}</span>
                    </div>
                    <div>
                      <span className="text-[#6B7280] block text-[9.5px]">রিপোর্ট</span>
                      <span className="font-bold text-blue-700 font-mono">{perf.reportsSubmitted}</span>
                    </div>
                    <div>
                      <span className="text-[#6B7280] block text-[9.5px]">টকটক</span>
                      <span className="font-bold text-purple-700 font-mono">{perf.talkTimeMinutes}m</span>
                    </div>
                  </div>

                  {/* Factual Performance Summary (Strictly objective without hype) */}
                  <p className="text-[11px] text-[#475569] bg-white/60 p-1.5 rounded-md border border-[#E5E7EB]/60 font-medium">
                    {perf.summary}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
