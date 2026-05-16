# SessionStart Hook 实战案例：使用 prompt 类型加载上下文

**Hook 配置**: `.claude/hooks/hooks.json`
**触发时机**: Claude Code session 启动时

---

## 设计思路

使用 `prompt` 类型 hook，让 Claude 自己读取 handover.md：

```
SessionStart触发 → prompt注入提示 → Claude读取handover.md → Claude知道该做什么
```

**关键**: prompt 类型 hook 直接将提示注入 Claude 的上下文，Claude 会根据提示自主行动。

---

## Hook 配置

```json
{
  "hooks": {
    "SessionStart": [
      {
        "hooks": [
          {
            "type": "prompt",
            "prompt": "请阅读 handover.md 了解项目当前状态和下一步任务。handover.md 包含：1) 当前TODO和执行步骤 2) PROGRESS摘要（最近完成的工作） 3) STATE摘要（已完成Phases） 4) 参考文档链接。阅读后，你将清楚知道应该继续什么任务以及如何执行。"
          }
        ]
      }
    ]
  }
}
```

---

## prompt 类型 vs command 类型

| 类型 | 方式 | 适用场景 |
|------|------|----------|
| **prompt** | 直接注入提示，Claude自主行动 | 需要Claude理解并决策 |
| **command** | 执行脚本，输出注入上下文 | 需要预处理或格式转换 |

**本场景**: 使用 prompt 更合适，因为：
- handover.md 是标准 Markdown，Claude 直接读取即可
- 不需要预处理
- Claude 自主决定如何利用上下文信息

---

## 文档体系（已简化）

| 文档 | 职责 |
|------|------|
| **STATE.md** | 项目已完成状态 |
| **PROGRESS.md** | 进行中任务 + 下一步TODO |
| **handover.md** | 下一个session上下文 |
| **CLAUDE.md** | 快速索引摘要 |

**简化**: TODO.md 已合并到 PROGRESS.md 末尾

---

## 相关文档

- [PreCompact Hook 案例](./06-precompact-case-study.md)
- [Handler 类型详解](./03-handler-types.md#2-prompt-类型)