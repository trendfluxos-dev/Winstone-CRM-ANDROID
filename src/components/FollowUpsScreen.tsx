import React, { useState } from 'react';
import {
  CalendarClock,
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
  ListChecks,
  X,
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
    // Filter selection to items that are valid in the newly chosen tab
    setSelectedIds([]);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAll = () => {
    if (allActionableSelected) {
      // Deselect all in current tab
      const currentSet = new Set(actionableIds);
      setSelectedIds((prev) => prev.filter((id) => !currentSet.has(id)));
    } else {
      // Select all in current tab
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
    <div id="followups-screen" className="flex-1 flex flex-col bg-neutral-50 overflow-hidden relative">
      {/* Sub-Tabs Header */}
      <div className="bg-white p-3 border-b border-neutral-200 shadow-2xs shrink-0 space-y-2">
        <div className="grid grid-cols-4 gap-1 p-1 bg-neutral-100 rounded-xl">
          <button
            onClick={() => handleTabChange('today')}
            className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 ${
              activeTab === 'today'
                ? 'bg-white text-[#0D6E44] shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <span>Today</span>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1 rounded-full">
              {todayList.length}
            </span>
          </button>

          <button
            onClick={() => handleTabChange('overdue')}
            className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 ${
              activeTab === 'overdue'
                ? 'bg-white text-red-600 shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <span>Overdue</span>
            {overdueList.length > 0 && (
              <span className="text-[10px] bg-red-100 text-red-700 px-1 rounded-full">
                {overdueList.length}
              </span>
            )}
          </button>

          <button
            onClick={() => handleTabChange('upcoming')}
            className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 ${
              activeTab === 'upcoming'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <span>Upcoming</span>
            <span className="text-[10px] bg-blue-100 text-blue-800 px-1 rounded-full">
              {upcomingList.length}
            </span>
          </button>

          <button
            onClick={() => handleTabChange('completed')}
            className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 ${
              activeTab === 'completed'
                ? 'bg-white text-neutral-800 shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <span>Done</span>
            <span className="text-[10px] bg-neutral-200 text-neutral-700 px-1 rounded-full">
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
              className="flex items-center gap-1.5 text-neutral-700 hover:text-neutral-900 font-medium py-1 px-1.5 rounded-md hover:bg-neutral-100 transition-colors"
            >
              {allActionableSelected ? (
                <CheckSquare className="w-4 h-4 text-[#0D6E44]" />
              ) : selectedInCurrentTab.length > 0 ? (
                <div className="w-4 h-4 rounded border-2 border-[#0D6E44] bg-[#0D6E44]/10 flex items-center justify-center">
                  <div className="w-2 h-0.5 bg-[#0D6E44] rounded" />
                </div>
              ) : (
                <Square className="w-4 h-4 text-neutral-400" />
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
                    className="text-[11px] text-neutral-500 hover:text-neutral-800 px-1.5 py-0.5 rounded"
                  >
                    Clear
                  </button>
                  <button
                    id="batch-complete-btn"
                    onClick={handleBatchComplete}
                    className="flex items-center gap-1.5 bg-[#0D6E44] hover:bg-[#0A5735] text-white text-[11px] font-bold px-3 py-1.5 rounded-lg shadow-xs transition-all active:scale-95"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>Complete Selected ({selectedInCurrentTab.length})</span>
                  </button>
                </>
              ) : (
                <span className="text-[11px] text-neutral-400 font-medium">
                  Select to batch complete
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Follow-up List */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-3 pb-24">
        {currentList.length === 0 ? (
          <div className="bg-white rounded-xl p-8 border border-neutral-200 text-center space-y-2 mt-4">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
              <CheckCircle className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-neutral-800">No {activeTab} follow-ups</h4>
            <p className="text-xs text-neutral-500 max-w-xs mx-auto">
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
                className={`bg-white rounded-xl p-4 border transition-all space-y-3 ${
                  isSelected
                    ? 'border-[#0D6E44] ring-2 ring-[#0D6E44]/25 bg-emerald-50/20 shadow-xs'
                    : 'border-neutral-200/90 shadow-2xs hover:border-[#0D6E44]/40'
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
                        className="mt-0.5 shrink-0 focus:outline-none"
                        title={isSelected ? 'Deselect task' : 'Select for batch complete'}
                      >
                        {isSelected ? (
                          <div className="w-5 h-5 rounded-md bg-[#0D6E44] text-white flex items-center justify-center shadow-2xs transition-transform active:scale-90">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-md border-2 border-neutral-300 hover:border-[#0D6E44] bg-white transition-colors" />
                        )}
                      </button>
                    ) : (
                      <div className="mt-0.5 shrink-0">
                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                      </div>
                    )}

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-neutral-900 truncate">
                          {item.customerName}
                        </h4>
                        <span className="text-[10px] font-mono text-neutral-500 bg-neutral-100 px-1.5 py-0.5 rounded">
                          {item.phone}
                        </span>
                      </div>
                      <p className="text-xs text-[#0D6E44] font-semibold mt-0.5 truncate">
                        {item.project}
                      </p>
                    </div>
                  </div>

                  {/* Call Button */}
                  {matchedLead && !isDone && (
                    <button
                      onClick={() => onStartCall(matchedLead)}
                      className="flex items-center gap-1 bg-[#0D6E44] hover:bg-[#0A5735] text-white px-2.5 py-1.5 rounded-lg text-xs font-bold shadow-xs transition-all shrink-0"
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                      <span>Call</span>
                    </button>
                  )}
                </div>

                {/* Date, Time & Priority */}
                <div className="flex items-center gap-2 text-xs flex-wrap pl-7">
                  <span className="flex items-center gap-1 font-semibold text-neutral-700 bg-neutral-100 px-2 py-0.5 rounded">
                    <Calendar className="w-3.5 h-3.5 text-neutral-500" />
                    {item.date}
                  </span>
                  <span className="flex items-center gap-1 font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    <Clock className="w-3.5 h-3.5 text-emerald-600" />
                    {item.time}
                  </span>
                  {item.status === 'overdue' && (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-red-700 bg-red-50 px-1.5 py-0.5 rounded border border-red-200">
                      <AlertTriangle className="w-3 h-3" /> Overdue
                    </span>
                  )}
                  {isDone && (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                      <Check className="w-3 h-3" /> Done
                    </span>
                  )}
                </div>

                {/* Reason */}
                <div className="text-xs text-neutral-700 bg-neutral-50 p-2.5 rounded-lg border border-neutral-100 ml-7">
                  <span className="font-semibold text-neutral-900 block mb-0.5">Objective:</span>
                  <p>{item.reason}</p>
                </div>

                {/* Inline Reschedule Form if toggled */}
                {isRescheduling && (
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 space-y-2 text-xs animate-in fade-in duration-150 ml-7">
                    <span className="font-bold text-amber-900 block">Reschedule Follow-up</span>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-amber-800 block">New Date</label>
                        <input
                          type="date"
                          value={newRescheduleDate}
                          onChange={(e) => setNewRescheduleDate(e.target.value)}
                          className="w-full bg-white border border-amber-300 rounded p-1.5 text-xs text-neutral-900"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-amber-800 block">New Time</label>
                        <input
                          type="text"
                          value={newRescheduleTime}
                          onChange={(e) => setNewRescheduleTime(e.target.value)}
                          className="w-full bg-white border border-amber-300 rounded p-1.5 text-xs text-neutral-900"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        onClick={() => setReschedulingId(null)}
                        className="px-2.5 py-1 text-[11px] text-neutral-600 hover:text-neutral-900"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleSaveReschedule(item.id)}
                        className="px-3 py-1 bg-amber-700 text-white rounded text-[11px] font-bold"
                      >
                        Confirm Reschedule
                      </button>
                    </div>
                  </div>
                )}

                {/* Action Row */}
                <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-xs ml-7">
                  {matchedLead ? (
                    <button
                      onClick={() => onOpenLead(matchedLead)}
                      className="text-[#0D6E44] font-semibold hover:underline flex items-center gap-1 text-[11px]"
                    >
                      <span>Open Lead Record</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  ) : (
                    <span />
                  )}

                  {!isDone && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setReschedulingId(isRescheduling ? null : item.id)}
                        className="text-neutral-600 hover:text-neutral-900 text-[11px] font-medium flex items-center gap-1 px-2 py-1 rounded hover:bg-neutral-100 transition-colors"
                      >
                        <RotateCcw className="w-3 h-3 text-neutral-500" />
                        <span>Reschedule</span>
                      </button>

                      <button
                        onClick={() => onCompleteFollowUp(item.id)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors"
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
        <div className="absolute bottom-3 inset-x-3 z-30 bg-neutral-900 text-white p-2.5 px-3 rounded-xl shadow-xl border border-neutral-700 flex items-center justify-between animate-in fade-in slide-in-from-bottom-2 duration-150">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center justify-center border border-emerald-500/40">
              {selectedInCurrentTab.length}
            </span>
            <span className="text-xs font-semibold">
              {selectedInCurrentTab.length} selected
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedIds([])}
              className="text-neutral-400 hover:text-white text-xs px-2 py-1 font-medium"
            >
              Cancel
            </button>
            <button
              id="floating-batch-complete-btn"
              onClick={handleBatchComplete}
              className="flex items-center gap-1.5 bg-[#0D6E44] hover:bg-[#0A5735] text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-xs transition-all active:scale-95"
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
