// tests/e2e/utils/npc-test-helpers.ts
/**
 * NPC对话系统E2E测试辅助函数
 * 提供共享的Mock数据、场景切换、对话操作等辅助方法
 */

import { Page, expect } from '@playwright/test';

// ========================================
// 配置常量
// ========================================

/** 可配置的基础URL（支持环境变量覆盖） */
const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:3000';

/** 超时时间常量（避免魔法数字） */
export const TIMEOUTS = {
  SCENE_LOAD: 3000,
  DIALOG_UI: 5000,
  NPC_RESPONSE: 60000,
  TOOL_CARD: 10000,
  SHORT: 500,
  MEDIUM: 2000,
  INPUT_WAIT: 1000
};

// ========================================
// 类型定义
// ========================================

/** 背包数据类型（与 InventoryManager.exportData() 格式一致） */
export interface InventoryData {
  herbs: Record<string, number>;
  seeds: Record<string, number>;
  tools: Record<string, number>;
  knowledge_cards: string[];
}

/** 学习进度类型（与 CaseManager.getStatistics() 格式一致） */
export interface ProgressData {
  total_cases: number;
  completed_cases: number;
  correct_rate: number;
  current_task: string;
}

/** 诊断结果类型 */
export interface DiagnosisResultData {
  caseId: string;
  patient: {
    name: string;
    age: number;
    gender: string;
    chief: string;
  };
  diagnosis: {
    tongue: {
      color: string;
      coating: string;
      shape: string;
      moisture: string;
    };
    pulse: {
      position: string;
      quality: string;
    };
    symptoms: string[];
    syndrome: string[];
    prescription: string[];
  };
}

/** 缓存状态类型 */
export interface CacheState {
  exists: boolean;
  inventoryCache: InventoryData | null;
  progressCache: ProgressData | null;
}

// ========================================
// Mock数据定义（与真实格式一致）
// ========================================

/** 背包数据（与 InventoryManager.exportData() 格式一致） */
export const MOCK_INVENTORY: InventoryData = {
  herbs: { '麻黄': 3, '桂枝': 2, '杏仁': 5 },
  seeds: { '甘草种子': 2 },
  tools: { '药碾': 1 },
  knowledge_cards: []
};

/** 学习进度（与 CaseManager.getStatistics() 格式一致） */
export const MOCK_PROGRESS: ProgressData = {
  total_cases: 10,
  completed_cases: 5,
  correct_rate: 0.8,
  current_task: 'task_002'
};

/** NPC记忆（与对话历史格式一致） */
export const MOCK_NPC_MEMORY = {
  last_session: '2026-05-22',
  topics_discussed: ['麻黄汤', '风寒表证'],
  weaknesses_recorded: ['舌诊识别不准']
};

/** 诊断结果（与 DiagnosisResult 格式一致） */
export const MOCK_DIAGNOSIS_RESULT: DiagnosisResultData = {
  caseId: 'case-001',
  patient: { name: '李秀梅', age: 35, gender: '女', chief: '脘腹胀满' },
  diagnosis: {
    tongue: { color: '淡白', coating: '白腻', shape: '胖大有齿痕', moisture: '水滑' },
    pulse: { position: '关', quality: '濡缓' },
    symptoms: ['脘腹胀满'],
    syndrome: ['b1'],
    prescription: ['f1']
  }
};

/** 低分诊断结果（用于错误反馈测试） */
export const MOCK_LOW_SCORE_DIAGNOSIS: DiagnosisResultData = {
  caseId: 'case-001',
  patient: { name: '李秀梅', age: 35, gender: '女', chief: '脘腹胀满' },
  diagnosis: {
    tongue: { color: '红', coating: '黄', shape: '瘦', moisture: '干燥' },
    pulse: { position: '寸', quality: '数' },
    symptoms: [],
    syndrome: ['b2'],
    prescription: ['f2']
  }
};

// ========================================
// 场景操作辅助函数
// ========================================

/**
 * 进入指定场景
 */
export async function enterScene(page: Page, sceneName: string): Promise<void> {
  await page.evaluate((name) => {
    const game = (window as any).__PHASER_GAME__;
    if (game) {
      game.scene.start(name);
    }
  }, sceneName);
  await page.waitForTimeout(TIMEOUTS.MEDIUM);
}

/**
 * 直接进入ClinicScene（使用URL参数）
 */
export async function enterClinicSceneDirect(page: Page): Promise<void> {
  await page.goto(`${BASE_URL}/?scene=clinic`);
  await page.waitForSelector('canvas');
  await page.waitForTimeout(TIMEOUTS.SCENE_LOAD);
}

/**
 * 直接进入GardenScene
 */
export async function enterGardenSceneDirect(page: Page): Promise<void> {
  await page.goto(`${BASE_URL}/?scene=garden`);
  await page.waitForSelector('canvas');
  await page.waitForTimeout(TIMEOUTS.SCENE_LOAD);
}

