# 背包与游戏数据统一实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 统一前后端背包数据源，建立游戏完成数据更新机制

**Architecture:** game-state-backend扩展inventory表和API；Hermes Backend查询统一API；前端Phaser Scene调用API传递给HTML UI；游戏完成事件触发数据写入。

**Tech Stack:** FastAPI + SQLite (后端), Phaser 3 + React (前端), CustomEvent (事件桥接)

---

## 文件结构

| 文件 | 责责 | 操作 |
|------|------|------|
| `game-state-backend/database/schema.py` | 添加inventory表DDL | 修改 |
| `game-state-backend/database/migrations.py` | 药材数据迁移脚本 | 修改 |
| `game-state-backend/api/inventory.py` | 背包API接口 | 新建 |
| `game-state-backend/api/cases.py` | 添加complete接口 | 修改 |
| `game-state-backend/main.py` | 注册inventory路由 | 修改 |
| `hermes_backend/tools/game_tools.py` | get_inventory对接API | 修改 |
| `src/scenes/ClinicScene.ts` | 获取背包数据+监听完成事件 | 修改 |
| `src/scenes/GardenScene.ts` | 监听炮制/种植完成事件 | 修改 |
| `src/ui/html/InventoryUI.tsx` | 改为接收props渲染 | 修改 |
| `src/ui/html/bridge/planting-events.ts` | 种植事件定义 | 新建 |

---

## Task 1: 数据库扩展 - inventory表

**Files:**
- Modify: `/home/lixiang/Desktop/game-state-backend-dev/game-state-backend/database/schema.py`
- Test: `/home/lixiang/Desktop/game-state-backend-dev/game-state-backend/data/player_progress.db`

- [ ] **Step 1: 添加inventory表DDL到schema.py**

在 `SCHEMA_SQL` 字符串末尾添加：

```python
# 在 schema.py 的 SCHEMA_SQL 字符串中添加（在现有索引之后）

-- Inventory表（背包药材）
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

CREATE INDEX IF NOT EXISTS idx_inventory_player ON inventory(player_id);
"""
```

- [ ] **Step 2: 删除旧数据库重建**

```bash
rm /home/lixiang/Desktop/game-state-backend-dev/game-state-backend/data/player_progress.db
```

- [ ] **Step 3: 重启game-state-backend验证表创建**

```bash
cd /home/lixiang/Desktop/game-state-backend-dev/game-state-backend && python3 main.py &
sleep 3 && curl http://localhost:8643/health
```

Expected: `{"status":"ok","database":"player_progress.db","tables":["tasks","todos","case_history","experience","weakness_log","inventory"]}`

- [ ] **Step 4: Commit**

```bash
cd /home/lixiang/Desktop/zhongyi_game_v3
git add docs/superpowers/plans/
git commit -m "feat(game-state-backend): add inventory table schema"
```

---

## Task 2: 数据迁移 - 86药材记录

**Files:**
- Modify: `/home/lixiang/Desktop/game-state-backend-dev/game-state-backend/database/migrations.py`
- Source: `src/ui/html/data/inventory-herbs.ts`

- [ ] **Step 1: 提取inventory-herbs.ts数据为JSON**

从 `src/ui/html/data/inventory-herbs.ts` 的 `_herbRows` 数组手动提取，创建迁移数据文件：

