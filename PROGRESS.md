# 药灵山谷 - 当前进行中状态

**最后更新**: 2026-05-16
**核心问题**: "我们正在做什么？进展如何？"
**当前状态**: Phase 2.5 DialogUI HTML嵌入 - 待实现
**当前分支**: `hermes_dev`

---

## 当前任务：DialogUI HTML嵌入方案 (Phase 2.5)

### 任务概述

将对话UI从Phaser实现迁移到React HTML嵌入，实现：
- 卷轴风古风界面
- 富文本教学标记 `[[herb:黄芪]]`
- 多轮对话历史（最多50条）

### 设计文档 ✅

**路径**: `docs/superpowers/specs/phase2.5/2026-05-14-dialog-ui-html-embedding-design.md`

**评审状态**: 已通过评审（2026-05-15）

**关键更新**:
| 更新项 | 内容 |
|--------|------|
| 接口定义 | DialogUIProps, DialogMessage, TCMEntry, GameStateBridge方法签名 |
| 路径修正 | GameStateBridge: `src/systems/` → `src/utils/` |
| 旧代码处理 | 实现完成后删除 DialogUI.ts |
| 对话历史限制 | 最多50条，超出裁剪最早记录 |
| 边界情况测试 | SSE失败、超时、空输入等 |
| 视觉验收量化 | CSS选择器验证而非主观判断 |

### 实现计划 ✅

**路径**: `docs/superpowers/plans/2026-05-14-dialog-ui-html-embedding.md`

**任务数量**: 11个任务

| Task | 内容 | 状态 |
|------|------|------|
| 1 | 事件桥接层 | ⏳ 待实现 |
| 2 | 教学数据库 | ⏳ 待实现 |
| 3 | 古风卷轴样式 | ⏳ 待实现 |
| 4 | React入口挂载 | ⏳ 待实现 |
| 5 | DialogUI主组件 | ⏳ 待实现 |
| 6 | GameStateBridge扩展 | ⏳ 待实现 |
| 7 | GardenScene集成 | ⏳ 待实现 |
| 8 | ClinicScene集成 | ⏳ 待实现 |
| 9 | E2E测试迁移 | ⏳ 待实现 |
| 10 | 删除旧DialogUI.ts | ⏳ 待实现 |
| 11 | 构建验证 | ⏳ 待实现 |

### 文件变更清单

| 文件 | 类型 | 职责 |
|------|------|------|
| `src/ui/html/bridge/dialog-events.ts` | Create | 事件常量定义 |
| `src/ui/html/dialog-entry.tsx` | Create | React入口挂载 |
| `src/ui/html/DialogUI.tsx` | Create | React主组件 |
| `src/ui/html/dialog.css` | Create | 古风卷轴样式 |
| `src/ui/html/data/tcm-data.ts` | Create | 教学数据库 |
| `src/utils/GameStateBridge.ts` | Modify | 对话历史存储 |
| `src/scenes/GardenScene.ts` | Modify | 集成showDialogUI |
| `src/scenes/ClinicScene.ts` | Modify | 集成showDialogUI |
| `tests/e2e/npc-dialog.spec.ts` | Modify | DOM选择器调整 |
| `src/ui/DialogUI.ts` | Delete | 实现完成后删除 |

### 验收标准

**功能验收**:
| 标准 | 通过条件 |
|------|----------|
| 对话UI显示 | `.dialog-scroll` visible |
| 富文本标记 | `.tcm-herb` hover后 `.tcm-tooltip` opacity=1 |
| 对话历史 | 关闭再开历史存在，最多50条 |
| Tool Call触发 | 场景切换事件触发 |

**边界情况**:
| 场景 | 预期行为 |
|------|----------|
| SSE连接失败 | 显示"连接失败" |
| 空输入发送 | 不发送，保持焦点 |
| 历史超50条 | 自动裁剪最早记录 |

**最终验收**:
- `npm run build` 无TS错误
- `npm run test:e2e` 21/21 通过

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

### E2E 测试验收 ✅

**测试结果**: 19/19 通过 (100%)

**测试文件**: `tests/e2e/npc-dialog.spec.ts`

| 类别 | 测试数量 | 通过率 |
|------|----------|--------|
| Smoke Tests | 3 | 100% |
| Trigger Tests | 4 | 100% |
| Dialog Flow Tests | 5 | 100% |
| Tool Call Tests | 4 | 100% |
| Quality Tests | 3 | 100% |


---

## 下一步 TODO

### 立即执行

1. **执行实现计划 Task 1-11** - DialogUI HTML嵌入

---

*本文档由 Claude Code 维护*