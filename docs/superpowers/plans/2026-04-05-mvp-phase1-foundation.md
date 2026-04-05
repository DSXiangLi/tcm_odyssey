# 药灵山谷 v3.0 一期MVP实现计划 - Phase 1: 项目框架与核心系统

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 搭建Phaser.js游戏框架，实现瓦片地图系统和玩家移动

**Architecture:** Phaser 3游戏引擎 + Tiled地图编辑器导出JSON + 模块化场景管理

**Tech Stack:** Phaser 3.80+, TypeScript, Vite, Tiled Map Editor

---

## 文件结构规划

```
zhongyi_game_v3/
├── public/
│   ├── assets/
│   │   ├── maps/              # Tiled导出的地图JSON
│   │   │   ├── town-outdoor.json
│   │   │   ├── clinic.json
│   │   │   ├── garden.json
│   │   │   └── home.json
│   │   ├── tiles/             # 瓦片图片
│   │   │   └── tileset.png
│   │   └── sprites/           # 角色精灵图
│   │       └── player.png
├── src/
│   ├── main.ts                # 游戏入口
│   ├── config/
│   │   └── game.config.ts     # Phaser配置
│   ├── scenes/
│   │   ├── BootScene.ts       # 资源加载
│   │   ├── TownOutdoorScene.ts # 室外场景
│   │   ├── ClinicScene.ts     # 青木诊所
│   │   ├── GardenScene.ts     # 老张药园
│   │   └── HomeScene.ts       # 玩家之家
│   ├── entities/
│   │   └── Player.ts          # 玩家角色
│   ├── systems/
│   │   ├── SceneManager.ts    # 场景管理器
│   │   └── InputManager.ts    # 输入管理器
│   └── data/
│       └── constants.ts       # 常量定义
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## Task 1: 项目初始化

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vite.config.ts`
- Create: `index.html`

- [ ] **Step 1: 创建项目目录结构**

```bash
mkdir -p public/assets/{maps,tiles,sprites}
mkdir -p src/{config,scenes,entities,systems,data}
```

- [ ] **Step 2: 创建 package.json**

```json
{
  "name": "yaoling-shangu",
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "phaser": "^3.80.1"
  },
  "devDependencies": {
    "typescript": "^5.4.0",
    "vite": "^5.2.0"
  }
}
```

- [ ] **Step 3: 创建 tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "esModuleInterop": true
  },
  "include": ["src"]
}
```

- [ ] **Step 4: 创建 vite.config.ts**

```typescript
import { defineConfig } from 'vite'

export default defineConfig({
  base: './',
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  }
})
```

- [ ] **Step 5: 创建 index.html**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>药灵山谷</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      background-color: #1a1a2e;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
    }
    #game-container {
      border: 2px solid #4a7c59;
    }
  </style>
</head>
<body>
  <div id="game-container"></div>
  <script type="module" src="/src/main.ts"></script>
</body>
</html>
```

- [ ] **Step 6: 安装依赖**

```bash
npm install
```

- [ ] **Step 7: 验证项目结构**

```bash
ls -la src/
ls -la public/assets/
```

Expected: 目录结构正确创建

- [ ] **Step 8: 提交**

```bash
git add .
git commit -m "chore: 初始化项目结构

- 添加 Phaser 3 + TypeScript + Vite 配置
- 创建项目目录结构"
```

---

## Task 2: 游戏配置与入口文件

**Files:**
- Create: `src/data/constants.ts`
- Create: `src/config/game.config.ts`
- Create: `src/main.ts`

- [ ] **Step 1: 创建常量定义文件**

```typescript
// src/data/constants.ts

// 游戏尺寸
export const GAME_WIDTH = 800;
export const GAME_HEIGHT = 600;

// 瓦片尺寸
export const TILE_SIZE = 32;

// 场景名称
export const SCENES = {
  BOOT: 'BootScene',
  TOWN_OUTDOOR: 'TownOutdoorScene',
  CLINIC: 'ClinicScene',
  GARDEN: 'GardenScene',
  HOME: 'HomeScene'
} as const;

// 玩家移动速度
export const PLAYER_SPEED = 150;

// 资源路径
export const ASSETS = {
  MAPS: {
    TOWN_OUTDOOR: 'maps/town-outdoor',
    CLINIC: 'maps/clinic',
    GARDEN: 'maps/garden',
    HOME: 'maps/home'
  },
  TILES: {
    OUTDOOR: 'tiles/tileset'
  },
  SPRITES: {
    PLAYER: 'sprites/player'
  }
} as const;
```