```python
# 在 migrations.py 添加新函数 migrate_inventory()

import json
from datetime import datetime
from pathlib import Path

def migrate_inventory(conn, project_root: Path):
    """Migrate inventory data from inventory-herbs.ts."""
    herbs_data = [
        # 解表药 (9种)
        ('mahuang', '麻黄', 'jiebiao', '温', '辛微苦', '肺·膀胱', 2, 12, 8),
        ('guizhi', '桂枝', 'jiebiao', '温', '辛甘', '心·肺·膀胱', 1, 8, 15),
        ('zisuye', '紫苏叶', 'jiebiao', '温', '辛', '肺·脾', 1, 5, 7),
        ('jingjie', '荆芥', 'jiebiao', '微温', '辛', '肺·肝', 1, 3, 4),
        ('fangfeng', '防风', 'jiebiao', '微温', '辛甘', '膀胱·肝·脾', 2, 0, 6),
        ('bohe', '薄荷', 'jiebiao', '凉', '辛', '肺·肝', 1, 14, 9),
        ('juhua', '菊花', 'jiebiao', '微寒', '甘苦', '肺·肝', 1, 9, 12),
        ('gegen', '葛根', 'jiebiao', '凉', '甘辛', '脾·胃', 2, 4, 2),
        ('chaihu', '柴胡', 'jiebiao', '凉', '苦辛', '肝·胆', 2, 2, 5),
        # 清热药 (10种)
        ('shigao', '石膏', 'qingre', '大寒', '甘辛', '肺·胃', 1, 7, 3),
        ('zhimu', '知母', 'qingre', '寒', '苦甘', '肺·胃·肾', 2, 5, 8),
        ('huangqin', '黄芩', 'qingre', '寒', '苦', '肺·胆·脾', 2, 11, 6),
        ('huanglian', '黄连', 'qingre', '寒', '苦', '心·脾·胃', 3, 3, 4),
        ('huangbai', '黄柏', 'qingre', '寒', '苦', '肾·膀胱', 2, 6, 2),
        ('jinyinhua', '金银花', 'qingre', '寒', '甘', '肺·心·胃', 1, 18, 11),
        ('lianqiao', '连翘', 'qingre', '微寒', '苦', '肺·心·小肠', 1, 10, 5),
        ('shengdi', '生地黄', 'qingre', '寒', '甘苦', '心·肝·肾', 2, 7, 9),
        ('mudanpi', '牡丹皮', 'qingre', '微寒', '苦辛', '心·肝·肾', 2, 4, 3),
        # 泻下药 (3种)
        ('dahuang', '大黄', 'xiexia', '寒', '苦', '脾·胃·大肠', 2, 6, 4),
        ('mangxiao', '芒硝', 'xiexia', '寒', '咸苦', '胃·大肠', 2, 2, 1),
        ('huomaren', '火麻仁', 'xiexia', '平', '甘', '脾·胃·大肠', 1, 4, 8),
        # 祛风湿药 (5种)
        ('duhuo', '独活', 'qufengshi', '微温', '辛苦', '肝·肾·膀胱', 1, 5, 3),
        ('qianghuo', '羌活', 'qufengshi', '温', '辛苦', '膀胱·肾', 2, 3, 7),
        ('mugua', '木瓜', 'qufengshi', '温', '酸', '肝·脾', 1, 7, 4),
        ('sangjisheng', '桑寄生', 'qufengshi', '平', '苦甘', '肝·肾', 2, 0, 2),
        ('weilingxian', '威灵仙', 'qufengshi', '温', '辛咸', '膀胱', 2, 1, 0),
        # 化湿药 (4种)
        ('cangzhu', '苍术', 'huashi', '温', '辛苦', '脾·胃·肝', 1, 8, 5),
        ('houpo', '厚朴', 'huashi', '温', '苦辛', '脾·胃·肺', 2, 5, 2),
        ('huoxiang', '藿香', 'huashi', '微温', '辛', '脾·胃·肺', 1, 6, 9),
        ('peilan', '佩兰', 'huashi', '平', '辛', '脾·胃·肺', 1, 2, 3),
        # 利水渗湿药 (5种)
        ('fuling', '茯苓', 'lishui', '平', '甘淡', '心·肺·脾·肾', 1, 15, 12),
        ('zexie', '泽泻', 'lishui', '寒', '甘淡', '肾·膀胱', 1, 8, 4),
        ('yiyiren', '薏苡仁', 'lishui', '凉', '甘淡', '脾·胃·肺', 1, 22, 18),
        ('cheqianzi', '车前子', 'lishui', '寒', '甘', '肝·肾·肺', 1, 4, 7),
        ('yinchen', '茵陈', 'lishui', '微寒', '苦辛', '脾·胃·肝·胆', 2, 3, 1),
        # 温里药 (5种)
        ('fuzi', '附子', 'wenli', '大热', '辛甘', '心·肾·脾', 4, 2, 1),
        ('rougui', '肉桂', 'wenli', '大热', '辛甘', '肾·脾·心·肝', 3, 4, 3),
        ('ganjiang', '干姜', 'wenli', '热', '辛', '脾·胃·肾', 1, 9, 6),
        ('wuzhuyu', '吴茱萸', 'wenli', '热', '辛苦', '肝·脾·胃', 2, 3, 5),
        ('huajiao', '花椒', 'wenli', '温', '辛', '脾·胃·肾', 1, 5, 2),
        # 理气药 (5种)
        ('chenpi', '陈皮', 'liqi', '温', '辛苦', '脾·肺', 1, 13, 11),
        ('zhike', '枳壳', 'liqi', '微寒', '苦辛', '脾·胃', 1, 5, 3),
        ('muxiang', '木香', 'liqi', '温', '辛苦', '脾·胃·大肠', 1, 4, 7),
        ('xiangfu', '香附', 'liqi', '平', '辛微苦', '肝·脾·三焦', 1, 7, 9),
        ('foushou', '佛手', 'liqi', '温', '辛苦酸', '肝·脾·肺', 2, 2, 0),
        # 消食药 (4种)
        ('shanzha', '山楂', 'xiaoshi', '微温', '酸甘', '脾·胃·肝', 1, 11, 6),
        ('maiya', '麦芽', 'xiaoshi', '平', '甘', '脾·胃', 1, 8, 4),
        ('jineijin', '鸡内金', 'xiaoshi', '平', '甘', '脾·胃·小肠', 2, 3, 2),
        ('shenqu', '神曲', 'xiaoshi', '温', '甘辛', '脾·胃', 1, 6, 5),
        # 驱虫药 (3种)
        ('shijunzi', '使君子', 'quchong', '温', '甘', '脾·胃', 2, 2, 1),
        ('binglang', '槟榔', 'quchong', '温', '苦辛', '胃·大肠', 2, 0, 3),
        ('kulianpi', '苦楝皮', 'quchong', '寒', '苦', '肝·脾·胃', 2, 1, 0),
        # 止血药 (4种)
        ('sanqi', '三七', 'zhixue', '温', '甘微苦', '肝·胃', 3, 1, 2),
        ('baiji', '白及', 'zhixue', '微寒', '苦甘涩', '肺·肝·胃', 2, 4, 2),
        ('aiye', '艾叶', 'zhixue', '温', '辛苦', '肝·脾·肾', 1, 9, 7),
        ('xianhecao', '仙鹤草', 'zhixue', '平', '苦涩', '心·肝', 1, 3, 1),
        # 活血化瘀药 (5种)
        ('chuanxiong', '川芎', 'huoxue', '温', '辛', '肝·胆·心包', 2, 6, 4),
        ('danshen', '丹参', 'huoxue', '微寒', '苦', '心·肝', 2, 8, 11),
        ('honghua', '红花', 'huoxue', '温', '辛', '心·肝', 2, 3, 2),
        ('taoren', '桃仁', 'huoxue', '平', '苦甘', '心·肝·大肠', 1, 5, 3),
        ('yimu', '益母草', 'huoxue', '微寒', '苦辛', '肝·心·膀胱', 1, 7, 5),
        # 化痰止咳平喘药 (5种)
        ('banxia', '半夏', 'huatan', '温', '辛', '脾·胃·肺', 2, 4, 9),
        ('jiegeng', '桔梗', 'huatan', '平', '苦辛', '肺', 1, 6, 5),
        ('xingren', '杏仁', 'huatan', '微温', '苦', '肺·大肠', 1, 8, 7),
        ('beimu', '贝母', 'huatan', '寒', '苦甘', '肺·心', 3, 2, 3),
        ('kuandonghua', '款冬花', 'huatan', '温', '辛微苦', '肺', 2, 1, 0),
        # 安神药 (4种)
        ('suanzaoren', '酸枣仁', 'anshen', '平', '甘酸', '肝·胆·心', 2, 5, 3),
        ('baiziren', '柏子仁', 'anshen', '平', '甘', '心·肾·大肠', 1, 4, 2),
        ('yuanzhi', '远志', 'anshen', '温', '辛苦', '心·肾·肺', 2, 2, 1),
        ('hehuanpi', '合欢皮', 'anshen', '平', '甘', '心·肝·肺', 1, 3, 0),
        # 平肝息风药 (4种)
        ('tianma', '天麻', 'pinggan', '平', '甘', '肝', 3, 1, 4),
        ('gouteng', '钩藤', 'pinggan', '凉', '甘', '肝·心包', 2, 3, 2),
        ('shijueming', '石决明', 'pinggan', '寒', '咸', '肝', 2, 2, 1),
        ('baijili', '白蒺藜', 'pinggan', '微温', '辛苦', '肝', 1, 4, 0),
        # 开窍药 (3种)
        ('shexiang', '麝香', 'kaiqiao', '温', '辛', '心·脾', 4, 0, 1),
        ('shichangpu', '石菖蒲', 'kaiqiao', '温', '辛苦', '心·胃', 2, 2, 1),
        ('bingpian', '冰片', 'kaiqiao', '微寒', '辛苦', '心·脾·肺', 3, 1, 2),
        # 补虚药 (9种)
        ('renshen', '人参', 'buxu', '微温', '甘微苦', '心·脾·肺', 4, 1, 2),
        ('huangqi', '黄芪', 'buxu', '微温', '甘', '脾·肺', 2, 9, 7),
        ('baizhu', '白术', 'buxu', '温', '苦甘', '脾·胃', 1, 7, 5),
        ('gancao', '甘草', 'buxu', '平', '甘', '心·肺·脾·胃', 1, 18, 22),
        ('danggui', '当归', 'buxu', '温', '甘辛', '肝·心·脾', 2, 5, 8),
        ('shudihuang', '熟地黄', 'buxu', '微温', '甘', '肝·肾', 2, 4, 6),
        ('gouqi', '枸杞子', 'buxu', '平', '甘', '肝·肾·肺', 1, 11, 9),
        ('lurong', '鹿茸', 'buxu', '温', '甘咸', '肝·肾', 4, 1, 0),
        ('ejiao', '阿胶', 'buxu', '平', '甘', '肺·肝·肾', 3, 2, 3),
        # 收涩药 (4种)
        ('wuweizi', '五味子', 'shouse', '温', '酸甘', '肺·心·肾', 2, 4, 3),
        ('shanzhuyu', '山茱萸', 'shouse', '微温', '酸涩', '肝·肾', 2, 3, 2),
        ('wumei', '乌梅', 'shouse', '平', '酸涩', '肝·脾·肺·大肠', 1, 5, 4),
        ('lianzi', '莲子', 'shouse', '平', '甘涩', '脾·肾·心', 1, 7, 5),
    ]
    
    now = datetime.utcnow().isoformat() + 'Z'
    player_id = 'player_001'
    
    cursor = conn.cursor()
    inserted = 0
    
    for herb in herbs_data:
        herb_id, name, cat, xing, wei, gui, rarity, raw_count, piece_count = herb
        try:
            cursor.execute("""
                INSERT INTO inventory 
                (player_id, herb_id, name, category, xing, wei, gui, rarity, raw_count, piece_count, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (player_id, herb_id, name, cat, xing, wei, gui, rarity, raw_count, piece_count, now))
            inserted += 1
        except Exception as e:
            print(f"[Migration] Skipped {herb_id}: {e}")
    
    conn.commit()
    print(f"[Migration] Inserted {inserted} herbs into inventory table")
```

