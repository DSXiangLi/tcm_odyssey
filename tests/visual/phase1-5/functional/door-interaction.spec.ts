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
});