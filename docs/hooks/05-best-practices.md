# Claude Hook 最佳实践和调试

**版本**: v1.0
**最后更新**: 2026-05-07

---

## 最佳实践

### 1. 保持 Hook 快速

Hook 会在每次触发事件时执行，慢速 Hook 会严重影响工作流。

**原则**:
- 超时设置合理（默认 30 秒）
- 格式化 Hook 应在 5 秒内完成
- 验证 Hook 应在 10 秒内完成

**优化技巧**:

```bash
# ✅ 快速：仅格式化修改的文件
npx prettier --write "$FILE"

# ❌ 慢速：格式化整个项目
npx prettier --write .
```

---

### 2. 错误处理优雅

Hook 失败不应阻塞正常工作流（除非是安全验证）。

**原则**:
- 使用 `|| true` 或 `exit 0` 处理非关键失败
- 安全验证 Hook 必须严格返回正确退出码

**示例**:

```bash
# ✅ 优雅处理：格式化失败不阻塞
npx prettier --write "$FILE" 2>/dev/null || true
exit 0

# ❌ 严格处理：安全验证必须明确
if [[ "$CMD" == *"rm -rf"* ]]; then
  echo '{"hookSpecificOutput":{"decision":{"decision":"deny"}}}'
  exit 1
fi
exit 0
```

---

### 3. 设计幂等性

Hook 可能多次执行，确保不会产生副作用。

**原则**:
- 格式化命令可重复执行
- 日志追加而非覆盖
- 通知不重复发送（检查条件）

**示例**:

```bash
# ✅ 幂等：格式化可重复
npx prettier --write "$FILE"

# ✅ 幂等：日志追加
jq -c '{...}' >> "$LOG_FILE"

# ❌ 非幂等：覆盖文件
jq -c '{...}' > "$LOG_FILE"
```

---

### 4. 设置执行权限

Shell 脚本必须设置可执行权限。

```bash
chmod +x .claude/hooks/verify-tests.sh
```

**常见问题**: Hook 无响应，往往是权限缺失。

---

### 5. 使用环境变量

环境变量比解析 stdin 更快更可靠。

**对比**:

```bash
# ✅ 推荐：直接使用环境变量
npx prettier --write "$CLAUDE_TOOL_INPUT_FILE_PATH"

# ⚠️ 可用：解析 stdin（较慢）
FILE=$(jq -r '.tool_input.file_path')
npx prettier --write "$FILE"
```

---

### 6. 选择合适的处理器类型

| 场景 | 推荐 | 原因 |
|------|------|------|
| 自动格式化 | `command` | 简单、快速 |
| 语义验证 | `prompt` | 灵活、智能 |
| 固定规则 | `command` | Shell 脚本高效 |
| 外部服务 | `http` | 集成外部系统 |

---

### 7. 合理使用 matcher

避免过度过滤或过度触发。

**原则**:
- 针对特定工具使用精确 matcher
- 全局操作使用空 matcher
- 条件过滤使用 `if` 字段

**示例**:

```json
// ✅ 精确：仅匹配文件编辑
"matcher": "Edit|Write"

// ✅ 全局：所有 PostToolUse
"matcher": ""

// ✅ 条件：仅 .ts 文件
"if": "Edit(*.ts)"
```

---

### 8. 配置层级管理

合理分配全局、项目、本地配置。

| 配置类型 | 推荐位置 | 示例 |
|----------|----------|------|
| 个人偏好 | `~/.claude/settings.json` | 桌面通知 |
| 团队共享 | `.claude/settings.json` | 格式化规则、安全验证 |
| 本地调试 | `.claude/settings.local.json` | 临时调试 Hook |

---

### 9. timeout 设置

| Hook 类型 | 推荐 timeout | 原因 |
|-----------|--------------|------|
| 格式化 | 10-30 秒 | 通常快速完成 |
| 测试验证 | 60-120 秒 | 测试可能较慢 |
| prompt 评估 | 30-60 秒 | LLM 响应时间 |
| http 请求 | 10-30 秒 | 网络延迟 |

---

### 10. 测试 Hook 配置

新 Hook 应先测试验证。

**测试步骤**:
1. 添加 Hook 配置
2. 触发相关事件
3. 检查执行日志
4. 验证预期行为

---

## 调试技巧

### 1. 查看 Hook 执行日志

Claude Code 会记录 Hook 执行信息：

```bash
# 检查 Claude Code 日志
tail -f ~/.claude/logs/hooks.log
```

---

### 2. 手动测试脚本

独立测试脚本逻辑：

```bash
# 模拟 stdin 输入
echo '{"tool_name":"Edit","tool_input":{"file_path":"test.ts"}}' | \
  bash .claude/hooks/my-hook.sh
```

---

### 3. 添加调试输出

脚本中添加日志输出：

```bash
#!/bin/bash
DEBUG_LOG="$CLAUDE_PROJECT_DIR/.claude/hooks-debug.log"

echo "[$(date)] Hook executed: $CLAUDE_HOOK_EVENT_NAME" >> "$DEBUG_LOG"
echo "[$(date)] Tool: $CLAUDE_TOOL_NAME" >> "$DEBUG_LOG"
echo "[$(date)] Input: $(cat)" >> "$DEBUG_LOG"
```

---

### 4. 验证 JSON 输出格式

确保脚本输出有效 JSON：

```bash
# 测试 JSON 有效性
echo '{"hookSpecificOutput":{"decision":{"decision":"deny"}}}' | jq .
```

---

### 5. 检查退出码

