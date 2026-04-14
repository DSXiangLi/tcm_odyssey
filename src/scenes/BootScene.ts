// src/scenes/BootScene.ts
/**
 * 资源加载场景
 *
 * Phase 1.5 更新:
 * - 加载AI生成的小镇全景图
 * - 加载玩家sprite素材（4方向各4帧动画）
 * - 创建玩家行走动画
 *
 * Phase 2 S11: 初始化管理器并暴露到全局
 */
import Phaser from 'phaser';
import { SCENES, TILE_SIZE } from '../data/constants';
import { GameStateBridge } from '../utils/GameStateBridge';
import { PlantingManager } from '../systems/PlantingManager';
import { ExperienceManager } from '../systems/ExperienceManager';

// 玩家sprite配置 - user2素材（正确配置）
// 源图896x1195，布局4行×3列，每帧298x298
// 切分后每方向sprite sheet为894x298（3帧横向）
const PLAYER_FRAME_WIDTH = 298;   // 每帧宽度
const PLAYER_FRAME_HEIGHT = 298;  // 每帧高度
// 缩放比例：将224x298像素缩放到合适游戏尺寸
// 目标高度约64像素（2个瓦片高），按高度缩放
const PLAYER_SCALE = 64 / PLAYER_FRAME_HEIGHT; // 298 * 0.214 = 64像素

export class BootScene extends Phaser.Scene {
  private loadingText!: Phaser.GameObjects.Text;
  private progressBar!: Phaser.GameObjects.Graphics;
  private gameStateBridge!: GameStateBridge;

  constructor() {
    super({ key: SCENES.BOOT });
  }

  preload(): void {
    this.gameStateBridge = GameStateBridge.getInstance();
    this.gameStateBridge.updateCurrentScene(SCENES.BOOT);

    this.createLoadingUI();

    // Phase 1.5: 加载小镇全景背景图
    this.load.image('town_background', 'assets/town_outdoor/town_background.jpeg');

    // Phase 1.5: 加载室内场景背景图（缩放后的诊所）
    this.load.image('clinic_background', 'assets/indoor/clinic_scaled/clinic_scaled.png');
    this.load.image('garden_background', 'assets/indoor/garden/herb_field_area.png');

    // Phase 1.5: 加载玩家sprite素材（user2更新版）
    this.load.spritesheet('player_down', 'assets/sprites/player/user2_down.png', {
      frameWidth: PLAYER_FRAME_WIDTH,
      frameHeight: PLAYER_FRAME_HEIGHT
    });
    this.load.spritesheet('player_up', 'assets/sprites/player/user2_up.png', {
      frameWidth: PLAYER_FRAME_WIDTH,
      frameHeight: PLAYER_FRAME_HEIGHT
    });
    this.load.spritesheet('player_left', 'assets/sprites/player/user2_left.png', {
      frameWidth: PLAYER_FRAME_WIDTH,
      frameHeight: PLAYER_FRAME_HEIGHT
    });
    this.load.spritesheet('player_right', 'assets/sprites/player/user2_right.png', {
      frameWidth: PLAYER_FRAME_WIDTH,
      frameHeight: PLAYER_FRAME_HEIGHT
    });
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
    this.createPlayerAnimations();
    this.createPlaceholderTextures();

    // Phase 2 S11: 初始化管理器并暴露到全局
    this.initializeManagers();

    this.scene.start(SCENES.TOWN_OUTDOOR);
  }

  /**
   * Phase 2 S11/S12: 初始化管理器
   */
  private initializeManagers(): void {
    // 初始化PlantingManager并暴露到window
    const plantingManager = PlantingManager.getInstance();
    plantingManager.exposeToWindow();

    // Phase 2 S12: 初始化ExperienceManager并暴露到window
    const experienceManager = ExperienceManager.getInstance();
    experienceManager.exposeToWindow();
  }

  /**
   * 创建玩家行走动画
   */
  private createPlayerAnimations(): void {
    const animConfig = {
      frameRate: 8, // 8帧/秒，行走速度适中
      repeat: -1 // 无限循环
    };

    // 向下行走动画（3帧：帧0、帧1、帧2）
    this.anims.create({
      key: 'player_walk_down',
      frames: this.anims.generateFrameNumbers('player_down', { start: 0, end: 2 }),
      ...animConfig
    });

    // 向上行走动画（3帧）
    this.anims.create({
      key: 'player_walk_up',
      frames: this.anims.generateFrameNumbers('player_up', { start: 0, end: 2 }),
      ...animConfig
    });

    // 向左行走动画（3帧）
    this.anims.create({
      key: 'player_walk_left',
      frames: this.anims.generateFrameNumbers('player_left', { start: 0, end: 2 }),
      ...animConfig
    });

    // 向右行走动画（3帧）
    this.anims.create({
      key: 'player_walk_right',
      frames: this.anims.generateFrameNumbers('player_right', { start: 0, end: 2 }),
      ...animConfig
    });

    // 静止状态动画（每方向的第0帧）
    this.anims.create({
      key: 'player_idle_down',
      frames: [{ key: 'player_down', frame: 0 }],
      frameRate: 1
    });
    this.anims.create({
      key: 'player_idle_up',
      frames: [{ key: 'player_up', frame: 0 }],
      frameRate: 1
    });
    this.anims.create({
      key: 'player_idle_left',
      frames: [{ key: 'player_left', frame: 0 }],
      frameRate: 1
    });
    this.anims.create({
      key: 'player_idle_right',
      frames: [{ key: 'player_right', frame: 0 }],
      frameRate: 1
    });

    console.log('Phase 1.5: 玩家动画创建完成');
  }

  private createPlaceholderTextures(): void {
    // Phase 1.5: 保留占位纹理（用于室内场景）

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

    console.log('Phase 1.5: 占位纹理创建完成');
  }

  /**
   * 获取玩家缩放比例
   */
  static getPlayerScale(): number {
    return PLAYER_SCALE;
  }
}