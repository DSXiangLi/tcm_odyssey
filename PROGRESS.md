# 药灵山谷 - 当前任务跟踪

**最后更新**: 2026-05-06
**当前状态**: Phase 2.5 病案集/炮制HTML嵌入 - 设计完成，待执行

---

## 进行中：病案集与炮制HTML嵌入 (Phase 2.5)

### 设计完成 (2026-05-06)

**已完成文档**:
- [设计文档](docs/superpowers/specs/phase2.5/2026-05-06-casebook-paozhi-embedding-design.md) ✅
- [实施计划](docs/superpowers/plans/2026-05-06-casebook-paozhi-embedding.md) ✅

**待执行任务**:
| 序号 | 任务 | 状态 |
|-----|------|------|
| Task 1 | 病案集事件定义 (`casebook-events.ts`) | ⏳ |
| Task 2 | 病案集数据迁移 (`casebook-data.ts`) | ⏳ |
| Task 3 | 病案集CSS迁移 (`casebook.css`) | ⏳ |
| Task 4 | 病案集React组件迁移 (`CasebookUI.tsx`) | ⏳ |
| Task 5 | 病案集Entry文件 (`casebook-entry.tsx`) | ⏳ |
| Task 6 | 病案集Phaser场景 (`CasebookScene.ts`) | ⏳ |
| Task 7 | ClinicScene集成C键触发 | ⏳ |
| Task 8 | 注册病案集场景 | ⏳ |
| Task 9-15 | 炮制游戏实施（同模式） | ⏳ |
| Task 16 | E2E测试 | ⏳ |

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

选择执行方式后开始Task 1：

1. **Subagent-Driven (推荐)** - 每个Task独立子代理，中间验证
2. **Inline Execution** - 批量执行，checkpoint检查

---

*本文档由 Claude Code 维护*