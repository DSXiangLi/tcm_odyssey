# 药灵山谷 Phase 1 测试计划

**版本**: v1.0
**日期**: 2026-04-05
**测试范围**: Phase 1 MVP 功能

---

## 一、测试策略概述

### 1.1 测试层次

```
┌─────────────────────────────────────────────────────┐
│              AI端到端测试 (多模态验证)                 │
│         - 视觉验证、游戏流程完整性检查                  │
├─────────────────────────────────────────────────────┤
│              E2E测试 (Playwright)                     │
│         - 用户交互流程、场景切换                       │
├─────────────────────────────────────────────────────┤
│              集成测试 (场景级)                         │
│         - 场景加载、玩家-场景交互                      │
├─────────────────────────────────────────────────────┤
│              单元测试 (函数级)                         │
│         - Player实体、SceneManager逻辑               │
└─────────────────────────────────────────────────────┘
```

### 1.2 测试类型分配

| 测试类型 | 工具 | 自动化程度 | 责任人 |
|----------|------|------------|--------|
| 单元测试 | Vitest | 100% | CI/CD |
| 集成测试 | Vitest + Phaser Test | 100% | CI/CD |
| E2E测试 | Playwright | 100% | CI/CD |
| 回归测试 | 全套测试 | 100% | CI/CD |
| AI视觉测试 | 多模态LLM | 半自动 | 人工触发 |

---

## 二、回归测试套件

### 2.1 构建验证测试 (BVT)

每次代码提交自动运行：

```typescript
// tests/regression/build.spec.ts
describe('Build Validation Tests', () => {
  test('TypeScript编译成功', async () => {
    const result = await execCommand('npx tsc --noEmit');
    expect(result.exitCode).toBe(0);
  });

  test('Vite构建成功', async () => {
    const result = await execCommand('npm run build');
    expect(result.exitCode).toBe(0);
  });

  test('生成正确的输出文件', async () => {
    await execCommand('npm run build');
    expect(fs.existsSync('dist/index.html')).toBe(true);
    expect(fs.existsSync('dist/assets')).toBe(true);
  });
});
```

### 2.2 核心功能回归测试

**2.2.1 场景加载回归**

```typescript
// tests/regression/scene-loading.spec.ts
describe('场景加载回归测试', () => {
  const scenes = ['TitleScene', 'BootScene', 'TownOutdoorScene',
                  'ClinicScene', 'GardenScene', 'HomeScene'];

  scenes.forEach(sceneName => {
    test(`${sceneName} 可以正常实例化`, () => {
      const game = new Phaser.Game(testConfig);
      const scene = game.scene.getScene(sceneName);
      expect(scene).toBeDefined();
      game.destroy(true);
    });
  });
});
```

**2.2.2 玩家实体回归**

```typescript
// tests/regression/player.spec.ts
describe('Player实体回归测试', () => {
  test('Player构造函数正常', () => {
    const mockScene = createMockScene();
    const player = new Player({ scene: mockScene, x: 100, y: 100 });
    expect(player.x).toBe(100);
    expect(player.y).toBe(100);
    expect(player.speed).toBe(150);
  });

  test('移动功能正常', () => {
    const player = createTestPlayer();
    player.move({ x: 1, y: 0 });
    expect(player.body.velocity.x).toBeGreaterThan(0);
  });

  test('对角线移动速度标准化', () => {
    const player = createTestPlayer();
    player.move({ x: 1, y: 1 });
    const speed = Math.sqrt(
      player.body.velocity.x ** 2 +
      player.body.velocity.y ** 2
    );
    expect(speed).toBeCloseTo(150, 1);
  });
});
```

**2.2.3 碰撞系统回归**

```typescript
// tests/regression/collision.spec.ts
describe('碰撞检测回归测试', () => {
  test('玩家不能穿过墙壁', () => {
    const game = createTestGame();
    const player = getPlayer(game);
    const initialX = player.x;

    // 尝试向墙壁移动
    simulateInput('left', 1000);
    game.loop.tick();

    expect(player.x).toBe(initialX);
  });

  test('玩家可以在草地上移动', () => {
    const game = createTestGame();
    const player = getPlayer(game);
    player.x = 400; // 草地位置
    player.y = 400;

    const initialX = player.x;
    simulateInput('right', 500);
    game.loop.tick();

    expect(player.x).toBeGreaterThan(initialX);
  });
});
```

### 2.3 输入系统回归

```typescript
// tests/regression/input.spec.ts
describe('输入系统回归测试', () => {
  test('方向键移动响应', () => {
    const player = createTestPlayer();
    const initialX = player.x;

    simulateKeyDown('ArrowRight');
    player.update();

    expect(player.x).toBeGreaterThan(initialX);
  });

  test('WASD移动响应', () => {
    const player = createTestPlayer();
    const initialY = player.y;

    simulateKeyDown('KeyW');
    player.update();

    expect(player.y).toBeLessThan(initialY);
  });

  test('空格键门交互', () => {
    const game = createTestGame();
    const player = getPlayer(game);

    // 移动到门位置
    player.x = DOOR_X;
    player.y = DOOR_Y;

    simulateKeyDown('Space');
    game.loop.tick();

    expect(game.scene.isActive('ClinicScene')).toBe(true);
  });
});
```

