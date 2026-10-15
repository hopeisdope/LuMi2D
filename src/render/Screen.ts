import { VIEW } from '../config';
import type { Vec2, Viewport } from '../types';

/**
 * Beheert de canvas-afmetingen en de schaal van wereld-eenheden naar pixels.
 *
 * De virtuele hoogte is vast (VIEW.height); de virtuele breedte volgt de
 * beeldverhouding binnen [minWidth, maxWidth]. Bij extremere verhoudingen
 * wordt het speelveld gecentreerd (letterbox), zodat verhoudingen altijd
 * behouden blijven.
 */
export class Screen {
  readonly canvas: HTMLCanvasElement;
  readonly ctx: CanvasRenderingContext2D;
  readonly viewport: Viewport = { width: VIEW.minWidth, height: VIEW.height, scale: 1, pixelRatio: 1 };
  /** Offset (CSS-pixels) van het speelveld binnen de canvas. */
  readonly offset: Vec2 = { x: 0, y: 0 };
  cssWidth = 0;
  cssHeight = 0;
  private readonly listeners: Array<() => void> = [];

  constructor(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) throw new Error('Canvas 2D wordt niet ondersteund door deze browser.');
    this.canvas = canvas;
    this.ctx = ctx;
  }

  attach(): void {
    window.addEventListener('resize', this.resize);
    window.addEventListener('orientationchange', this.resize);
    window.visualViewport?.addEventListener('resize', this.resize);
    this.resize();
  }

  detach(): void {
    window.removeEventListener('resize', this.resize);
    window.removeEventListener('orientationchange', this.resize);
    window.visualViewport?.removeEventListener('resize', this.resize);
  }

  onResize(listener: () => void): void {
    this.listeners.push(listener);
  }

  /** Zet CSS-pixelcoördinaten (relatief aan de canvas) om naar wereld-eenheden. */
  toWorld(cssX: number, cssY: number, out: Vec2): Vec2 {
    out.x = (cssX - this.offset.x) / this.viewport.scale;
    out.y = (cssY - this.offset.y) / this.viewport.scale;
    return out;
  }

  /** Vult de hele canvas (incl. letterbox) en zet daarna de wereld-transformatie. */
  beginFrame(letterboxColor: string): void {
    const { ctx, viewport } = this;
    const pr = viewport.pixelRatio;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = letterboxColor;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.setTransform(viewport.scale * pr, 0, 0, viewport.scale * pr, this.offset.x * pr, this.offset.y * pr);
  }

  private readonly resize = (): void => {
    const rect = this.canvas.getBoundingClientRect();
    const cssW = Math.max(1, rect.width || window.innerWidth);
    const cssH = Math.max(1, rect.height || window.innerHeight);
    const pixelRatio = Math.min(window.devicePixelRatio || 1, VIEW.maxPixelRatio);

    const aspectWidth = (cssW / cssH) * VIEW.height;
    const width = Math.min(VIEW.maxWidth, Math.max(VIEW.minWidth, aspectWidth));
    const scale = Math.min(cssW / width, cssH / VIEW.height);

    this.cssWidth = cssW;
    this.cssHeight = cssH;
    this.viewport.width = width;
    this.viewport.height = VIEW.height;
    this.viewport.scale = scale;
    this.viewport.pixelRatio = pixelRatio;
    this.offset.x = (cssW - width * scale) / 2;
    this.offset.y = (cssH - VIEW.height * scale) / 2;

    const bufferW = Math.round(cssW * pixelRatio);
    const bufferH = Math.round(cssH * pixelRatio);
    if (this.canvas.width !== bufferW || this.canvas.height !== bufferH) {
      this.canvas.width = bufferW;
      this.canvas.height = bufferH;
    }

    for (let i = 0; i < this.listeners.length; i++) this.listeners[i]();
  };
}
