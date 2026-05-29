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

## 3. 游戏NPC配置结构（最终方案）

**每个NPC独立配置目录，包含完整的skills和tools：**

```
zhongyi_game_v3/hermes/npcs/
    ├── qingmu/                      # 青木先生（诊所NPC）
    │   ├── SOUL.md                  # 身份性格
    │   ├── USER.md                  # 对玩家观察
    │   ├── MEMORY.md                # 教学心得
    │   ├── SYLLABUS.md              # 教学大纲
    │   │
    │   ├── skills/                  # NPC专属Skills
    │   │   ├── guided_questioning/
    │   │   │   └── SKILL.md         # 引导式提问技巧
    │   │   ├── case_analysis/
    │   │   │   └ SKILL.md           # 病案分析方法
    │   │   ├── feedback_evaluation/
    │   │   │    SKILL.md           # 评分反馈模板
    │   │   └── tcm-knowledge/       # 中医知识库
    │   │       ├── herbs/
    │   │       ├── formulas/
    │   │       └ syndromes/
    │   │
    │   └── plugins/                 # NPC专属Tools
    │   │   └ tcm-game/
    │   │   │   ├── plugin.yaml      # 插件manifest
    │   │   │   └ and __init__.py      # 工具注册
    │   │
    │   └── laozhang/                # 老张（药园NPC）
    │   │   ├── SOUL.md
    │   │   ├── USER.md
    │   │   ├── MEMORY.md
    │   │   ├── skills/
    │   │   └ and plugins/
    │   │
    │   └── neighbor/                # 邻居（家NPC）
    │   │   ├── SOUL.md
    │   │   ├── USER.md
    │   │   ├── MEMORY.md
    │   │   ├── skills/
    │   │   └ and plugins/
```

### 3.1 游戏工具定义（当前在 hermes_backend/tools/game_tools.py）

| 工具名称 | 功能描述 | emoji |
|----------|----------|-------|
| `get_inventory` | 查询玩家背包内容 | 🎒 |
| `get_learning_progress` | 查询玩家学习进度 | 📊 |
| `get_case_progress` | 查询病案诊治进度 | 📋 |
| `trigger_minigame` | 启动指定小游戏 | 🎮 |
| `record_weakness` | 记录学习弱点 | 📝 |
| `get_npc_memory` | 获取NPC对玩家的观察记录 | 🧠 |

**关键设计：**
- ✅ **NPC完全独立**：每个NPC有独立的skills和plugins
- ✅ **环境变量控制**：`HERMES_HOME`直接指向NPC目录
- ✅ **无需额外选择器**：启动时指定NPC路径即可

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

**简化架构：每次只测试一个 NPC**

通过 `HERMES_HOME` 直接指向特定 NPC 目录，无需额外的 NPC 选择变量：

```
# 启动青木先生测试
HERMES_HOME=/path/to/zhongyi_game_v3/hermes/npcs/qingmu

# 启动老张测试
HERMES_HOME=/path/to/zhongyi_game_v3/hermes/npcs/laozhang
```

这样前端每次只和一个智能体对话，结构最简单。

**集成架构（简化版）：**

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
│  - 自动加载 HERMES_HOME/SOUL.md, USER.md, MEMORY.md          │
│  - 自动扫描 HERMES_HOME/skills/*/SKILL.md                    │
│  - 自动发现 HERMES_HOME/plugins/*/plugin.yaml                │
└─────────────────────────────────────────────────────────────┘
                          │
                          │ HERMES_HOME=/path/to/hermes/npcs/qingmu
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              单个 NPC 配置目录 (hermes/npcs/qingmu/)           │
│                                                              │
│  ├── SOUL.md         → 自动加载为 NPC 身份                    │
│  ├── USER.md         → 自动加载为玩家观察                     │
│  ├── MEMORY.md       → 自动加载为教学心得                     │
│  ├── SYLLABUS.md     → 自动加载为教学大纲                     │
│  │                                                          │
│  ├── skills/                                                │
│  │   ├── guided_questioning/SKILL.md  → 自动加载为 Skill      │
│  │   ├── case_analysis/SKILL.md       → 自动加载为 Skill      │
│  │   └── feedback_evaluation/SKILL.md → 自动加载为 Skill      │
│  │                                                          │
│  └── plugins/tcm-game/              → 游戏插件目录             │
│      ├── plugin.yaml                → 插件 manifest            │
│      └── __init__.py                → 工具注册函数             │
└─────────────────────────────────────────────────────────────┘
```

**关键优势：**
- ✅ **最简化架构**：只用一个环境变量 `HERMES_HOME`
- ✅ **官方机制复用**：无需任何修改，原生支持
- ✅ **NPC 独立隔离**：每个 NPC 有独立的 skills 和 tools 配置
- ✅ **清晰边界**：一次只测试一个智能体
```

