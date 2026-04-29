# Hermes NPC AI 自动测试验收设计规范

**版本**: v1.0
**日期**: 2026-04-30
**阶段**: Phase 2.5 NPC对话验收
**状态**: 待审阅

---

## 1. 背景与目标

### 1.1 设计背景

NPC 对话功能已完成 Hermes 后端实现（Tasks 1-6）和前端集成（Tasks 8-14），需要建立自动化测试验收体系确保：

1. **功能正确性** - 全栈集成流程正确运行
2. **教学质量** - NPC 对话符合设计的教学风格
3. **持续监控** - 每次迭代后自动验证质量

### 1.2 设计目标

| 目标 | 说明 |
|-----|------|
| 全栈集成验收 | 后端API + 前端UI + 对话流程完整测试 |
| 教学质量验收 | AI评估NPC对话的教学风格、连贯性、工具调用 |
| 完全自动执行 | 从启动后端→运行测试→AI评估→生成报告，无人值守 |
| 统一框架复用 | 基于现有 scripts/visual_acceptance/ 架构扩展 |

---

## 2. 系统架构

### 2.1 整体架构

```
┌─────────────────────────────────────────────────────────────────┐
│                     自动验收执行流程                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. 启动阶段                                                    │
│     ├── 启动 Hermes Backend (python main.py)                   │
│     ├── 启动 Vite Frontend (npm run dev)                       │
│     └── 等待服务就绪 (health check)                             │
│                                                                 │
│  2. 测试执行阶段                                                │
│     ├── Playwright 运行 E2E 测试套件                           │
│     ├── 每个测试触发 NPC 对话                                   │
│     ├── 后端自动记录对话日志到 logs/dialog/                    │
│     └── 测试结束，导出前端触发事件日志                          │
│                                                                 │
│  3. AI 评估阶段                                                 │
│     ├── 读取所有对话日志文件                                    │
│     ├── 调用 LLM API 评估教学质量                               │
│     │   ├── 教学风格符合度                                      │
│     │   ├── 上下文连贯性                                        │
│     │   └── 工具调用合理性                                      │
│     ├── 生成结构化评分结果                                      │
│     └── 合并前端触发事件评估                                    │
│                                                                 │
│  4. 报告生成阶段                                                │
│     ├── 综合测试通过率 + AI评估分数                             │
│     ├── 生成 Markdown 验收报告                                  │
│     ├── 标记不合格项及改进建议                                  │
│     └── 输出到 reports/npc_acceptance/                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 目录结构

```
scripts/npc_acceptance/
├── config.py           # 验收配置（阈值、权重、API配置）
├── run_all.py          # 全流程编排脚本
├── backend_launcher.py # Hermes 后端启动管理
├── frontend_launcher.py# Vite 前端启动管理
├── playwright_runner.py# Playwright E2E 测试执行
├── dialog_evaluator.py # LLM 对话质量评估
├── trigger_evaluator.py# 前端触发事件评估
├── report_generator.py # Markdown 报告生成
└── __init__.py

logs/dialog/
├── qingmu/
│   └── 2026-04-30/
│       ├── session_001.json
│       ├── session_002.json
│       └── ...
├── laozhang/
│   └── 2026-04-30/
│       └── ...

