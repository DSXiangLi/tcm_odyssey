# 药灵山谷 - 视觉验收自动化系统设计

**版本**: v1.0
**日期**: 2026-04-15
**状态**: 待确认
**关联**: Phase 2 S1-S13功能完成后的视觉验收

---

## 1. 系统概述

### 1.1 目标

为药灵山谷游戏建立一套全自动化的视觉验收系统，覆盖：
- 全部UI组件（18个）
- 场景背景（室外+室内4场景）
- Sprite动画（玩家+NPC）
- 整体游戏氛围

通过Playwright截图 → Qwen VL多模态评估 → 自动代码修改的闭环流程，确保游戏视觉质量符合中医风格规范和AI NPC交互适配要求。

### 1.2 核心特性

| 特性 | 说明 |
|-----|------|
| **全游戏覆盖** | UI、场景、Sprite、氛围全方位验收 |
| **AI驱动评估** | Qwen VL多模态模型自动分析视觉质量 |
| **自动修改闭环** | 评估→修改→验证→再评估的自动化循环 |
| **分支隔离安全** | dev分支修改，用户验收后合并 |
| **中医+AI双维度** | 专门的中医风格和AI对话交互验收维度 |

---

## 2. 系统架构

### 2.1 整体流程

```
┌─────────────────────────────────────────────────────────────────────┐
│                        视觉验收自动化系统                              │
├─────────────────────────────────────────────────────────────────────┤
│  1. 基线保存: git commit → 创建dev分支                               │
│  2. 截图采集: Playwright启动游戏 → 模拟玩家操作 → 采集截图集          │
│  3. AI评估: Qwen VL分析截图 → 生成评估报告（评分+问题+建议）           │
│  4. 代码修改: 解析建议 → 修改UI代码 → 编译验证                        │
│  5. 循环迭代: 重新截图评估 → 直到达标或达到最大轮次                   │
│  6. 用户验收: 汇报修改摘要 → 用户确认 → 合并dev到主分支               │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 模块划分

| 模块 | 技术 | 职责 |
|-----|------|------|
| **截图控制器** | Playwright + TypeScript | 游戏启动、玩家/NPC操作模拟、截图采集 |
| **评估服务** | Python + Qwen VL | 多模态评估、报告生成、修改建议输出 |
| **修改执行器** | Python + TypeScript编辑 | 解析建议、修改代码、编译验证 |
| **流程协调器** | Python | 整体流程编排、Git分支管理、用户交互 |

### 2.3 数据流

```
截图集(JSON) → 评估报告(JSON) → 修改建议(JSON) → 代码修改 → 新截图
     ↑                                              ↓
     └────────────────── 验证循环 ←─────────────────┘
