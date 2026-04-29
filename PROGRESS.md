# 药灵山谷 - 当前任务跟踪

**最后更新**: 2026-04-29
**当前状态**: Phase 2.5 Hermes NPC 对话完整集成完成

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

### 修改文件清单

| 文件 | 修改内容 |
|------|---------|
| `src/utils/sseClient.ts` | 添加 ToolCallCallback, context字段, tool_call解析 |
| `src/systems/NPCInteraction.ts` | 添加 checkNearbyTrigger, getTriggerHint, sendNPCMessageWithTools |
| `src/ui/DialogUI.ts` | 添加 HTML输入框, showInputDialog/hideInputDialog, sendMessageWithTools |
| `src/scenes/BootScene.ts` | 添加 loadNPCSprites 方法 |
| `src/scenes/ClinicScene.ts` | 添加 nearby触发检测, showDialogWithNPC, handleToolCall, startMinigameFromTool |
| `src/scenes/GardenScene.ts` | 添加 laozhang NPC集成, nearby触发, tool调用 |

### 6个游戏工具

| 工具名称 | 功能 | emoji |
|---------|------|-------|
| `get_learning_progress` | 查询玩家学习进度 | 📊 |
| `get_case_progress` | 查询病案诊治进度 | 📋 |
| `get_inventory` | 查询背包内容 | 🎒 |
| `trigger_minigame` | 启动小游戏 (问诊/辨证/煎药等) | 🎮 |
| `record_weakness` | 记录学习弱点 | 📝 |
| `get_npc_memory` | 获取NPC对玩家的记忆 | 🧠 |

### NPC配置

| NPC | 场景 | 位置 | 触发距离 | 教学风格 |
|-----|------|------|---------|---------|
| qingmu (青木先生) | ClinicScene | (200, 150) | 100px | 引导式教学/经典引用/案例驱动 |
| laozhang (老张) | GardenScene | (180, 120) | 80px | 实践指导/药材辨识 |
| neighbor (邻居阿姨) | HomeScene | (150, 100) | 60px | 日常对话/药膳介绍 |

### TypeScript 编译状态

✅ 编译通过（无错误）

### 后端启动

```bash
cd hermes_backend
pip install -r requirements.txt
python main.py
# 服务运行在 http://localhost:8642
```

### E2E 测试状态

测试覆盖：
- Backend health check ✅
- Welcome dialog trigger ✅
- Input dialog visibility ✅
- Tool call verification ✅

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

## 下一步行动

暂无进行中任务。可考虑：
1. 实现 neighbor NPC (HomeScene集成)
2. 添加更多 Skills 文档 (practice_guidance.md 等)
3. 开始 Phase 2.5 种植/选方小游戏
4. 生产环境替换 MockGameStore 为真实数据库

---

*本文档由 Claude Code 维护，更新于 2026-04-29*