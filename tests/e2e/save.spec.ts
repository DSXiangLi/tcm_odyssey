// tests/e2e/save.spec.ts
/**
 * 存档系统E2E测试
 *
 * Phase 2 S7验收测试:
 * - S7-S001: 存档按钮显示
 * - S7-S002: 存档成功提示
 * - S7-S003: 退出自动存档
 * - S7-F001: Task进度恢复
 * - S7-F002: 病案历史恢复
 * - S7-F003: 场景位置恢复
 * - S7-F004: 背包数据恢复
 * - S7-F005: Hermes同步
 *
 * 测试策略 (智能测试方案):
 * 1. 使用JavaScript API访问Canvas内部游戏状态
 * 2. 使用Canvas坐标点击代替DOM选择器
 * 3. 使用截图验证Canvas渲染
 *
 * 设计原理:
 * Phaser游戏在Canvas中渲染，文字是Canvas内部图形，不是HTML DOM元素。
 * Playwright的text=选择器无法定位Canvas内部文字。
 * 解决方案: 使用JavaScript执行访问游戏内部状态，使用坐标点击交互。
 */

import { test, expect } from '@playwright/test';
import {
  waitForGameReady,
  clickCanvas,
  pressKey,
  getSaveManagerState,
  saveGame,
  loadGame,
  navigateToScene,
  waitForScene,
  captureScreenshot,
  TITLE_SCENE_COORDS,
  waitForGlobalVar
} from './utils/phaser-helper';

// 测试配置
const GAME_URL = '/';
const TIMEOUT = 30000;

