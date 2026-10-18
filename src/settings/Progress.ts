import { RIDE } from '../config';
import type { Progress, StickerId, ThemeId, WorldState } from '../types';
import { THEME_IDS } from './Settings';

/** Versie in de sleutel: bij een incompatibele wijziging een nieuwe versie gebruiken. */
const STORAGE_KEY = 'lumi2d.progress.v1';

/** Bovengrens per teller: beschermt tegen rare opgeslagen waarden. */
const MAX_COUNT = 1_000_000_000;

/** Een sticker in het boekje: verdiend zodra `earned` waar is. */
export interface Sticker {
  id: StickerId;
  earned: (p: Readonly<Progress>) => boolean;
}

/** Volgorde = volgorde in het boekje. De plaatjes staan in de UI-renderer. */
export const STICKERS: readonly Sticker[] = [
  { id: 'firstRide', earned: (p) => p.rides >= 1 },
  { id: 'rides10', earned: (p) => p.rides >= 10 },
  { id: 'bestRide10', earned: (p) => p.bestStars >= 10 },
  { id: 'stars100', earned: (p) => p.totalStars >= 100 },
  { id: 'firstRainbow', earned: (p) => p.rainbows >= 1 },
  { id: 'rainbows10', earned: (p) => p.rainbows >= 10 },
  { id: 'distance50', earned: (p) => p.distance >= 50 * RIDE.unitsPerKm },
  { id: 'allWorlds', earned: (p) => p.worlds.length >= THEME_IDS.length },
  { id: 'missions5', earned: (p) => p.missions >= 5 },
];
const STICKER_IDS: readonly string[] = STICKERS.map((s) => s.id);

export function emptyProgress(): Progress {
  return { rides: 0, bestStars: 0, totalStars: 0, distance: 0, rainbows: 0, missions: 0, worlds: [], stickers: [] };
}

function count(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? Math.min(Math.floor(value), MAX_COUNT) : 0;
}

/**
 * Leest de voortgang uit localStorage. Elk veld wordt los gecontroleerd; ontbrekende of ongeldige waarden
 * worden 0 of leeg. localStorage kan ontbreken of geblokkeerd zijn: dan begint het boekje leeg.
 */
export function loadProgress(): Progress {
  const progress = emptyProgress();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return progress;
    const data: unknown = JSON.parse(raw);
    if (typeof data !== 'object' || data === null) return progress;
    const d = data as Record<string, unknown>;
    progress.rides = count(d.rides);
    progress.bestStars = count(d.bestStars);
    progress.totalStars = count(d.totalStars);
    progress.distance = count(d.distance);
    progress.rainbows = count(d.rainbows);
    progress.missions = count(d.missions);
    if (Array.isArray(d.worlds)) {
      for (const w of d.worlds) {
        if ((THEME_IDS as readonly unknown[]).includes(w) && !progress.worlds.includes(w as ThemeId)) {
          progress.worlds.push(w as ThemeId);
        }
      }
    }
    if (Array.isArray(d.stickers)) {
      for (const s of d.stickers) {
        if (STICKER_IDS.includes(s as string) && !progress.stickers.includes(s as StickerId)) {
          progress.stickers.push(s as StickerId);
        }
      }
    }
  } catch {
    // Onleesbaar of geblokkeerd: met een leeg boekje beginnen.
  }
  return progress;
}

/** Bewaart de voortgang; fouten (vol, geblokkeerd) worden genegeerd. */
export function saveProgress(progress: Progress): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // Niet kunnen opslaan is geen probleem voor het spelen.
  }
}

/**
 * Wat er van de huidige rit al in het boekje staat. Een rit kan in stukjes worden bijgeschreven
 * (bv. als de app naar de achtergrond gaat en daarna verder speelt), zonder iets dubbel te tellen.
 */
export interface RideLedger {
  stars: number;
  distance: number;
  rainbows: number;
  /** De rit is al als rit geteld. */
  counted: boolean;
  /** Zoveel gelukte opdrachten zijn al geteld. */
  missions: number;
}

export function newLedger(): RideLedger {
  return { stars: 0, distance: 0, rainbows: 0, counted: false, missions: 0 };
}

/**
 * Schrijft wat er sinds de vorige keer in deze rit bij is gekomen in het boekje en geeft de nieuw
 * verdiende stickers terug (leeg als er niets nieuws is).
 */
export function recordRide(progress: Progress, ledger: RideLedger, world: WorldState): StickerId[] {
  progress.totalStars += Math.max(0, world.score - ledger.stars);
  progress.distance += Math.max(0, Math.floor(world.distance) - ledger.distance);
  progress.rainbows += Math.max(0, world.rainbowRides - ledger.rainbows);
  ledger.stars = world.score;
  ledger.distance = Math.floor(world.distance);
  ledger.rainbows = world.rainbowRides;
  if (world.score > progress.bestStars) progress.bestStars = world.score;
  progress.missions += Math.max(0, world.missionsDone - ledger.missions);
  ledger.missions = world.missionsDone;
  if (!ledger.counted && world.time >= RIDE.minTime) {
    ledger.counted = true;
    progress.rides++;
    if (!progress.worlds.includes(world.theme)) progress.worlds.push(world.theme);
  }

  const fresh: StickerId[] = [];
  for (const s of STICKERS) {
    if (!progress.stickers.includes(s.id) && s.earned(progress)) {
      progress.stickers.push(s.id);
      fresh.push(s.id);
    }
  }
  return fresh;
}
