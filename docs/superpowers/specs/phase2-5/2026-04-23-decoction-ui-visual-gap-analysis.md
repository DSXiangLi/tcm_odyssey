# 煎药 UI 视觉差异对比与优化方案

**版本**: v1.0
**日期**: 2026-04-23
**状态**: 视觉优化设计文档

---

## 1. 问题概述

**当前状态**: Phase 2.5 煎药小游戏 UI 重构已完成，但视觉呈现与设计稿存在显著差异。

**用户反馈**: "你基于设计实现的效果比我提供的设计稿要low好多么？比如你的锅根本看不出来是个锅？"

**根本原因**:
- 设计稿使用复杂CSS技术（渐变、阴影、动画）约500行代码
- 当前Phaser实现仅使用基础Graphics API约30行代码
- 简化实现导致视觉层次、细节、动态效果缺失

---

## 2. 详细对比分析

### 2.1 炉灶砖墙 (stove-body)

| 维度 | 设计稿 | 当前实现 | 差距 |
|-----|-------|---------|-----|
| **结构** | 多层背景叠加 + ::before + ::after伪元素 | 单层 fillRect | ❌ 完全缺失 |
| **砖块纹理** | `repeating-linear-gradient` 横向灰缝 | 无 | ❌ 完全缺失 |
| **灰缝网格** | 交错排列 (奇偶行不同位置) | 无 | ❌ 完全缺失 |
| **颜色渐变** | `linear-gradient(180deg, #8a5a2a, #5a3020)` | 单色 `SOFT_BROWN` | ❌ 缺失渐变 |
| **阴影效果** | `box-shadow: 3px 3px 0 rgba(0,0,0,.6)` | 无 | ❌ 缺失 |
| **内阴影** | `inset 0 -3px 0 rgba(0,0,0,.4)` | 无 | ❌ 缺失 |

**设计稿CSS代码** (简化):
```css
.stove-body{
  width:calc(var(--px)*60);height:calc(var(--px)*34);
  background:
    linear-gradient(180deg, #8a5a2a 0%, #5a3020 50%, #3f2412 100%);
  box-shadow: 3px 3px 0 rgba(0,0,0,.6),
              inset 0 -3px 0 rgba(0,0,0,.4);
}
.stove-body::before{ /* 奇数行灰缝 */
  background-image: linear-gradient(var(--brick-dark), var(--brick-dark));
  background-size: calc(var(--px)*10) calc(var(--px)*2);
  background-position:
    calc(var(--px)*0) calc(var(--px)*0),
    calc(var(--px)*10) calc(var(--px)*0);
}
.stove-body::after{ /* 偶数行灰缝 */
  background-position:
    calc(var(--px)*5) calc(var(--px)*12),
    calc(var(--px)*15) calc(var(--px)*12);
}
```

**当前实现代码**:
```typescript
// DecoctionUI.ts:247-248
this.hearthGraphics.fillStyle(UI_COLORS.SOFT_BROWN, 0.8);
this.hearthGraphics.fillRect(x, y + LAYOUT.HEARTH_HEIGHT - 60, LAYOUT.HEARTH_WIDTH, 60);
```

---

### 2.2 火焰开口 (fire-hole)

| 维度 | 设计稿 | 当前实现 | 差距 |
|-----|-------|---------|-----|
| **形状** | 椭圆拱形开口 | 无 | ❌ 完全缺失 |
| **渐变颜色** | `radial-gradient` 金→橙→红→黑 | 单色三角形 | ❌ 简化 |
| **火焰动画** | 4个独立火焰 + `flameDance` 动画 | 无动画 | ❌ 完全缺失 |
| **火焰大小差异** | f1/f2/f3/f4 不同高度/宽度 | 无 | ❌ 缺失 |
| **火焰动画延迟** | 不同延迟 (0s/0.15s/0.3s/0.05s) | 无 | ❌ 缺失 |
| **火焰滤镜** | `drop-shadow(0 0 4px #ff8a22)` | 无 | ❌ 缺失 |

