# 药灵山谷 - Phase 2.5 煎药 UI HTML 嵌入方案设计

**版本**: v1.0
**日期**: 2026-04-24
**状态**: 设计规范

---

## 1. 设计背景

### 1.1 问题陈述

Phase 2.5 煎药 UI 视觉优化使用 Phaser Graphics API 实现后，验收发现：
- 锅位置与设计稿不一致
- CSS 高级特性无法用 Graphics API 复现
- 视觉效果与设计稿差距明显

### 1.2 设计目标

将现有 HTML/CSS/React 设计稿 (`docs/ui/煎药小游戏/decoction.html`) 嵌入 Phaser 游戏，实现：
- 100% 复现设计稿视觉效果
- 完整保留 CSS 动画特性
- 保持游戏逻辑交互完整性
- 低耦合的桥接通信架构

---

## 2. 架构设计

### 2.1 整体架构

```
┌─────────────────────────────────────────────────┐
│  DecoctionScene (Phaser)                         │
│                                                  │
│  ┌─────────────────────────────────────────────┐│
│  │  scene.add.dom() 嵌入 React 组件             ││
│  │                                              ││
│  │  ┌────────────────────────────────────────┐ ││
│  │  │  DecoctionHTMLUI (React 800×600)        │ ││
│  │  │                                         │ ││
│  │  │  ┌──────────────┐  ┌─────────────────┐ │ ││
│  │  │  │ HearthStove  │  │ HerbGrid        │ │ ││
│  │  │  │ (炉灶360×300)│  │ (药材400×500)   │ │ ││
│  │  │  │              │  │                 │ │ ││
│  │  │  │ MedicinePot  │  │ FireSelector    │ │ ││
│  │  │  │ (叠加药罐)   │  │ (火候选择)      │ │ ││
│  │  │  │              │  │                 │ │ ││
│  │  │  │ SuccessStamp │  │                 │ │ ││
│  │  │  │ (成功印章)   │  │                 │ │ ││
│  │  │  └──────────────┘  └─────────────────┘ │ ││
│  │  │                                         │ ││
│  │  │  ↕️ CustomEvent 桥接                     │ ││
│  │  └────────────────────────────────────────┘ ││
│  │                                              ││
│  └─────────────────────────────────────────────┘│
│                                                  │
│  ┌─────────────────────────────────────────────┐│
│  │  DecoctionManager (游戏逻辑)                 ││
│  │  - 药材匹配验证                              ││
│  │  - 评分计算                                  ││
│  │  - 状态管理                                  ││
│  └─────────────────────────────────────────────┘│
│                                                  │
│  window.addEventListener (桥接监听)              │
└─────────────────────────────────────────────────┘
```

### 2.2 技术选型

| 层级 | 技术 | 原因 |
|-----|------|------|
| UI渲染 | React 18 + CSS | 设计稿已有完整实现 |
| 嵌入方式 | Phaser DOM Element | 官方支持，性能稳定 |
| 通信桥接 | CustomEvent | 轻量、解耦、标准API |
| 构建方式 | Vite预构建 | 单独入口，加载完整bundle |

---

## 3. React 组件设计

### 3.1 组件结构

```
src/ui/html/
├── DecoctionHTMLUI.tsx       # 根容器 (800×600)
├── components/
│   ├── HearthStove.tsx       # 炉灶区 (360×300)
│   ├── MedicinePot.tsx       # 药罐动画 (叠加)
│   ├── HerbGrid.tsx          # 药材网格 (400×500)
│   ├── FireSelector.tsx      # 火候选择器
│   ├── SuccessStamp.tsx      # 成功印章动效
│   └── HerbTag.tsx           # 药牌组件 (可拖拽)
├── styles/
│   ├── hearth.css            # 炉灶样式 + 动画
│   ├── pot.css               # 药罐样式 + 动画
│   ├── herbs.css             # 药材样式 + 拖拽
│   ├── animations.css        # 共享动画定义
│   └── theme.css             # 配色变量
├── hooks/
│   ├── useDragBridge.ts      # 拖拽事件桥接
│   └── usePhaserListener.ts  # Phaser事件监听
├── bridge/
│   └── events.ts             # 事件常量定义
│   └ dispatcher.ts           # 事件发送器
└── types/
│   └── index.ts              # TypeScript类型定义
```

