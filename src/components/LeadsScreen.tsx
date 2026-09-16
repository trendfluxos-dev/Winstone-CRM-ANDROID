import React, { useState, useMemo } from 'react';
import { Search, PhoneCall, Filter, ChevronRight, X, User, UserPlus } from 'lucide-react';
import { Lead, LeadTemperature, OperationalCategory } from '../types';
import { TemperatureBadge, CategoryBadge, StatusBadge } from './Badges';

interface LeadsScreenProps {
  leads: Lead[];
  onSelectLead: (lead: Lead) => void;
  onStartCall: (lead: Lead) => void;
  onOpenAddNewLead?: () => void;
}

type MainFilter = 'All' | 'New' | 'Hot' | 'Warm' | 'Cold' | 'Follow-up' | 'Site Visit';

export const LeadsScreen: React.FC<LeadsScreenProps> = ({
  leads,
  onSelectLead,
  onStartCall,
  onOpenAddNewLead,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<MainFilter>('All');
  const [categoryFilter, setCategoryFilter] = useState<OperationalCategory | 'All'>('All');

  const filterTabs: MainFilter[] = ['All', 'New', 'Hot', 'Warm', 'Cold', 'Follow-up', 'Site Visit'];

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      // 1. Search Query
      const query = searchQuery.trim().toLowerCase();
      if (query) {
        const matchesName = lead.customerName.toLowerCase().includes(query);
        const matchesPhone = lead.phone.toLowerCase().includes(query);
        const matchesProject = lead.project.toLowerCase().includes(query);
        const matchesNotes = lead.notes.some((n) => n.toLowerCase().includes(query));
        if (!matchesName && !matchesPhone && !matchesProject && !matchesNotes) {
          return false;
        }
      }

      // 2. Main Filter
      if (activeFilter !== 'All') {
        if (activeFilter === 'Hot' || activeFilter === 'Warm' || activeFilter === 'Cold') {
          if (lead.temperature !== activeFilter) return false;
        } else if (activeFilter === 'New') {
          if (lead.status !== 'New') return false;
        } else if (activeFilter === 'Follow-up') {
          if (lead.status !== 'Follow-up') return false;
        } else if (activeFilter === 'Site Visit') {
          if (lead.status !== 'Site Visit') return false;
        }
      }

      // 3. Operational Category Filter
      if (categoryFilter !== 'All') {
        if (lead.operationalCategory !== categoryFilter) return false;
      }

      return true;
    });
  }, [leads, searchQuery, activeFilter, categoryFilter]);

  return (
    <div id="leads-screen" className="flex-1 flex flex-col bg-[#F8F9FA] text-[#0F172A] overflow-hidden">
      {/* Search & Filter Header */}
      <div className="bg-white p-3.5 border-b border-[#E5E7EB] shadow-2xs space-y-2.5 shrink-0">
        {/* Search Bar & Ingest Lead Action */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="leads-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search leads by name, phone, project..."
              className="w-full bg-[#F8FAFC] hover:bg-white focus:bg-white text-xs text-[#0F172A] pl-9 pr-8 py-2 rounded-xl border border-[#E2E8F0] focus:border-[#B8934A] focus:ring-1 focus:ring-[#B8934A] focus:outline-none transition-all placeholder:text-[#94A3B8]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#0F172A] p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          {onOpenAddNewLead && (
            <button
              id="add-lead-btn"
              onClick={onOpenAddNewLead}
              className="bg-[#B8934A] hover:bg-[#A68035] text-white px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 transition-colors shadow-xs cursor-pointer active:scale-95"
              title="Add & Ingest New Lead to CRM"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">+ Ingest</span>
            </button>
          )}
        </div>

        {/* Primary Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {filterTabs.map((tab) => {
            const isActive = activeFilter === tab;
            return (
              <button
                key={tab}
                id={`filter-${tab.toLowerCase().replace(/\s+/g, '-')}`}
                onClick={() => setActiveFilter(tab)}
                className={`px-3 py-1 text-xs font-semibold rounded-full whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#B8934A] text-white shadow-2xs'
                    : 'bg-[#F1F5F9] text-[#475569] border border-transparent hover:border-[#CBD5E1] hover:text-[#0F172A]'
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>

        {/* Operational Category Filter Row (A, B, C, D) */}
        <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-[#F1F5F9]">
          <span className="text-[#64748B] font-medium flex items-center gap-1">
            <Filter className="w-3 h-3 text-[#B8934A]" />
            Category:
          </span>
          <div className="flex items-center gap-1">
            {(['All', 'A', 'B', 'C', 'D'] as const).map((cat) => {
              const isSelected = categoryFilter === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-2.5 py-0.5 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-[#FAF6EE] text-[#8C6B24] border border-[#E8DFCF]'
                      : 'bg-[#F8FAFC] text-[#64748B] border border-[#E2E8F0] hover:text-[#0F172A]'
                  }`}
                >
                  {cat === 'All' ? 'All' : `Cat ${cat}`}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Leads List Section */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-3 pb-24 custom-scrollbar">
        <div className="flex items-center justify-between text-xs text-[#64748B] px-0.5">
          <span>Showing <strong className="text-[#0F172A]">{filteredLeads.length}</strong> of {leads.length} leads</span>
          {(activeFilter !== 'All' || categoryFilter !== 'All' || searchQuery) && (
            <button
              onClick={() => {
                setActiveFilter('All');
                setCategoryFilter('All');
                setSearchQuery('');
              }}
              className="text-[#8C6B24] font-semibold hover:underline text-[11px] cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>

        {filteredLeads.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 border border-[#E5E7EB] text-center space-y-2 mt-4 shadow-xs">
            <div className="w-12 h-12 rounded-full bg-[#F8FAFC] border border-[#E2E8F0] text-[#64748B] mx-auto flex items-center justify-center">
              <User className="w-6 h-6 text-[#94A3B8]" />
            </div>
            <h4 className="text-sm font-bold text-[#0F172A]">No matching leads found</h4>
            <p className="text-xs text-[#64748B] max-w-xs mx-auto">
              Try modifying your search keywords or clearing active filters to see all assigned prospects.
            </p>
          </div>
        ) : (
          filteredLeads.map((lead) => (
            <div
              key={lead.id}
              id={`lead-card-${lead.id}`}
              onClick={() => onSelectLead(lead)}
              className="bg-white rounded-xl p-3.5 border border-[#E5E7EB] shadow-xs hover:border-[#B8934A] hover:shadow-md transition-all cursor-pointer group"
            >
              {/* Card Header: Customer name, phone & Status */}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-[#0F172A] group-hover:text-[#8C6B24] transition-colors truncate">
                      {lead.customerName}
                    </h4>
                    <StatusBadge status={lead.status} size="sm" />
                  </div>
                  <div className="text-xs text-[#64748B] font-mono mt-0.5">
                    {lead.phone}
                  </div>
                </div>

                {/* Call Button */}
                <button
                  id={`leads-call-${lead.id}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onStartCall(lead);
                  }}
                  className="flex items-center gap-1 bg-[#B8934A] hover:bg-[#A68035] active:scale-95 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-2xs transition-all shrink-0 cursor-pointer"
                  title="Call Lead"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>Call</span>
                </button>
              </div>

              {/* Project & Source */}
              <div className="mt-2 text-xs">
                <span className="font-semibold text-[#1E293B] block truncate">
                  {lead.project}
                </span>
                <span className="text-[11px] text-[#64748B] block truncate mt-0.5">
                  Source: {lead.source} {lead.campaign ? `• ${lead.campaign}` : ''}
                </span>
              </div>

              {/* Badges: Temperature vs Category */}
              <div className="mt-2.5 flex items-center gap-2 flex-wrap">
                <TemperatureBadge temperature={lead.temperature} size="sm" />
                <CategoryBadge category={lead.operationalCategory} size="sm" />
                <span className="text-[10px] text-[#64748B] bg-[#F8FAFC] border border-[#E2E8F0] px-1.5 py-0.5 rounded font-mono">
                  Agent: {lead.assignedAgent}
                </span>
              </div>

              {/* Card Footer: Last contact & Next Followup */}
              <div className="mt-3 pt-2 border-t border-[#F1F5F9] flex items-center justify-between text-[11px] text-[#64748B]">
                <span>Last contact: <strong className="text-[#334155]">{lead.lastContact}</strong></span>
                <div className="flex items-center gap-1 text-[#8C6B24] font-medium group-hover:translate-x-0.5 transition-transform">
                  <span>View Details</span>
                  <ChevronRight className="w-3.5 h-3.5 text-[#B8934A]" />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