---

## 5. 实施要点

### 5.1 关键发现 1：插件系统自动发现 Tools

**Hermes Agent 插件发现来源（按优先级）：**
1. Bundled plugins: `hermes-agent/plugins/<name>/`
2. **User plugins: `HERMES_HOME/plugins/<name>/`** ← 通过环境变量！
3. Project plugins: `./.hermes/plugins/<name>/`
4. Pip plugins: `hermes_agent.plugins` entry-points

**这意味着：Tools 可以像 Skills 一样通过 HERMES_HOME 自动发现！**

### 5.1.1 关键发现 2：工具加载机制（非渐进式）

**源码分析（model_tools.py 第263-389行）：**

```python
def get_tool_definitions(...):
    # 缓存完整工具定义
    if quiet_mode:
        cache_key = (
            frozenset(enabled_toolsets),
            frozenset(disabled_toolsets),
            registry._generation,
            cfg_fp,
        )
        cached = _tool_defs_cache.get(cache_key)
        ...

    # 返回完整 schema，不是概览
    filtered_tools = registry.get_definitions(tools_to_include, quiet=quiet_mode)
    return filtered_tools  # List[Dict[str, Any]] - 完整定义
```

**关键结论：**
- ❌ **不使用渐进式加载**（无"概览→详细"两阶段）
- ✅ 工具定义在初始化时一次性加载
- ✅ API 调用传递完整工具 schema：`"tools": self.tools`
- ⚠️ 所有工具 schema 完整发送给 LLM（token 消耗较多）

**影响：**
- 游戏工具数量适中（6个），不会造成过大的 schema 开销
- 工具注册后立即可用，无需额外触发
- 建议：为每个工具提供简洁但完整的 schema

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
# 启动 Hermes WebUI，测试青木先生
cd ~/Desktop/hermes-webui
HERMES_HOME=/home/lixiang/Desktop/zhongyi_game_v3/hermes/npcs/qingmu ./start.sh
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

## 6. 待确认事项（已解决）

### 6.1 NPC 选择问题 ✅ 已解决

**最终方案：环境变量直接指向NPC目录**

```bash
HERMES_HOME=/path/to/hermes/npcs/qingmu  # 直接指向NPC目录
```

**优势：**
- ✅ 无需额外选择器
- ✅ 每个NPC完全独立
- ✅ 使用原生机制（零修改）

### 6.2 GameState 集成方案（已确认）

**测试环境：使用 Mock 数据（推荐）**
- 稳定可靠，不依赖游戏运行状态
- 可以快速验证工具调用逻辑
- 参见 7.4 GameState Mock 实现

**生产环境：可选连接真实游戏后端（扩展）**
- 如果需要真实状态，可通过 HTTP API 连接游戏后端
- 当前阶段优先使用 Mock

---

## 7. 详细实施方案

### 7.1 Skills 格式转换方案

**当前状态（游戏）：**
```
hermes/skills/
    ├── guided_questioning.md
    ├── case_analysis.md
    ├── feedback_evaluation.md
    └── tcm-knowledge/
        ├── herbs/
        ├── formulas/
        └── syndromes/
```

**目标状态（Hermes 标准）：**
```
HERMES_HOME/skills/
    ├── guided_questioning/
    │   └── SKILL.md           # 移动自 guided_questioning.md
    ├── case_analysis/
    │   └── SKILL.md           # 移动自 case_analysis.md
    ├── feedback_evaluation/
    │   └── SKILL.md           # 移动自 feedback_evaluation.md
    └── tcm-knowledge/
        └── herbs/
        └── formulas/
        └── syndromes/
```

**转换脚本（可自动化）：**
```bash
#!/bin/bash
# convert_skills.sh

HERMES_SKILLS="hermes/skills"
TARGET_SKILLS="$HERMES_HOME/skills"

for skill_file in "$HERMES_SKILLS"/*.md; do
    skill_name=$(basename "$skill_file" .md)
    mkdir -p "$TARGET_SKILLS/$skill_name"
    mv "$skill_file" "$TARGET_SKILLS/$skill_name/SKILL.md"
    echo "✅ Converted: $skill_file → $TARGET_SKILLS/$skill_name/SKILL.md"
done

# 保留子目录结构（tcm-knowledge 等）
cp -r "$HERMES_SKILLS/tcm-knowledge" "$TARGET_SKILLS/"
echo "✅ Copied: tcm-knowledge directory"
```

