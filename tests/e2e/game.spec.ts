// tests/e2e/game.spec.ts
import { test, expect } from '@playwright/test';

test.describe('药灵山谷 E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#game-container canvas', { timeout: 10000 });
  });

  test('游戏加载并显示标题画面', async ({ page }) => {
    // 等待游戏加载
    await page.waitForTimeout(1000);

    // 验证Canvas可见
    const canvas = page.locator('#game-container canvas');
    await expect(canvas).toBeVisible();

    // 验证游戏容器存在
    const gameContainer = page.locator('#game-container');
    await expect(gameContainer).toBeVisible();
  });

  test('点击开始按钮进入游戏', async ({ page }) => {
    // 等待标题画面加载
    await page.waitForTimeout(1500);

    // 点击屏幕中央（开始按钮位置）
    await page.click('#game-container canvas', {
      position: { x: 400, y: 350 }
    });

    // 等待场景切换
    await page.waitForTimeout(2000);

    // 验证仍然在游戏页面
    await expect(page.locator('#game-container canvas')).toBeVisible();
  });

  test('游戏Canvas尺寸正确', async ({ page }) => {
    const canvas = page.locator('#game-container canvas');

    // 获取Canvas边界框
    const boundingBox = await canvas.boundingBox();

    // 验证Canvas存在
    expect(boundingBox).not.toBeNull();

    // 游戏设计为800x600，但Canvas可能会缩放
    // 验证Canvas有合理的尺寸
    if (boundingBox) {
      expect(boundingBox.width).toBeGreaterThan(0);
      expect(boundingBox.height).toBeGreaterThan(0);
    }
  });

  test('键盘输入响应', async ({ page }) => {
    // 等待游戏加载
    await page.waitForTimeout(1000);

    // 点击开始
    await page.click('#game-container canvas', {
      position: { x: 400, y: 350 }
    });

    await page.waitForTimeout(2000);

    // 测试方向键
    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(100);
    await page.keyboard.up('ArrowRight');

    // 测试WASD
    await page.keyboard.down('KeyW');
    await page.waitForTimeout(100);
    await page.keyboard.up('KeyW');

    // 验证游戏仍在运行
    await expect(page.locator('#game-container canvas')).toBeVisible();
  });

  test('空格键交互', async ({ page }) => {
    // 等待游戏加载
    await page.waitForTimeout(1000);

    // 点击开始
    await page.click('#game-container canvas', {
      position: { x: 400, y: 350 }
    });

    await page.waitForTimeout(2000);

    // 测试空格键
    await page.keyboard.down('Space');
    await page.waitForTimeout(100);
    await page.keyboard.up('Space');

    // 验证游戏仍在运行
    await expect(page.locator('#game-container canvas')).toBeVisible();
  });
});

test.describe('游戏功能测试', () => {
  test('游戏页面标题正确', async ({ page }) => {
    await page.goto('/');

    // 验证页面标题
    await expect(page).toHaveTitle('药灵山谷');
  });

  test('页面加载无JavaScript错误', async ({ page }) => {
    const errors: string[] = [];

    page.on('pageerror', error => {
      errors.push(error.message);
    });

    await page.goto('/');
    await page.waitForTimeout(2000);

    // 检查是否有JavaScript错误
    expect(errors).toHaveLength(0);
  });

  test('游戏容器样式正确', async ({ page }) => {
    await page.goto('/');

    const container = page.locator('#game-container');

    // 验证容器存在
    await expect(container).toBeVisible();

    // 验证边框样式
    const border = await container.evaluate(el =>
      window.getComputedStyle(el).border
    );

    expect(border).toContain('solid');
  });
});