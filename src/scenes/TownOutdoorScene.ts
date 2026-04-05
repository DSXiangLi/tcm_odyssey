// Placeholder scene - will be implemented in subsequent tasks
import Phaser from 'phaser';
import { SCENES } from '../data/constants';

export class TownOutdoorScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENES.TOWN_OUTDOOR });
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