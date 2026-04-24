# Hermes 后端集成设计规范

**版本**: v1.1
**日期**: 2026-04-23
**阶段**: Phase 2.5 补充
**状态**: 待审阅（已修正 Skills vs Tools 分类）

---

## 1. 背景与问题

### 1.1 当前状态

- Phase 2 实现了 Hermes Agent 的前端集成代码（HermesManager, SSEClient, NPCInteraction, DialogUI）
- Hermes 后端 Python 服务从未启动，游戏显示 "[Hermes服务未连接，显示占位对话]"
- NPC 青木先生无法真正对话，仅显示静态占位文字

### 1.2 根本原因

1. **后端缺失**: `hermes/` 目录下只有 NPC 配置文件，没有 Python 后端代码
2. **启动机制缺失**: `main.ts` 只检查 HTTP 连接，没有启动 Python 进程
3. **导入依赖不存在**: `game_adapter.py` 引用的 `run_agent.py` 不在项目中

### 1.3 设计原则修正（AI-Oriented）

根据 Phase 2 设计文档的核心理念，NPC 应具备"有灵魂"的特性：

| 维度 | 定义 | Hermes对应 |
|-----|------|-----------|
| **身份认同** | 我是谁？我的专业？我的性格？ | SOUL.md |
| **记忆系统** | 我对这个学生了解什么？ | USER.md + SessionDB |
| **教学大纲** | 我要教什么？教学计划是什么？ | SYLLABUS.md |
| **任务管理** | 学生学到哪了？下一步学什么？ | TASKS.json + Tools |
| **教学方法** | 我该如何教学？如何引导？ | **Skills（新增重点）** |

**核心修正**：教学方法论应该是 Skills（指导文档），而非 Tools（数据操作）。

### 1.4 目标

- 完整集成 hermes-agent 后端到游戏项目
- 青木先生支持自由对话 + 病案触发两种模式
- SSE 流式输出逐字显示对话
- NPC 拥有完整的教学方法论（Skills）和数据管理能力（Tools）

---

## 2. Hermes-Agent 框架分析

### 2.1 工具注册机制

```python
# tools/registry.py
registry.register(
    name="todo",
    toolset="todo",
    schema=TODO_SCHEMA,          # OpenAI Function-Calling 格式
    handler=lambda args, **kw: todo_tool(..., store=kw.get("store")),
    check_fn=check_requirements, # 可选：工具可用性检查
    emoji="📋",                  # UI 显示
)
```

关键特性：
- 所有工具在模块导入时自注册
- `model_tools.py` 的 `_discover_tools()` 触发导入
- handler 通过 `**kw` 接收 agent 运行时状态

### 2.2 Agent 状态工具特殊处理

```python
# model_tools.py
_AGENT_LOOP_TOOLS = {"todo", "memory", "session_search", "delegate_task"}

# run_agent.py 内联处理
if function_name == "todo":
    function_result = _todo_tool(
        todos=function_args.get("todos"),
        store=self._todo_store,  # Agent 状态直接传入
    )
```

原因：这些工具需要 agent 实例级别的状态（TodoStore, MemoryStore, SessionDB）。

### 2.3 NPC 配置加载

```python
# agent/prompt_builder.py
def load_soul_md() -> Optional[str]:
    soul_path = get_hermes_home() / "SOUL.md"  # ~/.hermes/SOUL.md
    ...
```

系统提示组装顺序：
1. Agent Identity (SOUL.md)
2. User/Gateway system prompt
3. Persistent memory (MEMORY.md + USER.md)
4. Skills index
5. Context files

### 2.4 持久化机制

| 组件 | 存储 | 用途 |
|-----|------|------|
| `TodoStore` | 会话内存 | Agent 内部任务分解 |
| `MemoryStore` | MEMORY.md / USER.md | 跨会话持久记忆 |
| `SessionDB` | SQLite + FTS5 | 会话历史 + 全文搜索 |

---

## 3. 游戏 Task 系统对比分析

### 3.1 hermes todo_tool vs 游戏 TASKS.json

| 特性 | hermes todo_tool | 游戏 TASKS.json |
|-----|------------------|-----------------|
| **所有权** | Agent 自己的任务 | NPC 发布给玩家 |
| **持久化** | 会话内存（压缩后注入） | JSON 文件持久化 |
| **状态** | pending/in_progress/completed/cancelled | pending/in_progress/completed |
| **进度度量** | 无 mastery 字段 | mastery 0-1 掌握度 |
| **解锁机制** | 无 blocked_by | 有 blocked_by 依赖链 |
| **子任务** | 无 todos 子结构 | 每个任务包含 todos 数组 |
| **薄弱点记录** | 无 | weaknesses 数组 |

### 3.2 结论

游戏 Task 系统需要独立工具，不能复用 hermes todo_tool。

---

## 4. 集成架构设计

### 4.1 分层架构

