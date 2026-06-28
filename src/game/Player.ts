import * as THREE from 'three';
import { resolveMove } from './Collision';
import { spriteMaterial } from './Assets';
import type { Bounds, InputState, Vec2 } from './types';

export class Player {
  readonly group: THREE.Group;
  readonly radius = 0.38;
  private readonly speed = 4.2;

  position: Vec2;

  constructor(scene: THREE.Scene, start: Vec2) {
    this.position = { ...start };
    this.group = new THREE.Group();
    this.group.position.set(start.x, 0, start.z);

    const skinMaterial = new THREE.MeshStandardMaterial({ color: 0xffdcc9, roughness: 0.72 });
    const hairMaterial = new THREE.MeshStandardMaterial({ color: 0x302832, roughness: 0.82 });
    const hairShadowMaterial = new THREE.MeshStandardMaterial({ color: 0x241f28, roughness: 0.86 });
    const shirtMaterial = new THREE.MeshStandardMaterial({ color: 0xf3e26f, roughness: 0.78 });
    const skirtMaterial = new THREE.MeshStandardMaterial({ color: 0xfff6f0, roughness: 0.7 });
    const bootMaterial = new THREE.MeshStandardMaterial({ color: 0x272632, roughness: 0.76 });
    const ribbonMaterial = new THREE.MeshStandardMaterial({ color: 0xf05d67, roughness: 0.62 });
    const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0x27232a });
    const blushMaterial = new THREE.MeshBasicMaterial({ color: 0xff9a9e, transparent: true, opacity: 0.86 });

    const addBox = (
      size: [number, number, number],
      position: [number, number, number],
      material: THREE.Material,
      rotation?: [number, number, number]
    ): THREE.Mesh => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(size[0], size[1], size[2]), material);
      mesh.position.set(position[0], position[1], position[2]);
      if (rotation) {
        mesh.rotation.set(rotation[0], rotation[1], rotation[2]);
      }
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.group.add(mesh);
      return mesh;
    };

    const addFaceDetails = (z: number): void => {
      addBox([0.13, 0.19, 0.018], [-0.18, 1.48, z], eyeMaterial);
      addBox([0.13, 0.19, 0.018], [0.18, 1.48, z], eyeMaterial);
      addBox([0.13, 0.07, 0.018], [-0.32, 1.35, z], blushMaterial);
      addBox([0.13, 0.07, 0.018], [0.32, 1.35, z], blushMaterial);
    };

    addBox([0.62, 0.58, 0.36], [0, 0.96, 0], shirtMaterial);
    addBox([0.78, 0.24, 0.44], [0, 0.58, 0], skirtMaterial);
    addBox([0.17, 0.5, 0.18], [-0.18, 0.25, 0], bootMaterial);
    addBox([0.17, 0.5, 0.18], [0.18, 0.25, 0], bootMaterial);

    addBox([0.5, 0.14, 0.14], [-0.55, 1.05, 0], skirtMaterial, [0, 0, 0.05]);
    addBox([0.5, 0.14, 0.14], [0.55, 1.05, 0], skirtMaterial, [0, 0, -0.05]);
    addBox([0.16, 0.14, 0.15], [-0.84, 1.03, 0], skinMaterial);
    addBox([0.16, 0.14, 0.15], [0.84, 1.03, 0], skinMaterial);

    addBox([0.84, 0.62, 0.58], [0, 1.54, 0], skinMaterial);
    addBox([0.9, 0.22, 0.64], [0, 1.81, -0.01], hairMaterial);
    addBox([0.92, 0.24, 0.16], [0, 1.66, -0.31], hairMaterial);
    addBox([0.92, 0.24, 0.16], [0, 1.66, 0.31], hairMaterial);
    addBox([0.18, 0.36, 0.62], [-0.43, 1.57, -0.01], hairShadowMaterial);
    addBox([0.18, 0.36, 0.62], [0.43, 1.57, -0.01], hairShadowMaterial);
    addBox([0.2, 0.28, 0.14], [-0.2, 1.62, -0.33], hairMaterial, [0, 0, 0.18]);
    addBox([0.2, 0.28, 0.14], [0.08, 1.63, -0.33], hairMaterial, [0, 0, -0.1]);
    addBox([0.18, 0.25, 0.13], [0.28, 1.65, -0.33], hairMaterial, [0, 0, -0.2]);
    addBox([0.2, 0.28, 0.14], [-0.2, 1.62, 0.33], hairMaterial, [0, 0, 0.18]);
    addBox([0.2, 0.28, 0.14], [0.08, 1.63, 0.33], hairMaterial, [0, 0, -0.1]);
    addBox([0.18, 0.25, 0.13], [0.28, 1.65, 0.33], hairMaterial, [0, 0, -0.2]);

    addFaceDetails(-0.3);
    addFaceDetails(0.3);

    addBox([0.24, 0.3, 0.3], [-0.64, 1.57, 0.01], hairMaterial);
    addBox([0.28, 0.28, 0.28], [-0.78, 1.4, 0.01], hairMaterial);
    addBox([0.22, 0.28, 0.24], [-0.66, 1.25, 0.01], hairShadowMaterial, [0, 0, -0.12]);
    addBox([0.24, 0.3, 0.3], [0.64, 1.57, 0.01], hairMaterial);
    addBox([0.28, 0.28, 0.28], [0.78, 1.4, 0.01], hairMaterial);
    addBox([0.22, 0.28, 0.24], [0.66, 1.25, 0.01], hairShadowMaterial, [0, 0, 0.12]);
    addBox([0.14, 0.17, 0.08], [-0.52, 1.76, -0.31], ribbonMaterial, [0, 0, 0.12]);
    addBox([0.14, 0.17, 0.08], [0.52, 1.76, -0.31], ribbonMaterial, [0, 0, -0.12]);

    const portrait = new THREE.Sprite(spriteMaterial('player_character', 0xffffff));
    portrait.position.set(0, 1, -0.02);
    portrait.scale.set(1.55, 2, 1);
    portrait.renderOrder = 8;
    this.group.add(portrait);

    scene.add(this.group);
  }

  update(dt: number, input: InputState, cameraYaw: number, colliders: Bounds[], houseBounds: Bounds): void {
    const direction = new THREE.Vector2(0, 0);
    if (input.forward) direction.y += 1;
    if (input.back) direction.y -= 1;
    if (input.left) direction.x -= 1;
    if (input.right) direction.x += 1;

    if (direction.lengthSq() > 0) {
      direction.normalize();
      const forward = new THREE.Vector2(Math.sin(cameraYaw), Math.cos(cameraYaw));
      const right = new THREE.Vector2(Math.cos(cameraYaw), -Math.sin(cameraYaw));
      const move = right.multiplyScalar(direction.x).add(forward.multiplyScalar(direction.y));
      const delta = { x: move.x * this.speed * dt, z: move.y * this.speed * dt };
      const next = resolveMove(this.position, delta, this.radius, colliders, houseBounds);
      const movedX = next.x - this.position.x;
      const movedZ = next.z - this.position.z;
      this.position = next;
      if (movedX * movedX + movedZ * movedZ > 0.0001) {
        this.group.rotation.y = Math.atan2(movedX, movedZ);
      }
    }

    this.group.position.set(this.position.x, 0, this.position.z);
  }
}
