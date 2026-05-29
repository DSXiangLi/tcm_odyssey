# 药灵山谷 - 当前进行中状态

**最后更新**: 2026-05-27
**核心问题**: "我们正在做什么？进展如何？"
**当前状态**: Phase 2.5 Tool Card显示修复 - 已完成 ✅
**当前分支**: `hermes_dev`

---

## 已完成：DialogUI HTML嵌入方案 (Phase 2.5) ✅

### 完成时间

**开始**: 2026-05-16 14:00
**完成**: 2026-05-16 14:30
**总提交**: 15 commits

### 实现内容

将对话UI从Phaser实现迁移到React HTML嵌入，实现：
- ✅ 卷轴风古风界面（木轴装饰、宣纸纹理、古风字体）
- ✅ 富文本教学标记 `[[herb:黄芪]]` hover显示tooltip
- ✅ 多轮对话历史（最多50条，自动裁剪）
- ✅ SSE流处理在React层
- ✅ Tool Call通过bridge事件触发Phaser场景切换
- ✅ GameStateBridge对话历史持久化

### 任务完成状态

| Task | 内容 | 状态 |
|------|------|------|
| 1 | 事件桥接层 `dialog-events.ts` | ✅ 已完成 |
| 2 | 教学数据库 `tcm-data.ts` | ✅ 已完成 |
| 3 | 古风卷轴样式 `dialog.css` | ✅ 已完成 |
| 4 | React入口挂载 `dialog-entry.tsx` | ✅ 已完成 |
| 5 | DialogUI主组件 `DialogUI.tsx` | ✅ 已完成 |
| 6 | GameStateBridge扩展 | ✅ 已完成 |
| 7 | GardenScene集成 | ✅ 已完成 |
| 8 | ClinicScene集成 | ✅ 已完成 |
| 9 | E2E测试迁移 | ✅ 已完成（21个测试）|
| 10 | 删除旧DialogUI.ts | ✅ 已完成 |
| 11 | 构建验证 | ✅ 已完成 |

### 关键提交记录

| Commit | 描述 |
|--------|------|
| `4b701b6` | feat(dialog): complete React HTML-embedded DialogUI implementation |
| `ca657af` | fix(dialog): remove unused hideDialogUI import |
| `5628e12` | fix: remove stale DialogUI exports from index.ts |
| `34f0dc3` | chore: remove old Phaser DialogUI.ts |
| `681a794` | test(dialog): add quantified visual verification tests |
| `2e4202a` | test(dialog): migrate E2E tests to React DOM selectors |
| `fa10eb8` | feat(clinic): integrate React DialogUI |
| `b088c0c` | feat(garden): integrate React DialogUI via showDialogUI |
| `07459f6` | feat(dialog): add React entry mount point |
| `38d205d` | fix(dialog): prevent memory leak and stale closure |
| `c4d04bf` | fix(dialog): use GameStateBridge for dialog history |
| `f574798` | feat(bridge): add dialog history storage methods |

### 创建文件

| 文件 | 行数 | 职责 |
|------|------|------|
| `src/ui/html/bridge/dialog-events.ts` | 26 | 事件常量定义 |
| `src/ui/html/dialog-entry.tsx` | 70 | React入口挂载 |
| `src/ui/html/DialogUI.tsx` | 298 | React主组件 |
| `src/ui/html/dialog.css` | 414 | 古风卷轴样式 |
| `src/ui/html/data/tcm-data.ts` | 109 | 教学数据库 |

### 修改文件

| 文件 | 变更 |
|------|------|
| `src/utils/GameStateBridge.ts` | +39 对话历史方法 |
| `src/scenes/GardenScene.ts` | 替换DialogUI为showDialogUI |
| `src/scenes/ClinicScene.ts` | 替换DialogUI为showDialogUI |
| `tests/e2e/npc-dialog.spec.ts` | DOM选择器迁移+新增边界测试 |

### 删除文件

- `src/ui/DialogUI.ts` - 旧Phaser实现（422行）

### 验收结果

**构建验证**: ✅ 通过（仅预先存在的unused var警告）

