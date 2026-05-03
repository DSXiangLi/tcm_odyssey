// tests/debug/inventory-scene-check.spec.ts
/**
 * 调试测试：检查ClinicScene状态
 */

import { test, expect } from '@playwright/test';

test('调试：检查ClinicScene键盘状态', async ({ page }) => {
  await page.goto('/?scene=clinic');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  // 点击画布获取焦点
  await page.locator('canvas').click();
  await page.waitForTimeout(500);

  // 检查ClinicScene状态
  const sceneState = await page.evaluate(() => {
    const game = (window as any).__PHASER_GAME__;
    if (!game) return { error: 'No game instance' };

    const clinicScene = game.scene.getScene('ClinicScene');
    if (!clinicScene) return { error: 'No ClinicScene' };

    // 检查场景状态
    const status = clinicScene.sys.settings.status;
    const isActive = clinicScene.sys.settings.active;

    // 检查键盘输入是否存在
    const hasKeyboard = clinicScene.input?.keyboard !== null && clinicScene.input?.keyboard !== undefined;

    // 检查是否有inventoryKey（尝试访问scene的内部属性）
    let hasInventoryKey = false;
    try {
      // 使用反射访问private属性
      hasInventoryKey = clinicScene.inventoryKey !== undefined;
    } catch (e) {
      hasInventoryKey = false;
    }

    // 检查键盘keys
    const keyboardKeys = clinicScene.input?.keyboard?.keys?.length || 0;

    return {
      sceneStatus: status,
      isActive: isActive,
      hasKeyboard: hasKeyboard,
      hasInventoryKey: hasInventoryKey,
      keyboardKeysCount: keyboardKeys,
      sceneKeys: Object.keys(clinicScene.sys.settings)
    };
  });

  console.log('Scene state:', JSON.stringify(sceneState, null, 2));

  // 检查update是否运行
  const updateRunning = await page.evaluate(() => {
    const game = (window as any).__PHASER_GAME__;
    if (!game) return false;
    const clinicScene = game.scene.getScene('ClinicScene');
    if (!clinicScene) return false;
    // 检查场景是否有update方法
    return typeof clinicScene.update === 'function';
  });
  console.log('Update method exists:', updateRunning);

  // 手动触发toggleInventory（绕过键盘）
  await page.evaluate(() => {
    const game = (window as any).__PHASER_GAME__;
    if (!game) return;
    const clinicScene = game.scene.getScene('ClinicScene');
    if (!clinicScene) return;
    // 直接调用toggleInventory
    try {
      clinicScene.toggleInventory();
      console.log('toggleInventory called successfully');
    } catch (e) {
      console.error('toggleInventory error:', e.message);
    }
  });

  await page.waitForTimeout(1000);

  // 检查是否创建了inventory-ui-root
  const inventoryRootAfter = await page.locator('#inventory-ui-root').count();
  console.log('After manual toggle: #inventory-ui-root count:', inventoryRootAfter);

  const inventoryUICount = await page.locator('.inventory-ui').count();
  console.log('After manual toggle: .inventory-ui count:', inventoryUICount);

  // 截图
  await page.screenshot({ path: 'test-results/debug/inventory-scene-debug.png' });
});