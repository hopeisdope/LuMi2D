import { COLORS, RAINBOW, SCORE } from '../config';
import type { WorldState } from '../types';
import { starPath } from './shapes';

/** Korte feedback-animaties rond de auto. Leest alleen state. */
export class EffectsRenderer {
  constructor(private readonly ctx: CanvasRenderingContext2D) {}

  /** Effecten achter de auto: snelheidsstrepen bij turbo, regenboogspoor tijdens de rit, glinsters bij het schild. */
  renderBehind(world: WorldState, carScreenX: number): void {
    const { ctx } = this;
    const car = world.car;
    const midY = car.y - car.height * 0.55;

    if (world.rainbowRide > 0) {
      // Regenboogspoor: drie banen die naar achteren uitwaaieren.
      const fadeIn = Math.min(1, (RAINBOW.rideDuration - world.rainbowRide) * 3);
      ctx.save();
      ctx.globalAlpha = 0.85 * fadeIn;
      ctx.lineCap = 'round';
      for (let i = 0; i < RAINBOW.colors.length; i++) {
        ctx.strokeStyle = RAINBOW.colors[i];
        ctx.lineWidth = 12;
        ctx.beginPath();
        const y0 = midY - 14 + i * 12;
        ctx.moveTo(carScreenX - car.width * 0.4, y0);
        for (let x = 0; x <= 260; x += 20) {
          ctx.lineTo(carScreenX - car.width * 0.4 - x, y0 + Math.sin((world.time * 6 - x * 0.03)) * 6 + x * 0.12);
        }
        ctx.stroke();
      }
      ctx.restore();
    } else if (world.boostTimer > 0) {
      // Snelheidsstrepen en een vlammetje achter de auto.
      const k = Math.min(1, world.boostTimer / 0.5);
      ctx.save();
      ctx.globalAlpha = 0.7 * k;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      for (let i = 0; i < 5; i++) {
        const y = midY - 30 + i * 15;
        const len = 50 + ((i * 37 + Math.floor(world.time * 20) * 13) % 50);
        const x0 = carScreenX - car.width * 0.55 - ((world.time * 600 + i * 47) % 60);
        ctx.beginPath();
        ctx.moveTo(x0, y);
        ctx.lineTo(x0 - len, y);
        ctx.stroke();
      }
      ctx.fillStyle = COLORS.boost;
      const flicker = 14 + Math.sin(world.time * 40) * 5;
      ctx.beginPath();
      ctx.moveTo(carScreenX - car.width / 2, car.y - 34);
      ctx.lineTo(carScreenX - car.width / 2 - flicker - 12, car.y - 26);
      ctx.lineTo(carScreenX - car.width / 2, car.y - 18);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    if (world.shieldTimer > 0) {
      // Glinsters rond de auto: even onkwetsbaar na de regenboogrit.
      ctx.save();
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 6; i++) {
        const a = world.time * 3 + (i * Math.PI) / 3;
        ctx.globalAlpha = 0.5 + 0.5 * Math.sin(world.time * 8 + i);
        ctx.beginPath();
        starPath(ctx, carScreenX + Math.cos(a) * car.width * 0.6, midY + Math.sin(a) * car.height * 0.8, 6, 2.5);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  render(world: WorldState, carScreenX: number): void {
    if (world.lastScoreTime < 0) return;
    const t = world.time - world.lastScoreTime;
    if (t < 0 || t > SCORE.popDuration) return;

    // Ster stijgt op boven de auto, groeit even en vervaagt.
    const k = t / SCORE.popDuration;
    const { ctx } = this;
    const x = carScreenX;
    const y = world.car.y - world.car.height - 40 - k * 70;
    const size = 22 * (1 + Math.sin(Math.min(1, k * 3) * Math.PI) * 0.4);
    ctx.save();
    ctx.globalAlpha = 1 - k * k;
    ctx.translate(x, y);
    ctx.rotate(k * 1.2);
    ctx.fillStyle = COLORS.star;
    ctx.strokeStyle = COLORS.starOutline;
    ctx.lineWidth = 4;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    starPath(ctx, 0, 0, size, size * 0.48);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
}
