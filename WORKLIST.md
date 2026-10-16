# Worklist

Read at the start of every session; update when something is done or added.

## Now

- [ ] Tune jump height/airtime and obstacle sizes/gaps (`JUMP`, `OBSTACLES` in `config.ts`) with children on a real iPad — jump window widened to ~0.7 s, check if that feels right
- [ ] Test on a real iPad and iPad mini in Safari: smoothness (headless Chromium without GPU can't measure this), touch, sound, install via "Zet op beginscherm", offline

## Next

- [ ] Check the new sprites on a real iPad (sharpness, size of friends next to the car)
- [ ] Configurable auto-movement, difficulty and increasing speed

## Open questions

- Dependabot PRs #17–#22 are open: node 22 → 25 (not LTS; close or retarget to 24), GitHub Actions major bumps (CI and the manual Pages workflow)

- Offline mode on the LAN needs HTTPS (reverse proxy with a certificate); is that wanted later?


## Done

- [x] Endless mode toggle (no finish, missions keep coming), car drives under the rainbow tunnel, obstacles bigger with a thick outline (a toddler missed some)
- [x] Issues #33 (friends kept clear of platforms, world moments and scenes), #35 (car drives under the finish banner: front pole in front of the road), #36 (car drives into the garage, door closes in front of it; garage friend past the right wall)
- [x] Gameplay sprites (ChatGPT): garage (car drives into the transparent doorway, roller door closes over it), bounce pad (bigger: 140 wide, hit zone 120), dino egg/hatching baby dino, cotton candy, walking ducks, sheep standing/hopping, pictures on the scene signs; drawn versions stay as fallback
- [x] Removed the friend demonstrating jumps (1.2): too busy according to the owner. The "Tik om te springen!" hint at the start stays
- [x] Gameplay 3.1 one moment per world, all hit by jumping (the whole car counts, so any jump past it works): meadow dandelion fluff blows away, dino egg in the berm hatches a waving baby dino, space bubbles pop, candy cotton-candy cloud rains sweets; each gives a star. Nothing happens when driving past without jumping
- [x] Gameplay 2.2 surprise scenes (2–3 per ride, each announced by the same kind of roadside sign, on obstacle-free road): ducks crossing (the car stops and waits), rainbow tunnel (sparkles + a star), a herd of sheep hopping off the road
- [x] Gameplay 2.3 bounce pads: mint trampoline with springs and bouncing up-arrows; driving or landing on it gives a soft 260-high bounce with 'boing' and three stars along the arc; course leaves room for the long bounce. Mission card moved to the bottom-left (the high bounce reached the top-left card)
- [x] Gameplay 2.1 one mission per ride (5 stars / jump over 3 / 1 rainbow piece / jump next to 2 friends / 1 turbo; only feasible ones, never the same twice): big card at the start that slides to the top-left with progress dots, confetti + sound when done, shown in the summary; missions counted in the book (+ sticker for 5). Jumping next to a friend now always makes it dance
- [x] Gameplay 2.4 finish: rides end after 24 000 units (~75 s); clear road before the finish, checkered arch with confetti and fanfare, cheering friends, the car brakes into a garage and the door closes; summary with stars, record crown and new stickers; "Nog een keer" / "Kiezen"; progress bar to the flag at the bottom
- [x] Gameplay 1.3 ride book (book button on the start screen): best ride stars, rides, distance in "km", rainbow rides, 8 milestone stickers; counts ≤ 10 shown as rows of pictures; saved in `lumi2d.progress.v1` when a ride ends or the app is hidden, without double counting
- [x] Gameplay 1.2 friends demonstrate: while the child is still learning, a friend stands behind each obstacle, points at it (arrow) and hops with a tap-hand at the moment to tap (+ soft 'hup'); stops after 3 clean jumps in a row, restarts after a bump. Simulated taps 0.1–0.7 s after the demo all clear the obstacle
- [x] Gameplay 1.1 action feedback: jump lines, landing dust, dizzy stars after a bump, sparkle on collect; friends in view react (thumbs on a star, surprised on a bump, dance on rainbow/turbo)
- [x] Review LUMI-003 (DOM/screen-reader UI, re-enable zoom) declined on purpose; reasoning in `CLAUDE.md` → Conventions
- [x] nginx 1.27 (unsupported) → 1.30 stable; Dependabot for base images and Actions; update command pulls base images (review LUMI-004)
- [x] Service worker caches the page only when it is successful HTML; regression test `scripts/test-offline.mjs` (review LUMI-001)
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
