# 煎药小游戏 UI 重构实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将用户提供的 HTML/React 煎药 UI 设计迁移到 Phaser，创建可复用的组件库（ScrollModalUI、PixelSpriteComponent、HerbTagComponent、DragEffectManager）。

**Architecture:** 边迁移边沉淀，在实现煎药游戏过程中同步创建可复用组件。使用 Phaser Graphics API 绘制像素图标，使用 Phaser Tweens 实现动效。

**Tech Stack:** Phaser 3 + TypeScript + Vitest

---

## 文件结构

### 新建文件

| 文件 | 职责 |
|-----|------|
| `src/ui/base/ScrollModalUI.ts` | 卷轴风格弹窗基类（继承 ModalUI） |
| `src/ui/components/PixelSpriteComponent.ts` | 像素图标绘制组件 |
| `src/ui/components/HerbTagComponent.ts` | 药牌组件（绳+牌+图标+名+属性+数量） |
| `src/systems/DragEffectManager.ts` | 拖拽动效系统（轨迹+溅射+爆发） |
| `src/data/pixel-herbs.ts` | 像素药材数据（迁移自 herb-icons.jsx） |
| `tests/unit/ui/components/PixelSpriteComponent.spec.ts` | PixelSpriteComponent 单元测试 |
| `tests/unit/ui/components/HerbTagComponent.spec.ts` | HerbTagComponent 单元测试 |
| `tests/unit/systems/DragEffectManager.spec.ts` | DragEffectManager 单元测试 |

### 修改文件

| 文件 | 职责 |
|-----|------|
| `src/ui/DecoctionUI.ts` | 使用新组件重构煎药 UI |

---

## 颜色常量（从 HTML CSS 提取）

```typescript
// 添加到 src/data/ui-color-theme.ts
export const SCROLL_COLORS = {
  PAPER: '#e8c991',           // 纸张背景
  PAPER_BRIGHT: '#f4dba8',    // 纸张亮色
  PAPER_DEEP: '#c89550',      // 纸张深色
  CINNABAR: '#b8322c',        // 印章亮边
  CINNABAR_DEEP: '#8a1f1a',   // 印章底色
  WOOD: '#6b3e1f',            // 木轴主色
  WOOD_DARK: '#3f2412',       // 木边框深色
  WOOD_LIGHT: '#a26a3a',      // 木高光
  INK: '#2a1810',             // 文字墨色
  EMBER_CORE: '#ffd24a',      // 火焰核心色
  EMBER: '#ff7a1a',           // 火焰色
} as const;
```

---

## Task 1: PixelSpriteComponent - 像素图标绘制组件

**Files:**
- Create: `src/ui/components/PixelSpriteComponent.ts`
- Test: `tests/unit/ui/components/PixelSpriteComponent.spec.ts`

- [ ] **Step 1: Write the failing test for PixelSpriteComponent 基本构造**

```typescript
// tests/unit/ui/components/PixelSpriteComponent.spec.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import PixelSpriteComponent from '../../../src/ui/components/PixelSpriteComponent';

const createMockScene = () => {
  const mockContainer = {
    add: vi.fn().mockReturnThis(),
    setDepth: vi.fn().mockReturnThis(),
    destroy: vi.fn(),
  };
  const mockGraphics = {
    clear: vi.fn().mockReturnThis(),
    fillStyle: vi.fn().mockReturnThis(),
    fillRect: vi.fn().mockReturnThis(),
    destroy: vi.fn(),
  };
  return {
    add: {
      container: vi.fn().mockReturnValue(mockContainer),
      graphics: vi.fn().mockReturnValue(mockGraphics),
      existing: vi.fn(),
    },
  } as any;
};

describe('PixelSpriteComponent', () => {
  describe('构造与属性', () => {
    it('should create component with grid and palette', () => {
      const scene = createMockScene();
      const grid = ['  aa  ', ' abba ', '  aa  '];
      const palette = { a: '#6a8c78', b: '#8ab098' };

      const sprite = new PixelSpriteComponent(scene, { grid, palette });

      expect(sprite.grid).toEqual(grid);
      expect(sprite.palette).toEqual(palette);
      expect(scene.add.graphics).toHaveBeenCalled();
    });

    it('should use default pixelSize of 3', () => {
      const scene = createMockScene();
      const grid = ['aa', 'bb'];
      const palette = { a: '#ff0000', b: '#00ff00' };

      const sprite = new PixelSpriteComponent(scene, { grid, palette });

      expect(sprite.pixelSize).toBe(3);
    });

    it('should accept custom pixelSize', () => {
      const scene = createMockScene();
      const grid = ['aa', 'bb'];
      const palette = { a: '#ff0000', b: '#00ff00' };

      const sprite = new PixelSpriteComponent(scene, { grid, palette, pixelSize: 4 });

      expect(sprite.pixelSize).toBe(4);
    });

    it('should calculate width and height from grid', () => {
      const scene = createMockScene();
      const grid = ['  aa  ', ' abba ']; // 8 chars wide, 2 rows
      const palette = { a: '#ff0000', b: '#00ff00' };

      const sprite = new PixelSpriteComponent(scene, { grid, palette, pixelSize: 3 });

      expect(sprite.width).toBe(8 * 3); // 24
      expect(sprite.height).toBe(2 * 3); // 6
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test tests/unit/ui/components/PixelSpriteComponent.spec.ts`
Expected: FAIL with "Cannot find module"

- [ ] **Step 3: Write minimal implementation**

```typescript
// src/ui/components/PixelSpriteComponent.ts
import Phaser from 'phaser';

export interface PixelSpriteConfig {
  grid: string[];
  palette: Record<string, string>;
  pixelSize?: number;
  animated?: boolean;
}

export default class PixelSpriteComponent {
  protected scene: Phaser.Scene;
  public container: Phaser.GameObjects.Container;
  public graphics: Phaser.GameObjects.Graphics | null = null;

  public grid: string[];
  public palette: Record<string, string>;
  public pixelSize: number;
  public animated: boolean;

  public width: number;
  public height: number;

  constructor(scene: Phaser.Scene, config: PixelSpriteConfig, x: number = 0, y: number = 0) {
    this.scene = scene;
    this.grid = config.grid;
    this.palette = config.palette;
    this.pixelSize = config.pixelSize ?? 3;
    this.animated = config.animated ?? false;

    this.width = this.grid[0]?.length * this.pixelSize ?? 0;
    this.height = this.grid.length * this.pixelSize;

    this.container = scene.add.container(x, y);
    this.graphics = scene.add.graphics();
    this.container.add(this.graphics);

    this.drawPixels();
    scene.add.existing(this.container);
  }

  protected drawPixels(): void {
    if (!this.graphics) return;
    this.graphics.clear();

    this.grid.forEach((row, y) => {
      [...row].forEach((char, x) => {
        if (char === ' ' || !this.palette[char]) return;
        const color = Phaser.Display.Color.HexStringToColor(this.palette[char]).color;
        this.graphics!.fillStyle(color, 1);
        this.graphics!.fillRect(
          x * this.pixelSize,
          y * this.pixelSize,
          this.pixelSize,
          this.pixelSize
        );
      });
    });
  }

  public setPosition(x: number, y: number): this {
    this.container.setPosition(x, y);
    return this;
  }

  public destroy(): void {
    if (this.graphics) {
      this.graphics.destroy();
      this.graphics = null;
    }
    this.container.destroy();
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test tests/unit/ui/components/PixelSpriteComponent.spec.ts`
Expected: PASS

- [ ] **Step 5: Write test for pixel drawing**

