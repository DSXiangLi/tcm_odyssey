# 煎药小游戏 HTML 直接迁移设计

> **设计目标**: 将 `docs/ui/煎药小游戏/decoction.html` 设计稿直接迁移到 Phaser 游戏，保留完整视觉结构，与后端逻辑融合。

**日期**: 2026-04-26
**版本**: v2.0 - 直接迁移方案
**状态**: 设计完成待审批

---

## 一、现状分析

### 1.1 设计稿完整结构

**文件组成**:
| 文件 | 行数 | 内容 |
|------|------|------|
| `decoction.html` | 1258行 | CSS样式(~1200行) + HTML骨架 |
| `herb-icons.jsx` | 237行 | 像素药材数据(22种) + pixelSprite函数 |
| `app.jsx` | 468行 | React组件(8个) + 状态管理 |

**核心组件**:
| 组件 | 功能 | 子元素 |
|------|------|--------|
| `App` | 主容器 | scroll-modal, drag-ghost, trails |
| `Steam` | 蒸汽动画 | 5个 steam-puff |
| `PotArea` | 药罐 | pot-body, pot-rim, pot-liquid, pot-handle.l/r |
| `StoveScene` | 炉灶 | floor, stove-shadow, stove-body, stove-top, fire-hole, flames(4), embers(6), ladle |
| `HerbTag` | 药牌 | tag-string, tag-plank, herb-icon, tag-name, tag-prop, tag-count |
| `Vial` | 药瓶 | vial-cap, vial-neck, vial-body, vial-liquid, vial-label |
| `TargetScroll` | 目标卷轴 | rod(2), parchment, tgt-label/name/clue/progress |
| `DropBurst` | 拖放效果 | burst-ring, burst-ray, burst-stamp/cross, burst-smoke, burst-spark |

**CSS动画 (11种 keyframes)**:
| 动画名 | 用途 | 时长 |
|--------|------|------|
| `flicker` | 背景光效 | 4s |
| `flameDance` | 火焰舞动 | 0.9s |
| `emberRise` | 火星上升 | 1.6s |
| `stir` | 搅拌勺摆动 | 2.4s |
| `steamRise` | 蒸汽上升 | 3.2s |
| `scrollBob` | 卷轴悬浮 | 3.8s |
| `goldPulse` | 金色脉冲 | 2.5s |
| `stampIn` | 印章盖入 | 0.8s |
| `crossShake` | 错误抖动 | 0.5s |
| `potCheer/potAngry` | 药罐反馈 | 0.5-0.6s |
| `splashFly` | 水花溅射 | 0.9s |

### 1.2 布局结构

**CSS Grid 3区域**:
```css
.content{
  display: grid;
  grid-template-columns: 1.15fr 1fr;
  grid-template-rows: 2.2fr 1fr;
  gap: 18px;
}
.region-stove{ grid-row: 1/2; grid-column: 1/2; }  /* 炉灶区 */
.region-bag  { grid-row: 1/3; grid-column: 2/3; }  /* 药柜区(跨两行) */
.region-vials{ grid-row: 2/3; grid-column: 1/2; }  /* 药瓶区 */
```

**尺寸**:
- Modal: 1200×760px (设计稿) vs 800×600px (旧实现)
- 卷轴木轴: 38px高度 + 22px侧盖
- 纸张内边距: inset 28px

### 1.3 当前 DecoctionManager 数据结构

```typescript
interface DecoctionState {
  phase: 'idle' | 'selecting' | 'brewing' | 'complete';
  prescriptionId: string | null;
  selected_herbs: string[];
  fire_level: FireLevel;
  score_result: DecoctionScoreResult | null;
}
```

**FireLevel 类型**: 'martial' | 'civil' | 'gentle'

---

## 二、迁移架构

### 2.1 整体方案

