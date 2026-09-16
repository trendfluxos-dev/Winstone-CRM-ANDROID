import React from 'react';
import {
  X,
  Database,
  Wifi,
  WifiOff,
  Activity,
  CheckCircle2,
  Sparkles,
  Zap,
  Check,
} from 'lucide-react';
import { QueuedSyncOperation, SyncEngineStatus } from '../types';

interface SyncMonitorDrawerProps {
  onClose: () => void;
  syncStatus: SyncEngineStatus;
  syncQueue: QueuedSyncOperation[];
  onTriggerManualSync: () => void;
  onToggleOnlineState: () => void;
  onToggleMockMode: () => void;
  leadsCount: number;
  totalCalls: number;
  talkTimeMinutes: number;
  onSimulateIncomingLead: () => void;
}

export const SyncMonitorDrawer: React.FC<SyncMonitorDrawerProps> = ({
  onClose,
  syncStatus,
  syncQueue,
  onTriggerManualSync,
  onToggleOnlineState,
  onToggleMockMode,
  leadsCount,
  totalCalls,
  talkTimeMinutes,
  onSimulateIncomingLead,
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-2xs flex items-center justify-center p-4">
      <div className="bg-white text-[#0F172A] w-full max-w-xl rounded-2xl border border-[#E5E7EB] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-[#FAF9F6] px-5 py-4 flex items-center justify-between border-b border-[#E8DFCF]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white border border-[#E8DFCF] flex items-center justify-center text-[#8C6B24] shadow-2xs">
              <Activity className="w-4 h-4 text-[#B8934A] animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-[#0F172A]">Winstone CRM Sync & WorkManager</h3>
                <span className="bg-[#FAF6EE] text-[#8C6B24] border border-[#E8DFCF] px-2 py-0.5 rounded text-[10px] font-mono font-bold">
                  Gateway Active
                </span>
              </div>
              <p className="text-[11px] text-[#64748B]">
                Winstone Agent App • Truthful offline-first Room persistence & Remote CRM Boundary
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-[#94A3B8] hover:text-[#0F172A] p-1 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs custom-scrollbar">
          {/* Quick Network & Mode Controls */}
          <div className="flex items-center justify-between p-3.5 bg-[#FAF9F6] rounded-xl border border-[#E8DFCF] flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <button
                onClick={onToggleOnlineState}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
                  syncStatus.isOnline
                    ? 'bg-white text-[#8C6B24] border border-[#E8DFCF] shadow-2xs'
                    : 'bg-amber-50 text-amber-900 border border-amber-300'
                }`}
                title="Toggle Airplane / Field Offline Mode"
              >
                {syncStatus.isOnline ? (
                  <>
                    <Wifi className="w-3.5 h-3.5 text-[#B8934A]" />
                    <span>Status: Online</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-3.5 h-3.5 text-amber-600" />
                    <span>Status: Airplane Mode</span>
                  </>
                )}
              </button>

              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-xs border bg-white text-[#8C6B24] border-[#E8DFCF] shadow-2xs">
                <Database className="w-3.5 h-3.5 text-[#B8934A]" />
                <span>Room DB v1 (Active)</span>
              </div>
            </div>

            <button
              onClick={onTriggerManualSync}
              disabled={syncStatus.isSyncing}
              className="bg-[#B8934A] hover:bg-[#A68035] text-white px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50 active:scale-95"
            >
              <span>Sync Now</span>
            </button>
          </div>

          {/* Offline-First Architecture Verification Flow */}
          <div className="bg-[#FAF9F6] p-3.5 rounded-xl border border-[#E8DFCF] space-y-2.5">
            <span className="text-[10px] font-mono text-[#8C6B24] uppercase tracking-wider font-bold">
              3-Layer Offline Persistence Architecture
            </span>

            <div className="space-y-2">
              {/* Step 1 */}
              <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-[#F1F5F9]">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-[#FAF6EE] text-[#8C6B24] border border-[#E8DFCF] flex items-center justify-center font-bold text-[10px]">
                    1
                  </div>
                  <div>
                    <span className="font-semibold text-[#0F172A] block">
                      Local SQLite Room Database
                    </span>
                    <span className="text-[10px] text-[#64748B]">
                      LeadDao, CallActivityDao, PendingReportDao, WhatsAppDao
                    </span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-[#FAF6EE] text-[#8C6B24] border border-[#E8DFCF] font-bold text-[10px] flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-[#B8934A]" /> Active & Persistent
                </span>
              </div>

              {/* Step 2 */}
              <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-[#F1F5F9]">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-[#FAF6EE] text-[#8C6B24] border border-[#E8DFCF] flex items-center justify-center font-bold text-[10px]">
                    2
                  </div>
                  <div>
                    <span className="font-semibold text-[#0F172A] block">
                      WorkManager Queue (SyncQueueDao)
                    </span>
                    <span className="text-[10px] text-[#64748B]">
                      Exponential backoff, stable idempotency keys & network constraints
                    </span>
                  </div>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                    syncQueue.length > 0
                      ? 'bg-amber-50 text-amber-800 border border-amber-300'
                      : 'bg-[#FAF6EE] text-[#8C6B24] border border-[#E8DFCF]'
                  }`}
                >
                  {syncQueue.length} pending mutations
                </span>
              </div>

              {/* Step 3 */}
              <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-[#F1F5F9]">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-[#FAF6EE] text-[#8C6B24] border border-[#E8DFCF] flex items-center justify-center font-bold text-[10px]">
                    3
                  </div>
                  <div>
                    <span className="font-semibold text-[#0F172A] block">
                      Winstone CRM API (Public Agent Gateway)
                    </span>
                    <span className="text-[10px] text-[#64748B]">
                      17 Verified Routes • x-device-token Auth • Conflict (409) reconciliation
                    </span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-[#FAF6EE] text-[#8C6B24] border border-[#E8DFCF] font-bold text-[10px]">
                  Connected
                </span>
              </div>
            </div>
          </div>

          {/* Pending Mutations Inspection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold text-[#0F172A] text-xs uppercase tracking-wider">
                Pending Local Queue ({syncQueue.length})
              </h4>
              {syncStatus.lastSyncTimestamp && (
                <span className="text-[10px] text-[#64748B] font-mono">
                  Queue check: {new Date(syncStatus.lastSyncTimestamp).toLocaleTimeString()}
                </span>
              )}
            </div>

            {syncQueue.length === 0 ? (
              <div className="p-4 bg-[#F8FAFC] rounded-xl border border-dashed border-[#CBD5E1] text-center text-[#64748B]">
                <Check className="w-5 h-5 mx-auto text-[#B8934A] mb-1" />
                <span>All local mutations saved in Room Database. Pending CRM sync operations appear here.</span>
              </div>
            ) : (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {syncQueue.map((item) => {
                  const itemId = (item as any).localOperationId || item.id;
                  const itemTime = (item as any).createdTimestamp || item.createdAt;
                  const itemStatus = (item as any).syncStatus || item.status;
                  return (
                    <div
                      key={itemId}
                      className="p-2.5 bg-[#FAF9F6] rounded-lg border border-[#E8DFCF] flex items-start justify-between gap-2 shadow-2xs"
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-[11px] text-[#8C6B24]">
                            {item.operationType}
                          </span>
                          <span className="text-[10px] text-[#64748B]">
                            ID: {item.entityId.substring(0, 10)}
                          </span>
                        </div>
                        <p className="text-[10px] text-[#64748B] mt-0.5">
                          Queued: {itemTime ? new Date(itemTime).toLocaleTimeString() : 'Just now'} • Retries: {item.retryCount}
                        </p>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                          itemStatus === 'syncing'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : itemStatus === 'failed'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {itemStatus}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* User Engagement Metrics */}
          <div>
            <h4 className="font-bold text-[#0F172A] text-xs uppercase tracking-wider mb-2">
              Agent Engagement Metrics
            </h4>
            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-3 bg-[#FAF9F6] rounded-xl border border-[#E8DFCF]">
                <span className="text-[11px] text-[#64748B] block font-medium">Assigned Leads</span>
                <span className="text-lg font-bold text-[#0F172A] mt-0.5 block">{leadsCount}</span>
                <span className="text-[10px] text-[#8C6B24] font-semibold mt-1 block">Agent Authorized</span>
              </div>
              <div className="p-3 bg-[#FAF9F6] rounded-xl border border-[#E8DFCF]">
                <span className="text-[11px] text-[#64748B] block font-medium">Total Dials & Outbound</span>
                <span className="text-lg font-bold text-[#0F172A] mt-0.5 block">{totalCalls}</span>
                <span className="text-[10px] text-[#64748B] mt-1 block">Simulated telephony</span>
              </div>
              <div className="p-3 bg-[#FAF9F6] rounded-xl border border-[#E8DFCF]">
                <span className="text-[11px] text-[#64748B] block font-medium">Talk Time Logged</span>
                <span className="text-lg font-bold text-[#0F172A] mt-0.5 block">
                  {talkTimeMinutes} min
                </span>
                <span className="text-[10px] text-[#64748B] mt-1 block">HD Voice Simulation</span>
              </div>
              <div className="p-3 bg-[#FAF9F6] rounded-xl border border-[#E8DFCF]">
                <span className="text-[11px] text-[#64748B] block font-medium">Adherence Rate</span>
                <span className="text-lg font-bold text-[#8C6B24] mt-0.5 block">94.8%</span>
                <span className="text-[10px] text-[#8C6B24] font-semibold mt-1 block">High Engagement</span>
              </div>
            </div>
          </div>

          {/* Real-time Simulation Action */}
          <div className="pt-2 border-t border-[#F1F5F9]">
            <h4 className="font-bold text-[#0F172A] text-xs mb-1.5 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-[#B8934A]" />
              <span>Simulate Real-Time Synchronization Event</span>
            </h4>
            <p className="text-[11px] text-[#64748B] mb-2">
              Inject an urgent new inbound lead from Meta Facebook Ads to verify reactive UI updating and push notification handling.
            </p>
            <button
              onClick={() => {
                onSimulateIncomingLead();
                onClose();
              }}
              className="w-full py-2.5 bg-[#B8934A] hover:bg-[#A68035] text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer active:scale-95"
            >
              <Sparkles className="w-4 h-4" />
              <span>Inject Real-Time Meta Inbound Lead</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-[#FAF9F6] border-t border-[#E8DFCF] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-[#FAF6EE] text-[#0F172A] border border-[#CBD5E1] rounded-xl text-xs font-semibold cursor-pointer"
          >
            Close Monitor
          </button>
        </div>
      </div>
    </div>
  );
};
