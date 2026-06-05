# 任务驱动的游戏触发与数据流动设计

**日期**: 2026-06-05
**阶段**: Phase 2.5 续（数据流动闭环）
**分支**: feature/task-driven-game-trigger
**最后更新**: 2026-06-05

---

## 一、问题定义

### 1.1 当前状态

Phase 2.5 已完成多个HTML小游戏嵌入，但数据流动存在严重断点：

| 功能 | 状态 | 问题 |
|------|------|------|
| NPC查询数据 | ✅ 已有 | get_inventory/get_learning_progress正常工作 |
| NPC创建任务 | ✅ 已有 | create_task工具已实现 |
| NPC触发游戏 | ❌ **缺失** | trigger_minigame是mock实现，无法真正触发 |
| 游戏更新数据 | ❌ **缺失** | 游戏完成后无API调用，数据不更新 |
| NPC感知变化 | ❌ **缺失** | 下次对话仍返回旧数据 |

**核心问题**：数据流动断裂，游戏结果无法回流到后端，NPC无法感知变化。

### 1.2 问题根源分析

**Phase 1 Evidence（证据收集）**：

检查发现三个关键断点：

1. **trigger_minigame工具是mock实现**
   ```python
   def trigger_minigame_handler(args: dict, **kw) -> dict:
       # ❌ 只返回mock JSON，无实际效果
       return {"status": "launched", "session_id": f"game_{game_type}_{case_id}"}
   ```

2. **游戏UI没有API调用**
   ```typescript
   // DecoctionUI.tsx
   onComplete: (result) => {
       // ❌ 没有 POST /api/task/update
       // ❌ 没有 POST /api/inventory/update
   }
   ```

3. **没有游戏触发机制**
   - ❌ 无WebSocket/SSE实时通信
   - ❌ 无前端轮询机制
   - ❌ 无配置预填充机制

### 1.3 关键洞察

**用户洞察**："这不应该是配置，而应该是task，都是玩家需要完成的任务"

**正确理解**：
- 煎麻黄汤 = 任务（不是"推荐配置")
- 辨证风寒表实证 = 任务
- 炮制当归 = 任务

**任务本质**：
- 有状态：pending → in_progress → completed
- 有进度：0% → 100%
- 有奖励：完成任务获得药材
- 有评分：游戏评分记录

**架构决策**：扩展现有任务系统，不新建"推荐配置"表。

---

## 二、核心场景定义

### 2.1 三个核心场景

| 优先级 | 场景 | 触发时机 | 数据流动 |
|--------|------|----------|----------|
| **P0** | NPC教完方剂→创建煎药任务 | NPC对话结束 | create_task(decoction) → tasks表 |
| **P0** | 玩家自主触发游戏 | 按键启动 | 查询pending_game → 传入配置 → 游戏启动 |
| **P0** | 游戏完成→数据更新 | 游戏评分 | POST task/update + inventory/update |
| **P1** | NPC感知变化→点评 | 下次对话 | get_learning_progress返回新状态 |

### 2.2 数据流动完整闭环

```
┌─────────────┐
│  NPC对话     │
│ "煎麻黄汤"   │
└─────────────┘
      ↓
┌─────────────┐
│ create_task │
│ (game_task) │
└─────────────┘
      ↓ API
┌─────────────┐
│ tasks表      │
│ status:      │
│ pending      │
└─────────────┘
      ↓ 查询
┌─────────────┐
│ ClinicScene │
│ 查询pending │
│ 按键触发    │
└─────────────┘
      ↓ 启动
┌─────────────┐
│ 游戏UI       │
│ 执行任务    │
└─────────────┘
      ↓ 完成
┌─────────────┐
│ POST update │
│ task+reward │
└─────────────┘
      ↓ 更新
┌─────────────┐
│ tasks表      │
│ status:      │
│ completed    │
└─────────────┘
      ↓ 查询
┌─────────────┐
│ NPC下次对话 │
│ 返回新状态  │
└─────────────┘
```

---

## 三、系统架构

### 3.1 架构概览

```
┌──────────────────────────────────────────────────┐
│  Hermes Backend (NPC Agent)                      │
│  ┌────────────────────────────────────────────┐ │
│  │  create_task工具 (扩展)                     │ │
│  │  - game_type: 'decoction'                  │ │
│  │  - game_config: {prescriptionId}           │ │
│  │  - reward: [{herb_id, delta}]              │ │
│  └────────────────────────────────────────────┘ │
│        ↓ POST /api/task/create                  │
└──────────────────────────────────────────────────┘
              ↓ API调用
┌──────────────────────────────────────────────────┐
│  game-state-backend                              │
│  ┌────────────────────────────────────────────┐ │
│  │  tasks表 (扩展字段)                         │ │
│  │  - game_type                               │ │
│  │  - game_config                             │ │
│  │  - score                                   │ │
│  │  - reward                                  │ │
│  └────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────┐ │
│  │  新增API                                    │ │
│  │  - GET /pending_game                       │ │
│  │  - POST /task/update                       │ │
│  └────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────┘
              ↓ 前端查询
┌──────────────────────────────────────────────────┐
│  ClinicScene                                      │
│  ┌────────────────────────────────────────────┐ │
│  │  查询pending_game任务                       │ │
│  │  按键 → startGame(config)                  │ │
│  └────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────┘
              ↓ 游戏启动
┌──────────────────────────────────────────────────┐
│  游戏场景 (Decoction/Diagnosis/Paozhi)           │
│  ┌────────────────────────────────────────────┐ │
│  │  init(data) 接收配置                        │ │
│  │  游戏执行                                   │ │
│  │  onComplete → POST /task/update            │ │
│  │              → POST /inventory/update      │ │
│  └────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────┘
              ↓ 数据更新
┌──────────────────────────────────────────────────┐
│  game-state-backend                              │
│  tasks表: status='completed', score=85           │
│  inventory表: 麻黄+3                             │
└──────────────────────────────────────────────────┘
              ↓ NPC查询
┌──────────────────────────────────────────────────┐
│  NPC下次对话                                      │
│  get_learning_progress → 返回已完成任务           │
│  get_inventory → 返回新背包数据                   │
└──────────────────────────────────────────────────┘
```

### 3.2 双端协作分工

| 侧 | 职责 | 实现内容 |
|---|------|----------|
| **Hermes Backend** | 创建任务决策 | create_task工具扩展，支持game_task类型 |
| **game-state-backend** | 任务数据管理 | tasks表扩展，新增API端点 |
| **游戏前端** | 任务执行 | 查询pending任务，游戏完成时更新数据 |
| **NPC Agent** | 状态感知 | get_learning_progress查询新状态 |

---

## 四、数据模型设计

### 4.1 tasks表扩展

**当前结构**：
```sql
CREATE TABLE tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id TEXT NOT NULL,
    task_id TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    type TEXT NOT NULL,          -- 'prescription', 'syndrome'
    status TEXT NOT NULL,        -- 'pending', 'in_progress', 'completed'
    progress REAL DEFAULT 0.0,
    blocked_by TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);
```

**扩展字段**：
```sql
ALTER TABLE tasks ADD COLUMN game_type TEXT;
-- 'decoction', 'diagnosis', 'processing'
-- 用于关联游戏类型，仅game_task类型有值

ALTER TABLE tasks ADD COLUMN game_config TEXT;
-- JSON格式：{"prescriptionId": "mahuangtang", "case_id": "case-001", "recipeId": "recipe-001"}
-- 存储游戏启动需要的配置参数

ALTER TABLE tasks ADD COLUMN score REAL DEFAULT 0.0;
-- 游戏评分（0-100），游戏完成时更新

ALTER TABLE tasks ADD COLUMN reward TEXT;
-- JSON格式：{"herbs": [{"herb_id": "mahuang", "delta": 3}], "experience": 10}
-- 任务奖励配置，完成后发放
```

### 4.2 任务类型扩展

**当前类型**：`["prescription", "syndrome"]`

**新增类型**：`["prescription", "syndrome", "game_task"]`

