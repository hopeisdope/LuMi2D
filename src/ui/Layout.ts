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

  update(view: Viewport): void {
    const { width: bw, height: bh, gap } = UI.menuButton;
    const cx = view.width / 2;
    const cy = view.height / 2;

    set(this.start.rect, cx - bw / 2, cy + 10, bw, bh);
    set(this.resume.rect, cx - bw / 2, cy - bh - gap / 2 + 30, bw, bh);
    set(this.restart.rect, cx - bw / 2, cy + gap / 2 + 30, bw, bh);

    const { size, margin } = UI.pauseButton;
    set(this.pause.rect, view.width - size - margin, margin, size, size);
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
