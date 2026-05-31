# DialogUI 卷轴风格视觉改进设计

**版本**: v1.0
**日期**: 2026-05-11
**阶段**: Phase 2.5 NPC对话完善
**状态**: 已确认，待实施

---

## 1. 设计背景

### 1.1 当前问题

现有 `DialogUI.ts` 使用灰色卡片风格，与游戏中医古风主题不协调。`docs/ui/对话窗口/` 提供了多个设计方案，其中 `dialog-scroll.jsx` 经典卷轴风格最为契合。

### 1.2 改进目标

- **视觉统一**：对话窗口与游戏整体古风卷轴风格一致
- **功能完整**：保留所有现有对话功能（流式显示、输入、工具回调）
- **核心迁移**：8个视觉元素中的关键要素完整还原

---

## 2. 整体布局设计

### 2.1 尺寸调整

| 参数 | 当前值 | 改进值 | 说明 |
|------|--------|--------|------|
| 宽度 | 600px | 480px | 适配800×600游戏窗口 |
| 高度 | 200px | 320px | 包含完整卷轴结构 |
| 位置 | 底部居中 | 底部偏上 | Y偏移-60px，留出空间 |

### 2.2 结构布局

```
┌─────────────────────────────────────┐
│         ▓▓▓ 木轴装饰 ▓▓▓           │  ← 顶部木轴 (高度24px)
├─────────────────────────────────────┤
│  ┌─────────────────────────────┐   │
│  │ 仁心堂·问诊录    [印章]     │   │  ← 标题栏 (60px)
│  │ 与青木先生对话              │   │
│  └─────────────────────────────┘   │
├─────────────────────────────────────┤
│                                     │
│  ○ 青木先生  [温和]                 │  ← NPC头像+心情标签
│  ─────────────────────────────      │
│    你可还记得太阳病开篇所言？       │  ← 对话内容（流式显示）
│    《伤寒论》第一条云：...          │
│                                     │
├─────────────────────────────────────┤
│  ── 可问 ──                         │  ← 选项区（可选，80px）
│  [深问] 麻黄汤与桂枝汤有何不同？    │
│  [取穴] 足三里穴具体在何处？        │
│  [食疗] 若不愿服药，可有食疗？      │
├─────────────────────────────────────┤
│  ┌─────────────────────────┐ [呈] │  ← 输入区 (50px)
│  │ 提笔作答……              │     │
│  └─────────────────────────┘      │
├─────────────────────────────────────┤
│         ▓▓▓ 木轴装饰 ▓▓▓           │  ← 底部木轴 (高度24px)
└─────────────────────────────────────┘
```

---

## 3. 核心视觉元素实现方案

### 3.1 木轴装饰 (ScrollBar)

**实现方式**：Graphics 渐变绘制

```typescript
// 木轴尺寸：480×24
function createScrollBar(scene: Phaser.Scene, y: number): Graphics {
  const graphics = scene.add.graphics();
  const width = 480;
  const height = 24;

  // 1. 主体渐变（模拟木纹）
  graphics.fillGradientStyle(
    0x8B7355, 1,  // 左上：浅棕
    0x8B7355, 1,  // 右上
    0x6B5344, 1,  // 左下：深棕
    0x6B5344, 1   // 右下
  );
  graphics.fillRect(0, y, width, height);

  // 2. 木纹条纹（3条深色线）
  graphics.lineStyle(1, 0x5A4030, 0.3);
  graphics.lineBetween(0, y + 6, width, y + 6);
  graphics.lineBetween(0, y + 12, width, y + 12);
  graphics.lineBetween(0, y + 18, width, y + 18);

  // 3. 顶部高光
  graphics.fillStyle(0xffffff, 0.1);
  graphics.fillRect(0, y, width, 2);

  // 4. 底部阴影
  graphics.fillStyle(0x000000, 0.2);
  graphics.fillRect(0, y + height - 2, width, 2);

  return graphics;
}
```

**相似度预估**：70%（无真实木纹纹理，渐变模拟）

---

### 3.2 宣纸背景 (PaperBackground)

**实现方式**：Graphics 渐变 + 边缘内阴影