**E2E测试**: 21个测试
- Smoke Tests (NPC-S01~S03): 3个
- Trigger Tests (NPC-T01~T04): 4个
- Dialog Flow Tests (NPC-D01~D05): 5个
- Tool Call Tests (NPC-TC01~TC04): 4个
- Quality Tests (NPC-Q01~Q03): 3个
- Boundary Tests (NPC-B01~B02): 2个（新增）

**量化视觉标准验证**:
- `.scroll-bar-top` 高度24px ✅
- `.dialog-paper` 背景色 rgb(240, 230, 210) ✅
- `.dialog-seal` 显示NPC首字 ✅
- `.tcm-tooltip` hover后 opacity=1 ✅

---

## 已完成：Hermes NPC 后端基础设施 (Phase 2.5) ✅

### 技术架构

```
前端 (Phaser + React @ localhost:3000)
    ↓ SSE/HTTP
Hermes Backend (FastAPI @ localhost:8642)
    ↓
├── Stream Consumer (SSE处理 + 工具执行)
├── Game Adapter (Mock数据存储)
├── Dialog Logger (日志记录)
└── Tool Registry (6个游戏工具)
    ↓
NPC Files (SOUL/MEMORY/SYLLABUS/TASKS)
    ↓
OpenAI Compatible LLM (对话生成)
```

---

## 本Session进展：Hermes NPC 工具测试与策略优化 (2026-05-18)

### 工具测试结果

测试了5个Hermes NPC游戏工具，全部成功：

| 工具 | 测试Query | 触发状态 | NPC响应效果 |
|------|-----------|---------|-------------|
| `get_learning_progress` | "老师，我学到哪了？" | ✅ 成功 | 显示6个任务进度和解锁依赖 |
| `trigger_minigame` | "我想试试煎药" | ✅ 成功 | 启动煎药游戏，给出煎法指导 |
| `get_inventory` | "背包里有什么药材？" | ✅ 成功 | 显示麻黄、桂枝等药材数量 |
| `get_case_progress` | "完成了哪些病案？" | ✅ 成功 | 显示3个病案状态（待开始/未解锁） |
| `get_npc_memory` | "你觉得我学习有什么问题？" | ✅ 成功 | 分析薄弱点并苏格拉底引导 |

### NPC主动行为验证

测试场景："我今天想学什么"

**NPC行为链**:
1. ✅ 调用 `get_npc_memory` → 获取玩家记忆
2. ✅ 调用 `get_learning_progress` → 分析进度状态
3. ✅ 调用 `get_inventory` → 查看已有药材
4. ✅ 主动推荐教学内容 → "推荐你从'风寒表实证-麻黄汤'入手"
5. ✅ 苏格拉底式引导 → 提问"无汗"二字的临床意义

**错误纠正测试**:
- 用户回答"桂枝清热解毒"（错误）
- NPC温和纠正 + 调用 `record_weakness` 记录薄弱点
- 后续对话针对性引导

### 用户提出的设计问题

**问题**: NPC工具使用是否应有TOOLS.md文档？让NPC知道何时触发？

**待调研**:
- Hermes官方是否有TOOLS.md机制？
- 心跳机制是否应定时分析玩家进度？
- 诊断游戏是否应调用NPC推理模块？

---

## 本Session进展：流式效果修复 (2026-05-21) ✅

### 问题现象

DialogUI打字机效果丢失：
- SSE事件批量处理导致文字一次显示
- React state批处理加剧问题

### 根本原因分析

```
后端日志：逐字发送（每chunk 1-3字符，间隔8-15ms）
前端日志：reader.read()批量读取64行 → 一次处理
```

**核心问题**: SSEClient批量读取多行后，React state批处理导致无打字机效果。

### 修复方案

1. **SSEClient**: 逐行处理添加15ms delay
   - 模拟真正的流式打字机效果
   
2. **DialogUI**: 完成时清空所有refs
   - 避免thinking/text重复显示

### 验证结果

- ✅ Thinking和text逐字显示
- ✅ 打字机效果恢复正常
- ❌ 工具卡片在回答后消失（新问题发现）

---

## 本Session进展：工具卡片保存问题 (2026-05-21) ✅ 已修复

### 问题现象

流式阶段工具卡片正确显示，回答完成后消失。

### 根本原因

```typescript
// 完成时清空
pendingToolCallsRef.current = []  // ← 工具卡片消失
```

工具调用信息未保存到消息历史中。

