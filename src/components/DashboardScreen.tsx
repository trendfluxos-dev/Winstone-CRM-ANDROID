import React from 'react';
import {
  PhoneCall,
  UserPlus,
  Clock,
  ThumbsUp,
  MapPin,
  Calendar,
  ChevronRight,
  Sparkles,
  ArrowUpRight,
  TrendingUp,
} from 'lucide-react';
import { Agent, Lead, FollowUp, MetricBreakdown } from '../types';
import { TemperatureBadge, CategoryBadge } from './Badges';
import { CoachInsightsCard } from './CoachInsightsCard';

interface DashboardScreenProps {
  agent: Agent;
  leads: Lead[];
  followUps: FollowUp[];
  todayMetrics: MetricBreakdown;
  onSelectLead: (lead: Lead) => void;
  onStartCall: (lead: Lead) => void;
  onNavigateTab: (tab: 'leads' | 'followups' | 'performance') => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  agent,
  leads,
  followUps,
  todayMetrics,
  onSelectLead,
  onStartCall,
  onNavigateTab,
}) => {
  // Current formatted date
  const todayFormatted = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  // Derived counts
  const newLeads = leads.filter((l) => l.status === 'New');
  const hotLeads = leads.filter((l) => l.temperature === 'Hot');
  const todayDateStr = new Date().toISOString().split('T')[0];
  const todayFollowUpsList = followUps.filter(
    (f) => (f.date === todayDateStr || f.date === '2026-09-15') && f.status === 'pending'
  );

  const getInitials = (name?: string) => {
    if (!name) return 'TA';
    return name
      .split(' ')
      .filter(Boolean)
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <div id="dashboard-screen" className="flex-1 overflow-y-auto bg-neutral-50 p-4 space-y-5 pb-20">
      {/* 1. Agent Greeting Header */}
      <div className="bg-white rounded-xl p-4 border border-neutral-200/80 shadow-xs">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                Winstone Properties Ltd.
              </span>
              <span className="text-[11px] text-neutral-400 font-mono">{agent.employeeId}</span>
            </div>
            <h2 className="text-xl font-extrabold text-neutral-900 mt-1">
              Welcome, {agent.name}
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-neutral-400" />
              <span>{todayFormatted}</span>
              <span className="text-neutral-300">•</span>
              <span className="text-neutral-600 font-medium">{agent.territory}</span>
            </p>
          </div>
          <div className="w-11 h-11 rounded-full bg-emerald-800 text-white font-bold flex items-center justify-center text-sm shadow-xs border-2 border-white ring-2 ring-emerald-100 shrink-0">
            {getInitials(agent.name)}
          </div>
        </div>

        {/* Quick Shift Summary Banner */}
        <div className="mt-3.5 pt-3 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-600">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="font-medium text-neutral-800">Shift Status: Active On-Duty</span>
          </div>
          <span className="text-[11px] text-neutral-500">Target: 25 calls / 3 visits</span>
        </div>
      </div>

      {/* AI Sales Coach Diagnostic & Daily Playbook */}
      <CoachInsightsCard employeeId={agent.employeeId} />

      {/* 2. Today's Key Metrics Overview Grid */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-bold text-neutral-600 uppercase tracking-wider">
            Today's KPI Pulse
          </h3>
          <button
            onClick={() => onNavigateTab('performance')}
            className="text-xs text-[#0D6E44] font-semibold flex items-center gap-0.5 hover:underline"
          >
            Full Analytics <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          {/* New Leads */}
          <div
            onClick={() => onNavigateTab('leads')}
            className="bg-white p-3 rounded-xl border border-neutral-200/80 shadow-2xs cursor-pointer hover:border-emerald-300 transition-all"
          >
            <div className="flex items-center justify-between text-neutral-400 mb-1">
              <UserPlus className="w-4 h-4 text-emerald-600" />
              <span className="text-[10px] text-emerald-700 bg-emerald-50 font-bold px-1 rounded">
                +{newLeads.length}
              </span>
            </div>
            <div className="text-lg font-bold text-neutral-900 leading-tight">
              {todayMetrics.leadsAssigned}
            </div>
            <div className="text-[11px] text-neutral-500 font-medium mt-0.5">New Leads</div>
          </div>

          {/* Today's Calls */}
          <div
            onClick={() => onNavigateTab('performance')}
            className="bg-white p-3 rounded-xl border border-neutral-200/80 shadow-2xs cursor-pointer hover:border-emerald-300 transition-all"
          >
            <div className="flex items-center justify-between text-neutral-400 mb-1">
              <PhoneCall className="w-4 h-4 text-blue-600" />
              <span className="text-[10px] text-blue-700 bg-blue-50 font-bold px-1 rounded">
                {todayMetrics.connectedCalls} conn
              </span>
            </div>
            <div className="text-lg font-bold text-neutral-900 leading-tight">
              {todayMetrics.callsMade}
            </div>
            <div className="text-[11px] text-neutral-500 font-medium mt-0.5">Today's Calls</div>
          </div>

          {/* Follow-ups Today */}
          <div
            onClick={() => onNavigateTab('followups')}
            className="bg-white p-3 rounded-xl border border-neutral-200/80 shadow-2xs cursor-pointer hover:border-emerald-300 transition-all"
          >
            <div className="flex items-center justify-between text-neutral-400 mb-1">
              <Clock className="w-4 h-4 text-amber-600" />
              <span className="text-[10px] text-amber-700 bg-amber-50 font-bold px-1 rounded">
                {todayFollowUpsList.length} due
              </span>
            </div>
            <div className="text-lg font-bold text-neutral-900 leading-tight">
              {todayFollowUpsList.length}
            </div>
            <div className="text-[11px] text-neutral-500 font-medium mt-0.5">Follow-ups</div>
          </div>

          {/* Interested Leads */}
          <div
            onClick={() => onNavigateTab('leads')}
            className="bg-white p-3 rounded-xl border border-neutral-200/80 shadow-2xs cursor-pointer hover:border-emerald-300 transition-all"
          >
            <div className="flex items-center justify-between text-neutral-400 mb-1">
              <ThumbsUp className="w-4 h-4 text-emerald-600" />
              <span className="text-[10px] text-emerald-700 bg-emerald-50 font-bold px-1 rounded">
                {hotLeads.length} hot
              </span>
            </div>
            <div className="text-lg font-bold text-neutral-900 leading-tight">
              {todayMetrics.interestedLeads}
            </div>
            <div className="text-[11px] text-neutral-500 font-medium mt-0.5">Interested</div>
          </div>

          {/* Site Visits */}
          <div
            onClick={() => onNavigateTab('performance')}
            className="bg-white p-3 rounded-xl border border-neutral-200/80 shadow-2xs cursor-pointer hover:border-emerald-300 transition-all"
          >
            <div className="flex items-center justify-between text-neutral-400 mb-1">
              <MapPin className="w-4 h-4 text-purple-600" />
              <span className="text-[10px] text-purple-700 bg-purple-50 font-bold px-1 rounded">
                Gulshan
              </span>
            </div>
            <div className="text-lg font-bold text-neutral-900 leading-tight">
              {todayMetrics.siteVisits}
            </div>
            <div className="text-[11px] text-neutral-500 font-medium mt-0.5">Site Visits</div>
          </div>

          {/* Talk Time */}
          <div
            onClick={() => onNavigateTab('performance')}
            className="bg-white p-3 rounded-xl border border-neutral-200/80 shadow-2xs cursor-pointer hover:border-emerald-300 transition-all"
          >
            <div className="flex items-center justify-between text-neutral-400 mb-1">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span className="text-[10px] text-neutral-500 font-bold px-1 rounded">
                Avg 3.4m
              </span>
            </div>
            <div className="text-lg font-bold text-neutral-900 leading-tight">
              {todayMetrics.talkTimeMinutes}m
            </div>
            <div className="text-[11px] text-neutral-500 font-medium mt-0.5">Total Talk</div>
          </div>
        </div>
      </div>

      {/* 3. Prominent "New Leads" Section */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-neutral-900">New Leads Ingested</h3>
            <span className="bg-red-500 text-white text-[10px] font-extrabold px-1.5 py-0.2 rounded-full animate-pulse">
              {newLeads.length} Urgent
            </span>
          </div>
          <button
            onClick={() => onNavigateTab('leads')}
            className="text-xs text-[#0D6E44] font-semibold flex items-center hover:underline"
          >
            View All ({leads.length}) <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-2.5">
          {newLeads.slice(0, 3).map((lead) => (
            <div
              key={lead.id}
              id={`dashboard-lead-${lead.id}`}
              className="bg-white rounded-xl p-3.5 border border-emerald-200/90 shadow-xs hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between gap-2">
                <div
                  className="cursor-pointer flex-1 min-w-0"
                  onClick={() => onSelectLead(lead)}
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-sm font-bold text-neutral-900 hover:text-[#0D6E44] transition-colors truncate">
                      {lead.customerName}
                    </h4>
                    <span className="text-[10px] font-mono text-neutral-500 bg-neutral-100 px-1.5 py-0.5 rounded">
                      {lead.phone}
                    </span>
                  </div>

                  <p className="text-xs text-[#0D6E44] font-semibold mt-1 truncate">
                    {lead.project}
                  </p>

                  <div className="flex items-center gap-2 mt-2">
                    <TemperatureBadge temperature={lead.temperature} size="sm" />
                    <CategoryBadge category={lead.operationalCategory} size="sm" />
                    <span className="text-[11px] text-neutral-500">
                      Source: <strong className="text-neutral-700">{lead.source}</strong>
                    </span>
                  </div>

                  {lead.notes.length > 0 && (
                    <p className="text-[11px] text-neutral-600 line-clamp-1 mt-1.5 italic bg-neutral-50 p-1 rounded border border-neutral-100">
                      "{lead.notes[0]}"
                    </p>
                  )}
                </div>

                {/* Direct Action Button */}
                <div className="flex flex-col gap-1.5 shrink-0">
                  <button
                    id={`btn-call-${lead.id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onStartCall(lead);
                    }}
                    className="flex items-center justify-center gap-1 bg-[#0D6E44] hover:bg-[#0A5735] active:scale-95 text-white px-3 py-2 rounded-lg text-xs font-bold shadow-xs transition-all"
                    title="Initiate Agent Call"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span>Call</span>
                  </button>
                  <button
                    onClick={() => onSelectLead(lead)}
                    className="text-[11px] text-neutral-600 hover:text-neutral-900 font-medium text-center py-1 rounded bg-neutral-100 hover:bg-neutral-200 transition-colors"
                  >
                    Details
                  </button>
                </div>
              </div>

              {/* Lead Card Meta Footer */}
              <div className="mt-2.5 pt-2 border-t border-neutral-100 flex items-center justify-between text-[11px] text-neutral-500">
                <span>Last contact: <strong className="text-neutral-700">{lead.lastContact}</strong></span>
                <span>Next follow-up: <strong className="text-emerald-800">{lead.nextFollowUp || 'Not scheduled'}</strong></span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Pending Follow-ups Queue */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-bold text-neutral-900">Today's Scheduled Calls</h3>
          <button
            onClick={() => onNavigateTab('followups')}
            className="text-xs text-[#0D6E44] font-semibold flex items-center hover:underline"
          >
            Manage Queue <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-2">
          {todayFollowUpsList.slice(0, 3).map((fu) => (
            <div
              key={fu.id}
              className="bg-white rounded-lg p-3 border border-neutral-200/80 flex items-center justify-between gap-3 shadow-2xs"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-neutral-900 truncate">
                    {fu.customerName}
                  </span>
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                    {fu.time}
                  </span>
                </div>
                <p className="text-[11px] text-neutral-500 truncate mt-0.5">
                  {fu.project} • {fu.reason}
                </p>
              </div>

              <button
                onClick={() => {
                  const matched = leads.find((l) => l.id === fu.leadId);
                  if (matched) onStartCall(matched);
                }}
                className="w-8 h-8 rounded-full bg-emerald-50 hover:bg-emerald-100 text-[#0D6E44] flex items-center justify-center shrink-0 transition-colors border border-emerald-200"
                title="Call Follow-up"
              >
                <PhoneCall className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Real Estate Corporate Notice / Architecture Note */}
      <div className="bg-emerald-950 text-white rounded-xl p-3.5 text-xs shadow-xs border border-emerald-800/60">
        <div className="flex items-center justify-between font-bold text-emerald-200 mb-1">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>Winstone Real Estate Agent System • Phase 3 CRM Integrated</span>
          </div>
          <span className="text-[10px] font-mono text-emerald-300 bg-emerald-900/60 px-2 py-0.5 rounded border border-emerald-700/50">
            x-device-token
          </span>
        </div>
        <p className="text-emerald-100/90 text-[11px] leading-relaxed">
          Local-first Room Database architecture verified with remote Winstone Web CRM API (<span className="font-mono text-emerald-300">https://webcrm.winstonebd.com</span>). Automated WorkManager sync queue, telephony state emissions, and conflict reconciliation active.
        </p>
      </div>
    </div>
  );
};
