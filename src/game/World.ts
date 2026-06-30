import * as THREE from 'three';
import { iconMaterial, makeTextSprite, texturedMaterial } from './Assets';
import type { Bounds, Interactable, MiniGameKind, StageDefinition, StageProp, StageWall, Vec2 } from './types';

export class World {
  readonly group = new THREE.Group();
  readonly colliders: Bounds[] = [];
  readonly interactables: Interactable[] = [];
  readonly stage: StageDefinition;
  readonly houseBounds: Bounds;
  readonly playerStart: Vec2;
  readonly cpuStart: Vec2;
  readonly treasurePosition: Vec2;

  private treasureLid: THREE.Group | null = null;
  private treasureGroup: THREE.Group | null = null;
  private treasureGlowGroup: THREE.Group | null = null;
  private treasureGlowLight: THREE.PointLight | null = null;
  private treasureGlowStrength = 0;
  private treasureOpened = false;
  private focusedInteractableId: string | null = null;
  private animatedObjects: THREE.Object3D[] = [];

  constructor(scene: THREE.Scene, stage: StageDefinition) {
    this.stage = stage;
    this.houseBounds = stage.bounds;
    this.playerStart = { ...stage.playerStart };
    this.cpuStart = { ...stage.cpuStart };
    this.treasurePosition = { ...stage.treasurePosition };
    this.group.name = `stage-${stage.id}-world`;
    scene.add(this.group);
    if (stage.id === 1) {
      this.buildHouse();
      this.buildFurniture();
    } else {
      this.buildConfiguredStage();
    }
    this.buildInteractables();
  }

