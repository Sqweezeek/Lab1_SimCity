import React, { useEffect, useRef, useState, useCallback } from 'react';
import { CityScene } from './game/cityScene';
import {
  CityPolicy,
  CityStats,
  PlacedBuilding,
  TileData,
  TimeOfDay,
  ToolMode,
} from './types/city';
import { BUILDING_DEFS } from './game/buildingDefs';
import {
  createPresetMap,
  createEmptyGrid,
  updateGridRoadConnections,
} from './game/mapPresets';
import { calculateCityStats } from './game/simulation';
import { sounds } from './audio/soundManager';
import { TopNav } from './components/TopNav';
import { CityStatsBar } from './components/CityStatsBar';
import { BuildToolbar } from './components/BuildToolbar';
import { BuildingInspector } from './components/BuildingInspector';
import { CameraControlsHUD } from './components/CameraControlsHUD';
import { CityPolicyModal } from './components/CityPolicyModal';
import { MapPresetsModal } from './components/MapPresetsModal';
import { HelpGuideModal } from './components/HelpGuideModal';
import { MilestoneBanner } from './components/MilestoneBanner';

const DEFAULT_POLICIES: CityPolicy[] = [
  {
    id: 'clean_energy',
    title: 'Clean Energy Incentive',
    description: 'Subsidizes solar and wind arrays, raising citizen satisfaction.',
    costPerSec: 6,
    active: true,
    happinessEffect: 4,
    demandEffect: { r: 0.1, c: 0, i: 0.1 },
  },
  {
    id: 'public_transit',
    title: 'Free Mass Transit Pass',
    description: 'Municipal transit subsidy cutting commute times and boosting commerce.',
    costPerSec: 10,
    active: false,
    happinessEffect: 6,
    demandEffect: { r: 0.1, c: 0.15, i: 0 },
  },
  {
    id: 'farmers_markets',
    title: 'Weekend Farmers Markets',
    description: 'Promotes local produce and culinary artisans across neighborhood plazas.',
    costPerSec: 3,
    active: true,
    happinessEffect: 3,
    demandEffect: { r: 0.05, c: 0.1, i: 0 },
  },
  {
    id: 'night_market',
    title: 'Night Bazaar Ordinance',
    description: 'Permits after-hours food stalls and neon commercial vitality.',
    costPerSec: 5,
    active: false,
    happinessEffect: 4,
    demandEffect: { r: 0, c: 0.2, i: 0 },
  },
];