- [ ] **Step 2: 创建游戏配置文件**

```typescript
// src/config/game.config.ts
import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, SCENES } from '../data/constants';
import { BootScene } from '../scenes/BootScene';
import { TownOutdoorScene } from '../scenes/TownOutdoorScene';

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  parent: 'game-container',
  backgroundColor: '#2d5a27',
  pixelArt: true,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false
    }
  },
  scene: [BootScene, TownOutdoorScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  }
};
```

- [ ] **Step 3: 创建游戏入口文件**

```typescript
// src/main.ts
import Phaser from 'phaser';
import { gameConfig } from './config/game.config';

window.addEventListener('load', () => {
  new Phaser.Game(gameConfig);
});
```

- [ ] **Step 4: 验证 TypeScript 编译**

```bash
npx tsc --noEmit
```

Expected: 无错误

- [ ] **Step 5: 提交**

```bash
git add src/
git commit -m "feat: 添加游戏配置和入口文件

- 定义游戏常量（尺寸、瓦片、场景名称）
- 配置 Phaser 游戏参数
- 创建游戏入口"
```

---

## Task 3: 创建占位瓦片素材

**Files:**
- Create: `public/assets/tiles/tileset.png` (占位图)
- Create: `scripts/generate-placeholder-tiles.js`

- [ ] **Step 1: 创建占位瓦片生成脚本**

```javascript
// scripts/generate-placeholder-tiles.js
// 生成简单的占位瓦片PNG

const fs = require('fs');
const { createCanvas } = require('canvas');

// 如果没有canvas模块，使用纯色占位
// 这里我们创建一个简单的数据URI

const TILE_SIZE = 32;
const COLORS = {
  grass: '#4a7c59',
  path: '#c9b896',
  water: '#4a90a4',
  wall: '#8b4513',
  door: '#654321',
  wood: '#a0522d'
};

// 创建一个简单的32x32 PNG作为占位
// 实际项目中应该使用真实素材

console.log('占位瓦片将在实际开发时替换为真实素材');
console.log('当前使用代码生成的简单色块');
```

- [ ] **Step 2: 创建基础瓦片图集描述文件**

```json
// public/assets/tiles/tileset.json
{
  "name": "tileset",
  "image": "tileset.png",
  "tileWidth": 32,
  "tileHeight": 32,
  "tileCount": 16,
  "columns": 4,
  "tiles": {
    "0": { "type": "grass", "properties": [{ "name": "walkable", "value": true }] },
    "1": { "type": "path", "properties": [{ "name": "walkable", "value": true }] },
    "2": { "type": "water", "properties": [{ "name": "walkable", "value": false }] },
    "3": { "type": "wall", "properties": [{ "name": "walkable", "value": false }] },
    "4": { "type": "door", "properties": [{ "name": "walkable", "value": true }, { "name": "interactive", "value": true }] }
  }
}
```

- [ ] **Step 3: 创建占位瓦片PNG（使用base64）**

创建一个简单的32x128像素图集，包含4种基础瓦片。

暂时跳过实际PNG创建，使用Phaser的graphics在运行时绘制。

- [ ] **Step 4: 提交**

```bash
git add public/assets/
git commit -m "chore: 添加占位瓦片素材描述

- 定义瓦片类型和属性
- 后续替换为真实像素风格素材"
```

---

## Task 4: 实现BootScene资源加载

**Files:**
- Create: `src/scenes/BootScene.ts`

- [ ] **Step 1: 创建BootScene类**

