import { CAR, JUMP, JUMP_PHYSICS, WORLD } from '../config';
import type { Car, WorldEvents } from '../types';

export function createCar(): Car {
  return {
    x: 0,
    y: WORLD.groundY,
    vy: 0,
    onGround: true,
    jumpBuffer: 0,
    landingTimer: 0,
    width: CAR.width,
    height: CAR.height,
    wheelRadius: CAR.wheelRadius,
    wheelAngle: 0,
    bumpTimer: 0,
  };
}

export function resetCar(car: Car): void {
  car.x = 0;
  car.y = WORLD.groundY;
  car.vy = 0;
  car.onGround = true;
  car.jumpBuffer = 0;
  car.landingTimer = 0;
  car.wheelAngle = 0;
  car.bumpTimer = 0;
}

/**
 * Vraagt een sprong aan. Staat de auto op de grond, dan springt hij in de
 * volgende update; zit hij nog in de lucht, dan wordt de vraag kort bewaard
 * en springt hij direct bij de landing. Geen dubbele sprong in de lucht.
 */
export function requestJump(car: Car): void {
  car.jumpBuffer = JUMP.bufferTime;
}

/** Werkt de auto bij: voortbeweging, sprong en zwaartekracht. */
export function updateCar(car: Car, speed: number, dt: number, events: WorldEvents): void {
  const distance = speed * dt;
  car.x += distance;
  // Wielrotatie volgt de afgelegde afstand: hoek = afstand / straal.
  car.wheelAngle = (car.wheelAngle + distance / car.wheelRadius) % (Math.PI * 2);

  if (car.landingTimer > 0) car.landingTimer = Math.max(0, car.landingTimer - dt);
  if (car.bumpTimer > 0) car.bumpTimer = Math.max(0, car.bumpTimer - dt);

  if (car.jumpBuffer > 0) {
    if (car.onGround) {
      car.vy = -JUMP_PHYSICS.velocity;
      car.onGround = false;
      car.jumpBuffer = 0;
      car.landingTimer = 0;
      events.jumped = true;
    } else {
      car.jumpBuffer = Math.max(0, car.jumpBuffer - dt);
    }
  }

  if (!car.onGround) {
    // Exacte integratie bij constante zwaartekracht: dezelfde boog bij elke framerate.
    const g = JUMP_PHYSICS.gravity;
    car.y += car.vy * dt + 0.5 * g * dt * dt;
    car.vy += g * dt;

    if (car.y >= WORLD.groundY && car.vy > 0) {
      car.y = WORLD.groundY;
      car.vy = 0;
      car.onGround = true;
      car.landingTimer = JUMP.landingTime;
      events.landed = true;
    }
  }
}
