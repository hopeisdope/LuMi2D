import { BRAND, LOGO_COLORS, PALETTE, TYPOGRAPHY, UI_STYLE } from '../brand/brand';
import { BOOST, CARS, COLORS, MISSION, RAINBOW, RIDE, UI } from '../config';
import { STICKERS } from '../settings/Progress';
import { CAR_IDS, THEME_IDS } from '../settings/Settings';
import { THEMES, type Theme } from '../themes';
import type {
  Button,
  GameState,
  Mission,
  ObstacleKind,
  Progress,
  Rect,
  RideSummary,
  Settings,
  StickerId,
  Viewport,
  WorldState,
} from '../types';
import type { Layout } from '../ui/Layout';
import { CarRenderer } from './CarRenderer';
import { drawIcon, type IconName } from './icons';
import type { ObstacleRenderer } from './ObstacleRenderer';
import { roundRectPath, starPath } from './shapes';
import { FRIEND_SPRITES } from './spriteData';
import { FRIEND_IMAGES, ready } from './sprites';

const font = (size: number): string => `${TYPOGRAPHY.weight} ${size}px ${TYPOGRAPHY.fontFamily}`;
const LOGO_FONT = font(TYPOGRAPHY.size.logo);
const HEADING_FONT = font(TYPOGRAPHY.size.heading);
const SUBTITLE_FONT = font(TYPOGRAPHY.size.subtitle);
const BUTTON_FONT = font(TYPOGRAPHY.size.button);
const SCORE_FONT = font(TYPOGRAPHY.size.score);
const TOGGLE_FONT = font(TYPOGRAPHY.size.toggle);
/** Groot getal (sterren) in het overzicht na de finish. */
const SUMMARY_FONT = font(64);
/** Duur (s) van het opveren van de sterrenteller bij een nieuwe ster. */
const SCORE_PULSE_TIME = 0.3;

const JUMP_HINT = 'Tik om te springen!';

/** Plaatje (en eventueel getal) per sticker in het rittenboekje. */
const STICKER_LOOK: Readonly<Record<StickerId, { icon: IconName | 'star'; badge?: string }>> = {
  firstRide: { icon: 'flag' },
  rides10: { icon: 'flag', badge: '10' },
  bestRide10: { icon: 'star', badge: '10' },
  stars100: { icon: 'star', badge: '100' },
  firstRainbow: { icon: 'rainbow' },
  rainbows10: { icon: 'rainbow', badge: '10' },
  distance50: { icon: 'car', badge: '50' },
  allWorlds: { icon: 'world' },
  missions5: { icon: 'check', badge: '5' },
};
/** Tot zoveel tonen we een aantal als rijtje plaatjes in plaats van als getal. */
const TALLY_MAX = 10;
const BOOK_TILE = { width: 160, height: 140, gap: 16, top: 104 } as const;
const STICKER_R = 38;
/**
 * Opdrachtkaartje: plekje linksonder in het gras (daar komen auto en obstakels nooit, ook niet bij een hoge
 * veersprong), en hoe groot het aan het begin in beeld staat.
 */
const MISSION_CARD = { x: 16, y: 482, height: 60, hudScale: 0.85, introScale: 2, introY: 250 } as const;
const CONFETTI_COLORS = ['#e53935', '#ffd93b', '#29a9f0', '#43c04a', '#9c4dcc', '#ff9800'];

/** Letters van het logo, één keer opgesplitst. */
const LOGO_LETTERS: readonly string[] = Array.from(BRAND.name);
const LOGO_LETTER_SPACING = 4;

/**
 * Tekent alle menu's en de HUD op de canvas in de LuMi2d-huisstijl. Elke tekst heeft een
 * icoon of plaatje erbij, zodat kinderen die nog niet lezen alles kunnen bedienen.
 */
export class UIRenderer {
  /** Breedte per logoletter; wordt bij de eerste tekenbeurt gemeten en daarna hergebruikt. */
  private readonly logoWidths = new Float64Array(LOGO_LETTERS.length);
  private logoTotalWidth = -1;
  /** Gemeten tekstbreedtes (per lettertype + tekst), zodat measureText niet elk frame nodig is. */
  private readonly textWidths = new Map<string, number>();
  private readonly carPreview: CarRenderer;

  constructor(
    private readonly ctx: CanvasRenderingContext2D,
    private readonly obstacleIcons: ObstacleRenderer,
  ) {
    this.carPreview = new CarRenderer(ctx);
  }