```typescript
// src/scenes/BootScene.ts
import Phaser from 'phaser';
import { SCENES, ASSETS, TILE_SIZE } from '../data/constants';

export class BootScene extends Phaser.Scene {
  private loadingText!: Phaser.GameObjects.Text;
  private progressBar!: Phaser.GameObjects.Graphics;

  constructor() {
    super({ key: SCENES.BOOT });
  }

  preload(): void {
    this.createLoadingUI();
    this.loadAssets();
  }

  private createLoadingUI(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // 加载文字
    this.loadingText = this.add.text(width / 2, height / 2 - 50, '加载中...', {
      fontSize: '24px',
      color: '#ffffff'
    }).setOrigin(0.5);

    // 进度条背景
    this.progressBar = this.add.graphics();

    // 加载进度事件
    this.load.on('progress', (value: number) => {
      this.progressBar.clear();
      this.progressBar.fillStyle(0x4a7c59, 1);
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

  private loadAssets(): void {
    // 加载地图（暂时使用占位）
    // this.load.tilemapTiledJSON(ASSETS.MAPS.TOWN_OUTDOOR, 'assets/maps/town-outdoor.json');

    // 加载瓦片图集（暂时使用占位）
    // this.load.image(ASSETS.TILES.OUTDOOR, 'assets/tiles/tileset.png');

    // 加载玩家精灵（暂时使用占位）
    // this.load.spritesheet(ASSETS.SPRITES.PLAYER, 'assets/sprites/player.png', {
    //   frameWidth: 32,
    //   frameHeight: 48
    // });
  }

  create(): void {
    // 创建占位纹理
    this.createPlaceholderTextures();

    // 跳转到主场景
    this.scene.start(SCENES.TOWN_OUTDOOR);
  }

  private createPlaceholderTextures(): void {
    // 创建草地纹理
    const grassGraphics = this.add.graphics();
    grassGraphics.fillStyle(0x4a7c59);
    grassGraphics.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    grassGraphics.generateTexture('grass', TILE_SIZE, TILE_SIZE);
    grassGraphics.destroy();

    // 创建路径纹理
    const pathGraphics = this.add.graphics();
    pathGraphics.fillStyle(0xc9b896);
    pathGraphics.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    pathGraphics.generateTexture('path', TILE_SIZE, TILE_SIZE);
    pathGraphics.destroy();

    // 创建墙壁纹理
    const wallGraphics = this.add.graphics();
    wallGraphics.fillStyle(0x8b4513);
    wallGraphics.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    wallGraphics.generateTexture('wall', TILE_SIZE, TILE_SIZE);
    wallGraphics.destroy();

    // 创建门纹理
    const doorGraphics = this.add.graphics();
    doorGraphics.fillStyle(0x654321);
    doorGraphics.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    doorGraphics.fillStyle(0x4a3728);
    doorGraphics.fillRect(4, 4, TILE_SIZE - 8, TILE_SIZE - 8);
    doorGraphics.generateTexture('door', TILE_SIZE, TILE_SIZE);
    doorGraphics.destroy();

    // 创建玩家纹理
    const playerGraphics = this.add.graphics();
    playerGraphics.fillStyle(0xff6b6b);
    playerGraphics.fillCircle(TILE_SIZE / 2, TILE_SIZE / 2, TILE_SIZE / 3);
    playerGraphics.generateTexture('player', TILE_SIZE, TILE_SIZE);
    playerGraphics.destroy();

    console.log('占位纹理创建完成');
  }
}
```

- [ ] **Step 2: 验证编译**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: 提交**

```bash
git add src/scenes/BootScene.ts
git commit -m "feat: 实现BootScene资源加载

- 添加加载进度UI
- 创建占位纹理生成逻辑
- 支持后续替换为真实素材"
```

---

## Task 5: 实现TownOutdoorScene主场景

**Files:**
- Create: `src/scenes/TownOutdoorScene.ts`

- [ ] **Step 1: 创建TownOutdoorScene类**

```typescript
// src/scenes/TownOutdoorScene.ts
import Phaser from 'phaser';
import { SCENES, TILE_SIZE, GAME_WIDTH, GAME_HEIGHT } from '../data/constants';

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
  private interactiveTiles: Phaser.GameObjects.Rectangle[] = [];

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
```

