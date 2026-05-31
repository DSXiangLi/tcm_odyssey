# NPC自主Agent系统设计文档

**日期**: 2026-05-19
**阶段**: Phase 2.5 续（DialogUI集成后扩展）
**分支**: hermes_dev
**最后更新**: 2026-05-19

---

## 一、问题定义

### 1.1 当前状态

Phase 2.5 已完成 DialogUI HTML嵌入，NPC具备基础对话能力：

| 能力 | 状态 | 实现位置 |
|------|------|----------|
| SSE流式对话 | ✅ 已有 | DialogUI.tsx + SSEClient |
| MCP工具调用 | ✅ 已有 | 6个游戏工具 + tools-guide策略 |
| 对话历史存储 | ✅ 已有 | GameStateBridge |
| NPC人格定义 | ✅ 已有 | SOUL.md + MEMORY.md |
| 评分反馈模板 | ✅ 已有 | feedback-evaluation/SKILL.md |

**当前缺失**：
- ❌ 游戏侧无法将诊断结果注入NPC对话上下文
- ❌ NPC无法主动触发心跳检查玩家进度
- ❌ 诊断评分计算未实现

### 1.2 核心问题

**如何让NPC从"被动对话"升级为"自主Agent"，能够主动操纵游戏、获取状态、发布任务、给出反馈？**

---

## 二、核心场景定义

### 2.1 三个核心场景（优先级确认）

| 优先级 | 场景 | 触发时机 | NPC行为 |
|--------|------|----------|---------|
| **P0** | 诊断结束→NPC点评 | DiagnosisScene完成5阶段后 | 分析用户辨证思路，调用feedback-evaluation生成点评 |
| **P0** | 对话开始自动查询 | 玩家靠近NPC按空格键 | 自动调用get_npc_memory + get_learning_progress，个性化开场 |
| **P1** | 心跳检查→任务发布 | 进入诊所场景时 | 检查进度/背包，触发trigger_minigame或发布新任务 |

**排除场景**（用户确认不需要）：
- 煎药结束→NPC反馈：煎药是纯操作小游戏，无需点评
- 炮制结束→NPC反馈：炮制是纯操作小游戏，无需点评

---

## 三、系统架构

### 3.1 架构概览

```
┌─────────────────────────────────────────────────────────────────┐
│                        游戏引擎侧                                │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────────┐ │
│  │ DiagnosisScene │  │  ClinicScene   │  │ GameStateBridge   │ │
│  │  (诊断完成)    │  │  (心跳触发)    │  │ (状态桥接)        │ │
│  └───────└───────┘  └───────└───────┘  └───────└───────────────┘ │
│        │                   │                   │                │
│        ↓                   ↓                   ↓                │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              NPCFeedbackBridge (新增)                       │ │
│  │  - 组装诊断上下文 (用户答案 + 正确答案 + 评分)              │ │
│  │  - 触发NPC对话UI并注入context参数                           │ │
│  └────────────────────────────────────────────────────────────┘ │
│        │                                                         │
│        ↓                                                         │
│  ┌────────────────┐  ┌────────────────┐                         │
│  │ DiagnosisScorer│  │ NPCHeartbeat   │                         │
│  │  (评分计算)    │  │  (心跳检查)    │                         │
│  └────────────────┘  └────────────────┘                         │
└─────────────────────────┬───────────────────────────────────────┘
                          │ DialogUI (SSE + context注入)
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│                        Hermes侧                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              tools-guide/SKILL.md (小改)                    │ │
│  │  - 策略1: 对话开始自动查询 (已有，无需改动)                 │ │
│  │  - 策略6: 游戏结果反馈模式 (新增说明)                       │ │
│  │    "当对话携带gameContext时，按feedback-evaluation生成点评" │ │
│  └────────────────────────────────────────────────────────────┘ │
│        │                                                         │
│        ↓                                                         │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────────┐ │
│  │feedback-eval   │  │ get_npc_memory │  │ get_learning_      │ │
│  │uation/SKILL.md │  │    (MCP tool)  │  │   progress (MCP)   │ │
│  │    (已有)      │  │    (已有)      │  │      (已有)        │ │
│  └────────────────┘  └────────────────┘  └────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 双端协作分工

**设计原则**：NPC负责决策，游戏负责执行

| 侧 | 职责 | 实现内容 |
|---|------|----------|
| **Hermes侧** | 决策逻辑 | skills定义触发策略 + MCP工具提供数据接口 |
| **游戏侧** | 执行逻辑 | 评分计算 + 心跳触发 + 上下文组装 |

**复用现有skill**（无需新增）：

| Skill | 覆盖场景 | 改动需求 |
|-------|----------|----------|
| `feedback-evaluation/SKILL.md` | 诊断结束点评 | 无需改动，已完整定义评分反馈模板 |
| `tools-guide/SKILL.md` 策略1 | 对话开始自动查询 | 无需改动 |
| `tools-guide/SKILL.md` 策略2/5 | 心跳检查任务发布 | 小改：补充"游戏注入context时的处理方式" |

---

## 四、游戏侧新增组件

### 4.1 DiagnosisScorer（评分计算器）

**职责**：计算诊断游戏得分，对比用户答案与正确答案

**接口定义**：

```typescript
// src/utils/DiagnosisScorer.ts

