import { inside, river, territories } from './data';

export const WALK = { radius: 0.11, height: 0.68, speed: 1.2, runSpeed: 2.25, gravity: 7.5, jumpSpeed: 2.3, step: 0.14, slope: 0.65 } as const;
export type WalkInput = { x: number; y: number; run: boolean; jump: boolean; reset: number; plaza: number };
export type WalkStatus = { territory: string; landmark?: string; motion: 'Entering' | 'Idle' | 'Walking' | 'Running' | 'Jumping' | 'Unavailable' };
export const freshWalkInput = (): WalkInput => ({ x: 0, y: 0, run: false, jump: false, reset: 0, plaza: 0 });

export function riverDistance(x: number, z: number) {
  let nearest = Infinity;
  for (let i = 1; i < river.length; i++) {
    const a = river[i - 1], b = river[i], dx = b[0] - a[0], dz = b[1] - a[1];
    const t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / (dx * dx + dz * dz)));
    nearest = Math.min(nearest, Math.hypot(x - a[0] - t * dx, z - a[1] - t * dz));
  }
  return nearest;
}

// Test a footprint against the UNION: internal state borders remain traversable.
export function dryFootprint(x: number, z: number, radius: number = WALK.radius) {
  if (riverDistance(x, z) < 0.24 + radius) return false;
  for (let i = 0; i < 9; i++) {
    const angle = i * Math.PI / 4, r = i === 8 ? 0 : radius;
    const p: [number, number] = [x + Math.cos(angle) * r, z + Math.sin(angle) * r];
    if (!territories.some(t => inside(p, t.points))) return false;
  }
  return true;
}

export function movement(x: number, forward: number, yaw: number) {
  const length = Math.max(1, Math.hypot(x, forward));
  return { x: (x * Math.cos(yaw) - forward * Math.sin(yaw)) / length,
    z: (-x * Math.sin(yaw) - forward * Math.cos(yaw)) / length };
}

export function verticalStep(y: number, velocity: number, ground: number, dt: number) {
  const v = velocity - WALK.gravity * dt, next = y + v * dt;
  return next <= ground ? { y: ground, velocity: 0, grounded: true } : { y: next, velocity: v, grounded: false };
}
