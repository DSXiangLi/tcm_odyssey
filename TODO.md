# 药灵山谷 - 已完成任务详情

**文档职责**: 记录所有已完成阶段的详细功能概述、设计文档链接、实现细节。
**渐进式加载**: CLAUDE.md 仅保留摘要，需要详情时查阅此文档。

---

## Phase 1: 项目框架与核心系统 ✅

**核心功能**:
- Phaser 3 + TypeScript + Vite 项目初始化
- BootScene资源加载、TitleScene标题画面
- TownOutdoorScene主场景 (86×48瓦片地图，916可行走瓦片)
- Player实体类、碰撞检测系统
- 场景切换系统 + ClinicScene/GardenScene/HomeScene室内场景
- 可配置地图系统 (`src/data/map-config.ts`)

**设计文档**: [Phase 1验收标准](docs/superpowers/specs/phase1/2026-04-05-phase1-acceptance-criteria.md)
**实现计划**: [Phase 1实现计划](docs/superpowers/plans/2026-04-05-mvp-phase1-foundation.md)

---

## Phase 1.5: 游戏世界视觉呈现 ✅

**核心功能**:
- 视觉设计规范制定 (田园治愈+中医文化+神秘探索)
- AI生成流程搭建 (小镇外景全景图、黑白遮罩层)
- 遮罩层自动映射 (可行走区域识别)
- 室内场景素材适配
- AI端到端测试覆盖 (布局、移动、碰撞、场景切换)

**成果**: 86×48瓦片地图，门位置(药园15,8/诊所60,8/家61,35)，玩家出生点(47,24)

**设计文档**: [视觉设计规范](docs/superpowers/specs/phase1-5/2026-04-05-visual-design-v1.0.md)
**实现计划**: [Phase 1.5视觉实现计划](docs/superpowers/plans/2026-04-05-phase1.5-visual-implementation.md)

---

## Phase 2: NPC Agent系统 ✅ (S1-S13)

| 步骤 | 功能模块 | 核心文件 | 测试数 |
|-----|---------|---------|-------|
| **S1** | Hermes基础设施 | HermesManager, SSEClient, GameAdapter | 31 |
| **S2** | 数据结构定义 | NPC文件(SOUL/MEMORY/USER/SYLLABUS/TASKS), 病案, 病人模板 | 11 |
| **S3** | NPC对话基础 | DialogUI, StreamingText, NPCInteraction | - |
| **S4** | 问诊重构 | ClueTracker, InquiryUI, InquiryScene, PatientDialogGenerator | 15 |
| **S5** | 病案系统 | CaseManager, CasesListUI, CaseDetailUI, blocked_by解锁 | 11 |
| **S6** | 诊治游戏 | PulseScene→TongueScene→DiagnosisPrescriptionScene→ResultUI | 42 |
| **S7** | 存档系统 | SaveManager, SaveUI, 自动存档, 多槽位管理 | 8 |
| **S8** | 背包系统 | InventoryManager, InventoryUI, 药材/种子/工具/知识管理 | 81 |
| **S9** | 煎药系统 | DecoctionManager, DecoctionUI, 火候/顺序/配伍评分 | 102 |
| **S10** | 炮制系统 | ProcessingManager, ProcessingUI, 方法/辅料匹配评分 | 276 |
| **S11** | 种植系统 | PlantingManager, PlantingUI, 种子/地块/水源/肥料匹配 | 61 |
| **S12** | 经验值框架 | ExperienceManager, ExperienceUI, 来源追踪/解锁阈值 | 70 |
| **S13** | 新手引导系统 | TutorialManager, TutorialUI, 集中引导/场景提示 | 49 |

**设计文档**: [Phase 2 NPC Agent系统完整设计](docs/superpowers/specs/phase2/2026-04-12-phase2-npc-agent-design.md)
**实现计划**: [Phase 2实现计划（13步拆分）](docs/superpowers/plans/2026-04-12-phase2-implementation-plan.md)
**测试验收**: [Phase 2测试验收标准](docs/superpowers/specs/phase2/2026-04-11-phase2-test-acceptance.md)

---

## Phase 2.5: UI组件系统统一化 ✅

