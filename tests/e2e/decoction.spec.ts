// tests/e2e/decoction.spec.ts
/**
 * 煎药系统 E2E 测试
 * Phase 2 S9.5 验收测试
 *
 * 测试覆盖:
 * - S9-S001~S004: Smoke测试（场景加载、方剂列表显示、UI显示、全局状态暴露）
 * - S9-F001~F007: 功能测试（方剂选择、药材添加、配伍放置、顺序设置、火候设置、煎药进度、结果评分）
 * - S9-L001~L003: 逻辑测试（状态流转、评分计算、药材消耗）
 */

import { test, expect } from '@playwright/test';

// ============================================
// S9 Smoke 测试
// ============================================
test.describe('Decoction System Smoke Tests (S9-S001~S004)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(3000);
  });

  test('S9-S001: 煎药场景正常加载渲染', async ({ page }) => {
    // 进入煎药场景
    await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      if (game) {
        game.scene.start('DecoctionScene');
      }
    });

    await page.waitForTimeout(2000);

    // 检查煎药场景是否初始化
    const decoctionSceneState = await page.evaluate(() => {
      const decoctionScene = (window as any).__DECOCTION_SCENE__;
      return decoctionScene ? {
        isInitialized: decoctionScene.isInitialized,
        phase: decoctionScene.phase,
        prescriptionId: decoctionScene.prescriptionId
      } : null;
    });

    expect(decoctionSceneState).not.toBeNull();
    expect(decoctionSceneState?.isInitialized).toBe(true);
    expect(decoctionSceneState?.phase).toBe('select_prescription');
  });

  test('S9-S002: 方剂列表UI显示', async ({ page }) => {
    // 进入煎药场景
    await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      if (game) {
        game.scene.start('DecoctionScene');
      }
    });

    await page.waitForTimeout(2000);

    // 检查DecoctionManager是否暴露
    const managerAvailable = await page.evaluate(() => {
      return (window as any).__DECOCTION_MANAGER__ !== undefined;
    });

    expect(managerAvailable).toBe(true);
  });

  test('S9-S003: DecoctionManager全局暴露', async ({ page }) => {
    // 进入煎药场景
    await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      if (game) {
        game.scene.start('DecoctionScene');
      }
    });

    await page.waitForTimeout(2000);

    // 检查DecoctionManager实例
    const managerState = await page.evaluate(() => {
      const manager = (window as any).__DECOCTION_MANAGER__;
      if (!manager) return null;

      const state = manager.getState();
      return {
        phase: state.phase,
        prescription_id: state.prescription_id,
        selected_herbs: state.selected_herbs,
        fire_level: state.fire_level,
        target_time: state.target_time
      };
    });

    expect(managerState).not.toBeNull();
    expect(managerState?.phase).toBe('select_prescription');
    expect(managerState?.prescription_id).toBeNull();
  });

  test('S9-S004: 煎药场景已注册到Phaser', async ({ page }) => {
    // 检查场景是否注册
    const sceneRegistered = await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      if (!game) return false;
      const sceneManager = game.scene;
      return sceneManager.keys && sceneManager.keys['DecoctionScene'] !== undefined;
    });

    expect(sceneRegistered).toBe(true);
  });
});

