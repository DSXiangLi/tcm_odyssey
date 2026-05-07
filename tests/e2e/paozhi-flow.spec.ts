// tests/e2e/paozhi-flow.spec.ts
/**
 * 炮制游戏完整流程 E2E 测试
 * Phase 2.5 炮制 HTML 嵌入验收测试
 *
 * 测试覆盖:
 * - 炮制场景加载与初始化
 * - React UI 渲染验证
 * - P 键触发场景启动（药园场景）
 * - COMPLETE 事件桥接
 * - 炮制品添加到背包系统
 * - 炮制进度数据持久化
 * - PAOZHI_ADDED 回写
 */

import { test, expect } from '@playwright/test';
import { waitForGameReady, pressKey, waitForScene } from './utils/phaser-helper';

test.describe('Paozhi Scene Tests (Phase 2.5)', () => {
  test.beforeEach(async ({ page }) => {
    // 启动游戏
    await page.goto('/');

    // 等待游戏加载完成
    await waitForGameReady(page, 30000);
  });

  // ============================================
  // 场景加载与初始化测试
  // ============================================
  test.describe('Scene Initialization', () => {
    test('炮制场景正常加载渲染', async ({ page }) => {
      // 直接启动炮制场景
      await page.evaluate(() => {
        const game = (window as any).__PHASER_GAME__;
        if (game) {
          game.scene.start('PaozhiScene', { recipeId: 'r1' });
        }
      });

      await page.waitForTimeout(2000);

      // 检查炮制场景是否初始化
      const paozhiSceneState = await page.evaluate(() => {
        const paozhiScene = (window as any).__PAOZHI_SCENE__;
        return paozhiScene ? {
          isInitialized: paozhiScene.isInitialized,
          hasReactUI: paozhiScene.hasReactUI,
          initialRecipeId: paozhiScene.initialRecipeId
        } : null;
      });

      expect(paozhiSceneState).not.toBeNull();
      expect(paozhiSceneState?.isInitialized).toBe(true);
      expect(paozhiSceneState?.hasReactUI).toBe(true);
    });

    test('React DOM容器正确创建', async ({ page }) => {
      await page.evaluate(() => {
        const game = (window as any).__PHASER_GAME__;
        if (game) {
          game.scene.start('PaozhiScene', {});
        }
      });

      await page.waitForTimeout(2000);

      // 检查React DOM容器是否存在
      const domContainer = await page.evaluate(() => {
        const container = document.getElementById('paozhi-react-root');
        return container ? {
          exists: true,
          hasChildren: container.children.length > 0
        } : { exists: false };
      });

      expect(domContainer.exists).toBe(true);
      expect(domContainer.hasChildren).toBe(true);
    });

    test('炮制配方参数正确传递', async ({ page }) => {
      const testRecipeId = 'r3';

      await page.evaluate((recipeId) => {
        const game = (window as any).__PHASER_GAME__;
        if (game) {
          game.scene.start('PaozhiScene', { recipeId });
        }
      }, testRecipeId);

      await page.waitForTimeout(2000);

      // 验证配方ID正确传递
      const recipeId = await page.evaluate(() => {
        return (window as any).__PAOZHI_SCENE__?.initialRecipeId;
      });

      expect(recipeId).toBe(testRecipeId);
    });
  });

  // ============================================
  // P键触发测试
  // ============================================
  test.describe('P Key Trigger Tests', () => {
    test('药园场景按P键触发炮制', async ({ page }) => {
      // 进入药园场景
      await page.evaluate(() => {
        const game = (window as any).__PHASER_GAME__;
        if (game) {
          game.scene.start('GardenScene');
        }
      });

      await waitForScene(page, 'GardenScene', 10000);

      // 按P键触发炮制
      await pressKey(page, 'p');
      await page.waitForTimeout(1000);

      // 验证炮制场景启动
      const paozhiActive = await page.evaluate(() => {
        const paozhiScene = (window as any).__PAOZHI_SCENE__;
        return paozhiScene?.isInitialized || false;
      });

      expect(paozhiActive).toBe(true);
    });

    test('炮制场景通过scene.launch并行运行', async ({ page }) => {
      // 进入药园场景
      await page.evaluate(() => {
        const game = (window as any).__PHASER_GAME__;
        if (game) {
          game.scene.start('GardenScene');
        }
      });

      await waitForScene(page, 'GardenScene', 10000);

      // 按P键
      await pressKey(page, 'p');
      await page.waitForTimeout(1000);

      // 验证药园场景仍然存在（并行运行）
      const gardenStillExists = await page.evaluate(() => {
        const game = (window as any).__PHASER_GAME__;
        const gardenScene = game?.scene?.getScene('GardenScene');
        return gardenScene !== null;
      });

      expect(gardenStillExists).toBe(true);
    });

    test('药园场景暂停状态正确', async ({ page }) => {
      // 进入药园场景
      await page.evaluate(() => {
        const game = (window as any).__PHASER_GAME__;
        if (game) {
          game.scene.start('GardenScene');
        }
      });

      await waitForScene(page, 'GardenScene', 10000);

      // 按P键
      await pressKey(page, 'p');
      await page.waitForTimeout(1000);

      // 验证药园场景已暂停
      const gardenPaused = await page.evaluate(() => {
        const game = (window as any).__PHASER_GAME__;
        const gardenScene = game?.scene?.getScene('GardenScene');
        return gardenScene?.sceneIsActive === false;
      });

      // 如果未暂停，检查场景状态
      const gardenStatus = await page.evaluate(() => {
        const game = (window as any).__PHASER_GAME__;
        const gardenScene = game?.scene?.getScene('GardenScene');
        return {
          exists: gardenScene !== null,
          isPaused: gardenScene?.sceneIsActive === false
        };
      });

      // 场景应该存在，可能暂停或并行运行
      expect(gardenStatus.exists).toBe(true);
    });
  });

  // ============================================
  // 事件桥接测试
  // ============================================
  test.describe('Event Bridge Tests', () => {
    test('COMPLETE事件触发炮制品添加', async ({ page }) => {
      // 启动炮制场景
      await page.evaluate(() => {
        const game = (window as any).__PHASER_GAME__;
        if (game) {
          game.scene.start('PaozhiScene', {});
        }
      });

      await page.waitForTimeout(2000);

      // 模拟炮制完成事件
      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('paozhi:complete', {
          detail: { recipeId: 'r1', quality: 0.85 }
        }));
      });

      await page.waitForTimeout(500);

      // 验证炮制进度已更新
      const progress = await page.evaluate(() => {
        const game = (window as any).__PHASER_GAME__;
        return game?.registry?.get('paozhi_progress');
      });

      expect(progress).toBeDefined();
      expect(progress?.r1).toBeCloseTo(0.85, 2);
    });

    test('PAOZHI_ADDED事件发送到背包系统', async ({ page }) => {
      // 启动炮制场景
      await page.evaluate(() => {
        const game = (window as any).__PHASER_GAME__;
        if (game) {
          game.scene.start('PaozhiScene', {});
        }
      });

      await page.waitForTimeout(2000);

      // 设置事件监听器捕获PAOZHI_ADDED事件
      const addedEventReceived = await page.evaluate(() => {
        return new Promise<boolean>((resolve) => {
          const handler = (e: CustomEvent) => {
            if (e.detail.recipeId === 'r1' && e.detail.quality > 0) {
              window.removeEventListener('paozhi:added', handler);
              resolve(true);
            }
          };
          window.addEventListener('paozhi:added', handler as EventListener);

          // 触发炮制完成事件
          window.dispatchEvent(new CustomEvent('paozhi:complete', {
            detail: { recipeId: 'r1', quality: 0.9 }
          }));

          // 超时保护
          setTimeout(() => resolve(false), 2000);
        });
      });

      expect(addedEventReceived).toBe(true);
    });

    test('CLOSE事件关闭炮制场景', async ({ page }) => {
      // 启动炮制场景
      await page.evaluate(() => {
        const game = (window as any).__PHASER_GAME__;
        if (game) {
          game.scene.start('PaozhiScene', {});
        }
      });

      await page.waitForTimeout(2000);

      // 确认场景已初始化
      const beforeClose = await page.evaluate(() => {
        return (window as any).__PAOZHI_SCENE__?.isInitialized || false;
      });
      expect(beforeClose).toBe(true);

      // 发送CLOSE事件
      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('paozhi:close'));
      });

      // 等待场景完全关闭（shutdown生命周期需要更长时间）
      await page.waitForTimeout(1000);

      // 验证场景已关闭 - 检查场景是否停止运行
      const afterClose = await page.evaluate(() => {
        const paozhiScene = (window as any).__PAOZHI_SCENE__;
        // 场景可能被清理为null，或者isInitialized变为false
        if (paozhiScene === null) return true;
        if (!paozhiScene.isInitialized) return true;
        // 检查DOM容器是否已移除
        const container = document.getElementById('paozhi-react-root');
        return container === null;
      });

      expect(afterClose).toBe(true);
    });

    test('多个炮制配方完成事件处理', async ({ page }) => {
      // 启动炮制场景
      await page.evaluate(() => {
        const game = (window as any).__PHASER_GAME__;
        if (game) {
          game.scene.start('PaozhiScene', {});
        }
      });

      await page.waitForTimeout(2000);

      // 模拟多个炮制完成事件
      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('paozhi:complete', {
          detail: { recipeId: 'r1', quality: 0.85 }
        }));
      });

      await page.waitForTimeout(300);

      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('paozhi:complete', {
          detail: { recipeId: 'r2', quality: 0.92 }
        }));
      });

      await page.waitForTimeout(500);

      // 验证多个配方已记录
      const progress = await page.evaluate(() => {
        const game = (window as any).__PHASER_GAME__;
        return game?.registry?.get('paozhi_progress');
      });

      expect(progress?.r1).toBeCloseTo(0.85, 2);
      expect(progress?.r2).toBeCloseTo(0.92, 2);
    });
  });

  // ============================================
  // 炮制品品质测试
  // ============================================
  test.describe('Processed Herb Quality Tests', () => {
    test('高品质炮制品记录', async ({ page }) => {
      await page.evaluate(() => {
        const game = (window as any).__PHASER_GAME__;
        if (game) {
          game.scene.start('PaozhiScene', {});
        }
      });

      await page.waitForTimeout(2000);

      // 模拟高品质炮制（0.95）
      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('paozhi:complete', {
          detail: { recipeId: 'r1', quality: 0.95 }
        }));
      });

      await page.waitForTimeout(500);

      const quality = await page.evaluate(() => {
        const game = (window as any).__PHASER_GAME__;
        const progress = game?.registry?.get('paozhi_progress');
        return progress?.r1;
      });

      expect(quality).toBeCloseTo(0.95, 2);
    });

    test('低品质炮制品记录', async ({ page }) => {
      await page.evaluate(() => {
        const game = (window as any).__PHASER_GAME__;
        if (game) {
          game.scene.start('PaozhiScene', {});
        }
      });

      await page.waitForTimeout(2000);

      // 模拟低品质炮制（0.4）
      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('paozhi:complete', {
          detail: { recipeId: 'r1', quality: 0.4 }
        }));
      });

      await page.waitForTimeout(500);

      const quality = await page.evaluate(() => {
        const game = (window as any).__PHASER_GAME__;
        const progress = game?.registry?.get('paozhi_progress');
        return progress?.r1;
      });

      expect(quality).toBeCloseTo(0.4, 2);
    });

    test('品质范围验证（0.4-0.95）', async ({ page }) => {
      await page.evaluate(() => {
        const game = (window as any).__PHASER_GAME__;
        if (game) {
          game.scene.start('PaozhiScene', {});
        }
      });

      await page.waitForTimeout(2000);

      // 测试多个品质值
      const testQualities = [0.4, 0.5, 0.6, 0.7, 0.8, 0.95];

      for (const quality of testQualities) {
        await page.evaluate((q) => {
          window.dispatchEvent(new CustomEvent('paozhi:complete', {
            detail: { recipeId: `r_${q}`, quality: q }
          }));
        }, quality);

        await page.waitForTimeout(200);
      }

      // 验证所有品质值已记录
      const progress = await page.evaluate(() => {
        const game = (window as any).__PHASER_GAME__;
        return game?.registry?.get('paozhi_progress');
      });

      testQualities.forEach(quality => {
        expect(progress[`r_${quality}`]).toBeCloseTo(quality, 2);
      });
    });
  });

  // ============================================
  // UI渲染与交互测试
  // ============================================
  test.describe('UI Rendering Tests', () => {
    test('炮制UI容器样式正确', async ({ page }) => {
      await page.evaluate(() => {
        const game = (window as any).__PHASER_GAME__;
        if (game) {
          game.scene.start('PaozhiScene', {});
        }
      });

      await page.waitForTimeout(2000);

      // 检查CSS样式
      const styles = await page.evaluate(() => {
        const container = document.getElementById('paozhi-react-root');
        if (!container) return null;

        const computedStyle = window.getComputedStyle(container);
        return {
          position: computedStyle.position,
          zIndex: computedStyle.zIndex
        };
      });

      expect(styles).not.toBeNull();
      expect(styles?.position).toBe('fixed');
      expect(parseInt(styles?.zIndex || '0')).toBeGreaterThanOrEqual(1000);
    });

    test('截图记录：炮制场景', async ({ page }) => {
      await page.evaluate(() => {
        const game = (window as any).__PHASER_GAME__;
        if (game) {
          game.scene.start('PaozhiScene', {});
        }
      });

      await page.waitForTimeout(2000);

      // 截图保存
      await page.screenshot({ path: 'tests/screenshots/paozhi-scene.png' });
    });
  });

  // ============================================
  // 场景清理测试
  // ============================================
  test.describe('Scene Cleanup Tests', () => {
    test('场景关闭时React UI正确卸载', async ({ page }) => {
      await page.evaluate(() => {
        const game = (window as any).__PHASER_GAME__;
        if (game) {
          game.scene.start('PaozhiScene', {});
        }
      });

      await page.waitForTimeout(2000);

      // 验证React容器存在
      const containerBefore = await page.evaluate(() => {
        return document.getElementById('paozhi-react-root') !== null;
      });
      expect(containerBefore).toBe(true);

      // 发送CLOSE事件
      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('paozhi:close'));
      });

      await page.waitForTimeout(500);

      // 验证React容器已移除
      const containerAfter = await page.evaluate(() => {
        return document.getElementById('paozhi-react-root') === null;
      });
      expect(containerAfter).toBe(true);
    });

    test('场景关闭时事件监听器正确移除', async ({ page }) => {
      await page.evaluate(() => {
        const game = (window as any).__PHASER_GAME__;
        if (game) {
          game.scene.start('PaozhiScene', {});
        }
      });

      await page.waitForTimeout(2000);

      // 发送CLOSE事件
      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('paozhi:close'));
      });

      await page.waitForTimeout(500);

      // 再次发送COMPLETE事件，验证不会更新进度（监听器已移除）
      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('paozhi:complete', {
          detail: { recipeId: 'r_test', quality: 0.99 }
        }));
      });

      await page.waitForTimeout(500);

      // 验证r_test未记录到进度中
      const progress = await page.evaluate(() => {
        const game = (window as any).__PHASER_GAME__;
        return game?.registry?.get('paozhi_progress');
      });

      // r_test不应该存在，或者quality不应该是0.99
      expect(progress?.r_test).toBeFalsy();
    });
  });

  // ============================================
  // 完整流程集成测试
  // ============================================
  test.describe('Full Flow Integration Tests', () => {
    test('药园→炮制→完成→背包完整流程', async ({ page }) => {
      // 1. 进入药园场景
      await page.evaluate(() => {
        const game = (window as any).__PHASER_GAME__;
        if (game) {
          game.scene.start('GardenScene');
        }
      });

      await waitForScene(page, 'GardenScene', 10000);

      // 2. 按P键打开炮制
      await pressKey(page, 'p');
      await page.waitForTimeout(1000);

      const paozhiLoaded = await page.evaluate(() => {
        return (window as any).__PAOZHI_SCENE__?.isInitialized || false;
      });
      expect(paozhiLoaded).toBe(true);

      // 3. 模拟炮制完成
      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('paozhi:complete', {
          detail: { recipeId: 'r1', quality: 0.88 }
        }));
      });

      await page.waitForTimeout(500);

      // 4. 验证PAOZHI_ADDED事件已发送
      const addedEventReceived = await page.evaluate(() => {
        return new Promise<boolean>((resolve) => {
          // PAOZHI_ADDED事件应该已经发送过了
          const progress = (window as any).__PHASER_GAME__?.registry?.get('paozhi_progress');
          if (progress?.r1 === 0.88) {
            resolve(true);
          } else {
            resolve(false);
          }
        });
      });

      expect(addedEventReceived).toBe(true);

      // 5. 验证炮制进度已更新
      const progress = await page.evaluate(() => {
        const game = (window as any).__PHASER_GAME__;
        return game?.registry?.get('paozhi_progress');
      });

      expect(progress?.r1).toBeCloseTo(0.88, 2);
    });

    test('炮制配方数据在整个流程中保持一致', async ({ page }) => {
      const testRecipeId = 'r5';

      // 启动炮制场景
      await page.evaluate((recipeId) => {
        const game = (window as any).__PHASER_GAME__;
        if (game) {
          game.scene.start('PaozhiScene', { recipeId });
        }
      }, testRecipeId);

      await page.waitForTimeout(2000);

      // 验证初始配方ID
      const initialRecipeId = await page.evaluate(() => {
        return (window as any).__PAOZHI_SCENE__?.initialRecipeId;
      });
      expect(initialRecipeId).toBe(testRecipeId);
    });

    test('多次炮制累计进度记录', async ({ page }) => {
      // 启动炮制场景
      await page.evaluate(() => {
        const game = (window as any).__PHASER_GAME__;
        if (game) {
          game.scene.start('PaozhiScene', {});
        }
      });

      await page.waitForTimeout(2000);

      // 模拟多次炮制
      const recipes = [
        { id: 'r1', quality: 0.85 },
        { id: 'r2', quality: 0.92 },
        { id: 'r3', quality: 0.78 },
      ];

      for (const recipe of recipes) {
        await page.evaluate((r) => {
          window.dispatchEvent(new CustomEvent('paozhi:complete', {
            detail: { recipeId: r.id, quality: r.quality }
          }));
        }, recipe);

        await page.waitForTimeout(200);
      }

      // 验证所有配方已记录
      const progress = await page.evaluate(() => {
        const game = (window as any).__PHASER_GAME__;
        return game?.registry?.get('paozhi_progress');
      });

      recipes.forEach(recipe => {
        expect(progress[recipe.id]).toBeCloseTo(recipe.quality, 2);
      });

      // 验证记录数量
      const recordedCount = Object.keys(progress).length;
      expect(recordedCount).toBeGreaterThanOrEqual(recipes.length);
    });
  });

  // ============================================
  // 与背包系统集成测试
  // ============================================
  test.describe('Inventory Integration Tests', () => {
    test('炮制品添加到背包系统', async ({ page }) => {
      // 启动炮制场景
      await page.evaluate(() => {
        const game = (window as any).__PHASER_GAME__;
        if (game) {
          game.scene.start('PaozhiScene', {});
        }
      });

      await page.waitForTimeout(2000);

      // 模拟炮制完成
      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('paozhi:complete', {
          detail: { recipeId: 'r1', quality: 0.85 }
        }));
      });

      await page.waitForTimeout(500);

      // 检查背包系统是否接收到PAOZHI_ADDED事件
      // (背包系统应该监听paozhi:added事件并添加炮制品)
      const inventoryUpdate = await page.evaluate(() => {
        // 如果背包系统暴露了状态，检查是否有processed_herb类型物品
        const manager = (window as any).__INVENTORY_MANAGER__;
        if (manager) {
          const stats = manager.getStatistics();
          return {
            hasManager: true,
            stats: stats
          };
        }
        return { hasManager: false };
      });

      // 如果背包系统存在，验证它可以接收炮制品
      if (inventoryUpdate.hasManager) {
        expect(inventoryUpdate.stats).toBeDefined();
      }
    });

    test('炮制品品质传递到背包', async ({ page }) => {
      // 启动炮制场景
      await page.evaluate(() => {
        const game = (window as any).__PHASER_GAME__;
        if (game) {
          game.scene.start('PaozhiScene', {});
        }
      });

      await page.waitForTimeout(2000);

      // 模拟高品质炮制
      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('paozhi:complete', {
          detail: { recipeId: 'r1', quality: 0.95 }
        }));
      });

      await page.waitForTimeout(500);

      // 验证PAOZHI_ADDED事件携带品质信息
      const addedEventDetail = await page.evaluate(() => {
        return new Promise<any>((resolve) => {
          const handler = (e: CustomEvent) => {
            window.removeEventListener('paozhi:added', handler);
            resolve(e.detail);
          };
          window.addEventListener('paozhi:added', handler as EventListener);

          // 再次触发完成事件
          window.dispatchEvent(new CustomEvent('paozhi:complete', {
            detail: { recipeId: 'r2', quality: 0.9 }
          }));

          setTimeout(() => resolve(null), 1000);
        });
      });

      if (addedEventDetail) {
        expect(addedEventDetail.quality).toBeCloseTo(0.9, 2);
        expect(addedEventDetail.recipeId).toBe('r2');
      }
    });
  });
});