```
┌─────────────────────────────────────────────────────────────────┐
│                    Phaser DecoctionScene                         │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │               DOM Element (React Root)                       │ │
│  │  ┌─────────────────────────────────────────────────────────┐ │ │
│  │  │                  DecoctionUI (React)                     │ │ │
│  │  │  ┌─────────────────────────────────────────────────────┐ │ │ │
│  │  │  │                    App.jsx                          │ │ │ │
│  │  │  │  - ScrollModal (卷轴框架)                            │ │ │ │
│  │  │  │  - Content Grid (3区域布局)                          │ │ │ │
│  │  │  │  - StoveScene → Bridge → Phaser                      │ │ │ │
│  │  │  │  - HerbGrid ← InventoryManager                      │ │ │ │
│  │  │  │  - Vials ← DecoctionManager.complete_history         │ │ │ │
│  │  │  └─────────────────────────────────────────────────────┘ │ │ │
│  │  └─────────────────────────────────────────────────────────┘ │ │
│  └─────────────────────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │              DecoctionManager (TypeScript)                   │ │
│  │  - 评分逻辑                                                  │ │
│  │  - 药材消耗                                                  │ │
│  │  - 方剂验证                                                  │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 文件结构规划

```
src/ui/html/
├── index.ts                    # React入口，导出 mountDecoctionUI
├── DecoctionUI.tsx             # React根组件（基于app.jsx）
├── components/
│   ├── ScrollModal.tsx         # 卷轴框架 (roller, paper, seal)
│   ├── StoveScene.tsx          # 炉灶场景 (stove-body, fire-hole, pot)
│   ├── PotArea.tsx             # 药罐区域 (pot-wrap, steam)
│   ├── HerbTag.tsx             # 药牌组件 (tag, plank, icon)
│   ├── HerbGrid.tsx            # 药材网格 (bag-grid, header)
│   ├── Vial.tsx                # 药瓶组件
│   ├── VialsShelf.tsx          # 药瓶陈列架
│   ├── TargetScroll.tsx        # 目标卷轴
│   ├── DropBurst.tsx           # 拖放效果
│   └── FireSelector.tsx        # 火候选择器 (武火/文火)
├── data/
│   ├── herbs.ts                # 像素药材数据（基于herb-icons.jsx）
│   └── formulas.ts             # 方剂数据（基于FORMULAS）
├── hooks/
│   ├── usePhaserBridge.ts      # Phaser事件桥接Hook
│   ├── useDragDrop.ts          # 拖拽逻辑Hook
│   └── useInventorySync.ts     # 背包同步Hook
├── bridge/
│   ├── events.ts               # 事件常量定义
│   ├── dispatcher.ts           # CustomEvent发送器
│   └── types.ts                # 桥接类型定义
├── styles/
│   ├── index.css               # 样式入口
│   ├── variables.css           # CSS变量 (:root)
│   ├── scroll-modal.css        # 卷轴框架样式
│   ├── stove.css               # 炉灶样式
│   ├── pot.css                 # 药罐样式
│   ├── herbs.css               # 药牌样式
│   ├── vials.css               # 药瓶样式
│   ├── animations.css          # 动画keyframes
│   └── drag-effects.css        # 拖拽效果样式
└── utils/
    └── pixelSprite.ts          # 像素绘图函数
```

### 2.3 Phaser DOM Element 集成

**game.config.ts 配置**:
```typescript
dom: {
  createContainer: true  // 必须启用
}
```

**DecoctionScene.ts 挂载**:
```typescript
// 创建DOM容器
const container = document.createElement('div');
container.id = 'decoction-react-root';
container.style.cssText = `
  position: fixed;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  width: 1200px; height: 760px;
  z-index: 1000;
`;

// 添加到Phaser DOM Element
const domElement = this.add.dom(
  this.cameras.main.width / 2,
  this.cameras.main.height / 2,
  container
);

