# Phase 2.5: UI组件系统统一化 - 核心基础设施实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 创建UI组件系统的基础架构：BaseUIComponent抽象基类、ModalUI弹窗基类、UIBorderStyles边框样式定义。

**Architecture:** 采用Phaser 3 + TypeScript，创建src/ui/base/目录存放基类，定义标准弹窗尺寸(DIAGNOSIS_MODAL 720×480, MINIGAME_MODAL 800×600等)和退出按钮位置。

**Tech Stack:** Phaser 3.60+, TypeScript 5.0+, Vitest测试框架

---

## 文件结构

```
src/ui/base/
├── UIBorderStyles.ts      # 边框样式定义和绘制方法
├── BaseUIComponent.ts     # 抽象基类
└── ModalUI.ts             # 弹窗基类

tests/unit/ui/base/
├── UIBorderStyles.test.ts
├── BaseUIComponent.test.ts
└── ModalUI.test.ts
```

---

### Task 1: 创建UIBorderStyles边框样式定义

**Files:**
- Create: `src/ui/base/UIBorderStyles.ts`
- Test: `tests/unit/ui/base/UIBorderStyles.test.ts`

- [ ] **Step 1: Write the failing test for border style types**

```typescript
// tests/unit/ui/base/UIBorderStyles.test.ts
import { describe, it, expect } from 'vitest';
import { BorderStyleType, BORDER_STYLE_CONFIGS } from '../../../src/ui/base/UIBorderStyles';

describe('UIBorderStyles', () => {
  it('should define all border style types', () => {
    const expectedTypes: BorderStyleType[] = ['glass', '3d', 'traditional', 'neumorphic', 'inset'];
    expect(BORDER_STYLE_CONFIGS).toBeDefined();
    expect(Object.keys(BORDER_STYLE_CONFIGS)).toContain('3d');
    expect(Object.keys(BORDER_STYLE_CONFIGS)).toContain('neumorphic');
    expect(Object.keys(BORDER_STYLE_CONFIGS)).toContain('inset');
  });

  it('should have correct 3d border config', () => {
    const config = BORDER_STYLE_CONFIGS['3d'];
    expect(config.outerColor).toBe(0x80a040);
    expect(config.topLight).toBe(0x90c070);
    expect(config.bottomShadow).toBe(0x604020);
    expect(config.background).toBe(0x1a2e26);
  });

  it('should have correct neumorphic border config', () => {
    const config = BORDER_STYLE_CONFIGS['neumorphic'];
    expect(config.background).toBe(0x2a3e32);
    expect(config.shadowOffset).toBe(4);
  });

  it('should have correct inset border config', () => {
    const config = BORDER_STYLE_CONFIGS['inset'];
    expect(config.darkBorder).toBe(0x0a1510);
    expect(config.lightBorder).toBe(0x406050);
    expect(config.background).toBe(0x0d1f17);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test tests/unit/ui/base/UIBorderStyles.test.ts`
Expected: FAIL with "Cannot find module '../../../src/ui/base/UIBorderStyles'"

- [ ] **Step 3: Write minimal implementation**

