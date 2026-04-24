# 弹窗视觉优化实施任务清单 v3

**创建日期**: 2026-04-18
**设计文档**: docs/design/modal-design-v3-comprehensive.html
**核心原则**: 多层可见性、内容约束、统一设计方案

---

## 设计方案速查表

| 方案 | 适用场景 | 核心特征 | 透明度 |
|-----|---------|---------|--------|
| **方案A** | 标题画面/入口弹窗 | 渐变玻璃 + 金棕边框 + 顶部光带 | 0.85-0.90 |
| **方案B** | 游戏内主弹窗 | 3D立体边框（绿边框+高光阴影） | 0.85-0.90 |
| **方案C** | 确认/警告弹窗（顶层） | 强金棕边框 + 完全不透明 + 外发光 | **1.0** |
| **方案D** | 悬浮卡片/提示 | 底部阴影 + 渐变背景 + 顶部光带 | 1.0 |
| **方案8** | 内凹槽位 | 暗顶左边框 + 亮底右边框 | 1.0 |
| **方案4** | 新拟态 | 凸起/凹陷效果（阴影+高光） | 1.0 |

---

## 核心设计规范

### 1. 多层弹窗层级规范

| 层级 | 边框颜色 | 透明度 | 外阴影 | 适用场景 |
|-----|---------|--------|--------|---------|
| 底层弹窗 | 绿色(#80a040) | 0.85-0.90 | 8px blur | 主面板 |
| 顶层弹窗 | 金棕(#c0a080) | **1.0(不透明)** | 16px+外发光 | 确认弹窗 |

**关键**: 顶层弹窗必须完全不透明(alpha=1.0)，边框颜色与底层不同！

### 2. 内容宽度约束公式

```
文字maxWidth = 弹窗宽度 - 边框宽度*2 - padding*2
进度条effectiveWidth = barWidth - strokeWidth*2 - internalPadding*2
```

**关键**: 永远不要让内容超出弹窗边界！

### 3. 进度条精确对齐公式

```typescript
const strokePadding = strokeWidth * 2;      // 边框占用
const internalPadding = internalPadding * 2; // 内部间隙
const effectiveWidth = barWidth - strokePadding - internalPaddingTotal;
const fillWidth = Math.floor(effectiveWidth * progress);
const fillX = strokeWidth + internalPadding; // 填充起始位置
```

---

## P0 任务清单（必须修复）

### P0-1: TitleScene按钮3D立体化

**文件**: `src/scenes/TitleScene.ts`

**设计方案**: 方案A + 3D按钮

**修改内容**:
| 元素 | 当前样式 | 新样式 |
|-----|---------|--------|
| 开始游戏按钮 | 简单文字 | 3D渐变按钮：绿色渐变 + 3px边框 + 内高光阴影 + 外阴影 |
| 存档管理按钮 | 简单文字 | 3D渐变按钮：棕色渐变 + 2px边框 + 阴影 |
| 继续游戏按钮 | 简单文字 | 3D按钮：半透明背景 + 金棕边框 |

**Phaser实现代码**:
```typescript
// 主要按钮
const button = this.add.graphics();
// 渐变背景
button.fillGradientStyle(0x90c070, 1, 0x70a050, 1, 0x90c070, 1, 0x70a050, 1);
button.fillRoundedRect(x, y, width, height, 12);
// 边框
button.lineStyle(3, 0xa0d080, 1);
button.strokeRoundedRect(x, y, width, height, 12);
// 3D高光阴影效果（用多个fillRect模拟）
button.fillStyle(0xffffff, 0.15); // 顶部高光
button.fillRoundedRect(x, y, width, 4, 12);
button.fillStyle(0x000000, 0.2); // 底部阴影
button.fillRoundedRect(x, y + height - 4, width, 4, 12);
```

**设计细节**:
- 按钮必须有立体感（高光+阴影）
- 边框清晰可见（3px）
- hover时边框变亮

---

### P0-2: TutorialUI进度条精确对齐修复

**文件**: `src/ui/TutorialUI.ts`

**问题**: 进度条填充超出容器边界

**修复方案**:
```typescript
// 正确计算公式
private calculateEffectiveFillWidth(barWidth: number): number {
  const strokeWidth = 2;  // strokeStyle(2)
  const internalPadding = 2; // 内部间隙
  const strokePadding = strokeWidth * 2; // = 4px
  const gapPadding = internalPadding * 2; // = 4px
  return barWidth - strokePadding - gapPadding; // = barWidth - 8
}

private calculateProgressWidth(progress: number, effectiveWidth: number): number {
  return Math.floor(effectiveWidth * progress);
}
```

**验证**: 100%进度时，填充右边缘与容器右边缘完全对齐

---

### P0-3: TutorialUI跳过确认弹窗层级修复

**文件**: `src/ui/TutorialUI.ts`

**问题**: 跳过确认弹窗与集中引导面板视觉融合

**设计方案**: 方案C（强边框顶层）

**修改内容**:
| 特征 | 当前值 | 新值 |
|-----|-------|------|
| 背景透明度 | 0.85 | **1.0（完全不透明）** |
| 边框颜色 | 绿色渐变边框 | 金棕边框(#c0a080) |
| 边框宽度 | 2px | 4px |
| 外发光 | 无 | 2px金棕外发光(alpha 0.4) |
| 外阴影 | 8px | 16px + 更强阴影 |

**Phaser实现代码**:
```typescript
// 顶层确认弹窗背景
graphics.fillStyle(0x408080, 1.0); // 完全不透明！
graphics.fillRect(x, y, width, height);
// 强边框
graphics.lineStyle(4, 0xc0a080, 1);
graphics.strokeRect(x, y, width, height);
// 外发光
graphics.lineStyle(2, 0xc0a080, 0.4);
graphics.strokeRect(x - 2, y - 2, width + 4, height + 4);
// 强外阴影
// ...shadow layers
```

**设计细节**:
- 顶层弹窗边框颜色必须与底层不同（金棕vs绿）
- 完全不透明是关键！alpha=1.0
- 文字宽度约束：maxWidth = dialogWidth - 60

---

### P0-4: TutorialUI文字宽度约束

**文件**: `src/ui/TutorialUI.ts`

**问题**: 文字超出弹窗边界

**修复方案**:
```typescript
// 所有文字对象添加宽度约束
this.contentText = scene.add.text(x, y, content, {
  fontSize: '16px',
  color: UI_COLOR_STRINGS.TEXT_TIP,
  wordWrap: { width: panelWidth - 60 }, // 弹窗宽度 - 边框*2 - padding*2
  maxLines: 4, // 根据弹窗高度计算最大行数
  align: 'center'
});
```

**设计细节**:
- wordWrap宽度 = 弹窗宽度 - 60px（边框6px + padding各20px）
- maxLines根据弹窗高度计算：(height - titleHeight - buttonHeight) / lineHeight

---

### P0-5: SaveUI主面板透明度修复

**文件**: `src/ui/SaveUI.ts`

**问题**: 存档主面板与游戏背景融合不明显

**设计方案**: 方案B（3D立体边框）

**修改内容**:
| 特征 | 当前值 | 新值 |
|-----|-------|------|
| 背景透明度 | 可能过高 | 0.85-0.90 |
| 边框宽度 | 4px亮绿 | 保持4px亮绿 |
| 外阴影 | 中等 | 增强8px |

**设计细节**:
- 主面板是底层，使用绿色边框
- 透明度0.85-0.90，让背景略微可见但面板清晰

---

### P0-6: SaveUI删除确认弹窗层级修复

**文件**: `src/ui/SaveUI.ts`

**问题**: 删除确认弹窗与主面板融合

**设计方案**: 方案C（强边框顶层）

**修改内容**: 与P0-3相同规范
- 背景透明度: 1.0
- 边框颜色: 金棕(#c0a080)
- 边框宽度: 4px
- 外发光: 有

---

## P1 任务清单（问诊/诊断界面）

### P1-1: DialogUI NPC对话底栏

**文件**: `src/ui/DialogUI.ts`

**设计方案**: 方案D（悬浮卡片）

**修改内容**:
| 特征 | 新值 |
|-----|------|
| 背景渐变 | #406050 → #304030 |
| 底部阴影 | 双层阴影产生悬浮感 |
| 顶部光带 | 2px金棕 + 1px白色高光 |
| 边框 | 2px金棕边框 |

**设计细节**:
- 底部固定位置，悬浮感
- 文字宽度约束：maxWidth = dialogWidth - 40

---

### P1-2: InquiryUI问诊主面板

**文件**: `src/ui/InquiryUI.ts`

**设计方案**: 方案B（3D立体边框）

**修改内容**:
| 组件 | 设计方案 |
|-----|---------|
| 主面板 | 方案B：绿色边框 + 3D高光阴影 |
| 线索区域 | 方案8：内凹槽位分隔 |
| 选项按钮 | 3D渐变按钮 |

**设计细节**:
- 内部区域用内凹槽位分隔不同内容块
- 内容宽度约束

---

### P1-3~P1-6: 诊断界面（脉诊/舌诊/辨证/选方）

**文件**:
- `src/ui/PulseUI.ts`
- `src/ui/TongueUI.ts`
- `src/ui/SyndromeUI.ts`
- `src/ui/PrescriptionUI.ts`

**设计方案**: 方案B（3D立体边框）

**统一修改内容**:
| 特征 | 新值 |
|-----|------|
| 主面板背景 | #1a2e26, alpha 0.85 |
| 外边框 | 4px亮绿(#80a040) |
| 顶部高光 | inset 2px 2px 0 #90c070 |
| 底部阴影 | inset -2px -2px 0 #604020 |
| 外阴影 | 8px blur |

---

### P1-7: ResultUI评分界面

**文件**: `src/ui/ResultUI.ts`

**设计方案**: 方案B（3D立体边框）

**修改内容**: 与诊断界面相同规范

---

### P1-8: NPCFeedbackUI点评界面

**文件**: `src/ui/NPCFeedbackUI.ts`

**设计方案**: 方案D（悬浮卡片）

**修改内容**: 作为顶层弹窗，金棕边框 + 完全不透明

---

### P1-9~P1-11: 子游戏界面（煎药/炮制/种植）

**文件**:
- `src/ui/DecoctionUI.ts`
- `src/ui/ProcessingUI.ts`
- `src/ui/PlantingUI.ts`

**设计方案**: 方案B（3D立体边框）

**修改内容**: 各阶段弹窗统一使用3D立体边框

---

## P2 任务清单（病案/通知）

### P2-1: CasesListUI病案列表

**文件**: `src/ui/CasesListUI.ts`

**设计方案**: 方案B（3D立体边框）

---

### P2-2: CaseDetailUI病案详情

**文件**: `src/ui/CaseDetailUI.ts`

**设计方案**: 方案B（3D立体边框）

---

### P2-3: ExperienceUI解锁通知

**文件**: `src/ui/ExperienceUI.ts`

**设计方案**: 方案D（悬浮卡片）

---

## 实施顺序

```
Phase 1: P0任务（必须修复）
  1. P0-1: TitleScene按钮 → 验收
  2. P0-2: TutorialUI进度条 → 验收
  3. P0-3: TutorialUI跳过弹窗层级 → 验收
  4. P0-4: TutorialUI文字宽度 → 验收
  5. P0-5: SaveUI主面板 → 验收
  6. P0-6: SaveUI删除弹窗层级 → 验收
  → 游戏测试验收

Phase 2: P1任务（问诊/诊断）
  1. P1-1: DialogUI → 验收
  2. P1-2: InquiryUI → 验收
  3. P1-3~P1-6: 诊断界面 → 验收
  4. P1-7: ResultUI → 验收
  5. P1-8: NPCFeedbackUI → 验收
  6. P1-9~P1-11: 子游戏界面 → 验收
  → 游戏测试验收

Phase 3: P2任务（病案/通知）
  1. P2-1~P2-3 → 验收
  → 最终验收
```

---

## 验收标准

每个任务完成后需验证：

1. **视觉验收**
   - 弹窗边框清晰可见（对比度 > 4:1）
   - 顶层弹窗完全不透明，与底层明显区分
   - 进度条100%时与容器对齐
   - 文字不超出弹窗边界

2. **功能验收**
   - TypeScript编译无错误
   - 按钮交互正常
   - 弹窗切换正常

3. **测试验收**
   - 运行单元测试通过
   - 游戏启动正常

---

*本文档由 Claude Code 生成并更新于 2026-04-18*