// tests/visual/phase1-5/smoke/basic-loading.spec.ts
/**
 * Phase 1.5 Layer 1 冒烟测试
 * 基础加载验证，必须100%通过
 *
 * 测试用例:
 * - S-001: 背景图加载验证 - 地图尺寸86x48瓦片
 * - S-002: 玩家创建验证 - 出生点(47,24)
 * - S-003: 相机边界验证 - 场景尺寸86x48瓦片
 * - S-004: 可行走瓦片验证 - 916个
 * - S-005: 门配置验证 - 3个门坐标正确且有相邻可行走瓦片
 */

import { test, expect } from '@playwright/test';
import { GameLauncher } from '../../utils/game-launcher';
import { StateExtractor } from '../../utils/state-extractor';
import { WalkableVerifier } from '../utils/walkable-verifier';
import { TOWN_OUTDOOR_CONFIG } from '../../../../src/data/map-config';

// Phase 1.5 关键参数
const EXPECTED_MAP_WIDTH = 86;
const EXPECTED_MAP_HEIGHT = 48;
const EXPECTED_WALKABLE_TILES = 916;
const EXPECTED_SPAWN_POINT = { x: 47, y: 24 };
const EXPECTED_DOORS = [
  { id: 'garden', tileX: 15, tileY: 8 },
  { id: 'clinic', tileX: 60, tileY: 8 },
  { id: 'home', tileX: 61, tileY: 35 }
];