interface DiagnosisScoreResult {
  totalScore: number;           // 总分（0-100）
  breakdown: {
    tongue: { score: number; errors: string[] };    // 舌诊评分
    pulse: { score: number; errors: string[] };     // 脉诊评分
    syndrome: { score: number; errors: string[] };  // 辨证评分
    prescription: { score: number; errors: string[] }; // 选方评分
  };
  overallErrors: string[];      // 主要错误汇总
}

export function calculateDiagnosisScore(
  userResult: DiagnosisResult,      // 用户诊断结果（从DiagnosisUI state获取）
  correctCase: DiagnosisCase        // 原始病案正确答案
): DiagnosisScoreResult;

export function formatScoreForNPC(result: DiagnosisScoreResult): string;
// 格式化为NPC可理解的上下文文本

/**
 * correctCase参数来源说明：
 *
 * 方式一（推荐）：从DiagnosisScene.caseData获取
 * - DiagnosisScene在init时已通过getCaseById(caseId)获取病案数据
 * - handleDiagnosisComplete时直接传入this.caseData
 *
 * 方式二（备用）：通过EventBus查询CaseManager
 * - EventBus.emit('GET_CASE_DATA', { caseId })
 * - CaseManager响应并返回DiagnosisCase
 *
 * 采用方式一，因为数据已在场景内，无需额外查询。
 */
```

**评分权重**：

| 阶段 | 权重 | 匹配规则 |
|------|------|----------|
| 舌诊 | 20% | 舌色+舌苔+舌型+润燥完全匹配 |
| 脉诊 | 20% | 脉位+脉势完全匹配 |
| **问诊** | **不计分** | 收集的症状线索作为辨证参考，不直接评分 |
| 辨证 | 40% | 证型选项匹配正确答案 |
| 选方 | 20% | 方剂选择匹配正确答案 |

**问诊不计分原因**：问诊是信息收集阶段，症状线索的正确性由辨证环节验证。收集到关键线索（如"无汗"）会间接影响辨证评分。

### 4.2 NPCHeartbeat（心跳检查机制）

**职责**：在特定时机触发NPC检查玩家状态

**触发时机定义**：

| 时机 | 实现位置 | 触发行为 |
|------|----------|----------|
| 进入诊所场景 | ClinicScene.create() | NPC后台调用get_inventory + get_learning_progress |
| 对话开始前 | DialogUI挂载时 | 已由tools-guide策略1覆盖 |
| 完成诊断后 | DiagnosisScene.handleDiagnosisComplete() | 触发NPCFeedbackBridge |

**后台调用实现方式**：

心跳检查采用"预查询+静默注入"机制：
```
ClinicScene.create() → NPCHeartbeat.triggerOnSceneEnter()
        ↓
调用MCP工具（通过GameStateBridge缓存）：
  - get_inventory(player_id) → 缓存到 bridge.inventoryCache
  - get_learning_progress(player_id) → 缓存到 bridge.progressCache
        ↓
玩家触发对话时 → DialogUI从缓存读取数据
        ↓
NPC收到cached数据 → 判断是否需要主动发言
```

**优势**：避免对话开始时的工具调用延迟，数据已预加载。

**心跳无变化场景处理**：
- 进度/背包无变化 → NPC不主动发言，等待玩家触发
- 有变化但未达标 → NPC在对话开始时提及（如"上次提到的麻黄汤，你准备好了吗？"）
- 达标触发任务 → NPC主动弹出DialogUI（通过EventBus.emit('NPC_TRIGGER_DIALOG')）

**接口定义**：

```typescript
// src/systems/NPCHeartbeat.ts

export class NPCHeartbeat {
  private static instance: NPCHeartbeat;

  static getInstance(): NPCHeartbeat;

  // 场景进入时触发
  triggerOnSceneEnter(playerId: string): void;

  // 对话开始时触发（由DialogUI调用）
  triggerOnDialogStart(playerId: string): void;
}
```

### 4.3 NPCFeedbackBridge（反馈桥接器）

**职责**：组装游戏结果为NPC对话上下文，触发对话UI

**接口定义**：

```typescript
// src/ui/html/bridge/npc-feedback-bridge.ts

