# Claude CLI 完整使用指南

**版本**: v1.0
**最后更新**: 2026-05-08
**来源**: Anthropic Claude Code Official Documentation

---

## 基本命令

| 命令 | 描述 | 示例 |
|------|------|------|
| `claude` | 启动交互式会话 | `claude` |
| `claude "query"` | 启动会话并发送初始提示 | `claude "explain this project"` |
| `claude -p "query"` | 非交互模式：执行后退出 | `claude -p "explain this function"` |
| `cat file | claude -p "query"` | 管道模式：处理输入内容 | `cat logs.txt | claude -p "analyze"` |

---

## 核心 Flag：`-p` / `--print`

**非交互模式的核心标志**，用于脚本和自动化。

```bash
# 基本用法
claude -p "Your prompt here"

# 管道输入
cat file.txt | claude -p "Summarize this"

# 保存输出到变量
RESULT=$(claude -p "Generate unit tests for utils.ts")
```

**关键特性**:
- 输出到 stdout 后立即退出
- 跳过工作区信任对话框
- 支持所有 CLI flags 组合
- 可在脚本、CI/CD 中使用

---

## 输出格式：`--output-format`

| 格式 | 描述 | 适用场景 |
|------|------|----------|
| `text` | 纯文本输出（默认） | 人类阅读 |
| `json` | 单一结构化 JSON 包 | 程序解析 |
| `stream-json` | 实时事件流 JSON | 实时处理 |

### text 格式（默认）

```bash
claude -p "List the functions in auth.ts"
# 输出：纯文本，适合人类阅读
```

### json 格式

```bash
claude -p "List functions" --output-format json
# 输出：
{
  "type": "message",
  "content": [{"type": "text", "text": "..."}],
  "session_id": "...",
  "cost_usd": 0.01
}
```

### stream-json 格式

```bash
claude -p "..." --output-format stream-json --verbose --include-partial-messages
# 输出：实时事件流，每行一个 JSON 事件
{"type": "message_start", ...}
{"type": "content_block_start", ...}
{"type": "content_block_delta", "delta": {"text": "Hello"}}
{"type": "message_stop", ...}
```

**适用场景**:
- 实时显示进度
- 解析部分结果
- 构建自定义 UI

---

## 最小模式：`--bare`

**推荐用于脚本和 CI**，跳过所有自动发现：

```bash
claude --bare -p "query"
```

**跳过的内容**:
- hooks（不会触发）
- skills
- plugins
- MCP servers
- auto memory
- CLAUDE.md

**仅保留**:
- Bash 工具
- 文件读取 (Read)
- 文件编辑 (Edit)

**优势**:
- **启动更快**：不加载项目配置
- **结果可复现**：不受团队成员 ~/.claude 影响
- **严格控制**：仅使用显式传入的 flags

**注意**:
- 需要 `ANTHROPIC_API_KEY` 环境变量（跳过 OAuth）
- 无法使用 MCP 工具
- 文档说未来会成为 `-p` 的默认模式

---

## 权限控制

### `--permission-mode`

| 模式 | 描述 | 适用场景 |
|------|------|----------|
| `default` | 默认：交互式询问 | 交互开发 |
| `acceptEdits` | 自动批准文件编辑 + 常见命令 | 信任的脚本 |
| `dontAsk` | 仅允许 `permissions.allow` 规则 | 锁定的 CI |
| `plan` | 计划模式：仅生成计划 | 安全审查 |
| `bypassPermissions` | 跳过所有权限检查 | **危险，仅沙盒** |

```bash
# 自动批准编辑
claude -p "Apply lint fixes" --permission-mode acceptEdits

# 严格模式：仅允许白名单
claude -p "Run tests" --permission-mode dontAsk \
  --settings '{"permissions":{"allow":["Bash(npm test)"]}}'
```

### `--allowedTools`

自动批准指定工具，无需交互确认：

```bash
# 允许特定工具
claude -p "Fix bugs and run tests" \
  --allowedTools "Bash,Edit,Write"

# 允许所有读取工具
claude -p "Analyze project" \
  --allowedTools "Read,Glob,Grep"
```

### `--disallowedTools`

明确禁止指定工具：

```bash
claude -p "Analyze only" \
  --disallowedTools "Write,Edit,Bash"
```

---

## 轮次限制：`--max-turns`

限制代理循环的轮次数量：

```bash
# 单轮执行
claude -p "Explain this file" --max-turns 1

# 多轮修复
claude -p "Fix all test failures" --max-turns 10
```

**行为**:
- 达到限制时退出并报错
- 默认无限制（可能无限循环）
- **推荐**: CI/脚本中始终设置上限

---

## 预算控制：`--max-budget-usd`

限制 API 调用花费：

```bash
claude -p "Large analysis task" --max-budget-usd 5.00
```

达到预算上限时停止执行。

---

## 模型选择：`--model`

| 模型 | 特点 | 适用场景 |
|------|------|----------|
| `claude-sonnet-4-6` | 默认，平衡性价比 | 日常开发 |
| `claude-opus-4-6` | 最强推理 | 复杂任务 |
| `claude-haiku-4-5` | 快速低成本 | 简单任务 |

```bash
claude -p "Complex refactoring" --model claude-opus-4-6
claude -p "Quick summary" --model claude-haiku-4-5
```

---

## 会话恢复

### `--continue`

恢复最近一次会话：

```bash
claude -p "Continue from where we left" --continue
```

### `--resume <session-id>`

恢复指定会话：

```bash
# 查看会话 ID
claude sessions list

# 恢复特定会话
claude -p "Follow up task" --resume abc123
```

---

## 输入格式：`--input-format`

配合 `--output-format stream-json` 使用：