### 3.2 根容器 DecoctionHTMLUI

```tsx
// src/ui/html/DecoctionHTMLUI.tsx
interface DecoctionHTMLUIProps {
  herbs: HerbData[];           // 可用药材列表
  targetPrescription: string;  // 目标方剂
  onComplete: () => void;
  onClose: () => void;
}

const DecoctionHTMLUI: React.FC<DecoctionHTMLUIProps> = (props) => {
  const [selectedHerbs, setSelectedHerbs] = useState<string[]>([]);
  const [fireType, setFireType] = useState<'martial' | 'gentle'>('martial');
  const [showSuccess, setShowSuccess] = useState(false);

  // 监听 Phaser 发来的成功/失败事件
  usePhaserListener(DECOCTION_EVENTS.RESULT, (data) => {
    setShowSuccess(data.success);
  });

  return (
    <div className="decoction-ui" style={{ width: 800, height: 600 }}>
      <div className="left-panel">
        <HearthStove />
        <MedicinePot herbs={selectedHerbs} />
        {showSuccess && <SuccessStamp />}
      </div>
      <div className="right-panel">
        <HerbGrid
          herbs={props.herbs}
          onHerbSelect={(herbId) => {
            setSelectedHerbs([...selectedHerbs, herbId]);
            bridgeToPhaser(DECOCTION_EVENTS.HERB_DROP, { herbId });
          }}
        />
        <FireSelector
          value={fireType}
          onChange={(type) => {
            setFireType(type);
            bridgeToPhaser(DECOCTION_EVENTS.FIRE_SELECT, { type });
          }}
        />
      </div>
      <button className="close-btn" onClick={props.onClose}>×</button>
    </div>
  );
};
```

### 3.3 炉灶组件 HearthStove

```tsx
// src/ui/html/components/HearthStove.tsx
const HearthStove: React.FC = () => {
  return (
    <div className="hearth-stove">
      {/* 砖墙背景 */}
      <div className="brick-wall">
        {/* CSS 渐变 + 灰缝网格 */}
      </div>

      {/* 火焰开口 */}
      <div className="fire-opening">
        {/* CSS radial-gradient 模拟拱形 */}
      </div>

      {/* 4个动态火焰 */}
      <div className="flames-container">
        <div className="flame flame-1" />
        <div className="flame flame-2" />
        <div className="flame flame-3" />
        <div className="flame flame-4" />
      </div>

      {/* 火星粒子 */}
      <div className="embers-container">
        <div className="ember ember-1" />
        <div className="ember ember-2" />
        {/* 更多火星... */}
      </div>

      {/* 地面阴影 */}
      <div className="ground-shadow" />
    </div>
  );
};
```

### 3.4 药罐组件 MedicinePot

```tsx
// src/ui/html/components/MedicinePot.tsx
interface MedicinePotProps {
  herbs: string[];  // 已投入药材
}

const MedicinePot: React.FC<MedicinePotProps> = ({ herbs }) => {
  const [isStirring, setIsStirring] = useState(false);

  useEffect(() => {
    if (herbs.length > 0) {
      setIsStirring(true);
      setTimeout(() => setIsStirring(false), 2000);
    }
  }, [herbs]);

  return (
    <div className="medicine-pot">
      {/* 罐身 */}
      <div className="pot-body">
        {/* CSS 水平渐变 + 内阴影 */}
      </div>

      {/* 罐口边缘 */}
      <div className="pot-rim">
        {/* CSS 垂直渐变 + 高光 */}
      </div>

      {/* 药液表面 */}
      <div className="liquid-surface">
        {/* CSS 渐变 + 波纹条纹 + ripple 动画 */}
      </div>

      {/* 双把手 */}
      <div className="pot-handle handle-left" />
      <div className="pot-handle handle-right" />

      {/* 蒸汽效果 */}
      <div className="steam-container">
        <div className="steam steam-1" />
        <div className="steam steam-2" />
        {/* 更多蒸汽团... */}
      </div>

      {/* 搅拌勺 */}
      {isStirring && <div className="ladle stir-animation" />}
    </div>
  );
};
```

