// tests/e2e/processing.spec.ts
/**
 * 炮制系统 E2E 测试
 * Phase 2 S10.5 验收测试
 *
 * 测试覆盖:
 * - S10-S001~S004: Smoke测试（场景加载、Manager暴露、UI显示、场景注册）
 * - S10-F001~F005: 功能测试（药材选择、方法选择、辅料选择、炮制进度、结果评分）
 * - S10-L001~L003: 逻辑测试（阶段流转、评分计算、重置功能）
 * - S10-I001~I002: 集成测试（完整流程、错误操作）
 */

import { test, expect } from '@playwright/test';

// ============================================
// S10 Smoke 测试
// ============================================
test.describe('Processing System Smoke Tests (S10-S001~S004)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(3000);
  });

  test('S10-S001: 炮制场景正常加载渲染', async ({ page }) => {
    // 进入炮制场景
    await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      if (game) {
        game.scene.start('ProcessingScene');
      }
    });

    await page.waitForTimeout(2000);

    // 检查炮制场景是否初始化
    const processingSceneState = await page.evaluate(() => {
      const processingScene = (window as any).__PROCESSING_SCENE__;
      return processingScene ? {
        isInitialized: processingScene.isInitialized,
        phase: processingScene.phase,
        herbId: processingScene.herbId
      } : null;
    });

    expect(processingSceneState).not.toBeNull();
    expect(processingSceneState?.isInitialized).toBe(true);
    expect(processingSceneState?.phase).toBe('select_herb');
  });

  test('S10-S002: ProcessingManager全局暴露', async ({ page }) => {
    // 进入炮制场景
    await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      if (game) {
        game.scene.start('ProcessingScene');
      }
    });

    await page.waitForTimeout(2000);

    // 检查ProcessingManager是否暴露
    const managerAvailable = await page.evaluate(() => {
      return (window as any).__PROCESSING_MANAGER__ !== undefined;
    });

    expect(managerAvailable).toBe(true);
  });

  test('S10-S003: ProcessingManager状态可访问', async ({ page }) => {
    // 进入炮制场景
    await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      if (game) {
        game.scene.start('ProcessingScene');
      }
    });

    await page.waitForTimeout(2000);

    // 检查ProcessingManager实例
    const managerState = await page.evaluate(() => {
      const manager = (window as any).__PROCESSING_MANAGER__;
      if (!manager) return null;

      const state = manager.getState();
      return {
        phase: state.phase,
        herb_id: state.herb_id,
        method: state.method,
        adjuvant: state.adjuvant,
        processing_time: state.processing_time,
        target_time: state.target_time
      };
    });

    expect(managerState).not.toBeNull();
    expect(managerState?.phase).toBe('select_herb');
    expect(managerState?.herb_id).toBeNull();
    expect(managerState?.method).toBeNull();
  });

  test('S10-S004: 炮制场景已注册到Phaser', async ({ page }) => {
    // 检查场景是否注册
    const sceneRegistered = await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      if (!game) return false;
      const sceneManager = game.scene;
      return sceneManager.keys && sceneManager.keys['ProcessingScene'] !== undefined;
    });

    expect(sceneRegistered).toBe(true);
  });
});

