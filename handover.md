# Handover 文档

**文档职责**: 为下一个 session 提供完整上下文。
**生命周期**: 仅对下一个 session 有效。
**生成方式**: PreCompact Hook 重写。

---

## 当前 TODO

继续修复 HTML 小游戏尺寸，适配游戏窗口（800×600）。

### 待修复列表

| 优先级 | 游戏 | 当前尺寸 | 状态 |
|--------|------|----------|------|
| 1 | 诊断游戏 | 1150×680 | ⏳ |
| 2 | 煎药游戏 | 1150×680 | ⏳ |
| 3 | 炮制游戏 | 100vw×100vh | ⏳ |

### 执行步骤

1. 读取规范: `docs/superpowers/specs/phase2.5/2026-05-07-html-game-embedding-size-spec.md`
2. 修改 CSS 容器: `min(760px, 90vw) × min(560px, 85vh)`
3. 调整内部元素
4. E2E 测试验证
5. Git 提交

---

## PROGRESS 摘要

**最后更新**: 2026-05-07
**当前状态**: Phase 2.5 UI尺寸规范制定 ✅

**最近完成**:
- 病案集尺寸修复 ✅
- 尺寸规范文档创建 ✅

**关键教训**:
- 游戏窗口800×600，需从配置确认
- 退出按钮必须在内容容器内定位

---

## STATE 摘要

**已完成**: Phase 1, 1.5, 2 (S1-S13), 2.5 UI组件/煎药/诊断/NPC验收/背包/病案集/炮制

**当前 Phase**: 2.5 - HTML小游戏尺寸适配

---

## 参考文档

- [PROGRESS.md](./PROGRESS.md) - 进行中任务 + 下一步TODO
- [STATE.md](./STATE.md) - 已完成状态
- [尺寸规范](docs/superpowers/specs/phase2.5/2026-05-07-html-game-embedding-size-spec.md)