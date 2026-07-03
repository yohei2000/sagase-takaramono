import type { Bounds, Vec2 } from './types';

const MAX_MOVE_STEP = 0.12;
const PUSH_EPSILON = 0.001;
const PUSH_ITERATIONS = 4;

export function distance2(a: Vec2, b: Vec2): number {
  const dx = a.x - b.x;
  const dz = a.z - b.z;
  return dx * dx + dz * dz;
}

export function circleIntersectsBounds(point: Vec2, radius: number, bounds: Bounds): boolean {
  const closestX = Math.max(bounds.xMin, Math.min(point.x, bounds.xMax));
  const closestZ = Math.max(bounds.zMin, Math.min(point.z, bounds.zMax));
  const dx = point.x - closestX;
  const dz = point.z - closestZ;
  return dx * dx + dz * dz < radius * radius;
}

export function isBlocked(point: Vec2, radius: number, colliders: Bounds[], houseBounds: Bounds): boolean {
  if (
    point.x - radius < houseBounds.xMin ||
    point.x + radius > houseBounds.xMax ||
    point.z - radius < houseBounds.zMin ||
    point.z + radius > houseBounds.zMax
  ) {
    return true;
  }

  return colliders.some((collider) => circleIntersectsBounds(point, radius, collider));
}

export function resolveMove(
  current: Vec2,
  delta: Vec2,
  radius: number,
  colliders: Bounds[],
  houseBounds: Bounds
): Vec2 {
  const distance = Math.hypot(delta.x, delta.z);
  if (distance <= 0) {
    return current;
  }

  const steps = Math.max(1, Math.ceil(distance / MAX_MOVE_STEP));
  const step = { x: delta.x / steps, z: delta.z / steps };
  let next = { ...current };

  for (let i = 0; i < steps; i += 1) {
    const target = resolvePosition({ x: next.x + step.x, z: next.z + step.z }, radius, colliders, houseBounds);
    if (!isBlocked(target, radius, colliders, houseBounds)) {
      next = target;
      continue;
    }

    const xOnly = resolvePosition({ x: next.x + step.x, z: next.z }, radius, colliders, houseBounds);
    const zOnly = resolvePosition({ x: next.x, z: next.z + step.z }, radius, colliders, houseBounds);
    const canMoveX = !isBlocked(xOnly, radius, colliders, houseBounds);
    const canMoveZ = !isBlocked(zOnly, radius, colliders, houseBounds);

    if (canMoveX && canMoveZ) {
      const xDistance = distance2(next, xOnly);
      const zDistance = distance2(next, zOnly);
      next = xDistance >= zDistance ? xOnly : zOnly;
      continue;
    }

    if (canMoveX) {
      next = xOnly;
      continue;
    }

    if (canMoveZ) {
      next = zOnly;
    }
  }

  return next;
}

function resolvePosition(point: Vec2, radius: number, colliders: Bounds[], houseBounds: Bounds): Vec2 {
  let resolved = clampToHouseBounds(point, radius, houseBounds);

  for (let iteration = 0; iteration < PUSH_ITERATIONS; iteration += 1) {
    let pushed = false;

    for (const collider of colliders) {
      const push = circleBoundsPush(resolved, radius, collider);
      if (!push) {
        continue;
      }

      resolved = clampToHouseBounds(
        {
          x: resolved.x + push.x,
          z: resolved.z + push.z
        },
        radius,
        houseBounds
      );
      pushed = true;
    }

    if (!pushed) {
      break;
    }
  }

  return resolved;
}

function clampToHouseBounds(point: Vec2, radius: number, bounds: Bounds): Vec2 {
  return {
    x: Math.max(bounds.xMin + radius, Math.min(point.x, bounds.xMax - radius)),
    z: Math.max(bounds.zMin + radius, Math.min(point.z, bounds.zMax - radius))
  };
}

function circleBoundsPush(point: Vec2, radius: number, bounds: Bounds): Vec2 | null {
  const closestX = Math.max(bounds.xMin, Math.min(point.x, bounds.xMax));
  const closestZ = Math.max(bounds.zMin, Math.min(point.z, bounds.zMax));
  const dx = point.x - closestX;
  const dz = point.z - closestZ;
  const distSq = dx * dx + dz * dz;
  const radiusSq = radius * radius;

  if (distSq >= radiusSq) {
    return null;
  }

  if (distSq > 0.000001) {
    const distance = Math.sqrt(distSq);
    const amount = radius - distance + PUSH_EPSILON;
    return {
      x: (dx / distance) * amount,
      z: (dz / distance) * amount
    };
  }

  const left = Math.abs(point.x - bounds.xMin);
  const right = Math.abs(bounds.xMax - point.x);
  const bottom = Math.abs(point.z - bounds.zMin);
  const top = Math.abs(bounds.zMax - point.z);
  const nearest = Math.min(left, right, bottom, top);

  if (nearest === left) {
    return { x: -(left + radius + PUSH_EPSILON), z: 0 };
  }
  if (nearest === right) {
    return { x: right + radius + PUSH_EPSILON, z: 0 };
  }
  if (nearest === bottom) {
    return { x: 0, z: -(bottom + radius + PUSH_EPSILON) };
  }
  return { x: 0, z: top + radius + PUSH_EPSILON };
}
