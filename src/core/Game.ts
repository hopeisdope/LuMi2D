import type { Sound } from '../audio/Sound';
import type { InputManager } from '../input/InputManager';
import type { Renderer } from '../render/Renderer';
import type { Screen } from '../render/Screen';
import { CAR_IDS, loadSettings, saveSettings, THEME_IDS } from '../settings/Settings';
import type { GameState, InputAction, Settings, Vec2, WorldState } from '../types';
import { hitCard, hitTest, Layout } from '../ui/Layout';
import { createWorld, jump, resetWorld, updateWorld } from '../world/World';
import { GameLoop } from './GameLoop';

/**
 * Regisseert de game: toestandsmachine (ready ⇄ settings, ready → choose → playing ⇄ paused, paused → choose),
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
  /** Bewaarde instellingen (localStorage); gelden voor elke nieuwe ronde. */
  private readonly settings: Settings = loadSettings();

  constructor(
    private readonly screen: Screen,
    private readonly input: InputManager,
    private readonly renderer: Renderer,
    private readonly sound: Sound,
    onError: (error: unknown) => void,
  ) {
    this.applySettings();
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

  /**
   * Naar het kiesscherm, vóór elke nieuwe ronde. De wereld wordt alvast leeggemaakt, zodat de
   * achtergrond de gekozen wereld en auto rustig laat zien.
   */
  openChooser(): void {
    if (this.state !== 'ready' && this.state !== 'paused') return;
    resetWorld(this.world);
    this.input.clear();
    this.state = 'choose';
  }

  /** Start de ronde met de gekozen auto en wereld; daarna liggen die vast tot de volgende ronde. */
  start(): void {
    if (this.state !== 'choose') return;
    resetWorld(this.world);
    this.input.clear();
    this.state = 'playing';
  }

  /** Terug van het kiesscherm naar het startscherm. */
  backToStart(): void {
    if (this.state !== 'choose') return;
    this.state = 'ready';
  }

  pause(): void {
    if (this.state !== 'playing') return;
    this.state = 'paused';
  }

  resume(): void {
    if (this.state !== 'paused') return;
    this.state = 'playing';
  }

  /** Opnieuw: een nieuwe ronde begint altijd via het kiesscherm. */
  restart(): void {
    this.openChooser();
  }

  /** Zet de instellingen door naar wereld en geluid. */
  private applySettings(): void {
    this.world.obstaclesEnabled = this.settings.obstacles;
    this.world.enemiesEnabled = this.settings.enemies;
    this.world.theme = this.settings.theme;
    this.sound.enabled = this.settings.sound;
  }

  /** Wijzigt een aan/uit-instelling, past hem direct toe en bewaart hem. */
  private toggleSetting(key: 'obstacles' | 'enemies' | 'sound'): void {
    this.settings[key] = !this.settings[key];
    this.applySettings();
    saveSettings(this.settings);
  }

  /** Kiest een auto of wereld (alleen op het kiesscherm) en bewaart de keuze. */
  private choose(kind: 'car' | 'theme', index: number): void {
    if (this.state !== 'choose') return;
    if (kind === 'car') this.settings.car = CAR_IDS[index];
    else this.settings.theme = THEME_IDS[index];
    this.applySettings();
    saveSettings(this.settings);
    this.sound.play('tap');
  }

  openSettings(): void {
    if (this.state !== 'ready') return;
    this.state = 'settings';
  }

  closeSettings(): void {
    if (this.state !== 'settings') return;
    this.state = 'ready';
  }

  togglePause(): void {
    if (this.state === 'playing') this.pause();
    else if (this.state === 'paused') this.resume();
  }

  private readonly update = (dt: number): void => {
    this.input.drain(this.handleAction);

    if (this.state === 'playing') {
      updateWorld(this.world, dt);
      this.playWorldSounds();
      this.ambientTime += dt;
    } else if (this.state === 'ready' || this.state === 'settings' || this.state === 'choose') {
      this.ambientTime += dt;
    }
  };

  /** Geluid bij de gebeurtenissen van dit frame. */
  private playWorldSounds(): void {
    const e = this.world.events;
    if (e.bumped) this.sound.play('bump');
    else if (e.jumped) this.sound.play('jump');
    else if (e.landed) this.sound.play('land');
    if (e.scored) this.sound.play('star');
    if (e.boosted) this.sound.play('boost');
    if (e.rainbowRide) this.sound.play('rainbowRide');
    else if (e.rainbowPiece) this.sound.play('rainbowPiece');
    if (e.friendGift) this.sound.play('gift');
    else if (e.friendCheer) this.sound.play('cheer');
    if (e.friendDemo) this.sound.play('hup');
  }

  private readonly render = (): void => {
    this.renderer.render(this.state, this.world, this.layout, this.ambientTime, this.settings);
  };

  private readonly handleAction = (action: InputAction): void => {
    switch (action.type) {
      case 'togglePause':
        if (this.state === 'settings') this.closeSettings();
        else if (this.state === 'choose') this.backToStart();
        else this.togglePause();
        break;
      case 'jump':
        if (this.state === 'playing') jump(this.world);
        break;
      case 'confirm':
        if (this.state === 'ready') this.openChooser();
        else if (this.state === 'choose') this.start();
        else if (this.state === 'settings') this.closeSettings();
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
        // Tandwiel opent de instellingen; overal elders tikken gaat naar het kiesscherm (makkelijk voor jonge kinderen).
        this.sound.play('tap');
        if (hitTest(this.layout.settings.rect, p.x, p.y)) this.openSettings();
        else this.openChooser();
        break;
      case 'choose': {
        // Alleen kaartjes en knoppen reageren, zodat er niet per ongeluk een ronde start.
        const car = hitCard(this.layout.carCards, p.x, p.y);
        const world = hitCard(this.layout.worldCards, p.x, p.y);
        if (car >= 0) this.choose('car', car);
        else if (world >= 0) this.choose('theme', world);
        else if (hitTest(this.layout.go.rect, p.x, p.y)) {
          this.sound.play('tap');
          this.start();
        } else if (hitTest(this.layout.back.rect, p.x, p.y)) {
          this.sound.play('tap');
          this.backToStart();
        }
        break;
      }
      case 'settings':
        // Alleen de knoppen reageren; elders tikken doet niets, zodat er niet per ongeluk iets wijzigt.
        if (hitTest(this.layout.toggleObstacles.rect, p.x, p.y, 0)) this.toggleSetting('obstacles');
        else if (hitTest(this.layout.toggleEnemies.rect, p.x, p.y, 0)) this.toggleSetting('enemies');
        else if (hitTest(this.layout.toggleSound.rect, p.x, p.y, 0)) this.toggleSetting('sound');
        else if (hitTest(this.layout.done.rect, p.x, p.y, 0)) this.closeSettings();
        else break;
        this.sound.play('tap');
        break;
      case 'playing':
        // Pauzeknop heeft voorrang; overal elders tikken = springen.
        if (hitTest(this.layout.pause.rect, p.x, p.y)) {
          this.sound.play('tap');
          this.pause();
        } else jump(this.world);
        break;
      case 'paused':
        if (hitTest(this.layout.resume.rect, p.x, p.y, 0)) this.resume();
        else if (hitTest(this.layout.restart.rect, p.x, p.y, 0)) this.restart();
        else break;
        this.sound.play('tap');
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
