# Phase 2 小游戏退出按钮缺失与交互问题修复计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 修复Phase 2所有小游戏的退出按钮缺失问题和煎药UI点击失效问题，确保玩家在任何阶段都能正常退出游戏。

**Architecture:**
- 使用统一的退出按钮样式（右上角或底部）
- 退出按钮调用 manager.reset() 和场景切换
- UI尺寸使用场景实际尺寸而非固定值

**Tech Stack:** Phaser 3 + TypeScript

---

## 问题清单

| 问题ID | 系统 | 问题描述 | 优先级 | 涉及文件 |
|--------|------|---------|--------|---------|
| BUG-P2-02 | 煎药 | UI尺寸固定720x480导致点击失效 | P0 | DecoctionScene.ts |
| BUG-P2-01 | 煎药 | 6个阶段缺少退出按钮 | P0 | DecoctionUI.ts |
| BUG-P2-03 | 炅制 | 4个阶段缺少退出按钮 | P1 | ProcessingUI.ts |
| BUG-P2-04 | 种植 | 4个阶段缺少退出按钮 | P1 | PlantingUI.ts |
| BUG-P2-05 | 问诊 | 缺少退出按钮 | P1 | InquiryUI.ts |
| BUG-P2-06 | 诊治流程 | 4场景缺少退出按钮 | P2 | PulseUI.ts, TongueUI.ts, SyndromeUI.ts, PrescriptionUI.ts |

---

## 文件结构

### 需要修改的文件

| 文件 | 修改类型 | 修改内容 |
|------|---------|---------|
| `src/scenes/DecoctionScene.ts` | 修改 | UI尺寸使用相机尺寸 |
| `src/ui/DecoctionUI.ts` | 修改 | 添加退出按钮到6个阶段 |
| `src/ui/ProcessingUI.ts` | 修改 | 添加退出按钮到4个阶段 |
| `src/ui/PlantingUI.ts` | 修改 | 添加退出按钮到4个阶段 |
| `src/ui/InquiryUI.ts` | 修改 | 添加退出按钮 |
| `src/ui/PulseUI.ts` | 修改 | 添加退出按钮 |
| `src/ui/TongueUI.ts` | 修改 | 添加退出按钮 |
| `src/ui/SyndromeUI.ts` | 修改 | 添加退出按钮 |
| `src/ui/PrescriptionUI.ts` | 修改 | 添加退出按钮 |

### 测试文件

| 文件 | 测试内容 |
|------|---------|
| `tests/e2e/decoction.spec.ts` | 煎药退出按钮测试 |
| `tests/e2e/processing.spec.ts` | 炅制退出按钮测试 |
| `tests/e2e/planting.spec.ts` | 种植退出按钮测试 |

---

## 退出按钮设计规范

### 统一样式

```typescript
// 退出按钮创建函数（右上角位置）
private createExitButton(): Phaser.GameObjects.Text {
  const exitButton = this.scene.add.text(
    this.width - 60,  // 右上角
    30,
    '[退出]',
    {
      fontSize: '16px',
      color: UI_COLOR_STRINGS.TEXT_PRIMARY,
      backgroundColor: UI_COLOR_STRINGS.PANEL_DARK,
      padding: { x: 10, y: 5 }
    }
  ).setOrigin(0.5).setInteractive({ useHandCursor: true });

  exitButton.on('pointerover', () => {
    exitButton.setColor(UI_COLOR_STRINGS.BUTTON_PRIMARY_HOVER);
  });

  exitButton.on('pointerout', () => {
    exitButton.setColor(UI_COLOR_STRINGS.TEXT_PRIMARY);
  });

  exitButton.on('pointerdown', () => {
    this.handleExit();
  });

  return exitButton;
}
```

### 退出处理函数

```typescript
// 煎药/炮制系统退出（返回诊所）
private handleExit(): void {
  this.manager.reset();
  this.destroy();
  this.scene.scene.stop('DecoctionScene');  // 或 ProcessingScene
  this.scene.scene.start('ClinicScene');
}

// 种植系统退出（返回药园）
private handleExit(): void {
  this.manager.reset();
  this.destroy();
  this.scene.scene.stop('PlantingScene');
  this.scene.scene.resume('GardenScene');  // 恢复药园场景
}

// 问诊系统退出（返回诊所）
private handleExit(): void {
  this.destroy();
  this.scene.scene.stop('InquiryScene');
  this.scene.scene.start('ClinicScene');
}

// 诊治流程退出（返回诊所，终止诊断流程）
private handleExit(): void {
  this.destroy();
  this.scene.scene.stop('PulseScene');  // 或其他诊断场景
  this.scene.scene.start('ClinicScene');
}
```

