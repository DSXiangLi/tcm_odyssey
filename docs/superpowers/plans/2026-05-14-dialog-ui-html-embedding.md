# 对话UI HTML嵌入实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将对话UI从Phaser实现迁移到React HTML嵌入，实现卷轴风古风界面、富文本教学标记、多轮对话历史。

**Architecture:** React组件挂载到document.body，通过bridge事件层与Phaser通信，SSE流处理在React层，Tool Call通过事件触发Phaser场景切换。

**Tech Stack:** React 18 + TypeScript + SSEClient + Phaser EventBus

**设计文档:** [2026-05-14-dialog-ui-html-embedding-design.md](../specs/phase2.5/2026-05-14-dialog-ui-html-embedding-design.md)

---

## 验收标准

### 功能验收（E2E测试）

| 标准 | 测试 | 通过条件 |
|------|------|----------|
| 对话UI显示 | NPC-S01 | `.dialog-scroll` visible |
| NPC信息正确 | NPC-S02 | `.dialog-title` contains NPC名 |
| 用户输入 | NPC-D01 | 输入框可填写并发送 |
| 流式响应 | NPC-D03 | 文本逐步显示 |
| 停止生成 | NPC-D04 | 停止按钮可中断 |
| Tool Call触发 | NPC-TC01 | 场景切换事件触发 |
| 对话历史保留 | 新增测试 | 关闭再开历史存在 |

### 视觉验收

| 标准 | 验收方法 |
|------|----------|
| 卷轴风格 | 与 `docs/ui/对话窗口/dialog-scroll.jsx` 对比 |
| 古风字体 | CSS引用 Noto Serif SC、Ma Shan Zheng |
| 富文本标记 | hover显示tooltip（性味归经等） |
| 印章显示 | `.dialog-seal` 元素存在 |

### 架构验收

| 标准 | 验收方法 |
|------|----------|
| entry挂载模式 | 与 inventory-entry.tsx 模式一致 |
| bridge事件定义 | DIALOG_EVENTS 常量完整 |
| SSEClient位置 | React层直接调用 |
| GameStateBridge扩展 | getDialogHistory/setDialogHistory 方法存在 |

### 最终验收

- [ ] `npm run build` 无TS错误
- [ ] `npm run test:e2e` 19/19 通过
- [ ] 视觉效果与设计文档一致

---

## 决策记录

| 决策点 | 选择 | 理由 |
|--------|------|------|
| 整体架构 | HTML嵌入方案 | 设计文档已完成，风格统一，富文本必需 |
| SSE流处理 | React层直接调用 | 简化架构，避免bridge延迟 |
| Tool Call | 必须走bridge层 | 只有Phaser能控制场景 |
| 对话历史 | Phaser GameStateBridge存储 | 跨NPC持久化 |
| 旧代码 | 保留DialogUI.ts备选 | 降低迁移风险 |
| 测试迁移 | 渐进迁移 | 保留框架，修改选择器 |

---

## 文件结构

| 文件 | 类型 | 职责 |
|------|------|------|
| `src/ui/html/bridge/dialog-events.ts` | Create | 事件常量定义 |
| `src/ui/html/dialog-entry.tsx` | Create | React入口挂载 |
| `src/ui/html/DialogUI.tsx` | Create | React主组件 |
| `src/ui/html/dialog.css` | Create | 古风卷轴样式 |
| `src/ui/html/data/tcm-data.ts` | Create | 教学数据库 |
| `src/scenes/GardenScene.ts` | Modify | 集成showDialogUI |
| `src/scenes/ClinicScene.ts` | Modify | 集成showDialogUI |
| `tests/e2e/npc-dialog.spec.ts` | Modify | DOM选择器调整 |

---

## Task 1: 创建事件桥接层

**Files:**
- Create: `src/ui/html/bridge/dialog-events.ts`

- [ ] **Step 1: 创建事件常量定义**

```typescript
// src/ui/html/bridge/dialog-events.ts
/**
 * 对话UI桥接事件常量
 * React DialogUI ↔ Phaser Scene 双向通信
 */

export const DIALOG_EVENTS = {
  // React → Phaser
  TOOL_CALL: 'dialog:tool:call',      // NPC触发工具调用
  CLOSE: 'dialog:close',              // 关闭对话UI

  // Phaser → React
  CHUNK: 'dialog:chunk',              // SSE流文本块（备用，当前React直接调用）
  COMPLETE: 'dialog:complete',        // 对话完成
  HISTORY_UPDATE: 'dialog:history:update',  // 对话历史更新
};

export interface DialogToolCallEvent {
  name: string;
  args: Record<string, unknown>;
}

export interface DialogHistoryEvent {
  npcId: string;
  messages: DialogMessage[];
}

export interface DialogMessage {
  role: 'npc' | 'player' | 'narration' | 'system';
  name?: string;
  title?: string;
  mood?: string;
  text: string;
  timestamp?: number;
}
```

