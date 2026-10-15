import { COLORS, UI } from '../config';
import type { Button, GameState, Viewport } from '../types';
import type { Layout } from '../ui/Layout';
import { roundRectPath } from './shapes';

const TITLE_FONT = `bold 72px ${UI.fontFamily}`;
const SUBTITLE_FONT = `bold 28px ${UI.fontFamily}`;
const BUTTON_FONT = `bold 36px ${UI.fontFamily}`;

/** Tekent start-, pauze- en menu-UI op de canvas (geen externe lettertypen). */
export class UIRenderer {
  constructor(private readonly ctx: CanvasRenderingContext2D) {}

  render(state: GameState, view: Viewport, layout: Layout): void {
    switch (state) {
      case 'ready':
        this.dim(view);
        this.text('LuMi2D', view.width / 2, view.height / 2 - 90, TITLE_FONT);
        this.text('Tik om te rijden!', view.width / 2, view.height / 2 - 30, SUBTITLE_FONT);
        this.button(layout.start);
        break;
      case 'playing':
        this.pauseButton(layout.pause);
        break;
      case 'paused':
        this.dim(view);
        this.text('Pauze', view.width / 2, view.height / 2 - 120, TITLE_FONT);
        this.button(layout.resume);
        this.button(layout.restart);
        break;
    }
  }

  private dim(view: Viewport): void {
    this.ctx.fillStyle = COLORS.uiDim;
    this.ctx.fillRect(0, 0, view.width, view.height);
  }

  private text(value: string, x: number, y: number, font: string): void {
    const { ctx } = this;
    ctx.font = font;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = COLORS.uiTextShadow;
    ctx.fillText(value, x + 3, y + 4);
    ctx.fillStyle = COLORS.uiText;
    ctx.fillText(value, x, y);
  }

  private button(button: Button): void {
    const { ctx } = this;
    const { x, y, width, height } = button.rect;
    ctx.fillStyle = COLORS.uiButtonDark;
    ctx.beginPath();
    roundRectPath(ctx, x, y + 6, width, height, 24);
    ctx.fill();
    ctx.fillStyle = COLORS.uiButton;
    ctx.beginPath();
    roundRectPath(ctx, x, y, width, height, 24);
    ctx.fill();
    this.text(button.label, x + width / 2, y + height / 2, BUTTON_FONT);
  }

  private pauseButton(button: Button): void {
    const { ctx } = this;
    const { x, y, width, height } = button.rect;
    // Opvallend oranje met donkere rand: blijft zichtbaar tegen wolken en lucht.
    ctx.fillStyle = COLORS.uiButtonDark;
    ctx.beginPath();
    roundRectPath(ctx, x, y + 4, width, height, 18);
    ctx.fill();
    ctx.fillStyle = COLORS.uiButton;
    ctx.beginPath();
    roundRectPath(ctx, x, y, width, height, 18);
    ctx.fill();
    // Twee pauzestrepen
    ctx.fillStyle = COLORS.uiText;
    const barW = width * 0.16;
    const barH = height * 0.5;
    const top = y + (height - barH) / 2;
    ctx.fillRect(x + width * 0.3, top, barW, barH);
    ctx.fillRect(x + width * 0.54, top, barW, barH);
  }
}
