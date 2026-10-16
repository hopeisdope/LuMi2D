import { COACH, FEEDBACK, FRIENDS, OBSTACLES } from '../config';
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
      coachObstacle: -1,
      coachJumpTime: -1,
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
    f.coachObstacle = -1;
    f.coachJumpTime = -1;
    return f;
  }
  return null;
}

/**
 * Zet een vriendje net achter dit obstakel dat het aanwijst en het sprongetje voordoet. Elk obstakel krijgt
 * zijn eigen vriendje (het obstakel verschijnt buiten beeld, dus het vriendje ook); zonder vrije plek in de pool
 * wordt er niet voorgedaan.
 */
export function spawnCoach(world: WorldState, obstacleIndex: number): void {
  const f = spawnFriend(world, world.obstacles[obstacleIndex].x + COACH.standBehind);
  if (!f) return;
  f.gift = 'none';
  f.coachObstacle = obstacleIndex;
  // Geen gewoon juichen bij het naderen (juichtijd ligt al voorbij): dit vriendje wijst aan en doet voor.
  f.cheerTime = world.time - FRIENDS.cheerTime;
  // Gewone vriendjes niet vlak bij het voordoen laten verschijnen.
  if (Math.abs(world.nextFriendAt - f.x) < FRIENDS.minGap / 2) world.nextFriendAt = f.x + FRIENDS.minGap / 2;
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
    if (f.coachObstacle >= 0) {
      const o = world.obstacles[f.coachObstacle];
      if (!o.active || o.cleared || o.hit) {
        // Obstakel voorbij: weer een gewoon vriendje (de reactie op het resultaat volgt vanzelf).
        f.coachObstacle = -1;
      } else if (f.coachJumpTime < 0 && car.x >= o.x - COACH.jumpAt) {
        f.coachJumpTime = world.time;
        world.events.friendDemo = true;
      }
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