  update(dt: number): void {
    const now = performance.now();
    for (const object of this.animatedObjects) {
      object.rotation.y += dt * 1.4;
      object.position.y = (object.userData.baseY as number) + Math.sin(now * 0.003 + object.id) * 0.08;
    }

    for (const item of this.interactables) {
      if (!item.object) {
        continue;
      }

      const focused = item.id === this.focusedInteractableId;
      const targetScale = focused ? 1.18 : 1;
      const currentScale = (item.object.userData.focusScale as number | undefined) ?? 1;
      const nextScale = THREE.MathUtils.lerp(currentScale, targetScale, dt * 10);
      item.object.userData.focusScale = nextScale;
      item.object.scale.setScalar(nextScale);

      const baseY = item.object.userData.baseY as number | undefined;
      if (baseY !== undefined) {
        const lift = focused ? 0.18 + Math.sin(now * 0.012) * 0.06 : 0;
        item.object.position.y = THREE.MathUtils.lerp(item.object.position.y, baseY + lift, dt * 10);
      }
    }

    if (this.treasureGlowGroup && this.treasureGlowLight) {
      const pulse = 0.88 + Math.sin(now * 0.004) * 0.12;
      this.treasureGlowGroup.visible = this.treasureGlowStrength > 0.02;
      this.treasureGlowGroup.scale.setScalar(0.92 + this.treasureGlowStrength * 0.42 + pulse * 0.08);
      this.treasureGlowLight.intensity = this.treasureGlowStrength * (0.65 + pulse * 0.35);
      this.treasureGlowGroup.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshBasicMaterial) {
          child.material.opacity = (0.08 + this.treasureGlowStrength * 0.22) * pulse;
        }
      });
    }
  }

  openTreasure(): void {
    this.treasureOpened = true;
    if (this.treasureGroup) {
      this.treasureGroup.visible = true;
      this.treasureGroup.scale.setScalar(1);
    }
    if (this.treasureLid) {
      this.treasureLid.rotation.x = -Math.PI * 0.42;
      this.treasureLid.position.y = 0.82;
      this.treasureLid.position.z = -0.18;
    }
    this.setTreasureGlowLevel(this.stage.hints.length);
  }

  setFocusedInteractable(id: string | null): void {
    this.focusedInteractableId = id;
  }

  setTreasureGlowLevel(hintsFound: number): void {
    const totalHints = Math.max(1, this.stage.hints.length);
    const revealWindow = Math.max(1, totalHints - this.stage.treasureRevealHints + 1);
    this.treasureGlowStrength = THREE.MathUtils.clamp(
      (hintsFound - this.stage.treasureRevealHints + 1) / revealWindow,
      0,
      1
    );
    if (this.treasureGroup) {
      const visible = this.treasureOpened || hintsFound >= this.stage.treasureRevealHints;
      this.treasureGroup.visible = visible;
      this.treasureGroup.scale.setScalar(visible ? THREE.MathUtils.lerp(0.72, 1, this.treasureGlowStrength) : 0.62);
    }
  }

  treasureSearchRadius(hintsFound: number): number {
    if (hintsFound < this.stage.treasurePromptHints) {
      return 0.55;
    }
    const progress = THREE.MathUtils.clamp(hintsFound / Math.max(1, this.stage.hints.length), 0, 1);
    return THREE.MathUtils.lerp(0.95, 2.05, progress);
  }

  private buildHouse(): void {
    const floorMaterial = texturedMaterial('floor_wood', 0xf4cf8a, { repeat: [4, 3] });
    const wallMaterial = texturedMaterial('wall_room', 0xfff0c6, { repeat: [3, 2] });

    const floor = new THREE.Mesh(new THREE.BoxGeometry(34, 0.12, 26), floorMaterial);
    floor.position.y = -0.08;
    floor.receiveShadow = true;
    this.group.add(floor);

    const roomTint = [
      { x: -12.25, z: 8, w: 8, d: 8.5, color: 0xfff3d9 },
      { x: -3.75, z: 8, w: 9, d: 8.5, color: 0xe8f8e1 },
      { x: 5.25, z: 8, w: 9, d: 8.5, color: 0xe3f2ff },
      { x: 13.25, z: 8, w: 7, d: 8.5, color: 0xdff8ff },
      { x: -11, z: -5, w: 11, d: 14.5, color: 0xffe9ef },
      { x: 0, z: -5, w: 11, d: 14.5, color: 0xeaf9ed },
      { x: 11, z: -5, w: 11, d: 14.5, color: 0xefe9ff }
    ];

    for (const room of roomTint) {
      const mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(room.w, room.d),
        new THREE.MeshBasicMaterial({ color: room.color, transparent: true, opacity: 0.32, side: THREE.DoubleSide })
      );
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.set(room.x, 0.005, room.z);
      this.group.add(mesh);
    }

    this.addWall(0, 13.1, 34.4, 0.32, wallMaterial, 'そとのかべ');
    this.addWall(0, -13.1, 34.4, 0.32, wallMaterial, 'そとのかべ');
    this.addWall(-17.1, 0, 0.32, 26.4, wallMaterial, 'そとのかべ');
    this.addWall(17.1, 0, 0.32, 26.4, wallMaterial, 'そとのかべ');

    this.addWall(-11.4, 2.55, 10.6, 0.24, wallMaterial, 'へやのかべ');
    this.addWall(11.4, 2.55, 10.6, 0.24, wallMaterial, 'へやのかべ');
    this.addWall(-6, 2.3, 0.24, 2.6, wallMaterial, 'へやのかべ');
    this.addWall(-6, 9.1, 0.24, 5.8, wallMaterial, 'へやのかべ');
    this.addWall(6, 2.3, 0.24, 2.6, wallMaterial, 'へやのかべ');
    this.addWall(6, 9.1, 0.24, 5.8, wallMaterial, 'へやのかべ');
    this.addWall(10.4, 9.1, 0.24, 5.8, wallMaterial, 'へやのかべ');
    this.addWall(0, -6.1, 0.24, 7.8, wallMaterial, 'へやのかべ');
    this.addWall(0, 2.05, 0.24, 1.2, wallMaterial, 'へやのかべ');
    this.addWall(-5.5, -9.5, 0.24, 5.4, wallMaterial, 'へやのかべ');
    this.addWall(5.5, -9.5, 0.24, 5.4, wallMaterial, 'へやのかべ');

    this.addRoomLabel('げんかん', -12.2, 10.3, '#fff4c6');
    this.addRoomLabel('リビング', -2.6, 10.4, '#dff7d4');
    this.addRoomLabel('キッチン', 5.5, 10.4, '#d9f0ff');
    this.addRoomLabel('おふろ', 13.3, 10.4, '#d9f8ff');
    this.addRoomLabel('こどもべや', -6.5, -8.3, '#ffe1ec');
    this.addRoomLabel('あそびべや', 0, -8.4, '#e2f9d7');
    this.addRoomLabel('ねしつ', 8.5, -8.4, '#ede4ff');
    this.addRoomLabel('そうこ', 0, -11.8, '#fff0c6');
  }

  private buildConfiguredStage(): void {
    const { stage } = this;
    const width = stage.bounds.xMax - stage.bounds.xMin;
    const depth = stage.bounds.zMax - stage.bounds.zMin;
    const centerX = (stage.bounds.xMin + stage.bounds.xMax) / 2;
    const centerZ = (stage.bounds.zMin + stage.bounds.zMax) / 2;
    const floorMaterial = stage.floorTexture
      ? texturedMaterial(stage.floorTexture, stage.floorColor, {
          repeat: stage.floorRepeat ?? [10, 8]
        })
      : new THREE.MeshStandardMaterial({ color: stage.floorColor, roughness: 0.86 });
    const wallMaterial = new THREE.MeshStandardMaterial({ color: stage.wallColor, roughness: 0.72 });

    const floor = new THREE.Mesh(new THREE.BoxGeometry(width, 0.12, depth), floorMaterial);
    floor.position.set(centerX, -0.08, centerZ);
    floor.receiveShadow = true;
    this.group.add(floor);

    for (const area of stage.areas ?? []) {
      const areaOpacity = area.opacity ?? (area.texture ? 0.96 : 0.38);
      const areaMaterial = area.texture
        ? texturedMaterial(area.texture, area.color, {
            repeat: area.repeat ?? [2, 2],
            transparent: areaOpacity < 1,
            roughness: 0.86
          })
        : new THREE.MeshBasicMaterial({ color: area.color, transparent: true, opacity: areaOpacity });
      areaMaterial.side = THREE.DoubleSide;
      areaMaterial.opacity = areaOpacity;
      areaMaterial.transparent = areaOpacity < 1;

      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(area.width, area.depth), areaMaterial);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.set(area.x, 0.006, area.z);
      mesh.receiveShadow = true;
      this.group.add(mesh);
    }

    this.addBox('そとのさく', centerX, stage.bounds.zMax + 0.15, width + 0.6, 0.3, stage.boundaryHeight, wallMaterial, true, stage.boundaryHeight / 2);
    this.addBox('そとのさく', centerX, stage.bounds.zMin - 0.15, width + 0.6, 0.3, stage.boundaryHeight, wallMaterial, true, stage.boundaryHeight / 2);
    this.addBox('そとのさく', stage.bounds.xMin - 0.15, centerZ, 0.3, depth + 0.6, stage.boundaryHeight, wallMaterial, true, stage.boundaryHeight / 2);
    this.addBox('そとのさく', stage.bounds.xMax + 0.15, centerZ, 0.3, depth + 0.6, stage.boundaryHeight, wallMaterial, true, stage.boundaryHeight / 2);

    for (const wall of stage.walls ?? []) {
      this.addConfiguredWall(wall, wallMaterial);
    }

    for (const prop of stage.props ?? []) {
      this.addConfiguredProp(prop);
    }

    for (const plant of stage.plants ?? []) {
      this.addPlant(plant.x, plant.z);
    }

    for (const label of stage.labels ?? []) {
      this.addRoomLabel(label.text, label.x, label.z, label.background);
    }

    this.addTreasureChest();
  }

  private buildFurniture(): void {
    const sofa = texturedMaterial('sofa_fabric', 0x7dbff2);
    const rug = texturedMaterial('rug_playful', 0xffb45c);
    const blanket = texturedMaterial('bed_blanket', 0x9bd6ff);
    const shelf = texturedMaterial('bookshelf_front', 0xd85a51);
    const kitchen = texturedMaterial('kitchen_tile', 0xd5f5ff, { repeat: [2, 1] });
    const wood = texturedMaterial('floor_wood', 0xc89458, { repeat: [2, 1] });

    this.addBox('ソファ', -3.1, 6.2, 3, 1.2, 0.82, sofa);
    this.addBox('ソファのせ', -3.1, 6.85, 3.1, 0.28, 1.22, sofa, true, 0.61);
    this.addBox('テレビ', 4.7, 9.03, 2.2, 0.24, 1.25, new THREE.MeshStandardMaterial({ color: 0x29343b, roughness: 0.45 }));
    this.addBox('テーブル', 0.1, 5.45, 2.3, 1.35, 0.48, wood);
    this.addBox('はこ', 3.7, 3.45, 1.1, 1.1, 0.78, new THREE.MeshStandardMaterial({ color: 0xe3ab63, roughness: 0.7 }));
    this.addBox('ベッド', 7.2, -7.15, 3.5, 2.2, 0.7, blanket);
    this.addBox('つくえ', -4.7, -7.65, 2.25, 1.1, 0.78, wood);
    this.addBox('あかいほんだな', -11.8, -5.1, 0.8, 3.25, 2.25, shelf);
    this.addBox('れいぞうこ', 10.65, 7.55, 1.25, 1.05, 2.15, new THREE.MeshStandardMaterial({ color: 0xe7fbff, roughness: 0.55 }));
    this.addBox('キッチンだい', 8.65, 3.05, 4.2, 1.12, 1.02, kitchen);
    this.addBox('くつばこ', -15.1, 10.6, 1.7, 0.7, 0.92, wood);
    this.addBox('おもちゃばこ', -13.9, -1.2, 1.5, 1.15, 0.72, new THREE.MeshStandardMaterial({ color: 0xffcf4d, roughness: 0.72 }));
    this.addBox('まるいクッション', -1.4, -7.7, 1.4, 1.4, 0.36, new THREE.MeshStandardMaterial({ color: 0x9be8cf, roughness: 0.8 }), false);
    this.addBox('つみきテーブル', 2.2, -4.4, 2.0, 1.2, 0.58, wood);
    this.addBox('バスタブ', 14.1, 5.25, 2.2, 1.15, 0.68, new THREE.MeshStandardMaterial({ color: 0xd8f8ff, roughness: 0.5 }));
    this.addBox('せんめんだい', 15.2, 8.25, 1.0, 1.3, 0.92, kitchen);
    this.addBox('そうこのはこA', -2.2, -11.25, 1.45, 1.2, 0.85, new THREE.MeshStandardMaterial({ color: 0xd7a562, roughness: 0.74 }));
    this.addBox('そうこのはこB', 2.15, -11.05, 1.35, 1.05, 0.76, new THREE.MeshStandardMaterial({ color: 0xc98b52, roughness: 0.78 }));
    this.addBox('ナイトテーブル', 13.4, -7.9, 1.0, 1.0, 0.62, wood);

    this.addSofaDetails(-3.1, 6.2, sofa);
    this.addBedDetails(7.2, -7.15, blanket, wood);
    this.addBookshelfDetails(-11.8, -5.1);
    this.addKitchenDetails(8.65, 3.05);

    const rugMesh = new THREE.Mesh(new THREE.CylinderGeometry(2.35, 2.35, 0.05, 48), rug);
    rugMesh.position.set(-0.3, 0.025, 5.5);
    rugMesh.receiveShadow = true;
    this.group.add(rugMesh);

    this.addPlant(4.7, 3.3);
    this.addPlant(-14.5, -9.35);
    this.addPlant(13.8, -10.2);
    this.addTreasureChest();
  }

  private buildInteractables(): void {
    for (const hint of this.stage.hints) {
      this.addHint(hint.id, hint.position, hint.text);
    }

    for (const spot of this.stage.miniSpots) {
      this.addMiniSpot(spot.id, spot.position, spot.kind, spot.label);
    }

    this.interactables.push({
      id: `treasure-stage-${this.stage.id}`,
      type: 'treasure',
      position: this.treasurePosition,
      radius: 2.05,
      label: 'たからばこ',
      done: false,
      plays: 0
    });
  }

  private addConfiguredWall(wall: StageWall, fallbackMaterial: THREE.Material): void {
    const material = wall.color
      ? new THREE.MeshStandardMaterial({ color: wall.color, roughness: 0.72 })
      : fallbackMaterial;
    this.addBox(wall.label, wall.x, wall.z, wall.width, wall.depth, wall.height ?? 1.55, material, true, (wall.height ?? 1.55) / 2);
  }

  private addConfiguredProp(prop: StageProp): void {
    const material = prop.texture
      ? texturedMaterial(prop.texture, prop.color, { repeat: [2, 1] })
      : new THREE.MeshStandardMaterial({ color: prop.color, roughness: 0.72 });
    const shape = prop.shape ?? 'box';

    if (
      shape === 'box' &&
      prop.rotationX === undefined &&
      prop.rotationY === undefined &&
      prop.rotationZ === undefined
    ) {
      this.addBox(
        prop.label,
        prop.x,
        prop.z,
        prop.width,
        prop.depth,
        prop.height,
        material,
        prop.collider ?? true,
        prop.y ?? prop.height / 2
      );
      return;
    }

    const mesh = new THREE.Mesh(this.createPropGeometry(prop), material);
    mesh.position.set(prop.x, prop.y ?? prop.height / 2, prop.z);
    mesh.rotation.set(prop.rotationX ?? 0, prop.rotationY ?? 0, prop.rotationZ ?? 0);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.name = prop.label;
    this.group.add(mesh);

    if (prop.collider ?? true) {
      this.colliders.push({
        xMin: prop.x - prop.width / 2,
        xMax: prop.x + prop.width / 2,
        zMin: prop.z - prop.depth / 2,
        zMax: prop.z + prop.depth / 2,
        label: prop.label
      });
    }
  }

  private createPropGeometry(prop: StageProp): THREE.BufferGeometry {
    const segments = prop.segments ?? 24;
    if (prop.shape === 'cylinder') {
      const geometry = new THREE.CylinderGeometry(0.5, 0.5, prop.height, segments);
      geometry.scale(prop.width, 1, prop.depth);
      return geometry;
    }
    if (prop.shape === 'sphere') {
      const geometry = new THREE.SphereGeometry(0.5, segments, Math.max(8, Math.floor(segments / 2)));
      geometry.scale(prop.width, prop.height, prop.depth);
      return geometry;
    }
    if (prop.shape === 'cone') {
      const geometry = new THREE.ConeGeometry(0.5, prop.height, segments);
      geometry.scale(prop.width, 1, prop.depth);
      return geometry;
    }
    return new THREE.BoxGeometry(prop.width, prop.height, prop.depth);
  }

  private addWall(
    x: number,
    z: number,
    width: number,
    depth: number,
    material: THREE.Material,
    label: string
  ): void {
    this.addBox(label, x, z, width, depth, 2.45, material, true, 1.22);
  }

  private addBox(
    label: string,
    x: number,
    z: number,
    width: number,
    depth: number,
    height: number,
    material: THREE.Material,
    collider = true,
    y = height / 2
  ): THREE.Mesh {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.name = label;
    this.group.add(mesh);

    if (collider) {
      this.colliders.push({
        xMin: x - width / 2,
        xMax: x + width / 2,
        zMin: z - depth / 2,
        zMax: z + depth / 2,
        label
      });
    }

    return mesh;
  }

  private addDetailBox(
    label: string,
    x: number,
    z: number,
    width: number,
    depth: number,
    height: number,
    material: THREE.Material,
    y = height / 2
  ): THREE.Mesh {
    return this.addBox(label, x, z, width, depth, height, material, false, y);
  }

  private addSofaDetails(x: number, z: number, fabric: THREE.Material): void {
    const trim = new THREE.MeshStandardMaterial({ color: 0x4e95c7, roughness: 0.78 });
    const pillowWarm = new THREE.MeshStandardMaterial({ color: 0xffef9d, roughness: 0.82 });
    const pillowMint = new THREE.MeshStandardMaterial({ color: 0x9be8cf, roughness: 0.82 });

    this.addDetailBox('sofa-left-arm', x - 1.58, z, 0.22, 1.28, 0.72, trim, 0.54);
    this.addDetailBox('sofa-right-arm', x + 1.58, z, 0.22, 1.28, 0.72, trim, 0.54);
    this.addDetailBox('sofa-seat-seam-left', x - 0.52, z - 0.03, 0.04, 1.06, 0.05, trim, 0.86);
    this.addDetailBox('sofa-seat-seam-right', x + 0.52, z - 0.03, 0.04, 1.06, 0.05, trim, 0.86);
    this.addDetailBox('sofa-pillow-left', x - 0.72, z + 0.52, 0.52, 0.14, 0.38, pillowWarm, 1.05);
    this.addDetailBox('sofa-pillow-right', x + 0.72, z + 0.52, 0.52, 0.14, 0.38, pillowMint, 1.05);
    this.addDetailBox('sofa-front-roll', x, z - 0.64, 2.72, 0.08, 0.18, fabric, 0.8);
  }

  private addBedDetails(x: number, z: number, blanket: THREE.Material, wood: THREE.Material): void {
    const pillow = new THREE.MeshStandardMaterial({ color: 0xfffbef, roughness: 0.72 });
    const rail = new THREE.MeshStandardMaterial({ color: 0x9b6b42, roughness: 0.7 });

    this.addDetailBox('bed-headboard', x, z - 1.18, 3.72, 0.18, 0.78, rail, 0.58);
    this.addDetailBox('bed-footboard', x, z + 1.12, 3.62, 0.14, 0.42, rail, 0.46);
    this.addDetailBox('bed-pillow-left', x - 0.82, z - 0.72, 0.82, 0.48, 0.18, pillow, 0.86);
    this.addDetailBox('bed-pillow-right', x + 0.82, z - 0.72, 0.82, 0.48, 0.18, pillow, 0.86);
    this.addDetailBox('bed-blanket-fold', x, z + 0.35, 3.26, 0.12, 0.12, blanket, 0.84);
    this.addDetailBox('bed-side-drawer', x + 2.08, z + 0.24, 0.52, 1.04, 0.24, wood, 0.32);
  }

  private addBookshelfDetails(x: number, z: number): void {
    const frame = new THREE.MeshStandardMaterial({ color: 0xb83f38, roughness: 0.66 });
    const shelfWood = new THREE.MeshStandardMaterial({ color: 0x7a2d26, roughness: 0.7 });
    const colors = [0xffcf4d, 0x68c7e8, 0x9be8cf, 0xf36f72, 0x7c75d6, 0xff8d54];

    this.addDetailBox('bookshelf-front-left-frame', x + 0.45, z - 1.52, 0.16, 0.12, 2.28, frame, 1.15);
    this.addDetailBox('bookshelf-front-right-frame', x + 0.45, z + 1.52, 0.16, 0.12, 2.28, frame, 1.15);
    for (const y of [0.55, 1.13, 1.72]) {
      this.addDetailBox('bookshelf-shelf', x + 0.48, z, 0.14, 2.72, 0.08, shelfWood, y);
    }

    for (let row = 0; row < 3; row += 1) {
      for (let i = 0; i < 7; i += 1) {
        const bookHeight = 0.38 + ((row + i) % 3) * 0.08;
        const book = new THREE.Mesh(
          new THREE.BoxGeometry(0.16, bookHeight, 0.18),
          new THREE.MeshStandardMaterial({ color: colors[(row * 3 + i) % colors.length], roughness: 0.76 })
        );
        book.position.set(x + 0.55, 0.38 + row * 0.58 + bookHeight / 2, z - 1.08 + i * 0.36);
        book.castShadow = true;
        book.receiveShadow = true;
        this.group.add(book);
      }
    }
  }

  private addKitchenDetails(x: number, z: number): void {
    const counterTop = new THREE.MeshStandardMaterial({ color: 0xfff6df, roughness: 0.48 });
    const handle = new THREE.MeshStandardMaterial({ color: 0xd3a54b, metalness: 0.18, roughness: 0.42 });
    const sink = new THREE.MeshStandardMaterial({ color: 0xbfe8ee, metalness: 0.08, roughness: 0.34 });

    this.addDetailBox('kitchen-counter-top', x, z, 4.34, 1.2, 0.08, counterTop, 1.07);
    this.addDetailBox('kitchen-sink', x - 1.25, z - 0.08, 0.82, 0.42, 0.05, sink, 1.13);
    for (const offset of [-1.3, 0, 1.3]) {
      this.addDetailBox('kitchen-handle', x + offset, z - 0.6, 0.52, 0.04, 0.06, handle, 0.7);
    }
  }

  private addPlant(x: number, z: number): void {
    const pot = new THREE.Mesh(
      new THREE.CylinderGeometry(0.34, 0.42, 0.5, 16),
      new THREE.MeshStandardMaterial({ color: 0xd47755, roughness: 0.75 })
    );
    pot.position.set(x, 0.25, z);
    pot.castShadow = true;
    this.group.add(pot);

    const leaves = new THREE.Mesh(
      new THREE.SphereGeometry(0.62, 18, 12),
      new THREE.MeshStandardMaterial({ color: 0x63b66a, roughness: 0.8 })
    );
    leaves.position.set(x, 0.85, z);
    leaves.castShadow = true;
    this.group.add(leaves);

    this.colliders.push({ xMin: x - 0.55, xMax: x + 0.55, zMin: z - 0.55, zMax: z + 0.55, label: 'かんようしょくぶつ' });
  }

  private createStarGeometry(outerRadius: number, innerRadius: number): THREE.ShapeGeometry {
    const shape = new THREE.Shape();
    for (let i = 0; i < 10; i += 1) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = -Math.PI / 2 + (i * Math.PI) / 5;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      if (i === 0) {
        shape.moveTo(x, y);
      } else {
        shape.lineTo(x, y);
      }
    }
    shape.closePath();
    return new THREE.ShapeGeometry(shape);
  }

  private addTreasureChest(): void {
    const chestMaterial = texturedMaterial('treasure_chest', 0xffc93a, { metalness: 0.08, roughness: 0.48 });
    const goldMaterial = new THREE.MeshStandardMaterial({ color: 0xffd65b, metalness: 0.28, roughness: 0.34 });
    const darkMaterial = new THREE.MeshStandardMaterial({ color: 0x3c291f, roughness: 0.72 });
    const starMaterial = new THREE.MeshBasicMaterial({ color: 0xfff3a1, side: THREE.DoubleSide });
    const group = new THREE.Group();
    group.name = `${this.stage.shortTitle}の かくれた たから`;
    group.position.set(this.treasurePosition.x, 0.05, this.treasurePosition.z);
    group.rotation.y = Math.PI / 2;
    group.visible = false;

    const addPart = (
      parent: THREE.Group,
      geometry: THREE.BufferGeometry,
      material: THREE.Material,
      position: [number, number, number],
      rotation?: [number, number, number]
    ): THREE.Mesh => {
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(position[0], position[1], position[2]);
      if (rotation) {
        mesh.rotation.set(rotation[0], rotation[1], rotation[2]);
      }
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      parent.add(mesh);
      return mesh;
    };

    addPart(group, new THREE.BoxGeometry(0.96, 0.48, 0.58), chestMaterial, [0, 0.3, 0]);
    addPart(group, new THREE.BoxGeometry(1.02, 0.08, 0.64), goldMaterial, [0, 0.55, 0]);
    addPart(group, new THREE.BoxGeometry(1.02, 0.08, 0.64), goldMaterial, [0, 0.08, 0]);
    addPart(group, new THREE.BoxGeometry(0.08, 0.56, 0.66), goldMaterial, [-0.38, 0.32, 0]);
    addPart(group, new THREE.BoxGeometry(0.08, 0.56, 0.66), goldMaterial, [0.38, 0.32, 0]);

    const lidGroup = new THREE.Group();
    lidGroup.position.set(0, 0.62, 0);
    addPart(lidGroup, new THREE.BoxGeometry(1.02, 0.22, 0.64), chestMaterial, [0, 0.01, 0]);
    addPart(lidGroup, new THREE.BoxGeometry(0.9, 0.12, 0.54), chestMaterial, [0, 0.16, 0]);
    addPart(lidGroup, new THREE.BoxGeometry(1.08, 0.08, 0.7), goldMaterial, [0, 0.26, 0]);
    addPart(lidGroup, new THREE.BoxGeometry(0.08, 0.34, 0.72), goldMaterial, [-0.38, 0.1, 0]);
    addPart(lidGroup, new THREE.BoxGeometry(0.08, 0.34, 0.72), goldMaterial, [0.38, 0.1, 0]);
    group.add(lidGroup);

    const lock = addPart(group, new THREE.BoxGeometry(0.24, 0.3, 0.05), goldMaterial, [0, 0.42, -0.33]);
    lock.castShadow = true;
    const keyHole = addPart(group, new THREE.BoxGeometry(0.06, 0.12, 0.055), darkMaterial, [0, 0.36, -0.365]);
    keyHole.castShadow = false;
    const star = addPart(
      group,
      this.createStarGeometry(0.085, 0.04),
      starMaterial,
      [0, 0.49, -0.368],
      [0, Math.PI, 0]
    );
    star.castShadow = false;

    const studGeometry = new THREE.SphereGeometry(0.045, 12, 8);
    for (const sx of [-0.5, 0.5]) {
      for (const sy of [0.14, 0.5, 0.72]) {
        addPart(group, studGeometry, goldMaterial, [sx, sy, -0.32]);
      }
    }

    this.treasureLid = lidGroup;

    const glow = new THREE.PointLight(0xffd75e, 0.45, 3);
    glow.position.set(0, 0.8, 0);
    group.add(glow);
    this.group.add(group);
    this.treasureGroup = group;
    this.addTreasureHintGlow();
  }

  private addHint(id: string, position: Vec2, hintText: string): void {
    const group = new THREE.Group();
    group.position.set(position.x, 0.92, position.z);
    group.userData.baseY = 0.92;

    const card = new THREE.Mesh(new THREE.PlaneGeometry(0.72, 0.72), iconMaterial('hint_card', 0xfff4a8));
    card.castShadow = true;
    group.add(card);

    const haloRing = new THREE.Mesh(
      new THREE.RingGeometry(0.44, 0.76, 48),
      new THREE.MeshBasicMaterial({
        color: 0xfff0a8,
        transparent: true,
        opacity: 0.48,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      })
    );
    haloRing.position.z = -0.02;
    group.add(haloRing);

    const halo = new THREE.PointLight(0xffef96, 1.7, 4.2);
    halo.position.set(0, 0.2, 0);
    group.add(halo);

    this.group.add(group);
    this.animatedObjects.push(group);
    this.interactables.push({
      id,
      type: 'hint',
      position,
      radius: 1.2,
      label: 'ヒント',
      done: false,
      plays: 0,
      hintText,
      object: group
    });
  }

  private addMiniSpot(id: string, position: Vec2, miniGameKind: MiniGameKind, label: string): void {
    const group = new THREE.Group();
    group.position.set(position.x, 0.16, position.z);
    group.userData.baseY = 0.16;

    const stand = new THREE.Mesh(
      new THREE.CylinderGeometry(0.52, 0.62, 0.18, 24),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.58 })
    );
    stand.castShadow = true;
    stand.receiveShadow = true;
    group.add(stand);

    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.66, 1.02, 48),
      new THREE.MeshBasicMaterial({
        color: 0xffd65b,
        transparent: true,
        opacity: 0.38,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.03;
    group.add(ring);

    const coin = new THREE.Mesh(new THREE.PlaneGeometry(0.72, 0.72), iconMaterial('coin', 0xffd34d));
    coin.position.y = 0.72;
    coin.userData.baseY = 0.72;
    coin.castShadow = true;
    group.add(coin);

    const halo = new THREE.PointLight(0xffd65b, 1.2, 3.5);
    halo.position.set(0, 1.05, 0);
    group.add(halo);

    this.group.add(group);
    this.animatedObjects.push(coin);
    this.interactables.push({
      id,
      type: 'minigame',
      position,
      radius: 1.65,
      label: `${label}のゲーム`,
      done: false,
      plays: 0,
      miniGameKind,
      object: group
    });
  }

  private addRoomLabel(text: string, x: number, z: number, background: string): void {
    const sprite = makeTextSprite(text, '#173642', background);
    sprite.position.set(x, 2.25, z);
    this.group.add(sprite);
  }

  private addTreasureHintGlow(): void {
    const glowGroup = new THREE.Group();
    glowGroup.position.set(this.treasurePosition.x, 0.08, this.treasurePosition.z);

    const outer = new THREE.Mesh(
      new THREE.RingGeometry(0.62, 1.42, 64),
      new THREE.MeshBasicMaterial({
        color: 0xffd65b,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      })
    );
    outer.rotation.x = -Math.PI / 2;
    glowGroup.add(outer);

    const inner = new THREE.Mesh(
      new THREE.RingGeometry(0.18, 0.54, 48),
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      })
    );
    inner.rotation.x = -Math.PI / 2;
    inner.position.y = 0.02;
    glowGroup.add(inner);

    this.treasureGlowLight = new THREE.PointLight(0xffd65b, 0, 5);
    this.treasureGlowLight.position.set(0, 0.9, 0);
    glowGroup.add(this.treasureGlowLight);
    glowGroup.visible = false;
    this.treasureGlowGroup = glowGroup;
    this.group.add(glowGroup);
  }
}
