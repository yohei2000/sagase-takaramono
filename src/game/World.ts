import * as THREE from 'three';
import { iconMaterial, makeTextSprite, texturedMaterial } from './Assets';
import type { Bounds, Interactable, MiniGameKind, Vec2 } from './types';

export class World {
  readonly group = new THREE.Group();
  readonly colliders: Bounds[] = [];
  readonly interactables: Interactable[] = [];
  readonly houseBounds: Bounds = { xMin: -12.65, xMax: 12.65, zMin: -9.65, zMax: 9.65 };
  readonly playerStart: Vec2 = { x: -10.2, z: 7.2 };
  readonly cpuStart: Vec2 = { x: 8.8, z: -7.2 };
  readonly treasurePosition: Vec2 = { x: -12.1, z: -5.1 };

  private treasureLid: THREE.Mesh | null = null;
  private treasureGroup: THREE.Group | null = null;
  private treasureGlowGroup: THREE.Group | null = null;
  private treasureGlowLight: THREE.PointLight | null = null;
  private treasureGlowStrength = 0;
  private focusedInteractableId: string | null = null;
  private animatedObjects: THREE.Object3D[] = [];

  constructor(scene: THREE.Scene) {
    this.group.name = 'house-world';
    scene.add(this.group);
    this.buildHouse();
    this.buildFurniture();
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
    if (this.treasureLid) {
      this.treasureLid.rotation.x = -Math.PI * 0.42;
      this.treasureLid.position.y = 0.82;
      this.treasureLid.position.z = -0.18;
    }
    this.setTreasureGlowLevel(6);
  }

  setFocusedInteractable(id: string | null): void {
    this.focusedInteractableId = id;
  }

  setTreasureGlowLevel(hintsFound: number): void {
    this.treasureGlowStrength = THREE.MathUtils.clamp(hintsFound / 6, 0, 1);
  }

  private buildHouse(): void {
    const floorMaterial = texturedMaterial('floor_wood', 0xf4cf8a, { repeat: [7, 6] });
    const wallMaterial = texturedMaterial('wall_room', 0xfff0c6, { repeat: [4, 2] });

    const floor = new THREE.Mesh(new THREE.BoxGeometry(26, 0.12, 20), floorMaterial);
    floor.position.y = -0.08;
    floor.receiveShadow = true;
    this.group.add(floor);

    const roomTint = [
      { x: -9.5, z: 5.5, w: 7, d: 8.5, color: 0xfff3d9 },
      { x: 0, z: 5.5, w: 12, d: 8.5, color: 0xe8f8e1 },
      { x: 9.5, z: 5.5, w: 7, d: 8.5, color: 0xe3f2ff },
      { x: -6.5, z: -4.5, w: 13, d: 11, color: 0xffe9ef },
      { x: 6.5, z: -4.5, w: 13, d: 11, color: 0xefe9ff }
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

    this.addWall(0, 10.1, 26.4, 0.32, wallMaterial, 'そとのかべ');
    this.addWall(0, -10.1, 26.4, 0.32, wallMaterial, 'そとのかべ');
    this.addWall(-13.1, 0, 0.32, 20.4, wallMaterial, 'そとのかべ');
    this.addWall(13.1, 0, 0.32, 20.4, wallMaterial, 'そとのかべ');

    this.addWall(-7.5, 1, 11, 0.24, wallMaterial, 'へやのかべ');
    this.addWall(7.5, 1, 11, 0.24, wallMaterial, 'へやのかべ');
    this.addWall(-6, 2.3, 0.24, 2.6, wallMaterial, 'へやのかべ');
    this.addWall(-6, 8.1, 0.24, 3.8, wallMaterial, 'へやのかべ');
    this.addWall(6, 2.3, 0.24, 2.6, wallMaterial, 'へやのかべ');
    this.addWall(6, 8.1, 0.24, 3.8, wallMaterial, 'へやのかべ');
    this.addWall(0, -6.1, 0.24, 7.8, wallMaterial, 'へやのかべ');
    this.addWall(0, 0.45, 0.24, 1.1, wallMaterial, 'へやのかべ');

    this.addRoomLabel('げんかん', -9.5, 8.1, '#fff4c6');
    this.addRoomLabel('リビング', 0, 8.2, '#dff7d4');
    this.addRoomLabel('キッチン', 9.2, 8.2, '#d9f0ff');
    this.addRoomLabel('こどもべや', -6.5, -8.3, '#ffe1ec');
    this.addRoomLabel('ねしつ', 6.5, -8.4, '#ede4ff');
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

    const rugMesh = new THREE.Mesh(new THREE.CylinderGeometry(2.35, 2.35, 0.05, 48), rug);
    rugMesh.position.set(-0.3, 0.025, 5.5);
    rugMesh.receiveShadow = true;
    this.group.add(rugMesh);

    this.addPlant(4.7, 3.3);
    this.addTreasureChest();
  }

  private buildInteractables(): void {
    const hintTexts = [
      'たからは こどもべやの ちかく',
      'ほんが たくさん あるところ',
      'うしろを しらべてみよう',
      'あかい ほんだなの そば',
      'かべの ちかくに かくれているよ',
      'ちいさな はこの かたちが みえるかも'
    ];

    this.addHint('hint-genkan', { x: -9.5, z: 6.8 }, hintTexts[0]);
    this.addHint('hint-living', { x: -0.6, z: 4.1 }, hintTexts[1]);
    this.addHint('hint-kitchen', { x: 11.2, z: 4.7 }, hintTexts[2]);
    this.addHint('hint-desk', { x: -3.5, z: -6.45 }, hintTexts[3]);
    this.addHint('hint-bed', { x: 8.85, z: -8.45 }, hintTexts[4]);
    this.addHint('hint-bookshelf', { x: -10.45, z: -3.1 }, hintTexts[5]);

    this.addMiniSpot('mini-living', { x: 1.85, z: 6.3 }, 'match', 'おなじ え');
    this.addMiniSpot('mini-kitchen', { x: 9.15, z: 4.45 }, 'timing', 'きらきら');
    this.addMiniSpot('mini-genkan', { x: -10.7, z: 8.55 }, 'count', 'かず');
    this.addMiniSpot('mini-bedroom', { x: 4.65, z: -8.45 }, 'match', 'おなじ え');
    this.addMiniSpot('mini-desk', { x: -6.25, z: -8.55 }, 'timing', 'きらきら');

    this.interactables.push({
      id: 'treasure-bookshelf',
      type: 'treasure',
      position: this.treasurePosition,
      radius: 1.75,
      label: 'たからばこ',
      done: false,
      plays: 0
    });
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

  private addTreasureChest(): void {
    const chestMaterial = texturedMaterial('treasure_chest', 0xffc93a, { metalness: 0.08, roughness: 0.48 });
    const group = new THREE.Group();
    group.position.set(this.treasurePosition.x, 0.05, this.treasurePosition.z);
    group.rotation.y = Math.PI / 2;

    const base = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.5, 0.52), chestMaterial);
    base.position.y = 0.28;
    base.castShadow = true;
    base.receiveShadow = true;
    group.add(base);

    this.treasureLid = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.22, 0.56), chestMaterial);
    this.treasureLid.position.y = 0.66;
    this.treasureLid.castShadow = true;
    group.add(this.treasureLid);

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
