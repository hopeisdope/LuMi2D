import { PALETTE } from './brand/brand';
import type { CarId } from './types';

/**
 * Configuratie van de 2D-game (scherm, wereld, auto, scène).
 * Merkidentiteit (naam, palet, typografie, UI-stijl) staat in brand/brand.ts.
 * Alle afmetingen zijn in "wereld-eenheden" binnen een
 * virtueel scherm met vaste hoogte; de breedte volgt de beeldverhouding.
 */
export const VIEW = {
  /** Vaste virtuele hoogte; schaal = schermhoogte / VIEW.height. */
  height: 540,
  /** Min/max virtuele breedte (begrenst extreme beeldverhoudingen). */
  minWidth: 720,
  maxWidth: 1280,
  /** Max devicePixelRatio voor de canvas (performance op oudere iPads). */
  maxPixelRatio: 2,
} as const;

export const LOOP = {
  /** Maximale delta time per frame (s) — voorkomt sprongen na tab-wissel/hapering. */
  maxDeltaTime: 1 / 20,
} as const;

export const WORLD = {
  /** Y-positie van de grondlijn (bovenkant weg). */
  groundY: 430,
} as const;

export const CAR = {
  /** Horizontale schermpositie als fractie van de virtuele breedte. */
  screenXRatio: 0.25,
  width: 150,
  height: 70,
  wheelRadius: 22,
  /** Kleine vering van de carrosserie (puur visueel). */
  bobAmplitude: 1.5,
  bobFrequency: 9,
} as const;

/**
 * Springen. Vastgelegd als hoogte en luchttijd (makkelijk af te stemmen);
 * zwaartekracht en afzetsnelheid worden daaruit afgeleid.
 */
export const JUMP = {
  /** Hoogte van de top van de sprong (wereld-eenheden). */
  height: 190,
  /** Totale tijd in de lucht (s). Lang en zweverig: geeft jonge kinderen ~0,7 s om op tijd te tikken. */
  airTime: 1.1,
  /** Een tik tot zo lang (s) vóór de landing telt nog als sprong: vergevingsgezind voor kleine kinderen. */
  bufferTime: 0.15,
  /** Duur (s) van het inveren na de landing. */
  landingTime: 0.18,
  /** Hoeveel de carrosserie inveert bij de landing (fractie van de hoogte). */
  landingSquash: 0.12,
  /** Maximale kanteling (radialen) tijdens de sprong: neus omhoog bij stijgen. */
  maxTilt: 0.12,
} as const;

/** Afgeleide sprongfysica: h = v²/2g en t = 2v/g. */
export const JUMP_PHYSICS = {
  gravity: (8 * JUMP.height) / (JUMP.airTime * JUMP.airTime),
  velocity: (4 * JUMP.height) / JUMP.airTime,
} as const;

/** Obstakels op de weg. Afstanden in wereld-eenheden. */
export const OBSTACLES = {
  /** Standaard aan; later te wijzigen via instellingen. */
  enabled: true,
  /** Maximaal aantal tegelijk (vaste pool, geen allocaties tijdens het spelen). */
  poolSize: 8,
  /** Afstand tot het eerste obstakel: eerst rustig wegrijden en de springhint zien. */
  firstDistance: 1100,
  /** Ruimte tussen obstakels: altijd genoeg om te landen en opnieuw te springen. */
  minGap: 650,
  maxGap: 1100,
  /** Hoe ver vóór de auto een obstakel verschijnt (buiten beeld, ook op brede schermen). */
  spawnAhead: 1400,
  /** Obstakels zo ver achter de auto worden opgeruimd. */
  despawnBehind: 800,
  /** Vergevingsgezinde botsing: zoveel eenheden van elke kant van het obstakel tellen niet mee. */
  hitboxInset: 10,
  /** Afmetingen per soort; laag genoeg om er makkelijk overheen te springen. */
  kinds: {
    cone: { width: 40, height: 44 },
    rock: { width: 56, height: 30 },
    crate: { width: 44, height: 38 },
  },
} as const;

