# 游戏状态后端架构设计

**版本**: v1.0
**日期**: 2026-05-31
**阶段**: Phase 2.5 补充
**状态**: 设计完成，待审核

---

## 1. 设计背景

### 1.1 现状分析

**当前架构问题：**
- ✅ 游戏状态全部在前端 localStorage（易丢失）
- ✅ Hermes Backend 使用 MockGameStore（硬编码测试数据）
- ✅ Hermes WebUI 无法访问真实游戏状态
- ✅ NPC Agent 无法持久化学习进度

**缺失能力：**
- ❌ 学习进度持久化存储
- ❌ 跨 NPC 的状态查询
- ❌ 学习数据分析能力
- ❌ WebUI 测试真实数据

### 1.2 设计目标

**核心目标：**
创建独立游戏状态后端，存储动态学习数据，为 NPC Agent 和测试界面提供真实数据支持。

**关键约束：**
- 单机游戏，无需多端同步
- 保持简单，随用随调整（增量设计）
- 不改变 Hermes Backend 的 AI Agent 职责
- 职责清晰切割（状态管理 vs 教学逻辑）

---

## 2. 架构设计

### 2.1 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                 游戏前端 (Phaser, 端口 3000)                  │
│                                                              │
│  - GameStateBridge (实时状态)                                │
│  - SaveManager (localStorage临时状态)                        │
│  - 病案完成时 → HTTP POST 推送                                │
└─────────────────────────────────────────────────────────────┘
                          │
                          │ HTTP POST 推送学习记录
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              游戏状态后端 (端口 8643)                          │
│                                                              │
│  FastAPI + SQLite                                            │
│  ├─ data/player_progress.db (单文件数据库)                    │
│  ├─ 查询接口 (GET)                                           │
│  │   ├─ /api/tasks/{player_id}                              │
│  │   ├─ /api/cases/{player_id}                              │
│  │   ├─ /api/experience/{player_id}                         │
│  │   └─ /api/weaknesses/{player_id}                         │
│  ├─ 操作接口 (POST)                                          │
│  │   ├─ /api/task/create (NPC调用)                          │
│  │   ├─ /api/todo/update (NPC调用)                          │
│  │   ├─ /api/case/complete (前端推送)                        │
│  │   └─ /api/weakness/record (NPC或前端)                     │
└─────────────────────────────────────────────────────────────┘
                          │
                          │ HTTP GET/POST 查询和操作
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              Hermes Backend (NPC Agent, 端口 8642)            │
│                                                              │
│  ├─ 静态配置                                                 │
│  │   ├─ SOUL.md (NPC身份)                                   │
│  │   ├─ USER.md (玩家观察)                                  │
│  │   ├─ MEMORY.md (教学心得)                                │
│  │   └─ Skills (教学大纲、方法)                              │
│  │                                                          │
│  ├─ 工具调用                                                 │
│  │   ├─ 查询型工具 (GET)                                     │
│  │   │   ├─ get_tasks                                       │
│  │   │   ├─ get_case_history                                │
│  │   │   ├─ get_experience                                  │
│  │   │   └─ get_weaknesses                                  │
│  │   ├─ 操作型工具 (POST)                                    │
│  │   │   ├─ create_task                                     │
│  │   │   ├─ update_todo                                     │
│  │   │   └─ record_weakness                                 │
└─────────────────────────────────────────────────────────────┘
                          │
                          │ 工具调用
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              Hermes WebUI (可选, 端口 8787)                    │
│                                                              │
│  ├─ 测试 NPC 对话逻辑                                        │
│  ├─ 工具调用返回真实数据（通过 Hermes Backend）               │
│  └─ 可选：游戏运行时 → 真实数据                               │
│  └─ 可选：游戏未运行 → Mock 数据                              │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 职责划分

**游戏状态后端职责：**
- ✅ 存储所有动态状态（Tasks, Todos, 病案, 经验值, 薄弱点）
- ✅ 提供查询接口（GET）供 Hermes Backend 工具调用
- ✅ 提供操作接口（POST）供 NPC Agent 或前端调用
- ✅ 数据持久化和查询能力