**类型定义**：
- `prescription`: 方剂学习任务（知识点学习）
- `syndrome`: 证型学习任务（知识点学习）
- `game_task`: 游戏任务（煎药、辨证、炮制）

### 4.3 任务状态定义

| 状态 | 含义 | 触发时机 |
|------|------|----------|
| `pending` | 待执行 | NPC创建任务时 |
| `in_progress` | 执行中 | 玩家启动游戏时 |
| `completed` | 已完成 | 游戏评分完成时 |

### 4.4 game_config字段格式

**煎药任务**：
```json
{
  "prescriptionId": "mahuangtang"
}
```

**辨证任务**：
```json
{
  "case_id": "case-001"
}
```

**炮制任务**：
```json
{
  "recipeId": "recipe-001"
}
```

### 4.5 reward字段格式

```json
{
  "herbs": [
    {"herb_id": "mahuang", "delta": 3},
    {"herb_id": "guizhi", "delta": 2}
  ],
  "experience": 10
}
```

---

## 五、完整API套件设计

### 5.1 API全景图

#### 核心API分类

| 分类 | API端点 | 用途 | 调用方 |
|------|---------|------|--------|
| **任务管理** | POST /api/task/create | 创建新任务 | Hermes Backend |
| | GET /api/tasks/{player_id} | 查询所有任务 | Hermes Backend |
| | GET /api/task/{task_id} | 查询单个任务详情 | 游戏场景（获取奖励配置）|
| | GET /api/tasks/{player_id}/pending_game | 查询待执行游戏任务 | ClinicScene |
| | POST /api/task/update | 更新任务状态/评分 | 游戏场景 |
| **背包管理** | GET /api/inventory/{player_id} | 查询背包 | Hermes Backend + InventoryUI |
| | POST /api/inventory/update | 更新背包药材 | 游戏场景（发放奖励）|
| **病案管理** | GET /api/cases/{player_id} | 查询病案历史 | Hermes Backend |
| | POST /api/cases/update | 更新病案记录 | DiagnosisScene |

### 5.2 任务管理API详细设计

#### POST /api/task/create（扩展）

**用途**：创建新任务（包括游戏任务）

**请求**：
```json
{
  "player_id": "player_001",
  "task_id": "task_decoction_mahuangtang_001",
  "title": "煎制麻黄汤",
  "type": "game_task",
  "game_type": "decoction",
  "game_config": "{\"prescriptionId\": \"mahuangtang\"}",
  "reward": "{\"herbs\": [{\"herb_id\": \"mahuang\", \"delta\": 3}]}",
  "blocked_by": null
}
```

**响应**：
```json
{
  "status": "created",
  "task_id": "task_decoction_mahuangtang_001",
  "created_at": "2026-06-05T10:00:00Z"
}
```

#### GET /api/tasks/{player_id}

**用途**：查询玩家所有任务（已有，无需扩展）

**响应**：
```json
{
  "tasks": [
    {
      "task_id": "task_prescription_mahuangtang",
      "title": "学习麻黄汤组成",
      "type": "prescription",
      "status": "completed",
      "progress": 1.0
    },
    {
      "task_id": "task_decoction_mahuangtang_001",
      "title": "煎制麻黄汤",
      "type": "game_task",
      "game_type": "decoction",
      "status": "pending",
      "score": 0.0
    }
  ]
}
```

#### GET /api/task/{task_id}（新增）

**用途**：查询单个任务详情（游戏场景获取奖励配置）

**请求**：
```http
GET /api/task/task_decoction_mahuangtang_001
```

**响应**：
```json
{
  "task": {
    "task_id": "task_decoction_mahuangtang_001",
    "title": "煎制麻黄汤",
    "type": "game_task",
    "game_type": "decoction",
    "game_config": "{\"prescriptionId\": \"mahuangtang\"}",
    "reward": "{\"herbs\": [{\"herb_id\": \"mahuang\", \"delta\": 3}]}",
    "status": "in_progress",
    "score": 0.0,
    "created_at": "2026-06-05T10:00:00Z",
    "updated_at": "2026-06-05T10:15:00Z"
  }
}
```

**实现逻辑**：
```python
@router.get("/task/{task_id}")
async def get_task_detail(task_id: str):
    """查询单个任务详情"""
    conn = get_db()
    row = conn.execute(
        "SELECT * FROM tasks WHERE task_id = ?",
        (task_id,)
    ).fetchone()

    if not row:
        return {"error": "Task not found"}

    return {"task": dict(row)}
```

#### GET /api/tasks/{player_id}/pending_game

**用途**：查询当前玩家待执行的游戏任务

**请求**：
```http
GET /api/tasks/player_001/pending_game
```

**响应**：
```json
{
  "pending_game": {
    "task_id": "task_decoction_mahuangtang_001",
    "title": "煎制麻黄汤",
    "game_type": "decoction",
    "game_config": "{\"prescriptionId\": \"mahuangtang\"}",
    "reward": "{\"herbs\": [{\"herb_id\": \"mahuang\", \"delta\": 3}]}",
    "status": "pending",
    "created_at": "2026-06-05T10:00:00Z"
  }
}
```

**逻辑**：
```python
@router.get("/tasks/{player_id}/pending_game")
async def get_pending_game_tasks(player_id: str):
    """获取pending游戏任务"""
    conn = get_db()

    rows = conn.execute("""
        SELECT * FROM tasks
        WHERE player_id = ? AND status = 'pending' AND game_type IS NOT NULL
        ORDER BY created_at DESC
        LIMIT 1
    """, (player_id,)).fetchall()

    return {"pending_game": dict(rows[0]) if rows else None}
```

#### POST /api/task/update

**用途**：游戏完成时更新任务状态和评分

**请求**：
```json
{
  "task_id": "task_decoction_mahuangtang_001",
  "progress": 1.0,
  "status": "completed",
  "score": 85.0
}
```

**响应**：
```json
{
  "status": "updated",
  "task_id": "task_decoction_mahuangtang_001",
  "updated_at": "2026-06-05T10:30:00Z"
}
```

**实现逻辑（带并发控制）**：
```python
@router.post("/task/update")
async def update_task(request: UpdateTaskRequest):
    """更新任务进度和状态（带乐观锁）"""
    conn = get_db()
    now = datetime.utcnow().isoformat() + "Z"

    # 先查询当前状态（乐观锁检查）
    current = conn.execute(
        "SELECT status, version FROM tasks WHERE task_id = ?",
        (request.task_id,)
    ).fetchone()

    if not current:
        return {"error": "Task not found"}

    # 状态转换验证
    if current['status'] == 'completed':
        return {"error": "Task already completed"}

    # 更新任务（带版本号）
    conn.execute("""
        UPDATE tasks
        SET progress = ?, status = ?, score = ?, updated_at = ?, version = version + 1
        WHERE task_id = ? AND version = ?
    """, (request.progress, request.status, request.score, now, request.task_id, current['version']))

    conn.commit()

    # 检查更新是否成功（并发冲突检测）
    updated = conn.execute(
        "SELECT version FROM tasks WHERE task_id = ?",
        (request.task_id,)
    ).fetchone()

    if updated['version'] != current['version'] + 1:
        return {"error": "Concurrent update conflict"}

    return {"status": "updated", "task_id": request.task_id, "updated_at": now}
```

### 5.3 背包管理API详细设计

#### GET /api/inventory/{player_id}

**用途**：查询玩家背包（已有，无需扩展）

**响应**：
```json
{
  "player_id": "player_001",
  "herbs": [
    {
      "id": "mahuang",
      "name": "麻黄",
      "raw_count": 5,
      "piece_count": 0
    }
  ]
}
```

#### POST /api/inventory/update

**用途**：更新背包药材数量（发放奖励）

**请求格式（关键：匹配当前API）**：
```json
{
  "player_id": "player_001",
  "updates": [
    {"herb_id": "mahuang", "delta": 3},
    {"herb_id": "guizhi", "delta": 2}
  ]
}
```