export interface GameContextForNPC {
  type: 'diagnosis' | 'heartbeat';

  // diagnosis类型专用字段
  diagnosisResult?: {
    caseId: string;
    patientName: string;
    userAnswers: DiagnosisResult;
    correctAnswers: DiagnosisCase;
    score: DiagnosisScoreResult;
  };

  // heartbeat类型专用字段
  heartbeatData?: {
    inventory: InventoryState;
    progress: LearningProgress;
    cases: CaseProgress;
  };
}

export function triggerNPCFeedback(context: GameContextForNPC): void;
// 组装上下文 → 触发DialogUI → NPC根据context生成响应
```

**与DialogUI集成**：

```typescript
// 扩展showDialogUI接口
export interface DialogUIOptions {
  npcId: string;
  npcName: string;
  playerId: string;
  onToolCall?: (name: string, args: Record<string, unknown>) => void;
  onClose?: () => void;

  // 新增参数
  gameContext?: GameContextForNPC;  // 游戏注入的上下文
  mode?: 'normal' | 'feedback';     // 对话模式
}
```

---

## 五、Hermes侧改动

### 5.1 tools-guide/SKILL.md 小改

**新增策略6：游戏结果反馈模式**

```markdown
### 策略6：游戏结果反馈模式

**触发条件**：对话携带gameContext参数

**NPC行为**：
1. 检测gameContext.type
2. 根据type调用对应skill：
   - 'diagnosis' → 使用feedback-evaluation生成点评
   - 'heartbeat' → 分析进度数据，判断是否触发任务
3. 点评中调用record_weakness记录薄弱点（如有）

**示例**：
```
gameContext: {
  type: 'diagnosis',
  diagnosisResult: {
    score: { totalScore: 75, breakdown: {...} },
    ...
  }
}
→ NPC: "辨证方向正确，麻黄汤选方得当。但你的论述中遗漏了'脉紧'的意义..."
```
```

### 5.2 DialogUI.tsx 改动

**新增gameContext处理**：

```typescript
// src/ui/html/DialogUI.tsx

export const DialogUI: React.FC<DialogUIProps> = ({
  npcId,
  npcName,
  playerId,
  gameContext,  // 新增
  mode,         // 新增
  onToolCall,
  onClose
}) => {

  // 如果携带gameContext，首条消息直接注入
  useEffect(() => {
    if (gameContext && mode === 'feedback') {
      const contextPrompt = formatGameContextPrompt(gameContext);
      // 发送给NPC作为初始prompt
      sendInitialContext(contextPrompt);
    }
  }, [gameContext]);

  ...
};

