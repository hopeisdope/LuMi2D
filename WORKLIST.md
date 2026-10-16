# Worklist

Read at the start of every session; update when something is done or added.

## Now

- [ ] Tune jump height/airtime and obstacle sizes/gaps (`JUMP`, `OBSTACLES` in `config.ts`) with children on a real iPad — jump window widened to ~0.7 s, check if that feels right
- [ ] Test on a real iPad and iPad mini in Safari: smoothness (headless Chromium without GPU can't measure this), touch, sound, install via "Zet op beginscherm", offline

## Next

- [ ] Check the new sprites on a real iPad (sharpness, size of friends next to the car)
- [ ] Configurable auto-movement, difficulty and increasing speed

## Open questions

- Offline mode on the LAN needs HTTPS (reverse proxy with a certificate); is that wanted later?


## Done

- [x] CI workflow on PRs and pushes to main (npm ci, typecheck, build); merge only when green (review LUMI-002)
- [x] Generated sprites (ChatGPT) for the four cars (with spinning wheel overlays) and per-world friends (idle/wave/cheer); Zoetroze kitty replaced by a cupcake; drawn shapes stay as fallback
- [x] Service worker cache name now hashes file contents too, so a replaced file with the same name reaches devices that already cached it
- [x] Choose screen spacing: picker cards 140×92 with 28 gap, headings and rows evenly spaced (~22 between elements)
- [x] Container running on the Docker VM at `http://<server-ip>:8080` (port via `LUMI2D_PORT` in `.env`)
- [x] Self-hosting with Docker (Node build → nginx, compose file, cache headers, healthcheck); GitHub Pages workflow made manual-only
- [x] Hosting switched from Netlify to GitHub Pages (workflow; tested service worker, manifest and offline under the `/LuMi2D/` subpath)
- [x] Choose screen before every new round (car + world); no more choosing on the start/pause/settings screens or while driving
- [x] Part 4: friends along the road per world (wave and cheer, ~1 in 3 gives a star or a surprise with confetti and 3 stars)
- [x] Part 3: floating platforms with turbo power-up (faster + smash obstacles), rainbow pieces (red/yellow/blue) and an automatic rainbow ride over a row of stars
- [x] Part 2: four worlds (Weide, Dino, Ruimte, Zoetroze) chosen in settings, four cars chosen on start/pause screen, icons next to all texts and buttons
- [x] Part 1: settings saved in localStorage, synthesized sounds (on/off in settings), PWA (manifest, icons, favicon, offline service worker)
- [x] Phase 4: walking hedgehog enemy (bump = it hops away; jump over = star) and a settings screen (gear on start screen) with obstacles/hedgehogs on/off
- [x] Wider jump window: 0.3 s → 0.7 s (floatier jump 190/1.1 s, narrower car hitbox, slightly lower obstacles)
- [x] Phase 3: obstacles (cone, rock, crate) from a fixed pool, forgiving collision with a gentle bump (no game over), a star per cleared obstacle, star counter and pop animation
- [x] Phase 2: jump by tapping (fixed arc, input buffer before landing, tilt/squash/shadow, first-time hint, `jumped`/`landed` events) (PR #2)
- [x] Branding: name LuMi2d, colourful logo on the start screen, `src/brand/` with palette, typography and UI style
- [x] Phase 1: Vite + TypeScript project, game loop, parallax background, car, start/pause/resume/restart, scaling (PR #1)
