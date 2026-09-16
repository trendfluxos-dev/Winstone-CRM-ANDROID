import React, { useState, useEffect } from 'react';
import { Wifi, BatteryMedium, Signal, Smartphone, Monitor, Code2 } from 'lucide-react';

interface AndroidDeviceFrameProps {
  children: React.ReactNode;
  viewMode: 'device' | 'expanded';
  onChangeViewMode: (mode: 'device' | 'expanded') => void;
  onOpenKotlinViewer?: () => void;
  onOpenSyncMonitor?: () => void;
}

export const AndroidDeviceFrame: React.FC<AndroidDeviceFrameProps> = ({
  children,
  viewMode,
  onChangeViewMode,
  onOpenKotlinViewer,
}) => {
  const [currentTime, setCurrentTime] = useState('12:45');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full min-h-screen bg-[#F4F5F7] text-[#1E293B] flex flex-col items-center p-2 sm:p-4 selection:bg-[#FAF0DB] selection:text-[#8C6B24]">
      {/* Top Bar: Device Mode & Project Info */}
      <header className="w-full max-w-5xl flex items-center justify-between mb-3 px-2 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#B8934A] shadow-[0_0_6px_rgba(184,147,74,0.4)]" />
            <span className="font-bold text-sm tracking-wide text-[#1E293B]">
              Winstone Properties
            </span>
          </div>
          <span className="text-neutral-300 text-xs hidden sm:inline">•</span>
          <span className="text-[#64748B] text-xs hidden sm:inline font-medium">
            Agent Intelligence & Telephony Gateway • Clean Luxury Edition
          </span>
        </div>

        {/* View mode toggle & Kotlin Code Inspector */}
        <div className="flex items-center gap-2">
          {onOpenKotlinViewer && (
            <button
              id="top-btn-kotlin-code"
              onClick={onOpenKotlinViewer}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-[#FAF9F6] text-[#64748B] hover:text-[#1E293B] rounded-xl text-xs font-semibold border border-[#E2E8F0] shadow-2xs transition-all cursor-pointer"
              title="Inspect Jetpack Compose source code"
            >
              <Code2 className="w-3.5 h-3.5 text-[#B8934A]" />
              <span className="hidden md:inline">Kotlin Source Code</span>
              <span className="md:hidden">Code</span>
            </button>
          )}

          <div className="flex items-center bg-white p-1 rounded-xl border border-[#E2E8F0] shadow-2xs text-xs">
            <button
              onClick={() => onChangeViewMode('device')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                viewMode === 'device'
                  ? 'bg-[#FAF6EE] text-[#8C6B24] border border-[#E8DFCF] shadow-2xs'
                  : 'text-[#64748B] hover:text-[#1E293B]'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5 text-[#B8934A]" />
              <span>Mobile View</span>
            </button>
            <button
              onClick={() => onChangeViewMode('expanded')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                viewMode === 'expanded'
                  ? 'bg-[#FAF6EE] text-[#8C6B24] border border-[#E8DFCF] shadow-2xs'
                  : 'text-[#64748B] hover:text-[#1E293B]'
              }`}
            >
              <Monitor className="w-3.5 h-3.5 text-[#B8934A]" />
              <span className="hidden sm:inline">Expanded Mode</span>
              <span className="sm:hidden">Full</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container: Android Phone Frame or Expanded View */}
      {viewMode === 'device' ? (
        <div className="relative my-auto">
          {/* External Phone Chassis */}
          <div className="w-[390px] sm:w-[412px] h-[840px] max-h-[92vh] bg-white rounded-[44px] p-2.5 shadow-[0_20px_60px_rgba(0,0,0,0.12),0_1px_3px_rgba(0,0,0,0.05)] border-[5px] border-[#E2E8F0] flex flex-col relative overflow-hidden ring-1 ring-black/5">
            {/* Camera Hole Punch */}
            <div className="absolute top-3.5 left-1/2 -translate-x-1/2 w-4 h-4 bg-[#1E293B] rounded-full z-40 border border-neutral-300 shadow-inner flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-black" />
            </div>

            {/* Android Native Status Bar */}
            <div className="h-7 bg-white text-[#334155] px-6 flex items-center justify-between text-[11px] font-semibold shrink-0 select-none z-30 pt-1 border-b border-[#F1F5F9]">
              <span className="font-mono text-[#1E293B]">{currentTime}</span>
              <div className="flex items-center gap-2 text-[#64748B]">
                <span className="text-[10px] font-mono tracking-tighter text-[#B8934A] font-bold">5G</span>
                <Signal className="w-3.5 h-3.5" />
                <Wifi className="w-3.5 h-3.5" />
                <BatteryMedium className="w-4 h-4 text-[#334155]" />
              </div>
            </div>

            {/* Application Inside Screen */}
            <div className="flex-1 flex flex-col bg-[#F8F9FA] overflow-hidden relative">
              {children}
            </div>

            {/* Android Gesture Bar */}
            <div className="h-4 bg-white flex items-center justify-center shrink-0 z-30 border-t border-[#F1F5F9]">
              <div className="w-28 h-1 bg-neutral-300 rounded-full" />
            </div>
          </div>
        </div>
      ) : (
        /* Expanded Dashboard / Tablet View */
        <div className="w-full max-w-5xl h-[860px] max-h-[92vh] bg-[#F8F9FA] text-[#1E293B] rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.08)] border border-[#E2E8F0] flex flex-col overflow-hidden">
          {/* Status Bar Banner */}
          <div className="h-8 bg-white text-[#475569] px-4 flex items-center justify-between text-[11px] shrink-0 border-b border-[#E2E8F0]">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#B8934A] shadow-[0_0_4px_rgba(184,147,74,0.4)]" />
              <span className="text-[#1E293B] font-semibold">Winstone Agent • Luxury Real Estate Terminal</span>
            </div>
            <div className="flex items-center gap-3 font-mono text-[10px] text-[#64748B]">
              <span>Resolution: 1080x1920</span>
              <span className="text-[#B8934A] font-semibold">Live Operational</span>
            </div>
          </div>
          <div className="flex-1 flex flex-col overflow-hidden relative">
            {children}
          </div>
        </div>
      )}
    </div>
  );
};