/** Bewegende vijanden: een vriendelijke egel die naar de auto toe wandelt. */
export const ENEMIES = {
  /** Standaard aan; te wijzigen via het instellingenscherm. */
  enabled: true,
  /** Kans dat een nieuw obstakel een egel is (als beide soorten aan staan). */
  chance: 0.35,
  /** Wandelsnelheid naar de auto toe (wereld-eenheden per seconde). */
  speed: 45,
  /**
   * Extra ruimte vóór een egel: hij loopt de auto tegemoet en komt zo dichter bij het
   * vorige obstakel; dit houdt genoeg ruimte om te landen en opnieuw te springen.
   */
  extraGap: 250,
  kinds: {
    hedgehog: { width: 58, height: 36 },
  },
} as const;

/** Zwevende platforms (altijd aan; ze maken het spel alleen leuker, nooit moeilijker). */
export const PLATFORMS = {
  poolSize: 3,
  width: 260,
  /** Hoogte boven de weg: hoog genoeg om er met de auto onderdoor te rijden, laag genoeg om op te springen. */
  height: 120,
  thickness: 22,
  /** Kans per nieuw parcoursdeel op een platform met turbo. */
  chance: 0.12,
  /** Hoe ver de auto over de rand mag hangen en toch blijft staan of landt (vergevingsgezind). */
  edgeMargin: 30,
} as const;

/**
 * Springkussens (altijd aan: ze zijn nooit gevaarlijk). Erop rijden of landen geeft een zachte sprong die
 * hoger is dan een gewone; langs de boog hangen sterren.
 */
export const BOUNCE = {
  poolSize: 2,
  /** Kans per nieuw parcoursdeel op een springkussen. */
  chance: 0.1,
  width: 96,
  height: 20,
  /** Hoogte van de top van de veersprong (een gewone sprong is JUMP.height). */
  launchHeight: 260,
  /** Sterren langs de boog, op deze fracties van de luchttijd. */
  starTimes: [0.3, 0.5, 0.7],
} as const;

/** Afgeleide veersprong: v = √(2·g·h), luchttijd t = 2v/g (zelfde zwaartekracht als springen). */
export const BOUNCE_PHYSICS = {
  velocity: Math.sqrt(2 * JUMP_PHYSICS.gravity * BOUNCE.launchHeight),
  airTime: (2 * Math.sqrt(2 * JUMP_PHYSICS.gravity * BOUNCE.launchHeight)) / JUMP_PHYSICS.gravity,
} as const;

/**
 * Eén eigen spelmoment per wereld, altijd door/over te springen: paardenbloempluis (weide), een ei dat uitkomt
 * (dino), zwevende bellen (ruimte) en een suikerspinwolkje (zoetroze). Raken geeft een verrassing en een ster;
 * eronderdoor of erlangs rijden doet niets.
 */
export const MOMENTS = {
  poolSize: 3,
  /** Kans per nieuw parcoursdeel. */
  chance: 0.12,
  /**
   * Hoogte van het midden boven de weg: alleen met een sprong te raken. Het hele autootje telt mee, dus op deze
   * hoogte raakt elke sprong die er langskomt (vanaf ~57 hoog, ook op de top van de sprong op 190).
   */
  height: { meadow: 175, dino: 0, space: 185, candy: 180 },
  radius: 30,
  /** Ei in de berm: de auto moet in de lucht zijn binnen deze afstand van het nestje. */
  eggReach: 100,
  /** Duur (s) van de verrassing na het raken. */
  effectTime: 1.4,
} as const;

/**
 * Verrassingstaferelen: eendjes die oversteken (de auto wacht even), een regenboogtunnel en een kudde schaapjes
 * die opzij huppelt. Altijd met hetzelfde bordje vooraf en een stuk weg zonder obstakels.
 */
