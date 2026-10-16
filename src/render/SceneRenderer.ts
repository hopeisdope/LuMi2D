import { PALETTE } from '../brand/brand';
import { RAINBOW, SCENES, WORLD } from '../config';
import type { SceneKind, WorldState } from '../types';
import { roundRectPath, starPath } from './shapes';

/** Kleuren van de regenboogtunnel (van buiten naar binnen). */
const TUNNEL_COLORS = ['#e53935', '#ff9800', '#ffd93b', '#43c04a', '#29a9f0', '#9c4dcc'];
const SPARKLE_TIME = 1;

/**
 * Verrassingstaferelen: bordje vooraf, eendjes die oversteken, regenboogtunnel en een kudde schaapjes die
 * opzij huppelt. Leest alleen state.
 */
export class SceneRenderer {
  constructor(private readonly ctx: CanvasRenderingContext2D) {}

  /** Achter de auto: het bordje en de tunnelboog. */
  renderBack(world: WorldState, carScreenX: number, viewWidth: number): void {
    const s = world.scene;
    if (!s.active) return;
    const signX = carScreenX + (s.x - world.car.x);
    if (signX > -60 && signX < viewWidth + 60) this.sign(s.kind, signX, world.time);
    if (s.kind !== 'tunnel') return;
    const tx = carScreenX + (s.x + SCENES.eventOffset - world.car.x);
    if (tx < -SCENES.tunnel.halfWidth - 40 || tx > viewWidth + SCENES.tunnel.halfWidth + 40) return;
    const { ctx } = this;
    const ground = WORLD.groundY;
    ctx.save();
    ctx.lineCap = 'butt';
    for (let i = 0; i < TUNNEL_COLORS.length; i++) {
      ctx.strokeStyle = TUNNEL_COLORS[i];
      ctx.lineWidth = 14;
      const rx = SCENES.tunnel.halfWidth - i * 13;
      const ry = SCENES.tunnel.height - i * 13;
      ctx.beginPath();
      ctx.ellipse(tx, ground, rx, ry, 0, Math.PI, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  /** Op de weg (vóór de auto getekend, maar de auto staat er nooit tegelijk): eendjes en schaapjes. */
  renderMid(world: WorldState, carScreenX: number, viewWidth: number): void {
    const s = world.scene;
    if (!s.active || s.kind === 'tunnel') return;
    const spot = carScreenX + (s.x + SCENES.eventOffset - world.car.x);
    if (spot < -300 || spot > viewWidth + 300) return;
    const ground = WORLD.groundY;
    const t = s.triggerTime < 0 ? -1 : world.time - s.triggerTime;

    if (s.kind === 'ducks') {
      // Moeder voorop, kuikentjes erachter; ze lopen van het gras vóór de weg naar de berm erachter.
      const d = SCENES.ducks;
      for (let i = 0; i < d.count; i++) {
        const k = t < 0 ? 0 : Math.min(1, Math.max(0, (t - i * d.stagger) / d.crossTime));
        const y = ground + 72 - k * 82;
        const walking = k > 0 && k < 1;
        this.duck(spot + (i - 1.5) * 30, y, i === 0 ? 1 : 0.65, walking ? world.time * 10 + i : 0, i === 0);
      }
    } else {
      // Schaapjes op de weg; als de auto nadert huppelen ze één voor één de berm in.
      const h = SCENES.herd;
      for (let i = 0; i < h.count; i++) {
        const k = t < 0 ? 0 : Math.min(1, Math.max(0, (t - i * h.stagger) / h.hopTime));
        const hop = Math.sin(k * Math.PI) * 40;
        const y = ground + 8 - k * (8 + h.berm) - hop;
        const idle = k >= 1 ? Math.abs(Math.sin(world.time * 3 + i)) * 3 : 0;
        this.sheep(spot + i * h.spacing + k * 14, y - idle, world.time + i);
      }
    }
  }

  /** Vóór de auto: glitters rond de auto nadat hij door de regenboogtunnel reed. */
  renderFront(world: WorldState, carScreenX: number): void {
    const s = world.scene;
    if (!s.active || s.kind !== 'tunnel' || s.passTime < 0) return;
    const t = world.time - s.passTime;
    if (t > SPARKLE_TIME) return;
    const { ctx } = this;
    const car = world.car;
    const cy = car.y - car.height * 0.6;
    ctx.save();
    ctx.globalAlpha = 1 - t / SPARKLE_TIME;
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2 + t * 3;
      const r = 50 + t * 40;
      ctx.fillStyle = RAINBOW.colors[i % RAINBOW.colors.length];
      ctx.beginPath();
      starPath(ctx, carScreenX + Math.cos(a) * r * 1.4, cy + Math.sin(a) * r * 0.7, 8, 3.5);
      ctx.fill();
    }
    ctx.restore();
  }

  /** Bordje in de berm met het plaatje van wat er komt. */
  private sign(kind: SceneKind, x: number, time: number): void {
    const { ctx } = this;
    const ground = WORLD.groundY - 4;
    ctx.fillStyle = '#8d6e63';
    ctx.fillRect(x - 4, ground - 96, 8, 96);
    const wobble = Math.sin(time * 2) * 0.03;
    ctx.save();
    ctx.translate(x, ground - 120);
    ctx.rotate(wobble);
    ctx.fillStyle = PALETTE.white;
    ctx.strokeStyle = PALETTE.navy;
    ctx.lineWidth = 5;
    ctx.beginPath();
    roundRectPath(ctx, -40, -34, 80, 68, 14);
    ctx.fill();
    ctx.stroke();
    if (kind === 'ducks') this.duck(0, 22, 0.75, 0, true);
    else if (kind === 'herd') this.sheep(0, 22, 0);
    else {
      for (let i = 0; i < 4; i++) {
        ctx.strokeStyle = TUNNEL_COLORS[i];
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(0, 20, 30 - i * 6, Math.PI, Math.PI * 2);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  /** Eendje (moeder wit, kuikens geel); (x, y) = voeten. */
  private duck(x: number, y: number, scale: number, phase: number, mother: boolean): void {
    const { ctx } = this;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.rotate(Math.sin(phase) * 0.12);
    ctx.fillStyle = '#ff9800';
    ctx.fillRect(-8, -6, 5, 6);
    ctx.fillRect(3, -6, 5, 6);
    ctx.fillStyle = mother ? '#ffffff' : '#ffd93b';
    ctx.strokeStyle = PALETTE.navy;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(0, -22, 22, 16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(14, -44, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#ff9800';
    ctx.beginPath();
    ctx.moveTo(24, -46);
    ctx.lineTo(36, -42);
    ctx.lineTo(24, -38);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#222222';
    ctx.beginPath();
    ctx.arc(17, -47, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  /** Wollig schaapje; (x, y) = voeten. */
  private sheep(x: number, y: number, time: number): void {
    const { ctx } = this;
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = '#37474f';
    ctx.fillRect(-14, -12, 6, 12);
    ctx.fillRect(8, -12, 6, 12);
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = PALETTE.navy;
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let i = 0; i < 5; i++) ctx.arc(-16 + i * 8, -26 + (i % 2) * -6, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    roundRectPath(ctx, -22, -36, 44, 24, 12);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#37474f';
    ctx.beginPath();
    ctx.ellipse(22, -32 + Math.sin(time * 4) * 1.5, 10, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(25, -34, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
