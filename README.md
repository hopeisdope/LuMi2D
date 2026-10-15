# LuMi2D

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

Bediening: tik om te starten, pauzeknop rechtsboven. Op toetsenbord: Spatie/Enter = start/verder, Esc/P = pauze.

## Structuur

```
src/
  main.ts                 bootstrap + foutafhandeling
  config.ts               alle constanten (afmetingen, snelheid, kleuren, parallax)
  types.ts                types: GameState, WorldState, Car, InputAction, Viewport, ...
  core/GameLoop.ts        requestAnimationFrame-loop met begrensde delta time
  core/Game.ts            toestandsmachine ready → playing ⇄ paused, input → acties
  input/InputManager.ts   pointer/touch/toetsenbord → abstracte InputActions
  world/World.ts, Car.ts  pure game-logica (geen rendering)
  render/Screen.ts        canvas-schaling (vaste virtuele hoogte, letterbox)
  render/*Renderer.ts     achtergrond (parallax), auto, UI
  ui/Layout.ts            knopposities en hit-tests
```
