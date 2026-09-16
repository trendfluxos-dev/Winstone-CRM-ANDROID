import React, { useState } from 'react';
import { Building2, Lock, Mail, ArrowRight, ShieldCheck, AlertCircle, Users, Phone, Hash } from 'lucide-react';
import { LoginCredentials } from '../types';
import { VERIFIED_WINSTONE_AGENTS, resolveAgentByIdentifier } from '../config/agentRegistry';

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
  isMockMode,
}) => {
  const [identifier, setIdentifier] = useState('WIN2601');
  const [password, setPassword] = useState('••••••••••••');
  const [selectedAgentIndex, setSelectedAgentIndex] = useState<number>(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) return;
    await onLogin({ identifier: identifier.trim(), password });
  };

  const handleSelectAgent = (index: number) => {
    setSelectedAgentIndex(index);
    const agent = VERIFIED_WINSTONE_AGENTS[index];
    if (agent) {
      setIdentifier(agent.employeeId);
      setPassword('Winstone@2026!');
    }
  };

  const detected = resolveAgentByIdentifier(identifier);

  return (
    <div id="login-screen" className="flex-1 flex flex-col bg-neutral-900 text-white p-5 justify-center overflow-y-auto">
      {/* Brand Header */}
      <div className="text-center space-y-1.5 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-[#0D6E44] flex items-center justify-center text-white mx-auto shadow-lg shadow-emerald-950/50 ring-1 ring-emerald-400/30">
          <Building2 className="w-6 h-6" />
        </div>
        <h1 className="text-lg font-extrabold tracking-tight text-white">Winstone Agent Portal</h1>
        <p className="text-[11px] text-neutral-400 max-w-xs mx-auto">
          Winstone Properties Ltd. Unified Telephony & CRM
        </p>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-neutral-800 text-[10px] text-emerald-400 font-mono border border-neutral-700">
          <ShieldCheck className="w-3 h-3" />
          <span>7 Verified Accounts Active</span>
        </div>
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="mb-4 bg-red-950/60 border border-red-800/80 rounded-xl p-3 text-red-200 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block">Authentication Failed</span>
            <span>{errorMessage}</span>
          </div>
        </div>
      )}

      {/* Login Form */}
      <form onSubmit={handleSubmit} className="space-y-3.5 max-w-sm w-full mx-auto">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-semibold text-neutral-300 block">
              Employee ID / Email / Phone
            </label>
            {detected && (
              <span className="text-[10px] text-emerald-400 font-medium truncate max-w-[150px]">
                ✓ {detected.name} ({detected.employeeId})
              </span>
            )}
          </div>
          <div className="relative">
            <Hash className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              id="login-identifier-input"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="e.g. WIN2601, win2601@agent.winstonebd.com, 01805049668"
              className="w-full bg-neutral-800/90 border border-neutral-700 focus:border-[#0D6E44] focus:ring-2 focus:ring-[#0D6E44]/20 rounded-xl py-2.5 pl-10 pr-3 text-xs text-white placeholder:text-neutral-500 transition-all outline-none"
              required
            />
          </div>
          <p className="text-[10px] text-neutral-500">
            Accepts Employee ID (WIN2601), Agent Email, or registered BD phone.
          </p>
        </div>

        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold text-neutral-300 block">Password</label>
          <div className="relative">
            <Lock className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="password"
              id="login-password-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full bg-neutral-800/90 border border-neutral-700 focus:border-[#0D6E44] focus:ring-2 focus:ring-[#0D6E44]/20 rounded-xl py-2.5 pl-10 pr-3 text-xs text-white placeholder:text-neutral-500 transition-all outline-none font-mono"
            />
          </div>
        </div>

        <button
          type="submit"
          id="login-submit-btn"
          disabled={isLoading}
          className="w-full bg-[#0D6E44] hover:bg-[#0A5735] active:scale-98 disabled:opacity-50 text-white font-bold text-xs py-3 rounded-xl shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 transition-all cursor-pointer mt-1"
        >
          {isLoading ? (
            <span>Connecting to CRM Gateway...</span>
          ) : (
            <>
              <span>Sign In with Single ID</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>

        {/* 7 Verified Agent Accounts Selector */}
        <div className="pt-3 border-t border-neutral-800 space-y-2">
          <div className="flex items-center justify-between text-[11px] text-neutral-400">
            <span className="flex items-center gap-1 font-medium">
              <Users className="w-3.5 h-3.5 text-emerald-400" />
              Verified Agent Roster (7 Accounts)
            </span>
            <span className="text-[10px] text-neutral-500">Click to load</span>
          </div>

          <div className="grid grid-cols-1 gap-1.5 max-h-36 overflow-y-auto pr-1 custom-scrollbar">
            {VERIFIED_WINSTONE_AGENTS.map((agent, idx) => {
              const isSelected = identifier.toUpperCase().includes(agent.employeeId);
              return (
                <button
                  key={agent.employeeId}
                  type="button"
                  onClick={() => handleSelectAgent(idx)}
                  className={`text-left p-1.5 rounded-lg border text-[11px] transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-emerald-950/60 border-emerald-600/80 text-emerald-200'
                      : 'bg-neutral-800/70 border-neutral-700/60 hover:bg-neutral-800 text-neutral-300'
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <span className="font-semibold block truncate">
                      {agent.name} <span className="text-[10px] text-emerald-400 font-mono">({agent.employeeId})</span>
                    </span>
                    <span className="text-[10px] text-neutral-400 truncate block">
                      {agent.phone} • {agent.territory}
                    </span>
                  </div>
                  <span className="shrink-0 text-[9px] px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-700 font-mono text-neutral-300">
                    ID #{idx + 1}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </form>
    </div>
  );
};

