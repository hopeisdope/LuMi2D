import { BOOST, ENEMIES, FRIENDS, MISSION, OBSTACLES, RAINBOW, RIDE, SCENES, SPEED, WORLD } from '../config';
import type { WorldState } from '../types';
import { createCar, floatCar, requestJump, resetCar, updateCar } from './Car';
import { createCollectiblePool, createPlatformPool, resetCollectibles, updateCollectibles } from './Collectibles';
import { createObstaclePool, resetObstacles, updateObstacles } from './Obstacles';
import { createPadPool, resetPads, updatePads } from './Pads';
import { resetScene, updateScene } from './Scenes';
import { createFriendPool, reactFriends, resetFriends, updateFriends } from './Friends';
import { startMission, updateMission } from './Mission';
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
    pads: createPadPool(),
    scene: { active: false, kind: 'ducks', x: 0, triggerTime: -1, passTime: -1 },
    nextSceneAt: SCENES.first,
    boostTimer: 0,
    shieldTimer: 0,
    rainbowPieces: 0,
    rainbowRide: 0,
    rainbowRides: 0,
    finishX: RIDE.length,
    ridePhase: 'riding',
    finishTime: -1,
    parkedTime: -1,
    finishFriends: false,
    mission: { kind: 'stars', target: MISSION.targets.stars, count: 0, doneTime: -1 },
    theme: 'meadow',
    friends: createFriendPool(),
    nextFriendAt: FRIENDS.firstDistance,
    coaching: true,
    cleanJumps: 0,
    lastJumpTime: -1,
    lastJumpX: 0,
    lastJumpY: WORLD.groundY,
    lastLandTime: -1,
    lastLandX: 0,
    lastLandY: WORLD.groundY,
    car: createCar(),
    events: {
      jumped: false,
      landed: false,
      bumped: false,
      scored: false,
      boosted: false,
      rainbowPiece: false,
      rainbowRide: false,
      friendCheer: false,
      friendGift: false,
      friendDemo: false,
      cleared: false,
      bounced: false,
      sceneStart: false,
      scenePass: false,
      friendJump: false,
      missionDone: false,
      finished: false,
      parked: false,
    },
  };
}

/** Nieuwe ronde. De instellingen (obstakels/vijanden aan/uit, wereld) blijven behouden. */
export function resetWorld(world: WorldState, seed: number = randomSeed()): void {
  world.speed = 0;
  world.targetSpeed = SPEED.base;
  world.distance = 0;
  world.time = 0;
  world.jumpCount = 0;
  world.score = 0;
  world.lastScoreTime = -1;
  world.coaching = true;
  world.cleanJumps = 0;
  world.lastJumpTime = -1;
  world.lastLandTime = -1;
  world.rainbowRides = 0;
  world.finishX = RIDE.length;
  world.ridePhase = 'riding';
  world.finishTime = -1;
  world.parkedTime = -1;
  world.finishFriends = false;
  startMission(world);
  world.random = createRandom(seed);
  clearEvents(world);
  resetCar(world.car);
  resetObstacles(world);
  resetCollectibles(world);
  resetPads(world);
  resetScene(world);
  resetFriends(world);
}

/** Laat de auto springen (of bewaart de vraag kort als hij nog in de lucht is). Na de finish niet meer. */
export function jump(world: WorldState): void {
  if (world.ridePhase !== 'riding') return;
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
  world.events.friendCheer = false;
  world.events.friendGift = false;
  world.events.friendDemo = false;
  world.events.cleared = false;
  world.events.bounced = false;
  world.events.sceneStart = false;
  world.events.scenePass = false;
  world.events.friendJump = false;
  world.events.missionDone = false;
  world.events.finished = false;
  world.events.parked = false;
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
  if (world.ridePhase !== 'riding') brakeToGarage(world);
  // Verrassing: bv. wachten op overstekende eendjes (remt alleen, versnelt nooit).
  updateScene(world);

  if (world.rainbowRide > 0) {
    floatCar(world.car, world.speed, dt, WORLD.groundY - RAINBOW.rideHeight, world.time);
  } else {
    updateCar(world.car, world.speed, dt, world.events, world.platforms);
  }
  if (world.events.jumped) {
    world.jumpCount++;
    world.lastJumpTime = world.time;
    world.lastJumpX = world.car.x;
    world.lastJumpY = world.car.y;
  }
  if (world.ridePhase === 'riding' && world.car.x >= world.finishX) {
    // Over de finish: turbo en regenboogrit stoppen, de auto rijdt rustig uit naar de garage.
    world.ridePhase = 'finishing';
    world.finishTime = world.time;
    world.rainbowRide = 0;
    world.boostTimer = 0;
    world.events.finished = true;
  }
  if (world.events.landed) {
    world.lastLandTime = world.time;
    world.lastLandX = world.car.x;
    world.lastLandY = world.car.y;
  }
  world.distance = world.car.x;

  updatePads(world);
  updateObstacles(world, dt);
  updateCollectibles(world, dt);
  updateFriends(world);

  // Springen vlak bij een vriendje: het vriendje danst mee (en het telt voor die opdracht).
  const e = world.events;
  if (e.jumped && friendNearCar(world)) e.friendJump = true;
  if (e.rainbowRide) world.rainbowRides++;
  updateMission(world);

  // Vriendjes in beeld reageren op wat het kind doet.
  if (e.rainbowPiece || e.rainbowRide || e.boosted || e.friendJump || e.bounced) reactFriends(world, 'dance');
  else if (e.bumped) reactFriends(world, 'surprised');
  else if (e.scored) reactFriends(world, 'thumbs');
}

/**
 * Na de finish: zacht afremmen zodat de auto precies in de garage stopt (v = √(2·a·resterend)).
 * Pas als hij op de grond staat, telt hij als geparkeerd.
 */
function brakeToGarage(world: WorldState): void {
  if (world.ridePhase === 'parked') {
    world.speed = 0;
    return;
  }
  const remaining = world.finishX + RIDE.garageDistance - world.car.x;
  const limit = Math.sqrt(2 * RIDE.brake * Math.max(0, remaining));
  world.targetSpeed = Math.min(world.targetSpeed, limit);
  world.speed = Math.min(world.speed, limit);
  if (remaining <= 1 && world.car.onGround) {
    world.speed = 0;
    world.ridePhase = 'parked';
    world.parkedTime = world.time;
    world.events.parked = true;
  }
}

/** Staat er een vriendje vlak bij de auto? */
function friendNearCar(world: WorldState): boolean {
  for (let i = 0; i < world.friends.length; i++) {
    const f = world.friends[i];
    if (f.active && Math.abs(f.x - world.car.x) < MISSION.friendJumpDistance) return true;
  }
  return false;
}