- [ ] **Step 2: 提交事件定义**

```bash
git add src/ui/html/bridge/dialog-events.ts
git commit -m "feat(dialog): add dialog bridge events definition"
```

---

## Task 2: 创建教学数据库

**Files:**
- Create: `src/ui/html/data/tcm-data.ts`

- [ ] **Step 1: 创建TCM教学数据结构**

```typescript
// src/ui/html/data/tcm-data.ts
/**
 * 中医教学数据库
 * 用于富文本标记 [[herb:黄芪]] 等
 */

export interface TCMEntry {
  pinyin: string;
  tag: string;
  meta: Record<string, string>;
  body: string;
}

export interface TCMData {
  herb: Record<string, TCMEntry>;
  acupoint: Record<string, TCMEntry>;
  classic: Record<string, TCMEntry>;
  symptom: Record<string, TCMEntry>;
}

export const TCM_DATA: TCMData = {
  herb: {
    '甘草': {
      pinyin: 'gāncǎo',
      tag: '药材',
      meta: { '性味': '甘，平', '归经': '心、肺、脾、胃经' },
      body: '补脾益气，清热解毒，祛痰止咳，调和诸药。为方中"国老"。'
    },
    '黄芪': {
      pinyin: 'huángqí',
      tag: '药材',
      meta: { '性味': '甘，微温', '归经': '脾、肺经' },
      body: '补气升阳，固表止汗，利水消肿，托毒生肌。'
    },
    '当归': {
      pinyin: 'dāngguī',
      tag: '药材',
      meta: { '性味': '甘、辛，温', '归经': '肝、心、脾经' },
      body: '补血活血，调经止痛，润肠通便。妇科要药。'
    },
    '陈皮': {
      pinyin: 'chénpí',
      tag: '药材',
      meta: { '性味': '辛、苦，温', '归经': '脾、肺经' },
      body: '理气健脾，燥湿化痰。年久者良，故曰陈皮。'
    },
    '生姜': {
      pinyin: 'shēngjiāng',
      tag: '药材',
      meta: { '性味': '辛，微温', '归经': '肺、脾、胃经' },
      body: '发汗解表，温中止呕，温肺止咳。常用于外感风寒。'
    },
  },
  acupoint: {
    '足三里': {
      pinyin: 'Zúsānlǐ',
      tag: '穴位 · 足阳明胃经',
      meta: { '定位': '犊鼻下三寸', '主治': '胃痛、呕吐、泄泻' },
      body: '"肚腹三里留"，强壮要穴，常灸之可保健长寿。'
    },
    '合谷': {
      pinyin: 'Hégǔ',
      tag: '穴位 · 手阳明大肠经',
      meta: { '定位': '手背第一二掌骨间', '主治': '头痛、牙痛、面瘫' },
      body: '"面口合谷收"，四总穴之一。孕妇慎用。'
    },
    '内关': {
      pinyin: 'Nèiguān',
      tag: '穴位 · 手厥阴心包经',
      meta: { '定位': '腕横纹上二寸', '主治': '心痛、胸闷、恶心' },
      body: '八脉交会穴，通阴维。晕车晕船按之即效。'
    },
  },
  classic: {
    '上工治未病': {
      pinyin: '',
      tag: '古文引用',
      meta: { '出处': '《素问·四气调神大论》' },
      body: '高明的医者治疗"未发之病"——重在预防，于未病之时调摄。'
    },
    '阴阳者，天地之道也': {
      pinyin: '',
      tag: '古文引用',
      meta: { '出处': '《素问·阴阳应象大论》' },
      body: '阴阳是天地万物的根本规律，是变化的源头，是生杀的本始。'
    },
  },
  symptom: {
    '气虚': {
      pinyin: 'qìxū',
      tag: '证候',
      meta: { '常见症': '乏力、气短、自汗', '舌脉': '舌淡，脉虚弱' },
      body: '元气不足，脏腑机能减退。常见于久病、劳倦、年老体衰之人。'
    },
    '湿热': {
      pinyin: 'shīrè',
      tag: '证候',
      meta: { '常见症': '身热不扬、口苦、苔黄腻', '舌脉': '脉濡数' },
      body: '湿邪与热邪结合。"湿性黏滞"，故病程缠绵难愈。'
    },
    '风寒': {
      pinyin: 'fēngán',
      tag: '外邪',
      meta: { '常见症': '恶寒重、发热轻、无汗', '舌脉': '苔薄白，脉浮紧' },
      body: '风寒之邪侵袭肌表，腠理闭塞。治宜辛温解表。'
    },
  },
};

export type TCMKind = keyof TCMData;
```

