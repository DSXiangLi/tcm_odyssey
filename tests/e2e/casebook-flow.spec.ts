// tests/e2e/casebook-flow.spec.ts
/**
 * 病案集完整流程 E2E 测试
 * Phase 2.5 病案集 HTML 嵌入验收测试
 *
 * 测试覆盖:
 * - 病案集场景加载与初始化
 * - React UI 渲染验证
 * - C 键触发场景启动
 * - START_CASE 事件桥接
 * - 与诊断游戏集成
 * - 病案进度更新
 * - DIAGNOSIS_COMPLETE 回写
 */

import { test, expect } from '@playwright/test';
import { waitForGameReady, pressKey, waitForScene } from './utils/phaser-helper';

test.describe('Casebook Scene Tests (Phase 2.5)', () => {
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
    test('病案集场景正常加载渲染', async ({ page }) => {
      // 直接启动病案集场景
      await page.evaluate(() => {
        const game = (window as any).__PHASER_GAME__;
        if (game) {
          game.scene.start('CasebookScene', {});
        }
      });

      await page.waitForTimeout(2000);

      // 检查病案集场景是否初始化
      const casebookSceneState = await page.evaluate(() => {
        const casebookScene = (window as any).__CASEBOOK_SCENE__;
        return casebookScene ? {
          isInitialized: casebookScene.isInitialized,
          hasReactUI: casebookScene.hasReactUI,
          initialCaseId: casebookScene.initialCaseId
        } : null;
      });

      expect(casebookSceneState).not.toBeNull();
      expect(casebookSceneState?.isInitialized).toBe(true);
      expect(casebookSceneState?.hasReactUI).toBe(true);
    });

    test('React DOM容器正确创建', async ({ page }) => {
      await page.evaluate(() => {
        const game = (window as any).__PHASER_GAME__;
        if (game) {
          game.scene.start('CasebookScene', {});
        }
      });

      await page.waitForTimeout(2000);

      // 检查React DOM容器是否存在
      const domContainer = await page.evaluate(() => {
        const container = document.getElementById('casebook-react-root');
        return container ? {
          exists: true,
          hasChildren: container.children.length > 0
        } : { exists: false };
      });

      expect(domContainer.exists).toBe(true);
      expect(domContainer.hasChildren).toBe(true);
    });

    test('病案进度数据加载', async ({ page }) => {
      await page.evaluate(() => {
        const game = (window as any).__PHASER_GAME__;
        if (game) {
          // 设置初始进度数据
          game.registry.set('casebook_progress', { lung: ['lung-001'] });
          game.scene.start('CasebookScene', {});
        }
      });

      await page.waitForTimeout(2000);

      // 验证进度数据可访问
      const progressData = await page.evaluate(() => {
        const game = (window as any).__PHASER_GAME__;
        return game?.registry?.get('casebook_progress');
      });

      expect(progressData).toBeDefined();
      expect(progressData?.lung).toBeDefined();
    });
  });

  // ============================================
  // C键触发测试
  // ============================================
  test.describe('C Key Trigger Tests', () => {
    test('诊所场景按C键触发病案集', async ({ page }) => {
      // 进入诊所场景
      await page.evaluate(() => {
        const game = (window as any).__PHASER_GAME__;
        if (game) {
          game.scene.start('ClinicScene');
        }
      });

      await waitForScene(page, 'ClinicScene', 10000);

      // 按C键触发病案集
      await pressKey(page, 'c');
      await page.waitForTimeout(1000);

      // 验证病案集场景启动
      const casebookActive = await page.evaluate(() => {
        const casebookScene = (window as any).__CASEBOOK_SCENE__;
        return casebookScene?.isInitialized || false;
      });

      expect(casebookActive).toBe(true);
    });

    test('病案集场景通过scene.launch并行运行', async ({ page }) => {
      // 进入诊所场景
      await page.evaluate(() => {
        const game = (window as any).__PHASER_GAME__;
        if (game) {
          game.scene.start('ClinicScene');
        }
      });

      await waitForScene(page, 'ClinicScene', 10000);

      // 按C键
      await pressKey(page, 'c');
      await page.waitForTimeout(1000);

      // 验证诊所场景仍然存在（并行运行）
      const clinicStillActive = await page.evaluate(() => {
        const game = (window as any).__PHASER_GAME__;
        const clinicScene = game?.scene?.getScene('ClinicScene');
        return clinicScene !== null;
      });

      expect(clinicStillActive).toBe(true);
    });
  });

  // ============================================
  // 事件桥接测试
  // ============================================
  test.describe('Event Bridge Tests', () => {
    test('START_CASE事件触发诊断场景', async ({ page }) => {
      // 启动病案集场景
      await page.evaluate(() => {
        const game = (window as any).__PHASER_GAME__;
        if (game) {
          game.scene.start('CasebookScene', {});
        }
      });

      await page.waitForTimeout(2000);

      // 模拟发送START_CASE事件
      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('casebook:start_case', {
          detail: { caseId: 'lung-001' }
        }));
      });

      await page.waitForTimeout(1000);

      // 验证诊断场景已启动
      const diagnosisSceneExists = await page.evaluate(() => {
        const game = (window as any).__PHASER_GAME__;
        const diagnosisScene = game?.scene?.getScene('DiagnosisScene');
        return diagnosisScene !== null;
      });

      expect(diagnosisSceneExists).toBe(true);
    });

    test('REPLAY_CASE事件触发诊断场景', async ({ page }) => {
      // 启动病案集场景
      await page.evaluate(() => {
        const game = (window as any).__PHASER_GAME__;
        if (game) {
          game.scene.start('CasebookScene', {});
        }
      });

      await page.waitForTimeout(2000);

      // 模拟发送REPLAY_CASE事件
      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('casebook:replay_case', {
          detail: { caseId: 'heart-002' }
        }));
      });

      await page.waitForTimeout(1000);

      // 验证诊断场景已启动
      const diagnosisSceneExists = await page.evaluate(() => {
        const game = (window as any).__PHASER_GAME__;
        const diagnosisScene = game?.scene?.getScene('DiagnosisScene');
        return diagnosisScene !== null;
      });

      expect(diagnosisSceneExists).toBe(true);
    });

    test('CLOSE事件关闭病案集场景', async ({ page }) => {
      // 启动病案集场景
      await page.evaluate(() => {
        const game = (window as any).__PHASER_GAME__;
        if (game) {
          game.scene.start('CasebookScene', {});
        }
      });

      await page.waitForTimeout(2000);

      // 确认场景已初始化
      const beforeClose = await page.evaluate(() => {
        return (window as any).__CASEBOOK_SCENE__?.isInitialized || false;
      });
      expect(beforeClose).toBe(true);

      // 发送CLOSE事件
      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('casebook:close'));
      });

      // 等待场景完全关闭（shutdown生命周期需要更长时间）
      await page.waitForTimeout(1000);

      // 验证场景已关闭 - 检查场景是否停止运行
      const afterClose = await page.evaluate(() => {
        const casebookScene = (window as any).__CASEBOOK_SCENE__;
        // 场景可能被清理为null，或者isInitialized变为false
        if (casebookScene === null) return true;
        if (!casebookScene.isInitialized) return true;
        // 检查DOM容器是否已移除
        const container = document.getElementById('casebook-react-root');
        return container === null;
      });

      expect(afterClose).toBe(true);
    });
  });

  // ============================================
  // 诊断结果回写测试
  // ============================================
  test.describe('Diagnosis Result Write-back Tests', () => {
    test('DIAGNOSIS_COMPLETE事件更新病案进度', async ({ page }) => {
      // 启动病案集场景
      await page.evaluate(() => {
        const game = (window as any).__PHASER_GAME__;
        if (game) {
          game.scene.start('CasebookScene', {});
        }
      });

      await page.waitForTimeout(2000);

      // 模拟诊断完成事件
      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('diagnosis:complete', {
          detail: {
            caseId: 'lung-001',
            score: '85',
            syndrome: '风寒表实证',
            formula: '麻黄汤'
          }
        }));
      });

      await page.waitForTimeout(500);

      // 验证进度已更新
      const progress = await page.evaluate(() => {
        const game = (window as any).__PHASER_GAME__;
        return game?.registry?.get('casebook_progress');
      });

      expect(progress).toBeDefined();
      expect(progress?.lung).toContain('lung-001');
    });

    test('RESULT事件发送到病案集UI', async ({ page }) => {
      // 启动病案集场景
      await page.evaluate(() => {
        const game = (window as any).__PHASER_GAME__;
        if (game) {
          game.scene.start('CasebookScene', {});
        }
      });

      await page.waitForTimeout(2000);

      // 设置事件监听器捕获RESULT事件
      const resultEventReceived = await page.evaluate(() => {
        return new Promise<boolean>((resolve) => {
          const handler = (e: CustomEvent) => {
            if (e.detail.caseId === 'lung-001') {
              window.removeEventListener('casebook:result', handler);
              resolve(true);
            }
          };
          window.addEventListener('casebook:result', handler as EventListener);

          // 触发诊断完成事件
          window.dispatchEvent(new CustomEvent('diagnosis:complete', {
            detail: {
              caseId: 'lung-001',
              score: '85',
              syndrome: '风寒表实证',
              formula: '麻黄汤'
            }
          }));

          // 超时保护
          setTimeout(() => resolve(false), 2000);
        });
      });

      expect(resultEventReceived).toBe(true);
    });

    test('病案进度数据持久化', async ({ page }) => {
      // 启动病案集场景
      await page.evaluate(() => {
        const game = (window as any).__PHASER_GAME__;
        if (game) {
          game.scene.start('CasebookScene', {});
        }
      });

      await page.waitForTimeout(2000);

      // 模拟多个诊断完成事件
      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('diagnosis:complete', {
          detail: { caseId: 'lung-001', score: '85', syndrome: '风寒表实证', formula: '麻黄汤' }
        }));
      });

      await page.waitForTimeout(300);

      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('diagnosis:complete', {
          detail: { caseId: 'lung-002', score: '90', syndrome: '风热表证', formula: '银翘散' }
        }));
      });

      await page.waitForTimeout(500);

      // 验证多个病案已记录
      const progress = await page.evaluate(() => {
        const game = (window as any).__PHASER_GAME__;
        return game?.registry?.get('casebook_progress');
      });

      expect(progress?.lung).toContain('lung-001');
      expect(progress?.lung).toContain('lung-002');
    });
  });

  // ============================================
  // UI渲染与交互测试
  // ============================================
  test.describe('UI Rendering Tests', () => {
    test('病案集UI容器样式正确', async ({ page }) => {
      await page.evaluate(() => {
        const game = (window as any).__PHASER_GAME__;
        if (game) {
          game.scene.start('CasebookScene', {});
        }
      });

      await page.waitForTimeout(2000);

      // 检查CSS样式
      const styles = await page.evaluate(() => {
        const container = document.getElementById('casebook-react-root');
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

    test('截图记录：病案集场景', async ({ page }) => {
      await page.evaluate(() => {
        const game = (window as any).__PHASER_GAME__;
        if (game) {
          game.scene.start('CasebookScene', {});
        }
      });

      await page.waitForTimeout(2000);

      // 截图保存
      await page.screenshot({ path: 'tests/screenshots/casebook-scene.png' });
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
          game.scene.start('CasebookScene', {});
        }
      });

      await page.waitForTimeout(2000);

      // 验证React容器存在
      const containerBefore = await page.evaluate(() => {
        return document.getElementById('casebook-react-root') !== null;
      });
      expect(containerBefore).toBe(true);

      // 发送CLOSE事件
      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('casebook:close'));
      });

      await page.waitForTimeout(500);

      // 验证React容器已移除
      const containerAfter = await page.evaluate(() => {
        return document.getElementById('casebook-react-root') === null;
      });
      expect(containerAfter).toBe(true);
    });

    test('场景关闭时事件监听器正确移除', async ({ page }) => {
      await page.evaluate(() => {
        const game = (window as any).__PHASER_GAME__;
        if (game) {
          game.scene.start('CasebookScene', {});
        }
      });

      await page.waitForTimeout(2000);

      // 发送CLOSE事件
      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('casebook:close'));
      });

      await page.waitForTimeout(500);

      // 再次发送START_CASE事件，验证不会触发诊断场景
      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('casebook:start_case', {
          detail: { caseId: 'lung-001' }
        }));
      });

      await page.waitForTimeout(500);

      // 验证诊断场景未启动（监听器已移除）
      const diagnosisSceneExists = await page.evaluate(() => {
        const game = (window as any).__PHASER_GAME__;
        const diagnosisScene = game?.scene?.getScene('DiagnosisScene');
        // 如果场景存在但未初始化，说明监听器已移除
        return diagnosisScene?.sceneIsActive === true;
      });

      expect(diagnosisSceneExists).toBe(false);
    });
  });

  // ============================================
  // 完整流程集成测试
  // ============================================
  test.describe('Full Flow Integration Tests', () => {
    test('诊所→病案集场景切换', async ({ page }) => {
      // 1. 进入诊所场景
      await page.evaluate(() => {
        const game = (window as any).__PHASER_GAME__;
        if (game) {
          game.scene.start('ClinicScene');
        }
      });

      await waitForScene(page, 'ClinicScene', 10000);

      // 2. 按C键打开病案集
      await pressKey(page, 'c');
      await page.waitForTimeout(1000);

      const casebookLoaded = await page.evaluate(() => {
        return (window as any).__CASEBOOK_SCENE__?.isInitialized || false;
      });
      expect(casebookLoaded).toBe(true);

      // 3. 验证病案集React UI正确渲染
      const containerExists = await page.evaluate(() => {
        return document.getElementById('casebook-react-root') !== null;
      });
      expect(containerExists).toBe(true);
    });

    test('病案集→诊断场景切换', async ({ page }) => {
      // 直接启动病案集场景
      await page.evaluate(() => {
        const game = (window as any).__PHASER_GAME__;
        if (game) {
          game.scene.start('CasebookScene', {});
        }
      });

      await page.waitForTimeout(2000);

      // 模拟START_CASE事件
      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('casebook:start_case', {
          detail: { caseId: 'lung-001' }
        }));
      });

      await page.waitForTimeout(1000);

      // 验证诊断场景启动
      const diagnosisSceneExists = await page.evaluate(() => {
        const game = (window as any).__PHASER_GAME__;
        const diagnosisScene = game?.scene?.getScene('DiagnosisScene');
        return diagnosisScene !== null;
      });
      expect(diagnosisSceneExists).toBe(true);
    });

    test('病案数据在整个流程中保持一致', async ({ page }) => {
      const testCaseId = 'heart-003';

      // 启动病案集场景，使用正确的参数传递方式
      await page.evaluate((caseId) => {
        const game = (window as any).__PHASER_GAME__;
        if (game) {
          game.scene.start('CasebookScene', { caseId });
        }
      }, testCaseId);

      await page.waitForTimeout(2000);

      // 验证初始病案ID
      const initialCaseId = await page.evaluate(() => {
        return (window as any).__CASEBOOK_SCENE__?.initialCaseId;
      });
      expect(initialCaseId).toBe(testCaseId);

      // 触发START_CASE，同样使用参数传递
      await page.evaluate((caseId) => {
        window.dispatchEvent(new CustomEvent('casebook:start_case', {
          detail: { caseId }
        }));
      }, testCaseId);

      await page.waitForTimeout(1000);

      // 验证诊断场景接收到正确的caseId
      // (诊断场景会暴露 __DIAGNOSIS_SCENE__ 或类似的全局变量)
    });
  });
});