import * as THREE from 'three';
import { BuildingDef, PlacedBuilding, TileData, TimeOfDay } from '../types/city';
import { BUILDING_DEFS } from './buildingDefs';
import {
  createBridgeMesh,
  createBuildingMesh,
  createRoadMesh,
  createTerrainTileMesh,
  getCachedMaterial,
} from './meshGenerator';
import { TrafficManager } from './trafficManager';

export interface SceneCallbacks {
  onTileHover: (coords: { x: number; z: number } | null) => void;
  onTileClick: (coords: { x: number; z: number }) => void;
}

export class CityScene {
  private container: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.OrthographicCamera;
  private animFrameId: number | null = null;
  private lastTime: number = 0;

  // Scene subgroups
  private terrainGroup: THREE.Group;
  private buildingsGroup: THREE.Group;
  private cursorGroup: THREE.Group;
  private previewMeshGroup: THREE.Group;
  private trafficManager: TrafficManager;

  // Lighting
  private sunLight: THREE.DirectionalLight;
  private hemiLight: THREE.HemisphereLight;
  private ambientLight: THREE.AmbientLight;

  // Camera choreo
  private targetLookAt: THREE.Vector3 = new THREE.Vector3(10, 0, 10);
  private currentLookAt: THREE.Vector3 = new THREE.Vector3(10, 0, 10);
  private cameraAngle: number = Math.PI / 4; // 45 deg isometric default
  private targetCameraAngle: number = Math.PI / 4;
  private cameraPitch: number = Math.atan(Math.SQRT1_2); // 35.264 deg true isometric
  private zoomLevel: number = 16;
  private targetZoom: number = 16;

  // Interaction
  private raycaster: THREE.Raycaster = new THREE.Raycaster();
  private mouseVec: THREE.Vector2 = new THREE.Vector2(-999, -999);
  private groundPlane: THREE.Plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  private hoveredTile: { x: number; z: number } | null = null;
  private gridSize: number = 20;
  private callbacks: SceneCallbacks;

  // Ghost preview state
  private activeGhostDefId: string | null = null;
  private activeGhostRotation: number = 0;
  private isGhostValid: boolean = true;

  // Drag pan
  private isDragging: boolean = false;
  private dragStartX: number = 0;
  private dragStartY: number = 0;
  private isRightDragging: boolean = false;

  constructor(container: HTMLElement, gridSize: number, callbacks: SceneCallbacks) {
    this.container = container;
    this.gridSize = gridSize;
    this.callbacks = callbacks;
    this.targetLookAt.set(gridSize / 2, 0, gridSize / 2);
    this.currentLookAt.copy(this.targetLookAt);

    // 1. Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#0c1322');
    this.scene.fog = new THREE.FogExp2('#0c1322', 0.012);

    // 2. Camera (Orthographic for true crisp Isometric perspective)
    const aspect = container.clientWidth / container.clientHeight;
    const frustum = this.zoomLevel;
    this.camera = new THREE.OrthographicCamera(
      (-frustum * aspect) / 2,
      (frustum * aspect) / 2,
      frustum / 2,
      -frustum / 2,
      -100,
      200
    );
    this.updateCameraTransform();

    // 3. WebGL Renderer
    this.renderer = new THREE.WebGLRenderer({
      powerPreference: 'high-performance',
      antialias: true,
      preserveDrawingBuffer: true, // For photo mode snapshots
    });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.container.appendChild(this.renderer.domElement);

    // Handle context loss gracefully
    this.renderer.domElement.addEventListener('webglcontextlost', (e) => {
      e.preventDefault();
      console.warn('WebGL Context Lost. Waiting for restoration...');
    });
    this.renderer.domElement.addEventListener('webglcontextrestored', () => {
      console.info('WebGL Context Restored.');
    });

    // 4. Groups
    this.terrainGroup = new THREE.Group();
    this.scene.add(this.terrainGroup);

    this.buildingsGroup = new THREE.Group();
    this.scene.add(this.buildingsGroup);

    this.cursorGroup = new THREE.Group();
    this.scene.add(this.cursorGroup);

    this.previewMeshGroup = new THREE.Group();
    this.scene.add(this.previewMeshGroup);

    this.trafficManager = new TrafficManager(this.scene);

    // 5. Lights
    this.ambientLight = new THREE.AmbientLight('#ffffff', 0.85);
    this.scene.add(this.ambientLight);

    this.hemiLight = new THREE.HemisphereLight('#bae6fd', '#334155', 0.75);
    this.scene.add(this.hemiLight);

    this.sunLight = new THREE.DirectionalLight('#fffbeb', 1.8);
    this.sunLight.position.set(30, 45, 20);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 0.5;
    this.sunLight.shadow.camera.far = 120;
    const shadowD = 24;
    this.sunLight.shadow.camera.left = -shadowD;
    this.sunLight.shadow.camera.right = shadowD;
    this.sunLight.shadow.camera.top = shadowD;
    this.sunLight.shadow.camera.bottom = -shadowD;
    this.sunLight.shadow.bias = -0.0005;
    this.scene.add(this.sunLight);

    // 6. Build placement cursor frame
    this.createCursorMesh();

    // 7. Event listeners
    this.bindEvents();

    // 8. Start loop
    this.lastTime = performance.now();
    this.renderLoop();
  }

