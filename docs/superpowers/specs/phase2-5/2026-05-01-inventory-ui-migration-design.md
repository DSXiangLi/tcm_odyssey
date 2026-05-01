# 背包UI迁移设计文档

**日期**: 2026-05-01
**阶段**: Phase 2.5
**类型**: UI迁移
**参考**: docs/ui/背包/

---

## 1. 概述

将 `docs/ui/背包/` 中的古卷轴风格React组件完整迁移到 `src/ui/html/`，替换现有的Phaser Graphics实现的InventoryUI。

### 迁移目标

| 项目 | 当前实现 | 迁移目标 |
|------|----------|----------|
| 文件 | `src/ui/InventoryUI.ts` (~850行) | `src/ui/html/InventoryUI.tsx` (~600行) |
| 风格 | Neumorphism新拟态 | 古卷轴羊皮纸 |
| 视图 | 4类Tab (药材/种植/工具/知识) | 5类扇形导航 (饮片/原药/方剂/工具/图书馆) |
| 分类 | 4药袋 | 18功效分类 |
| 图片 | 无 | 25张药材PNG |

### 设计原则

1. **直接迁移**: 保持设计稿结构，不做拆分重构
2. **数据替换**: 使用设计稿的86味药材数据
3. **图片嵌入**: 25张药材图片嵌入槽位组件
4. **文字保留**: 暂不修改"百草笥"等设计稿文字

---

## 2. 文件结构

### 新增文件

```
src/ui/html/
├── inventory.css                    # 古卷轴样式 (迁移styles.css)
├── InventoryUI.tsx                  # 主组件 (合并app.jsx + 子组件)
├── inventory-entry.tsx              # React入口挂载点
├── data/
│   └── inventory-herbs.ts           # 药材数据 (迁移data.js)
└── bridge/
    └── inventory-events.ts          # Phaser交互事件
```

### 替换关系

| 设计稿文件 | 迁移目标 |
|------------|----------|
| `styles.css` | `src/ui/html/inventory.css` |
| `data.js` | `src/ui/html/data/inventory-herbs.ts` |
| `app.jsx` | `src/ui/html/InventoryUI.tsx` (主应用) |
| `view-herbs.jsx` | `InventoryUI.tsx` 内嵌 |
| `view-formula.jsx` | `InventoryUI.tsx` 内嵌 |
| `view-tool-book.jsx` | `InventoryUI.tsx` 内嵌 |
| `fan-nav.jsx` | `InventoryUI.tsx` 内嵌 |
| `components-shared.jsx` | `InventoryUI.tsx` 内嵌 |

---

## 3. 组件架构

### 主组件 InventoryUI.tsx

```typescript
// Props接口
interface InventoryUIProps {
  onClose: () => void;
}

// 内部状态
interface InventoryState {
  activeView: 'piece' | 'raw' | 'formula' | 'tool' | 'book';
  tooltipHerb: HerbData | null;
  tooltipPos: { x: number; y: number };
}

// 子组件 (全部内嵌在同一文件)
// - ScrollPanel: 卷轴面板 (左/右)
// - CenterDial: 中央扇形导航
// - HerbView: 药材视图 (饮片/原药)
// - FormulaView: 方剂视图
// - ToolView: 工具视图
// - BookView: 图书馆视图
// - SummaryPanel: 右侧摘要面板
// - HerbSlot: 药材槽位 (含图片)
// - HerbTooltip: 药材详情提示
// - FormulaCard: 方剂卡牌
```

### 扇形导航配置

```typescript
const FAN_ITEMS = [
  { id: 'piece', name: '药材饮片', glyph: '飲', desc: '炮制后的中药饮片' },
  { id: 'raw',   name: '原始药材', glyph: '原', desc: '采集的原始药材' },
  { id: 'formula', name: '方剂',   glyph: '方', desc: '配伍而成的经典方剂' },
  { id: 'tool',  name: '工具',     glyph: '器', desc: '炮制和加工的器具' },
  { id: 'book',  name: '图书馆',   glyph: '冊', desc: '医家典籍藏书' },
];
```

---

## 4. 数据结构

### 18功效分类