```

---

## 3. 截图控制器

### 3.1 游戏操作模拟

复用现有`tests/e2e/utils/phaser-helper.ts`基础设施，扩展以下操作能力：

| 操作类型 | 实现方式 | 目的 |
|---------|---------|------|
| **玩家移动** | WASD/方向键控制 + 碰撞验证 | 触发场景探索、相机跟随、边界检查 |
| **NPC交互** | 空格键触发 + 对话状态检测 | 捕获AI对话界面、流式输出状态 |
| **场景切换** | 门交互 + 出生点验证 | 捕获各室内场景、过渡动画 |
| **UI触发** | 快捷键(B/G/I等) + 按钮点击 | 捕获背包、煎药、炮制、种植界面 |
| **流程推进** | 问诊→诊治→评分完整流程 | 捕获脉诊、舌诊、辨证、选方、结果UI |

### 3.2 截图场景清单

| 场景ID | 游戏状态 | 截图数量 | 采集要点 |
|-------|---------|---------|---------|
| `SCENE-01` | 百草镇室外探索 | 3张 | 全景、玩家移动中、远景山脉 |
| `SCENE-02` | 青木诊所室内 | 2张 | 药柜背景、NPC对话位置 |
| `SCENE-03` | 老张药园室内 | 2张 | 药田布局、工具墙 |
| `SCENE-04` | 玩家之家室内 | 2张 | 书房进度、卧室休息区 |
| `NPC-01` | 与NPC开始对话 | 1张 | 对话框初始状态 |
| `NPC-02` | AI流式输出中 | 2张 | 文字滚动、思考指示器 |
| `NPC-03` | 对话历史浏览 | 1张 | 多轮对话记录展示 |
| `INQUIRY-01` | 问诊主界面 | 1张 | 病人信息、症状选择 |
| `INQUIRY-02` | 线索追踪UI | 1张 | 已收集线索、关键发现 |
| `DIAG-01` | 脉诊界面 | 1张 | 脉象选择、滑块操作 |
| `DIAG-02` | 舌诊界面 | 1张 | 舌象图谱、选择交互 |
| `DIAG-03` | 辨证界面 | 1张 | 证型选择、推理展示 |
| `DIAG-04` | 选方界面 | 1张 | 方剂列表、配伍展示 |
| `DIAG-05` | 评分结果 | 1张 | 得分展示、NPC反馈 |
| `SUBGAME-01` | 煎药界面 | 2张 | 火候选择、进度展示 |
| `SUBGAME-02` | 炮制界面 | 2张 | 方法选择、辅料匹配 |
| `SUBGAME-03` | 种植界面 | 2张 | 种子选择、生长阶段 |
| `SYSTEM-01` | 背包界面 | 1张 | 药材分类、药袋切换 |
| `SYSTEM-02` | 存档界面 | 1张 | 槽位列表、时间戳 |
| `SYSTEM-03` | 经验值UI | 1张 | 进度条、解锁通知 |
| `SYSTEM-04` | 新手引导 | 2张 | 集中引导面板、场景提示气泡 |

**总计：约35张截图**

---

## 4. 评估服务

### 4.1 评估维度定义

| 维度 | 权重 | 通过阈值 | 评估内容 |
|-----|-----|---------|---------|
| **中医风格符合度** | 15% | ≥75分 | 古朴配色运用、中医元素符号呈现、传统文化美学（对称/留白/层次）、整体文化氛围 |
| **AI对话交互适配** | 15% | ≥80分 | 对话面板空间充足、流式输出展示清晰、思考状态指示、对话历史布局、NPC表情/状态反馈 |
| **UI布局清晰度** | 15% | ≥85分 | 元素对齐、层级关系、间距合理、无重叠遮挡 |
| **颜色风格一致性** | 10% | ≥80分 | 三色系规范符合度、过渡自然、无突兀配色 |
| **文字可读性** | 10% | ≥90分 | 字体大小合适、颜色对比清晰、无遮挡 |
| **场景氛围符合度** | 15% | ≥75分 | 场景定位符合（田园/中医/探索）、元素布局合理、中医元素自然融入 |
| **Sprite动画质量** | 5% | ≥70分 | 帧率流畅、方向切换正确、NPC行为自然 |
| **整体游戏体验** | 15% | ≥80分 | 界面响应、视觉舒适度、交互反馈清晰、AI对话流畅度 |

**总体通过条件**：
- 加权总分 ≥ 80分
- 所有维度单项 ≥ 阈值
- 无high优先级问题

### 4.2 多模态评估请求格式

```json
{
  "image": "<截图路径或base64>",
  "scene_id": "NPC-02",
  "scene_context": "AI流式输出对话界面",
  "evaluation_dimensions": [
    {"name": "中医风格符合度", "weight": 0.15, "threshold": 75},
    {"name": "AI对话交互适配", "weight": 0.15, "threshold": 80},
    {"name": "UI布局清晰度", "weight": 0.15, "threshold": 85},
    {"name": "颜色风格一致性", "weight": 0.10, "threshold": 80},
    {"name": "文字可读性", "weight": 0.10, "threshold": 90},
    {"name": "场景氛围符合度", "weight": 0.15, "threshold": 75},
    {"name": "Sprite动画质量", "weight": 0.05, "threshold": 70},
    {"name": "整体游戏体验", "weight": 0.15, "threshold": 80}
  ],
  "visual_spec_reference": "<视觉设计规范摘要>",
  "game_context": "药灵山谷 - 中医学习游戏，AI NPC驱动"
}
```

### 4.3 评估Prompt模板

```markdown
你是药灵山谷游戏的视觉验收专家。请评估这张截图的视觉质量。

## 游戏背景
- 2D像素风格中医学习游戏
- 核心特色：AI NPC对话、中医知识学习、田园治愈氛围
- 视觉规范：32x32像素，三色系（田园绿#4a9/古朴棕#865/自然蓝#6a8）

## 当前截图
场景ID: {scene_id}
场景描述: {scene_context}

## 评估维度
请对以下维度评分（0-100分），并指出具体问题：

