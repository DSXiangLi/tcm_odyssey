---
name: npc-e2e-test-strategy
description: "NPC对话系统端到端测试策略 - 全面覆盖6种触发策略、6个MCP工具、2种对话模式"
version: 1.0.0
author: 药灵山谷
date: 2026-05-23
---

# NPC对话系统端到端测试策略

## 一、概述

### 测试目标
全面覆盖NPC对话系统所有功能，验证：
- 6种触发策略正确执行
- 6个MCP工具正确调用
- 2种对话模式（normal/feedback）正常工作
- 心跳机制和缓存系统正确运行
- 评分系统和反馈内容质量

### 测试策略选择
| 决策点 | 选择 | 说明 |
|--------|------|------|
| 覆盖范围 | 全面覆盖 | 建立完整测试矩阵 |
| 执行环境 | 真实集成 | Hermes后端 + 真实AI响应 |
| 内容验证 | 组合策略 | 结构验证 + 关键词验证 + LLM评估器 |
| 文件组织 | 按功能模块 | 4个独立测试文件 |
| 数据准备 | 混合模式 | Mock数据与真实格式一致 |
| 运行时机 | 手动触发 | 开发者控制运行时间 |

---

## 二、测试文件结构

```
tests/e2e/
├── npc-dialog.spec.ts       # 对话模式测试（normal模式）- 12个测试
├── npc-feedback.spec.ts     # 反馈模式测试（feedback模式）- 8个测试
├── npc-tools.spec.ts        # MCP工具调用测试 - 10个测试
├── npc-heartbeat.spec.ts    # 心跳机制测试 - 8个测试
└── utils/
    └── npc-test-helpers.ts  # 共享测试辅助函数
```

---

## 三、测试矩阵总览

| 测试文件 | 覆盖功能 | 测试数 | 主要验证方式 |
|----------|----------|--------|--------------|
| npc-dialog.spec.ts | 对话触发、对话流、UI结构、对话历史 | 12 | 结构验证 |
| npc-feedback.spec.ts | 诊断反馈、评分等级、清理机制 | 8 | 结构 + 关键词验证 |
| npc-tools.spec.ts | 6个MCP工具触发、Tool Card显示 | 10 | Tool Card + 结构验证 |
| npc-heartbeat.spec.ts | 场景触发心跳、缓存机制、任务发布 | 8 | 缓存验证 |
| **总计** | | **38** | |

---

## 四、模块1：对话模式测试（npc-dialog.spec.ts）

### 覆盖功能
- 策略1：对话开始分析（NPC记忆 + 学习进度）
- 对话UI触发和结构
- SSE流式响应
- 多轮对话连贯性
- 对话历史管理

### 测试场景

| 测试ID | 测试名称 | 触发方式 | 验证内容 |
|--------|----------|----------|----------|
| NPC-DLG-01 | 空格键触发对话 | `Space` | dialog-ui-root可见 |
| NPC-DLG-02 | N键触发对话 | `N` | dialog-ui-root可见 |
| NPC-DLG-03 | 对话UI结构完整 | 触发后 | 标题、消息区、输入框、关闭按钮 |
| NPC-DLG-04 | NPC名称正确显示 | 触发后 | 包含"青木" |
| NPC-DLG-05 | SSE流式响应显示 | 发送消息 | 消息逐步显示 |
| NPC-DLG-06 | 用户输入发送 | Enter键 | 消息出现在对话区 |
| NPC-DLG-07 | 对话历史滚动 | 多轮对话 | 滚动条可见 |
| NPC-DLG-08 | Rich Text标记渲染 | 特定话题 | [[kind:term]]渲染正确 |
| NPC-DLG-09 | 关闭按钮清理 | 点击X | dialog-ui-root移除 |
| NPC-DLG-10 | 多轮对话连贯性 | 3轮对话 | NPC记忆上下文 |
| NPC-DLG-11 | NPC个性化开场 | 首次对话 | 调用get_npc_memory |
| NPC-DLG-12 | 对话历史上限 | 50+轮 | 保留最新50条 |

---

## 五、模块2：反馈模式测试（npc-feedback.spec.ts）

### 覆盖功能
- 策略6：游戏结果反馈模式
- 评分系统（20/20/40/20权重）
- feedback模式对话流
- 场景返回机制

### 测试场景

| 测试ID | 测试名称 | 评分 | 验证内容 |
|--------|----------|------|----------|
| NPC-FB-01 | 诊断完成触发反馈 | 100 | dialog-ui-root可见 |
| NPC-FB-02 | 优秀评分反馈 | 90+ | 包含"优秀"关键词 |
| NPC-FB-03 | 良好评分反馈 | 70-89 | 包含"良好"关键词 |
| NPC-FB-04 | 合格评分反馈 | 60-69 | 包含"合格"关键词 |
| NPC-FB-05 | 需加强评分反馈 | <60 | 包含"需加强"关键词 |
| NPC-FB-06 | 错误详细指出 | 0分 | 包含舌诊/脉诊错误说明 |
| NPC-FB-07 | 反馈后返回场景 | 关闭对话 | 返回ClinicScene |
| NPC-FB-08 | 反馈对话UI结构 | 反馈中 | mode=feedback状态正确 |