reports/npc_acceptance/
├── screenshots/        # 对话截图（可选）
├── dialog_logs/        # 复制的对话日志
├── evaluation_results/ # AI评估JSON结果
├── summary_report.md   # 综合验收报告
└── timestamp/
```

---

## 3. 后端对话日志系统

### 3.1 日志职责划分

| 位置 | 日志职责 | 记录内容 |
|------|---------|---------|
| **后端 Hermes** | 对话内容日志 | 请求、完整响应、工具调用名/参数/结果、时间戳 |
| **前端 Phaser** | 触发事件日志 | 进入场景、靠近NPC、显示/隐藏DialogUI、用户输入发送时间戳 |

### 3.2 后端日志文件格式

**存储路径**：`logs/dialog/{npc_id}/{date}/{session_id}.json`

**日志结构**：

```json
{
  "session_id": "qingmu_player001_20260430_143052",
  "npc_id": "qingmu",
  "player_id": "player_001",
  "timestamp_start": "2026-04-30T14:30:52Z",
  "timestamp_end": "2026-04-30T14:31:15Z",
  "user_message": "老师，什么是风寒表实证？",
  "full_response": "你可还记得太阳病的主症？那'脉浮，头项强痛而恶寒'的描述，说的是什么道理？你目前学习进度是麻黄汤65%，桂枝汤尚未解锁。",
  "tool_calls": [
    {
      "seq": 1,
      "name": "get_learning_progress",
      "args": {"player_id": "player_001"},
      "result": {"tasks": [...], "statistics": {...}},
      "timestamp": "2026-04-30T14:30:58Z"
    }
  ],
  "response_token_count": 80,
  "response_duration_ms": 23000
}
```

### 3.3 后端日志实现

**新增文件**：`hermes_backend/gateway/dialog_logger.py`

```python
class DialogLogger:
    """对话日志记录器"""

    def __init__(self, log_dir: str = "logs/dialog"):
        self.log_dir = Path(log_dir)
        self.current_session: Dict[str, Any] = {}
        self.tool_calls_buffer: List[Dict] = []
        self.text_buffer: str = ""

    def start_session(self, npc_id: str, player_id: str, user_message: str) -> str:
        """开始对话会话，返回 session_id"""
        session_id = f"{npc_id}_{player_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        self.current_session = {
            "session_id": session_id,
            "npc_id": npc_id,
            "player_id": player_id,
            "timestamp_start": datetime.now().isoformat(),
            "user_message": user_message,
            "tool_calls": [],
            "full_response": ""
        }
        return session_id

    def log_tool_call(self, name: str, args: dict, result: dict):
        """记录工具调用"""
        self.current_session["tool_calls"].append({
            "seq": len(self.current_session["tool_calls"]) + 1,
            "name": name,
            "args": args,
            "result": result,
            "timestamp": datetime.now().isoformat()
        })

    def accumulate_text(self, text: str):
        """累积响应文本"""
        self.text_buffer += text

    def end_session(self, token_count: int) -> str:
        """结束对话会话，保存日志文件"""
        self.current_session["timestamp_end"] = datetime.now().isoformat()
        self.current_session["full_response"] = self.text_buffer
        self.current_session["response_token_count"] = token_count

        duration = (datetime.now() - datetime.fromisoformat(
            self.current_session["timestamp_start"]
        ).total_seconds() * 1000)
        self.current_session["response_duration_ms"] = int(duration)

        # 保存文件
        date_str = datetime.now().strftime('%Y-%m-%d')
        file_path = self.log_dir / self.current_session["npc_id"] / date_str / f"{self.current_session['session_id']}.json"
        file_path.parent.mkdir(parents=True, exist_ok=True)

        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(self.current_session, f, ensure_ascii=False, indent=2)

        # 清空缓冲
        self.text_buffer = ""
        self.current_session = {}

        return str(file_path)
```

**修改文件**：`hermes_backend/gateway/stream_consumer.py`

在 `stream_chat()` 函数中集成 DialogLogger：

```python
def stream_chat(request: Dict[str, Any]) -> Generator[Dict[str, Any], None, None]:
    logger = DialogLogger()
    session_id = logger.start_session(request['npc_id'], request['player_id'], request['user_message'])

    # ... LLM调用逻辑 ...

    text_content = ""
    for chunk in response:
        if delta.content:
            text_content += delta.content
            yield {'type': 'text', 'content': delta.content}

        if delta.tool_calls:
            # 执行工具并记录
            result = registry.execute_tool(name, args)
            logger.log_tool_call(name, args, result)
            yield {'type': 'tool_call', 'name': name, 'args': args}
            yield {'type': 'tool_result', 'result': result}

    # 对话结束，保存日志
    logger.end_session(token_count=len(text_content))
    yield {'type': 'session_end', 'session_id': session_id}
