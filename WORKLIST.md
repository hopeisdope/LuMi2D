# Worklist

Read at the start of every session; update when something is done or added.

## Now

- [ ] Tune jump height/airtime and obstacle sizes/gaps (`JUMP`, `OBSTACLES` in `config.ts`) with children on a real iPad — jump window widened to ~0.7 s, check if that feels right
- [ ] Connect the repo to Netlify (production branch `main`) and test via the Netlify URL
- [ ] Test phases 1–2 on a real iPad and iPad mini in Safari (smoothness, touch, no zoom/scroll)

## Next

- [ ] Moving enemies (e.g. a friendly hedgehog or bird)
- [ ] Settings screen: obstacles/enemies on/off (`world.obstaclesEnabled` already exists)
- [ ] Configurable auto-movement, difficulty and increasing speed
- [ ] Sound effects and child-friendly feedback
- [ ] PWA: manifest, service worker, offline, add to home screen

## Open questions

## Done

- [x] Wider jump window: 0.3 s → 0.7 s (floatier jump 190/1.1 s, narrower car hitbox, slightly lower obstacles)
- [x] Phase 3: obstacles (cone, rock, crate) from a fixed pool, forgiving collision with a gentle bump (no game over), a star per cleared obstacle, star counter and pop animation
- [x] Phase 2: jump by tapping (fixed arc, input buffer before landing, tilt/squash/shadow, first-time hint, `jumped`/`landed` events) (PR #2)
- [x] Branding: name LuMi2d, colourful logo on the start screen, `src/brand/` with palette, typography and UI style
- [x] Phase 1: Vite + TypeScript project, game loop, parallax background, car, start/pause/resume/restart, scaling (PR #1)
