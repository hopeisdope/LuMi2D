import { SPEED } from '../config';
import type { WorldState } from '../types';
import { createCar, requestJump, resetCar, updateCar } from './Car';

/**
 * Pure game-logica van de wereld: geen rendering, geen input.
 * Latere fases voegen hier obstakels, botsingen en score aan toe.
 */
export function createWorld(): WorldState {
  return {
    speed: 0,
    targetSpeed: SPEED.base,
    distance: 0,
    time: 0,
    jumpCount: 0,
    car: createCar(),
    events: { jumped: false, landed: false },
  };
}

export function resetWorld(world: WorldState): void {
  world.speed = 0;
  world.targetSpeed = SPEED.base;
  world.distance = 0;
  world.time = 0;
  world.jumpCount = 0;
  world.events.jumped = false;
  world.events.landed = false;
  resetCar(world.car);
}

/** Laat de auto springen (of bewaart de vraag kort als hij nog in de lucht is). */
export function jump(world: WorldState): void {
  requestJump(world.car);
}

export function updateWorld(world: WorldState, dt: number): void {
  world.events.jumped = false;
  world.events.landed = false;
  world.time += dt;

  // Automatisch optrekken naar de doelsnelheid (lineair, framerate-onafhankelijk).
  const accel = world.targetSpeed / SPEED.accelerationTime;
  if (world.speed < world.targetSpeed) {
    world.speed = Math.min(world.targetSpeed, world.speed + accel * dt);
  } else if (world.speed > world.targetSpeed) {
    world.speed = Math.max(world.targetSpeed, world.speed - accel * dt);
  }

  updateCar(world.car, world.speed, dt, world.events);
  if (world.events.jumped) world.jumpCount++;
  world.distance = world.car.x;
}