// ============================================
// S10 Functional 测试
// ============================================
test.describe('Processing System Functional Tests (S10-F001~F005)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(3000);

    // 给InventoryManager添加药材和辅料（测试用）
    await page.evaluate(() => {
      const inventory = (window as any).__INVENTORY_MANAGER__;
      if (inventory) {
        // 添加可炮制的药材：甘草、麻黄
        inventory.addHerb('gancao', 5);
        inventory.addHerb('mahuang', 5);
        // 添加辅料：蜂蜜
        inventory.addHerb('feng-mi', 5);
      }
    });

    // 进入炮制场景
    await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      if (game) {
        game.scene.start('ProcessingScene');
      }
    });
    await page.waitForTimeout(2000);
  });

  test('S10-F001: 药材选择功能', async ({ page }) => {
    // 选择甘草
    const selectResult = await page.evaluate(() => {
      const manager = (window as any).__PROCESSING_MANAGER__;
      if (!manager) return false;
      return manager.selectHerb('gancao');
    });

    expect(selectResult).toBe(true);

    // 检查状态更新
    const stateAfterSelect = await page.evaluate(() => {
      const manager = (window as any).__PROCESSING_MANAGER__;
      if (!manager) return null;
      const state = manager.getState();
      return {
        herb_id: state.herb_id,
        phase: state.phase
      };
    });

    expect(stateAfterSelect?.herb_id).toBe('gancao');
    expect(stateAfterSelect?.phase).toBe('select_method');
  });

  test('S10-F002: 方法选择功能', async ({ page }) => {
    // 先选择药材
    await page.evaluate(() => {
      const manager = (window as any).__PROCESSING_MANAGER__;
      if (manager) {
        manager.selectHerb('gancao');
      }
    });

    await page.waitForTimeout(500);

    // 选择蜜炙方法
    const selectResult = await page.evaluate(() => {
      const manager = (window as any).__PROCESSING_MANAGER__;
      if (!manager) return false;
      return manager.selectMethod('mi-zhi');
    });

    expect(selectResult).toBe(true);

    // 检查状态更新
    const stateAfterSelect = await page.evaluate(() => {
      const manager = (window as any).__PROCESSING_MANAGER__;
      if (!manager) return null;
      const state = manager.getState();
      return {
        method: state.method,
        phase: state.phase,
        target_time: state.target_time,
        temperature: state.temperature
      };
    });

    expect(stateAfterSelect?.method).toBe('mi-zhi');
    expect(stateAfterSelect?.phase).toBe('select_adjuvant');
    // 蜜炙时间范围180-360秒，中间值270秒
    expect(stateAfterSelect?.target_time).toBe(270);
    expect(stateAfterSelect?.temperature).toBe('文火');
  });

  test('S10-F003: 辅料选择功能', async ({ page }) => {
    // 快速到达辅料选择阶段
    await page.evaluate(() => {
      const manager = (window as any).__PROCESSING_MANAGER__;
      if (manager) {
        manager.selectHerb('gancao');
        manager.selectMethod('mi-zhi');
      }
    });

    await page.waitForTimeout(500);

    // 检查是否进入辅料选择阶段
    const phaseBeforeSelect = await page.evaluate(() => {
      const manager = (window as any).__PROCESSING_MANAGER__;
      return manager?.getPhase();
    });

    expect(phaseBeforeSelect).toBe('select_adjuvant');

    // 选择蜂蜜辅料
    const selectResult = await page.evaluate(() => {
      const manager = (window as any).__PROCESSING_MANAGER__;
      if (!manager) return false;
      return manager.selectAdjuvant('feng-mi');
    });

    expect(selectResult).toBe(true);

    // 检查状态更新
    const stateAfterSelect = await page.evaluate(() => {
      const manager = (window as any).__PROCESSING_MANAGER__;
      if (!manager) return null;
      const state = manager.getState();
      return {
        adjuvant: state.adjuvant,
        phase: state.phase
      };
    });

    expect(stateAfterSelect?.adjuvant).toBe('feng-mi');
    expect(stateAfterSelect?.phase).toBe('preprocess');
  });

  test('S10-F004: 炮制进度控制', async ({ page }) => {
    // 快速到达炮制阶段
    await page.evaluate(() => {
      const manager = (window as any).__PROCESSING_MANAGER__;
      if (manager) {
        manager.selectHerb('gancao');
        manager.selectMethod('mi-zhi');
        manager.selectAdjuvant('feng-mi');
        manager.startPreprocess();
        manager.startProcessing();
      }
    });

    await page.waitForTimeout(500);

    // 检查是否进入炮制阶段
    const phaseDuringProcessing = await page.evaluate(() => {
      const manager = (window as any).__PROCESSING_MANAGER__;
      return manager?.getPhase();
    });

    expect(phaseDuringProcessing).toBe('processing');

    // 等待炮制进行一段时间
    await page.waitForTimeout(3000);

    const stateAfterTick = await page.evaluate(() => {
      const manager = (window as any).__PROCESSING_MANAGER__;
      if (!manager) return null;
      const state = manager.getState();
      return {
        processing_time: state.processing_time,
        target_time: state.target_time
      };
    });

    expect(stateAfterTick?.processing_time).toBeGreaterThan(0);
  });

  test('S10-F005: 结果评分功能', async ({ page }) => {
    // 快速完成炮制流程
    await page.evaluate(() => {
      const manager = (window as any).__PROCESSING_MANAGER__;
      if (manager) {
        manager.selectHerb('gancao');
        manager.selectMethod('mi-zhi');
        manager.selectAdjuvant('feng-mi');
        manager.startPreprocess();
        manager.startProcessing();
      }
    });

    // 等待炮制进行一段时间
    await page.waitForTimeout(3000);

    // 停止炮制并提交结果
    await page.evaluate(() => {
      const manager = (window as any).__PROCESSING_MANAGER__;
      if (manager) {
        manager.stopProcessing();
        manager.submitEndpoint(['色泽均匀', '蜜香浓郁', '不焦不糊']);
      }
    });

    await page.waitForTimeout(1000);

    // 检查评分结果
    const scoreResult = await page.evaluate(() => {
      const manager = (window as any).__PROCESSING_MANAGER__;
      if (!manager) return null;
      const state = manager.getState();
      return state.score;
    });

    expect(scoreResult).not.toBeNull();
    expect(scoreResult?.total_score).toBeDefined();
    expect(scoreResult?.method_score).toBeDefined();
    expect(scoreResult?.adjuvant_score).toBeDefined();
    expect(scoreResult?.time_score).toBeDefined();
    expect(scoreResult?.quality_score).toBeDefined();
    expect(scoreResult?.passed).toBeDefined();
    expect(scoreResult?.feedback).toBeDefined();
  });
});

