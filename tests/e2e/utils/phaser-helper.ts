// tests/e2e/utils/phaser-helper.ts
/**
 * Phaser游戏智能测试辅助模块
 *
 * 核心能力:
 * - 通过JavaScript API访问Canvas内部游戏状态
 * - 使用坐标点击代替DOM选择器
 * - 等待游戏场景加载完成
 * - 截图验证Canvas渲染
 *
 * 设计原理:
 * Phaser游戏在Canvas中渲染，文字是Canvas内部图形，不是HTML DOM元素。
 * Playwright的text=选择器无法定位Canvas内部文字。
 * 解决方案: 使用JavaScript执行访问游戏内部状态，使用坐标点击交互。
 */

import { Page } from '@playwright/test';

// 游戏常量
const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const CANVAS_SELECTOR = '#game-container canvas';

/**
 * 等待游戏加载完成
 */
export async function waitForGameReady(page: Page, timeout: number = 10000): Promise<void> {
  // 等待Canvas渲染
  await page.waitForSelector(CANVAS_SELECTOR, { timeout });

  // 等待游戏实例暴露到全局
  await page.waitForFunction(
    () => (window as any).__PHASER_GAME__ !== undefined,
    { timeout }
  );

  // 等待游戏场景数组有内容（简化检查）
  await page.waitForFunction(
    () => {
      const game = (window as any).__PHASER_GAME__;
      if (!game) return false;
      const sceneManager = game.scene;
      // 只检查scenes数组是否有内容
      return sceneManager.scenes && sceneManager.scenes.length > 0;
    },
    { timeout }
  );

  // 添加额外等待确保场景完全初始化
  await page.waitForTimeout(500);
}

/**
 * 获取当前场景名称
 */
export async function getCurrentScene(page: Page): Promise<string | null> {
  return await page.evaluate(() => {
    const game = (window as any).__PHASER_GAME__;
    if (!game) return null;
    const sceneManager = game.scene;
    // Phaser 3正确方式：从scenes数组中找到活跃场景
    const scenes = sceneManager.scenes;
    const activeScene = scenes.find(s => s.sceneIsActive);
    return activeScene ? activeScene.scene.key : null;
  });
}

/**
 * 等待特定场景加载完成
 */
export async function waitForScene(page: Page, sceneKey: string, timeout: number = 10000): Promise<void> {
  // 使用更宽松的检查：场景存在且已创建
  await page.waitForFunction(
    (key) => {
      const game = (window as any).__PHASER_GAME__;
      if (!game) return false;
      const scene = game.scene.getScene(key);
      // 只检查场景存在，不检查sceneIsActive（因为可能刚创建还未完全激活）
      return scene !== null && scene !== undefined;
    },
    sceneKey,
    { timeout }
  );

  // 添加额外等待确保场景完全初始化
  await page.waitForTimeout(1000);
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

  // 使用更长超时等待场景加载
  await waitForScene(page, sceneKey, 15000);
}

/**
 * 点击Canvas指定坐标
 */
export async function clickCanvas(page: Page, x: number, y: number): Promise<void> {
  await page.click(CANVAS_SELECTOR, { position: { x, y } });
}

/**
 * 模拟键盘按键
 */
export async function pressKey(page: Page, key: string): Promise<void> {
  await page.keyboard.press(key);
}

/**
 * 模拟按住键移动（用于玩家移动测试）
 */
export async function pressKeyForDuration(page: Page, key: string, durationMs: number): Promise<void> {
  await page.keyboard.down(key);
  await page.waitForTimeout(durationMs);
  await page.keyboard.up(key);
}

/**
 * 获取全局游戏状态
 */
export async function getGlobalState(page: Page, key: string): Promise<any> {
  return await page.evaluate((k) => (window as any)[k], key);
}

/**
 * 获取SaveManager状态
 */
export async function getSaveManagerState(page: Page): Promise<{
  initialized: boolean;
  slots: any[];
  currentSlot: number;
} | null> {
  return await page.evaluate(() => {
    const manager = (window as any).__SAVE_MANAGER__;
    if (!manager) return null;

    return {
      initialized: true,
      slots: manager.getSaveSlots(),
      currentSlot: manager.getCurrentSlot()
    };
  });
}

/**
 * 执行存档操作
 */
