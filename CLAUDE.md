# LuMi2d

Simple 2D side-scroller racing game for young children — the first game in a possible LuMi family of children's games, built to run as a PWA on iPad and iPad mini in Safari (landscape).

General working agreements are in `~/.claude/CLAUDE.md`. This file adds what is
specific to this project.

## Session start
Read `WORKLIST.md` first. Keep `HANDOFF.md` current at the end of long sessions.

## Stack
- TypeScript (strict), HTML5 Canvas 2D, Vite as dev server/build tool. Node 22.
- No game engine or framework. No external assets except the sprites in `public/sprites/` (no sounds, no fonts).
- Structure: `config.ts` (constants), `types.ts`, `core/` (loop, state machine),
  `input/` (raw events → `InputAction`), `world/` (pure game logic),
  `render/` (read-only drawing), `ui/` (button layout + hit-tests),
  `brand/` (name, palette, typography, UI style — plain data only), `settings/` (persisted settings),
  `audio/` (synthesized sounds).

## Commands

```bash
npm install && npm run dev   # Vite dev server on port 5173 (--host, reachable from iPad on LAN)
npm run typecheck && npm run build   # no test framework yet; typecheck + production build are the checks
node scripts/test-offline.mjs       # after a build: service worker keeps the offline game when the server errors (needs Playwright)
```

Test hosting: Docker on the owner's own server (Docker VM in Proxmox, LAN only): `Dockerfile` (Node build → nginx),
`docker/nginx.conf`, `docker-compose.yml`. Update there with `git pull && docker compose build --pull && docker compose up -d`
(`--pull` also fetches patched base images); default port 8080. Runtime image: `nginx:1.30-alpine` (stable line);
Dependabot (`.github/dependabot.yml`) opens PRs for base-image and Actions updates — merge them when CI is green, except nginx mainline
(odd minor such as 1.31): close those and stay on the stable (even) line.
On plain `http://<lan-ip>` there is no service worker (not a secure context): the game works, offline mode doesn't.
GitHub Pages workflow (`.github/workflows/pages.yml`) is kept but manual-only (needs a public repo or GitHub Pro).

## Git workflow
- Work on a feature branch, then always merge it into `main` when the work is done and checks pass
  (open a PR and merge it; merge commit, no squash). No need to ask first — the server builds from `main`.
- Merge only after the `CI` check (`.github/workflows/ci.yml`: typecheck + build) is green: `gh pr checks <n> --watch`.
  Required status checks can't be enforced on a private repo without GitHub Pro, so this is a working rule.
- After merging, sync the local `main`.

## Conventions
- The name is always written **LuMi2d** (capital L and M, lowercase d); take it from `BRAND.name`, never hard-code it.
- Branding lives in `src/brand/brand.ts` as renderer-agnostic data (no Canvas, no 2D gameplay), so a possible
  future LuMi3D could reuse it. Colours, fonts and button styling come from there; 2D scene and layout values
  stay in `config.ts`.
- Do not build shared multi-game infrastructure, 3D code or extra projects now; keep this codebase focused on
  the 2D game. Future compatibility must never complicate the current prototype.
- Visual identity: colourful, playful, clean; few menus, no clutter, consistent orange buttons and white text.
- Code comments and UI text in Dutch.
- All tunable numbers live in `config.ts`; game logic never touches the DOM, renderers never mutate state.
- Input goes through `InputManager` as abstract actions; new controls (e.g. jump) are new action types.
- Use delta time for all movement; avoid allocations in the update/render loop.
- Touch-first: no hover or mouse-only controls; large tap targets for children.
- Every text, button and instruction gets an icon or picture (`src/render/icons.ts`) for children who can't read yet.
- Storage: only `localStorage` key `lumi2d.settings.v1` for settings (toggles, car, world) via `src/settings/Settings.ts`;
  always validate on load and fall back to defaults. Never store anything personal or sensitive.
- Sound is synthesized with Web Audio in `src/audio/Sound.ts` (no audio files); it unlocks on the first tap.
- Sprites (cars, wheels, friends) are generated artwork: raw PNGs go in `art-incoming/` (git-ignored, not committed),
  `python3 scripts/process-sprites.py` (Pillow) trims/resizes them into `public/sprites/` and writes
  `src/render/spriteData.ts` (sizes, wheel positions; generated, don't edit). Renderers draw a sprite only when it
  has loaded (`ready()` in `src/render/sprites.ts`) and otherwise fall back to the drawn shapes — keep that fallback.
  Friend sheets hold three poses side by side: idle, wave, cheer.
- PWA: `public/manifest.webmanifest`, icons in `public/icons/` (regenerate with `scripts/generate-icons.mjs`),
  service worker generated at build time from `sw-template.js` by the plugin in `vite.config.ts` (production only).

## Debugging
- Dev build exposes `window.game` in the browser console (state, world, layout).
- Browser testing via Playwright with iPad viewports (1180×820, 1133×744) and `hasTouch: true`.
- TODO: verify regularly on a real iPad / iPad mini in Safari.
