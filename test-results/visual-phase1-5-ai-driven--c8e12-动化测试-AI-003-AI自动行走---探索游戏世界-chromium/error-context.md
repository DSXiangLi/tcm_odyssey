# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: visual/phase1-5/ai-driven/ai-gameplay.spec.ts >> AI驱动游戏自动化测试 >> AI-003: AI自动行走 - 探索游戏世界
- Location: tests/visual/phase1-5/ai-driven/ai-gameplay.spec.ts:277:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: keyboard.down: Test timeout of 30000ms exceeded.
```

# Test source

```ts
  31  |    */
  32  |   async captureScreenshot(name: string): Promise<string> {
  33  |     const screenshot = await this.page.screenshot();
  34  |     return screenshot.toString('base64');
  35  |   }
  36  | 
  37  |   /**
  38  |    * AI分析当前游戏状态
  39  |    */
  40  |   async analyzeGameState(): Promise<{
  41  |     playerPosition: TilePos | null;
  42  |     visibleElements: string[];
  43  |     suggestedAction: string;
  44  |     sceneDescription: string;
  45  |   }> {
  46  |     const base64Image = await this.captureScreenshot('state-analysis');
  47  | 
  48  |     const prompt = `你正在玩一个叫"药灵山谷"的像素风格中医游戏。请分析当前游戏画面：
  49  | 
  50  | 1. 玩家角色在哪里？（描述大概位置）
  51  | 2. 画面中有哪些可见的元素？（建筑、道路、植物等）
  52  | 3. 玩家接下来应该做什么？（探索、进入建筑、采集等）
  53  | 4. 描述当前场景的氛围
  54  | 
  55  | 请以JSON格式返回：
  56  | {
  57  |   "playerPosition": "位置描述",
  58  |   "visibleElements": ["元素1", "元素2"],
  59  |   "suggestedAction": "建议行动",
  60  |   "sceneDescription": "场景描述"
  61  | }`;
  62  | 
  63  |     const response = await this.visualAnalyzer.analyzeImage(base64Image, prompt);
  64  | 
  65  |     // 解析AI响应
  66  |     const jsonMatch = response.match(/\{[\s\S]*\}/);
  67  |     if (jsonMatch) {
  68  |       const parsed = JSON.parse(jsonMatch[0]);
  69  |       return {
  70  |         playerPosition: null, // 需要从游戏状态获取
  71  |         visibleElements: parsed.visibleElements || [],
  72  |         suggestedAction: parsed.suggestedAction || '',
  73  |         sceneDescription: parsed.sceneDescription || ''
  74  |       };
  75  |     }
  76  | 
  77  |     return {
  78  |       playerPosition: null,
  79  |       visibleElements: [],
  80  |       suggestedAction: '',
  81  |       sceneDescription: ''
  82  |     };
  83  |   }
  84  | 
  85  |   /**
  86  |    * AI决定下一步移动方向
  87  |    */
  88  |   async decideMoveDirection(targetDescription: string): Promise<'up' | 'down' | 'left' | 'right' | 'none'> {
  89  |     const base64Image = await this.captureScreenshot('move-decision');
  90  | 
  91  |     const prompt = `你正在控制游戏角色移动。目标：${targetDescription}
  92  | 
  93  | 请观察当前画面，决定最佳移动方向。只能选择一个方向：
  94  | - up (向上)
  95  | - down (向下)
  96  | - left (向左)
  97  | - right (向右)
  98  | - none (不需要移动)
  99  | 
  100 | 请只返回一个JSON：
  101 | {
  102 |   "direction": "up/down/left/right/none",
  103 |   "reason": "简短理由"
  104 | }`;
  105 | 
  106 |     const response = await this.visualAnalyzer.analyzeImage(base64Image, prompt);
  107 |     const jsonMatch = response.match(/\{[\s\S]*\}/);
  108 | 
  109 |     if (jsonMatch) {
  110 |       const parsed = JSON.parse(jsonMatch[0]);
  111 |       const dir = parsed.direction?.toLowerCase();
  112 |       if (['up', 'down', 'left', 'right', 'none'].includes(dir)) {
  113 |         return dir as 'up' | 'down' | 'left' | 'right' | 'none';
  114 |       }
  115 |     }
  116 | 
  117 |     return 'none';
  118 |   }
  119 | 
  120 |   /**
  121 |    * 执行移动操作
  122 |    */
  123 |   async performMove(direction: 'up' | 'down' | 'left' | 'right'): Promise<void> {
  124 |     const keyMap = {
  125 |       up: 'ArrowUp',
  126 |       down: 'ArrowDown',
  127 |       left: 'ArrowLeft',
  128 |       right: 'ArrowRight'
  129 |     };
  130 | 
> 131 |     await this.page.keyboard.down(keyMap[direction]);
      |                              ^ Error: keyboard.down: Test timeout of 30000ms exceeded.
  132 |     await this.page.waitForTimeout(200);
  133 |     await this.page.keyboard.up(keyMap[direction]);
  134 |     await this.page.waitForTimeout(300); // 等待移动完成
  135 |   }
  136 | 
  137 |   /**
  138 |    * AI控制玩家走向目标
  139 |    */
  140 |   async aiMoveTo(targetDescription: string, maxSteps: number = 50): Promise<boolean> {
  141 |     for (let i = 0; i < maxSteps; i++) {
  142 |       const direction = await this.decideMoveDirection(targetDescription);
  143 | 
  144 |       if (direction === 'none') {
  145 |         console.log(`[AI] 已到达目标或无法继续移动`);
  146 |         return true;
  147 |       }
  148 | 
  149 |       console.log(`[AI] Step ${i + 1}: 移动方向 ${direction}`);
  150 |       await this.performMove(direction);
  151 |     }
  152 | 
  153 |     return false;
  154 |   }
  155 | 
  156 |   /**
  157 |    * AI分析门入口是否可辨识
  158 |    */
  159 |   async analyzeDoorEntrance(doorPos: TilePos): Promise<{
  160 |     isRecognizable: boolean;
  161 |     description: string;
  162 |     canEnter: boolean;
  163 |   }> {
  164 |     const base64Image = await this.captureScreenshot('door-analysis');
  165 | 
  166 |     const prompt = `请分析当前游戏画面中是否可以看到一个门入口。
  167 | 
  168 | 这个游戏是像素风格的，门可能看起来像：
  169 | - 建筑的入口
  170 | - 一个通道
  171 | - 不同颜色的地面区域
  172 | 
  173 | 请判断：
  174 | 1. 画面中是否有看起来可以进入的区域？
  175 | 2. 这个区域是否清晰可辨？
  176 | 3. 玩家能否知道这里可以进入？
  177 | 
  178 | 返回JSON：
  179 | {
  180 |   "isRecognizable": true/false,
  181 |   "description": "描述",
  182 |   "canEnter": true/false
  183 | }`;
  184 | 
  185 |     const response = await this.visualAnalyzer.analyzeImage(base64Image, prompt);
  186 |     const jsonMatch = response.match(/\{[\s\S]*\}/);
  187 | 
  188 |     if (jsonMatch) {
  189 |       const parsed = JSON.parse(jsonMatch[0]);
  190 |       return {
  191 |         isRecognizable: parsed.isRecognizable ?? false,
  192 |         description: parsed.description ?? '',
  193 |         canEnter: parsed.canEnter ?? false
  194 |       };
  195 |     }
  196 | 
  197 |     return {
  198 |       isRecognizable: false,
  199 |       description: '无法解析AI响应',
  200 |       canEnter: false
  201 |     };
  202 |   }
  203 | 
  204 |   /**
  205 |    * 执行空格键交互
  206 |    */
  207 |   async performInteraction(): Promise<void> {
  208 |     await this.page.keyboard.down('Space');
  209 |     await this.page.waitForTimeout(100);
  210 |     await this.page.keyboard.up('Space');
  211 |     await this.page.waitForTimeout(500);
  212 |   }
  213 | }
  214 | 
  215 | test.describe('AI驱动游戏自动化测试', () => {
  216 |   let visualAnalyzer: VisualAnalyzer;
  217 |   let walkableVerifier: WalkableVerifier;
  218 |   let gameLauncher: GameLauncher;
  219 |   let stateExtractor: StateExtractor;
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
```