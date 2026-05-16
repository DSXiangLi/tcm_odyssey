# Claude Hook 实用示例

**版本**: v1.0
**最后更新**: 2026-05-07

---

## 示例分类

| 分类 | 示例数量 | 适用场景 |
|------|----------|----------|
| **代码质量** | 5 | 自动格式化、lint检查 |
| **安全防护** | 4 | 命令验证、文件保护 |
| **任务验证** | 3 | 测试验证、完成检查 |
| **通知集成** | 3 | 桌面通知、Slack通知 |
| **审计日志** | 2 | 操作记录、会话报告 |

---

## 代码质量示例

### 1. 自动 Prettier 格式化

**事件**: `PostToolUse`

**目标**: 每次编辑文件后自动格式化

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "jq -r '.tool_input.file_path' | xargs npx prettier --write 2>/dev/null; exit 0"
          }
        ]
      }
    ]
  }
}
```

---

### 2. ESLint 自动修复

**事件**: `PostToolUse`

**目标**: JavaScript/TypeScript 文件自动 lint 修复

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "bash -c 'FILE=$(jq -r \".tool_input.file_path\"); if [[ \"$FILE\" == *.ts || \"$FILE\" == *.tsx || \"$FILE\" == *.js || \"$FILE\" == *.jsx ]]; then npx eslint --fix \"$FILE\" 2>/dev/null; fi; exit 0'"
          }
        ]
      }
    ]
  }
}
```

---

### 3. Python Black 格式化

**事件**: `PostToolUse`

**目标**: Python 文件自动格式化

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "bash -c 'FILE=$(jq -r \".tool_input.file_path\"); if [[ \"$FILE\" == *.py ]]; then black \"$FILE\" 2>/dev/null; fi; exit 0'"
          }
        ]
      }
    ]
  }
}
```

---

### 4. TypeScript 类型检查

**事件**: `Stop`

**目标**: 任务完成时运行类型检查

```json
{
  "hooks": {
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "cd \"$CLAUDE_PROJECT_DIR\" && npx tsc --noEmit 2>&1 | head -20; exit 0"
          }
        ]
      }
    ]
  }
}
```

---

### 5. 组合格式化 + Lint

**事件**: `PostToolUse`

**目标**: 顺序执行 Prettier 和 ESLint

```json
{
  "hooks": {
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
    ]
  }
}
```

---

## 安全防护示例

### 6. Bash 命令安全检查（Prompt）

**事件**: `PreToolUse`

**目标**: 使用 LLM 语义验证 Bash 命令安全性

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "prompt",
            "prompt": "Validate bash command safety. Check for: destructive operations (rm -rf, format, dd), privilege escalation (sudo, su, chmod 777), network access to unknown URLs, system modification (/etc, /usr, ~/.ssh). Return JSON: {decision: 'approve'} if safe, {decision: 'deny', reason: '...'} if dangerous."
          }
        ]
      }
    ]
  }
}
```

---

### 7. 文件写入安全检查（Prompt）

**事件**: `PreToolUse`

**目标**: 验证文件写入安全性

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "prompt",
            "prompt": "Validate file write safety. Check: system paths (/etc, /usr, ~/.ssh), credentials (.env, secrets, api_keys), path traversal (../ outside project), sensitive content (API keys, passwords in content). Return {decision: 'approve'} or {decision: 'deny', reason: '...'}"
          }
        ]
      }
    ]
  }
}
```

---

### 8. 保护敏感文件（Command）

**事件**: `PreToolUse`

**目标**: 禁止修改 .env 和 credentials 文件

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "bash -c 'FILE=$(jq -r \".tool_input.file_path\"); if [[ \"$FILE\" == *\".env\"* || \"$FILE\" == *\"credentials\"* ]]; then echo \"{\\\"hookSpecificOutput\\\":{\\\"decision\\\":{\\\"decision\\\":\\\"deny\\\",\\\"reason\\\":\\\"Protected file: $FILE\\\"}}}\" && exit 1; fi; exit 0'"
          }
        ]
      }
    ]
  }
}
```