const INITIAL_STATS: CityStats = {
  treasury: 2500,
  incomePerSec: 15,
  population: 8,
  jobs: 14,
  happiness: 85,
  powerProduced: 20,
  powerConsumed: 5,
  waterProduced: 30,
  waterConsumed: 5,
  taxRate: 0.09,
  tier: 0,
  dayCount: 1,
  demandR: 0.3,
  demandC: 0.2,
  demandI: 0.1,
};

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<CityScene | null>(null);

  // Core Game State
  const [grid, setGrid] = useState<TileData[][]>(() => {
    try {
      const saved = localStorage.getItem('isopolis_city_grid');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return createPresetMap('emerald_river');
  });

  const [stats, setStats] = useState<CityStats>(() => {
    try {
      const saved = localStorage.getItem('isopolis_city_stats');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return INITIAL_STATS;
  });

  const [policies, setPolicies] = useState<CityPolicy[]>(DEFAULT_POLICIES);
  const [toolMode, setToolMode] = useState<ToolMode>('build');
  const [selectedDefId, setSelectedDefId] = useState<string | null>('road');
  const [placementRotation, setPlacementRotation] = useState<number>(0);
  const [inspectedBuilding, setInspectedBuilding] = useState<PlacedBuilding | null>(null);

  // Time & Audio
  const [timeSpeed, setTimeSpeed] = useState<number>(1);
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('day');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Modals
  const [isPoliciesOpen, setIsPoliciesOpen] = useState(false);
  const [isPresetsOpen, setIsPresetsOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [newTierMilestone, setNewTierMilestone] = useState<number | null>(null);
  const prevTierRef = useRef<number>(0);

  // State refs for event handlers to avoid stale closures
  const gridRef = useRef(grid);
  gridRef.current = grid;
  const statsRef = useRef(stats);
  statsRef.current = stats;
  const toolModeRef = useRef(toolMode);
  toolModeRef.current = toolMode;
  const selectedDefIdRef = useRef(selectedDefId);
  selectedDefIdRef.current = selectedDefId;
  const rotationRef = useRef(placementRotation);
  rotationRef.current = placementRotation;

  // Sound toggle
  const handleToggleSound = useCallback(() => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    sounds.enabled = next;
    if (next) sounds.playClick();
  }, [soundEnabled]);

  // Check tile validity for ghost preview and placement
  const checkPlacementValidity = useCallback(
    (coords: { x: number; z: number } | null, defId: string | null): boolean => {
      if (!coords || !defId) return false;
      const def = BUILDING_DEFS[defId];
      if (!def) return false;
      if (statsRef.current.treasury < def.cost) return false;

      const currentGrid = gridRef.current;
      const sizeX = def.size[0];
      const sizeZ = def.size[1];

      for (let dx = 0; dx < sizeX; dx++) {
        for (let dz = 0; dz < sizeZ; dz++) {
          const tx = coords.x + dx;
          const tz = coords.z + dz;

          if (tx < 0 || tx >= currentGrid.length || tz < 0 || tz >= currentGrid[0].length) {
            return false;
          }

          const tile = currentGrid[tx][tz];

          if (def.id === 'bridge') {
            if (tile.terrain !== 'water' || tile.building) return false;
          } else {
            // Standard buildings must be on non-water
            if (tile.terrain === 'water') return false;
            if (tile.building) return false;
          }
        }
      }

      return true;
    },
    []
  );

  // Tile Hover
  const handleTileHover = useCallback(
    (coords: { x: number; z: number } | null) => {
      if (!sceneRef.current) return;
      if (toolModeRef.current === 'build' && selectedDefIdRef.current) {
        const isValid = checkPlacementValidity(coords, selectedDefIdRef.current);
        sceneRef.current.setPreviewBuilding(selectedDefIdRef.current, rotationRef.current, isValid);
      } else {
        sceneRef.current.setPreviewBuilding(null);
      }
    },
    [checkPlacementValidity]
  );

  // Rotate placement
  const handleRotate = useCallback(() => {
    setPlacementRotation((prev) => {
      const next = (prev + 1) % 4;
      if (sceneRef.current && selectedDefIdRef.current) {
        sceneRef.current.setPreviewBuilding(selectedDefIdRef.current, next, true);
      }
      return next;
    });
  }, []);

  // Demolish building
  const handleDemolish = useCallback((building: PlacedBuilding) => {
    setGrid((prevGrid) => {
      const newGrid = prevGrid.map((row) => row.map((t) => ({ ...t })));
      const def = BUILDING_DEFS[building.defId];
      const sizeX = def?.size[0] || 1;
      const sizeZ = def?.size[1] || 1;

      for (let dx = 0; dx < sizeX; dx++) {
        for (let dz = 0; dz < sizeZ; dz++) {
          const tx = building.x + dx;
          const tz = building.z + dz;
          if (tx < newGrid.length && tz < newGrid[0].length) {
            newGrid[tx][tz].building = undefined;
          }
        }
      }

      updateGridRoadConnections(newGrid);

      // Refund 50%
      const refund = Math.round((def?.cost || 0) * 0.5);
      setStats((st) => ({
        ...st,
        treasury: st.treasury + refund,
      }));

      if (sceneRef.current) {
        sceneRef.current.syncBuildings(newGrid);
      }
      return newGrid;
    });
    setInspectedBuilding(null);
  }, []);

  // Upgrade building
  const handleUpgrade = useCallback((building: PlacedBuilding) => {
    const def = BUILDING_DEFS[building.defId];
    if (!def) return;
    const level = building.level || 1;
    const upgradeCost = Math.round(def.cost * 0.8 * level);

    if (statsRef.current.treasury < upgradeCost) {
      sounds.playError();
      return;
    }

    setStats((st) => ({
      ...st,
      treasury: st.treasury - upgradeCost,
    }));

    setGrid((prevGrid) => {
      const newGrid = prevGrid.map((row) => row.map((t) => ({ ...t })));
      const targetTile = newGrid[building.x][building.z];
      if (targetTile.building) {
        targetTile.building = {
          ...targetTile.building,
          level: Math.min(3, level + 1),
        };
        setInspectedBuilding(targetTile.building);
      }

      if (sceneRef.current) {
        sceneRef.current.syncBuildings(newGrid);
      }
      return newGrid;
    });
  }, []);

  // Tile Click / Placement Handler
  const handleTileClick = useCallback(
    (coords: { x: number; z: number }) => {
      const currentGrid = gridRef.current;
      const currentTool = toolModeRef.current;
      const currentTile = currentGrid[coords.x][coords.z];

      if (currentTool === 'inspect') {
        if (currentTile.building) {
          sounds.playClick();
          setInspectedBuilding(currentTile.building);
        } else {
          setInspectedBuilding(null);
        }
        return;
      }

      if (currentTool === 'bulldoze') {
        if (currentTile.building) {
          sounds.playDemolish();
          handleDemolish(currentTile.building);
        } else {
          sounds.playError();
        }
        return;
      }

      if (currentTool === 'build') {
        const defId = selectedDefIdRef.current;
        if (!defId) return;

        const def = BUILDING_DEFS[defId];
        if (!def) return;

        const isValid = checkPlacementValidity(coords, defId);
        if (!isValid) {
          sounds.playError();
          return;
        }

        // Deduct treasury
        setStats((st) => ({
          ...st,
          treasury: st.treasury - def.cost,
        }));

        sounds.playBuild();

        setGrid((prevGrid) => {
          const newGrid = prevGrid.map((row) => row.map((t) => ({ ...t })));
          const instanceId = `b_${Date.now()}_${coords.x}_${coords.z}`;

          const newBuilding: PlacedBuilding = {
            instanceId,
            defId: def.id,
            x: coords.x,
            z: coords.z,
            rotation: rotationRef.current,
            level: 1,
            placedAt: Date.now(),
          };

          const sizeX = def.size[0];
          const sizeZ = def.size[1];

          for (let dx = 0; dx < sizeX; dx++) {
            for (let dz = 0; dz < sizeZ; dz++) {
              const tx = coords.x + dx;
              const tz = coords.z + dz;
              newGrid[tx][tz].building = newBuilding;
            }
          }

          updateGridRoadConnections(newGrid);

          if (sceneRef.current) {
            sceneRef.current.syncBuildings(newGrid);
          }
          return newGrid;
        });
      }
    },
    [checkPlacementValidity, handleDemolish]
  );

  // Initialize Three.js scene once
  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new CityScene(containerRef.current, 20, {
      onTileHover: handleTileHover,
      onTileClick: handleTileClick,
    });
    sceneRef.current = scene;

    scene.rebuildTerrain(gridRef.current);
    scene.syncBuildings(gridRef.current);
    scene.setTimeOfDay(timeOfDay);

    return () => {
      scene.destroy();
      sceneRef.current = null;
    };
  }, [handleTileClick, handleTileHover]);

  // Keyboard navigation shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!sceneRef.current) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.key.toLowerCase()) {
        case 'w':
        case 'arrowup':
          sceneRef.current.pan(0, -1);
          break;
        case 's':
        case 'arrowdown':
          sceneRef.current.pan(0, 1);
          break;
        case 'a':
        case 'arrowleft':
          sceneRef.current.pan(-1, 0);
          break;
        case 'd':
        case 'arrowright':
          sceneRef.current.pan(1, 0);
          break;
        case 'q':
          sceneRef.current.rotateCamera(1);
          break;
        case 'e':
          sceneRef.current.rotateCamera(-1);
          break;
        case 'r':
          handleRotate();
          break;
        case 'b':
          sounds.playClick();
          setToolMode('build');
          break;
        case 'i':
          sounds.playClick();
          setToolMode('inspect');
          break;
        case 'x':
          sounds.playClick();
          setToolMode('bulldoze');
          break;
        case ' ':
          sceneRef.current.resetCamera();
          break;
        case '=':
        case '+':
          sceneRef.current.zoom(-2);
          break;
        case '-':
          sceneRef.current.zoom(2);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleRotate]);

  // Economic simulation loop (every 1 second)
  useEffect(() => {
    if (timeSpeed === 0) return;

    const intervalMs = 1000 / timeSpeed;
    const interval = setInterval(() => {
      setStats((prevStats) => {
        const next = calculateCityStats(gridRef.current, prevStats, policies);
        const updatedTreasury = Math.max(0, next.treasury + next.incomePerSec);

        // Check for new tier milestone
        if (next.tier > prevTierRef.current) {
          prevTierRef.current = next.tier;
          setNewTierMilestone(next.tier);
        }

        return {
          ...next,
          treasury: updatedTreasury,
          dayCount: prevStats.dayCount + 1,
        };
      });
    }, intervalMs);

    return () => clearInterval(interval);
  }, [timeSpeed, policies]);

  // Sync lighting with time of day
  useEffect(() => {
    if (sceneRef.current) {
      sceneRef.current.setTimeOfDay(timeOfDay);
    }
  }, [timeOfDay]);

  // Sync ghost preview when selectedDefId or toolMode changes
  useEffect(() => {
    if (sceneRef.current) {
      if (toolMode === 'build' && selectedDefId) {
        sceneRef.current.setPreviewBuilding(selectedDefId, placementRotation, true);
      } else {
        sceneRef.current.setPreviewBuilding(null);
      }
    }
  }, [selectedDefId, toolMode, placementRotation]);

  // Auto-save to LocalStorage periodically
  useEffect(() => {
    try {
      localStorage.setItem('isopolis_city_grid', JSON.stringify(grid));
      localStorage.setItem('isopolis_city_stats', JSON.stringify(stats));
    } catch {
      // ignore
    }
  }, [grid, stats]);

  // Map Presets selection
  const handleSelectPreset = (preset: 'emerald_river' | 'sunny_plateau' | 'coastal_haven') => {
    const newGrid = createPresetMap(preset);
    setGrid(newGrid);
    setStats({
      ...INITIAL_STATS,
      treasury: 2500,
    });
    setInspectedBuilding(null);
    if (sceneRef.current) {
      sceneRef.current.rebuildTerrain(newGrid);
      sceneRef.current.syncBuildings(newGrid);
      sceneRef.current.resetCamera();
    }
  };

  const handleResetEmpty = () => {
    const newGrid = createEmptyGrid(20);
    setGrid(newGrid);
    setStats({
      ...INITIAL_STATS,
      treasury: 3000,
    });
    setInspectedBuilding(null);
    if (sceneRef.current) {
      sceneRef.current.rebuildTerrain(newGrid);
      sceneRef.current.syncBuildings(newGrid);
      sceneRef.current.resetCamera();
    }
  };

  // Export / Import JSON
  const handleExportJson = () => {
    const payload = JSON.stringify({ grid, stats, policies }, null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `isopolis_city_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJson = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (parsed.grid) {
            setGrid(parsed.grid);
            if (sceneRef.current) {
              sceneRef.current.rebuildTerrain(parsed.grid);
              sceneRef.current.syncBuildings(parsed.grid);
            }
          }
          if (parsed.stats) setStats(parsed.stats);
          if (parsed.policies) setPolicies(parsed.policies);
          sounds.playAchievement();
        } catch {
          sounds.playError();
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  // Photo Mode Snapshot
  const handleTriggerPhoto = () => {
    if (!sceneRef.current) return;
    const dataUrl = sceneRef.current.getScreenshotDataUrl();
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `isopolis_snapshot_${Date.now()}.png`;
    a.click();
  };

  const handleSaveCity = () => {
    try {
      localStorage.setItem('isopolis_city_grid', JSON.stringify(grid));
      localStorage.setItem('isopolis_city_stats', JSON.stringify(stats));
    } catch {
      // ignore
    }
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-slate-950">
      {/* 3D WebGL Canvas Viewport */}
      <div ref={containerRef} className="absolute inset-0 w-full h-full cursor-crosshair" />

      {/* Top Bar (Follows Top Bar Contract) */}
      <TopNav
        onOpenPolicies={() => setIsPoliciesOpen(true)}
        onOpenPresets={() => setIsPresetsOpen(true)}
        onOpenHelp={() => setIsHelpOpen(true)}
        onTriggerPhoto={handleTriggerPhoto}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
        onSaveCity={handleSaveCity}
      />

      {/* Real-time Economic HUD */}
      <CityStatsBar
        stats={stats}
        timeSpeed={timeSpeed}
        onChangeSpeed={setTimeSpeed}
      />

      {/* Camera Controls & Atmosphere Picker */}
      <CameraControlsHUD
        onRotateLeft={() => sceneRef.current?.rotateCamera(1)}
        onRotateRight={() => sceneRef.current?.rotateCamera(-1)}
        onZoomIn={() => sceneRef.current?.zoom(-3)}
        onZoomOut={() => sceneRef.current?.zoom(3)}
        onResetView={() => sceneRef.current?.resetCamera()}
        timeOfDay={timeOfDay}
        onChangeTimeOfDay={setTimeOfDay}
      />

      {/* Building Inspector Modal/Flyout */}
      <BuildingInspector
        building={inspectedBuilding}
        onClose={() => setInspectedBuilding(null)}
        onUpgrade={handleUpgrade}
        onDemolish={handleDemolish}
        userTreasury={stats.treasury}
      />

      {/* Bottom Construction Drawer */}
      <BuildToolbar
        toolMode={toolMode}
        onSelectToolMode={(mode) => {
          setToolMode(mode);
          if (mode !== 'inspect') setInspectedBuilding(null);
        }}
        selectedDefId={selectedDefId}
        onSelectBuildingDef={setSelectedDefId}
        rotation={placementRotation}
        onRotate={handleRotate}
        userTreasury={stats.treasury}
        cityTier={stats.tier}
      />

      {/* City Milestone Celebration */}
      {newTierMilestone !== null && (
        <MilestoneBanner
          tier={newTierMilestone}
          onDismiss={() => setNewTierMilestone(null)}
        />
      )}

      {/* Modals */}
      <CityPolicyModal
        isOpen={isPoliciesOpen}
        onClose={() => setIsPoliciesOpen(false)}
        policies={policies}
        onTogglePolicy={(id) => {
          setPolicies((prev) =>
            prev.map((p) => (p.id === id ? { ...p, active: !p.active } : p))
          );
        }}
        taxRate={stats.taxRate}
        onChangeTaxRate={(rate) => setStats((st) => ({ ...st, taxRate: rate }))}
      />

      <MapPresetsModal
        isOpen={isPresetsOpen}
        onClose={() => setIsPresetsOpen(false)}
        onSelectPreset={handleSelectPreset}
        onResetEmpty={handleResetEmpty}
        onExportJson={handleExportJson}
        onImportJson={handleImportJson}
      />

      <HelpGuideModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />
    </div>
  );
}