function formatGameContextPrompt(context: GameContextForNPC): string {
  if (context.type === 'diagnosis') {
    const { patientName, score, userAnswers } = context.diagnosisResult!;
    return `[诊断结果反馈请求]
患者：${patientName}
评分：${score.totalScore}分
详情：
- 舌诊：${score.breakdown.tongue.score}分 ${score.breakdown.tongue.errors.join(',')}
- 脉诊：${score.breakdown.pulse.score}分 ${score.breakdown.pulse.errors.join(',')}
- 辨证：${score.breakdown.syndrome.score}分
- 选方：${score.breakdown.prescription.score}分

用户答案：${JSON.stringify(userAnswers.diagnosis)}

请按feedback-evaluation技能标准给出点评。`;
  }
  // heartbeat类型类似处理...
}
```

---

## 六、数据流详解与格式定义

### 6.1 场景A：诊断结束 → NPC点评

#### 数据流转时序

```
┌──────────────────────────────────────────────────────────────────────┐
│ 时间线: T0 → T1 → T2 → T3 → T4                                       │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│ T0: DiagnosisUI完成5阶段                                             │
│     └─→ 输出: DiagnosisResult (用户答案)                             │
│         见下方格式A1                                                  │
│                                                                      │
│ T1: DiagnosisScene.handleDiagnosisComplete()                        │
│     └─→ 调用 DiagnosisScorer.calculate(userResult, this.caseData)    │
│         └─→ 输出: DiagnosisScoreResult (评分结果)                    │
│             见下方格式A2                                              │
│                                                                      │
│ T2: NPCFeedbackBridge.triggerNPCFeedback()                          │
│     └─→ 组装 GameContextForNPC                                       │
│         └─→ 输出: 完整上下文包                                        │
│             见下方格式A3                                              │
│                                                                      │
│ T3: DialogUI注入contextPrompt                                        │
│     └─→ 调用 sendInitialContext(contextPrompt)                       │
│         └─→ 输出: SSE请求体                                           │
│             见下方格式A4                                              │
│                                                                      │
│ T4: Hermes NPC生成点评                                               │
│     └─→ 响应: SSE文本流                                               │
│         └─→ 输出: 点评文本                                            │
│             见下方格式A5                                              │
└──────────────────────────────────────────────────────────────────────┘
```

#### 数据格式定义

**格式A1: DiagnosisResult（用户答案）**

```typescript
// 来源: DiagnosisUI.tsx state → onComplete回调
{
  caseId: "case-001",
  patient: {
    name: "李秀梅",
    age: 35,
    gender: "女",
    chief: "脘腹胀满、食欲不振半月余"
  },
  diagnosis: {
    tongue: {
      color: "淡红",        // 用户选择的舌色
      coating: "白腻",      // 用户选择的舌苔
      shape: "胖大",        // 用户选择的舌型
      moisture: "润滑"      // 用户选择的润燥
    },
    pulse: {
      position: "中",       // 用户选择的脉位
      quality: "濡"         // 用户选择的脉势
    },
    symptoms: [
      "脘腹胀满",
      "食欲不振",
      "身倦体重"
    ],                      // 问诊阶段收集的症状线索
    syndrome: ["湿阻中焦"], // 用户选择的证型（可多选）
    prescription: ["平胃散"] // 用户选择的方剂
  }
}
```

**格式A2: DiagnosisScoreResult（评分结果）**

```typescript
// 来源: DiagnosisScorer.calculate() 返回
{
  totalScore: 75,           // 总分（0-100）
  breakdown: {
    tongue: {
      score: 20,            // 舌诊满分20分
      errors: []            // 正确无错误
    },
    pulse: {
      score: 15,            // 脉诊得分15分（扣5分）
      errors: ["脉势应为'缓'而非'濡'"]
    },
    syndrome: {
      score: 30,            // 辨证得分30分（扣10分）
      errors: ["遗漏'脾虚'证型"]
    },
    prescription: {
      score: 10,            // 选方得分10分（扣10分）
      errors: ["应选'健脾丸'配合平胃散"]
    }
  },
  overallErrors: [
    "脉诊: 脉势应为'缓'而非'濡'",
    "辨证: 遗漏'脾虚'证型",
    "选方: 应选'健脾丸'配合平胃散"
  ]
}
```

**格式A3: GameContextForNPC（完整上下文包）**

```typescript
// 来源: NPCFeedbackBridge.triggerNPCFeedback() 组装
{
  type: "diagnosis",
  diagnosisResult: {
    caseId: "case-001",
    patientName: "李秀梅",
    
    // 用户答案（来自A1）
    userAnswers: {
      tongue: { color: "淡红", coating: "白腻", shape: "胖大", moisture: "润滑" },
      pulse: { position: "中", quality: "濡" },
      symptoms: ["脘腹胀满", "食欲不振", "身倦体重"],
      syndrome: ["湿阻中焦"],
      prescription: ["平胃散"]
    },
    
    // 正确答案（来自DiagnosisScene.caseData）
    correctAnswers: {
      tongue: { color: "淡红", coating: "白腻", shape: "胖大", moisture: "润滑" },
      pulse: { position: "中", quality: "缓" },
      syndrome: ["湿阻中焦", "脾虚"],
      prescription: ["平胃散", "健脾丸"]
    },
    
    // 评分结果（来自A2）
    score: {
      totalScore: 75,
      breakdown: { ... },
      overallErrors: [ ... ]
    }
  }
}
```

**格式A4: SSE请求体（发送给Hermes）**

```typescript
// 来源: DialogUI.formatGameContextPrompt() 格式化
// POST /v1/chat/stream
{
  npc_id: "qingmu",
  player_id: "player_001",
  messages: [
    {
      role: "system",
      content: "[诊断结果反馈请求]
患者：李秀梅
评分：75分
详情：
- 舌诊：20分（正确）
- 脉诊：15分（错误：脉势应为'缓'而非'濡'）
- 辨证：30分（错误：遗漏'脾虚'证型）
- 选方：10分（错误：应选'健脾丸'配合平胃散）

用户答案：湿阻中焦，选方平胃散
正确答案：湿阻中焦+脾虚，选方平胃散+健脾丸

请按feedback-evaluation技能标准给出点评，评分等级为70-89分（良好）。"
    }
  ],
  stream: true
}
```

**格式A5: NPC点评响应（SSE流）**

```typescript
// 来源: Hermes NPC SSE返回
// SSE data chunk示例:
data: {"text": "辨证方向正确，", "type": "text"}
data: {"text": "麻黄汤选方得当。", "type": "text"}
data: {"text": "但你的论述中遗漏了'脉紧'的意义...", "type": "text"}
data: {"text": "紧脉主寒，与浮脉相合...", "type": "text"}
data: {"type": "done"}
```

---

### 6.2 场景B：对话开始自动查询

#### 数据流转时序

```
┌──────────────────────────────────────────────────────────────────────┐
│ 时间线: T0 → T1 → T2 → T3                                            │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│ T0: ClinicScene预查询（心跳缓存）                                    │
│     └─→ NPCHeartbeat.triggerOnSceneEnter()                          │
│         └─→ MCP调用: get_npc_memory + get_learning_progress         │
│             └─→ 缓存到 GameStateBridge                               │
│                 见下方格式B1                                          │
│                                                                      │
│ T1: 玩家触发对话                                                     │
│     └─→ showDialogUI({ npcId, playerId })                           │
│         └─→ DialogUI从缓存读取数据                                   │
│             见下方格式B2                                              │
│                                                                      │
│ T2: NPC生成个性化开场                                                │
│     └─→ 基于缓存数据生成开场白                                       │
│         └─→ 输出: 开场文本                                            │
│             见下方格式B3                                              │
│                                                                      │
│ T3: 玩家输入问题                                                     │
│     └─→ SSE请求发送                                                   │
│         └─→ NPC后台调用工具                                          │
│             见下方格式B4                                              │
└──────────────────────────────────────────────────────────────────────┘
```

#### 数据格式定义

**格式B1: 心跳预查询缓存**

```typescript
// 来源: NPCHeartbeat.triggerOnSceneEnter() → MCP工具返回
// 存储位置: GameStateBridge.cache