```

---

## 4. 前端触发事件日志

### 4.1 扩展 GameLogger

**修改文件**：`src/utils/GameLogger.ts`

新增日志类别：

```typescript
export type LogCategory = 'scene' | 'player' | 'interaction' | 'error' | 'npc_trigger';
```

### 4.2 扩展 EventBus 事件

**修改文件**：`src/systems/EventBus.ts`

新增事件类型：

```typescript
export enum GameEvents {
  // ... existing events ...
  NPC_SCENE_ENTER = 'npc:scene_enter',
  NPC_NEARBY_DETECTED = 'npc:nearby_detected',
  NPC_DIALOG_SHOWN = 'npc:dialog_shown',
  NPC_DIALOG_HIDDEN = 'npc:dialog_hidden',
  NPC_USER_INPUT = 'npc:user_input',
  NPC_MINIGAME_TRIGGERED = 'npc:minigame_triggered',
}
```

### 4.3 触发事件数据结构

| 事件名 | 记录时机 | 数据字段 |
|--------|---------|---------|
| `NPC_SCENE_ENTER` | 进入有 NPC 的场景 | `{npc_id, scene_id, timestamp}` |
| `NPC_NEARBY_DETECTED` | 检测到靠近 NPC | `{npc_id, distance, player_pos}` |
| `NPC_DIALOG_SHOWN` | DialogUI 显示 | `{npc_id, session_id}` |
| `NPC_DIALOG_HIDDEN` | DialogUI 关闭 | `{npc_id, session_id, duration_ms}` |
| `NPC_USER_INPUT` | 用户发送输入 | `{npc_id, message_length, timestamp}` |
| `NPC_MINIGAME_TRIGGERED` | 工具触发小游戏 | `{game_type, case_id}` |

### 4.4 导出机制

E2E 测试结束后，通过 Playwright `page.evaluate()` 获取：

```typescript
// tests/e2e/npc-dialog.spec.ts
test.afterAll(async ({ page }) => {
  const triggerLogs = await page.evaluate(() => {
    const logger = GameLogger.getInstance();
    return logger.getLogs('npc_trigger');
  });

  // 保存到 reports/npc_acceptance/trigger_logs.json
});
```

---

## 5. E2E 测试场景设计

### 5.1 测试场景分类

| 测试类型 | 场景数 | 覆盖内容 |
|---------|-------|---------|
| 烟雾测试 | 3 | 后端健康检查、NPC精灵图加载、DialogUI渲染 |
| 触发机制测试 | 4 | 进入场景触发、靠近NPC触发、空格键交互、触发提示显示 |
| 对话流程测试 | 5 | 输入框显示、用户输入发送、流式响应接收、停止生成按钮、对话关闭 |
| 工具调用测试 | 4 | get_learning_progress、trigger_minigame、record_weakness、工具结果渲染 |
| 教学质量测试 | 3 | 引导式提问验证、多轮对话连贯性、错误纠正反馈 |

### 5.2 烟雾测试

| ID | 测试名称 | 验收标准 |
|----|---------|---------|
| NPC-S01 | 后端服务启动 | `GET /health` 返回 `{status: "ok", npcs: ["qingmu", "laozhang", "neighbor"]}` |
| NPC-S02 | NPC精灵图加载 | BootScene 后 `npc_qingmu` 纹理存在 |
| NPC-S03 | DialogUI组件渲染 | 进入诊所后 DialogUI 可见，包含 NPC头像、名字、对话区域 |

### 5.3 触发机制测试

| ID | 测试名称 | 验收标准 |
|----|---------|---------|
| NPC-T01 | 进入场景自动触发 | 进入 ClinicScene 1秒后自动显示青木先生欢迎对话 |
| NPC-T02 | 靠近NPC触发检测 | 玩家移动到 NPC 100px 内，显示 "按空格与青木先生对话" |
| NPC-T03 | 空格键启动对话 | 按空格后 DialogUI 显示，输入框可见 |
| NPC-T04 | 多NPC场景切换 | 从诊所切换到药园，laozhang NPC 正确注册和显示 |

### 5.4 对话流程测试

| ID | 测试名称 | 验收标准 |
|----|---------|---------|
| NPC-D01 | 输入框状态切换 | 对话完成后等待2秒，输入框自动显示并获得焦点 |
| NPC-D02 | 用户输入发送 | 输入 "麻黄汤有什么作用" 点击发送，后端收到请求 |
| NPC-D03 | 流式响应接收 | SSE 响应逐字显示，累计响应长度 > 50 字符 |
| NPC-D04 | 停止生成按钮 | 响应过程中点击 "停止"，生成中断，显示部分响应 |
| NPC-D05 | 对话框关闭 | 点击关闭/ESC，DialogUI销毁，触发事件记录 `NPC_DIALOG_HIDDEN` |

### 5.5 工具调用测试

| ID | 测试名称 | 验收标准 |
|----|---------|---------|
| NPC-TC01 | 学习进度查询 | 发送 "我学到哪了"，后端返回 `get_learning_progress` 工具调用 |
| NPC-TC02 | 小游戏触发 | 发送 "我想试试煎药"，后端返回 `trigger_minigame(game_type: "decoction")` |
| NPC-TC03 | 弱点记录 | 发送导致 NPC 发现理解偏差的问题，后端返回 `record_weakness` |
| NPC-TC04 | 小游戏场景切换 | 工具触发后，场景切换到 DecoctionScene |

### 5.6 教学质量测试（AI评估）

| ID | 测试名称 | 验收标准（AI评估） |
|----|---------|---------|
| NPC-Q01 | 引导式提问验证 | NPC 响应包含至少 1 个引导性问题（"你可..."句式） |
| NPC-Q02 | 多轮对话连贯性 | 3轮对话中 NPC 正确理解上下文，无答非所问 |
| NPC-Q03 | 工具调用时机合理 | 工具调用在合适对话节点触发（如讲解完毕后触发小游戏） |

---

## 6. AI 评估系统

### 6.1 评估维度

| 维度 | 权重 | 阈值 | 说明 |
|-----|------|------|------|
| 教学风格符合度 | 40% | 75 | NPC 使用引导式提问而非直接答案 |
| 上下文连贯性 | 30% | 80 | NPC 正确理解用户问题，对话自然流畅 |
| 工具调用合理性 | 30% | 70 | 工具在合适时机触发 |

### 6.2 教学风格评分标准

| 分数 | 描述 |
|-----|------|
| 100 | 完全使用引导式提问，不直接给出答案，每句包含引导性问题 |
| 80 | 主要使用引导式提问，偶尔直接陈述 |
| 60 | 混合使用引导和直接回答 |
| 40 | 多数直接给出答案，缺少引导 |
| 20 | 完全直接回答，无引导式教学 |

**检查点**：
- 是否使用 "你可记得"、"你可思考"、"你可明了" 等引导语
- 是否避免 "风寒表实证就是..." 等直接定义
- 是否引用经典作为引导素材

### 6.3 上下文连贯性评分标准

| 分数 | 描述 |
|-----|------|
| 100 | NPC 完全理解用户问题，回答针对性强，对话自然流畅 |
| 80 | NPC 基本理解用户意图，回答相关但略显机械 |
| 60 | NPC 理解部分问题，有答非所问情况 |
| 40 | NPC 经常误解用户意图，回答不相关 |
| 20 | NPC 无法理解用户问题，对话断裂 |

### 6.4 工具调用合理性评分标准

| 分数 | 描述 |
|-----|------|
| 100 | 工具调用时机完美，在讲解完毕后触发实践 |
| 80 | 工具调用时机合适，略有提前或延迟 |
| 60 | 工具调用时机一般，缺少自然过渡 |
| 40 | 工具调用时机不当，打断对话节奏 |
| 20 | 工具调用完全不合理或遗漏必要调用 |

**检查点**：
- `get_learning_progress`: 是否在讨论进度时调用
- `trigger_minigame`: 是否在讲解后、学生准备好实践时调用
- `record_weakness`: 是否在发现学生理解偏差时调用

### 6.5 LLM 评估 Prompt

```python
EVALUATION_PROMPT = """
你是一个中医教育专家，评估 NPC 教学对话质量。

## 评估维度

### 1. 教学风格符合度 (权重 40%)
评分标准：
- 100分: 完全使用引导式提问，不直接给出答案，每句包含引导性问题
- 80分: 主要使用引导式提问，偶尔直接陈述
- 60分: 混合使用引导和直接回答
- 40分: 多数直接给出答案，缺少引导
- 20分: 完全直接回答，无引导式教学

检查点：
- 是否使用 "你可记得"、"你可思考"、"你可明了" 等引导语
- 是否避免 "风寒表实证就是..." 等直接定义
- 是否引用经典作为引导素材

### 2. 上下文连贯性 (权重 30%)
评分标准：
- 100分: NPC 完全理解用户问题，回答针对性强，对话自然流畅
- 80分: NPC 基本理解用户意图，回答相关但略显机械
- 60分: NPC 理解部分问题，有答非所问情况
- 40分: NPC 经常误解用户意图，回答不相关
- 20分: NPC 无法理解用户问题，对话断裂

### 3. 工具调用合理性 (权重 30%)
评分标准：
- 100分: 工具调用时机完美，在讲解完毕后触发实践
- 80分: 工具调用时机合适，略有提前或延迟
- 60分: 工具调用时机一般，缺少自然过渡
- 40分: 工具调用时机不当，打断对话节奏
- 20分: 工具调用完全不合理或遗漏必要调用

检查点：
- get_learning_progress: 是否在讨论进度时调用
- trigger_minigame: 是否在讲解后、学生准备好实践时调用
- record_weakness: 是否在发现学生理解偏差时调用

## 输入数据

NPC ID: {npc_id}
用户问题: {user_message}
NPC 响应: {full_response}
工具调用: {tool_calls}

## 输出格式

请以 JSON 格式输出评估结果：
{
  "teaching_style_score": <分数>,
  "teaching_style_reason": "<简短理由>",
  "context_coherence_score": <分数>,
  "context_coherence_reason": "<简短理由>",
  "tool_call_score": <分数>,
  "tool_call_reason": "<简短理由>",
  "total_score": <加权总分>,
  "improvement_suggestions": ["<建议1>", "<建议2>"]
}
"""
```

---

## 7. 验收配置

### 7.1 配置文件

**文件**：`scripts/npc_acceptance/config.py`

```python
# 验收阈值配置
DIALOG_EVALUATION_THRESHOLDS = {
    "教学风格符合度": 75,
    "上下文连贯性": 80,
    "工具调用合理性": 70,
}