### 3.5 药材网格 HerbGrid

```tsx
// src/ui/html/components/HerbGrid.tsx
interface HerbGridProps {
  herbs: HerbData[];
  onHerbSelect: (herbId: string) => void;
}

const HerbGrid: React.FC<HerbGridProps> = ({ herbs, onHerbSelect }) => {
  const [draggingHerb, setDraggingHerb] = useState<string | null>(null);

  const handleDragStart = (herbId: string) => {
    setDraggingHerb(herbId);
    bridgeToPhaser(DECOCTION_EVENTS.HERB_DRAG_START, { herbId });
  };

  const handleDragEnd = () => {
    setDraggingHerb(null);
    bridgeToPhaser(DECOCTION_EVENTS.HERB_DRAG_END, {});
  };

  return (
    <div className="herb-grid">
      <div className="target-hint">
        目标方剂：{/* 显示目标方剂名称 */}
      </div>
      <div className="herb-list">
        {herbs.map((herb) => (
          <HerbTag
            key={herb.id}
            herb={herb}
            draggable
            onDragStart={() => handleDragStart(herb.id)}
            onDragEnd={handleDragEnd}
            onClick={() => onHerbSelect(herb.id)}
          />
        ))}
      </div>
    </div>
  );
};
```

### 3.6 药牌组件 HerbTag

```tsx
// src/ui/html/components/HerbTag.tsx
interface HerbTagProps {
  herb: HerbData;
  onDragStart: () => void;
  onDragEnd: () => void;
  onClick: () => void;
}

const HerbTag: React.FC<HerbTagProps> = ({
  herb,
  onDragStart,
  onDragEnd,
  onClick
}) => {
  return (
    <div
      className="herb-tag"
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onClick}
    >
      {/* 悬绳 */}
      <div className="hanging-string" />

      {/* 木牌 */}
      <div className="wood-tag">
        {/* 像素图标 */}
        <div className="herb-icon">
          {/* 使用 pixel-herbs.ts 数据渲染 */}
        </div>

        {/* 药名 */}
        <span className="herb-name">{herb.name}</span>

        {/* 属性 */}
        <span className="herb-property">
          {herb.nature} | {herb.meridian}
        </span>
      </div>

      {/* 数量角标 */}
      <div className="quantity-badge">{herb.quantity}</div>
    </div>
  );
};
```

---

## 4. CSS 动画迁移策略

### 4.1 动画提取

从 `docs/ui/煎药小游戏/decoction.html` 提取以下关键帧动画：

| 动画名 | 原CSS定义 | 迁移目标 |
|-------|----------|---------|
| `flameDance` | `@keyframes flameDance` | `animations.css` → `.flame` |
| `emberRise` | `@keyframes emberRise` | `animations.css` → `.ember` |
| `liquidRipple` | `@keyframes liquidRipple` | `animations.css` → `.liquid-surface` |
| `steamRise` | `@keyframes steamRise` | `animations.css` → `.steam` |
| `stir` | `@keyframes stir` | `animations.css` → `.ladle` |
| `goldPulse` | `@keyframes goldPulse` | `animations.css` → `.success-stamp` |
| `stampIn` | `@keyframes stampIn` | `animations.css` → `.success-stamp` |

### 4.2 共享动画文件