// get_npc_memory返回
{
  npc_id: "qingmu",
  player_id: "player_001",
  memory: {
    last_topic: "麻黄汤配伍",       // 上次讨论主题
    discussed_herbs: ["麻黄", "桂枝", "杏仁"],
    pending_questions: ["无汗的临床意义"],
    last_session_date: "2026-05-18"
  }
}

// get_learning_progress返回
{
  player_id: "player_001",
  tasks: [
    {
      task_id: "mahuang-tang-learning",
      name: "麻黄汤学习",
      progress: 0.7,
      status: "in_progress",
      next_step: "煎药实践"
    },
    {
      task_id: "guizhi-tang-learning",
      name: "桂枝汤学习",
      progress: 0,
      status: "locked",
      blocked_by: "mahuang-tang-learning"
    }
  ],
  current_focus: {
    task_id: "mahuang-tang-learning",
    days_stagnant: 0    // 停滞天数
  }
}
```

**格式B2: DialogUI读取缓存后的内部状态**

```typescript
// 来源: DialogUI useEffect初始化
{
  cachedMemory: {
    last_topic: "麻黄汤配伍",
    pending_questions: ["无汗的临床意义"]
  },
  cachedProgress: {
    current_task: "麻黄汤学习",
    progress: 0.7
  }
}
```

**格式B3: NPC个性化开场文本**

```typescript
// 来源: NPC基于缓存数据生成
"小友，上次我们谈到麻黄汤的配伍，你问到'无汗'的临床意义。
今天正好继续——无汗二字，可不仅是症状描述...
你准备好深入理解了吗？"

// 若无上次记忆:
"欢迎来到青木诊所。我是苏老郎中。
你想从哪里开始学习？是诊病识症，还是方药配伍？"
```

**格式B4: 玩家输入后的工具调用**

```typescript
// 来源: NPC判断需要进一步查询
// Tool Call请求格式:
{
  tool_name: "get_inventory",
  arguments: {
    player_id: "player_001",
    category: "herb"
  }
}

// Tool Result返回格式:
{
  inventory: [
    { name: "麻黄", quantity: 3, quality: 90 },
    { name: "桂枝", quantity: 2, quality: 85 },
    { name: "杏仁", quantity: 1, quality: 80 }
  ],
  total_herbs: 6
}
```

---

### 6.3 场景C：心跳检查 → 任务发布

#### 数据流转时序

```
┌──────────────────────────────────────────────────────────────────────┐
│ 时间线: T0 → T1 → T2 → T3                                            │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│ T0: ClinicScene.create()                                             │
│     └─→ NPCHeartbeat.triggerOnSceneEnter("player_001")              │
│         └─→ 并行调用3个MCP工具                                        │
│             见下方格式C1                                              │
│                                                                      │
│ T1: 数据聚合判断                                                     │
│     └─→ NPC基于聚合数据判断                                          │
│         └─→ 输出: 决策结果                                            │
│             见下方格式C2                                              │
│                                                                      │
│ T2: 触发任务发布（如需要）                                           │
│     └─→ EventBus.emit('NPC_TRIGGER_DIALOG')                         │
│         └─→ 输出: 任务发布事件                                        │
│             见下方格式C3                                              │
│                                                                      │
│ T3: DialogUI弹出                                                     │
│     └─→ NPC主动发言                                                   │
│         └─→ 输出: 任务提示文本                                        │
│             见下方格式C4                                              │
└──────────────────────────────────────────────────────────────────────┘
```

#### 数据格式定义

**格式C1: 心跳聚合查询**

```typescript
// 来源: NPCHeartbeat.triggerOnSceneEnter() → 3个MCP工具并行

