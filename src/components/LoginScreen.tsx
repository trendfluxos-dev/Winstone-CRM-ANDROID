import React, { useState } from 'react';
import {
  Lock,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  User,
  ShieldCheck,
  Globe,
  ChevronDown,
  TrendingUp,
  Sparkles,
  Check,
  KeyRound,
  X,
  Phone,
  Briefcase,
  Layers,
  Terminal,
  UserCheck,
} from 'lucide-react';
import { LoginCredentials, NavTab } from '../types';
import { WinstoneLogo } from './WinstoneLogo';
import {
  VERIFIED_WINSTONE_AGENTS,
  AUTHORIZED_COORDINATOR_IDS,
  VerifiedAgentRecord,
} from '../config/agentRegistry';

interface LoginScreenProps {
  onLogin: (credentials: LoginCredentials, targetTab?: NavTab) => Promise<void>;
  isLoading: boolean;
  errorMessage: string | null;
  isMockMode: boolean;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLogin,
  isLoading,
  errorMessage,
}) => {
  // Navigation Mode: 'portals' | 'manual'
  const [authMode, setAuthMode] = useState<'portals' | 'manual'>('portals');

  // Manual Credentials
  const [identifier, setIdentifier] = useState('WIN2601');
  const [password, setPassword] = useState('Winstone@2026!');
  const [showPassword, setShowPassword] = useState(false);

  // Localization
  const [selectedLanguage, setSelectedLanguage] = useState<'English' | 'বাংলা'>('English');
  const [showLangMenu, setShowLangMenu] = useState(false);

  // Coordinator Profile Confirmation Modal State (Contract Section 5.B)
  const [selectedCoordinatorProfile, setSelectedCoordinatorProfile] = useState<VerifiedAgentRecord | null>(null);

  // PIN Unlock Modal for Executive HQ & IT Console (Contract Section 5.C & 5.D)
  const [pinModalConfig, setPinModalConfig] = useState<{
    isOpen: boolean;
    roleTitle: string;
    roleDescription: string;
    targetIdentifier: string;
    targetTab: NavTab;
  } | null>(null);
  const [enteredPin, setEnteredPin] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);

  // Submit Manual Form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) return;
    await onLogin({ identifier: identifier.trim(), password });
  };

  // Quick Sign In for Sales Agent
  const handleSignInAsSalesAgent = async () => {
    await onLogin(
      { identifier: 'WIN2601', password: 'Winstone@2026!' },
      'dashboard'
    );
  };

  // Trigger Coordinator Confirmation Flow (Contract Section 5.B)
  const handleInitiateCoordinatorSignIn = (empId: string = 'WIN2604') => {
    const profile = VERIFIED_WINSTONE_AGENTS.find((a) => a.employeeId === empId) || VERIFIED_WINSTONE_AGENTS.find((a) => a.employeeId === 'WIN2604') || null;
    setSelectedCoordinatorProfile(profile);
  };

  // Confirm and Enter Coordinator Deck
  const handleConfirmCoordinatorDeck = async () => {
    if (!selectedCoordinatorProfile) return;
    const targetId = selectedCoordinatorProfile.employeeId;
    setSelectedCoordinatorProfile(null);
    await onLogin(
      { identifier: targetId, password: 'Winstone@2026!' },
      'coordinator'
    );
  };

  // Open PIN Modal (Only "Unlock PIN" shown on UI)
  const handleOpenPinModal = (
    roleTitle: string,
    roleDescription: string,
    targetIdentifier: string,
    targetTab: NavTab
  ) => {
    setEnteredPin('');
    setPinError(null);
    setPinModalConfig({
      isOpen: true,
      roleTitle,
      roleDescription,
      targetIdentifier,
      targetTab,
    });
  };

  // Submit PIN for Verification
  const handleVerifyAndSubmitPin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!pinModalConfig) return;

    // Server-side verification simulation without leaking PINs in UI
    const targetId = pinModalConfig.targetIdentifier;
    const targetTab = pinModalConfig.targetTab;
    const validPins: Record<string, string[]> = {
      WIN2603: ['8888', '1234'],
      WIN2604: ['9999', '1234'],
    };

    const accepted = validPins[targetId] || ['1234', '8888', '9999'];

    if (accepted.includes(enteredPin.trim())) {
      setPinModalConfig(null);
      await onLogin({ identifier: targetId, password: 'Winstone@2026!' }, targetTab);
    } else {
      setPinError('Invalid Security PIN. Please enter authorized 4-digit passcode.');
    }
  };

  return (
    <div
      id="login-screen"
      className="flex-1 flex flex-col justify-between text-[#111827] px-4 sm:px-6 py-3.5 overflow-y-auto no-scrollbar relative selection:bg-[#FAF0DB] selection:text-[#8C6B24] bg-[#F9FAFB]"
    >
      {/* Luxury Architectural Background Backdrop */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-white/95 via-white/85 to-white/95 z-1" />
        <div
          className="absolute inset-0 opacity-20 mix-blend-multiply bg-cover bg-center"
          style={{
            backgroundImage: `url("https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80")`,
          }}
        />
        {/* Champagne Gold Flourishes */}
        <svg
          className="absolute -top-10 -left-10 w-72 h-72 opacity-60 z-2"
          viewBox="0 0 200 200"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M-20 20C40 20 80 60 100 120C120 180 180 200 220 200"
            stroke="url(#goldCurveGrad1)"
            strokeWidth="2.5"
          />
          <path
            d="M-20 60C30 60 60 90 80 150C95 190 140 210 180 210"
            stroke="url(#goldCurveGrad2)"
            strokeWidth="1.5"
            strokeDasharray="4 2"
          />
          <defs>
            <linearGradient id="goldCurveGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#CFA349" />
              <stop offset="50%" stopColor="#E9CE88" />
              <stop offset="100%" stopColor="#8C6B24" />
            </linearGradient>
            <linearGradient id="goldCurveGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FAF0DB" />
              <stop offset="100%" stopColor="#CFA349" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Foreground Content */}
      <div className="relative z-10 flex flex-col justify-between flex-1">
        {/* Top Header: Mode Pill & Language Selector */}
        <div className="flex items-center justify-between mb-1.5">
          {/* Mode Switcher */}
          <div className="flex items-center gap-1 bg-white/90 p-0.5 rounded-full border border-[#E5E7EB] shadow-2xs">
            <button
              type="button"
              onClick={() => setAuthMode('portals')}
              className={`px-2.5 py-1 rounded-full text-[10.5px] font-bold transition-all cursor-pointer ${
                authMode === 'portals'
                  ? 'bg-[#8C6B24] text-white shadow-2xs'
                  : 'text-[#6B7280] hover:text-[#111827]'
              }`}
            >
              Role Portals
            </button>
            <button
              type="button"
              onClick={() => setAuthMode('manual')}
              className={`px-2.5 py-1 rounded-full text-[10.5px] font-bold transition-all cursor-pointer ${
                authMode === 'manual'
                  ? 'bg-[#8C6B24] text-white shadow-2xs'
                  : 'text-[#6B7280] hover:text-[#111827]'
              }`}
            >
              Manual Form
            </button>
          </div>

          {/* Language Selector */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowLangMenu(!showLangMenu)}
              className="flex items-center gap-1 px-2.5 py-1 bg-white/90 hover:bg-white text-[#374151] rounded-full text-xs font-semibold border border-[#E5E7EB] shadow-2xs transition-all cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5 text-[#6B7280]" />
              <span>{selectedLanguage}</span>
              <ChevronDown className="w-3 h-3 text-[#6B7280]" />
            </button>

            {showLangMenu && (
              <div className="absolute right-0 top-8 bg-white border border-[#E5E7EB] rounded-xl shadow-lg p-1 w-28 z-50 text-xs text-left">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedLanguage('English');
                    setShowLangMenu(false);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between cursor-pointer ${
                    selectedLanguage === 'English' ? 'bg-[#FAF6EE] text-[#8C6B24] font-bold' : 'text-[#374151]'
                  }`}
                >
                  <span>English</span>
                  {selectedLanguage === 'English' && <Check className="w-3 h-3 text-[#8C6B24]" />}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedLanguage('বাংলা');
                    setShowLangMenu(false);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between cursor-pointer ${
                    selectedLanguage === 'বাংলা' ? 'bg-[#FAF6EE] text-[#8C6B24] font-bold' : 'text-[#374151]'
                  }`}
                >
                  <span>বাংলা</span>
                  {selectedLanguage === 'বাংলা' && <Check className="w-3 h-3 text-[#8C6B24]" />}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Center Brand Identity */}
        <div className="flex flex-col items-center text-center my-1">
          <WinstoneLogo variant="stacked" size="md" />
          <div className="mt-2 mb-1">
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#111827]">
              Winstone Connect V2
            </h2>
            <p className="text-[11px] sm:text-xs text-[#6B7280] leading-tight mt-0.5">
              Unified CRM Authentication • Single Source of Truth
            </p>
          </div>
        </div>

        {/* Global Error Notice */}
        {errorMessage && (
          <div className="mb-2 bg-rose-50 border border-rose-200 rounded-xl p-2.5 text-rose-900 text-xs flex items-start gap-2 text-left">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block text-xs">Sign In Notice</span>
              <span className="font-medium text-rose-700 text-[11px]">{errorMessage}</span>
            </div>
          </div>
        )}

        {/* FOUR OPERATIONAL ROLES PORTAL VIEW (CONTRACT SECTION 5) */}
        {authMode === 'portals' ? (
          <div className="space-y-2.5 my-1">
            {/* A. SALES AGENT */}
            <div className="bg-white rounded-2xl p-3.5 border border-[#E8DFCF] shadow-xs hover:border-[#B8934A] transition-all text-left">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#FAF6EE] border border-[#E8DFCF] flex items-center justify-center text-[#8C6B24] shrink-0">
                    <UserCheck className="w-4 h-4 text-[#B8934A]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-[#111827] leading-tight">
                      Sales Agent
                    </h3>
                    <p className="text-[11px] text-[#6B7280] leading-snug mt-0.5">
                      Your own lead queue, call log, WhatsApp threads, AI coaching, and own Daily Performance.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-2.5 pt-2 border-t border-[#F1F5F9] flex items-center justify-between">
                <div className="text-[10.5px] text-[#475569]">
                  <span className="font-bold text-[#111827]">Agent Cockpit</span> • <span className="font-mono text-[#8C6B24]">WIN2601</span>
                </div>
                <button
                  type="button"
                  onClick={handleSignInAsSalesAgent}
                  disabled={isLoading}
                  className="px-3.5 py-1.5 bg-gradient-to-r from-[#CFA349] to-[#B28734] hover:brightness-105 active:scale-95 text-[#111827] font-extrabold text-xs rounded-xl shadow-2xs flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Sign In</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* B. SIGN IN AS COORDINATOR (Authorized: WIN2604, WIN2606) */}
            <div className="bg-white rounded-2xl p-3.5 border border-[#E8DFCF] shadow-xs text-left">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#FAF6EE] border border-[#E8DFCF] flex items-center justify-center text-[#8C6B24] shrink-0">
                    <Layers className="w-4 h-4 text-[#B8934A]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-[#111827] leading-tight">
                      Sign in as Coordinator
                    </h3>
                    <p className="text-[11px] text-[#6B7280] leading-snug mt-0.5">
                      Assign and balance leads, import lists and watch the whole floor queue.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-2.5 pt-2 border-t border-[#F1F5F9] flex items-center justify-between">
                <div className="flex items-center gap-2 text-[10.5px] text-[#475569]">
                  <span className="font-bold text-[#111827]">Authorized Accounts:</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleInitiateCoordinatorSignIn('WIN2604')}
                      className="px-1.5 py-0.5 bg-[#FAF6EE] border border-[#E8DFCF] text-[#8C6B24] font-mono font-bold rounded hover:bg-[#F3ECE0] cursor-pointer"
                    >
                      WIN2604
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInitiateCoordinatorSignIn('WIN2606')}
                      className="px-1.5 py-0.5 bg-[#FAF6EE] border border-[#E8DFCF] text-[#8C6B24] font-mono font-bold rounded hover:bg-[#F3ECE0] cursor-pointer"
                    >
                      WIN2606
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleInitiateCoordinatorSignIn('WIN2604')}
                  disabled={isLoading}
                  className="px-3.5 py-1.5 bg-[#111827] hover:bg-[#1F2937] active:scale-95 text-[#FAF0DB] font-extrabold text-xs rounded-xl shadow-2xs flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <span>Sign In</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#E9CE88]" />
                </button>
              </div>
            </div>

            {/* C. SIGN IN AS EXECUTIVE HQ */}
            <div className="bg-white rounded-2xl p-3.5 border border-[#E8DFCF] shadow-xs text-left">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#FAF6EE] border border-[#E8DFCF] flex items-center justify-center text-[#8C6B24] shrink-0">
                    <TrendingUp className="w-4 h-4 text-[#B8934A]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-[#111827] leading-tight">
                      Sign in as Executive HQ
                    </h3>
                    <p className="text-[11px] text-[#6B7280] leading-snug mt-0.5">
                      Live floor performance, leaderboards and ask-anything reports and charts.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-2.5 pt-2 border-t border-[#F1F5F9] flex items-center justify-between">
                <div className="text-[10.5px] text-[#475569]">
                  <span className="font-bold text-[#111827]">Executive HQ</span> • Read-Only Floor View
                </div>
                <button
                  type="button"
                  onClick={() =>
                    handleOpenPinModal(
                      'Executive HQ Deck',
                      'Access floor valuation metrics, real-time consultant leaderboards, and macro KPI forecasts.',
                      'WIN2603',
                      'executive'
                    )
                  }
                  className="px-3.5 py-1.5 bg-[#111827] hover:bg-[#1F2937] active:scale-95 text-white font-bold text-xs rounded-xl shadow-2xs flex items-center gap-1.5 cursor-pointer transition-all border border-[#374151]"
                >
                  <KeyRound className="w-3.5 h-3.5 text-[#E9CE88]" />
                  <span>Unlock PIN</span>
                </button>
              </div>
            </div>

            {/* D. SIGN IN AS IT CONSOLE */}
            <div className="bg-white rounded-2xl p-3.5 border border-[#E8DFCF] shadow-xs text-left">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#FAF6EE] border border-[#E8DFCF] flex items-center justify-center text-[#8C6B24] shrink-0">
                    <Terminal className="w-4 h-4 text-[#B8934A]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-[#111827] leading-tight">
                      Sign in as IT Console
                    </h3>
                    <p className="text-[11px] text-[#6B7280] leading-snug mt-0.5">
                      System configuration, integrations, data health and account approvals.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-2.5 pt-2 border-t border-[#F1F5F9] flex items-center justify-between">
                <div className="text-[10.5px] text-[#475569]">
                  <span className="font-bold text-[#111827]">IT Console</span> • System Admin
                </div>
                <button
                  type="button"
                  onClick={() =>
                    handleOpenPinModal(
                      'IT Console & Bridge',
                      'Configure Android telephony bridge gateways, Room DB schemas, and TLS 1.3 token rotations.',
                      'WIN2604',
                      'it_console'
                    )
                  }
                  className="px-3.5 py-1.5 bg-[#111827] hover:bg-[#1F2937] active:scale-95 text-white font-bold text-xs rounded-xl shadow-2xs flex items-center gap-1.5 cursor-pointer transition-all border border-[#374151]"
                >
                  <KeyRound className="w-3.5 h-3.5 text-[#E9CE88]" />
                  <span>Unlock PIN</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* MANUAL CREDENTIALS CARD VIEW */
          <div className="bg-white/95 backdrop-blur-md rounded-[26px] p-5 sm:p-6 shadow-[0_12px_36px_rgba(0,0,0,0.06),0_1px_3px_rgba(0,0,0,0.03)] border border-white/80 my-2">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Employee ID Input */}
              <div className="space-y-1.5 text-left">
                <label
                  htmlFor="employee-id"
                  className="block text-xs font-bold text-[#111827] uppercase tracking-wider"
                >
                  Agent Identifier / Employee ID
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <User className="h-4 w-4 text-[#9CA3AF]" />
                  </div>
                  <input
                    id="employee-id"
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="e.g. WIN2601, WIN2604, email or phone"
                    className="block w-full pl-10 pr-3.5 py-3 text-sm font-semibold bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl text-[#111827] placeholder-[#9CA3AF] focus:outline-none focus:ring-1 focus:ring-[#8C6B24] focus:border-[#8C6B24] focus:bg-white transition-all shadow-inner"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1.5 text-left">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="block text-xs font-bold text-[#111827] uppercase tracking-wider"
                  >
                    Account Password
                  </label>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-[#9CA3AF]" />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="block w-full pl-10 pr-10 py-3 text-sm font-semibold bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl text-[#111827] placeholder-[#9CA3AF] focus:outline-none focus:ring-1 focus:ring-[#8C6B24] focus:border-[#8C6B24] focus:bg-white transition-all shadow-inner"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#9CA3AF] hover:text-[#111827] transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3.5 px-4 bg-gradient-to-r from-[#CFA349] via-[#E9CE88] to-[#8C6B24] hover:opacity-95 text-[#111827] text-sm font-extrabold rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#8C6B24] transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] disabled:opacity-50"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-[#111827] border-t-transparent rounded-full animate-spin" />
                    <span>Verifying CRM Credentials...</span>
                  </span>
                ) : (
                  <>
                    <span>Authenticate & Launch Deck</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* Footer Brand & Attributions */}
        <div className="mt-2 space-y-2">
          {/* Slogan */}
          <div className="text-center">
            <span
              className="text-xs sm:text-sm text-[#8C6B24] font-serif italic tracking-wide"
              style={{ fontFamily: '"Brush Script MT", "Caveat", "Great Vibes", cursive, serif' }}
            >
              Building A Brighter Bangladesh
            </span>
          </div>

          {/* Attributions (Required by Contract) */}
          <div className="pt-2 text-center text-[10px] text-[#9CA3AF] space-y-0.5 border-t border-[#E5E7EB]/50 mt-1">
            <p className="font-medium text-[#6B7280]">© 2026 TrendFlux Digital. All Rights Reserved.</p>
            <p className="font-semibold text-[#8C6B24]">Developed & Powered by Zahid Hasan Emon.</p>
          </div>
        </div>
      </div>

      {/* MODAL 1: COORDINATOR CONFIRMATION POPUP (CONTRACT SECTION 5.B) */}
      {selectedCoordinatorProfile && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-sm p-5 border border-[#E8DFCF] shadow-2xl text-left space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#E5E7EB]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#FAF6EE] border border-[#E8DFCF] flex items-center justify-center text-[#8C6B24]">
                  <Layers className="w-4 h-4 text-[#B8934A]" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-[#111827]">
                    Coordinator Deck Confirmation
                  </h3>
                  <span className="text-[10.5px] text-[#6B7280]">Floor Lead Dispatch Authorization</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCoordinatorProfile(null)}
                className="p-1 rounded-lg text-[#6B7280] hover:text-[#111827] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#4B5563] leading-relaxed">
              Please verify your authenticated coordinator identity before accessing the real-time floor dispatch queue:
            </p>

            {/* Authenticated Profile Info (From Real Profile) */}
            <div className="p-3.5 bg-[#FAF9F6] rounded-xl border border-[#E8DFCF] space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[#6B7280] font-medium">Name:</span>
                <span className="font-extrabold text-[#111827]">{selectedCoordinatorProfile.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#6B7280] font-medium">Employee ID:</span>
                <span className="font-mono font-bold text-[#8C6B24]">{selectedCoordinatorProfile.employeeId}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#6B7280] font-medium">Phone:</span>
                <span className="font-mono font-semibold text-[#111827]">{selectedCoordinatorProfile.phone}</span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-[#E5E7EB]/60">
                <span className="text-[#6B7280] font-medium">Assigned Role:</span>
                <span className="font-semibold text-[#111827]">{selectedCoordinatorProfile.role}</span>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedCoordinatorProfile(null)}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-[#4B5563] hover:bg-[#F3F4F6] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmCoordinatorDeck}
                disabled={isLoading}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-[#111827] hover:bg-[#1F2937] text-white cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                <span>Confirm & Enter Deck</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#E9CE88]" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: UNLOCK PIN MODAL (EXECUTIVE HQ & IT CONSOLE - CONTRACT SECTION 5.C, 5.D, 6) */}
      {pinModalConfig?.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-sm p-5 border border-[#E8DFCF] shadow-2xl text-left space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#E5E7EB]">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-[#B8934A]" />
                <div>
                  <h3 className="text-sm font-extrabold text-[#111827]">
                    Unlock {pinModalConfig.roleTitle}
                  </h3>
                  <span className="text-[10.5px] text-[#6B7280]">Security Passcode Required</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPinModalConfig(null)}
                className="p-1 rounded-lg text-[#6B7280] hover:text-[#111827] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#4B5563] leading-relaxed">
              {pinModalConfig.roleDescription}
            </p>

            {pinError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs p-2.5 rounded-xl">
                {pinError}
              </div>
            )}

            <form onSubmit={handleVerifyAndSubmitPin} className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#111827] block">
                  Enter Security PIN:
                </label>
                <input
                  type="password"
                  maxLength={6}
                  value={enteredPin}
                  onChange={(e) => setEnteredPin(e.target.value)}
                  placeholder="••••"
                  autoFocus
                  className="w-full h-12 text-center text-2xl font-mono tracking-widest rounded-xl border border-[#CBD5E1] focus:border-[#B8934A] focus:ring-2 focus:ring-[#B8934A]/20 outline-none bg-[#F8FAFC]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPinModalConfig(null)}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-[#4B5563] hover:bg-[#F3F4F6] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-[#111827] hover:bg-[#1F2937] text-white cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  <KeyRound className="w-3.5 h-3.5 text-[#E9CE88]" />
                  <span>Unlock PIN</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
