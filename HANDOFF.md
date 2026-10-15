# Handoff — 2026-10-15

Concise state for reloading into a fresh session. Details are in `WORKLIST.md`.

## State
- Phase 1 complete on branch `fase-1-basis` (pushed, no PR yet): playable game loop, scrolling background, start/pause/resume/restart, scaling with letterbox.
- Typecheck and build pass; tested in Chromium (Playwright) with iPad viewports, not yet on a real device.

- Branding applied: name LuMi2d, per-letter colourful logo; identity in `src/brand/brand.ts` (data only).

- Hosting for device tests: Netlify via `netlify.toml`; the repo still has to be linked in the Netlify UI.

## Watch out for
- Possible future LuMi3D: keep brand data renderer-agnostic, but build no shared infrastructure yet.
- TypeScript 7 and Vite 8 are installed (latest at the time).
- The tap during `playing` only hit-tests the pause button; phase 2's jump goes in `Game.handleTap`.
- Portrait mode shows a CSS overlay hint ("Draai je iPad"); the game keeps running underneath.
