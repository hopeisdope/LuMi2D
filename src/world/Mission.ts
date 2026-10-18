import { MISSION } from '../config';
import type { MissionKind, WorldState } from '../types';
import { reactFriends } from './Friends';

const KINDS: readonly MissionKind[] = ['stars', 'jumpOver', 'rainbowPiece', 'friendJump', 'turbo'];

/**
 * Kiest een opdracht voor de nieuwe rit: haalbaar met de huidige instellingen (over obstakels springen alleen
 * als er obstakels of egels zijn) en nooit twee keer dezelfde soort achter elkaar.
 */
export function startMission(world: WorldState): void {
  const m = world.mission;
  const previous = m.kind;
  const canJumpOver = world.obstaclesEnabled || world.enemiesEnabled;
  let kind: MissionKind = 'stars';
  for (let tries = 0; tries < 20; tries++) {
    kind = KINDS[Math.floor(world.random() * KINDS.length)];
    if (kind !== previous && (kind !== 'jumpOver' || canJumpOver)) break;
  }
  m.kind = kind;
  m.target =
    kind === 'stars' ? (canJumpOver ? MISSION.targets.stars : MISSION.targets.starsEasy) : MISSION.targets[kind];
  m.count = 0;
  m.doneTime = -1;
  m.startTime = world.time;
  m.startScore = world.score;
}

/**
 * Telt mee met de gebeurtenissen van dit frame; bij succes juichen de vriendjes in beeld. Bij oneindig rijden
 * komt er na een gelukte opdracht even later een nieuwe.
 */
export function updateMission(world: WorldState): void {
  const m = world.mission;
  if (m.doneTime >= 0) {
    if (world.endless && world.ridePhase === 'riding' && world.time - m.doneTime >= MISSION.nextDelay) startMission(world);
    return;
  }
  const e = world.events;
  switch (m.kind) {
    case 'stars':
      m.count = world.score - m.startScore;
      break;
    case 'jumpOver':
      if (e.cleared) m.count++;
      break;
    case 'rainbowPiece':
      if (e.rainbowPiece || e.rainbowRide) m.count++;
      break;
    case 'friendJump':
      if (e.friendJump) m.count++;
      break;
    case 'turbo':
      if (e.boosted) m.count++;
      break;
  }
  if (m.count >= m.target) {
    m.count = m.target;
    m.doneTime = world.time;
    world.missionsDone++;
    e.missionDone = true;
    reactFriends(world, 'dance');
  }
}
