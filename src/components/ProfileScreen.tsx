import React, { useState } from 'react';
import {
  MapPin,
  Briefcase,
  Hash,
  LogOut,
  HelpCircle,
  Info,
  CheckCircle2,
  ChevronRight,
  FileCode2,
  Smartphone,
} from 'lucide-react';
import { Agent } from '../types';
import { WinstoneLogo } from './WinstoneLogo';
import { AndroidApkBuildModal } from './AndroidApkBuildModal';

interface ProfileScreenProps {
  agent: Agent;
  onLogout: () => void;
  onOpenKotlinViewer?: () => void;
  onNavigateTab?: (tab: string) => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  agent,
  onLogout,
  onOpenKotlinViewer,
  onNavigateTab,
}) => {
  const [showAbout, setShowAbout] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showApkModal, setShowApkModal] = useState(false);

  const getInitials = (name?: string) => {
    if (!name) return 'AG';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div id="profile-screen" className="flex-1 flex flex-col bg-[#F8F9FA] text-[#0F172A] overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24 custom-scrollbar">
        {/* Agent Identity Card */}
        <div className="bg-white rounded-2xl p-4 border border-[#E5E7EB] shadow-xs space-y-3">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-[#FAF6EE] text-[#8C6B24] text-lg font-bold flex items-center justify-center border border-[#E8DFCF] shadow-2xs shrink-0">
              {getInitials(agent.name)}
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-[#0F172A] truncate">
                {agent.name}
              </h2>
              <p className="text-xs text-[#8C6B24] font-semibold">{agent.role}</p>
              <div className="flex items-center gap-1.5 text-xs text-[#64748B] mt-0.5">
                <span className="font-mono text-[11px] bg-[#F8FAFC] px-2 py-0.5 rounded text-[#8C6B24] border border-[#E2E8F0] font-semibold">
                  {agent.employeeId}
                </span>
                <span>•</span>
                <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold text-[11px]">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  {agent.accountStatus}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-[#F1F5F9] space-y-2 text-xs">
            <div className="flex items-center justify-between text-[#334155]">
              <span className="flex items-center gap-1.5 text-[#64748B] font-medium">
                <MapPin className="w-3.5 h-3.5 text-[#B8934A]" /> Assigned Territory
              </span>
              <span className="font-semibold text-[#0F172A] text-right">{agent.territory}</span>
            </div>
            <div className="flex items-center justify-between text-[#334155]">
              <span className="flex items-center gap-1.5 text-[#64748B] font-medium">
                <Briefcase className="w-3.5 h-3.5 text-[#B8934A]" /> Organization
              </span>
              <span className="font-semibold text-[#0F172A]">Winstone Properties Ltd.</span>
            </div>
            <div className="flex items-center justify-between text-[#334155]">
              <span className="flex items-center gap-1.5 text-[#64748B] font-medium">
                <Hash className="w-3.5 h-3.5 text-[#B8934A]" /> Build Version
              </span>
              <span className="font-mono text-[#64748B]">{agent.appVersion || 'v2.0.0-phase2'}</span>
            </div>
          </div>
        </div>

        {/* Enterprise Workspace Decks */}
        {onNavigateTab && (
          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-xs p-3.5 space-y-2.5 text-left">
            <span className="text-[10px] font-bold text-[#8C6B24] uppercase tracking-wider block">
              Enterprise Role Workspaces:
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onNavigateTab('coordinator')}
                className="p-2.5 bg-[#F9FAFB] hover:bg-[#FAF6EE] border border-[#E5E7EB] hover:border-[#B8934A] rounded-xl text-left transition-all cursor-pointer"
              >
                <div className="text-xs font-bold text-[#111827]">Coordinator Deck</div>
                <div className="text-[10px] text-[#6B7280]">Dispatch & Ingestion</div>
              </button>
              <button
                onClick={() => onNavigateTab('executive')}
                className="p-2.5 bg-[#F9FAFB] hover:bg-[#FAF6EE] border border-[#E5E7EB] hover:border-[#B8934A] rounded-xl text-left transition-all cursor-pointer"
              >
                <div className="text-xs font-bold text-[#111827]">Executive HQ</div>
                <div className="text-[10px] text-[#6B7280]">Macro Valuation & KPIs</div>
              </button>
              <button
                onClick={() => onNavigateTab('it_console')}
                className="p-2.5 bg-[#F9FAFB] hover:bg-[#FAF6EE] border border-[#E5E7EB] hover:border-[#B8934A] rounded-xl text-left transition-all cursor-pointer"
              >
                <div className="text-xs font-bold text-[#111827]">IT Console</div>
                <div className="text-[10px] text-[#6B7280]">Telephony Bridge & Sync</div>
              </button>
              <button
                onClick={() => onNavigateTab('dashboard')}
                className="p-2.5 bg-[#F9FAFB] hover:bg-[#FAF6EE] border border-[#E5E7EB] hover:border-[#B8934A] rounded-xl text-left transition-all cursor-pointer"
              >
                <div className="text-xs font-bold text-[#111827]">Sales Agent</div>
                <div className="text-[10px] text-[#6B7280]">Calling Cockpit</div>
              </button>
            </div>
          </div>
        )}

        {/* Android APK Build Hub Banner */}
        <div
          onClick={() => setShowApkModal(true)}
          className="bg-white text-[#0F172A] p-3.5 rounded-2xl border border-emerald-500/40 shadow-xs cursor-pointer hover:border-emerald-600 transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0">
              <Smartphone className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold block text-[#0F172A] group-hover:text-emerald-700 transition-colors">
                  Android APK Build & Git CI/CD Hub
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded font-bold">
                  GitHub
                </span>
              </div>
              <span className="text-[11px] text-[#64748B] block">
                Automated release pipeline, Gradle commands & APK artifacts
              </span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-emerald-600 group-hover:translate-x-0.5 transition-transform" />
        </div>

        {/* Kotlin & Architecture Inspection Banner */}
        {onOpenKotlinViewer && (
          <div
            onClick={onOpenKotlinViewer}
            className="bg-white text-[#0F172A] p-3.5 rounded-2xl border border-[#E5E7EB] shadow-xs cursor-pointer hover:border-[#B8934A] transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#FAF6EE] text-[#8C6B24] border border-[#E8DFCF] flex items-center justify-center shrink-0">
                <FileCode2 className="w-5 h-5 text-[#B8934A]" />
              </div>
              <div>
                <span className="text-xs font-bold block text-[#0F172A] group-hover:text-[#8C6B24] transition-colors">
                  Android Jetpack Compose Code
                </span>
                <span className="text-[11px] text-[#64748B] block">
                  Inspect Kotlin MVVM, ViewModel & Repository architecture
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#8C6B24] group-hover:translate-x-0.5 transition-transform" />
          </div>
        )}

        {/* Settings & Info Links */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-xs divide-y divide-[#F1F5F9] text-xs">
          <button
            onClick={() => setShowAbout(true)}
            className="w-full p-3.5 flex items-center justify-between text-[#334155] hover:bg-[#F8FAFC] transition-colors text-left cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <Info className="w-4 h-4 text-[#8C6B24]" />
              <span className="font-medium text-[#0F172A]">About Winstone Agent</span>
            </div>
            <ChevronRight className="w-4 h-4 text-[#94A3B8]" />
          </button>

          <button
            onClick={() => setShowHelp(true)}
            className="w-full p-3.5 flex items-center justify-between text-[#334155] hover:bg-[#F8FAFC] transition-colors text-left cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <HelpCircle className="w-4 h-4 text-[#8C6B24]" />
              <span className="font-medium text-[#0F172A]">Agent Help & Operational Protocol</span>
            </div>
            <ChevronRight className="w-4 h-4 text-[#94A3B8]" />
          </button>

          {/* Logout Action */}
          <button
            id="profile-btn-logout"
            onClick={onLogout}
            className="w-full p-3.5 flex items-center justify-between text-rose-600 hover:bg-rose-50 transition-colors text-left font-semibold cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <LogOut className="w-4 h-4 text-rose-600" />
              <span>Log Out of Session</span>
            </div>
            <ChevronRight className="w-4 h-4 text-rose-400" />
          </button>
        </div>

        {/* Corporate Footer */}
        <div className="text-center text-[#64748B] text-[11px] py-4 space-y-2 flex flex-col items-center">
          <WinstoneLogo variant="horizontal" size="sm" />
          <p className="text-[10px] text-[#64748B]">Internal Telephony & CRM Suite v2</p>
          <p className="font-mono text-[9px] text-[#94A3B8]">Device ID: SIM-PIXEL-BD-880 • TLS 1.3 Certified</p>
          <div className="pt-2 text-[10px] space-y-0.5 border-t border-[#E5E7EB] w-full max-w-xs">
            <p className="font-medium text-[#64748B]">© 2026 TrendFlux Digital. All Rights Reserved.</p>
            <p className="font-semibold text-[#8C6B24]">Developed & Powered by Zahid Hasan Emon.</p>
          </div>
        </div>
      </div>

      {/* About Modal */}
      {showAbout && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white text-[#0F172A] rounded-2xl p-5 max-w-sm w-full border border-[#E5E7EB] shadow-xl space-y-3 flex flex-col items-center text-center">
            <WinstoneLogo variant="horizontal" size="md" className="mb-1" />
            <h3 className="text-base font-bold text-[#0F172A]">About Winstone Agent</h3>
            <p className="text-xs text-[#475569] leading-relaxed text-left">
              Winstone Agent is the official mobile sales engagement tool for Winstone Properties Ltd. Built for rapid lead ingestion, qualification (Temperature & Category A/B/C/D), structured follow-up execution, and synchronized CRM gateway persistence.
            </p>
            <div className="bg-[#FAF9F6] p-3 rounded-xl border border-[#E8DFCF] text-[11px] text-[#8C6B24] space-y-1 w-full text-left">
              <div>Version: v2.0.0-phase2 (CRM Integration Layer)</div>
              <div>Platform: Android Jetpack Compose Native</div>
              <div>Target Architecture: Clean Architecture + Room Offline Sync</div>
              <div className="pt-1.5 border-t border-[#E8DFCF]/60 text-[10px] text-[#475569]">
                <div>© 2026 TrendFlux Digital. All Rights Reserved.</div>
                <div className="font-semibold text-[#8C6B24]">Developed & Powered by Zahid Hasan Emon.</div>
              </div>
            </div>
            <button
              onClick={() => setShowAbout(false)}
              className="w-full py-2.5 bg-[#111827] hover:bg-[#1F2937] text-white rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-xs active:scale-95"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Help Modal */}
      {showHelp && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white text-[#0F172A] rounded-2xl p-5 max-w-sm w-full border border-[#E5E7EB] shadow-xl space-y-3">
            <h3 className="text-base font-bold text-[#0F172A]">Agent Help & Support</h3>
            <p className="text-xs text-[#475569]">
              For assistance with lead assignment, credential resets, or project brochures:
            </p>
            <div className="bg-[#FAF9F6] p-3 rounded-xl border border-[#E8DFCF] text-xs space-y-1.5 text-[#334155]">
              <div><strong className="text-[#8C6B24]">CRM Support Desk:</strong> Ext. 404 / 405</div>
              <div><strong className="text-[#8C6B24]">Email:</strong> support@winstoneproperties.com</div>
              <div><strong className="text-[#8C6B24]">Sales Operations:</strong> Gulshan Head Office, Level 9</div>
            </div>
            <button
              onClick={() => setShowHelp(false)}
              className="w-full py-2 bg-[#B8934A] hover:bg-[#A68035] text-white rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-xs active:scale-95"
            >
              Got It
            </button>
          </div>
        </div>
      )}

      {/* Android APK Build Hub Modal */}
      <AndroidApkBuildModal
        isOpen={showApkModal}
        onClose={() => setShowApkModal(false)}
      />
    </div>
  );
};
