/** Te kiezen auto's (alleen uiterlijk; alle auto's rijden en springen hetzelfde). */
export type CarId = 'classic' | 'racer' | 'jeep' | 'bubble';

/** Te kiezen werelden (thema's). */
export type ThemeId = 'meadow' | 'dino' | 'space' | 'candy';

/** Instellingen die tussen bezoeken bewaard blijven (localStorage). */
export interface Settings {
  obstacles: boolean;
  enemies: boolean;
  sound: boolean;
  car: CarId;
  theme: ThemeId;
}

/** Toestanden van de game. Uitbreidbaar met bv. 'gameOver' in een latere fase. */
export type GameState = 'ready' | 'settings' | 'playing' | 'paused';

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
  /** Aflopende timer (s) na een botsing: de auto wiebelt en kan even niet opnieuw botsen. */
  bumpTimer: number;
}

/** Zwevend platform waar de auto op kan springen (alleen van bovenaf; eronderdoor rijden kan). */
export interface Platform {
  active: boolean;
  /** Wereldpositie van de linkerrand. */
  x: number;
  width: number;
  /** Y van het bovenvlak. */
  top: number;
}

/** Iets om te pakken: turbo, regenboogstukje of ster (regenboogrit). */
export type CollectibleKind = 'boost' | 'rainbow' | 'star';

export interface Collectible {
  active: boolean;
  kind: CollectibleKind;
  /** Wereldpositie van het midden. */
  x: number;
  y: number;
  /** Kleur van een regenboogstukje (0 = rood, 1 = geel, 2 = blauw). */
  colorIndex: number;
  collected: boolean;
  /** Wereldtijd van het pakken (voor de animatie). */
  collectedTime: number;
}

/** Vriendjes langs de weg; welke er komen hangt af van de wereld. */
export type FriendKind = 'bunny' | 'bear' | 'dinoGreen' | 'dinoOrange' | 'alien' | 'robot' | 'unicorn' | 'kitty';

/** Wat een vriendje soms geeft als de auto langskomt. */
export type FriendGift = 'none' | 'star' | 'surprise';

/** Een vriendje in de berm. Objecten worden hergebruikt uit een vaste pool. */
export interface Friend {
  active: boolean;
  kind: FriendKind;
  /** Wereldpositie. */
  x: number;
  gift: FriendGift;
  /** Zwaait/juicht al (de auto is dichtbij); -1 = nog niet. */
  cheerTime: number;
  /** Cadeau al gegeven; -1 = nog niet. */
  giftTime: number;
}

export type ObstacleKind = 'cone' | 'rock' | 'crate' | 'hedgehog';

/**
 * Een obstakel of vijand op de weg. Objecten worden hergebruikt uit een vaste pool.
 * Vijanden zijn obstakels die zelf bewegen (vx ≠ 0).
 */
export interface Obstacle {
  /** Hoort dit pool-object op dit moment bij de wereld? */
  active: boolean;
  kind: ObstacleKind;
  /** Bewegende vijand (bv. egel) i.p.v. stilstaand obstakel. */
  enemy: boolean;
  /** Eigen snelheid in wereld-eenheden per seconde (negatief = naar de auto toe). */
  vx: number;
  /** Wereldpositie van het midden van de onderkant. */
  x: number;
  width: number;
  height: number;
  /** De auto is er zonder botsing overheen gekomen (ster verdiend). */
  cleared: boolean;
  /** De auto is ertegenaan gebotst; het obstakel tuimelt weg. */
  hit: boolean;
  /** Wereldtijd van de botsing (voor de tuimelanimatie). */
  hitTime: number;
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
  /** Verdiende sterren: één per obstakel waar de auto zonder botsing overheen springt. */
  score: number;
  /** Wereldtijd van de laatst verdiende ster (voor de ster-animatie); -1 = nog geen. */
  lastScoreTime: number;
  /** Stilstaande obstakels aan/uit (instellingenscherm). */
  obstaclesEnabled: boolean;
  /** Bewegende vijanden aan/uit (instellingenscherm). */
  enemiesEnabled: boolean;
  /** Vaste pool met obstakels; inactieve objecten worden hergebruikt. */
  obstacles: Obstacle[];
  /** Afstand waarop het volgende obstakel verschijnt. */
  nextObstacleAt: number;
  /** Deterministische randomgenerator (seedbaar, handig voor tests). */
  random: () => number;
  /** Vaste pool met platforms. */
  platforms: Platform[];
  /** Vaste pool met dingen om te pakken. */
  collectibles: Collectible[];
  /** Resterende turbotijd (s); 0 = geen turbo. */
  boostTimer: number;
  /** Resterende onkwetsbare tijd (s) na de regenboogrit, zodat de landing altijd veilig is. */
  shieldTimer: number;
  /** Aantal verzamelde regenboogkleuren (0–3). */
  rainbowPieces: number;
  /** Resterende tijd (s) van de regenboogrit; 0 = geen rit. */
  rainbowRide: number;
  /** Gekozen wereld: bepaalt welke vriendjes er langs de weg staan. */
  theme: ThemeId;
  /** Vaste pool met vriendjes. */
  friends: Friend[];
  /** Afstand waarop het volgende vriendje verschijnt. */
  nextFriendAt: number;
  car: Car;
  /** Gebeurtenissen van het laatste update-frame (voor later: geluid en feedback). */
  events: WorldEvents;
}

/** Vlaggen die elk frame opnieuw worden gezet; geen allocaties per gebeurtenis. */
export interface WorldEvents {
  jumped: boolean;
  landed: boolean;
  /** De auto botste tegen een obstakel. */
  bumped: boolean;
  /** Er is een ster verdiend. */
  scored: boolean;
  /** Turbo gepakt. */
  boosted: boolean;
  /** Regenboogstukje gepakt. */
  rainbowPiece: boolean;
  /** Regenboogrit gestart. */
  rainbowRide: boolean;
  /** Een vriendje begint te zwaaien/juichen. */
  friendCheer: boolean;
  /** Een vriendje geeft een ster of verrassing. */
  friendGift: boolean;
}

/** Icoon naast de tekst van een knop (voor kinderen die nog niet lezen). */
export type ButtonIcon = 'play' | 'restart' | 'check';

/** Een knop in de canvas-UI. */
export interface Button {
  icon?: ButtonIcon;
  id: 'start' | 'pause' | 'resume' | 'restart' | 'settings' | 'toggleObstacles' | 'toggleEnemies' | 'toggleSound' | 'done';
  rect: Rect;
  label: string;
}
