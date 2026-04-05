// Placeholder scene - will be implemented in subsequent tasks
import Phaser from 'phaser';

export class TownOutdoorScene extends Phaser.Scene {
  constructor() {
    super({ key: 'TownOutdoorScene' });
  }

  preload(): void {
    // TODO: Load scene assets
  }

  create(): void {
    // TODO: Create scene content
    // Temporary background color
    this.cameras.main.setBackgroundColor('#2d5a27');
  }
}