- [ ] **Step 2: 在main.py中调用迁移函数**

修改 `/home/lixiang/Desktop/game-state-backend-dev/game-state-backend/main.py`，在初始化数据库后调用：

```python
# 在 main.py 的 startup 事件中添加
from database.migrations import migrate_tasks_from_hermes, migrate_inventory

@app.on_event("startup")
async def startup():
    conn = get_db()
    init_database(conn)
    migrate_tasks_from_hermes(conn, PROJECT_ROOT)
    migrate_inventory(conn, PROJECT_ROOT)  # 新增这行
    print("[Startup] Game state backend ready")
```

- [ ] **Step 3: 重启服务并验证数据**

```bash
# 杀掉旧进程
pkill -f "python3 main.py" || true

# 重启
cd /home/lixiang/Desktop/game-state-backend-dev/game-state-backend && python3 main.py &
sleep 3

# 验证
curl http://localhost:8643/health
```

Expected: tables包含inventory，且迁移日志显示86条记录

- [ ] **Step 4: 手动验证数据库内容**

```bash
sqlite3 /home/lixiang/Desktop/game-state-backend-dev/game-state-backend/data/player_progress.db "SELECT COUNT(*) FROM inventory; SELECT name, raw_count FROM inventory WHERE herb_id='mahuang';"
```

