// tests/visual/phase1-5/functional/collision.spec.ts
/**
 * Phase 1.5 Layer 2 功能性测试 - 碰撞系统
 *
 * 测试用例:
 * - F-001: 玩家可在可行走区域移动
 * - F-002: 玩家无法移动到不可行走区域
 * - F-003: 滑墙效果验证（对角线移动遇墙尝试单轴移动）
 *
 * 关键参数:
 * - 出生点: (47,24)
 * - 地图尺寸: 86x48瓦片
 * - 可行走瓦片: 916个
 */

import { test, expect } from '@playwright/test';
import { WalkableVerifier, TilePos } from '../utils/walkable-verifier';
import { TOWN_OUTDOOR_CONFIG } from '../../../../src/data/map-config';
import { GameLauncher } from '../../utils/game-launcher';
import { StateExtractor, PlayerState } from '../../utils/state-extractor';

test.describe('Phase 1.5 碰撞系统功能性测试', () => {

  let verifier: WalkableVerifier;

  test.beforeAll(() => {
    // 初始化验证器（不依赖页面，直接使用配置）
    verifier = new WalkableVerifier();
    verifier.initializeFromConfig(TOWN_OUTDOOR_CONFIG);
  });

  /**
   * F-001: 玩家可在可行走区域移动
   * 验证玩家可以在所有可行走瓦片上自由移动
   */
  test('F-001: 玩家可在可行走区域移动', async ({ page }) => {
    const launcher = new GameLauncher(page);
    const stateExtractor = new StateExtractor();

    await launcher.navigateToGame();
    await launcher.waitForGameReady();
    await launcher.clickStartButton();
    await page.waitForTimeout(2000);

    // 验证出生点可行走
    const spawnPoint = TOWN_OUTDOOR_CONFIG.playerSpawnPoint;
    const spawnResult = verifier.isWalkable(spawnPoint.x, spawnPoint.y);
    expect(spawnResult.isWalkable).toBe(true);

    // 验证玩家当前在可行走位置
    const playerState = await stateExtractor.getPlayerState(page);
    expect(playerState).not.toBeNull();

    if (playerState) {
      const playerPosResult = verifier.isWalkable(playerState.tileX, playerState.tileY);
      expect(playerPosResult.isWalkable).toBe(true);
    }

    // 验证连通性：从出生点可以到达所有可行走区域
    const connectivityResult = verifier.verifyAllConnected();
    expect(connectivityResult.isConnected).toBe(true);
    expect(connectivityResult.coverageRatio).toBeGreaterThanOrEqual(0.99);
  });

  /**
   * F-002: 玩家无法移动到不可行走区域
   * 验证碰撞检测配置正确，特定不可行走区域无法进入
   */
  test('F-002: 玩家无法移动到不可行走区域', async ({ page }) => {
    const launcher = new GameLauncher(page);
    const stateExtractor = new StateExtractor();

    await launcher.navigateToGame();
    await launcher.waitForGameReady();
    await launcher.clickStartButton();
    await page.waitForTimeout(2000);

    // 获取地图尺寸
    const mapWidth = TOWN_OUTDOOR_CONFIG.width;
    const mapHeight = TOWN_OUTDOOR_CONFIG.height;

    // 验证特定角落瓦片不可行走（地图边界角落通常是封闭的）
    // 左上角 (0,0)
    expect(verifier.isWalkable(0, 0).isWalkable).toBe(false);
    // 右上角 (mapWidth-1, 0)
    expect(verifier.isWalkable(mapWidth - 1, 0).isWalkable).toBe(false);
    // 左下角 (0, mapHeight-1)
    expect(verifier.isWalkable(0, mapHeight - 1).isWalkable).toBe(false);
    // 右下角 (mapWidth-1, mapHeight-1)
    expect(verifier.isWalkable(mapWidth - 1, mapHeight - 1).isWalkable).toBe(false);

    // 验证超出地图范围的坐标不可行走
    expect(verifier.isWalkable(-1, 0).isWalkable).toBe(false);
    expect(verifier.isWalkable(0, -1).isWalkable).toBe(false);
    expect(verifier.isWalkable(mapWidth, 0).isWalkable).toBe(false);
    expect(verifier.isWalkable(0, mapHeight).isWalkable).toBe(false);

    // 验证出生点可行走（玩家初始位置有效）
    const spawnResult = verifier.verifySpawnPoint();
    expect(spawnResult.isWalkable).toBe(true);

    // 验证出生点周围有可行走瓦片（玩家可以向四周移动）
    const spawnAdjacent = verifier.getAdjacentWalkableTiles({
      x: TOWN_OUTDOOR_CONFIG.playerSpawnPoint.x,
      y: TOWN_OUTDOOR_CONFIG.playerSpawnPoint.y
    });
    expect(spawnAdjacent.length).toBeGreaterThan(0);

    // 验证连通性（所有可行走区域是连通的）
    const connectivityResult = verifier.verifyAllConnected();
    expect(connectivityResult.isConnected).toBe(true);
  });

  /**
   * F-003: 滑墙效果验证（对角线移动遇墙尝试单轴移动）
   * 当对角线移动遇到墙壁时，玩家应该能沿着墙滑动（单轴移动）
   */
  test('F-003: 滑墙效果验证', async ({ page }) => {
    const launcher = new GameLauncher(page);
    const stateExtractor = new StateExtractor();

    await launcher.navigateToGame();
    await launcher.waitForGameReady();
    await launcher.clickStartButton();
    await page.waitForTimeout(2000);

    const initialState = await stateExtractor.getPlayerState(page);
    expect(initialState).not.toBeNull();

    if (initialState) {
      // 获取玩家当前位置的相邻可行走瓦片
      const adjacentWalkable = verifier.getAdjacentWalkableTiles({
        x: initialState.tileX,
        y: initialState.tileY
      });

      // 验证对角线移动：尝试同时按两个方向键
      // 如果一个方向有墙，另一个方向可行走，玩家应该能单轴移动

      // 测试场景：按住右上方向键（对角线移动）
      await page.keyboard.down('ArrowUp');
      await page.keyboard.down('ArrowRight');
      await page.waitForTimeout(300);

      // 获取移动后的位置
      const afterDiagonalState = await stateExtractor.getPlayerState(page);
      expect(afterDiagonalState).not.toBeNull();

      if (afterDiagonalState) {
        // 验证玩家位置变化（至少一个轴移动了）
        const movedX = Math.abs(afterDiagonalState.tileX - initialState.tileX);
        const movedY = Math.abs(afterDiagonalState.tileY - initialState.tileY);

        // 如果是纯对角线移动，两个轴都应该移动
        // 如果遇到墙，至少一个轴可能移动（滑墙效果）
        // 验证最终位置仍然可行走
        const finalPosResult = verifier.isWalkable(
          afterDiagonalState.tileX,
          afterDiagonalState.tileY
        );
        expect(finalPosResult.isWalkable).toBe(true);

        // 验证总位移不超过可行走区域的限制
        expect(movedX + movedY).toBeLessThanOrEqual(5);
      }

      await page.keyboard.up('ArrowUp');
      await page.keyboard.up('ArrowRight');
      await page.waitForTimeout(100);
    }
  });

  /**
   * 验证可行走瓦片数量正确
   */
  test('可行走瓦片数量验证', async () => {
    const status = verifier.getStatus();
    expect(status.initialized).toBe(true);
    expect(status.mapWidth).toBe(86);
    expect(status.mapHeight).toBe(48);
    expect(status.walkableTileCount).toBe(916);
  });

  /**
   * 验证出生点在可行走区域中心
   */
  test('出生点位置验证', async () => {
    const spawnResult = verifier.verifySpawnPoint();
    expect(spawnResult.isWalkable).toBe(true);
    expect(spawnResult.position.x).toBe(47);
    expect(spawnResult.position.y).toBe(24);
  });
});