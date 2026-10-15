/**
 * Visuele identiteit van LuMi2d.
 *
 * Bewust alleen platte data (namen, kleuren, typografie, UI-stijl): geen Canvas,
 * geen 2D-gameplay. Zo blijft de huisstijl los van de rendering-aanpak en kan
 * hij later ook als basis dienen voor een ander LuMi-spel.
 */

export const BRAND = {
  /** Officiële spelnaam — altijd exact zo geschreven. */
  name: 'LuMi2d',
  /** Korte uitnodiging op het startscherm. */
  tagline: 'Tik om te rijden!',
  description: 'Een vrolijk racespel voor jonge kinderen',
} as const;

/** Merkpalet: helder, vrolijk en contrastrijk. */
export const PALETTE = {
  red: '#e53935',
  redDark: '#b71c1c',
  orange: '#ff9800',
  orangeDark: '#e65100',
  yellow: '#ffd93b',
  green: '#43c04a',
  greenDark: '#2e7d32',
  blue: '#29a9f0',
  blueLight: '#c8ecff',
  purple: '#9c4dcc',
  navy: '#1e3c6e',
  white: '#ffffff',
} as const;

/** Kleur per letter van het logo "LuMi2d". */
export const LOGO_COLORS: readonly string[] = [
  PALETTE.red,
  PALETTE.orange,
  PALETTE.yellow,
  PALETTE.green,
  PALETTE.blue,
  PALETTE.purple,
];

/** Systeemlettertypen: geen externe fonts nodig, werkt offline. */
export const TYPOGRAPHY = {
  fontFamily: 'ui-rounded, "SF Pro Rounded", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
  weight: '800',
  /** Groottes in logische eenheden van het virtuele scherm. */
  size: {
    logo: 96,
    heading: 72,
    subtitle: 30,
    button: 36,
    score: 44,
  },
} as const;

/** Gedeelde UI-stijl: knoppen, rondingen, schaduwen en overlays. */
export const UI_STYLE = {
  button: {
    fill: PALETTE.orange,
    shadow: PALETTE.orangeDark,
    text: PALETTE.white,
    radius: 24,
    smallRadius: 18,
    /** Verticale offset van de "3D"-schaduw onder knoppen. */
    depth: 6,
  },
  text: {
    fill: PALETTE.white,
    shadow: 'rgba(0, 0, 0, 0.3)',
    outline: PALETTE.navy,
  },
  overlayDim: 'rgba(20, 40, 80, 0.45)',
  themeColor: PALETTE.blue,
} as const;
