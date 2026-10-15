import { BUMP, CAR, COLORS, JUMP, JUMP_PHYSICS, WORLD, type CarStyle } from '../config';
import type { Car } from '../types';
import { roundRectPath } from './shapes';

/**
 * Tekent de auto met eenvoudige vormen, in de gekozen stijl.
 * (screenX, car.y) = midden-onderkant van de wielen. Leest alleen state.
 */
export class CarRenderer {
  constructor(private readonly ctx: CanvasRenderingContext2D) {}

  render(car: Car, screenX: number, time: number, moving: boolean, style: CarStyle): void {
    const { ctx } = this;
    const w = car.width;
    const h = car.height;

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

    const bob = moving && car.onGround ? Math.sin(time * CAR.bobFrequency) * CAR.bobAmplitude : 0;
    this.drawBody(style, w, h, car.wheelRadius, car.wheelAngle, bob);
    ctx.restore();
  }

  /**
   * Tekent een auto in lokale coördinaten (oorsprong = midden-onderkant van de wielen).
   * Ook gebruikt voor de auto-kiezer, met een eigen schaal.
   */
  drawBody(style: CarStyle, w: number, h: number, r: number, wheelAngle: number, bob = 0): void {
    switch (style.shape) {
      case 'classic':
        this.classic(style, w, h, r, bob);
        break;
      case 'racer':
        this.racer(style, w, h, r, bob);
        break;
      case 'jeep':
        this.jeep(style, w, h, r, bob);
        break;
      case 'bubble':
        this.bubble(style, w, h, r, bob);
        break;
    }
    const wheelR = style.shape === 'jeep' ? r * 1.12 : r;
    const inset = style.shape === 'jeep' ? 0.2 : 0.22;
    this.drawWheel(-w / 2 + w * inset, -wheelR, wheelR, wheelAngle);
    this.drawWheel(w / 2 - w * inset, -wheelR, wheelR, wheelAngle);
  }

  private classic(s: CarStyle, w: number, h: number, r: number, bob: number): void {
    const { ctx } = this;
    const left = -w / 2;
    const bodyBottom = -r * 0.9 + bob;
    const bodyTop = bodyBottom - h * 0.5;
    const cabinTop = bodyTop - h * 0.5;

    ctx.fillStyle = s.bodyDark;
    ctx.beginPath();
    ctx.moveTo(left + w * 0.2, bodyTop);
    ctx.lineTo(left + w * 0.32, cabinTop);
    ctx.lineTo(left + w * 0.68, cabinTop);
    ctx.lineTo(left + w * 0.84, bodyTop);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = s.window;
    const winTop = cabinTop + 7;
    ctx.beginPath();
    ctx.moveTo(left + w * 0.27, bodyTop);
    ctx.lineTo(left + w * 0.355, winTop);
    ctx.lineTo(left + w * 0.49, winTop);
    ctx.lineTo(left + w * 0.49, bodyTop);
    ctx.closePath();
    ctx.moveTo(left + w * 0.53, bodyTop);
    ctx.lineTo(left + w * 0.53, winTop);
    ctx.lineTo(left + w * 0.655, winTop);
    ctx.lineTo(left + w * 0.77, bodyTop);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = s.body;
    ctx.beginPath();
    roundRectPath(ctx, left, bodyTop, w, bodyBottom - bodyTop, 14);
    ctx.fill();
    this.lights(s, left, w, bodyTop);
  }

