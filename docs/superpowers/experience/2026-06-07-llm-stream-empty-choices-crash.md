# LLM流式响应空choices数组导致崩溃

**日期**: 2026-06-07
**问题类型**: 后端崩溃
**影响范围**: NPC对话系统、SSE流式响应
**严重程度**: CRITICAL - 所有对话请求都会失败

---

## 问题表现

用户在对话框发送消息后，前端显示 "network error"，无法收到NPC回复：
- 浏览器报错：`net::ERR_INCOMPLETE_CHUNKED_ENCODING`
- 浏览器报错：`net::ERR_CONNECTION_CLOSED`
- 后端报错：`IndexError: list index out of range`
- SSE流没有正常结束，缺少 `[DONE]` 消息

---

## 根本原因

**LLM流式响应的最后几个chunk的`choices`数组为空**

### 代码错误位置

`hermes_backend/gateway/stream_consumer.py` 第143行：

```python
for chunk in response:
    delta = chunk.choices[0].delta  # ❌ 假设choices不为空
```

### LLM API行为

阿里云百炼API（glm-5模型）在流式响应结束时，会发送一个特殊的chunk：

```json
{
  "choices": [],  // 空数组！
  "finish_reason": null,
  ...
}
```

这个chunk用于标记流的结束，但代码直接访问`choices[0]`导致崩溃。

### 错误传播路径

```
LLM API返回空choices chunk
  → stream_consumer.py第143行 IndexError
  → FastAPI ASGI ExceptionGroup
  → SSE流异常终止
  → 浏览器收到 ERR_INCOMPLETE_CHUNKED_ENCODING
  → 前端显示 "network error"
```

---

## 修复方案

### 代码修复

在访问`choices[0]`之前检查数组是否为空：

```python
for chunk in response:
    # Skip chunks with empty choices (occurs at end of stream)
    if not chunk.choices or len(chunk.choices) == 0:
        continue
    delta = chunk.choices[0].delta
```

### 修复位置

**文件**: `hermes_backend/gateway/stream_consumer.py`
**行号**: 143

---

## 关键教训

### 1. 流式API响应必须有边界检查

**错误假设**: "LLM API返回的所有chunk都有相同的结构"

**正确做法**:
- 流式响应的结束chunk可能有特殊结构
- 必须检查数组长度、对象属性是否存在
- 参考：OpenAI官方SDK在处理流式响应时都有边界检查

### 2. 异常处理不应破坏流的完整性

**关键点**:
- 流式响应中途崩溃会导致连接异常关闭
- 前端收到不完整的响应（ERR_INCOMPLETE_CHUNKED_ENCODING）
- 必须确保即使出错，也要发送`[DONE]`消息

### 3. 调试流式问题的方法论

**诊断流程**:
```
1. 用curl --no-buffer测试API是否正常结束
2. 检查curl输出是否包含 [DONE] 消息
3. 查看后端日志是否有异常
4. 用浏览器fetch测试（模拟真实前端）
5. 检查浏览器network面板的详细错误
```

---

## 防止再犯的检查规则

### 流式响应处理清单

```markdown
添加/修改流式响应处理代码时，必须验证：

1. **chunk结构边界检查**:
   - [ ] 检查数组长度（choices, deltas等）
   - [ ] 检查属性是否存在（hasattr或getattr）
   - [ ] 处理空chunk/结束chunk

2. **异常不影响流完整性**:
   - [ ] 即使出错，流应该优雅结束
   - [ ] 必须发送完成消息（[DONE]）
   - [ ] 不留下悬空的连接

3. **测试必须验证流的完整结束**:
   - [ ] curl测试能看到 [DONE]
   - [ ] 浏览器测试无ERR_INCOMPLETE_CHUNKED_ENCODING
   - [ ] 后端日志无未捕获异常
```

---

## 相关文件

| 文件 | 职责 |
|------|------|
| `hermes_backend/gateway/stream_consumer.py` | LLM流式响应处理 |
| `hermes_backend/main.py` | SSE endpoint |
| `src/ui/html/DialogUI.tsx` | 前端对话UI、错误显示 |
| `src/utils/sseClient.ts` | SSE客户端 |

---

## 验证修复

**测试时间**: 2026-06-07 07:41

测试命令：
```bash
curl --no-buffer -X POST http://localhost:8642/v1/chat/stream \
  -H "Content-Type: application/json" \
  -d '{"npc_id":"qingmu","player_id":"test","user_message":"你好","context":{"recent_history":[]}}'
```

预期输出：
- 多个 `data: {"type": "thinking/text", ...}` 消息
- `data: {"type": "session_end", ...}` 消息
- `data: [DONE]` 最终消息

**结果**: ✅ 修复成功，流正确结束

---

## 后端错误日志（问题复现时）

```
ERROR:    Exception in ASGI application
  File "/hermes_backend/gateway/stream_consumer.py", line 143, in stream_chat
    delta = chunk.choices[0].delta
IndexError: list index out of range
```

---

## 状态

✅ 已修复并验证