// src/scenes/BootScene.ts
/**
 * 资源加载场景
 *
 * Phase 1.5 更新:
 * - 加载AI生成的小镇全景图
 * - 创建占位纹理（用于室内场景和玩家）
 */
import Phaser from 'phaser';
import { SCENES, TILE_SIZE } from '../data/constants';

export class BootScene extends Phaser.Scene {
  private loadingText!: Phaser.GameObjects.Text;
  private progressBar!: Phaser.GameObjects.Graphics;

  constructor() {
    super({ key: SCENES.BOOT });
  }

  preload(): void {
    this.createLoadingUI();

    // Phase 1.5: 加载小镇全景背景图
    this.load.image('town_background', 'assets/town_outdoor/town_background.jpeg');
  }

  private createLoadingUI(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    this.loadingText = this.add.text(width / 2, height / 2 - 50, '加载中...', {
      fontSize: '24px',
      color: '#ffffff'
    }).setOrigin(0.5);

    this.progressBar = this.add.graphics();

    this.load.on('progress', (value: number) => {
      this.progressBar.clear();
      this.progressBar.fillStyle(0x4a7c59, 1);
      this.progressBar.fillRect(
        width / 4,
        height / 2,
        (width / 2) * value,
        20
      );
    });

    this.load.on('complete', () => {
      this.progressBar.destroy();
      this.loadingText.destroy();
    });
  }

  create(): void {
    this.createPlaceholderTextures();
    this.scene.start(SCENES.TOWN_OUTDOOR);
  }

  private createPlaceholderTextures(): void {
    // Phase 1.5: 保留占位纹理（用于室内场景和玩家）

    // 草地纹理（室内场景可能需要）
    const grassGraphics = this.add.graphics();
    grassGraphics.fillStyle(0x4a7c59);
    grassGraphics.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    grassGraphics.generateTexture('grass', TILE_SIZE, TILE_SIZE);
    grassGraphics.destroy();

    // 路径纹理（室内场景可能需要）
    const pathGraphics = this.add.graphics();
    pathGraphics.fillStyle(0xc9b896);
    pathGraphics.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    pathGraphics.generateTexture('path', TILE_SIZE, TILE_SIZE);
    pathGraphics.destroy();

    // 墙壁纹理（室内场景）
    const wallGraphics = this.add.graphics();
    wallGraphics.fillStyle(0x8b4513);
    wallGraphics.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    wallGraphics.generateTexture('wall', TILE_SIZE, TILE_SIZE);
    wallGraphics.destroy();

    // 门纹理（室内场景）
    const doorGraphics = this.add.graphics();
    doorGraphics.fillStyle(0x654321);
    doorGraphics.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    doorGraphics.fillStyle(0x4a3728);
    doorGraphics.fillRect(4, 4, TILE_SIZE - 8, TILE_SIZE - 8);
    doorGraphics.generateTexture('door', TILE_SIZE, TILE_SIZE);
    doorGraphics.destroy();

    // 玩家纹理
    const playerGraphics = this.add.graphics();
    playerGraphics.fillStyle(0xff6b6b);
    playerGraphics.fillCircle(TILE_SIZE / 2, TILE_SIZE / 2, TILE_SIZE / 3);
    playerGraphics.generateTexture('player', TILE_SIZE, TILE_SIZE);
    playerGraphics.destroy();

    console.log('Phase 1.5: 资源加载完成');
  }
}