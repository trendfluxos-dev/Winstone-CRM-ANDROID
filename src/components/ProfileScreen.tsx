import React, { useState } from 'react';
import {
  User,
  ShieldCheck,
  MapPin,
  Briefcase,
  Hash,
  LogOut,
  HelpCircle,
  Info,
  CheckCircle2,
  ChevronRight,
  Layers,
  Database,
  PhoneCall,
  Mic,
  Sparkles,
  Bell,
  HardDrive,
  Target,
  FileCode2,
} from 'lucide-react';
import { Agent } from '../types';

interface ProfileScreenProps {
  agent: Agent;
  onLogout: () => void;
  onOpenKotlinViewer?: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  agent,
  onLogout,
  onOpenKotlinViewer,
}) => {
  const [showAbout, setShowAbout] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showRoadmap, setShowRoadmap] = useState(false);

  const getInitials = (name?: string) => {
    if (!name) return 'AG';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const integrationPoints = [
    { title: '1. Winstone CRM API', desc: 'Secure REST/GraphQL gateway for bidirectional lead sync', icon: Database },
    { title: '2. Supabase Auth & DB', desc: 'Agent JWT authentication & PostgreSQL lead persistence', icon: ShieldCheck },
    { title: '3. Native Calling System', desc: 'Android Telecom / WebRTC outbound dialing engine', icon: PhoneCall },
    { title: '4. Call Recording Pipeline', desc: 'Hardware audio capture with encrypted local cache', icon: Mic },
    { title: '5. Audio Upload Service', desc: 'Background upload worker with retry queue', icon: HardDrive },
    { title: '6. AI Call Summary', desc: 'Gemini-powered conversation transcription & action items', icon: Sparkles },
    { title: '7. Push Notifications', desc: 'FCM push for urgent Meta leads and upcoming call alerts', icon: Bell },
    { title: '8. Offline Queue & Sync', desc: 'Room Database & WorkManager for field offline reliability', icon: Layers },
    { title: '9. Meta Lead Attribution', desc: 'Automatic pixel campaign & ad-set matching', icon: Target },
    { title: '10. Site Visit Management', desc: 'Geolocation check-in and visitor gate pass generator', icon: MapPin },
  ];

  return (
    <div id="profile-screen" className="flex-1 flex flex-col bg-neutral-50 overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
        {/* Agent Identity Card */}
        <div className="bg-white rounded-xl p-4 border border-neutral-200/90 shadow-2xs space-y-3">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-full bg-emerald-800 text-white text-lg font-bold flex items-center justify-center border-2 border-white shadow-xs shrink-0 ring-2 ring-emerald-100">
              {getInitials(agent.name)}
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-neutral-900 truncate">
                {agent.name}
              </h2>
              <p className="text-xs text-[#0D6E44] font-semibold">{agent.role}</p>
              <div className="flex items-center gap-1.5 text-xs text-neutral-500 mt-0.5">
                <span className="font-mono text-[11px] bg-neutral-100 px-1.5 py-0.5 rounded text-neutral-600">
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

          <div className="pt-3 border-t border-neutral-100 space-y-2 text-xs">
            <div className="flex items-center justify-between text-neutral-600">
              <span className="flex items-center gap-1.5 text-neutral-400">
                <MapPin className="w-3.5 h-3.5" /> Assigned Territory
              </span>
              <span className="font-semibold text-neutral-800 text-right">{agent.territory}</span>
            </div>
            <div className="flex items-center justify-between text-neutral-600">
              <span className="flex items-center gap-1.5 text-neutral-400">
                <Briefcase className="w-3.5 h-3.5" /> Organization
              </span>
              <span className="font-semibold text-neutral-800">Winstone Properties Ltd.</span>
            </div>
            <div className="flex items-center justify-between text-neutral-600">
              <span className="flex items-center gap-1.5 text-neutral-400">
                <Hash className="w-3.5 h-3.5" /> Build Version
              </span>
              <span className="font-mono text-neutral-600">{agent.appVersion || 'v2.0.0-phase2'}</span>
            </div>
          </div>
        </div>

        {/* Kotlin & Architecture Inspection Banner */}
        {onOpenKotlinViewer && (
          <div
            onClick={onOpenKotlinViewer}
            className="bg-neutral-900 text-white p-3.5 rounded-xl border border-neutral-800 shadow-xs cursor-pointer hover:bg-neutral-800 transition-all flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-600/30 text-emerald-400 flex items-center justify-center shrink-0">
                <FileCode2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold block">Android Jetpack Compose Code</span>
                <span className="text-[11px] text-neutral-400 block">
                  Inspect Kotlin MVVM, ViewModel & Repository architecture
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-neutral-400" />
          </div>
        )}

        {/* Settings & Info Links */}
        <div className="bg-white rounded-xl border border-neutral-200/90 shadow-2xs divide-y divide-neutral-100 text-xs">
          <button
            onClick={() => setShowAbout(true)}
            className="w-full p-3.5 flex items-center justify-between text-neutral-800 hover:bg-neutral-50 transition-colors text-left"
          >
            <div className="flex items-center gap-2.5">
              <Info className="w-4 h-4 text-neutral-500" />
              <span className="font-medium">About Winstone Agent</span>
            </div>
            <ChevronRight className="w-4 h-4 text-neutral-400" />
          </button>

          <button
            onClick={() => setShowHelp(true)}
            className="w-full p-3.5 flex items-center justify-between text-neutral-800 hover:bg-neutral-50 transition-colors text-left"
          >
            <div className="flex items-center gap-2.5">
              <HelpCircle className="w-4 h-4 text-neutral-500" />
              <span className="font-medium">Agent Help & Operational Protocol</span>
            </div>
            <ChevronRight className="w-4 h-4 text-neutral-400" />
          </button>

          {/* Logout Action */}
          <button
            id="profile-btn-logout"
            onClick={onLogout}
            className="w-full p-3.5 flex items-center justify-between text-red-600 hover:bg-red-50 transition-colors text-left font-semibold cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <LogOut className="w-4 h-4 text-red-600" />
              <span>Log Out of Session</span>
            </div>
            <ChevronRight className="w-4 h-4 text-red-400" />
          </button>
        </div>

        {/* Corporate Footer */}
        <div className="text-center text-neutral-400 text-[11px] py-2 space-y-0.5">
          <p className="font-semibold text-neutral-600">Winstone Properties Ltd.</p>
          <p>Confidential Internal Tool for Certified Real Estate Sales Force</p>
          <p className="font-mono text-[10px]">Device ID: SIM-PIXEL-BD-880 • CRM Bridge v2</p>
        </div>
      </div>

      {/* About Modal */}
      {showAbout && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full border border-neutral-200 shadow-xl space-y-3">
            <h3 className="text-base font-bold text-neutral-900">About Winstone Agent</h3>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Winstone Agent is the official mobile sales engagement tool for Winstone Properties Ltd. Built for rapid lead ingestion, qualification (Temperature & Category A/B/C/D), structured follow-up execution, and upcoming native telephony logging.
            </p>
            <div className="bg-neutral-50 p-2.5 rounded-lg border border-neutral-200 text-[11px] text-neutral-500 space-y-1">
              <div>Version: v2.0.0-phase2 (CRM Integration Layer)</div>
              <div>Platform: Android Jetpack Compose Native</div>
              <div>Target Architecture: Clean Architecture + WorkManager Offline Sync</div>
            </div>
            <button
              onClick={() => setShowAbout(false)}
              className="w-full py-2 bg-neutral-900 text-white rounded-xl text-xs font-bold cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Help Modal */}
      {showHelp && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full border border-neutral-200 shadow-xl space-y-3">
            <h3 className="text-base font-bold text-neutral-900">Agent Help & Support</h3>
            <p className="text-xs text-neutral-600">
              For assistance with lead assignment, credential resets, or project brochures:
            </p>
            <div className="bg-neutral-50 p-3 rounded-lg border border-neutral-200 text-xs space-y-1.5 text-neutral-700">
              <div><strong>CRM Support Desk:</strong> Ext. 404 / 405</div>
              <div><strong>Email:</strong> support@winstoneproperties.com</div>
              <div><strong>Sales Operations:</strong> Gulshan Head Office, Level 9</div>
            </div>
            <button
              onClick={() => setShowHelp(false)}
              className="w-full py-2 bg-[#0D6E44] text-white rounded-xl text-xs font-bold cursor-pointer"
            >
              Got It
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
