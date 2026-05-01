// src/scenes/HomeScene.ts
/**
 * 玩家之家场景
 *
 * 使用占位符瓦片渲染（Phase 1）
 * Phase 1.5 将替换为真实UI素材
 *
 * Phase 2.5 全局背包系统: 添加B键背包功能
 * 视口放大适配: 地图居中显示
 */
import Phaser from 'phaser';
import { SCENES, TILE_SIZE } from '../data/constants';
import { Player } from '../entities/Player';
import { EventBus, GameEvents } from '../systems/EventBus';
import { GameStateBridge } from '../utils/GameStateBridge';
// Phase 2.5 全局背包系统
import { InventoryManager, createInventoryManager } from '../systems/InventoryManager';
import { showInventoryUI, hideInventoryUI } from '../ui/html/inventory-entry';

export class HomeScene extends Phaser.Scene {
  private player!: Player;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private spaceKey!: Phaser.Input.Keyboard.Key;
  private isTransitioning: boolean = false;
  private walls!: Phaser.Physics.Arcade.StaticGroup;
  private eventBus!: EventBus;
  private gameStateBridge!: GameStateBridge;
  private roomWidth: number = 12;
  private roomHeight: number = 10;
  // 地图居中偏移量（当视口 > 地图时）
  private mapOffsetX: number = 0;
  private mapOffsetY: number = 0;
  // Phase 2.5 全局背包系统
  private inventoryKey!: Phaser.Input.Keyboard.Key;
  private inventoryCleanup: (() => void) | null = null;
  private inventoryManager!: InventoryManager;

  constructor() {
    super({ key: SCENES.HOME });
    // 初始化背包管理器（单例）
    this.inventoryManager = createInventoryManager('player_001');
  }

  create(): void {
    // ⭐ 关键修复：显式重置isTransitioning，确保create()时状态正确
    this.isTransitioning = false;

    this.eventBus = EventBus.getInstance();
    this.gameStateBridge = GameStateBridge.getInstance();

    this.eventBus.emit(GameEvents.SCENE_CREATE, { sceneName: SCENES.HOME });

    // ⭐ 关键修复：订阅wake事件，确保从sleep状态唤醒时重置isTransitioning
    this.events.on('wake', () => {
      this.isTransitioning = false;
      this.gameStateBridge.updateCurrentScene(SCENES.HOME);
      console.log('[HomeScene] wake event received, isTransitioning reset to false');
    });

    this.gameStateBridge.updateCurrentScene(SCENES.HOME);
    this.gameStateBridge.updateSceneSize({ width: this.roomWidth, height: this.roomHeight });

    // 计算居中偏移量
    const mapPixelWidth = this.roomWidth * TILE_SIZE;
    const mapPixelHeight = this.roomHeight * TILE_SIZE;
    this.mapOffsetX = Math.max(0, (this.scale.width - mapPixelWidth) / 2);
    this.mapOffsetY = Math.max(0, (this.scale.height - mapPixelHeight) / 2);

    this.createRoom();
    this.createPlayer();
    this.createWallCollisions(this.roomWidth, this.roomHeight);
    this.setupCamera();
    this.addUI();
    this.setupInput();

    this.eventBus.emit(GameEvents.SCENE_READY, { sceneName: SCENES.HOME });
    (window as any).__SCENE_READY__ = true;
  }

