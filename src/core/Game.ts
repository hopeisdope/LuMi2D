import type { InputManager } from '../input/InputManager';
import type { Renderer } from '../render/Renderer';
import type { Screen } from '../render/Screen';
import type { GameState, InputAction, Vec2, WorldState } from '../types';
import { hitTest, Layout } from '../ui/Layout';
import { createWorld, jump, resetWorld, updateWorld } from '../world/World';
import { GameLoop } from './GameLoop';

/**
 * Regisseert de game: toestandsmachine (ready → playing ⇄ paused),
 * verwerkt input-acties en roept wereld-update en rendering aan.
 */
export class Game {
  private state: GameState = 'ready';
  private readonly world: WorldState = createWorld();
  private readonly layout = new Layout();
  private readonly loop: GameLoop;
  /** Tijd voor sfeeranimaties (wolken); staat stil tijdens pauze. */
  private ambientTime = 0;
  private readonly tapPoint: Vec2 = { x: 0, y: 0 };

  constructor(
    private readonly screen: Screen,
    private readonly input: InputManager,
    private readonly renderer: Renderer,
    onError: (error: unknown) => void,
  ) {
    this.loop = new GameLoop(this.update, this.render, onError);
    this.layout.update(screen.viewport);
    screen.onResize(() => {
      this.layout.update(screen.viewport);
      this.render(); // direct hertekenen, ook als de loop (nog) niet loopt
    });
  }

  get currentState(): GameState {
    return this.state;
  }

  /** Start de render-loop (idempotent). De game zelf begint in 'ready'. */
  boot(): void {
    document.addEventListener('visibilitychange', this.onVisibilityChange);
    window.addEventListener('pagehide', this.onPageHide);
    this.loop.start();
  }

  start(): void {
    if (this.state !== 'ready') return;
    resetWorld(this.world);
    this.state = 'playing';
  }

  pause(): void {
    if (this.state !== 'playing') return;
    this.state = 'paused';
  }

  resume(): void {
    if (this.state !== 'paused') return;
    this.state = 'playing';
  }

  restart(): void {
    resetWorld(this.world);
    this.input.clear();
    this.state = 'playing';
  }

  togglePause(): void {
    if (this.state === 'playing') this.pause();
    else if (this.state === 'paused') this.resume();
  }

  private readonly update = (dt: number): void => {
    this.input.drain(this.handleAction);

    if (this.state === 'playing') {
      updateWorld(this.world, dt);
      this.ambientTime += dt;
    } else if (this.state === 'ready') {
      this.ambientTime += dt;
    }
  };

  private readonly render = (): void => {
    this.renderer.render(this.state, this.world, this.layout, this.ambientTime);
  };

  private readonly handleAction = (action: InputAction): void => {
    switch (action.type) {
      case 'togglePause':
        this.togglePause();
        break;
      case 'jump':
        if (this.state === 'playing') jump(this.world);
        break;
      case 'confirm':
        if (this.state === 'ready') this.start();
        else if (this.state === 'playing') jump(this.world);
        else if (this.state === 'paused') this.resume();
        break;
      case 'tap':
        this.handleTap(action.x, action.y);
        break;
    }
  };

  private handleTap(cssX: number, cssY: number): void {
    const p = this.screen.toWorld(cssX, cssY, this.tapPoint);
    switch (this.state) {
      case 'ready':
        // Overal tikken start de game: makkelijk voor jonge kinderen.
        this.start();
        break;
      case 'playing':
        // Pauzeknop heeft voorrang; overal elders tikken = springen.
        if (hitTest(this.layout.pause.rect, p.x, p.y)) this.pause();
        else jump(this.world);
        break;
      case 'paused':
        if (hitTest(this.layout.resume.rect, p.x, p.y, 0)) this.resume();
        else if (hitTest(this.layout.restart.rect, p.x, p.y, 0)) this.restart();
        break;
    }
  }

  private readonly onVisibilityChange = (): void => {
    // Automatisch pauzeren als de app naar de achtergrond gaat.
    if (document.hidden) this.pause();
  };

  private readonly onPageHide = (): void => {
    this.pause();
  };
}
