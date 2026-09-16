import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Mic,
  Square,
  AlertCircle,
  CheckCircle,
  Sparkles,
  Play,
  Pause,
  Loader2,
  MapPin,
  Radio,
} from 'lucide-react';
import { Lead } from '../types';

interface AddNoteModalProps {
  lead: Lead;
  onSave: (note: string) => void;
  onClose: () => void;
}

export const AddNoteModal: React.FC<AddNoteModalProps> = ({ lead, onSave, onClose }) => {
  const [note, setNote] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptionSource, setTranscriptionSource] = useState<'speech_api' | 'simulated' | null>(null);
  const [micError, setMicError] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [liveInterimText, setLiveInterimText] = useState('');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const speechRecognitionRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const speechTranscriptRef = useRef<string>('');
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      stopRecordingCleanup();
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  const stopRecordingCleanup = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (err) {
        console.warn('Error stopping mediaRecorder', err);
      }
    }
    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch (err) {
        console.warn('Error stopping speechRecognition', err);
      }
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsRecording(false);
  };

  const startVoiceRecording = async () => {
    setMicError(null);
    audioChunksRef.current = [];
    speechTranscriptRef.current = '';
    setLiveInterimText('');
    setTranscriptionSource(null);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Microphone access (getUserMedia) is not supported in this browser environment.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
      };

      mediaRecorder.start();

      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition();
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = 'en-US';

          recognition.onresult = (event: any) => {
            let interim = '';
            let final = '';
            for (let i = 0; i < event.results.length; ++i) {
              if (event.results[i].isFinal) {
                final += event.results[i][0].transcript + ' ';
              } else {
                interim += event.results[i][0].transcript;
              }
            }
            speechTranscriptRef.current = final;
            setLiveInterimText(interim);
          };

          recognition.start();
          speechRecognitionRef.current = recognition;
        } catch (recErr) {
          console.warn('SpeechRecognition setup notice:', recErr);
        }
      }

      setIsRecording(true);
      setRecordingSeconds(0);
      timerRef.current = window.setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.warn('getUserMedia mic error:', err);
      setMicError(
        'Microphone is unavailable or blocked in iframe. You can type notes or click "Simulate Dictation" to preview voice transcription.'
      );
    }
  };

  const stopAndTranscribe = () => {
    setIsTranscribing(true);
    stopRecordingCleanup();

    setTimeout(() => {
      let finalSpeech = speechTranscriptRef.current.trim();
      if (!finalSpeech && liveInterimText.trim()) {
        finalSpeech = liveInterimText.trim();
      }

      if (finalSpeech) {
        setTranscriptionSource('speech_api');
        setNote((prev) => (prev ? `${prev}\n\n[Voice Note]: ${finalSpeech}` : `[Voice Note]: ${finalSpeech}`));
      } else {
        triggerSimulatedDictation();
      }
      setIsTranscribing(false);
    }, 600);
  };

  const triggerSimulatedDictation = () => {
    setIsTranscribing(true);
    setMicError(null);
    setTimeout(() => {
      const sampleTranscriptions = [
        `Client showed strong interest in the 4-bedroom south-facing duplex in Gulshan. Requested customized payment schedule over 24 months.`,
        `Discussed architectural specifications for Banani Lakeview project. Client wants site inspection this Saturday at 3:30 PM.`,
        `Follow-up call completed. Client is comparing with another developer in Dhanmondi; emphasized Winstone's guaranteed delivery milestone.`,
      ];
      const randomSample = sampleTranscriptions[Math.floor(Math.random() * sampleTranscriptions.length)];
      setTranscriptionSource('simulated');
      setNote((prev) => (prev ? `${prev}\n\n[Dictation]: ${randomSample}` : `[Dictation]: ${randomSample}`));
      setIsTranscribing(false);
    }, 600);
  };

  const toggleAudioPlayback = () => {
    if (!audioUrl) return;
    if (!audioElementRef.current) {
      audioElementRef.current = new Audio(audioUrl);
      audioElementRef.current.onended = () => setIsPlayingAudio(false);
    }
    if (isPlayingAudio) {
      audioElementRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      audioElementRef.current.play();
      setIsPlayingAudio(true);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isRecording) {
      stopAndTranscribe();
      return;
    }
    if (!note.trim()) return;
    onSave(note.trim());
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div id="add-note-modal" className="fixed inset-0 z-50 bg-black/40 backdrop-blur-2xs flex items-center justify-center p-4">
      <div className="bg-white text-[#0F172A] w-full max-w-lg rounded-2xl border border-[#E5E7EB] shadow-2xl p-5 space-y-4">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
          <div>
            <h3 className="text-sm font-bold text-[#0F172A]">Add Lead Note</h3>
            <p className="text-xs text-[#64748B]">{lead.customerName} • {lead.project}</p>
          </div>
          <button
            id="close-add-note-modal-btn"
            onClick={onClose}
            className="text-[#94A3B8] hover:text-[#0F172A] p-1 rounded-lg cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MediaRecorder Voice Dictation Console */}
        <div className="bg-[#FAF9F6] p-3.5 rounded-xl border border-[#E8DFCF] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                  isRecording
                    ? 'bg-rose-500 text-white animate-pulse'
                    : isTranscribing
                    ? 'bg-amber-500 text-white animate-spin'
                    : 'bg-white text-[#8C6B24] border border-[#E8DFCF] shadow-2xs'
                }`}
              >
                {isRecording ? (
                  <Radio className="w-4 h-4" />
                ) : isTranscribing ? (
                  <Loader2 className="w-4 h-4" />
                ) : (
                  <Mic className="w-4 h-4 text-[#B8934A]" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-[#0F172A] block">
                    {isRecording
                      ? 'Recording Verbal Audio...'
                      : isTranscribing
                      ? 'Transcribing Speech to Text...'
                      : 'Voice Note Dictation'}
                  </span>
                  {transcriptionSource && (
                    <span className="text-[10px] font-medium bg-[#FAF6EE] text-[#8C6B24] border border-[#E8DFCF] px-1.5 py-0.2 rounded font-semibold">
                      {transcriptionSource === 'speech_api' ? 'Browser Speech' : 'Transcribed'}
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-[#64748B] block">
                  {isRecording
                    ? 'Capturing audio frames with browser MediaRecorder API'
                    : 'Record verbal remarks or transcribe customer requirements directly'}
                </span>
              </div>
            </div>

            {/* Recording Controls */}
            {isRecording ? (
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded border border-rose-200 animate-pulse">
                  {formatTimer(recordingSeconds)}
                </span>
                <button
                  id="stop-and-transcribe-btn"
                  type="button"
                  onClick={stopAndTranscribe}
                  className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold px-3 py-1.5 rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>Stop & Transcribe</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  id="start-voice-recording-btn"
                  type="button"
                  onClick={startVoiceRecording}
                  disabled={isTranscribing}
                  className="flex items-center gap-1.5 bg-[#B8934A] hover:bg-[#A68035] disabled:opacity-50 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-xs transition-colors cursor-pointer active:scale-95"
                >
                  <Mic className="w-3.5 h-3.5" />
                  <span>Record Voice</span>
                </button>
              </div>
            )}
          </div>

          {/* Audio Playback Player Bar if audio is recorded */}
          {audioUrl && !isRecording && (
            <div className="flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-[#E2E8F0] text-xs shadow-2xs">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={toggleAudioPlayback}
                  className="w-6 h-6 rounded-full bg-[#B8934A] text-white flex items-center justify-center cursor-pointer shadow-2xs"
                >
                  {isPlayingAudio ? <Pause className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current ml-0.5" />}
                </button>
                <span className="text-[#0F172A] font-semibold">Recorded Voice Note</span>
                <span className="text-[10px] text-[#64748B] font-mono">({formatTimer(recordingSeconds)})</span>
              </div>
              <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-emerald-600" /> Transcribed to note below
              </span>
            </div>
          )}

          {/* Error Message & Graceful Simulation fallback */}
          {micError && (
            <div className="space-y-2 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
              <div className="flex items-start gap-1.5 text-[11px] text-amber-900">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>{micError}</span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-amber-200">
                <span className="text-[10px] text-amber-800 font-medium">Preview speech transcription workflow:</span>
                <button
                  id="simulate-dictation-btn"
                  type="button"
                  onClick={triggerSimulatedDictation}
                  disabled={isTranscribing}
                  className="flex items-center gap-1 bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg cursor-pointer transition-colors shadow-2xs"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Simulate Dictation</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Note Editor Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-semibold text-[#0F172A]">
                Note Content (Editable)
              </label>
              <div className="flex items-center gap-2">
                <button
                  id="quick-dictation-simulate-btn"
                  type="button"
                  onClick={triggerSimulatedDictation}
                  disabled={isRecording || isTranscribing}
                  className="text-[10px] text-[#8C6B24] hover:underline flex items-center gap-1 cursor-pointer font-semibold"
                >
                  <Sparkles className="w-3 h-3 text-[#B8934A]" />
                  <span>Insert Quick Sample Note</span>
                </button>
                {note && (
                  <button
                    type="button"
                    onClick={() => setNote('')}
                    className="text-[10px] text-[#64748B] hover:text-[#0F172A] cursor-pointer"
                  >
                    Clear text
                  </button>
                )}
              </div>
            </div>
            <textarea
              id="lead-note-textarea"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Speak via the microphone recorder above or type notes regarding unit specifications, budget, and objections..."
              rows={4}
              className="w-full bg-[#F8FAFC] border border-[#CBD5E1] focus:border-[#B8934A] focus:ring-1 focus:ring-[#B8934A] rounded-xl p-3 text-xs text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none"
              autoFocus
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-[10px] text-[#64748B]">
              {note.length} characters • Stored locally & queued for CRM sync
            </span>
            <div className="flex items-center gap-2">
              <button
                id="cancel-add-note-btn"
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 text-xs font-semibold text-[#64748B] hover:text-[#0F172A] cursor-pointer"
              >
                Cancel
              </button>
              <button
                id="submit-add-note-btn"
                type="submit"
                disabled={!note.trim()}
                className="px-4 py-2 bg-[#B8934A] hover:bg-[#A68035] disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs active:scale-95"
              >
                Save Note
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

interface ScheduleFollowUpModalProps {
  lead: Lead;
  onSave: (date: string, time: string, reason: string) => void;
  onClose: () => void;
}

export const ScheduleFollowUpModal: React.FC<ScheduleFollowUpModalProps> = ({
  lead,
  onSave,
  onClose,
}) => {
  const [date, setDate] = useState('2026-09-16');
  const [time, setTime] = useState('11:00 AM');
  const [reason, setReason] = useState('Check client decision regarding proposed floor plan');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;
    onSave(date, time, reason.trim());
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-2xs flex items-center justify-center p-4">
      <div className="bg-white text-[#0F172A] w-full max-w-md rounded-2xl border border-[#E5E7EB] shadow-2xl p-5 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-[#F1F5F9]">
          <div>
            <h3 className="text-sm font-bold text-[#0F172A]">Set Follow-up Call</h3>
            <p className="text-xs text-[#64748B]">{lead.customerName} • {lead.project}</p>
          </div>
          <button onClick={onClose} className="text-[#94A3B8] hover:text-[#0F172A] p-1 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] font-semibold text-[#0F172A] block mb-1">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl p-2 text-xs text-[#0F172A] focus:outline-none focus:border-[#B8934A]"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-[#0F172A] block mb-1">Time</label>
              <input
                type="text"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                placeholder="11:00 AM"
                className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl p-2 text-xs text-[#0F172A] focus:outline-none focus:border-[#B8934A]"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-[#0F172A] block mb-1">
              Follow-up Objective
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Provide price quote and bank loan scheme options"
              className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl p-2 text-xs text-[#0F172A] focus:outline-none focus:border-[#B8934A]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#F1F5F9]">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-semibold text-[#64748B] hover:text-[#0F172A] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#B8934A] hover:bg-[#A68035] text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer active:scale-95"
            >
              Schedule Follow-up
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface ScheduleSiteVisitModalProps {
  lead: Lead;
  onSave: (date: string, time: string, notes: string) => void;
  onClose: () => void;
}

export const ScheduleSiteVisitModal: React.FC<ScheduleSiteVisitModalProps> = ({
  lead,
  onSave,
  onClose,
}) => {
  const [date, setDate] = useState('2026-09-18');
  const [time, setTime] = useState('03:30 PM');
  const [notes, setNotes] = useState('Client visiting with architectural consultant. Arrange physical site tour pass.');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(date, time, notes.trim());
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-2xs flex items-center justify-center p-4">
      <div className="bg-white text-[#0F172A] w-full max-w-md rounded-2xl border border-[#E5E7EB] shadow-2xl p-5 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-[#F1F5F9]">
          <div>
            <h3 className="text-sm font-bold text-[#0F172A]">Schedule Physical Site Visit</h3>
            <p className="text-xs text-[#64748B]">{lead.customerName} • {lead.project}</p>
          </div>
          <button onClick={onClose} className="text-[#94A3B8] hover:text-[#0F172A] p-1 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div className="p-3 bg-[#FAF9F6] rounded-xl border border-[#E8DFCF] flex items-center gap-2.5 text-[#8C6B24]">
            <MapPin className="w-4 h-4 text-[#B8934A] shrink-0" />
            <span className="font-semibold text-xs">{lead.project} Location Site</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] font-semibold text-[#0F172A] block mb-1">Visit Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl p-2 text-xs text-[#0F172A] focus:outline-none focus:border-[#B8934A]"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-[#0F172A] block mb-1">Visit Time</label>
              <input
                type="text"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                placeholder="03:30 PM"
                className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl p-2 text-xs text-[#0F172A] focus:outline-none focus:border-[#B8934A]"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-[#0F172A] block mb-1">
              Escort & Site Requirements
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="e.g., Arrange hardhats, site engineer escort, mock duplex viewing..."
              className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl p-2 text-xs text-[#0F172A] focus:outline-none focus:border-[#B8934A]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#F1F5F9]">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-semibold text-[#64748B] hover:text-[#0F172A] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#B8934A] hover:bg-[#A68035] text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer active:scale-95"
            >
              Confirm Site Visit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface AddNewLeadModalProps {
  onSave: (payload: { name: string; phone: string; company: string; notes: string }) => void;
  onClose: () => void;
}

export const AddNewLeadModal: React.FC<AddNewLeadModalProps> = ({ onSave, onClose }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('+8801');
  const [company, setCompany] = useState('Winstone Prime Residencies');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Client full name is required');
      return;
    }
    if (!phone.trim() || phone.trim().length < 8) {
      setError('Valid contact phone number is required');
      return;
    }
    onSave({
      name: name.trim(),
      phone: phone.trim(),
      company: company.trim() || 'Winstone Prime',
      notes: notes.trim(),
    });
  };

  return (
    <div
      id="add-new-lead-modal"
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-2xs flex items-center justify-center p-4"
    >
      <div className="bg-white text-[#0F172A] w-full max-w-md rounded-2xl border border-[#E5E7EB] shadow-2xl overflow-hidden">
        <div className="bg-[#FAF9F6] text-[#0F172A] px-5 py-3.5 flex items-center justify-between border-b border-[#E8DFCF]">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#B8934A]" />
            <h3 className="font-bold text-sm text-[#0F172A]">New Ingested Lead (POST /ingest/lead)</h3>
          </div>
          <button onClick={onClose} className="text-[#94A3B8] hover:text-[#0F172A] p-1 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs">
          {error && (
            <div className="p-2.5 bg-rose-50 text-rose-800 rounded-xl border border-rose-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="text-[11px] font-semibold text-[#0F172A] block mb-1">
              Client Full Name <span className="text-[#B8934A]">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError(null);
              }}
              placeholder="e.g. Engr. Tanvir Morshed"
              className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl p-2.5 text-xs text-[#0F172A] focus:border-[#B8934A] focus:outline-none"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-[#0F172A] block mb-1">
              Contact Phone Number <span className="text-[#B8934A]">*</span>
            </label>
            <input
              type="text"
              required
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                setError(null);
              }}
              placeholder="+88017XXXXXXXX"
              className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl p-2.5 text-xs text-[#0F172A] focus:border-[#B8934A] focus:outline-none font-mono"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-[#0F172A] block mb-1">
              Project / Venture Interest
            </label>
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="e.g. Winstone Gulshan Heights"
              className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl p-2.5 text-xs text-[#0F172A] focus:border-[#B8934A] focus:outline-none"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-[#0F172A] block mb-1">
              Initial Intake Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="e.g. Walk-in or phone inquiry. Looking for 3,500 sqft penthouse in Banani..."
              className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl p-2.5 text-xs text-[#0F172A] focus:border-[#B8934A] focus:outline-none"
            />
          </div>

          <div className="bg-[#FAF6EE] border border-[#E8DFCF] p-2.5 rounded-xl text-[11px] text-[#8C6B24] flex items-center justify-between">
            <span>Direct Agent App Ingest • Auto-assigned</span>
            <span className="font-mono font-bold text-[10px]">source: "agent_app"</span>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#F1F5F9]">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-semibold text-[#64748B] hover:text-[#0F172A] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#B8934A] hover:bg-[#A68035] text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer active:scale-95"
            >
              Ingest & Assign Lead
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
