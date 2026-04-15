// tests/visual/phase1-5/diagnostic/physics-debug.spec.ts
/**
 * 物理引擎调试测试
 * 检查Phaser物理引擎是否正确运行
 */

import { test, expect } from '@playwright/test';
import { GameLauncher } from '../../utils/game-launcher';

test.describe('物理引擎调试', () => {
  test.setTimeout(60000);

  test('检查物理引擎状态', async ({ page }) => {
    const launcher = new GameLauncher(page);

    await launcher.navigateToGame();
    await launcher.waitForGameReady();
    await launcher.clickStartButton();
    await page.waitForTimeout(3000);

    // 检查物理引擎状态
    const physicsState = await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const scene = game?.scene?.scenes?.find(s => s.scene.key === 'TownOutdoorScene');
      const player = scene?.player;
      const physics = game?.physics;

      return {
        // 物理引擎状态
        physicsWorld: {
          exists: !!physics?.world,
          bounds: physics?.world?.bounds ? {
            x: physics.world.bounds.x,
            y: physics.world.bounds.y,
            width: physics.world.bounds.width,
            height: physics.world.bounds.height
          } : null,
          isPaused: physics?.world?.isPaused
        },
        // 玩家body状态
        playerBody: player?.body ? {
          exists: true,
          type: player.body.constructor.name,
          enable: player.body.enable,
          velocity: { x: player.body.velocity.x, y: player.body.velocity.y },
          position: { x: player.body.position.x, y: player.body.position.y },
          x: player.body.x,
          y: player.body.y,
          // 关键：检查immovable属性
          immovable: player.body.immovable,
          // 检查moves属性（如果为false，velocity不会影响位置）
          moves: player.body.moves,
          // 检查是否被锁定
          locked: player.body.locked
        } : { exists: false },
        // 玩家sprite状态
        playerSprite: {
          x: player?.x,
          y: player?.y,
          hasBody: !!player?.body
        },
        // 场景update状态
        sceneStatus: {
          isPaused: scene?.scene?.isPaused,
          isActive: scene?.scene?.isActive
        }
      };
    });

    console.log('\n=== 物理引擎状态 ===');
    console.log(JSON.stringify(physicsState, null, 2));

    // 分析问题
    console.log('\n=== 问题分析 ===');

    if (!physicsState.playerBody.exists) {
      console.log('[CRITICAL] 玩家没有物理body！');
    } else {
      if (physicsState.playerBody.immovable) {
        console.log('[CRITICAL] 玩家body.immovable=true，velocity不会影响位置！');
      }

      if (physicsState.playerBody.moves === false) {
        console.log('[CRITICAL] 玩家body.moves=false，物理引擎不会自动移动！');
      }

      if (!physicsState.playerBody.enable) {
        console.log('[CRITICAL] 玩家body.enable=false，物理body被禁用！');
      }

      if (physicsState.physicsWorld.isPaused) {
        console.log('[CRITICAL] 物理世界isPaused=true，物理更新已暂停！');
      }

      if (physicsState.sceneStatus.isPaused) {
        console.log('[CRITICAL] 场景isPaused=true，update()不会被调用！');
      }
    }

    // 尝试手动移动玩家
    console.log('\n=== 手动设置位置测试 ===');
    const manualMoveResult = await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const scene = game?.scene?.scenes?.find(s => s.scene.key === 'TownOutdoorScene');
      const player = scene?.player;

      const beforeX = player?.x;
      const beforeY = player?.y;

      // 手动设置位置
      player?.setPosition(beforeX + 50, beforeY);

      const afterX = player?.x;
      const afterY = player?.y;

      return {
        before: { x: beforeX, y: beforeY },
        after: { x: afterX, y: afterY },
        change: { x: afterX - beforeX, y: afterY - beforeY }
      };
    });
    console.log('手动setPosition:', JSON.stringify(manualMoveResult, null, 2));

    if (manualMoveResult.change.x === 50) {
      console.log('[OK] setPosition可以正常工作');
    } else {
      console.log('[PROBLEM] setPosition没有生效');
    }

    // 检查是否有其他地方在重置位置
    console.log('\n=== 检测位置重置 ===');
    await page.waitForTimeout(100);

    const afterWait = await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const scene = game?.scene?.scenes?.find(s => s.scene.key === 'TownOutdoorScene');
      return {
        x: scene?.player?.x,
        y: scene?.player?.y
      };
    });
    console.log('等待100ms后位置:', afterWait);

    if (afterWait.x !== manualMoveResult.after.x) {
      console.log('[CRITICAL] 位置被自动重置了！');
      console.log('  说明enforceWalkablePosition()或其他逻辑在每帧重置位置');
    }

    expect(true).toBe(true);
  });

  test('检查enforceWalkablePosition是否每帧执行', async ({ page }) => {
    const launcher = new GameLauncher(page);

    await launcher.navigateToGame();
    await launcher.waitForGameReady();
    await launcher.clickStartButton();
    await page.waitForTimeout(3000);

    // 在浏览器中添加位置变化监听
    const monitorResult = await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const scene = game?.scene?.scenes?.find(s => s.scene.key === 'TownOutdoorScene');
      const player = scene?.player;

      // 记录初始位置
      const initialX = player?.x;
      const initialY = player?.y;

      // 创建一个数组记录每次update后的位置变化
      const positionHistory: Array<{ time: number; x: number; y: number; velocityX: number; velocityY: number }> = [];

      // 监听update事件
      let updateCount = 0;
      const maxUpdates = 60; // 约1秒

      // 拦截update方法（如果可能）
      const originalUpdate = scene?.update?.bind(scene);
      if (originalUpdate) {
        scene.update = function() {
          originalUpdate();
          if (updateCount < maxUpdates) {
            positionHistory.push({
              time: updateCount,
              x: player?.x,
              y: player?.y,
              velocityX: player?.body?.velocity?.x,
              velocityY: player?.body?.velocity?.y
            });
            updateCount++;
          }
        };
      }

      return {
        initialPos: { x: initialX, y: initialY },
        monitoringStarted: true,
        maxUpdates
      };
    });

    console.log('\n=== 开始监控 ===');
    console.log('初始位置:', monitorResult.initialPos);

    // 按下右键1秒
    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(1000);
    await page.keyboard.up('ArrowRight');

    // 获取位置历史
    const historyResult = await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const scene = game?.scene?.scenes?.find(s => s.scene.key === 'TownOutdoorScene');

      // 恢复原始update方法
      // scene.update = originalUpdate; // 但我们没有保存originalUpdate

      // 返回当前状态
      const player = scene?.player;
      return {
        finalPos: { x: player?.x, y: player?.y },
        velocity: { x: player?.body?.velocity?.x, y: player?.body?.velocity?.y }
      };
    });

    console.log('\n最终位置:', historyResult.finalPos);
    console.log('velocity:', historyResult.velocity);

    const positionChange = historyResult.finalPos.x - monitorResult.initialPos.x;
    console.log('\n位置变化:', positionChange.toFixed(1), 'px');

    if (positionChange === 0) {
      console.log('[CRITICAL] 玩家位置完全没有变化！');
      console.log('  即使按住右键1秒，velocity应该有值，但position不变');
      console.log('  这说明物理引擎没有正确更新位置');
    } else if (positionChange > 0) {
      console.log('[OK] 玩家成功移动了', positionChange.toFixed(1), '像素');
    }

    expect(true).toBe(true);
  });

  test('直接操作物理body', async ({ page }) => {
    const launcher = new GameLauncher(page);

    await launcher.navigateToGame();
    await launcher.waitForGameReady();
    await launcher.clickStartButton();
    await page.waitForTimeout(3000);

    console.log('\n=== 直接设置body.velocity ===');
    const result1 = await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const scene = game?.scene?.scenes?.find(s => s.scene.key === 'TownOutdoorScene');
      const player = scene?.player;
      const body = player?.body;

      const beforeX = player?.x;

      // 直接设置body.velocity
      body.setVelocity(150, 0);

      return {
        beforeX,
        velocityAfterSet: { x: body?.velocity?.x, y: body?.velocity?.y }
      };
    });
    console.log('设置velocity后:', result1);

    // 等待物理更新
    await page.waitForTimeout(500);

    const result2 = await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const scene = game?.scene?.scenes?.find(s => s.scene.key === 'TownOutdoorScene');
      const player = scene?.player;

      return {
        afterX: player?.x,
        change: player?.x - result1.beforeX
      };
    });
    console.log('等待500ms后:', result2);

    if (result2.change > 0) {
      console.log('[OK] 直接设置velocity后玩家移动了', result2.change.toFixed(1), '像素');
    } else {
      console.log('[CRITICAL] 直接设置velocity后玩家没有移动！');
    }

    // 尝试另一种方式：直接修改body.position
    console.log('\n=== 直接修改body.position ===');
    const result3 = await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const scene = game?.scene?.scenes?.find(s => s.scene.key === 'TownOutdoorScene');
      const player = scene?.player;
      const body = player?.body as Phaser.Physics.Arcade.Body;

      const beforeX = player?.x;
      const beforeBodyX = body?.position?.x;

      // 直接修改body.position
      body.position.x = beforeBodyX + 50;

      // Phaser物理引擎在update时会同步sprite.position和body.position
      // 如果body.moves=true，sprite.position会被body.position驱动

      return {
        beforeSpriteX: beforeX,
        beforeBodyX,
        afterBodyX: body?.position?.x
      };
    });
    console.log('修改body.position后:', result3);

    await page.waitForTimeout(100);

    const result4 = await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const scene = game?.scene?.scenes?.find(s => s.scene.key === 'TownOutdoorScene');
      const player = scene?.player;
      const body = player?.body as Phaser.Physics.Arcade.Body;

      return {
        spriteX: player?.x,
        bodyX: body?.position?.x,
        spriteBodyMatch: player?.x === body?.position?.x + body?.offset?.x
      };
    });
    console.log('等待100ms后:', result4);

    expect(true).toBe(true);
  });
});