  private createCursorMesh() {
    const cursorBox = new THREE.Group();

    // Outer frame corners
    const frameGeo = new THREE.BoxGeometry(0.98, 0.04, 0.98);
    const frameMat = getCachedMaterial('#38bdf8', {
      emissive: '#0284c7',
      emissiveIntensity: 0.6,
      transparent: true,
      opacity: 0.5,
    });
    const frame = new THREE.Mesh(frameGeo, frameMat);
    frame.position.y = 0.05;
    cursorBox.add(frame);

    this.cursorGroup.add(cursorBox);
    this.cursorGroup.visible = false;
  }

  public setTimeOfDay(time: TimeOfDay) {
    switch (time) {
      case 'day':
        this.scene.background = new THREE.Color('#0c1322');
        this.scene.fog = new THREE.FogExp2('#0c1322', 0.012);
        this.ambientLight.color.set('#ffffff');
        this.ambientLight.intensity = 0.85;
        this.hemiLight.color.set('#bae6fd');
        this.hemiLight.groundColor.set('#334155');
        this.hemiLight.intensity = 0.75;
        this.sunLight.color.set('#fffbeb');
        this.sunLight.intensity = 1.8;
        this.sunLight.position.set(30, 45, 20);
        break;

      case 'golden':
        this.scene.background = new THREE.Color('#1c1322');
        this.scene.fog = new THREE.FogExp2('#1c1322', 0.012);
        this.ambientLight.color.set('#fde68a');
        this.ambientLight.intensity = 0.8;
        this.hemiLight.color.set('#fcd34d');
        this.hemiLight.groundColor.set('#451a03');
        this.hemiLight.intensity = 0.8;
        this.sunLight.color.set('#fb923c');
        this.sunLight.intensity = 2.2;
        this.sunLight.position.set(45, 20, 15);
        break;

      case 'sunset':
        this.scene.background = new THREE.Color('#1a0b2e');
        this.scene.fog = new THREE.FogExp2('#1a0b2e', 0.014);
        this.ambientLight.color.set('#f472b6');
        this.ambientLight.intensity = 0.7;
        this.hemiLight.color.set('#ec4899');
        this.hemiLight.groundColor.set('#31103f');
        this.hemiLight.intensity = 0.7;
        this.sunLight.color.set('#f43f5e');
        this.sunLight.intensity = 1.9;
        this.sunLight.position.set(45, 12, 10);
        break;

      case 'night':
        this.scene.background = new THREE.Color('#030712');
        this.scene.fog = new THREE.FogExp2('#030712', 0.018);
        this.ambientLight.color.set('#38bdf8');
        this.ambientLight.intensity = 0.35;
        this.hemiLight.color.set('#1e293b');
        this.hemiLight.groundColor.set('#020617');
        this.hemiLight.intensity = 0.3;
        this.sunLight.color.set('#818cf8');
        this.sunLight.intensity = 0.6;
        this.sunLight.position.set(-20, 30, -20);
        break;

      case 'cyberpunk':
        this.scene.background = new THREE.Color('#050510');
        this.scene.fog = new THREE.FogExp2('#050510', 0.015);
        this.ambientLight.color.set('#00f0ff');
        this.ambientLight.intensity = 0.45;
        this.hemiLight.color.set('#ff007f');
        this.hemiLight.groundColor.set('#0a0a23');
        this.hemiLight.intensity = 0.55;
        this.sunLight.color.set('#00f0ff');
        this.sunLight.intensity = 1.2;
        this.sunLight.position.set(20, 30, 20);
        break;
    }
  }