```css
// src/ui/html/styles/animations.css

/* 火焰舞动动画 */
@keyframes flameDance {
  0%, 100% { transform: scaleY(1) scaleX(1); }
  25% { transform: scaleY(0.85) scaleX(1.1); }
  50% { transform: scaleY(1.1) scaleX(0.9); }
  75% { transform: scaleY(0.95) scaleX(1.05); }
}

/* 火星上升动画 */
@keyframes emberRise {
  0% {
    opacity: 1;
    transform: translateY(0) translateX(0);
  }
  50% {
    opacity: 0.6;
    transform: translateY(-90px) translateX(5px);
  }
  100% {
    opacity: 0;
    transform: translateY(-180px) translateX(-5px);
  }
}

/* 药液波纹动画 */
@keyframes liquidRipple {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

/* 蒸汽上升动画 */
@keyframes steamRise {
  0% {
    opacity: 0.8;
    transform: translateY(0) scale(1);
  }
  50% {
    opacity: 0.4;
    transform: translateY(-30px) scale(1.1);
  }
  100% {
    opacity: 0;
    transform: translateY(-60px) scale(1.2);
  }
}

/* 搅拌动画 */
@keyframes stir {
  0%, 100% { transform: rotate(-15deg); }
  50% { transform: rotate(15deg); }
}

/* 成功印章脉冲 */
@keyframes goldPulse {
  0%, 100% {
    opacity: 0.9;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.05);
  }
}

/* 印章入场 */
@keyframes stampIn {
  0% {
    opacity: 0;
    transform: scale(2) rotate(-20deg);
  }
  60% {
    opacity: 1;
    transform: scale(0.95) rotate(5deg);
  }
  100% {
    opacity: 1;
    transform: scale(1) rotate(0deg);
  }
}
```

### 4.3 样式组织

```css
// src/ui/html/styles/hearth.css
.hearth-stove {
  position: relative;
  width: 360px;
  height: 204px;
  background: linear-gradient(180deg, #5a4030 0%, #4a3020 100%);
  border-radius: 8px;
}

.brick-wall {
  /* 砖墙纹理：CSS 渐变 + 灰缝网格 */
  background:
    linear-gradient(180deg, #6a5040 0%, #5a4030 50%, #4a3020 100%),
    repeating-linear-gradient(
      90deg,
      transparent 0px,
      transparent 45px,
      #3a2818 45px,
      #3a2818 50px
    );
}

.flame {
  width: 20px;
  height: 60px;
  background: radial-gradient(ellipse at bottom, #ff6b35 0%, #ff4500 40%, #ff0000 70%, transparent 100%);
  animation: flameDance 0.8s ease-in-out infinite;
}

.flame-1 { animation-delay: 0s; }
.flame-2 { animation-delay: 0.2s; }
.flame-3 { animation-delay: 0.4s; }
.flame-4 { animation-delay: 0.6s; }

.ember {
  width: 4px;
  height: 4px;
  background: #ff6b35;
  border-radius: 50%;
  box-shadow: 0 0 4px #ff4500;
  animation: emberRise 2s ease-out infinite;
}
```

---

## 5. 事件桥接设计

### 5.1 事件定义

```typescript
// src/ui/html/bridge/events.ts

export const DECOCTION_EVENTS = {
  // HTML → Phaser
  HERB_DRAG_START: 'decoction:herb:dragstart',
  HERB_DRAG_END: 'decoction:herb:dragend',
  HERB_DROP: 'decoction:herb:drop',
  FIRE_SELECT: 'decoction:fire:select',
  COMPLETE: 'decoction:complete',
  CLOSE: 'decoction:close',

  // Phaser → HTML
  RESULT: 'decoction:result',
  RESET: 'decoction:reset',
  STATE_UPDATE: 'decoction:state:update'
};

export interface HerbDropData {
  herbId: string;
  position?: { x: number; y: number };
}

export interface FireSelectData {
  type: 'martial' | 'gentle';
}

export interface ResultData {
  success: boolean;
  score: number;
  feedback?: string;
}
```

### 5.2 事件发送器

