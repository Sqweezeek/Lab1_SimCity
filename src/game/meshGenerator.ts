import * as THREE from 'three';
import { BuildingDef, PlacedBuilding, TerrainType } from '../types/city';

// --- Shared reusable material cache for peak WebGL performance ---
const materialCache = new Map<string, THREE.MeshStandardMaterial>();

export function getCachedMaterial(
  colorHex: string | number,
  options: {
    roughness?: number;
    metalness?: number;
    flatShading?: boolean;
    emissive?: string | number;
    emissiveIntensity?: number;
    transparent?: boolean;
    opacity?: number;
  } = {}
): THREE.MeshStandardMaterial {
  const key = `${colorHex}_${options.roughness ?? 0.6}_${options.metalness ?? 0.1}_${options.flatShading !== false}_${options.emissive ?? 0}_${options.opacity ?? 1}`;
  if (!materialCache.has(key)) {
    const mat = new THREE.MeshStandardMaterial({
      color: colorHex,
      roughness: options.roughness ?? 0.6,
      metalness: options.metalness ?? 0.1,
      flatShading: options.flatShading !== false,
      emissive: options.emissive ?? 0x000000,
      emissiveIntensity: options.emissiveIntensity ?? 0,
      transparent: options.transparent ?? false,
      opacity: options.opacity ?? 1.0,
    });
    materialCache.set(key, mat);
  }
  return materialCache.get(key)!;
}

// Low-poly vibrant color palette
export const PALETTE = {
  grass: '#58b368',
  grassAccent: '#4ca35b',
  water: '#38bdf8',
  sand: '#fcd34d',
  pavement: '#cbd5e1',
  asphalt: '#334155',
  roadLine: '#f8fafc',
  wood: '#b45309',
  woodDark: '#78350f',
  brickRed: '#e11d48',
  terracotta: '#ea580c',
  warmWhite: '#f8fafc',
  concrete: '#e2e8f0',
  windowDay: '#7dd3fc',
  windowLit: '#fde047',
  solarBlue: '#1e3a8a',
  solarCell: '#2563eb',
  metal: '#94a3b8',
  roofSlate: '#1e293b',
  roofTeal: '#0d9488',
  roofNavy: '#1e3a5f',
  leafGreen: '#22c55e',
  leafPine: '#15803d',
  cherryPink: '#f472b6',
  cherryBlossomDark: '#db2777',
  carRed: '#ef4444',
  carBlue: '#3b82f6',
  carYellow: '#f59e0b',
  carMint: '#10b981',
  carWhite: '#f1f5f9',
};

/**
 * Creates terrain tile 3D mesh
 */
export function createTerrainTileMesh(terrain: TerrainType, x: number, z: number): THREE.Group {
  const group = new THREE.Group();
  group.position.set(x, 0, z);

  const tileGeo = new THREE.BoxGeometry(0.98, 0.4, 0.98);

  let topColor = PALETTE.grass;
  if (terrain === 'water') topColor = PALETTE.water;
  else if (terrain === 'sand') topColor = PALETTE.sand;
  else if (terrain === 'pavement') topColor = PALETTE.pavement;

  const mat = getCachedMaterial(topColor, {
    roughness: terrain === 'water' ? 0.2 : 0.8,
    metalness: terrain === 'water' ? 0.4 : 0.05,
    flatShading: true,
  });

  const tileMesh = new THREE.Mesh(tileGeo, mat);
  tileMesh.position.y = -0.2;
  tileMesh.receiveShadow = true;
  tileMesh.castShadow = false;
  group.add(tileMesh);

  // If water, add gentle surface specular accent or ripples
  if (terrain === 'water') {
    const waveGeo = new THREE.BoxGeometry(0.5, 0.04, 0.3);
    const waveMat = getCachedMaterial('#e0f2fe', { transparent: true, opacity: 0.6 });
    const wave = new THREE.Mesh(waveGeo, waveMat);
    wave.position.set(0, 0.02, 0);
    wave.name = 'water_wave';
    group.add(wave);
  } else if (terrain === 'grass') {
    // Subtle low-poly tufts on ~25% of grass tiles for texture
    const seed = ((x * 37) ^ (z * 73)) % 100;
    if (seed < 20) {
      const tuftGeo = new THREE.ConeGeometry(0.08, 0.15, 4);
      const tuftMat = getCachedMaterial(PALETTE.grassAccent);
      const tuft = new THREE.Mesh(tuftGeo, tuftMat);
      tuft.position.set(0.15, 0.07, -0.1);
      tuft.rotation.y = seed;
      group.add(tuft);
    }
  }

  return group;
}

/**
 * Creates dynamic modular road mesh based on 4-way connections
 */
