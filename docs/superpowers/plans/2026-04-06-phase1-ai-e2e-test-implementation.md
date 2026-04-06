# Phase 1 AI端到端测试实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现Phase 1 AI端到端测试系统，包括日志系统、状态暴露接口、测试工具和AI分析模块，实现23个测试用例的自动化验收。

**Architecture:** 采用事件总线模式解耦游戏逻辑与日志系统，通过window全局对象暴露游戏状态供测试读取，使用Playwright进行浏览器自动化操作，QWEN VL进行截图分析，GLM进行综合判断和报告生成。

**Tech Stack:** TypeScript, Phaser 3, Playwright, QWEN VL API, GLM API, Vitest

---

## 文件结构

```
src/
├── systems/
│   └── EventBus.ts              # 事件总线（新建）
├── utils/
│   └── GameLogger.ts            # 日志收集器（新建）
├── entities/
│   └── Player.ts                # 添加事件发送（修改）
├── scenes/
│   ├── TownOutdoorScene.ts      # 添加事件发送（修改）
│   ├── ClinicScene.ts           # 添加事件发送（修改）
│   ├── GardenScene.ts           # 添加事件发送（修改）
│   └── HomeScene.ts             # 添加事件发送（修改）
└── main.ts                      # 初始化日志系统和状态接口（修改）

tests/visual/
├── utils/
│   ├── game-launcher.ts         # 游戏启动器
│   ├── screenshot-capture.ts    # 截图采集器
│   ├── state-extractor.ts       # 状态提取器
│   ├── log-reader.ts            # 日志读取器
│   └── action-recorder.ts       # 动作序列录制器
├── ai/
│   ├── qwen-vl-client.ts        # QWEN VL API封装
│   ├── glm-client.ts            # GLM API封装
│   ├── analyzers/
│   │   ├── layout-analyzer.ts   # 布局分析器
│   │   ├── movement-analyzer.ts # 移动分析器
│   │   └── result-judge.ts       # 综合判断器
│   └── report-generator.ts      # 报告生成器
├── layout/
│   ├── map-layout.spec.ts       # 地图布局测试
│   └── indoor-layout.spec.ts    # 室内布局测试
├── movement/
│   ├── player-movement.spec.ts  # 玩家移动测试
│   └── collision.spec.ts        # 碰撞检测测试
├── scene-switch/
│   └── door-interaction.spec.ts # 门交互测试
├── runner.ts                    # 测试运行器
├── reports/                     # 报告输出目录
├── logs/                        # 日志采集目录
└── screenshots/                 # 截图存储目录
    └── sequences/               # 动作序列帧
```

---

## Task 1: 创建测试目录结构

**Files:**
- Create: `tests/visual/` (目录)
- Create: `tests/visual/utils/` (目录)
- Create: `tests/visual/ai/` (目录)
- Create: `tests/visual/ai/analyzers/` (目录)
- Create: `tests/visual/layout/` (目录)
- Create: `tests/visual/movement/` (目录)
- Create: `tests/visual/scene-switch/` (目录)
- Create: `tests/visual/reports/` (目录)
- Create: `tests/visual/logs/` (目录)
- Create: `tests/visual/screenshots/` (目录)
- Create: `tests/visual/screenshots/sequences/` (目录)

- [ ] **Step 1: 创建所有测试目录**

```bash
mkdir -p tests/visual/{utils,ai/analyzers,layout,movement,scene-switch,reports,logs,screenshots/sequences}
```

- [ ] **Step 2: 验证目录创建成功**

```bash
ls -la tests/visual/
```

Expected: 显示所有创建的目录

- [ ] **Step 3: 创建.gitkeep文件保持空目录**

```bash
touch tests/visual/reports/.gitkeep tests/visual/logs/.gitkeep tests/visual/screenshots/.gitkeep tests/visual/screenshots/sequences/.gitkeep
```

- [ ] **Step 4: 提交**

```bash
git add tests/visual/
git commit -m "chore: create visual test directory structure

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 2: 实现EventBus事件总线

**Files:**
- Create: `src/systems/EventBus.ts`

- [ ] **Step 1: 创建EventBus事件总线文件**

```typescript
// src/systems/EventBus.ts
import Phaser from 'phaser';

/**
 * 游戏事件常量定义
 */
export const GameEvents = {
  // 玩家事件
  PLAYER_MOVE: 'player:move',
  PLAYER_STOP: 'player:stop',
  PLAYER_COLLIDE: 'player:collide',
  PLAYER_POSITION: 'player:position',

  // 场景事件
  SCENE_CREATE: 'scene:create',
  SCENE_SWITCH: 'scene:switch',
  SCENE_DESTROY: 'scene:destroy',
  SCENE_READY: 'scene:ready',

  // 交互事件
  DOOR_INTERACT: 'door:interact',
  DOOR_ENTER: 'door:enter',
  DOOR_EXIT: 'door:exit',

  // 错误事件
  ERROR: 'error',
  ERROR_INPUT: 'error:input',
  ERROR_COLLISION: 'error:collision'
} as const;

export type GameEventType = typeof GameEvents[keyof typeof GameEvents];

/**
 * 事件数据接口
 */
export interface EventData {
  timestamp: number;
  type: GameEventType;
  data?: Record<string, unknown>;
}

/**
 * 事件总线类 - 单例模式
 * 用于游戏内各模块之间的事件通信
 */
export class EventBus {
  private static instance: EventBus | null = null;
  private emitter: Phaser.Events.EventEmitter;
  private eventHistory: EventData[] = [];
  private maxHistorySize: number = 1000;

  private constructor() {
    this.emitter = new Phaser.Events.EventEmitter();
  }

  /**
   * 获取EventBus单例
   */
  static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  /**
   * 发送事件
   */
  emit(event: GameEventType, data?: Record<string, unknown>): void {
    const eventData: EventData = {
      timestamp: Date.now(),
      type: event,
      data
    };

    // 记录事件历史
    this.eventHistory.push(eventData);
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }

    // 发送事件
    this.emitter.emit(event, eventData);
  }

  /**
   * 订阅事件
   */
  on(event: GameEventType, callback: (data: EventData) => void, context?: unknown): void {
    this.emitter.on(event, callback, context);
  }

  /**
   * 取消订阅
   */
  off(event: GameEventType, callback?: (data: EventData) => void, context?: unknown): void {
    this.emitter.off(event, callback, context);
  }

  /**
   * 订阅一次性事件
   */
  once(event: GameEventType, callback: (data: EventData) => void, context?: unknown): void {
    this.emitter.once(event, callback, context);
  }

  /**
   * 获取事件历史
   */
  getEventHistory(): EventData[] {
    return [...this.eventHistory];
  }

  /**
   * 获取指定类型的事件历史
   */
  getEventHistoryByType(eventType: GameEventType): EventData[] {
    return this.eventHistory.filter(e => e.type === eventType);
  }

  /**
   * 清除事件历史
   */
  clearHistory(): void {
    this.eventHistory = [];
  }

  /**
   * 销毁事件总线
   */
  destroy(): void {
    this.emitter.removeAllListeners();
    this.eventHistory = [];
    EventBus.instance = null;
  }
}

// 导出便捷方法
export const eventBus = EventBus.getInstance();
```

- [ ] **Step 2: 验证TypeScript编译**

```bash
npx tsc --noEmit
```

Expected: 无错误输出

- [ ] **Step 3: 提交**

```bash
git add src/systems/EventBus.ts
git commit -m "feat: add EventBus for game event system

- Define GameEvents constants for all event types
- Implement singleton EventBus with event emitter
- Add event history tracking for testing
- Support emit, on, off, once methods

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 3: 实现GameLogger日志收集器

**Files:**
- Create: `src/utils/GameLogger.ts`

- [ ] **Step 1: 创建GameLogger日志收集器**