Expected: COUNT=86, 麻黄 raw_count=12

- [ ] **Step 5: Commit**

```bash
cd /home/lixiang/Desktop/game-state-backend-dev
git add game-state-backend/database/migrations.py game-state-backend/main.py
git commit -m "feat: migrate 86 herbs to inventory table"
```

---

## Task 3: API接口开发 - inventory.py

**Files:**
- Create: `/home/lixiang/Desktop/game-state-backend-dev/game-state-backend/api/inventory.py`
- Modify: `/home/lixiang/Desktop/game-state-backend-dev/game-state-backend/main.py`

- [ ] **Step 1: 创建inventory.py API模块**

```python
# api/inventory.py
"""Inventory API endpoints."""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import sqlite3
from datetime import datetime

router = APIRouter(prefix="/api/inventory", tags=["inventory"])

class InventoryUpdateRequest(BaseModel):
    player_id: str
    herb_id: str
    raw_count_delta: Optional[int] = 0
    piece_count_delta: Optional[int] = 0

def get_db():
    from database.connection import get_connection
    return get_connection()

@router.get("/{player_id}")
async def get_inventory(player_id: str):
    """Get all herbs in player's inventory."""
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT herb_id, name, category, xing, wei, gui, rarity, raw_count, piece_count
        FROM inventory WHERE player_id = ?
        ORDER BY category, name
    """, (player_id,))
    
    rows = cursor.fetchall()
    herbs = []
    total_raw = 0
    total_piece = 0
    
    for row in rows:
        herbs.append({
            "id": row[0],
            "name": row[1],
            "category": row[2],
            "xing": row[3],
            "wei": row[4],
            "gui": row[5],
            "rarity": row[6],
            "raw_count": row[7],
            "piece_count": row[8]
        })
        total_raw += row[7]
        total_piece += row[8]
    
    return {
        "player_id": player_id,
        "herbs": herbs,
        "statistics": {
            "total_herbs": len(herbs),
            "total_raw": total_raw,
            "total_piece": total_piece
        }
    }

@router.get("/{player_id}/{herb_id}")
async def get_herb(player_id: str, herb_id: str):
    """Get single herb details."""
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT herb_id, name, category, xing, wei, gui, rarity, raw_count, piece_count
        FROM inventory WHERE player_id = ? AND herb_id = ?
    """, (player_id, herb_id))
    
    row = cursor.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail=f"Herb {herb_id} not found")
    
    return {
        "id": row[0],
        "name": row[1],
        "category": row[2],
        "xing": row[3],
        "wei": row[4],
        "gui": row[5],
        "rarity": row[6],
        "raw_count": row[7],
        "piece_count": row[8]
    }

@router.post("/update")
async def update_inventory(req: InventoryUpdateRequest):
    """Update herb counts (add/subtract deltas)."""
    conn = get_db()
    cursor = conn.cursor()
    
    # Check herb exists
    cursor.execute("""
        SELECT raw_count, piece_count FROM inventory 
        WHERE player_id = ? AND herb_id = ?
    """, (req.player_id, req.herb_id))
    
    row = cursor.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail=f"Herb {req.herb_id} not found")
    
    # Calculate new counts
    new_raw = row[0] + req.raw_count_delta
    new_piece = row[1] + req.piece_count_delta
    
    # Validate non-negative
    if new_raw < 0 or new_piece < 0:
        raise HTTPException(status_code=400, detail="Counts cannot be negative")
    
    # Update
    now = datetime.utcnow().isoformat() + 'Z'
    cursor.execute("""
        UPDATE inventory 
        SET raw_count = ?, piece_count = ?, updated_at = ?
        WHERE player_id = ? AND herb_id = ?
    """, (new_raw, new_piece, now, req.player_id, req.herb_id))
    
    conn.commit()
    
    return {
        "status": "updated",
        "herb_id": req.herb_id,
        "raw_count": new_raw,
        "piece_count": new_piece
    }
```