**Hermes Backend (NPC Agent) 职责：**
- ✅ 维护静态配置（SOUL, Skills）
- ✅ 通过工具查询游戏状态
- ✅ 通过工具操作游戏状态（创建Task, 更新Todo）
- ✅ 不存储动态数据，只做教学决策

**游戏前端职责：**
- ✅ 实时状态管理（GameStateBridge）
- ✅ 临时状态存储（localStorage - 背包、场景位置）
- ✅ 病案完成时推送数据到状态后端

---

## 3. 数据存储设计

### 3.1 SQLite 数据表

**单文件数据库：** `game-state-backend/data/player_progress.db`

**核心数据表（5个）：**

```sql
-- 1. Tasks表（Task定义和状态）
CREATE TABLE tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id TEXT NOT NULL,
    task_id TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    type TEXT NOT NULL,  -- 'prescription', 'syndrome'
    status TEXT NOT NULL,  -- 'pending', 'in_progress', 'completed'
    progress REAL DEFAULT 0.0,
    blocked_by TEXT,  -- 依赖的task_id
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

-- 2. Todos表（Todo mastery）
CREATE TABLE todos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id TEXT NOT NULL,
    todo_id TEXT NOT NULL,
    name TEXT NOT NULL,
    mastery REAL DEFAULT 0.0,  -- 0.0-1.0
    status TEXT NOT NULL,  -- 'pending', 'in_progress', 'completed'
    updated_at TEXT NOT NULL,
    FOREIGN KEY (task_id) REFERENCES tasks(task_id)
);

-- 3. Case_history表（病案记录）
CREATE TABLE case_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id TEXT NOT NULL,
    case_id TEXT NOT NULL,
    title TEXT NOT NULL,
    completed_at TEXT NOT NULL,
    score INTEGER NOT NULL,  -- 0-100
    diagnosis TEXT NOT NULL,  -- 诊断结果
    prescription TEXT NOT NULL,  -- 方剂选择
    errors TEXT  -- JSON数组，记录错误类型
);

-- 4. Experience表（经验值）
CREATE TABLE experience (
    player_id TEXT PRIMARY KEY,
    total_experience INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    prescription_exp INTEGER DEFAULT 0,
    syndrome_exp INTEGER DEFAULT 0,
    diagnosis_exp INTEGER DEFAULT 0,
    updated_at TEXT NOT NULL
);

-- 5. Weakness_log表（薄弱点）
CREATE TABLE weakness_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id TEXT NOT NULL,
    weakness_type TEXT NOT NULL,  -- '组成记忆', '配伍理解'等
    details TEXT NOT NULL,
    task_id TEXT,  -- 关联的Task
    recorded_at TEXT NOT NULL
);

-- 创建索引（查询优化）
CREATE INDEX idx_tasks_player ON tasks(player_id);
CREATE INDEX idx_todos_task ON todos(task_id);
CREATE INDEX idx_cases_player ON case_history(player_id);
CREATE INDEX idx_weakness_player ON weakness_log(player_id);
```

### 3.2 数据范围界定

**存储在状态后端：**
- ✅ Tasks（教学任务状态）
- ✅ Todos（知识点掌握程度）
- ✅ Case_history（病案完成记录）
- ✅ Experience（经验值积累）
- ✅ Weakness_log（薄弱点记录）

**继续存储在前端：**
- ✅ 背包内容（herbs, seeds, tools） - localStorage
- ✅ 场景状态（位置、场景名） - localStorage
- ✅ 界面设置（音量、语言） - localStorage
- ✅ 实时碰撞状态 - GameStateBridge

**继续存储在 Hermes Backend：**
- ✅ NPC记忆（MockUserStore） - Hermes Backend自有

---

## 4. API 接口设计

### 4.1 查询接口（GET）

**接口列表：**

