# 视觉优化实施计划

**创建日期**: 2026-04-18
**基于**: 用户反馈 + 前端UI设计最佳实践搜索结果

---

## 问题与解决方案

### 问题1: 文字对比度不足

**现状**: TEXT_SECONDARY (#b0a090) 对比度 ~3.5:1，低于WCAG AA标准(4.5:1)

**解决方案**:
| 新颜色 | Hex | 对比度 | 用途 |
|--------|-----|--------|------|
| TEXT_TIP | #d4c4b4 | ~5.2:1 | 提示文字、次要信息 |
| TEXT_WARM | #e5d5c5 | ~6.5:1 | 温暖强调文字 |
| TEXT_BRIGHT | #f0e0d0 | ~7.5:1 | 高亮文字 |

**实施步骤**:
1. 在 ui-color-theme.ts 添加新颜色常量
2. 更新 TitleScene 文字样式使用 TEXT_TIP
3. 更新 TutorialUI 场景提示使用 TEXT_WARM

---

### 问题2: 弹窗无边框

**现状**: SaveUI、TutorialUI弹窗背景与场景背景色相近，缺乏视觉分隔

**解决方案**: 为所有Rectangle背景添加边框样式
```typescript
graphics.setStrokeStyle(3, UI_COLORS.BORDER_LIGHT);  // 3px边框
graphics.strokeRect(x, y, width, height);
```

**边框颜色选择**:
- 主弹窗: BORDER_LIGHT (#c0a080) - 金棕色边框
- 次级面板: BORDER_PRIMARY (#604020) - 深棕边框

**实施步骤**:
1. SaveUI - 为存档选择弹窗添加边框
2. TutorialUI - 为新游戏确认弹窗添加边框
3. TutorialUI - 为集中引导面板添加边框

---

### 问题3: 进度条不对齐

**现状**: 填充宽度计算未考虑stroke宽度

**修复方案**:
```typescript
// 修复前: fillWidth = (barWidth - 4) * progress
// 修复后:
const strokePadding = 2 * 2;  // strokeStyle(2) 每边2px
const internalPadding = 2;    // 内部间隙
const effectiveWidth = barWidth - strokePadding - internalPadding * 2;
const fillWidth = Math.floor(effectiveWidth * progress);
```

**实施步骤**:
1. 检查 TutorialUI 进度条计算逻辑
2. 修复填充宽度公式

---

### 问题4: 文字溢出边框

**现状**: wordWrap只限制水平，不限制垂直溢出

**解决方案**:
```typescript
// 添加maxLines限制
this.tipText = this.scene.add.text(0, 0, content, {
  fontSize: '16px',
  color: '#d4c4b4',
  wordWrap: { width: width - 40 },
  maxLines: 2,  // 限制行数
  lineSpacing: 4
}).setOrigin(0.5);
```

**实施步骤**:
1. TutorialUI 场景提示添加 maxLines
2. 调整容器高度适应最大行数

---

## 实施任务清单

| 优先级 | 任务 | 文件 | 状态 |
|--------|------|------|------|
| P0 | 添加高对比度文字颜色常量 | ui-color-theme.ts | 待执行 |
| P0 | TitleScene文字使用TEXT_TIP | TitleScene.ts | 待执行 |
| P0 | SaveUI添加弹窗边框 | SaveUI.ts | 待执行 |
| P0 | TutorialUI弹窗添加边框 | TutorialUI.ts | 待执行 |
| P1 | TutorialUI进度条对齐修复 | TutorialUI.ts | 待执行 |
| P1 | TutorialUI场景提示maxLines | TutorialUI.ts | 待执行 |

---

## 验收标准

1. 文字对比度 ≥ 4.5:1 (WCAG AA)
2. 所有弹窗可见边框线
3. 进度条100%时与容器对齐
4. 场景提示文字不溢出容器

---

*本计划由 Claude Code 生成*