**响应**：
```json
{
  "status": "updated",
  "player_id": "player_001",
  "updated_count": 2
}
```

**注意**：reward字段格式必须匹配此API的请求格式！

### 5.4 病案管理API详细设计

#### GET /api/cases/{player_id}

**用途**：查询玩家病案历史

**请求**：
```http
GET /api/cases/player_001
```

**响应**：
```json
{
  "cases": [
    {
      "case_id": "case-001",
      "syndrome": "风寒表实证",
      "score": 85,
      "completed_at": "2026-06-05T10:30:00Z"
    }
  ]
}
```

#### POST /api/cases/update（新增）

**用途**：诊断完成时更新病案历史

**请求**：
```json
{
  "player_id": "player_001",
  "case_id": "case-001",
  "syndrome": "风寒表实证",
  "score": 85,
  "completed_at": "2026-06-05T10:30:00Z"
}
```

**响应**：
```json
{
  "status": "updated",
  "case_id": "case-001"
}
```

**实现逻辑**：
```python
@router.post("/cases/update")
async def update_case_history(request: UpdateCaseRequest):
    """更新病案历史"""
    conn = get_db()

    # 检查是否已存在
    existing = conn.execute(
        "SELECT * FROM case_history WHERE player_id = ? AND case_id = ?",
        (request.player_id, request.case_id)
    ).fetchone()

    if existing:
        # 更新现有记录
        conn.execute("""
            UPDATE case_history
            SET score = ?, completed_at = ?
            WHERE player_id = ? AND case_id = ?
        """, (request.score, request.completed_at, request.player_id, request.case_id))
    else:
        # 创建新记录
        conn.execute("""
            INSERT INTO case_history (player_id, case_id, syndrome, score, completed_at)
            VALUES (?, ?, ?, ?, ?)
        """, (request.player_id, request.case_id, request.syndrome, request.score, request.completed_at))

    conn.commit()

    return {"status": "updated", "case_id": request.case_id}
```

---

## 六、后端表关系设计

### 6.1 核心表结构关系图

```
┌─────────────────┐
│   players       │
│  - player_id    │
└─────────────────┘
       │
       ├──────────────────┬──────────────────┬──────────────────┐
       │                  │                  │                  │
       ↓                  ↓                  ↓                  ↓
┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   tasks      │  │  inventory   │  │case_history  │  │   todos      │
│ - player_id  │  │ - player_id  │  │ - player_id  │  │ - player_id  │
│ - task_id    │  │ - herb_id    │  │ - case_id    │  │ - todo_id    │
│ - game_type  │  │ - raw_count  │  │ - syndrome   │  │ - topic      │
│ - reward ⚠️  │  │ - piece_count│  │ - score      │  │ - mastery    │
│ - score      │  └──────────────┘  └──────────────┘  └──────────────┘
│ - version    │         ↑                 ↑
└──────────────┘         │                 │
       │                 │                 │
       │  奖励发放        │  诊断任务记录     │
       └─────────────────┘─────────────────┘

⚠️ reward字段存储JSON，与inventory表的herb_id关联
```

### 6.2 tasks表关系详解

#### tasks ↔ inventory（奖励发放）

**关系类型**：间接关联（通过reward字段）

**数据流**：
```
tasks表存储奖励配置：
  reward = '{"herbs": [{"herb_id": "mahuang", "delta": 3}]}'

↓ 游戏完成时

POST /api/inventory/update
  updates = [{"herb_id": "mahuang", "delta": 3}]

↓ 数据库更新

inventory表：
  mahuang.raw_count += 3
```

**关联机制**：
- tasks.reward → JSON解析 → 提取herb_id → 更新inventory.herb_id记录

**查询一致性**：
```python
# NPC查询背包时，检查是否有任务奖励未发放
def get_inventory_with_pending_rewards(player_id):
    inventory = get_inventory(player_id)
    pending_tasks = get_pending_game_tasks(player_id)

    # 返回背包 + 待发放奖励提示
    return {
        "inventory": inventory,
        "pending_rewards": [
            {"task_id": t.task_id, "reward": t.reward}
            for t in pending_tasks
        ]
    }
```

#### tasks ↔ case_history（诊断任务记录）

**关系类型**：直接关联（通过case_id）

**数据流**：
```
tasks表：
  game_type = 'diagnosis'
  game_config = '{"case_id": "case-001"}'

↓ 诊断完成时

POST /api/task/update（更新任务状态）
POST /api/cases/update（更新病案历史）
  case_id = JSON.parse(game_config).case_id
  score = 任务评分
```

**关联机制**：
- tasks.game_config → JSON解析 → 提取case_id → 创建case_history记录

**一致性保证**：
```python
# 诊断完成时，同时更新任务和病案历史（事务）
def complete_diagnosis_task(player_id, task_id, case_id, score):
    conn = get_db()
    conn.execute("BEGIN TRANSACTION")

    # 更新任务状态
    conn.execute("""
        UPDATE tasks SET status='completed', score=? WHERE task_id=?
    """, (score, task_id))

    # 更新病案历史
    conn.execute("""
        INSERT OR REPLACE INTO case_history
        (player_id, case_id, score, completed_at)
        VALUES (?, ?, ?, ?)
    """, (player_id, case_id, score, datetime.utcnow()))

    conn.execute("COMMIT")
```

#### tasks ↔ todos（知识点关联）

**关系类型**：间接关联（通过任务类型）

**数据流**：
```
tasks表：
  type = 'prescription'（方剂学习）
  title = '学习麻黄汤'

↓ 任务完成时

todos表更新：
  topic = '麻黄汤组成'
  mastery += 0.2（任务完成提升掌握度）
```

**关联机制**：
- 任务完成 → 触发知识点掌握度更新

### 6.3 表扩展字段汇总

#### tasks表完整结构（扩展后）

```sql
CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id TEXT NOT NULL,
    task_id TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    type TEXT NOT NULL,          -- 'prescription', 'syndrome', 'game_task'
    status TEXT NOT NULL,        -- 'pending', 'in_progress', 'completed'
    progress REAL DEFAULT 0.0,
    blocked_by TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,

    -- 新增字段
    game_type TEXT,              -- 'decoction', 'diagnosis', 'processing'
    game_config TEXT,            -- JSON: {prescriptionId, case_id, recipeId}
    score REAL DEFAULT 0.0,      -- 游戏评分（0-100）
    reward TEXT,                 -- JSON: {herbs: [{herb_id, delta}], experience}
    version INTEGER DEFAULT 0    -- 乐观锁版本号（并发控制）
);
```

#### inventory表（无需扩展，已有）

```sql
CREATE TABLE IF NOT EXISTS inventory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id TEXT NOT NULL,
    herb_id TEXT NOT NULL,
    raw_count REAL DEFAULT 0.0,
    piece_count REAL DEFAULT 0.0,
    UNIQUE(player_id, herb_id)
);
```

#### case_history表（需要创建）

```sql
CREATE TABLE IF NOT EXISTS case_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id TEXT NOT NULL,
    case_id TEXT NOT NULL,
    syndrome TEXT NOT NULL,
    score REAL DEFAULT 0.0,
    completed_at TEXT NOT NULL,
    UNIQUE(player_id, case_id)
);
```

---

## 七、模块间数据通信架构

### 7.1 模块通信全景图

