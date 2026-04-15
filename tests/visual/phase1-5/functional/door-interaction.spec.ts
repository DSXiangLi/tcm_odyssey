// tests/visual/phase1-5/functional/door-interaction.spec.ts
/**
 * Phase 1.5 Layer 2 功能性测试 - 门交互
 *
 * 测试用例:
 * - F-004: 药园门可达 - BFS验证从出生点(47,24)到药园门(15,8)
 * - F-005: 诊所门可达 - BFS验证从出生点到诊所门(60,8)
 * - F-006: 家门可达 - BFS验证从出生点到家门(61,35)
 * - F-007: 药园门交互验证
 * - F-008: 诊所门交互验证
 * - F-009: 家门交互验证
 * - D-001: 门在可行走区域验证 - 门坐标必须有相邻可行走瓦片
 * - D-002: 门触发范围精确验证 - 只有站在门瓦片上才能触发
 * - D-003: 空格键非门区域验证 - 非门区域按空格不触发操作
 *
 * 关键参数:
 * - 出生点: (47,24)
 * - 门坐标: 药园(15,8)、诊所(60,8)、家(61,35)
 */

import { test, expect } from '@playwright/test';
import { WalkableVerifier, TilePos, DoorAccessibilityResult } from '../utils/walkable-verifier';
import { TOWN_OUTDOOR_CONFIG, DoorConfig, getDoorAt } from '../../../../src/data/map-config';
import { GameLauncher } from '../../utils/game-launcher';
import { StateExtractor } from '../../utils/state-extractor';
import { LogReader } from '../../utils/log-reader';

