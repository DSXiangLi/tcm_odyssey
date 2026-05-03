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
import { UI_COLORS } from '../data/ui-color-theme';
import { HERBS_DATA } from '../data/inventory-data';

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

    // Phase 2.5: 加载药材图片素材
    this.loadHerbImages();

    // Phase 2 S3: 加载NPC精灵图素材
    this.loadNPCSprites();
  }

  /**
   * Phase 2 S3: 加载NPC精灵图素材
   */
  private loadNPCSprites(): void {
    // 加载teacher2精灵图（用于NPC占位）
    // qingmu使用teacher2_down作为NPC图像
    this.load.image('npc_qingmu', 'assets/sprites/npc/teacher2_down.png');
    this.load.image('npc_laozhang', 'assets/sprites/npc/teacher2_down.png');  // Placeholder
    this.load.image('npc_neighbor', 'assets/sprites/npc/teacher2_down.png');  // Placeholder
    console.log('[BootScene] NPC sprites loaded');
  }

  /**
   * Phase 2.5: 加载药材图片素材
   */
  private loadHerbImages(): void {
    // 遍历所有药材数据，加载有icon字段的图片
    HERBS_DATA.forEach(herb => {
      if (herb.icon) {
        // icon格式为 "herbs/1_麻黄"，实际路径为 "assets/herbs/1_麻黄.png"
        const imagePath = `assets/${herb.icon}.png`;
        this.load.image(herb.icon, imagePath);
        console.log(`[BootScene] Loading herb image: ${herb.icon} -> ${imagePath}`);
      }
    });
    console.log(`[BootScene] Total herb images to load: ${HERBS_DATA.filter(h => h.icon).length}`);
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
      this.progressBar.fillStyle(UI_COLORS.BUTTON_PRIMARY, 1);
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
    // 标记BootScene被访问（供测试验证）
    (window as any).__BOOT_SCENE_VISITED__ = true;

    this.createPlayerAnimations();
    this.createPlaceholderTextures();

    // Phase 2 S11: 初始化管理器并暴露到全局
    this.initializeManagers();

    // ⭐ 关键修复：检查registry中是否有存档目标场景
    // 存档加载时，TitleScene会将目标场景存入registry
    const savedTargetScene = this.game.registry.get('savedTargetScene');
    const savedPlayerPosition = this.game.registry.get('savedPlayerPosition');

    // ⭐ 新增：检查URL参数是否有指定场景（用于测试）
    const urlParams = new URLSearchParams(window.location.search);
    const urlScene = urlParams.get('scene');

    if (savedTargetScene && typeof savedTargetScene === 'string') {
      console.log(`[BootScene] Found saved target scene: ${savedTargetScene}`);

      // 清理registry中的存档数据（避免下次启动时误用）
      this.game.registry.remove('savedTargetScene');
      this.game.registry.remove('savedPlayerPosition');

      // 将玩家位置存入registry，供目标场景使用
      if (savedPlayerPosition) {
        this.game.registry.set('spawnPoint', savedPlayerPosition);
      }

      // 跳转到存档目标场景
      this.scene.start(savedTargetScene);
    } else if (urlScene) {
      // ⭐ 新增：URL参数指定场景（用于测试直接跳转）
      console.log(`[BootScene] URL parameter scene: ${urlScene}`);

      // 映射URL参数到场景key
      const sceneMap: Record<string, string> = {
        'clinic': SCENES.CLINIC,
        'garden': SCENES.GARDEN,
        'home': SCENES.HOME,
        'town': SCENES.TOWN_OUTDOOR,
        'town_outdoor': SCENES.TOWN_OUTDOOR
      };

      const targetScene = sceneMap[urlScene.toLowerCase()];
      if (targetScene) {
        console.log(`[BootScene] Jumping to scene: ${targetScene}`);
        this.scene.start(targetScene);
      } else {
        console.warn(`[BootScene] Unknown scene in URL: ${urlScene}, falling back to default`);
        this.scene.start(SCENES.TOWN_OUTDOOR);
      }
    } else {
      // 新游戏流程：跳转到默认室外场景
      this.scene.start(SCENES.TOWN_OUTDOOR);
    }
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
    grassGraphics.fillStyle(UI_COLORS.ACCENT_GRASS);
    grassGraphics.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    grassGraphics.generateTexture('grass', TILE_SIZE, TILE_SIZE);
    grassGraphics.destroy();

    // 路径纹理（室内场景可能需要）
    const pathGraphics = this.add.graphics();
    pathGraphics.fillStyle(UI_COLORS.BORDER_LIGHT);
    pathGraphics.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    pathGraphics.generateTexture('path', TILE_SIZE, TILE_SIZE);
    pathGraphics.destroy();

    // 墙壁纹理（室内场景）
    const wallGraphics = this.add.graphics();
    wallGraphics.fillStyle(UI_COLORS.BORDER_PRIMARY);
    wallGraphics.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    wallGraphics.generateTexture('wall', TILE_SIZE, TILE_SIZE);
    wallGraphics.destroy();

    // 门纹理（室内场景）
    const doorGraphics = this.add.graphics();
    doorGraphics.fillStyle(UI_COLORS.PANEL_SECONDARY);
    doorGraphics.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    doorGraphics.fillStyle(UI_COLORS.BORDER_PRIMARY);
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