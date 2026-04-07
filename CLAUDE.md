# 药灵山谷 (Yaoling Shangu) - 项目文档

**版本**: v3.0 - Phase 1.5 视觉呈现
**最后更新**: 2026-04-07
**技术栈**: Phaser 3 + TypeScript + Vite

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
- **细节参考**: 《东方夜神月》- 场景精致，细节丰富，元素有层次感
- **像素尺寸**: 32x32经典像素
- **氛围融合**: 田园治愈 + 中医文化 + 神秘探索，自然过渡

---

## 开发进度

### Phase 1: 项目框架与核心系统 ✅ 已完成

| 任务 | 状态 | 描述 |
|------|------|------|
| Task 1 | ✅ | 项目初始化 - Phaser 3 + TypeScript + Vite |
| Task 2 | ✅ | 游戏配置与入口文件 |
| Task 3 | ✅ | 占位瓦片素材 |
| Task 4 | ✅ | BootScene资源加载 |
| Task 5 | ✅ | TownOutdoorScene主场景 (40x30瓦片地图) |
| Task 6 | ✅ | Player实体类 |
| Task 7 | ✅ | 场景切换系统 + ClinicScene |
| Task 8 | ✅ | GardenScene + HomeScene |
| Task 9 | ✅ | 碰撞检测 |
| Task 10 | ✅ | 游戏标题画面 |
| 测试计划 | ✅ | 完整测试套件 |

### Phase 1.5: 游戏世界视觉呈现 ⏳ 进行中

> **开发顺序调整**: 视觉设计在NPC系统之前，让玩家先获得完整的游戏世界体验

| 任务 | 状态 | 描述 |
|------|------|------|
| Task 1.5.1 | ✅ | 视觉设计规范制定 - 已评审确认 |
| Task 1.5.2 | ✅ | 视觉验收标准制定 - 已评审确认 |
| Task 1.5.3 | ✅ | AI生成流程搭建 - 已创建生成脚本 |
| Task 1.5.4 | ✅ | AI vs 手工对比测试 - 已确定混合方案 |
| Task 1.5.5 | ✅ | 小镇外景全景图生成 - `new_town_nanobanana3.jpeg` |
| Task 1.5.6 | ✅ | 黑白遮罩层生成 - `new_town_shadow2.jpeg` |
| Task 1.5.7 | ✅ | 遮罩层自动映射 - 识别完成 ⭐刚完成 |
| Task 1.5.8 | ⏳ | 游戏集成 - 下一步 |
| Task 1.5.9 | ⏳ | 室内场景适配 |
| Task 1.5.10 | ⏳ | 端到端功能验证 |
| Task 1.5.11 | ⏳ | 用户体验验证 |

**🎉 重大进展 (2026-04-07): 黑白遮罩层自动映射完成**

| 成果 | 详情 |
|-----|------|
| 地图尺寸 | 86×48 瓦片 (2752×1536像素) |
| 可行走瓦片 | 916个 (22.2%) |
| 门位置识别 | 药园(15,8)、诊所(60,8)、家(61,35) |
| 交互元素 | 水井(43,24) |
| 路径修正 | 家门路径自动扩展，所有门可达 |

**输出文件位置**: `tests/visual/asset-test/ai-generated/town_new/mask_analysis/`

**Phase 1.5完成标志**: 玩家可以真正"走进完整的游戏世界"，感受田园治愈+中医文化+神秘探索的综合氛围

---

## 失败尝试记录 ⚠️

> **重要**: 以下方案已尝试并失败，避免重复踩坑

### ❌ AI分块识别瓦片坐标

**方案**: 将全景图切割成多个小块（如10×8=80个区域），使用多模态AI逐块识别元素类型。

**失败原因**:
1. **效率低下**: 80个区域需要80次AI API调用
2. **识别不准确**: AI对小块图片识别结果不一致，边界判断模糊
3. **融合困难**: AI生成的素材与背景图融合感差
4. **成本高昂**: 大量API调用，时间和经济成本都很高

**相关文件**: `tile_mapping_v2.py`, `tile_mapping_v3.py`, `tile_mapping_v4.py`

### ❌ Tile-by-Tile逐瓦片识别

**方案**: 将图片切割成32×32像素的瓦片，使用AI识别每个瓦片类型。

