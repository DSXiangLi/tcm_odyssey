# 背包与游戏数据统一方案设计

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**日期**: 2026-06-02
**版本**: v1.0
**目标**: 统一前后端数据源，建立游戏数据更新机制

---

## 问题诊断

### 1. 数据源不一致问题

| 数据节点 | 前端数据源 | Hermes Backend数据源 | 问题 |
|---------|-----------|---------------------|------|
| **背包药材** | `inventory-herbs.ts` 静态数据（80+药材） | `MockGameStore` 内存数据（2药材） | **严重不一致** |
| **NPC记忆** | 无 | `MockUserStore` 内存数据 | **前端无数据源** |
| 学习进度 | game-state-backend API ✅ | game-state-backend API ✅ | 正常 |
| 病案进度 | game-state-backend API ✅ | game-state-backend API ✅ | 正常 |
| 弱点记录 | game-state-backend API ✅ | game-state-backend API ✅ | 正常 |

### 2. 缺少数据更新机制

| 游戏节点 | 完成事件 | 数据持久化 | 问题 |
|---------|---------|-----------|------|
| 诊断游戏 | `diagnosis:complete` ✅ | **无** ❌ | 诊断结果未写入病案进度 |
| 煎药游戏 | `decoction:complete` ✅ | **无** ❌ | 煎药成功未更新知识点掌握度 |
| 炮制游戏 | `paozhi:complete` ✅ | **无** ❌ | 炮制成功未更新背包药材数量 |
| 种植游戏 | **无事件定义** ❌ | **无** ❌ | 完全缺少数据更新机制 |

---

## 设计方案

### Phase 1: 背包数据统一（当前实施）

#### 1.1 数据库表结构

**game-state-backend 新增 `inventory` 表**：

```sql
CREATE TABLE IF NOT EXISTS inventory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id TEXT NOT NULL,
    herb_id TEXT NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    xing TEXT,
    wei TEXT,
    gui TEXT,
    rarity INTEGER DEFAULT 1,
    raw_count INTEGER DEFAULT 0,
    piece_count INTEGER DEFAULT 0,
    updated_at TEXT NOT NULL,
    UNIQUE(player_id, herb_id)
);

CREATE INDEX idx_inventory_player ON inventory(player_id);
```

#### 1.2 数据迁移

从 `src/ui/html/data/inventory-herbs.ts` 的 `_herbRows` 数组迁移：
- 86条药材记录
- 完整字段：id, name, cat, xing, wei, gui, rarity, rawCount, pieceCount
- 默认玩家ID：`player_001`

#### 1.3 API接口

**game-state-backend 新增**：

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/inventory/{player_id}` | GET | 获取玩家全部药材 |
| `/api/inventory/{player_id}/{herb_id}` | GET | 获取单个药材详情 |

**响应格式**：
```json
{
  "player_id": "player_001",
  "herbs": [
    {
      "id": "mahuang",
      "name": "麻黄",
      "category": "jiebiao",
      "xing": "温",
      "wei": "辛微苦",
      "gui": "肺·膀胱",
      "rarity": 2,
      "raw_count": 12,
      "piece_count": 8
    }
  ],
  "statistics": {
    "total_herbs": 86,
    "total_raw": 450,
    "total_piece": 380
  }
}
```

#### 1.4 Hermes Backend对接

修改 `hermes_backend/tools/game_tools.py` 的 `get_inventory_handler`：

```python
def get_inventory_handler(args: dict, **kw) -> dict:
    """Query inventory from game state backend."""
    player_id = args.get("player_id", "player_001")
    try:
        response = requests.get(
            f"http://localhost:8643/api/inventory/{player_id}",
            timeout=5
        )
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        return {"error": f"Game backend unavailable: {str(e)}"}
```

#### 1.5 前端对接

ClinicScene调用API并通过事件传递给InventoryUI：
- 模式与学习进度数据流一致（API→Phaser→HTML UI）
- InventoryUI改为接收props渲染，不再静态导入

---

### Phase 2: NPC记忆数据统一（后续实施）

#### 2.1 数据库表结构

**game-state-backend 新增 `npc_memory` 表**：

```sql
CREATE TABLE IF NOT EXISTS npc_memory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    npc_id TEXT NOT NULL,
    player_id TEXT NOT NULL,
    learning_style TEXT,
    preferred_topics TEXT,
    difficulty_level TEXT DEFAULT 'beginner',
    last_topic TEXT,
    pending_question TEXT,
    updated_at TEXT NOT NULL,
    UNIQUE(npc_id, player_id)
);

