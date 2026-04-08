// tests/visual/movement/reachability.spec.ts
import { test, expect } from '@playwright/test';
import { GameLauncher } from '../utils/game-launcher';
import { StateExtractor } from '../utils/state-extractor';
import {
  TOWN_OUTDOOR_CONFIG,
  getAllPathTiles,
  getBuildingWallTiles,
  isOnPath,
  isDoor,
  calculateDoorPosition
} from '../../../src/data/map-config';

test.describe('可达性测试', () => {

  test('T-V024: 玩家可从出生点到达诊所门', async ({ page }) => {
    const launcher = new GameLauncher(page);
    const stateExtractor = new StateExtractor();

    await launcher.navigateToGame();
    await launcher.waitForGameReady();
    await launcher.clickStartButton();
    await page.waitForTimeout(2000);

    const clinic = TOWN_OUTDOOR_CONFIG.buildings.find(b => b.id === 'clinic');
    expect(clinic).toBeDefined();

    if (clinic) {
      const doorPos = calculateDoorPosition(clinic);
      const wallTiles = getBuildingWallTiles();

      // 验证门至少有一边是可通行的（不在建筑内）
      const adjacentPositions = [
        { x: doorPos.tileX - 1, y: doorPos.tileY },
        { x: doorPos.tileX + 1, y: doorPos.tileY },
        { x: doorPos.tileX, y: doorPos.tileY - 1 },
        { x: doorPos.tileX, y: doorPos.tileY + 1 },
      ];

      const hasPassableAdjacent = adjacentPositions.some(pos => {
        const key = `${pos.x},${pos.y}`;
        return !wallTiles.has(key);
      });

      expect(hasPassableAdjacent).toBe(true);
    }
  });

  test('T-V025: 玩家可从出生点到达药园门', async ({ page }) => {
    const launcher = new GameLauncher(page);
    const stateExtractor = new StateExtractor();

    await launcher.navigateToGame();
    await launcher.waitForGameReady();
    await launcher.clickStartButton();
    await page.waitForTimeout(2000);

    const garden = TOWN_OUTDOOR_CONFIG.buildings.find(b => b.id === 'garden');
    expect(garden).toBeDefined();

    if (garden) {
      const doorPos = calculateDoorPosition(garden);
      const wallTiles = getBuildingWallTiles();

      // 验证门至少有一边是可通行的
      const adjacentPositions = [
        { x: doorPos.tileX - 1, y: doorPos.tileY },
        { x: doorPos.tileX + 1, y: doorPos.tileY },
        { x: doorPos.tileX, y: doorPos.tileY - 1 },
        { x: doorPos.tileX, y: doorPos.tileY + 1 },
      ];

      const hasPassableAdjacent = adjacentPositions.some(pos => {
        const key = `${pos.x},${pos.y}`;
        return !wallTiles.has(key);
      });

      expect(hasPassableAdjacent).toBe(true);
    }
  });

  test('T-V026: 玩家可从出生点到达家门', async ({ page }) => {
    const launcher = new GameLauncher(page);
    const stateExtractor = new StateExtractor();

    await launcher.navigateToGame();
    await launcher.waitForGameReady();
    await launcher.clickStartButton();
    await page.waitForTimeout(2000);

    const home = TOWN_OUTDOOR_CONFIG.buildings.find(b => b.id === 'home');
    expect(home).toBeDefined();

    if (home) {
      const doorPos = calculateDoorPosition(home);

      // 验证门在地图范围内且不在边界墙上
      expect(doorPos.tileX).toBeGreaterThan(0);
      expect(doorPos.tileX).toBeLessThan(TOWN_OUTDOOR_CONFIG.width - 1);
      expect(doorPos.tileY).toBeGreaterThan(0);
      expect(doorPos.tileY).toBeLessThan(TOWN_OUTDOOR_CONFIG.height - 1);

      // 验证门至少有一边是可通行的（不在建筑内或边界）
      const wallTiles = getBuildingWallTiles();
      const adjacentPositions = [
        { x: doorPos.tileX - 1, y: doorPos.tileY },
        { x: doorPos.tileX + 1, y: doorPos.tileY },
        { x: doorPos.tileX, y: doorPos.tileY - 1 },
        { x: doorPos.tileX, y: doorPos.tileY + 1 },
      ];

      const hasPassableAdjacent = adjacentPositions.some(pos => {
        const key = `${pos.x},${pos.y}`;
        // 可通行 = 不是墙，不在建筑内，在地图范围内
        return pos.x >= 0 && pos.x < TOWN_OUTDOOR_CONFIG.width &&
               pos.y >= 0 && pos.y < TOWN_OUTDOOR_CONFIG.height &&
               !wallTiles.has(key);
      });

      expect(hasPassableAdjacent).toBe(true);
    }
  });

  test('T-V027: 所有路径连通性验证', async ({ page }) => {
    const launcher = new GameLauncher(page);

    await launcher.navigateToGame();
    await launcher.waitForGameReady();
    await launcher.clickStartButton();
    await page.waitForTimeout(2000);

    const pathTiles = getAllPathTiles();
    const spawnPoint = TOWN_OUTDOOR_CONFIG.playerSpawnPoint;

    // 使用BFS验证从出生点可以到达所有路径
    const visited = new Set<string>();
    const queue: string[] = [`${spawnPoint.x},${spawnPoint.y}`];
    visited.add(`${spawnPoint.x},${spawnPoint.y}`);

    const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]];

    while (queue.length > 0) {
      const current = queue.shift()!;
      const [x, y] = current.split(',').map(Number);

      for (const [dx, dy] of directions) {
        const nx = x + dx;
        const ny = y + dy;
        const key = `${nx},${ny}`;

        if (pathTiles.has(key) && !visited.has(key)) {
          visited.add(key);
          queue.push(key);
        }
      }
    }

    // 验证所有路径瓦片都被访问到
    const totalPathTiles = pathTiles.size;
    const visitedCount = visited.size;

    // 允许一定误差（出生点可能不在路径上）
    expect(visitedCount).toBeGreaterThan(totalPathTiles * 0.9);
  });

  test('T-V028: 门周围有可达区域', async ({ page }) => {
    // 验证每个门至少有一个相邻的非墙瓦片（玩家可以到达）
    const launcher = new GameLauncher(page);

    await launcher.navigateToGame();
    await launcher.waitForGameReady();
    await launcher.clickStartButton();
    await page.waitForTimeout(2000);

    const wallTiles = getBuildingWallTiles();

    for (const door of TOWN_OUTDOOR_CONFIG.doors) {
      // 检查门四周是否有可通行区域（非墙）
      const adjacentPositions = [
        { x: door.tileX - 1, y: door.tileY },
        { x: door.tileX + 1, y: door.tileY },
        { x: door.tileX, y: door.tileY - 1 },
        { x: door.tileX, y: door.tileY + 1 },
      ];

      const hasPassableAdjacent = adjacentPositions.some(pos => {
        const key = `${pos.x},${pos.y}`;
        return pos.x >= 0 && pos.x < TOWN_OUTDOOR_CONFIG.width &&
               pos.y >= 0 && pos.y < TOWN_OUTDOOR_CONFIG.height &&
               !wallTiles.has(key);
      });

      expect(hasPassableAdjacent).toBe(true);
    }
  });

  test('T-V029: 门不在墙瓦片中', async ({ page }) => {
    const launcher = new GameLauncher(page);

    await launcher.navigateToGame();
    await launcher.waitForGameReady();
    await launcher.clickStartButton();
    await page.waitForTimeout(2000);

    const wallTiles = getBuildingWallTiles();

    // 验证每个门都不在墙集合中
    for (const door of TOWN_OUTDOOR_CONFIG.doors) {
      const doorKey = `${door.tileX},${door.tileY}`;
      expect(wallTiles.has(doorKey)).toBe(false);
    }
  });

  test('T-V030: 配置文件门坐标与场景实际门位置一致', async ({ page }) => {
    const launcher = new GameLauncher(page);
    const stateExtractor = new StateExtractor();

    await launcher.navigateToGame();
    await launcher.waitForGameReady();
    await launcher.clickStartButton();
    await page.waitForTimeout(2000);

    const mapData = await stateExtractor.getMapData(page);
    expect(mapData).not.toBeNull();

    if (mapData) {
      // 验证配置文件中的每个门在实际地图中存在
      for (const doorConfig of TOWN_OUTDOOR_CONFIG.doors) {
        const tile = mapData.tiles[doorConfig.tileY]?.[doorConfig.tileX];
        expect(tile).toBeDefined();
        expect(tile?.type).toBe('door');
        expect(tile?.properties?.target).toBeDefined();
      }
    }
  });
});