```typescript
// src/ui/base/UIBorderStyles.ts
import { UI_COLORS } from '../../data/ui-color-theme';

/**
 * 边框样式类型
 */
export type BorderStyleType = 'glass' | '3d' | 'traditional' | 'neumorphic' | 'inset';

/**
 * 边框样式配置接口
 */
export interface BorderStyleConfig {
  /** 外层边框颜色 */
  outerColor?: number;
  /** 顶部高光颜色 */
  topLight?: number;
  /** 底部阴影颜色 */
  bottomShadow?: number;
  /** 背景颜色 */
  background: number;
  /** 阴影偏移 */
  shadowOffset?: number;
  /** 高光透明度 */
  highlightAlpha?: number;
  /** 阴影透明度 */
  shadowAlpha?: number;
  /** 内凹暗边框 */
  darkBorder?: number;
  /** 内凹亮边框 */
  lightBorder?: number;
  /** 发光边框 */
  glowColor?: number;
}

/**
 * 边框样式配置字典
 */
export const BORDER_STYLE_CONFIGS: Record<BorderStyleType, BorderStyleConfig> = {
  glass: {
    outerColor: UI_COLORS.PANEL_GLASS_LIGHT,
    glowColor: UI_COLORS.BORDER_GLOW,
    background: UI_COLORS.PANEL_GLASS_DARK,
  },
  '3d': {
    outerColor: UI_COLORS.BORDER_OUTER_GREEN,
    topLight: UI_COLORS.BORDER_TOP_LIGHT,
    bottomShadow: UI_COLORS.BORDER_BOTTOM_SHADOW,
    background: UI_COLORS.PANEL_3D_BG,
  },
  traditional: {
    outerColor: UI_COLORS.BORDER_PRIMARY,
    background: UI_COLORS.PANEL_SECONDARY,
  },
  neumorphic: {
    background: UI_COLORS.PANEL_NEUMORPHIC,
    shadowOffset: 4,
    highlightAlpha: 0.3,
    shadowAlpha: 0.5,
  },
  inset: {
    darkBorder: UI_COLORS.BORDER_INSET_DARK,
    lightBorder: UI_COLORS.BORDER_INSET_LIGHT,
    background: UI_COLORS.PANEL_INSET,
  },
};

/**
 * 绘制3D立体边框
 * @param graphics Phaser Graphics对象
 * @param x 左上角x坐标
 * @param y 左上角y坐标
 * @param width 宽度
 * @param height 高度
 * @param config 边框配置
 */
export function draw3DBorder(
  graphics: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  width: number,
  height: number,
  config: BorderStyleConfig
): void {
  const { outerColor, topLight, bottomShadow, background } = config;
  const borderWidth = 4;

  // 背景
  graphics.fillStyle(background, 1);
  graphics.fillRect(x, y, width, height);

  // 外层边框
  graphics.lineStyle(borderWidth, outerColor!, 1);
  graphics.strokeRect(x, y, width, height);

  // 顶部高光（左上角到右边）
  graphics.lineStyle(2, topLight!, 0.8);
  graphics.beginPath();
  graphics.moveTo(x + borderWidth, y + borderWidth);
  graphics.lineTo(x + width - borderWidth, y + borderWidth);
  graphics.strokePath();

  // 左侧高光
  graphics.beginPath();
  graphics.moveTo(x + borderWidth, y + borderWidth);
  graphics.lineTo(x + borderWidth, y + height - borderWidth);
  graphics.strokePath();

  // 底部阴影（右下角）
  graphics.lineStyle(2, bottomShadow!, 0.6);
  graphics.beginPath();
  graphics.moveTo(x + width - borderWidth, y + height - borderWidth);
  graphics.lineTo(x + borderWidth, y + height - borderWidth);
  graphics.strokePath();

  // 右侧阴影
  graphics.beginPath();
  graphics.moveTo(x + width - borderWidth, y + borderWidth);
  graphics.lineTo(x + width - borderWidth, y + height - borderWidth);
  graphics.strokePath();
}

/**
 * 绘制Neumorphism边框（凸起效果）
 */
export function drawNeumorphicBorderRaised(
  graphics: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  width: number,
  height: number,
  config: BorderStyleConfig
): void {
  const { background, shadowOffset = 4, highlightAlpha = 0.3, shadowAlpha = 0.5 } = config;

  // 背景
  graphics.fillStyle(background, 1);
  graphics.fillRect(x, y, width, height);

  // 高光阴影（左上）
  graphics.lineStyle(shadowOffset, 0xffffff, highlightAlpha);
  graphics.beginPath();
  graphics.moveTo(x, y + height);
  graphics.lineTo(x, y);
  graphics.lineTo(x + width, y);
  graphics.strokePath();

  // 深色阴影（右下）
  graphics.lineStyle(shadowOffset, 0x000000, shadowAlpha);
  graphics.beginPath();
  graphics.moveTo(x + width, y);
  graphics.lineTo(x + width, y + height);
  graphics.lineTo(x, y + height);
  graphics.strokePath();
}

/**
 * 绘制Neumorphism边框（凹陷效果）
 */
export function drawNeumorphicBorderInset(
  graphics: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  width: number,
  height: number,
  config: BorderStyleConfig
): void {
  const { background, shadowOffset = 4, highlightAlpha = 0.3, shadowAlpha = 0.5 } = config;

  // 背景
  graphics.fillStyle(background, 1);
  graphics.fillRect(x, y, width, height);

  // 深色阴影（左上）- 凹陷效果反转
  graphics.lineStyle(shadowOffset, 0x000000, shadowAlpha);
  graphics.beginPath();
  graphics.moveTo(x, y + height);
  graphics.lineTo(x, y);
  graphics.lineTo(x + width, y);
  graphics.strokePath();

  // 高光（右下）
  graphics.lineStyle(shadowOffset, 0xffffff, highlightAlpha);
  graphics.beginPath();
  graphics.moveTo(x + width, y);
  graphics.lineTo(x + width, y + height);
  graphics.lineTo(x, y + height);
  graphics.strokePath();
}

/**
 * 绘制内凹槽位边框
 */
export function drawInsetSlotBorder(
  graphics: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  width: number,
  height: number,
  config: BorderStyleConfig
): void {
  const { darkBorder, lightBorder, background } = config;
  const borderWidth = 2;

  // 背景（更深）
  graphics.fillStyle(background!, 1);
  graphics.fillRect(x + borderWidth, y + borderWidth, width - borderWidth * 2, height - borderWidth * 2);

  // 外层暗边框
  graphics.lineStyle(borderWidth, darkBorder!, 1);
  graphics.strokeRect(x, y, width, height);

  // 内层亮边框（左上）
  graphics.lineStyle(1, lightBorder!, 0.5);
  graphics.beginPath();
  graphics.moveTo(x + borderWidth + 1, y + borderWidth + 1);
  graphics.lineTo(x + width - borderWidth - 1, y + borderWidth + 1);
  graphics.strokePath();
  graphics.beginPath();
  graphics.moveTo(x + borderWidth + 1, y + borderWidth + 1);
  graphics.lineTo(x + borderWidth + 1, y + height - borderWidth - 1);
  graphics.strokePath();
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test tests/unit/ui/base/UIBorderStyles.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/ui/base/UIBorderStyles.ts tests/unit/ui/base/UIBorderStyles.test.ts
git commit -m "$(cat <<'EOF'
feat: 创建UIBorderStyles边框样式定义

- 定义BorderStyleType: glass/3d/traditional/neumorphic/inset
- 定义BORDER_STYLE_CONFIGS配置字典
- 实现draw3DBorder/drawNeumorphicBorderRaised/drawNeumorphicBorderInset/drawInsetSlotBorder绘制函数

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: 创建BaseUIComponent抽象基类

**Files:**
- Create: `src/ui/base/BaseUIComponent.ts`
- Test: `tests/unit/ui/base/BaseUIComponent.test.ts`

- [ ] **Step 1: Write the failing test for BaseUIComponent**

```typescript
// tests/unit/ui/base/BaseUIComponent.test.ts
import { describe, it, expect, vi } from 'vitest';
import BaseUIComponent from '../../../src/ui/base/BaseUIComponent';

