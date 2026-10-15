/** Toestanden van de game. Uitbreidbaar met bv. 'gameOver' in een latere fase. */
export type GameState = 'ready' | 'playing' | 'paused';

export interface Vec2 {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Afmetingen van het virtuele scherm (wereld-eenheden) en de schaal naar CSS-pixels. */
export interface Viewport {
  width: number;
  height: number;
  /** CSS-pixels per wereld-eenheid. */
  scale: number;
  /** Device pixels per CSS-pixel (begrensd). */
  pixelRatio: number;
}

/**
 * Abstracte acties die de input-laag levert. De game-logica kent alleen acties,
 * geen touch/muis/toetsenbord. Wat een tik betekent (knop of springen) bepaalt de game.
 */
export type InputAction =
  | { type: 'tap'; x: number; y: number }
  | { type: 'jump' }
  | { type: 'togglePause' }
  | { type: 'confirm' };

export interface Car {
  /** Wereldpositie (x groeit met de afgelegde afstand). */
  x: number;
  /** Y van de onderkant van de wielen. */
  y: number;
  /** Verticale snelheid (negatief = omhoog). */
  vy: number;
  onGround: boolean;
  /** Resterende tijd (s) waarin een eerder gevraagde sprong nog wordt uitgevoerd bij de landing. */
  jumpBuffer: number;
  /** Aflopende timer (s) na de landing; gebruikt voor het inveren (visueel). */
  landingTimer: number;
  width: number;
  height: number;
  wheelRadius: number;
  /** Rotatie van de wielen in radialen (visueel). */
  wheelAngle: number;
}

export interface WorldState {
  /** Huidige snelheid in wereld-eenheden per seconde. */
  speed: number;
  /** Doelsnelheid; later instelbaar/oplopend met moeilijkheidsgraad. */
  targetSpeed: number;
  /** Totale afgelegde afstand — basis voor scrollen (en later score). */
  distance: number;
  /** Verstreken speeltijd in seconden. */
  time: number;
  /** Aantal sprongen in deze ronde (o.a. voor de springhint; later voor feedback). */
  jumpCount: number;
  car: Car;
  /** Gebeurtenissen van het laatste update-frame (voor later: geluid en feedback). */
  events: WorldEvents;
}

/** Vlaggen die elk frame opnieuw worden gezet; geen allocaties per gebeurtenis. */
export interface WorldEvents {
  jumped: boolean;
  landed: boolean;
}

/** Een knop in de canvas-UI. */
export interface Button {
  id: 'start' | 'pause' | 'resume' | 'restart';
  rect: Rect;
  label: string;
}
