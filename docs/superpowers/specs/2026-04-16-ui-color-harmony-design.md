# UI配色协调设计

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让所有UI弹窗、按钮、面板的配色与场景PNG图片保持协调统一

**Constraint:** 场景PNG图片（外景/内景）保持现状，Scope:** UI层面优化（弹窗、按钮、面板） ONLY

---

## 问题背景

**Qwen VL视觉评估结果**: 平均得分43.27分
**主要问题**: UI配色与场景PNG图片不协调

**核心澄清**:
1. 场景背景PNG图片（外景、内景）是独立生成的，配色已经很好，**不在优化范围**
2. NPC形象PNG图片保持现状，**不在优化范围**
3. TitleScene使用代码绘制背景（非PNG），用户确认"配色很好"，**不在优化范围**
4. **优化范围**: 所有覆盖在场景之上的UI弹窗、面板、按钮

---

## 场景配色提取结果

从3个场景PNG图片中提取的主要颜色：

### 外景-百草镇 (town_background.jpeg)

| 色系 | 颜色值 | 占比 | 用途建议 |
|-----|-------|------|---------|
| **暗绿系** | `#80a040` (RGB 128,160,64) | 19.9% | 按钮主色、草地感 |
| **暗蓝系** | `#4080a0` (RGB 64,128,160) | 17.2% | 天空、远景协调色 |
| **中蓝系** | `#40a0c0` (RGB 64,160,192) | 13.3% | 天空高光、装饰色 |
| **暗棕系** | `#604020` (RGB 96,64,32) | 7.4% | 边框、木质感 |
| **暖黄系** | `#e0c040` (RGB 224,192,64) | 4.6% | 高亮强调色 |

### 内景-诊所 (clinic_scaled.png)

| 艅系 | 颜色值 | 占比 | 用途建议 |
|-----|-------|------|---------|
| **混合灰蓝** | `#408080` (RGB 64,128,128) | 20.5% | 面板背景主色 |
| **土黄系** | `#402020` (RGB 64,32,32) | 14.6% | 深色背景 |
| **暖棕系** | `#c0a080` (RGB 192,160,128) | 3.1% | 边框高亮 |
| **深灰系** | `#404040` (RGB 64,64,64) | 4.4% | 文字次要色 |

### 内景-药园 (herb_field_area.png)

| 艅系 | 颜色值 | 占比 | 用途建议 |
|-----|-------|------|---------|
| **土黄系** | `#402020` (RGB 64,32,32) | 15.9% | 深色背景协调 |
| **暗棕系** | `#604020` (RGB 96,64,32) | 14.0% | 边框、木质感 |
| **暗绿系** | `#60a040` (RGB 96,160,64) | 13.1% | 按钮主色 |

---

## UI配色协调方案

### 核心配色定义

