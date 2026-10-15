import type { InputAction } from '../types';

/**
 * Vertaalt ruwe browser-events (pointer/touch/toetsenbord) naar abstracte
 * InputActions in een wachtrij. De game leest de wachtrij één keer per frame.
 *
 * Coördinaten worden geleverd in CSS-pixels relatief aan de canvas; de game
 * rekent ze om naar wereld-eenheden via de viewport.
 */
export class InputManager {
  private readonly target: HTMLElement;
  private readonly queue: InputAction[] = [];
  private static readonly MAX_QUEUE = 32;

  constructor(target: HTMLElement) {
    this.target = target;
  }

  attach(): void {
    // Pointer Events dekken touch, pen en muis (Safari iPadOS 13+).
    this.target.addEventListener('pointerdown', this.onPointerDown, { passive: false });
    // Touch-events expliciet blokkeren: voorkomt scrollen, pinch-zoom en dubbeltik-zoom in Safari.
    this.target.addEventListener('touchstart', this.preventDefault, { passive: false });
    this.target.addEventListener('touchmove', this.preventDefault, { passive: false });
    this.target.addEventListener('touchend', this.preventDefault, { passive: false });
    document.addEventListener('gesturestart', this.preventDefault, { passive: false });
    document.addEventListener('dblclick', this.preventDefault, { passive: false });
    this.target.addEventListener('contextmenu', this.preventDefault);
    window.addEventListener('keydown', this.onKeyDown);
  }

  detach(): void {
    this.target.removeEventListener('pointerdown', this.onPointerDown);
    this.target.removeEventListener('touchstart', this.preventDefault);
    this.target.removeEventListener('touchmove', this.preventDefault);
    this.target.removeEventListener('touchend', this.preventDefault);
    document.removeEventListener('gesturestart', this.preventDefault);
    document.removeEventListener('dblclick', this.preventDefault);
    this.target.removeEventListener('contextmenu', this.preventDefault);
    window.removeEventListener('keydown', this.onKeyDown);
  }

  /** Geeft alle acties sinds de vorige aanroep door aan `handler` en leegt de wachtrij. */
  drain(handler: (action: InputAction) => void): void {
    for (let i = 0; i < this.queue.length; i++) handler(this.queue[i]);
    this.queue.length = 0;
  }

  clear(): void {
    this.queue.length = 0;
  }

  private push(action: InputAction): void {
    if (this.queue.length < InputManager.MAX_QUEUE) this.queue.push(action);
  }

  private readonly onPointerDown = (event: PointerEvent): void => {
    event.preventDefault();
    // Alleen de primaire knop / eerste vinger telt als tik.
    if (!event.isPrimary || event.button > 0) return;
    const rect = this.target.getBoundingClientRect();
    this.push({ type: 'tap', x: event.clientX - rect.left, y: event.clientY - rect.top });
  };

  private readonly onKeyDown = (event: KeyboardEvent): void => {
    if (event.repeat) return;
    switch (event.code) {
      case 'Escape':
      case 'KeyP':
        event.preventDefault();
        this.push({ type: 'togglePause' });
        break;
      case 'Space':
      case 'Enter':
        event.preventDefault();
        this.push({ type: 'confirm' });
        break;
    }
  };

  private readonly preventDefault = (event: Event): void => {
    if (event.cancelable) event.preventDefault();
  };
}
