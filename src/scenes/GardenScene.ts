// src/scenes/GardenScene.ts
/**
 * 老张药园场景
 *
 * Phase 1.5 更新:
 * - 使用AI生成的药园全景图作为背景
 * - 基于可行走瓦片实现碰撞检测
 * - 地图尺寸: 44×24瓦片 (1408×768像素)
 *
 * Phase 2 S11.4 更新:
 * - 添加种植游戏入口（G键）
 * - 集成PlantingManager
 */
import Phaser from 'phaser';
import { SCENES, TILE_SIZE } from '../data/constants';
import { GARDEN_CONFIG } from '../data/garden-walkable-config';
import { Player } from '../entities/Player';
import { EventBus, GameEvents } from '../systems/EventBus';
import { GameStateBridge } from '../utils/GameStateBridge';
import { PlantingManager } from '../systems/PlantingManager';
import { TutorialManager } from '../systems/TutorialManager';  // S13.4
import { createSceneTipUI, TutorialUI } from '../ui/TutorialUI';  // S13.4

interface MapData {
  width: number;
  height: number;
  walkableTiles: Set<string>;
}

export class GardenScene extends Phaser.Scene {
  private player!: Player;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private spaceKey!: Phaser.Input.Keyboard.Key;
  private gKey!: Phaser.Input.Keyboard.Key;  // S11.4: 种植快捷键
  private isTransitioning: boolean = false;
  private eventBus!: EventBus;
  private gameStateBridge!: GameStateBridge;
  private mapData!: MapData;
  private background!: Phaser.GameObjects.Image;
  private plantingManager!: PlantingManager;  // S11.4: 种植管理器
  private tutorialManager!: TutorialManager;  // S13.4: 新手引导管理器
  private sceneTipUI: TutorialUI | null = null;  // S13.4: 场景提示UI

  constructor() {
    super({ key: SCENES.GARDEN });
  }

  create(): void {
    // ⭐ 关键修复：显式重置isTransitioning，确保create()时状态正确
    this.isTransitioning = false;

    // 初始化事件系统
    this.eventBus = EventBus.getInstance();
    this.gameStateBridge = GameStateBridge.getInstance();
    this.plantingManager = PlantingManager.getInstance();  // S11.4
    this.tutorialManager = TutorialManager.getInstance();  // S13.4

    this.eventBus.emit(GameEvents.SCENE_CREATE, { sceneName: SCENES.GARDEN });

    // S13.4: 检查是否应该显示场景提示
    this.checkAndShowSceneTip();

    // ⭐ 关键修复：订阅wake事件，确保从sleep状态唤醒时重置isTransitioning
    this.events.on('wake', () => {
      this.isTransitioning = false;
      this.gameStateBridge.updateCurrentScene(SCENES.GARDEN);
      console.log('[GardenScene] wake event received, isTransitioning reset to false');
    });

    // Phase 1.5: 加载背景图
    this.createBackground();

    // 创建地图数据
    this.mapData = {
      width: GARDEN_CONFIG.width,
      height: GARDEN_CONFIG.height,
      walkableTiles: GARDEN_CONFIG.walkableTiles
    };

    // 更新状态桥接器
    this.gameStateBridge.updateCurrentScene(SCENES.GARDEN);
    this.gameStateBridge.updateSceneSize({
      width: this.mapData.width,
      height: this.mapData.height
    });

    // 创建玩家
    this.createPlayer();

    // 设置相机
    this.setupCamera();

    // 设置输入
    this.setupInput();

    // 添加UI提示
    this.add.text(10, 10, '老张药园 (Phase 1.5)', {
      fontSize: '16px',
      color: '#ffffff',
      backgroundColor: '#000000aa',
      padding: { x: 8, y: 4 }
    }).setScrollFactor(0);

    this.add.text(10, 40, '按空格键返回室外 | 按G键种植', {
      fontSize: '12px',
      color: '#aaaaaa'
    }).setScrollFactor(0);

    this.eventBus.emit(GameEvents.SCENE_READY, { sceneName: SCENES.GARDEN });
  }

  /**
   * Phase 1.5: 加载背景图
   */
  private createBackground(): void {
    const config = GARDEN_CONFIG;
    const mapPixelWidth = config.width * TILE_SIZE;
    const mapPixelHeight = config.height * TILE_SIZE;

    this.background = this.add.image(
      mapPixelWidth / 2,
      mapPixelHeight / 2,
      'garden_background'
    );

    this.background.setDisplaySize(mapPixelWidth, mapPixelHeight);
    this.background.setOrigin(0.5);
    this.background.setDepth(0);
  }

