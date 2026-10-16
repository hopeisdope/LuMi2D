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

## Hosting (test)

GitHub Pages: de workflow `.github/workflows/pages.yml` bouwt de game en publiceert `dist/` bij elke push naar
`main` op https://hopeisdope.github.io/LuMi2D/. Eenmalig instellen: Settings → Pages → Source: "GitHub Actions".

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
