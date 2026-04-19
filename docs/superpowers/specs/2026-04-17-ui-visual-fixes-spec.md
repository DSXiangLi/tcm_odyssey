# UI视觉问题修复规范

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:write-plan to create implementation plan after reviewing this spec.

**创建日期**: 2026-04-17
**状态**: 待实现
**优先级**: P0

---

## 问题概述

AI视觉验收评估结果显示平均得分64.22分（目标80+分），通过率仅16%。主要问题涵盖：

1. **荧光绿色残留** - 12处硬编码#00ff00未替换为场景色系
2. **透明度过高** - alpha 0.95导致文字与背景融合，可读性差
3. **弹窗布局过大** - 多个UI组件占满800x600画面，缺乏边距
4. **文字可读性不足** - 对比度低、字号小、与背景融合

---

## 问题1: 荧光绿色残留 (#00ff00)

### 影响文件及位置

| 文件 | 行号 | 用途 | 建议替换色 |
|-----|------|------|-----------|
| `src/scenes/ClinicScene.ts` | 440 | 问诊入口按钮文字 | `#80a040` (BUTTON_PRIMARY) 或 `#60a040` (BUTTON_SUCCESS) |
| `src/ui/PulseUI.ts` | 262 | 选中选项高亮 | `#80a040` (BUTTON_PRIMARY) |
| `src/ui/PulseUI.ts` | 285 | 选中选项高亮 | `#80a040` (BUTTON_PRIMARY) |
| `src/ui/PulseUI.ts` | 325 | 正确答案颜色 | `#60a040` (BUTTON_SUCCESS) |
| `src/ui/PrescriptionUI.ts` | 233 | 选中选项高亮 | `#80a040` (BUTTON_PRIMARY) |
| `src/ui/PrescriptionUI.ts` | 319 | 正确答案颜色 | `#60a040` (BUTTON_SUCCESS) |
| `src/ui/TongueUI.ts` | 393 | 选中选项高亮 | `#80a040` (BUTTON_PRIMARY) |
| `src/ui/TongueUI.ts` | 435 | 正确答案颜色 | `#60a040` (BUTTON_SUCCESS) |
| `src/ui/SyndromeUI.ts` | 299 | 选中选项高亮 | `#80a040` (BUTTON_PRIMARY) |
| `src/ui/SyndromeUI.ts` | 340 | 正确答案颜色 | `#60a040` (BUTTON_SUCCESS) |
| `src/ui/ResultUI.ts` | 212 | 评分优秀文字 | `#60a040` (BUTTON_SUCCESS) |
| `src/ui/ResultUI.ts` | 222 | 评分优秀文字 | `#60a040` (BUTTON_SUCCESS) |
| `src/ui/ResultUI.ts` | 348 | 评分≥80%返回色 | `#60a040` (BUTTON_SUCCESS) |

### 修复原则

- **选中/高亮状态**: 使用 `UI_COLOR_STRINGS.BUTTON_PRIMARY` (`#80a040`)
- **正确答案/成功状态**: 使用 `UI_COLOR_STRINGS.BUTTON_SUCCESS` (`#60a040`)
- **错误答案/失败状态**: 保持现有红色系 (`#ff6600` 或 `#c75050`)
- **警示状态**: 使用 `UI_COLOR_STRINGS.STATUS_WARNING` (`#e0c040`)

---

## 问题2: 透明度过高

### 当前状态

大多数UI组件背景使用 `alpha: 0.95`，导致：
- 文字与背景场景融合，难以辨认
- 弹窗与游戏场景界限模糊
- 用户反馈"文字看不见"

### 需调整文件及建议值