// ============================================
// S9 Functional 测试
// ============================================
test.describe('Decoction System Functional Tests (S9-F001~F007)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(3000);

    // 给InventoryManager添加药材（测试用）
    await page.evaluate(() => {
      const inventory = (window as any).__INVENTORY_MANAGER__;
      if (inventory) {
        // 添加麻黄汤所需的药材
        inventory.addHerb('mahuang', 10);
        inventory.addHerb('guizhi', 10);
        inventory.addHerb('xingren', 10);
        inventory.addHerb('gancao', 10);
        // 添加桂枝汤所需的药材
        inventory.addHerb('shaoyao', 10);
        inventory.addHerb('shengjiang', 10);
        inventory.addHerb('dazao', 10);
        // 添加银翘散所需的药材
        inventory.addHerb('jinyinhua', 10);
        inventory.addHerb('lianqiao', 10);
        inventory.addHerb('bohe', 10);
        inventory.addHerb('jingjie', 10);
      }
    });

    // 进入煎药场景
    await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      if (game) {
        game.scene.start('DecoctionScene');
      }
    });
    await page.waitForTimeout(2000);
  });

  test('S9-F001: 方剂选择功能', async ({ page }) => {
    // 选择方剂
    const selectResult = await page.evaluate(() => {
      const manager = (window as any).__DECOCTION_MANAGER__;
      if (!manager) return false;
      return manager.selectPrescription('mahuang-tang');
    });

    expect(selectResult).toBe(true);

    // 检查状态更新
    const stateAfterSelect = await page.evaluate(() => {
      const manager = (window as any).__DECOCTION_MANAGER__;
      if (!manager) return null;
      const state = manager.getState();
      return {
        prescription_id: state.prescription_id,
        phase: state.phase,
        target_time: state.target_time
      };
    });

    expect(stateAfterSelect?.prescription_id).toBe('mahuang-tang');
    expect(stateAfterSelect?.phase).toBe('select_herbs');
    expect(stateAfterSelect?.target_time).toBe(600); // 麻黄汤总煎煮时间
  });

  test('S9-F002: 药材添加和移除功能', async ({ page }) => {
    // 先选择方剂
    await page.evaluate(() => {
      const manager = (window as any).__DECOCTION_MANAGER__;
      if (manager) {
        manager.selectPrescription('mahuang-tang');
      }
    });

    await page.waitForTimeout(500);

    // 添加药材
    const addResult = await page.evaluate(() => {
      const manager = (window as any).__DECOCTION_MANAGER__;
      if (!manager) return false;
      return manager.addHerb('mahuang');
    });

    expect(addResult).toBe(true);

    // 检查药材是否已添加
    const stateAfterAdd = await page.evaluate(() => {
      const manager = (window as any).__DECOCTION_MANAGER__;
      if (!manager) return null;
      return manager.getState().selected_herbs;
    });

    expect(stateAfterAdd).toContain('mahuang');

    // 移除药材
    const removeResult = await page.evaluate(() => {
      const manager = (window as any).__DECOCTION_MANAGER__;
      if (!manager) return false;
      return manager.removeHerb('mahuang');
    });

    expect(removeResult).toBe(true);

    // 检查药材是否已移除
    const stateAfterRemove = await page.evaluate(() => {
      const manager = (window as any).__DECOCTION_MANAGER__;
      if (!manager) return null;
      return manager.getState().selected_herbs;
    });

    expect(stateAfterRemove).not.toContain('mahuang');
  });

  test('S9-F003: 配伍放置功能', async ({ page }) => {
    // 选择方剂并添加药材
    await page.evaluate(() => {
      const manager = (window as any).__DECOCTION_MANAGER__;
      if (manager) {
        manager.selectPrescription('mahuang-tang');
        manager.addHerb('mahuang');
        manager.proceedToNextPhase(); // 进入配伍放置阶段
      }
    });

    await page.waitForTimeout(500);

    // 检查是否进入配伍放置阶段
    const phaseBeforePlace = await page.evaluate(() => {
      const manager = (window as any).__DECOCTION_MANAGER__;
      return manager?.getPhase();
    });

    expect(phaseBeforePlace).toBe('place_compatibility');

    // 放置药材角色
    const placeResult = await page.evaluate(() => {
      const manager = (window as any).__DECOCTION_MANAGER__;
      if (!manager) return false;
      return manager.placeRole('mahuang', '君');
    });

    expect(placeResult).toBe(true);

    // 检查角色放置
    const stateAfterPlace = await page.evaluate(() => {
      const manager = (window as any).__DECOCTION_MANAGER__;
      if (!manager) return null;
      const state = manager.getState();
      return state.compatibility_placement.get('mahuang');
    });

    expect(stateAfterPlace).toBe('君');
  });

  test('S9-F004: 顺序设置功能', async ({ page }) => {
    // 选择方剂、添加药材、放置角色
    await page.evaluate(() => {
      const manager = (window as any).__DECOCTION_MANAGER__;
      if (manager) {
        manager.selectPrescription('mahuang-tang');
        manager.addHerb('mahuang');
        manager.proceedToNextPhase();
        manager.placeRole('mahuang', '君');
        manager.proceedToNextPhase(); // 进入顺序设置阶段
      }
    });

    await page.waitForTimeout(500);

    // 检查是否进入顺序设置阶段
    const phaseBeforeOrder = await page.evaluate(() => {
      const manager = (window as any).__DECOCTION_MANAGER__;
      return manager?.getPhase();
    });

    expect(phaseBeforeOrder).toBe('set_order');

    // 设置顺序（麻黄应先煎）
    const orderResult = await page.evaluate(() => {
      const manager = (window as any).__DECOCTION_MANAGER__;
      if (!manager) return false;
      return manager.setOrder('mahuang', 'first');
    });

    expect(orderResult).toBe(true);

    // 检查顺序设置
    const stateAfterOrder = await page.evaluate(() => {
      const manager = (window as any).__DECOCTION_MANAGER__;
      if (!manager) return null;
      const state = manager.getState();
      return state.order_settings.get('mahuang');
    });

    expect(stateAfterOrder).toBe('first');
  });

  test('S9-F005: 火候设置功能', async ({ page }) => {
    // 快速到达火候设置阶段
    await page.evaluate(() => {
      const manager = (window as any).__DECOCTION_MANAGER__;
      if (manager) {
        manager.selectPrescription('mahuang-tang');
        manager.addHerb('mahuang');
        manager.addHerb('guizhi');
        manager.addHerb('xingren');
        manager.addHerb('gancao');
        manager.proceedToNextPhase();
        manager.placeRole('mahuang', '君');
        manager.placeRole('guizhi', '臣');
        manager.placeRole('xingren', '佐');
        manager.placeRole('gancao', '使');
        manager.proceedToNextPhase();
        manager.setOrder('mahuang', 'first');
        manager.setOrder('guizhi', 'normal');
        manager.setOrder('xingren', 'normal');
        manager.setOrder('gancao', 'normal');
        manager.proceedToNextPhase(); // 进入火候设置阶段
      }
    });

    await page.waitForTimeout(500);

    // 检查是否进入火候设置阶段
    const phaseBeforeFire = await page.evaluate(() => {
      const manager = (window as any).__DECOCTION_MANAGER__;
      return manager?.getPhase();
    });

    expect(phaseBeforeFire).toBe('set_fire');

    // 设置火候（麻黄汤用武火）
    const fireResult = await page.evaluate(() => {
      const manager = (window as any).__DECOCTION_MANAGER__;
      if (!manager) return false;
      return manager.setFireLevel('wu');
    });

    expect(fireResult).toBe(true);

    // 检查火候设置
    const stateAfterFire = await page.evaluate(() => {
      const manager = (window as any).__DECOCTION_MANAGER__;
      if (!manager) return null;
      return manager.getState().fire_level;
    });

    expect(stateAfterFire).toBe('wu');
  });

  test('S9-F006: 煎药进度控制', async ({ page }) => {
    // 快速到达煎煮阶段
    await page.evaluate(() => {
      const manager = (window as any).__DECOCTION_MANAGER__;
      if (manager) {
        manager.selectPrescription('mahuang-tang');
        manager.addHerb('mahuang');
        manager.addHerb('guizhi');
        manager.addHerb('xingren');
        manager.addHerb('gancao');
        manager.proceedToNextPhase();
        manager.placeRole('mahuang', '君');
        manager.placeRole('guizhi', '臣');
        manager.placeRole('xingren', '佐');
        manager.placeRole('gancao', '使');
        manager.proceedToNextPhase();
        manager.setOrder('mahuang', 'first');
        manager.setOrder('guizhi', 'normal');
        manager.setOrder('xingren', 'normal');
        manager.setOrder('gancao', 'normal');
        manager.proceedToNextPhase();
        manager.setFireLevel('wu');
        manager.startDecoction(); // 开始煎煮
      }
    });

    await page.waitForTimeout(500);

    // 检查是否进入煎煮阶段
    const phaseDuringDecoction = await page.evaluate(() => {
      const manager = (window as any).__DECOCTION_MANAGER__;
      return manager?.getPhase();
    });

    expect(phaseDuringDecoction).toBe('decocting');

    // 等待1秒后检查时间计数
    await page.waitForTimeout(1500);

    const stateAfterTick = await page.evaluate(() => {
      const manager = (window as any).__DECOCTION_MANAGER__;
      if (!manager) return null;
      const state = manager.getState();
      return {
        decoction_time: state.decoction_time,
        target_time: state.target_time
      };
    });

    expect(stateAfterTick?.decoction_time).toBeGreaterThan(0);
  });

  test('S9-F007: 结果评分功能', async ({ page }) => {
    // 快速完成煎药流程
    await page.evaluate(() => {
      const manager = (window as any).__DECOCTION_MANAGER__;
      if (manager) {
        manager.selectPrescription('mahuang-tang');
        manager.addHerb('mahuang');
        manager.addHerb('guizhi');
        manager.addHerb('xingren');
        manager.addHerb('gancao');
        manager.proceedToNextPhase();
        manager.placeRole('mahuang', '君');
        manager.placeRole('guizhi', '臣');
        manager.placeRole('xingren', '佐');
        manager.placeRole('gancao', '使');
        manager.proceedToNextPhase();
        manager.setOrder('mahuang', 'first');
        manager.setOrder('guizhi', 'normal');
        manager.setOrder('xingren', 'normal');
        manager.setOrder('gancao', 'normal');
        manager.proceedToNextPhase();
        manager.setFireLevel('wu');
        manager.startDecoction();
      }
    });

    // 等待煎煮进行一段时间
    await page.waitForTimeout(3000);

    // 完成煎药
    await page.evaluate(() => {
      const manager = (window as any).__DECOCTION_MANAGER__;
      if (manager) {
        manager.completeDecoction();
      }
    });

    await page.waitForTimeout(1000);

    // 检查评分结果
    const scoreResult = await page.evaluate(() => {
      const manager = (window as any).__DECOCTION_MANAGER__;
      if (!manager) return null;
      const state = manager.getState();
      return state.score;
    });

    expect(scoreResult).not.toBeNull();
    expect(scoreResult?.total_score).toBeDefined();
    expect(scoreResult?.passed).toBeDefined();
    expect(scoreResult?.dimension_scores).toBeDefined();
  });
});

