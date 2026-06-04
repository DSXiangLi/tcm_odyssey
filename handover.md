# Handover - 2026-06-04

## 下一步指令（明确todo）

**启动后立即执行**:
1. 选择下一个Phase 2.5功能开发：
   - 病案集（C键触发） - 设计完成，待实施
   - 炮制（P键触发） - 设计完成，待实施
   - 种植（G键触发） - 入口已存在，待开发
2. 验证服务状态：
   - game-state-backend: `curl http://localhost:8643/health`
   - Hermes Backend: `curl http://localhost:8642/health`
   - Frontend: `curl http://localhost:3000`

**可选检查**:
- 检查Git提交历史：`git log --oneline -10`
- 检查inventory数据：`curl http://localhost:8643/api/inventory/player_001 | jq '.statistics'`

---

## 当前进展状态

- ✅ Inventory数据统一完成（用户验收通过，已合并到master）
- ✅ 自动化测试100%通过（11个E2E测试）
- ✅ 数据一致性验证（麻黄raw_count=12）
- ✅ 分支开发规范实施（feature → 验收 → merge）
- 游戏黑屏问题 ✅ 已修复（Vite缓存过期）
- 游戏状态后端设计/实施 ✅ 完成
- Hermes Backend工具调整 ✅ 完成

---

## 待处理队列（表格）

| 优先级 | 任务 | 状态 | 验证方式 |
|--------|------|------|----------|
| P0 | Inventory数据统一 | ✅ 已完成 | 用户验收通过，已合并 |
| P1 | Phase 2.5病案集小游戏 | 设计完成 | C键触发，待实现 |
| P1 | Phase 2.5炮制小游戏 | 设计完成 | P键触发，待实现 |
| P2 | Phase 2.5种植小游戏 | 入口已存在 | G键触发，待开发 |

---

## 参考文档链接

- [背包数据统一设计](docs/superpowers/specs/phase2.5/2026-06-02-inventory-data-unification-design.md)
- [背包数据统一验收报告](docs/superpowers/experience/2026-06-04-inventory-data-unification-verification-report.md)
- [背包数据合并完成](docs/superpowers/experience/2026-06-04-inventory-merge-complete-report.md)

## 启动命令

```bash
# 1. 启动Hermes后端（NPC Agent服务）
cd hermes_backend && python3 main.py

# 2. 启动游戏前端
npm run dev

# 3. 启动game-state-backend（可选，如需真实数据）
cd ../game-state-backend-dev/game-state-backend && python3 main.py
```