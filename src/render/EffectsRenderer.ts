import { COLORS, SCORE } from '../config';
import type { WorldState } from '../types';
import { starPath } from './shapes';

/** Korte feedback-animaties rond de auto. Leest alleen state. */
export class EffectsRenderer {
  constructor(private readonly ctx: CanvasRenderingContext2D) {}

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
