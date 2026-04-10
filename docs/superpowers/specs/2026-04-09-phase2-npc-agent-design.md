# 药灵山谷 - Phase 2: NPC Agent 系统设计

**版本**: v2.0
**日期**: 2026-04-10
**状态**: 设计完成，待评审

---

## 1. 设计哲学

### 1.1 核心认知转变

| 传统游戏NPC | AI Agent NPC |
|------------|-------------|
| 被动执行预设逻辑的木偶 | 有自主意识的数字生命 |
| 玩家触发 → NPC响应 | NPC有目标、日程、情感 |
| 静态对话树 | 动态生成教学内容 |
| 任务是数据 | 任务是教学手段 |
| 记忆是变量 | 记忆是演变的认知 |

### 1.2 "有灵魂的NPC"定义

一个真正有灵魂的NPC应该具备：

| 维度 | 定义 | Hermes对应 |
|-----|------|-----------|
| **身份认同** | 我是谁？我的专业？我的性格？ | SOUL.md |
| **记忆系统** | 我对这个学生了解什么？ | USER.md |
| **教学大纲** | 我要教什么？教学计划是什么？ | SYLLABUS.md (Skill) |
| **任务管理** | 学生学到哪了？下一步学什么？ | TASKS.json + Tools |
| **自主行动** | 我能主动发起什么？ | Cron + Tools |

---

## 2. NPC 角色设计

### 2.1 多导师体系

玩家是唯一的学生，但有多个老师，每个老师负责不同领域：

| NPC | 专长领域 | 教学内容 |
|-----|---------|---------|
| **青木先生** | 伤寒论 | 解表药 + 外感类疾病 |
| **老张** | 药材种植 | 药材辨识、种植、炮制 |
| **（未来）李大夫** | 金匮要略 | 杂病诊治 |
| **（未来）王药师** | 本草学 | 药材鉴别、产地认知 |

### 2.2 青木先生详细设定

**身份**：百草镇唯一的中医师，三代行医

**专长**：伤寒论，外感病诊治

**教学内容**：解表类方剂（桂枝汤、麻黄汤、银翘散、桑菊饮）

**教学大纲范围**：
- 方剂组成与功效
- 辨证论治（风寒表实 vs 表虚 vs 风热）
- 选方用药

---

## 3. 文件结构设计

### 3.1 NPC文件组织

```
~/.hermes/
├── npcs/
│   ├── qingmu/                      # 青木先生
│   │   ├── SOUL.md                  # 身份设定
│   │   ├── MEMORY.md                # 教学心得（通用）
│   │   ├── USER.md                  # 对玩家的观察
│   │   ├── SYLLABUS.md              # 教学大纲
│   │   └── TASKS.json               # 任务状态
│   │
│   ├── laozhang/                    # 老张
│   │   ├── SOUL.md
│   │   ├── MEMORY.md
│   │   ├── USER.md
│   │   ├── SYLLABUS.md
│   │   └── TASKS.json
│   │
│   └── [更多NPC...]
│
└── skills/
    └── tcm-knowledge/               # 中医知识库
        ├── prescriptions/           # 方剂知识
        ├── herbs/                   # 药材知识
        └── diagnosis/               # 诊断知识
```

### 3.2 文件职责说明

| 文件 | 类型 | 职责 | 更新频率 |
|-----|------|------|---------|
| SOUL.md | 静态 | NPC身份、性格、说话风格 | 很少更新 |
| MEMORY.md | 动态 | NPC的教学心得、方法论 | 定期更新 |
| USER.md | 动态 | 对玩家的观察、学习特点 | 每次交互后 |
| SYLLABUS.md | 静态 | 教学大纲、知识结构 | 很少更新 |
| TASKS.json | 动态 | 任务列表、进度状态 | 任务变化时 |

---

## 4. 教学大纲设计 (SYLLABUS.md)

### 4.1 大纲结构

教学大纲采用**网状结构**，知识点之间有多重关联，NPC可动态决策学习路径。

```markdown
# 青木先生教学大纲 - 解表类方剂

## 教学目标
使学生掌握解表类方剂的组成、功效、主治及辨证应用

## 知识模块

### 模块1：桂枝汤
- 类型：prescription
- 难度：基础
- 内容：
  - 组成：桂枝、芍药、甘草、生姜、大枣
  - 功效：解肌发表，调和营卫
  - 主治：风寒表虚证
- 依赖：无
- 解锁：桂枝汤学习完成后，解锁麻黄汤、银翘散

### 模块2：麻黄汤
- 类型：prescription
- 难度：基础
- 内容：
  - 组成：麻黄、桂枝、杏仁、甘草
  - 功效：发汗解表，宣肺平喘
  - 主治：风寒表实证
- 依赖：桂枝汤
- 关联对比：与桂枝汤对比（有汗无汗）

### 模块3：银翘散
- 类型：prescription
- 难度：进阶
- 内容：
  - 组成：金银花、连翘、薄荷、荆芥...
  - 功效：辛凉透表，清热解毒
  - 主治：风热表证
- 依赖：桂枝汤
- 关联对比：辛温 vs 辛凉

### 模块4：风寒表虚证
- 类型：diagnosis
- 难度：基础
- 辨证要点：
  - 恶风发热、汗出、脉浮缓
  - 舌淡苔薄白
- 对应方剂：桂枝汤

### 模块5：风寒表实证
- 类型：diagnosis
- 难度：基础
- 辨证要点：
  - 恶寒重、发热轻、无汗、脉浮紧
- 对应方剂：麻黄汤

### 模块6：风热表证
- 类型：diagnosis
- 难度：进阶
- 辨证要点：
  - 发热重、恶寒轻、咽痛、脉浮数
- 对应方剂：银翘散

## 学习路径建议

```
入门路径：桂枝汤 → 风寒表虚证 → 辨证实践
进阶路径：麻黄汤 → 风寒表实证 → 对比学习
综合路径：银翘散 → 风热表证 → 综合诊治
```

## 任务模板

### 方剂学习任务
- 学习组成 → 煎药游戏
- 学习功效 → 选择题 + 问答
- 学习主治 → 辨证游戏

### 辨证学习任务
- 问诊训练 → 诊治游戏（问诊环节）
- 切脉训练 → 诊治游戏（脉诊环节）
- 舌诊训练 → 诊治游戏（舌诊环节）
- 综合辨证 → 诊治游戏（辨证环节）+ 对话论述

### 选方学习任务
- 证型对应 → 诊治游戏（选方环节）
- 方剂鉴别 → 对话讨论

### 综合诊治任务
- 完整诊治流程 → 诊治游戏（全流程）
```

