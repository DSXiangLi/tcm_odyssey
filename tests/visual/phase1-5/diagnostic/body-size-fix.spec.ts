// tests/visual/phase1-5/diagnostic/body-size-fix.spec.ts
/**
 * 碰撞体尺寸问题修复测试
 * 验证setScale对body.setSize的影响
 */

import { test, expect } from '@playwright/test';
import { GameLauncher } from '../../utils/game-launcher';

test.describe('碰撞体尺寸问题修复测试', () => {
  test.setTimeout(60000);

  test('分析body.size与scale的关系', async ({ page }) => {
    const launcher = new GameLauncher(page);

    await launcher.navigateToGame();
    await launcher.waitForGameReady();
    await launcher.clickStartButton();
    await page.waitForTimeout(3000);

    // 获取详细信息
    const bodyDetails = await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const scene = game?.scene?.scenes?.find(s => s.scene.key === 'TownOutdoorScene');
      const player = scene?.player;
      const body = player?.body as Phaser.Physics.Arcade.Body;

      // Phaser中body和sprite的关系
      // sprite.scaleX/Y 影响视觉尺寸
      // body.width/height 是碰撞体尺寸
      // 但setSize可能在内部被scale影响

      return {
        // Sprite尺寸
        sprite: {
          scaleX: player?.scaleX,
          scaleY: player?.scaleY,
          width: player?.width,  // 原始frame宽度
          height: player?.height, // 原始frame高度
          displayWidth: player?.displayWidth,  // 显示宽度（缩放后）
          displayHeight: player?.displayHeight // 显示高度（缩放后）
        },
        // Body尺寸
        body: {
          width: body?.width,
          height: body?.height,
          halfWidth: body?.halfWidth,
          halfHeight: body?.halfHeight,
          // 原始body尺寸（如果有的话）
          sourceWidth: body?.sourceWidth,
          sourceHeight: body?.sourceHeight,
          // offset
          offset: { x: body?.offset?.x, y: body?.offset?.y },
          // position
          position: { x: body?.position?.x, y: body?.position?.y },
          // center
          center: { x: body?.center?.x, y: body?.center?.y }
        },
        // 计算验证
        analysis: {
          // 如果setSize传入19.24，实际body.width是4.13
          // 那么 19.24 * scaleX = 19.24 * 0.214 = 4.11 ≈ 4.13
          // 说明setSize参数被scale缩放了
          expectedSizeIfScaled: {
            width: 19.24 * (player?.scaleX || 1),
            height: 12.8 * (player?.scaleY || 1)
          },
          actualSize: {
            width: body?.width,
            height: body?.height
          },
          match: Math.abs((19.24 * (player?.scaleX || 1)) - (body?.width || 0)) < 1
        }
      };
    });

    console.log('\n=== Sprite尺寸 ===');
    console.log(JSON.stringify(bodyDetails.sprite, null, 2));

    console.log('\n=== Body尺寸 ===');
    console.log(JSON.stringify(bodyDetails.body, null, 2));

    console.log('\n=== 分析 ===');
    console.log('如果setSize(19.24, 12.8)被scale(0.214)缩放:');
    console.log('  预期width:', bodyDetails.analysis.expectedSizeIfScaled.width.toFixed(2));
    console.log('  实际width:', bodyDetails.analysis.actualSize.width.toFixed(2));
    console.log('  是否匹配:', bodyDetails.analysis.match);

    if (bodyDetails.analysis.match) {
      console.log('\n[结论] body.setSize()的参数被sprite.scale自动缩放了！');
      console.log('这是Phaser Arcade Physics的特性');
      console.log('修复方案: setSize时传入未缩放的值，或先设置body再setScale');
    }

    expect(true).toBe(true);
  });

  test('验证修复方案：重新设置body.size', async ({ page }) => {
    const launcher = new GameLauncher(page);

    await launcher.navigateToGame();
    await launcher.waitForGameReady();
    await launcher.clickStartButton();
    await page.waitForTimeout(3000);

    console.log('\n=== 测试修复方案 ===');

    // 尝试修复：使用更大的碰撞体
    const fixResult = await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const scene = game?.scene?.scenes?.find(s => s.scene.key === 'TownOutdoorScene');
      const player = scene?.player;
      const body = player?.body as Phaser.Physics.Arcade.Body;

      const beforeFix = {
        width: body?.width,
        height: body?.height,
        position: { x: player?.x, y: player?.y }
      };

      // 方案1：使用更大的碰撞体（补偿scale）
      // 玩家frame原始尺寸是224x298
      // 我们需要碰撞体是19x13像素（显示尺寸）
      // 由于setSize会被scale缩放，我们需要传入 19/0.214 = 89 和 13/0.214 = 61
      const targetDisplayWidth = 19;
      const targetDisplayHeight = 13;
      const scale = player?.scaleX || 0.214;

      // 补偿scale的影响
      const sizeToSet = {
        width: targetDisplayWidth / scale,
        height: targetDisplayHeight / scale
      };

      body.setSize(sizeToSet.width, sizeToSet.height);

      // 调整offset（也需要补偿scale）
      const scaledWidth = 224 * scale;  // 48
      const scaledHeight = 298 * scale; // 64
      const offsetX = (scaledWidth - targetDisplayWidth) / 2 / scale;
      const offsetY = (scaledHeight - targetDisplayHeight) / scale;

      body.setOffset(offsetX, offsetY);

      const afterFix = {
        width: body?.width,
        height: body?.height,
        position: { x: player?.x, y: player?.y }
      };

      return {
        beforeFix,
        sizeToSet,
        afterFix,
        scale
      };
    });

    console.log('修复前:', fixResult.beforeFix);
    console.log('设置值:', fixResult.sizeToSet);
    console.log('修复后:', fixResult.afterFix);
    console.log('scale:', fixResult.scale);

    // 检查修复后的碰撞体尺寸
    const expectedWidth = fixResult.sizeToSet.width * fixResult.scale;
    console.log('\n预期宽度(设置值*scale):', expectedWidth.toFixed(2));
    console.log('实际宽度:', fixResult.afterFix.width.toFixed(2));

    // 现在尝试移动
    console.log('\n=== 修复后尝试移动 ===');
    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(500);

    const moveResult = await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const scene = game?.scene?.scenes?.find(s => s.scene.key === 'TownOutdoorScene');
      const player = scene?.player;

      return {
        position: { x: player?.x, y: player?.y },
        velocity: { x: player?.body?.velocity?.x, y: player?.body?.velocity?.y }
      };
    });

    console.log('按下右键500ms后:', moveResult);

    await page.keyboard.up('ArrowRight');

    // 检查位置变化
    const positionChange = moveResult.position.x - fixResult.afterFix.position.x;
    console.log('\n位置变化:', positionChange.toFixed(1), 'px');

    if (positionChange > 0) {
      console.log('[SUCCESS] 玩家成功移动了！');
    } else {
      console.log('[PROBLEM] 玩家仍然无法移动');
    }

    expect(true).toBe(true);
  });

  test('验证另一个修复方案：使用原始frame尺寸百分比', async ({ page }) => {
    const launcher = new GameLauncher(page);

    await launcher.navigateToGame();
    await launcher.waitForGameReady();
    await launcher.clickStartButton();
    await page.waitForTimeout(3000);

    console.log('\n=== 方案2：使用原始frame尺寸百分比 ===');

    const fixResult = await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const scene = game?.scene?.scenes?.find(s => s.scene.key === 'TownOutdoorScene');
      const player = scene?.player;
      const body = player?.body as Phaser.Physics.Arcade.Body;

      const beforeFix = {
        width: body?.width,
        height: body?.height,
        position: { x: player?.x, y: player?.y }
      };

      // 方案2：使用原始frame尺寸的百分比
      // 原始frame: 224x298
      // 我们希望显示碰撞体是19x13像素
      // 即原始frame的 19/48 ≈ 40% 宽度和 13/64 ≈ 20% 高度
      // 但由于scale是0.214，原始frame 224 显示为 48
      // 所以碰撞体应该占原始frame的: 19/224 ≈ 8.5% 和 13/298 ≈ 4.3%

      // Phaser中setSize直接设置body的source尺寸
      // 然后scale会影响显示尺寸

      // 更简单的方法：直接设置我们想要的显示尺寸
      // 由于scale=0.214，setSize(89, 61)会显示为 89*0.214=19, 61*0.214=13
      const PLAYER_FRAME_WIDTH = 224;
      const PLAYER_FRAME_HEIGHT = 298;
      const PLAYER_SCALE = 64 / PLAYER_FRAME_HEIGHT;

      const targetDisplayWidth = 19;
      const targetDisplayHeight = 13;

      // 传入未缩放的值
      const unScaledWidth = targetDisplayWidth / PLAYER_SCALE;  // 19 / 0.214 ≈ 89
      const unScaledHeight = targetDisplayHeight / PLAYER_SCALE; // 13 / 0.214 ≈ 61

      body.setSize(unScaledWidth, unScaledHeight);

      // 设置offset（相对于未缩放的原点）
      // offset应该使碰撞体在sprite底部居中
      // 碰撞体显示位置 = body.position + offset * scale
      // 我们希望offset在显示坐标系中是 (48-19)/2=14.5, 64-13=51
      // 所以在未缩放坐标系中：offset = 14.5/0.214=67.8, 51/0.214=238

      const scaledWidth = PLAYER_FRAME_WIDTH * PLAYER_SCALE;  // 48
      const scaledHeight = PLAYER_FRAME_HEIGHT * PLAYER_SCALE; // 64

      const offsetDisplayX = (scaledWidth - targetDisplayWidth) / 2;  // 14.5
      const offsetDisplayY = scaledHeight - targetDisplayHeight;  // 51

      const offsetX = offsetDisplayX / PLAYER_SCALE;  // 67.8
      const offsetY = offsetDisplayY / PLAYER_SCALE;  // 238

      body.setOffset(offsetX, offsetY);

      const afterFix = {
        width: body?.width,
        height: body?.height,
        offset: { x: body?.offset?.x, y: body?.offset?.y },
        position: { x: player?.x, y: player?.y }
      };

      return {
        beforeFix,
        unScaledSize: { width: unScaledWidth, height: unScaledHeight },
        offset: { x: offsetX, y: offsetY },
        afterFix,
        PLAYER_SCALE
      };
    });

    console.log('修复前:', fixResult.beforeFix);
    console.log('未缩放尺寸:', fixResult.unScaledSize);
    console.log('offset:', fixResult.offset);
    console.log('修复后:', fixResult.afterFix);

    // 验证显示尺寸
    const displayWidth = fixResult.afterFix.width;
    const displayHeight = fixResult.afterFix.height;
    console.log('\n显示尺寸:', displayWidth.toFixed(2), 'x', displayHeight.toFixed(2));

    // 尝试移动
    console.log('\n=== 尝试移动 ===');
    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(500);

    const moveResult = await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const scene = game?.scene?.scenes?.find(s => s.scene.key === 'TownOutdoorScene');
      const player = scene?.player;

      return {
        position: { x: player?.x, y: player?.y },
        velocity: { x: player?.body?.velocity?.x, y: player?.body?.velocity?.y },
        bodyPos: { x: player?.body?.position?.x, y: player?.body?.position?.y }
      };
    });

    console.log('按下右键500ms后:', moveResult);

    await page.keyboard.up('ArrowRight');

    const positionChange = moveResult.position.x - fixResult.afterFix.position.x;
    console.log('\n位置变化:', positionChange.toFixed(1), 'px');

    if (positionChange > 0) {
      console.log('[SUCCESS] 玩家成功移动！');
    } else {
      console.log('[PROBLEM] 玩家仍然无法移动');
    }

    expect(true).toBe(true);
  });
});