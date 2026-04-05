import Phaser from 'phaser';
import { gameConfig } from './config/game.config';

window.addEventListener('load', () => {
  new Phaser.Game(gameConfig);
});