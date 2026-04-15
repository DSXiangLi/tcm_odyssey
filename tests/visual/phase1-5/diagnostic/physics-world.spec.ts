// tests/visual/phase1-5/diagnostic/physics-world.spec.ts
/**
 * 物理世界正确检查
 * 使用scene.physics而不是game.physics
 */

import { test, expect } from '@playwright/test';
import { GameLauncher } from '../../utils/game-launcher';

test.describe('物理世界正确检查', () => {
  test.setTimeout(60000);

  test('检查物理世界状态（使用scene.physics）', async ({ page }) => {
    const launcher = new GameLauncher(page);

    await launcher.navigateToGame();
    await launcher.waitForGameReady();
    await launcher.clickStartButton();
    await page.waitForTimeout(3000);

    // 使用scene.physics而不是game.physics
    const physicsState = await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const scene = game?.scene?.scenes?.find(s => s.scene.key === 'TownOutdoorScene');
      const player = scene?.player;

      // 使用scene.physics访问物理世界
      const scenePhysics = scene?.physics;

      return {
        // 场景物理
        scenePhysics: {
          exists: !!scenePhysics,
          hasWorld: !!scenePhysics?.world,
          worldBounds: scenePhysics?.world?.bounds ? {
            x: scenePhysics.world.bounds.x,
            y: scenePhysics.world.bounds.y,
            width: scenePhysics.world.bounds.width,
            height: scenePhysics.world.bounds.height
          } : null,
          isPaused: scenePhysics?.world?.isPaused,
          // 检查step是否正在运行
          stepping: scenePhysics?.world?.stepping
        },
        // 玩家body状态
        playerBody: player?.body ? {
          exists: true,
          type: player.body.constructor?.name,
          enable: player.body.enable,
          immovable: player.body.immovable,
          moves: player.body.moves,
          velocity: { x: player.body.velocity.x, y: player.body.velocity.y },
          position: { x: player.body.position.x, y: player.body.position.y },
          sprite: { x: player.x, y: player.y },
          // 检查offset（sprite和body之间的偏移）
          offset: { x: player.body.offset?.x, y: player.body.offset?.y },
          // 检查size
          size: { width: player.body.width, height: player.body.height }
        } : { exists: false },
        // 游戏帧率
        gameLoop: {
          fps: game?.loop?.fps,
          isRunning: game?.loop?.isRunning
        }
      };
    });

    console.log('\n=== 物理世界状态（正确访问） ===');
    console.log(JSON.stringify(physicsState, null, 2));

    // 分析
    console.log('\n=== 问题分析 ===');

    if (!physicsState.scenePhysics.exists) {
      console.log('[CRITICAL] scene.physics不存在！');
    } else {
      if (!physicsState.scenePhysics.hasWorld) {
        console.log('[CRITICAL] scene.physics.world不存在！');
      }

      if (physicsState.scenePhysics.isPaused) {
        console.log('[CRITICAL] 物理世界已暂停！');
      }
    }

    if (physicsState.playerBody.exists) {
      console.log('玩家body状态:');
      console.log('  enable:', physicsState.playerBody.enable);
      console.log('  moves:', physicsState.playerBody.moves);
      console.log('  immovable:', physicsState.playerBody.immovable);

      // 检查sprite和body位置的差异
      const spriteX = physicsState.playerBody.sprite.x;
      const bodyX = physicsState.playerBody.position.x;
      const offsetX = physicsState.playerBody.offset?.x || 0;

      console.log('\n  sprite.x:', spriteX);
      console.log('  body.position.x:', bodyX);
      console.log('  body.offset.x:', offsetX);
      console.log('  理论上 sprite.x = body.position.x + body.offset.x');

      const expectedSpriteX = bodyX + offsetX;
      console.log('  理论计算:', expectedSpriteX);
      console.log('  是否匹配:', Math.abs(spriteX - expectedSpriteX) < 1);

      // 关键问题：如果moves=true但position不更新，可能是body.offset有问题
      // 或者是Phaser物理引擎的同步机制有问题
    }

    if (physicsState.gameLoop) {
      console.log('\n游戏循环状态:');
      console.log('  fps:', physicsState.gameLoop.fps);
      console.log('  isRunning:', physicsState.gameLoop.isRunning);
    }

    expect(true).toBe(true);
  });

  test('模拟物理更新', async ({ page }) => {
    const launcher = new GameLauncher(page);

    await launcher.navigateToGame();
    await launcher.waitForGameReady();
    await launcher.clickStartButton();
    await page.waitForTimeout(3000);

    console.log('\n=== 手动触发物理更新 ===');

    // 获取初始状态
    const initial = await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const scene = game?.scene?.scenes?.find(s => s.scene.key === 'TownOutdoorScene');
      const player = scene?.player;
      const body = player?.body;

      return {
        spriteX: player?.x,
        bodyX: body?.position?.x,
        velocityX: body?.velocity?.x,
        moves: body?.moves,
        deltaTime: game?.loop?.deltaTime
      };
    });
    console.log('初始状态:', initial);

    // 设置velocity并手动更新物理
    const afterSetVelocity = await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const scene = game?.scene?.scenes?.find(s => s.scene.key === 'TownOutdoorScene');
      const player = scene?.player;
      const body = player?.body;
      const physicsWorld = scene?.physics?.world;

      // 设置velocity
      body.setVelocity(150, 0);

      return {
        velocityX: body?.velocity?.x,
        moves: body?.moves,
        physicsWorldExists: !!physicsWorld,
        physicsWorldPaused: physicsWorld?.isPaused
      };
    });
    console.log('设置velocity后:', afterSetVelocity);

    // 手动调用物理更新（模拟一帧）
    const afterManualUpdate = await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const scene = game?.scene?.scenes?.find(s => s.scene.key === 'TownOutdoorScene');
      const player = scene?.player;
      const body = player?.body as Phaser.Physics.Arcade.Body;
      const physicsWorld = scene?.physics?.world;

      const beforeX = player?.x;

      // 手动计算预期的位置变化
      // velocity = 150, deltaTime ~ 16.67ms (60fps)
      // 位置变化 = velocity * deltaTime / 1000 = 150 * 0.01667 = 2.5px
      const deltaTime = 16.67; // 模拟一帧
      const expectedDelta = 150 * deltaTime / 1000;

      // 检查body.moves是否为true
      if (body.moves) {
        // 如果moves=true，Phaser应该自动更新位置
        // 但看起来没有工作，让我们手动更新body.position
        body.position.x += expectedDelta;

        // Phaser在preUpdate时会同步sprite和body
        // 让我们手动同步
        player.x = body.position.x + body.offset.x;
      }

      return {
        beforeX,
        afterX: player?.x,
        delta: player?.x - beforeX,
        expectedDelta,
        moves: body?.moves
      };
    });
    console.log('手动更新后:', afterManualUpdate);

    // 等待自然帧更新
    await page.waitForTimeout(500);

    const afterWait = await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const scene = game?.scene?.scenes?.find(s => s.scene.key === 'TownOutdoorScene');
      const player = scene?.player;

      return {
        x: player?.x,
        velocityX: player?.body?.velocity?.x
      };
    });
    console.log('等待500ms后:', afterWait);

    expect(true).toBe(true);
  });

  test('检查Phaser物理同步机制', async ({ page }) => {
    const launcher = new GameLauncher(page);

    await launcher.navigateToGame();
    await launcher.waitForGameReady();
    await launcher.clickStartButton();
    await page.waitForTimeout(3000);

    console.log('\n=== 检查Phaser物理同步机制 ===');

    // 在Phaser中，Arcade Physics通过preUpdate同步sprite和body
    // sprite.x = body.position.x + body.offset.x (当body.moves=true时)

    const syncCheck = await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const scene = game?.scene?.scenes?.find(s => s.scene.key === 'TownOutdoorScene');
      const player = scene?.player;
      const body = player?.body as Phaser.Physics.Arcade.Body;

      // 记录初始状态
      const initial = {
        spriteX: player?.x,
        spriteY: player?.y,
        bodyPosX: body?.position?.x,
        bodyPosY: body?.position?.y,
        offsetX: body?.offset?.x,
        offsetY: body?.offset?.y,
        velocityX: body?.velocity?.x,
        moves: body?.moves
      };

      // 设置velocity
      body.setVelocity(150, 0);

      // 强制执行物理更新
      // Phaser在scene.preUpdate中调用physics.world.step(delta)
      // 但如果我们手动修改body.position，sprite不会自动同步
      // 因为同步是在preUpdate中进行的

      // 等待下一帧（让Phaser自然更新）
      return {
        initial,
        afterSetVelocity: {
          velocityX: body?.velocity?.x
        }
      };
    });

    console.log('同步检查:', JSON.stringify(syncCheck, null, 2));

    // 分析sprite和body的关系
    const spriteX = syncCheck.initial.spriteX;
    const bodyX = syncCheck.initial.bodyPosX;
    const offsetX = syncCheck.initial.offsetX;

    console.log('\n=== sprite与body关系分析 ===');
    console.log('sprite.x =', spriteX);
    console.log('body.position.x =', bodyX);
    console.log('body.offset.x =', offsetX);
    console.log('sprite.x - body.position.x =', spriteX - bodyX);

    // 正常情况下：sprite.x = body.position.x + body.offset.x
    // 如果offset.x是正值，sprite应该在body右边
    // 如果offset.x是负值，sprite应该在body左边

    const expectedRelation = bodyX + offsetX;
    console.log('理论计算(sprite.x应该等于):', expectedRelation);
    console.log('实际sprite.x:', spriteX);
    console.log('是否匹配:', Math.abs(spriteX - expectedRelation) < 0.1);

    // 如果不匹配，说明Phaser的同步机制有问题
    if (Math.abs(spriteX - expectedRelation) > 1) {
      console.log('\n[CRITICAL] sprite和body.position不匹配！');
      console.log('这可能导致物理引擎无法正确更新sprite位置');
    }

    expect(true).toBe(true);
  });
});