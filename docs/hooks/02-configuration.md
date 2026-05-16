# Claude Hook 配置规范

**版本**: v1.0
**最后更新**: 2026-05-07

---

## 配置文件位置

### 三层配置体系

| 层级 | 文件路径 | 作用范围 | Git 状态 |
|------|----------|----------|----------|
| **全局用户** | `~/.claude/settings.json` | 所有项目 | 本地私有 |
| **项目共享** | `.claude/settings.json` | 单个项目 | 可提交到 Git |
| **项目本地** | `.claude/settings.local.json` | 单个项目 | 应 gitignore |

**优先级**: 本地 > 项目 > 全局

**合并规则**: 同一事件的不同层级配置会合并执行（按优先级顺序）

---

## JSON 配置结构

### 三层嵌套结构

```json
{
  "hooks": {
    "<EventName>": [               // 第1层：事件名称
      {
        "matcher": "<pattern>",    // 第2层：匹配器组
        "hooks": [                 // 第3层：Hook处理器数组
          {
            "type": "<handlerType>",
            "<typeSpecificField>": "...",
            "timeout": 30,
            "if": "<condition>"
          }
        ]
      }
    ]
  }
}
```

### 各层说明

**第1层 - 事件名称**:
- 必须是有效事件类型（如 `PreToolUse`, `PostToolUse`, `Stop`）
- 每个事件可以配置多个匹配器组

**第2层 - 匹配器组**:
- `matcher`: 正则表达式匹配工具名称（仅工具级事件可用）
- 未配置 `matcher` 或空字符串 `""` 匹配所有触发
- Stop、SessionStart、Notification 等事件不需要 matcher

**第3层 - Hook处理器**:
- `type`: 处理器类型（command/http/mcp_tool/prompt/agent）
- 其他字段根据 type 不同
- 可以配置多个处理器（按顺序执行）

---

## 处理器类型字段

### command 类型

```json
{
  "type": "command",
  "command": "<shell命令>",
  "timeout": 30  // 可选，超时秒数
}
```

**特点**:
- 执行 Shell 命令
- 输入通过 stdin 传递 JSON
- 输出通过 stdout 返回 JSON
- 退出码决定决策（0=approve，非0=deny）

### http 类型

```json
{
  "type": "http",
  "url": "<HTTP端点>",
  "method": "POST",  // 默认 POST
  "timeout": 30,
  "headers": { ... }  // 可选
}
```

**特点**:
- 发送 HTTP POST 请求
- 请求体包含事件 JSON 数据
- 响应体作为决策输出

### mcp_tool 类型

```json
{
  "type": "mcp_tool",
  "server": "<MCP服务器名称>",
  "tool": "<工具名称>",
  "arguments": { ... }  // 可选
}
```

**特点**:
- 调用 MCP 服务器提供的工具
- 事件数据作为参数传递

### prompt 类型

```json
{
  "type": "prompt",
  "prompt": "<LLM提示文本>",
  "timeout": 30
}
```

**特点**:
- 使用 LLM 评估事件
- 自然语言描述验证规则
- LLM 返回结构化决策

**示例**:

```json
{
  "PreToolUse": [
    {
      "matcher": "Bash",
      "hooks": [
        {
          "type": "prompt",
          "prompt": "Validate bash command safety. Check: destructive ops (rm -rf, format), privilege escalation (sudo, su), network access (curl, wget). Return {decision: 'approve'} or {decision: 'deny', reason: '...'}"
        }
      ]
    }
  ]
}
```

### agent 类型

```json
{
  "type": "agent",
  "agentType": "<代理类型>",
  "prompt": "<代理任务描述>"
}
```

**特点**:
- 启动子代理处理事件
- 复杂分析或验证任务

---

## if 条件字段

`if` 字段使用权限规则语法，进一步过滤触发条件：

```json
{
  "if": "Bash(git *)",  // 仅匹配 git 相关命令
  "hooks": [...]
}
```

```json
{
  "if": "Edit(*.ts)",  // 仅匹配 .ts 文件编辑
  "hooks": [...]
}
```

**语法规则**:
- `ToolName(pattern)` - 工具名称 + 参数匹配
- `*` - 通配符
- 仅用于工具级事件：PreToolUse, PostToolUse, PermissionRequest

---

## 环境变量

Hook 执行时可用的环境变量：