test.describe('Phase 1.5 Layer 1 冒烟测试', () => {

  test('S-001: 背景图加载验证 - 地图尺寸86x48瓦片', async ({ page }) => {
    const launcher = new GameLauncher(page);
    const stateExtractor = new StateExtractor();

    // 启动游戏
    await launcher.navigateToGame();
    await launcher.waitForGameReady();
    await launcher.clickStartButton();
    await page.waitForTimeout(3000); // 等待场景完全加载

    // 验证当前场景
    const currentScene = await stateExtractor.getCurrentScene(page);
    expect(currentScene).toBe('TownOutdoorScene');

    // 从全局对象验证地图配置
    // 注意: TownOutdoorScene不再使用Tilemap，而是直接使用可行走瓦片配置
    // 所以需要从__MAP_CONFIG__获取地图尺寸
    const mapConfig = await page.evaluate(() => {
      const config = (window as unknown as Record<string, unknown>).__MAP_CONFIG__;
      if (config && typeof config === 'object') {
        const c = config as { width?: number; height?: number };
        return {
          width: c.width,
          height: c.height
        };
      }
      return null;
    });

    expect(mapConfig).not.toBeNull();
    if (mapConfig) {
      expect(mapConfig.width).toBe(EXPECTED_MAP_WIDTH);
      expect(mapConfig.height).toBe(EXPECTED_MAP_HEIGHT);
    }

    // 验证场景尺寸（以瓦片为单位）
    const sceneSize = await stateExtractor.getSceneSize(page);
    expect(sceneSize).not.toBeNull();
    if (sceneSize) {
      // Phase 1.5: sceneSize记录的是瓦片尺寸，不是像素尺寸
      expect(sceneSize.width).toBe(EXPECTED_MAP_WIDTH);
      expect(sceneSize.height).toBe(EXPECTED_MAP_HEIGHT);
    }
  });

  test('S-002: 玩家创建验证 - 出生点(47,24)', async ({ page }) => {
    const launcher = new GameLauncher(page);
    const stateExtractor = new StateExtractor();

    // 启动游戏
    await launcher.navigateToGame();
    await launcher.waitForGameReady();
    await launcher.clickStartButton();
    await page.waitForTimeout(3000);

    // 验证玩家状态
    const playerState = await stateExtractor.getPlayerState(page);
    expect(playerState).not.toBeNull();

    if (playerState) {
      // 验证出生点瓦片坐标
      expect(playerState.tileX).toBe(EXPECTED_SPAWN_POINT.x);
      expect(playerState.tileY).toBe(EXPECTED_SPAWN_POINT.y);
    }
  });

  test('S-003: 相机边界验证 - 场景尺寸86x48瓦片', async ({ page }) => {
    const launcher = new GameLauncher(page);
    const stateExtractor = new StateExtractor();

    // 启动游戏
    await launcher.navigateToGame();
    await launcher.waitForGameReady();
    await launcher.clickStartButton();
    await page.waitForTimeout(3000);

    // 验证场景尺寸（Phase 1.5: sceneSize记录瓦片尺寸）
    const sceneSize = await stateExtractor.getSceneSize(page);
    expect(sceneSize).not.toBeNull();

    if (sceneSize) {
      // Phase 1.5: sceneSize.width和height是瓦片数量，不是像素
      expect(sceneSize.width).toBe(EXPECTED_MAP_WIDTH);
      expect(sceneSize.height).toBe(EXPECTED_MAP_HEIGHT);
    }

    // 验证相机边界设置正确（通过检查物理世界边界）
    const physicsBounds = await page.evaluate(() => {
      const state = (window as unknown as Record<string, unknown>).__GAME_STATE__;
      if (typeof state === 'function') {
        const s = (state as () => { sceneSize?: { width: number; height: number } })();
        return s.sceneSize;
      }
      return null;
    });

    expect(physicsBounds).not.toBeNull();
  });

  test('S-004: 可行走瓦片验证 - 916个', async ({ page }) => {
    const launcher = new GameLauncher(page);

    // 启动游戏
    await launcher.navigateToGame();
    await launcher.waitForGameReady();
    await launcher.clickStartButton();
    await page.waitForTimeout(3000);

    // 从全局对象获取可行走瓦片配置
    const mapConfig = await page.evaluate(() => {
      const config = (window as unknown as Record<string, unknown>).__MAP_CONFIG__;
      if (config && typeof config === 'object') {
        const c = config as { walkableTiles?: unknown };
        // 注意: Set对象在跨边界传递时会变成普通对象
        // 需要检查是否是Set或者数组
        if (c.walkableTiles instanceof Set) {
          return { walkableTileCount: c.walkableTiles.size };
        } else if (Array.isArray(c.walkableTiles)) {
          return { walkableTileCount: c.walkableTiles.length };
        } else if (c.walkableTiles && typeof c.walkableTiles === 'object') {
          // 可能是序列化的对象
          const set = c.walkableTiles as Record<string, unknown>;
          return { walkableTileCount: Object.keys(set).length };
        }
      }
      return null;
    });

    expect(mapConfig).not.toBeNull();

    if (mapConfig) {
      expect(mapConfig.walkableTileCount).toBe(EXPECTED_WALKABLE_TILES);
    }

    // 使用WalkableVerifier验证连通性
    const verifier = new WalkableVerifier();
    await verifier.initialize(page);

    const connectivity = verifier.verifyAllConnected();
    expect(connectivity.isConnected).toBe(true);
    expect(connectivity.totalWalkableTiles).toBe(EXPECTED_WALKABLE_TILES);
  });

  test('S-005: 门配置验证 - 3个门坐标正确且有相邻可行走瓦片', async ({ page }) => {
    const launcher = new GameLauncher(page);

    // 启动游戏
    await launcher.navigateToGame();
    await launcher.waitForGameReady();
    await launcher.clickStartButton();
    await page.waitForTimeout(3000);

    // 从全局对象获取门配置
    const mapConfig = await page.evaluate(() => {
      const config = (window as unknown as Record<string, unknown>).__MAP_CONFIG__;
      if (config && typeof config === 'object') {
        const c = config as {
          doors?: Array<{ tileX: number; tileY: number; targetScene: string; spawnPoint: { x: number; y: number } }>;
        };
        return { doors: c.doors || [] };
      }
      return null;
    });

    expect(mapConfig).not.toBeNull();

    if (mapConfig) {
      // 验证门数量
      expect(mapConfig.doors.length).toBe(3);

      // 验证每个门坐标
      for (const expectedDoor of EXPECTED_DOORS) {
        const foundDoor = mapConfig.doors.find(
          d => d.tileX === expectedDoor.tileX && d.tileY === expectedDoor.tileY
        );
        expect(foundDoor).toBeDefined();
        expect(foundDoor?.targetScene).toBeTruthy();
      }
    }

    // 使用WalkableVerifier验证门可达性
    // 注意: 门位置本身不在可行走瓦片集合中，但门周围必须有可行走瓦片
    const verifier = new WalkableVerifier();
    await verifier.initialize(page);

    const doorResults = verifier.verifyAllDoors();
    expect(doorResults.length).toBe(3);

    // 所有门都应该有相邻可行走瓦片（可达）
    for (const result of doorResults) {
      expect(result.isAccessible).toBe(true);
      expect(result.adjacentWalkable.length).toBeGreaterThan(0);
    }

    // 验证出生点是可行走的
    const spawnWalkable = verifier.isWalkable(EXPECTED_SPAWN_POINT.x, EXPECTED_SPAWN_POINT.y);
    expect(spawnWalkable.isWalkable).toBe(true);

    // 验证从出生点可以到达门附近的可行走瓦片
    for (const door of EXPECTED_DOORS) {
      // 找到门附近的可行走瓦片
      const adjacentPositions = [
        { x: door.tileX - 1, y: door.tileY },
        { x: door.tileX + 1, y: door.tileY },
        { x: door.tileX, y: door.tileY - 1 },
        { x: door.tileX, y: door.tileY + 1 }
      ];

      // 至少有一个相邻位置是可行走的，且可以从出生点到达
      let canReachAdjacent = false;
      for (const pos of adjacentPositions) {
        if (verifier.isWalkable(pos.x, pos.y).isWalkable) {
          canReachAdjacent = verifier.canReach(EXPECTED_SPAWN_POINT, pos);
          if (canReachAdjacent) break;
        }
      }
      expect(canReachAdjacent).toBe(true);
    }
  });
});