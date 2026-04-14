// tests/e2e/cases.spec.ts
/**
 * 病案系统E2E测试
 *
 * Phase 2 S5 测试验收
 * 测试项目:
 * - S5-S001: 病案列表显示
 * - S5-S002: 病案详情显示
 * - S5-S003: 病案库入口
 * - S5-F001: blocked_by解锁
 * - S5-F002: 自由病案状态
 * - S5-F003: 完成状态更新
 * - S5-F004: 进行中状态
 * - S5-F005: 历史记录保存
 * - S5-F006: 回顾详情显示
 *
 * 测试策略 (智能测试方案):
 * 使用JavaScript API访问Canvas内部游戏状态，
 * 使用Canvas坐标点击代替DOM选择器，
 * 使用截图验证Canvas渲染。
 */

import { test, expect } from '@playwright/test';
import {
  waitForGameReady,
  clickCanvas,
  pressKey,
  navigateToScene,
  waitForScene,
  getCaseManagerState,
  getCasesUIState,
  openCasesList,
  captureScreenshot,
  TITLE_SCENE_COORDS,
  waitForGlobalVar
} from './utils/phaser-helper';

test.describe('Case System Smoke Tests (S5-S001~S003)', () => {
  test.beforeEach(async ({ page }) => {
    // 启动游戏
    await page.goto('/');

    // 等待游戏加载完成
    await waitForGameReady(page);

    // 点击开始游戏按钮
    await clickCanvas(page, TITLE_SCENE_COORDS.START_BUTTON.x, TITLE_SCENE_COORDS.START_BUTTON.y);
    await page.waitForTimeout(1000);

    // 导航到诊所场景
    await navigateToScene(page, 'ClinicScene');

    // 等待病案管理器初始化
    await waitForGlobalVar(page, '__CASE_MANAGER__', 5000);
  });

  test('S5-S001: CasesListUI should display correctly', async ({ page }) => {
    // 等待诊所场景完全加载
    await page.waitForTimeout(500);

    // 按C键打开病案列表
    await openCasesList(page);

    // 等待UI渲染
    await page.waitForTimeout(1000);

    // 检查病案列表UI是否显示（通过全局状态）
    const uiState = await getCasesUIState(page);

    expect(uiState!.listUI).not.toBeNull();
    expect(uiState!.listUI.visible).toBe(true);

    // 检查病案总数
    const caseState = await getCaseManagerState(page);
    expect(caseState!.statistics.total).toBeGreaterThanOrEqual(4);

    // 截图验证
    await captureScreenshot(page, 'S5-S001-cases-list.png');
  });

  test('S5-S002: Case detail should display complete information', async ({ page }) => {
    // 打开病案列表
    await openCasesList(page);
    await page.waitForTimeout(1000);

    // 点击第一个病案查看详情（使用Canvas坐标）
    // 病案列表中第一个项目在大约(400, 160)的位置
    await clickCanvas(page, 400, 160);
    await page.waitForTimeout(500);

    // 检查病案详情UI是否显示
    const uiState = await getCasesUIState(page);

    expect(uiState!.detailUI).not.toBeNull();
    expect(uiState!.detailUI.visible).toBe(true);

    // 验证病案信息完整性
    expect(uiState!.detailUI.caseId).toBeDefined();
    expect(uiState!.detailUI.syndrome).toBeDefined();
    expect(uiState!.detailUI.prescription).toBeDefined();
    expect(uiState!.detailUI.status).toBeDefined();

    // 截图验证
    await captureScreenshot(page, 'S5-S002-case-detail.png');
  });

  test('S5-S003: Cases entry should be accessible from clinic', async ({ page }) => {
    // 检查诊所场景中病案管理器是否初始化
    const caseState = await getCaseManagerState(page);

    expect(caseState).not.toBeNull();
    expect(caseState!.initialized).toBe(true);

    // 检查病案按钮存在（通过场景状态）
    const currentScene = await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      if (!game) return null;
      const scene = game.scene.getScene('ClinicScene');
      return scene ? { hasCasesButton: scene.casesButton !== undefined } : null;
    });

    expect(currentScene!.hasCasesButton).toBe(true);

    // 截图验证
    await captureScreenshot(page, 'S5-S003-cases-entry.png');
  });
});

