# 药灵山谷 - Phase 2: NPC Agent 系统补充设计 - Phase 2 AI核心改造

**版本**: v1.0
**日期**: 2026-04-11
**状态**: Phase 2 设计完成，待评审
**基于**: 2026-04-09-phase2-npc-agent-design.md

---

## 设计目标

Phase 2 聚焦核心的"AI驱动"改造，将问诊环节从固定选择题改为AI自由追问形式，验证AI能力是否能满足教学需求。

**风险等级**: 高 - 涉及AI能力验证
**验收标准**: 完成后需实际验证AI驱动的问诊体验

---

## 1. 问诊环节重构

### 1.1 设计理念转变

**原文档**：固定6问类别 → 选择问题 → 获得预设答案

**新设计**：AI病人 + 自由追问 → 后台追踪关键信息 → 解密游戏感

### 1.2 问诊流程重构

```
病人（AI NPC）进门 → AI自主描述主诉 → 玩家自由追问 → AI实时回答
                                    ↓
                            后台追踪关键信息获取状态
                                    ↓
                            必须线索收集齐 → 玩家确认 → 进入切脉环节
```

### 1.3 界面设计

```
┌─────────────────────────────────────────────────────────────┐
│  问诊 - 张三（农夫，35岁）                                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [张三头像]                                                 │
│  "大夫，我昨天冒雨干活后，就开始怕冷│ ← 流式输出              │
│   发热，身上一点汗都没有..."                                 │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ 你的追问：                                              │ │
│  │                                                         │ │
│  │ [输入框 - 自由输入]                                     │ │
│  │                                                         │ │
│  │ 常用问题提示：                                          │ │
│  │ [怕冷程度?] [出汗情况?] [咳嗽吗?] [口渴吗?]             │ │
│  │                                                         │ │
│  │ [发送] [停止生成]                                       │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  收集进度：                                                  │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ 必须线索：                                              │ │
│  │ ☑ 恶寒重  ☑ 无汗  ☑ 发热轻  ☐ 脉象（切脉环节）         │ │
│  │                                                         │ │
│  │ 辅助线索：                                              │ │
│  │ ☑ 身痛  ☑ 头痛  ☐ 口渴情况  ☐ 起病原因                 │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  [完成问诊，进入切脉]                                        │
└─────────────────────────────────────────────────────────────┘
```

### 1.4 病人AI NPC设计

#### 1.4.1 病人模板结构

病人是临时角色，不需要完整Agent文件，临时组装：

```json
// patient-templates/farmer.json
{
  "template_id": "farmer",
  "occupation": "农夫",
  "speaking_style": "朴实直白",
  "age_range": [25, 50],
  "example_phrases": {
    "greeting": "大夫，您帮忙看看...",
    "complaint_intro": "昨天在地里干活...",
    "pain_description": "疼得厉害，像..."
  }
}
```

#### 1.4.2 病人模板列表（一期）

| 模板ID | 职业 | 说话风格 | 特点 |
|-------|------|---------|------|
| farmer | 农夫 | 朴实直白 | 可能描述干活场景 |
| merchant | 商人 | 文雅客气 | 可能描述旅途劳累 |
| scholar | 书生 | 略带书卷气 | 可能描述读书久坐 |
| elder | 老人 | 缓慢虚弱 | 可能强调体质虚弱 |
| child | 儿童 | 简单直接 | 可能不会准确描述症状 |

#### 1.4.3 病人动态生成

```typescript
// 调用 Hermes 时不创建Agent文件，直接传入上下文
const response = await hermes.chat({
  context: {
    patient_template: "农夫朴实直白风格",
    case_info: {
      syndrome: "风寒表实证",
      chief_complaint: "昨天冒雨干活后怕冷发热无汗...",
      required_clues: ["恶寒重", "无汗", "脉浮紧"],
      auxiliary_clues: ["身痛", "头痛", "起病原因"]
    }
  },
  user_message: "你怕冷还是怕热？",
  stream: true  // 流式输出
});
```

