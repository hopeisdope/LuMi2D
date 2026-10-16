import type { Sound } from '../audio/Sound';
import { RIDE } from '../config';
import type { InputManager } from '../input/InputManager';
import type { Renderer } from '../render/Renderer';
import type { Screen } from '../render/Screen';
import { loadProgress, newLedger, recordRide, saveProgress } from '../settings/Progress';
import { CAR_IDS, loadSettings, saveSettings, THEME_IDS } from '../settings/Settings';
import type { GameState, InputAction, RideSummary, Settings, Vec2, WorldState } from '../types';
import { hitCard, hitTest, Layout } from '../ui/Layout';
import { createWorld, jump, resetWorld, updateWorld } from '../world/World';
import { GameLoop } from './GameLoop';

/**
 * Regisseert de game: toestandsmachine (ready ⇄ settings, ready ⇄ book, ready → choose → playing ⇄ paused, paused → choose),
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
  /** Rittenboekje (localStorage) en wat er van de huidige rit al in staat. */
  private readonly progress = loadProgress();
  private readonly ledger = newLedger();
  /** Overzicht van de laatst uitgereden rit. */
  private readonly summary: RideSummary = {
    stars: 0,
    record: false,
    stickers: [],
    mission: { kind: 'stars', target: 0, count: 0, doneTime: -1 },
    shownAt: 0,
  };

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
    if (this.state !== 'ready' && this.state !== 'paused' && this.state !== 'finished') return;
    resetWorld(this.world);
    this.input.clear();
    this.state = 'choose';
  }

  /** Start de ronde met de gekozen auto en wereld; daarna liggen die vast tot de volgende ronde. */
  start(): void {
    if (this.state !== 'choose' && this.state !== 'finished') return;
    resetWorld(this.world);
    Object.assign(this.ledger, newLedger());
    this.input.clear();
    this.state = 'playing';
  }

  /** Na het parkeren: rit in het boekje en het overzicht tonen. */
  private finishRide(): void {
    const previousBest = this.progress.bestStars;
    this.summary.stickers = recordRide(this.progress, this.ledger, this.world);
    saveProgress(this.progress);
    this.summary.stars = this.world.score;
    this.summary.record = this.world.score > previousBest && this.world.score > 0;
    Object.assign(this.summary.mission, this.world.mission);
    this.summary.shownAt = this.ambientTime;
    this.state = 'finished';
  }

  /** Schrijft de lopende rit (tot nu toe) in het rittenboekje en bewaart het. */
  private recordRide(): void {
    if (this.state !== 'playing' && this.state !== 'paused') return;
    recordRide(this.progress, this.ledger, this.world);
    saveProgress(this.progress);
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

  /** Opnieuw: de rit gaat in het boekje en een nieuwe ronde begint altijd via het kiesscherm. */
  restart(): void {
    this.recordRide();
    this.openChooser();
  }

  openBook(): void {
    if (this.state !== 'ready') return;
    this.state = 'book';
  }

  closeBook(): void {
    if (this.state !== 'book') return;
    this.state = 'ready';
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
      const w = this.world;
      if (w.ridePhase === 'parked' && w.time - w.parkedTime >= RIDE.summaryDelay) this.finishRide();
    } else if (this.state !== 'paused') {
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
    if (e.finished) this.sound.play('finish');
    if (e.parked) this.sound.play('horn');
    if (e.missionDone) this.sound.play('mission');
  }

  private readonly render = (): void => {
    this.renderer.render(this.state, this.world, this.layout, this.ambientTime, this.settings, this.progress, this.summary);
  };

  private readonly handleAction = (action: InputAction): void => {
    switch (action.type) {
      case 'togglePause':
        if (this.state === 'settings') this.closeSettings();
        else if (this.state === 'book') this.closeBook();
        else if (this.state === 'choose') this.backToStart();
        else if (this.state === 'finished') this.openChooser();
        else this.togglePause();
        break;
      case 'jump':
        if (this.state === 'playing') jump(this.world);
        break;
      case 'confirm':
        if (this.state === 'ready') this.openChooser();
        else if (this.state === 'choose') this.start();
        else if (this.state === 'settings') this.closeSettings();
        else if (this.state === 'book') this.closeBook();
        else if (this.state === 'playing') jump(this.world);
        else if (this.state === 'paused') this.resume();
        else if (this.state === 'finished') this.start();
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
        // Tandwiel opent de instellingen, het boekje het rittenboekje; overal elders tikken gaat naar het kiesscherm.
        this.sound.play('tap');
        if (hitTest(this.layout.settings.rect, p.x, p.y)) this.openSettings();
        else if (hitTest(this.layout.book.rect, p.x, p.y)) this.openBook();
        else this.openChooser();
        break;
      case 'book':
        if (hitTest(this.layout.back.rect, p.x, p.y)) {
          this.sound.play('tap');
          this.closeBook();
        }
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
      case 'finished':
        // Nog een keer (zelfde auto en wereld) of naar het kiesscherm.
        if (hitTest(this.layout.again.rect, p.x, p.y, 0)) this.start();
        else if (hitTest(this.layout.chooseAgain.rect, p.x, p.y, 0)) this.openChooser();
        else break;
        this.sound.play('tap');
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
    // Automatisch pauzeren als de app naar de achtergrond gaat; de rit tot nu toe gaat alvast in het boekje.
    if (document.hidden) {
      this.pause();
      this.recordRide();
    }
  };

  private readonly onPageHide = (): void => {
    this.pause();
    this.recordRide();
  };
}
