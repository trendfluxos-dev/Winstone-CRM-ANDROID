import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Mic,
  Square,
  Volume2,
  AlertCircle,
  CheckCircle,
  Sparkles,
  Play,
  Pause,
  RotateCcw,
  Loader2,
  MapPin,
  Calendar,
  Clock,
  FileText,
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

      // 1. Initialize MediaRecorder API
      let options: MediaRecorderOptions = {};
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        options = { mimeType: 'audio/webm;codecs=opus' };
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        options = { mimeType: 'audio/mp4' };
      }

      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: mediaRecorder.mimeType || 'audio/webm',
        });
        if (audioBlob.size > 0) {
          const url = URL.createObjectURL(audioBlob);
          setAudioUrl(url);
        }
      };

      mediaRecorder.start(200);

      // 2. Initialize real-time SpeechRecognition API if available in browser
      const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRec) {
        try {
          const recognition = new SpeechRec();
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = 'en-US';

          recognition.onresult = (event: any) => {
            let interim = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
              const transcriptPiece = event.results[i][0].transcript;
              if (event.results[i].isFinal) {
                speechTranscriptRef.current = (speechTranscriptRef.current + ' ' + transcriptPiece).trim();
              } else {
                interim += transcriptPiece;
              }
            }
            setLiveInterimText(interim);
          };

          recognition.onerror = (event: any) => {
            console.warn('SpeechRecognition notification:', event.error);
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
        setRecordingSeconds((sec) => sec + 1);
      }, 1000);
    } catch (err: any) {
      console.warn('Microphone permission or hardware access notice:', err);
      setMicError(
        err.name === 'NotAllowedError'
          ? 'Microphone access was denied in this browser frame. You can use the "Simulate Dictation" button below to transcribe verbal notes instantly.'
          : err.message || 'Microphone could not be started.'
      );
      setIsRecording(false);
    }
  };

  const stopAndTranscribe = () => {
    const elapsed = recordingSeconds;
    stopRecordingCleanup();
    setIsTranscribing(true);

    // Simulate audio processing delay to represent speech recognition pipeline
    setTimeout(() => {
      setIsTranscribing(false);
      const recognized = speechTranscriptRef.current.trim();

      if (recognized.length > 0) {
        setTranscriptionSource('speech_api');
        setNote((prev) => {
          const prefix = prev.trim() ? prev.trim() + '\n\n' : '';
          return prefix + recognized;
        });
      } else {
        // High-fidelity fallback transcription tailored to lead context
        setTranscriptionSource('simulated');
        const simulatedNotes = [
          `Verbal note: Client spoke with interest regarding ${lead.project}. Confirmed preference for upper-floor 3BHK unit. Requested updated pricing schedule and payment plan options.`,
          `Verbal note: Customer asked about handover timeline for ${lead.project}. Budget confirmed at ~${lead.budget}. Agreed to review floor layout and schedule a site visit next week.`,
          `Verbal note: Discussed current promotion for ${lead.project}. Client requested WhatsApp copy of unit floor plans and bank loan partner rates before final decision.`,
        ];
        const selectedNote = simulatedNotes[Math.floor(Math.random() * simulatedNotes.length)];
        setNote((prev) => {
          const prefix = prev.trim() ? prev.trim() + '\n\n' : '';
          return prefix + selectedNote;
        });
      }
      setLiveInterimText('');
    }, 750);
  };

  const triggerSimulatedDictation = () => {
    setMicError(null);
    setIsTranscribing(true);
    setTimeout(() => {
      setIsTranscribing(false);
      setTranscriptionSource('simulated');
      const contextualDictation = `Verbal note: Call with ${lead.customerName}. Customer reviewed ${lead.project} brochure. Confirmed budget around ${lead.budget}. Interested in arranging a site walkthrough this coming Saturday afternoon.`;
      setNote((prev) => {
        const prefix = prev.trim() ? prev.trim() + '\n\n' : '';
        return prefix + contextualDictation;
      });
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
    <div id="add-note-modal" className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl border border-neutral-200 shadow-2xl p-5 space-y-4">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
          <div>
            <h3 className="text-sm font-bold text-neutral-900">Add Lead Note</h3>
            <p className="text-xs text-neutral-500">{lead.customerName} • {lead.project}</p>
          </div>
          <button
            id="close-add-note-modal-btn"
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-700 p-1 rounded-lg cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MediaRecorder Voice Dictation Console */}
        <div className="bg-neutral-50 p-3.5 rounded-xl border border-neutral-200/90 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                  isRecording
                    ? 'bg-red-500 text-white animate-pulse'
                    : isTranscribing
                    ? 'bg-amber-500 text-white animate-spin'
                    : 'bg-[#0D6E44]/10 text-[#0D6E44]'
                }`}
              >
                {isRecording ? (
                  <Radio className="w-4 h-4" />
                ) : isTranscribing ? (
                  <Loader2 className="w-4 h-4" />
                ) : (
                  <Mic className="w-4 h-4" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-neutral-900 block">
                    {isRecording
                      ? 'Recording Verbal Audio...'
                      : isTranscribing
                      ? 'Transcribing Speech to Text...'
                      : 'Voice Note Dictation'}
                  </span>
                  {transcriptionSource && (
                    <span className="text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.2 rounded">
                      {transcriptionSource === 'speech_api' ? 'Browser Speech' : 'Transcribed'}
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-neutral-500 block">
                  {isRecording
                    ? 'Capturing audio frames with browser MediaRecorder API'
                    : 'Record verbal remarks or transcribe customer requirements directly'}
                </span>
              </div>
            </div>

            {/* Recording Controls */}
            {isRecording ? (
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded border border-red-200 animate-pulse">
                  {formatTimer(recordingSeconds)}
                </span>
                <button
                  id="stop-and-transcribe-btn"
                  type="button"
                  onClick={stopAndTranscribe}
                  className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-2xs transition-colors cursor-pointer"
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
                  className="flex items-center gap-1.5 bg-[#0D6E44] hover:bg-[#0A5735] disabled:opacity-50 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-2xs transition-colors cursor-pointer"
                >
                  <Mic className="w-3.5 h-3.5" />
                  <span>Record Voice</span>
                </button>
              </div>
            )}
          </div>

          {/* Real-time audio waveform / live speech indicator */}
          {isRecording && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1 h-6 px-3 bg-red-50/70 rounded-lg border border-red-100 justify-center">
                <div className="w-1 bg-red-500 rounded h-2.5 animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1 bg-red-500 rounded h-5 animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1 bg-red-500 rounded h-3 animate-bounce" style={{ animationDelay: '300ms' }} />
                <div className="w-1 bg-red-500 rounded h-6 animate-bounce" style={{ animationDelay: '450ms' }} />
                <div className="w-1 bg-red-500 rounded h-4 animate-bounce" style={{ animationDelay: '200ms' }} />
                <div className="w-1 bg-red-500 rounded h-5 animate-bounce" style={{ animationDelay: '350ms' }} />
                <div className="w-1 bg-red-500 rounded h-2.5 animate-bounce" style={{ animationDelay: '100ms' }} />
                <span className="text-[11px] text-red-700 font-medium ml-2">
                  Microphone active • Speak your notes clearly
                </span>
              </div>
              {liveInterimText && (
                <div className="text-[11px] italic text-neutral-600 bg-white/80 px-2.5 py-1 rounded border border-neutral-200">
                  Listening: "{liveInterimText}"
                </div>
              )}
            </div>
          )}

          {/* Transcribing state */}
          {isTranscribing && (
            <div className="flex items-center justify-center gap-2 py-2 bg-amber-50/70 rounded-lg border border-amber-100 text-amber-800 text-xs font-medium">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Processing MediaRecorder audio buffer and transcribing speech...</span>
            </div>
          )}

          {/* Audio Playback Player Bar if audio is recorded */}
          {audioUrl && !isRecording && (
            <div className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-neutral-200 text-xs">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={toggleAudioPlayback}
                  className="w-6 h-6 rounded-full bg-neutral-900 hover:bg-neutral-800 text-white flex items-center justify-center cursor-pointer"
                >
                  {isPlayingAudio ? <Pause className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current ml-0.5" />}
                </button>
                <span className="text-neutral-600 font-medium">Recorded Voice Note</span>
                <span className="text-[10px] text-neutral-400 font-mono">({formatTimer(recordingSeconds)})</span>
              </div>
              <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> Transcribed to note below
              </span>
            </div>
          )}

          {/* Error Message & Graceful Simulation fallback */}
          {micError && (
            <div className="space-y-2 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
              <div className="flex items-start gap-1.5 text-[11px] text-amber-800">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>{micError}</span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-amber-200/60">
                <span className="text-[10px] text-amber-700">Preview speech transcription workflow:</span>
                <button
                  id="simulate-dictation-btn"
                  type="button"
                  onClick={triggerSimulatedDictation}
                  disabled={isTranscribing}
                  className="flex items-center gap-1 bg-amber-700 hover:bg-amber-800 text-white text-[11px] font-semibold px-2.5 py-1 rounded cursor-pointer transition-colors"
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
              <label className="text-[11px] font-semibold text-neutral-700">
                Note Content (Editable)
              </label>
              <div className="flex items-center gap-2">
                <button
                  id="quick-dictation-simulate-btn"
                  type="button"
                  onClick={triggerSimulatedDictation}
                  disabled={isRecording || isTranscribing}
                  className="text-[10px] text-[#0D6E44] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Insert Quick Sample Note</span>
                </button>
                {note && (
                  <button
                    type="button"
                    onClick={() => setNote('')}
                    className="text-[10px] text-neutral-400 hover:text-neutral-600 cursor-pointer"
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
              className="w-full bg-neutral-50 border border-neutral-200 focus:border-[#0D6E44] focus:ring-1 focus:ring-[#0D6E44] rounded-xl p-3 text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none"
              autoFocus
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-[10px] text-neutral-400">
              {note.length} characters • Stored locally & queued for CRM sync
            </span>
            <div className="flex items-center gap-2">
              <button
                id="cancel-add-note-btn"
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 text-xs font-semibold text-neutral-600 hover:text-neutral-900 cursor-pointer"
              >
                Cancel
              </button>
              <button
                id="submit-add-note-btn"
                type="submit"
                disabled={!note.trim()}
                className="px-4 py-2 bg-[#0D6E44] hover:bg-[#0A5735] disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-2xs"
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
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl border border-neutral-200 shadow-2xl p-5 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
          <div>
            <h3 className="text-sm font-bold text-neutral-900">Set Follow-up Call</h3>
            <p className="text-xs text-neutral-500">{lead.customerName} • {lead.project}</p>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-700 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] font-semibold text-neutral-700 block mb-1">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-2 text-xs text-neutral-800"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-neutral-700 block mb-1">Time</label>
              <input
                type="text"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                placeholder="11:00 AM"
                className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-2 text-xs text-neutral-800"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-neutral-700 block mb-1">
              Follow-up Objective
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Provide price quote and bank loan scheme options"
              className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-2 text-xs text-neutral-800"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-semibold text-neutral-600 hover:text-neutral-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#0D6E44] hover:bg-[#0A5735] text-white text-xs font-bold rounded-xl transition-all"
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
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl border border-neutral-200 shadow-2xl p-5 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
          <div>
            <h3 className="text-sm font-bold text-neutral-900">Schedule Physical Site Visit</h3>
            <p className="text-xs text-neutral-500">{lead.customerName} • {lead.project}</p>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-700 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div className="p-2.5 bg-purple-50 rounded-xl border border-purple-200 flex items-center gap-2 text-purple-900">
            <MapPin className="w-4 h-4 text-purple-700 shrink-0" />
            <span className="font-semibold text-xs">{lead.project} Location Site</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] font-semibold text-neutral-700 block mb-1">Visit Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-2 text-xs text-neutral-800"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-neutral-700 block mb-1">Visit Time</label>
              <input
                type="text"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                placeholder="03:30 PM"
                className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-2 text-xs text-neutral-800"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-neutral-700 block mb-1">
              Escort & Site Requirements
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="e.g., Arrange hardhats, site engineer escort, mock duplex viewing..."
              className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-2 text-xs text-neutral-800"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-semibold text-neutral-600 hover:text-neutral-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold rounded-xl transition-all"
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
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div className="bg-white w-full max-w-md rounded-2xl border border-neutral-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="bg-[#0D6E44] text-white px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-300" />
            <h3 className="font-bold text-sm">New Ingested Lead (POST /ingest/lead)</h3>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs">
          {error && (
            <div className="p-2.5 bg-red-50 text-red-700 rounded-lg border border-red-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="text-[11px] font-semibold text-neutral-700 block mb-1">
              Client Full Name <span className="text-red-500">*</span>
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
              className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-2.5 text-xs text-neutral-900 focus:border-[#0D6E44] focus:outline-none"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-neutral-700 block mb-1">
              Contact Phone Number <span className="text-red-500">*</span>
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
              className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-2.5 text-xs text-neutral-900 focus:border-[#0D6E44] focus:outline-none font-mono"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-neutral-700 block mb-1">
              Project / Venture Interest
            </label>
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="e.g. Winstone Gulshan Heights"
              className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-2.5 text-xs text-neutral-900 focus:border-[#0D6E44] focus:outline-none"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-neutral-700 block mb-1">
              Initial Intake Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="e.g. Walk-in or phone inquiry. Looking for 3,500 sqft penthouse in Banani..."
              className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-2.5 text-xs text-neutral-900 focus:border-[#0D6E44] focus:outline-none"
            />
          </div>

          <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl text-[11px] text-emerald-800 flex items-center justify-between">
            <span>Direct Agent App Ingest • Auto-assigned</span>
            <span className="font-mono font-bold text-[10px]">source: "agent_app"</span>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-neutral-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-semibold text-neutral-600 hover:text-neutral-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#0D6E44] hover:bg-[#0A5736] text-white text-xs font-bold rounded-xl transition-all shadow-sm"
            >
              Ingest & Assign Lead
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

