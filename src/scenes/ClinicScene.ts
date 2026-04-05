// src/scenes/ClinicScene.ts
import Phaser from 'phaser';
import { SCENES, TILE_SIZE } from '../data/constants';
import { Player } from '../entities/Player';

export class ClinicScene extends Phaser.Scene {
  private player!: Player;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private spaceKey!: Phaser.Input.Keyboard.Key;
  private isTransitioning: boolean = false;
  private walls!: Phaser.Physics.Arcade.StaticGroup;

  constructor() {
    super({ key: SCENES.CLINIC });
  }

  create(): void {
    // 创建简单的室内地图
    this.createRoom();

    // 创建玩家（使用registry中的出生点）
    this.createPlayer();

    // 创建墙壁碰撞
    this.createWallCollisions(15, 12);

    // 添加场景UI
    this.add.text(10, 10, '青木诊所', {
      fontSize: '16px',
      color: '#ffffff',
      backgroundColor: '#000000aa',
      padding: { x: 8, y: 4 }
    });

    // 返回提示
    this.add.text(10, 40, '按空格键返回室外', {
      fontSize: '12px',
      color: '#aaaaaa'
    });

    // 设置输入
    this.setupInput();
  }

  private createRoom(): void {
    const roomWidth = 15;
    const roomHeight = 12;

    // 填充地板
    for (let y = 0; y < roomHeight; y++) {
      for (let x = 0; x < roomWidth; x++) {
        // 墙壁
        if (x === 0 || x === roomWidth - 1 || y === 0 || y === roomHeight - 1) {
          this.add.sprite(
            x * TILE_SIZE + TILE_SIZE / 2,
            y * TILE_SIZE + TILE_SIZE / 2,
            'wall'
          );
        } else {
          // 地板（用路径纹理代替）
          this.add.sprite(
            x * TILE_SIZE + TILE_SIZE / 2,
            y * TILE_SIZE + TILE_SIZE / 2,
            'path'
          );
        }
      }
    }

    // 门口
    const doorX = Math.floor(roomWidth / 2);
    this.add.sprite(
      doorX * TILE_SIZE + TILE_SIZE / 2,
      (roomHeight - 1) * TILE_SIZE + TILE_SIZE / 2,
      'door'
    );
  }

  private createPlayer(): void {
    let spawnX: number;
    let spawnY: number;

    // 从registry获取出生点
    const registrySpawnPoint = this.registry.get('spawnPoint');
    if (registrySpawnPoint) {
      // 如果有出生点，玩家应该在室内入口处
      // 室内入口在底部中间，对应doorX=7 (15/2=7)
      spawnX = 7 * TILE_SIZE + TILE_SIZE / 2;
      spawnY = 10 * TILE_SIZE + TILE_SIZE / 2;  // 在门口上方一格
      // 清除出生点
      this.registry.remove('spawnPoint');
    } else {
      // 默认位置：房间中心
      spawnX = Math.floor(15 / 2) * TILE_SIZE + TILE_SIZE / 2;
      spawnY = Math.floor(12 / 2) * TILE_SIZE + TILE_SIZE / 2;
    }

    this.player = new Player({
      scene: this,
      x: spawnX,
      y: spawnY
    });
  }

  private createWallCollisions(roomWidth: number, roomHeight: number): void {
    this.walls = this.physics.add.staticGroup();

    const doorX = Math.floor(roomWidth / 2);  // Door position
    const doorY = roomHeight - 1;             // Bottom wall

    for (let y = 0; y < roomHeight; y++) {
      for (let x = 0; x < roomWidth; x++) {
        // Skip door position
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

    // 添加玩家与墙壁的碰撞
    this.physics.add.collider(this.player, this.walls);
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

    // 检测空格键返回 - 使用JustDown防止多次触发
    if (Phaser.Input.Keyboard.JustDown(this.spaceKey) && !this.isTransitioning) {
      this.isTransitioning = true;
      // 设置返回时的出生点（诊所门外）
      this.registry.set('spawnPoint', { x: 7, y: 10 });
      this.scene.start(SCENES.TOWN_OUTDOOR);
    }
  }
}