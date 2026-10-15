import { BUMP, CAR_HITBOX, OBSTACLES, WORLD } from '../config';
import type { Obstacle, ObstacleKind, WorldState } from '../types';

const KINDS: readonly ObstacleKind[] = ['cone', 'rock', 'crate'];

export function createObstaclePool(): Obstacle[] {
  const pool: Obstacle[] = [];
  for (let i = 0; i < OBSTACLES.poolSize; i++) {
    pool.push({ active: false, kind: 'cone', x: 0, width: 0, height: 0, cleared: false, hit: false, hitTime: 0 });
  }
  return pool;
}

export function resetObstacles(world: WorldState): void {
  for (let i = 0; i < world.obstacles.length; i++) world.obstacles[i].active = false;
  world.nextObstacleAt = OBSTACLES.firstDistance;
}

function spawn(world: WorldState, x: number): void {
  const pool = world.obstacles;
  for (let i = 0; i < pool.length; i++) {
    const o = pool[i];
    if (o.active) continue;
    const kind = KINDS[Math.floor(world.random() * KINDS.length)];
    const size = OBSTACLES.kinds[kind];
    o.active = true;
    o.kind = kind;
    o.x = x;
    o.width = size.width;
    o.height = size.height;
    o.cleared = false;
    o.hit = false;
    o.hitTime = 0;
    return;
  }
  // Pool vol: dit obstakel overslaan (komt in de praktijk niet voor bij deze afstanden).
}

/**
 * Obstakels laten verschijnen, opruimen, botsingen en sterren afhandelen.
 * Wordt na de auto-update aangeroepen, zodat de positie van dit frame telt.
 */
export function updateObstacles(world: WorldState): void {
  const car = world.car;

  // Nieuwe obstakels vóór de auto, buiten beeld.
  if (world.obstaclesEnabled) {
    while (car.x + OBSTACLES.spawnAhead >= world.nextObstacleAt) {
      spawn(world, world.nextObstacleAt);
      const gap = OBSTACLES.minGap + world.random() * (OBSTACLES.maxGap - OBSTACLES.minGap);
      world.nextObstacleAt += gap;
    }
  } else if (world.nextObstacleAt < car.x + OBSTACLES.spawnAhead) {
    // Uitgeschakeld: het spawnpunt schuift mee, zodat aanzetten niet direct een rij obstakels geeft.
    world.nextObstacleAt = car.x + OBSTACLES.spawnAhead;
  }

  // Botsingsvak van de auto (iets kleiner dan de tekening).
  const carHalf = car.width * CAR_HITBOX.halfWidthRatio;
  const carLeft = car.x - carHalf;
  const carRight = car.x + carHalf;
  const carBottom = car.y;

  const pool = world.obstacles;
  for (let i = 0; i < pool.length; i++) {
    const o = pool[i];
    if (!o.active) continue;

    if (o.x < car.x - OBSTACLES.despawnBehind) {
      o.active = false;
      continue;
    }
    if (o.hit || o.cleared) continue;

    const half = o.width / 2 - OBSTACLES.hitboxInset;
    const left = o.x - half;
    const right = o.x + half;
    const top = WORLD.groundY - o.height + OBSTACLES.hitboxInset;

    if (carLeft > right) {
      // Helemaal voorbij zonder botsing: ster verdiend.
      o.cleared = true;
      world.score++;
      world.lastScoreTime = world.time;
      world.events.scored = true;
      continue;
    }

    const overlaps = carRight > left && carLeft < right && carBottom > top;
    if (!overlaps) continue;

    // Botsing: het obstakel tuimelt weg, de auto wiebelt en remt even af. Geen game over.
    o.hit = true;
    o.hitTime = world.time;
    if (car.bumpTimer <= 0) {
      car.bumpTimer = BUMP.duration;
      world.speed = Math.min(world.speed, world.targetSpeed * BUMP.speedFactor);
      world.events.bumped = true;
    }
  }
}
