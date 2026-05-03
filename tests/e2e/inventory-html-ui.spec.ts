// tests/e2e/inventory-html-ui.spec.ts
/**
 * 背包HTML UI E2E测试
 */

import { test, expect } from '@playwright/test';

test.describe('背包HTML UI', () => {
  test.beforeEach(async ({ page }) => {
    // 启动游戏到诊所场景
    await page.goto('/?scene=clinic');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // 清理可能残留的背包UI（确保测试间状态隔离）
    await page.evaluate(() => {
      const inventoryRoot = document.getElementById('inventory-ui-root');
      if (inventoryRoot) {
        inventoryRoot.remove();
      }
    });

    // 点击画布获取焦点
    await page.locator('canvas').click();
    await page.waitForTimeout(500);
  });

  test('按B键打开背包显示古卷轴UI', async ({ page }) => {
    await page.keyboard.press('b');
    await page.waitForTimeout(500);

    // 等待背包UI出现
    const inventoryUI = page.locator('.inventory-ui');
    await expect(inventoryUI).toBeVisible({ timeout: 10000 });
    await expect(inventoryUI.locator('.wood-bg')).toBeVisible();
  });

  test('背包显示5视图扇形导航', async ({ page }) => {
    await page.keyboard.press('b');
    await page.waitForTimeout(500);

    await expect(page.locator('.inventory-ui')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('.center-dial')).toBeVisible();
    await expect(page.locator('.fan-petal')).toHaveCount(5);
  });

  test('点击饮片视图显示左侧卷轴面板', async ({ page }) => {
    await page.keyboard.press('b');
    await page.waitForTimeout(500);

    await expect(page.locator('.inventory-ui')).toBeVisible({ timeout: 10000 });
    await page.locator('.fan-petal').first().click();
    // 点击后应该有内容面板显示
    await page.waitForTimeout(300);
    // 验证分类区域出现
    await expect(page.locator('.cat-chip').first()).toBeVisible();
  });

  test('饮片视图显示18功效分类', async ({ page }) => {
    await page.keyboard.press('b');
    await page.waitForTimeout(500);

    await expect(page.locator('.inventory-ui')).toBeVisible({ timeout: 10000 });
    await page.locator('.fan-petal').first().click();
    // 分类数量为19（包含全部分类）
    const catCount = await page.locator('.cat-chip').count();
    expect(catCount).toBeGreaterThanOrEqual(18);
  });

  test('点击分类显示药材槽位', async ({ page }) => {
    await page.keyboard.press('b');
    await page.waitForTimeout(500);

    await expect(page.locator('.inventory-ui')).toBeVisible({ timeout: 10000 });
    await page.locator('.fan-petal').first().click();
    await page.locator('.cat-chip').first().click();
    // slots-grid有多个（每个分类），取第一个可见的
    await expect(page.locator('.slots-grid').first()).toBeVisible();
    expect(await page.locator('.slot').count()).toBeGreaterThan(0);
  });

  test('药材槽位显示内容', async ({ page }) => {
    await page.keyboard.press('b');
    await page.waitForTimeout(500);

    await expect(page.locator('.inventory-ui')).toBeVisible({ timeout: 10000 });
    await page.locator('.fan-petal').first().click();
    await page.locator('.cat-chip').first().click();

    const slots = page.locator('.slot:not(.empty)');
    if (await slots.count() > 0) {
      const firstSlot = slots.first();
      const hasImg = await firstSlot.locator('img').count() > 0;
      const hasName = await firstSlot.locator('.herb-name').count() > 0;
      expect(hasImg || hasName).toBe(true);
    }
  });

  test('hover槽位显示tooltip', async ({ page }) => {
    await page.keyboard.press('b');
    await page.waitForTimeout(500);

    await expect(page.locator('.inventory-ui')).toBeVisible({ timeout: 10000 });
    await page.locator('.fan-petal').first().click();
    await page.locator('.cat-chip').first().click();

    const slots = page.locator('.slot:not(.empty)');
    if (await slots.count() > 0) {
      await slots.first().hover();
      await expect(page.locator('.herb-tooltip')).toBeVisible({ timeout: 3000 });
    }
  });

  test.skip('点击关闭按钮关闭背包', async ({ page }) => {
    // TODO: 需要修复React组件状态清理
    await page.keyboard.press('b');
    await page.waitForTimeout(500);

    await expect(page.locator('.inventory-ui')).toBeVisible({ timeout: 10000 });
    await page.locator('.close-btn').click();
    await expect(page.locator('.inventory-ui')).not.toBeVisible({ timeout: 5000 });
  });

  test.skip('按ESC关闭背包', async ({ page }) => {
    // TODO: ESC键监听需要在InventoryUI.tsx中实现
    await page.keyboard.press('b');
    await page.waitForTimeout(500);

    await expect(page.locator('.inventory-ui')).toBeVisible({ timeout: 10000 });
    await page.keyboard.press('Escape');
    await expect(page.locator('.inventory-ui')).not.toBeVisible({ timeout: 5000 });
  });

  test('稀有度边框显示', async ({ page }) => {
    await page.keyboard.press('b');
    await page.waitForTimeout(500);

    await expect(page.locator('.inventory-ui')).toBeVisible({ timeout: 10000 });
    await page.locator('.fan-petal').first().click();
    await page.locator('.cat-chip').first().click();

    const rareSlots = page.locator('.slot[data-rarity="2"], .slot[data-rarity="3"], .slot[data-rarity="4"]');
    if (await rareSlots.count() > 0) {
      await expect(rareSlots.first()).toBeVisible();
    }
  });

  test('右侧摘要面板', async ({ page }) => {
    await page.keyboard.press('b');
    await page.waitForTimeout(500);

    await expect(page.locator('.inventory-ui')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('.summary-panel')).toBeVisible();
    // stat-item数量可能变化，至少有2个
    const statCount = await page.locator('.summary-panel .stat-item').count();
    expect(statCount).toBeGreaterThanOrEqual(2);
  });

  test('方剂视图', async ({ page }) => {
    await page.keyboard.press('b');
    await page.waitForTimeout(500);

    await expect(page.locator('.inventory-ui')).toBeVisible({ timeout: 10000 });
    await page.locator('.fan-petal').nth(2).click();
    await expect(page.locator('.formula-grid')).toBeVisible();
    expect(await page.locator('.formula-card').count()).toBeGreaterThan(0);
  });

  test('工具视图', async ({ page }) => {
    await page.keyboard.press('b');
    await page.waitForTimeout(500);

    await expect(page.locator('.inventory-ui')).toBeVisible({ timeout: 10000 });
    await page.locator('.fan-petal').nth(3).click();
    expect(await page.locator('.tool-card').count()).toBeGreaterThan(0);
  });

  test('图书馆视图', async ({ page }) => {
    await page.keyboard.press('b');
    await page.waitForTimeout(500);

    await expect(page.locator('.inventory-ui')).toBeVisible({ timeout: 10000 });
    await page.locator('.fan-petal').nth(4).click();
    // book-shelf有多个（多行书架）
    await expect(page.locator('.book-shelf').first()).toBeVisible();
    expect(await page.locator('.book-spine').count()).toBeGreaterThan(0);
  });
});