  private createPlayer(): void {
    let spawnX: number;
    let spawnY: number;

    const registrySpawnPoint = this.registry.get('spawnPoint');
    if (registrySpawnPoint) {
      spawnX = registrySpawnPoint.x * TILE_SIZE + TILE_SIZE / 2;
      spawnY = registrySpawnPoint.y * TILE_SIZE + TILE_SIZE / 2;
      this.registry.remove('spawnPoint');
    } else {
      const configSpawn = GARDEN_CONFIG.playerSpawnPoint;
      spawnX = configSpawn.x * TILE_SIZE + TILE_SIZE / 2;
      spawnY = configSpawn.y * TILE_SIZE + TILE_SIZE / 2;
    }

    // 更新物理世界边界
    const mapPixelWidth = this.mapData.width * TILE_SIZE;
    const mapPixelHeight = this.mapData.height * TILE_SIZE;
    this.physics.world.setBounds(0, 0, mapPixelWidth, mapPixelHeight);

    this.player = new Player({
      scene: this,
      x: spawnX,
      y: spawnY
    });
    this.player.setDepth(10);

    // Phase 1.5: 药园场景玩家放大
    // 药园背景图尺寸较小(44x24)，玩家需要适度放大
    this.player.setScale(0.35);  // 药园用35%（64像素 -> 约89像素）

    this.gameStateBridge.updatePlayerState({
      x: this.player.x,
      y: this.player.y,
      tileX: Math.floor(this.player.x / TILE_SIZE),
      tileY: Math.floor(this.player.y / TILE_SIZE),
      speed: this.player.speed,
      velocity: { x: 0, y: 0 }
    });
  }

  private setupCamera(): void {
    const mapPixelWidth = this.mapData.width * TILE_SIZE;
    const mapPixelHeight = this.mapData.height * TILE_SIZE;

    this.cameras.main.setBounds(0, 0, mapPixelWidth, mapPixelHeight);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
  }

