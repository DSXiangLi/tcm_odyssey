# UI视觉问题修复实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 修复UI视觉问题（荧光绿色残留、透明度过高、布局过大），提升AI评估得分至80+

**Architecture:** 批量替换荧光绿色 → 降低透明度至0.85 → 调整弹窗尺寸留边距 → 重新评估验证

**Tech Stack:** TypeScript + Phaser 3

---

## File Structure

```
src/
├── data/
│   └── ui-color-theme.ts     # 可能添加TEXT_CONTENT常量
│
├── scenes/
│   ├── ClinicScene.ts        # 问诊按钮荧光绿修复
│   ├── DecoctionScene.ts     # 布局尺寸调整
│   ├── ProcessingScene.ts    # 布局尺寸调整
│   └── PlantingScene.ts      # 布局尺寸调整
│
├── ui/
│   ├── PulseUI.ts            # 荧光绿+透明度+布局
│   ├── TongueUI.ts           # 荧光绿+透明度+布局
│   ├── SyndromeUI.ts         # 荧光绿+透明度+布局
│   ├── PrescriptionUI.ts     # 荧光绿+透明度+布局
│   ├── ResultUI.ts           # 荧光绿+透明度+布局
│   ├── DialogUI.ts           # 透明度调整
│   ├── TutorialUI.ts         # 透明度调整
│   ├── SaveUI.ts             # 透明度调整
│   ├── InventoryUI.ts        # 透明度调整
│   ├── CasesListUI.ts        # 透明度+布局
│   ├── CaseDetailUI.ts       # 透明度+布局
│   ├── InquiryUI.ts          # 透明度+布局
│   ├── NPCFeedbackUI.ts      # 透明度+布局
│   ├── DecoctionUI.ts        # 透明度调整
│   ├── ProcessingUI.ts       # 透明度调整
│   ├── PlantingUI.ts         # 透明度调整
│   └── ExperienceUI.ts       # 透明度调整

docs/
└── superpowers/
    └── specs/
        └── 2026-04-17-ui-visual-fixes-spec.md  # 已创建的规范

reports/
└── visual_acceptance/
    └── summary_report.md     # AI评估报告
```

---

## Task 1: ClinicScene问诊按钮荧光绿修复

**Files:**
- Modify: `src/scenes/ClinicScene.ts`

- [ ] **Step 1: 查找荧光绿色代码**

找到第440行的问诊按钮创建代码：

```typescript
// 当前代码（第438-441行）
this.inquiryButton = this.add.text(10, 70, '[按 I 开始问诊]', {
  fontSize: '16px',
  color: '#00ff00',  // 荧光绿 - 需替换
});
```

- [ ] **Step 2: 替换为场景提取绿色**

将荧光绿替换为BUTTON_SUCCESS：

```typescript
this.inquiryButton = this.add.text(10, 70, '[按 I 开始问诊]', {
  fontSize: '16px',
  color: UI_COLOR_STRINGS.BUTTON_SUCCESS,  // #60a040 场景提取绿
});
```

- [ ] **Step 3: 确保导入正确**

检查文件顶部是否有ui-color-theme导入，如无则添加：

```typescript
import { UI_COLORS, UI_COLOR_STRINGS } from '../data/ui-color-theme';
```

- [ ] **Step 4: 编译验证**

```bash
npx tsc --noEmit
```

Expected: 无编译错误

- [ ] **Step 5: 提交ClinicScene修复**

```bash
git add src/scenes/ClinicScene.ts
git commit -m "fix: replace fluorescent green in ClinicScene inquiry button"
```

---

## Task 2: PulseUI荧光绿+透明度+布局修复

**Files:**
- Modify: `src/ui/PulseUI.ts`

- [ ] **Step 1: 修复背景透明度和尺寸**

找到第43行的背景创建代码：

```typescript
// 当前代码
this.background = scene.add.rectangle(0, 0, 780, 480, UI_COLORS.PANEL_PRIMARY, 0.95);

// 新代码：降低透明度，减小尺寸
this.background = scene.add.rectangle(0, 0, 720, 420, UI_COLORS.PANEL_PRIMARY, 0.85);
```

