# Phaser游戏自动化测试最佳实践

> **创建时间**: 2026-04-13
> **适用场景**: Phaser 3 + TypeScript游戏项目的E2E测试
> **核心挑战**: Playwright无法定位Canvas内部元素

---

## 核心问题

### Phaser Canvas渲染特性

Phaser游戏在HTML Canvas中渲染所有元素：
- **文字**: Canvas内部图形，非HTML DOM元素
- **按钮**: Canvas绘制的点击区域，无HTML元素
- **UI组件**: 全部在Canvas内部，无DOM节点

**后果**：Playwright的`text=`、`button=`等DOM选择器**完全无效**。

```typescript
// ❌ 错误方式：无法找到Canvas内部文字
await page.locator('text=开始游戏').click();  // 失败
await page.locator('button:has-text("存档")').click();  // 失败

// ✅ 正确方式：使用JavaScript API或Canvas坐标
await page.evaluate(() => window.__PHASER_GAME__.scene.start('BootScene'));
await page.click('#game-container canvas', { position: { x: 400, y: 350 } });
```

---

## 解决方案对比

### 方案A: browser-use-mcp（多模态AI）

**优势**：
- 多模态AI可识别Canvas内容
- 自动截图+DOM分析
- 更智能的页面理解

**限制**：
- 需要系统级Chrome/Chromium浏览器
- 无法使用Playwright安装的浏览器（路径不同）
- 需要sudo权限安装

```bash
# browser-use-mcp需要的浏览器路径
/usr/bin/google-chrome
/usr/bin/chromium-browser
/usr/bin/chromium

# Playwright安装的浏览器路径（无法被browser-use-mcp识别）
~/.cache/ms-playwright/chromium-1217/
```

**适用场景**：有系统浏览器安装权限的环境。

### 方案B: Playwright + JavaScript API（推荐）

**优势**：
- 无需额外依赖
- 利用Playwright原生能力
- 与现有测试框架集成

**核心原理**：
```typescript
// 游戏暴露状态到全局window对象
(window as any).__PHASER_GAME__ = game;
(window as any).__SAVE_MANAGER__ = saveManager;
(window as any).__CASE_MANAGER__ = caseManager;

// 测试通过page.evaluate()访问
const state = await page.evaluate(() => {
  return (window as any).__CASE_MANAGER__.getStatistics();
});
```

---

## 实现指南

### 1. 创建测试辅助模块

**文件**: `tests/e2e/utils/phaser-helper.ts`

```typescript
import { Page } from '@playwright/test';

const CANVAS_SELECTOR = '#game-container canvas';

/**
 * 等待游戏加载完成
 */
export async function waitForGameReady(page: Page, timeout: number = 10000): Promise<void> {
  // 1. 等待Canvas渲染
  await page.waitForSelector(CANVAS_SELECTOR, { timeout });

  // 2. 等待游戏实例暴露
  await page.waitForFunction(
    () => (window as any).__PHASER_GAME__ !== undefined,
    { timeout }
  );

  // 3. 等待场景数组有内容
  await page.waitForFunction(
    () => {
      const game = (window as any).__PHASER_GAME__;
      return game?.scene?.scenes?.length > 0;
    },
    { timeout }
  );

  // 4. 额外等待确保初始化完成
  await page.waitForTimeout(500);
}

/**
 * 导航到指定场景
 */
export async function navigateToScene(page: Page, sceneKey: string): Promise<void> {
  await page.evaluate((key) => {
    const game = (window as any).__PHASER_GAME__;
    if (game) {
      game.scene.start(key);
    }
  }, sceneKey);

  // 等待场景存在
  await page.waitForFunction(
    (key) => {
      const game = (window as any).__PHASER_GAME__;
      return game?.scene?.getScene(key) !== null;
    },
    sceneKey,
    { timeout: 15000 }
  );

  await page.waitForTimeout(1000);
}

/**
 * 点击Canvas指定坐标
 */
export async function clickCanvas(page: Page, x: number, y: number): Promise<void> {
  await page.click(CANVAS_SELECTOR, { position: { x, y } });
}

/**
 * 获取全局状态
 */
export async function getGlobalState<T>(page: Page, key: string): Promise<T | null> {
  return await page.evaluate((k) => (window as any)[k], key);
}
```

### 2. 游戏代码暴露状态

**场景初始化时暴露**:

```typescript
// src/scenes/ClinicScene.ts
export class ClinicScene extends Phaser.Scene {
  private caseManager!: CaseManager;

  create() {
    this.caseManager = createCaseManager('player_001', 'qingmu');

    // ⚠️ 关键：暴露完整实例，而非只暴露数据
    if (typeof window !== 'undefined') {
      (window as any).__CASE_MANAGER__ = this.caseManager;
    }
  }
}
```

**错误方式**:
```typescript
// ❌ 只暴露数据快照，测试无法调用方法
(window as any).__CASE_MANAGER__ = {
  totalCases: stats.total,
  completedCases: stats.completed
};
// 测试调用 getStatistics() 会失败
```