**设计稿CSS代码**:
```css
.fire-hole{
  width:calc(var(--px)*24);height:calc(var(--px)*16);
  background:radial-gradient(ellipse at 50% 100%, #ffd24a 0%, #ff7a1a 30%, #b8322c 60%, #2a0a04 100%);
}
.flame{
  background: radial-gradient(ellipse at 50% 100%, #fff1a8 0%, #ffd24a 30%, #ff7a1a 55%, #b8322c 90%);
  animation: flameDance 0.6s ease-in-out infinite alternate;
  filter: drop-shadow(0 0 4px #ff8a22);
}
.flame.f1{left:16%;height:26px;width:12px;}
.flame.f2{left:38%;height:32px;width:14px;}
.flame.f3{left:58%;height:28px;width:12px;}
.flame.f4{left:78%;height:22px;width:10px;}
@keyframes flameDance{
  0%{transform:translateY(0) scaleY(1) scaleX(1);}
  100%{transform:translateY(-3px) scaleY(1.15) scaleX(.85);}
}
```

**当前实现代码**:
```typescript
// DecoctionUI.ts:265-270 - 仅一个静态三角形
this.hearthGraphics.fillStyle(UI_COLORS.SOFT_ORANGE, 0.7);
this.hearthGraphics.fillTriangle(
  x + LAYOUT.HEARTH_WIDTH / 2, y + LAYOUT.HEARTH_HEIGHT - 100,
  x + LAYOUT.HEARTH_WIDTH / 2 - 30, y + LAYOUT.HEARTH_HEIGHT - 60,
  x + LAYOUT.HEARTH_WIDTH / 2 + 30, y + LAYOUT.HEARTH_HEIGHT - 60
);
```

---

### 2.3 药罐本体 (pot-body)

| 维度 | 设计稿 | 当前实现 | 差距 |
|-----|-------|---------|-----|
| **整体形状** | 圆底罐形 + 椭圆顶部 + 耳把手 | 矩形 roundedRect | ❌ 形状错误 |
| **罐身渐变** | `linear-gradient` 深棕→浅棕→深棕 | 单色 `PANEL_3D_BG` | ❌ 缺失渐变 |
| **内阴影** | `inset -4px -4px 0 rgba(0,0,0,.5)` | 无 | ❌ 缺失 |
| **外阴影** | `box-shadow` 多层 | 无 | ❌ 缺失 |
| **罐口边缘** | `pot-rim` 独立组件 + 渐变 | 无 | ❌ 缺失 |
| **药液表面** | `pot-liquid` + `liquidRipple` 动画 | 无 | ❌ 完全缺失 |

**设计稿CSS代码**:
```css
.pot-body{
  width:calc(var(--px)*36);height:calc(var(--px)*22);
  background:
    linear-gradient(90deg, #3a1a0a 0%, #5a2e18 25%, #7a4422 50%, #5a2e18 75%, #3a1a0a 100%);
  border-radius: 0 0 40% 40%;
  box-shadow: 0 3px 0 rgba(0,0,0,.6),
              inset -4px -4px 0 rgba(0,0,0,.5);
}
.pot-rim{ /* 罐口边缘 */
  width:calc(var(--px)*44);height:calc(var(--px)*8);
  background:linear-gradient(180deg, #7a4422 0%, #3a1a0a 50%, #5a2e18 100%);
}
.pot-liquid{ /* 药液 */
  background: linear-gradient(180deg, #4a2010 0%, #6a3a1a 100%);
  animation: liquidRipple 3s linear infinite;
}
```

**当前实现代码**:
```typescript
// DecoctionUI.ts:250-258 - 仅一个圆角矩形
this.hearthGraphics.fillStyle(UI_COLORS.PANEL_3D_BG, 1);
this.hearthGraphics.fillRoundedRect(
  x + 40, y + 60, LAYOUT.HEARTH_WIDTH - 80, LAYOUT.HEARTH_HEIGHT - 120, 10
);
```

---

### 2.4 火星粒子 (ember-spark)

| 维度 | 设计稿 | 当前实现 | 差距 |
|-----|-------|---------|-----|
| **粒子数量** | 多个火星 | 无 | ❌ 完全缺失 |
| **上升动画** | `emberRise` 向上飘动 | 无 | ❌ 完全缺失 |
| **漂移效果** | `translateX(var(--drift,20px))` | 无 | ❌ 完全缺失 |
| **发光效果** | `box-shadow:0 0 4px #ffae2a` | 无 | ❌ 缺失 |