---

## 5. 任务系统设计 (TASKS.json)

### 5.1 任务数据结构

```json
{
  "npc_id": "qingmu",
  "player_id": "player_001",
  "last_updated": "2026-04-10T14:30:00Z",

  "task_templates": {
    "guizhi_tang_basic": {
      "title": "桂枝汤基础学习",
      "category": "prescription",
      "description": "学习桂枝汤的组成、功效和主治",
      "prerequisites": [],
      "knowledge_modules": ["guizhi-tang-composition", "guizhi-tang-effect"],
      "estimated_lessons": 3,
      "importance": "core"
    },
    "guizhi_tang_diagnosis": {
      "title": "桂枝汤辨证应用",
      "category": "diagnosis",
      "description": "学会辨析桂枝汤证的脉症",
      "prerequisites": ["guizhi_tang_basic"],
      "knowledge_modules": ["guizhi-tang-syndrome"],
      "estimated_lessons": 2,
      "importance": "core"
    }
  },

  "tasks": [
    {
      "task_id": "guizhi_tang_basic_001",
      "template_id": "guizhi_tang_basic",
      "status": "completed",
      "progress": 1.0,
      "created_at": "2026-04-08T10:00:00Z",
      "completed_at": "2026-04-08T14:00:00Z",
      "lessons_completed": 3,
      "mastery_score": 0.85
    },
    {
      "task_id": "guizhi_tang_diagnosis_001",
      "template_id": "guizhi_tang_diagnosis",
      "status": "in_progress",
      "progress": 0.5,
      "created_at": "2026-04-09T10:00:00Z",
      "current_lesson": 1,
      "lessons_completed": 1,
      "next_milestone": "理解风寒表虚的脉象特点"
    },
    {
      "task_id": "review_guizhi_20260410",
      "template_id": null,
      "type": "temporary",
      "trigger": "weakness_detected",
      "title": "桂枝汤组成复习",
      "description": "玩家对桂枝汤组成记忆不牢，需要复习",
      "status": "pending",
      "created_at": "2026-04-10T09:00:00Z",
      "related_weakness": "guizhi-tang-composition",
      "expires_at": "2026-04-12T09:00:00Z"
    }
  ],

  "current_focus": {
    "primary_task_id": "guizhi_tang_diagnosis_001",
    "primary_todo": "理解风寒表虚的脉象特点",
    "secondary_task_ids": ["review_guizhi_20260410"]
  },

  "statistics": {
    "total_tasks": 5,
    "completed": 1,
    "in_progress": 1,
    "pending": 3,
    "mastery_average": 0.85,
    "weak_areas": ["guizhi-tang-composition"]
  }
}
```

### 5.2 任务工具定义

```python
# ========== 任务查询工具 ==========

@tool
def get_task_list(status: str = "all") -> dict:
    """
    获取任务列表

    Args:
        status: "all" | "pending" | "in_progress" | "completed"

    Returns:
        {
            "tasks": [{task_id, title, status, progress, category}],
            "statistics": {...}
        }
    """
    pass

@tool
def get_current_task() -> dict:
    """
    获取当前进行中的任务

    Returns:
        {task_id, title, progress, current_lesson, next_milestone, remaining_lessons}
    """
    pass

@tool
def get_task_detail(task_id: str) -> dict:
    """获取任务详情"""
    pass


# ========== 任务状态更新工具 ==========

@tool
def update_task_status(
    task_id: str,
    status: str,
    progress_delta: float = None,
    lesson_completed: bool = False,
    mastery_score: float = None,
    notes: str = None
) -> dict:
    """
    更新任务状态

    Returns:
        {success, new_status, new_progress, unlocked_tasks}
    """
    pass

@tool
def set_current_task(task_id: str) -> bool:
    """设置当前主攻任务"""
    pass


# ========== 任务创建工具 ==========

@tool
def create_task(
    title: str,
    description: str,
    category: str,
    task_type: str = "planned",
    trigger: str = None,
    prerequisites: list = None,
    knowledge_modules: list = None,
    estimated_lessons: int = 1,
    expires_at: str = None,
    related_weakness: str = None
) -> dict:
    """创建新任务"""
    pass

@tool
def create_review_task(
    weakness_area: str,
    reason: str,
    urgency: str = "normal"
) -> dict:
    """创建复习任务（便捷方法）"""
    pass


# ========== 任务统计工具 ==========

@tool
def get_learning_statistics() -> dict:
    """
    获取学习统计

    Returns:
        {
            total_lessons, completed_tasks, mastery_average,
            weak_areas, recent_progress, recommended_next
        }
    """
    pass
```

### 5.3 任务触发机制

| 触发类型 | 说明 | 示例 |
|---------|------|------|
| **大纲驱动** | 前置任务完成后自动解锁 | 桂枝汤基础完成 → 桂枝汤辨证解锁 |
| **定时任务(Cron)** | 定期课程或复习提醒 | 每天早上检查复习需求 |
| **玩家行为触发** | 玩家主动请求 | 玩家进入诊所、询问学习内容 |
| **薄弱点检测** | AI检测到学习问题 | 连续3次答错 → 创建复习任务 |
| **随机事件** | 增加趣味性 | 随机病人来诊，实践机会 |