// ============================================
// S9 Logic 测试
// ============================================
test.describe('Decoction System Logic Tests (S9-L001~L003)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(3000);

    // 给InventoryManager添加药材（测试用）
    await page.evaluate(() => {
      const inventory = (window as any).__INVENTORY_MANAGER__;
      if (inventory) {
        inventory.addHerb('mahuang', 10);
        inventory.addHerb('guizhi', 10);
        inventory.addHerb('xingren', 10);
        inventory.addHerb('gancao', 10);
        inventory.addHerb('shaoyao', 10);
        inventory.addHerb('shengjiang', 10);
        inventory.addHerb('dazao', 10);
      }
    });
  });

  test('S9-L001: 阶段流转逻辑正确', async ({ page }) => {
    // 进入煎药场景
    await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      if (game) {
        game.scene.start('DecoctionScene');
      }
    });
    await page.waitForTimeout(2000);

    // 验证阶段顺序
    const phaseSequence = await page.evaluate(() => {
      const manager = (window as any).__DECOCTION_MANAGER__;
      if (!manager) return null;

      const phases: string[] = [];

      // 初始阶段
      phases.push(manager.getPhase());

      // 选择方剂后
      manager.selectPrescription('mahuang-tang');
      phases.push(manager.getPhase());

      // 添加药材后
      manager.addHerb('mahuang');
      manager.proceedToNextPhase();
      phases.push(manager.getPhase());

      // 配伍放置后
      manager.placeRole('mahuang', '君');
      manager.proceedToNextPhase();
      phases.push(manager.getPhase());

      return phases;
    });

    expect(phaseSequence).toEqual([
      'select_prescription',
      'select_herbs',
      'place_compatibility',
      'set_order'
    ]);
  });

  test('S9-L002: 评分计算逻辑正确', async ({ page }) => {
    // 进入煎药场景
    await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      if (game) {
        game.scene.start('DecoctionScene');
      }
    });
    await page.waitForTimeout(2000);

    // 完成煎药流程（正确操作）
    const scoreResult = await page.evaluate(() => {
      const manager = (window as any).__DECOCTION_MANAGER__;
      if (!manager) return null;

      // 选择麻黄汤
      manager.selectPrescription('mahuang-tang');

      // 添加所有药材
      manager.addHerb('mahuang');
      manager.addHerb('guizhi');
      manager.addHerb('xingren');
      manager.addHerb('gancao');
      manager.proceedToNextPhase();

      // Phase 2.5 简化版：配伍和顺序阶段仍可调用，但不参与评分
      manager.placeRole('mahuang', '君');
      manager.placeRole('guizhi', '臣');
      manager.placeRole('xingren', '佐');
      manager.placeRole('gancao', '使');
      manager.proceedToNextPhase();

      manager.setOrder('mahuang', 'first');
      manager.setOrder('guizhi', 'normal');
      manager.setOrder('xingren', 'normal');
      manager.setOrder('gancao', 'normal');
      manager.proceedToNextPhase();

      // 正确设置火候
      manager.setFireLevel('wu');

      // 直接模拟完成（不实际等待时间）
      manager.startDecoction();
      // 模拟达到目标时间
      manager.completeDecoction();

      return manager.getState().score;
    });

    expect(scoreResult).not.toBeNull();

    // Phase 2.5 简化版评分权重：组成50%、火候30%、时间20%
    const expectedMaxScore = 100;
    expect(scoreResult?.total_score).toBeLessThanOrEqual(expectedMaxScore);

    // 验证简化版维度分数结构（只有 composition、fire、time）
    expect(scoreResult?.dimension_scores?.composition).toBeDefined();
    expect(scoreResult?.dimension_scores?.fire).toBeDefined();
    expect(scoreResult?.dimension_scores?.time).toBeDefined();

    // 验证不再存在的维度（Phase 2.5 已废弃）
    expect(scoreResult?.dimension_scores?.compatibility).toBeUndefined();
    expect(scoreResult?.dimension_scores?.order).toBeUndefined();
  });

  test('S9-L003: 重置功能正确', async ({ page }) => {
    // 进入煎药场景
    await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      if (game) {
        game.scene.start('DecoctionScene');
      }
    });
    await page.waitForTimeout(2000);

    // 完成部分流程
    await page.evaluate(() => {
      const manager = (window as any).__DECOCTION_MANAGER__;
      if (manager) {
        manager.selectPrescription('mahuang-tang');
        manager.addHerb('mahuang');
      }
    });

    await page.waitForTimeout(500);

    // 执行重置
    await page.evaluate(() => {
      const manager = (window as any).__DECOCTION_MANAGER__;
      if (manager) {
        manager.reset();
      }
    });

    await page.waitForTimeout(500);

    // 检查重置后状态
    const stateAfterReset = await page.evaluate(() => {
      const manager = (window as any).__DECOCTION_MANAGER__;
      if (!manager) return null;
      const state = manager.getState();
      return {
        phase: state.phase,
        prescription_id: state.prescription_id,
        selected_herbs: state.selected_herbs,
        fire_level: state.fire_level,
        decoction_time: state.decoction_time
      };
    });

    expect(stateAfterReset?.phase).toBe('select_prescription');
    expect(stateAfterReset?.prescription_id).toBeNull();
    expect(stateAfterReset?.selected_herbs).toEqual([]);
    expect(stateAfterReset?.fire_level).toBe('wen');
    expect(stateAfterReset?.decoction_time).toBe(0);
  });
});

