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

## 五、API设计

### 5.1 新增API端点

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
    "game_config": {
      "prescriptionId": "mahuangtang"
    },
    "reward": {
      "herbs": [{"herb_id": "mahuang", "delta": 3}]
    },
    "status": "pending",
    "created_at": "2026-06-05T10:00:00Z"
  }
}
```

**逻辑**：
```python
rows = conn.execute("""
    SELECT * FROM tasks
    WHERE player_id = ? AND status = 'pending' AND game_type IS NOT NULL
    ORDER BY created_at DESC
    LIMIT 1
""", (player_id,)).fetchall()
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

**逻辑**：
```python
now = datetime.utcnow().isoformat() + "Z"
conn.execute("""
    UPDATE tasks
    SET progress = ?, status = ?, score = ?, updated_at = ?
    WHERE task_id = ?
""", (request.progress, request.status, request.score, now, request.task_id))
```

### 5.2 扩展现有API

#### POST /api/task/create（扩展）

**新增参数**：
```json
{
  "player_id": "player_001",
  "task_id": "task_decoction_mahuangtang_001",
  "title": "煎制麻黄汤",
  "type": "game_task",
  "game_type": "decoction",
  "game_config": {
    "prescriptionId": "mahuangtang"
  },
  "reward": {
    "herbs": [{"herb_id": "mahuang", "delta": 3}]
  }
}
```

---

## 六、Hermes Backend工具扩展

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

## 七、前端实现设计

### 7.1 ClinicScene查询pending任务

**新增方法**：
```typescript
// src/scenes/ClinicScene.ts

/**
 * 查询当前pending游戏任务
 */
private async getPendingGameTask(): Promise<GameTaskConfig | null> {
  try {
    const response = await fetch('http://localhost:8643/api/tasks/player_001/pending_game');
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
    taskId: pendingTask?.task_id  // 传递task_id供游戏完成时更新
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
  await fetch('http://localhost:8643/api/task/update', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({task_id: taskId, status: status})
  });
}
```

### 7.2 游戏场景完成时更新任务

**DecoctionScene.ts**：
```typescript
// src/scenes/DecoctionScene.ts

export interface DecoctionSceneConfig {
  prescriptionId?: string;
  taskId?: string;  // 新增：任务ID
}

export class DecoctionScene extends Phaser.Scene {
  private taskId: string | null = null;

  init(data: DecoctionSceneConfig): void {
    this.prescriptionId = data.prescriptionId || null;
    this.taskId = data.taskId || null;  // 接收任务ID
  }

  private handleGameComplete(result: ScoreResultData): void {
    // ✅ 更新任务状态
    if (this.taskId) {
      this.updateTask(this.taskId, result.totalScore);
    }

    // ✅ 发放奖励
    this.grantReward();
  }

  private async updateTask(taskId: string, score: number): void {
    await fetch('http://localhost:8643/api/task/update', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        task_id: taskId,
        progress: 1.0,
        status: 'completed',
        score: score
      })
    });
  }

  private async grantReward(): void {
    // 查询任务奖励配置
    const task = await this.getTaskInfo(this.taskId);
    if (task?.reward?.herbs) {
      await fetch('http://localhost:8643/api/inventory/update', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          player_id: 'player_001',
          updates: task.reward.herbs
        })
      });
    }
  }
}
```

**DiagnosisScene.ts**：
```typescript
// src/scenes/DiagnosisScene.ts

export interface DiagnosisSceneConfig {
  caseId?: string;
  taskId?: string;  // 新增：任务ID
}

private handleDiagnosisComplete(result: DiagnosisResult): void {
  const score = calculateDiagnosisScore(result, this.caseData);

  // ✅ 更新任务状态
  if (this.taskId) {
    this.updateTask(this.taskId, score.totalScore);
  }

  // ✅ 更新病案历史
  this.updateCaseHistory(this.caseId, score.totalScore);

  // ✅ 触发NPC反馈
  triggerNPCFeedback({...});
}
```