---

## 三、正确性测试

### 3.1 地图生成正确性

```typescript
// tests/correctness/map-generation.spec.ts
describe('地图生成正确性测试', () => {
  test('TownOutdoorScene地图尺寸正确', () => {
    const scene = createTownOutdoorScene();
    expect(scene.mapData.width).toBe(40);
    expect(scene.mapData.height).toBe(30);
  });

  test('十字路径正确生成', () => {
    const scene = createTownOutdoorScene();
    const centerX = 20;
    const centerY = 15;

    // 验证中心路径
    expect(scene.mapData.tiles[centerY][centerX].type).toBe('path');
    expect(scene.mapData.tiles[centerY - 1][centerX].type).toBe('path');
    expect(scene.mapData.tiles[centerY][centerX - 1].type).toBe('path');
  });

  test('建筑位置正确', () => {
    const scene = createTownOutdoorScene();

    // 诊所应该在左上区域
    expect(scene.mapData.tiles[5][7].type).toBe('door');
    expect(scene.mapData.tiles[5][7].properties?.target).toBe('clinic');

    // 药园应该在右上区域
    expect(scene.mapData.tiles[5][33].type).toBe('door');
    expect(scene.mapData.tiles[5][33].properties?.target).toBe('garden');

    // 家应该在左下区域
    expect(scene.mapData.tiles[27][6].type).toBe('door');
    expect(scene.mapData.tiles[27][6].properties?.target).toBe('home');
  });

  test('边界墙正确', () => {
    const scene = createTownOutdoorScene();

    // 检查四个边界
    for (let x = 0; x < 40; x++) {
      expect(scene.mapData.tiles[0][x].type).toBe('wall');
      expect(scene.mapData.tiles[29][x].type).toBe('wall');
    }
    for (let y = 0; y < 30; y++) {
      expect(scene.mapData.tiles[y][0].type).toBe('wall');
      expect(scene.mapData.tiles[y][39].type).toBe('wall');
    }
  });
});
```

### 3.2 室内场景正确性

```typescript
// tests/correctness/indoor-scenes.spec.ts
describe('室内场景正确性测试', () => {
  describe('ClinicScene', () => {
    test('房间尺寸正确', () => {
      const scene = createClinicScene();
      expect(scene.roomWidth).toBe(15);
      expect(scene.roomHeight).toBe(12);
    });

    test('玩家出生点在中心', () => {
      const scene = createClinicScene();
      const player = scene.player;

      const centerX = Math.floor(15 / 2) * TILE_SIZE + TILE_SIZE / 2;
      const centerY = Math.floor(12 / 2) * TILE_SIZE + TILE_SIZE / 2;

      expect(player.x).toBeCloseTo(centerX, 1);
      expect(player.y).toBeCloseTo(centerY, 1);
    });
  });

  describe('GardenScene', () => {
    test('药田数量正确', () => {
      const scene = createGardenScene();
      const plots = scene.children.list.filter(
        child => child.getData('type') === 'herbPlot'
      );
      expect(plots.length).toBe(4);
    });
  });

  describe('HomeScene', () => {
    test('功能区域存在', () => {
      const scene = createHomeScene();
      const areas = ['kitchen', 'study', 'bedroom'];

      areas.forEach(area => {
        const element = scene.children.list.find(
          child => child.getData('area') === area
        );
        expect(element).toBeDefined();
      });
    });
  });
});
```

### 3.3 场景切换正确性

```typescript
// tests/correctness/scene-transition.spec.ts
describe('场景切换正确性测试', () => {
  test('从标题到游戏的流程', async () => {
    const game = await startGame();

    // 初始在标题场景
    expect(game.scene.isActive('TitleScene')).toBe(true);

    // 点击开始按钮
    await clickStartButton(game);
    await waitFor(1000);

    // 应该进入BootScene然后TownOutdoorScene
    expect(game.scene.isActive('TownOutdoorScene')).toBe(true);
  });

  test('进入诊所', async () => {
    const game = await startInTown();
    const player = getPlayer(game);

    // 移动到诊所门
    player.x = CLINIC_DOOR_X;
    player.y = CLINIC_DOOR_Y;

    await pressSpace();
    await waitFor(500);

    expect(game.scene.isActive('ClinicScene')).toBe(true);
  });

  test('返回城镇出生点正确', async () => {
    const game = await startInClinic();
    await pressSpace();
    await waitFor(500);

    expect(game.scene.isActive('TownOutdoorScene')).toBe(true);

    const player = getPlayer(game);
    expect(player.x).toBeCloseTo(CLINIC_EXIT_X, 1);
    expect(player.y).toBeCloseTo(CLINIC_EXIT_Y, 1);
  });

  test('每个建筑的入口和出口', async () => {
    const buildings = [
      { name: 'clinic', doorX: 7, doorY: 9, exitX: 7, exitY: 10 },
      { name: 'garden', doorX: 33, doorY: 9, exitX: 33, exitY: 10 },
      { name: 'home', doorX: 6, doorY: 27, exitX: 6, exitY: 28 }
    ];

    for (const building of buildings) {
      const game = await startInTown();
      const player = getPlayer(game);

      // 进入建筑
      player.x = building.doorX * TILE_SIZE;
      player.y = building.doorY * TILE_SIZE;
      await pressSpace();
      await waitFor(500);

      expect(game.scene.isActive(`${building.name}Scene`)).toBe(true);

      // 离开建筑
      await pressSpace();
      await waitFor(500);

      expect(game.scene.isActive('TownOutdoorScene')).toBe(true);
      expect(Math.round(player.x / TILE_SIZE)).toBe(building.exitX);
      expect(Math.round(player.y / TILE_SIZE)).toBe(building.exitY);
    }
  });
});
```

