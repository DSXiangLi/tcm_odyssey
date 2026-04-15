// tests/visual/phase1-5/diagnostic/sprite-sync.spec.ts
/**
 * 检查Phaser sprite与body同步问题
 */

import { test, expect } from '@playwright/test';
import { GameLauncher } from '../../utils/game-launcher';

test.describe('Sprite与Body同步问题检查', () => {
  test.setTimeout(60000);

  test('检查是否有地方在重置sprite.position', async ({ page }) => {
    const launcher = new GameLauncher(page);

    await launcher.navigateToGame();
    await launcher.waitForGameReady();
    await launcher.clickStartButton();
    await page.waitForTimeout(3000);

    console.log('\n=== 监控位置变化 ===');

    // 设置velocity并监控变化
    const monitorResult = await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const scene = game?.scene?.scenes?.find(s => s.scene.key === 'TownOutdoorScene');
      const player = scene?.player;
      const body = player?.body as Phaser.Physics.Arcade.Body;

      // 先修复碰撞体尺寸
      const PLAYER_SCALE = 0.21476510067114093;
      const targetDisplayWidth = 19;
      const targetDisplayHeight = 13;
      const unScaledWidth = targetDisplayWidth / PLAYER_SCALE;
      const unScaledHeight = targetDisplayHeight / PLAYER_SCALE;
      body.setSize(unScaledWidth, unScaledHeight);

      const scaledWidth = 224 * PLAYER_SCALE;
      const scaledHeight = 298 * PLAYER_SCALE;
      const offsetDisplayX = (scaledWidth - targetDisplayWidth) / 2;
      const offsetDisplayY = scaledHeight - targetDisplayHeight;
      body.setOffset(offsetDisplayX / PLAYER_SCALE, offsetDisplayY / PLAYER_SCALE);

      // 记录初始状态
      const history: Array<{
        frame: number;
        spritePos: { x: number; y: number };
        bodyPos: { x: number; y: number };
        velocity: { x: number; y: number };
        bodyEnable: boolean;
        bodyMoves: boolean;
      }> = [];

      // 设置velocity
      body.setVelocity(150, 0);

      // 记录设置velocity后的立即状态
      const initialFrame = {
        frame: 0,
        spritePos: { x: player?.x, y: player?.y },
        bodyPos: { x: body?.position?.x, y: body?.position?.y },
        velocity: { x: body?.velocity?.x, y: body?.velocity?.y },
        bodyEnable: body?.enable,
        bodyMoves: body?.moves
      };
      history.push(initialFrame);

      return {
        initialFrame,
        history,
        PLAYER_SCALE,
        bodyFixed: {
          width: body?.width,
          height: body?.height
        }
      };
    });

    console.log('设置velocity后的初始状态:');
    console.log(JSON.stringify(monitorResult.initialFrame, null, 2));
    console.log('碰撞体尺寸:', monitorResult.bodyFixed);

    // 等待物理更新发生
    await page.waitForTimeout(500);

    // 获取等待后的状态
    const afterWaitResult = await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const scene = game?.scene?.scenes?.find(s => s.scene.key === 'TownOutdoorScene');
      const player = scene?.player;
      const body = player?.body as Phaser.Physics.Arcade.Body;

      return {
        spritePos: { x: player?.x, y: player?.y },
        bodyPos: { x: body?.position?.x, y: body?.position?.y },
        velocity: { x: body?.velocity?.x, y: body?.velocity?.y },
        offset: { x: body?.offset?.x, y: body?.offset?.y },
        // 检查body是否有更新
        wasMoving: body?.wasMoving,
        // 检查是否有物理更新标志
        _dx: body?._dx,
        _dy: body?._dy,
        _dvx: body?._dvx,
        _dvy: body?._dvy
      };
    });

    console.log('\n等待500ms后状态:');
    console.log(JSON.stringify(afterWaitResult, null, 2));

    // 分析变化
    console.log('\n=== 分析 ===');
    const spriteChange = afterWaitResult.spritePos.x - monitorResult.initialFrame.spritePos.x;
    const bodyChange = afterWaitResult.bodyPos.x - monitorResult.initialFrame.bodyPos.x;

    console.log('sprite位置变化:', spriteChange.toFixed(2), 'px');
    console.log('body位置变化:', bodyChange.toFixed(2), 'px');

    if (bodyChange > 0 && spriteChange === 0) {
      console.log('\n[关键发现] body.position有变化，但sprite.position没变化');
      console.log('说明Phaser的同步机制没有工作');
      console.log('可能原因:');
      console.log('  1. preUpdate没有被正确调用');
      console.log('  2. scene的sceneStatus有问题');
      console.log('  3. 物理世界step正常，但sprite同步被阻断');
    } else if (bodyChange === 0) {
      console.log('\n[问题] body.position也没有变化');
      console.log('说明物理引擎的step也没有更新body');
    }

    // 检查Phaser的内部更新流程
    console.log('\n=== 检查Phaser更新流程 ===');

    const updateCheck = await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const scene = game?.scene?.scenes?.find(s => s.scene.key === 'TownOutdoorScene');
      const physics = scene?.physics;
      const world = physics?.world;

      return {
        // 场景状态
        sceneStatus: {
          isActive: scene?.scene?.isActive,
          isPaused: scene?.scene?.isPaused,
          isSleeping: scene?.scene?.isSleeping,
          status: scene?.scene?.status
        },
        // 物理世界状态
        worldStatus: {
          isPaused: world?.isPaused,
          running: world?.running,
          stepping: world?.stepping,
          enabled: world?.enabled,
          _step: world?._step
        },
        // 游戏循环状态
        gameLoop: {
          isRunning: game?.loop?.isRunning,
          isPaused: game?.loop?.isPaused,
          fps: game?.loop?.fps,
          delta: game?.loop?.delta
        },
        // 检查是否有其他地方设置位置
        playerLocked: scene?.player?.body?.locked
      };
    });

    console.log(JSON.stringify(updateCheck, null, 2));

    if (updateCheck.sceneStatus.isPaused || updateCheck.sceneStatus.isSleeping) {
      console.log('\n[CRITICAL] 场景已暂停或睡眠！');
    }

    if (updateCheck.worldStatus.isPaused || !updateCheck.worldStatus.enabled) {
      console.log('\n[CRITICAL] 物理世界已暂停或禁用！');
    }

    if (updateCheck.gameLoop.isPaused) {
      console.log('\n[CRITICAL] 游戏循环已暂停！');
    }

    expect(true).toBe(true);
  });

  test('手动触发物理step', async ({ page }) => {
    const launcher = new GameLauncher(page);

    await launcher.navigateToGame();
    await launcher.waitForGameReady();
    await launcher.clickStartButton();
    await page.waitForTimeout(3000);

    console.log('\n=== 手动触发物理step ===');

    const stepResult = await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const scene = game?.scene?.scenes?.find(s => s.scene.key === 'TownOutdoorScene');
      const player = scene?.player;
      const body = player?.body as Phaser.Physics.Arcade.Body;
      const physics = scene?.physics;
      const world = physics?.world;

      // 先修复碰撞体
      const PLAYER_SCALE = 0.21476510067114093;
      body.setSize(19 / PLAYER_SCALE, 13 / PLAYER_SCALE);
      body.setOffset(14.5 / PLAYER_SCALE, 51 / PLAYER_SCALE);

      // 设置velocity
      body.setVelocity(150, 0);

      const before = {
        spriteX: player?.x,
        bodyX: body?.position?.x,
        velocityX: body?.velocity?.x
      };

      // 手动调用物理step
      // Phaser内部：world.step(delta)更新所有body
      // 然后 scene.preUpdate中会同步sprite和body
      const delta = 16.67; // 60fps的帧时间

      // 尝试手动调用step
      if (world && world.step) {
        world.step(delta);
      }

      // 手动同步sprite和body（模拟Phaser的preUpdate）
      // Phaser内部逻辑：
      // if (body.moves) {
      //   sprite.x = body.position.x + body.offset.x * sprite.scaleX
      // }
      if (body.moves) {
        player.x = body.position.x + body.offset.x * player.scaleX;
        player.y = body.position.y + body.offset.y * player.scaleY;
      }

      const after = {
        spriteX: player?.x,
        bodyX: body?.position?.x,
        velocityX: body?.velocity?.x
      };

      return {
        before,
        after,
        delta,
        worldExists: !!world,
        worldHasStep: !!world?.step
      };
    });

    console.log('手动step结果:', JSON.stringify(stepResult, null, 2));

    const spriteChange = stepResult.after.spriteX - stepResult.before.spriteX;
    console.log('\nsprite变化:', spriteChange.toFixed(2), 'px');

    if (spriteChange > 0) {
      console.log('[SUCCESS] 手动同步后sprite位置变化了');
    } else {
      console.log('[PROBLEM] 手动同步后sprite位置仍没变化');
    }

    expect(true).toBe(true);
  });

  test('检查enforceWalkablePosition的影响', async ({ page }) => {
    const launcher = new GameLauncher(page);

    await launcher.navigateToGame();
    await launcher.waitForGameReady();
    await launcher.clickStartButton();
    await page.waitForTimeout(3000);

    console.log('\n=== 检查enforceWalkablePosition ===');

    // 检查enforceWalkablePosition的逻辑
    const enforceCheck = await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const scene = game?.scene?.scenes?.find(s => s.scene.key === 'TownOutdoorScene');
      const player = scene?.player;
      const TILE_SIZE = 32;

      // 检查当前瓦片位置是否可行走
      const currentTileX = Math.floor(player?.x / TILE_SIZE);
      const currentTileY = Math.floor(player?.y / TILE_SIZE);
      const currentKey = `${currentTileX},${currentTileY}`;

      // 检查walkableTiles
      const mapConfig = (window as any).__MAP_CONFIG__;
      const walkableTiles = mapConfig?.walkableTiles;

      let isWalkable = false;
      if (walkableTiles && typeof walkableTiles.has === 'function') {
        isWalkable = walkableTiles.has(currentKey);
      }

      // 模拟移动后检查
      const movedTileX = Math.floor((player?.x + 10) / TILE_SIZE);
      const movedTileY = currentTileY;
      const movedKey = `${movedTileX},${movedTileY}`;
      let movedWalkable = false;
      if (walkableTiles && typeof walkableTiles.has === 'function') {
        movedWalkable = walkableTiles.has(movedKey);
      }

      return {
        currentPos: { x: player?.x, y: player?.y },
        currentTile: { x: currentTileX, y: currentTileY },
        currentKey,
        isWalkable,
        movedTile: { x: movedTileX, y: movedTileY },
        movedKey,
        movedWalkable,
        mapConfigExists: !!mapConfig,
        walkableTilesExists: !!walkableTiles,
        walkableTilesType: walkableTiles?.constructor?.name
      };
    });

    console.log('enforceWalkablePosition检查结果:');
    console.log(JSON.stringify(enforceCheck, null, 2));

    if (enforceCheck.isWalkable) {
      console.log('\n[OK] 当前位置是可行走的');
      console.log('enforceWalkablePosition不会推回玩家');
    } else {
      console.log('\n[CRITICAL] 当前位置不可行走！');
      console.log('enforceWalkablePosition会每帧推回玩家');
    }

    // 尝试禁用enforceWalkablePosition的影响
    console.log('\n=== 尝试临时禁用位置检查 ===');

    const disableResult = await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const scene = game?.scene?.scenes?.find(s => s.scene.key === 'TownOutdoorScene');
      const player = scene?.player;
      const body = player?.body as Phaser.Physics.Arcade.Body;

      // 修复碰撞体
      const PLAYER_SCALE = 0.21476510067114093;
      body.setSize(19 / PLAYER_SCALE, 13 / PLAYER_SCALE);
      body.setOffset(14.5 / PLAYER_SCALE, 51 / PLAYER_SCALE);

      // 记录初始位置
      const initialX = player?.x;

      // 设置velocity并手动移动
      body.setVelocity(150, 0);

      // 直接修改sprite和body位置（绕过物理引擎）
      player.x = initialX + 75;  // 移动75像素
      body.position.x = player.x - body.offset.x * player.scaleX;

      return {
        initialX,
        afterManualMove: player?.x,
        change: player?.x - initialX,
        velocityX: body?.velocity?.x
      };
    });

    console.log('手动移动结果:', JSON.stringify(disableResult, null, 2));

    // 等待一帧看看是否被推回
    await page.waitForTimeout(100);

    const afterFrameResult = await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const scene = game?.scene?.scenes?.find(s => s.scene.key === 'TownOutdoorScene');
      const player = scene?.player;

      return {
        x: player?.x
      };
    });

    console.log('等待一帧后:', afterFrameResult);

    if (afterFrameResult.x !== disableResult.afterManualMove) {
      console.log('\n[CRITICAL] 位置被自动推回了！');
      console.log('说明enforceWalkablePosition或其他逻辑在每帧重置位置');
      console.log('推回距离:', disableResult.afterManualMove - afterFrameResult.x);
    } else {
      console.log('\n[OK] 手动移动的位置没有被推回');
    }

    expect(true).toBe(true);
  });
});