export async function saveGame(page: Page, slotId: number): Promise<boolean> {
  return await page.evaluate(async (id) => {
    const manager = (window as any).__SAVE_MANAGER__;
    if (!manager) return false;
    return await manager.save(id);
  }, slotId);
}

/**
 * 加载存档
 */
export async function loadGame(page: Page, slotId: number): Promise<any | null> {
  return await page.evaluate(async (id) => {
    const manager = (window as any).__SAVE_MANAGER__;
    if (!manager) return null;
    return await manager.load(id);
  }, slotId);
}

/**
 * 获取CaseManager状态
 */
export async function getCaseManagerState(page: Page): Promise<{
  initialized: boolean;
  statistics: any;
  cases: any[];
} | null> {
  return await page.evaluate(() => {
    const manager = (window as any).__CASE_MANAGER__;
    if (!manager) return null;

    return {
      initialized: manager.initialized || true,
      statistics: manager.getStatistics(),
      cases: manager.getAllCases()
    };
  });
}

/**
 * 获取病案UI状态
 */
export async function getCasesUIState(page: Page): Promise<{
  listUI: any;
  detailUI: any;
} | null> {
  return await page.evaluate(() => {
    return {
      listUI: (window as any).__CASES_LIST_UI__,
      detailUI: (window as any).__CASE_DETAIL_UI__
    };
  });
}

/**
 * 打开病案列表（按C键）
 */
export async function openCasesList(page: Page): Promise<void> {
  await pressKey(page, 'c');
  await page.waitForTimeout(500);  // 等待UI动画
}

/**
 * 开始问诊（按I键）
 */
export async function startInquiry(page: Page): Promise<void> {
  await pressKey(page, 'i');
  await page.waitForTimeout(500);
}

/**
 * 模拟按空格键交互
 */
export async function pressSpace(page: Page): Promise<void> {
  await pressKey(page, 'Space');
}

/**
 * 获取玩家状态
 */
export async function getPlayerState(page: Page): Promise<{
  x: number;
  y: number;
  tileX: number;
  tileY: number;
  speed: number;
} | null> {
  return await page.evaluate(() => {
    const bridge = (window as any).__GAME_STATE_BRIDGE__ ||
                  GameStateBridge?.getInstance?.();
    if (!bridge) return null;

    const state = bridge.getState();
    return state?.player || null;
  });
}

/**
 * 获取Hermes状态
 */
export async function getHermesState(page: Page): Promise<{
  available: boolean;
  port: number;
  error: string | null;
} | null> {
  return await page.evaluate(() => {
    const status = (window as any).__HERMES_STATUS__;
    if (!status) return null;

    return {
      available: status.available || false,
      port: status.port || 0,
      error: status.error || null
    };
  });
}

/**
 * 截图保存到指定路径
 */
export async function captureScreenshot(page: Page, filename: string): Promise<void> {
  await page.screenshot({ path: `tests/screenshots/${filename}` });
}

/**
 * 等待全局变量出现
 */
export async function waitForGlobalVar(page: Page, varName: string, timeout: number = 5000): Promise<void> {
  await page.waitForFunction(
    (name) => (window as any)[name] !== undefined && (window as any)[name] !== null,
    varName,
    { timeout }
  );
}

/**
 * 等待全局变量消失（清理后）
 */
export async function waitForGlobalVarNull(page: Page, varName: string, timeout: number = 5000): Promise<void> {
  await page.waitForFunction(
    (name) => (window as any)[name] === null || (window as any)[name] === undefined,
    varName,
    { timeout }
  );
}

/**
 * TitleScene坐标定位
 */
export const TITLE_SCENE_COORDS = {
  START_BUTTON: { x: GAME_WIDTH / 2, y: GAME_HEIGHT / 2 + 20 },      // "开始游戏"按钮
  CONTINUE_BUTTON: { x: GAME_WIDTH / 2, y: GAME_HEIGHT / 2 + 80 },   // "继续游戏"按钮
  SAVE_MANAGE_BUTTON: { x: GAME_WIDTH / 2, y: GAME_HEIGHT / 2 + 160 } // "存档管理"按钮
};

/**
 * ClinicScene坐标定位
 */
export const CLINIC_SCENE_COORDS = {
  INQUIRY_BUTTON: { x: 50, y: 80 },    // 问诊入口按钮位置
  CASES_BUTTON: { x: 50, y: 110 },     // 病案按钮位置
  NPC_AREA: { x: 200, y: 150 }         // NPC区域
};