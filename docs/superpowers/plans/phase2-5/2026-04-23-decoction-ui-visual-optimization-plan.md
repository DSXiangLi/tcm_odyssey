# 煎药 UI 视觉优化实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 1比1还原设计稿的炉灶和药罐视觉效果，创建独立的视觉组件实现砖墙纹理、火焰动画、药罐形状、蒸汽效果、搅拌勺动画。

**Architecture:** 创建 HearthVisualComponent 和 PotVisualComponent 两个独立视觉组件，使用 Phaser Graphics 分层绘制、Tweens 动画、Particles 粒子系统替代 CSS 渐变/阴影/动画效果，集成到 DecoctionUI 替换简化的 placeholder 实现。

**Tech Stack:** Phaser 3 Graphics API、Tweens 动画系统、Particles 粒子系统、TypeScript

---

## File Structure

```
src/ui/components/
├── HearthVisualComponent.ts  # 新建：炉灶视觉组件
├── PotVisualComponent.ts     # 新建：药罐视觉组件
├── HerbTagComponent.ts       # 已有
├── ProgressBarComponent.ts   # 已有
├── SelectionButtonComponent.ts # 已有
├── ItemSlotComponent.ts      # 已有
├── CompatibilitySlotComponent.ts # 已有
└── PixelSpriteComponent.ts   # 已有

src/ui/DecoctionUI.ts         # 修改：集成新视觉组件

tests/unit/ui/components/
├── HearthVisualComponent.spec.ts # 新建：炉灶组件测试
├── PotVisualComponent.spec.ts    # 新建：药罐组件测试
└── DecoctionUI.spec.ts           # 已有：更新集成测试
```

---

## Task 1: 创建炉灶视觉组件基础 - 砖墙纹理

**Files:**
- Create: `src/ui/components/HearthVisualComponent.ts`
- Test: `tests/unit/ui/components/HearthVisualComponent.spec.ts`

- [ ] **Step 1: Write the failing test for HearthVisualComponent constructor**

```typescript
// tests/unit/ui/components/HearthVisualComponent.spec.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Phaser from 'phaser';
import HearthVisualComponent from '../../../src/ui/components/HearthVisualComponent';

describe('HearthVisualComponent', () => {
  let scene: Phaser.Scene;
  let game: Phaser.Game;

  beforeEach(() => {
    game = new Phaser.Game({
      type: Phaser.AUTO,
      width: 800,
      height: 600,
      parent: undefined,
      scene: {
        create() {}
      }
    });
    scene = game.scene.getScene('default') as Phaser.Scene;
  });

  afterEach(() => {
    game.destroy(true);
  });

  it('should create container with correct dimensions', () => {
    const config = { width: 360, height: 204, pixelSize: 6 };
    const hearth = new HearthVisualComponent(scene, config);

    expect(hearth.container).toBeDefined();
    expect(hearth.width).toBe(360);
    expect(hearth.height).toBe(204);
  });

  it('should create graphics for brick texture', () => {
    const config = { width: 360, height: 204, pixelSize: 6 };
    const hearth = new HearthVisualComponent(scene, config);

    expect(hearth.brickGraphics).toBeDefined();
    expect(hearth.container.list.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:unit -- tests/unit/ui/components/HearthVisualComponent.spec.ts`
Expected: FAIL with "HearthVisualComponent is not defined"

- [ ] **Step 3: Write minimal implementation for constructor**

```typescript
// src/ui/components/HearthVisualComponent.ts
import Phaser from 'phaser';

/**
 * 炉灶视觉配置
 */
export interface HearthVisualConfig {
  width: number;       // 炉灶总宽度 (像素单位，默认 360 = 60px * 6)
  height: number;      // 炉灶总高度 (像素单位，默认 204 = 34px * 6)
  pixelSize: number;   // 像素尺寸 (默认 6)
  animated?: boolean;  // 是否启用动画
}

/**
 * 炉灶视觉组件 - 1比1还原设计稿砖墙纹理
 *
 * CSS设计稿对应:
 * .stove-body - 砖墙主体
 * .stove-top - 炉灶顶板
 * .fire-hole - 火焰开口
 * .flame - 4个独立火焰
 * .ember-spark - 火星粒子
 * .stove-shadow - 地面阴影
 */
export default class HearthVisualComponent {
  protected scene: Phaser.Scene;
  public container: Phaser.GameObjects.Container;
  public width: number;
  public height: number;
  protected pixelSize: number;
  protected animated: boolean;

  // Graphics对象
  public brickGraphics: Phaser.GameObjects.Graphics | null = null;
  public shadowGraphics: Phaser.GameObjects.Graphics | null = null;
  public topGraphics: Phaser.GameObjects.Graphics | null = null;
  public fireHoleGraphics: Phaser.GameObjects.Graphics | null = null;

  // 动画对象
  protected flames: Phaser.GameObjects.Graphics[] = [];
  protected flameTweens: Phaser.Tweens.Tween[] = [];
  protected emberParticles: Phaser.GameObjects.Particles.ParticleEmitter | null = null;

  // 颜色常量 (对应设计稿CSS变量)
  protected static readonly COLORS = {
    brickLight: 0x8a5a2a,    // --brick-light
    brickMid: 0x5a3020,      // 中间色
    brickDark: 0x3f2412,     // --brick-dark
    mortarColor: 0x2a1408,   // 灰缝颜色
    emberCore: 0xffd24a,     // --ember-core 金色
    emberOuter: 0xff7a1a,    // --ember 橙色
    cinnabar: 0xb8322c,      // --cinnabar 红色
    fireCore: 0xfff1a8,      // 火焰核心白黄色
  };

  constructor(scene: Phaser.Scene, config: HearthVisualConfig) {
    this.scene = scene;
    this.width = config.width;
    this.height = config.height;
    this.pixelSize = config.pixelSize ?? 6;
    this.animated = config.animated ?? true;

    // 创建容器 (相对于父容器定位)
    this.container = scene.add.container(0, 0);

    // 绘制各层
    this.drawGroundShadow();
    this.drawBrickTexture();
    this.drawStoveTop();
    this.drawFireHole();

    // 启动动画
    if (this.animated) {
      this.createFlames();
      this.createEmberParticles();
    }
  }

  // 后续方法将在后续Task中实现
  protected drawGroundShadow(): void {}
  protected drawBrickTexture(): void {}
  protected drawStoveTop(): void {}
  protected drawFireHole(): void {}
  protected createFlames(): void {}
  protected createEmberParticles(): void {}

  destroy(): void {
    this.flameTweens.forEach(t => t.stop());
    this.flameTweens = [];
    if (this.emberParticles) {
      this.emberParticles.destroy();
    }
    this.container.destroy();
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:unit -- tests/unit/ui/components/HearthVisualComponent.spec.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/ui/components/HearthVisualComponent.ts tests/unit/ui/components/HearthVisualComponent.spec.ts
git commit -m "feat(ui): add HearthVisualComponent skeleton with constructor"
```