```
┌─────────────────────────────────────────────────────────────┐
│                    游戏前端 (Phaser)                          │
├─────────────────────────────────────────────────────────────┤
│  DialogUI.ts          │  NPCInteraction.ts                  │
│  - SSE 流式接收         │  - NPC 注册/触发                    │
│  - 停止生成按钮         │  - 消息发送                         │
├─────────────────────────────────────────────────────────────┤
│  SSEClient.ts         │  HermesManager.ts                   │
│  - OpenAI 格式适配      │  - 健康检查                         │
│  - POST /v1/chat/...   │  - 状态暴露                         │
└─────────────────────────────────────────────────────────────┘
                          │ HTTP/SSE (localhost:8642)
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                   Hermes 后端 (Python)                       │
├─────────────────────────────────────────────────────────────┤
│  api_server.py                                             │
│  - POST /v1/chat/completions (stream=true)                 │
│  - GET /health                                             │
│  - OpenAI 格式 SSE                                         │
├─────────────────────────────────────────────────────────────┤
│  run_agent.py (AIAgent)                                    │
│  - 对话引擎                                                 │
│  - NPC 配置加载 (SOUL.md, SYLLABUS.md)                     │
│  - Skills 加载（教学方法论）                                │
│  - Tools 调度 (game_task, game_case)                       │
├─────────────────────────────────────────────────────────────┤
│  tools/game_tools.py                                       │
│  - game_task: Task/Todo 读写                                │
│  - game_case: 病案解锁检查                                  │
├─────────────────────────────────────────────────────────────┤
│  skills/tcm-teaching/                                       │
│  - inquiry-guidance: 问诊引导方法论                         │
│  - syllabus-lecture: 教学大纲讲解方法论                     │
│  - diagnosis-reasoning: 辨证推理引导方法论                  │
│  - prescription-comparison: 方剂对比教学方法论              │
│  - weakness-intervention: 薄弱点诊断与干预方法论            │
├─────────────────────────────────────────────────────────────┤
│  agent/prompt_builder.py                                   │
│  - load_npc_config(): NPC 配置加载（定制）                  │
├─────────────────────────────────────────────────────────────┤
│  hermes/npcs/qingmu/                                        │
│  - SOUL.md, MEMORY.md, USER.md, SYLLABUS.md               │
│  - TASKS.json (任务进度)                                    │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                   Vite 开发服务器                            │
├─────────────────────────────────────────────────────────────┤
│  vite-plugins/hermesLauncher.ts                            │
│  - 启动 Python 进程                                         │
│  - 监听进程状态                                              │
│  - 断开后自动重启                                            │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 文件结构

```
zhongyi_game_v3/
├── hermes_backend/                     # 新增：Hermes 后端
│   ├── run_agent.py                    # 核心 Agent 引擎
│   ├── hermes_state.py                 # SessionDB
│   ├── model_tools.py                  # 工具调度
│   ├── toolsets.py                     # 工具集定义
│   ├── hermes_constants.py             # 常量
│   ├── hermes_logging.py               # 日志
│   ├── gateway/
│   │   ├── run.py                      # Gateway 入口
│   │   ├── config.py                   # 配置
│   │   ├── session.py                  # 会话管理
│   │   └── platforms/
│   │       ├── base.py                 # 平台适配器基类
│   │       └ api_server.py             # OpenAI API Server
│   │       └── game_adapter.py         # 游戏适配器（定制）
│   ├── agent/
│   │   ├── prompt_builder.py           # 系统提示组装（定制 NPC 加载）
│   │   ├── memory_manager.py           # 记忆管理
│   │   ├── context_compressor.py       # 上下文压缩
│   │   ├── model_metadata.py           # 模型元数据
│   │   ├── retry_utils.py              # 重试机制
│   │   └── trajectory.py               # 轨迹记录
│   ├── tools/
│   │   ├── registry.py                 # 工具注册中心
│   │   ├── todo_tool.py                # Agent 内部 todo
│   │   ├── memory_tool.py              # 持久记忆
│   │   ├── session_search_tool.py      # 会话搜索
│   │   ├── game_tools.py               # 游戏专用工具（新增）
│   │   └── ...                         # 其他工具（可选）
│   ├── hermes_cli/
│   │   ├── config.py                   # 配置管理
│   │   └ env_loader.py                 # 环境加载
│   │   └── plugins.py                  # 插件系统
│   └── requirements.txt                # Python 依赖
│
├── hermes/                             # NPC 配置（已存在）
│   └ npcs/qingmu/
│   │   ├── SOUL.md                     # 身份性格
│   │   ├── MEMORY.md                   # 教学心得
│   │   ├── USER.md                     # 对玩家观察
│   │   ├── SYLLABUS.md                 # 教学大纲
│   │   └── TASKS.json                  # 任务进度
│
├── .hermes_game/                       # 新增：Hermes 运行时数据目录（HERMES_HOME）
│   ├── skills/                         # Skills 目录（核心）
│   │   └ tcm-teaching/                 # 中医教学 Skills
│   │   │   ├── inquiry-guidance/       # 问诊引导
│   │   │   │   └── SKILL.md
│   │   │   ├── syllabus-lecture/       # 教学大纲讲解
│   │   │   │   └── SKILL.md
│   │   │   │   └── references/
│   │   │   │       └ cold-wind-syndrome.md
│   │   │   ├── diagnosis-reasoning/    # 辨证推理引导
│   │   │   │   └── SKILL.md
│   │   │   ├── prescription-comparison/ # 方剂对比教学
│   │   │   │   └── SKILL.md
│   │   │   ├── weakness-intervention/  # 薄弱点诊断与干预
│   │   │   │   └── SKILL.md
│   │   │   └── npc-dialogue-style/     # NPC对话风格指南
│   │   │       └── SKILL.md
│   │   └ ...                           # 其他 Skills（可选）
│   ├── state.db                        # SessionDB（SQLite）
│   ├── memories/                       # MemoryStore
│   │   ├── MEMORY.md                   # NPC 教学心得（运行时更新）
│   │   └ USER.md                       # 对玩家观察（运行时更新）
│   └── .env                            # API 密钥（运行时）
│
├── vite-plugins/                       # 新增：Vite 插件
│   └ hermesLauncher.ts                 # Hermes 进程启动器
│
├── src/                                # 前端（已存在）
│   ├── utils/sseClient.ts              # 需修改：OpenAI 格式适配
│   ├── systems/HermesManager.ts        # 已存在
│   ├── systems/NPCInteraction.ts       # 已存在
│   └ ui/DialogUI.ts                    # 已存在
│   └ ...
│
├── .env                                # API 密钥配置
├── vite.config.ts                      # 需修改：添加插件
└── package.json                        # 需修改：添加启动脚本
```

---

## 5. Skills vs Tools 分类设计

### 5.1 核心区别

| 特性 | Tools | Skills |
|-----|-------|--------|
| **本质** | 可调用的函数 | 指导文档（SKILL.md） |
| **用途** | 数据操作（读写、查询、更新） | 教 AI 如何思考和行动 |
| **存储位置** | `hermes_backend/tools/*.py` | `~/.hermes/skills/tcm-teaching/` |
| **加载方式** | OpenAI function-calling | 系统提示注入（progressive disclosure） |
| **粒度** | 具体操作 | 工作流/方法论 |

### 5.2 分类决策原则

**判断标准**：
- **是数据操作吗？** → Tool（读写 JSON、查询状态）
- **是方法论指导吗？** → Skill（教 NPC 如何教学）

### 5.3 分类结果

#### 应该是 Skills 的功能（AI 教学方法论）

| Skill 名称 | 用途 | SKILL.md 内容 |
|-----------|------|--------------|
| **问诊引导** | 教 NPC 如何引导问诊、判断线索是否充足 | 何时该追问、何时该进入切脉 |
| **教学大纲讲解** | 教 NPC 如何沿着 SYLLABUS.md 讲解 | 按病类→证型→方剂的顺序 |
| **辨证推理引导** | 教 NPC 如何引导学生从症状推理到证型 | 无汗→表实、有汗→表虚的逻辑 |
| **方剂对比教学** | 教 NPC 如何对比讲解类似方剂 | 麻黄汤 vs 桂枝汤的关键鉴别点 |
| **薄弱点诊断** | 教 NPC 如何识别学生薄弱点并针对性干预 | 从论述错误中识别、针对性复习 |
| **NPC对话风格** | 教青木先生如何以中医师身份对话 | 语言风格、术语使用、鼓励方式 |

#### 应该是 Tools 的功能（数据操作）

| Tool 名称 | 用途 | 数据操作 |
|----------|------|---------|
| **game_task** | 任务进度管理 | 读写 TASKS.json，更新 mastery |
| **game_case** | 病案状态查询 | 查询解锁状态，读取病案数据 |
| **session_search** | 对话历史搜索 | 搜索 SessionDB（hermes 已有） |

---

## 6. 游戏专用 Skills 设计

### 6.1 Skills 目录结构

```
~/.hermes/skills/tcm-teaching/
├── inquiry-guidance/           # 问诊引导
│   └── SKILL.md
├── syllabus-lecture/           # 教学大纲讲解
│   └── SKILL.md
│   └── references/
│       └── cold-wind-syndrome.md
├── diagnosis-reasoning/        # 辨证推理引导
│   └── SKILL.md
│   └── references/
│       └── differentiation-flow.md
├── prescription-comparison/    # 方剂对比教学
│   └── SKILL.md
│   └── references/
│       └── mahuang-vs-guizhi.md
├── weakness-intervention/      # 薄弱点诊断与干预
│   └── SKILL.md
│   └── references/
│       └── common-mistakes.md
└── npc-dialogue-style/         # NPC对话风格指南
    └── SKILL.md
```

### 6.2 问诊引导 Skill（inquiry-guidance）

**SKILL.md 内容**：

```markdown
---
name: inquiry-guidance
description: 教 NPC 如何引导问诊流程，判断线索收集是否充足，何时进入下一环节。
version: 1.0.0
---

# 问诊引导方法论

## 核心原则

问诊是"解密游戏"，玩家从病人描述中捕捉线索。你的角色是：
- 观察玩家的追问方向
- 在后台判断线索收集进度
- 适时给予提示（非直接告知答案）
- 当必需线索收集完毕，询问玩家是否准备好进入切脉

## 线索分类判断

### 必需线索（必须收集才能辨证）

风寒表实证必需：恶寒重、无汗、发热轻、脉象（切脉环节）
风寒表虚证必需：恶风、有汗、发热、脉象
风热犯卫证必需：发热重、咽痛、恶寒轻、脉象

### 辅助线索（加深理解，不强制）

身痛、头痛、口渴情况、起病原因、咳嗽情况等

## 引导时机

| 情况 | 你的行为 |
|-----|---------|
| 玩家遗漏关键方向 | "你还没问出汗的情况，这是风寒证型的关键鉴别点..." |
| 玩家追问与证型无关的问题 | 简短回答，不展开（避免分散注意力） |
| 必需线索已收集完毕 | "问诊信息已经足够，准备好切脉了吗？" |
| 玩家反复追问同一问题 | 温和提示："你之前已经问过这个了，要不要换个角度？" |

## 不要做的事

- ❌ 直接告诉玩家"你应该问X"
- ❌ 在玩家还没问到时透露症状细节
- ❌ 在必需线索未收集时就催促进入下一环节
- ❌ 对玩家的所有问题都详细展开（保持聚焦）

## 举例

玩家问："你怕冷还是怕热？"
病人（农夫）回答："怕冷得很厉害，盖了两层被子还觉得冷。"

你（后台判断）：已获取"恶寒重"线索 ✓

下一步建议（不直接说）：
- 如果玩家继续追问出汗情况 → 继续观察
- 如果玩家转向其他无关问题 → 提示"出汗情况也是关键鉴别点"
```

### 6.3 教学大纲讲解 Skill（syllabus-lecture）

**SKILL.md 内容**：

```markdown
---
name: syllabus-lecture
description: 教 NPC 如何沿着教学大纲讲解知识点，按病类→证型→方剂的顺序组织教学内容。
version: 1.0.0
---

# 教学大纲讲解方法论

## 教学顺序原则

遵循 SYLLABUS.md 的结构：
```
外感病总论 → 风寒外感 → 风寒表实证 → 麻黄汤 → 风寒表虚证 → 桂枝汤 → 风热外感 → ...
```

## 讲解层级

### 第一层：外感病总论

讲解要点：
- 什么是外感病（六淫侵袭）
- 辨证体系对比（六经 vs 卫气营血 vs 三焦）
- 学派归属（伤寒学派 vs 温病学派）

### 第二层：风寒外感（病类）

讲解要点：
- 风寒的病因特点
- 寒邪束表的基本病机
- 风寒外感的共同症状

### 第三层：风寒表实证（证型）

讲解要点：
- 病机：风寒束表，营卫郁滞
- 核心鉴别点：无汗（关键！）
- 脉象特点：浮紧

### 第四层：麻黄汤（方剂）

讲解要点：
- 组成：麻黄、桂枝、杏仁、甘草
- 配伍意义：麻黄开腠理，桂枝解肌表，杏仁降肺气，甘草调和
- 煎服法：先煎麻黄去沫
- 禁忌：体虚、高血压患者慎用

## 讲解节奏

| 学生状态 | 你的行为 |
|---------|---------|
| 初次接触 | 从总论开始，建立框架 |
| 已掌握上层知识 | 进入下一层，逐步细化 |
| 对某层有困惑 | 停在该层，用比喻或举例加深理解 |
| 主动提问更深层 | 可以适当跳级，但要确保基础稳固 |

## 知识点关联提示

在讲解过程中，适时提示关联知识：
- "桂枝汤和麻黄汤很像，但关键区别在于汗出情况..."
- "银翘散和桑菊饮都是辛凉解表，但银翘散侧重咽痛，桑菊饮侧重咳嗽..."

## 不要做的事

- ❌ 跳过总论直接讲方剂（缺乏框架）
- ❌ 一次性讲完所有内容（学生消化不了）
- ❌ 只讲方剂组成不讲病机（机械记忆）
- ❌ 忽略学生的提问，继续按大纲讲解（失去互动性）
```

### 6.4 辨证推理引导 Skill（diagnosis-reasoning）

**SKILL.md 内容**：

```markdown
---
name: diagnosis-reasoning
description: 教 NPC 如何引导学生从症状推理到证型，培养辨证思维能力而非死记硬背。
version: 1.0.0
---

# 辨证推理引导方法论

## 核心原则

辨证是中医的灵魂。你不是教学生"记住答案"，而是教"推理方法"。

## 推理框架

### 外感病辨证三步法

**第一步：判断病类（风寒 vs 风热）**
- 风寒：恶寒重、发热轻、无汗或有汗、口不渴
- 风热：发热重、恶寒轻、咽痛明显、口渴

**第二步：判断虚实（表实 vs 表虚）**
- 表实（麻黄汤证）：无汗 + 脉浮紧
- 表虚（桂枝汤证）：有汗 + 脉浮缓

**第三步：确认方剂**
- 表实 → 麻黄汤
- 表虚 → 桂枝汤
- 风热犯卫 → 银翘散
- 风温咳嗽 → 桑菊饮

## 引导方式

### 不要直接给答案

学生问："这是什么证型？"
回答："你收集到的症状是：恶寒重、无汗、发热轻、脉浮紧。你觉得这些特点指向哪个方向？"

### 用关键问题引导

关键引导问题：
- "无汗和有汗，在病机上有什么不同？"
- "为什么脉浮紧配合无汗能确认表实？"
- "如果病人有汗但恶风，你觉得该用什么方？"

### 对比教学法

讲解时使用对比：
- "表实和表虚，就像水库的闸门。表实是闸门紧闭（无汗），表虚是闸门松动（有汗）。"

## 常见错误纠正

| 学生错误 | 你的纠正方式 |
|---------|-------------|
| 混淆表实表虚 | "关键是汗出情况。你再看看病人的出汗描述？" |
| 忽略脉象 | "脉诊也是辨证的重要依据。浮紧和浮缓有什么不同？" |
| 只看发热不看恶寒 | "恶寒重还是恶寒轻，这是风寒和风热的关键区别。" |
| 直接猜方剂 | "先确定证型，再选方剂。辨证是选方的前提。" |

## 不要做的事

- ❌ 学生一问就直接说答案
- ❌ 不解释推理过程只说结果
- ❌ 忽略学生的论述直接评判对错
- ❌ 用专业术语堆砌不解释含义
```

### 6.5 方剂对比教学 Skill（prescription-comparison）

**SKILL.md 内容**：

```markdown
---
name: prescription-comparison
description: 教 NPC 如何对比讲解类似方剂，帮助学生掌握鉴别要点而非机械记忆。
version: 1.0.0
---

# 方剂对比教学方法论

## 核心对比组

### 麻黄汤 vs 桂枝汤（风寒表实 vs 表虚）

| 维度 | 麻黄汤 | 桂枝汤 |
|-----|-------|-------|
| **汗出** | 无汗（关键！） | 有汗（关键！） |
| **脉象** | 浮紧 | 浮缓 |
| **病机** | 寒邪束表，腠理闭塞 | 风邪袭表，营卫不和 |
| **治法** | 发汗解表，宣肺平喘 | 解肌发表，调和营卫 |
| **君药** | 麻黄（开腠理） | 桂枝（解肌表） |
| **佐药区别** | 杏仁降肺气 | 芍药敛营阴 |

**关键鉴别点一句话**：
"无汗表实麻黄汤，有汗表虚桂枝汤"

### 银翘散 vs 桑菊饮（风热犯卫 vs 风温咳嗽）

| 维度 | 银翘散 | 桑菊饮 |
|-----|-------|-------|
| **主症** | 咽痛明显 | 咳嗽为主 |
| **病位** | 咽喉（上焦） | 肺（上焦偏内） |
| **君药** | 金银花、连翘 | 桑叶、菊花 |
| **功效侧重** | 清热解毒，疏风解表 | 疏风清热，宣肺止咳 |

**关键鉴别点一句话**：
"咽痛明显银翘散，咳嗽为主桑菊饮"

## 对比教学方式

### 表格对比（视觉化）

制作对比表格，让学生自己发现差异。

### 关键点提问

- "麻黄汤和桂枝汤都有桂枝，但为什么君药不同？"
- "杏仁在麻黄汤里降肺气，桂枝汤里没有杏仁，为什么？"

### 比喻教学

- "麻黄汤是强行破门，桂枝汤是调节门锁。一个用力猛，一个温和调。"

### 病案对比练习

让学生对比两个病案：
- 病案A：无汗、脉浮紧 → 麻黄汤
- 病案B：有汗、脉浮缓 → 桂枝汤

## 不要做的事

- ❌ 只讲单个方剂不讲对比
- ❌ 对比时只说"它们不同"不讲具体差异
- ❌ 忽略病机差异只讲组成差异
- ❌ 学生记不住方歌就批评（鼓励理解而非死记）
```

### 6.6 薄弱点诊断与干预 Skill（weakness-intervention）

**SKILL.md 内容**：

```markdown
---
name: weakness-intervention
description: 教 NPC 如何从学生的论述、选择错误中识别薄弱点，并针对性干预。
version: 1.0.0
---

# 薄弱点诊断与干预方法论

## 薄弱点识别来源

| 来源 | 识别方式 |
|-----|---------|
| **辨证论述** | 分析论述中的错误推理、遗漏关键点 |
| **脉诊错误** | 记录脉象判断错误 |
| **舌诊错误** | 记录舌象特征选择错误 |
| **选方错误** | 记录证型与方剂对应错误 |
| **反复询问同一问题** | 某知识点理解不深 |

## 薄弱点分类

### 记忆类薄弱点

- 方剂组成记不住
- 方歌背不全
- 禁忌条例遗忘

**干预方式**：复习 + 联想记忆（方歌、比喻）

### 理解类薄弱点

- 病机理解不深
- 配伍意义不清楚
- 辨证逻辑混乱

**干预方式**：详细讲解 + 对比教学 + 举例说明

### 应用类薄弱点

- 不会辨证推理
- 选方犹豫不决
- 症状与证型对应困难

**干预方式**：更多病案练习 + 分步引导

## 干预时机

| 情况 | 干预方式 |
|-----|---------|
| 病案刚结束 | 立即点评错误，记录薄弱点 |
| 学生主动求助 | 分析薄弱点，针对性讲解 |
| 下次病案前 | 提醒上次薄弱点，提示注意 |
| Task进度停滞 | 主动询问是否需要复习 |

## 干预记录

使用 game_task 工具的 record_weakness 功能：
```json
{
  "task_id": "mahuang-tang-learning",
  "weakness": "配伍理解（麻黄桂枝配伍意义不清楚）"
}
```

## 干预话术示例

"上次你在麻黄汤的配伍理解上有些薄弱。麻黄开腠理，桂枝解肌表，两者配合是'开门+拆锁'的关系。这次病案，我建议你特别注意汗出情况和脉象..."

## 不要做的事

- ❌ 不记录薄弱点（下次无法针对性指导）
- ❌ 只批评不说如何改进
- ❌ 忽略薄弱点直接推进新内容
- ❌ 用同样的方式重复讲解（换一种讲解方式）
```

### 6.7 Skills 加载机制

Skills 存放在 `~/.hermes/skills/tcm-teaching/` 目录下，通过 hermes-agent 的 skills 系统加载：

```python
# hermes-agent 已有的 skills 加载机制
from tools.skills_tool import skills_list, skill_view

# NPC 启动时加载教学 Skills
def build_npc_system_prompt(npc_id: str) -> str:
    config = load_npc_config(npc_id)

    # 加载教学 Skills
    teaching_skills = [
        "tcm-teaching/inquiry-guidance",
        "tcm-teaching/syllabus-lecture",
        "tcm-teaching/diagnosis-reasoning",
        "tcm-teaching/prescription-comparison",
        "tcm-teaching/weakness-intervention",
    ]

    skill_contents = []
    for skill_name in teaching_skills:
        content = skill_view(skill_name)
        if content:
            skill_contents.append(content)

    # 组装系统提示
    layers = [
        config["soul"],                    # 身份
        config["syllabus"],                # 教学大纲
        "\n## 教学方法论\n\n" + "\n".join(skill_contents),  # Skills
        config["memory"],                  # 教学心得
        config["user"],                    # 学生观察
    ]
    return "\n".join(layers)
```

---

## 7. 游戏专用 Tools 设计

### 7.1 game_task 工具

**用途**: NPC 读取/更新玩家的学习任务进度（数据操作）

**Schema**:
```json
{
  "name": "game_task",
  "description": "管理玩家的学习任务进度。用于查看当前任务、更新 Todo 掌握度、记录薄弱点。\n\n操作类型:\n- get_tasks: 获取所有任务及进度\n- update_todo: 更新指定 Todo 的 mastery\n- complete_task: 标记任务完成\n- recommend_next: 推荐下一个学习任务\n- record_weakness: 记录学生薄弱点\n\n数据存储在 hermes/npcs/qingmu/TASKS.json。",
  "parameters": {
    "type": "object",
    "properties": {
      "action": {
        "type": "string",
        "enum": ["get_tasks", "update_todo", "complete_task", "recommend_next", "record_weakness"],
        "description": "操作类型"
      },
      "task_id": {
        "type": "string",
        "description": "任务ID，用于 update_todo/complete_task"
      },
      "todo_id": {
        "type": "string",
        "description": "Todo ID，用于 update_todo"
      },
      "mastery": {
        "type": "number",
        "minimum": 0,
        "maximum": 1,
        "description": "掌握度 0-1，用于 update_todo"
      },
      "weakness": {
        "type": "string",
        "description": "薄弱点描述，用于 record_weakness"
      }
    },
    "required": ["action"]
  }
}
```

**Handler 实现**:
```python
def game_task_handler(args: dict, **kw) -> str:
    action = args.get("action")
    npc_id = kw.get("npc_id", "qingmu")

    # 加载 TASKS.json
    tasks_path = get_npc_dir(npc_id) / "TASKS.json"
    tasks_data = json.loads(tasks_path.read_text())

    if action == "get_tasks":
        return json.dumps({
            "success": True,
            "tasks": tasks_data["tasks"],
            "current_focus": tasks_data["current_focus"],
            "statistics": tasks_data["statistics"]
        }, ensure_ascii=False)

    elif action == "update_todo":
        task_id = args.get("task_id")
        todo_id = args.get("todo_id")
        mastery = args.get("mastery")

        # 更新 mastery
        for task in tasks_data["tasks"]:
            if task["task_id"] == task_id:
                for todo in task["todos"]:
                    if todo["id"] == todo_id:
                        todo["mastery"] = mastery
                        if mastery >= 0.8:
                            todo["status"] = "completed"
                        elif mastery > 0:
                            todo["status"] = "in_progress"
                        break
                # 更新任务整体进度
                task["progress"] = sum(t["mastery"] for t in task["todos"]) / len(task["todos"])
                break

        # 保存
        tasks_path.write_text(json.dumps(tasks_data, ensure_ascii=False, indent=2))
        return json.dumps({"success": True, "updated": {"task_id": task_id, "todo_id": todo_id, "mastery": mastery}})

    elif action == "complete_task":
        task_id = args.get("task_id")
        for task in tasks_data["tasks"]:
            if task["task_id"] == task_id:
                task["status"] = "completed"
                task["progress"] = 1.0
                break
        tasks_path.write_text(json.dumps(tasks_data, ensure_ascii=False, indent=2))
        return json.dumps({"success": True, "completed": task_id})

    elif action == "record_weakness":
        task_id = args.get("task_id")
        weakness = args.get("weakness")
        for task in tasks_data["tasks"]:
            if task["task_id"] == task_id:
                if weakness not in task["weaknesses"]:
                    task["weaknesses"].append(weakness)
                break
        tasks_path.write_text(json.dumps(tasks_data, ensure_ascii=False, indent=2))
        return json.dumps({"success": True, "recorded": weakness})

    elif action == "recommend_next":
        # 找到第一个 pending 或 in_progress 的任务
        for task in tasks_data["tasks"]:
            if task["status"] in ("pending", "in_progress"):
                # 检查 blocked_by
                if task["blocked_by"]:
                    blocking_task = find_task(tasks_data, task["blocked_by"])
                    if blocking_task["status"] != "completed":
                        return json.dumps({
                            "success": True,
                            "recommended": None,
                            "reason": f"需要先完成 {task['blocked_by']}"
                        })
                return json.dumps({
                    "success": True,
                    "recommended": task["task_id"],
                    "reason": "这是当前可进行的任务"
                })
        return json.dumps({"success": True, "recommended": None, "reason": "所有任务已完成"})

    return json.dumps({"error": f"Unknown action: {action}"})
```

### 7.2 game_case 工具

**用途**: 病案解锁状态查询和诊治流程启动

**Schema**:
```json
{
  "name": "game_case",
  "description": "管理病案诊治流程。用于查询已解锁病案、检查解锁条件、启动诊治。\n\nblocked_by 解锁逻辑:\n- 病案的 blocked_by 是 Task ID\n- 必须先完成对应学习任务才能解锁病案\n\n操作类型:\n- get_unlocked: 获取所有已解锁病案\n- check_status: 检查指定病案解锁状态\n- start_case: 开始病案诊治（返回病案详情）",
  "parameters": {
    "type": "object",
    "properties": {
      "action": {
        "type": "string",
        "enum": ["get_unlocked", "check_status", "start_case"],
        "description": "操作类型"
      },
      "case_id": {
        "type": "string",
        "description": "病案ID，用于 check_status/start_case"
      }
    },
    "required": ["action"]
  }
}
```

**Handler 实现**:
```python
def game_case_handler(args: dict, **kw) -> str:
    action = args.get("action")

    # 加载病案数据
    cases_path = Path("src/data/cases/core_cases.json")
    cases_data = json.loads(cases_path.read_text())

    # 加载任务进度
    tasks_path = Path("hermes/npcs/qingmu/TASKS.json")
    tasks_data = json.loads(tasks_path.read_text())
    task_status = {t["task_id"]: t["status"] for t in tasks_data["tasks"]}

    if action == "get_unlocked":
        unlocked = []
        for case in cases_data["cases"]:
            blocked_by = case["blocked_by"]
            if blocked_by is None or task_status.get(blocked_by) == "completed":
                unlocked.append(case)
        return json.dumps({"success": True, "unlocked_cases": unlocked}, ensure_ascii=False)

    elif action == "check_status":
        case_id = args.get("case_id")
        case = find_case(cases_data, case_id)
        if not case:
            return json.dumps({"error": f"Case not found: {case_id}"})

        blocked_by = case["blocked_by"]
        if blocked_by is None:
            return json.dumps({"success": True, "status": "unlocked", "reason": "自由解锁"})

        blocking_task_status = task_status.get(blocked_by, "pending")
        if blocking_task_status == "completed":
            return json.dumps({"success": True, "status": "unlocked", "reason": f"{blocked_by} 已完成"})
        else:
            return json.dumps({
                "success": True,
                "status": "locked",
                "reason": f"需要先完成学习任务: {blocked_by}",
                "blocked_by": blocked_by,
                "task_status": blocking_task_status
            })

    elif action == "start_case":
        case_id = args.get("case_id")
        case = find_case(cases_data, case_id)
        if not case:
            return json.dumps({"error": f"Case not found: {case_id}"})

        # 再次检查解锁状态
        blocked_by = case["blocked_by"]
        if blocked_by and task_status.get(blocked_by) != "completed":
            return json.dumps({"error": f"病案未解锁，需要先完成 {blocked_by}"})

        # 返回病案完整信息供诊治
        return json.dumps({
            "success": True,
            "case": case,
            "chief_complaint": generate_chief_complaint(case),  # 动态生成主诉
            "guidance": "开始问诊，请使用 analyze_clues 工具分析线索收集情况"
        }, ensure_ascii=False)

    return json.dumps({"error": f"Unknown action: {action}"})
```

---

## 8. NPC 配置加载定制

### 8.1 问题

hermes-agent 默认从 `~/.hermes/SOUL.md` 加载配置，但游戏 NPC 配置在项目目录 `hermes/npcs/qingmu/`。

### 8.2 解决方案

新增 `load_npc_config()` 函数，通过环境变量 `HERMES_NPC_HOME` 指定 NPC 配置目录。

```python
# agent/prompt_builder.py 新增

def get_npc_home() -> Path:
    """获取 NPC 配置根目录"""
    npc_home = os.environ.get("HERMES_NPC_HOME")
    if npc_home:
        return Path(npc_home)
    # 默认使用项目 hermes 目录
    return Path("hermes")

def load_npc_config(npc_id: str) -> dict:
    """加载指定 NPC 的所有配置文件"""
    npc_dir = get_npc_home() / "npcs" / npc_id

    config = {
        "soul": None,
        "memory": None,
        "user": None,
        "syllabus": None,
    }

    soul_path = npc_dir / "SOUL.md"
    if soul_path.exists():
        config["soul"] = _truncate_content(soul_path.read_text().strip(), "SOUL.md")

    memory_path = npc_dir / "MEMORY.md"
    if memory_path.exists():
        config["memory"] = _truncate_content(memory_path.read_text().strip(), "MEMORY.md")

    user_path = npc_dir / "USER.md"
    if user_path.exists():
        config["user"] = _truncate_content(user_path.read_text().strip(), "USER.md")

    syllabus_path = npc_dir / "SYLLABUS.md"
    if syllabus_path.exists():
        config["syllabus"] = _truncate_content(syllabus_path.read_text().strip(), "SYLLABUS.md")

    return config

def build_npc_system_prompt(npc_id: str) -> str:
    """组装 NPC 专属系统提示"""
    config = load_npc_config(npc_id)

    layers = []

    # 1. 身份
    if config["soul"]:
        layers.append(config["soul"])
    else:
        layers.append(f"你是 {npc_id}，一位中医老师。")

    # 2. 教学大纲
    if config["syllabus"]:
        layers.append(f"\n## 教学大纲\n\n{config['syllabus']}")

    # 3. 教学心得（MEMORY）
    if config["memory"]:
        layers.append(f"\n## 教学心得\n\n{config['memory']}")

    # 4. 对学生观察（USER）
    if config["user"]:
        layers.append(f"\n## 学生观察\n\n{config['user']}")

    # 5. 工具使用指导
    layers.append("\n## 可用工具\n\n你可以使用以下工具管理学生的学习进度:\n- game_task: 查看任务进度、更新掌握度、推荐下一任务\n- game_case: 查询病案解锁状态、启动诊治\n- analyze_clues: 分析问诊线索收集情况")

    return "\n".join(layers)
```

### 8.3 api_server.py 定制

```python
# gateway/platforms/api_server.py 修改

async def _handle_chat_completions(self, request):
    body = await request.json()

    # 检查是否有 npc_id 参数
    npc_id = body.get("npc_id", None)

    if npc_id:
        # 使用 NPC 专属系统提示
        from agent.prompt_builder import build_npc_system_prompt
        system_prompt = build_npc_system_prompt(npc_id)
        body["messages"] = [{"role": "system", "content": system_prompt}] + body["messages"]

        # 设置 npc_id 到 agent kwargs
        agent_kwargs["npc_id"] = npc_id

    # ... 原有逻辑
```

---

## 9. 前端 SSE 格式适配

### 9.1 当前实现

```typescript
// src/utils/sseClient.ts - 自定义 SSE 格式
// 请求 /v1/chat/stream，接收:
// data: {"text": "..."}
// data: [DONE]
```

### 9.2 OpenAI 格式

```typescript
// OpenAI Chat Completions SSE 格式
// 请求 /v1/chat/completions?stream=true
// 接收:
// data: {"choices":[{"delta":{"content":"..."}}]}
// data: [DONE]
```

### 9.3 修改方案

```typescript
// src/utils/sseClient.ts 修改

export class SSEClient {
  private endpoint = 'http://localhost:8642/v1/chat/completions';

  async streamChat(
    messages: ChatMessage[],
    npcId?: string,
    onDelta: (text: string) => void,
    onComplete: () => void,
    onError: (error: string) => void
  ): Promise<void> {
    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'hermes-agent',
        messages,
        stream: true,
        npc_id: npcId,  // 新增：NPC ID
      }),
    });

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader!.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') {
            onComplete();
            return;
          }

          try {
            const parsed = JSON.parse(data);
            // OpenAI 格式: choices[0].delta.content
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              onDelta(content);
            }
          } catch (e) {
            // 忽略解析错误
          }
        }
      }
    }
  }
}
```

---

## 10. Vite 插件设计

### 10.1 hermesLauncher.ts

```typescript
// vite-plugins/hermesLauncher.ts

import type { Plugin } from 'vite';
import { spawn, ChildProcess } from 'child_process';
import path from 'path';

export function hermesLauncher(): Plugin {
  let hermesProcess: ChildProcess | null = null;
  let isRestarting = false;

  const startHermes = () => {
    const projectRoot = process.cwd();
    const hermesBackend = path.join(projectRoot, 'hermes_backend');
    const pythonScript = path.join(hermesBackend, 'gateway', 'run.py');

    // 设置环境变量
    const env = {
      ...process.env,
      HERMES_NPC_HOME: path.join(projectRoot, 'hermes'),
      HERMES_HOME: path.join(projectRoot, '.hermes_game'),
      PYTHONPATH: hermesBackend,
    };

    hermesProcess = spawn('python', ['-m', 'gateway.run'], {
      cwd: hermesBackend,
      env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    hermesProcess.stdout?.on('data', (data) => {
      console.log('[Hermes]', data.toString().trim());
    });

    hermesProcess.stderr?.on('data', (data) => {
      console.error('[Hermes Error]', data.toString().trim());
    });

    hermesProcess.on('close', (code) => {
      if (!isRestarting && code !== 0) {
        console.log('[Hermes] Process exited, restarting...');
        setTimeout(startHermes, 3000);
      }
    });

    console.log('[Hermes] Backend started on http://localhost:8642');
  };

  return {
    name: 'hermes-launcher',

    configResolved() {
      // 开发模式下启动 Hermes
      if (process.env.NODE_ENV === 'development') {
        startHermes();
      }
    },

    closeBundle() {
      if (hermesProcess) {
        isRestarting = true;
        hermesProcess.kill();
        console.log('[Hermes] Backend stopped');
      }
    },
  };
}
```

### 10.2 vite.config.ts 修改

```typescript
// vite.config.ts

import { defineConfig } from 'vite';
import { hermesLauncher } from './vite-plugins/hermesLauncher';

export default defineConfig({
  plugins: [
    hermesLauncher(),
    // ... 其他插件
  ],
});
```

---

## 11. 需复制的核心文件清单

### 11.1 必需文件

| 文件 | 用途 | 是否定制 |
|-----|------|---------|
| `run_agent.py` | Agent 引擎核心 | ❌ 直接复制 |
| `hermes_state.py` | SessionDB | ❌ 直接复制 |
| `model_tools.py` | 工具调度 | ✅ 添加 game_tools 导入 |
| `tools/registry.py` | 工具注册中心 | ❌ 直接复制 |
| `toolsets.py` | 工具集定义 | ❌ 直接复制 |
| `hermes_constants.py` | 常量定义 | ❌ 直接复制 |
| `hermes_logging.py` | 日志配置 | ❌ 直接复制 |
| `utils.py` | 工具函数 | ❌ 直接复制 |

### 11.2 Gateway 文件

| 文件 | 用途 | 是否定制 |
|-----|------|---------|
| `gateway/run.py` | Gateway 入口 | ❌ 直接复制 |
| `gateway/config.py` | 配置管理 | ❌ 直接复制 |
| `gateway/session.py` | 会话管理 | ❌ 直接复制 |
| `gateway/platforms/base.py` | 平台适配器基类 | ❌ 直接复制 |
| `gateway/platforms/api_server.py` | OpenAI API Server | ✅ 添加 npc_id 支持 |

### 11.3 Agent 文件

| 文件 | 用途 | 是否定制 |
|-----|------|---------|
| `agent/prompt_builder.py` | 系统提示组装 | ✅ 添加 NPC 配置 + Skills 加载 |
| `agent/memory_manager.py` | 记忆管理 | ❌ 直接复制 |
| `agent/context_compressor.py` | 上下文压缩 | ❌ 直接复制 |
| `agent/model_metadata.py` | 模型元数据 | ❌ 直接复制 |
| `agent/retry_utils.py` | 重试机制 | ❌ 直接复制 |
| `agent/trajectory.py` | 轨迹记录 | ❌ 直接复制 |
| `agent/display.py` | 显示工具 | ❌ 直接复制 |

### 11.4 工具文件

| 文件 | 用途 | 是否定制 |
|-----|------|---------|
| `tools/todo_tool.py` | Agent todo（内部用） | ❌ 直接复制（参考） |
| `tools/memory_tool.py` | 持久记忆 | ❌ 直接复制（参考） |
| `tools/session_search_tool.py` | 会话搜索 | ❌ 直接复制 |
| `tools/game_tools.py` | 游戏专用工具 | ✅ 新增创建 |

### 11.5 Hermes CLI 文件

| 文件 | 用途 | 是否定制 |
|-----|------|---------|
| `hermes_cli/config.py` | 配置管理 | ❌ 直接复制 |
| `hermes_cli/env_loader.py` | 环境加载 | ❌ 直接复制 |
| `hermes_cli/plugins.py` | 插件系统 | ❌ 直接复制 |

### 11.6 Skills 文件（需创建）

Skills 是指导文档，需要新建而非复制：

| Skill 目录 | 用途 | 文件 |
|-----------|------|------|
| `tcm-teaching/inquiry-guidance/` | 问诊引导方法论 | SKILL.md |
| `tcm-teaching/syllabus-lecture/` | 教学大纲讲解方法论 | SKILL.md + references/ |
| `tcm-teaching/diagnosis-reasoning/` | 辨证推理引导方法论 | SKILL.md + references/ |
| `tcm-teaching/prescription-comparison/` | 方剂对比教学方法论 | SKILL.md + references/ |
| `tcm-teaching/weakness-intervention/` | 薄弱点诊断与干预方法论 | SKILL.md + references/ |
| `tcm-teaching/npc-dialogue-style/` | NPC对话风格指南 | SKILL.md |

---

## 12. API 密钥配置

### 12.1 .env 文件

```bash
# .env

# LLM API 配置
OPENAI_API_KEY=your_api_key_here
OPENAI_BASE_URL=https://api.openai.com/v1

# 或使用其他提供商
# DEEPSEEK_API_KEY=your_deepseek_key
# DEEPSEEK_BASE_URL=https://api.deepseek.com/v1

# Hermes 配置
HERMES_NPC_HOME=./hermes
HERMES_HOME=./.hermes_game
API_SERVER_HOST=127.0.0.1
API_SERVER_PORT=8642
```

### 12.2 运行时加载

```python
# hermes_backend/gateway/run.py 已有环境加载逻辑
from hermes_cli.env_loader import load_hermes_dotenv
load_hermes_dotenv(hermes_home=_hermes_home, project_env=Path(__file__).resolve().parents[1] / '.env')
```

---

## 13. 测试验收标准

### 13.1 后端启动测试

- [ ] `npm run dev` 自动启动 Hermes 后端
- [ ] `http://localhost:8642/health` 返回 `{"status": "ok"}`
- [ ] 后端断开后自动重启

### 13.2 NPC 对话测试

- [ ] 进入诊所场景，青木先生显示真实对话（非占位）
- [ ] 对话内容符合 SOUL.md 定义的性格风格
- [ ] SSE 流式输出逐字显示
- [ ] 停止按钮可中断生成

### 13.3 Skills 加载测试

- [ ] NPC 系统提示包含 Skills 内容
- [ ] 问诊引导 Skill 正确指导 NPC 行为
- [ ] 教学大纲讲解 Skill 正确组织教学内容
- [ ] 辨证推理引导 Skill 正确引导学生思考

### 13.4 工具调用测试

- [ ] 青木先生可调用 `game_task` 查看玩家任务进度
- [ ] 青木先生可调用 `game_case` 检查病案解锁状态

### 13.5 任务更新测试

- [ ] NPC 调用 `game_task.update_todo` 后 TASKS.json 正确更新
- [ ] mastery 达到 0.8 后 todo 自动标记 completed
- [ ] blocked_by 解锁逻辑正确工作

---

## 14. 风险与注意事项

### 14.1 技术风险

| 风险 | 影响 | 缓解措施 |
|-----|------|---------|
| Python 版本兼容 | 依赖失败 | 明确要求 Python 3.10+ |
| 依赖包版本冲突 | 运行错误 | 使用 requirements.txt 锁定版本 |
| SSE 格式差异 | 前端解析失败 | 完整适配 OpenAI 格式 |
| NPC 配置路径错误 | 身份加载失败 | 明确 HERMES_NPC_HOME 设置 |

### 14.2 安全注意

- API 密钥存储在 `.env`，禁止硬编码
- `.env` 文件不提交到 git（已在 .gitignore）
- NPC 配置文件有内容扫描（prompt_builder.py 已有）

---

## 15. NPC 对话场景与 Skills 映射

### 15.1 对话场景分类

根据 Phase 2 设计文档，NPC 对话分为两大类：

| 分类 | 定义 | 特点 |
|-----|------|------|
| **玩家触发对话** | 玩家主动与 NPC 交互 | 玩家按空格/进入场景/输入问题 |
| **NPC 自主对话** | NPC 主动发起或介入 | 无玩家主动触发，NPC 观察状态后主动发言 |

---

### 15.2 玩家触发对话场景

| 场景 | 触发方式 | 对话内容 | 使用 Skills | 使用 Tools |
|-----|---------|---------|------------|-----------|
| **自由对话** | 走近 NPC 按空格 | 玩家提问 → NPC 回答 | `npc-dialogue-style`（对话风格）<br>`syllabus-lecture`（教学大纲讲解） | `game_task.get_tasks`（查看进度）<br>`session_search`（回顾历史） |
| **登录问候** | 玩家上线首次进入诊所 | NPC 晨间问候 + 询问学习状态 | `npc-dialogue-style`（问候风格）<br>`weakness-intervention`（薄弱点复习提醒） | `game_task.recommend_next`（推荐任务） |
| **问诊环节** | 进入病案诊治 | 玩家追问 → 病人回答<br>NPC 后台观察引导 | `inquiry-guidance`（问诊引导）<br>`npc-dialogue-style`（NPC 提示风格） | 无（病人是独立 NPC） |
| **脉诊指导** | 进入切脉环节 | NPC 解释古文脉象描述 | `npc-dialogue-style`（指导风格）<br>`diagnosis-reasoning`（辨证推理引导） | 无 |
| **舌诊指导** | 进入舌诊环节 | NPC 提示舌象观察要点 | `npc-dialogue-style`（指导风格）<br>`diagnosis-reasoning`（辨证推理引导） | 无 |
| **辨证论述点评** | 提交辨证论述后 | NPC 点评论述内容 + 分析错误 | `diagnosis-reasoning`（辨证推理引导）<br>`weakness-intervention`（识别薄弱点） | `game_task.record_weakness`（记录薄弱点） |
| **选方点评** | 选择方剂后 | NPC 点评方剂选择理由 | `prescription-comparison`（方剂对比教学）<br>`diagnosis-reasoning`（辨证推理引导） | `game_task.update_todo`（更新选方维度 mastery） |
| **病案回顾** | 点击"查看详情" | NPC 回顾病案诊治过程 | `npc-dialogue-style`（回顾风格）<br>`weakness-intervention`（针对性复习建议） | `game_task.get_tasks`（查看当前进度） |
| **任务介绍** | NPC 发布新任务 | NPC 解释任务目标、考核标准 | `syllabus-lecture`（教学大纲讲解） | `game_task.get_tasks`（获取任务详情） |
| **煎药指导** | 进入煎药游戏 | NPC 讲解配伍意义、煎服法 | `syllabus-lecture`（教学大纲讲解）<br>`prescription-comparison`（方剂对比） | 无 |
| **种植考教** | 收获时弹出考题 | NPC 出题 + 点评回答 | `syllabus-lecture`（教学大纲讲解） | `game_task.update_todo`（更新药材属性 mastery） |

---

### 15.3 NPC 自主对话场景

| 场景 | 触发条件 | NPC 行为 | 使用 Skills | 使用 Tools |
|-----|---------|---------|------------|-----------|
| **病人来诊通知** | 玩家进入诊所时系统检测 | NPC："有病人来诊，来实践吧" | `npc-dialogue-style`（主动邀请风格） | `game_case.get_unlocked`（获取可诊治病案） |
| **环节停留提醒** | 玩家在某环节停留 > 2 分钟 | NPC："这个环节不理解？可以问我..." | `weakness-intervention`（薄弱点识别）<br>`npc-dialogue-style`（温和提示风格） | `session_search`（查看历史错误） |
| **连续错误介入** | 玩家连续错误 3 次 | NPC："看来这个知识点需要复习..." | `weakness-intervention`（薄弱点诊断）<br>`syllabus-lecture`（针对性讲解） | `game_task.record_weakness`（记录薄弱点） |
| **线索缺失提示** | 问诊环节必需线索未收集 | NPC："你还没问出汗的情况，这是关键鉴别点..." | `inquiry-guidance`（问诊引导）<br>`npc-dialogue-style`（提示风格） | 无（后台判断） |
| **上线薄弱点提醒** | 玩家上线时检查薄弱点 | NPC："上次你在XX上有些薄弱，今天复习一下？" | `weakness-intervention`（薄弱点干预）<br>`npc-dialogue-style`（关怀风格） | `game_task.get_tasks`（查看 weaknesses） |
| **任务完成祝贺** | Task 所有 Todo 完成 | NPC："恭喜你完成了XX任务！" | `npc-dialogue-style`（祝贺风格） | `game_task.complete_task`（标记完成） |
| **解锁新内容通知** | 经验值达到解锁阈值 | NPC："你解锁了新功能：方剂加减" | `npc-dialogue-style`（成就通知风格） | `game_task.recommend_next`（推荐下一任务） |

---

### 15.4 Skills 使用频率分析

| Skill | 主要场景 | 使用频率 |
|-------|---------|---------|
| **npc-dialogue-style** | 所有对话场景（基础风格） | ⭐⭐⭐⭐⭐ 最高 |
| **inquiry-guidance** | 问诊环节（核心） | ⭐⭐⭐⭐ 高 |
| **diagnosis-reasoning** | 辨证环节、脉诊、舌诊、选方点评 | ⭐⭐⭐⭐ 高 |
| **syllabus-lecture** | 教学讲解、任务介绍、煎药指导 | ⭐⭐⭐ 中 |
| **weakness-intervention** | 错误点评、薄弱点提醒、上线复习 | ⭐⭐⭐ 中 |
| **prescription-comparison** | 选方点评、方剂讲解 | ⭐⭐ 低（特定场景） |

---

### 15.5 Skills 组合使用示例

**场景：辨证论述点评**

NPC 同时使用多个 Skills：

```
1. npc-dialogue-style
   - 决定点评语气（温和鼓励 vs 严肃纠正）

2. diagnosis-reasoning
   - 分析论述中的推理错误
   - 判断是理解类薄弱点还是应用类薄弱点

3. weakness-intervention
   - 记录薄弱点到 TASKS.json
   - 提供针对性复习建议
```

**NPC 行为示例**：

```
"你的辨证思路整体正确，但在脉象理解上有些偏差。
你提到'脉浮紧说明有寒'，其实浮紧更重要的是说明表实——腠理闭塞。
上次你在脉诊上也有类似错误，我建议你复习一下麻黄汤和桂枝汤的脉象鉴别。"
```

---

### 15.6 病人 NPC（非青木先生）

病人是独立的 AI NPC，使用不同的 Skills：

| 病人场景 | 使用 Skills | 说明 |
|---------|------------|------|
| **自主描述主诉** | 病人模板（patient-templates/*.json） | 根据模板风格描述症状 |
| **回答追问** | 病人模板 + 病案线索定义 | 按线索配置回答，不透露未问到信息 |
| **线索隐藏** | 病案 clues 配置 | 只在玩家问到时透露必需/辅助线索 |

病人 NPC **不使用**青木先生的 Skills，而是使用专门的病人行为配置。

---

### 15.7 Skills 加载策略

根据对话场景动态加载相关 Skills：

```python
# 示例：根据场景加载 Skills
def load_skills_for_scene(scene_type: str) -> list:
    base_skills = ["npc-dialogue-style"]  # 所有场景都加载

    if scene_type == "inquiry":
        return base_skills + ["inquiry-guidance"]

    elif scene_type == "diagnosis":
        return base_skills + ["diagnosis-reasoning", "weakness-intervention"]

    elif scene_type == "prescription":
        return base_skills + ["prescription-comparison", "syllabus-lecture"]

    elif scene_type == "teaching":
        return base_skills + ["syllabus-lecture", "weakness-intervention"]

    else:
        return base_skills + ["syllabus-lecture"]  # 默认加载教学大纲
```

---

## 16. 附录：数据文件示例

### 16.1 TASKS.json 结构

```json
{
  "npc_id": "qingmu",
  "tasks": [
    {
      "task_id": "mahuang-tang-learning",
      "title": "麻黄汤学习",
      "type": "prescription",
      "status": "pending",
      "progress": 0.0,
      "blocked_by": null,
      "todos": [
        {"id": "composition", "name": "组成", "mastery": 0.0, "status": "pending"},
        {"id": "compatibility", "name": "配伍", "mastery": 0.0, "status": "pending"},
        ...
      ],
      "weaknesses": []
    }
  ]
}
```

### 16.2 core_cases.json 结构

```json
{
  "cases": [
    {
      "case_id": "case_001",
      "blocked_by": "mahuang-tang-learning",
      "syndrome": {"type": "风寒表实证"},
      "clues": {
        "required": ["恶寒重", "无汗", "发热轻", "脉浮紧"],
        "auxiliary": ["身痛", "头痛"]
      }
    }
  ]
}
```

---

*本设计规范由 Claude Code 编写，v1.1 版本已修正 Skills vs Tools 分类。*
*核心变更：教学方法论从 Tools 改为 Skills，数据操作保留为 Tools。*
*待审阅后进入实现计划阶段。*