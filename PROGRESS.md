# 药灵山谷 - 当前进行中状态

**最后更新**: 2026-05-14
**核心问题**: "我们正在做什么？进展如何？"
**当前状态**: Phase 2.5 Hermes NPC后端开发 - 基础完成 ✅
**当前分支**: `hermes_dev`
**Git提交**: `f5912d8`

---

## 已完成：Hermes NPC 后端基础设施 (Phase 2.5)

### 技术架构 ✅

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

### 已完成文件 ✅

| 文件 | 行数 | 功能 | 状态 |
|------|------|------|------|
| `hermes_backend/main.py` | 122 | FastAPI入口、CORS、API端点 | ✅ |
| `hermes_backend/gateway/stream_consumer.py` | 220+ | SSE流处理、LLM调用、工具执行 | ✅ |
| `hermes_backend/gateway/game_adapter.py` | 130+ | Mock游戏状态存储 | ✅ |
| `hermes_backend/gateway/dialog_logger.py` | 100+ | 对话日志JSON记录 | ✅ |
| `hermes_backend/tools/registry.py` | 80+ | 工具注册中心 | ✅ |
| `hermes_backend/tools/game_tools.py` | 270+ | 6个游戏工具定义 | ✅ |
| `hermes_backend/models/chat.py` | 30+ | ChatRequest/ChatResponse模型 | ✅ |

### API 端点 ✅

| 端点 | 方法 | 功能 | 状态 |
|------|------|------|------|
| `/health` | GET | 健康检查 (npcs, tools_count) | ✅ |
| `/v1/chat/stream` | POST | SSE流式对话 | ✅ |
| `/v1/chat` | POST | 非流式对话 (返回完整响应+tool_calls) | ✅ |
| `/v1/npc/{npc_id}/status` | GET | NPC状态查询 | ✅ |

### NPC 工具系统 (6个工具) ✅

| 工具 | 功能 | 调用时机示例 |
|------|------|--------------|
| `get_learning_progress` | 查询学习进度 | 学生问"我学到哪了" |
| `get_case_progress` | 查询病案进度 | 了解实践情况 |
| `get_inventory` | 查询背包内容 | 了解药材拥有 |
| `trigger_minigame` | 触发小游戏 | 学生请求"试试煎药" |
| `record_weakness` | 记录学习弱点 | 发现理解偏差 |
| `get_npc_memory` | 获取NPC记忆 | 查询历史互动 |

### NPC 定义文件 ✅

```
hermes/npcs/qingmu/
├── SOUL.md         # NPC性格、教学风格 (7957 bytes)
├── MEMORY.md       # 记忆系统定义 (1216 bytes)
├── SYLLABUS.md     # 教学大纲 (2744 bytes)
├── TASKS.json      # 学习任务配置 (5154 bytes)
└── USER.md         # 用户交互模板 (557 bytes)
```

### E2E 测试验收 ✅

**测试结果**: 19/19 通过 (100%)

**测试文件**: `tests/e2e/npc-dialog.spec.ts`

| 类别 | 测试数量 | 通过率 | 测试内容 |
|------|----------|--------|----------|
| Smoke Tests (NPC-S01~S03) | 3 | 100% | 后端健康、NPC纹理、DialogUI渲染 |
| Trigger Tests (NPC-T01~T04) | 4 | 100% | 场景进入、NPC检测、空格键、多NPC切换 |
| Dialog Flow Tests (NPC-D01~D05) | 5 | 100% | 输入状态、用户输入、流式响应、停止、关闭 |
| Tool Call Tests (NPC-TC01~TC04) | 4 | 100% | 学习进度、小游戏触发、弱点记录、场景切换 |
| Quality Tests (NPC-Q01~Q03) | 3 | 100% | 引导提问、多轮连贯、工具时机 |

### 关键修复记录 (2026-05-11)

| 问题 | 根因 | 修复文件 |
|------|------|----------|
| CORS阻止前端访问 | 只允许localhost:5173 | `main.py` 添加3000端口 |
| player_id上下文丢失 | 工具执行未传递请求参数 | `stream_consumer.py` |
| global变量错误 | `_game_store`未声明 | `game_adapter.py` |
| handler KeyError | 直接访问args键 | `game_tools.py` .get() |
| 测试超时 | 30秒不够LLM响应 | `npc-dialog.spec.ts` 60秒 |

---

## 待开发：Hermes NPC 后端增强

### 1. NPC 扩展 ⏳

当前只有 `qingmu`，需要添加：
- `laozhang` (药园老张) - 种植/炮制指导
- `neighbor` (邻居角色) - 生活互动

**待创建文件**:
```
hermes/npcs/laozhang/
├── SOUL.md         # 老张性格（朴实、经验丰富）
├── MEMORY.md       # 记忆系统
├── SYLLABUS.md     # 种植/炮制大纲
├── TASKS.json      # 相关任务
└── USER.md         # 交互模板

hermes/npcs/neighbor/
├── SOUL.md         # 邻居性格
├── MEMORY.md
├── SYLLABUS.md
├── TASKS.json
└── USER.md
```

### 2. 真实数据存储 ⏳

当前 MockGameStore/MockUserStore 为假数据：
- 需要连接真实游戏状态
- player_id → 实际存档数据
- inventory → 实际背包数据
- learning_progress → 实际学习记录

### 3. 工具执行反馈 ⏳

- `trigger_minigame` → 实际触发场景切换
- 工具执行结果通知前端
- UI反馈展示工具调用状态

### 4. 对话日志分析 ⏳

日志存储在 `hermes_backend/logs/dialog/qingmu/2026-05-07/`
- 需要日志分析工具
- 教学效果可视化
- NPC改进建议生成

### 5. NPC 个性化增强 ⏳

- 不同NPC教学风格差异实现
- 记忆系统与对话内容关联
- 学习进度持久化存储

---

## Phase 2.5 总体进度

| 模块 | 状态 | 测试通过率 |
|------|------|------------|
| Hermes后端基础设施 | ✅ 基础完成 | 19/19 (100%) |
| NPC对话验收 | ✅ | 19/19 (100%) |
| 真实数据存储 | ⏳ 待开发 | - |
| 工具执行反馈 | ⏳ 待开发 | - |
| NPC扩展 (laozhang/neighbor) | ⏳ 待开发 | - |

---

## 下一步 TODO

### Hermes NPC 后端开发 (hermes_dev分支)

1. **创建 laozhang NPC** - 药园种植/炮制指导
2. **创建 neighbor NPC** - 生活互动角色
3. **真实数据存储** - MockGameStore → 实际游戏状态
4. **工具执行反馈** - trigger_minigame → 实际场景切换
5. **对话日志分析** - 教学效果可视化

---

*本文档由 Claude Code 维护*