```python
# 1. 查询任务列表（含 Todos）
GET /api/tasks/{player_id}

Response: {
    "tasks": [
        {
            "task_id": "mahuang-tang-learning",
            "title": "麻黄汤学习",
            "type": "prescription",
            "status": "in_progress",
            "progress": 0.65,
            "blocked_by": null,
            "todos": [
                {
                    "todo_id": "composition",
                    "name": "组成",
                    "mastery": 0.8,
                    "status": "completed"
                },
                {
                    "todo_id": "compatibility",
                    "name": "配伍",
                    "mastery": 0.5,
                    "status": "in_progress"
                }
            ]
        }
    ],
    "statistics": {
        "total": 6,
        "completed": 1,
        "in_progress": 1,
        "pending": 4
    }
}

# 2. 查询病案历史
GET /api/cases/{player_id}

Response: {
    "cases": [
        {
            "case_id": "case_001",
            "title": "感冒风寒表实证",
            "completed_at": "2026-05-30T10:00:00Z",
            "score": 88,
            "diagnosis": "风寒表实",
            "prescription": "麻黄汤",
            "errors": ["脉诊判断"]
        }
    ],
    "total": 10,
    "completed": 3
}

# 3. 查询经验值
GET /api/experience/{player_id}

Response: {
    "player_id": "player_001",
    "total_experience": 1500,
    "level": 3,
    "prescription_exp": 500,
    "syndrome_exp": 300,
    "diagnosis_exp": 700
}

# 4. 查询薄弱点（聚合统计）
GET /api/weaknesses/{player_id}

Response: {
    "weaknesses": [
        {
            "type": "配伍理解",
            "details": "混淆麻黄与桂枝配伍意义",
            "count": 3,
            "last_recorded": "2026-05-30T10:00:00Z"
        }
    ]
}

# 5. 健康检查
GET /health

Response: {
    "status": "ok",
    "database": "player_progress.db",
    "tables": ["tasks", "todos", "case_history", "experience", "weakness_log"]
}
```

### 4.2 操作接口（POST）

**接口列表：**

```python
# 1. 创建Task（NPC Agent调用）
POST /api/task/create

Body: {
    "player_id": "player_001",
    "task_id": "new-task-id",
    "title": "新任务标题",
    "type": "prescription",  # 或 "syndrome"
    "blocked_by": "existing-task-id"  # 可选
}

Response: {
    "status": "created",
    "task_id": "new-task-id",
    "created_at": "2026-05-31T10:00:00Z"
}

# 2. 更新Todo mastery（NPC Agent调用）
POST /api/todo/update

Body: {
    "task_id": "mahuang-tang-learning",
    "todo_id": "composition",
    "mastery": 0.8,  # 0.0-1.0
    "status": "completed"  # 可选，自动推断
}

Response: {
    "status": "updated",
    "mastery": 0.8,
    "updated_at": "2026-05-31T10:00:00Z"
}

# 3. 记录病案完成（前端推送）
POST /api/case/complete

Body: {
    "player_id": "player_001",
    "case_id": "case_001",
    "title": "感冒风寒表实证",
    "score": 88,
    "diagnosis": "风寒表实",
    "prescription": "麻黄汤",
    "errors": ["脉诊判断", "舌诊判断"]
}

Response: {
    "status": "recorded",
    "case_id": "case_001",
    "experience_gained": 100,
    "recorded_at": "2026-05-31T10:00:00Z"
}

# 4. 记录薄弱点（NPC或前端调用）
POST /api/weakness/record

Body: {
    "player_id": "player_001",
    "weakness_type": "配伍理解",
    "details": "混淆麻黄与桂枝配伍意义",
    "task_id": "mahuang-tang-learning"  # 可选
}

Response: {
    "status": "recorded",
    "recorded_at": "2026-05-31T10:00:00Z"
}

# 5. 更新经验值（前端推送）
POST /api/experience/update

Body: {
    "player_id": "player_001",
    "prescription_exp": 100,
    "syndrome_exp": 50,
    "diagnosis_exp": 80
}

Response: {
    "status": "updated",
    "total_experience": 1600,
    "level": 3
}
```

---

## 5. Hermes Backend 工具调整

### 5.1 新增工具（操作型）

**工具定义：**

