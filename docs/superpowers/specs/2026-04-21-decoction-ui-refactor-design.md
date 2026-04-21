# 煎药小游戏 UI 重构迁移设计

**版本**: v1.0
**日期**: 2026-04-21
**状态**: 设计完成
**关联**: 基于 `docs/ui/煎药小游戏/` 用户提供的 HTML/React 设计

---

## 一、设计背景

### 1.1 问题分析

当前 `DecoctionUI.ts` 实现存在以下不足：

| 维度 | 当前实现 | 用户 HTML 设计 |
|-----|---------|---------------|
| **UI风格** | 简单图形占位符 | 卷轴风格纸张 + 印章装饰 |
| **图标** | 无图标，仅文字 | 像素风格药材图标（box-shadow技术） |
| **交互** | 点击选择 | 拖拽 + 拖拽轨迹 + 水滴溅射 |
| **动效** | 简单蒸汽动画 | 成功爆发（"合"印章）/ 失败爆发（红X+烟雾） |

用户提供了精致的 HTML/React UI 设计（`docs/ui/煎药小游戏/`），需要迁移到 Phaser 项目中。

### 1.2 技术约束

| 技术栈 | 用户 HTML 设计 | 当前 Phaser 项目 |
|--------|---------------|-----------------|
| 渲染方式 | DOM + CSS | Canvas/WebGL |
| 组件框架 | React + JSX | Phaser GameObjects |
| 动画系统 | CSS animations/keyframes | Phaser Tweens |
| 拖拽 | HTML5 Drag API | Phaser Drag Plugin |

**结论**: 无法直接复制粘贴，需要用 Phaser 原生方式重新实现视觉风格。

### 1.3 设计目标

1. **贴近HTML效果** - 保持用户设计的视觉精度和交互体验
2. **沉淀复用组件** - 迁移过程中创建的组件成为后续游戏的"资产"
3. **可泛化迁移方案** - 为后续小游戏（炮制/种植/诊断等）提供统一的迁移模式

---

## 二、迁移方案架构

### 2.1 迁移工作流

```
HTML设计 → 元素识别 → Phaser实现 → 组件抽离 → 入库
    │          │           │           │         │
    │          │           │           │         ↓
    │          │           │           │    组件库
    │          │           │           │         │
    │          │           │           └─────────┤
    │          │           └─────────────────────┤
    │          └─────────────────────────────────┤
    └─────────────────────────────────────────────┘
```

### 2.2 元素识别规则（判断是否抽离为组件）

| 元素类型 | 是否抽离组件 | 示例 |
|---------|------------|------|
| **全局风格基类** | ✅ 必须抽离 | 卷轴边框、印章装饰 |
| **像素数据驱动** | ✅ 必须抽离 | grid/palette → PixelSpriteComponent |
| **复杂动效系统** | ✅ 必须抽离 | 拖拽轨迹、溅射、爆发 |
| **业务特定UI** | ❌ 游戏内实现 | 药方槽位、进度条标签 |
| **简单静态装饰** | ⚠️ 按需判断 | 简单边框 vs 复杂边框 |

**判断标准**：
- 其他小游戏会用到的 → 组件
- 技术复杂度高（动效、数据驱动） → 组件
- 业务逻辑特定 → 游戏内实现

---

## 三、核心组件设计

### 3.1 ScrollModalUI 基类

继承自现有的 `ModalUI`，增加卷轴风格装饰。

**文件位置**: `src/ui/base/ScrollModalUI.ts`

**接口设计**:

```typescript
interface ScrollModalConfig {
  // 标题区
  title: string;           // 主标题，如"煎药"
  subtitle?: string;       // 副标题，如"壬寅春"

  // 印章配置
  sealMain?: string;       // 主印章文字，如"杏林"
  sealCorner?: string;     // 角印章文字，如"煎煮"

  // 边框变体（对应用户的 frame variant）
  variant: 'default' | 'dark' | 'light';
}
```

**渲染结构**:

```
ScrollModalUI
├── 上轴 (roller-top.png 或 Graphics)
├── 下轴 (roller-bottom.png 或 Graphics)
├── 纸张背景 (parchment 纹理或 Graphics)
├── 主印章 (左上角，可旋转，如"杏林")
├── 角印章 (右下角，small，如"煎煮")
├── 标题栏 (title + subtitle + 装饰线)
└── 内容区 (children container)
```