**核心组件库**:
| 组件 | 用途 | 状态 |
|-----|------|------|
| BaseUIComponent | 抽象基类，边框绘制方法 | ✅ |
| ModalUI | 弹窗基类，标准尺寸、退出按钮 | ✅ |
| ScrollModalUI | 卷轴风格弹窗基类（继承ModalUI） | ✅ |
| PixelSpriteComponent | 像素图标绘制组件（grid/palette驱动） | ✅ |
| HerbTagComponent | 药牌展示组件（绳+牌+图标+名+属性+数量） | ✅ |
| UIBorderStyles | 7种边框方案定义 | ✅ |
| ItemSlotComponent | 60×60物品格子 | ✅ |
| SelectionButtonComponent | ○→●符号切换选择按钮 | ✅ |
| CompatibilitySlotComponent | 120×100配伍槽位 | ✅ |
| ProgressBarComponent | 三段渐变进度条 | ✅ |

**系统管理器**:
| 系统 | 用途 | 状态 |
|-----|------|------|
| DecoctionManager | 煎药管理 | ✅ |
| ProcessingManager | 炮制管理 | ✅ |
| DragEffectManager | 拖拽动效系统（轨迹+溅射+爆发） | ✅ |

**场景关联修复 (2026-04-21)**:
- 煎药(D) → 应在诊所 ✅
- 炮制(P) → 应在药园 ✅
- 种植(G) → 应在药园 ✅

---

## Phase 2.5: 煎药小游戏 HTML 直接迁移 ✅ (2026-04-27)

**创建文件 (7个)**:
| 文件 | 行数 | 功能 |
|------|------|------|
| `src/styles/decoction.css` | 1072 | 完整CSS样式(11种动画keyframes) |
| `src/data/decoction-pixel-herbs.ts` | 69 | 像素药材数据(22种) + pixelSprite函数 |
| `src/ui/components/ScrollModal.tsx` | 34 | 卷轴框架(roller/paper/seal) |
| `src/ui/components/StoveScene.tsx` | 91 | 炉灶场景(stove/fire/flames/embers) |
| `src/ui/components/PotArea.tsx` | 41 | 药罐区域(pot/liquid/steam) |
| `src/ui/components/HerbGrid.tsx` | 124 | 药材网格(bag-header/grid/HerbTag) |
| `src/ui/components/VialsShelf.tsx` | 56 | 药瓶陈列(brew-btn/vials/Vial) |

**核心成果**:
- CSS完整迁移 - 保留设计稿1200×760尺寸 + 3区域Grid布局
- 像素药材数据 - 22种药材grid/palette定义
- React组件化 - 7个核心组件TSX化
- 动效系统 - 11种CSS动画(flicker/flameDance/steamRise等)

**设计文档**: [煎药直接迁移设计](docs/superpowers/specs/phase2-5/2026-04-26-decoction-direct-migration-design.md)
**实现计划**: [煎药直接迁移计划](docs/superpowers/plans/phase2-5/2026-04-26-decoction-direct-migration-plan.md)

---

## Phase 2.5: 诊断游戏 HTML 直接迁移 ✅ (2026-04-29)

**创建文件 (9个)**:
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

**核心成果**:
- 5阶段诊断流程: 舌诊→脉诊→问诊→辨证→选方
- 10个病案: 湿阻中焦、风寒感冒、风热感冒、咳嗽等
- CustomEvent桥接实现React↔Phaser双向通信
- 废弃旧场景标记: InquiryScene/PulseScene/TongueScene/SyndromeScene/PrescriptionScene

**设计文档**: [诊断HTML迁移设计](docs/superpowers/specs/phase2-5/2026-04-28-diagnosis-html-migration-design.md)
**实现计划**: [诊断HTML迁移计划](docs/superpowers/plans/phase2-5/2026-04-28-diagnosis-html-migration-plan.md)

---

## Phase 2.5: NPC AI验收系统 ✅ (2026-05-01)

**核心成果**:
- LLM评估器集成（Qwen模型）
- 报告生成系统
- 19个E2E测试场景覆盖

---

## 视觉验收自动化系统 ✅

**核心功能**:
- 截图控制器 (Playwright启动游戏，模拟玩家操作)
- AI评估服务 (Qwen VL多模态模型分析视觉质量)
- 修改执行器 (解析建议，修改UI代码)
- 流程协调器 (评估→修改→验证→再评估循环)

**评估维度**: 中医风格15%、AI对话适配15%、UI布局15%、配色一致性10%、文字可读10%、场景氛围15%、Sprite动画5%、整体体验15%

**设计文档**: [Phase2 视觉验收自动化系统设计](docs/superpowers/specs/phase2/2026-04-15-phase2-visual-acceptance-design.md)
**实现计划**: [Phase2 视觉验收自动化系统实现计划](docs/superpowers/plans/2026-04-15-phase2-visual-acceptance-implementation.md)