```python
# hermes_backend/tools/game_tools.py

# 1. create_task - 创建新Task
CREATE_TASK_SCHEMA = {
    "name": "create_task",
    "description": "为玩家创建新的学习任务",
    "parameters": {
        "type": "object",
        "properties": {
            "player_id": {"type": "string", "description": "玩家唯一标识"},
            "task_id": {"type": "string", "description": "任务唯一标识"},
            "title": {"type": "string", "description": "任务标题"},
            "type": {
                "type": "string",
                "enum": ["prescription", "syndrome"],
                "description": "任务类型"
            },
            "blocked_by": {"type": "string", "description": "依赖的任务ID（可选）"}
        },
        "required": ["player_id", "task_id", "title", "type"]
    }
}

def create_task_handler(args: dict, **kw) -> dict:
    """Create new task via game state backend."""
    import requests
    response = requests.post(
        "http://localhost:8643/api/task/create",
        json=args,
        timeout=5
    )
    return response.json()

# 2. update_todo - 更新Todo mastery
UPDATE_TODO_SCHEMA = {
    "name": "update_todo",
    "description": "更新玩家对某个知识点的掌握程度",
    "parameters": {
        "type": "object",
        "properties": {
            "task_id": {"type": "string", "description": "任务ID"},
            "todo_id": {"type": "string", "description": "知识点ID"},
            "mastery": {
                "type": "number",
                "minimum": 0,
                "maximum": 1,
                "description": "掌握程度 (0.0-1.0)"
            },
            "status": {
                "type": "string",
                "enum": ["pending", "in_progress", "completed"],
                "description": "状态（可选）"
            }
        },
        "required": ["task_id", "todo_id", "mastery"]
    }
}

def update_todo_handler(args: dict, **kw) -> dict:
    """Update todo mastery via game state backend."""
    import requests
    response = requests.post(
        "http://localhost:8643/api/todo/update",
        json=args,
        timeout=5
    )
    return response.json()
```

### 5.2 调整现有工具（查询型）

**从 MockGameStore 改为 HTTP 查询：**

```python
# hermes_backend/tools/game_tools.py

import requests

def get_learning_progress_handler(args: dict, **kw) -> dict:
    """Query tasks from game state backend."""
    player_id = args.get("player_id", "player_001")
    task_type = args.get("task_type", "all")
    
    response = requests.get(
        f"http://localhost:8643/api/tasks/{player_id}",
        timeout=5
    )
    data = response.json()
    
    # Filter by task_type if needed
    if task_type != "all":
        data["tasks"] = [
            t for t in data["tasks"]
            if t["type"] == task_type
        ]
    
    return data

def get_case_progress_handler(args: dict, **kw) -> dict:
    """Query case history from game state backend."""
    player_id = args.get("player_id", "player_001")
    case_id = args.get("case_id", "all")
    
    response = requests.get(
        f"http://localhost:8643/api/cases/{player_id}",
        timeout=5
    )
    data = response.json()
    
    # Filter by case_id if needed
    if case_id != "all":
        data["cases"] = [
            c for c in data["cases"]
            if c["case_id"] == case_id
        ]
    
    return data

def record_weakness_handler(args: dict, **kw) -> dict:
    """Record weakness via game state backend."""
    response = requests.post(
        "http://localhost:8643/api/weakness/record",
        json=args,
        timeout=5
    )
    return response.json()
```

### 5.3 工具注册

```python
# 注册所有工具
registry.register(
    name="create_task",
    toolset="tcm_game",
    schema=CREATE_TASK_SCHEMA,
    handler=create_task_handler,
    emoji="➕"
)

registry.register(
    name="update_todo",
    toolset="tcm_game",
    schema=UPDATE_TODO_SCHEMA,
    handler=update_todo_handler,
    emoji="📈"
)

# 更新现有工具注册（保持 schema 和 emoji）
registry.update_handler("get_learning_progress", get_learning_progress_handler)
registry.update_handler("get_case_progress", get_case_progress_handler)
registry.update_handler("record_weakness", record_weakness_handler)
```

---

## 6. 前端推送逻辑

### 6.1 推送时机

**病案完成时：**
- 病案诊断结束 → 推送病案记录到状态后端
- 计算 experience_gained → 推送经验值更新

**小游戏完成时：**
- 煎药、炮制等小游戏完成 → 推送经验值更新

**保持简单：**
- 不主动推送 Task/Todo 状态（NPC 通过工具操作）
- 背包数据继续用 localStorage（暂不后端化）

### 6.2 推送实现

**SaveManager 扩展：**

