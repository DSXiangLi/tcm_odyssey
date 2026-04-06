// tests/visual/layout/map-layout.spec.ts
import { test, expect } from '@playwright/test';
import { GameLauncher } from '../utils/game-launcher';
import { StateExtractor } from '../utils/state-extractor';
import { LogReader } from '../utils/log-reader';

test.describe('地图布局测试', () => {
  test('T-V001: 地图尺寸40x30', async ({ page }) => {
    const launcher = new GameLauncher(page);
    const stateExtractor = new StateExtractor();

    await launcher.navigateToGame();
    await launcher.waitForGameReady();
    await launcher.clickStartButton();
    await page.waitForTimeout(3000); // 等待场景完全加载

    // 验证当前场景是TownOutdoorScene
    const currentScene = await stateExtractor.getCurrentScene(page);
    expect(currentScene).toBe('TownOutdoorScene');

    // 验证地图尺寸
    const result = await stateExtractor.verifyMapSize(page, 40, 30);
    expect(result.passed).toBe(true);
  });

  test('T-V003: 建筑占位数量3', async ({ page }) => {
    const launcher = new GameLauncher(page);
    const stateExtractor = new StateExtractor();

    await launcher.navigateToGame();
    await launcher.waitForGameReady();
    await launcher.clickStartButton();
    await page.waitForTimeout(2000);

    // 获取地图数据
    const mapData = await stateExtractor.getMapData(page);
    expect(mapData).not.toBeNull();

    // 统计门数量（每个建筑一个门）
    let doorCount = 0;
    if (mapData) {
      for (const row of mapData.tiles) {
        for (const tile of row) {
          if (tile.type === 'door') {
            doorCount++;
          }
        }
      }
    }

    expect(doorCount).toBe(3);
  });

  test('场景创建事件日志验证', async ({ page }) => {
    const launcher = new GameLauncher(page);
    const logReader = new LogReader();

    await launcher.navigateToGame();
    await launcher.waitForGameReady();
    await launcher.clickStartButton();
    await page.waitForTimeout(2000);

    // 获取日志
    const logs = await logReader.getLogs(page);

    // 验证场景创建事件存在
    const hasSceneCreate = logReader.verifyEventExists(logs, 'scene:create');
    expect(hasSceneCreate).toBe(true);
  });
});