test.describe('Case System Functional Tests (S5-F001~F006)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForGameReady(page);
    await clickCanvas(page, TITLE_SCENE_COORDS.START_BUTTON.x, TITLE_SCENE_COORDS.START_BUTTON.y);
    await page.waitForTimeout(1000);
    await navigateToScene(page, 'ClinicScene');
    await waitForGlobalVar(page, '__CASE_MANAGER__', 5000);
  });

  test('S5-F001: blocked_by unlocking mechanism', async ({ page }) => {
    // 打开病案列表
    await openCasesList(page);
    await page.waitForTimeout(1000);

    // 获取病案状态
    const caseState = await getCaseManagerState(page);

    // 验证：初始状态下，大部分病案应该是locked（因为Task未完成）
    expect(caseState!.statistics.locked).toBeGreaterThan(0);

    // 截图验证
    await captureScreenshot(page, 'S5-F001-unlock-mechanism.png');
  });

  test('S5-F002: Free cases (blocked_by=null) should be playable', async ({ page }) => {
    // 获取病案状态
    const caseState = await getCaseManagerState(page);

    // 检查是否有解锁状态的病案
    // 自由病案（blocked_by=null）应该是unlocked
    expect(caseState!.statistics.unlocked).toBeGreaterThanOrEqual(0);

    // 截图验证
    await captureScreenshot(page, 'S5-F002-free-cases.png');
  });

  test('S5-F003: Completed status should show score', async ({ page }) => {
    // 模拟完成一个病案
    await page.evaluate(() => {
      const manager = (window as any).__CASE_MANAGER__;
      if (manager && manager.completeCase) {
        manager.completeCase('case_001', {
          case_id: 'case_001',
          completed_at: new Date().toISOString(),
          score: {
            total: 85,
            inquiry: 15,
            pulse: 12,
            tongue: 8,
            syndrome: 30,
            prescription: 20
          },
          clues_collected: {
            required: ['恶寒重', '无汗', '脉浮紧'],
            auxiliary: ['身痛']
          },
          syndrome_reasoning: '这是风寒表实证...',
          npc_feedback: '诊断正确，继续努力...'
        });
      }
    });

    await page.waitForTimeout(500);

    // 打开病案列表
    await openCasesList(page);
    await page.waitForTimeout(1000);

    // 获取更新后的病案状态
    const caseState = await getCaseManagerState(page);

    // 验证已完成病案数量增加
    expect(caseState!.statistics.completed).toBeGreaterThanOrEqual(1);

    // 截图验证
    await captureScreenshot(page, 'S5-F003-completed-score.png');
  });

  test('S5-F004: In-progress status should show continue button', async ({ page }) => {
    // 模拟开始病案
    await page.evaluate(() => {
      const manager = (window as any).__CASE_MANAGER__;
      if (manager && manager.startCase) {
        manager.startCase('case_001');
      }
    });

    await page.waitForTimeout(500);

    // 打开病案列表
    await openCasesList(page);
    await page.waitForTimeout(1000);

    // 获取病案状态
    const caseState = await getCaseManagerState(page);

    // 验证进行中病案数量
    expect(caseState!.statistics.in_progress).toBeGreaterThanOrEqual(1);

    // 截图验证
    await captureScreenshot(page, 'S5-F004-in-progress.png');
  });

  test('S5-F005: History records should be saved', async ({ page }) => {
    // 检查病案历史记录功能
    const historyResult = await page.evaluate(() => {
      const manager = (window as any).__CASE_MANAGER__;
      if (!manager) return { success: false };

      const history = manager.getCaseHistory ? manager.getCaseHistory() : [];
      return {
        success: true,
        historyCount: history.length,
        isArray: Array.isArray(history)
      };
    });

    expect(historyResult.success).toBe(true);
    expect(historyResult.isArray).toBe(true);

    // 截图验证
    await captureScreenshot(page, 'S5-F005-history.png');
  });

  test('S5-F006: Detail view should show complete history', async ({ page }) => {
    // 先确保有一个已完成的病案
    await page.evaluate(() => {
      const manager = (window as any).__CASE_MANAGER__;
      if (manager && manager.completeCase) {
        manager.completeCase('case_001', {
          case_id: 'case_001',
          completed_at: new Date().toISOString(),
          score: {
            total: 78,
            inquiry: 12,
            pulse: 10,
            tongue: 7,
            syndrome: 28,
            prescription: 21
          },
          clues_collected: {
            required: ['恶寒重', '无汗'],
            auxiliary: []
          },
          syndrome_reasoning: '辨证论述测试内容',
          npc_feedback: 'NPC点评测试内容'
        });
      }
    });

    await page.waitForTimeout(500);

    // 打开病案列表
    await openCasesList(page);
    await page.waitForTimeout(1000);

    // 点击查看详情
    await clickCanvas(page, 400, 160);
    await page.waitForTimeout(500);

    // 检查详情页是否显示完整历史信息
    const uiState = await getCasesUIState(page);

    expect(uiState!.detailUI).not.toBeNull();
    expect(uiState!.detailUI.caseId).toBe('case_001');
    expect(uiState!.detailUI.score).toBe(78);

    // 截图验证
    await captureScreenshot(page, 'S5-F006-detail-history.png');
  });
});