  private racer(s: CarStyle, w: number, h: number, r: number, bob: number): void {
    const { ctx } = this;
    const left = -w / 2;
    const bodyBottom = -r * 0.8 + bob;
    const bodyTop = bodyBottom - h * 0.4;
    const cabinTop = bodyTop - h * 0.34;

    // Spoiler achterop
    ctx.fillStyle = s.bodyDark;
    ctx.fillRect(left + 6, bodyTop - 22, 8, 22);
    ctx.beginPath();
    roundRectPath(ctx, left - 4, bodyTop - 28, 34, 9, 4);
    ctx.fill();

    // Lage, gestroomlijnde cabine met één lang raam
    ctx.beginPath();
    ctx.moveTo(left + w * 0.28, bodyTop);
    ctx.quadraticCurveTo(left + w * 0.36, cabinTop, left + w * 0.5, cabinTop);
    ctx.quadraticCurveTo(left + w * 0.66, cabinTop, left + w * 0.76, bodyTop);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = s.window;
    ctx.beginPath();
    ctx.moveTo(left + w * 0.34, bodyTop);
    ctx.quadraticCurveTo(left + w * 0.4, cabinTop + 6, left + w * 0.5, cabinTop + 6);
    ctx.quadraticCurveTo(left + w * 0.62, cabinTop + 6, left + w * 0.69, bodyTop);
    ctx.closePath();
    ctx.fill();

    // Carrosserie met spitse neus
    ctx.fillStyle = s.body;
    ctx.beginPath();
    ctx.moveTo(left + 10, bodyTop);
    ctx.lineTo(left + w - 22, bodyTop + 4);
    ctx.quadraticCurveTo(left + w + 4, bodyTop + 10, left + w, bodyBottom);
    ctx.lineTo(left + 4, bodyBottom);
    ctx.quadraticCurveTo(left, bodyTop, left + 10, bodyTop);
    ctx.closePath();
    ctx.fill();

    // Racestreep en nummerrondje
    ctx.fillStyle = s.accent;
    ctx.fillRect(left + 12, bodyTop + (bodyBottom - bodyTop) * 0.45, w - 30, 5);
    ctx.beginPath();
    ctx.arc(left + w * 0.5, bodyTop + (bodyBottom - bodyTop) * 0.5, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = s.bodyDark;
    ctx.fillRect(left + w * 0.5 - 1.5, bodyTop + (bodyBottom - bodyTop) * 0.5 - 6, 3, 12);
    this.lights(s, left, w, bodyTop + 2, '#fff59d');
  }

  private jeep(s: CarStyle, w: number, h: number, r: number, bob: number): void {
    const { ctx } = this;
    const left = -w / 2;
    const bodyBottom = -r * 1.05 + bob;
    const bodyTop = bodyBottom - h * 0.5;
    const cabinTop = bodyTop - h * 0.52;

    // Reservewiel achterop
    ctx.fillStyle = COLORS.carWheel;
    ctx.beginPath();
    ctx.arc(left - 2, bodyTop + 14, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = s.accent;
    ctx.beginPath();
    ctx.arc(left - 2, bodyTop + 14, 6, 0, Math.PI * 2);
    ctx.fill();

    // Hoekige cabine met twee rechte ramen en een imperiaal
    ctx.fillStyle = s.bodyDark;
    ctx.beginPath();
    roundRectPath(ctx, left + w * 0.14, cabinTop, w * 0.6, bodyTop - cabinTop + 4, 6);
    ctx.fill();
    ctx.fillRect(left + w * 0.18, cabinTop - 6, w * 0.52, 4);
    ctx.fillStyle = s.window;
    ctx.fillRect(left + w * 0.19, cabinTop + 7, w * 0.23, bodyTop - cabinTop - 9);
    ctx.fillRect(left + w * 0.46, cabinTop + 7, w * 0.23, bodyTop - cabinTop - 9);

    ctx.fillStyle = s.body;
    ctx.beginPath();
    roundRectPath(ctx, left, bodyTop, w, bodyBottom - bodyTop, 8);
    ctx.fill();
    // Bumper
    ctx.fillStyle = s.accent;
    ctx.fillRect(left + w - 8, bodyBottom - 10, 12, 8);
    this.lights(s, left, w, bodyTop, '#fff59d');
  }

  private bubble(s: CarStyle, w: number, h: number, r: number, bob: number): void {
    const { ctx } = this;
    const bodyBottom = -r * 0.9 + bob;
    const bodyTop = bodyBottom - h * 0.48;
    const domeR = w * 0.27;

    // Koepeldak met rond raam
    ctx.fillStyle = s.bodyDark;
    ctx.beginPath();
    ctx.arc(w * 0.02, bodyTop + 4, domeR, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = s.window;
    ctx.beginPath();
    ctx.arc(w * 0.02, bodyTop + 4, domeR - 7, Math.PI, Math.PI * 2);
    ctx.fill();

    // Ronde carrosserie
    ctx.fillStyle = s.body;
    ctx.beginPath();
    roundRectPath(ctx, -w / 2, bodyTop, w, bodyBottom - bodyTop, (bodyBottom - bodyTop) / 2);
    ctx.fill();
    // Stippen
    ctx.fillStyle = s.accent;
    ctx.beginPath();
    ctx.arc(-w * 0.12, bodyTop + 16, 5, 0, Math.PI * 2);
    ctx.arc(w * 0.12, bodyTop + 20, 4, 0, Math.PI * 2);
    ctx.fill();
    this.lights(s, -w / 2, w, bodyTop + 4, '#fff59d');
  }

  /** Koplamp rechts (rijrichting) en achterlicht links. */
  private lights(s: CarStyle, left: number, w: number, top: number, headlight: string = s.accent): void {
    const { ctx } = this;
    ctx.fillStyle = headlight;
    ctx.beginPath();
    roundRectPath(ctx, left + w - 14, top + 8, 12, 10, 4);
    ctx.fill();
    ctx.fillStyle = s.bodyDark;
    ctx.fillRect(left + 2, top + 8, 8, 10);
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
