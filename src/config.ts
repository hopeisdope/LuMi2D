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
  poolSize: 4,
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
} as const;

/** Posities en afmetingen van UI-elementen op het virtuele 2D-scherm. */
export const UI = {
  pauseButton: { size: 72, margin: 20 },
  score: { margin: 22, starSize: 30 },
  settingsRow: { width: 480, height: 62, gap: 10 },
  /** Bovenkant van de eerste instellingenrij. */
  settingsTop: 88,
  /** Kaartjes van de auto- en wereldkiezer. */
  pickerCard: { width: 118, height: 90, gap: 16 },
  menuButton: { width: 280, height: 84, gap: 24 },
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
