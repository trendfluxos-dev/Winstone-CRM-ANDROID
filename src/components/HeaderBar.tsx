import React from 'react';
import { Building2, Wifi, WifiOff, RefreshCw, ArrowLeft } from 'lucide-react';
import { NavTab, SyncEngineStatus, Agent } from '../types';

interface HeaderBarProps {
  currentTab: NavTab;
  isDetailView: boolean;
  onBackToTabs?: () => void;
  title?: string;
  subtitle?: string;
  onOpenSyncMonitor?: () => void;
  syncStatus?: SyncEngineStatus;
  agent?: Agent;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  currentTab,
  isDetailView,
  onBackToTabs,
  title,
  subtitle,
  onOpenSyncMonitor,
  syncStatus,
  agent,
}) => {
  const getTabTitle = () => {
    if (isDetailView && title) return title;
    switch (currentTab) {
      case 'dashboard':
        return 'Winstone Agent';
      case 'leads':
        return 'Leads Management';
      case 'followups':
        return 'Follow-up Schedule';
      case 'performance':
        return 'Agent Performance';
      case 'profile':
        return 'Agent Profile';
      default:
        return 'Winstone Agent';
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return 'AG';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const isOnline = syncStatus?.isOnline ?? true;
  const isSyncing = syncStatus?.isSyncing ?? false;
  const pendingCount = syncStatus?.pendingCount ?? 0;

  return (
    <header
      id="winstone-header-bar"
      className="bg-white border-b border-neutral-200/90 px-4 py-3 flex items-center justify-between z-20 shrink-0 sticky top-0 shadow-[0_1px_3px_rgba(0,0,0,0.02)]"
    >
      <div className="flex items-center gap-2.5 min-w-0">
        {isDetailView ? (
          <button
            id="header-back-btn"
            onClick={onBackToTabs}
            className="p-1.5 -ml-1 rounded-lg text-neutral-700 hover:bg-neutral-100 active:bg-neutral-200 transition-colors focus:outline-none cursor-pointer"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        ) : (
          <div className="w-8 h-8 rounded-lg bg-[#0D6E44] flex items-center justify-center text-white shadow-xs shrink-0">
            <Building2 className="w-4 h-4" />
          </div>
        )}

        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <h1 className="text-base font-bold text-neutral-900 truncate leading-tight tracking-tight">
              {getTabTitle()}
            </h1>
            {!isDetailView && currentTab === 'dashboard' && (
              <span className="bg-[#0D6E44]/10 text-[#0D6E44] text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                Phase 3
              </span>
            )}
          </div>
          <p className="text-[11px] text-neutral-500 truncate leading-none mt-0.5">
            {isDetailView && subtitle ? subtitle : 'Winstone Properties Ltd. • Internal Sales CRM'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          id="sync-status-indicator"
          onClick={onOpenSyncMonitor}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs transition-colors cursor-pointer border ${
            !isOnline
              ? 'bg-amber-50 border-amber-200 text-amber-800'
              : pendingCount > 0
              ? 'bg-blue-50 border-blue-200 text-blue-800'
              : 'bg-neutral-100 border-neutral-200/80 text-neutral-700 hover:bg-neutral-200/80'
          }`}
          title="Data Synchronization & Architecture Monitor"
        >
          {isSyncing ? (
            <RefreshCw className="w-3 h-3 text-[#0D6E44] animate-spin" />
          ) : isOnline ? (
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          ) : (
            <span className="w-2 h-2 rounded-full bg-amber-500" />
          )}

          {isOnline ? (
            <Wifi className="w-3 h-3 text-neutral-600" />
          ) : (
            <WifiOff className="w-3 h-3 text-amber-600" />
          )}

          <span className="text-[11px] font-semibold hidden sm:inline">
            {!isOnline
              ? 'Field Offline • Local data saved'
              : isSyncing
              ? 'Syncing…'
              : pendingCount > 0
              ? `Pending CRM sync (${pendingCount})`
              : syncStatus?.statusLabel || 'CRM connection not configured'}
          </span>
        </button>

        <div className="w-7 h-7 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-800 text-xs font-bold shadow-2xs">
          {getInitials(agent?.name)}
        </div>
      </div>
    </header>
  );
};
