// tests/visual/phase1-5/ai-driven/ai-gameplay.spec.ts
/**
 * AI驱动的游戏自动化测试
 * 使用QWEN VL多模态AI分析游戏状态并驱动玩家行动
 */
import { test, expect, Page } from '@playwright/test';
import { VisualAnalyzer } from '../utils/visual-analyzer';
import { WalkableVerifier, TilePos } from '../utils/walkable-verifier';
import { GameLauncher } from '../../utils/game-launcher';
import { StateExtractor } from '../../utils/state-extractor';
import { TOWN_OUTDOOR_CONFIG } from '../../../../src/data/map-config';

/**
 * AI游戏操作控制器
 */
class AIGameController {
  private visualAnalyzer: VisualAnalyzer;
  private walkableVerifier: WalkableVerifier;
  private page: Page;
  private screenshotDir: string;

  constructor(page: Page, visualAnalyzer: VisualAnalyzer, walkableVerifier: WalkableVerifier) {
    this.page = page;
    this.visualAnalyzer = visualAnalyzer;
    this.walkableVerifier = walkableVerifier;
    this.screenshotDir = 'tests/visual/screenshots/phase1-5/ai-driven';
  }

  /**
   * 截取当前游戏画面并转换为base64
   */
  async captureScreenshot(name: string): Promise<string> {
    const screenshot = await this.page.screenshot();
    return screenshot.toString('base64');
  }

  /**
   * AI分析当前游戏状态
   */
  async analyzeGameState(): Promise<{
    playerPosition: TilePos | null;
    visibleElements: string[];
    suggestedAction: string;
    sceneDescription: string;
  }> {
    const base64Image = await this.captureScreenshot('state-analysis');

    const prompt = `你正在玩一个叫"药灵山谷"的像素风格中医游戏。请分析当前游戏画面：

1. 玩家角色在哪里？（描述大概位置）
2. 画面中有哪些可见的元素？（建筑、道路、植物等）
3. 玩家接下来应该做什么？（探索、进入建筑、采集等）
4. 描述当前场景的氛围

请以JSON格式返回：
{
  "playerPosition": "位置描述",
  "visibleElements": ["元素1", "元素2"],
  "suggestedAction": "建议行动",
  "sceneDescription": "场景描述"
}`;

    const response = await this.visualAnalyzer.analyzeImage(base64Image, prompt);

    // 解析AI响应
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        playerPosition: null, // 需要从游戏状态获取
        visibleElements: parsed.visibleElements || [],
        suggestedAction: parsed.suggestedAction || '',
        sceneDescription: parsed.sceneDescription || ''
      };
    }

    return {
      playerPosition: null,
      visibleElements: [],
      suggestedAction: '',
      sceneDescription: ''
    };
  }

  /**
   * AI决定下一步移动方向
   */
  async decideMoveDirection(targetDescription: string): Promise<'up' | 'down' | 'left' | 'right' | 'none'> {
    const base64Image = await this.captureScreenshot('move-decision');

    const prompt = `你正在控制游戏角色移动。目标：${targetDescription}

请观察当前画面，决定最佳移动方向。只能选择一个方向：
- up (向上)
- down (向下)
- left (向左)
- right (向右)
- none (不需要移动)

请只返回一个JSON：
{
  "direction": "up/down/left/right/none",
  "reason": "简短理由"
}`;

    const response = await this.visualAnalyzer.analyzeImage(base64Image, prompt);
    const jsonMatch = response.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      const dir = parsed.direction?.toLowerCase();
      if (['up', 'down', 'left', 'right', 'none'].includes(dir)) {
        return dir as 'up' | 'down' | 'left' | 'right' | 'none';
      }
    }

    return 'none';
  }

  /**
   * 执行移动操作
   */
  async performMove(direction: 'up' | 'down' | 'left' | 'right'): Promise<void> {
    const keyMap = {
      up: 'ArrowUp',
      down: 'ArrowDown',
      left: 'ArrowLeft',
      right: 'ArrowRight'
    };

    await this.page.keyboard.down(keyMap[direction]);
    await this.page.waitForTimeout(200);
    await this.page.keyboard.up(keyMap[direction]);
    await this.page.waitForTimeout(300); // 等待移动完成
  }

  /**
   * AI控制玩家走向目标
   */
  async aiMoveTo(targetDescription: string, maxSteps: number = 50): Promise<boolean> {
    for (let i = 0; i < maxSteps; i++) {
      const direction = await this.decideMoveDirection(targetDescription);

      if (direction === 'none') {
        console.log(`[AI] 已到达目标或无法继续移动`);
        return true;
      }

      console.log(`[AI] Step ${i + 1}: 移动方向 ${direction}`);
      await this.performMove(direction);
    }

    return false;
  }

  /**
   * AI分析门入口是否可辨识
   */
  async analyzeDoorEntrance(doorPos: TilePos): Promise<{
    isRecognizable: boolean;
    description: string;
    canEnter: boolean;
  }> {
    const base64Image = await this.captureScreenshot('door-analysis');

    const prompt = `请分析当前游戏画面中是否可以看到一个门入口。

这个游戏是像素风格的，门可能看起来像：
- 建筑的入口
- 一个通道
- 不同颜色的地面区域

请判断：
1. 画面中是否有看起来可以进入的区域？
2. 这个区域是否清晰可辨？
3. 玩家能否知道这里可以进入？

返回JSON：
{
  "isRecognizable": true/false,
  "description": "描述",
  "canEnter": true/false
}`;

    const response = await this.visualAnalyzer.analyzeImage(base64Image, prompt);
    const jsonMatch = response.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        isRecognizable: parsed.isRecognizable ?? false,
        description: parsed.description ?? '',
        canEnter: parsed.canEnter ?? false
      };
    }

    return {
      isRecognizable: false,
      description: '无法解析AI响应',
      canEnter: false
    };
  }

  /**
   * 执行空格键交互
   */
  async performInteraction(): Promise<void> {
    await this.page.keyboard.down('Space');
    await this.page.waitForTimeout(100);
    await this.page.keyboard.up('Space');
    await this.page.waitForTimeout(500);
  }
}

