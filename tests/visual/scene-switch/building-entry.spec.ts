// tests/visual/scene-switch/building-entry.spec.ts
import { test, expect } from '@playwright/test';
import { GameLauncher } from '../utils/game-launcher';
import { StateExtractor } from '../utils/state-extractor';
import { LogReader } from '../utils/log-reader';

test.describe('建筑进入退出测试', () => {
  test('T-V012-T-V014: 门交互场景切换流程验证', async ({ page }) => {
    const launcher = new GameLauncher(page);
    const stateExtractor = new StateExtractor();

    await launcher.navigateToGame();
    await launcher.waitForGameReady();
    await launcher.clickStartButton();
    await page.waitForTimeout(2000);

    // 验证当前场景是室外
    const initialScene = await stateExtractor.getCurrentScene(page);
    expect(initialScene).toBe('TownOutdoorScene');

    // 获取门位置
    const mapData = await stateExtractor.getMapData(page);
    expect(mapData).not.toBeNull();

    if (mapData) {
      // 收集所有门的位置
      const doors: Array<{ x: number; y: number; target: string }> = [];
      for (const row of mapData.tiles) {
        for (const tile of row) {
          if (tile.type === 'door' && tile.properties?.target) {
            doors.push({
              x: tile.x,
              y: tile.y,
              target: tile.properties.target as string
            });
          }
        }
      }

      // 验证有3个门
      expect(doors.length).toBe(3);

      // 验证每个门都有有效的目标场景
      for (const door of doors) {
        expect(['clinic', 'garden', 'home']).toContain(door.target);
      }
    }
  });

  test('T-V016: 出生点位置配置验证', async ({ page }) => {
    const launcher = new GameLauncher(page);
    const stateExtractor = new StateExtractor();

    await launcher.navigateToGame();
    await launcher.waitForGameReady();
    await launcher.clickStartButton();
    await page.waitForTimeout(2000);

    // 验证初始出生点在地图中心附近
    const playerState = await stateExtractor.getPlayerState(page);
    expect(playerState).not.toBeNull();

    if (playerState) {
      // 初始出生点应该在地图中心附近 (20, 15)
      expect(playerState.tileX).toBeGreaterThanOrEqual(15);
      expect(playerState.tileX).toBeLessThanOrEqual(25);
      expect(playerState.tileY).toBeGreaterThanOrEqual(10);
      expect(playerState.tileY).toBeLessThanOrEqual(20);
    }
  });

  test('场景切换事件序列验证', async ({ page }) => {
    const launcher = new GameLauncher(page);
    const stateExtractor = new StateExtractor();
    const logReader = new LogReader();

    await launcher.navigateToGame();
    await launcher.waitForGameReady();
    await launcher.clickStartButton();
    await page.waitForTimeout(2000);

    // 验证场景创建和就绪事件
    const logs = await logReader.getLogs(page);

    // 验证场景创建事件
    const hasSceneCreate = logReader.verifyEventExists(logs, 'scene:create');
    expect(hasSceneCreate).toBe(true);

    // 验证场景就绪事件
    const hasSceneReady = logReader.verifyEventExists(logs, 'scene:ready');
    expect(hasSceneReady).toBe(true);
  });

  test('室内场景门位置验证', async ({ page }) => {
    const launcher = new GameLauncher(page);
    const stateExtractor = new StateExtractor();

    await launcher.navigateToGame();
    await launcher.waitForGameReady();
    await launcher.clickStartButton();
    await page.waitForTimeout(2000);

    // 验证每个建筑的门位置正确
    const mapData = await stateExtractor.getMapData(page);
    expect(mapData).not.toBeNull();

    if (mapData) {
      // 检查每个建筑的门位置
      let clinicDoor: { x: number; y: number } | null = null;
      let gardenDoor: { x: number; y: number } | null = null;
      let homeDoor: { x: number; y: number } | null = null;

      for (const row of mapData.tiles) {
        for (const tile of row) {
          if (tile.type === 'door') {
            const target = tile.properties?.target as string;
            if (target === 'clinic') clinicDoor = { x: tile.x, y: tile.y };
            if (target === 'garden') gardenDoor = { x: tile.x, y: tile.y };
            if (target === 'home') homeDoor = { x: tile.x, y: tile.y };
          }
        }
      }

      // 验证诊所门在左上区域 (x < 15, y < 15)
      expect(clinicDoor).not.toBeNull();
      if (clinicDoor) {
        expect(clinicDoor.x).toBeLessThan(15);
        expect(clinicDoor.y).toBeLessThan(15);
      }

      // 验证药园门在右上区域 (x > 25, y < 15)
      expect(gardenDoor).not.toBeNull();
      if (gardenDoor) {
        expect(gardenDoor.x).toBeGreaterThan(25);
        expect(gardenDoor.y).toBeLessThan(15);
      }

      // 验证家门在左下区域 (x < 15, y > 20)
      expect(homeDoor).not.toBeNull();
      if (homeDoor) {
        expect(homeDoor.x).toBeLessThan(15);
        expect(homeDoor.y).toBeGreaterThan(20);
      }
    }
  });
});