# 第三轮视觉优化实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 扩展UI颜色常量定义，添加柔和色系，统一次要文字颜色，提升AI评估配色协调度至80分以上

**Architecture:** 扩展ui-color-theme.ts新增7个柔和色系常量 → 更新TEXT_SECONDARY为暖米黄 → 验证评估改进

**Tech Stack:** TypeScript + Phaser 3 + Vitest单元测试

---

## File Structure

```
src/data/ui-color-theme.ts     # Modify: 新增7个柔和色系常量，更新TEXT_SECONDARY

tests/unit/
└── ui-color-theme.spec.ts     # Create: 颜色常量单元测试

docs/superpowers/
└── plans/
    └── 2026-04-17-round3-visual-optimization.md  # 本计划文档

CLAUDE.md                      # Modify: 更新执行状态

reports/visual_acceptance/     # Output: 新评估报告
```

**说明**: TEXT_SECONDARY的更改将自动影响以下11个UI文件的29处引用：
- DecoctionUI.ts (7处)
- ProcessingUI.ts (7处)
- PlantingUI.ts (4处)
- InquiryUI.ts (7处)
- CaseDetailUI.ts (3处)
- CasesListUI.ts (1处)
- SaveUI.ts (1处)
- InventoryUI.ts (1处)
- TutorialUI.ts (1处)

无需逐一修改，常量引用自动生效。

---

## Task 1: 扩展颜色常量定义

**Files:**
- Modify: `src/data/ui-color-theme.ts`
- Create: `tests/unit/ui-color-theme.spec.ts`

- [ ] **Step 1: 创建颜色常量单元测试**

创建测试文件验证颜色定义正确性：

```typescript
// tests/unit/ui-color-theme.spec.ts
import { describe, it, expect } from 'vitest';
import { UI_COLORS, UI_COLOR_STRINGS } from '../../src/data/ui-color-theme';

describe('UI Color Theme - Round 3 Extensions', () => {
  describe('新增柔和色系常量', () => {
    it('should define GREEN_SOFT as #4a7c59', () => {
      expect(UI_COLORS.GREEN_SOFT).toBe(0x4a7c59);
      expect(UI_COLOR_STRINGS.GREEN_SOFT).toBe('#4a7c59');
    });

    it('should define GREEN_AUXILIARY as #6b8e4e', () => {
      expect(UI_COLORS.GREEN_AUXILIARY).toBe(0x6b8e4e);
      expect(UI_COLOR_STRINGS.GREEN_AUXILIARY).toBe('#6b8e4e');
    });

    it('should define BLUE_WARM as #5c6b7a', () => {
      expect(UI_COLORS.BLUE_WARM).toBe(0x5c6b7a);
      expect(UI_COLOR_STRINGS.BLUE_WARM).toBe('#5c6b7a');
    });

    it('should define YELLOW_EARTH as #c4a35a', () => {
      expect(UI_COLORS.YELLOW_EARTH).toBe(0xc4a35a);
      expect(UI_COLOR_STRINGS.YELLOW_EARTH).toBe('#c4a35a');
    });

    it('should define YELLOW_WARM as #f5e6d3 (暖米黄)', () => {
      expect(UI_COLORS.YELLOW_WARM).toBe(0xf5e6d3);
      expect(UI_COLOR_STRINGS.YELLOW_WARM).toBe('#f5e6d3');
    });

    it('should define BROWN_MAIN as #8b6f47', () => {
      expect(UI_COLORS.BROWN_MAIN).toBe(0x8b6f47);
      expect(UI_COLOR_STRINGS.BROWN_MAIN).toBe('#8b6f47');
    });

    it('should define BROWN_DARK as #6b5b3d', () => {
      expect(UI_COLORS.BROWN_DARK).toBe(0x6b5b3d);
      expect(UI_COLOR_STRINGS.BROWN_DARK).toBe('#6b5b3d');
    });
  });

  describe('次要文字颜色更新', () => {
    it('should update TEXT_SECONDARY to #f5e6d3 (暖米黄)', () => {
      // TEXT_SECONDARY应从#c0a080改为#f5e6d3
      expect(UI_COLOR_STRINGS.TEXT_SECONDARY).toBe('#f5e6d3');
    });
  });

  describe('颜色常量一致性', () => {
    it('should have matching number and string constants for new colors', () => {
      // 验证每个新常量的number和string版本匹配
      const newColors = [
        'GREEN_SOFT', 'GREEN_AUXILIARY', 'BLUE_WARM',
        'YELLOW_EARTH', 'YELLOW_WARM', 'BROWN_MAIN', 'BROWN_DARK'
      ];

      for (const colorName of newColors) {
        const numValue = UI_COLORS[colorName as keyof typeof UI_COLORS];
        const strValue = UI_COLOR_STRINGS[colorName as keyof typeof UI_COLOR_STRINGS];

        // 从字符串解析十六进制值并比较
        const parsedFromStr = parseInt(strValue.replace('#', ''), 16);
        expect(numValue).toBe(parsedFromStr);
      }
    });
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

```bash
npx vitest run tests/unit/ui-color-theme.spec.ts
```

Expected: 测试失败，因为新常量尚未定义

- [ ] **Step 3: 扩展ui-color-theme.ts添加新常量**

修改`src/data/ui-color-theme.ts`，在现有常量后添加柔和色系：

```typescript
// src/data/ui-color-theme.ts
// === 在UI_COLORS对象中添加（第66行之后） ===