// get_inventory返回
{
  player_id: "player_001",
  herbs: [
    { name: "麻黄", quantity: 3 },
    { name: "桂枝", quantity: 2 },
    { name: "杏仁", quantity: 1 },
    { name: "甘草", quantity: 2 }
  ],
  seeds: [],
  knowledge: ["麻黄汤组成", "麻黄汤功效"]
}

// get_learning_progress返回
{
  player_id: "player_001",
  tasks: [
    { task_id: "mahuang-tang-learning", progress: 1.0, status: "completed" },
    { task_id: "guizhi-tang-learning", progress: 0, status: "locked" }
  ],
  current_focus: null    // 当前无焦点任务
}

// get_case_progress返回
{
  player_id: "player_001",
  cases: [
    { case_id: "case-001", status: "completed", score: 85 },
    { case_id: "case-002", status: "unlocked", score: null },
    { case_id: "case-003", status: "locked", blocked_by: "case-002" }
  ]
}
```

**格式C2: NPC决策结果**

```typescript
// 来源: NPC内部判断逻辑（tools-guide策略2/5）
{
  decision: "trigger_task",     // 或 "no_action" / "prompt_review"
  reason: "麻黄汤学习完成，背包有药材，可触发煎药实践",
  
  // 触发任务时的具体指令
  task_to_trigger: {
    type: "minigame",
    game_type: "decoction",
    related_task_id: "mahuang-tang-practice"
  },
  
  // 或无变化时
  // decision: "no_action",
  // reason: "进度无变化，等待玩家主动触发"
}
```

**格式C3: 任务发布事件**

```typescript
// 来源: EventBus.emit('NPC_TRIGGER_DIALOG')
{
  type: "NPC_TRIGGER_DIALOG",
  npcId: "qingmu",
  triggerReason: "task_available",
  dialogContext: {
    mode: "proactive",         // NPC主动触发
    message: "你已掌握麻黄汤的组成，背包里也备齐了药材。
             不如现在就试试煎药？按D键即可开始。",
    suggestedAction: {
      type: "trigger_minigame",
      game_type: "decoction",
      formula: "麻黄汤"
    }
  }
}
```

**格式C4: Tool Call触发场景切换**

```typescript
// 来源: NPC调用trigger_minigame
// Tool Call请求:
{
  tool_name: "trigger_minigame",
  arguments: {
    game_type: "decoction",
    case_id: null,           // 煎药游戏无需case_id
    difficulty: 1,
    formula: "麻黄汤"        // 新增：指定配方
  }
}

// Tool Result返回:
{
  success: true,
  message: "煎药游戏启动成功",
  scene: "DecoctionScene",
  formula_data: {
    name: "麻黄汤",
    herbs: ["麻黄", "桂枝", "杏仁", "甘草"]
  }
}

// → 游戏引擎接收tool_result → 执行handleToolCall → 切换场景
```

---

### 6.4 数据流转总览

```
┌─────────────────────────────────────────────────────────────────────┐
│                        数据流向方向                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  游戏引擎 ────────────────────────────────────────→ Hermes NPC      │
│     │                                                   ↑          │
│     │  格式A3/A4/B4/C1                                   │          │
│     │  (游戏状态/评分/上下文)                             │          │
│     │                                                   │          │
│     ↓                                                   │          │
│  GameStateBridge ────────────────────────────────────┤          │
│     │                                                   │          │
│     │  缓存数据(B1/C1)                                   │          │
│     │                                                   │          │
│     └───────────────────────────────────────────────────→          │
│                                                                     │
│  Hermes NPC ────────────────────────────────────────→ 游戏引擎     │
│     │                                                   ↑          │
│     │  格式A5/B3/C4                                     │          │
│     │  (点评文本/开场白/Tool Call)                        │          │
│     │                                                   │          │
│     ↓                                                   │          │
│  MCP Server ─────────────────────────────────────────┤          │
│     │                                                   │          │
│     │  Tool Result (C4)                                 │          │
│     │                                                   │          │
│     └───────────────────────────────────────────────────→          │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘

关键协议约定:
1. 游戏→NPC: 通过DialogUI注入contextPrompt（SSE请求体）
2. NPC→游戏: 通过Tool Call返回（MCP协议）
3. 缓存层: GameStateBridge作为数据中转站
```

---

### 6.5 数据持久化机制与NPC数据来源

#### 数据存储架构

```
┌─────────────────────────────────────────────────────────────────────┐
│                     游戏数据持久化层级                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Layer 1: 运行时内存（NPC直接访问）                                  │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ InventoryManager (单例)                                      │   │
│  │   - herbs: Record<string, number>                           │   │
│  │   - seeds: Record<string, number>                           │   │
│  │   - tools: string[]                                         │   │
│  │   - knowledgeCards: string[]                                │   │
│  │                                                              │   │
│  │ CaseManager (单例)                                           │   │
│  │   - caseStates: Map<string, CaseState>                      │   │
│  │   - history: CaseHistoryRecord[]                            │   │
│  │                                                              │   │
│  │ GameStateBridge (单例)                                       │   │
│  │   - playerState: PlayerState                                │   │
│  │   - dialogHistory: Map<string, DialogMessage[]>             │   │
│  │   - inventoryCache: InventoryState                          │   │
│  │   - progressCache: LearningProgress                         │   │
│  └─────────────────────────────────────────────────────────────┘   │
│        ↓ NPC通过MCP工具访问此层（实时数据）                          │
│                                                                     │
│  Layer 2: 存档管理（持久化）                                         │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ SaveManager                                                  │   │
│  │   - saveDataCache: Map<number, SaveData>                    │   │
│  │   - autoSave触发: task_complete/case_complete/scene_change  │   │
│  │                                                              │   │
│  │ SaveData结构:                                                │   │
│  │   - inventory: { herbs, seeds, tools, knowledge_cards }     │   │
│  │   - case_history: CaseHistoryRecord[]                       │   │
│  │   - tasks: TaskProgressSaveData[]                           │   │
│  │   - experience: ExperienceState                             │   │
│  └─────────────────────────────────────────────────────────────┘   │
│        ↓ 自动存档触发时写入                                          │
│                                                                     │
│  Layer 3: 浏览器持久化                                               │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ localStorage                                                  │   │
│  │   - save_slot_1: JSON.stringify(SaveData)                   │   │
│  │   - save_slot_2: ...                                         │   │
│  │   - save_slot_3: ...                                         │   │
│  │                                                              │   │
│  │ 加载时: localStorage → SaveManager → 各Manager              │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

#### NPC数据获取路径

| MCP工具 | 数据来源 | 获取路径 | 说明 |
|---------|----------|----------|------|
| `get_inventory` | **InventoryManager** | `InventoryManager.getInstance().exportData()` | 实时内存数据，非localStorage |
| `get_case_progress` | **CaseManager** | `CaseManager.getInstance().getStatistics()` | 实时内存数据 |
| `get_learning_progress` | **GameStateBridge** | `GameStateBridge.getInstance().progressCache` | 心跳预查询缓存 |
| `get_npc_memory` | **GameStateBridge** | `GameStateBridge.getInstance().getDialogHistory()` | 对话历史缓存 |
| `record_weakness` | **GameStateBridge** | `GameStateBridge.getInstance().weaknessLog` | 新增薄弱点记录 |
| `trigger_minigame` | **场景切换** | `ClinicScene.handleToolCall()` | 触发Phaser场景 |

#### 关键说明

**NPC不直接访问localStorage**：

```
错误路径（NPC不采用）:
NPC → MCP Server → localStorage.getItem('save_slot_1') → 解析JSON
                      ↑ 数据可能过期（内存已更新）

正确路径（当前实现）:
NPC → MCP Server → InventoryManager.getInstance().herbs → 实时数据
                      ↑ 内存中的当前状态，与界面一致
```

**数据一致性保障**：

```
游戏操作 → InventoryManager.herbs['mahuang'] += 1
        ↓
EventBus.emit('item:acquire')
        ↓
SaveManager.autoSave('item_acquire')
        ↓
localStorage.setItem('save_slot_1', JSON.stringify(saveData))
        ↓
下次加载时恢复一致
```

#### MCP Server实现参考

```python
# hermes_backend/tools/game_tools.py (当前实现)

@mcp.tool
def get_inventory(player_id: str) -> Dict[str, Any]:
    """获取背包数据 - 从InventoryManager获取实时数据"""
    # 实际应调用游戏引擎接口，而非直接读取存储
    inventory_manager = get_inventory_manager()  # 游戏引擎桥接
    return inventory_manager.export_data()

@mcp.tool
def get_case_progress(player_id: str) -> Dict[str, Any]:
    """获取病案进度 - 从CaseManager获取实时数据"""
    case_manager = get_case_manager()
    return case_manager.get_statistics()

@mcp.tool
def get_learning_progress(player_id: str) -> Dict[str, Any]:
    """获取学习进度 - 从GameStateBridge获取缓存"""
    bridge = GameStateBridge.getInstance()
    return bridge.progressCache
```