export function createRoadMesh(connections: { north: boolean; south: boolean; east: boolean; west: boolean }): THREE.Group {
  const group = new THREE.Group();

  // Asphalt base
  const baseGeo = new THREE.BoxGeometry(0.98, 0.06, 0.98);
  const baseMat = getCachedMaterial(PALETTE.asphalt, { roughness: 0.7 });
  const base = new THREE.Mesh(baseGeo, baseMat);
  base.position.y = 0.03;
  base.receiveShadow = true;
  group.add(base);

  // Sidewalk curbs around edges
  const curbMat = getCachedMaterial(PALETTE.concrete, { roughness: 0.8 });
  const curbGeoN = new THREE.BoxGeometry(0.98, 0.08, 0.1);
  const curbGeoE = new THREE.BoxGeometry(0.1, 0.08, 0.98);

  if (!connections.north) {
    const curb = new THREE.Mesh(curbGeoN, curbMat);
    curb.position.set(0, 0.04, -0.44);
    group.add(curb);
  }
  if (!connections.south) {
    const curb = new THREE.Mesh(curbGeoN, curbMat);
    curb.position.set(0, 0.04, 0.44);
    group.add(curb);
  }
  if (!connections.west) {
    const curb = new THREE.Mesh(curbGeoE, curbMat);
    curb.position.set(-0.44, 0.04, 0);
    group.add(curb);
  }
  if (!connections.east) {
    const curb = new THREE.Mesh(curbGeoE, curbMat);
    curb.position.set(0.44, 0.04, 0);
    group.add(curb);
  }

  // Road markings
  const lineMat = getCachedMaterial(PALETTE.roadLine, { roughness: 0.5 });
  const count = (connections.north ? 1 : 0) + (connections.south ? 1 : 0) + (connections.east ? 1 : 0) + (connections.west ? 1 : 0);

  if (count === 0 || (connections.north && connections.south && !connections.east && !connections.west)) {
    // North-South line
    const dashGeo = new THREE.BoxGeometry(0.04, 0.01, 0.4);
    const dash = new THREE.Mesh(dashGeo, lineMat);
    dash.position.set(0, 0.065, 0);
    group.add(dash);
  } else if (!connections.north && !connections.south && connections.east && connections.west) {
    // East-West line
    const dashGeo = new THREE.BoxGeometry(0.4, 0.01, 0.04);
    const dash = new THREE.Mesh(dashGeo, lineMat);
    dash.position.set(0, 0.065, 0);
    group.add(dash);
  } else if (count >= 3) {
    // Intersection center dot
    const dotGeo = new THREE.BoxGeometry(0.12, 0.01, 0.12);
    const dot = new THREE.Mesh(dotGeo, lineMat);
    dot.position.set(0, 0.065, 0);
    group.add(dot);
  }

  return group;
}

/**
 * Creates bridge over water
 */
export function createBridgeMesh(): THREE.Group {
  const group = new THREE.Group();

  // Stone pillars
  const pillarGeo = new THREE.BoxGeometry(0.16, 0.4, 0.8);
  const pillarMat = getCachedMaterial(PALETTE.concrete);
  const pillar = new THREE.Mesh(pillarGeo, pillarMat);
  pillar.position.set(0, -0.1, 0);
  group.add(pillar);

  // Wooden deck
  const deckGeo = new THREE.BoxGeometry(0.98, 0.12, 0.7);
  const deckMat = getCachedMaterial(PALETTE.wood);
  const deck = new THREE.Mesh(deckGeo, deckMat);
  deck.position.set(0, 0.1, 0);
  deck.castShadow = true;
  group.add(deck);

  // Railings
  const railGeo = new THREE.BoxGeometry(0.98, 0.15, 0.06);
  const railMat = getCachedMaterial(PALETTE.woodDark);

  const rail1 = new THREE.Mesh(railGeo, railMat);
  rail1.position.set(0, 0.22, 0.32);
  group.add(rail1);

  const rail2 = new THREE.Mesh(railGeo, railMat);
  rail2.position.set(0, 0.22, -0.32);
  group.add(rail2);

  return group;
}

/**
 * Procedural low-poly tree builder
 */
export function createTree(type: 'pine' | 'oak' | 'cherry' = 'oak', scale: number = 1): THREE.Group {
  const group = new THREE.Group();

  // Trunk
  const trunkGeo = new THREE.CylinderGeometry(0.04 * scale, 0.06 * scale, 0.25 * scale, 5);
  const trunkMat = getCachedMaterial(PALETTE.woodDark);
  const trunk = new THREE.Mesh(trunkGeo, trunkMat);
  trunk.position.y = 0.125 * scale;
  trunk.castShadow = true;
  group.add(trunk);

  if (type === 'pine') {
    const leafMat = getCachedMaterial(PALETTE.leafPine);
    for (let i = 0; i < 3; i++) {
      const coneGeo = new THREE.ConeGeometry((0.24 - i * 0.05) * scale, (0.28 - i * 0.04) * scale, 5);
      const cone = new THREE.Mesh(coneGeo, leafMat);
      cone.position.y = (0.24 + i * 0.16) * scale;
      cone.castShadow = true;
      group.add(cone);
    }
  } else if (type === 'cherry') {
    const leafMat = getCachedMaterial(PALETTE.cherryPink);
    const foliageGeo = new THREE.DodecahedronGeometry(0.22 * scale, 0);
    const foliage = new THREE.Mesh(foliageGeo, leafMat);
    foliage.position.y = 0.32 * scale;
    foliage.scale.set(1.1, 0.9, 1.1);
    foliage.castShadow = true;
    group.add(foliage);

    const accentGeo = new THREE.DodecahedronGeometry(0.14 * scale, 0);
    const accentMat = getCachedMaterial(PALETTE.cherryBlossomDark);
    const accent = new THREE.Mesh(accentGeo, accentMat);
    accent.position.set(0.1 * scale, 0.38 * scale, 0.08 * scale);
    accent.castShadow = true;
    group.add(accent);
  } else {
    // Deciduous Oak
    const leafMat = getCachedMaterial(PALETTE.leafGreen);
    const foliageGeo = new THREE.DodecahedronGeometry(0.24 * scale, 0);
    const foliage = new THREE.Mesh(foliageGeo, leafMat);
    foliage.position.y = 0.32 * scale;
    foliage.castShadow = true;
    group.add(foliage);

    const foliageTopGeo = new THREE.DodecahedronGeometry(0.16 * scale, 0);
    const top = new THREE.Mesh(foliageTopGeo, leafMat);
    top.position.set(-0.06 * scale, 0.44 * scale, 0.04 * scale);
    top.castShadow = true;
    group.add(top);
  }

  return group;
}

