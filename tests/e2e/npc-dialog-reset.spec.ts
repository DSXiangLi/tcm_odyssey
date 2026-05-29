import { test, expect } from '@playwright/test';

/**
 * NPC对话状态重置测试
 *
 * Bug修复验证：
 * - dialogShown在对话关闭后没有重置为false
 * - 导致再次进入诊所时无法触发欢迎对话
 * - 修复：在wake事件、onClose回调、startMinigameFromTool中重置dialogShown
 */

test.describe('NPC对话状态重置', () => {

  test('NPC-DLG-RESET-01: 欢迎对话关闭后可以再次触发', async ({ page }) => {
    await page.goto('http://localhost:3004');

    // 等待游戏加载
    await page.waitForSelector('canvas', { timeout: 10000 });

    // 进入诊所（点击诊所入口）
    await page.click('#clinic-entry');
    await page.waitForTimeout(2000);

    // 验证欢迎对话自动显示（延迟1秒）
    const dialogRoot = page.locator('#dialog-ui-root');
    await expect(dialogRoot).toBeVisible({ timeout: 3000 });

    // 关闭对话
    await page.click('[data-testid="close-dialog-button"]');
    await page.waitForTimeout(500);

    // 验证对话已关闭
    await expect(dialogRoot).not.toBeVisible();

    // 返回室外（按空格键）
    await page.keyboard.press('Space');
    await page.waitForTimeout(1000);

    // 再次进入诊所
    await page.click('#clinic-entry');
    await page.waitForTimeout(2000);

    // 验证欢迎对话再次显示（修复后应该可以）
    await expect(dialogRoot).toBeVisible({ timeout: 3000 });
  });

  test('NPC-DLG-RESET-02: 按空格键触发对话后关闭可以再次触发', async ({ page }) => {
    await page.goto('http://localhost:3004');

    await page.waitForSelector('canvas', { timeout: 10000 });

    // 进入诊所
    await page.click('#clinic-entry');
    await page.waitForTimeout(2000);

    // 等待欢迎对话
    const dialogRoot = page.locator('#dialog-ui-root');
    await expect(dialogRoot).toBeVisible({ timeout: 3000 });

    // 关闭欢迎对话
    await page.click('[data-testid="close-dialog-button"]');
    await page.waitForTimeout(500);

    // 移动玩家靠近NPC（模拟移动）
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(200);

    // 按空格键触发对话
    await page.keyboard.press('Space');
    await page.waitForTimeout(1000);

    // 验证对话显示
    await expect(dialogRoot).toBeVisible({ timeout: 2000 });

    // 关闭对话
    await page.click('[data-testid="close-dialog-button"]');
    await page.waitForTimeout(500);

    // 再次按空格键
    await page.keyboard.press('Space');
    await page.waitForTimeout(1000);

    // 验证对话再次显示（修复后应该可以）
    await expect(dialogRoot).toBeVisible({ timeout: 2000 });
  });
});