**设计稿CSS代码**:
```css
.ember-spark{
  width:3px;height:3px;background:#ffd24a;
  border-radius:50%;
  animation: emberRise 2.2s linear infinite;
  box-shadow:0 0 4px #ffae2a;
}
@keyframes emberRise{
  0%{transform:translateY(0);opacity:0;}
  20%{opacity:1;}
  100%{transform:translateY(-180px) translateX(var(--drift,20px));opacity:0;}
}
```

---

### 2.5 蒸汽效果 (steam)

| 维度 | 设计稿 | 当前实现 | 差距 |
|-----|-------|---------|-----|
| **蒸汽团数量** | 5个 `steam-puff` | 无 | ❌ 完全缺失 |
| **上升动画** | `steamRise` 向上飘散 | 无 | ❌ 完全缺失 |
| **缩放效果** | `scale(.4) → scale(1.8)` | 无 | ❌ 缺失 |
| **透明度变化** | `opacity:0 → .8 → 0` | 无 | ❌ 缺失 |
| **漂移差异** | 不同 `--dx` 值 | 无 | ❌ 缺失 |

**设计稿CSS代码**:
```css
.steam-puff{
  background: radial-gradient(circle, rgba(240,230,210,.85) 0%, rgba(240,230,210,.4) 50%, transparent 70%);
  animation: steamRise 3.2s ease-out infinite;
}
.steam-puff.s1{animation-delay:0s;left:-14px;}
.steam-puff.s2{animation-delay:.6s;left:-2px;}
@keyframes steamRise{
  0%{transform: translate(0,0) scale(.4); opacity:0;}
  15%{opacity:.8;}
  100%{transform: translate(var(--dx,15px), -120px) scale(1.8); opacity:0;}
}
```

---

### 2.6 搅拌勺 (ladle)

| 维度 | 设计稿 | 当前实现 | 差距 |
|-----|-------|---------|-----|
| **勺柄** | `ladle-stick` + 渐变 | 无 | ❌ 完全缺失 |
| **勺头** | `ladle-scoop` + 渐变 | 无 | ❌ 完全缺失 |
| **搅拌动画** | `stir` 摆动动画 | 无 | ❌ 完全缺失 |

**设计稿CSS代码**:
```css
.ladle{
  animation: stir 2.4s ease-in-out infinite;
  transform-origin: 50% 80%;
}
.ladle-stick{
  background:linear-gradient(90deg, #6b3e1f 0%, #a26a3a 50%, #6b3e1f 100%);
}
@keyframes stir{
  0%,100%{transform:rotate(-8deg);}
  50%{transform:rotate(8deg);}
}
```

---

### 2.7 炉灶顶板 (stove-top)

| 维度 | 设计稿 | 当前实现 | 差距 |
|-----|-------|---------|-----|
| **存在** | 有独立顶板组件 | 无 | ❌ 缺失 |
| **渐变** | `linear-gradient(180deg,#4a2818,#2a1408)` | 无 | ❌ 缺失 |

---

### 2.8 地面阴影 (stove-shadow)

| 维度 | 设计稿 | 当前实现 | 差距 |
|-----|-------|---------|-----|
| **存在** | 有椭圆形阴影 | 无 | ❌ 缺失 |
| **渐变** | `radial-gradient` 半透明 | 无 | ❌ 缺失 |

---

## 3. 技术差距分析

### 3.1 CSS vs Phaser Graphics 能力对比

| CSS技术 | Phaser Graphics对应 | 可行性 |
|--------|-------------------|--------|
| `linear-gradient` | 无直接对应，需手动绘制 | ⚠️ 需分段绘制 |
| `radial-gradient` | 无直接对应，需手动绘制 | ⚠️ 需圆点采样 |
| `box-shadow` | 外部阴影可用 `generateTexture` | ⚠️ 复杂 |
| `inset shadow` | 需内部绘制 | ⚠️ 需手动绘制 |
| `@keyframes` 动画 | Phaser Tweens | ✅ 支持 |
| `::before/::after` | 多个 Graphics 对象 | ✅ 支持 |
| `filter: drop-shadow` | 无直接对应 | ❌ 不支持 |
| `transform-origin` | Tweens 支持 | ✅ 支持 |

### 3.2 Phaser替代方案

由于Phaser Graphics API不支持CSS高级特性，需要使用以下替代方案：

1. **渐变效果**: 分段绘制多个矩形/圆形，每段使用不同颜色
2. **阴影效果**: 使用额外Graphics层绘制阴影形状
3. **动画效果**: Phaser Tweens 系统完全支持
4. **粒子效果**: Phaser Particles 系统优于CSS动画

