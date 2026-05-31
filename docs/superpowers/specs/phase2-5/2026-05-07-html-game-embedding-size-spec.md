# HTML小游戏嵌入尺寸规范

**日期**: 2026-05-08
**阶段**: Phase 2.5
**状态**: 规范文档 - 已更新

---

## 1. 问题背景

Phase 2.5将多个HTML小游戏嵌入到Phaser主游戏中。发现所有小游戏UI尺寸超过游戏窗口，导致：
- UI超出可视范围
- 用户需要滚动才能看到完整界面
- 与主游戏视觉风格不一致

---

## 2. 游戏窗口标准

**Phaser游戏窗口尺寸**: **1280px × 720px**

**配置位置**: `src/data/constants.ts`

```typescript
export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;
```

---

## 3. HTML小游戏尺寸现状

| 游戏 | 当前尺寸 | 边距 | 状态 |
|------|----------|------|------|
| **病案集** | min(1150px, 90vw) × min(680px, 85vh) | 130×40 (10%×5.6%) | ✅ 已修复 |
| **诊断游戏** | 1150px × 680px | 130×40 (10%×5.6%) | ✅ 合理 |
| **煎药游戏** | 1150px × 680px | 130×40 (10%×5.6%) | ✅ 合理 |
| **炮制游戏** | min(1150px, 90vw) × min(680px, 85vh) | 130×40 (10%×5.6%) | ✅ 已修复 |
| **背包游戏** | 90vw max-1200px × 85vh max-700px | 响应式 | ✅ 相对合理 |

---

## 4. 统一规范标准

### 4.1 核心原则

**HTML小游戏容器尺寸必须适配游戏窗口（1280×720）**

### 4.2 推荐尺寸方案

#### 标准尺寸（推荐）

```css
.container {
  width: min(1150px, 90vw);
  height: min(680px, 85vh);
}
```

**理由**:
- 1150×680 占据游戏窗口 90%×94%
- 预留边距 130×40 (10%×5.6%)
- 与诊断/煎药游戏保持一致

#### 方案A: 固定尺寸（静态UI）

```css
.container {
  width: 1150px;
  height: 680px;
}
```

#### 方案B: 响应式尺寸（动态内容）

```css
.container {
  width: min(1150px, 90vw);
  height: min(680px, 85vh);
}
```

---

## 5. 各游戏实际方案

### 5.1 病案集 (CasebookUI) ✅

**修复历程**:
- 初次错误: `min(760px, 90vw) × min(560px, 85vh)` (误以为800×600窗口)
- 正确修复: `min(1150px, 90vw) × min(680px, 85vh)` (适配1280×720窗口)

**CSS位置**: `src/ui/html/casebook.css:65-73`

```css
.book {
  width: min(1150px, 90vw);
  height: min(680px, 85vh);
}
```

### 5.2 诊断游戏 (DiagnosisUI) ✅

**CSS位置**: `src/ui/html/diagnosis.css:92-94`

```css
.app {
  width: 1150px;
  height: 680px;
}
```

**注释**: 游戏视窗1280x720，弹窗1150x700留约5-10%边距

### 5.3 煎药游戏 (DecoctionUI) ✅

**CSS位置**: `src/ui/html/decoction.css:49`

```css
.scroll {
  width: 1150px;
  height: 680px;
}
```

### 5.4 炮制游戏 (PaozhiUI) ✅

**修复历程**:
- 初次错误: `100vw × 100vh` (全屏)
- 正确修复: `min(1150px, 90vw) × min(680px, 85vh)` (适配窗口)

**CSS位置**: `src/ui/html/paozhi.css:48-53`

```css
#paozhi-react-root > div {
  width: min(1150px, 90vw);
  height: min(680px, 85vh);
}
```

### 5.5 背包游戏 (InventoryUI) ✅

**CSS位置**: `src/ui/html/inventory.css:80-85`

```css
.main-container {
  width: 90vw;
  max-width: 1200px;
  height: 85vh;
  max-height: 700px;
}
```

**备注**: 已有响应式设计，相对合理，无需修改

---

## 6. 尺寸对比验证

### 实际占比计算

| 游戏 | 尺寸 | 占据窗口比例 |
|------|------|-------------|
| 病案集 | 1150×680 | 89.8% × 94.4% |
| 诊断游戏 | 1150×680 | 89.8% × 94.4% |
| 煎药游戏 | 1150×680 | 89.8% × 94.4% |
| 炮制游戏 | 1150×680 | 89.8% × 94.4% |
| 背包游戏 | 动态 | 响应式 |

---

## 7. CSS样式规范

### 7.1 透明背景嵌入

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

### 7.2 内容滚动

内容超出时启用优雅滚动：

```css
.content-area {
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(60,40,20,0.4) transparent;
}
```

---

## 8. 验收标准

### 8.1 尺寸验收

- [x] UI容器不超过1280×720
- [x] UI占据窗口约90%×94%
- [x] 预留边距10%×5.6%
- [x] 无需滚动即可看到主要交互元素

### 8.2 一致性验收

- [x] 病案集/诊断/煎药/炮制尺寸一致
- [x] 透明背景正确显示底层游戏
- [x] UI与主游戏风格一致

---

## 9. 更新记录

| 日期 | 游戏 | 修改内容 |
|------|------|----------|
| 2026-05-07 | 病案集 | 初次错误修复为760×560 (误判窗口尺寸) |
| 2026-05-08 | 病案集 | 正确修复为1150×680 (适配真实窗口1280×720) |
| 2026-05-08 | 炮制游戏 | 从全屏调整为1150×680 |

---

## 10. 经验教训

**关键教训**: 游戏窗口尺寸必须从配置文件确认，不能凭猜测

**正确流程**:
1. 检查 `src/data/constants.ts` 或 `src/config/game.config.ts`
2. 确认真实窗口尺寸 (GAME_WIDTH × GAME_HEIGHT)
3. 按此标准设计所有HTML小游戏

---

## 11. 相关文件

- **CSS文件**:
  - `src/ui/html/casebook.css`
  - `src/ui/html/diagnosis.css`
  - `src/ui/html/decoction.css`
  - `src/ui/html/paozhi.css`
  - `src/ui/html/inventory.css`
- **配置文件**: `src/data/constants.ts`
- **经验总结**: `docs/superpowers/experience/2026-05-07-html-game-size-issue.md`

---

*本文档由 Claude Code 维护*