import type { CarId, Settings, ThemeId } from '../types';

/** Versie in de sleutel: bij een incompatibele wijziging een nieuwe versie gebruiken. */
const STORAGE_KEY = 'lumi2d.settings.v1';

export const CAR_IDS: readonly CarId[] = ['classic', 'racer', 'jeep', 'bubble'];
export const THEME_IDS: readonly ThemeId[] = ['meadow', 'dino', 'space', 'candy'];

export const DEFAULT_SETTINGS: Readonly<Settings> = {
  obstacles: true,
  enemies: true,
  sound: true,
  car: 'classic',
  theme: 'meadow',
};

/**
 * Leest de instellingen uit localStorage. Elk veld wordt los gecontroleerd; ontbrekende of
 * ongeldige waarden vallen terug op de standaard. localStorage kan ontbreken of geblokkeerd
 * zijn (privévenster, instellingen): dan gewoon de standaard.
 */
export function loadSettings(): Settings {
  const settings: Settings = { ...DEFAULT_SETTINGS };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return settings;
    const data: unknown = JSON.parse(raw);
    if (typeof data !== 'object' || data === null) return settings;
    const d = data as Record<string, unknown>;
    if (typeof d.obstacles === 'boolean') settings.obstacles = d.obstacles;
    if (typeof d.enemies === 'boolean') settings.enemies = d.enemies;
    if (typeof d.sound === 'boolean') settings.sound = d.sound;
    if (typeof d.car === 'string' && (CAR_IDS as readonly string[]).includes(d.car)) settings.car = d.car as CarId;
    if (typeof d.theme === 'string' && (THEME_IDS as readonly string[]).includes(d.theme)) {
      settings.theme = d.theme as ThemeId;
    }
  } catch {
    // Onleesbaar of geblokkeerd: standaardinstellingen gebruiken.
  }
  return settings;
}

/** Bewaart de instellingen; fouten (vol, geblokkeerd) worden genegeerd: het spel werkt dan gewoon door. */
export function saveSettings(settings: Settings): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Niet kunnen opslaan is geen probleem voor het spelen.
  }
}