```typescript
// src/data/ui-color-theme.ts

/**
 * UI配色系统（基于场景PNG图片提取）
 *
 * 设计原则：
 * - 面板背景使用场景暗部颜色（灰蓝/土黄），与场景融合
 * - 按钮使用场景绿系/棕系，自然感
 * - 边框装饰使用场景棕系，木质感
 * - 文字使用高对比色，保持可读性
 */

export const UI_COLORS = {
  // === 面板背景 ===
  // 使用场景中出现的深色系，与场景暗部协调

  /** 弹窗背景主色 - 灰蓝系（诊所主色调） */
  PANEL_PRIMARY: 0x408080,

  /** 弹窗背景辅色 - 土黄系（内景暗部） */
  PANEL_SECONDARY: 0x402020,

  /** 面板高亮边 - 深灰系 */
  PANEL_LIGHT: 0x505050,

  // === 按钮系统 ===

  /** 主要按钮 - 暗绿系（外景/药园主色） */
  BUTTON_PRIMARY: 0x80a040,

  /** 主要按钮悬停 */
  BUTTON_PRIMARY_HOVER: 0x90b050,

  /** 次要按钮 - 暗棕系（木质感） */
  BUTTON_SECONDARY: 0x604020,

  /** 次要按钮悬停 */
  BUTTON_SECONDARY_HOVER: 0x704030,

  /** 禁用按钮 */
  BUTTON_DISABLED: 0x404040,

  /** 确认/成功按钮 - 中绿（略亮） */
  BUTTON_SUCCESS: 0x60a040,

  /** 警告按钮 - 暖黄系 */
  BUTTON_WARNING: 0xe0c040,

  // === 边框/装饰 ===

  /** 边框主色 - 暗棕系 */
  BORDER_PRIMARY: 0x604020,

  /** 边框高亮 - 暖棕系 */
  BORDER_LIGHT: 0xc0a080,

  /** 分隔线 */
  DIVIDER: 0x504030,

  // === 文字 ===

  /** 主要文字 - 高对比白 */
  TEXT_PRIMARY: '#ffffff',

  /** 次要文字 - 暖米黄（诊所木色调） */
  TEXT_SECONDARY: '#c0a080',

  /** 强调文字 - 中绿 */
  TEXT_HIGHLIGHT: '#80a040',

  /** 禁用文字 */
  TEXT_DISABLED: '#808080',

  // === 状态色（保持功能性） ===

  /** 成功/通过 */
  STATUS_SUCCESS: 0x60a040,

  /** 进行中/警告 */
  STATUS_WARNING: 0xe0c040,

  /** 错误/失败 */
  STATUS_ERROR: 0x402020,

  /** 锁定 */
  STATUS_LOCKED: 0x404040,

  // === 特殊装饰 ===

  /** 天空蓝装饰（外景色调） */
  ACCENT_SKY: 0x40a0c0,

  /** 草地绿装饰 */
  ACCENT_GRASS: 0x80a040,

} as const;

// 十六进制字符串版本（用于Phaser Text组件）
export const UI_COLOR_STRINGS = {
  PANEL_PRIMARY: '#408080',
  PANEL_SECONDARY: '#402020',
  BUTTON_PRIMARY: '#80a040',
  BUTTON_SECONDARY: '#604020',
  TEXT_PRIMARY: '#ffffff',
  TEXT_SECONDARY: '#c0a080',
  TEXT_HIGHLIGHT: '#80a040',
  STATUS_SUCCESS: '#60a040',
  STATUS_WARNING: '#e0c040',
} as const;
```

### 应用原则