---

## 6. 游戏系统设计

**核心原则：任务是游戏操作，而非对话**

### 6.1 任务类型与游戏映射

| 任务类型 | 游戏玩法 | 考核内容 | NPC角色 |
|---------|---------|---------|---------|
| **方剂学习** | 煎药游戏 | 组成、剂量、配伍、特殊煎法 | 布置任务、评判 |
| **辨证学习** | 诊治游戏（问诊+切脉+舌诊） | 收集信息、判断证型 | 提供病人、指导 |
| **选方学习** | 诊治游戏（选方环节） | 证型→方剂对应 | 点评选择理由 |
| **综合诊治** | 完整诊治流程 | 全流程 | 综合点评 |
| **药材辨识** | 药园观察 / 图鉴收集 | 药材外观、产地 | 发布任务、考教 |
| **种植实践** | 种植游戏 | 归经、四气、五味 | 发布任务、考教 |
| **炮制实践** | 炮制游戏 | 炮制方法、辅料、操作 | 发布任务、评判 |
| **复习巩固** | 任意游戏 | 薄弱点重复练习 | 发现薄弱点、布置复习 |

---

## 7. 诊治游戏设计

### 7.1 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                      诊治小游戏                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   展示层 (Presentation)                                     │
│   ├── 场景渲染（诊所、病人、诊台）                          │
│   ├── UI组件（问诊面板、脉诊面板、舌诊面板、辨证面板）       │
│   ├── 动画效果（病人表情、脉象动画、舌象展示）              │
│   └── 反馈提示（正确/错误、进度、得分）                     │
│                                                             │
│   交互层 (Interaction)                                      │
│   ├── 问诊交互（点击问诊项目）                              │
│   ├── 切脉交互（阅读古文描述，推理脉象）                    │
│   ├── 舌诊交互（观察舌象、选择特征）                        │
│   ├── 辨证交互（选择证型 + 对话论述）                       │
│   └── 选方交互（选择方剂）                                  │
│                                                             │
│   逻辑层 (Logic)                                            │
│   ├── 病案生成（随机/预设病案）                             │
│   ├── 信息收集（记录玩家收集的症状）                        │
│   ├── 判断逻辑（辨证是否正确）                              │
│   ├── 评分系统（操作分、准确分、论述分）                    │
│   └── 结果输出（得分、点评、解锁内容）                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 7.2 诊治流程

```
┌─────────┐    问诊完成     ┌─────────┐    切脉完成     ┌─────────┐
│  问诊   │ ──────────────→ │  切脉   │ ──────────────→ │  舌诊   │
└─────────┘                 └─────────┘                 └─────────┘
                                 │                           │
                                 ▼                           ▼
                           ┌─────────┐                ┌─────────┐
                           │ 辨证   │←───────────────│ 舌诊   │
                           │+论述   │                 └─────────┘
                           └─────────┘
                                 │
                                 ▼
                           ┌─────────┐
                           │  选方   │
                           └─────────┘
                                 │
                                 ▼
                           ┌─────────┐
                           │  结果   │
                           └─────────┘
```

### 7.3 脉诊设计：古文描述 + 推理判断

**设计理念**：
- 不模拟切脉动作（无法真实体验）
- 用经典古文描述脉象
- 玩家阅读理解 + 推理判断
- 增加"跟师抄方"的真实感

**界面设计**：
```
┌─────────────────────────────────────────────────────────────┐
│  切脉 - 青木先生指导                                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  病人脉象描述（古文）：                                      │
│  ┌─────────────────────────────────────────────────────┐  │
│  │   "脉来浮取即得，重按稍减，                           │  │
│  │    如水上漂木，按之有余，举之有余，                    │  │
│  │    来去怠缓，一息四至。"                              │  │
│  │   —— 摘自《脉经》                                    │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
│  你的理解：                                                  │
│  脉位：○ 浮脉  ○ 沉脉  （轻取即得，如水上漂木）            │
│  脉势：○ 紧脉  ○ 缓脉  ○ 数脉  （来去怠缓，一息四至）      │
│                                                             │
│  [查看脉诀] [确认判断]                                       │
└─────────────────────────────────────────────────────────────┘
```

**脉象古文库示例**：

| 脉象 | 古文描述 | 出处 |
|-----|---------|------|
| 浮脉 | "浮脉法天，轻手可得，泛泛在上，如水漂木。" | 《濒湖脉学》 |
| 沉脉 | "沉行筋骨，如石投水，按之有余，举之不足。" | 《脉经》 |
| 数脉 | "数脉一息六至，脉流薄疾。" | 《难经》 |
| 缓脉 | "缓脉四至，来往和匀，微风轻飐，初春杨柳。" | 《濒湖脉学》 |
| 紧脉 | "紧脉有力，左右弹指，如绞转索，如切绳转。" | 《脉经》 |

### 7.4 辨证论述环节

**设计理念**：
- 选择题可能猜对
- 对话考核真实理解
- 培养辨证思维表达

**界面设计**：
```
┌─────────────────────────────────────────────────────────────┐
│  辨证论述                                                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  青木先生：                                                  │
│  "你已经收集了这些信息。在开方之前，                         │
│   先说说你的辨证思路——这是什么证？为什么？"                  │
│                                                             │
│  你的回答：                                                  │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  我认为这是风寒表虚证。                              │  │
│  │  理由是：病人恶风发热，说明有表证；                   │  │
│  │  但是有汗出，不是表实，因为表实应该无汗；             │  │
│  │  脉浮缓也符合表虚的特点...                           │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
│  [提交回答]                                                  │
└─────────────────────────────────────────────────────────────┘
```

**AI评分机制**：

| 评分维度 | 说明 | 权重 |
|---------|------|------|
| 关键词匹配 | 必须包含证型、关键症状 | 30% |
| 逻辑推理 | 症状→证型的推导是否合理 | 40% |
| 表达完整性 | 是否解释清楚原因 | 30% |