  render(
    state: GameState,
    view: Viewport,
    layout: Layout,
    time: number,
    world: WorldState,
    settings: Settings,
    progress: Progress,
    summary: RideSummary,
    showJumpHint: boolean,
  ): void {
    const cx = view.width / 2;
    switch (state) {
      case 'ready':
        this.dim(view);
        this.logo(cx, 88, time);
        this.iconText('hand', BRAND.tagline, cx, 160, SUBTITLE_FONT, false, time);
        this.button(layout.start);
        this.iconButton(layout.settings, 'gear');
        this.iconButton(layout.book, 'book');
        break;
      case 'book':
        this.dim(view);
        this.iconText('book', 'Mijn rittenboekje', cx, 48, SUBTITLE_FONT, true);
        this.book(cx, progress, settings, time);
        this.iconButton(layout.back, 'back');
        break;
      case 'settings':
        this.dim(view);
        this.iconText('gear', 'Instellingen', cx, 48, SUBTITLE_FONT, true);
        this.toggleRow(layout.toggleObstacles, settings.obstacles, 'cone');
        this.toggleRow(layout.toggleEnemies, settings.enemies, 'hedgehog');
        this.toggleRow(layout.toggleSound, settings.sound, settings.sound ? 'soundOn' : 'soundOff');
        this.toggleRow(layout.toggleEndless, settings.endless, 'infinity');
        this.button(layout.done);
        break;
      case 'choose':
        // Lichte overlay: de gekozen wereld en auto blijven goed zichtbaar op de achtergrond.
        this.ctx.fillStyle = UI_STYLE.overlayLight;
        this.ctx.fillRect(0, 0, view.width, view.height);
        this.iconText('car', 'Kies je auto', cx, 58, SUBTITLE_FONT, true);
        this.carPicker(layout.carCards, settings, time);
        this.iconText('world', 'Kies je wereld', cx, 234, SUBTITLE_FONT, true);
        this.worldPicker(layout.worldCards, settings);
        this.button(layout.go);
        this.iconButton(layout.back, 'back');
        break;
      case 'playing':
        if (showJumpHint) this.jumpHint(cx, view.height * 0.3, time);
        this.scoreCounter(world);
        this.rainbowMeter(world, cx, 46);
        if (!world.endless) this.rideProgress(world, cx, view.height - 26);
        this.missionHud(world, cx, settings, time);
        this.iconButton(layout.pause, 'pause');
        break;
      case 'finished':
        this.dim(view);
        this.rideSummary(cx, summary, settings, time);
        this.button(layout.again);
        this.button(layout.chooseAgain);
        break;
      case 'paused':
        this.dim(view);
        this.scoreCounter(world);
        this.iconText('pause', 'Pauze', cx, 100, HEADING_FONT, false);
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

  /**
   * Drie boogjes bovenin het midden die vollopen met de verzamelde regenboogkleuren, plus een
   * bliksem met aflopende ring zolang de turbo duurt. Alleen beeld, geen tekst nodig.
   */
  private rainbowMeter(world: WorldState, cx: number, cy: number): void {
    const { ctx } = this;
    const riding = world.rainbowRide > 0;
    const slotGap = 52;
    ctx.save();
    ctx.lineCap = 'round';
    for (let i = 0; i < 3; i++) {
      const x = cx + (i - 1) * slotGap;
      const filled = riding || i < world.rainbowPieces;
      const wiggle = riding ? Math.sin(world.time * 10 + i) * 3 : 0;
      ctx.strokeStyle = UI_STYLE.text.outline;
      ctx.lineWidth = 16;
      ctx.beginPath();
      ctx.arc(x, cy + 8 + wiggle, 15, Math.PI, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = filled ? RAINBOW.colors[i] : 'rgba(255, 255, 255, 0.45)';
      ctx.lineWidth = 9;
      ctx.beginPath();
      ctx.arc(x, cy + 8 + wiggle, 15, Math.PI, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();

    if (world.boostTimer > 0) {
      const x = cx + 2 * slotGap + 10;
      const k = world.boostTimer / BOOST.duration;
      ctx.fillStyle = UI_STYLE.text.outline;
      ctx.beginPath();
      ctx.arc(x, cy, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = COLORS.boostBolt;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(x, cy, 19, -Math.PI / 2, -Math.PI / 2 + k * Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = COLORS.boostBolt;
      ctx.beginPath();
      ctx.moveTo(x + 3, cy - 12);
      ctx.lineTo(x - 7, cy + 2);
      ctx.lineTo(x - 1, cy + 2);
      ctx.lineTo(x - 4, cy + 12);
      ctx.lineTo(x + 7, cy - 3);
      ctx.lineTo(x + 1, cy - 3);
      ctx.closePath();
      ctx.fill();
    }
  }

  /**
   * Opdracht van deze rit: eerst groot in het midden, dan schuift hij naar linksonder. Bij succes: confetti
   * rond het kaartje en een vinkje.
   */
  private missionHud(world: WorldState, cx: number, settings: Settings, time: number): void {
    const m = world.mission;
    const w = this.missionCardWidth(m);
    const k = Math.min(1, Math.max(0, (world.time - m.startTime - MISSION.introTime) / MISSION.slideTime));
    const ease = k * k * (3 - 2 * k);
    const scale = MISSION_CARD.introScale + (MISSION_CARD.hudScale - MISSION_CARD.introScale) * ease;
    // Eindplek: linksonder, rekening houdend met de schaal (het kaartje schaalt rond zijn midden).
    const hudX = MISSION_CARD.x - (w * (1 - MISSION_CARD.hudScale)) / 2;
    const hudY = MISSION_CARD.y - (MISSION_CARD.height * (1 - MISSION_CARD.hudScale)) / 2;
    const x = cx - w / 2 + (hudX - (cx - w / 2)) * ease;
    const y = MISSION_CARD.introY + (hudY - MISSION_CARD.introY) * ease;
    this.missionCard(m, x, y, scale, settings, time);
    if (m.doneTime >= 0) {
      const t = world.time - m.doneTime;
      if (t < MISSION.celebrateTime) this.burst(x + w / 2, y + MISSION_CARD.height / 2, t / MISSION.celebrateTime);
    }
  }

  private missionCardWidth(m: Mission): number {
    return 70 + Math.max(1, m.target) * 20;
  }

  /** Kaartje met het plaatje van de opdracht en bolletjes voor de voortgang; (x, y) = linksboven, schaal rond het midden. */
  private missionCard(m: Mission, x: number, y: number, scale: number, settings: Settings, time: number): void {
    const { ctx } = this;
    const w = this.missionCardWidth(m);
    const h = MISSION_CARD.height;
    const done = m.doneTime >= 0;
    ctx.save();
    ctx.translate(x + w / 2, y + h / 2);
    ctx.scale(scale, scale);
    ctx.translate(-w / 2, -h / 2);
    ctx.fillStyle = done ? PALETTE.yellow : UI_STYLE.panel;
    ctx.strokeStyle = done ? PALETTE.orangeDark : UI_STYLE.text.outline;
    ctx.lineWidth = 4;
    ctx.beginPath();
    roundRectPath(ctx, 0, 0, w, h, 16);
    ctx.fill();
    ctx.stroke();
    this.missionPicture(m, 34, h / 2, settings, time);
    for (let i = 0; i < m.target; i++) {
      const px = 72 + i * 20;
      ctx.fillStyle = i < m.count ? PALETTE.green : 'rgba(30, 60, 110, 0.18)';
      ctx.beginPath();
      ctx.arc(px, h / 2, 7.5, 0, Math.PI * 2);
      ctx.fill();
    }
    if (done) {
      ctx.fillStyle = PALETTE.green;
      ctx.beginPath();
      ctx.arc(w - 4, 4, 15, 0, Math.PI * 2);
      ctx.fill();
      drawIcon(ctx, 'check', w - 4, 4, 18, PALETTE.white);
    }
    ctx.restore();
  }

  /** Plaatje bij een opdracht, gecentreerd op (x, y), ~44 groot. */
  private missionPicture(m: Mission, x: number, y: number, settings: Settings, time: number): void {
    const { ctx } = this;
    switch (m.kind) {
      case 'stars':
        this.bigStar(x, y, 20);
        break;
      case 'jumpOver':
        // Pionnetje met een boogje erover.
        this.obstacleIcons.drawIcon('cone', x, y + 8, 28);
        ctx.strokeStyle = UI_STYLE.text.outline;
        ctx.lineWidth = 3.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(x, y + 8, 20, Math.PI * 1.1, Math.PI * 1.9);
        ctx.stroke();
        break;
      case 'rainbowPiece':
        this.colorRainbow(x, y + 10, 20);
        break;
      case 'friendJump': {
        // Het eerste vriendje van de gekozen wereld, juichend.
        const kind = THEMES[settings.theme].friends[0];
        const img = FRIEND_IMAGES[kind];
        if (ready(img)) {
          const sprite = FRIEND_SPRITES[kind];
          const h = 46;
          const w = (sprite.cellWidth / sprite.cellHeight) * h;
          const hop = Math.abs(Math.sin(time * 5)) * 3;
          ctx.drawImage(img, 2 * sprite.cellWidth, 0, sprite.cellWidth, sprite.cellHeight, x - w / 2, y - h / 2 - hop, w, h);
        } else {
          drawIcon(ctx, 'note', x, y, 34, UI_STYLE.text.outline);
        }
        break;
      }
      case 'turbo':
        drawIcon(ctx, 'bolt', x, y, 38, PALETTE.orange);
        break;
    }
  }

  /** Confetti die uit het midden wegspat (t van 0 tot 1); vaste patronen, geen random per frame. */
  private burst(x: number, y: number, t: number): void {
    const { ctx } = this;
    ctx.save();
    ctx.globalAlpha = 1 - t;
    for (let i = 0; i < 18; i++) {
      const a = (i / 18) * Math.PI * 2;
      const r = 20 + t * (70 + (i % 3) * 20);
      ctx.fillStyle = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
      ctx.fillRect(x + Math.cos(a) * r - 4, y + Math.sin(a) * r + t * t * 40 - 3, 8, 6);
    }
    ctx.restore();
  }

  /** Onderin: een weggetje waarop een autootje naar het finishvlaggetje rijdt. */
  private rideProgress(world: WorldState, cx: number, cy: number): void {
    const { ctx } = this;
    const width = 300;
    const left = cx - width / 2;
    const k = Math.max(0, Math.min(1, world.car.x / world.finishX));
    ctx.fillStyle = 'rgba(30, 60, 110, 0.45)';
    ctx.beginPath();
    roundRectPath(ctx, left, cy - 6, width, 12, 6);
    ctx.fill();
    ctx.fillStyle = UI_STYLE.text.fill;
    ctx.beginPath();
    roundRectPath(ctx, left, cy - 6, Math.max(12, width * k), 12, 6);
    ctx.fill();
    drawIcon(ctx, 'flag', left + width + 18, cy - 8, 30, PALETTE.red);
    const x = left + width * k;
    ctx.fillStyle = UI_STYLE.text.outline;
    ctx.beginPath();
    ctx.arc(x, cy, 16, 0, Math.PI * 2);
    ctx.fill();
    drawIcon(ctx, 'car', x, cy, 22, UI_STYLE.text.fill);
  }

  /**
   * Overzicht na de finish: sterren van deze rit, een kroontje bij een record en de nieuwe stickers
   * (die één voor één opspringen).
   */
  private rideSummary(cx: number, summary: RideSummary, settings: Settings, time: number): void {
    const { ctx } = this;
    const t = time - summary.shownAt;
    this.iconText('flag', 'Klaar!', cx, 72, HEADING_FONT, true);
    const hasStickers = summary.stickers.length > 0;
    const sy = hasStickers ? 160 : 185;
    const pop = 1 + Math.max(0, Math.sin(Math.min(1, t * 2) * Math.PI)) * 0.25;
    ctx.save();
    ctx.translate(cx - 60, sy);
    ctx.scale(pop, pop);
    this.bigStar(0, 0, 44);
    ctx.restore();
    this.text(this.countLabel(summary.stars), cx + 30, sy + 4, SUMMARY_FONT, true);
    if (summary.record) {
      // Record: gouden rondje met een kroontje.
      const rx = cx + 130;
      const wobble = Math.sin(time * 4) * 0.12;
      ctx.save();
      ctx.translate(rx, sy);
      ctx.rotate(wobble);
      ctx.fillStyle = PALETTE.yellow;
      ctx.strokeStyle = PALETTE.orangeDark;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(0, 0, 32, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      drawIcon(ctx, 'crown', 0, 2, 40, PALETTE.orangeDark);
      ctx.restore();
    }
    // De opdracht van deze rit (met vinkje als hij lukte; anders gewoon hoe ver het kind kwam).
    const m = summary.mission;
    const mw = this.missionCardWidth(m);
    this.missionCard(m, cx - mw / 2, sy + 62, 1.25, settings, time);
    const stickerY = 340;
    for (let i = 0; i < summary.stickers.length; i++) {
      const k = Math.min(1, Math.max(0, (t - 0.6 - i * 0.35) / 0.3));
      if (k <= 0) continue;
      const x = cx + (i - (summary.stickers.length - 1) / 2) * 96;
      const scale = (k < 1 ? k * 1.2 : 1) * 0.85;
      ctx.save();
      ctx.translate(x, stickerY);
      ctx.scale(scale, scale);
      ctx.translate(-x, -stickerY);
      this.sticker(summary.stickers[i], x, stickerY, true, time + i);
      ctx.restore();
    }
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

  /** Zacht pulserende uitnodiging om te springen (met tikkende hand), tot het kind voor het eerst springt. */
  private jumpHint(x: number, y: number, time: number): void {
    const { ctx } = this;
    const scale = 1 + Math.sin(time * 5) * 0.05;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    this.iconText('hand', JUMP_HINT, 0, 0, SUBTITLE_FONT, true, time);
    ctx.restore();
  }

  private measure(value: string, fontSpec: string): number {
    const key = fontSpec + '|' + value;
    let w = this.textWidths.get(key);
    if (w === undefined) {
      this.ctx.font = fontSpec;
      w = this.ctx.measureText(value).width;
      this.textWidths.set(key, w);
    }
    return w;
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

  /** Icoon + tekst als gecentreerde groep. Het icoon krijgt een donker rondje zodat het overal goed zichtbaar is. */
  private iconText(
    icon: IconName,
    value: string,
    cx: number,
    cy: number,
    fontSpec: string,
    outlined: boolean,
    time = 0,
  ): void {
    const { ctx } = this;
    const iconSize = fontSpec === HEADING_FONT ? 56 : 40;
    const gap = 14;
    const textW = this.measure(value, fontSpec);
    const total = iconSize + gap + textW;
    const iconX = cx - total / 2 + iconSize / 2;
    ctx.fillStyle = UI_STYLE.text.outline;
    ctx.beginPath();
    ctx.arc(iconX, cy, iconSize / 2 + 4, 0, Math.PI * 2);
    ctx.fill();
    drawIcon(ctx, icon, iconX, cy, iconSize * 0.72, UI_STYLE.text.fill, time);
    this.text(value, cx - total / 2 + iconSize + gap + textW / 2, cy, fontSpec, outlined);
  }

  /** Grote oranje knop met icoon en tekst. */
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

    const cx = x + width / 2;
    const cy = y + height / 2;
    if (!button.icon) {
      this.text(button.label, cx, cy, BUTTON_FONT);
      return;
    }
    const iconSize = Math.min(44, height * 0.55);
    const gap = 14;
    const textW = this.measure(button.label, BUTTON_FONT);
    const total = iconSize + gap + textW;
    drawIcon(ctx, button.icon, cx - total / 2 + iconSize / 2, cy, iconSize, style.text);
    this.text(button.label, cx - total / 2 + iconSize + gap + textW / 2, cy, BUTTON_FONT);
  }

  /** Vierkante oranje knop met alleen een wit icoon (pauze, tandwiel). */
  private iconButton(button: Button, icon: IconName): void {
    const { ctx } = this;
    const { x, y, width, height } = button.rect;
    const style = UI_STYLE.button;
    ctx.fillStyle = style.shadow;
    ctx.beginPath();
    roundRectPath(ctx, x, y + 4, width, height, style.smallRadius);
    ctx.fill();
    ctx.fillStyle = style.fill;
    ctx.beginPath();
    roundRectPath(ctx, x, y, width, height, style.smallRadius);
    ctx.fill();
    drawIcon(ctx, icon, x + width / 2, y + height / 2, width * 0.55, style.text);
  }

  /** Instellingenrij: plaatje + label links, grote aan/uit-schakelaar met ✓/✗ rechts. De hele rij is aantikbaar. */
  private toggleRow(button: Button, on: boolean, picture: ObstacleKind | IconName): void {
    const { ctx } = this;
    const { x, y, width, height } = button.rect;
    ctx.fillStyle = UI_STYLE.panel;
    ctx.beginPath();
    roundRectPath(ctx, x, y, width, height, UI_STYLE.button.radius);
    ctx.fill();

    // Plaatje: het obstakel zelf, of een icoon.
    const px = x + 40;
    const py = y + height / 2;
    if (picture === 'cone' || picture === 'rock' || picture === 'crate' || picture === 'hedgehog') {
      this.obstacleIcons.drawIcon(picture, px, py, height * 0.68);
    } else {
      drawIcon(ctx, picture, px, py, height * 0.6, UI_STYLE.text.outline);
    }

    ctx.font = SUBTITLE_FONT;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = UI_STYLE.text.outline;
    ctx.fillText(button.label, x + 78, y + height / 2 + 1);

    // Schakelaar: kleur, AAN/UIT en een ✓ of ✗ in het knopje.
    const sw = 116;
    const sh = 50;
    const sx = x + width - sw - 14;
    const sy = y + (height - sh) / 2;
    ctx.fillStyle = on ? COLORS.toggleOn : COLORS.toggleOff;
    ctx.beginPath();
    roundRectPath(ctx, sx, sy, sw, sh, sh / 2);
    ctx.fill();
    const knobR = sh / 2 - 5;
    const knobX = on ? sx + sw - sh / 2 : sx + sh / 2;
    ctx.fillStyle = UI_STYLE.text.fill;
    ctx.beginPath();
    ctx.arc(knobX, sy + sh / 2, knobR, 0, Math.PI * 2);
    ctx.fill();
    drawIcon(ctx, on ? 'check' : 'cross', knobX, sy + sh / 2, knobR * 1.1, on ? COLORS.toggleOn : COLORS.toggleOff);
    ctx.font = TOGGLE_FONT;
    ctx.textAlign = 'center';
    ctx.fillStyle = UI_STYLE.text.fill;
    ctx.fillText(on ? 'AAN' : 'UIT', on ? sx + (sw - sh) / 2 + 4 : sx + sh + (sw - sh) / 2 - 4, sy + sh / 2 + 1);
  }

  /**
   * Rittenboekje: vier tegels (beste rit, ritten, afstand, regenbogen) met een plaatje en het aantal,
   * daaronder de stickers. Geen ranglijst: alleen de eigen vooruitgang.
   */
  private book(cx: number, progress: Progress, settings: Settings, time: number): void {
    const { ctx } = this;
    const { width, height, gap, top } = BOOK_TILE;
    const left = cx - (4 * width + 3 * gap) / 2;
    for (let i = 0; i < 4; i++) {
      const x = left + i * (width + gap);
      ctx.fillStyle = UI_STYLE.panel;
      ctx.beginPath();
      roundRectPath(ctx, x, top, width, height, UI_STYLE.button.radius);
      ctx.fill();
      const px = x + width / 2;
      const py = top + 46;
      const vy = top + 108;
      switch (i) {
        case 0:
          // Beste rit: meeste sterren in één rit.
          this.bigStar(px, py, 30);
          this.tally('star', progress.bestStars, px, vy);
          break;
        case 1:
          // Ritten: de eigen auto.
          ctx.save();
          ctx.translate(px, py + 28);
          ctx.scale(0.55, 0.55);
          this.carPreview.drawBody(CARS[settings.car], 150, 70, 22, 0);
          ctx.restore();
          this.tally('flag', progress.rides, px, vy);
          break;
        case 2:
          // Afstand: een stukje weg met een vlaggetje, in "kilometers".
          ctx.fillStyle = '#6d6d6d';
          ctx.beginPath();
          roundRectPath(ctx, px - 56, py + 6, 112, 20, 6);
          ctx.fill();
          ctx.fillStyle = PALETTE.white;
          for (let d = -46; d < 50; d += 26) ctx.fillRect(px + d, py + 14, 14, 4);
          drawIcon(ctx, 'flag', px + 40, py - 18, 40, PALETTE.red);
          this.value(`${Math.floor(progress.distance / RIDE.unitsPerKm)} km`, px, vy);
          break;
        case 3:
          // Regenbogen: aantal regenboogritten.
          this.colorRainbow(px, py + 18, 34);
          this.tally('rainbow', progress.rainbows, px, vy);
          break;
      }
    }

    // Stickers: rijen van vijf (gecentreerd) op een eigen paneel; nog niet verdiend = grijs.
    const spacing = 100;
    const perRow = 5;
    ctx.fillStyle = UI_STYLE.panel;
    ctx.beginPath();
    roundRectPath(ctx, cx - (perRow / 2) * spacing - 8, 264, perRow * spacing + 16, 196, UI_STYLE.button.radius);
    ctx.fill();
    for (let i = 0; i < STICKERS.length; i++) {
      const id = STICKERS[i].id;
      const row = Math.floor(i / perRow);
      const inRow = Math.min(perRow, STICKERS.length - row * perRow);
      const x = cx + ((i % perRow) - (inRow - 1) / 2) * spacing;
      const y = 312 + row * 96;
      this.sticker(id, x, y, progress.stickers.includes(id), time + i);
    }
  }

  private sticker(id: StickerId, x: number, y: number, earned: boolean, time: number): void {
    const { ctx } = this;
    const look = STICKER_LOOK[id];
    ctx.save();
    if (earned) {
      ctx.translate(x, y);
      ctx.rotate(Math.sin(time * 2) * 0.06);
      ctx.translate(-x, -y);
    } else {
      ctx.globalAlpha = 0.5;
    }
    ctx.fillStyle = earned ? PALETTE.yellow : '#dfe6ee';
    ctx.strokeStyle = earned ? PALETTE.orangeDark : '#9aa8ba';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(x, y, STICKER_R, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    const iconColor = earned ? UI_STYLE.text.outline : 'rgba(30, 60, 110, 0.6)';
    if (look.icon === 'star') {
      ctx.fillStyle = earned ? PALETTE.white : iconColor;
      ctx.beginPath();
      starPath(ctx, x, y, STICKER_R * 0.62, STICKER_R * 0.3);
      ctx.fill();
    } else {
      drawIcon(ctx, look.icon, x, y, STICKER_R * 1.15, iconColor);
    }
    if (look.badge) {
      const bx = x + STICKER_R * 0.72;
      const by = y + STICKER_R * 0.72;
      ctx.font = TOGGLE_FONT;
      const w = Math.max(30, this.measure(look.badge, TOGGLE_FONT) + 14);
      ctx.fillStyle = UI_STYLE.text.outline;
      ctx.beginPath();
      roundRectPath(ctx, bx - w / 2, by - 15, w, 30, 15);
      ctx.fill();
      ctx.fillStyle = UI_STYLE.text.fill;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(look.badge, bx, by + 1);
    }
    ctx.restore();
  }

  /** Aantal als rijtje kleine plaatjes (tot TALLY_MAX, in twee rijen van vijf), daarboven als getal. */
  private tally(icon: 'star' | 'flag' | 'rainbow', n: number, cx: number, cy: number): void {
    if (n === 0 || n > TALLY_MAX) {
      this.value(this.countLabel(n), cx, cy);
      return;
    }
    const { ctx } = this;
    const perRow = 5;
    const rows = Math.ceil(n / perRow);
    const size = 22;
    for (let i = 0; i < n; i++) {
      const row = Math.floor(i / perRow);
      const inRow = Math.min(perRow, n - row * perRow);
      const x = cx + (i % perRow - (inRow - 1) / 2) * (size + 4);
      const y = cy + (row - (rows - 1) / 2) * (size + 2);
      if (icon === 'star') {
        ctx.fillStyle = COLORS.star;
        ctx.strokeStyle = COLORS.starOutline;
        ctx.lineWidth = 2;
        ctx.beginPath();
        starPath(ctx, x, y, size / 2, size / 4.2);
        ctx.fill();
        ctx.stroke();
      } else if (icon === 'rainbow') {
        this.colorRainbow(x, y + 5, size / 2);
      } else {
        drawIcon(ctx, icon, x, y, size, PALETTE.red);
      }
    }
  }

  /** Cache van getallen als tekst (het boekje kan open blijven staan; geen nieuwe strings per frame). */
  private readonly countLabels = new Map<number, string>();

  private countLabel(n: number): string {
    let label = this.countLabels.get(n);
    if (label === undefined) {
      label = String(n);
      this.countLabels.set(n, label);
    }
    return label;
  }

  /** Groot getal in de huisstijl (donkerblauw op een licht paneel). */
  private value(text: string, cx: number, cy: number): void {
    const { ctx } = this;
    ctx.font = SCORE_FONT;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = UI_STYLE.text.outline;
    ctx.fillText(text, cx, cy + 2);
  }

  private bigStar(x: number, y: number, r: number): void {
    const { ctx } = this;
    ctx.fillStyle = COLORS.star;
    ctx.strokeStyle = COLORS.starOutline;
    ctx.lineWidth = 5;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    starPath(ctx, x, y, r, r * 0.48);
    ctx.fill();
    ctx.stroke();
  }

  /** Regenboog in de spelkleuren; (x, y) = midden van de onderkant. */
  private colorRainbow(x: number, y: number, r: number): void {
    const { ctx } = this;
    ctx.save();
    ctx.lineWidth = r * 0.26;
    for (let i = 0; i < RAINBOW.colors.length; i++) {
      ctx.strokeStyle = RAINBOW.colors[i];
      ctx.beginPath();
      ctx.arc(x, y, r * (1 - i * 0.28), Math.PI, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  /** Kaartje van een kiezer: wit, de gekozen optie met een dikke oranje rand. */
  private card(r: Rect, selected: boolean): void {
    const { ctx } = this;
    ctx.fillStyle = selected ? PALETTE.white : 'rgba(255, 255, 255, 0.7)';
    ctx.beginPath();
    roundRectPath(ctx, r.x, r.y, r.width, r.height, 18);
    ctx.fill();
    if (selected) {
      ctx.strokeStyle = UI_STYLE.button.fill;
      ctx.lineWidth = 6;
      ctx.stroke();
    }
  }

  private carPicker(cards: readonly Rect[], settings: Settings, time: number): void {
    const { ctx } = this;
    for (let i = 0; i < cards.length; i++) {
      const r = cards[i];
      const id = CAR_IDS[i];
      const selected = settings.car === id;
      this.card(r, selected);
      ctx.save();
      ctx.translate(r.x + r.width / 2, r.y + r.height - 14);
      const scale = selected ? 0.78 + Math.sin(time * 4) * 0.02 : 0.7;
      ctx.scale(scale, scale);
      this.carPreview.drawBody(CARS[id], 150, 70, 22, selected ? time * 6 : 0);
      ctx.restore();
    }
  }

  private worldPicker(cards: readonly Rect[], settings: Settings): void {
    for (let i = 0; i < cards.length; i++) {
      const id = THEME_IDS[i];
      this.worldCard(cards[i], THEMES[id], settings.theme === id);
    }
  }

  /** Mini-landschapje van een wereld met de naam eronder. */
  private worldCard(r: Rect, theme: Theme, selected: boolean): void {
    const { ctx } = this;
    this.card(r, selected);
    const pad = 7;
    const sx = r.x + pad;
    const sy = r.y + pad;
    const sw = r.width - pad * 2;
    const sh = r.height - 34;

    ctx.save();
    ctx.beginPath();
    roundRectPath(ctx, sx, sy, sw, sh, 12);
    ctx.clip();
    ctx.fillStyle = theme.skyTop;
    ctx.fillRect(sx, sy, sw, sh * 0.5);
    ctx.fillStyle = theme.skyBottom;
    ctx.fillRect(sx, sy + sh * 0.5, sw, sh * 0.5);
    if (theme.stars) {
      ctx.fillStyle = PALETTE.white;
      for (let i = 0; i < 7; i++) ctx.fillRect(sx + 8 + ((i * 37) % (sw - 16)), sy + 6 + ((i * 13) % 22), 2, 2);
    }
    // Hemellichaam
    ctx.fillStyle = theme.celestial.color;
    ctx.beginPath();
    ctx.arc(sx + sw - 20, sy + 16, 9, 0, Math.PI * 2);
    ctx.fill();
    if (theme.celestial.ring) {
      ctx.strokeStyle = theme.celestial.ring;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(sx + sw - 20, sy + 16, 15, 4, -0.35, 0, Math.PI * 2);
      ctx.stroke();
    }
    // Vulkaan of heuvel
    if (theme.farLayer === 'volcano') {
      ctx.fillStyle = theme.farHills;
      ctx.beginPath();
      ctx.moveTo(sx + 10, sy + sh);
      ctx.lineTo(sx + 36, sy + 18);
      ctx.lineTo(sx + 48, sy + 18);
      ctx.lineTo(sx + 76, sy + sh);
      ctx.fill();
      ctx.fillStyle = '#ff7043';
      ctx.fillRect(sx + 36, sy + 18, 12, 5);
    }
    ctx.fillStyle = theme.nearHills;
    ctx.beginPath();
    ctx.ellipse(sx + sw * 0.35, sy + sh, sw * 0.5, sh * 0.42, 0, Math.PI, Math.PI * 2);
    ctx.fill();
    // Weg en berm
    ctx.fillStyle = theme.road;
    ctx.fillRect(sx, sy + sh - 12, sw, 8);
    ctx.fillStyle = theme.grass;
    ctx.fillRect(sx, sy + sh - 4, sw, 4);
    if (theme.decor === 'candy') {
      ctx.fillStyle = PALETTE.white;
      ctx.fillRect(sx + sw - 30, sy + sh - 30, 3, 18);
      ctx.fillStyle = theme.decorA;
      ctx.beginPath();
      ctx.arc(sx + sw - 28.5, sy + sh - 32, 8, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    ctx.font = TOGGLE_FONT;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = UI_STYLE.text.outline;
    ctx.fillText(theme.label, r.x + r.width / 2, r.y + r.height - 13);
  }
}
