import { BOUNCE, BUMP, CAR_HITBOX, COACH, ENEMIES, OBSTACLES, PLATFORMS, RAINBOW, RIDE, WORLD } from '../config';
import type { Obstacle, ObstacleKind, WorldState } from '../types';
import { canSpawnRainbowPiece, spawnPlatformWithBoost, spawnRainbowPiece } from './Collectibles';
import { spawnCoach } from './Friends';
import { bounceDistance, spawnPad } from './Pads';

/** Stilstaande obstakelsoorten. */
const STATIC_KINDS = ['cone', 'rock', 'crate'] as const;

export function createObstaclePool(): Obstacle[] {
  const pool: Obstacle[] = [];
  for (let i = 0; i < OBSTACLES.poolSize; i++) {
    pool.push({
      active: false,
      kind: 'cone',
      enemy: false,
      vx: 0,
      x: 0,
      width: 0,
      height: 0,
      cleared: false,
      hit: false,
      hitTime: 0,
    });
  }
  return pool;
}

export function resetObstacles(world: WorldState): void {
  for (let i = 0; i < world.obstacles.length; i++) world.obstacles[i].active = false;
  world.nextObstacleAt = OBSTACLES.firstDistance;
}

function spawn(world: WorldState, x: number, enemy: boolean): void {
  const pool = world.obstacles;
  for (let i = 0; i < pool.length; i++) {
    const o = pool[i];
    if (o.active) continue;
    let kind: ObstacleKind;
    let width: number;
    let height: number;
    if (enemy) {
      kind = 'hedgehog';
      width = ENEMIES.kinds.hedgehog.width;
      height = ENEMIES.kinds.hedgehog.height;
    } else {
      const k = STATIC_KINDS[Math.floor(world.random() * STATIC_KINDS.length)];
      kind = k;
      width = OBSTACLES.kinds[k].width;
      height = OBSTACLES.kinds[k].height;
    }
    o.active = true;
    o.kind = kind;
    o.enemy = enemy;
    o.vx = enemy ? -ENEMIES.speed : 0;
    o.x = x;
    o.width = width;
    o.height = height;
    o.cleared = false;
    o.hit = false;
    o.hitTime = 0;
    // Zolang het kind nog oefent, staat er een vriendje bij dat het sprongetje voordoet (alleen bij stilstaande obstakels).
    if (!enemy && world.coaching) spawnCoach(world, i);
    return;
  }
  // Pool vol: dit obstakel overslaan (komt in de praktijk niet voor bij deze afstanden).
}

/**
 * Bouwt het parcours vóór de auto (buiten beeld): obstakels, egels, platforms met turbo
 * en regenboogstukjes. Platforms en regenboog komen ook als obstakels en egels uit staan.
 */
function spawnAhead(world: WorldState): void {
  const car = world.car;
  const canObstacle = world.obstaclesEnabled;
  const canEnemy = world.enemiesEnabled;

  // Tijdens de regenboogrit verschijnt er niets nieuws; daarna begint het parcours weer buiten beeld.
  if (world.rainbowRide > 0) {
    const resumeAt = car.x + OBSTACLES.spawnAhead + RAINBOW.rideDuration * 400;
    if (world.nextObstacleAt < resumeAt) world.nextObstacleAt = resumeAt;
    return;
  }

  while (car.x + OBSTACLES.spawnAhead >= world.nextObstacleAt) {
    const x0 = world.nextObstacleAt;
    if (x0 > world.finishX - RIDE.clearBeforeFinish) {
      // Vrije weg naar de finish.
      world.nextObstacleAt = Infinity;
      return;
    }
    const gap = OBSTACLES.minGap + world.random() * (OBSTACLES.maxGap - OBSTACLES.minGap);
    const roll = world.random();

    if (roll < PLATFORMS.chance && spawnPlatformWithBoost(world, x0)) {
      world.nextObstacleAt = x0 + PLATFORMS.width + gap;
      continue;
    }
    const rainbowAllowed = x0 < world.finishX - RIDE.noRainbowBeforeFinish;
    if (roll < PLATFORMS.chance + RAINBOW.chance && rainbowAllowed && canSpawnRainbowPiece(world)) {
      spawnRainbowPiece(world, x0);
      world.nextObstacleAt = x0 + gap;
      continue;
    }
    if (roll >= PLATFORMS.chance + RAINBOW.chance && roll < PLATFORMS.chance + RAINBOW.chance + BOUNCE.chance && spawnPad(world, x0)) {
      // Na een springkussen: ruimte voor de lange veersprong en daarna de gewone tussenruimte.
      world.nextObstacleAt = x0 + bounceDistance() + gap;
      continue;
    }
    if (!canObstacle && !canEnemy) {
      // Geen obstakels of egels: alleen ruimte laten voor de volgende verrassing.
      world.nextObstacleAt = x0 + gap;
      continue;
    }
    const enemy = canEnemy && (!canObstacle || world.random() < ENEMIES.chance);
    const x = x0 + (enemy ? ENEMIES.extraGap : 0);
    spawn(world, x, enemy);
    world.nextObstacleAt = x + gap;
  }
}

/**
 * Obstakels en vijanden bewegen, laten verschijnen, opruimen, botsingen en sterren afhandelen.
 * Wordt na de auto-update aangeroepen, zodat de positie van dit frame telt.
 */
export function updateObstacles(world: WorldState, dt: number): void {
  const car = world.car;
  spawnAhead(world);

  // Botsingsvak van de auto (iets kleiner dan de tekening).
  const carHalf = car.width * CAR_HITBOX.halfWidthRatio;
  const carLeft = car.x - carHalf;
  const carRight = car.x + carHalf;
  const carBottom = car.y;

  const pool = world.obstacles;
  for (let i = 0; i < pool.length; i++) {
    const o = pool[i];
    if (!o.active) continue;

    // Vijanden wandelen zelf; na een botsing neemt de vlucht-animatie het over.
    if (!o.hit) o.x += o.vx * dt;

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
      world.events.cleared = true;
      world.cleanJumps++;
      if (world.cleanJumps >= COACH.cleanJumpsToStop) world.coaching = false;
      world.score++;
      world.lastScoreTime = world.time;
      world.events.scored = true;
      continue;
    }

    const overlaps = carRight > left && carLeft < right && carBottom > top;
    if (!overlaps) continue;

    // Botsing: obstakel tuimelt weg / egel schrikt en rent weg; de auto wiebelt en remt even af.
    // Met turbo of schild knalt het obstakel weg zonder hobbel.
    o.hit = true;
    o.hitTime = world.time;
    if (world.boostTimer > 0 || world.shieldTimer > 0) continue;
    if (car.bumpTimer <= 0) {
      car.bumpTimer = BUMP.duration;
      world.speed = Math.min(world.speed, world.targetSpeed * BUMP.speedFactor);
      world.events.bumped = true;
      world.cleanJumps = 0;
      world.coaching = true;
    }
  }
}