### 3.4 玩家行为正确性

```typescript
// tests/correctness/player-behavior.spec.ts
describe('玩家行为正确性测试', () => {
  test('移动速度正确', () => {
    const player = createTestPlayer();
    player.move({ x: 1, y: 0 });

    expect(Math.abs(player.body.velocity.x)).toBeCloseTo(150, 1);
    expect(player.body.velocity.y).toBeCloseTo(0, 1);
  });

  test('对角线移动速度标准化', () => {
    const player = createTestPlayer();
    player.move({ x: 1, y: 1 });

    const expectedDiagonalSpeed = 150 * Math.SQRT1_2;
    expect(player.body.velocity.x).toBeCloseTo(expectedDiagonalSpeed, 1);
    expect(player.body.velocity.y).toBeCloseTo(expectedDiagonalSpeed, 1);
  });

  test('停止移动正确', () => {
    const player = createTestPlayer();
    player.move({ x: 1, y: 0 });
    player.stop();

    expect(player.body.velocity.x).toBe(0);
    expect(player.body.velocity.y).toBe(0);
  });

  test('瓦片位置计算正确', () => {
    const player = createTestPlayer();
    player.x = 5 * TILE_SIZE + TILE_SIZE / 2; // 瓦片5的中心
    player.y = 10 * TILE_SIZE + TILE_SIZE / 2; // 瓦片10的中心

    const tilePos = player.getTilePosition();

    expect(tilePos.x).toBe(5);
    expect(tilePos.y).toBe(10);
  });

  test('最后方向记录正确', () => {
    const player = createTestPlayer();

    player.move({ x: 1, y: 0 });
    expect(player.getLastDirection()).toEqual({ x: 1, y: 0 });

    player.move({ x: 0, y: -1 });
    expect(player.getLastDirection()).toEqual({ x: 0, y: -1 });
  });
});
```

---

## 四、方案一致性测试

### 4.1 设计文档对照测试

```typescript
// tests/conformance/design-spec.spec.ts
describe('设计文档一致性测试', () => {
  const designSpec = require('../../docs/superpowers/specs/2026-04-05-game-design-v3.0.md');

  describe('场景系统', () => {
    test('室外地图尺寸符合设计', () => {
      // 设计文档: 40x30瓦片
      const scene = createTownOutdoorScene();
      expect(scene.mapData.width).toBe(40);
      expect(scene.mapData.height).toBe(30);
    });

    test('青木诊所尺寸符合设计', () => {
      // 设计文档: 15x12瓦片
      const scene = createClinicScene();
      expect(scene.roomWidth).toBe(15);
      expect(scene.roomHeight).toBe(12);
    });

    test('老张药园尺寸符合设计', () => {
      // 设计文档: 20x15瓦片
      const scene = createGardenScene();
      expect(scene.roomWidth).toBe(20);
      expect(scene.roomHeight).toBe(15);
    });

    test('玩家之家尺寸符合设计', () => {
      // 设计文档: 12x10瓦片
      const scene = createHomeScene();
      expect(scene.roomWidth).toBe(12);
      expect(scene.roomHeight).toBe(10);
    });
  });

  describe('瓦片系统', () => {
    test('瓦片尺寸符合设计', () => {
      // 设计文档: 32x32像素
      expect(TILE_SIZE).toBe(32);
    });
  });

  describe('玩家系统', () => {
    test('玩家移动速度符合设计', () => {
      // 设计文档: PLAYER_SPEED = 150
      expect(PLAYER_SPEED).toBe(150);
    });

    test('无时间/体力限制', () => {
      // 设计文档: 无时间/体力限制
      const game = createTestGame();
      const player = getPlayer(game);

      expect(player.stamina).toBeUndefined();
      expect(player.timeLimit).toBeUndefined();
    });
  });

  describe('场景名称一致性', () => {
    test('SCENES常量包含所有场景', () => {
      const requiredScenes = ['TITLE', 'BOOT', 'TOWN_OUTDOOR', 'CLINIC', 'GARDEN', 'HOME'];

      requiredScenes.forEach(scene => {
        expect(SCENES[scene]).toBeDefined();
      });
    });

    test('场景键值正确', () => {
      expect(SCENES.TITLE).toBe('TitleScene');
      expect(SCENES.BOOT).toBe('BootScene');
      expect(SCENES.TOWN_OUTDOOR).toBe('TownOutdoorScene');
      expect(SCENES.CLINIC).toBe('ClinicScene');
      expect(SCENES.GARDEN).toBe('GardenScene');
      expect(SCENES.HOME).toBe('HomeScene');
    });
  });
});
```

