# 对话历史传递断裂问题

**日期**: 2026-06-06
**问题类型**: 数据流断裂
**影响范围**: NPC对话系统、Agent Loop Pattern
**严重程度**: HIGH - 导致NPC无法记忆上下文，每次对话独立无关联

---

## 问题表现

NPC Agent 每次对话都「从零开始」，无法记住之前的对话内容：
- 玩家问「刚才你说什么？」→ NPC 回复「我没有说过任何内容」
- 玩家连续对话 → NPC 每次都像第一次见面
- 教学场景 → NPC 无法引用之前讲解的知识点

---

## 根本原因

**对话历史只在前端保存，从未传递给后端LLM**

### 数据流断裂点

```
前端保存历史 → GameStateBridge.setDialogHistory() ✅
前端发送请求 → SSEClient.chatStream() ❌ 缺少 history
后端接收请求 → stream_consumer.py ❌ 只用 user_message
```

### 涉及文件

| 层级 | 文件 | 行号 | 状态 | 问题 |
|------|------|------|------|------|
| **前端存储** | `GameStateBridge.ts` | 75, 257-261 | ✅ | 正常存储历史 |
| **前端发送** | `DialogUI.tsx` | 518-522 | ❌ | 未传递 history |
| **前端定义** | `SSEClient.tsx` | 47 | ⚠️ | 定义了但未使用 |
| **后端接收** | `stream_consumer.py` | 88-91 | ❌ | 只用 user_message |

### 代码证据

**前端 DialogUI.tsx (第518-522行)** - 发送请求时只传3个字段：
```typescript
const request: ChatRequest = {
  npc_id: npcId,
  player_id: playerId,
  user_message: text
};
// 缺少: context.recent_history ❌
```

**前端 SSEClient.tsx (第47行)** - 定义了 context 但从未填充：
```typescript
export interface ChatRequest {
  npc_id: string;
  player_id: string;
  user_message: string;
  context?: {
    scene_id?: string;
    recent_history?: Array<{role: string; content: string}>;  // 未使用
  };
}
```

**后端 stream_consumer.py (第88-91行)** - messages 从零开始：
```python
messages = [
  {'role': 'system', 'content': system_prompt},
  {'role': 'user', 'content': user_message}
]
# 缺少: 从 request 获取历史 ❌
```

---

## 修复方案

### 前端修复

**DialogUI.tsx** - 发送请求时传递历史：

```typescript
// 从 GameStateBridge 获取历史
const bridge = GameStateBridge.getInstance();
const history = bridge.getDialogHistory(npcId);

// 转换为 OpenAI 格式
const recentHistory = history
  .slice(-10)  // 最近10条（避免token过多）
  .map(msg => ({
    role: msg.role === 'player' ? 'user' : 'assistant',
    content: msg.text
  }));

// 发送请求时传递
const request: ChatRequest = {
  npc_id: npcId,
  player_id: playerId,
  user_message: text,
  context: {
    recent_history: recentHistory
  }
};
```

### 后端修复

**stream_consumer.py** - 接收历史并加入 messages：

```python
def stream_chat(request: Dict[str, Any]) -> Generator[...]:
    # ... 现有代码 ...

    # 获取历史对话（如果有）
    recent_history = request.get('context', {}).get('recent_history', [])

    # 构建 messages（包含历史）
    messages = [{'role': 'system', 'content': system_prompt}]

    # 加入历史对话
    for hist_msg in recent_history:
        messages.append({
            'role': hist_msg['role'],
            'content': hist_msg['content']
        })

    # 加入当前用户消息
    messages.append({'role': 'user', 'content': user_message})
```

---

## 关键教训

### 1. 数据流必须完整验证

**错误假设**: 「定义了接口字段就等于传递了数据」

**正确做法**:
- 接口定义 ≠ 数据传递
- 每个数据字段必须追踪完整路径：定义 → 填充 → 传输 → 接收 → 使用