- [ ] **Step 2: 验证编译**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: 启动开发服务器测试**

```bash
npm run dev
```

Expected: 浏览器打开，显示绿色背景和占位瓦片地图

- [ ] **Step 4: 提交**

```bash
git add src/scenes/TownOutdoorScene.ts
git commit -m "feat: 实现TownOutdoorScene主场景

- 创建程序化地图生成
- 实现玩家移动控制（方向键+WASD）
- 添加建筑占位（诊所、药园、玩家之家）"
```

---

## Task 6: 实现玩家实体类

**Files:**
- Create: `src/entities/Player.ts`
- Modify: `src/scenes/TownOutdoorScene.ts`

- [ ] **Step 1: 创建Player实体类**

```typescript
// src/entities/Player.ts
import Phaser from 'phaser';
import { TILE_SIZE } from '../data/constants';

export interface PlayerConfig {
  scene: Phaser.Scene;
  x: number;
  y: number;
}

export class Player extends Phaser.Physics.Arcade.Sprite {
  public speed: number = 150;
  private lastDirection: { x: number; y: number } = { x: 0, y: 1 };

  constructor(config: PlayerConfig) {
    super(config.scene, config.x, config.y, 'player');

    config.scene.add.existing(this);
    config.scene.physics.add.existing(this);

    this.init();
  }

  private init(): void {
    this.setDepth(1);
    this.setCollideWorldBounds(true);

    // 设置碰撞体
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(TILE_SIZE - 4, TILE_SIZE - 4);
    body.setOffset(2, 2);
  }

  move(direction: { x: number; y: number }): void {
    let velocityX = direction.x * this.speed;
    let velocityY = direction.y * this.speed;

    // 对角线移动标准化
    if (velocityX !== 0 && velocityY !== 0) {
      velocityX *= 0.707;
      velocityY *= 0.707;
    }

    this.setVelocity(velocityX, velocityY);

    // 记录最后移动方向（用于面向）
    if (direction.x !== 0 || direction.y !== 0) {
      this.lastDirection = { ...direction };
    }
  }

  stop(): void {
    this.setVelocity(0, 0);
  }

  getLastDirection(): { x: number; y: number } {
    return { ...this.lastDirection };
  }

  getTilePosition(): { x: number; y: number } {
    return {
      x: Math.floor(this.x / TILE_SIZE),
      y: Math.floor(this.y / TILE_SIZE)
    };
  }
}
```

- [ ] **Step 2: 更新TownOutdoorScene使用Player类**

```typescript
// 在 TownOutdoorScene.ts 中修改

// 添加导入
import { Player } from '../entities/Player';

// 修改类属性
export class TownOutdoorScene extends Phaser.Scene {
  private player!: Player;  // 改为 Player 类型
  // ... 其他属性保持不变

// 修改 createPlayer 方法
  private createPlayer(): void {
    const spawnX = Math.floor(this.mapData.width / 2) * TILE_SIZE + TILE_SIZE / 2;
    const spawnY = Math.floor(this.mapData.height / 2) * TILE_SIZE + TILE_SIZE / 2;

    this.player = new Player({
      scene: this,
      x: spawnX,
      y: spawnY
    });
  }

// 修改 update 方法
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
  }
```

- [ ] **Step 3: 验证编译**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: 测试运行**

```bash
npm run dev
```

- [ ] **Step 5: 提交**

```bash
git add src/entities/Player.ts src/scenes/TownOutdoorScene.ts
git commit -m "refactor: 抽取Player实体类

- 创建独立的Player类封装玩家逻辑
- 支持移动、停止、方向追踪
- 简化Scene代码"
```

---

## Task 7: 实现场景切换系统

**Files:**
- Create: `src/systems/SceneManager.ts`
- Modify: `src/scenes/TownOutdoorScene.ts`
- Create: `src/scenes/ClinicScene.ts`

- [ ] **Step 1: 创建SceneManager**