```
┌────────────────────────────────────────────────────────────┐
│                    Hermes Backend (NPC Agent)              │
│  ┌──────────────────────────────────────────────────────┐│
│  │ MCP工具层                                             ││
│  │ - create_task(game_task) → POST /api/task/create     ││
│  │ - get_learning_progress → GET /api/tasks/{player_id} ││
│  │ - get_inventory → GET /api/inventory/{player_id}     ││
│  │ - get_case_progress → GET /api/cases/{player_id}     ││
│  └──────────────────────────────────────────────────────┘│
└────────────────────────────────────────────────────────────┘
                        ↓ HTTP API调用
┌────────────────────────────────────────────────────────────┐
│               game-state-backend (FastAPI + SQLite)        │
│  ┌──────────────────────────────────────────────────────┐│
│  │ 数据层                                                ││
│  │ - tasks表（任务状态、奖励配置）                         ││
│  │ - inventory表（背包药材）                              ││
│  │ - case_history表（病案历史）                           ││
│  └──────────────────────────────────────────────────────┘│
│  ┌──────────────────────────────────────────────────────┐│
│  │ API层                                                 ││
│  │ - POST /api/task/create                              ││
│  │ - GET /api/task/{task_id}                            ││
│  │ - GET /api/tasks/{player_id}/pending_game            ││
│  │ - POST /api/task/update                              ││
│  │ - GET /api/inventory/{player_id}                     ││
│  │ - POST /api/inventory/update                         ││
│  │ - GET /api/cases/{player_id}                         ││
│  │ - POST /api/cases/update                             ││
│  └──────────────────────────────────────────────────────┘│
└────────────────────────────────────────────────────────────┘
                        ↓ 前端查询/更新
┌────────────────────────────────────────────────────────────┐
│                    游戏前端 (Phaser 3 + React)              │
│  ┌──────────────────────────────────────────────────────┐│
│  │ 状态管理层                                            ││
│  │ - GameStateManager（player_id管理，解决硬编码问题）     ││
│  │ - GameStateBridge（数据缓存，减少API调用）             ││
│  └──────────────────────────────────────────────────────┘│
│  ┌──────────────────────────────────────────────────────┐│
│  │ 场景层                                                ││
│  │ - ClinicScene                                         ││
│  │   └─ GET /api/tasks/{player_id}/pending_game          ││
│  │   └─ POST /api/task/update (status='in_progress')    ││
│  │ - DecoctionScene                                      ││
│  │   └ init(taskId, prescriptionId)                     ││
│  │   └ POST /api/task/update (status='completed', score)││
│  │   └ POST /api/inventory/update (发放奖励)             ││
│  │ - DiagnosisScene                                      ││
│  │   └ init(taskId, caseId)                             ││
│  │   └ POST /api/task/update                            ││
│  │   └ POST /api/cases/update                           ││
│  └──────────────────────────────────────────────────────┘│
└────────────────────────────────────────────────────────────┘
```

### 7.2 关键通信路径详解

#### 路径1：NPC创建任务 → ClinicScene查询

**时序图**：
```
时间轴：
T0  NPC对话结束
    └ Hermes Backend调用create_task(game_task)
    └ POST http://localhost:8643/api/task/create
    └ game-state-backend写入tasks表（status='pending')

T1  ClinicScene初始化（玩家进入诊所）
    └ GET http://localhost:8643/api/tasks/{player_id}/pending_game
    └ game-state-backend返回pending游戏任务
    └ ClinicScene缓存任务配置

T2  玩家按D键启动煎药
    └ ClinicScene调用startDecoction(config)
     POST http://localhost:8643/api/task/update (status='in_progress')
    └ Phaser场景切换：launch(SCENES.DECOCTION, config)
```

**数据包格式**：
```typescript
// ClinicScene → game-state-backend（查询）
GET /api/tasks/player_001/pending_game

// game-state-backend → ClinicScene（响应）
{
  "pending_game": {
    "task_id": "task_dec_mahuangtang_001",
    "game_type": "decoction",
    "game_config": "{\"prescriptionId\": \"mahuangtang\"}",
    "reward": "{\"herbs\": [{\"herb_id\": \"mahuang\", \"delta\": 3}]}"
  }
}

// ClinicScene → DecoctionScene（场景切换）
{
  "prescriptionId": "mahuangtang",
  "taskId": "task_dec_mahuangtang_001",
  "reward": [{"herb_id": "mahuang", "delta": 3}]
}
```

#### 路径2：游戏完成 → 数据更新（事务）

**时序图**：
```
时间轴：
T0  煎药游戏完成，评分85分
    └ DecoctionScene.handleGameComplete()

T1  更新任务状态
    └ POST http://localhost:8643/api/task/update
     body: {task_id, progress: 1.0, status: 'completed', score: 85}
    └ game-state-backend更新tasks表

T2  发放奖励
    ┌ 方式A：查询任务奖励配置（推荐）
    │   GET http://localhost:8643/api/task/{task_id}
    │   解析reward字段 → {herbs: [{herb_id, delta}]}
    │  └ POST http://localhost:8643/api/inventory/update
    │   body: {player_id, updates: reward.herbs}
    │
    └ 方式B：从场景参数获取（简化）
    │   reward从init参数获取
    │  \ POST http://localhost:8643/api/inventory/update

T3  数据更新完成
    └ game-state-backend:
    └ tasks表：status='completed', score=85
    └ inventory表：mahuang.raw_count += 3
```

**并发处理（乐观锁）**：
```python
# game-state-backend API层
def update_task_with_lock(task_id, progress, status, score):
    conn = get_db()
    conn.execute("BEGIN TRANSACTION")

    # 查询当前版本
    current = conn.execute(
        "SELECT status, version FROM tasks WHERE task_id=?",
        (task_id,)
    ).fetchone()

    # 状态验证
    if current['status'] == 'completed':
        raise Exception("Task already completed")

    # 更新（带版本检查）
    updated = conn.execute("""
        UPDATE tasks
        SET progress=?, status=?, score=?, version=version+1
        WHERE task_id=? AND version=?
    """, (progress, status, score, task_id, current['version']))

    if updated.rowcount == 0:
        raise Exception("Concurrent update conflict")

    conn.execute("COMMIT")
```

#### 路径3：NPC感知变化 → 点评

**时序图**：
```
时间轴：
T0  下次NPC对话开始
     Hermes Backend调用get_learning_progress
     GET http://localhost:8643/api/tasks/{player_id}
     返回已完成任务（task_id='task_dec_mahuangtang_001', score=85）

T1  NPC查询背包变化
     Hermes Backend调用get_inventory
    \ GET http://localhost:8643/api/inventory/{player_id}
    \ 返回新背包数据（mahuang.raw_count=8，原5+3）

T2  NPC生成点评
    \ NPC Agent基于数据生成对话：
    \ "你煎制麻黄汤得分85分，表现不错！"
    \ "背包里多了3份麻黄，可以继续学习其他方剂。"
```

### 7.3 GameStateManager设计（解决硬编码player_id）

**问题**：当前代码硬编码`player_id='player_001'`

**解决方案**：GameStateManager统一管理

```typescript
// src/systems/GameStateManager.ts（新增）

export class GameStateManager {
  private static instance: GameStateManager;
  private playerId: string;

  private constructor() {
    // 从本地存储或登录系统获取player_id
    this.playerId = localStorage.getItem('player_id') || 'player_001';
  }

  static getInstance(): GameStateManager {
    if (!GameStateManager.instance) {
      GameStateManager.instance = new GameStateManager();
    }
    return GameStateManager.instance;
  }

  getPlayerId(): string {
    return this.playerId;
  }

  setPlayerId(id: string): void {
    this.playerId = id;
    localStorage.setItem('player_id', id);
  }

  // 统一API调用方法
  async fetchAPI(endpoint: string, options?: RequestInit): Promise<any> {
    const url = `http://localhost:8643${endpoint}`;
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
        'X-Player-ID': this.playerId  // 统一添加player_id到请求头
      }
    };

    return fetch(url, { ...defaultOptions, ...options });
  }
}

// 使用示例（替代硬编码）
// ❌ 错误：硬编码
fetch('http://localhost:8643/api/tasks/player_001/pending_game')

// ✅ 正确：使用GameStateManager
const gameState = GameStateManager.getInstance();
gameState.fetchAPI(`/api/tasks/${gameState.getPlayerId()}/pending_game`)
```

### 7.4 GameStateBridge缓存设计（减少API调用）

**当前问题**：每次查询都调用API，浪费资源

**优化方案**：缓存机制

```typescript
// src/bridge/GameStateBridge.ts（扩展）