### 1.5 关键信息追踪机制

#### 1.5.1 线索层级

| 层级 | 定义 | 作用 |
|-----|------|------|
| **必须线索** | 辨证必需的关键信息 | 收集齐后才能进入下一环节 |
| **辅助线索** | 加深理解、增强诊断准确性 | 不强制，收集可获得经验值 |

#### 1.5.2 AI语义分析流程

每轮追问后，调用AI判断各线索是否已获取：

```python
@tool
def analyze_clue_collection(
    dialogue_history: list,
    clue_definitions: dict
) -> dict:
    """
    分析对话记录，判断关键线索是否已获取

    Args:
        dialogue_history: 本轮对话记录 [{player: "...", patient: "..."}]
        clue_definitions: 线索定义 {required: [...], auxiliary: [...]}

    Returns:
        {
            "恶寒重": True,   # 已获取
            "无汗": True,     # 已获取
            "发热程度": False, # 未获取
            "身痛": True,     # 辅助线索已获取
            ...
        }
    """
    pass
```

**判断方式**: 纯AI语义分析，每轮对话后实时返回每个线索的true/false状态。

#### 1.5.3 问诊结束条件

1. 所有必须线索收集完成
2. 弹出确认提示：
   ```
   ┌─────────────────────────────────────────────────────────────┐
   │  已收集关键信息，可以进入切脉环节。                         │
   │                                                             │
   │  你收集了 3 条辅助线索，可获得额外经验值。                   │
   │                                                             │
   │  [完成问诊] [继续追问辅助线索]                               │
   └─────────────────────────────────────────────────────────────┘
   ```

### 1.6 辅助线索激励

收集辅助线索可获得：
- **经验值增加**
- **成就/徽章解锁**（如"细致问诊"成就）

---

## 2. 病案系统设计

### 2.1 病案文件结构

```
src/data/
├── cases/
│   ├── core_cases.json        # 核心教学病案（4-6个）
│   └── free_cases.json        # 自由练习病案（可选）
│
├── patient-templates/
│   ├── farmer.json            # 农夫模板
│   ├── merchant.json          # 商人模板
│   ├── scholar.json           # 书生模板
│   ├── elder.json             # 老人模板
│   └── child.json             # 儿童模板
│
└── patient-heads/             # 预缓存头像
    ├── farmer_1.png
    ├── farmer_2.png
    ├── farmer_3.png
    ...（共15张）
```

### 2.2 病案数据结构

```typescript
interface CaseRecord {
  // 基本信息
  case_id: string;
  case_type: "core" | "free";  // 核心教学 or 自由练习

  // 解锁依赖
  blocked_by: string | null;   // Task ID，null表示自由解锁

  // 证型信息
  syndrome: {
    type: string;              // "风寒表实证"
    category: string;          // "风寒外感"
  };

  // 方剂信息
  prescription: {
    name: string;              // "麻黄汤"
    alternatives: string[];    // 可接受的替代方剂
  };

  // 主诉模板
  chief_complaint_template: string;

  // 关键线索定义
  clues: {
    required: string[];        // 必须线索
    auxiliary: string[];       // 辅助线索
  };

  // 难度
  difficulty: "easy" | "normal" | "hard";

  // 教学备注
  teaching_notes: {
    key_points: string[];
    common_mistakes: string[];
  };
}
```

### 2.3 病案解锁机制

```json
// 核心病案示例 - 与Task绑定
{
  "case_id": "case_001",
  "case_type": "core",
  "blocked_by": "mahuang-tang-learning",  // 完成麻黄汤学习后解锁
  "syndrome": { "type": "风寒表实证" },
  "prescription": { "name": "麻黄汤" },
  "clues": {
    "required": ["恶寒重", "无汗", "脉浮紧"],
    "auxiliary": ["身痛", "头痛", "起病原因", "口渴情况"]
  }
}

// 自由练习病案示例 - 无前置依赖
{
  "case_id": "case_free_001",
  "case_type": "free",
  "blocked_by": null,  // 随时可玩
  ...
}
```

