// src/scenes/TownOutdoorScene.ts
/**
 * 百草镇室外场景
 *
 * Phase 1.5 更新:
 * - 使用AI生成的小镇全景图作为背景
 * - 基于黑白遮罩分析的可行走瓦片实现碰撞检测
 * - 地图尺寸: 86×48瓦片 (2752×1536像素)
 */

import Phaser from 'phaser';
import { SCENES, TILE_SIZE } from '../data/constants';
import {
  TOWN_OUTDOOR_CONFIG,
  isWalkable
} from '../data/map-config';
import { Player } from '../entities/Player';
import { SceneManager, DoorInfo } from '../systems/SceneManager';
import { EventBus, GameEvents } from '../systems/EventBus';
import { GameStateBridge } from '../utils/GameStateBridge';
import { TutorialManager } from '../systems/TutorialManager';  // S13.4
import { createSceneTipUI, TutorialUI } from '../ui/TutorialUI';  // S13.4
// Phase 2.5 全局背包系统
import { InventoryManager, createInventoryManager } from '../systems/InventoryManager';
import { InventoryUI, createInventoryUI } from '../ui/InventoryUI';

// 简化的地图数据结构（Phase 1.5不再使用瓦片渲染）
interface MapData {
  width: number;
  height: number;
  walkableTiles: Set<string>;
}

export class TownOutdoorScene extends Phaser.Scene {
  private player!: Player;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private mapData!: MapData;
  private sceneManager!: SceneManager;
  private doorTiles: Map<string, DoorInfo> = new Map();
  private spaceKey!: Phaser.Input.Keyboard.Key;
  private isTransitioning: boolean = false;
  private eventBus!: EventBus;
  private gameStateBridge!: GameStateBridge;
  private playerTileText!: Phaser.GameObjects.Text;
  private background!: Phaser.GameObjects.Image;
  private tutorialManager!: TutorialManager;  // S13.4: 新手引导管理器
  private sceneTipUI: TutorialUI | null = null;  // S13.4: 场景提示UI
  // Phase 2.5 全局背包系统
  private inventoryKey!: Phaser.Input.Keyboard.Key;
  private inventoryUI: InventoryUI | null = null;
  private inventoryManager!: InventoryManager;

  constructor() {
    super({ key: SCENES.TOWN_OUTDOOR });
    // 初始化背包管理器（单例）
    this.inventoryManager = createInventoryManager('player_001');
  }

  create(): void {
    // ⭐ 关键修复：显式重置isTransitioning，确保create()时状态正确
    // Phaser场景reuse时，类字段可能保留旧值
    this.isTransitioning = false;

    // 初始化事件系统
    this.eventBus = EventBus.getInstance();
    this.gameStateBridge = GameStateBridge.getInstance();
    this.tutorialManager = TutorialManager.getInstance();  // S13.4

    this.eventBus.emit(GameEvents.SCENE_CREATE, { sceneName: SCENES.TOWN_OUTDOOR });

    // S13.4: 检查是否应该显示场景提示
    this.checkAndShowSceneTip();

    // ⭐ 关键修复：订阅wake事件，确保从sleep状态唤醒时重置isTransitioning
    this.events.on('wake', () => {
      this.isTransitioning = false;
      this.gameStateBridge.updateCurrentScene(SCENES.TOWN_OUTDOOR);
      console.log('[TownOutdoorScene] wake event received, isTransitioning reset to false');
    });

    // Phase 1.5: 加载背景图
    this.createBackground();

    // 创建地图数据（基于可行走瓦片）
    this.mapData = {
      width: TOWN_OUTDOOR_CONFIG.width,
      height: TOWN_OUTDOOR_CONFIG.height,
      walkableTiles: TOWN_OUTDOOR_CONFIG.walkableTiles
    };

    // 更新状态桥接器
    this.gameStateBridge.updateCurrentScene(SCENES.TOWN_OUTDOOR);
    this.gameStateBridge.updateSceneSize({
      width: this.mapData.width,
      height: this.mapData.height
    });

    // 创建玩家
    this.createPlayer();

    // Phase 1.5: 创建碰撞检测（基于可行走瓦片边界）
    this.createWalkableCollision();

    // 设置相机
    this.setupCamera();

    // 设置输入
    this.setupInput();

    // 初始化场景管理器和门检测
    this.sceneManager = new SceneManager(this);
    this.collectDoorTiles();

    // 添加固定UI提示（setScrollFactor(0)使其不跟随相机）
    this.add.text(10, 10, '百草镇 - 室外 (Phase 1.5)', {
      fontSize: '16px',
      color: '#ffffff',
      backgroundColor: '#000000aa',
      padding: { x: 8, y: 4 }
    }).setScrollFactor(0);

    this.add.text(10, 40, '走到门前按空格键进入', {
      fontSize: '12px',
      color: '#aaaaaa'
    }).setScrollFactor(0);

    this.playerTileText = this.add.text(10, 70, '', {
      fontSize: '12px',
      color: '#ffff00',
      backgroundColor: '#000000aa',
      padding: { x: 4, y: 2 }
    }).setScrollFactor(0);

    this.eventBus.emit(GameEvents.SCENE_READY, { sceneName: SCENES.TOWN_OUTDOOR });

    // Phase 1.5: 暴露地图配置到全局对象，供测试代码访问
    // 游戏启动完成，进入主场景
    (window as any).__GAME_READY__ = true;
    this.gameStateBridge.exposeMapConfig();

    // 标记场景已准备好（供测试等待）
    (window as any).__SCENE_READY__ = true;
  }

