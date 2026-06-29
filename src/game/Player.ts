import * as THREE from 'three';
import { resolveMove } from './Collision';
import type { Bounds, InputState, Vec2 } from './types';

type RigBones = {
  hips: THREE.Bone;
  spine: THREE.Bone;
  chest: THREE.Bone;
  neck: THREE.Bone;
  head: THREE.Bone;
  leftUpperArm: THREE.Bone;
  leftLowerArm: THREE.Bone;
  leftHand: THREE.Bone;
  rightUpperArm: THREE.Bone;
  rightLowerArm: THREE.Bone;
  rightHand: THREE.Bone;
  leftUpperLeg: THREE.Bone;
  leftLowerLeg: THREE.Bone;
  leftFoot: THREE.Bone;
  rightUpperLeg: THREE.Bone;
  rightLowerLeg: THREE.Bone;
  rightFoot: THREE.Bone;
  leftPigtail: THREE.Bone;
  rightPigtail: THREE.Bone;
};

export class Player {
  readonly group: THREE.Group;
  readonly radius = 0.38;
  private readonly speed = 4.2;
  private readonly bones: RigBones;
  private readonly skeleton: THREE.Skeleton;
  private strideTime = 0;
  private moveBlend = 0;

  position: Vec2;

  constructor(scene: THREE.Scene, start: Vec2) {
    this.position = { ...start };
    this.group = new THREE.Group();
    this.group.position.set(start.x, 0, start.z);

    const material = (
      color: THREE.ColorRepresentation,
      roughness = 0.72,
      metalness = 0.02
    ): THREE.MeshStandardMaterial =>
      new THREE.MeshStandardMaterial({
        color,
        roughness,
        metalness,
        flatShading: true
      });

    const skinMaterial = material(0xffd7bc, 0.68);
    const shirtMaterial = material(0xf3d13e, 0.78);
    const shirtShadowMaterial = material(0xdbad25, 0.82);
    const skirtMaterial = material(0xfff6e5, 0.7);
    const skirtShadowMaterial = material(0xf0dcc2, 0.78);
    const hairMaterial = material(0x221d27, 0.56);
    const hairHighlightMaterial = material(0x3b2b38, 0.62);
    const bootMaterial = material(0x3b2b1f, 0.64);
    const soleMaterial = material(0x1f1714, 0.76);
    const eyeMaterial = material(0x20222a, 0.52);
    const mouthMaterial = material(0xd85a5e, 0.62);
    const blushMaterial = material(0xf29c9c, 0.74);
    const ribbonMaterial = material(0xf05d67, 0.5);
    const collarMaterial = material(0xfffbf1, 0.72);
    const shadowMaterial = new THREE.MeshBasicMaterial({
      color: 0x20333a,
      transparent: true,
      opacity: 0.18,
      depthWrite: false
    });

    const addMesh = (
      parent: THREE.Object3D,
      geometry: THREE.BufferGeometry,
      meshMaterial: THREE.Material,
      position: [number, number, number],
      rotation: [number, number, number] = [0, 0, 0],
      scale: [number, number, number] = [1, 1, 1]
    ): THREE.Mesh => {
      const mesh = new THREE.Mesh(geometry, meshMaterial);
      mesh.position.set(position[0], position[1], position[2]);
      mesh.rotation.set(rotation[0], rotation[1], rotation[2]);
      mesh.scale.set(scale[0], scale[1], scale[2]);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      parent.add(mesh);
      return mesh;
    };

    const addCapsule = (
      parent: THREE.Object3D,
      radius: number,
      length: number,
      meshMaterial: THREE.Material,
      position: [number, number, number],
      rotation: [number, number, number] = [0, 0, 0],
      scale: [number, number, number] = [1, 1, 1]
    ): THREE.Mesh =>
      addMesh(parent, new THREE.CapsuleGeometry(radius, length, 4, 8), meshMaterial, position, rotation, scale);

    const addLowPolySphere = (
      parent: THREE.Object3D,
      radius: number,
      meshMaterial: THREE.Material,
      position: [number, number, number],
      scale: [number, number, number] = [1, 1, 1]
    ): THREE.Mesh =>
      addMesh(parent, new THREE.DodecahedronGeometry(radius, 1), meshMaterial, position, [0, 0, 0], scale);

    const groundShadow = addMesh(this.group, new THREE.CircleGeometry(0.56, 18), shadowMaterial, [0, 0.018, 0], [
      -Math.PI / 2,
      0,
      0
    ]);
    groundShadow.castShadow = false;
    groundShadow.receiveShadow = false;

    const rig = new THREE.Group();
    rig.name = 'player-low-poly-bone-rig';
    this.group.add(rig);

    const hips = new THREE.Bone();
    const spine = new THREE.Bone();
    const chest = new THREE.Bone();
    const neck = new THREE.Bone();
    const head = new THREE.Bone();
    const leftUpperArm = new THREE.Bone();
    const leftLowerArm = new THREE.Bone();
    const leftHand = new THREE.Bone();
    const rightUpperArm = new THREE.Bone();
    const rightLowerArm = new THREE.Bone();
    const rightHand = new THREE.Bone();
    const leftUpperLeg = new THREE.Bone();
    const leftLowerLeg = new THREE.Bone();
    const leftFoot = new THREE.Bone();
    const rightUpperLeg = new THREE.Bone();
    const rightLowerLeg = new THREE.Bone();
    const rightFoot = new THREE.Bone();
    const leftPigtail = new THREE.Bone();
    const rightPigtail = new THREE.Bone();

    hips.name = 'hips';
    spine.name = 'spine';
    chest.name = 'chest';
    neck.name = 'neck';
    head.name = 'head';
    leftUpperArm.name = 'leftUpperArm';
    leftLowerArm.name = 'leftLowerArm';
    leftHand.name = 'leftHand';
    rightUpperArm.name = 'rightUpperArm';
    rightLowerArm.name = 'rightLowerArm';
    rightHand.name = 'rightHand';
    leftUpperLeg.name = 'leftUpperLeg';
    leftLowerLeg.name = 'leftLowerLeg';
    leftFoot.name = 'leftFoot';
    rightUpperLeg.name = 'rightUpperLeg';
    rightLowerLeg.name = 'rightLowerLeg';
    rightFoot.name = 'rightFoot';
    leftPigtail.name = 'leftPigtail';
    rightPigtail.name = 'rightPigtail';

    hips.position.set(0, 0.62, 0);
    spine.position.set(0, 0.23, 0);
    chest.position.set(0, 0.35, 0);
    neck.position.set(0, 0.2, 0);
    head.position.set(0, 0.22, 0);
    leftUpperArm.position.set(-0.36, 0.14, 0);
    leftLowerArm.position.set(-0.04, -0.34, 0);
    leftHand.position.set(0, -0.28, 0);
    rightUpperArm.position.set(0.36, 0.14, 0);
    rightLowerArm.position.set(0.04, -0.34, 0);
    rightHand.position.set(0, -0.28, 0);
    leftUpperLeg.position.set(-0.16, -0.05, 0);
    leftLowerLeg.position.set(0, -0.35, 0);
    leftFoot.position.set(0, -0.27, 0.07);
    rightUpperLeg.position.set(0.16, -0.05, 0);
    rightLowerLeg.position.set(0, -0.35, 0);
    rightFoot.position.set(0, -0.27, 0.07);
    leftPigtail.position.set(-0.36, -0.07, 0);
    rightPigtail.position.set(0.36, -0.07, 0);

    rig.add(hips);
    hips.add(spine, leftUpperLeg, rightUpperLeg);
    spine.add(chest);
    chest.add(neck, leftUpperArm, rightUpperArm);
    neck.add(head);
    head.add(leftPigtail, rightPigtail);
    leftUpperArm.add(leftLowerArm);
    leftLowerArm.add(leftHand);
    rightUpperArm.add(rightLowerArm);
    rightLowerArm.add(rightHand);
    leftUpperLeg.add(leftLowerLeg);
    leftLowerLeg.add(leftFoot);
    rightUpperLeg.add(rightLowerLeg);
    rightLowerLeg.add(rightFoot);

    this.bones = {
      hips,
      spine,
      chest,
      neck,
      head,
      leftUpperArm,
      leftLowerArm,
      leftHand,
      rightUpperArm,
      rightLowerArm,
      rightHand,
      leftUpperLeg,
      leftLowerLeg,
      leftFoot,
      rightUpperLeg,
      rightLowerLeg,
      rightFoot,
      leftPigtail,
      rightPigtail
    };
    this.skeleton = new THREE.Skeleton([
      hips,
      spine,
      chest,
      neck,
      head,
      leftUpperArm,
      leftLowerArm,
      leftHand,
      rightUpperArm,
      rightLowerArm,
      rightHand,
      leftUpperLeg,
      leftLowerLeg,
      leftFoot,
      rightUpperLeg,
      rightLowerLeg,
      rightFoot,
      leftPigtail,
      rightPigtail
    ]);
    this.group.userData.boneRig = { root: hips, skeleton: this.skeleton, bones: this.bones };

    // Body core: faceted shapes attached to bones so future animation clips can target the rig.
    addMesh(hips, new THREE.CylinderGeometry(0.44, 0.56, 0.36, 10, 1, false), skirtMaterial, [0, -0.02, 0]);
    addMesh(hips, new THREE.CylinderGeometry(0.5, 0.57, 0.08, 10, 1, false), skirtShadowMaterial, [
      0,
      -0.19,
      0
    ]);
    addMesh(spine, new THREE.CylinderGeometry(0.32, 0.42, 0.58, 10, 1, false), shirtMaterial, [
      0,
      0.16,
      0
    ]);
    addMesh(chest, new THREE.CylinderGeometry(0.38, 0.34, 0.18, 10, 1, false), shirtShadowMaterial, [
      0,
      -0.1,
      0
    ]);
    addMesh(chest, new THREE.BoxGeometry(0.38, 0.08, 0.08), collarMaterial, [0, 0.08, 0.31], [
      0,
      0,
      0
    ]);
    addMesh(chest, new THREE.BoxGeometry(0.14, 0.16, 0.06), ribbonMaterial, [0, -0.02, 0.35], [
      0,
      0,
      Math.PI / 4
    ]);

    // Legs and feet.
    for (const [side, upperLeg, lowerLeg, foot] of [
      [-1, leftUpperLeg, leftLowerLeg, leftFoot],
      [1, rightUpperLeg, rightLowerLeg, rightFoot]
    ] as const) {
      addCapsule(upperLeg, 0.075, 0.28, skinMaterial, [0, -0.17, 0]);
      addCapsule(lowerLeg, 0.08, 0.24, bootMaterial, [0, -0.12, 0]);
      addMesh(foot, new THREE.BoxGeometry(0.2, 0.09, 0.34), soleMaterial, [0, 0, 0.08], [
        0.06,
        side * 0.03,
        0
      ]);
      addMesh(foot, new THREE.BoxGeometry(0.18, 0.08, 0.16), bootMaterial, [0, 0.04, -0.08]);
    }

    // Arms, cuffs, and hands.
    for (const [side, upperArm, lowerArm, hand] of [
      [-1, leftUpperArm, leftLowerArm, leftHand],
      [1, rightUpperArm, rightLowerArm, rightHand]
    ] as const) {
      addCapsule(upperArm, 0.078, 0.3, shirtMaterial, [side * 0.03, -0.17, 0]);
      addMesh(upperArm, new THREE.CylinderGeometry(0.1, 0.1, 0.08, 8), collarMaterial, [
        side * 0.04,
        -0.32,
        0
      ]);
      addCapsule(lowerArm, 0.063, 0.25, skinMaterial, [0, -0.14, 0]);
      addLowPolySphere(hand, 0.09, skinMaterial, [0, -0.02, 0], [0.95, 0.9, 1]);
    }

    // Head, face, and hair are geometry-only: no texture decals.
    addLowPolySphere(head, 0.34, skinMaterial, [0, 0.02, 0], [0.94, 1.02, 0.92]);
    addMesh(
      head,
      new THREE.SphereGeometry(0.355, 12, 6, 0, Math.PI * 2, 0, Math.PI * 0.58),
      hairMaterial,
      [0, 0.04, 0],
      [0, 0, 0],
      [1.04, 0.92, 1.02]
    );

    for (const [x, z, rotZ] of [
      [-0.18, 0.29, 0.28],
      [0.02, 0.33, -0.08],
      [0.2, 0.29, -0.28],
      [-0.18, -0.29, -0.28],
      [0.02, -0.33, 0.08],
      [0.2, -0.29, 0.28]
    ] as const) {
      addCapsule(head, 0.044, 0.18, hairMaterial, [x, 0.15, z], [0.18, 0, rotZ], [1, 0.9, 1]);
    }

    const addFace = (z: number, yaw: number): void => {
      const faceRoot = new THREE.Group();
      faceRoot.position.set(0, 0, z);
      faceRoot.rotation.y = yaw;
      head.add(faceRoot);
      addMesh(faceRoot, new THREE.BoxGeometry(0.055, 0.09, 0.018), eyeMaterial, [-0.11, 0.06, 0.01]);
      addMesh(faceRoot, new THREE.BoxGeometry(0.055, 0.09, 0.018), eyeMaterial, [0.11, 0.06, 0.01]);
      addMesh(faceRoot, new THREE.BoxGeometry(0.12, 0.026, 0.018), mouthMaterial, [0, -0.09, 0.01]);
      const leftBlush = addMesh(faceRoot, new THREE.CircleGeometry(0.045, 10), blushMaterial, [-0.21, -0.04, 0.014]);
      const rightBlush = addMesh(faceRoot, new THREE.CircleGeometry(0.045, 10), blushMaterial, [0.21, -0.04, 0.014]);
      leftBlush.castShadow = false;
      rightBlush.castShadow = false;
    };
    addFace(0.315, 0);
    addFace(-0.315, Math.PI);

    for (const [side, pigtail] of [
      [-1, leftPigtail],
      [1, rightPigtail]
    ] as const) {
      addLowPolySphere(pigtail, 0.2, hairMaterial, [side * 0.06, -0.05, 0], [0.8, 1.16, 0.88]);
      addLowPolySphere(pigtail, 0.16, hairHighlightMaterial, [side * 0.13, -0.26, 0], [0.74, 1.12, 0.82]);
      addCapsule(pigtail, 0.058, 0.22, hairMaterial, [side * 0.18, -0.43, 0], [0, 0, side * 0.18]);
      addMesh(pigtail, new THREE.BoxGeometry(0.11, 0.12, 0.07), ribbonMaterial, [side * -0.03, 0.09, 0.22], [
        0,
        0.2,
        side * 0.55
      ]);
      addMesh(pigtail, new THREE.BoxGeometry(0.11, 0.12, 0.07), ribbonMaterial, [side * -0.03, 0.09, -0.22], [
        0,
        -0.2,
        side * 0.55
      ]);
    }

    this.animateRig(0, false);
    scene.add(this.group);
  }

