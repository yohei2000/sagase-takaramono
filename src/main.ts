import './styles.css';
import { Game } from './game/Game';

const canvas = document.getElementById('game-canvas');
const miniGameRoot = document.getElementById('mini-game-root');

if (!(canvas instanceof HTMLCanvasElement) || !miniGameRoot) {
  throw new Error('Game canvas or mini-game root is missing.');
}

new Game(canvas, miniGameRoot);