1. **中医风格符合度(15%)**: 古朴配色运用、中医元素符号、传统文化美学（对称/留白/层次）
2. **AI对话交互适配(15%)**: 对话面板空间、流式输出展示、NPC状态反馈
3. **UI布局清晰度(15%)**: 元素对齐、层级关系、间距合理
4. **颜色风格一致性(10%)**: 三色系规范、过渡自然
5. **文字可读性(10%)**: 字体大小、颜色对比
6. **场景氛围符合度(15%)**: 场景定位、元素布局
7. **Sprite动画质量(5%)**: 帧率流畅、方向切换
8. **整体游戏体验(15%)**: 视觉舒适度、交互反馈

## 输出格式
请以JSON格式输出：
{
  "total_score": <加权总分>,
  "dimensions": [
    {"name": "<维度名>", "score": <分数>, "issues": ["<问题1>", "<问题2>"]}
  ],
  "improvements": [
    {"target": "<修改目标>", "suggestion": "<具体建议>", "priority": "<high/medium/low>", "modification_type": "<style|layout|add_element>"}
  ],
  "pass": <true/false>
}
```

### 4.4 评估报告输出格式

```json
{
  "scene_id": "NPC-02",
  "total_score": 78,
  "dimensions": [
    {
      "name": "中医风格符合度",
      "score": 72,
      "issues": ["对话框背景色#ffffff过于现代，缺乏古朴感", "缺少中医风格边框装饰"]
    },
    {
      "name": "AI对话交互适配",
      "score": 85,
      "issues": []
    }
  ],
  "improvements": [
    {
      "target": "DialogUI.ts - 对话框背景颜色",
      "suggestion": "将背景颜色从#ffffff改为#f5e6d3(古朴棕系)，增加中医风格",
      "priority": "high",
      "modification_type": "style"
    },
    {
      "target": "DialogUI.ts - 对话框边框",
      "suggestion": "添加古朴风格的边框装饰，使用#865棕色系",
      "priority": "medium",
      "modification_type": "add_element"
    }
  ],
  "pass": false
}
```

---

## 5. 代码修改执行器

### 5.1 修改类型处理策略

| 修改类型 | 处理方式 | 示例 |
|---------|---------|------|
| **style** (样式) | 修改颜色、字体、尺寸等参数 | `backgroundColor: '#ffffff' → '#f5e6d3'` |
| **layout** (布局) | 修改位置、层级、间距 | `x: 100 → x: 120` |
| **add_element** (新增) | 添加装饰元素、图标、分隔线 | 添加中医风格边框装饰 |

### 5.2 修改执行流程

```
1. 解析建议 → 确定目标文件和修改位置
2. 读取目标文件 → 定位相关代码段
3. 应用修改 → Edit工具精确修改
4. 编译验证 → npx tsc --noEmit
5. 快速测试 → 运行相关单元测试
6. 提交修改 → git commit到dev分支
```

### 5.3 修改安全约束

| 约束 | 说明 |
|-----|------|
| **不修改业务逻辑** | 仅修改UI相关代码，不触及系统核心逻辑 |
| **保持类型安全** | 修改后必须通过TypeScript编译 |
| **不破坏现有测试** | 修改后相关测试必须通过 |
| **颜色值验证** | 新颜色值必须符合三色系规范或合理过渡色 |
| **尺寸边界** | 新增元素尺寸不超过屏幕边界 |

### 5.4 修改日志记录

每次修改记录到日志文件：

```markdown
## 修改记录 - 2026-04-15

### 修改#1: DialogUI背景颜色优化
- 文件: src/ui/DialogUI.ts:45
- 原值: backgroundColor: '#ffffff'
- 新值: backgroundColor: '#f5e6d3'
- 原因: 中医风格符合度评分72，低于阈值75
- 编译状态: 通过
- 测试状态: DialogUI相关测试通过

### 修改#2: ExperienceUI进度条位置调整
- 文件: src/ui/ExperienceUI.ts:120
- 原值: x: 50
- 新值: x: 80
- 原因: UI布局清晰度评分78，进度条与文字重叠
- 编译状态: 通过
- 测试状态: ExperienceUI相关测试通过
```

---

## 6. 流程协调器

### 6.1 主流程

```python
def run_visual_acceptance():
    """视觉验收主流程"""

    # 1. 基线保存
    git_commit_current_changes()
    create_dev_branch()

    # 2. 初始化
    max_iterations = 3  # 最大优化轮次
    current_iteration = 0

    # 3. 截图采集
    screenshots = screenshot_controller.collect_all_scenes()

    # 4. 评估循环
    while current_iteration < max_iterations:
        # 评估所有截图
        reports = evaluation_service.evaluate_batch(screenshots)

        # 检查是否全部通过
        if all_passed(reports):
            break

        # 生成修改建议汇总
        modifications = aggregate_improvements(reports)

        # 执行代码修改
        modification_executor.apply_modifications(modifications)

        # 编译验证
        if not compile_and_verify():
            rollback_last_modifications()
            break

        # 重新截图
        screenshots = screenshot_controller.collect_all_scenes()
        current_iteration += 1

    # 5. 生成验收报告
    generate_summary_report(reports, modifications, current_iteration)

    # 6. 等待用户验收
    wait_for_user_approval()

    # 7. 合并或回滚
    if user_approved:
        merge_dev_to_main()
    else:
        rollback_dev_branch()