export const SCENES = {
  /** Eerste tafereel na zoveel afstand, daarna steeds tussen minGap en maxGap verder. */
  first: 5000,
  minGap: 6000,
  maxGap: 8500,
  /** Stuk weg zonder obstakels vanaf het bordje. */
  length: 1100,
  /** Het tafereel staat zo ver na het bordje. */
  eventOffset: 650,
  ducks: {
    /** Afstand van de auto tot de oversteekplek waarop de eendjes gaan lopen. */
    triggerDistance: 900,
    /** Duur (s) van de oversteek van één eendje; de kuikentjes lopen iets later. */
    crossTime: 3.4,
    stagger: 0.3,
    count: 4,
    /** De voorkant van de auto stopt zo ver vóór de oversteekplek. */
    stopBefore: 150,
  },
  tunnel: { halfWidth: 160, height: 250 },
  herd: { count: 4, spacing: 58, triggerDistance: 560, hopTime: 0.5, stagger: 0.15, berm: 10 },
} as const;

/** Turbo: tijdelijk sneller rijden en obstakels zonder hobbel wegknallen. */
export const BOOST = {
  duration: 4,
  speedFactor: 1.6,
  /** Hoogte van de power-up boven het platform. */
  hover: 46,
} as const;

/** Regenboog: drie kleuren verzamelen → automatische zweefrit over een rij sterren. */
export const RAINBOW = {
  /** Kans per nieuw parcoursdeel op een regenboogstukje (zolang er nog kleuren nodig zijn). */
  chance: 0.14,
  /** Hoogte van een stukje boven de weg: springen nodig. */
  height: 140,
  rideDuration: 5,
  /** Rijsnelheid tijdens de rit als fractie van de basissnelheid. */
  rideSpeedFactor: 1.3,
  /** Zweefhoogte van de auto boven de weg. */
  rideHeight: 200,
  /** Afstand tussen de sterren tijdens de rit. */
  starSpacing: 90,
  /** Onkwetsbaar na de rit, zodat de landing altijd veilig is. */
  shieldAfterRide: 1.5,
  colors: ['#e53935', '#ffd93b', '#29a9f0'],
} as const;

export const COLLECTIBLES = {
  poolSize: 40,
  /** Straal voor het pakken (ruim, zodat het makkelijk lukt). */
  radius: 26,
} as const;

/** Vriendjes langs de weg: zwaaien en juichen, en geven soms een ster of verrassing. */
export const FRIENDS = {
  /** Ruim genoeg voor gewone vriendjes plus de vriendjes die voordoen. */
  poolSize: 6,
  firstDistance: 700,
  minGap: 1100,
  maxGap: 1900,
  /** Zo ver vóór het vriendje begint het te zwaaien en juichen. */
  cheerDistance: 260,
  /** Kans dat een vriendje iets geeft. */
  giftChance: 0.35,
  /** Deel van de cadeaus dat een verrassing is (confetti + extra sterren) i.p.v. één ster. */
  surpriseShare: 0.3,
  surpriseStars: 3,
  /** Duur (s) van het zwaaien/juichen en van de cadeau-animaties. */
  cheerTime: 2,
  giftFlightTime: 0.6,
  confettiTime: 1.2,
} as const;

/** Korte beelden bij elke actie, en reacties van de vriendjes daarop. Tijden in seconden. */
export const FEEDBACK = {
  /** Veerstreepjes onder de auto bij het afzetten. */
  jumpLinesTime: 0.3,
  /** Stofwolkjes bij de landing. */
  dustTime: 0.45,
  /** Glinsterplof bij het pakken van iets. */
  sparkleTime: 0.5,
  /** Vriendjes binnen deze afstand (achter tot vóór de auto, in beeld) reageren op wat het kind doet. */
  reactBehind: 200,
  reactAhead: 650,
  /** Duur van een reactie (duimpje, verbaasd, dansje). */
  reactionTime: 1.2,
} as const;

/**
 * Voordoen: een vriendje staat net achter een obstakel, wijst het aan en springt op het moment dat het kind
 * moet tikken. Het afzetvenster loopt van ~280 tot ~50 eenheden vóór het obstakel; met ~0,3–0,5 s
 * reactietijd na het voorspringen komt het kind daar middenin.
 */
