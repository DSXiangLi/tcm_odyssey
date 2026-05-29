# Hermes对话流式展示修复经验

**日期**: 2026-05-21
**问题**: NPC对话流式展示中工具卡片和思考内容在完成后消失
**影响**: 用户无法看到AI推理过程和工具调用结果，体验不完整
**严重级别**: HIGH

---

## 1. 问题发现

### 用户反馈

> 工具调用和工具结果都没出现。并且当前消息也不是流式。
> 顺序不对，最后信息都出完后，前面会重复展示所有thinking和最后的result。
> 这回是流式效果了，但是为何工具和工具间思考在最后回答之后又消失了？

### 现象

- 工具卡片(tool cards)在对话完成后消失
- 思考内容(thinking)在完成后消失
- 流式效果不明显（内容批量显示而非逐字）
- 内容重复显示（streaming内容与历史消息叠加）

---

## 2. 根本原因分析

### Phase 1: 理解Agent Loop Pattern

**Agent Loop核心流程**：

```
LLM生成 → tool_call → 执行工具 → tool_result → LLM继续生成 → 最终回答
```

**对应SSE事件序列**：

```
thinking (第一轮思考)
  ↓
text (第一轮文本，如"我来帮你查看")
  ↓
tool_call (触发工具，如get_inventory)
  ↓
tool_result (工具返回结果)
  ↓
thinking (第二轮思考，基于结果推理)
  ↓
text (第二轮文本，最终回答)
  ↓
session_end
```

**关键理解**：
- 存在**两轮**思考：pre-tool（执行前）和 post-tool（执行后）
- 存在**两轮**文本：pre-tool（引导语）和 post-tool（最终回答）
- 正确显示顺序：preThinking → preText → ToolCards → postThinking → postText

### Phase 2: 前端状态管理分析

**问题根源：状态分离不当**

```tsx
// 错误做法：合并所有thinking
const fullThinking = preToolThinking + postToolThinking;  // 合在一起显示

// 正确做法：分别保存
preThinking: preToolThinking,      // 第一轮思考
postThinking: postToolThinking,    // 第二轮思考
```

**问题根源：渲染来源单一**

```tsx
// 错误：MessageView只渲染msg.thinking（合并的）
{msg.thinking && <ThinkingView content={msg.thinking} />}

// 正确：按顺序分段渲染
{msg.preThinking && <ThinkingView content={msg.preThinking} />}
{msg.toolCalls && ...}
{msg.postThinking && <ThinkingView content={msg.postThinking} />}
```

### Phase 3: 工具卡片消失原因

**原因分析链**：

```
1. 工具卡片保存到msg.toolCalls ✓
2. MessageView组件没有渲染msg.toolCalls ✗
3. 工具卡片只从pendingToolCallsRef渲染（streaming状态）
4. onComplete后refs被清空
5. 历史消息中toolCalls存在但未渲染 → 卡片消失
```

---

## 3. 修复方案

### 3.1 数据结构修改

**文件**: `src/ui/html/bridge/dialog-events.ts`

```typescript
// 修改前
export interface DialogMessage {
  thinking?: string;  // 合并的thinking
  toolCalls?: ToolCallState[];
}

// 修改后
export interface DialogMessage {
  thinking?: string;          // deprecated
  preThinking?: string;       // 第一轮思考（tool执行前）
  postThinking?: string;      // 第二轮思考（tool执行后）
  toolCalls?: ToolCallState[];
}
```

### 3.2 onComplete保存逻辑

**文件**: `src/ui/html/DialogUI.tsx`

```tsx
// 修改前：合并thinking
const fullThinking = preToolThinkingRef.current + postToolThinkingRef.current;
const npcMsg = {
  thinking: fullThinking,
  toolCalls: savedToolCalls,
};

// 修改后：分别保存
const npcMsg: DialogMessage = {
  preThinking: preToolThinkingRef.current,      // 第一轮思考
  postThinking: postToolThinkingRef.current,    // 第二轮思考
  toolCalls: savedToolCalls,                    // 工具卡片
  text: fullText,
};
```

