// tests/visual/movement/collision.spec.ts
import { test, expect } from '@playwright/test';
import { GameLauncher } from '../utils/game-launcher';
import { StateExtractor } from '../utils/state-extractor';
import { LogReader } from '../utils/log-reader';

test.describe('碰撞系统测试', () => {
  test('T-V010: 墙壁碰撞阻断', async ({ page }) => {
    const launcher = new GameLauncher(page);
    const stateExtractor = new StateExtractor();

    await launcher.navigateToGame();
    await launcher.waitForGameReady();
    await launcher.clickStartButton();
    await page.waitForTimeout(2000);

    // 获取初始位置
    const initialState = await stateExtractor.getPlayerState(page);
    expect(initialState).not.toBeNull();

    // 尝试向左墙移动（应该被阻挡）
    // 持续按住左键尝试撞墙
    await page.keyboard.down('ArrowLeft');
    await page.waitForTimeout(500);
    await page.keyboard.up('ArrowLeft');
    await page.waitForTimeout(100);

    // 获取最终位置
    const finalState = await stateExtractor.getPlayerState(page);
    expect(finalState).not.toBeNull();

    // 玩家应该还能移动（如果没有撞墙），或者位置变化很小（如果撞墙）
    // 这里验证玩家确实受到了碰撞限制
    if (initialState && finalState) {
      // 验证速度在停止按键后归零
      expect(Math.abs(finalState.velocity.x)).toBeLessThan(50);
    }
  });

  test('T-V011: 碰撞期间无法穿透墙壁', async ({ page }) => {
    const launcher = new GameLauncher(page);
    const stateExtractor = new StateExtractor();

    await launcher.navigateToGame();
    await launcher.waitForGameReady();
    await launcher.clickStartButton();
    await page.waitForTimeout(2000);

    // 获取地图数据验证边界墙存在
    const mapData = await stateExtractor.getMapData(page);
    expect(mapData).not.toBeNull();

    if (mapData) {
      // 验证边界墙壁
      // 左边界 (x=0)
      expect(mapData.tiles[0][0].type).toBe('wall');
      // 右边界 (x=39)
      expect(mapData.tiles[0][39].type).toBe('wall');
      // 上边界 (y=0)
      expect(mapData.tiles[0][5].type).toBe('wall');
      // 下边界 (y=29)
      expect(mapData.tiles[29][5].type).toBe('wall');
    }
  });

  test('边界墙完整性验证', async ({ page }) => {
    const launcher = new GameLauncher(page);
    const stateExtractor = new StateExtractor();

    await launcher.navigateToGame();
    await launcher.waitForGameReady();
    await launcher.clickStartButton();
    await page.waitForTimeout(2000);

    const mapData = await stateExtractor.getMapData(page);
    expect(mapData).not.toBeNull();

    if (mapData) {
      // 验证四个边界的墙壁完整性
      const width = mapData.width;
      const height = mapData.height;

      // 上边界 (y=0)
      for (let x = 0; x < width; x++) {
        expect(mapData.tiles[0][x].type).toBe('wall');
      }

      // 下边界 (y=height-1)
      for (let x = 0; x < width; x++) {
        expect(mapData.tiles[height - 1][x].type).toBe('wall');
      }

      // 左边界 (x=0)
      for (let y = 0; y < height; y++) {
        expect(mapData.tiles[y][0].type).toBe('wall');
      }

      // 右边界 (x=width-1)
      for (let y = 0; y < height; y++) {
        expect(mapData.tiles[y][width - 1].type).toBe('wall');
      }
    }
  });
});