import { CAR, JUMP, JUMP_PHYSICS, PLATFORMS, WORLD } from '../config';
import type { Car, Platform, WorldEvents } from '../types';

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

/** Staat de auto (met wat marge) boven dit platform? */
function overPlatform(car: Car, p: Platform): boolean {
  return p.active && car.x >= p.x - PLATFORMS.edgeMargin && car.x <= p.x + p.width + PLATFORMS.edgeMargin;
}

/** Werkt de auto bij: voortbeweging, sprong, zwaartekracht en platforms. */
export function updateCar(car: Car, speed: number, dt: number, events: WorldEvents, platforms: readonly Platform[]): void {
  const distance = speed * dt;
  car.x += distance;
  // Wielrotatie volgt de afgelegde afstand: hoek = afstand / straal.
  car.wheelAngle = (car.wheelAngle + distance / car.wheelRadius) % (Math.PI * 2);

  if (car.landingTimer > 0) car.landingTimer = Math.max(0, car.landingTimer - dt);
  if (car.bumpTimer > 0) car.bumpTimer = Math.max(0, car.bumpTimer - dt);

  // Van een platform afgereden? Dan valt de auto (zonder sprong).
  if (car.onGround && car.y < WORLD.groundY) {
    let supported = false;
    for (let i = 0; i < platforms.length; i++) {
      if (overPlatform(car, platforms[i]) && Math.abs(platforms[i].top - car.y) < 1) supported = true;
    }
    if (!supported) {
      car.onGround = false;
      car.vy = 0;
    }
  }

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
    const prevY = car.y;
    car.y += car.vy * dt + 0.5 * g * dt * dt;
    car.vy += g * dt;

    // Landen op een platform: alleen van bovenaf (eronderdoor rijden of springen kan gewoon).
    let landY: number = WORLD.groundY;
    if (car.vy > 0) {
      for (let i = 0; i < platforms.length; i++) {
        const p = platforms[i];
        if (overPlatform(car, p) && prevY <= p.top && car.y >= p.top && p.top < landY) landY = p.top;
      }
    }

    if (car.y >= landY && car.vy > 0) {
      car.y = landY;
      car.vy = 0;
      car.onGround = true;
      car.landingTimer = JUMP.landingTime;
      events.landed = true;
    }
  }
}

/**
 * Regenboogrit: de auto zweeft vanzelf op een vaste hoogte (met een zacht golfje).
 * Geen bediening nodig; springvragen worden genegeerd.
 */
export function floatCar(car: Car, speed: number, dt: number, targetY: number, time: number): void {
  const distance = speed * dt;
  car.x += distance;
  car.wheelAngle = (car.wheelAngle + distance / car.wheelRadius) % (Math.PI * 2);
  const goal = targetY + Math.sin(time * 3) * 8;
  car.y += (goal - car.y) * Math.min(1, dt * 4);
  car.vy = 0;
  car.onGround = false;
  car.jumpBuffer = 0;
  car.landingTimer = 0;
}