// 挂载React
this.reactRoot = mountDecoctionUI(container, {
  herbs: this.getAvailableHerbs(),
  targetFormula: this.getTargetFormula(),
  onComplete: (data) => this.handleComplete(data),
  onClose: () => this.closeScene(),
});
```

---

## 三、数据桥接设计

### 3.1 事件流

```
React UI                        Phaser Scene
    │                               │
    │ ──── HERB_DROP ──────────────>│  (药材放入药罐)
    │                               │ → DecoctionManager.addHerb()
    │                               │ → 评分验证
    │ <──── HERB_RESULT ────────────│  (验证结果)
    │                               │
    │ ──── FIRE_SELECT ────────────>│  (火候选择)
    │                               │ → DecoctionManager.setFireLevel()
    │                               │
    │ ──── COMPLETE ───────────────>│  (完成煎药)
    │                               │ → DecoctionManager.complete()
    │                               │ → InventoryManager.consume()
    │ <──── SCORE_RESULT ───────────│  (评分结果)
    │                               │
    │ ──── CLOSE ──────────────────>│  (关闭场景)
    │                               │ → scene.stop()
```

### 3.2 事件常量定义

```typescript
// src/ui/html/bridge/events.ts
export const DECOCTION_EVENTS = {
  // React → Phaser
  HERB_DROP: 'decoction:herb:drop',
  HERB_DRAG_START: 'decoction:herb:dragstart',
  FIRE_SELECT: 'decoction:fire:select',
  COMPLETE: 'decoction:complete',
  CLOSE: 'decoction:close',

  // Phaser → React
  HERB_RESULT: 'decoction:herb:result',    // { success, herbId, message }
  SCORE_RESULT: 'decoction:score:result',  // { score, breakdown }
  RESET: 'decoction:reset',
  STATE_UPDATE: 'decoction:state:update',  // { phase, progress }
};
```

### 3.3 桥接类型

```typescript
// src/ui/html/bridge/types.ts
export interface HerbDropData {
  herbId: string;
}

export interface HerbResultData {
  success: boolean;
  herbId: string;
  message?: string;
}

export interface FireSelectData {
  type: 'martial' | 'civil' | 'gentle';
}

export interface CompleteData {
  herbs: string[];
  fireType: string;
}

export interface ScoreResultData {
  score: number;
  breakdown: {
    composition: number;
    fire: number;
    time: number;
  };
  passed: boolean;
}

export interface DecoctionUIProps {
  herbs: HerbData[];
  targetFormula: FormulaData;
  completedVials: VialData[];
  onComplete: (data: CompleteData) => void;
  onClose: () => void;
}
```

---

## 四、React 组件迁移详情

### 4.1 ScrollModal (卷轴框架)

**从设计稿提取**:
```jsx
<div className={`scroll-modal variant-${frame}`}>
  <div className="roller top"/>
  <div className="roller bottom"/>
  <div className="roller-cap left"/>
  <div className="roller-cap right"/>
  <div className="paper">
    <div className="seal tl"><span className="s1">杏</span><span className="s2">林</span></div>
    <div className="seal br small">煎<br/>煮</div>
    <div className="title-bar">...</div>
    <button className="close-btn">×</button>
    <div className="content">...</div>
  </div>
</div>
```

**Props**:
```typescript
interface ScrollModalProps {
  frameVariant?: 'default' | 'bamboo' | 'gold';
  onClose: () => void;
  children: React.ReactNode;
}
```

### 4.2 StoveScene (炉灶场景)

**CSS像素单位**: `--px: 4px`

**结构**:
```jsx
<div className={`stove-area ${shake ? `shake-${shake}` : ''}`}>
  <div className="pixel-canvas">
    <div className="floor"/>              {/* 地板木纹 */}
    <div className="stove-shadow"/>       {/* 炉灶阴影 */}
    <div className="stove-body"/>         {/* 砖墙炉身 */}
    <div className="stove-top"/>          {/* 炉顶 */}
    <div className="fire-hole">           {/* 火孔 */}
      {[1,2,3,4].map(i => <div className={`flame f${i}`}/>)}
      {[...Array(6)].map((_,i) => <div className="ember-spark"/>)}
    </div>
    <PotArea inPot={inPot} finished={finished}/>
    <div className="ladle">               {/* 搅拌勺 */}
      <div className="ladle-stick"/>
      <div className="ladle-scoop"/>
    </div>
    {showSteam && <Steam/>}
  </div>
