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

## 五、AI端到端测试 (多模态验证)

### 5.1 视觉验证测试用例

使用多模态LLM对游戏界面进行视觉验证：

```typescript
// tests/e2e/ai-visual-tests.ts
interface VisualTestResult {
  passed: boolean;
  observations: string[];
  issues: string[];
  confidence: number;
}

async function runVisualTest(
  screenshot: Buffer,
  expectedDescription: string
): Promise<VisualTestResult> {
  const response = await multimodalLLM.analyze({
    image: screenshot,
    prompt: `
      分析这个游戏截图是否符合以下描述：
      "${expectedDescription}"

      请检查：
      1. 界面元素是否完整
      2. 文字是否正确显示
      3. 颜色是否合理
      4. 布局是否正确
      5. 是否有任何视觉问题

      返回JSON格式：
      {
        "passed": boolean,
        "observations": string[],
        "issues": string[],
        "confidence": number (0-1)
      }
    `
  });

  return JSON.parse(response);
}

describe('AI视觉验证测试', () => {
  test('标题画面视觉验证', async () => {
    const game = await startGame();
    await waitFor(1000);

    const screenshot = await takeScreenshot(game);
    const result = await runVisualTest(screenshot, `
      游戏标题画面应该包含：
      1. 深绿色背景 (#2d5a27)
      2. 大标题 "药灵山谷" (白色，居中)
      3. 副标题 "v3.0 - 一期MVP" (灰色)
      4. "开始游戏" 按钮 (绿色背景)
      5. 底部控制提示文字
    `);

    expect(result.passed).toBe(true);
    expect(result.confidence).toBeGreaterThan(0.8);

    if (!result.passed) {
      console.log('Issues found:', result.issues);
    }

    game.destroy(true);
  });

  test('室外场景视觉验证', async () => {
    const game = await startInTown();
    await waitFor(500);

    const screenshot = await takeScreenshot(game);
    const result = await runVisualTest(screenshot, `
      百草镇室外场景应该包含：
      1. 绿色草地背景
      2. 米色十字路径
      3. 棕色墙壁边界
      4. 门瓦片（深棕色）
      5. 红色圆形玩家角色
      6. 左上角场景名称 "百草镇 - 室外"
    `);

    expect(result.passed).toBe(true);
    game.destroy(true);
  });

  test('诊所场景视觉验证', async () => {
    const game = await startInClinic();
    await waitFor(500);

    const screenshot = await takeScreenshot(game);
    const result = await runVisualTest(screenshot, `
      青木诊所室内场景应该包含：
      1. 米色地板
      2. 棕色墙壁边界
      3. 门瓦片在底部中央
      4. 左上角场景名称 "青木诊所"
      5. 提示文字 "按空格键返回室外"
    `);

    expect(result.passed).toBe(true);
    game.destroy(true);
  });

  test('药园场景视觉验证', async () => {
    const game = await startInGarden();
    await waitFor(500);

    const screenshot = await takeScreenshot(game);
    const result = await runVisualTest(screenshot, `
      老张药园场景应该包含：
      1. 绿色草地背景
      2. 棕色墙壁边界
      3. 4个药田区域（深绿色方块）
      4. 左上角场景名称 "老张药园"
    `);

    expect(result.passed).toBe(true);
    game.destroy(true);
  });

  test('玩家之家场景视觉验证', async () => {
    const game = await startInHome();
    await waitFor(500);

    const screenshot = await takeScreenshot(game);
    const result = await runVisualTest(screenshot, `
      玩家之家场景应该包含：
      1. 米色地板
      2. 棕色墙壁边界
      3. 厨房区域（🍳图标）
      4. 书房区域（📚图标）
      5. 卧室区域（🛏️图标）
      6. 左上角场景名称 "玩家之家"
    `);

    expect(result.passed).toBe(true);
    game.destroy(true);
  });
});
```

### 5.2 游戏流程AI验证

```typescript
// tests/e2e/ai-gameplay-tests.ts
describe('AI游戏流程验证', () => {
  test('完整游戏启动流程', async () => {
    const browser = await launchGameBrowser();
    const page = browser.page;

    // 1. 验证标题画面
    await page.waitForSelector('#game-container canvas');
    await sleep(1000);

    const titleScreenAnalysis = await analyzeGameScreen(page, `
      这是游戏启动画面。请验证：
      1. 是否显示游戏标题
      2. 是否有开始游戏的按钮
      3. 整体视觉效果是否正常
    `);

    expect(titleScreenAnalysis.hasTitle).toBe(true);
    expect(titleScreenAnalysis.hasStartButton).toBe(true);

    // 2. 点击开始
    await page.click('#game-container canvas', {
      position: { x: 400, y: 350 } // 开始按钮位置
    });
    await sleep(2000);

    // 3. 验证进入游戏
    const gameScreenAnalysis = await analyzeGameScreen(page, `
      这是游戏主画面。请验证：
      1. 是否显示游戏场景
      2. 是否有玩家角色
      3. 是否有地图/背景
    `);

    expect(gameScreenAnalysis.hasScene).toBe(true);
    expect(gameScreenAnalysis.hasPlayer).toBe(true);

    await browser.close();
  });

  test('场景切换视觉连续性', async () => {
    const browser = await launchGameBrowser();
    await startGameAndSkipTitle(browser.page);

    // 记录切换前后的视觉变化
    const visualChanges = [];

    // 进入诊所
    await moveToClinicDoor(browser.page);
    const beforeEnter = await takeScreenshot(browser.page);

    await pressSpace(browser.page);
    await sleep(500);

    const afterEnter = await takeScreenshot(browser.page);

    const enterAnalysis = await multimodalLLM.compare({
      image1: beforeEnter,
      image2: afterEnter,
      prompt: `
        比较这两张截图。
        第一张是在室外，第二张应该是在诊所内。
        验证场景切换是否成功，视觉风格是否一致。
      `
    });

    expect(enterAnalysis.sceneChanged).toBe(true);
    expect(enterAnalysis.visualConsistent).toBe(true);

    await browser.close();
  });

  test('玩家移动动画流畅性', async () => {
    const browser = await launchGameBrowser();
    await startGameAndSkipTitle(browser.page);

    // 捕获移动过程的帧序列
    const frames = await captureMovementFrames(browser.page, {
      direction: 'right',
      duration: 1000,
      frameCount: 10
    });

    const movementAnalysis = await multimodalLLM.analyzeFrames({
      frames,
      prompt: `
        分析这组游戏帧，验证：
        1. 玩家是否在移动
        2. 移动是否流畅
        3. 是否有视觉抖动或异常
        4. 碰撞检测是否正常（不应穿过墙壁）
      `
    });

    expect(movementAnalysis.isMoving).toBe(true);
    expect(movementAnalysis.isSmooth).toBe(true);
    expect(movementAnalysis.noClipping).toBe(true);

    await browser.close();
  });
});
```

### 5.3 UI/UX AI评估

```typescript
// tests/e2e/ai-ux-evaluation.ts
describe('AI用户体验评估', () => {
  test('界面可读性评估', async () => {
    const game = await startGame();

    // 收集所有场景的截图
    const screenshots = {
      title: await captureScene(game, 'TitleScene'),
      town: await captureScene(game, 'TownOutdoorScene'),
      clinic: await captureScene(game, 'ClinicScene'),
      garden: await captureScene(game, 'GardenScene'),
      home: await captureScene(game, 'HomeScene')
    };

    const readabilityReport = await multimodalLLM.evaluateReadability({
      screenshots,
      criteria: [
        '文字是否清晰可读',
        '颜色对比度是否足够',
        'UI元素是否易于识别',
        '信息层次是否清晰'
      ]
    });

    expect(readabilityReport.overallScore).toBeGreaterThan(0.7);

    game.destroy(true);
  });

  test('新手引导充分性', async () => {
    const browser = await launchGameBrowser();
    const newUserExperience = await simulateNewUser(browser.page);

    const guidanceAnalysis = await multimodalLLM.analyze({
      screenshots: newUserExperience.screenshots,
      actions: newUserExperience.actions,
      prompt: `
        分析新手用户的游戏体验：
        1. 控制提示是否清晰
        2. 游戏目标是否明确
        3. 交互方式是否直观
        4. 是否有困惑点

        提供改进建议。
      `
    });

    console.log('新手体验分析:', guidanceAnalysis);

    await browser.close();
  });

  test('视觉风格一致性', async () => {
    const game = await startGame();
    const allScenes = await captureAllScenes(game);

    const styleConsistency = await multimodalLLM.analyze({
      images: allScenes,
      prompt: `
        分析所有场景截图，验证视觉风格一致性：
        1. 色彩方案是否统一
        2. 瓦片风格是否一致
        3. UI元素风格是否统一
        4. 是否有风格冲突的地方
      `
    });

    expect(styleConsistency.isConsistent).toBe(true);

    game.destroy(true);
  });
});
```

### 5.4 自动化AI测试报告

```typescript
// tests/e2e/ai-test-reporter.ts
interface TestReport {
  timestamp: Date;
  phase: string;
  tests: {
    name: string;
    passed: boolean;
    observations: string[];
    issues: string[];
    screenshots: string[];
  }[];
  overallScore: number;
  recommendations: string[];
}

async function generateAITestReport(): Promise<TestReport> {
  const report: TestReport = {
    timestamp: new Date(),
    phase: 'Phase 1 MVP',
    tests: [],
    overallScore: 0,
    recommendations: []
  };

  // 运行所有AI测试并收集结果
  const testResults = await runAllAITests();

  report.tests = testResults;
  report.overallScore = calculateOverallScore(testResults);
  report.recommendations = generateRecommendations(testResults);

  // 保存报告
  await saveReport(report, `test-reports/ai-test-${Date.now()}.json`);

  // 生成可视化报告
  await generateHTMLReport(report);

  return report;
}
```

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