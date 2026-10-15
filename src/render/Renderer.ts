import { CAR, COLORS } from '../config';
import type { GameState, Viewport, WorldState } from '../types';
import type { Layout } from '../ui/Layout';
import { BackgroundRenderer } from './BackgroundRenderer';
import { CarRenderer } from './CarRenderer';
import type { Screen } from './Screen';
import { UIRenderer } from './UIRenderer';

/** Combineert de deel-renderers. Leest alleen state; wijzigt nooit game-logica. */
export class Renderer {
  private readonly background: BackgroundRenderer;
  private readonly car: CarRenderer;
  private readonly ui: UIRenderer;

  constructor(private readonly screen: Screen) {
    this.background = new BackgroundRenderer(screen.ctx);
    this.car = new CarRenderer(screen.ctx);
    this.ui = new UIRenderer(screen.ctx);
    screen.onResize(() => this.background.invalidate());
  }

  render(state: GameState, world: WorldState, layout: Layout, idleTime: number): void {
    const view: Viewport = this.screen.viewport;
    this.screen.beginFrame(COLORS.grassEdge);

    const ctx = this.screen.ctx;
    ctx.save();
    // Clip op het speelveld zodat niets in de letterbox-randen tekent.
    ctx.beginPath();
    ctx.rect(0, 0, view.width, view.height);
    ctx.clip();

    this.background.render(view, world.distance, idleTime);
    // De auto staat op een vaste schermpositie; de wereld scrolt eronder door.
    this.car.render(world.car, view.width * CAR.screenXRatio, world.time, state === 'playing' && world.speed > 0);
    this.ui.render(state, view, layout);

    ctx.restore();
  }
}
