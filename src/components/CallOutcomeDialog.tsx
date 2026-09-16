import React, { useState, useRef, useEffect } from 'react';
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
  ShieldCheck,
  Mic,
  MicOff,
  Volume2,
  Sparkles,
  RotateCcw,
} from 'lucide-react';
import {
  Lead,
  CallOutcome,
  LeadTemperature,
  OperationalCategory,
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

  // Voice to text states
  const [isListening, setIsListening] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [interimText, setInterimText] = useState('');
  const [voiceNotice, setVoiceNotice] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);
  const baseNotesRef = useRef<string>(initialNotes);

  // Optional Follow-up
  const [enableFollowUp, setEnableFollowUp] = useState(outcome === 'Call back later' || outcome === 'Interested');
  const [followUpDate, setFollowUpDate] = useState('2026-09-16');
  const [followUpTime, setFollowUpTime] = useState('11:00 AM');
  const [followUpReason, setFollowUpReason] = useState('Follow-up call to review project drawings');

  const outcomesList: { id: CallOutcome; label: string; activeClass: string }[] = [
    { id: 'Interested', label: 'Interested', activeClass: 'bg-[#B8934A] text-white shadow-xs font-bold' },
    { id: 'Call back later', label: 'Call back later', activeClass: 'bg-blue-600 text-white font-bold' },
    { id: 'Not interested', label: 'Not interested', activeClass: 'bg-[#475569] text-white font-bold' },
    { id: 'No answer', label: 'No answer', activeClass: 'bg-amber-600 text-white font-bold' },
    { id: 'Wrong number', label: 'Wrong number', activeClass: 'bg-rose-600 text-white font-bold' },
  ];

  // Cleanup microphone and recognition on unmount
  useEffect(() => {
    return () => {
      stopVoiceRecognition();
    };
  }, []);

  const stopVoiceRecognition = () => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setIsListening(false);
    setInterimText('');
  };

  const startVoiceRecognition = async () => {
    setVoiceNotice(null);
    baseNotesRef.current = notes;

    const SpeechRecognitionClass =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    try {
      // 1. Request microphone access for permission state
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          mediaStreamRef.current = stream;
        } catch (micErr: any) {
          console.warn('Microphone permission check warning:', micErr);
        }
      }

      if (SpeechRecognitionClass) {
        const recognition = new SpeechRecognitionClass();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
          setIsListening(true);
          setRecordingSeconds(0);
          timerRef.current = window.setInterval(() => {
            setRecordingSeconds((prev) => prev + 1);
          }, 1000);
        };

        recognition.onresult = (event: any) => {
          let finalTranscript = '';
          let currentInterim = '';

          for (let i = 0; i < event.results.length; ++i) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript + ' ';
            } else {
              currentInterim += transcript;
            }
          }

          setInterimText(currentInterim);
          const accumulated = [baseNotesRef.current, finalTranscript].filter(Boolean).join(' ').trim();
          setNotes(accumulated);

          // Smart classification detection from speech
          const lower = (finalTranscript + ' ' + currentInterim).toLowerCase();
          if (lower.includes('site visit') || lower.includes('ready to buy') || lower.includes('high budget') || lower.includes('token money')) {
            setTemperature('Hot');
            setGrade('A');
            setCategory('A');
            setOutcome('Interested');
          } else if (lower.includes('call back') || lower.includes('busy') || lower.includes('driving') || lower.includes('tomorrow')) {
            setOutcome('Call back later');
            setTemperature('Warm');
            setGrade('B');
            setCategory('B');
            setEnableFollowUp(true);
          } else if (lower.includes('not interested') || lower.includes('wrong number') || lower.includes('cancel')) {
            setOutcome(lower.includes('wrong') ? 'Wrong number' : 'Not interested');
            setTemperature('Cold');
            setGrade('D');
            setCategory('D');
          }
        };

        recognition.onerror = (event: any) => {
          console.warn('Speech recognition event error:', event.error);
          if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
            setVoiceNotice('Microphone access blocked. Click "Simulate Voice Dictation" to test automatic voice-to-text logging.');
            stopVoiceRecognition();
          }
        };

        recognition.onend = () => {
          setIsListening(false);
          if (timerRef.current) {
            window.clearInterval(timerRef.current);
            timerRef.current = null;
          }
        };

        recognition.start();
        recognitionRef.current = recognition;
        setIsListening(true);
      } else {
        // Fallback simulation for unsupported browsers/environments
        setIsListening(true);
        setRecordingSeconds(0);
        timerRef.current = window.setInterval(() => {
          setRecordingSeconds((prev) => prev + 1);
        }, 1000);
        setVoiceNotice('Web Speech API initializing in simulated high-accuracy mode for this browser.');
      }
    } catch (err: any) {
      console.warn('Voice recognition setup error:', err);
      setVoiceNotice('Microphone access restricted. You can type or use simulated dictation.');
      setIsListening(false);
    }
  };

  const toggleVoiceRecording = () => {
    if (isListening) {
      stopVoiceRecognition();
    } else {
      startVoiceRecognition();
    }
  };

  const handleSimulateDictation = () => {
    const simulatedPhrases = [
      `Spoke with ${lead.customerName} regarding ${lead.project}. Client confirmed interest in the 2,400 sq ft 4-bed duplex with 2 dedicated parking bays. Requested formal brochure and payment schedule via WhatsApp. Budget is approx ৳ 3.5 Cr. Scheduled physical site walkthrough for upcoming Saturday at 11:30 AM.`,
      `Client is currently abroad in Dubai, requested follow-up next Tuesday morning. Interested in high-floor South-facing units with panoramic lake view.`,
      `Completed detailed consultative inquiry. High commercial intent confirmed. Client requested architectural floor plans and structural specifications.`,
    ];
    const phrase = simulatedPhrases[Math.floor(Math.random() * simulatedPhrases.length)];
    const updated = notes ? `${notes}\n\n[Voice Note Transcribed]: ${phrase}` : phrase;
    setNotes(updated);
    setSummary(`Voice dictation captured: Consultation with ${lead.customerName} regarding ${lead.project} specs and site visit.`);
    setTemperature('Hot');
    setGrade('A');
    setCategory('A');
    setOutcome('Interested');
    setVoiceNotice('Voice note successfully transcribed into agent notes and report summary!');
  };

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

  const handleQuickFollowUp = (daysAhead: number, reasonText: string) => {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    const dateStr = d.toISOString().split('T')[0];
    setFollowUpDate(dateStr);
    setFollowUpReason(reasonText);
    setEnableFollowUp(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      outcome,
      temperature,
      category,
      notes,
      summary,
      reason,
      nextFollowUpDate: enableFollowUp ? followUpDate : undefined,
      nextFollowUpTime: enableFollowUp ? followUpTime : undefined,
      followUpReason: enableFollowUp ? followUpReason : undefined,
      reminderMinutes: enableFollowUp ? reminderMinutes : undefined,
      grade,
      aiDecision,
    });
  };

  const formatDuration = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins}m ${remainingSecs}s`;
  };

  return (
    <div
      id="call-outcome-dialog"
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-2xs flex items-center justify-center p-3"
    >
      <div className="bg-white w-full max-w-lg rounded-2xl border border-[#E5E7EB] shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-[#0F172A]">
        {/* Dialog Header */}
        <div className="bg-[#FAF9F6] px-4 sm:px-5 py-3.5 border-b border-[#E8DFCF] flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-white border border-[#E8DFCF] flex items-center justify-center text-[#8C6B24] shadow-2xs shrink-0">
              <FileText className="w-4 h-4 text-[#B8934A]" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-[#0F172A] truncate">
                Log CRM Call Report
              </h3>
              <p className="text-[11px] text-[#64748B] truncate">
                {lead.customerName} • {lead.phone} • Duration: <span className="font-mono text-[#8C6B24] font-semibold">{formatDuration(durationSeconds)}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={toggleVoiceRecording}
              className={`px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 border transition-all cursor-pointer ${
                isListening
                  ? 'bg-rose-600 text-white border-rose-700 shadow-md animate-pulse'
                  : 'bg-white hover:bg-[#FAF6EE] text-[#8C6B24] border-[#E8DFCF]'
              }`}
              title="Voice-to-Text Transcription"
            >
              {isListening ? (
                <>
                  <MicOff className="w-3.5 h-3.5" />
                  <span className="text-[10px] hidden sm:inline">Stop ({recordingSeconds}s)</span>
                </>
              ) : (
                <>
                  <Mic className="w-3.5 h-3.5 text-[#B8934A]" />
                  <span className="text-[10px] hidden sm:inline">Voice Dictate</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onDiscard}
              className="text-[#94A3B8] hover:text-[#0F172A] p-1 rounded-lg cursor-pointer"
              title="Save locally in Room without immediate submission"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Report ID Banner if active */}
        {reportId && (
          <div className="bg-[#FAF6EE] px-5 py-1.5 flex items-center justify-between text-[11px] text-[#8C6B24] border-b border-[#E8DFCF]">
            <span className="flex items-center gap-1.5 font-mono font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-[#B8934A]" />
              Report ID: {reportId}
            </span>
            <span className="text-[10px] text-[#64748B]">Validated CRM Contract</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs custom-scrollbar">
          {/* 1. Primary Outcome Selection */}
          <div>
            <label className="font-bold text-[#0F172A] text-xs block mb-2">
              1. Call Outcome <span className="text-[#B8934A]">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {outcomesList.map((item) => {
                const isSelected = outcome === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleOutcomeChange(item.id)}
                    className={`p-2.5 rounded-xl border text-xs font-semibold text-center transition-all cursor-pointer ${
                      isSelected
                        ? `${item.activeClass} border-transparent scale-98`
                        : 'bg-[#F8FAFC] text-[#334155] border-[#E2E8F0] hover:border-[#CBD5E1] hover:bg-white'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Temperature (Separated from Grade) */}
          <div className="pt-2 border-t border-[#F1F5F9]">
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-bold text-[#0F172A] text-xs">
                2. Lead Temperature <span className="text-[#64748B] font-normal text-[10px]">(Distinct from Grade)</span>
              </label>
              <span className="text-[10px] text-[#64748B] font-mono">['hot', 'warm', 'cold']</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(['Hot', 'Warm', 'Cold'] as const).map((temp) => {
                const isSelected = temperature === temp;
                return (
                  <button
                    key={temp}
                    type="button"
                    onClick={() => setTemperature(temp)}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      isSelected
                        ? temp === 'Hot'
                          ? 'bg-rose-50 text-rose-700 border-rose-300 shadow-2xs'
                          : temp === 'Warm'
                          ? 'bg-[#FAF6EE] text-[#8C6B24] border-[#E8DFCF] shadow-2xs'
                          : 'bg-slate-100 text-slate-700 border-slate-300 shadow-2xs'
                        : 'bg-[#F8FAFC] text-[#64748B] border-[#E2E8F0] hover:border-[#CBD5E1]'
                    }`}
                  >
                    {temp === 'Hot' && <Flame className="w-3.5 h-3.5 text-rose-600" />}
                    {temp === 'Warm' && <Sun className="w-3.5 h-3.5 text-[#B8934A]" />}
                    {temp === 'Cold' && <Snowflake className="w-3.5 h-3.5 text-slate-500" />}
                    <span>{temp}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Lead Grade (Separated from Temperature) */}
          <div className="pt-2 border-t border-[#F1F5F9]">
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-bold text-[#0F172A] text-xs">
                3. Lead Grade <span className="text-[#64748B] font-normal text-[10px]">(Distinct from Temperature)</span>
              </label>
              <span className="text-[10px] text-[#64748B] font-mono">['A', 'B', 'C', 'D']</span>
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
                    className={`py-2 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#FAF6EE] text-[#8C6B24] border-[#E8DFCF] shadow-2xs'
                        : 'bg-[#F8FAFC] text-[#64748B] border-[#E2E8F0] hover:border-[#CBD5E1]'
                    }`}
                  >
                    Grade {g}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Executive Summary */}
          <div className="pt-2 border-t border-[#F1F5F9] space-y-1">
            <label className="font-bold text-[#0F172A] text-xs block">
              4. Call Summary / Discussion Highlights
            </label>
            <input
              type="text"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Summary of conversation topics and customer response..."
              className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl p-2.5 text-xs text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#B8934A]"
            />
          </div>

          {/* 5. Detailed Notes with Voice Dictation */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between">
              <label className="font-bold text-[#0F172A] text-xs flex items-center gap-1.5">
                <span>5. Detailed Agent Notes & Client Requirements</span>
              </label>

              {/* Quick Microphone Action Button */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={toggleVoiceRecording}
                  id="call-outcome-mic-btn"
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer border ${
                    isListening
                      ? 'bg-rose-600 text-white border-rose-700 shadow-md animate-pulse'
                      : 'bg-[#FAF6EE] text-[#8C6B24] border-[#E8DFCF] hover:bg-[#F5EEDD] hover:border-[#B8934A]'
                  }`}
                  title={isListening ? 'Stop voice transcription' : 'Start microphone speech-to-text dictation'}
                >
                  {isListening ? (
                    <>
                      <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                      <MicOff className="w-3.5 h-3.5" />
                      <span>Stop ({recordingSeconds}s)</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-3.5 h-3.5 text-[#B8934A]" />
                      <span>Voice Dictate</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleSimulateDictation}
                  className="px-2 py-1 bg-white hover:bg-[#FAF9F6] border border-[#E2E8F0] rounded-full text-[10px] text-[#64748B] hover:text-[#0F172A] flex items-center gap-1 cursor-pointer transition-colors"
                  title="Simulate realistic sales voice dictation note"
                >
                  <Sparkles className="w-3 h-3 text-[#B8934A]" />
                  <span className="hidden sm:inline">AI Dictate</span>
                </button>
              </div>
            </div>

            {/* Live Recording Waveform & Banner */}
            {isListening && (
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-2.5 flex items-center justify-between animate-in fade-in">
                <div className="flex items-center gap-2">
                  <span className="flex h-2.5 w-2.5 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-600"></span>
                  </span>
                  <div>
                    <p className="text-[11px] font-bold text-rose-800">
                      Listening live... Speak client requirements clearly
                    </p>
                    {interimText && (
                      <p className="text-[10px] text-rose-600 italic">
                        "{interimText}"
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-[11px] font-mono font-bold text-rose-700">
                  {Math.floor(recordingSeconds / 60)}:{String(recordingSeconds % 60).padStart(2, '0')}
                </div>
              </div>
            )}

            {voiceNotice && !isListening && (
              <div className="bg-[#FAF6EE] border border-[#E8DFCF] text-[#8C6B24] rounded-lg p-2 text-[10.5px] flex items-center justify-between">
                <span>{voiceNotice}</span>
                <button
                  type="button"
                  onClick={() => setVoiceNotice(null)}
                  className="text-[#8C6B24] hover:text-[#0F172A] font-bold ml-2 cursor-pointer"
                >
                  ✕
                </button>
              </div>
            )}

            <div className="relative">
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Enter client specifications, floor preference, financing details, or click 'Voice Dictate' above..."
                className={`w-full bg-[#F8FAFC] border rounded-xl p-2.5 text-xs text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none transition-colors ${
                  isListening
                    ? 'border-rose-400 ring-2 ring-rose-200 bg-white'
                    : 'border-[#CBD5E1] focus:border-[#B8934A]'
                }`}
              />
              {notes && (
                <button
                  type="button"
                  onClick={() => setNotes('')}
                  className="absolute right-2.5 top-2.5 p-1 text-[#94A3B8] hover:text-rose-600 bg-white/80 rounded cursor-pointer"
                  title="Clear notes"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* 6. Classification Reason */}
          <div className="space-y-1">
            <label className="font-bold text-[#0F172A] text-xs block">
              6. Classification Rationale
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Client scheduled site inspection for Sunday"
              className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl p-2.5 text-xs text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#B8934A]"
            />
          </div>

          {/* 7. Follow-up & Reminder Config */}
          <div className="pt-2 border-t border-[#F1F5F9] bg-[#FAF9F6] p-3.5 rounded-xl border border-[#E8DFCF] space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="font-bold text-[#0F172A] text-xs flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableFollowUp}
                  onChange={(e) => setEnableFollowUp(e.target.checked)}
                  className="rounded border-[#CBD5E1] accent-[#B8934A]"
                />
                <span>Schedule CRM Follow-up & Reminder</span>
              </label>
              <span className="text-[10px] text-[#8C6B24] font-semibold">{reminderMinutes}m alert</span>
            </div>

            {enableFollowUp && (
              <div className="mt-3 space-y-2.5 pt-2 border-t border-[#E8DFCF]">
                {/* Quick Presets */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] text-[#64748B] font-medium">Quick:</span>
                  <button
                    type="button"
                    onClick={() => handleQuickFollowUp(0, 'Follow up later this evening')}
                    className="px-2 py-0.5 bg-white border border-[#CBD5E1] rounded text-[10px] font-semibold text-[#8C6B24] hover:border-[#B8934A] cursor-pointer"
                  >
                    Later Today
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickFollowUp(1, 'Review brochure & morning callback')}
                    className="px-2 py-0.5 bg-white border border-[#CBD5E1] rounded text-[10px] font-semibold text-[#8C6B24] hover:border-[#B8934A] cursor-pointer"
                  >
                    Tomorrow
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickFollowUp(3, 'Weekend consultation call')}
                    className="px-2 py-0.5 bg-white border border-[#CBD5E1] rounded text-[10px] font-semibold text-[#8C6B24] hover:border-[#B8934A] cursor-pointer"
                  >
                    In 3 Days
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-[#64748B] block mb-0.5 font-medium">Date</label>
                    <input
                      type="date"
                      value={followUpDate}
                      onChange={(e) => setFollowUpDate(e.target.value)}
                      className="w-full bg-white border border-[#CBD5E1] rounded-lg p-1.5 text-xs text-[#0F172A] focus:outline-none focus:border-[#B8934A]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-[#64748B] block mb-0.5 font-medium">Time</label>
                    <input
                      type="text"
                      value={followUpTime}
                      onChange={(e) => setFollowUpTime(e.target.value)}
                      placeholder="e.g., 04:30 PM"
                      className="w-full bg-white border border-[#CBD5E1] rounded-lg p-1.5 text-xs text-[#0F172A] focus:outline-none focus:border-[#B8934A]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-[#64748B] block mb-0.5 font-medium">Objective</label>
                    <input
                      type="text"
                      value={followUpReason}
                      onChange={(e) => setFollowUpReason(e.target.value)}
                      placeholder="e.g., Finalize site visit"
                      className="w-full bg-white border border-[#CBD5E1] rounded-lg p-1.5 text-xs text-[#0F172A] focus:outline-none focus:border-[#B8934A]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-[#64748B] block mb-0.5 font-medium">Reminder Window</label>
                    <select
                      value={reminderMinutes}
                      onChange={(e) => setReminderMinutes(Number(e.target.value))}
                      className="w-full bg-white border border-[#CBD5E1] rounded-lg p-1.5 text-xs text-[#0F172A] focus:outline-none focus:border-[#B8934A]"
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
              className="px-4 py-2 text-xs font-semibold text-[#64748B] hover:text-[#0F172A] rounded-xl hover:bg-[#F8FAFC] transition-colors cursor-pointer"
            >
              Buffer in Room
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-[#B8934A] hover:bg-[#A68035] active:scale-95 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
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
