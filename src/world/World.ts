import { SPEED } from '../config';
import type { WorldState } from '../types';
import { createCar, resetCar, updateCar } from './Car';

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
    car: createCar(),
  };
}

export function resetWorld(world: WorldState): void {
  world.speed = 0;
  world.targetSpeed = SPEED.base;
  world.distance = 0;
  world.time = 0;
  resetCar(world.car);
}

export function updateWorld(world: WorldState, dt: number): void {
  world.time += dt;

  // Automatisch optrekken naar de doelsnelheid (lineair, framerate-onafhankelijk).
  const accel = world.targetSpeed / SPEED.accelerationTime;
  if (world.speed < world.targetSpeed) {
    world.speed = Math.min(world.targetSpeed, world.speed + accel * dt);
  } else if (world.speed > world.targetSpeed) {
    world.speed = Math.max(world.targetSpeed, world.speed - accel * dt);
  }

  updateCar(world.car, world.speed, dt);
  world.distance = world.car.x;
}