export class GameStateBridge {
  private inventoryCache: Map<string, InventoryData> = new Map();
  private taskCache: Map<string, TaskData> = new Map();
  private cacheExpiry: number = 30000; // 30秒缓存

  async getInventory(playerId: string): Promise<InventoryData> {
    const cached = this.inventoryCache.get(playerId);
    const now = Date.now();

    if (cached && cached.timestamp && now - cached.timestamp < this.cacheExpiry) {
      return cached.data;
    }

    // 缓存过期，重新获取
    const data = await gameState.fetchAPI(`/api/inventory/${playerId}`);
    this.inventoryCache.set(playerId, { data, timestamp: now });

    return data;
  }

  // 任务完成后刷新缓存
  invalidateCache(playerId: string): void {
    this.inventoryCache.delete(playerId);
    this.taskCache.delete(playerId);
  }

  // EventBus监听任务完成事件
  setupEventListeners(): void {
    EventBus.on('TASK_COMPLETED', (event) => {
      this.invalidateCache(event.playerId);
    });
  }
}
```

---

## 八、Hermes Backend工具扩展

### 6.1 create_task工具扩展

**当前Schema**：
```python
CREATE_TASK_SCHEMA = {
    "name": "create_task",
    "description": "为玩家创建新的学习任务",
    "parameters": {
        "type": "object",
        "properties": {
            "player_id": {"type": "string"},
            "task_id": {"type": "string"},
            "title": {"type": "string"},
            "type": {
                "type": "string",
                "enum": ["prescription", "syndrome"]
            },
            "blocked_by": {"type": "string"}
        },
        "required": ["player_id", "task_id", "title", "type"]
    }
}
```

**扩展Schema**：
```python
CREATE_TASK_SCHEMA = {
    "name": "create_task",
    "description": (
        "为玩家创建新的学习任务（包括游戏任务）。"
        "【调用时机】当师傅准备让弟子实践时调用，例如："
        "1. 讲完麻黄汤组成后，创建煎药任务"
        "2. 讲完风寒表实证后，创建辨证任务"
        "3. 需要弟子炮制当归时，创建炮制任务"
    ),
    "parameters": {
        "type": "object",
        "properties": {
            "player_id": {"type": "string", "description": "玩家唯一标识"},
            "task_id": {"type": "string", "description": "任务唯一标识"},
            "title": {"type": "string", "description": "任务标题"},
            "type": {
                "type": "string",
                "enum": ["prescription", "syndrome", "game_task"],
                "description": "任务类型：'prescription'方剂学习，'syndrome'证型学习，'game_task'游戏任务"
            },
            "game_type": {
                "type": "string",
                "enum": ["decoction", "diagnosis", "processing"],
                "description": "游戏类型（仅game_task需要）：'decoction'煎药，'diagnosis'辨证，'processing'炮制"
            },
            "game_config": {
                "type": "object",
                "description": "游戏配置（仅game_task需要）",
                "properties": {
                    "prescriptionId": {"type": "string", "description": "方剂ID（煎药任务）"},
                    "case_id": {"type": "string", "description": "病案ID（辨证任务）"},
                    "recipeId": {"type": "string", "description": "炮制配方ID（炮制任务）"}
                }
            },
            "reward": {
                "type": "object",
                "description": "任务奖励",
                "properties": {
                    "herbs": {
                        "type": "array",
                        "description": "药材奖励",
                        "items": {
                            "type": "object",
                            "properties": {
                                "herb_id": {"type": "string"},
                                "delta": {"type": "number"}
                            }
                        }
                    },
                    "experience": {"type": "number", "description": "经验值奖励"}
                }
            },
            "blocked_by": {"type": "string", "description": "依赖的任务ID"}
        },
        "required": ["player_id", "task_id", "title", "type"]
    }
}
```

### 6.2 废弃trigger_minigame工具

**原因**：trigger_minigame工具功能已整合到create_task(game_task类型)

**废弃方案**：
```python
# 保留trigger_minigame工具定义，但更新description说明已废弃
TRIGGER_MINIGAME_SCHEMA = {
    "name": "trigger_minigame",
    "description": (
        "⚠️ 已废弃：请使用create_task工具的game_task类型替代。"
        "此工具仅保留用于向后兼容。"
    ),
    ...
}
```

---

## 九、并发处理与事务保证

### 9.1 并发场景分析

**潜在冲突场景**：

| 场景 | 冲突类型 | 影响 |
|------|----------|------|
| 同一任务多次完成 | 状态冲突 | 任务状态不一致，重复奖励发放 |
| 多个NPC同时创建任务 | ID冲突 | task_id UNIQUE约束失败 |
| 游戏完成+NPC查询并发 | 读脏数据 | NPC查询到未完成的任务 |
| 奖励发放+背包查询并发 | 读脏数据 | NPC查询到旧背包数据 |

### 9.2 tasks表并发控制

**方案：乐观锁（version字段）**

```sql
-- tasks表增加version字段
ALTER TABLE tasks ADD COLUMN version INTEGER DEFAULT 0;

-- 更新时检查版本
UPDATE tasks
SET status='completed', score=85, version=version+1
WHERE task_id='task_xxx' AND version=0;

-- 如果更新失败（rowcount=0），说明版本不匹配，存在并发冲突
```

**API层实现**：
```python
@router.post("/task/update")
async def update_task(request: UpdateTaskRequest):
    conn = get_db()

    # 事务开始
    conn.execute("BEGIN TRANSACTION")

    # 查询当前版本
    current = conn.execute(
        "SELECT status, version FROM tasks WHERE task_id = ?",
        (request.task_id,)
    ).fetchone()

    if not current:
        conn.execute("ROLLBACK")
        return {"error": "Task not found"}

    # 状态验证
    if current['status'] == 'completed':
        conn.execute("ROLLBACK")
        return {"error": "Task already completed"}

    # 乐观锁更新
    updated = conn.execute("""
        UPDATE tasks
        SET progress = ?, status = ?, score = ?, updated_at = ?, version = version + 1
        WHERE task_id = ? AND version = ?
    """, (request.progress, request.status, request.score, now, request.task_id, current['version']))

    # 检查是否成功
    if updated.rowcount == 0:
        conn.execute("ROLLBACK")
        return {"error": "Concurrent update conflict - please retry"}

    conn.execute("COMMIT")

    return {"status": "updated", "task_id": request.task_id}
```

### 9.3 奖励发放事务保证

**问题**：任务完成和奖励发放是两个独立API调用，存在中间失败风险

**方案：联合事务**

```python
@router.post("/task/complete_with_reward")
async def complete_task_with_reward(request: CompleteTaskRequest):
    """任务完成+奖励发放联合事务（原子性保证）"""

    conn = get_db()
    conn.execute("BEGIN TRANSACTION")

    try:
        # 1. 查询任务详情（包含奖励配置）
        task = conn.execute(
            "SELECT * FROM tasks WHERE task_id = ?",
            (request.task_id,)
        ).fetchone()

        if not task or task['status'] == 'completed':
            raise Exception("Invalid task state")

        # 2. 更新任务状态
        conn.execute("""
            UPDATE tasks
            SET status='completed', score=?, progress=1.0, version=version+1
            WHERE task_id=? AND version=?
        """, (request.score, request.task_id, task['version']))

        # 3. 解析奖励配置
        reward = json.loads(task['reward']) if task['reward'] else None

        # 4. 发放奖励（原子性）
        if reward and reward.get('herbs'):
            for herb in reward['herbs']:
                conn.execute("""
                    UPDATE inventory
                    SET raw_count = raw_count + ?
                    WHERE player_id = ? AND herb_id = ?
                """, (herb['delta'], task['player_id'], herb['herb_id']))

        # 5. 提交事务
        conn.execute("COMMIT")

        return {
            "status": "completed",
            "task_id": request.task_id,
            "reward_granted": reward
        }

    except Exception as e:
        conn.execute("ROLLBACK")
        return {"error": str(e)}