```typescript
const HERB_CATEGORIES = [
  { id: 'jiebiao',    name: '解表药',         glyph: '颩', color: '#7c8c5a' },
  { id: 'qingre',     name: '清热药',         glyph: '冫', color: '#3f7d8c' },
  { id: 'xiexia',     name: '泻下药',         glyph: '泻', color: '#6a4a8c' },
  { id: 'qufengshi',  name: '祛风湿药',       glyph: '风', color: '#8c6d3f' },
  { id: 'huashi',     name: '化湿药',         glyph: '湿', color: '#a89243' },
  { id: 'lishui',     name: '利水渗湿药',     glyph: '水', color: '#4a7d96' },
  { id: 'wenli',      name: '温里药',         glyph: '溫', color: '#a04a3c' },
  { id: 'liqi',       name: '理气药',         glyph: '氣', color: '#7a8a4a' },
  { id: 'xiaoshi',    name: '消食药',         glyph: '食', color: '#9c7c3a' },
  { id: 'quchong',    name: '驱虫药',         glyph: '蟲', color: '#6e7a4a' },
  { id: 'zhixue',     name: '止血药',         glyph: '血', color: '#8c3a3a' },
  { id: 'huoxue',     name: '活血化瘀药',     glyph: '瘀', color: '#a8453f' },
  { id: 'huatan',     name: '化痰止咳平喘药', glyph: '痰', color: '#5a6a8c' },
  { id: 'anshen',     name: '安神药',         glyph: '神', color: '#5a4a8a' },
  { id: 'pinggan',    name: '平肝息风药',     glyph: '風', color: '#3f6a5c' },
  { id: 'kaiqiao',    name: '开窍药',         glyph: '竅', color: '#8c5a4a' },
  { id: 'buxu',       name: '补虚药',         glyph: '補', color: '#a86a3a' },
  { id: 'shouse',     name: '收涩药',         glyph: '澀', color: '#7d4a6a' },
];
```

### 药材数据结构

```typescript
interface HerbData {
  id: string;          // 'mahuang'
  name: string;        // '麻黄'
  cat: string;         // 'jiebiao'
  xing: string;        // '温' (四气)
  wei: string;         // '辛微苦' (五味)
  gui: string;         // '肺·膀胱' (归经)
  rarity: 1|2|3|4;     // 1常见 2精良 3珍贵 4稀世
  rawCount: number;    // 原药数量
  pieceCount: number;  // 饮片数量
}
```

### 方剂数据结构

```typescript
interface FormulaData {
  id: string;
  name: string;
  class: string;       // '解表剂'
  source: string;      // '《伤寒论》'
  rarity: number;
  count: number;
  composition: string[];
  effect: string;
  indication: string;
}
```

---

## 5. 图片嵌入

### 图片资源映射

```typescript
// 图片路径: public/assets/herbs/{id}.png
const HERB_IMAGES: Record<string, string> = {
  mahuang: '/assets/herbs/mahuang.png',
  guizhi: '/assets/herbs/guizhi.png',
  shengjiang: '/assets/herbs/shengjiang.png',
  zisuye: '/assets/herbs/zisuye.png',
  baizhi: '/assets/herbs/baizhi.png',
  cangerzi: '/assets/herbs/cangerzi.png',
  xixin: '/assets/herbs/xixin.png',
  xinyi: '/assets/herbs/xinyi.png',
  bohe: '/assets/herbs/bohe.png',
  chantui: '/assets/herbs/chantui.png',
  congbai: '/assets/herbs/congbai.png',
  niubangzi: '/assets/herbs/niubangzi.png',
  chaihu: '/assets/herbs/chaihu.png',
  juhua: '/assets/herbs/juhua.png',
  manjingzi: '/assets/herbs/manjingzi.png',
  sangye: '/assets/herbs/sangye.png',
  douchi: '/assets/herbs/douchi.png',
  gegen: '/assets/herbs/gegen.png',
  jianghuang: '/assets/herbs/jianghuang.png',
  shengma: '/assets/herbs/shengma.png',
  fangfeng: '/assets/herbs/fangfeng.png',
  jingjie: '/assets/herbs/jingjie.png',
  qianghuo: '/assets/herbs/qianghuo.png',
  xiangru: '/assets/herbs/xiangru.png',
};
```

### HerbSlot组件修改

```tsx
function HerbSlot({ herb, mode, onHover, onLeave }) {
  const count = mode === 'piece' ? herb.pieceCount : herb.rawCount;
  const isEmpty = count === 0;
  const imagePath = HERB_IMAGES[herb.id];

  return (
    <div className={`slot ${isEmpty ? 'empty' : ''}`}>
      {/* 药材图片 */}
      {imagePath && !isEmpty && (
        <img
          src={imagePath}
          alt={herb.name}
          style={{
            position: 'absolute',
            inset: 8,
            objectFit: 'contain',
            opacity: 0.85,
          }}
        />
      )}
      {/* 名称覆盖层 (图片上方) */}
      <div style={{
        position: 'absolute', bottom: 20, left: 0, right: 0,
        textAlign: 'center',
        fontFamily: 'STKaiti, KaiTi, serif',
        fontSize: 14,
        color: 'var(--ink)',
      }}>{herb.name}</div>
      {/* 数量徽章 */}
      <div className={`count-badge ${isEmpty ? 'zero' : ''}`}>{count}</div>
    </div>
  );
}
```

