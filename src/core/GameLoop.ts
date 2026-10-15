import { LOOP } from '../config';

export type UpdateFn = (dt: number) => void;
export type RenderFn = () => void;

/**
 * requestAnimationFrame-loop met begrensde delta time.
 * Kan veilig meerdere keren start()/stop() krijgen: er draait nooit meer dan één loop.
 */
export class GameLoop {
  private rafId: number | null = null;
  private lastTime = 0;
  private readonly update: UpdateFn;
  private readonly render: RenderFn;
  private readonly onError: (error: unknown) => void;

  constructor(update: UpdateFn, render: RenderFn, onError: (error: unknown) => void) {
    this.update = update;
    this.render = render;
    this.onError = onError;
  }

  get running(): boolean {
    return this.rafId !== null;
  }

  start(): void {
    if (this.rafId !== null) return;
    this.lastTime = performance.now();
    this.rafId = requestAnimationFrame(this.tick);
  }

  stop(): void {
    if (this.rafId === null) return;
    cancelAnimationFrame(this.rafId);
    this.rafId = null;
  }

  /** Arrow-functie: één vaste referentie, geen nieuwe closure per frame. */
  private readonly tick = (now: number): void => {
    if (this.rafId === null) return;
    // Delta in seconden, begrensd zodat een hapering geen grote sprong veroorzaakt.
    const dt = Math.min(Math.max((now - this.lastTime) / 1000, 0), LOOP.maxDeltaTime);
    this.lastTime = now;

    try {
      this.update(dt);
      this.render();
    } catch (error) {
      this.stop();
      this.onError(error);
      return;
    }

    this.rafId = requestAnimationFrame(this.tick);
  };
}