```typescript
function createPaperBackground(scene: Phaser.Scene, x: number, y: number, width: number, height: number): Graphics {
  const graphics = scene.add.graphics();

  // 1. 主背景渐变（米黄 → 淡米）
  graphics.fillGradientStyle(
    0xFDF5E6, 1,  // 米黄（宣纸色）
    0xFDF5E6, 1,
    0xF5E6D3, 1,  // 淡米（底部老化效果）
    0xF5E6D3, 1
  );
  graphics.fillRect(x, y, width, height);

  // 2. 顶部内阴影（边缘老化）
  graphics.fillStyle(0x805020, 0.15);
  graphics.fillRect(x, y, width, 8);

  // 3. 底部内阴影
  graphics.fillStyle(0x805020, 0.15);
  graphics.fillRect(x, y + height - 8, width, 8);

  // 4. 左右边缘阴影
  graphics.fillStyle(0x805020, 0.1);
  graphics.fillRect(x, y, 4, height);
  graphics.fillRect(x + width - 4, y, 4, height);

  return graphics;
}
```

**相似度预估**：85%（渐变还原良好，无噪点纹理）

---

### 3.3 印章 (SealStamp)

**实现方式**：Graphics 绘制方形印章

```typescript
function createSealStamp(scene: Phaser.Scene, x: number, y: number): Container {
  const container = scene.add.container(x, y);
  const graphics = scene.add.graphics();

  // 1. 红色方形背景 (40×40)
  graphics.fillStyle(0xB3322A, 1);  // 朱红
  graphics.fillRect(-20, -20, 40, 40);

  // 2. 白色边框
  graphics.lineStyle(2, 0xFFFFFF, 0.8);
  graphics.strokeRect(-20, -20, 40, 40);

  // 3. 文字"仁心"（需要旋转）
  // Phaser文字不支持旋转，需用Graphics绘制或预加载图片
  // 简化方案：用Text + Container整体旋转
  const sealText = scene.add.text(0, 0, '仁心', {
    fontFamily: 'var(--font-title)',
    fontSize: '14px',
    color: '#FFFFFF',
    align: 'center'
  });
  sealText.setOrigin(0.5);

  container.add([graphics, sealText]);
  container.setRotation(-0.08);  // 约-5°旋转

  return container;
}
```

**相似度预估**：80%（形状还原，字体风格需匹配）

---

### 3.4 NPC圆形头像框 (NPCAvatar)

**实现方式**：Graphics 绘制圆形边框 + 文字首字

```typescript
function createNPCAvatar(scene: Phaser.Scene, npcName: string): Container {
  const container = scene.add.container(0, 0);
  const graphics = scene.add.graphics();

  // 1. 圆形背景
  graphics.fillStyle(0xFDF5E6, 1);  // 米黄背景
  graphics.fillCircle(18, 18, 18);

  // 2. 圆形边框
  graphics.lineStyle(1, 0xC8B898, 1);  // 边框色
  graphics.strokeCircle(18, 18, 18);

  // 3. 首字文字
  const firstChar = npcName.charAt(0);  // "青木先生" → "青"
  const avatarText = scene.add.text(18, 18, firstChar, {
    fontFamily: 'var(--font-title)',
    fontSize: '20px',
    color: '#3A2A1A'
  });
  avatarText.setOrigin(0.5);

  container.add([graphics, avatarText]);
  return container;
}
```

**相似度预估**：90%（圆形样式完整还原）

---

### 3.5 心情标签 (MoodTag)

**实现方式**：Graphics 绘制 + Text

```typescript
function createMoodTag(scene: Phaser.Scene, mood: string, x: number, y: number): Container {
  const container = scene.add.container(x, y);
  const graphics = scene.add.graphics();

  // 标签尺寸：约50×20
  const width = 50;
  const height = 20;

  // 1. 红色边框
  graphics.lineStyle(1, 0xB3322A, 1);  // 朱红
  graphics.strokeRect(-width/2, -height/2, width, height);

  // 2. 文字
  const moodText = scene.add.text(0, 0, mood, {
    fontFamily: 'var(--font-serif)',
    fontSize: '10px',
    color: '#B3322A'
  });
  moodText.setOrigin(0.5);

  container.add([graphics, moodText]);
  return container;
}
```

**相似度预估**：95%（样式完全匹配）

---

### 3.6 金棕色边框 (GoldBorder)

**实现方式**：Graphics lineStyle + 外发光

```typescript
function createGoldBorder(scene: Phaser.Scene, x: number, y: number, width: number, height: number): Graphics {
  const graphics = scene.add.graphics();

  // 1. 外发光（模拟光晕）
  graphics.lineStyle(4, 0xC0A080, 0.3);  // 金棕低透明度
  graphics.strokeRect(x - 2, y - 2, width + 4, height + 4);

  // 2. 主边框
  graphics.lineStyle(2, 0xC0A080, 0.6);  // 金棕
  graphics.strokeRect(x, y, width, height);

  return graphics;
}
```

**相似度预估**：90%（发光效果模拟良好）

---

### 3.7 竖排文字标签（简化）

