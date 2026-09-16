import React, { useState } from 'react';
import {
  Users,
  UserCheck,
  Flame,
  Sun,
  Snowflake,
  Filter,
  CheckCircle2,
  Clock,
  ArrowRight,
  Sparkles,
  Search,
  Building2,
  Calendar,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { Lead, Agent } from '../types';
import { TemperatureBadge, CategoryBadge } from './Badges';

interface CoordinatorDeckScreenProps {
  leads: Lead[];
  onSelectLead: (lead: Lead) => void;
  onAssignLead?: (leadId: string, agentName: string) => void;
}

export const CoordinatorDeckScreen: React.FC<CoordinatorDeckScreenProps> = ({
  leads,
  onSelectLead,
}) => {
  const [filter, setFilter] = useState<'all' | 'unassigned' | 'gradeA' | 'meta'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const agentsList = [
    { name: 'Tanvir Ahmed', employeeId: 'WIN2601', activeLeads: 14, capacity: '85%' },
    { name: 'Nusrat Jahan', employeeId: 'WIN2602', activeLeads: 9, capacity: '60%' },
    { name: 'Mahmudul Hasan', employeeId: 'WIN2603', activeLeads: 18, capacity: '95%' },
    { name: 'Farzana Rahman', employeeId: 'WIN2604', activeLeads: 7, capacity: '45%' },
  ];

  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      lead.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.project.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.phone.includes(searchQuery);

    if (!matchesSearch) return false;

    if (filter === 'unassigned') return !lead.assignedAgent || lead.assignedAgent === 'Unassigned';
    if (filter === 'gradeA') return lead.operationalCategory === 'A';
    if (filter === 'meta') return lead.source?.toLowerCase().includes('meta') || lead.source?.toLowerCase().includes('facebook');
    return true;
  });

  return (
    <div id="coordinator-deck-screen" className="flex-1 flex flex-col bg-[#F8F9FA] overflow-y-auto no-scrollbar pb-20 selection:bg-[#FAF0DB] selection:text-[#8C6B24]">
      {/* Header Banner */}
      <div className="bg-white p-4 border-b border-[#E5E7EB] sticky top-0 z-20 shadow-2xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#FAF6EE] border border-[#E8DFCF] flex items-center justify-center text-[#8C6B24]">
              <Layers className="w-4 h-4 text-[#B8934A]" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#111827]">Lead Coordinator Deck</h2>
              <p className="text-[10px] text-[#6B7280]">Dispatch & Allocation Cockpit • Winstone Operations</p>
            </div>
          </div>
          <span className="bg-[#FAF6EE] text-[#8C6B24] border border-[#E8DFCF] text-[10px] font-bold px-2 py-0.5 rounded-full">
            {leads.length} Active Leads
          </span>
        </div>

        {/* Search Input */}
        <div className="relative mb-2.5">
          <Search className="w-4 h-4 text-[#9CA3AF] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search lead by name, project, phone..."
            className="w-full h-10 pl-9 pr-3 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl text-xs font-semibold text-[#111827] focus:outline-none focus:border-[#B8934A] focus:bg-white"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs">
          {[
            { id: 'all', label: 'All Ingested' },
            { id: 'gradeA', label: 'Grade A Hot Leads' },
            { id: 'meta', label: 'Meta Ads Influx' },
            { id: 'unassigned', label: 'Queue Pending' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as any)}
              className={`px-3 py-1 rounded-lg font-semibold text-[11px] whitespace-nowrap transition-all cursor-pointer ${
                filter === tab.id
                  ? 'bg-[#111827] text-white'
                  : 'bg-[#F3F4F6] text-[#4B5563] hover:bg-[#E5E7EB]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Agent Capacity Overview */}
        <div className="bg-white p-3.5 rounded-2xl border border-[#E5E7EB] shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold text-[#111827] flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-[#B8934A]" />
              <span>Field Agent Live Capacity</span>
            </h3>
            <span className="text-[10px] text-[#6B7280]">4 Agents Online</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {agentsList.map((ag) => (
              <div key={ag.employeeId} className="p-2 bg-[#F9FAFB] rounded-xl border border-[#E5E7EB] text-left">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#111827]">{ag.name.split(' ')[0]}</span>
                  <span className="text-[10px] font-mono font-bold text-[#B8934A]">{ag.capacity}</span>
                </div>
                <div className="text-[10px] text-[#6B7280]">{ag.activeLeads} active leads</div>
              </div>
            ))}
          </div>
        </div>

        {/* Leads List for Coordinator Routing */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs font-bold text-[#4B5563] px-1">
            <span>Dispatch Pipeline ({filteredLeads.length})</span>
            <span>Tap lead to view / re-route</span>
          </div>

          {filteredLeads.map((lead) => (
            <div
              key={lead.id}
              onClick={() => onSelectLead(lead)}
              className="bg-white p-3.5 rounded-2xl border border-[#E5E7EB] shadow-2xs hover:border-[#B8934A] transition-all cursor-pointer space-y-2 text-left"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-[#111827]">{lead.customerName}</span>
                    <span className="text-[10px] font-mono text-[#6B7280]">{lead.phone}</span>
                  </div>
                  <div className="text-[11px] text-[#4B5563] font-medium flex items-center gap-1 mt-0.5">
                    <Building2 className="w-3 h-3 text-[#B8934A]" />
                    <span>{lead.project}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <CategoryBadge category={lead.operationalCategory} />
                  <TemperatureBadge temperature={lead.temperature} />
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] pt-2 border-t border-[#F3F4F6]">
                <span className="text-[#6B7280]">
                  Assigned: <strong className="text-[#111827]">{lead.assignedAgent || 'Unassigned'}</strong>
                </span>
                <span className="text-[#B8934A] font-semibold flex items-center gap-0.5">
                  Inspect <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