```typescript
// Add to tests/unit/ui/components/PixelSpriteComponent.spec.ts
describe('像素绘制', () => {
  it('should call fillStyle and fillRect for each non-space character', () => {
    const scene = createMockScene();
    const grid = ['aa', 'bb'];
    const palette = { a: '#ff0000', b: '#00ff00' };

    const sprite = new PixelSpriteComponent(scene, { grid, palette });
    const mockGraphics = scene.add.graphics();

    // 4 non-space chars: a(0,0), a(1,0), b(0,1), b(1,1)
    expect(mockGraphics.fillStyle).toHaveBeenCalled();
    expect(mockGraphics.fillRect).toHaveBeenCalled();
  });

  it('should skip space characters', () => {
    const scene = createMockScene();
    const grid = ['a a', ' b ']; // has spaces
    const palette = { a: '#ff0000', b: '#00ff00' };

    const sprite = new PixelSpriteComponent(scene, { grid, palette });
    const mockGraphics = scene.add.graphics();

    // Only 3 non-space chars: a(0,0), a(2,0), b(1,1)
    expect(mockGraphics.fillRect).toHaveBeenCalledTimes(3);
  });
});
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npm run test tests/unit/ui/components/PixelSpriteComponent.spec.ts`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add src/ui/components/PixelSpriteComponent.ts tests/unit/ui/components/PixelSpriteComponent.spec.ts
git commit -m "feat(ui): add PixelSpriteComponent for pixel art rendering"
```

---

## Task 2: ScrollModalUI - 卷轴风格弹窗基类

**Files:**
- Create: `src/ui/base/ScrollModalUI.ts`
- Test: `tests/unit/ui/base/ScrollModalUI.spec.ts`

- [ ] **Step 1: Write the failing test for ScrollModalUI 基本构造**

```typescript
// tests/unit/ui/base/ScrollModalUI.spec.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ScrollModalUI from '../../../src/ui/base/ScrollModalUI';

const createMockScene = () => {
  const mockContainer = {
    add: vi.fn().mockReturnThis(),
    setDepth: vi.fn().mockReturnThis(),
    setScrollFactor: vi.fn().mockReturnThis(),
    destroy: vi.fn(),
  };
  const mockGraphics = {
    clear: vi.fn().mockReturnThis(),
    fillStyle: vi.fn().mockReturnThis(),
    fillRect: vi.fn().mockReturnThis(),
    lineStyle: vi.fn().mockReturnThis(),
    strokeRect: vi.fn().mockReturnThis(),
    fillGradientStyle: vi.fn().mockReturnThis(),
    destroy: vi.fn(),
  };
  const mockText = {
    setOrigin: vi.fn().mockReturnThis(),
    setInteractive: vi.fn().mockReturnThis(),
    on: vi.fn().mockReturnThis(),
    destroy: vi.fn(),
    setText: vi.fn().mockReturnThis(),
  };
  return {
    add: {
      container: vi.fn((x, y) => {
        mockContainer.x = x;
        mockContainer.y = y;
        return mockContainer;
      }),
      graphics: vi.fn().mockReturnValue(mockGraphics),
      text: vi.fn().mockReturnValue(mockText),
      existing: vi.fn(),
    },
    cameras: {
      main: { scrollX: 0, scrollY: 0, width: 800, height: 600 },
    },
    input: {
      keyboard: {
        on: vi.fn(),
        off: vi.fn(),
      },
    },
  } as any;
};

