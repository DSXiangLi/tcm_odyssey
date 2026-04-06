// tests/visual/scene-switch/door-interaction.spec.ts
import { test, expect } from '@playwright/test';
import { GameLauncher } from '../utils/game-launcher';
import { StateExtractor } from '../utils/state-extractor';
import { LogReader } from '../utils/log-reader';

test.describe('场景切换测试', () => {
  test('场景切换日志验证', async ({ page }) => {
    const launcher = new GameLauncher(page);
    const stateExtractor = new StateExtractor();
    const logReader = new LogReader();

    await launcher.navigateToGame();
    await launcher.waitForGameReady();
    await launcher.clickStartButton();
    await page.waitForTimeout(2000);

    // 验证当前场景
    const currentScene = await stateExtractor.getCurrentScene(page);
    expect(currentScene).toBe('TownOutdoorScene');

    // 获取日志
    const logs = await logReader.getLogs(page);

    // 验证场景创建事件存在
    const hasSceneCreate = logReader.verifyEventExists(logs, 'scene:create');
    expect(hasSceneCreate).toBe(true);

    // 验证场景就绪事件存在
    const hasSceneReady = logReader.verifyEventExists(logs, 'scene:ready');
    expect(hasSceneReady).toBe(true);
  });

  test('门位置数据验证', async ({ page }) => {
    const launcher = new GameLauncher(page);
    const stateExtractor = new StateExtractor();

    await launcher.navigateToGame();
    await launcher.waitForGameReady();
    await launcher.clickStartButton();
    await page.waitForTimeout(2000);

    // 获取地图数据
    const mapData = await stateExtractor.getMapData(page);
    expect(mapData).not.toBeNull();

    // 收集门位置
    const doorPositions: Array<{ x: number; y: number; target?: string }> = [];
    if (mapData) {
      for (const row of mapData.tiles) {
        for (const tile of row) {
          if (tile.type === 'door') {
            doorPositions.push({
              x: tile.x,
              y: tile.y,
              target: tile.properties?.target as string | undefined
            });
          }
        }
      }
    }

    // 验证有3个门
    expect(doorPositions.length).toBe(3);

    // 验证每个门都有target属性
    for (const door of doorPositions) {
      expect(door.target).toBeDefined();
    }
  });
});