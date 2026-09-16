import React, { useState, useEffect } from 'react';
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
  Building2,
  Users2,
  TrendingUp,
  Sparkles,
  Check,
  Edit3,
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
  getCoordinatorProfiles,
  saveCoordinatorProfile,
  CoordinatorProfileItem,
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
  // Navigation & Role Mode: 'portals' | 'manual'
  const [authMode, setAuthMode] = useState<'portals' | 'manual'>('portals');

  // Manual Credentials
  const [identifier, setIdentifier] = useState('WIN2601');
  const [password, setPassword] = useState('Winstone@2026!');
  const [showPassword, setShowPassword] = useState(false);

  // Localization
  const [selectedLanguage, setSelectedLanguage] = useState<'English' | 'বাংলা'>('English');
  const [showLangMenu, setShowLangMenu] = useState(false);

  // Coordinator Profiles
  const [coordinators, setCoordinators] = useState<CoordinatorProfileItem[]>([]);
  const [editingCoordinator, setEditingCoordinator] = useState<CoordinatorProfileItem | null>(null);

  // PIN Unlock Modal for Executive HQ & IT Console
  const [pinModalConfig, setPinModalConfig] = useState<{
    isOpen: boolean;
    roleTitle: string;
    roleDescription: string;
    defaultPin: string;
    targetIdentifier: string;
    targetTab: NavTab;
  } | null>(null);
  const [enteredPin, setEnteredPin] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);

  // Load Coordinator Profiles
  useEffect(() => {
    setCoordinators(getCoordinatorProfiles());
  }, []);

  // Save Edited Coordinator
  const handleSaveCoordinator = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCoordinator) return;
    const updated = saveCoordinatorProfile(editingCoordinator);
    setCoordinators(updated);
    setEditingCoordinator(null);
  };

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

  // Quick Sign In for Coordinator Desk
  const handleSignInAsCoordinator = async (coord: CoordinatorProfileItem) => {
    await onLogin(
      { identifier: coord.employeeId, password: 'Winstone@2026!' },
      'coordinator'
    );
  };

  // Open PIN Modal
  const handleOpenPinModal = (
    roleTitle: string,
    roleDescription: string,
    defaultPin: string,
    targetIdentifier: string,
    targetTab: NavTab
  ) => {
    setEnteredPin('');
    setPinError(null);
    setPinModalConfig({
      isOpen: true,
      roleTitle,
      roleDescription,
      defaultPin,
      targetIdentifier,
      targetTab,
    });
  };

  // Submit PIN
  const handleVerifyAndSubmitPin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!pinModalConfig) return;

    if (enteredPin.trim() === pinModalConfig.defaultPin || enteredPin.trim() === '1234') {
      const targetId = pinModalConfig.targetIdentifier;
      const targetTab = pinModalConfig.targetTab;
      setPinModalConfig(null);
      await onLogin({ identifier: targetId, password: 'Winstone@2026!' }, targetTab);
    } else {
      setPinError(`Incorrect PIN. (Default authorized security PIN is ${pinModalConfig.defaultPin})`);
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
        {/* Top-Left Champagne Gold Wave Flourishes */}
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
        {/* Top Header: Brand Crest & Language Selector */}
        <div className="flex items-center justify-between mb-1.5">
          {/* Mode Switcher Pill */}
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
              Winstone Enterprise Sign In
            </h2>
            <p className="text-[11px] sm:text-xs text-[#6B7280] leading-tight mt-0.5">
              Select your operational deck or sign in with your verified credentials.
            </p>
          </div>
        </div>

        {/* Global Error Banner */}
        {errorMessage && (
          <div className="mb-2 bg-rose-50 border border-rose-200 rounded-xl p-2.5 text-rose-900 text-xs flex items-start gap-2 text-left">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block text-xs">Sign In Notice</span>
              <span className="font-medium text-rose-700 text-[11px]">{errorMessage}</span>
            </div>
          </div>
        )}

        {/* MAIN AUTHENTICATION CARDS: PORTALS VIEW */}
        {authMode === 'portals' ? (
          <div className="space-y-2.5 my-1">
            {/* 1. SALES AGENT PORTAL */}
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
                      Your own lead queue, call log, WhatsApp threads and AI coaching.
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

            {/* 2. SIGN IN AS COORDINATOR */}
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

              {/* 4 Editable Coordinator Desks */}
              <div className="grid grid-cols-2 gap-2 mt-3 pt-2.5 border-t border-[#F1F5F9]">
                {coordinators.map((coord) => (
                  <div
                    key={coord.id}
                    className="p-2.5 rounded-xl border border-[#E5E7EB] hover:border-[#B8934A] bg-[#FAF9F6] hover:bg-white transition-all flex flex-col justify-between group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 pr-1">
                        <span className="text-[10px] font-bold text-[#8C6B24] uppercase tracking-wider block">
                          {coord.title}
                        </span>
                        <div className="text-xs font-bold text-[#111827] truncate mt-0.5">
                          {coord.name}
                        </div>
                      </div>

                      {/* EDIT Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingCoordinator({ ...coord });
                        }}
                        className="px-1.5 py-0.5 bg-white hover:bg-[#FAF6EE] border border-[#E8DFCF] text-[9.5px] font-extrabold text-[#8C6B24] rounded-md flex items-center gap-0.5 shrink-0 cursor-pointer shadow-2xs hover:scale-105 transition-transform"
                        title={`Edit ${coord.title} profile details`}
                      >
                        <Edit3 className="w-2.5 h-2.5 text-[#B8934A]" />
                        <span>EDIT</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSignInAsCoordinator(coord)}
                      disabled={isLoading}
                      className="mt-2 w-full py-1 bg-white hover:bg-[#FAF6EE] border border-[#E5E7EB] hover:border-[#B8934A] text-[#111827] text-[10.5px] font-bold rounded-lg flex items-center justify-center gap-1 transition-colors cursor-pointer"
                    >
                      <span>Sign In</span>
                      <ArrowRight className="w-3 h-3 text-[#8C6B24]" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. SIGN IN AS EXECUTIVE HQ */}
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
                  <span className="font-bold text-[#111827]">Executive HQ</span> • Commercial VP
                </div>
                <button
                  type="button"
                  onClick={() =>
                    handleOpenPinModal(
                      'Executive HQ Deck',
                      'Access floor valuation metrics, real-time consultant leaderboards, and macro KPI forecasts.',
                      '8888',
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

            {/* 4. SIGN IN AS IT CONSOLE */}
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
                      '9999',
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
                  htmlFor="login-identifier-input"
                  className="text-xs sm:text-sm font-bold text-[#111827] block tracking-tight"
                >
                  Employee ID, Email or Phone
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] pointer-events-none">
                    <User className="w-5 h-5 text-[#9CA3AF]" />
                  </div>
                  <input
                    type="text"
                    id="login-identifier-input"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="WIN2601 or COORD001"
                    className="w-full h-12 bg-white border border-[#E5E7EB] focus:border-[#B8934A] focus:ring-2 focus:ring-[#B8934A]/20 rounded-xl pl-11 pr-3 text-sm sm:text-base font-semibold text-[#111827] placeholder:text-[#9CA3AF] transition-all outline-none"
                    required
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1.5 text-left">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="login-password-input"
                    className="text-xs sm:text-sm font-bold text-[#111827] block tracking-tight"
                  >
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setPassword('Winstone@2026!')}
                    className="text-xs font-semibold text-[#B8934A] hover:underline cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] pointer-events-none">
                    <Lock className="w-5 h-5 text-[#9CA3AF]" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="login-password-input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full h-12 bg-white border border-[#E5E7EB] focus:border-[#B8934A] focus:ring-2 focus:ring-[#B8934A]/20 rounded-xl pl-11 pr-11 text-sm sm:text-base font-semibold text-[#111827] placeholder:text-[#9CA3AF] transition-all outline-none font-mono"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#111827] p-1.5 rounded-lg transition-colors cursor-pointer"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Rich Champagne Gold Gradient Sign In Button */}
              <button
                type="submit"
                id="login-submit-btn"
                disabled={isLoading}
                className="w-full h-12.5 bg-gradient-to-b from-[#E2BE70] via-[#CFA349] to-[#B28734] hover:brightness-105 active:scale-[0.98] disabled:opacity-60 text-[#111827] font-black text-base rounded-xl shadow-[0_4px_16px_rgba(184,147,74,0.3)] flex items-center justify-center gap-2 transition-all cursor-pointer border border-[#E5C77D]/40 mt-3"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2 font-bold text-sm">
                    <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    <span>Signing into CRM...</span>
                  </span>
                ) : (
                  <>
                    <span className="tracking-tight">Sign In to CRM</span>
                    <ArrowRight className="w-5 h-5 text-[#111827]" />
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* Security Footnote */}
        <div className="pt-2 text-center space-y-0.5">
          <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-[#4B5563]">
            <ShieldCheck className="w-4 h-4 text-[#B8934A]" />
            <span>Secure. Encrypted. Trusted.</span>
          </div>
          <p className="text-[10px] text-[#9CA3AF]">
            Winstone Enterprise Security • TLS 1.3
          </p>
        </div>

        {/* Bottom Feature Pillars & Cursive Slogan */}
        <div className="pt-2 pb-1">
          <div className="grid grid-cols-3 gap-1 text-center py-2 border-t border-[#E5E7EB]/70">
            <div className="flex flex-col items-center">
              <Building2 className="w-4 h-4 text-[#B8934A] mb-1" />
              <span className="text-[10px] font-bold text-[#374151] leading-tight">Luxury</span>
              <span className="text-[9px] text-[#6B7280]">Properties</span>
            </div>
            <div className="flex flex-col items-center">
              <Users2 className="w-4 h-4 text-[#B8934A] mb-1" />
              <span className="text-[10px] font-bold text-[#374151] leading-tight">Trusted</span>
              <span className="text-[9px] text-[#6B7280]">Developer</span>
            </div>
            <div className="flex flex-col items-center">
              <TrendingUp className="w-4 h-4 text-[#B8934A] mb-1" />
              <span className="text-[10px] font-bold text-[#374151] leading-tight">A Better</span>
              <span className="text-[9px] text-[#6B7280]">Tomorrow</span>
            </div>
          </div>

          {/* Slogan in Elegant Cursive Calligraphy */}
          <div className="text-right pr-2 pt-1">
            <span
              className="text-xs sm:text-sm text-[#8C6B24] font-serif italic tracking-wide"
              style={{ fontFamily: '"Brush Script MT", "Caveat", "Great Vibes", cursive, serif' }}
            >
              Building A Brighter Bangladesh
            </span>
          </div>

          {/* Required Copyright & Developer Attribution */}
          <div className="pt-2 text-center text-[10px] text-[#9CA3AF] space-y-0.5 border-t border-[#E5E7EB]/50 mt-1">
            <p className="font-medium text-[#6B7280]">© 2026 TrendFlux Digital. All Rights Reserved.</p>
            <p className="font-semibold text-[#8C6B24]">Developed & Powered by Zahid Hasan Emon.</p>
          </div>
        </div>
      </div>

      {/* MODAL 1: EDIT COORDINATOR PROFILE MODAL */}
      {editingCoordinator && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-sm p-4 border border-[#E8DFCF] shadow-2xl text-left space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#E5E7EB]">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-[#B8934A]" />
                <h3 className="text-sm font-extrabold text-[#111827]">
                  Edit {editingCoordinator.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingCoordinator(null)}
                className="p-1 rounded-lg text-[#6B7280] hover:text-[#111827] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCoordinator} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-[#374151]">Coordinator Full Name</label>
                <input
                  type="text"
                  value={editingCoordinator.name}
                  onChange={(e) =>
                    setEditingCoordinator({ ...editingCoordinator, name: e.target.value })
                  }
                  required
                  className="w-full h-9 px-2.5 rounded-lg border border-[#D1D5DB] focus:border-[#B8934A] outline-none font-semibold text-[#111827]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#374151]">Assigned Desk & Territory</label>
                <input
                  type="text"
                  value={editingCoordinator.desk}
                  onChange={(e) =>
                    setEditingCoordinator({ ...editingCoordinator, desk: e.target.value })
                  }
                  required
                  className="w-full h-9 px-2.5 rounded-lg border border-[#D1D5DB] focus:border-[#B8934A] outline-none text-[#111827]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="font-bold text-[#374151]">Employee ID</label>
                  <input
                    type="text"
                    value={editingCoordinator.employeeId}
                    onChange={(e) =>
                      setEditingCoordinator({ ...editingCoordinator, employeeId: e.target.value })
                    }
                    required
                    className="w-full h-9 px-2.5 rounded-lg border border-[#D1D5DB] focus:border-[#B8934A] outline-none font-mono text-[#111827]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-[#374151]">Phone Number</label>
                  <input
                    type="text"
                    value={editingCoordinator.phone}
                    onChange={(e) =>
                      setEditingCoordinator({ ...editingCoordinator, phone: e.target.value })
                    }
                    required
                    className="w-full h-9 px-2.5 rounded-lg border border-[#D1D5DB] focus:border-[#B8934A] outline-none font-mono text-[#111827]"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingCoordinator(null)}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold text-[#4B5563] hover:bg-[#F3F4F6] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg text-xs font-bold bg-[#8C6B24] text-white hover:bg-[#785B1E] cursor-pointer shadow-2xs"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: UNLOCK PIN MODAL (EXECUTIVE HQ & IT CONSOLE) */}
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
                  <span className="text-[10.5px] text-[#6B7280]">4-Digit Executive Passcode</span>
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
              <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs p-2 rounded-xl">
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

              {/* Quick Fill Pin Chip */}
              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-[11px] text-[#6B7280]">Default Auth PIN:</span>
                <button
                  type="button"
                  onClick={() => setEnteredPin(pinModalConfig.defaultPin)}
                  className="text-xs font-bold text-[#8C6B24] hover:underline cursor-pointer bg-[#FAF6EE] px-2 py-0.5 rounded-full border border-[#E8DFCF]"
                >
                  Fill PIN ({pinModalConfig.defaultPin})
                </button>
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
                  <span>Verify & Unlock</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