---

### 9. 阻止危险 Bash 命令（Command）

**事件**: `PreToolUse`

**目标**: 禁止 rm -rf 和 sudo 命令

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "bash -c 'CMD=$(jq -r \".tool_input.command\"); if [[ \"$CMD\" == *\"rm -rf\"* || \"$CMD\" == *\"sudo\"* ]]; then echo \"{\\\"hookSpecificOutput\\\":{\\\"decision\\\":{\\\"decision\\\":\\\"deny\\\",\\\"reason\\\":\\\"Dangerous command: $CMD\\\"}}}\" && exit 1; fi; exit 0'"
          }
        ]
      }
    ]
  }
}
```

---

## 任务验证示例

### 10. 验证测试执行（Prompt）

**事件**: `Stop`

**目标**: 如果代码被修改，确保测试被执行

```json
{
  "hooks": {
    "Stop": [
      {
        "hooks": [
          {
            "type": "prompt",
            "prompt": "Check if all requested tasks are complete. If code was modified, verify tests were run or mentioned in the conversation. Return JSON: {ok: true} if complete, {ok: false, reason: 'Tests need to be run'} if incomplete."
          }
        ]
      }
    ]
  }
}
```

---

### 11. 运行测试验证（Command）

**事件**: `Stop`

**目标**: 任务完成时运行测试

```json
{
  "hooks": {
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/verify-tests.sh",
            "timeout": 60
          }
        ]
      }
    ]
  }
}
```

**脚本内容** `.claude/hooks/verify-tests.sh`:

```bash
#!/bin/bash
cd "$CLAUDE_PROJECT_DIR"

# 检查是否有测试文件修改
if git diff --name-only HEAD~1 | grep -q "test"; then
  npm test
  if [ $? -ne 0 ]; then
    echo '{"decision": "block", "reason": "Tests failed"}'
    exit 1
  fi
fi

exit 0
```

---

### 12. 任务完成验证（Agent）

**事件**: `Stop`

**目标**: 使用代码审查代理验证完成度

```json
{
  "hooks": {
    "Stop": [
      {
        "hooks": [
          {
            "type": "agent",
            "agentType": "code-reviewer",
            "prompt": "Review changes made in this session. Check: does implementation match user requirements? Are tests written? Is documentation updated? Return {ok: true} or {ok: false, reason: '...'}"
          }
        ]
      }
    ]
  }
}
```

---

## 通知集成示例

### 13. macOS 桌面通知

**事件**: `Notification`

**目标**: Claude 等待输入时发送桌面通知

```json
{
  "hooks": {
    "Notification": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "osascript -e 'display notification \"Claude Code needs your input\" with title \"Claude Code\"'"
          }
        ]
      }
    ]
  }
}
```

---

### 14. Linux 桌面通知

**事件**: `Notification`

**目标**: Linux 系统 desktop notification

```json
{
  "hooks": {
    "Notification": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "notify-send \"Claude Code\" \"Claude Code needs your input\""
          }
        ]
      }
    ]
  }
}
```

---

### 15. Slack 通知

**事件**: `PostToolUse`

**目标**: Git commit 后发送 Slack 通知

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "bash -c 'CMD=$(jq -r \".tool_input.command\"); if [[ \"$CMD\" == *\"git commit\"* ]]; then curl -X POST -H \"Content-Type: application/json\" -d \"{\\\"text\\\":\\\"New commit in $CLAUDE_PROJECT_DIR\\\"}\" \"$SLACK_WEBHOOK_URL\" 2>/dev/null; fi; exit 0'"
          }
        ]
      }
    ]
  }
}
```

---

## 审计日志示例

### 16. 操作记录

**事件**: `PostToolUse`

