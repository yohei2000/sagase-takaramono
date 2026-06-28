import * as THREE from 'three';
import { distance2, resolveMove } from './Collision';
import { iconMaterial, makeTextSprite, texturedMaterial } from './Assets';
import type { Bounds, CPUState, Interactable, Vec2 } from './types';

export type CPUEvent =
  | { type: 'coin'; amount: number }
  | { type: 'hint' }
  | { type: 'treasure' }
  | { type: 'state'; state: CPUState };

type CPUContext = {
  elapsed: number;
  interactables: Interactable[];
  colliders: Bounds[];
  houseBounds: Bounds;
  treasurePosition: Vec2;
};

export class CPU {
  readonly group: THREE.Group;
  readonly radius = 0.38;

  position: Vec2;
  coins = 0;
  hints = 0;
  state: CPUState = 'wander';

  private readonly speed = 2.1;
  private readonly visitedHints = new Set<string>();
  private readonly visitedGames = new Set<string>();
  private path: Vec2[] = [];
  private decisionTimer = 2.5;
  private passiveCoinTimer = 18;
  private lastPosition: Vec2;
  private stuckTimer = 0;
  private readonly labelSprites = new Map<CPUState | 'idle', THREE.Sprite>();

  constructor(scene: THREE.Scene, start: Vec2) {
    this.position = { ...start };
    this.lastPosition = { ...start };
    this.group = new THREE.Group();
    this.group.position.set(start.x, 0, start.z);

    const body = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.35, 0.72, 6, 12),
      texturedMaterial('cpu_character', 0x7dc7ff)
    );
    body.position.y = 0.9;
    body.castShadow = true;
    this.group.add(body);

    const face = new THREE.Mesh(
      new THREE.SphereGeometry(0.27, 18, 14),
      new THREE.MeshStandardMaterial({ color: 0xffd7ad, roughness: 0.7 })
    );
    face.position.y = 1.52;
    face.castShadow = true;
    this.group.add(face);

    const panel = new THREE.Mesh(new THREE.PlaneGeometry(0.48, 0.48), iconMaterial('cpu_character', 0xffffff));
    panel.position.set(0, 1.04, -0.36);
    panel.rotation.y = Math.PI;
    this.group.add(panel);

    this.addStatusLabels();
    this.updateStatusLabel('idle');

    scene.add(this.group);
  }

  update(dt: number, context: CPUContext): CPUEvent[] {
    const events: CPUEvent[] = [];
    this.passiveCoinTimer -= dt;
    if (this.passiveCoinTimer <= 0 && this.state !== 'openTreasure') {
      const amount = 10 + Math.floor(Math.random() * 6);
      this.coins += amount;
      this.passiveCoinTimer = 18 + Math.random() * 7;
      events.push({ type: 'coin', amount });
    }

    if (this.state === 'openTreasure') {
      return events;
    }

    this.decisionTimer -= dt;
    if (this.path.length === 0 && this.decisionTimer <= 0) {
      this.chooseNextGoal(context, events);
    }

    this.moveAlongPath(dt, context, events);
    this.group.position.set(this.position.x, 0, this.position.z);
    return events;
  }

  private chooseNextGoal(context: CPUContext, events: CPUEvent[]): void {
    if (context.elapsed > 88 && this.coins >= 60 && this.hints >= 3) {
      this.setState('goToTreasure', events);
      this.setPathTo(context.treasurePosition);
      return;
    }

    const hints = context.interactables.filter(
      (item) => item.type === 'hint' && !this.visitedHints.has(item.id)
    );
    const games = context.interactables.filter((item) => item.type === 'minigame');

    if (this.hints < 4 && hints.length > 0 && Math.random() < 0.52) {
      const target = hints[Math.floor(Math.random() * hints.length)];
      this.setState('goToHint', events);
      this.setPathTo(target.position);
      return;
    }

    if (games.length > 0) {
      const unvisited = games.filter((game) => !this.visitedGames.has(game.id));
      const pool = unvisited.length > 0 ? unvisited : games;
      const target = pool[Math.floor(Math.random() * pool.length)];
      this.setState('playMiniGame', events);
      this.setPathTo(target.position);
      return;
    }

    this.setState('wander', events);
    this.setPathTo({
      x: context.houseBounds.xMin + 2 + Math.random() * (context.houseBounds.xMax - context.houseBounds.xMin - 4),
      z: context.houseBounds.zMin + 2 + Math.random() * (context.houseBounds.zMax - context.houseBounds.zMin - 4)
    });
  }

  private moveAlongPath(dt: number, context: CPUContext, events: CPUEvent[]): void {
    const target = this.path[0];
    if (!target) {
      return;
    }

    const dx = target.x - this.position.x;
    const dz = target.z - this.position.z;
    const length = Math.hypot(dx, dz);
    if (length < 0.35) {
      this.path.shift();
      if (this.path.length === 0) {
        this.finishGoal(context, events);
      }
      return;
    }

    const delta = {
      x: (dx / length) * this.speed * dt,
      z: (dz / length) * this.speed * dt
    };
    const next = resolveMove(this.position, delta, this.radius, context.colliders, context.houseBounds);
    const moved = distance2(next, this.position);
    this.position = next;
    if (moved > 0.0001) {
      this.group.rotation.y = Math.atan2(delta.x, delta.z);
    }

    if (distance2(this.position, this.lastPosition) < 0.0002) {
      this.stuckTimer += dt;
      if (this.stuckTimer > 1.2) {
        this.path = this.path.slice(-1);
        this.path.unshift({ x: 0, z: 5 }, { x: 0, z: 0.5 });
        this.stuckTimer = 0;
      }
    } else {
      this.stuckTimer = 0;
      this.lastPosition = { ...this.position };
    }
  }

  private finishGoal(context: CPUContext, events: CPUEvent[]): void {
    if (this.state === 'goToHint') {
      const hint = context.interactables
        .filter((item) => item.type === 'hint' && !this.visitedHints.has(item.id))
        .sort((a, b) => distance2(a.position, this.position) - distance2(b.position, this.position))[0];
      if (hint) {
        this.visitedHints.add(hint.id);
        this.hints += 1;
        events.push({ type: 'hint' });
      }
      this.decisionTimer = 8 + Math.random() * 9;
      return;
    }

    if (this.state === 'playMiniGame') {
      const game = context.interactables
        .filter((item) => item.type === 'minigame')
        .sort((a, b) => distance2(a.position, this.position) - distance2(b.position, this.position))[0];
      if (game) {
        const first = !this.visitedGames.has(game.id);
        this.visitedGames.add(game.id);
        const amount = first ? 12 + Math.floor(Math.random() * 7) : 6 + Math.floor(Math.random() * 3);
        this.coins += amount;
        events.push({ type: 'coin', amount });
      }
      this.decisionTimer = 10 + Math.random() * 10;
      return;
    }

    if (this.state === 'goToTreasure') {
      this.setState('openTreasure', events);
      events.push({ type: 'treasure' });
      return;
    }

    this.decisionTimer = 3 + Math.random() * 4;
  }

  private setState(state: CPUState, events: CPUEvent[]): void {
    if (this.state !== state) {
      this.state = state;
      this.updateStatusLabel(state);
      events.push({ type: 'state', state });
    }
  }

  private setPathTo(target: Vec2): void {
    const path: Vec2[] = [];
    const hubUpper = { x: 0, z: 5 };
    const hubDoor = { x: 0, z: 0.5 };

    if (this.position.z < 1 && target.z > 1) {
      path.push(hubDoor, hubUpper);
    } else if (this.position.z > 1 && target.z < 1) {
      path.push(hubUpper, hubDoor);
    } else if (target.z > 1 && Math.abs(target.x) > 5) {
      path.push(hubUpper);
    }

    path.push(target);
    this.path = path;
  }

  private addStatusLabels(): void {
    const labels: Array<[CPUState | 'idle', string, string]> = [
      ['idle', 'さがす', '#d9f0ff'],
      ['wander', 'さがす', '#d9f0ff'],
      ['goToHint', 'ヒントへ', '#fff0a9'],
      ['playMiniGame', 'ゲーム中', '#ffe1a6'],
      ['goToTreasure', 'たからへ', '#ffdd88'],
      ['openTreasure', 'たからへ', '#ffdd88']
    ];

    for (const [state, text, background] of labels) {
      const sprite = makeTextSprite(text, '#173642', background);
      sprite.position.set(0, 2.36, 0);
      sprite.scale.set(1.85, 0.56, 1);
      sprite.visible = false;
      this.group.add(sprite);
      this.labelSprites.set(state, sprite);
    }
  }

  private updateStatusLabel(state: CPUState | 'idle'): void {
    for (const sprite of this.labelSprites.values()) {
      sprite.visible = false;
    }
    const sprite = this.labelSprites.get(state) ?? this.labelSprites.get('idle');
    if (sprite) {
      sprite.visible = true;
    }
  }
}