```typescript
// src/ui/html/bridge/dispatcher.ts

import { DECOCTION_EVENTS } from './events';

/**
 * HTML → Phaser 事件发送
 * 使用 CustomEvent 通过 window 对象传递
 */
export function bridgeToPhaser<T = any>(event: string, data: T): void {
  const customEvent = new CustomEvent(event, {
    detail: data,
    bubbles: true
  });
  window.dispatchEvent(customEvent);
}
```

### 5.3 React Hook 监听器

```typescript
// src/ui/html/hooks/usePhaserListener.ts

import { useEffect } from 'react';

/**
 * React 组件监听 Phaser 发来的事件
 */
export function usePhaserListener<T = any>(
  event: string,
  handler: (data: T) => void
): void {
  useEffect(() => {
    const listener = (e: Event) => {
      const customEvent = e as CustomEvent<T>;
      handler(customEvent.detail);
    };

    window.addEventListener(event, listener);

    return () => {
      window.removeEventListener(event, listener);
    };
  }, [event, handler]);
}
```

### 5.4 拖拽事件 Hook

```typescript
// src/ui/html/hooks/useDragBridge.ts

import { useState, useCallback } from 'react';
import { bridgeToPhaser } from '../bridge/dispatcher';
import { DECOCTION_EVENTS } from '../bridge/events';

export function useDragBridge() {
  const [isDragging, setIsDragging] = useState(false);
  const [dragData, setDragData] = useState<any>(null);

  const startDrag = useCallback((herbId: string) => {
    setIsDragging(true);
    setDragData({ herbId });
    bridgeToPhaser(DECOCTION_EVENTS.HERB_DRAG_START, { herbId });
  }, []);

  const endDrag = useCallback(() => {
    setIsDragging(false);
    setDragData(null);
    bridgeToPhaser(DECOCTION_EVENTS.HERB_DRAG_END, {});
  }, []);

  const dropHerb = useCallback((herbId: string) => {
    bridgeToPhaser(DECOCTION_EVENTS.HERB_DROP, { herbId });
    endDrag();
  }, [endDrag]);

  return {
    isDragging,
    dragData,
    startDrag,
    endDrag,
    dropHerb
  };
}
```

---

## 6. Phaser 集成设计

### 6.1 DecoctionScene 改造

```typescript
// src/scenes/DecoctionScene.ts

import { DECOCTION_EVENTS } from '../ui/html/bridge/events';

export class DecoctionScene extends Phaser.Scene {
  private domElement: Phaser.GameObjects.DOMElement;
  private manager: DecoctionManager;

  create() {
    // 创建 DOM 元素容器
    const htmlContent = this.createHTMLContainer();

    // 使用 Phaser DOM Element 嵌入
    this.domElement = this.add.dom(512, 384, htmlContent);

    // 监听 HTML 发来的事件
    this.setupEventListeners();

    // 初始化游戏逻辑管理器
    this.manager = new DecoctionManager(this);
  }

  private createHTMLContainer(): HTMLElement {
    // 创建容器 div
    const container = document.createElement('div');
    container.id = 'decoction-react-root';
    container.style.width = '800px';
    container.style.height = '600px';

    // React 组件将通过 Vite 预构建后挂载
    return container;
  }

  private setupEventListeners() {
    // 监听药材投放事件
    window.addEventListener(
      DECOCTION_EVENTS.HERB_DROP,
      this.handleHerbDrop.bind(this)
    );

    // 监听火候选择事件
    window.addEventListener(
      DECOCTION_EVENTS.FIRE_SELECT,
      this.handleFireSelect.bind(this)
    );

    // 监听关闭事件
    window.addEventListener(
      DECOCTION_EVENTS.CLOSE,
      this.handleClose.bind(this)
    );
  }

  private handleHerbDrop(event: CustomEvent) {
    const { herbId } = event.detail;
    const result = this.manager.addHerb(herbId);

    // 发送结果回 HTML
    this.sendResultToHTML(result);
  }

  private sendResultToHTML(result: ResultData) {
    window.dispatchEvent(
      new CustomEvent(DECOCTION_EVENTS.RESULT, { detail: result })
    );
  }
}
```

### 6.2 React 挂载时机