```typescript
// src/systems/SaveManager.ts

/**
 * 同步病案完成记录到状态后端
 */
async syncCaseCompletion(caseData: CaseCompletionData): Promise<void> {
    try {
        const response = await fetch('http://localhost:8643/api/case/complete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                player_id: this.playerId,
                case_id: caseData.case_id,
                title: caseData.title,
                score: caseData.score,
                diagnosis: caseData.diagnosis,
                prescription: caseData.prescription,
                errors: caseData.errors || []
            })
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log(`[SaveManager] Case completion synced. Experience gained: ${data.experience_gained}`);
            
            // 发送事件通知
            this.eventBus.emit('case:synced', {
                case_id: caseData.case_id,
                experience_gained: data.experience_gained
            });
        }
    } catch (error) {
        console.warn('[SaveManager] Failed to sync case completion:', error);
        // 静默失败，不影响游戏运行
    }
}

/**
 * 同步经验值更新到状态后端
 */
async syncExperienceUpdate(experienceData: ExperienceUpdateData): Promise<void> {
    try {
        const response = await fetch('http://localhost:8643/api/experience/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                player_id: this.playerId,
                prescription_exp: experienceData.prescription_exp || 0,
                syndrome_exp: experienceData.syndrome_exp || 0,
                diagnosis_exp: experienceData.diagnosis_exp || 0
            })
        });
        
        if (response.ok) {
            console.log('[SaveManager] Experience synced to backend');
        }
    } catch (error) {
        console.warn('[SaveManager] Failed to sync experience:', error);
    }
}
```

**CaseManager 调整：**

```typescript
// src/systems/CaseManager.ts

// 在病案完成时调用
async completeCase(caseId: string, result: DiagnosisResult): Promise<void> {
    // 保存到本地
    this.saveCaseResult(caseId, result);
    
    // 推送到状态后端
    await SaveManager.getInstance().syncCaseCompletion({
        case_id: caseId,
        title: this.getCaseTitle(caseId),
        score: result.score,
        diagnosis: result.diagnosis,
        prescription: result.prescription,
        errors: result.errors
    });
    
    // 发送事件
    this.eventBus.emit('case:complete', {
        case_id: caseId,
        score: result.score
    });
}
```

---

## 7. 启动流程和验证

### 7.1 启动流程

**启动顺序：**

```bash
# 1. 启动游戏状态后端（新增）
cd game-state-backend
python3 main.py
# 端口: 8643
# 日志: [GameStateBackend] Starting on port 8643...
#       [GameStateBackend] Database initialized: data/player_progress.db

# 2. 启动 Hermes Backend (NPC Agent)
cd hermes_backend
python3 main.py
# 端口: 8642
# 日志: [Hermes] Backend ready. Tools: 8

# 3. 启动游戏前端
npm run dev
# 端口: 3000
# 日志: VITE ready in 500ms

# 4. 可选：启动 Hermes WebUI 测试
cd ~/Desktop/hermes-webui
HERMES_HOME=/path/to/hermes/npcs/qingmu ./start.sh
# 端口: 8787
```

### 7.2 验证步骤

**功能验证：**

1. **前端推送验证**
   - 完成病案诊断 → 检查 SQLite case_history 表是否有记录
   - 检查日志：`[SaveManager] Case completion synced`

2. **NPC工具调用验证**
   - NPC调用 get_learning_progress → 检查返回真实数据（不是Mock）
   - NPC调用 create_task → 检查 SQLite tasks 表是否创建记录

3. **WebUI测试验证**
   - WebUI启动 → NPC调用工具返回真实数据（如果游戏运行）
   - WebUI独立启动 → NPC调用工具返回Mock数据（如果游戏未运行）

**数据一致性验证：**

```bash
# 检查 SQLite 数据
sqlite3 game-state-backend/data/player_progress.db

# 查询 tasks
SELECT * FROM tasks WHERE player_id='player_001';

# 查询 case_history
SELECT * FROM case_history WHERE player_id='player_001';

# 查询 experience
SELECT * FROM experience WHERE player_id='player_001';
```

---

## 8. 技术栈和依赖

### 8.1 游戏状态后端