/**
 * Creates rich modular 3D building models with distinct low-poly aesthetics
 */
export function createBuildingMesh(building: PlacedBuilding, def: BuildingDef): THREE.Group {
  const root = new THREE.Group();
  root.position.set(building.x, 0, building.z);
  root.rotation.y = (building.rotation * Math.PI) / 2;

  const level = building.level || 1;

  switch (def.id) {
    case 'cottage': {
      // Base yard
      const yardGeo = new THREE.BoxGeometry(0.85, 0.05, 0.85);
      const yardMat = getCachedMaterial(PALETTE.concrete);
      const yard = new THREE.Mesh(yardGeo, yardMat);
      yard.position.y = 0.025;
      root.add(yard);

      // House body
      const wallMat = getCachedMaterial('#ffedd5'); // Warm peach
      const bodyH = 0.35 + (level - 1) * 0.15;
      const bodyGeo = new THREE.BoxGeometry(0.55, bodyH, 0.5);
      const body = new THREE.Mesh(bodyGeo, wallMat);
      body.position.set(-0.05, 0.05 + bodyH / 2, 0.05);
      body.castShadow = true;
      body.receiveShadow = true;
      root.add(body);

      // Pitched roof (triangular prism / wedge via 4-sided cone)
      const roofMat = getCachedMaterial(level > 1 ? PALETTE.terracotta : PALETTE.roofTeal);
      const roofGeo = new THREE.ConeGeometry(0.48, 0.3, 4);
      const roof = new THREE.Mesh(roofGeo, roofMat);
      roof.position.set(-0.05, 0.05 + bodyH + 0.15, 0.05);
      roof.rotation.y = Math.PI / 4;
      roof.castShadow = true;
      root.add(roof);

      // Chimney with low-poly smoke
      const chimneyGeo = new THREE.BoxGeometry(0.08, 0.25, 0.08);
      const chimneyMat = getCachedMaterial(PALETTE.brickRed);
      const chimney = new THREE.Mesh(chimneyGeo, chimneyMat);
      chimney.position.set(0.12, 0.05 + bodyH + 0.2, 0.12);
      chimney.castShadow = true;
      root.add(chimney);

      // Windows
      const winMat = getCachedMaterial(PALETTE.windowLit, {
        emissive: '#d97706',
        emissiveIntensity: 0.3,
      });
      const winGeo = new THREE.BoxGeometry(0.12, 0.14, 0.02);
      const win1 = new THREE.Mesh(winGeo, winMat);
      win1.position.set(-0.05, 0.05 + bodyH * 0.5, 0.31);
      root.add(win1);

      // Little garden tree
      const tree = createTree('oak', 0.65);
      tree.position.set(0.28, 0, -0.22);
      root.add(tree);
      break;
    }

    case 'townhouse': {
      // 2 to 3-story modern modular brick townhouse
      const floors = 2 + (level - 1);
      const floorH = 0.32;
      const wallMat = getCachedMaterial('#fca5a5'); // Rose terracotta
      const trimMat = getCachedMaterial(PALETTE.warmWhite);

      for (let f = 0; f < floors; f++) {
        const floorGeo = new THREE.BoxGeometry(0.68, floorH * 0.95, 0.65);
        const floorMesh = new THREE.Mesh(floorGeo, wallMat);
        floorMesh.position.set(0, 0.05 + f * floorH + floorH * 0.475, 0);
        floorMesh.castShadow = true;
        floorMesh.receiveShadow = true;
        root.add(floorMesh);

        // Windows per floor
        const winMat = getCachedMaterial(PALETTE.windowLit, { emissive: '#b45309', emissiveIntensity: 0.25 });
        const winGeo = new THREE.BoxGeometry(0.14, 0.16, 0.02);

        const winL = new THREE.Mesh(winGeo, winMat);
        winL.position.set(-0.18, 0.05 + f * floorH + floorH * 0.55, 0.33);
        root.add(winL);

        const winR = new THREE.Mesh(winGeo, winMat);
        winR.position.set(0.18, 0.05 + f * floorH + floorH * 0.55, 0.33);
        root.add(winR);

        // White floor trim
        const trimGeo = new THREE.BoxGeometry(0.72, 0.04, 0.68);
        const trimMesh = new THREE.Mesh(trimGeo, trimMat);
        trimMesh.position.set(0, 0.05 + (f + 1) * floorH, 0);
        root.add(trimMesh);
      }

      // Mansard Roof / Terrace
      const roofY = 0.05 + floors * floorH;
      const roofGeo = new THREE.BoxGeometry(0.6, 0.16, 0.58);
      const roofMat = getCachedMaterial(PALETTE.roofSlate);
      const roof = new THREE.Mesh(roofGeo, roofMat);
      roof.position.set(0, roofY + 0.08, 0);
      roof.castShadow = true;
      root.add(roof);

      // Potted top plant
      const pot = createTree('pine', 0.4);
      pot.position.set(0.18, roofY + 0.16, 0.18);
      root.add(pot);
      break;
    }

    case 'apartment_tower': {
      // Sleek modular high-density residential with staggered balconies
      const floors = 4 + (level - 1) * 2;
      const totalH = floors * 0.3;
      const bodyMat = getCachedMaterial('#f1f5f9');
      const accentMat = getCachedMaterial('#0284c7');
      const glassMat = getCachedMaterial(PALETTE.windowDay, {
        roughness: 0.1,
        metalness: 0.8,
        emissive: '#0284c7',
        emissiveIntensity: 0.15,
      });

      // Central core
      const coreGeo = new THREE.BoxGeometry(0.65, totalH, 0.65);
      const core = new THREE.Mesh(coreGeo, bodyMat);
      core.position.y = totalH / 2;
      core.castShadow = true;
      root.add(core);

      // Window grid strips
      const stripGeo = new THREE.BoxGeometry(0.5, totalH * 0.88, 0.67);
      const strip = new THREE.Mesh(stripGeo, glassMat);
      strip.position.y = totalH / 2;
      root.add(strip);

      // Cantilevered modular balconies
      for (let f = 1; f < floors; f += 2) {
        const balcGeo = new THREE.BoxGeometry(0.25, 0.06, 0.18);
        const balc = new THREE.Mesh(balcGeo, accentMat);
        balc.position.set(0.15, f * 0.3, 0.4);
        balc.castShadow = true;
        root.add(balc);
      }

      // Rooftop solar canopy & greenery
      const roofY = totalH;
      const canopyGeo = new THREE.BoxGeometry(0.5, 0.04, 0.5);
      const canopyMat = getCachedMaterial(PALETTE.solarCell);
      const canopy = new THREE.Mesh(canopyGeo, canopyMat);
      canopy.position.set(0, roofY + 0.1, 0);
      root.add(canopy);

      const antGeo = new THREE.CylinderGeometry(0.015, 0.02, 0.35, 4);
      const antMat = getCachedMaterial(PALETTE.metal);
      const antenna = new THREE.Mesh(antGeo, antMat);
      antenna.position.set(0.18, roofY + 0.25, -0.18);
      root.add(antenna);
      break;
    }

    case 'eco_villa': {
      // 2x2 luxury passive solar estate
      const baseGeo = new THREE.BoxGeometry(1.85, 0.08, 1.85);
      const baseMat = getCachedMaterial(PALETTE.pavement);
      const base = new THREE.Mesh(baseGeo, baseMat);
      base.position.y = 0.04;
      root.add(base);

      // Geometric white villas
      const villa1Geo = new THREE.BoxGeometry(0.9, 0.5, 0.75);
      const villaMat = getCachedMaterial('#ffffff');
      const v1 = new THREE.Mesh(villa1Geo, villaMat);
      v1.position.set(-0.35, 0.3, 0.3);
      v1.castShadow = true;
      root.add(v1);

      const villa2Geo = new THREE.BoxGeometry(0.8, 0.7, 0.8);
      const v2 = new THREE.Mesh(villa2Geo, villaMat);
      v2.position.set(0.35, 0.4, -0.3);
      v2.castShadow = true;
      root.add(v2);

      // Infinity pool
      const poolGeo = new THREE.BoxGeometry(0.7, 0.08, 0.55);
      const poolMat = getCachedMaterial('#06b6d4', { roughness: 0.1, metalness: 0.5 });
      const pool = new THREE.Mesh(poolGeo, poolMat);
      pool.position.set(0.4, 0.07, 0.45);
      root.add(pool);

      // Trees
      const t1 = createTree('cherry', 0.85);
      t1.position.set(-0.6, 0.08, -0.6);
      root.add(t1);

      // Solar rooftop
      const solGeo = new THREE.BoxGeometry(0.7, 0.04, 0.7);
      const solMat = getCachedMaterial(PALETTE.solarCell);
      const sol = new THREE.Mesh(solGeo, solMat);
      sol.position.set(0.35, 0.77, -0.3);
      root.add(sol);
      break;
    }

    case 'bakery_cafe': {
      // Street Cafe with striped canvas awning
      const cafeGeo = new THREE.BoxGeometry(0.7, 0.5, 0.65);
      const cafeMat = getCachedMaterial('#fef08a'); // Butter yellow
      const cafe = new THREE.Mesh(cafeGeo, cafeMat);
      cafe.position.y = 0.25;
      cafe.castShadow = true;
      root.add(cafe);

      // Striped awning
      const awningGeo = new THREE.BoxGeometry(0.65, 0.06, 0.28);
      const awningMat = getCachedMaterial(PALETTE.terracotta);
      const awning = new THREE.Mesh(awningGeo, awningMat);
      awning.position.set(0, 0.36, 0.42);
      awning.rotation.x = 0.2;
      root.add(awning);

      // Window display
      const displayGeo = new THREE.BoxGeometry(0.45, 0.2, 0.02);
      const displayMat = getCachedMaterial(PALETTE.windowLit, { emissive: '#f59e0b', emissiveIntensity: 0.4 });
      const display = new THREE.Mesh(displayGeo, displayMat);
      display.position.set(0, 0.2, 0.33);
      root.add(display);

      // Outdoor table with umbrella
      const tableGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.12, 6);
      const tableMat = getCachedMaterial(PALETTE.wood);
      const table = new THREE.Mesh(tableGeo, tableMat);
      table.position.set(0.25, 0.06, 0.35);
      root.add(table);

      // Rooftop sign (coffee cup motif)
      const cupGeo = new THREE.CylinderGeometry(0.08, 0.06, 0.14, 6);
      const cupMat = getCachedMaterial(PALETTE.warmWhite);
      const cup = new THREE.Mesh(cupGeo, cupMat);
      cup.position.set(0, 0.58, 0);
      root.add(cup);
      break;
    }

    case 'boutique_plaza': {
      // Retail boutique
      const storeGeo = new THREE.BoxGeometry(0.75, 0.55, 0.7);
      const storeMat = getCachedMaterial('#fdba74'); // Warm orange
      const store = new THREE.Mesh(storeGeo, storeMat);
      store.position.y = 0.275;
      store.castShadow = true;
      root.add(store);

      // Modern glass front
      const glassGeo = new THREE.BoxGeometry(0.65, 0.35, 0.04);
      const glassMat = getCachedMaterial(PALETTE.windowLit, { emissive: '#ea580c', emissiveIntensity: 0.35 });
      const glass = new THREE.Mesh(glassGeo, glassMat);
      glass.position.set(0, 0.22, 0.35);
      root.add(glass);

      // Neon sign on roof
      const signGeo = new THREE.BoxGeometry(0.5, 0.12, 0.05);
      const signMat = getCachedMaterial('#06b6d4', { emissive: '#06b6d4', emissiveIntensity: 0.6 });
      const sign = new THREE.Mesh(signGeo, signMat);
      sign.position.set(0, 0.62, 0.3);
      root.add(sign);
      break;
    }

    case 'corporate_tower': {
      // Faceted modern prism skyscraper
      const h = 1.3 + (level - 1) * 0.4;
      const towerGeo = new THREE.CylinderGeometry(0.3, 0.38, h, 6);
      const towerMat = getCachedMaterial('#0284c7', {
        roughness: 0.15,
        metalness: 0.85,
        flatShading: true,
      });
      const tower = new THREE.Mesh(towerGeo, towerMat);
      tower.position.y = h / 2;
      tower.castShadow = true;
      root.add(tower);

      // Spire
      const spireGeo = new THREE.CylinderGeometry(0.02, 0.06, 0.45, 4);
      const spireMat = getCachedMaterial(PALETTE.metal);
      const spire = new THREE.Mesh(spireGeo, spireMat);
      spire.position.y = h + 0.22;
      root.add(spire);

      // Spire beacon
      const beaconGeo = new THREE.SphereGeometry(0.04, 6, 6);
      const beaconMat = getCachedMaterial('#ef4444', { emissive: '#ef4444', emissiveIntensity: 0.8 });
      const beacon = new THREE.Mesh(beaconGeo, beaconMat);
      beacon.position.y = h + 0.45;
      root.add(beacon);
      break;
    }

    case 'shopping_center': {
      // 2x2 Atrium Mall with glass geodesic dome
      const mallGeo = new THREE.BoxGeometry(1.8, 0.5, 1.8);
      const mallMat = getCachedMaterial('#ddd6fe');
      const mall = new THREE.Mesh(mallGeo, mallMat);
      mall.position.y = 0.25;
      mall.castShadow = true;
      root.add(mall);

      // Central Glass Dome
      const domeGeo = new THREE.SphereGeometry(0.48, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2);
      const domeMat = getCachedMaterial('#38bdf8', {
        roughness: 0.1,
        metalness: 0.5,
        transparent: true,
        opacity: 0.85,
      });
      const dome = new THREE.Mesh(domeGeo, domeMat);
      dome.position.y = 0.5;
      root.add(dome);

      // Entry pillars
      const pMat = getCachedMaterial(PALETTE.warmWhite);
      for (let i = -1; i <= 1; i += 2) {
        const pGeo = new THREE.BoxGeometry(0.1, 0.4, 0.1);
        const pMesh = new THREE.Mesh(pGeo, pMat);
        pMesh.position.set(i * 0.35, 0.2, 0.92);
        root.add(pMesh);
      }
      break;
    }

    case 'workshop': {
      // Light industrial workshop with sawtooth roof
      const shopGeo = new THREE.BoxGeometry(0.75, 0.4, 0.7);
      const shopMat = getCachedMaterial('#94a3b8');
      const shop = new THREE.Mesh(shopGeo, shopMat);
      shop.position.y = 0.2;
      shop.castShadow = true;
      root.add(shop);

      // Sawtooth roof wedges
      const sawMat = getCachedMaterial(PALETTE.roofSlate);
      for (let i = -0.22; i <= 0.22; i += 0.22) {
        const sawGeo = new THREE.ConeGeometry(0.18, 0.18, 3);
        const saw = new THREE.Mesh(sawGeo, sawMat);
        saw.position.set(i, 0.48, 0);
        saw.rotation.z = 0.4;
        saw.castShadow = true;
        root.add(saw);
      }

      // Rollup garage door
      const doorGeo = new THREE.BoxGeometry(0.3, 0.25, 0.02);
      const doorMat = getCachedMaterial('#475569');
      const door = new THREE.Mesh(doorGeo, doorMat);
      door.position.set(0, 0.125, 0.355);
      root.add(door);
      break;
    }

    case 'tech_server_hub': {
      // Clean high-tech data cube
      const cubeGeo = new THREE.BoxGeometry(0.72, 0.65, 0.72);
      const cubeMat = getCachedMaterial('#1e293b');
      const cube = new THREE.Mesh(cubeGeo, cubeMat);
      cube.position.y = 0.325;
      cube.castShadow = true;
      root.add(cube);

      // Glowing data conduits
      const lineMat = getCachedMaterial('#00f0ff', { emissive: '#00f0ff', emissiveIntensity: 0.6 });
      const lineGeoH = new THREE.BoxGeometry(0.6, 0.04, 0.73);
      const lineH = new THREE.Mesh(lineGeoH, lineMat);
      lineH.position.y = 0.35;
      root.add(lineH);

      // Cooling fans on roof
      const fanMat = getCachedMaterial(PALETTE.metal);
      for (let i = -0.18; i <= 0.18; i += 0.36) {
        const fanGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.08, 6);
        const fan = new THREE.Mesh(fanGeo, fanMat);
        fan.position.set(i, 0.68, 0);
        root.add(fan);
      }
      break;
    }

    case 'solar_farm': {
      // Base gravel pad
      const padGeo = new THREE.BoxGeometry(0.88, 0.04, 0.88);
      const padMat = getCachedMaterial('#cbd5e1');
      const pad = new THREE.Mesh(padGeo, padMat);
      pad.position.y = 0.02;
      root.add(pad);

      // 4 Tilted Solar panels
      const panelGeo = new THREE.BoxGeometry(0.34, 0.03, 0.32);
      const panelMat = getCachedMaterial(PALETTE.solarCell, { roughness: 0.2, metalness: 0.7 });
      const standMat = getCachedMaterial(PALETTE.metal);

      const positions = [
        [-0.22, -0.22],
        [0.22, -0.22],
        [-0.22, 0.22],
        [0.22, 0.22],
      ];

      positions.forEach(([px, pz]) => {
        const panel = new THREE.Mesh(panelGeo, panelMat);
        panel.position.set(px, 0.18, pz);
        panel.rotation.x = 0.45; // Tilted toward sun
        panel.castShadow = true;
        root.add(panel);

        const standGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.15, 4);
        const stand = new THREE.Mesh(standGeo, standMat);
        stand.position.set(px, 0.09, pz);
        root.add(stand);
      });
      break;
    }

    case 'wind_turbine': {
      // Sleek tapered pylon
      const towerGeo = new THREE.CylinderGeometry(0.035, 0.07, 1.3, 8);
      const towerMat = getCachedMaterial(PALETTE.warmWhite);
      const tower = new THREE.Mesh(towerGeo, towerMat);
      tower.position.y = 0.65;
      tower.castShadow = true;
      root.add(tower);

      // Nacelle hub
      const hubGeo = new THREE.BoxGeometry(0.1, 0.1, 0.18);
      const hubMat = getCachedMaterial(PALETTE.warmWhite);
      const hub = new THREE.Mesh(hubGeo, hubMat);
      hub.position.set(0, 1.3, 0);
      root.add(hub);

      // Rotating rotor group with 3 blades (marked with 'turbine_rotor' for animation loop)
      const rotorGroup = new THREE.Group();
      rotorGroup.position.set(0, 1.3, 0.1);
      rotorGroup.name = 'turbine_rotor';

      const bladeGeo = new THREE.BoxGeometry(0.04, 0.48, 0.015);
      const bladeMat = getCachedMaterial('#38bdf8');

      for (let b = 0; b < 3; b++) {
        const blade = new THREE.Mesh(bladeGeo, bladeMat);
        blade.position.y = 0.24;
        const bladeHolder = new THREE.Group();
        bladeHolder.rotation.z = (b * Math.PI * 2) / 3;
        bladeHolder.add(blade);
        rotorGroup.add(bladeHolder);
      }
      root.add(rotorGroup);
      break;
    }

    case 'water_tower': {
      // Elevated water reservoir
      const legMat = getCachedMaterial(PALETTE.metal);
      for (let i = -1; i <= 1; i += 2) {
        for (let j = -1; j <= 1; j += 2) {
          const legGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.7, 4);
          const leg = new THREE.Mesh(legGeo, legMat);
          leg.position.set(i * 0.22, 0.35, j * 0.22);
          root.add(leg);
        }
      }

      // Tank
      const tankGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.35, 8);
      const tankMat = getCachedMaterial('#0284c7', { roughness: 0.3, metalness: 0.5 });
      const tank = new THREE.Mesh(tankGeo, tankMat);
      tank.position.y = 0.85;
      tank.castShadow = true;
      root.add(tank);

      // Conical cap
      const capGeo = new THREE.ConeGeometry(0.34, 0.15, 8);
      const cap = new THREE.Mesh(capGeo, tankMat);
      cap.position.y = 1.1;
      root.add(cap);
      break;
    }

    case 'health_clinic': {
      // Modern white clinic with red medical cross
      const clinicGeo = new THREE.BoxGeometry(0.75, 0.5, 0.75);
      const clinicMat = getCachedMaterial(PALETTE.warmWhite);
      const clinic = new THREE.Mesh(clinicGeo, clinicMat);
      clinic.position.y = 0.25;
      clinic.castShadow = true;
      root.add(clinic);

      // Red cross on front
      const crossMat = getCachedMaterial('#ef4444', { emissive: '#ef4444', emissiveIntensity: 0.4 });
      const crossH = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.08, 0.02), crossMat);
      crossH.position.set(0, 0.32, 0.38);
      root.add(crossH);

      const crossV = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.24, 0.02), crossMat);
      crossV.position.set(0, 0.32, 0.38);
      root.add(crossV);

      // Rooftop air conditioning / ventilation
      const acGeo = new THREE.BoxGeometry(0.25, 0.12, 0.2);
      const acMat = getCachedMaterial(PALETTE.metal);
      const ac = new THREE.Mesh(acGeo, acMat);
      ac.position.set(0.18, 0.56, -0.18);
      root.add(ac);
      break;
    }

    case 'fire_station': {
      // Fire station with rescue garage doors and tower
      const stationGeo = new THREE.BoxGeometry(0.75, 0.45, 0.75);
      const stationMat = getCachedMaterial('#b91c1c'); // Deep red
      const station = new THREE.Mesh(stationGeo, stationMat);
      station.position.y = 0.225;
      station.castShadow = true;
      root.add(station);

      // Tower
      const towerGeo = new THREE.BoxGeometry(0.25, 0.8, 0.25);
      const towerMat = getCachedMaterial('#991b1b');
      const tower = new THREE.Mesh(towerGeo, towerMat);
      tower.position.set(-0.24, 0.4, -0.24);
      tower.castShadow = true;
      root.add(tower);

      // Garage bays
      const doorMat = getCachedMaterial(PALETTE.warmWhite);
      const door1 = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.25, 0.02), doorMat);
      door1.position.set(0.15, 0.13, 0.38);
      root.add(door1);
      break;
    }

    case 'metro_station': {
      // 2x1 Transit terminal
      const termGeo = new THREE.BoxGeometry(1.75, 0.45, 0.8);
      const termMat = getCachedMaterial('#4f46e5');
      const term = new THREE.Mesh(termGeo, termMat);
      term.position.y = 0.225;
      term.castShadow = true;
      root.add(term);

      // Glass arched canopy
      const glassCanopy = new THREE.Mesh(
        new THREE.CylinderGeometry(0.35, 0.35, 1.5, 8, 1, false, 0, Math.PI),
        getCachedMaterial(PALETTE.windowDay, { transparent: true, opacity: 0.8 })
      );
      glassCanopy.position.set(0, 0.45, 0);
      glassCanopy.rotation.z = Math.PI / 2;
      root.add(glassCanopy);
      break;
    }

    case 'fountain_plaza': {
      // Paved stone plaza with tiered fountain
      const plazaGeo = new THREE.BoxGeometry(0.9, 0.04, 0.9);
      const plazaMat = getCachedMaterial('#cbd5e1');
      const plaza = new THREE.Mesh(plazaGeo, plazaMat);
      plaza.position.y = 0.02;
      root.add(plaza);

      // Fountain tier 1
      const tier1Geo = new THREE.CylinderGeometry(0.3, 0.34, 0.12, 8);
      const tierMat = getCachedMaterial(PALETTE.warmWhite);
      const tier1 = new THREE.Mesh(tier1Geo, tierMat);
      tier1.position.y = 0.1;
      root.add(tier1);

      // Water pool
      const waterGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.04, 8);
      const waterMat = getCachedMaterial(PALETTE.water, { roughness: 0.1, metalness: 0.5 });
      const water = new THREE.Mesh(waterGeo, waterMat);
      water.position.y = 0.15;
      root.add(water);

      // Spout center
      const spoutGeo = new THREE.CylinderGeometry(0.06, 0.08, 0.22, 6);
      const spout = new THREE.Mesh(spoutGeo, tierMat);
      spout.position.y = 0.22;
      root.add(spout);

      // Benches & trees at corners
      const tree1 = createTree('oak', 0.5);
      tree1.position.set(-0.35, 0.04, -0.35);
      root.add(tree1);

      const tree2 = createTree('oak', 0.5);
      tree2.position.set(0.35, 0.04, 0.35);
      root.add(tree2);
      break;
    }

    case 'cherry_park': {
      // Blossom garden with stone path and cherry trees
      const parkPad = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.04, 0.9), getCachedMaterial(PALETTE.grass));
      parkPad.position.y = 0.02;
      root.add(parkPad);

      // Two majestic cherry trees
      const c1 = createTree('cherry', 0.85);
      c1.position.set(-0.2, 0.04, -0.15);
      root.add(c1);

      const c2 = createTree('cherry', 0.65);
      c2.position.set(0.25, 0.04, 0.2);
      root.add(c2);

      // Stone lantern
      const lanternGeo = new THREE.BoxGeometry(0.08, 0.2, 0.08);
      const lanternMat = getCachedMaterial(PALETTE.concrete);
      const lantern = new THREE.Mesh(lanternGeo, lanternMat);
      lantern.position.set(-0.25, 0.14, 0.25);
      root.add(lantern);
      break;
    }

    case 'botanical_garden': {
      // 2x2 Geodesic biosphere
      const padGeo = new THREE.BoxGeometry(1.85, 0.04, 1.85);
      const pad = new THREE.Mesh(padGeo, getCachedMaterial(PALETTE.concrete));
      pad.position.y = 0.02;
      root.add(pad);

      // Central geodesic glass dome
      const bioDomeGeo = new THREE.IcosahedronGeometry(0.7, 1);
      const bioDomeMat = getCachedMaterial('#6ee7b7', {
        roughness: 0.1,
        metalness: 0.3,
        transparent: true,
        opacity: 0.8,
        flatShading: true,
      });
      const bioDome = new THREE.Mesh(bioDomeGeo, bioDomeMat);
      bioDome.position.y = 0.5;
      root.add(bioDome);

      // Perimeter trees
      const t1 = createTree('pine', 0.7);
      t1.position.set(-0.6, 0.04, -0.6);
      root.add(t1);

      const t2 = createTree('oak', 0.7);
      t2.position.set(0.6, 0.04, 0.6);
      root.add(t2);
      break;
    }

    default: {
      // Fallback modular colored box
      const boxGeo = new THREE.BoxGeometry(0.8, 0.6, 0.8);
      const boxMat = getCachedMaterial(def.color || '#3b82f6');
      const box = new THREE.Mesh(boxGeo, boxMat);
      box.position.y = 0.3;
      box.castShadow = true;
      root.add(box);
    }
  }

  return root;
}