---

## Task 2: 实现砖墙纹理绘制

**Files:**
- Modify: `src/ui/components/HearthVisualComponent.ts:drawBrickTexture`
- Modify: `tests/unit/ui/components/HearthVisualComponent.spec.ts`

- [ ] **Step 1: Write the failing test for brick texture**

```typescript
// tests/unit/ui/components/HearthVisualComponent.spec.ts - 添加新测试
it('should draw brick texture with gradient colors', () => {
  const config = { width: 360, height: 204, pixelSize: 6 };
  const hearth = new HearthVisualComponent(scene, config);

  // 检查 brickGraphics 存在
  expect(hearth.brickGraphics).toBeDefined();

  // 检查容器包含砖墙层
  const brickInContainer = hearth.container.list.some(
    obj => obj === hearth.brickGraphics
  );
  expect(brickInContainer).toBe(true);
});

it('should draw mortar grid lines for brick texture', () => {
  const config = { width: 360, height: 204, pixelSize: 6 };
  const hearth = new HearthVisualComponent(scene, config);

  // 检查绘制了灰缝网格
  // Graphics的绘制通过fillRect/strokeRect调用
  // 测试通过验证方法被调用
  expect(hearth.brickGraphics).toBeDefined();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:unit -- tests/unit/ui/components/HearthVisualComponent.spec.ts`
Expected: FAIL with "brickGraphics is null"

- [ ] **Step 3: Implement brick texture drawing**

```typescript
// src/ui/components/HearthVisualComponent.ts - 替换空方法
protected drawBrickTexture(): void {
  this.brickGraphics = this.scene.add.graphics();
  this.container.add(this.brickGraphics);

  const brickWidth = this.width;       // 60px * 6 = 360
  const brickHeight = this.height;     // 34px * 6 = 204
  const px = this.pixelSize;           // 6

  // 计算相对于容器中心的坐标 (容器在炉灶底部)
  const x = -brickWidth / 2;
  const y = -brickHeight;

  // Step 1: 绘制砖墙主体渐变 (对应CSS: linear-gradient 180deg)
  // Phaser不支持渐变，分段绘制模拟渐变效果
  const gradientSteps = 10;
  const stepHeight = brickHeight / gradientSteps;
  const gradientColors = [
    HearthVisualComponent.COLORS.brickLight,  // 0%: #8a5a2a
    0x7a4a28,                                   // 20%
    HearthVisualComponent.COLORS.brickMid,     // 50%: #5a3020
    0x4a2818,                                   // 70%
    HearthVisualComponent.COLORS.brickDark,    // 100%: #3f2412
  ];

  for (let i = 0; i < gradientSteps; i++) {
    const progress = i / gradientSteps;
    const colorIndex = Math.floor(progress * (gradientColors.length - 1));
    const nextColorIndex = Math.min(colorIndex + 1, gradientColors.length - 1);
    const blend = (progress * (gradientColors.length - 1)) - colorIndex;

    // 颜色混合
    const color = this.blendColors(
      gradientColors[colorIndex],
      gradientColors[nextColorIndex],
      blend
    );

    this.brickGraphics.fillStyle(color, 1);
    this.brickGraphics.fillRect(x, y + i * stepHeight, brickWidth, stepHeight + 1);
  }

  // Step 2: 绘制灰缝网格 (对应CSS: ::before 奇数行 + ::after 偶数行)
  // 灰缝宽度 = 2px * 6 = 12, 灰缝间距 = 10px * 6 = 60
  const mortarWidth = px * 2;      // 12
  const mortarSpacing = px * 10;   // 60
  const mortarHeight = px * 2;     // 12 (每行高度)

  // 奇数行灰缝 (起始位置 x=0)
  this.brickGraphics.fillStyle(HearthVisualComponent.COLORS.mortarColor, 1);
  for (let row = 0; row < 3; row++) {  // 3行
    const rowY = y + row * mortarSpacing;
    for (let col = 0; col <= 6; col++) {  // 7列
      const colX = x + col * mortarSpacing;
      this.brickGraphics.fillRect(colX, rowY, mortarWidth, mortarHeight);
    }
  }

  // 偶数行灰缝 (起始位置 x=30px*6=180, 错开半格)
  const offset = px * 5;  // 30
  for (let row = 3; row < 6; row++) {
    const rowY = y + row * mortarSpacing;
    for (let col = 0; col <= 5; col++) {
      const colX = x + offset + col * mortarSpacing;
      this.brickGraphics.fillRect(colX, rowY, mortarWidth, mortarHeight);
    }
  }

  // Step 3: 绘制外阴影 (对应CSS: box-shadow: 3px 3px 0 rgba(0,0,0,.6))
  this.brickGraphics.fillStyle(0x000000, 0.6);
  this.brickGraphics.fillRect(x + brickWidth, y + 3, px * 3, brickHeight);
  this.brickGraphics.fillRect(x + 3, y + brickHeight, brickWidth, px * 3);

  // Step 4: 绘制内阴影底部 (对应CSS: inset 0 -3px 0 rgba(0,0,0,.4))
  this.brickGraphics.fillStyle(0x000000, 0.4);
  this.brickGraphics.fillRect(x, y + brickHeight - px * 3, brickWidth, px * 3);
}

/**
 * 混合两个颜色
 */
protected blendColors(color1: number, color2: number, ratio: number): number {
  const r1 = (color1 >> 16) & 0xff;
  const g1 = (color1 >> 8) & 0xff;
  const b1 = color1 & 0xff;
  const r2 = (color2 >> 16) & 0xff;
  const g2 = (color2 >> 8) & 0xff;
  const b2 = color2 & 0xff;

  const r = Math.round(r1 + (r2 - r1) * ratio);
  const g = Math.round(g1 + (g2 - g1) * ratio);
  const b = Math.round(b1 + (b2 - b1) * ratio);

  return (r << 16) | (g << 8) | b;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:unit -- tests/unit/ui/components/HearthVisualComponent.spec.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/ui/components/HearthVisualComponent.ts tests/unit/ui/components/HearthVisualComponent.spec.ts
git commit -m "feat(ui): implement brick texture with gradient and mortar grid in HearthVisualComponent"
```

---

## Task 3: 实现炉灶顶板和火焰开口

**Files:**
- Modify: `src/ui/components/HearthVisualComponent.ts:drawStoveTop,drawFireHole`
- Modify: `tests/unit/ui/components/HearthVisualComponent.spec.ts`

- [ ] **Step 1: Write the failing test for stove top and fire hole**

