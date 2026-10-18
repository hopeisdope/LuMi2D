import type { CarId, FriendKind } from '../types';
import { CAR_SPRITES, FRIEND_SPRITES, type SheetSprite } from './spriteData';

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

/** Spullen uit de gameplayronde (garage, springkussen, spelmomenten, taferelen). */
export const PROP_IMAGES = {
  garage: load('garage'),
  pad: load('pad'),
  cotton: load('moment-cotton'),
  egg: load('moment-egg'),
  ducks: load('scene-ducks'),
  sheep: load('scene-sheep'),
} as const;

/** Plaatje is geladen en bruikbaar. */
export function ready(img: HTMLImageElement): boolean {
  return img.complete && img.naturalWidth > 0;
}

/**
 * Tekent één beeld uit een vel met de onderkant in het midden op (x, y), `height` eenheden hoog (de hoogte
 * van een vak; kleinere beelden in het vel blijven naar verhouding kleiner).
 */
export function drawFrame(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  sheet: SheetSprite,
  frame: number,
  x: number,
  y: number,
  height: number,
): void {
  const w = (sheet.cellWidth / sheet.cellHeight) * height;
  ctx.drawImage(img, frame * sheet.cellWidth, 0, sheet.cellWidth, sheet.cellHeight, x - w / 2, y - height, w, height);
}
