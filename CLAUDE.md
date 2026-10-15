# LuMi2D

Simple 2D side-scroller racing game for young children, built to run as a PWA on iPad and iPad mini in Safari (landscape).

General working agreements are in `~/.claude/CLAUDE.md`. This file adds what is
specific to this project.

## Session start
Read `WORKLIST.md` first. Keep `HANDOFF.md` current at the end of long sessions.

## Stack
- TypeScript (strict), HTML5 Canvas 2D, Vite as dev server/build tool. Node 22.
- No game engine or framework, no external assets (images, sounds, fonts).
- Structure: `config.ts` (constants), `types.ts`, `core/` (loop, state machine),
  `input/` (raw events → `InputAction`), `world/` (pure game logic),
  `render/` (read-only drawing), `ui/` (button layout + hit-tests).

## Commands

```bash
npm install && npm run dev   # Vite dev server on port 5173 (--host, reachable from iPad on LAN)
npm run typecheck && npm run build   # no test framework yet; typecheck + production build are the checks
```

## Conventions
- Code comments and UI text in Dutch.
- All tunable numbers live in `config.ts`; game logic never touches the DOM, renderers never mutate state.
- Input goes through `InputManager` as abstract actions; new controls (e.g. jump) are new action types.
- Use delta time for all movement; avoid allocations in the update/render loop.
- Touch-first: no hover or mouse-only controls; large tap targets for children.
- No data storage; nothing sensitive in the project.

## Debugging
- Dev build exposes `window.game` in the browser console (state, world, layout).
- Browser testing via Playwright with iPad viewports (1180×820, 1133×744) and `hasTouch: true`.
- TODO: verify regularly on a real iPad / iPad mini in Safari.
