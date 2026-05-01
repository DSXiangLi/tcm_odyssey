# 背包UI迁移实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将古卷轴风格背包UI从设计稿迁移到src/ui/html/，替换现有Phaser Graphics实现

**Architecture:** React组件挂载在HTML DOM层，通过CustomEvent与Phaser场景通信；数据使用设计稿86味药材结构；图片嵌入HerbSlot组件

**Tech Stack:** React 18, TypeScript, CSS Variables, CustomEvent Bridge, Vite

---

## 文件结构

```
src/ui/html/
├── inventory.css                    # 古卷轴样式 (~450行，迁移styles.css)
├── InventoryUI.tsx                  # 主组件 (~800行，合并所有jsx)
├── inventory-entry.tsx              # React入口挂载 (~30行)
├── data/
│   └── inventory-herbs.ts           # 药材数据 (~220行)
└── bridge/
    └── inventory-events.ts          # Phaser交互事件 (~40行)

tests/e2e/
└── inventory-html-ui.spec.ts        # E2E测试 (~60行)
```

---

## Task 1: 创建药材数据文件

**Files:**
- Create: `src/ui/html/data/inventory-herbs.ts`
- Test: 无（数据文件无需单独测试）

- [ ] **Step 1: 创建数据文件**

```typescript
// src/ui/html/data/inventory-herbs.ts
/**
 * 背包药材数据 - 迁移自 docs/ui/背包/data.js
 */

// 18功效分类
export const HERB_CATEGORIES = [
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

// 药材数据结构
export interface HerbData {
  id: string;
  name: string;
  cat: string;
  xing: string;
  wei: string;
  gui: string;
  rarity: 1|2|3|4;
  rawCount: number;
  pieceCount: number;
}

// 紧凑数据格式
const _herbRows: [string, string, string, string, string, string, number, number, number][] = [
  // 解表药
  ['mahuang','麻黄','jiebiao','温','辛微苦','肺·膀胱',2,12,8],
  ['guizhi','桂枝','jiebiao','温','辛甘','心·肺·膀胱',1,8,15],
  ['zisuye','紫苏叶','jiebiao','温','辛','肺·脾',1,5,7],
  ['jingjie','荆芥','jiebiao','微温','辛','肺·肝',1,3,4],
  ['fangfeng','防风','jiebiao','微温','辛甘','膀胱·肝·脾',2,0,6],
  ['bohe','薄荷','jiebiao','凉','辛','肺·肝',1,14,9],
  ['juhua','菊花','jiebiao','微寒','甘苦','肺·肝',1,9,12],
  ['gegen','葛根','jiebiao','凉','甘辛','脾·胃',2,4,2],
  ['chaihu','柴胡','jiebiao','凉','苦辛','肝·胆',2,2,5],
  // 清热药
  ['shigao','石膏','qingre','大寒','甘辛','肺·胃',1,7,3],
  ['zhimu','知母','qingre','寒','苦甘','肺·胃·肾',2,5,8],
  ['huangqin','黄芩','qingre','寒','苦','肺·胆·脾',2,11,6],
  ['huanglian','黄连','qingre','寒','苦','心·脾·胃',3,3,4],
  ['huangbai','黄柏','qingre','寒','苦','肾·膀胱',2,6,2],
  ['jinyinhua','金银花','qingre','寒','甘','肺·心·胃',1,18,11],
  ['lianqiao','连翘','qingre','微寒','苦','肺·心·小肠',1,10,5],
  // ... (完整86味数据，见docs/ui/背包/data.js)
];

// 转换为完整对象
export const HERBS: HerbData[] = _herbRows.map(r => ({
  id: r[0], name: r[1], cat: r[2], xing: r[3], wei: r[4], gui: r[5],
  rarity: r[6] as 1|2|3|4, rawCount: r[7], pieceCount: r[8]
}));

// 图片路径映射
export const HERB_IMAGES: Record<string, string> = {
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

// 方剂数据
export interface FormulaData {
  id: string;
  name: string;
  class: string;
  source: string;
  rarity: number;
  count: number;
  composition: string[];
  effect: string;
  indication: string;
}

export const FORMULAS: FormulaData[] = [
  { id: 'guizhitang', name: '桂枝汤', class: '解表剂', source: '《伤寒论》', rarity: 2, count: 3,
    composition: ['桂枝','芍药','甘草','生姜','大枣'],
    effect: '解肌发表，调和营卫', indication: '外感风寒表虚证' },
  { id: 'mahuangtang', name: '麻黄汤', class: '解表剂', source: '《伤寒论》', rarity: 2, count: 2,
    composition: ['麻黄','桂枝','杏仁','甘草'],
    effect: '发汗解表，宣肺平喘', indication: '外感风寒表实证' },
  // ... (完整12方剂)
];

// 工具数据
export interface ToolData {
  id: string;
  name: string;
  tier: number;
  count: number;
  desc: string;
}

export const TOOLS: ToolData[] = [
  { id: 'yaonian', name: '药碾', tier: 2, count: 1, desc: '用以碾压药材成粉。可加工根茎类。' },
  { id: 'yaochu', name: '药杵臼', tier: 1, count: 1, desc: '捣碎草本与种子。' },
  // ... (完整12工具)
];

// 图书数据
export interface BookData {
  id: string;
  name: string;
  dynasty: string;
  tier: number;
  owned: boolean;
  progress: number;
  desc: string;
}

export const BOOKS: BookData[] = [
  { id: 'huangdineijing', name: '黄帝内经', dynasty: '先秦', tier: 4, owned: true, progress: 78,
    desc: '中医理论奠基之作。素问、灵枢两部，论阴阳五行、脏腑经络。' },
  { id: 'shanghanlun', name: '伤寒论', dynasty: '东汉·张仲景', tier: 4, owned: true, progress: 100,
    desc: '六经辨证之祖。' },
  // ... (完整12图书)
];

// 扇形导航配置
export const FAN_ITEMS = [
  { id: 'piece', name: '药材饮片', sub: 'PROCESSED', glyph: '飲', desc: '炮制后的中药饮片' },
  { id: 'raw',   name: '原始药材', sub: 'RAW',       glyph: '原', desc: '采集的原始药材' },
  { id: 'formula', name: '方剂',   sub: 'FORMULAE',  glyph: '方', desc: '配伍而成的经典方剂' },
  { id: 'tool',  name: '工具',     sub: 'IMPLEMENTS',glyph: '器', desc: '炮制和加工的器具' },
  { id: 'book',  name: '图书馆',   sub: 'LIBRARY',   glyph: '冊', desc: '医家典籍藏书' },
];
```