---

## 8. 煎药游戏设计

### 8.1 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                      煎药小游戏                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   展示层 (Presentation)                                     │
│   ├── 场景渲染（煎药台、药罐、火炉）                        │
│   ├── 药材展示（药材架、药材卡片）                          │
│   ├── 动画效果（火焰、水沸腾、药材投入）                    │
│   └── 状态指示（水位、火候、时间、得分）                    │
│                                                             │
│   交互层 (Interaction)                                      │
│   ├── 药材拖拽（从药材架拖到药罐）                          │
│   ├── 配伍放置（将药材拖到君臣佐使位置）                    │
│   ├── 顺序控制（决定投入顺序）                              │
│   ├── 火候调节（文火/武火切换）                             │
│   └── 时间控制（开始/结束煎煮）                             │
│                                                             │
│   逻辑层 (Logic)                                            │
│   ├── 方剂验证（组成是否正确）                              │
│   ├── 配伍验证（君臣佐使是否正确）                          │
│   ├── 顺序验证（先煎/后下是否正确）                         │
│   ├── 禁忌检查（十八反、十九畏）                            │
│   └── 评分系统（各维度评分）                                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 8.2 煎药流程

```
选择方剂
    │
    ▼
┌─────────────┐
│ 配伍考核    │  将药材拖到君臣佐使位置
└──────┬──────┘
       │
       ├── 错误 → 提示修正
       │
       ▼
┌─────────────┐
│ 选择药材    │  从药材架选择正确药材和用量
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ 控制顺序    │  按正确顺序投入药罐（先煎/后下）
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ 控制火候    │  选择文火/武火
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ 煎煮计时    │  等待正确时间
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ 完成出锅    │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ 评分结算    │
└─────────────┘
```

### 8.3 评分维度

| 维度 | 说明 | 权重 |
|-----|------|------|
| 配伍正确 | 君臣佐使位置正确 | 40% |
| 组成正确 | 药材选择和用量正确 | 20% |
| 顺序正确 | 先煎后下顺序正确 | 20% |
| 火候正确 | 文火/武火选择正确 | 10% |
| 时间正确 | 煎煮时间合适 | 10% |

### 8.4 配伍考核界面

```
┌─────────────────────────────────────────────────────────────┐
│  配伍考核 - 桂枝汤                                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  请将药材拖到对应位置：                                      │
│                                                             │
│  君药 (主药)：[桂枝] ✓ 解肌发表，散风寒                     │
│  臣药 (辅药)：[芍药] ✓ 敛阴和营，止汗                       │
│  佐药 (协调)：[生姜] [大枣] ✓ 助桂枝解表，助芍药和营        │
│  使药 (调和)：[甘草] ✓ 调和诸药                             │
│                                                             │
│  配伍得分：95分                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 9. 炮制游戏设计

### 9.1 炮制方法分类

| 方法 | 操作 | 药效变化 | 代表药材 |
|-----|------|---------|---------|
| **炒** | 清炒/麸炒/土炒 | 增强健脾/缓和药性 | 白术、山药 |
| **炙** | 蜜炙/酒炙/醋炙/盐炙 | 改变归经/增强功效 | 黄芪、当归、柴胡 |
| **煅** | 明煅/煅淬 | 易于粉碎/降低毒性 | 牡蛎、龙骨 |
| **蒸** | 清蒸/酒蒸/醋蒸 | 改变药性/便于切片 | 熟地、黄精 |
| **煮** | 水煮/醋煮/甘草煮 | 降低毒性 | 川乌、附子 |

### 9.2 炮制流程

```
选择药材
    │
    ▼
┌─────────────┐
│ 选择方法    │  根据药材显示可选炮制方法
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ 配料        │  选择辅料种类和用量
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ 预处理      │  洗润/切片/闷润等
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ 炮制操作    │  根据方法不同：炒/炙/煅/蒸
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ 判断终点    │  观察颜色、质地变化
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ 出锅冷却    │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ 质量评价    │  评分 + 点评 + 考教
└─────────────┘
```

### 9.3 炮制评分

| 维度 | 说明 | 权重 |
|-----|------|------|
| 方法选择 | 炮制方法是否适合目标功效 | 25% |
| 辅料配比 | 辅料用量是否合适 | 25% |
| 操作过程 | 火候、时间、翻炒等操作 | 25% |
| 成品质量 | 颜色、质地、气味是否达标 | 25% |

### 9.4 炮制考教（问答环节）

```
┌─────────────────────────────────────────────────────────────┐
│  炮制考教                                                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  老张：                                                      │
│  "麻黄生用和蜜炙用，有什么区别？                             │
│   什么情况应该用蜜麻黄？"                                    │
│                                                             │
│  你的回答：                                                  │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  生麻黄发汗解表力强，用于风寒表实；                  │  │
│  │  蜜麻黄发汗力减弱，润肺力增强。                      │  │
│  │  应该在表证已解、或者肺虚喘咳时使用蜜麻黄...         │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
│  [提交回答]                                                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 10. 种植任务线设计

### 10.1 任务线流程

```
阶段1：药材辨识（获得种子）
├── 方式A：老张教学辨识（看图辨认 → 正确后获得种子）
├── 方式B：图鉴收集（探索收集药材卡片 → 兑换种子）
└── 方式C：任务奖励（完成学习任务 → NPC赠送种子）
         ↓
阶段2：种植（学习药材属性）
├── 选择地块（归经）
├── 选择水源（四气）
├── 选择肥料（五味）
└── 等待生长
         ↓
阶段3：收获考教
├── 选择题考教（基础）
├── 自由问答考教（深度）
└── 放入药袋（分类）
         ↓
阶段4：炮制（可选）
├── 选择炮制方法
├── 操作炮制
└── 获得炮制品
         ↓
阶段5：使用
├── 煎药（用于诊治游戏）
└── 入库（仓库系统）
```

