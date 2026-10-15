# Handoff — 2026-10-15

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
- `world.events.jumped/landed/bumped/scored/boosted/rainbowPiece/rainbowRide` are set per frame — the hook for sound/feedback later.
- `createWorld(seed)` / `resetWorld(world, seed)` take an optional seed for reproducible tests.
- Hosting: Netlify via `netlify.toml`; the repo still has to be linked in the Netlify UI (production branch `main`).
- Typecheck and build pass; tested in Chromium (Playwright) with iPad viewports, not yet on a real device.

## Watch out for
- Finished work always gets merged into `main` (see Git workflow in `CLAUDE.md`).
- Every finger counts as a tap (no `isPrimary` filter), so a resting palm doesn't block jumping.
- Possible future LuMi3D: keep brand data renderer-agnostic, but build no shared infrastructure yet.
- TypeScript 7 and Vite 8 are installed (latest at the time).
- Portrait mode shows a CSS overlay hint ("Draai je iPad"); the game keeps running underneath.