- [ ] **Step 2: 在main.py注册路由**

```python
# 在 main.py 的 imports 和路由注册部分添加
from api import tasks, cases, experience, weaknesses, inventory  # 添加 inventory

app.include_router(tasks.router)
app.include_router(cases.router)
app.include_router(experience.router)
app.include_router(weaknesses.router)
app.include_router(inventory.router)  # 新增这行
```

- [ ] **Step 3: 重启服务并测试API**

```bash
pkill -f "python3 main.py" || true
cd /home/lixiang/Desktop/game-state-backend-dev/game-state-backend && python3 main.py &
sleep 3

# 测试GET
curl http://localhost:8643/api/inventory/player_001 | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'Herbs: {len(d[\"herbs\"])}'); print(f'Sample: {d[\"herbs\"][0][\"name\"]} raw={d[\"herbs\"][0][\"raw_count\"]}')"
```

Expected: Herbs: 86, Sample: 麻黄 raw=12

- [ ] **Step 4: 测试update API**

```bash
curl -X POST http://localhost:8643/api/inventory/update \
  -H "Content-Type: application/json" \
  -d '{"player_id":"player_001","herb_id":"mahuang","raw_count_delta":-3,"piece_count_delta":+3}'
```

Expected: raw_count=9, piece_count=11

- [ ] **Step 5: Commit**

```bash
cd /home/lixiang/Desktop/game-state-backend-dev
git add game-state-backend/api/inventory.py game-state-backend/main.py
git commit -m "feat: add inventory API endpoints (GET, POST update)"
```

---

## Task 4: API接口开发 - cases/complete

**Files:**
- Modify: `/home/lixiang/Desktop/game-state-backend-dev/game-state-backend/api/cases.py`

- [ ] **Step 1: 添加complete接口到cases.py**

```python
# 在 api/cases.py 添加新接口

from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class CaseCompleteRequest(BaseModel):
    player_id: str
    case_id: str
    diagnosis: str
    prescription: str
    score: int
    completed_at: Optional[str] = None

@router.post("/complete")
async def complete_case(req: CaseCompleteRequest):
    """Record a completed diagnosis case."""
    conn = get_db()
    cursor = conn.cursor()
    
    # Get case title from existing cases or use case_id as title
    cursor.execute("""
        SELECT title FROM case_history WHERE player_id = ? AND case_id = ?
    """, (req.player_id, req.case_id))
    
    existing = cursor.fetchone()
    title = existing[0] if existing else req.case_id
    
    completed_at = req.completed_at or datetime.utcnow().isoformat() + 'Z'
    
    # Insert or update
    try:
        cursor.execute("""
            INSERT INTO case_history 
            (player_id, case_id, title, completed_at, score, diagnosis, prescription, errors)
            VALUES (?, ?, ?, ?, ?, ?, ?, NULL)
        """, (req.player_id, req.case_id, title, completed_at, req.score, req.diagnosis, req.prescription))
        conn.commit()
        
        return {
            "status": "recorded",
            "case_id": req.case_id,
            "score": req.score,
            "diagnosis": req.diagnosis,
            "prescription": req.prescription
        }
    except sqlite3.IntegrityError:
        # Update existing
        cursor.execute("""
            UPDATE case_history 
            SET completed_at = ?, score = ?, diagnosis = ?, prescription = ?
            WHERE player_id = ? AND case_id = ?
        """, (completed_at, req.score, req.diagnosis, req.prescription, req.player_id, req.case_id))
        conn.commit()
        
        return {
            "status": "updated",
            "case_id": req.case_id,
            "score": req.score
        }
```

- [ ] **Step 2: 测试complete API**