### 修复方案

1. 扩展DialogMessage接口添加`toolCalls?: ToolCallInfo[]`
2. 完成时保存工具调用到消息
3. 历史消息渲染工具卡片
4. 清空streaming区域避免重复

### 验证结果

- ✅ 工具卡片保留在历史消息中
- ✅ 点击可展开查看工具参数和结果

---

## 本Session进展：显示顺序修复 (2026-05-21) ✅ 已修复

### 问题现象

第二轮思考(postThinking)在最后回答之后消失，第一轮思考(preThinking)重复显示。

### 根本原因

Agent Loop产生两轮思考：
1. pre-tool thinking（工具执行前）
2. post-tool thinking（工具执行后）

前端将两轮合并为一个`thinking`字段，导致：
- 第一轮显示两次（streaming + 历史）
- 第二轮位置错误（应在tool之后而非tool之前）

### 修复方案

1. **DialogMessage接口**: 添加`preThinking`和`postThinking`字段
2. **onComplete**: 分别保存两轮思考
3. **MessageView渲染顺序**: preThinking → ToolCards → postThinking → text

### 验证结果

- ✅ 第一轮思考显示在工具之前
- ✅ 第二轮思考显示在工具之后
- ✅ 正确顺序：preThinking → Tools → postThinking → text

---

## 本Session进展：经验教训文档创建 (2026-05-21) ✅

### 文档位置

`docs/superpowers/experience/2026-05-21-hermes-dialog-streaming.md`

### 核心经验教训

| 编号 | 问题 | 教训 |
|-----|------|------|
| **E1** | 流式内容合并导致顺序错误 | Agent Loop产生多轮内容，需分段管理 |
| **E2** | toolCalls保存但未渲染 | 添加新字段时同步更新渲染组件 |
| **E3** | postThinking位置错误消失 | 按逻辑轮次排序：preThinking→Tools→postThinking→Text |
| **E4** | 多次修复前端无效 | 先验证后端，再排查前端（分层验证） |
| **E5** | tool_result匹配失败 | 用tid精确匹配，使用flushSync同步更新 |

### 开发规范建立

**Agent Loop内容分段规范**：

| 内容类型 | 时机 | 变量命名 | 显示位置 |
|---------|------|---------|---------|
| 第一轮思考 | tool_call前 | preThinking | tool之前 |
| 第一轮文本 | tool_call前 | preText | tool之前 |
| 工具调用 | agent触发 | toolCalls | 中间 |
| 第二轮思考 | tool_result后 | postThinking | tool之后 |
| 第二轮文本 | 最终回答 | postText | 最后 |

**数据流检查清单**：
- 后端：SSE事件顺序正确、tid匹配、分轮发送
- 前端：pre/post refs分离、onComplete分别保存、MessageView按顺序渲染

---

## 前Session进展：Tool Card显示问题修复 (2026-05-19) ✅

### 问题现象

DialogUI中Tool Card无法正确显示工具调用状态：
- 工具调用时显示"running"状态
- 工具结果返回后Tool Card消失或显示错误

### 根本原因分析

通过日志分析发现：
```
[DialogUI Render] toolCalls: 0 isGenerating: true
[DialogUI] Tool call received → setToolCalls
[DialogUI] Tool result received → setToolCalls
[DialogUI Render] toolCalls: 0 isGenerating: false  ← 仍然是 0！
```

**核心问题**: `tool_call` 和 `tool_result` 在同一个 event loop tick 中处理，React批量更新导致渲染时机错过了中间状态。

### 修复方案

**两层修复**:

1. **前端**: 使用 `flushSync` from `react-dom` 强制同步DOM更新
   - 在 tool_call 回调中使用 `flushSync` 包裹 ref 更新和 forceUpdate
   - 在 tool_result 回调中使用 `flushSync` 包裹状态更新

2. **后端**: 添加 500ms 延迟给前端渲染时间
   - 在 `main.py` 的 async generator 中，yield tool_call 后执行 `asyncio.sleep(0.5)`
   - 确保 tool_result 事件在前端渲染完成后再发送

### 验证结果

**E2E测试通过**:
```
[5500ms] Tool Card found: 1 (running: 1, done: 0)
Tool Card content: { icon: '📚', name: '学习进度', preview: '执行中...', isRunning: true }
✓ 2 passed
```

