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

## Hosting (GitHub Pages)

De game staat op GitHub Pages: https://hopeisdope.github.io/LuMi2D/
Elke push naar `main` bouwt en publiceert automatisch via `.github/workflows/pages.yml`
(handmatig opnieuw publiceren: Actions → "Deploy naar GitHub Pages" → Run workflow).

Eenmalig instellen: Settings → Pages → Source: **GitHub Actions**. GitHub Pages werkt alleen met een publieke repo
(of met GitHub Pro). Pages draait via HTTPS, dus de service worker werkt en het spel is offline speelbaar.

## Het spel

LuMi2d is een rustige, vrolijke racegame voor peuters en kleuters (±2–5 jaar) die nog niet kunnen lezen. Een
autootje rijdt vanzelf van links naar rechts; het kind doet maar één ding: **tikken om te springen**. Er is geen
game over, geen levens, geen tijdsdruk en geen ranglijst. Alles wat het kind doet levert iets leuks op.

### Bediening

- Tik ergens op het scherm om te springen. Een tik net vóór de landing telt ook (vergevingsgezind). De sprong is
  hoog en zweverig (~1,1 s in de lucht), zodat er ruim tijd is om op tijd te tikken.
- Pauzeknop rechtsboven → **Verder** of **Opnieuw**.
- Toetsenbord: Spatie/Enter = start/springen/verder, ↑/W = springen, Esc/P = pauze.
- Aan het begin van elke rit staat "Tik om te springen!" in beeld tot het kind voor het eerst springt.

### Schermen

1. **Startscherm**: logo, grote Start-knop, tandwiel (instellingen) en een boekje (rittenboekje).
2. **Kiesscherm** (voor elke rit): kies een auto en een wereld, dan **Rijden!**.
3. **Rijden**: sterrenteller linksboven, regenboogmeter (3 kleuren) bovenin, opdrachtkaartje linksonder,
   pauzeknop rechtsboven; in de gewone modus een voortgangsweggetje met finishvlag onderin.
4. **Overzicht na de finish**: aantal sterren (met een kroontje bij een nieuw record), de opdracht van deze rit,
   nieuw verdiende stickers, en de knoppen **Nog een keer** en **Kiezen**.
5. **Rittenboekje**: tellers en stickers.
6. **Instellingen**: vier aan/uit-schakelaars (zie hieronder).

Elke tekst en knop heeft een icoon of plaatje, zodat een kind dat niet leest alles kan bedienen.

### Auto's en werelden

- **4 auto's**: klassiek rood autootje, blauwe racer, groene jeep en een paarse bubbelauto (plaatjes met
  draaiende wielen; de auto huppelt zachtjes, kantelt bij springen en veert in bij de landing).
- **4 werelden**, elk met eigen lucht, heuvels (parallax), vriendjes en spelmoment:

| Wereld | Vriendjes | Spelmoment (raken door te springen) |
|---|---|---|
| Weide | konijn, beer | paardenbloempluis waait weg |
| Dino | groene dino, oranje dino | dino-ei in de berm komt uit, babydino zwaait |
| Ruimte | alien, robot | zeepbel knapt |
| Zoetroze | eenhoorn, cupcake | suikerspinwolk laat snoepjes regenen |

### Wat er op de weg gebeurt

- **Obstakels**: pionnen, stenen en kistjes (groot, met dikke donkere rand). Eroverheen springen = een ster.
  Botsen is niet erg: de auto hobbelt even, er verschijnen duizelsterretjes en hij rijdt weer verder.
- **Egels**: een vriendelijke egel wandelt de auto tegemoet; eroverheen springen = een ster. Bij een botsing
  schrikt hij en rent weg.
- **Platforms**: paarse zwevende platforms om op te springen, met een **turbo** (bliksem) erop: ~4 s sneller
  rijden en obstakels zonder hobbel wegknallen.
- **Springkussens**: rijden of landen erop geeft een extra hoge sprong langs een boog met sterren.
- **Regenboog**: pak drie regenboogstukjes (rood, geel, blauw; springen nodig). Dan volgt vanzelf een magische
  **regenboogrit**: de auto zweeft ~5 s langs een rij sterren en landt daarna veilig (even onkwetsbaar).
- **Vriendjes langs de weg**: zwaaien en juichen als de auto langskomt en geven soms een ster of een verrassing
  (confetti + extra sterren). Ze reageren op wat het kind doet: duimpje bij een ster, verbaasd bij een botsing,
  dansje bij turbo/regenboog/springkussen. Springen vlak bij een vriendje laat het meedansen.
- **Spelmoment per wereld** (zie tabel): hangt in de lucht (of ligt in de berm), raken door te springen = een ster.
- **Verrassingstaferelen** (2–3 per rit), steeds aangekondigd met een bordje langs de weg en op een stuk weg
  zonder obstakels:
  - **eendjes** steken over; de auto wacht netjes tot ze aan de overkant zijn;
  - **regenboogtunnel**: de auto rijdt onder de regenboog door, met glitters en een ster;
  - **kudde schaapjes** op de weg huppelt één voor één de berm in.

### Opdrachten