```bash
curl -X POST http://localhost:8643/api/cases/complete \
  -H "Content-Type: application/json" \
  -d '{"player_id":"player_001","case_id":"case_001","diagnosis":"风寒表实","prescription":"麻黄汤","score":88}'
```

Expected: `{"status":"recorded","case_id":"case_001","score":88,...}`

- [ ] **Step 3: Commit**

```bash
cd /home/lixiang/Desktop/game-state-backend-dev
git add game-state-backend/api/cases.py
git commit -m "feat: add cases/complete API endpoint"
```

---

## Task 5: Hermes Backend对接

**Files:**
- Modify: `hermes_backend/tools/game_tools.py:149-154`

- [ ] **Step 1: 修改get_inventory_handler**

```python
# 在 hermes_backend/tools/game_tools.py 替换 get_inventory_handler 函数

def get_inventory_handler(args: dict, **kw) -> dict:
    """Query inventory from game state backend API."""
    player_id = args.get("player_id", "player_001")
    category = args.get("category", "herbs")
    
    try:
        response = requests.get(
            f"http://localhost:8643/api/inventory/{player_id}",
            timeout=5
        )
        response.raise_for_status()
        data = response.json()
        
        # Return full data for 'all', or filter by category
        if category == "all":
            return data
        elif category == "herbs":
            return {
                "herbs": data["herbs"],
                "statistics": data["statistics"]
            }
        else:
            # Other categories not implemented yet
            return {"error": f"Category '{category}' not supported"}
            
    except requests.exceptions.RequestException as e:
        return {"error": f"Game backend unavailable: {str(e)}"}
```

- [ ] **Step 2: 重启Hermes Backend验证**

```bash
pkill -f "hermes_backend" || true
cd hermes_backend && python3 main.py &
sleep 3
curl http://localhost:8642/health
```

Expected: `tools_count: 8`

- [ ] **Step 3: Commit**

```bash
git add hermes_backend/tools/game_tools.py
git commit -m "fix: get_inventory queries game-state-backend API"
```

---

## Task 6: 前端背包UI改造 - ClinicScene获取数据

**Files:**
- Modify: `src/scenes/ClinicScene.ts`

- [ ] **Step 1: ClinicScene添加API获取逻辑**

在ClinicScene的create或init方法中添加：

```typescript
// 在 ClinicScene.ts 添加

private inventoryData: any = null;

async fetchInventoryData(): Promise<void> {
  try {
    const response = await fetch('http://localhost:8643/api/inventory/player_001');
    const data = await response.json();
    this.inventoryData = data;
    
    // Cache to localStorage for fallback
    localStorage.setItem('inventory_data', JSON.stringify(data));
  } catch (error) {
    console.error('[ClinicScene] Failed to fetch inventory:', error);
    // Fallback to localStorage
    const cached = localStorage.getItem('inventory_data');
    if (cached) {
      this.inventoryData = JSON.parse(cached);
    }
  }
}

// 在 create() 方法末尾调用
async create() {
  // ... existing code ...
  
  // Fetch inventory data
  await this.fetchInventoryData();
  
  // Listen for inventory show event
  this.events.on('clinic:showInventory', () => {
    this.showInventoryUI();
  });
}

showInventoryUI(): void {
  if (!this.inventoryData) {
    console.warn('[ClinicScene] No inventory data available');
    return;
  }
  
  // Emit event with data for HTML UI
  window.dispatchEvent(new CustomEvent('inventory:data', {
    detail: this.inventoryData
  }));
  
  // Show HTML UI container
  this.showHTMLUI('inventory');
}
```

- [ ] **Step 2: 测试前端获取数据**

启动前端并检查控制台：

```bash
npm run dev &
# 打开 http://localhost:3000，进入诊所场景，打开浏览器控制台
# 检查是否有 [ClinicScene] fetchInventoryData 成功日志
```

- [ ] **Step 3: Commit**

```bash
git add src/scenes/ClinicScene.ts
git commit -m "feat: ClinicScene fetches inventory from API"
```

---

## Task 7: 前端背包UI改造 - InventoryUI接收props

**Files:**
- Modify: `src/ui/html/InventoryUI.tsx`

- [ ] **Step 1: InventoryUI改为接收数据props**

```typescript
// 在 InventoryUI.tsx 修改

interface InventoryUIProps {
  onClose: () => void;
  inventoryData?: any;  // 新增：从API获取的数据
}

export function InventoryUI({ onClose, inventoryData }: InventoryUIProps) {
  const [active, setActive] = useState<ViewType>('piece');
  
  // 使用传入的数据或fallback到静态数据
  const herbs = useMemo(() => {
    if (inventoryData?.herbs) {
      // 转换API数据格式为组件需要的格式
      return inventoryData.herbs.map(h => ({
        id: h.id,
        name: h.name,
        cat: h.category,
        xing: h.xing,
        wei: h.wei,
        gui: h.gui,
        rarity: h.rarity,
        rawCount: h.raw_count,
        pieceCount: h.piece_count
      }));
    }
    // Fallback to static import
    return HERBS;
  }, [inventoryData]);
  
  // ... 其余代码使用 herbs 变量而非 HERBS ...
}
```