```

### 6.2 迭代策略

| 轮次 | 策略 | 说明 |
|-----|------|------|
| **第1轮** | 修复所有high优先级问题 | 先解决严重问题 |
| **第2轮** | 修复medium优先级问题 | 处理次要问题 |
| **第3轮** | 优化low优先级问题 + 微调 | 最后润色 |

### 6.3 失败处理

| 失败情况 | 处理方式 |
|---------|---------|
| **编译失败** | 回滚最后一次修改，尝试其他方案 |
| **测试失败** | 回滚修改，标记为需要人工处理 |
| **达到最大轮次仍未通过** | 生成详细报告，标注需要人工处理的问题 |
| **修改建议无法解析** | 标记为需要人工处理，继续其他修改 |

### 6.4 用户验收报告格式

```markdown
# 视觉验收报告 - 2026-04-15

## 执行摘要
- 验收轮次: 3
- 截图总数: 35
- 修改总数: 12
- 总体评分: 初次78分 → 最终82分

## 各维度评分变化
| 维度 | 初次 | 最终 | 提升 | 通过阈值 |
|-----|-----|-----|-----|---------|
| 中医风格符合度 | 72 | 81 | +9 | 75 ✅ |
| AI对话交互适配 | 76 | 84 | +8 | 80 ✅ |
| UI布局清晰度 | 78 | 88 | +10 | 85 ✅ |
| 颜色风格一致性 | 74 | 82 | +8 | 80 ✅ |
| 文字可读性 | 88 | 92 | +4 | 90 ✅ |
| 场景氛围符合度 | 71 | 80 | +9 | 75 ✅ |
| Sprite动画质量 | 75 | 78 | +3 | 70 ✅ |
| 整体游戏体验 | 76 | 83 | +7 | 80 ✅ |