### 10.2 种植评分

| 操作环节 | 正确选择 | 得分 | 学习记忆点 |
|---------|---------|------|-----------|
| 选择区域 | 对应归经区 | +20 | 药材归经 |
| 选择水源 | 对应四气 | +20 | 药材四气 |
| 选择肥料 | 对应五味 | +20 | 药材五味 |
| 考教功效 | 正确分类 | +20 | 功效分类 |
| 放入药袋 | 正确药袋 | +20 | 功效-药袋对应 |

---

## 11. 与 Hermes Agent 对应关系

| NPC能力 | Hermes机制 | 文件/配置 |
|--------|-----------|----------|
| 身份认同 | Personality | `npcs/*/SOUL.md` |
| 教学心得 | Memory | `npcs/*/MEMORY.md` |
| 学生观察 | User Profile | `npcs/*/USER.md` |
| 教学大纲 | Skills | `npcs/*/SYLLABUS.md` |
| 任务管理 | Tools | `npcs/*/TASKS.json` + 任务工具 |
| 主动行动 | Cron | 定时任务配置 |
| 对话交互 | API Server | `:8642/v1/chat/completions` |

---

## 12. 实现优先级

| 优先级 | 功能 | 说明 |
|-------|------|------|
| **P0** | 基础对话系统 | SOUL.md + USER.md + API集成 |
| **P0** | 任务系统工具 | get_task_list, update_task_status, create_task |
| **P0** | 诊治游戏（核心） | 问诊 + 古文脉诊 + 舌诊 + 辨证论述 + 选方 |
| **P1** | 煎药游戏 | 组成 + 配伍考核 + 顺序 |
| **P1** | 种植游戏 | 辨识 → 种植 → 考教 |
| **P2** | 炮制游戏 | 方法选择 + 操作 + 考教 |
| **P2** | Cron日程 | 定时主动行为 |

---

## 13. 视觉呈现方案

### 13.1 设计理念

**核心目标**：
- 让游戏场景视觉上接近真实中医场景
- 使用AI生图降低素材制作成本
- 最小化复杂场景的抠图工作量

**策略**：**「AI生成背景 + 简单元素叠加」**

### 13.2 场景分层方案

| 场景类型 | 背景层 | 交互层 | 素材来源 |
|---------|--------|--------|---------|
| **诊治场景** | AI生成全景诊所 | 病人、诊台UI叠加 | 背景：AI生图；UI：简单瓦片 |
| **煎药场景** | AI生成煎药台全景 | 药材卡片、火候指示器 | 背景：AI生图；卡片：AI生成图标 |
| **炮制场景** | AI生成炮制台全景 | 操作按钮、进度条 | 背景：AI生图；按钮：简单图标 |
| **种植场景** | 使用现有药园场景 | 药田网格、状态指示 | 复用Phase 1.5素材 |

### 13.3 AI生图策略

#### 诊治场景

**背景Prompt模板**：
```
古代中医诊所内部场景，像素风格，32x32瓦片尺寸，
温馨木质诊台，墙上挂经络图，药柜整齐排列，
阳光从窗户洒入，有药炉在角落，
中国传统风格，治愈系田园氛围，2D游戏场景
```

**交互元素**：
- 病人角色：简化像素人物（可复用）
- 问诊面板：UI层（纯代码绘制）
- 脉诊古文：文字展示（无需素材）
- 舌象展示：AI生成舌象图（单张图片）

#### 煎药场景

**背景Prompt模板**：
```
古代煎药台场景，像素风格，陶瓷药罐放在火炉上，
旁边有药材架，各种药材包整齐摆放，
火焰微微跳动，水汽袅袅升起，
中国传统风格，温馨厨房氛围，2D游戏场景
```

**交互元素**：
- 药材卡片：AI生成药材图标（批量生成）
- 君臣佐使框：UI层（代码绘制）
- 火候图标：简单像素图标（手工绘制或AI生成）

#### 炮制场景

**背景Prompt模板**：
```
古代药材炮制工作台，像素风格，
木质操作台，上面有炒锅、蒸笼、各种辅料罐，
旁边有切药刀、筛子、晾药架，
中国传统风格，工匠氛围，2D游戏场景
```

**交互元素**：
- 辅料选择：AI生成辅料图标
- 炮制过程：简化动画（火焰、翻炒）
- 成品展示：AI生成炮制前后对比图

### 13.4 最小化抠图策略

**问题**：传统像素游戏需要大量抠图工作

**解决方案**：

| 元素类型 | 处理方式 | 工作量 |
|---------|---------|--------|
| **全景背景** | AI直接生成完整场景，无需抠图 | 最低 |
| **UI面板** | 代码绘制（CSS/Canvas），无需素材 | 最低 |
| **药材卡片** | AI生成带背景的卡片，整体使用 | 低 |
| **病人角色** | 使用简化像素人（可复用模板） | 低 |
| **动态元素** | 简化动画帧（火焰、水汽等） | 中 |

**具体实施**：

```typescript
// 诊治场景渲染方案
class DiagnosisScene {
  // 背景层：AI生成的全景图（无需抠图）
  background: Phaser.GameObjects.Image;

  // UI层：代码绘制的面板
  diagnosisPanel: Phaser.GameObjects.Container;

  // 病人：简化像素模板（可复用）
  patient: Phaser.GameObjects.Sprite;

  // 文字：直接渲染（无需素材）
  pulseText: Phaser.GameObjects.Text;
}
```

### 13.5 AI生图流程

**Step 1：生成全景背景**
```bash
# 使用 Seed Image API 生成场景全景
curl -X POST https://ark.cn-beijing.volces.com/api/v3/images/generations \
  -H "Authorization: Bearer $SEED_IMAGE_KEY" \
  -d '{
    "model": "doubao-seedream-4-5-251128",
    "prompt": "[场景Prompt]",
    "size": "1024x768",
    "style": "pixel-art-chinese-tcm"
  }'
```

