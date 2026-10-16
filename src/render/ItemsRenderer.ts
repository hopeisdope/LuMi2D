import { BOUNCE, COLLECTIBLES, COLORS, FEEDBACK, PLATFORMS, RAINBOW, SPRITES, WORLD } from '../config';
import type { Collectible, Pad, WorldState } from '../types';
import { roundRectPath, starPath } from './shapes';
import { PAD_SPRITE } from './spriteData';
import { PROP_IMAGES, ready } from './sprites';

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

  /** Springkussens: altijd met stuiterende pijltjes omhoog, zodat duidelijk is dat je er hoog op springt. */
  renderPads(world: WorldState, carScreenX: number, viewWidth: number): void {
    for (let i = 0; i < world.pads.length; i++) {
      const p = world.pads[i];
      if (!p.active) continue;
      const sx = carScreenX + (p.x - world.car.x);
      if (sx < -80 || sx > viewWidth + 80) continue;
      this.drawPad(p, sx, world.time);
    }
  }

  private drawPad(p: Pad, x: number, time: number): void {
    const { ctx } = this;
    const ground = WORLD.groundY;
    const half = BOUNCE.width / 2;
    // Indeuken na gebruik: de mat zakt even in en veert terug.
    const since = p.usedTime < 0 ? Infinity : time - p.usedTime;
    const dip = since < 0.35 ? Math.sin((since / 0.35) * Math.PI) * 8 : 0;
    const top = ground - BOUNCE.height + dip;

    if (ready(PROP_IMAGES.pad)) {
      // Plaatje: de mat zakt in door het plaatje platter te maken (onderkant blijft op de grond).
      const w = SPRITES.padWidth;
      const h = (PAD_SPRITE.height / PAD_SPRITE.width) * w;
      const squash = h - dip * 0.6;
      ctx.drawImage(PROP_IMAGES.pad, x - w / 2, ground - squash, w, squash);
      this.padArrows(p, x, ground - h, time);
      return;
    }

    // Pootjes en veren.
    ctx.strokeStyle = COLORS.padFrame;
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x - half + 6, top + 4);
    ctx.lineTo(x - half + 2, ground);
    ctx.moveTo(x + half - 6, top + 4);
    ctx.lineTo(x + half - 2, ground);
    ctx.stroke();
    ctx.strokeStyle = COLORS.padSpring;
    ctx.lineWidth = 3;
    for (let k = -1; k <= 1; k++) {
      const sx = x + k * half * 0.5;
      ctx.beginPath();
      ctx.moveTo(sx, top + 6);
      for (let z = 1; z <= 4; z++) ctx.lineTo(sx + (z % 2 === 0 ? -5 : 5), top + 6 + ((ground - top - 6) * z) / 4);
      ctx.stroke();
    }
    // Mat.
    ctx.fillStyle = COLORS.padMat;
    ctx.beginPath();
    roundRectPath(ctx, x - half, top - 4, BOUNCE.width, 12, 6);
    ctx.fill();
    ctx.fillStyle = COLORS.padMatLight;
    ctx.beginPath();
    roundRectPath(ctx, x - half + 6, top - 3, BOUNCE.width - 12, 4, 2);
    ctx.fill();

    this.padArrows(p, x, top, time);
  }

  /** Pijltjes omhoog die zacht stuiteren boven het kussen (niet meer na gebruik). */
  private padArrows(p: Pad, x: number, top: number, time: number): void {
    const { ctx } = this;
    if (p.usedTime >= 0) return;
    const bounce = Math.abs(Math.sin(time * 5)) * 8;
    ctx.strokeStyle = COLORS.padArrow;
    ctx.lineWidth = 6;
    ctx.lineJoin = 'round';
    for (let a = 0; a < 2; a++) {
      const y = top - 22 - a * 16 - bounce;
      ctx.globalAlpha = a === 0 ? 1 : 0.7;
      ctx.beginPath();
      ctx.moveTo(x - 14, y + 8);
      ctx.lineTo(x, y - 4);
      ctx.lineTo(x + 14, y + 8);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
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
        this.sparkle(sx, c.y, (world.time - c.collectedTime) / FEEDBACK.sparkleTime);
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

  /** Glinsterplof: een ring sterretjes die uit elkaar spat (t van 0 tot 1). */
  private sparkle(x: number, y: number, t: number): void {
    if (t >= 1) return;
    const { ctx } = this;
    ctx.save();
    ctx.globalAlpha = 1 - t;
    ctx.fillStyle = '#ffffff';
    const r = 14 + t * 42;
    for (let i = 0; i < 7; i++) {
      const a = (i * Math.PI * 2) / 7 + t;
      ctx.beginPath();
      starPath(ctx, x + Math.cos(a) * r, y + Math.sin(a) * r, 7 * (1 - t * 0.5), 3);
      ctx.fill();
    }
    ctx.restore();
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