- [ ] **Step 2: 提交教学数据**

```bash
git add src/ui/html/data/tcm-data.ts
git commit -m "feat(dialog): add TCM teaching data for rich-text markup"
```

---

## Task 3: 创建古风卷轴样式

**Files:**
- Create: `src/ui/html/dialog.css`

- [ ] **Step 1: 创建CSS样式文件**

```css
/* src/ui/html/dialog.css
 * 对话UI · 古风卷轴样式
 */

@import url('https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;500;600;700;900&family=Ma+Shan+Zheng&family=ZCOOL+XiaoWei&display=swap');

:root {
  /* 纸张与墨 */
  --paper: #f0e6d2;
  --paper-deep: #e8d9b8;
  --paper-light: #f7efde;
  --paper-edge: #c9b489;
  --ink: #1a1410;
  --ink-soft: #3d2f24;
  --ink-faint: #6b5841;

  /* 朱砂、青黛、藤黄 */
  --vermilion: #b3322a;
  --vermilion-deep: #842018;
  --vermilion-soft: #d65b4f;
  --herb: #6b8e6b;
  --acupoint: #b3322a;
  --classic: #b8893f;
  --symptom: #8a4a6b;

  /* 字体 */
  --font-serif: 'Noto Serif SC', 'STSong', 'SimSun', serif;
  --font-cursive: 'Ma Shan Zheng', cursive;
  --font-title: 'ZCOOL XiaoWei', 'Noto Serif SC', serif;
}

/* 全屏容器 */
.dialog-root {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(20, 15, 10, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

/* 卷轴主体 */
.dialog-scroll {
  width: 480px;
  max-height: 80vh;
  position: relative;
  padding: 16px 4px;
  display: flex;
  flex-direction: column;
}

/* 顶部木轴 */
.scroll-bar-top {
  height: 24px;
  background: linear-gradient(180deg, #6b4a2a 0%, #8a6438 15%, #a07a48 50%, #8a6438 85%, #4a3018 100%);
  border-radius: 2px;
  box-shadow: inset 0 1px 0 rgba(255, 220, 160, 0.3), 0 2px 6px rgba(0, 0, 0, 0.2);
  position: relative;
}

.scroll-bar-top::before,
.scroll-bar-top::after {
  content: '';
  position: absolute;
  top: -2px;
  bottom: -2px;
  width: 10px;
  background: radial-gradient(ellipse at 50% 50%, #d4a85a 0%, #a07a3a 50%, #5a3a18 100%);
  border-radius: 50%;
}

.scroll-bar-top::before { left: -6px; }
.scroll-bar-top::after { right: -6px; }

/* 底部木轴 */
.scroll-bar-bottom {
  height: 24px;
  background: linear-gradient(180deg, #6b4a2a 0%, #8a6438 15%, #a07a48 50%, #8a6438 85%, #4a3018 100%);
  border-radius: 2px;
  box-shadow: inset 0 -1px 0 rgba(0, 0, 0, 0.3), 0 2px 6px rgba(0, 0, 0, 0.2);
  position: relative;
}

.scroll-bar-bottom::before,
.scroll-bar-bottom::after {
  content: '';
  position: absolute;
  top: -2px;
  bottom: -2px;
  width: 10px;
  background: radial-gradient(ellipse at 50% 50%, #d4a85a 0%, #a07a3a 50%, #5a3a18 100%);
  border-radius: 50%;
}

.scroll-bar-bottom::before { left: -6px; }
.scroll-bar-bottom::after { right: -6px; }

/* 宣纸主体 */
.dialog-paper {
  flex: 1;
  background-color: var(--paper);
  background-image:
    radial-gradient(ellipse at 20% 30%, rgba(180, 140, 90, 0.08) 0%, transparent 50%),
    radial-gradient(ellipse at 80% 70%, rgba(140, 100, 60, 0.06) 0%, transparent 60%),
    repeating-linear-gradient(90deg, transparent 0px, transparent 2px, rgba(120, 90, 50, 0.02) 2px, rgba(120, 90, 50, 0.02) 3px),
    repeating-linear-gradient(0deg, transparent 0px, transparent 4px, rgba(120, 90, 50, 0.015) 4px, rgba(120, 90, 50, 0.015) 5px);
  box-shadow: inset 0 8px 16px -8px rgba(80,50,20,0.25), inset 0 -8px 16px -8px rgba(80,50,20,0.25), 0 4px 16px rgba(60,40,20,0.2);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* 标题栏 */
.dialog-header {
  padding: 12px 20px 8px;
  border-bottom: 1px solid rgba(120, 90, 50, 0.2);
  background: linear-gradient(180deg, rgba(255, 250, 235, 0.4) 0%, transparent 100%);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.dialog-title {
  font-family: var(--font-title);
  font-size: 16px;
  font-weight: 700;
  color: var(--ink);
  letter-spacing: 0.2em;
}

.dialog-subtitle {
  font-size: 10px;
  color: var(--ink-faint);
  letter-spacing: 0.15em;
  margin-top: 2px;
}

/* 印章 */
.dialog-seal {
  width: 32px;
  height: 32px;
  background: var(--vermilion);
  color: var(--paper-light);
  font-family: var(--font-title);
  font-size: 12px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 2px;
  box-shadow: inset 0 0 0 1.5px rgba(247, 239, 222, 0.4);
  transform: rotate(-3deg);
}

/* 对话历史 */
.dialog-history {
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px;
}

.dialog-history::-webkit-scrollbar {
  width: 6px;
}

.dialog-history::-webkit-scrollbar-track {
  background: transparent;
}

.dialog-history::-webkit-scrollbar-thumb {
  background: rgba(120, 90, 50, 0.25);
  border-radius: 3px;
}

/* 消息样式 */
.msg-narration {
  font-size: 12px;
  color: var(--ink-faint);
  font-style: italic;
  text-align: center;
  margin: 8px 0 16px;
  letter-spacing: 0.05em;
  line-height: 1.7;
}

.msg-system {
  font-size: 11px;
  color: var(--vermilion);
  text-align: center;
  margin: 12px 0;
  letter-spacing: 0.1em;
  font-weight: 500;
}

.msg-npc {
  margin-bottom: 16px;
}

.msg-npc-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.msg-npc-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 1px solid var(--paper-edge);
  background: repeating-linear-gradient(45deg, var(--paper-deep) 0px, var(--paper-deep) 5px, var(--paper) 5px, var(--paper) 10px);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-cursive);
  font-size: 16px;
  color: var(--ink-soft);
}

.msg-npc-name {
  font-family: var(--font-title);
  font-size: 14px;
  font-weight: 600;
  color: var(--ink);
}

.msg-npc-title {
  font-size: 10px;
  color: var(--ink-faint);
}

.msg-npc-mood {
  font-size: 10px;
  color: var(--vermilion);
  border: 1px solid var(--vermilion-soft);
  padding: 2px 6px;
  border-radius: 1px;
  letter-spacing: 0.1em;
}

.msg-npc-text {
  font-size: 13px;
  line-height: 1.85;
  color: var(--ink-soft);
  padding-left: 40px;
}

.msg-player {
  margin-bottom: 16px;
  padding-left: 36px;
  position: relative;
}

.msg-player-label {
  position: absolute;
  left: 0;
  top: 2px;
  font-family: var(--font-cursive);
  font-size: 12px;
  color: var(--vermilion);
  writing-mode: vertical-rl;
  letter-spacing: 0.1em;
}

.msg-player-text {
  font-size: 13px;
  line-height: 1.8;
  color: var(--ink-soft);
  font-style: italic;
  border-left: 2px solid var(--vermilion-soft);
  padding-left: 10px;
}

/* 富文本标记 */
.tcm-herb, .tcm-acupoint, .tcm-classic, .tcm-symptom {
  cursor: help;
  font-weight: 500;
  border-bottom: 1px dashed currentColor;
  padding: 0 1px;
  transition: background 0.15s;
}

.tcm-herb { color: var(--herb); background: rgba(107, 142, 107, 0.08); }
.tcm-acupoint { color: var(--acupoint); background: rgba(179, 50, 42, 0.08); }
.tcm-classic { color: var(--classic); background: rgba(184, 137, 63, 0.08); font-style: italic; }
.tcm-symptom { color: var(--symptom); background: rgba(138, 74, 107, 0.08); }

.tcm-herb:hover { background: rgba(107, 142, 107, 0.18); }
.tcm-acupoint:hover { background: rgba(179, 50, 42, 0.18); }
.tcm-classic:hover { background: rgba(184, 137, 63, 0.18); }
.tcm-symptom:hover { background: rgba(138, 74, 107, 0.18); }

/* 教学浮卡 */
.tcm-tooltip {
  position: absolute;
  bottom: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%) translateY(4px);
  width: 220px;
  background: var(--paper-light);
  border: 1px solid var(--paper-edge);
  border-radius: 2px;
  padding: 10px 12px;
  font-size: 12px;
  line-height: 1.6;
  color: var(--ink-soft);
  box-shadow: 0 2px 8px rgba(60, 40, 20, 0.2);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s, transform 0.2s;
  z-index: 10;
  text-align: left;
  font-style: normal;
}

.tcm-tooltip::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 5px solid transparent;
  border-top-color: var(--paper-edge);
}

.tcm-term:hover .tcm-tooltip {
  opacity: 1;
  transform: translateX(-50%) translateY(0);
}

/* 输入区域 */
.dialog-input-area {
  padding: 10px 16px;
  border-top: 1px solid rgba(120, 90, 50, 0.15);
  background: rgba(255, 250, 235, 0.3);
}

.dialog-input-row {
  display: flex;
  gap: 8px;
  align-items: stretch;
}

.dialog-input {
  flex: 1;
  background: var(--paper-light);
  border: 1px solid var(--paper-edge);
  border-radius: 2px;
  padding: 8px 12px;
  font-family: var(--font-serif);
  font-size: 13px;
  color: var(--ink);
  outline: none;
}

.dialog-input:focus {
  border-color: var(--vermilion-soft);
}

.dialog-send-btn {
  padding: 8px 16px;
  background: var(--vermilion);
  color: var(--paper-light);
  border: 1px solid var(--vermilion-deep);
  border-radius: 2px;
  font-family: var(--font-serif);
  font-size: 13px;
  cursor: pointer;
  transition: background 0.15s;
}

.dialog-send-btn:hover {
  background: var(--vermilion-deep);
}

/* 生成状态 */
.dialog-loading {
  text-align: center;
  padding: 8px;
  font-size: 12px;
  color: var(--ink-faint);
}

.dialog-stop-btn {
  font-size: 12px;
  color: var(--vermilion);
  cursor: pointer;
  padding: 4px 8px;
  border: 1px solid var(--vermilion-soft);
  border-radius: 2px;
}
```