**Step 2：生成元素图标**
```bash
# 批量生成药材图标
for herb in ["桂枝", "芍药", "甘草", "生姜", "大枣"]; do
  generate_herb_icon(herb)
done
```

**Step 3：整合到游戏**
```typescript
// 加载AI生成的素材
this.load.image('diagnosis-bg', 'assets/generated/diagnosis_scene.png');
this.load.image('herb-guizhi', 'assets/generated/herbs/guizhi.png');
```

### 13.6 素材管理结构

```
public/assets/
├── generated/                     # AI生成素材
│   ├── scenes/                    # 场景全景
│   │   ├── diagnosis_scene.png
│   │   ├── decoction_scene.png
│   │   └── processing_scene.png
│   ├── herbs/                     # 材图标
│   │   ├── guizhi.png
│   │   ├── shaoyao.png
│   │   ├── gancao.png
│   │   └── ...
│   ├── tongue/                    # 舌象图
│   │   ├── normal_tongue.png
│   │   ├── red_tongue.png
│   │   ├── pale_tongue.png
│   │   └── ...
│   └── processed/                 # 炮制前后对比
│       ├── raw_mahuang.png
│       ├── honey_mahuang.png
│       └── ...
│
├── ui/                            # UI元素（代码绘制或简单图标）
│   ├── fire_icon.png              # 火候图标
│   ├── water_icon.png             # 水源图标
│   └── ...
│
└── sprites/                       # 可复用像素角色
    ├── patient_template.png       # 病人模板
    ├── npc_template.png           # NPC模板
    └── ...
```

---

## 14. 游戏系统与 Hermes 接驳方案

### 14.1 架构设计

```
┌─────────────────────────────────────────────────────────────────────┐
│                        游戏系统 (Phaser)                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   游戏场景                                                          │
│   ├── 诊治游戏                                                      │
│   ├── 煎药游戏                                                      │
│   ├── 炮制游戏                                                      │
│   └── 种植游戏                                                      │
│                                                                     │
│   └──────────────────────┬─────────────────────────────────────────┤
│                          │                                          │
│                          ▼                                          │
│   ┌───────────────────────────────────────────────────────────────┐│
│   │              游戏结果处理器 (GameResultHandler)                ││
│   │  ├── 收集玩家操作数据                                          ││
│   │  ├── 计算得分                                                  ││
│   │  ├── 生成结果报告                                              ││
│   │  └── 调用 Hermes API                                          ││
│   └───────────────────────────────────────────────────────────────┘│
│                          │                                          │
└──────────────────────────┼──────────────────────────────────────────┘
                           │
                           ▼ HTTP API
┌─────────────────────────────────────────────────────────────────────┐
│                    Hermes Agent Server (:8642)                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   API 端点                                                          │
│   ├── POST /v1/chat/completions     # NPC对话                      │
│   ├── POST /v1/tools/execute        # 工具调用                     │
│   └── POST /v1/game/result          # 游戏结果反馈 (新增)          │
│                                                                     │
│   NPC 系统                                                          │
│   ├── 青木先生 Agent                                                │
│   │   ├── SOUL.md                                                  │
│   │   ├── MEMORY.md                                                │
│   │   ├── USER.md                                                  │
│   │   ├── SYLLABUS.md                                              │
│   │   └── TASKS.json                                               │
│   └── 老张 Agent                                                    │
│       ├── ...                                                       │
│                                                                     │
│   工具系统                                                          │
│   ├── get_task_list                                                │
│   ├── update_task_status                                           │
│   ├── create_task                                                  │
│   └── record_game_result (新增)                                    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 14.2 游戏结果数据结构

```typescript
interface GameResult {
  // 基本信息
  game_type: 'diagnosis' | 'decoction' | 'processing' | 'planting';
  npc_id: string;                    // 对应的NPC
  timestamp: string;

  // 任务关联
  task_id?: string;                  // 关联的任务ID
  lesson_id?: string;                // 关联的课程ID

  // 玩家操作详情
  player_actions: {
    // 诊治游戏
    diagnosis?: {
      symptoms_collected: string[];  // 问诊收集的症状
      pulse_interpretation: {        // 脉诊理解
        text: string;                // 古文描述
        player_answer: string;       // 玩家判断
        correct: boolean;
      };
      tongue_observation: string[];  // 舌诊观察
      syndrome_selected: string;     // 辨证选择
      syndrome_reasoning: string;    // 辨证论述（自由回答）
      prescription_selected: string; // 选方
    };

    // 煎药游戏
    decoction?: {
      prescription: string;          // 目标方剂
      composition_correct: boolean;  // 组成是否正确
      compatibility: {               // 配伍考核
        monarch: string;             // 君药
        minister: string;            // 臣药
        assistant: string[];         // 佐药
        envoy: string;               // 使药
        score: number;
      };
      sequence_correct: boolean;     // 顺序是否正确
      fire_control_correct: boolean; // 火候是否正确
      time_correct: boolean;         // 时间是否正确
    };

    // 炮制游戏
    processing?: {
      herb: string;                  // 药材
      method: string;                // 炮制方法
      auxiliary: string;             // 辅料
      quality_score: number;         // 成品质量分
      qanda: {                       // 问答考教
        question: string;
        answer: string;
        score: number;
      };
    };

    // 种植游戏
    planting?: {
      herb: string;
      region_selected: string;       // 归经区选择
      water_selected: string;        // 水源选择（四气）
      fertilizer_selected: string;   // 肥料选择（五味）
      harvest_success: boolean;
      category_correct: boolean;     // 分类是否正确
    };
  };

  // 得分
  scores: {
    total: number;
    breakdown: {                     // 各维度得分
      [dimension: string]: number;
    };
  };

