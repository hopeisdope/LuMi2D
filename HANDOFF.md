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
- `world.events.jumped/landed/bumped/scored` are set per frame — the hook for sound/feedback later.
- `createWorld(seed)` / `resetWorld(world, seed)` take an optional seed for reproducible tests.
- Hosting: Netlify via `netlify.toml`; the repo still has to be linked in the Netlify UI (production branch `main`).
- Typecheck and build pass; tested in Chromium (Playwright) with iPad viewports, not yet on a real device.

## Watch out for
- Finished work always gets merged into `main` (see Git workflow in `CLAUDE.md`).
- Every finger counts as a tap (no `isPrimary` filter), so a resting palm doesn't block jumping.
- Possible future LuMi3D: keep brand data renderer-agnostic, but build no shared infrastructure yet.
- TypeScript 7 and Vite 8 are installed (latest at the time).
- Portrait mode shows a CSS overlay hint ("Draai je iPad"); the game keeps running underneath.