  /**
   * Phase 1.5: 加载背景图
   */
  private createBackground(): void {
    const config = TOWN_OUTDOOR_CONFIG;
    const mapPixelWidth = config.width * TILE_SIZE;
    const mapPixelHeight = config.height * TILE_SIZE;

    this.background = this.add.image(
      mapPixelWidth / 2,
      mapPixelHeight / 2,
      'town_background'
    );

    this.background.setDisplaySize(mapPixelWidth, mapPixelHeight);
    this.background.setOrigin(0.5);
    this.background.setDepth(0);  // 背景层
  }

  /**
   * Phase 1.5: 创建碰撞检测
   * 简化方案：不创建物理碰撞墙，而是在update中检查位置是否可行走
   */
  private createWalkableCollision(): void {
    // Phase 1.5: 使用位置检查代替物理碰撞
    // 玩家移动时会在update中检查目标位置是否可行走
  }

  /**
   * Phase 1.5改进: 检查玩家能否向指定方向移动
   * 使用更宽松的检测，检查前进方向的多个点
   */
  private canMoveInDirection(direction: { x: number; y: number }): boolean {
    const checkDistance = TILE_SIZE * 0.5;  // 检查前方半个瓦片距离

    // 计算目标位置
    let targetX = this.player.x;
    let targetY = this.player.y;

    if (direction.x !== 0) {
      targetX += direction.x * checkDistance;
    }
    if (direction.y !== 0) {
      targetY += direction.y * checkDistance;
    }

    // 检查目标位置及其周围的可行走情况
    const tileX = Math.floor(targetX / TILE_SIZE);
    const tileY = Math.floor(targetY / TILE_SIZE);

    // 检查目标瓦片和相邻瓦片（允许滑墙）
    const positionsToCheck = [
      `${tileX},${tileY}`,
      `${tileX + direction.x},${tileY}`,
      `${tileX},${tileY + direction.y}`
    ];

    for (const key of positionsToCheck) {
      if (this.mapData.walkableTiles.has(key)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Phase 1.5修复: 确保玩家当前位置在可行走区域
   * 改进：只在玩家确实进入不可行走瓦片中心时才推回，避免边缘误判
   */
  private enforceWalkablePosition(): void {
    const tileX = Math.floor(this.player.x / TILE_SIZE);
    const tileY = Math.floor(this.player.y / TILE_SIZE);
    const tileKey = `${tileX},${tileY}`;

    // 如果当前瓦片可行走，无需处理
    if (this.mapData.walkableTiles.has(tileKey)) {
      return;
    }

    // 当前瓦片不可行走，检查是否是边缘情况
    // 计算玩家在瓦片内的相对位置
    const tileCenterX = tileX * TILE_SIZE + TILE_SIZE / 2;
    const tileCenterY = tileY * TILE_SIZE + TILE_SIZE / 2;
    const distanceFromCenter = Math.sqrt(
      Math.pow(this.player.x - tileCenterX, 2) +
      Math.pow(this.player.y - tileCenterY, 2)
    );

    // 如果玩家离瓦片中心较远（在边缘），检查相邻瓦片是否可行走
    // 这种情况可能是正常的边缘移动，不推回
    if (distanceFromCenter > TILE_SIZE * 0.3) {
      // 检查相邻瓦片是否有可行走的
      const adjacentTiles = [
        { dx: 0, dy: -1 }, { dx: 0, dy: 1 },
        { dx: -1, dy: 0 }, { dx: 1, dy: 0 }
      ];

      for (const adj of adjacentTiles) {
        const adjKey = `${tileX + adj.dx},${tileY + adj.dy}`;
        if (this.mapData.walkableTiles.has(adjKey)) {
          // 玩家在可行走瓦片的边缘，这是正常的，不推回
          return;
        }
      }
    }

    // 确实进入了不可行走区域，需要推回
    // 寻找最近的可行走瓦片
    const directions = [
      { dx: 0, dy: -1 }, { dx: 0, dy: 1 },
      { dx: -1, dy: 0 }, { dx: 1, dy: 0 },
      { dx: -1, dy: -1 }, { dx: 1, dy: -1 },
      { dx: -1, dy: 1 }, { dx: 1, dy: 1 },
    ];

    for (const dir of directions) {
      const checkKey = `${tileX + dir.dx},${tileY + dir.dy}`;
      if (this.mapData.walkableTiles.has(checkKey)) {
        const newX = (tileX + dir.dx) * TILE_SIZE + TILE_SIZE / 2;
        const newY = (tileY + dir.dy) * TILE_SIZE + TILE_SIZE / 2;
        this.player.setPosition(newX, newY);
        this.player.stop();

        this.eventBus.emit(GameEvents.PLAYER_COLLIDE, {
          collisionWith: 'unwalkable_correction',
          position: { x: newX, y: newY }
        });
        return;
      }
    }

    // 如果周围没有可行走瓦片，推回到出生点
    const spawnX = TOWN_OUTDOOR_CONFIG.playerSpawnPoint.x * TILE_SIZE + TILE_SIZE / 2;
    const spawnY = TOWN_OUTDOOR_CONFIG.playerSpawnPoint.y * TILE_SIZE + TILE_SIZE / 2;
    this.player.setPosition(spawnX, spawnY);
    this.player.stop();
  }

  private collectDoorTiles(): void {
    for (const doorConfig of TOWN_OUTDOOR_CONFIG.doors) {
      const sceneMap: Record<string, string> = {
        'ClinicScene': SCENES.CLINIC,
        'GardenScene': SCENES.GARDEN,
        'HomeScene': SCENES.HOME
      };

      this.doorTiles.set(`${doorConfig.tileX},${doorConfig.tileY}`, {
        targetScene: sceneMap[doorConfig.targetScene] || doorConfig.targetScene,
        spawnPoint: doorConfig.spawnPoint,
        indoorSpawnPoint: doorConfig.indoorSpawnPoint
      });
    }
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
      const configSpawn = TOWN_OUTDOOR_CONFIG.playerSpawnPoint;
      spawnX = configSpawn.x * TILE_SIZE + TILE_SIZE / 2;
      spawnY = configSpawn.y * TILE_SIZE + TILE_SIZE / 2;
    }

    // Phase 1.5: 更新物理世界边界
    const mapPixelWidth = this.mapData.width * TILE_SIZE;
    const mapPixelHeight = this.mapData.height * TILE_SIZE;
    this.physics.world.setBounds(0, 0, mapPixelWidth, mapPixelHeight);

    this.player = new Player({
      scene: this,
      x: spawnX,
      y: spawnY
    });
    this.player.setDepth(10);  // 玩家层（高于背景）

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
      // Phase 2.5 全局背包系统: B键打开背包
      this.inventoryKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.B);
      this.input.keyboard.addKeys('W,A,S,D');
    }
  }