---

## 4. 优化方案

### 4.1 实施策略

**方案选择**: 由于CSS技术无法直接移植到Phaser，采用以下策略：

1. **创建视觉组件库**: 将炉灶/药罐拆分为独立组件
2. **使用Phaser原生能力**: Tweens动画 + Particles粒子
3. **像素风格渲染**: 利用已有的PixelSpriteComponent绘制细节
4. **分层绘制**: 每个视觉元素独立Graphics对象

### 4.2 新组件设计

#### HearthVisualComponent (炉灶视觉组件)

**职责**: 绘制完整炉灶动画，包括：
- 砖墙纹理 (多层绘制)
- 火焰开口 + 动态火焰
- 火星粒子
- 炉灶顶板
- 地面阴影

**接口设计**:
```typescript
interface HearthVisualConfig {
  width: number;    // 240px
  height: number;   // 300px (实际炉灶34px高)
  animated: boolean; // 是否启用动画
}

class HearthVisualComponent {
  constructor(scene: Phaser.Scene, config: HearthVisualConfig);

  // 绘制方法
  drawBrickTexture(): void;
  drawFireHole(): void;
  createFlames(): void;
  createEmberParticles(): void;

  // 动画控制
  startFlameAnimation(): void;
  stopAnimation(): void;

  // Phaser容器
  container: Phaser.GameObjects.Container;
}
```

#### PotVisualComponent (药罐视觉组件)

**职责**: 绘制完整药罐动画，包括：
- 罐身 (渐变绘制)
- 罐口边缘
- 药液表面 + 波纹动画
- 把手
- 蒸汽效果
- 搅拌勺

**接口设计**:
```typescript
interface PotVisualConfig {
  width: number;    // 基于像素单位
  height: number;
  showSteam: boolean;
  showLadle: boolean;
}

class PotVisualComponent {
  constructor(scene: Phaser.Scene, config: PotVisualConfig);

  // 绘制方法
  drawPotBody(): void;
  drawPotRim(): void;
  drawLiquidSurface(): void;
  createSteamParticles(): void;
  createLadle(): void;

  // 动画控制
  startStirAnimation(): void;
  startSteamAnimation(): void;

  // 状态更新
  setLiquidColor(color: string): void;

  container: Phaser.GameObjects.Container;
}
```

---

## 5. TODO 清单

### Task 1: 创建炉灶视觉组件基础

**文件**: `src/ui/components/HearthVisualComponent.ts`

- [ ] 创建组件骨架 (继承 BaseUIComponent)
- [ ] 实现砖墙纹理绘制 (分段渐变 + 灰缝网格)
- [ ] 实现火焰开口绘制 (椭圆拱形 + 渐变颜色)
- [ ] 实现炉灶顶板绘制
- [ ] 实现地面阴影绘制
- [ ] 单元测试: 纹理绘制验证

### Task 2: 实现火焰动画系统

**文件**: `src/ui/components/HearthVisualComponent.ts`

- [ ] 创建4个独立火焰对象
- [ ] 实现 flameDance 动画 (scaleY/scaleX 变化)
- [ ] 设置不同延迟 (0s/0.15s/0.3s/0.05s)
- [ ] 添加发光效果模拟 (额外Graphics层)
- [ ] 单元测试: 动画触发验证

### Task 3: 实现火星粒子系统

**文件**: `src/ui/components/HearthVisualComponent.ts`

- [ ] 使用 Phaser Particles 创建火星
- [ ] 配置上升轨迹 + 漂移
- [ ] 配置透明度变化 (0→1→0)
- [ ] 配置发光效果
- [ ] 单元测试: 粒子生成验证

### Task 4: 创建药罐视觉组件基础

**文件**: `src/ui/components/PotVisualComponent.ts`

- [ ] 创建组件骨架
- [ ] 实现罐身绘制 (渐变分段绘制)
- [ ] 实现罐口边缘绘制 (渐变)
- [ ] 实现把手绘制
- [ ] 实现内阴影效果
- [ ] 单元测试: 形状验证

### Task 5: 实现药液表面动画

**文件**: `src/ui/components/PotVisualComponent.ts`

- [ ] 实现药液表面绘制 (渐变)
- [ ] 实现 liquidRipple 波纹动画
- [ ] 实现药液颜色动态更新
- [ ] 单元测试: 波纹动画验证

