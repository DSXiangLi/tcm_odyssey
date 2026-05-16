# PreCompact Hook 实战案例：生成 handover.md

**文件位置**: `.claude/hooks/precompact-unified.py`
**Hook 配置**: `.claude/hooks/hooks.json`
**触发时机**: Claude Code 自动压缩上下文前

---

## 设计思路

生成 handover.md 为下一个 session 提供完整上下文：

```
PreCompact触发 → Git备份 → Claude分析transcript → 生成handover.md → 更新PROGRESS/STATE → 压缩继续
```

---

## 文档职责划分（已简化）

| 文档 | 职责 | 更新方式 |
|------|------|----------|
| **STATE.md** | 项目已完成状态 | 多进程共享，Phase完成时追加 |
| **PROGRESS.md** | 进行中任务 + 下一步TODO | 多进程共享，进展时更新 |
| **handover.md** | 下一个session上下文 | PreCompact生成，SessionStart加载 |
| **CLAUDE.md** | 快速索引摘要 | Phase状态变化时更新 |

**简化**: TODO.md 已合并到 PROGRESS.md 末尾

---

## handover.md 内容

必须包含四部分：

1. **当前 TODO**: 任务列表 + 执行步骤
2. **PROGRESS 摘要**: 最近完成 + 关键修复
3. **STATE 摘要**: 已完成Phases + 当前Phase
4. **参考文档**: 规范链接 + 经验链接

---

## PROGRESS.md 结构

```markdown
# 药灵山谷 - 当前进行中状态

**最后更新**: YYYY-MM-DD

---

## 进行中任务

[任务详情、修复记录]

---

## 下一步 TODO

### 待处理列表
| 优先级 | 任务 | 状态 |

### 执行步骤
1. [步骤]
```

---

## 安全机制：Git 备份

**回滚命令**：
```bash
git checkout HEAD~1 -- STATE.md PROGRESS.md handover.md
```

---

## 相关文档

- [SessionStart Hook 案例](./08-sessionstart-case-study.md)
- [Claude CLI 使用指南](./07-cli-usage.md)