DIALOG_EVALUATION_WEIGHTS = {
    "教学风格符合度": 0.40,
    "上下文连贯性": 0.30,
    "工具调用合理性": 0.30,
}

TOTAL_DIALOG_PASS_THRESHOLD = 75
E2E_TEST_PASS_THRESHOLD = 0.80
FINAL_ACCEPTANCE_THRESHOLD = 0.85

# LLM API 配置（复用现有环境变量）
EVALUATION_LLM_API_URL = os.getenv("DEEPSEEK_API_URL") or os.getenv("GLM_API_BASE")
EVALUATION_LLM_API_KEY = os.getenv("DEEPSEEK_API_KEY") or os.getenv("GLM_API_KEY")
EVALUATION_LLM_MODEL = os.getenv("EVALUATION_MODEL", "deepseek-chat")

# 服务启动配置
HERMES_BACKEND_PORT = 8642
VITE_FRONTEND_PORT = 5173
SERVICE_READY_TIMEOUT = 30  # 秒
```

### 7.2 验收通过条件

| 条件 | 计算方式 | 阈值 |
|-----|---------|------|
| E2E 测试通过率 | 通过数 / 总数 | ≥ 80% |
| 对话质量加权总分 | Σ(维度分数 × 权重) | ≥ 75 |
| 综合验收分数 | 测试通过率 × 0.5 + 对话质量得分/100 × 0.5 | ≥ 85% |

---

## 8. 报告格式

### 8.1 综合验收报告

**文件**：`reports/npc_acceptance/summary_report.md`

```markdown
# Hermes NPC 对话自动验收报告

