import { COLORS, PARALLAX, WORLD } from '../config';
import type { Viewport } from '../types';

interface Cloud {
  x: number;
  y: number;
  size: number;
}

/** Breedte waarover het wolkenpatroon zich herhaalt (wereld-eenheden). */
const CLOUD_TILE = 1600;
const CLOUDS: readonly Cloud[] = [
  { x: 80, y: 80, size: 1 },
  { x: 420, y: 140, size: 0.7 },
  { x: 760, y: 60, size: 1.2 },
  { x: 1100, y: 120, size: 0.85 },
  { x: 1400, y: 75, size: 0.6 },
];

const ROAD_TOP = WORLD.groundY;
const ROAD_HEIGHT = 46;
const DASH_LENGTH = 50;
const DASH_PERIOD = 110;
const TUFT_PERIOD = 170;

function mod(value: number, period: number): number {
  return ((value % period) + period) % period;
}

/**
 * Tekent lucht, zon, wolken, heuvels en grond met parallax.
 * Gradients worden alleen opnieuw gemaakt bij een resize, niet per frame.
 */
export class BackgroundRenderer {
  private skyGradient: CanvasGradient | null = null;

  constructor(private readonly ctx: CanvasRenderingContext2D) {}

  /** Moet aangeroepen worden na een resize (de canvas-reset wist gradient-context niet, maar hoogte kan veranderen). */
  invalidate(): void {
    this.skyGradient = null;
  }

  render(view: Viewport, distance: number, time: number): void {
    this.drawSky(view);
    this.drawClouds(view, distance, time);
    this.drawHills(view, distance * PARALLAX.farHills, 300, 70, 0.004, COLORS.farHills, 0);
    this.drawHills(view, distance * PARALLAX.nearHills, 360, 55, 0.007, COLORS.nearHills, 2.1);
    this.drawGround(view, distance * PARALLAX.ground);
  }

  private drawSky(view: Viewport): void {
    const { ctx } = this;
    if (!this.skyGradient) {
      const g = ctx.createLinearGradient(0, 0, 0, WORLD.groundY);
      g.addColorStop(0, COLORS.skyTop);
      g.addColorStop(1, COLORS.skyBottom);
      this.skyGradient = g;
    }
    ctx.fillStyle = this.skyGradient;
    ctx.fillRect(0, 0, view.width, WORLD.groundY);

    // Zon (staat stil: geeft rust en een vast referentiepunt).
    ctx.fillStyle = COLORS.sun;
    ctx.beginPath();
    ctx.arc(view.width - 230, 100, 48, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawClouds(view: Viewport, distance: number, time: number): void {
    const { ctx } = this;
    // Wolken drijven ook een beetje zonder te rijden, zodat het startscherm leeft.
    const scroll = distance * PARALLAX.clouds + time * 12;
    const offset = mod(scroll, CLOUD_TILE);
    ctx.fillStyle = COLORS.cloud;
    for (let tile = -CLOUD_TILE; tile < view.width + CLOUD_TILE; tile += CLOUD_TILE) {
      for (let i = 0; i < CLOUDS.length; i++) {
        const c = CLOUDS[i];
        const x = c.x + tile - offset;
        if (x < -200 || x > view.width + 200) continue;
        this.drawCloud(x, c.y, c.size);
      }
    }
  }

  private drawCloud(x: number, y: number, s: number): void {
    const { ctx } = this;
    ctx.beginPath();
    ctx.arc(x, y, 28 * s, 0, Math.PI * 2);
    ctx.arc(x + 32 * s, y - 14 * s, 34 * s, 0, Math.PI * 2);
    ctx.arc(x + 68 * s, y, 26 * s, 0, Math.PI * 2);
    ctx.rect(x, y - 4 * s, 68 * s, 30 * s);
    ctx.fill();
  }

  /** Golvende heuvelrij als som van sinussen; geen objectcreatie per frame. */
  private drawHills(
    view: Viewport,
    scroll: number,
    baseY: number,
    amplitude: number,
    frequency: number,
    color: string,
    phase: number,
  ): void {
    const { ctx } = this;
    const step = 16;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, WORLD.groundY);
    for (let x = 0; x <= view.width + step; x += step) {
      const wx = (x + scroll) * frequency;
      const y = baseY - amplitude * (0.6 * Math.sin(wx + phase) + 0.4 * Math.sin(wx * 2.3 + phase * 1.7));
      ctx.lineTo(x, y);
    }
    ctx.lineTo(view.width + step, WORLD.groundY);
    ctx.closePath();
    ctx.fill();
  }

  private drawGround(view: Viewport, scroll: number): void {
    const { ctx } = this;
    const bottom = view.height;

    // Weg
    ctx.fillStyle = COLORS.road;
    ctx.fillRect(0, ROAD_TOP, view.width, ROAD_HEIGHT);

    // Middenstrepen (bewegen mee met de grond → duidelijk snelheidsgevoel)
    ctx.fillStyle = COLORS.roadLine;
    const dashOffset = mod(scroll, DASH_PERIOD);
    for (let x = -dashOffset; x < view.width; x += DASH_PERIOD) {
      ctx.fillRect(x, ROAD_TOP + ROAD_HEIGHT / 2 - 3, DASH_LENGTH, 6);
    }

    // Gras onder de weg
    const grassTop = ROAD_TOP + ROAD_HEIGHT;
    ctx.fillStyle = COLORS.grassEdge;
    ctx.fillRect(0, grassTop, view.width, 8);
    ctx.fillStyle = COLORS.grass;
    ctx.fillRect(0, grassTop + 8, view.width, bottom - grassTop - 8);

    // Grasplukjes en steentjes voor extra diepte
    const tuftOffset = mod(scroll, TUFT_PERIOD);
    for (let x = -tuftOffset; x < view.width + TUFT_PERIOD; x += TUFT_PERIOD) {
      ctx.fillStyle = COLORS.grassEdge;
      ctx.beginPath();
      ctx.moveTo(x, grassTop + 40);
      ctx.lineTo(x + 8, grassTop + 22);
      ctx.lineTo(x + 16, grassTop + 40);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = COLORS.dirt;
      ctx.beginPath();
      ctx.arc(x + 90, grassTop + 50, 6, 0, Math.PI * 2);
      ctx.fill();
    }

    // Duidelijke grondlijn bovenaan de weg
    ctx.fillStyle = COLORS.grassEdge;
    ctx.fillRect(0, ROAD_TOP - 4, view.width, 6);
  }
}
