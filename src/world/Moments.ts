import { MOMENTS, WORLD } from '../config';
import type { Moment, WorldState } from '../types';

export function createMomentPool(): Moment[] {
  const pool: Moment[] = [];
  for (let i = 0; i < MOMENTS.poolSize; i++) pool.push({ active: false, x: 0, y: 0, hitTime: -1 });
  return pool;
}

export function resetMoments(world: WorldState): void {
  for (let i = 0; i < world.moments.length; i++) world.moments[i].active = false;
}

/** Zet een spelmoment van de gekozen wereld neer. Geeft false als de pool vol is. */
export function spawnMoment(world: WorldState, x: number): boolean {
  for (let i = 0; i < world.moments.length; i++) {
    const m = world.moments[i];
    if (m.active) continue;
    m.active = true;
    m.x = x;
    m.y = WORLD.groundY - MOMENTS.height[world.theme];
    m.hitTime = -1;
    return true;
  }
  return false;
}

/**
 * Alleen in de lucht te raken: door pluis, bel of suikerspin springen, of over het ei in de berm springen.
 * Raken geeft een ster.
 */
export function updateMoments(world: WorldState): void {
  const car = world.car;
  const halfW = car.width * 0.45 + MOMENTS.radius;
  // Van de onderkant van de wielen tot het dak (het autoplaatje is ~1,25× car.height hoog).
  const top = car.y - car.height * 1.25 - MOMENTS.radius;
  const bottom = car.y + MOMENTS.radius;
  for (let i = 0; i < world.moments.length; i++) {
    const m = world.moments[i];
    if (!m.active) continue;
    if (m.x < car.x - 800) {
      m.active = false;
      continue;
    }
    if (m.hitTime >= 0 || car.onGround) continue;
    const hit =
      world.theme === 'dino'
        ? Math.abs(car.x - m.x) < MOMENTS.eggReach
        : Math.abs(m.x - car.x) < halfW && m.y >= top && m.y <= bottom;
    if (!hit) continue;
    m.hitTime = world.time;
    world.score++;
    world.lastScoreTime = world.time;
    world.events.scored = true;
    world.events.momentHit = true;
  }
}
