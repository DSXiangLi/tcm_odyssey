import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../data/constants';
import { TitleScene } from '../scenes/TitleScene';
import { BootScene } from '../scenes/BootScene';
import { TownOutdoorScene } from '../scenes/TownOutdoorScene';
import { ClinicScene } from '../scenes/ClinicScene';
import { GardenScene } from '../scenes/GardenScene';
import { HomeScene } from '../scenes/HomeScene';
// Phase 2 S9: 煎药场景
import { DecoctionScene } from '../scenes/DecoctionScene';
// Phase 2 S10: 炎制场景
import { ProcessingScene } from '../scenes/ProcessingScene';
// Phase 2 S11: 种植场景
import { PlantingScene } from '../scenes/PlantingScene';
// Phase 2.5: 诊断场景（HTML 直接迁移，整合舌诊/脉诊/问诊/辨证/选方）
import { DiagnosisScene } from '../scenes/DiagnosisScene';
// 以下场景已废弃，由 DiagnosisScene 整合：
// - InquiryScene (问诊) - 已合并到 DiagnosisScene.wenzhen 阶段
// - PulseScene (脉诊) - 已合并到 DiagnosisScene.pulse 阶段
// - TongueScene (舌诊) - 已合并到 DiagnosisScene.tongue 阶段
// - SyndromeScene (辨证) - 已合并到 DiagnosisScene.bianzheng 阶段
// - PrescriptionScene (选方) - 已合并到 DiagnosisScene.xuanfang 阶段

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