```

**前端调用方式**：
```typescript
// 方式A：联合API（推荐，原子性保证）
await fetch('http://localhost:8643/api/task/complete_with_reward', {
  method: 'POST',
  body: JSON.stringify({task_id, score: 85})
});

// 方式B：分步调用（需要重试机制）
try {
  await updateTask(task_id, score);
  await grantReward(task_id);
} catch (e) {
  // 重试逻辑...
}
```

### 9.4 脏数据读取处理

**问题**：NPC查询时可能读到未提交的数据

**方案：隔离级别 + 缓存刷新**

```python
# game-state-backend启动时设置隔离级别
conn = sqlite3.connect('game_state.db')
conn.execute("PRAGMA read_uncommitted = OFF")  # 禁止脏读
```

**前端缓存刷新机制**：
```typescript
// EventBus触发刷新
EventBus.on('TASK_COMPLETED', (event) => {
  GameStateBridge.getInstance().invalidateCache(event.playerId);
});

// NPC心跳刷新（NPCHeartbeat.ts已有）
setInterval(() => {
  GameStateBridge.getInstance().refreshCache();
}, 30000);
```

---

## 十、奖励发放机制详解

### 10.1 reward字段格式设计（关键）

**格式定义**：
```json
{
  "herbs": [
    {"herb_id": "mahuang", "delta": 3},
    {"herb_id": "guizhi", "delta": 2}
  ],
  "experience": 10
}
```

**关键约束**：
- ✅ `herb_id` 必须匹配 inventory表的herb_id字段
- ✅ `delta` 正数表示增加，负数表示消耗
- ✅ 格式必须匹配 POST /api/inventory/update 的请求格式

**NPC创建任务时的reward生成逻辑**：
```python
# Hermes Backend: create_task工具
def create_game_task(prescription_id):
    # 查询方剂组成
    prescription = get_prescription(prescription_id)

    # 生成奖励：煎药成功获得方剂中的药材
    reward = {
        "herbs": [
            {"herb_id": herb.id, "delta": 3}
            for herb in prescription.herbs[:2]  # 前两种药材，各+3
        ],
        "experience": 10
    }

    return reward
```

### 10.2 前端奖励发放实现

**方式A：从任务查询获取奖励（推荐）**
```typescript
// DecoctionScene.ts
private async grantRewardFromTask(): Promise<void> {
  // 1. 查询任务详情
  const taskResponse = await fetch(
    `http://localhost:8643/api/task/${this.taskId}`
  );
  const task = taskResponse.json().task;

  // 2. 解析奖励
  const reward = JSON.parse(task.reward || '{}');

  // 3. 发放奖励
  if (reward.herbs && reward.herbs.length > 0) {
    await fetch('http://localhost:8643/api/inventory/update', {
      method: 'POST',
      body: JSON.stringify({
        player_id: GameStateManager.getInstance().getPlayerId(),
        updates: reward.herbs  // ⚠️ 格式匹配API
      })
    });

    // 4. 触发缓存刷新
    EventBus.emit('INVENTORY_UPDATED', {playerId: this.playerId});
  }
}
```

**方式B：从场景参数获取奖励（简化）**
```typescript
// ClinicScene.ts启动游戏时传递奖励
scene.launch(SCENES.DECOCTION, {
  prescriptionId: config.prescriptionId,
  taskId: task.task_id,
  reward: JSON.parse(task.reward)  // 传递奖励对象
});

// DecoctionScene.ts接收并发放
init(data: DecoctionSceneConfig): void {
  this.reward = data.reward;
}

onComplete(): void {
  if (this.reward && this.reward.herbs) {
    // 直接发放奖励
    this.grantReward(this.reward.herbs);
  }
}
```

### 10.3 奖励发放失败处理

**失败场景**：
1. API调用失败（网络错误）
2. herb_id不存在（数据库错误）
3. 事务冲突（并发错误）

**重试机制**：
```typescript
async function grantRewardWithRetry(herbs: HerbReward[], maxRetries = 3): Promise<void> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch('http://localhost:8643/api/inventory/update', {
        method: 'POST',
        body: JSON.stringify({
          player_id: GameStateManager.getInstance().getPlayerId(),
          updates: herbs
        })
      });

      if (response.ok) {
        EventBus.emit('INVENTORY_UPDATED');
        return;  // 成功
      }

      throw new Error(`API failed: ${response.status}`);
    } catch (error) {
      console.warn(`Reward grant attempt ${attempt} failed:`, error);

      if (attempt === maxRetries) {
        // 最终失败，记录到本地存储，下次恢复
        localStorage.setItem('pending_reward', JSON.stringify(herbs));
        console.error('Reward grant failed after all retries');
      }

      await sleep(1000 * attempt);  // 延迟重试
    }
  }
}
```

---

## 十一、前端实现设计

### 11.1 ClinicScene查询pending任务

**新增方法**：
```typescript
// src/scenes/ClinicScene.ts

/**
 * 查询当前pending游戏任务（使用GameStateManager）
 */
private async getPendingGameTask(): Promise<GameTaskConfig | null> {
  try {
    const gameState = GameStateManager.getInstance();
    const response = await gameState.fetchAPI(
      `/api/tasks/${gameState.getPlayerId()}/pending_game`
    );
    const data = await response.json();
    return data.pending_game || null;
  } catch (error) {
    console.error('[ClinicScene] Failed to fetch pending game task:', error);
    return null;
  }
}

/**
 * 启动煎药游戏（读取任务配置）
 */
private async startDecoction(): void {
  if (this.isTransitioning) return;

  // 查询pending任务
  const pendingTask = await this.getPendingGameTask();
  const config = pendingTask?.game_type === 'decoction'
    ? JSON.parse(pendingTask.game_config)
    : {};

  this.scene.launch(SCENES.DECOCTION, {
    prescriptionId: config.prescriptionId,
    taskId: pendingTask?.task_id,
    reward: JSON.parse(pendingTask?.reward || '{}')  // 传递奖励
  });

  // 更新任务状态为in_progress
  if (pendingTask) {
    await this.updateTaskStatus(pendingTask.task_id, 'in_progress');
  }
}

/**
 * 更新任务状态
 */
private async updateTaskStatus(taskId: string, status: string): void {
  const gameState = GameStateManager.getInstance();
  await gameState.fetchAPI('/api/task/update', {
    method: 'POST',
    body: JSON.stringify({task_id: taskId, status: status})
  });
}
```

### 11.2 游戏场景完成时更新任务

**DecoctionScene.ts**：
```typescript
// src/scenes/DecoctionScene.ts

export interface DecoctionSceneConfig {
  prescriptionId?: string;
  taskId?: string;
  reward?: RewardConfig;  // 新增：奖励配置
}

export class DecoctionScene extends Phaser.Scene {
  private taskId: string | null = null;
  private reward: RewardConfig | null = null;

  init(data: DecoctionSceneConfig): void {
    this.prescriptionId = data.prescriptionId || null;
    this.taskId = data.taskId || null;
    this.reward = data.reward || null;  // 接收奖励
  }

  private async handleGameComplete(result: ScoreResultData): Promise<void> {
    const gameState = GameStateManager.getInstance();

    // ✅ 方式A：联合API（推荐）
    await gameState.fetchAPI('/api/task/complete_with_reward', {
      method: 'POST',
      body: JSON.stringify({
        task_id: this.taskId,
        score: result.totalScore
      })
    });

    // ✅ 方式B：分步调用（备用）
    // await this.updateTask(this.taskId, result.totalScore);
    // await this.grantReward();

    // 触发缓存刷新
    EventBus.emit('INVENTORY_UPDATED', {
      playerId: gameState.getPlayerId()
    });
  }

  private async updateTask(taskId: string, score: number): Promise<void> {
    const gameState = GameStateManager.getInstance();
    await gameState.fetchAPI('/api/task/update', {
      method: 'POST',
      body: JSON.stringify({
        task_id: taskId,
        progress: 1.0,
        status: 'completed',
        score: score
      })
    });
  }

