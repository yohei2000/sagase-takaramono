import * as THREE from 'three';
import { resolveMove } from './Collision';
import { iconMaterial, texturedMaterial } from './Assets';
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

    const skinMaterial = texturedMaterial('player_skin', 0xffdcc9, { roughness: 0.66 });
    const shirtMaterial = texturedMaterial('player_shirt', 0xf3d43e, { roughness: 0.74 });
    const skirtMaterial = texturedMaterial('player_skirt', 0xfff6f0, { roughness: 0.68 });
    const hairMaterial = texturedMaterial('player_hair', 0x241f28, { roughness: 0.48 });
    const bootMaterial = texturedMaterial('player_boots', 0x372719, { roughness: 0.58 });
    const faceMaterial = iconMaterial('player_face', 0xffdcc9);
    const ribbonMaterial = new THREE.MeshStandardMaterial({ color: 0xf05d67, roughness: 0.52 });
    const collarMaterial = new THREE.MeshStandardMaterial({ color: 0xfffbf1, roughness: 0.72 });
    const soleMaterial = new THREE.MeshStandardMaterial({ color: 0x201714, roughness: 0.7 });
    const shadowMaterial = new THREE.MeshBasicMaterial({
      color: 0x20333a,
      transparent: true,
      opacity: 0.18,
      depthWrite: false
    });

    const addMesh = (
      geometry: THREE.BufferGeometry,
      material: THREE.Material,
      position: [number, number, number],
      rotation?: [number, number, number],
      scale?: [number, number, number]
    ): THREE.Mesh => {
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(position[0], position[1], position[2]);
      if (rotation) {
        mesh.rotation.set(rotation[0], rotation[1], rotation[2]);
      }
      if (scale) {
        mesh.scale.set(scale[0], scale[1], scale[2]);
      }
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.group.add(mesh);
      return mesh;
    };

    const addCapsule = (
      radius: number,
      length: number,
      material: THREE.Material,
      position: [number, number, number],
      rotation?: [number, number, number],
      scale?: [number, number, number]
    ): THREE.Mesh =>
      addMesh(new THREE.CapsuleGeometry(radius, length, 8, 18), material, position, rotation, scale);

    const addSphere = (
      radius: number,
      material: THREE.Material,
      position: [number, number, number],
      scale?: [number, number, number]
    ): THREE.Mesh =>
      addMesh(new THREE.SphereGeometry(radius, 28, 18), material, position, undefined, scale);

    const groundShadow = addMesh(new THREE.CircleGeometry(0.54, 40), shadowMaterial, [0, 0.018, 0], [
      -Math.PI / 2,
      0,
      0
    ]);
    groundShadow.castShadow = false;
    groundShadow.receiveShadow = false;

    // Body.
    addCapsule(0.3, 0.28, shirtMaterial, [0, 0.98, 0], undefined, [1.05, 1, 0.86]);
    addMesh(new THREE.CylinderGeometry(0.43, 0.55, 0.3, 32), skirtMaterial, [0, 0.62, 0]);
    addMesh(new THREE.CylinderGeometry(0.38, 0.5, 0.08, 32), collarMaterial, [0, 1.24, 0]);

    // Legs and boots.
    for (const x of [-0.19, 0.19]) {
      addCapsule(0.07, 0.28, skinMaterial, [x, 0.36, 0]);
      addCapsule(0.085, 0.22, bootMaterial, [x, 0.16, 0]);
      addMesh(new THREE.BoxGeometry(0.22, 0.06, 0.32), soleMaterial, [x, 0.045, 0.03]);
    }

    // Arms with a slight open pose.
    addCapsule(0.075, 0.34, shirtMaterial, [-0.43, 1.02, 0], [0, 0, -0.42]);
    addCapsule(0.075, 0.34, shirtMaterial, [0.43, 1.02, 0], [0, 0, 0.42]);
    addCapsule(0.065, 0.24, skinMaterial, [-0.68, 0.84, 0], [0, 0, -0.25]);
    addCapsule(0.065, 0.24, skinMaterial, [0.68, 0.84, 0], [0, 0, 0.25]);
    addSphere(0.085, skinMaterial, [-0.79, 0.71, 0], [1.05, 0.9, 1]);
    addSphere(0.085, skinMaterial, [0.79, 0.71, 0], [1.05, 0.9, 1]);

    // Head and face decals are real planes anchored to the head, not screen-facing sprites.
    addSphere(0.35, skinMaterial, [0, 1.53, 0], [0.94, 1.02, 0.9]);
    const frontFace = addMesh(new THREE.PlaneGeometry(0.55, 0.5), faceMaterial, [0, 1.51, 0.36]);
    frontFace.renderOrder = 9;
    frontFace.castShadow = false;
    const rearFace = addMesh(new THREE.PlaneGeometry(0.55, 0.5), faceMaterial, [0, 1.51, -0.36], [0, Math.PI, 0]);
    rearFace.renderOrder = 9;
    rearFace.castShadow = false;

    // Hair cap, bangs, and twin pigtails.
    const hairCapGeometry = new THREE.SphereGeometry(0.365, 32, 18, 0, Math.PI * 2, 0, Math.PI * 0.48);
    addMesh(hairCapGeometry, hairMaterial, [0, 1.72, 0], undefined, [1.02, 0.82, 0.98]);

    for (const z of [0.31, -0.31]) {
      addCapsule(0.055, 0.26, hairMaterial, [-0.18, 1.72, z], [0.18, 0, 0.35], [1, 0.9, 1]);
      addCapsule(0.055, 0.28, hairMaterial, [0.04, 1.72, z], [0.08, 0, -0.15], [1, 0.95, 1]);
      addCapsule(0.05, 0.22, hairMaterial, [0.23, 1.69, z], [-0.08, 0, -0.32], [1, 0.9, 1]);
    }

    for (const side of [-1, 1]) {
      addSphere(0.23, hairMaterial, [side * 0.54, 1.52, 0], [0.86, 1.18, 0.9]);
      addSphere(0.19, hairMaterial, [side * 0.66, 1.28, 0], [0.78, 1.22, 0.86]);
      addCapsule(0.07, 0.34, hairMaterial, [side * 0.72, 1.16, 0], [0, 0, side * 0.22]);
      addSphere(0.075, ribbonMaterial, [side * 0.45, 1.73, 0.27], [1, 0.86, 1]);
      addSphere(0.075, ribbonMaterial, [side * 0.45, 1.73, -0.27], [1, 0.86, 1]);
      addMesh(new THREE.BoxGeometry(0.13, 0.13, 0.06), ribbonMaterial, [side * 0.37, 1.68, 0.34], [
        0,
        0,
        side * 0.32
      ]);
      addMesh(new THREE.BoxGeometry(0.13, 0.13, 0.06), ribbonMaterial, [side * 0.37, 1.68, -0.34], [
        0,
        0,
        side * 0.32
      ]);
    }

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
