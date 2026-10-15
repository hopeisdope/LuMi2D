/**
 * Centrale configuratie. Alle afmetingen zijn in "wereld-eenheden" binnen een
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

export const COLORS = {
  skyTop: '#5fb8f0',
  skyBottom: '#c8ecff',
  sun: '#ffd93b',
  cloud: '#ffffff',
  farHills: '#8fd18a',
  nearHills: '#5cb85c',
  grass: '#4caf50',
  grassEdge: '#2e7d32',
  road: '#6d6d6d',
  roadLine: '#ffffff',
  dirt: '#a0703c',
  carBody: '#e53935',
  carBodyDark: '#b71c1c',
  carWindow: '#bde7ff',
  carWheel: '#222222',
  carHub: '#d0d0d0',
  carLight: '#fff59d',
  uiText: '#ffffff',
  uiTextShadow: 'rgba(0, 0, 0, 0.35)',
  uiButton: '#ff9800',
  uiButtonDark: '#e65100',
  uiDim: 'rgba(20, 40, 80, 0.45)',
} as const;

export const UI = {
  pauseButton: { size: 72, margin: 20 },
  menuButton: { width: 280, height: 84, gap: 24 },
  fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
} as const;