</div>
```

**Props**:
```typescript
interface StoveSceneProps {
  inPot: HerbData[];
  finished: boolean;
  showSteam: boolean;
  shake: 'ok' | 'bad' | null;
  onDrop: (herbId: string, position: {x: number, y: number}) => void;
}
```

### 4.3 HerbGrid (药材网格)

**布局**: `grid-template-columns: repeat(4, 1fr)`

**结构**:
```jsx
<div className="region region-bag">
  <div className="bag-header">
    <div className="bag-title">药 柜</div>
    <div className="bag-count">{herbs.length} 味</div>
  </div>
  <div className="bag-grid">
    {herbs.map(h => (
      <HerbTag key={h.id} herb={h}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        dragging={dragging?.id === h.id}/>
    ))}
  </div>
</div>
```

**Props**:
```typescript
interface HerbGridProps {
  herbs: HerbData[];
  onHerbSelect: (herbId: string) => void;
  disabled?: boolean;
}
```

### 4.4 VialsShelf (药瓶陈列)

**结构**:
```jsx
<div className="region region-vials">
  <button className="brew-btn" disabled={!canBrew}>
    {finished ? '煎成' : '起 锅'}
  </button>
  <div className="vials-area">
    <div className="vials-header">
      <div className="vials-title">药 剂</div>
      <div className="vials-hint">已成 {completedCount} 方</div>
    </div>
    <div className="vials-shelf">
      {vials.map((v, i) => (
        <Vial key={i} formula={v} empty={!v} glow={v && isLatest}/>
      ))}
    </div>
  </div>
</div>
```

---

## 五、像素药材数据适配

### 5.1 pixelSprite 函数迁移

**原函数** (herb-icons.jsx):
```javascript
function pixelSprite(grid, palette, px = 3) {
  const shadows = [];
  grid.forEach((row, y) => {
    [...row].forEach((ch, x) => {
      if (ch === ' ' || !palette[ch]) return;
      shadows.push(`${x * px}px ${y * px}px 0 ${palette[ch]}`);
    });
  });
  // ... 返回 div 元素
}
```

**TypeScript 改造**:
```typescript
// src/ui/html/utils/pixelSprite.ts
export function renderPixelSprite(
  grid: string[],
  palette: Record<string, string>,
  px: number = 3
): React.ReactElement {
  const shadows: string[] = [];
  grid.forEach((row, y) => {
    [...row].forEach((ch, x) => {
      if (ch === ' ' || !palette[ch]) return;
      shadows.push(`${x * px}px ${y * px}px 0 ${palette[ch]}`);
    });
  });
  return (
    <div style={{ position: 'relative', width: grid[0].length * px, height: grid.length * px }}>
      <div style={{
        position: 'absolute', width: px, height: px,
        boxShadow: shadows.join(',')
      }}/>
    </div>
  );
}
```

### 5.2 药材数据定义

**基于 herb-icons.jsx 的 HERBS 数组**:

```typescript
// src/ui/html/data/herbs.ts
export interface HerbPixelData {
  id: string;
  name: string;
  prop: string;       // 功效简称
  grid: string[];     // 像素网格
  palette: Record<string, string>;
  count: number;      // 背包数量
}