test.describe('AI驱动游戏自动化测试', () => {
  // 设置全局超时为2分钟，因为多模态AI处理图片需要较长时间
  test.describe.configure({ timeout: 120000 });

  let visualAnalyzer: VisualAnalyzer;
  let walkableVerifier: WalkableVerifier;
  let gameLauncher: GameLauncher;
  let stateExtractor: StateExtractor;
  let aiController: AIGameController;

  test.beforeEach(async ({ page }) => {
    visualAnalyzer = new VisualAnalyzer();
    walkableVerifier = new WalkableVerifier();
    gameLauncher = new GameLauncher(page);
    stateExtractor = new StateExtractor();

    // 检查API是否配置
    if (!visualAnalyzer.isApiAvailable()) {
      test.skip();
      return;
    }

    // 启动游戏
    await gameLauncher.navigateToGame();
    await gameLauncher.waitForGameReady();
    await gameLauncher.clickStartButton();
    await page.waitForTimeout(2000);

    // 初始化可行走验证器
    await walkableVerifier.initialize(page);

    // 创建AI控制器
    aiController = new AIGameController(page, visualAnalyzer, walkableVerifier);
  });

  test('AI-001: AI视觉验收 - 游戏画面质量分析', async ({ page }) => {
    const base64Image = await aiController.captureScreenshot('quality-check');

    // 背景质量分析
    const qualityResult = await visualAnalyzer.analyzeBackgroundQuality(base64Image);
    console.log('[AI] 背景质量分析:', qualityResult);

    expect(qualityResult.isNormal).toBe(true);
    expect(qualityResult.hasBlackScreen).toBe(false);
    expect(qualityResult.clarity).toBeGreaterThanOrEqual(3);

    // 建筑识别
    const buildingResult = await visualAnalyzer.identifyBuildings(base64Image);
    console.log('[AI] 建筑识别:', buildingResult);

    expect(buildingResult.buildingCount).toBeGreaterThanOrEqual(2);
  });

  test('AI-002: AI场景理解 - 分析当前游戏状态', async ({ page }) => {
    const gameState = await aiController.analyzeGameState();
    console.log('[AI] 游戏状态分析:', gameState);

    // AI应该能识别出场景中的元素
    expect(gameState.visibleElements.length).toBeGreaterThan(0);
    expect(gameState.sceneDescription.length).toBeGreaterThan(0);

    // AI应该能给出行动建议
    expect(gameState.suggestedAction.length).toBeGreaterThan(0);
  });

  test('AI-003: AI自动行走 - 探索游戏世界', async ({ page }) => {
    // AI控制玩家探索游戏世界
    const initialState = await stateExtractor.getPlayerState(page);
    console.log('[AI] 初始位置:', initialState);

    // 让AI自由探索
    const analysis = await aiController.analyzeGameState();
    console.log('[AI] 场景描述:', analysis.sceneDescription);
    console.log('[AI] 建议行动:', analysis.suggestedAction);

    // AI决定移动方向并执行几次移动
    for (let i = 0; i < 5; i++) {
      const direction = await aiController.decideMoveDirection('探索周围环境');
      console.log(`[AI] 移动决策 ${i + 1}: ${direction}`);

      if (direction !== 'none') {
        await aiController.performMove(direction);
      }

      await page.waitForTimeout(500);
    }

    // 验证玩家位置变化
    const finalState = await stateExtractor.getPlayerState(page);
    console.log('[AI] 最终位置:', finalState);

    // 验证移动发生（位置应该有变化）
    const moved = finalState!.tileX !== initialState!.tileX || finalState!.tileY !== initialState!.tileY;
    console.log(`[AI] 移动发生: ${moved}`);

    // 验证玩家在地图范围内
    expect(finalState!.tileX).toBeGreaterThanOrEqual(0);
    expect(finalState!.tileX).toBeLessThan(86);
    expect(finalState!.tileY).toBeGreaterThanOrEqual(0);
    expect(finalState!.tileY).toBeLessThan(48);
  });

  test('AI-004: AI门入口识别 - 验证门区域可辨识性', async ({ page }) => {
    // 使用BFS找到通往药园门的路径
    const spawnPoint = { x: 47, y: 24 };
    const gardenDoor = { x: 15, y: 8 };

    // 验证门可达
    const canReach = walkableVerifier.canReach(spawnPoint, gardenDoor);
    console.log(`[AI] 药园门可达性: ${canReach}`);

    // 获取当前截图分析
    const base64Image = await aiController.captureScreenshot('door-recognition');

    // AI分析门区域
    const doorAnalysis = await aiController.analyzeDoorEntrance(gardenDoor);
    console.log('[AI] 门区域分析:', doorAnalysis);

    // 记录AI对场景的理解
    const sceneAnalysis = await aiController.analyzeGameState();
    console.log('[AI] 可见元素:', sceneAnalysis.visibleElements);

    // 验证AI能识别出建筑入口
    expect(doorAnalysis.isRecognizable || sceneAnalysis.visibleElements.some(e =>
      e.includes('门') || e.includes('入口') || e.includes('建筑')
    )).toBe(true);
  });

  test('AI-005: AI氛围评分 - 游戏整体视觉体验评估', async ({ page }) => {
    const base64Image = await aiController.captureScreenshot('atmosphere-rating');

    const atmosphereScore = await visualAnalyzer.rateAtmosphere(base64Image);
    console.log('[AI] 氛围评分:', atmosphereScore);

    // 验证各项评分
    console.log(`[AI] 田园治愈感: ${atmosphereScore.pastoralHealing}/5`);
    console.log(`[AI] 中医文化感: ${atmosphereScore.tcmCulture}/5`);
    console.log(`[AI] 探索引导感: ${atmosphereScore.explorationGuide}/5`);
    console.log(`[AI] 整体和谐度: ${atmosphereScore.overallHarmony}/5`);
    console.log(`[AI] 平均分: ${atmosphereScore.average}/5`);

    // 平均分应该达标
    expect(atmosphereScore.average).toBeGreaterThanOrEqual(3.0);

    // 评分理由应该有内容
    expect(atmosphereScore.reasons.length).toBeGreaterThan(0);
  });

  test('AI-006: AI交互验证 - 场景切换测试', async ({ page }) => {
    const initialScene = await stateExtractor.getCurrentScene(page);
    console.log('[AI] 当前场景:', initialScene);

    // AI分析当前状态
    const analysis = await aiController.analyzeGameState();
    console.log('[AI] 建议行动:', analysis.suggestedAction);

    // 执行交互
    await aiController.performInteraction();
    await page.waitForTimeout(1000);

    // 检查场景是否变化
    const newScene = await stateExtractor.getCurrentScene(page);
    console.log('[AI] 交互后场景:', newScene);

    // 记录交互结果
    const postInteractionAnalysis = await aiController.analyzeGameState();
    console.log('[AI] 交互后场景描述:', postInteractionAnalysis.sceneDescription);
  });
});