**复用场景**:
- 煎药小游戏 ✅
- 炮制小游戏 ✅
- 种植小游戏 ✅
- 诊断小游戏（脉诊/舌诊/辨证选方） ✅

---

### 3.2 PixelSpriteComponent

像素图标绘制组件，复用用户的 grid/palette 数据结构。

**文件位置**: `src/ui/components/PixelSpriteComponent.ts`

**接口设计**:

```typescript
interface PixelSpriteConfig {
  // 像素数据（直接复用用户格式）
  grid: string[];          // 如 ['  aa  ', ' abba ', ...]
  palette: Record<string, string>;  // 如 { a:'#6a8c78', b:'#8ab098' }

  // 渲染参数
  pixelSize: number;       // 单像素尺寸，默认 3

  // 可选：动画配置
  animated?: boolean;      // 是否启用闪烁等动效
}
```

**实现方式**: 使用 Phaser Graphics API，按 grid 数组循环绘制每个像素点。

**数据迁移**:
用户的 `herb-icons.jsx` 中的所有 HERB 数据（当归、黄芪、人参等）直接迁移到 `src/data/pixel-herbs.ts`，无需修改格式。

**复用场景**:
- 煎药小游戏（药材图标） ✅
- 炮制小游戏（药材图标） ✅
- 种植小游戏（种子图标） ✅
- 背包系统（物品图标） ✅

---

### 3.3 HerbTagComponent

药牌组件，包含悬挂绳子 + 像素图标 + 药名 + 属性 + 数量。

**文件位置**: `src/ui/components/HerbTagComponent.ts`

**接口设计**:

```typescript
interface HerbTagConfig {
  // 药材数据
  herb: {
    id: string;
    name: string;          // 药名，如"当归"
    prop: string;          // 属性，如"补血"
    count: number;         // 数量
    grid: string[];        // 像素 grid
    palette: Record<string, string>;  // 像素 palette
  };

  // 外观配置
  pixelSize: number;       // 像素尺寸，默认 3

  // 交互配置
  draggable: boolean;      // 是否可拖拽
  onClick?: () => void;    // 点击回调（非拖拽模式）
  onDragStart?: () => void;
  onDragEnd?: () => void;

  // 状态
  selected?: boolean;      // 是否选中（高亮）
  disabled?: boolean;      // 是否禁用（已放入）
}
```

**渲染结构**:

```
HerbTagComponent
├── 绳子 (string Graphics 或 Sprite)
├── 木牌 (plank Graphics)
│   ├── 像素图标 (PixelSpriteComponent)
│   ├── 药名 (Text)
│   └── 属性 (Text)
└── 数量标签 (Text，如"×6")
```

**复用场景**:
- 煎药小游戏（药柜展示） ✅
- 炮制小游戏（药材选择） ✅
- 种植小游戏（种子选择） ✅

---

### 3.4 DragEffectManager

拖拽动效系统，管理轨迹、溅射、爆发三套效果。

**文件位置**: `src/systems/DragEffectManager.ts`

**接口设计**:

```typescript
interface DragEffectConfig {
  // 拖拽轨迹
  trail: {
    enabled: boolean;
    maxCount: number;      // 最多同时显示多少轨迹点，默认 20
    fadeTime: number;      // 消失时间(ms)，默认 600
    particleSize: number;  // 粒子尺寸，默认 4
  };

  // 水滴溅射
  splash: {
    enabled: boolean;
    count: number;         // 每次溅射粒子数，默认 8
    spread: number;        // 散射范围，默认 40
    riseHeight: number;    // 上升高度，默认 50
  };

  // 成功/失败爆发
  burst: {
    success: {
      text: string;        // 印章文字，如"合"
      color: string;       // 金色 '#ffd24a'
      duration: number;    // 动效时长，默认 1400
    };
    failure: {
      showCross: boolean;  // 是否显示红X
      showSmoke: boolean;  // 是否显示烟雾
      duration: number;    // 动效时长，默认 1100
    };
  };
}
```

**使用方式**:

