// src/scenes/HomeScene.ts
/**
 * 玩家之家场景
 *
 * 使用占位符瓦片渲染（Phase 1）
 * Phase 1.5 将替换为真实UI素材
 */
import Phaser from 'phaser';
import { SCENES, TILE_SIZE } from '../data/constants';
import { Player } from '../entities/Player';
import { EventBus, GameEvents } from '../systems/EventBus';
import { GameStateBridge } from '../utils/GameStateBridge';

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

  constructor() {
    super({ key: SCENES.HOME });
  }

  create(): void {
    this.eventBus = EventBus.getInstance();
    this.gameStateBridge = GameStateBridge.getInstance();

    this.eventBus.emit(GameEvents.SCENE_CREATE, { sceneName: SCENES.HOME });

    this.gameStateBridge.updateCurrentScene(SCENES.HOME);
    this.gameStateBridge.updateSceneSize({ width: this.roomWidth, height: this.roomHeight });

    this.createRoom();
    this.createPlayer();
    this.createWallCollisions(this.roomWidth, this.roomHeight);
    this.addUI();
    this.setupInput();

    this.eventBus.emit(GameEvents.SCENE_READY, { sceneName: SCENES.HOME });
  }

  private createRoom(): void {
    for (let y = 0; y < this.roomHeight; y++) {
      for (let x = 0; x < this.roomWidth; x++) {
        if (x === 0 || x === this.roomWidth - 1 || y === 0 || y === this.roomHeight - 1) {
          this.add.sprite(
            x * TILE_SIZE + TILE_SIZE / 2,
            y * TILE_SIZE + TILE_SIZE / 2,
            'wall'
          );
        } else {
          this.add.sprite(
            x * TILE_SIZE + TILE_SIZE / 2,
            y * TILE_SIZE + TILE_SIZE / 2,
            'path'
          );
        }
      }
    }

    // 厨房区域标记
    this.add.rectangle(3 * TILE_SIZE, 3 * TILE_SIZE, TILE_SIZE * 2, TILE_SIZE, 0xa0522d);
    this.add.text(2 * TILE_SIZE, 2.5 * TILE_SIZE, '🍳', { fontSize: '20px' });

    // 书房区域标记
    this.add.rectangle(9 * TILE_SIZE, 3 * TILE_SIZE, TILE_SIZE * 2, TILE_SIZE, 0x8b4513);
    this.add.text(8 * TILE_SIZE, 2.5 * TILE_SIZE, '📚', { fontSize: '20px' });

    // 卧室区域标记
    this.add.rectangle(6 * TILE_SIZE, 7 * TILE_SIZE, TILE_SIZE * 2, TILE_SIZE, 0x4a3728);
    this.add.text(5 * TILE_SIZE, 6.5 * TILE_SIZE, '🛏️', { fontSize: '20px' });

    const doorX = Math.floor(this.roomWidth / 2);
    this.add.sprite(
      doorX * TILE_SIZE + TILE_SIZE / 2,
      (this.roomHeight - 1) * TILE_SIZE + TILE_SIZE / 2,
      'door'
    );
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

    this.player = new Player({
      scene: this,
      x: spawnX,
      y: spawnY
    });

    this.gameStateBridge.updatePlayerState({
      x: this.player.x,
      y: this.player.y,
      tileX: Math.floor(this.player.x / TILE_SIZE),
      tileY: Math.floor(this.player.y / TILE_SIZE),
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
          const wall = this.walls.create(
            x * TILE_SIZE + TILE_SIZE / 2,
            y * TILE_SIZE + TILE_SIZE / 2,
            ''
          );
          wall.setVisible(false);
          wall.body?.setSize(TILE_SIZE, TILE_SIZE);
        }
      }
    }

    this.physics.add.collider(this.player, this.walls);
  }

  private addUI(): void {
    this.add.text(10, 10, '玩家之家', {
      fontSize: '16px',
      color: '#ffffff',
      backgroundColor: '#000000aa',
      padding: { x: 8, y: 4 }
    });

    this.add.text(10, 40, '按空格键返回室外', {
      fontSize: '12px',
      color: '#aaaaaa'
    });
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
      tileX: Math.floor(this.player.x / TILE_SIZE),
      tileY: Math.floor(this.player.y / TILE_SIZE),
      speed: this.player.speed,
      velocity: { x: body.velocity.x, y: body.velocity.y }
    });

    if (Phaser.Input.Keyboard.JustDown(this.spaceKey) && !this.isTransitioning) {
      this.eventBus.emit(GameEvents.SCENE_SWITCH, {
        from: SCENES.HOME,
        to: SCENES.TOWN_OUTDOOR
      });

      this.isTransitioning = true;
      this.registry.set('spawnPoint', { x: 18, y: 20 });
      this.scene.start(SCENES.TOWN_OUTDOOR);
    }
  }

  shutdown(): void {
    this.eventBus.emit(GameEvents.SCENE_DESTROY, { sceneName: SCENES.HOME });
  }
}