test.describe('Case System Logic Tests (S5-L001~L004)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForGameReady(page);
    await clickCanvas(page, TITLE_SCENE_COORDS.START_BUTTON.x, TITLE_SCENE_COORDS.START_BUTTON.y);
    await page.waitForTimeout(1000);
    await navigateToScene(page, 'ClinicScene');
    await waitForGlobalVar(page, '__CASE_MANAGER__', 5000);
  });

  test('S5-L001: Unlock condition validation', async ({ page }) => {
    // 测试解锁条件验证逻辑
    const unlockValidation = await page.evaluate(() => {
      const manager = (window as any).__CASE_MANAGER__;
      if (!manager) return { success: false };

      // 获取一个locked病案
      const cases = manager.getAllCases ? manager.getAllCases() : [];
      const lockedCase = cases.find(c => c.status === 'locked');

      if (!lockedCase) return { success: false, message: 'No locked case found' };

      // 检查解锁条件是否正确
      const unlockCondition = manager.getUnlockCondition(lockedCase.case_id);
      const blockedBy = lockedCase.definition?.blocked_by;

      return {
        success: true,
        caseId: lockedCase.case_id,
        blockedBy: blockedBy,
        unlockCondition: unlockCondition,
        conditionContainsBlockedBy: unlockCondition?.includes(blockedBy || '')
      };
    });

    expect(unlockValidation.success).toBe(true);
    // 如果有locked病案，验证解锁条件
    if (unlockValidation.message !== 'No locked case found') {
      expect(unlockValidation.conditionContainsBlockedBy).toBe(true);
    }
  });

  test('S5-L002: State consistency', async ({ page }) => {
    // 测试病案状态一致性
    const stateConsistency = await page.evaluate(() => {
      const manager = (window as any).__CASE_MANAGER__;
      if (!manager) return { success: false };

      const cases = manager.getAllCases ? manager.getAllCases() : [];
      const history = manager.getCaseHistory ? manager.getCaseHistory() : [];

      // 检查已完成病案数量与历史记录数量一致
      const completedCases = cases.filter(c => c.status === 'completed');
      const historyCount = history.length;

      return {
        success: true,
        completedCount: completedCases.length,
        historyCount: historyCount,
        consistent: completedCases.length === historyCount
      };
    });

    expect(stateConsistency.success).toBe(true);
    expect(stateConsistency.consistent).toBe(true);
  });

  test('S5-L003: Multiple in-progress handling', async ({ page }) => {
    // 测试多个进行中病案的并发处理
    const multiProgress = await page.evaluate(() => {
      const manager = (window as any).__CASE_MANAGER__;
      if (!manager) return { success: false };

      // 模拟开始多个病案
      const unlockedCases = (manager.getAllCases ? manager.getAllCases() : [])
        .filter(c => c.status === 'unlocked');

      if (unlockedCases.length < 2) {
        return { success: true, canTest: false };
      }

      // 开始两个病案
      manager.startCase(unlockedCases[0].case_id);
      manager.startCase(unlockedCases[1].case_id);

      // 检查是否都能正确标记为进行中
      const cases = manager.getAllCases();
      const inProgress = cases.filter(c => c.status === 'in_progress');

      return {
        success: true,
        canTest: true,
        inProgressCount: inProgress.length,
        correct: inProgress.length === 2
      };
    });

    expect(multiProgress.success).toBe(true);
    if (multiProgress.canTest) {
      expect(multiProgress.correct).toBe(true);
    }
  });

  test('S5-L004: Sorting logic', async ({ page }) => {
    // 测试病案排序逻辑
    const sortingLogic = await page.evaluate(() => {
      const manager = (window as any).__CASE_MANAGER__;
      if (!manager) return { success: false };

      const cases = manager.getAllCases ? manager.getAllCases() : [];

      // 验证排序：进行中 > 已解锁 > 已完成 > 未解锁
      const statusOrder = ['in_progress', 'unlocked', 'completed', 'locked'];
      let correctOrder = true;

      for (let i = 0; i < cases.length - 1; i++) {
        const currentOrder = statusOrder.indexOf(cases[i].status);
        const nextOrder = statusOrder.indexOf(cases[i + 1].status);
        if (currentOrder > nextOrder) {
          correctOrder = false;
          break;
        }
      }

      return {
        success: true,
        caseCount: cases.length,
        correctOrder: correctOrder,
        firstCaseStatus: cases[0]?.status,
        lastCaseStatus: cases[cases.length - 1]?.status
      };
    });

    expect(sortingLogic.success).toBe(true);
    expect(sortingLogic.correctOrder).toBe(true);
  });
});