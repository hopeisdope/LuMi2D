import { BOOST, ENEMIES, OBSTACLES, RAINBOW, SPEED, WORLD } from '../config';
import type { WorldState } from '../types';
import { createCar, floatCar, requestJump, resetCar, updateCar } from './Car';
import { createCollectiblePool, createPlatformPool, resetCollectibles, updateCollectibles } from './Collectibles';
import { createObstaclePool, resetObstacles, updateObstacles } from './Obstacles';
import { createRandom, randomSeed } from './random';

/**
 * Pure game-logica van de wereld: geen rendering, geen input.
 * @param seed optioneel: vaste seed voor een reproduceerbaar obstakelpatroon (tests).
 */
export function createWorld(seed: number = randomSeed()): WorldState {
  return {
    speed: 0,
    targetSpeed: SPEED.base,
    distance: 0,
    time: 0,
    jumpCount: 0,
    score: 0,
    lastScoreTime: -1,
    obstaclesEnabled: OBSTACLES.enabled,
    enemiesEnabled: ENEMIES.enabled,
    obstacles: createObstaclePool(),
    nextObstacleAt: OBSTACLES.firstDistance,
    random: createRandom(seed),
    platforms: createPlatformPool(),
    collectibles: createCollectiblePool(),
    boostTimer: 0,
    shieldTimer: 0,
    rainbowPieces: 0,
    rainbowRide: 0,
    car: createCar(),
    events: {
      jumped: false,
      landed: false,
      bumped: false,
      scored: false,
      boosted: false,
      rainbowPiece: false,
      rainbowRide: false,
    },
  };
}

/** Nieuwe ronde. De instellingen (obstakels/vijanden aan/uit) blijven behouden. */
export function resetWorld(world: WorldState, seed: number = randomSeed()): void {
  world.speed = 0;
  world.targetSpeed = SPEED.base;
  world.distance = 0;
  world.time = 0;
  world.jumpCount = 0;
  world.score = 0;
  world.lastScoreTime = -1;
  world.random = createRandom(seed);
  clearEvents(world);
  resetCar(world.car);
  resetObstacles(world);
  resetCollectibles(world);
}

/** Laat de auto springen (of bewaart de vraag kort als hij nog in de lucht is). */
export function jump(world: WorldState): void {
  requestJump(world.car);
}

function clearEvents(world: WorldState): void {
  world.events.jumped = false;
  world.events.landed = false;
  world.events.bumped = false;
  world.events.scored = false;
  world.events.boosted = false;
  world.events.rainbowPiece = false;
  world.events.rainbowRide = false;
}

export function updateWorld(world: WorldState, dt: number): void {
  clearEvents(world);
  world.time += dt;

  // Doelsnelheid: sneller tijdens turbo en regenboogrit.
  world.targetSpeed =
    world.rainbowRide > 0
      ? SPEED.base * RAINBOW.rideSpeedFactor
      : world.boostTimer > 0
        ? SPEED.base * BOOST.speedFactor
        : SPEED.base;

  // Automatisch optrekken naar de doelsnelheid (lineair, framerate-onafhankelijk).
  // Na een botsing trekt de auto zo vanzelf weer op.
  const accel = world.targetSpeed / SPEED.accelerationTime;
  if (world.speed < world.targetSpeed) {
    world.speed = Math.min(world.targetSpeed, world.speed + accel * dt);
  } else if (world.speed > world.targetSpeed) {
    world.speed = Math.max(world.targetSpeed, world.speed - accel * dt);
  }

  if (world.rainbowRide > 0) {
    floatCar(world.car, world.speed, dt, WORLD.groundY - RAINBOW.rideHeight, world.time);
  } else {
    updateCar(world.car, world.speed, dt, world.events, world.platforms);
  }
  if (world.events.jumped) world.jumpCount++;
  world.distance = world.car.x;

  updateObstacles(world, dt);
  updateCollectibles(world, dt);
}