- [ ] **Step 2: 提交样式文件**

```bash
git add src/ui/html/dialog.css
git commit -m "feat(dialog): add ancient scroll-style CSS"
```

---

## Task 4: 创建React入口挂载

**Files:**
- Create: `src/ui/html/dialog-entry.tsx`

- [ ] **Step 1: 创建React入口文件**

```tsx
// src/ui/html/dialog-entry.tsx
/**
 * 对话UI React入口挂载点
 */

import { createRoot } from 'react-dom/client';
import { DialogUI, DialogUIOptions } from './DialogUI';
import './dialog.css';

let dialogRoot: ReturnType<typeof createRoot> | null = null;
let dialogContainer: HTMLDivElement | null = null;

/**
 * 创建并挂载对话UI
 */
export function createDialogUI(options: DialogUIOptions): () => void {
  // 创建容器
  if (!dialogContainer) {
    dialogContainer = document.createElement('div');
    dialogContainer.id = 'dialog-ui-root';
    document.body.appendChild(dialogContainer);
  }

  // 创建React root
  if (!dialogRoot) {
    dialogRoot = createRoot(dialogContainer);
  }

  // 渲染组件
  dialogRoot.render(
    <DialogUI
      npcId={options.npcId}
      npcName={options.npcName}
      playerId={options.playerId}
      onToolCall={options.onToolCall}
      onClose={options.onClose}
    />
  );

  // 返回清理函数
  return () => {
    if (dialogRoot && dialogContainer) {
      dialogRoot.unmount();
      dialogRoot = null;
      document.body.removeChild(dialogContainer);
      dialogContainer = null;
    }
  };
}

/**
 * 显示对话UI
 */
export function showDialogUI(options: DialogUIOptions): () => void {
  return createDialogUI(options);
}

/**
 * 隐藏对话UI
 */
export function hideDialogUI(): void {
  if (dialogRoot && dialogContainer) {
    dialogRoot.unmount();
    dialogRoot = null;
    document.body.removeChild(dialogContainer);
    dialogContainer = null;
  }
}

export default createDialogUI;
```