**关键指标**:
- Tool Card在DOM中可见 (toolCardCount: 1)
- 运行状态正确显示 (tool-card-running class)
- 图标正确 (📚)
- 名称正确 (学习进度)
- 状态指示正确 (执行中...)

### 关键提交

| Commit | 描述 |
|--------|------|
| `6dd9122` | fix: Tool Card visible during SSE streaming |

---

## 本Session进展：NPC自主Agent系统设计 (2026-05-19) ✅

### 设计内容

**设计文档**: `docs/superpowers/specs/phase2.5/2026-05-19-npc-autonomous-agent-design.md`

**核心问题**: 如何让NPC从"被动对话"升级为"自主Agent"，能够主动操纵游戏、获取状态、发布任务、给出反馈？

### 三个核心场景

| 优先级 | 场景 | 触发时机 | NPC行为 |
|--------|------|----------|---------|
| **P0** | 诊断结束→NPC点评 | DiagnosisScene完成5阶段后 | 分析辨证思路，调用feedback-evaluation生成点评 |
| **P0** | 对话开始自动查询 | 玩家靠近NPC按空格键 | 自动调用get_npc_memory + get_learning_progress |
| **P1** | 心跳检查→任务发布 | 进入诊所场景时 | 检查进度/背包，触发trigger_minigame或发布新任务 |

**排除场景**（用户确认）：
- 煎药结束→NPC反馈：煎药是纯操作小游戏，无需点评
- 炮制结束→NPC反馈：炮制是纯操作小游戏，无需点评

### Skill覆盖验证

| Skill | 覆盖场景 | 改动需求 |
|-------|----------|----------|
| `feedback-evaluation/SKILL.md` | 诊断结束点评 | ✅ 无需改动，已完整定义评分反馈模板 |
| `tools-guide/SKILL.md` 策略1 | 对话开始自动查询 | ✅ 无需改动 |
| `tools-guide/SKILL.md` 策略2/5 | 心跳检查任务发布 | 小改：补充策略6 |

### 游戏侧新增组件

| 组件 | 职责 | 文件路径 |
|------|------|----------|
| DiagnosisScorer | 评分计算 | `src/utils/DiagnosisScorer.ts` |
| NPCHeartbeat | 心跳检查 | `src/systems/NPCHeartbeat.ts` |
| NPCFeedbackBridge | 反馈桥接 | `src/ui/html/bridge/npc-feedback-bridge.ts` |

### 验收标准

- 诊断结束点评触发：完成诊断后NPC对话自动弹出
- 点评内容符合评分：低分点评指出错误，高分点评肯定+建议
- 对话开始自动查询：对话开始时NPC调用get_npc_memory
- 心跳检查触发：进入诊所时NPC调用get_inventory

---

## 下一步 TODO

### Phase 2.5 剩余任务

1. **NPC自主Agent实现** - 🔴 高优先级
   - 设计文档已完成，按实现清单执行
   - 估算3个新文件 + 5个修改文件 + E2E测试

2. **SSE流式处理修复** - 🔴 高优先级
   - 用户反馈：NPC回答缺少信息，content未正确处理
   - 检查 thinking、tool_call、tool_result、content 的完整处理链

3. **工具结果位置修复** - 🔴 高优先级
   - 用户反馈：工具结果展示位置不对
   - 检查 Tool Card 结果渲染布局

4. **种植小游戏** - 入口已存在，待开发

---

## 本Session进展：数据持久化机制确认 (2026-05-19) ✅

### 用户问题

**问题**: 当前的背包数据，游戏状态，病案状态是否有完整数据存储？

### 确认结果

**数据存储是完整的**：

| 数据类型 | 存储位置 | 存储方式 | 状态 |
|----------|----------|----------|------|
| **背包数据** | SaveManager → localStorage | `{ herbs, seeds, tools, knowledge_cards }` | ✅ 完整 |
| **病案历史** | SaveManager → localStorage | `case_history: CaseHistoryRecord[]` | ✅ 完整 |
| **Task进度** | SaveManager → localStorage | `tasks: TaskProgressSaveData[]` | ✅ 完整 |
| **经验值** | SaveManager → localStorage | `experience: ExperienceState` | ✅ 完整 |
| **对话历史** | GameStateBridge → 内存 | `dialogHistory: Map<string, DialogMessage[]>` | ✅ 完整 |

