import type { CarId, FriendKind } from '../types';
import { CAR_SPRITES, FRIEND_SPRITES } from './spriteData';

/**
 * Plaatjes uit public/sprites/ (gemaakt met scripts/process-sprites.py). Ze laden op de achtergrond;
 * zolang een plaatje er niet is (of het laden mislukt) tekenen de renderers de getekende versie.
 */
function load(name: string): HTMLImageElement {
  const img = new Image();
  img.decoding = 'async';
  img.src = `sprites/${name}.png`;
  return img;
}

function byId<K extends string>(ids: readonly K[], prefix: string): Record<K, HTMLImageElement> {
  const images = {} as Record<K, HTMLImageElement>;
  for (const id of ids) images[id] = load(`${prefix}-${id}`);
  return images;
}

const CARS = Object.keys(CAR_SPRITES) as CarId[];
export const CAR_IMAGES = byId<CarId>(CARS, 'car');
export const WHEEL_IMAGES = byId<CarId>(CARS, 'wheel');
export const FRIEND_IMAGES = byId<FriendKind>(Object.keys(FRIEND_SPRITES) as FriendKind[], 'friend');

/** Plaatje is geladen en bruikbaar. */
export function ready(img: HTMLImageElement): boolean {
  return img.complete && img.naturalWidth > 0;
}
