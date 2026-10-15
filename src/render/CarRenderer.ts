import { BUMP, CAR, COLORS, JUMP, JUMP_PHYSICS, WORLD } from '../config';
import type { Car } from '../types';
import { roundRectPath } from './shapes';

/** Tekent de auto met eenvoudige vormen. (screenX, car.y) = midden-onderkant van de wielen. Leest alleen state. */
export class CarRenderer {
  constructor(private readonly ctx: CanvasRenderingContext2D) {}

  render(car: Car, screenX: number, time: number, moving: boolean): void {
    const { ctx } = this;
    const w = car.width;
    const h = car.height;
    const r = car.wheelRadius;

    // Schaduw blijft op de grond en wordt kleiner naarmate de auto hoger is.
    const lift = Math.min(1, Math.max(0, (WORLD.groundY - car.y) / JUMP.height));
    const shadowScale = 1 - lift * 0.5;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.beginPath();
    ctx.ellipse(screenX, WORLD.groundY + 2, w * 0.5 * shadowScale, 7 * shadowScale, 0, 0, Math.PI * 2);
    ctx.fill();

    // Kanteling in de lucht (neus omhoog bij stijgen) en inveren na de landing.
    let tilt = car.onGround ? 0 : (car.vy / JUMP_PHYSICS.velocity) * JUMP.maxTilt;
    if (car.bumpTimer > 0) {
      // Wiebelen na een botsing, uitdovend.
      const k = car.bumpTimer / BUMP.duration;
      tilt += Math.sin(car.bumpTimer * 28) * BUMP.wobble * k;
    }
    const squash = car.landingTimer > 0 ? Math.sin((car.landingTimer / JUMP.landingTime) * Math.PI) * JUMP.landingSquash : 0;

    ctx.save();
    // Lokaal assenstelsel: oorsprong = midden-onderkant van de wielen.
    ctx.translate(screenX, car.y);
    if (tilt !== 0) {
      // Draaien rond het midden van de auto i.p.v. de onderkant.
      ctx.translate(0, -h * 0.5);
      ctx.rotate(tilt);
      ctx.translate(0, h * 0.5);
    }
    if (squash !== 0) ctx.scale(1 + squash * 0.5, 1 - squash);

    const left = -w / 2;
    const groundY = 0;
    const bob = moving && car.onGround ? Math.sin(time * CAR.bobFrequency) * CAR.bobAmplitude : 0;
    const bodyBottom = groundY - r * 0.9 + bob;
    const bodyTop = bodyBottom - h * 0.5;
    const cabinTop = bodyTop - h * 0.5;

    // Cabine
    ctx.fillStyle = COLORS.carBodyDark;
    ctx.beginPath();
    ctx.moveTo(left + w * 0.2, bodyTop);
    ctx.lineTo(left + w * 0.32, cabinTop);
    ctx.lineTo(left + w * 0.68, cabinTop);
    ctx.lineTo(left + w * 0.84, bodyTop);
    ctx.closePath();
    ctx.fill();

    // Ramen
    ctx.fillStyle = COLORS.carWindow;
    const winTop = cabinTop + 7;
    const winBottom = bodyTop;
    ctx.beginPath();
    ctx.moveTo(left + w * 0.27, winBottom);
    ctx.lineTo(left + w * 0.355, winTop);
    ctx.lineTo(left + w * 0.49, winTop);
    ctx.lineTo(left + w * 0.49, winBottom);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(left + w * 0.53, winBottom);
    ctx.lineTo(left + w * 0.53, winTop);
    ctx.lineTo(left + w * 0.655, winTop);
    ctx.lineTo(left + w * 0.77, winBottom);
    ctx.closePath();
    ctx.fill();

    // Carrosserie
    ctx.fillStyle = COLORS.carBody;
    ctx.beginPath();
    roundRectPath(ctx, left, bodyTop, w, bodyBottom - bodyTop, 14);
    ctx.fill();

    // Koplamp (rechts = rijrichting) en achterlicht
    ctx.fillStyle = COLORS.carLight;
    ctx.beginPath();
    roundRectPath(ctx, left + w - 14, bodyTop + 8, 12, 10, 4);
    ctx.fill();
    ctx.fillStyle = COLORS.carBodyDark;
    ctx.fillRect(left + 2, bodyTop + 8, 8, 10);

    // Wielen
    this.drawWheel(left + w * 0.22, groundY - r, r, car.wheelAngle);
    this.drawWheel(left + w * 0.78, groundY - r, r, car.wheelAngle);
    ctx.restore();
  }

  private drawWheel(cx: number, cy: number, r: number, angle: number): void {
    const { ctx } = this;
    ctx.fillStyle = COLORS.carWheel;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = COLORS.carHub;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.5, 0, Math.PI * 2);
    ctx.fill();
    // Spaken laten de rotatie zien
    ctx.strokeStyle = COLORS.carWheel;
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let i = 0; i < 3; i++) {
      const a = angle + (i * Math.PI) / 3;
      const dx = Math.cos(a) * r * 0.5;
      const dy = Math.sin(a) * r * 0.5;
      ctx.moveTo(cx - dx, cy - dy);
      ctx.lineTo(cx + dx, cy + dy);
    }
    ctx.stroke();
  }
}