- [ ] **Step 2: 修复描述区域透明度**

找到第91行：

```typescript
// 当前代码
const descBg = scene.add.rectangle(0, -100, 600, 120, UI_COLORS.PANEL_SECONDARY, 0.9);

// 新代码
const descBg = scene.add.rectangle(0, -100, 560, 120, UI_COLORS.PANEL_SECONDARY, 0.9);
```

- [ ] **Step 3: 修复选中选项荧光绿**

找到第262行和第285行的选中高亮代码：

```typescript
// 当前代码
option.setColor('#00ff00');

// 新代码
option.setColor(UI_COLOR_STRINGS.BUTTON_PRIMARY);
```

- [ ] **Step 4: 修复正确答案荧光绿**

找到第325行：

```typescript
// 当前代码
const resultColor = isCorrect ? '#00ff00' : '#ff6600';

// 新代码
const resultColor = isCorrect ? UI_COLOR_STRINGS.BUTTON_SUCCESS : '#ff6600';
```

- [ ] **Step 5: 编译验证**

```bash
npx tsc --noEmit
```

Expected: 无编译错误

- [ ] **Step 6: 提交PulseUI修复**

```bash
git add src/ui/PulseUI.ts
git commit -m "fix: replace fluorescent green and adjust transparency/layout in PulseUI"
```

---

## Task 3: TongueUI荧光绿+透明度+布局修复

**Files:**
- Modify: `src/ui/TongueUI.ts`

- [ ] **Step 1: 修复背景透明度和尺寸**

找到第48行：

```typescript
// 当前代码
this.background = scene.add.rectangle(0, 0, 780, 560, UI_COLORS.PANEL_PRIMARY, 0.95);

// 新代码
this.background = scene.add.rectangle(0, 0, 720, 480, UI_COLORS.PANEL_PRIMARY, 0.85);
```

- [ ] **Step 2: 修复图片占位框透明度**

找到第102行：

```typescript
// 当前代码
this.tongueImagePlaceholder = scene.add.rectangle(0, -150, 300, 150, UI_COLORS.PANEL_LIGHT, 0.9);

// 保持透明度0.9，尺寸调整
this.tongueImagePlaceholder = scene.add.rectangle(0, -150, 280, 140, UI_COLORS.PANEL_LIGHT, 0.9);
```

- [ ] **Step 3: 修复选中选项荧光绿**

找到第393行：

```typescript
// 当前代码
selectedOption.setColor('#00ff00');

// 新代码
selectedOption.setColor(UI_COLOR_STRINGS.BUTTON_PRIMARY);
```

- [ ] **Step 4: 修复正确答案荧光绿**

找到第435行：

```typescript
// 当前代码
const resultColor = isAllCorrect ? '#00ff00' : '#ffaa00';

// 新代码
const resultColor = isAllCorrect ? UI_COLOR_STRINGS.BUTTON_SUCCESS : '#ffaa00';
```

- [ ] **Step 5: 编译验证**

```bash
npx tsc --noEmit
```

- [ ] **Step 6: 提交TongueUI修复**

```bash
git add src/ui/TongueUI.ts
git commit -m "fix: replace fluorescent green and adjust transparency/layout in TongueUI"
```

---

## Task 4: SyndromeUI荧光绿+透明度+布局修复

**Files:**
- Modify: `src/ui/SyndromeUI.ts`

- [ ] **Step 1: 修复背景透明度和尺寸**

找到第53行：

```typescript
// 当前代码
this.background = scene.add.rectangle(0, 0, 780, 560, UI_COLORS.PANEL_PRIMARY, 0.95);

// 新代码
this.background = scene.add.rectangle(0, 0, 720, 480, UI_COLORS.PANEL_PRIMARY, 0.85);
```

- [ ] **Step 2: 修复总结区域尺寸**

找到第107行：

```typescript
// 当前代码
const summaryBg = scene.add.rectangle(0, 0, 600, 100, UI_COLORS.PANEL_SECONDARY, 0.9);

// 新代码
const summaryBg = scene.add.rectangle(0, 0, 560, 100, UI_COLORS.PANEL_SECONDARY, 0.9);
```

