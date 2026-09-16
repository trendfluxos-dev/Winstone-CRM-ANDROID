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
  Check,
  X,
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
          setLifecycleState('ringing');
          setStatusLog('Incoming call ringing...');
        }
      } catch (err) {
        console.warn('[CallScreen] Telephony sequence notice:', err);
        setLifecycleState('answered');
        setStatusLog('Call in progress (local buffer)');
      }
    };

    runCallSequence();

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [lead.id, isIncoming, callUid]);

  // Duration Timer
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (lifecycleState === 'answered') {
      interval = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [lifecycleState]);

  const handleHangup = async () => {
    setLifecycleState('completed');
    setStatusLog('Finalizing call & logging telemetry...');

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
      className="flex-1 flex flex-col justify-between bg-[#F8F9FA] text-[#0F172A] p-6 relative overflow-hidden select-none"
    >
      {/* Top Bar: Telephony Architecture Banner & Status */}
      <div className="space-y-2 z-10">
        <div className="bg-white border border-[#E5E7EB] rounded-xl px-3.5 py-2 flex items-center justify-between text-[11px] text-[#334155] shadow-xs">
          <div className="flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-[#B8934A] animate-pulse" />
            <span className="font-semibold text-[#8C6B24]">Winstone Agent Telephony</span>
          </div>
          <span className="text-[10px] text-[#8C6B24] font-mono bg-[#FAF6EE] px-2 py-0.5 rounded border border-[#E8DFCF] font-bold">
            {lifecycleState.toUpperCase()}
          </span>
        </div>

        {/* Live Server State Transition Log */}
        <div className="flex items-center justify-center gap-1.5 py-1">
          <span className={`w-2 h-2 rounded-full ${lifecycleState === 'answered' ? 'bg-[#B8934A] shadow-[0_0_6px_rgba(184,147,74,0.8)]' : 'bg-amber-500 animate-ping'}`} />
          <span className="text-xs font-medium text-[#64748B]">
            {statusLog}
          </span>
        </div>
      </div>

      {/* Middle Section: Prospect Info & Audio Visualizer */}
      <div className="text-center space-y-4 my-auto z-10">
        <div className="w-24 h-24 mx-auto rounded-full bg-[#FAF6EE] border-2 border-[#E8DFCF] flex items-center justify-center text-3xl font-extrabold text-[#8C6B24] shadow-md">
          {lead.customerName.charAt(0)}
        </div>

        <div>
          <h2 className="text-xl font-bold tracking-tight text-[#0F172A]">
            {lead.customerName}
          </h2>
          <p className="text-sm font-mono text-[#8C6B24] font-semibold mt-0.5">{lead.phone}</p>
          <p className="text-xs text-[#64748B] mt-1 flex items-center justify-center gap-1">
            <Building2 className="w-3.5 h-3.5 text-[#B8934A]" />
            <span>{lead.project}</span>
          </p>
        </div>

        {/* Call Duration & Status */}
        <div className="space-y-1">
          <div className="text-3xl font-mono font-bold tracking-wider text-[#0F172A]">
            {lifecycleState === 'answered' ? formatDuration(seconds) : '00:00'}
          </div>
          <p className="text-xs text-[#8C6B24] font-semibold tracking-wide">
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
                className="w-1 bg-[#B8934A] rounded-full transition-all duration-300 animate-pulse"
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
        <div className="absolute inset-x-4 top-20 bottom-36 bg-white rounded-2xl border border-[#E5E7EB] p-4 flex flex-col z-20 shadow-2xl">
          <div className="flex items-center justify-between pb-2 border-b border-[#F1F5F9]">
            <span className="text-xs font-bold text-[#8C6B24]">In-Call Note Scratchpad</span>
            <button
              onClick={() => setShowNotesDrawer(false)}
              className="text-[#94A3B8] hover:text-[#0F172A] p-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <textarea
            value={inCallNote}
            onChange={(e) => setInCallNote(e.target.value)}
            placeholder="Type quick key customer remarks during call..."
            className="flex-1 w-full bg-[#F8FAFC] text-xs p-3 rounded-xl border border-[#E2E8F0] mt-3 text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#B8934A]"
            autoFocus
          />
          <button
            onClick={() => setShowNotesDrawer(false)}
            className="mt-3 w-full bg-[#B8934A] hover:bg-[#A68035] text-white text-xs font-bold py-2 rounded-xl flex items-center justify-center gap-1 cursor-pointer shadow-xs active:scale-95"
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
            className={`w-14 h-14 rounded-full flex flex-col items-center justify-center transition-all cursor-pointer ${
              isMuted
                ? 'bg-rose-50 text-rose-600 border border-rose-300'
                : 'bg-white text-[#334155] hover:bg-[#FAF9F6] border border-[#E2E8F0] shadow-xs'
            }`}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            <span className="text-[10px] mt-0.5">{isMuted ? 'Muted' : 'Mute'}</span>
          </button>

          {/* Notes */}
          <button
            id="btn-call-notes"
            onClick={() => setShowNotesDrawer(!showNotesDrawer)}
            className={`w-14 h-14 rounded-full flex flex-col items-center justify-center transition-all cursor-pointer ${
              inCallNote
                ? 'bg-[#B8934A] text-white shadow-md'
                : 'bg-white text-[#334155] hover:bg-[#FAF9F6] border border-[#E2E8F0] shadow-xs'
            }`}
          >
            <FileEdit className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Notes</span>
          </button>

          {/* Speaker */}
          <button
            id="btn-call-speaker"
            onClick={() => setIsSpeaker(!isSpeaker)}
            className={`w-14 h-14 rounded-full flex flex-col items-center justify-center transition-all cursor-pointer ${
              isSpeaker
                ? 'bg-[#FAF6EE] text-[#8C6B24] border border-[#E8DFCF]'
                : 'bg-white text-[#334155] hover:bg-[#FAF9F6] border border-[#E2E8F0] shadow-xs'
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
            className="w-16 h-16 rounded-full bg-rose-600 hover:bg-rose-700 active:scale-95 text-white flex items-center justify-center shadow-lg transition-all cursor-pointer"
            title="End Call & Open CRM Report"
          >
            <PhoneOff className="w-7 h-7" />
          </button>
        </div>
      </div>
    </div>
  );
};