  private setupInput(): void {
    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
      this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
      this.gKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.G);  // S11.4
      this.input.keyboard.addKeys('W,A,S,D');
    }
  }

  /**
   * 检查目标位置是否可行走
   */
  private canMoveTo(x: number, y: number): boolean {
    const tileX = Math.floor(x / TILE_SIZE);
    const tileY = Math.floor(y / TILE_SIZE);
    return this.mapData.walkableTiles.has(`${tileX},${tileY}`);
  }

  /**
   * 确保玩家位置在可行走区域
   */
  private enforceWalkablePosition(): void {
    const currentTileX = Math.floor(this.player.x / TILE_SIZE);
    const currentTileY = Math.floor(this.player.y / TILE_SIZE);
    const currentKey = `${currentTileX},${currentTileY}`;

    if (!this.mapData.walkableTiles.has(currentKey)) {
      const directions = [
        { dx: 0, dy: -1 },
        { dx: 0, dy: 1 },
        { dx: -1, dy: 0 },
        { dx: 1, dy: 0 },
        { dx: -1, dy: -1 },
        { dx: 1, dy: -1 },
        { dx: -1, dy: 1 },
        { dx: 1, dy: 1 },
      ];

      for (const dir of directions) {
        const checkX = currentTileX + dir.dx;
        const checkY = currentTileY + dir.dy;
        const checkKey = `${checkX},${checkY}`;

        if (this.mapData.walkableTiles.has(checkKey)) {
          const newX = checkX * TILE_SIZE + TILE_SIZE / 2;
          const newY = checkY * TILE_SIZE + TILE_SIZE / 2;
          this.player.setPosition(newX, newY);
          this.player.stop();
          return;
        }
      }

      // 推回出生点
      const spawnX = GARDEN_CONFIG.playerSpawnPoint.x * TILE_SIZE + TILE_SIZE / 2;
      const spawnY = GARDEN_CONFIG.playerSpawnPoint.y * TILE_SIZE + TILE_SIZE / 2;
      this.player.setPosition(spawnX, spawnY);
      this.player.stop();
    }
  }

  update(): void {
    if (!this.player || !this.cursors) return;

    // 确保玩家位置在可行走区域
    this.enforceWalkablePosition();

    const direction = { x: 0, y: 0 };

    if (this.cursors.left.isDown || this.input.keyboard?.addKey('A').isDown) {
      direction.x = -1;
    } else if (this.cursors.right.isDown || this.input.keyboard?.addKey('D').isDown) {
      direction.x = 1;
    }

    if (this.cursors.up.isDown || this.input.keyboard?.addKey('W').isDown) {
      direction.y = -1;
    } else if (this.cursors.down.isDown || this.input.keyboard?.addKey('S').isDown) {
      direction.y = 1;
    }

    // 检查目标位置是否可行走
    if (direction.x !== 0 || direction.y !== 0) {
      let velocityX = direction.x * this.player.speed;
      let velocityY = direction.y * this.player.speed;

      if (velocityX !== 0 && velocityY !== 0) {
        velocityX *= 0.707;
        velocityY *= 0.707;
      }

      const predictedX = this.player.x + velocityX * 0.016;
      const predictedY = this.player.y + velocityY * 0.016;

      if (this.canMoveTo(predictedX, predictedY)) {
        this.player.move(direction);
      } else {
        const predictedXOnly = this.player.x + velocityX * 0.016;
        const predictedYOnly = this.player.y + velocityY * 0.016;

        if (direction.x !== 0 && this.canMoveTo(predictedXOnly, this.player.y)) {
          this.player.move({ x: direction.x, y: 0 });
        } else if (direction.y !== 0 && this.canMoveTo(this.player.x, predictedYOnly)) {
          this.player.move({ x: 0, y: direction.y });
        } else {
          this.player.stop();
        }
      }
    } else {
      this.player.stop();
    }

    this.player.updatePositionTracking();

    const body = this.player.body as Phaser.Physics.Arcade.Body;
    this.gameStateBridge.updatePlayerState({
      x: this.player.x,
      y: this.player.y,
      tileX: Math.floor(this.player.x / TILE_SIZE),
      tileY: Math.floor(this.player.y / TILE_SIZE),
      speed: this.player.speed,
      velocity: { x: body.velocity.x, y: body.velocity.y }
    });

    // 空格键返回室外
    if (Phaser.Input.Keyboard.JustDown(this.spaceKey) && !this.isTransitioning) {
      this.eventBus.emit(GameEvents.SCENE_SWITCH, {
        from: SCENES.GARDEN,
        to: SCENES.TOWN_OUTDOOR
      });

      this.isTransitioning = true;
      this.registry.set('spawnPoint', { x: 15, y: 10 });
      this.scene.start(SCENES.TOWN_OUTDOOR);
    }

    // S11.4: G键进入种植游戏
    if (Phaser.Input.Keyboard.JustDown(this.gKey) && !this.isTransitioning) {
      this.togglePlanting();
    }
  }

  /**
   * S11.4: 进入种植游戏
   */
  private togglePlanting(): void {
    this.eventBus.emit(GameEvents.SCENE_SWITCH, {
      from: SCENES.GARDEN,
      to: SCENES.PLANTING
    });

    // 切换到种植场景
    this.scene.launch(SCENES.PLANTING);
    this.scene.pause();
  }

  shutdown(): void {
    // ⭐ 关键修复：重置 isTransitioning 状态
    this.isTransitioning = false;

    // S13.4: 清理场景提示UI
    if (this.sceneTipUI) {
      this.sceneTipUI.destroy();
      this.sceneTipUI = null;
    }

    this.eventBus.emit(GameEvents.SCENE_DESTROY, { sceneName: SCENES.GARDEN });
  }

  // ⭐ 关键修复：当场景从sleep状态唤醒时，重置isTransitioning
  // Phaser场景生命周期：sleep → wake() 而非 shutdown() → create()
  wake(): void {
    this.isTransitioning = false;
    console.log('[GardenScene] wake() called, isTransitioning reset to false');
  }

  /**
   * S13.4: 检查并显示场景提示
   */
  private checkAndShowSceneTip(): void {
    const sceneKey = SCENES.GARDEN;

    if (this.tutorialManager.shouldShowSceneTip(sceneKey)) {
      // 获取场景提示配置
      const tipConfig = this.tutorialManager.getSceneTipInfo(sceneKey);

      if (tipConfig) {
        console.log(`[GardenScene] Showing scene tip for ${sceneKey}`);

        // 创建场景提示UI
        this.sceneTipUI = createSceneTipUI(
          this,
          tipConfig,
          () => {
            // onClose: 提示关闭后标记已显示
            this.tutorialManager.markSceneTipShown(sceneKey);
            this.sceneTipUI = null;
            console.log(`[GardenScene] Scene tip shown and marked for ${sceneKey}`);
          }
        );
      }
    }
  }
}