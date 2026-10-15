import { UI } from '../config';
import type { Button, Rect, Viewport } from '../types';

const PICKER_COUNT = 4;

function rect(): Rect {
  return { x: 0, y: 0, width: 0, height: 0 };
}

function rects(count: number): Rect[] {
  const list: Rect[] = [];
  for (let i = 0; i < count; i++) list.push(rect());
  return list;
}

/**
 * Posities van de canvas-knoppen en kiezer-kaartjes. Wordt alleen bij een resize herberekend;
 * de Rect-objecten worden hergebruikt (geen allocaties per frame).
 */
export class Layout {
  readonly start: Button = { id: 'start', label: 'Start', icon: 'play', rect: rect() };
  readonly pause: Button = { id: 'pause', label: 'Pauze', rect: rect() };
  readonly resume: Button = { id: 'resume', label: 'Verder', icon: 'play', rect: rect() };
  readonly restart: Button = { id: 'restart', label: 'Opnieuw', icon: 'restart', rect: rect() };
  readonly settings: Button = { id: 'settings', label: 'Instellingen', rect: rect() };
  readonly toggleObstacles: Button = { id: 'toggleObstacles', label: 'Pionnen & stenen', rect: rect() };
  readonly toggleEnemies: Button = { id: 'toggleEnemies', label: 'Egels', rect: rect() };
  readonly toggleSound: Button = { id: 'toggleSound', label: 'Geluid', rect: rect() };
  readonly done: Button = { id: 'done', label: 'Klaar', icon: 'check', rect: rect() };

  /** Auto-kiezer op het startscherm (volgorde = CAR_IDS). */
  readonly startCarCards: Rect[] = rects(PICKER_COUNT);
  /** Auto-kiezer op het pauzescherm. */
  readonly pauseCarCards: Rect[] = rects(PICKER_COUNT);
  /** Wereld-kiezer in de instellingen (volgorde = THEME_IDS). */
  readonly worldCards: Rect[] = rects(PICKER_COUNT);

  update(view: Viewport): void {
    const { width: bw, height: bh } = UI.menuButton;
    const cx = view.width / 2;

    // Startscherm: logo, uitnodiging, auto-kiezer, startknop.
    placeRow(this.startCarCards, cx, 182);
    set(this.start.rect, cx - bw / 2, 300, bw, bh);

    // Pauzescherm: titel, auto-kiezer, Verder en Opnieuw naast elkaar.
    placeRow(this.pauseCarCards, cx, 112);
    const pw = 250;
    const gap = 24;
    set(this.resume.rect, cx - pw - gap / 2, 236, pw, bh);
    set(this.restart.rect, cx + gap / 2, 236, pw, bh);

    const { size, margin } = UI.pauseButton;
    set(this.pause.rect, view.width - size - margin, margin, size, size);
    // Tandwiel op het startscherm, op dezelfde plek als de pauzeknop tijdens het spelen.
    set(this.settings.rect, view.width - size - margin, margin, size, size);

    // Instellingenscherm: drie aan/uit-rijen, wereld-kiezer en een Klaar-knop.
    const row = UI.settingsRow;
    const rowX = cx - row.width / 2;
    const top = UI.settingsTop;
    set(this.toggleObstacles.rect, rowX, top, row.width, row.height);
    set(this.toggleEnemies.rect, rowX, top + (row.height + row.gap), row.width, row.height);
    set(this.toggleSound.rect, rowX, top + 2 * (row.height + row.gap), row.width, row.height);
    const worldTop = top + 3 * (row.height + row.gap) + 8;
    placeRow(this.worldCards, cx, worldTop);
    set(this.done.rect, cx - bw / 2, worldTop + UI.pickerCard.height + 18, bw, 72);
  }
}

/** Zet kiezer-kaartjes gecentreerd naast elkaar. */
function placeRow(cards: Rect[], cx: number, top: number): void {
  const { width, height, gap } = UI.pickerCard;
  const total = cards.length * width + (cards.length - 1) * gap;
  for (let i = 0; i < cards.length; i++) set(cards[i], cx - total / 2 + i * (width + gap), top, width, height);
}

function set(r: Rect, x: number, y: number, w: number, h: number): void {
  r.x = x;
  r.y = y;
  r.width = w;
  r.height = h;
}

/** Hit-test met wat extra marge: vingers van kinderen zijn niet altijd precies. */
export function hitTest(r: Rect, x: number, y: number, padding = 12): boolean {
  return x >= r.x - padding && x <= r.x + r.width + padding && y >= r.y - padding && y <= r.y + r.height + padding;
}

/** Index van het aangetikte kaartje, of -1. Zonder extra marge: kaartjes liggen dicht naast elkaar. */
export function hitCard(cards: readonly Rect[], x: number, y: number): number {
  for (let i = 0; i < cards.length; i++) if (hitTest(cards[i], x, y, 0)) return i;
  return -1;
}
