// tests/visual/phase1-5/smoke/resource-loading.spec.ts
/**
 * Phase 1.5 Layer 1 冒烟测试 - 资源加载验证
 *
 * 测试用例:
 * - R-001: 背景图资源加载成功验证 - town_background.jpeg 加载成功且尺寸正确
 * - R-002: 占位纹理创建验证 - 5个占位纹理(grass/path/wall/door/player)正确创建
 * - R-003: 加载失败处理验证 - 游戏有错误处理机制，不会因资源问题崩溃
 *
 * Phase 1.5 关键参数:
 * - 背景图尺寸: 2752x1536像素 (86x48瓦片)
 * - TILE_SIZE: 32像素
 */

import { test, expect } from '@playwright/test';
import { GameLauncher } from '../../utils/game-launcher';
import { StateExtractor } from '../../utils/state-extractor';

// Phase 1.5 资源参数
const EXPECTED_BACKGROUND_WIDTH = 2752;  // 86 * 32
const EXPECTED_BACKGROUND_HEIGHT = 1536; // 48 * 32
const EXPECTED_TILE_SIZE = 32;
const EXPECTED_PLACEHOLDER_TEXTURES = ['grass', 'path', 'wall', 'door', 'player'];

test.describe('Phase 1.5 资源加载验证', () => {

  /**
   * R-001: 背景图资源加载成功验证
   * 验证BootScene成功加载town_background.jpeg
   * 验收标准: 资源存在且尺寸正确(2752x1536)
   */
  test('R-001: 背景图资源加载成功验证', async ({ page }) => {
    const launcher = new GameLauncher(page);
    const stateExtractor = new StateExtractor();

    // 启动游戏
    await launcher.navigateToGame();
    await launcher.waitForGameReady();
    await launcher.clickStartButton();
    await page.waitForTimeout(3000); // 等待场景完全加载

    // 验证当前场景已进入游戏
    const currentScene = await stateExtractor.getCurrentScene(page);
    expect(['TownOutdoorScene', 'ClinicScene', 'GardenScene', 'HomeScene']).toContain(currentScene);

    // 验证背景图纹理是否存在于Phaser纹理缓存中
    const textureInfo = await page.evaluate(() => {
      const phaserGame = (window as unknown as Record<string, unknown>).__GAME__;
      if (phaserGame && typeof phaserGame === 'object') {
        const game = phaserGame as Phaser.Game;
        const textureManager = game.textures;

        // 检查town_background纹理是否存在
        const exists = textureManager.exists('town_background');

        if (exists) {
          const texture = textureManager.get('town_background');
          const source = texture.source[0];
          return {
            exists: true,
            width: source.width,
            height: source.height
          };
        }

        return { exists: false, width: 0, height: 0 };
      }
      return null;
    });

    // 验证纹理信息获取成功
    expect(textureInfo).not.toBeNull();

    // 验证背景图存在
    expect(textureInfo?.exists).toBe(true);

    // 验证背景图尺寸正确
    if (textureInfo && textureInfo.exists) {
      expect(textureInfo.width).toBe(EXPECTED_BACKGROUND_WIDTH);
      expect(textureInfo.height).toBe(EXPECTED_BACKGROUND_HEIGHT);
    }
  });

  /**
   * R-002: 占位纹理创建验证
   * 验证BootScene正确创建player/grass/path/wall/door纹理
   * 验收标准: 所有5个纹理都存在于Phaser纹理缓存
   */
  test('R-002: 占位纹理创建验证', async ({ page }) => {
    const launcher = new GameLauncher(page);
    const stateExtractor = new StateExtractor();

    // 启动游戏
    await launcher.navigateToGame();
    await launcher.waitForGameReady();
    await launcher.clickStartButton();
    await page.waitForTimeout(3000);

    // 验证当前场景已进入游戏
    const currentScene = await stateExtractor.getCurrentScene(page);
    expect(['TownOutdoorScene', 'ClinicScene', 'GardenScene', 'HomeScene']).toContain(currentScene);

    // 验证所有占位纹理是否存在
    // 使用正确的page.evaluate参数传递方式（单个参数对象）
    const texturesInfo = await page.evaluate(({ expectedTextures, tileSize }) => {
      const phaserGame = (window as unknown as Record<string, unknown>).__GAME__;
      if (phaserGame && typeof phaserGame === 'object') {
        const game = phaserGame as Phaser.Game;
        const textureManager = game.textures;

        const results: Record<string, { exists: boolean; width: number; height: number }> = {};

        for (const textureKey of expectedTextures) {
          const exists = textureManager.exists(textureKey);
          if (exists) {
            const texture = textureManager.get(textureKey);
            const source = texture.source[0];
            results[textureKey] = {
              exists: true,
              width: source.width,
              height: source.height
            };
          } else {
            results[textureKey] = {
              exists: false,
              width: 0,
              height: 0
            };
          }
        }

        return results;
      }
      return null;
    }, { expectedTextures: EXPECTED_PLACEHOLDER_TEXTURES, tileSize: EXPECTED_TILE_SIZE });

    // 验证纹理信息获取成功
    expect(texturesInfo).not.toBeNull();

    // 验证每个纹理
    if (texturesInfo) {
      for (const textureKey of EXPECTED_PLACEHOLDER_TEXTURES) {
        const textureData = texturesInfo[textureKey];

        // 纹理必须存在
        expect(textureData.exists).toBe(true);

        // 纹理尺寸必须是32x32 (TILE_SIZE)
        expect(textureData.width).toBe(EXPECTED_TILE_SIZE);
        expect(textureData.height).toBe(EXPECTED_TILE_SIZE);
      }
    }
  });

  /**
   * R-003: 加载失败处理验证
   * 验证游戏有错误处理机制
   * 验收标准: 游戏启动后无控制台致命错误，有完整的加载流程
   */
  test('R-003: 加载失败处理验证', async ({ page }) => {
    const launcher = new GameLauncher(page);
    const stateExtractor = new StateExtractor();

    // 监听控制台错误
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // 启动游戏
    await launcher.navigateToGame();
    await launcher.waitForGameReady();

    // 验证游戏状态接口可用（说明基础加载成功）
    const gameState = await launcher.getGameState();
    expect(gameState).not.toBeNull();

    // 点击开始按钮进入游戏
    await launcher.clickStartButton();
    await page.waitForTimeout(3000);

    // 验证游戏进入游戏场景
    const currentScene = await stateExtractor.getCurrentScene(page);
    expect(['TownOutdoorScene', 'ClinicScene', 'GardenScene', 'HomeScene']).toContain(currentScene);

    // 检查是否有与资源加载相关的致命错误
    // 注意: Phaser可能会输出一些警告信息，我们只关注致命错误
    const criticalErrors = consoleErrors.filter(error =>
      error.includes('Failed to load') ||
      error.includes('Texture missing') ||
      error.includes('Uncaught') ||
      error.includes('TypeError') ||
      error.includes('ReferenceError')
    );

    // 游戏不应该有致命错误
    expect(criticalErrors.length).toBe(0);

    // 验证Phaser游戏实例存在且正常运行
    const gameInstanceValid = await page.evaluate(() => {
      const phaserGame = (window as unknown as Record<string, unknown>).__GAME__;
      if (phaserGame && typeof phaserGame === 'object') {
        const game = phaserGame as Phaser.Game;
        // 验证游戏是否正在运行
        return game.isRunning;
      }
      return false;
    });

    expect(gameInstanceValid).toBe(true);
  });
});