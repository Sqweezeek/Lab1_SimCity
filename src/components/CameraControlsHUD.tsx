import React from 'react';
import {
  RotateCcw,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Sun,
  Sunset,
  Moon,
  Sparkles,
} from 'lucide-react';
import { TimeOfDay } from '../types/city';
import { sounds } from '../audio/soundManager';

interface CameraControlsHUDProps {
  onRotateLeft: () => void;
  onRotateRight: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
  timeOfDay: TimeOfDay;
  onChangeTimeOfDay: (time: TimeOfDay) => void;
}

export const CameraControlsHUD: React.FC<CameraControlsHUDProps> = ({
  onRotateLeft,
  onRotateRight,
  onZoomIn,
  onZoomOut,
  onResetView,
  timeOfDay,
  onChangeTimeOfDay,
}) => {
  const times: { id: TimeOfDay; label: string; icon: React.ReactNode }[] = [
    { id: 'day', label: 'Day', icon: <Sun className="w-3.5 h-3.5 text-amber-400" /> },
    { id: 'golden', label: 'Golden Hour', icon: <Sun className="w-3.5 h-3.5 text-orange-400" /> },
    { id: 'sunset', label: 'Sunset', icon: <Sunset className="w-3.5 h-3.5 text-rose-400" /> },
    { id: 'night', label: 'Night', icon: <Moon className="w-3.5 h-3.5 text-indigo-400" /> },
    { id: 'cyberpunk', label: 'Cyberpunk', icon: <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> },
  ];

  return (
    <div className="fixed top-28 left-4 z-20 flex flex-col gap-2 select-none pointer-events-none">
      {/* Camera Orientation Bar */}
      <div className="pointer-events-auto bg-slate-900/85 backdrop-blur-md border border-slate-800/80 rounded-lg p-1.5 shadow-lg flex flex-col gap-1">
        <button
          onClick={() => {
            sounds.playClick();
            onRotateLeft();
          }}
          title="Rotate Camera Counter-Clockwise (Q)"
          className="p-2 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer flex items-center justify-center"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <button
          onClick={() => {
            sounds.playClick();
            onRotateRight();
          }}
          title="Rotate Camera Clockwise (E)"
          className="p-2 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer flex items-center justify-center"
        >
          <RotateCw className="w-4 h-4" />
        </button>

        <div className="h-px bg-slate-800 my-0.5" />

        <button
          onClick={() => {
            sounds.playClick();
            onZoomIn();
          }}
          title="Zoom In (+)"
          className="p-2 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer flex items-center justify-center"
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        <button
          onClick={() => {
            sounds.playClick();
            onZoomOut();
          }}
          title="Zoom Out (-)"
          className="p-2 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer flex items-center justify-center"
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        <button
          onClick={() => {
            sounds.playClick();
            onResetView();
          }}
          title="Center / Reset Camera (Space)"
          className="p-2 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer flex items-center justify-center"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      {/* Lighting / Atmosphere Switcher */}
      <div className="pointer-events-auto bg-slate-900/85 backdrop-blur-md border border-slate-800/80 rounded-lg p-1 shadow-lg flex flex-col gap-1">
        {times.map((t) => {
          const active = timeOfDay === t.id;
          return (
            <button
              key={t.id}
              onClick={() => {
                sounds.playClick();
                onChangeTimeOfDay(t.id);
              }}
              title={`Switch to ${t.label} lighting`}
              className={`p-2 rounded flex items-center justify-center cursor-pointer transition-colors ${
                active ? 'bg-sky-600/30 text-white border border-sky-500/50' : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              {t.icon}
            </button>
          );
        })}
      </div>
    </div>
  );
};
