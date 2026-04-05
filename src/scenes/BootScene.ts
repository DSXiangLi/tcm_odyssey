// Placeholder scene - will be implemented in subsequent tasks
import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    // TODO: Load game assets
  }

  create(): void {
    // TODO: Start the main scene
    this.scene.start('TownOutdoorScene');
  }
}