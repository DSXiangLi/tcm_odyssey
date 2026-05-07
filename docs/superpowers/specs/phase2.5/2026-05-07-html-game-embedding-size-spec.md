# HTML小游戏嵌入尺寸规范

**日期**: 2026-05-07
**阶段**: Phase 2.5
**状态**: 规范文档

---

## 1. 问题背景

Phase 2.5将多个HTML小游戏嵌入到Phaser主游戏中。发现所有小游戏UI尺寸超过游戏窗口，导致：
- UI超出可视范围
- 用户需要滚动才能看到完整界面
- 与主游戏视觉风格不一致

---

## 2. 游戏窗口标准

**Phaser游戏窗口尺寸**: 800px × 600px

**配置位置**: `src/config/game.config.ts`

```typescript
export const GAME_CONFIG: Phaser.Types.Core.GameConfig = {
  width: 800,
  height: 600,
  // ...
};
```

---

## 3. HTML小游戏尺寸现状

| 游戏 | 当前尺寸 | 超出程度 | 状态 |
|------|----------|----------|------|
| **病案集** | min(1400px, 96vw) × min(880px, 92vh) | 140% × 147% | ❌ 需修复 |
| **诊断游戏** | 1150px × 680px | 144% × 113% | ❌ 需修复 |
| **煎药游戏** | 1150px × 680px | 144% × 113% | ❌ 需修复 |
| **炮制游戏** | 100vw × 100vh | 全屏 | ❌ 需修复 |
| **背包游戏** | 90vw max-1200px × 85vh max-700px | 响应式 | ⚠️ 需优化 |

---

## 4. 统一规范标准

### 4.1 核心原则

**HTML小游戏容器尺寸必须适配游戏窗口（800×600）**

### 4.2 推荐尺寸方案

#### 方案A: 固定尺寸（推荐用于静态UI）

```css
.container {
  width: 760px;   /* 800 - 40px边距 */
  height: 560px;  /* 600 - 40px边距 */
}
```

#### 方案B: 响应式尺寸（推荐用于动态内容）

```css
.container {
  width: min(760px, 90vw);   /* 最大760px，响应式 */
  height: min(560px, 85vh);  /* 最大560px，响应式 */
}
```

#### 方案C: 内容自适应（推荐用于滚动内容）

```css
.container {
  max-width: 760px;
  max-height: 560px;
  overflow: auto;  /* 内容超出时滚动 */
}
```

---

## 5. 各游戏推荐方案

### 5.1 病案集 (CasebookUI)

**当前**: `width: min(1400px, 96vw); height: min(880px, 92vh);`

**推荐**: 方案B（响应式）

```css
.book {
  width: min(760px, 90vw);   /* 减小到760px */
  height: min(560px, 85vh);  /* 减小到560px */
}
```

**理由**:
- 病案集内容丰富，需要响应式适配
- 使用min()确保在不同屏幕上合理显示
- 内容区域启用滚动

### 5.2 诊断游戏 (DiagnosisUI)

**当前**: `width: 1150px; height: 680px;`

**推荐**: 方案A（固定尺寸）

```css
.diagnosis-container {
  width: 760px;
  height: 560px;
}
```

**理由**:
- 诊断流程固定，内容相对静态
- 固定尺寸确保UI元素位置稳定
- 5个阶段内容需重新布局优化

### 5.3 煎药游戏 (DecoctionUI)

**当前**: `width: 1150px; height: 680px;`

**推荐**: 方案A（固定尺寸）

```css
.decoction-ui {
  width: 760px;
  height: 560px;
}
```

**理由**:
- 煎药流程固定，药材架和煎药壶位置固定
- 固定尺寸确保交互区域合理分布

### 5.4 炮制游戏 (PaozhiUI)

**当前**: `width: 100vw; height: 100vh;`

**推荐**: 方案B（响应式）

```css
.paozhi-root {
  width: min(760px, 90vw);
  height: min(560px, 85vh);
}
```

**理由**:
- 炮制界面有药材库、器皿架、任务卷轴
- 响应式确保各区域合理分布
- 拖拽交互需要足够空间

### 5.5 背包游戏 (InventoryUI)

**当前**: `width: 90vw max-1200px; height: 85vh max-700px;`

**推荐**: 方案C（优化现有）

```css
.inventory-root {
  width: min(760px, 90vw);
  max-width: 760px;  /* 限制最大宽度 */
  height: min(560px, 85vh);
  max-height: 560px; /* 限制最大高度 */
}
```

**理由**:
- 背包已有响应式设计，只需限制最大尺寸
- 药材网格需要滚动，overflow已启用

---

## 6. CSS样式规范

### 6.1 透明背景嵌入

所有HTML小游戏必须保持透明背景：

```css
/* 容器 */
#game-react-root {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  justify-content: center;
  align-items: center;
  pointer-events: auto;
}

/* 背景层 */
.backdrop {
  background: transparent;  /* 关键：显示底层Phaser */
}
```

### 6.2 内容滚动

内容超出时启用优雅滚动：

```css
.content-area {
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(60,40,20,0.4) transparent;
}

.content-area::-webkit-scrollbar {
  width: 4px;
}

.content-area::-webkit-scrollbar-thumb {
  background: rgba(60,40,20,0.4);
  border-radius: 2px;
}
```

---

## 7. 验收标准

### 7.1 尺寸验收

- [ ] UI容器不超过800×600
- [ ] UI在游戏窗口内完整可见
- [ ] 无需滚动即可看到主要交互元素
- [ ] 响应式适配不同屏幕比例

### 7.2 视觉验收

- [ ] 透明背景正确显示底层游戏
- [ ] UI与主游戏风格一致
- [ ] 字体、颜色、边距统一

### 7.3 交互验收

- [ ] 所有按钮在可视范围内
- [ ] 拖拽区域合理分布
- [ ] 滚动条样式统一

---

## 8. 实施优先级

### P0 (立即修复)

1. **病案集** - 用户已反馈，影响体验

### P1 (优先修复)

2. **诊断游戏** - 核心功能，影响学习流程
3. **煎药游戏** - 核心功能，影响学习流程

### P2 (后续优化)

4. **炮制游戏** - Phase 2.5新增，可逐步优化
5. **背包游戏** - 已有响应式，只需调整最大值

---

## 9. 相关文件

- **设计文档**: `docs/superpowers/specs/phase2.5/2026-05-06-casebook-paozhi-embedding-design.md`
- **经验总结**: `docs/superpowers/experience/2026-05-07-html-game-size-issue.md`
- **CSS文件**:
  - `src/ui/html/casebook.css`
  - `src/ui/html/diagnosis.css`
  - `src/ui/html/decoction.css`
  - `src/ui/html/paozhi.css`
  - `src/ui/html/inventory.css`

---

## 10. 更新记录

| 日期 | 游戏 | 修改内容 |
|------|------|----------|
| 2026-05-07 | 病案集 | 尺寸从1400×880调整为760×560 |

---

*本文档由 Claude Code 维护*