import React from 'react';
import { X, Navigation, Hammer, Zap, Award, Camera } from 'lucide-react';
import { sounds } from '../audio/soundManager';

interface HelpGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpGuideModal: React.FC<HelpGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 select-none">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-6 flex flex-col gap-5 animate-in fade-in zoom-in-95 duration-150 max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-lg font-bold text-white font-[var(--font-display)]">
              Mayor's Field Manual
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Everything you need to plan, construct, and manage a flourishing low-poly metropolis.
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

        {/* Section 1: Navigation & Camera */}
        <div className="flex flex-col gap-2 bg-slate-950/60 p-3 rounded-lg border border-slate-800/80 text-xs">
          <div className="flex items-center gap-2 font-semibold text-sky-300">
            <Navigation className="w-4 h-4" />
            <span>Camera Navigation</span>
          </div>
          <ul className="text-slate-300 space-y-1 pl-4 list-disc">
            <li><strong>Pan:</strong> Click & drag, or use <code>W</code> <code>A</code> <code>S</code> <code>D</code> / Arrow keys.</li>
            <li><strong>Rotate Camera:</strong> Press <code>Q</code> / <code>E</code>, right-click & drag, or use the HUD rotate buttons.</li>
            <li><strong>Zoom:</strong> Mouse scroll wheel or <code>+</code> / <code>-</code> buttons.</li>
            <li><strong>Center View:</strong> Press <code>Space</code> or tap the center button.</li>
          </ul>
        </div>

        {/* Section 2: Construction & Road Networks */}
        <div className="flex flex-col gap-2 bg-slate-950/60 p-3 rounded-lg border border-slate-800/80 text-xs">
          <div className="flex items-center gap-2 font-semibold text-emerald-300">
            <Hammer className="w-4 h-4" />
            <span>Zoning & Architecture</span>
          </div>
          <ul className="text-slate-300 space-y-1 pl-4 list-disc">
            <li><strong>Modular Roads:</strong> Roads automatically connect straightaways, corners, and intersections. Animated miniature cars cruise along connected avenues!</li>
            <li><strong>Rotate Assets:</strong> Press <code>R</code> to rotate your building footprint before placing.</li>
            <li><strong>Water Crossing:</strong> Place bridges over canals and waterways.</li>
            <li><strong>Modular Upgrades:</strong> Click any building to open the Inspector and level it up to Tier 2 & Tier 3 for increased density and output.</li>
          </ul>
        </div>

        {/* Section 3: Utilities & Economy */}
        <div className="flex flex-col gap-2 bg-slate-950/60 p-3 rounded-lg border border-slate-800/80 text-xs">
          <div className="flex items-center gap-2 font-semibold text-amber-300">
            <Zap className="w-4 h-4" />
            <span>Power, Water & Happiness</span>
          </div>
          <ul className="text-slate-300 space-y-1 pl-4 list-disc">
            <li><strong>Renewable Grid:</strong> Solar farms and wind turbines supply electricity without pollution.</li>
            <li><strong>Water Supply:</strong> Aqueduct water towers maintain city water pressure. Shortages penalize citizen happiness.</li>
            <li><strong>RCI Demands:</strong> Watch the R (Green), C (Cyan), and I (Amber) bars to see what zones your city craves.</li>
          </ul>
        </div>

        {/* Section 4: Milestones & Photo Mode */}
        <div className="flex flex-col gap-2 bg-slate-950/60 p-3 rounded-lg border border-slate-800/80 text-xs">
          <div className="flex items-center gap-2 font-semibold text-purple-300">
            <Award className="w-4 h-4" />
            <span>Progression & Photo Snapshots</span>
          </div>
          <ul className="text-slate-300 space-y-1 pl-4 list-disc">
            <li>Grow your population to unlock new tiers: Hamlet → Village → Town → City → Metropolis.</li>
            <li>Switch between 5 atmospheric lighting modes (Sunny Day, Golden Hour, Sunset, Night, Cyberpunk).</li>
            <li>Use <strong>Photo Snapshot</strong> to capture and download high-resolution isometric postcards of your city!</li>
          </ul>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-800 pt-3 flex justify-end">
          <button
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Got It, Mayor!
          </button>
        </div>
      </div>
    </div>
  );
};
