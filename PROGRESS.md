# 药灵山谷 - 当前任务跟踪

**最后更新**: 2026-04-27
**当前状态**: 暂无进行中任务

---

## Phase 2.5: 煎药小游戏 HTML 直接迁移 ✅ (已完成)

**状态**: 已完成
**完成日期**: 2026-04-27
**分支**: feature/decoction-html-embedding-v2
**设计文档**: [v2.0直接迁移方案](docs/superpowers/specs/phase2-5/2026-04-26-decoction-direct-migration-design.md)
**实现计划**: [v2.0实现计划](docs/superpowers/plans/phase2-5/2026-04-26-decoction-direct-migration-plan.md)

### 完成摘要

采用"直接使用设计稿，不做拆分重构"原则，将 `docs/ui/煎药小游戏/decoction.html` 设计稿完整迁移到 Phaser 项目。

**创建文件 (7个)**:

| 文件 | 行数 | 功能 |
|------|------|------|
| `src/styles/decoction.css` | 1072 | 完整CSS样式(11种动画keyframes) |
| `src/data/decoction-pixel-herbs.ts` | 69 | 像素药材数据(22种) + pixelSprite函数 |
| `src/ui/components/ScrollModal.tsx` | 34 | 卷轴框架(roller/paper/seal) |
| `src/ui/components/StoveScene.tsx` | 91 | 炉灶场景(stove/fire/flames/embers) |
| `src/ui/components/PotArea.tsx` | 41 | 药罐区域(pot/liquid/steam) |
| `src/ui/components/HerbGrid.tsx` | 124 | 药材网格(bag-header/grid/HerbTag) |
| `src/ui/components/VialsShelf.tsx` | 56 | 药瓶陈列(brew-btn/vials/Vial) |

### 核心成果

1. **CSS完整迁移** - 保留设计稿1200×760尺寸 + 3区域Grid布局
2. **像素药材数据** - 22种药材grid/palette定义，pixelSprite渲染函数
3. **React组件化** - 7个核心组件TSX化，状态管理简化
4. **动效系统** - 11种CSS动画(flicker/flameDance/steamRise等)
5. **Phaser DOM集成准备** - CustomEvent桥接机制设计完成

### 关键原则

> **直接使用设计稿** - 不做拆分重构，完整保留视觉元素布局

---

## Hermes NPC 对话质量真实 API 测试 ✅ (已完成)

**状态**: 已完成
**完成日期**: 2026-04-26

详见 CLAUDE.md 原则更新。

---

*本文档由 Claude Code 维护，更新于 2026-04-27*