import { FEEDBACK, FRIENDS, MOMENTS, OBSTACLES, RIDE, SCENES } from '../config';
import { THEMES } from '../themes';
import type { Friend, FriendReaction, WorldState } from '../types';

export function createFriendPool(): Friend[] {
  const pool: Friend[] = [];
  for (let i = 0; i < FRIENDS.poolSize; i++) {
    pool.push({
      active: false,
      kind: 'bunny',
      x: 0,
      gift: 'none',
      cheerTime: -1,
      giftTime: -1,
      reaction: 'none',
      reactionTime: -1,
    });
  }
  return pool;
}

export function resetFriends(world: WorldState): void {
  for (let i = 0; i < world.friends.length; i++) world.friends[i].active = false;
  world.nextFriendAt = FRIENDS.firstDistance;
}

function spawnFriend(world: WorldState, x: number): Friend | null {
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
    f.reaction = 'none';
    f.reactionTime = -1;
    return f;
  }
  return null;
}

/**
 * Vriendjes verschijnen in de berm, zwaaien en juichen als de auto langskomt en geven
 * soms een ster of verrassing (extra sterren). Puur vrolijk: geen invloed op moeilijkheid.
 */
export function updateFriends(world: WorldState): void {
  const car = world.car;
  while (car.x + OBSTACLES.spawnAhead >= world.nextFriendAt && world.nextFriendAt < world.finishX - FRIENDS.minGap / 2) {
    // Niet onder een platform of bij een spelmoment of tafereel: dan schuift het vriendje op tot een vrije plek.
    const x = freeSpot(world, world.nextFriendAt);
    if (x >= world.finishX - FRIENDS.minGap / 2) {
      world.nextFriendAt = x;
      break;
    }
    spawnFriend(world, x);
    world.nextFriendAt = x + FRIENDS.minGap + world.random() * (FRIENDS.maxGap - FRIENDS.minGap);
  }
  if (!world.finishFriends && car.x + OBSTACLES.spawnAhead >= world.finishX) {
    // Twee vriendjes juichen: vóór de finishboog en na de garage.
    world.finishFriends = true;
    for (const x of [world.finishX - 260, world.finishX + RIDE.garageDistance + RIDE.garageFriendOffset]) {
      const f = spawnFriend(world, x);
      if (f) f.gift = 'none';
    }
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

/** Volgorde bij gelijktijdige reacties: een dansje gaat voor verbazing, verbazing voor een duimpje. */
const PRIORITY: Readonly<Record<FriendReaction, number>> = { none: 0, thumbs: 1, surprised: 2, dance: 3 };

/** Vriendjes in beeld reageren op een actie; een lopende reactie wordt alleen door een belangrijkere vervangen. */
export function reactFriends(world: WorldState, reaction: FriendReaction): void {
  const car = world.car;
  const pool = world.friends;
  for (let i = 0; i < pool.length; i++) {
    const f = pool[i];
    if (!f.active || f.x < car.x - FEEDBACK.reactBehind || f.x > car.x + FEEDBACK.reactAhead) continue;
    const running = f.reactionTime >= 0 && world.time - f.reactionTime < FEEDBACK.reactionTime;
    if (running && PRIORITY[f.reaction] > PRIORITY[reaction]) continue;
    f.reaction = reaction;
    f.reactionTime = world.time;
  }
}

/**
 * Eerste plek vanaf x waar een vriendje niet overlapt met een platform, spelmoment of verrassingstafereel
 * (met FRIENDS.clearance ruimte ertussen).
 */
function freeSpot(world: WorldState, x: number): number {
  const m = FRIENDS.clearance;
  // Een paar rondes: na het opschuiven kan het vriendje bij het volgende ding uitkomen.
  for (let round = 0; round < 6; round++) {
    let moved = false;
    for (let i = 0; i < world.platforms.length; i++) {
      const p = world.platforms[i];
      if (p.active && x > p.x - m && x < p.x + p.width + m) {
        x = p.x + p.width + m;
        moved = true;
      }
    }
    for (let i = 0; i < world.moments.length; i++) {
      const o = world.moments[i];
      if (o.active && Math.abs(x - o.x) < m + MOMENTS.radius) {
        x = o.x + m + MOMENTS.radius;
        moved = true;
      }
    }
    const s = world.scene;
    if (s.active && x > s.x - m && x < s.x + SCENES.length) {
      x = s.x + SCENES.length;
      moved = true;
    }
    if (!moved) break;
  }
  return x;
}

/** Staat er een vriendje tussen from en to? (Voor het parcours: daar geen platform, spelmoment of tafereel.) */
export function friendBetween(world: WorldState, from: number, to: number): boolean {
  for (let i = 0; i < world.friends.length; i++) {
    const f = world.friends[i];
    if (f.active && f.x > from && f.x < to) return true;
  }
  return false;
}
