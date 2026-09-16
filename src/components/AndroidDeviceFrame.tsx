import React, { useState, useEffect } from 'react';
import { Wifi, BatteryMedium, Signal, Smartphone, Monitor, Code2, RotateCw } from 'lucide-react';

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
  onOpenSyncMonitor,
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
    <div className="w-full min-h-screen bg-neutral-900 text-neutral-100 flex flex-col items-center p-2 sm:p-4 selection:bg-emerald-500 selection:text-white">
      {/* Top Bar: Device Mode & Project Info */}
      <header className="w-full max-w-5xl flex items-center justify-between mb-3 px-2 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-bold text-sm tracking-tight text-white">
              Winstone Agent
            </span>
          </div>
          <span className="text-neutral-500 text-xs hidden sm:inline">•</span>
          <span className="text-neutral-400 text-xs hidden sm:inline">
            Winstone Properties Ltd. • Android Kotlin / Jetpack Compose Architecture
          </span>
        </div>

        {/* View mode toggle & Kotlin Code Inspector */}
        <div className="flex items-center gap-2">
          {onOpenKotlinViewer && (
            <button
              id="top-btn-kotlin-code"
              onClick={onOpenKotlinViewer}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-emerald-400 rounded-lg text-xs font-semibold border border-neutral-700 transition-colors"
              title="Inspect Jetpack Compose source code"
            >
              <Code2 className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Kotlin Source Code</span>
              <span className="md:hidden">Code</span>
            </button>
          )}

          <div className="flex items-center bg-neutral-800 p-1 rounded-lg border border-neutral-700 text-xs">
            <button
              onClick={() => onChangeViewMode('device')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-semibold transition-all ${
                viewMode === 'device'
                  ? 'bg-[#0D6E44] text-white shadow-xs'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Pixel Emulator</span>
            </button>
            <button
              onClick={() => onChangeViewMode('expanded')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-semibold transition-all ${
                viewMode === 'expanded'
                  ? 'bg-[#0D6E44] text-white shadow-xs'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
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
          <div className="w-[390px] sm:w-[412px] h-[840px] max-h-[92vh] bg-neutral-950 rounded-[48px] p-3 shadow-[0_25px_70px_rgba(0,0,0,0.8),0_0_0_1px_rgba(255,255,255,0.1)] border-[4px] border-neutral-800 flex flex-col relative overflow-hidden ring-1 ring-neutral-700/50">
            {/* Camera Hole Punch */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-4 h-4 bg-neutral-950 rounded-full z-40 border border-neutral-800/80 shadow-inner flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-950/60" />
            </div>

            {/* Android Native Status Bar */}
            <div className="h-7 bg-white text-neutral-800 px-7 flex items-center justify-between text-[11px] font-semibold shrink-0 select-none z-30 pt-1">
              <span className="font-mono">{currentTime}</span>
              <div className="flex items-center gap-2 text-neutral-700">
                <span className="text-[10px] font-mono tracking-tighter">5G</span>
                <Signal className="w-3.5 h-3.5" />
                <Wifi className="w-3.5 h-3.5" />
                <BatteryMedium className="w-4 h-4" />
              </div>
            </div>

            {/* Application Inside Screen */}
            <div className="flex-1 flex flex-col bg-white overflow-hidden relative">
              {children}
            </div>

            {/* Android Gesture Bar */}
            <div className="h-5 bg-white flex items-center justify-center shrink-0 z-30">
              <div className="w-32 h-1 bg-neutral-400 rounded-full" />
            </div>
          </div>
        </div>
      ) : (
        /* Expanded Dashboard / Tablet View */
        <div className="w-full max-w-5xl h-[860px] max-h-[92vh] bg-white text-neutral-900 rounded-2xl shadow-2xl border border-neutral-200 flex flex-col overflow-hidden">
          {/* Status Bar Banner */}
          <div className="h-7 bg-neutral-900 text-neutral-300 px-4 flex items-center justify-between text-[11px] shrink-0">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Winstone Agent • Expanded Tablet Surface</span>
            </div>
            <div className="flex items-center gap-3 font-mono text-[10px]">
              <span>Resolution: 1080x1920 (Responsive)</span>
              <span>Online</span>
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