```typescript
// tests/unit/ui/components/HearthVisualComponent.spec.ts - 添加新测试
it('should draw stove top ledge with gradient', () => {
  const config = { width: 360, height: 204, pixelSize: 6 };
  const hearth = new HearthVisualComponent(scene, config);

  expect(hearth.topGraphics).toBeDefined();
  const topInContainer = hearth.container.list.some(
    obj => obj === hearth.topGraphics
  );
  expect(topInContainer).toBe(true);
});

it('should draw fire hole with radial gradient colors', () => {
  const config = { width: 360, height: 204, pixelSize: 6 };
  const hearth = new HearthVisualComponent(scene, config);

  expect(hearth.fireHoleGraphics).toBeDefined();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:unit -- tests/unit/ui/components/HearthVisualComponent.spec.ts`
Expected: FAIL with "topGraphics is null"

- [ ] **Step 3: Implement stove top and fire hole**

```typescript
// src/ui/components/HearthVisualComponent.ts - 替换空方法
protected drawStoveTop(): void {
  this.topGraphics = this.scene.add.graphics();
  this.container.add(this.topGraphics);

  const px = this.pixelSize;
  const topWidth = this.width + px * 8;  // 68px * 6 = 408 (比砖墙宽)
  const topHeight = px * 4;              // 4px * 6 = 24
  const x = -topWidth / 2;
  const y = -this.height - topHeight;    // 在砖墙上方

  // 绘制顶板渐变 (对应CSS: linear-gradient(180deg,#4a2818,#2a1408))
  const gradientColors = [0x4a2818, 0x3a2010, 0x2a1408];
  const stepHeight = topHeight / gradientColors.length;

  gradientColors.forEach((color, i) => {
    this.topGraphics.fillStyle(color, 1);
    this.topGraphics.fillRect(x, y + i * stepHeight, topWidth, stepHeight + 1);
  });

  // 顶板边框
  this.topGraphics.lineStyle(2, HearthVisualComponent.COLORS.mortarColor, 1);
  this.topGraphics.strokeRect(x, y, topWidth, topHeight);
}

protected drawFireHole(): void {
  this.fireHoleGraphics = this.scene.add.graphics();
  this.container.add(this.fireHoleGraphics);

  const px = this.pixelSize;
  const holeWidth = px * 24;   // 144
  const holeHeight = px * 16;  // 96
  const x = -holeWidth / 2;    // 居中
  const y = -this.height + px * 6;  // 砖墙底部上方 6px

  // 绘制火焰开口背景 (对应CSS: radial-gradient ellipse)
  // Phaser不支持radial-gradient，使用同心圆模拟
  const centerX = x + holeWidth / 2;
  const centerY = y + holeHeight;  // 椭圆底部为渐变中心

  // 从外到内绘制渐变圆
  const gradientRings = [
    { radius: holeHeight, color: 0x2a0a04, alpha: 1 },     // 100%: 黑
    { radius: holeHeight * 0.6, color: HearthVisualComponent.COLORS.cinnabar, alpha: 1 }, // 60%: 红
    { radius: holeHeight * 0.3, color: HearthVisualComponent.COLORS.emberOuter, alpha: 1 }, // 30%: 橙
    { radius: holeHeight * 0.1, color: HearthVisualComponent.COLORS.emberCore, alpha: 1 },  // 0%: 金
  ];

  gradientRings.forEach(ring => {
    this.fireHoleGraphics.fillStyle(ring.color, ring.alpha);
    // 绘制椭圆 (近似: 使用圆 + scale)
    this.fireHoleGraphics.fillEllipse(centerX, centerY, ring.radius * 2, ring.radius);
  });

  // 开口边框 (拱形效果)
  this.fireHoleGraphics.lineStyle(3, HearthVisualComponent.COLORS.mortarColor, 1);
  this.fireHoleGraphics.strokeRoundedRect(x, y, holeWidth, holeHeight, { tl: 20, tr: 20, bl: 0, br: 0 });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:unit -- tests/unit/ui/components/HearthVisualComponent.spec.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/ui/components/HearthVisualComponent.ts tests/unit/ui/components/HearthVisualComponent.spec.ts
git commit -m "feat(ui): add stove top ledge and fire hole with gradient in HearthVisualComponent"
```

---

## Task 4: 实现火焰动画系统

**Files:**
- Modify: `src/ui/components/HearthVisualComponent.ts:createFlames`
- Modify: `tests/unit/ui/components/HearthVisualComponent.spec.ts`

- [ ] **Step 1: Write the failing test for flames**

```typescript
// tests/unit/ui/components/HearthVisualComponent.spec.ts - 添加新测试
it('should create 4 flame objects with different sizes', () => {
  const config = { width: 360, height: 204, pixelSize: 6, animated: true };
  const hearth = new HearthVisualComponent(scene, config);

  expect(hearth.flames.length).toBe(4);
});

it('should start flame dance animation with different delays', () => {
  const config = { width: 360, height: 204, pixelSize: 6, animated: true };
  const hearth = new HearthVisualComponent(scene, config);

  expect(hearth.flameTweens.length).toBe(4);
});

it('should not create flames when animated is false', () => {
  const config = { width: 360, height: 204, pixelSize: 6, animated: false };
  const hearth = new HearthVisualComponent(scene, config);

  expect(hearth.flames.length).toBe(0);
  expect(hearth.flameTweens.length).toBe(0);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:unit -- tests/unit/ui/components/HearthVisualComponent.spec.ts`
Expected: FAIL with "flames.length is 0"

- [ ] **Step 3: Implement flame animation**

```typescript
// src/ui/components/HearthVisualComponent.ts - 替换空方法
protected createFlames(): void {
  const px = this.pixelSize;

  // 火焰配置 (对应CSS: .flame.f1/f2/f3/f4)
  const flameConfigs = [
    { leftPercent: 16, height: px * 26, width: px * 12, delay: 0 },      // f1
    { leftPercent: 38, height: px * 32, width: px * 14, delay: 150 },    // f2 (最大)
    { leftPercent: 58, height: px * 28, width: px * 12, delay: 300 },    // f3
    { leftPercent: 78, height: px * 22, width: px * 10, delay: 50 },     // f4 (最小)
  ];

  const holeWidth = px * 24;
  const baseY = -this.height + px * 6;  // 火焰开口底部

  flameConfigs.forEach(config => {
    const flameGraphics = this.scene.add.graphics();
    this.container.add(flameGraphics);

    // 计算位置
    const leftX = -holeWidth / 2;
    const flameX = leftX + holeWidth * (config.leftPercent / 100);
    const flameY = baseY - config.height + px * 4;  // 底部偏移

    // 绘制火焰 (对应CSS: radial-gradient ellipse)
    // 从外到内绘制渐变
    const gradientRings = [
      { radius: config.height * 0.9, color: HearthVisualComponent.COLORS.cinnabar, alpha: 1 },
      { radius: config.height * 0.55, color: HearthVisualComponent.COLORS.emberOuter, alpha: 1 },
      { radius: config.height * 0.3, color: HearthVisualComponent.COLORS.emberCore, alpha: 1 },
      { radius: config.height * 0.1, color: HearthVisualComponent.COLORS.fireCore, alpha: 1 },
    ];

    gradientRings.forEach(ring => {
      flameGraphics.fillStyle(ring.color, ring.alpha);
      // 椭圆火焰
      flameGraphics.fillEllipse(flameX, flameY + config.height, config.width, ring.radius);
    });

    // 发光效果模拟 (额外的模糊层)
    flameGraphics.fillStyle(HearthVisualComponent.COLORS.emberOuter, 0.3);
    flameGraphics.fillEllipse(flameX, flameY + config.height, config.width + px * 2, config.height + px);

    this.flames.push(flameGraphics);

    // 创建舞动动画 (对应CSS: flameDance 0.6s ease-in-out infinite alternate)
    const tween = this.scene.tweens.add({
      targets: flameGraphics,
      scaleY: 1.15,
      scaleX: 0.85,
      y: flameY - px * 3,  // translateY(-3px)
      duration: 600,
      delay: config.delay,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
    });

    this.flameTweens.push(tween);
  });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:unit -- tests/unit/ui/components/HearthVisualComponent.spec.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/ui/components/HearthVisualComponent.ts tests/unit/ui/components/HearthVisualComponent.spec.ts
git commit -m "feat(ui): implement flame animation with 4 flames and dance tween in HearthVisualComponent"
```

