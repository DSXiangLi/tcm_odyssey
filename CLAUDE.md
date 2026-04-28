# 药灵山谷 (Yaoling Shangu) - 项目文档

**版本**: v3.4 - Phase 2.5 煎药小游戏 HTML 直接迁移完成 + AI验收通过
**最后更新**: 2026-04-28
**技术栈**: Phaser 3 + TypeScript + Vite + Hermes-Agent


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


## 当前进度摘要

> **当前任务**: [PROGRESS.md](./PROGRESS.md) - 仅记录进行中的任务

| 阶段 | 状态     | 说明                               |
|-----|--------|----------------------------------|
| Phase 1 | ✅ 完成   | 项目框架与核心系统                        |
| Phase 1.5 | ✅ 完成   | 游戏世界视觉呈现                         |
| Phase 2 | ✅ 完成   | NPC Agent系统 (S1-S13全部完成，861测试通过) |
| 视觉验收 | ✅ 完成   | 自动化系统实现                          |
| Round 1-2 UI配色 | ✅ 完成   | 配色协调优化                           |
| Round 4 弹窗设计 | ✅ 完成   | 现代弹窗设计方案                         |
| Round 3 视觉优化 | ✅ 完成   | 柔和色系扩展，AI评估由人工验收替代              |
| Phase 2 退出按钮 | ✅ 完成   | 所有UI继承ModalUI基类                  |
| Phase 2.5 基础设施 | ✅ 完成   | 基类架构、边框规范、3个基础组件、UI继承ModalUI    |
| 小游戏设计优化 | ✅ 完成   | 种植考题/脉诊正常脉象/舌诊补充说明/辨证选方合并 |
| **Phase 2.5 煎药/炮制** | ✅ 完成   | 统一场景布局、E2E测试、场景关联修复            |
| **Phase 2.5 煎药UI重构** | ✅ 完成 | 卷轴风格UI、药牌组件、拖拽动效、像素药材数据 |
| **Phase 2.5 煎药HTML直接迁移** | ✅ 完成+验收 | 直接使用设计稿HTML + AI验收86.5分 (2026-04-28) |
| **Phase 2.5 诊断HTML直接迁移** | ⏳ 进行中 | 直接使用设计稿HTML + 10病案 + Phaser桥接 (2026-04-28) |
| **Phase 2.5 种植/选方** | ⏳ 待开发 | 种植小游戏已入口，选方合并入诊断游戏 |
| **全局背包系统** | ✅ 完成 | 背包支持任意场景B键打开，详见[设计文档](docs/superpowers/specs/phase2-5/2026-04-21-global-inventory-design.md) |

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

**设计文档**: [Phase 1验收标准](docs/superpowers/specs/phase1/2026-04-05-phase1-acceptance-criteria.md)
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

**设计文档**: [视觉设计规范](docs/superpowers/specs/phase1-5/2026-04-05-visual-design-v1.0.md)
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

### Phase 2.5: UI组件系统统一化 ✅

**核心目标**: 统一所有UI组件的尺寸、边框、退出机制，创建BaseUIComponent架构，实现游戏化交互设计。

**核心组件库**:
| 组件 | 用途 | 状态 |
|-----|------|------|
| BaseUIComponent | 抽象基类，边框绘制方法 | ✅ |
| ModalUI | 弹窗基类，标准尺寸、退出按钮 | ✅ |
| **ScrollModalUI** | **卷轴风格弹窗基类（继承ModalUI）** | ✅ 新增 |
| **PixelSpriteComponent** | **像素图标绘制组件（grid/palette驱动）** | ✅ 新增 |
| **HerbTagComponent** | **药牌展示组件（绳+牌+图标+名+属性+数量）** | ✅ 新增 |
| UIBorderStyles | 7种边框方案定义 | ✅ |
| ItemSlotComponent | 60×60物品格子，Neumorphism边框 | ✅ |
| SelectionButtonComponent | ○→●符号切换选择按钮 | ✅ |
| CompatibilitySlotComponent | 120×100配伍槽位，角色色系 | ✅ |
| ProgressBarComponent | 三段渐变进度条 | ✅ |
| 15个UI组件继承ModalUI | 退出按钮统一 | ✅ |