  private createRoom(): void {
    // 使用容器来存放所有房间元素，便于整体居中
    const roomContainer = this.add.container(this.mapOffsetX, this.mapOffsetY);

    for (let y = 0; y < this.roomHeight; y++) {
      for (let x = 0; x < this.roomWidth; x++) {
        if (x === 0 || x === this.roomWidth - 1 || y === 0 || y === this.roomHeight - 1) {
          const wallSprite = this.add.sprite(
            x * TILE_SIZE + TILE_SIZE / 2,
            y * TILE_SIZE + TILE_SIZE / 2,
            'wall'
          );
          roomContainer.add(wallSprite);
        } else {
          const pathSprite = this.add.sprite(
            x * TILE_SIZE + TILE_SIZE / 2,
            y * TILE_SIZE + TILE_SIZE / 2,
            'path'
          );
          roomContainer.add(pathSprite);
        }
      }
    }

    // 厨房区域标记
    const kitchenRect = this.add.rectangle(3 * TILE_SIZE, 3 * TILE_SIZE, TILE_SIZE * 2, TILE_SIZE, 0xa0522d);
    const kitchenText = this.add.text(2 * TILE_SIZE, 2.5 * TILE_SIZE, '🍳', { fontSize: '20px' });
    roomContainer.add(kitchenRect);
    roomContainer.add(kitchenText);

    // 书房区域标记
    const studyRect = this.add.rectangle(9 * TILE_SIZE, 3 * TILE_SIZE, TILE_SIZE * 2, TILE_SIZE, 0x8b4513);
    const studyText = this.add.text(8 * TILE_SIZE, 2.5 * TILE_SIZE, '📚', { fontSize: '20px' });
    roomContainer.add(studyRect);
    roomContainer.add(studyText);

    // 卧室区域标记
    const bedroomRect = this.add.rectangle(6 * TILE_SIZE, 7 * TILE_SIZE, TILE_SIZE * 2, TILE_SIZE, 0x4a3728);
    const bedroomText = this.add.text(5 * TILE_SIZE, 6.5 * TILE_SIZE, '🛏️', { fontSize: '20px' });
    roomContainer.add(bedroomRect);
    roomContainer.add(bedroomText);

    const doorX = Math.floor(this.roomWidth / 2);
    const doorSprite = this.add.sprite(
      doorX * TILE_SIZE + TILE_SIZE / 2,
      (this.roomHeight - 1) * TILE_SIZE + TILE_SIZE / 2,
      'door'
    );
    roomContainer.add(doorSprite);
  }

  private createPlayer(): void {
    let spawnX: number;
    let spawnY: number;

    const registrySpawnPoint = this.registry.get('spawnPoint');
    if (registrySpawnPoint) {
      spawnX = 6 * TILE_SIZE + TILE_SIZE / 2;
      spawnY = 8 * TILE_SIZE + TILE_SIZE / 2;
      this.registry.remove('spawnPoint');
    } else {
      spawnX = Math.floor(this.roomWidth / 2) * TILE_SIZE + TILE_SIZE / 2;
      spawnY = Math.floor(this.roomHeight / 2) * TILE_SIZE + TILE_SIZE / 2;
    }

    // 玩家位置加上偏移量
    this.player = new Player({
      scene: this,
      x: spawnX + this.mapOffsetX,
      y: spawnY + this.mapOffsetY
    });

    this.gameStateBridge.updatePlayerState({
      x: this.player.x,
      y: this.player.y,
      tileX: Math.floor((this.player.x - this.mapOffsetX) / TILE_SIZE),
      tileY: Math.floor((this.player.y - this.mapOffsetY) / TILE_SIZE),
      speed: this.player.speed,
      velocity: { x: 0, y: 0 }
    });
  }

  private createWallCollisions(roomWidth: number, roomHeight: number): void {
    this.walls = this.physics.add.staticGroup();

    const doorX = Math.floor(roomWidth / 2);
    const doorY = roomHeight - 1;

    for (let y = 0; y < roomHeight; y++) {
      for (let x = 0; x < roomWidth; x++) {
        if (x === doorX && y === doorY) continue;

        if (x === 0 || x === roomWidth - 1 || y === 0 || y === roomHeight - 1) {
          // 墙壁位置加上偏移量
          const wall = this.walls.create(
            x * TILE_SIZE + TILE_SIZE / 2 + this.mapOffsetX,
            y * TILE_SIZE + TILE_SIZE / 2 + this.mapOffsetY,
            ''
          );
          wall.setVisible(false);
          wall.body?.setSize(TILE_SIZE, TILE_SIZE);
        }
      }
    }

    this.physics.add.collider(this.player, this.walls);
  }

