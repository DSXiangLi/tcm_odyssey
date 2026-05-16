# Claude Hook 事件类型

**版本**: v1.0
**最后更新**: 2026-05-07

---

## 事件分类概览

Hook 事件按触发频率分为三类：

| 分类 | 事件 | 触发频率 |
|------|------|----------|
| **会话级** | SessionStart, SessionEnd, Setup | 每个会话 1 次 |
| **响应级** | UserPromptSubmit, Stop, StopFailure, Notification, PreCompact | 每轮响应 1 次 |
| **工具级** | PreToolUse, PostToolUse, PostToolUseFailure, PostToolBatch, PermissionRequest, PermissionDenied | 每个工具调用 |

---

## 完整事件列表

### 1. PreToolUse

**触发时机**: Claude 创建工具参数后，执行工具调用前

**可否阻塞**: ✅ 可以阻塞、批准、修改或询问用户

**匹配器可用**: ✅ 工具名称匹配

**常见用途**:
- 验证 Bash 命令安全性
- 阻止危险文件操作
- 自动批准安全操作
- 修改工具参数

**决策输出格式**:

```json
{
  "hookSpecificOutput": {
    "decision": {
      "decision": "approve" | "deny" | "ask" | "defer",
      "reason": "解释原因（显示给用户）",
      "modifiedToolInput": { ... }  // 仅 approve 时可用
    }
  }
}
```

| 决策值 | 行为 |
|--------|------|
| `approve` | 允许工具执行，可修改参数 |
| `deny` | 阻止工具执行，显示原因 |
| `ask` | 请求用户确认 |
| `defer` | 延迟决策，等待其他 Hook |

**示例配置**:

```json
{
  "PreToolUse": [
    {
      "matcher": "Bash",
      "hooks": [
        {
          "type": "prompt",
          "prompt": "Validate bash command safety: destructive ops, privilege escalation, network access"
        }
      ]
    }
  ]
}
```

---

### 2. PostToolUse

**触发时机**: 工具调用成功完成后

**可否阻塞**: ❌ 不能阻塞（工具已执行）

**匹配器可用**: ✅ 工具名称匹配

**常见用途**:
- 自动格式化代码
- 运行 linter
- 发送通知
- 记录审计日志

**输入数据** (stdin):

```json
{
  "tool_name": "Edit",
  "tool_input": { ... },
  "tool_output": "工具输出结果",
  "tool_result": { ... }
}
```

**决策输出格式**:

```json
{
  "decision": "block" | "approve",
  "reason": "原因（可选）"
}
```

**示例配置**:

```json
{
  "PostToolUse": [
    {
      "matcher": "Edit|Write",
      "hooks": [
        {
          "type": "command",
          "command": "jq -r '.tool_input.file_path' | xargs npx prettier --write"
        }
      ]
    }
  ]
}
```

---

### 3. PostToolUseFailure

**触发时机**: 工具调用失败后

**可否阻塞**: ❌ 不能阻塞

**匹配器可用**: ✅ 工具名称匹配

**常见用途**:
- 错误恢复处理
- 发送失败通知
- 记录错误日志

---

### 4. PostToolBatch

**触发时机**: 批量并行工具调用全部完成后，进入下一轮模型调用前

**可否阻塞**: ❌ 不能阻塞

**匹配器可用**: ❌ 无匹配器

**常见用途**:
- 批量处理后的汇总验证
- 跨工具依赖检查

---

### 5. PermissionRequest

**触发时机**: 权限确认对话框出现时

**可否阻塞**: ✅ 可以自动批准或拒绝

**匹配器可用**: ✅ 工具名称匹配

**常见用途**:
- 自动批准测试命令
- 阻止访问敏感文件
- 路由到特定审批流程

**决策输出格式**:

```json
{
  "hookSpecificOutput": {
    "decision": {
      "behavior": "allow" | "deny",
      "reason": "原因（可选）",
      "updatedPermissionResult": { ... }
    }
  }
}
```

---

### 6. PermissionDenied

**触发时机**: 工具调用被自动模式分类器拒绝时

**可否阻塞**: ❌ 不能阻塞（已拒绝）

**匹配器可用**: ✅ 工具名称匹配

**常见用途**:
- 记录拒绝原因
- 提示用户手动批准

**决策输出格式**:

```json
{
  "hookSpecificOutput": {
    "retry": true | false
  }
}
```

返回 `{retry: true}` 时，模型可以尝试重试被拒绝的工具调用。

---

### 7. Stop

**触发时机**: Claude 完成响应，等待用户输入时

**可否阻塞**: ✅ 可以强制继续工作

**匹配器可用**: ❌ 无匹配器

**常见用途**:
- 验证测试通过
- 验证任务完成
- 生成会话报告
- 强制继续未完成工作

**决策输出格式**:

```json
{
  "decision": "approve" | "block",
  "reason": "原因"
}
```

当返回 `{decision: "block"}` 时，Claude 会使用 `reason` 作为下一步指令继续工作。

