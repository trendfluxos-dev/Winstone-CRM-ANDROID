import React, { useState } from 'react';
import {
  X,
  Smartphone,
  Download,
  Github,
  Terminal,
  CheckCircle2,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Cpu,
  Layers,
  Sparkles,
  ArrowRight,
  FileCheck,
} from 'lucide-react';

interface AndroidApkBuildModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AndroidApkBuildModal: React.FC<AndroidApkBuildModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'github' | 'local' | 'workflow'>('github');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  if (!isOpen) return null;

  const repoUrl = 'https://github.com/trendfluxos-dev/Winstone-CRM-ANDROID';

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const localBuildCommands = `# 1. Clone your Android native repository:
git clone https://github.com/trendfluxos-dev/Winstone-CRM-ANDROID.git
cd Winstone-CRM-ANDROID

# 2. Grant executable permission to Gradle wrapper:
chmod +x ./gradlew

# 3. Clean and build the production release APK:
./gradlew clean assembleRelease

# (Or for unsigned debug testing APK):
./gradlew assembleDebug

# 4. Built APK will be generated at:
# app/build/outputs/apk/release/app-release.apk
# app/build/outputs/apk/debug/app-debug.apk

# 5. Check SHA-256 Checksum:
sha256sum app/build/outputs/apk/release/*.apk`;

  const githubActionsWorkflow = `name: Build Winstone Android APK

on:
  push:
    branches: [ main, master ]
    tags: [ 'v*' ]
  workflow_dispatch:

jobs:
  build-apk:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with:
          distribution: 'temurin'
          java-version: '17'
          cache: 'gradle'
      - name: Make Gradlew Executable
        run: chmod +x ./gradlew
      - name: Build APK
        run: ./gradlew assembleRelease || ./gradlew assembleDebug
      - name: Upload APK
        uses: actions/upload-artifact@v4
        with:
          name: winstone-connect-apk
          path: app/build/outputs/apk/**/*.apk`;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
      <div className="bg-[#0F172A] text-white rounded-2xl w-full max-w-2xl border border-[#CFA349]/40 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 bg-[#1E293B] border-b border-[#334155] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#CFA349]/20 border border-[#CFA349]/40 flex items-center justify-center text-[#CFA349]">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                <span>Winstone Android APK Build Hub</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Git CI/CD Ready
                </span>
              </h3>
              <p className="text-[11px] text-[#94A3B8]">
                Native Android Build & Automated GitHub Actions Pipeline
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#94A3B8] hover:text-white hover:bg-[#334155] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-4 pt-3 bg-[#1E293B]/60 border-b border-[#334155] flex gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('github')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'github'
                ? 'border-[#CFA349] text-[#CFA349]'
                : 'border-transparent text-[#94A3B8] hover:text-white'
            }`}
          >
            <Github className="w-3.5 h-3.5" />
            <span>1. GitHub Automated Build</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('local')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'local'
                ? 'border-[#CFA349] text-[#CFA349]'
                : 'border-transparent text-[#94A3B8] hover:text-white'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>2. Local Gradle Command</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('workflow')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'workflow'
                ? 'border-[#CFA349] text-[#CFA349]'
                : 'border-transparent text-[#94A3B8] hover:text-white'
            }`}
          >
            <FileCheck className="w-3.5 h-3.5" />
            <span>3. CI/CD Workflow File</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-4 overflow-y-auto custom-scrollbar space-y-4 text-xs">
          {/* TAB 1: GITHUB AUTOMATED BUILD */}
          {activeTab === 'github' && (
            <div className="space-y-3.5 text-left">
              <div className="bg-[#1E293B] p-3.5 rounded-xl border border-[#334155] space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Github className="w-4 h-4 text-[#CFA349]" />
                    Official GitHub Repository
                  </span>
                  <a
                    href={repoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 px-2.5 py-1 bg-[#CFA349] text-[#0F172A] font-extrabold rounded-lg hover:brightness-110 transition-all text-[11px]"
                  >
                    <span>Open on GitHub</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <div className="p-2 bg-[#0F172A] rounded-lg border border-[#334155] font-mono text-[11px] text-[#CFA349] break-all">
                  {repoUrl}
                </div>
              </div>

              <div className="bg-[#1E293B] p-3.5 rounded-xl border border-[#334155] space-y-2">
                <h4 className="font-bold text-white flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#CFA349]" />
                  How to Build the APK on GitHub in 2 Minutes:
                </h4>
                <ol className="list-decimal list-inside space-y-1.5 text-[#94A3B8] pl-1 leading-relaxed">
                  <li>
                    Ensure <span className="font-mono text-[#CFA349]">.github/workflows/build-android-apk.yml</span> is committed in your repository.
                  </li>
                  <li>
                    Go to your repository on GitHub: <strong className="text-white">trendfluxos-dev/Winstone-CRM-ANDROID</strong>.
                  </li>
                  <li>
                    Click on the <strong className="text-white">Actions</strong> tab.
                  </li>
                  <li>
                    Select <strong className="text-white">"Build Winstone Android APK"</strong> in the left sidebar.
                  </li>
                  <li>
                    Click <strong className="text-white">"Run workflow"</strong> and select <span className="font-mono text-[#CFA349]">release</span>.
                  </li>
                  <li>
                    Once finished (2–3 mins), download the generated <strong className="text-white">winstone-connect-apk.zip</strong> directly under <strong className="text-white">Artifacts</strong>!
                  </li>
                </ol>
              </div>

              {/* Parity & Verification Banner */}
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 space-y-1 text-emerald-400">
                <div className="flex items-center gap-1.5 font-bold">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Master Production Contract Compliance</span>
                </div>
                <p className="text-[11px] text-emerald-300 leading-relaxed">
                  The Android build points directly to <strong className="font-mono">https://webcrm.winstonebd.com</strong> with zero hardcoded credentials, full Asia/Dhaka Daily Performance sync, and deterministic Top 3 ranking.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: LOCAL GRADLE BUILD */}
          {activeTab === 'local' && (
            <div className="space-y-3 text-left">
              <p className="text-[#94A3B8] leading-relaxed">
                If you have Android Studio or Java/Gradle installed on your computer, you can build the APK locally using these terminal commands:
              </p>

              <div className="relative bg-[#0F172A] p-3 rounded-xl border border-[#334155] font-mono text-[11px]">
                <button
                  type="button"
                  onClick={() => copyToClipboard(localBuildCommands, 'local')}
                  className="absolute top-2.5 right-2.5 px-2 py-1 bg-[#1E293B] hover:bg-[#334155] rounded text-[10px] font-mono text-white flex items-center gap-1 cursor-pointer"
                >
                  {copiedCode === 'local' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedCode === 'local' ? 'Copied' : 'Copy Commands'}</span>
                </button>
                <pre className="text-slate-300 overflow-x-auto leading-relaxed pt-2">
                  {localBuildCommands}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 3: GITHUB ACTIONS WORKFLOW FILE */}
          {activeTab === 'workflow' && (
            <div className="space-y-3 text-left">
              <div className="flex items-center justify-between text-[#94A3B8]">
                <span>Path: <strong className="font-mono text-white">.github/workflows/build-android-apk.yml</strong></span>
                <span className="text-emerald-400 font-bold">Saved in project root</span>
              </div>

              <div className="relative bg-[#0F172A] p-3 rounded-xl border border-[#334155] font-mono text-[10.5px]">
                <button
                  type="button"
                  onClick={() => copyToClipboard(githubActionsWorkflow, 'workflow')}
                  className="absolute top-2.5 right-2.5 px-2 py-1 bg-[#1E293B] hover:bg-[#334155] rounded text-[10px] font-mono text-white flex items-center gap-1 cursor-pointer"
                >
                  {copiedCode === 'workflow' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedCode === 'workflow' ? 'Copied' : 'Copy YAML'}</span>
                </button>
                <pre className="text-[#CFA349] overflow-x-auto max-h-64 custom-scrollbar leading-relaxed pt-2">
                  {githubActionsWorkflow}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-[#1E293B] border-t border-[#334155] flex items-center justify-between shrink-0 text-xs">
          <div className="flex items-center gap-1.5 text-[#94A3B8]">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>API URL: <strong className="font-mono text-white">webcrm.winstonebd.com</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 bg-[#334155] hover:bg-[#475569] text-white font-bold rounded-xl transition-all cursor-pointer"
            >
              Close
            </button>
            <a
              href={`${repoUrl}/actions`}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-1.5 bg-gradient-to-r from-[#CFA349] to-[#8C6B24] hover:brightness-110 text-[#0F172A] font-extrabold rounded-xl shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <span>Build on GitHub Actions</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
