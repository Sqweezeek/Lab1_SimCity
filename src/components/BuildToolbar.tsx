import React, { useState } from 'react';
import {
  RotateCw,
  Trash2,
  Search,
  Hammer,
  Home,
  Store,
  Factory,
  ShieldCheck,
  TreePine,
  Lock,
} from 'lucide-react';
import { BuildingCategory, ToolMode } from '../types/city';
import { BUILDING_DEFS, CITY_TIERS } from '../game/buildingDefs';
import { sounds } from '../audio/soundManager';

interface BuildToolbarProps {
  toolMode: ToolMode;
  onSelectToolMode: (mode: ToolMode) => void;
  selectedDefId: string | null;
  onSelectBuildingDef: (defId: string | null) => void;
  rotation: number;
  onRotate: () => void;
  userTreasury: number;
  cityTier: number;
}

export const BuildToolbar: React.FC<BuildToolbarProps> = ({
  toolMode,
  onSelectToolMode,
  selectedDefId,
  onSelectBuildingDef,
  rotation,
  onRotate,
  userTreasury,
  cityTier,
}) => {
  const [activeCategory, setActiveCategory] = useState<BuildingCategory>('infrastructure');

  const categories: { id: BuildingCategory; label: string; icon: React.ReactNode }[] = [
    { id: 'infrastructure', label: 'Roads', icon: <Hammer className="w-3.5 h-3.5" /> },
    { id: 'residential', label: 'Residential', icon: <Home className="w-3.5 h-3.5" /> },
    { id: 'commercial', label: 'Commercial', icon: <Store className="w-3.5 h-3.5" /> },
    { id: 'industrial', label: 'Industrial & Tech', icon: <Factory className="w-3.5 h-3.5" /> },
    { id: 'services', label: 'Services', icon: <ShieldCheck className="w-3.5 h-3.5" /> },
    { id: 'nature', label: 'Parks & Deco', icon: <TreePine className="w-3.5 h-3.5" /> },
  ];

  const currentBuildings = Object.values(BUILDING_DEFS).filter(
    (b) => b.category === activeCategory
  );

  return (
    <div className="fixed bottom-3 left-4 right-4 z-20 flex flex-col items-center pointer-events-none select-none">
      <div className="pointer-events-auto w-full max-w-4xl bg-slate-900/90 backdrop-blur-md border border-slate-800/80 rounded-xl shadow-2xl p-2.5 flex flex-col gap-2">
        {/* Top Control Bar: Mode switches, Categories, Rotate */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/60 pb-2">
          {/* Main Action Modes */}
          <div className="flex items-center gap-1 bg-slate-950/70 p-1 rounded-lg border border-slate-800/70">
            <button
              onClick={() => {
                sounds.playClick();
                onSelectToolMode('inspect');
              }}
              title="Inspect Buildings (I)"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium cursor-pointer transition-colors ${
                toolMode === 'inspect'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              <span>Inspect</span>
            </button>

            <button
              onClick={() => {
                sounds.playClick();
                onSelectToolMode('build');
              }}
              title="Build Mode (B)"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium cursor-pointer transition-colors ${
                toolMode === 'build'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Hammer className="w-3.5 h-3.5" />
              <span>Build</span>
            </button>

            <button
              onClick={() => {
                sounds.playClick();
                onSelectToolMode('bulldoze');
              }}
              title="Bulldoze / Demolish (X)"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium cursor-pointer transition-colors ${
                toolMode === 'bulldoze'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Bulldoze</span>
            </button>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto py-0.5">
            {categories.map((cat) => {
              const active = activeCategory === cat.id && toolMode === 'build';
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    sounds.playClick();
                    setActiveCategory(cat.id);
                    if (toolMode !== 'build') onSelectToolMode('build');
                  }}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium whitespace-nowrap cursor-pointer transition-colors ${
                    active
                      ? 'bg-slate-800 text-sky-300 border border-slate-700/80 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  {cat.icon}
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* Rotate Button */}
          <button
            onClick={() => {
              sounds.playClick();
              onRotate();
            }}
            title="Rotate Building (R key)"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700/60 rounded-md text-xs font-medium cursor-pointer transition-colors shrink-0"
          >
            <RotateCw className="w-3.5 h-3.5 text-sky-400" />
            <span>Rotate {rotation * 90}°</span>
            <span className="text-[10px] text-slate-400 font-mono">[R]</span>
          </button>
        </div>

        {/* Building Cards Drawer (when in build mode) */}
        {toolMode === 'build' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 max-h-36 overflow-y-auto pr-1">
            {currentBuildings.map((def) => {
              const isLocked = def.unlockTier > cityTier;
              const requiredTierName = CITY_TIERS[def.unlockTier]?.name || 'Higher Tier';
              const isAffordable = userTreasury >= def.cost;
              const isSelected = selectedDefId === def.id;

              return (
                <button
                  key={def.id}
                  disabled={isLocked}
                  onClick={() => {
                    sounds.playClick();
                    onSelectBuildingDef(def.id);
                  }}
                  className={`group relative text-left p-2 rounded-lg border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-sky-950/60 border-sky-500 shadow-md ring-1 ring-sky-500/50'
                      : isLocked
                      ? 'bg-slate-950/40 border-slate-800/40 opacity-50 cursor-not-allowed'
                      : isAffordable
                      ? 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/50'
                      : 'bg-slate-950/60 border-slate-800/60 opacity-70'
                  }`}
                >
                  <div className="flex items-start justify-between gap-1 w-full">
                    <span className="text-xs font-semibold text-slate-200 line-clamp-1">
                      {def.name}
                    </span>
                    {isLocked ? (
                      <Lock className="w-3 h-3 text-slate-500 shrink-0" />
                    ) : (
                      <span className="text-[10px] font-mono text-slate-400 shrink-0">
                        {def.size[0]}x{def.size[1]}
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                    {def.description}
                  </p>

                  <div className="mt-2 flex items-center justify-between text-[11px] pt-1 border-t border-slate-800/60">
                    <span
                      className={`font-mono font-semibold tabular-nums ${
                        isAffordable ? 'text-amber-400' : 'text-rose-400'
                      }`}
                    >
                      ${def.cost}
                    </span>

                    {isLocked ? (
                      <span className="text-[10px] text-slate-500">
                        {requiredTierName}
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400">
                        {def.populationProvided > 0 && `+${def.populationProvided} pop`}
                        {def.jobsProvided > 0 && `+${def.jobsProvided} jobs`}
                        {def.powerDelta > 0 && `+${def.powerDelta} MW`}
                        {def.waterDelta > 0 && `+${def.waterDelta} kL`}
                        {def.income > 0 && `+$${def.income}/s`}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        ) : toolMode === 'inspect' ? (
          <div className="py-2 px-3 text-xs text-slate-400 flex items-center justify-between">
            <span>Click any placed building on the grid to inspect details and upgrade it.</span>
            <span className="text-slate-500 font-mono">[Shortcuts: W A S D pan, Q/E rotate camera]</span>
          </div>
        ) : (
          <div className="py-2 px-3 text-xs text-rose-300 flex items-center justify-between bg-rose-950/30 rounded border border-rose-900/40">
            <span>Bulldoze mode active. Click any building or road to demolish and reclaim 50% refund.</span>
            <button
              onClick={() => onSelectToolMode('build')}
              className="px-2 py-0.5 bg-slate-800 text-slate-200 rounded text-[11px] hover:bg-slate-700 cursor-pointer"
            >
              Exit Bulldoze
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