```typescript
// src/utils/GameLogger.ts
import { EventBus, GameEvents, EventData } from '../systems/EventBus';

/**
 * 日志条目接口
 */
export interface LogEntry {
  timestamp: number;
  category: 'scene' | 'player' | 'interaction' | 'error';
  event: string;
  data?: Record<string, unknown>;
}

/**
 * 日志类别映射
 */
const EventCategoryMap: Record<string, LogEntry['category']> = {
  [GameEvents.PLAYER_MOVE]: 'player',
  [GameEvents.PLAYER_STOP]: 'player',
  [GameEvents.PLAYER_COLLIDE]: 'player',
  [GameEvents.PLAYER_POSITION]: 'player',
  [GameEvents.SCENE_CREATE]: 'scene',
  [GameEvents.SCENE_SWITCH]: 'scene',
  [GameEvents.SCENE_DESTROY]: 'scene',
  [GameEvents.SCENE_READY]: 'scene',
  [GameEvents.DOOR_INTERACT]: 'interaction',
  [GameEvents.DOOR_ENTER]: 'interaction',
  [GameEvents.DOOR_EXIT]: 'interaction',
  [GameEvents.ERROR]: 'error',
  [GameEvents.ERROR_INPUT]: 'error',
  [GameEvents.ERROR_COLLISION]: 'error'
};

/**
 * 游戏日志收集器
 * 监听EventBus事件并按类别分类存储
 */
export class GameLogger {
  private static instance: GameLogger | null = null;
  private logs: Map<LogEntry['category'], LogEntry[]> = new Map();
  private maxLogsPerCategory: number = 500;
  private isEnabled: boolean = true;
  private sessionTimestamp: string;

  private constructor() {
    this.sessionTimestamp = this.formatTimestamp(new Date());
    this.initializeCategories();
    this.subscribeToEvents();
  }

  /**
   * 获取GameLogger单例
   */
  static getInstance(): GameLogger {
    if (!GameLogger.instance) {
      GameLogger.instance = new GameLogger();
    }
    return GameLogger.instance;
  }

  /**
   * 初始化日志类别
   */
  private initializeCategories(): void {
    this.logs.set('scene', []);
    this.logs.set('player', []);
    this.logs.set('interaction', []);
    this.logs.set('error', []);
  }

  /**
   * 订阅所有游戏事件
   */
  private subscribeToEvents(): void {
    const eventBus = EventBus.getInstance();

    Object.values(GameEvents).forEach(event => {
      eventBus.on(event, (eventData: EventData) => {
        if (this.isEnabled) {
          this.logEvent(eventData);
        }
      });
    });
  }

  /**
   * 记录事件到日志
   */
  private logEvent(eventData: EventData): void {
    const category = EventCategoryMap[eventData.type] || 'error';
    const logs = this.logs.get(category);

    if (logs) {
      const entry: LogEntry = {
        timestamp: eventData.timestamp,
        category,
        event: eventData.type,
        data: eventData.data
      };

      logs.push(entry);

      // 限制日志数量
      if (logs.length > this.maxLogsPerCategory) {
        logs.shift();
      }
    }
  }

  /**
   * 格式化时间戳
   */
  private formatTimestamp(date: Date): string {
    return date.toISOString().replace(/[:.]/g, '-').slice(0, 19);
  }

  /**
   * 获取指定类别的日志
   */
  getLogs(category: LogEntry['category']): LogEntry[] {
    return this.logs.get(category) || [];
  }

  /**
   * 获取所有日志
   */
  getAllLogs(): Map<LogEntry['category'], LogEntry[]> {
    return new Map(this.logs);
  }

  /**
   * 导出日志为字符串
   */
  exportLogs(category: LogEntry['category']): string {
    const logs = this.logs.get(category) || [];
    return logs.map(log => {
      const dataStr = log.data ? ` | ${JSON.stringify(log.data)}` : '';
      return `[${new Date(log.timestamp).toISOString()}] ${log.event}${dataStr}`;
    }).join('\n');
  }

  /**
   * 导出所有日志为对象
   */
  exportAllLogs(): Record<string, string> {
    const result: Record<string, string> = {};
    this.logs.forEach((logs, category) => {
      result[category] = this.exportLogs(category);
    });
    return result;
  }

  /**
   * 获取会话时间戳
   */
  getSessionTimestamp(): string {
    return this.sessionTimestamp;
  }

  /**
   * 启用/禁用日志记录
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  /**
   * 清除所有日志
   */
  clearLogs(): void {
    this.initializeCategories();
  }

  /**
   * 销毁日志收集器
   */
  destroy(): void {
    this.clearLogs();
    GameLogger.instance = null;
  }
}

// 导出便捷方法
export const gameLogger = GameLogger.getInstance();
```

- [ ] **Step 2: 验证TypeScript编译**

```bash
npx tsc --noEmit
```

Expected: 无错误输出

- [ ] **Step 3: 提交**

```bash
git add src/utils/GameLogger.ts
git commit -m "feat: add GameLogger for event logging

- Implement singleton GameLogger
- Categorize logs by scene, player, interaction, error
- Subscribe to all EventBus events
- Support log export and session timestamp

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 4: 实现状态暴露接口

**Files:**
- Modify: `src/main.ts`
- Create: `src/utils/GameStateBridge.ts`

- [ ] **Step 1: 创建GameStateBridge状态桥接器**

```typescript
// src/utils/GameStateBridge.ts
import Phaser from 'phaser';

/**
 * 瓦片数据接口
 */
export interface TileData {
  x: number;
  y: number;
  type: string;
  properties?: Record<string, unknown>;
}

/**
 * 地图数据接口
 */
export interface MapData {
  width: number;
  height: number;
  tiles: TileData[][];
}

/**
 * 玩家状态接口
 */
export interface PlayerState {
  x: number;
  y: number;
  tileX: number;
  tileY: number;
  speed: number;
  velocity: { x: number; y: number };
}

/**
 * 场景尺寸接口
 */
export interface SceneSize {
  width: number;
  height: number;
}

/**
 * 碰撞状态接口
 */
export interface CollisionState {
  lastCollision: string | null;
  isColliding: boolean;
}

/**
 * 游戏状态接口（暴露给测试系统）
 */
export interface GameStateForTest {
  mapData: MapData | null;
  player: PlayerState | null;
  sceneSize: SceneSize | null;
  currentScene: string;
  collision: CollisionState;
  timestamp: number;
}

/**
 * 游戏状态桥接器
 * 将游戏内部状态暴露给测试系统
 */
export class GameStateBridge {
  private static instance: GameStateBridge | null = null;
  private game: Phaser.Game | null = null;
  private currentState: GameStateForTest = {
    mapData: null,
    player: null,
    sceneSize: null,
    currentScene: '',
    collision: {
      lastCollision: null,
      isColliding: false
    },
    timestamp: Date.now()
  };

  private constructor() {
    // 挂载到window对象
    if (typeof window !== 'undefined') {
      (window as unknown as Record<string, unknown>).__GAME_STATE__ = this.getState.bind(this);
    }
  }

  /**
   * 获取GameStateBridge单例
   */
  static getInstance(): GameStateBridge {
    if (!GameStateBridge.instance) {
      GameStateBridge.instance = new GameStateBridge();
    }
    return GameStateBridge.instance;
  }

  /**
   * 设置游戏实例
   */
  setGame(game: Phaser.Game): void {
    this.game = game;
  }

  /**
   * 更新地图数据
   */
  updateMapData(mapData: MapData): void {
    this.currentState.mapData = mapData;
    this.currentState.timestamp = Date.now();
  }

  /**
   * 更新玩家状态
   */
  updatePlayerState(player: PlayerState): void {
    this.currentState.player = player;
    this.currentState.timestamp = Date.now();
  }

  /**
   * 更新场景尺寸
   */
  updateSceneSize(size: SceneSize): void {
    this.currentState.sceneSize = size;
    this.currentState.timestamp = Date.now();
  }

  /**
   * 更新当前场景名称
   */
  updateCurrentScene(sceneName: string): void {
    this.currentState.currentScene = sceneName;
    this.currentState.timestamp = Date.now();
  }

  /**
   * 更新碰撞状态
   */
  updateCollisionState(collision: CollisionState): void {
    this.currentState.collision = collision;
    this.currentState.timestamp = Date.now();
  }

  /**
   * 获取当前游戏状态
   */
  getState(): GameStateForTest {
    return {
      ...this.currentState,
      timestamp: Date.now()
    };
  }

  /**
   * 重置状态
   */
  reset(): void {
    this.currentState = {
      mapData: null,
      player: null,
      sceneSize: null,
      currentScene: '',
      collision: {
        lastCollision: null,
        isColliding: false
      },
      timestamp: Date.now()
    };
  }

  /**
   * 销毁桥接器
   */
  destroy(): void {
    if (typeof window !== 'undefined') {
      delete (window as unknown as Record<string, unknown>).__GAME_STATE__;
    }
    this.game = null;
    GameStateBridge.instance = null;
  }
}

// 导出便捷方法
export const gameStateBridge = GameStateBridge.getInstance();
```

- [ ] **Step 2: 修改main.ts初始化日志系统和状态桥接器**

```typescript
// src/main.ts
import Phaser from 'phaser';
import { gameConfig } from './config/game.config';
import { EventBus } from './systems/EventBus';
import { GameLogger } from './utils/GameLogger';
import { GameStateBridge } from './utils/GameStateBridge';