| 文件 | 当前alpha | 建议alpha | 说明 |
|-----|----------|----------|------|
| `src/ui/DialogUI.ts` | 0.9 | 0.85 | 对话框背景 |
| `src/ui/TutorialUI.ts` | 0.95/0.9 | 0.85 | 引导面板/提示气泡 |
| `src/ui/SaveUI.ts` | 0.95 | 0.85 | 存档面板 |
| `src/ui/InventoryUI.ts` | 0.95 | 0.85 | 背包面板 |
| `src/ui/PulseUI.ts` | 0.95/0.9 | 0.85 | 脉诊面板 |
| `src/ui/TongueUI.ts` | 0.95/0.9 | 0.85 | 舌诊面板 |
| `src/ui/SyndromeUI.ts` | 0.95/0.9 | 0.85 | 辨证面板 |
| `src/ui/PrescriptionUI.ts` | 0.95/0.9 | 0.85 | 选方面板 |
| `src/ui/ResultUI.ts` | 0.95/0.9 | 0.85 | 结果面板 |
| `src/ui/NPCFeedbackUI.ts` | 0.95/0.9 | 0.85 | NPC反馈面板 |
| `src/ui/CasesListUI.ts` | 0.95/0.8 | 0.85 | 病案列表 |
| `src/ui/CaseDetailUI.ts` | 0.95 | 0.85 | 病案详情 |
| `src/ui/InquiryUI.ts` | 0.95/0.9 | 0.85 | 问诊面板 |
| `src/ui/DecoctionUI.ts` | 未显式设置 | 0.85 | 煎药面板 |
| `src/ui/ProcessingUI.ts` | 未显式设置 | 0.85 | 炮制面板 |
| `src/ui/PlantingUI.ts` | 未显式设置 | 0.85 | 种植面板 |
| `src/ui/ExperienceUI.ts` | 0.95 | 0.85 | 经验值面板 |

### 修复原则

- **主背景**: alpha 0.85 (比0.95更不透明，文字更清晰)
- **次要背景/内容区域**: alpha 0.9 (略透明，用于层级区分)
- **弹窗内子元素**: alpha 1.0 (完全不透明，确保内容清晰)

---

## 问题3: 弹窗布局过大

### 当前状态

游戏画面尺寸: **800×600像素**

| UI组件 | 当前尺寸 | 占画面比例 | 问题 |
|-------|---------|----------|------|
| ResultUI | 780×600 | 97.5%×100% | 几乎全屏，无边距 |
| CaseDetailUI | 800×600 | 100%×100% | 完全全屏 |
| TongueUI | 780×560 | 97.5%×93% | 接近全屏 |
| SyndromeUI | 780×560 | 97.5%×93% | 接近全屏 |
| PrescriptionUI | 780×560 | 97.5%×93% | 接近全屏 |
| PulseUI | 780×480 | 97.5%×80% | 横向无边距 |
| NPCFeedbackUI | 780×400 | 97.5%×67% | 横向无边距 |
| InquiryUI | 780×480 | 97.5%×80% | 横向无边距 |
| CasesListUI | 700×500 | 87.5%×83% | 边距不足 |
| DecoctionUI | 全屏(cameras.width) | 100% | 全屏占满 |
| ProcessingUI | 全屏(cameras.width) | 100% | 全屏占满 |
| PlantingUI | 全屏(cameras.width) | 100% | 全屏占满 |
| DialogUI | 600×200 | 75%×33% | 尺寸合理 |
| SaveUI | 动态计算 | - | 需检查 |

### 建议尺寸规范

**统一边距原则**: 画面边缘留20-40像素边距，避免UI"贴墙"

| UI类型 | 建议尺寸 | 边距 | 示例 |
|-------|---------|------|------|
| **全功能面板** (诊治/煎药/炮制) | 720×480 | 左右40，上下60 | ResultUI, DecoctionUI |
| **中型面板** (病案/问诊) | 640×420 | 左右80，上下90 | CasesListUI, InquiryUI |
| **小型弹窗** (对话/提示) | 保持现有 | - | DialogUI, TutorialUI |
| **详情面板** (病案详情) | 720×480 | 左右40，上下60 | CaseDetailUI |

### 需调整文件