export const HERB_PIXELS: HerbPixelData[] = [
  { id: 'danggui', name: '当归', prop: '补血', grid: HERB_DANGGUI, palette: PAL_DANGGUI, count: 6 },
  // ... 共22种
];
```

**与 InventoryManager 整合**:
- `count` 字段从 `InventoryManager.herbs[id]` 动态获取
- 药材ID映射: `pixel_herb_id` ↔ `inventory_herb_id`

---

## 六、CSS迁移策略

### 6.1 样式文件拆分

| 原设计稿位置 | 目标文件 | 内容 |
|-------------|---------|------|
| 41-200行 | `variables.css` | CSS变量 (:root) |
| 94-224行 | `scroll-modal.css` | 卷轴框架样式 |
| 235-472行 | `stove.css` | 炉灶+火焰+药罐样式 |
| 473-568行 | `stove.css` | 进度条样式 |
| 569-671行 | `herbs.css` | 药牌样式 |
| 672-763行 | `vials.css` | 药瓶样式 |
| 764-1041行 | `drag-effects.css` | 拖拽效果样式 |
| 1042-1215行 | `animations.css` | 动画keyframes |

### 6.2 关键CSS保留

**必须完整迁移的样式**:
1. CSS变量 (`:root`) - 颜色主题基础
2. 卷轴框架 (`scroll-modal`, `roller`, `paper`, `seal`)
3. 像素炉灶 (`pixel-canvas`, `stove-body`, `flame`, `ember`)
4. 药罐 (`pot-wrap`, `pot-body`, `pot-liquid`, `steam`)
5. 药牌 (`tag`, `tag-plank`, `tag-count`)
6. Grid布局 (`content`, `region-*`)
7. 所有动画 (`@keyframes`)

### 6.3 样式隔离

**防止与Phaser Canvas冲突**:
```css
#decoction-react-root {
  position: fixed !important;
  top: 50% !important;
  left: 50% !important;
  transform: translate(-50%, -50%) !important;
  width: 1200px !important;
  height: 760px !important;
  overflow: hidden !important;
  z-index: 1000 !important;
  pointer-events: auto !important;
}
```

---

## 七、与 DecoctionManager 整合

### 7.1 数据流

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│  InventoryManager │────>│  DecoctionScene  │────>│  React DecoctionUI │
│  - herbs[id]: qty│     │  getAvailableHerbs│     │  props.herbs      │
└──────────────────┘     └──────────────────┘     └──────────────────┘
                                │
                                │ 事件桥接
                                ↓
                         ┌──────────────────┐
                         │ DecoctionManager │
                         │ - addHerb(id)    │
                         │ - setFireLevel() │
                         │ - complete()     │
                         │ - score_result   │
                         └──────────────────┘
```

### 7.2 关键整合点

| React Props | 数据来源 | 更新时机 |
|-------------|---------|---------|
| `herbs` | `InventoryManager.herbs` | 场景创建时 |
| `targetFormula` | `DecoctionManager.prescriptionId` | 方剂选择时 |
| `completedVials` | `DecoctionManager.history` | 完成煎药后 |
| `fireType` | `DecoctionManager.fire_level` | 火候选择时 |

### 7.3 评分逻辑对接

**React触发**:
```typescript
bridgeToPhaser(DECOCTION_EVENTS.COMPLETE, {
  herbs: selectedHerbs,
  fireType: fireType
});
```

**Phaser处理**:
```typescript
// DecoctionScene.ts
private handleComplete(data: CompleteData): void {
  const result = this.decoctionManager.complete(data.herbs, data.fireType);

  // 发送评分结果回React
  bridgeToReact(DECOCTION_EVENTS.SCORE_RESULT, {
    score: result.score,
    breakdown: result.breakdown,
    passed: result.passed
  });

  // 更新药瓶
  if (result.passed) {
    this.addCompletedVial(result.prescriptionName);
  }
}
```

---

## 八、火候系统适配

### 8.1 现有火候类型

**DecoctionManager**: `'martial' | 'civil' | 'gentle'`

**设计稿进度条**:
- 0-33%: 武火起
- 33-75%: 文火煨
- 75-100%: 将成/已煎成

### 8.2 FireSelector 组件

