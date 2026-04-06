// tests/visual/movement/player-movement.spec.ts
import { test, expect } from '@playwright/test';
import { GameLauncher } from '../utils/game-launcher';
import { StateExtractor } from '../utils/state-extractor';

test.describe('玩家移动测试', () => {
  test('T-V012: 玩家速度验证', async ({ page }) => {
    const launcher = new GameLauncher(page);
    const stateExtractor = new StateExtractor();

    await launcher.navigateToGame();
    await launcher.waitForGameReady();
    await launcher.clickStartButton();
    await page.waitForTimeout(2000);

    const result = await stateExtractor.verifyPlayerSpeed(page, 150);
    expect(result.passed).toBe(true);
  });

  test('T-V015: 对角线移动验证', async ({ page }) => {
    const launcher = new GameLauncher(page);
    const stateExtractor = new StateExtractor();

    await launcher.navigateToGame();
    await launcher.waitForGameReady();
    await launcher.clickStartButton();
    await page.waitForTimeout(2000);

    // 获取初始位置
    const initialState = await stateExtractor.getPlayerState(page);
    expect(initialState).not.toBeNull();

    // 开始对角线移动
    await page.keyboard.down('ArrowUp');
    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(300);

    // 验证位置变化（对角线移动应该同时改变x和y）
    const finalState = await stateExtractor.getPlayerState(page);
    expect(finalState).not.toBeNull();

    if (initialState && finalState) {
      // 验证x增加（向右移动）
      expect(finalState.x).toBeGreaterThan(initialState.x);
      // 验证y减少（向上移动）
      expect(finalState.y).toBeLessThan(initialState.y);
    }

    await page.keyboard.up('ArrowUp');
    await page.keyboard.up('ArrowRight');
  });

  test('T-V016: 停止响应', async ({ page }) => {
    const launcher = new GameLauncher(page);
    const stateExtractor = new StateExtractor();

    await launcher.navigateToGame();
    await launcher.waitForGameReady();
    await launcher.clickStartButton();
    await page.waitForTimeout(2000);

    // 开始移动
    await page.keyboard.down('ArrowDown');
    await page.waitForTimeout(100);

    // 停止移动
    await page.keyboard.up('ArrowDown');
    await page.waitForTimeout(100);

    // 验证速度归零
    const playerState = await stateExtractor.getPlayerState(page);
    expect(playerState).not.toBeNull();

    if (playerState) {
      expect(Math.abs(playerState.velocity.x)).toBeLessThan(1);
      expect(Math.abs(playerState.velocity.y)).toBeLessThan(1);
    }
  });
});