window.addEventListener('load', () => {
  // 初始化事件总线
  const eventBus = EventBus.getInstance();

  // 初始化日志收集器
  const gameLogger = GameLogger.getInstance();

  // 初始化状态桥接器
  const gameStateBridge = GameStateBridge.getInstance();

  // 创建游戏实例
  const game = new Phaser.Game(gameConfig);

  // 设置游戏实例到状态桥接器
  gameStateBridge.setGame(game);

  // 开发模式下暴露调试接口
  if (import.meta.env.DEV) {
    (window as unknown as Record<string, unknown>).__GAME__ = game;
    (window as unknown as Record<string, unknown>).__EVENT_BUS__ = eventBus;
    (window as unknown as Record<string, unknown>).__GAME_LOGGER__ = gameLogger;
    console.log('[Dev] Game debugging interfaces initialized');
  }
});
```

- [ ] **Step 3: 验证TypeScript编译**

```bash
npx tsc --noEmit
```

Expected: 无错误输出

- [ ] **Step 4: 提交**

```bash
git add src/utils/GameStateBridge.ts src/main.ts
git commit -m "feat: add GameStateBridge for test state exposure

- Create GameStateBridge singleton for state management
- Expose game state via window.__GAME_STATE__
- Initialize EventBus, GameLogger, GameStateBridge in main.ts
- Add dev mode debugging interfaces

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 5: 在Player中添加事件发送

**Files:**
- Modify: `src/entities/Player.ts`

- [ ] **Step 1: 修改Player.ts添加事件发送**

找到 `src/entities/Player.ts`，修改如下：

```typescript
// src/entities/Player.ts
import Phaser from 'phaser';
import { TILE_SIZE } from '../data/constants';
import { EventBus, GameEvents } from '../systems/EventBus';

export interface PlayerConfig {
  scene: Phaser.Scene;
  x: number;
  y: number;
}

export class Player extends Phaser.Physics.Arcade.Sprite {
  public speed: number = 150;
  private lastDirection: { x: number; y: number } = { x: 0, y: 1 };
  private eventBus: EventBus;
  private lastPosition: { x: number; y: number } = { x: 0, y: 0 };
  private wasMoving: boolean = false;

  constructor(config: PlayerConfig) {
    super(config.scene, config.x, config.y, 'player');

    this.eventBus = EventBus.getInstance();
    this.lastPosition = { x: config.x, y: config.y };

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

    // 发送移动事件
    if (direction.x !== 0 || direction.y !== 0) {
      this.eventBus.emit(GameEvents.PLAYER_MOVE, {
        direction: { ...direction },
        velocity: { x: velocityX, y: velocityY },
        position: { x: this.x, y: this.y }
      });
      this.wasMoving = true;
    }
  }

  stop(): this {
    this.setVelocity(0, 0);

    // 发送停止事件
    if (this.wasMoving) {
      this.eventBus.emit(GameEvents.PLAYER_STOP, {
        position: { x: this.x, y: this.y }
      });
      this.wasMoving = false;
    }

    return this;
  }

  /**
   * 报告碰撞事件
   */
  reportCollision(collisionWith: string): void {
    this.eventBus.emit(GameEvents.PLAYER_COLLIDE, {
      collisionWith,
      position: { x: this.x, y: this.y }
    });
  }

  /**
   * 更新位置追踪（在scene update中调用）
   */
  updatePositionTracking(): void {
    const moved = Math.abs(this.x - this.lastPosition.x) > 1 ||
                  Math.abs(this.y - this.lastPosition.y) > 1;

    if (moved) {
      this.eventBus.emit(GameEvents.PLAYER_POSITION, {
        position: { x: this.x, y: this.y },
        tilePosition: this.getTilePosition()
      });
      this.lastPosition = { x: this.x, y: this.y };
    }
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

- [ ] **Step 2: 验证TypeScript编译**

```bash
npx tsc --noEmit
```

Expected: 无错误输出

- [ ] **Step 3: 提交**

```bash
git add src/entities/Player.ts
git commit -m "feat: add event emission to Player class

- Emit PLAYER_MOVE event when moving
- Emit PLAYER_STOP event when stopping
- Add reportCollision method for collision events
- Add position tracking for PLAYER_POSITION events

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 6: 在TownOutdoorScene中添加事件发送和状态更新

**Files:**
- Modify: `src/scenes/TownOutdoorScene.ts`

- [ ] **Step 1: 修改TownOutdoorScene.ts**

在文件顶部添加导入：

```typescript
import { EventBus, GameEvents } from '../systems/EventBus';
import { GameStateBridge } from '../utils/GameStateBridge';
```

在 `create()` 方法开头添加：

```typescript
// 发送场景创建事件
const eventBus = EventBus.getInstance();
eventBus.emit(GameEvents.SCENE_CREATE, { sceneName: SCENES.TOWN_OUTDOOR });

// 更新状态桥接器
const gameStateBridge = GameStateBridge.getInstance();
gameStateBridge.updateCurrentScene(SCENES.TOWN_OUTDOOR);
gameStateBridge.updateSceneSize({ width: this.mapData.width, height: this.mapData.height });
gameStateBridge.updateMapData(this.mapData);
```

在 `createPlayer()` 方法末尾添加状态更新：

```typescript
// 更新玩家状态到桥接器
gameStateBridge.updatePlayerState({
  x: this.player.x,
  y: this.player.y,
  tileX: Math.floor(this.player.x / TILE_SIZE),
  tileY: Math.floor(this.player.y / TILE_SIZE),
  speed: this.player.speed,
  velocity: { x: 0, y: 0 }
});
```

在 `update()` 方法的门交互部分修改：

```typescript
if (Phaser.Input.Keyboard.JustDown(this.spaceKey) && !this.isTransitioning) {
  const tilePos = this.player.getTilePosition();
  const doorInfo = this.sceneManager.checkDoorInteraction(
    tilePos.x,
    tilePos.y,
    this.doorTiles
  );

  if (doorInfo) {
    // 发送门交互事件
    eventBus.emit(GameEvents.DOOR_INTERACT, {
      from: SCENES.TOWN_OUTDOOR,
      to: doorInfo.targetScene,
      doorPosition: tilePos
    });

    // 发送场景切换事件
    eventBus.emit(GameEvents.SCENE_SWITCH, {
      from: SCENES.TOWN_OUTDOOR,
      to: doorInfo.targetScene
    });

    this.isTransitioning = true;
    this.sceneManager.changeScene(doorInfo.targetScene, doorInfo.spawnPoint);
  }
}
```

完整修改后的关键部分：

```typescript
// src/scenes/TownOutdoorScene.ts
import Phaser from 'phaser';
import { SCENES, TILE_SIZE } from '../data/constants';
import { Player } from '../entities/Player';
import { SceneManager, DoorInfo } from '../systems/SceneManager';
import { EventBus, GameEvents } from '../systems/EventBus';
import { GameStateBridge } from '../utils/GameStateBridge';

// ... 保留原有的接口定义 ...

export class TownOutdoorScene extends Phaser.Scene {
  private player!: Player;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private mapData!: MapData;
  private sceneManager!: SceneManager;
  private doorTiles: Map<string, DoorInfo> = new Map();
  private spaceKey!: Phaser.Input.Keyboard.Key;
  private isTransitioning: boolean = false;
  private walls!: Phaser.Physics.Arcade.StaticGroup;
  private eventBus!: EventBus;
  private gameStateBridge!: GameStateBridge;

  constructor() {
    super({ key: SCENES.TOWN_OUTDOOR });
  }

  create(): void {
    // 初始化事件系统
    this.eventBus = EventBus.getInstance();
    this.gameStateBridge = GameStateBridge.getInstance();

    // 发送场景创建事件
    this.eventBus.emit(GameEvents.SCENE_CREATE, { sceneName: SCENES.TOWN_OUTDOOR });

    // 创建地图数据
    this.mapData = this.createTownMapData();

    // 更新状态桥接器
    this.gameStateBridge.updateCurrentScene(SCENES.TOWN_OUTDOOR);
    this.gameStateBridge.updateSceneSize({ width: this.mapData.width, height: this.mapData.height });
    this.gameStateBridge.updateMapData({
      width: this.mapData.width,
      height: this.mapData.height,
      tiles: this.mapData.tiles.map(row => row.map(tile => ({
        x: tile.x,
        y: tile.y,
        type: tile.type,
        properties: tile.properties
      })))
    });

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

    // 发送场景就绪事件
    this.eventBus.emit(GameEvents.SCENE_READY, { sceneName: SCENES.TOWN_OUTDOOR });

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

  // ... createTownMapData, addBuilding, collectDoorTiles, renderMap 方法保持不变 ...

  private createPlayer(): void {
    // 从registry获取出生点，如果没有则使用默认位置（地图中心）
    let spawnX: number;
    let spawnY: number;

    const registrySpawnPoint = this.registry.get('spawnPoint');
    if (registrySpawnPoint) {
      spawnX = registrySpawnPoint.x * TILE_SIZE + TILE_SIZE / 2;
      spawnY = registrySpawnPoint.y * TILE_SIZE + TILE_SIZE / 2;
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

    // 更新玩家状态到桥接器
    this.gameStateBridge.updatePlayerState({
      x: this.player.x,
      y: this.player.y,
      tileX: Math.floor(this.player.x / TILE_SIZE),
      tileY: Math.floor(this.player.y / TILE_SIZE),
      speed: this.player.speed,
      velocity: { x: 0, y: 0 }
    });
  }

  // ... createWallCollisions, setupCamera, setupInput 方法保持不变 ...

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

    // 更新玩家位置追踪
    this.player.updatePositionTracking();

    // 更新状态桥接器中的玩家状态
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    this.gameStateBridge.updatePlayerState({
      x: this.player.x,
      y: this.player.y,
      tileX: Math.floor(this.player.x / TILE_SIZE),
      tileY: Math.floor(this.player.y / TILE_SIZE),
      speed: this.player.speed,
      velocity: { x: body.velocity.x, y: body.velocity.y }
    });

    // 检测门交互（空格键）- 使用JustDown防止多次触发
    if (Phaser.Input.Keyboard.JustDown(this.spaceKey) && !this.isTransitioning) {
      const tilePos = this.player.getTilePosition();
      const doorInfo = this.sceneManager.checkDoorInteraction(
        tilePos.x,
        tilePos.y,
        this.doorTiles
      );

      if (doorInfo) {
        // 发送门交互事件
        this.eventBus.emit(GameEvents.DOOR_INTERACT, {
          from: SCENES.TOWN_OUTDOOR,
          to: doorInfo.targetScene,
          doorPosition: tilePos
        });

        // 发送场景切换事件
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
    // 发送场景销毁事件
    this.eventBus.emit(GameEvents.SCENE_DESTROY, { sceneName: SCENES.TOWN_OUTDOOR });
  }
}
```

