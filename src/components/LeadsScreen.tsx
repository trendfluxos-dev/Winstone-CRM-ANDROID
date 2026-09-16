import React, { useState, useMemo } from 'react';
import { Search, PhoneCall, Filter, ChevronRight, X, User, Sparkles, UserPlus } from 'lucide-react';
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
    <div id="leads-screen" className="flex-1 flex flex-col bg-neutral-50 overflow-hidden">
      {/* Search & Filter Header */}
      <div className="bg-white p-3.5 border-b border-neutral-200/90 shadow-2xs space-y-2.5 shrink-0">
        {/* Search Bar & Ingest Lead Action */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="leads-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search leads by name, phone, project..."
              className="w-full bg-neutral-100 hover:bg-neutral-100/80 focus:bg-white text-xs pl-9 pr-8 py-2 rounded-lg border border-neutral-200 focus:border-[#0D6E44] focus:ring-1 focus:ring-[#0D6E44] focus:outline-none transition-all placeholder:text-neutral-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          {onOpenAddNewLead && (
            <button
              id="add-lead-btn"
              onClick={onOpenAddNewLead}
              className="bg-[#0D6E44] hover:bg-[#0A5736] text-white px-2.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1 shrink-0 transition-colors shadow-2xs"
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
                className={`px-3 py-1 text-xs font-semibold rounded-full whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-[#0D6E44] text-white shadow-xs'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>

        {/* Operational Category Filter Row (A, B, C, D) */}
        <div className="flex items-center justify-between text-[11px] pt-1 border-t border-neutral-100">
          <span className="text-neutral-500 font-medium flex items-center gap-1">
            <Filter className="w-3 h-3 text-neutral-400" />
            Category:
          </span>
          <div className="flex items-center gap-1">
            {(['All', 'A', 'B', 'C', 'D'] as const).map((cat) => {
              const isSelected = categoryFilter === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors ${
                    isSelected
                      ? 'bg-neutral-900 text-white'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
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
      <div className="flex-1 overflow-y-auto p-3.5 space-y-3 pb-24">
        <div className="flex items-center justify-between text-xs text-neutral-500 px-0.5">
          <span>Showing <strong>{filteredLeads.length}</strong> of {leads.length} leads</span>
          {(activeFilter !== 'All' || categoryFilter !== 'All' || searchQuery) && (
            <button
              onClick={() => {
                setActiveFilter('All');
                setCategoryFilter('All');
                setSearchQuery('');
              }}
              className="text-[#0D6E44] font-semibold hover:underline text-[11px]"
            >
              Reset Filters
            </button>
          )}
        </div>

        {filteredLeads.length === 0 ? (
          <div className="bg-white rounded-xl p-8 border border-neutral-200 text-center space-y-2 mt-4">
            <div className="w-12 h-12 rounded-full bg-neutral-100 text-neutral-400 mx-auto flex items-center justify-center">
              <User className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-neutral-800">No matching leads found</h4>
            <p className="text-xs text-neutral-500 max-w-xs mx-auto">
              Try modifying your search keywords or clearing active filters to see all assigned prospects.
            </p>
          </div>
        ) : (
          filteredLeads.map((lead) => (
            <div
              key={lead.id}
              id={`lead-card-${lead.id}`}
              onClick={() => onSelectLead(lead)}
              className="bg-white rounded-xl p-3.5 border border-neutral-200/90 shadow-2xs hover:border-[#0D6E44]/50 hover:shadow-xs transition-all cursor-pointer group"
            >
              {/* Card Header: Customer name, phone & Status */}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-neutral-900 group-hover:text-[#0D6E44] transition-colors truncate">
                      {lead.customerName}
                    </h4>
                    <StatusBadge status={lead.status} size="sm" />
                  </div>
                  <div className="text-xs text-neutral-500 font-mono mt-0.5">
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
                  className="flex items-center gap-1 bg-[#0D6E44] hover:bg-[#0A5735] active:scale-95 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-xs transition-all shrink-0"
                  title="Call Lead"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>Call</span>
                </button>
              </div>

              {/* Project & Source */}
              <div className="mt-2 text-xs">
                <span className="font-semibold text-neutral-800 block truncate">
                  {lead.project}
                </span>
                <span className="text-[11px] text-neutral-500 block truncate mt-0.5">
                  Source: {lead.source} {lead.campaign ? `• ${lead.campaign}` : ''}
                </span>
              </div>

              {/* Badges: Temperature vs Category */}
              <div className="mt-2.5 flex items-center gap-2 flex-wrap">
                <TemperatureBadge temperature={lead.temperature} size="sm" />
                <CategoryBadge category={lead.operationalCategory} size="sm" />
                <span className="text-[10px] text-neutral-400 bg-neutral-100 px-1.5 py-0.5 rounded">
                  Agent: {lead.assignedAgent}
                </span>
              </div>

              {/* Card Footer: Last contact & Next Followup */}
              <div className="mt-3 pt-2 border-t border-neutral-100 flex items-center justify-between text-[11px] text-neutral-500">
                <span>Last contact: <strong className="text-neutral-700">{lead.lastContact}</strong></span>
                <div className="flex items-center gap-1 text-[#0D6E44] font-medium group-hover:translate-x-0.5 transition-transform">
                  <span>View Details</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
