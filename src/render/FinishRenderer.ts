import { PALETTE } from '../brand/brand';
import { RIDE, WORLD } from '../config';
import type { WorldState } from '../types';
import { roundRectPath } from './shapes';

/** Afmetingen van de finishboog en de garage (wereld-eenheden). */
const ARCH = { halfWidth: 150, height: 230, pole: 12, banner: 34, square: 17 } as const;
const GARAGE = { opening: 200, openingHeight: 128, pillar: 36, lintel: 34, roof: 70, overhang: 22 } as const;
const CONFETTI_TIME = 1.8;
const CONFETTI_COUNT = 40;
const CONFETTI_COLORS = ['#e53935', '#ffd93b', '#29a9f0', '#43c04a', '#9c4dcc', '#ff9800'];
/** Duur (s) van het dichtgaan van de garagedeur. */
const DOOR_TIME = 0.7;

/**
 * Finishboog, confetti en de garage aan het eind van een rit. De boog en de binnenkant van de garage
 * staan achter de auto; de voorgevel van de garage ervoor, zodat de auto echt naar binnen rijdt. Leest alleen state.
 */
export class FinishRenderer {
  constructor(private readonly ctx: CanvasRenderingContext2D) {}

  /** Achter de auto: finishboog met geblokte lijn op de weg, binnenkant van de garage. */
  renderBack(world: WorldState, carScreenX: number, viewWidth: number): void {
    const { ctx } = this;
    const fx = carScreenX + (world.finishX - world.car.x);
    const ground = WORLD.groundY;

    if (fx > -ARCH.halfWidth - 40 && fx < viewWidth + ARCH.halfWidth + 40) {
      // Geblokte finishlijn over de weg.
      for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 2; col++) {
          ctx.fillStyle = (row + col) % 2 === 0 ? PALETTE.white : '#222222';
          ctx.fillRect(fx - 12 + col * 12, ground + row * 12, 12, 12);
        }
      }
      // Twee gestreepte palen in de berm met een geblokte banier erover.
      this.pole(fx - ARCH.halfWidth, ground);
      this.pole(fx + ARCH.halfWidth, ground);
      const top = ground - ARCH.height;
      ctx.fillStyle = PALETTE.navy;
      ctx.beginPath();
      roundRectPath(ctx, fx - ARCH.halfWidth - 8, top - 4, ARCH.halfWidth * 2 + 16, ARCH.banner + 8, 8);
      ctx.fill();
      const cols = Math.floor((ARCH.halfWidth * 2) / ARCH.square);
      const left = fx - (cols * ARCH.square) / 2;
      for (let c = 0; c < cols; c++) {
        for (let r = 0; r < 2; r++) {
          ctx.fillStyle = (c + r) % 2 === 0 ? PALETTE.white : '#222222';
          ctx.fillRect(left + c * ARCH.square, top + r * ARCH.square, ARCH.square, ARCH.square);
        }
      }
    }

    const gx = carScreenX + (world.finishX + RIDE.garageDistance - world.car.x);
    if (gx > -300 && gx < viewWidth + 300) {
      // Donkere binnenkant: de auto staat hier straks voor.
      ctx.fillStyle = '#3d3a4f';
      ctx.fillRect(gx - GARAGE.opening / 2 - 2, ground - GARAGE.openingHeight - 2, GARAGE.opening + 4, GARAGE.openingHeight + 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.fillRect(gx - GARAGE.opening / 2, ground - 12, GARAGE.opening, 12);
    }
  }

  /** Vóór de auto: confetti bij de finish, voorgevel en roldeur van de garage. */
  renderFront(world: WorldState, carScreenX: number, viewWidth: number): void {
    const { ctx } = this;
    const ground = WORLD.groundY;

    if (world.finishTime >= 0) {
      const t = world.time - world.finishTime;
      if (t < CONFETTI_TIME) this.confetti(carScreenX + (world.finishX - world.car.x), ground - ARCH.height, t);
    }

    const gx = carScreenX + (world.finishX + RIDE.garageDistance - world.car.x);
    if (gx < -300 || gx > viewWidth + 300) return;
    const half = GARAGE.opening / 2;
    const wallTop = ground - GARAGE.openingHeight - GARAGE.lintel;
    // Muren naast en boven de opening.
    ctx.fillStyle = '#f4e1c1';
    ctx.fillRect(gx - half - GARAGE.pillar, wallTop, GARAGE.pillar, ground - wallTop);
    ctx.fillRect(gx + half, wallTop, GARAGE.pillar, ground - wallTop);
    ctx.fillRect(gx - half, wallTop, GARAGE.opening, GARAGE.lintel);
    ctx.strokeStyle = PALETTE.navy;
    ctx.lineWidth = 4;
    ctx.strokeRect(gx - half - GARAGE.pillar, wallTop, GARAGE.opening + 2 * GARAGE.pillar, ground - wallTop);
    ctx.strokeRect(gx - half, ground - GARAGE.openingHeight, GARAGE.opening, GARAGE.openingHeight);
    // Dak.
    const roofLeft = gx - half - GARAGE.pillar - GARAGE.overhang;
    const roofRight = gx + half + GARAGE.pillar + GARAGE.overhang;
    ctx.fillStyle = PALETTE.red;
    ctx.beginPath();
    ctx.moveTo(roofLeft, wallTop + 4);
    ctx.lineTo(gx, wallTop - GARAGE.roof);
    ctx.lineTo(roofRight, wallTop + 4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Rond raampje in de nok.
    ctx.fillStyle = PALETTE.blueLight;
    ctx.beginPath();
    ctx.arc(gx, wallTop - GARAGE.roof * 0.42, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Roldeur gaat dicht nadat de auto geparkeerd is.
    if (world.parkedTime >= 0) {
      const k = Math.min(1, (world.time - world.parkedTime) / DOOR_TIME);
      const h = GARAGE.openingHeight * k;
      const top = ground - GARAGE.openingHeight;
      ctx.fillStyle = '#b0bec5';
      ctx.fillRect(gx - half, top, GARAGE.opening, h);
      ctx.strokeStyle = '#78909c';
      ctx.lineWidth = 3;
      for (let y = top + 16; y < top + h; y += 16) {
        ctx.beginPath();
        ctx.moveTo(gx - half + 4, y);
        ctx.lineTo(gx + half - 4, y);
        ctx.stroke();
      }
    }
  }

  /** Gestreepte paal (rood/wit) vanaf de grond tot de banier. */
  private pole(x: number, ground: number): void {
    const { ctx } = this;
    const top = ground - ARCH.height;
    const seg = 24;
    for (let y = top; y < ground; y += seg) {
      ctx.fillStyle = Math.floor((y - top) / seg) % 2 === 0 ? PALETTE.red : PALETTE.white;
      ctx.fillRect(x - ARCH.pole / 2, y, ARCH.pole, Math.min(seg, ground - y));
    }
  }

  /** Confetti die vanaf de banier uitwaaiert en naar beneden dwarrelt (vaste patronen, geen random per frame). */
  private confetti(x: number, y: number, t: number): void {
    const { ctx } = this;
    ctx.save();
    ctx.globalAlpha = Math.min(1, (CONFETTI_TIME - t) * 2);
    for (let i = 0; i < CONFETTI_COUNT; i++) {
      const a = ((i * 137.5) % 360) * (Math.PI / 180);
      const speed = 120 + ((i * 53) % 140);
      const px = x + Math.cos(a) * speed * t;
      const py = y + Math.sin(a) * speed * t * 0.6 + 160 * t * t;
      ctx.fillStyle = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(t * 8 + i);
      ctx.fillRect(-5, -3, 10, 6);
      ctx.restore();
    }
    ctx.restore();
  }
}