---

## UI配色协调优化 (Round 1-4) ✅

**配色系统** (`src/data/ui-color-theme.ts`):
| 艅系 | 颜色值 | 用途 |
|-----|-------|------|
| 暗绿系 | #80a040 | 主色调（按钮、边框） |
| 暗蓝系 | #4080a0 | 信息、链接 |
| 灰蓝系 | #408080 | 诊所背景 |
| 暗棕系 | #604020 | 边框、装饰 |
| 柔和色系 | #90c070~#c07070 | 7种柔和色 |

**弹窗设计规范 (Round 4)**:
| 层级 | 边框颜色 | 透明度 | 适用场景 |
|-----|---------|--------|---------|
| 底层弹窗 | 绿色(#80a040) | 0.85-1.0 | 主面板 |
| 顶层弹窗 | 金棕(#c0a080) | 1.0 | 确认弹窗 |

**设计文档**: [弹窗设计方案规范](docs/superpowers/specs/phase2/ui-optimization/2026-04-18-modal-design-spec.md)

---

## 小游戏设计详情

### 生产类小游戏

**煎药游戏** ✅ - [设计文档](docs/superpowers/specs/phase2-5/minigames/2026-04-19-decoction-minigame-design.md)
- 左侧动画区: 煎药炉灶动画(240×300)
- 右侧背包区: 方剂组成提示 + 背包药材列表 + 火候选择
- 评分维度: 组成50% + 火候30% + 时间20%

**炮制游戏** ✅ - [设计文档](docs/superpowers/specs/phase2-5/minigames/2026-04-19-processing-minigame-design.md)
- 左侧动画区: 炮制灶台动画(240×300)
- 右侧背包区: 药材列表 + 炮制方法选择 + 辅料选择
- 评分维度: 方法40% + 辅料40% + 时间20%

**种植游戏** ⏳ - [设计文档](docs/superpowers/specs/phase2-5/minigames/2026-04-19-planting-minigame-design.md)
- 核心简化: 去掉归经地块限制
- 考题系统: 收获时随机弹出考题，答对才能收获
- 考题类型: 性味/归经/功效/主治/配伍禁忌(5种题型)

### 诊断类小游戏

**脉诊游戏** - [设计文档](docs/superpowers/specs/phase2-5/minigames/2026-04-19-pulse-minigame-design.md)
- 脉位选项: 7种（浮/沉/迟/数/虚/实/平脉）
- 脉势选项: 7种（紧/缓/滑/涩/弦/濡/不明显）

**舌诊游戏** - [设计文档](docs/superpowers/specs/phase2-5/minigames/2026-04-19-tongue-minigame-design.md)
- UI形式: 文字选项 + 舌象图片预留slot
- 补充说明: 文字输入框记录个性化舌象观察

**辨证选方游戏** - [设计文档](docs/superpowers/specs/phase2-5/minigames/2026-04-21-diagnosis-prescription-minigame-design.md)
- 步骤流程: ①选择证型 → ②选择方剂 → ③确认
- 评分维度: 证型40% + 方剂40% + 论述20%(高级)

---

## AI生图需求汇总

| 素材 | 尺寸 | 用途 | 来源 |
|-----|-----|------|------|
| 煎药炉灶动画 | 240×300 | 煎药左侧主场景 | AI生图 |
| 炮制灶台动画 | 240×300 | 炮制左侧主场景 | AI生图 |
| 原始药材图 | 60×60 | 各药材原形态 | AI生图 |
| 饮片图 | 60×60 | 各药材炮制后形态 | AI生图 |
| 辅料图标 | 60×60 | 蜂蜜/黄酒/米醋/盐水 | AI生图 |
| 水壶图标 | 60×60 | 种植工具 | AI生图 |
| 肥料袋图标 | 60×60 | 5种肥料袋 | AI生图 |
| 舌象图片 | 200×150 | 舌诊展示 | 用户收集 |

---

## 标准弹窗尺寸

| 类型 | 尺寸 | 适用 |
|-----|------|------|
| DIAGNOSIS_MODAL | 720×480 | 脉诊/舌诊/辨证选方 |
| MINIGAME_MODAL | 800×600 | 煎药/炮制/种植 |
| INQUIRY_MODAL | 640×420 | 问诊 |
| FULLSCREEN_MODAL | 1024×768 | 背包/存档 |

---

*本文档由 Claude Code 维护，更新于 2026-05-01*