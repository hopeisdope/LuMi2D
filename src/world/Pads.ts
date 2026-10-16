import { BOUNCE, BOUNCE_PHYSICS, CAR_HITBOX, JUMP_PHYSICS, SPEED, WORLD } from '../config';
import type { Pad, WorldState } from '../types';
import { spawnCollectible } from './Collectibles';

export function createPadPool(): Pad[] {
  const pool: Pad[] = [];
  for (let i = 0; i < BOUNCE.poolSize; i++) pool.push({ active: false, x: 0, usedTime: -1 });
  return pool;
}

export function resetPads(world: WorldState): void {
  for (let i = 0; i < world.pads.length; i++) world.pads[i].active = false;
}

/** Afstand die de auto (op basissnelheid) aflegt tijdens een veersprong. */
export function bounceDistance(): number {
  return SPEED.base * BOUNCE_PHYSICS.airTime;
}

/**
 * Springkussen met drie sterren langs de boog die de auto ervandaan maakt. Geeft false als de pool vol is.
 * De sterren hangen op de hoogte van het pakvak van de auto (midden van de auto).
 */
export function spawnPad(world: WorldState, x: number): boolean {
  const pool = world.pads;
  for (let i = 0; i < pool.length; i++) {
    const p = pool[i];
    if (p.active) continue;
    p.active = true;
    p.x = x;
    p.usedTime = -1;
    const v = BOUNCE_PHYSICS.velocity;
    const g = JUMP_PHYSICS.gravity;
    const mid = WORLD.groundY - world.car.height * 0.55;
    for (const k of BOUNCE.starTimes) {
      const t = k * BOUNCE_PHYSICS.airTime;
      spawnCollectible(world, 'star', x + SPEED.base * t, mid - (v * t - 0.5 * g * t * t));
    }
    return true;
  }
  return false;
}

/**
 * Raakt de auto (op de grond of vallend) een springkussen, dan veert hij omhoog. Eén keer per kussen;
 * daarna verdwijnt het kussen achter de auto vanzelf.
 */
export function updatePads(world: WorldState): void {
  const car = world.car;
  const half = car.width * CAR_HITBOX.halfWidthRatio;
  for (let i = 0; i < world.pads.length; i++) {
    const p = world.pads[i];
    if (!p.active) continue;
    if (p.x < car.x - 800) {
      p.active = false;
      continue;
    }
    if (p.usedTime >= 0 || car.vy < 0) continue;
    const touching = Math.abs(car.x - p.x) < BOUNCE.width / 2 + half * 0.5 && car.y >= WORLD.groundY - BOUNCE.height;
    if (!touching) continue;
    p.usedTime = world.time;
    car.y = Math.min(car.y, WORLD.groundY - BOUNCE.height * 0.5);
    car.vy = -BOUNCE_PHYSICS.velocity;
    car.onGround = false;
    car.jumpBuffer = 0;
    car.landingTimer = 0;
    world.events.bounced = true;
  }
}