  // 薄弱点标记
  weaknesses?: string[];             // 发现的知识薄弱点
}
```

### 14.3 Hermes API 接口设计

#### 新增端点：游戏结果反馈

```python
# Hermes Agent Server 新增接口

@router.post("/v1/game/result")
async def receive_game_result(result: GameResult):
    """
    接收游戏结果，更新NPC的观察记录和任务状态

    Args:
        result: 游戏结果数据

    Returns:
        {
            "success": true,
            "npc_response": "NPC的点评反馈",
            "task_updated": {...},
            "weakness_detected": [...]
        }
    """
    # 1. 更新 USER.md（玩家观察）
    user_profile = load_user_profile(result.npc_id)
    user_profile.add_observation(
        f"玩家完成{result.game_type}游戏，得分{result.scores.total}",
        timestamp=result.timestamp
    )

    # 2. 记录薄弱点
    if result.weaknesses:
        user_profile.add_weakness(result.weaknesses)

    # 3. 更新任务状态
    if result.task_id:
        update_task_status(
            task_id=result.task_id,
            progress_delta=calculate_progress(result),
            mastery_score=result.scores.total / 100,
            notes=f"游戏得分：{result.scores.total}"
        )

    # 4. 生成NPC反馈
    npc_feedback = generate_feedback(result)

    # 5. 检查是否需要创建复习任务
    if result.weaknesses and len(result.weaknesses) > 0:
        create_review_task(
            weakness_area=result.weaknesses[0],
            reason=f"游戏表现不佳，得分{result.scores.total}"
        )

    return {
        "success": True,
        "npc_response": npc_feedback,
        "task_updated": get_task_detail(result.task_id),
        "weakness_detected": result.weaknesses
    }


@tool
def record_game_result(result: dict) -> dict:
    """
    NPC主动调用此工具记录玩家游戏结果

    用途：在对话中NPC可以查询玩家的游戏表现
    """
    # 存储到数据库/文件
    # 更新记忆
    return {"success": True, "recorded": True}


@tool
def query_player_performance(game_type: str = None) -> dict:
    """
    NPC查询玩家的游戏表现历史

    Args:
        game_type: 指定游戏类型，不指定则返回全部

    Returns:
        {
            "recent_games": [...],
            "average_score": 85,
            "weak_areas": [...],
            "strong_areas": [...]
        }
    """
    pass
```

### 14.4 游戏结果处理器实现

```typescript
// src/systems/GameResultHandler.ts

export class GameResultHandler {
  private hermesApiUrl: string = 'http://localhost:8642';

  /**
   * 发送游戏结果到 Hermes
   */
  async submitResult(result: GameResult): Promise<GameResultResponse> {
    try {
      const response = await fetch(`${this.hermesApiUrl}/v1/game/result`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result)
      });

      return await response.json();
    } catch (error) {
      console.error('Failed to submit game result:', error);
      throw error;
    }
  }

  /**
   * 计算进度增量
   */
  private calculateProgressDelta(result: GameResult): number {
    // 根据游戏类型和得分计算进度
    const baseProgress = 0.1; // 每次游戏基础进度
    const scoreBonus = result.scores.total / 1000; // 得分加成
    return Math.min(baseProgress + scoreBonus, 0.3);
  }

  /**
   * 分析薄弱点
   */
  private analyzeWeaknesses(result: GameResult): string[] {
    const weaknesses: string[] = [];

    // 检查各维度得分，低于70分标记为薄弱点
    for (const [dimension, score] of Object.entries(result.scores.breakdown)) {
      if (score < 70) {
        weaknesses.push(dimension);
      }
    }

    return weaknesses;
  }
}
```

### 14.5 NPC对话触发游戏

```typescript
// src/systems/NpcInteractionHandler.ts

export class NpcInteractionHandler {
  /**
   * NPC发起游戏任务
   */
  async startGameTask(npcId: string, taskType: string): Promise<void> {
    // 1. 从 Hermes 获取当前任务
    const currentTask = await this.getCurrentTask(npcId);

    // 2. 根据任务类型启动对应游戏场景
    switch (taskType) {
      case 'diagnosis':
        this.scene.start('DiagnosisGameScene', { npcId, task: currentTask });
        break;
      case 'decoction':
        this.scene.start('DecoctionGameScene', { npcId, task: currentTask });
        break;
      case 'processing':
        this.scene.start('ProcessingGameScene', { npcId, task: currentTask });
        break;
    }
  }

  /**
   * 游戏结束后NPC点评
   */
  async showNpcFeedback(result: GameResult): Promise<void> {
    // 1. 发送结果到 Hermes
    const response = await gameResultHandler.submitResult(result);

    // 2. 显示NPC点评对话框
    this.showDialog({
      npcId: result.npc_id,
      text: response.npc_response,
      type: 'feedback'
    });

    // 3. 更新任务进度显示
    if (response.task_updated) {
      this.updateTaskProgressUI(response.task_updated);
    }
  }
}
```

---

## 15. 玩家操作结果反馈机制

### 15.1 反馈流程

```
玩家操作
    │
    ▼