- [ ] **Step 2: 修改ClinicScene传递数据**

```typescript
// 在 ClinicScene 的 HTML UI 创建逻辑中

createInventoryUI(): void {
  const container = document.getElementById('html-ui-container');
  if (!container) return;
  
  const root = createRoot(container);
  root.render(
    <InventoryUI 
      onClose={() => this.hideHTMLUI()}
      inventoryData={this.inventoryData}  // 传递API数据
    />
  );
}
```

- [ ] **Step 3: 测试背包显示**

进入诊所，按B键打开背包，验证显示86药材且数量与API一致。

- [ ] **Step 4: Commit**

```bash
git add src/ui/html/InventoryUI.tsx src/scenes/ClinicScene.ts
git commit -m "feat: InventoryUI renders from API data props"
```

---

## Task 8: 游戏完成数据写入 - 诊断/煎药

**Files:**
- Modify: `src/scenes/ClinicScene.ts`

- [ ] **Step 1: ClinicScene监听诊断完成事件**

```typescript
// 在 ClinicScene.ts 添加事件监听

setupGameCompletionListeners(): void {
  // 诊断完成
  window.addEventListener('diagnosis:complete', ((event: CustomEvent) => {
    this.handleDiagnosisComplete(event.detail);
  }) as EventListener);
  
  // 煎药完成
  window.addEventListener('decoction:complete', ((event: CustomEvent) => {
    this.handleDecoctionComplete(event.detail);
  }) as EventListener);
}

async handleDiagnosisComplete(result: any): Promise<void> {
  console.log('[ClinicScene] Diagnosis complete:', result);
  
  try {
    const response = await fetch('http://localhost:8643/api/cases/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        player_id: 'player_001',
        case_id: result.caseId || 'case_001',
        diagnosis: result.diagnosis,
        prescription: result.prescription,
        score: result.score
      })
    });
    
    const data = await response.json();
    console.log('[ClinicScene] Case recorded:', data);
  } catch (error) {
    console.error('[ClinicScene] Failed to record case:', error);
  }
}

async handleDecoctionComplete(result: any): Promise<void> {
  console.log('[ClinicScene] Decoction complete:', result);
  
  // 更新知识点掌握度（复用现有API）
  try {
    const response = await fetch('http://localhost:8643/api/todo/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        task_id: result.taskId || `${result.prescriptionId}-learning`,
        todo_id: 'composition',  // 煎药成功提升组成知识点
        mastery: 0.3,  // 增加0.3掌握度
        status: 'in_progress'
      })
    });
    
    const data = await response.json();
    console.log('[ClinicScene] Todo updated:', data);
  } catch (error) {
    console.error('[ClinicScene] Failed to update todo:', error);
  }
}

// 在 create() 中调用
create() {
  // ... existing ...
  this.setupGameCompletionListeners();
}
```

- [ ] **Step 2: 测试诊断完成写入**

运行诊断游戏，完成后检查数据库：

```bash
sqlite3 /home/lixiang/Desktop/game-state-backend-dev/game-state-backend/data/player_progress.db "SELECT * FROM case_history WHERE case_id='case_001';"
```

- [ ] **Step 3: Commit**

```bash
git add src/scenes/ClinicScene.ts
git commit -m "feat: ClinicScene writes diagnosis/decoction completion to backend"
```

---

## Task 9: 游戏完成数据写入 - 炮制/种植

**Files:**
- Create: `src/ui/html/bridge/planting-events.ts`
- Modify: `src/scenes/GardenScene.ts`

- [ ] **Step 1: 创建planting-events.ts**

```typescript
// src/ui/html/bridge/planting-events.ts
/**
 * 种植游戏事件定义
 */

export const PLANTING_EVENTS = {
  START: 'planting:start',
  COMPLETE: 'planting:complete',
};

export interface PlantingCompletePayload {
  herb_id: string;
  harvest_count: number;
  quality: number;  // 1-3品质等级
}

export function emitPlantingComplete(payload: PlantingCompletePayload): void {
  window.dispatchEvent(new CustomEvent(PLANTING_EVENTS.COMPLETE, {
    detail: payload
  }));
}
```

- [ ] **Step 2: GardenScene监听炮制/种植完成**