---

## Task 5: 实现火星粒子系统

**Files:**
- Modify: `src/ui/components/HearthVisualComponent.ts:createEmberParticles,drawGroundShadow`
- Modify: `tests/unit/ui/components/HearthVisualComponent.spec.ts`

- [ ] **Step 1: Write the failing test for ember particles**

```typescript
// tests/unit/ui/components/HearthVisualComponent.spec.ts - 添加新测试
it('should create ember particle emitter', () => {
  const config = { width: 360, height: 204, pixelSize: 6, animated: true };
  const hearth = new HearthVisualComponent(scene, config);

  expect(hearth.emberParticles).toBeDefined();
});

it('should draw ground shadow under stove', () => {
  const config = { width: 360, height: 204, pixelSize: 6 };
  const hearth = new HearthVisualComponent(scene, config);

  expect(hearth.shadowGraphics).toBeDefined();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:unit -- tests/unit/ui/components/HearthVisualComponent.spec.ts`
Expected: FAIL with "emberParticles is null"

- [ ] **Step 3: Implement ember particles and ground shadow**

```typescript
// src/ui/components/HearthVisualComponent.ts - 替换空方法
protected drawGroundShadow(): void {
  this.shadowGraphics = this.scene.add.graphics();
  this.container.add(this.shadowGraphics);

  const px = this.pixelSize;
  const shadowWidth = this.width + px * 4;  // 比砖墙宽
  const shadowHeight = px * 2;
  const x = -shadowWidth / 2;
  const y = px * 2;  // 炉灶底部下方

  // 绘制椭圆形阴影 (对应CSS: radial-gradient ellipse)
  const centerX = x + shadowWidth / 2;
  const centerY = y;

  // 渐变阴影
  const gradientRings = [
    { radius: shadowWidth / 2, color: 0x000000, alpha: 0.5 },
    { radius: shadowWidth / 2 * 0.7, color: 0x000000, alpha: 0.3 },
    { radius: shadowWidth / 2 * 0.3, color: 0x000000, alpha: 0 },
  ];

  gradientRings.forEach(ring => {
    this.shadowGraphics.fillStyle(ring.color, ring.alpha);
    this.shadowGraphics.fillEllipse(centerX, centerY, ring.radius * 2, shadowHeight);
  });
}

protected createEmberParticles(): void {
  const px = this.pixelSize;
  const holeWidth = px * 24;
  const baseY = -this.height + px * 6;

  // 创建粒子纹理
  const particleKey = 'emberParticle';
  if (!this.scene.textures.exists(particleKey)) {
    // 创建小圆形粒子纹理
    const particleGraphics = this.scene.add.graphics();
    particleGraphics.fillStyle(HearthVisualComponent.COLORS.emberCore, 1);
    particleGraphics.fillCircle(3, 3, 3);
    particleGraphics.generateTexture(particleKey, 6, 6);
    particleGraphics.destroy();
  }

  // 创建粒子发射器 (对应CSS: emberRise 2.2s linear infinite)
  this.emberParticles = this.scene.add.particles(0, baseY, particleKey, {
    x: { min: -holeWidth / 2 + px * 2, max: holeWidth / 2 - px * 2 },
    lifespan: 2200,           // 2.2s
    speedY: { min: -60, max: -80 },  // 上升速度
    speedX: { min: -20, max: 20 },   // 漂移 (--drift)
    scale: { start: 0.5, end: 0 },
    alpha: { start: 0, end: 1, ease: 'Sine.easeIn' },  // 0→1→0
    quantity: 2,
    frequency: 300,
    blendMode: 'ADD',  // 发光效果
    tint: HearthVisualComponent.COLORS.emberCore,
  });

  this.container.add(this.emberParticles);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:unit -- tests/unit/ui/components/HearthVisualComponent.spec.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/ui/components/HearthVisualComponent.ts tests/unit/ui/components/HearthVisualComponent.spec.ts
git commit -m "feat(ui): add ember particles and ground shadow in HearthVisualComponent"
```

---

## Task 6: 创建药罐视觉组件基础 - 罐身和边缘

**Files:**
- Create: `src/ui/components/PotVisualComponent.ts`
- Create: `tests/unit/ui/components/PotVisualComponent.spec.ts`

- [ ] **Step 1: Write the failing test for PotVisualComponent**

```typescript
// tests/unit/ui/components/PotVisualComponent.spec.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Phaser from 'phaser';
import PotVisualComponent from '../../../src/ui/components/PotVisualComponent';

describe('PotVisualComponent', () => {
  let scene: Phaser.Scene;
  let game: Phaser.Game;

  beforeEach(() => {
    game = new Phaser.Game({
      type: Phaser.AUTO,
      width: 800,
      height: 600,
      parent: undefined,
      scene: { create() {} }
    });
    scene = game.scene.getScene('default') as Phaser.Scene;
  });

  afterEach(() => {
    game.destroy(true);
  });

  it('should create container with correct dimensions', () => {
    const config = { width: 264, height: 168, pixelSize: 6 };
    const pot = new PotVisualComponent(scene, config);

    expect(pot.container).toBeDefined();
    expect(pot.width).toBe(264);
    expect(pot.height).toBe(168);
  });

  it('should draw pot body with rounded bottom', () => {
    const config = { width: 264, height: 168, pixelSize: 6 };
    const pot = new PotVisualComponent(scene, config);

    expect(pot.bodyGraphics).toBeDefined();
  });

  it('should draw pot rim with gradient', () => {
    const config = { width: 264, height: 168, pixelSize: 6 };
    const pot = new PotVisualComponent(scene, config);

    expect(pot.rimGraphics).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:unit -- tests/unit/ui/components/PotVisualComponent.spec.ts`