---

## 六、模块3：MCP工具调用测试（npc-tools.spec.ts）

### 覆盖功能
- 策略2：教学进度驱动（trigger_minigame）
- 策略3：背包驱动实践（get_inventory）
- 策略4：薄弱点记录（record_weakness）
- 策略5：病案进度查询（get_case_progress）
- Tool Card UI显示

### 测试场景

| 测试ID | 测试名称 | 工具 | 验证内容 |
|--------|----------|------|----------|
| NPC-TL-01 | 查询背包触发 | get_inventory | Tool Card显示 |
| NPC-TL-02 | 学习进度触发 | get_learning_progress | Tool Card显示 |
| NPC-TL-03 | 病案进度触发 | get_case_progress | Tool Card显示 |
| NPC-TL-04 | 启动小游戏触发 | trigger_minigame | 小游戏场景启动 |
| NPC-TL-05 | 记录薄弱点触发 | record_weakness | weaknessLog增加 |
| NPC-TL-06 | NPC记忆触发 | get_npc_memory | Tool Card显示 |
| NPC-TL-07 | Tool Card执行中状态 | 工具调用 | "执行中..."显示 |
| NPC-TL-08 | Tool Card完成状态 | 工具完成 | "完成"显示 |
| NPC-TL-09 | Tool Card展开详情 | 点击展开 | 参数和结果显示 |
| NPC-TL-10 | 多工具调用序列 | 连续对话 | 多个Tool Card正确排序 |

---

## 七、模块4：心跳机制测试（npc-heartbeat.spec.ts）

### 覆盖功能
- 场景进入触发心跳
- 预查询缓存机制
- 30秒间隔防重复
- NPC主动任务发布
- 缓存清理和保留策略

### 测试场景

| 测试ID | 测试名称 | 场景 | 验证内容 |
|--------|----------|------|----------|
| NPC-HB-01 | ClinicScene进入心跳 | ClinicScene | inventoryCache存在 |
| NPC-HB-02 | GardenScene进入心跳 | GardenScene | inventoryCache存在 |
| NPC-HB-03 | 心跳缓存inventory | 心跳后 | 数据格式正确 |
| NPC-HB-04 | 心跳缓存progress | 心跳后 | 数据格式正确 |
| NPC-HB-05 | 30秒间隔防重复 | 连续进入 | 只触发一次 |
| NPC-HB-06 | NPC主动发布任务 | 特定状态 | 任务提示出现 |
| NPC-HB-07 | 缓存失效重新获取 | 切换场景 | 重新调用fetchAndCacheData |
| NPC-HB-08 | weaknessLog跨场景保留 | 场景切换 | 薄弱记录不丢失 |

---

## 八、数据准备策略

### Mock数据格式（与真实格式一致）

```typescript
// tests/e2e/utils/npc-test-helpers.ts

// 背包数据（与 InventoryManager.exportData() 格式一致）
export const MOCK_INVENTORY = {
  herbs: { '麻黄': 3, '桂枝': 2, '杏仁': 5 },
  seeds: { '甘草种子': 2 },
  tools: { '药碾': 1 },
  knowledge_cards: []
};

// 学习进度（与 CaseManager.getStatistics() 格式一致）
export const MOCK_PROGRESS = {
  total_cases: 10,
  completed_cases: 5,
  correct_rate: 0.8,
  current_task: 'task_002'
};

// NPC记忆（与对话历史格式一致）
export const MOCK_NPC_MEMORY = {
  last_session: '2026-05-22',
  topics_discussed: ['麻黄汤', '风寒表证'],
  weaknesses_recorded: ['舌诊识别不准']
};

// 诊断结果（与 DiagnosisResult 格式一致）
export const MOCK_DIAGNOSIS_RESULT = {
  caseId: 'case-001',
  patient: { name: '李秀梅', age: 35, gender: '女', chief: '脘腹胀满' },
  diagnosis: {
    tongue: { color: '淡白', coating: '白腻', shape: '胖大有齿痕', moisture: '水滑' },
    pulse: { position: '关', quality: '濡缓' },
    symptoms: ['脘腹胀满'],
    syndrome: ['b1'],
    prescription: ['f1']
  }
};
```

### 数据注入方式

```typescript
// 注入背包数据
await page.evaluate((inventory) => {
  const bridge = (window as any).__GAME_STATE_BRIDGE__;
  bridge?.updateInventoryCache(inventory);
}, MOCK_INVENTORY);

// 注入诊断结果（触发反馈）
await page.evaluate((result) => {
  const scene = (window as any).__DIAGNOSIS_SCENE__;
  scene?.handleDiagnosisComplete(result);
}, MOCK_DIAGNOSIS_RESULT);
```