  public rebuildTerrain(grid: TileData[][]) {
    while (this.terrainGroup.children.length > 0) {
      const child = this.terrainGroup.children[0];
      this.terrainGroup.remove(child);
    }

    for (let x = 0; x < grid.length; x++) {
      for (let z = 0; z < grid[0].length; z++) {
        const tile = grid[x][z];
        const tileMesh = createTerrainTileMesh(tile.terrain, x, z);
        this.terrainGroup.add(tileMesh);
      }
    }
  }

  public syncBuildings(grid: TileData[][]) {
    while (this.buildingsGroup.children.length > 0) {
      const child = this.buildingsGroup.children[0];
      this.buildingsGroup.remove(child);
    }

    for (let x = 0; x < grid.length; x++) {
      for (let z = 0; z < grid[0].length; z++) {
        const tile = grid[x][z];
        if (tile.building) {
          const b = tile.building;
          const def = BUILDING_DEFS[b.defId];
          if (!def) continue;

          let mesh: THREE.Group;
          if (b.defId === 'road') {
            mesh = createRoadMesh(tile.roadConnections || { north: false, south: false, east: false, west: false });
            mesh.position.set(b.x, 0, b.z);
          } else if (b.defId === 'bridge') {
            mesh = createBridgeMesh();
            mesh.position.set(b.x, 0, b.z);
            mesh.rotation.y = (b.rotation * Math.PI) / 2;
          } else {
            mesh = createBuildingMesh(b, def);
          }

          mesh.userData = { instanceId: b.instanceId, tileX: x, tileZ: z };
          this.buildingsGroup.add(mesh);
        }
      }
    }

    this.trafficManager.updateRoadNetwork(grid);
  }