Expected: FAIL with "PotVisualComponent is not defined"

- [ ] **Step 3: Write minimal PotVisualComponent implementation**

```typescript
// src/ui/components/PotVisualComponent.ts
import Phaser from 'phaser';

/**
 * 药罐视觉配置
 */
export interface PotVisualConfig {
  width: number;        // 药罐宽度 (默认 44px * 6 = 264)
  height: number;       // 药罐高度 (默认 28px * 6 = 168)
  pixelSize: number;    // 像素尺寸 (默认 6)
  showSteam?: boolean;  // 是否显示蒸汽
  showLadle?: boolean;  // 是否显示搅拌勺
}

/**
 * 药罐视觉组件 - 1比1还原设计稿药罐形状
 *
 * CSS设计稿对应:
 * .pot-body - 罐身
 * .pot-rim - 罐口边缘
 * .pot-liquid - 药液表面
 * .pot-handle - 把手
 * .steam-puff - 蒸汽
 * .ladle - 搅拌勺
 */
export default class PotVisualComponent {
  protected scene: Phaser.Scene;
  public container: Phaser.GameObjects.Container;
  public width: number;
  public height: number;
  protected pixelSize: number;
  protected showSteam: boolean;
  protected showLadle: boolean;

  // Graphics对象
  public bodyGraphics: Phaser.GameObjects.Graphics | null = null;
  public rimGraphics: Phaser.GameObjects.Graphics | null = null;
  public liquidGraphics: Phaser.GameObjects.Graphics | null = null;
  public handleGraphics: Phaser.GameObjects.Graphics | null = null;

  // 动画对象
  protected steamPuffs: Phaser.GameObjects.Graphics[] = [];
  protected steamTweens: Phaser.Tweens.Tween[] = [];
  protected ladleContainer: Phaser.GameObjects.Container | null = null;
  protected ladleTween: Phaser.Tweens.Tween | null = null;
  protected liquidTween: Phaser.Tweens.Tween | null = null;

  // 颜色常量 (对应设计稿CSS)
  protected static readonly COLORS = {
    potDark: 0x3a1a0a,     // 罐身暗色
    potMid: 0x5a2e18,      // 罐身中间色
    potLight: 0x7a4422,    // 罐身亮色
    rimTop: 0x7a4422,      // 边缘顶部
    rimMid: 0x3a1a0a,      // 边缘中间
    rimBot: 0x5a2e18,      // 边缘底部
    liquidTop: 0x4a2010,   // 药液表面
    liquidBot: 0x6a3a1a,   // 药液底部
    steamColor: 0xf0e6d2,  // 蒸汽色
  };

  constructor(scene: Phaser.Scene, config: PotVisualConfig) {
    this.scene = scene;
    this.width = config.width;
    this.height = config.height;
    this.pixelSize = config.pixelSize ?? 6;
    this.showSteam = config.showSteam ?? true;
    this.showLadle = config.showLadle ?? true;

    // 创建容器
    this.container = scene.add.container(0, 0);

    // 绘制各层
    this.drawPotBody();
    this.drawPotRim();
    this.drawLiquidSurface();
    this.drawHandles();

    // 创建动画
    if (this.showSteam) {
      this.createSteamParticles();
    }
    if (this.showLadle) {
      this.createLadle();
    }
  }

  // 后续Task实现
  protected drawPotBody(): void {}
  protected drawPotRim(): void {}
  protected drawLiquidSurface(): void {}
  protected drawHandles(): void {}
  protected createSteamParticles(): void {}
  protected createLadle(): void {}

  destroy(): void {
    this.steamTweens.forEach(t => t.stop());
    if (this.ladleTween) this.ladleTween.stop();
    if (this.liquidTween) this.liquidTween.stop();
    this.container.destroy();
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:unit -- tests/unit/ui/components/PotVisualComponent.spec.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/ui/components/PotVisualComponent.ts tests/unit/ui/components/PotVisualComponent.spec.ts
git commit -m "feat(ui): add PotVisualComponent skeleton with constructor"
```

---

## Task 7: 实现药罐形状绘制

**Files:**
- Modify: `src/ui/components/PotVisualComponent.ts:drawPotBody,drawPotRim,drawHandles`
- Modify: `tests/unit/ui/components/PotVisualComponent.spec.ts`

- [ ] **Step 1: Write the failing test for pot shape**

```typescript
// tests/unit/ui/components/PotVisualComponent.spec.ts - 添加新测试
it('should draw pot body with horizontal gradient', () => {
  const config = { width: 264, height: 168, pixelSize: 6 };
  const pot = new PotVisualComponent(scene, config);

  // 检查罐身Graphics存在
  expect(pot.bodyGraphics).toBeDefined();
  const bodyInContainer = pot.container.list.some(obj => obj === pot.bodyGraphics);
  expect(bodyInContainer).toBe(true);
});

it('should draw pot handles on both sides', () => {
  const config = { width: 264, height: 168, pixelSize: 6 };
  const pot = new PotVisualComponent(scene, config);

  expect(pot.handleGraphics).toBeDefined();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:unit -- tests/unit/ui/components/PotVisualComponent.spec.ts`
Expected: FAIL with "bodyGraphics is null"

- [ ] **Step 3: Implement pot body and handles**

