// tests/e2e/tutorial.spec.ts
/**
 * 新手引导系统E2E测试
 * Phase 2 S13.5 验收测试
 *
 * 验收标准:
 * - 引导流程可完成
 * - 跳过按钮有效
 * - 约5个E2E测试通过
 */

import { test, expect } from '@playwright/test';
import { waitForGameReady } from './utils/phaser-helper';

test.describe('S13.5: 新手引导系统E2E测试', () => {
  test.beforeEach(async ({ page }) => {
    // 启动游戏
    await page.goto('/');

    // 等待游戏加载完成
    await waitForGameReady(page, 30000);
  });

  test.describe('TutorialManager 初始化', () => {
    test('TutorialManager应该正确初始化并暴露到全局', async ({ page }) => {
      // 检查TutorialManager是否暴露到全局
      const hasManager = await page.evaluate(() => {
        return typeof (window as any).__TUTORIAL_MANAGER__ !== 'undefined';
      });

      expect(hasManager).toBe(true);

      // 获取TutorialManager状态
      const state = await page.evaluate(() => {
        const manager = (window as any).__TUTORIAL_MANAGER__;
        if (manager && typeof manager.getState === 'function') {
          return manager.getState();
        }
        return null;
      });

      if (state) {
        expect(state).toHaveProperty('phase');
        expect(state).toHaveProperty('current_step');
        expect(state).toHaveProperty('completed_steps');
        expect(state).toHaveProperty('seen_scene_tips');
        expect(state).toHaveProperty('skipped');
        expect(state.phase).toBe('central');
        expect(state.current_step).toBe('move');
      }
    });
  });

  test.describe('引导流程完成', () => {
    test('引导步骤可以顺序完成', async ({ page }) => {
      // 确保TutorialManager存在
      const managerExists = await page.evaluate(() => {
        return typeof (window as any).__TUTORIAL_MANAGER__ !== 'undefined';
      });
      expect(managerExists).toBe(true);

      // 模拟完成所有引导步骤
      const result = await page.evaluate(() => {
        const manager = (window as any).__TUTORIAL_MANAGER__;
        if (!manager) return null;

        // 完成第一个步骤 (move)
        manager.completeCurrentStep();
        const state1 = manager.getState();

        // 完成第二个步骤 (interact)
        manager.completeCurrentStep();
        const state2 = manager.getState();

        // 完成第三个步骤 (bag)
        manager.completeCurrentStep();
        const state3 = manager.getState();

        return {
          afterStep1: state1,
          afterStep2: state2,
          afterStep3: state3,
          isComplete: manager.isComplete()
        };
      });

      if (result) {
        // 检查步骤1完成后的状态
        expect(result.afterStep1.completed_steps).toContain('move');
        expect(result.afterStep1.current_step).toBe('interact');

        // 检查步骤2完成后的状态
        expect(result.afterStep2.completed_steps).toContain('interact');
        expect(result.afterStep2.current_step).toBe('bag');

        // 检查步骤3完成后的状态 - 所有集中引导完成
        expect(result.afterStep3.completed_steps).toContain('bag');
        expect(result.afterStep3.phase).toBe('scene_tips');
        expect(result.afterStep3.current_step).toBe(null);

        // 集中引导完成后，进入场景提示阶段
        // 注意：isComplete()在scene_tips阶段+所有步骤完成时返回true
        // 这是正确行为：集中引导部分已完成，但场景提示还未全部显示
        expect(result.isComplete).toBe(true); // 集中引导部分已完成
      }
    });

    test('完成所有场景提示后引导结束', async ({ page }) => {
      const result = await page.evaluate(() => {
        const manager = (window as any).__TUTORIAL_MANAGER__;
        if (!manager) return null;

        // 先完成集中引导
        manager.completeCurrentStep();
        manager.completeCurrentStep();
        manager.completeCurrentStep();

        // 标记所有场景提示已显示
        const sceneKeys = ['TownOutdoorScene', 'ClinicScene', 'GardenScene', 'HomeScene'];
        sceneKeys.forEach((sceneKey) => {
          manager.markSceneTipShown(sceneKey);
        });

        return {
          state: manager.getState(),
          isComplete: manager.isComplete()
        };
      });

      if (result) {
        expect(result.state.phase).toBe('complete');
        expect(result.state.seen_scene_tips).toContain('TownOutdoorScene');
        expect(result.state.seen_scene_tips).toContain('ClinicScene');
        expect(result.state.seen_scene_tips).toContain('GardenScene');
        expect(result.state.seen_scene_tips).toContain('HomeScene');
        expect(result.isComplete).toBe(true);
      }
    });
  });

  test.describe('跳过引导功能', () => {
    test('跳过按钮应该可以跳过集中引导', async ({ page }) => {
      // 确保TutorialManager存在
      const managerExists = await page.evaluate(() => {
        return typeof (window as any).__TUTORIAL_MANAGER__ !== 'undefined';
      });
      expect(managerExists).toBe(true);

      // 调用skipTutorial方法
      const result = await page.evaluate(() => {
        const manager = (window as any).__TUTORIAL_MANAGER__;
        if (!manager) return null;

        manager.skipTutorial();

        return {
          state: manager.getState(),
          isComplete: manager.isComplete()
        };
      });

      if (result) {
        // 验证跳过后的状态
        expect(result.state.skipped).toBe(true);
        expect(result.state.phase).toBe('scene_tips');
        expect(result.state.current_step).toBe(null);
        expect(result.state.completed_steps).toHaveLength(0);

        // 跳过后，集中引导视为完成，进入场景提示阶段
        // 注意：跳过后isComplete()返回true，因为skipped=true
        expect(result.isComplete).toBe(true); // 跳过视为引导完成
      }
    });

    test('跳过后状态可正确导出导入', async ({ page }) => {
      const result = await page.evaluate(() => {
        const manager = (window as any).__TUTORIAL_MANAGER__;
        if (!manager) return null;

        // 跳过引导
        manager.skipTutorial();

        // 导出状态
        const exportedState = manager.exportState();

        // 重置后导入
        manager.reset();
        manager.importState(exportedState as any);

        return {
          exportedState,
          restoredState: manager.getState()
        };
      });

      if (result) {
        expect(result.exportedState.skipped).toBe(true);
        expect(result.restoredState.skipped).toBe(true);
        expect(result.restoredState.phase).toBe('scene_tips');
      }
    });
  });

  test.describe('场景提示管理', () => {
    test('场景提示应该在首次进入场景时显示', async ({ page }) => {
      // 完成集中引导（进入scene_tips阶段）
      await page.evaluate(() => {
        const manager = (window as any).__TUTORIAL_MANAGER__;
        if (manager) {
          manager.completeCurrentStep();
          manager.completeCurrentStep();
          manager.completeCurrentStep();
        }
      });

      // 检查是否应该显示TownOutdoorScene的场景提示
      const shouldShowTip = await page.evaluate(() => {
        const manager = (window as any).__TUTORIAL_MANAGER__;
        if (!manager) return false;
        return manager.shouldShowSceneTip('TownOutdoorScene');
      });

      // 在scene_tips阶段，且未显示过的场景应该显示提示
      expect(shouldShowTip).toBe(true);

      // 获取场景提示配置
      const tipInfo = await page.evaluate(() => {
        const manager = (window as any).__TUTORIAL_MANAGER__;
        if (!manager) return null;
        return manager.getSceneTipInfo('TownOutdoorScene');
      });

      if (tipInfo) {
        expect(tipInfo.scene_key).toBe('TownOutdoorScene');
        expect(tipInfo.content).toContain('百草镇');
        expect(tipInfo.trigger).toBe('first_enter');
      }
    });

    test('场景提示只显示一次', async ({ page }) => {
      // 完成集中引导
      await page.evaluate(() => {
        const manager = (window as any).__TUTORIAL_MANAGER__;
        if (manager) {
          manager.completeCurrentStep();
          manager.completeCurrentStep();
          manager.completeCurrentStep();
        }
      });

      // 标记TownOutdoorScene提示已显示
      const result = await page.evaluate(() => {
        const manager = (window as any).__TUTORIAL_MANAGER__;
        if (!manager) return null;

        // 第一次应该显示
        const beforeShow = manager.shouldShowSceneTip('TownOutdoorScene');

        // 标记已显示
        manager.markSceneTipShown('TownOutdoorScene');

        // 第二次不应该显示
        const afterShow = manager.shouldShowSceneTip('TownOutdoorScene');

        return {
          beforeShow,
          afterShow,
          state: manager.getState()
        };
      });

      if (result) {
        expect(result.beforeShow).toBe(true);
        expect(result.afterShow).toBe(false);
        expect(result.state.seen_scene_tips).toContain('TownOutdoorScene');
      }
    });
  });

  test.describe('进度追踪', () => {
    test('应该正确计算引导进度', async ({ page }) => {
      const result = await page.evaluate(() => {
        const manager = (window as any).__TUTORIAL_MANAGER__;
        if (!manager) return null;

        // 初始进度
        const initialProgress = manager.getProgressPercentage();
        const initialRemaining = manager.getRemainingStepsCount();

        // 完成一步
        manager.completeCurrentStep();
        const after1Progress = manager.getProgressPercentage();
        const after1Remaining = manager.getRemainingStepsCount();

        // 完成两步
        manager.completeCurrentStep();
        const after2Progress = manager.getProgressPercentage();
        const after2Remaining = manager.getRemainingStepsCount();

        // 完成三步
        manager.completeCurrentStep();
        const after3Progress = manager.getProgressPercentage();
        const after3Remaining = manager.getRemainingStepsCount();

        return {
          initialProgress,
          initialRemaining,
          after1Progress,
          after1Remaining,
          after2Progress,
          after2Remaining,
          after3Progress,
          after3Remaining
        };
      });

      if (result) {
        // 3个步骤，每步约33%
        expect(result.initialProgress).toBeGreaterThanOrEqual(0);
        expect(result.initialRemaining).toBe(3);

        expect(result.after1Progress).toBeGreaterThan(result.initialProgress);
        expect(result.after1Remaining).toBe(2);

        expect(result.after2Progress).toBeGreaterThan(result.after1Progress);
        expect(result.after2Remaining).toBe(1);

        expect(result.after3Progress).toBe(100);
        expect(result.after3Remaining).toBe(0);
      }
    });

    test('应该正确获取当前步骤信息', async ({ page }) => {
      const result = await page.evaluate(() => {
        const manager = (window as any).__TUTORIAL_MANAGER__;
        if (!manager) return null;

        // 获取当前步骤信息 (move)
        const stepInfo = manager.getCurrentStepInfo();

        return {
          stepInfo,
          currentStep: manager.getState().current_step
        };
      });

      if (result) {
        expect(result.currentStep).toBe('move');
        expect(result.stepInfo).toBeDefined();
        expect(result.stepInfo?.id).toBe('move');
        expect(result.stepInfo?.title).toBe('移动控制');
        expect(result.stepInfo?.key_hint).toBe('方向键 / WASD');
      }
    });
  });

  test.describe('存档集成', () => {
    test('引导状态应该可以正确导出导入', async ({ page }) => {
      const result = await page.evaluate(() => {
        const manager = (window as any).__TUTORIAL_MANAGER__;
        if (!manager) return null;

        // 完成两步
        manager.completeCurrentStep();
        manager.completeCurrentStep();

        // 导出状态
        const exported = manager.exportState();

        // 重置
        manager.reset();

        // 导入状态
        manager.importState(exported as any);

        return {
          exported,
          restored: manager.getState()
        };
      });

      if (result) {
        expect(result.exported.completed_steps).toContain('move');
        expect(result.exported.completed_steps).toContain('interact');
        expect(result.restored.completed_steps).toContain('move');
        expect(result.restored.completed_steps).toContain('interact');
      }
    });
  });
});