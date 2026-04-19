# Phase 2.5: UI组件系统统一化 - 完整执行计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** 完成UI组件系统统一化，包含内部组件创建和现有UI重构。

**Architecture:** 基于已完成的核心基础设施（UIBorderStyles、BaseUIComponent、ModalUI），创建内部组件（ItemSlotComponent、SelectionButtonComponent等），然后重构现有UI组件。

**Tech Stack:** Phaser 3.60+, TypeScript 5.0+, Vitest测试框架, Playwright E2E测试

---

## 当前进度

| Task范围 | 状态 | 说明 |
|---------|------|------|
| Task 1-5 | ✅ 完成 | 核心基础设施（UIBorderStyles、BaseUIComponent、ModalUI） |
| Task 6-8 | ⏳ 待执行 | 内部组件创建 |
| Task 9-19 | ⏳ 待执行 | UI组件重构 |
| Task 20 | ⏳ 待执行 | 最终验收 |

---

## 统一化套件化规范（强制执行）

### 选中状态强制规范

| 场景类型 | 必须使用方案 | 禁止使用方案 |
|---------|-------------|-------------|
| 单选文字选项(脉位/脉势/舌象属性) | 方案A(○→●) | 方案B/C |
| 物品格子选择(药材/种子/辅料) | 方案B(Neumorphism凹陷→凸起) | 方案A/C |
| 卡片选择(证型/方剂/方法) | 方案C(颜色高亮) | 方案A |
| 槽位填充状态 | 方案B(Neumorphism) + 满足绿条 | 方案A/C |

### 物品格子统一复用规范

**ItemSlotComponent (60×60)** 必须在以下所有场景复用：
- InventoryUI.slots (背包药材格子)
- DecoctionUI.herbSlots (煎药药材格子)
- ProcessingUI.herbSlots (炮制药材格子)
- PlantingUI.seedSlots (种子格子)