**失败原因**:
1. 瓦片数量巨大（86×48=4128个）
2. 单个瓦片信息不足，AI难以判断
3. 边界瓦片识别困难

### ❌ AI直接输出坐标

**方案**: 给AI看带网格标注的图片，让AI直接输出"建筑A在(3,3)位置"。

**失败原因**:
1. 多模态模型坐标能力弱
2. 图片压缩导致坐标偏移
3. 数值输出不稳定

### 正确方向

**「AI画遮罩，脚本算坐标」**: AI负责生成黑白遮罩层标注，自动化脚本负责像素分析和坐标计算。

详见: [黑白遮罩层自动映射设计](docs/superpowers/specs/2026-04-07-mask-to-config-design.md)

### Phase 2: NPC系统 ⏳ 待开发（Phase 1.5之后）

- [ ] NPC系统框架
- [ ] AI对话接口
- [ ] TASK/MEMORY文件管理
- [ ] 青木先生NPC (临床导师)
- [ ] 老张NPC (药物导师)

### Phase 3: 学习系统 ⏳ 待开发

- [ ] 种植系统
- [ ] 炮制系统
- [ ] 药袋系统
- [ ] 方剂学习

---

## 开发顺序调整说明

**原计划顺序**:
Phase 1 → Phase 2 (NPC) → Phase 3 (学习) → Phase 4 (探索)

**调整后顺序**:
Phase 1 → **Phase 1.5 (视觉)** → Phase 2 (NPC) → Phase 3 (学习) → Phase 4 (探索)

**调整理由**:
- 视觉设计是NPC系统的基础，玩家需要先获得完整的游戏世界体验
- 在完整的世界中自由探索后，再开始对话任务等功能
- 让玩家先感受氛围，再进入交互内容

---

## 项目结构

```
zhongyi_game_v3/
├── docs/
│   └── superpowers/
│       ├── specs/
│       │   ├── 2026-04-05-game-design-v3.0.md              # 完整游戏设计文档
│       │   ├── 2026-04-05-visual-design-v1.0.md            # 视觉设计规范
│       │   ├── 2026-04-05-phase1-acceptance-criteria.md    # Phase 1验收标准
│       │   └── 2026-04-05-phase1-ai-e2e-test-design.md     # Phase 1 AI端到端测试设计 ⭐新增
│       └── plans/
│           ├── 2026-04-05-mvp-phase1-foundation.md         # Phase 1实现计划
│           ├── 2026-04-05-phase1-test-plan.md              # 测试计划
│           └── 2026-04-05-phase1.5-visual-implementation.md # Phase 1.5实现计划
├── public/
│   └── assets/
│       ├── maps/              # Tiled地图JSON
│       ├── tiles/
│       │   └── tileset.json   # 瓦片定义
│       ├── sprites/           # 角色精灵图
│       └── generated/         # AI生成素材存放
├── src/
│   ├── main.ts                # 游戏入口
│   ├── config/
│   │   └── game.config.ts     # Phaser配置
│   ├── data/
│   │   ├── constants.ts       # 常量定义
│   │   ├── map-config.ts      # 地图配置（建筑、门、路径坐标）⭐新增
│   │   └── ai-prompts.json    # AI生成Prompt模板
│   ├── scenes/
│   │   ├── TitleScene.ts      # 标题画面
│   │   ├── BootScene.ts       # 资源加载
│   │   ├── TownOutdoorScene.ts # 室外场景
│   │   ├── ClinicScene.ts     # 青木诊所
│   │   ├── GardenScene.ts     # 老张药园
│   │   └── HomeScene.ts       # 玩家之家
│   ├── entities/
│   │   └── Player.ts          # 玩家实体
│   ├── systems/
│   │   ├── SceneManager.ts    # 场景管理器
│   │   └── EventBus.ts        # 事件总线 ⭐新增
│   └── utils/
│       └── GameLogger.ts      # 游戏日志收集器 ⭐新增
├── scripts/
│   └── generate-assets.ts     # AI素材生成脚本
├── tests/
│   ├── unit/                  # 单元测试
│   ├── integration/           # 集成测试
│   ├── regression/            # 回归测试
│   ├── conformance/           # 方案一致性测试
│   ├── e2e/                   # E2E测试
│   └── visual/                # AI端到端测试 ⭐新增
│       ├── layout/            # 布局验证测试
│       │   ├── map-layout.spec.ts
│       │   ├── indoor-layout.spec.ts
│       │   ├── indoor-functional.spec.ts
│       │   └── indoor-areas.spec.ts
│       ├── movement/          # 移动验证测试
│       │   ├── player-movement.spec.ts
│       │   ├── collision.spec.ts
│       │   ├── input-response.spec.ts
│       │   └── reachability.spec.ts  # 可达性测试 ⭐新增
│       ├── scene-switch/      # 场景切换测试
│       │   ├── door-interaction.spec.ts
│       │   ├── building-interaction.spec.ts
│       │   ├── building-entry.spec.ts
│       │   └── scene-transition.spec.ts
│       ├── ai/                # AI分析模块
│       ├── utils/             # 测试工具
│       ├── reports/           # 测试报告输出
│       ├── logs/              # 测试日志采集
│       └── screenshots/       # 截图存储
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── vitest.config.ts
└── playwright.config.ts
```

