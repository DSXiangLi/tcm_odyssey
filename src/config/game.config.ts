import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../data/constants';
import { TitleScene } from '../scenes/TitleScene';
import { BootScene } from '../scenes/BootScene';
import { TownOutdoorScene } from '../scenes/TownOutdoorScene';
import { ClinicScene } from '../scenes/ClinicScene';
import { GardenScene } from '../scenes/GardenScene';
import { HomeScene } from '../scenes/HomeScene';
// Phase 2 S4: 问诊场景
import { InquiryScene } from '../scenes/InquiryScene';
// Phase 2 S6: 诊治场景
import { PulseScene } from '../scenes/PulseScene';
import { TongueScene } from '../scenes/TongueScene';
import { SyndromeScene } from '../scenes/SyndromeScene';
import { PrescriptionScene } from '../scenes/PrescriptionScene';
// Phase 2 S9: 煎药场景
import { DecoctionScene } from '../scenes/DecoctionScene';

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  parent: 'game-container',
  backgroundColor: '#2d5a27',
  pixelArt: true,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false
    }
  },
  scene: [
    TitleScene,
    BootScene,
    TownOutdoorScene,
    ClinicScene,
    GardenScene,
    HomeScene,
    InquiryScene,
    // Phase 2 S6: 诊治场景
    PulseScene,
    TongueScene,
    SyndromeScene,
    PrescriptionScene,
    // Phase 2 S9: 煎药场景
    DecoctionScene
  ],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  }
};