- [ ] **Step 2: 提交入口文件**

```bash
git add src/ui/html/dialog-entry.tsx
git commit -m "feat(dialog): add React entry mount point"
```

---

## Task 5: 创建DialogUI React组件

**Files:**
- Create: `src/ui/html/DialogUI.tsx`

- [ ] **Step 1: 创建主组件骨架**

```tsx
// src/ui/html/DialogUI.tsx
/**
 * 对话UI React组件
 * 古风卷轴风格 + 富文本教学标记 + SSE流式响应
 */

import React, { useState, useEffect, useRef } from 'react';
import { SSEClient, ChatRequest } from '../../utils/sseClient';
import { EventBus } from '../../systems/EventBus';
import { DIALOG_EVENTS, DialogMessage, DialogToolCallEvent } from './bridge/dialog-events';
import { TCM_DATA, TCMKind } from './data/tcm-data';
import { GameStateBridge } from '../../systems/GameStateBridge';

export interface DialogUIOptions {
  npcId: string;
  npcName: string;
  playerId: string;
  onToolCall?: (name: string, args: Record<string, unknown>) => void;
  onClose?: () => void;
}

interface DialogUIProps extends DialogUIOptions {}

// 富文本解析：[[kind:term]] → segments
function parseRichText(str: string): Array<{ type: string; content: string }> {
  const out: Array<{ type: string; content: string }> = [];
  const re = /\[\[(\w+):([^\]]+)\]\]/g;
  let last = 0;
  let m;
  while ((m = re.exec(str)) !== null) {
    if (m.index > last) {
      out.push({ type: 'text', content: str.slice(last, m.index) });
    }
    out.push({ type: m[1], content: m[2] });
    last = m.index + m[0].length;
  }
  if (last < str.length) {
    out.push({ type: 'text', content: str.slice(last) });
  }
  return out;
}

// 单个TCM标记组件
function TCMTerm({ kind, term }: { kind: TCMKind; term: string }) {
  const data = TCM_DATA[kind]?.[term];
  if (!data) return <span>{term}</span>;

  return (
    <span className={`tcm-term tcm-${kind}`}>
      {term}
      <span className="tcm-tooltip">
        <div style={{ fontFamily: 'var(--font-title)', fontSize: '13px', fontWeight: 700, color: 'var(--ink)' }}>
          {term}
          {data.pinyin && <span style={{ fontSize: '10px', color: 'var(--ink-faint)', marginLeft: '6px' }}>{data.pinyin}</span>}
        </div>
        <div style={{ fontSize: '10px', color: `var(--${kind})`, letterSpacing: '0.1em', marginBottom: '4px' }}>
          {data.tag}
        </div>
        <div style={{ height: '1px', background: 'var(--paper-edge)', margin: '6px 0', opacity: 0.5 }} />
        {Object.entries(data.meta || {}).map(([k, v]) => (
          <div key={k} style={{ fontSize: '11px', display: 'flex', gap: '6px' }}>
            <span style={{ color: 'var(--ink-faint)' }}>{k}</span>
            <span style={{ color: 'var(--ink)' }}>{v}</span>
          </div>
        ))}
        {data.body && (
          <>
            <div style={{ height: '1px', background: 'var(--paper-edge)', margin: '6px 0', opacity: 0.5 }} />
            <div style={{ fontSize: '11px', lineHeight: 1.6, color: 'var(--ink-soft)' }}>{data.body}</div>
          </>
        )}
      </span>
    </span>
  );
}

// 富文本渲染
function RichText({ text }: { text: string }) {
  const segments = parseRichText(text);
  return (
    <>
      {segments.map((seg, i) => {
        if (seg.type === 'text') return <React.Fragment key={i}>{seg.content}</React.Fragment>;
        if (['herb', 'acupoint', 'classic', 'symptom'].includes(seg.type)) {
          return <TCMTerm key={i} kind={seg.type as TCMKind} term={seg.content} />;
        }
        return <span key={i}>{seg.content}</span>;
      })}
    </>
  );
}

// 消息组件
function MessageView({ msg }: { msg: DialogMessage }) {
  if (msg.role === 'narration') {
    return (
      <div className="msg-narration">
        <RichText text={msg.text} />
      </div>
    );
  }
  if (msg.role === 'system') {
    return <div className="msg-system">{msg.text}</div>;
  }
  if (msg.role === 'npc') {
    return (
      <div className="msg-npc">
        <div className="msg-npc-header">
          <div className="msg-npc-avatar">{msg.name?.charAt(0) || '医'}</div>
          <div>
            <div className="msg-npc-name">{msg.name}</div>
            {msg.title && <div className="msg-npc-title">{msg.title}</div>}
          </div>
          {msg.mood && <span className="msg-npc-mood">{msg.mood}</span>}
        </div>
        <div className="msg-npc-text">
          <RichText text={msg.text} />
        </div>
      </div>
    );
  }
  // player
  return (
    <div className="msg-player">
      <span className="msg-player-label">学生</span>
      <div className="msg-player-text">
        <RichText text={msg.text} />
      </div>
    </div>
  );
}

export function DialogUI({ npcId, npcName, playerId, onToolCall, onClose }: DialogUIProps) {
  const [messages, setMessages] = useState<DialogMessage[]>([]);
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentText, setCurrentText] = useState('');
  const historyRef = useRef<HTMLDivElement>(null);
  const sseClient = useRef(new SSEClient());

  // 加载历史对话
  useEffect(() => {
    const bridge = GameStateBridge.getInstance();
    const history = bridge.getDialogHistory(npcId);
    if (history && history.length > 0) {
      setMessages(history);
    }
  }, [npcId]);

  // 自动滚动到底部
  useEffect(() => {
    if (historyRef.current) {
      historyRef.current.scrollTop = historyRef.current.scrollHeight;
    }
  }, [messages, currentText]);

  // 发送消息
  const handleSend = async () => {
    const text = input.trim();
    if (!text || isGenerating) return;

    setInput('');
    setMessages(prev => [...prev, { role: 'player', text, timestamp: Date.now() }]);
    setIsGenerating(true);
    setCurrentText('');

    const request: ChatRequest = {
      npc_id: npcId,
      player_id: playerId,
      user_message: text
    };

    try {
      await sseClient.current.chatStream(
        request,
        (chunk) => setCurrentText(prev => prev + chunk),
        (full) => {
          setMessages(prev => [...prev, { role: 'npc', name: npcName, text: full, timestamp: Date.now() }]);
          setCurrentText('');
          setIsGenerating(false);
          // 保存历史
          const bridge = GameStateBridge.getInstance();
          bridge.setDialogHistory(npcId, messages.concat({ role: 'npc', name: npcName, text: full }));
        },
        (err) => {
          setMessages(prev => [...prev, { role: 'system', text: `错误: ${err.message}` }]);
          setIsGenerating(false);
        },
        (name, args) => {
          // Tool Call通过事件传递给Phaser
          const eventBus = EventBus.getInstance();
          eventBus.emit(DIALOG_EVENTS.TOOL_CALL, { name, args } as DialogToolCallEvent);
          if (onToolCall) onToolCall(name, args);
        }
      );
    } catch (err) {
      setIsGenerating(false);
    }
  };

  // 停止生成
  const handleStop = () => {
    sseClient.current.stop();
    setIsGenerating(false);
  };

  // 关闭
  const handleClose = () => {
    if (onClose) onClose();
  };

  // 按Enter发送
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="dialog-root" onClick={(e) => e.stopPropagation()}>
      <div className="dialog-scroll">
        <div className="scroll-bar-top" />
        <div className="dialog-paper">
          {/* 标题栏 */}
          <div className="dialog-header">
            <div>
              <div className="dialog-title">{npcName} · 问诊</div>
              <div className="dialog-subtitle">对话记录</div>
            </div>
            <div className="dialog-seal">医</div>
          </div>

          {/* 对话历史 */}
          <div className="dialog-history" ref={historyRef}>
            {messages.map((msg, i) => <MessageView key={i} msg={msg} />)}
            {currentText && (
              <div className="msg-npc">
                <div className="msg-npc-header">
                  <div className="msg-npc-avatar">{npcName.charAt(0)}</div>
                  <div className="msg-npc-name">{npcName}</div>
                </div>
                <div className="msg-npc-text">
                  <RichText text={currentText} />
                </div>
              </div>
            )}
            {isGenerating && (
              <div className="dialog-loading">
                生成中... <span className="dialog-stop-btn" onClick={handleStop}>停止</span>
              </div>
            )}
          </div>

          {/* 输入区域 */}
          <div className="dialog-input-area">
            <div className="dialog-input-row">
              <input
                className="dialog-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="提笔作答..."
                disabled={isGenerating}
              />
              <button className="dialog-send-btn" onClick={handleSend} disabled={isGenerating}>
                呈
              </button>
            </div>
          </div>
        </div>
        <div className="scroll-bar-bottom" />
        {/* 关闭按钮 */}
        <button
          onClick={handleClose}
          style={{
            position: 'absolute',
            top: '-12px',
            right: '-12px',
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            background: 'var(--vermilion)',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          ✕
        </button>
      </div>
    </div>
  );
}

export default DialogUI;
```