### 3.3 MessageView渲染顺序

**文件**: `src/ui/html/DialogUI.tsx`

```tsx
// 正确渲染顺序
if (msg.role === 'npc') {
  return (
    <div className="msg-npc">
      {/* 1. 第一轮思考 */}
      {msg.preThinking && <ThinkingView content={msg.preThinking} />}
      
      {/* 2. 工具卡片 */}
      {msg.toolCalls && msg.toolCalls.length > 0 && (
        <div className="msg-tool-calls-section">
          {msg.toolCalls.map(tc => <ToolCard key={tc.tid} tc={tc} />)}
        </div>
      )}
      
      {/* 3. 第二轮思考 */}
      {msg.postThinking && <ThinkingView content={msg.postThinking} />}
      
      {/* 4. 最终回答 */}
      <div className="msg-npc-text">
        <RichText text={msg.text} />
      </div>
    </div>
  );
}
```

---

## 4. 调试方法论

### 4.1 分层验证策略

**关键教训：不要假设，逐层验证**

```
后端 → SSE流 → 前端SSEClient → React State → DOM渲染
```

**验证步骤**：

1. **后端直连测试**：绕过前端，直接请求API
   ```python
   # /tmp/test_backend_streaming.py
   with httpx.Client().stream("POST", url, json=request) as response:
       for line in response.iter_lines():
           # 检查SSE事件序列是否正确
   ```

2. **前端console日志**：关键节点添加日志
   ```tsx
   console.log('[DialogUI] Tool call received:', name, 'tid:', tid);
   console.log('[DialogUI Render] preThinking:', ref.current.length);
   ```

3. **React State检查**：使用flushSync确保同步更新
   ```tsx
   flushSync(() => {
     pendingToolCallsRef.current.push({...});
     forceUpdate(n => n + 1);
   });
   ```

4. **DOM状态检查**：E2E测试中检查DOM元素
   ```typescript
   const toolCardCount = await page.evaluate(() => {
     return document.querySelectorAll('.tool-card').length;
   });
   ```

### 4.2 后端验证结果

```
Backend SSE Streaming Test
============================================================
[5.3s] THINKING: 玩家询问背包里的药材内容...
[5.3s] TEXT: 我来帮你查看一下背包里的药材。
[5.3s] TOOL_CALL: get_inventory (tid=call_xxx)
[9.3s] TOOL_RESULT: tid=call_xxx, snippet={"herbs": [...]}
[9.3s] THINKING: 学生查询背包里的药材，结果显示有...
[9.3s] TEXT: 你背包里现有：麻黄5株，桂枝3株...

Event Summary:
  thinking: 260 events (两轮)
  text: 86 events (两轮)
  tool_call: 1
  tool_result: 1
  session_end: 1
```

**结论**：后端SSE序列完全正确，问题在前端渲染。

---

## 5. 经验教训

### E1: 流式内容需要分段管理

**问题**: 将所有thinking/text合并在一起，导致显示顺序错误

**教训**:
- Agent Loop模式产生多轮内容，必须分段管理
- 使用`preTool`和`postTool`命名区分不同轮次
- 不要假设"所有内容都是连续的"

**预防措施**:
```tsx
// 正确：分离pre和post
const preToolThinkingRef = useRef('');
const postToolThinkingRef = useRef('');
const hasToolBeenCalledRef = useRef(false);

// 在onToolCall时切换
hasToolBeenCalledRef.current = true;  // 标记进入第二轮
```

### E2: 历史消息渲染必须包含所有字段

**问题**: 保存了toolCalls但MessageView没有渲染

**教训**:
- 添加新字段时必须同步更新渲染组件
- onComplete保存的内容≠streaming时显示的内容
- streaming内容清空后，历史消息应完整呈现

**正确做法**:
```tsx
// MessageView必须渲染所有保存的字段
{msg.preThinking && ...}
{msg.toolCalls && ...}
{msg.postThinking && ...}
{msg.text && ...}
```