  update(): void {
    if (!this.player || !this.cursors) return;

    // Phase 1.5修复: 确保玩家位置始终在可行走区域
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

    // Phase 1.5改进: 只在有按键时设置velocity，无按键时让物理引擎自然减速
    // 不再每帧调用stop()清零velocity
    if (direction.x !== 0 || direction.y !== 0) {
      // 有按键按下
      if (this.canMoveInDirection(direction)) {
        this.player.move(direction);
      } else {
        // 尝试只沿一个轴移动（滑墙效果）
        if (direction.x !== 0 && this.canMoveInDirection({ x: direction.x, y: 0 })) {
          this.player.move({ x: direction.x, y: 0 });
        } else if (direction.y !== 0 && this.canMoveInDirection({ x: 0, y: direction.y })) {
          this.player.move({ x: 0, y: direction.y });
        } else {
          // 无法移动，停止
          this.player.stop();
        }
      }
    }
    // 无按键时不调用stop()，让物理引擎自然处理
    // 玩家会因为碰撞边界或enforceWalkablePosition而停止

    this.player.updatePositionTracking();

    // 更新状态桥接器
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    const tileX = Math.floor(this.player.x / TILE_SIZE);
    const tileY = Math.floor(this.player.y / TILE_SIZE);

    this.gameStateBridge.updatePlayerState({
      x: this.player.x,
      y: this.player.y,
      tileX: tileX,
      tileY: tileY,
      speed: this.player.speed,
      velocity: { x: body.velocity.x, y: body.velocity.y }
    });

    // 更新调试显示
    const isWalkableTile = isWalkable(tileX, tileY);
    const doorKey = `${tileX},${tileY}`;
    const isOnDoor = this.doorTiles.has(doorKey);

    // Phase 1.5修复: 检查是否在门附近（相邻瓦片）
    const adjacentDoorPositions = [
      { x: tileX, y: tileY - 1 },
      { x: tileX, y: tileY + 1 },
      { x: tileX - 1, y: tileY },
      { x: tileX + 1, y: tileY },
    ];
    const isNearDoor = adjacentDoorPositions.some(pos => this.doorTiles.has(`${pos.x},${pos.y}`));

    this.playerTileText.setText(
      `位置: (${tileX}, ${tileY}) ${isWalkableTile ? '可行走' : '不可行走'}${isOnDoor ? ' [门]' : (isNearDoor ? ' [门附近]' : '')}`
    );

    // 检测门交互
    if (Phaser.Input.Keyboard.JustDown(this.spaceKey) && !this.isTransitioning) {
      const tilePos = this.player.getTilePosition();
      const doorInfo = this.sceneManager.checkDoorInteraction(
        tilePos.x,
        tilePos.y,
        this.doorTiles
      );

      if (doorInfo) {
        this.isTransitioning = true;
        // 进入室内时，使用室内出生点
        this.sceneManager.changeScene(doorInfo.targetScene, doorInfo.indoorSpawnPoint);
      }
    }

    // Phase 2.5 全局背包系统: B键打开背包
    if (Phaser.Input.Keyboard.JustDown(this.inventoryKey)) {
      this.toggleInventory();
    }
  }

