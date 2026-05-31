# 对话UI HTML嵌入设计文档

**日期**: 2026-05-14
**阶段**: Phase 2.5 Hermes NPC后端开发
**分支**: hermes-agent-dev
**最后更新**: 2026-05-15（根据评审建议完善）

---

## 一、问题定义

### 1.1 当前状态

现有 `DialogUI.ts` 是基于 Phaser GameObject Container 实现的对话界面：

```
Phaser Scene → DialogUI (Phaser.Container)
                    ↓
              SSEClient → Hermes Backend
                    ↓
              简单文本显示 + 停止按钮
```

**当前能力**：
- ✅ SSE流式文本显示
- ✅ 用户输入框
- ✅ 停止生成按钮
- ✅ Tool Call回调传递

**当前缺陷**：
- ❌ 视觉风格与项目古风主题不符（灰蓝渐变卡片）
- ❌ 无富文本教学标记（`[[herb:黄芪]]` 无法渲染）
- ❌ 无多轮对话历史记录（每次只显示最新一条）
- ❌ 无NPC心情/标题/印章等信息展示
- ❌ 无预设选项列表（深问/取穴/食疗等引导）

### 1.2 设计文档已存在

`docs/ui/对话窗口/` 目录已包含完整设计：

| 文件 | 内容 | 状态 |
|------|------|------|
| `dialog-scroll.jsx` | 卷轴风React组件 | ✅ 完整 |
| `rich-text.jsx` | 富文本标记组件 | ✅ 完整 |
| `styles.css` | 古风样式定义 | ✅ 完整 |
| `中医古风对话框.html` | HTML原型 | ✅ 完整 |

### 1.3 核心问题

**如何将设计文档中的高质量UI迁移到游戏系统中？**

---

## 二、接口定义

### 2.1 React组件Props接口

**DialogUIProps**（对应现有 DialogUIConfig）：

```typescript
// src/ui/html/DialogUI.tsx
export interface DialogUIProps {
  npcId: string;              // NPC唯一标识（如 'qingmu'）
  npcName: string;            // NPC显示名称（如 '苏老郎中'）
  playerId: string;           // 玩家ID（如 'player_001'）
  onToolCall?: (name: string, args: Record<string, unknown>) => void;  // Tool Call回调
  onClose?: () => void;       // 关闭回调
}
```

**对比现有接口变更**：
| 字段 | DialogUIConfig | DialogUIProps | 变化说明 |
|------|-----------------|---------------|----------|
| npcSpriteKey | ✅ 有 | ❌ 移除 | React使用CSS绘制头像占位 |
| onComplete | ✅ 有 | ❌ 移除 | 改为内部状态管理，不暴露 |

### 2.2 对话消息接口

**DialogMessage**：

```typescript
// src/ui/html/bridge/dialog-events.ts
export interface DialogMessage {
  role: 'npc' | 'player' | 'narration' | 'system';  // 消息角色
  name?: string;           // NPC名（role='npc'时必需）
  title?: string;          // NPC头衔（如 '杏林前辈'）
  mood?: string;           // NPC心情（如 '温和'）
  text: string;            // 消息内容（含富文本标记）
  timestamp?: number;      // 时间戳（可选）
}
```

### 2.3 TCM教学数据接口

**TCMEntry**：

```typescript
// src/ui/html/data/tcm-data.ts
export interface TCMEntry {
  pinyin: string;          // 拼音/出处
  tag: string;             // 类型标签（如 '药材'、'穴位'）
  meta: Record<string, string>;  // 元数据（如 { '性味': '甘，平', '归经': '脾经' }）
  body: string;            // 详细说明
}

export interface TCMData {
  herb: Record<string, TCMEntry>;      // 药材
  acupoint: Record<string, TCMEntry>;  // 穴位
  classic: Record<string, TCMEntry>;   // 古文引用
  symptom: Record<string, TCMEntry>;   // 证候
}
```

### 2.4 GameStateBridge扩展接口

**新增方法签名**：

