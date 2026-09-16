import React, { useState } from 'react';
import {
  CheckCircle,
  Clock,
  AlertTriangle,
  Calendar,
  PhoneCall,
  ChevronRight,
  RotateCcw,
  Check,
  CheckCheck,
  CheckSquare,
  Square,
} from 'lucide-react';
import { FollowUp, Lead } from '../types';

interface FollowUpsScreenProps {
  followUps: FollowUp[];
  leads: Lead[];
  onCompleteFollowUp: (id: string) => void;
  onBatchCompleteFollowUps?: (ids: string[]) => void;
  onRescheduleFollowUp: (id: string, newDate: string, newTime: string) => void;
  onOpenLead: (lead: Lead) => void;
  onStartCall: (lead: Lead) => void;
}

type FollowUpTab = 'today' | 'overdue' | 'upcoming' | 'completed';

export const FollowUpsScreen: React.FC<FollowUpsScreenProps> = ({
  followUps,
  leads,
  onCompleteFollowUp,
  onBatchCompleteFollowUps,
  onRescheduleFollowUp,
  onOpenLead,
  onStartCall,
}) => {
  const [activeTab, setActiveTab] = useState<FollowUpTab>('today');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [reschedulingId, setReschedulingId] = useState<string | null>(null);
  const [newRescheduleDate, setNewRescheduleDate] = useState('2026-09-16');
  const [newRescheduleTime, setNewRescheduleTime] = useState('11:00 AM');

  // Categorize
  const todayList = followUps.filter((f) => f.date === '2026-09-15' && f.status === 'pending');
  const overdueList = followUps.filter((f) => f.status === 'overdue' || (f.date < '2026-09-15' && f.status === 'pending'));
  const upcomingList = followUps.filter((f) => f.date > '2026-09-15' && f.status === 'pending');
  const completedList = followUps.filter((f) => f.status === 'completed');

  const getListForTab = () => {
    switch (activeTab) {
      case 'today':
        return todayList;
      case 'overdue':
        return overdueList;
      case 'upcoming':
        return upcomingList;
      case 'completed':
        return completedList;
    }
  };

  const currentList = getListForTab();
  const actionableItems = currentList.filter((f) => f.status !== 'completed');
  const actionableIds = actionableItems.map((f) => f.id);
  const selectedInCurrentTab = selectedIds.filter((id) => actionableIds.includes(id));
  const allActionableSelected =
    actionableItems.length > 0 && selectedInCurrentTab.length === actionableItems.length;

  const handleTabChange = (tab: FollowUpTab) => {
    setActiveTab(tab);
    setReschedulingId(null);
    setSelectedIds([]);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAll = () => {
    if (allActionableSelected) {
      const currentSet = new Set(actionableIds);
      setSelectedIds((prev) => prev.filter((id) => !currentSet.has(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...actionableIds])));
    }
  };

  const handleBatchComplete = () => {
    if (selectedIds.length === 0) return;
    if (onBatchCompleteFollowUps) {
      onBatchCompleteFollowUps(selectedIds);
    } else {
      selectedIds.forEach((id) => onCompleteFollowUp(id));
    }
    setSelectedIds([]);
  };

  const handleSaveReschedule = (id: string) => {
    onRescheduleFollowUp(id, newRescheduleDate, newRescheduleTime);
    setReschedulingId(null);
  };

  return (
    <div id="followups-screen" className="flex-1 flex flex-col bg-[#F8F9FA] text-[#0F172A] overflow-hidden relative">
      {/* Sub-Tabs Header */}
      <div className="bg-white p-3 border-b border-[#E5E7EB] shadow-2xs shrink-0 space-y-2">
        <div className="grid grid-cols-4 gap-1 p-1 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
          <button
            onClick={() => handleTabChange('today')}
            className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
              activeTab === 'today'
                ? 'bg-[#FAF6EE] text-[#8C6B24] border border-[#E8DFCF] shadow-2xs'
                : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            <span>Today</span>
            <span className="text-[10px] bg-[#FAF6EE] text-[#8C6B24] border border-[#E8DFCF] px-1 rounded-full">
              {todayList.length}
            </span>
          </button>

          <button
            onClick={() => handleTabChange('overdue')}
            className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
              activeTab === 'overdue'
                ? 'bg-rose-50 text-rose-700 border border-rose-200 shadow-2xs'
                : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            <span>Overdue</span>
            {overdueList.length > 0 && (
              <span className="text-[10px] bg-rose-100 text-rose-800 px-1 rounded-full font-bold">
                {overdueList.length}
              </span>
            )}
          </button>

          <button
            onClick={() => handleTabChange('upcoming')}
            className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
              activeTab === 'upcoming'
                ? 'bg-[#FAF6EE] text-[#8C6B24] border border-[#E8DFCF] shadow-2xs'
                : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            <span>Upcoming</span>
            <span className="text-[10px] bg-[#F1F5F9] text-[#475569] px-1 rounded-full">
              {upcomingList.length}
            </span>
          </button>

          <button
            onClick={() => handleTabChange('completed')}
            className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
              activeTab === 'completed'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs'
                : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            <span>Done</span>
            <span className="text-[10px] bg-[#F1F5F9] text-[#475569] px-1 rounded-full">
              {completedList.length}
            </span>
          </button>
        </div>

        {/* Batch Action Toolbar */}
        {actionableItems.length > 0 && activeTab !== 'completed' && (
          <div className="flex items-center justify-between pt-1 px-1 text-xs">
            {/* Select All Toggle */}
            <button
              id="followup-select-all-btn"
              onClick={handleToggleSelectAll}
              className="flex items-center gap-1.5 text-[#8C6B24] hover:text-[#0F172A] font-medium py-1 px-1.5 rounded-lg hover:bg-[#F8FAFC] transition-colors cursor-pointer"
            >
              {allActionableSelected ? (
                <CheckSquare className="w-4 h-4 text-[#B8934A]" />
              ) : selectedInCurrentTab.length > 0 ? (
                <div className="w-4 h-4 rounded border-2 border-[#B8934A] bg-[#FAF6EE] flex items-center justify-center">
                  <div className="w-2 h-0.5 bg-[#B8934A] rounded" />
                </div>
              ) : (
                <Square className="w-4 h-4 text-[#94A3B8]" />
              )}
              <span className="text-[11px]">
                {allActionableSelected
                  ? 'Deselect All'
                  : `Select All (${actionableItems.length})`}
              </span>
            </button>

            {/* Batch Complete Trigger / Info */}
            <div className="flex items-center gap-2">
              {selectedInCurrentTab.length > 0 ? (
                <>
                  <button
                    onClick={() => setSelectedIds([])}
                    className="text-[11px] text-[#64748B] hover:text-[#0F172A] px-1.5 py-0.5 rounded cursor-pointer"
                  >
                    Clear
                  </button>
                  <button
                    id="batch-complete-btn"
                    onClick={handleBatchComplete}
                    className="flex items-center gap-1.5 bg-[#B8934A] hover:bg-[#A68035] text-white text-[11px] font-bold px-3 py-1.5 rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>Complete Selected ({selectedInCurrentTab.length})</span>
                  </button>
                </>
              ) : (
                <span className="text-[11px] text-[#64748B] font-medium">
                  Select to batch complete
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Follow-up List */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-3 pb-24 custom-scrollbar">
        {currentList.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 border border-[#E5E7EB] text-center space-y-2 mt-4 shadow-xs">
            <div className="w-12 h-12 rounded-xl bg-[#FAF6EE] text-[#8C6B24] border border-[#E8DFCF] mx-auto flex items-center justify-center shadow-2xs">
              <CheckCircle className="w-6 h-6 text-[#B8934A]" />
            </div>
            <h4 className="text-sm font-bold text-[#0F172A]">No {activeTab} follow-ups</h4>
            <p className="text-xs text-[#64748B] max-w-xs mx-auto">
              {activeTab === 'today'
                ? 'Great job! All scheduled calls for today have been completed.'
                : `You currently have no tasks in the ${activeTab} queue.`}
            </p>
          </div>
        ) : (
          currentList.map((item) => {
            const matchedLead = leads.find((l) => l.id === item.leadId);
            const isRescheduling = reschedulingId === item.id;
            const isSelected = selectedIds.includes(item.id);
            const isDone = item.status === 'completed';

            return (
              <div
                key={item.id}
                id={`followup-card-${item.id}`}
                className={`bg-white rounded-2xl p-4 border transition-all space-y-3 ${
                  isSelected
                    ? 'border-[#B8934A] ring-2 ring-[#B8934A]/20 bg-[#FAFBFD] shadow-md'
                    : 'border-[#E5E7EB] shadow-xs hover:border-[#CBD5E1]'
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5 min-w-0">
                    {/* Batch Selection Checkbox */}
                    {!isDone ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSelect(item.id);
                        }}
                        className="mt-0.5 shrink-0 focus:outline-none cursor-pointer"
                        title={isSelected ? 'Deselect task' : 'Select for batch complete'}
                      >
                        {isSelected ? (
                          <div className="w-5 h-5 rounded-md bg-[#B8934A] text-white flex items-center justify-center shadow-xs transition-transform active:scale-90 font-bold">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-md border-2 border-[#CBD5E1] hover:border-[#B8934A] bg-white transition-colors" />
                        )}
                      </button>
                    ) : (
                      <div className="mt-0.5 shrink-0">
                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                      </div>
                    )}

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-[#0F172A] truncate">
                          {item.customerName}
                        </h4>
                        <span className="text-[10px] font-mono text-[#64748B] bg-[#F8FAFC] px-1.5 py-0.5 rounded border border-[#E2E8F0]">
                          {item.phone}
                        </span>
                      </div>
                      <p className="text-xs text-[#8C6B24] font-semibold mt-0.5 truncate">
                        {item.project}
                      </p>
                    </div>
                  </div>

                  {/* Call Button */}
                  {matchedLead && !isDone && (
                    <button
                      onClick={() => onStartCall(matchedLead)}
                      className="flex items-center gap-1 bg-[#B8934A] hover:bg-[#A68035] text-white px-2.5 py-1.5 rounded-xl text-xs font-bold shadow-2xs transition-all shrink-0 cursor-pointer active:scale-95"
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                      <span>Call</span>
                    </button>
                  )}
                </div>

                {/* Date, Time & Priority */}
                <div className="flex items-center gap-2 text-xs flex-wrap pl-7">
                  <span className="flex items-center gap-1 font-semibold text-[#475569] bg-[#F8FAFC] px-2 py-0.5 rounded-lg border border-[#E2E8F0]">
                    <Calendar className="w-3.5 h-3.5 text-[#94A3B8]" />
                    {item.date}
                  </span>
                  <span className="flex items-center gap-1 font-semibold text-[#8C6B24] bg-[#FAF6EE] px-2 py-0.5 rounded-lg border border-[#E8DFCF]">
                    <Clock className="w-3.5 h-3.5 text-[#B8934A]" />
                    {item.time}
                  </span>
                  {item.status === 'overdue' && (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded-lg border border-rose-200">
                      <AlertTriangle className="w-3 h-3 text-rose-600" /> Overdue
                    </span>
                  )}
                  {isDone && (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded-lg border border-emerald-200">
                      <Check className="w-3 h-3 text-emerald-600" /> Done
                    </span>
                  )}
                </div>

                {/* Reason */}
                <div className="text-xs text-[#334155] bg-[#F8FAFC] p-3 rounded-xl border border-[#E2E8F0] ml-7">
                  <span className="font-semibold text-[#0F172A] block mb-0.5">Objective:</span>
                  <p>{item.reason}</p>
                </div>

                {/* Inline Reschedule Form if toggled */}
                {isRescheduling && (
                  <div className="p-3.5 bg-[#FAF9F6] rounded-xl border border-[#E8DFCF] space-y-2.5 text-xs animate-in fade-in duration-150 ml-7">
                    <span className="font-bold text-[#8C6B24] block">Reschedule Follow-up</span>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-[#64748B] block mb-1 font-medium">New Date</label>
                        <input
                          type="date"
                          value={newRescheduleDate}
                          onChange={(e) => setNewRescheduleDate(e.target.value)}
                          className="w-full bg-white border border-[#CBD5E1] rounded-lg p-2 text-xs text-[#0F172A] focus:outline-none focus:border-[#B8934A]"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-[#64748B] block mb-1 font-medium">New Time</label>
                        <input
                          type="text"
                          value={newRescheduleTime}
                          onChange={(e) => setNewRescheduleTime(e.target.value)}
                          className="w-full bg-white border border-[#CBD5E1] rounded-lg p-2 text-xs text-[#0F172A] focus:outline-none focus:border-[#B8934A]"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        onClick={() => setReschedulingId(null)}
                        className="px-3 py-1.5 text-[11px] text-[#64748B] hover:text-[#0F172A] cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleSaveReschedule(item.id)}
                        className="px-3.5 py-1.5 bg-[#B8934A] hover:bg-[#A68035] text-white rounded-lg text-[11px] font-bold cursor-pointer shadow-xs"
                      >
                        Confirm Reschedule
                      </button>
                    </div>
                  </div>
                )}

                {/* Action Row */}
                <div className="pt-2 border-t border-[#F1F5F9] flex items-center justify-between text-xs ml-7">
                  {matchedLead ? (
                    <button
                      onClick={() => onOpenLead(matchedLead)}
                      className="text-[#8C6B24] font-semibold hover:underline flex items-center gap-1 text-[11px] cursor-pointer"
                    >
                      <span>Open Lead Record</span>
                      <ChevronRight className="w-3 h-3 text-[#B8934A]" />
                    </button>
                  ) : (
                    <span />
                  )}

                  {!isDone && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setReschedulingId(isRescheduling ? null : item.id)}
                        className="text-[#64748B] hover:text-[#0F172A] text-[11px] font-medium flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-[#F8FAFC] transition-colors cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3 text-[#B8934A]" />
                        <span>Reschedule</span>
                      </button>

                      <button
                        onClick={() => onCompleteFollowUp(item.id)}
                        className="bg-[#B8934A] hover:bg-[#A68035] text-white text-[11px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors cursor-pointer shadow-xs"
                      >
                        <Check className="w-3 h-3" />
                        <span>Mark Done</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Floating Bottom Quick-Action Bar when items are selected */}
      {selectedInCurrentTab.length > 0 && (
        <div className="absolute bottom-3 inset-x-3 z-30 bg-white text-[#0F172A] p-3 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-[#E5E7EB] flex items-center justify-between animate-in fade-in slide-in-from-bottom-2 duration-150">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-[#FAF6EE] text-[#8C6B24] font-bold text-xs flex items-center justify-center border border-[#E8DFCF]">
              {selectedInCurrentTab.length}
            </span>
            <span className="text-xs font-semibold text-[#0F172A]">
              {selectedInCurrentTab.length} selected
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedIds([])}
              className="text-[#64748B] hover:text-[#0F172A] text-xs px-2 py-1 font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              id="floating-batch-complete-btn"
              onClick={handleBatchComplete}
              className="flex items-center gap-1.5 bg-[#B8934A] hover:bg-[#A68035] text-white text-xs font-bold px-3.5 py-1.5 rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
            >
              <CheckCheck className="w-4 h-4" />
              <span>Complete All ({selectedInCurrentTab.length})</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
