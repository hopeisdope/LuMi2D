# Handoff — 2026-10-15

Concise state for reloading into a fresh session. Details are in `WORKLIST.md`.

## State
- `main` contains phase 1 (game loop, parallax, start/pause/resume/restart, scaling), branding
  (LuMi2d logo, `src/brand/brand.ts`) and phase 2 (jumping). PRs #1 and #2 are merged.
- Jump: tap anywhere except the pause button, or Space/Enter/↑/W. Defined by `JUMP.height`/`JUMP.airTime`;
  gravity and velocity derived in `JUMP_PHYSICS`, integrated exactly (same arc at any fps).
- `world.events.jumped/landed` are set per frame — the hook for sound/feedback later.
- Hosting: Netlify via `netlify.toml`; the repo still has to be linked in the Netlify UI (production branch `main`).
- Typecheck and build pass; tested in Chromium (Playwright) with iPad viewports, not yet on a real device.

## Watch out for
- Finished work always gets merged into `main` (see Git workflow in `CLAUDE.md`).
- Every finger counts as a tap (no `isPrimary` filter), so a resting palm doesn't block jumping.
- Possible future LuMi3D: keep brand data renderer-agnostic, but build no shared infrastructure yet.
- TypeScript 7 and Vite 8 are installed (latest at the time).
- Portrait mode shows a CSS overlay hint ("Draai je iPad"); the game keeps running underneath.
