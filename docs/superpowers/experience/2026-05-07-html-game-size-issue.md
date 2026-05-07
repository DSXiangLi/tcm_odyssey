# HTML小游戏尺寸超出游戏窗口问题修复经验

**日期**: 2026-05-07
**问题**: 病案集游戏UI超出游戏窗口
**影响**: 用户无法看到完整界面，需要滚动
**严重级别**: HIGH

---

## 1. 问题发现

### 用户反馈

> 请调整病案游戏的窗口大小，当前已经超过了游戏窗口的大小，最好和其他游戏保持一致，并且给出一个统一的html小游戏接入的窗口大小规范

### 现象

- 病案集UI宽度超过1400px
- 病案集UI高度超过880px
- 游戏窗口只有800×600
- UI超出140% × 147%

---

## 2. 根本原因分析

### Phase 1: 证据收集

**CSS尺寸定义** (casebook.css:67-68):

```css
.book {
  width: min(1400px, 96vw);
  height: min(880px, 92vh);
}
```

**游戏窗口配置** (game.config.ts):

```typescript
width: 800,
height: 600,
```

### Phase 2: 对比分析

对比所有HTML小游戏的尺寸：

| 游戏 | CSS尺寸定义 | 超出程度 |
|------|------------|----------|
| **病案集** | `min(1400px, 96vw) × min(880px, 92vh)` | 140% × 147% ❌ |
| **诊断游戏** | `1150px × 680px` | 144% × 113% ❌ |
| **煎药游戏** | `1150px × 680px` | 144% × 113% ❌ |
| **炮制游戏** | `100vw × 100vh` | 全屏 ❌ |
| **背包游戏** | `90vw max-1200px × 85vh max-700px` | 响应式 ⚠️ |

**关键发现**:
- 所有小游戏都超出800×600
- 原因：独立设计时未考虑嵌入限制
- 背包游戏相对合理（响应式设计）

---

## 3. 系统调试流程

### 使用的技能

`/superpowers:systematic-debugging` - 系统调试流程

### 流程执行

#### Phase 1: 根本原因调查 ✅

1. **读取错误信息**: 无显式错误，用户反馈为准
2. **复现问题**: 打开病案集，UI超出窗口
3. **检查最近修改**: Phase 2.5 HTML嵌入设计
4. **收集证据**: 对比CSS尺寸定义

#### Phase 2: 模式分析 ✅

1. **找到工作案例**: 背包游戏相对合理
2. **对比差异**:
   - 病案集：固定大尺寸
   - 背包：响应式 + max限制
3. **识别依赖**: CSS容器尺寸

#### Phase 3: 假设与测试 ✅

**假设**: 病案集容器尺寸应改为 `min(760px, 90vw) × min(560px, 85vh)`

**测试验证**:
- 修改CSS第67-68行
- 调整内部元素尺寸（padding、字体）
- 运行E2E测试验证

#### Phase 4: 实施 ✅

1. **创建规范文档**: `docs/superpowers/specs/phase2.5/2026-05-07-html-game-embedding-size-spec.md`
2. **修改病案集CSS**: 容器尺寸 + 内部元素适配
3. **运行测试**: 2/2通过
4. **验证修复**: 截图确认

---

## 4. 修复方案

### 容器尺寸调整

```css
/* 修改前 */
.book {
  width: min(1400px, 96vw);
  height: min(880px, 92vh);
}

/* 修改后 */
.book {
  width: min(760px, 90vw);   /* 适配800px窗口 */
  height: min(560px, 85vh);  /* 适配600px窗口 */
}
```

### 内部元素适配

| 元素 | 修改内容 | 理由 |
|------|----------|------|
| `.page` padding | 56px → 32px | 减小边距 |
| `.cover-title .main` | 64px → 48px | 标题字体 |
| `.right-header .cat-title` | 44px → 36px | 分类标题 |
| `.case-card` padding | 16px → 12px | 卡片边距 |
| `.case-card .title` | 20px → 16px | 卡片标题 |
| `.big-seal` | 110px → 90px | 印章尺寸 |
| `.frame` inset | 40px → 28px | 边框内边距 |
| `.seal-mini` | 56px → 48px | 小印章 |
| `.big-q` | 220px → 180px | 大问号 |
| `.page-num` position | bottom 22px → 16px | 页码位置 |

---

## 5. 统一规范制定

### 规范文档

创建了 `docs/superpowers/specs/phase2.5/2026-05-07-html-game-embedding-size-spec.md`

### 核心标准

**HTML小游戏容器尺寸必须适配游戏窗口（800×600）**

### 推荐方案