- [ ] **Step 2: Commit数据文件**

```bash
git add src/ui/html/data/inventory-herbs.ts
git commit -m "feat(inventory): add herbs data with 18 categories and 86 items

- Migrate from docs/ui/背包/data.js
- Include HERB_CATEGORIES, HERBS, FORMULAS, TOOLS, BOOKS
- Add HERB_IMAGES mapping for 25 PNG assets
- Add FAN_ITEMS for 5-view navigation

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 2: 创建CSS样式文件

**Files:**
- Create: `src/ui/html/inventory.css`
- Test: 无（CSS文件无需单独测试）

- [ ] **Step 1: 创建CSS文件**

```css
/* src/ui/html/inventory.css */
/* 古卷轴风视觉系统 - 迁移自 docs/ui/背包/styles.css */

:root {
  --paper-1: #f0e3c4;
  --paper-2: #e8d8b3;
  --paper-3: #d9c599;
  --paper-edge: #b89866;
  --paper-dark: #8b7244;
  --ink: #1f1410;
  --ink-soft: #4a3826;
  --ink-light: #7a5d3e;
  --vermilion: #b53a2c;
  --vermilion-deep: #8a2a1f;
  --gold: #b58a3a;
  --gold-deep: #8a6520;
  --jade: #5b7a52;
  --indigo: #2a4666;
  --slot-empty: #c4ad7e;
  --slot-bg: #ead6a8;
  --slot-border: #8b7244;
  --shadow-deep: rgba(60, 40, 15, 0.45);
  --shadow-soft: rgba(60, 40, 15, 0.18);
}

@font-face {
  font-family: 'song-fallback';
  src: local('Songti SC'), local('STSong'), local('SimSun'), local('FangSong'), local('Noto Serif CJK SC');
}

* { box-sizing: border-box; margin: 0; padding: 0; }

.inventory-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: 100;
}

.inventory-root {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Noto Serif SC', 'Songti SC', 'STSong', 'SimSun', serif;
  color: var(--ink);
  -webkit-font-smoothing: antialiased;
  z-index: 101;
}

.inventory-container {
  width: 100%;
  height: 100%;
  max-width: 1480px;
  max-height: 920px;
  display: grid;
  grid-template-columns: '1fr 280px 1fr';
  gap: 0;
  position: relative;
}