/**
 * Creates miniature low-poly car for traffic
 */
export function createMiniCar(colorHex: string = PALETTE.carRed): THREE.Group {
  const car = new THREE.Group();

  // Car chassis
  const bodyGeo = new THREE.BoxGeometry(0.18, 0.07, 0.32);
  const bodyMat = getCachedMaterial(colorHex, { roughness: 0.3, metalness: 0.2 });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = 0.06;
  body.castShadow = true;
  car.add(body);

  // Roof / Cabin
  const cabinGeo = new THREE.BoxGeometry(0.14, 0.06, 0.16);
  const cabinMat = getCachedMaterial(PALETTE.windowDay, { roughness: 0.1, metalness: 0.8 });
  const cabin = new THREE.Mesh(cabinGeo, cabinMat);
  cabin.position.set(0, 0.12, -0.02);
  car.add(cabin);

  // Tiny wheels
  const wheelGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.03, 6);
  const wheelMat = getCachedMaterial('#0f172a');

  const wPositions = [
    [-0.09, 0.03, 0.09],
    [0.09, 0.03, 0.09],
    [-0.09, 0.03, -0.09],
    [0.09, 0.03, -0.09],
  ];

  wPositions.forEach(([wx, wy, wz]) => {
    const w = new THREE.Mesh(wheelGeo, wheelMat);
    w.rotation.z = Math.PI / 2;
    w.position.set(wx, wy, wz);
    car.add(w);
  });

  // Headlights
  const lightGeo = new THREE.BoxGeometry(0.04, 0.02, 0.01);
  const lightMat = getCachedMaterial('#fef08a', { emissive: '#fef08a', emissiveIntensity: 0.6 });
  const l1 = new THREE.Mesh(lightGeo, lightMat);
  l1.position.set(-0.06, 0.06, 0.165);
  car.add(l1);

  const l2 = new THREE.Mesh(lightGeo, lightMat);
  l2.position.set(0.06, 0.06, 0.165);
  car.add(l2);

  return car;
}
