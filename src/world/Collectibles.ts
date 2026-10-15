import { BOOST, COLLECTIBLES, PLATFORMS, RAINBOW, SPEED, WORLD } from '../config';
import type { Collectible, CollectibleKind, Platform, WorldState } from '../types';

export function createPlatformPool(): Platform[] {
  const pool: Platform[] = [];
  for (let i = 0; i < PLATFORMS.poolSize; i++) pool.push({ active: false, x: 0, width: 0, top: 0 });
  return pool;
}

export function createCollectiblePool(): Collectible[] {
  const pool: Collectible[] = [];
  for (let i = 0; i < COLLECTIBLES.poolSize; i++) {
    pool.push({ active: false, kind: 'star', x: 0, y: 0, colorIndex: 0, collected: false, collectedTime: 0 });
  }
  return pool;
}

export function resetCollectibles(world: WorldState): void {
  for (let i = 0; i < world.platforms.length; i++) world.platforms[i].active = false;
  for (let i = 0; i < world.collectibles.length; i++) world.collectibles[i].active = false;
  world.boostTimer = 0;
  world.shieldTimer = 0;
  world.rainbowPieces = 0;
  world.rainbowRide = 0;
}

function spawnCollectible(world: WorldState, kind: CollectibleKind, x: number, y: number, colorIndex = 0): boolean {
  const pool = world.collectibles;
  for (let i = 0; i < pool.length; i++) {
    const c = pool[i];
    if (c.active) continue;
    c.active = true;
    c.kind = kind;
    c.x = x;
    c.y = y;
    c.colorIndex = colorIndex;
    c.collected = false;
    c.collectedTime = 0;
    return true;
  }
  return false;
}

/** Platform met een turbo erboven. Geeft false als de pool vol is. */
export function spawnPlatformWithBoost(world: WorldState, x: number): boolean {
  const pool = world.platforms;
  for (let i = 0; i < pool.length; i++) {
    const p = pool[i];
    if (p.active) continue;
    p.active = true;
    p.x = x;
    p.width = PLATFORMS.width;
    p.top = WORLD.groundY - PLATFORMS.height;
    spawnCollectible(world, 'boost', x + PLATFORMS.width / 2, p.top - BOOST.hover);
    return true;
  }
  return false;
}

/** Aantal regenboogstukjes dat nog in de wereld zweeft. */
function activeRainbowPieces(world: WorldState): number {
  let n = 0;
  for (let i = 0; i < world.collectibles.length; i++) {
    const c = world.collectibles[i];
    if (c.active && c.kind === 'rainbow' && !c.collected) n++;
  }
  return n;
}

/** Kan er nog een regenboogstukje bij? (maximaal de ontbrekende kleuren, één tegelijk) */
export function canSpawnRainbowPiece(world: WorldState): boolean {
  return world.rainbowRide <= 0 && world.rainbowPieces < 3 && activeRainbowPieces(world) === 0;
}

export function spawnRainbowPiece(world: WorldState, x: number): void {
  spawnCollectible(world, 'rainbow', x, WORLD.groundY - RAINBOW.height, world.rainbowPieces % 3);
}

/** Start de regenboogrit: een rij sterren op zweefhoogte langs de route van de auto. */
function startRainbowRide(world: WorldState): void {
  world.rainbowPieces = 0;
  world.rainbowRide = RAINBOW.rideDuration;
  world.boostTimer = 0;
  world.events.rainbowRide = true;
  const rideSpeed = SPEED.base * RAINBOW.rideSpeedFactor;
  const length = rideSpeed * RAINBOW.rideDuration;
  const y = WORLD.groundY - RAINBOW.rideHeight - world.car.height * 0.5;
  for (let d = 220; d < length - 100; d += RAINBOW.starSpacing) {
    // Zacht golvende rij sterren.
    spawnCollectible(world, 'star', world.car.x + d, y + Math.sin(d / 140) * 18);
  }
}

/**
 * Pakken van turbo's, regenboogstukjes en sterren, en de tijd van turbo, schild en rit.
 * Wordt na de auto-update aangeroepen.
 */
export function updateCollectibles(world: WorldState, dt: number): void {
  if (world.boostTimer > 0) world.boostTimer = Math.max(0, world.boostTimer - dt);
  if (world.shieldTimer > 0) world.shieldTimer = Math.max(0, world.shieldTimer - dt);
  if (world.rainbowRide > 0) {
    world.rainbowRide = Math.max(0, world.rainbowRide - dt);
    if (world.rainbowRide === 0) world.shieldTimer = RAINBOW.shieldAfterRide;
  }

  const car = world.car;
  // Ruim pakvak rond het midden van de auto.
  const cx = car.x;
  const cy = car.y - car.height * 0.55;
  const halfW = car.width * 0.45 + COLLECTIBLES.radius;
  const halfH = car.height * 0.6 + COLLECTIBLES.radius;

  const pool = world.collectibles;
  for (let i = 0; i < pool.length; i++) {
    const c = pool[i];
    if (!c.active) continue;
    if (c.x < car.x - 800) {
      c.active = false;
      continue;
    }
    if (c.collected) continue;
    if (Math.abs(c.x - cx) > halfW || Math.abs(c.y - cy) > halfH) continue;

    c.collected = true;
    c.collectedTime = world.time;
    switch (c.kind) {
      case 'boost':
        world.boostTimer = BOOST.duration;
        world.events.boosted = true;
        break;
      case 'rainbow':
        world.rainbowPieces++;
        world.events.rainbowPiece = true;
        if (world.rainbowPieces >= 3) startRainbowRide(world);
        break;
      case 'star':
        world.score++;
        world.lastScoreTime = world.time;
        world.events.scored = true;
        break;
    }
  }

  for (let i = 0; i < world.platforms.length; i++) {
    const p = world.platforms[i];
    if (p.active && p.x + p.width < car.x - 800) p.active = false;
  }
}