**执行时间**: 2026-04-30 14:30:00
**测试运行 ID**: npc_acceptance_20260430_143000

---

## 1. 测试执行结果

### 1.1 E2E 测试通过率

| 测试类型 | 通过数 | 总数 | 通过率 |
|---------|-------|------|--------|
| 烟雾测试 | 3 | 3 | 100% |
| 触发机制测试 | 4 | 4 | 100% |
| 对话流程测试 | 4 | 5 | 80% |
| 工具调用测试 | 3 | 4 | 75% |
| **总计** | **14** | **16** | **87.5%** |

### 1.2 失败测试详情

| ID | 测试名称 | 失败原因 |
|----|---------|---------|
| NPC-D04 | 停止生成按钮 | 响应过快，按钮未显示 |
| NPC-TC03 | 弱点记录 | LLM 未触发 record_weakness |

---

## 2. 对话质量评估结果

### 2.1 评估概览

| 对话会话 | NPC | 教学风格 | 连贯性 | 工具调用 | 总分 |
|---------|-----|---------|--------|---------|------|
| session_001 | qingmu | 85 | 90 | 80 | 85.5 |
| session_002 | qingmu | 70 | 85 | 75 | 76.0 |
| session_003 | laozhang | 80 | 88 | 70 | 79.6 |
| **平均** | - | **78.3** | **87.7** | **75.0** | **80.0** |