### 2.4 病案库界面

**触发方式**：进入诊所后与青木先生交互

```
┌─────────────────────────────────────────────────────────────┐
│  青木先生："要看之前的病案记录吗？"                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  病案记录：                                                  │
│ ┌───────────────────────────────────────────────────────┐  │
│ │ ☑ case_001 风寒表实证-麻黄汤    85分  [查看详情]        │  │
│ │ ☑ case_002 风寒表虚证-桂枝汤    78分  [查看详情]        │  │
│ │ ● case_003 风热犯卫证-银翘散   进行中  [继续诊治]       │  │
│ │ ☐ case_004 风温咳嗽证-桑菊饮   未解锁  [查看解锁条件]   │  │
│ │ ☐ case_free_001 综合练习1     未解锁                    │  │
│ └───────────────────────────────────────────────────────┘  │
│                                                             │
│  [返回]                                                      │
└─────────────────────────────────────────────────────────────┘
```

### 2.5 病案记录保存

只保存关键信息摘要，不保存全量对话：

```typescript
interface CaseHistoryRecord {
  case_id: string;
  completed_at: string;

  // 得分
  score: {
    total: number;
    inquiry: number;      // 问诊得分
    pulse: number;        // 脉诊得分
    tongue: number;       // 舌诊得分
    syndrome: number;     // 辨证得分
    prescription: number; // 选方得分
  };

  // 收集情况
  clues_collected: {
    required: string[];   // 已收集必须线索
    auxiliary: string[];  // 已收集辅助线索
  };

  // 辨证论述原文
  syndrome_reasoning: string;

  // NPC点评原文
  npc_feedback: string;
}
```

---

## 3. Hermes集成设计

### 3.1 自动启动机制

游戏启动时自动启动Hermes Python服务：

```typescript
// 游戏启动流程
async function startGame() {
  // 1. 检查Hermes是否已运行
  const hermesRunning = await checkHermesAvailable();

  if (!hermesRunning) {
    // 2. 启动Hermes Python进程
    const hermesProcess = spawn('python', ['hermes_server.py'], {
      cwd: hermesDir,
      detached: false
    });

    // 3. 等待Hermes就绪
    await waitForHermesReady(30000);  // 最大等待30秒
  }

  // 4. 启动游戏前端
  startPhaserGame();
}
```

### 3.2 API可用性检查

```typescript
async function checkHermesAvailable(): Promise<boolean> {
  try {
    const response = await fetch('http://localhost:8642/health', {
      timeout: 5000
    });
    return response.ok;
  } catch {
    return false;
  }
}
```

**启动失败处理**：
```
┌─────────────────────────────────────────────────────────────┐
│  无法启动AI服务                                              │
│                                                             │
│  请检查：                                                    │
│  1. Python环境是否正确安装                                   │
│  2. Hermes依赖是否安装                                       │
│                                                             │
│  [查看帮助] [重试]                                           │
└─────────────────────────────────────────────────────────────┘
```

**设计原则**: AI是核心，必须保证可用，失败则无法运行（无降级策略）。

### 3.3 通信协议

**HTTP + SSE流式输出**：

```typescript
// 流式对话调用
async function chatStream(
  context: object,
  userMessage: string,
  onChunk: (text: string) => void
): Promise<void> {
  const response = await fetch('http://localhost:8642/v1/chat/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ context, user_message: userMessage })
  });

  // SSE处理
  const reader = response.body.getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = new TextDecoder().decode(value);
    onChunk(chunk);  // 逐块回调
  }
}
```

---

## 4. 流式输出UI设计

### 4.1 逐字显示

```
┌─────────────────────────────────────────────────────────────┐
│  张三：                                                      │
│                                                             │
│  "大夫，我昨天冒雨干活后，就开始怕冷│ ← 文字逐步出现（50ms间隔）│
│                                                             │
│  [停止生成] ← 可中断流式输出                                 │
└─────────────────────────────────────────────────────────────┘
```