**系统管理器**:
| 系统 | 用途 | 状态 |
|-----|------|------|
| DecoctionManager | 煎药管理 | ✅ |
| ProcessingManager | 炮制管理 | ✅ |
| **DragEffectManager** | **拖拽动效系统（轨迹+溅射+爆发）** | ✅ 新增 |

**数据文件**:
| 文件 | 用途 |
|-----|------|
| `src/data/pixel-herbs.ts` | 像素药材数据（22种药材） |

**场景关联修复 (2026-04-21)**:
- 煎药(D) → 应在诊所 ✅
- 炮制(P) → 应在药园 ✅ (从诊所移除，添加到药园)
- 种植(G) → 应在药园 ✅

---

### Phase 2.5: 煎药小游戏 HTML 直接迁移 ✅ (2026-04-27)

**核心原则**: 直接使用设计稿HTML，不做拆分重构，完整保留视觉元素布局。

**设计文档**: [v2.0直接迁移方案](docs/superpowers/specs/phase2-5/2026-04-26-decoction-direct-migration-design.md)
**实现计划**: [v2.0实现计划](docs/superpowers/plans/phase2-5/2026-04-26-decoction-direct-migration-plan.md)

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
- 像素药材数据 - 22种药材grid/palette定义，pixelSprite渲染函数
- React组件化 - 7个核心组件TSX化，状态管理简化
- 动效系统 - 11种CSS动画(flicker/flameDance/steamRise等)

**CSS动画列表 (11种)**:

| 动画名 | 用途 | 时长 |
|--------|------|------|
| `flicker` | 背景光效 | 4s |
| `flameDance` | 火焰舞动 | 0.9s |
| `emberRise` | 火星上升 | 1.6s |
| `stir` | 搅拌勺摆动 | 2.4s |
| `steamRise` | 蒸汽上升 | 3.2s |
| `scrollBob` | 卷轴悬浮 | 3.8s |
| `goldPulse` | 金色脉冲 | 2.5s |
| `stampIn` | 印章盖入 | 0.8s |
| `crossShake` | 错误抖动 | 0.5s |
| `potCheer/potAngry` | 药罐反馈 | 0.5-0.6s |
| `splashFly` | 水花溅射 | 0.9s |

---

#### 一、生产类小游戏

**煎药游戏** ✅ (设计文档: [煎药设计](docs/superpowers/specs/phase2-5/minigames/2026-04-19-decoction-minigame-design.md)):
| 功能 | 描述 |
|-----|------|
| 左侧动画区 | 煎药炉灶动画(240×300) + 已选药材展示 |
| 右侧背包区 | 方剂组成提示 + 背包药材列表 + 火候选择(武火/文火) |
| 评分维度 | 组成50% + 火候30% + 时间20% |
| 设计亮点 | 去掉君臣佐使分类，简化为直观的药材选择流程 |
| 开发计划 | [煎药开发计划](docs/superpowers/plans/2026-04-20-decoction-minigame-implementation.md) |

**炮制游戏** ✅ (设计文档: [炮制设计](docs/superpowers/specs/phase2-5/minigames/2026-04-19-processing-minigame-design.md)):
| 功能 | 描述 |
|-----|------|
| 左侧动画区 | 炮制灶台动画(240×300) + 药材变换展示(原始→动效→饮片) |
| 右侧背包区 | 药材列表 + 炮制方法选择(炙类/炒类等) + 辅料选择(蜂蜜/黄酒等) |
| 评分维度 | 方法40% + 辅料40% + 时间20% |
| 设计亮点 | 简化动画为原始药材→闪烁动效→饮片三阶段 |
| 开发计划 | [炮制开发计划](docs/superpowers/plans/2026-04-20-processing-minigame-implementation.md) |

