# 药灵山谷 - 当前任务跟踪

**最后更新**: 2026-04-30
**当前状态**: Phase 2.5 NPC AI 自动测试验收 - 进行中 (Task 4 实现完成，待审查)

---

## Phase 2.5: NPC AI 自动测试验收 ⏳ 进行中

**状态**: 实现中（4/8任务完成）
**开始日期**: 2026-04-30
**分支**: master
**设计文档**: [NPC AI验收设计](docs/superpowers/specs/phase2-5/2026-04-30-npc-ai-acceptance-testing-design.md)
**实现计划**: [NPC AI验收计划](docs/superpowers/plans/phase2-5/2026-04-30-npc-ai-acceptance-testing-plan.md)

### 任务进度

| Task | 状态 | 审查状态 |
|------|------|---------|
| Task 1: 后端 DialogLogger | ✅ 完成 | Spec✅ 质量✅ |
| Task 2: EventBus NPC事件 | ✅ 完成 | Spec✅ 质量✅ |
| Task 3: GameLogger NPC类别 | ✅ 完成 | Spec✅ 质量✅ |
| Task 4: 配置和评估模块 | ✅ 实现 | 待审查 |
| Task 5: 报告生成器 | ⏳ 待执行 | - |
| Task 6: 全流程编排脚本 | ⏳ 待执行 | - |
| Task 7: E2E测试扩展 | ⏳ 待执行 | - |
| Task 8: 更新PROGRESS.md | ⏳ 待执行 | - |

### 已创建文件清单

| 文件 | 行数 | 功能 | Commit |
|------|------|------|--------|
| `hermes_backend/gateway/dialog_logger.py` | 117 | 后端对话日志记录器 | 2290ec9 |
| `scripts/npc_acceptance/__init__.py` | 1 | 包初始化 | 18713ce |
| `scripts/npc_acceptance/config.py` | 122 | 验收配置（阈值、权重、Prompt） | 18713ce |
| `scripts/npc_acceptance/dialog_evaluator.py` | 307 | LLM对话质量评估 | 18713ce |

### 已修改文件清单

| 文件 | 修改内容 | Commit |
|------|---------|--------|
| `hermes_backend/gateway/stream_consumer.py` | 集成 DialogLogger | 2290ec9 |
| `src/systems/EventBus.ts` | 添加6个NPC触发事件 | e3cdeae |
| `src/utils/GameLogger.ts` | 添加npc_trigger类别 | f9c4fec |

### 验收维度

| 维度 | 权重 | 阈值 |
|-----|------|------|
| 教学风格符合度 | 40% | 75 |
| 上下文连贯性 | 30% | 80 |
| 工具调用合理性 | 30% | 70 |
| E2E测试通过率 | 50% | 80% |
| 综合验收分数 | - | 85% |

### 继续执行提示

重启对话后，使用以下命令继续执行：
```
执行 docs/superpowers/plans/phase2-5/2026-04-30-npc-ai-acceptance-testing-plan.md
使用 subagent-driven-development 模式，从 Task 4 Spec合规审查 开始
```

---

## Phase 2.5: 诊断/煎药场景切换修复 ✅ 完成

**状态**: 全部完成
**完成日期**: 2026-04-30

### 修复内容

| 问题 | 根本原因 | 修复方案 |
|-----|---------|---------|
| CSS导入缺失，UI不可见 | `import './diagnosis.css'` 未添加 | 添加CSS导入 |
| 位置偏离游戏画面 | CSS假设1440×900，游戏1280×720 | 统一backdrop+centered modal布局 |
| 退出后场景卡死 | `removeEventListener`使用空函数 | 保存监听器引用正确移除 |
| 退出后无法再次进入 | `scene.launch()`不触发wake事件 | 监听SCENE_SWITCH事件重置isTransitioning |
| 内部元素尺寸溢出 | 固定像素尺寸超出容器 | 调整grid布局和元素尺寸 |
| I键问诊冗余入口 | 保留两个入口(Z/I) | 删除I键，统一Z键诊断 |

### 经验文档

