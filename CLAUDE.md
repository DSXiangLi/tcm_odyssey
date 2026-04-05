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

### Phase 2: NPC系统 ⏳ 待开发

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

## 项目结构

```
zhongyi_game_v3/
├── docs/
│   └── superpowers/
│       ├── specs/
│       │   └── 2026-04-05-game-design-v3.0.md    # 完整游戏设计文档
│       └── plans/
│           ├── 2026-04-05-mvp-phase1-foundation.md  # Phase 1实现计划
│           └── 2026-04-05-phase1-test-plan.md        # 测试计划
├── public/
│   └── assets/
│       ├── maps/              # Tiled地图JSON
│       ├── tiles/
│       │   └── tileset.json   # 瓦片定义
│       └── sprites/           # 角色精灵图
├── src/
│   ├── main.ts                # 游戏入口
│   ├── config/
│   │   └── game.config.ts     # Phaser配置
│   ├── data/
│   │   └── constants.ts       # 常量定义
│   ├── scenes/
│   │   ├── TitleScene.ts      # 标题画面
│   │   ├── BootScene.ts       # 资源加载
│   │   ├── TownOutdoorScene.ts # 室外场景
│   │   ├── ClinicScene.ts     # 青木诊所
│   │   ├── GardenScene.ts     # 老张药园
│   │   └── HomeScene.ts       # 玩家之家
│   ├── entities/
│   │   └── Player.ts          # 玩家实体
│   └── systems/
│       └── SceneManager.ts    # 场景管理器
├── tests/
│   ├── unit/                  # 单元测试
│   ├── integration/           # 集成测试
│   ├── regression/            # 回归测试
│   ├── conformance/           # 方案一致性测试
│   └── e2e/                   # E2E测试
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
| 单元测试 | Vitest | 100% | ✅ 16个测试通过 |
| 集成测试 | Vitest | 100% | ✅ 28个测试通过 |
| 回归测试 | Vitest | 100% | ✅ 8个测试通过 |
| 方案一致性 | Vitest | 100% | ✅ 19个测试通过 |
| E2E测试 | Playwright | 100% | ✅ 7个测试已创建 |
| AI视觉测试 | 多模态LLM | 半自动 | 📝 方案已设计 |

### 测试覆盖率目标

| 测试类型 | 目标覆盖率 | 当前状态 |
|----------|------------|----------|
| 单元测试 | 80% | 已覆盖核心逻辑 |
| 集成测试 | 70% | 已覆盖场景系统 |
| E2E测试 | 关键路径100% | 已覆盖主要流程 |

### 运行测试命令

```bash
# 运行所有单元和集成测试
npm run test:all

# 运行特定类型测试
npm run test:unit        # 单元测试
npm run test:integration # 集成测试

# 运行E2E测试
npm run dev &            # 先启动开发服务器
npm run test:e2e

# 运行回归和一致性测试
npx vitest run tests/regression tests/conformance
```

### AI多模态测试用例

测试计划包含AI驱动的视觉验证：

1. **标题画面验证** - 验证游戏标题、按钮、提示文字
2. **室外场景验证** - 验证地图渲染、玩家显示、碰撞检测
3. **室内场景验证** - 验证诊所、药园、家的视觉元素
4. **场景切换验证** - 验证视觉连续性和过渡效果
5. **玩家移动验证** - 验证移动流畅性和碰撞正确性

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

### 立即执行 (Phase 2 准备)

1. **创建Phase 2实现计划**
   - 基于设计文档编写NPC系统实现计划
   - 定义NPC数据结构（profile.json, memory.json, tasks.json）
   - 设计AI对话接口

2. **安装AI对话依赖**
   ```bash
   npm install @anthropic-ai/sdk  # 或其他LLM SDK
   ```

3. **创建NPC数据目录结构**
   ```
   npcs/
   ├── qingmu/
   │   ├── profile.json   # 角色设定
   │   ├── memory.json    # 交互记忆
   │   └── tasks.json     # 任务链定义
   └── laozhang/
       ├── profile.json
       ├── memory.json
       └── tasks.json
   ```

### Phase 2 开发任务

| 优先级 | 任务 | 描述 |
|--------|------|------|
| P0 | NPC基础框架 | 创建NPC实体类和管理器 |
| P0 | AI对话接口 | 接入LLM API实现对话 |
| P1 | TASK文件系统 | 任务状态管理和触发 |
| P1 | MEMORY文件系统 | 玩家交互记忆存储 |
| P2 | 青木先生NPC | 临床导师实现 |
| P2 | 老张NPC | 药物导师实现 |
| P3 | 对话UI | 对话框界面设计 |

### 后续规划

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

- [完整游戏设计文档](docs/superpowers/specs/2026-04-05-game-design-v3.0.md)
- [Phase 1 实现计划](docs/superpowers/plans/2026-04-05-mvp-phase1-foundation.md)
- [Phase 1 测试计划](docs/superpowers/plans/2026-04-05-phase1-test-plan.md)

---

*本文档由 Claude Code 维护*