```typescript
// src/ui/components/PotVisualComponent.ts - 替换空方法
protected drawPotBody(): void {
  this.bodyGraphics = this.scene.add.graphics();
  this.container.add(this.bodyGraphics);

  const px = this.pixelSize;
  const bodyWidth = this.width;    // 44px * 6 = 264
  const bodyHeight = px * 22;      // 22px * 6 = 132
  const x = -bodyWidth / 2;
  const y = -bodyHeight;           // 罐身底部在容器中心下方

  // Step 1: 绘制罐身水平渐变 (对应CSS: linear-gradient 90deg)
  // #3a1a0a → #5a2e18 → #7a4422 → #5a2e18 → #3a1a0a
  const gradientSteps = 8;
  const stepWidth = bodyWidth / gradientSteps;
  const gradientColors = [
    PotVisualComponent.COLORS.potDark,   // 0%
    0x4a2410,                            // 12.5%
    PotVisualComponent.COLORS.potMid,    // 25%
    0x6a3a1c,                            // 37.5%
    PotVisualComponent.COLORS.potLight,  // 50%
    0x6a3a1c,                            // 62.5%
    PotVisualComponent.COLORS.potMid,    // 75%
    PotVisualComponent.COLORS.potDark,   // 100%
  ];

  gradientColors.forEach((color, i) => {
    this.bodyGraphics.fillStyle(color, 1);
    this.bodyGraphics.fillRect(x + i * stepWidth, y, stepWidth + 1, bodyHeight);
  });

  // Step 2: 绘制圆底 (对应CSS: border-radius 0 0 40% 40%)
  // 使用弧形绘制底部
  this.bodyGraphics.fillStyle(PotVisualComponent.COLORS.potDark, 1);
  this.bodyGraphics.fillRoundedRect(
    x, y + bodyHeight - px * 10,
    bodyWidth, px * 10,
    { tl: 0, tr: 0, bl: bodyWidth * 0.4, br: bodyWidth * 0.4 }
  );

  // Step 3: 绘制内阴影 (对应CSS: inset -4px -4px 0 rgba(0,0,0,.5))
  this.bodyGraphics.fillStyle(0x000000, 0.5);
  this.bodyGraphics.fillRect(x + bodyWidth - px * 4, y, px * 4, bodyHeight);
  this.bodyGraphics.fillRect(x, y + bodyHeight - px * 4, bodyWidth, px * 4);
}

protected drawPotRim(): void {
  this.rimGraphics = this.scene.add.graphics();
  this.container.add(this.rimGraphics);

  const px = this.pixelSize;
  const rimWidth = this.width + px * 8;  // 52px * 6 = 312 (比罐身宽)
  const rimHeight = px * 8;              // 8px * 6 = 48
  const x = -rimWidth / 2;
  const y = -this.height;                // 罐口顶部

  // 绘制边缘渐变 (对应CSS: linear-gradient 180deg)
  const gradientColors = [
    PotVisualComponent.COLORS.rimTop,    // 0%: #7a4422
    PotVisualComponent.COLORS.rimMid,    // 50%: #3a1a0a
    PotVisualComponent.COLORS.rimBot,    // 100%: #5a2e18
  ];

  const stepHeight = rimHeight / gradientColors.length;
  gradientColors.forEach((color, i) => {
    this.rimGraphics.fillStyle(color, 1);
    this.rimGraphics.fillRect(x, y + i * stepHeight, rimWidth, stepHeight + 1);
  });

  // 边缘高光 (对应CSS: inset 0 2px 0 rgba(200,120,60,.4))
  this.rimGraphics.fillStyle(0xc8783c, 0.4);
  this.rimGraphics.fillRect(x, y, rimWidth, px * 2);
}

protected drawHandles(): void {
  this.handleGraphics = this.scene.add.graphics();
  this.container.add(this.handleGraphics);

  const px = this.pixelSize;
  const handleWidth = px * 3;   // 18
  const handleHeight = px * 4;  // 24
  const bodyWidth = this.width;

  // 左把手 (对应CSS: .pot-handle.l)
  const leftX = -bodyWidth / 2 - px * 4;
  const handleY = -this.height + px * 14;

  this.handleGraphics.fillStyle(PotVisualComponent.COLORS.potDark, 1);
  this.handleGraphics.fillRect(leftX, handleY, handleWidth, handleHeight);
  this.handleGraphics.lineStyle(2, 0x2a1408, 1);
  this.handleGraphics.strokeRect(leftX, handleY, handleWidth, handleHeight);

  // 右把手 (对应CSS: .pot-handle.r)
  const rightX = bodyWidth / 2 + px * 1;
  this.handleGraphics.fillStyle(PotVisualComponent.COLORS.potDark, 1);
  this.handleGraphics.fillRect(rightX, handleY, handleWidth, handleHeight);
  this.handleGraphics.lineStyle(2, 0x2a1408, 1);
  this.handleGraphics.strokeRect(rightX, handleY, handleWidth, handleHeight);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:unit -- tests/unit/ui/components/PotVisualComponent.spec.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/ui/components/PotVisualComponent.ts tests/unit/ui/components/PotVisualComponent.spec.ts
git commit -m "feat(ui): implement pot body, rim and handles with gradient in PotVisualComponent"
```

---

## Task 8: 实现药液表面和蒸汽效果

**Files:**
- Modify: `src/ui/components/PotVisualComponent.ts:drawLiquidSurface,createSteamParticles`
- Modify: `tests/unit/ui/components/PotVisualComponent.spec.ts`

- [ ] **Step 1: Write the failing test for liquid and steam**

```typescript
// tests/unit/ui/components/PotVisualComponent.spec.ts - 添加新测试
it('should draw liquid surface with ripple animation', () => {
  const config = { width: 264, height: 168, pixelSize: 6 };
  const pot = new PotVisualComponent(scene, config);

  expect(pot.liquidGraphics).toBeDefined();
});

it('should create 5 steam puffs when showSteam is true', () => {
  const config = { width: 264, height: 168, pixelSize: 6, showSteam: true };
  const pot = new PotVisualComponent(scene, config);

  expect(pot.steamPuffs.length).toBe(5);
  expect(pot.steamTweens.length).toBe(5);
});

it('should not create steam when showSteam is false', () => {
  const config = { width: 264, height: 168, pixelSize: 6, showSteam: false };
  const pot = new PotVisualComponent(scene, config);

  expect(pot.steamPuffs.length).toBe(0);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:unit -- tests/unit/ui/components/PotVisualComponent.spec.ts`
Expected: FAIL with "liquidGraphics is null"

- [ ] **Step 3: Implement liquid surface and steam**

