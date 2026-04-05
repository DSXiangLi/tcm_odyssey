// src/scenes/TownOutdoorScene.ts
import Phaser from 'phaser';
import { SCENES, TILE_SIZE } from '../data/constants';
import { Player } from '../entities/Player';
import { SceneManager, DoorInfo } from '../systems/SceneManager';

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
  private player!: Player;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private mapData!: MapData;
  private sceneManager!: SceneManager;
  private doorTiles: Map<string, DoorInfo> = new Map();
  private spaceKey!: Phaser.Input.Keyboard.Key;
  private isTransitioning: boolean = false;
  private walls!: Phaser.Physics.Arcade.StaticGroup;

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

    // 创建墙壁碰撞
    this.createWallCollisions();

    // 设置相机
    this.setupCamera();

    // 设置输入
    this.setupInput();

    // 初始化场景管理器和门检测
    this.sceneManager = new SceneManager(this);
    this.collectDoorTiles();

    // 添加场景名称提示
    this.add.text(10, 10, '百草镇 - 室外', {
      fontSize: '16px',
      color: '#ffffff',
      backgroundColor: '#000000aa',
      padding: { x: 8, y: 4 }
    });

    // 添加交互提示
    this.add.text(10, 40, '走到门前按空格键进入', {
      fontSize: '12px',
      color: '#aaaaaa'
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

  private collectDoorTiles(): void {
    // 门目标到实际场景键的映射
    const sceneMap: Record<string, string> = {
      'clinic': SCENES.CLINIC,
      'garden': SCENES.GARDEN,
      'home': SCENES.HOME
    };

    // 每个建筑的门位置和对应的出生点（当从建筑返回时，玩家应该出现在门外）
    const buildingSpawnPoints: Record<string, { x: number; y: number }> = {
      'clinic': { x: 7, y: 10 },   // 诊所门外
      'garden': { x: 33, y: 10 },  // 药园门外
      'home': { x: 6, y: 28 }      // 家门外
    };

    for (let y = 0; y < this.mapData.height; y++) {
      for (let x = 0; x < this.mapData.width; x++) {
        const tile = this.mapData.tiles[y][x];
        if (tile.type === 'door' && tile.properties?.target) {
          const targetKey = tile.properties.target as string;
          const mappedScene = sceneMap[targetKey] || targetKey;
          const spawnPoint = buildingSpawnPoints[targetKey] || { x: 7, y: 10 };

          this.doorTiles.set(`${x},${y}`, {
            targetScene: mappedScene,
            spawnPoint: spawnPoint
          });
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
    // 从registry获取出生点，如果没有则使用默认位置（地图中心）
    let spawnX: number;
    let spawnY: number;

    const registrySpawnPoint = this.registry.get('spawnPoint');
    if (registrySpawnPoint) {
      spawnX = registrySpawnPoint.x * TILE_SIZE + TILE_SIZE / 2;
      spawnY = registrySpawnPoint.y * TILE_SIZE + TILE_SIZE / 2;
      // 清除出生点，避免下次进入时仍使用旧值
      this.registry.remove('spawnPoint');
    } else {
      spawnX = Math.floor(this.mapData.width / 2) * TILE_SIZE + TILE_SIZE / 2;
      spawnY = Math.floor(this.mapData.height / 2) * TILE_SIZE + TILE_SIZE / 2;
    }

    this.player = new Player({
      scene: this,
      x: spawnX,
      y: spawnY
    });
  }

  private createWallCollisions(): void {
    this.walls = this.physics.add.staticGroup();

    for (let y = 0; y < this.mapData.height; y++) {
      for (let x = 0; x < this.mapData.width; x++) {
        const tile = this.mapData.tiles[y][x];
        if (tile.type === 'wall') {
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

      // 添加WASD支持
      this.input.keyboard.addKeys('W,A,S,D');
    }
  }

  update(): void {
    if (!this.player || !this.cursors) return;

    const direction = { x: 0, y: 0 };

    // 方向键控制
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

    // 检测门交互（空格键）- 使用JustDown防止多次触发
    if (Phaser.Input.Keyboard.JustDown(this.spaceKey) && !this.isTransitioning) {
      const tilePos = this.player.getTilePosition();
      const doorInfo = this.sceneManager.checkDoorInteraction(
        tilePos.x,
        tilePos.y,
        this.doorTiles
      );

      if (doorInfo) {
        this.isTransitioning = true;
        this.sceneManager.changeScene(doorInfo.targetScene, doorInfo.spawnPoint);
      }
    }
  }
}