// tests/visual/phase1-5/diagnostic/velocity-zero.spec.ts
/**
 * 分析velocity被清零的原因
 */

import { test, expect } from '@playwright/test';
import { GameLauncher } from '../../utils/game-launcher';

test.describe('Velocity清零原因分析', () => {
  test.setTimeout(60000);

  test('监控velocity变化和canMoveInDirection结果', async ({ page }) => {
    const launcher = new GameLauncher(page);

    await launcher.navigateToGame();
    await launcher.waitForGameReady();
    await launcher.clickStartButton();
    await page.waitForTimeout(3000);

    console.log('\n=== 详细监控velocity变化 ===');

    // 在浏览器中设置详细监控
    const monitorSetup = await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const scene = game?.scene?.scenes?.find(s => s.scene.key === 'TownOutdoorScene');
      const player = scene?.player;

      // 修复碰撞体
      const body = player?.body as Phaser.Physics.Arcade.Body;
      const PLAYER_SCALE = 0.21476510067114093;
      body.setSize(19 / PLAYER_SCALE, 13 / PLAYER_SCALE);
      body.setOffset(14.5 / PLAYER_SCALE, 51 / PLAYER_SCALE);

      // 创建监控数组
      const monitorLog: Array<{
        frame: number;
        spriteX: number;
        bodyX: number;
        velocityX: number;
        tileX: number;
        isWalkable: boolean;
        canMoveResult: boolean;
        stopCalled: boolean;
      }> = [];

      // 拦截stop方法
      const originalStop = player.stop.bind(player);
      let stopCallCount = 0;
      player.stop = function() {
        stopCallCount++;
        return originalStop();
      };

      // 拦截canMoveInDirection
      const originalCanMove = scene.canMoveInDirection.bind(scene);
      let lastCanMoveResult = true;

      // 记录初始状态
      return {
        initialSpriteX: player?.x,
        initialBodyX: body?.position?.x,
        stopCallCount,
        monitorLog,
        interceptsSetup: true
      };
    });

    console.log('初始状态:', monitorSetup);

    // 按下右键并持续监控
    await page.keyboard.down('ArrowRight');

    // 快速采样20次，每次50ms
    const samples: Array<{
      time: number;
      spriteX: number;
      bodyX: number;
      velocityX: number;
      tileX: number;
      stopCount: number;
    }> = [];

    for (let i = 0; i < 20; i++) {
      await page.waitForTimeout(50);
      const state = await page.evaluate(() => {
        const game = (window as any).__PHASER_GAME__;
        const scene = game?.scene?.scenes?.find(s => s.scene.key === 'TownOutdoorScene');
        const player = scene?.player;
        const body = player?.body as Phaser.Physics.Arcade.Body;

        // 获取canMoveInDirection结果
        const canMoveRight = scene?.canMoveInDirection({ x: 1, y: 0 });

        // 获取当前瓦片位置和可行走状态
        const tileX = Math.floor(player?.x / 32);
        const mapConfig = (window as any).__MAP_CONFIG__;
        const isWalkable = mapConfig?.walkableTiles?.has(`${tileX},${Math.floor(player?.y/32)}`);

        return {
          spriteX: player?.x,
          bodyX: body?.position?.x,
          velocityX: body?.velocity?.x,
          tileX,
          canMoveRight,
          isWalkable,
          // 检查stop是否被调用（通过velocity是否为0但按键仍按下）
          stopIndicated: body?.velocity?.x === 0
        };
      });

      samples.push({
        time: (i + 1) * 50,
        spriteX: state.spriteX,
        bodyX: state.bodyX,
        velocityX: state.velocityX,
        tileX: state.tileX,
        stopCount: state.stopIndicated ? 1 : 0
      });

      if (state.velocityX === 0) {
        console.log(`\n[VELOCITY ZERO] at ${(i+1)*50}ms:`);
        console.log('  spriteX:', state.spriteX);
        console.log('  tileX:', state.tileX);
        console.log('  canMoveRight:', state.canMoveRight);
        console.log('  isWalkable:', state.isWalkable);
      }
    }

    await page.keyboard.up('ArrowRight');

    // 分析结果
    console.log('\n=== 采样结果 ===');
    for (const s of samples) {
      console.log(`${s.time}ms: sprite=${s.spriteX.toFixed(1)}, vel=${s.velocityX.toFixed(1)}, tile=${s.tileX}`);
    }

    // 统计velocity变化
    const velocityZeroFrames = samples.filter(s => s.velocityX === 0);
    const velocityPositiveFrames = samples.filter(s => s.velocityX > 0);
    const positionChangeFrames = samples.filter(s => s.spriteX !== samples[0].spriteX);

    console.log('\n=== 统计 ===');
    console.log('velocity=0的帧数:', velocityZeroFrames.length);
    console.log('velocity>0的帧数:', velocityPositiveFrames.length);
    console.log('position变化的帧数:', positionChangeFrames.length);

    // 最终位置
    const finalPosition = samples[samples.length - 1].spriteX;
    const initialPosition = monitorSetup.initialSpriteX;
    const totalMovement = finalPosition - initialPosition;

    console.log('\n总移动距离:', totalMovement.toFixed(2), 'px');

    if (velocityZeroFrames.length > 0 && velocityPositiveFrames.length > 0) {
      console.log('\n[分析] velocity先有值后变零');
      console.log('可能原因: canMoveInDirection在某个位置返回false');
    } else if (velocityZeroFrames.length === samples.length) {
      console.log('\n[分析] velocity始终为零');
      console.log('可能原因: canMoveInDirection始终返回false');
    } else if (velocityPositiveFrames.length === samples.length) {
      console.log('\n[分析] velocity始终有值');
      console.log('可能原因: 正常移动或stop在按键释放后才调用');
    }

    expect(true).toBe(true);
  });

  test('检查瓦片边界附近的canMoveInDirection', async ({ page }) => {
    const launcher = new GameLauncher(page);

    await launcher.navigateToGame();
    await launcher.waitForGameReady();
    await launcher.clickStartButton();
    await page.waitForTimeout(3000);

    console.log('\n=== 测试瓦片边界附近的canMoveInDirection ===');

    // 模拟不同位置的canMoveInDirection检查
    const boundaryCheck = await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const scene = game?.scene?.scenes?.find(s => s.scene.key === 'TownOutdoorScene');
      const TILE_SIZE = 32;
      const checkDistance = TILE_SIZE * 0.5; // 16

      // 测试不同sprite位置的canMoveInDirection结果
      const testPositions = [
        1520,    // 瓦片47中心
        1522,    // 瓦片47内
        1524,    // 瓦片47内
        1528,    // 瓦片47内，接近边界
        1530,    // 瓦片47边界附近
        1532,    // 瓦片47边界附近
        1536,    // 瓦片48开始
        1538,    // 瓦片48内
        1540,    // 瓦片48内
      ];

      const results = testPositions.map(pos => {
        // 模拟canMoveInDirection逻辑
        const targetX = pos + checkDistance; // 向右检查
        const tileX = Math.floor(targetX / TILE_SIZE);
        const currentTileY = 24; // 出生点的Y

        const positionsToCheck = [
          `${tileX},${currentTileY}`,
          `${tileX + 1},${currentTileY}`,
          `${tileX},${currentTileY}`
        ];

        const mapConfig = (window as any).__MAP_CONFIG__;
        const walkableTiles = mapConfig?.walkableTiles;

        let canMove = false;
        const walkableChecks: Array<{ key: string; walkable: boolean }> = [];

        for (const key of positionsToCheck) {
          const walkable = walkableTiles?.has(key) || false;
          walkableChecks.push({ key, walkable });
          if (walkable) canMove = true;
        }

        return {
          spriteX: pos,
          tileX: Math.floor(pos / TILE_SIZE),
          targetX,
          targetTileX: tileX,
          canMove,
          walkableChecks
        };
      });

      return results;
    });

    console.log('边界检测结果:');
    for (const r of boundaryCheck) {
      console.log(`  spriteX=${r.spriteX}: tile=${r.tileX}, targetTile=${r.targetTileX}, canMove=${r.canMove}`);
      console.log(`    检查: ${r.walkableChecks.map(c => `${c.key}:${c.walkable}`).join(', ')}`);
    }

    // 找出canMove为false的位置
    const blockedPositions = boundaryCheck.filter(r => !r.canMove);
    if (blockedPositions.length > 0) {
      console.log('\n[关键发现] canMoveInDirection在这些位置返回false:');
      blockedPositions.forEach(r => {
        console.log(`  spriteX=${r.spriteX}, targetTile=${r.targetTileX}`);
      });
    } else {
      console.log('\n[OK] 所有测试位置canMoveInDirection都返回true');
    }

    expect(true).toBe(true);
  });
});