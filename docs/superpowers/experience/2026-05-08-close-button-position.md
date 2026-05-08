# HTML小游戏退出按钮规范与经验

**日期**: 2026-05-08
**问题**: 病案集、背包、炮制游戏退出按钮位置超出游戏窗口
**影响**: 用户无法点击退出，UI元素超出可视范围
**严重级别**: HIGH

---

## 1. 问题发现

### 用户反馈

> 背包和病案游戏的退出按钮都有问题，都在游戏视窗之外，请和煎药游戏保持一致。

### 现象

- 病案集退出按钮在全屏透明层 `.desk` 上，而非内容容器 `.book` (1150×680) 内
- 背包退出按钮在全屏层 `.inventory-ui` 上，而非内容容器 `.main-container` 内
- 炮制退出按钮使用内联样式 `top:10px;right:10px`，位置太小

---

## 2. 根本原因分析

### Phase 1: 证据收集

**煎药游戏正确实现** (decoction.css:149-157):

```css
.close-btn{
  position:absolute;
  top:50px;
  right:60px;
  z-index:10;
  width:44px;
  height:44px;
  background:var(--cinnabar-deep);
  border:3px solid var(--ink);
  color:#f4dba8;
  font-family:"Noto Serif SC",serif;
  font-size:22px;
  font-weight:900;
  cursor:pointer;
  box-shadow: 2px 2px 0 rgba(0,0,0,.4), inset 1px 1px 0 rgba(255,255,255,.2);
}
```

**关键发现**:
- 退出按钮相对于 `.scroll-modal` (1150×680) 容器定位
- 位置 `top:50px;right:60px` 确保在可视范围内
- 按钮在容器DOM内，而非外部透明背景层

### Phase 2: 对比分析

| 游戏 | 错误原因 | 正确做法 |
|------|----------|----------|
| **病案集** | 按钮在 `.desk` (全屏) | 按钮应在 `.book` (1150×680) |
| **背包** | 按钮在 `.inventory-ui` (全屏) | 按钮应在 `.main-container` |
| **炮制** | 内联样式 `top:10` | 应使用CSS类 `top:50px` |

---

## 3. 统一规范标准

### 3.1 核心原则

**HTML小游戏必须有退出按钮，且按钮必须在内容容器内定位**

### 3.2 退出按钮样式规范

```css
.close-btn {
  position: absolute;
  top: 50px;
  right: 60px;
  z-index: 10;
  width: 44px;
  height: 44px;
  background: var(--cinnabar-deep);  /* 深朱红 */
  border: 3px solid var(--ink);      /* 墨色边框 */
  color: #f4dba8;                    /* 米黄文字 */
  font-family: "Noto Serif SC", serif;
  font-size: 22px;
  font-weight: 900;
  cursor: pointer;
  box-shadow: 2px 2px 0 rgba(0,0,0,.4), inset 1px 1px 0 rgba(255,255,255,.2);
}

.close-btn:hover {
  background: var(--cinnabar);  /* 朱红 */
}
```

### 3.3 DOM结构规范

```
正确结构：
┌─────────────────────────────────────┐
│ #react-root (全屏透明层)            │
│  ┌───────────────────────────────┐  │
│  │ .container (1150×680)         │  │
│  │  ┌─────────────────────────┐  │  │
│  │  │ 内容区域                 │  │  │
│  │  └─────────────────────────┘  │  │
│  │  <button class="close-btn">×</>│  │ ← 按钮在容器内
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘

错误结构（病案集原来）：
┌─────────────────────────────────────┐
│ #react-root (全屏透明层)            │
│  <button class="close-btn">×</>     │ ← 按钮在全屏层上！
│  ┌───────────────────────────────┐  │
│  │ .book (1150×680)              │  │
│  │  内容...                       │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

---

## 4. 修复方案

### 4.1 病案集修复

**CSS位置**: `src/ui/html/casebook.css:1100-1119`

**React修改**: `src/ui/html/CasebookUI.tsx:429-433`

```tsx
// 修改前：按钮在 .desk 层
<div className="desk">
  <button className="close-btn">退出</button>  // ❌ 在容器外
  <div className="book">...</div>
</div>

// 修改后：按钮在 .book 容器内
<div className="desk">
  <div className="book">
    <button className="close-btn">×</button>  // ✅ 在容器内
    ...
  </div>