CREATE TABLE IF NOT EXISTS npc_interactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    npc_id TEXT NOT NULL,
    player_id TEXT NOT NULL,
    date TEXT NOT NULL,
    topic TEXT NOT NULL,
    outcome TEXT NOT NULL,
    created_at TEXT NOT NULL
);
```

#### 2.2 API接口

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/memory/{npc_id}/{player_id}` | GET | 获取NPC对玩家的记忆 |
| `/api/memory/{npc_id}/{player_id}` | PUT | 更新NPC记忆 |

---

### Phase 3: 游戏数据更新机制（后续实施）

#### 3.1 诊断完成 → 病案进度

**事件**: `diagnosis:complete`

**数据流**:
```
前端DiagnosisUI完成 → emit事件 → ClinicScene接收
→ fetch POST /api/cases/complete → game-state-backend更新case_history表
```

**API**: `POST /api/cases/complete`
```json
{
  "player_id": "player_001",
  "case_id": "case_001",
  "diagnosis": "风寒表实",
  "prescription": "麻黄汤",
  "score": 88,
  "completed_at": "2026-06-02T10:30:00Z"
}
```

#### 3.2 煎药完成 → 知识点掌握度

**事件**: `decoction:complete`

**数据流**:
```
前端DecoctionUI完成 → emit事件 → ClinicScene接收
→ fetch POST /api/todo/update → game-state-backend更新todos表mastery字段
```

**API**: 已存在 `POST /api/todo/update`（复用）

#### 3.3 炮制完成 → 背包药材数量

**事件**: `paozhi:complete`

**数据流**:
```
前端PaozhiUI完成 → emit事件 → GardenScene接收
→ fetch POST /api/inventory/update → game-state-backend更新inventory表
```

**API**: `POST /api/inventory/update`
```json
{
  "player_id": "player_001",
  "herb_id": "mahuang",
  "raw_count_delta": -5,
  "piece_count_delta": +5
}
```

#### 3.4 种植完成 → 背包药材数量

**新增事件**: `planting:complete`

**数据流**:
```
前端PlantingUI完成 → emit事件 → GardenScene接收
→ fetch POST /api/inventory/update → game-state-backend更新inventory表
```

**API**: 复用 `POST /api/inventory/update`
```json
{
  "player_id": "player_001",
  "herb_id": "mahuang",
  "raw_count_delta": +10
}
```

---

## 实施顺序

| Phase | 内容 | 优先级 | 预估工作量 |
|-------|------|-------|-----------|
| **Phase 1** | 背包数据统一 | **高（当前）** | 2-3小时 |
| Phase 2 | NPC记忆统一 | 中 | 1-2小时 |
| Phase 3 | 游戏数据更新机制 | 中 | 3-4小时 |

---

## 成功标准

1. Hermes Backend `get_inventory` 返回与前端一致的86条药材数据
2. 前端InventoryUI从API渲染，不再静态导入
3. NPC对话中提及背包内容与实际显示一致
4. 游戏完成后数据写入数据库，下次启动可恢复

---

## 技术栈

- **后端**: FastAPI + SQLite (game-state-backend, port 8643)
- **前端**: Phaser 3 + React HTML UI
- **数据流**: API → Phaser Scene → HTML UI props
- **事件桥接**: CustomEvent emit/listen