  update(dt: number, input: InputState, cameraYaw: number, colliders: Bounds[], houseBounds: Bounds): void {
    const direction = new THREE.Vector2(0, 0);
    if (input.forward) direction.y += 1;
    if (input.back) direction.y -= 1;
    if (input.left) direction.x -= 1;
    if (input.right) direction.x += 1;

    const moving = direction.lengthSq() > 0;
    this.strideTime += dt * (moving ? 8.8 : 2.15);
    this.moveBlend = THREE.MathUtils.lerp(this.moveBlend, moving ? 1 : 0, 1 - Math.exp(-dt * 9));

    if (moving) {
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

    this.animateRig(dt, moving);
    this.group.position.set(this.position.x, 0, this.position.z);
  }

  private animateRig(dt: number, moving: boolean): void {
    const walk = this.moveBlend;
    const idle = 1 - walk;
    const stride = Math.sin(this.strideTime);
    const stepPeak = Math.abs(Math.cos(this.strideTime));
    const idleWave = Math.sin(this.strideTime * 0.72);
    const idleSway = Math.sin(this.strideTime * 0.48);
    const lean = moving ? -0.06 : 0;

    this.bones.hips.position.y = 0.62 + stepPeak * 0.025 * walk + idleWave * 0.012 * idle;
    this.bones.hips.rotation.set(lean, 0, idleSway * 0.025 * idle);
    this.bones.spine.rotation.set(0.025 * idleWave * idle, 0, stride * 0.035 * walk);
    this.bones.chest.rotation.set(0.02 * idleWave * idle, 0, -stride * 0.055 * walk);
    this.bones.neck.rotation.set(-lean * 0.4, 0, 0);
    this.bones.head.rotation.set(0.035 * idleWave * idle, 0.05 * idleSway * idle, -stride * 0.025 * walk);

    this.bones.leftUpperLeg.rotation.set(stride * 0.42 * walk, 0, -0.035);
    this.bones.rightUpperLeg.rotation.set(-stride * 0.42 * walk, 0, 0.035);
    this.bones.leftLowerLeg.rotation.set(Math.max(0, -stride) * 0.56 * walk, 0, 0);
    this.bones.rightLowerLeg.rotation.set(Math.max(0, stride) * 0.56 * walk, 0, 0);
    this.bones.leftFoot.rotation.set(Math.max(0, stride) * -0.28 * walk, 0, 0.02);
    this.bones.rightFoot.rotation.set(Math.max(0, -stride) * -0.28 * walk, 0, -0.02);

    this.bones.leftUpperArm.rotation.set(-0.12 - stride * 0.36 * walk, 0, -0.28 - idleSway * 0.03 * idle);
    this.bones.rightUpperArm.rotation.set(-0.12 + stride * 0.36 * walk, 0, 0.28 + idleSway * 0.03 * idle);
    this.bones.leftLowerArm.rotation.set(-0.22 + Math.max(0, stride) * 0.22 * walk, 0, -0.08);
    this.bones.rightLowerArm.rotation.set(-0.22 + Math.max(0, -stride) * 0.22 * walk, 0, 0.08);
    this.bones.leftHand.rotation.set(0, 0, -0.08 + Math.sin(this.strideTime * 1.6) * 0.04);
    this.bones.rightHand.rotation.set(0, 0, 0.08 - Math.sin(this.strideTime * 1.6) * 0.04);

    const hairLag = Math.sin(this.strideTime - 0.5) * 0.12 * walk + idleWave * 0.045 * idle;
    this.bones.leftPigtail.rotation.set(hairLag, 0, -0.12 + hairLag * 0.35);
    this.bones.rightPigtail.rotation.set(hairLag, 0, 0.12 - hairLag * 0.35);

    if (dt === 0) {
      this.bones.leftUpperLeg.rotation.x = 0;
      this.bones.rightUpperLeg.rotation.x = 0;
      this.bones.leftLowerLeg.rotation.x = 0;
      this.bones.rightLowerLeg.rotation.x = 0;
    }
  }
}
