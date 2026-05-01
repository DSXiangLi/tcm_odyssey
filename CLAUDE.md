# 药灵山谷 (Yaoling Shangu) - 项目文档

**版本**: v3.4
**最后更新**: 2026-05-01
**技术栈**: Phaser 3 + TypeScript + Vite + Hermes-Agent

---

## 项目概述

2D像素风格中医学习游戏，核心特色：AI NPC系统、游戏化学习、地道药材、无压力节奏。

---

## 文档职责划分（渐进式加载）

| 文档 | 职责 | 内容 |
|------|------|------|
| **PROGRESS.md** | 进行中任务 | 当前正在开发的工作 |
| **TODO.md** | 已完成任务 | 已完成阶段的详细功能概述 |
| **CLAUDE.md** | 快速索引 | 进度摘要表+项目结构+核心规则 |
| **docs/superpowers/experience/** | 经验教训 | 问题复盘与修复方案 |

---

## 当前进度摘要

| 阶段 | 状态 | 说明 |
|------|------|------|
| Phase 1 | ✅ | 项目框架与核心系统 |
| Phase 1.5 | ✅ | 游戏世界视觉呈现 |
| Phase 2 | ✅ | NPC Agent系统 (S1-S13, 861测试) |
| Phase 2.5 UI基础 | ✅ | ModalUI基类+组件库 |
| Phase 2.5 煎药 | ✅ | HTML直接迁移+AI验收86.5分 |
| Phase 2.5 诊断 | ✅ | 5阶段10病案+场景切换修复 |
| Phase 2.5 NPC验收 | ✅ | LLM评估器+19个E2E测试 |
| Phase 2.5 种植 | ⏳ | 入口已存在，待开发 |

> **详细内容**: [TODO.md](./TODO.md) - 已完成任务详情
> **当前任务**: [PROGRESS.md](./PROGRESS.md) - 进行中工作

---

## 项目架构

```
zhongyi_game_v3/
├── docs/superpowers/
│   ├── specs/                      # 设计规范（按phase组织）
│   ├── plans/                      # 实现计划
│   └── experience/                 # 经验教训
│
├── src/
│   ├── scenes/                     # Phaser场景
│   │   ├── ClinicScene.ts          # 诊所 (B背包, Z诊断, D煎药)
│   │   ├── GardenScene.ts          # 药园 (G种植, P炮制)
│   │   └── DiagnosisScene.ts       # 诊断游戏
│   ├── systems/                    # 系统管理器
│   ├── ui/                         # UI组件
│   └── data/                       # 数据定义
│
├── tests/                          # 测试
├── PROGRESS.md                     # 进行中任务
├── TODO.md                         # 已完成任务详情
└── CLAUDE.md                       # 本文档
```

---

## 开发核心原则

### 文档目录规范
- 设计文档: `docs/superpowers/specs/phase{n}/YYYY-MM-DD-xxx-design.md`
- 规划文档: `docs/superpowers/plans/phase{n}/YYYY-MM-DD-xxx-plan.md`
- 经验教训: `docs/superpowers/experience/YYYY-MM-DD-xxx.md`

### 真实测试原则
- ❌ 禁止 Mock（硬编码假数据）
- ✅ 必须真实（调用真实API/数据库）

### 问题修复原则
- 使用 `/systematic-debugging` 先定位根本原因

### 工作区整洁原则
- 执行前检查废弃文件，立即删除
- 提交时确保 git status 干净

---

## 经验教训索引

| 日期 | 问题 | 关键教训 |
|------|------|----------|
| 2026-04-29 | CSS未导入UI空白 | `toBeVisible()`不检查尺寸 |
| 2026-04-30 | 场景退出后无法再进入 | `launch()+stop()`不触发wake |

> **详细复盘**: `docs/superpowers/experience/` 目录

---

*渐进式加载：摘要在此，详情见 TODO.md/PROGRESS.md*