### 4.2 实现计划对照测试

```typescript
// tests/conformance/implementation-plan.spec.ts
describe('实现计划一致性测试', () => {
  test('文件结构符合计划', () => {
    const expectedFiles = [
      'src/main.ts',
      'src/config/game.config.ts',
      'src/data/constants.ts',
      'src/scenes/TitleScene.ts',
      'src/scenes/BootScene.ts',
      'src/scenes/TownOutdoorScene.ts',
      'src/scenes/ClinicScene.ts',
      'src/scenes/GardenScene.ts',
      'src/scenes/HomeScene.ts',
      'src/entities/Player.ts',
      'src/systems/SceneManager.ts'
    ];

    expectedFiles.forEach(file => {
      expect(fs.existsSync(file)).toBe(true);
    });
  });

  test('Phaser配置正确', () => {
    const config = gameConfig;

    expect(config.type).toBe(Phaser.AUTO);
    expect(config.width).toBe(800);
    expect(config.height).toBe(600);
    expect(config.pixelArt).toBe(true);
    expect(config.physics.default).toBe('arcade');
  });
});
```

### 4.3 Phase 1 完成检查清单验证

```typescript
// tests/conformance/phase1-checklist.spec.ts
describe('Phase 1 完成检查清单', () => {
  test('项目可以启动运行', async () => {
    const game = await startGame();
    expect(game.isRunning).toBe(true);
    game.destroy(true);
  });

  test('显示标题画面', async () => {
    const game = await startGame();
    expect(game.scene.isActive('TitleScene')).toBe(true);
    game.destroy(true);
  });

  test('玩家可以在室外地图移动', async () => {
    const game = await startInTown();
    const player = getPlayer(game);
    const initialX = player.x;

    simulateInput('right', 500);
    game.loop.tick();

    expect(player.x).toBeGreaterThan(initialX);
    game.destroy(true);
  });

  test('玩家可以进入室内场景', async () => {
    const buildings = ['ClinicScene', 'GardenScene', 'HomeScene'];

    for (const building of buildings) {
      const game = await startAtBuildingDoor(building);
      await pressSpace();

      expect(game.scene.isActive(building)).toBe(true);
      game.destroy(true);
    }
  });

  test('玩家不能穿过墙壁', async () => {
    const game = await startInTown();
    const player = getPlayer(game);

    // 放置在墙边
    player.x = TILE_SIZE; // 左墙旁边
    const initialX = player.x;

    simulateInput('left', 1000);
    game.loop.tick();

    expect(player.x).toBe(initialX);
    game.destroy(true);
  });

  test('所有输入响应正常', async () => {
    const inputs = [
      { key: 'ArrowUp', direction: 'up' },
      { key: 'ArrowDown', direction: 'down' },
      { key: 'ArrowLeft', direction: 'left' },
      { key: 'ArrowRight', direction: 'right' },
      { key: 'KeyW', direction: 'up' },
      { key: 'KeyA', direction: 'left' },
      { key: 'KeyS', direction: 'down' },
      { key: 'KeyD', direction: 'right' }
    ];

    for (const input of inputs) {
      const player = createTestPlayer();
      const initialPos = { x: player.x, y: player.y };

      simulateKeyDown(input.key);
      player.update();

      const moved = player.x !== initialPos.x || player.y !== initialPos.y;
      expect(moved).toBe(true);
    }
  });
});
```

---

## 五、AI端到端测试 (功能性验证)

> **设计规范**: 详见 [Phase 1 AI端到端测试设计规范](../specs/2026-04-05-phase1-ai-e2e-test-design.md)
>
> 本节将设计规范转换为具体可执行的实现任务和测试用例。

### 5.0 前置依赖实现任务

**在执行AI端到端测试前，必须完成以下游戏系统实现：**

#### 5.0.1 日志系统实现

| 任务ID | 任务描述 | 文件 | 状态 |
|--------|---------|------|------|
| LOG-001 | 创建EventBus事件总线 | `src/systems/EventBus.ts` | ✅ |
| LOG-002 | 定义GameEvents事件常量 | `src/systems/EventBus.ts` | ✅ |
| LOG-003 | 创建GameLogger日志收集器 | `src/utils/GameLogger.ts` | ✅ |
| LOG-004 | 实现分文件日志导出功能 | `src/utils/GameLogger.ts` | ✅ |
| LOG-005 | 在Player中添加事件发送 | `src/entities/Player.ts` | ✅ |
| LOG-006 | 在各Scene中添加事件发送 | `src/scenes/*.ts` | ✅ |
| LOG-007 | 在SceneManager中添加事件发送 | `src/systems/SceneManager.ts` | ⏳ |

