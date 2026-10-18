import { RIDE, SCENES } from '../config';
import type { SceneKind, WorldState } from '../types';

const KINDS: readonly SceneKind[] = ['ducks', 'tunnel', 'herd'];

export function resetScene(world: WorldState): void {
  world.scene.active = false;
  world.nextSceneAt = SCENES.first;
}

/**
 * Begint hier (bij het bouwen van het parcours) een verrassingstafereel? Zo ja, dan staat het klaar en geeft
 * de functie de lengte van het stuk weg zonder obstakels terug; anders 0. Nooit vlak voor de finish.
 */
export function trySpawnScene(world: WorldState, x: number): number {
  if (x < world.nextSceneAt || x + SCENES.length > world.finishX - RIDE.clearBeforeFinish) return 0;
  const s = world.scene;
  // Een vorig tafereel moet helemaal voorbij zijn.
  if (s.active && s.x + SCENES.length > world.car.x - 600) return 0;
  s.active = true;
  s.kind = KINDS[Math.floor(world.random() * KINDS.length)];
  s.x = x;
  s.triggerTime = -1;
  s.passTime = -1;
  world.nextSceneAt = x + SCENES.minGap + world.random() * (SCENES.maxGap - SCENES.minGap);
  return SCENES.length;
}

/** Plek van het tafereel zelf (oversteekplek, midden van de tunnel, eerste schaapje). */
export function sceneSpot(world: WorldState): number {
  return world.scene.x + SCENES.eventOffset;
}

/** Zijn alle eendjes de weg over? */
export function ducksAcross(world: WorldState): boolean {
  const s = world.scene;
  if (s.triggerTime < 0) return false;
  const total = SCENES.ducks.crossTime + SCENES.ducks.stagger * (SCENES.ducks.count - 1);
  return world.time - s.triggerTime >= total;
}

/**
 * Begin en einde van het tafereel. Eendjes: de auto remt af tot vóór de oversteekplek en rijdt verder
 * als alle eendjes over zijn. Tunnel: eronderdoor levert een ster op.
 */
export function updateScene(world: WorldState): void {
  const s = world.scene;
  if (!s.active) return;
  const car = world.car;
  const spot = sceneSpot(world);
  if (s.x + SCENES.length < car.x - 800) {
    s.active = false;
    return;
  }

  switch (s.kind) {
    case 'ducks': {
      if (s.triggerTime < 0 && car.x >= spot - SCENES.ducks.triggerDistance) {
        s.triggerTime = world.time;
        world.events.sceneStart = true;
      }
      if (s.triggerTime >= 0 && !ducksAcross(world) && world.rainbowRide <= 0) {
        // Zacht remmen (tijdens een regenboogrit zweeft de auto er gewoon overheen) zodat de voorkant van de auto vóór de oversteekplek stopt.
        const stopAt = spot - SCENES.ducks.stopBefore - car.width / 2;
        const limit = Math.sqrt(2 * RIDE.brake * Math.max(0, stopAt - car.x));
        if (limit < world.speed) world.speed = limit;
      } else if (s.passTime < 0 && s.triggerTime >= 0) {
        s.passTime = world.time;
        world.events.scenePass = true;
      }
      break;
    }
    case 'herd':
      if (s.triggerTime < 0 && car.x >= spot - SCENES.herd.triggerDistance) {
        s.triggerTime = world.time;
        world.events.sceneStart = true;
      }
      break;
    case 'tunnel':
      if (s.passTime < 0 && car.x >= spot) {
        s.passTime = world.time;
        world.score++;
        world.lastScoreTime = world.time;
        world.events.scored = true;
        world.events.scenePass = true;
      }
      break;
  }
}
