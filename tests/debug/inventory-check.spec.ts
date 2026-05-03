// tests/debug/inventory-check.spec.ts
/**
 * 调试测试：检查背包UI挂载状态
 */

import { test, expect } from '@playwright/test';

test('调试：检查页面DOM状态', async ({ page }) => {
  await page.goto('/?scene=clinic');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  // 点击画布获取焦点
  await page.locator('canvas').click();
  await page.waitForTimeout(500);

  // 检查是否存在inventory-ui-root容器（背包挂载前不存在）
  const inventoryRoot = await page.locator('#inventory-ui-root').count();
  console.log('Before B key: #inventory-ui-root count:', inventoryRoot);

  // 检查是否有Phaser游戏实例
  const hasGame = await page.evaluate(() => {
    return typeof (window as any).__PHASER_GAME__ !== 'undefined';
  });
  console.log('Has Phaser game:', hasGame);

  // 检查ClinicScene是否存在
  const hasClinicScene = await page.evaluate(() => {
    const game = (window as any).__PHASER_GAME__;
    if (!game) return false;
    return game.scene.getScene('ClinicScene') !== null;
  });
  console.log('Has ClinicScene:', hasClinicScene);

  // 检查inventoryKey是否注册
  const hasInventoryKey = await page.evaluate(() => {
    const game = (window as any).__PHASER_GAME__;
    if (!game) return false;
    const clinicScene = game.scene.getScene('ClinicScene');
    if (!clinicScene) return false;
    return clinicScene.inventoryKey !== undefined;
  });
  console.log('Has inventoryKey:', hasInventoryKey);

  // 按B键
  await page.keyboard.press('b');
  await page.waitForTimeout(1000);

  // 再次检查inventory-ui-root
  const inventoryRootAfter = await page.locator('#inventory-ui-root').count();
  console.log('After B key: #inventory-ui-root count:', inventoryRootAfter);

  // 检查是否有inventory-ui类
  const inventoryUICount = await page.locator('.inventory-ui').count();
  console.log('After B key: .inventory-ui count:', inventoryUICount);

  // 检查body直接子元素
  const bodyChildren = await page.evaluate(() => {
    return Array.from(document.body.children).map(el => ({
      id: el.id,
      className: el.className,
      tagName: el.tagName
    }));
  });
  console.log('Body children:', JSON.stringify(bodyChildren, null, 2));

  // 截图
  await page.screenshot({ path: 'test-results/debug/inventory-debug.png' });

  // 预期：应该有inventory-ui-root
  expect(inventoryRootAfter).toBeGreaterThan(0);
});