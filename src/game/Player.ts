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
    const shirtMaterial = material(0xbcc8cc, 0.78);
    const shirtShadowMaterial = material(0xa5b2b8, 0.82);
    const skirtMaterial = material(0xb6c2c7, 0.7);
    const skirtShadowMaterial = material(0x96a3aa, 0.78);
    const hairMaterial = material(0x221d27, 0.56);
    const hairDeepMaterial = material(0x17131b, 0.52);
    const hairHighlightMaterial = material(0x3b2b38, 0.62);
    const hairTieMaterial = material(0x2c6f91, 0.58);
    const hatMaterial = material(0xffde45, 0.64);
    const hatBandMaterial = material(0xdcae19, 0.7);
    const hatRibbonMaterial = material(0x8d54d9, 0.58);
    const hatRibbonKnotMaterial = material(0x6f35b8, 0.62);
    const bootMaterial = material(0x3b2b1f, 0.64);
    const soleMaterial = material(0x1f1714, 0.76);
    const eyeMaterial = material(0x20222a, 0.52);
    const mouthMaterial = material(0xd85a5e, 0.62);
    const noseMaterial = material(0xefb69b, 0.7);
    const blushMaterial = material(0xf29c9c, 0.74);
    const collarMaterial = material(0xd3dcdf, 0.72);
    const backpackMaterial = material(0x75d8f7, 0.58);
    const backpackDarkMaterial = material(0x37a8d1, 0.64);
    const backpackEdgeMaterial = material(0x238db8, 0.58);
    const backpackStrapMaterial = material(0x2d86ac, 0.66);
    const backpackPadMaterial = material(0xe9fbff, 0.74);
    const faceHighlightMaterial = material(0xffffff, 0.54);
    const metalMaterial = material(0xd8eef5, 0.42, 0.2);
    const nameTagMaterial = material(0x29b65f, 0.64);
    const nameTagAccentMaterial = material(0xeafff0, 0.72);
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

    const createRoundedPanelGeometry = (
      width: number,
      height: number,
      depth: number,
      radius: number
    ): THREE.ExtrudeGeometry => {
      const x = -width / 2;
      const y = -height / 2;
      const r = Math.min(radius, width / 2, height / 2);
      const shape = new THREE.Shape();
      shape.moveTo(x + r, y);
      shape.lineTo(x + width - r, y);
      shape.quadraticCurveTo(x + width, y, x + width, y + r);
      shape.lineTo(x + width, y + height - r);
      shape.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
      shape.lineTo(x + r, y + height);
      shape.quadraticCurveTo(x, y + height, x, y + height - r);
      shape.lineTo(x, y + r);
      shape.quadraticCurveTo(x, y, x + r, y);
      const geometry = new THREE.ExtrudeGeometry(shape, {
        depth,
        bevelEnabled: false,
        curveSegments: 4
      });
      geometry.center();
      return geometry;
    };

    const createHatBrimGeometry = (
      outerX: number,
      outerZ: number,
      innerX: number,
      innerZ: number,
      thickness: number
    ): THREE.BufferGeometry => {
      const positions: number[] = [];
      const indices: number[] = [];
      const segments = 24;
      const innerTopY = thickness * 0.48;
      const outerTopY = -thickness * 0.12;
      const innerBottomY = -thickness * 0.32;
      const outerBottomY = -thickness * 0.84;

      for (let i = 0; i < segments; i += 1) {
        const theta = (Math.PI * 2 * i) / segments;
        const cos = Math.cos(theta);
        const sin = Math.sin(theta);
        positions.push(
          outerX * cos,
          outerTopY,
          outerZ * sin,
          innerX * cos,
          innerTopY,
          innerZ * sin,
          outerX * cos,
          outerBottomY,
          outerZ * sin,
          innerX * cos,
          innerBottomY,
          innerZ * sin
        );
      }

      for (let i = 0; i < segments; i += 1) {
        const next = (i + 1) % segments;
        const outerTop = i * 4;
        const innerTop = outerTop + 1;
        const outerBottom = outerTop + 2;
        const innerBottom = outerTop + 3;
        const nextOuterTop = next * 4;
        const nextInnerTop = nextOuterTop + 1;
        const nextOuterBottom = nextOuterTop + 2;
        const nextInnerBottom = nextOuterTop + 3;

        indices.push(
          outerTop,
          innerTop,
          nextOuterTop,
          innerTop,
          nextInnerTop,
          nextOuterTop,
          outerBottom,
          nextOuterBottom,
          innerBottom,
          innerBottom,
          nextInnerBottom,
          nextOuterBottom,
          outerTop,
          nextOuterTop,
          outerBottom,
          outerBottom,
          nextOuterTop,
          nextOuterBottom,
          innerTop,
          innerBottom,
          innerBottom,
          nextInnerTop,
          nextInnerBottom,
          nextInnerTop
        );
      }

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geometry.setIndex(indices);
      geometry.computeVertexNormals();
      return geometry;
    };

    const createRandoseruProfileGeometry = (
      width: number,
      height: number,
      depth: number,
      topRadius: number
    ): THREE.ExtrudeGeometry => {
      const x = -depth / 2;
      const y = -height / 2;
      const r = Math.min(topRadius, depth / 2, height / 2);
      const shape = new THREE.Shape();
      shape.moveTo(x, y);
      shape.lineTo(x + depth, y);
      shape.lineTo(x + depth, y + height - r);
      shape.quadraticCurveTo(x + depth, y + height, x + depth - r, y + height);
      shape.lineTo(x + r, y + height);
      shape.quadraticCurveTo(x, y + height, x, y + height - r);
      shape.lineTo(x, y);
      const geometry = new THREE.ExtrudeGeometry(shape, {
        depth: width,
        bevelEnabled: false,
        curveSegments: 5
      });
      geometry.center();
      return geometry;
    };

    const createRandoseruFlapGeometry = (width: number): THREE.BufferGeometry => {
      const positions: number[] = [];
      const indices: number[] = [];

      const profile: Array<[number, number]> = [
        [0.31, -0.34],
        [0.31, -0.46],
        [0.31, -0.57]
      ];

      const radius = 0.14;
      const centerY = 0.17;
      const centerZ = -0.57;
      for (let i = 1; i <= 6; i += 1) {
        const theta = (Math.PI / 2) * (i / 6);
        profile.push([centerY + Math.cos(theta) * radius, centerZ - Math.sin(theta) * radius]);
      }

      profile.push([-0.08, -0.71], [-0.31, -0.71], [-0.55, -0.695]);

      for (const [y, z] of profile) {
        positions.push(-width / 2, y, z, width / 2, y, z);
      }
      for (let i = 0; i < profile.length - 1; i += 1) {
        const a = i * 2;
        indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
      }

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geometry.setIndex(indices);
      geometry.computeVertexNormals();
      return geometry;
    };

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
    leftUpperArm.position.set(-0.255, 0.14, 0);
    leftLowerArm.position.set(-0.04, -0.34, 0);
    leftHand.position.set(0, -0.28, 0);
    rightUpperArm.position.set(0.255, 0.14, 0);
    rightLowerArm.position.set(0.04, -0.34, 0);
    rightHand.position.set(0, -0.28, 0);
    leftUpperLeg.position.set(-0.092, -0.05, 0);
    leftLowerLeg.position.set(0, -0.35, 0);
    leftFoot.position.set(0, -0.27, 0.07);
    rightUpperLeg.position.set(0.092, -0.05, 0);
    rightLowerLeg.position.set(0, -0.35, 0);
    rightFoot.position.set(0, -0.27, 0.07);
    leftPigtail.position.set(-0.285, -0.015, 0);
    rightPigtail.position.set(0.285, -0.015, 0);

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
    addMesh(hips, new THREE.CylinderGeometry(0.27, 0.36, 0.39, 10, 1, false), skirtMaterial, [0, -0.02, 0]);
    addMesh(hips, new THREE.CylinderGeometry(0.31, 0.38, 0.07, 10, 1, false), skirtShadowMaterial, [
      0,
      -0.19,
      0
    ]);
    addMesh(spine, new THREE.CylinderGeometry(0.185, 0.25, 0.62, 10, 1, false), shirtMaterial, [
      0,
      0.16,
      0
    ]);
    addMesh(chest, new THREE.CylinderGeometry(0.24, 0.21, 0.18, 10, 1, false), shirtShadowMaterial, [
      0,
      -0.1,
      0
    ]);
    addMesh(chest, new THREE.BoxGeometry(0.23, 0.07, 0.07), collarMaterial, [0, 0.08, 0.235], [
      0,
      0,
      0
    ]);
    addMesh(chest, createRoundedPanelGeometry(0.072, 0.135, 0.018, 0.016), nameTagMaterial, [0.112, -0.006, 0.303], [
      0,
      0,
      0.04
    ]);
    addMesh(chest, new THREE.BoxGeometry(0.042, 0.012, 0.012), nameTagAccentMaterial, [0.112, 0.026, 0.318], [
      0,
      0,
      0.04
    ]);
    addMesh(chest, createRandoseruProfileGeometry(0.48, 0.8, 0.42, 0.14), backpackDarkMaterial, [
      0,
      -0.17,
      -0.465
    ], [
      0,
      Math.PI / 2,
      0
    ]);
    addMesh(chest, createRandoseruFlapGeometry(0.5), backpackMaterial, [0, 0, 0]);
    addMesh(chest, new THREE.CapsuleGeometry(0.018, 0.34, 4, 8), backpackEdgeMaterial, [0, 0.31, -0.39], [
      0,
      0,
      Math.PI / 2
    ]);
    addMesh(chest, new THREE.CapsuleGeometry(0.03, 0.66, 4, 8), backpackEdgeMaterial, [-0.253, -0.16, -0.72], [
      0,
      0,
      0
    ]);
    addMesh(chest, new THREE.CapsuleGeometry(0.03, 0.66, 4, 8), backpackEdgeMaterial, [0.253, -0.16, -0.72], [
      0,
      0,
      0
    ]);
    addMesh(chest, new THREE.BoxGeometry(0.42, 0.052, 0.06), backpackEdgeMaterial, [0, -0.575, -0.68]);
    addMesh(chest, createRandoseruProfileGeometry(0.044, 0.62, 0.35, 0.11), backpackEdgeMaterial, [
      -0.265,
      -0.18,
      -0.515
    ], [
      0,
      Math.PI / 2,
      0
    ]);
    addMesh(chest, createRandoseruProfileGeometry(0.044, 0.62, 0.35, 0.11), backpackEdgeMaterial, [
      0.265,
      -0.18,
      -0.515
    ], [
      0,
      Math.PI / 2,
      0
    ]);
    addMesh(chest, new THREE.TorusGeometry(0.042, 0.009, 5, 10), metalMaterial, [-0.295, -0.03, -0.57], [
      0,
      Math.PI / 2,
      0
    ]);
    addMesh(chest, new THREE.TorusGeometry(0.042, 0.009, 5, 10), metalMaterial, [0.295, -0.03, -0.57], [
      0,
      Math.PI / 2,
      0
    ]);
    addCapsule(chest, 0.018, 0.15, backpackEdgeMaterial, [-0.14, 0.3, -0.305], [0, 0, 0]);
    addCapsule(chest, 0.018, 0.15, backpackEdgeMaterial, [0.14, 0.3, -0.305], [0, 0, 0]);
    addMesh(chest, new THREE.CapsuleGeometry(0.018, 0.25, 4, 8), backpackEdgeMaterial, [0, 0.38, -0.305], [
      0,
      0,
      Math.PI / 2
    ]);
    addMesh(chest, new THREE.CapsuleGeometry(0.031, 0.62, 4, 8), backpackStrapMaterial, [-0.17, -0.12, -0.035], [
      0.18,
      0.02,
      -0.04
    ]);
    addMesh(chest, new THREE.CapsuleGeometry(0.031, 0.62, 4, 8), backpackStrapMaterial, [0.17, -0.12, -0.035], [
      0.18,
      -0.02,
      0.04
    ]);
    addMesh(chest, new THREE.TorusGeometry(0.135, 0.013, 5, 16, Math.PI), backpackPadMaterial, [0, -0.08, -0.285], [
      0,
      0,
      Math.PI
    ]);

    // Legs and feet.
    for (const [side, upperLeg, lowerLeg, foot] of [
      [-1, leftUpperLeg, leftLowerLeg, leftFoot],
      [1, rightUpperLeg, rightLowerLeg, rightFoot]
    ] as const) {
      addCapsule(upperLeg, 0.042, 0.34, skinMaterial, [0, -0.18, 0]);
      addCapsule(lowerLeg, 0.049, 0.28, bootMaterial, [0, -0.13, 0]);
      addMesh(foot, new THREE.BoxGeometry(0.12, 0.068, 0.26), soleMaterial, [0, 0, 0.07], [
        0.06,
        side * 0.03,
        0
      ]);
      addMesh(foot, new THREE.BoxGeometry(0.105, 0.063, 0.12), bootMaterial, [0, 0.04, -0.075]);
    }

    // Arms, cuffs, and hands.
    for (const [side, upperArm, lowerArm, hand] of [
      [-1, leftUpperArm, leftLowerArm, leftHand],
      [1, rightUpperArm, rightLowerArm, rightHand]
    ] as const) {
      addCapsule(upperArm, 0.043, 0.325, shirtMaterial, [side * 0.015, -0.17, 0]);
      addMesh(upperArm, new THREE.CylinderGeometry(0.057, 0.057, 0.062, 8), collarMaterial, [
        side * 0.04,
        -0.32,
        0
      ]);
      addCapsule(lowerArm, 0.037, 0.265, skinMaterial, [0, -0.148, 0]);
      addLowPolySphere(hand, 0.055, skinMaterial, [0, -0.02, 0], [0.95, 0.9, 1]);
    }

    // Head, face, and hair are geometry-only: no texture decals.
    addLowPolySphere(head, 0.35, skinMaterial, [0, 0.02, 0], [0.92, 1.04, 0.9]);
    addLowPolySphere(head, 0.048, skinMaterial, [-0.315, 0.02, 0.015], [0.55, 0.88, 0.42]);
    addLowPolySphere(head, 0.048, skinMaterial, [0.315, 0.02, 0.015], [0.55, 0.88, 0.42]);
    addMesh(
      head,
      new THREE.SphereGeometry(0.365, 12, 7, 0, Math.PI * 2, 0, Math.PI * 0.48),
      hairMaterial,
      [0, 0.07, 0],
      [0, 0, 0],
      [1.06, 0.96, 1.04]
    );
    addLowPolySphere(head, 0.31, hairMaterial, [0, 0.24, 0], [1.08, 0.36, 1.08]);
    addLowPolySphere(head, 0.25, hairMaterial, [0, 0.06, -0.24], [1.05, 1.05, 0.55]);
    addLowPolySphere(head, 0.27, hairDeepMaterial, [0, -0.02, -0.285], [1.08, 0.92, 0.62]);
    addMesh(head, createRoundedPanelGeometry(0.48, 0.37, 0.055, 0.12), hairDeepMaterial, [0, -0.05, -0.35]);
    addMesh(
      head,
      new THREE.SphereGeometry(0.36, 12, 6, 0, Math.PI * 2, 0, Math.PI * 0.46),
      hatMaterial,
      [0, 0.255, 0.01],
      [0, 0, 0],
      [1.08, 0.6, 1.05]
    );
    addMesh(
      head,
      new THREE.CylinderGeometry(0.335, 0.375, 0.18, 12, 1, true),
      hatMaterial,
      [0, 0.215, 0.01],
      [0, 0, 0],
      [1.08, 1, 1.18]
    );
    addMesh(head, createHatBrimGeometry(0.5, 0.43, 0.29, 0.245, 0.036), hatMaterial, [0, 0.158, 0.02], [
      0,
      0,
      0
    ]);
    addMesh(head, createHatBrimGeometry(0.505, 0.435, 0.468, 0.4, 0.026), hatBandMaterial, [0, 0.14, 0.02]);
    addLowPolySphere(head, 0.055, hatRibbonMaterial, [0.18, 0.205, 0.405], [1.18, 0.78, 0.32]);
    addLowPolySphere(head, 0.055, hatRibbonMaterial, [0.29, 0.205, 0.405], [1.18, 0.78, 0.32]);
    addLowPolySphere(head, 0.037, hatRibbonKnotMaterial, [0.235, 0.205, 0.425], [0.85, 0.85, 0.45]);

    for (const [x, rotZ] of [
      [-0.16, -0.08],
      [0, 0],
      [0.16, 0.08]
    ] as const) {
      addCapsule(head, 0.044, 0.2, hairDeepMaterial, [x, -0.16, -0.33], [0.08, 0, rotZ], [0.72, 1, 0.66]);
    }

    for (const [side, rotZ] of [
      [-1, 0.2],
      [1, -0.2]
    ] as const) {
      addLowPolySphere(head, 0.085, hairDeepMaterial, [side * 0.285, -0.075, -0.08], [0.72, 0.9, 0.68]);
      addCapsule(head, 0.052, 0.24, hairDeepMaterial, [side * 0.275, -0.055, -0.17], [
        0.1,
        side * 0.3,
        side * 0.14
      ], [
        0.72,
        1,
        0.72
      ]);
      addCapsule(head, 0.062, 0.26, hairDeepMaterial, [side * 0.302, 0.025, -0.02], [
        0.12,
        side * 0.22,
        side * 0.1
      ], [
        0.78,
        1,
        0.76
      ]);
      addLowPolySphere(head, 0.082, hairDeepMaterial, [side * 0.315, 0.02, 0.025], [0.7, 0.9, 0.72]);
      addCapsule(head, 0.04, 0.26, hairMaterial, [side * 0.285, 0.005, 0.18], [0.06, 0, side * rotZ], [
        0.78,
        1,
        0.72
      ]);
      addCapsule(head, 0.033, 0.18, hairHighlightMaterial, [side * 0.25, 0.11, -0.24], [0.12, 0, -side * 0.16], [
        0.82,
        0.9,
        0.72
      ]);
      addCapsule(head, 0.048, 0.22, hairMaterial, [side * 0.287, -0.02, 0.035], [
        0.18,
        side * 0.18,
        side * 0.08
      ], [
        0.82,
        1,
        0.78
      ]);
      addLowPolySphere(head, 0.068, hairDeepMaterial, [side * 0.294, -0.05, -0.015], [0.78, 0.82, 0.72]);
    }

    const addFace = (z: number, yaw: number): void => {
      const faceRoot = new THREE.Group();
      faceRoot.position.set(0, 0, z);
      faceRoot.rotation.y = yaw;
      head.add(faceRoot);
      const faceMeshes = [
        addMesh(faceRoot, new THREE.BoxGeometry(0.074, 0.014, 0.012), hairDeepMaterial, [-0.095, 0.125, 0.024], [
          0,
          0,
          -0.08
        ]),
        addMesh(faceRoot, new THREE.BoxGeometry(0.074, 0.014, 0.012), hairDeepMaterial, [0.095, 0.125, 0.024], [
          0,
          0,
          0.08
        ]),
        addLowPolySphere(faceRoot, 0.049, eyeMaterial, [-0.096, 0.058, 0.024], [0.62, 1.12, 0.18]),
        addLowPolySphere(faceRoot, 0.049, eyeMaterial, [0.096, 0.058, 0.024], [0.62, 1.12, 0.18]),
        addLowPolySphere(faceRoot, 0.014, faceHighlightMaterial, [-0.085, 0.079, 0.041], [1, 1, 0.45]),
        addLowPolySphere(faceRoot, 0.014, faceHighlightMaterial, [0.107, 0.079, 0.041], [1, 1, 0.45]),
        addLowPolySphere(faceRoot, 0.017, noseMaterial, [0, -0.006, 0.024], [0.8, 1, 0.2]),
        addMesh(faceRoot, new THREE.BoxGeometry(0.076, 0.018, 0.016), mouthMaterial, [0, -0.092, 0.026], [
          0,
          0,
          0
        ]),
        addLowPolySphere(faceRoot, 0.011, mouthMaterial, [-0.042, -0.089, 0.032], [1, 0.9, 0.22]),
        addLowPolySphere(faceRoot, 0.011, mouthMaterial, [0.042, -0.089, 0.032], [1, 0.9, 0.22]),
        addLowPolySphere(faceRoot, 0.034, blushMaterial, [-0.164, -0.028, 0.021], [1.28, 0.72, 0.16]),
        addLowPolySphere(faceRoot, 0.034, blushMaterial, [0.164, -0.028, 0.021], [1.28, 0.72, 0.16])
      ];
      for (const mesh of faceMeshes) {
        mesh.castShadow = false;
        mesh.receiveShadow = false;
      }
    };
    addFace(0.305, 0);

    const addSideFace = (x: number, yaw: number): void => {
      const faceRoot = new THREE.Group();
      faceRoot.position.set(x, 0, 0);
      faceRoot.rotation.y = yaw;
      head.add(faceRoot);
      const faceMeshes = [
        addLowPolySphere(faceRoot, 0.034, eyeMaterial, [0.018, 0.058, 0.022], [0.6, 1, 0.18]),
        addLowPolySphere(faceRoot, 0.012, faceHighlightMaterial, [0.03, 0.076, 0.036], [1, 1, 0.45]),
        addLowPolySphere(faceRoot, 0.029, blushMaterial, [0.014, -0.03, 0.02], [1.2, 0.72, 0.16]),
        addMesh(faceRoot, new THREE.BoxGeometry(0.05, 0.016, 0.014), mouthMaterial, [0.002, -0.085, 0.024], [
          0,
          0,
          0
        ])
      ];
      for (const mesh of faceMeshes) {
        mesh.castShadow = false;
        mesh.receiveShadow = false;
      }
    };
    addSideFace(0.31, Math.PI / 2);
    addSideFace(-0.31, -Math.PI / 2);

    for (const [side, pigtail] of [
      [-1, leftPigtail],
      [1, rightPigtail]
    ] as const) {
      addCapsule(pigtail, 0.056, 0.16, hairMaterial, [side * 0.004, 0.07, -0.012], [
        0.14,
        side * 0.08,
        side * 0.05
      ], [
        0.86,
        1,
        0.72
      ]);
      addLowPolySphere(pigtail, 0.136, hairMaterial, [side * 0.018, -0.04, 0], [0.64, 1.08, 0.74]);
      addLowPolySphere(pigtail, 0.112, hairHighlightMaterial, [side * 0.068, -0.23, 0], [0.6, 1.06, 0.68]);
      addLowPolySphere(pigtail, 0.088, hairMaterial, [side * 0.11, -0.38, 0], [0.56, 1.02, 0.62]);
      addCapsule(pigtail, 0.032, 0.2, hairDeepMaterial, [side * 0.13, -0.5, 0], [0, 0, side * 0.18]);
      addMesh(pigtail, new THREE.TorusGeometry(0.054, 0.009, 5, 10), hairTieMaterial, [side * 0.008, 0.055, 0], [
        Math.PI / 2,
        0,
        0
      ], [0.8, 0.8, 0.8]);
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