**设计**:
```jsx
<div className="fire-selector">
  <button className={`fire-btn martial ${fireType === 'martial' ? 'active' : ''}`}
    onClick={() => onFireChange('martial')}>
    武火
  </button>
  <button className={`fire-btn civil ${fireType === 'civil' ? 'active' : ''}`}
    onClick={() => onFireChange('civil')}>
    文火
  </button>
</div>
```

**桥接**:
```typescript
const handleFireChange = (type: FireType) => {
  bridgeToPhaser(DECOCTION_EVENTS.FIRE_SELECT, { type });
};
```

---

## 九、测试验收标准

### 9.1 视觉验收

| 检查项 | 期望结果 | 验证方法 |
|--------|---------|---------|
| Modal尺寸 | 1200×760px | 截图对比 |
| Grid布局 | 3区域正确划分 | DOM检查 |
| 炉灶渲染 | 砖墙+火焰+药罐完整 | 视觉检查 |
| 蒸汽动画 | 5个puff正确动画 | 视频录制 |
| 药牌渲染 | 22种药材完整显示 | 截图对比 |
| 药瓶陈列 | 5个瓶子+空瓶样式 | 截图对比 |
| 拖拽效果 | ghost+trail+splash | 交互测试 |

### 9.2 功能验收

| 功能 | 测试步骤 | 期望结果 |
|------|---------|---------|
| 药材拖拽 | 拖拽药牌到药罐 | 显示splash效果，药罐状态更新 |
| 正确药材 | 拖拽方剂内药材 | gold burst + stamp "合" |
| 错误药材 | 拖拽非方剂药材 | red burst + cross + shake |
| 火候选择 | 点击武火/文火 | 进度条颜色变化 |
| 完成煎药 | 点击"起锅"按钮 | 评分结果，药瓶更新 |
| 关闭场景 | 点击×按钮 | 返回ClinicScene |

### 9.3 数据验收

| 检查项 | 验证方法 |
|--------|---------|
| 药材数量同步 | React显示 = InventoryManager.herbs[id] |
| 评分逻辑 | DecoctionManager.complete() 被调用 |
| 材消耗 | 完成后 InventoryManager 减少 |

---

## 十、实施计划概要

### 10.1 阶段划分

| 阶段 | 任务数 | 内容 |
|------|--------|------|
| Phase A | 5 | CSS样式迁移 |
| Phase B | 4 | 像素数据迁移 |
| Phase C | 6 | React组件迁移 |
| Phase D | 3 | Phaser集成 |
| Phase E | 2 | 测试验收 |

### 10.2 预估工作量

- **CSS迁移**: 复制+拆分，约1200行
- **像素数据**: 22种药材grid+palette定义
- **React组件**: 8个组件TSX化改造
- **Phaser集成**: DecoctionScene改造+事件桥接
- **测试**: E2E自动化测试

---

## 附录A：设计稿关键CSS片段

### A.1 CSS变量
```css
:root{
  --ink:#2a1810;
  --paper:#e8c991;
  --cinnabar:#b8322c;
  --ember:#ff7a1a;
  --brick:#8a4a2a;
  --wood:#6b3e1f;
  --smoke:#e8dcc4;
}
```

### A.2 Grid布局
```css
.content{
  display:grid;
  grid-template-columns: 1.15fr 1fr;
  grid-template-rows: 2.2fr 1fr;
  gap:18px;
}
```

### A.3 火焰动画
```css
@keyframes flameDance{
  0%{transform:scale(1) rotate(0deg);}
  50%{transform:scale(1.12) rotate(3deg);}
  100%{transform:scale(1) rotate(0deg);}
}
```

---

## 附录B：像素药材示例

### B.1 当归 (DANGGUI)
```
grid: [
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
]
palette: { a:'#6a8c78', b:'#8ab098', c:'#8a4a2a', d:'#b86a3a', e:'#d9955a' }
```

---

**设计文档完成**
**待用户审批后进入 implementation plan 阶段**