---

## 测试计划

### 测试框架

| 测试类型 | 工具 | 自动化 | 测试数 | 状态 |
|----------|------|--------|-------|------|
| 单元测试 | Vitest | 100% | 16 | ✅ 全部通过 |
| 集成测试 | Vitest | 100% | 28 | ✅ 全部通过 |
| 回归测试 | Vitest | 100% | 8 | ✅ 全部通过 |
| 方案一致性 | Vitest | 100% | 19 | ✅ 全部通过 |
| E2E测试 | Playwright | 100% | - | ✅ 可用 |
| **AI端到端测试** | Playwright | 100% | 49 | ✅ 全部通过 |
| **可达性测试** | Playwright | 100% | 10 | ✅ 全部通过 |

**测试总计: 120个测试全部通过 ✅**

### 测试注意事项
- ⚠️ **测试完成后必须关闭网页/浏览器，避免占用系统资源**
- ⚠️ **Playwright测试需单线程执行（workers: 1），避免状态竞争**

### Phase 1 测试执行状态 (2026-04-06)

**执行完成:**

| 步骤 | 内容 | 状态 |
|-----|------|------|
| Step 1 | 运行现有功能测试（单元/集成/回归/一致性） | ✅ 71个测试通过 |
| Step 2 | 分析测试结果，定位问题根因 | ✅ 已完成 |
| Step 3 | 修复所有发现的问题 | ✅ 已完成 |
| Step 4 | 实现AI端到端测试基础设施 | ✅ 已完成 |
| Step 5 | 实现AI端到端测试用例 | ✅ 49个测试通过 |
| Step 6 | 补充可达性测试 | ✅ 10个测试通过 |
| Step 7 | 实现可配置地图系统 | ✅ 已完成 |

**核心原则:**
- ❌ 禁止猜测问题根因
- ❌ **禁止使用示意图/占位图** - 如果缺少前置条件或API密钥，必须直接向用户提问
- ✅ 必须从代码、日志、错误信息定位问题
- ✅ 找不到线索时搜索查询相关文档
- ✅ 问题修复后必须重新验证

### AI端到端测试完成状态

**测试用例实现状态 (全部完成):**

#### 布局验证测试 (`tests/visual/layout/`)
| 测试ID | 测试名称 | 状态 |
|--------|---------|------|
| T-V001 | 地图尺寸40x30 | ✅ |
| T-V002 | 十字路径布局验证 | ✅ |
| T-V003 | 建筑占位数量3 | ✅ |
| T-V004 | 药园门位置验证 | ✅ |
| T-V005 | 家门位置验证 | ✅ |
| T-V006 | 青木诊所尺寸验证 | ✅ |
| T-V008 | 老张药园尺寸验证 | ✅ |
| T-V010 | 玩家之家尺寸验证 | ✅ |
| T-V018~V020 | 室内尺寸精确验证 | ✅ |

#### 移动验证测试 (`tests/visual/movement/`)
| 测试ID | 测试名称 | 状态 |
|--------|---------|------|
| T-V007 | 方向键移动响应 | ✅ |
| T-V008 | WASD移动响应 | ✅ |
| T-V009 | 对角线速度标准化 | ✅ |
| T-V010 | 墙壁碰撞阻断 | ✅ |
| T-V011 | 碰撞期间无法穿透墙壁 | ✅ |
| T-V012 | 玩家速度验证 | ✅ |
| T-V015 | 对角线移动验证 | ✅ |
| T-V016 | 停止响应 | ✅ |