- [事件监听器移除失败](docs/superpowers/experience/2026-04-30-event-listener-removal-failure.md)

### Phaser场景切换机制总结

| 方法 | 当前场景状态 | 新场景状态 | wake事件 |
|------|-------------|-----------|---------|
| `scene.start()` | 停止 | 启动 | ❌ |
| `scene.launch()` | 保持running | 启动 | ❌ |
| `scene.sleep()` | sleep | - | - |
| `scene.stop()` | 停止自己 | - | ❌ |

**关键结论**: `launch()` + `stop()` 组合不会触发wake，需通过EventBus通信。

---

## Phase 2.5: Hermes NPC 对话完整集成 ✅ 完成

**状态**: 全部完成
**开始日期**: 2026-04-29
**完成日期**: 2026-04-29
**分支**: master
**设计文档**: [NPC对话集成设计](docs/superpowers/specs/phase2-5/2026-04-28-hermes-npc-dialog-integration-design.md)
**实现计划**: [NPC对话集成计划](docs/superpowers/plans/phase2-5/2026-04-29-hermes-npc-dialog-integration-plan.md)

### 已创建文件清单

| 文件 | 行数 | 功能 |
|------|------|------|
| `hermes_backend/requirements.txt` | 5 | Python依赖 (FastAPI, uvicorn, openai等) |
| `hermes_backend/models/chat.py` | 20 | ChatRequest/ChatResponse Pydantic模型 |
| `hermes_backend/tools/registry.py` | 98 | 工具注册机制 (ToolRegistry类) |
| `hermes_backend/tools/game_tools.py` | 274 | 6个游戏工具定义 |
| `hermes_backend/gateway/game_adapter.py` | 127 | Mock数据存储 (任务/病案/背包/NPC记忆) |
| `hermes_backend/gateway/stream_consumer.py` | 203 | SSE流式输出 + LLM调用 |
| `hermes_backend/main.py` | 117 | FastAPI入口 (health/stream/chat/status端点) |
| `hermes/skills/guided_questioning.md` | 52 | 引导式提问技巧教学方法 |
| `hermes/skills/case_analysis.md` | 42 | 病案分析方法流程 |
| `hermes/skills/feedback_evaluation.md` | 60 | 评分反馈模板 |
| `src/data/npc-config.ts` | 70 | NPC配置注册表 (3个NPC) |
| `tests/e2e/npc-dialog.spec.ts` | 80 | E2E测试 (5个测试场景) |

---

## Phase 2.5: 诊断游戏 HTML 直接迁移 ✅ 完成

**状态**: 全部完成
**开始日期**: 2026-04-28
**完成日期**: 2026-04-29
**分支**: master
**设计文档**: [诊断游戏HTML迁移设计](docs/superpowers/specs/phase2-5/2026-04-28-diagnosis-html-migration-design.md)
**实现计划**: [诊断游戏HTML迁移计划](docs/superpowers/plans/phase2-5/2026-04-28-diagnosis-html-migration-plan.md)

### 已创建文件清单

| 文件 | 行数 | 功能 |
|------|------|------|
| `src/ui/html/diagnosis.css` | 350+ | 主样式系统（古朴典雅水墨风格） |
| `src/ui/html/data/diagnosis-cases.ts` | 800+ | 病案数据（10个外感类内科病案） |
| `src/ui/html/components/DiagnosisAssets.tsx` | 200+ | SVG资产组件（舌象、患者立绘、印章） |
| `src/ui/html/DiagnosisUI.tsx` | 1000+ | 主应用组件（5阶段Tab导航） |
| `src/ui/html/CaseIntroModal.tsx` | 150+ | 病案简介弹窗组件 |
| `src/ui/html/diagnosis-entry.tsx` | 50+ | React入口函数 |
| `src/ui/html/bridge/diagnosis-events.ts` | 20+ | 桥接事件常量 |
| `src/scenes/DiagnosisScene.ts` | 200+ | Phaser诊断场景 |
| `tests/e2e/diagnosis-html-ui.spec.ts` | 200+ | E2E测试（14个测试场景） |

---

*本文档由 Claude Code 维护，更新于 2026-04-30*