import { PARALLAX, WORLD } from '../config';
import type { Theme } from '../themes';
import type { ThemeId, Viewport } from '../types';

interface Cloud {
  x: number;
  y: number;
  size: number;
}

/** Breedte waarover het wolken-/sterrenpatroon zich herhaalt (wereld-eenheden). */
const SKY_TILE = 1600;
const CLOUDS: readonly Cloud[] = [
  { x: 80, y: 80, size: 1 },
  { x: 420, y: 140, size: 0.7 },
  { x: 760, y: 60, size: 1.2 },
  { x: 1100, y: 120, size: 0.85 },
  { x: 1400, y: 75, size: 0.6 },
];

/** Vaste sterrenhemel (één keer berekend, deterministisch). */
const STARS: ReadonlyArray<{ x: number; y: number; r: number }> = (() => {
  const stars: Array<{ x: number; y: number; r: number }> = [];
  let seed = 12345;
  const rnd = (): number => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  for (let i = 0; i < 70; i++) stars.push({ x: rnd() * SKY_TILE, y: rnd() * 330, r: 1 + rnd() * 2.2 });
  return stars;
})();

const ROAD_TOP = WORLD.groundY;
const ROAD_HEIGHT = 46;
const DASH_LENGTH = 50;
const DASH_PERIOD = 110;
const DECOR_PERIOD = 170;
const VOLCANO_PERIOD = 900;

function mod(value: number, period: number): number {
  return ((value % period) + period) % period;
}

/**
 * Tekent lucht, hemellichaam, wolken/sterren, heuvels en grond met parallax, in de kleuren
 * en details van de gekozen wereld. De luchtgradient wordt alleen opnieuw gemaakt bij een
 * resize of wereldwissel, niet per frame.
 */
export class BackgroundRenderer {
  private skyGradient: CanvasGradient | null = null;
  private gradientTheme: ThemeId | null = null;

  constructor(private readonly ctx: CanvasRenderingContext2D) {}

  /** Na een resize opnieuw opbouwen. */
  invalidate(): void {
    this.skyGradient = null;
  }

  render(view: Viewport, distance: number, time: number, theme: Theme): void {
    this.drawSky(view, theme);
    if (theme.stars) this.drawStars(view, distance, time);
    this.drawCelestial(view, theme);
    if (theme.cloud) this.drawClouds(view, distance, time, theme.cloud);
    this.drawHills(view, distance * PARALLAX.farHills, 300, 70, 0.004, theme.farHills, 0);
    if (theme.farLayer === 'volcano') this.drawVolcanoes(view, distance * PARALLAX.farHills, theme);
    this.drawHills(view, distance * PARALLAX.nearHills, 360, 55, 0.007, theme.nearHills, 2.1);
    this.drawGround(view, distance * PARALLAX.ground, theme);
  }

  private drawSky(view: Viewport, theme: Theme): void {
    const { ctx } = this;
    if (!this.skyGradient || this.gradientTheme !== theme.id) {
      const g = ctx.createLinearGradient(0, 0, 0, WORLD.groundY);
      g.addColorStop(0, theme.skyTop);
      g.addColorStop(1, theme.skyBottom);
      this.skyGradient = g;
      this.gradientTheme = theme.id;
    }
    ctx.fillStyle = this.skyGradient;
    ctx.fillRect(0, 0, view.width, WORLD.groundY);
  }

  /** Zon of planeet; staat stil en geeft een vast referentiepunt. */
  private drawCelestial(view: Viewport, theme: Theme): void {
    const { ctx } = this;
    const x = view.width - 230;
    const y = 100;
    const c = theme.celestial;
    ctx.fillStyle = c.color;
    ctx.beginPath();
    ctx.arc(x, y, c.kind === 'planet' ? 40 : 48, 0, Math.PI * 2);
    ctx.fill();
    if (c.kind === 'planet' && c.ring) {
      ctx.strokeStyle = c.ring;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.ellipse(x, y, 70, 16, -0.35, 0, Math.PI * 2);
      ctx.stroke();
      // Voorkant van de planeet over de achterkant van de ring
      ctx.fillStyle = c.color;
      ctx.beginPath();
      ctx.arc(x, y, 40, Math.PI * 0.05, Math.PI * 0.95);
      ctx.fill();
    }
  }

  private drawStars(view: Viewport, distance: number, time: number): void {
    const { ctx } = this;
    const offset = mod(distance * 0.05, SKY_TILE);
    ctx.fillStyle = '#ffffff';
    for (let tile = -SKY_TILE; tile < view.width + SKY_TILE; tile += SKY_TILE) {
      for (let i = 0; i < STARS.length; i++) {
        const s = STARS[i];
        const x = s.x + tile - offset;
        if (x < -5 || x > view.width + 5) continue;
        ctx.globalAlpha = 0.55 + 0.45 * Math.sin(time * 2 + i * 1.7);
        ctx.fillRect(x - s.r / 2, s.y - s.r / 2, s.r, s.r);
      }
    }
    ctx.globalAlpha = 1;
  }