**方案A: 固定尺寸**
```css
.container {
  width: 760px;   /* 800 - 40px边距 */
  height: 560px;  /* 600 - 40px边距 */
}
```

**方案B: 响应式尺寸**（推荐）
```css
.container {
  width: min(760px, 90vw);
  height: min(560px, 85vh);
}
```

---

## 6. 经验教训

### E1: 独立设计时的尺寸问题

**问题**: HTML小游戏独立设计时未考虑嵌入限制

**教训**:
- 嵌入式UI设计必须在开始时就确定容器尺寸限制
- 独立原型设计时就应该考虑最终嵌入环境
- 设计文档应该明确标注"目标嵌入尺寸"

**预防措施**:
- 创建统一规范文档（已完成）
- 设计阶段就检查容器尺寸
- 原型验收时测试嵌入效果

### E2: CSS相对单位的使用

**问题**: `min(1400px, 96vw)` 在大屏幕上超出窗口

**教训**:
- 响应式设计必须有最大尺寸限制
- `min()` 函数应该限制在目标尺寸内
- 使用 `min(target, percentage)` 而非 `min(large, percentage)`

**正确用法**:
```css
/* 错误 */
width: min(1400px, 96vw);  /* 在大屏上1400px超出800px */

/* 正确 */
width: min(760px, 90vw);   /* 最大760px，适配800px */
```

### E3: 内部元素的连锁影响

**问题**: 减小容器尺寸后，内部元素仍然过大

**教训**:
- 容器尺寸修改必须同步调整内部元素
- 字体、边距、间距需要系统性缩放
- 一次性修复所有相关尺寸定义

**修复清单**:
1. 容器尺寸
2. 内边距 (padding)
3. 字体大小 (font-size)
4. 元素尺寸 (width/height)
5. 位置偏移 (position offset)

### E4: 系统调试流程的价值

**问题**: 初次尝试可能只修改容器尺寸，忽略内部元素

**教训**:
- 使用 `/superpowers:systematic-debugging` 确保系统化修复
- Phase 2对比分析帮助识别连锁影响
- Phase 3假设测试确保修复完整性

**流程收益**:
- 一次性修复所有相关问题
- 防止遗漏内部元素适配
- 验证修复效果

---

## 7. 后续任务

### P1: 优先修复其他游戏

| 游戏 | 当前状态 | 预计工作量 |
|------|----------|------------|
| 诊断游戏 | 1150×680 | 中等（5阶段需重新布局） |
| 煎药游戏 | 1150×680 | 中等（药材架需调整） |
| 炮制游戏 | 100vw×100vh | 高（全屏改响应式） |

### P2: 验收标准

- [ ] 所有HTML小游戏不超过800×600
- [ ] UI在游戏窗口内完整可见
- [ ] 无需滚动即可看到主要交互元素
- [ ] 规范文档纳入设计流程

---

## 8. 相关文件

### 修改文件

| 文件 | 修改行数 | 修改内容 |
|------|----------|----------|
| `src/ui/html/casebook.css` | 11处 | 容器尺寸 + 内部元素 |

### 新增文件

| 文件 | 内容 |
|------|------|
| `docs/superpowers/specs/phase2.5/2026-05-07-html-game-embedding-size-spec.md` | 统一规范文档 |
| `docs/superpowers/experience/2026-05-07-html-game-size-issue.md` | 本经验文档 |

### 测试验证

| 测试 | 结果 |
|------|------|
| `tests/e2e/casebook-flow.spec.ts` | 2/2通过 |
| UI样式测试 | ✅ |
| 截图测试 | ✅ |

---

## 9. Git提交记录

```bash
git add src/ui/html/casebook.css
git add docs/superpowers/specs/phase2.5/2026-05-07-html-game-embedding-size-spec.md
git add docs/superpowers/experience/2026-05-07-html-game-size-issue.md

git commit -m "fix(phase2.5): adjust casebook UI size to fit game window

- Problem: Casebook UI exceeded game window (800x600)
- Root cause: CSS container size min(1400px, 96vw) × min(880px, 92vh)
- Fix: Adjusted to min(760px, 90vw) × min(560px, 85vh)
- Adjusted internal elements (padding, font-size, element sizes)
- Created unified spec: docs/superpowers/specs/phase2.5/2026-05-07-html-game-embedding-size-spec.md
- Recorded experience: docs/superpowers/experience/2026-05-07-html-game-size-issue.md

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## 10. 总结

**问题**: 病案集UI超出游戏窗口
**原因**: CSS容器尺寸未考虑嵌入限制
**修复**: 系统化调整容器尺寸 + 内部元素
**规范**: 制定统一标准，预防后续问题
**流程**: 系统调试确保一次性完整修复

---

*本经验文档由 Claude Code 维护*