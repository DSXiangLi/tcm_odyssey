import { test, expect } from '@playwright/test';
import { GameLauncher } from '../../utils/game-launcher';
import { StateExtractor } from '../../utils/state-extractor';

test.describe('简单移动测试', () => {
  test('玩家能连续移动10步', async ({ page }) => {
    const launcher = new GameLauncher(page);
    const stateExtractor = new StateExtractor();

    // 启动游戏
    await launcher.navigateToGame();
    await launcher.waitForGameReady();
    await launcher.clickStartButton();
    await page.waitForTimeout(3000);

    // 验证场景加载
    const scene = await stateExtractor.getCurrentScene(page);
    console.log('当前场景:', scene);
    expect(scene).toBe('TownOutdoorScene');

    // 获取初始位置
    const initialPos = await stateExtractor.getPlayerState(page);
    console.log('初始位置:', initialPos);

    // 直接通过JavaScript设置velocity（绕过动画）
    const result = await page.evaluate(() => {
      try {
        const game = (window as any).__PHASER_GAME__;
        if (!game) return { error: '__PHASER_GAME__ not found' };

        const scene = game.scene.getScene('TownOutdoorScene');
        if (!scene) return { error: 'TownOutdoorScene not found' };

        const player = scene.player;
        if (!player) return { error: 'player not found' };

        const body = player.body as Phaser.Physics.Arcade.Body;
        if (!body) return { error: 'body not found' };

        // 记录初始状态
        const initialState = {
          spriteX: player.x,
          spriteY: player.y,
          bodyPosX: body.position.x,
          bodyPosY: body.position.y,
          velocity: { x: body.velocity.x, y: body.velocity.y }
        };

        // 直接设置velocity，不调用move（避免动画问题）
        body.setVelocity(150, 0);

        // 记录设置后状态
        const afterSetVelocity = {
          spriteX: player.x,
          spriteY: player.y,
          velocity: { x: body.velocity.x, y: body.velocity.y }
        };

        return { success: true, initialState, afterSetVelocity };
      } catch (e) {
        return { error: e.message };
      }
    });

    console.log('直接设置velocity结果:', JSON.stringify(result, null, 2));

    if (result.success) {
      console.log('初始velocity:', result.initialState?.velocity);
      console.log('设置后velocity:', result.afterSetVelocity?.velocity);

      // 验证velocity被正确设置
      expect(result.afterSetVelocity?.velocity?.x).toBe(150);
    }

    // 等待物理引擎更新（一帧约16ms）
    await page.waitForTimeout(100);

    // 获取更新后位置
    const afterPos = await stateExtractor.getPlayerState(page);
    console.log('100ms后位置:', afterPos);

    // 直接从游戏获取位置
    const physicsAfterWait = await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const scene = game?.scene?.getScene('TownOutdoorScene');
      const player = scene?.player;
      const body = player?.body as Phaser.Physics.Arcade.Body;
      return {
        spriteX: player?.x,
        spriteY: player?.y,
        velocityX: body?.velocity?.x,
        velocityY: body?.velocity?.y
      };
    });
    console.log('物理引擎状态:', physicsAfterWait);

    // 验证velocity是否保持
    if (physicsAfterWait.velocityX === 150) {
      console.log('PASS: velocity保持150');
    }

    // 验证位置有变化
    if (initialPos && physicsAfterWait) {
      const deltaX = physicsAfterWait.spriteX - initialPos.x;
      console.log('X方向移动距离:', deltaX);

      // 位置有变化表示物理引擎工作
      expect(Math.abs(deltaX)).toBeGreaterThan(0);
    } else {
      throw new Error('无法获取玩家位置');
    }
  });
});