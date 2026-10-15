import { BRAND, LOGO_COLORS, TYPOGRAPHY, UI_STYLE } from '../brand/brand';
import { COLORS, UI } from '../config';
import type { Button, GameState, Viewport, WorldState } from '../types';
import type { Layout } from '../ui/Layout';
import { roundRectPath, starPath } from './shapes';

const font = (size: number): string => `${TYPOGRAPHY.weight} ${size}px ${TYPOGRAPHY.fontFamily}`;
const LOGO_FONT = font(TYPOGRAPHY.size.logo);
const HEADING_FONT = font(TYPOGRAPHY.size.heading);
const SUBTITLE_FONT = font(TYPOGRAPHY.size.subtitle);
const BUTTON_FONT = font(TYPOGRAPHY.size.button);
const SCORE_FONT = font(TYPOGRAPHY.size.score);
/** Duur (s) van het opveren van de sterrenteller bij een nieuwe ster. */
const SCORE_PULSE_TIME = 0.3;

const JUMP_HINT = 'Tik om te springen!';

/** Letters van het logo, één keer opgesplitst. */
const LOGO_LETTERS: readonly string[] = Array.from(BRAND.name);
const LOGO_LETTER_SPACING = 4;

/** Tekent start-, pauze- en menu-UI op de canvas in de LuMi2d-huisstijl. */
export class UIRenderer {
  /** Breedte per logoletter; wordt bij de eerste tekenbeurt gemeten en daarna hergebruikt. */
  private readonly logoWidths = new Float64Array(LOGO_LETTERS.length);
  private logoTotalWidth = -1;

  constructor(private readonly ctx: CanvasRenderingContext2D) {}

  render(
    state: GameState,
    view: Viewport,
    layout: Layout,
    time: number,
    world: WorldState,
    showJumpHint: boolean,
  ): void {
    const cx = view.width / 2;
    const cy = view.height / 2;
    switch (state) {
      case 'ready':
        this.dim(view);
        this.logo(cx, cy - 110, time);
        this.text(BRAND.tagline, cx, cy - 30, SUBTITLE_FONT);
        this.button(layout.start);
        break;
      case 'playing':
        if (showJumpHint) this.jumpHint(cx, view.height * 0.3, time);
        this.scoreCounter(world);
        this.pauseButton(layout.pause);
        break;
      case 'paused':
        this.dim(view);
        this.scoreCounter(world);
        this.text('Pauze', cx, cy - 120, HEADING_FONT);
        this.button(layout.resume);
        this.button(layout.restart);
        break;
    }
  }

  private dim(view: Viewport): void {
    this.ctx.fillStyle = UI_STYLE.overlayDim;
    this.ctx.fillRect(0, 0, view.width, view.height);
  }

  /** "LuMi2d" met een eigen kleur per letter, donkere rand en een zacht huppeltje. */
  private logo(cx: number, cy: number, time: number): void {
    const { ctx } = this;
    ctx.font = LOGO_FONT;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';

    if (this.logoTotalWidth < 0) {
      let total = 0;
      for (let i = 0; i < LOGO_LETTERS.length; i++) {
        const w = ctx.measureText(LOGO_LETTERS[i]).width;
        this.logoWidths[i] = w;
        total += w + (i > 0 ? LOGO_LETTER_SPACING : 0);
      }
      this.logoTotalWidth = total;
    }

    let x = cx - this.logoTotalWidth / 2;
    for (let i = 0; i < LOGO_LETTERS.length; i++) {
      const letter = LOGO_LETTERS[i];
      const y = cy + Math.sin(time * 3 + i * 0.7) * 5;
      ctx.fillStyle = UI_STYLE.text.shadow;
      ctx.fillText(letter, x + 4, y + 7);
      ctx.strokeStyle = UI_STYLE.text.outline;
      ctx.lineWidth = 12;
      ctx.strokeText(letter, x, y);
      ctx.fillStyle = LOGO_COLORS[i % LOGO_COLORS.length];
      ctx.fillText(letter, x, y);
      x += this.logoWidths[i] + LOGO_LETTER_SPACING;
    }
  }

