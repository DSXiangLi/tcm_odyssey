# 病案集与炮制游戏HTML嵌入设计

**日期**: 2026-05-06
**阶段**: Phase 2.5
**状态**: 设计完成，待实施

---

## 1. 概述

将 `docs/ui/病案集/` 和 `docs/ui/炮制/` 两个HTML小游戏嵌入到Phaser主游戏中，采用与现有煎药/诊断/背包完全一致的嵌入模式。

### 嵌入模式

- **直接React DOM挂载**（非iframe）
- **透明背景覆盖层**（Phaser继续渲染）
- **CustomEvent桥接通信**（React ↔ Phaser）
- **并行场景运行**（scene.launch而非scene.start）

### 触发入口

| 游戏 | 触发场景 | 快捷键 | 说明 |
|------|----------|--------|------|
| 病案集 | ClinicScene | `C` | 新增快捷键 |
| 炮制 | GardenScene | `P` | 沿用现有入口 |

---

## 2. 病案集详细设计

### 2.1 文件迁移

| 源文件 | 目标文件 | 改动说明 |
|--------|----------|----------|
| `docs/ui/病案集/病案集.html` | `src/ui/html/CasebookUI.tsx` | 移除HTML外壳，改为React组件 |
| `docs/ui/病案集/app.jsx` | 合并入 `CasebookUI.tsx` | 移除ReactDOM.render调用 |
| `docs/ui/病案集/data/cases.js` | `src/data/casebook-data.ts` | 转为TypeScript，添加类型定义 |
| `docs/ui/病案集/styles.css` | `src/ui/html/casebook.css` | 保持不变，确保透明背景 |

### 2.2 新增文件

```
src/ui/html/
├── casebook-entry.tsx           # mount/unmount函数
├── CasebookUI.tsx               # 主React组件
├── casebook.css                 # 样式
└── bridge/
    └── casebook-events.ts       # 事件定义

src/scenes/
└── CasebookScene.ts             # Phaser场景

src/data/
└── casebook-data.ts             # 病案数据
```

### 2.3 与诊断游戏的集成

#### 事件流程

```
病案集UI                    Phaser主游戏                 诊断游戏
   │                            │                           │
   ├─ START_CASE ─────────────→ │                           │
   │  (caseId)                  ├─ launch DiagnosisScene ──→│
   │                            │  (传入caseId)              │
   │                            │                           │
   │                            │                  完成诊断 │
   │                            │←─ DIAGNOSIS_COMPLETE ─────┤
   │                            │  (score, syndrome)        │
   │←─ CASEBOOK_RESULT ─────────┤                           │
   │  (更新病案解锁状态)          │                           │
```

#### 事件定义

```typescript
// casebook-events.ts

// 病案集 → Phaser
export const CASEBOOK_EVENTS = {
  START_CASE: 'casebook:start_case',    // 开案问诊
  REPLAY_CASE: 'casebook:replay_case',  // 重新参详
  CLOSE: 'casebook:close',              // 关闭病案集
};

// Phaser → 病案集
export const CASEBOOK_EVENTS_RESULT = 'casebook:result';
```

#### Props设计

```typescript
// CasebookUIProps
interface CasebookUIProps {
  onClose: () => void;
  initialCaseId?: string;
  progress: Record<string, string[]>;  // 已解锁病案ID列表
}
```

### 2.4 数据持久化

使用Phaser注册表存储病案进度：

```typescript
// 加载
const progress = this.registry.get('casebook_progress') || {};

// 更新
this.registry.set('casebook_progress', updatedProgress);
```

数据结构：
```typescript
interface CasebookProgress {
  [categoryId: string]: string[];  // 已解锁病案ID
}
```

---

## 3. 炮制详细设计

### 3.1 文件迁移

| 源文件 | 目标文件 | 改动说明 |
|--------|----------|----------|
| `docs/ui/炮制/paozhi.html` | `src/ui/html/PaozhiUI.tsx` | 移除HTML外壳 |
| `docs/ui/炮制/src/app.jsx` | `src/ui/html/paozhi/PaozhiUI.tsx` | 移除调试面板 |
| `docs/ui/炮制/src/data.jsx` | `src/data/paozhi-data.ts` | 转为TypeScript |
| `docs/ui/炮制/src/*.jsx` | `src/ui/html/paozhi/*.tsx` | 各组件独立文件 |
| HTML内嵌CSS | `src/ui/html/paozhi.css` | 提取为独立CSS |

### 3.2 新增文件

```
src/ui/html/
├── paozhi-entry.tsx             # mount/unmount函数
├── paozhi.css                   # 全局样式
└── paozhi/
    ├── PaozhiUI.tsx             # 主组件
    ├── atoms.tsx                # 基础组件
    ├── vessels.tsx              # 器皿架
    ├── inventory.tsx            # 药材库
    ├── animations.tsx           # 炮制动画
    └── scroll.tsx               # 任务卷轴

src/ui/html/bridge/
└── paozhi-events.ts             # 事件定义

src/scenes/
└── PaozhiScene.ts               # Phaser场景

src/data/
└── paozhi-data.ts               # 炮制数据
```

### 3.3 与背包系统的集成

#### 事件流程