```typescript
// src/utils/GameStateBridge.ts（扩展）
class GameStateBridge {
  // 对话历史存储（按NPC ID分组）
  private dialogHistory: Map<string, DialogMessage[]> = new Map();

  /**
   * 获取NPC对话历史
   * @param npcId NPC唯一标识
   * @returns 对话消息数组（最多50条）
   */
  getDialogHistory(npcId: string): DialogMessage[];

  /**
   * 设置NPC对话历史
   * @param npcId NPC唯一标识
   * @param messages 对话消息数组（超出50条自动裁剪最早记录）
   */
  setDialogHistory(npcId: string, messages: DialogMessage[]): void;

  /**
   * 清除NPC对话历史
   */
  clearDialogHistory(npcId: string): void;
}
```

### 2.5 Bridge事件接口

**DIALOG_EVENTS常量**：

```typescript
// src/ui/html/bridge/dialog-events.ts
export const DIALOG_EVENTS = {
  TOOL_CALL: 'dialog:tool:call',    // React → Phaser：触发工具调用
  CLOSE: 'dialog:close',            // React → Phaser：关闭对话UI
};

export interface DialogToolCallEvent {
  name: string;                      // 工具名（如 'trigger_minigame'）
  args: Record<string, unknown>;     // 工具参数
}
```

---

## 三、边界定义

### 3.1 本次包含

| 内容 | 说明 |
|------|------|
| **React组件迁移** | dialog-scroll.jsx → DialogUI.tsx |
| **富文本系统** | rich-text.jsx + TCM_DATA |
| **古风样式** | styles.css → dialog.css |
| **对话历史** | 多轮记录存储（GameStateBridge），最多保留50轮，超出裁剪最早记录 |
| **SSE流处理** | React层直接调用SSEClient |
| **Tool Call bridge** | React→Phaser事件传递 |
| **Scene集成** | GardenScene/ClinicScene调用 |
| **旧代码删除** | 实现完成后删除 src/ui/DialogUI.ts |

### 3.2 本次不包含（后续Phase）

| 内容 | 说明 | 所属Phase |
|------|------|-----------|
| **NPC扩展** | laozhang/neighbor角色定义 | Phase 2.5续 |
| **真实数据存储** | MockGameStore→真实游戏状态 | Phase 3 |
| **对话日志分析** | 教学效果可视化 | Phase 3 |
| **NPC个性化** | 不同NPC教学风格差异 | Phase 3 |
| **预设选项生成** | AI动态生成选项列表 | Phase 3 |

### 3.3 技术边界

| 边界 | 说明 |
|------|------|
| **渲染层** | React组件挂载到document.body，不嵌入Phaser DOM |
| **数据层** | SSEClient在React调用，对话历史存GameStateBridge |
| **事件层** | Tool Call必须走bridge，因为只有Phaser能控制场景 |
| **生命周期** | entry文件管理createRoot/unmount |
| **历史限制** | 最多保留50轮对话，超出裁剪 |

---

## 四、系统集成方式

### 4.1 架构图

```
┌─────────────────────────────────────────────────────────┐
│                     Phaser Game                          │
│  ┌─────────────────────────────────────────────────┐   │
│  │ GardenScene / ClinicScene                        │   │
│  │  ├── showDialogUI(options)                       │   │
│  │  ├── handleToolCall(name, args)                  │   │
│  │  └── onClose()                                   │   │
│  └─────────────────────────────────────────────────┘   │
│                          ↑                              │
│                    bridge/dialog-events                  │
│                          ↓                              │
└─────────────────────────────────────────────────────────┘
                           ↑
┌─────────────────────────────────────────────────────────┐
│                   React Layer                            │
│  ┌─────────────────────────────────────────────────┐   │
│  │ DialogUI.tsx                                     │   │
│  │  ├── SSEClient.chatStream()                      │   │
│  │  ├── RichText + TCM_DATA                         │   │
│  │  ├── messages[] (对话历史，最多50条)               │   │
│  │  └── EventBus.emit(TOOL_CALL)                    │   │
│  └─────────────────────────────────────────────────┘   │
│                          ↓                              │
│                    dialog.css (古风样式)                 │
│                          ↓                              │
│  ┌─────────────────────────────────────────────────┐   │
│  │ dialog-entry.tsx                                 │   │
│  │  ├── createRoot(document.body)                   │   │
│  │  └── unmount()                                   │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│                  Hermes Backend                          │
│  /v1/chat/stream → SSE text + tool_call                 │
└─────────────────────────────────────────────────────────┘
```