#### 场景切换测试 (`tests/visual/scene-switch/`)
| 测试ID | 测试名称 | 状态 |
|--------|---------|------|
| T-V017 | 空格键防抖 | ✅ |
| 门交互事件日志验证 | ✅ |
| 建筑门出生点配置 | ✅ |
| 场景切换系统就绪 | ✅ |

#### 可达性测试 (`tests/visual/movement/reachability.spec.ts`) ⭐新增
| 测试ID | 测试名称 | 验证内容 | 状态 |
|--------|---------|---------|------|
| T-V024 | 诊所门可达 | 门周围有非墙瓦片 | ✅ |
| T-V025 | 药园门可达 | 门周围有非墙瓦片 | ✅ |
| T-V026 | 家门可达 | 门周围有非墙瓦片 | ✅ |
| T-V027 | 路径连通性 | BFS验证所有路径连通 | ✅ |
| T-V028 | 门可达区域 | 每个门至少一边可通行 | ✅ |
| T-V029 | 门不在墙中 | 门瓦片不冲突 | ✅ |
| T-V030 | 配置一致性 | 配置文件与实际场景匹配 | ✅ |
| 配置验证 | 所有建筑配置有效 | ✅ |
| 配置验证 | 出生点在有效位置 | ✅ |
| 配置验证 | 路径瓦片在地图范围内 | ✅ |

### 可配置地图系统 ⭐新增

**文件位置:** `src/data/map-config.ts`

**功能:** 集中管理所有建筑、门、路径坐标，后续UI素材变更时只需修改此文件。

**配置项:**
```typescript
TOWN_OUTDOOR_CONFIG = {
  width: 40,
  height: 30,
  buildings: [...],    // 建筑配置（位置、尺寸、门偏移）
  doors: [...],        // 门配置（坐标、目标场景、出生点）
  paths: [...],        // 路径配置（瓦片列表）
  playerSpawnPoint: {} // 玩家出生点
}
```

**修改坐标示例:**
```typescript
// 修改诊所位置，只需修改 startX/startY
{ id: 'clinic', startX: 5, startY: 5, width: 8, height: 6, ... }
```

### AI端到端测试架构

**测试定位**: 功能性验证（布局、移动、碰撞、场景切换），剔除UI视觉风格

**验证维度:**
- 截图分析（QWEN VL）→ 视觉布局验证
- 状态数据（GameState）→ 硬性数值验证
- 游戏日志（EventBus）→ 事件序列验证
- AI综合判断（GLM）→ 报告生成与建议

**三级判定标准:**
| 类型 | 定义 | 通过条件 |
|------|------|---------|
| 硬性精确 | 设计文档明确数值 | 必须100%匹配 |
| 软性容忍 | 有±误差范围 | 在误差范围内 |
| 视觉阈值 | AI截图分析判断 | 置信度≥80% |

**测试用例清单 (23项):**
| 分类 | 测试ID范围 | 数量 |
|-----|-----------|------|
| 布局验证 | T-V001~T-V011 | 11项 |
| 移动验证 | T-V012~T-V019 | 8项 |
| 场景切换 | T-V020~T-V023 | 4项 |

详见:
- [Phase 1 AI端到端测试设计](docs/superpowers/specs/2026-04-05-phase1-ai-e2e-test-design.md)
- [Phase 1 AI端到端测试实现计划](docs/superpowers/plans/2026-04-06-phase1-ai-e2e-test-implementation.md) ⭐新增

### Phase 1 功能验收标准

**硬性标准（必须通过）:**
| 类别 | 标准数量 | 状态 |
|-----|---------|------|
| 游戏启动 | 3项 | ⏳ 待验收 |
| 标题画面 | 4项 | ⏳ 待验收 |
| 室外场景 | 5项 | ⏳ 待验收 |
| 玩家移动 | 5项 | ⏳ 待验收 |
| 场景切换 | 6项 | ⏳ 待验收 |
| 室内场景 | 7项 | ⏳ 待验收 |
| 构建系统 | 3项 | ⏳ 待验收 |