  private async grantReward(): Promise<void> {
    if (!this.reward || !this.reward.herbs) return;

    const gameState = GameStateManager.getInstance();
    await gameState.fetchAPI('/api/inventory/update', {
      method: 'POST',
      body: JSON.stringify({
        player_id: gameState.getPlayerId(),
        updates: this.reward.herbs
      })
    });
  }
}
```

**DiagnosisScene.ts**：
```typescript
// src/scenes/DiagnosisScene.ts

export interface DiagnosisSceneConfig {
  caseId?: string;
  taskId?: string;
}

export async handleDiagnosisComplete(result: DiagnosisResult): Promise<void> {
  const gameState = GameStateManager.getInstance();
  const score = calculateDiagnosisScore(result, this.caseData);

  // ✅ 更新任务状态
  if (this.taskId) {
    await gameState.fetchAPI('/api/task/update', {
      method: 'POST',
      body: JSON.stringify({
        task_id: this.taskId,
        progress: 1.0,
        status: 'completed',
        score: score.totalScore
      })
    });
  }

  // ✅ 更新病案历史
  await gameState.fetchAPI('/api/cases/update', {
    method: 'POST',
    body: JSON.stringify({
      player_id: gameState.getPlayerId(),
      case_id: this.caseId,
      syndrome: this.caseData.syndrome,
      score: score.totalScore,
      completed_at: new Date().toISOString()
    })
  });

  // ✅ 触发NPC反馈
  triggerNPCFeedback({...});
}
```

---

## 十二、数据流动完整验证

### 8.1 正向流程验证：NPC创建任务

**测试场景**：
```
NPC对话: "麻黄汤由麻黄、桂枝、杏仁、甘草组成，我们来煎一剂"
    ↓
调用: create_task(
    type: "game_task",
    game_type: "decoction",
    game_config: {prescriptionId: "mahuangtang"},
    reward: {herbs: [{herb_id: "mahuang", delta: 3}]}
)
    ↓
验证点:
1. ✅ game-state-backend tasks表有新记录
2. ✅ status = 'pending'
3. ✅ game_type = 'decoction'
4. ✅ game_config JSON正确
```

### 8.2 中间流程验证：玩家触发游戏

**测试场景**：
```
ClinicScene启动
    ↓
查询: GET /api/tasks/player_001/pending_game
    ↓
验证点:
1. ✅ 返回pending游戏任务
2. ✅ game_config包含prescriptionId
    ↓
玩家按D键 → startDecoction(config)
    ↓
验证点:
1. ✅ DecoctionScene.init接收prescriptionId
2. ✅ 游戏UI显示麻黄汤方剂
3. ✅ POST /api/task/update (status='in_progress')
```

### 8.3 反向流程验证：游戏完成更新

**测试场景**：
```
玩家完成煎药游戏，评分85分
    ↓
POST /api/task/update
{
    task_id: "task_dec_mahuangtang_001",
    progress: 1.0,
    status: "completed",
    score: 85
}
    ↓
验证点:
1. ✅ tasks表status更新为'completed'
2. ✅ score字段为85
3. ✅ updated_at时间戳更新
    ↓
POST /api/inventory/update
{
    player_id: "player_001",
    updates: [{herb_id: "mahuang", delta: 3}]
}
    ↓
验证点:
1. ✅ inventory表麻黄raw_count增加3
    ↓
下次NPC对话查询
    ↓
