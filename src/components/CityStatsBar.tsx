import React from 'react';
import {
  Coins,
  Users,
  Smile,
  Zap,
  Droplets,
  Play,
  Pause,
  FastForward,
  TrendingUp,
} from 'lucide-react';
import { CityStats } from '../types/city';
import { CITY_TIERS } from '../game/buildingDefs';
import { sounds } from '../audio/soundManager';

interface CityStatsBarProps {
  stats: CityStats;
  timeSpeed: number;
  onChangeSpeed: (spd: number) => void;
}

export const CityStatsBar: React.FC<CityStatsBarProps> = ({
  stats,
  timeSpeed,
  onChangeSpeed,
}) => {
  const tierName = CITY_TIERS[stats.tier]?.name || 'Hamlet';
  const powerSurplus = stats.powerProduced - stats.powerConsumed;
  const waterSurplus = stats.waterProduced - stats.waterConsumed;

  return (
    <div className="fixed top-16 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-3 pointer-events-none select-none">
      {/* Left Stat Cluster */}
      <div className="pointer-events-auto flex items-center gap-4 bg-slate-900/80 backdrop-blur-md border border-slate-800/80 px-4 py-2 rounded-lg shadow-lg text-xs">
        {/* Treasury */}
        <div className="flex items-center gap-2">
          <Coins className="w-4 h-4 text-amber-400" />
          <span className="font-semibold text-slate-100 font-mono tabular-nums text-sm">
            ${stats.treasury.toLocaleString()}
          </span>
          <span
            className={`font-mono tabular-nums text-[11px] ${
              stats.incomePerSec >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {stats.incomePerSec >= 0 ? `+${stats.incomePerSec}/s` : `${stats.incomePerSec}/s`}
          </span>
        </div>

        <span className="text-slate-700" aria-hidden="true">|</span>

        {/* Population & Jobs */}
        <div className="flex items-center gap-2" title={`Jobs: ${stats.jobs}`}>
          <Users className="w-4 h-4 text-sky-400" />
          <span className="font-medium text-slate-200">
            <span className="font-mono tabular-nums">{stats.population}</span> Pop
          </span>
          <span className="text-slate-500 font-mono tabular-nums text-[11px]">
            ({stats.jobs} jobs)
          </span>
        </div>

        <span className="text-slate-700" aria-hidden="true">|</span>

        {/* Happiness */}
        <div className="flex items-center gap-2">
          <Smile
            className={`w-4 h-4 ${
              stats.happiness >= 75
                ? 'text-emerald-400'
                : stats.happiness >= 50
                ? 'text-amber-400'
                : 'text-rose-400'
            }`}
          />
          <span className="font-mono tabular-nums font-semibold text-slate-200">
            {stats.happiness}%
          </span>
        </div>

        <span className="text-slate-700" aria-hidden="true">|</span>

        {/* Power Grid */}
        <div
          className="flex items-center gap-1.5"
          title={`Produced: ${stats.powerProduced} MW | Consumed: ${stats.powerConsumed} MW`}
        >
          <Zap
            className={`w-3.5 h-3.5 ${
              powerSurplus >= 0 ? 'text-yellow-400' : 'text-rose-400 animate-pulse'
            }`}
          />
          <span
            className={`font-mono tabular-nums text-[11px] ${
              powerSurplus >= 0 ? 'text-slate-300' : 'text-rose-300 font-semibold'
            }`}
          >
            {powerSurplus >= 0 ? `+${powerSurplus}` : powerSurplus} MW
          </span>
        </div>

        {/* Water Grid */}
        <div
          className="flex items-center gap-1.5"
          title={`Produced: ${stats.waterProduced} kL | Consumed: ${stats.waterConsumed} kL`}
        >
          <Droplets
            className={`w-3.5 h-3.5 ${
              waterSurplus >= 0 ? 'text-sky-400' : 'text-rose-400 animate-pulse'
            }`}
          />
          <span
            className={`font-mono tabular-nums text-[11px] ${
              waterSurplus >= 0 ? 'text-slate-300' : 'text-rose-300 font-semibold'
            }`}
          >
            {waterSurplus >= 0 ? `+${waterSurplus}` : waterSurplus} kL
          </span>
        </div>
      </div>

      {/* Right Cluster: Tier & RCI Demands & Time Controls */}
      <div className="pointer-events-auto flex items-center gap-4 bg-slate-900/80 backdrop-blur-md border border-slate-800/80 px-3 py-1.5 rounded-lg shadow-lg text-xs">
        {/* Tier badge */}
        <div className="flex items-center gap-1.5 text-slate-300 font-medium">
          <TrendingUp className="w-3.5 h-3.5 text-sky-400" />
          <span className="font-[var(--font-display)] text-sky-200 font-semibold">
            {tierName}
          </span>
        </div>

        <span className="text-slate-700" aria-hidden="true">|</span>

        {/* RCI Demand indicators */}
        <div className="flex items-center gap-2" title="Zoning Demands: Residential / Commercial / Industrial">
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-bold text-emerald-400">R</span>
            <div className="w-6 h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full"
                style={{ width: `${Math.max(10, Math.min(100, (stats.demandR + 1) * 50))}%` }}
              />
            </div>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-bold text-sky-400">C</span>
            <div className="w-6 h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-sky-500 rounded-full"
                style={{ width: `${Math.max(10, Math.min(100, (stats.demandC + 1) * 50))}%` }}
              />
            </div>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-bold text-amber-400">I</span>
            <div className="w-6 h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full"
                style={{ width: `${Math.max(10, Math.min(100, (stats.demandI + 1) * 50))}%` }}
              />
            </div>
          </div>
        </div>

        <span className="text-slate-700" aria-hidden="true">|</span>

        {/* Time Speed Controls */}
        <div className="flex items-center gap-1 bg-slate-950/60 p-0.5 rounded border border-slate-800/60">
          <button
            onClick={() => {
              sounds.playClick();
              onChangeSpeed(0);
            }}
            title="Pause (0x)"
            className={`p-1 rounded cursor-pointer transition-colors ${
              timeSpeed === 0 ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Pause className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              sounds.playClick();
              onChangeSpeed(1);
            }}
            title="Normal Speed (1x)"
            className={`p-1 rounded cursor-pointer transition-colors ${
              timeSpeed === 1 ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Play className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              sounds.playClick();
              onChangeSpeed(2);
            }}
            title="Fast Speed (2x)"
            className={`p-1 rounded cursor-pointer transition-colors ${
              timeSpeed === 2 ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FastForward className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
