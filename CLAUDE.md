# 药灵山谷 (Yaoling Shangu) - 项目文档

**版本**: v3.0 - Phase 2全部完成，Phase 2.5 UI组件统一化完成
**最后更新**: 2026-04-19
**技术栈**: Phaser 3 + TypeScript + Vite + Hermes-Agent

---

## 当前进度摘要

> **详细进度请查看**: [PROGRESS.md](./PROGRESS.md)

| 阶段 | 状态 | 说明 |
|-----|------|------|
| Phase 1 | ✅ 完成 | 项目框架与核心系统 |
| Phase 1.5 | ✅ 完成 | 游戏世界视觉呈现 |
| Phase 2 | ✅ 完成 | NPC Agent系统 (S1-S13全部完成，861测试通过) |
| 视觉验收 | ✅ 完成 | 自动化系统实现 |
| Round 1-2 UI配色 | ✅ 完成 | 配色协调优化 |
| Round 4 弹窗设计 | ✅ 完成 | 现代弹窗设计方案 |
| **Round 3 视觉优化** | ⏳ 进行中 | Task 4: AI评估验证待执行 |
| **Phase 2 退出按钮** | ✅ 完成 | 所有UI继承ModalUI基类 |
| **Phase 2.5 UI统一化** | ✅ 完成 | 15个UI组件重构完成，820测试通过 |

---

## 已完成阶段功能概述

### Phase 1: 项目框架与核心系统 ✅

**核心功能**:
- Phaser 3 + TypeScript + Vite 项目初始化
- BootScene资源加载、TitleScene标题画面
- TownOutdoorScene主场景 (86×48瓦片地图，916可行走瓦片)
- Player实体类、碰撞检测系统
- 场景切换系统 + ClinicScene/GardenScene/HomeScene室内场景
- 可配置地图系统 (`src/data/map-config.ts`)

**设计文档**: [Phase 1验收标准](docs/superpowers/specs/2026-04-05-phase1-acceptance-criteria.md)
**实现计划**: [Phase 1实现计划](docs/superpowers/plans/2026-04-05-mvp-phase1-foundation.md)

---

### Phase 1.5: 游戏世界视觉呈现 ✅

**核心功能**:
- 视觉设计规范制定 (田园治愈+中医文化+神秘探索)
- AI生成流程搭建 (小镇外景全景图、黑白遮罩层)
- 遮罩层自动映射 (可行走区域识别)
- 室内场景素材适配
- AI端到端测试覆盖 (布局、移动、碰撞、场景切换)

**成果**: 86×48瓦片地图，门位置(药园15,8/诊所60,8/家61,35)，玩家出生点(47,24)

**设计文档**: [视觉设计规范](docs/superpowers/specs/2026-04-05-visual-design-v1.0.md)
**实现计划**: [Phase 1.5视觉实现计划](docs/superpowers/plans/2026-04-05-phase1.5-visual-implementation.md)

---

### Phase 2: NPC Agent系统 ✅ (S1-S13)

| 步骤 | 功能模块 | 核心文件 | 测试数 |
|-----|---------|---------|-------|
| **S1** | Hermes基础设施 | HermesManager, SSEClient, GameAdapter | 31 |
| **S2** | 数据结构定义 | NPC文件(SOUL/MEMORY/USER/SYLLABUS/TASKS), 病案, 病人模板 | 11 |
| **S3** | NPC对话基础 | DialogUI, StreamingText, NPCInteraction | - |
| **S4** | 问诊重构 | ClueTracker, InquiryUI, InquiryScene, PatientDialogGenerator | 15 |
| **S5** | 病案系统 | CaseManager, CasesListUI, CaseDetailUI, blocked_by解锁 | 11 |
| **S6** | 诊治游戏 | PulseScene→TongueScene→SyndromeScene→PrescriptionScene→ResultUI | 42 |
| **S7** | 存档系统 | SaveManager, SaveUI, 自动存档, 多槽位管理 | 8 |
| **S8** | 背包系统 | InventoryManager, InventoryUI, 药材/种子/工具/知识管理 | 81 |
| **S9** | 煎药系统 | DecoctionManager, DecoctionUI, 火候/顺序/配伍评分 | 102 |
| **S10** | 炮制系统 | ProcessingManager, ProcessingUI, 方法/辅料匹配评分 | 276 |
| **S11** | 种植系统 | PlantingManager, PlantingUI, 种子/地块/水源/肥料匹配 | 61 |
| **S12** | 经验值框架 | ExperienceManager, ExperienceUI, 来源追踪/解锁阈值 | 70 |
| **S13** | 新手引导系统 | TutorialManager, TutorialUI, 集中引导/场景提示 | 49 |