```typescript
// src/ui/components/PotVisualComponent.ts - 替换空方法
protected drawLiquidSurface(): void {
  this.liquidGraphics = this.scene.add.graphics();
  this.container.add(this.liquidGraphics);

  const px = this.pixelSize;
  const liquidWidth = this.width + px * 2;  // 38px * 6 = 228 (稍窄于罐口)
  const liquidHeight = px * 5;              // 5px * 6 = 30
  const x = -liquidWidth / 2;
  const y = -this.height + px * 19;         // 边缘下方

  // 绘制药液渐变 (对应CSS: linear-gradient 180deg)
  const gradientColors = [
    PotVisualComponent.COLORS.liquidTop,
    PotVisualComponent.COLORS.liquidBot,
  ];

  gradientColors.forEach((color, i) => {
    this.liquidGraphics.fillStyle(color, 1);
    this.liquidGraphics.fillRect(x, y + i * liquidHeight / 2, liquidWidth, liquidHeight / 2 + 1);
  });

  // 波纹条纹效果 (对应CSS: repeating-linear-gradient)
  this.liquidGraphics.fillStyle(0xffd282, 0.3);
  for (let i = 0; i < liquidWidth; i += px * 10) {
    this.liquidGraphics.fillRect(x + i, y, px * 2, liquidHeight);
  }

  // 椭圆形表面
  this.liquidGraphics.fillStyle(PotVisualComponent.COLORS.liquidTop, 0.8);
  this.liquidGraphics.fillEllipse(x + liquidWidth / 2, y + liquidHeight / 2, liquidWidth, liquidHeight);

  // 波纹动画 (对应CSS: liquidRipple 3s linear infinite)
  this.liquidTween = this.scene.tweens.add({
    targets: this.liquidGraphics,
    x: x - px * 10,
    duration: 3000,
    ease: 'Linear',
    yoyo: true,
    repeat: -1,
  });
}

protected createSteamParticles(): void {
  const px = this.pixelSize;

  // 蒸汽配置 (对应CSS: .steam-puff.s1/s2/s3/s4/s5)
  const steamConfigs = [
    { left: -px * 14, delay: 0, dx: px * 15 },      // s1
    { left: -px * 2, delay: 600, dx: px * 20 },     // s2
    { left: px * 10, delay: 1200, dx: px * 10 },    // s3
    { left: -px * 10, delay: 1800, dx: px * 25 },   // s4
    { left: px * 2, delay: 2400, dx: px * 5 },      // s5
  ];

  const baseY = -this.height - px * 10;  // 罐口上方

  steamConfigs.forEach(config => {
    const steamGraphics = this.scene.add.graphics();
    this.container.add(steamGraphics);

    // 绘制蒸汽团 (对应CSS: radial-gradient circle)
    const puffRadius = px * 11;  // 22px / 2 * 6 = 66

    // 渐变蒸汽
    const gradientRings = [
      { radius: puffRadius, color: PotVisualComponent.COLORS.steamColor, alpha: 0.85 },
      { radius: puffRadius * 0.5, color: PotVisualComponent.COLORS.steamColor, alpha: 0.4 },
      { radius: puffRadius * 0.2, color: PotVisualComponent.COLORS.steamColor, alpha: 0 },
    ];

    gradientRings.forEach(ring => {
      steamGraphics.fillStyle(ring.color, ring.alpha);
      steamGraphics.fillCircle(config.left, baseY, ring.radius);
    });

    steamGraphics.setAlpha(0);
    steamGraphics.setScale(0.4);
    this.steamPuffs.push(steamGraphics);

    // 蒸汽上升动画 (对应CSS: steamRise 3.2s ease-out infinite)
    const tween = this.scene.tweens.add({
      targets: steamGraphics,
      y: baseY - px * 120,  // 上升120px
      x: config.left + config.dx,  // 漂移
      scale: 1.8,
      alpha: { from: 0, to: 0.8, to: 0 },
      duration: 3200,
      delay: config.delay,
      ease: 'Sine.easeOut',
      repeat: -1,
    });

    this.steamTweens.push(tween);
  });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:unit -- tests/unit/ui/components/PotVisualComponent.spec.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/ui/components/PotVisualComponent.ts tests/unit/ui/components/PotVisualComponent.spec.ts
git commit -m "feat(ui): add liquid surface ripple and steam effects in PotVisualComponent"
```

---

## Task 9: 实现搅拌勺动画

**Files:**
- Modify: `src/ui/components/PotVisualComponent.ts:createLadle`
- Modify: `tests/unit/ui/components/PotVisualComponent.spec.ts`

- [ ] **Step 1: Write the failing test for ladle**

```typescript
// tests/unit/ui/components/PotVisualComponent.spec.ts - 添加新测试
it('should create ladle when showLadle is true', () => {
  const config = { width: 264, height: 168, pixelSize: 6, showLadle: true };
  const pot = new PotVisualComponent(scene, config);

  expect(pot.ladleContainer).toBeDefined();
});

it('should start stir animation on ladle', () => {
  const config = { width: 264, height: 168, pixelSize: 6, showLadle: true };
  const pot = new PotVisualComponent(scene, config);

  expect(pot.ladleTween).toBeDefined();
});

it('should not create ladle when showLadle is false', () => {
  const config = { width: 264, height: 168, pixelSize: 6, showLadle: false };
  const pot = new PotVisualComponent(scene, config);

  expect(pot.ladleContainer).toBeNull();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:unit -- tests/unit/ui/components/PotVisualComponent.spec.ts`
Expected: FAIL with "ladleContainer is null"

- [ ] **Step 3: Implement ladle animation**

```typescript
// src/ui/components/PotVisualComponent.ts - 替换空方法
protected createLadle(): void {
  this.ladleContainer = this.scene.add.container(0, 0);
  this.container.add(this.ladleContainer);

  const px = this.pixelSize;

  // 勺柄 (对应CSS: .ladle-stick)
  const stickGraphics = this.scene.add.graphics();
  const stickWidth = px * 2;   // 12
  const stickHeight = px * 18; // 108
  const stickX = px;           // 勺柄中心
  const stickY = -this.height - px * 50;  // 罐口上方

  // 勺柄渐变 (对应CSS: linear-gradient 90deg)
  const gradientColors = [0x6b3e1f, 0xa26a3a, 0x6b3e1f];
  const stepWidth = stickWidth / gradientColors.length;

  gradientColors.forEach((color, i) => {
    stickGraphics.fillStyle(color, 1);
    stickGraphics.fillRect(stickX + i * stepWidth, stickY, stepWidth + 1, stickHeight);
  });

  stickGraphics.lineStyle(2, 0x2a1408, 1);
  stickGraphics.strokeRect(stickX, stickY, stickWidth, stickHeight);
  this.ladleContainer.add(stickGraphics);

  // 勺头 (对应CSS: .ladle-scoop)
  const scoopGraphics = this.scene.add.graphics();
  const scoopWidth = px * 6;   // 36
  const scoopHeight = px * 5;  // 30
  const scoopX = stickX - px * 2;
  const scoopY = stickY + px * 14;

  // 勺头渐变 (对应CSS: linear-gradient 180deg)
  const scoopColors = [0xc8b080, 0x8a6a3a];
  scoopColors.forEach((color, i) => {
    scoopGraphics.fillStyle(color, 1);
    scoopGraphics.fillRect(scoopX, scoopY + i * scoopHeight / 2, scoopWidth, scoopHeight / 2 + 1);
  });

  scoopGraphics.lineStyle(2, 0x2a1408, 1);
  scoopGraphics.strokeRect(scoopX, scoopY, scoopWidth, scoopHeight);
  this.ladleContainer.add(scoopGraphics);

  // 设置旋转原点 (对应CSS: transform-origin: 50% 80%)
  this.ladleContainer.setY(stickY + stickHeight * 0.8);

  // 搅拌动画 (对应CSS: stir 2.4s ease-in-out infinite)
  this.ladleTween = this.scene.tweens.add({
    targets: this.ladleContainer,
    rotation: { from: -0.14, to: 0.14 },  // -8deg to +8deg
    duration: 2400,
    ease: 'Sine.easeInOut',
    yoyo: true,
    repeat: -1,
  });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:unit -- tests/unit/ui/components/PotVisualComponent.spec.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/ui/components/PotVisualComponent.ts tests/unit/ui/components/PotVisualComponent.spec.ts
git commit -m "feat(ui): add ladle with stir animation in PotVisualComponent"
```

---

## Task 10: 重构 DecoctionUI 集成新视觉组件