| 变量名 | 说明 | 可用事件 |
|--------|------|----------|
| `CLAUDE_TOOL_NAME` | 工具名称 | PreToolUse, PostToolUse |
| `CLAUDE_TOOL_INPUT` | 工具输入参数（JSON） | PreToolUse |
| `CLAUDE_TOOL_INPUT_FILE_PATH` | 文件路径（Edit/Write） | PreToolUse, PostToolUse |
| `CLAUDE_TOOL_OUTPUT` | 工具输出结果 | PostToolUse |
| `CLAUDE_PROJECT_DIR` | 项目根目录 | 所有事件 |
| `CLAUDE_SESSION_ID` | 会话唯一标识 | 所有事件 |
| `CLAUDE_HOOK_EVENT_NAME` | 触发的事件名称 | 所有事件 |
| `CLAUDE_PLUGIN_ROOT` | 插件根目录 | 插件 Hook |

**在命令中使用**:

```bash
npx prettier --write "$CLAUDE_TOOL_INPUT_FILE_PATH"
```

```bash
echo "Tool: $CLAUDE_TOOL_NAME" >> "$CLAUDE_PROJECT_DIR/.claude/activity.log"
```

---

## matcher 语法详解

### 工具名称匹配

```json
"matcher": "Bash"           // 仅匹配 Bash 工具
"matcher": "Edit|Write"     // 匹配 Edit 或 Write（正则或语法）
"matcher": "mcp__.*"        // 匹配所有 MCP 工具
"matcher": ""               // 匹配所有工具
```

### 正则表达式支持

matcher 支持 JavaScript 正则表达式语法：

```json
"matcher": "Edit|Write|Glob"           // 多个工具
"matcher": "mcp__[a-z]+__[a-z]+"       // MCP 工具格式
"matcher": "^Bash$"                    // 精确匹配
```

### 无 matcher 事件

以下事件不需要 matcher（全局触发）：
- `SessionStart`
- `SessionEnd`
- `Stop`
- `StopFailure`
- `Notification`
- `PreCompact`
- `UserPromptSubmit`
- `UserPromptExpansion`
- `Setup`

---

## timeout 超时设置

```json
{
  "type": "command",
  "command": "...",
  "timeout": 60  // 超时秒数
}
```

**默认值**: 30 秒

**超时行为**:
- Hook 执行超过 timeout 秒数后终止
- 超时视为 approve（批准）

---

## 完整配置示例

### 项目级配置

`.claude/settings.json`:

```json
{
  "hooks": {
    "SessionStart": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "git status --short && echo 'Session started'"
          }
        ]
      }
    ],
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "prompt",
            "prompt": "Check if command is safe: no rm -rf, no sudo, no curl/wget to unknown URLs. Return {decision: 'approve'} or {decision: 'deny', reason: '...'}"
          }
        ]
      },
      {
        "matcher": "Write|Edit",
        "if": "Edit(*.env) | Write(*.env)",
        "hooks": [
          {
            "type": "command",
            "command": "echo 'Blocked: .env file modification' && exit 1"
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "jq -r '.tool_input.file_path' | xargs npx prettier --write 2>/dev/null || true"
          },
          {
            "type": "command",
            "command": "jq -r '.tool_input.file_path' | xargs npx eslint --fix 2>/dev/null || true"
          }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          {
            "type": "prompt",
            "prompt": "Check if all requested tasks are complete. If code was modified, verify tests were mentioned or run. Return {ok: true} or {ok: false, reason: '...'}",
            "timeout": 30
          }
        ]
      }
    ],
    "Notification": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "osascript -e 'display notification \"Claude Code needs input\" with title \"Claude Code\"'"
          }
        ]
      }
    ]
  }
}
```

### 插件级配置

插件目录 `hooks/hooks.json`:

```json
{
  "hooks": {
    "SessionStart": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "${CLAUDE_PLUGIN_ROOT}/hooks/session-start.sh"
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "${CLAUDE_PLUGIN_ROOT}/hooks/post-write.sh"
          }
        ]
      }
    ]
  }
}
```

**注意**: 插件配置使用 `${CLAUDE_PLUGIN_ROOT}` 确保路径可移植性。

---

## 下一步

- **处理器类型详解** → [03-handler-types.md](./03-handler-types.md)
- **实用示例集合** → [04-examples.md](./04-examples.md)