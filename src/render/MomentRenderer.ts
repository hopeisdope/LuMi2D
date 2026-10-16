import { PALETTE } from '../brand/brand';
import { MOMENTS, WORLD } from '../config';
import type { Moment, ThemeId, WorldState } from '../types';

const CANDY_COLORS = ['#e53935', '#ffd93b', '#29a9f0', '#43c04a', '#9c4dcc', '#ffffff'];

/**
 * Spelmomenten van de werelden: paardenbloempluis, een ei dat uitkomt, bellen en een suikerspinwolkje, met
 * de verrassing na het raken. Vaste patronen (geen random per frame). Leest alleen state.
 */
export class MomentRenderer {
  constructor(private readonly ctx: CanvasRenderingContext2D) {}

  render(world: WorldState, carScreenX: number, viewWidth: number): void {
    for (let i = 0; i < world.moments.length; i++) {
      const m = world.moments[i];
      if (!m.active) continue;
      const sx = carScreenX + (m.x - world.car.x);
      if (sx < -150 || sx > viewWidth + 150) continue;
      const t = m.hitTime < 0 ? -1 : world.time - m.hitTime;
      this.draw(world.theme, m, sx, t, world.time, Math.abs(m.x - world.car.x));
    }
  }

  private draw(theme: ThemeId, m: Moment, x: number, t: number, time: number, distance: number): void {
    switch (theme) {
      case 'meadow':
        this.fluff(x, m.y, t, time);
        break;
      case 'dino':
        this.egg(x, t, time, distance);
        break;
      case 'space':
        this.bubble(x, m.y, t, time);
        break;
      case 'candy':
        this.cotton(x, m.y, t, time);
        break;
    }
  }