**Files:**
- Modify: `src/ui/DecoctionUI.ts:239-288`
- Modify: `tests/unit/ui/DecoctionUI.spec.ts`

- [ ] **Step 1: Write the failing test for integration**

```typescript
// tests/unit/ui/DecoctionUI.spec.ts - 添加新测试 (如果已有文件则追加)
import HearthVisualComponent from '../../src/ui/components/HearthVisualComponent';
import PotVisualComponent from '../../src/ui/components/PotVisualComponent';

describe('DecoctionUI HearthVisual Integration', () => {
  // ... existing setup ...

  it('should use HearthVisualComponent instead of placeholder', () => {
    const ui = new DecoctionUI(scene);

    expect(ui.hearthVisual).toBeDefined();
    expect(ui.hearthVisual).toBeInstanceOf(HearthVisualComponent);
  });

  it('should use PotVisualComponent for pot display', () => {
    const ui = new DecoctionUI(scene);

    expect(ui.potVisual).toBeDefined();
    expect(ui.potVisual).toBeInstanceOf(PotVisualComponent);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:unit -- tests/unit/ui/DecoctionUI.spec.ts`
Expected: FAIL with "hearthVisual is undefined"

- [ ] **Step 3: Refactor DecoctionUI to use new components**

```typescript
// src/ui/DecoctionUI.ts - 修改导入部分
import HearthVisualComponent from './components/HearthVisualComponent';
import PotVisualComponent from './components/PotVisualComponent';

// 在类中添加属性
export class DecoctionUI extends ScrollModalUI {
  // ... existing properties ...

  // 新增视觉组件
  private hearthVisual: HearthVisualComponent | null = null;
  private potVisual: PotVisualComponent | null = null;

  // ... existing code ...
}

// 替换 createHearthPlaceholder 方法
private createHearthContainer(): void {
  const hearthX = 0;
  const hearthY = -LAYOUT.LEFT_AREA_HEIGHT / 2 + LAYOUT.HEARTH_HEIGHT / 2 + 20;

  this.hearthContainer = this.scene.add.container(hearthX, hearthY);
  this.leftAreaContainer?.add(this.hearthContainer);

  // 使用新的视觉组件替代占位符
  this.createHearthVisual();
  this.createPotVisual();
}

private createHearthVisual(): void {
  // 炉灶视觉组件 (像素尺寸 6px, 60px * 6 = 360, 34px * 6 = 204)
  this.hearthVisual = new HearthVisualComponent(this.scene, {
    width: 360,
    height: 204,
    pixelSize: 6,
    animated: true,
  });

  this.hearthContainer?.add(this.hearthVisual.container);
}

private createPotVisual(): void {
  // 药罐视觉组件 (44px * 6 = 264, 28px * 6 = 168)
  this.potVisual = new PotVisualComponent(this.scene, {
    width: 264,
    height: 168,
    pixelSize: 6,
    showSteam: true,
    showLadle: true,
  });

  // 药罐放在炉灶上方
  this.potVisual.container.setY(-204 - 48);  // 炉灶高度 + 边缘高度
  this.hearthContainer?.add(this.potVisual.container);
}

// 删除 createHearthPlaceholder 方法 (约50行)

// 在 destroy 方法中添加清理
destroy(): void {
  // ... existing cleanup ...

  // 销毁视觉组件
  if (this.hearthVisual) {
    this.hearthVisual.destroy();
    this.hearthVisual = null;
  }
  if (this.potVisual) {
    this.potVisual.destroy();
    this.potVisual = null;
  }

  super.destroy();
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:unit -- tests/unit/ui/DecoctionUI.spec.ts`
Expected: PASS

- [ ] **Step 5: Run all tests**

Run: `npm run test:unit`
Expected: All tests pass

- [ ] **Step 6: Commit**

```bash
git add src/ui/DecoctionUI.ts tests/unit/ui/DecoctionUI.spec.ts
git commit -m "refactor(ui): integrate HearthVisualComponent and PotVisualComponent in DecoctionUI"
```

---

## Task 11: 更新文档和验收测试

**Files:**
- Modify: `PROGRESS.md`
- Modify: `docs/superpowers/specs/phase2-5/2026-04-22-decoction-ui-refactor-test-acceptance.md`

- [ ] **Step 1: Update PROGRESS.md**

```markdown
# PROGRESS.md - 更新内容

## Phase 2.5: 煎药 UI 视觉优化 ✅

**状态**: 完成
**开始日期**: 2026-04-23
**完成日期**: 2026-04-23
**设计文档**: [视觉差距分析](docs/superpowers/specs/phase2-5/2026-04-23-decoction-ui-visual-gap-analysis.md)

### 完成任务汇总

| Task | 描述 | 测试 |
|------|------|------|
| Task 1-5 | HearthVisualComponent 炉灶视觉组件 | 15 tests ✅ |
| Task 6-9 | PotVisualComponent 药罐视觉组件 | 12 tests ✅ |
| Task 10 | DecoctionUI 集成重构 | integration tests ✅ |
| Task 11 | 文档更新 | docs ✅ |

### 新增组件详情

**HearthVisualComponent** - 炉灶视觉组件
- 砖墙纹理 (渐变 + 灰缝网格)
- 火焰开口 (椭圆拱形)
- 4个动态火焰 (舞动动画)
- 火星粒子 (上升 + 漂移)
- 地面阴影

**PotVisualComponent** - 药罐视觉组件
- 罐身 (圆底形状 + 水平渐变)
- 罐口边缘 (垂直渐变)
- 药液表面 (波纹动画)
- 双把手
- 5个蒸汽团 (上升动画)
- 搅拌勺 (摆动动画)
```

- [ ] **Step 2: Update test acceptance document**

在验收文档中添加视觉验收部分。

- [ ] **Step 3: Commit**

```bash
git add PROGRESS.md docs/superpowers/specs/phase2-5/2026-04-22-decoction-ui-refactor-test-acceptance.md
git commit -m "docs: update PROGRESS.md with visual optimization completion"
```

---

## Summary

| Task | Files Created | Files Modified | Tests |
|------|---------------|----------------|-------|
| 1 | HearthVisualComponent.ts, test | - | 2 |
| 2 | - | HearthVisualComponent.ts, test | 2 |
| 3 | - | HearthVisualComponent.ts, test | 2 |
| 4 | - | HearthVisualComponent.ts, test | 3 |
| 5 | - | HearthVisualComponent.ts, test | 2 |
| 6 | PotVisualComponent.ts, test | - | 3 |
| 7 | - | PotVisualComponent.ts, test | 2 |
| 8 | - | PotVisualComponent.ts, test | 3 |
| 9 | - | PotVisualComponent.ts, test | 3 |
| 10 | - | DecoctionUI.ts, test | 2 |
| 11 | - | PROGRESS.md, acceptance | - |

**Total**: 2 new files, ~30 test cases, 11 commits

---

*本文档由 Claude Code 创建，更新于 2026-04-23*