**EventBus事件定义**:
```typescript
// src/systems/EventBus.ts
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
```

**日志文件输出**:
| 类别 | 文件名 | 内容 |
|------|--------|------|
| scene | `scene-{timestamp}.log` | 场景生命周期、切换记录 |
| player | `player-{timestamp}.log` | 移动、碰撞、位置变化 |
| interaction | `interaction-{timestamp}.log` | 门交互、按键事件 |
| error | `error-{timestamp}.log` | 异常、警告、失败操作 |

#### 5.0.2 状态暴露接口实现

| 任务ID | 任务描述 | 实现方式 | 状态 |
|--------|---------|---------|------|
| STATE-001 | 暴露地图瓦片数据 | `window.__GAME_STATE__.mapData` | ✅ |
| STATE-002 | 暴露玩家位置数据 | `window.__GAME_STATE__.player` | ✅ |
| STATE-003 | 暴露场景尺寸数据 | `window.__GAME_STATE__.sceneSize` | ✅ |
| STATE-004 | 暴露当前场景名称 | `window.__GAME_STATE__.currentScene` | ✅ |
| STATE-005 | 暴露碰撞检测结果 | `window.__GAME_STATE__.collision` | ✅ |

**状态接口结构**:
```typescript
// 挂载到 window.__GAME_STATE__
interface GameStateForTest {
  mapData: {
    width: number;
    height: number;
    tiles: TileData[][];
  };
  player: {
    x: number;
    y: number;
    tileX: number;
    tileY: number;
    speed: number;
    velocity: { x: number; y: number };
  };
  sceneSize: {
    width: number;
    height: number;
  };
  currentScene: string;
  collision: {
    lastCollision: string | null;
    isColliding: boolean;
  };
  timestamp: number;
}
```

#### 5.0.3 测试目录结构创建

| 任务ID | 任务描述 | 路径 | 状态 |
|--------|---------|------|------|
| DIR-001 | 创建visual测试根目录 | `tests/visual/` | ✅ |
| DIR-002 | 创建布局测试目录 | `tests/visual/layout/` | ✅ |
| DIR-003 | 创建移动测试目录 | `tests/visual/movement/` | ✅ |
| DIR-004 | 创建场景切换测试目录 | `tests/visual/scene-switch/` | ✅ |
| DIR-005 | 创建报告输出目录 | `tests/visual/reports/` | ✅ |
| DIR-006 | 创建日志采集目录 | `tests/visual/logs/` | ✅ |
| DIR-007 | 创建截图存储目录 | `tests/visual/screenshots/` | ✅ |
| DIR-008 | 创建动作序列帧目录 | `tests/visual/screenshots/sequences/` | ✅ |

### 5.1 测试脚本实现任务

#### 5.1.1 核心测试工具实现

| 任务ID | 任务描述 | 文件 | 状态 |
|--------|---------|------|------|
| TOOL-001 | 实现游戏启动器 | `tests/visual/utils/game-launcher.ts` | ✅ |
| TOOL-002 | 实现截图采集器 | `tests/visual/utils/screenshot-capture.ts` | ✅ |
| TOOL-003 | 实现状态提取器 | `tests/visual/utils/state-extractor.ts` | ✅ |
| TOOL-004 | 实现日志读取器 | `tests/visual/utils/log-reader.ts` | ✅ |
| TOOL-005 | 实现动作序列录制器 | `tests/visual/utils/action-recorder.ts` | ⏳ |

#### 5.1.2 AI分析模块实现

| 任务ID | 任务描述 | 文件 | 状态 |
|--------|---------|------|------|
| AI-001 | 实现QWEN VL API调用封装 | `tests/visual/ai/qwen-vl-client.ts` | ✅ |
| AI-002 | 实现GLM API调用封装 | `tests/visual/ai/glm-client.ts` | ✅ |
| AI-003 | 实现截图分析器（布局判断） | `tests/visual/ai/analyzers/layout-analyzer.ts` | ⏳ |
| AI-004 | 实现移动分析器（流畅性判断） | `tests/visual/ai/analyzers/movement-analyzer.ts` | ⏳ |
| AI-005 | 实现综合判断器（结果生成） | `tests/visual/ai/analyzers/result-judge.ts` | ✅ |
| AI-006 | 实现报告生成器 | `tests/visual/ai/report-generator.ts` | ✅ |

### 5.2 测试用例执行清单

**执行命令**: `npm run test:visual-phase1`

#### 5.2.1 布局验证测试 (`tests/visual/layout/`)