export const UI_COLORS = {
  // === 面板背景 ===
  PANEL_PRIMARY: 0x408080,
  PANEL_SECONDARY: 0x402020,
  PANEL_LIGHT: 0x505050,
  PANEL_DARK: 0x303030,

  // === 按钮系统 ===
  BUTTON_PRIMARY: 0x80a040,
  BUTTON_PRIMARY_HOVER: 0x90b050,
  BUTTON_SECONDARY: 0x604020,
  BUTTON_SECONDARY_HOVER: 0x704030,
  BUTTON_DISABLED: 0x404040,
  BUTTON_SUCCESS: 0x60a040,
  BUTTON_WARNING: 0xe0c040,

  // === 边框/装饰 ===
  BORDER_PRIMARY: 0x604020,
  BORDER_LIGHT: 0xc0a080,
  DIVIDER: 0x504030,

  // === 状态色 ===
  STATUS_SUCCESS: 0x60a040,
  STATUS_WARNING: 0xe0c040,
  STATUS_ERROR: 0x402020,
  STATUS_LOCKED: 0x404040,

  // === 装饰色 ===
  ACCENT_SKY: 0x40a0c0,
  ACCENT_GRASS: 0x80a040,

  // === 新增：柔和色系（AI建议的田园治愈色调） ===
  /** 绿系主色（柔和版） - 用于高亮/选中 */
  GREEN_SOFT: 0x4a7c59,
  /** 绿系辅色 */
  GREEN_AUXILIARY: 0x6b8e4e,
  /** 灰蓝系（温暖版） - 用于面板背景替代 */
  BLUE_WARM: 0x5c6b7a,
  /** 土黄系 - 用于背景装饰 */
  YELLOW_EARTH: 0xc4a35a,
  /** 暖米黄 - 用于次要文字 */
  YELLOW_WARM: 0xf5e6d3,
  /** 棕系主色（温暖版） - 用于边框 */
  BROWN_MAIN: 0x8b6f47,
  /** 棕系暗色 - 用于深色边框 */
  BROWN_DARK: 0x6b5b3d,

} as const;

// === 在UI_COLOR_STRINGS对象中添加（第88行之后） ===

