import { FRIENDS, OBSTACLES } from '../config';
import { THEMES } from '../themes';
import type { Friend, WorldState } from '../types';

export function createFriendPool(): Friend[] {
  const pool: Friend[] = [];
  for (let i = 0; i < FRIENDS.poolSize; i++) {
    pool.push({ active: false, kind: 'bunny', x: 0, gift: 'none', cheerTime: -1, giftTime: -1 });
  }
  return pool;
}

export function resetFriends(world: WorldState): void {
  for (let i = 0; i < world.friends.length; i++) world.friends[i].active = false;
  world.nextFriendAt = FRIENDS.firstDistance;
}

function spawnFriend(world: WorldState, x: number): void {
  const pool = world.friends;
  for (let i = 0; i < pool.length; i++) {
    const f = pool[i];
    if (f.active) continue;
    const kinds = THEMES[world.theme].friends;
    f.active = true;
    f.kind = kinds[Math.floor(world.random() * kinds.length)];
    f.x = x;
    const giftRoll = world.random();
    f.gift =
      giftRoll < FRIENDS.giftChance * FRIENDS.surpriseShare ? 'surprise' : giftRoll < FRIENDS.giftChance ? 'star' : 'none';
    f.cheerTime = -1;
    f.giftTime = -1;
    return;
  }
}

/**
 * Vriendjes verschijnen in de berm, zwaaien en juichen als de auto langskomt en geven
 * soms een ster of verrassing (extra sterren). Puur vrolijk: geen invloed op moeilijkheid.
 */
export function updateFriends(world: WorldState): void {
  const car = world.car;
  while (car.x + OBSTACLES.spawnAhead >= world.nextFriendAt) {
    spawnFriend(world, world.nextFriendAt);
    world.nextFriendAt += FRIENDS.minGap + world.random() * (FRIENDS.maxGap - FRIENDS.minGap);
  }

  const pool = world.friends;
  for (let i = 0; i < pool.length; i++) {
    const f = pool[i];
    if (!f.active) continue;
    if (f.x < car.x - 800) {
      f.active = false;
      continue;
    }
    if (f.cheerTime < 0 && car.x >= f.x - FRIENDS.cheerDistance) {
      f.cheerTime = world.time;
      world.events.friendCheer = true;
    }
    if (f.gift !== 'none' && f.giftTime < 0 && car.x >= f.x) {
      f.giftTime = world.time;
      world.score += f.gift === 'surprise' ? FRIENDS.surpriseStars : 1;
      world.lastScoreTime = world.time;
      world.events.friendGift = true;
    }
  }
}
