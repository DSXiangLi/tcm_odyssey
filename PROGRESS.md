# 药灵山谷 - 当前任务跟踪

**最后更新**: 2026-04-28
**当前状态**: Phase 2.5 诊断游戏 HTML 直接迁移进行中

---

## Phase 2.5: 诊断游戏 HTML 直接迁移 ⏳ (进行中)

**状态**: 进行中
**开始日期**: 2026-04-28
**分支**: master (直接开发，无需 feature 分支)
**设计文档**: [诊断游戏HTML迁移设计](docs/superpowers/specs/phase2-5/2026-04-28-diagnosis-html-migration-design.md)
**实现计划**: [诊断游戏HTML迁移计划](docs/superpowers/plans/phase2-5/2026-04-28-diagnosis-html-migration-plan.md)

### 实现原则

**直接使用设计稿，保持原样，只做桥接**
- CSS → 直接复制（仅删除 tweaks-panel）
- React组件 → 直接合并 JSX，保持结构不变
- 病案数据 → 直接复制 + TS 类型定义

### 设计稿来源

`docs/ui/诊断游戏/`:
- `styles.css` → 主样式系统
- `app.jsx` + `stage-*.jsx` → 主应用 + 5阶段组件
- `case-data.js` → 病案数据结构
- `assets.jsx` → 印章/头像组件
- `stage-intro.jsx` → 病案弹窗组件

### 已确认事项

| 事项 | 决策 |
|-----|------|
| 病案库数量 | 10个病案（外感类内科） |
| 舌诊图片 | 预留占位符，后续填充 |
| NPC评分 | 暂不实现，预留 `DIAGNOSIS_COMPLETE` 触发点 |
| 煎药衔接 | 暂不实现，由 NPC 工具调用触发 |

### 任务进度

| Phase | 状态 | 内容 |
|-------|------|------|
| Phase 1 | ⏳ 待执行 | CSS复制、病案数据、Assets组件 |
| Phase 2 | ⏳ 待执行 | 主应用合并（app + stage-*） |
| Phase 3 | ⏳ 待执行 | Phaser挂载与桥接事件 |
| Phase 4 | ⏳ 待执行 | 病案入口触发 |

---

*本文档由 Claude Code 维护，更新于 2026-04-28*