**种植游戏** ⏳ (设计文档: [种植设计](docs/superpowers/specs/phase2-5/minigames/2026-04-19-planting-minigame-design.md)):
| 功能 | 描述 |
|-----|------|
| 核心简化 | 去掉归经地块限制，种子可种植任意空闲地块 |
| 工具设计 | 水壶(工具，不消耗) + 5种肥料袋(消耗品，各有数量) |
| 评分维度 | 水源50% + 肥料50% |
| **考题系统** | **收获时随机弹出考题，答对才能收获** |
| 考题类型 | 性味/归经/功效/主治/配伍禁忌(5种题型) |
| 奖励机制 | 尝试次数→经验值倍率(1.5×/1.0×/0.5×) |
| 开发计划 | [种植开发计划](docs/superpowers/plans/2026-04-20-planting-minigame-implementation.md) |

---

#### 二、诊断类小游戏

**脉诊游戏** (设计文档: [脉诊设计](docs/superpowers/specs/phase2-5/minigames/2026-04-19-pulse-minigame-design.md)):
| 功能 | 描述 |
|-----|------|
| UI形式 | 文字选项(保持简单设计) |
| 脉位选项 | 7种：浮/沉/迟/数/虚/实/**平脉(正常)** ← 新增 |
| 脉势选项 | 7种：紧/缓/滑/涩/弦/濡/**不明显** ← 新增 |
| 开发计划 | [脉诊开发计划](docs/superpowers/plans/2026-04-20-pulse-minigame-implementation.md) |

**舌诊游戏** (设计文档: [舌诊设计](docs/superpowers/specs/phase2-5/minigames/2026-04-19-tongue-minigame-design.md)):
| 功能 | 描述 |
|-----|------|
| UI形式 | 文字选项 + 舌象图片预留slot |
| **独立设计** | **移除脉诊参考显示，舌诊与脉诊独立** |
| **补充说明** | **增加文字输入框，记录个性化舌象观察** |
| 图片来源 | 用户收集，无需AI生图，存放于 `public/assets/tongue/` |
| 开发计划 | [舌诊开发计划](docs/superpowers/plans/2026-04-20-tongue-minigame-implementation.md) |

**辨证选方游戏** (设计文档: [辨证选方设计](docs/superpowers/specs/phase2-5/minigames/2026-04-21-diagnosis-prescription-minigame-design.md)):
| 功能 | 描述 |
|-----|------|
| **合并原因** | **辨证+选方交互简单，合并为两步决策流程** |
| 步骤流程 | ①选择证型 → ②选择方剂 → ③确认 |
| 诊断信息汇总 | 症状+脉象+舌象+补充说明统一展示 |
| 论述分析 | 高级难度可选填写论述，AI关键词评分 |
| 方剂详情 | 点击"查看详情"弹出方剂组成/功效弹窗 |
| 评分维度 | 证型40% + 方剂40% + 论述20%(高级) |
| 开发计划 | [辨证选方开发计划](docs/superpowers/plans/2026-04-21-diagnosis-prescription-minigame-implementation.md) |

> **废弃文档**: 辨证设计、选方设计已合并为辨证选方，旧文档已标注废弃。

---

#### 三、AI生图需求汇总

| 素材 | 尺寸 | 用途 | 来源 |
|-----|-----|------|------|
| 煎药炉灶动画 | 240×300 | 煎药左侧主场景 | AI生图 |
| 炮制灶台动画 | 240×300 | 炮制左侧主场景 | AI生图 |
| 原始药材图 | 60×60 | 各药材原形态 | AI生图 |
| 饮片图 | 60×60 | 各药材炮制后形态 | AI生图 |
| 辅料图标 | 60×60 | 蜂蜜/黄酒/米醋/盐水 | AI生图 |
| 水壶图标 | 60×60 | 种植工具 | AI生图 |
| 肥料袋图标 | 60×60 | 5种肥料袋 | AI生图 |
| **舌象图片** | **200×150** | **舌诊展示** | **用户收集** |

---

#### 四、标准弹窗尺寸

| 类型 | 尺寸 | 适用 |
|-----|------|------|
| DIAGNOSIS_MODAL | 720×480 | 脉诊/舌诊/辨证选方 |
| MINIGAME_MODAL | 800×600 | 煎药/炮制/种植 |
| INQUIRY_MODAL | 640×420 | 问诊 |
| FULLSCREEN_MODAL | 1024×768 | 背包/存档 |

**测试覆盖**: 820个单元/集成测试全部通过（基础设施部分）

---

### 视觉验收自动化系统 ✅

**核心功能**:
- 截图控制器 (Playwright启动游戏，模拟玩家操作)
- AI评估服务 (Qwen VL多模态模型分析视觉质量)
- 修改执行器 (解析建议，修改UI代码)
- 流程协调器 (评估→修改→验证→再评估循环)

**评估维度**: 中医风格15%、AI对话适配15%、UI布局15%、配色一致性10%、文字可读10%、场景氛围15%、Sprite动画5%、整体体验15%

**设计文档**: [Phase2 视觉验收自动化系统设计](docs/superpowers/specs/phase2/2026-04-15-phase2-visual-acceptance-design.md)
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

**设计文档**: [弹窗设计方案规范](docs/superpowers/specs/phase2/ui-optimization/2026-04-18-modal-design-spec.md)
**HTML预览**: [弹窗设计HTML Demo](docs/design/modal-design-demo-v2.html)

---

## 开发顺序

**Phase 1** → **Phase 1.5 (视觉)** → **Phase 2 (NPC Agent)** → **Phase 3 (学习)** → **Phase 4 (探索)**

---

## 项目架构

```
zhongyi_game_v3/
├── docs/superpowers/
│   ├── specs/                      # 设计规范文档
│   │   ├── 2026-04-05-game-design-v3.0.md  # 总体游戏设计
│   │   ├── phase1/                 # Phase 1 相关
│   │   ├── phase1-5/               # Phase 1.5 视觉相关
│   │   ├── phase2/                 # Phase 2 主线
│   │   │   └── ui-optimization/    # UI配色优化支线
│   │   ├── phase2-5/               # Phase 2.5 主线
│   │   │   └── minigames/          # 小游戏设计
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
│   │   ├── **pixel-herbs.ts**      # **像素药材数据（22种药材）**
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
│   │   ├── SyndromeScene.ts        # 辨证场景 (S6c) ← 待废弃，合并到DiagnosisPrescription
│   │   ├── PrescriptionScene.ts    # 选方场景 (S6d) ← 待废弃，合并到DiagnosisPrescription
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
│   │   ├── **DragEffectManager.ts** # **拖拽动效系统**
│   │   ├── ProcessingManager.ts    # 炮制管理 (S10)
│   │   ├── PlantingManager.ts      # 种植管理 (S11)
│   │   ├── ExperienceManager.ts    # 经验值管理 (S12)
│   │   └── TutorialManager.ts      # 新手引导管理 (S13)
│   │
│   ├── ui/                         # UI组件
│   │   ├── **base/**               # **UI基类目录**
│   │   │   ├── BaseUIComponent.ts  # 抽象基类
│   │   │   ├── ModalUI.ts          # 弹窗基类
│   │   │   ├── **ScrollModalUI.ts** # **卷轴风格弹窗基类**
│   │   │   └── UIBorderStyles.ts   # 边框样式定义
│   │   ├── **components/**         # **UI组件目录**
│   │   │   ├── **PixelSpriteComponent.ts** # **像素图标绘制**
│   │   │   ├── **HerbTagComponent.ts** # **药牌展示组件**
│   │   │   ├── ItemSlotComponent.ts # 60×60物品格子
│   │   │   ├── SelectionButtonComponent.ts # 选择按钮
│   │   │   ├── CompatibilitySlotComponent.ts # 配伍槽位
│   │   │   └── ProgressBarComponent.ts # 进度条
│   │   ├── DialogUI.ts             # 对话UI (S3)
│   │   ├── InquiryUI.ts            # 问诊UI (S4)
│   │   ├── CasesListUI.ts          # 病案列表 (S5)
│   │   ├── PulseUI.ts              # 脉诊UI (S6a)
│   │   ├── TongueUI.ts             # 舌诊UI (S6b)
│   │   ├── SyndromeUI.ts           # 辨证UI (S6c) ← 待废弃
│   │   ├── PrescriptionUI.ts       # 选方UI (S6d) ← 待废弃
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

### 文档目录结构规范

**使用 brainstorming 写设计文档时** 和 **使用 writing-plans 写规划文档时**，必须按所属阶段放入对应子目录：

```
docs/superpowers/
├── specs/                              # 设计规范文档（按阶段组织）
│   ├── 2026-04-05-game-design-v3.0.md  # 总体设计（顶级）
│   │
│   ├── phase1/                         # Phase 1 主线
│   ├── phase1-5/                       # Phase 1.5 视觉主线
│   │
│   ├── phase2/                         # Phase 2 主线
│   │   └── ui-optimization/            # UI配色优化支线
│   │
│   ├── phase2-5/                       # Phase 2.5 主线
│   │   └── minigames/                  # 小游戏设计支线
│   │
│   ├── phase3/                         # Phase 3 主线（待创建）
│   └── phase4/                         # Phase 4 主线（待创建）
│
└── plans/                              # 实现计划文档（与specs结构对应）
    ├── phase1/
    ├── phase1-5/
    ├── phase2/
    │   └── ui-optimization/
    ├── phase2-5/
    │   └── minigames/
    ├── phase3/
    └── phase4/
```

**命名规则**:
- 主线文档：`docs/superpowers/specs/phase{n}/YYYY-MM-DD-xxx-design.md`
- 支线文档：`docs/superpowers/specs/phase{n}/subtopic/YYYY-MM-DD-xxx-design.md`
- 规划文档同理：`docs/superpowers/plans/phase{n}/YYYY-MM-DD-xxx-plan.md`

**新增阶段时**:
- 创建对应 `phase{n}/` 目录
- 若有支线任务，创建子目录（如 `ui-optimization/`、`minigames/`）

### 进度文档维护规则

**文档职责划分**:
- **CLAUDE.md**: 已完成阶段的**功能概述**（简洁摘要，便于快速了解项目状态）
- **PROGRESS.md**: 仅记录**当前正在进行的任务**（进行中状态、待执行事项）

**维护流程**:
1. 阶段完成后，将 PROGRESS.md 中的详细内容迁移到 CLAUDE.md 作为功能概述
2. PROGRESS.md 仅保留当前进行中的任务
3. 无进行中任务时，PROGRESS.md 显示"暂无进行中任务"

### 测试设计规范
- 正向测试+反向测试配对设计
- 代码路径分析覆盖所有分支
- 分层采样覆盖边界、角落、特殊点
- 状态生命周期验证（创建→更新→销毁）

### AI E2E 自动化测试规范
- 所有视觉素材和游戏页面必须经过AI自动化测试验证
- 置信度≥80%方可向用户确认
- 使用 `webapp-testing` 技能进行端到端测试

### 真实测试原则（禁止 Mock）
> **重要**: 所有测试必须使用真实数据源，禁止使用 Mock/硬编码假数据

**核心原则**:
- ❌ **禁止 Mock**: 禁止硬编码预设响应、禁止模拟假数据、禁止绕过真实流程
- ✅ **必须真实**: 必须调用真实 API、必须使用真实数据源、必须验证真实行为

**Mock vs 真实测试对比**:

| 类型 | Mock 测试 | 真实测试 |
|-----|----------|---------|
| 数据来源 | 硬编码假数据 | 真实 API/数据库 |
| 测试内容 | 评估"假设响应" | 评估实际行为 |
| 测试目的 | 自欺欺人 | 发现真实问题 |

**为什么禁止 Mock**:
1. Mock 测试评估的是自己写的假响应，不是系统真实输出
2. Mock 测试通过不代表真实系统正确
3. Mock 测试隐藏真实问题，导致生产环境故障
4. Mock 测试是"假通过"，不是"真验收"

**测试必须做到**:
- NPC 对话测试 → 必须调用真实 LLM API
- 游戏功能测试 → 必须启动真实游戏进程
- 数据库测试 → 必须连接真实数据库
- API 测试 → 必须调用真实后端服务

**唯一允许 Mock 的场景**:
- 单元测试中的依赖注入（如 Mock Logger）
- 开发阶段的临时验证（必须标注"临时Mock"并在上线前替换）

**违规后果**:
- Mock 测试通过但真实测试失败 → 需要重新进行真实测试
- 提交 Mock 测试报告 → 报告无效，需重做

### 问题修复原则
- 使用 `/systematic-debugging` 先定位问题根本原因
- 每个测试问题修复必须记录（模板见PROGRESS.md）
- Playwright测试需单线程执行（workers: 1）

### 工作区整洁原则
- 每一步执行前检查废弃设计文档、规划文档、临时测试脚本，主动清理
- 方案变更后删除旧文档和代码
- 提交前确保git status干净

### LLM模型配置
- 所有LLM模型配置都在.env文件中，禁止硬编码API密钥

---

---

## 相关文档索引

### 设计文档
- [完整游戏设计](docs/superpowers/specs/2026-04-05-game-design-v3.0.md)
- [视觉设计规范](docs/superpowers/specs/phase1-5/2026-04-05-visual-design-v1.0.md)
- [Phase 2 NPC Agent设计](docs/superpowers/specs/phase2/2026-04-12-phase2-npc-agent-design.md)
- [弹窗设计方案规范](docs/superpowers/specs/phase2/ui-optimization/2026-04-18-modal-design-spec.md)
- [Phase 1验收标准](docs/superpowers/specs/phase1/2026-04-05-phase1-acceptance-criteria.md)

### 小游戏设计文档
| 游戏 | 设计文档 | 开发计划 |
|-----|---------|---------|
| 煎药 | [煎药设计](docs/superpowers/specs/phase2-5/minigames/2026-04-19-decoction-minigame-design.md) | [煎药计划](docs/superpowers/plans/2026-04-20-decoction-minigame-implementation.md) |
| 炮制 | [炮制设计](docs/superpowers/specs/phase2-5/minigames/2026-04-19-processing-minigame-design.md) | [炮制计划](docs/superpowers/plans/2026-04-20-processing-minigame-implementation.md) |
| 种植 | [种植设计](docs/superpowers/specs/phase2-5/minigames/2026-04-19-planting-minigame-design.md) | [种植计划](docs/superpowers/plans/2026-04-20-planting-minigame-implementation.md) |
| 脉诊 | [脉诊设计](docs/superpowers/specs/phase2-5/minigames/2026-04-19-pulse-minigame-design.md) | [脉诊计划](docs/superpowers/plans/2026-04-20-pulse-minigame-implementation.md) |
| 舌诊 | [舌诊设计](docs/superpowers/specs/phase2-5/minigames/2026-04-19-tongue-minigame-design.md) | [舌诊计划](docs/superpowers/plans/2026-04-20-tongue-minigame-implementation.md) |
| **辨证选方** | [辨证选方设计](docs/superpowers/specs/phase2-5/minigames/2026-04-21-diagnosis-prescription-minigame-design.md) | [辨证选方计划](docs/superpowers/plans/2026-04-21-diagnosis-prescription-minigame-implementation.md) |

> **废弃文档**: 辨证设计、选方设计已合并为辨证选方，旧文档已标注废弃。

### 实现计划
- [Phase 2 实现计划](docs/superpowers/plans/2026-04-12-phase2-implementation-plan.md)
- [Phase 2 退出按钮修复计划](docs/superpowers/plans/2026-04-18-phase2-minigame-exit-button-fix.md)

---

*本文档由 Claude Code 维护，更新于 2026-04-27*