  /** Sterrenteller linksboven; veert kort op bij een nieuwe ster. */
  private scoreCounter(world: WorldState): void {
    const { ctx } = this;
    const { margin } = UI.score;
    const size = UI.score.starSize;
    const cx = margin + size;
    const cy = margin + size;
    const since = world.lastScoreTime < 0 ? Infinity : world.time - world.lastScoreTime;
    const pulse = since < SCORE_PULSE_TIME ? 1 + 0.3 * (1 - since / SCORE_PULSE_TIME) : 1;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(pulse, pulse);
    ctx.fillStyle = COLORS.star;
    ctx.strokeStyle = COLORS.starOutline;
    ctx.lineWidth = 5;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    starPath(ctx, 0, 0, size, size * 0.48);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    ctx.font = SCORE_FONT;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    const tx = cx + size + 12;
    ctx.lineJoin = 'round';
    ctx.lineWidth = 8;
    ctx.strokeStyle = UI_STYLE.text.outline;
    ctx.strokeText(this.scoreLabel(world.score), tx, cy + 2);
    ctx.fillStyle = UI_STYLE.text.fill;
    ctx.fillText(this.scoreLabel(world.score), tx, cy + 2);
  }

  /** Cache van de laatst getekende score: geen nieuwe string per frame. */
  private cachedScore = -1;
  private cachedScoreLabel = '0';

  private scoreLabel(score: number): string {
    if (score !== this.cachedScore) {
      this.cachedScore = score;
      this.cachedScoreLabel = String(score);
    }
    return this.cachedScoreLabel;
  }

  /** Zacht pulserende uitnodiging om te springen, tot het kind voor het eerst springt. */
  private jumpHint(x: number, y: number, time: number): void {
    const { ctx } = this;
    const scale = 1 + Math.sin(time * 5) * 0.05;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    this.text(JUMP_HINT, 0, 0, SUBTITLE_FONT, true);
    ctx.restore();
  }

  /** Witte tekst met schaduw; `outlined` voegt een donkere rand toe voor tekst los op de lucht. */
  private text(value: string, x: number, y: number, fontSpec: string, outlined = false): void {
    const { ctx } = this;
    ctx.font = fontSpec;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = UI_STYLE.text.shadow;
    ctx.fillText(value, x + 3, y + 4);
    if (outlined) {
      ctx.lineJoin = 'round';
      ctx.lineWidth = 8;
      ctx.strokeStyle = UI_STYLE.text.outline;
      ctx.strokeText(value, x, y);
    }
    ctx.fillStyle = UI_STYLE.text.fill;
    ctx.fillText(value, x, y);
  }

  private button(button: Button): void {
    const { ctx } = this;
    const { x, y, width, height } = button.rect;
    const style = UI_STYLE.button;
    ctx.fillStyle = style.shadow;
    ctx.beginPath();
    roundRectPath(ctx, x, y + style.depth, width, height, style.radius);
    ctx.fill();
    ctx.fillStyle = style.fill;
    ctx.beginPath();
    roundRectPath(ctx, x, y, width, height, style.radius);
    ctx.fill();
    this.text(button.label, x + width / 2, y + height / 2, BUTTON_FONT);
  }

  private pauseButton(button: Button): void {
    const { ctx } = this;
    const { x, y, width, height } = button.rect;
    const style = UI_STYLE.button;
    // Opvallend oranje met donkere rand: blijft zichtbaar tegen wolken en lucht.
    ctx.fillStyle = style.shadow;
    ctx.beginPath();
    roundRectPath(ctx, x, y + 4, width, height, style.smallRadius);
    ctx.fill();
    ctx.fillStyle = style.fill;
    ctx.beginPath();
    roundRectPath(ctx, x, y, width, height, style.smallRadius);
    ctx.fill();
    // Twee pauzestrepen
    ctx.fillStyle = style.text;
    const barW = width * 0.16;
    const barH = height * 0.5;
    const top = y + (height - barH) / 2;
    ctx.fillRect(x + width * 0.3, top, barW, barH);
    ctx.fillRect(x + width * 0.54, top, barW, barH);
  }
}
