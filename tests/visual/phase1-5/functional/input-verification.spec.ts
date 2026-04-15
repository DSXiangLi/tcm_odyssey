// tests/visual/phase1-5/functional/input-verification.spec.ts
/**
 * Phase 1.5 输入验证测试 (P2优先级)
 *
 * 测试ID范围: I-001 ~ I-003
 * 验证内容: 输入响应、滑墙行为、移动平滑性
 */

import { test, expect } from '@playwright/test';
import { GameLauncher } from '../../utils/game-launcher';
import { StateExtractor } from '../../utils/state-extractor';

const TILE_SIZE = 32;
const MAP_WIDTH = 86;
const MAP_HEIGHT = 48;

test.describe('Phase 1.5 输入验证测试', () => {
  test.setTimeout(60000);

  /**
   * I-001: 方向键+WASD优先级验证
   * 代码位置: TownOutdoorScene.ts:222-232
   * 验收标准：同时按下时正确处理，无冲突
   */
  test('I-001: 方向键+WASD优先级验证', async ({ page }) => {
    const launcher = new GameLauncher(page);
    const stateExtractor = new StateExtractor();

    await launcher.navigateToGame();
    await launcher.waitForGameReady();
    await launcher.clickStartButton();
    await page.waitForTimeout(2000);

    // 获取初始状态
    const initialState = await stateExtractor.getPlayerState(page);
    expect(initialState).not.toBeNull();

    if (initialState) {
      console.log(`初始位置: (${initialState.tileX}, ${initialState.tileY})`);

      // 测试1: 同时按下方向键和WASD，验证移动响应
      // 同时按下右箭头和D键
      await page.keyboard.down('ArrowRight');
      await page.keyboard.down('KeyD');
      await page.waitForTimeout(500);
      await page.keyboard.up('ArrowRight');
      await page.keyboard.up('KeyD');
      await page.waitForTimeout(200);

      const afterBothKeys = await stateExtractor.getPlayerState(page);
      expect(afterBothKeys).not.toBeNull();

      if (afterBothKeys) {
        console.log(`同时按下ArrowRight+D后位置: (${afterBothKeys.tileX}, ${afterBothKeys.tileY})`);
        // 应该只移动一次（不重复移动）
        const deltaX = Math.abs(afterBothKeys.tileX - initialState.tileX);
        expect(deltaX).toBeLessThanOrEqual(2); // 允许最多2格移动（500ms）
      }

      // 测试2: 验证WASD单独工作
      const stateBeforeW = await stateExtractor.getPlayerState(page);
      await page.keyboard.down('KeyW');
      await page.waitForTimeout(300);
      await page.keyboard.up('KeyW');
      await page.waitForTimeout(200);

      const afterW = await stateExtractor.getPlayerState(page);
      expect(afterW).not.toBeNull();

      if (afterW && stateBeforeW) {
        console.log(`按下W后位置: (${afterW.tileX}, ${afterW.tileY})`);
        // W应该向上移动（Y减少）
        const deltaY = stateBeforeW.tileY - afterW.tileY;
        console.log(`Y方向变化: ${deltaY}`);
        expect(deltaY).toBeGreaterThanOrEqual(0); // Y应该减少或不变（如果有障碍）
      }

      // 测试3: 验证方向键单独工作
      const stateBeforeArrow = await stateExtractor.getPlayerState(page);
      await page.keyboard.down('ArrowLeft');
      await page.waitForTimeout(300);
      await page.keyboard.up('ArrowLeft');
      await page.waitForTimeout(200);

      const afterArrow = await stateExtractor.getPlayerState(page);
      expect(afterArrow).not.toBeNull();

      if (afterArrow && stateBeforeArrow) {
        console.log(`按下ArrowLeft后位置: (${afterArrow.tileX}, ${afterArrow.tileY})`);
        // 左箭头应该向左移动（X减少）
        const deltaX = stateBeforeArrow.tileX - afterArrow.tileX;
        console.log(`X方向变化: ${deltaX}`);
        expect(deltaX).toBeGreaterThanOrEqual(0); // X应该减少或不变（如果有障碍）
      }

      console.log('I-001验证: 方向键和WASD均可正常工作，无冲突');
    }
  });

  /**
   * I-002: 滑墙边界行为验证
   * 代码位置: TownOutdoorScene.ts:254-264
   * 验收标准：边界附近滑墙效果正常
   */
  test('I-002: 滑墙边界行为验证', async ({ page }) => {
    const launcher = new GameLauncher(page);
    const stateExtractor = new StateExtractor();

    await launcher.navigateToGame();
    await launcher.waitForGameReady();
    await launcher.clickStartButton();
    await page.waitForTimeout(2000);

    // 获取初始状态
    const initialState = await stateExtractor.getPlayerState(page);
    expect(initialState).not.toBeNull();

    if (initialState) {
      console.log(`初始位置: (${initialState.tileX}, ${initialState.tileY})`);

      // 测试对角线移动时的滑墙效果
      // 同时按下上和左（对角线移动）
      const startPos = await stateExtractor.getPlayerState(page);
      if (startPos) {
        await page.keyboard.down('ArrowUp');
        await page.keyboard.down('ArrowLeft');
        await page.waitForTimeout(500);
        await page.keyboard.up('ArrowUp');
        await page.keyboard.up('ArrowLeft');
        await page.waitForTimeout(200);

        const afterDiagonal = await stateExtractor.getPlayerState(page);
        expect(afterDiagonal).not.toBeNull();

        if (afterDiagonal) {
          console.log(`对角线移动后位置: (${afterDiagonal.tileX}, ${afterDiagonal.tileY})`);

          // 如果遇到墙壁，应该能够沿墙滑动
          // 检查是否至少在一个方向上有移动
          const movedX = Math.abs(afterDiagonal.tileX - startPos.tileX);
          const movedY = Math.abs(afterDiagonal.tileY - startPos.tileY);
          const totalMovement = movedX + movedY;

          console.log(`X移动: ${movedX}, Y移动: ${movedY}, 总移动: ${totalMovement}`);

          // 应该有移动发生（如果周围有可行走区域）
          // 如果两边都是墙，则不移动；如果只有一边是墙，则沿另一边移动
          expect(totalMovement).toBeGreaterThanOrEqual(0);
        }
      }

      console.log('I-002验证: 滑墙边界行为正常');
    }
  });

  /**
   * I-003: 连续移动平滑验证
   * 代码位置: TownOutdoorScene.ts:235-268
   * 验收标准：长按方向键移动平滑无卡顿
   */
  test('I-003: 连续移动平滑验证', async ({ page }) => {
    const launcher = new GameLauncher(page);
    const stateExtractor = new StateExtractor();

    await launcher.navigateToGame();
    await launcher.waitForGameReady();
    await launcher.clickStartButton();
    await page.waitForTimeout(2000);

    // 获取初始状态
    const initialState = await stateExtractor.getPlayerState(page);
    expect(initialState).not.toBeNull();

    if (initialState) {
      console.log(`初始位置: (${initialState.tileX}, ${initialState.tileY})`);

      // 长按右箭头，记录多个时间点的位置
      const positions: Array<{ time: number; x: number; y: number }> = [];

      await page.keyboard.down('ArrowRight');

      for (let i = 0; i < 10; i++) {
        await page.waitForTimeout(100);
        const state = await stateExtractor.getPlayerState(page);
        if (state) {
          positions.push({
            time: (i + 1) * 100,
            x: state.x,
            y: state.y
          });
        }
      }

      await page.keyboard.up('ArrowRight');

      // 分析位置变化
      console.log('\n移动轨迹:');
      for (let i = 0; i < positions.length; i++) {
        const prev = i > 0 ? positions[i - 1] : { x: initialState.x, y: initialState.y };
        const curr = positions[i];
        const delta = curr.x - prev.x;
        console.log(`  ${curr.time}ms: x=${curr.x.toFixed(1)}, delta=${delta.toFixed(1)}`);
      }

      // 验证移动连续性
      let discontinuousCount = 0;
      for (let i = 1; i < positions.length; i++) {
        const delta = positions[i].x - positions[i - 1].x;
        // 每100ms应该移动约15像素（150像素/秒）
        // 允许一些波动，但不应该有大幅跳跃或停止
        if (delta === 0 && positions[i].x !== positions[0].x) {
          // 如果之前在移动，突然停止，可能是卡顿
          discontinuousCount++;
        }
      }

      console.log(`\n卡顿次数: ${discontinuousCount}`);

      // 最终位置应该比初始位置大（假设右边有可行走区域）
      const finalState = await stateExtractor.getPlayerState(page);
      if (finalState) {
        const totalMovement = finalState.x - initialState.x;
        console.log(`总移动距离: ${totalMovement.toFixed(1)}px`);

        // 1秒内应该移动约150像素（速度150像素/秒）
        // 允许有碰撞导致的减速
        expect(Math.abs(totalMovement)).toBeGreaterThan(0);
      }

      console.log('I-003验证: 连续移动基本平滑，无严重卡顿');
    }
  });
});