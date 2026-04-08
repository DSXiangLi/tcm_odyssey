# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: visual/phase1-5/ai-driven/ai-gameplay.spec.ts >> AI驱动游戏自动化测试 >> AI-004: AI门入口识别 - 验证门区域可辨识性
- Location: tests/visual/phase1-5/ai-driven/ai-gameplay.spec.ts:307:3

# Error details

```
TypeError: aiController.analyzeDoorClarity is not a function
```

# Test source

```ts
  220 |   let aiController: AIGameController;
  221 | 
  222 |   test.beforeEach(async ({ page }) => {
  223 |     visualAnalyzer = new VisualAnalyzer();
  224 |     walkableVerifier = new WalkableVerifier();
  225 |     gameLauncher = new GameLauncher(page);
  226 |     stateExtractor = new StateExtractor();
  227 | 
  228 |     // 检查API是否配置
  229 |     if (!visualAnalyzer.isApiAvailable()) {
  230 |       test.skip();
  231 |       return;
  232 |     }
  233 | 
  234 |     // 启动游戏
  235 |     await gameLauncher.navigateToGame();
  236 |     await gameLauncher.waitForGameReady();
  237 |     await gameLauncher.clickStartButton();
  238 |     await page.waitForTimeout(2000);
  239 | 
  240 |     // 初始化可行走验证器
  241 |     await walkableVerifier.initialize(page);
  242 | 
  243 |     // 创建AI控制器
  244 |     aiController = new AIGameController(page, visualAnalyzer, walkableVerifier);
  245 |   });
  246 | 
  247 |   test('AI-001: AI视觉验收 - 游戏画面质量分析', async ({ page }) => {
  248 |     const base64Image = await aiController.captureScreenshot('quality-check');
  249 | 
  250 |     // 背景质量分析
  251 |     const qualityResult = await visualAnalyzer.analyzeBackgroundQuality(base64Image);
  252 |     console.log('[AI] 背景质量分析:', qualityResult);
  253 | 
  254 |     expect(qualityResult.isNormal).toBe(true);
  255 |     expect(qualityResult.hasBlackScreen).toBe(false);
  256 |     expect(qualityResult.clarity).toBeGreaterThanOrEqual(3);
  257 | 
  258 |     // 建筑识别
  259 |     const buildingResult = await visualAnalyzer.identifyBuildings(base64Image);
  260 |     console.log('[AI] 建筑识别:', buildingResult);
  261 | 
  262 |     expect(buildingResult.buildingCount).toBeGreaterThanOrEqual(2);
  263 |   });
  264 | 
  265 |   test('AI-002: AI场景理解 - 分析当前游戏状态', async ({ page }) => {
  266 |     const gameState = await aiController.analyzeGameState();
  267 |     console.log('[AI] 游戏状态分析:', gameState);
  268 | 
  269 |     // AI应该能识别出场景中的元素
  270 |     expect(gameState.visibleElements.length).toBeGreaterThan(0);
  271 |     expect(gameState.sceneDescription.length).toBeGreaterThan(0);
  272 | 
  273 |     // AI应该能给出行动建议
  274 |     expect(gameState.suggestedAction.length).toBeGreaterThan(0);
  275 |   });
  276 | 
  277 |   test('AI-003: AI自动行走 - 探索游戏世界', async ({ page }) => {
  278 |     // AI控制玩家探索游戏世界
  279 |     const initialState = await stateExtractor.getPlayerState(page);
  280 |     console.log('[AI] 初始位置:', initialState);
  281 | 
  282 |     // 让AI自由探索
  283 |     const analysis = await aiController.analyzeGameState();
  284 |     console.log('[AI] 场景描述:', analysis.sceneDescription);
  285 |     console.log('[AI] 建议行动:', analysis.suggestedAction);
  286 | 
  287 |     // AI决定移动方向并执行几次移动
  288 |     for (let i = 0; i < 5; i++) {
  289 |       const direction = await aiController.decideMoveDirection('探索周围环境');
  290 |       console.log(`[AI] 移动决策 ${i + 1}: ${direction}`);
  291 | 
  292 |       if (direction !== 'none') {
  293 |         await aiController.performMove(direction);
  294 |       }
  295 | 
  296 |       await page.waitForTimeout(500);
  297 |     }
  298 | 
  299 |     // 验证玩家位置变化
  300 |     const finalState = await stateExtractor.getPlayerState(page);
  301 |     console.log('[AI] 最终位置:', finalState);
  302 | 
  303 |     // 玩家应该在可行走区域内
  304 |     expect(walkableVerifier.isWalkable(finalState!.tileX, finalState!.tileY)).toBe(true);
  305 |   });
  306 | 
  307 |   test('AI-004: AI门入口识别 - 验证门区域可辨识性', async ({ page }) => {
  308 |     // 使用BFS找到通往药园门的路径
  309 |     const spawnPoint = { x: 47, y: 24 };
  310 |     const gardenDoor = { x: 15, y: 8 };
  311 | 
  312 |     // 验证门可达
  313 |     const canReach = walkableVerifier.canReach(spawnPoint, gardenDoor);
  314 |     console.log(`[AI] 药园门可达性: ${canReach}`);
  315 | 
  316 |     // 获取当前截图分析
  317 |     const base64Image = await aiController.captureScreenshot('door-recognition');
  318 | 
  319 |     // AI分析门区域
> 320 |     const doorAnalysis = await aiController.analyzeDoorClarity(base64Image, gardenDoor);
      |                                             ^ TypeError: aiController.analyzeDoorClarity is not a function
  321 |     console.log('[AI] 门区域分析:', doorAnalysis);
  322 | 
  323 |     // 记录AI对场景的理解
  324 |     const sceneAnalysis = await aiController.analyzeGameState();
  325 |     console.log('[AI] 可见元素:', sceneAnalysis.visibleElements);
  326 | 
  327 |     // 验证AI能识别出建筑入口
  328 |     expect(doorAnalysis.isClear || sceneAnalysis.visibleElements.some(e =>
  329 |       e.includes('门') || e.includes('入口') || e.includes('建筑')
  330 |     )).toBe(true);
  331 |   });
  332 | 
  333 |   test('AI-005: AI氛围评分 - 游戏整体视觉体验评估', async ({ page }) => {
  334 |     const base64Image = await aiController.captureScreenshot('atmosphere-rating');
  335 | 
  336 |     const atmosphereScore = await visualAnalyzer.rateAtmosphere(base64Image);
  337 |     console.log('[AI] 氛围评分:', atmosphereScore);
  338 | 
  339 |     // 验证各项评分
  340 |     console.log(`[AI] 田园治愈感: ${atmosphereScore.pastoralHealing}/5`);
  341 |     console.log(`[AI] 中医文化感: ${atmosphereScore.tcmCulture}/5`);
  342 |     console.log(`[AI] 探索引导感: ${atmosphereScore.explorationGuide}/5`);
  343 |     console.log(`[AI] 整体和谐度: ${atmosphereScore.overallHarmony}/5`);
  344 |     console.log(`[AI] 平均分: ${atmosphereScore.average}/5`);
  345 | 
  346 |     // 平均分应该达标
  347 |     expect(atmosphereScore.average).toBeGreaterThanOrEqual(3.0);
  348 | 
  349 |     // 评分理由应该有内容
  350 |     expect(atmosphereScore.reasons.length).toBeGreaterThan(0);
  351 |   });
  352 | 
  353 |   test('AI-006: AI交互验证 - 场景切换测试', async ({ page }) => {
  354 |     const initialScene = await stateExtractor.getCurrentScene(page);
  355 |     console.log('[AI] 当前场景:', initialScene);
  356 | 
  357 |     // AI分析当前状态
  358 |     const analysis = await aiController.analyzeGameState();
  359 |     console.log('[AI] 建议行动:', analysis.suggestedAction);
  360 | 
  361 |     // 执行交互
  362 |     await aiController.performInteraction();
  363 |     await page.waitForTimeout(1000);
  364 | 
  365 |     // 检查场景是否变化
  366 |     const newScene = await stateExtractor.getCurrentScene(page);
  367 |     console.log('[AI] 交互后场景:', newScene);
  368 | 
  369 |     // 记录交互结果
  370 |     const postInteractionAnalysis = await aiController.analyzeGameState();
  371 |     console.log('[AI] 交互后场景描述:', postInteractionAnalysis.sceneDescription);
  372 |   });
  373 | });
```