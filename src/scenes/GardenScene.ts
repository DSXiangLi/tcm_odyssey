// src/scenes/GardenScene.ts
import Phaser from 'phaser';
import { SCENES, TILE_SIZE } from '../data/constants';
import { Player } from '../entities/Player';

export class GardenScene extends Phaser.Scene {
  private player!: Player;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private spaceKey!: Phaser.Input.Keyboard.Key;
  private isTransitioning: boolean = false;

  constructor() {
    super({ key: SCENES.GARDEN });
  }

  create(): void {
    this.createRoom();
    this.createPlayer();
    this.addUI();
    this.setupInput();
  }

  private createRoom(): void {
    const roomWidth = 20;
    const roomHeight = 15;

    for (let y = 0; y < roomHeight; y++) {
      for (let x = 0; x < roomWidth; x++) {
        if (x === 0 || x === roomWidth - 1 || y === 0 || y === roomHeight - 1) {
          this.add.sprite(
            x * TILE_SIZE + TILE_SIZE / 2,
            y * TILE_SIZE + TILE_SIZE / 2,
            'wall'
          );
        } else {
          this.add.sprite(
            x * TILE_SIZE + TILE_SIZE / 2,
            y * TILE_SIZE + TILE_SIZE / 2,
            'grass'
          );
        }
      }
    }

    // 药田占位（绿色方块）
    for (let i = 0; i < 4; i++) {
      const plot = this.add.rectangle(
        4 * TILE_SIZE + i * 3 * TILE_SIZE,
        6 * TILE_SIZE,
        TILE_SIZE * 2,
        TILE_SIZE * 2,
        0x2d5a27
      );
      plot.setStrokeStyle(2, 0x4a7c59);
    }

    // 门
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

    const registrySpawnPoint = this.registry.get('spawnPoint');
    if (registrySpawnPoint) {
      spawnX = 10 * TILE_SIZE + TILE_SIZE / 2;
      spawnY = 13 * TILE_SIZE + TILE_SIZE / 2;
      this.registry.remove('spawnPoint');
    } else {
      spawnX = Math.floor(20 / 2) * TILE_SIZE + TILE_SIZE / 2;
      spawnY = Math.floor(15 / 2) * TILE_SIZE + TILE_SIZE / 2;
    }

    this.player = new Player({
      scene: this,
      x: spawnX,
      y: spawnY
    });
  }

  private addUI(): void {
    this.add.text(10, 10, '老张药园', {
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

    // 检测空格键返回 - 使用JustDown防止多次触发
    if (Phaser.Input.Keyboard.JustDown(this.spaceKey) && !this.isTransitioning) {
      this.isTransitioning = true;
      // 设置返回时的出生点（药园门外）
      this.registry.set('spawnPoint', { x: 12, y: 15 });
      this.scene.start(SCENES.TOWN_OUTDOOR);
    }
  }
}