```typescript
// src/systems/SceneManager.ts
import Phaser from 'phaser';
import { SCENES } from '../data/constants';

export interface DoorInfo {
  targetScene: string;
  spawnPoint: { x: number; y: number };
}

export class SceneManager {
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  checkDoorInteraction(
    playerTileX: number,
    playerTileY: number,
    doorTiles: Map<string, DoorInfo>
  ): DoorInfo | null {
    const key = `${playerTileX},${playerTileY}`;
    return doorTiles.get(key) || null;
  }

  changeScene(targetScene: string, spawnPoint?: { x: number; y: number }): void {
    // 存储出生点数据
    if (spawnPoint) {
      this.scene.registry.set('spawnPoint', spawnPoint);
    }

    this.scene.scene.start(targetScene);
  }

  getSpawnPoint(): { x: number; y: number } | undefined {
    return this.scene.registry.get('spawnPoint');
  }

  clearSpawnPoint(): void {
    this.scene.registry.remove('spawnPoint');
  }
}
```

- [ ] **Step 2: 创建ClinicScene（青木诊所）**

```typescript
// src/scenes/ClinicScene.ts
import Phaser from 'phaser';
import { SCENES, TILE_SIZE } from '../data/constants';
import { Player } from '../entities/Player';

export class ClinicScene extends Phaser.Scene {
  private player!: Player;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;

  constructor() {
    super({ key: SCENES.CLINIC });
  }

  create(): void {
    // 创建简单的室内地图
    this.createRoom();

    // 创建玩家
    this.createPlayer();

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

    // 空格键返回
    this.input.keyboard?.once('keydown-SPACE', () => {
      this.scene.start(SCENES.TOWN_OUTDOOR);
    });
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
    const spawnX = Math.floor(15 / 2) * TILE_SIZE + TILE_SIZE / 2;
    const spawnY = Math.floor(12 / 2) * TILE_SIZE + TILE_SIZE / 2;

    this.player = new Player({
      scene: this,
      x: spawnX,
      y: spawnY
    });
  }

  private setupInput(): void {
    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
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
  }
}
```

- [ ] **Step 3: 注册ClinicScene到游戏配置**

```typescript
// 在 src/config/game.config.ts 中添加

import { ClinicScene } from '../scenes/ClinicScene';

// 修改 scene 数组
scene: [BootScene, TownOutdoorScene, ClinicScene],
```

- [ ] **Step 4: 在TownOutdoorScene添加门交互**

```typescript
// 在 TownOutdoorScene.ts 中添加门交互检测

// 添加属性
private sceneManager!: SceneManager;
private doorTiles: Map<string, { targetScene: string }> = new Map();

// 在 create() 方法中初始化
this.sceneManager = new SceneManager(this);
this.collectDoorTiles();

// 添加交互检测方法
private collectDoorTiles(): void {
  for (let y = 0; y < this.mapData.height; y++) {
    for (let x = 0; x < this.mapData.width; x++) {
      const tile = this.mapData.tiles[y][x];
      if (tile.type === 'door' && tile.properties?.target) {
        this.doorTiles.set(`${x},${y}`, {
          targetScene: tile.properties.target as string
        });
      }
    }
  }
}

// 在 update() 方法末尾添加门检测
// 检测门交互（空格键）
if (this.cursors.space.isDown) {
  const tilePos = this.player.getTilePosition();
  const doorInfo = this.doorTiles.get(`${tilePos.x},${tilePos.y}`);

  if (doorInfo) {
    this.scene.start(doorInfo.targetScene);
  }
}
```

- [ ] **Step 5: 验证编译**

```bash
npx tsc --noEmit
```

- [ ] **Step 6: 测试场景切换**

```bash
npm run dev
```

Expected: 玩家走到门位置按空格可以进入诊所

- [ ] **Step 7: 提交**

```bash
git add src/systems/SceneManager.ts src/scenes/ClinicScene.ts src/scenes/TownOutdoorScene.ts src/config/game.config.ts
git commit -m "feat: 实现场景切换系统

- 创建SceneManager管理场景切换
- 添加ClinicScene室内场景
- 支持门瓦片交互检测"
```

