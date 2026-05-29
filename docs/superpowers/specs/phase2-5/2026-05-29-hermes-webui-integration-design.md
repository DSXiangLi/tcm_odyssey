# Hermes WebUI 集成测试设计规范

**版本**: v1.0
**日期**: 2026-05-29
**阶段**: Phase 2.5 补充
**状态**: 分析完成，待设计确认

---

## 1. 需求背景

### 1.1 用户需求

- 使用官方 Hermes WebUI 完整测试游戏 NPC 的所有功能
- 包括：工具调用、技能加载、NPC 个人信息（SOUL/USER/MEMORY）
- 不修改 Hermes 官方代码
- 从原生 Hermes 的 Gateway 层接入
- 智能体相关的工具包可以修改架构

### 1.2 现有架构澄清

| 项目 | 实现方式 | 端口 | 关系 |
|------|----------|------|------|
| **官方 Hermes Agent** (`~/Desktop/hermes-agent`) | 完整的通用 Agent 系统 | CLI/gateway | 核心引擎 |
| **官方 Hermes WebUI** (`~/Desktop/hermes-webui`) | 直接调用 AIAgent（非 HTTP API） | 8787 | Hermes Agent 的前端界面 |
| **游戏 hermes_backend** (`zhongyi_game_v3/hermes_backend`) | 独立简化实现 | 8642 | 当前游戏的独立后端 |

**关键发现：Hermes WebUI 不通过 HTTP API 连接 Hermes Agent，而是直接导入 `AIAgent` 类。**

---

## 2. 官方架构分析

### 2.1 Hermes WebUI → Hermes Agent 连接方式

```
Hermes WebUI (api/streaming.py)
    │
    │ from run_agent import AIAgent  # 直接导入，不是 HTTP
    │
    ▼
Hermes Agent (run_agent.py)
    │
    │ AIAgent 类 - Agent 核心引擎
    │
    ▼
    ├── agent/prompt_builder.py  # 系统提示组装
    │       └── get_hermes_home() → HERMES_HOME 环境变量
    │       └── 加载 SOUL.md, USER.md, MEMORY.md
    │       └── 加载 skills/ 目录
    │
    ├── tools/registry.py  # 工具注册中心
    │       └── discover_builtin_tools() → 自动发现 tools/*.py
    │       └── registry.register() → 模块导入时自注册
    │
    └── model_tools.py  # 工具调度层
            └── handle_function_call() → 执行工具
```

### 2.2 HERMES_HOME 环境变量机制

```python
# hermes_constants.py
def get_hermes_home() -> Path:
    """读取 HERMES_HOME 环境变量，默认 ~/.hermes"""
    val = os.environ.get("HERMES_HOME", "").strip()
    if val:
        return Path(val).expanduser().absolute()
    return Path.home() / ".hermes"
```

**关键：设置 `HERMES_HOME` 可以让 Hermes Agent 从任意目录加载配置。**

### 2.3 Skills 加载机制

```
HERMES_HOME/skills/
    ├── tcm-teaching/
    │   ├── guided_questioning/
    │   │   └── SKILL.md
    │   └── case_analysis/
    │   │   └── SKILL.md
    │   └── feedback_evaluation/
    │   │   └── SKILL.md
    └── ...
```

Hermes Agent 通过 `agent/prompt_builder.py` 自动扫描 `HERMES_HOME/skills/` 目录，将 Skills 注入系统提示。

### 2.4 Tools 自动发现机制

```python
# model_tools.py
from tools.registry import discover_builtin_tools, registry

discover_builtin_tools()  # 自动扫描 tools/*.py，触发模块导入时的 register() 调用
```

工具文件放在 `hermes-agent/tools/` 目录下，模块导入时调用 `registry.register()` 即可自动注册。

---

## 3. 游戏现有配置结构

### 3.1 NPC 配置目录

```
zhongyi_game_v3/hermes/
    ├── npcs/qingmu/
    │   ├── SOUL.md          # 身份性格
    │   ├── USER.md          # 对玩家观察
    │   ├── MEMORY.md        # 教学心得
    │   └── SYLLABUS.md      # 教学大纲
    │
    ├── skills/
    │   ├── guided_questioning.md  # 引导式提问技巧
    │   ├── case_analysis.md       # 病案分析方法
    │   ├── feedback_evaluation.md # 评分反馈模板
    │   └── tcm-knowledge/
    │       ├── herbs/
    │       ├── formulas/
    │       └── syndromes/
    │
    └── npcs/laozhang/  # 老张（药园）
    └── npcs/neighbor/  # 邻居（家）
```

### 3.2 游戏工具定义（当前在 hermes_backend/tools/game_tools.py）