```typescript
// src/ui/html/mount.ts

import { createRoot } from 'react-dom/client';
import DecoctionHTMLUI from './DecoctionHTMLUI';
import { bridgeToPhaser } from './bridge/dispatcher';
import { DECOCTION_EVENTS } from './bridge/events';

/**
 * 在 Phaser DOM 元素创建后挂载 React
 */
export function mountDecoctionUI(
  container: HTMLElement,
  props: DecoctionHTMLUIProps
) {
  const root = createRoot(container);
  root.render(
    <DecoctionHTMLUI
      {...props}
      onClose={() => bridgeToPhaser(DECOCTION_EVENTS.CLOSE, {})}
    />
  );

  return root;
}

/**
 * 卸载 React 组件
 */
export function unmountDecoctionUI(root: Root) {
  root.unmount();
}
```

---

## 7. Vite 构建配置

### 7.1 多入口配置

```typescript
// vite.config.ts

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: 'src/main.ts',
        decoctionUI: 'src/ui/html/decoction-entry.ts'
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: 'chunks/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]'
      }
    }
  }
});
```

### 7.2 React 入口文件

```typescript
// src/ui/html/decoction-entry.ts

import DecoctionHTMLUI from './DecoctionHTMLUI';
import { mountDecoctionUI } from './mount';

// 导出挂载函数供 Phaser 使用
export { mountDecoctionUI };

// 导出组件供外部使用
export { DecoctionHTMLUI };
```

### 7.3 CSS 处理

```typescript
// vite.config.ts CSS 配置

css: {
  modules: {
    localsConvention: 'camelCase'
  },
  preprocessorOptions: {
    css: {
      // 确保动画 keyframes 不被重命名
      preserveKeyframes: true
    }
  }
}
```

---

## 8. 数据接口设计

### 8.1 TypeScript 类型定义

```typescript
// src/ui/html/types/index.ts

export interface HerbData {
  id: string;
  name: string;
  nature: string;       // 性味：寒/热/温/凉/平
  meridian: string;     // 归经：肺/脾/肾...
  quantity: number;
  pixelGrid?: number[][]; // 像素图标网格数据
}

export interface PrescriptionHint {
  name: string;
  composition: string[]; // 方剂组成药材ID列表
}

export interface DecoctionState {
  selectedHerbs: string[];
  fireType: 'martial' | 'gentle';
  elapsedTime: number;
  isComplete: boolean;
}

export interface ScoreResult {
  compositionScore: number;  // 组成评分 (50%)
  fireScore: number;         // 火候评分 (30%)
  timeScore: number;         // 时间评分 (20%)
  totalScore: number;
  feedback: string;
}
```

### 8.2 数据来源

- **药材数据**: 复用 `src/data/pixel-herbs.ts` (22种药材)
- **方剂数据**: 复用 `src/data/prescriptions.json`
- **背包数据**: 通过 `InventoryManager` 获取当前可用药材

---

## 9. 性能考量

### 9.1 潜在问题

| 问题 | 影响 | 解决方案 |
|-----|------|---------|
| DOM 元素渲染开销 | 可能影响 Phaser 渲染帧率 | 设置 `preserveGameObject: true` |
| CSS 动画 vs Phaser tween | 两套动画系统并存 | CSS 动画仅用于静态视觉，交互用 Phaser |
| React 状态更新频率 | 频繁更新可能卡顿 | 使用防抖/节流，减少不必要的重渲染 |
| 内存占用 | React + Phaser 双内存 | 组件卸载时彻底清理，避免内存泄漏 |

### 9.2 性能优化策略

```typescript
// React 组件优化示例

const HerbGrid: React.FC<HerbGridProps> = ({ herbs, onHerbSelect }) => {
  // 使用 useMemo 缓存计算结果
  const sortedHerbs = useMemo(
    () => herbs.sort((a, b) => a.name.localeCompare(b.name)),
    [herbs]
  );

  // 使用 useCallback 缓存回调
  const handleSelect = useCallback(
    (herbId: string) => onHerbSelect(herbId),
    [onHerbSelect]
  );

  return (
    <div className="herb-grid">
      {sortedHerbs.map((herb) => (
        <HerbTag
          key={herb.id}
          herb={herb}
          onSelect={handleSelect}
        />
      ))}
    </div>
  );
};
```