---

## Task 8: 创建GardenScene和HomeScene

**Files:**
- Create: `src/scenes/GardenScene.ts`
- Create: `src/scenes/HomeScene.ts`
- Modify: `src/config/game.config.ts`

- [ ] **Step 1: 创建GardenScene（老张药园）**

```typescript
// src/scenes/GardenScene.ts
import Phaser from 'phaser';
import { SCENES, TILE_SIZE } from '../data/constants';
import { Player } from '../entities/Player';

export class GardenScene extends Phaser.Scene {
  private player!: Player;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;

  constructor() {
    super({ key: SCENES.GARDEN });
  }

  create(): void {
    this.createRoom();
    this.createPlayer();
    this.addUI();
    this.setupInput();

    this.input.keyboard?.once('keydown-SPACE', () => {
      this.scene.start(SCENES.TOWN_OUTDOOR);
    });
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
    this.player = new Player({
      scene: this,
      x: Math.floor(20 / 2) * TILE_SIZE,
      y: Math.floor(15 / 2) * TILE_SIZE
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
  }
}
```

- [ ] **Step 2: 创建HomeScene（玩家之家）**

```typescript
// src/scenes/HomeScene.ts
import Phaser from 'phaser';
import { SCENES, TILE_SIZE } from '../data/constants';
import { Player } from '../entities/Player';

export class HomeScene extends Phaser.Scene {
  private player!: Player;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;

  constructor() {
    super({ key: SCENES.HOME });
  }

  create(): void {
    this.createRoom();
    this.createPlayer();
    this.addUI();
    this.setupInput();

    this.input.keyboard?.once('keydown-SPACE', () => {
      this.scene.start(SCENES.TOWN_OUTDOOR);
    });
  }

  private createRoom(): void {
    const roomWidth = 12;
    const roomHeight = 10;

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

    // 门
    const doorX = Math.floor(roomWidth / 2);
    this.add.sprite(
      doorX * TILE_SIZE + TILE_SIZE / 2,
      (roomHeight - 1) * TILE_SIZE + TILE_SIZE / 2,
      'door'
    );
  }

  private createPlayer(): void {
    this.player = new Player({
      scene: this,
      x: Math.floor(12 / 2) * TILE_SIZE,
      y: Math.floor(10 / 2) * TILE_SIZE
    });
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
  }
}
```

- [ ] **Step 3: 注册场景到游戏配置**

```typescript
// src/config/game.config.ts
import { GardenScene } from '../scenes/GardenScene';
import { HomeScene } from '../scenes/HomeScene';

// 更新 scene 数组
scene: [BootScene, TownOutdoorScene, ClinicScene, GardenScene, HomeScene],
```

- [ ] **Step 4: 验证编译**

```bash
npx tsc --noEmit
```

- [ ] **Step 5: 测试所有场景**

```bash
npm run dev
```

Expected: 可以进入所有4个场景

- [ ] **Step 6: 提交**

```bash
git add src/scenes/GardenScene.ts src/scenes/HomeScene.ts src/config/game.config.ts
git commit -m "feat: 添加药园和玩家之家场景

- 创建GardenScene（药田展示）
- 创建HomeScene（厨房、书房、卧室区域）
- 完成一期所有基础室内场景"
```

---

## Task 9: 添加碰撞检测

**Files:**
- Modify: `src/scenes/TownOutdoorScene.ts`
- Modify: `src/scenes/ClinicScene.ts`
- Modify: `src/scenes/GardenScene.ts`
- Modify: `src/scenes/HomeScene.ts`

- [ ] **Step 1: 在TownOutdoorScene添加碰撞组**

```typescript
// 在 TownOutdoorScene.ts 中添加

private walls!: Phaser.Physics.Arcade.StaticGroup;

// 在 createRoom 方法中添加墙壁碰撞
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
}

// 在 create() 方法中调用
this.createWallCollisions();
this.physics.add.collider(this.player, this.walls);
```

- [ ] **Step 2: 为室内场景添加碰撞**

