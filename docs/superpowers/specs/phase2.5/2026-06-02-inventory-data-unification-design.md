# 背包与游戏数据统一方案设计

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**日期**: 2026-06-02
**版本**: v2.0
**目标**: 统一前后端数据源，建立游戏数据更新机制

---

## 问题诊断

### 1. 数据源不一致问题

| 数据节点 | 前端数据源 | Hermes Backend数据源 | 问题 |
|---------|-----------|---------------------|------|
| **背包药材** | `inventory-herbs.ts` 静态数据（86药材） | `MockGameStore` 内存数据（2药材） | **严重不一致** |
| 学习进度 | game-state-backend API ✅ | game-state-backend API ✅ | 正常 |
| 病案进度 | game-state-backend API ✅ | game-state-backend API ✅ | 正常 |
| 弱点记录 | game-state-backend API ✅ | game-state-backend API ✅ | 正常 |

> **NPC记忆**: Hermes Backend自主总结，无需额外存储机制。

### 2. 缺少数据更新机制

| 游戏节点 | 完成事件 | 数据持久化 | 问题 |
|---------|---------|-----------|------|
| 诊断游戏 | `diagnosis:complete` ✅ | **无** ❌ | 诊断结果未写入病案进度 |
| 煎药游戏 | `decoction:complete` ✅ | **无** ❌ | 煎药成功未更新知识点掌握度 |
| 炮制游戏 | `paozhi:complete` ✅ | **无** ❌ | 炮制成功未更新背包药材数量 |
| 种植游戏 | **无事件定义** ❌ | **无** ❌ | 完全缺少数据更新机制 |

---

## 设计方案

### 1. 数据库表结构扩展

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

### 2. 数据迁移

从 `src/ui/html/data/inventory-herbs.ts` 的 `_herbRows` 数组迁移：
- 86条药材记录
- 完整字段：id, name, cat, xing, wei, gui, rarity, rawCount, pieceCount
- 默认玩家ID：`player_001`

### 3. API接口

**game-state-backend 新增接口**（端口8643）：

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/inventory/{player_id}` | GET | 获取玩家全部药材 |
| `/api/inventory/{player_id}/{herb_id}` | GET | 获取单个药材详情 |
| `/api/inventory/update` | POST | 更新药材数量（加减） |
| `/api/cases/complete` | POST | 记录诊断完成结果 |

#### 3.1 GET /api/inventory/{player_id}

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

#### 3.2 POST /api/inventory/update

**请求格式**：
```json
{
  "player_id": "player_001",
  "herb_id": "mahuang",
  "raw_count_delta": -5,
  "piece_count_delta": +5
}
```

**响应格式**：
```json
{
  "status": "updated",
  "herb_id": "mahuang",
  "raw_count": 7,
  "piece_count": 13
}
```

#### 3.3 POST /api/cases/complete

**请求格式**：
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

### 4. Hermes Backend对接

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

### 5. 前端数据流

#### 5.1 背包数据统一

**当前**：InventoryUI静态导入 `inventory-herbs.ts`

**改为**：ClinicScene调用API → 事件传递 → InventoryUI渲染

```
ClinicScene.init() 
  → fetch GET /api/inventory/{player_id}
  → localStorage缓存（备用）
  → 监听 'clinic:showInventory' 事件
  → 发送 'inventory:data' 事件携带药材数据
  → InventoryUI接收props渲染
```

#### 5.2 游戏完成数据更新

**诊断完成**：
```
DiagnosisUI完成 → emit 'diagnosis:complete' 携带结果
→ ClinicScene接收 → fetch POST /api/cases/complete
→ game-state-backend更新case_history表
```

**煎药完成**：
```
DecoctionUI完成 → emit 'decoction:complete' 携带方剂ID
→ ClinicScene接收 → fetch POST /api/todo/update（复用现有）
→ game-state-backend更新todos表mastery字段
```

**炮制完成**：
```
PaozhiUI完成 → emit 'paozhi:complete' 携带药材ID和数量变化
→ GardenScene接收 → fetch POST /api/inventory/update
→ game-state-backend更新inventory表
```

**种植完成**：
```
PlantingUI完成 → emit 'planting:complete' 携带药材ID和收获数量
→ GardenScene接收 → fetch POST /api/inventory/update
→ game-state-backend更新inventory表
```

### 6. 种植游戏事件补充

**新增事件定义** `src/ui/html/bridge/planting-events.ts`：

```typescript
export const PLANTING_EVENTS = {
  START: 'planting:start',
  COMPLETE: 'planting:complete',  // 种植完成（携带收获信息）
};

export interface PlantingCompletePayload {
  herb_id: string;
  harvest_count: number;
  quality: number;  // 1-3品质等级
}
```

---

## 实施任务清单

### Task 1: 数据库扩展
- 创建 `inventory` 表
- 编写数据迁移脚本（inventory-herbs.ts → SQLite）

### Task 2: API接口开发
- 实现 `GET /api/inventory/{player_id}`
- 实现 `POST /api/inventory/update`
- 实现 `POST /api/cases/complete`

### Task 3: Hermes Backend对接
- 修改 `get_inventory_handler` 调用game-state-backend API

### Task 4: 前端背包UI改造
- ClinicScene调用API获取数据
- InventoryUI改为接收props渲染

### Task 5: 游戏完成数据写入
- ClinicScene监听诊断/煎药完成事件，调用API
- GardenScene监听炮制/种植完成事件，调用API

### Task 6: 种植事件补充
- 创建 `planting-events.ts`
- PlantingUI发射完成事件

---

## 成功标准

1. ✅ Hermes Backend `get_inventory` 返回86条药材数据
2. ✅ 前端InventoryUI从API渲染，数据与NPC查询一致
3. ✅ 诊断完成后病案进度表更新
4. ✅ 煎药完成后知识点掌握度更新
5. ✅ 炮制完成后背包生药→片药数量变化
6. ✅ 种植完成后背包药材数量增加

---

## 技术栈

- **后端**: FastAPI + SQLite (game-state-backend, port 8643)
- **前端**: Phaser 3 + React HTML UI
- **数据流**: API → Phaser Scene → HTML UI props
- **事件桥接**: CustomEvent emit/listen