**效果**: 简单逐字显示（后续有素材再增加打字机效果、头像动画）

---

## 5. 病人视觉表现

### 5.1 AI动态生成头像

根据病人描述生成头像，每次体验不同：

```typescript
// 生成头像
async function generatePatientHead(
  template: string,  // "农夫"
  age: number,       // 35
  gender: string     // "male"
): Promise<string> {
  const prompt = `${age}岁${gender === 'male' ? '男性' : '女性'}${template}头像，像素风格`;
  const imageUrl = await seedImageApi.generate(prompt);
  return imageUrl;
}
```

### 5.2 预缓存策略

核心5个模板各预生成3个变体（共15张），游戏启动时加载：

```
patient-heads/
├── farmer_1.png, farmer_2.png, farmer_3.png
├── merchant_1.png, merchant_2.png, merchant_3.png
├── scholar_1.png, scholar_2.png, scholar_3.png
├── elder_1.png, elder_2.png, elder_3.png
├── child_1.png, child_2.png, child_3.png
```

**使用逻辑**：
- 游戏开始时随机选择预缓存头像
- 病案回顾时复用同一头像（缓存生成结果）

---

## 6. 诊治游戏场景过渡

### 6.1 触发流程

```
玩家进入诊所 → 弹出确认框 → 玩家确认 → 切换到诊治游戏场景

确认框内容：
┌─────────────────────────────────────────────────────────────┐
│  今日病案                                                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  病案类型：风寒表实证（简单）                                │
│  学习目标：麻黄汤辨证应用                                    │
│                                                             │
│  青木先生："这位病人是典型的风寒表实证，来试试吧？"           │
│                                                             │
│  [开始诊治] [查看病案详情] [稍后再说]                        │
└─────────────────────────────────────────────────────────────┘
```

### 6.2 场景切换

```
ClinicScene（正常诊所）→ 翻认开始 → DiagnosisGameScene（诊治游戏）
诊治完成 → NPC点评 → 返回 ClinicScene
```

---

## 7. 数据存储位置

```
zhongyi_game_v3/
├── src/data/                   # 游戏资产数据
│   ├── cases/                  # 病案数据
│   ├── patient-templates/      # 病人模板
│   ├── patient-heads/          # 预缓存头像
│   └ └── save.json             # 存档文件（Phase 2设计）
│
├── hermes/                     # Hermes后端（集成在游戏内）
│   ├── npcs/                   # NPC Agent文件
│   │   ├── qingmu/
│   │   └── laozhang/
│   └── skills/                 # 知识库
│
└── （运行时）
    Hermes workdir = zhongyi_game_v3/src/data/
```

---

## 8. 实现优先级

| 优先级 | 功能 | 说明 |
|-------|------|------|
| **P0** | 问诊环节重构 | AI病人 + 自由追问 + 线索追踪 |
| **P0** | 病案系统 | 病案库 + 解锁 + 回顾界面 |
| **P0** | Hermes自动启动 | 内嵌Python进程 + API检查 |
| **P0** | 流式输出 | SSE + 停止按钮 |
| **P1** | 病人头像 | AI生成 + 预缓存 |

---

## 9. Phase 2 验收标准

完成Phase 2 后需验证：

| 验收项 | 标准 |
|-------|------|
| **问诊自由追问** | 玩家可以自由输入问题，AI能合理回答 |
| **线索追踪准确性** | AI能正确识别玩家获取的关键信息 |
| **流式输出流畅性** | 文字逐字显示，可中断 |
| **病案解锁正确性** | blocked_by字段正确控制解锁 |
| **Hermes自动启动** | 游戏启动时自动启动Hermes |
| **病人头像生成** | 能根据模板+年龄+性别生成头像 |

---

## 10. 待确认事项

- [ ] 病人模板具体内容是否需要更丰富？
- [ ] 预缓存头像数量是否足够？

---

*Phase 2 设计文档创建于 2026-04-11*
*聚焦AI核心改造，验证成功后进入Phase 2.5*