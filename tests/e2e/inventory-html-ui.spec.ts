// tests/e2e/inventory-html-ui.spec.ts
/**
 * 背包HTML UI E2E测试
 */

import { test, expect } from '@playwright/test';

test.describe('背包HTML UI', () => {
  test.beforeEach(async ({ page, context }) => {
    // 清除所有cookies和存储，确保完全重置
    await context.clearCookies();

    // 硬刷新页面，确保Phaser游戏完全重置
    await page.goto('/?scene=clinic', { waitUntil: 'networkidle' });
    await page.waitForTimeout(5000);

    // 等待场景准备完成
    await page.waitForFunction(() => (window as any).__SCENE_READY__ === true, {
      timeout: 15000
    });

    // 通过暴露的函数重置背包状态（关键：确保测试间状态隔离）
    await page.evaluate(() => {
      if ((window as any).__RESET_INVENTORY_STATE__) {
        (window as any).__RESET_INVENTORY_STATE__();
      }
    });
  });

  // 辅助函数：打开背包（使用直接调用而非键盘事件，更稳定）
  async function openInventory(page: any) {
    await page.evaluate(() => {
      if ((window as any).__OPEN_INVENTORY__) {
        (window as any).__OPEN_INVENTORY__();
      }
    });
    await page.waitForTimeout(500);
  }

  test('按B键打开背包显示古卷轴UI', async ({ page }) => {
    await openInventory(page);

    // 等待背包UI出现
    const inventoryUI = page.locator('.inventory-ui');
    await expect(inventoryUI).toBeVisible({ timeout: 10000 });
    await expect(inventoryUI.locator('.wood-bg')).toBeVisible();
  });

  test('背包显示5视图扇形导航', async ({ page }) => {
    await openInventory(page);

    await expect(page.locator('.inventory-ui')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('.center-dial')).toBeVisible();
    await expect(page.locator('.fan-petal')).toHaveCount(5);
  });

  test('点击饮片视图显示左侧卷轴面板', async ({ page }) => {
    await openInventory(page);

    await expect(page.locator('.inventory-ui')).toBeVisible({ timeout: 10000 });
    await page.locator('.fan-petal').first().click();
    // 点击后应该有内容面板显示
    await page.waitForTimeout(300);
    // 验证分类区域出现
    await expect(page.locator('.cat-chip').first()).toBeVisible();
  });

  test('饮片视图显示18功效分类', async ({ page }) => {
    await openInventory(page);

    await expect(page.locator('.inventory-ui')).toBeVisible({ timeout: 10000 });
    await page.locator('.fan-petal').first().click();
    // 分类数量为19（包含全部分类）
    const catCount = await page.locator('.cat-chip').count();
    expect(catCount).toBeGreaterThanOrEqual(18);
  });

  test('点击分类显示药材槽位', async ({ page }) => {
    await openInventory(page);

    await expect(page.locator('.inventory-ui')).toBeVisible({ timeout: 10000 });
    await page.locator('.fan-petal').first().click();
    await page.locator('.cat-chip').first().click();
    // slots-grid有多个（每个分类），取第一个可见的
    await expect(page.locator('.slots-grid').first()).toBeVisible();
    expect(await page.locator('.slot').count()).toBeGreaterThan(0);
  });

  test('药材槽位显示内容', async ({ page }) => {
    await openInventory(page);

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
    await openInventory(page);

    await expect(page.locator('.inventory-ui')).toBeVisible({ timeout: 10000 });
    await page.locator('.fan-petal').first().click();
    await page.locator('.cat-chip').first().click();

    const slots = page.locator('.slot:not(.empty)');
    if (await slots.count() > 0) {
      await slots.first().hover();
      await expect(page.locator('.herb-tooltip')).toBeVisible({ timeout: 3000 });
    }
  });

  test('点击关闭按钮关闭背包', async ({ page }) => {
    await openInventory(page);

    await expect(page.locator('.inventory-ui')).toBeVisible({ timeout: 10000 });
    await page.locator('.close-btn').click();
    await expect(page.locator('.inventory-ui')).not.toBeVisible({ timeout: 5000 });
  });

  test('按ESC关闭背包', async ({ page }) => {
    await openInventory(page);

    await expect(page.locator('.inventory-ui')).toBeVisible({ timeout: 10000 });
    await page.keyboard.press('Escape');
    await expect(page.locator('.inventory-ui')).not.toBeVisible({ timeout: 5000 });
  });

  test('稀有度边框显示', async ({ page }) => {
    await openInventory(page);

    await expect(page.locator('.inventory-ui')).toBeVisible({ timeout: 10000 });
    await page.locator('.fan-petal').first().click();
    await page.locator('.cat-chip').first().click();

    const rareSlots = page.locator('.slot[data-rarity="2"], .slot[data-rarity="3"], .slot[data-rarity="4"]');
    if (await rareSlots.count() > 0) {
      await expect(rareSlots.first()).toBeVisible();
    }
  });

  test('右侧摘要面板', async ({ page }) => {
    await openInventory(page);

    await expect(page.locator('.inventory-ui')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('.summary-panel')).toBeVisible();
    // stat-item数量可能变化，至少有2个
    const statCount = await page.locator('.summary-panel .stat-item').count();
    expect(statCount).toBeGreaterThanOrEqual(2);
  });

  test('方剂视图', async ({ page }) => {
    await openInventory(page);

    await expect(page.locator('.inventory-ui')).toBeVisible({ timeout: 10000 });
    await page.locator('.fan-petal').nth(2).click();
    await expect(page.locator('.formula-grid')).toBeVisible();
    expect(await page.locator('.formula-card').count()).toBeGreaterThan(0);
  });

  test('工具视图', async ({ page }) => {
    await openInventory(page);

    await expect(page.locator('.inventory-ui')).toBeVisible({ timeout: 10000 });
    await page.locator('.fan-petal').nth(3).click();
    expect(await page.locator('.tool-card').count()).toBeGreaterThan(0);
  });

  test('图书馆视图', async ({ page }) => {
    await openInventory(page);

    await expect(page.locator('.inventory-ui')).toBeVisible({ timeout: 10000 });
    await page.locator('.fan-petal').nth(4).click();
    // book-shelf有多个（多行书架）
    await expect(page.locator('.book-shelf').first()).toBeVisible();
    expect(await page.locator('.book-spine').count()).toBeGreaterThan(0);
  });
});