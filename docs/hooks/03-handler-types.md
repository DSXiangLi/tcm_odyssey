# Claude Hook 处理器类型

**版本**: v1.0
**最后更新**: 2026-05-07

---

## 处理器类型概述

Claude Hook 支持五种处理器类型：

| 类型 | 执行方式 | 适用场景 | 复杂度 |
|------|----------|----------|--------|
| `command` | Shell 命令 | 简单自动化、格式化 | 低 |
| `prompt` | LLM 评估 | 语义验证、安全检查 | 中 |
| `http` | HTTP 请求 | 外部系统集成 | 中 |
| `mcp_tool` | MCP 工具 | MCP 服务器集成 | 中 |
| `agent` | 子代理 | 复杂分析、多步骤验证 | 高 |

---

## 1. command 类型

### 基本结构

```json
{
  "type": "command",
  "command": "<shell命令>",
  "timeout": 30
}
```

### 执行流程

```
Hook触发 → stdin传递JSON → Shell执行 → stdout读取JSON → 决策解析
```

### 输入格式

事件数据通过 stdin 传递，JSON 格式：

```json
{
  "tool_name": "Edit",
  "tool_input": {
    "file_path": "/path/to/file.ts",
    "old_string": "...",
    "new_string": "..."
  },
  "session_id": "...",
  "project_dir": "...",
  "event_name": "PreToolUse"
}
```

**读取方式**:

```bash
# 使用 jq 解析
FILE_PATH=$(jq -r '.tool_input.file_path')

# 或直接读取全部
INPUT=$(cat)
```

### 输出格式

通过 stdout 返回决策 JSON：

**PreToolUse 输出**:

```json
{
  "hookSpecificOutput": {
    "decision": {
      "decision": "approve",  // 或 deny/ask/defer
      "reason": "验证通过",
      "modifiedToolInput": { ... }  // 仅 approve 时
    }
  }
}
```

**PostToolUse / Stop 输出**:

```json
{
  "decision": "approve",  // 或 block
  "reason": "验证通过"
}
```

### 退出码规则

| 退出码 | 决策 |
|--------|------|
| `0` | approve（批准） |
| 非 `0` | deny/block（拒绝） |

**注意**: 未输出 JSON 时，退出码决定决策。

### 实用脚本示例

#### 自动格式化

```bash
#!/bin/bash
FILE=$(jq -r '.tool_input.file_path')
npx prettier --write "$FILE" 2>/dev/null
exit 0  # 始终批准
```

#### 文件保护

```bash
#!/bin/bash
FILE=$(jq -r '.tool_input.file_path')

# 阻止修改敏感文件
if [[ "$FILE" == *".env"* || "$FILE" == *"credentials"* ]]; then
  echo '{"hookSpecificOutput":{"decision":{"decision":"deny","reason":"Protected file: .env or credentials"}}}'
  exit 1
fi

exit 0  # 批准其他文件
```

#### 命令安全检查

```bash
#!/bin/bash
CMD=$(jq -r '.tool_input.command')

# 检查危险命令
if [[ "$CMD" == *"rm -rf"* || "$CMD" == *"sudo"* ]]; then
  echo '{"hookSpecificOutput":{"decision":{"decision":"deny","reason":"Dangerous command detected"}}}'
  exit 1
fi

exit 0
```

### 环境变量使用

```bash
# 直接使用环境变量
echo "Session: $CLAUDE_SESSION_ID"
echo "Project: $CLAUDE_PROJECT_DIR"
echo "Tool: $CLAUDE_TOOL_NAME"

# 文件路径
npx prettier --write "$CLAUDE_TOOL_INPUT_FILE_PATH"
```

---

## 2. prompt 类型

### 基本结构

```json
{
  "type": "prompt",
  "prompt": "<自然语言提示>",
  "timeout": 30
}
```

### 执行流程

```
Hook触发 → 构造LLM提示 → 模型推理 → 解析JSON响应 → 决策应用
```

### 优势

- **语义理解**: LLM 理解上下文，而非硬编码规则
- **灵活验证**: 自然语言描述，无需编写脚本
- **自适应**: 模型能力提升时验证更智能

### 提示编写指南

#### 包含关键要素

1. **验证目标** - 要检查什么
2. **决策格式** - 返回什么 JSON 结构
3. **拒绝原因** - deny 时需提供原因

#### 示例提示

**Bash 命令安全检查**:

```
Validate bash command safety. Check for:
- Destructive operations: rm -rf, format, dd
- Privilege escalation: sudo, su, chmod 777
- Network access: curl, wget to unknown URLs
- System modification: /etc, /usr, ~/.ssh

Return JSON:
{decision: 'approve'} if safe
{decision: 'deny', reason: '...'} if dangerous
```

**文件写入安全检查**:

```
Validate file write safety. Check:
- System paths: /etc, /usr, ~/.ssh, ~/.gnupg
- Credentials: .env, credentials, secrets, api_keys
- Path traversal: ../ outside project
- Sensitive content: API keys, passwords, tokens in content

Return JSON:
{decision: 'approve'} if safe
{decision: 'deny', reason: '...'} if dangerous
```

**任务完成验证**:

```
Check if all requested tasks are complete.
- If code was modified, verify tests were run or mentioned
- If documentation requested, verify files were updated
- If functionality added, verify implementation complete

Return JSON:
{ok: true} if complete
{ok: false, reason: '...'} if incomplete (will continue)
```

### 配置示例

```json
{
  "PreToolUse": [
    {
      "matcher": "Bash",
      "hooks": [
        {
          "type": "prompt",
          "prompt": "Validate bash command safety: destructive ops, privilege escalation, network access. Return {decision: 'approve'} or {decision: 'deny', reason: '...'}"
        }
      ]
    },
    {
      "matcher": "Write|Edit",
      "hooks": [
        {
          "type": "prompt",
          "prompt": "Validate file write safety: system paths, credentials, path traversal, content secrets. Return {decision: 'approve'} or {decision: 'deny', reason: '...'}"
        }
      ]
    }
  ],
  "Stop": [
    {
      "hooks": [
        {
          "type": "prompt",
          "prompt": "Verify tests were run if code was modified. Return {ok: true} or {ok: false, reason: '...'}"
        }
      ]
    }
  ]
}
```

---

## 3. http 类型

### 基本结构

```json
{
  "type": "http",
  "url": "<HTTP端点>",
  "method": "POST",
  "timeout": 30,
  "headers": {
    "Authorization": "Bearer <token>",
    "Content-Type": "application/json"
  }
}
```

### 执行流程

```
Hook触发 → POST请求 → 等待响应 → 解析JSON → 决策应用
```

### 请求格式

请求体包含完整事件数据：

```json
{
  "tool_name": "Edit",
  "tool_input": { ... },
  "session_id": "...",
  "event_name": "PreToolUse"
}
```

### 响应格式

响应体应返回决策 JSON：

```json
{
  "decision": "approve",
  "reason": "验证通过"
}
```

### 使用场景

- **远程审批服务**: 企业审批系统
- **外部验证**: CI/CD 状态检查
- **日志收集**: 审计日志服务器

### 示例配置

```json
{
  "PreToolUse": [
    {
      "matcher": "Bash",
      "hooks": [
        {
          "type": "http",
          "url": "https://api.company.com/claude/validate",
          "headers": {
            "Authorization": "Bearer ${COMPANY_API_KEY}"
          },
          "timeout": 10
        }
      ]
    }
  ]
}
```

---

## 4. mcp_tool 类型

### 冺本结构

```json
{
  "type": "mcp_tool",
  "server": "<MCP服务器名称>",
  "tool": "<工具名称>",
  "arguments": { ... }
}
```

### 执行流程

```
Hook触发 → 调用MCP工具 → 获取结果 → 解析决策 → 应用
```

### 使用场景

- **使用 MCP 服务器提供的验证工具**
- **集成 MCP 提供的日志/通知服务**

### 示例配置

```json
{
  "PostToolUse": [
    {
      "matcher": "Write|Edit",
      "hooks": [
        {
          "type": "mcp_tool",
          "server": "my-mcp-server",
          "tool": "lint_check",
          "arguments": {
            "file_path": "${CLAUDE_TOOL_INPUT_FILE_PATH}"
          }
        }
      ]
    }
  ]
}
```

---

## 5. agent 类型

### 基本结构

```json
{
  "type": "agent",
  "agentType": "<代理类型>",
  "prompt": "<代理任务>"
}
```

### 执行流程

```
Hook触发 → 启动子代理 → 代理执行 → 返回结果 → 解析决策
```

### 使用场景

- **复杂分析**: 多步骤验证
- **深度检查**: 需要读取多个文件
- **代码审查**: 需要理解上下文

### 示例配置

```json
{
  "Stop": [
    {
      "hooks": [
        {
          "type": "agent",
          "agentType": "code-reviewer",
          "prompt": "Review all code changes made in this session. Check for: security issues, code quality, test coverage. Return {ok: true} or {ok: false, reason: '...'}"
        }
      ]
    }
  ]
}
```

---

## 处理器组合使用

同一匹配器组可配置多个处理器，按顺序执行：

```json
{
  "PostToolUse": [
    {
      "matcher": "Edit|Write",
      "hooks": [
        {
          "type": "command",
          "command": "npx prettier --write \"$CLAUDE_TOOL_INPUT_FILE_PATH\""
        },
        {
          "type": "command",
          "command": "npx eslint --fix \"$CLAUDE_TOOL_INPUT_FILE_PATH\""
        },
        {
          "type": "prompt",
          "prompt": "Check if the edit introduced any security vulnerabilities. Return {decision: 'approve'} or {decision: 'block', reason: '...'}"
        }
      ]
    }
  ]
}
```

---

## 类型选择指南

| 场景 | 推荐类型 | 原因 |
|------|----------|------|
| 自动格式化 | `command` | 简单、快速、无需判断 |
| 语义安全检查 | `prompt` | 需理解上下文和意图 |
| 固定规则验证 | `command` | Shell 脚本高效 |
| 外部系统集成 | `http` | 需调用远程服务 |
| MCP 工具集成 | `mcp_tool` | 已有 MCP 工具可用 |
| 复杂分析 | `agent` | 需多步骤分析 |

---

## 下一步

- **实用示例集合** → [04-examples.md](./04-examples.md)
- **最佳实践和调试** → [05-best-practices.md](./05-best-practices.md)