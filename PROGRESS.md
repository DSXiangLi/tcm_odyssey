# 药灵山谷 - 当前任务跟踪

**最后更新**: 2026-05-07
**当前状态**: Phase 2.5 病案集与炮制HTML嵌入 - 全部完成，待E2E测试

---

## 已完成：病案集与炮制HTML嵌入 (Phase 2.5)

### 设计与实施全部完成

**已完成文档**:
- [设计文档](docs/superpowers/specs/phase2.5/2026-05-06-casebook-paozhi-embedding-design.md) ✅
- [实施计划](docs/superpowers/plans/2026-05-06-casebook-paozhi-embedding.md) ✅

### 任务执行进度

#### 病案集 (Task 1-8)

| 序号 | 任务 | 状态 | 文件 |
|-----|------|------|------|
| Task 1 | 病案集事件定义 | ✅ | `src/ui/html/bridge/casebook-events.ts` |
| Task 2 | 病案集数据迁移 | ✅ | `src/data/casebook-data.ts` |
| Task 3 | 病案集CSS迁移 | ✅ | `src/ui/html/casebook.css` |
| Task 4 | 病案集React组件迁移 | ✅ | `src/ui/html/CasebookUI.tsx` |
| Task 5 | 病案集Entry文件 | ✅ | `src/ui/html/casebook-entry.tsx` |
| Task 6 | 病案集Phaser场景 | ✅ | `src/scenes/CasebookScene.ts` |
| Task 7 | ClinicScene集成C键触发 | ✅ | `src/scenes/ClinicScene.ts` |
| Task 8 | 注册病案集场景 | ✅ | `src/config/game.config.ts` |

#### 炮制 (Task 9-15)

| 序号 | 任务 | 状态 | 文件 |
|-----|------|------|------|
| Task 9 | 炮制事件定义 | ✅ | `src/ui/html/bridge/paozhi-events.ts` |
| Task 10 | 炮制数据迁移 | ✅ | `src/data/paozhi-data.ts` |
| Task 11 | 炮制CSS迁移 | ✅ | `src/ui/html/paozhi.css` |
| Task 12 | 炮制React组件迁移 | ✅ | `src/ui/html/PaozhiUI.tsx` |
| Task 13 | 炮制Entry文件 | ✅ | `src/ui/html/paozhi-entry.tsx` |
| Task 14 | 炮制Phaser场景 | ✅ | `src/scenes/PaozhiScene.ts` |
| Task 15 | GardenScene集成P键触发并注册 | ✅ | `src/scenes/GardenScene.ts` + `src/config/game.config.ts` |

### 待执行

| 序号 | 任务 | 状态 |
|-----|------|------|
| Task 16 | E2E测试 | ⏳ |

### 功能概述

**病案集**:
- 触发: ClinicScene + `C`键
- 功能: 6类病案（肺/心/脾胃/肝胆/肾/气血）× 10案 = 60病案
- 交互: 病案查看 → START_CASE → DiagnosisScene → DIAGNOSIS_COMPLETE → 结果回写
- 视觉: 古卷轴UI，透明背景嵌入

**炮制**:
- 触发: GardenScene + `P`键
- 功能: 10种炮制法（切/浸/炒/炙/煅/煨/蒸/煮/淬/发酵）
- 交互: 拖拽药材/辅料 → 选取器皿 → 炮制进度 → 结果入库
- 视觉: 古朴工坊风格，SVG药材/器皿绘图

---

## 下一步行动

**Task 16: E2E测试**
- 测试病案集触发（C键）
- 测试炮制触发（P键）
- 测试UI交互完整性

---

*本文档由 Claude Code 维护*