---

## Task 1: 修复煎药UI点击失效问题 (BUG-P2-02)

**Files:**
- Modify: `src/scenes/DecoctionScene.ts:138-143`

**问题描述:** UI尺寸固定为720x480，但场景实际尺寸可能不一致，导致点击区域错位。

- [ ] **Step 1: 查看当前DecoctionScene的createDecoctionUI方法**

当前代码位置: `DecoctionScene.ts:137-143`
```typescript
private createDecoctionUI(): void {
  this.decoctionUI = new DecoctionUI({
    scene: this,
    width: 720,
    height: 480
  });
}
```

- [ ] **Step 2: 修改为使用相机实际尺寸**

```typescript
private createDecoctionUI(): void {
  this.decoctionUI = new DecoctionUI({
    scene: this,
    width: this.cameras.main.width,
    height: this.cameras.main.height
  });
}
```

- [ ] **Step 3: 同步修改ProcessingScene和PlantingScene**

`ProcessingScene.ts:138-143`:
```typescript
private createProcessingUI(): void {
  this.processingUI = new ProcessingUI({
    scene: this,
    width: this.cameras.main.width,
    height: this.cameras.main.height
  });
}
```

`PlantingScene.ts:121-127`:
```typescript
private createPlantingUI(): void {
  this.plantingUI = new PlantingUI({
    scene: this,
    width: this.cameras.main.width,
    height: this.cameras.main.height
  });
}
```

- [ ] **Step 4: 编译验证**

Run: `npx tsc --noEmit`
Expected: 无编译错误

- [ ] **Step 5: Commit**

```bash
git add src/scenes/DecoctionScene.ts src/scenes/ProcessingScene.ts src/scenes/PlantingScene.ts
git commit -m "fix: use camera dimensions for UI sizing in minigame scenes"
```

---

## Task 2: 为煎药UI添加退出按钮 (BUG-P2-01)

**Files:**
- Modify: `src/ui/DecoctionUI.ts`

**涉及的阶段:**
1. `showPrescriptionSelection()` - 选择方剂
2. `showHerbSelection()` - 选择药材
3. `showCompatibilityPlacement()` - 配伍放置
4. `showOrderSetting()` - 顺序设置
5. `showFireSetting()` - 火候设置
6. `showDecoctionProgress()` - 煎药进度

- [ ] **Step 1: 在DecoctionUI类中添加退出按钮创建方法**

在 `DecoctionUI.ts` 类中添加私有方法（约第105行后）:

```typescript
/**
 * 创建退出按钮（右上角）
 */
private createExitButton(): Phaser.GameObjects.Text {
  const exitButton = this.scene.add.text(
    this.width - 60,
    30,
    '[退出]',
    {
      fontSize: '16px',
      color: UI_COLOR_STRINGS.TEXT_PRIMARY,
      backgroundColor: UI_COLOR_STRINGS.PANEL_DARK,
      padding: { x: 10, y: 5 }
    }
  ).setOrigin(0.5).setInteractive({ useHandCursor: true });

  exitButton.on('pointerover', () => {
    exitButton.setColor(UI_COLOR_STRINGS.BUTTON_PRIMARY_HOVER);
  });

  exitButton.on('pointerout', () => {
    exitButton.setColor(UI_COLOR_STRINGS.TEXT_PRIMARY);
  });

  exitButton.on('pointerdown', () => {
    this.handleExit();
  });

  return exitButton;
}

/**
 * 处理退出
 */
private handleExit(): void {
  this.manager.reset();
  this.destroy();
  this.scene.scene.stop('DecoctionScene');
  this.scene.scene.start('ClinicScene');
}
```

- [ ] **Step 2: 在showPrescriptionSelection中添加退出按钮**

在 `showPrescriptionSelection()` 方法中，添加退出按钮（约第214行后，phaseText添加之前）:

```typescript
// 在 this.container.add(this.phaseText); 之前添加:

// 退出按钮
const exitButton = this.createExitButton();
this.container.add(exitButton);
```

- [ ] **Step 3: 在showHerbSelection中添加退出按钮**