// ============================================
// S9 Integration 测试
// ============================================
test.describe('Decoction System Integration Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(3000);

    // 给InventoryManager添加药材（测试用）
    await page.evaluate(() => {
      const inventory = (window as any).__INVENTORY_MANAGER__;
      if (inventory) {
        inventory.addHerb('mahuang', 10);
        inventory.addHerb('guizhi', 10);
        inventory.addHerb('xingren', 10);
        inventory.addHerb('gancao', 10);
        inventory.addHerb('shaoyao', 10);
        inventory.addHerb('shengjiang', 10);
        inventory.addHerb('dazao', 10);
        inventory.addHerb('jinyinhua', 10);
        inventory.addHerb('lianqiao', 10);
        inventory.addHerb('bohe', 10);
        inventory.addHerb('jingjie', 10);
      }
    });
  });

  test('完整煎药流程：方剂选择到评分', async ({ page }) => {
    // 进入煎药场景
    await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      if (game) {
        game.scene.start('DecoctionScene');
      }
    });
    await page.waitForTimeout(2000);

    // 1. 选择方剂
    await page.evaluate(() => {
      const manager = (window as any).__DECOCTION_MANAGER__;
      if (manager) {
        manager.selectPrescription('mahuang-tang');
      }
    });
    await page.waitForTimeout(500);

    // 2. 添加药材
    await page.evaluate(() => {
      const manager = (window as any).__DECOCTION_MANAGER__;
      if (manager) {
        manager.addHerb('mahuang');
        manager.addHerb('guizhi');
        manager.addHerb('xingren');
        manager.addHerb('gancao');
        manager.proceedToNextPhase();
      }
    });
    await page.waitForTimeout(500);

    // 3. 配伍放置
    await page.evaluate(() => {
      const manager = (window as any).__DECOCTION_MANAGER__;
      if (manager) {
        manager.placeRole('mahuang', '君');
        manager.placeRole('guizhi', '臣');
        manager.placeRole('xingren', '佐');
        manager.placeRole('gancao', '使');
        manager.proceedToNextPhase();
      }
    });
    await page.waitForTimeout(500);

    // 4. 顺序设置
    await page.evaluate(() => {
      const manager = (window as any).__DECOCTION_MANAGER__;
      if (manager) {
        manager.setOrder('mahuang', 'first');
        manager.setOrder('guizhi', 'normal');
        manager.setOrder('xingren', 'normal');
        manager.setOrder('gancao', 'normal');
        manager.proceedToNextPhase();
      }
    });
    await page.waitForTimeout(500);

    // 5. 火候设置
    await page.evaluate(() => {
      const manager = (window as any).__DECOCTION_MANAGER__;
      if (manager) {
        manager.setFireLevel('wu');
      }
    });
    await page.waitForTimeout(500);

    // 6. 开始煎药
    await page.evaluate(() => {
      const manager = (window as any).__DECOCTION_MANAGER__;
      if (manager) {
        manager.startDecoction();
      }
    });
    await page.waitForTimeout(3000);

    // 7. 完成煎药
    await page.evaluate(() => {
      const manager = (window as any).__DECOCTION_MANAGER__;
      if (manager) {
        manager.completeDecoction();
      }
    });
    await page.waitForTimeout(1000);

    // 验证评分结果
    const finalState = await page.evaluate(() => {
      const manager = (window as any).__DECOCTION_MANAGER__;
      if (!manager) return null;
      const state = manager.getState();
      return {
        phase: state.phase,
        score: state.score
      };
    });

    expect(finalState?.phase).toBe('evaluate');
    expect(finalState?.score).not.toBeNull();
    expect(finalState?.score?.total_score).toBeDefined();

    // 截图记录
    await page.screenshot({ path: 'tests/screenshots/decoction-result.png' });
  });

  test('错误操作评分扣分测试', async ({ page }) => {
    // 进入煎药场景
    await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      if (game) {
        game.scene.start('DecoctionScene');
      }
    });
    await page.waitForTimeout(2000);

    // 进行错误的操作
    const wrongScoreResult = await page.evaluate(() => {
      const manager = (window as any).__DECOCTION_MANAGER__;
      if (!manager) return null;

      // 选择麻黄汤
      manager.selectPrescription('mahuang-tang');

      // 错误：只添加部分药材
      manager.addHerb('mahuang');
      manager.proceedToNextPhase();

      // 错误：角色放置不正确
      manager.placeRole('mahuang', '使'); // 应该是君
      manager.proceedToNextPhase();

      // 错误：顺序不正确
      manager.setOrder('mahuang', 'last'); // 应该是先煎
      manager.proceedToNextPhase();

      // 错误：火候不正确
      manager.setFireLevel('wen'); // 应该是武火

      manager.startDecoction();
      manager.completeDecoction();

      return manager.getState().score;
    });

    expect(wrongScoreResult).not.toBeNull();
    // 错误操作应该导致低分
    expect(wrongScoreResult?.total_score).toBeLessThan(60);

    // 验证错误详情存在
    expect(wrongScoreResult?.herb_errors).toBeDefined();
    expect(wrongScoreResult?.herb_errors?.length).toBeGreaterThan(0);
  });

  test('不同方剂煎药参数不同', async ({ page }) => {
    // 进入煎药场景
    await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      if (game) {
        game.scene.start('DecoctionScene');
      }
    });
    await page.waitForTimeout(2000);

    // 测试麻黄汤参数
    const mahuangParams = await page.evaluate(() => {
      const manager = (window as any).__DECOCTION_MANAGER__;
      if (!manager) return null;

      manager.selectPrescription('mahuang-tang');
      const state = manager.getState();
      return {
        target_time: state.target_time,
        default_fire: state.fire_level
      };
    });

    expect(mahuangParams?.target_time).toBe(600);
    expect(mahuangParams?.default_fire).toBe('wu');

    // 重置
    await page.evaluate(() => {
      const manager = (window as any).__DECOCTION_MANAGER__;
      if (manager) {
        manager.reset();
      }
    });

    await page.waitForTimeout(500);

    // 测试桂枝汤参数
    const guizhiParams = await page.evaluate(() => {
      const manager = (window as any).__DECOCTION_MANAGER__;
      if (!manager) return null;

      manager.selectPrescription('guizhi-tang');
      const state = manager.getState();
      return {
        target_time: state.target_time,
        default_fire: state.fire_level
      };
    });

    expect(guizhiParams?.target_time).toBe(450);
    expect(guizhiParams?.default_fire).toBe('wen');
  });

  test('canProceedToNextPhase检查逻辑', async ({ page }) => {
    // 给InventoryManager添加药材
    await page.evaluate(() => {
      const inventory = (window as any).__INVENTORY_MANAGER__;
      if (inventory) {
        inventory.addHerb('mahuang', 10);
      }
    });

    // 进入煎药场景
    await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      if (game) {
        game.scene.start('DecoctionScene');
      }
    });
    await page.waitForTimeout(2000);

    // 测试药材选择阶段的检查
    await page.evaluate(() => {
      const manager = (window as any).__DECOCTION_MANAGER__;
      if (manager) {
        // selectPrescription已自动进入select_herbs阶段
        manager.selectPrescription('mahuang-tang');
      }
    });

    await page.waitForTimeout(500);

    // 确认阶段是select_herbs
    const phase = await page.evaluate(() => {
      const manager = (window as any).__DECOCTION_MANAGER__;
      return manager?.getPhase();
    });
    expect(phase).toBe('select_herbs');

    // 没有添加药材时不能进入下一阶段
    const canProceedEmpty = await page.evaluate(() => {
      const manager = (window as any).__DECOCTION_MANAGER__;
      return manager?.canProceedToNextPhase();
    });
    expect(canProceedEmpty).toBe(false);

    // 添加药材后可以进入下一阶段
    const addResult = await page.evaluate(() => {
      const manager = (window as any).__DECOCTION_MANAGER__;
      if (manager) {
        return manager.addHerb('mahuang');
      }
      return false;
    });
    expect(addResult).toBe(true);

    const canProceedAfterAdd = await page.evaluate(() => {
      const manager = (window as any).__DECOCTION_MANAGER__;
      return manager?.canProceedToNextPhase();
    });
    expect(canProceedAfterAdd).toBe(true);
  });

  test('截图记录：煎药场景', async ({ page }) => {
    // 进入煎药场景
    await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      if (game) {
        game.scene.start('DecoctionScene');
      }
    });

    await page.waitForTimeout(2000);

    await page.screenshot({ path: 'tests/screenshots/decoction-scene.png' });
  });
});