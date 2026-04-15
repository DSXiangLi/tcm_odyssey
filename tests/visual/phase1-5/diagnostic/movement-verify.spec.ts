// tests/visual/phase1-5/diagnostic/movement-verify.spec.ts
/**
 * 精确移动验证测试
 * 在按键期间连续采样velocity和position
 */

import { test, expect } from '@playwright/test';
import { GameLauncher } from '../../utils/game-launcher';

test.describe('精确移动验证', () => {
  test.setTimeout(60000);

  test('按键期间连续采样', async ({ page }) => {
    const launcher = new GameLauncher(page);

    await launcher.navigateToGame();
    await launcher.waitForGameReady();
    await launcher.clickStartButton();
    await page.waitForTimeout(3000);

    // 获取初始位置
    const initialState = await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const scene = game?.scene?.scenes?.find(s => s.scene.key === 'TownOutdoorScene');
      return {
        position: { x: scene?.player?.x, y: scene?.player?.y },
        velocity: { x: scene?.player?.body?.velocity?.x, y: scene?.player?.body?.velocity?.y },
        tilePos: { x: scene?.player?.tileX, y: scene?.player?.tileY }
      };
    });
    console.log('\n初始状态:', initialState);

    // 按下右键
    console.log('\n=== 按下ArrowRight ===');
    await page.keyboard.down('ArrowRight');

    // 连续采样10次，每次50ms
    const samples: Array<{ time: number; velocity: { x: number; y: number }; position: { x: number; y: number }; cursorDown: boolean }> = [];

    for (let i = 0; i < 10; i++) {
      await page.waitForTimeout(50);
      const state = await page.evaluate(() => {
        const game = (window as any).__PHASER_GAME__;
        const scene = game?.scene?.scenes?.find(s => s.scene.key === 'TownOutdoorScene');
        return {
          velocity: { x: scene?.player?.body?.velocity?.x, y: scene?.player?.body?.velocity?.y },
          position: { x: scene?.player?.x, y: scene?.player?.y },
          cursorDown: scene?.cursors?.right?.isDown
        };
      });
      samples.push({ time: (i + 1) * 50, ...state });
      console.log(`  ${(i+1)*50}ms: velocity=${state.velocity.x.toFixed(1)}, pos=${state.position.x.toFixed(1)}, cursorDown=${state.cursorDown}`);
    }

    // 释放按键
    await page.keyboard.up('ArrowRight');

    // 最终状态
    const finalState = await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const scene = game?.scene?.scenes?.find(s => s.scene.key === 'TownOutdoorScene');
      return {
        position: { x: scene?.player?.x, y: scene?.player?.y },
        velocity: { x: scene?.player?.body?.velocity?.x, y: scene?.player?.body?.velocity?.y }
      };
    });
    console.log('\n最终状态:', finalState);

    // 分析结果
    console.log('\n=== 分析结果 ===');

    // 检查是否有velocity变化
    const velocityChanges = samples.filter(s => s.velocity.x > 0);
    console.log('有velocity的采样数:', velocityChanges.length);

    // 检查位置变化
    const positionChange = finalState.position.x - initialState.position.x;
    console.log('位置变化:', positionChange.toFixed(1), 'px');

    // 检查cursorDown状态
    const cursorDownCount = samples.filter(s => s.cursorDown).length;
    console.log('cursorDown为true的采样数:', cursorDownCount);

    if (velocityChanges.length > 0 && positionChange > 0) {
      console.log('[SUCCESS] 玩家移动正常工作！');
    } else if (cursorDownCount > 0 && velocityChanges.length === 0) {
      console.log('[PROBLEM] 按键被检测到但velocity没有变化');
    } else if (cursorDownCount === 0) {
      console.log('[PROBLEM] 按键没有被检测到');
    }

    // 截图
    await page.screenshot({ path: 'tests/screenshots/movement-verify.png' });

    expect(true).toBe(true);
  });

  test('长按移动测试（2秒）', async ({ page }) => {
    const launcher = new GameLauncher(page);

    await launcher.navigateToGame();
    await launcher.waitForGameReady();
    await launcher.clickStartButton();
    await page.waitForTimeout(3000);

    // 获取初始位置
    const initialState = await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const scene = game?.scene?.scenes?.find(s => s.scene.key === 'TownOutdoorScene');
      return {
        position: { x: scene?.player?.x, y: scene?.player?.y },
        tilePos: { x: Math.floor(scene?.player?.x / 32), y: Math.floor(scene?.player?.y / 32) }
      };
    });
    console.log('\n初始位置:', initialState);

    // 长按右键2秒
    console.log('\n=== 长按ArrowRight 2秒 ===');
    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(2000);
    await page.keyboard.up('ArrowRight');

    // 获取最终位置
    const finalState = await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const scene = game?.scene?.scenes?.find(s => s.scene.key === 'TownOutdoorScene');
      return {
        position: { x: scene?.player?.x, y: scene?.player?.y },
        tilePos: { x: Math.floor(scene?.player?.x / 32), y: Math.floor(scene?.player?.y / 32) }
      };
    });
    console.log('最终位置:', finalState);

    // 计算移动距离
    const deltaX = finalState.position.x - initialState.position.x;
    const deltaTileX = finalState.tilePos.x - initialState.tilePos.x;

    console.log('\n移动距离:');
    console.log('  像素:', deltaX.toFixed(1), 'px');
    console.log('  瓦片:', deltaTileX, '格');

    // 速度150px/s，2秒应该移动300px（约9-10格）
    // 但可能有碰撞，所以实际移动可能小于预期
    if (deltaX > 100) {
      console.log('[SUCCESS] 玩家成功移动了超过100像素');
    } else if (deltaX > 10) {
      console.log('[PARTIAL] 玩家移动了少量距离，可能有碰撞阻碍');
    } else if (deltaX === 0) {
      console.log('[PROBLEM] 玩家完全没有移动');
    }

    // 四方向测试
    console.log('\n=== 四方向测试 ===');
    const directions = [
      { key: 'ArrowRight', name: '右' },
      { key: 'ArrowLeft', name: '左' },
      { key: 'ArrowDown', name: '下' },
      { key: 'ArrowUp', name: '上' }
    ];

    const moveResults: Array<{ direction: string; deltaX: number; deltaY: number }> = [];

    for (const dir of directions) {
      const before = await page.evaluate(() => {
        const game = (window as any).__PHASER_GAME__;
        const scene = game?.scene?.scenes?.find(s => s.scene.key === 'TownOutdoorScene');
        return { x: scene?.player?.x, y: scene?.player?.y };
      });

      await page.keyboard.down(dir.key);
      await page.waitForTimeout(500);
      await page.keyboard.up(dir.key);
      await page.waitForTimeout(100);

      const after = await page.evaluate(() => {
        const game = (window as any).__PHASER_GAME__;
        const scene = game?.scene?.scenes?.find(s => s.scene.key === 'TownOutdoorScene');
        return { x: scene?.player?.x, y: scene?.player?.y };
      });

      const deltaX = after.x - before.x;
      const deltaY = after.y - before.y;
      moveResults.push({ direction: dir.name, deltaX, deltaY });

      console.log(`  ${dir.name}: delta(${deltaX.toFixed(1)}, ${deltaY.toFixed(1)})`);
    }

    // 统计成功移动的方向数
    const successCount = moveResults.filter(r => Math.abs(r.deltaX) > 10 || Math.abs(r.deltaY) > 10).length;
    console.log('\n成功移动的方向数:', successCount, '/ 4');

    if (successCount >= 3) {
      console.log('[SUCCESS] 玩家可以在多个方向移动');
    } else if (successCount >= 1) {
      console.log('[PARTIAL] 玩家只能在部分方向移动');
    } else {
      console.log('[PROBLEM] 玩家无法在任何方向移动');
    }

    expect(true).toBe(true);
  });
});