**说明**：本架构增加了bridge层和GameStateBridge扩展，职责分离更清晰而非简化。每层有明确责任：
- Phaser层：场景控制、Tool Call执行
- React层：UI渲染、用户交互、SSE流处理
- Bridge层：事件传递、数据桥接

### 4.2 与现有HTML UI的一致性

参考已成功的HTML嵌入模式（背包/煎药/诊断）：

| 系统 | entry文件 | 组件 | 样式 | bridge |
|------|-----------|------|------|---------|
| 背包 | inventory-entry.tsx | InventoryUI.tsx | inventory.css | inventory-events.ts |
| 煎药 | decoction-entry.tsx | DecoctionUI.tsx | decoction.css | events.ts |
| 诊断 | diagnosis-entry.tsx | DiagnosisUI.tsx | diagnosis.css | diagnosis-events.ts |
| **对话** | dialog-entry.tsx | DialogUI.tsx | dialog.css | dialog-events.ts |

遵循相同模式，保证架构一致性。

### 4.3 数据流向

**用户输入 → NPC响应**：
```
React Input → SSEClient.chatStream → Hermes Backend → SSE chunk → React state → 渲染
```

**Tool Call → 场景切换**：
```
Hermes返回tool_call → SSEClient解析 → React onToolCall → EventBus.emit → Phaser handleToolCall → 对话UI淡出(0.5s) → 场景切换
```

**对话历史 → 持久化**：
```
React messages[] → GameStateBridge.setDialogHistory → 内存存储（最多50条） → 下次对话加载
```

---

## 五、实现后效果

### 5.1 视觉效果

**卷轴风古风界面**：
- 顶部/底部木轴装饰（金色渐变）
- 宣纸纹理背景（微妙纸张质感）
- 古风字体（Noto Serif SC、Ma Shan Zheng）
- 印章装饰（NPC标识）

**富文本教学标记**：
```
原文：可用[[herb:黄芪]]配[[herb:甘草]]为君，再灸[[acupoint:足三里]]以培土生金。

渲染：
- "黄芪" → 绿色高亮 + hover显示性味归经
- "甘草" → 绿色高亮 + hover显示功效
- "足三里" → 红色高亮 + hover显示定位主治
```

### 5.2 功能效果

**多轮对话历史**：
```
[旁白] 【辰时三刻 · 仁心堂内】...
[NPC] 苏老郎中：小友既来，便是有缘...
[玩家] 多谢先生。学生只觉...
[NPC] 脉浮而虚，确是中气不足之象...
[系统] ✦ 解锁医案条目：气虚证的基本调治
```

**NPC信息展示**：
- 姓名：苏老郎中
- 头衔：杏林前辈 · 六十年临证
- 心情标签：温和/思索/严肃

### 5.3 交互效果

| 操作 | 效果 |
|------|------|
| 输入问题 | 文本框输入，Enter发送 |
| 查看教学标记 | hover显示tooltip（性味归经等） |
| NPC触发小游戏 | Tool Call → 对话UI淡出0.5s → 场景切换 |
| 关闭对话 | 点击右上角×按钮，对话UI消失 |
| 查看历史 | 对话历史滚动显示，最多50条 |

---

## 六、验收标准

### 6.1 功能验收

| 标准 | 测试方法 | 通过条件 |
|------|----------|----------|
| 对话UI显示 | E2E: NPC-S01 | `.dialog-scroll` visible |
| NPC信息正确 | E2E: NPC-S02 | `.dialog-title` contains NPC名 |
| 用户输入 | E2E: NPC-D01 | 输入框可填写并发送 |
| 流式响应 | E2E: NPC-D03 | 文本逐步显示 |
| 停止生成 | E2E: NPC-D04 | 停止按钮可中断 |
| Tool Call触发 | E2E: NPC-TC01 | 场景切换事件触发 |
| 对话历史保留 | E2E: 新增测试 | 关闭再开历史存在 |
| 历史裁剪 | E2E: 新增测试 | 超过50条后最早记录消失 |

