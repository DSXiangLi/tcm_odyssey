# Handover - 2026-06-04

## 下一步指令（明确todo）

**启动后立即执行**:
1. 验证 Hermes Backend 工具调用是否返回真实数据
   - 方式：在游戏中触发NPC对话（空格键），观察Tool Card显示内容
   - 检查点：工具结果应包含game-state-backend返回的真实学习进度/背包数据
2. 检查 game-state-backend 服务状态 - `curl http://localhost:8643/health`
   - 验证方式：返回 `{"status":"ok",...}`
3. 继续Phase 2.5剩余小游戏开发（病案集C键/炮制P键）

**可选检查**:
- 检查Git提交历史：`git log --oneline -10`
- 检查game-state-backend数据库：`sqlite3 ../game-state-backend-dev/game-state-backend/data/player_progress.db "SELECT * FROM npc_tasks LIMIT 5"`

---

## 当前进展状态

- 游戏黑屏问题 ✅ 已修复（Vite缓存过期，清理后重启）
- 游戏状态后端设计文档 ✅ 完成
- 游戏状态后端实施计划 ✅ 完成
- 游戏状态后端实现 ✅ 完成（Task 1-10全部通过）
- Hermes Backend工具调整 ✅ 完成（HTTP调用game-state-backend）
- 验证合规报告 ✅ 完成（5/7通过，已知问题记录）
- Git提交 ✅ 完成（4个提交：实施/修复/验证/文档）
- 文档目录重组 ✅ 完成（phase2-5→phase3，9个NPC文档迁移）
- Hermes与OpenClaw架构对比 ✅ 完成（System Prompt三层结构对比文档）

---

## 待处理队列（表格）

| 优先级 | 任务 | 状态 | 验证方式 |
|--------|------|------|----------|
| P0 | 验证工具调用真实数据 | 待执行 | 游戏中触发NPC对话观察Tool Card |
| P1 | game-state-backend服务启动 | 待执行 | `curl localhost:8643/health` |
| P2 | Phase 2.5病案集小游戏 | 设计完成 | C键触发，待实现 |
| P2 | Phase 2.5炮制小游戏 | 设计完成 | P键触发，待实现 |
| P3 | Phase 2.5种植小游戏 | 入口已存在 | G键触发，待开发 |

---

## 参考文档链接

- [背包数据统一设计](docs/superpowers/specs/phase2.5/2026-06-02-inventory-data-unification-design.md)
- [背包数据统一计划](docs/superpowers/plans/2026-06-02-inventory-data-unification-plan.md)
- [Hermes与OpenClaw对比](docs/superpowers/specs/phase3/2026-06-04-hermes-openclaw-architecture-comparison.md)
- [System Prompt对比](docs/superpowers/specs/phase3/2026-06-04-system-prompt-construction-comparison.md)

## 启动命令

```bash
# 1. 启动Hermes后端（NPC Agent服务）
cd hermes_backend && python3 main.py

# 2. 启动游戏前端
npm run dev

# 3. 启动game-state-backend（可选，如需真实数据）
cd ../game-state-backend-dev/game-state-backend && python3 main.py
```