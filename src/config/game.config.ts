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
// Phase 2 S10: 炮制场景
import { ProcessingScene } from '../scenes/ProcessingScene';
// Phase 2 S11: 种植场景
import { PlantingScene } from '../scenes/PlantingScene';
// Phase 2.5: 诊断场景（HTML 直接迁移）
import { DiagnosisScene } from '../scenes/DiagnosisScene';

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  parent: 'game-container',
  backgroundColor: '#2d5a27',
  pixelArt: true,
  dom: {
    createContainer: true
  },
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
    DecoctionScene,
    // Phase 2 S10: 炮制场景
    ProcessingScene,
    // Phase 2 S11: 种植场景
    PlantingScene,
    // Phase 2.5: 诊断场景（HTML 直接迁移）
    DiagnosisScene
  ],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  }
};