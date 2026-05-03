// tests/debug/inventory-keyboard-debug.spec.ts
/**
 * 键盘事件调试测试
 */

import { test, expect } from '@playwright/test';

test('调试：检查B键处理流程', async ({ page }) => {
  await page.goto('/?scene=clinic');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);

  // 点击画布
  await page.locator('canvas').click();
  await page.waitForTimeout(500);

  // 检查场景状态
  const state = await page.evaluate(() => {
    const game = (window as any).__PHASER_GAME__;
    if (!game) return { error: 'no game' };
    const clinicScene = game.scene.getScene('ClinicScene');
    if (!clinicScene) return { error: 'no clinicScene' };

    return {
      active: clinicScene.sys.settings.active,
      status: clinicScene.sys.settings.status,
      isTransitioning: clinicScene.isTransitioning,
      hasInventoryKey: clinicScene.inventoryKey !== undefined,
      inventoryKeyIsDown: clinicScene.inventoryKey?.isDown,
      updateRunning: game.loop.isRunning
    };
  });
  console.log('State before B:', JSON.stringify(state, null, 2));

  // 监听toggleInventory调用
  await page.evaluate(() => {
    const game = (window as any).__PHASER_GAME__;
    const clinicScene = game.scene.getScene('ClinicScene');
    // 覆盖toggleInventory记录调用
    clinicScene._toggleInventoryCalled = false;
    const originalToggle = clinicScene.toggleInventory;
    clinicScene.toggleInventory = function() {
      clinicScene._toggleInventoryCalled = true;
      console.log('[TEST] toggleInventory called!');
      return originalToggle.call(this);
    };
  });

  // 按B键
  await page.keyboard.press('b');
  await page.waitForTimeout(200);

  // 检查toggleInventory是否被调用
  const afterState = await page.evaluate(() => {
    const game = (window as any).__PHASER_GAME__;
    const clinicScene = game.scene.getScene('ClinicScene');

    return {
      toggleInventoryCalled: clinicScene._toggleInventoryCalled,
      inventoryRootExists: document.getElementById('inventory-ui-root') !== null,
      inventoryUIExists: document.querySelector('.inventory-ui') !== null
    };
  });
  console.log('State after B:', JSON.stringify(afterState, null, 2));

  // 截图
  await page.screenshot({ path: 'test-results/debug/keyboard-debug.png' });
});