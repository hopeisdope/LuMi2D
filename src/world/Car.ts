import { CAR, WORLD } from '../config';
import type { Car } from '../types';

export function createCar(): Car {
  return {
    x: 0,
    y: WORLD.groundY,
    vy: 0,
    onGround: true,
    width: CAR.width,
    height: CAR.height,
    wheelRadius: CAR.wheelRadius,
    wheelAngle: 0,
  };
}

export function resetCar(car: Car): void {
  car.x = 0;
  car.y = WORLD.groundY;
  car.vy = 0;
  car.onGround = true;
  car.wheelAngle = 0;
}

/** Werkt de auto bij. Verticale beweging (springen/zwaartekracht) volgt in fase 2. */
export function updateCar(car: Car, speed: number, dt: number): void {
  const distance = speed * dt;
  car.x += distance;
  // Wielrotatie volgt de afgelegde afstand: hoek = afstand / straal.
  car.wheelAngle = (car.wheelAngle + distance / car.wheelRadius) % (Math.PI * 2);
}