| 工具名称 | 功能描述 | emoji |
|----------|----------|-------|
| `get_inventory` | 查询玩家背包内容 | 🎒 |
| `get_learning_progress` | 查询玩家学习进度 | 📊 |
| `get_case_progress` | 查询病案诊治进度 | 📋 |
| `trigger_minigame` | 启动指定小游戏 | 🎮 |
| `record_weakness` | 记录学习弱点 | 📝 |
| `get_npc_memory` | 获取NPC对玩家的观察记录 | 🧠 |

---

## 4. 集成方案分析

### 4.1 方式 A：修改 WebUI 直连游戏后端（原分析 - 已否决）

**问题：**
- Hermes WebUI 不通过 HTTP API 连接，而是直接导入 `AIAgent`
- 无法简单修改 API endpoint
- 需要修改 WebUI 核心代码（违背用户要求）

### 4.2 方式 B：游戏配置集成到 Hermes Agent（正确方案）

**核心机制：**
- Hermes Agent 使用 `HERMES_HOME` 定位配置目录
- Skills 从 `HERMES_HOME/skills/` 自动加载
- Tools 通过 `discover_builtin_tools()` 自动发现
- **只需正确设置环境变量和工具位置，无需修改官方代码**

**集成架构：**

```
┌─────────────────────────────────────────────────────────────┐
│                 官方 Hermes WebUI (不动)                      │
│                      端口 8787                                │
│                                                              │
│  直接导入 AIAgent:                                           │
│  from run_agent import AIAgent                               │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                 官方 Hermes Agent (不动)                      │
│                      run_agent.py                            │
│                                                              │
│  核心机制：                                                  │
│  - HERMES_HOME 环境变量定位配置目录                          │
│  - discover_builtin_tools() 自动发现工具                     │
│  - agent/prompt_builder.py 加载 SOUL/Skills                  │
└─────────────────────────────────────────────────────────────┘
                          │
                          │ HERMES_HOME=/path/to/zhongyi_game_v3/hermes
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                  游戏配置目录 (hermes/)                        │
│                                                              │
│  ├── npcs/qingmu/                                           │
│  │   ├── SOUL.md      → 自动加载为 NPC 身份                  │
│  │   ├── USER.md      → 自动加载为玩家观察                   │
│  │   ├── MEMORY.md    → 自动加载为教学心得                   │
│  │   └── SYLLABUS.md  → 自动加载为教学大纲                   │
│  │                                                          │
│  ├── skills/                                                │
│  │   ├── guided_questioning.md  → 自动加载为 Skill          │
│  │   ├── case_analysis.md       → 自动加载为 Skill          │
│  │   └── feedback_evaluation.md → 自动加载为 Skill          │
│  │                                                          │
│  └── ...其他 NPC                                             │
└─────────────────────────────────────────────────────────────┘
                          │
                          │ Tools 需放到 hermes-agent/tools/
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              hermes-agent/tools/game_tools.py (迁移)          │
│                                                              │
│  游戏工具注册：                                              │
│  - get_inventory                                            │
│  - get_learning_progress                                    │
│  - get_case_progress                                        │
│  - trigger_minigame                                         │
│  - record_weakness                                          │
│  - get_npc_memory                                           │
│                                                              │
│  通过 discover_builtin_tools() 自动发现                      │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. 实施要点

### 5.1 关键发现：插件系统自动发现 Tools

**Hermes Agent 插件发现来源（按优先级）：**
1. Bundled plugins: `hermes-agent/plugins/<name>/`
2. **User plugins: `HERMES_HOME/plugins/<name>/`** ← 通过环境变量！
3. Project plugins: `./.hermes/plugins/<name>/`
4. Pip plugins: `hermes_agent.plugins` entry-points

**这意味着：Tools 可以像 Skills 一样通过 HERMES_HOME 自动发现！**

### 5.2 游戏集成架构（最终方案）

```
HERMES_HOME=zhongyi_game_v3/hermes
    │
    ├── npcs/qingmu/
    │   ├── SOUL.md         → 自动加载为 NPC 身份
    │   ├── USER.md         → 自动加载为玩家观察
    │   ├── MEMORY.md       → 自动加载为教学心得
    │   └── SYLLABUS.md     → 自动加载为教学大纲
    │
    ├── skills/
    │   ├── guided_questioning/SKILL.md  → 自动加载为 Skill
    │   ├── case_analysis/SKILL.md       → 自动加载为 Skill
    │   └── feedback_evaluation/SKILL.md → 自动加载为 Skill
    │
    └── plugins/tcm-game/              → **新增：游戏插件目录**
        ├── plugin.yaml                → 插件 manifest
        └── __init__.py                → register(ctx) 函数
