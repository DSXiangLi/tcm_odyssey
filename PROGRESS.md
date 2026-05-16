# 药灵山谷 - 当前进行中状态

**最后更新**: 2026-05-16
**核心问题**: "我们正在做什么？进展如何？"
**当前状态**: Phase 2.5 DialogUI HTML嵌入 - 已完成 ✅
**当前分支**: `hermes_dev`

---

## 已完成：DialogUI HTML嵌入方案 (Phase 2.5) ✅

### 完成时间

**开始**: 2026-05-16 14:00
**完成**: 2026-05-16 14:30
**总提交**: 15 commits

### 实现内容

将对话UI从Phaser实现迁移到React HTML嵌入，实现：
- ✅ 卷轴风古风界面（木轴装饰、宣纸纹理、古风字体）
- ✅ 富文本教学标记 `[[herb:黄芪]]` hover显示tooltip
- ✅ 多轮对话历史（最多50条，自动裁剪）
- ✅ SSE流处理在React层
- ✅ Tool Call通过bridge事件触发Phaser场景切换
- ✅ GameStateBridge对话历史持久化

### 任务完成状态

| Task | 内容 | 状态 |
|------|------|------|
| 1 | 事件桥接层 `dialog-events.ts` | ✅ 已完成 |
| 2 | 教学数据库 `tcm-data.ts` | ✅ 已完成 |
| 3 | 古风卷轴样式 `dialog.css` | ✅ 已完成 |
| 4 | React入口挂载 `dialog-entry.tsx` | ✅ 已完成 |
| 5 | DialogUI主组件 `DialogUI.tsx` | ✅ 已完成 |
| 6 | GameStateBridge扩展 | ✅ 已完成 |
| 7 | GardenScene集成 | ✅ 已完成 |
| 8 | ClinicScene集成 | ✅ 已完成 |
| 9 | E2E测试迁移 | ✅ 已完成（21个测试）|
| 10 | 删除旧DialogUI.ts | ✅ 已完成 |
| 11 | 构建验证 | ✅ 已完成 |

### 关键提交记录

| Commit | 描述 |
|--------|------|
| `4b701b6` | feat(dialog): complete React HTML-embedded DialogUI implementation |
| `ca657af` | fix(dialog): remove unused hideDialogUI import |
| `5628e12` | fix: remove stale DialogUI exports from index.ts |
| `34f0dc3` | chore: remove old Phaser DialogUI.ts |
| `681a794` | test(dialog): add quantified visual verification tests |
| `2e4202a` | test(dialog): migrate E2E tests to React DOM selectors |
| `fa10eb8` | feat(clinic): integrate React DialogUI |
| `b088c0c` | feat(garden): integrate React DialogUI via showDialogUI |
| `07459f6` | feat(dialog): add React entry mount point |
| `38d205d` | fix(dialog): prevent memory leak and stale closure |
| `c4d04bf` | fix(dialog): use GameStateBridge for dialog history |
| `f574798` | feat(bridge): add dialog history storage methods |

### 创建文件

| 文件 | 行数 | 职责 |
|------|------|------|
| `src/ui/html/bridge/dialog-events.ts` | 26 | 事件常量定义 |
| `src/ui/html/dialog-entry.tsx` | 70 | React入口挂载 |
| `src/ui/html/DialogUI.tsx` | 298 | React主组件 |
| `src/ui/html/dialog.css` | 414 | 古风卷轴样式 |
| `src/ui/html/data/tcm-data.ts` | 109 | 教学数据库 |

### 修改文件

| 文件 | 变更 |
|------|------|
| `src/utils/GameStateBridge.ts` | +39 对话历史方法 |
| `src/scenes/GardenScene.ts` | 替换DialogUI为showDialogUI |
| `src/scenes/ClinicScene.ts` | 替换DialogUI为showDialogUI |
| `tests/e2e/npc-dialog.spec.ts` | DOM选择器迁移+新增边界测试 |

### 删除文件

- `src/ui/DialogUI.ts` - 旧Phaser实现（422行）

### 验收结果

**构建验证**: ✅ 通过（仅预先存在的unused var警告）

**E2E测试**: 21个测试
- Smoke Tests (NPC-S01~S03): 3个
- Trigger Tests (NPC-T01~T04): 4个
- Dialog Flow Tests (NPC-D01~D05): 5个
- Tool Call Tests (NPC-TC01~TC04): 4个
- Quality Tests (NPC-Q01~Q03): 3个
- Boundary Tests (NPC-B01~B02): 2个（新增）

**量化视觉标准验证**:
- `.scroll-bar-top` 高度24px ✅
- `.dialog-paper` 背景色 rgb(240, 230, 210) ✅
- `.dialog-seal` 显示NPC首字 ✅
- `.tcm-tooltip` hover后 opacity=1 ✅

---

## 已完成：Hermes NPC 后端基础设施 (Phase 2.5) ✅

### 技术架构

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

---

## 下一步 TODO

### Phase 2.5 剩余任务

1. **种植小游戏** - 入口已存在，待开发
2. **卡片翻转时间调整** - 按用户反馈优化动画等待时间

---

*本文档由 Claude Code 维护*