import * as THREE from 'three';
import { distance2, isBlocked, resolveMove } from './Collision';
import { makeTextSprite, spriteMaterial } from './Assets';
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
  coinGoal: number;
  treasureDelay: number;
  treasureHints: number;
  waypoints?: Vec2[];
};

export class CPU {
  readonly group: THREE.Group;
  readonly radius = 0.38;

  position: Vec2;
  coins = 0;
  hints = 0;
  state: CPUState = 'wander';

  private readonly speed: number;
  private readonly visitedHints = new Set<string>();
  private readonly visitedGames = new Set<string>();
  private path: Vec2[] = [];
  private decisionTimer = 2.5;
  private passiveCoinTimer = 18;
  private lastPosition: Vec2;
  private stuckTimer = 0;
  private readonly labelSprites = new Map<CPUState | 'idle', THREE.Sprite>();

  constructor(scene: THREE.Scene, start: Vec2, speed = 2.1) {
    this.speed = speed;
    this.position = { ...start };
    this.lastPosition = { ...start };
    this.group = new THREE.Group();
    this.group.position.set(start.x, 0, start.z);

    const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x73c8f3, roughness: 0.66, metalness: 0.03 });

    const body = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.35, 0.72, 6, 12),
      bodyMaterial
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

    const modelParts = [...this.group.children];
    const groundShadow = new THREE.Mesh(
      new THREE.CircleGeometry(0.46, 32),
      new THREE.MeshBasicMaterial({ color: 0x20333a, transparent: true, opacity: 0.18, depthWrite: false })
    );
    groundShadow.rotation.x = -Math.PI / 2;
    groundShadow.position.y = 0.025;
    this.group.add(groundShadow);

    const portrait = new THREE.Sprite(spriteMaterial('cpu_character', 0xffffff));
    portrait.position.set(0, 1.02, -0.02);
    portrait.scale.set(1.35, 1.8, 1);
    portrait.renderOrder = 8;
    this.group.add(portrait);

    for (const part of modelParts) {
      part.visible = false;
    }

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
    if (context.elapsed > context.treasureDelay && this.coins >= context.coinGoal && this.hints >= context.treasureHints) {
      this.setState('goToTreasure', events);
      this.setPathTo(context.treasurePosition, context);
      return;
    }

    const hints = context.interactables.filter(
      (item) => item.type === 'hint' && !this.visitedHints.has(item.id)
    );
    const games = context.interactables.filter((item) => item.type === 'minigame');

    if (this.hints < context.treasureHints && hints.length > 0 && Math.random() < 0.52) {
      const target = hints[Math.floor(Math.random() * hints.length)];
      this.setState('goToHint', events);
      this.setPathTo(target.position, context);
      return;
    }

    if (games.length > 0) {
      const unvisited = games.filter((game) => !this.visitedGames.has(game.id));
      const pool = unvisited.length > 0 ? unvisited : games;
      const target = pool[Math.floor(Math.random() * pool.length)];
      this.setState('playMiniGame', events);
      this.setPathTo(target.position, context);
      return;
    }

    this.setState('wander', events);
    this.setPathTo({
      x: context.houseBounds.xMin + 2 + Math.random() * (context.houseBounds.xMax - context.houseBounds.xMin - 4),
      z: context.houseBounds.zMin + 2 + Math.random() * (context.houseBounds.zMax - context.houseBounds.zMin - 4)
    }, context);
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
        const finalTarget = this.path[this.path.length - 1] ?? target;
        if (context.waypoints?.length) {
          this.setPathTo(finalTarget, context);
        } else {
          this.path = this.path.slice(-1);
          this.path.unshift({ x: 0, z: 5 }, { x: 0, z: 0.5 });
        }
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

  private setPathTo(target: Vec2, context?: CPUContext): void {
    const waypointPath = context?.waypoints?.length ? this.planWaypointPath(target, context) : null;
    if (waypointPath) {
      this.path = waypointPath;
      return;
    }

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

  private planWaypointPath(target: Vec2, context: CPUContext): Vec2[] | null {
    if (this.segmentIsClear(this.position, target, context)) {
      return [target];
    }

    const points = [this.position, ...context.waypoints!, target];
    const targetIndex = points.length - 1;
    const distances = new Array<number>(points.length).fill(Number.POSITIVE_INFINITY);
    const previous = new Array<number>(points.length).fill(-1);
    const visited = new Array<boolean>(points.length).fill(false);
    const edges = new Map<number, Array<[number, number]>>();

    for (let i = 0; i < points.length; i += 1) {
      for (let j = i + 1; j < points.length; j += 1) {
        if (!this.segmentIsClear(points[i], points[j], context)) {
          continue;
        }
        const cost = Math.sqrt(distance2(points[i], points[j]));
        edges.set(i, [...(edges.get(i) ?? []), [j, cost]]);
        edges.set(j, [...(edges.get(j) ?? []), [i, cost]]);
      }
    }

    distances[0] = 0;
    for (let step = 0; step < points.length; step += 1) {
      let current = -1;
      let bestDistance = Number.POSITIVE_INFINITY;
      for (let i = 0; i < points.length; i += 1) {
        if (!visited[i] && distances[i] < bestDistance) {
          current = i;
          bestDistance = distances[i];
        }
      }

      if (current === -1 || current === targetIndex) {
        break;
      }

      visited[current] = true;
      for (const [next, cost] of edges.get(current) ?? []) {
        const nextDistance = distances[current] + cost;
        if (nextDistance < distances[next]) {
          distances[next] = nextDistance;
          previous[next] = current;
        }
      }
    }

    if (!Number.isFinite(distances[targetIndex])) {
      return null;
    }

    const path: Vec2[] = [];
    for (let index = targetIndex; index > 0; index = previous[index]) {
      if (index === -1) {
        return null;
      }
      path.unshift(points[index]);
    }
    return path;
  }

  private segmentIsClear(from: Vec2, to: Vec2, context: CPUContext): boolean {
    const length = Math.sqrt(distance2(from, to));
    const steps = Math.max(1, Math.ceil(length / 0.45));

    for (let i = 1; i <= steps; i += 1) {
      const t = i / steps;
      const point = {
        x: from.x + (to.x - from.x) * t,
        z: from.z + (to.z - from.z) * t
      };
      if (isBlocked(point, this.radius, context.colliders, context.houseBounds)) {
        return false;
      }
    }

    return true;
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