- [ ] **Step 2: 验证TypeScript编译**

```bash
npx tsc --noEmit
```

Expected: 无错误输出

- [ ] **Step 3: 提交**

```bash
git add src/scenes/TownOutdoorScene.ts
git commit -m "feat: add event emission and state updates to TownOutdoorScene

- Emit SCENE_CREATE, SCENE_READY, SCENE_DESTROY events
- Emit DOOR_INTERACT, SCENE_SWITCH events on door interaction
- Update GameStateBridge with map, player, and scene data
- Add position tracking in update loop

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 7: 在ClinicScene中添加事件发送

**Files:**
- Modify: `src/scenes/ClinicScene.ts`

- [ ] **Step 1: 修改ClinicScene.ts添加事件发送**

```typescript
// src/scenes/ClinicScene.ts
import Phaser from 'phaser';
import { SCENES, TILE_SIZE } from '../data/constants';
import { Player } from '../entities/Player';
import { EventBus, GameEvents } from '../systems/EventBus';
import { GameStateBridge } from '../utils/GameStateBridge';

export class ClinicScene extends Phaser.Scene {
  private player!: Player;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private spaceKey!: Phaser.Input.Keyboard.Key;
  private isTransitioning: boolean = false;
  private walls!: Phaser.Physics.Arcade.StaticGroup;
  private eventBus!: EventBus;
  private gameStateBridge!: GameStateBridge;

  constructor() {
    super({ key: SCENES.CLINIC });
  }

  create(): void {
    // 初始化事件系统
    this.eventBus = EventBus.getInstance();
    this.gameStateBridge = GameStateBridge.getInstance();

    // 发送场景创建事件
    this.eventBus.emit(GameEvents.SCENE_CREATE, { sceneName: SCENES.CLINIC });

    // 更新状态桥接器
    this.gameStateBridge.updateCurrentScene(SCENES.CLINIC);
    this.gameStateBridge.updateSceneSize({ width: 15, height: 12 });

    // 创建简单的室内地图
    this.createRoom();

    // 创建玩家（使用registry中的出生点）
    this.createPlayer();

    // 创建墙壁碰撞
    this.createWallCollisions(15, 12);

    // 发送门进入事件
    this.eventBus.emit(GameEvents.DOOR_ENTER, {
      scene: SCENES.CLINIC,
      building: 'clinic'
    });

    // 发送场景就绪事件
    this.eventBus.emit(GameEvents.SCENE_READY, { sceneName: SCENES.CLINIC });

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

  // ... createRoom, createPlayer, createWallCollisions, setupInput 方法保持不变 ...
  // 但在 createPlayer 中添加状态更新

  private createPlayer(): void {
    let spawnX: number;
    let spawnY: number;

    const registrySpawnPoint = this.registry.get('spawnPoint');
    if (registrySpawnPoint) {
      spawnX = 7 * TILE_SIZE + TILE_SIZE / 2;
      spawnY = 10 * TILE_SIZE + TILE_SIZE / 2;
      this.registry.remove('spawnPoint');
    } else {
      spawnX = Math.floor(15 / 2) * TILE_SIZE + TILE_SIZE / 2;
      spawnY = Math.floor(12 / 2) * TILE_SIZE + TILE_SIZE / 2;
    }

    this.player = new Player({
      scene: this,
      x: spawnX,
      y: spawnY
    });

    // 更新玩家状态
    this.gameStateBridge.updatePlayerState({
      x: this.player.x,
      y: this.player.y,
      tileX: Math.floor(this.player.x / TILE_SIZE),
      tileY: Math.floor(this.player.y / TILE_SIZE),
      speed: this.player.speed,
      velocity: { x: 0, y: 0 }
    });
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

    // 更新玩家位置追踪
    this.player.updatePositionTracking();

    // 更新状态桥接器
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    this.gameStateBridge.updatePlayerState({
      x: this.player.x,
      y: this.player.y,
      tileX: Math.floor(this.player.x / TILE_SIZE),
      tileY: Math.floor(this.player.y / TILE_SIZE),
      speed: this.player.speed,
      velocity: { x: body.velocity.x, y: body.velocity.y }
    });

    // 检测空格键返回
    if (Phaser.Input.Keyboard.JustDown(this.spaceKey) && !this.isTransitioning) {
      // 发送门退出事件
      this.eventBus.emit(GameEvents.DOOR_EXIT, {
        from: SCENES.CLINIC,
        to: SCENES.TOWN_OUTDOOR
      });

      // 发送场景切换事件
      this.eventBus.emit(GameEvents.SCENE_SWITCH, {
        from: SCENES.CLINIC,
        to: SCENES.TOWN_OUTDOOR
      });

      this.isTransitioning = true;
      this.registry.set('spawnPoint', { x: 7, y: 10 });
      this.scene.start(SCENES.TOWN_OUTDOOR);
    }
  }

  shutdown(): void {
    this.eventBus.emit(GameEvents.SCENE_DESTROY, { sceneName: SCENES.CLINIC });
  }
}
```

- [ ] **Step 2: 验证TypeScript编译**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: 提交**

```bash
git add src/scenes/ClinicScene.ts
git commit -m "feat: add event emission to ClinicScene

- Emit scene lifecycle events (create, ready, destroy)
- Emit DOOR_ENTER and DOOR_EXIT events
- Update GameStateBridge with player state
- Add shutdown hook for cleanup

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 8: 在GardenScene和HomeScene中添加事件发送

**Files:**
- Modify: `src/scenes/GardenScene.ts`
- Modify: `src/scenes/HomeScene.ts`

- [ ] **Step 1: 修改GardenScene.ts**

参照ClinicScene的修改模式，添加相同的事件发送逻辑。

- [ ] **Step 2: 修改HomeScene.ts**

参照ClinicScene的修改模式，添加相同的事件发送逻辑。

- [ ] **Step 3: 验证TypeScript编译**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: 提交**

```bash
git add src/scenes/GardenScene.ts src/scenes/HomeScene.ts
git commit -m "feat: add event emission to GardenScene and HomeScene

- Add same event pattern as ClinicScene
- Emit scene lifecycle events
- Update GameStateBridge

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 9: 实现测试工具 - 游戏启动器

**Files:**
- Create: `tests/visual/utils/game-launcher.ts`

- [ ] **Step 1: 创建游戏启动器**

```typescript
// tests/visual/utils/game-launcher.ts
import { chromium, Browser, Page, BrowserContext } from '@playwright/test';
import path from 'path';
import fs from 'fs';

export interface GameLauncherOptions {
  headless?: boolean;
  timeout?: number;
  devServerUrl?: string;
}

export interface GameLauncherResult {
  browser: Browser;
  context: BrowserContext;
  page: Page;
  close: () => Promise<void>;
}

/**
 * 游戏启动器
 * 负责启动浏览器和游戏页面
 */
export class GameLauncher {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private page: Page | null = null;
  private defaultTimeout: number = 30000;

