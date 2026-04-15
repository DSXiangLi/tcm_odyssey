// tests/visual/phase1-5/diagnostic/quick-diagnostic.spec.ts
/**
 * 快速诊断测试 - 直接检查游戏内部状态
 */

import { test, expect } from '@playwright/test';
import { GameLauncher } from '../../utils/game-launcher';
import { StateExtractor } from '../../utils/state-extractor';

const TILE_SIZE = 32;

test.describe('快速诊断测试', () => {
  test.setTimeout(60000);

  test('检查游戏内部状态', async ({ page }) => {
    const launcher = new GameLauncher(page);
    const stateExtractor = new StateExtractor();

    await launcher.navigateToGame();
    await launcher.waitForGameReady();
    await launcher.clickStartButton();
    await page.waitForTimeout(3000);

    // 获取完整游戏状态
    const gameState = await stateExtractor.getGameState(page);
    console.log('\n=== 游戏状态 ===');
    console.log(JSON.stringify(gameState, null, 2));

    // 在浏览器中直接检查可行走状态
    const browserCheck = await page.evaluate(() => {
      // 获取GameStateBridge暴露的状态
      const getState = (window as any).__GAME_STATE__;
      const state = typeof getState === 'function' ? getState() : null;

      // 获取MAP_CONFIG
      const mapConfig = (window as any).__MAP_CONFIG__;

      // 检查玩家位置是否在可行走区域
      if (state && state.player && mapConfig) {
        const tileX = state.player.tileX;
        const tileY = state.player.tileY;
        const key = `${tileX},${tileY}`;

        // 尝试使用has方法检查（如果是Set）
        let isWalkable = false;
        if (mapConfig.walkableTiles && typeof mapConfig.walkableTiles.has === 'function') {
          isWalkable = mapConfig.walkableTiles.has(key);
        } else if (Array.isArray(mapConfig.walkableTiles)) {
          // 如果是数组，使用some检查
          isWalkable = mapConfig.walkableTiles.some((t: any) => t.x === tileX && t.y === tileY);
        }

        // 检查玩家周围四个方向
        const directions = [
          { dx: 0, dy: -1, name: '上' },
          { dx: 0, dy: 1, name: '下' },
          { dx: -1, dy: 0, name: '左' },
          { dx: 1, dy: 0, name: '右' }
        ];

        const aroundCheck = directions.map(dir => {
          const checkX = tileX + dir.dx;
          const checkY = tileY + dir.dy;
          const checkKey = `${checkX},${checkY}`;
          let walkable = false;
          if (mapConfig.walkableTiles && typeof mapConfig.walkableTiles.has === 'function') {
            walkable = mapConfig.walkableTiles.has(checkKey);
          } else if (Array.isArray(mapConfig.walkableTiles)) {
            walkable = mapConfig.walkableTiles.some((t: any) => t.x === checkX && t.y === checkY);
          }
          return { direction: dir.name, x: checkX, y: checkY, walkable };
        });

        // 获取walkableTiles的类型和大小
        let tilesInfo = 'unknown';
        if (mapConfig.walkableTiles) {
          if (typeof mapConfig.walkableTiles.size === 'number') {
            tilesInfo = `Set with ${mapConfig.walkableTiles.size} elements`;
          } else if (Array.isArray(mapConfig.walkableTiles)) {
            tilesInfo = `Array with ${mapConfig.walkableTiles.length} elements`;
          } else {
            tilesInfo = `Object with keys: ${Object.keys(mapConfig.walkableTiles).slice(0, 5).join(',')}...`;
          }
        }

        return {
          playerPos: { x: state.player.x, y: state.player.y, tileX, tileY },
          playerVelocity: state.player.velocity,
          isWalkableAtPlayer: isWalkable,
          aroundCheck,
          walkableTilesInfo: tilesInfo,
          mapSize: { width: mapConfig.width, height: mapConfig.height }
        };
      }

      return null;
    });

    console.log('\n=== 浏览器内检查 ===');
    console.log(JSON.stringify(browserCheck, null, 2));

    if (browserCheck) {
      // 分析结果
      console.log('\n=== 诊断结论 ===');

      if (!browserCheck.isWalkableAtPlayer) {
        console.log('[CRITICAL] 玩家当前位置不在可行走区域！');
        console.log('  玩家瓦片坐标:', browserCheck.playerPos.tileX, browserCheck.playerPos.tileY);
      } else {
        console.log('[OK] 玩家当前位置在可行走区域');
      }

      const walkableAround = browserCheck.aroundCheck.filter(d => d.walkable);
      if (walkableAround.length === 0) {
        console.log('[CRITICAL] 玩家周围没有任何可行走方向！');
      } else if (walkableAround.length < 2) {
        console.log('[HIGH] 玩家周围可行走方向很少:', walkableAround.map(d => d.direction).join(','));
      } else {
        console.log('[OK] 玩家周围可行走方向:', walkableAround.map(d => d.direction).join(','));
      }

      if (browserCheck.playerVelocity.x === 0 && browserCheck.playerVelocity.y === 0) {
        console.log('[INFO] 玩家velocity为0，这是正常的（未按键时）');
      }

      console.log('\n可行走瓦片集合类型:', browserCheck.walkableTilesInfo);
    }

    // 尝试移动并检查
    console.log('\n=== 尝试移动测试 ===');
    const beforeMove = await stateExtractor.getPlayerState(page);
    console.log('移动前:', beforeMove);

    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(500);

    // 检查移动过程中的velocity
    const duringMove = await page.evaluate(() => {
      const getState = (window as any).__GAME_STATE__;
      if (typeof getState === 'function') {
        const state = getState();
        return {
          velocity: state?.player?.velocity,
          position: { x: state?.player?.x, y: state?.player?.y }
        };
      }
      return null;
    });
    console.log('移动中(按住右键):', duringMove);

    await page.keyboard.up('ArrowRight');
    await page.waitForTimeout(200);

    const afterMove = await stateExtractor.getPlayerState(page);
    console.log('移动后:', afterMove);

    if (beforeMove && afterMove && duringMove) {
      const deltaX = afterMove.x - beforeMove.x;
      const velocityDuringMove = duringMove.velocity?.x || 0;
      console.log('\n移动分析:');
      console.log('  位移:', deltaX.toFixed(1), 'px');
      console.log('  移动中velocity.x:', velocityDuringMove);

      if (velocityDuringMove === 0) {
        console.log('[CRITICAL] 按住右键时velocity.x仍为0！');
        console.log('  这说明canMoveInDirection()返回了false');
      }
    }

    // 截图保存
    await page.screenshot({ path: 'tests/screenshots/diagnostic-game-state.png' });

    expect(true).toBe(true); // 诊断测试总是通过
  });

  test('检查canMoveInDirection逻辑', async ({ page }) => {
    const launcher = new GameLauncher(page);

    await launcher.navigateToGame();
    await launcher.waitForGameReady();
    await launcher.clickStartButton();
    await page.waitForTimeout(3000);

    // 在浏览器中模拟canMoveInDirection的检查逻辑
    const moveCheckSimulation = await page.evaluate(() => {
      const TILE_SIZE = 32;
      const getState = (window as any).__GAME_STATE__;
      const mapConfig = (window as any).__MAP_CONFIG__;

      if (!getState || !mapConfig) return null;

      const state = typeof getState === 'function' ? getState() : null;
      if (!state || !state.player) return null;

      const playerX = state.player.x;
      const playerY = state.player.y;
      const checkDistance = TILE_SIZE * 0.5; // 16像素

      // 模拟向右移动的检查
      const direction = { x: 1, y: 0 };
      const targetX = playerX + direction.x * checkDistance;
      const targetY = playerY; // Y不变

      const tileX = Math.floor(targetX / TILE_SIZE);
      const tileY = Math.floor(targetY / TILE_SIZE);

      // 检查目标瓦片和相邻瓦片
      const positionsToCheck = [
        `${tileX},${tileY}`,
        `${tileX + direction.x},${tileY}`, // 49,24
        `${tileX},${tileY + direction.y}`  // 48,24 (Y不变)
      ];

      const checkResults = positionsToCheck.map(key => {
        let walkable = false;
        if (mapConfig.walkableTiles && typeof mapConfig.walkableTiles.has === 'function') {
          walkable = mapConfig.walkableTiles.has(key);
        } else if (Array.isArray(mapConfig.walkableTiles)) {
          const [x, y] = key.split(',').map(Number);
          walkable = mapConfig.walkableTiles.some((t: any) => t.x === x && t.y === y);
        }
        return { key, walkable };
      });

      const canMove = checkResults.some(r => r.walkable);

      return {
        playerPixelPos: { x: playerX, y: playerY },
        playerTilePos: { x: state.player.tileX, y: state.player.tileY },
        targetPixelPos: { x: targetX, y: targetY },
        targetTilePos: { x: tileX, y: tileY },
        positionsToCheck,
        checkResults,
        canMoveResult: canMove
      };
    });

    console.log('\n=== canMoveInDirection模拟 ===');
    console.log(JSON.stringify(moveCheckSimulation, null, 2));

    if (moveCheckSimulation) {
      console.log('\n诊断结论:');
      console.log('  canMoveInDirection返回:', moveCheckSimulation.canMoveResult);

      if (!moveCheckSimulation.canMoveResult) {
        console.log('[CRITICAL] canMoveInDirection返回false！');
        console.log('  检查的瓦片:', moveCheckSimulation.positionsToCheck);
        console.log('  各瓦片可行走状态:', moveCheckSimulation.checkResults);
      }
    }

    expect(true).toBe(true);
  });
});