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
  userResult: DiagnosisResult,      // 用户诊断结果
  correctCase: DiagnosisCase        // 原始病案正确答案
): DiagnosisScoreResult;

export function formatScoreForNPC(result: DiagnosisScoreResult): string;
// 格式化为NPC可理解的上下文文本
```

**评分权重**：

| 阶段 | 权重 | 匹配规则 |
|------|------|----------|
| 舌诊 | 20% | 舌色+舌苔+舌型+润燥完全匹配 |
| 脉诊 | 20% | 脉位+脉势完全匹配 |
| 辨证 | 40% | 证型选项匹配正确答案 |
| 选方 | 20% | 方剂选择匹配正确答案 |

### 4.2 NPCHeartbeat（心跳检查机制）

**职责**：在特定时机触发NPC检查玩家状态

**触发时机定义**：

| 时机 | 实现位置 | 触发行为 |
|------|----------|----------|
| 进入诊所场景 | ClinicScene.create() | NPC后台调用get_inventory + get_learning_progress |
| 对话开始前 | DialogUI挂载时 | 已由tools-guide策略1覆盖 |
| 完成诊断后 | DiagnosisScene.handleDiagnosisComplete() | 触发NPCFeedbackBridge |

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

## 六、数据流详解

### 6.1 诊断结束→NPC点评流程

```
DiagnosisScene.handleDiagnosisComplete(result)
        ↓
DiagnosisScorer.calculate(result, caseData)
        ↓
NPCFeedbackBridge.triggerNPCFeedback({
  type: 'diagnosis',
  diagnosisResult: { ... }
})
        ↓
showDialogUI({
  npcId: 'qingmu',
  gameContext: diagnosisResult,
  mode: 'feedback'
})
        ↓
DialogUI → 发送contextPrompt给Hermes
        ↓
Hermes NPC → 使用feedback-evaluation生成点评
        ↓
NPC返回点评文本 → DialogUI渲染显示
```

### 6.2 对话开始自动查询流程

```
玩家靠近NPC → 按空格键
        ↓
ClinicScene.showDialogWithNPC('qingmu')
        ↓
showDialogUI({ npcId, playerId })
        ↓
DialogUI挂载 → NPC后台调用：
  - get_npc_memory(npc_id, player_id)
  - get_learning_progress(player_id)
        ↓
NPC收到数据 → 生成个性化开场：
  "上次我们谈到麻黄汤的配伍，今天继续..."
```

### 6.3 心跳检查→任务发布流程

```
ClinicScene.create()
        ↓
NPCHeartbeat.triggerOnSceneEnter('player_001')
        ↓
NPC后台调用：
  - get_inventory(player_id)
  - get_learning_progress(player_id)
  - get_case_progress(player_id)
        ↓
NPC判断：
  IF 背包有麻黄汤药材 AND 进度达标:
    → NPC主动提示"可以煎药了"
  IF 进度停滞7天:
    → NPC主动询问复习
  IF 完成任务:
    → NPC调用trigger_minigame发布新任务
```

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