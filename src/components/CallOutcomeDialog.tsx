import React, { useState } from 'react';
import {
  CheckCircle2,
  Calendar,
  Clock,
  X,
  FileText,
  AlertCircle,
  Flame,
  Sun,
  Snowflake,
  Sparkles,
  Bot,
  ShieldCheck,
} from 'lucide-react';
import {
  Lead,
  CallOutcome,
  LeadTemperature,
  OperationalCategory,
  SubmitReportPayload,
} from '../types';

interface CallOutcomeDialogProps {
  lead: Lead;
  durationSeconds: number;
  reportId?: string;
  initialNotes?: string;
  onSave: (payload: {
    outcome: CallOutcome;
    temperature: LeadTemperature;
    category: OperationalCategory;
    notes: string;
    summary: string;
    reason: string;
    nextFollowUpDate?: string;
    nextFollowUpTime?: string;
    followUpReason?: string;
    reminderMinutes?: number;
    grade: 'A' | 'B' | 'C' | 'D';
    aiDecision: 'accepted' | 'edited' | 'rejected';
  }) => void;
  onDiscard: () => void;
}

export const CallOutcomeDialog: React.FC<CallOutcomeDialogProps> = ({
  lead,
  durationSeconds,
  reportId,
  initialNotes = '',
  onSave,
  onDiscard,
}) => {
  const [outcome, setOutcome] = useState<CallOutcome>('Interested');
  const [temperature, setTemperature] = useState<LeadTemperature>(lead.temperature);
  const [category, setCategory] = useState<OperationalCategory>(lead.operationalCategory);
  const [grade, setGrade] = useState<'A' | 'B' | 'C' | 'D'>(
    lead.operationalCategory === 'A' ? 'A' : lead.operationalCategory === 'B' ? 'B' : lead.operationalCategory === 'C' ? 'C' : 'D'
  );
  const [summary, setSummary] = useState(
    durationSeconds > 0
      ? `Phone consultation with ${lead.customerName} regarding ${lead.project}. Discussed project specs and budget.`
      : `Unanswered call attempt to ${lead.customerName}.`
  );
  const [notes, setNotes] = useState(initialNotes);
  const [reason, setReason] = useState('Client actively reviewing property options');
  const [reminderMinutes, setReminderMinutes] = useState<number>(15);
  const [aiDecision, setAiDecision] = useState<'accepted' | 'edited' | 'rejected'>('edited');

  // Optional Follow-up
  const [enableFollowUp, setEnableFollowUp] = useState(outcome === 'Call back later' || outcome === 'Interested');
  const [followUpDate, setFollowUpDate] = useState('2026-09-16');
  const [followUpTime, setFollowUpTime] = useState('11:00 AM');
  const [followUpReason, setFollowUpReason] = useState('Follow-up call to review project drawings');

  const outcomesList: { id: CallOutcome; label: string; color: string }[] = [
    { id: 'Interested', label: 'Interested', color: 'bg-emerald-600 text-white' },
    { id: 'Call back later', label: 'Call back later', color: 'bg-blue-600 text-white' },
    { id: 'Not interested', label: 'Not interested', color: 'bg-neutral-600 text-white' },
    { id: 'No answer', label: 'No answer', color: 'bg-amber-600 text-white' },
    { id: 'Wrong number', label: 'Wrong number', color: 'bg-red-600 text-white' },
  ];

  const handleOutcomeChange = (newOutcome: CallOutcome) => {
    setOutcome(newOutcome);
    if (newOutcome === 'Call back later') {
      setEnableFollowUp(true);
      setGrade('B');
    } else if (newOutcome === 'Not interested' || newOutcome === 'Wrong number') {
      setTemperature('Cold');
      setCategory('D');
      setGrade('D');
      setReason('Client explicitly declined or wrong contact number');
    } else if (newOutcome === 'Interested') {
      setTemperature('Hot');
      setCategory('A');
      setGrade('A');
      setReason('High commercial intent demonstrated during call');
    }
  };

  const handleQuickFollowUp = (daysAhead: number, label: string) => {
    const d = new Date('2026-09-15');
    d.setDate(d.getDate() + daysAhead);
    const dateStr = d.toISOString().split('T')[0];
    setFollowUpDate(dateStr);
    setFollowUpReason(label);
    setEnableFollowUp(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      outcome,
      temperature,
      category,
      grade,
      summary: summary.trim(),
      notes: notes.trim(),
      reason: reason.trim(),
      reminderMinutes,
      aiDecision,
      nextFollowUpDate: enableFollowUp ? followUpDate : undefined,
      nextFollowUpTime: enableFollowUp ? followUpTime : undefined,
      followUpReason: enableFollowUp ? followUpReason : undefined,
    });
  };

  return (
    <div
      id="call-outcome-modal"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto"
    >
      <div className="bg-white w-full max-w-lg rounded-t-2xl sm:rounded-2xl border border-neutral-200 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col animate-in fade-in slide-in-from-bottom duration-200">
        {/* Header */}
        <div className="bg-neutral-900 text-white px-5 py-4 flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base">CRM Post-Call Report</h3>
              <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-mono px-2 py-0.5 rounded">
                Duration: {Math.floor(durationSeconds / 60)}m {durationSeconds % 60}s
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5 truncate">
              {lead.customerName} • {lead.phone} • {lead.project}
            </p>
          </div>
          <button
            onClick={onDiscard}
            className="text-neutral-400 hover:text-white p-1 rounded-lg"
            title="Save locally in Room without immediate submission"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Report ID Banner if active */}
        {reportId && (
          <div className="bg-neutral-800 px-5 py-1.5 flex items-center justify-between text-[11px] text-neutral-300 border-b border-neutral-700">
            <span className="flex items-center gap-1.5 font-mono text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              Report ID: {reportId}
            </span>
            <span className="text-[10px] text-neutral-400">Validated CRM Contract</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {/* 1. Primary Outcome Selection */}
          <div>
            <label className="font-bold text-neutral-800 text-xs block mb-2">
              1. Call Outcome <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {outcomesList.map((item) => {
                const isSelected = outcome === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleOutcomeChange(item.id)}
                    className={`p-2.5 rounded-xl border text-xs font-semibold text-center transition-all ${
                      isSelected
                        ? `${item.color} border-transparent shadow-xs scale-98`
                        : 'bg-neutral-50 text-neutral-700 border-neutral-200 hover:bg-neutral-100'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Temperature (CRITICAL: Separated from Grade) */}
          <div className="pt-2 border-t border-neutral-100">
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-bold text-neutral-800 text-xs">
                2. Lead Temperature <span className="text-emerald-700 font-normal text-[10px]">(Distinct from Grade)</span>
              </label>
              <span className="text-[10px] text-neutral-400 font-mono">['hot', 'warm', 'cold']</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(['Hot', 'Warm', 'Cold'] as const).map((temp) => {
                const isSelected = temperature === temp;
                return (
                  <button
                    key={temp}
                    type="button"
                    onClick={() => setTemperature(temp)}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      isSelected
                        ? temp === 'Hot'
                          ? 'bg-red-600 text-white border-red-600'
                          : temp === 'Warm'
                          ? 'bg-amber-600 text-white border-amber-600'
                          : 'bg-slate-700 text-white border-slate-700'
                        : 'bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100'
                    }`}
                  >
                    {temp === 'Hot' && <Flame className="w-3.5 h-3.5" />}
                    {temp === 'Warm' && <Sun className="w-3.5 h-3.5" />}
                    {temp === 'Cold' && <Snowflake className="w-3.5 h-3.5" />}
                    <span>{temp}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Lead Grade (CRITICAL: Separated from Temperature) */}
          <div className="pt-2 border-t border-neutral-100">
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-bold text-neutral-800 text-xs">
                3. Lead Grade <span className="text-emerald-700 font-normal text-[10px]">(Distinct from Temperature)</span>
              </label>
              <span className="text-[10px] text-neutral-400 font-mono">['A', 'B', 'C', 'D']</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {(['A', 'B', 'C', 'D'] as const).map((g) => {
                const isSelected = grade === g;
                return (
                  <button
                    key={g}
                    type="button"
                    onClick={() => {
                      setGrade(g);
                      setCategory(g as OperationalCategory);
                    }}
                    className={`py-2 px-2 rounded-xl border text-xs font-bold transition-all ${
                      isSelected
                        ? 'bg-[#0D6E44] text-white border-[#0D6E44] shadow-xs'
                        : 'bg-neutral-50 text-neutral-700 border-neutral-200 hover:bg-neutral-100'
                    }`}
                  >
                    <div>Grade {g}</div>
                    <div className="text-[9px] font-normal opacity-90">
                      {g === 'A' ? 'Immediate' : g === 'B' ? '1-3 Months' : g === 'C' ? 'Exploring' : 'Low Intent'}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. AI Decision Workflow */}
          <div className="pt-2 border-t border-neutral-100 bg-emerald-50/50 p-3 rounded-xl border border-emerald-200/80">
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-bold text-emerald-950 text-xs flex items-center gap-1.5">
                <Bot className="w-3.5 h-3.5 text-emerald-700" />
                <span>AI Suggested Recommendation Status</span>
              </label>
              <span className="text-[10px] text-emerald-700 font-semibold">CRM AI Ingest</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(['accepted', 'edited', 'rejected'] as const).map((decision) => {
                const isSelected = aiDecision === decision;
                return (
                  <button
                    key={decision}
                    type="button"
                    onClick={() => setAiDecision(decision)}
                    className={`py-1.5 px-2 rounded-lg border text-[11px] font-bold capitalize transition-all ${
                      isSelected
                        ? 'bg-emerald-800 text-white border-emerald-800'
                        : 'bg-white text-emerald-900 border-emerald-300 hover:bg-emerald-100'
                    }`}
                  >
                    {decision}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 5. Executive Summary & Reason */}
          <div className="space-y-3 pt-2 border-t border-neutral-100">
            <div>
              <label className="font-bold text-neutral-800 text-xs block mb-1">
                Executive Summary <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="High-level conversation summary..."
                className="w-full bg-neutral-50 border border-neutral-300 focus:border-[#0D6E44] rounded-xl p-2.5 text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="font-bold text-neutral-800 text-xs block mb-1">
                Primary Rationale / Reason <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Key justification for classification..."
                className="w-full bg-neutral-50 border border-neutral-300 focus:border-[#0D6E44] rounded-xl p-2.5 text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="font-bold text-neutral-800 text-xs block mb-1">
                Detailed Interaction Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Specific customer remarks, budget figures, floor preferences..."
                rows={2}
                className="w-full bg-neutral-50 border border-neutral-300 focus:border-[#0D6E44] rounded-xl p-2.5 text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none"
              />
            </div>
          </div>

          {/* 6. Follow-up & Reminder Minutes */}
          <div className="pt-2 border-t border-neutral-100 bg-neutral-50 p-3 rounded-xl border border-neutral-200">
            <div className="flex items-center justify-between">
              <label className="font-bold text-neutral-800 text-xs flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableFollowUp}
                  onChange={(e) => setEnableFollowUp(e.target.checked)}
                  className="rounded text-[#0D6E44] focus:ring-[#0D6E44]"
                />
                <span>Schedule CRM Follow-up & Reminder</span>
              </label>
              <span className="text-[10px] text-neutral-500 font-semibold">{reminderMinutes}m alert</span>
            </div>

            {enableFollowUp && (
              <div className="mt-3 space-y-2.5 pt-2 border-t border-neutral-200">
                {/* Quick Presets */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] text-neutral-500 font-medium">Quick:</span>
                  <button
                    type="button"
                    onClick={() => handleQuickFollowUp(0, 'Follow up later this evening')}
                    className="px-2 py-0.5 bg-white border border-neutral-200 rounded text-[10px] font-semibold text-neutral-700 hover:bg-neutral-100"
                  >
                    Later Today
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickFollowUp(1, 'Review brochure & morning callback')}
                    className="px-2 py-0.5 bg-white border border-neutral-200 rounded text-[10px] font-semibold text-neutral-700 hover:bg-neutral-100"
                  >
                    Tomorrow
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickFollowUp(3, 'Weekend consultation call')}
                    className="px-2 py-0.5 bg-white border border-neutral-200 rounded text-[10px] font-semibold text-neutral-700 hover:bg-neutral-100"
                  >
                    In 3 Days
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-neutral-500 block mb-0.5">Date</label>
                    <input
                      type="date"
                      value={followUpDate}
                      onChange={(e) => setFollowUpDate(e.target.value)}
                      className="w-full bg-white border border-neutral-200 rounded-lg p-1.5 text-xs text-neutral-800"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-neutral-500 block mb-0.5">Time</label>
                    <input
                      type="text"
                      value={followUpTime}
                      onChange={(e) => setFollowUpTime(e.target.value)}
                      placeholder="e.g., 04:30 PM"
                      className="w-full bg-white border border-neutral-200 rounded-lg p-1.5 text-xs text-neutral-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-neutral-500 block mb-0.5">Objective</label>
                    <input
                      type="text"
                      value={followUpReason}
                      onChange={(e) => setFollowUpReason(e.target.value)}
                      placeholder="e.g., Finalize site visit"
                      className="w-full bg-white border border-neutral-200 rounded-lg p-1.5 text-xs text-neutral-800"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-neutral-500 block mb-0.5">Reminder Window</label>
                    <select
                      value={reminderMinutes}
                      onChange={(e) => setReminderMinutes(Number(e.target.value))}
                      className="w-full bg-white border border-neutral-200 rounded-lg p-1.5 text-xs text-neutral-800"
                    >
                      <option value={10}>10 minutes before</option>
                      <option value={15}>15 minutes before</option>
                      <option value={30}>30 minutes before</option>
                      <option value={60}>1 hour before</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="pt-3 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onDiscard}
              className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:text-neutral-900 rounded-lg hover:bg-neutral-100 transition-colors"
            >
              Buffer in Room
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-[#0D6E44] hover:bg-[#0A5735] active:scale-95 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Submit to CRM</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

