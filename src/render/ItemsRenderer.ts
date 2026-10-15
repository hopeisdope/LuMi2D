import { COLLECTIBLES, COLORS, PLATFORMS, RAINBOW } from '../config';
import type { Collectible, WorldState } from '../types';
import { roundRectPath, starPath } from './shapes';

/** Duur (s) van de verdwijn-animatie na het pakken. */
const COLLECT_TIME = 0.4;

/** Tekent platforms en dingen om te pakken (turbo, regenboogstukjes, sterren). Leest alleen state. */
export class ItemsRenderer {
  constructor(private readonly ctx: CanvasRenderingContext2D) {}

  renderPlatforms(world: WorldState, carScreenX: number, viewWidth: number): void {
    const { ctx } = this;
    for (let i = 0; i < world.platforms.length; i++) {
      const p = world.platforms[i];
      if (!p.active) continue;
      const sx = carScreenX + (p.x - world.car.x);
      if (sx > viewWidth + 50 || sx + p.width < -50) continue;
      // Zacht schaduwtje op de weg, zodat kinderen zien waar het platform is.
      ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
      ctx.beginPath();
      ctx.ellipse(sx + p.width / 2, p.top + PLATFORMS.height + 4, p.width * 0.45, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      // Zwevend blok met een lichte bovenkant en stipjes.
      ctx.fillStyle = COLORS.platform;
      ctx.beginPath();
      roundRectPath(ctx, sx, p.top, p.width, PLATFORMS.thickness, 11);
      ctx.fill();
      ctx.fillStyle = COLORS.platformTop;
      ctx.beginPath();
      roundRectPath(ctx, sx, p.top, p.width, 8, 4);
      ctx.fill();
      ctx.fillStyle = COLORS.platformDots;
      for (let d = 24; d < p.width - 10; d += 36) {
        ctx.beginPath();
        ctx.arc(sx + d, p.top + 14, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  renderCollectibles(world: WorldState, carScreenX: number, viewWidth: number): void {
    for (let i = 0; i < world.collectibles.length; i++) {
      const c = world.collectibles[i];
      if (!c.active) continue;
      const sx = carScreenX + (c.x - world.car.x);
      if (sx < -60 || sx > viewWidth + 60) continue;
      let scale = 1;
      let alpha = 1;
      let lift = 0;
      if (c.collected) {
        const t = (world.time - c.collectedTime) / COLLECT_TIME;
        if (t >= 1) continue;
        scale = 1 + t * 0.8;
        alpha = 1 - t;
        lift = t * 30;
      }
      // Zacht dobberen zodat het opvalt.
      const bob = c.collected ? 0 : Math.sin(world.time * 4 + c.x * 0.01) * 5;
      this.drawCollectible(c, sx, c.y + bob - lift, scale, alpha, world.time);
    }
  }

  private drawCollectible(c: Collectible, x: number, y: number, scale: number, alpha: number, time: number): void {
    const { ctx } = this;
    const r = COLLECTIBLES.radius;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    switch (c.kind) {
      case 'boost': {
        // Gloed + oranje rondje met een gele bliksem.
        ctx.fillStyle = 'rgba(255, 217, 59, 0.35)';
        ctx.beginPath();
        ctx.arc(0, 0, r + 8 + Math.sin(time * 8) * 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = COLORS.boost;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = COLORS.boostBolt;
        ctx.beginPath();
        ctx.moveTo(4, -18);
        ctx.lineTo(-10, 3);
        ctx.lineTo(-1, 3);
        ctx.lineTo(-5, 18);
        ctx.lineTo(10, -4);
        ctx.lineTo(1, -4);
        ctx.closePath();
        ctx.fill();
        break;
      }
      case 'rainbow': {
        // Boogje in de eigen kleur met een witte rand en een glinstering.
        ctx.rotate(Math.sin(time * 3) * 0.15);
        ctx.lineCap = 'round';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 18;
        ctx.beginPath();
        ctx.arc(0, 8, 18, Math.PI, Math.PI * 2);
        ctx.stroke();
        ctx.strokeStyle = RAINBOW.colors[c.colorIndex];
        ctx.lineWidth = 11;
        ctx.beginPath();
        ctx.arc(0, 8, 18, Math.PI, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = alpha * (0.5 + 0.5 * Math.sin(time * 6));
        ctx.beginPath();
        starPath(ctx, 14, -16, 6, 2.5);
        ctx.fill();
        break;
      }
      case 'star':
        ctx.rotate(Math.sin(time * 4 + c.x) * 0.2);
        ctx.fillStyle = COLORS.star;
        ctx.strokeStyle = COLORS.starOutline;
        ctx.lineWidth = 3;
        ctx.lineJoin = 'round';
        ctx.beginPath();
        starPath(ctx, 0, 0, 16, 7.5);
        ctx.fill();
        ctx.stroke();
        break;
    }
    ctx.restore();
  }
}