Aan het begin van een rit verschijnt groot een opdrachtkaartje met een plaatje en bolletjes, dat daarna naar
linksonder schuift. Soorten: sterren pakken (5, of 3 zonder obstakels), 3× over iets springen, een
regenboogstukje pakken, 2× springen bij een vriendje, een turbo pakken. Lukt het: confetti, een vinkje en de
vriendjes dansen. Nooit twee keer achter elkaar dezelfde soort.

### Rit, finish en oneindig rijden

- **Oneindig rijden** (standaard aan): de weg gaat eindeloos door. Na een gelukte opdracht komt er na een paar
  seconden een nieuwe. Stoppen via pauze → Opnieuw; de rit gaat dan in het rittenboekje.
- **Gewone rit** (oneindig uit): ~75 seconden. Aan het eind rijdt de auto onder een geblokte finishboog door
  (confetti, juichende vriendjes), remt rustig af en parkeert in een garage; de roldeur gaat dicht en daarna
  volgt het overzicht.

### Rittenboekje en stickers

Op het apparaat bewaard (geen account, niets persoonlijks): aantal ritten, beste rit en totaal aantal sterren,
gereden afstand, regenboogritten, gelukte opdrachten en bezochte werelden. Stickers: eerste rit, 10 ritten,
10 sterren in één rit, 100 sterren totaal, eerste regenboog, 10 regenbogen, 50 km gereden (spel-kilometers), alle werelden
bezocht, 5 opdrachten gelukt.

### Instellingen (tandwiel op het startscherm)

Pionnen & stenen aan/uit, egels aan/uit, geluid aan/uit, oneindig rijden aan/uit. Gekozen auto en wereld worden
onthouden.

### Geluid

Alle geluiden worden in de browser gemaakt (Web Audio, geen geluidsbestanden): springen, landen, botsen, ster,
turbo, regenboog, cadeautje, juichen, toeter, opdracht gelukt, boing, kwak, tunnel, plop, uitkomend ei, hupje en
een finishdeuntje. Geluid start na de eerste tik (iPad-regel).

### Ontwerpregels (handig bij nieuwe ideeën)

- Voor peuters: één handeling (tikken), geen falen of straf, geen tijdsdruk, geen scores tegen anderen.
- Geen tekst nodig: alles heeft een plaatje of icoon. Grote knoppen, alleen aanraken (geen hover).
- Niet te druk: een eerder idee (een vriendje dat elke sprong voordoet) is weer weggehaald omdat het te druk was.
- Rustig en vergevingsgezind: ruime hitboxes, zweverige sprong, genoeg ruimte tussen obstakels.
- Techniek: HTML5 Canvas 2D + TypeScript, geen game-engine, geen externe assets behalve sprites in
  `public/sprites/` (gemaakt met ChatGPT, prompts in `docs/art-prompts-gameplay.md`); elk plaatje heeft een
  getekende reserveversie in code. Geen server of account; opslag alleen lokaal op het apparaat.
- Speelt op iPad / iPad mini in Safari (liggend), installeerbaar als app (PWA).

### Nieuwe features bedenken met ChatGPT

Geef ChatGPT deze README en vraag bijvoorbeeld: "Bedenk 5 nieuwe features voor deze game die passen bij de
ontwerpregels, met per idee wat het kind ziet, wat het doet en welke plaatjes nodig zijn." Of geef het een
richting: een nieuwe wereld, een nieuw verrassingstafereel, een nieuwe soort opdracht of een nieuwe sticker.

## Structuur

```
src/
  main.ts                 bootstrap + foutafhandeling
  config.ts               2D-constanten (afmetingen, snelheid, scènekleuren, parallax)
  types.ts                types: GameState, WorldState, Car, InputAction, Viewport, ...
  core/GameLoop.ts        requestAnimationFrame-loop met begrensde delta time
  core/Game.ts            toestandsmachine (start, kiezen, rijden, pauze, overzicht, boekje, instellingen)
  input/InputManager.ts   pointer/touch/toetsenbord → abstracte InputActions
  world/World.ts, Car.ts  pure game-logica (geen rendering)
  world/Obstacles.ts      obstakels en egels: pool, spawnen, bewegen, botsingen, sterren
  world/Collectibles.ts   platforms, turbo, regenboogstukjes en de regenboogrit
  world/Friends.ts        vriendjes langs de weg (zwaaien, juichen, cadeautjes)
  world/Mission.ts        opdrachten (één per rit, of steeds een nieuwe bij oneindig rijden)
  world/Pads.ts           springkussens
  world/Moments.ts        spelmoment per wereld (pluis, ei, bel, suikerspin)
  world/Scenes.ts         verrassingstaferelen (eendjes, regenboogtunnel, schaapjes)
  world/random.ts         seedbare randomgenerator
  render/Screen.ts        canvas-schaling (vaste virtuele hoogte, letterbox)
  render/*Renderer.ts     achtergrond (parallax), auto, obstakels, vriendjes, finish/garage, UI (alleen lezen)
  render/sprites.ts       plaatjes laden; getekende versie zolang een plaatje er niet is
  settings/               instellingen en rittenboekje in localStorage
  audio/Sound.ts          gesynthetiseerde geluiden (Web Audio)
  themes.ts               de vier werelden (kleuren, vriendjes)
  ui/Layout.ts            knopposities en hit-tests
  brand/brand.ts          huisstijl: naam, palet, typografie, UI-stijl (alleen data, los van rendering)
```
