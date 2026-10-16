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
  /** Startscherm: opent het rittenboekje. */
  readonly book: Button = { id: 'book', label: 'Rittenboekje', rect: rect() };
  readonly toggleObstacles: Button = { id: 'toggleObstacles', label: 'Pionnen & stenen', rect: rect() };
  readonly toggleEnemies: Button = { id: 'toggleEnemies', label: 'Egels', rect: rect() };
  readonly toggleSound: Button = { id: 'toggleSound', label: 'Geluid', rect: rect() };
  readonly toggleEndless: Button = { id: 'toggleEndless', label: 'Oneindig rijden', rect: rect() };
  readonly done: Button = { id: 'done', label: 'Klaar', icon: 'check', rect: rect() };
  /** Kiesscherm: start de ronde met de gekozen auto en wereld. */
  readonly go: Button = { id: 'go', label: 'Rijden!', icon: 'play', rect: rect() };
  /** Kiesscherm: terug naar het startscherm. */
  readonly back: Button = { id: 'back', label: 'Terug', rect: rect() };
  /** Overzicht na de finish: nog een rit met dezelfde auto en wereld, of opnieuw kiezen. */
  readonly again: Button = { id: 'again', label: 'Nog een keer', icon: 'restart', rect: rect() };
  readonly chooseAgain: Button = { id: 'chooseAgain', label: 'Kiezen', icon: 'car', rect: rect() };

  /** Auto-kiezer op het kiesscherm (volgorde = CAR_IDS). */
  readonly carCards: Rect[] = rects(PICKER_COUNT);
  /** Wereld-kiezer op het kiesscherm (volgorde = THEME_IDS). */
  readonly worldCards: Rect[] = rects(PICKER_COUNT);

  update(view: Viewport): void {
    const { width: bw, height: bh } = UI.menuButton;
    const cx = view.width / 2;
    const { size, margin } = UI.pauseButton;

    // Startscherm: logo, uitnodiging, startknop; tandwiel rechtsboven.
    set(this.start.rect, cx - bw / 2, 250, bw, bh);
    set(this.settings.rect, view.width - size - margin, margin, size, size);
    set(this.book.rect, margin, margin, size, size);

    // Kiesscherm: auto's, werelden en een grote Rijden!-knop; terugknop linksboven.
    placeRow(this.carCards, cx, 100);
    placeRow(this.worldCards, cx, 276);
    set(this.go.rect, cx - bw / 2, 392, bw, bh);
    set(this.back.rect, margin, margin, size, size);

    // Tijdens het spelen: pauzeknop rechtsboven.
    set(this.pause.rect, view.width - size - margin, margin, size, size);

    // Overzicht na de finish: twee (iets bredere) knoppen naast elkaar.
    const ww = UI.summaryButtonWidth;
    set(this.again.rect, cx - ww - UI.menuButton.gap / 2, 410, ww, bh);
    set(this.chooseAgain.rect, cx + UI.menuButton.gap / 2, 410, ww, bh);

    // Pauzescherm: Verder en Opnieuw onder elkaar.
    set(this.resume.rect, cx - bw / 2, 180, bw, bh);
    set(this.restart.rect, cx - bw / 2, 290, bw, bh);

    // Instellingenscherm: vier aan/uit-rijen en een Klaar-knop.
    const row = UI.settingsRow;
    const rowX = cx - row.width / 2;
    const top = UI.settingsTop;
    set(this.toggleObstacles.rect, rowX, top, row.width, row.height);
    set(this.toggleEnemies.rect, rowX, top + (row.height + row.gap), row.width, row.height);
    set(this.toggleSound.rect, rowX, top + 2 * (row.height + row.gap), row.width, row.height);
    set(this.toggleEndless.rect, rowX, top + 3 * (row.height + row.gap), row.width, row.height);
    set(this.done.rect, cx - bw / 2, top + 4 * (row.height + row.gap) + 6, bw, bh);
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
