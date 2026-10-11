import React from 'react';
import { X, ArrowUpCircle, Trash2, Zap, Droplets, Users, DollarSign } from 'lucide-react';
import { PlacedBuilding } from '../types/city';
import { BUILDING_DEFS } from '../game/buildingDefs';
import { sounds } from '../audio/soundManager';

interface BuildingInspectorProps {
  building: PlacedBuilding | null;
  onClose: () => void;
  onUpgrade: (building: PlacedBuilding) => void;
  onDemolish: (building: PlacedBuilding) => void;
  userTreasury: number;
}

export const BuildingInspector: React.FC<BuildingInspectorProps> = ({
  building,
  onClose,
  onUpgrade,
  onDemolish,
  userTreasury,
}) => {
  if (!building) return null;

  const def = BUILDING_DEFS[building.defId];
  if (!def) return null;

  const level = building.level || 1;
  const upgradeCost = Math.round(def.cost * 0.8 * level);
  const canUpgrade = def.hasLevels && level < 3;
  const canAffordUpgrade = userTreasury >= upgradeCost;

  return (
    <div className="fixed top-28 right-4 z-30 w-80 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl shadow-2xl p-4 select-none animate-in fade-in slide-in-from-right-4 duration-200">
      {/* Header */}
      <div className="flex items-start justify-between border-b border-slate-800/80 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-white font-[var(--font-display)]">
              {def.name}
            </h3>
            {def.hasLevels && (
              <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800/60">
                Tier {level}
              </span>
            )}
          </div>
          <span className="text-xs text-slate-400 capitalize">{def.category} · ({building.x}, {building.z})</span>
        </div>

        <button
          onClick={() => {
            sounds.playClick();
            onClose();
          }}
          className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Description */}
      <p className="text-xs text-slate-300 my-3 leading-relaxed">
        {def.description}
      </p>

      {/* Stats Breakdown */}
      <div className="grid grid-cols-2 gap-2 my-3 text-xs bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/60">
        <div className="flex items-center gap-2">
          <Users className="w-3.5 h-3.5 text-sky-400" />
          <span className="text-slate-400">
            {def.populationProvided > 0
              ? `${Math.round(def.populationProvided * (1 + (level - 1) * 0.5))} pop`
              : `${Math.round(def.jobsProvided * (1 + (level - 1) * 0.5))} jobs`}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <DollarSign className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-slate-400">
            +${Math.round(def.income * (1 + (level - 1) * 0.5))}/s
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Zap className="w-3.5 h-3.5 text-yellow-400" />
          <span className="text-slate-400">
            {def.powerDelta > 0 ? `+${def.powerDelta} MW` : `${def.powerDelta} MW`}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Droplets className="w-3.5 h-3.5 text-sky-400" />
          <span className="text-slate-400">
            {def.waterDelta > 0 ? `+${def.waterDelta} kL` : `${def.waterDelta} kL`}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2 pt-2 border-t border-slate-800/80">
        {canUpgrade && (
          <button
            disabled={!canAffordUpgrade}
            onClick={() => {
              sounds.playUpgrade();
              onUpgrade(building);
            }}
            className={`w-full py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              canAffordUpgrade
                ? 'bg-sky-600 hover:bg-sky-500 text-white shadow-md active:scale-98'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            <ArrowUpCircle className="w-4 h-4" />
            <span>Upgrade to Tier {level + 1} (${upgradeCost})</span>
          </button>
        )}

        <button
          onClick={() => {
            sounds.playDemolish();
            onDemolish(building);
          }}
          className="w-full py-1.5 px-3 rounded-lg text-xs font-medium bg-rose-950/40 hover:bg-rose-900/40 text-rose-300 border border-rose-900/50 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Demolish (Refund ${Math.round(def.cost * 0.5)})</span>
        </button>
      </div>
    </div>
  );
};