┌─────────────┐
│ 游戏场景    │  收集操作数据
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ 结果计算    │  计算得分、分析薄弱点
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ API调用     │  POST /v1/game/result
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────────────────┐
│ Hermes Agent                                        │
├─────────────────────────────────────────────────────┤
│ 1. 更新 USER.md（玩家观察）                         │
│    - 记录玩家完成的游戏                              │
│    - 记录得分和表现                                  │
│    - 记录薄弱点                                      │
│                                                     │
│ 2. 更新 TASKS.json                                  │
│    - 更新任务进度                                    │
│    - 更新掌握程度                                    │
│                                                     │
│ 3. 生成 NPC 反馈                                    │
│    - 根据表现生成点评                                │
│    - 针对薄弱点给出建议                              │
│                                                     │
│ 4. 检查复习需求                                     │
│    - 发现薄弱点 → 创建复习任务                       │
│    - 连续失败 → 创建强化任务                        │
│                                                     │
│ 5. 更新 MEMORY.md                                   │
│    - NPC教学方法改进                                 │
│    - 教学心得总结                                    │
└─────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────┐
│ 游戏显示    │  NPC点评、任务更新提示
└─────────────┘
```

### 15.2 NPC自动创建复习任务

**触发条件**：
- 同一知识点连续3次得分低于70分
- 辨证论述中出现关键错误
- 药材配伍反复错误

**复习任务类型**：

| 原始薄弱点 | 复习任务 | 游戏形式 |
|-----------|---------|---------|
| 辨证错误 | 辨证强化训练 | 简化诊治（只做辨证） |
| 配伍错误 | 配伍专项训练 | 简化煎药（只做配伍） |
| 脉诊理解错误 | 脉诊古文训练 | 脉诊专项练习 |
| 药材辨识错误 | 药材辨识强化 | 图片辨认游戏 |

### 15.3 USER.md 自动更新示例

```markdown
# 青木先生对玩家的观察

## 基本信息
- 玩家ID: player_001
- 学习天数: 15天
- 当前任务: 桂枝汤辨证应用

## 学习表现记录

### 2026-04-10 14:30 - 诊治游戏
- 游戏类型: 诊断
- 得分: 82分
- 辨证正确: ✓
- 辨证论述: "我认为这是风寒表虚证，理由是..."（85分）
- 选方正确: ✓（桂枝汤）
- **观察**: 玩家辨证思路清晰，论述表达能力较好

### 2026-04-10 15:00 - 煎药游戏
- 游戏类型: 煎药
- 方剂: 桂枝汤
- 得分: 75分
- 配伍得分: 90分（君臣佐使正确）
- 组成得分: 60分（芍药用量错误）
- **薄弱点**: 药材用量记忆不准确
- **建议**: 加强药材剂量学习

## 薄弱点汇总
- [low] 药材用量记忆 - 出现2次错误
- [medium] 脉诊古文理解 - 出现1次错误

## 学习特点分析
- 辨证思维较强（论述得分平均85分）
- 配伍理解较好（配伍得分平均90分）
- 药材记忆需要加强（组成得分波动大）
- 适合通过重复练习巩固药材知识
```

---

## 16. Cron 定时任务设计

### 16.1 NPC主动行为

**设计理念**：NPC不仅是被动响应，还能主动发起行动

| 定时任务 | 时间 | NPC行为 | 游戏效果 |
|---------|------|---------|---------|
| **晨间问候** | 每天8:00 | NPC主动问候，提醒今日学习 | 增加沉浸感 |
| **复习提醒** | 每天10:00 | 检查薄弱点，提醒复习 | 学习巩固 |
| **新课解锁** | 任务完成后 | NPC通知新任务解锁 | 进度推进 |
| **实践机会** | 随机 | NPC通知有病人来诊 | 实战练习 |
| **节日问候** | 特定日期 | 节日祝福、特殊活动 | 节日氛围 |

### 16.2 Cron 配置

```yaml
# ~/.hermes/crons.yaml

npcs:
  qingmu:
    - name: morning greeting
      schedule: "0 8 * * *"
      action: send_message
      message_template: "早上好，今天天气不错，正好学习{current_task}"

    - name: review reminder
      schedule: "0 10 * * *"
      action: check_weakness
      condition: "weakness_count > 0"
      message_template: "我注意到你在{weak_area}还有些薄弱，要不要复习一下？"

    - name: patient visit
      schedule: "0 */3 * * *"  # 每3小时
      action: create_random_patient
      probability: 0.3
      message_template: "有位病人来诊了，这是个实践的好机会！"

  laozhang:
    - name: morning greeting
      schedule: "0 7 * * *"
      action: send_message
      message_template: "早起干活咯，药田里的{current_herb}长得不错"

    - name: harvest reminder
      schedule: "0 18 * * *"
      action: check_harvest_ready
      message_template: "药田里的{ready_herb}可以收获了"
```

---

## 17. 实现计划

### 17.1 开发阶段

| 阶段 | 内容 | 优先级 | 预计工作量 |
|-----|------|-------|-----------|
| **阶段0** | Hermes Agent 基础配置 | P0 | 配置NPC文件结构 |
| **阶段1** | 基础对话系统 | P0 | API集成、对话UI |
| **阶段2** | 任务系统工具 | P0 | 实现任务工具、TASKS.json管理 |
| **阶段3** | 诊治游戏核心 | P0 | 问诊+脉诊+舌诊+辨证+选方 |
| **阶段4** | 游戏结果反馈 | P0 | API端点、USER.md更新 |
| **阶段5** | 煎药游戏 | P1 | 配伍考核+煎药流程 |
| **阶段6** | 种植游戏 | P1 | 辨识→种植→考教 |
| **阶段7** | 炮制游戏 | P2 | 炮制流程+考教 |
| **阶段8** | Cron定时任务 | P2 | NPC主动行为 |
| **阶段9** | 视觉优化 | P2 | AI生图、素材整合 |

### 17.2 技术栈确认

| 层面 | 技术选型 | 说明 |
|-----|---------|------|
| 游戏引擎 | Phaser 3 | 已有Phase 1基础 |
| NPC后端 | Hermes Agent | API Server模式 |
| AI对话 | GLM API | .env已配置 |
| AI生图 | Seed Image API | .env已配置 |
| 图像理解 | Qwen VL | .env已配置 |
| 数据存储 | JSON文件 | Hermes文件系统 |

---

## 18. 待确认事项

- [ ] Hermes Agent API Server 是否已支持工具调用扩展？
- [ ] 是否需要实现 Hermes Gateway 接入其他平台？
- [ ] Cron定时任务是否与游戏时间系统同步？

---

*本文档创建于 2026-04-09*
*更新于 2026-04-10：添加游戏系统详细设计、视觉呈现方案、接驳方案*