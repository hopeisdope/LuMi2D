import { COLORS, WORLD } from '../config';
import type { Obstacle, WorldState } from '../types';
import { roundRectPath } from './shapes';

/** Duur (s) van de tuimelanimatie na een botsing. */
const TUMBLE_TIME = 0.8;

/** Tekent obstakels met eenvoudige, vrolijke vormen. Leest alleen state. */
export class ObstacleRenderer {
  constructor(private readonly ctx: CanvasRenderingContext2D) {}

  /** @param carScreenX schermpositie van de auto; obstakels staan relatief daaraan. */
  render(world: WorldState, carScreenX: number, viewWidth: number): void {
    const pool = world.obstacles;
    for (let i = 0; i < pool.length; i++) {
      const o = pool[i];
      if (!o.active) continue;
      const sx = carScreenX + (o.x - world.car.x);
      if (sx < -150 || sx > viewWidth + 150) continue;
      this.drawObstacle(o, sx, world.time);
    }
  }

  private drawObstacle(o: Obstacle, sx: number, time: number): void {
    const { ctx } = this;
    let x = sx;
    let y = WORLD.groundY;
    let angle = 0;
    let alpha = 1;

    if (o.hit) {
      // Weggetikt: vliegt in een boogje naar voren, draait en vervaagt.
      const t = time - o.hitTime;
      if (t > TUMBLE_TIME) return;
      x += t * 420;
      y += -260 * t + 600 * t * t;
      angle = t * 9;
      alpha = 1 - t / TUMBLE_TIME;
    } else {
      // Schaduw
      ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
      ctx.beginPath();
      ctx.ellipse(x, y + 2, o.width * 0.55, 5, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(x, y - o.height / 2);
    if (angle !== 0) ctx.rotate(angle);
    // Lokaal: oorsprong = midden van het obstakel.
    const w = o.width;
    const h = o.height;
    switch (o.kind) {
      case 'cone':
        this.cone(w, h);
        break;
      case 'rock':
        this.rock(w, h);
        break;
      case 'crate':
        this.crate(w, h);
        break;
    }
    ctx.restore();
  }

  private cone(w: number, h: number): void {
    const { ctx } = this;
    const top = -h / 2;
    const bottom = h / 2;
    // Voetstuk
    ctx.fillStyle = COLORS.coneDark;
    ctx.beginPath();
    roundRectPath(ctx, -w / 2, bottom - 8, w, 8, 3);
    ctx.fill();
    // Kegel
    ctx.fillStyle = COLORS.cone;
    ctx.beginPath();
    ctx.moveTo(-5, top);
    ctx.lineTo(5, top);
    ctx.lineTo(w * 0.38, bottom - 8);
    ctx.lineTo(-w * 0.38, bottom - 8);
    ctx.closePath();
    ctx.fill();
    // Witte band
    ctx.fillStyle = COLORS.coneStripe;
    const bandTop = top + h * 0.38;
    const bandBottom = top + h * 0.56;
    const k = (w * 0.38 - 5) / (h - 8);
    ctx.beginPath();
    ctx.moveTo(-(5 + k * (bandTop - top)), bandTop);
    ctx.lineTo(5 + k * (bandTop - top), bandTop);
    ctx.lineTo(5 + k * (bandBottom - top), bandBottom);
    ctx.lineTo(-(5 + k * (bandBottom - top)), bandBottom);
    ctx.closePath();
    ctx.fill();
  }

  private rock(w: number, h: number): void {
    const { ctx } = this;
    ctx.fillStyle = COLORS.rock;
    ctx.beginPath();
    ctx.moveTo(-w / 2, h / 2);
    ctx.quadraticCurveTo(-w / 2, -h * 0.2, -w * 0.15, -h / 2);
    ctx.quadraticCurveTo(w * 0.3, -h * 0.6, w / 2, h * 0.1);
    ctx.lineTo(w / 2, h / 2);
    ctx.closePath();
    ctx.fill();
    // Lichtvlek voor wat volume
    ctx.fillStyle = COLORS.rockLight;
    ctx.beginPath();
    ctx.ellipse(-w * 0.12, -h * 0.15, w * 0.14, h * 0.12, -0.4, 0, Math.PI * 2);
    ctx.fill();
  }

  private crate(w: number, h: number): void {
    const { ctx } = this;
    ctx.fillStyle = COLORS.crateDark;
    ctx.beginPath();
    roundRectPath(ctx, -w / 2, -h / 2, w, h, 5);
    ctx.fill();
    ctx.fillStyle = COLORS.crate;
    ctx.beginPath();
    roundRectPath(ctx, -w / 2 + 5, -h / 2 + 5, w - 10, h - 10, 3);
    ctx.fill();
    // Kruislatten
    ctx.strokeStyle = COLORS.crateDark;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(-w / 2 + 6, -h / 2 + 6);
    ctx.lineTo(w / 2 - 6, h / 2 - 6);
    ctx.moveTo(w / 2 - 6, -h / 2 + 6);
    ctx.lineTo(-w / 2 + 6, h / 2 - 6);
    ctx.stroke();
  }
}