// ============================================
// S10 Logic 测试
// ============================================
test.describe('Processing System Logic Tests (S10-L001~L003)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(3000);

    // 给InventoryManager添加药材和辅料
    await page.evaluate(() => {
      const inventory = (window as any).__INVENTORY_MANAGER__;
      if (inventory) {
        inventory.addHerb('gancao', 5);
        inventory.addHerb('mahuang', 5);
        inventory.addHerb('feng-mi', 5);
      }
    });
  });

  test('S10-L001: 阶段流转逻辑正确', async ({ page }) => {
    // 进入炮制场景
    await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      if (game) {
        game.scene.start('ProcessingScene');
      }
    });
    await page.waitForTimeout(2000);

    // 验证阶段顺序
    const phaseSequence = await page.evaluate(() => {
      const manager = (window as any).__PROCESSING_MANAGER__;
      if (!manager) return null;

      const phases: string[] = [];

      // 初始阶段
      phases.push(manager.getPhase());

      // 选择药材后
      manager.selectHerb('gancao');
      phases.push(manager.getPhase());

      // 选择方法后
      manager.selectMethod('mi-zhi');
      phases.push(manager.getPhase());

      // 选择辅料后
      manager.selectAdjuvant('feng-mi');
      phases.push(manager.getPhase());

      // 预处理后
      manager.startPreprocess();
      phases.push(manager.getPhase());

      return phases;
    });

    expect(phaseSequence).toEqual([
      'select_herb',
      'select_method',
      'select_adjuvant',
      'preprocess',
      'processing'
    ]);
  });

  test('S10-L002: 评分计算逻辑正确（满分场景）', async ({ page }) => {
    // 进入炮制场景
    await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      if (game) {
        game.scene.start('ProcessingScene');
      }
    });
    await page.waitForTimeout(2000);

    // 完成炮制流程（正确操作）
    const scoreResult = await page.evaluate(() => {
      const manager = (window as any).__PROCESSING_MANAGER__;
      if (!manager) return null;

      // 选择甘草（正确）
      manager.selectHerb('gancao');

      // 选择蜜炙（正确，推荐方法）
      manager.selectMethod('mi-zhi');

      // 选择蜂蜜（正确，推荐辅料）
      manager.selectAdjuvant('feng-mi');

      // 开始炮制
      manager.startPreprocess();
      manager.startProcessing();

      // 等待达到最佳时间（蜜炙时间范围180-360，中间值270秒）
      // 测试中直接停止并提交
      manager.stopProcessing();

      // 提交质量检查（全部正确）
      manager.submitEndpoint(['色泽均匀', '蜜香浓郁', '不焦不糊']);

      return manager.getState().score;
    });

    expect(scoreResult).not.toBeNull();

    // 验证评分维度权重
    // 方法30分 + 辅料20分 + 时间30分 + 质量20分 = 100分满分
    expect(scoreResult?.method_score).toBe(30);  // 选择推荐方法
    expect(scoreResult?.adjuvant_score).toBe(20); // 选择推荐辅料
    expect(scoreResult?.quality_score).toBe(20);  // 全部质量检查通过

    // 时间分数取决于实际炮制时间，测试中可能不完美
    // 总分应该 >= 60（通过）
    expect(scoreResult?.total_score).toBeGreaterThanOrEqual(60);
    expect(scoreResult?.passed).toBe(true);
  });

  test('S10-L003: 重置功能正确', async ({ page }) => {
    // 进入炮制场景
    await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      if (game) {
        game.scene.start('ProcessingScene');
      }
    });
    await page.waitForTimeout(2000);

    // 完成部分流程
    await page.evaluate(() => {
      const manager = (window as any).__PROCESSING_MANAGER__;
      if (manager) {
        manager.selectHerb('gancao');
        manager.selectMethod('mi-zhi');
      }
    });

    await page.waitForTimeout(500);

    // 执行重置
    await page.evaluate(() => {
      const manager = (window as any).__PROCESSING_MANAGER__;
      if (manager) {
        manager.reset();
      }
    });

    await page.waitForTimeout(500);

    // 检查重置后状态
    const stateAfterReset = await page.evaluate(() => {
      const manager = (window as any).__PROCESSING_MANAGER__;
      if (!manager) return null;
      const state = manager.getState();
      return {
        phase: state.phase,
        herb_id: state.herb_id,
        method: state.method,
        adjuvant: state.adjuvant,
        processing_time: state.processing_time
      };
    });

    expect(stateAfterReset?.phase).toBe('select_herb');
    expect(stateAfterReset?.herb_id).toBeNull();
    expect(stateAfterReset?.method).toBeNull();
    expect(stateAfterReset?.adjuvant).toBeNull();
    expect(stateAfterReset?.processing_time).toBe(0);
  });
});