**检查清单**:
```
[ ] 接口定义了字段
[ ] 发送时填充了字段
[ ] 传输时携带了字段
[ ] 接收时提取了字段
[ ] 使用时读取了字段
```

### 2. 前后端数据契约必须显式

**错误模式**: 前端保存数据，假设后端「自然知道」

**正确模式**:
- 前端保存 → 前端发送 → 后端接收 → 后端使用
- 每一步都必须显式代码实现
- 添加新数据字段时，必须同步修改前端发送和后端接收

### 3. Agent Loop Pattern 的 messages 管理

**关键点**: `messages` 数组是 LLM 的「记忆」

- **每次请求**: messages 必须包含历史 + 当前消息
- **工具调用后**: messages 必须追加 assistant + tool 结果
- **历史裁剪**: 避免 token 过多（推荐10-20条最近历史）

### 4. 测试必须验证完整数据流

**测试盲点**: 只测试了「对话能发送」，未测试「NPC能记忆」

**改进**:
- E2E 测试应包含连续对话场景
- 验证 NPC 能引用之前对话内容
- 测试「问刚才说了什么」→ NPC 应正确回答

---

## 防止再犯的检查规则

### CLAUDE.md 补充规则

```markdown
### 对话系统数据流检查（CRITICAL）

添加/修改对话相关功能时，必须验证数据流完整性：

1. **新数据字段添加**:
   - [ ] 前端接口定义
   - [ ] 前端发送填充
   - [ ] 后端接口接收
   - [ ] 后端代码使用

2. **现有数据字段修改**:
   - [ ] 检查完整传递路径
   - [ ] 同步更新前端发送和后端接收

3. **Agent Loop Pattern**:
   - messages 数组必须包含历史对话
   - 工具调用结果必须追加到 messages
```

---

## 相关文件索引

| 文件 | 职责 |
|------|------|
| `src/utils/GameStateBridge.ts` | 对话历史存储（前端） |
| `src/ui/html/DialogUI.tsx` | 对话UI、发送请求 |
| `src/utils/sseClient.ts` | SSE客户端、ChatRequest定义 |
| `hermes_backend/gateway/stream_consumer.py` | LLM流式响应、messages管理 |

---

## 验证修复成功

修复后测试场景：

1. **连续对话**:
   - 玩家：「你是谁？」→ NPC：「我是青木先生」
   - 玩家：「刚才你说你是谁？」→ NPC：「我说我是青木先生」

2. **教学上下文**:
   - 玩家：「讲讲黄芪」→ NPC：「黄芪是补气药...」
   - 玩家：「它有什么禁忌？」→ NPC：「黄芪的禁忌是...」（引用之前内容）

3. **工具调用记忆**:
   - NPC 查询背包后，能引用背包内容继续对话
   - 玩家：「我有哪些药材？」→ NPC查询→「你有当归、黄芪」

---

## 修复执行

修复优先级：HIGH

修复步骤：
1. 先写设计文档记录问题 ✅
2. 前端修复：DialogUI.tsx 传递历史 ✅
3. 后端修复：stream_consumer.py 接收历史 ✅
4. E2E 测试验证连续对话 ✅

**状态**: ✅ 已修复并验证成功

---

## 修复验证结果

**测试时间**: 2026-06-06 15:50

测试场景：
1. **第一次对话（无历史）**: NPC 正常回复介绍自己
2. **第二次对话（有历史）**: NPC 能够引用历史内容 ✅
3. **第三次对话（引用NPC之前说）**: NPC 回答「青木」 ✅

测试脚本: `/tmp/test_dialog_history.py`

测试输出：
```
=== 测试1：第一次对话（无历史） ===
NPC回复: 老朽姓青名木，乃百草镇上一介医者...

=== 测试2：第二次对话（有历史） ===
NPC回复: 青木先生温和地微笑着说：
✅ SUCCESS: NPC能够引用之前的对话内容！

=== 测试3：引用NPC之前说的内容 ===
NPC回复: 青木。
✅ SUCCESS: NPC能够引用自己之前说的内容！
``