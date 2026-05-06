# 药灵山谷 - 当前任务跟踪

**最后更新**: 2026-05-06
**当前状态**: Phase 2.5 病案集HTML嵌入 - Task 1已完成，Task 2待执行

---

## 进行中：病案集与炮制HTML嵌入 (Phase 2.5)

### 设计完成 (2026-05-06)

**已完成文档**:
- [设计文档](docs/superpowers/specs/phase2.5/2026-05-06-casebook-paozhi-embedding-design.md) ✅
- [实施计划](docs/superpowers/plans/2026-05-06-casebook-paozhi-embedding.md) ✅

### 任务执行进度

| 序号 | 任务 | 状态 | 提交 |
|-----|------|------|------|
| Task 1 | 病案集事件定义 (`casebook-events.ts`) | ✅ | `764ac1f` |
| Task 2 | 病案集数据迁移 (`casebook-data.ts`) | ⏳ | - |
| Task 3 | 病案集CSS迁移 (`casebook.css`) | ⏳ | - |
| Task 4 | 病案集React组件迁移 (`CasebookUI.tsx`) | ⏳ | - |
| Task 5 | 病案集Entry文件 (`casebook-entry.tsx`) | ⏳ | - |
| Task 6 | 病案集Phaser场景 (`CasebookScene.ts`) | ⏳ | - |
| Task 7 | ClinicScene集成C键触发 | ⏳ | - |
| Task 8 | 注册病案集场景 | ⏳ | - |
| Task 9-15 | 炮制游戏实施（同模式） | ⏳ | - |
| Task 16 | E2E测试 | ⏳ | - |

### Task 1 完成详情

**创建文件**: `src/ui/html/bridge/casebook-events.ts`

**事件定义**:
- `START_CASE`: 'casebook:start_case' (开案问诊)
- `REPLAY_CASE`: 'casebook:replay_case' (重新参详)
- `CLOSE`: 'casebook:close' (关闭病案集)
- `RESULT`: 'casebook:result' (诊断结果返回)
- `STATE_UPDATE`: 'casebook:state:update' (更新状态)

### 架构概述

**病案集**:
- 触发: ClinicScene + `C`键
- 功能: 病案查看、开案问诊触发诊断、诊断结果回写
- 集成: 与DiagnosisScene双向通信

**炮制**:
- 触发: GardenScene + `P`键
- 功能: 药材炮制、品质评分、添加到背包
- 集成: 与InventoryScene单向通信（添加炮制品）

---

## 下一步行动

**从 Task 2 继续**：使用 Subagent-Driven 模式执行剩余任务

恢复对话后执行：
```
/resume-session
```

或直接继续Task 2:
```
继续执行 docs/superpowers/plans/2026-05-06-casebook-paozhi-embedding.md 中的Task 2-8（病案集部分）
```

---

*本文档由 Claude Code 维护*