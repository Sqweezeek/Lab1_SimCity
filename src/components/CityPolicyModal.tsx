import React from 'react';
import { X, Percent, CheckCircle2, Circle } from 'lucide-react';
import { CityPolicy } from '../types/city';
import { sounds } from '../audio/soundManager';

interface CityPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  policies: CityPolicy[];
  onTogglePolicy: (id: string) => void;
  taxRate: number;
  onChangeTaxRate: (rate: number) => void;
}

export const CityPolicyModal: React.FC<CityPolicyModalProps> = ({
  isOpen,
  onClose,
  policies,
  onTogglePolicy,
  taxRate,
  onChangeTaxRate,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 select-none">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-6 flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-lg font-bold text-white font-[var(--font-display)]">
              City Policies & Taxation
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Enact municipal ordinances and calibrate tax brackets to shape your metropolis.
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

        {/* Tax Rate Slider */}
        <div className="bg-slate-950/70 p-4 rounded-lg border border-slate-800/80 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Percent className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-semibold text-white">Residential & Commerce Tax</span>
            </div>
            <span className="text-sm font-bold font-mono tabular-nums text-amber-400">
              {Math.round(taxRate * 100)}%
            </span>
          </div>

          <input
            type="range"
            min="5"
            max="16"
            value={Math.round(taxRate * 100)}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10);
              onChangeTaxRate(val / 100);
            }}
            className="w-full accent-amber-500 cursor-pointer"
          />

          <div className="flex justify-between text-[11px] text-slate-400">
            <span>5% (High Happiness)</span>
            <span>9% (Standard Balanced)</span>
            <span>16% (Maximum Revenue)</span>
          </div>
        </div>

        {/* Policies List */}
        <div className="flex flex-col gap-2.5">
          <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Active Municipal Ordinances
          </h3>

          <div className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-1">
            {policies.map((pol) => {
              return (
                <div
                  key={pol.id}
                  onClick={() => {
                    sounds.playClick();
                    onTogglePolicy(pol.id);
                  }}
                  className={`p-3 rounded-lg border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    pol.active
                      ? 'bg-sky-950/40 border-sky-600/70'
                      : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {pol.active ? (
                        <CheckCircle2 className="w-4 h-4 text-sky-400" />
                      ) : (
                        <Circle className="w-4 h-4 text-slate-600" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-white">
                          {pol.title}
                        </span>
                        <span className="text-[11px] font-mono text-slate-400">
                          -${pol.costPerSec}/s
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {pol.description}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    <span
                      className={`text-[11px] font-medium font-mono ${
                        pol.happinessEffect >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {pol.happinessEffect >= 0
                        ? `+${pol.happinessEffect}% Happy`
                        : `${pol.happinessEffect}% Happy`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-800 pt-3 flex justify-end">
          <button
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
};
