# 药灵山谷 (Yaoling Shangu) - 项目文档

**版本**: v3.0 - Phase 1 MVP
**最后更新**: 2026-04-05
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

### Phase 1.5: 游戏世界视觉呈现 ⏳ 待开发

> **开发顺序调整**: 视觉设计在NPC系统之前，让玩家先获得完整的游戏世界体验

| 任务 | 状态 | 描述 |
|------|------|------|
| Task 1.5.1 | ✅ | 视觉设计规范制定 - 已评审确认 |
| Task 1.5.2 | ✅ | 视觉验收标准制定 - 已评审确认 |
| Task 1.5.3 | ⏳ | AI生成流程搭建 |
| Task 1.5.4 | ⏳ | AI vs 手工对比测试 |
| Task 1.5.5 | ⏳ | 瓦片素材制作（~50个瓦片） |
| Task 1.5.6 | ⏳ | 高清素材制作（~20个高清图 + 动画） |
| Task 1.5.7 | ⏳ | 场景视觉实现 |
| Task 1.5.8 | ⏳ | AI视觉测试执行 |
| Task 1.5.9 | ⏳ | 用户体验验证 |

**Phase 1.5完成标志**: 玩家可以真正"走进完整的游戏世界"，感受田园治愈+中医文化+神秘探索的综合氛围

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
│       │   └── indoor-layout.spec.ts
│       ├── movement/          # 移动验证测试
│       │   ├── player-movement.spec.ts
│       │   └── collision.spec.ts
│       ├── scene-switch/      # 场景切换测试
│       │   └── door-interaction.spec.ts
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

| 测试类型 | 工具 | 自动化 | 状态 |
|----------|------|--------|------|
| 单元测试 | Vitest | 100% | ✅ 待验证 |
| 集成测试 | Vitest | 100% | ✅ 待验证 |
| 回归测试 | Vitest | 100% | ✅ 待验证 |
| 方案一致性 | Vitest | 100% | ✅ 待验证 |
| E2E测试 | Playwright | 100% | ✅ 待验证 |
| **AI端到端测试** | Playwright + QWEN VL + GLM | 100% | ⏳ 待实现执行 |

### Phase 1 测试执行计划 (2026-04-06)

**执行顺序:**

| 步骤 | 内容 | 状态 |
|-----|------|------|
| Step 1 | 运行现有功能测试（单元/集成/回归/一致性/E2E） | ⏳ 待执行 |
| Step 2 | 分析测试结果，定位问题根因 | ⏳ 待执行 |
| Step 3 | 修复所有发现的问题 | ⏳ 待执行 |
| Step 4 | 实现AI端到端测试基础设施 | ⏳ 待执行 |
| Step 5 | 执行AI端到端测试验收 | ⏳ 待执行 |
| Step 6 | 生成最终验收报告 | ⏳ 待执行 |

**核心原则:**
- ❌ 禁止猜测问题根因
- ✅ 必须从代码、日志、错误信息定位问题
- ✅ 找不到线索时搜索查询相关文档
- ✅ 问题修复后必须重新验证

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
# Step 1: 运行所有现有功能测试
npm run test:all              # 单元 + 集成测试
npx vitest run tests/regression tests/conformance  # 回归 + 一致性
npm run dev & npm run test:e2e  # E2E测试

# Step 4-5: AI端到端测试（需先实现基础设施）
npm run test:visual-phase1    # Phase 1 AI验收测试

# Step 6: 查看测试报告
cat tests/visual/reports/phase1-report-*.md
```

---

### 实现计划
- [Phase 1 实现计划](docs/superpowers/plans/2026-04-05-mvp-phase1-foundation.md)
- [Phase 1 测试计划](docs/superpowers/plans/2026-04-05-phase1-test-plan.md)
- [Phase 1 AI端到端测试实现计划](docs/superpowers/plans/2026-04-06-phase1-ai-e2e-test-implementation.md) ⭐新增
- [Phase 1.5 视觉实现计划](docs/superpowers/plans/2026-04-05-phase1.5-visual-implementation.md)

---

*本文档由 Claude Code 维护，更新于 2026-04-06*

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

### 立即执行 (Phase 1 AI端到端验收)

1. **实现游戏日志系统**
   - 创建 `src/systems/EventBus.ts` 事件总线
   - 创建 `src/utils/GameLogger.ts` 日志收集器
   - 在各场景和Player中添加事件发送

2. **实现状态暴露接口**
   - 为测试提供游戏内部状态访问
   - 瓦片数据、玩家位置、场景尺寸等

3. **实现AI端到端测试**
   - 创建 `tests/visual/` 目录结构
   - 实现截图采集、状态提取、日志收集
   - 集成 QWEN VL + GLM API
   - 生成 JSON + Markdown 测试报告

4. **执行Phase 1验收**
   - 运行 `npm run test:visual-phase1`
   - 生成验收报告
   - 确认所有硬性标准通过

### Phase 1.5 开发任务 (Phase 1验收通过后)

| 优先级 | 任务 | 描述 |
|--------|------|------|
| P0 | AI生成流程 | 配置Prompt模板和生成脚本 |
| P0 | AI vs 手工对比测试 | 确定素材制作方式 |
| P0 | 瓦片素材制作 | ~50个瓦片（含变体） |
| P0 | 高清素材制作 | ~20个高清图 + 祖师爷动画 |
| P1 | 场景视觉实现 | 4个场景素材替换 |
| P1 | 点击交互功能 | 详情弹窗界面 |
| P2 | AI视觉测试 | 自动化视觉验证 |
| P2 | 用户体验验证 | 用户实际走进世界体验 |

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
- [Phase 1 AI端到端测试设计](docs/superpowers/specs/2026-04-05-phase1-ai-e2e-test-design.md) ⭐新增

### 实现计划
- [Phase 1 实现计划](docs/superpowers/plans/2026-04-05-mvp-phase1-foundation.md)
- [Phase 1 测试计划](docs/superpowers/plans/2026-04-05-phase1-test-plan.md)
- [Phase 1.5 视觉实现计划](docs/superpowers/plans/2026-04-05-phase1.5-visual-implementation.md)

---

*本文档由 Claude Code 维护，更新于 2026-04-05*