### 7.2 Tools 迁移方案（详细）

**方案 A：创建插件目录（推荐）**

优势：
- ✅ 符合 Hermes 插件架构标准
- ✅ 工具自动发现，无需修改官方代码
- ✅ 清晰的边界：游戏工具独立维护
- ✅ 可以独立启用/禁用工具集

**实施步骤：**

1. **创建插件目录结构：**
```bash
mkdir -p hermes/plugins/tcm-game
```

2. **创建 plugin.yaml：**
```yaml
name: tcm-game
version: 1.0.0
description: "中医游戏工具集成 - 背包、进度、病案、小游戏触发"
author: zhongyi-team
kind: standalone
provides_tools:
  toolsets:
    - tcm_game
  tools:
    - get_inventory
    - get_learning_progress
    - get_case_progress
    - trigger_minigame
    - record_weakness
    - get_npc_memory
```

3. **迁移工具定义（__init__.py）：**

从 `hermes_backend/tools/game_tools.py` 提取：
- Schema 定义（`*_SCHEMA`）
- Handler 函数（`*_handler`）
- 注册逻辑（使用 `ctx.register_tool`）

4. **Handler 实现适配：**

当前 handler 依赖：
- `hermes_backend/game_state/game_store.py` → MockGameStore
- 游戏状态查询接口

测试环境需要：
- Mock 数据源（用于 WebUI 测试）
- 或连接真实游戏后端（可选）

**方案 B：工具直接迁移到 hermes-agent/tools/（不推荐）**

问题：
- ❌ 需要修改官方代码库
- ❌ 违背"不修改官方代码"要求
- ❌ 工具升级和维护困难

### 7.3 NPC 配置方案（已简化）

**启动方式：直接指定NPC目录**

```bash
# 测试青木先生
HERMES_HOME=/path/to/zhongyi_game_v3/hermes/npcs/qingmu \
    cd ~/Desktop/hermes-webui && ./start.sh

# 测试老张
HERMES_HOME=/path/to/zhongyi_game_v3/hermes/npcs/laozhang \
    cd ~/Desktop/hermes-webui && ./start.sh

# 测试邻居
HERMES_HOME=/path/to/zhongyi_game_v3/hermes/npcs/neighbor \
    cd ~/Desktop/hermes-webui && ./start.sh
```

**启动脚本（可选简化）：**

```bash
#!/bin/bash
# start_npc_test.sh

NPC_NAME=${1:-qingmu}
HERMES_BASE="/home/lixiang/Desktop/zhongyi_game_v3/hermes/npcs"

export HERMES_HOME="$HERMES_BASE/$NPC_NAME"

echo "🚀 Starting Hermes WebUI with NPC: $NPC_NAME"
echo "   HERMES_HOME: $HERMES_HOME"
echo "   NPC配置: SOUL, USER, MEMORY, Skills, Tools"

cd ~/Desktop/hermes-webui
./start.sh
```

**使用示例：**

```bash
# 默认测试青木先生
./start_npc_test.sh

# 测试老张
./start_npc_test.sh laozhang

# 测试邻居
./start_npc_test.sh neighbor
```

**关键优势：**
- ✅ **零修改官方代码**：完全使用原生机制
- ✅ **NPC完全隔离**：每个NPC独立skills/tools配置
- ✅ **启动简单**：只需一个环境变量
- ✅ **扩展灵活**：新增NPC只需创建新目录

### 7.4 GameState 集成方案

**测试环境 Mock 数据：**

```python
# hermes/plugins/tcm-game/mock_state.py

class MockGameState:
    """测试用的游戏状态 Mock"""

    def get_inventory(self):
        return {
            "items": [
                {"name": "当归", "quantity": 5, "quality": "优质"},
                {"name": "黄芪", "quantity": 3, "quality": "普通"},
            ],
            "capacity": 20
        }

    def get_learning_progress(self):
        return {
            "total_cases": 10,
            "completed_cases": 3,
            "accuracy": 0.75,
            "weak_areas": ["辨证", "方剂配伍"]
        }

    def get_case_progress(self, case_id: str):
        return {
            "case_id": case_id,
            "diagnosis_stage": 3,
            "herbs_selected": ["当归", "白芍"],
            "score": 80
        }
```

