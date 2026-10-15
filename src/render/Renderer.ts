import { CAR, CARS } from '../config';
import { THEMES } from '../themes';
import type { GameState, Settings, Viewport, WorldState } from '../types';
import type { Layout } from '../ui/Layout';
import { BackgroundRenderer } from './BackgroundRenderer';
import { CarRenderer } from './CarRenderer';
import { EffectsRenderer } from './EffectsRenderer';
import { FriendRenderer } from './FriendRenderer';
import { ItemsRenderer } from './ItemsRenderer';
import { ObstacleRenderer } from './ObstacleRenderer';
import type { Screen } from './Screen';
import { UIRenderer } from './UIRenderer';

/** Wacht even met de springhint, zodat de auto eerst zichtbaar wegrijdt. */
const JUMP_HINT_DELAY = 0.8;

/** Combineert de deel-renderers. Leest alleen state; wijzigt nooit game-logica. */
export class Renderer {
  private readonly background: BackgroundRenderer;
  private readonly obstacles: ObstacleRenderer;
  private readonly car: CarRenderer;
  private readonly effects: EffectsRenderer;
  private readonly items: ItemsRenderer;
  private readonly friends: FriendRenderer;
  private readonly ui: UIRenderer;

  constructor(private readonly screen: Screen) {
    this.background = new BackgroundRenderer(screen.ctx);
    this.obstacles = new ObstacleRenderer(screen.ctx);
    this.car = new CarRenderer(screen.ctx);
    this.effects = new EffectsRenderer(screen.ctx);
    this.items = new ItemsRenderer(screen.ctx);
    this.friends = new FriendRenderer(screen.ctx);
    this.ui = new UIRenderer(screen.ctx, this.obstacles);
    screen.onResize(() => this.background.invalidate());
  }

  render(state: GameState, world: WorldState, layout: Layout, idleTime: number, settings: Settings): void {
    const view: Viewport = this.screen.viewport;
    const theme = THEMES[settings.theme];
    this.screen.beginFrame(theme.grassEdge);

    const ctx = this.screen.ctx;
    ctx.save();
    // Clip op het speelveld zodat niets in de letterbox-randen tekent.
    ctx.beginPath();
    ctx.rect(0, 0, view.width, view.height);
    ctx.clip();

    // De auto staat op een vaste schermpositie; de wereld scrolt eronder door.
    const carScreenX = view.width * CAR.screenXRatio;
    this.background.render(view, world.distance, idleTime, theme);
    this.friends.render(world, carScreenX, view.width);
    this.items.renderPlatforms(world, carScreenX, view.width);
    this.obstacles.render(world, carScreenX, view.width);
    this.items.renderCollectibles(world, carScreenX, view.width);
    this.effects.renderBehind(world, carScreenX);
    this.car.render(world.car, carScreenX, world.time, state === 'playing' && world.speed > 0, CARS[settings.car]);
    this.effects.render(world, carScreenX);
    this.friends.renderGifts(world, carScreenX);

    const showJumpHint = state === 'playing' && world.jumpCount === 0 && world.time > JUMP_HINT_DELAY;
    this.ui.render(state, view, layout, idleTime, world, settings, showJumpHint);

    ctx.restore();
  }
}
