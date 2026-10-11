import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Award, ArrowRight } from 'lucide-react';
import { CITY_TIERS } from '../game/buildingDefs';
import { sounds } from '../audio/soundManager';

interface MilestoneBannerProps {
  tier: number;
  onDismiss: () => void;
}

export const MilestoneBanner: React.FC<MilestoneBannerProps> = ({ tier, onDismiss }) => {
  const currentTier = CITY_TIERS[tier];

  useEffect(() => {
    sounds.playAchievement();
    // Fire festive low-poly celebratory confetti burst
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.2 },
      colors: ['#38bdf8', '#34d399', '#facc15', '#f472b6', '#818cf8'],
    });
  }, [tier]);

  if (!currentTier || tier === 0) return null;

  return (
    <div className="fixed top-24 left-1/2 -translate-x-1/2 z-40 w-full max-w-md bg-gradient-to-r from-sky-950 via-slate-900 to-indigo-950 border border-sky-500/60 rounded-xl shadow-2xl p-4 select-none animate-in fade-in slide-in-from-top-4 duration-300">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-sky-500/20 text-sky-400 border border-sky-500/30">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-sky-400">
                City Milestone Reached
              </span>
            </div>
            <h3 className="text-base font-bold text-white font-[var(--font-display)]">
              Welcome to {currentTier.name}!
            </h3>
            <p className="text-xs text-slate-300 mt-0.5">
              {currentTier.bonus}
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            sounds.playClick();
            onDismiss();
          }}
          className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer shrink-0 mt-1"
        >
          <span>Continue</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