**生产环境真实数据（可选）：**

如果需要连接真实游戏后端：
```python
# hermes/plugins/tcm-game/api_client.py

import requests

class GameAPIClient:
    """连接游戏后端 API"""

    BASE_URL = "http://localhost:8642"

    def get_inventory(self):
        resp = requests.get(f"{self.BASE_URL}/api/inventory")
        return resp.json()

    def get_learning_progress(self):
        resp = requests.get(f"{self.BASE_URL}/api/progress")
        return resp.json()
```

当前阶段推荐使用 Mock 数据，确保测试稳定独立。

---

## 8. 实施路线图

### Phase 1：基础集成（第 1 天）

| 任务 | 预计时间 | 验收标准 |
|------|---------|---------|
| 创建插件目录结构 | 30 min | `hermes/plugins/tcm-game/` 存在 |
| 编写 plugin.yaml | 30 min | Schema 定义完整 |
| 迁移工具定义 | 2 hour | 所有工具 schema 定义 |
| 编写 Mock Handler | 2 hour | 工具可调用，返回 Mock 数据 |
| 验证自动发现 | 30 min | WebUI 启动后工具可见 |

### Phase 2：Skills 适配（第 0.5 天）

| 任务 | 预计时间 | 验收标准 |
|------|---------|---------|
| Skills 目录转换 | 30 min | 所有 Skill 有 SKILL.md |
| Skills 内容验证 | 30 min | 内容正确，无格式错误 |
| Skills 加载测试 | 30 min | WebUI 启动后 Skills 注入 |

### Phase 3：NPC 配置（第 0.5 天）

| 任务 | 预计时间 | 验收标准 |
|------|---------|---------|
| NPC 配置结构整理 | 30 min | SOUL/USER/MEMORY/SYLLABUS |
| NPC 启动脚本 | 30 min | 可指定 NPC 启动 |
| NPC 测试验证 | 30 min | NPC 性格/记忆正确加载 |

### Phase 4：完整测试（第 1 天）

| 任务 | 预计时间 | 验收标准 |
|------|---------|---------|
| 工具调用测试 | 2 hour | 所有工具正确响应 |
| NPC 对话测试 | 2 hour | NPC 正确使用工具/Skills |
| 边界情况测试 | 1 hour | 错误处理正常 |
| 文档完善 | 1 hour | 使用说明完整 |

---

## 9. 验收标准

### 9.1 功能验收

| 功能 | 测试方法 | 预期结果 |
|------|---------|---------|
| NPC 配置加载 | 启动 WebUI，查看 System Prompt | 包含 SOUL/USER/MEMORY |
| Skills 加载 | 启动 WebUI，查看 System Prompt | Skills 内容注入 |
| 工具自动发现 | WebUI 界面，查看可用工具列表 | 显示 6 个游戏工具 |
| 工具调用测试 | 在对话中请求查询背包 | 返回 Mock 数据 |
| NPC 性格测试 | 与 NPC 对话，观察风格 | 符合 SOUL 定义 |
| Skills 应用测试 | 询问病案分析 | NPC 应用 Skills 方法 |

### 9.2 架构验收

| 要求 | 验收方法 | 预期结果 |
|------|---------|---------|
| 不修改官方代码 | git diff hermes-agent | 无变更 |
| 不修改官方 WebUI | git diff hermes-webui | 无变更 |
| 自动发现机制 | 检查加载日志 | 无手动注册代码 |
| 环境变量控制 | 切换 HERMES_HOME | NPC 配置切换 |

---

## 10. 后续优化方向

1. **多 NPC 动态切换**：WebUI 内 NPC 选择器
2. **真实游戏状态**：连接游戏后端 API（替代 Mock）
3. **Skills 丰富化**：添加更多中医教学 Skills
4. **工具扩展**：添加更多游戏交互工具
5. **测试自动化**：E2E 测试脚本集成

---

## 附录：关键文件参考

| 文件 | 作用 | 位置 |
|------|------|------|
| `hermes_constants.py` | HERMES_HOME 定义 | `hermes-agent/hermes_constants.py` |
| `agent/prompt_builder.py` | SOUL/Skills 加载 | `hermes-agent/agent/prompt_builder.py` |
| `tools/registry.py` | 工具注册中心 | `hermes-agent/tools/registry.py` |
| `model_tools.py` | 工具调度 | `hermes-agent/model_tools.py` |
| `api/streaming.py` | WebUI 调用 Agent | `hermes-webui/api/streaming.py` |