  /** Paardenbloempluisjes die zacht wiegen; geraakt waaien ze omhoog weg. */
  private fluff(x: number, y: number, t: number, time: number): void {
    const { ctx } = this;
    if (t > MOMENTS.effectTime) return;
    const k = t < 0 ? 0 : t / MOMENTS.effectTime;
    ctx.save();
    ctx.globalAlpha = 1 - k;
    for (let i = 0; i < 5; i++) {
      const ox = (i - 2) * 24 + Math.sin(time * 1.5 + i) * 4 + k * (40 + i * 25);
      const oy = ((i * 7) % 3) * 12 - 10 - k * (90 + i * 20) + Math.sin(k * 6 + i) * 10;
      const px = x + ox;
      const py = y + oy;
      // Zacht gloedje zodat het pluisje ook tegen de lichte lucht opvalt.
      ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.beginPath();
      ctx.arc(px, py, 19, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (let r = 0; r < 10; r++) {
        const a = (r / 10) * Math.PI * 2 + k * 3;
        ctx.moveTo(px, py);
        ctx.lineTo(px + Math.cos(a) * 17, py + Math.sin(a) * 17);
      }
      ctx.stroke();
      ctx.fillStyle = '#c5a46d';
      ctx.beginPath();
      ctx.arc(px, py, 4.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  /** Ei in een nestje in de berm; wiebelt als de auto nadert, en na een sprong erover komt er een babydino uit. */
  private egg(x: number, t: number, time: number, distance: number): void {
    const { ctx } = this;
    const ground = WORLD.groundY - 4;
    // Nestje
    ctx.fillStyle = '#8d6e63';
    ctx.beginPath();
    ctx.ellipse(x, ground - 6, 34, 11, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#5d4037';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let i = -2; i <= 2; i++) {
      ctx.moveTo(x + i * 12 - 8, ground - 10 + (i % 2) * 3);
      ctx.lineTo(x + i * 12 + 8, ground - 4 - (i % 2) * 3);
    }
    ctx.stroke();

    if (t < 0) {
      const wobble = distance < 450 ? Math.sin(time * 14) * 0.18 : 0;
      ctx.save();
      ctx.translate(x, ground - 10);
      ctx.rotate(wobble);
      this.eggShape(0, -22, 1);
      ctx.restore();
      return;
    }
    // Uitgekomen: schaalhelften vallen opzij, babydino springt op en zwaait.
    const k = Math.min(1, t / 0.4);
    ctx.save();
    ctx.globalAlpha = Math.max(0, 1 - t / MOMENTS.effectTime);
    ctx.fillStyle = '#fff3e0';
    ctx.strokeStyle = PALETTE.navy;
    ctx.lineWidth = 2.5;
    for (let side = -1; side <= 1; side += 2) {
      ctx.save();
      ctx.translate(x + side * (10 + k * 22), ground - 18 + k * 8);
      ctx.rotate(side * k * 1.2);
      ctx.beginPath();
      ctx.moveTo(-12, 0);
      ctx.lineTo(12, 0);
      ctx.lineTo(0, -16);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
    const pop = Math.sin(k * Math.PI * 0.5) * 1.05;
    ctx.save();
    ctx.translate(x, ground - 10);
    ctx.scale(pop, pop);
    ctx.fillStyle = '#7ccf6b';
    ctx.strokeStyle = PALETTE.navy;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(0, -18, 15, 18, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(4, -44, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Zwaaiend armpje
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#7ccf6b';
    ctx.lineCap = 'round';
    const wave = Math.sin(time * 10) * 0.5;
    ctx.beginPath();
    ctx.moveTo(-10, -24);
    ctx.lineTo(-10 - Math.cos(1.1 + wave) * 14, -24 - Math.sin(1.1 + wave) * 14);
    ctx.stroke();
    ctx.fillStyle = '#222222';
    ctx.beginPath();
    ctx.arc(9, -47, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#222222';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(8, -40, 4, 0.2, Math.PI - 0.2);
    ctx.stroke();
    ctx.restore();
  }

  private eggShape(x: number, y: number, scale: number): void {
    const { ctx } = this;
    ctx.fillStyle = '#fff3e0';
    ctx.strokeStyle = PALETTE.navy;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(x, y, 17 * scale, 23 * scale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#81c784';
    ctx.beginPath();
    ctx.arc(x - 6, y - 6, 4, 0, Math.PI * 2);
    ctx.arc(x + 6, y + 5, 3.5, 0, Math.PI * 2);
    ctx.arc(x - 3, y + 11, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  /** Zwevende bel; geraakt knapt hij in druppeltjes. */
  private bubble(x: number, y: number, t: number, time: number): void {
    const { ctx } = this;
    const r = MOMENTS.radius;
    if (t < 0) {
      const by = y + Math.sin(time * 2 + x * 0.01) * 8;
      ctx.fillStyle = 'rgba(180, 225, 255, 0.28)';
      ctx.strokeStyle = 'rgba(200, 235, 255, 0.95)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x, by, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(x, by, r * 0.65, Math.PI * 1.15, Math.PI * 1.45);
      ctx.stroke();
      return;
    }
    const k = t / 0.5;
    if (k > 1) return;
    ctx.save();
    ctx.globalAlpha = 1 - k;
    ctx.fillStyle = 'rgba(210, 240, 255, 0.95)';
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      const d = r + k * 40;
      ctx.beginPath();
      ctx.arc(x + Math.cos(a) * d, y + Math.sin(a) * d, 4 * (1 - k * 0.5), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  /** Suikerspinwolkje; geraakt regent het snoepjes en krimpt het wolkje weg. */
  private cotton(x: number, y: number, t: number, time: number): void {
    const { ctx } = this;
    if (t > MOMENTS.effectTime) return;
    const k = t < 0 ? 0 : t / MOMENTS.effectTime;
    const shrink = 1 - Math.min(1, k * 2);
    const bob = Math.sin(time * 2 + x * 0.01) * 5;
    if (shrink > 0) {
      ctx.save();
      ctx.translate(x, y + bob);
      ctx.scale(shrink, shrink);
      ctx.fillStyle = '#ff9ecf';
      ctx.beginPath();
      ctx.arc(-20, 4, 17, 0, Math.PI * 2);
      ctx.arc(0, -8, 21, 0, Math.PI * 2);
      ctx.arc(21, 3, 16, 0, Math.PI * 2);
      ctx.arc(0, 10, 17, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffd1e8';
      ctx.beginPath();
      ctx.arc(-6, -12, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    if (t < 0) return;
    // Snoepjesregen
    ctx.save();
    ctx.globalAlpha = 1 - k;
    for (let i = 0; i < 14; i++) {
      const dx = ((i * 37) % 90) - 45 + Math.sin(i) * 10;
      const fall = t * (120 + (i % 4) * 40) + 0.5 * 400 * t * t * 0.5;
      ctx.fillStyle = CANDY_COLORS[i % CANDY_COLORS.length];
      ctx.save();
      ctx.translate(x + dx, y + fall);
      ctx.rotate(t * 6 + i);
      ctx.beginPath();
      ctx.ellipse(0, 0, 7, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  }
}