退出码决定决策：

```bash
# 测试脚本
bash .claude/hooks/my-hook.sh
echo "Exit code: $?"
```

---

### 6. 禁用特定 Hook 临时调试

修改配置禁用 Hook：

```json
{
  "hooks": {
    "PostToolUse": []  // 清空数组禁用
  }
}
```

或使用本地配置覆盖：

```json
// .claude/settings.local.json
{
  "hooks": {
    "PostToolUse": []  // 本地禁用
  }
}
```

---

## 常见问题排查

### 问题 1: Hook 未触发

**可能原因**:
1. matcher 配置错误
2. 事件名称拼写错误
3. JSON 格式错误
4. 配置文件位置错误

**排查步骤**:

```bash
# 1. 检查配置文件位置
ls -la .claude/settings.json
ls -la ~/.claude/settings.json

# 2. 验证 JSON 格式
jq . .claude/settings.json

# 3. 检查事件名称是否有效
# 参考: 01-events.md 事件列表
```

---

### 问题 2: Hook 超时

**可能原因**:
1. 命令执行时间过长
2. timeout 设置过小
3. 网络请求阻塞

**解决方案**:

```json
{
  "timeout": 60  // 增加超时时间
}
```

或优化命令：

```bash
# 使用后台执行避免阻塞
command &

# 或使用 timeout 工具
timeout 30s npx prettier --write "$FILE"
```

---

### 问题 3: Hook 输出无效

**可能原因**:
1. JSON 格式错误
2. 未正确输出到 stdout
3. 输出到 stderr 而非 stdout

**排查**:

```bash
# 确保 JSON 输出到 stdout
echo '{"decision": "approve"}'  # stdout

# ❌ 错误：输出到 stderr
echo '{"decision": "approve"}' >&2

# 测试 JSON
echo '{"decision": "approve"}' | jq .
```

---

### 问题 4: 权限拒绝

**可能原因**:
1. 脚本无执行权限
2. 文件路径不存在
3. Shell 解释器路径错误

**解决**:

```bash
# 设置执行权限
chmod +x .claude/hooks/*.sh

# 检查脚本头
head -1 .claude/hooks/my-hook.sh
# 应显示: #!/bin/bash
```

---

### 问题 5: 环境变量未生效

**可能原因**:
1. 变量名拼写错误
2. Shell 不支持该变量

**验证**:

```bash
# 在脚本中打印环境变量
echo "DEBUG: CLAUDE_TOOL_NAME=$CLAUDE_TOOL_NAME"
echo "DEBUG: CLAUDE_PROJECT_DIR=$CLAUDE_PROJECT_DIR"
```

---

### 问题 6: prompt Hook 不生效

**可能原因**:
1. 提示格式不清晰
2. 未指定决策返回格式
3. LLM 返回非 JSON

**解决**:

```json
{
  "type": "prompt",
  "prompt": "Validate safety. Return JSON: {decision: 'approve'} or {decision: 'deny', reason: '...'}"
}
```

确保提示明确要求返回 JSON 格式。

---

## 安全注意事项

### 1. 不在 Hook 中硬编码敏感信息

```bash
# ❌ 危险：硬编码 API Key
curl -H "Authorization: Bearer hardcoded-key" ...

# ✅ 安全：使用环境变量
curl -H "Authorization: Bearer $API_KEY" ...
```

---

### 2. 验证外部输入

Hook 接收的数据来自 Claude，但仍需验证：

```bash
FILE=$(jq -r '.tool_input.file_path')

# 验证路径在项目内
if [[ "$FILE" != "$CLAUDE_PROJECT_DIR"* ]]; then
  echo "Invalid path"
  exit 1
fi
```

---

### 3. 限制危险操作

PreToolUse Hook 应阻止危险命令：

```bash
CMD=$(jq -r '.tool_input.command')

# 阻止危险命令
DANGEROUS="rm -rf|sudo|chmod 777|mkfs"
if [[ "$CMD" =~ $DANGEROUS ]]; then
  echo '{"hookSpecificOutput":{"decision":{"decision":"deny"}}}'
  exit 1
fi
```

---

## 性能优化

### 1. 批量处理使用 PostToolBatch

多个工具并行调用后统一处理：

```json
{
  "PostToolBatch": [
    {
      "hooks": [
        {
          "type": "command",
          "command": "npm run lint"
        }
      ]
    }
  ]
}
```

---

### 2. 条件触发避免无效执行

```bash
# 仅对 TypeScript 文件格式化
if [[ "$FILE" == *.ts ]]; then
  npx prettier --write "$FILE"
fi
exit 0
```

---

### 3. 缓存结果避免重复执行

```bash
# 检查是否已格式化
if prettier --check "$FILE" 2>/dev/null; then
  exit 0  # 已格式化，跳过
fi
npx prettier --write "$FILE"
```

---

## 总结 Checklist

### 新 Hook 上线前检查

- [ ] 配置文件位置正确
- [ ] JSON 格式有效（`jq .` 验证）
- [ ] 事件名称正确
- [ ] matcher 语法正确
- [ ] 脚本有执行权限（`chmod +x`）
- [ ] 超时设置合理
- [ ] 错误处理优雅（`|| true`）
- [ ] 幂等设计
- [ ] 已单独测试脚本
- [ ] 已测试完整触发流程

---

## 参考资源

- [官方 Hooks Reference](https://docs.anthropic.com/en/docs/claude-code/hooks)
- [Claude Code Hooks Guide](https://code.claude.com/docs/en/hooks-guide)