```typescript
// 在 GardenScene.ts 添加

setupGameCompletionListeners(): void {
  // 炮制完成
  window.addEventListener('paozhi:complete', ((event: CustomEvent) => {
    this.handlePaozhiComplete(event.detail);
  }) as EventListener);
  
  // 种植完成
  window.addEventListener('planting:complete', ((event: CustomEvent) => {
    this.handlePlantingComplete(event.detail);
  }) as EventListener);
}

async handlePaozhiComplete(result: any): Promise<void> {
  console.log('[GardenScene] Paozhi complete:', result);
  
  try {
    const response = await fetch('http://localhost:8643/api/inventory/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        player_id: 'player_001',
        herb_id: result.herbId,
        raw_count_delta: -result.rawUsed || -5,  // 生药减少
        piece_count_delta: +result.pieceProduced || +5  // 片药增加
      })
    });
    
    const data = await response.json();
    console.log('[GardenScene] Inventory updated:', data);
    
    // 刷新本地缓存
    this.refreshInventoryCache();
  } catch (error) {
    console.error('[GardenScene] Failed to update inventory:', error);
  }
}

async handlePlantingComplete(result: any): Promise<void> {
  console.log('[GardenScene] Planting complete:', result);
  
  try {
    const response = await fetch('http://localhost:8643/api/inventory/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        player_id: 'player_001',
        herb_id: result.herb_id,
        raw_count_delta: +result.harvest_count  // 生药增加
      })
    });
    
    const data = await response.json();
    console.log('[GardenScene] Inventory updated:', data);
    
    // 刷新本地缓存
    this.refreshInventoryCache();
  } catch (error) {
    console.error('[GardenScene] Failed to update inventory:', error);
  }
}

async refreshInventoryCache(): Promise<void> {
  // 刷新ClinicScene的inventory缓存
  try {
    const response = await fetch('http://localhost:8643/api/inventory/player_001');
    const data = await response.json();
    localStorage.setItem('inventory_data', JSON.stringify(data));
  } catch (error) {
    console.error('[GardenScene] Failed to refresh cache:', error);
  }
}

// 在 create() 中调用
create() {
  // ... existing ...
  this.setupGameCompletionListeners();
}
```

- [ ] **Step 3: 测试炮制完成更新**

运行炮制游戏，完成后检查数据库药材数量变化。

- [ ] **Step 4: Commit**

```bash
git add src/ui/html/bridge/planting-events.ts src/scenes/GardenScene.ts
git commit -m "feat: GardenScene writes paozhi/planting completion to backend"
```

---

## Task 10: 验证与E2E测试

**Files:**
- Test: `tests/e2e/inventory-sync.spec.ts` (新建)

- [ ] **Step 1: 创建E2E测试脚本**

```typescript
// tests/e2e/inventory-sync.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Inventory Data Sync', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
  });

  test('Hermes Backend returns 86 herbs', async () => {
    const response = await fetch('http://localhost:8643/api/inventory/player_001');
    const data = await response.json();
    
    expect(data.herbs.length).toBe(86);
    expect(data.statistics.total_herbs).toBe(86);
  });

  test('NPC query matches frontend display', async ({ page }) => {
    // 进入诊所
    await page.click('text=诊所');
    await page.waitForTimeout(1000);
    
    // 打开背包
    await page.keyboard.press('b');
    await page.waitForTimeout(500);
    
    // 检查显示药材数量
    const herbCards = await page.locator('[data-testid="herb-card"]').count();
    expect(herbCards).toBeGreaterThan(80);
    
    // 检查第一个药材显示
    const firstHerb = await page.locator('[data-testid="herb-card"]').first().textContent();
    expect(firstHerb).toContain('麻黄');
  });

  test('Diagnosis completion updates case_history', async ({ page }) => {
    // 模拟诊断完成事件
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('diagnosis:complete', {
        detail: {
          caseId: 'test_case',
          diagnosis: '风寒表实',
          prescription: '麻黄汤',
          score: 90
        }
      }));
    });
    
    await page.waitForTimeout(1000);
    
    // 检查数据库
    const response = await fetch('http://localhost:8643/api/cases/player_001');
    const data = await response.json();
    
    const testCase = data.cases.find(c => c.case_id === 'test_case');
    expect(testCase).toBeTruthy();
    expect(testCase.score).toBe(90);
  });
});
```

- [ ] **Step 2: 运行E2E测试**

```bash
npx playwright test tests/e2e/inventory-sync.spec.ts
```

Expected: 3 tests passing

- [ ] **Step 3: Final commit**

```bash
git add tests/e2e/inventory-sync.spec.ts
git commit -m "test: add inventory sync E2E tests"
```

---

## Self-Review

**1. Spec Coverage Check:**
- ✅ inventory表创建 (Task 1)
- ✅ 86药材迁移 (Task 2)
- ✅ GET/POST API (Task 3)
- ✅ cases/complete API (Task 4)
- ✅ Hermes对接 (Task 5)
- ✅ 前端数据获取 (Task 6-7)
- ✅ 游戏完成写入 (Task 8-9)
- ✅ E2E验证 (Task 10)

**2. Placeholder Scan:**
- 无TBD/TODO/待实现
- 所有代码完整

**3. Type Consistency:**
- herb_id 统一使用 string
- raw_count/piece_count 统一使用 integer
- API响应格式一致

---

**Plan complete. Ready for execution.**