---

## 八、数据流动完整验证

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

## 九、测试用例设计

### 9.1 E2E测试：任务创建→游戏→更新

**测试文件**：`tests/e2e/task-driven-game-flow.spec.ts`

**测试步骤**：
```typescript
test('NPC创建煎药任务→玩家完成→数据更新', async ({ page }) => {
  // 1. NPC对话创建任务
  await page.goto('http://localhost:3000');
  await triggerNPCDialog(page);
  await sendNPCMessage(page, "我们来煎麻黄汤");

  // 验证任务创建
  const taskResponse = await page.evaluate(() =>
    fetch('http://localhost:8643/api/tasks/player_001/pending_game')
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
    fetch('http://localhost:8643/api/tasks/player_001')
      .then(res => res.json())
      .then(data => data.tasks.find(t => t.task_id.includes('mahuangtang')))
  );
  expect(updatedTask.status).toBe('completed');
  expect(updatedTask.score).toBe(85);

  // 验证背包更新
  const inventory = await page.evaluate(() =>
    fetch('http://localhost:8643/api/inventory/player_001')
      .then(res => res.json())
      .then(data => data.herbs.find(h => h.id === 'mahuang'))
  );
  expect(inventory.raw_count).toBeGreaterThan(initialCount);
});
```

---

## 十、实施计划

### 10.1 阶段划分

| 阶段 | 任务 | 工作量 | 优先级 |
|------|------|--------|--------|
| **Phase 1** | 任务系统扩展 | 2小时 | P0 |
| **Phase 2** | Hermes工具扩展 | 30分钟 | P0 |
| **Phase 3** | 游戏UI更新 | 1.5小时 | P0 |
| **Phase 4** | ClinicScene查询 | 30分钟 | P0 |
| **Phase 5** | E2E测试 | 1小时 | P1 |
| **总计** | | **5小时** | |

### 10.2 详细任务

**Phase 1: 任务系统扩展**（2小时）
- Task 1.1: ALTER TABLE tasks增加字段（game_type, game_config, score, reward）
- Task 1.2: 新增GET /api/tasks/{player_id}/pending_game API
- Task 1.3: 新增POST /api/task/update API
- Task 1.4: 扩展POST /api/task/create支持新字段

**Phase 2: Hermes工具扩展**（30分钟）
- Task 2.1: 扩展create_task工具schema
- Task 2.2: 更新create_task_handler
- Task 2.3: 废弃trigger_minigame工具说明

**Phase 3: 游戏UI更新**（1.5小时）
- Task 3.1: DecoctionScene增加taskId参数接收
- Task 3.2: DecoctionScene完成时调用task/update
- Task 3.3: DecoctionScene发放奖励调用inventory/update
- Task 3.4: DiagnosisScene同样改造

**Phase 4: ClinicScene查询**（30分钟）
- Task 4.1: 新增getPendingGameTask方法
- Task 4.2: startDecoction/startDiagnosis读取配置
- Task 4.3: 启动游戏时更新任务状态为in_progress

**Phase 5: E2E测试**（1小时）
- Task 5.1: 编写task-driven-game-flow.spec.ts
- Task 5.2: 验证数据流动完整闭环

---

## 十一、风险评估

### 11.1 技术风险

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| 数据库ALTER TABLE失败 | 阻塞 | 先在测试环境验证SQL |
| API并发更新冲突 | 数据不一致 | 使用事务+乐观锁 |
| 前端异步调用失败 | 任务状态错误 | 增加错误处理+重试 |

### 11.2 架构风险

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| 废弃trigger_minigame影响现有流程 | 兼容性 | 保留工具定义，只更新description |
| 游戏场景参数扩展影响测试 | 测试失败 | 逐步扩展，保持向后兼容 |

---

## 十二、后续扩展

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