/* 卷轴面板 */
.scroll-panel {
  position: relative;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.scroll-rod-top {
  height: 22px;
  flex-shrink: 0;
  background: linear-gradient(180deg, #8b6520 0%, #b58a3a 30%, #5a3e15 70%, #3a2810 100%);
  border-radius: 4px 4px 0 0;
  box-shadow: 0 4px 8px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,220,150,0.3);
}

.scroll-rod-bottom {
  height: 22px;
  flex-shrink: 0;
  background: linear-gradient(180deg, #3a2810 0%, #5a3e15 30%, #b58a3a 70%, #8b6520 100%);
  border-radius: 0 0 4px 4px;
  box-shadow: 0 -4px 8px rgba(0,0,0,0.5), inset 0 -1px 0 rgba(255,220,150,0.3);
}

.paper-tex {
  flex: 1;
  position: relative;
  background-color: var(--paper-1);
  background-image:
    radial-gradient(circle at 12% 18%, rgba(139,95,52,0.18) 0px, transparent 3px),
    radial-gradient(circle at 78% 32%, rgba(139,95,52,0.14) 0px, transparent 5px),
    radial-gradient(circle at 23% 67%, rgba(139,95,52,0.16) 0px, transparent 4px),
    radial-gradient(ellipse at 0% 0%, rgba(139,95,52,0.35), transparent 40%),
    linear-gradient(135deg, #efe1c0, #e6d3a4 50%, #ebd9ab);
  box-shadow: inset 0 0 30px rgba(139,95,52,0.3), 0 0 0 1px var(--paper-dark);
  overflow: hidden;
}

/* 槽位 */
.slot {
  position: relative;
  background:
    radial-gradient(ellipse at 30% 25%, rgba(255,240,200,0.6), transparent 60%),
    var(--slot-bg);
  border: 1px solid var(--slot-border);
  outline: 1px solid var(--paper-dark);
  outline-offset: -4px;
  cursor: pointer;
  transition: transform 120ms ease, box-shadow 120ms ease;
  user-select: none;
  overflow: hidden;
  aspect-ratio: 1 / 1;
}

.slot:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 12px var(--shadow-deep);
  z-index: 5;
}

.slot.selected {
  box-shadow:
    0 0 0 2px var(--vermilion),
    0 0 0 4px var(--paper-1),
    0 0 0 5px var(--vermilion),
    0 8px 16px var(--shadow-deep);
  z-index: 6;
}

.slot.empty {
  background: repeating-linear-gradient(
    45deg,
    rgba(139,100,50,0.18) 0 6px,
    rgba(139,100,50,0.08) 6px 12px
  ), var(--slot-empty);
  cursor: default;
}

.slot.empty:hover { transform: none; box-shadow: none; }

/* 稀有度 */
.slot[data-rarity="2"] { border-color: #4a7a8c; }
.slot[data-rarity="3"] { border-color: #6a3d8c; }
.slot[data-rarity="4"] { border-color: #b58a3a; }

/* 数量徽章 */
.count-badge {
  position: absolute;
  bottom: 2px; right: 2px;
  font-family: 'STKaiti','KaiTi', serif;
  font-size: 13px;
  font-weight: 700;
  color: var(--ink);
  background: rgba(240,227,196,0.9);
  padding: 0 5px;
  border: 1px solid var(--ink-soft);
  border-radius: 1px;
  line-height: 16px;
  min-width: 18px;
  text-align: center;
}

.count-badge.zero { color: var(--paper-dark); background: rgba(200,180,140,0.7); }

/* tooltip */
.herb-tooltip {
  position: fixed;
  pointer-events: none;
  z-index: 200;
  width: 260px;
  padding: 14px 16px 12px;
  background-color: var(--paper-1);
  border: 1px solid var(--paper-dark);
  outline: 1px solid var(--paper-dark);
  outline-offset: 3px;
  box-shadow: 0 16px 40px rgba(0,0,0,0.6);
  font-size: 13px;
  line-height: 1.5;
}

.herb-tooltip .name {
  font-size: 22px;
  font-weight: 900;
  font-family: 'STKaiti','KaiTi', serif;
  margin-bottom: 2px;
}

.herb-tooltip .pinyin { font-size: 11px; color: var(--ink-light); }

/* 滚动条 */
.scroll-area::-webkit-scrollbar { width: 10px; }
.scroll-area::-webkit-scrollbar-track {
  background: var(--paper-3);
  border-left: 1px solid var(--paper-dark);
}
.scroll-area::-webkit-scrollbar-thumb {
  background: var(--paper-dark);
  border-radius: 1px;
  border: 2px solid var(--paper-3);
}

/* 分类印章 */
.cat-chip {
  margin-bottom: 6px;
  padding: 6px 4px;
  text-align: center;
  cursor: pointer;
  transition: all 150ms;
}

.cat-chip.active {
  border: 1px solid currentColor;
  outline: 1px solid var(--paper-dark);
  outline-offset: 2px;
}

/* 方剂卡牌 */
.formula-card {
  background: linear-gradient(180deg, var(--paper-1), var(--paper-2));
  border: 1px solid var(--paper-dark);
  outline: 1px solid var(--paper-dark);
  outline-offset: 3px;
  padding: 14px 12px 12px;
  cursor: pointer;
  transition: transform 150ms ease, box-shadow 150ms ease;
  min-height: 220px;
}

.formula-card:hover { transform: translateY(-3px); box-shadow: 0 10px 20px var(--shadow-deep); }

/* 书架卷宗 */
.book-spine {
  position: relative;
  height: 220px;
  width: 56px;
  border-radius: 2px 2px 0 0;
  cursor: pointer;
  transition: transform 200ms;
  padding: 14px 6px 12px;
  font-family: 'STKaiti','KaiTi', serif;
  color: var(--paper-1);
  text-shadow: 0 1px 2px rgba(0,0,0,0.6);
}

.book-spine:hover { transform: translateY(-8px); }

.book-spine .spine-title {
  writing-mode: vertical-rl;
  font-size: 16px;
  font-weight: 900;
}

.book-spine.locked {
  filter: grayscale(0.7) brightness(0.6);
  cursor: default;
}

/* 工具卡 */
.tool-card {
  background: var(--paper-2);
  border: 1px solid var(--paper-dark);
  outline: 1px solid var(--paper-dark);
  outline-offset: 3px;
  padding: 12px;
  display: flex;
  gap: 12px;
  cursor: pointer;
  transition: transform 120ms;
}

.tool-card:hover { transform: translateY(-2px); }
```

- [ ] **Step 2: Commit CSS文件**

```bash
git add src/ui/html/inventory.css
git commit -m "feat(inventory): add scroll-style CSS with paper texture

- Migrate from docs/ui/背包/styles.css
- CSS variables for paper, ink, vermilion colors
- Slot styling with rarity borders
- Tooltip, scrollbar, card styles

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 3: 创建事件桥接文件

**Files:**
- Create: `src/ui/html/bridge/inventory-events.ts`
- Test: 无（事件桥接测试将在E2E中覆盖）

- [ ] **Step 1: 创建事件桥接文件**

```typescript
// src/ui/html/bridge/inventory-events.ts
/**
 * 背包UI与Phaser的事件桥接
 */

export const INVENTORY_EVENTS = {
  OPEN: 'inventory:open',
  CLOSE: 'inventory:close',
  ITEM_SELECTED: 'inventory:item_selected',
  VIEW_CHANGED: 'inventory:view_changed',
};

export interface InventoryEventData {
  itemId?: string;
  view?: 'piece' | 'raw' | 'formula' | 'tool' | 'book';
}

/**
 * 从React发送事件到Phaser
 */
export function bridgeToPhaser(eventName: string, data: InventoryEventData): void {
  const event = new CustomEvent(eventName, { detail: data });
  window.dispatchEvent(event);
}

/**
 * 创建事件监听器清理函数
 */
export function createEventListener(
  eventName: string,
  handler: (data: InventoryEventData) => void
): () => void {
  const listener = (e: Event) => {
    const customEvent = e as CustomEvent<InventoryEventData>;
    handler(customEvent.detail);
  };
  window.addEventListener(eventName, listener);
  return () => window.removeEventListener(eventName, listener);
}
```

- [ ] **Step 2: Commit事件桥接文件**

```bash
git add src/ui/html/bridge/inventory-events.ts
git commit -m "feat(inventory): add Phaser-React event bridge

- INVENTORY_EVENTS constants
- bridgeToPhaser for React->Phaser communication
- createEventListener with cleanup

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 4: 创建E2E测试文件（TDD第一步）

**Files:**
- Create: `tests/e2e/inventory-html-ui.spec.ts`

- [ ] **Step 1: 创建测试文件**

```typescript
// tests/e2e/inventory-html-ui.spec.ts
import { test, expect } from '@playwright/test';

test.describe('背包HTML UI', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?scene=clinic');
    await page.waitForSelector('[data-testid="clinic-ready"]', { timeout: 15000 });
  });

  test('按B键打开背包显示扇形导航', async ({ page }) => {
    await page.keyboard.press('b');

    // 等待背包UI显示
    await expect(page.locator('.inventory-root')).toBeVisible({ timeout: 3000 });

    // 验证扇形导航显示
    await expect(page.locator('.fan-nav')).toBeVisible();

    // 验证5个花瓣存在
    await expect(page.locator('[data-fan-id="piece"]')).toBeVisible();
    await expect(page.locator('[data-fan-id="raw"]')).toBeVisible();
    await expect(page.locator('[data-fan-id="formula"]')).toBeVisible();
    await expect(page.locator('[data-fan-id="tool"]')).toBeVisible();
    await expect(page.locator('[data-fan-id="book"]')).toBeVisible();
  });

  test('点击饮片视图显示18分类侧边栏', async ({ page }) => {
    await page.keyboard.press('b');
    await expect(page.locator('.inventory-root')).toBeVisible();

    // 点击饮片花瓣
    await page.click('[data-fan-id="piece"]');

    // 验证分类侧边栏
    const catChips = page.locator('.cat-chip');
    await expect(catChips).toHaveCount(19); // 全部 + 18分类
  });

  test('药材槽位显示图片', async ({ page }) => {
    await page.keyboard.press('b');
    await expect(page.locator('.inventory-root')).toBeVisible();

    await page.click('[data-fan-id="piece"]');

    // 找到有图片的槽位
    const slot = page.locator('.slot').first();
    const img = slot.locator('img');

    // 验证图片可见（如果药材有图片）
    const hasImage = await img.count() > 0;
    if (hasImage) {
      await expect(img).toBeVisible();
    }
  });

  test('hover显示药材详情tooltip', async ({ page }) => {
    await page.keyboard.press('b');
    await expect(page.locator('.inventory-root')).toBeVisible();

    await page.click('[data-fan-id="piece"]');

    // hover第一个非空槽位
    const slot = page.locator('.slot:not(.empty)').first();
    await slot.hover();

    // 验证tooltip显示
    await expect(page.locator('.herb-tooltip')).toBeVisible({ timeout: 2000 });

    // 验证tooltip包含药材名称
    const tooltipName = page.locator('.herb-tooltip .name');
    await expect(tooltipName).not.toBeEmpty();
  });

  test('点击关闭按钮关闭背包', async ({ page }) => {
    await page.keyboard.press('b');
    await expect(page.locator('.inventory-root')).toBeVisible();

    // 点击关闭按钮
    await page.click('.inventory-close-btn');

    // 验证背包关闭
    await expect(page.locator('.inventory-root')).not.toBeVisible();
  });

  test('按ESC键关闭背包', async ({ page }) => {
    await page.keyboard.press('b');
    await expect(page.locator('.inventory-root')).toBeVisible();

    // 按ESC
    await page.keyboard.press('Escape');

    // 验证背包关闭
    await expect(page.locator('.inventory-root')).not.toBeVisible();
  });
});
```

- [ ] **Step 2: 运行测试验证失败**

```bash
npx playwright test tests/e2e/inventory-html-ui.spec.ts --reporter=list
```

Expected: 所有测试FAIL（组件未实现）

- [ ] **Step 3: Commit测试文件**

```bash
git add tests/e2e/inventory-html-ui.spec.ts
git commit -m "test(inventory): add E2E tests for HTML UI

- Test B key opens inventory with fan nav
- Test 18 category sidebar
- Test herb images in slots
- Test tooltip on hover
- Test close button and ESC key

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 5: 创建主组件InventoryUI.tsx（合并所有jsx）

**Files:**
- Create: `src/ui/html/InventoryUI.tsx`
- Test: Task 4的E2E测试

- [ ] **Step 1: 创建主组件框架**

```typescript
// src/ui/html/InventoryUI.tsx
/**
 * 背包UI主组件 - 迁移自 docs/ui/背包/app.jsx 及所有子组件
 *
 * 设计原则: 直接使用设计稿，合并所有jsx为单一文件
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  HERB_CATEGORIES, HERBS, FORMULAS, TOOLS, BOOKS, FAN_ITEMS,
  HERB_IMAGES, HerbData, FormulaData, ToolData, BookData
} from './data/inventory-herbs';
import { INVENTORY_EVENTS, bridgeToPhaser } from './bridge/inventory-events';
import './inventory.css';

// ============================================================================
// Props接口
// ============================================================================

interface InventoryUIProps {
  onClose: () => void;
}

type ViewType = 'piece' | 'raw' | 'formula' | 'tool' | 'book';

interface TooltipState {
  herb: HerbData | null;
  x: number;
  y: number;
}

// ============================================================================
// 共享组件
// ============================================================================

function HerbTooltip({ herb, x, y }: TooltipState): React.ReactElement | null {
  if (!herb) return null;

  const cat = HERB_CATEGORIES.find(c => c.id === herb.cat);
  const RARITY_NAMES = ['', '常见', '精良', '珍贵', '稀世'];
  const RARITY_SEAL: Record<number, string> = { 1: '#8a7548', 2: '#4a7a8c', 3: '#6a3d8c', 4: '#b58a3a' };

  const flipX = x > (window.innerWidth - 290);
  const flipY = y > (window.innerHeight - 240);
  const left = flipX ? x - 280 : x + 18;
  const top = flipY ? y - 220 : y + 18;

  return (
    <div className="herb-tooltip" style={{ left, top }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <div>
          <div className="name">{herb.name}</div>
          <div className="pinyin">{cat?.name.replace('药', '')}</div>
        </div>
        <div style={{
          fontSize: 10, color: '#fff', fontWeight: 900,
          background: RARITY_SEAL[herb.rarity], padding: '2px 5px',
        }}>{RARITY_NAMES[herb.rarity]}</div>
      </div>
      <div style={{ height: 1, background: 'var(--vermilion)', margin: '8px 0', opacity: 0.6 }} />
      <div style={{ display: 'flex', gap: 10, fontSize: 12, margin: '3px 0' }}>
        <span style={{ color: 'var(--ink-light)', width: 32 }}>性</span>
        <span style={{ color: `var(--xing-${herb.xing})` || 'var(--ink)' }}>{herb.xing}</span>
      </div>
      <div style={{ display: 'flex', gap: 10, fontSize: 12, margin: '3px 0' }}>
        <span style={{ color: 'var(--ink-light)', width: 32 }}>味</span>
        <span>{herb.wei}</span>
      </div>
      <div style={{ display: 'flex', gap: 10, fontSize: 12, margin: '3px 0' }}>
        <span style={{ color: 'var(--ink-light)', width: 32 }}>归经</span>
        <span>{herb.gui}</span>
      </div>
    </div>
  );
}

function HerbSlot({ herb, mode, onHover, onLeave }: {
  herb: HerbData;
  mode: 'piece' | 'raw';
  onHover: (herb: HerbData, e: React.MouseEvent) => void;
  onLeave: () => void;
}): React.ReactElement {
  const count = mode === 'piece' ? herb.pieceCount : herb.rawCount;
  const isEmpty = count === 0;
  const imagePath = HERB_IMAGES[herb.id];

  return (
    <div
      className={`slot ${isEmpty ? 'empty' : ''}`}
      data-rarity={herb.rarity}
      onMouseEnter={(e) => onHover(herb, e)}
      onMouseMove={(e) => onHover(herb, e)}
      onMouseLeave={onLeave}
      style={{ aspectRatio: '1 / 1' }}
    >
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
      <div style={{
        position: 'absolute', bottom: 20, left: 0, right: 0,
        textAlign: 'center',
        fontFamily: 'STKaiti, KaiTi, serif',
        fontSize: 14,
        color: isEmpty ? 'rgba(60,40,15,0.35)' : 'var(--ink)',
      }}>{herb.name}</div>
      <div className={`count-badge ${isEmpty ? 'zero' : ''}`}>{count}</div>
    </div>
  );
}

// ============================================================================
// 药材视图 (饮片/原药)
// ============================================================================

function HerbView({ mode, onHover, onLeave }: {
  mode: 'piece' | 'raw';
  onHover: (herb: HerbData, e: React.MouseEvent) => void;
  onLeave: () => void;
}): React.ReactElement {
  const [filter, setFilter] = useState<string>('all');
  const [showEmpty, setShowEmpty] = useState(true);

  const byCategory = useMemo(() => {
    const map: Record<string, HerbData[]> = {};
    HERB_CATEGORIES.forEach(c => map[c.id] = []);
    HERBS.forEach(h => { if (map[h.cat]) map[h.cat].push(h); });
    return map;
  }, []);

  const visibleCats = filter === 'all'
    ? HERB_CATEGORIES
    : HERB_CATEGORIES.filter(c => c.id === filter);

  return (
    <div style={{ display: 'flex', height: '100%' }}>
      {/* 左侧分类印章列 */}
      <div style={{
        width: 96, flexShrink: 0,
        borderRight: '1px solid var(--paper-dark)',
        padding: '8px 6px',
        overflowY: 'auto',
      }} className="scroll-area">
        <CatChip
          active={filter === 'all'}
          onClick={() => setFilter('all')}
          label="全部"
          glyph="全"
          color="var(--vermilion)"
        />
        {HERB_CATEGORIES.map(c => {
          const total = byCategory[c.id].reduce(
            (s, h) => s + (mode === 'piece' ? h.pieceCount : h.rawCount), 0
          );
          return (
            <CatChip
              key={c.id}
              active={filter === c.id}
              onClick={() => setFilter(c.id)}
              label={c.name.replace('药', '')}
              glyph={c.glyph}
              color={c.color}
              count={total}
            />
          );
        })}
      </div>

      {/* 右侧药材区 */}
      <div className="scroll-area" style={{
        flex: 1, overflowY: 'auto',
        padding: '20px 28px 28px',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 18,
        }}>
          <div>
            <div style={{
              fontFamily: 'STKaiti, KaiTi, serif',
              fontSize: 28, fontWeight: 900,
              letterSpacing: '0.2em', color: 'var(--ink)',
            }}>{mode === 'piece' ? '药材饮片' : '原始药材'}</div>
          </div>
          <label style={{ fontSize: 11, color: 'var(--ink-light)', cursor: 'pointer' }}>
            <input type="checkbox" checked={showEmpty}
              onChange={e => setShowEmpty(e.target.checked)}
              style={{ accentColor: 'var(--vermilion)' }} />
            显示未藏
          </label>
        </div>

        {visibleCats.map(cat => {
          const herbs = byCategory[cat.id].filter(h => {
            if (showEmpty) return true;
            return (mode === 'piece' ? h.pieceCount : h.rawCount) > 0;
          });
          if (herbs.length === 0) return null;

          return (
            <div key={cat.id} style={{ marginBottom: 24 }}>
              <ChapterHeadStyled cat={cat} />
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(78px, 1fr))',
                gap: 8,
              }}>
                {herbs.map(h => (
                  <HerbSlot
                    key={h.id} herb={h} mode={mode}
                    onHover={onHover} onLeave={onLeave}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CatChip({ active, onClick, label, glyph, color, count }: {
  active: boolean;
  onClick: () => void;
  label: string;
  glyph: string;
  color: string;
  count?: number;
}): React.ReactElement {
  return (
    <div
      onClick={onClick}
      className={`cat-chip ${active ? 'active' : ''}`}
      style={{
        background: active ? color : 'transparent',
        color: active ? 'var(--paper-1)' : 'var(--ink)',
      }}
    >
      <div style={{
        fontFamily: 'STKaiti, KaiTi, serif',
        fontSize: 22, fontWeight: 900,
        lineHeight: 1,
        color: active ? 'var(--paper-1)' : color,
      }}>{glyph}</div>
      <div style={{
        fontFamily: 'STKaiti, KaiTi, serif',
        fontSize: 11, fontWeight: 700,
      }}>{label}</div>
      {count != null && (
        <div style={{ fontSize: 9, color: active ? 'rgba(255,255,255,0.7)' : 'var(--ink-light)' }}>
          {count}
        </div>
      )}
    </div>
  );
}

function ChapterHeadStyled({ cat }: { cat: { id: string; name: string; glyph: string; color: string } }): React.ReactElement {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      marginBottom: 10,
    }}>
      <div style={{
        width: 30, height: 30,
        background: cat.color,
        color: 'var(--paper-1)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'STKaiti, KaiTi, serif',
        fontSize: 18, fontWeight: 900,
      }}>{cat.glyph}</div>
      <div style={{
        fontFamily: 'STKaiti, KaiTi, serif',
        fontSize: 19, fontWeight: 900,
        letterSpacing: '0.15em', color: 'var(--ink)',
      }}>{cat.name}</div>
      <div style={{
        flex: 1, height: 1,
        background: `linear-gradient(90deg, ${cat.color}88, transparent)`,
      }} />
    </div>
  );
}

// ============================================================================
// 方剂视图
// ============================================================================

function FormulaView(): React.ReactElement {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="scroll-area" style={{
      height: '100%', overflowY: 'auto',
      padding: '24px 32px',
    }}>
      <div style={{
        fontFamily: 'STKaiti, KaiTi, serif',
        fontSize: 28, fontWeight: 900,
        letterSpacing: '0.2em', color: 'var(--ink)',
        marginBottom: 18,
      }}>方剂</div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
        gap: 16,
      }}>
        {FORMULAS.map(f => (
          <FormulaCard
            key={f.id} formula={f}
            selected={selected === f.id}
            onClick={() => setSelected(selected === f.id ? null : f.id)}
          />
        ))}
      </div>
    </div>
  );
}

function FormulaCard({ formula, selected, onClick }: {
  formula: FormulaData;
  selected: boolean;
  onClick: () => void;
}): React.ReactElement {
  const isEmpty = formula.count === 0;

  return (
    <div className="formula-card" onClick={onClick}
      style={{
        opacity: isEmpty ? 0.55 : 1,
        boxShadow: selected ? '0 0 0 2px var(--vermilion), 0 0 0 4px var(--paper-1), 0 0 0 5px var(--vermilion)' : undefined,
      }}
    >
      <div style={{
        fontFamily: 'STKaiti, KaiTi, serif',
        fontSize: 28, fontWeight: 900,
        letterSpacing: '0.1em', color: 'var(--ink)',
        textAlign: 'center', margin: '6px 0',
      }}>{formula.name}</div>
      <div style={{
        fontSize: 10, color: 'var(--ink-light)',
        textAlign: 'center', marginBottom: 10,
      }}>{formula.source}</div>
      <div style={{
        fontSize: 12, lineHeight: 1.5, color: 'var(--ink-soft)',
        textAlign: 'center',
      }}>{formula.composition.join(' · ')}</div>
      <div style={{
        fontSize: 11, fontWeight: 700,
        color: 'var(--ink)', textAlign: 'center',
        fontFamily: 'STKaiti, KaiTi, serif',
        marginTop: 8,
      }}>{formula.effect}</div>
    </div>
  );
}

// ============================================================================
// 工具视图
// ============================================================================

function ToolView(): React.ReactElement {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="scroll-area" style={{
      height: '100%', overflowY: 'auto',
      padding: '24px 32px',
    }}>
      <div style={{
        fontFamily: 'STKaiti, KaiTi, serif',
        fontSize: 28, fontWeight: 900,
        letterSpacing: '0.2em', color: 'var(--ink)',
        marginBottom: 18,
      }}>工具</div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: 12,
      }}>
        {TOOLS.map(t => (
          <ToolCard
            key={t.id} tool={t}
            selected={selected === t.id}
            onClick={() => setSelected(selected === t.id ? null : t.id)}
          />
        ))}
      </div>
    </div>
  );
}

function ToolCard({ tool, selected, onClick }: {
  tool: ToolData;
  selected: boolean;
  onClick: () => void;
}): React.ReactElement {
  const isEmpty = tool.count === 0;
  const tierColor = ['', '#8a7548', '#4a7a8c', '#b58a3a'][tool.tier] || '#8a7548';

  return (
    <div className="tool-card" onClick={onClick}
      style={{
        opacity: isEmpty ? 0.55 : 1,
        boxShadow: selected ? '0 0 0 2px var(--vermilion)' : undefined,
      }}
    >
      <div className="icon" style={{
        width: 60, height: 60,
        background: 'var(--paper-3)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'STKaiti, KaiTi, serif',
        fontSize: 28, color: 'var(--ink-soft)',
      }}>{tool.name.charAt(0)}</div>
      <div style={{ flex: 1 }}>
        <div style={{
          fontFamily: 'STKaiti, KaiTi, serif',
          fontSize: 18, fontWeight: 900,
          color: 'var(--ink)',
        }}>{tool.name}</div>
        <div style={{
          fontSize: 11, color: 'var(--ink-soft)',
          lineHeight: 1.5,
        }}>{tool.desc}</div>
      </div>
    </div>
  );
}

// ============================================================================
// 图书馆视图
// ============================================================================

function BookView(): React.ReactElement {
  const [selected, setSelected] = useState<string | null>(null);
  const cur = BOOKS.find(b => b.id === selected);

  return (
    <div className="scroll-area" style={{
      height: '100%', overflowY: 'auto',
      padding: '24px 32px',
    }}>
      <div style={{
        fontFamily: 'STKaiti, KaiTi, serif',
        fontSize: 28, fontWeight: 900,
        letterSpacing: '0.2em', color: 'var(--ink)',
        marginBottom: 18,
      }}>图书馆</div>

      <div style={{
        display: 'flex', gap: 6,
      }}>
        {BOOKS.map((b, i) => (
          <BookSpine
            key={b.id} book={b}
            color={['#5b3a2a', '#3a4a5a', '#5a4a2a', '#4a2a3a'][i % 4]}
            selected={selected === b.id}
            onClick={() => b.owned && setSelected(b.id)}
          />
        ))}
      </div>

      {cur && (
        <div style={{
          marginTop: 18,
          padding: '18px',
          background: 'var(--paper-2)',
          border: '1px solid var(--paper-dark)',
        }}>
          <div style={{
            fontFamily: 'STKaiti, KaiTi, serif',
            fontSize: 24, fontWeight: 900,
            textAlign: 'center',
          }}>{cur.name}</div>
          <div style={{
            fontSize: 11, color: 'var(--ink-light)',
            textAlign: 'center',
          }}>{cur.dynasty}</div>
          <div style={{
            fontSize: 12, lineHeight: 1.7,
            color: 'var(--ink-soft)',
            marginTop: 12,
          }}>{cur.desc}</div>
        </div>
      )}
    </div>
  );
}

function BookSpine({ book, color, selected, onClick }: {
  book: BookData;
  color: string;
  selected: boolean;
  onClick: () => void;
}): React.ReactElement {
  return (
    <div
      className={`book-spine ${!book.owned ? 'locked' : ''}`}
      onClick={onClick}
      style={{
        background: `linear-gradient(180deg, ${color} 0%, color-mix(in srgb, ${color}, black 40%) 100%)`,
        height: 180 + book.tier * 10,
        outline: selected ? '2px solid var(--vermilion)' : undefined,
      }}
    >
      <div className="spine-title">{book.name}</div>
    </div>
  );
}

// ============================================================================
// 中央扇形导航
// ============================================================================

function CenterDial({ active, setActive }: {
  active: ViewType;
  setActive: (view: ViewType) => void;
}): React.ReactElement {
  const N = 5;
  const radius = 105;

  return (
    <div style={{
      position: 'relative',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {/* 中心圆 */}
      <div style={{
        width: 110, height: 110,
        borderRadius: '50%',
        background: 'radial-gradient(circle, var(--paper-1) 0%, var(--paper-2) 70%)',
        border: '2px solid var(--paper-dark)',
        boxShadow: '0 0 0 4px var(--paper-1), 0 0 0 5px var(--paper-dark)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column',
      }}>
        <div style={{
          fontFamily: 'STKaiti, KaiTi, serif',
          fontSize: 28, fontWeight: 900,
          color: 'var(--vermilion)',
        }}>百草</div>
        <div style={{
          fontFamily: 'STKaiti, KaiTi, serif',
          fontSize: 11,
          color: 'var(--ink-light)',
        }}>笥</div>
      </div>

      {/* 5个花瓣 */}
      {FAN_ITEMS.map((item, i) => {
        const angle = -90 + i * (360 / N);
        const rad = (angle * Math.PI) / 180;
        const x = Math.cos(rad) * radius;
        const y = Math.sin(rad) * radius;
        const isActive = active === item.id;

        return (
          <div
            key={item.id}
            data-fan-id={item.id}
            onClick={() => setActive(item.id as ViewType)}
            style={{
              position: 'absolute',
              left: '50%', top: '50%',
              transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
              width: 78, height: 78,
              cursor: 'pointer',
              transition: 'transform 200ms',
            }}
          >
            <div style={{
              width: '100%', height: '100%',
              borderRadius: '50%',
              background: isActive
                ? 'radial-gradient(circle, #d8492f, var(--vermilion), var(--vermilion-deep))'
                : 'radial-gradient(circle, var(--paper-1), var(--paper-2), var(--paper-3))',
              border: `2px solid ${isActive ? 'var(--vermilion-deep)' : 'var(--paper-dark)'}`,
              boxShadow: isActive
                ? '0 0 0 3px var(--paper-1), 0 0 0 4px var(--vermilion)'
                : '0 0 0 3px var(--paper-1), 0 0 0 4px var(--paper-dark)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexDirection: 'column',
              fontFamily: 'STKaiti, KaiTi, serif',
              color: isActive ? 'var(--paper-1)' : 'var(--ink)',
              transform: isActive ? 'scale(1.08)' : 'scale(1)',
            }}>
              <div style={{ fontSize: 26, fontWeight: 900 }}>{item.glyph}</div>
              <div style={{ fontSize: 10, fontWeight: 700 }}>{item.name}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================================
// 摘要面板
// ============================================================================

function SummaryPanel({ active }: { active: ViewType }): React.ReactElement {
  const fan = FAN_ITEMS.find(f => f.id === active);

  const stats = useMemo(() => {
    if (active === 'piece') {
      const total = HERBS.reduce((s, h) => s + h.pieceCount, 0);
      const owned = HERBS.filter(h => h.pieceCount > 0).length;
      return [
        { label: '已藏种数', value: `${owned} / ${HERBS.length}` },
        { label: '饮片总量', value: `${total} 剂` },
      ];
    }
    if (active === 'raw') {
      const total = HERBS.reduce((s, h) => s + h.rawCount, 0);
      const owned = HERBS.filter(h => h.rawCount > 0).length;
      return [
        { label: '已采种数', value: `${owned} / ${HERBS.length}` },
        { label: '药材总量', value: `${total} 株` },
      ];
    }
    if (active === 'formula') {
      const owned = FORMULAS.filter(f => f.count > 0).length;
      return [
        { label: '已掌方', value: `${owned} / ${FORMULAS.length}` },
      ];
    }
    if (active === 'tool') {
      const owned = TOOLS.filter(t => t.count > 0).length;
      return [
        { label: '已得器', value: `${owned} / ${TOOLS.length}` },
      ];
    }
    if (active === 'book') {
      const owned = BOOKS.filter(b => b.owned).length;
      return [
        { label: '已藏典籍', value: `${owned} / ${BOOKS.length}` },
      ];
    }
    return [];
  }, [active]);

  return (
    <div style={{ padding: '24px 22px', height: '100%' }}>
      <div style={{
        fontFamily: 'STKaiti, KaiTi, serif',
        fontSize: 18, fontWeight: 900,
        letterSpacing: '0.15em', color: 'var(--ink)',
        marginBottom: 16,
      }}>{fan?.name}</div>

      {stats.map((s, i) => (
        <div key={i} style={{
          padding: '8px 10px',
          background: i % 2 === 0 ? 'rgba(139,95,52,0.08)' : 'transparent',
          borderLeft: '2px solid var(--vermilion)',
          marginBottom: 6,
        }}>
          <div style={{
            fontSize: 10, color: 'var(--ink-light)',
            letterSpacing: '0.2em',
          }}>{s.label}</div>
          <div style={{
            fontSize: 14, fontWeight: 700,
            fontFamily: 'STKaiti, KaiTi, serif',
          }}>{s.value}</div>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// 卷轴面板
// ============================================================================

function ScrollPanel({ side, children }: {
  side: 'left' | 'right';
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <div className="scroll-panel">
      <div className="scroll-rod-top" />
      <div className="paper-tex" style={{ flex: 1 }}>
        <div style={{ position: 'absolute', inset: 0 }}>{children}</div>
      </div>
      <div className="scroll-rod-bottom" />
    </div>
  );
}

// ============================================================================
// 主组件
// ============================================================================

export function InventoryUI({ onClose }: InventoryUIProps): React.ReactElement {
  const [active, setActive] = useState<ViewType>('piece');
  const [tooltip, setTooltip] = useState<TooltipState>({ herb: null, x: 0, y: 0 });

  const handleHover = useCallback((herb: HerbData, e: React.MouseEvent) => {
    setTooltip({ herb, x: e.clientX, y: e.clientY });
  }, []);

  const handleLeave = useCallback(() => {
    setTooltip({ herb: null, x: 0, y: 0 });
  }, []);

  const handleClose = useCallback(() => {
    bridgeToPhaser(INVENTORY_EVENTS.CLOSE, {});
    onClose();
  }, [onClose]);

  // ESC键关闭
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleClose]);

  // 发送打开事件
  useEffect(() => {
    bridgeToPhaser(INVENTORY_EVENTS.OPEN, {});
  }, []);

  const renderView = (): React.ReactNode => {
    switch (active) {
      case 'piece': return <HerbView mode="piece" onHover={handleHover} onLeave={handleLeave} />;
      case 'raw':   return <HerbView mode="raw" onHover={handleHover} onLeave={handleLeave} />;
      case 'formula': return <FormulaView />;
      case 'tool':  return <ToolView />;
      case 'book':  return <BookView />;
      default: return null;
    }
  };

  return (
    <>
      <div className="inventory-backdrop" onClick={handleClose} />

      <div className="inventory-root">
        <div className="inventory-container" style={{
          display: 'grid',
          gridTemplateColumns: '1fr 280px 1fr',
        }}>
          <ScrollPanel side="left">
            {renderView()}
          </ScrollPanel>

          <CenterDial active={active} setActive={setActive} />

          <ScrollPanel side="right">
            <SummaryPanel active={active} />
          </ScrollPanel>
        </div>

        <button
          className="inventory-close-btn"
          onClick={handleClose}
          style={{
            position: 'absolute',
            top: 20, right: 20,
            width: 40, height: 40,
            borderRadius: '50%',
            background: 'var(--vermilion)',
            color: 'var(--paper-1)',
            fontSize: 24,
            cursor: 'pointer',
            border: 'none',
          }}
        >
          ×
        </button>
      </div>

      {tooltip.herb && <HerbTooltip {...tooltip} />}
    </>
  );
}

export default InventoryUI;
```

- [ ] **Step 2: 运行测试验证**

```bash
npx playwright test tests/e2e/inventory-html-ui.spec.ts --reporter=list
```

Expected: 测试应通过（组件已实现）

- [ ] **Step 3: Commit主组件**

```bash
git add src/ui/html/InventoryUI.tsx
git commit -m "feat(inventory): add main UI component with all views

- Merge app.jsx + all sub-components into single file
- HerbView with 18 categories sidebar
- FormulaView, ToolView, BookView
- CenterDial fan navigation (5 petals)
- SummaryPanel with stats
- HerbSlot with image support
- HerbTooltip with rarity display

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 6: 创建React入口文件

**Files:**
- Create: `src/ui/html/inventory-entry.tsx`
- Test: Task 4的E2E测试

- [ ] **Step 1: 创建入口文件**

```typescript
// src/ui/html/inventory-entry.tsx
/**
 * 背包UI React入口 - 挂载到DOM
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import { InventoryUI } from './InventoryUI';

let inventoryRoot: ReturnType<typeof createRoot> | null = null;
let inventoryContainer: HTMLDivElement | null = null;

interface CreateInventoryUIOptions {
  onClose?: () => void;
}

export function createInventoryUI(options: CreateInventoryUIOptions = {}): {
  show: () => void;
  hide: () => void;
  destroy: () => void;
} {
  // 创建容器
  if (!inventoryContainer) {
    inventoryContainer = document.createElement('div');
    inventoryContainer.id = 'inventory-ui-container';
    document.body.appendChild(inventoryContainer);
    inventoryRoot = createRoot(inventoryContainer);
  }

  const handleClose = () => {
    hide();
    options.onClose?.();
  };

  const show = () => {
    if (inventoryRoot && inventoryContainer) {
      inventoryRoot.render(
        <InventoryUI onClose={handleClose} />
      );
      inventoryContainer.style.display = 'block';
    }
  };

  const hide = () => {
    if (inventoryContainer) {
      inventoryContainer.style.display = 'none';
    }
  };

  const destroy = () => {
    if (inventoryRoot) {
      inventoryRoot.unmount();
      inventoryRoot = null;
    }
    if (inventoryContainer) {
      inventoryContainer.remove();
      inventoryContainer = null;
    }
  };

  return { show, hide, destroy };
}

export default createInventoryUI;
```

- [ ] **Step 2: Commit入口文件**

```bash
git add src/ui/html/inventory-entry.tsx
git commit -m "feat(inventory): add React entry point for DOM mounting

- createInventoryUI factory function
- show/hide/destroy lifecycle
- Unmount cleanup on destroy

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 7: 修改ClinicScene集成新UI

**Files:**
- Modify: `src/scenes/ClinicScene.ts:1092-1108`

- [ ] **Step 1: 修改toggleInventory方法**

```typescript
// src/scenes/ClinicScene.ts (修改toggleInventory方法)
// 原代码位置: 第1092-1108行

/**
 * Phase 2.5: 切换背包显示（使用新的HTML UI）
 */
private toggleInventory(): void {
  if (!this.inventoryUI) {
    // 使用新的HTML UI入口
    const { createInventoryUI } = require('../ui/html/inventory-entry');
    this.inventoryUI = createInventoryUI({
      onClose: () => {
        console.log('[ClinicScene] Inventory closed');
      }
    });
    console.log('[ClinicScene] Inventory HTML UI created');
  }

  // 调用show/hide方法
  if (this.inventoryUI.isShowing?.()) {
    this.inventoryUI.hide();
  } else {
    this.inventoryUI.show();
  }
}
```

- [ ] **Step 2: 修改inventoryUI类型声明**

```typescript
// src/scenes/ClinicScene.ts (修改类型声明)
// 在第80-81行附近

// 原代码:
// private inventoryUI: InventoryUI | null = null;

// 新代码:
private inventoryUI: ReturnType<typeof import('../ui/html/inventory-entry').createInventoryUI> | null = null;
```

- [ ] **Step 3: 运行测试验证**

```bash
npx playwright test tests/e2e/inventory-html-ui.spec.ts --reporter=list
```

Expected: 所有测试通过

- [ ] **Step 4: Commit集成修改**

```bash
git add src/scenes/ClinicScene.ts
git commit -m "feat(inventory): integrate HTML UI in ClinicScene

- Replace InventoryUI.ts with inventory-entry.tsx
- Update type declaration for new API
- Call show/hide methods from createInventoryUI

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 8: 删除旧的InventoryUI.ts文件

**Files:**
- Delete: `src/ui/InventoryUI.ts`

- [ ] **Step 1: 删除旧文件**

```bash
git rm src/ui/InventoryUI.ts
```

- [ ] **Step 2: 运行测试验证无破坏**

```bash
npx playwright test tests/e2e/inventory-html-ui.spec.ts --reporter=list
npm run build
```

Expected: 测试通过，构建成功

- [ ] **Step 3: Commit删除**

```bash
git commit -m "refactor(inventory): remove old Phaser Graphics UI

- Delete src/ui/InventoryUI.ts (850 lines)
- Replaced by HTML/React implementation

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 9: 更新PROGRESS.md

**Files:**
- Modify: `PROGRESS.md`

- [ ] **Step 1: 更新进度文档**

```markdown
# PROGRESS.md 更新内容

## Phase 2.5 背包UI迁移 ✅

**完成日期**: 2026-05-01

**迁移内容**:
- 古卷轴风格React组件（~800行）
- 18功效分类 + 86味药材数据
- 5视图扇形导航（饮片/原药/方剂/工具/图书馆）
- 25张药材PNG图片嵌入
- Phaser事件桥接

**文件结构**:
- src/ui/html/inventory.css
- src/ui/html/InventoryUI.tsx
- src/ui/html/inventory-entry.tsx
- src/ui/html/data/inventory-herbs.ts
- src/ui/html/bridge/inventory-events.ts
- tests/e2e/inventory-html-ui.spec.ts (6个E2E测试)

**删除文件**:
- src/ui/InventoryUI.ts (旧Phaser Graphics实现)
```

- [ ] **Step 2: Commit进度更新**

```bash
git add PROGRESS.md
git commit -m "docs: update PROGRESS for inventory UI migration

- Mark Phase 2.5 inventory migration complete
- List new file structure
- Note deleted legacy file

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## 验收检查

| 标准 | 验证方法 |
|------|----------|
| 5视图扇形导航 | E2E测试通过 |
| 18分类侧边栏 | E2E测试通过 |
| 药材图片显示 | E2E测试通过 |
| tooltip自适应 | 手动hover测试 |
| 关闭按钮+ESC | E2E测试通过 |
| Phaser事件桥接 | 事件发送验证 |
| 构建无错误 | npm run build |

---

## 完成标记

- [ ] **最终验收**: 运行完整测试套件

```bash
npm run test
npm run build
```

Expected: 全部通过