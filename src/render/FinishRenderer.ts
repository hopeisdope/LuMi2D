import { PALETTE } from '../brand/brand';
import { RIDE, WORLD } from '../config';
import type { WorldState } from '../types';
import { roundRectPath } from './shapes';
import { GARAGE_SPRITE } from './spriteData';
import { PROP_IMAGES, ready } from './sprites';

/** Afmetingen van de finishboog en de garage (wereld-eenheden). */
const ARCH = { halfWidth: 150, height: 230, pole: 12, banner: 34, square: 17 } as const;
const GARAGE = { opening: 200, openingHeight: 128, pillar: 36, lintel: 34, roof: 70, overhang: 22 } as const;
const CONFETTI_TIME = 1.8;
const CONFETTI_COUNT = 40;
const CONFETTI_COLORS = ['#e53935', '#ffd93b', '#29a9f0', '#43c04a', '#9c4dcc', '#ff9800'];
/** Duur (s) van het dichtgaan van de garagedeur. */
const DOOR_TIME = 0.7;

/**
 * Finishboog, confetti en de garage aan het eind van een rit. De garage staat achter de auto: de auto rijdt
 * de deuropening in en de roldeur gaat vóór hem dicht. Leest alleen state.
 */
export class FinishRenderer {
  /** Plek van het garageplaatje en de deuropening (eenheden), elk frame opnieuw ingevuld: geen allocaties. */
  private readonly garage = { left: 0, top: 0, width: 0, height: 0, ox: 0, oy: 0, ow: 0, oh: 0 };

  constructor(private readonly ctx: CanvasRenderingContext2D) {}

  /** Garageplaatje zo geschaald dat de opening GARAGE.opening breed is, midden van de opening op gx, onderkant op de grond. */
  private placeGarage(gx: number, ground: number): void {
    const op = GARAGE_SPRITE.opening;
    const ox = op[0];
    const oy = op[1];
    const ow = op[2];
    const oh = op[3];
    const s = GARAGE.opening / ow;
    const g = this.garage;
    g.width = GARAGE_SPRITE.width * s;
    g.height = GARAGE_SPRITE.height * s;
    g.left = gx - (ox + ow / 2) * s;
    g.top = ground - g.height;
    g.ox = g.left + ox * s;
    g.oy = g.top + oy * s;
    g.ow = ow * s;
    g.oh = oh * s;
  }

  /**
   * Achter de auto: finishboog met geblokte lijn op de weg en de hele garage. De auto rijdt vóór de garage
   * langs de deuropening in; daarna gaat de roldeur (vóór de auto) dicht.
   */
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
      // Achterste paal in de berm achter de weg; de voorste paal en de banier komen vóór de auto.
      this.pole(fx - ARCH.halfWidth, ground);
    }

    const gx = carScreenX + (world.finishX + RIDE.garageDistance - world.car.x);
    if (gx < -300 || gx > viewWidth + 300) return;
    if (ready(PROP_IMAGES.garage)) {
      // Donkere binnenkant precies in de deuropening, daarover het plaatje (de opening is doorzichtig).
      this.placeGarage(gx, ground);
      const g = this.garage;
      ctx.fillStyle = '#3d3a4f';
      ctx.fillRect(g.ox, g.oy, g.ow, g.oh);
      ctx.drawImage(PROP_IMAGES.garage, g.left, g.top, g.width, g.height);
    } else {
      this.drawnGarage(gx, ground);
    }
  }

  /** Vóór de auto: voorste paal en banier van de finishboog, confetti, en de roldeur van de garage. */
  renderFront(world: WorldState, carScreenX: number, viewWidth: number): void {
    const ground = WORLD.groundY;

    const fx = carScreenX + (world.finishX - world.car.x);
    if (fx > -ARCH.halfWidth - 40 && fx < viewWidth + ARCH.halfWidth + 40) {
      // Voorste paal staat in het gras vóór de weg (dus vóór de auto) en draagt samen met de achterste de banier:
      // de auto rijdt tussen de palen door, onder de vlag.
      this.pole(fx + ARCH.halfWidth, ground + WORLD.roadHeight + 6);
      this.banner(fx, ground - ARCH.height);
    }
    if (world.finishTime >= 0) {
      const t = world.time - world.finishTime;
      if (t < CONFETTI_TIME) this.confetti(fx, ground - ARCH.height, t);
    }

    if (world.parkedTime < 0) return;
    const gx = carScreenX + (world.finishX + RIDE.garageDistance - world.car.x);
    if (gx < -300 || gx > viewWidth + 300) return;
    const t = world.time - world.parkedTime;
    if (ready(PROP_IMAGES.garage)) {
      this.placeGarage(gx, ground);
      const g = this.garage;
      this.door(g.ox, g.oy, g.ow, g.oh, t);
    } else {
      this.door(gx - GARAGE.opening / 2, ground - GARAGE.openingHeight, GARAGE.opening, GARAGE.openingHeight, t);
    }
  }

  /** Getekende garage (als het plaatje er niet is): donkere binnenkant, muren, dak en raampje. */
  private drawnGarage(gx: number, ground: number): void {
    const { ctx } = this;
    const half = GARAGE.opening / 2;
    ctx.fillStyle = '#3d3a4f';
    ctx.fillRect(gx - half - 2, ground - GARAGE.openingHeight - 2, GARAGE.opening + 4, GARAGE.openingHeight + 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.fillRect(gx - half, ground - 12, GARAGE.opening, 12);
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
  }

  /** Roldeur die in DOOR_TIME van boven naar beneden over de opening (x, y, w, h) zakt. */
  private door(x: number, y: number, w: number, h: number, t: number): void {
    const { ctx } = this;
    const dh = h * Math.min(1, t / DOOR_TIME);
    ctx.fillStyle = '#b0bec5';
    ctx.fillRect(x, y, w, dh);
    ctx.strokeStyle = '#78909c';
    ctx.lineWidth = 3;
    for (let ly = y + 16; ly < y + dh; ly += 16) {
      ctx.beginPath();
      ctx.moveTo(x + 4, ly);
      ctx.lineTo(x + w - 4, ly);
      ctx.stroke();
    }
  }

  /** Geblokte banier tussen de palen, bovenkant op top. */
  private banner(fx: number, top: number): void {
    const { ctx } = this;
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

  /** Gestreepte paal (rood/wit) van base (onderkant) tot de banier. */
  private pole(x: number, base: number): void {
    const { ctx } = this;
    const top = WORLD.groundY - ARCH.height;
    const seg = 24;
    for (let y = top; y < base; y += seg) {
      ctx.fillStyle = Math.floor((y - top) / seg) % 2 === 0 ? PALETTE.red : PALETTE.white;
      ctx.fillRect(x - ARCH.pole / 2, y, ARCH.pole, Math.min(seg, base - y));
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