#### 自动存档触发时机

```typescript
// SaveManager.ts 自动存档事件
- 'task:complete'     → Task完成时
- 'case:complete'     → 病案完成时（包含评分）
- 'scene:change'      → 场景切换时
- 'item:acquire'      → 获得物品时
- 60秒定时器          → 周期性自动存档
```

**NPC点评后自动存档**：

诊断游戏结束 → NPC点评 → 记录到 `CaseHistoryRecord.npc_feedback` → EventBus.emit('case:complete') → SaveManager.autoSave()

---

## 七、验收标准

### 7.1 功能验收

| 标准 | 测试方法 | 通过条件 |
|------|----------|----------|
| 诊断结束点评触发 | E2E: 完成诊断后NPC对话自动弹出 | DialogUI visible + gameContext注入 |
| 点评内容符合评分 | 手动验证：低分点评指出错误，高分点评肯定+建议 | 符合feedback-evaluation模板 |
| 对话开始自动查询 | E2E: 对话开始时NPC调用get_npc_memory | Tool call日志显示调用 |
| 个性化开场生成 | 手动验证：NPC开场提及上次讨论内容 | 基于MEMORY.md生成 |
| 心跳检查触发 | E2E: 进入诊所时NPC调用get_inventory | Tool call日志显示调用 |
| 任务发布触发 | 手动验证：进度达标时NPC调用trigger_minigame | 游戏场景切换成功 |

### 7.2 量化指标

| 指标 | 目标值 |
|------|--------|
| 工具触发成功率 | ≥ 90% |
| 评分计算准确性 | 与人工评审一致率 ≥ 85% |
| NPC点评响应延迟 | ≤ 3秒 |
| 心跳检查触发率 | 进入诊所时 100% |

---

## 八、实现清单

### 8.1 文件创建

| 文件 | 职责 | 行数估算 |
|------|------|----------|
| `src/utils/DiagnosisScorer.ts` | 评分计算 | ~80 |
| `src/systems/NPCHeartbeat.ts` | 心跳检查 | ~50 |
| `src/ui/html/bridge/npc-feedback-bridge.ts` | 反馈桥接 | ~60 |

### 8.2 文件修改

| 文件 | 修改内容 |
|------|----------|
| `src/ui/html/dialog-entry.tsx` | +gameContext参数支持 |
| `src/ui/html/DialogUI.tsx` | +contextPrompt处理 + mode参数 |
| `src/scenes/DiagnosisScene.ts` | handleDiagnosisComplete调用NPCFeedbackBridge |
| `src/scenes/ClinicScene.ts` | create()调用NPCHeartbeat.triggerOnSceneEnter |
| `~/.hermes/profiles/qingmu/skills/npc-teaching/tools-guide/SKILL.md` | +策略6说明 |
| `tests/e2e/npc-feedback.spec.ts` | 新增E2E测试 |

### 8.3 无需改动

| 文件 | 原因 |
|------|------|
| `feedback-evaluation/SKILL.md` | 已完整定义评分反馈模板 |
| MCP工具（6个） | 已完整实现 |
| `tcm-teaching/SKILL.md` | 教学知识库无需改动 |

---

## 九、风险评估

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| 评分计算复杂度 | 中 | DiagnosisScorer先实现简单匹配，后续迭代精细化 |
| NPC点评延迟 | 低 | contextPrompt直接注入首条消息，避免多轮往返 |
| 心跳检查时机 | 中 | 仅在场景进入时触发，避免频繁调用 |
| contextPrompt过长 | 低 | 仅传递关键评分数据，不传递完整答案 |

---

## 十、参考文档

| 文档 | 路径 |
|------|------|
| DialogUI设计 | `docs/superpowers/specs/phase2.5/2026-05-14-dialog-ui-html-embedding-design.md` |
| feedback-evaluation | `~/.hermes/profiles/qingmu/skills/npc-teaching/feedback-evaluation/SKILL.md` |
| tools-guide | `~/.hermes/profiles/qingmu/skills/npc-teaching/tools-guide/SKILL.md` |
| DiagnosisScene | `src/scenes/DiagnosisScene.ts` |
| DiagnosisUI | `src/ui/html/DiagnosisUI.tsx` |

---

*本文档由 Claude Code 生成，日期 2026-05-19*