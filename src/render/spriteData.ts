// Gegenereerd door scripts/process-sprites.py; niet met de hand aanpassen.
import type { CarId, FriendKind } from '../types';

/** Autoplaatje (px): wielmiddens en wielstraal, zodat de draaiende wielen precies over de getekende vallen. */
export interface CarSprite {
  width: number;
  height: number;
  wheels: readonly [readonly [number, number], readonly [number, number]];
  wheelR: number;
}

/** Vriendje: drie houdingen naast elkaar (rustig, zwaaien, juichen), voeten op de onderrand. */
export interface FriendSprite {
  cellWidth: number;
  cellHeight: number;
}

export const WHEEL_SPRITE_SIZE = 160;

export const CAR_SPRITES: Readonly<Record<CarId, CarSprite>> = {
  classic: { width: 480, height: 283, wheels: [[107.8, 225.6], [347.0, 226.3]], wheelR: 52.4 },
  racer: { width: 480, height: 220, wheels: [[106.3, 161.4], [358.1, 161.9]], wheelR: 54.3 },
  jeep: { width: 480, height: 292, wheels: [[128.9, 231.9], [381.3, 232.3]], wheelR: 55.2 },
  bubble: { width: 480, height: 285, wheels: [[106.6, 225.0], [348.7, 225.0]], wheelR: 56.0 },
};

export const FRIEND_SPRITES: Readonly<Record<FriendKind, FriendSprite>> = {
  bunny: { cellWidth: 207, cellHeight: 288 },
  bear: { cellWidth: 248, cellHeight: 288 },
  dinoGreen: { cellWidth: 249, cellHeight: 288 },
  dinoOrange: { cellWidth: 242, cellHeight: 288 },
  alien: { cellWidth: 226, cellHeight: 288 },
  robot: { cellWidth: 242, cellHeight: 288 },
  unicorn: { cellWidth: 255, cellHeight: 288 },
  cupcake: { cellWidth: 241, cellHeight: 288 },
};