在 `showHerbSelection()` 方法中，添加退出按钮（约第319行后）:

```typescript
// 在 this.phaseText?.setText('阶段: 选择药材'); 之前添加:

// 退出按钮
const exitButton = this.createExitButton();
this.contentContainer?.add(exitButton);
```

- [ ] **Step 4: 在showCompatibilityPlacement中添加退出按钮**

在 `showCompatibilityPlacement()` 方法中（约第444行后）:

```typescript
// 退出按钮
const exitButton = this.createExitButton();
this.contentContainer?.add(exitButton);
```

- [ ] **Step 5: 在showOrderSetting中添加退出按钮**

在 `showOrderSetting()` 方法中（约第563行后）:

```typescript
// 退出按钮
const exitButton = this.createExitButton();
this.contentContainer?.add(exitButton);
```

- [ ] **Step 6: 在showFireSetting中添加退出按钮**

在 `showFireSetting()` 方法中（约第650行后）:

```typescript
// 退出按钮
const exitButton = this.createExitButton();
this.contentContainer?.add(exitButton);
```

- [ ] **Step 7: 在showDecoctionProgress中添加退出按钮**

在 `showDecoctionProgress()` 方法中（约第711行后）:

```typescript
// 退出按钮（煎药进度阶段）
const exitButton = this.createExitButton();
this.contentContainer?.add(exitButton);
```

- [ ] **Step 8: 编译验证**

Run: `npx tsc --noEmit`
Expected: 无编译错误

- [ ] **Step 9: Commit**

```bash
git add src/ui/DecoctionUI.ts
git commit -m "fix: add exit button to all decoction phases"
```

---

## Task 3: 为炮制UI添加退出按钮 (BUG-P2-03) ✅ 已完成

> **Completed in:** Round 4 visual optimization commit `d05068c`

**Files:**
- Modify: `src/ui/ProcessingUI.ts`

**涉及的阶段:**
1. `showMethodSelection()` - 方法选择
2. `showAdjuvantSelection()` - 辅料选择
3. `showPreprocess()` - 预处理
4. `showProcessingProgress()` - 炮制进度

- [x] **Step 1: 在ProcessingUI类中添加退出按钮创建方法**

已在 `ProcessingUI.ts` 类中添加私有方法（第140-169行）:

```typescript
/**
 * 创建退出按钮（右上角）
 */
private createExitButton(): Phaser.GameObjects.Text {
  const exitButton = this.scene.add.text(
    this.width - 60,
    30,
    '[退出]',
    {
      fontSize: '16px',
      color: UI_COLOR_STRINGS.TEXT_PRIMARY,
      backgroundColor: UI_COLOR_STRINGS.PANEL_DARK,
      padding: { x: 10, y: 5 }
    }
  ).setOrigin(0.5).setInteractive({ useHandCursor: true });

  exitButton.on('pointerover', () => {
    exitButton.setColor(UI_COLOR_STRINGS.BUTTON_PRIMARY_HOVER);
  });

  exitButton.on('pointerout', () => {
    exitButton.setColor(UI_COLOR_STRINGS.TEXT_PRIMARY);
  });

  exitButton.on('pointerdown', () => {
    this.handleExit();
  });

  return exitButton;
}

/**
 * 处理退出
 */
private handleExit(): void {
  this.manager.reset();
  this.destroy();
  this.scene.scene.stop('ProcessingScene');
  this.scene.scene.start('ClinicScene');
}
```

- [x] **Step 2: 在showMethodSelection中添加退出按钮**

已在 `showMethodSelection()` 方法中（第412-414行）:

```typescript
// 退出按钮
const exitButton = this.createExitButton();
this.contentContainer?.add(exitButton);
```

- [x] **Step 3: 在showAdjuvantSelection中添加退出按钮**

已在 `showAdjuvantSelection()` 方法中（第479-481行）:

```typescript
// 退出按钮
const exitButton = this.createExitButton();
this.contentContainer?.add(exitButton);
```

- [x] **Step 4: 在showPreprocess中添加退出按钮**

已在 `showPreprocess()` 方法中（第531-533行）:

```typescript
// 退出按钮
const exitButton = this.createExitButton();
this.contentContainer?.add(exitButton);
```

- [x] **Step 5: 在showProcessingProgress中添加退出按钮**

已在 `showProcessingProgress()` 方法中（第602-604行）:

```typescript
// 退出按钮
const exitButton = this.createExitButton();
this.contentContainer?.add(exitButton);
```

- [x] **Step 6: 编译验证**

✅ TypeScript编译无错误

- [x] **Step 7: Commit**

已在Round 4 visual optimization中提交 (`d05068c`)

---

## Task 4: 为种植UI添加退出按钮 (BUG-P2-04)

**Files:**
- Modify: `src/ui/PlantingUI.ts`

**涉及的阶段:**
1. `showPlotSelection()` - 地块选择
2. `showWaterSelection()` - 水源选择
3. `showFertilizerSelection()` - 肥料选择
4. `showPlantingProgress()` - 种植进度

- [ ] **Step 1: 在PlantingUI类中添加退出按钮创建方法**

在 `PlantingUI.ts` 类中添加私有方法（约第94行后）:

```typescript
/**
 * 创建退出按钮（右上角）
 */
private createExitButton(): Phaser.GameObjects.Text {
  const exitButton = this.scene.add.text(
    this.width - 60,
    30,
    '[退出]',
    {
      fontSize: '16px',
      color: UI_COLOR_STRINGS.TEXT_PRIMARY,
      backgroundColor: UI_COLOR_STRINGS.PANEL_DARK,
      padding: { x: 10, y: 5 }
    }
  ).setOrigin(0.5).setInteractive({ useHandCursor: true });

  exitButton.on('pointerover', () => {
    exitButton.setColor(UI_COLOR_STRINGS.BUTTON_PRIMARY_HOVER);
  });

  exitButton.on('pointerout', () => {
    exitButton.setColor(UI_COLOR_STRINGS.TEXT_PRIMARY);
  });

  exitButton.on('pointerdown', () => {
    this.handleExit();
  });

  return exitButton;
}

/**
 * 处理退出（返回药园）
 */
private handleExit(): void {
  this.manager.cancelSelection();
  this.destroy();
  this.scene.scene.stop('PlantingScene');
  this.scene.scene.resume('GardenScene');
}
```

- [ ] **Step 2: 在showPlotSelection中添加退出按钮**

在 `showPlotSelection()` 方法中，在 clearContent() 后添加（约第315行后）:

```typescript
// 退出按钮
const exitButton = this.createExitButton();
this.contentContainer?.add(exitButton);
```

- [ ] **Step 3: 在showWaterSelection中添加退出按钮**

在 `showWaterSelection()` 方法中（约第471行后）:

```typescript
// 退出按钮
const exitButton = this.createExitButton();
this.contentContainer?.add(exitButton);
```

- [ ] **Step 4: 在showFertilizerSelection中添加退出按钮**

在 `showFertilizerSelection()` 方法中，在 addPlantButton() 之前添加（约第545行后）:

```typescript
// 退出按钮
const exitButton = this.createExitButton();
this.contentContainer?.add(exitButton);
```

- [ ] **Step 5: 在showPlantingProgress中添加退出按钮**

在 `showPlantingProgress()` 方法中（约第567行后）:

```typescript
// 退出按钮
const exitButton = this.createExitButton();
this.contentContainer?.add(exitButton);
```

- [ ] **Step 6: 编译验证**

Run: `npx tsc --noEmit`
Expected: 无编译错误

- [ ] **Step 7: Commit**

```bash
git add src/ui/PlantingUI.ts
git commit -m "fix: add exit button to intermediate planting phases"
```

---

## Task 5: 为问诊UI添加退出按钮 (BUG-P2-05)

**Files:**
- Modify: `src/ui/InquiryUI.ts`

- [ ] **Step 1: 在InquiryUI类中添加退出按钮创建方法**

在 `InquiryUI.ts` 类中添加私有方法（约第107行后）:

```typescript
/**
 * 创建退出按钮（右上角）
 */
private createExitButton(): Phaser.GameObjects.Text {
  const exitButton = this.scene.add.text(
    300,  // 右上角位置（考虑UI宽度640）
    -200,
    '[退出问诊]',
    {
      fontSize: '16px',
      color: UI_COLOR_STRINGS.TEXT_PRIMARY,
      backgroundColor: UI_COLOR_STRINGS.PANEL_DARK,
      padding: { x: 10, y: 5 }
    }
  ).setOrigin(0.5).setInteractive({ useHandCursor: true });

  exitButton.on('pointerover', () => {
    exitButton.setColor(UI_COLOR_STRINGS.BUTTON_PRIMARY_HOVER);
  });

  exitButton.on('pointerout', () => {
    exitButton.setColor(UI_COLOR_STRINGS.TEXT_PRIMARY);
  });

  exitButton.on('pointerdown', () => {
    this.handleExit();
  });

  return exitButton;
}

/**
 * 处理退出
 */
private handleExit(): void {
  // 通知场景退出
  if (this.scene instanceof InquiryScene) {
    (this.scene as any).returnToClinic();
  }
  this.destroy();
}
```