export const COACH = {
  /** Zoveel obstakels op rij zonder botsing, dan stopt het voordoen (tot de volgende botsing). */
  cleanJumpsToStop: 3,
  /** Het vriendje staat zo ver achter het obstakel. */
  standBehind: 70,
  /** Afstand van de auto tot het obstakel waarop het aanwijzen begint. */
  pointFrom: 750,
  /** Afstand van de auto tot het obstakel waarop het vriendje voorspringt. */
  jumpAt: 300,
  /** Hoogte en duur van het voorgedane sprongetje. */
  jumpHeight: 40,
  jumpTime: 0.6,
} as const;

/** Plaatjes uit public/sprites/ (de maten in pixels staan in src/render/spriteData.ts). */
export const SPRITES = {
  /** Draaiend wiel iets groter dan het getekende wiel in het autoplaatje, zodat dat er helemaal onder valt. */
  wheelCover: 1.08,
  /** Hoogte van een vriendje (vak van één houding). */
  friendHeight: 96,
  /** Breedte van de schaduw onder een vriendje. */
  friendShadow: 26,
  /** Tijd (s) per houding bij het juichen: zwaaien en juichen wisselen elkaar af. */
  friendPoseTime: 0.18,
} as const;

/** Wat er gebeurt bij een botsing: geen game over, alleen een vriendelijke hobbel. */
export const BUMP = {
  /** Duur (s) van het wiebelen; zo lang kan de auto niet opnieuw botsen. */
  duration: 0.7,
  /** Snelheid direct na de botsing als fractie van de doelsnelheid; daarna trekt de auto weer op. */
  speedFactor: 0.35,
  /** Maximale wiebelhoek (radialen). */
  wobble: 0.1,
} as const;

/** Botsingsvak van de auto, relatief aan de afmetingen (iets kleiner dan de tekening = vergevingsgezind). */
export const CAR_HITBOX = {
  /** Halve breedte als fractie van de autobreedte: iets smaller dan de wielbasis (±0,28), dus vergevingsgezind. */
  halfWidthRatio: 0.24,
  /** Hoogte als fractie van de autohoogte. */
  heightRatio: 1,
} as const;

export const SCORE = {
  /** Duur (s) van de ster die boven de auto opstijgt. */
  popDuration: 0.9,
} as const;

/** Opdracht per rit: klein en altijd haalbaar; nooit een hoge score. */
export const MISSION = {
  /** Zo lang (s) staat de opdracht groot in beeld aan het begin van de rit. */
  introTime: 2.6,
  /** Daarna schuift hij in zoveel seconden naar zijn plekje linksboven. */
  slideTime: 0.5,
  /** Springen telt als "bij een vriendje" binnen deze afstand. */
  friendJumpDistance: 160,
  /** Hoeveel er nodig is per soort. Sterren: minder als er niets is om overheen te springen. */
  targets: { stars: 5, starsEasy: 3, jumpOver: 3, rainbowPiece: 1, friendJump: 2, turbo: 1 },
  /** Duur (s) van de confetti als de opdracht lukt. */
  celebrateTime: 1.4,
} as const;

/** Ritten en het rittenboekje. */
export const RIDE = {
  /** Lengte van een rit tot de finish: ~75 s op basissnelheid (SPEED.base). */
  length: 24000,
  /** Zo ver vóór de finish komen er geen obstakels, platforms of regenboogstukjes meer. */
  clearBeforeFinish: 700,
  /** Geen nieuwe regenboogstukjes zo dicht bij de finish (een regenboogrit moet vóór de finish klaar zijn). */
  noRainbowBeforeFinish: 2600,
  /** Na de finish rijdt de auto uit en parkeert zo ver verderop in de garage. */
  garageDistance: 700,
  /** Remvertraging naar de garage (eenheden/s²): vanaf basissnelheid ~600 eenheden remweg. */
  brake: 85,
  /** Zo lang (s) na het parkeren verschijnt het overzicht. */
  summaryDelay: 1.2,
  /** Een rit telt mee in het boekje als hij minstens zo lang (s) duurde. */
  minTime: 20,
  /** Wereld-eenheden per "kilometer" in het boekje (een rit van ~75 s is dan ~2,4 km). */
  unitsPerKm: 10000,
} as const;