- [ ] **Step 3: 修复推理框尺寸**

找到第207行：

```typescript
// 当前代码
this.reasoningBox = scene.add.rectangle(0, 130, 700, 120, UI_COLORS.PANEL_LIGHT, 0.9);

// 新代码
this.reasoningBox = scene.add.rectangle(0, 130, 660, 120, UI_COLORS.PANEL_LIGHT, 0.9);
```

- [ ] **Step 4: 修复选中选项荧光绿**

找到第299行：

```typescript
// 当前代码
option.setColor('#00ff00');

// 新代码
option.setColor(UI_COLOR_STRINGS.BUTTON_PRIMARY);
```

- [ ] **Step 5: 修复正确答案荧光绿**

找到第340行：

```typescript
// 当前代码
const resultColor = isCorrect ? '#00ff00' : '#ffaa00';

// 新代码
const resultColor = isCorrect ? UI_COLOR_STRINGS.BUTTON_SUCCESS : '#ffaa00';
```

- [ ] **Step 6: 编译验证**

```bash
npx tsc --noEmit
```

- [ ] **Step 7: 提交SyndromeUI修复**

```bash
git add src/ui/SyndromeUI.ts
git commit -m "fix: replace fluorescent green and adjust transparency/layout in SyndromeUI"
```

---

## Task 5: PrescriptionUI荧光绿+透明度+布局修复

**Files:**
- Modify: `src/ui/PrescriptionUI.ts`

- [ ] **Step 1: 修复背景透明度和尺寸**

找到第42行：

```typescript
// 当前代码
this.background = scene.add.rectangle(0, 0, 780, 560, UI_COLORS.PANEL_PRIMARY, 0.95);

// 新代码
this.background = scene.add.rectangle(0, 0, 720, 480, UI_COLORS.PANEL_PRIMARY, 0.85);
```

- [ ] **Step 2: 修复详情框尺寸**

找到第146行：

```typescript
// 当前代码
this.detailBox = scene.add.rectangle(0, 60, 700, 200, UI_COLORS.PANEL_SECONDARY, 0.9);

// 新代码
this.detailBox = scene.add.rectangle(0, 60, 660, 180, UI_COLORS.PANEL_SECONDARY, 0.9);
```

- [ ] **Step 3: 修复选中选项荧光绿**

找到第233行：

```typescript
// 当前代码
option.setColor('#00ff00');

// 新代码
option.setColor(UI_COLOR_STRINGS.BUTTON_PRIMARY);
```

- [ ] **Step 4: 修复正确答案荧光绿**

找到第319行：

```typescript
// 当前代码
const resultColor = isCorrect ? '#00ff00' : '#ff6600';

// 新代码
const resultColor = isCorrect ? UI_COLOR_STRINGS.BUTTON_SUCCESS : '#ff6600';
```

- [ ] **Step 5: 编译验证**

```bash
npx tsc --noEmit
```

- [ ] **Step 6: 提交PrescriptionUI修复**

```bash
git add src/ui/PrescriptionUI.ts
git commit -m "fix: replace fluorescent green and adjust transparency/layout in PrescriptionUI"
```

---

## Task 6: ResultUI荧光绿+透明度+布局修复

**Files:**
- Modify: `src/ui/ResultUI.ts`

- [ ] **Step 1: 修复背景透明度和尺寸**

找到第46行：

```typescript
// 当前代码
this.background = scene.add.rectangle(0, 0, 780, 600, UI_COLORS.PANEL_PRIMARY, 0.95);

// 新代码
this.background = scene.add.rectangle(0, 0, 720, 480, UI_COLORS.PANEL_PRIMARY, 0.85);
```

- [ ] **Step 2: 修复总分背景尺寸**

找到第102行：

```typescript
// 当前代码
const totalBg = scene.add.rectangle(0, -230, 200, 80, UI_COLORS.PANEL_SECONDARY, 0.9);

// 新代码：调整位置和尺寸适配新面板
const totalBg = scene.add.rectangle(0, -180, 180, 70, UI_COLORS.PANEL_SECONDARY, 0.9);
```