- [ ] **Step 2: 在构造函数中添加退出按钮**

在 `InquiryUI.ts` 构造函数中，在 createButtonArea 调用后添加（约第88行后）:

```typescript
// 创建退出按钮
const exitButton = this.createExitButton();
this.add(exitButton);
```

- [ ] **Step 3: 在InquiryScene中添加returnToClinic方法**

在 `InquiryScene.ts` 中添加公开方法（约第500行后）:

```typescript
/**
 * 返回诊所场景（供UI调用）
 */
returnToClinic(): void {
  this.eventBus.emit(GameEvents.SCENE_SWITCH, {
    from: 'InquiryScene',
    to: SCENES.CLINIC
  });

  // 清理组件
  if (this.inquiryUI) {
    this.inquiryUI.destroy();
  }
  if (this.clueTracker) {
    this.clueTracker.destroy();
  }
  if (this.patientGenerator) {
    this.patientGenerator.destroy();
  }

  // 切换场景
  this.scene.start(SCENES.CLINIC);
}
```

- [ ] **Step 4: 编译验证**

Run: `npx tsc --noEmit`
Expected: 无编译错误

- [ ] **Step 5: Commit**

```bash
git add src/ui/InquiryUI.ts src/scenes/InquiryScene.ts
git commit -m "fix: add exit button to inquiry UI"
```

---

## Task 6: 为脉诊UI添加退出按钮 (BUG-P2-06.1)

**Files:**
- Modify: `src/ui/PulseUI.ts`

- [ ] **Step 1: 在PulseUI类中添加退出按钮**

在 `PulseUI.ts` 的 createConfirmButton 方法后添加（约第242行后）:

```typescript
/**
 * 创建退出按钮
 */
private createExitButton(): Phaser.GameObjects.Text {
  const exitButton = this.scene.add.text(
    340,  // 右上角（考虑UI宽度720）
    -200,
    '[退出诊断]',
    {
      fontSize: '16px',
      color: UI_COLOR_STRINGS.TEXT_PRIMARY,
      backgroundColor: UI_COLOR_STRINGS.PANEL_DARK,
      padding: { x: 10, y: 5 }
    }
  ).setOrigin(0.5).setInteractive({ useHandCursor: true });

  exitButton.on('pointerover', () => {
    exitButton.setColor(UI_COLOR_STRINGS.BUTTON_PRIMARY_HOVER);
  });

  exitButton.on('pointerout', () => {
    exitButton.setColor(UI_COLOR_STRINGS.TEXT_PRIMARY);
  });

  exitButton.on('pointerdown', () => {
    this.handleExit();
  });

  return exitButton;
}

/**
 * 处理退出
 */
private handleExit(): void {
  this.destroy();
  this.scene.scene.stop('PulseScene');
  this.scene.scene.start('ClinicScene');
}
```

- [ ] **Step 2: 在构造函数中添加退出按钮**

在构造函数末尾，exposeToGlobal 之前添加（约第70行后）:

```typescript
// 创建退出按钮
const exitButton = this.createExitButton();
this.add(exitButton);
```

- [ ] **Step 3: 编译验证**

Run: `npx tsc --noEmit`
Expected: 无编译错误

- [ ] **Step 4: Commit**

```bash
git add src/ui/PulseUI.ts
git commit -m "fix: add exit button to pulse UI"
```

---

## Task 7: 为舌诊UI添加退出按钮 (BUG-P2-06.2)

**Files:**
- Modify: `src/ui/TongueUI.ts`

**UI尺寸:** 720x480，退出按钮位置为右上角 (340, -250)

- [ ] **Step 1: 在TongueUI类中添加退出按钮创建方法**

在 `TongueUI.ts` 的 createConfirmButton 方法后添加（约第343行后）:

