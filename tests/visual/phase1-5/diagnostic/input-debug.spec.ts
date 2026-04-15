// tests/visual/phase1-5/diagnostic/input-debug.spec.ts
/**
 * 键盘输入调试测试
 * 检查Phaser键盘事件是否被正确接收
 */

import { test, expect } from '@playwright/test';
import { GameLauncher } from '../../utils/game-launcher';

test.describe('键盘输入调试', () => {
  test.setTimeout(60000);

  test('检查Phaser键盘输入状态', async ({ page }) => {
    const launcher = new GameLauncher(page);

    await launcher.navigateToGame();
    await launcher.waitForGameReady();
    await launcher.clickStartButton();
    await page.waitForTimeout(3000);

    // 检查键盘输入对象是否存在
    const keyboardState = await page.evaluate(() => {
      // 尝试获取Phaser游戏实例
      const game = (window as any).__PHASER_GAME__;
      if (!game) {
        return { error: 'No Phaser game instance found' };
      }

      // 获取当前场景
      const scene = game.scene?.scenes?.find(s => s.scene.key === 'TownOutdoorScene');
      if (!scene) {
        return { error: 'TownOutdoorScene not found' };
      }

      // 检查cursors对象
      const cursors = scene.cursors;
      const input = scene.input;

      return {
        hasCursors: !!cursors,
        hasInput: !!input,
        hasKeyboard: !!input?.keyboard,
        cursorKeys: cursors ? {
          up: { isDown: cursors.up?.isDown, keyCode: cursors.up?.keyCode },
          down: { isDown: cursors.down?.isDown, keyCode: cursors.down?.keyCode },
          left: { isDown: cursors.left?.isDown, keyCode: cursors.left?.keyCode },
          right: { isDown: cursors.right?.isDown, keyCode: cursors.right?.keyCode }
        } : null,
        keyboardKeys: input?.keyboard ? {
          keys: Object.keys(input.keyboard.keys || {}).slice(0, 10),
          hasAddKey: typeof input.keyboard.addKey === 'function'
        } : null
      };
    });

    console.log('\n=== 键盘输入状态 ===');
    console.log(JSON.stringify(keyboardState, null, 2));

    // 尝试不同的按键方式
    console.log('\n=== 测试不同按键方式 ===');

    // 方式1: 使用page.keyboard
    console.log('\n方式1: page.keyboard.down/up');
    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(200);

    const stateAfterKeyAPI = await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const scene = game?.scene?.scenes?.find(s => s.scene.key === 'TownOutdoorScene');
      return {
        cursorRightIsDown: scene?.cursors?.right?.isDown,
        direction: scene?.input?.keyboard?.addKey('D')?.isDown
      };
    });
    console.log('按下ArrowRight后:', stateAfterKeyAPI);
    await page.keyboard.up('ArrowRight');

    // 方式2: 使用page.keyboard.press
    console.log('\n方式2: page.keyboard.press');
    await page.keyboard.press('ArrowRight', { delay: 300 });
    await page.waitForTimeout(200);

    const stateAfterPress = await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const scene = game?.scene?.scenes?.find(s => s.scene.key === 'TownOutdoorScene');
      return {
        cursorRightIsDown: scene?.cursors?.right?.isDown,
        playerVelocity: scene?.player?.body?.velocity
      };
    });
    console.log('press ArrowRight后:', stateAfterPress);

    // 方式3: 使用dispatchEvent发送DOM事件
    console.log('\n方式3: dispatchEvent');
    await page.evaluate(() => {
      const canvas = document.querySelector('#game-container canvas');
      if (canvas) {
        // 发送keydown事件
        const event = new KeyboardEvent('keydown', {
          key: 'ArrowRight',
          code: 'ArrowRight',
          keyCode: 39,
          bubbles: true,
          cancelable: true
        });
        canvas.dispatchEvent(event);
      }
    });
    await page.waitForTimeout(300);

    const stateAfterDispatch = await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const scene = game?.scene?.scenes?.find(s => s.scene.key === 'TownOutdoorScene');
      return {
        cursorRightIsDown: scene?.cursors?.right?.isDown,
        playerVelocity: scene?.player?.body?.velocity,
        playerPosition: { x: scene?.player?.x, y: scene?.player?.y }
      };
    });
    console.log('dispatchEvent后:', stateAfterDispatch);

    // 发送keyup
    await page.evaluate(() => {
      const canvas = document.querySelector('#game-container canvas');
      if (canvas) {
        const event = new KeyboardEvent('keyup', {
          key: 'ArrowRight',
          code: 'ArrowRight',
          keyCode: 39,
          bubbles: true
        });
        canvas.dispatchEvent(event);
      }
    });

    // 方式4: 模拟实际DOM键盘事件（更完整）
    console.log('\n方式4: 完整DOM键盘事件模拟');
    await page.evaluate(() => {
      const canvas = document.querySelector('#game-container canvas');
      if (canvas) {
        //keydown
        canvas.dispatchEvent(new KeyboardEvent('keydown', {
          key: 'ArrowRight',
          code: 'ArrowRight',
          keyCode: 39,
          which: 39,
          bubbles: true,
          cancelable: true,
          composed: true
        }));
      }
    });

    // 等待几帧更新
    await page.waitForTimeout(500);

    const stateAfterFullEvent = await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const scene = game?.scene?.scenes?.find(s => s.scene.key === 'TownOutdoorScene');

      // 获取所有键盘相关状态
      const keyboardManager = game?.input?.keyboard;
      const keys = keyboardManager?.keys;

      return {
        PhaserKeyboardManager: {
          enabled: keyboardManager?.enabled,
          hasKeys: !!keys,
          keysCount: keys ? Object.keys(keys).length : 0,
          arrowRightKey: keys?.['39'] || keys?.['ArrowRight']
        },
        sceneCursors: {
          rightIsDown: scene?.cursors?.right?.isDown,
          rightKeyCode: scene?.cursors?.right?.keyCode
        },
        player: {
          velocity: scene?.player?.body?.velocity,
          position: { x: scene?.player?.x, y: scene?.player?.y }
        }
      };
    });
    console.log('完整DOM事件后:', JSON.stringify(stateAfterFullEvent, null, 2));

    // 发送keyup
    await page.evaluate(() => {
      const canvas = document.querySelector('#game-container canvas');
      if (canvas) {
        canvas.dispatchEvent(new KeyboardEvent('keyup', {
          key: 'ArrowRight',
          code: 'ArrowRight',
          keyCode: 39,
          which: 39,
          bubbles: true
        }));
      }
    });

    expect(true).toBe(true);
  });

  test('检查Playwright键盘事件与Phaser的兼容性', async ({ page }) => {
    const launcher = new GameLauncher(page);

    await launcher.navigateToGame();
    await launcher.waitForGameReady();
    await launcher.clickStartButton();
    await page.waitForTimeout(3000);

    // 先获取canvas焦点
    const canvas = page.locator('#game-container canvas');
    await canvas.click({ position: { x: 100, y: 100 } });
    await page.waitForTimeout(100);

    console.log('\n=== 点击canvas获取焦点后 ===');

    // 检查焦点状态
    const focusState = await page.evaluate(() => {
      const canvas = document.querySelector('#game-container canvas');
      return {
        canvasFocused: document.activeElement === canvas,
        activeElement: document.activeElement?.tagName,
        canvasTabindex: canvas?.getAttribute('tabindex')
      };
    });
    console.log('焦点状态:', focusState);

    // 尝试按键
    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(200);

    const keyState = await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const keyboardManager = game?.input?.keyboard;
      const scene = game?.scene?.scenes?.find(s => s.scene.key === 'TownOutdoorScene');

      return {
        keyboardEnabled: keyboardManager?.enabled,
        keysSnapshot: keyboardManager?.keys ? Object.entries(keyboardManager.keys).slice(0, 15).map(([k, v]) => ({
          keyCode: k,
          isDown: (v as any)?.isDown
        })) : [],
        cursorsRight: scene?.cursors?.right?.isDown,
        playerVelocity: scene?.player?.body?.velocity
      };
    });
    console.log('按键状态:', JSON.stringify(keyState, null, 2));

    await page.keyboard.up('ArrowRight');

    expect(true).toBe(true);
  });
});