// ========================================
// 对话操作辅助函数
// ========================================

/**
 * 触发NPC对话（N键）
 */
export async function triggerDialog(page: Page): Promise<void> {
  await page.keyboard.press('N');
  await page.waitForSelector('#dialog-ui-root', { timeout: TIMEOUTS.DIALOG_UI });
}

/**
 * 触发NPC对话（空格键）
 */
export async function triggerDialogWithSpace(page: Page): Promise<void> {
  await page.keyboard.press(' ');
  await page.waitForSelector('#dialog-ui-root', { timeout: TIMEOUTS.DIALOG_UI });
}

/**
 * 发送用户消息
 */
export async function sendUserMessage(page: Page, message: string): Promise<void> {
  const input = page.locator('.dialog-input');
  await input.fill(message);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(TIMEOUTS.INPUT_WAIT);
}

/**
 * 等待NPC响应完成
 */
export async function waitForNPCResponse(page: Page): Promise<void> {
  // 等待生成状态消失
  await page.waitForFunction(() => {
    const generating = document.querySelector('.generating-indicator');
    return !generating || generating.textContent?.includes('完成');
  }, { timeout: TIMEOUTS.NPC_RESPONSE });
}

/**
 * 关闭对话并验证清理
 */
export async function closeDialog(page: Page): Promise<boolean> {
  const closeBtn = page.locator('.dialog-close-btn');
  const count = await closeBtn.count();
  if (count > 0) {
    await closeBtn.click();
    await page.waitForTimeout(TIMEOUTS.SHORT);
  } else {
    await page.keyboard.press('Escape');
    await page.waitForTimeout(TIMEOUTS.SHORT);
  }
  const exists = await page.locator('#dialog-ui-root').isVisible().catch(() => false);
  return !exists;
}

// ========================================
// Tool Card验证辅助函数
// ========================================

/**
 * 验证Tool Card显示
 */
export async function verifyToolCardVisible(page: Page): Promise<void> {
  const toolCard = page.locator('.tool-card');
  await expect(toolCard).toBeVisible({ timeout: TIMEOUTS.TOOL_CARD });
}

/**
 * 验证Tool Card执行中状态
 */
export async function verifyToolCardRunning(page: Page): Promise<void> {
  const runningIndicator = page.locator('.tool-card-running-dot');
  await expect(runningIndicator).toBeVisible({ timeout: TIMEOUTS.DIALOG_UI });
}

/**
 * 验证Tool Card完成状态
 */
export async function verifyToolCardComplete(page: Page): Promise<void> {
  await page.waitForTimeout(TIMEOUTS.MEDIUM);
  const toolCard = page.locator('.tool-card:not(.tool-card-running)');
  await expect(toolCard.first()).toBeVisible({ timeout: TIMEOUTS.TOOL_CARD });
}

// ========================================
// 缓存验证辅助函数
// ========================================

/**
 * 注入Mock背包缓存
 */
export async function injectInventoryCache(page: Page, inventory: InventoryData): Promise<void> {
  await page.evaluate((inv) => {
    const bridge = (window as any).__GAME_STATE_BRIDGE__;
    bridge?.updateInventoryCache(inv);
  }, inventory);
}

/**
 * 注入Mock进度缓存
 */
export async function injectProgressCache(page: Page, progress: ProgressData): Promise<void> {
  await page.evaluate((prog) => {
    const bridge = (window as any).__GAME_STATE_BRIDGE__;
    bridge?.updateProgressCache(prog);
  }, progress);
}

/**
 * 获取缓存状态
 */
export async function getCacheState(page: Page): Promise<CacheState> {
  return await page.evaluate(() => {
    const bridge = (window as any).__GAME_STATE_BRIDGE__;
    if (!bridge) return { exists: false, inventoryCache: null, progressCache: null };
    return {
      exists: true,
      inventoryCache: bridge.getInventoryCache?.(),
      progressCache: bridge.getProgressCache?.()
    };
  });
}

// ========================================
// 诊断模拟辅助函数
// ========================================

/**
 * 模拟诊断完成
 */
export async function simulateDiagnosisComplete(page: Page, result: DiagnosisResultData): Promise<void> {
  await page.evaluate((res) => {
    const scene = (window as any).__DIAGNOSIS_SCENE__;
    if (scene && scene.handleDiagnosisComplete) {
      scene.handleDiagnosisComplete(res);
    }
  }, result);
}

/**
 * 进入诊断场景
 */
export async function enterDiagnosisScene(page: Page, caseId: string = 'case-001'): Promise<void> {
  await page.evaluate((id) => {
    const game = (window as any).__PHASER_GAME__;
    if (game) {
      game.scene.start('DiagnosisScene', { caseId: id });
    }
  }, caseId);
  await page.waitForTimeout(TIMEOUTS.MEDIUM);
}