- [ ] **Step 2: 提交DialogUI组件**

```bash
git add src/ui/html/DialogUI.tsx
git commit -m "feat(dialog): add DialogUI React component with scroll-style and rich-text"
```

---

## Task 6: GameStateBridge扩展对话历史方法

**Files:**
- Modify: `src/systems/GameStateBridge.ts`

- [ ] **Step 1: 添加对话历史存储方法**

首先读取现有GameStateBridge文件，添加对话历史相关方法。

在GameStateBridge类中添加：
```typescript
// 对话历史存储（按NPC ID分组）
private dialogHistory: Map<string, DialogMessage[]> = new Map();

/**
 * 获取NPC对话历史
 */
getDialogHistory(npcId: string): DialogMessage[] {
  return this.dialogHistory.get(npcId) || [];
}

/**
 * 设置NPC对话历史
 */
setDialogHistory(npcId: string, messages: DialogMessage[]): void {
  this.dialogHistory.set(npcId, messages);
}

/**
 * 清除NPC对话历史
 */
clearDialogHistory(npcId: string): void {
  this.dialogHistory.delete(npcId);
}

/**
 * 清除所有对话历史
 */
clearAllDialogHistory(): void {
  this.dialogHistory.clear();
}
```

- [ ] **Step 2: 提交GameStateBridge扩展**