| 测试ID | 测试项 | 判定类型 | 验证方式 | 验收标准 | 状态 |
|--------|-------|---------|---------|---------|------|
| T-V001 | 地图尺寸40x30 | 硬性精确 | STATE-001 | width=40, height=30 | ⏳ |
| T-V002 | 十字路径布局 | 状态+视觉 | STATE-001 + AI-003 | 路径瓦片位置正确 + 置信度≥80% | ⏳ |
| T-V003 | 诊所门位置 | 硬性精确 | STATE-001 | door at (7, 9) target=clinic | ⏳ |
| T-V004 | 药园门位置 | 硬性精确 | STATE-001 | door at (33, 9) target=garden | ⏳ |
| T-V005 | 家门位置 | 硬性精确 | STATE-001 | door at (6, 27) target=home | ⏳ |
| T-V006 | 边界墙壁完整 | 状态+视觉 | STATE-001 + AI-003 | 边界瓦片正确 + 置信度≥80% | ⏳ |

#### 5.2.2 移动验证测试 (`tests/visual/movement/`)

| 测试ID | 测试项 | 判定类型 | 验证方式 | 验收标准 | 状态 |
|--------|-------|---------|---------|---------|------|
| T-V007 | 方向键移动响应 | 日志+序列 | LOG-005 + TOOL-005 | 移动事件记录 + 动作流畅 | ⏳ |
| T-V008 | WASD移动响应 | 日志+序列 | LOG-005 + TOOL-005 | 移动事件记录 + 动作流畅 | ⏳ |
| T-V009 | 对角线速度标准化 | 硬性精确 | STATE-002 | velocity magnitude = 150 (√2校正) | ⏳ |
| T-V010 | 墙壁碰撞阻断 | 状态+日志 | STATE-005 + LOG-005 | 碰撞时位置不变 + 事件记录 | ⏳ |
| T-V011 | 碰撞后无法移动 | 状态+日志 | STATE-002 + LOG-005 | 碰撞期间velocity=0 | ⏳ |

#### 5.2.3 场景切换测试 (`tests/visual/scene-switch/`)

| 测试ID | 测试项 | 判定类型 | 验证方式 | 验收标准 | 状态 |
|--------|-------|---------|---------|---------|------|
| T-V012 | 进入诊所 | 日志+截图 | LOG-003 + TOOL-002 | scene:switch事件 + 截图对比 | ⏳ |
| T-V013 | 进入药园 | 日志+截图 | LOG-003 + TOOL-002 | scene:switch事件 + 截图对比 | ⏳ |
| T-V014 | 进入家 | 日志+截图 | LOG-003 + TOOL-002 | scene:switch事件 + 截图对比 | ⏳ |
| T-V015 | 室内门退出 | 日志+截图 | LOG-003 + TOOL-002 | door:exit事件 + 截图对比 | ⏳ |
| T-V016 | 出生点位置正确 | 硬性精确 | STATE-002 | 返回后player位置正确 | ⏳ |
| T-V017 | 空格键防抖 | 日志验证 | LOG-003 | 无连续scene:switch事件 | ⏳ |

#### 5.2.4 室内场景验证测试

| 测试ID | 测试项 | 判定类型 | 验证方式 | 验收标准 | 状态 |
|--------|-------|---------|---------|---------|------|
| T-V018 | 诊所尺寸15x12 | 硬性精确 | STATE-003 | width=15, height=12 | ⏳ |
| T-V019 | 药园尺寸20x15 | 硬性精确 | STATE-003 | width=20, height=15 | ⏳ |
| T-V020 | 家尺寸12x10 | 硬性精确 | STATE-003 | width=12, height=10 | ⏳ |
| T-V021 | 诊所功能区域存在 | 状态+视觉 | STATE-001 + AI-003 | 诊台、药柜瓦片存在 + 置信度≥80% | ⏳ |
| T-V022 | 药园4个药田存在 | 硬性精确 | STATE-001 | 4个herbPlot瓦片 | ⏳ |
| T-V023 | 家三区域存在 | 状态+视觉 | STATE-001 + AI-003 | 厨房、书房、卧室瓦片 + 置信度≥80% | ⏳ |

### 5.3 截图采集执行清单

| 场景 | 截图时机 | 文件命名 | 采集方式 | 状态 |
|------|---------|---------|---------|------|
| TitleScene | 标题画面加载完成 | `title-{timestamp}.png` | TOOL-002 | ⏳ |
| TownOutdoorScene | 进入场景后初始视角 | `town-init-{timestamp}.png` | TOOL-002 | ⏳ |
| TownOutdoorScene | 玩家移动后视角 | `town-moved-{timestamp}.png` | TOOL-002 | ⏳ |
| ClinicScene | 进入诊所后 | `clinic-{timestamp}.png` | TOOL-002 | ⏳ |
| GardenScene | 进入药园后 | `garden-{timestamp}.png` | TOOL-002 | ⏳ |
| HomeScene | 进入家后 | `home-{timestamp}.png` | TOOL-002 | ⏳ |

**动作序列录制**:

| 动作 | 录制帧数 | 用途 | 采集方式 | 状态 |
|------|---------|------|---------|------|
| 玩家方向键移动 | 10帧 | 验证移动流畅性 | TOOL-005 | ⏳ |
| 玩家撞墙尝试 | 5帧 | 验证碰撞阻断 | TOOL-005 | ⏳ |
| 场景切换过渡 | 8帧 | 验证切换完整性 | TOOL-005 | ⏳ |
| 空格键交互 | 6帧 | 验证门交互流程 | TOOL-005 | ⏳ |

### 5.4 AI分析执行流程

```
测试执行
    ↓
┌─────────────────────────────────────────────────────────────┐
│  Step 1: QWEN VL截图分析                                     │
│  调用 AI-003 (layout-analyzer.ts)                           │
│  输入: tests/visual/screenshots/*.png                        │
│  输出: { passed, confidence, observations, issues }          │
└─────────────────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────────────────┐
│  Step 2: 状态数据精确验证                                     │
│  调用 STATE-* 接口获取数据                                    │
│  比对: expected vs actual                                     │
│  输出: { match: boolean, expected, actual }                  │
└─────────────────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────────────────┐
│  Step 3: 日志事件验证                                         │
│  调用 TOOL-004 (log-reader.ts)                               │
│  检查: 预期事件序列是否存在                                    │
│  输出: { hasExpectedEvents: boolean, events: [] }            │
└─────────────────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────────────────┐
│  Step 4: GLM综合判断                                          │
│  调用 AI-005 (result-judge.ts)                               │
│  输入: 截图分析结果 + 状态验证结果 + 日志结果                  │
│  输出: 每个测试项的通过/不通过判定 + 诊断建议                  │
└─────────────────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────────────────┐
│  Step 5: 报告生成                                             │
│  调用 AI-006 (report-generator.ts)                           │
│  输出: JSON报告 + Markdown报告                                │
│  位置: tests/visual/reports/                                 │
└─────────────────────────────────────────────────────────────┘
```

### 5.5 报告输出规范

**JSON报告结构** (`phase1-report-{timestamp}.json`):
```json
{
  "phase": "Phase1",
  "timestamp": "2026-04-05T...",
  "execution_time_ms": 45000,
  "result": "pass",
  "summary": {
    "total": 23,
    "passed": 22,
    "failed": 1,
    "pass_rate": 0.957
  },
  "tests": [
    {
      "id": "T-V001",
      "name": "地图尺寸40x30",
      "category": "layout",
      "status": "pass",
      "verification": {
        "type": "state",
        "expected": { "width": 40, "height": 30 },
        "actual": { "width": 40, "height": 30 },
        "match": true
      },
      "ai_confidence": 1.0
    }
  ],
  "ai_feedback": {
    "summary": "Phase 1功能性验证基本通过...",
    "diagnosis": [
      {
        "test_id": "T-V023",
        "issue": "家三区域存在性验证置信度较低",
        "suggestion": "检查瓦片渲染是否正确"
      }
    ],
    "improvements": [
      "建议增加场景过渡动画",
      "建议优化碰撞检测的视觉反馈"
    ]
  },
  "files": {
    "screenshots": ["tests/visual/screenshots/..."],
    "logs": ["tests/visual/logs/..."]
  }
}
```

**Markdown报告结构** (`phase1-report-{timestamp}.md`):
```markdown
# Phase 1 AI端到端测试报告

**执行时间**: 2026-04-05
**结果**: ✅ 通过 (22/23)

## 测试结果摘要

| 类别 | 通过/总数 | 通过率 |
|------|-----------|--------|
| 布局验证 | 6/6 | 100% |
| 移动验证 | 5/5 | 100% |
| 场景切换 | 6/6 | 100% |
| 室内验证 | 5/6 | 83% |

## 详细测试结果
...

## AI诊断建议
...

## 改进建议
...

## 附录
- 截图列表: tests/visual/screenshots/
- 日志文件: tests/visual/logs/
```

### 5.6 执行检查清单

**测试执行前检查**:

| 检查项 | 命令 | 状态 |
|--------|------|------|
| 游戏可正常启动 | `npm run dev` | ⏳ |
| 环境变量已配置 | `.env` 文件存在 | ⏳ |
| QWEN VL API可用 | 测试API调用 | ⏳ |
| GLM API可用 | 测试API调用 | ⏳ |
| 日志系统已实现 | 检查EventBus | ⏳ |
| 状态接口已实现 | 检查window.__GAME_STATE__ | ⏳ |

**测试执行后检查**:

| 检查项 | 位置 | 状态 |
|--------|------|------|
| 截图已采集 | `tests/visual/screenshots/` | ⏳ |
| 日志已导出 | `tests/visual/logs/` | ⏳ |
| JSON报告已生成 | `tests/visual/reports/phase1-report-*.json` | ⏳ |
| Markdown报告已生成 | `tests/visual/reports/phase1-report-*.md` | ⏳ |
| 所有测试项有结果 | 报告中tests数组完整 | ⏳ |