```typescript
// 在 ClinicScene.ts, GardenScene.ts, HomeScene.ts 中添加类似逻辑

private walls!: Phaser.Physics.Arcade.StaticGroup;

private createWallCollisions(roomWidth: number, roomHeight: number): void {
  this.walls = this.physics.add.staticGroup();

  for (let y = 0; y < roomHeight; y++) {
    for (let x = 0; x < roomWidth; x++) {
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
}

// 在 create() 中调用
this.createWallCollisions(15, 12); // 或对应尺寸
this.physics.add.collider(this.player, this.walls);
```

- [ ] **Step 3: 验证碰撞效果**

```bash
npm run dev
```

Expected: 玩家不能穿过墙壁

- [ ] **Step 4: 提交**

```bash
git add src/scenes/
git commit -m "feat: 添加墙壁碰撞检测

- 所有场景添加物理碰撞
- 玩家不能穿过墙壁"
```

---

## Task 10: 添加游戏标题画面

**Files:**
- Create: `src/scenes/TitleScene.ts`
- Modify: `src/config/game.config.ts`

- [ ] **Step 1: 创建TitleScene**

```typescript
// src/scenes/TitleScene.ts
import Phaser from 'phaser';
import { SCENES, GAME_WIDTH, GAME_HEIGHT } from '../data/constants';

export class TitleScene extends Phaser.Scene {
  constructor() {
    super({ key: 'TitleScene' });
  }

  create(): void {
    // 背景
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x2d5a27);

    // 标题
    const title = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 3, '药灵山谷', {
      fontSize: '48px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // 副标题
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 3 + 60, 'v3.0 - 一期MVP', {
      fontSize: '16px',
      color: '#aaaaaa'
    }).setOrigin(0.5);

    // 开始按钮
    const startButton = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 50, '开始游戏', {
      fontSize: '24px',
      color: '#ffffff',
      backgroundColor: '#4a7c59',
      padding: { x: 20, y: 10 }
    }).setOrigin(0.5).setInteractive();

    startButton.on('pointerover', () => {
      startButton.setStyle({ backgroundColor: '#5a8c69' });
    });

    startButton.on('pointerout', () => {
      startButton.setStyle({ backgroundColor: '#4a7c59' });
    });

    startButton.on('pointerdown', () => {
      this.cameras.main.fade(500, 0, 0, 0);
      this.time.delayedCall(500, () => {
        this.scene.start(SCENES.BOOT);
      });
    });

    // 操作提示
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 80, '方向键/WASD移动 | 空格交互', {
      fontSize: '14px',
      color: '#888888'
    }).setOrigin(0.5);

    // 淡入效果
    this.cameras.main.fadeIn(500);
  }
}
```

- [ ] **Step 2: 更新游戏配置**

```typescript
// src/config/game.config.ts
import { TitleScene } from '../scenes/TitleScene';

// 场景数组，TitleScene放在最前面
scene: [TitleScene, BootScene, TownOutdoorScene, ClinicScene, GardenScene, HomeScene],
```

- [ ] **Step 3: 测试标题画面**

```bash
npm run dev
```

Expected: 显示标题画面，点击开始进入游戏

- [ ] **Step 4: 提交**

```bash
git add src/scenes/TitleScene.ts src/config/game.config.ts
git commit -m "feat: 添加游戏标题画面

- 创建TitleScene
- 显示游戏标题和开始按钮
- 添加操作提示"
```

---

## Phase 1 完成检查清单

- [ ] 项目可以启动运行
- [ ] 显示标题画面
- [ ] 玩家可以在室外地图移动
- [ ] 玩家可以进入室内场景（诊所、药园、家）
- [ ] 玩家不能穿过墙壁
- [ ] 所有输入响应正常（方向键、WASD、空格）

---

**Phase 1 完成！**

下一阶段（Phase 2）将实现：
- NPC系统框架
- AI对话接口
- TASK/MEMORY文件管理

请选择执行方式：
1. **Subagent-Driven (推荐)** - 我为每个任务派发独立的子智能体
2. **Inline Execution** - 在当前会话中逐任务执行