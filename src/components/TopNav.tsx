import React from 'react';
import { Camera, HelpCircle, Layers, Sliders, Volume2, VolumeX } from 'lucide-react';
import { sounds } from '../audio/soundManager';

interface TopNavProps {
  onOpenPolicies: () => void;
  onOpenPresets: () => void;
  onOpenHelp: () => void;
  onTriggerPhoto: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onSaveCity: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  onOpenPolicies,
  onOpenPresets,
  onOpenHelp,
  onTriggerPhoto,
  soundEnabled,
  onToggleSound,
  onSaveCity,
}) => {
  return (
    <header className="fixed top-0 left-0 right-0 h-14 z-30 bg-slate-900/85 backdrop-blur-md border-b border-slate-800/80 px-6 flex items-center justify-between gap-8 select-none">
      {/* Zone 1: Single text wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        <span className="text-xl font-bold tracking-tight text-white font-[var(--font-display)] whitespace-nowrap shrink-0">
          Isopolis
        </span>
        <span className="text-xs text-sky-400 font-medium tracking-wide uppercase px-2 py-0.5 rounded bg-sky-950/60 border border-sky-800/40">
          3D City
        </span>
      </div>

      {/* Zone 2: 4-5 clean single-line nav links */}
      <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
        <button
          onClick={() => {
            sounds.playClick();
            onOpenPolicies();
          }}
          className="flex items-center gap-1.5 hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Sliders className="w-4 h-4 text-sky-400" />
          <span>Policies & Taxes</span>
        </button>

        <button
          onClick={() => {
            sounds.playClick();
            onOpenPresets();
          }}
          className="flex items-center gap-1.5 hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Layers className="w-4 h-4 text-emerald-400" />
          <span>Scenarios & Maps</span>
        </button>

        <button
          onClick={() => {
            sounds.playClick();
            onTriggerPhoto();
          }}
          className="flex items-center gap-1.5 hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Camera className="w-4 h-4 text-amber-400" />
          <span>Photo Snapshot</span>
        </button>

        <button
          onClick={() => {
            sounds.playClick();
            onOpenHelp();
          }}
          className="flex items-center gap-1.5 hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <HelpCircle className="w-4 h-4 text-slate-400" />
          <span>Guide</span>
        </button>

        <button
          onClick={() => {
            onToggleSound();
          }}
          title={soundEnabled ? 'Mute Audio' : 'Enable Audio'}
          className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
        >
          {soundEnabled ? <Volume2 className="w-4 h-4 text-sky-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
        </button>
      </nav>

      {/* Zone 3: 1 primary action */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={() => {
            sounds.playCoin();
            onSaveCity();
          }}
          className="px-4 py-1.5 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 active:scale-95 transition-all rounded-md shadow-sm whitespace-nowrap shrink-0 cursor-pointer"
        >
          Save City
        </button>
      </div>
    </header>
  );
};
