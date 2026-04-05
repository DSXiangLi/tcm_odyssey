// src/scenes/BootScene.ts
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
    this.loadAssets();
  }

  private createLoadingUI(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // 加载文字
    this.loadingText = this.add.text(width / 2, height / 2 - 50, '加载中...', {
      fontSize: '24px',
      color: '#ffffff'
    }).setOrigin(0.5);

    // 进度条背景
    this.progressBar = this.add.graphics();

    // 加载进度事件
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

  private loadAssets(): void {
    // 加载地图（暂时使用占位）
    // this.load.tilemapTiledJSON(ASSETS.MAPS.TOWN_OUTDOOR, 'assets/maps/town-outdoor.json');

    // 加载瓦片图集（暂时使用占位）
    // this.load.image(ASSETS.TILES.OUTDOOR, 'assets/tiles/tileset.png');

    // 加载玩家精灵（暂时使用占位）
    // this.load.spritesheet(ASSETS.SPRITES.PLAYER, 'assets/sprites/player.png', {
    //   frameWidth: 32,
    //   frameHeight: 48
    // });
  }

  create(): void {
    // 创建占位纹理
    this.createPlaceholderTextures();

    // 跳转到主场景
    this.scene.start(SCENES.TOWN_OUTDOOR);
  }

  private createPlaceholderTextures(): void {
    // 创建草地纹理
    const grassGraphics = this.add.graphics();
    grassGraphics.fillStyle(0x4a7c59);
    grassGraphics.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    grassGraphics.generateTexture('grass', TILE_SIZE, TILE_SIZE);
    grassGraphics.destroy();

    // 创建路径纹理
    const pathGraphics = this.add.graphics();
    pathGraphics.fillStyle(0xc9b896);
    pathGraphics.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    pathGraphics.generateTexture('path', TILE_SIZE, TILE_SIZE);
    pathGraphics.destroy();

    // 创建墙壁纹理
    const wallGraphics = this.add.graphics();
    wallGraphics.fillStyle(0x8b4513);
    wallGraphics.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    wallGraphics.generateTexture('wall', TILE_SIZE, TILE_SIZE);
    wallGraphics.destroy();

    // 创建门纹理
    const doorGraphics = this.add.graphics();
    doorGraphics.fillStyle(0x654321);
    doorGraphics.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    doorGraphics.fillStyle(0x4a3728);
    doorGraphics.fillRect(4, 4, TILE_SIZE - 8, TILE_SIZE - 8);
    doorGraphics.generateTexture('door', TILE_SIZE, TILE_SIZE);
    doorGraphics.destroy();

    // 创建玩家纹理
    const playerGraphics = this.add.graphics();
    playerGraphics.fillStyle(0xff6b6b);
    playerGraphics.fillCircle(TILE_SIZE / 2, TILE_SIZE / 2, TILE_SIZE / 3);
    playerGraphics.generateTexture('player', TILE_SIZE, TILE_SIZE);
    playerGraphics.destroy();

    console.log('占位纹理创建完成');
  }
}