// Mock Phaser Scene
const mockScene = {
  add: {
    container: vi.fn().mockReturnValue({
      setDepth: vi.fn(),
      add: vi.fn(),
      destroy: vi.fn(),
    }),
    graphics: vi.fn().mockReturnValue({
      fillStyle: vi.fn(),
      fillRect: vi.fn(),
      lineStyle: vi.fn(),
      strokeRect: vi.fn(),
      destroy: vi.fn(),
    }),
    text: vi.fn().mockReturnValue({
      setOrigin: vi.fn(),
      setInteractive: vi.fn(),
      on: vi.fn(),
      destroy: vi.fn(),
    }),
  },
  scene: { key: 'testScene' },
} as any;

describe('BaseUIComponent', () => {
  it('should create container with specified dimensions', () => {
    const component = new BaseUIComponent(mockScene, 720, 480);
    expect(mockScene.add.container).toHaveBeenCalled();
    expect(component.width).toBe(720);
    expect(component.height).toBe(480);
    expect(component.depth).toBe(100);
  });

  it('should have destroy method that cleans up', () => {
    const component = new BaseUIComponent(mockScene, 720, 480);
    component.destroy();
    expect(component.container.destroy).toHaveBeenCalled();
  });

  it('should have exposeToGlobal method for testing', () => {
    const component = new BaseUIComponent(mockScene, 720, 480);
    component.exposeToGlobal('testUI');
    expect((window as any).testUI).toBe(component);
  });

  it('should have setDepth method', () => {
    const component = new BaseUIComponent(mockScene, 720, 480);
    component.setDepth(200);
    expect(component.container.setDepth).toHaveBeenCalledWith(200);
    expect(component.depth).toBe(200);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test tests/unit/ui/base/BaseUIComponent.test.ts`
Expected: FAIL with "Cannot find module '../../../src/ui/base/BaseUIComponent'"

- [ ] **Step 3: Write minimal implementation**

```typescript
// src/ui/base/BaseUIComponent.ts
import { BorderStyleType, draw3DBorder, BORDER_STYLE_CONFIGS } from './UIBorderStyles';

/**
 * UI组件抽象基类
 *
 * 提供所有UI组件的通用功能：
 * - 容器管理
 * - 边框绘制
 * - 退出按钮
 * - 销毁流程
 */
export default abstract class BaseUIComponent {
  protected scene: Phaser.Scene;
  protected container: Phaser.GameObjects.Container;
  public width: number;
  public height: number;
  public depth: number = 100;
  protected graphics: Phaser.GameObjects.Graphics | null = null;

  constructor(scene: Phaser.Scene, width: number, height: number) {
    this.scene = scene;
    this.width = width;
    this.height = height;

    // 创建容器，位置在屏幕中心
    const centerX = Number(scene.cameras?.main?.centerX) || 400;
    const centerY = Number(scene.cameras?.main?.centerY) || 300;
    this.container = scene.add.container(centerX, centerY);
    this.container.setDepth(this.depth);
  }

  /**
   * 绘制边框
   */
  protected drawBorder(style: BorderStyleType): Phaser.GameObjects.Graphics {
    const graphics = this.scene.add.graphics();
    const config = BORDER_STYLE_CONFIGS[style];

    const x = -this.width / 2;
    const y = -this.height / 2;

    switch (style) {
      case '3d':
        draw3DBorder(graphics, x, y, this.width, this.height, config);
        break;
      // 其他样式在后续Task实现
      default:
        graphics.fillStyle(config.background, 1);
        graphics.fillRect(x, y, this.width, this.height);
    }

    this.container.add(graphics);
    this.graphics = graphics;
    return graphics;
  }

  /**
   * 创建标准退出按钮
   */
  protected createExitButton(
    text: string,
    position: { x: number; y: number },
    action: () => void
  ): Phaser.GameObjects.Text {
    const button = this.scene.add.text(position.x, position.y, text, {
      fontSize: '16px',
      color: '#ffffff',
      backgroundColor: '#303030',
      padding: { x: 10, y: 5 },
    });
    button.setOrigin(0.5);
    button.setInteractive({ useHandCursor: true });

    button.on('pointerover', () => {
      button.setColor('#90c070');
    });
    button.on('pointerout', () => {
      button.setColor('#ffffff');
    });
    button.on('pointerdown', action);

    this.container.add(button);
    return button;
  }

  /**
   * 设置深度
   */
  public setDepth(depth: number): this {
    this.depth = depth;
    this.container.setDepth(depth);
    return this;
  }

  /**
   * 暴露到全局（测试用）
   */
  public exposeToGlobal(name: string): this {
    (window as any)[name] = this;
    return this;
  }

  /**
   * 销毁组件
   */
  public destroy(): void {
    this.container.destroy();
    this.graphics = null;
    // 清理全局引用
    Object.keys(window).forEach(key => {
      if ((window as any)[key] === this) {
        delete (window as any)[key];
      }
    });
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test tests/unit/ui/base/BaseUIComponent.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/ui/base/BaseUIComponent.ts tests/unit/ui/base/BaseUIComponent.test.ts
git commit -m "$(cat <<'EOF'
feat: 创建BaseUIComponent抽象基类

- 提供container管理、边框绘制、退出按钮、销毁流程
- drawBorder方法支持BorderStyleType参数
- createExitButton标准化退出按钮创建
- exposeToGlobal支持测试调试

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: 创建ModalUI弹窗基类

**Files:**
- Create: `src/ui/base/ModalUI.ts`
- Test: `tests/unit/ui/base/ModalUI.test.ts`

- [ ] **Step 1: Write the failing test for ModalUI standard sizes**

```typescript
// tests/unit/ui/base/ModalUI.test.ts
import { describe, it, expect, vi } from 'vitest';
import ModalUI, { MODAL_SIZES, EXIT_BUTTON_POSITIONS } from '../../../src/ui/base/ModalUI';

const mockScene = {
  add: {
    container: vi.fn().mockReturnValue({
      setDepth: vi.fn(),
      add: vi.fn(),
      destroy: vi.fn(),
    }),
    graphics: vi.fn().mockReturnValue({
      fillStyle: vi.fn(),
      fillRect: vi.fn(),
      lineStyle: vi.fn(),
      strokeRect: vi.fn(),
      destroy: vi.fn(),
    }),
    text: vi.fn().mockReturnValue({
      setOrigin: vi.fn(),
      setInteractive: vi.fn(),
      on: vi.fn(),
      destroy: vi.fn(),
    }),
  },
  cameras: { main: { centerX: 400, centerY: 300 } },
  scene: { key: 'testScene' },
  input: {
    keyboard: {
      on: vi.fn(),
    },
  },
} as any;

describe('ModalUI', () => {
  describe('MODAL_SIZES', () => {
    it('should define DIAGNOSIS_MODAL as 720x480', () => {
      expect(MODAL_SIZES.DIAGNOSIS_MODAL).toEqual({ width: 720, height: 480 });
    });

    it('should define INQUIRY_MODAL as 640x420', () => {
      expect(MODAL_SIZES.INQUIRY_MODAL).toEqual({ width: 640, height: 420 });
    });

    it('should define MINIGAME_MODAL as 800x600', () => {
      expect(MODAL_SIZES.MINIGAME_MODAL).toEqual({ width: 800, height: 600 });
    });

    it('should define FULLSCREEN_MODAL as 1024x768', () => {
      expect(MODAL_SIZES.FULLSCREEN_MODAL).toEqual({ width: 1024, height: 768 });
    });
  });

  describe('EXIT_BUTTON_POSITIONS', () => {
    it('should have correct exit position for DIAGNOSIS_MODAL', () => {
      expect(EXIT_BUTTON_POSITIONS.DIAGNOSIS_MODAL).toEqual({ x: 340, y: -250 });
    });

    it('should have correct exit position for MINIGAME_MODAL', () => {
      expect(EXIT_BUTTON_POSITIONS.MINIGAME_MODAL).toEqual({ x: 380, y: -290 });
    });
  });

  describe('ModalUI class', () => {
    it('should create modal with specified type', () => {
      const modal = new ModalUI(mockScene, 'DIAGNOSIS_MODAL', '[退出]', vi.fn());
      expect(modal.width).toBe(720);
      expect(modal.height).toBe(480);
    });

    it('should use 3d border style by default', () => {
      const modal = new ModalUI(mockScene, 'DIAGNOSIS_MODAL', '[退出]', vi.fn());
      // Border should be drawn (graphics created)
      expect(mockScene.add.graphics).toHaveBeenCalled();
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test tests/unit/ui/base/ModalUI.test.ts`
Expected: FAIL with "Cannot find module '../../../src/ui/base/ModalUI'"

- [ ] **Step 3: Write minimal implementation**

```typescript
// src/ui/base/ModalUI.ts
import BaseUIComponent from './BaseUIComponent';

/**
 * 标准弹窗尺寸定义
 */
export const MODAL_SIZES = {
  /** 诊断类弹窗：脉诊/舌诊/辨证/选方 */
  DIAGNOSIS_MODAL: { width: 720, height: 480 },
  /** 问诊类弹窗 */
  INQUIRY_MODAL: { width: 640, height: 420 },
  /** 小游戏弹窗：煎药/炮制/种植 */
  MINIGAME_MODAL: { width: 800, height: 600 },
  /** 全屏弹窗：背包/存档 */
  FULLSCREEN_MODAL: { width: 1024, height: 768 },
  /** NPC对话弹窗 */
  DIALOG_MODAL: { width: 500, height: 300 },
} as const;

/**
 * 退出按钮位置（相对弹窗中心）
 */
export const EXIT_BUTTON_POSITIONS = {
  DIAGNOSIS_MODAL: { x: 340, y: -250 },
  INQUIRY_MODAL: { x: 300, y: -200 },
  MINIGAME_MODAL: { x: 380, y: -290 },
  FULLSCREEN_MODAL: { x: 492, y: -384 },
  DIALOG_MODAL: { x: 240, y: -150 },
} as const;

export type ModalType = keyof typeof MODAL_SIZES;

/**
 * 弹窗基类
 *
 * 继承BaseUIComponent，提供：
 * - 标准尺寸（MODAL_SIZES）
 * - 标准退出按钮位置（EXIT_BUTTON_POSITIONS）
 * - 默认3D边框样式
 * - ESC快捷键退出
 */
export default class ModalUI extends BaseUIComponent {
  protected exitButton: Phaser.GameObjects.Text | null = null;
  protected onExit: () => void;

  constructor(
    scene: Phaser.Scene,
    modalType: ModalType,
    exitText: string,
    onExit: () => void
  ) {
    const size = MODAL_SIZES[modalType];
    super(scene, size.width, size.height);

    this.onExit = onExit;

    // 绘制默认3D边框
    this.drawBorder('3d');

    // 创建标准退出按钮
    const exitPos = EXIT_BUTTON_POSITIONS[modalType];
    this.exitButton = this.createExitButton(exitText, exitPos, onExit);

    // 注册ESC快捷键
    this.setupEscapeKey();
  }

  /**
   * 设置ESC快捷键退出
   */
  protected setupEscapeKey(): void {
    if (this.scene.input?.keyboard) {
      this.scene.input.keyboard.on('keydown-ESC', this.onExit);
    }
  }

  /**
   * 销毁弹窗
   */
  public destroy(): void {
    // 移除ESC监听
    if (this.scene.input?.keyboard) {
      this.scene.input.keyboard.off('keydown-ESC', this.onExit);
    }
    super.destroy();
  }

  /**
   * 获取标准尺寸
   */
  public static getSize(modalType: ModalType): { width: number; height: number } {
    return MODAL_SIZES[modalType];
  }

  /**
   * 获取退出按钮位置
   */
  public static getExitPosition(modalType: ModalType): { x: number; y: number } {
    return EXIT_BUTTON_POSITIONS[modalType];
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test tests/unit/ui/base/ModalUI.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/ui/base/ModalUI.ts tests/unit/ui/base/ModalUI.test.ts
git commit -m "$(cat <<'EOF'
feat: 创建ModalUI弹窗基类

- 定义MODAL_SIZES: DIAGNOSIS_MODAL(720x480)/INQUIRY_MODAL(640x420)/MINIGAME_MODAL(800x600)/FULLSCREEN_MODAL(1024x768)
- 定义EXIT_BUTTON_POSITIONS: 各弹窗类型标准退出按钮位置
- 继承BaseUIComponent，默认3D边框+ESC快捷键退出

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: 更新ui/index.ts导出新基类

**Files:**
- Modify: `src/ui/index.ts`
- Modify: `src/ui/base/UIBorderStyles.ts` (添加export)

- [ ] **Step 1: Read current ui/index.ts**

Run: `cat src/ui/index.ts` to see current exports.

- [ ] **Step 2: Update index.ts to export base classes**

```typescript
// src/ui/index.ts
// 导出基类
export { BorderStyleType, BORDER_STYLE_CONFIGS, draw3DBorder, drawNeumorphicBorderRaised, drawNeumorphicBorderInset, drawInsetSlotBorder } from './base/UIBorderStyles';
export { default as BaseUIComponent } from './base/BaseUIComponent';
export { default as ModalUI, MODAL_SIZES, EXIT_BUTTON_POSITIONS, ModalType } from './base/ModalUI';

// 导出现有UI组件
export { default as DialogUI } from './DialogUI';
export { default as InquiryUI } from './InquiryUI';
export { default as PulseUI } from './PulseUI';
export { default as TongueUI } from './TongueUI';
export { default as SyndromeUI } from './SyndromeUI';
export { default as PrescriptionUI } from './PrescriptionUI';
export { default as DecoctionUI } from './DecoctionUI';
export { default as ProcessingUI } from './ProcessingUI';
export { default as PlantingUI } from './PlantingUI';
export { default as InventoryUI } from './InventoryUI';
export { default as SaveUI } from './SaveUI';
export { default as CasesListUI } from './CasesListUI';
export { default as ResultUI } from './ResultUI';
export { default as NPCFeedbackUI } from './NPCFeedbackUI';
export { default as TutorialUI } from './TutorialUI';
export { default as ExperienceUI } from './ExperienceUI';
export { default as CaseDetailUI } from './CaseDetailUI';
export { default as StreamingText } from './StreamingText';
```

- [ ] **Step 3: Verify imports work**

Run: `npm run build` to verify TypeScript compilation passes.

- [ ] **Step 4: Commit**

```bash
git add src/ui/index.ts
git commit -m "$(cat <<'EOF'
feat: 更新ui/index.ts导出基类模块

- 导出UIBorderStyles所有边框样式和绘制函数
- 导出BaseUIComponent抽象基类
- 导出ModalUI弹窗基类及MODAL_SIZES/EXIT_BUTTON_POSITIONS

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: 运行全部测试验证基础设施完整性

- [ ] **Step 1: Run all tests in ui/base directory**

Run: `npm test tests/unit/ui/base/`
Expected: All 3 test files PASS

- [ ] **Step 2: Run full test suite to ensure no regressions**

Run: `npm test`
Expected: All existing tests still PASS (861 tests)

- [ ] **Step 3: Create summary commit**

```bash
git add -A
git commit -m "$(cat <<'EOF'
feat: UI核心基础设施完成 - Phase 1

基础设施组件:
- UIBorderStyles: 5种边框样式定义(glass/3d/traditional/neumorphic/inset)
- BaseUIComponent: 抽象基类(container/边框绘制/退出按钮/销毁)
- ModalUI: 弹窗基类(标准尺寸/退出位置/ESC快捷键)

标准弹窗尺寸:
- DIAGNOSIS_MODAL: 720×480 (脉诊/舌诊/辨证/选方)
- INQUIRY_MODAL: 640×420 (问诊)
- MINIGAME_MODAL: 800×600 (煎药/炮制/种植)
- FULLSCREEN_MODAL: 1024×768 (背包/存档)

测试覆盖: 3个测试文件，15个测试用例

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## 完成检查

- [ ] 所有测试通过
- [ ] TypeScript编译无错误
- [ ] 基类文件结构正确
- [ ] 导出模块正确配置

**Next Phase:** 统一槽位组件（Plan 2）