### 6.2 边界情况测试

| 场景 | 测试方法 | 预期行为 |
|------|----------|----------|
| SSE连接失败 | 断开Hermes Backend | 显示错误提示："连接失败，请稍后重试" |
| LLM超时 | 设置短timeout（5s） | 显示超时提示，提供重试按钮 |
| Tool Call失败 | 返回无效工具名 | 显示系统消息："操作失败" |
| 网络断开重连 | 中途断开→恢复 | 自动重连，恢复对话 |
| 空输入发送 | 输入框为空时点击发送 | 不发送，输入框保持焦点 |

### 6.3 视觉验收（量化标准）

| 标准 | CSS选择器验证 |
|------|---------------|
| 卷轴风格 | `.scroll-bar-top` 存在且高度24px |
| 宣纸纹理 | `.dialog-paper` 背景色为 #f0e6d2 |
| 古风字体 | CSS引用 `Noto Serif SC` 和 `Ma Shan Zheng` |
| 印章显示 | `.dialog-seal` 存在且显示NPC名字首字 |
| 富文本标记 | `.tcm-herb` hover后 `.tcm-tooltip` opacity=1 |

### 6.4 架构验收

| 标准 | 验收方法 |
|------|----------|
| entry挂载模式 | 与inventory-entry.tsx模式一致 |
| bridge事件定义 | DIALOG_EVENTS 常量包含 TOOL_CALL/CLOSE |
| SSEClient位置 | React层直接调用（不经过Phaser） |
| GameStateBridge扩展 | getDialogHistory/setDialogHistory 方法存在 |
| 旧代码删除 | src/ui/DialogUI.ts 文件不存在 |

### 6.5 测试覆盖率

| 指标 | 目标 |
|------|------|
| E2E测试 | 21/21 通过（迁移19个 + 新增2个） |
| TypeScript | 无编译错误 |
| 构建产物 | 无运行时错误 |

---

## 七、风险评估

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| SSE流处理位置变更 | 中 | React层调用，保持SSEClient接口不变 |
| 测试选择器变更 | 中 | 渐进迁移，保留测试框架 |
| 对话历史丢失 | 低 | GameStateBridge存储，最多50条持久化 |
| Tool Call延迟 | 低 | bridge事件层，实测延迟<10ms |
| React与Phaser焦点冲突 | 中 | 输入框focus时禁用Phaser键盘 |
| 内存累积 | 低 | 限制50条历史，自动裁剪 |

---

## 八、参考文档

| 文档 | 路径 |
|------|------|
| 设计原型 | `docs/ui/对话窗口/` |
| 现有实现（待删除） | `src/ui/DialogUI.ts` |
| SSE客户端 | `src/utils/sseClient.ts` |
| GameStateBridge | `src/utils/GameStateBridge.ts` |
| 背包参考 | `src/ui/html/InventoryUI.tsx` |
| 煎药参考 | `src/ui/html/DecoctionUI.tsx` |
| 测试文件 | `tests/e2e/npc-dialog.spec.ts` |

---

## 九、实现清单

### 9.1 文件创建

| 文件 | 职责 |
|------|------|
| `src/ui/html/bridge/dialog-events.ts` | 事件常量定义 |
| `src/ui/html/dialog-entry.tsx` | React入口挂载 |
| `src/ui/html/DialogUI.tsx` | React主组件 |
| `src/ui/html/dialog.css` | 古风卷轴样式 |
| `src/ui/html/data/tcm-data.ts` | 教学数据库 |

### 9.2 文件修改

| 文件 | 修改内容 |
|------|----------|
| `src/utils/GameStateBridge.ts` | 添加对话历史存储方法 |
| `src/scenes/GardenScene.ts` | 替换DialogUI为showDialogUI调用 |
| `src/scenes/ClinicScene.ts` | 替换DialogUI为showDialogUI调用 |
| `tests/e2e/npc-dialog.spec.ts` | DOM选择器调整 + 新增边界测试 |

### 9.3 文件删除

| 文件 | 删除时机 |
|------|----------|
| `src/ui/DialogUI.ts` | 实现完成后，测试通过后删除 |