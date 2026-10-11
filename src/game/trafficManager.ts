import * as THREE from 'three';
import { TileData } from '../types/city';
import { createMiniCar, PALETTE } from './meshGenerator';

interface CarAgent {
  mesh: THREE.Group;
  currentTile: { x: number; z: number };
  targetTile: { x: number; z: number };
  progress: number;
  speed: number;
  direction: 'N' | 'S' | 'E' | 'W';
}

const CAR_COLORS = [
  PALETTE.carRed,
  PALETTE.carBlue,
  PALETTE.carYellow,
  PALETTE.carMint,
  PALETTE.carWhite,
  '#a855f7',
  '#f97316',
];

export class TrafficManager {
  private scene: THREE.Group;
  private cars: CarAgent[] = [];
  private roadTiles: { x: number; z: number }[] = [];

  constructor(parentScene: THREE.Object3D) {
    this.scene = new THREE.Group();
    this.scene.name = 'traffic_system';
    parentScene.add(this.scene);
  }

  public updateRoadNetwork(grid: TileData[][]) {
    const roads: { x: number; z: number }[] = [];
    for (let x = 0; x < grid.length; x++) {
      for (let z = 0; z < grid[0].length; z++) {
        const b = grid[x][z].building;
        if (b && (b.defId === 'road' || b.defId === 'bridge')) {
          roads.push({ x, z });
        }
      }
    }
    this.roadTiles = roads;

    // Desired number of cars based on roads
    const targetCars = Math.min(24, Math.floor(roads.length / 2));

    // Remove excess cars or cars stuck on non-roads
    this.cars = this.cars.filter((car) => {
      const stillRoad = this.isRoad(car.currentTile.x, car.currentTile.z);
      if (!stillRoad) {
        this.scene.remove(car.mesh);
        return false;
      }
      return true;
    });

    // Spawn new cars up to target
    while (this.cars.length < targetCars && roads.length >= 2) {
      this.spawnCar();
    }
  }

  private isRoad(x: number, z: number): boolean {
    return this.roadTiles.some((r) => r.x === x && r.z === z);
  }

  private getNeighbors(x: number, z: number): { x: number; z: number; dir: 'N' | 'S' | 'E' | 'W' }[] {
    const neighbors: { x: number; z: number; dir: 'N' | 'S' | 'E' | 'W' }[] = [];
    if (this.isRoad(x, z - 1)) neighbors.push({ x, z: z - 1, dir: 'N' });
    if (this.isRoad(x, z + 1)) neighbors.push({ x, z: z + 1, dir: 'S' });
    if (this.isRoad(x + 1, z)) neighbors.push({ x: x + 1, z, dir: 'E' });
    if (this.isRoad(x - 1, z)) neighbors.push({ x: x - 1, z, dir: 'W' });
    return neighbors;
  }

  private spawnCar() {
    if (this.roadTiles.length < 2) return;
    const startIdx = Math.floor(Math.random() * this.roadTiles.length);
    const startTile = this.roadTiles[startIdx];
    const neighbors = this.getNeighbors(startTile.x, startTile.z);
    if (neighbors.length === 0) return;

    const next = neighbors[Math.floor(Math.random() * neighbors.length)];
    const color = CAR_COLORS[Math.floor(Math.random() * CAR_COLORS.length)];
    const carMesh = createMiniCar(color);

    const agent: CarAgent = {
      mesh: carMesh,
      currentTile: { x: startTile.x, z: startTile.z },
      targetTile: { x: next.x, z: next.z },
      progress: 0,
      speed: 0.8 + Math.random() * 0.4,
      direction: next.dir,
    };

    this.scene.add(carMesh);
    this.cars.push(agent);
  }

  public tick(delta: number) {
    if (this.roadTiles.length < 2) return;

    for (let i = 0; i < this.cars.length; i++) {
      const car = this.cars[i];
      car.progress += car.speed * delta;

      const sx = car.currentTile.x;
      const sz = car.currentTile.z;
      const tx = car.targetTile.x;
      const tz = car.targetTile.z;

      const px = sx + (tx - sx) * car.progress;
      const pz = sz + (tz - sz) * car.progress;

      // Lane offset: drive on right side of road
      let laneX = 0;
      let laneZ = 0;
      let rotY = 0;

      if (car.direction === 'N') {
        laneX = 0.14;
        rotY = Math.PI;
      } else if (car.direction === 'S') {
        laneX = -0.14;
        rotY = 0;
      } else if (car.direction === 'E') {
        laneZ = 0.14;
        rotY = Math.PI / 2;
      } else if (car.direction === 'W') {
        laneZ = -0.14;
        rotY = -Math.PI / 2;
      }

      car.mesh.position.set(px + laneX, 0.04, pz + laneZ);
      car.mesh.rotation.y = rotY;

      // When reached destination tile, pick next road neighbor
      if (car.progress >= 1.0) {
        car.currentTile = { x: tx, z: tz };
        car.progress = 0;

        const neighbors = this.getNeighbors(tx, tz).filter(
          // Prefer not doing immediate 180 turnaround unless dead end
          (n) => !(n.x === sx && n.z === sz)
        );

        const available = neighbors.length > 0 ? neighbors : this.getNeighbors(tx, tz);
        if (available.length > 0) {
          const next = available[Math.floor(Math.random() * available.length)];
          car.targetTile = { x: next.x, z: next.z };
          car.direction = next.dir;
        }
      }
    }
  }

  public clear() {
    for (const car of this.cars) {
      this.scene.remove(car.mesh);
    }
    this.cars = [];
    this.roadTiles = [];
  }
}