```bash
# 流式输入（高级用法）
claude -p --input-format stream-json --output-format json
```

---

## 结构化输出：`--json-schema**

强制输出匹配 JSON Schema：

```bash
claude -p "Extract data" \
  --json-schema '{"type":"object","properties":{"name":{"type":"string"},"items":{"type":"array"}}}'
```

输出会验证是否符合 schema，否则报错。

---

## 子命令

### `claude auth login`

登录 Anthropic 账户：

```bash
# 标准 OAuth 登录
claude auth login

# Console API 登录（按 API 计费）
claude auth login --console

# SSO 登录
claude auth login --sso
```

### `claude doctor`

检查配置和健康状态：

```bash
claude doctor
# 输出：
# ✓ Claude Code v2.1.x (up to date)
# ✓ Anthropic API reachable
# ✓ ANTHROPIC_API_KEY valid
# ✓ MCP filesystem: connected
# ✗ MCP github: connection error
# ✓ permissions: OK
```

### `claude --version` / `claude -v`

显示版本：

```bash
claude --version
# 输出：Claude Code v2.1.x
```

---

## 环境变量

| 变量 | 描述 |
|------|------|
| `ANTHROPIC_API_KEY` | API 密钥（必须） |
| `CLAUDE_CODE_MODEL` | 默认模型 |
| `CLAUDE_CODE_SUBAGENT_MODEL` | 子代理模型 |
| `CLAUDE_CODE_MAX_OUTPUT_TOKENS` | 输出 token 上限 |
| `ANTHROPIC_BASE_URL` | 自定义 API 端点 |
| `NO_COLOR` | 禁用颜色输出 |
| `CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC` | 禁用遥测 |

---

## 交互式 Slash 命令

在交互会话中可用：

| 命令 | 描述 |
|------|------|
| `/help` | 显示可用命令 |
| `/compact` | 压缩对话释放上下文 |
| `/clear` | 清除对话历史 |
| `/doctor` | 检查配置健康 |
| `/model` | 切换模型 |
| `/cost` | 显示 token 使用和成本 |
| `/fast` | 快速输出模式 |

---

## 实用模式组合

### 1. 单轮分析（最常用）

```bash
claude --bare -p "Analyze this code" \
  --max-turns 1 \
  --output-format json \
  --allowedTools "Read,Glob,Grep"
```

### 2. 自动修复循环

```bash
claude -p "Fix all failing tests" \
  --max-turns 20 \
  --allowedTools "Bash,Edit,Read" \
  --permission-mode acceptEdits
```

### 3. 严格 CI 模式

```bash
ANTHROPIC_API_KEY="..." \
claude --bare -p "Run lint and fix" \
  --permission-mode dontAsk \
  --settings '{"permissions":{"allow":["Bash(npm run lint)","Edit"]}}' \
  --max-turns 5 \
  --max-budget-usd 2
```

### 4. 实时流式处理

```bash
claude -p "Large task" \
  --output-format stream-json \
  --verbose \
  --include-partial-messages | \
  jq -c 'select(.type == "content_block_delta") | .delta.text'
```

### 5. 管道处理文件

```bash
# 分析单个文件
cat auth.ts | claude -p "Find security issues"

# 处理 git diff
git diff HEAD~1 | claude -p "Review this diff for bugs"

# 多文件处理
cat src/*.ts | claude -p "Analyze architecture patterns"
```

---

## Hook 中使用 Claude CLI

在 Hook 脚本中调用 Claude 的推荐方式：

```python
import subprocess
import json

prompt = "分析对话并生成更新指令"

result = subprocess.run(
    [
        "claude",
        "--bare",               # 最小模式，快速启动
        "-p",
        prompt,
        "--max-turns", "1",     # 单轮执行
        "--output-format", "json",  # 结构化输出
        "--allowedTools", "Read",   # 仅允许读取
        "--model", "claude-haiku-4-5"  # 快速低成本模型
    ],
    capture_output=True,
    text=True,
    timeout=90
)

if result.returncode == 0:
    output = json.loads(result.stdout)
    edits = output.get("content", [])
```

**关键优化**:
1. `--bare` - 跳过配置加载，加快启动
2. `--max-turns 1` - 单轮执行，避免循环
3. `--output-format json` - 结构化输出便于解析
4. `--allowedTools "Read"` - 仅允许读取，Hook 不应修改文件
5. `--model haiku` - Hook 内部分析用低成本模型

---

## 常见问题

### Q: `-p` 和交互模式有什么区别？

**交互模式**:
- 启动 REPL 循环
- 支持多轮对话
- 显示工具执行过程
- 需要用户确认

**`-p` 模式**:
- 单次执行后退出
- 输出到 stdout
- 可设置自动批准
- 适合脚本/自动化

### Q: `--bare` 模式下如何加载 CLAUDE.md？

使用 `--append-system-prompt-file`:

```bash
claude --bare -p "query" \
  --append-system-prompt-file CLAUDE.md
```

### Q: 如何在 Hook 中使用自己？

Hook 内调用 `claude -p` 时，**不会触发同一 Hook**（避免递归）。

### Q: stream-json 和 json 格式的区别？

| 格式 | 输出时机 | 解析方式 |
|------|----------|----------|
| `json` | 完成后一次性输出 | `json.loads(stdout)` |
| `stream-json` | 实时流式输出 |逐行解析 JSON |

---

## 参考资源

- [官方 CLI Reference](https://docs.anthropic.com/en/docs/claude-code/cli-usage)
- [Agent SDK Overview](https://docs.anthropic.com/en/api/agent-sdk)
- [Headless Mode Guide](https://code.claude.com/docs/en/headless)