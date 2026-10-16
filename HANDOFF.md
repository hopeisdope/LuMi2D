# Handoff — 2026-10-16

Concise state for reloading into a fresh session. Details are in `WORKLIST.md`.

## State
- `main` contains phase 1 (game loop, parallax, start/pause/resume/restart, scaling), branding
  (LuMi2d logo, `src/brand/brand.ts`) and phase 2 (jumping). PRs #1 and #2 are merged.
- Jump: tap anywhere except the pause button, or Space/Enter/↑/W. Defined by `JUMP.height`/`JUMP.airTime`;
  gravity and velocity derived in `JUMP_PHYSICS`, integrated exactly (same arc at any fps).
- Phase 3: obstacles in `world/Obstacles.ts` (fixed pool of 8, spawn by distance with seeded random `world/random.ts`).
  Collision = gentle bump: car wobbles, speed drops to 35% and recovers; no game over. Each cleared obstacle = 1 star
  (`world.score`). Obstacles on/off via `world.obstaclesEnabled` (default `OBSTACLES.enabled`).
- Jump window is ~0.7 s (was 0.3 s, too short per user): `JUMP` 190 high / 1.1 s, `CAR_HITBOX.halfWidthRatio` 0.24.
- Phase 4: enemies share the obstacle pool (`Obstacle.enemy`, `vx`); hedgehog walks toward the car at `ENEMIES.speed`
  and gets `ENEMIES.extraGap` so spacing stays ≥ `OBSTACLES.minGap`. Settings state `settings` (gear on the start
  screen) toggles `world.obstaclesEnabled` / `world.enemiesEnabled`; not persisted (no data storage).
- Settings (`Settings` type) live in `Game`, loaded/saved via `src/settings/Settings.ts`; `applySettings()` pushes them to world and sound.
- PWA: production build emits `sw.js` (precache of all build + public files, cache name per build). Tested offline reload in Chromium.
- Worlds: data in `src/themes.ts` (colours + `decor`/`farLayer`/`celestial`), drawn by `BackgroundRenderer`. Cars: `CARS` in `config.ts`, shapes in `CarRenderer.drawBody` (also used for the picker). Look only — physics identical.
- Icons: `src/render/icons.ts` (vector, no emoji); every text/button in the UI has an icon or picture.
- Part 3: `world/Collectibles.ts` (platform + collectible pools, turbo/shield/ride timers). Course generation in
  `Obstacles.ts#spawnAhead` also places platforms (`PLATFORMS.chance`) and rainbow pieces (`RAINBOW.chance`).
  Platforms are one-way (land from above only) in `Car.updateCar`; the ride uses `Car.floatCar`.