</div>
```

### 4.2 背包修复

**CSS位置**: `src/ui/html/inventory.css:52-73`

**React修改**: `src/ui/html/InventoryUI.tsx:125-131`

```tsx
// 修改前：按钮在 .inventory-ui 层
<div className="inventory-ui">
  <div className="close-btn">✕</div>  // ❌ 在容器外
  <div className="main-container">...</div>
</div>

// 修改后：按钮在 .main-container 内
<div className="inventory-ui">
  <div className="main-container">
    <button className="close-btn">×</button>  // ✅ 在容器内
    ...
  </div>
</div>
```

### 4.3 炮制修复

**CSS位置**: `src/ui/html/paozhi.css:326-343`

**React修改**: `src/ui/html/PaozhiUI.tsx:685-689`

```tsx
// 修改前：内联样式
<button style={{ position: 'absolute', top: 10, right: 10 }}>关闭</button>

// 修改后：CSS类名
<button className="close-btn">×</button>
```

---

## 5. 经验教训

### E1: 退出按钮定位层级错误

**问题**: 退出按钮放在全屏透明层而非内容容器

**教训**:
- 退出按钮必须在内容容器(1150×680)内定位
- 全屏透明层(`#react-root`)仅用于居中显示，不放置交互元素
- 相对定位参照容器必须是有限尺寸的容器

**预防措施**:
- 创建退出按钮时先确认父容器
- 使用 `.container > .close-btn` CSS选择器强制层级

### E2: 内联样式难以统一维护

**问题**: 炮制游戏使用内联样式，位置不规范

**教训**:
- 所有UI组件样式应使用CSS类而非内联样式
- 内联样式难以统一修改、难以保持一致性
- CSS类可在规范文档中定义，确保全项目一致

**正确做法**:
```tsx
// 错误：内联样式
<button style={{ top: 10, right: 10 }}>关闭</button>

// 正确：CSS类
<button className="close-btn">×</button>
```

### E3: 新游戏开发时遗漏退出按钮

**问题**: 病案集迁移时完全遗漏了退出按钮

**教训**:
- HTML小游戏开发 Checklist 必须包含"退出按钮"
- 从设计阶段就规划退出交互
- 参考 `superpowers:frontend-design` 技能的UI组件清单

### E4: 视觉一致性影响用户体验

**问题**: 各游戏退出按钮样式、位置不一致

**教训**:
- 统一视觉规范降低用户学习成本
- 红色×按钮是通用的关闭标识
- 位置固定在右上角(50px, 60px)便于点击

---

## 6. HTML小游戏开发Checklist

在开发新的HTML小游戏时，必须检查以下项：

### UI容器检查

- [ ] 容器尺寸: `min(1150px, 90vw) × min(680px, 85vh)`
- [ ] 容器定位: `position: relative` (内部元素相对定位)
- [ ] 全屏透明层: 仅用于flex居中，不放置交互元素

### 退出按钮检查

- [ ] 按钮存在于DOM中
- [ ] 按钮在内容容器内(非全屏层)
- [ ] 按钮样式使用CSS类(非内联)
- [ ] 按钮位置: `top:50px; right:60px`
- [ ] 按钮尺寸: `44×44px`
- [ ] 按钮样式: 红色背景、×符号
- [ ] onClick调用 `onClose` 回调

### 事件桥接检查

- [ ] 调用前发送自定义事件 (如 `CASEBOOK_EVENTS.CLOSE`)
- [ ] 回调正确传递给Phaser场景

---

## 7. 相关文件

### 修改文件

| 文件 | 修改行数 | 修改内容 |
|------|----------|----------|
| `src/ui/html/casebook.css` | +20 | 关闭按钮CSS样式 |
| `src/ui/html/CasebookUI.tsx` | ~5 | 按钮移入容器 |
| `src/ui/html/inventory.css` | ~22 | 关闭按钮CSS样式 |
| `src/ui/html/InventoryUI.tsx` | ~7 | 按钮移入容器 |
| `src/ui/html/paozhi.css` | ~18 | 关闭按钮CSS样式 |
| `src/ui/html/PaozhiUI.tsx` | ~20 | 内联改CSS类 |

### 参考文件

| 文件 | 说明 |
|------|------|
| `src/ui/html/decoction.css` | 正确的退出按钮样式定义 |
| `src/ui/html/styles/scroll-modal.css` | 共用的关闭按钮样式 |

---

## 8. 总结

**问题**: 退出按钮位置超出游戏窗口
**原因**: 按钮放在全屏层而非内容容器内
**修复**: 统一移入容器，统一CSS样式
**规范**: 制定退出按钮开发Checklist

---

*本经验文档由 Claude Code 维护*