```
炮制UI                     Phaser主游戏                背包系统
   │                           │                           │
   │                  完成炮制 │                           │
   ├─ PAOZHI_COMPLETE ─────────→│                           │
   │  (herbId, quality)         │                           │
   │                           ├─ INVENTORY_ADD ───────────→│
   │                           │  (炮制品数据)               │
   │←─ PAOZHI_ADDED ────────────┤←─ 添加成功 ───────────────┤
```

#### 事件定义

```typescript
// paozhi-events.ts

// 炮制 → Phaser
export const PAOZHI_EVENTS = {
  COMPLETE: 'paozhi:complete',
  CLOSE: 'paozhi:close',
};

// Phaser → 炮制
export const PAOZHI_ADDED = 'paozhi:added';
```

#### 炮制完成数据

```typescript
interface PaozhiResult {
  herbId: string;
  quality: number;    // 0.4 ~ 0.95
  recipeId: string;
}
```

### 3.4 背包数据扩展

```typescript
// 扩展 InventoryItem
interface InventoryItem {
  id: string;
  type: 'herb' | 'processed_herb';  // 新增
  name: string;
  quality?: number;                  // 新增（仅processed_herb）
  recipe?: string;                   // 新增（炮制配方来源）
  icon: string;
  quantity: number;
}
```

---

## 4. 场景集成

### 4.1 ClinicScene修改

**新增快捷键 `C`**：

```typescript
// create() 中添加
this.input.keyboard.on('keydown-C', () => {
  if (this.isTransitioning) return;
  this.isTransitioning = true;
  this.scene.launch(SCENES.CASEBOOK, {});
});

// 事件监听
this.setupCasebookListeners();
```

### 4.2 GardenScene修改

**连接 `P` 键到 PaozhiScene**：

```typescript
// 修改现有P键处理
this.input.keyboard.on('keydown-P', () => {
  if (this.isTransitioning) return;
  this.isTransitioning = true;
  this.scene.launch(SCENES.PAOZHI, {});
});
```

### 4.3 场景注册

```typescript
// src/constants/scenes.ts
export const SCENES = {
  // ... 现有场景
  CASEBOOK: 'CasebookScene',
  PAOZHI: 'PaozhiScene',
};
```

### 4.4 CasebookScene生命周期

```typescript
class CasebookScene extends Phaser.Scene {
  private reactRoot: Root | null = null;
  private container: HTMLElement | null = null;
  private eventListeners: EventListener[] = [];

  create() {
    this.container = document.createElement('div');
    this.container.id = 'casebook-react-root';
    document.body.appendChild(this.container);

    const progress = this.registry.get('casebook_progress') || {};
    this.reactRoot = mountCasebookUI(this.container, {
      onClose: () => this.closeScene(),
      initialCaseId: this.data.get('caseId'),
      progress,
    });

    this.setupEventListeners();
  }

  private setupEventListeners() {
    // START_CASE → 启动诊断
    // REPLAY_CASE → 启动诊断
    // DIAGNOSIS_COMPLETE → 更新进度
  }

  shutdown() {
    this.cleanup();
  }

  private cleanup() {
    if (this.reactRoot) unmountCasebookUI(this.reactRoot);
    if (this.container) this.container.remove();
    this.removeEventListeners();
  }
}
```

### 4.5 PaozhiScene生命周期

```typescript
class PaozhiScene extends Phaser.Scene {
  // 相同的结构
  // 监听 PAOZHI_COMPLETE → 添加到背包
  // 监听 PAOZHI_CLOSE → 关闭场景
}
```

---

## 5. CSS关键样式

### 5.1 透明背景嵌入

```css
/* casebook.css / paozhi.css */

/* 容器 - 固定定位，覆盖全屏 */
#casebook-react-root,
#paozhi-react-root {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  justify-content: center;
  align-items: center;
}

/* 背景层 - 透明以显示底层Phaser */
.casebook-backdrop,
.paozhi-backdrop {
  position: fixed;
  inset: 0;
  background: transparent;  /* 关键：不遮挡游戏 */
}
```

---

## 6. 测试策略

### 6.1 E2E测试场景

#### 病案集测试
1. 诊所场景按 `C` 键
2. 病案集UI打开
3. 点击病案卡片
4. 触发诊断游戏
5. 完成诊断
6. 返回病案集，验证解锁状态更新

#### 炮制测试
1. 茶园场景按 `P` 键
2. 炮制UI打开
3. 拖拽药材到工作台
4. 选择器皿
5. 开始炮制
6. 完成后验证背包添加炮制品

### 6.2 测试文件

```
tests/e2e/
├── casebook-flow.spec.ts
└── paozhi-flow.spec.ts
```

---

## 7. 实现顺序

1. **病案集**
   - 创建事件定义和entry文件
   - 迁移React组件和CSS
   - 创建CasebookScene
   - ClinicScene添加C键触发
   - 实现与诊断游戏的桥接
   - E2E测试

2. **炮制**
   - 创建事件定义和entry文件
   - 迁移React组件和CSS
   - 创建PaozhiScene
   - GardenScene连接P键
   - 实现与背包系统的桥接
   - 扩展背包数据结构
   - E2E测试

---

## 8. 验收标准

- [ ] 病案集可从诊所C键打开
- [ ] 病案集点击"开案问诊"触发诊断
- [ ] 诊断完成后病案解锁状态更新
- [ ] 炮制可从药园P键打开
- [ ] 炮制完成后炮制品添加到背包
- [ ] 背包正确显示炮制品品质
- [ ] E2E测试全部通过
- [ ] 无内存泄漏（React正确卸载）