```typescript
// 在游戏中创建
const dragManager = new DragEffectManager(scene, config);

// 拖拽开始
dragManager.startDrag(sprite);

// 拖拽移动（自动产生轨迹）
dragManager.updateDrag(x, y);

// 拖拽结束
dragManager.endDrop(x, y, result: 'success' | 'failure');

// 成功 → 金色"合"印章爆发 + 光芒
// 失败 → 红X + 烟雾 + 红色火花
```

**动效细节**:

| 动效 | HTML 实现 | Phaser 实现 |
|-----|----------|------------|
| **拖拽轨迹** | CSS `.drag-trail` 随机生成 | Graphics 粒子 + Tweens fadeOut |
| **水滴溅射** | CSS `.splash` 多粒子散射 | Graphics 粒子 + Tweens 抛物线 |
| **成功爆发** | CSS `.burst-ok` 印章+光芒+圆环 | Graphics 印章 + Tweens scale/rotate |
| **失败爆发** | CSS `.burst-bad` 红X+烟雾+火花 | Graphics X + Tweens smoke/sparks |

**复用场景**:
- 煎药小游戏（药材拖入药罐） ✅
- 炮制小游戏（药材拖入灶台） ✅
- 种植小游戏（种子拖入地块） ✅
- 其他需要拖拽交互的游戏 ✅

---

## 四、煎药游戏迁移计划

### 4.1 元素识别清单

分析用户的 `decoction.html` + `app.jsx`：

| 元素 | HTML 实现 | Phaser 迁移 | 是否抽离组件 |
|-----|----------|------------|------------|
| 卷轴边框 | CSS `.scroll-modal` | `ScrollModalUI` | ✅ 基类 |
| 印章"杏林"/"煎煮" | CSS `.seal` | `ScrollModalUI` 内置 | ✅ 基类 |
| 标题栏"煎药/壬寅春" | CSS `.title-bar` | `ScrollModalUI` 内置 | ✅ 基类 |
| 像素药材图标 | box-shadow grid | `PixelSpriteComponent` | ✅ 组件 |
| 药牌（绳+牌+图标+名+属性） | CSS `.tag` | `HerbTagComponent` | ✅ 组件 |
| 拖拽轨迹粒子 | CSS `.drag-trail` | `DragEffectManager` | ✅ 系统 |
| 水滴溅射 | CSS `.splash` | `DragEffectManager` | ✅ 系统 |
| 成功爆发"合"印章 | CSS `.burst-ok` | `DragEffectManager` | ✅ 系统 |
| 失败爆发红X+烟雾 | CSS `.burst-bad` | `DragEffectManager` | ✅ 系统 |
| 炉灶区域 | CSS `.stove-area` | `DecoctionUI` 内实现 | ❌ 业务特定 |
| 药罐+液体 | CSS `.pot-*` | `DecoctionUI` 内实现 | ❌ 业务特定 |
| 火焰动效 | CSS `.flame` | `DecoctionUI` 内实现 | ❌ 业务特定 |
| 蒸汽动效 | CSS `.steam` | `DecoctionUI` 内实现 | ❌ 业务特定 |
| 药柜区域 | CSS `.region-bag` | `DecoctionUI` 内实现 | ❌ 业务特定 |
| 目标药方卷轴 | CSS `.target-scroll` | `DecoctionUI` 内实现 | ❌ 业务特定 |
| 进度条 | CSS `.heat-bar` | 可复用现有 `ProgressBarComponent` | ⚠️ 已有组件 |
| 成品药剂 | CSS `.vial` | `DecoctionUI` 内实现 | ❌ 业务特定 |

**结论**: 需新建 4 个组件/基类 + 复用 1 个现有组件。

### 4.2 实现步骤

| Step | 任务 | 输出 | 依赖 |
|-----|------|------|------|
| **Step 1** | 分析 HTML 设计，识别元素 | 元素清单 | - |
| **Step 2** | 创建 `ScrollModalUI` 基类 | `src/ui/base/ScrollModalUI.ts` | ModalUI |
| **Step 3** | 创建 `PixelSpriteComponent` | `src/ui/components/PixelSpriteComponent.ts` | - |
| **Step 4** | 创建 `HerbTagComponent` | `src/ui/components/HerbTagComponent.ts` | PixelSpriteComponent |
| **Step 5** | 创建 `DragEffectManager` | `src/systems/DragEffectManager.ts` | - |
| **Step 6** | 迁移像素药材数据 | `src/data/pixel-herbs.ts` | - |
| **Step 7** | 重构 `DecoctionUI` | 组装所有组件 + 实现业务逻辑 | Step 2-6 |
| **Step 8** | 整理组件入库 | 更新 CLAUDE.md 组件库索引 | - |

