import React from 'react';
import {
  Cpu,
  Database,
  Shield,
  Activity,
  Server,
  RefreshCw,
  CheckCircle2,
  Terminal,
  Lock,
  Wifi,
} from 'lucide-react';
import { winstoneRoomDb } from '../data/roomDatabase';
import { services } from '../repositories/serviceLocator';

interface ItConsoleScreenProps {
  onTriggerSync?: () => void;
}

export const ItConsoleScreen: React.FC<ItConsoleScreenProps> = () => {
  const syncQueue = winstoneRoomDb.getAllSyncOperations();
  const leadsCount = winstoneRoomDb.getAllLeads().length;
  const followUpsCount = winstoneRoomDb.getAllFollowUps().length;
  const agent = winstoneRoomDb.getAgent();

  return (
    <div id="it-console-screen" className="flex-1 flex flex-col bg-[#0F172A] text-[#F8FAFC] overflow-y-auto no-scrollbar pb-20 selection:bg-[#FAF0DB] selection:text-[#8C6B24]">
      {/* Terminal Header */}
      <div className="bg-[#1E293B] p-4 border-b border-[#334155] sticky top-0 z-20 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#0F172A] border border-[#334155] flex items-center justify-center text-[#B8934A]">
              <Terminal className="w-4 h-4 text-[#B8934A]" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Winstone IT Console</h2>
              <p className="text-[10px] text-[#94A3B8]">Telephony Bridge & Sync Engine Daemon</p>
            </div>
          </div>
          <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            ONLINE
          </span>
        </div>
      </div>

      <div className="p-4 space-y-4 text-left font-sans">
        {/* Gateway Health Card */}
        <div className="bg-[#1E293B] p-4 rounded-2xl border border-[#334155] space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-[#B8934A]" />
              <span>Gateway Infrastructure</span>
            </h3>
            <span className="text-[10px] font-mono text-[#94A3B8]">TLS 1.3 Certified</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 bg-[#0F172A] rounded-xl border border-[#334155]">
              <span className="text-[10px] text-[#94A3B8] block">CRM API Latency</span>
              <span className="text-sm font-mono font-bold text-emerald-400">42ms</span>
            </div>
            <div className="p-2.5 bg-[#0F172A] rounded-xl border border-[#334155]">
              <span className="text-[10px] text-[#94A3B8] block">Sync Worker State</span>
              <span className="text-sm font-mono font-bold text-[#B8934A]">Worker Active</span>
            </div>
          </div>
        </div>

        {/* Room Database Cache Inspector */}
        <div className="bg-[#1E293B] p-4 rounded-2xl border border-[#334155] space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-[#B8934A]" />
              <span>Local Room SQLite Tables</span>
            </h3>
            <span className="text-[10px] font-mono text-emerald-400">Persistent V2</span>
          </div>

          <div className="space-y-1.5 font-mono text-[11px]">
            <div className="flex items-center justify-between p-2 bg-[#0F172A] rounded-lg border border-[#334155]">
              <span className="text-[#94A3B8]">table: leads_cache</span>
              <span className="text-white font-bold">{leadsCount} records</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-[#0F172A] rounded-lg border border-[#334155]">
              <span className="text-[#94A3B8]">table: follow_ups_cache</span>
              <span className="text-white font-bold">{followUpsCount} records</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-[#0F172A] rounded-lg border border-[#334155]">
              <span className="text-[#94A3B8]">table: sync_mutations_queue</span>
              <span className="text-[#B8934A] font-bold">{syncQueue.length} pending</span>
            </div>
          </div>
        </div>

        {/* Device Security Context */}
        <div className="bg-[#1E293B] p-4 rounded-2xl border border-[#334155] space-y-2.5">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-[#B8934A]" />
              <span>Security & Token Vault</span>
            </h3>
          </div>

          <div className="text-[11px] font-mono text-[#94A3B8] space-y-1 bg-[#0F172A] p-2.5 rounded-xl border border-[#334155]">
            <div>Auth Device: <span className="text-white">SIM-PIXEL-BD-880</span></div>
            <div>Agent Bound: <span className="text-[#B8934A]">{agent?.name} ({agent?.employeeId})</span></div>
            <div>Token Expiry: <span className="text-emerald-400">72 hours (Rolling)</span></div>
          </div>
        </div>

        {/* Corporate Attribution */}
        <div className="text-center text-[10px] text-[#64748B] pt-2 pb-1 space-y-0.5 border-t border-[#334155]/60">
          <p>© 2026 TrendFlux Digital. All Rights Reserved.</p>
          <p className="text-[#B8934A] font-semibold">Developed & Powered by Zahid Hasan Emon.</p>
        </div>
      </div>
    </div>
  );
};