### Section 6.5 补充

**补充内容**：设计文档新增Section 6.5"数据持久化机制与NPC数据来源"

| 新增内容 | 说明 |
|----------|------|
| **存储架构图** | 3层架构：运行时内存→SaveManager→localStorage |
| **NPC数据获取路径表** | MCP工具从InventoryManager/CaseManager获取实时数据 |
| **关键说明** | NPC不直接访问localStorage，避免数据不一致 |
| **自动存档触发时机** | case_complete/item_acquire等事件触发SaveManager |

**核心要点**：
- NPC获取实时内存数据，而非localStorage
- 存档由SaveManager自动管理，NPC点评后会触发autoSave

---

## 本Session进展：自动化端到端测试调试 (2026-05-20)

### 问题现象

用户反馈NPC对话无法正常工作，后端日志显示AgentLoop没有输出。

### 调试步骤

**后端调试**：
- 在 `stream_consumer.py` 添加详细调试日志
- 重启后端监控 `/tmp/hermes_live.log`
- 确认新代码是否正确执行

**自动化测试启动**：
- 用户调用 `webwright` 技能
- 查看 `scripts/with_server.py` 用法（前后端服务器生命周期管理）
- 创建端到端测试脚本定位问题

### 测试目标

| 检查项 | 期望结果 |
|--------|----------|
| NPC对话触发 | 空格键触发对话UI显示 |
| Tool Card渲染 | running状态正确显示 |
| SSE流处理 | content正确渲染 |
| 工具结果返回 | Tool Card状态更新为done |

### 状态

🔧 自动化测试脚本创建中

---

## 本Session进展：工具卡片内容截断修复 (2026-05-22) ✅ 已修复

### 问题现象

用户测试对话UI时发现工具卡片展开后内容有截断。

### 根本原因

两个问题叠加：
1. **数据层**: snippet在保存时被截断到300字符（第462行）
2. **样式层**: CSS `.tool-result` max-height仅120px，内容较长时无法显示完整

### 修复方案

1. **DialogUI.tsx**: 移除snippet保存时的截断，保存完整内容
2. **dialog.css**: `.tool-result` max-height从120px增加到300px，支持滚动

### 验证结果

- ✅ 工具卡片展开后显示完整结果
- ✅ 长内容可通过滚动查看
- ✅ 页面热更新自动生效

### 前置修复

本Session还修复了游戏启动问题：

| 问题 | 原因 | 修复 |
|------|------|------|
| Vite 504 Outdated Dep | 缓存过期 + React依赖缺失 | 清缓存 + package.json添加react/react-dom/react-markdown |
| ENOSPC文件监视器超限 | .worktrees目录被监视 | vite.config.ts添加`watch: { ignored: ['.worktrees'] }` |

---

---

## 本Session进展：NPC E2E测试策略设计 (2026-05-23) ⏳ 设计完成，实现进行中

### 任务背景

全面覆盖NPC对话系统所有功能，建立完整测试矩阵：
- 6种触发策略正确执行
- 6个MCP工具正确调用
- 2种对话模式（normal/feedback）正常工作
- 心跳机制和缓存系统正确运行
- 评分系统和反馈内容质量

### 设计文档

**文档路径**: `docs/superpowers/specs/phase2.5/2026-05-23-npc-e2e-test-strategy-design.md`

### 测试文件结构

```
tests/e2e/
├── npc-dialog.spec.ts       # 对话模式测试（normal模式）- 12个测试
├── npc-feedback.spec.ts     # 反馈模式测试（feedback模式）- 8个测试
├── npc-tools.spec.ts        # MCP工具调用测试 - 10个测试（新建）
├── npc-heartbeat.spec.ts    # 心跳机制测试 - 8个测试（新建）
└── utils/
    └── npc-test-helpers.ts  # 共享测试辅助函数（新建）
```

### 测试矩阵

