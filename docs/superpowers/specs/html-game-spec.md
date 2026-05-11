# HTML小游戏接入规范

**版本**: v1.0
**最后更新**: 2026-05-10

---

## 窗口尺寸规范

### 标准容器尺寸

所有HTML小游戏必须遵循统一的响应式尺寸规范：

```css
/* 主容器尺寸 - 响应式，适配不同屏幕 */
width: min(1150px, 90vw);
height: min(680px, 85vh);
```

### 尺寸计算依据

| 参数 | 值 | 说明 |
|------|-----|------|
| 游戏窗口 | 1280×720 | Phaser游戏主窗口 (GAME_WIDTH×GAME_HEIGHT) |
| 容器基准 | 1150×680 | 90%×94% 游戏窗口，留边距 |
| 最大尺寸 | 1150×680 | 大屏幕时的固定尺寸 |
| 响应式宽度 | 90vw | 小屏幕时占视窗90% |
| 响应式高度 | 85vh | 小屏幕时占视窗85% |

### 为什么使用 `min()` 函数

`min(1150px, 90vw)` 确保：
- **大屏幕**: 固定1150px宽度，不会超出游戏窗口
- **小屏幕**: 自动缩小到90vw，适配移动设备

---

## CSS实现模板

### React根容器

```css
/* React根容器 - 全屏定位，居中显示 */
#xxx-react-root {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  justify-content: center;
  align-items: center;
  pointer-events: auto;
  background: transparent; /* 透明背景，显示底层Phaser */
}

/* 主游戏容器 - 响应式尺寸 */
#xxx-react-root > div {
  position: relative;
  width: min(1150px, 90vw);
  height: min(680px, 85vh);
}
```

### 内容容器类

```css
/* 内容容器 - 适用于类名方式 */
.scroll-modal,
.app,
.book,
.main-container {
  position: relative;
  width: min(1150px, 90vw);
  height: min(680px, 85vh);
}
```

---

## 关闭按钮规范

### 位置规范

关闭按钮必须位于**内容容器内部**，确保在游戏窗口内可见：

```css
.close-btn {
  position: absolute;
  top: 50px;
  right: 60px;
  z-index: 10;
}
```

### 样式规范

```css
.close-btn {
  width: 44px;
  height: 44px;
  background: var(--vermillion-2, #8b3a1c);
  border: 3px solid var(--ink-1, #1a1410);
  color: #f4dba8;
  font-family: "Noto Serif SC", serif;
  font-size: 22px;
  font-weight: 900;
  cursor: pointer;
  box-shadow: 2px 2px 0 rgba(0, 0, 0, 0.4),
              inset 1px 1px 0 rgba(255, 255, 255, 0.2);
}

.close-btn:hover {
  background: var(--vermillion-1, #b9341c);
}
```

---

## 当前游戏实现状态

| 游戏 | CSS文件 | 容器类/选择器 | 状态 |
|------|---------|--------------|------|
| 煎药 | decoction.css | `.scroll-modal` | ✅ 统一 |
| 诊断 | diagnosis.css | `.app` | ✅ 统一 |
| 病案集 | casebook.css | `.book` | ✅ 统一 |
| 炮制 | paozhi.css | `#paozhi-react-root > div` | ✅ 统一 |
| 背包 | inventory.css | `.main-container` | ✅ 统一 |

---

## 接入检查清单

新HTML小游戏接入时，必须检查：

1. **容器尺寸**: 使用 `min(1150px, 90vw) × min(680px, 85vh)`
2. **关闭按钮位置**: `top: 50px; right: 60px` 相对于内容容器
3. **透明背景**: React根容器 `background: transparent`
4. **z-index层级**: 根容器 `z-index: 1000`，关闭按钮 `z-index: 10`
5. **居中布局**: React根容器 `display: flex; justify-content: center; align-items: center`

---

## 常见错误

### ❌ 错误：固定尺寸超出游戏窗口

```css
/* 错误 - 固定尺寸可能超出1280×720游戏窗口 */
.container {
  width: 1200px;
  height: 700px;
}
```

### ❌ 错误：关闭按钮在根容器而非内容容器

```css
/* 错误 - 按钮定位在根容器，可能超出游戏窗口 */
#react-root .close-btn {
  position: fixed;  /* 或 position: absolute 相对于 #react-root */
  top: 20px;
  right: 20px;
}
```

### ✅ 正确：关闭按钮在内容容器内部

```css
/* 正确 - 按钮在内容容器内，始终可见 */
.container .close-btn {
  position: absolute;
  top: 50px;
  right: 60px;
}
```

---

## 参考链接

- 经验教训: [docs/superpowers/experience/2026-05-08-close-button-position.md](../experience/2026-05-08-close-button-position.md)
- 项目主文档: [CLAUDE.md](../../CLAUDE.md)