**设计文档**: [Phase 2 NPC Agent系统完整设计](docs/superpowers/specs/2026-04-12-phase2-npc-agent-design.md)
**实现计划**: [Phase 2实现计划（13步拆分）](docs/superpowers/plans/2026-04-12-phase2-implementation-plan.md)
**测试验收**: [Phase 2测试验收标准](docs/superpowers/specs/2026-04-11-phase2-test-acceptance.md)

---

### Phase 2.5: UI组件系统统一化 ✅ 完成

**核心目标**: 统一所有UI组件的尺寸、边框、退出机制，创建BaseUIComponent架构，实现游戏化交互设计。

**完成的组件重构**:
| 组件 | 用途 | 状态 |
|-----|------|------|
| ItemSlotComponent | 60×60物品格子，Neumorphism边框 | ✅ |
| SelectionButtonComponent | ○→●符号切换选择按钮 | ✅ |
| CompatibilitySlotComponent | 120×100配伍槽位，角色色系 | ✅ |
| PulseUI/TongueUI/SyndromeUI/PrescriptionUI | 诊断类UI | ✅ |
| DecoctionUI/ProcessingUI/PlantingUI | 小游戏UI | ✅ |
| InventoryUI/SaveUI/CasesListUI | 其他UI | ✅ |

**设计文档**:
| 文档 | 内容 |
|-----|------|
| [UI组件系统设计](docs/superpowers/specs/2026-04-19-ui-component-system-design.md) | BaseUIComponent架构、ModalUI规范、边框风格 |
| [游戏交互设计](docs/superpowers/specs/2026-04-19-game-interaction-design.md) | 左槽位+右背包模式、统一槽位类型(5种) |
| [小游戏设计文档](docs/superpowers/specs/minigames/) | 7个小游戏独立设计 |

**标准弹窗尺寸**:
| 类型 | 尺寸 | 适用 |
|-----|------|------|
| DIAGNOSIS_MODAL | 720×480 | 脉诊/舌诊/辨证/选方 |
| MINIGAME_MODAL | 800×600 | 煎药/炮制/种植 |
| INQUIRY_MODAL | 640×420 | 问诊 |
| FULLSCREEN_MODAL | 1024×768 | 背包/存档 |

**测试覆盖**: 820个单元/集成测试全部通过

---

### 视觉验收自动化系统 ✅

**核心功能**:
- 截图控制器 (Playwright启动游戏，模拟玩家操作)
- AI评估服务 (Qwen VL多模态模型分析视觉质量)
- 修改执行器 (解析建议，修改UI代码)
- 流程协调器 (评估→修改→验证→再评估循环)

**评估维度**: 中医风格15%、AI对话适配15%、UI布局15%、配色一致性10%、文字可读10%、场景氛围15%、Sprite动画5%、整体体验15%

**设计文档**: [Phase2 视觉验收自动化系统设计](docs/superpowers/specs/2026-04-15-phase2-visual-acceptance-design.md)
**实现计划**: [Phase2 视觉验收自动化系统实现计划](docs/superpowers/plans/2026-04-15-phase2-visual-acceptance-implementation.md)

---

### UI配色协调优化 (Round 1-4) ✅

**配色系统** (`src/data/ui-color-theme.ts`):
| 艅系 | 颜色值 | 用途 |
|-----|-------|------|
| 暗绿系 | #80a040 | 主色调（按钮、边框） |
| 暗蓝系 | #4080a0 | 信息、链接 |
| 灰蓝系 | #408080 | 诊所背景 |
| 暗棕系 | #604020 | 边框、装饰 |
| 柔和色系 | #90c070~#c07070 | 7种柔和色（Round 3） |