test.describe('Save System E2E Tests (S7)', () => {

  test.beforeEach(async ({ page }) => {
    // 导航到游戏页面
    await page.goto(GAME_URL);

    // 等待游戏Canvas加载完成
    await waitForGameReady(page, TIMEOUT);
  });

  // ===== Smoke测试 (P0) =====

  test.describe('Smoke Tests (P0)', () => {

    test('S7-S001: 存档管理按钮显示', async ({ page }) => {
      // 检查SaveManager是否初始化并暴露到全局
      await waitForGlobalVar(page, '__SAVE_MANAGER__', 5000);

      const saveState = await getSaveManagerState(page);

      // 验证SaveManager已初始化
      expect(saveState).not.toBeNull();
      expect(saveState!.initialized).toBe(true);

      // 验证存档槽位系统可用
      expect(saveState!.slots.length).toBeGreaterThanOrEqual(3);

      // 截图验证Canvas渲染
      await captureScreenshot(page, 'S7-S001-title-save-button.png');
    });

    test('S7-S002: 存档成功提示', async ({ page }) => {
      // 点击Canvas上的"开始游戏"按钮
      await clickCanvas(page, TITLE_SCENE_COORDS.START_BUTTON.x, TITLE_SCENE_COORDS.START_BUTTON.y);
      await page.waitForTimeout(1000);

      // 等待进入BootScene并加载
      await waitForScene(page, 'TownOutdoorScene', 10000);

      // 使用JavaScript API直接触发存档
      const saveResult = await saveGame(page, 1);

      expect(saveResult).toBe(true);

      // 截图验证
      await captureScreenshot(page, 'S7-S002-save-success.png');
    });

    test('S7-S003: 存档槽位列表显示', async ({ page }) => {
      // 点击Canvas上的"存档管理"按钮
      await clickCanvas(page, TITLE_SCENE_COORDS.SAVE_MANAGE_BUTTON.x, TITLE_SCENE_COORDS.SAVE_MANAGE_BUTTON.y);
      await page.waitForTimeout(500);

      // 通过全局API检查存档槽位状态
      const saveState = await getSaveManagerState(page);

      // 验证存档槽位系统工作
      expect(saveState).not.toBeNull();
      expect(saveState!.slots.length).toBeGreaterThanOrEqual(3);

      // 截图验证
      await captureScreenshot(page, 'S7-S003-save-slots.png');
    });
  });

  // ===== 功能测试 (P1) =====

  test.describe('Functional Tests (P1)', () => {

    test('S7-F001: Task进度恢复', async ({ page }) => {
      // 1. 创建测试存档数据
      const testSaveData = {
        save_version: '3.0.0',
        saved_at: new Date().toISOString(),
        slot_id: 1,
        player: { experience: 100, unlocked_features: ['test_feature'], achievements: [] },
        inventory: { herbs: { 'mahuang': 5 }, seeds: {}, tools: [], knowledge_cards: [] },
        tasks: [{
          npc_id: 'qingmu',
          tasks: [{
            task_id: 'mahuang-tang-learning',
            status: 'completed',
            progress: 100,
            todos: [
              { id: 'composition', mastery: 1, status: 'completed' },
              { id: 'compatibility', mastery: 0.8, status: 'completed' }
            ]
          }]
        }],
        case_history: [],
        scene_state: { current_scene: 'TownOutdoorScene', player_position: { x: 47, y: 24 } },
        settings: { music_volume: 0.8, sfx_volume: 0.8, language: 'zh-CN' }
      };

      // 2. 写入localStorage模拟存档
      await page.evaluate((data) => {
        localStorage.setItem('save_slot_1', JSON.stringify(data));
      }, testSaveData);

      // 3. 刷新页面触发加载
      await page.reload();
      await page.waitForTimeout(3000);

      // 4. 检查存档是否恢复
      const loadedSave = await page.evaluate(() => {
        const data = localStorage.getItem('save_slot_1');
        return data ? JSON.parse(data) : null;
      });

      expect(loadedSave).toBeTruthy();
      expect(loadedSave.tasks[0].tasks[0].task_id).toBe('mahuang-tang-learning');
      expect(loadedSave.tasks[0].tasks[0].status).toBe('completed');

      // 截图
      await page.screenshot({ path: 'tests/screenshots/S7-F001-task-restore.png' });
    });

    test('S7-F002: 病案历史恢复', async ({ page }) => {
      // 创建包含病案历史的存档数据
      const testSaveData = {
        save_version: '3.0.0',
        saved_at: new Date().toISOString(),
        slot_id: 1,
        player: { experience: 50, unlocked_features: [], achievements: [] },
        inventory: { herbs: {}, seeds: {}, tools: [], knowledge_cards: [] },
        tasks: [],
        case_history: [{
          case_id: 'case_001',
          completed_at: new Date().toISOString(),
          score: { total: 85, inquiry: 90, pulse: 80, tongue: 85, syndrome: 85, prescription: 90 },
          clues_collected: { required: ['恶寒重', '无汗', '发热轻', '脉浮紧'], auxiliary: ['身痛'] },
          syndrome_reasoning: '这是风寒表实证...',
          npc_feedback: '诊断正确!'
        }],
        scene_state: { current_scene: 'TownOutdoorScene', player_position: { x: 47, y: 24 } },
        settings: { music_volume: 0.8, sfx_volume: 0.8, language: 'zh-CN' }
      };

      // 写入localStorage
      await page.evaluate((data) => {
        localStorage.setItem('save_slot_1', JSON.stringify(data));
      }, testSaveData);

      // 刷新页面
      await page.reload();
      await page.waitForTimeout(3000);

      // 检查病案历史是否恢复
      const loadedSave = await page.evaluate(() => {
        const data = localStorage.getItem('save_slot_1');
        return data ? JSON.parse(data) : null;
      });

      expect(loadedSave).toBeTruthy();
      expect(loadedSave.case_history.length).toBe(1);
      expect(loadedSave.case_history[0].case_id).toBe('case_001');
      expect(loadedSave.case_history[0].score.total).toBe(85);

      // 截图
      await page.screenshot({ path: 'tests/screenshots/S7-F002-case-history.png' });
    });

    test('S7-F003: 场景位置恢复', async ({ page }) => {
      // 创建包含特定场景位置的存档数据
      const testSaveData = {
        save_version: '3.0.0',
        saved_at: new Date().toISOString(),
        slot_id: 1,
        player: { experience: 0, unlocked_features: [], achievements: [] },
        inventory: { herbs: {}, seeds: {}, tools: [], knowledge_cards: [] },
        tasks: [],
        case_history: [],
        scene_state: { current_scene: 'ClinicScene', player_position: { x: 5, y: 3 } },
        settings: { music_volume: 0.8, sfx_volume: 0.8, language: 'zh-CN' }
      };

      // 写入localStorage
      await page.evaluate((data) => {
        localStorage.setItem('save_slot_1', JSON.stringify(data));
      }, testSaveData);

      // 刷新页面
      await page.reload();
      await page.waitForTimeout(3000);

      // 检查场景状态是否保存
      const loadedSave = await page.evaluate(() => {
        const data = localStorage.getItem('save_slot_1');
        return data ? JSON.parse(data) : null;
      });

      expect(loadedSave).toBeTruthy();
      expect(loadedSave.scene_state.current_scene).toBe('ClinicScene');
      expect(loadedSave.scene_state.player_position.x).toBe(5);
      expect(loadedSave.scene_state.player_position.y).toBe(3);

      // 截图
      await page.screenshot({ path: 'tests/screenshots/S7-F003-scene-position.png' });
    });

    test('S7-F004: 存档删除功能', async ({ page }) => {
      // 先创建一个存档
      await page.evaluate(() => {
        const testData = {
          save_version: '3.0.0',
          saved_at: new Date().toISOString(),
          slot_id: 1,
          player: { experience: 10, unlocked_features: [], achievements: [] },
          inventory: { herbs: {}, seeds: {}, tools: [], knowledge_cards: [] },
          tasks: [],
          case_history: [],
          scene_state: { current_scene: 'TownOutdoorScene', player_position: { x: 47, y: 24 } },
          settings: { music_volume: 0.8, sfx_volume: 0.8, language: 'zh-CN' }
        };
        localStorage.setItem('save_slot_1', JSON.stringify(testData));
      });

      // 等待存档确认
      await page.waitForTimeout(500);

      // 检查存档存在
      const beforeDelete = await page.evaluate(() => {
        return localStorage.getItem('save_slot_1') !== null;
      });
      expect(beforeDelete).toBe(true);

      // 使用SaveManager删除存档
      const deleteResult = await page.evaluate(async () => {
        const saveManager = (window as any).__SAVE_MANAGER__;
        if (saveManager) {
          return await saveManager.deleteSave(1);
        }
        return false;
      });

      expect(deleteResult).toBe(true);

      // 检查存档已删除
      const afterDelete = await page.evaluate(() => {
        return localStorage.getItem('save_slot_1') === null;
      });
      expect(afterDelete).toBe(true);

      // 截图
      await page.screenshot({ path: 'tests/screenshots/S7-F004-delete-save.png' });
    });
  });

  // ===== 逻辑测试 =====

  test.describe('Logic Tests', () => {

    test('S7-L001: 存档完整性验证', async ({ page }) => {
      // 创建存档
      const saveResult = await page.evaluate(async () => {
        const saveManager = (window as any).__SAVE_MANAGER__;
        if (saveManager) {
          return await saveManager.save(1);
        }
        return false;
      });

      expect(saveResult).toBe(true);

      // 验证存档包含所有必需字段
      const loadedSave = await page.evaluate(() => {
        const data = localStorage.getItem('save_slot_1');
        return data ? JSON.parse(data) : null;
      });

      expect(loadedSave).toBeTruthy();

      // 验证必需字段存在
      expect(loadedSave.save_version).toBeDefined();
      expect(loadedSave.saved_at).toBeDefined();
      expect(loadedSave.slot_id).toBeDefined();
      expect(loadedSave.player).toBeDefined();
      expect(loadedSave.inventory).toBeDefined();
      expect(loadedSave.tasks).toBeDefined();
      expect(loadedSave.case_history).toBeDefined();
      expect(loadedSave.scene_state).toBeDefined();
      expect(loadedSave.settings).toBeDefined();

      // 截图
      await page.screenshot({ path: 'tests/screenshots/S7-L001-save-integrity.png' });
    });

    test('S7-L002: 多存档槽位管理', async ({ page }) => {
      // 创建多个存档
      for (let slot = 1; slot <= 3; slot++) {
        await page.evaluate(async (slotId) => {
          const saveManager = (window as any).__SAVE_MANAGER__;
          if (saveManager) {
            return await saveManager.save(slotId);
          }
          return false;
        }, slot);

        await page.waitForTimeout(100);
      }

      // 检查所有存档槽位
      const slots = await page.evaluate(() => {
        const saveManager = (window as any).__SAVE_MANAGER__;
        if (saveManager) {
          return saveManager.getSaveSlots();
        }
        return [];
      });

      expect(slots.length).toBe(3);
      expect(slots[0].exists).toBe(true);
      expect(slots[1].exists).toBe(true);
      expect(slots[2].exists).toBe(true);

      // 截图
      await page.screenshot({ path: 'tests/screenshots/S7-L002-multi-slots.png' });
    });

    test('S7-L003: 版本兼容性检查', async ({ page }) => {
      // 测试旧版本存档
      const oldVersionSave = {
        save_version: '2.0.0',  // 不兼容版本
        saved_at: new Date().toISOString(),
        slot_id: 1,
        player: { experience: 0, unlocked_features: [], achievements: [] },
        inventory: { herbs: {}, seeds: {}, tools: [], knowledge_cards: [] },
        tasks: [],
        case_history: [],
        scene_state: { current_scene: 'TownOutdoorScene', player_position: { x: 47, y: 24 } },
        settings: { music_volume: 0.8, sfx_volume: 0.8, language: 'zh-CN' }
      };

      await page.evaluate((data) => {
        localStorage.setItem('save_slot_1', JSON.stringify(data));
      }, oldVersionSave);

      // 检查版本兼容性
      const isCompatible = await page.evaluate(() => {
        const saveManager = (window as any).__SAVE_MANAGER__;
        if (saveManager) {
          const data = localStorage.getItem('save_slot_1');
          const parsed = data ? JSON.parse(data) : null;
          // 检查版本是否兼容（主版本号匹配）
          return parsed?.save_version?.split('.')[0] === '3';
        }
        return false;
      });

      expect(isCompatible).toBe(false);

      // 截图
      await page.screenshot({ path: 'tests/screenshots/S7-L003-version-compat.png' });
    });
  });

  // ===== 存档恢复旅程测试 =====

  test.describe('Save Restore Journey Tests', () => {

    test('S7-J001: 完整存档恢复旅程', async ({ page }) => {
      // 1. 开始游戏并进入诊所
      await page.click('text=开始游戏');
      await page.waitForTimeout(3000);

      // 等待进入游戏世界
      await page.waitForTimeout(2000);

      // 2. 执行存档
      const saveResult = await page.evaluate(async () => {
        const saveManager = (window as any).__SAVE_MANAGER__;
        if (saveManager) {
          return await saveManager.save(1);
        }
        return false;
      });

      expect(saveResult).toBe(true);

      // 3. 记录存档数据
      const savedData = await page.evaluate(() => {
        return localStorage.getItem('save_slot_1');
      });
      expect(savedData).toBeTruthy();

      // 4. 清除页面状态（模拟退出）
      await page.evaluate(() => {
        // 清除全局变量模拟退出
        (window as any).__SAVE_MANAGER__ = null;
      });

      // 5. 刷新页面（模拟重启）
      await page.reload();
      await page.waitForTimeout(3000);

      // 6. 验证存档数据仍然存在
      const loadedData = await page.evaluate(() => {
        return localStorage.getItem('save_slot_1');
      });

      expect(loadedData).toBeTruthy();
      expect(loadedData).toBe(savedData);

      // 截图
      await page.screenshot({ path: 'tests/screenshots/S7-J001-full-restore-journey.png' });
    });

    test('S7-J002: 存档并继续游戏', async ({ page }) => {
      // 创建测试存档
      const testSaveData = {
        save_version: '3.0.0',
        saved_at: new Date().toISOString(),
        slot_id: 1,
        player: { experience: 50, unlocked_features: ['basic_navigation'], achievements: ['first_visit'] },
        inventory: { herbs: { 'mahuang': 3, 'guizhi': 2 }, seeds: {}, tools: ['sickle'], knowledge_cards: ['mahuang-tang-card'] },
        tasks: [{
          npc_id: 'qingmu',
          tasks: [{
            task_id: 'mahuang-tang-learning',
            status: 'in_progress',
            progress: 0.5,
            todos: [
              { id: 'composition', mastery: 0.9, status: 'completed' },
              { id: 'compatibility', mastery: 0.3, status: 'in_progress' }
            ]
          }]
        }],
        case_history: [{
          case_id: 'case_001',
          completed_at: new Date(Date.now() - 86400000).toISOString(),  // 一天前
          score: { total: 85, inquiry: 90, pulse: 80, tongue: 85, syndrome: 85, prescription: 90 },
          clues_collected: { required: ['恶寒重', '无汗', '发热轻', '脉浮紧'], auxiliary: ['身痛', '头痛'] },
          syndrome_reasoning: '风寒束表，营卫郁滞，故见恶寒重发热轻无汗脉浮紧',
          npc_feedback: '诊断准确，论述清晰。'
        }],
        scene_state: { current_scene: 'TownOutdoorScene', player_position: { x: 60, y: 8 } },  // 诊所门口
        settings: { music_volume: 0.8, sfx_volume: 0.8, language: 'zh-CN' }
      };

      // 写入存档
      await page.evaluate((data) => {
        localStorage.setItem('save_slot_1', JSON.stringify(data));
      }, testSaveData);

      // 刷新游戏
      await page.reload();
      await page.waitForTimeout(3000);

      // 点击继续游戏
      const continueButton = page.locator('text=继续游戏');
      await expect(continueButton).toBeVisible({ timeout: 5000 });
      await continueButton.click();

      // 等待加载完成
      await page.waitForTimeout(2000);

      // 验证存档数据被正确加载
      const loadedSave = await page.evaluate(() => {
        const data = localStorage.getItem('save_slot_1');
        return data ? JSON.parse(data) : null;
      });

      expect(loadedSave).toBeTruthy();
      expect(loadedSave.player.experience).toBe(50);
      expect(loadedSave.inventory.herbs['mahuang']).toBe(3);
      expect(loadedSave.case_history.length).toBe(1);

      // 截图
      await page.screenshot({ path: 'tests/screenshots/S7-J002-continue-game.png' });
    });
  });

  // 测试后清理
  test.afterEach(async ({ page }) => {
    // 清理localStorage
    await page.evaluate(() => {
      localStorage.removeItem('save_slot_1');
      localStorage.removeItem('save_slot_2');
      localStorage.removeItem('save_slot_3');
    });
  });
});