- [ ] **Step 3: 修复评分条透明度**

找到第166行和第173行：

```typescript
// 当前代码（两处alpha 0.9）
const barBg = scene.add.rectangle(..., UI_COLORS.PANEL_LIGHT, 0.9);
const barFill = scene.add.rectangle(..., ..., 0.9);

// 新代码：保持0.9用于子元素
// 无需修改，0.9用于子元素背景是合适的
```

- [ ] **Step 4: 修复NPC反馈背景尺寸**

找到第236行：

```typescript
// 当前代码
const feedbackBg = scene.add.rectangle(0, 0, 700, 100, UI_COLORS.PANEL_SECONDARY, 0.9);

// 新代码
const feedbackBg = scene.add.rectangle(0, 0, 660, 90, UI_COLORS.PANEL_SECONDARY, 0.9);
```

- [ ] **Step 5: 修复头像占位尺寸**

找到第241行：

```typescript
// 当前代码
const avatarPlaceholder = scene.add.rectangle(-320, 0, 60, 60, UI_COLORS.BORDER_PRIMARY, 0.9);

// 新代码
const avatarPlaceholder = scene.add.rectangle(-300, 0, 50, 50, UI_COLORS.BORDER_PRIMARY, 0.9);
```

- [ ] **Step 6: 修复评分优秀文字荧光绿**

找到第212行和第222行：

```typescript
// 当前代码
color: '#00ff00'

// 新代码
color: UI_COLOR_STRINGS.BUTTON_SUCCESS
```

- [ ] **Step 7: 修复评分≥80%返回色**

找到第348行：

```typescript
// 当前代码
if (percentage >= 80) return '#00ff00';

// 新代码
if (percentage >= 80) return UI_COLOR_STRINGS.BUTTON_SUCCESS;
```

- [ ] **Step 8: 编译验证**

```bash
npx tsc --noEmit
```

- [ ] **Step 9: 提交ResultUI修复**

```bash
git add src/ui/ResultUI.ts
git commit -m "fix: replace fluorescent green and adjust transparency/layout in ResultUI"
```

---

## Task 7: 核心UI组件透明度调整

**Files:**
- Modify: `src/ui/DialogUI.ts`
- Modify: `src/ui/TutorialUI.ts`
- Modify: `src/ui/SaveUI.ts`
- Modify: `src/ui/InventoryUI.ts`

- [ ] **Step 1: DialogUI透明度调整**

找到第38行：

```typescript
// 当前代码
this.background = scene.add.rectangle(0, 0, 600, 200, UI_COLORS.PANEL_PRIMARY, 0.9);

// 新代码
this.background = scene.add.rectangle(0, 0, 600, 200, UI_COLORS.PANEL_PRIMARY, 0.85);
```

- [ ] **Step 2: TutorialUI透明度调整**

找到styles对象（第84行附近）：

```typescript
// 当前代码
background: { fillColor: UI_COLORS.PANEL_PRIMARY, alpha: 0.95 },
tipBackground: { fillColor: UI_COLORS.PANEL_PRIMARY, alpha: 0.9 },

// 新代码
background: { fillColor: UI_COLORS.PANEL_PRIMARY, alpha: 0.85 },
tipBackground: { fillColor: UI_COLORS.PANEL_PRIMARY, alpha: 0.85 },
```

以及第393行弹窗背景：

```typescript
// 当前代码
const dialogBg = this.scene.add.rectangle(0, 0, dialogWidth, dialogHeight, UI_COLORS.PANEL_PRIMARY, 0.95);

// 新代码
const dialogBg = this.scene.add.rectangle(0, 0, dialogWidth, dialogHeight, UI_COLORS.PANEL_PRIMARY, 0.85);
```

- [ ] **Step 3: SaveUI透明度调整**

找到第74行styles对象：

```typescript
// 当前代码
background: { fillColor: UI_COLORS.PANEL_PRIMARY, alpha: 0.95 },

// 新代码
background: { fillColor: UI_COLORS.PANEL_PRIMARY, alpha: 0.85 },
```

以及第476行弹窗：

