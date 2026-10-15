import './style.css';
import { Sound } from './audio/Sound';
import { Game } from './core/Game';
import { InputManager } from './input/InputManager';
import { Renderer } from './render/Renderer';
import { Screen } from './render/Screen';

function showFatalError(error: unknown): void {
  console.error(error);
  const el = document.createElement('div');
  el.className = 'fatal-error';
  el.textContent = 'Oeps! Er ging iets mis. Herlaad de pagina om opnieuw te proberen.';
  document.body.appendChild(el);
}

function bootstrap(): void {
  const canvas = document.getElementById('game');
  if (!(canvas instanceof HTMLCanvasElement)) {
    throw new Error('Canvas-element #game niet gevonden.');
  }

  const screen = new Screen(canvas);
  const input = new InputManager(canvas);
  const renderer = new Renderer(screen);
  const sound = new Sound();
  const game = new Game(screen, input, renderer, sound, showFatalError);

  sound.attach();
  input.attach();
  screen.attach();
  game.boot();

  if (import.meta.env.DEV) {
    (window as unknown as { game: Game }).game = game;
  }
}

/** Service worker voor offline spelen; alleen in de productieversie (in dev zit hij caching in de weg). */
function registerServiceWorker(): void {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch((error: unknown) => {
      // Zonder service worker werkt het spel gewoon online; alleen loggen.
      console.warn('Service worker niet geregistreerd:', error);
    });
  });
}

try {
  bootstrap();
  registerServiceWorker();
} catch (error) {
  showFatalError(error);
}
