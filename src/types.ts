/** Te kiezen auto's (alleen uiterlijk; alle auto's rijden en springen hetzelfde). */
export type CarId = 'classic' | 'racer' | 'jeep' | 'bubble';

/** Te kiezen werelden (thema's). */
export type ThemeId = 'meadow' | 'dino' | 'space' | 'candy';

/** Instellingen die tussen bezoeken bewaard blijven (localStorage). */
export interface Settings {
  obstacles: boolean;
  enemies: boolean;
  sound: boolean;
  /** Oneindig rijden: geen finish en geen garage. */
  endless: boolean;
  car: CarId;
  theme: ThemeId;
}

/** Stickers in het rittenboekje: mijlpalen, geen ranglijst. */
export type StickerId =
  | 'firstRide'
  | 'rides10'
  | 'bestRide10'
  | 'stars100'
  | 'firstRainbow'
  | 'rainbows10'
  | 'distance50'
  | 'allWorlds'
  | 'missions5';

/** Persoonlijke voortgang (localStorage), alleen tellers: niets persoonlijks. */
export interface Progress {
  /** Ritten van minstens RIDE.minTime seconden. */
  rides: number;
  /** Meeste sterren in één rit. */
  bestStars: number;
  totalStars: number;
  /** Totaal gereden afstand in wereld-eenheden. */
  distance: number;
  /** Aantal regenboogritten. */
  rainbows: number;
  /** Gelukte opdrachten. */
  missions: number;
  /** Werelden waarin al gereden is. */
  worlds: ThemeId[];
  stickers: StickerId[];
}

/**
 * Toestanden: start ⇄ instellingen, start ⇄ rittenboekje, start → kiezen (auto + wereld) → spelen ⇄ pauze,
 * spelen → klaar (overzicht na de finish) → opnieuw spelen of kiezen.
 */
export type GameState = 'ready' | 'settings' | 'book' | 'choose' | 'playing' | 'paused' | 'finished';

/** Opdracht voor één rit: sterren, over obstakels springen, regenboogstukje, springen bij een vriendje, turbo. */
export type MissionKind = 'stars' | 'jumpOver' | 'rainbowPiece' | 'friendJump' | 'turbo';

export interface Mission {
  kind: MissionKind;
  /** Hoeveel er nodig is (klein: geen hoge scores). */
  target: number;
  count: number;
  /** Wereldtijd waarop de opdracht lukte; -1 = nog niet. */
  doneTime: number;
  /** Wereldtijd waarop de opdracht begon (het kaartje komt dan groot in beeld). */
  startTime: number;
  /** Sterren bij de start van de opdracht (een sterrenopdracht telt vanaf daar). */
  startScore: number;
}

/** Rijden, na de finish uitrijden naar de garage, of geparkeerd. */
export type RidePhase = 'riding' | 'finishing' | 'parked';

/** Wat het overzicht na de finish laat zien. */
export interface RideSummary {
  stars: number;
  /** Meer sterren dan ooit in één rit. */
  record: boolean;
  /** In deze rit verdiende stickers. */
  stickers: StickerId[];
  /** De opdracht van deze rit (met hoe ver het kind kwam). */
  mission: Mission;
  /** Sfeertijd waarop het overzicht verscheen (voor de animaties). */
  shownAt: number;
}

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

/** Springkussen op de weg: erop rijden of landen geeft een zachte, extra hoge sprong. */
export interface Pad {
  active: boolean;
  /** Wereldpositie van het midden. */
  x: number;
  /** Wereldtijd waarop de auto erop veerde; -1 = nog niet. */
  usedTime: number;
}

/** Spelmoment van een wereld: iets waar je doorheen of overheen springt voor een verrassing. */
export interface Moment {
  active: boolean;
  /** Wereldpositie van het midden. */
  x: number;
  y: number;
  /** Wereldtijd waarop de auto het raakte; -1 = nog niet. */
  hitTime: number;
}

/** Kort verrassingstafereel langs de route, altijd aangekondigd met een bordje. */
export type SceneKind = 'ducks' | 'tunnel' | 'herd';