**示例配置**:

```json
{
  "Stop": [
    {
      "hooks": [
        {
          "type": "prompt",
          "prompt": "Check if all requested tasks are complete. If tests were modified, verify tests pass. Return {ok: true} or {ok: false, reason: '...'}"
        }
      ]
    }
  ]
}
```

---

### 8. StopFailure

**触发时机**: API 错误导致响应结束时

**可否阻塞**: ❌ 不能阻塞，输出和退出码被忽略

**匹配器可用**: ❌ 无匹配器

**常见用途**:
- 记录 API 错误日志

---

### 9. SessionStart

**触发时机**: 会话开始或恢复时

**可否阻塞**: ❌ 不能阻塞

**匹配器可用**: ❌ 无匹配器

**常见用途**:
- 加载项目 git 状态
- 注入 TODO 列表
- 设置环境上下文
- 显示欢迎信息

**环境变量**:
- `CLAUDE_SESSION_ID` - 会话唯一标识
- `CLAUDE_PROJECT_DIR` - 项目根目录

**示例配置**:

```json
{
  "SessionStart": [
    {
      "hooks": [
        {
          "type": "command",
          "command": "echo 'Session started' && git status --short"
        }
      ]
    }
  ]
}
```

---

### 10. SessionEnd

**触发时机**: 会话结束时

**可否阻塞**: ❌ 不能阻塞

**匹配器可用**: ❌ 无匹配器

**常见用途**:
- 清理临时资源
- 生成会话报告
- 发送完成通知

---

### 11. UserPromptSubmit

**触发时机**: 用户提交提示后，Claude 处理前

**可否阻塞**: ✅ 可以阻塞或修改

**匹配器可用**: ❌ 无匹配器（使用 `matcher: "*"`

**常见用途**:
- 注入 sprint 上下文
- 验证请求格式
- 添加动态上下文
- 安全主题提醒

**输入数据** (stdin):

```json
{
  "prompt": "用户输入的提示",
  "session_id": "...",
  "project_dir": "..."
}
```

**决策输出格式**:

```json
{
  "decision": "approve" | "block" | "modify",
  "reason": "原因（可选）",
  "modifiedPrompt": "修改后的提示"  // 仅 modify 时可用
}
```

---

### 12. UserPromptExpansion

**触发时机**: 用户输入的命令（如 `/commit`）扩展为完整提示前

**可否阻塞**: ✅ 可以阻塞扩展

**匹配器可用**: ❌ 无匹配器

**常见用途**:
- 阻止特定斜杠命令
- 修改命令参数

---

### 13. Setup

**触发时机**: 使用 `--init-only`、`--init` 或 `--maintenance` 模式启动时

**可否阻塞**: ❌ 不能阻塞

**匹配器可用**: ❌ 无匹配器

**常见用途**:
- CI/CD 一次性准备
- 项目初始化脚本

---

### 14. Notification

**触发时机**: Claude 发送通知时（等待用户输入）

**可否阻塞**: ❌ 不能阻塞

**匹配器可用**: ❌ 无匹配器

**常见用途**:
- 桌面通知
- Slack/邮件通知
- 外部系统集成

**示例配置** (macOS):

```json
{
  "Notification": [
    {
      "hooks": [
        {
          "type": "command",
          "command": "osascript -e 'display notification \"Claude Code needs attention\" with title \"Claude Code\"'"
        }
      ]
    }
  ]
}
```

---

### 15. PreCompact

**触发时机**: 上下文即将压缩前

**可否阻塞**: ✅ 可以推迟压缩

**匹配器可用**: ❌ 无匹配器

**常见用途**:
- 备份对话记录
- 保留重要决策
- 推迟压缩以保留上下文

---

## 工具名称匹配器可用值

PreToolUse、PostToolUse、PermissionRequest 等事件的 matcher 支持以下工具名称：

| 工具名称 | 说明 |
|----------|------|
| `Bash` | Shell 命令执行 |
| `Edit` | 文件编辑 |
| `Write` | 文件写入 |
| `Read` | 文件读取 |
| `Glob` | 文件模式匹配 |
| `Grep` | 内容搜索 |
| `Agent` | 子代理调用 |
| `WebFetch` | 网页获取 |
| `WebSearch` | 网络搜索 |
| `AskUserQuestion` | 用户提问 |
| `ExitPlanMode` | 退出计划模式 |
| `mcp__*` | MCP 工具名称 |

**正则表达式匹配**:

```json
{
  "matcher": "Edit|Write"  // 匹配 Edit 或 Write
}
```

```json
{
  "matcher": "mcp__.*"  // 匹配所有 MCP 工具
}
```

```json
{
  "matcher": ""  // 空字符串匹配所有工具
}
```

---

## 下一步

- **配置语法详解** → [02-configuration.md](./02-configuration.md)
- **处理器类型选择** → [03-handler-types.md](./03-handler-types.md)