  private setupCamera(): void {
    const mapPixelWidth = this.roomWidth * TILE_SIZE;
    const mapPixelHeight = this.roomHeight * TILE_SIZE;

    // 当视口 > 地图时，地图居中显示，不跟随玩家
    const gameWidth = this.scale.width;
    const gameHeight = this.scale.height;

    if (gameWidth > mapPixelWidth || gameHeight > mapPixelHeight) {
      // 相机居中在地图中心
      this.cameras.main.centerOn(
        this.mapOffsetX + mapPixelWidth / 2,
        this.mapOffsetY + mapPixelHeight / 2
      );
    } else {
      // 视口 <= 地图，正常跟随
      this.cameras.main.setBounds(this.mapOffsetX, this.mapOffsetY, mapPixelWidth, mapPixelHeight);
      this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    }
  }

  private addUI(): void {
    // UI元素固定在视口位置，不受相机影响
    const titleText = this.add.text(10, 10, '玩家之家', {
      fontSize: '16px',
      color: '#ffffff',
      backgroundColor: '#000000aa',
      padding: { x: 8, y: 4 }
    });
    titleText.setScrollFactor(0);

    const hintText = this.add.text(10, 40, '按空格键返回室外', {
      fontSize: '12px',
      color: '#aaaaaa'
    });
    hintText.setScrollFactor(0);
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

    if (direction.x !== 0 || direction.y !== 0) {
      this.player.move(direction);
    } else {
      this.player.stop();
    }

    this.player.updatePositionTracking();

    const body = this.player.body as Phaser.Physics.Arcade.Body;
    this.gameStateBridge.updatePlayerState({
      x: this.player.x,
      y: this.player.y,
      tileX: Math.floor((this.player.x - this.mapOffsetX) / TILE_SIZE),
      tileY: Math.floor((this.player.y - this.mapOffsetY) / TILE_SIZE),
      speed: this.player.speed,
      velocity: { x: body.velocity.x, y: body.velocity.y }
    });

    if (Phaser.Input.Keyboard.JustDown(this.spaceKey) && !this.isTransitioning) {
      this.eventBus.emit(GameEvents.SCENE_SWITCH, {
        from: SCENES.HOME,
        to: SCENES.TOWN_OUTDOOR
      });

      this.isTransitioning = true;
      // Phase 1.5: 使用玩家之家门的正确出生点坐标
      this.registry.set('spawnPoint', { x: 61, y: 37 });
      this.scene.start(SCENES.TOWN_OUTDOOR);
    }

    // Phase 2.5 全局背包系统: B键打开背包
    if (Phaser.Input.Keyboard.JustDown(this.inventoryKey)) {
      this.toggleInventory();
    }
  }

  shutdown(): void {
    // ⭐ 关键修复：重置 isTransitioning 状态
    this.isTransitioning = false;

    // Phase 2.5 全局背包系统: 清理背包UI
    if (this.inventoryCleanup) {
      this.inventoryCleanup();
      this.inventoryCleanup = null;
    }

    this.eventBus.emit(GameEvents.SCENE_DESTROY, { sceneName: SCENES.HOME });
  }

  // ⭐ 关键修复：当场景从sleep状态唤醒时，重置isTransitioning
  // Phaser场景生命周期：sleep → wake() 而非 shutdown() → create()
  wake(): void {
    this.isTransitioning = false;
    console.log('[HomeScene] wake() called, isTransitioning reset to false');
  }

  /**
   * Phase 2.5 全局背包系统: 切换背包显示
   */
  private toggleInventory(): void {
    if (!this.inventoryCleanup) {
      // 创建背包UI
      this.inventoryCleanup = showInventoryUI(() => {
        console.log('[HomeScene] Inventory closed');
        this.inventoryCleanup = null;
      });
      this.inventoryManager.exposeToWindow();
      console.log('[HomeScene] Inventory UI created');
    } else {
      // 关闭背包UI
      hideInventoryUI();
      this.inventoryCleanup = null;
    }
  }
}