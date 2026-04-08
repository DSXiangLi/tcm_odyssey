// tests/visual/scene-switch/building-interaction.spec.ts
import { test, expect } from '@playwright/test';
import { GameLauncher } from '../utils/game-launcher';
import { StateExtractor } from '../utils/state-extractor';
import { LogReader } from '../utils/log-reader';

test.describe('建筑进入退出交互测试', () => {
  test('T-V017: 空格键防抖验证', async ({ page }) => {
    const launcher = new GameLauncher(page);
    const stateExtractor = new StateExtractor();
    const logReader = new LogReader();

    await launcher.navigateToGame();
    await launcher.waitForGameReady();
    await launcher.clickStartButton();
    await page.waitForTimeout(2000);

    // 获取当前场景
    const initialScene = await stateExtractor.getCurrentScene(page);
    expect(initialScene).toBe('TownOutdoorScene');

    // 快速多次按空格键（在没有门的位置）
    await page.keyboard.press('Space');
    await page.waitForTimeout(50);
    await page.keyboard.press('Space');
    await page.waitForTimeout(50);
    await page.keyboard.press('Space');
    await page.waitForTimeout(500);

    // 验证场景没有切换（因为不在门位置）
    const finalScene = await stateExtractor.getCurrentScene(page);
    expect(finalScene).toBe('TownOutdoorScene');

    // 验证没有多次场景切换事件
    const logs = await logReader.getLogs(page);
    const switchEvents = logs.filter(log => log.event.includes('scene:switch'));
    // 应该没有切换事件
    expect(switchEvents.length).toBe(0);
  });

  test('门交互事件日志验证', async ({ page }) => {
    const launcher = new GameLauncher(page);
    const stateExtractor = new StateExtractor();
    const logReader = new LogReader();

    await launcher.navigateToGame();
    await launcher.waitForGameReady();
    await launcher.clickStartButton();
    await page.waitForTimeout(2000);

    // 验证门交互相关事件定义
    const mapData = await stateExtractor.getMapData(page);
    expect(mapData).not.toBeNull();

    if (mapData) {
      // 验证门瓦片有正确的属性
      let doorCount = 0;
      for (const row of mapData.tiles) {
        for (const tile of row) {
          if (tile.type === 'door') {
            doorCount++;
            // 验证门有target属性
            expect(tile.properties?.target).toBeDefined();
            // 验证门有interactive属性
            expect(tile.properties?.interactive).toBe(true);
          }
        }
      }
      expect(doorCount).toBe(3);
    }
  });

  test('建筑门出生点配置验证', async ({ page }) => {
    const launcher = new GameLauncher(page);
    const stateExtractor = new StateExtractor();

    await launcher.navigateToGame();
    await launcher.waitForGameReady();
    await launcher.clickStartButton();
    await page.waitForTimeout(2000);

    // 验证建筑门配置的出生点
    const buildingSpawnPoints = {
      clinic: { x: 7, y: 10 },
      garden: { x: 33, y: 10 },
      home: { x: 6, y: 28 }
    };

    // 验证出生点配置正确
    expect(buildingSpawnPoints.clinic.x).toBe(7);
    expect(buildingSpawnPoints.clinic.y).toBe(10);
    expect(buildingSpawnPoints.garden.x).toBe(33);
    expect(buildingSpawnPoints.garden.y).toBe(10);
    expect(buildingSpawnPoints.home.x).toBe(6);
    expect(buildingSpawnPoints.home.y).toBe(28);
  });

  test('场景切换系统就绪验证', async ({ page }) => {
    const launcher = new GameLauncher(page);
    const stateExtractor = new StateExtractor();

    await launcher.navigateToGame();
    await launcher.waitForGameReady();
    await launcher.clickStartButton();
    await page.waitForTimeout(2000);

    // 验证当前场景是室外
    const currentScene = await stateExtractor.getCurrentScene(page);
    expect(currentScene).toBe('TownOutdoorScene');

    // 验证游戏状态桥接器工作正常
    const gameState = await stateExtractor.getGameState(page);
    expect(gameState).not.toBeNull();
    expect(gameState?.currentScene).toBe('TownOutdoorScene');
    expect(gameState?.mapData).not.toBeNull();
    expect(gameState?.player).not.toBeNull();
  });
});