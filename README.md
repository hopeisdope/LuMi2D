# LuMi2d

The first game in a possible LuMi family of children's games.

Eenvoudige 2D side-scroller racegame voor jonge kinderen (HTML5 Canvas + TypeScript + Vite).
Doelplatform: iPad / iPad mini in Safari (landscape), later als PWA.

## Starten

```bash
npm install
npm run dev        # dev-server, ook bereikbaar op het lokale netwerk (voor testen op iPad)
npm run typecheck  # TypeScript-controle
npm run build      # typecheck + production build naar dist/
npm run preview    # production build serveren
```

## Installeren op de iPad (PWA)

Open de site in Safari → Deel → "Zet op beginscherm". Daarna start LuMi2d schermvullend als app en werkt
het ook zonder internet (na één keer online openen). Instellingen worden op het apparaat bewaard.

Iconen opnieuw maken na een wijziging van `public/icons/icon.svg`: `node scripts/generate-icons.mjs` (vereist Playwright).

## Hosting (eigen server met Docker)

De game draait als container op een eigen server, bijvoorbeeld een Docker-VM in Proxmox, en is dan alleen op het
lokale netwerk te spelen.

Eerste keer (op de server; de repo is privé, dus klonen met een SSH-sleutel of een GitHub-token):

```bash
git clone git@github.com:hopeisdope/LuMi2D.git
cd LuMi2D
docker compose up -d --build        # bouwt de game en start nginx op poort 8080
```

Daarna spelen via `http://<ip-van-de-server>:8080` (andere poort: `LUMI2D_PORT=9000 docker compose up -d --build`).
Bijwerken naar de nieuwste versie: `git pull && docker compose build --pull && docker compose up -d`
(`--pull` haalt ook beveiligingsupdates van de basis-images op).

Let op: via gewoon `http://` op een netwerkadres staat de browser geen service worker toe. Het spel werkt dan
volledig, alleen niet offline. Wil je offline spelen, zet er dan een reverse proxy met HTTPS voor
(bijvoorbeeld Nginx Proxy Manager, Caddy of Traefik).

GitHub Pages kan later nog: de workflow `.github/workflows/pages.yml` is handmatig te starten zodra de repo
publiek is (of met GitHub Pro).

Bediening: tik om te starten, tik ergens op het scherm om te springen, pauzeknop rechtsboven.
Spring over pionnen, stenen en kistjes: elk obstakel waar je overheen springt levert een ster op.
Pas op voor de egel die over de weg wandelt: spring eroverheen voor een ster!
Botsen is niet erg: de auto hobbelt even en rijdt verder.
Spring op een paars platform en pak de bliksem: dan rijd je even supersnel met turbo.
Langs de weg staan vriendjes die zwaaien en juichen; soms geven ze je een ster of een verrassing.
Verzamel drie regenboogkleuren en de auto maakt vanzelf een magische regenboogrit langs een rij sterren.
Voor elke nieuwe ronde kies je op het kiesscherm je auto en je wereld (Weide, Dino, Ruimte of Zoetroze);
tijdens het rijden blijven die hetzelfde. Via het tandwiel op het startscherm zet je pionnen & stenen, egels
en geluid aan of uit.
Op toetsenbord: Spatie/Enter = start/springen/verder, ↑/W = springen, Esc/P = pauze.

## Structuur

```
src/
  main.ts                 bootstrap + foutafhandeling
  config.ts               2D-constanten (afmetingen, snelheid, scènekleuren, parallax)
  types.ts                types: GameState, WorldState, Car, InputAction, Viewport, ...
  core/GameLoop.ts        requestAnimationFrame-loop met begrensde delta time
  core/Game.ts            toestandsmachine ready → playing ⇄ paused, input → acties
  input/InputManager.ts   pointer/touch/toetsenbord → abstracte InputActions
  world/World.ts, Car.ts  pure game-logica (geen rendering)
  world/Obstacles.ts      obstakels en egels: pool, spawnen, bewegen, botsingen, sterren
  world/Collectibles.ts   platforms, turbo, regenboogstukjes en de regenboogrit
  world/Friends.ts        vriendjes langs de weg (zwaaien, juichen, cadeautjes)
  world/random.ts         seedbare randomgenerator
  render/Screen.ts        canvas-schaling (vaste virtuele hoogte, letterbox)
  render/*Renderer.ts     achtergrond (parallax), auto, UI
  ui/Layout.ts            knopposities en hit-tests
  brand/brand.ts          huisstijl: naam, palet, typografie, UI-stijl (alleen data, los van rendering)
```
