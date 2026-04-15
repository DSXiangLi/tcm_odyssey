// tests/visual/manual/clinic-door-debug.spec.ts
/**
 * 实际操作测试 - 调试诊所门交互问题
 * 验证玩家能否实际进入诊所
 */
import { test, expect } from '@playwright/test';
import { GameLauncher } from '../utils/game-launcher';

test.describe('诊所门交互实际验证', () => {
  test('实际操作：移动到诊所门并按空格', async ({ page }) => {
    // 启动游戏
    const launcher = new GameLauncher(page);
    await launcher.navigateToGame();
    await launcher.waitForGameReady(15000);
    await launcher.clickStartButton();

    // 等待游戏加载
    await page.waitForTimeout(3000);

    // 检查初始状态
    const initialState = await page.evaluate(() => {
      const getState = (window as any).__GAME_STATE__;
      const state = getState ? getState() : null;

      return {
        currentScene: state?.currentScene,
        player: state?.player,
        timestamp: state?.timestamp
      };
    });

    console.log('=== 初始状态 ===');
    console.log(JSON.stringify(initialState, null, 2));

    // 诊所门在(60, 8)，玩家出生在(47, 24)
    // 需要向右移动约13格，向上移动约16格

    // 先向右移动到x=60附近
    console.log('开始移动：向右移动到诊所门附近...');

    // 分段移动，每移动5次检查位置
    for (let i = 0; i < 6; i++) {
      for (let j = 0; j < 5; j++) {
        await page.keyboard.press('ArrowRight');
        await page.waitForTimeout(80);
      }

      const pos = await page.evaluate(() => {
        const getState = (window as any).__GAME_STATE__;
        const state = getState ? getState() : null;
        return { tileX: state?.player?.tileX, tileY: state?.player?.tileY };
      });
      console.log(`右移${i*5+5}次后: (${pos.tileX}, ${pos.tileY})`);
    }

    // 再向上移动到门位置
    console.log('\n向上移动到门...');
    for (let i = 0; i < 6; i++) {
      for (let j = 0; j < 5; j++) {
        await page.keyboard.press('ArrowUp');
        await page.waitForTimeout(80);
      }

      const pos = await page.evaluate(() => {
        const getState = (window as any).__GAME_STATE__;
        const state = getState ? getState() : null;
        return { tileX: state?.player?.tileX, tileY: state?.player?.tileY };
      });
      console.log(`上移${i*5+5}次后: (${pos.tileX}, ${pos.tileY})`);
    }

    await page.waitForTimeout(500);

    // 检查位置
    const afterMoveState = await page.evaluate(() => {
      const getState = (window as any).__GAME_STATE__;
      const state = getState ? getState() : null;

      // 检查诊所门周围是否可行走
      const mapConfig = (window as any).__MAP_CONFIG__;
      const walkableTiles = mapConfig?.walkableTiles;

      let doorAreaWalkable = {};
      if (walkableTiles && walkableTiles.has) {
        doorAreaWalkable = {
          '60,8': walkableTiles.has('60,8'),
          '59,8': walkableTiles.has('59,8'),
          '61,8': walkableTiles.has('61,8'),
          '60,7': walkableTiles.has('60,7'),
          '60,9': walkableTiles.has('60,9'),
          '60,10': walkableTiles.has('60,10')
        };
      }

      return {
        currentScene: state?.currentScene,
        player: state?.player,
        doorAreaWalkable: doorAreaWalkable,
        isOnDoor: state?.player?.tileX === 60 && state?.player?.tileY === 8,
        isNearDoor: Math.abs(state?.player?.tileX - 60) <= 2 && Math.abs(state?.player?.tileY - 8) <= 2
      };
    });

    console.log('=== 移动后状态 ===');
    console.log(JSON.stringify(afterMoveState, null, 2));

    // 检查y=24横向路径
    const pathY24Check = await page.evaluate(() => {
      const mapConfig = (window as any).__MAP_CONFIG__;
      const walkableTiles = mapConfig?.walkableTiles;

      if (!walkableTiles || !walkableTiles.has) {
        return { error: 'walkableTiles not available' };
      }

      const result = {};
      for (let x = 47; x <= 62; x++) {
        result[`${x},24`] = walkableTiles.has(`${x},24`);
      }
      return result;
    });

    console.log('\n=== y=24横向路径检查 ===');
    for (const [key, value] of Object.entries(pathY24Check)) {
      console.log(`${key}: ${value ? '✓可行走' : '✗不可行走'}`);
    }

    // 检查玩家当前位置的纵向路径
    const playerTileX = afterMoveState.player?.tileX;
    const playerTileY = afterMoveState.player?.tileY;
    console.log(`\n玩家位置: (${playerTileX}, ${playerTileY})`);

    const playerPathUp = await page.evaluate(() => {
      const mapConfig = (window as any).__MAP_CONFIG__;
      const walkableTiles = mapConfig?.walkableTiles;
      const getState = (window as any).__GAME_STATE__;
      const state = getState ? getState() : null;
      const playerX = state?.player?.tileX;

      if (!walkableTiles || !walkableTiles.has) {
        return { error: 'not available' };
      }

      const result = {};
      // 检查玩家当前x坐标从y=24到y=8的路径
      for (let y = 8; y <= 24; y++) {
        result[`${playerX},${y}`] = walkableTiles.has(`${playerX},${y}`);
      }
      return { playerX, path: result };
    });

    console.log(`\n=== x=${playerPathUp.playerX}纵向路径（玩家位置向上）===`);
    for (const [key, value] of Object.entries(playerPathUp.path)) {
      console.log(`${key}: ${value ? '✓可行走' : '✗不可行走'}`);
    }

    // 检查x=60纵向路径是否完整
    const pathCheck = await page.evaluate(() => {
      const mapConfig = (window as any).__MAP_CONFIG__;
      const walkableTiles = mapConfig?.walkableTiles;

      if (!walkableTiles || !walkableTiles.has) {
        return { error: 'walkableTiles not available' };
      }

      // 检查x=60这条路径从y=8到y=24
      const result = {};
      for (let y = 8; y <= 24; y++) {
        result[`60,${y}`] = walkableTiles.has(`60,${y}`);
      }

      return result;
    });

    console.log('\n=== x=60纵向路径检查 ===');
    for (const [key, value] of Object.entries(pathCheck)) {
      console.log(`${key}: ${value ? '✓可行走' : '✗不可行走'}`);
    }

    // 检查x=61路径（玩家实际到达的位置）
    const path61Check = await page.evaluate(() => {
      const mapConfig = (window as any).__MAP_CONFIG__;
      const walkableTiles = mapConfig?.walkableTiles;

      if (!walkableTiles || !walkableTiles.has) {
        return { error: 'walkableTiles not available' };
      }

      const result = {};
      for (let y = 8; y <= 24; y++) {
        result[`61,${y}`] = walkableTiles.has(`61,${y}`);
      }
      return result;
    });

    console.log('\n=== x=61纵向路径检查（玩家实际路径）===');
    for (const [key, value] of Object.entries(path61Check)) {
      console.log(`${key}: ${value ? '✓可行走' : '✗不可行走'}`);
    }

    // 检查x=62路径（玩家实际到达的位置）
    const path62Check = await page.evaluate(() => {
      const mapConfig = (window as any).__MAP_CONFIG__;
      const walkableTiles = mapConfig?.walkableTiles;

      if (!walkableTiles || !walkableTiles.has) {
        return { error: 'walkableTiles not available' };
      }

      const result = {};
      for (let y = 8; y <= 25; y++) {
        result[`62,${y}`] = walkableTiles.has(`62,${y}`);
      }
      return result;
    });

    console.log('\n=== x=62纵向路径检查（玩家实际路径）===');
    for (const [key, value] of Object.entries(path62Check)) {
      console.log(`${key}: ${value ? '✓可行走' : '✗不可行走'}`);
    }

    // 检查玩家当前位置周围的可行走状态
    const playerPos = afterMoveState.player?.tileX;
    const playerPosY = afterMoveState.player?.tileY;
    console.log(`\n玩家当前瓦片位置: (${playerPos}, ${playerPosY})`);

    const playerSurrounding = await page.evaluate(() => {
      const mapConfig = (window as any).__MAP_CONFIG__;
      const walkableTiles = mapConfig?.walkableTiles;
      const getState = (window as any).__GAME_STATE__;
      const state = getState ? getState() : null;
      const tileX = state?.player?.tileX;
      const tileY = state?.player?.tileY;

      if (!walkableTiles || !walkableTiles.has) {
        return { error: 'not available' };
      }

      const result = {};
      // 检查玩家周围5x5区域
      for (let dx = -2; dx <= 2; dx++) {
        for (let dy = -2; dy <= 2; dy++) {
          const key = `${tileX + dx},${tileY + dy}`;
          result[key] = walkableTiles.has(key);
        }
      }
      return result;
    });

    console.log('\n=== 玩家周围可行走状态 ===');
    for (let dx = -2; dx <= 2; dx++) {
      let row = '';
      for (let dy = -2; dy <= 2; dy++) {
        const key = `${playerPos + dx},${playerPosY + dy}`;
        const val = playerSurrounding[key];
        row += val ? '✓ ' : '✗ ';
      }
      console.log(`dx=${dx}: ${row}`);
    }

    // 检查门区域的可行走状态
    console.log('\n=== 诊所门区域可行走状态 ===');
    for (const [key, value] of Object.entries(afterMoveState.doorAreaWalkable || {})) {
      console.log(`  ${key}: ${value ? '✓可行走' : '✗不可行走'}`);
    }

    // 按空格键
    console.log('\n按空格键尝试进入诊所...');
    await page.keyboard.press(' ');
    await page.waitForTimeout(2000);

    // 检查场景切换结果
    const afterSpaceState = await page.evaluate(() => {
      const getState = (window as any).__GAME_STATE__;
      const state = getState ? getState() : null;

      return {
        currentScene: state?.currentScene,
        isClinic: state?.currentScene === 'ClinicScene',
        player: state?.player
      };
    });

    console.log('=== 按空格后状态 ===');
    console.log(JSON.stringify(afterSpaceState, null, 2));

    // 检查门交互逻辑
    const doorCheck = await page.evaluate(() => {
      const getState = (window as any).__GAME_STATE__;
      const state = getState ? getState() : null;
      const tileX = state?.player?.tileX;
      const tileY = state?.player?.tileY;

      // 模拟SceneManager.checkDoorInteraction的逻辑
      // 检查玩家位置和相邻位置是否有门
      const mapConfig = (window as any).__MAP_CONFIG__;
      const doors = mapConfig?.doors || [];

      // 检查当前瓦片和相邻瓦片（±2格）
      const doorChecks = [];
      for (let distance = 0; distance <= 2; distance++) {
        const positions = distance === 0
          ? [{ x: tileX, y: tileY }]
          : [
            { x: tileX, y: tileY - distance },  // 上
            { x: tileX, y: tileY + distance },  // 下
            { x: tileX - distance, y: tileY },  // 左
            { x: tileX + distance, y: tileY },  // 右
          ];

        for (const pos of positions) {
          const door = doors.find(d => d.tileX === pos.x && d.tileY === pos.y);
          if (door) {
            doorChecks.push({
              position: `${pos.x},${pos.y}`,
              distance: distance,
              door: door
            });
          }
        }
      }

      return {
        playerPosition: `${tileX},${tileY}`,
        playerTileX: tileX,
        playerTileY: tileY,
        doorsConfigured: doors.length,
        clinicDoorInConfig: doors.some(d => d.tileX === 60 && d.tileY === 8),
        doorsFoundNearPlayer: doorChecks.length,
        doorChecks: doorChecks
      };
    });

    console.log('\n=== 门检测逻辑检查 ===');
    console.log(JSON.stringify(doorCheck, null, 2));

    // 截图保存当前状态
    await page.screenshot({ path: 'test-results/clinic-door-debug.png' });

    // 输出结果
    if (afterSpaceState.isClinic) {
      console.log('✓ 成功进入诊所！');
    } else {
      console.log('✗ 未进入诊所，仍在室外');
      console.log(`当前场景: ${afterSpaceState.currentScene}`);
      console.log(`玩家位置: (${afterSpaceState.player?.tileX}, ${afterSpaceState.player?.tileY})`);
    }

    // 记录测试结果（不强制通过/失败，只收集证据）
    expect(true).toBe(true); // 调试测试总是通过，目的是收集证据
  });
});