```

### 5.3 需要做的工作

| 步骤 | 内容 | 工作量 |
|------|------|--------|
| **Step 1** | 创建 `hermes/plugins/tcm-game/plugin.yaml` | 0.5 天 |
| **Step 2** | 创建 `hermes/plugins/tcm-game/__init__.py`（迁移工具注册） | 0.5 天 |
| **Step 3** | Skills 格式适配（单文件 → 目录结构） | 0.5 天 |
| **Step 4** | 测试启动：设置 HERMES_HOME 后启动 WebUI | 0.5 天 |
| **总计** | | **2 天** |

### 5.4 plugin.yaml 示例

```yaml
name: tcm-game
version: 1.0.0
description: "中医游戏工具集成 - 背包、进度、病案、小游戏触发"
author: game-team
kind: standalone
provides_tools:
  - get_inventory
  - get_learning_progress
  - get_case_progress
  - trigger_minigame
  - record_weakness
  - get_npc_memory
```

### 5.5 __init__.py 示例

```python
"""TCM Game Plugin - 游戏工具集成"""

from plugins.tcm_game.tools import (
    GET_INVENTORY_SCHEMA,
    GET_LEARNING_PROGRESS_SCHEMA,
    GET_CASE_PROGRESS_SCHEMA,
    TRIGGER_MINIGAME_SCHEMA,
    RECORD_WEAKNESS_SCHEMA,
    GET_NPC_MEMORY_SCHEMA,
    get_inventory_handler,
    get_learning_progress_handler,
    get_case_progress_handler,
    trigger_minigame_handler,
    record_weakness_handler,
    get_npc_memory_handler,
)

_TOOLS = (
    ("get_inventory",        GET_INVENTORY_SCHEMA,        get_inventory_handler,        "🎒"),
    ("get_learning_progress", GET_LEARNING_PROGRESS_SCHEMA, get_learning_progress_handler, "📊"),
    ("get_case_progress",     GET_CASE_PROGRESS_SCHEMA,     get_case_progress_handler,     "📋"),
    ("trigger_minigame",      TRIGGER_MINIGAME_SCHEMA,      trigger_minigame_handler,      "🎮"),
    ("record_weakness",       RECORD_WEAKNESS_SCHEMA,       record_weakness_handler,       "📝"),
    ("get_npc_memory",        GET_NPC_MEMORY_SCHEMA,        get_npc_memory_handler,        "🧠"),
)

def register(ctx) -> None:
    """Register all game tools. Called once by the plugin loader."""
    for name, schema, handler, emoji in _TOOLS:
        ctx.register_tool(
            name=name,
            toolset="tcm_game",
            schema=schema,
            handler=handler,
            check_fn=None,  # 或检查游戏状态是否可用
            emoji=emoji,
        )
```

### 5.6 启动命令

```bash
# 启动 Hermes WebUI，加载游戏配置
cd ~/Desktop/hermes-webui
HERMES_HOME=/home/lixiang/Desktop/zhongyi_game_v3/hermes ./start.sh
```

### 5.3 Skills 格式适配

当前游戏 Skills 是单文件 `.md`，Hermes Agent 期望目录结构：

```
# 当前格式（游戏）
hermes/skills/guided_questioning.md

# Hermes 标准格式
HERMES_HOME/skills/guided_questioning/SKILL.md
```

**需要转换：每个 Skill 文件放到独立目录，命名为 SKILL.md**

---

## 6. 待确认事项

### 6.1 NPC 选择问题

- 当前设计假设启动一个 NPC（青木先生）
- SOUL.md 加载机制：Hermes Agent 默认加载 `HERMES_HOME/SOUL.md`
- 游戏有多 NPC：需要确认如何处理多 NPC 选择

**可能方案：**
- 方案 1：每次启动只测试一个 NPC，切换 NPC 需修改 HERMES_HOME
- 方案 2：将 NPC 配置合并到一个 SOUL.md（不推荐）
- 方案 3：创建 NPC 选择入口脚本

### 6.2 GameStateBridge 集成

- 游戏工具需要访问游戏状态（背包、进度等）
- 当前 hermes_backend 使用 MockGameStore
- 需要确认：测试时使用 Mock 数据还是真实游戏状态

---

## 7. 下一步

- 确认以上分析正确后，进入详细设计阶段
- 设计 Skills 格式转换方案
- 设计 Tools 迁移方案
- 设计 NPC 选择方案

---

## 附录：关键文件参考

| 文件 | 作用 | 位置 |
|------|------|------|
| `hermes_constants.py` | HERMES_HOME 定义 | `hermes-agent/hermes_constants.py` |
| `agent/prompt_builder.py` | SOUL/Skills 加载 | `hermes-agent/agent/prompt_builder.py` |
| `tools/registry.py` | 工具注册中心 | `hermes-agent/tools/registry.py` |
| `model_tools.py` | 工具调度 | `hermes-agent/model_tools.py` |
| `api/streaming.py` | WebUI 调用 Agent | `hermes-webui/api/streaming.py` |