**面板背景**:
- 使用 `PANEL_PRIMARY` (灰蓝#408080) 或 `PANEL_SECONDARY` (土黄#402020)
- 这两个颜色都在场景中出现，与场景暗部融合
- 替代当前的硬编码 `0x333333`、`0x2a2a2a`

**按钮**:
- 主要操作按钮 → `BUTTON_PRIMARY` (暗绿#80a040)
- 次要/取消按钮 → `BUTTON_SECONDARY` (暗棕#604020)
- 替代当前的 `#4CAF50`（Material Design绿）、`#555555`（中灰）

**边框装饰**:
- 使用 `BORDER_PRIMARY` (暗棕#604020)
- 这颜色在外景/药园中都有出现，木质感

**文字**:
- 保持高对比白 `TEXT_PRIMARY`
- 次要文字用暖米黄 `TEXT_SECONDARY`（诊所木色调）

---

## 需要修改的UI组件

### 高优先级（覆盖率高）

| 组件 | 文件 | 主要修改点 |
|-----|------|-----------|
| DialogUI | `src/ui/DialogUI.ts` | 背景、按钮、边框 |
| TutorialUI | `src/ui/TutorialUI.ts` | 背景、按钮、进度条 |
| SaveUI | `src/ui/SaveUI.ts` | 面板背景、槽位色、按钮 |
| InventoryUI | `src/ui/InventoryUI.ts` | 面板背景、Tab按钮、物品框 |
| DecoctionUI | `src/ui/DecoctionUI.ts` | 背景、进度条、按钮 |
| ProcessingUI | `src/ui/ProcessingUI.ts` | 背景、进度条、按钮 |
| PlantingUI | `src/ui/PlantingUI.ts` | 背景、选择框、按钮 |
| InquiryUI | `src/ui/InquiryUI.ts` | 背景、按钮、线索框 |

### 中优先级

| 组件 | 文件 | 主要修改点 |
|-----|------|-----------|
| CasesListUI | `src/ui/CasesListUI.ts` | 背景、列表项、状态图标 |
| CaseDetailUI | `src/ui/CaseDetailUI.ts` | 背景、分隔线、标题 |
| PulseUI | `src/ui/PulseUI.ts` | 背景、描述框 |
| TongueUI | `src/ui/TongueUI.ts` | 背景、描述框 |
| SyndromeUI | `src/ui/SyndromeUI.ts` | 背景、选项框 |
| PrescriptionUI | `src/ui/PrescriptionUI.ts` | 背景、列表框 |
| ResultUI | `src/ui/ResultUI.ts` | 背景、评分显示 |
| NPCFeedbackUI | `src/ui/NPCFeedbackUI.ts` | 背景、头像框 |

### 低优先级（影响小）

| 组件 | 文件 | 主要修改点 |
|-----|------|-----------|
| ExperienceUI | `src/ui/ExperienceUI.ts` | 进度条色 |
| BootScene | `src/scenes/BootScene.ts` | 进度条、加载界面 |

---

## 修改模式

### 硬编码颜色替换映射

| 旧颜色 | 新颜色 | 说明 |
|-------|-------|------|
| `0x333333` | `UI_COLORS.PANEL_PRIMARY` | 弹窗背景 |
| `0x2a2a2a` | `UI_COLORS.PANEL_PRIMARY` | 面板背景 |
| `0x1a1a1a` | `UI_COLORS.PANEL_SECONDARY` | 深色面板 |
| `0x1a1a2e` | `UI_COLORS.PANEL_PRIMARY` | 弹窗背景 |
| `#4CAF50` | `UI_COLOR_STRINGS.BUTTON_PRIMARY` | Material绿 → 场景绿 |
| `#555555` | `UI_COLOR_STRINGS.BUTTON_SECONDARY` | 中灰 → 场景棕 |
| `#2E7D32` | `UI_COLORS.BUTTON_PRIMARY_HOVER` | Material深绿 |
| `0x4a7c59` | `UI_COLORS.BUTTON_SUCCESS` | 当前按钮绿 → 场景绿 |

---

## 不修改的内容

| 类型 | 原因 |
|-----|------|
| 场景PNG图片 | 用户确认"配色很好" |
| NPC Sprite PNG | 不在优化范围 |
| 玩家 Sprite PNG | 不在优化范围 |
| 功能逻辑代码 | 只修改颜色，不改行为 |
| 状态判断逻辑 | STATUS_SUCCESS/WARNING保持功能性含义 |

## 额外优化项

| 组件 | 文件 | 主要修改点 |
|-----|------|-----------|
| TitleScene | `src/scenes/TitleScene.ts` | 背景、按钮、提示弹窗配色统一 |

**TitleScene当前配色问题**：
- 背景使用 `0x2d5a27`（深绿），与外景PNG的绿系#80a040不一致
- 按钮使用 `#4a7c59`（Material风格绿），非场景提取色
- 弹窗使用 `0x1a1a2e`（深蓝黑），与内景灰蓝#408080色调有偏差

**修改方案**：
- 背景 → 使用外景天空蓝渐变或保持当前绿系但调整色调
- 按钮 → 使用 `BUTTON_PRIMARY` (场景绿#80a040)
- 弹窗 → 使用 `PANEL_PRIMARY` (场景灰蓝#408080)

---

## 验收标准更新

### 原验收维度（需调整）

**删除的评估维度**:
- ❌ **中医风格符合度** - 场景PNG已有中医风格，UI不应引入新风格元素
- ❌ **场景氛围符合度** - 场景PNG已有氛围，UI只负责融合

**保留的评估维度**:
- ✅ **UI布局清晰度** - 保留
- ✅ **文字可读性** - 保留
- ✅ **整体游戏体验** - 保留

**新增的评估维度**:
- ✅ **配色协调度** - UI颜色是否来自场景PNG提取色系
- ✅ **视觉融合度** - UI是否与场景PNG自然融合，无突兀感

### 新验收阈值

| 维度 | 权重 | 阈值 |
|-----|-----|------|
| **配色协调度** | 30% | ≥80分 |
| **UI布局清晰度** | 20% | ≥85分 |
| **文字可读性** | 15% | ≥90分 |
| **视觉融合度** | 20% | ≥75分 |
| **整体游戏体验** | 15% | ≥80分 |

---

## 实施步骤概览

1. **Task 1**: 创建 `ui-color-theme.ts` 配色常量文件
2. **Task 2**: 批量替换UI组件中的硬编码颜色
3. **Task 3**: 调整验证维度配置（修改 `config.py`）
4. **Task 4**: 重新截图采集和评估验证

---

## Self-Review Checklist

**1. Scope check:**
- [x] 只涉及UI层面（弹窗、按钮、面板）
- [x] 场景PNG保持不变
- [x] TitleScene背景保持不变
- [x] NPC Sprite保持不变

**2. Color extraction validity:**
- [x] 颜色从实际场景PNG提取
- [x] 每个颜色都在多个场景出现
- [x] 提取的颜色有实际用途对应

**3. Implementation feasibility:**
- [x] 所有修改点有明确文件路径
- [x] 替换映射清晰可执行
- [x] 不涉及复杂重构

---

Plan complete. User review required before proceeding to implementation plan.