```typescript
// 当前代码
const dialogBg = this.scene.add.rectangle(0, 0, 300, 150, UI_COLORS.PANEL_PRIMARY, 0.95);

// 新代码
const dialogBg = this.scene.add.rectangle(0, 0, 300, 150, UI_COLORS.PANEL_PRIMARY, 0.85);
```

- [ ] **Step 4: InventoryUI透明度调整**

找到第102行styles对象：

```typescript
// 当前代码
background: { fillColor: UI_COLORS.PANEL_PRIMARY, alpha: 0.95 },

// 新代码
background: { fillColor: UI_COLORS.PANEL_PRIMARY, alpha: 0.85 },
```

- [ ] **Step 5: 编译验证**

```bash
npx tsc --noEmit
```

- [ ] **Step 6: 提交核心UI透明度调整**

```bash
git add src/ui/DialogUI.ts src/ui/TutorialUI.ts src/ui/SaveUI.ts src/ui/InventoryUI.ts
git commit -m "fix: reduce transparency to 0.85 in core UI components for better readability"
```

---

## Task 8: 病案和问诊UI透明度+布局调整

**Files:**
- Modify: `src/ui/CasesListUI.ts`
- Modify: `src/ui/CaseDetailUI.ts`
- Modify: `src/ui/InquiryUI.ts`
- Modify: `src/ui/NPCFeedbackUI.ts`

- [ ] **Step 1: CasesListUI调整**

找到第44行和第369行：

```typescript
// 背景尺寸和透明度（第44行）
// 当前代码
this.background = scene.add.rectangle(0, 0, 700, 500, UI_COLORS.PANEL_PRIMARY, 0.95);

// 新代码
this.background = scene.add.rectangle(0, 0, 640, 420, UI_COLORS.PANEL_PRIMARY, 0.85);

// 弹窗透明度（第369行）
// 当前代码
const popupBg = this.scene.add.rectangle(0, 0, 400, 100, UI_COLORS.PANEL_LIGHT, 0.95);

// 新代码
const popupBg = this.scene.add.rectangle(0, 0, 400, 100, UI_COLORS.PANEL_LIGHT, 0.85);

// 列表项透明度（第175行）
// 当前代码
const itemBg = this.scene.add.rectangle(0, 0, 650, 60, statusInfo.bgColor, 0.8);

// 新代码
const itemBg = this.scene.add.rectangle(0, 0, 600, 60, statusInfo.bgColor, 0.85);
```

- [ ] **Step 2: CaseDetailUI调整**

找到第51行和第273行：

```typescript
// 背景尺寸和透明度（第51行）
// 当前代码
this.background = scene.add.rectangle(0, 0, 800, 600, UI_COLORS.PANEL_PRIMARY, 0.95);

// 新代码
this.background = scene.add.rectangle(0, 0, 720, 480, UI_COLORS.PANEL_PRIMARY, 0.85);

// 分隔线尺寸（第273行）
// 当前代码
const divider = this.scene.add.rectangle(0, 100, 700, 2, UI_COLORS.DIVIDER);

// 新代码
const divider = this.scene.add.rectangle(0, 100, 660, 2, UI_COLORS.DIVIDER);
```

- [ ] **Step 3: InquiryUI调整**

找到第71行、第140行、第159行：

```typescript
// 背景尺寸和透明度（第71行）
// 当前代码
this.background = scene.add.rectangle(0, 0, 780, 480, UI_COLORS.PANEL_PRIMARY, 0.95);

// 新代码
this.background = scene.add.rectangle(0, 0, 640, 420, UI_COLORS.PANEL_PRIMARY, 0.85);

// 对话框尺寸和透明度（第140行）
// 当前代码
const dialogueBg = scene.add.rectangle(-150, -80, 500, 180, UI_COLORS.PANEL_SECONDARY, 0.9);

// 新代码
const dialogueBg = scene.add.rectangle(-150, -80, 460, 180, UI_COLORS.PANEL_SECONDARY, 0.9);

// 输入框尺寸和透明度（第159行）
// 当前代码
this.inputBox = scene.add.rectangle(-150, 80, 500, 50, UI_COLORS.PANEL_LIGHT, 0.9);

// 新代码
this.inputBox = scene.add.rectangle(-150, 80, 460, 50, UI_COLORS.PANEL_LIGHT, 0.9);
```

