import { UI } from '../config';
import type { Button, Rect, Viewport } from '../types';

/**
 * Posities van de canvas-knoppen. Wordt alleen bij een resize herberekend;
 * de Rect-objecten worden hergebruikt (geen allocaties per frame).
 */
export class Layout {
  readonly start: Button = { id: 'start', label: 'Start', rect: { x: 0, y: 0, width: 0, height: 0 } };
  readonly pause: Button = { id: 'pause', label: 'Pauze', rect: { x: 0, y: 0, width: 0, height: 0 } };
  readonly resume: Button = { id: 'resume', label: 'Verder', rect: { x: 0, y: 0, width: 0, height: 0 } };
  readonly restart: Button = { id: 'restart', label: 'Opnieuw', rect: { x: 0, y: 0, width: 0, height: 0 } };
  readonly settings: Button = { id: 'settings', label: 'Instellingen', rect: { x: 0, y: 0, width: 0, height: 0 } };
  readonly toggleObstacles: Button = {
    id: 'toggleObstacles',
    label: 'Pionnen & stenen',
    rect: { x: 0, y: 0, width: 0, height: 0 },
  };
  readonly toggleEnemies: Button = { id: 'toggleEnemies', label: 'Egels', rect: { x: 0, y: 0, width: 0, height: 0 } };
  readonly toggleSound: Button = { id: 'toggleSound', label: 'Geluid', rect: { x: 0, y: 0, width: 0, height: 0 } };
  readonly done: Button = { id: 'done', label: 'Klaar', rect: { x: 0, y: 0, width: 0, height: 0 } };

  update(view: Viewport): void {
    const { width: bw, height: bh, gap } = UI.menuButton;
    const cx = view.width / 2;
    const cy = view.height / 2;

    set(this.start.rect, cx - bw / 2, cy + 10, bw, bh);
    set(this.resume.rect, cx - bw / 2, cy - bh - gap / 2 + 30, bw, bh);
    set(this.restart.rect, cx - bw / 2, cy + gap / 2 + 30, bw, bh);

    const { size, margin } = UI.pauseButton;
    set(this.pause.rect, view.width - size - margin, margin, size, size);
    // Tandwiel op het startscherm, op dezelfde plek als de pauzeknop tijdens het spelen.
    set(this.settings.rect, view.width - size - margin, margin, size, size);

    // Instellingenscherm: drie grote aan/uit-rijen en een Klaar-knop.
    const row = UI.settingsRow;
    const rowsTop = UI.settingsTop;
    const rowX = cx - row.width / 2;
    set(this.toggleObstacles.rect, rowX, rowsTop, row.width, row.height);
    set(this.toggleEnemies.rect, rowX, rowsTop + (row.height + row.gap), row.width, row.height);
    set(this.toggleSound.rect, rowX, rowsTop + 2 * (row.height + row.gap), row.width, row.height);
    set(this.done.rect, cx - bw / 2, rowsTop + 3 * (row.height + row.gap) + 12, bw, bh);
  }
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
