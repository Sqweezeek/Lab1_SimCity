export type BuildingCategory =
  | 'infrastructure'
  | 'residential'
  | 'commercial'
  | 'industrial'
  | 'services'
  | 'nature';

export type TerrainType = 'grass' | 'water' | 'sand' | 'pavement';

export interface BuildingDef {
  id: string;
  name: string;
  category: BuildingCategory;
  cost: number;
  upkeep: number; // cost per tick
  populationProvided: number;
  jobsProvided: number;
  powerDelta: number; // positive = produces, negative = consumes
  waterDelta: number; // positive = produces, negative = consumes
  happinessBonus: number;
  income: number; // revenue per tick
  description: string;
  size: [number, number]; // width x depth (e.g. [1, 1] or [2, 2])
  unlockTier: number; // 0 = Hamlet, 1 = Village, 2 = Town, 3 = City, 4 = Metropolis
  color: string;
  hasLevels?: boolean;
}

export interface PlacedBuilding {
  instanceId: string;
  defId: string;
  x: number;
  z: number;
  rotation: number; // 0, 1, 2, 3 (multiples of 90 deg)
  level: number; // 1, 2, 3
  placedAt: number;
  name?: string;
}

export interface TileData {
  x: number;
  z: number;
  terrain: TerrainType;
  building?: PlacedBuilding;
  roadConnections?: {
    north: boolean;
    south: boolean;
    east: boolean;
    west: boolean;
  };
}

export interface CityStats {
  treasury: number;
  incomePerSec: number;
  population: number;
  jobs: number;
  happiness: number; // 0-100
  powerProduced: number;
  powerConsumed: number;
  waterProduced: number;
  waterConsumed: number;
  taxRate: number; // e.g. 0.09 (9%)
  tier: number; // 0 = Hamlet, 1 = Village, etc.
  dayCount: number;
  demandR: number; // -1 to 1 residential demand
  demandC: number; // -1 to 1 commercial demand
  demandI: number; // -1 to 1 industrial demand
}

export type TimeOfDay = 'day' | 'golden' | 'sunset' | 'night' | 'cyberpunk';
export type ToolMode = 'inspect' | 'build' | 'bulldoze';

export interface CityPolicy {
  id: string;
  title: string;
  description: string;
  costPerSec: number;
  active: boolean;
  happinessEffect: number;
  demandEffect: { r: number; c: number; i: number };
}
