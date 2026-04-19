# 药灵山谷 (Yaoling Shangu)

一款2D像素风格的中医学习游戏，在探索药王谷的过程中学习中医知识。

## 技术栈

- **游戏引擎**: Phaser 3
- **语言**: TypeScript
- **构建工具**: Vite
- **NPC系统**: Hermes-Agent (LLM驱动的智能NPC)

## 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览构建结果
npm run preview
```

## 测试

```bash
# 运行单元测试
npm run test:unit

# 运行集成测试
npm run test:integration

# 运行E2E测试
npm run test:e2e

# 测试覆盖率
npm run test:coverage
```

## 项目结构

```
src/
├── main.ts              # 游戏入口
├── config/              # Phaser配置
├── data/                # 游戏数据(药材、病案、方剂等)
├── scenes/              # Phaser场景(室外、诊所、药园等)
├── entities/            # 游戏实体(Player等)
├── systems/             # 系统管理器(背包、煎药、炮制等)
├── ui/                  # UI组件(对话、问诊、诊治等)
└── utils/               # 工具函数
```

## 核心功能

- **AI NPC对话** - 与青木医生等NPC自然对话
- **问诊系统** - 收集病人症状线索
- **诊治流程** - 脉诊、舌诊、辨证、选方
- **药材炮制** - 学习药材炮制方法
- **煎药游戏** - 掌握煎药火候与顺序
- **药园种植** - 种植并照料中药材

## 文档

详细设计文档位于 `docs/superpowers/specs/`，实现计划位于 `docs/superpowers/plans/`。

## 许可证

MIT