## 主要修改内容
1. DialogUI背景颜色调整 (#ffffff → #f5e6d3) - 中医风格优化
2. DialogUI添加古朴边框装饰 - 中医元素增强
3. ExperienceUI进度条位置调整 - 布局清晰度优化
4. TutorialUI中医风格边框 - 新手引导风格统一
5. InquiryUI线索卡片间距调整 - 布局优化
6. PrescriptionUI方剂列表字体调整 - 可读性优化
...

## Git状态
- dev分支: 12个提交待合并
- 提交列表: a1b2c3d... x9y8z7w
- 请确认后合并到main分支

## 待人工处理问题（如有）
- NPC表情动画帧率优化（需要美术重新生成Sprite）
- 场景远景山脉层次感增强（需要AI重新生成素材）

---
执行命令确认: `git merge dev` 或 `git checkout main && git branch -D dev`
```

---

## 7. 目录结构与文件清单

### 7.1 新增文件结构

```
zhongyi_game_v3/
├── scripts/
│   └── visual_acceptance/           # 视觉验收系统
│       ├── run_acceptance.py        # 流程协调器入口
│       ├── config.py                # 配置管理(.env读取)
│       └── requirements.txt         # Python依赖
│
├── tests/
│   └── visual_acceptance/           # 截图控制器
│       ├── screenshot_collector.spec.ts  # Playwright截图采集
│       ├── scene_operations.ts      # 游戏操作模拟
│       └── screenshot_config.ts     # 截图场景配置
│
├── visual_evaluator/                # 评估服务
│   ├── evaluator.py                 # Qwen VL调用
│   ├── prompt_template.py           # 评估Prompt模板
│   ├── report_generator.py          # 报告生成
│   └── dimension_checker.py         # 维度评分验证
│
├── modification_executor/           # 代码修改执行器
│   ├── suggestion_parser.py         # 建议解析
│   ├── code_modifier.py             # 代码修改执行
│   ├── compile_verifier.py          # 编译验证
│   └── modification_log.py          # 修改日志
│
└── reports/
    └── visual_acceptance/           # 验收报告输出
        ├── YYYY-MM-DD/
        │   ├── screenshots/         # 截图存档
        │   ├── evaluation_reports/  # 各场景评估报告
        │   ├── modification_log.md  # 修改记录
        │   └── summary_report.md    # 用户验收报告
```

### 7.2 配置管理

```python
# scripts/visual_acceptance/config.py

import os
from dotenv import load_dotenv

load_dotenv()

# 评估模型配置（从.env读取）
QWEN_VL_API_URL = os.getenv("QWEN_VL_API_URL")
QWEN_VL_MODEL = os.getenv("QWEN_VL_MODEL")

# 验收阈值配置
DIMENSION_THRESHOLDS = {
    "中医风格符合度": 75,
    "AI对话交互适配": 80,
    "UI布局清晰度": 85,
    "颜色风格一致性": 80,
    "文字可读性": 90,
    "场景氛围符合度": 75,
    "Sprite动画质量": 70,
    "整体游戏体验": 80
}

DIMENSION_WEIGHTS = {
    "中医风格符合度": 0.15,
    "AI对话交互适配": 0.15,
    "UI布局清晰度": 0.15,
    "颜色风格一致性": 0.10,
    "文字可读性": 0.10,
    "场景氛围符合度": 0.15,
    "Sprite动画质量": 0.05,
    "整体游戏体验": 0.15
}

TOTAL_PASS_THRESHOLD = 80
MAX_ITERATIONS = 3

# 颜色规范（三色系）
COLOR_SPEC = {
    "田园绿系": {"主色": "#4a9", "辅色": "#6c7", "暗色": "#2d5"},
    "古朴棕系": {"主色": "#865", "辅色": "#a87", "暗色": "#5a3"},
    "自然蓝系": {"主色": "#6a8", "辅色": "#8ca", "暗色": "#3c6"}
}
```

### 7.3 与现有系统集成点

| 现有文件 | 集成方式 |
|---------|---------|
| `tests/e2e/utils/phaser-helper.ts` | 截图控制器复用其游戏启动、状态访问方法 |
| `docs/superpowers/specs/2026-04-05-visual-design-v1.0.md` | 评估服务读取视觉规范作为参考 |
| `src/ui/*.ts` (18个UI组件) | 修改执行器的主要修改目标 |
| `.env` | 配置管理读取Qwen VL API配置 |

---

## 8. 执行命令

### 8.1 启动验收

```bash
# 进入项目目录
cd /home/lixiang/Desktop/zhongyi_game_v3

# 启动视觉验收
python scripts/visual_acceptance/run_acceptance.py

# 或指定参数
python scripts/visual_acceptance/run_acceptance.py \
  --max-iterations 3 \
  --output-dir reports/visual_acceptance/2026-04-15
```

### 8.2 查看报告

```bash
# 查看最新验收报告
cat reports/visual_acceptance/2026-04-15/summary_report.md

# 查看修改日志
cat reports/visual_acceptance/2026-04-15/modification_log.md

# 查看某场景评估详情
cat reports/visual_acceptance/2026-04-15/evaluation_reports/NPC-02.json
```

### 8.3 用户验收后操作

```bash
# 确认通过，合并dev分支
git checkout main
git merge dev
git branch -d dev

# 或回滚修改
git checkout main
git branch -D dev
```

---

## 9. 设计原则

### 9.1 安全优先

- 所有修改在dev分支进行，不影响主分支
- 编译和测试双重验证
- 提供完整回滚机制
- 用户最终验收确认

### 9.2 职责分离

- 截图控制器：专注游戏交互和截图
- 评估服务：专注AI分析和评分
- 修改执行器：专注代码变更
- 流程协调器：专注整体编排

### 9.3 渐进优化

- 分轮次处理不同优先级问题
- 每轮迭代后重新评估验证效果
- 设置最大轮次防止无限循环

### 9.4 可扩展性

- 评估维度可配置调整
- 截图场景清单可扩展
- 支持切换不同多模态模型
- 报告格式标准化便于后续分析

---

## 10. 验收时机

本系统在Phase 2功能完成后（S1-S13全部完成）统一执行，验收全部UI、场景、Sprite、整体氛围。

后续可手动触发验收单个改动，或定期运行确保视觉质量持续达标。

---

*本设计文档由Claude Code生成，待用户确认后进入实现计划阶段。*