验证点:
1. ✅ get_learning_progress返回已完成任务
2. ✅ get_inventory返回新背包数据（麻黄+3）
```

---

## 十三、测试用例设计（完整）

### 13.1 E2E测试：任务创建→游戏→更新

**测试文件**：`tests/e2e/task-driven-game-flow.spec.ts`

**基础测试场景**：
```typescript
test('NPC创建煎药任务→玩家完成→数据更新', async ({ page }) => {
  // 1. NPC对话创建任务
  await page.goto('http://localhost:3000');
  await triggerNPCDialog(page);
  await sendNPCMessage(page, "我们来煎麻黄汤");

  // 验证任务创建
  const taskResponse = await page.evaluate(() =>
    GameStateManager.getInstance().fetchAPI('/api/tasks/player_001/pending_game')
      .then(res => res.json())
  );
  expect(taskResponse.pending_game.game_type).toBe('decoction');

  // 2. 玩家触发游戏
  await page.keyboard.press('KeyD');
  await page.waitForSelector('#decoction-react-root');

  // 验证游戏启动带配置
  const prescriptionId = await page.evaluate(() =>
    window.__DECOCTION_SCENE__.prescriptionId
  );
  expect(prescriptionId).toBe('mahuangtang');

  // 3. 完成游戏
  await completeDecoctionGame(page, {score: 85});

  // 验证任务状态更新
  const updatedTask = await page.evaluate(() =>
    GameStateManager.getInstance().fetchAPI('/api/tasks/player_001')
      .then(res => res.json())
      .then(data => data.tasks.find(t => t.task_id.includes('mahuangtang')))
  );
  expect(updatedTask.status).toBe('completed');
  expect(updatedTask.score).toBe(85);

  // 验证背包更新
  const inventory = await page.evaluate(() =>
    GameStateManager.getInstance().fetchAPI('/api/inventory/player_001')
      .then(res => res.json())
      .then(data => data.herbs.find(h => h.id === 'mahuang'))
  );
  expect(inventory.raw_count).toBeGreaterThan(initialCount);
});
```

### 13.2 并发测试：乐观锁验证

**测试场景1：同一任务并发完成**
```typescript
test('并发完成同一任务→乐观锁生效', async ({ page, context }) => {
  // 创建任务
  await createGameTask(page, 'decoction', 'mahuangtang');

  // 启动两个并发请求（模拟网络延迟）
  const response1 = page.evaluate(async () => {
    const gameState = GameStateManager.getInstance();
    return gameState.fetchAPI('/api/task/update', {
      method: 'POST',
      body: JSON.stringify({
        task_id: 'task_dec_mahuangtang_001',
        status: 'completed',
        score: 85
      })
    });
  });

  const response2 = page.evaluate(async () => {
    await sleep(100);  // 稍微延迟
    const gameState = GameStateManager.getInstance();
    return gameState.fetchAPI('/api/task/update', {
      method: 'POST',
      body: JSON.stringify({
        task_id: 'task_dec_mahuangtang_001',
        status: 'completed',
        score: 90
      })
    });
  });

  const [res1, res2] = await Promise.all([response1, response2]);

  // 验证：第一个成功，第二个失败
  expect(res1.status).toBe('updated');
  expect(res2.error).toContain('Concurrent update conflict');

  // 验证最终状态（第一个请求的结果）
  const task = await getTaskDetail(page, 'task_dec_mahuangtang_001');
  expect(task.score).toBe(85);  // 不是90
});
```

**测试场景2：奖励发放并发**
```typescript
test('并发发放奖励→原子性保证', async ({ page }) => {
  // 创建两个相同奖励的任务
  await createGameTask(page, 'decoction', 'mahuangtang', {
    reward: {herbs: [{herb_id: 'mahuang', delta: 3}]}
  });
  await createGameTask(page, 'decoction', 'mahuangtang', {
    reward: {herbs: [{herb_id: 'mahuang', delta: 3}]}
  });

  // 获取初始背包
  const initialInventory = await getInventory(page, 'player_001');
  const initialMahuang = initialInventory.herbs.find(h => h.id === 'mahuang').raw_count;

  // 并发完成两个任务（使用联合API）
  await Promise.all([
    completeTaskWithReward(page, 'task_dec_001', 85),
    completeTaskWithReward(page, 'task_dec_002', 90)
  ]);

  // 验证背包更新（两次发放都成功）
  const finalInventory = await getInventory(page, 'player_001');
  const finalMahuang = finalInventory.herbs.find(h => h.id === 'mahuang').raw_count;

  expect(finalMahuang).toBe(initialMahuang + 6);  // 两次各+3
});
```

### 13.3 数据一致性测试

**测试场景3：NPC查询一致性**
```typescript
test('任务完成→NPC查询返回新数据', async ({ page }) => {
  // 初始状态
  const initialProgress = await page.evaluate(() =>
    GameStateManager.getInstance().fetchAPI('/api/tasks/player_001')
      .then(res => res.json())
  );
  const pendingTasks = initialProgress.tasks.filter(t => t.status === 'pending');

  // 完成一个任务
  await createAndCompleteTask(page, 'decoction', 'mahuangtang');

  // NPC查询（模拟Hermes Backend）
  const newProgress = await page.evaluate(() =>
    GameStateManager.getInstance().fetchAPI('/api/tasks/player_001')
      .then(res => res.json())
  );

  // 验证状态变化
  const completedTask = newProgress.tasks.find(t => t.status === 'completed');
  expect(completedTask.score).toBeGreaterThanOrEqual(80);

  // 验证pending任务减少
  const newPendingTasks = newProgress.tasks.filter(t => t.status === 'pending');
  expect(newPendingTasks.length).toBe(pendingTasks.length - 1);
});
```

**测试场景4：病案历史更新**
```typescript
test('诊断完成→病案历史更新', async ({ page }) => {
  // 完成诊断任务
  await createGameTask(page, 'diagnosis', 'case-001');
  await startDiagnosis(page, 'case-001');
  await completeDiagnosis(page, 'case-001', {syndrome: '风寒表实证', score: 85});

  // 查询病案历史
  const caseHistory = await page.evaluate(() =>
    GameStateManager.getInstance().fetchAPI('/api/cases/player_001')
      .then(res => res.json())
  );

  // 验证病案记录
  const caseRecord = caseHistory.cases.find(c => c.case_id === 'case-001');
  expect(caseRecord).toBeDefined();
  expect(caseRecord.syndrome).toBe('风寒表实证');
  expect(caseRecord.score).toBe(85);
});
```

### 13.4 边界场景测试

**测试场景5：奖励配置缺失**
```typescript
test('任务无奖励→完成不发放', async ({ page }) => {
  // 创建无奖励任务
  await createGameTask(page, 'decoction', 'mahuangtang', {reward: null});

  const initialInventory = await getInventory(page, 'player_001');
  const initialMahuang = initialInventory.herbs.find(h => h.id === 'mahuang').raw_count;

  // 完成任务
  await completeTask(page, 'task_dec_001', 85);

  // 验证背包不变
  const finalInventory = await getInventory(page, 'player_001');
  const finalMahuang = finalInventory.herbs.find(h => h.id === 'mahuang').raw_count;

  expect(finalMahuang).toBe(initialMahuang);
});
```

**测试场景6：任务重复完成**
```typescript
test('任务已完成→再次完成失败', async ({ page }) => {
  // 完成任务
  await createAndCompleteTask(page, 'decoction', 'mahuangtang');

  // 再次尝试完成
  const response = await page.evaluate(() =>
    GameStateManager.getInstance().fetchAPI('/api/task/update', {
      method: 'POST',
      body: JSON.stringify({
        task_id: 'task_dec_001',
        status: 'completed',
        score: 90
      })
    }).then(res => res.json())
  );

  // 验证失败
  expect(response.error).toContain('Task already completed');

  // 验证数据不变
  const task = await getTaskDetail(page, 'task_dec_001');
  expect(task.score).toBe(85);  // 原分数，不是90
});
```

---

## 十四、实施计划（修订）

### 14.1 阶段划分（修订）

| 阶段 | 任务 | 工作量 | 优先级 |
|------|------|--------|--------|
| **Phase 1** | 任务系统扩展 | 3小时 | P0 |
| **Phase 2** | Hermes工具扩展 | 30分钟 | P0 |
| **Phase 3** | GameStateManager实现 | 1小时 | P0 |
| **Phase 4** | 游戏UI更新 | 2小时 | P0 |
| **Phase 5** | ClinicScene查询 | 30分钟 | P0 |
| **Phase 6** | E2E测试 | 2小时 | P1 |
| **总计** | | **~9小时** | |

### 14.2 详细任务（修订）

**Phase 1: 任务系统扩展**（3小时）
- Task 1.1: ALTER TABLE tasks增加字段（game_type, game_config, score, reward, version）
- Task 1.2: 创建case_history表
- Task 1.3: 新增GET /api/task/{task_id} API
- Task 1.4: 新增GET /api/tasks/{player_id}/pending_game API
- Task 1.5: 新增POST /api/task/update API（带乐观锁）
- Task 1.6: 新增POST /api/task/complete_with_reward API（联合事务）
- Task 1.7: 新增GET /api/cases/{player_id} API
- Task 1.8: 新增POST /api/cases/update API
- Task 1.9: 扩展POST /api/task/create支持新字段

**Phase 2: Hermes工具扩展**（30分钟）
- Task 2.1: 扩展create_task工具schema（新增game_type, game_config, reward字段）
- Task 2.2: 更新create_task_handler（生成奖励配置）
- Task 2.3: 废弃trigger_minigame工具说明

**Phase 3: GameStateManager实现**（1小时）
- Task 3.1: 创建GameStateManager.ts（player_id管理）
- Task 3.2: 统一fetchAPI方法
- Task 3.3: 集成到现有场景（替换硬编码）

**Phase 4: 游戏UI更新**（2小时）
- Task 4.1: DecoctionScene增加taskId参数接收
- Task 4.2: DecoctionScene完成时调用task/complete_with_reward
- Task 4.3: DiagnosisScene增加taskId参数接收
- Task 4.4: DiagnosisScene完成时调用task/update + cases/update

**Phase 5: ClinicScene查询**（30分钟）
- Task 5.1: 新增getPendingGameTask方法（使用GameStateManager）
- Task 5.2: startDecoction/startDiagnosis读取配置
- Task 5.3: 启动游戏时更新任务状态为in_progress

**Phase 6: E2E测试**（2小时）
- Task 6.1: 编写基础流程测试（task-driven-game-flow.spec.ts）
- Task 6.2: 编写并发测试（乐观锁验证）
- Task 6.3: 编写数据一致性测试（NPC查询验证）
- Task 6.4: 编写边界场景测试（无奖励、重复完成）

---

## 十五、风险评估（修订）

### 15.1 技术风险（修订）

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| 数据库ALTER TABLE失败 | 阻塞 | 先在测试环境验证SQL，使用迁移脚本 |
| API并发更新冲突 | 数据不一致 | 乐观锁+事务+重试机制 |
| 前端异步调用失败 | 任务状态错误 | 错误处理+重试+本地存储恢复 |
| reward格式不匹配 | API调用失败 | Schema验证+类型检查 |
| player_id硬编码影响 | 多玩家问题 | GameStateManager统一管理 |

### 15.2 架构风险（修订）

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| 废弃trigger_minigame影响现有流程 | 兼容性 | 保留工具定义，只更新description |
| 游戏场景参数扩展影响测试 | 测试失败 | 逐步扩展，保持向后兼容（可选参数）|
| case_history表新增影响查询 | 性能 | 合理索引+查询优化 |
| 联合API性能问题 | 响应延迟 | 事务优化+异步处理 |

---

## 十六、后续扩展（修订）

### 12.1 Phase 3扩展方向

**任务链系统**：
- 任务依赖关系（blocked_by）
- 任务解锁机制
- 任务进度追踪（todos表关联）

**奖励系统扩展**：
- 经验值奖励
- 成就系统
- 药材奖励多样化

**NPC主动提醒**：
- 检测pending任务时间过长
- 主动对话提醒玩家完成任务

---

## 附录：参考文档

- [Inventory数据统一设计](docs/superpowers/specs/phase2.5/2026-06-02-inventory-data-unification-design.md)
- [NPC自主Agent设计](docs/superpowers/specs/phase3/2026-05-19-npc-autonomous-agent-design.md)
- [game-state-backend架构](docs/superpowers/specs/phase2-5/2026-05-31-game-state-backend-design.md)

---

**文档版本**: v1.0
**作者**: Claude Opus 4.7
**审核状态**: 待用户确认