- [ ] **Step 4: NPCFeedbackUI调整**

找到第48行、第80行、第108行：

```typescript
// 背景尺寸和透明度（第48行）
// 当前代码
this.background = scene.add.rectangle(0, 0, 780, 400, UI_COLORS.PANEL_PRIMARY, 0.95);

// 新代码
this.background = scene.add.rectangle(0, 0, 640, 360, UI_COLORS.PANEL_PRIMARY, 0.85);

// NPC头像框（第80行）
// 当前代码
this.npcAvatar = scene.add.rectangle(-300, -150, 100, 100, UI_COLORS.BORDER_PRIMARY, 0.9);

// 新代码
this.npcAvatar = scene.add.rectangle(-280, -130, 80, 80, UI_COLORS.BORDER_PRIMARY, 0.9);

// 内容背景（第108行）
// 当前代码
const contentBg = scene.add.rectangle(0, -50, 700, 200, UI_COLORS.PANEL_SECONDARY, 0.9);

// 新代码
const contentBg = scene.add.rectangle(0, -50, 600, 180, UI_COLORS.PANEL_SECONDARY, 0.9);
```

- [ ] **Step 5: 编译验证**

```bash
npx tsc --noEmit
```

- [ ] **Step 6: 提交病案和问诊UI调整**

```bash
git add src/ui/CasesListUI.ts src/ui/CaseDetailUI.ts src/ui/InquiryUI.ts src/ui/NPCFeedbackUI.ts
git commit -m "fix: adjust transparency and layout in case/inquiry UI components"
```

---

## Task 9: 子游戏场景布局尺寸调整

**Files:**
- Modify: `src/scenes/DecoctionScene.ts`
- Modify: `src/scenes/ProcessingScene.ts`
- Modify: `src/scenes/PlantingScene.ts`

- [ ] **Step 1: DecoctionScene布局调整**

找到第137-141行createDecoctionUI方法：

```typescript
// 当前代码
private createDecoctionUI(): void {
  this.decoctionUI = new DecoctionUI({
    scene: this,
    width: this.cameras.main.width,   // 全屏800
    height: this.cameras.main.height  // 全屏600
  });
}

// 新代码：固定尺寸720x480
private createDecoctionUI(): void {
  this.decoctionUI = new DecoctionUI({
    scene: this,
    width: 720,
    height: 480
  });
}
```

- [ ] **Step 2: ProcessingScene布局调整**

找到类似createProcessingUI方法：

```typescript
// 查找并修改为固定尺寸
width: 720,
height: 480
```

- [ ] **Step 3: PlantingScene布局调整**

找到类似createPlantingUI方法：

```typescript
// 查找并修改为固定尺寸
width: 720,
height: 480
```

- [ ] **Step 4: 编译验证**

```bash
npx tsc --noEmit
```

- [ ] **Step 5: 提交子游戏场景布局调整**

```bash
git add src/scenes/DecoctionScene.ts src/scenes/ProcessingScene.ts src/scenes/PlantingScene.ts
git commit -m "fix: set fixed 720x480 layout for subgame scenes instead of fullscreen"
```

---

## Task 10: DecoctionUI/ProcessingUI/PlantingUI透明度调整

**Files:**
- Modify: `src/ui/DecoctionUI.ts`
- Modify: `src/ui/ProcessingUI.ts`
- Modify: `src/ui/PlantingUI.ts`

- [ ] **Step 1: DecoctionUI透明度调整**

检查是否有显式背景alpha设置，如有则调整为0.85。由于DecoctionUI使用动态创建内容，主要检查createPrescriptionSelection等方法中是否有硬编码alpha。

搜索文件中的alpha值并替换：

```typescript
// 搜索模式: , 0\.9[0-9]|
// 替换为: , 0.85
```

- [ ] **Step 2: ProcessingUI透明度调整**

同样搜索并替换alpha值。

- [ ] **Step 3: PlantingUI透明度调整**

同样搜索并替换alpha值。