**目标**: 记录所有工具调用到日志

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "jq -c '{time: now | strftime(\"%Y-%m-%dT%H:%M:%S\"), tool: .tool_name, input: .tool_input}' >> \"$CLAUDE_PROJECT_DIR/.claude/activity.log\""
          }
        ]
      }
    ]
  }
}
```

---

### 17. 会话报告

**事件**: `Stop`

**目标**: 生成会话摘要报告

```json
{
  "hooks": {
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "bash ~/.claude/hooks/session-report.sh"
          }
        ]
      }
    ]
  }
}
```

**脚本内容** `~/.claude/hooks/session-report.sh`:

```bash
#!/bin/bash
REPORT_FILE="$CLAUDE_PROJECT_DIR/.claude/session-reports/$(date +%Y-%m-%d-%H%M%S).md"

mkdir -p "$CLAUDE_PROJECT_DIR/.claude/session-reports"

echo "# Session Report" > "$REPORT_FILE"
echo "**Session ID**: $CLAUDE_SESSION_ID" >> "$REPORT_FILE"
echo "**Time**: $(date)" >> "$REPORT_FILE"
echo "**Project**: $CLAUDE_PROJECT_DIR" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "## Git Status" >> "$REPORT_FILE"
git status --short >> "$REPORT_FILE"

exit 0
```

---

## 会话管理示例

### 18. SessionStart 加载状态

**事件**: `SessionStart`

**目标**: 显示 git 状态和 TODO

```json
{
  "hooks": {
    "SessionStart": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "echo '=== Session Started ===' && echo 'Project: $CLAUDE_PROJECT_DIR' && git status --short && echo '' && cat TODO.md 2>/dev/null || echo 'No TODO.md'"
          }
        ]
      }
    ]
  }
}
```

---

### 19. UserPromptSubmit 注入上下文

**事件**: `UserPromptSubmit`

**目标**: 自动注入 sprint 上下文

```json
{
  "hooks": {
    "UserPromptSubmit": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "command",
            "command": "bash -c 'SPRING_FILE=\"$CLAUDE_PROJECT_DIR/.claude/sprint-context.md\"; if [ -f \"$SPRING_FILE\" ]; then cat \"$SPRING_FILE\"; fi; exit 0'"
          }
        ]
      }
    ]
  }
}
```

---

### 20. PermissionRequest 自动批准测试

**事件**: `PermissionRequest`

**目标**: 自动批准测试相关命令

```json
{
  "hooks": {
    "PermissionRequest": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "bash -c 'CMD=$(jq -r \".tool_input.command\"); if [[ \"$CMD\" == *\"npm test\"* || \"$CMD\" == *\"pytest\"* ]]; then echo \"{\\\"hookSpecificOutput\\\":{\\\"decision\\\":{\\\"behavior\\\":\\\"allow\\\",\\\"reason\\\":\\\"Test command auto-approved\\\"}}}\" && exit 0; fi; exit 0'"
          }
        ]
      }
    ]
  }
}
```

---

## 完整配置模板

### 多功能组合配置

```json
{
  "hooks": {
    "SessionStart": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "git status --short && cat TODO.md 2>/dev/null || true"
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
            "prompt": "Validate bash command safety: destructive ops, privilege escalation, network access. Return {decision: 'approve'} or {decision: 'deny', reason: '...'}"
          }
        ]
      },
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "prompt",
            "prompt": "Validate file write safety: system paths, credentials, path traversal. Return {decision: 'approve'} or {decision: 'deny', reason: '...'}"
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
          }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          {
            "type": "prompt",
            "prompt": "Verify all tasks complete. If code modified, check tests mentioned. Return {ok: true} or {ok: false, reason: '...'}"
          }
        ]
      }
    ],
    "Notification": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "notify-send \"Claude Code\" \"Waiting for input\""
          }
        ]
      }
    ]
  }
}
```

---

## 下一步

- **最佳实践和调试** → [05-best-practices.md](./05-best-practices.md)