| 测试文件 | 覆盖功能 | 测试数 | 主要验证方式 |
|----------|----------|--------|--------------|
| npc-dialog.spec.ts | 对话触发、对话流、UI结构、对话历史 | 12 | 结构验证 |
| npc-feedback.spec.ts | 诊断反馈、评分等级、清理机制 | 8 | 结构 + 关键词验证 |
| npc-tools.spec.ts | 6个MCP工具触发、Tool Card显示 | 10 | Tool Card + 结构验证 |
| npc-heartbeat.spec.ts | 场景触发心跳、缓存机制、任务发布 | 8 | 缓存验证 |
| **总计** | | **38** | |

### 测试策略决策

| 决策点 | 选择 | 说明 |
|--------|------|------|
| 覆盖范围 | 全面覆盖 | 建立完整测试矩阵 |
| 执行环境 | 真实集成 | Hermes后端 + 真实AI响应（不mock） |
| 内容验证 | 组合策略 | 结构验证 + 关键词验证 + LLM评估器 |
| 文件组织 | 按功能模块 | 4个独立测试文件 |
| 数据准备 | 混合模式 | Mock数据与真实格式一致 |
| 运行时机 | 手动触发 | 开发者控制运行时间（真实AI耗时长） |

### 现有测试文件状态

| 文件 | 状态 | 说明 |
|------|------|------|
| `npc-dialog.spec.ts` | 已存在（837行） | 需补充测试至12个 |
| `npc-feedback.spec.ts` | 已存在（383行） | 需补充测试至8个 |
| `npc-tools.spec.ts` | 不存在 | 需新建（10个测试） |
| `npc-heartbeat.spec.ts` | 不存在 | 需新建（8个测试） |
| `utils/npc-test-helpers.ts` | 不存在 | 需新建（共享辅助函数） |

### 设计自检

| 检查项 | 结果 | 说明 |
|--------|------|------|
| Placeholder扫描 | ✅ | 无TBD/TODO占位符 |
| 内部一致性 | ✅ | 测试矩阵与功能描述一致 |
| 范围聚焦 | ✅ | 38个测试，单一实现计划可行 |
| 模糊性检查 | ✅ | 验证方式明确指定 |

### 验收标准

| 标准 | 要求 |
|------|------|
| 测试覆盖率 | 38个测试全部通过 |
| 结构验证 | 所有UI组件正确显示 |
| 关键词验证 | 评分等级关键词正确匹配 |
| LLM评估器 | 平均评分 >= 80分 |
| 清理机制 | 对话关闭后资源正确释放 |
| 缓存机制 | 心跳缓存数据格式正确 |

### 当前状态

实现计划编写中（对话在创建实现计划时截断）

---

## 本Session进展：webwright插件安装与文档更新 (2026-05-27) ✅

### 变更内容

1. **webwright插件安装**
   - 替代已废弃的 webapp-testing
   - 技能调用方式：直接使用 `webwright`（无 `:run` 后缀）

2. **文档技能引用更新**
   - 更新4个文件，将 `webapp-testing` 替换为 `webwright`
   - 统一调用方式为 `webwright`（用户纠正：无 `:run` 后缀）

### 更新文件

| 文件 | 变更内容 |
|------|----------|
| PROGRESS.md | webwright 替换 webapp-testing |
| docs/superpowers/specs/phase2/2026-04-15-phase2-visual-acceptance-design.md | webwright 替换 webapp-testing |
| docs/superpowers/specs/phase2-5/2026-04-29-diagnosis-test-acceptance.md | webwright 替换 webapp-testing |
| docs/testing/visual-acceptance-experience.md | webwright 替换 webapp-testing |

---

## 本Session进展：TutorialUI跳过引导弹窗修复 (2026-05-29) ✅

### 问题现象

点击"跳过引导"按钮后确认弹窗文字超出窗口边界：
- 弹窗宽度350px，文字限制290px
- 确认文字32个汉字在16px字体下约512px
- 文字超出弹窗边界显示

### 修复方案

`src/ui/TutorialUI.ts`:
- dialogWidth: 350px → 500px
- dialogHeight: 180px → 200px
- textMaxWidth: 290px → 440px

### 验证结果

- ✅ 确认文字完整显示在弹窗内
- ✅ 弹窗尺寸适配32个汉字长度

### 提交记录

| Commit | 描述 |
|--------|------|
| `681336a` | fix(ui): 修复跳过引导确认弹窗文字超出问题 |

---

*本文档由 Claude Code 维护，更新于 2026-05-29*