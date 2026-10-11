import React from 'react';
import { X, Map, Waves, Sun, Download, Upload, RotateCcw } from 'lucide-react';
import { sounds } from '../audio/soundManager';

interface MapPresetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPreset: (preset: 'emerald_river' | 'sunny_plateau' | 'coastal_haven') => void;
  onResetEmpty: () => void;
  onExportJson: () => void;
  onImportJson: () => void;
}

export const MapPresetsModal: React.FC<MapPresetsModalProps> = ({
  isOpen,
  onClose,
  onSelectPreset,
  onResetEmpty,
  onExportJson,
  onImportJson,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 select-none">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-6 flex flex-col gap-5 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-lg font-bold text-white font-[var(--font-display)]">
              Map Scenarios & Data
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Choose a starting geography or manage your city save file.
            </p>
          </div>
          <button
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scenarios */}
        <div className="flex flex-col gap-2.5">
          <button
            onClick={() => {
              sounds.playAchievement();
              onSelectPreset('emerald_river');
              onClose();
            }}
            className="p-3 bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 hover:border-emerald-600/60 rounded-lg flex items-start gap-3 transition-all cursor-pointer text-left group"
          >
            <div className="p-2 rounded bg-emerald-950/80 text-emerald-400 group-hover:scale-105 transition-transform">
              <Waves className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors">
                Emerald River
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Meandering waterway spanned by a starter bridge, with a cozy riverside village.
              </p>
            </div>
          </button>

          <button
            onClick={() => {
              sounds.playAchievement();
              onSelectPreset('coastal_haven');
              onClose();
            }}
            className="p-3 bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 hover:border-sky-600/60 rounded-lg flex items-start gap-3 transition-all cursor-pointer text-left group"
          >
            <div className="p-2 rounded bg-sky-950/80 text-sky-400 group-hover:scale-105 transition-transform">
              <Map className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-white group-hover:text-sky-300 transition-colors">
                Coastal Haven
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Pristine sandy shoreline overlooking the ocean with waterfront boulevard.
              </p>
            </div>
          </button>

          <button
            onClick={() => {
              sounds.playAchievement();
              onSelectPreset('sunny_plateau');
              onClose();
            }}
            className="p-3 bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 hover:border-amber-600/60 rounded-lg flex items-start gap-3 transition-all cursor-pointer text-left group"
          >
            <div className="p-2 rounded bg-amber-950/80 text-amber-400 group-hover:scale-105 transition-transform">
              <Sun className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">
                Sunny Plateau
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                An open green canvas with optimal solar irradiance, ready for architectural freedom.
              </p>
            </div>
          </button>
        </div>

        {/* Data Persistence Section */}
        <div className="pt-2 border-t border-slate-800 flex flex-col gap-2">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            City File Management
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                sounds.playCoin();
                onExportJson();
              }}
              className="py-2 px-3 bg-slate-950/70 hover:bg-slate-800 border border-slate-800 rounded-lg text-xs font-medium text-slate-300 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-sky-400" />
              <span>Export JSON</span>
            </button>

            <button
              onClick={() => {
                onImportJson();
              }}
              className="py-2 px-3 bg-slate-950/70 hover:bg-slate-800 border border-slate-800 rounded-lg text-xs font-medium text-slate-300 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-emerald-400" />
              <span>Import JSON</span>
            </button>
          </div>

          <button
            onClick={() => {
              sounds.playDemolish();
              onResetEmpty();
              onClose();
            }}
            className="w-full py-1.5 text-rose-400 hover:text-rose-300 text-xs flex items-center justify-center gap-1.5 hover:bg-rose-950/20 rounded transition-colors cursor-pointer mt-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Empty Grid</span>
          </button>
        </div>
      </div>
    </div>
  );
};