---

## 6. Phaser集成

### 事件桥接

```typescript
// src/ui/html/bridge/inventory-events.ts
export const INVENTORY_EVENTS = {
  OPEN: 'inventory:open',
  CLOSE: 'inventory:close',
  ITEM_SELECTED: 'inventory:item_selected',
  VIEW_CHANGED: 'inventory:view_changed',
};

// 从React发送到Phaser
function bridgeToPhaser(eventName: string, data: any): void {
  const event = new CustomEvent(eventName, { detail: data });
  window.dispatchEvent(event);
}

// 从Phaser监听React事件
window.addEventListener(INVENTORY_EVENTS.ITEM_SELECTED, (e) => {
  const { itemId, view } = e.detail;
  // Phaser侧处理
});
```

### ClinicScene集成

```typescript
// src/scenes/ClinicScene.ts 修改
import { createInventoryUI } from './html/inventory-entry';

// 原代码
// const inventoryUI = new InventoryUI({ scene: this, onClose: ... });

// 新代码
const inventoryUI = createInventoryUI({
  onClose: () => this.closeInventory(),
});
```

---

## 7. CSS样式

### 关键样式迁移

```css
/* 古卷轴风视觉系统 */
:root {
  --paper-1: #f0e3c4;       /* 主羊皮纸色 */
  --paper-2: #e8d8b3;       /* 较深羊皮纸 */
  --vermilion: #b53a2c;     /* 朱砂红 */
  --ink: #1f1410;           /* 墨色 */
  --gold: #b58a3a;          /* 金色装饰 */
}

/* 羊皮纸纹理 */
.paper-tex {
  background-color: var(--paper-1);
  background-image:
    radial-gradient(circle at 12% 18%, rgba(139,95,52,0.18) 0px, transparent 3px),
    /* 老化斑点... */
}

/* 槽位 */
.slot {
  background: radial-gradient(ellipse at 30% 25%, rgba(255,240,200,0.6), transparent 60%),
              var(--slot-bg);
  border: 1px solid var(--slot-border);
  cursor: pointer;
}

/* 稀有度边框 */
.slot[data-rarity="3"]::before {
  border: 1px solid #6a3d8c;  /* 珍贵-紫 */
}

/* 数量徽章 */
.count-badge {
  position: absolute;
  bottom: 2px; right: 2px;
  background: rgba(240,227,196,0.9);
  border: 1px solid var(--ink-soft);
}
```

---

## 8. 测试计划

### E2E测试

```typescript
// tests/e2e/inventory-html-ui.spec.ts
describe('背包HTML UI', () => {
  test('打开背包显示5视图扇形导航', async () => {
    await page.goto('/?scene=clinic');
    await page.keyboard.press('b');
    await expect(page.locator('.fan-nav')).toBeVisible();
    await expect(page.locator('[data-id="piece"]')).toBeVisible();
    await expect(page.locator('[data-id="formula"]')).toBeVisible();
  });

  test('点击饮片视图显示18分类', async () => {
    await page.click('[data-id="piece"]');
    await expect(page.locator('.cat-chip')).toHaveCount(18);
  });

  test('药材槽位显示图片', async () => {
    await page.click('[data-id="piece"]');
    const slot = page.locator('.slot').first();
    await expect(slot.locator('img')).toBeVisible();
  });

  test('hover显示药材详情tooltip', async () => {
    await page.hover('.slot');
    await expect(page.locator('.herb-tooltip')).toBeVisible();
    await expect(page.locator('.herb-tooltip .name')).toContainText('麻黄');
  });
});
```

### 视觉验收

- 古卷轴羊皮纸纹理清晰
- 中央扇形导航动画流畅
- 药材图片正确嵌入槽位
- 稀有度边框颜色正确
- tooltip位置自适应边界

---

## 9. 迁移步骤

1. **创建CSS文件**: `inventory.css`
2. **创建数据文件**: `data/inventory-herbs.ts`
3. **创建主组件**: `InventoryUI.tsx` (合并所有jsx)
4. **创建入口**: `inventory-entry.tsx`
5. **创建事件桥接**: `bridge/inventory-events.ts`
6. **修改ClinicScene**: 替换InventoryUI调用
7. **删除旧文件**: `src/ui/InventoryUI.ts`

---

## 10. 验收标准

| 标准 | 验证方法 |
|------|----------|
| 5视图扇形导航 | E2E测试 |
| 18分类侧边栏 | 视觉检查 |
| 25张药材图片 | E2E测试 |
| tooltip自适应 | 手动测试 |
| 关闭按钮功能 | E2E测试 |
| Phaser事件桥接 | 单元测试 |