### 4.3 依赖关系图

```
Step 2: ScrollModalUI ──────────────────┐
                                        │
Step 3: PixelSpriteComponent ───────────┼──→ Step 7: DecoctionUI
                                        │    (组装所有组件)
Step 4: HerbTagComponent ───────────────┤
  (依赖 PixelSpriteComponent)           │
                                        │
Step 5: DragEffectManager ──────────────┤
                                        │
Step 6: pixel-herbs.ts (数据) ──────────┘
```

---

## 五、后续游戏复用预期

| 小游戏 | 可复用组件 | 需新增组件 |
|--------|----------|-----------|
| **炮制小游戏** | ScrollModalUI, PixelSpriteComponent, HerbTagComponent, DragEffectManager | 炮制灶台动效 |
| **种植小游戏** | ScrollModalUI, PixelSpriteComponent, HerbTagComponent, DragEffectManager | 地块组件、肥料袋 |
| **脉诊小游戏** | ScrollModalUI | 脉象选项组件 |
| **舌诊小游戏** | ScrollModalUI | 舌象图片组件 |
| **辨证选方小游戏** | ScrollModalUI | 证型选项、方剂详情弹窗 |

**预期复用率**: 60-80% 的 UI 组件可跨游戏复用。

---

## 六、视觉精度保障

为确保迁移效果贴近用户 HTML 设计，遵循以下原则：

### 6.1 颜色一致性

| 元素 | HTML 颜色 | Phaser 颜色 |
|-----|----------|------------|
| 纸张背景 | `#e8c991` | 同值 |
| 边框 | `#8a5a2a` | 同值 |
| 主印章 | `#8a1f1a` | 同值 |
| 印章文字 | `#f4dba8` | 同值 |
| 像素图标 | 各 palette 定义 | 同值 |

### 6.2 尺寸一致性

| 元素 | HTML 尺寸 | Phaser 尺寸 |
|-----|----------|------------|
| 像素图标 | 10×10 grid × 3px | 同值 |
| 药牌木牌 | ~80×60 | 同比例 |
| 卷轴宽度 | 100% container | 同比例 |

### 6.3 动效时长一致性

| 动效 | HTML 时长 | Phaser 时长 |
|-----|----------|------------|
| 拖拽轨迹消失 | 600ms | 600ms |
| 水滴溅射 | 900ms | 900ms |
| 成功爆发 | 1400ms | 1400ms |
| 失败爆发 | 1100ms | 1100ms |

---

## 七、测试验收标准

### 7.1 视觉验收

- [ ] 卷轴边框与 HTML 设计视觉一致
- [ ] 印章位置、大小、旋转角度与 HTML 一致
- [ ] 像素图标颜色、形状与 HTML 一致
- [ ] 药牌布局与 HTML 一致

### 7.2 交互验收

- [ ] 拖拽手感流畅，轨迹粒子跟随鼠标
- [ ] 水滴溅射动效与 HTML 一致
- [ ] 成功爆发显示"合"印章 + 光芒
- [ ] 失败爆发显示红X + 烟雾 + 红火花

### 7.3 性能验收

- [ ] 像素图标绘制不超过 16ms/帧
- [ ] 拖拽轨迹最多 20 个粒子同时显示
- [ ] 无内存泄漏（粒子正确销毁）

---

## 八、相关文档

- 用户 HTML 设计: `docs/ui/煎药小游戏/decoction.html`, `app.jsx`, `herb-icons.jsx`
- 当前实现: `src/ui/DecoctionUI.ts`, `src/data/decoction-data.ts`
- 原设计文档: `docs/superpowers/specs/minigames/2026-04-19-decoction-minigame-design.md`

---

*本文档由 Claude Code 创建，更新于 2026-04-21*