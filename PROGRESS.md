# 药灵山谷 - 当前进行中状态

**最后更新**: 2026-05-14
**核心问题**: "我们正在做什么？进展如何？"
**当前状态**: Phase 2.5 Hermes NPC后端开发 - 基础完成 ✅
**当前分支**: `hermes_dev`
**Git提交**: `e2e20de`

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

## 开发辅助维护 (2026-05-14)

### PreCompact Hook 优化 ✅

**重大改进**: 从JSON输出改为Claude自主使用工具

| 变更点 | 原方案 | 新方案 |
|--------|--------|--------|
| 输出格式 | JSON结构化输出 | Claude自主调用工具 |
| 文档更新 | Hook解析JSON后写入 | Claude直接Edit/Write |
| 判断逻辑 | Hook硬编码规则 | Claude根据prompt自主判断 |
| 输出累积 | 累积assistant文本 | 仅监控工具调用 |

**实现文件**: `.claude/hooks/precompact-unified.py`

---

## 新任务启动：DialogUI HTML嵌入方案 (Phase 2.5) - 2026-05-15

### 背景

当前DialogUI.ts使用Phaser GameObject Container渲染，存在以下问题：
1. 无富文本支持（无法显示加粗、变色）
2. 无历史记录功能
3. 古风卷轴风格无法完美呈现

### 设计方案 ✅

**设计文档**: `docs/superpowers/specs/phase2.5/2026-05-14-dialog-ui-html-embedding-design.md`

| 章节 | 内容 |
|------|------|
| 问题定义 | 当前DialogUI缺陷分析 |
| 边界定义 | 包含：药园青木对话、诊所NPC交互；不包含：诊断场景内对话 |
| 系统集成 | React组件 + document.body挂载 + 事件桥接 |
| 验收标准 | E2E测试 + AI验收 ≥ 85分 |

### 实现计划 ✅

**计划文档**: `docs/superpowers/plans/2026-05-14-dialog-ui-html-embedding.md`

**10个任务**:
| Task | 内容 | 关键文件 |
|------|------|----------|
| 1 | 事件桥接层 | `src/ui/dialog-events.ts` |
| 2 | 教学数据库 | `src/ui/tcm-data.ts` |
| 3 | 古风卷轴样式 | `src/ui/dialog.css` |
| 4 | React入口挂载 | `src/ui/dialog-entry.tsx` |
| 5 | DialogUI主组件 | `src/ui/DialogUI.tsx` |
| 6 | GameStateBridge扩展 | `src/systems/GameStateBridge.ts` |
| 7 | GardenScene集成 | `src/scenes/GardenScene.ts` |
| 8 | ClinicScene集成 | `src/scenes/ClinicScene.ts` |
| 9 | E2E测试 | `tests/e2e/dialog-ui.spec.ts` |
| 10 | AI验收 | 验收脚本 |

### 技术架构对比

| 层面 | 当前 DialogUI.ts | HTML嵌入方案 |
|------|------------------|--------------|
| 渲染层 | Phaser GameObject Container | React组件 + document.body挂载 |
| 样式 | Phaser Graphics绘制 | CSS + 古风字体 |
| 数据流 | DialogUI ↔ SSEClient ↔ Hermes | React ↔ bridge/events ↔ Phaser ↔ Hermes |
| 生命周期 | Phaser Scene管理 | entry文件createRoot/unmount |

### 下一步

执行实现计划，按Task 1-10顺序开发。

---

*本文档由 Claude Code 维护*