详见: [Phase 1验收标准文档](docs/superpowers/specs/2026-04-05-phase1-acceptance-criteria.md)

### 运行测试命令

```bash
# 运行所有单元和集成测试
npm run test:all

# 运行特定类型测试
npm run test:unit        # 单元测试
npm run test:integration # 集成测试

# 运行回归和一致性测试
npx vitest run tests/regression tests/conformance

# 运行AI端到端测试 (Phase 1验收)
npm run test:visual-phase1

# 或者单独运行
npx playwright test tests/visual
```

---

### 实现计划
- [Phase 1 实现计划](docs/superpowers/plans/2026-04-05-mvp-phase1-foundation.md)
- [Phase 1 测试计划](docs/superpowers/plans/2026-04-05-phase1-test-plan.md)
- [Phase 1 AI端到端测试实现计划](docs/superpowers/plans/2026-04-06-phase1-ai-e2e-test-implementation.md) ⭐新增
- [Phase 1.5 视觉实现计划](docs/superpowers/plans/2026-04-05-phase1.5-visual-implementation.md)

---

*本文档由 Claude Code 维护，更新于 2026-04-07*

---

## 视觉设计规范摘要

### 场景氛围定位

| 场景 | 氛围定位 | 核心元素 |
|-----|---------|---------|
| **百草镇室外** | 田园治愈为主，中医点缀，探索引导 | 空旷布局、山水小桥、竹林花田鱼塘、高低错落 |
| **青木诊所** | 温馨小诊所，中医专业+传承 | 经络图、药柜、药炉、祖师爷画像，阳光窗户 |
| **老张药园** | 规整+自然野趣，老张风格 | 药田、蜜蜂小溪（道具来源）、工具墙、休息棚 |
| **玩家之家** | 温馨+成长记录+个性化 | 厨房药膳、书房医书进度、卧室私人空间 |

### 颜色体系

| 氛围维度 | 色系 | 主色 | 用途 |
|---------|-----|-----|------|
| 田园治愈 | 田园绿系 | #4a9 | 室外草地、药园主色 |
| 中医文化 | 古朴棕系 | #865 | 诊所建筑、药柜 |
| 神秘探索 | 自然蓝系 | #6a8 | 远景山脉、溪流 |

### 中医元素呈现策略

**像素瓦片示意 + 点击查看高清详情**

| 元素类型 | 像素外观 | 点击详情展示 |
|---------|---------|-------------|
| 材 | 简化形状示意 | 高清静态图 + 功效说明 |
| 经络图 | 简化网格图标 | 高清图 + 动态穴位流动 |
| 祖师爷 | 像素人物轮廓 | 短动画 + 经验加持特效 |

### 素材来源

- **全部AI生成**: 瓦片、高清图、动画帧
- **对比测试**: Phase 1.5中进行AI vs 手工对比

详见: [视觉设计规范文档](docs/superpowers/specs/2026-04-05-visual-design-v1.0.md)

---

## 已实现功能

### 场景系统
- ✅ 标题画面显示"药灵山谷"，点击"开始游戏"进入
- ✅ 百草镇室外地图（40x30瓦片）
- ✅ 十字形路径设计
- ✅ 3个建筑占位（诊所、药园、家）
- ✅ 边界墙壁

### 室内场景
- ✅ 青木诊所 (15x12瓦片) - 诊台、药柜
- ✅ 老张药园 (20x15瓦片) - 4个药田
- ✅ 玩家之家 (12x10瓦片) - 厨房、书房、卧室

### 玩家系统
- ✅ 玩家移动控制（方向键 + WASD）
- ✅ 对角线移动速度标准化
- ✅ 瓦片位置追踪

### 场景切换
- ✅ 门瓦片交互，空格键进入/退出建筑
- ✅ 出生点系统，从建筑出来时位置正确
- ✅ 空格键防抖处理

### 碰撞系统
- ✅ 墙壁碰撞检测
- ✅ 门瓦片无碰撞（可通行）
- ✅ 室内边界碰撞

---

## 下一步 TODO

### Phase 1 验收 ✅ 已完成