  /**
   * 启动游戏
   */
  async launch(options: GameLauncherOptions = {}): Promise<GameLauncherResult> {
    const {
      headless = true,
      timeout = this.defaultTimeout,
      devServerUrl = 'http://localhost:3000'
    } = options;

    // 启动浏览器
    this.browser = await chromium.launch({
      headless,
      args: ['--disable-web-security'] // 允许跨域（开发模式）
    });

    // 创建上下文
    this.context = await this.browser.newContext({
      viewport: { width: 800, height: 600 },
      deviceScaleFactor: 1
    });

    // 设置默认超时
    this.context.setDefaultTimeout(timeout);

    // 创建页面
    this.page = await this.context.newPage();

    // 监听控制台输出
    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error('[Browser Error]', msg.text());
      }
    });

    // 监听页面错误
    this.page.on('pageerror', error => {
      console.error('[Page Error]', error.message);
    });

    // 导航到游戏页面
    await this.page.goto(devServerUrl);
    await this.page.waitForSelector('#game-container canvas', { timeout });

    return {
      browser: this.browser,
      context: this.context,
      page: this.page,
      close: () => this.close()
    };
  }

  /**
   * 等待游戏加载完成
   */
  async waitForGameReady(page: Page, timeout: number = 10000): Promise<void> {
    // 等待Canvas渲染
    await page.waitForSelector('#game-container canvas', { timeout });

    // 等待游戏状态接口可用
    await page.waitForFunction(() => {
      return typeof (window as unknown as Record<string, unknown>).__GAME_STATE__ === 'function';
    }, { timeout });

    // 额外等待确保游戏初始化完成
    await page.waitForTimeout(500);
  }

  /**
   * 点击开始游戏按钮
   */
  async clickStartButton(page: Page): Promise<void> {
    // 点击屏幕中央位置（开始按钮位置）
    await page.click('#game-container canvas', {
      position: { x: 400, y: 350 }
    });
    await page.waitForTimeout(1000);
  }

  /**
   * 获取游戏状态
   */
  async getGameState(page: Page): Promise<unknown> {
    return await page.evaluate(() => {
      const getState = (window as unknown as Record<string, unknown>).__GAME_STATE__;
      if (typeof getState === 'function') {
        return getState();
      }
      return null;
    });
  }

  /**
   * 关闭浏览器
   */
  async close(): Promise<void> {
    if (this.page) {
      await this.page.close();
      this.page = null;
    }
    if (this.context) {
      await this.context.close();
      this.context = null;
    }
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}

// 导出单例
export const gameLauncher = new GameLauncher();
```

- [ ] **Step 2: 验证TypeScript编译**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: 提交**

```bash
git add tests/visual/utils/game-launcher.ts
git commit -m "feat: add GameLauncher utility for visual tests

- Launch browser and navigate to game
- Wait for game ready state
- Click start button helper
- Get game state from window object

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 10: 实现测试工具 - 截图采集器

**Files:**
- Create: `tests/visual/utils/screenshot-capture.ts`

- [ ] **Step 1: 创建截图采集器**

```typescript
// tests/visual/utils/screenshot-capture.ts
import { Page } from '@playwright/test';
import path from 'path';
import fs from 'fs';

export interface ScreenshotOptions {
  directory: string;
  filename: string;
  fullPage?: boolean;
}

export interface ScreenshotResult {
  path: string;
  filename: string;
  timestamp: number;
}

/**
 * 截图采集器
 * 负责采集游戏截图
 */
export class ScreenshotCapture {
  private baseDirectory: string;
  private timestamp: string;

  constructor(baseDirectory: string = 'tests/visual/screenshots') {
    this.baseDirectory = baseDirectory;
    this.timestamp = this.formatTimestamp(new Date());
    this.ensureDirectoryExists(baseDirectory);
  }

  /**
   * 格式化时间戳
   */
  private formatTimestamp(date: Date): string {
    return date.toISOString().replace(/[:.]/g, '-').slice(0, 19);
  }

  /**
   * 确保目录存在
   */
  private ensureDirectoryExists(dir: string): void {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  /**
   * 截取Canvas截图
   */
  async captureCanvas(page: Page, options: ScreenshotOptions): Promise<ScreenshotResult> {
    const { directory, filename, fullPage = false } = options;
    const fullPath = path.join(directory, filename);

    this.ensureDirectoryExists(directory);

    // 获取Canvas元素
    const canvas = page.locator('#game-container canvas');

    if (fullPage) {
      await page.screenshot({ path: fullPath, fullPage: true });
    } else {
      await canvas.screenshot({ path: fullPath });
    }

    return {
      path: fullPath,
      filename,
      timestamp: Date.now()
    };
  }

  /**
   * 截取场景截图
   */
  async captureScene(page: Page, sceneName: string): Promise<ScreenshotResult> {
    const filename = `${sceneName}-${this.timestamp}.png`;
    const directory = this.baseDirectory;

    return await this.captureCanvas(page, { directory, filename });
  }

  /**
   * 截取动作序列帧
   */
  async captureSequence(
    page: Page,
    sequenceName: string,
    frameIndex: number
  ): Promise<ScreenshotResult> {
    const directory = path.join(this.baseDirectory, 'sequences');
    const filename = `${sequenceName}-${frameIndex.toString().padStart(3, '0')}.png`;

    return await this.captureCanvas(page, { directory, filename });
  }

  /**
   * 批量截图
   */
  async captureMultiple(
    page: Page,
    captures: Array<{ sceneName: string; delay?: number }>
  ): Promise<ScreenshotResult[]> {
    const results: ScreenshotResult[] = [];

    for (const capture of captures) {
      if (capture.delay) {
        await page.waitForTimeout(capture.delay);
      }
      const result = await this.captureScene(page, capture.sceneName);
      results.push(result);
    }

    return results;
  }

  /**
   * 获取截图文件列表
   */
  getScreenshotFiles(directory?: string): string[] {
    const targetDir = directory || this.baseDirectory;
    if (!fs.existsSync(targetDir)) {
      return [];
    }
    return fs.readdirSync(targetDir)
      .filter(f => f.endsWith('.png'))
      .map(f => path.join(targetDir, f));
  }

  /**
   * 清除旧截图
   */
  clearOldScreenshots(olderThanHours: number = 24): void {
    const now = Date.now();
    const cutoff = olderThanHours * 60 * 60 * 1000;

    const files = this.getScreenshotFiles();
    for (const file of files) {
      const stat = fs.statSync(file);
      if (now - stat.mtimeMs > cutoff) {
        fs.unlinkSync(file);
      }
    }
  }

  /**
   * 获取时间戳
   */
  getTimestamp(): string {
    return this.timestamp;
  }
}

// 导出单例
export const screenshotCapture = new ScreenshotCapture();
```

- [ ] **Step 2: 验证TypeScript编译**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: 提交**

```bash
git add tests/visual/utils/screenshot-capture.ts
git commit -m "feat: add ScreenshotCapture utility for visual tests

- Capture canvas and scene screenshots
- Support sequence frame capture
- Manage screenshot directory and cleanup

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 11: 实现测试工具 - 状态提取器

**Files:**
- Create: `tests/visual/utils/state-extractor.ts`

- [ ] **Step 1: 创建状态提取器**

```typescript
// tests/visual/utils/state-extractor.ts
import { Page } from '@playwright/test';

/**
 * 瓦片数据
 */
export interface TileData {
  x: number;
  y: number;
  type: string;
  properties?: Record<string, unknown>;
}

/**
 * 地图数据
 */
export interface MapData {
  width: number;
  height: number;
  tiles: TileData[][];
}

/**
 * 玩家状态
 */
export interface PlayerState {
  x: number;
  y: number;
  tileX: number;
  tileY: number;
  speed: number;
  velocity: { x: number; y: number };
}

/**
 * 场景尺寸
 */
export interface SceneSize {
  width: number;
  height: number;
}

/**
 * 碰撞状态
 */
export interface CollisionState {
  lastCollision: string | null;
  isColliding: boolean;
}

/**
 * 游戏状态
 */
export interface GameState {
  mapData: MapData | null;
  player: PlayerState | null;
  sceneSize: SceneSize | null;
  currentScene: string;
  collision: CollisionState;
  timestamp: number;
}

/**
 * 状态提取器
 * 从游戏中提取状态数据
 */
export class StateExtractor {
  /**
   * 获取完整游戏状态
   */
  async getGameState(page: Page): Promise<GameState | null> {
    return await page.evaluate(() => {
      const getState = (window as unknown as Record<string, unknown>).__GAME_STATE__;
      if (typeof getState === 'function') {
        return getState() as GameState;
      }
      return null;
    });
  }