---

## 九、验证策略

### 1. 结构验证（必做）

验证UI组件存在和可见：

```typescript
// 对话框结构验证
await expect(page.locator('#dialog-ui-root')).toBeVisible();
await expect(page.locator('.dialog-title')).toContainText('青木');
await expect(page.locator('.dialog-messages')).toBeVisible();
await expect(page.locator('.tool-card')).toBeVisible();
```

### 2. 关键词验证（特定场景）

检查NPC响应包含预期关键词：

```typescript
// 评分等级关键词映射
const SCORE_KEYWORDS = {
  excellent: '优秀',
  good: '良好',
  pass: '合格',
  need_improve: '需加强'
};

// 等待响应完成并验证
const response = await page.locator('.dialog-content').textContent();
expect(response).toContain(SCORE_KEYWORDS[level]);
```

### 3. LLM评估器（定期运行）

调用现有评估脚本评估NPC响应质量：

```bash
# 运行LLM评估器
npm run test:npc-eval

# 评估配置
# - evaluator_path: scripts/npc_acceptance/dialog_evaluator.py
# - criteria: 准确性、教学性、语气一致性
# - threshold: 80分（最低合格分数）
```

---

## 十、测试辅助函数

```typescript
// tests/e2e/utils/npc-test-helpers.ts

/**
 * 进入指定场景
 */
export async function enterScene(page: Page, sceneName: string) {
  await page.evaluate((name) => {
    const game = (window as any).__PHASER_GAME__;
    game?.scene?.start(name);
  }, sceneName);
  await page.waitForTimeout(2000);
}

/**
 * 触发NPC对话
 */
export async function triggerDialog(page: Page) {
  await page.keyboard.press('N');
  await page.waitForSelector('#dialog-ui-root', { timeout: 5000 });
}

/**
 * 发送用户消息
 */
export async function sendUserMessage(page: Page, message: string) {
  await page.locator('.dialog-input').fill(message);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(1000);
}

/**
 * 等待NPC响应完成
 */
export async function waitForNPCResponse(page: Page) {
  await page.waitForSelector('.generating-done', { timeout: 60000 });
}

/**
 * 关闭对话并返回清理状态
 */
export async function closeDialog(page: Page): Promise<boolean> {
  await page.locator('.dialog-close-btn').click();
  await page.waitForTimeout(500);
  const exists = await page.locator('#dialog-ui-root').isVisible().catch(() => false);
  return !exists;
}

/**
 * 验证Tool Card显示
 */
export async function verifyToolCard(page: Page, toolName: string) {
  const toolCard = page.locator(`.tool-card[data-tool="${toolName}"]`);
  await expect(toolCard).toBeVisible();
}

/**
 * 模拟诊断完成
 */
export async function simulateDiagnosisComplete(page: Page, result: DiagnosisResult) {
  await page.evaluate((res) => {
    const scene = (window as any).__DIAGNOSIS_SCENE__;
    scene?.handleDiagnosisComplete(res);
  }, result);
}
```

---

## 十一、运行配置

### Playwright配置

```typescript
// playwright.config.ts NPC测试专用配置

{
  name: 'npc-tests',
  testMatch: /npc-.*\.spec\.ts/,
  timeout: 120000,  // NPC测试需要更长超时（AI响应）
  retries: 1,
  use: {
    baseURL: 'http://localhost:3000',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure'
  }
}
```

### 运行命令

```bash
# 运行全部NPC测试
npm run test:e2e -- --grep "NPC"

# 运行单个模块
npm run test:e2e -- tests/e2e/npc-dialog.spec.ts
npm run test:e2e -- tests/e2e/npc-feedback.spec.ts
npm run test:e2e -- tests/e2e/npc-tools.spec.ts
npm run test:e2e -- tests/e2e/npc-heartbeat.spec.ts

# 运行LLM评估器
npm run test:npc-eval
```

---

## 十二、前置条件

### 必须运行的服务
| 服务 | 端口 | 启动命令 |
|------|------|----------|
| 前端开发服务器 | 3000 | `npm run dev` |
| Hermes后端 | 8642 | `python hermes_backend/main.py` |

### 测试前检查
```bash
# 检查服务状态
curl http://localhost:3000  # 前端
curl http://localhost:8642/health  # Hermes后端
```

---

## 十三、验收标准

| 标准 | 要求 |
|------|------|
| 测试覆盖率 | 38个测试全部通过 |
| 结构验证 | 所有UI组件正确显示 |
| 关键词验证 | 评分等级关键词正确匹配 |
| LLM评估器 | 平均评分 >= 80分 |
| 清理机制 | 对话关闭后资源正确释放 |
| 缓存机制 | 心跳缓存数据格式正确 |

---

*设计文档生成时间: 2026-05-23*