| 文件 | 当前尺寸 | 建议尺寸 | 调整说明 |
|-----|---------|---------|---------|
| `src/ui/ResultUI.ts` | 780×600 | 720×480 | 减小20%面积 |
| `src/ui/CaseDetailUI.ts` | 800×600 | 720×480 | 减小尺寸留边距 |
| `src/ui/TongueUI.ts` | 780×560 | 720×480 | 减小尺寸 |
| `src/ui/SyndromeUI.ts` | 780×560 | 720×480 | 减小尺寸 |
| `src/ui/PrescriptionUI.ts` | 780×560 | 720×480 | 减小尺寸 |
| `src/ui/PulseUI.ts` | 780×480 | 720×420 | 减小宽度 |
| `src/ui/NPCFeedbackUI.ts` | 780×400 | 640×360 | 减小尺寸 |
| `src/ui/InquiryUI.ts` | 780×480 | 640×420 | 减小尺寸 |
| `src/ui/CasesListUI.ts` | 700×500 | 640×420 | 减小尺寸 |
| `src/scenes/DecoctionScene.ts` | 传递cameras.width | 固定720×480 | 不传全屏尺寸 |
| `src/scenes/ProcessingScene.ts` | 传递cameras.width | 固定720×480 | 不传全屏尺寸 |
| `src/scenes/PlantingScene.ts` | 传递cameras.width | 固定720×480 | 不传全屏尺寸 |

---

## 问题4: 文字可读性不足

### 当前问题

1. **对比度低**: 文字颜色与背景颜色相近
2. **字号过小**: 部分说明文字使用12-14px，难以阅读
3. **wordWrap不足**: 部分文本未设置换行宽度

### 文字颜色规范

| 用途 | 建议颜色 | 常量 |
|-----|---------|------|
| **主要标题** | `#ffffff` | TEXT_PRIMARY |
| **正文内容** | `#f0f0f0` | TEXT_PRIMARY (略调整) |
| **次要说明** | `#c0a080` | TEXT_SECONDARY |
| **提示/禁用** | `#909090` | TEXT_DISABLED |
| **高亮/选中** | `#80a040` | BUTTON_PRIMARY |
| **成功状态** | `#60a040` | BUTTON_SUCCESS |
| **警告状态** | `#e0c040` | STATUS_WARNING |
| **错误状态** | `#c75050` | (保持红色系) |

### 字号规范

| 用途 | 建议字号 | 最小字号 |
|-----|---------|---------|
| **面板标题** | 24-28px | 20px |
| **区域标题** | 18-20px | 16px |
| **正文内容** | 16-18px | 14px |
| **说明提示** | 14-16px | 12px |
| **按钮文字** | 16-18px | 14px |

### 需检查文件

已在Task 8中修复wordWrap，但需验证：
- `src/ui/DecoctionUI.ts` - 提示文字字号
- `src/ui/ProcessingUI.ts` - 说明文字字号
- `src/ui/PlantingUI.ts` - 考教问题字号

---

## 修复优先级

### P0 - 必须修复

1. **荧光绿色替换** (12处) - 直接影响配色协调度评分
2. **透明度调整** (17个文件) - 影响文字可读性

### P1 - 重要修复

3. **布局尺寸调整** (12个文件) - 影响视觉融合度评分

### P2 - 可选优化

4. **字号统一检查** - 已在Task 8部分处理

---

## 验收标准

修复完成后，AI评估应达到：

| 维度 | 目标得分 | 当前得分 |
|-----|---------|---------|
| 配色协调度 | ≥80 | 58.80 |
| UI布局清晰度 | ≥85 | 71.20 |
| 文字可读性 | ≥90 | 80.28 |
| 视觉融合度 | ≥75 | 53.40 |
| 整体游戏体验 | ≥80 | 64.12 |
| **加权平均** | ≥80 | 64.22 |

---

## 相关文档

- [UI配色协调优化实施计划](docs/superpowers/plans/2026-04-16-ui-color-harmony-implementation.md)
- [视觉验收评估报告](reports/visual_acceptance/summary_report.md)
- [UI颜色主题常量](src/data/ui-color-theme.ts)

---

*本规范基于AI视觉验收评估结果和代码分析创建 - 2026-04-17*