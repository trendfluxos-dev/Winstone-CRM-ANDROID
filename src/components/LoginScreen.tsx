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
  Building2,
  Users2,
  TrendingUp,
  Sparkles,
  Check,
} from 'lucide-react';
import { LoginCredentials } from '../types';
import { WinstoneLogo } from './WinstoneLogo';

interface LoginScreenProps {
  onLogin: (credentials: LoginCredentials) => Promise<void>;
  isLoading: boolean;
  errorMessage: string | null;
  isMockMode: boolean;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLogin,
  isLoading,
  errorMessage,
}) => {
  const [identifier, setIdentifier] = useState('WIN2601');
  const [password, setPassword] = useState('Winstone@2026!');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<'English' | 'বাংলা'>('English');
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [selectedRolePreset, setSelectedRolePreset] = useState<string>('WIN2601');
  const [showRoleSelector, setShowRoleSelector] = useState(false);

  const rolePresets = [
    { id: 'WIN2601', title: 'Sales Agent', name: 'Tanvir Ahmed', subtitle: 'Gulshan & Banani Prime' },
    { id: 'WIN2602', title: 'Coordinator Deck', name: 'Nusrat Jahan', subtitle: 'Lead Dispatch & Influx' },
    { id: 'WIN2603', title: 'Executive HQ', name: 'Mahmudul Hasan', subtitle: 'VP Commercial & Macro KPIs' },
    { id: 'WIN2604', title: 'IT Console', name: 'Farzana Rahman', subtitle: 'Telephony & Bridge Admin' },
  ];

  const handleSelectRole = (empId: string) => {
    setSelectedRolePreset(empId);
    setIdentifier(empId);
    setPassword('Winstone@2026!');
    setShowRoleSelector(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) return;
    await onLogin({ identifier: identifier.trim(), password });
  };

  return (
    <div
      id="login-screen"
      className="flex-1 flex flex-col justify-between text-[#111827] px-5 sm:px-6 py-4 overflow-y-auto no-scrollbar relative selection:bg-[#FAF0DB] selection:text-[#8C6B24] bg-[#F9FAFB]"
    >
      {/* Real Estate Luxury Architectural Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {/* Soft luxury architectural building illustration overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/90 via-white/80 to-white/95 z-1" />
        
        {/* Architectural backdrop elements */}
        <div
          className="absolute inset-0 opacity-25 mix-blend-multiply bg-cover bg-center"
          style={{
            backgroundImage: `url("https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80")`,
          }}
        />

        {/* Top-Left Champagne Gold Wave Flourishes (matching screenshot) */}
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
        {/* Top Action Bar: Language Selector */}
        <div className="flex items-center justify-between mb-2">
          {/* Workspace Quick Switcher Pill */}
          <button
            type="button"
            onClick={() => setShowRoleSelector(!showRoleSelector)}
            className="flex items-center gap-1.5 px-3 py-1 bg-white/90 hover:bg-white text-[#8C6B24] rounded-full text-[11px] font-bold border border-[#E8DFCF] shadow-2xs transition-all cursor-pointer"
          >
            <Sparkles className="w-3 h-3 text-[#B8934A]" />
            <span>Deck: {rolePresets.find((r) => r.id === selectedRolePreset)?.title || 'Sales Agent'}</span>
            <ChevronDown className="w-3 h-3 text-[#8C6B24]" />
          </button>

          {/* Language Selector (matching screenshot) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowLangMenu(!showLangMenu)}
              className="flex items-center gap-1.5 px-3 py-1 bg-white/90 hover:bg-white text-[#374151] rounded-full text-xs font-semibold border border-[#E5E7EB] shadow-2xs transition-all cursor-pointer"
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
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between ${
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
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between ${
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

        {/* Role Selector Popup if toggled */}
        {showRoleSelector && (
          <div className="mb-3 bg-white p-3 rounded-2xl border border-[#E8DFCF] shadow-md space-y-2 text-left animate-in fade-in">
            <span className="text-[10px] font-bold text-[#8C6B24] uppercase tracking-wider block">
              Select Workspace Deck (Eligible for 4 Roles):
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              {rolePresets.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => handleSelectRole(r.id)}
                  className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                    selectedRolePreset === r.id
                      ? 'bg-[#FAF6EE] border-[#B8934A] text-[#111827]'
                      : 'bg-[#F9FAFB] border-[#E5E7EB] text-[#4B5563] hover:bg-white'
                  }`}
                >
                  <div className="text-xs font-bold">{r.title}</div>
                  <div className="text-[10px] text-[#6B7280]">{r.name}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Center Brand Identity (Exact Match) */}
        <div className="flex flex-col items-center text-center my-2 sm:my-3">
          <WinstoneLogo variant="stacked" size="md" />

          {/* Typography Headings */}
          <div className="mt-4 mb-2">
            <h2 className="text-2xl sm:text-[28px] font-extrabold tracking-tight text-[#111827]">
              Welcome back
            </h2>
            <p className="text-xs sm:text-sm font-normal text-[#6B7280] leading-relaxed max-w-xs mx-auto mt-1">
              Sign in to your agent account to access your lead pipeline and telephony cockpit.
            </p>
          </div>
        </div>

        {/* Elevated White Form Card */}
        <div className="bg-white/95 backdrop-blur-md rounded-[26px] p-5 sm:p-6 shadow-[0_12px_36px_rgba(0,0,0,0.06),0_1px_3px_rgba(0,0,0,0.03)] border border-white/80 my-2">
          {/* Error Banner if any */}
          {errorMessage && (
            <div className="mb-4 bg-rose-50 border border-rose-200 rounded-xl p-3 text-rose-900 text-xs flex items-start gap-2 text-left">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Sign In Failed</span>
                <span className="font-medium text-rose-700">{errorMessage}</span>
              </div>
            </div>
          )}

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
                  placeholder="WIN2601"
                  className="w-full h-12 bg-white border border-[#E5E7EB] focus:border-[#B8934A] focus:ring-2 focus:ring-[#B8934A]/20 rounded-xl pl-11 pr-3 text-sm sm:text-base font-semibold text-[#111827] placeholder:text-[#9CA3AF] transition-all outline-none"
                  required
                />
              </div>
            </div>

            {/* Password Input with Forgot password link */}
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

          {/* Security Footnote */}
          <div className="pt-3 text-center space-y-0.5">
            <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-[#4B5563]">
              <ShieldCheck className="w-4 h-4 text-[#B8934A]" />
              <span>Secure. Encrypted. Trusted.</span>
            </div>
            <p className="text-[10px] text-[#9CA3AF]">
              Winstone Enterprise Security • TLS 1.3
            </p>
          </div>
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

          {/* Slogan in Elegant Cursive Calligraphy (matching screenshot) */}
          <div className="text-right pr-2 pt-1">
            <span
              className="text-xs sm:text-sm text-[#8C6B24] font-serif italic tracking-wide"
              style={{ fontFamily: '"Brush Script MT", "Caveat", "Great Vibes", cursive, serif' }}
            >
              Building A Brighter Bangladesh
            </span>
          </div>

          {/* TrendFlux Digital Attribution */}
          <div className="pt-2 text-center text-[10px] text-[#9CA3AF] space-y-0.5 border-t border-[#E5E7EB]/50 mt-1">
            <p className="font-medium text-[#6B7280]">© 2026 TrendFlux Digital. All Rights Reserved.</p>
            <p className="font-semibold text-[#8C6B24]">Developed & Powered by Zahid Hasan Emon.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
