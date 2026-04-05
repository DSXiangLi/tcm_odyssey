// src/scenes/TownOutdoorScene.ts
import Phaser from 'phaser';
import { SCENES, TILE_SIZE } from '../data/constants';

// 地图数据结构
interface TileData {
  x: number;
  y: number;
  type: 'grass' | 'path' | 'wall' | 'door';
  properties?: Record<string, unknown>;
}

interface MapData {
  width: number;
  height: number;
  tiles: TileData[][];
}

export class TownOutdoorScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private mapData!: MapData;

  constructor() {
    super({ key: SCENES.TOWN_OUTDOOR });
  }

  create(): void {
    // 创建地图数据
    this.mapData = this.createTownMapData();

    // 渲染地图
    this.renderMap();

    // 创建玩家
    this.createPlayer();

    // 设置相机
    this.setupCamera();

    // 设置输入
    this.setupInput();

    // 添加场景名称提示
    this.add.text(10, 10, '百草镇 - 室外', {
      fontSize: '16px',
      color: '#ffffff',
      backgroundColor: '#000000aa',
      padding: { x: 8, y: 4 }
    });
  }

  private createTownMapData(): MapData {
    // 40x30 瓦片的地图
    const width = 40;
    const height = 30;
    const tiles: TileData[][] = [];

    // 填充草地
    for (let y = 0; y < height; y++) {
      tiles[y] = [];
      for (let x = 0; x < width; x++) {
        tiles[y][x] = { x, y, type: 'grass' };
      }
    }

    // 创建中心路径（十字形）
    const centerX = Math.floor(width / 2);
    const centerY = Math.floor(height / 2);

    // 横向路径
    for (let x = 5; x < width - 5; x++) {
      tiles[centerY][x] = { x, y: centerY, type: 'path' };
      tiles[centerY - 1][x] = { x, y: centerY - 1, type: 'path' };
    }

    // 纵向路径
    for (let y = 5; y < height - 5; y++) {
      tiles[y][centerX] = { x: centerX, y, type: 'path' };
      tiles[y][centerX - 1] = { x: centerX - 1, y, type: 'path' };
    }

    // 添加建筑位置（用墙壁表示）
    // 青木诊所（左上）
    this.addBuilding(tiles, 3, 3, 8, 6, 'clinic');

    // 老张药园（右上）
    this.addBuilding(tiles, width - 11, 3, 8, 6, 'garden');

    // 玩家之家（左下）
    this.addBuilding(tiles, 3, height - 9, 6, 6, 'home');

    // 边界墙
    for (let x = 0; x < width; x++) {
      tiles[0][x] = { x, y: 0, type: 'wall' };
      tiles[height - 1][x] = { x, y: height - 1, type: 'wall' };
    }
    for (let y = 0; y < height; y++) {
      tiles[y][0] = { x: 0, y, type: 'wall' };
      tiles[y][width - 1] = { x: width - 1, y, type: 'wall' };
    }

    return { width, height, tiles };
  }

  private addBuilding(
    tiles: TileData[][],
    startX: number,
    startY: number,
    buildingWidth: number,
    buildingHeight: number,
    doorTarget: string
  ): void {
    for (let y = startY; y < startY + buildingHeight; y++) {
      for (let x = startX; x < startX + buildingWidth; x++) {
        if (y >= 0 && y < tiles.length && x >= 0 && x < tiles[0].length) {
          // 门的位置（建筑底部中间）
          if (y === startY + buildingHeight - 1 && x === startX + Math.floor(buildingWidth / 2)) {
            tiles[y][x] = {
              x, y,
              type: 'door',
              properties: { target: doorTarget, interactive: true }
            };
          } else {
            tiles[y][x] = { x, y, type: 'wall' };
          }
        }
      }
    }
  }

  private renderMap(): void {
    for (let y = 0; y < this.mapData.height; y++) {
      for (let x = 0; x < this.mapData.width; x++) {
        const tile = this.mapData.tiles[y][x];
        const texture = tile.type === 'grass' ? 'grass' :
                       tile.type === 'path' ? 'path' :
                       tile.type === 'wall' ? 'wall' : 'door';

        const sprite = this.add.sprite(
          x * TILE_SIZE + TILE_SIZE / 2,
          y * TILE_SIZE + TILE_SIZE / 2,
          texture
        );

        sprite.setDepth(0);
      }
    }
  }

  private createPlayer(): void {
    // 玩家出生在地图中心路径上
    const spawnX = Math.floor(this.mapData.width / 2) * TILE_SIZE + TILE_SIZE / 2;
    const spawnY = Math.floor(this.mapData.height / 2) * TILE_SIZE + TILE_SIZE / 2;

    this.player = this.physics.add.sprite(spawnX, spawnY, 'player');
    this.player.setDepth(1);
    this.player.setCollideWorldBounds(true);

    // 设置玩家碰撞体
    this.player.body?.setSize(TILE_SIZE - 4, TILE_SIZE - 4);
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

      // 添加WASD支持
      this.input.keyboard.addKeys('W,A,S,D');
    }
  }

  update(): void {
    if (!this.player || !this.cursors) return;

    const speed = 150;
    let velocityX = 0;
    let velocityY = 0;

    // 方向键控制
    if (this.cursors.left.isDown || this.input.keyboard?.addKey('A').isDown) {
      velocityX = -speed;
    } else if (this.cursors.right.isDown || this.input.keyboard?.addKey('D').isDown) {
      velocityX = speed;
    }

    if (this.cursors.up.isDown || this.input.keyboard?.addKey('W').isDown) {
      velocityY = -speed;
    } else if (this.cursors.down.isDown || this.input.keyboard?.addKey('S').isDown) {
      velocityY = speed;
    }

    // 对角线移动时标准化速度
    if (velocityX !== 0 && velocityY !== 0) {
      velocityX *= 0.707;
      velocityY *= 0.707;
    }

    this.player.setVelocity(velocityX, velocityY);
  }
}