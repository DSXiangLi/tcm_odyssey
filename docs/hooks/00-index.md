# Claude Hook 开发指南 - 文档索引

**版本**: v1.0
**最后更新**: 2026-05-07
**来源**: Anthropic Claude Code Official Documentation

---

## 文档导航

| 文档 | 内容 | 适用场景 |
|------|------|----------|
| [01-events.md](./01-events.md) | Hook 事件类型完整列表 | 了解何时触发 |
| [02-configuration.md](./02-configuration.md) | 配置规范和语法 | 编写 settings.json |
| [03-handler-types.md](./03-handler-types.md) | 处理器类型详解 | 选择实现方式 |
| [04-examples.md](./04-examples.md) | 实用示例集合 | 快速上手 |
| [05-best-practices.md](./05-best-practices.md) | 最佳实践和调试技巧 | 避坑指南 |
| [06-precompact-case-study.md](./06-precompact-case-study.md) | PreCompact实战案例 | 生成handover.md |
| [07-cli-usage.md](./07-cli-usage.md) | Claude CLI完整使用指南 | 脚本调用Claude |
| [08-sessionstart-case-study.md](./08-sessionstart-case-study.md) | SessionStart实战案例 | 加载handover.md |

---

## 快速入门

### 什么是 Claude Hook？

Hook 是用户定义的自动化脚本，在 Claude Code 生命周期的特定时刻自动执行。它可以：

- **拦截和控制** 工具执行（PreToolUse）
- **响应和验证** 工具结果（PostToolUse）
- **注入上下文** 到会话（SessionStart）
- **验证完成** 任务状态（Stop）

### 三分钟配置

1. **创建配置文件** `.claude/settings.json`（项目级）或 `~/.claude/settings.json`（全局）

2. **添加基本 Hook**：

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "npx prettier --write \"$CLAUDE_TOOL_INPUT_FILE_PATH\""
          }
        ]
      }
    ]
  }
}
```

3. **验证生效** - Claude Code 自动加载配置，无需重启

---

## 核心概念速览

### Hook 执行时机

```
用户输入 → UserPromptSubmit
         ↓
   PreToolUse → [拦截/批准/修改] → 工具执行
         ↓                           ↓
   PermissionRequest → [批准/拒绝]   PostToolUse → [格式化/验证]
         ↓                           ↓
   Claude 响应 → Stop → [验证完成/继续]
         ↓
   SessionEnd → [清理/报告]
```

### 配置层级

| 层级 | 文件位置 | 作用范围 | Git 状态 |
|------|----------|----------|----------|
| **全局** | `~/.claude/settings.json` | 所有项目 | 本地 |
| **项目** | `.claude/settings.json` | 单个项目 | 可提交 |
| **本地** | `.claude/settings.local.json` | 单个项目 | gitignore |

**优先级**: 本地 > 项目 > 全局（相同事件会合并执行）

---

## 常用 Hook 类型速查

| 事件 | 触发时机 | 可否阻塞 | 常见用途 |
|------|----------|----------|----------|
| `PreToolUse` | 工具执行前 | ✅ 可以 | 验证参数、阻塞危险操作 |
| `PostToolUse` | 工具成功后 | ❌ 不能 | 自动格式化、通知 |
| `Stop` | 响应完成时 | ✅ 可以 | 验证测试通过、继续任务 |
| `SessionStart` | 会话开始时 | ❌ 不能 | 加载项目状态、注入上下文 |

---

## 下一步

- **需要了解具体事件** → 阅读 [01-events.md](./01-events.md)
- **开始编写配置** → 阅读 [02-configuration.md](./02-configuration.md)
- **选择处理器类型** → 阅读 [03-handler-types.md](./03-handler-types.md)
- **查看现成示例** → 阅读 [04-examples.md](./04-examples.md)
- **避免常见错误** → 阅读 [05-best-practices.md](./05-best-practices.md)
- **实战案例学习** → 阅读 [06-precompact-case-study.md](./06-precompact-case-study.md)

---

## 参考资源

- [官方 Hooks Reference](https://docs.anthropic.com/en/docs/claude-code/hooks)
- [Claude Code Hooks Guide](https://code.claude.com/docs/en/hooks-guide)
- [Claude Blog: How to Configure Hooks](https://claude.com/blog/how-to-configure-hooks)