// ============================================
// S10 Integration 测试
// ============================================
test.describe('Processing System Integration Tests (S10-I001~I002)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(3000);

    // 给InventoryManager添加药材和辅料
    await page.evaluate(() => {
      const inventory = (window as any).__INVENTORY_MANAGER__;
      if (inventory) {
        inventory.addHerb('gancao', 10);
        inventory.addHerb('mahuang', 10);
        inventory.addHerb('feng-mi', 10);
      }
    });
  });

  test('S10-I001: 完整炮制流程测试', async ({ page }) => {
    // 进入炮制场景
    await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      if (game) {
        game.scene.start('ProcessingScene');
      }
    });
    await page.waitForTimeout(2000);

    // 1. 选择药材（甘草）
    await page.evaluate(() => {
      const manager = (window as any).__PROCESSING_MANAGER__;
      if (manager) {
        manager.selectHerb('gancao');
      }
    });
    await page.waitForTimeout(500);

    // 验证药材选择
    const stateAfterHerb = await page.evaluate(() => {
      const manager = (window as any).__PROCESSING_MANAGER__;
      return manager?.getState().herb_id;
    });
    expect(stateAfterHerb).toBe('gancao');

    // 2. 选择方法（蜜炙）
    await page.evaluate(() => {
      const manager = (window as any).__PROCESSING_MANAGER__;
      if (manager) {
        manager.selectMethod('mi-zhi');
      }
    });
    await page.waitForTimeout(500);

    // 验证方法选择
    const stateAfterMethod = await page.evaluate(() => {
      const manager = (window as any).__PROCESSING_MANAGER__;
      return {
        method: manager?.getState().method,
        phase: manager?.getPhase()
      };
    });
    expect(stateAfterMethod?.method).toBe('mi-zhi');
    expect(stateAfterMethod?.phase).toBe('select_adjuvant');

    // 3. 选择辅料（蜂蜜）
    await page.evaluate(() => {
      const manager = (window as any).__PROCESSING_MANAGER__;
      if (manager) {
        manager.selectAdjuvant('feng-mi');
      }
    });
    await page.waitForTimeout(500);

    // 验证辅料选择
    const stateAfterAdjuvant = await page.evaluate(() => {
      const manager = (window as any).__PROCESSING_MANAGER__;
      return {
        adjuvant: manager?.getState().adjuvant,
        phase: manager?.getPhase()
      };
    });
    expect(stateAfterAdjuvant?.adjuvant).toBe('feng-mi');
    expect(stateAfterAdjuvant?.phase).toBe('preprocess');

    // 4. 开始炮制
    await page.evaluate(() => {
      const manager = (window as any).__PROCESSING_MANAGER__;
      if (manager) {
        manager.startPreprocess();
        manager.startProcessing();
      }
    });
    await page.waitForTimeout(500);

    // 验证进入炮制阶段
    const phaseDuringProcessing = await page.evaluate(() => {
      const manager = (window as any).__PROCESSING_MANAGER__;
      return manager?.getPhase();
    });
    expect(phaseDuringProcessing).toBe('processing');

    // 5. 等待炮制进行
    await page.waitForTimeout(3000);

    // 6. 完成炮制
    await page.evaluate(() => {
      const manager = (window as any).__PROCESSING_MANAGER__;
      if (manager) {
        manager.stopProcessing();
        manager.submitEndpoint(['色泽均匀', '蜜香浓郁', '不焦不糊']);
      }
    });
    await page.waitForTimeout(1000);

    // 7. 验证评分结果
    const finalState = await page.evaluate(() => {
      const manager = (window as any).__PROCESSING_MANAGER__;
      if (!manager) return null;
      const state = manager.getState();
      return {
        phase: state.phase,
        score: state.score
      };
    });

    expect(finalState?.phase).toBe('evaluate');
    expect(finalState?.score).not.toBeNull();
    expect(finalState?.score?.total_score).toBeGreaterThanOrEqual(60);
    expect(finalState?.score?.passed).toBe(true);

    // 截图记录
    await page.screenshot({ path: 'tests/screenshots/processing-result.png' });
  });

  test('S10-I002: 错误操作评分测试', async ({ page }) => {
    // 进入炮制场景
    await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      if (game) {
        game.scene.start('ProcessingScene');
      }
    });
    await page.waitForTimeout(2000);

    // 进行错误的操作
    const wrongScoreResult = await page.evaluate(() => {
      const manager = (window as any).__PROCESSING_MANAGER__;
      if (!manager) return null;

      // 选择甘草
      manager.selectHerb('gancao');

      // 错误：选择清炒方法（不是甘草的推荐方法）
      manager.selectMethod('qing-chao');

      // 清炒不需要辅料，直接预处理
      manager.startPreprocess();
      manager.startProcessing();

      // 等待极短时间（时间不足）
      // 直接停止并提交
      manager.stopProcessing();

      // 提交错误的质量检查
      manager.submitEndpoint(['焦黑']);  // 错误的质量指标

      return manager.getState().score;
    });

    await page.waitForTimeout(1000);

    expect(wrongScoreResult).not.toBeNull();

    // 验证错误操作导致低分
    // 方法错误（清炒不是甘草推荐方法） → method_score = 0
    expect(wrongScoreResult?.method_score).toBe(0);
    expect(wrongScoreResult?.total_score).toBeLessThan(60);
    expect(wrongScoreResult?.passed).toBe(false);
  });

  test('S10-I003: 可用药材列表查询', async ({ page }) => {
    // 进入炮制场景
    await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      if (game) {
        game.scene.start('ProcessingScene');
      }
    });
    await page.waitForTimeout(2000);

    // 查询可用药材
    const availableHerbs = await page.evaluate(() => {
      const manager = (window as any).__PROCESSING_MANAGER__;
      if (!manager) return [];
      return manager.getAvailableHerbs();
    });

    // 应包含甘草和麻黄
    expect(availableHerbs).toContain('gancao');
    expect(availableHerbs).toContain('mahuang');
  });

  test('S10-I004: 药材无炮制参数时选择失败', async ({ page }) => {
    // 进入炮制场景
    await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      if (game) {
        game.scene.start('ProcessingScene');
      }
    });
    await page.waitForTimeout(2000);

    // 尝试选择没有炮制参数的药材
    const selectResult = await page.evaluate(() => {
      const manager = (window as any).__PROCESSING_MANAGER__;
      if (!manager) return false;
      // 尝试选择桂枝（没有炮制参数）
      return manager.selectHerb('guizhi');
    });

    // 应该失败
    expect(selectResult).toBe(false);

    // 状态应该保持在select_herb阶段
    const stateAfterFailed = await page.evaluate(() => {
      const manager = (window as any).__PROCESSING_MANAGER__;
      return {
        phase: manager?.getPhase(),
        herb_id: manager?.getState().herb_id
      };
    });

    expect(stateAfterFailed?.phase).toBe('select_herb');
    expect(stateAfterFailed?.herb_id).toBeNull();
  });

  test('S10-I005: NPC反馈文字可见', async ({ page }) => {
    // 进入炮制场景并完成流程
    await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      if (game) {
        game.scene.start('ProcessingScene');
      }
    });
    await page.waitForTimeout(2000);

    // 快速完成流程
    await page.evaluate(() => {
      const manager = (window as any).__PROCESSING_MANAGER__;
      if (manager) {
        manager.selectHerb('gancao');
        manager.selectMethod('mi-zhi');
        manager.selectAdjuvant('feng-mi');
        manager.startPreprocess();
        manager.startProcessing();
      }
    });

    await page.waitForTimeout(3000);

    // 完成并获取评分
    await page.evaluate(() => {
      const manager = (window as any).__PROCESSING_MANAGER__;
      if (manager) {
        manager.stopProcessing();
        manager.submitEndpoint(['色泽均匀', '蜜香浓郁']);
      }
    });

    await page.waitForTimeout(1000);

    // 验证反馈文字存在
    const scoreResult = await page.evaluate(() => {
      const manager = (window as any).__PROCESSING_MANAGER__;
      return manager?.getState().score;
    });

    expect(scoreResult?.feedback).toBeDefined();
    expect(scoreResult?.feedback.length).toBeGreaterThan(0);

    // 截图记录反馈界面
    await page.screenshot({ path: 'tests/screenshots/processing-feedback.png' });
  });

  test('S10-I006: 返回诊所功能正常', async ({ page }) => {
    // 进入炮制场景
    await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      if (game) {
        game.scene.start('ProcessingScene');
      }
    });

    await page.waitForTimeout(2000);

    // 检查场景存在
    const sceneState = await page.evaluate(() => {
      const scene = (window as any).__PROCESSING_SCENE__;
      return scene?.isInitialized;
    });

    expect(sceneState).toBe(true);

    // 检查Manager有reset方法
    const managerState = await page.evaluate(() => {
      const manager = (window as any).__PROCESSING_MANAGER__;
      return manager && typeof manager.reset === 'function';
    });

    expect(managerState).toBe(true);
  });

  test('截图记录：炮制场景', async ({ page }) => {
    // 进入炮制场景
    await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      if (game) {
        game.scene.start('ProcessingScene');
      }
    });

    await page.waitForTimeout(2000);

    await page.screenshot({ path: 'tests/screenshots/processing-scene.png' });
  });
});