**正确方式**:
```typescript
// ✅ 暴露完整实例
(window as any).__CASE_MANAGER__ = this.caseManager;
// 测试可以调用任何方法
```

### 3. 测试用例编写

```typescript
// tests/e2e/cases.spec.ts
import { waitForGameReady, navigateToScene, clickCanvas, getGlobalState } from './utils/phaser-helper';

test.describe('Case System Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForGameReady(page);
    await navigateToScene(page, 'ClinicScene');
  });

  test('病案列表显示', async ({ page }) => {
    // 方法1：JavaScript API访问状态
    const manager = await getGlobalState(page, '__CASE_MANAGER__');
    expect(manager).not.toBeNull();

    // 方法2：调用实例方法
    const stats = await page.evaluate(() => {
      const manager = (window as any).__CASE_MANAGER__;
      return manager.getStatistics();
    });
    expect(stats.total).toBeGreaterThanOrEqual(4);

    // 方法3：Canvas坐标点击
    await clickCanvas(page, 400, 160);  // 病案列表第一项位置
    await page.waitForTimeout(500);
  });
});
```

---

## 场景坐标定位

### TitleScene按钮位置

```typescript
// 游戏尺寸: 800x600
// 按钮大致位置（需根据实际UI调整）
export const TITLE_SCENE_COORDS = {
  START_BUTTON: { x: 400, y: 320 },      // 中央开始按钮
  CONTINUE_BUTTON: { x: 400, y: 380 },   // 继续游戏
  SAVE_MANAGE_BUTTON: { x: 400, y: 420 } // 存档管理
};
```

### ClinicSceneUI位置

```typescript
export const CLINIC_SCENE_COORDS = {
  INQUIRY_BUTTON: { x: 50, y: 80 },    // 问诊入口
  CASES_BUTTON: { x: 50, y: 110 },     // 病案列表
  CASE_ITEM_FIRST: { x: 400, y: 160 }, // 病案列表第一项
  CASE_DETAIL_CLOSE: { x: 350, y: -270 } // 详情关闭按钮（相对坐标）
};
```

**注意**：坐标需要根据实际UI布局验证和调整。

---

## 常见问题修复

### 问题1: waitForFunction超时

```typescript
// ❌ 过于严格的检查
await page.waitForFunction(() => {
  const scene = game.scene.getScene(key);
  return scene?.sceneIsActive;  // sceneIsActive可能未及时设置
});

// ✅ 简化检查
await page.waitForFunction(() => {
  const scene = game.scene.getScene(key);
  return scene !== null;  // 只检查存在
});
await page.waitForTimeout(1000);  // 额外等待初始化
```

### 问题2: 实例方法调用失败

```typescript
// ❌ 只暴露数据
(window as any).__MANAGER__ = { count: 5 };

// ✅ 暴露实例
(window as any).__MANAGER__ = this.manager;
```

### 问题3: Canvas坐标点击无效

```typescript
// 原因：坐标不准确或UI未渲染完成
// 解决：
await page.waitForTimeout(1000);  // 等待UI渲染
await clickCanvas(page, x, y);
await page.waitForTimeout(500);   // 等待响应
```

---

## 测试效果对比

| 项目 | 传统DOM测试 | 智能方案 | 提升 |
|-----|-----------|---------|------|
| cases.spec.ts通过率 | 0/13 | 11/13 | +85% |
| save.spec.ts通过率 | 5/12 | 8/12 | +25% |
| Smoke测试通过率 | 0% | 100% | +100% |
| Logic测试通过率 | 0% | 100% | +100% |

---

## 最佳实践总结

### ✅ 推荐

1. **暴露完整实例**：`window.__MANAGER__ = this.manager;`
2. **简化场景等待**：只检查`scene !== null`
3. **组合策略**：JavaScript API + Canvas坐标点击
4. **足够等待时间**：场景切换后等待1-2秒

### ❌ 避免

1. **DOM选择器**：`text=`、`button=`在Canvas中无效
2. **过度严格检查**：`sceneIsActive`可能不稳定
3. **只暴露数据快照**：测试无法调用方法
4. **立即点击**：场景切换后需要等待渲染

---

## 进阶：多模态验证

如果需要更智能的Canvas内容识别：

### 安装系统浏览器

```bash
# Ubuntu/Debian
sudo apt-get install chromium-browser

# macOS (已有Chrome)
# 无需安装

# Windows
# Chrome通常已安装
```

### 使用browser-use-mcp

```typescript
// 未来可用（需要系统浏览器）
await mcp__plugin_superpowers-chrome_chrome__use_browser({
  action: 'navigate',
  payload: 'http://localhost:5173'
});

await mcp__plugin_superpowers-chrome_chrome__use_browser({
  action: 'screenshot',
  payload: 'game-state.png'
});

// AI分析Canvas内容
```

---

## 相关文件

- 测试辅助模块: `tests/e2e/utils/phaser-helper.ts`
- 测试状态记录: `docs/superpowers/plans/phase2-test-status.md`
- 测试用例示例: `tests/e2e/cases.spec.ts`, `tests/e2e/save.spec.ts`

---

*本文档基于实际开发经验总结，更新于 2026-04-13*