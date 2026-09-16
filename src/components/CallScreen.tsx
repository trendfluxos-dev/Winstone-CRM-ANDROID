import React, { useState, useEffect } from 'react';
import {
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  FileEdit,
  Radio,
  Building2,
  ShieldCheck,
  Check,
  X,
  PhoneCall,
  Activity,
} from 'lucide-react';
import { Lead } from '../types';
import { crmDataSource } from '../api/crmDataSource';
import { authRepository } from '../repositories/authRepository';
import { winstoneRoomDb } from '../data/roomDatabase';

export type CallLifecycleState = 'initiated' | 'ringing' | 'answered' | 'completed';

interface CallScreenProps {
  lead: Lead;
  isIncoming?: boolean;
  onEndCall: (durationSeconds: number, inCallNote: string, callUid: string) => void;
}

export const CallScreen: React.FC<CallScreenProps> = ({ lead, isIncoming = false, onEndCall }) => {
  const [lifecycleState, setLifecycleState] = useState<CallLifecycleState>('initiated');
  const [seconds, setSeconds] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(false);
  const [showNotesDrawer, setShowNotesDrawer] = useState(false);
  const [inCallNote, setInCallNote] = useState('');
  const [callUid] = useState(`call-uid-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`);
  const [statusLog, setStatusLog] = useState<string>('Initiating CRM call session...');

  // Telephony State Machine & CRM Telemetry
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;

    const runCallSequence = async () => {
      const session = authRepository.getSession();
      const agentPhone = session?.phone || '+8801711000000';
      const employeeId = session?.employee_id || 'WPL-AGT-0842';

      try {
        if (!isIncoming) {
          // 1. OUTGOING: Call Start
          setStatusLog('Emitting /api/public/agent/call-start...');
          await crmDataSource.callStart({ lead_id: lead.id }).catch((err) => {
            console.warn('[CallScreen] callStart sync queued or deferred:', err);
            // Queue offline
            winstoneRoomDb.enqueue({
              operationType: 'CALL_START',
              entityType: 'lead',
              entityId: lead.id,
              payload: { lead_id: lead.id },
            });
          });

          // Presence: on_call
          await crmDataSource.presence({
            employee_id: employeeId,
            presence: 'on_call',
            call_started_at: new Date().toISOString(),
            lead_id: lead.id,
          }).catch(() => {});

          // Transition: initiated -> ringing
          setTimeout(async () => {
            setLifecycleState('ringing');
            setStatusLog('Ringing customer line...');
            await crmDataSource.callState({
              call_uid: callUid,
              lead_id: lead.id,
              state: 'ringing',
              duration_seconds: 0,
              agent_phone: agentPhone,
              recording_supported: false,
              recording_note: 'Microphone audio only',
            }).catch(() => {});

            // Ringing -> answered after 2 seconds
            setTimeout(async () => {
              setLifecycleState('answered');
              setStatusLog('Call connected • Voice active');
              await crmDataSource.callState({
                call_uid: callUid,
                lead_id: lead.id,
                state: 'answered',
                duration_seconds: 0,
                agent_phone: agentPhone,
                recording_supported: false,
                recording_note: 'Microphone audio only',
              }).catch(() => {});
            }, 2000);
          }, 1200);
        } else {
          // INCOMING:
          setStatusLog('Incoming call detected...');
          setLifecycleState('ringing');
          await crmDataSource.incomingCall({
            call_uid: callUid,
            phone_number: lead.phone,
            state: 'ringing',
            duration_seconds: 0,
            recording_supported: false,
            recording_note: 'Microphone audio only',
            direction: 'incoming',
          }).catch(() => {});

          setTimeout(async () => {
            setLifecycleState('answered');
            setStatusLog('Incoming call connected');
          }, 1500);
        }
      } catch (err: any) {
        console.warn('[CallScreen] Call lifecycle emission notice:', err);
      }
    };

    runCallSequence();

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [lead, isIncoming, callUid]);

  // Live timer ticks once answered
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (lifecycleState === 'answered') {
      timer = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [lifecycleState]);

  const handleHangup = async () => {
    setLifecycleState('completed');
    setStatusLog('Call completed • Opening post-call report...');

    const session = authRepository.getSession();
    const agentPhone = session?.phone || '+8801711000000';
    const employeeId = session?.employee_id || 'WPL-AGT-0842';

    // Emit final call-state: completed
    try {
      await crmDataSource.callState({
        call_uid: callUid,
        lead_id: lead.id,
        state: 'completed',
        duration_seconds: seconds,
        agent_phone: agentPhone,
        recording_supported: false,
        recording_note: 'Microphone audio only',
      }).catch((err) => {
        winstoneRoomDb.enqueue({
          operationType: 'CALL_STATE',
          entityType: 'call',
          entityId: lead.id,
          payload: {
            call_uid: callUid,
            lead_id: lead.id,
            state: 'completed',
            duration_seconds: seconds,
            agent_phone: agentPhone,
            recording_supported: false,
            recording_note: 'Microphone audio only',
          },
        });
      });

      // Presence -> idle
      await crmDataSource.presence({
        employee_id: employeeId,
        presence: 'idle',
        call_started_at: new Date().toISOString(),
      }).catch(() => {});
    } catch (err) {
      console.warn('[CallScreen] Hangup emission notice:', err);
    }

    onEndCall(seconds, inCallNote, callUid);
  };

  const formatDuration = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div
      id="active-call-screen"
      className="flex-1 flex flex-col justify-between bg-neutral-900 text-white p-6 relative overflow-hidden select-none"
    >
      {/* Top Bar: Telephony Architecture Banner & Status */}
      <div className="space-y-2 z-10">
        <div className="bg-neutral-800/90 border border-neutral-700/80 rounded-lg px-3 py-1.5 flex items-center justify-between text-[11px] text-neutral-300 backdrop-blur-xs">
          <div className="flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span className="font-semibold text-emerald-400">Winstone Agent Telephony</span>
          </div>
          <span className="text-[10px] text-emerald-300 font-mono">
            {lifecycleState.toUpperCase()}
          </span>
        </div>

        {/* Live Server State Transition Log */}
        <div className="flex items-center justify-center gap-1.5 py-1">
          <span className={`w-2 h-2 rounded-full ${lifecycleState === 'answered' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400 animate-ping'}`} />
          <span className="text-xs font-medium text-neutral-300">
            {statusLog}
          </span>
        </div>
      </div>

      {/* Middle Section: Prospect Info & Audio Visualizer */}
      <div className="text-center space-y-4 my-auto z-10">
        <div className="w-24 h-24 mx-auto rounded-full bg-emerald-950 border-2 border-emerald-500/40 flex items-center justify-center text-3xl font-extrabold text-emerald-300 shadow-[0_0_30px_rgba(13,110,68,0.3)]">
          {lead.customerName.charAt(0)}
        </div>

        <div>
          <h2 className="text-xl font-bold tracking-tight text-white">
            {lead.customerName}
          </h2>
          <p className="text-sm font-mono text-emerald-400 mt-0.5">{lead.phone}</p>
          <p className="text-xs text-neutral-400 mt-1 flex items-center justify-center gap-1">
            <Building2 className="w-3 h-3 text-neutral-400" />
            <span>{lead.project}</span>
          </p>
        </div>

        {/* Call Duration & Status */}
        <div className="space-y-1">
          <div className="text-3xl font-mono font-bold tracking-wider text-white">
            {lifecycleState === 'answered' ? formatDuration(seconds) : '00:00'}
          </div>
          <p className="text-xs text-emerald-400 font-medium tracking-wide">
            {lifecycleState === 'initiated' && 'Setting up outbound connection…'}
            {lifecycleState === 'ringing' && 'Ringing handset…'}
            {lifecycleState === 'answered' && 'HD Voice Call In Progress'}
            {lifecycleState === 'completed' && 'Call Terminated'}
          </p>
        </div>

        {/* Live Audio Visualizer Bars */}
        {lifecycleState === 'answered' && (
          <div className="flex items-center justify-center gap-1.5 h-8">
            {[24, 40, 18, 48, 32, 56, 28, 44, 20].map((h, i) => (
              <div
                key={i}
                className="w-1 bg-emerald-500/80 rounded-full transition-all duration-300 animate-pulse"
                style={{
                  height: isMuted ? '6px' : `${Math.max(6, (h * ((seconds % 4) + 1)) / 3)}px`,
                  animationDelay: `${i * 80}ms`,
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* In-Call Note Drawer if open */}
      {showNotesDrawer && (
        <div className="absolute inset-x-4 top-20 bottom-36 bg-neutral-800 rounded-2xl border border-neutral-700 p-4 flex flex-col z-20 shadow-2xl">
          <div className="flex items-center justify-between pb-2 border-b border-neutral-700">
            <span className="text-xs font-bold text-neutral-200">In-Call Note Scratchpad</span>
            <button
              onClick={() => setShowNotesDrawer(false)}
              className="text-neutral-400 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <textarea
            value={inCallNote}
            onChange={(e) => setInCallNote(e.target.value)}
            placeholder="Type quick key customer remarks during call..."
            className="flex-1 w-full bg-neutral-900 text-xs p-3 rounded-xl border border-neutral-700 mt-3 text-white placeholder:text-neutral-500 focus:outline-none focus:border-emerald-500"
            autoFocus
          />
          <button
            onClick={() => setShowNotesDrawer(false)}
            className="mt-3 w-full bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold py-2 rounded-lg flex items-center justify-center gap-1"
          >
            <Check className="w-3.5 h-3.5" /> Save to Scratchpad
          </button>
        </div>
      )}

      {/* Bottom In-Call Controls */}
      <div className="space-y-6 z-10">
        <div className="flex items-center justify-center gap-6">
          {/* Mute */}
          <button
            id="btn-call-mute"
            onClick={() => setIsMuted(!isMuted)}
            className={`w-14 h-14 rounded-full flex flex-col items-center justify-center transition-all ${
              isMuted
                ? 'bg-red-500/20 text-red-400 border border-red-500'
                : 'bg-neutral-800 text-neutral-200 hover:bg-neutral-700 border border-neutral-700'
            }`}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            <span className="text-[10px] mt-0.5">{isMuted ? 'Muted' : 'Mute'}</span>
          </button>

          {/* Notes */}
          <button
            id="btn-call-notes"
            onClick={() => setShowNotesDrawer(!showNotesDrawer)}
            className={`w-14 h-14 rounded-full flex flex-col items-center justify-center transition-all ${
              inCallNote
                ? 'bg-emerald-600 text-white'
                : 'bg-neutral-800 text-neutral-200 hover:bg-neutral-700 border border-neutral-700'
            }`}
          >
            <FileEdit className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Notes</span>
          </button>

          {/* Speaker */}
          <button
            id="btn-call-speaker"
            onClick={() => setIsSpeaker(!isSpeaker)}
            className={`w-14 h-14 rounded-full flex flex-col items-center justify-center transition-all ${
              isSpeaker
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500'
                : 'bg-neutral-800 text-neutral-200 hover:bg-neutral-700 border border-neutral-700'
            }`}
          >
            {isSpeaker ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            <span className="text-[10px] mt-0.5">Speaker</span>
          </button>
        </div>

        {/* End Call Button */}
        <div className="flex justify-center pb-2">
          <button
            id="btn-end-call"
            onClick={handleHangup}
            className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 active:scale-95 text-white flex items-center justify-center shadow-[0_0_25px_rgba(220,38,38,0.5)] transition-all"
            title="End Call & Open CRM Report"
          >
            <PhoneOff className="w-7 h-7" />
          </button>
        </div>
      </div>
    </div>
  );
};