```bash
git add src/systems/GameStateBridge.ts
git commit -m "feat(bridge): add dialog history storage methods"
```

---

## Task 7: Scene集成 - GardenScene

**Files:**
- Modify: `src/scenes/GardenScene.ts`

- [ ] **Step 1: 导入showDialogUI并替换DialogUI**

找到现有DialogUI导入和使用位置，替换为React版本。

```typescript
// 原导入（删除或注释）
// import { DialogUI, DialogUIConfig } from '../ui/DialogUI';

// 新导入
import { showDialogUI, hideDialogUI } from '../ui/html/dialog-entry';
```

- [ ] **Step 2: 修改showDialogWithNPC方法**

```typescript
private dialogCleanup: (() => void) | null = null;

private showDialogWithNPC(npcId: string): void {
  if (this.dialogCleanup) return;  // 已有对话显示

  const npc = getNPCById(npcId);
  if (!npc) return;

  this.dialogCleanup = showDialogUI({
    npcId: npc.id,
    npcName: npc.name,
    playerId: 'player_001',
    onToolCall: (name, args) => this.handleToolCall(name, args),
    onClose: () => {
      console.log(`[GardenScene] Dialog with ${npcId} closed`);
      if (this.dialogCleanup) {
        this.dialogCleanup();
        this.dialogCleanup = null;
      }
    }
  });
}
```

