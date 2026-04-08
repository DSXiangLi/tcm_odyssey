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

  constructor() {
    super({ key: SCENES.TOWN_OUTDOOR });
  }

  create(): void {
    // 初始化事件系统
    this.eventBus = EventBus.getInstance();
    this.gameStateBridge = GameStateBridge.getInstance();

    this.eventBus.emit(GameEvents.SCENE_CREATE, { sceneName: SCENES.TOWN_OUTDOOR });

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
    this.gameStateBridge.exposeMapConfig();
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
   * 检查目标位置是否可行走
   */
  private canMoveTo(x: number, y: number): boolean {
    const tileX = Math.floor(x / TILE_SIZE);
    const tileY = Math.floor(y / TILE_SIZE);
    return this.mapData.walkableTiles.has(`${tileX},${tileY}`);
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
        spawnPoint: doorConfig.spawnPoint
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
      this.input.keyboard.addKeys('W,A,S,D');
    }
  }

  update(): void {
    if (!this.player || !this.cursors) return;

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

    // Phase 1.5: 检查目标位置是否可行走
    if (direction.x !== 0 || direction.y !== 0) {
      // 计算预测位置
      let velocityX = direction.x * this.player.speed;
      let velocityY = direction.y * this.player.speed;

      // 对角线移动标准化
      if (velocityX !== 0 && velocityY !== 0) {
        velocityX *= 0.707;
        velocityY *= 0.707;
      }

      // 预测下一帧位置（使用固定的deltaTime约16ms）
      const predictedX = this.player.x + velocityX * 0.016;
      const predictedY = this.player.y + velocityY * 0.016;

      // 检查预测位置是否可行走
      if (this.canMoveTo(predictedX, predictedY)) {
        this.player.move(direction);
      } else {
        // 尝试只沿一个轴移动（滑墙效果）
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
    this.playerTileText.setText(
      `位置: (${tileX}, ${tileY}) ${isWalkableTile ? '可行走' : '不可行走'}${isOnDoor ? ' [门]' : ''}`
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
        this.eventBus.emit(GameEvents.DOOR_INTERACT, {
          from: SCENES.TOWN_OUTDOOR,
          to: doorInfo.targetScene,
          doorPosition: tilePos
        });

        this.eventBus.emit(GameEvents.SCENE_SWITCH, {
          from: SCENES.TOWN_OUTDOOR,
          to: doorInfo.targetScene
        });

        this.isTransitioning = true;
        this.sceneManager.changeScene(doorInfo.targetScene, doorInfo.spawnPoint);
      }
    }
  }

  shutdown(): void {
    this.eventBus.emit(GameEvents.SCENE_DESTROY, { sceneName: SCENES.TOWN_OUTDOOR });
  }
}