### Task 6: 实现蒸汽效果系统

**文件**: `src/ui/components/PotVisualComponent.ts`

- [ ] 创建5个蒸汽团对象
- [ ] 实现 steamRise 动画 (上升+缩放+透明度)
- [ ] 设置不同延迟和漂移值
- [ ] 使用 Phaser Particles 或 Tweens
- [ ] 单元测试: 蒸汽生成验证

### Task 7: 实现搅拌勺动画

**文件**: `src/ui/components/PotVisualComponent.ts`

- [ ] 创建勺柄对象 (渐变绘制)
- [ ] 创建勺头对象 (渐变绘制)
- [ ] 实现 stir 摆动动画
- [ ] 单元测试: 摆动动画验证

### Task 8: 重构 DecoctionUI 集成新组件

**文件**: `src/ui/DecoctionUI.ts`

- [ ] 替换 `createHearthPlaceholder()` 为新组件
- [ ] 集成 HearthVisualComponent
- [ ] 集成 PotVisualComponent
- [ ] 配置动画启动/停止时机
- [ ] 煎煮状态联动动画
- [ ] 单元测试: 集成验证
- [ ] E2E测试: 视觉呈现验证

### Task 9: AI视觉验收

**文件**: `tests/visual/decoction-visual.spec.ts`

- [ ] 创建视觉测试脚本
- [ ] 定义验收标准 (参考对比表)
- [ ] 执行AI视觉评估
- [ ] 验收阈值: ≥80%置信度

---

## 6. 验收标准

### 6.1 视觉验收维度

| 维度 | 权重 | 设计稿标准 | 验收标准 |
|-----|------|-----------|---------|
| **砖墙纹理** | 15% | 多层渐变+灰缝网格 | 分段渐变绘制可见 |
| **火焰动态** | 20% | 4火焰+舞动动画 | 4火焰可见+动画流畅 |
| **药罐形状** | 20% | 圆底罐形+边缘+把手 | 形状接近设计稿 |
| **蒸汽效果** | 10% | 5蒸汽团+上升动画 | 蒸汽可见+动画流畅 |
| **火星粒子** | 5% | 上升+发光 | 粒子可见 |
| **搅拌勺** | 5% | 摆动动画 | 动画可见 |
| **整体协调** | 25% | 层次分明 | 视觉协调 |

### 6.2 功能验收

- [ ] 单元测试: 新组件 100% passed
- [ ] 集成测试: DecoctionUI集成测试通过
- [ ] E2E测试: 煎药流程测试通过
- [ ] AI视觉: ≥80%置信度

---

## 7. 实施计划

**预计执行方式**: 使用 `superpowers:subagent-driven-development`

**Task分解**: 9个Task，每个Task包含完整TDD流程

**预计时间**: 每个Task约20-30分钟

---

## 8. 附录: 设计稿关键CSS汇总

### 8.1 砖墙纹理CSS

```css
.stove-body{
  background:
    linear-gradient(180deg, #8a5a2a 0%, #5a3020 50%, #3f2412 100%);
  box-shadow: 3px 3px 0 rgba(0,0,0,.6), inset 0 -3px 0 rgba(0,0,0,.4);
}
.stove-body::before{ /* 奇数行灰缝 */
  background-image: linear-gradient(#2a1408, #2a1408);
  background-size: calc(6px*10) calc(6px*2);
}
```

### 8.2 火焰CSS

```css
.flame{
  background: radial-gradient(ellipse at 50% 100%, #fff1a8, #ffd24a, #ff7a1a, #b8322c);
  animation: flameDance 0.6s ease-in-out infinite alternate;
}
@keyframes flameDance{
  0%{transform:translateY(0) scaleY(1) scaleX(1);}
  100%{transform:translateY(-3px) scaleY(1.15) scaleX(.85);}
}
```

### 8.3 蒸汽CSS

```css
.steam-puff{
  background: radial-gradient(circle, rgba(240,230,210,.85), rgba(240,230,210,.4), transparent);
  animation: steamRise 3.2s ease-out infinite;
}
@keyframes steamRise{
  0%{transform:translate(0,0) scale(.4); opacity:0;}
  15%{opacity:.8;}
  100%{transform:translate(15px,-120px) scale(1.8); opacity:0;}
}
```

---

*本文档由 Claude Code 创建，更新于 2026-04-23*