  public setPreviewBuilding(defId: string | null, rotation: number = 0, isValid: boolean = true) {
    this.activeGhostDefId = defId;
    this.activeGhostRotation = rotation;
    this.isGhostValid = isValid;

    while (this.previewMeshGroup.children.length > 0) {
      this.previewMeshGroup.remove(this.previewMeshGroup.children[0]);
    }

    if (!defId) {
      this.previewMeshGroup.visible = false;
      return;
    }

    const def = BUILDING_DEFS[defId];
    if (!def) return;

    let ghostMesh: THREE.Group;
    if (def.id === 'road') {
      ghostMesh = createRoadMesh({ north: true, south: true, east: false, west: false });
    } else if (def.id === 'bridge') {
      ghostMesh = createBridgeMesh();
    } else {
      ghostMesh = createBuildingMesh(
        {
          instanceId: 'ghost',
          defId: def.id,
          x: 0,
          z: 0,
          rotation: 0,
          level: 1,
          placedAt: 0,
        },
        def
      );
    }

    // Ghost tint overlay
    const tintColor = isValid ? 0x38bdf8 : 0xef4444;
    ghostMesh.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.material = getCachedMaterial(tintColor, {
          transparent: true,
          opacity: 0.65,
          emissive: tintColor,
          emissiveIntensity: 0.3,
        });
      }
    });

    this.previewMeshGroup.add(ghostMesh);
    this.previewMeshGroup.visible = true;
    this.updatePreviewPosition();
  }

  private updatePreviewPosition() {
    if (!this.hoveredTile) {
      this.cursorGroup.visible = false;
      this.previewMeshGroup.visible = false;
      return;
    }

    const x = this.hoveredTile.x;
    const z = this.hoveredTile.z;

    this.cursorGroup.position.set(x, 0, z);
    this.cursorGroup.visible = true;

    // Adjust cursor frame color based on valid/invalid
    const frameMesh = this.cursorGroup.children[0]?.children[0] as THREE.Mesh | undefined;
    if (frameMesh) {
      frameMesh.material = getCachedMaterial(this.isGhostValid ? '#38bdf8' : '#ef4444', {
        emissive: this.isGhostValid ? '#0284c7' : '#b91c1c',
        emissiveIntensity: 0.6,
        transparent: true,
        opacity: 0.5,
      });
    }

    if (this.activeGhostDefId) {
      this.previewMeshGroup.position.set(x, 0, z);
      this.previewMeshGroup.rotation.y = (this.activeGhostRotation * Math.PI) / 2;
      this.previewMeshGroup.visible = true;
    }
  }

  // Camera choreo methods
  public rotateCamera(direction: 1 | -1) {
    this.targetCameraAngle += direction * (Math.PI / 2);
  }

  public zoom(delta: number) {
    this.targetZoom = Math.max(6, Math.min(36, this.targetZoom + delta));
  }

  public pan(dx: number, dz: number) {
    // Transform pan vector by camera angle
    const cos = Math.cos(this.cameraAngle);
    const sin = Math.sin(this.cameraAngle);
    const wx = dx * cos - dz * sin;
    const wz = dx * sin + dz * cos;

    this.targetLookAt.x = Math.max(0, Math.min(this.gridSize, this.targetLookAt.x + wx));
    this.targetLookAt.z = Math.max(0, Math.min(this.gridSize, this.targetLookAt.z + wz));
  }

  public resetCamera() {
    this.targetLookAt.set(this.gridSize / 2, 0, this.gridSize / 2);
    this.targetCameraAngle = Math.PI / 4;
    this.targetZoom = 16;
  }

  private updateCameraTransform() {
    const aspect = this.container.clientWidth / this.container.clientHeight;
    const f = this.zoomLevel;

    this.camera.left = (-f * aspect) / 2;
    this.camera.right = (f * aspect) / 2;
    this.camera.top = f / 2;
    this.camera.bottom = -f / 2;
    this.camera.updateProjectionMatrix();

    // Isometric orbit coordinates
    const distance = 40;
    const camX = this.currentLookAt.x + distance * Math.cos(this.cameraAngle) * Math.cos(this.cameraPitch);
    const camY = this.currentLookAt.y + distance * Math.sin(this.cameraPitch);
    const camZ = this.currentLookAt.z + distance * Math.sin(this.cameraAngle) * Math.cos(this.cameraPitch);

    this.camera.position.set(camX, camY, camZ);
    this.camera.lookAt(this.currentLookAt);
  }

  private bindEvents() {
    const el = this.renderer.domElement;

    // Pointer move for raycasting and hover
    el.addEventListener('pointermove', (e) => {
      const rect = el.getBoundingClientRect();
      this.mouseVec.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouseVec.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      if (this.isDragging) {
        const dx = e.clientX - this.dragStartX;
        const dy = e.clientY - this.dragStartY;
        this.dragStartX = e.clientX;
        this.dragStartY = e.clientY;

        if (this.isRightDragging || e.shiftKey || e.altKey) {
          // Rotate on right drag
          this.targetCameraAngle += dx * 0.008;
        } else {
          // Pan on drag
          const scale = this.zoomLevel * 0.0018;
          this.pan(-dx * scale, dy * scale);
        }
        return;
      }

      this.checkRaycast();
    });

    // Pointer down / drag tracking
    el.addEventListener('pointerdown', (e) => {
      if (e.button === 2 || e.button === 1 || e.shiftKey || e.altKey) {
        this.isDragging = true;
        this.isRightDragging = e.button === 2 || e.shiftKey;
        this.dragStartX = e.clientX;
        this.dragStartY = e.clientY;
      }
    });

    window.addEventListener('pointerup', () => {
      this.isDragging = false;
      this.isRightDragging = false;
    });

    // Prevent context menu on 3D canvas so right-drag works seamlessly
    el.addEventListener('contextmenu', (e) => e.preventDefault());

    // Left click on tile
    el.addEventListener('click', (e) => {
      if (this.hoveredTile && e.button === 0) {
        this.callbacks.onTileClick(this.hoveredTile);
      }
    });

    // Mouse wheel zoom
    el.addEventListener(
      'wheel',
      (e) => {
        e.preventDefault();
        this.zoom(e.deltaY * 0.015);
      },
      { passive: false }
    );

    // Window resize
    window.addEventListener('resize', this.onResize);
  }

  private onResize = () => {
    if (!this.container) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.renderer.setSize(w, h);
    this.updateCameraTransform();
  };

  private checkRaycast() {
    this.raycaster.setFromCamera(this.mouseVec, this.camera);
    const hitPoint = new THREE.Vector3();
    const hit = this.raycaster.ray.intersectPlane(this.groundPlane, hitPoint);

    if (hit) {
      const tx = Math.round(hitPoint.x);
      const tz = Math.round(hitPoint.z);

      if (tx >= 0 && tx < this.gridSize && tz >= 0 && tz < this.gridSize) {
        if (!this.hoveredTile || this.hoveredTile.x !== tx || this.hoveredTile.z !== tz) {
          this.hoveredTile = { x: tx, z: tz };
          this.callbacks.onTileHover(this.hoveredTile);
          this.updatePreviewPosition();
        }
        return;
      }
    }

    if (this.hoveredTile) {
      this.hoveredTile = null;
      this.callbacks.onTileHover(null);
      this.updatePreviewPosition();
    }
  }

  private renderLoop = () => {
    this.animFrameId = requestAnimationFrame(this.renderLoop);

    const now = performance.now();
    const delta = Math.min((now - this.lastTime) / 1000, 0.1);
    this.lastTime = now;

    // Smooth camera lerp
    this.currentLookAt.lerp(this.targetLookAt, 0.1);
    this.cameraAngle += (this.targetCameraAngle - this.cameraAngle) * 0.12;
    this.zoomLevel += (this.targetZoom - this.zoomLevel) * 0.15;
    this.updateCameraTransform();

    // Animate wind turbine blades
    this.buildingsGroup.traverse((obj) => {
      if (obj.name === 'turbine_rotor') {
        obj.rotation.z += 2.5 * delta;
      }
    });

    // Animate water waves
    const waveOffset = Math.sin(now * 0.003) * 0.02;
    this.terrainGroup.traverse((obj) => {
      if (obj.name === 'water_wave') {
        obj.position.y = 0.02 + waveOffset;
      }
    });

    // Traffic system tick
    this.trafficManager.tick(delta);

    this.renderer.render(this.scene, this.camera);
  };

  public getScreenshotDataUrl(): string {
    this.renderer.render(this.scene, this.camera);
    return this.renderer.domElement.toDataURL('image/png');
  }

  public destroy() {
    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
    window.removeEventListener('resize', this.onResize);
    this.trafficManager.clear();
    this.renderer.dispose();
    if (this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
  }
}
