// Placeholder scene - will be implemented in subsequent tasks
import Phaser from 'phaser';
import { SCENES } from '../data/constants';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENES.BOOT });
  }

  preload(): void {
    // TODO: Load game assets
  }

  create(): void {
    // TODO: Start the main scene
    this.scene.start(SCENES.TOWN_OUTDOOR);
  }
}