export const UI_COLOR_STRINGS = {
  PANEL_PRIMARY: '#408080',
  PANEL_SECONDARY: '#402020',
  PANEL_LIGHT: '#505050',
  PANEL_DARK: '#303030',
  BUTTON_PRIMARY: '#80a040',
  BUTTON_PRIMARY_HOVER: '#90b050',
  BUTTON_SECONDARY: '#604020',
  BUTTON_SECONDARY_HOVER: '#704030',
  BUTTON_SUCCESS: '#60a040',
  TEXT_PRIMARY: '#ffffff',

  // === 更新：次要文字改为暖米黄 ===
  TEXT_SECONDARY: '#f5e6d3',  // 从#c0a080改为#f5e6d3

  TEXT_HIGHLIGHT: '#80a040',
  TEXT_DISABLED: '#808080',
  STATUS_SUCCESS: '#60a040',
  STATUS_WARNING: '#e0c040',
  ACCENT_SKY: '#40a0c0',

  // === 新增：柔和色系字符串常量 ===
  GREEN_SOFT: '#4a7c59',
  GREEN_AUXILIARY: '#6b8e4e',
  BLUE_WARM: '#5c6b7a',
  YELLOW_EARTH: '#c4a35a',
  YELLOW_WARM: '#f5e6d3',
  BROWN_MAIN: '#8b6f47',
  BROWN_DARK: '#6b5b3d',

} as const;
```

- [ ] **Step 4: 运行测试验证通过**

```bash
npx vitest run tests/unit/ui-color-theme.spec.ts
```

Expected: 10个测试全部通过

- [ ] **Step 5: 编译验证**

```bash
npx tsc --noEmit
```

Expected: 无编译错误

- [ ] **Step 6: 提交颜色常量扩展**

```bash
git add src/data/ui-color-theme.ts tests/unit/ui-color-theme.spec.ts
git commit -m "feat: extend UI color theme with soft pastoral colors for better harmony"
```

---

## Task 2: 验证TEXT_SECONDARY自动传播

**Files:**
- Verify: 11个使用TEXT_SECONDARY的UI文件

- [ ] **Step 1: 验证DecoctionUI.ts使用TEXT_SECONDARY**

检查DecoctionUI.ts确认使用常量而非硬编码：

```bash
grep -n "TEXT_SECONDARY" src/ui/DecoctionUI.ts
```

Expected: 7处引用，全部使用`UI_COLOR_STRINGS.TEXT_SECONDARY`

- [ ] **Step 2: 验证ProcessingUI.ts使用TEXT_SECONDARY**

```bash
grep -n "TEXT_SECONDARY" src/ui/ProcessingUI.ts
```

Expected: 7处引用

- [ ] **Step 3: 验证其他UI文件**

```bash
grep -n "TEXT_SECONDARY" src/ui/*.ts | wc -l
```

Expected: 共29处引用，无硬编码#c0a080

- [ ] **Step 4: 确认无硬编码旧颜色**

```bash
grep -rn "#c0a080" src/ui/
```

Expected: 无匹配（旧颜色已替换）

---

## Task 3: 重新截图采集和评估验证

**Files:**
- Run: Playwright截图测试
- Run: Python评估脚本
- Output: `reports/visual_acceptance/summary_report.md`

- [ ] **Step 1: 检查开发服务器状态**

```bash
curl -s http://localhost:5173 > /dev/null && echo "Server running" || (npm run dev &) && sleep 5
```

如果服务器未运行，后台启动并等待5秒。

- [ ] **Step 2: 运行截图采集**

```bash
npx playwright test tests/visual_acceptance/screenshot_collector.spec.ts --workers=1 --timeout=60000
```

Expected: 25+截图成功采集

- [ ] **Step 3: 运行AI评估**

```bash
cd /home/lixiang/Desktop/zhongyi_game_v3
python3 scripts/visual_acceptance/run_evaluation.py
```

Expected: 生成评估报告

- [ ] **Step 4: 查看评估报告**

```bash
cat reports/visual_acceptance/summary_report.md
```

检查关键指标：
- 配色协调度平均得分（目标≥80）
- 平均加权得分（目标≥80）
- 通过率（目标≥60%）

- [ ] **Step 5: 记录评估结果**

如果达标，提交评估报告：

```bash
git add reports/visual_acceptance/
git commit -m "test: run visual acceptance evaluation after round 3 color optimization"
```

如果未达标，记录差距并准备后续迭代。

---

## Task 4: 更新CLAUDE.md文档

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: 更新执行状态部分**

在CLAUDE.md的UI配色协调优化执行状态部分添加第三轮记录：

```markdown
**第三轮AI评估结果** (2026-04-17):

| 任务 | 描述 | 状态 |
|-----|------|------|
| Task 1 | 扩展颜色常量（新增7个柔和色系） | ✅ |
| Task 2 | TEXT_SECONDARY更新为暖米黄#f5e6d3 | ✅ |
| Task 3 | 重新评估验证 | ⏳ |

**新增柔和色系常量**:
| 常量名 | 颜色值 | 用途 |
|-------|-------|------|
| GREEN_SOFT | #4a7c59 | 柔和绿色（高亮/选中） |
| GREEN_AUXILIARY | #6b8e4e | 绿系辅色 |
| BLUE_WARM | #5c6b7a | 温暖灰蓝（面板背景） |
| YELLOW_EARTH | #c4a35a | 土黄系（背景装饰） |
| YELLOW_WARM | #f5e6d3 | 暖米黄（次要文字） |
| BROWN_MAIN | #8b6f47 | 温暖棕系（边框） |
| BROWN_DARK | #6b5b3d | 棕系暗色 |

**设计文档**: [第三轮视觉优化规范](docs/superpowers/specs/2026-04-17-round3-visual-optimization-spec.md)
```

- [ ] **Step 2: 提交文档更新**

```bash
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md with round 3 visual optimization status"
```

---

## Self-Review Checklist

**1. Spec coverage:**
- [x] 扩展颜色常量定义（7个新色系） → Task 1
- [x] TEXT_SECONDARY更新为暖米黄 → Task 1
- [x] 验证自动传播到11个UI文件 → Task 2
- [x] 重新评估验证 → Task 3
- [x] 文档更新 → Task 4

**2. Placeholder scan:**
- [x] 无"TBD"占位符
- [x] 无"TODO"占位符
- [x] 所有代码步骤包含完整实现
- [x] 所有命令包含预期输出

**3. Type consistency:**
- [x] UI_COLORS新常量与UI_COLOR_STRINGS新常量名称一致
- [x] 颜色数值与字符串解析一致（测试验证）
- [x] TEXT_SECONDARY定义位置明确

---

Plan complete and saved to `docs/superpowers/plans/2026-04-17-round3-visual-optimization.md`.

**Two execution options:**

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**