import React, { useState } from 'react';
import {
  ArrowLeft,
  Wifi,
  WifiOff,
  RefreshCw,
  ChevronDown,
  Layers,
  TrendingUp,
  Terminal,
  UserCheck,
  Check,
} from 'lucide-react';
import { NavigationTab, AgentProfile, SyncEngineStatus } from '../types';
import { WinstoneLogo } from './WinstoneLogo';

interface HeaderBarProps {
  currentTab: NavigationTab;
  isDetailView: boolean;
  onBackToTabs: () => void;
  agent?: AgentProfile;
  syncStatus?: SyncEngineStatus;
  onOpenSyncMonitor?: () => void;
  subtitle?: string;
  onSwitchDeck?: (deck: NavigationTab) => void;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  currentTab,
  isDetailView,
  onBackToTabs,
  agent,
  syncStatus,
  onOpenSyncMonitor,
  subtitle,
  onSwitchDeck,
}) => {
  const [showDeckMenu, setShowDeckMenu] = useState(false);

  const getTabTitle = () => {
    if (isDetailView) {
      return 'Lead Dossier';
    }
    switch (currentTab) {
      case 'dashboard':
        return 'Winstone Agent';
      case 'leads':
        return 'Prospects Pipeline';
      case 'followups':
        return 'Follow-up Schedule';
      case 'performance':
        return 'Sales Diagnostics';
      case 'profile':
        return 'Agent Identity';
      case 'coordinator':
        return 'Coordinator Deck';
      case 'executive':
        return 'Executive HQ';
      case 'it_console':
        return 'IT Console';
      default:
        return 'Winstone Agent';
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return 'WA';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const isOnline = syncStatus?.isOnline ?? true;
  const isSyncing = syncStatus?.isSyncing ?? false;
  const pendingCount = syncStatus?.pendingCount ?? 0;

  const deckOptions = [
    { id: 'dashboard' as NavigationTab, label: 'Sales Agent Cockpit', icon: UserCheck, role: 'Field Agent' },
    { id: 'coordinator' as NavigationTab, label: 'Coordinator Deck', icon: Layers, role: 'Dispatch & Ops' },
    { id: 'executive' as NavigationTab, label: 'Executive HQ', icon: TrendingUp, role: 'Macro KPIs' },
    { id: 'it_console' as NavigationTab, label: 'IT Console & Bridge', icon: Terminal, role: 'System Admin' },
  ];

  return (
    <header
      id="winstone-header-bar"
      className="bg-white border-b border-[#E5E7EB] px-3.5 py-2.5 flex items-center justify-between z-20 shrink-0 sticky top-0 shadow-xs relative"
    >
      <div className="flex items-center gap-2 min-w-0">
        {isDetailView ? (
          <button
            id="header-back-btn"
            onClick={onBackToTabs}
            className="p-1.5 -ml-1 rounded-lg text-[#1E293B] hover:bg-[#F1F5F9] active:bg-[#E2E8F0] transition-colors focus:outline-none cursor-pointer border border-[#E2E8F0]"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5 text-[#334155]" />
          </button>
        ) : (
          <WinstoneLogo size="sm" variant="emblem" className="shrink-0" />
        )}

        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <h1 className="text-sm sm:text-base font-extrabold text-[#0F172A] truncate leading-tight tracking-tight">
              {getTabTitle()}
            </h1>

            {/* Deck Selector Button */}
            {onSwitchDeck && !isDetailView && (
              <div className="relative">
                <button
                  onClick={() => setShowDeckMenu(!showDeckMenu)}
                  className="bg-[#FAF6EE] text-[#8C6B24] hover:bg-[#F5EEDD] border border-[#E8DFCF] text-[9.5px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 cursor-pointer uppercase tracking-wider"
                  title="Switch Deck / Role"
                >
                  <span>
                    {currentTab === 'coordinator'
                      ? 'Coordinator'
                      : currentTab === 'executive'
                      ? 'Executive HQ'
                      : currentTab === 'it_console'
                      ? 'IT Console'
                      : 'Agent'}
                  </span>
                  <ChevronDown className="w-2.5 h-2.5 text-[#8C6B24]" />
                </button>

                {showDeckMenu && (
                  <div className="absolute left-0 top-7 bg-white border border-[#E5E7EB] rounded-xl shadow-xl p-1.5 w-52 z-50 text-left space-y-1 animate-in fade-in">
                    <span className="text-[9px] font-bold text-[#6B7280] uppercase px-2 py-1 block tracking-wider">
                      Switch Role Workspace:
                    </span>
                    {deckOptions.map((opt) => {
                      const Icon = opt.icon;
                      const isSelected =
                        (currentTab === opt.id) ||
                        (opt.id === 'dashboard' && ['dashboard', 'leads', 'followups', 'performance', 'profile'].includes(currentTab));
                      return (
                        <button
                          key={opt.id}
                          onClick={() => {
                            onSwitchDeck(opt.id);
                            setShowDeckMenu(false);
                          }}
                          className={`w-full p-2 rounded-lg text-left flex items-center justify-between text-xs transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-[#FAF6EE] text-[#8C6B24] font-bold border border-[#E8DFCF]'
                              : 'text-[#374151] hover:bg-[#F9FAFB]'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-[#B8934A]' : 'text-[#6B7280]'}`} />
                            <div>
                              <div className="text-xs font-bold leading-tight">{opt.label}</div>
                              <div className="text-[9px] text-[#6B7280]">{opt.role}</div>
                            </div>
                          </div>
                          {isSelected && <Check className="w-3.5 h-3.5 text-[#8C6B24]" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
          <p className="text-[10px] text-[#64748B] truncate leading-none mt-0.5 font-normal">
            {isDetailView && subtitle ? subtitle : 'Winstone Properties Ltd. • Luxury Real Estate CRM'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <button
          id="sync-status-indicator"
          onClick={onOpenSyncMonitor}
          className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs transition-colors cursor-pointer border shadow-2xs ${
            !isOnline
              ? 'bg-amber-50 border-amber-200 text-amber-800'
              : pendingCount > 0
              ? 'bg-blue-50 border-blue-200 text-blue-700'
              : 'bg-[#FAF9F6] border-[#E8DFCF] text-[#334155] hover:bg-[#F5F2EA]'
          }`}
          title="Data Synchronization & Architecture Monitor"
        >
          {isSyncing ? (
            <RefreshCw className="w-3 h-3 text-[#B8934A] animate-spin" />
          ) : isOnline ? (
            <span className="w-2 h-2 rounded-full bg-[#10B981]" />
          ) : (
            <span className="w-2 h-2 rounded-full bg-amber-500" />
          )}

          {isOnline ? (
            <Wifi className="w-3 h-3 text-[#B8934A]" />
          ) : (
            <WifiOff className="w-3 h-3 text-amber-600" />
          )}

          <span className="text-[10px] font-bold hidden sm:inline">
            {!isOnline
              ? 'Offline'
              : isSyncing
              ? 'Syncing…'
              : pendingCount > 0
              ? `Queue (${pendingCount})`
              : 'CRM Ready'}
          </span>
        </button>

        <div className="w-7 h-7 rounded-full bg-[#FAF6EE] border border-[#E8DFCF] flex items-center justify-center text-[#8C6B24] text-xs font-extrabold shadow-2xs">
          {getInitials(agent?.name)}
        </div>
      </div>
    </header>
  );
};