### E3: 多轮思考的正确显示位置

**问题**: 第二轮思考(postThinking)放在工具卡片之前消失

**教训**:
- Thinking的显示位置必须对应其逻辑轮次
- preThinking在tool之前，postThinking在tool之后
- 用户需要看到"AI拿到结果后的思考过程"

**显示顺序规范**:
```
preThinking → preText → ToolCards → postThinking → postText
```

### E4: 调试时先验证最底层

**问题**: 多次修复前端但问题依旧，实际后端已正确

**教训**:
- 先验证数据源（后端API），再排查消费者（前端）
- 使用独立脚本测试后端，排除前端干扰
- 不要"修复假设的问题"，要"验证观察到的问题"

**调试顺序**:
```
1. 后端直连测试（Python脚本）
2. SSEClient日志检查
3. React State检查
4. DOM渲染检查
```

### E5: React状态更新时机问题

**问题**: tool_result匹配不到tool_call（tid不一致）

**教训**:
- SSE事件可能乱序到达，使用tid精确匹配
- React批量更新可能延迟，使用flushSync强制同步
- ref更新后立即forceUpdate触发渲染

**正确做法**:
```tsx
// 工具结果匹配
const targetIdx = pending.findIndex(tc => tc.tid === tid);

// 同步更新
flushSync(() => {
  pending[targetIdx] = {...pending[targetIdx], done: true};
  forceUpdate(n => n + 1);
});
```

---

## 6. 流式对话开发规范

### 6.1 Agent Loop内容分段

| 内容类型 | 时机 | 变量命名 | 显示位置 |
|---------|------|---------|---------|
| 第一轮思考 | tool_call前 | preThinking | tool之前 |
| 第一轮文本 | tool_call前 | preText | tool之前 |
| 工具调用 | agent触发 | toolCalls | 中间 |
| 第二轮思考 | tool_result后 | postThinking | tool之后 |
| 第二轮文本 | 最终回答 | postText | 最后 |

### 6.2 数据流检查清单

**后端检查**:
- [ ] SSE事件顺序正确：thinking→text→tool_call→tool_result→thinking→text
- [ ] tool_call包含tid
- [ ] tool_result包含匹配的tid
- [ ] thinking/text分多轮发送

**前端检查**:
- [ ] preTool/postTool refs分离
- [ ] hasToolBeenCalledRef在onToolCall时设为true
- [ ] onComplete分别保存preThinking和postThinking
- [ ] MessageView按顺序渲染所有字段
- [ ] tool result用tid匹配，而非数组索引

### 6.3 渲染顺序验证

```tsx
// 正确的NPC消息渲染顺序
function MessageView({ msg }: { msg: DialogMessage }) {
  if (msg.role === 'npc') {
    return (
      <div>
        {/* 1. preThinking */}
        {/* 2. ToolCards */}
        {/* 3. postThinking */}
        {/* 4. text */}
      </div>
    );
  }
}
```

---

## 7. 相关文件

### 修改文件

| 文件 | 修改内容 |
|------|---------|
| `src/ui/html/bridge/dialog-events.ts` | DialogMessage添加preThinking/postThinking字段 |
| `src/ui/html/DialogUI.tsx` | onComplete分别保存两轮thinking，MessageView按顺序渲染 |

### 参考文件

| 文件 | 说明 |
|------|------|
| `src/utils/sseClient.ts` | SSE客户端，处理tool_call/tool_result事件 |
| `hermes_backend/gateway/stream_consumer.py` | 后端SSE生成逻辑 |

---

## 8. 总结

**问题**: 工具卡片和第二轮思考完成后消失
**原因**: 
1. toolCalls保存到历史但MessageView未渲染
2. thinking合并保存，postThinking放在tool之前显示
**修复**: 
1. MessageView添加toolCalls渲染
2. 分离preThinking/postThinking，按正确顺序渲染
**规范**: 制定Agent Loop内容分段和渲染顺序规范

---

*本经验文档由 Claude Code 维护*