  /**
   * 获取地图数据
   */
  async getMapData(page: Page): Promise<MapData | null> {
    const state = await this.getGameState(page);
    return state?.mapData || null;
  }

  /**
   * 获取玩家状态
   */
  async getPlayerState(page: Page): Promise<PlayerState | null> {
    const state = await this.getGameState(page);
    return state?.player || null;
  }

  /**
   * 获取场景尺寸
   */
  async getSceneSize(page: Page): Promise<SceneSize | null> {
    const state = await this.getGameState(page);
    return state?.sceneSize || null;
  }

  /**
   * 获取当前场景名称
   */
  async getCurrentScene(page: Page): Promise<string> {
    const state = await this.getGameState(page);
    return state?.currentScene || '';
  }

  /**
   * 获取碰撞状态
   */
  async getCollisionState(page: Page): Promise<CollisionState | null> {
    const state = await this.getGameState(page);
    return state?.collision || null;
  }

  /**
   * 验证地图尺寸
   */
  async verifyMapSize(
    page: Page,
    expectedWidth: number,
    expectedHeight: number
  ): Promise<{ passed: boolean; actual?: { width: number; height: number }; message: string }> {
    const mapData = await this.getMapData(page);

    if (!mapData) {
      return { passed: false, message: '无法获取地图数据' };
    }

    const passed = mapData.width === expectedWidth && mapData.height === expectedHeight;

    return {
      passed,
      actual: { width: mapData.width, height: mapData.height },
      message: passed
        ? `地图尺寸验证通过: ${mapData.width}x${mapData.height}`
        : `地图尺寸不匹配: 期望 ${expectedWidth}x${expectedHeight}, 实际 ${mapData.width}x${mapData.height}`
    };
  }

  /**
   * 验证玩家位置
   */
  async verifyPlayerPosition(
    page: Page,
    expectedTileX?: number,
    expectedTileY?: number
  ): Promise<{ passed: boolean; actual?: PlayerState; message: string }> {
    const playerState = await this.getPlayerState(page);

    if (!playerState) {
      return { passed: false, message: '无法获取玩家状态' };
    }

    if (expectedTileX !== undefined && expectedTileY !== undefined) {
      const passed = playerState.tileX === expectedTileX && playerState.tileY === expectedTileY;
      return {
        passed,
        actual: playerState,
        message: passed
          ? `玩家位置验证通过: (${playerState.tileX}, ${playerState.tileY})`
          : `玩家位置不匹配: 期望 (${expectedTileX}, ${expectedTileY}), 实际 (${playerState.tileX}, ${playerState.tileY})`
      };
    }

    return { passed: true, actual: playerState, message: `玩家位置: (${playerState.tileX}, ${playerState.tileY})` };
  }

  /**
   * 验证玩家速度
   */
  async verifyPlayerSpeed(
    page: Page,
    expectedSpeed: number
  ): Promise<{ passed: boolean; actual?: number; message: string }> {
    const playerState = await this.getPlayerState(page);

    if (!playerState) {
      return { passed: false, message: '无法获取玩家状态' };
    }

    const passed = playerState.speed === expectedSpeed;

    return {
      passed,
      actual: playerState.speed,
      message: passed
        ? `玩家速度验证通过: ${playerState.speed}`
        : `玩家速度不匹配: 期望 ${expectedSpeed}, 实际 ${playerState.speed}`
    };
  }

  /**
   * 验证对角线移动速度
   */
  async verifyDiagonalSpeed(
    page: Page,
    expectedSpeed: number
  ): Promise<{ passed: boolean; actual?: number; message: string }> {
    const playerState = await this.getPlayerState(page);

    if (!playerState) {
      return { passed: false, message: '无法获取玩家状态' };
    }

    // 计算速度向量长度
    const actualSpeed = Math.sqrt(
      playerState.velocity.x ** 2 + playerState.velocity.y ** 2
    );

    // 允许1%误差
    const passed = Math.abs(actualSpeed - expectedSpeed) < expectedSpeed * 0.01;

    return {
      passed,
      actual: actualSpeed,
      message: passed
        ? `对角线速度验证通过: ${actualSpeed.toFixed(2)}`
        : `对角线速度不匹配: 期望 ${expectedSpeed}, 实际 ${actualSpeed.toFixed(2)}`
    };
  }

  /**
   * 查找指定类型的瓦片
   */
  async findTilesByType(
    page: Page,
    tileType: string
  ): Promise<TileData[]> {
    const mapData = await this.getMapData(page);

    if (!mapData) {
      return [];
    }

    const tiles: TileData[] = [];
    for (const row of mapData.tiles) {
      for (const tile of row) {
        if (tile.type === tileType) {
          tiles.push(tile);
        }
      }
    }

    return tiles;
  }

  /**
   * 验证门位置
   */
  async verifyDoorPositions(
    page: Page,
    expectedDoors: Array<{ target: string; x: number; y: number }>
  ): Promise<{ passed: boolean; results: Array<{ target: string; found: boolean }>; message: string }> {
    const doors = await this.findTilesByType(page, 'door');
    const results = expectedDoors.map(expected => {
      const found = doors.some(d =>
        d.x === expected.x &&
        d.y === expected.y &&
        d.properties?.target === expected.target
      );
      return { target: expected.target, found };
    });

    const passed = results.every(r => r.found);
    const foundCount = results.filter(r => r.found).length;

    return {
      passed,
      results,
      message: passed
        ? `所有门位置验证通过: ${foundCount}/${expectedDoors.length}`
        : `门位置验证失败: ${foundCount}/${expectedDoors.length} 通过`
    };
  }
}

// 导出单例
export const stateExtractor = new StateExtractor();
```

- [ ] **Step 2: 验证TypeScript编译**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: 提交**

```bash
git add tests/visual/utils/state-extractor.ts
git commit -m "feat: add StateExtractor utility for visual tests

- Extract game state from window object
- Verify map size, player position, speed
- Find tiles by type
- Verify door positions

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 12: 实现QWEN VL API客户端

**Files:**
- Create: `tests/visual/ai/qwen-vl-client.ts`

**核心功能:**
- 将本地PNG/JPEG图片转换为base64格式
- 调用QWEN VL API进行图像分析
- 支持布局分析和玩家位置分析两种专用方法

**关键接口:**
```typescript
interface QwenVLConfig {
  baseUrl: string;      // 从 QWEN_VL_URL 环境变量读取
  apiKey: string;       // 从 QWEN_VL_KEY 环境变量读取
  modelName: string;    // 从 QWEN_VL_MODEL_NAME 环境变量读取，默认 qwen-vl-max
}

interface ImageAnalysisResponse {
  content: string;      // AI返回的分析内容
  confidence: number;   // 置信度，默认0.85
  processingTime: number;
  requestId: string;
}

// 核心方法
analyzeImage(request: ImageAnalysisRequest): Promise<ImageAnalysisResponse>
analyzeLayout(imagePath: string, expectedElements: string[]): Promise<ImageAnalysisResponse>
analyzePlayerPosition(imagePath: string): Promise<ImageAnalysisResponse>
isConfigured(): boolean  // 验证API Key是否配置
```

**边界条件:**
- API调用失败时抛出Error，包含status和statusText
- 图片不存在时fs.readFileSync会抛出异常
- 未配置API Key时isConfigured返回false

**验收标准:**
- TypeScript编译无错误
- 环境变量正确读取
- API响应格式符合预期

- [ ] **Step 1: 创建文件并实现**
- [ ] **Step 2: 验证TypeScript编译** `npx tsc --noEmit`
- [ ] **Step 3: 提交**

```bash
git add tests/visual/ai/qwen-vl-client.ts
git commit -m "feat: add QWEN VL API client for visual analysis

- Support base64 image conversion
- Analyze layout and player position
- Configurable via environment variables

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 13: 实现GLM API客户端

**Files:**
- Create: `tests/visual/ai/glm-client.ts`

**核心功能:**
- 调用GLM API进行文本生成和综合判断
- 支持测试结果解读、问题诊断、报告生成、改进建议

**关键接口:**
```typescript
interface GLMConfig {
  baseUrl: string;      // 从 GLM_API_BASE 环境变量读取
  apiKey: string;       // 从 GLM_API_KEY 环境变量读取
  modelName: string;    // 从 GLM_MODEL_NAME 环境变量读取
}

interface GLMRequest {
  prompt: string;
  context?: string;     // 上下文信息（如截图分析结果、状态数据）
  maxTokens?: number;
}

interface GLMResponse {
  content: string;
  processingTime: number;
}

