// tests/visual/phase1-5/deep-validation/visual-analysis.spec.ts
/**
 * Phase 1.5 AI视觉深度分析测试
 *
 * 这些测试需要OPENROUTER_API_KEY环境变量才能运行
 * 默认skip，避免在没有API密钥的情况下失败
 *
 * 测试用例:
 * - D-005: 背景图视觉质量 - 验证无黑屏、无破损，清晰度>=3分
 * - D-006: 建筑区域识别 - 识别至少2个建筑
 * - D-007: 门区域可辨识 - 分析门区域是否清晰可辨
 * - D-008: 整体氛围评分 >= 3.5/5
 */

import { test, expect } from '@playwright/test';
import { VisualAnalyzer } from '../utils/visual-analyzer';
import { GameLauncher } from '../../utils/game-launcher';
import { TOWN_OUTDOOR_CONFIG } from '../../../../src/data/map-config';

// 检查API是否可用
const hasApiKey = !!process.env.OPENROUTER_API_KEY;

test.describe('Phase 1.5 AI视觉深度分析测试', () => {
  let analyzer: VisualAnalyzer;

  test.beforeAll(() => {
    analyzer = new VisualAnalyzer();
  });

  /**
   * D-005: 背景图视觉质量
   * 验证无黑屏、无破损，清晰度>=3分
   */
  test('D-005: 背景图视觉质量', async ({ page }) => {
    // 条件跳过：没有API密钥时跳过
    if (!hasApiKey) {
      test.skip('需要OPENROUTER_API_KEY环境变量');
      return;
    }

    // 验证API可用
    expect(analyzer.isApiAvailable()).toBe(true);

    const launcher = new GameLauncher(page);

    // 启动游戏并进入主场景
    await launcher.navigateToGame();
    await launcher.waitForGameReady();
    await launcher.clickStartButton();
    await page.waitForTimeout(2000);

    // 确认进入游戏场景
    const isInGame = await launcher.isInGameScene();
    expect(isInGame).toBe(true);

    // 截取游戏画面
    const canvas = page.locator('#game-container canvas');
    await canvas.waitFor({ state: 'visible' });

    // 获取canvas截图作为base64
    const screenshotBuffer = await canvas.screenshot();
    const imageBase64 = screenshotBuffer.toString('base64');

    // 使用AI分析背景图质量
    const qualityResult = await analyzer.analyzeBackgroundQuality(imageBase64);

    // 验证结果
    console.log('背景图质量分析结果:', JSON.stringify(qualityResult, null, 2));

    // 硬性验证：无黑屏
    expect(qualityResult.hasBlackScreen).toBe(false);

    // 硬性验证：无破损
    expect(qualityResult.hasCorruption).toBe(false);

    // 软性验证：图片正常显示
    expect(qualityResult.isNormal).toBe(true);

    // 软性验证：清晰度>=3分
    expect(qualityResult.clarity).toBeGreaterThanOrEqual(3);

    // 验证置信度>=0.5
    expect(qualityResult.confidence).toBeGreaterThanOrEqual(0.5);
  });

  /**
   * D-006: 建筑区域识别
   * 识别至少2个建筑
   */
  test('D-006: 建筑区域识别', async ({ page }) => {
    // 条件跳过：没有API密钥时跳过
    if (!hasApiKey) {
      test.skip('需要OPENROUTER_API_KEY环境变量');
      return;
    }

    const launcher = new GameLauncher(page);

    // 启动游戏并进入主场景
    await launcher.navigateToGame();
    await launcher.waitForGameReady();
    await launcher.clickStartButton();
    await page.waitForTimeout(2000);

    // 确认进入游戏场景
    const isInGame = await launcher.isInGameScene();
    expect(isInGame).toBe(true);

    // 截取游戏画面
    const canvas = page.locator('#game-container canvas');
    await canvas.waitFor({ state: 'visible' });

    const screenshotBuffer = await canvas.screenshot();
    const imageBase64 = screenshotBuffer.toString('base64');

    // 使用AI识别建筑
    const buildingResult = await analyzer.identifyBuildings(imageBase64);

    // 验证结果
    console.log('建筑识别结果:', JSON.stringify(buildingResult, null, 2));

    // 硬性验证：识别至少2个建筑
    // 根据设计，小镇应有3个建筑：诊所、药园、家
    expect(buildingResult.buildingCount).toBeGreaterThanOrEqual(2);

    // 软性验证：建筑风格与周围环境协调
    expect(buildingResult.styleConsistent).toBe(true);

    // 验证置信度>=0.5
    expect(buildingResult.confidence).toBeGreaterThanOrEqual(0.5);

    // 验证建筑列表非空（当有建筑时）
    if (buildingResult.buildingCount > 0) {
      expect(buildingResult.buildings.length).toBeGreaterThan(0);
      // 验证每个建筑有描述
      for (const building of buildingResult.buildings) {
        expect(building.description.length).toBeGreaterThan(0);
      }
    }
  });

  /**
   * D-007: 门区域可辨识
   * 分析门区域是否清晰可辨
   */
  test('D-007: 门区域可辨识', async ({ page }) => {
    // 条件跳过：没有API密钥时跳过
    if (!hasApiKey) {
      test.skip('需要OPENROUTER_API_KEY环境变量');
      return;
    }

    const launcher = new GameLauncher(page);

    // 启动游戏并进入主场景
    await launcher.navigateToGame();
    await launcher.waitForGameReady();
    await launcher.clickStartButton();
    await page.waitForTimeout(2000);

    // 确认进入游戏场景
    const isInGame = await launcher.isInGameScene();
    expect(isInGame).toBe(true);

    // 截取游戏画面
    const canvas = page.locator('#game-container canvas');
    await canvas.waitFor({ state: 'visible' });

    const screenshotBuffer = await canvas.screenshot();
    const imageBase64 = screenshotBuffer.toString('base64');

    // 测试第一个门的可辨识度（药园门）
    const gardenDoor = TOWN_OUTDOOR_CONFIG.doors.find(d => d.targetScene === 'GardenScene');
    expect(gardenDoor).toBeDefined();

    if (gardenDoor) {
      const doorResult = await analyzer.analyzeDoorClarity(imageBase64, {
        x: gardenDoor.tileX,
        y: gardenDoor.tileY
      });

      // 验证结果
      console.log('药园门可辨识度结果:', JSON.stringify(doorResult, null, 2));

      // 软性验证：门区域可辨识
      // 这是视觉层面的判断，不是硬性要求
      expect(doorResult.isClear).toBe(true);

      // 验证置信度>=0.5
      expect(doorResult.confidence).toBeGreaterThanOrEqual(0.5);

      // 验证有描述
      expect(doorResult.description.length).toBeGreaterThan(0);
    }
  });

  /**
   * D-008: 整体氛围评分 >= 3.5/5
   * 田园治愈感 + 中医文化感 + 探索引导感 + 整体和谐度
   */
  test('D-008: 整体氛围评分 >= 3.5/5', async ({ page }) => {
    // 条件跳过：没有API密钥时跳过
    if (!hasApiKey) {
      test.skip('需要OPENROUTER_API_KEY环境变量');
      return;
    }

    const launcher = new GameLauncher(page);

    // 启动游戏并进入主场景
    await launcher.navigateToGame();
    await launcher.waitForGameReady();
    await launcher.clickStartButton();
    await page.waitForTimeout(2000);

    // 确认进入游戏场景
    const isInGame = await launcher.isInGameScene();
    expect(isInGame).toBe(true);

    // 截取游戏画面
    const canvas = page.locator('#game-container canvas');
    await canvas.waitFor({ state: 'visible' });

    const screenshotBuffer = await canvas.screenshot();
    const imageBase64 = screenshotBuffer.toString('base64');

    // 使用AI评分氛围
    const atmosphereResult = await analyzer.rateAtmosphere(imageBase64);

    // 验证结果
    console.log('氛围评分结果:', JSON.stringify(atmosphereResult, null, 2));

    // 硬性验证：平均分>=3.5
    expect(atmosphereResult.average).toBeGreaterThanOrEqual(3.5);

    // 软性验证：田园治愈感>=3
    expect(atmosphereResult.pastoralHealing).toBeGreaterThanOrEqual(3);

    // 软性验证：中医文化感>=3
    expect(atmosphereResult.tcmCulture).toBeGreaterThanOrEqual(3);

    // 软性验证：探索引导感>=3
    expect(atmosphereResult.explorationGuide).toBeGreaterThanOrEqual(3);

    // 软性验证：整体和谐度>=3
    expect(atmosphereResult.overallHarmony).toBeGreaterThanOrEqual(3);

    // 验证有评分理由
    expect(atmosphereResult.reasons.length).toBeGreaterThan(0);

    // 输出建议（如果有）
    if (atmosphereResult.suggestions.length > 0) {
      console.log('改进建议:', atmosphereResult.suggestions);
    }
  });
});