---

## 六、E2E测试 (Playwright)

### 6.1 基础E2E测试

```typescript
// tests/e2e/game.spec.ts
import { test, expect } from '@playwright/test';

test.describe('药灵山谷 E2E测试', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForSelector('#game-container canvas');
  });

  test('游戏加载', async ({ page }) => {
    // 验证Canvas渲染
    const canvas = page.locator('#game-container canvas');
    await expect(canvas).toBeVisible();

    // 验证标题画面
    await page.waitForTimeout(1000);
    const titleVisible = await page.evaluate(() => {
      const canvas = document.querySelector('#game-container canvas');
      return canvas !== null;
    });
    expect(titleVisible).toBe(true);
  });

  test('点击开始游戏', async ({ page }) => {
    // 等待标题画面加载
    await page.waitForTimeout(1000);

    // 点击开始按钮位置
    await page.click('#game-container canvas', {
      position: { x: 400, y: 350 }
    });

    // 等待场景切换
    await page.waitForTimeout(2000);

    // 验证进入游戏场景
    const inGame = await page.evaluate(() => {
      // 检查游戏状态
      return true; // 实际应检查游戏状态
    });
    expect(inGame).toBe(true);
  });

  test('玩家移动', async ({ page }) => {
    // 启动并跳过标题
    await startGameAndSkipTitle(page);

    // 模拟按键移动
    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(500);
    await page.keyboard.up('ArrowRight');

    // 验证玩家位置改变
    // 实际实现需要检查游戏状态
  });

  test('场景切换 - 进入诊所', async ({ page }) => {
    await startGameAndSkipTitle(page);

    // 移动到诊所门位置（模拟）
    await simulateMovementToDoor(page, 'clinic');

    // 按空格进入
    await page.keyboard.press('Space');
    await page.waitForTimeout(500);

    // 验证场景切换
    // 实际实现需要检查当前场景
  });
});

// 辅助函数
async function startGameAndSkipTitle(page) {
  await page.waitForTimeout(1000);
  await page.click('#game-container canvas', {
    position: { x: 400, y: 350 }
  });
  await page.waitForTimeout(2000);
}

async function simulateMovementToDoor(page, building) {
  // 模拟移动到指定建筑的门
  // 实际实现需要更精确的位置控制
}
```

---

## 七、测试执行计划

### 7.1 CI/CD集成

```yaml
# .github/workflows/test.yml
name: Test Suite

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test:unit
      - run: npm run test:coverage

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npx playwright install
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/

  ai-visual-tests:
    runs-on: ubuntu-latest
    if: github.event_name == 'pull_request'
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test:ai-visual
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
```

### 7.2 测试覆盖率目标

| 测试类型 | 目标覆盖率 | 当前状态 |
|----------|------------|----------|
| 单元测试 | 80% | 待实现 |
| 集成测试 | 70% | 待实现 |
| E2E测试 | 关键路径100% | 待实现 |
| AI视觉测试 | 所有场景 | 待实现 |

### 7.3 测试执行频率

| 触发条件 | 执行的测试 |
|----------|------------|
| 每次提交 | 单元测试 + 构建测试 |
| PR创建 | 全套测试 + AI视觉测试 |
| 每日定时 | 全套测试 + 回归测试 |
| 发布前 | 全套测试 + 性能测试 + AI评估 |

---

## 八、测试工具配置

### 8.1 Vitest配置

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'tests/']
    },
    setupFiles: ['./tests/setup.ts']
  }
});
```

### 8.2 Playwright配置

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure'
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI
  }
});
```

---

## 九、测试报告模板

### 9.1 AI测试报告示例

```markdown
# 药灵山谷 Phase 1 测试报告

**执行时间**: 2026-04-05 16:00
**测试范围**: Phase 1 MVP全部功能
**总体评分**: 85/100

## 测试结果摘要

| 测试类型 | 通过/总数 | 通过率 |
|----------|-----------|--------|
| 单元测试 | 45/48 | 94% |
| 集成测试 | 20/22 | 91% |
| E2E测试 | 15/16 | 94% |
| AI视觉测试 | 8/10 | 80% |

## AI视觉测试详情

### 标题画面
- ✅ 标题正确显示
- ✅ 按钮可交互
- ⚠️ 建议：副标题颜色对比度可优化

### 室外场景
- ✅ 地图正确渲染
- ✅ 玩家可见
- ✅ 碰撞检测正常

### 室内场景
- ✅ 诊所场景正常
- ✅ 药园场景正常
- ⚠️ 玩家之家图标在小屏幕上可能重叠

## 发现的问题

1. **[Minor]** 对角线移动速度略有偏差
2. **[Info]** 药田占位符使用简单方块
3. **[Suggestion]** 建议添加场景过渡动画

## 建议改进

1. 增加视觉反馈动画
2. 优化小屏幕适配
3. 添加音效支持
```

---

**文档结束**

*本测试计划由 Claude Code 生成*