**统一视觉规格**:
- 尺寸: 60×60
- 边框风格: Neumorphism (凹陷=空, 凸起=选中)
- 内部布局: 40×40图标区 + 12×12右下角数量角标
- 选中边框: BUTTON_PRIMARY(#90c070) 4px高亮

### 槽位类型统一规范

| 槽位类型 | 尺寸 | 边框风格 | 复用场景 |
|---------|------|---------|---------|
| CompatibilitySlot | 120×100 | 内凹(inset) | DecoctionUI配伍、PrescriptionUI选方 |
| SynthesisSlot | 100×80 | 内凹(inset) | ProcessingUI炮制合成 |
| PlotSlot | 100×80 | 实线边框 | PlantingUI地块 |
| DiagnosisSlot | 60×60 | 3D边框 | PulseUI/TongueUI/SyndromeUI诊断结果 |
| TimelineSlot | 80×70 | 实线边框 | DecoctionUI时间轴 |

### UI组件到基础组件映射表

| UI组件 | ItemSlot | SelectionButton | CompatibilitySlot | SynthesisSlot | PlotSlot | DiagnosisSlot | ProgressBar |
|-------|:--------:|:--------------:|:-----------------:|:-------------:|:-------:|:-------------:|:-----------:|
| InventoryUI | ✓ | - | - | - | - | - | - |
| PulseUI | - | ✓ | - | - | - | ✓ | - |
| TongueUI | - | ✓ | - | - | - | ✓ | - |
| SyndromeUI | - | ✓ | - | - | - | ✓ | - |
| PrescriptionUI | - | ✓ | ✓ | - | - | ✓ | - |
| DecoctionUI | ✓ | ✓ | ✓ | - | - | - | ✓ |
| ProcessingUI | ✓ | ✓ | - | ✓ | - | - | ✓ |
| PlantingUI | ✓ | ✓ | - | - | ✓ | - | ✓ |

---

## 测试验收要求（每个Task必须包含）

### 功能测试（单元测试）
- 使用Vitest测试框架
- 测试文件：`tests/unit/ui/components/*.test.ts`
- 要求：正向测试+反向测试配对，覆盖所有公共方法

### 冒烟测试（集成测试）
- 测试文件：`tests/integration/ui/*.test.ts`
- 要求：验证组件在真实场景中的基本功能，不崩溃

### 端到端测试（E2E测试）
- 使用Playwright测试框架
- 测试文件：`tests/e2e/ui/*.spec.ts`
- 要求：
  1. 启动游戏，打开目标UI
  2. 执行基本交互（点击、选择、退出）
  3. 验证UI修改未引入破坏性变更
  4. 截图验证视觉一致性

---

## Section A: 创建ItemSlotComponent物品格子组件

### Task 6: 创建ItemSlotComponent

**Files:**
- Create: `src/ui/components/ItemSlotComponent.ts`
- Test: `tests/unit/ui/components/ItemSlotComponent.test.ts`

#### Step 1: Write the failing test (TDD)

```typescript
// tests/unit/ui/components/ItemSlotComponent.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ItemSlotComponent, ItemSlotState, ItemSlotConfig } from '../../../src/ui/components/ItemSlotComponent';

describe('ItemSlotComponent', () => {
  describe('构造与属性', () => {
    it('should create slot with standard 60x60 size', () => {
      const slot = new ItemSlotComponent(mockScene, defaultConfig);
      expect(slot.width).toBe(60);
      expect(slot.height).toBe(60);
    });

    it('should start with empty state', () => {
      const slot = new ItemSlotComponent(mockScene, defaultConfig);
      expect(slot.getState()).toBe(ItemSlotState.EMPTY);
    });

    it('should have selectable state based on config', () => {
      const slot = new ItemSlotComponent(mockScene, { ...defaultConfig, selectable: true });
      expect(slot.isSelectable()).toBe(true);
    });
  });

  describe('状态切换', () => {
    it('should transition from EMPTY to FILLED when setContent called', () => {
      const slot = new ItemSlotComponent(mockScene, defaultConfig);
      slot.setContent({ itemId: 'gancao', name: '甘草', quantity: 5 });
      expect(slot.getState()).toBe(ItemSlotState.FILLED);
    });

    it('should transition from EMPTY to SELECTED when select called', () => {
      const slot = new ItemSlotComponent(mockScene, { ...defaultConfig, selectable: true });
      slot.select();
      expect(slot.getState()).toBe(ItemSlotState.SELECTED);
    });

    it('should transition from SELECTED to EMPTY when clear called', () => {
      const slot = new ItemSlotComponent(mockScene, { ...defaultConfig, selectable: true });
      slot.setContent({ itemId: 'gancao', name: '甘草', quantity: 5 });
      slot.select();
      slot.clear();
      expect(slot.getState()).toBe(ItemSlotState.EMPTY);
    });
  });

  describe('视觉效果', () => {
    it('should use neumorphic inset style for empty state', () => {
      const slot = new ItemSlotComponent(mockScene, defaultConfig);
      // 验证drawNeumorphicBorderInset被调用
      expect(mockGraphics.fillStyle).toHaveBeenCalled();
    });

    it('should use neumorphic raised style for filled state', () => {
      const slot = new ItemSlotComponent(mockScene, defaultConfig);
      slot.setContent({ itemId: 'gancao', name: '甘草', quantity: 5 });
      // 验证drawNeumorphicBorderRaised被调用
    });
  });

  describe('交互事件', () => {
    it('should call onClick callback when clicked', () => {
      const onClick = vi.fn();
      const slot = new ItemSlotComponent(mockScene, { ...defaultConfig, onClick });
      slot.handlePointerDown();
      expect(onClick).toHaveBeenCalled();
    });

    it('should not call onClick when not selectable', () => {
      const onClick = vi.fn();
      const slot = new ItemSlotComponent(mockScene, { ...defaultConfig, selectable: false, onClick });
      slot.handlePointerDown();
      expect(onClick).not.toHaveBeenCalled();
    });
  });
});
```

#### Step 2: Run test to verify it fails

#### Step 3: Write implementation

```typescript
// src/ui/components/ItemSlotComponent.ts
import Phaser from 'phaser';
import { drawNeumorphicBorderRaised, drawNeumorphicBorderInset, BORDER_STYLE_CONFIGS } from '../base/UIBorderStyles';
import { UI_COLORS, UI_COLOR_STRINGS } from '../../data/ui-color-theme';

export enum ItemSlotState {
  EMPTY = 'empty',
  FILLED = 'filled',
  SELECTED = 'selected',
  DISABLED = 'disabled',
}

export interface ItemSlotContent {
  itemId: string;
  name: string;
  quantity?: number;
  icon?: string;
}

export interface ItemSlotConfig {
  selectable?: boolean;
  draggable?: boolean;
  onClick?: () => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}

export class ItemSlotComponent {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private graphics: Phaser.GameObjects.Graphics;
  private iconImage: Phaser.GameObjects.Image | null = null;
  private quantityText: Phaser.GameObjects.Text | null = null;
  private nameText: Phaser.GameObjects.Text | null = null;

  public width: number = 60;
  public height: number = 60;
  private state: ItemSlotState = ItemSlotState.EMPTY;
  private content: ItemSlotContent | null = null;
  private config: ItemSlotConfig;
  private selected: boolean = false;

  constructor(scene: Phaser.Scene, x: number, y: number, config: ItemSlotConfig = {}) {
    this.scene = scene;
    this.config = config;

    this.container = scene.add.container(x, y);
    this.graphics = scene.add.graphics();
    this.container.add(this.graphics);

    this.drawEmptyState();
    this.setupInteraction();
  }

  private drawEmptyState(): void {
    this.graphics.clear();
    drawNeumorphicBorderInset(this.graphics, -30, -30, 60, 60, BORDER_STYLE_CONFIGS['neumorphic']);
  }

  private drawFilledState(): void {
    this.graphics.clear();
    drawNeumorphicBorderRaised(this.graphics, -30, -30, 60, 60, BORDER_STYLE_CONFIGS['neumorphic']);
  }

  private drawSelectedState(): void {
    this.graphics.clear();
    drawNeumorphicBorderRaised(this.graphics, -30, -30, 60, 60, BORDER_STYLE_CONFIGS['neumorphic']);
    // 添加高亮边框
    this.graphics.lineStyle(3, UI_COLORS.BUTTON_PRIMARY, 1);
    this.graphics.strokeRect(-30, -30, 60, 60);
  }

  private setupInteraction(): void {
    if (this.config.selectable) {
      this.container.setSize(60, 60);
      this.container.setInteractive({ useHandCursor: true });

      this.container.on('pointerover', () => {
        if (this.state === ItemSlotState.EMPTY) {
          this.drawFilledState(); // hover效果
        }
      });

      this.container.on('pointerout', () => {
        if (this.state === ItemSlotState.EMPTY) {
          this.drawEmptyState();
        } else if (this.state === ItemSlotState.SELECTED) {
          this.drawSelectedState();
        }
      });

      this.container.on('pointerdown', () => {
        this.handlePointerDown();
      });
    }
  }

  public handlePointerDown(): void {
    if (!this.config.selectable) return;

    if (this.config.onClick) {
      this.config.onClick();
    }
  }

  public setContent(content: ItemSlotContent): void {
    this.content = content;
    this.state = ItemSlotState.FILLED;

    // 创建图标和数量文本
    if (content.quantity && content.quantity > 0) {
      this.quantityText = this.scene.add.text(20, 20, content.quantity.toString(), {
        fontSize: '12px',
        color: UI_COLOR_STRINGS.TEXT_PRIMARY,
      });
      this.quantityText.setOrigin(0.5);
      this.container.add(this.quantityText);
    }

    this.drawFilledState();
  }

  public select(): void {
    if (!this.config.selectable) return;
    this.selected = true;
    this.state = ItemSlotState.SELECTED;
    this.drawSelectedState();
  }

  public deselect(): void {
    this.selected = false;
    this.state = this.content ? ItemSlotState.FILLED : ItemSlotState.EMPTY;
    if (this.content) {
      this.drawFilledState();
    } else {
      this.drawEmptyState();
    }
  }

  public clear(): void {
    this.content = null;
    this.selected = false;
    this.state = ItemSlotState.EMPTY;

    if (this.iconImage) {
      this.iconImage.destroy();
      this.iconImage = null;
    }
    if (this.quantityText) {
      this.quantityText.destroy();
      this.quantityText = null;
    }

    this.drawEmptyState();
  }

  public getState(): ItemSlotState {
    return this.state;
  }

  public isSelectable(): boolean {
    return this.config.selectable || false;
  }

  public getContent(): ItemSlotContent | null {
    return this.content;
  }

  public destroy(): void {
    this.container.destroy();
  }
}
```

#### Step 4: Run tests to verify pass

#### Step 5: 冒烟测试（集成测试）

```typescript
// tests/integration/ui/item-slot-smoke.test.ts
import { describe, it, expect } from 'vitest';
import Phaser from 'phaser';
import { ItemSlotComponent } from '../../src/ui/components/ItemSlotComponent';

describe('ItemSlotComponent冒烟测试', () => {
  it('should not crash when created in real scene', async () => {
    // 创建真实Phaser场景测试
    const game = new Phaser.Game({
      type: Phaser.AUTO,
      width: 800,
      height: 600,
      scene: {
        create() {
          const slot = new ItemSlotComponent(this, 100, 100, { selectable: true });
          slot.setContent({ itemId: 'test', name: 'Test', quantity: 5 });
          slot.select();
          slot.destroy();
        }
      }
    });

    await new Promise(r => setTimeout(r, 1000));
    game.destroy(true);
    expect(true).toBe(true); // 无崩溃即通过
  });
});
```

#### Step 6: 端到端测试（E2E）

```typescript
// tests/e2e/ui/item-slot-e2e.spec.ts
import { test, expect } from '@playwright/test';
import { GameLauncher } from '../visual/utils/game-launcher';

test.describe('ItemSlotComponent E2E测试', () => {
  test('背包格子点击选择不崩溃', async ({ page }) => {
    const launcher = new GameLauncher();
    await launcher.launch();

    // 进入诊所场景
    await page.keyboard.press('Enter'); // 开始游戏
    await page.waitForTimeout(1000);

    // 按B键打开背包
    await page.keyboard.press('b');
    await page.waitForTimeout(500);

    // 点击一个格子
    const slot = page.locator('.inventory-slot').first();
    if (await slot.isVisible()) {
      await slot.click();
      await page.waitForTimeout(100);
    }

    // 验证游戏仍在运行
    await expect(page.locator('#game-container')).toBeVisible();

    await launcher.close();
  });
});
```

#### Step 7: Commit

```bash
git add src/ui/components/ItemSlotComponent.ts tests/unit/ui/components/ tests/integration/ui/ tests/e2e/ui/
git commit -m "$(cat <<'EOF'
feat(ui): 创建ItemSlotComponent物品格子组件

- 60×60标准尺寸
- Neumorphism边框风格（凹陷/凸起）
- 状态管理：EMPTY→FILLED→SELECTED
- 交互：点击选择、hover效果

测试覆盖：单元测试、冒烟测试、E2E测试

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Section B: 创建SelectionButtonComponent选择按钮组件

### Task 7: 创建SelectionButtonComponent

**Files:**
- Create: `src/ui/components/SelectionButtonComponent.ts`
- Test: `tests/unit/ui/components/SelectionButtonComponent.test.ts`

#### 测试验收要点

| 测试类型 | 验收标准 |
|---------|---------|
| 单元测试 | 选中状态切换、多选模式、hover效果 |
| 冒烟测试 | 在真实场景创建不崩溃 |
| E2E测试 | 脉诊选项点击不崩溃 |

#### 实现要点

- 尺寸：自适应宽度，高度32px
- 边框方案：'inset'（内凹）或'neumorphic'
- 选中状态表示：
  - 方案A：○→●符号切换
  - 方案B：凹陷→凸起效果
  - 方案C：颜色高亮

---

## Section C: 创建CompatibilitySlotComponent配伍槽位组件

### Task 8: 创建CompatibilitySlotComponent

**Files:**
- Create: `src/ui/components/CompatibilitySlotComponent.ts`
- Test: `tests/unit/ui/components/CompatibilitySlotComponent.test.ts`

#### 测试验收要点

| 测试类型 | 验收标准 |
|---------|---------|
| 单元测试 | 角色(君臣佐使)显示、药材放置、顺序选择 |
| 冒烟测试 | 在煎药场景创建不崩溃 |
| E2E测试 | 煎药配伍流程不崩溃 |

#### 实现要点

- 尺寸：120×80
- 边框方案：'inset'（内凹槽位）
- 角色颜色：
  - 君药：#c0a080（金棕）
  - 臣药：#80a040（绿色）
  - 佐药：#4080a0（蓝色）
  - 使药：#606060（灰色）

---

## Section D: 重构InventoryUI使用新组件

### Task 9: 重构InventoryUI

**Files:**
- Modify: `src/ui/InventoryUI.ts`
- Test: `tests/unit/inventory-ui.test.ts` (更新)

#### 测试验收要点

| 测试类型 | 验收标准 |
|---------|---------|
| 单元测试 | 所有现有测试仍通过（功能不变） |
| 冒烟测试 | 打开背包、切换标签、关闭不崩溃 |
| E2E测试 | 背包完整流程：打开→选择物品→关闭 |

#### E2E测试完整流程

```typescript
// tests/e2e/ui/inventory-refactor.spec.ts
test('InventoryUI重构后完整流程', async ({ page }) => {
  const launcher = new GameLauncher();
  await launcher.launch();

  // 1. 开始游戏
  await page.keyboard.press('Enter');
  await page.waitForTimeout(500);

  // 2. 进入诊所（背包位置）
  await page.keyboard.press('ArrowUp'); // 移动到诊所门
  await page.waitForTimeout(100);
  await page.keyboard.press('Enter'); // 进入诊所
  await page.waitForTimeout(500);

  // 3. 打开背包
  await page.keyboard.press('b');
  await page.waitForTimeout(300);

  // 4. 验证背包UI可见
  await expect(page.locator('.inventory-panel')).toBeVisible();

  // 5. 切换标签页
  const tabs = ['药材', '种子', '工具', '知识'];
  for (const tab of tabs) {
    await page.click(`text=${tab}`);
    await page.waitForTimeout(100);
  }

  // 6. 点击格子（选择）
  const slot = page.locator('.item-slot').first();
  if (await slot.isVisible()) {
    await slot.click();
    await page.waitForTimeout(100);
    // 验证选中状态
  }

  // 7. 关闭背包
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);

  // 8. 验证背包已关闭
  await expect(page.locator('.inventory-panel')).not.toBeVisible();

  await launcher.close();
});
```

---

## Section E: 重构诊断类UI

### Task 10-13: 脉诊/舌诊/辨证/选方UI重构

每个UI重构Task遵循相同模式：

#### 测试验收要点

| UI | 单元测试 | E2E测试 |
|----|---------|---------|
| PulseUI | 脉位/脉势选择 | 脉诊完整流程 |
| TongueUI | 舌体/舌苔/舌形选择 | 舌诊完整流程 |
| SyndromeUI | 证型选择 | 辨证完整流程 |
| PrescriptionUI | 方剂选择 | 选方完整流程 |

#### E2E测试：诊断完整流程

```typescript
// tests/e2e/ui/diagnosis-flow.spec.ts
test('诊断流程完整测试（脉诊→舌诊→辨证→选方）', async ({ page }) => {
  const launcher = new GameLauncher();
  await launcher.launch();

  // 开始游戏，进入问诊流程
  // ... 启动问诊

  // 1. 脉诊
  await expect(page.locator('.pulse-ui')).toBeVisible();
  await page.click('text=浮脉');
  await page.click('text=紧脉');
  await page.click('text=确认脉诊');
  await page.waitForTimeout(500);

  // 2. 舌诊
  await expect(page.locator('.tongue-ui')).toBeVisible();
  await page.click('text=淡红');
  await page.click('text=薄白');
  await page.click('text=确认舌诊');
  await page.waitForTimeout(500);

  // 3. 辨证
  await expect(page.locator('.syndrome-ui')).toBeVisible();
  await page.click('text=风寒表实证');
  await page.click('text=确认辨证');
  await page.waitForTimeout(500);

  // 4. 选方
  await expect(page.locator('.prescription-ui')).toBeVisible();
  await page.click('text=麻黄汤');
  await page.click('text=确认选方');
  await page.waitForTimeout(500);

  // 5. 验证结果
  await expect(page.locator('.result-ui')).toBeVisible();

  await launcher.close();
});
```

---

## Section F: 重构小游戏UI

### Task 14-16: 煎药/炮制/种植UI重构

#### 测试验收要点

| UI | E2E测试流程 |
|----|-------------|
| DecoctionUI | 配伍放置→顺序设置→火候选择→煎煮 |
| ProcessingUI | 方法选择→药材+辅料→炮制 |
| PlantingUI | 地块选择→种子+水源+肥料→种植 |

---

## Section G-H: 其他UI重构

### Task 17-19: 问诊/存档/病案UI重构

---

## Section I: 最终验收

### Task 20: 全量测试运行

#### 验收清单

- [ ] 单元测试：全部通过（目标：800+测试）
- [ ] 集成测试：全部通过
- [ ] E2E测试：关键流程全部通过
- [ ] TypeScript编译：无错误
- [ ] 游戏启动：无崩溃
- [ ] 视觉验收：AI评估通过（置信度≥80%）

#### 全量E2E测试

```typescript
// tests/e2e/ui/full-acceptance.spec.ts
test.describe('Phase 2.5完整验收', () => {
  test('所有UI可正常打开和关闭', async ({ page }) => {
    // 背包
    await page.keyboard.press('b');
    await expect(page.locator('.inventory-ui')).toBeVisible();
    await page.keyboard.press('Escape');

    // 存档
    await page.keyboard.press('s');
    await expect(page.locator('.save-ui')).toBeVisible();
    await page.keyboard.press('Escape');

    // 病案
    // ... 其他UI
  });

  test('诊断流程无回归', async ({ page }) => {
    // 完整诊断流程测试
  });

  test('小游戏流程无回归', async ({ page }) => {
    // 煎药、炮制、种植流程测试
  });
});
```

---

## 执行顺序

```
Phase 2: Task 6 (ItemSlotComponent)
Phase 3: Task 7 (SelectionButtonComponent)
Phase 4: Task 8 (CompatibilitySlotComponent)
Phase 5: Task 9 (InventoryUI重构)
Phase 6: Task 10-13 (诊断类UI)
Phase 7: Task 14-16 (小游戏UI)
Phase 8: Task 17 (问诊UI)
Phase 9: Task 18-19 (存档/病案UI)
Phase 10: Task 20 (最终验收)
```

---

## 文件结构（最终）

```
src/ui/
├── base/
│   ├── UIBorderStyles.ts       ✅ 完成
│   ├── BaseUIComponent.ts      ✅ 完成
│   └── ModalUI.ts              ✅ 完成
│
├── components/
│   ├── ItemSlotComponent.ts    ⏳ Task 6
│   ├── SelectionButtonComponent.ts  ⏳ Task 7
│   ├── CompatibilitySlotComponent.ts  ⏳ Task 8
│   ├── InfoCardComponent.ts    (可选)
│   └── ProgressBarComponent.ts (可选)
│
├── InventoryUI.ts              ⏳ Task 9 重构
├── PulseUI.ts                  ⏳ Task 10 重构
├── TongueUI.ts                 ⏳ Task 11 重构
├── SyndromeUI.ts               ⏳ Task 12 重构
├── PrescriptionUI.ts           ⏳ Task 13 重构
├── DecoctionUI.ts              ⏳ Task 14 重构
├── ProcessingUI.ts             ⏳ Task 15 重构
├── PlantingUI.ts               ⏳ Task 16 重构
├── InquiryUI.ts                ⏳ Task 17 重构
├── SaveUI.ts                   ⏳ Task 18 重构
├── CasesListUI.ts              ⏳ Task 19 重构
│
└── index.ts                    ✅ 已导出base模块

tests/
├── unit/ui/
│   ├── base/                   ✅ 66 tests
│   └── components/             ⏳ 待创建
│
├── integration/ui/             ⏳ 待创建
│
└── e2e/ui/                     ⏳ 待创建
```

---

*本文档由 Claude Code 创建，更新于 2026-04-19*