- [ ] **Step 3: 提交GardenScene修改**

```bash
git add src/scenes/GardenScene.ts
git commit -m "feat(garden): integrate React DialogUI via showDialogUI"
```

---

## Task 8: Scene集成 - ClinicScene

**Files:**
- Modify: `src/scenes/ClinicScene.ts`

- [ ] **Step 1: 同GardenScene修改模式**

```typescript
import { showDialogUI, hideDialogUI } from '../ui/html/dialog-entry';

// 添加成员变量
private dialogCleanup: (() => void) | null = null;

// 修改showDialogWithNPC方法（同GardenScene）
```

- [ ] **Step 2: 提交ClinicScene修改**

```bash
git add src/scenes/ClinicScene.ts
git commit -m "feat(clinic): integrate React DialogUI"
```

---

## Task 9: E2E测试迁移

**Files:**
- Modify: `tests/e2e/npc-dialog.spec.ts`

- [ ] **Step 1: 修改DOM选择器**

原有Phaser选择器改为React DOM选择器：

```typescript
// 原选择器（Phaser）
// await expect(page.locator('.dialog-container')).toBeVisible();

// 新选择器（React）
await expect(page.locator('#dialog-ui-root')).toBeVisible();
await expect(page.locator('.dialog-scroll')).toBeVisible();
await expect(page.locator('.dialog-title')).toContainText(npcName);

// 输入框
const input = page.locator('.dialog-input');
await input.fill('测试问题');

// 发送按钮
await page.locator('.dialog-send-btn').click();

// 等待响应
await expect(page.locator('.msg-npc-text')).not.toBeEmpty();
```

- [ ] **Step 2: 运行测试验证**

```bash
npm run test:e2e tests/e2e/npc-dialog.spec.ts
```

- [ ] **Step 3: 提交测试迁移**

```bash
git add tests/e2e/npc-dialog.spec.ts
git commit -m "test(dialog): migrate E2E tests to React DOM selectors"
```

---

## Task 10: 构建验证与最终提交

- [ ] **Step 1: 运行TypeScript检查**

```bash
npm run build
```

Expected: 无TS错误（unused variables除外）

- [ ] **Step 2: 运行E2E测试全量**

```bash
npm run test:e2e
```

Expected: 19/19 通过

- [ ] **Step 3: 最终提交**

```bash
git add -A
git commit -m "feat(dialog): complete React HTML-embedded DialogUI implementation

- Ancient scroll-style UI with CSS
- Rich-text TCM teaching markup [[herb:黄芪]]
- Multi-turn dialog history with GameStateBridge
- SSE streaming in React layer
- Tool call via bridge events to Phaser
- E2E tests migrated to React DOM selectors
"
```

---

## 自检清单

| 检查项 | 状态 |
|--------|------|
| Spec覆盖：卷轴风UI | Task 3 CSS |
| Spec覆盖：富文本标记 | Task 2 + Task 5 |
| Spec覆盖：多轮对话历史 | Task 5 + Task 6 |
| Spec覆盖：SSE流处理 | Task 5 (React层) |
| Spec覆盖：Tool Call bridge | Task 5 + Task 7/8 |
| 无placeholder | 已检查 |
| 类型一致性 | 已检查 |