  shutdown(): void {
    // ⭐ 关键修复：重置 isTransitioning 状态，确保再次进入时能触发门交互
    this.isTransitioning = false;

    // S13.4: 清理场景提示UI
    if (this.sceneTipUI) {
      this.sceneTipUI.destroy();
      this.sceneTipUI = null;
    }

    // Phase 2.5 全局背包系统: 清理背包UI
    if (this.inventoryUI) {
      this.inventoryUI.destroy();
      this.inventoryUI = null;
    }

    this.eventBus.emit(GameEvents.SCENE_DESTROY, { sceneName: SCENES.TOWN_OUTDOOR });
  }

  // ⭐ 关键修复：当场景从sleep状态唤醒时，重置isTransitioning
  // Phaser场景生命周期：sleep → wake() 而非 shutdown() → create()
  wake(): void {
    this.isTransitioning = false;
    // 更新GameStateBridge，确保测试能正确检测场景
    this.gameStateBridge.updateCurrentScene(SCENES.TOWN_OUTDOOR);
    console.log('[TownOutdoorScene] wake() called, isTransitioning reset to false');
  }

  /**
   * S13.4: 检查并显示场景提示
   */
  private checkAndShowSceneTip(): void {
    const sceneKey = SCENES.TOWN_OUTDOOR;

    if (this.tutorialManager.shouldShowSceneTip(sceneKey)) {
      // 获取场景提示配置
      const tipConfig = this.tutorialManager.getSceneTipInfo(sceneKey);

      if (tipConfig) {
        console.log(`[TownOutdoorScene] Showing scene tip for ${sceneKey}`);

        // 创建场景提示UI
        this.sceneTipUI = createSceneTipUI(
          this,
          tipConfig,
          () => {
            // onClose: 提示关闭后标记已显示
            this.tutorialManager.markSceneTipShown(sceneKey);
            this.sceneTipUI = null;
            console.log(`[TownOutdoorScene] Scene tip shown and marked for ${sceneKey}`);
          }
        );
      }
    }
  }

  /**
   * Phase 2.5 全局背包系统: 切换背包显示
   */
  private toggleInventory(): void {
    if (!this.inventoryUI) {
      // 创建背包UI
      this.inventoryUI = createInventoryUI(this, () => {
        console.log('[TownOutdoorScene] Inventory closed');
      });
      this.inventoryManager.exposeToWindow();
      console.log('[TownOutdoorScene] Inventory UI created');
    }

    if (this.inventoryUI.isShowing()) {
      this.inventoryUI.hide();
    } else {
      this.inventoryUI.show();
    }
  }
}