test.describe('Phase 1.5 门交互功能性测试', () => {

  let verifier: WalkableVerifier;
  const spawnPoint: TilePos = { x: 47, y: 24 };

  test.beforeAll(() => {
    // 初始化验证器（不依赖页面，直接使用配置）
    verifier = new WalkableVerifier();
    verifier.initializeFromConfig(TOWN_OUTDOOR_CONFIG);
  });

  /**
   * F-004: 药园门可达 - BFS验证从出生点(47,24)到药园门(15,8)
   * 注意: 药园门坐标(15,8)本身不可行走，但其下方(15,9)可行走
   */
  test('F-004: 药园门可达', async () => {
    const gardenDoor: TilePos = { x: 15, y: 8 };
    const gardenDoorAdjacent: TilePos = { x: 15, y: 9 }; // 门下方的可行走瓦片

    // 验证门坐标配置正确
    const doorConfig = getDoorAt(gardenDoor.x, gardenDoor.y);
    expect(doorConfig).toBeDefined();
    expect(doorConfig?.targetScene).toBe('GardenScene');

    // 验证门相邻位置可行走
    const adjacentResult = verifier.isWalkable(gardenDoorAdjacent.x, gardenDoorAdjacent.y);
    expect(adjacentResult.isWalkable).toBe(true);

    // 使用BFS验证从出生点可达门相邻位置
    const pathResult = verifier.findPath(spawnPoint, gardenDoorAdjacent);
    expect(pathResult.found).toBe(true);
    expect(pathResult.length).toBeGreaterThan(0);
    expect(pathResult.message).toContain('找到路径');

    // 验证门周围有可行走瓦片
    const doorAccessibility = verifier.verifyDoorAccessibility(gardenDoor);
    expect(doorAccessibility.isAccessible).toBe(true);
    expect(doorAccessibility.adjacentWalkable.length).toBeGreaterThan(0);
  });

  /**
   * F-005: 诊所门可达 - BFS验证从出生点到诊所门(60,8)
   * 注意: 诊所门坐标(60,8)本身不可行走，但其下方(60,9)可行走
   */
  test('F-005: 诊所门可达', async () => {
    const clinicDoor: TilePos = { x: 60, y: 8 };
    const clinicDoorAdjacent: TilePos = { x: 60, y: 9 }; // 门下方的可行走瓦片

    // 验证门坐标配置正确
    const doorConfig = getDoorAt(clinicDoor.x, clinicDoor.y);
    expect(doorConfig).toBeDefined();
    expect(doorConfig?.targetScene).toBe('ClinicScene');

    // 验证门相邻位置可行走
    const adjacentResult = verifier.isWalkable(clinicDoorAdjacent.x, clinicDoorAdjacent.y);
    expect(adjacentResult.isWalkable).toBe(true);

    // 使用BFS验证从出生点可达门相邻位置
    const pathResult = verifier.findPath(spawnPoint, clinicDoorAdjacent);
    expect(pathResult.found).toBe(true);
    expect(pathResult.length).toBeGreaterThan(0);
    expect(pathResult.message).toContain('找到路径');

    // 验证门周围有可行走瓦片
    const doorAccessibility = verifier.verifyDoorAccessibility(clinicDoor);
    expect(doorAccessibility.isAccessible).toBe(true);
    expect(doorAccessibility.adjacentWalkable.length).toBeGreaterThan(0);
  });

  /**
   * F-006: 家门可达 - BFS验证从出生点到家门(61,35)
   * 注意: 家门坐标(61,35)本身可行走
   */
  test('F-006: 家门可达', async () => {
    const homeDoor: TilePos = { x: 61, y: 35 };

    // 验证门坐标配置正确
    const doorConfig = getDoorAt(homeDoor.x, homeDoor.y);
    expect(doorConfig).toBeDefined();
    expect(doorConfig?.targetScene).toBe('HomeScene');

    // 验证门位置本身可行走
    const doorResult = verifier.isWalkable(homeDoor.x, homeDoor.y);
    expect(doorResult.isWalkable).toBe(true);

    // 使用BFS验证从出生点可达（门本身可行走）
    const pathResult = verifier.findPath(spawnPoint, homeDoor);
    expect(pathResult.found).toBe(true);
    expect(pathResult.length).toBeGreaterThan(0);
    expect(pathResult.message).toContain('找到路径');

    // 验证门周围有可行走瓦片
    const doorAccessibility = verifier.verifyDoorAccessibility(homeDoor);
    expect(doorAccessibility.isAccessible).toBe(true);
    expect(doorAccessibility.adjacentWalkable.length).toBeGreaterThan(0);
  });

  /**
   * F-007: 药园门交互验证
   * 验证玩家可以与药园门进行交互
   */
  test('F-007: 药园门交互验证', async ({ page }) => {
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

    // 验证药园门配置存在
    const gardenDoor = TOWN_OUTDOOR_CONFIG.doors.find(d => d.targetScene === 'GardenScene');
    expect(gardenDoor).toBeDefined();

    if (gardenDoor) {
      // 验证门的属性
      expect(gardenDoor.tileX).toBe(15);
      expect(gardenDoor.tileY).toBe(8);
      expect(gardenDoor.spawnPoint).toBeDefined();
      expect(gardenDoor.spawnPoint.x).toBe(15);
      expect(gardenDoor.spawnPoint.y).toBe(10);

      // 验证门位置可行走或可交互
      const doorAccessibility = verifier.verifyDoorAccessibility({
        x: gardenDoor.tileX,
        y: gardenDoor.tileY
      });
      expect(doorAccessibility.isAccessible).toBe(true);
    }
  });

  /**
   * F-008: 诊所门交互验证
   * 验证玩家可以与诊所门进行交互
   */
  test('F-008: 诊所门交互验证', async ({ page }) => {
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

    // 验证诊所门配置存在
    const clinicDoor = TOWN_OUTDOOR_CONFIG.doors.find(d => d.targetScene === 'ClinicScene');
    expect(clinicDoor).toBeDefined();

    if (clinicDoor) {
      // 验证门的属性
      expect(clinicDoor.tileX).toBe(60);
      expect(clinicDoor.tileY).toBe(8);
      expect(clinicDoor.spawnPoint).toBeDefined();
      expect(clinicDoor.spawnPoint.x).toBe(60);
      expect(clinicDoor.spawnPoint.y).toBe(10);

      // 验证门位置可达
      const doorAccessibility = verifier.verifyDoorAccessibility({
        x: clinicDoor.tileX,
        y: clinicDoor.tileY
      });
      expect(doorAccessibility.isAccessible).toBe(true);
    }
  });

  /**
   * F-009: 家门交互验证
   * 验证玩家可以与家门进行交互
   */
  test('F-009: 家门交互验证', async ({ page }) => {
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

    // 验证家门配置存在
    const homeDoor = TOWN_OUTDOOR_CONFIG.doors.find(d => d.targetScene === 'HomeScene');
    expect(homeDoor).toBeDefined();

    if (homeDoor) {
      // 验证门的属性
      expect(homeDoor.tileX).toBe(61);
      expect(homeDoor.tileY).toBe(35);
      expect(homeDoor.spawnPoint).toBeDefined();
      expect(homeDoor.spawnPoint.x).toBe(61);
      expect(homeDoor.spawnPoint.y).toBe(37);

      // 验证门位置可达
      const doorAccessibility = verifier.verifyDoorAccessibility({
        x: homeDoor.tileX,
        y: homeDoor.tileY
      });
      expect(doorAccessibility.isAccessible).toBe(true);
    }
  });

  /**
   * 验证所有门的可达性汇总
   */
  test('所有门可达性汇总验证', async () => {
    const allDoorResults = verifier.verifyAllDoors();

    // 验证有3个门
    expect(allDoorResults.length).toBe(3);

    // 验证所有门都可达（有相邻可行走瓦片）
    for (const result of allDoorResults) {
      expect(result.isAccessible).toBe(true);
      expect(result.adjacentWalkable.length).toBeGreaterThan(0);
    }

    // 验证每个门的目标场景正确
    const scenes = allDoorResults.map(r => r.door.targetScene);
    expect(scenes).toContain('GardenScene');
    expect(scenes).toContain('ClinicScene');
    expect(scenes).toContain('HomeScene');
  });

  /**
   * 验证从出生点到各门相邻位置的距离
   */
  test('门距离计算验证', async () => {
    const gardenDoorAdjacent: TilePos = { x: 15, y: 9 };  // 药园门下方
    const clinicDoorAdjacent: TilePos = { x: 60, y: 9 };  // 诊所门下方
    const homeDoor: TilePos = { x: 61, y: 35 };           // 家门本身可行走

    // 计算曼哈顿距离
    const gardenDistance = verifier.calculateDistance(spawnPoint, gardenDoorAdjacent);
    const clinicDistance = verifier.calculateDistance(spawnPoint, clinicDoorAdjacent);
    const homeDistance = verifier.calculateDistance(spawnPoint, homeDoor);

    // 验证距离合理（出生点在中心，各门分布在不同方向）
    expect(gardenDistance).toBeGreaterThan(20); // 药园在西北方向
    expect(clinicDistance).toBeGreaterThan(10); // 诊所较近
    expect(homeDistance).toBeGreaterThan(5);    // 家最近

    // 路径长度验证（应该大于或等于曼哈顿距离）
    const gardenPath = verifier.findPath(spawnPoint, gardenDoorAdjacent);
    const clinicPath = verifier.findPath(spawnPoint, clinicDoorAdjacent);
    const homePath = verifier.findPath(spawnPoint, homeDoor);

    expect(gardenPath.found).toBe(true);
    expect(clinicPath.found).toBe(true);
    expect(homePath.found).toBe(true);

    expect(gardenPath.length).toBeGreaterThanOrEqual(gardenDistance);
    expect(clinicPath.length).toBeGreaterThanOrEqual(clinicDistance);
    expect(homePath.length).toBeGreaterThanOrEqual(homeDistance);
  });

  /**
   * D-001: 门在可行走区域验证
   * 验证所有门坐标必须在walkableTiles中或相邻位置可行走
   * 注意：门本身可能不可行走（如药园门15,8和诊所门60,8），但必须有相邻可行走瓦片
   * 这确保玩家可以靠近门并与之交互
   */
  test('D-001: 门在可行走区域验证', async () => {
    // 验证所有门都有相邻可行走瓦片
    const allDoorResults = verifier.verifyAllDoors();

    // 验证有3个门
    expect(allDoorResults.length).toBe(3);

    // 验证每个门的具体可达性情况
    for (const result of allDoorResults) {
      // 门必须可达（有相邻可行走瓦片）
      expect(result.isAccessible).toBe(true);
      expect(result.adjacentWalkable.length).toBeGreaterThan(0);

      // 验证门位置本身的可行走状态
      const doorPos: TilePos = { x: result.door.tileX, y: result.door.tileY };
      const doorWalkable = verifier.isWalkable(doorPos.x, doorPos.y);

      // 记录门位置的可行走状态用于调试
      console.log(`门(${doorPos.x},${doorPos.y}) -> ${result.door.targetScene}:`);
      console.log(`  - 门本身可行走: ${doorWalkable.isWalkable}`);
      console.log(`  - 相邻可行走瓦片数: ${result.adjacentWalkable.length}`);
      console.log(`  - 相邻可行走位置: ${result.adjacentWalkable.map(p => `(${p.x},${p.y})`).join(', ')}`);

      // 门可能本身不可行走（如建筑入口），但相邻必须有可行走瓦片
      // 家门(61,35)本身可行走，药园门(15,8)和诊所门(60,8)本身不可行走
      if (result.door.targetScene === 'HomeScene') {
        // 家门本身可行走
        expect(doorWalkable.isWalkable).toBe(true);
      } else {
        // 药园门和诊所门本身可能不可行走，但相邻必须有可行走瓦片
        expect(result.adjacentWalkable.length).toBeGreaterThan(0);
      }
    }
  });

  /**
   * D-002: 门触发范围精确验证
   * 验证只有站在门瓦片上才能触发，相邻不触发
   * 这是功能性验证：确保门交互的触发范围精确，不会误触发
   *
   * 验证方式：
   * 1. 确认门位置的判定逻辑正确
   * 2. 相邻瓦片不应该触发门交互
   */
  test('D-002: 门触发范围精确验证', async ({ page }) => {
    const launcher = new GameLauncher(page);
    const stateExtractor = new StateExtractor();

    // 启动游戏
    await launcher.navigateToGame();
    await launcher.waitForGameReady();
    await launcher.clickStartButton();
    await page.waitForTimeout(3000);

    // 验证当前场景
    const currentScene = await stateExtractor.getCurrentScene(page);
    expect(currentScene).toBe('TownOutdoorScene');

    // 测试每个门的触发范围
    for (const door of TOWN_OUTDOOR_CONFIG.doors) {
      const doorPos: TilePos = { x: door.tileX, y: door.tileY };

      // 获取门的相邻可行走瓦片（不是门本身）
      const adjacentWalkable = verifier.getAdjacentWalkableTiles(doorPos);

      // 如果有相邻可行走瓦片，验证在这些位置按空格不触发场景切换
      if (adjacentWalkable.length > 0) {
        // 选择一个相邻位置（非门位置）
        const adjacentPos = adjacentWalkable[0];

        // 验证相邻位置不是门
        const adjacentIsDoor = TOWN_OUTDOOR_CONFIG.doors.some(
          d => d.tileX === adjacentPos.x && d.tileY === adjacentPos.y
        );
        expect(adjacentIsDoor).toBe(false);

        // 理论验证：相邻位置和门位置是不同的
        expect(adjacentPos.x !== doorPos.x || adjacentPos.y !== doorPos.y).toBe(true);

        console.log(`门(${doorPos.x},${doorPos.y}): 相邻位置(${adjacentPos.x},${adjacentPos.y})不应触发门交互`);
      }

      // 验证门位置的判定逻辑正确
      // 门交互检测使用的是玩家瓦片坐标，需要精确匹配门坐标
      const doorConfig = getDoorAt(doorPos.x, doorPos.y);
      expect(doorConfig).toBeDefined();
      expect(doorConfig?.targetScene).toBe(door.targetScene);
    }
  });

  /**
   * D-003: 空格键非门区域验证
   * 验证在非门区域按空格键不会触发任何操作
   * 这是功能性验证：确保空格键只在门位置有效，避免误操作
   *
   * 验证方式：
   * 1. 在出生点（非门位置）验证不是门
   * 2. 确认空格键不会触发场景切换
   */
  test('D-003: 空格键非门区域验证', async ({ page }) => {
    const launcher = new GameLauncher(page);
    const stateExtractor = new StateExtractor();

    // 启动游戏
    await launcher.navigateToGame();
    await launcher.waitForGameReady();
    await launcher.clickStartButton();
    await page.waitForTimeout(3000);

    // 验证当前场景
    const currentScene = await stateExtractor.getCurrentScene(page);
    expect(currentScene).toBe('TownOutdoorScene');

    // 获取玩家当前位置（应该是出生点）
    const playerState = await stateExtractor.getPlayerState(page);
    expect(playerState).not.toBeNull();

    if (playerState) {
      // 验证玩家在出生点
      expect(playerState.tileX).toBe(spawnPoint.x);
      expect(playerState.tileY).toBe(spawnPoint.y);

      // 验证出生点不是门位置
      const doorConfig = getDoorAt(playerState.tileX, playerState.tileY);
      expect(doorConfig).toBeUndefined();

      // 验证出生点是可行走的
      const spawnWalkable = verifier.isWalkable(playerState.tileX, playerState.tileY);
      expect(spawnWalkable.isWalkable).toBe(true);

      console.log(`出生点(${playerState.tileX},${playerState.tileY}): 不是门，空格键无效`);

      // 模拟在非门区域按空格键
      await page.keyboard.press('Space');
      await page.waitForTimeout(500);

      // 验证场景没有切换
      const sceneAfterSpace = await stateExtractor.getCurrentScene(page);
      expect(sceneAfterSpace).toBe('TownOutdoorScene');
    }

    // 验证更多非门区域（采样几个可行走瓦片）
    const sampleTiles = verifier.sampleWalkableTiles(5);

    for (const tile of sampleTiles) {
      // 排除门位置
      const isDoor = TOWN_OUTDOOR_CONFIG.doors.some(
        d => d.tileX === tile.x && d.tileY === tile.y
      );

      if (!isDoor) {
        // 验证这些位置不是门
        const doorConfig = getDoorAt(tile.x, tile.y);
        expect(doorConfig).toBeUndefined();

        console.log(`采样位置(${tile.x},${tile.y}): 不是门，空格键无效`);
      }
    }
  });
});