export interface Scene {
  active: boolean;
  kind: SceneKind;
  /** Plek van het bordje; het tafereel zelf staat SCENES.eventOffset verder. */
  x: number;
  /** Wereldtijd waarop het tafereel begon (eendjes gaan oversteken, kudde huppelt opzij); -1 = nog niet. */
  triggerTime: number;
  /** Wereldtijd waarop de auto erdoor/erlangs is (tunnel: eronderdoor); -1 = nog niet. */
  passTime: number;
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
export type FriendKind = 'bunny' | 'bear' | 'dinoGreen' | 'dinoOrange' | 'alien' | 'robot' | 'unicorn' | 'cupcake';

/** Reactie van een vriendje op wat het kind doet: duimpje (gelukt), verbaasd (botsing), dansje (regenboog/turbo). */
export type FriendReaction = 'none' | 'thumbs' | 'surprised' | 'dance';

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
  reaction: FriendReaction;
  /** Wereldtijd waarop de reactie begon. */
  reactionTime: number;
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
  /** Oneindig rijden (instellingenscherm): geen finish, na elke gelukte opdracht volgt een nieuwe. */
  endless: boolean;
  /** Aantal gelukte opdrachten in deze rit (voor het rittenboekje). */
  missionsDone: number;
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
  /** Vaste pool met springkussens. */
  pads: Pad[];
  /** Vaste pool met spelmomenten van de gekozen wereld. */
  moments: Moment[];
  /** Het huidige (of laatste) verrassingstafereel; er is er hooguit één tegelijk. */
  scene: Scene;
  /** Afstand waarop het volgende tafereel mag beginnen. */
  nextSceneAt: number;
  /** Resterende turbotijd (s); 0 = geen turbo. */
  boostTimer: number;
  /** Resterende onkwetsbare tijd (s) na de regenboogrit, zodat de landing altijd veilig is. */
  shieldTimer: number;
  /** Aantal verzamelde regenboogkleuren (0–3). */
  rainbowPieces: number;
  /** Aantal regenboogritten in deze ronde (voor het rittenboekje). */
  rainbowRides: number;
  /** Plek van de finishlijn; de garage staat RIDE.garageDistance verder. */
  finishX: number;
  ridePhase: RidePhase;
  /** Wereldtijd van de finish en van het parkeren; -1 = nog niet. */
  finishTime: number;
  parkedTime: number;
  /** De juichende vriendjes bij de finish staan er al. */
  finishFriends: boolean;
  /** Opdracht van deze rit. */
  mission: Mission;
  /** Resterende tijd (s) van de regenboogrit; 0 = geen rit. */
  rainbowRide: number;
  /** Gekozen wereld: bepaalt welke vriendjes er langs de weg staan. */
  theme: ThemeId;
  /** Vaste pool met vriendjes. */
  friends: Friend[];
  /** Afstand waarop het volgende vriendje verschijnt. */
  nextFriendAt: number;
  /** Laatste afzet en landing (tijd en plek), voor de veerstreepjes en stofwolkjes; tijd -1 = nog niet. */
  lastJumpTime: number;
  lastJumpX: number;
  lastJumpY: number;
  lastLandTime: number;
  lastLandX: number;
  lastLandY: number;
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
  /** Over een obstakel gesprongen (zonder botsing). */
  cleared: boolean;
  /** Op een springkussen omhoog geveerd. */
  bounced: boolean;
  /** Een spelmoment van de wereld geraakt (pluis, ei, bel, suikerspin). */
  momentHit: boolean;
  /** Een verrassingstafereel begint (eendjes, kudde) of de auto rijdt door de regenboogtunnel. */
  sceneStart: boolean;
  scenePass: boolean;
  /** Gesprongen vlak bij een vriendje (dat danst dan mee). */
  friendJump: boolean;
  /** De opdracht is gelukt. */
  missionDone: boolean;
  /** Over de finishlijn gereden. */
  finished: boolean;
  /** In de garage gestopt. */
  parked: boolean;
}

/** Icoon naast de tekst van een knop (voor kinderen die nog niet lezen). */
export type ButtonIcon = 'play' | 'restart' | 'check' | 'car';

/** Een knop in de canvas-UI. */
export interface Button {
  icon?: ButtonIcon;
  id:
    | 'start'
    | 'pause'
    | 'resume'
    | 'restart'
    | 'settings'
    | 'book'
    | 'toggleObstacles'
    | 'toggleEnemies'
    | 'toggleSound'
    | 'toggleEndless'
    | 'done'
    | 'go'
    | 'back'
    | 'again'
    | 'chooseAgain';
  rect: Rect;
  label: string;
}
