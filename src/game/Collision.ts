import type { Bounds, Vec2 } from './types';

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
  const full = { x: current.x + delta.x, z: current.z + delta.z };
  if (!isBlocked(full, radius, colliders, houseBounds)) {
    return full;
  }

  const xOnly = { x: current.x + delta.x, z: current.z };
  if (!isBlocked(xOnly, radius, colliders, houseBounds)) {
    return xOnly;
  }

  const zOnly = { x: current.x, z: current.z + delta.z };
  if (!isBlocked(zOnly, radius, colliders, houseBounds)) {
    return zOnly;
  }

  return current;
}