**核心依赖：**
- FastAPI（Web框架）
- SQLite3（Python标准库自带）
- Pydantic（数据验证）
- uvicorn（ASGI服务器）

**最小化依赖：**
```python
# game-state-backend/requirements.txt
fastapi==0.115.0
pydantic==2.10.0
uvicorn==0.32.0
requests==2.32.0  # Hermes Backend 依赖
```

### 8.2 Hermes Backend

**新增依赖：**
- requests（HTTP查询状态后端）

**现有依赖：**
- FastAPI
- uvicorn
- 其他AI Agent依赖

---

## 9. Git Worktree 开发策略

### 9.1 独立分支开发

**原因：**
- 变更较大（新增状态后端）
- 避免影响现有 Hermes Backend 和前端
- 独立开发和测试

**创建 Worktree：**

```bash
# 创建独立分支
git worktree add ../game-state-backend-dev -b feature/game-state-backend

# 在新分支开发
cd ../game-state-backend-dev
mkdir game-state-backend
# ... 开发状态后端
```

### 9.2 开发流程

**Phase 1：状态后端基础框架**
- 创建 game-state-backend 目录
- 实现 FastAPI 基础框架
- 实现 SQLite 初始化
- 实现健康检查接口

**Phase 2：核心API接口**
- 实现查询接口（GET）
- 实现操作接口（POST）
- 实现数据验证

**Phase 3：Hermes Backend 工具调整**
- 新增 create_task, update_todo 工具
- 调整现有工具 Handler
- 测试工具调用

**Phase 4：前端推送逻辑**
- SaveManager 扩展
- CaseManager 调整
- 测试数据推送

**Phase 5：集成测试**
- 启动流程验证
- 数据一致性验证
- WebUI测试验证

---

## 10. 后续扩展方向

**暂不实现（保持简单）：**

1. **背包数据后端化**
   - 当前：localStorage
   - 未来：可选迁移到状态后端

2. **学习数据分析**
   - 学习曲线趋势图
   - 薄弱点聚类分析
   - 教学效果统计

3. **多玩家支持**
   - 当前：单玩家（player_001）
   - 未来：可选扩展多玩家

4. **数据备份恢复**
   - SQLite 备份
   - 数据导出导入

5. **NPC记忆后端化**
   - 当前：Hermes Backend MockUserStore
   - 未来：可选迁移到状态后端

---

## 11. 设计总结

**核心架构：**
- 游戏状态后端（端口 8643）存储所有动态学习数据
- Hermes Backend（端口 8642）保持 AI Agent 职责，通过 HTTP 查询状态后端
- 前端（端口 3000）在关键节点推送数据到状态后端

**职责清晰：**
- 状态后端：数据存储和查询
- NPC Agent：教学决策和工具操作
- 前端：实时状态管理和数据推送

**保持简单：**
- SQLite 单文件数据库
- 核心数据表（5个）
- 核心API接口（9个）
- 增量设计，随用随调整

---

## 附录：数据迁移考虑

**现有数据迁移：**

如果需要从现有 MockGameStore 迁移数据：

```python
# 从 hermes/npcs/qingmu/TASKS.json 迁移 Task 数据
def migrate_tasks_from_json():
    import json
    tasks_data = json.load(open('hermes/npcs/qingmu/TASKS.json'))
    
    for task in tasks_data['tasks']:
        # 插入到 tasks 表
        db.execute("""
            INSERT INTO tasks (player_id, task_id, title, type, status, progress, blocked_by, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (tasks_data['player_id'], task['task_id'], task['title'], task['type'], 
              task['status'], task['progress'], task['blocked_by'], 
              tasks_data['last_updated'], tasks_data['last_updated']))
        
        # 插入 todos
        for todo in task['todos']:
            db.execute("""
                INSERT INTO todos (task_id, todo_id, name, mastery, status, updated_at)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (task['task_id'], todo['id'], todo['name'], todo['mastery'],
                  todo['status'], tasks_data['last_updated']))
```

**迁移时机：**
- 状态后端首次启动时执行迁移
- 或手动迁移脚本

---

**文档版本**: v1.0
**最后更新**: 2026-05-31
**下一步**: 用户审核设计文档 → 创建实施计划 → Git Worktree 开发