```typescript
/**
 * 创建退出按钮
 */
private createExitButton(): Phaser.GameObjects.Text {
  const exitButton = this.scene.add.text(
    340,  // 右上角（考虑UI宽度720）
    -250,  // 与标题同高度
    '[退出诊断]',
    {
      fontSize: '16px',
      color: UI_COLOR_STRINGS.TEXT_PRIMARY,
      backgroundColor: UI_COLOR_STRINGS.PANEL_DARK,
      padding: { x: 10, y: 5 }
    }
  ).setOrigin(0.5).setInteractive({ useHandCursor: true });

  exitButton.on('pointerover', () => {
    exitButton.setColor(UI_COLOR_STRINGS.BUTTON_PRIMARY_HOVER);
  });

  exitButton.on('pointerout', () => {
    exitButton.setColor(UI_COLOR_STRINGS.TEXT_PRIMARY);
  });

  exitButton.on('pointerdown', () => {
    this.handleExit();
  });

  return exitButton;
}

/**
 * 处理退出
 */
private handleExit(): void {
  this.destroy();
  this.scene.scene.stop('TongueScene');
  this.scene.scene.start('ClinicScene');
}
```

- [ ] **Step 2: 在构造函数中添加退出按钮**

在构造函数末尾，exposeToGlobal 之前添加（约第81行后）:

```typescript
// 创建退出按钮
const exitButton = this.createExitButton();
this.add(exitButton);
```

- [ ] **Step 3: 编译验证**

Run: `npx tsc --noEmit`
Expected: 无编译错误

- [ ] **Step 4: Commit**

```bash
git add src/ui/TongueUI.ts
git commit -m "fix: add exit button to tongue UI"
```

---

## Task 8: 为辨证UI添加退出按钮 (BUG-P2-06.3)

**Files:**
- Modify: `src/ui/SyndromeUI.ts`

**UI尺寸:** 720x480，退出按钮位置为右上角 (340, -250)

- [ ] **Step 1: 在SyndromeUI类中添加退出按钮创建方法**

在 `SyndromeUI.ts` 的 createConfirmButton 方法后添加（约第254行后）:

```typescript
/**
 * 创建退出按钮
 */
private createExitButton(): Phaser.GameObjects.Text {
  const exitButton = this.scene.add.text(
    340,  // 右上角（考虑UI宽度720）
    -250,  // 与标题同高度
    '[退出诊断]',
    {
      fontSize: '16px',
      color: UI_COLOR_STRINGS.TEXT_PRIMARY,
      backgroundColor: UI_COLOR_STRINGS.PANEL_DARK,
      padding: { x: 10, y: 5 }
    }
  ).setOrigin(0.5).setInteractive({ useHandCursor: true });

  exitButton.on('pointerover', () => {
    exitButton.setColor(UI_COLOR_STRINGS.BUTTON_PRIMARY_HOVER);
  });

  exitButton.on('pointerout', () => {
    exitButton.setColor(UI_COLOR_STRINGS.TEXT_PRIMARY);
  });

  exitButton.on('pointerdown', () => {
    this.handleExit();
  });

  return exitButton;
}

/**
 * 处理退出
 */
private handleExit(): void {
  this.destroy();
  this.scene.scene.stop('SyndromeScene');
  this.scene.scene.start('ClinicScene');
}
```

- [ ] **Step 2: 在构造函数中添加退出按钮**

在构造函数末尾，exposeToGlobal 之前添加（约第83行后）:

```typescript
// 创建退出按钮
const exitButton = this.createExitButton();
this.add(exitButton);
```

- [ ] **Step 3: 编译验证**

Run: `npx tsc --noEmit`
Expected: 无编译错误

- [ ] **Step 4: Commit**

```bash
git add src/ui/SyndromeUI.ts
git commit -m "fix: add exit button to syndrome UI"
```

---

## Task 9: 为选方UI添加退出按钮 (BUG-P2-06.4)

**Files:**
- Modify: `src/ui/PrescriptionUI.ts`

**UI尺寸:** 720x480，退出按钮位置为右上角 (340, -250)

- [ ] **Step 1: 在PrescriptionUI类中添加退出按钮创建方法**

在 `PrescriptionUI.ts` 的 createConfirmButton 方法后添加（约第213行后）:

```typescript
/**
 * 创建退出按钮
 */
private createExitButton(): Phaser.GameObjects.Text {
  const exitButton = this.scene.add.text(
    340,  // 右上角（考虑UI宽度720）
    -250,  // 与标题同高度
    '[退出诊断]',
    {
      fontSize: '16px',
      color: UI_COLOR_STRINGS.TEXT_PRIMARY,
      backgroundColor: UI_COLOR_STRINGS.PANEL_DARK,
      padding: { x: 10, y: 5 }
    }
  ).setOrigin(0.5).setInteractive({ useHandCursor: true });

  exitButton.on('pointerover', () => {
    exitButton.setColor(UI_COLOR_STRINGS.BUTTON_PRIMARY_HOVER);
  });

  exitButton.on('pointerout', () => {
    exitButton.setColor(UI_COLOR_STRINGS.TEXT_PRIMARY);
  });

  exitButton.on('pointerdown', () => {
    this.handleExit();
  });

  return exitButton;
}

/**
 * 处理退出
 */
private handleExit(): void {
  this.destroy();
  this.scene.scene.stop('PrescriptionScene');
  this.scene.scene.start('ClinicScene');
}
```

- [ ] **Step 2: 在构造函数中添加退出按钮**

在构造函数末尾，exposeToGlobal 之前添加（约第69行后）:

```typescript
// 创建退出按钮
const exitButton = this.createExitButton();
this.add(exitButton);
```

- [ ] **Step 3: 编译验证**

Run: `npx tsc --noEmit`
Expected: 无编译错误

- [ ] **Step 4: Commit**

```bash
git add src/ui/PrescriptionUI.ts
git commit -m "fix: add exit button to prescription UI"
```

---

## Task 10: 最终验证与测试

**Files:**
- Run: E2E测试验证

- [ ] **Step 1: 运行TypeScript编译**

Run: `npx tsc --noEmit`
Expected: 无编译错误

- [ ] **Step 2: 运行煎药E2E测试**

Run: `npx playwright test tests/e2e/decoction.spec.ts --workers=1`
Expected: 现有测试通过，新增验证退出按钮

- [ ] **Step 3: 运行炮制E2E测试**

Run: `npx playwright test tests/e2e/processing.spec.ts --workers=1`

- [ ] **Step 4: 运行种植E2E测试**

Run: `npx playwright test tests/e2e/planting.spec.ts --workers=1`

- [ ] **Step 5: 手动启动游戏验证**

Run: `npm run dev`
手动测试:
1. 进入诊所 → 按D进入煎药 → 点击退出按钮 → 返回诊所
2. 进入诊所 → 按P进入炮制 → 点击退出按钮 → 返回诊所
3. 进入药园 → 按G进入种植 → 点击退出按钮 → 返回药园
4. 进入诊所 → 按I进入问诊 → 点击退出按钮 → 返回诊所
5. 进入问诊 → 完成问诊 → 脉诊 → 点击退出诊断 → 返回诊所

- [ ] **Step 6: Final Commit**

```bash
git add -A
git commit -m "fix: complete Phase 2 minigame exit button fixes"

# 合并所有修复的总结提交
git log --oneline -10
```

---

## 验收标准

| 标准 | 验证方法 |
|------|---------|
| 煎药UI点击正常 | 点击方剂按钮能正常触发 |
| 煎药6阶段可退出 | 每阶段右上角有退出按钮 |
| 炅制4阶段可退出 | 每阶段右上角有退出按钮 |
| 种植4阶段可退出 | 每阶段右上角有退出按钮 |
| 问诊可退出 | 右上角有退出问诊按钮 |
| 诊治流程可退出 | 脉诊/舌诊/辨证/选方都有退出按钮 |
| 退出返回正确场景 | 煎药→诊所，种植→药园，问诊→诊所 |
| TypeScript编译无错 | npx tsc --noEmit |
| E2E测试通过 | playwright测试通过 |

---

## 注意事项

1. **UI尺寸一致性**: 所有UI组件的width/height应使用场景的相机尺寸
2. **退出按钮位置**: 统一放在右上角，坐标 `(width - 60, 30)`
3. **退出按钮样式**: 统一使用 `[退出]` 文字，PANEL_DARK背景色
4. **场景切换**: 煎药/炮制/问诊→诊所，种植→药园（使用resume而非start）
5. **状态清理**: 退出前必须调用 `manager.reset()` 清理状态

---

*计划创建时间: 2026-04-18*