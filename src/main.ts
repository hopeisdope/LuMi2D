import './style.css';
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
  const game = new Game(screen, input, renderer, showFatalError);

  input.attach();
  screen.attach();
  game.boot();

  if (import.meta.env.DEV) {
    (window as unknown as { game: Game }).game = game;
  }
}

try {
  bootstrap();
} catch (error) {
  showFatalError(error);
}