  private drawClouds(view: Viewport, distance: number, time: number, color: string): void {
    const { ctx } = this;
    // Wolken drijven ook een beetje zonder te rijden, zodat het startscherm leeft.
    const scroll = distance * PARALLAX.clouds + time * 12;
    const offset = mod(scroll, SKY_TILE);
    ctx.fillStyle = color;
    for (let tile = -SKY_TILE; tile < view.width + SKY_TILE; tile += SKY_TILE) {
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

  /** Vriendelijke vulkanen met een gloeiend topje (dino-wereld). */
  private drawVolcanoes(view: Viewport, scroll: number, theme: Theme): void {
    const { ctx } = this;
    const offset = mod(scroll, VOLCANO_PERIOD);
    for (let x = -offset + 200; x < view.width + 300; x += VOLCANO_PERIOD) {
      const base = 330;
      ctx.fillStyle = theme.farHills;
      ctx.beginPath();
      ctx.moveTo(x - 170, base + 40);
      ctx.lineTo(x - 30, 190);
      ctx.lineTo(x + 30, 190);
      ctx.lineTo(x + 170, base + 40);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#ff7043';
      ctx.beginPath();
      ctx.moveTo(x - 30, 190);
      ctx.lineTo(x + 30, 190);
      ctx.lineTo(x + 18, 214);
      ctx.lineTo(x + 4, 204);
      ctx.lineTo(x - 10, 220);
      ctx.lineTo(x - 22, 206);
      ctx.closePath();
      ctx.fill();
    }
  }

  private drawGround(view: Viewport, scroll: number, theme: Theme): void {
    const { ctx } = this;
    const bottom = view.height;

    // Weg
    ctx.fillStyle = theme.road;
    ctx.fillRect(0, ROAD_TOP, view.width, ROAD_HEIGHT);

    // Middenstrepen (bewegen mee met de grond → duidelijk snelheidsgevoel)
    ctx.fillStyle = theme.roadLine;
    const dashOffset = mod(scroll, DASH_PERIOD);
    for (let x = -dashOffset; x < view.width; x += DASH_PERIOD) {
      ctx.fillRect(x, ROAD_TOP + ROAD_HEIGHT / 2 - 3, DASH_LENGTH, 6);
    }

    // Berm onder de weg
    const grassTop = ROAD_TOP + ROAD_HEIGHT;
    ctx.fillStyle = theme.grassEdge;
    ctx.fillRect(0, grassTop, view.width, 8);
    ctx.fillStyle = theme.grass;
    ctx.fillRect(0, grassTop + 8, view.width, bottom - grassTop - 8);

    // Details in de berm, per wereld
    const decorOffset = mod(scroll, DECOR_PERIOD);
    for (let x = -decorOffset; x < view.width + DECOR_PERIOD; x += DECOR_PERIOD) {
      this.drawDecor(x, grassTop, theme);
    }

    // Duidelijke grondlijn bovenaan de weg
    ctx.fillStyle = theme.grassEdge;
    ctx.fillRect(0, ROAD_TOP - 4, view.width, 6);
  }

  private drawDecor(x: number, grassTop: number, theme: Theme): void {
    const { ctx } = this;
    switch (theme.decor) {
      case 'tufts':
        ctx.fillStyle = theme.decorA;
        ctx.beginPath();
        ctx.moveTo(x, grassTop + 40);
        ctx.lineTo(x + 8, grassTop + 22);
        ctx.lineTo(x + 16, grassTop + 40);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = theme.decorB;
        ctx.beginPath();
        ctx.arc(x + 90, grassTop + 50, 6, 0, Math.PI * 2);
        ctx.fill();
        break;
      case 'ferns':
        // Varen (drie bladeren) en een dino-eitje met stipjes
        ctx.strokeStyle = theme.decorA;
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x + 8, grassTop + 46);
        ctx.quadraticCurveTo(x - 6, grassTop + 30, x - 4, grassTop + 18);
        ctx.moveTo(x + 8, grassTop + 46);
        ctx.lineTo(x + 8, grassTop + 14);
        ctx.moveTo(x + 8, grassTop + 46);
        ctx.quadraticCurveTo(x + 22, grassTop + 30, x + 20, grassTop + 18);
        ctx.stroke();
        ctx.fillStyle = theme.decorB;
        ctx.beginPath();
        ctx.ellipse(x + 92, grassTop + 46, 9, 12, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#8bc34a';
        ctx.beginPath();
        ctx.arc(x + 89, grassTop + 42, 2.5, 0, Math.PI * 2);
        ctx.arc(x + 95, grassTop + 50, 2, 0, Math.PI * 2);
        ctx.fill();
        break;
      case 'craters':
        ctx.fillStyle = theme.decorB;
        ctx.beginPath();
        ctx.ellipse(x + 20, grassTop + 40, 22, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = theme.decorA;
        ctx.beginPath();
        ctx.ellipse(x + 20, grassTop + 42, 17, 5.5, 0, 0, Math.PI * 2);
        ctx.ellipse(x + 104, grassTop + 54, 9, 3.5, 0, 0, Math.PI * 2);
        ctx.fill();
        break;
      case 'candy':
        // Lolly en een snoepje in een papiertje
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x + 6, grassTop + 26, 4, 24);
        ctx.fillStyle = theme.decorA;
        ctx.beginPath();
        ctx.arc(x + 8, grassTop + 22, 11, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x + 8, grassTop + 22, 6, 0, Math.PI * 1.5);
        ctx.stroke();
        ctx.fillStyle = theme.decorB;
        ctx.beginPath();
        ctx.ellipse(x + 96, grassTop + 48, 10, 7, 0, 0, Math.PI * 2);
        ctx.moveTo(x + 86, grassTop + 48);
        ctx.lineTo(x + 78, grassTop + 42);
        ctx.lineTo(x + 78, grassTop + 54);
        ctx.closePath();
        ctx.moveTo(x + 106, grassTop + 48);
        ctx.lineTo(x + 114, grassTop + 42);
        ctx.lineTo(x + 114, grassTop + 54);
        ctx.closePath();
        ctx.fill();
        break;
    }
  }
}
