import { PlacedBuilding, TerrainType, TileData } from '../types/city';

export function createEmptyGrid(size: number = 20): TileData[][] {
  const grid: TileData[][] = [];
  for (let x = 0; x < size; x++) {
    grid[x] = [];
    for (let z = 0; z < size; z++) {
      grid[x][z] = {
        x,
        z,
        terrain: 'grass',
      };
    }
  }
  return grid;
}

export function updateGridRoadConnections(grid: TileData[][]) {
  const size = grid.length;
  for (let x = 0; x < size; x++) {
    for (let z = 0; z < size; z++) {
      const tile = grid[x][z];
      if (tile.building && (tile.building.defId === 'road' || tile.building.defId === 'bridge')) {
        const hasRoad = (nx: number, nz: number) => {
          if (nx < 0 || nx >= size || nz < 0 || nz >= size) return false;
          const nb = grid[nx][nz].building;
          return !!(nb && (nb.defId === 'road' || nb.defId === 'bridge'));
        };

        tile.roadConnections = {
          north: hasRoad(x, z - 1),
          south: hasRoad(x, z + 1),
          east: hasRoad(x + 1, z),
          west: hasRoad(x - 1, z),
        };
      } else {
        tile.roadConnections = undefined;
      }
    }
  }
}

export function createPresetMap(preset: 'emerald_river' | 'sunny_plateau' | 'coastal_haven'): TileData[][] {
  const size = 20;
  const grid = createEmptyGrid(size);

  if (preset === 'emerald_river') {
    // Carve a winding river along columns 8-10
    for (let z = 0; z < size; z++) {
      const riverCenter = 8 + Math.round(Math.sin(z * 0.4) * 2);
      for (let offset = -1; offset <= 1; offset++) {
        const rx = riverCenter + offset;
        if (rx >= 0 && rx < size) {
          grid[rx][z].terrain = 'water';
        }
      }
      // Sand banks
      const rxL = riverCenter - 2;
      const rxR = riverCenter + 2;
      if (rxL >= 0 && rxL < size) grid[rxL][z].terrain = 'sand';
      if (rxR >= 0 && rxR < size) grid[rxR][z].terrain = 'sand';
    }

    // Starter road crossing with a bridge over river at z = 10
    const bridgeZ = 10;
    for (let x = 4; x <= 15; x++) {
      const isWater = grid[x][bridgeZ].terrain === 'water';
      const defId = isWater ? 'bridge' : 'road';
      grid[x][bridgeZ].building = {
        instanceId: `starter_road_${x}_${bridgeZ}`,
        defId,
        x,
        z: bridgeZ,
        rotation: 1, // East-West
        level: 1,
        placedAt: Date.now(),
      };
    }

    // Add a few starter buildings
    // West Bank: Cozy starter hamlet
    grid[5][9].building = {
      instanceId: 'starter_cottage_1',
      defId: 'cottage',
      x: 5,
      z: 9,
      rotation: 2,
      level: 1,
      placedAt: Date.now(),
    };
    grid[6][9].building = {
      instanceId: 'starter_cottage_2',
      defId: 'cottage',
      x: 6,
      z: 9,
      rotation: 2,
      level: 1,
      placedAt: Date.now(),
    };
    grid[5][11].building = {
      instanceId: 'starter_cafe_1',
      defId: 'bakery_cafe',
      x: 5,
      z: 11,
      rotation: 0,
      level: 1,
      placedAt: Date.now(),
    };
    grid[6][11].building = {
      instanceId: 'starter_solar_1',
      defId: 'solar_farm',
      x: 6,
      z: 11,
      rotation: 0,
      level: 1,
      placedAt: Date.now(),
    };
    grid[4][11].building = {
      instanceId: 'starter_water_1',
      defId: 'water_tower',
      x: 4,
      z: 11,
      rotation: 0,
      level: 1,
      placedAt: Date.now(),
    };

    // East Bank: Park and workshop
    grid[13][9].building = {
      instanceId: 'starter_park_1',
      defId: 'cherry_park',
      x: 13,
      z: 9,
      rotation: 0,
      level: 1,
      placedAt: Date.now(),
    };
    grid[14][11].building = {
      instanceId: 'starter_shop_1',
      defId: 'workshop',
      x: 14,
      z: 11,
      rotation: 0,
      level: 1,
      placedAt: Date.now(),
    };
  } else if (preset === 'coastal_haven') {
    // Ocean on right side (x >= 14)
    for (let x = 0; x < size; x++) {
      for (let z = 0; z < size; z++) {
        if (x >= 15) {
          grid[x][z].terrain = 'water';
        } else if (x >= 13) {
          grid[x][z].terrain = 'sand';
        }
      }
    }

    // Coastal road along x = 11
    for (let z = 3; z <= 16; z++) {
      grid[11][z].building = {
        instanceId: `coast_road_${11}_${z}`,
        defId: 'road',
        x: 11,
        z,
        rotation: 0,
        level: 1,
        placedAt: Date.now(),
      };
    }
  }

  updateGridRoadConnections(grid);
  return grid;
}