- Part 4: `world/Friends.ts` (own spawner, independent of the course); kinds per world in `THEMES[*].friends` (Zoetroze: unicorn + cupcake), drawn by `FriendRenderer`. `world.theme` is set from settings in `Game.applySettings()`.
- Sprites: cars, wheels and friends are PNGs in `public/sprites/` (~430 KB, from ChatGPT artwork via `scripts/process-sprites.py`, see `CLAUDE.md`). `CarRenderer.drawSprite` lays rotating wheel sprites over the wheels in the car picture; friends show idle, and alternate wave/cheer while cheering. Drawn shapes remain the fallback while images load or if they fail.
- Gameplay round (2026-10-16, PRs #23–#30), all drawn in code; art prompts in `docs/art-prompts-gameplay.md`:
  - Feedback: jump lines, landing dust, dizzy stars, collect sparkle (`EffectsRenderer`, `ItemsRenderer`); friends react
    (`Friend.reaction`: thumbs/surprised/dance with icon bubbles) via `reactFriends()`.
  - Coaching (a friend demonstrating each jump, PR #24) was removed again on 2026-10-16: the owner found it too busy.
  - Ride book: `src/settings/Progress.ts` (`lumi2d.progress.v1`), recorded in increments via `RideLedger`; state `book`.
  - Rides end: `RIDE.length` 24 000 units, `world.ridePhase` riding → finishing → parked, `FinishRenderer`
    (arch, garage), state `finished` with `RideSummary` ("Nog een keer" / "Kiezen"); progress road at the bottom.
  - Missions: `src/world/Mission.ts`, one per ride, card bottom-left (top-left collided with high bounces).
  - Endless mode (setting `endless`, 4th toggle, default on since settings revision 2: an `endless` saved
    without `rev: 2` is ignored): `world.finishX = Infinity`, so no finish/garage and
    no progress road; after a mission succeeds a new one starts after `MISSION.nextDelay`. Stop via pause → Opnieuw
    (the ride goes into the book; `world.missionsDone` counts every mission).
  - Rainbow tunnel: back pass draws the whole arch, front pass the right half with its foot in the grass in front of
    the road (same trick as the finish arch), so the car drives under it.
  - Obstacles ~30% bigger (`OBSTACLES.kinds`, hedgehog in `ENEMIES.kinds`) with a thick navy outline
    (`COLORS.obstacleOutline`), lighter rock; `hitboxInset` 13 keeps the jump about as forgiving as before.
  - Sprites for garage, pad, egg, cotton candy, ducks and sheep (after PR #32); drawn code stays as fallback.
  - Bounce pads (`world/Pads.ts`, 260 high), surprise scenes (`world/Scenes.ts`: ducks/tunnel/herd with a sign),
    world moments (`world/Moments.ts`: fluff/egg/bubble/cotton candy; the whole car height counts as hit).
  - Course segments in `Obstacles.ts#spawnAhead` roll in this order: platform, rainbow, bounce pad, world moment,
    else obstacle; scenes and the finish clear zone take precedence.
- `world.events.jumped/landed/bumped/scored/boosted/rainbowPiece/rainbowRide` are set per frame — the hook for sound/feedback later.
- `createWorld(seed)` / `resetWorld(world, seed)` take an optional seed for reproducible tests.
- Hosting: running on the Docker VM at `/opt/LuMi2D`, port from `.env` (`LUMI2D_PORT=8080`). Docker on the owner's Docker VM in Proxmox (LAN only): `Dockerfile`, `docker/nginx.conf`, `docker-compose.yml`. Netlify removed (credits), GitHub Pages workflow manual-only (private repo). Tested: image builds, healthy, correct cache headers, game plays via LAN IP; no service worker on plain http (expected).
- Review of PR #15 handled (2026-10-16): CI workflow (`ci.yml`, merge only when green — can't be required on a private Free repo), service worker caches only successful HTML (`scripts/test-offline.mjs`), nginx 1.30 + Dependabot, update with `docker compose build --pull`; LUMI-003 declined (see `CLAUDE.md`).
- Typecheck, build and `scripts/test-offline.mjs` pass; features tested in Chromium (Playwright) with iPad viewports via
  the dev build's `window.game` (state can be staged), not yet on a real device.

- Flow: start (`ready`) → kiesscherm (`choose`: auto + wereld, Rijden!) → `playing` ⇄ `paused`; Opnieuw in de pauze gaat terug naar `choose`. Auto/wereld kiezen kan alleen op het kiesscherm (`Game.choose` checkt de state).

## Watch out for
- Perf measurement in headless Chromium needs a forced flush (`getImageData`) — canvas work is deferred otherwise. Without GPU every world costs ~20 ms/frame at 2x; real iPads use GPU canvas.
- Finished work always gets merged into `main` (see Git workflow in `CLAUDE.md`).
- Every finger counts as a tap (no `isPrimary` filter), so a resting palm doesn't block jumping.
- Possible future LuMi3D: keep brand data renderer-agnostic, but build no shared infrastructure yet.
- TypeScript 7 and Vite 8 are installed (latest at the time).
- Portrait mode shows a CSS overlay hint ("Draai je iPad"); the game keeps running underneath.
