// tests/visual/scene-switch/scene-transition.spec.ts
import { test, expect } from '@playwright/test';
import { GameLauncher } from '../utils/game-launcher';
import { StateExtractor } from '../utils/state-extractor';
import { LogReader } from '../utils/log-reader';

test.describe('场景切换完整测试', () => {
  test('T-V002: 十字路径布局验证', async ({ page }) => {
    const launcher = new GameLauncher(page);
    const stateExtractor = new StateExtractor();

    await launcher.navigateToGame();
    await launcher.waitForGameReady();
    await launcher.clickStartButton();
    await page.waitForTimeout(2000);

    const mapData = await stateExtractor.getMapData(page);
    expect(mapData).not.toBeNull();

    if (mapData) {
      const centerX = Math.floor(mapData.width / 2);
      const centerY = Math.floor(mapData.height / 2);

      // 验证中心路径瓦片
      expect(mapData.tiles[centerY][centerX].type).toBe('path');

      // 验证横向路径存在
      for (let x = 5; x < mapData.width - 5; x++) {
        expect(mapData.tiles[centerY][x].type).toBe('path');
      }

      // 验证纵向路径存在
      for (let y = 5; y < mapData.height - 5; y++) {
        expect(mapData.tiles[y][centerX].type).toBe('path');
      }
    }
  });

  test('T-V004: 药园门位置验证', async ({ page }) => {
    const launcher = new GameLauncher(page);
    const stateExtractor = new StateExtractor();

    await launcher.navigateToGame();
    await launcher.waitForGameReady();
    await launcher.clickStartButton();
    await page.waitForTimeout(2000);

    const mapData = await stateExtractor.getMapData(page);
    expect(mapData).not.toBeNull();

    if (mapData) {
      // 找到药园的门
      let gardenDoorFound = false;
      for (const row of mapData.tiles) {
        for (const tile of row) {
          if (tile.type === 'door' && tile.properties?.target === 'garden') {
            gardenDoorFound = true;
            // 验证门位置在右上区域
            expect(tile.x).toBeGreaterThan(20);
            expect(tile.y).toBeLessThan(15);
          }
        }
      }
      expect(gardenDoorFound).toBe(true);
    }
  });

  test('T-V005: 家门位置验证', async ({ page }) => {
    const launcher = new GameLauncher(page);
    const stateExtractor = new StateExtractor();

    await launcher.navigateToGame();
    await launcher.waitForGameReady();
    await launcher.clickStartButton();
    await page.waitForTimeout(2000);

    const mapData = await stateExtractor.getMapData(page);
    expect(mapData).not.toBeNull();

    if (mapData) {
      // 找到家门
      let homeDoorFound = false;
      for (const row of mapData.tiles) {
        for (const tile of row) {
          if (tile.type === 'door' && tile.properties?.target === 'home') {
            homeDoorFound = true;
            // 验证门位置在左下区域
            expect(tile.x).toBeLessThan(15);
            expect(tile.y).toBeGreaterThan(15);
          }
        }
      }
      expect(homeDoorFound).toBe(true);
    }
  });

  test('诊所门位置精确验证', async ({ page }) => {
    const launcher = new GameLauncher(page);
    const stateExtractor = new StateExtractor();

    await launcher.navigateToGame();
    await launcher.waitForGameReady();
    await launcher.clickStartButton();
    await page.waitForTimeout(2000);

    const mapData = await stateExtractor.getMapData(page);
    expect(mapData).not.toBeNull();

    if (mapData) {
      // 找到诊所门并验证精确位置
      let clinicDoorFound = false;
      for (const row of mapData.tiles) {
        for (const tile of row) {
          if (tile.type === 'door' && tile.properties?.target === 'clinic') {
            clinicDoorFound = true;
            // 验证门位置在左上区域
            expect(tile.x).toBeLessThan(15);
            expect(tile.y).toBeLessThan(15);
          }
        }
      }
      expect(clinicDoorFound).toBe(true);
    }
  });

  test('T-V009: 对角线速度标准化验证', async ({ page }) => {
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
    await page.waitForTimeout(100);

    // 获取移动中的速度
    const movingState = await stateExtractor.getPlayerState(page);
    expect(movingState).not.toBeNull();

    if (movingState) {
      // 对角线移动时，速度应该标准化
      const speedMagnitude = Math.sqrt(
        movingState.velocity.x ** 2 + movingState.velocity.y ** 2
      );

      // 速度应该在150左右（标准化后）
      // 允许一定的误差范围
      expect(speedMagnitude).toBeGreaterThan(100);
      expect(speedMagnitude).toBeLessThan(200);
    }

    await page.keyboard.up('ArrowUp');
    await page.keyboard.up('ArrowRight');
  });
});