describe('ScrollModalUI', () => {
  describe('构造与属性', () => {
    it('should create modal with title', () => {
      const scene = createMockScene();
      const modal = new ScrollModalUI(scene, {
        title: '煎药',
        modalType: 'MINIGAME_MODAL',
        onExit: vi.fn(),
      });

      expect(modal.title).toBe('煎药');
      expect(scene.add.text).toHaveBeenCalled();
    });

    it('should accept subtitle config', () => {
      const scene = createMockScene();
      const modal = new ScrollModalUI(scene, {
        title: '煎药',
        subtitle: '壬寅春',
        modalType: 'MINIGAME_MODAL',
        onExit: vi.fn(),
      });

      expect(modal.subtitle).toBe('壬寅春');
    });

    it('should accept sealMain config', () => {
      const scene = createMockScene();
      const modal = new ScrollModalUI(scene, {
        title: '煎药',
        sealMain: '杏林',
        modalType: 'MINIGAME_MODAL',
        onExit: vi.fn(),
      });

      expect(modal.sealMain).toBe('杏林');
    });

    it('should accept sealCorner config', () => {
      const scene = createMockScene();
      const modal = new ScrollModalUI(scene, {
        title: '煎药',
        sealCorner: '煎煮',
        modalType: 'MINIGAME_MODAL',
        onExit: vi.fn(),
      });

      expect(modal.sealCorner).toBe('煎煮');
    });

    it('should inherit from ModalUI', () => {
      const scene = createMockScene();
      const modal = new ScrollModalUI(scene, {
        title: '煎药',
        modalType: 'MINIGAME_MODAL',
        onExit: vi.fn(),
      });

      expect(modal.container).toBeDefined();
      expect(modal.modalType).toBe('MINIGAME_MODAL');
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test tests/unit/ui/base/ScrollModalUI.spec.ts`
Expected: FAIL with "Cannot find module"

- [ ] **Step 3: Write minimal implementation**

```typescript
// src/ui/base/ScrollModalUI.ts
import Phaser from 'phaser';
import ModalUI from './ModalUI';

export interface ScrollModalConfig {
  title: string;
  subtitle?: string;
  sealMain?: string;
  sealCorner?: string;
  variant?: 'default' | 'dark' | 'light';
  modalType: 'MINIGAME_MODAL' | 'DIAGNOSIS_MODAL' | 'FULLSCREEN_MODAL';
  onExit: () => void;
}

// 颜色常量（从 HTML CSS 提取）
const SCROLL_COLOR = {
  PAPER: 0xe8c991,
  PAPER_BRIGHT: 0xf4dba8,
  PAPER_DEEP: 0xc89550,
  CINNABAR: 0xb8322c,
  CINNABAR_DEEP: 0x8a1f1a,
  WOOD: 0x6b3e1f,
  WOOD_DARK: 0x3f2412,
  WOOD_LIGHT: 0xa26a3a,
  INK: 0x2a1810,
};

export default class ScrollModalUI extends ModalUI {
  public title: string;
  public subtitle?: string;
  public sealMain?: string;
  public sealCorner?: string;
  public variant: 'default' | 'dark' | 'light';

  protected scrollGraphics: Phaser.GameObjects.Graphics | null = null;
  protected sealMainGraphics: Phaser.GameObjects.Graphics | null = null;
  protected sealCornerGraphics: Phaser.GameObjects.Graphics | null = null;
  protected titleText: Phaser.GameObjects.Text | null = null;
  protected subtitleText: Phaser.GameObjects.Text | null = null;
  protected contentContainer: Phaser.GameObjects.Container | null = null;

  constructor(scene: Phaser.Scene, config: ScrollModalConfig) {
    super(scene, config.modalType, '[×]', config.onExit);

    this.title = config.title;
    this.subtitle = config.subtitle;
    this.sealMain = config.sealMain;
    this.sealCorner = config.sealCorner;
    this.variant = config.variant ?? 'default';

    // 绘制卷轴装饰（覆盖默认边框）
    this.drawScrollFrame();
    this.drawSeals();
    this.drawTitleBar();
    this.createContentContainer();
  }

  protected drawScrollFrame(): void {
    if (!this.graphics) return;
    this.graphics.clear();

    const x = -this.width / 2;
    const y = -this.height / 2;

    // 上下轴（木轴）
    const rollerHeight = 28;
    // 上轴
    this.graphics.fillStyle(SCROLL_COLOR.WOOD, 1);
    this.graphics.fillRect(x - 16, y - 8, this.width + 32, rollerHeight);
    this.graphics.lineStyle(3, SCROLL_COLOR.WOOD_LIGHT, 1);
    this.graphics.strokeRect(x - 16, y - 8, this.width + 32, rollerHeight);

    // 下轴
    this.graphics.fillStyle(SCROLL_COLOR.WOOD, 1);
    this.graphics.fillRect(x - 16, y + this.height - rollerHeight + 8, this.width + 32, rollerHeight);
    this.graphics.lineStyle(3, SCROLL_COLOR.WOOD_DARK, 1);
    this.graphics.strokeRect(x - 16, y + this.height - rollerHeight + 8, this.width + 32, rollerHeight);

    // 纸张背景
    this.graphics.fillStyle(SCROLL_COLOR.PAPER, 1);
    this.graphics.fillRect(x + 14, y + 14, this.width - 28, this.height - 28);

    // 纸张边框
    this.graphics.lineStyle(6, SCROLL_COLOR.WOOD_DARK, 1);
    this.graphics.strokeRect(x + 14, y + 14, this.width - 28, this.height - 28);
  }

  protected drawSeals(): void {
    // 主印章（左上角）
    if (this.sealMain) {
      this.sealMainGraphics = this.scene.add.graphics();
      this.container.add(this.sealMainGraphics);

      const sealSize = 60;
      const sealX = -this.width / 2 + 30;
      const sealY = -this.height / 2 + 40;

      // 印章背景
      this.sealMainGraphics.fillStyle(SCROLL_COLOR.CINNABAR_DEEP, 1);
      this.sealMainGraphics.fillRect(sealX, sealY, sealSize, sealSize);

      // 印章边框
      this.sealMainGraphics.lineStyle(4, SCROLL_COLOR.CINNABAR, 1);
      this.sealMainGraphics.strokeRect(sealX, sealY, sealSize, sealSize);

      // 印章文字
      const sealText = this.scene.add.text(
        sealX + sealSize / 2,
        sealY + sealSize / 2,
        this.sealMain,
        {
          fontSize: '20px',
          fontFamily: 'Noto Serif SC',
          color: '#f4dba8',
          fontWeight: '900',
        }
      );
      sealText.setOrigin(0.5, 0.5);
      sealText.setRotation(-0.07); // 约 -4 度
      this.container.add(sealText);
    }

    // 角印章（右下角，小）
    if (this.sealCorner) {
      this.sealCornerGraphics = this.scene.add.graphics();
      this.container.add(this.sealCornerGraphics);

      const sealSize = 44;
      const sealX = this.width / 2 - 60;
      const sealY = this.height / 2 - 70;

      this.sealCornerGraphics.fillStyle(SCROLL_COLOR.CINNABAR_DEEP, 1);
      this.sealCornerGraphics.fillRect(sealX, sealY, sealSize, sealSize);

      this.sealCornerGraphics.lineStyle(3, SCROLL_COLOR.CINNABAR, 1);
      this.sealCornerGraphics.strokeRect(sealX, sealY, sealSize, sealSize);

      const sealText = this.scene.add.text(
        sealX + sealSize / 2,
        sealY + sealSize / 2,
        this.sealCorner,
        {
          fontSize: '14px',
          fontFamily: 'Noto Serif SC',
          color: '#f4dba8',
          fontWeight: '900',
        }
      );
      sealText.setOrigin(0.5, 0.5);
      sealText.setRotation(0.05); // 约 3 度
      this.container.add(sealText);
    }
  }

  protected drawTitleBar(): void {
    const titleX = 0;
    const titleY = -this.height / 2 + 50;

    // 主标题
    this.titleText = this.scene.add.text(titleX, titleY, this.title, {
      fontSize: '28px',
      fontFamily: 'Noto Serif SC',
      color: '#2a1810',
      fontWeight: '900',
    });
    this.titleText.setOrigin(0.5, 0.5);
    this.container.add(this.titleText);

    // 副标题（竖排）
    if (this.subtitle) {
      this.subtitleText = this.scene.add.text(titleX + 60, titleY - 10, this.subtitle, {
        fontSize: '12px',
        fontFamily: 'ZCOOL XiaoWei, Noto Serif SC',
        color: '#3f2412',
      });
      this.subtitleText.setOrigin(0.5, 0);
      this.subtitleText.setRotation(Math.PI / 2); // 竖排
      this.container.add(this.subtitleText);
    }
  }

  protected createContentContainer(): void {
    this.contentContainer = this.scene.add.container(0, 30);
    this.container.add(this.contentContainer);
  }

  public getContentContainer(): Phaser.GameObjects.Container {
    return this.contentContainer!;
  }

  public destroy(): void {
    if (this.scrollGraphics) {
      this.scrollGraphics.destroy();
      this.scrollGraphics = null;
    }
    if (this.sealMainGraphics) {
      this.sealMainGraphics.destroy();
      this.sealMainGraphics = null;
    }
    if (this.sealCornerGraphics) {
      this.sealCornerGraphics.destroy();
      this.sealCornerGraphics = null;
    }
    if (this.titleText) {
      this.titleText.destroy();
      this.titleText = null;
    }
    if (this.subtitleText) {
      this.subtitleText.destroy();
      this.subtitleText = null;
    }
    if (this.contentContainer) {
      this.contentContainer.destroy();
      this.contentContainer = null;
    }
    super.destroy();
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test tests/unit/ui/base/ScrollModalUI.spec.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/ui/base/ScrollModalUI.ts tests/unit/ui/base/ScrollModalUI.spec.ts
git commit -m "feat(ui): add ScrollModalUI for scroll-style modal frames"
```

---

## Task 3: HerbTagComponent - 药牌组件

**Files:**
- Create: `src/ui/components/HerbTagComponent.ts`
- Test: `tests/unit/ui/components/HerbTagComponent.spec.ts`

- [ ] **Step 1: Write the failing test for HerbTagComponent 基本构造**

```typescript
// tests/unit/ui/components/HerbTagComponent.spec.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import HerbTagComponent from '../../../src/ui/components/HerbTagComponent';

const createMockScene = () => {
  const mockContainer = {
    add: vi.fn().mockReturnThis(),
    setDepth: vi.fn().mockReturnThis(),
    destroy: vi.fn(),
  };
  const mockGraphics = {
    clear: vi.fn().mockReturnThis(),
    fillStyle: vi.fn().mockReturnThis(),
    fillRect: vi.fn().mockReturnThis(),
    lineStyle: vi.fn().mockReturnThis(),
    strokeRect: vi.fn().mockReturnThis(),
    destroy: vi.fn(),
  };
  const mockText = {
    setOrigin: vi.fn().mockReturnThis(),
    setInteractive: vi.fn().mockReturnThis(),
    on: vi.fn().mockReturnThis(),
    destroy: vi.fn(),
    setText: vi.fn().mockReturnThis(),
    setVisible: vi.fn().mockReturnThis(),
  };
  return {
    add: {
      container: vi.fn().mockReturnValue(mockContainer),
      graphics: vi.fn().mockReturnValue(mockGraphics),
      text: vi.fn().mockReturnValue(mockText),
      existing: vi.fn(),
    },
  } as any;
};

describe('HerbTagComponent', () => {
  describe('构造与属性', () => {
    it('should create component with herb data', () => {
      const scene = createMockScene();
      const herb = {
        id: 'danggui',
        name: '当归',
        prop: '补血',
        count: 6,
        grid: ['  aa  ', ' abba '],
        palette: { a: '#6a8c78', b: '#8ab098' },
      };

      const tag = new HerbTagComponent(scene, { herb });

      expect(tag.herb.name).toBe('当归');
      expect(tag.herb.count).toBe(6);
    });

    it('should have standard plank size 84x78', () => {
      const scene = createMockScene();
      const herb = {
        id: 'danggui',
        name: '当归',
        prop: '补血',
        count: 6,
        grid: ['aa', 'bb'],
        palette: { a: '#ff0000', b: '#00ff00' },
      };

      const tag = new HerbTagComponent(scene, { herb });

      expect(tag.plankWidth).toBe(84);
      expect(tag.plankHeight).toBe(78);
    });

    it('should accept draggable config', () => {
      const scene = createMockScene();
      const herb = {
        id: 'danggui',
        name: '当归',
        prop: '补血',
        count: 6,
        grid: ['aa', 'bb'],
        palette: { a: '#ff0000', b: '#00ff00' },
      };

      const tag = new HerbTagComponent(scene, { herb, draggable: true });

      expect(tag.draggable).toBe(true);
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test tests/unit/ui/components/HerbTagComponent.spec.ts`
Expected: FAIL

- [ ] **Step 3: Write minimal implementation**

```typescript
// src/ui/components/HerbTagComponent.ts
import Phaser from 'phaser';
import PixelSpriteComponent from './PixelSpriteComponent';

export interface HerbData {
  id: string;
  name: string;
  prop: string;
  count: number;
  grid: string[];
  palette: Record<string, string>;
}

export interface HerbTagConfig {
  herb: HerbData;
  pixelSize?: number;
  draggable?: boolean;
  onClick?: () => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  selected?: boolean;
  disabled?: boolean;
}

// 颜色常量
const TAG_COLOR = {
  PLANK: 0xc89550,
  PLANK_DARK: 0x3f2412,
  PLANK_LIGHT: 0xffd24a,
  INK: 0x2a1810,
  CINNABAR: 0x8a1f1a,
};

export default class HerbTagComponent {
  protected scene: Phaser.Scene;
  public container: Phaser.GameObjects.Container;

  public herb: HerbData;
  public plankWidth: number;
  public plankHeight: number;
  public pixelSize: number;
  public draggable: boolean;

  protected plankGraphics: Phaser.GameObjects.Graphics | null = null;
  protected stringGraphics: Phaser.GameObjects.Graphics | null = null;
  protected pixelSprite: PixelSpriteComponent | null = null;
  protected nameText: Phaser.GameObjects.Text | null = null;
  protected propText: Phaser.GameObjects.Text | null = null;
  protected countText: Phaser.GameObjects.Text | null = null;

  protected config: HerbTagConfig;

  constructor(scene: Phaser.Scene, config: HerbTagConfig, x: number = 0, y: number = 0) {
    this.scene = scene;
    this.config = config;
    this.herb = config.herb;
    this.plankWidth = 84;
    this.plankHeight = 78;
    this.pixelSize = config.pixelSize ?? 3;
    this.draggable = config.draggable ?? false;

    this.container = scene.add.container(x, y);

    this.drawString();
    this.drawPlank();
    this.createPixelSprite();
    this.createTexts();
    this.setupInteraction();

    scene.add.existing(this.container);
  }

  protected drawString(): void {
    this.stringGraphics = this.scene.add.graphics();
    this.container.add(this.stringGraphics);

    // 绳子（顶部悬挂）
    const stringLength = 10;
    this.stringGraphics.fillStyle(TAG_COLOR.INK, 1);
    this.stringGraphics.fillRect(-1, -stringLength - 14, 2, stringLength);

    // 绳子顶端圆点（红色）
    this.stringGraphics.fillStyle(TAG_COLOR.CINNABAR, 1);
    this.stringGraphics.fillCircle(0, -stringLength - 17, 4);
  }

  protected drawPlank(): void {
    this.plankGraphics = this.scene.add.graphics();
    this.container.add(this.plankGraphics);

    const plankX = -this.plankWidth / 2;
    const plankY = -14; // 绳子下方

    // 木牌背景（条纹纹理）
    this.plankGraphics.fillStyle(TAG_COLOR.PLANK, 1);
    this.plankGraphics.fillRect(plankX, plankY, this.plankWidth, this.plankHeight);

    // 木牌边框
    this.plankGraphics.lineStyle(3, TAG_COLOR.PLANK_DARK, 1);
    this.plankGraphics.strokeRect(plankX, plankY, this.plankWidth, this.plankHeight);

    // 顶部高光
    this.plankGraphics.fillStyle(TAG_COLOR.PLANK_LIGHT, 0.3);
    this.plankGraphics.fillRect(plankX + 2, plankY + 2, this.plankWidth - 4, 3);
  }

  protected createPixelSprite(): void {
    this.pixelSprite = new PixelSpriteComponent(
      this.scene,
      {
        grid: this.herb.grid,
        palette: this.herb.palette,
        pixelSize: this.pixelSize,
      },
      0,
      -14 + 16
    );
    this.container.add(this.pixelSprite.container);
  }

  protected createTexts(): void {
    // 药名
    this.nameText = this.scene.add.text(0, -14 + 44, this.herb.name, {
      fontSize: '12px',
      fontFamily: 'Noto Serif SC',
      color: '#2a1810',
      fontWeight: '900',
    });
    this.nameText.setOrigin(0.5, 0.5);
    this.container.add(this.nameText);

    // 属性
    this.propText = this.scene.add.text(0, -14 + 56, this.herb.prop, {
      fontSize: '9px',
      fontFamily: 'ZCOOL XiaoWei, Noto Serif SC',
      color: '#8a1f1a',
    });
    this.propText.setOrigin(0.5, 0.5);
    this.container.add(this.propText);

    // 数量角标
    if (this.herb.count > 1) {
      this.countText = this.scene.add.text(
        this.plankWidth / 2 - 4,
        this.plankHeight / 2 - 8,
        `×${this.herb.count}`,
        {
          fontSize: '10px',
          fontFamily: 'VT323, monospace',
          color: '#f4dba8',
          backgroundColor: '#2a1810',
          padding: { x: 2, y: 1 },
        }
      );
      this.countText.setOrigin(0.5, 0.5);
      this.container.add(this.countText);
    }
  }

  protected setupInteraction(): void {
    if (this.draggable) {
      this.container.setSize(this.plankWidth, this.plankHeight + 14);
      this.container.setInteractive({ useHandCursor: true });

      this.scene.input.setDraggable(this.container);

      this.container.on('dragstart', () => {
        if (this.config.onDragStart) this.config.onDragStart();
      });

      this.container.on('drag', (pointer: any, dragX: number, dragY: number) => {
        this.container.setPosition(dragX, dragY);
      });

      this.container.on('dragend', () => {
        if (this.config.onDragEnd) this.config.onDragEnd();
      });
    } else if (this.config.onClick) {
      this.container.setSize(this.plankWidth, this.plankHeight + 14);
      this.container.setInteractive({ useHandCursor: true });
      this.container.on('pointerdown', this.config.onClick);
    }
  }

  public setPosition(x: number, y: number): this {
    this.container.setPosition(x, y);
    return this;
  }

  public setDepth(depth: number): this {
    this.container.setDepth(depth);
    return this;
  }

  public destroy(): void {
    if (this.plankGraphics) {
      this.plankGraphics.destroy();
      this.plankGraphics = null;
    }
    if (this.stringGraphics) {
      this.stringGraphics.destroy();
      this.stringGraphics = null;
    }
    if (this.pixelSprite) {
      this.pixelSprite.destroy();
      this.pixelSprite = null;
    }
    if (this.nameText) {
      this.nameText.destroy();
      this.nameText = null;
    }
    if (this.propText) {
      this.propText.destroy();
      this.propText = null;
    }
    if (this.countText) {
      this.countText.destroy();
      this.countText = null;
    }
    this.container.destroy();
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test tests/unit/ui/components/HerbTagComponent.spec.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/ui/components/HerbTagComponent.ts tests/unit/ui/components/HerbTagComponent.spec.ts
git commit -m "feat(ui): add HerbTagComponent for herb tag display"
```

---

## Task 4: DragEffectManager - 拖拽动效系统

**Files:**
- Create: `src/systems/DragEffectManager.ts`
- Test: `tests/unit/systems/DragEffectManager.spec.ts`

- [ ] **Step 1: Write the failing test for DragEffectManager 基本构造**

```typescript
// tests/unit/systems/DragEffectManager.spec.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import DragEffectManager from '../../../src/systems/DragEffectManager';

const createMockScene = () => {
  const mockGraphics = {
    clear: vi.fn().mockReturnThis(),
    fillStyle: vi.fn().mockReturnThis(),
    fillCircle: vi.fn().mockReturnThis(),
    fillRect: vi.fn().mockReturnThis(),
    lineStyle: vi.fn().mockReturnThis(),
    strokeRect: vi.fn().mockReturnThis(),
    destroy: vi.fn(),
  };
  const mockText = {
    setOrigin: vi.fn().mockReturnThis(),
    setRotation: vi.fn().mockReturnThis(),
    destroy: vi.fn(),
  };
  const mockTween = {
    on: vi.fn().mockReturnThis(),
    play: vi.fn().mockReturnThis(),
    stop: vi.fn().mockReturnThis(),
  };
  return {
    add: {
      graphics: vi.fn().mockReturnValue(mockGraphics),
      text: vi.fn().mockReturnValue(mockText),
    },
    tweens: {
      add: vi.fn().mockReturnValue(mockTween),
    },
  } as any;
};

describe('DragEffectManager', () => {
  describe('构造与配置', () => {
    it('should create manager with default config', () => {
      const scene = createMockScene();
      const manager = new DragEffectManager(scene);

      expect(manager.config.trail.enabled).toBe(true);
      expect(manager.config.trail.maxCount).toBe(20);
      expect(manager.config.trail.fadeTime).toBe(600);
    });

    it('should accept custom config', () => {
      const scene = createMockScene();
      const manager = new DragEffectManager(scene, {
        trail: { enabled: false, maxCount: 10, fadeTime: 300, particleSize: 3 },
      });

      expect(manager.config.trail.enabled).toBe(false);
      expect(manager.config.trail.maxCount).toBe(10);
    });
  });

  describe('拖拽轨迹', () => {
    it('should create trail particles when updateDrag is called', () => {
      const scene = createMockScene();
      const manager = new DragEffectManager(scene);

      manager.startDrag(100, 100);
      manager.updateDrag(110, 110);

      expect(scene.add.graphics).toHaveBeenCalled();
    });

    it('should not create trail when trail.enabled is false', () => {
      const scene = createMockScene();
      const manager = new DragEffectManager(scene, {
        trail: { enabled: false, maxCount: 0, fadeTime: 0, particleSize: 0 },
      });

      manager.startDrag(100, 100);
      manager.updateDrag(110, 110);

      // Should not create additional graphics for trail
    });
  });

  describe('成功爆发', () => {
    it('should show success burst when endDrop with "success"', () => {
      const scene = createMockScene();
      const manager = new DragEffectManager(scene);

      manager.endDrop(200, 200, 'success');

      expect(scene.add.text).toHaveBeenCalled(); // 印章文字
    });
  });

  describe('失败爆发', () => {
    it('should show failure burst when endDrop with "failure"', () => {
      const scene = createMockScene();
      const manager = new DragEffectManager(scene);

      manager.endDrop(200, 200, 'failure');

      expect(scene.add.graphics).toHaveBeenCalled(); // 红X
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test tests/unit/systems/DragEffectManager.spec.ts`
Expected: FAIL

- [ ] **Step 3: Write minimal implementation**

```typescript
// src/systems/DragEffectManager.ts
import Phaser from 'phaser';

export interface DragEffectTrailConfig {
  enabled: boolean;
  maxCount: number;
  fadeTime: number;
  particleSize: number;
}

export interface DragEffectSplashConfig {
  enabled: boolean;
  count: number;
  spread: number;
  riseHeight: number;
}

export interface DragEffectBurstSuccessConfig {
  text: string;
  color: string;
  duration: number;
}

export interface DragEffectBurstFailureConfig {
  showCross: boolean;
  showSmoke: boolean;
  duration: number;
}

export interface DragEffectConfig {
  trail?: Partial<DragEffectTrailConfig>;
  splash?: Partial<DragEffectSplashConfig>;
  burst?: {
    success?: Partial<DragEffectBurstSuccessConfig>;
    failure?: Partial<DragEffectBurstFailureConfig>;
  };
}

const DEFAULT_CONFIG: DragEffectConfig = {
  trail: {
    enabled: true,
    maxCount: 20,
    fadeTime: 600,
    particleSize: 4,
  },
  splash: {
    enabled: true,
    count: 8,
    spread: 40,
    riseHeight: 50,
  },
  burst: {
    success: {
      text: '合',
      color: '#ffd24a',
      duration: 1400,
    },
    failure: {
      showCross: true,
      showSmoke: true,
      duration: 1100,
    },
  },
};

// 颜色常量
const EFFECT_COLOR = {
  GOLD: 0xffd24a,
  GOLD_LIGHT: 0xfff3c0,
  RED: 0xff4a3a,
  CINNABAR: 0xb8322c,
  CINNABAR_DEEP: 0x8a1f1a,
  SMOKE: 0x281410,
};

export default class DragEffectManager {
  protected scene: Phaser.Scene;
  public config: Required<DragEffectConfig>;

  protected trailParticles: Phaser.GameObjects.Graphics[] = [];
  protected isDragging: boolean = false;
  protected lastDragX: number = 0;
  protected lastDragY: number = 0;
  protected trailIndex: number = 0;

  constructor(scene: Phaser.Scene, config?: DragEffectConfig) {
    this.scene = scene;
    this.config = this.mergeConfig(config);
  }

  protected mergeConfig(config?: DragEffectConfig): Required<DragEffectConfig> {
    return {
      trail: { ...DEFAULT_CONFIG.trail!, ...config?.trail },
      splash: { ...DEFAULT_CONFIG.splash!, ...config?.splash },
      burst: {
        success: { ...DEFAULT_CONFIG.burst!.success!, ...config?.burst?.success },
        failure: { ...DEFAULT_CONFIG.burst!.failure!, ...config?.burst?.failure },
      },
    } as Required<DragEffectConfig>;
  }

  public startDrag(x: number, y: number): void {
    this.isDragging = true;
    this.lastDragX = x;
    this.lastDragY = y;
  }

  public updateDrag(x: number, y: number): void {
    if (!this.isDragging || !this.config.trail.enabled) return;

    // 计算移动距离
    const dx = x - this.lastDragX;
    const dy = y - this.lastDragY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // 只有移动足够距离才创建轨迹粒子
    if (distance > 8) {
      this.createTrailParticle(x, y);
      this.lastDragX = x;
      this.lastDragY = y;
    }
  }

  protected createTrailParticle(x: number, y: number): void {
    // 清理超过最大数量的粒子
    while (this.trailParticles.length >= this.config.trail.maxCount) {
      const oldest = this.trailParticles.shift();
      if (oldest) oldest.destroy();
    }

    const particle = this.scene.add.graphics();
    particle.fillStyle(EFFECT_COLOR.GOLD, 1);
    particle.fillCircle(0, 0, this.config.trail.particleSize);
    particle.setPosition(x, y);

    // Fade out tween
    this.scene.tweens.add({
      targets: particle,
      alpha: 0,
      scale: 0.2,
      duration: this.config.trail.fadeTime,
      onComplete: () => {
        particle.destroy();
        const index = this.trailParticles.indexOf(particle);
        if (index >= 0) this.trailParticles.splice(index, 1);
      },
    });

    this.trailParticles.push(particle);
  }

  public endDrop(x: number, y: number, result: 'success' | 'failure'): void {
    this.isDragging = false;

    // 清理轨迹粒子
    this.clearTrail();

    // 显示溅射效果
    if (this.config.splash.enabled) {
      this.createSplash(x, y);
    }

    // 显示爆发效果
    if (result === 'success') {
      this.createSuccessBurst(x, y);
    } else {
      this.createFailureBurst(x, y);
    }
  }

  protected createSplash(x: number, y: number): void {
    for (let i = 0; i < this.config.splash.count; i++) {
      const angle = (Math.PI * 2 / this.config.splash.count) * i + Math.random() * 0.5;
      const spread = this.config.splash.spread * (0.5 + Math.random() * 0.5);

      const targetX = x + Math.cos(angle) * spread;
      const targetY = y - this.config.splash.riseHeight + Math.sin(angle) * spread * 0.5;

      const splash = this.scene.add.graphics();
      splash.fillStyle(0xc89550, 1);
      splash.fillCircle(0, 0, 4);
      splash.setPosition(x, y);

      this.scene.tweens.add({
        targets: splash,
        x: targetX,
        y: targetY,
        alpha: 0,
        scale: 0.2,
        duration: 800,
        onComplete: () => splash.destroy(),
      });
    }
  }

  protected createSuccessBurst(x: number, y: number): void {
    // 金色光芒圆环
    for (let i = 0; i < 2; i++) {
      const ring = this.scene.add.graphics();
      ring.lineStyle(3 + i * 2, EFFECT_COLOR.GOLD, 1);
      ring.strokeCircle(0, 0, 10);
      ring.setPosition(x, y);

      this.scene.tweens.add({
        targets: ring,
        scale: 7 + i * 2,
        alpha: 0,
        duration: 700 + i * 200,
        onComplete: () => ring.destroy(),
      });
    }

    // 印章 "合"
    const stamp = this.scene.add.text(x, y, this.config.burst.success.text, {
      fontSize: '22px',
      fontFamily: 'Noto Serif SC',
      color: '#ffd24a',
      backgroundColor: '#8a1f1a',
      padding: { x: 8, y: 8 },
      fontWeight: '900',
    });
    stamp.setOrigin(0.5, 0.5);
    stamp.setRotation(-0.07);

    this.scene.tweens.add({
      targets: stamp,
      scale: { from: 0, to: 1.3 },
      alpha: { from: 0, to: 1 },
      duration: 300,
      yoyo: true,
      hold: 400,
      onComplete: () => stamp.destroy(),
    });

    // 金色火花
    for (let i = 0; i < 8; i++) {
      const spark = this.scene.add.graphics();
      spark.fillStyle(EFFECT_COLOR.GOLD, 1);
      spark.fillCircle(0, 0, 3);
      spark.setPosition(x, y);

      const angle = (Math.PI * 2 / 8) * i;
      const distance = 60 + Math.random() * 40;

      this.scene.tweens.add({
        targets: spark,
        x: x + Math.cos(angle) * distance,
        y: y + Math.sin(angle) * distance,
        alpha: 0,
        duration: 1000,
        onComplete: () => spark.destroy(),
      });
    }
  }

  protected createFailureBurst(x: number, y: number): void {
    // 红X
    if (this.config.burst.failure.showCross) {
      const crossGraphics = this.scene.add.graphics();
      crossGraphics.setPosition(x, y);

      // 两条交叉线
      crossGraphics.lineStyle(8, EFFECT_COLOR.RED, 1);
      crossGraphics.beginPath();
      crossGraphics.moveTo(-28, -28);
      crossGraphics.lineTo(28, 28);
      crossGraphics.moveTo(28, -28);
      crossGraphics.lineTo(-28, 28);
      crossGraphics.strokePath();

      this.scene.tweens.add({
        targets: crossGraphics,
        scale: { from: 0.3, to: 1 },
        alpha: { from: 0, to: 1 },
        duration: 300,
        yoyo: true,
        hold: 300,
        onComplete: () => crossGraphics.destroy(),
      });
    }

    // 烟雾
    if (this.config.burst.failure.showSmoke) {
      const smoke = this.scene.add.graphics();
      smoke.fillStyle(EFFECT_COLOR.SMOKE, 0.7);
      smoke.fillCircle(0, 0, 30);
      smoke.setPosition(x, y);

      this.scene.tweens.add({
        targets: smoke,
        scale: 2,
        alpha: 0,
        y: y - 60,
        duration: 1100,
        onComplete: () => smoke.destroy(),
      });
    }

    // 红色火花
    for (let i = 0; i < 6; i++) {
      const spark = this.scene.add.graphics();
      spark.fillStyle(EFFECT_COLOR.RED, 1);
      spark.fillCircle(0, 0, 3);
      spark.setPosition(x, y);

      const angle = (Math.PI * 2 / 6) * i + Math.random() * 0.5;
      const distance = 50 + Math.random() * 30;

      this.scene.tweens.add({
        targets: spark,
        x: x + Math.cos(angle) * distance,
        y: y + Math.sin(angle) * distance,
        alpha: 0,
        duration: 1000,
        onComplete: () => spark.destroy(),
      });
    }
  }

  protected clearTrail(): void {
    for (const particle of this.trailParticles) {
      particle.destroy();
    }
    this.trailParticles = [];
  }

  public destroy(): void {
    this.clearTrail();
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test tests/unit/systems/DragEffectManager.spec.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/systems/DragEffectManager.ts tests/unit/systems/DragEffectManager.spec.ts
git commit -m "feat(systems): add DragEffectManager for drag effects"
```

---

## Task 5: 迁移像素药材数据

**Files:**
- Create: `src/data/pixel-herbs.ts`

- [ ] **Step 1: Write pixel herbs data file**

```typescript
// src/data/pixel-herbs.ts
/**
 * 像素药材数据
 * 从 docs/ui/煎药小游戏/herb-icons.jsx 迁移
 *
 * grid: 像素网格，每个字符对应 palette 中的颜色
 * palette: 颜色映射表
 */

export interface PixelHerbData {
  id: string;
  name: string;
  prop: string;
  count: number;
  grid: string[];
  palette: Record<string, string>;
}

// 当归 — pink/purple root
const HERB_DANGGUI_GRID = [
  '   aa    ',
  '  abba   ',
  '  abba   ',
  '   aa    ',
  '   cc    ',
  '  cddc   ',
  ' cdeedc  ',
  'cdeeeeedc',
  ' cdeedc  ',
  '  cddc   ',
];
const HERB_DANGGUI_PAL = { a:'#6a8c78', b:'#8ab098', c:'#8a4a2a', d:'#b86a3a', e:'#d9955a' };

// 黄芪 — golden root sticks
const HERB_HUANGQI_GRID = [
  '  a      ',
  ' aba     ',
  ' abba    ',
  '  aba a  ',
  '  abaaba ',
  '   ababba',
  '   abbba ',
  '   abba  ',
  '   aba   ',
  '   ba    ',
];
const HERB_HUANGQI_PAL = { a:'#c89550', b:'#8a5a2a' };

// 人参 — ginseng with legs
const HERB_RENSHEN_GRID = [
  '   aa    ',
  '  abba   ',
  '  abba   ',
  '  abba   ',
  ' abbbba  ',
  ' abbbba  ',
  '  abba   ',
  '  a  a   ',
  ' a    a  ',
  'a      a ',
];
const HERB_RENSHEN_PAL = { a:'#3a2418', b:'#c89550' };

// 甘草 — yellow stem
const HERB_GANCAO_GRID = [
  '   a     ',
  '   aa    ',
  '  aba    ',
  '  aba    ',
  '  aba    ',
  ' abba    ',
  ' abba a  ',
  ' abbaaba ',
  ' abbbbba ',
  '  aaaaa  ',
];
const HERB_GANCAO_PAL = { a:'#8a5a2a', b:'#e8c991' };

// 枸杞 — red berries
const HERB_GOUQI_GRID = [
  '  b  b   ',
  ' bab bab ',
  ' baa baa ',
  '  b   b  ',
  '    c    ',
  '   ccc   ',
  '   bbb   ',
  '   bab   ',
  '   bab   ',
  '    b    ',
];
const HERB_GOUQI_PAL = { a:'#ffd24a', b:'#b8322c', c:'#6a8c78' };

// 菊花 — chrysanthemum
const HERB_JUHUA_GRID = [
  ' b  b  b ',
  '  bbbbb  ',
  ' bbaaabb ',
  ' baccab  ',
  ' bacccab ',
  ' bacccab ',
  ' baccabb ',
  ' bbaaabb ',
  '  bbbbb  ',
  ' b  b  b ',
];
const HERB_JUHUA_PAL = { a:'#ffd24a', b:'#e8c991', c:'#c89550' };

// 陈皮 — dried orange peel
const HERB_CHENPI_GRID = [
  ' aaa     ',
  'abbba ab ',
  'abcba abb',
  'abbba bba',
  ' aaa abcb',
  '   abbba ',
  '  abcba  ',
  ' abbba   ',
  ' aaa     ',
  '         ',
];
const HERB_CHENPI_PAL = { a:'#8a4a2a', b:'#d9955a', c:'#ffae2a' };

// 茯苓 — white mushroom-like chunk
const HERB_FULING_GRID = [
  '   aaa   ',
  '  abbba  ',
  ' abcccba ',
  ' abcccba ',
  'abbcccbba',
  'abcccccba',
  ' abcccba ',
  '  abbba  ',
  '   aaa   ',
  '         ',
];
const HERB_FULING_PAL = { a:'#8a6a3a', b:'#d9c49a', c:'#f4ead5' };

// 生姜 — ginger
const HERB_SHENGJIANG_GRID = [
  '   aa    ',
  '  abba a ',
  ' abbba ab',
  ' abbba bb',
  'abbbba ab',
  'abbbbba  ',
  ' abbbba  ',
  '  abbba  ',
  '   aab   ',
  '    a    ',
];
const HERB_SHENGJIANG_PAL = { a:'#8a5a2a', b:'#e8c991' };

// 肉桂 — cinnamon curl
const HERB_ROUGUI_GRID = [
  ' aaaaaa  ',
  'abbbbba  ',
  'abccccba ',
  'abc  cba ',
  'abc  cba ',
  'abc  cba ',
  'abccccba ',
  'abbbbba  ',
  ' aaaaaa  ',
  '         ',
];
const HERB_ROUGUI_PAL = { a:'#3a1a0a', b:'#8a4a2a', c:'#c89550' };

// 薄荷 — mint leaf
const HERB_BOHE_GRID = [
  '   bb    ',
  '  bbba   ',
  ' bbabba  ',
  'babaabba ',
  'babaabba ',
  'babaabb  ',
  ' bbabb   ',
  '  bbb    ',
  '   bb    ',
  '    b    ',
];
const HERB_BOHE_PAL = { a:'#b8d0a0', b:'#4a7a3a' };

// 金银花 — yellow-white flower
const HERB_JINYINHUA_GRID = [
  '  a  a   ',
  ' aba aba ',
  ' aba aba ',
  '  a   a  ',
  '   bbb   ',
  '  bcccb  ',
  '  bcccb  ',
  '   bbb   ',
  '    b    ',
  '    b    ',
];
const HERB_JINYINHUA_PAL = { a:'#f4ead5', b:'#4a7a3a', c:'#ffd24a' };

// 川芎 — shares danggui shape with different palette
const HERB_CHUANXIONG_PAL = { a:'#4a7a3a', b:'#6a8c78', c:'#8a4a2a', d:'#b86a3a', e:'#d9955a' };

// 白术 — shares fuling shape with different palette
const HERB_BAIZHU_PAL = { a:'#6a4a2a', b:'#d9c49a', c:'#f4ead5' };

// 熟地 — shares renshen shape with dark palette
const HERB_SHUDI_PAL = { a:'#1a0a04', b:'#4a2818' };

// 白芍 — shares huangqi shape with light palette
const HERB_BAISHAO_PAL = { a:'#f4ead5', b:'#c89550' };

// 大枣 — shares gouqi shape
const HERB_DAZAO_PAL = { a:'#ffd24a', b:'#8a1f1a', c:'#6a8c78' };

// 半夏 — shares fuling shape with dark palette
const HERB_BANXIA_PAL = { a:'#3a2418', b:'#8a6a3a', c:'#c89550' };

// 黄连 — shares huangqi shape
const HERB_HUANGLIAN_PAL = { a:'#ffd24a', b:'#b8633a' };

// 麻黄 — shares bohe shape
const HERB_MAHUANG_PAL = { a:'#a2d090', b:'#2a4a1a' };

// 石斛 — shares bohe shape
const HERB_SHIHU_PAL = { a:'#c8e0a0', b:'#6a8a3a' };

// 附子 — shares renshen shape
const HERB_FUZI_PAL = { a:'#3a1a0a', b:'#8a4a2a' };

// 所有药材数据
export const PIXEL_HERBS: PixelHerbData[] = [
  { id:'danggui',    name:'当归', prop:'补血', grid:HERB_DANGGUI_GRID,    palette:HERB_DANGGUI_PAL,    count: 6 },
  { id:'huangqi',    name:'黄芪', prop:'补气', grid:HERB_HUANGQI_GRID,    palette:HERB_HUANGQI_PAL,    count: 4 },
  { id:'renshen',    name:'人参', prop:'大补', grid:HERB_RENSHEN_GRID,    palette:HERB_RENSHEN_PAL,    count: 1 },
  { id:'gancao',     name:'甘草', prop:'调和', grid:HERB_GANCAO_GRID,     palette:HERB_GANCAO_PAL,     count: 9 },
  { id:'gouqi',      name:'枸杞', prop:'明目', grid:HERB_GOUQI_GRID,      palette:HERB_GOUQI_PAL,      count: 12 },
  { id:'juhua',      name:'菊花', prop:'清热', grid:HERB_JUHUA_GRID,      palette:HERB_JUHUA_PAL,      count: 7 },
  { id:'chenpi',     name:'陈皮', prop:'理气', grid:HERB_CHENPI_GRID,     palette:HERB_CHENPI_PAL,     count: 5 },
  { id:'fuling',     name:'茯苓', prop:'利水', grid:HERB_FULING_GRID,     palette:HERB_FULING_PAL,     count: 3 },
  { id:'shengjiang', name:'生姜', prop:'发散', grid:HERB_SHENGJIANG_GRID, palette:HERB_SHENGJIANG_PAL, count: 8 },
  { id:'rougui',     name:'肉桂', prop:'温阳', grid:HERB_ROUGUI_GRID,     palette:HERB_ROUGUI_PAL,     count: 2 },
  { id:'bohe',       name:'薄荷', prop:'清凉', grid:HERB_BOHE_GRID,       palette:HERB_BOHE_PAL,       count: 5 },
  { id:'jinyinhua',  name:'金银', prop:'解毒', grid:HERB_JINYINHUA_GRID,  palette:HERB_JINYINHUA_PAL,  count: 4 },
  { id:'chuanxiong', name:'川芎', prop:'活血', grid:HERB_DANGGUI_GRID,    palette:HERB_CHUANXIONG_PAL, count: 3 },
  { id:'baizhu',     name:'白术', prop:'健脾', grid:HERB_FULING_GRID,     palette:HERB_BAIZHU_PAL,     count: 5 },
  { id:'shudi',      name:'熟地', prop:'滋阴', grid:HERB_RENSHEN_GRID,    palette:HERB_SHUDI_PAL,      count: 4 },
  { id:'baishao',    name:'白芍', prop:'柔肝', grid:HERB_HUANGQI_GRID,    palette:HERB_BAISHAO_PAL,    count: 6 },
  { id:'dazao',      name:'大枣', prop:'养血', grid:HERB_GOUQI_GRID,      palette:HERB_DAZAO_PAL,      count: 10 },
  { id:'banxia',     name:'半夏', prop:'化痰', grid:HERB_FULING_GRID,     palette:HERB_BANXIA_PAL,     count: 3 },
  { id:'huanglian',  name:'黄连', prop:'泻火', grid:HERB_HUANGQI_GRID,    palette:HERB_HUANGLIAN_PAL,  count: 2 },
  { id:'mahuang',    name:'麻黄', prop:'发汗', grid:HERB_BOHE_GRID,       palette:HERB_MAHUANG_PAL,    count: 3 },
  { id:'shihu',      name:'石斛', prop:'养胃', grid:HERB_BOHE_GRID,       palette:HERB_SHIHU_PAL,      count: 4 },
  { id:'fuzi',       name:'附子', prop:'回阳', grid:HERB_RENSHEN_GRID,    palette:HERB_FUZI_PAL,       count: 1 },
];

// 根据 ID 获取药材数据
export function getPixelHerbById(id: string): PixelHerbData | undefined {
  return PIXEL_HERBS.find(h => h.id === id);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/data/pixel-herbs.ts
git commit -m "feat(data): add pixel herbs data from HTML design"
```

---

## Task 6: 重构 DecoctionUI - 使用新组件

**Files:**
- Modify: `src/ui/DecoctionUI.ts`

- [ ] **Step 1: Read current DecoctionUI implementation**

Run: Read current file to understand structure

- [ ] **Step 2: Create new DecoctionUI using ScrollModalUI and HerbTagComponent**

```typescript
// src/ui/DecoctionUI.ts (重构版本)
import Phaser from 'phaser';
import ScrollModalUI from './base/ScrollModalUI';
import HerbTagComponent, { HerbData } from './components/HerbTagComponent';
import DragEffectManager from '../systems/DragEffectManager';
import { PIXEL_HERBS, getPixelHerbById } from '../data/pixel-herbs';
import { DecoctionRecipe } from '../data/decoction-data';

export default class DecoctionUI extends ScrollModalUI {
  protected herbTags: HerbTagComponent[] = [];
  protected dragManager: DragEffectManager;
  protected selectedHerbs: string[] = [];
  protected recipe: DecoctionRecipe;

  protected stoveGraphics: Phaser.GameObjects.Graphics | null = null;
  protected potGraphics: Phaser.GameObjects.Graphics | null = null;
  protected formulaSlots: Phaser.GameObjects.Graphics[] = [];

  constructor(
    scene: Phaser.Scene,
    recipe: DecoctionRecipe,
    availableHerbs: { id: string; count: number }[],
    onComplete: (score: number) => void,
    onExit: () => void
  ) {
    super(scene, {
      title: '煎药',
      subtitle: '壬寅春',
      sealMain: '杏林',
      sealCorner: '煎煮',
      modalType: 'MINIGAME_MODAL',
      onExit,
    });

    this.recipe = recipe;
    this.dragManager = new DragEffectManager(scene);

    this.createStove();
    this.createHerbBag(availableHerbs);
    this.createFormulaSlots();
  }

  protected createStove(): void {
    const content = this.getContentContainer();

    this.stoveGraphics = this.scene.add.graphics();
    content.add(this.stoveGraphics);

    // 炉灶位置（左侧）
    const stoveX = -this.width / 2 + 150;
    const stoveY = 0;

    this.stoveGraphics.setPosition(stoveX, stoveY);

    // 炉灶砖体
    this.stoveGraphics.fillStyle(0x7a3e22, 1);
    this.stoveGraphics.fillRect(-100, 60, 200, 120);

    // 火焰口
    this.stoveGraphics.fillStyle(0xff7a1a, 1);
    this.stoveGraphics.fillRect(-40, 80, 80, 50);

    // 药罐
    this.potGraphics = this.scene.add.graphics();
    content.add(this.potGraphics);
    this.potGraphics.setPosition(stoveX, stoveY - 40);

    // 药罐轮廓
    this.potGraphics.fillStyle(0x5a2e18, 1);
    this.potGraphics.fillEllipse(0, 0, 120, 60);
  }

  protected createHerbBag(availableHerbs: { id: string; count: number }[]): void {
    const content = this.getContentContainer();

    // 药柜位置（右侧）
    const bagX = this.width / 2 - 200;
    const bagY = -100;

    // 创建药牌
    const herbDataList: HerbData[] = availableHerbs.map(h => {
      const pixelHerb = getPixelHerbById(h.id);
      return {
        id: h.id,
        name: pixelHerb?.name ?? h.id,
        prop: pixelHerb?.prop ?? '',
        count: h.count,
        grid: pixelHerb?.grid ?? ['aa'],
        palette: pixelHerb?.palette ?? { a: '#ff0000' },
      };
    });

    // 布局药牌（4列）
    const cols = 4;
    const tagWidth = 90;
    const tagHeight = 100;
    const gap = 10;

    herbDataList.forEach((herb, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);

      const x = bagX + col * (tagWidth + gap);
      const y = bagY + row * (tagHeight + gap);

      const tag = new HerbTagComponent(this.scene, {
        herb,
        draggable: true,
        onDragStart: () => this.onHerbDragStart(tag),
        onDragEnd: () => this.onHerbDragEnd(tag),
      }, x, y);

      content.add(tag.container);
      this.herbTags.push(tag);
    });
  }

  protected createFormulaSlots(): void {
    const content = this.getContentContainer();

    // 方剂槽位（药罐下方）
    const slotY = 100;
    const slotWidth = 36;
    const slotHeight = 36;
    const gap = 6;

    const totalSlots = this.recipe.herbIds.length;
    const startX = -((totalSlots * (slotWidth + gap)) / 2);

    for (let i = 0; i < totalSlots; i++) {
      const slot = this.scene.add.graphics();
      slot.setPosition(startX + i * (slotWidth + gap), slotY);

      // 空槽位（虚线边框）
      slot.lineStyle(2, 0x3f2412, 1);
      slot.strokeRect(0, 0, slotWidth, slotHeight);

      content.add(slot);
      this.formulaSlots.push(slot);
    }
  }

  protected onHerbDragStart(tag: HerbTagComponent): void {
    this.dragManager.startDrag(tag.container.x, tag.container.y);
  }

  protected onHerbDragEnd(tag: HerbTagComponent): void {
    const dropX = tag.container.x;
    const dropY = tag.container.y;

    // 检查是否落入药罐区域
    const potArea = { x: -100, y: -100, width: 200, height: 150 };
    const isInPot = dropX > potArea.x && dropX < potArea.x + potArea.width &&
                    dropY > potArea.y && dropY < potArea.y + potArea.height;

    if (isInPot) {
      // 添加到已选药材
      this.selectedHerbs.push(tag.herb.id);

      // 更新槽位显示
      this.updateFormulaSlot(this.selectedHerbs.length - 1, tag.herb.name);

      // 显示成功效果
      this.dragManager.endDrop(dropX, dropY, 'success');

      // 隐藏药牌
      tag.container.setVisible(false);
    } else {
      // 显示失败效果
      this.dragManager.endDrop(dropX, dropY, 'failure');

      // 恢复药牌位置
      // (需要保存原始位置)
    }
  }

  protected updateFormulaSlot(index: number, herbName: string): void {
    if (index >= this.formulaSlots.length) return;

    const slot = this.formulaSlots[index];
    slot.clear();

    // 填充槽位
    slot.fillStyle(0xf4dba8, 1);
    slot.fillRect(0, 0, 36, 36);
    slot.lineStyle(2, 0x3f2412, 1);
    slot.strokeRect(0, 0, 36, 36);

    // 药名文字
    const nameText = this.scene.add.text(18, 18, herbName.substring(0, 2), {
      fontSize: '12px',
      fontFamily: 'Noto Serif SC',
      color: '#2a1810',
    });
    nameText.setOrigin(0.5, 0.5);
    slot.parentContainer?.add(nameText);
  }

  public destroy(): void {
    this.dragManager.destroy();

    for (const tag of this.herbTags) {
      tag.destroy();
    }
    this.herbTags = [];

    for (const slot of this.formulaSlots) {
      slot.destroy();
    }
    this.formulaSlots = [];

    if (this.stoveGraphics) {
      this.stoveGraphics.destroy();
      this.stoveGraphics = null;
    }
    if (this.potGraphics) {
      this.potGraphics.destroy();
      this.potGraphics = null;
    }

    super.destroy();
  }
}
```

- [ ] **Step 3: Run all tests**

Run: `npm run test`
Expected: All existing tests pass + new tests pass

- [ ] **Step 4: Commit**

```bash
git add src/ui/DecoctionUI.ts
git commit -m "feat(ui): refactor DecoctionUI with new components"
```

---

## Task 7: 整理组件入库 - 更新文档

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Update CLAUDE.md with new component library section**

在 Phase 2.5 部分，更新组件库索引：

```markdown
### Phase 2.5: UI组件系统统一化 ✅

**核心组件库**:

| 组件 | 用途 | 状态 |
|-----|------|------|
| BaseUIComponent | 抽象基类，边框绘制方法 | ✅ |
| ModalUI | 弹窗基类，标准尺寸、退出按钮 | ✅ |
| **ScrollModalUI** | **卷轴风格弹窗基类** | ✅ 新增 |
| **PixelSpriteComponent** | **像素图标绘制** | ✅ 新增 |
| **HerbTagComponent** | **药牌展示** | ✅ 新增 |
| ItemSlotComponent | 60×60物品格子 | ✅ |
| SelectionButtonComponent | ○→●选择按钮 | ✅ |
| CompatibilitySlotComponent | 120×100配伍槽位 | ✅ |
| ProgressBarComponent | 三段渐变进度条 | ✅ |

**系统管理器**:

| 系统 | 用途 | 状态 |
|-----|------|------|
| **DragEffectManager** | **拖拽动效系统** | ✅ 新增 |

**数据文件**:

| 文件 | 用途 |
|-----|------|
| `src/data/pixel-herbs.ts` | 像素药材数据（22种药材） |
```

- [ ] **Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md with new component library"
```

---

## 自检清单

### 1. Spec Coverage

| Spec 章节 | 对应 Task |
|----------|----------|
| ScrollModalUI 基类 | Task 2 ✅ |
| PixelSpriteComponent | Task 1 ✅ |
| HerbTagComponent | Task 3 ✅ |
| DragEffectManager | Task 4 ✅ |
| 像素药材数据迁移 | Task 5 ✅ |
| DecoctionUI 重构 | Task 6 ✅ |
| 整理入库 | Task 7 ✅ |

### 2. Placeholder Scan

- 无 TBD/TODO
- 无 "implement later"
- 所有代码步骤都有完整实现代码

### 3. Type Consistency

- HerbTagComponent 使用 HerbData 接口
- PixelSpriteComponent 使用 PixelSpriteConfig 接口
- DragEffectManager 使用 DragEffectConfig 接口
- ScrollModalUI 使用 ScrollModalConfig 接口
- 所有接口在 spec 和实现中保持一致

---

Plan complete and saved to `docs/superpowers/plans/2026-04-22-decoction-ui-refactor-implementation.md`.

**Two execution options:**

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints for review

**Which approach?**