---

## 10. 测试验收标准

### 10.1 视觉验收

| 维度 | 权重 | 验收标准 |
|-----|------|---------|
| 炉灶视觉效果 | 20% | 砖墙纹理、火焰动画、火星效果清晰 |
| 药罐视觉效果 | 20% | 罐身渐变、药液波纹、蒸汽动画流畅 |
| 药牌组件清晰度 | 15% | 像素图标、药名、属性、数量可读 |
| 配色协调度 | 15% | 与设计稿配色100%一致 |
| 动画流畅度 | 15% | 所有CSS动画无卡顿 |
| 整体风格一致性 | 15% | 符合中医游戏视觉定位 |

### 10.2 功能验收

| 功能 | 验收标准 |
|-----|---------|
| 药材拖拽 | 拖拽开始/结束/投放事件正确触发 |
| 火候选择 | 武火/文火切换正确，状态同步 |
| 评分计算 | 与 DecoctionManager 评分逻辑一致 |
| 场景退出 | ESC/关闭按钮正确返回诊所场景 |

### 10.3 桥接验收

| 桥接点 | 验收标准 |
|-----|---------|
| HTML→Phaser | 所有 CustomEvent 正确触发和接收 |
| Phaser→HTML | Result/Reset 事件正确更新 React 状态 |
| 双向同步 | 状态在两边保持一致 |

---

## 11. 实现顺序建议

### 11.1 分阶段实现

1. **阶段一：基础设施**
   - 创建目录结构
   - 配置 Vite 多入口
   - 创建桥接模块 (events.ts, dispatcher.ts)
   - 创建类型定义

2. **阶段二：视觉组件**
   - 提取 CSS 动画到 animations.css
   - 实现 HearthStove 组件
   - 实现 MedicinePot 组件
   - 实现 HerbTag 组件
   - 实现 FireSelector 组件
   - 实现 SuccessStamp 组件

3. **阶段三：容器组件**
   - 实现 HerbGrid 容器
   - 实现 DecoctionHTMLUI 根容器
   - 创建 hooks (useDragBridge, usePhaserListener)

4. **阶段四：Phaser 集成**
   - 改造 DecoctionScene
   - 实现 DOM 元素嵌入
   - 设置事件监听
   - 实现挂载/卸载流程

5. **阶段五：测试验收**
   - 视觉验收测试
   - 功能验收测试
   - 桥接验收测试
   - 性能测试

---

## 12. 风险评估

| 风险 | 影响 | 缓解措施 |
|-----|------|---------|
| Phaser DOM 兼容性问题 | 部分浏览器可能不支持 | 添加兼容性检测，提供降级方案 |
| CSS 动画与 Phaser 动画冲突 | 视觉不一致 | 明确分工：CSS静态视觉，Phaser交互动画 |
| React 内存泄漏 | 长时间运行内存增长 | 确保组件卸载时彻底清理 |
| 事件桥接延迟 | 交互响应慢 | 优化事件处理，减少不必要的转发 |

---

## 13. 总结

本设计方案将现有 HTML/CSS/React 设计稿完整嵌入 Phaser 游戏，通过：
- **Phaser DOM Element** 实现 UI 嵌入
- **CustomEvent 桥接** 实现双向通信
- **CSS 动画保留** 实现 100% 视觉复现
- **React 组件化** 实现代码可维护性

相比 Phaser Graphics API 方案，HTML 嵌入方案能：
- 精确复现设计稿视觉效果
- 利用 CSS 高级特性（渐变、阴影、滤镜）
- 降低视觉实现复杂度
- 提高代码可维护性

---

*本文档由 Claude Code 创建，更新于 2026-04-24*