**弹窗设计规范 (Round 4)**:
| 层级 | 边框颜色 | 透明度 | 适用场景 |
|-----|---------|--------|---------|
| 底层弹窗 | 绿色(#80a040) | 0.85-1.0 | 主面板 |
| 顶层弹窗 | 金棕(#c0a080) | 1.0 | 确认弹窗 |

**设计文档**: [弹窗设计方案规范](docs/superpowers/specs/2026-04-18-modal-design-spec.md)
**HTML预览**: [弹窗设计HTML Demo](docs/design/modal-design-demo-v2.html)

---

## 项目概述

药灵山谷是一款2D像素风格的中医学习游戏，核心体验是"平衡融合"：
- **学习有成就感** - 系统化的中医知识教学
- **探索有新奇感** - 药王谷的发现与收集乐趣
- **生活有放松感** - 药膳制作、家园建设的治愈体验

### 核心特色
1. **AI NPC系统** - 每个核心NPC由LLM驱动，有记忆、有个性、能自主对话
2. **游戏化学习** - 在操作中自然记住药物属性，而非死记硬背
3. **地道药材** - 药王谷地貌对应中国真实产区
4. **无压力节奏** - 无时间/体力限制，玩家自由决定节奏

### 视觉风格定位
- **基调参考**: 《星露谷物语》- 温馨治愈，田园氛围
- **细节参考**: 《东方夜神月》- 场景精致，细节丰富
- **像素尺寸**: 32x32经典像素

---

## 开发顺序

**Phase 1** → **Phase 1.5 (视觉)** → **Phase 2 (NPC Agent)** → **Phase 3 (学习)** → **Phase 4 (探索)**

---

## 项目架构

```
zhongyi_game_v3/
├── docs/superpowers/
│   ├── specs/                      # 设计规范文档
│   │   ├── 2026-04-05-game-design-v3.0.md
│   │   ├── 2026-04-05-visual-design-v1.0.md
│   │   ├── 2026-04-12-phase2-npc-agent-design.md
│   │   ├── 2026-04-18-modal-design-spec.md
│   │   └── ...
│   └── plans/                      # 实现计划文档
│       ├── 2026-04-12-phase2-implementation-plan.md
│       ├── 2026-04-18-phase2-minigame-exit-button-fix.md
│       └── ...
│
├── hermes/                         # Hermes NPC后端 (S1)
│   └── npcs/qingmu/
│       ├── SOUL.md                 # NPC身份性格
│       ├── MEMORY.md               # NPC教学心得
│       ├── USER.md                 # 对玩家观察
│       ├── SYLLABUS.md             # 教学大纲
│       └── TASKS.json              # 任务进度
│
├── gateway/platforms/
│   └── game_adapter.py             # 游戏Adapter (S1)
│
├── src/
│   ├── main.ts                     # 游戏入口
│   ├── config/game.config.ts       # Phaser配置
│   │
│   ├── data/                       # 数据定义
│   │   ├── constants.ts            # 常量
│   │   ├── map-config.ts           # 地图配置（建筑、门、路径）
│   │   ├── ui-color-theme.ts       # UI配色常量
│   │   ├── inventory-data.ts       # 背包数据 (S8)
│   │   ├── decoction-data.ts       # 煎药数据 (S9)
│   │   ├── processing-data.ts      # 炮制数据 (S10)
│   │   ├── planting-data.ts        # 种植数据 (S11)
│   │   ├── experience-data.ts      # 经验值数据 (S12)
│   │   ├── tutorial-data.ts        # 新手引导数据 (S13)
│   │   ├── cases/core_cases.json   # 核心病案 (S2)
│   │   └── prescriptions.json      # 方剂数据 (S6)
│   │
│   ├── scenes/                     # Phaser场景
│   │   ├── TitleScene.ts           # 标题画面
│   │   ├── BootScene.ts            # 资源加载
│   │   ├── TownOutdoorScene.ts     # 室外场景
│   │   ├── ClinicScene.ts          # 青木诊所 (B键背包)
│   │   ├── GardenScene.ts          # 老张药园 (G键种植, P键炮制)
│   │   ├── HomeScene.ts            # 玩家之家
│   │   ├── InquiryScene.ts         # 问诊场景 (S4)
│   │   ├── PulseScene.ts           # 脉诊场景 (S6a)
│   │   ├── TongueScene.ts          # 舌诊场景 (S6b)
│   │   ├── SyndromeScene.ts        # 辨证场景 (S6c)
│   │   ├── PrescriptionScene.ts    # 选方场景 (S6d)
│   │   ├── DecoctionScene.ts       # 煎药场景 (S9)
│   │   ├── ProcessingScene.ts      # 炮制场景 (S10)
│   │   └── PlantingScene.ts        # 种植场景 (S11)
│   │
│   ├── entities/Player.ts          # 玩家实体
│   │
│   ├── systems/                    # 系统管理器
│   │   ├── EventBus.ts             # 事件总线
│   │   ├── HermesManager.ts        # Hermes进程管理 (S1)
│   │   ├── NPCInteraction.ts       # NPC交互系统 (S3)
│   │   ├── ClueTracker.ts          # 线索追踪 (S4)
│   │   ├── CaseManager.ts          # 病案管理 (S5)
│   │   ├── ScoringSystem.ts        # 评分系统 (S6)
│   │   ├── DiagnosisFlowManager.ts # 诊治流程管理 (S6)
│   │   ├── SaveManager.ts          # 存档管理 (S7)
│   │   ├── InventoryManager.ts     # 背包管理 (S8)
│   │   ├── DecoctionManager.ts     # 煎药管理 (S9)
│   │   ├── ProcessingManager.ts    # 炮制管理 (S10)
│   │   ├── PlantingManager.ts      # 种植管理 (S11)
│   │   ├── ExperienceManager.ts    # 经验值管理 (S12)
│   │   └── TutorialManager.ts      # 新手引导管理 (S13)
│   │
│   ├── ui/                         # UI组件
│   │   ├── DialogUI.ts             # 对话UI (S3)
│   │   ├── InquiryUI.ts            # 问诊UI (S4)
│   │   ├── CasesListUI.ts          # 病案列表 (S5)
│   │   ├── PulseUI.ts              # 脉诊UI (S6a)
│   │   ├── TongueUI.ts             # 舌诊UI (S6b)
│   │   ├── SyndromeUI.ts           # 辨证UI (S6c)
│   │   ├── PrescriptionUI.ts       # 选方UI (S6d)
│   │   ├── ResultUI.ts             # 结果UI (S6e)
│   │   ├── NPCFeedbackUI.ts        # NPC反馈 (S6e)
│   │   ├── SaveUI.ts               # 存档UI (S7)
│   │   ├── InventoryUI.ts          # 背包UI (S8)
│   │   ├── DecoctionUI.ts          # 煎药UI (S9)
│   │   ├── ProcessingUI.ts         # 炮制UI (S10)
│   │   ├── PlantingUI.ts           # 种植UI (S11)
│   │   ├── ExperienceUI.ts         # 经验值UI (S12)
│   │   └── TutorialUI.ts           # 新手引导UI (S13)
│   │
│   └── utils/
│       ├── GameLogger.ts           # 游戏日志收集器
│       ├── GameStateBridge.ts      # 状态桥接
│       └── sseClient.ts            # SSE客户端 (S1)
│
├── tests/
│   ├── unit/                       # 单元测试 (337个)
│   ├── integration/                # 集成测试 (28个)
│   ├── e2e/                        # E2E测试 (129个)
│   └── visual/                     # AI端到端测试
│
├── public/assets/                  # 游戏素材
│   ├── town_outdoor/               # 室外场景
│   ├── indoor/                     # 室内场景
│   └── sprites/                    # 角色精灵图
│
└── scripts/visual_acceptance/      # 视觉验收系统
```

---

## 开发核心原则

> **重要**: 以下原则贯穿整个开发过程，必须严格遵守

### 测试设计规范
- 正向测试+反向测试配对设计
- 代码路径分析覆盖所有分支
- 分层采样覆盖边界、角落、特殊点
- 状态生命周期验证（创建→更新→销毁）

### AI E2E 自动化测试规范
- 所有视觉素材和游戏页面必须经过AI自动化测试验证
- 置信度≥80%方可向用户确认
- 使用 `webapp-testing` 技能进行端到端测试

### 问题修复原则
- 使用 `/systematic-debugging` 先定位问题根本原因
- 每个测试问题修复必须记录（模板见PROGRESS.md）
- Playwright测试需单线程执行（workers: 1）

### 工作区整洁原则
- 每一步执行前检查废弃文档，主动清理
- 方案变更后删除旧文档和代码
- 提交前确保git status干净

### LLM模型配置
- 所有LLM模型配置都在.env文件中，禁止硬编码API密钥

---

## 测试覆盖

| 类型 | 工具 | 数量 | 状态 |
|-----|------|------|------|
| 单元测试 | Vitest | 337 | ✅ |
| 集成测试 | Vitest | 28 | ✅ |
| E2E测试 | Playwright | 129 | ✅ |
| **总计** | - | **861** | ✅ |

---

## 相关文档索引

### 设计文档
- [完整游戏设计](docs/superpowers/specs/2026-04-05-game-design-v3.0.md)
- [视觉设计规范](docs/superpowers/specs/2026-04-05-visual-design-v1.0.md)
- [Phase 2 NPC Agent设计](docs/superpowers/specs/2026-04-12-phase2-npc-agent-design.md)
- [弹窗设计方案规范](docs/superpowers/specs/2026-04-18-modal-design-spec.md)
- [Phase 1验收标准](docs/superpowers/specs/2026-04-05-phase1-acceptance-criteria.md)

### 实现计划
- [Phase 2 实现计划](docs/superpowers/plans/2026-04-12-phase2-implementation-plan.md)
- [Phase 2 退出按钮修复计划](docs/superpowers/plans/2026-04-18-phase2-minigame-exit-button-fix.md)

---

*本文档由 Claude Code 维护，更新于 2026-04-19*