- [ ] **Step 4: 编译验证**

```bash
npx tsc --noEmit
```

- [ ] **Step 5: 提交子游戏UI透明度调整**

```bash
git add src/ui/DecoctionUI.ts src/ui/ProcessingUI.ts src/ui/PlantingUI.ts
git commit -m "fix: reduce transparency in subgame UI components"
```

---

## Task 11: ExperienceUI透明度调整

**Files:**
- Modify: `src/ui/ExperienceUI.ts`

- [ ] **Step 1: ExperienceUI透明度调整**

找到第93行styles对象：

```typescript
// 当前代码
background: { fillColor: 0x1a1a2e, alpha: 0.95 },

// 新代码：使用PANEL_PRIMARY并降低透明度
background: { fillColor: UI_COLORS.PANEL_PRIMARY, alpha: 0.85 },
```

- [ ] **Step 2: 确保导入正确**

检查是否有ui-color-theme导入：

```typescript
import { UI_COLORS, UI_COLOR_STRINGS } from '../data/ui-color-theme';
```

- [ ] **Step 3: 编译验证**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: 提交ExperienceUI修复**

```bash
git add src/ui/ExperienceUI.ts
git commit -m "fix: use PANEL_PRIMARY and reduce transparency in ExperienceUI"
```

---

## Task 12: 重新截图采集和评估验证

**Files:**
- Run: Playwright测试
- Run: Python评估脚本

- [ ] **Step 1: 检查开发服务器状态**

```bash
# 检查端口5173
curl -s http://localhost:5173 > /dev/null && echo "Server running" || npm run dev &
sleep 5
```

- [ ] **Step 2: 运行截图采集**

```bash
npx playwright test tests/visual_acceptance/screenshot_collector.spec.ts --workers=1
```

Expected: 24+截图成功采集

- [ ] **Step 3: 运行AI评估**

```bash
python3 scripts/visual_acceptance/run_evaluation.py
```

Expected:
- 加权平均得分 ≥75分（目标80+）
- 配色协调度 ≥70分（目标80）
- 通过率 ≥40%（目标100%）

- [ ] **Step 4: 分析评估报告**

```bash
cat reports/visual_acceptance/summary_report.md
```

- [ ] **Step 5: 如果得分未达标**

如果评估得分仍未达标，分析问题并创建后续修复任务。

- [ ] **Step 6: 提交评估结果**

```bash
git add reports/visual_acceptance/
git commit -m "test: run visual acceptance evaluation after UI visual fixes"
```

---

## Task 13: 更新CLAUDE.md文档

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: 更新UI配色协调优化状态**

在UI配色协调优化执行状态部分添加：

```markdown
**后续修复** (2026-04-17):
- 修复荧光绿色残留12处（#00ff00 → BUTTON_PRIMARY/BUTTON_SUCCESS）
- 降低透明度至0.85（17个UI组件）
- 调整布局尺寸留边距（720x480代替全屏）

**提交记录**:
| 任务 | 提交 | 描述 |
|-----|------|------|
| Task 1-11 | TBD | 荧光绿+透明度+布局修复 |
```

- [ ] **Step 2: 提交文档更新**

```bash
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md with UI visual fixes status"
```

---

## Self-Review Checklist

**1. Spec coverage:**
- [x] 荧光绿色替换（12处） - Task 1-6
- [x] 透明度调整（17个文件） - Task 2-11
- [x] 布局尺寸调整（12个文件） - Task 2-9
- [x] 重新评估验证 - Task 12
- [x] 文档更新 - Task 13

**2. Placeholder scan:**
- [x] 无"TBD"（TBD仅用于待评估结果）
- [x] 所有代码块包含完整实现
- [x] 所有替换映射明确

**3. Type consistency:**
- [x] UI_COLOR_STRINGS.BUTTON_PRIMARY = '#80a040'
- [x] UI_COLOR_STRINGS.BUTTON_SUCCESS = '#60a040'
- [x] 所有导入路径正确

---

Plan complete and saved to `docs/superpowers/plans/2026-04-17-ui-visual-fixes-implementation.md`.

**Two execution options:**

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**