// 核心方法
generate(request: GLMRequest): Promise<GLMResponse>
interpretTestResult(testCase: TestCase, screenshotResult: string, stateData: GameState): Promise<string>
diagnoseIssue(testCase: TestCase, errorInfo: string): Promise<string>
generateReport(testResults: TestResult[]): Promise<string>
suggestImprovements(failedTests: TestResult[]): Promise<string>
```

**Prompt规范:**
- interpretTestResult: 输入测试名、截图分析结果、状态数据，输出判定结论和置信度
- diagnoseIssue: 输入失败的测试信息，输出问题根因分析
- generateReport: 输入所有测试结果，输出JSON+Markdown格式报告
- suggestImprovements: 输入失败测试列表，输出具体改进建议

**验收标准:**
- API调用正常返回
- 生成的报告格式符合规范（JSON结构+Markdown可读）

- [ ] **Step 1: 创建文件并实现**
- [ ] **Step 2: 验证TypeScript编译**
- [ ] **Step 3: 提交**

---

## Task 14: 实现AI分析器

**Files:**
- Create: `tests/visual/ai/analyzers/layout-analyzer.ts`
- Create: `tests/visual/ai/analyzers/movement-analyzer.ts`
- Create: `tests/visual/ai/analyzers/result-judge.ts`

**核心功能 - LayoutAnalyzer:**
- 结合截图分析（QWEN VL）+ 状态数据验证布局
- 验证地图尺寸、门位置、建筑占位

**关键接口:**
```typescript
interface LayoutAnalysisResult {
  passed: boolean;
  confidence: number;   // 必须 ≥ 80%
  details: {
    mapSize: { expected: number, actual: number, match: boolean };
    doors: { found: number, expected: number, positions: TileData[] };
    buildings: { name: string, visible: boolean, position: string }[];
  };
  issues: string[];
}

analyzeLayout(screenshotPath: string, stateData: GameState, expectedConfig: LayoutConfig): Promise<LayoutAnalysisResult>
```

**核心功能 - MovementAnalyzer:**
- 分析玩家移动轨迹截图序列
- 验证速度、方向、碰撞

**关键接口:**
```typescript
interface MovementAnalysisResult {
  passed: boolean;
  confidence: number;
  details: {
    speed: { expected: number, actual: number, withinTolerance: boolean };
    diagonalNormalization: boolean;  // 对角线速度是否正确归一化
    collisionDetection: { wallsHit: number, expectedCollisions: number };
    positionSequence: { x: number, y: number }[];
  };
  issues: string[];
}

analyzeMovement(screenshots: string[], stateDataSequence: GameState[]): Promise<MovementAnalysisResult>
```

**核心功能 - ResultJudge:**
- 综合截图分析、状态数据、游戏日志进行最终判定
- 实现三级判定标准

**三级判定标准:**
| 类型 | 定义 | 通过条件 |
|------|------|---------|
| 硬性精确 | 设计文档明确数值 | 必须100%匹配 |
| 软性容忍 | 有±误差范围 | 在误差范围内 |
| 视觉阈值 | AI截图分析判断 | 置信度≥80% |

**关键接口:**
```typescript
interface JudgmentResult {
  passed: boolean;
  judgmentType: 'hard' | 'soft' | 'visual';
  confidence: number;
  evidence: {
    screenshotAnalysis?: string;
    stateVerification?: string;
    logValidation?: string;
  };
  conclusion: string;
}

judge(testCase: TestCase, analysisResults: AnalysisResult[], logs: GameLog[]): Promise<JudgmentResult>
```

**验收标准:**
- 三级判定逻辑正确实现
- 置信度阈值80%正确应用

- [ ] **Step 1: 创建三个分析器文件**
- [ ] **Step 2: 验证TypeScript编译**
- [ ] **Step 3: 提交**

---

## Task 15: 实现报告生成器

**Files:**
- Create: `tests/visual/ai/report-generator.ts`

**核心功能:**
- 收集所有测试结果，生成JSON和Markdown双格式报告
- JSON格式用于程序化处理，Markdown格式用于人工审阅

**报告结构:**
```typescript
interface TestReport {
  meta: {
    phase: string;              // "Phase 1"
    timestamp: string;
    totalTests: number;
    passedTests: number;
    failedTests: number;
    skippedTests: number;
    overallPassed: boolean;     // 全部通过才为true
  };
  results: TestResult[];
  summary: {
    byCategory: Record<string, { passed: number, failed: number }>;
    criticalFailures: string[]; // 必须通过的测试失败列表
  };
  aiFeedback: {
    diagnosis: string;          // GLM诊断结果
    suggestions: string[];      // 改进建议
  };
}

interface TestResult {
  testCaseId: string;
  testCaseName: string;
  category: string;             // layout/movement/scene-switch
  passed: boolean;
  judgmentType: string;
  confidence: number;
  executionTime: number;
  screenshotPaths: string[];
  stateData: GameState;
  logs: string[];
  issues: string[];
}
```

**输出文件:**
- `tests/visual/reports/phase1-report-{timestamp}.json`
- `tests/visual/reports/phase1-report-{timestamp}.md`

**Markdown格式要求:**
- 标题：Phase 1 AI端到端测试报告
- 汇总表格：通过/失败/跳过数量
- 分类结果：按category分组展示
- 失败详情：每个失败测试的问题描述
- AI诊断：GLM生成的诊断和建议

- [ ] **Step 1: 创建报告生成器文件**
- [ ] **Step 2: 验证TypeScript编译**
- [ ] **Step 3: 提交**

---

## Task 16: 实现日志读取器和动作录制器

**Files:**
- Create: `tests/visual/utils/log-reader.ts`
- Create: `tests/visual/utils/action-recorder.ts`

**核心功能 - LogReader:**
- 从浏览器读取游戏日志文件内容
- 解析日志为结构化事件序列

**关键接口:**
```typescript
interface GameLog {
  timestamp: number;
  category: 'scene' | 'player' | 'interaction' | 'error';
  event: string;
  data: Record<string, unknown>;
}

// 方法
readLogs(page: Page): Promise<GameLog[]>
filterLogsByCategory(logs: GameLog[], category: string): GameLog[]
findEventSequence(logs: GameLog[], eventName: string): GameLog[]
verifyEventExists(logs: GameLog[], eventName: string): boolean
```

**日志文件位置:**
- `tests/visual/logs/scene-{timestamp}.log`
- `tests/visual/logs/player-{timestamp}.log`
- `tests/visual/logs/interaction-{timestamp}.log`
- `tests/visual/logs/error-{timestamp}.log`

**核心功能 - ActionRecorder:**
- 录制测试执行过程中的动作序列
- 用于移动测试的轨迹记录

**关键接口:**
```typescript
interface RecordedAction {
  timestamp: number;
  actionType: 'keypress' | 'click' | 'wait';
  actionData: {
    key?: string;
    duration?: number;
  };
  screenshotPath?: string;
  stateSnapshot?: GameState;
}

// 方法
startRecording(page: Page): void
recordKeyAction(key: string, duration?: number): Promise<void>
recordScreenshot(screenshotPath: string): void
stopRecording(): RecordedAction[]
getActionSequence(): RecordedAction[]
```

**验收标准:**
- 日志正确解析为结构化数据
- 动作序列完整记录时间戳和状态

- [ ] **Step 1: 创建两个文件**
- [ ] **Step 2: 验证TypeScript编译**
- [ ] **Step 3: 提交**

---

## Task 17: 实现测试Runner

**Files:**
- Create: `tests/visual/runner.ts`

**核心功能:**
- 测试执行入口，协调所有组件
- 按顺序执行测试用例，收集结果，生成报告

**执行流程:**
1. 启动浏览器和游戏
2. 遍历测试用例列表
3. 对每个测试：
   - 采集截图
   - 提取状态数据
   - 读取游戏日志
   - 调用AI分析器
   - 记录结果
4. 生成最终报告

**关键接口:**
```typescript
interface TestRunnerConfig {
  testCases: TestCase[];        // 要执行的测试列表
  outputDirectory: string;      // 输出目录
  parallel?: boolean;           // 是否并行执行（默认false）
}

interface TestCase {
  id: string;
  name: string;
  category: string;
  judgmentType: 'hard' | 'soft' | 'visual';
  execute: (page: Page) => Promise<void>;  // 测试执行函数
  verify: (state: GameState, logs: GameLog[]) => Promise<boolean>;
}