/** Instelbare voortbeweging; later uit te breiden met moeilijkheidsgraad. */
export const SPEED = {
  /** Basissnelheid in wereld-eenheden per seconde. */
  base: 320,
  /** Tijd (s) om vanuit stilstand op snelheid te komen. */
  accelerationTime: 1.2,
} as const;

/** Parallax-factoren: 0 = staat stil, 1 = beweegt mee met de grond. */
export const PARALLAX = {
  clouds: 0.1,
  farHills: 0.25,
  nearHills: 0.5,
  ground: 1,
} as const;

/** Scènekleuren van de 2D-wereld, afgeleid van het merkpalet waar dat kan. */
export const COLORS = {
  skyTop: '#5fb8f0',
  skyBottom: PALETTE.blueLight,
  sun: PALETTE.yellow,
  cloud: PALETTE.white,
  farHills: '#8fd18a',
  nearHills: '#5cb85c',
  grass: PALETTE.green,
  grassEdge: PALETTE.greenDark,
  road: '#6d6d6d',
  roadLine: PALETTE.white,
  dirt: '#a0703c',
  carBody: PALETTE.red,
  carBodyDark: PALETTE.redDark,
  carWindow: '#bde7ff',
  carWheel: '#222222',
  carHub: '#d0d0d0',
  carLight: '#fff59d',
  cone: PALETTE.orange,
  coneDark: PALETTE.orangeDark,
  coneStripe: PALETTE.white,
  rock: '#8d8d99',
  rockLight: '#b4b4c0',
  crate: '#d9a35b',
  crateDark: '#9c6a2c',
  hedgehog: '#7a5230',
  hedgehogSpikes: '#4e3420',
  hedgehogFace: '#e8c39e',
  hedgehogNose: '#222222',
  toggleOn: PALETTE.green,
  toggleOff: '#b0bec5',
  platform: '#9c4dcc',
  platformTop: '#c77dff',
  platformDots: '#ffffff',
  boost: PALETTE.orange,
  boostBolt: PALETTE.yellow,
  star: PALETTE.yellow,
  starOutline: PALETTE.orangeDark,
  /** Springkussen: fel mint, anders dan alle obstakels. */
  padMat: '#1de9b6',
  padMatLight: '#a7ffeb',
  padSpring: '#cfd8dc',
  padFrame: PALETTE.navy,
  padArrow: PALETTE.white,
} as const;

/** Posities en afmetingen van UI-elementen op het virtuele 2D-scherm. */
export const UI = {
  pauseButton: { size: 72, margin: 20 },
  score: { margin: 22, starSize: 30 },
  settingsRow: { width: 480, height: 74, gap: 14 },
  /** Bovenkant van de eerste instellingenrij. */
  settingsTop: 104,
  /** Kaartjes van de auto- en wereldkiezer. */
  pickerCard: { width: 140, height: 92, gap: 28 },
  menuButton: { width: 280, height: 84, gap: 24 },
  /** Knoppen in het overzicht na de finish ("Nog een keer" is lang); twee passen naast elkaar op 720 breed. */
  summaryButtonWidth: 320,
} as const;

/** Uiterlijk van de te kiezen auto's. Alleen het uiterlijk verschilt; rijden en springen is gelijk. */
export interface CarStyle {
  id: CarId;
  shape: 'classic' | 'racer' | 'jeep' | 'bubble';
  body: string;
  bodyDark: string;
  window: string;
  accent: string;
}

export const CARS: Readonly<Record<CarId, CarStyle>> = {
  classic: { id: 'classic', shape: 'classic', body: PALETTE.red, bodyDark: PALETTE.redDark, window: '#bde7ff', accent: '#fff59d' },
  racer: { id: 'racer', shape: 'racer', body: '#1e88e5', bodyDark: '#0d47a1', window: '#bde7ff', accent: PALETTE.white },
  jeep: { id: 'jeep', shape: 'jeep', body: '#43a047', bodyDark: '#1b5e20', window: '#bde7ff', accent: '#ffca28' },
  bubble: { id: 'bubble', shape: 'bubble', body: PALETTE.purple, bodyDark: '#6a1b9a', window: '#e1f5fe', accent: '#ff80ab' },
};
