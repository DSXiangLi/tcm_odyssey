# 药灵山谷 - 当前任务跟踪

**最后更新**: 2026-04-23
**当前状态**: Phase 2.5 煎药小游戏 UI 视觉优化已完成

---

## Phase 2.5: 煎药小游戏 UI 视觉优化 ✅ (已完成)

**状态**: 完成 (Task 1-11 全部完成)
**开始日期**: 2026-04-23
**完成日期**: 2026-04-23
**设计文档**: [视觉差距分析](docs/superpowers/specs/phase2-5/2026-04-23-decoction-ui-visual-gap-analysis.md)
**实现计划**: [视觉优化计划](docs/superpowers/plans/phase2-5/2026-04-23-decoction-ui-visual-optimization-plan.md)

### 完成任务汇总

| Task | 描述 | 提交 | 测试 |
|------|------|------|------|
| Task 1 | HearthVisualComponent 骨架 + COLORS 常量 | 2d16ecc, 67d256b | 17 tests ✅ |
| Task 2 | 砖墙纹理绘制 (渐变+灰缝网格) | 1826107, 7445eae | base ✅ |
| Task 3 | 炉灶顶板和火焰开口 | 74cbbf4 | base ✅ |
| Task 4 | 火焰动画系统 (4火焰+舞动) | 9a64496 | base ✅ |
| Task 5 | 火星粒子 + 地面阴影 | a828ce3 | base ✅ |
| Task 6 | PotVisualComponent 骨架 | d6405c3 | 21 tests ✅ |
| Task 7 | 药罐形状绘制 (罐身+边缘+把手) | 33654e9 | 21 tests ✅ |
| Task 8 | 药液表面 + 蒸汽效果 | 3dbcb39 | 28 tests ✅ |
| Task 9 | 搅拌勺动画 | 765645b | 36 tests ✅ |
| Task 10 | DecoctionUI 集成重构 | 29b2cca | 127 tests ✅ |
| Task 11 | 文档更新 | (本次) | docs ✅ |

### 新增视觉组件详情

**HearthVisualComponent** - 炉灶视觉组件 (`src/ui/components/HearthVisualComponent.ts`)
- 尺寸: 360×204 (60px × 34px, pixelSize=6)
- 砖墙纹理 (8阶渐变 + 灰缝网格)
- 火焰开口 (椭圆拱形 + radial-gradient模拟)
- 4个动态火焰 (舞动动画, scaleX/scaleY/yoyo)
- 火星粒子系统 (上升180px + 漂移 + blendMode ADD)
- 地面阴影 (椭圆形渐变)

**PotVisualComponent** - 药罐视觉组件 (`src/ui/components/PotVisualComponent.ts`)
- 尺寸: 264×168 (44px × 28px, pixelSize=6)
- 罐身 (圆底形状 + 8阶水平渐变 + 内阴影)
- 罐口边缘 (3阶垂直渐变 + 高光)
- 药液表面 (渐变 + 波纹条纹 + 椭圆形 + ripple动画)
- 双把手 (左/右 + 边框效果)
- 5个蒸汽团 (staggered delays + 上升动画)
- 搅拌勺 (勺柄+勺头渐变 + stir摆动动画)

---

## Phase 2.5: 煎药小游戏 UI 重构 ✅ (已完成)

**状态**: 完成 (Task 1-7 全部完成)
**开始日期**: 2026-04-22
**完成日期**: 2026-04-22
**设计文档**: [煎药设计](docs/superpowers/specs/phase2-5/2026-04-21-decoction-ui-refactor-design.md)
**实现计划**: [实现计划](docs/superpowers/plans/2026-04-22-decoction-ui-refactor-implementation.md)

### 完成任务汇总

| Task | 描述 | 提交 | 测试 |
|------|------|------|------|
| Task 1 | PixelSpriteComponent 像素图标绘制 | 622af75, e092106 | 20 tests ✅ |
| Task 2 | ScrollModalUI 卷轴风格弹窗基类 | 9e1bb55, abeb488 | 13 tests ✅ |
| Task 3 | HerbTagComponent 药牌组件 | d4e1ba3, 2eb2d9c | 23 tests ✅ |
| Task 4 | DragEffectManager 拖拽动效系统 | fd60fb7 | 27 tests ✅ |
| Task 5 | 迁移像素药材数据 | aab68ec | data ✅ |
| Task 6 | 重构 DecoctionUI | 8bf8f5a | 28 tests ✅ |
| Task 7 | 整理组件入库更新文档 | (本次) | docs ✅ |

---

## 新增组件库详情

### PixelSpriteComponent ✅

**文件**: `src/ui/components/PixelSpriteComponent.ts`
**功能**: 像素网格渲染组件
**特点**:
- grid/palette 配置驱动
- 默认像素尺寸 3px
- 数据克隆防止外部修改
- 空网格验证和一致性行警告

### ScrollModalUI ✅

**文件**: `src/ui/base/ScrollModalUI.ts`
**功能**: 卷轴风格弹窗基类（继承 ModalUI）
**特点**:
- 木轴上下端、纸张背景、朱砂印章
- 主标题 + 竖排副标题
- 内容容器接口

### HerbTagComponent ✅

**文件**: `src/ui/components/HerbTagComponent.ts`
**功能**: 药牌展示组件
**特点**:
- 悬绳 + 木牌 + 像素图标 + 药名 + 属性 + 数量角标
- 支持 拖拽/点击/静态 三种交互模式
- 数据克隆 + 输入验证 + readonly 属性

### DragEffectManager ✅

**文件**: `src/systems/DragEffectManager.ts`
**功能**: 拖拽动效系统
**特点**:
- 拖拽轨迹（跟随鼠标）
- 溅射粒子（到达目标后爆发）
- 爆发动效（彩色粒子）
- 完整的清理和销毁接口

### 像素药材数据 ✅

**文件**: `src/data/pixel-herbs.ts`
**内容**: 22种药材的像素网格数据
**药材**: 麻黄、桂枝、杏仁、甘草、石膏、知母、粳米、人参、白术、茯苓、炙甘草、干姜、细辛、五味子、半夏、黄芩、黄连、大黄、芒硝、枳实、厚朴、芍药

---

## 下一步

Phase 2.5 煎药小游戏 UI 视觉优化已全部完成。可继续开发：
- Phase 2.5 种植小游戏优化
- Phase 2.5 辨证选方小游戏开发
- Phase 3 学习系统开发

---

*本文档由 Claude Code 维护，更新于 2026-04-23*