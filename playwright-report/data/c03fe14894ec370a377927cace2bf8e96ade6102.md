# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: visual_acceptance/screenshot_collector.spec.ts >> 视觉验收截图采集 >> 采集场景 NPC-01: 与NPC开始对话
- Location: tests/visual_acceptance/screenshot_collector.spec.ts:113:3

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5173/
Call log:
  - navigating to "http://localhost:5173/", waiting until "load"

```

# Test source

```ts
  1   | // tests/visual_acceptance/screenshot_collector.spec.ts
  2   | 
  3   | import { test, expect } from '@playwright/test';
  4   | import { SCREENSHOT_SCENES, TOTAL_SCREENSHOT_COUNT } from './screenshot_config';
  5   | import { SceneOperations } from './scene_operations';
  6   | import * as fs from 'fs';
  7   | import * as path from 'path';
  8   | 
  9   | test.describe('视觉验收截图采集', () => {
  10  |   let operations: SceneOperations;
  11  |   const screenshotDir = 'reports/visual_acceptance/screenshots/';
  12  | 
  13  |   test.beforeEach(async ({ page }) => {
  14  |     // 确保截图目录存在
  15  |     if (!fs.existsSync(screenshotDir)) {
  16  |       fs.mkdirSync(screenshotDir, { recursive: true });
  17  |     }
  18  | 
  19  |     // 启动游戏
> 20  |     await page.goto('http://localhost:5173');
      |                ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5173/
  21  |     operations = new SceneOperations(page);
  22  |     await operations.waitForGameReady();
  23  |   });
  24  | 
  25  |   test('采集全部场景截图', async ({ page }) => {
  26  |     const collectedScreenshots: string[] = [];
  27  |     const errors: string[] = [];
  28  | 
  29  |     for (const scene of SCREENSHOT_SCENES) {
  30  |       try {
  31  |         // 执行操作序列
  32  |         await operations.executeOperations(scene.operations);
  33  | 
  34  |         // 采集指定数量的截图
  35  |         for (let i = 0; i < scene.screenshotCount; i++) {
  36  |           const filename = `${scene.id}-${i + 1}.png`;
  37  |           const filepath = path.join(screenshotDir, filename);
  38  | 
  39  |           await page.screenshot({ path: filepath, fullPage: false });
  40  |           collectedScreenshots.push(filename);
  41  | 
  42  |           // 如果需要多张截图，在采集间执行额外操作（轻微变化）
  43  |           if (i < scene.screenshotCount - 1 && scene.operations.length > 0) {
  44  |             // 执行轻微变化操作（如移动一小步）
  45  |             await operations.movePlayer('right', 500);
  46  |           }
  47  |         }
  48  |       } catch (error) {
  49  |         // 记录错误但继续采集其他场景
  50  |         const errorMsg = `场景 ${scene.id} (${scene.name}) 采集失败: ${error}`;
  51  |         errors.push(errorMsg);
  52  |         console.error(errorMsg);
  53  |       }
  54  |     }
  55  | 
  56  |     // 验证截图数量（允许部分失败）
  57  |     const successRate = collectedScreenshots.length / TOTAL_SCREENSHOT_COUNT;
  58  |     expect(successRate).toBeGreaterThan(0.8); // 至少80%成功
  59  | 
  60  |     // 输出采集报告
  61  |     const reportPath = path.join(screenshotDir, 'collection_report.json');
  62  |     const report = {
  63  |       total: TOTAL_SCREENSHOT_COUNT,
  64  |       collected: collectedScreenshots.length,
  65  |       successRate: successRate,
  66  |       scenes: SCREENSHOT_SCENES.map(s => ({ id: s.id, name: s.name, count: s.screenshotCount })),
  67  |       collectedFiles: collectedScreenshots,
  68  |       errors: errors,
  69  |       timestamp: new Date().toISOString(),
  70  |     };
  71  |     fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  72  | 
  73  |     // 如果有错误，输出摘要
  74  |     if (errors.length > 0) {
  75  |       console.log(`\n采集摘要: ${collectedScreenshots.length}/${TOTAL_SCREENSHOT_COUNT} 成功`);
  76  |       console.log(`失败场景:\n${errors.join('\n')}`);
  77  |     }
  78  |   });
  79  | 
  80  |   // 单场景测试 - 用于调试单个场景
  81  |   test('采集场景 SCENE-01: 百草镇室外探索', async ({ page }) => {
  82  |     const scene = SCREENSHOT_SCENES.find(s => s.id === 'SCENE-01');
  83  |     if (!scene) {
  84  |       throw new Error('场景 SCENE-01 未找到');
  85  |     }
  86  | 
  87  |     await operations.executeOperations(scene.operations);
  88  | 
  89  |     const filename = `${scene.id}-test.png`;
  90  |     await page.screenshot({ path: path.join(screenshotDir, filename) });
  91  | 
  92  |     // 验证游戏状态正确
  93  |     const state = await operations.getGameState();
  94  |     expect(state.gameReady).toBe(true);
  95  |   });
  96  | 
  97  |   test('采集场景 SCENE-02: 青木诊所室内', async ({ page }) => {
  98  |     const scene = SCREENSHOT_SCENES.find(s => s.id === 'SCENE-02');
  99  |     if (!scene) {
  100 |       throw new Error('场景 SCENE-02 未找到');
  101 |     }
  102 | 
  103 |     await operations.executeOperations(scene.operations);
  104 | 
  105 |     const filename = `${scene.id}-test.png`;
  106 |     await page.screenshot({ path: path.join(screenshotDir, filename) });
  107 | 
  108 |     // 验证场景切换成功
  109 |     const state = await operations.getGameState();
  110 |     expect(state.currentScene).toBe('ClinicScene');
  111 |   });
  112 | 
  113 |   test('采集场景 NPC-01: 与NPC开始对话', async ({ page }) => {
  114 |     const scene = SCREENSHOT_SCENES.find(s => s.id === 'NPC-01');
  115 |     if (!scene) {
  116 |       throw new Error('场景 NPC-01 未找到');
  117 |     }
  118 | 
  119 |     await operations.executeOperations(scene.operations);
  120 | 
```