### 2.2 不合格项

| 会话 | 维度 | 分数 | 阈值 | 差距 | 改进建议 |
|-----|------|------|------|------|---------|
| session_002 | 教学风格 | 70 | 75 | -5 | 增加"你可思考"等引导语 |

---

## 3. 综合验收判定

| 条件 | 实际值 | 阈值 | 结果 |
|-----|-------|------|------|
| E2E 测试通过率 | 87.5% | 80% | ✅ PASS |
| 对话质量总分 | 80.0 | 75 | ✅ PASS |
| 综合验收分数 | 83.75% | 85% | ❌ FAIL |

---

## 4. 改进建议

1. **NPC-D04 停止生成按钮**: 增加响应延迟模拟，确保按钮显示
2. **教学风格**: session_002 中 NPC 直接给出了定义，应改为引导式提问
3. **工具调用**: NPC 在讨论进度时未主动调用 get_learning_progress

---

## 5. 日志文件路径

- 对话日志: `logs/dialog/qingmu/2026-04-30/`
- 触发事件日志: `reports/npc_acceptance/trigger_logs.json`
- 评估详情: `reports/npc_acceptance/evaluation_results/`
```

---

## 9. 执行脚本设计

### 9.1 主入口脚本

**文件**：`scripts/npc_acceptance/run_all.py`

```python
def main():
    """全流程编排"""

    # 1. 启动服务
    backend_proc = launch_backend()
    frontend_proc = launch_frontend()
    wait_for_services_ready()

    # 2. 运行 E2E 测试
    test_result = run_playwright_tests()
    trigger_logs = export_trigger_logs()

    # 3. AI 评估
    dialog_logs = collect_dialog_logs()
    evaluation_results = evaluate_dialogs(dialog_logs)

    # 4. 生成报告
    generate_summary_report(test_result, evaluation_results, trigger_logs)

    # 5. 清理
    cleanup_processes(backend_proc, frontend_proc)

    # 6. 返回验收结果
    return is_acceptance_passed()
```

### 9.2 手动评估脚本

**文件**：`scripts/npc_acceptance/evaluate_only.py`

```python
def main():
    """仅执行 AI 评估（不启动服务、不运行测试）"""

    dialog_logs = collect_dialog_logs("logs/dialog/")
    evaluation_results = evaluate_dialogs(dialog_logs)

    print(f"评估完成，平均得分: {evaluation_results['avg_score']}")
    save_evaluation_results(evaluation_results)
```

---

## 10. 后续任务

### 10.1 实现计划

详见实现计划文档（待编写）：`docs/superpowers/plans/phase2-5/2026-04-30-npc-ai-acceptance-testing-plan.md`

### 10.2 待实现模块

| 模块 | 优先级 | 说明 |
|-----|-------|------|
| DialogLogger | P0 | 后端对话日志记录 |
| EventBus/GameLogger扩展 | P0 | 前端触发事件日志 |
| E2E 测试扩展 | P1 | 新增教学质量测试场景 |
| dialog_evaluator.py | P1 | LLM 评估实现 |
| run_all.py | P1 | 全流程编排脚本 |

---

*设计文档由 Claude Code 生成，日期：2026-04-30*