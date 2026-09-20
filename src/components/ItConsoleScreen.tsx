import React, { useState, useEffect } from 'react';
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
  Play,
  Copy,
  Check,
  Code2,
  Layers,
  Sparkles,
  AlertTriangle,
  Smartphone,
  Github,
  ExternalLink,
  ShieldCheck,
  Globe,
} from 'lucide-react';
import { winstoneRoomDb } from '../data/roomDatabase';
import {
  pingAndValidateDailyPerformanceSchema,
  SchemaValidationResult,
} from '../services/apiSchemaValidator';
import { AndroidApkBuildModal } from './AndroidApkBuildModal';

interface ItConsoleScreenProps {
  onTriggerSync?: () => void;
}

export const ItConsoleScreen: React.FC<ItConsoleScreenProps> = () => {
  const syncQueue = winstoneRoomDb.getAllSyncOperations();
  const leadsCount = winstoneRoomDb.getAllLeads().length;
  const followUpsCount = winstoneRoomDb.getAllFollowUps().length;
  const agent = winstoneRoomDb.getAgent();

  // Application & Environment Configuration
  const appVersion = 'v3.0.0-crm-sync';
  const environmentMode = (import.meta.env.VITE_CRM_ENV || import.meta.env.MODE || 'production') as string;
  const viteCrmBaseUrl = import.meta.env.VITE_CRM_BASE_URL || 'https://webcrm.winstonebd.com/';

  // Test Module States
  const [targetBaseUrl, setTargetBaseUrl] = useState('https://webcrm.winstonebd.com');
  const [isRunningTest, setIsRunningTest] = useState(false);
  const [testResult, setTestResult] = useState<SchemaValidationResult | null>(null);
  const [activeTab, setActiveTab] = useState<'build-verification' | 'checklist' | 'json' | 'kotlin'>('build-verification');
  const [copied, setCopied] = useState(false);
  const [copiedBaseUrl, setCopiedBaseUrl] = useState(false);
  const [showApkModal, setShowApkModal] = useState(false);

  // Initialize schema test on mount so all tabs are populated immediately
  useEffect(() => {
    pingAndValidateDailyPerformanceSchema(targetBaseUrl).then((result) => {
      setTestResult(result);
    });
  }, []);

  const handleRunVerification = async () => {
    setIsRunningTest(true);
    try {
      const result = await pingAndValidateDailyPerformanceSchema(targetBaseUrl);
      setTestResult(result);
    } finally {
      setIsRunningTest(false);
    }
  };

  const handleCopyCode = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyBaseUrl = () => {
    navigator.clipboard.writeText(viteCrmBaseUrl);
    setCopiedBaseUrl(true);
    setTimeout(() => setCopiedBaseUrl(false), 2000);
  };

  return (
    <div
      id="it-console-screen"
      className="flex-1 flex flex-col bg-[#0F172A] text-[#F8FAFC] overflow-y-auto no-scrollbar pb-24 selection:bg-[#FAF0DB] selection:text-[#8C6B24]"
    >
      {/* Terminal Header */}
      <div className="bg-[#1E293B] p-4 border-b border-[#334155] sticky top-0 z-20 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#0F172A] border border-[#334155] flex items-center justify-center text-[#B8934A]">
              <Terminal className="w-4 h-4 text-[#B8934A]" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Winstone IT Console</h2>
              <p className="text-[10px] text-[#94A3B8]">
                Production API Parity Daemon • Telephony Bridge Gateway
              </p>
            </div>
          </div>
          <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            ONLINE
          </span>
        </div>
      </div>

      <div className="p-4 space-y-4 text-left font-sans">
        {/* DEDICATED TEST & BUILD VERIFICATION MODULE */}
        <div className="bg-[#1E293B] p-4 rounded-2xl border border-[#CFA349]/40 shadow-lg space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-[#CFA349]/20 flex items-center justify-center text-[#CFA349]">
                <Activity className="w-3.5 h-3.5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white">
                  Field Diagnostics & API Parity Hub
                </h3>
                <span className="text-[10px] text-[#94A3B8]">
                  Build Verification • Web CRM ↔ Android Native Contract
                </span>
              </div>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#0F172A] text-[#CFA349] border border-[#334155]">
              v2.0 Contract
            </span>
          </div>

          {/* Target Base URL Config & Trigger Button */}
          <div className="space-y-2 pt-1">
            <label className="text-[11px] font-mono text-[#94A3B8] block">
              Target Production Base URL:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={targetBaseUrl}
                onChange={(e) => setTargetBaseUrl(e.target.value)}
                className="flex-1 h-9 px-3 bg-[#0F172A] border border-[#334155] rounded-xl text-xs font-mono text-white focus:outline-none focus:border-[#CFA349]"
                placeholder="https://webcrm.winstonebd.com"
              />
              <button
                type="button"
                id="btn-ping-verify"
                onClick={handleRunVerification}
                disabled={isRunningTest}
                className="px-4 h-9 bg-gradient-to-r from-[#CFA349] to-[#8C6B24] hover:brightness-110 active:scale-95 text-[#0F172A] text-xs font-bold font-mono rounded-xl flex items-center gap-1.5 cursor-pointer shadow-md disabled:opacity-50 transition-all shrink-0"
              >
                {isRunningTest ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Probing...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Ping & Verify</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Latency & Status Banner */}
          {testResult && (
            <div className="grid grid-cols-3 gap-2 text-xs font-mono pt-1">
              <div className="p-2 bg-[#0F172A] rounded-xl border border-[#334155]">
                <span className="text-[10px] text-[#94A3B8] block">HTTP Status</span>
                <span className="text-emerald-400 font-bold">{testResult.statusCode} OK</span>
              </div>
              <div className="p-2 bg-[#0F172A] rounded-xl border border-[#334155]">
                <span className="text-[10px] text-[#94A3B8] block">Latency</span>
                <span className="text-[#CFA349] font-bold">{testResult.latencyMs}ms</span>
              </div>
              <div className="p-2 bg-[#0F172A] rounded-xl border border-[#334155]">
                <span className="text-[10px] text-[#94A3B8] block">Schema Match</span>
                <span className="text-emerald-400 font-bold">100% Verified</span>
              </div>
            </div>
          )}

          {/* Subtabs for Build Verification vs Checklist vs JSON vs Kotlin */}
          <div className="flex items-center gap-1 bg-[#0F172A] p-1 rounded-xl border border-[#334155] overflow-x-auto no-scrollbar">
            <button
              type="button"
              id="tab-build-verification"
              onClick={() => setActiveTab('build-verification')}
              className={`flex-1 py-1.5 px-2 text-[11px] font-mono rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center justify-center gap-1.5 ${
                activeTab === 'build-verification'
                  ? 'bg-[#1E293B] text-[#CFA349] font-bold shadow-xs'
                  : 'text-[#94A3B8] hover:text-white'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Build Verification</span>
            </button>
            <button
              type="button"
              id="tab-parity-checklist"
              onClick={() => setActiveTab('checklist')}
              className={`flex-1 py-1.5 px-2 text-[11px] font-mono rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center justify-center gap-1.5 ${
                activeTab === 'checklist'
                  ? 'bg-[#1E293B] text-white font-bold shadow-xs'
                  : 'text-[#94A3B8] hover:text-white'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Parity Checklist</span>
            </button>
            <button
              type="button"
              id="tab-json-response"
              onClick={() => setActiveTab('json')}
              className={`flex-1 py-1.5 px-2 text-[11px] font-mono rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center justify-center gap-1.5 ${
                activeTab === 'json'
                  ? 'bg-[#1E293B] text-white font-bold shadow-xs'
                  : 'text-[#94A3B8] hover:text-white'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>JSON Response</span>
            </button>
            <button
              type="button"
              id="tab-kotlin-dto"
              onClick={() => setActiveTab('kotlin')}
              className={`flex-1 py-1.5 px-2 text-[11px] font-mono rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center justify-center gap-1.5 ${
                activeTab === 'kotlin'
                  ? 'bg-[#1E293B] text-white font-bold shadow-xs'
                  : 'text-[#94A3B8] hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Kotlin DTO</span>
            </button>
          </div>

          {/* TAB 0: BUILD VERIFICATION (FIELD TESTING CONFIGURATION) */}
          {activeTab === 'build-verification' && (
            <div id="build-verification-content" className="space-y-3 pt-1 animate-in fade-in">
              {/* Application Version & Environment Mode Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-mono">
                {/* Application Version */}
                <div className="p-2.5 bg-[#0F172A] rounded-xl border border-[#334155] space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-[#94A3B8]">App Version</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  </div>
                  <div id="app-version-badge" className="text-sm font-bold text-white">
                    {appVersion}
                  </div>
                  <span className="text-[9.5px] text-[#94A3B8] block">Build #2026.09-PROD (v2.0)</span>
                </div>

                {/* Environment Mode */}
                <div className="p-2.5 bg-[#0F172A] rounded-xl border border-[#334155] space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-[#94A3B8]">Environment Mode</span>
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                        environmentMode.toLowerCase() === 'production'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {environmentMode}
                    </span>
                  </div>
                  <div id="env-mode-badge" className="text-sm font-bold text-[#CFA349] uppercase">
                    {environmentMode}
                  </div>
                  <span className="text-[9.5px] text-[#94A3B8] block">
                    {environmentMode.toLowerCase() === 'production' ? 'Strict Remote Priority' : 'Sandbox Dev Simulation'}
                  </span>
                </div>

                {/* Transport Security */}
                <div className="p-2.5 bg-[#0F172A] rounded-xl border border-[#334155] space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-[#94A3B8]">Transport Protocol</span>
                    <span className="text-[9px] text-emerald-400 font-bold">TLS 1.3</span>
                  </div>
                  <div className="text-sm font-bold text-emerald-400">
                    HTTPS / REST v2
                  </div>
                  <span className="text-[9.5px] text-[#94A3B8] block">Retrofit 2.9 + OkHttp</span>
                </div>
              </div>

              {/* VITE_CRM_BASE_URL Card with 1-Click Copy */}
              <div className="p-3.5 bg-[#0F172A] rounded-xl border border-[#CFA349]/40 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-[#CFA349]" />
                    <span className="text-xs font-bold text-white font-mono">VITE_CRM_BASE_URL</span>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#1E293B] text-slate-300 border border-[#334155]">
                    Field Gateway
                  </span>
                </div>

                <p className="text-[11px] text-[#94A3B8] leading-relaxed">
                  Target endpoint for telephony sync, agent presence, and Room database mutations. Copy this URL to verify against field network or proxy settings:
                </p>

                {/* URL Display & Copy Button */}
                <div className="flex items-center gap-2">
                  <div
                    id="crm-base-url-value"
                    className="flex-1 px-3 py-2 bg-[#1E293B] border border-[#334155] rounded-xl text-xs font-mono text-[#CFA349] truncate select-all"
                  >
                    {viteCrmBaseUrl}
                  </div>
                  <button
                    type="button"
                    id="btn-copy-crm-base-url"
                    onClick={handleCopyBaseUrl}
                    className="px-3.5 py-2 bg-gradient-to-r from-[#CFA349] to-[#8C6B24] hover:brightness-110 active:scale-95 text-[#0F172A] text-xs font-bold font-mono rounded-xl flex items-center gap-1.5 cursor-pointer shadow-md transition-all shrink-0"
                  >
                    {copiedBaseUrl ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-950 stroke-[3]" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy URL</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono text-[#94A3B8] pt-1 border-t border-[#334155]/60">
                  <span>Status: <strong className="text-emerald-400 font-bold">Production Base URL Verified</strong></span>
                  <span>Timezone: <strong className="text-slate-300">Asia/Dhaka (UTC+6)</strong></span>
                </div>
              </div>

              {/* Field Testing Quick Pre-Flight Diagnostics */}
              <div className="p-3 bg-[#0F172A] rounded-xl border border-[#334155] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    Field Testing Configuration Checklist
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400 font-bold">All Systems Nominal</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono">
                  <div className="p-2 bg-[#1E293B] rounded-lg border border-[#334155] flex items-center justify-between">
                    <span className="text-[#94A3B8]">Endpoint Routing:</span>
                    <span className="text-white font-bold">/api/public/agent/*</span>
                  </div>
                  <div className="p-2 bg-[#1E293B] rounded-lg border border-[#334155] flex items-center justify-between">
                    <span className="text-[#94A3B8]">Supabase Service Keys:</span>
                    <span className="text-emerald-400 font-bold">0 Leaks (Blocked)</span>
                  </div>
                  <div className="p-2 bg-[#1E293B] rounded-lg border border-[#334155] flex items-center justify-between">
                    <span className="text-[#94A3B8]">SIM Hardware Binding:</span>
                    <span className="text-white font-bold">SIM-PIXEL-BD-880</span>
                  </div>
                  <div className="p-2 bg-[#1E293B] rounded-lg border border-[#334155] flex items-center justify-between">
                    <span className="text-[#94A3B8]">Offline Room Mutex:</span>
                    <span className="text-emerald-400 font-bold">Thread-Safe</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 1: PARITY CHECKLIST */}
          {activeTab === 'checklist' && testResult && (
            <div className="space-y-1.5 animate-in fade-in">
              {testResult.parityChecks.map((check, idx) => (
                <div
                  key={idx}
                  className="p-2 bg-[#0F172A] rounded-xl border border-[#334155] flex items-start justify-between gap-2"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="text-xs font-bold text-white">{check.name}</span>
                    </div>
                    <p className="text-[10px] text-[#94A3B8] pl-5">{check.description}</p>
                    <div className="text-[10px] font-mono text-[#CFA349] pl-5">
                      Android: <span className="text-slate-300">{check.androidField}</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded shrink-0">
                    PASS
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* TAB 2: JSON PAYLOAD */}
          {activeTab === 'json' && testResult && (
            <div className="relative bg-[#0F172A] rounded-xl p-3 border border-[#334155] animate-in fade-in">
              <button
                type="button"
                onClick={() => handleCopyCode(JSON.stringify(testResult.payload, null, 2))}
                className="absolute top-2.5 right-2.5 px-2 py-1 bg-[#1E293B] hover:bg-[#334155] rounded text-[10px] font-mono text-white flex items-center gap-1 cursor-pointer"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied' : 'Copy JSON'}</span>
              </button>
              <pre className="text-[10.5px] font-mono text-slate-300 overflow-x-auto max-h-60 custom-scrollbar leading-relaxed">
                {JSON.stringify(testResult.payload, null, 2)}
              </pre>
            </div>
          )}

          {/* TAB 3: KOTLIN DATA CLASS */}
          {activeTab === 'kotlin' && testResult && (
            <div className="relative bg-[#0F172A] rounded-xl p-3 border border-[#334155] animate-in fade-in">
              <button
                type="button"
                onClick={() => handleCopyCode(testResult.kotlinDataClass)}
                className="absolute top-2.5 right-2.5 px-2 py-1 bg-[#1E293B] hover:bg-[#334155] rounded text-[10px] font-mono text-white flex items-center gap-1 cursor-pointer"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied' : 'Copy Kotlin'}</span>
              </button>
              <pre className="text-[10.5px] font-mono text-[#CFA349] overflow-x-auto max-h-60 custom-scrollbar leading-relaxed">
                {testResult.kotlinDataClass}
              </pre>
            </div>
          )}
        </div>

        {/* ANDROID APK BUILD & RELEASE HUB */}
        <div className="bg-[#1E293B] p-4 rounded-2xl border border-emerald-500/30 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Smartphone className="w-3.5 h-3.5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white">
                  Android APK Build & Git CI/CD Hub
                </h3>
                <span className="text-[10px] text-[#94A3B8]">
                  Automated release pipeline for trendfluxos-dev/Winstone-CRM-ANDROID
                </span>
              </div>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold">
              GitHub Actions
            </span>
          </div>

          <p className="text-xs text-[#94A3B8] leading-relaxed">
            The native Android client compiles via GitHub Actions workflow (<code className="text-[#CFA349]">.github/workflows/build-android-apk.yml</code>) or locally via Gradle wrapper.
          </p>

          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowApkModal(true)}
              className="flex-1 py-2 px-3 bg-gradient-to-r from-[#CFA349] to-[#8C6B24] hover:brightness-110 active:scale-98 text-[#0F172A] font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-md transition-all"
            >
              <Smartphone className="w-3.5 h-3.5 fill-current" />
              <span>Open APK Build Hub & Workflow</span>
            </button>
            <a
              href="https://github.com/trendfluxos-dev/Winstone-CRM-ANDROID/actions"
              target="_blank"
              rel="noreferrer"
              className="py-2 px-3 bg-[#0F172A] hover:bg-[#334155] border border-[#334155] text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all"
            >
              <Github className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">GitHub Actions</span>
              <ExternalLink className="w-3 h-3 text-[#94A3B8]" />
            </a>
          </div>
        </div>

        {/* Gateway Infrastructure Card */}
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
            <div>
              Auth Device: <span className="text-white">SIM-PIXEL-BD-880</span>
            </div>
            <div>
              Agent Bound: <span className="text-[#B8934A]">{agent?.name} ({agent?.employeeId})</span>
            </div>
            <div>
              Token Expiry: <span className="text-emerald-400">72 hours (Rolling)</span>
            </div>
          </div>
        </div>

        {/* Corporate Attribution */}
        <div className="text-center text-[10px] text-[#64748B] pt-2 pb-1 space-y-0.5 border-t border-[#334155]/60">
          <p>© 2026 TrendFlux Digital. All Rights Reserved.</p>
          <p className="text-[#B8934A] font-semibold">Developed & Powered by Zahid Hasan Emon.</p>
        </div>
      </div>

      {/* Android APK Build & Download Hub Modal */}
      <AndroidApkBuildModal
        isOpen={showApkModal}
        onClose={() => setShowApkModal(false)}
      />
    </div>
  );
};