**原设计**：`writing-mode: vertical-rl` 竖排显示"学生"

**Phaser限制**：不支持竖排文字

**简化方案**：改为横向标签，红色边框 + "学生："

```typescript
function createPlayerLabel(scene: Phaser.Scene): Container {
  // 与心情标签类似，文字改为"学生"
  // 用斜体 + 左边框样式区分
}
```

---

### 3.8 选项卡片 (OptionCard)

**实现方式**：DOM Button 或 Graphics + Text

```typescript
interface DialogOption {
  id: string;
  text: string;
  tag: string;  // "深问"、"取穴"等
}

function createOptionCards(scene: Phaser.Scene, options: DialogOption[]): Container[] {
  // 每个选项：
  // - 左边框2px 朱红
  // - 标签小方块（红色边框）
  // - 文字内容
  // - hover效果（背景变色）
}
```

---

## 4. 配色方案

### 4.1 新增配色常量

```typescript
// src/data/ui-color-theme.ts 新增

export const SCROLL_COLORS = {
  // 文字色系
  INK: 0x3A2A1A,          // 主文字（墨色）
  INK_SOFT: 0x5A4A3A,     // 正文（柔和墨）
  INK_FAINT: 0x8A7A6A,    // 弱化（淡墨）

  // 朱红系
  VERMILION: 0xB3322A,    // 朱红（主强调色）
  VERMILION_SOFT: 0xD07068, // 柔和朱红

  // 宣纸色系
  PAPER_LIGHT: 0xFDF5E6,  // 米黄（宣纸）
  PAPER_DARK: 0xF5E6D3,   // 淡米（老化）
  PAPER_EDGE: 0xC8B898,   // 边框色

  // 木轴色系
  WOOD_LIGHT: 0x8B7355,   // 浅棕
  WOOD_DARK: 0x6B5344,    // 深棕
  WOOD_STREAK: 0x5A4030,  // 木纹

  // 金边系
  GOLD_BORDER: 0xC0A080,  // 金棕边框
  GOLD_GLOW: 0xC0A080,    // 金棕发光

  // 阴影系
  EDGE_SHADOW: 0x805020,  // 边缘阴影
};
```

---

## 5. 功能改动

### 5.1 保留功能

| 功能 | 说明 |
|------|------|
| 流式文字显示 | 逐字显示，字体改为仿宋风格 |
| 输入框 | DOM input，透明背景 + 米黄边框 |
| 停止生成按钮 | 改为"停笔"标签风格 |
| 工具调用回调 | onToolCall 保持不变 |
| NPC精灵图 | 保留，叠加圆形头像框 |

### 5.2 新增功能

| 功能 | 说明 |
|------|------|
| 对话历史滚动 | 内容超长时可滚动查看 |
| 选项卡片 | NPC推荐问题，点击快速选择 |
| 富文本高亮 | [[classic:xxx]] 显示为红色（暂不实现点击） |
| 系统消息样式 | 解锁提示等特殊样式（居中+朱红） |

### 5.3 API扩展

```typescript
interface DialogUIConfig {
  npcId: string;
  npcName: string;
  npcSpriteKey: string;
  playerId: string;
  mood?: string;           // 新增：心情标签
  title?: string;          // 新增：NPC头衔
  options?: DialogOption[]; // 新增：推荐问题
  onToolCall?: ToolCallCallback;
  onComplete?: () => void;
}
```

---

## 6. 文件修改范围

| 文件 | 修改内容 |
|------|----------|
| `src/ui/DialogUI.ts` | 全面视觉改进，布局调整，新增选项区 |
| `src/data/ui-color-theme.ts` | 新增 SCROLL_COLORS 配色常量 |

---

## 7. 实施优先级

| 优先级 | 任务 | 预估复杂度 |
|--------|------|------------|
| P1 | 木轴 + 宣纸背景绘制 | 中 |
| P2 | 金边框 + 内阴影 | 低 |
| P3 | NPC圆形头像 + 心情标签 | 低 |
| P4 | 印章绘制 | 低 |
| P5 | 输入框样式改进 | 低 |
| P6 | 选项卡片组件 | 中 |
| P7 | 对话历史滚动 | 中 |
| P8 | 流式文字字体风格 | 低 |

---

## 8. 验收标准

1. **视觉相似度**：整体风格与原卷轴设计70%+相似
2. **功能完整**：所有现有对话功能正常工作
3. **E2E测试**：`tests/e2e/npc-dialog.spec.ts` 19/19通过
4. **无回归**：不影响其他HTML小游戏UI

---

*设计文档由 Claude Code 生成，待用户审核后进入实施阶段*