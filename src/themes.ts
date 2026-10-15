import { PALETTE } from './brand/brand';
import type { ThemeId } from './types';

/**
 * Werelden (thema's) van de 2D-game: alleen data. De renderer leest deze kleuren en
 * kiest op basis van `decor`, `farLayer` en `celestial` welke details hij tekent.
 */
export interface Theme {
  id: ThemeId;
  /** Korte naam onder het wereldplaatje (het plaatje zelf is voor kinderen die nog niet lezen). */
  label: string;
  skyTop: string;
  skyBottom: string;
  celestial: { kind: 'sun' | 'planet'; color: string; ring?: string };
  /** Wolkkleur, of null voor geen wolken (ruimte). */
  cloud: string | null;
  /** Twinkelende sterren aan de hemel. */
  stars: boolean;
  /** Extra laag voor de verre heuvels: gewone heuvels of vulkanen. */
  farLayer: 'hills' | 'volcano';
  farHills: string;
  nearHills: string;
  grass: string;
  grassEdge: string;
  road: string;
  roadLine: string;
  /** Details in de berm. */
  decor: 'tufts' | 'ferns' | 'craters' | 'candy';
  decorA: string;
  decorB: string;
}

export const THEMES: Readonly<Record<ThemeId, Theme>> = {
  meadow: {
    id: 'meadow',
    label: 'Weide',
    skyTop: '#5fb8f0',
    skyBottom: PALETTE.blueLight,
    celestial: { kind: 'sun', color: PALETTE.yellow },
    cloud: PALETTE.white,
    stars: false,
    farLayer: 'hills',
    farHills: '#8fd18a',
    nearHills: '#5cb85c',
    grass: PALETTE.green,
    grassEdge: PALETTE.greenDark,
    road: '#6d6d6d',
    roadLine: PALETTE.white,
    decor: 'tufts',
    decorA: PALETTE.greenDark,
    decorB: '#a0703c',
  },
  dino: {
    id: 'dino',
    label: 'Dino',
    skyTop: '#ffb36b',
    skyBottom: '#ffe7b8',
    celestial: { kind: 'sun', color: '#fff176' },
    cloud: '#fff3e0',
    stars: false,
    farLayer: 'volcano',
    farHills: '#b98a5e',
    nearHills: '#6aa84f',
    grass: '#5a9e3a',
    grassEdge: '#3b6e24',
    road: '#8d6e63',
    roadLine: '#ffe0b2',
    decor: 'ferns',
    decorA: '#2f6b1f',
    decorB: '#fff3c4',
  },
  space: {
    id: 'space',
    label: 'Ruimte',
    skyTop: '#0b1033',
    skyBottom: '#3a2a6e',
    celestial: { kind: 'planet', color: '#ff8a65', ring: '#ffd180' },
    cloud: null,
    stars: true,
    farLayer: 'hills',
    farHills: '#5b4b8a',
    nearHills: '#7e6bb0',
    grass: '#9e9ab8',
    grassEdge: '#6f6a8f',
    road: '#2d2a4a',
    roadLine: '#ffeb3b',
    decor: 'craters',
    decorA: '#7d789c',
    decorB: '#c5c1dd',
  },
  candy: {
    id: 'candy',
    label: 'Zoetroze',
    skyTop: '#ff9ecf',
    skyBottom: '#ffe3f1',
    celestial: { kind: 'sun', color: '#fff59d' },
    cloud: PALETTE.white,
    stars: false,
    farLayer: 'hills',
    farHills: '#b2f2e5',
    nearHills: '#ff7eb6',
    grass: '#a8e6cf',
    grassEdge: '#ff6fa8',
    road: '#8d5a4a',
    roadLine: PALETTE.white,
    decor: 'candy',
    decorA: '#ff4f9a',
    decorB: '#7ad3ff',
  },
};
