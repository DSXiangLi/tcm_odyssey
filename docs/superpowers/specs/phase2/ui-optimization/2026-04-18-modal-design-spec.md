# 弹窗设计方案 - 最终确认版本

**创建日期**: 2026-04-18
**验收状态**: ✅ 用户已确认全部方案
**Demo文件**: docs/design/modal-design-demo-v2.html

---

## 最终组合方案

| 场景 | 方案 | 核心特征 |
|-----|------|---------|
| **标题画面/新手引导** | 方案3（渐变玻璃） | 渐变背景 + 顶部光带 + 金棕边框 |
| **游戏内弹窗** | 方案5（3D立体边框） | 多层边框（亮左上+暗右下） |
| **背包/选择界面** | 方案4（Neumorphism） | 凸起=选中，凹陷=未选中 |
| **输入框/存档槽位** | 方案8（内凹槽位） | 暗顶左+亮底右边框 |
| **成就/临时提示** | 方案6（悬浮卡片） | 底部阴影+悬浮感 |
| **确认/警告框** | 方案2（深色玻璃） | 高透明度+强边框分隔 |

---

## 方案3: 渐变玻璃（标题画面/新手引导）

### 设计特征
| 特征 | 值 |
|-----|---|
| 背景渐变 | 灰蓝(0x408080, 0.3) → 土黄(0x402020, 0.4) |
| 顶部光带 | 金棕(0xc0a080, 0.2) → 透明 |
| 边框 | 2px 金棕(0xc0a080, 0.5) |
| 文字标题 | TEXT_BRIGHT (#f0e0d0) |
| 文字内容 | TEXT_TIP (#d4c4b4) |

### Phaser实现代码
```typescript
const graphics = this.scene.add.graphics();

// 1. 渐变背景（灰蓝到土黄）
graphics.fillGradientStyle(0x408080, 0.3, 0x402020, 0.4, 0x408080, 0.3, 0x402020, 0.4);
graphics.fillRect(x, y, width, height);

// 2. 顶部光带
graphics.fillGradientStyle(0xc0a080, 0.2, 0x000000, 0, 0xc0a080, 0.2, 0x000000, 0);
graphics.fillRect(x, y, width, 40);

// 3. 金棕边框
graphics.lineStyle(2, 0xc0a080, 0.5);
graphics.strokeRect(x, y, width, height);
```

---

## 方案5: 3D立体边框（游戏内弹窗）

### 设计特征
| 特征 | 值 |
|-----|---|
| 外层边框 | 4px 亮绿(0x80a040) |
| 背景 | 深绿(0x1a2e26) |
| 顶部/左侧高光 | 2px 亮绿(0x90c070) |
| 底部/右侧阴影 | 2px 暗棕(0x604020) |

### Phaser实现代码
```typescript
const graphics = this.scene.add.graphics();

// 1. 外层边框（亮绿色）
graphics.lineStyle(4, 0x80a040);
graphics.strokeRect(x - 4, y - 4, width + 8, height + 8);

// 2. 主背景
graphics.fillStyle(0x1a2e26, 1);
graphics.fillRect(x, y, width, height);

// 3. 顶部/左侧高光边框
graphics.lineStyle(2, 0x90c070);
graphics.beginPath();
graphics.moveTo(x, y + height);
graphics.lineTo(x, y);
graphics.lineTo(x + width, y);
graphics.strokePath();

// 4. 底部/右侧阴影边框
graphics.lineStyle(2, 0x604020);
graphics.beginPath();
graphics.moveTo(x + width, y);
graphics.lineTo(x + width, y + height);
graphics.lineTo(x, y + height);
graphics.strokePath();
```

### 3D按钮实现
```typescript
const graphics = this.scene.add.graphics();

// 渐变背景
graphics.fillGradientStyle(0x90c070, 1, 0x70a050, 1, 0x90c070, 1, 0x70a050, 1);
graphics.fillRect(x, y, btnWidth, btnHeight);

// 高光边框（顶部+左侧）
graphics.lineStyle(2, 0xa0d080);
graphics.beginPath();
graphics.moveTo(x, y + btnHeight);
graphics.lineTo(x, y);
graphics.lineTo(x + btnWidth, y);
graphics.strokePath();

// 阴影边框（底部+右侧）
graphics.lineStyle(2, 0x507040);
graphics.beginPath();
graphics.moveTo(x + btnWidth, y);
graphics.lineTo(x + btnWidth, y + btnHeight);
graphics.lineTo(x, y + btnHeight);
graphics.strokePath();
```

---

## 方案4: Neumorphism（背包/选择界面）

### 设计特征
| 特征 | 值 |
|-----|---|
| 背景色 | 0x2a3e32 |
| 凸起效果 | 外阴影(右下8px) + 内高光(左上) |
| 凹陷效果 | 内阴影 + 微弱外高光 |

### Phaser实现代码（凸起）
```typescript
const graphics = this.scene.add.graphics();

// 1. 外阴影（右下）
graphics.fillStyle(0x000000, 0.3);
graphics.fillRect(x + 4, y + 4, width, height);

// 2. 主背景
graphics.fillStyle(0x2a3e32, 1);
graphics.fillRect(x, y, width, height);

// 3. 外高光（左上）
graphics.fillStyle(0xffffff, 0.05);
graphics.fillRect(x - 2, y - 2, width, 2);
graphics.fillRect(x - 2, y - 2, 2, height);

// 4. 内阴影（底部）
graphics.fillStyle(0x000000, 0.15);
graphics.fillRect(x + 2, y + height - 2, width - 4, 2);
```

### Phaser实现代码（凹陷）
```typescript
const graphics = this.scene.add.graphics();

// 1. 主背景
graphics.fillStyle(0x2a3e32, 1);
graphics.fillRect(x, y, width, height);

// 2. 内阴影（右下）
graphics.fillStyle(0x000000, 0.2);
graphics.fillRect(x + 2, y + 2, width - 2, height - 2);

// 3. 内高光（左上）
graphics.fillStyle(0xffffff, 0.05);
graphics.fillRect(x, y, width - 2, 2);
graphics.fillRect(x, y, 2, height - 2);
```

---

## 方案8: 内凹槽位（输入框/存档槽位）

### 设计特征
| 特征 | 值 |
|-----|---|
| 底背景 | 深色(0x0d1f17) |
| 顶部/左侧边框 | 暗色(0x0a1510) |
| 底部/右侧边框 | 亮色(0x406050) |

### Phaser实现代码
```typescript
const graphics = this.scene.add.graphics();

// 1. 深色底背景
graphics.fillStyle(0x0d1f17, 1);
graphics.fillRect(x, y, width, height);

// 2. 顶部/左侧暗边框（凹陷效果）
graphics.lineStyle(2, 0x0a1510);
graphics.beginPath();
graphics.moveTo(x + width, y);
graphics.lineTo(x, y);
graphics.lineTo(x, y + height);
graphics.strokePath();

// 3. 底部/右侧亮边框（凸出效果）
graphics.lineStyle(2, 0x406050);
graphics.beginPath();
graphics.moveTo(x, y + height);
graphics.lineTo(x + width, y + height);
graphics.lineTo(x + width, y);
graphics.strokePath();
```

---

## 方案6: 悬浮卡片（成就/临时提示）

### 设计特征
| 特征 | 值 |
|-----|---|
| 背景 | 渐变(0x406050 → 0x304030) |
| 悬浮阴影 | 底部偏移阴影 |
| 顶部光带 | 金棕渐变 |

### Phaser实现代码
```typescript
const graphics = this.scene.add.graphics();

// 1. 底部悬浮阴影
graphics.fillStyle(0x000000, 0.5);
graphics.fillRect(x, y + height + 4, width, 8);

// 2. 边缘阴影
graphics.fillStyle(0x000000, 0.3);
graphics.fillRect(x + 4, y + 4, width, height);

// 3. 主背景渐变
graphics.fillGradientStyle(0x406050, 1, 0x304030, 1, 0x406050, 1, 0x304030, 1);
graphics.fillRect(x, y, width, height);

// 4. 顶部光带
graphics.fillStyle(0xc0a080, 0.3);
graphics.fillRect(x, y, width, 2);

// 5. 顶部微弱高光
graphics.fillStyle(0xffffff, 0.1);
graphics.fillRect(x, y, width, 1);
```

---

## 方案2: 深色玻璃（确认/警告框）

### 设计特征
| 特征 | 值 |
|-----|---|
| 背景 | 深棕(0x402020, 0.7) |
| 边框 | 2px 金棕(0xc0a080, 0.6) |
| 外发光 | 1px 金棕(0xc0a080, 0.2) |

### Phaser实现代码
```typescript
const graphics = this.scene.add.graphics();

// 1. 外发光边框
graphics.lineStyle(1, 0xc0a080, 0.2);
graphics.strokeRect(x - 1, y - 1, width + 2, height + 2);

// 2. 主背景
graphics.fillStyle(0x402020, 0.7);
graphics.fillRect(x, y, width, height);

// 3. 主边框
graphics.lineStyle(2, 0xc0a080, 0.6);
graphics.strokeRect(x, y, width, height);
```

---

## 配色常量清单

需要添加到 `ui-color-theme.ts`:

```typescript
// === 玻璃质感背景 ===
PANEL_GLASS_LIGHT: 0x408080,   // 灰蓝（渐变起点）
PANEL_GLASS_DARK: 0x402020,    // 土黄（渐变终点）
PANEL_NEUMORPHIC: 0x2a3e32,    // 新拟态背景
PANEL_INSET: 0x0d1f17,         // 内凹底色
PANEL_3D_BG: 0x1a2e26,         // 3D弹窗背景

// === 边框系统 ===
BORDER_OUTER_GREEN: 0x80a040,  // 外层亮绿边框
BORDER_TOP_LIGHT: 0x90c070,    // 顶部/左侧高光
BORDER_BOTTOM_SHADOW: 0x604020,// 底部/右侧阴影
BORDER_INSET_DARK: 0x0a1510,   // 内凹暗边框
BORDER_INSET_LIGHT: 0x406050,  // 内凹亮边框
BORDER_GLOW: 0xc0a080,         // 金棕发光边框

// === 文字色（高对比度） ===
TEXT_BRIGHT: 0xf0e0d0,         // 标题文字 (对比度 7.5:1)
TEXT_TIP: 0xd4c4b4,            // 内容文字 (对比度 5.2:1)
TEXT_WARM: 0xe5d5c5,           // 提示文字 (对比度 6.5:1)
```

---

## 需要修改的UI组件清单

| 组件 | 当前方案 | 新方案 | 优先级 |
|-----|---------|--------|--------|
| TutorialUI（集中引导） | 无边框 | 方案3（渐变玻璃） | P0 |
| TutorialUI（场景提示） | 无边框 | 方案6（悬浮卡片） | P1 |
| SaveUI（存档弹窗） | 无边框 | 方案5（3D立体）+ 方案8（槽位） | P0 |
| DialogUI（NPC对话） | 半透明 | 方案2（深色玻璃） | P1 |
| InventoryUI（背包） | 简单边框 | 方案4（新拟态） | P1 |
| ResultUI（诊断结果） | 无边框 | 方案5（3D立体） | P1 |
| TitleScene文字 | 低对比度 | TEXT_TIP/TEXT_WARM | P0 |

---

## 验收标准

- [ ] 弹窗边框清晰可见（对比度 > 4:1）
- [ ] 文字对比度 ≥ 4.5:1 (WCAG AA)
- [ ] 3D立体效果（亮左上+暗右下）
- [ ] 新拟态凸起/凹陷效果可区分
- [ ] 内凹槽位凹陷效果清晰
- [ ] 进度条与边框对齐
- [ ] 场景提示不溢出容器

---

*本文档由 Claude Code 生成并更新于 2026-04-18*