- ✅ 实现游戏日志系统 (EventBus + GameLogger)
- ✅ 实现状态暴露接口 (GameStateBridge)
- ✅ 实现AI端到端测试 (49个测试)
- ✅ 补充可达性测试 (10个测试)
- ✅ 实现可配置地图系统 (map-config.ts)
- ✅ 所有测试通过 (120个测试)

### Phase 1.5 当前任务 ⏳ 下一步：游戏集成

**Task 1.5.8: 游戏集成**
- [ ] 更新 `map-config.ts` 地图尺寸 (40×30 → 86×48)
- [ ] 更新门坐标配置（药园15,8 / 诊所60,8 / 家61,35）
- [ ] 加载小镇全景图作为背景
- [ ] 实现基于可行走瓦片的碰撞检测
- [ ] 更新相机边界
- [ ] 更新室内场景出生点

**已完成成果**:
| 项目 | 结果 |
|-----|------|
| 遮罩层自动映射脚本 | `mask_to_config.py` |
| 可行走瓦片数量 | 916个 (22.2%) |
| 门坐标 | 药园(15,8)、诊所(60,8)、家(61,35) |
| 水井坐标 | (43,24) |
| 配置文件 | `map_config.json`, `town-walkable-config.ts` |
| 可视化验证 | `walkable_overlay.png`, `connectivity_grid.png` |

### Phase 1.5 开发任务 (进行中)

| 优先级 | 任务 | 状态 | 描述 |
|--------|------|------|------|
| P0 | AI生成流程 | ✅ 已完成 | 配置Prompt模板和生成脚本 |
| P0 | AI vs 手工对比测试 | ✅ 已完成 | 确定混合方案 |
| P0 | 小镇外景素材制作 | ✅ 已完成 | `new_town_nanobanana3.jpeg` |
| P0 | 黑白遮罩层生成 | ✅ 已完成 | `new_town_shadow2.jpeg` |
| P0 | 遮罩层自动映射 | ⏳ 设计完成待实现 | 见[设计文档](docs/superpowers/specs/2026-04-07-mask-to-config-design.md) |
| P1 | 室内场景素材制作 | ⏳ 待开始 | 诊所、药园瓦片集已有，家待生成 |
| P1 | 场景视觉实现 | ⏳ 待开始 | 等待遮罩映射完成 |
| P1 | AI端到端视觉验收 | ⏳ 待执行 | 见Phase 1.5验收计划 |
| P2 | 用户体验验证 | ⏳ 待执行 | 用户实际走进世界体验 |

**Phase 1.5 AI端到端验收计划**: [2026-04-06-phase1-5-ai-e2e-acceptance-plan.md](docs/superpowers/specs/2026-04-06-phase1-5-ai-e2e-acceptance-plan.md)

### 后续规划

- **Phase 2**: NPC系统（Phase 1.5完成后）
- **Phase 3**: 学习系统（种植、炮制、药袋）
- **Phase 4**: 探索系统（药王谷、采集）
- **Phase 5**: 生活系统（药膳、家园）

---

## 启动项目

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 构建生产版本
npm run build

# 预览生产版本
npm run preview
```

---

## 相关文档

### 设计文档
- [完整游戏设计文档](docs/superpowers/specs/2026-04-05-game-design-v3.0.md)
- [视觉设计规范 v1.0](docs/superpowers/specs/2026-04-05-visual-design-v1.0.md)
- [Phase 1验收标准](docs/superpowers/specs/2026-04-05-phase1-acceptance-criteria.md)
- [Phase 1 AI端到端测试设计](docs/superpowers/specs/2026-04-05-phase1-ai-e2e-test-design.md)
- [Phase 1.5 AI端到端视觉验收计划](docs/superpowers/specs/2026-04-06-phase1-5-ai-e2e-acceptance-plan.md)
- [黑白遮罩层自动映射设计](docs/superpowers/specs/2026-04-07-mask-to-config-design.md) ⭐最新

### 实现计划
- [Phase 1 实现计划](docs/superpowers/plans/2026-04-05-mvp-phase1-foundation.md)
- [Phase 1 测试计划](docs/superpowers/plans/2026-04-05-phase1-test-plan.md)
- [Phase 1.5 视觉实现计划](docs/superpowers/plans/2026-04-05-phase1.5-visual-implementation.md) ⭐已更新

---

*本文档由 Claude Code 维护，更新于 2026-04-07*