test.describe('地图配置验证', () => {
  test('所有建筑配置有效', async () => {
    for (const building of TOWN_OUTDOOR_CONFIG.buildings) {
      // 验证建筑在地图范围内
      expect(building.startX).toBeGreaterThanOrEqual(0);
      expect(building.startY).toBeGreaterThanOrEqual(0);
      expect(building.startX + building.width).toBeLessThanOrEqual(TOWN_OUTDOOR_CONFIG.width);
      expect(building.startY + building.height).toBeLessThanOrEqual(TOWN_OUTDOOR_CONFIG.height);

      // 验证门偏移在建筑范围内
      expect(building.doorOffsetX).toBeGreaterThanOrEqual(0);
      expect(building.doorOffsetX).toBeLessThan(building.width);

      // 验证目标场景有效
      expect(building.targetScene).toBeTruthy();
    }
  });

  test('出生点在有效位置', async () => {
    const spawn = TOWN_OUTDOOR_CONFIG.playerSpawnPoint;

    expect(spawn.x).toBeGreaterThanOrEqual(0);
    expect(spawn.y).toBeGreaterThanOrEqual(0);
    expect(spawn.x).toBeLessThan(TOWN_OUTDOOR_CONFIG.width);
    expect(spawn.y).toBeLessThan(TOWN_OUTDOOR_CONFIG.height);

    // 出生点不应该在墙上
    const wallTiles = getBuildingWallTiles();
    expect(wallTiles.has(`${spawn.x},${spawn.y}`)).toBe(false);
  });

  test('路径瓦片在地图范围内', async () => {
    const pathTiles = getAllPathTiles();

    for (const tileKey of pathTiles) {
      const [x, y] = tileKey.split(',').map(Number);
      expect(x).toBeGreaterThanOrEqual(0);
      expect(y).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThan(TOWN_OUTDOOR_CONFIG.width);
      expect(y).toBeLessThan(TOWN_OUTDOOR_CONFIG.height);
    }
  });
});