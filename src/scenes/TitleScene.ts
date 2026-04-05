// src/scenes/TitleScene.ts
import Phaser from 'phaser';
import { SCENES, GAME_WIDTH, GAME_HEIGHT } from '../data/constants';

export class TitleScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENES.TITLE });
  }

  create(): void {
    // 背景
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x2d5a27);

    // 标题
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 3, '药灵山谷', {
      fontSize: '48px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // 副标题
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 3 + 60, 'v3.0 - 一期MVP', {
      fontSize: '16px',
      color: '#aaaaaa'
    }).setOrigin(0.5);

    // 开始按钮
    const startButton = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 50, '开始游戏', {
      fontSize: '24px',
      color: '#ffffff',
      backgroundColor: '#4a7c59',
      padding: { x: 20, y: 10 }
    }).setOrigin(0.5).setInteractive();

    startButton.on('pointerover', () => {
      startButton.setStyle({ backgroundColor: '#5a8c69' });
    });

    startButton.on('pointerout', () => {
      startButton.setStyle({ backgroundColor: '#4a7c59' });
    });

    startButton.on('pointerdown', () => {
      this.cameras.main.fade(500, 0, 0, 0);
      this.time.delayedCall(500, () => {
        this.scene.start(SCENES.BOOT);
      });
    });

    // 操作提示
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 80, '方向键/WASD移动 | 空格交互', {
      fontSize: '14px',
      color: '#888888'
    }).setOrigin(0.5);

    // 淡入效果
    this.cameras.main.fadeIn(500);
  }
}