// 方法
run(config: TestRunnerConfig): Promise<TestReport>
runSingle(testCase: TestCase): Promise<TestResult>
collectResults(): TestResult[]
generateFinalReport(): Promise<void>
```

**验收标准:**
- 测试按顺序执行
- 每个测试结果正确记录
- 报告正确生成

- [ ] **Step 1: 创建Runner文件**
- [ ] **Step 2: 验证TypeScript编译**
- [ ] **Step 3: 提交**

---

## Task 18: 配置npm脚本和Playwright

**Files:**
- Modify: `package.json`
- Modify: `playwright.config.ts`

**package.json添加脚本:**
```json
{
  "scripts": {
    "test:visual-phase1": "playwright test tests/visual --config=playwright.config.ts",
    "test:visual-debug": "playwright test tests/visual --debug",
    "test:visual-report": "node tests/visual/runner.ts --report-only"
  }
}
```

**playwright.config.ts添加配置:**
```typescript
{
  testDir: 'tests/visual',
  testMatch: '**/*.spec.ts',
  timeout: 60000,           // 单个测试60秒
  retries: 0,               // AI测试不重试
  use: {
    baseURL: 'http://localhost:5173',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure'
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: true
  }
}
```

**验收标准:**
- npm脚本正确执行
- Playwright配置加载成功

- [ ] **Step 1: 修改package.json**
- [ ] **Step 2: 修改playwright.config.ts**
- [ ] **Step 3: 验证配置** `npm run test:visual-phase1 -- --list`
- [ ] **Step 4: 提交**

---

## Task 19: 实现布局测试规格

**Files:**
- Create: `tests/visual/layout/map-layout.spec.ts`
- Create: `tests/visual/layout/indoor-layout.spec.ts`

**测试用例 - MapLayoutSpec:**

| 测试ID | 测试名称 | 判定类型 | 验收标准 |
|--------|---------|---------|---------|
| T-V001 | 地图尺寸40x30 | 硬性精确 | width=40, height=30 |
| T-V002 | 十字形路径布局 | 视觉阈值 | AI识别十字路径，置信度≥80% |
| T-V003 | 建筑占位数量3 | 硬性精确 | 诊所、药园、家三个建筑 |
| T-V004 | 门位置正确 | 硬性精确 | 每个建筑门口瓦片坐标匹配设计 |
| T-V005 | 边界墙壁完整 | 视觉阈值 | 四周墙壁无缺口 |

**关键验证点:**
```typescript
// T-V001: 从GameState提取mapData验证
expect(state.mapData.width).toBe(40);
expect(state.mapData.height).toBe(30);

// T-V004: 门位置硬性验证
const expectedDoors = [
  { target: 'clinic', x: 14, y: 4 },
  { target: 'garden', x: 26, y: 10 },
  { target: 'home', x: 34, y: 18 }
];
// 对比实际门瓦片数据

// T-V002, T-V005: QWEN VL截图分析
const analysis = await qwenVLClient.analyzeLayout(screenshot, [
  '十字形路径', '建筑占位', '边界墙壁'
]);
expect(analysis.confidence).toBeGreaterThanOrEqual(0.8);
```

**测试用例 - IndoorLayoutSpec:**

| 测试ID | 测试名称 | 判定类型 | 验收标准 |
|--------|---------|---------|---------|
| T-V006 | 青木诊所15x12 | 硬性精确 | width=15, height=12 |
| T-V007 | 诊台和药柜位置 | 视觉阈值 | AI识别诊台药柜 |
| T-V008 | 老张药园20x15 | 硬性精确 | width=20, height=15 |
| T-V009 | 4个药田布局 | 硬性精确 | 药田瓦片数量=4 |
| T-V010 | 玩家之家12x10 | 硬性精确 | width=12, height=10 |
| T-V011 | 三个区域划分 | 视觉阈值 | 厨房书房卧室可见 |

**验收标准:**
- 所有硬性精确测试100%匹配
- 视觉阈值测试置信度≥80%
- 日志记录SCENE_CREATE事件

- [ ] **Step 1: 创建map-layout.spec.ts**
- [ ] **Step 2: 创建indoor-layout.spec.ts**
- [ ] **Step 3: 验证测试可执行**
- [ ] **Step 4: 提交**

---

## Task 20: 实现移动测试规格

**Files:**
- Create: `tests/visual/movement/player-movement.spec.ts`
- Create: `tests/visual/movement/collision.spec.ts`

**测试用例 - PlayerMovementSpec:**

| 测试ID | 测试名称 | 判定类型 | 验收标准 |
|--------|---------|---------|---------|
| T-V012 | 玩家初始位置 | 硬性精确 | 出生点在地图中心 |
| T-V013 | 方向键移动 | 软性容忍 | 按键后位置变化，速度≈150 |
| T-V014 | WASD移动 | 软性容忍 | WASD等效方向键 |
| T-V015 | 对角线速度归一化 | 硬性精确 | 速度向量长度=150×0.707 |
| T-V016 | 停止响应 | 硬性精确 | 松开键后velocity归零 |

**关键验证点:**
```typescript
// T-V015: 对角线移动速度验证
await page.keyboard.press('ArrowUp');
await page.keyboard.press('ArrowRight');
await page.waitForTimeout(100);
const state = await stateExtractor.getPlayerState(page);
const speed = Math.sqrt(state.velocity.x**2 + state.velocity.y**2);
expect(speed).toBeCloseTo(150 * 0.707, 1); // 允许±1误差

// T-V016: 停止验证
await page.keyboard.up('ArrowUp');
await page.keyboard.up('ArrowRight');
await page.waitForTimeout(50);
expect(state.velocity.x).toBe(0);
expect(state.velocity.y).toBe(0);
```

**测试用例 - CollisionSpec:**

| 测试ID | 测试名称 | 判定类型 | 验收标准 |
|--------|---------|---------|---------|
| T-V017 | 墙壁碰撞检测 | 硬性精确 | 碰撞时位置不越过边界 |
| T-V018 | 门瓦片可通行 | 硬性精确 | 门位置无碰撞阻挡 |
| T-V019 | 室内边界碰撞 | 硬性精确 | 室内墙壁碰撞有效 |

**验收标准:**
- 碰撞日志记录PLAYER_COLLIDE事件
- 位置不越过碰撞边界
- 门位置player可自由移动

- [ ] **Step 1: 创建player-movement.spec.ts**
- [ ] **Step 2: 创建collision.spec.ts**
- [ ] **Step 3: 验证测试可执行**
- [ ] **Step 4: 提交**

---

## Task 21: 实现场景切换测试规格

**Files:**
- Create: `tests/visual/scene-switch/door-interaction.spec.ts`

**测试用例 - DoorInteractionSpec:**

| 测试ID | 测试名称 | 判定类型 | 验收标准 |
|--------|---------|---------|---------|
| T-V020 | 门交互提示 | 视觉阈值 | 靠近门时显示交互提示 |
| T-V021 | 空格键进入建筑 | 硬性精确 | 按空格后currentScene切换 |
| T-V022 | 出生点正确 | 硬性精确 | 进入后player位置在室内门口 |
| T-V023 | 空格键退出建筑 | 硬性精确 | 从室内按空格回到室外 |

**关键验证点:**
```typescript
// T-V021: 场景切换验证
// 1. 移动玩家到门口
await movePlayerToDoor(page, 'clinic');
// 2. 按空格
await page.keyboard.press('Space');
await page.waitForTimeout(500);
// 3. 检查当前场景
const currentScene = await stateExtractor.getCurrentScene(page);
expect(currentScene).toBe('ClinicScene');

// T-V022: 出生点验证
const playerState = await stateExtractor.getPlayerState(page);
// 诊所门口出生点应在室内入口位置
expect(playerState.tileX).toBe(expectedSpawnX);
expect(playerState.tileY).toBe(expectedSpawnY);

// 日志验证
const logs = await logReader.readLogs(page);
expect(logReader.findEventSequence(logs, 'SCENE_SWITCH')).toBeTruthy();
```

**验收标准:**
- 日志包含DOOR_INTERACT和SCENE_SWITCH事件
- 场景名称正确切换
- 玩家出生点位置正确
- 防抖处理有效（空格键不重复触发）

- [ ] **Step 1: 创建door-interaction.spec.ts**
- [ ] **Step 2: 验证测试可执行**
- [ ] **Step 3: 提交**

---

## 任务执行顺序

**推荐执行顺序（按依赖关系）：**

| 执行批次 | Tasks | 说明 |
|---------|-------|------|
| Batch 1 | Task 1-4 | 基础系统（EventBus、Logger、StateBridge） |
| Batch 2 | Task 5-8 | 场景事件集成 |
| Batch 3 | Task 9-11 | 测试工具（Launcher、Screenshot、State） |
| Batch 4 | Task 12-15 | AI模块 |
| Batch 5 | Task 16-18 | 辅助工具和配置 |
| Batch 6 | Task 19-21 | 测试规格 |

**验收流程：**

1. 完成所有Tasks后执行 `npm run test:visual-phase1`
2. 检查生成的报告：`tests/visual/reports/phase1-report-{timestamp}.json`
3. 确认所有33项验收标准通过
4. Phase 1验收完成

---

**计划编写完成。共21个Tasks，覆盖日志系统、状态接口、测试工具、AI分析、测试规格全部内容。**
```